'use strict';

/**
 * KNOuX Gemini — minimal, secure Windows desktop shell.
 *
 * This entrypoint is deliberately separate from the repository root Electron
 * entrypoint: it loads the Gemini renderer (never the legacy root renderer) and
 * exposes only the versioned, read-only platform capabilities. Section engines
 * remain preview-only until their own missions land.
 */

const { app, BrowserWindow, Menu, ipcMain, session, dialog, nativeImage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const crypto = require('node:crypto');
const contract = require('../shared/native-contract.json');
const appPackage = require('../package.json');
const {
  readSystemSummary,
  readServicesSummary,
  chooseFolder,
  fixturesEnabled,
} = require('./native/provider-bridge.cjs');
const { StudioBridge } = require('./native/studio-bridge.cjs');
const {
  ok,
  fail,
  assertTrustedSender,
  assertNoArguments,
  assertWindowAction,
  hardenWebContents,
  applyPackagedCsp,
} = require('./native/security.cjs');

const argv = process.argv.slice(1);
const argValue = (name) => {
  const prefix = `${name}=`;
  const match = argv.find((entry) => entry.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
};

const isDev = argv.includes('--dev') || process.env.KNOUX_GEMINI_DEV === '1';
const devOrigin = process.env.KNOUX_GEMINI_DEV_URL || 'http://127.0.0.1:3000';
const distRoot = path.join(__dirname, '..', 'dist');
const preloadPath = path.join(__dirname, 'preload.cjs');
const smokeReceiptPath = argValue('--knoux-native-smoke');
const smokeShotPath = argValue('--knoux-native-smoke-shot');
const smokeUserData = argValue('--knoux-user-data');
const isSmoke = Boolean(smokeReceiptPath);
const tracePath = smokeReceiptPath ? `${smokeReceiptPath}.trace.log` : null;

function trace(message) {
  if (!tracePath) return;
  try {
    fs.mkdirSync(path.dirname(tracePath), { recursive: true });
    fs.appendFileSync(tracePath, `${new Date().toISOString()} ${message}\n`, 'utf8');
  } catch {
    // Trace failures must never affect the app.
  }
}

if (smokeUserData) {
  try {
    fs.mkdirSync(smokeUserData, { recursive: true });
    app.setPath('userData', smokeUserData);
    trace(`userData set to ${smokeUserData}`);
  } catch (error) {
    trace(`userData setup failed: ${error?.message || error}`);
    // A temp profile failure is reported by the smoke receipt rather than
    // silently falling back to a real user profile.
  }
}
trace(`bootstrap isSmoke=${isSmoke} isDev=${isDev} packaged=${app.isPackaged} cwd=${process.cwd()}`);

app.commandLine.appendSwitch('force-color-profile', 'srgb');

let mainWindow = null;
let ipcRegistered = false;
let studioBridge = null;

if (!isSmoke && !app.requestSingleInstanceLock()) {
  app.quit();
} else if (!isSmoke) {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function bridgeStatusData() {
  const packagedFixtureBlocked = app.isPackaged && process.env.KNOUX_NATIVE_FIXTURES === '1';
  const fixture = fixturesEnabled({ isPackaged: app.isPackaged, env: process.env });
  const windows = process.platform === 'win32';
  const capabilities = Object.values(contract.capabilities).map((capability) => ({
    ...capability,
    status: capability.id === 'folder.choose' ? 'available' : windows ? 'available' : 'unsupported',
    ...(fixture ? { detail: 'Development fixture mode — no measured reading' } : {}),
  }));
  return {
    contractVersion: contract.contractVersion,
    requestId: crypto.randomUUID(),
    capability: 'bridge.status',
    status: 'available',
    source: 'KNOuX Gemini Electron main',
    observedAt: new Date().toISOString(),
    permission: 'read-only',
    warnings: [
      ...(fixture ? ['Development fixture mode is active. Values are not measured.'] : []),
      ...(packagedFixtureBlocked ? ['KNOUX_NATIVE_FIXTURES was ignored in the packaged application.'] : []),
      ...(!windows ? ['This platform is not Windows; Windows CIM capabilities are unsupported.'] : []),
    ],
    provenance: {
      provider: 'Electron main process',
      mode: fixture ? 'fixture' : windows ? 'measured' : 'unavailable',
      observedAt: new Date().toISOString(),
      coverage: 'full',
      permissions: ['read-only'],
      warnings: [],
    },
    data: {
      bridge: 'ready',
      platform: process.platform,
      appVersion: appPackage.version,
      packaged: app.isPackaged,
      providerMode: fixture ? 'fixture' : windows ? 'measured' : 'unavailable',
      fixtureEnabled: fixture,
      capabilities,
      contractVersion: contract.contractVersion,
      electronVersion: process.versions.electron,
    },
  };
}

function convertProviderResult(capability, result) {
  if (result?.error && !result?.data) {
    return fail({
      capability,
      status: result.status || 'failed',
      source: result.source,
      observedAt: result.observedAt,
      permission: result.permission,
      warnings: result.warnings,
      error: result.error,
    });
  }
  return ok({
    capability,
    status: result?.status || 'complete',
    source: result?.source,
    observedAt: result?.observedAt,
    permission: result?.permission,
    warnings: result?.warnings,
    provenance: result?.provenance,
    data: result?.data,
  });
}

function registerIpc() {
  if (ipcRegistered) return;
  ipcRegistered = true;

  const guard = async (event, capability, args, work) => {
    try {
      assertTrustedSender(event, {
        mainWindow,
        isDev,
        distRoot,
        devOrigin,
      });
      return await work(args);
    } catch (error) {
      const permission = error?.code === 'UNTRUSTED_SENDER' ? 'not-granted' : 'read-only';
      const status = error?.code === 'UNTRUSTED_SENDER' ? 'permission_denied' : 'failed';
      return fail({
        capability,
        status,
        source: 'native bridge',
        permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'NATIVE_ERROR',
          message:
            error?.code === 'UNTRUSTED_SENDER'
              ? 'The native request did not originate from the trusted application window.'
              : 'The native request was rejected at the security boundary.',
          retryable: false,
        },
      });
    }
  };

  ipcMain.handle(contract.channels.status, (event, ...args) =>
    guard(event, 'bridge.status', args, async (callArgs) => {
      assertNoArguments(callArgs, 'bridge.status');
      return bridgeStatusData();
    })
  );

  ipcMain.handle(contract.channels.systemSummary, (event, ...args) =>
    guard(event, 'system.summary', args, async (callArgs) => {
      assertNoArguments(callArgs, 'system.summary');
      const result = await readSystemSummary({ isPackaged: app.isPackaged, env: process.env });
      return convertProviderResult('system.summary', result);
    })
  );

  ipcMain.handle(contract.channels.servicesSummary, (event, ...args) =>
    guard(event, 'services.summary', args, async (callArgs) => {
      assertNoArguments(callArgs, 'services.summary');
      const result = await readServicesSummary({ isPackaged: app.isPackaged, env: process.env });
      return convertProviderResult('services.summary', result);
    })
  );

  ipcMain.handle(contract.channels.chooseFolder, (event, ...args) =>
    guard(event, 'folder.choose', args, async (callArgs) => {
      assertNoArguments(callArgs, 'folder.choose');
      const result = await chooseFolder({
        isPackaged: app.isPackaged,
        env: process.env,
        parentWindow: mainWindow,
      });
      return convertProviderResult('folder.choose', result);
    })
  );

  const studioGuard = async (event, capability, permission, work) => {
    try {
      assertTrustedSender(event, { mainWindow, isDev, distRoot, devOrigin });
      if (!studioBridge) {
        throw Object.assign(new Error('The read-only Studio adapter is not initialized.'), { code: 'STUDIO_UNAVAILABLE' });
      }
      const data = await work();
      return ok({
        capability,
        status: 'complete',
        source: 'KNOuX Studio read-only adapter',
        permission,
        data,
      });
    } catch (error) {
      const untrusted = error?.code === 'UNTRUSTED_SENDER';
      return fail({
        capability,
        status: untrusted ? 'permission_denied' : error?.code === 'STUDIO_DESTINATION_REQUIRED' ? 'permission_denied' : 'failed',
        source: 'KNOuX Studio read-only adapter',
        permission: untrusted ? 'not-granted' : permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'STUDIO_FAILURE',
          message: String(error?.message || 'Studio request failed.').replace(/\s+/g, ' ').slice(0, 300),
          retryable: false,
        },
      });
    }
  };
  const studioArg = (args) => {
    if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
      throw Object.assign(new Error('A single structured Studio request is required.'), { code: 'STUDIO_INPUT_INVALID' });
    }
    return args[0];
  };

  ipcMain.handle(contract.channels.studioSources, (event) =>
    studioGuard(event, 'studio.sources', 'read-only', () => studioBridge.listSources())
  );
  ipcMain.handle(contract.channels.studioSourceChoose, (event) =>
    studioGuard(event, 'studio.source.choose', 'user-initiated', () => studioBridge.chooseSource())
  );
  ipcMain.handle(contract.channels.studioSourceRemove, (event, ...args) =>
    studioGuard(event, 'studio.source.remove', 'user-initiated', () => studioBridge.removeSource(studioArg(args).sourceId))
  );
  ipcMain.handle(contract.channels.studioInventoryScan, (event, ...args) =>
    studioGuard(event, 'studio.inventory.scan', 'read-only', () => studioBridge.scanSource(studioArg(args).sourceId))
  );
  ipcMain.handle(contract.channels.studioInventoryCancel, (event, ...args) =>
    studioGuard(event, 'studio.inventory.cancel', 'user-initiated', () => studioBridge.cancelScan(studioArg(args).sourceId))
  );
  ipcMain.handle(contract.channels.studioInventoryQuery, (event, ...args) =>
    studioGuard(event, 'studio.inventory.query', 'read-only', () => studioBridge.query(studioArg(args)))
  );
  ipcMain.handle(contract.channels.studioThumbnails, (event, ...args) => {
    const request = studioArg(args);
    return studioGuard(event, 'studio.thumbnails', 'read-only', () => studioBridge.thumbnails(request.sourceId, request.fileIds));
  });
  ipcMain.handle(contract.channels.studioDestinationChoose, (event) =>
    studioGuard(event, 'studio.destination.choose', 'user-initiated', () => studioBridge.chooseDestination())
  );
  ipcMain.handle(contract.channels.studioPlanPreview, (event, ...args) =>
    studioGuard(event, 'studio.plan.preview', 'read-only', () => studioBridge.previewPlan(studioArg(args)))
  );
  ipcMain.handle(contract.channels.studioPreviewHistory, (event) =>
    studioGuard(event, 'studio.preview.history', 'read-only', () => studioBridge.previewHistory())
  );

  ipcMain.handle(contract.channels.windowControl, (event, ...args) =>
    guard(event, 'window.control', args, async (callArgs) => {
      if (callArgs.length !== 1) {
        const error = new Error('A single window action is required.');
        error.code = 'INVALID_ARGUMENTS';
        throw error;
      }
      const action = assertWindowAction(callArgs[0]);
      if (!mainWindow || mainWindow.isDestroyed()) {
        const error = new Error('The application window is not available.');
        error.code = 'WINDOW_UNAVAILABLE';
        throw error;
      }
      if (action === 'minimize') mainWindow.minimize();
      if (action === 'maximize') {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        else mainWindow.maximize();
      }
      if (action === 'close') mainWindow.close();
      return ok({
        capability: 'window.control',
        status: 'complete',
        source: 'Electron BrowserWindow',
        permission: 'user-initiated',
        data: { action },
      });
    })
  );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1672,
    height: 941,
    minWidth: 1200,
    minHeight: 700,
    frame: false,
    show: false,
    backgroundColor: '#040a16',
    title: 'KNOuX SmartOrganizer',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      spellcheck: false,
      backgroundThrottling: false,
      paintWhenInitiallyHidden: true,
    },
  });

  hardenWebContents(mainWindow.webContents, { isDev, devOrigin });

  mainWindow.once('ready-to-show', () => {
    trace('ready-to-show');
    if (!isSmoke) mainWindow.show();
  });

  mainWindow.webContents.once('did-finish-load', () => {
    trace('did-finish-load');
    if (isSmoke) {
      void runSmoke(mainWindow);
    } else if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    trace(`did-fail-load ${errorCode} ${errorDescription}`);
    // No native PowerShell window, and no retry loop. Development users get the
    // exact reason in the terminal; packaged users see Chromium's failure page.
    console.error(`[gemini-shell] renderer load failed (${errorCode}): ${errorDescription}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) {
    trace(`loading dev URL ${devOrigin}`);
    void mainWindow.loadURL(devOrigin);
  } else {
    const indexPath = path.join(distRoot, 'index.html');
    trace(`loading file ${indexPath}`);
    void mainWindow.loadFile(indexPath);
  }
}

function redactError(error) {
  return {
    code: typeof error?.code === 'string' ? error.code : 'SMOKE_FAILED',
    message: typeof error?.message === 'string' ? error.message.slice(0, 300) : 'Native smoke failed.',
  };
}

async function runSmoke(win) {
  const startedAt = new Date().toISOString();
  const receipt = {
    schema: 'knoux.gemini.native-smoke.v1',
    startedAt,
    packaged: app.isPackaged,
    appVersion: appPackage.version,
    electronVersion: process.versions.electron,
    platform: process.platform,
    security: null,
    renderer: null,
    screenshot: smokeShotPath || null,
    ok: false,
  };
  try {
    trace('smoke start');
    await sleep(1200);
    const prefs = win.webContents.getLastWebPreferences() || {};
    receipt.security = {
      // Electron does not expose the preload path through getLastWebPreferences;
      // bridgePresent below proves the preload module actually executed.
      preloadExposedBridge: null,
      contextIsolation: Boolean(prefs.contextIsolation),
      sandbox: Boolean(prefs.sandbox),
      nodeIntegration: Boolean(prefs.nodeIntegration),
      webSecurity: prefs.webSecurity !== false,
      webviewTag: Boolean(prefs.webviewTag),
    };

    trace('executing renderer bridge probe');
    const rendererProbe = win.webContents.executeJavaScript(
      `(async () => {
        const api = window.knouxShell;
        const status = api ? await api.getStatus() : null;
        const system = api ? await api.getSystemSummary() : null;
        const services = api ? await api.getServicesSummary() : null;
        const studioApi = window.knouxStudioV1;
        let studio = null;
        if (studioApi) {
          const sources = await studioApi.listSources();
          const sourceId = sources?.data?.[0]?.id || null;
          const query = sourceId ? await studioApi.query({ sourceId, limit: 20 }) : null;
          const previewIds = (query?.data?.rows || []).filter((row) => row.hasThumbnail).slice(0, 4).map((row) => row.id);
          const thumbs = sourceId && previewIds.length ? await studioApi.thumbnails(sourceId, previewIds) : null;
          const plan = sourceId ? await studioApi.previewPlan({ sourceId, all: true, operation: 'virtual', structure: 'categorized', collisionPolicy: 'review' }) : null;
          const history = await studioApi.previewHistory();
          studio = { bridgePresent: true, sources, query, thumbs, plan, history };
        }
        return {
          href: location.href,
          readyState: document.readyState,
          rootChildren: document.querySelector('#root')?.childElementCount || 0,
          bridgePresent: Boolean(api),
          studioBridgePresent: Boolean(studioApi),
          contractVersion: api?.contractVersion ?? null,
          nodeRequireType: typeof window.require,
          nodeProcessType: typeof window.process,
          status,
          system,
          services,
          studio,
          cspMeta: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') || null
        };
      })()`,
      true
    );
    const renderer = await Promise.race([
      rendererProbe,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Renderer bridge probe timed out after 90 seconds.')), 90000)),
    ]);
    trace(`renderer probe complete bridge=${Boolean(renderer?.bridgePresent)} system=${renderer?.system?.status} services=${renderer?.services?.status}`);
    receipt.renderer = renderer;
    receipt.security.preloadExposedBridge = renderer.bridgePresent === true;

    if (smokeShotPath) {
      try {
        await win.webContents.executeJavaScript(
          `(() => {
             const button = document.querySelector('[data-testid="native-bridge-status"]');
             if (button) button.click();
             return Boolean(button);
           })()`,
          true
        );
        // Give the visible read-only panel time to render the measured values
        // (the panel performs its own IPC read; this is intentionally not a
        // duplicate HTML injection).
        const deadline = Date.now() + 25000;
        while (Date.now() < deadline) {
          await sleep(500);
          const ready = await win.webContents.executeJavaScript(
            `(() => {
               const panel = document.querySelector('[data-testid="native-bridge-panel"]');
               if (!panel) return false;
               const text = panel.innerText || '';
               return text.includes('CPU load') && !text.includes('Calling the Windows provider');
             })()`,
            true
          );
          if (ready) break;
        }
        await sleep(500);
        win.showInactive();
        await sleep(500);
        const image = await win.webContents.capturePage();
        await fsp.mkdir(path.dirname(smokeShotPath), { recursive: true });
        await fsp.writeFile(smokeShotPath, image.toPNG());
        const stat = await fsp.stat(smokeShotPath);
        receipt.screenshotBytes = stat.size;

        // Prove the new native panel is not a dark-only island. The theme
        // toggle is the same real control used by the user.
        const lightShotPath = smokeShotPath.replace(/\.png$/i, '-light.png');
        await win.webContents.executeJavaScript(
          `document.querySelector('button[aria-label="Switch to light theme"]')?.click()`,
          true
        );
        await sleep(800);
        const lightImage = await win.webContents.capturePage();
        await fsp.writeFile(lightShotPath, lightImage.toPNG());
        receipt.lightScreenshot = lightShotPath;
        receipt.lightScreenshotBytes = (await fsp.stat(lightShotPath)).size;

        // Arabic RTL proof for the same overlay.
        const arShotPath = smokeShotPath.replace(/\.png$/i, '-ar-light.png');
        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        const arDeadline = Date.now() + 25000;
        while (Date.now() < arDeadline) {
          await sleep(500);
          const ready = await win.webContents.executeJavaScript(
            `(() => {
               const panel = document.querySelector('[data-testid="native-bridge-panel"]');
               if (!panel) return false;
               const text = panel.innerText || '';
               return /حمل المعالج|CPU load/.test(text) && !/جارٍ استدعاء|Calling the Windows provider/.test(text);
             })()`,
            true
          );
          if (ready) break;
        }
        const arImage = await win.webContents.capturePage();
        await fsp.writeFile(arShotPath, arImage.toPNG());
        receipt.arabicScreenshot = arShotPath;
        receipt.arabicScreenshotBytes = (await fsp.stat(arShotPath)).size;

        // Real measured Studio evidence: the controlled smoke source was
        // indexed before this window loaded. Navigate to the Studio route,
        // wait for the measured banner, then capture the library.
        await win.webContents.executeJavaScript(
          `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'studio'; return true; })()`,
          true
        );
        const studioDeadline = Date.now() + 15000;
        let studioReady = false;
        while (Date.now() < studioDeadline) {
          await sleep(500);
          studioReady = await win.webContents.executeJavaScript(
            `(() => {
               const panel = document.querySelector('[data-testid="studio-native-banner"]');
               const text = document.body.innerText || '';
               return Boolean(panel) && (text.includes('Native measured index') || text.includes('فهرس أصلي مقيس'));
             })()`,
            true
          );
          if (studioReady) break;
        }
        await sleep(1200);
        const studioShotPath = smokeShotPath.replace(/native-bridge/i, 'studio-measured');
        const studioImage = await win.webContents.capturePage();
        await fsp.writeFile(studioShotPath, studioImage.toPNG());
        receipt.studioScreenshot = studioShotPath;
        receipt.studioScreenshotBytes = (await fsp.stat(studioShotPath)).size;
        receipt.studioUiReady = studioReady;

        // Stage 6 proves the measured plan reaches the rendered review surface,
        // not just the IPC probe, and that execution remains explicitly blocked.
        await win.webContents.executeJavaScript(
          `(() => {
             const stage = document.querySelector('button[title="Stage 6: Plan Review"]');
             if (stage) stage.click();
             return Boolean(stage);
           })()`,
          true
        );
        const planDeadline = Date.now() + 20000;
        let studioPlanReady = false;
        while (Date.now() < planDeadline) {
          await sleep(500);
          studioPlanReady = await win.webContents.executeJavaScript(
            `(() => {
               const text = document.body.innerText || '';
               return text.includes('MEASURED PREVIEW') &&
                 text.includes('Planned target') &&
                 text.includes('Execution is blocked');
             })()`,
            true
          );
          if (studioPlanReady) break;
        }
        await sleep(800);
        const planShotPath = smokeShotPath.replace(/native-bridge/i, 'studio-plan');
        const planImage = await win.webContents.capturePage();
        await fsp.writeFile(planShotPath, planImage.toPNG());
        receipt.studioPlanScreenshot = planShotPath;
        receipt.studioPlanScreenshotBytes = (await fsp.stat(planShotPath)).size;
        receipt.studioPlanUiReady = studioPlanReady;

        // Stage 8 must show persisted preview receipts, not a fixture journal.
        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Stage 8: History & Undo"]')?.click()`,
          true
        );
        const historyDeadline = Date.now() + 12000;
        let studioHistoryReady = false;
        while (Date.now() < historyDeadline) {
          await sleep(400);
          studioHistoryReady = await win.webContents.executeJavaScript(
            `(() => {
               const text = document.body.innerText || '';
               return text.includes('PREVIEW RECEIPTS') && text.includes('No undo') &&
                 !text.includes('Fixture journal only');
             })()`,
            true
          );
          if (studioHistoryReady) break;
        }
        await sleep(700);
        const historyShotPath = smokeShotPath.replace(/native-bridge/i, 'studio-history');
        const historyImage = await win.webContents.capturePage();
        await fsp.writeFile(historyShotPath, historyImage.toPNG());
        receipt.studioHistoryScreenshot = historyShotPath;
        receipt.studioHistoryScreenshotBytes = (await fsp.stat(historyShotPath)).size;
        receipt.studioHistoryUiReady = studioHistoryReady;
      } catch (error) {
        receipt.screenshotError = redactError(error);
      }
    }

    let windowControlOk = false;
    try {
      await win.webContents.executeJavaScript(`window.knouxShell.windowControl('maximize')`, true);
      await sleep(500);
      const maximized = win.isMaximized();
      await win.webContents.executeJavaScript(`window.knouxShell.windowControl('maximize')`, true);
      await sleep(300);
      windowControlOk = maximized && !win.isMaximized();
      trace(`window control maximize toggle=${windowControlOk}`);
    } catch (error) {
      trace(`window control test failed: ${error?.message || error}`);
    }
    const securityOk =
      receipt.security.preloadExposedBridge === true &&
      receipt.security.contextIsolation === true &&
      receipt.security.sandbox === true &&
      receipt.security.nodeIntegration === false &&
      receipt.security.webSecurity === true &&
      receipt.security.webviewTag === false;
    const bridgeOk =
      renderer.bridgePresent === true &&
      renderer.contractVersion === contract.contractVersion &&
      renderer.nodeRequireType === 'undefined' &&
      renderer.nodeProcessType === 'undefined';
    const providerOk =
      ['complete', 'partial'].includes(renderer.system?.status) &&
      renderer.system?.source &&
      renderer.system?.provenance?.mode === 'measured' &&
      ['complete', 'partial'].includes(renderer.services?.status) &&
      Number.isFinite(renderer.services?.data?.total);
    const studioData = renderer.studio;
    const studioOk = Boolean(
      studioData?.bridgePresent &&
      studioData?.sources?.data?.length >= 1 &&
      studioData.sources.data[0].fileCount >= 4 &&
      studioData?.query?.status === 'complete' &&
      studioData.query.data?.total >= 4 &&
      studioData?.plan?.status === 'complete' &&
      studioData.plan.data?.previewOnly === true &&
      studioData.plan.data?.execution === 'blocked_explicit_approval_required' &&
      studioData.plan.data?.totals?.files >= 4 &&
      Array.isArray(studioData?.history?.data) &&
      studioData.history.data.length >= 1
    );
    const screenshotOk = !smokeShotPath || (
      receipt.screenshotBytes > 20000 &&
      receipt.lightScreenshotBytes > 20000 &&
      receipt.arabicScreenshotBytes > 20000 &&
      receipt.studioScreenshotBytes > 20000 &&
      receipt.studioUiReady === true &&
      receipt.studioPlanScreenshotBytes > 20000 &&
      receipt.studioPlanUiReady === true &&
      receipt.studioHistoryScreenshotBytes > 20000 &&
      receipt.studioHistoryUiReady === true
    );
    receipt.checks = { securityOk, bridgeOk, providerOk, studioOk, screenshotOk, windowControlOk };
    receipt.ok = Boolean(securityOk && bridgeOk && providerOk && studioOk && screenshotOk && windowControlOk);
    receipt.finishedAt = new Date().toISOString();
    trace(`smoke complete ok=${receipt.ok} checks=${JSON.stringify(receipt.checks)}`);
    await fsp.mkdir(path.dirname(smokeReceiptPath), { recursive: true });
    await fsp.writeFile(smokeReceiptPath, JSON.stringify(receipt, null, 2), 'utf8');
    app.exit(receipt.ok ? 0 : 1);
  } catch (error) {
    receipt.error = redactError(error);
    receipt.finishedAt = new Date().toISOString();
    trace(`smoke failed ${receipt.error.code}: ${receipt.error.message}`);
    try {
      await fsp.mkdir(path.dirname(smokeReceiptPath), { recursive: true });
      await fsp.writeFile(smokeReceiptPath, JSON.stringify(receipt, null, 2), 'utf8');
    } catch {
      // Nothing else can be reported; the smoke runner will surface the exit code.
    }
    app.exit(1);
  }
}

app.whenReady().then(async () => {
  trace('whenReady entered');
  Menu.setApplicationMenu(null);
  trace('menu applied');
  if (isDev) {
    console.info('[gemini-shell] development mode; CSP headers are enforced in packaged builds.');
  } else {
    applyPackagedCsp(session.defaultSession);
  }

  trace('constructing studio bridge');
  studioBridge = new StudioBridge({
    userDataPath: app.getPath('userData'),
    nativeImage,
    isPackaged: app.isPackaged,
    env: process.env,
    chooseFolder: async ({ title, buttonLabel }) => {
      const result = await dialog.showOpenDialog(mainWindow || undefined, {
        title,
        buttonLabel,
        properties: ['openDirectory', 'dontAddToRecent'],
      });
      return result.canceled ? null : (result.filePaths?.[0] || null);
    },
    emit: (payload) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(contract.channels.studioEvent, payload);
      }
    },
  });
  try {
    await studioBridge.init();
    trace('studio bridge initialized');
    const smokeStudioRoot = argValue('--knoux-studio-smoke-root');
    if (smokeStudioRoot && isSmoke && smokeUserData) {
      await studioBridge.addSmokeSource(smokeStudioRoot);
      trace(`studio smoke source indexed: ${smokeStudioRoot}`);
    }
  } catch (error) {
    trace(`studio bridge init failed: ${error?.message || error}`);
    console.error('[gemini-shell] Studio bridge unavailable:', error?.message || error);
  }
  trace('registering ipc');
  registerIpc();
  trace('creating window');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  // A startup rejection before createWindow would otherwise leave a headless
  // Electron process running until the smoke runner times out.
  trace(`startup failed: ${error?.stack || error?.message || error}`);
  console.error('[gemini-shell] startup failed:', error);
  if (isSmoke) app.exit(1);
});

app.on('before-quit', () => {
  void studioBridge?.dispose();
});

app.on('window-all-closed', () => {
  app.quit();
});
