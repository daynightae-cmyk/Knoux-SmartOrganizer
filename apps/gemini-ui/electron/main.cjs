'use strict';

/**
 * KNOuX Gemini — minimal, secure Windows desktop shell.
 *
 * This entrypoint is deliberately separate from the repository root Electron
 * entrypoint: it loads the Gemini renderer (never the legacy root renderer) and
 * exposes only the versioned, read-only platform capabilities. Section engines
 * remain preview-only until their own missions land.
 */

const { app, BrowserWindow, Menu, ipcMain, session } = require('electron');
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
        return {
          href: location.href,
          readyState: document.readyState,
          rootChildren: document.querySelector('#root')?.childElementCount || 0,
          bridgePresent: Boolean(api),
          contractVersion: api?.contractVersion ?? null,
          nodeRequireType: typeof window.require,
          nodeProcessType: typeof window.process,
          status,
          system,
          services,
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
    const screenshotOk = !smokeShotPath || (
      receipt.screenshotBytes > 20000 &&
      receipt.lightScreenshotBytes > 20000 &&
      receipt.arabicScreenshotBytes > 20000
    );
    receipt.checks = { securityOk, bridgeOk, providerOk, screenshotOk, windowControlOk };
    receipt.ok = Boolean(securityOk && bridgeOk && providerOk && screenshotOk && windowControlOk);
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

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  if (isDev) {
    console.info('[gemini-shell] development mode; CSP headers are enforced in packaged builds.');
  } else {
    applyPackagedCsp(session.defaultSession);
  }
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
