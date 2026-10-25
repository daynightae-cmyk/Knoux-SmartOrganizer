'use strict';

/**
 * Native boundary helpers.
 *
 * Every caller is validated against the one application window, a top-level
 * frame, and the exact loaded origin/path. Errors are converted into fixed,
 * redacted envelopes. No raw IPC handle or generic invoke endpoint is exposed.
 */

const crypto = require('node:crypto');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const contract = require('../../shared/native-contract.json');

const DEV_ORIGIN_DEFAULT = 'http://127.0.0.1:3000';
const ALLOWED_STATUS = new Set([
  'available',
  'unavailable',
  'unsupported',
  'permission_denied',
  'partial',
  'cancelled',
  'failed',
  'complete',
]);

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
].join('; ');

function newRequestId() {
  return crypto.randomUUID();
}

function requestIdFor(value) {
  return typeof value === 'string' && /^[a-f0-9-]{8,64}$/i.test(value) ? value : newRequestId();
}

function envelopeBase({ capability, status, source, observedAt, permission, warnings = [], provenance }) {
  return {
    contractVersion: contract.contractVersion,
    capability,
    requestId: newRequestId(),
    status: ALLOWED_STATUS.has(status) ? status : 'failed',
    source: String(source || 'unknown'),
    observedAt: observedAt || new Date().toISOString(),
    permission: permission || 'read-only',
    warnings: Array.isArray(warnings) ? warnings.map(String) : [],
    ...(provenance ? { provenance } : {}),
  };
}

function ok({ capability, status = 'complete', source, observedAt, permission, warnings, provenance, data }) {
  return { ...envelopeBase({ capability, status, source, observedAt, permission, warnings, provenance }), data };
}

function fail({ capability, status = 'failed', source = 'native bridge', observedAt, permission = 'read-only', warnings = [], error }) {
  return {
    ...envelopeBase({ capability, status, source, observedAt, permission, warnings }),
    error: {
      code: typeof error?.code === 'string' && /^[A-Z0-9_]{3,64}$/.test(error.code) ? error.code : 'NATIVE_ERROR',
      message: typeof error?.message === 'string' ? error.message.slice(0, 300) : 'The native request failed.',
      retryable: Boolean(error?.retryable),
    },
  };
}

function untrustedSender() {
  const error = new Error('The native request did not originate from the trusted application window.');
  error.code = 'UNTRUSTED_SENDER';
  error.retryable = false;
  return error;
}

function trustedFrameUrl(url, { isDev, distRoot, devOrigin = DEV_ORIGIN_DEFAULT }) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return Boolean(isDev && parsed.origin === devOrigin);
    }
    if (parsed.protocol !== 'file:') return false;
    const filePath = path.resolve(fileURLToPath(parsed));
    const root = path.resolve(distRoot);
    return filePath === root || filePath.startsWith(`${root}${path.sep}`);
  } catch {
    return false;
  }
}

function assertTrustedSender(event, context) {
  const { mainWindow, isDev, distRoot, devOrigin } = context;
  if (!mainWindow || mainWindow.isDestroyed()) throw untrustedSender();
  if (!event?.sender || event.sender !== mainWindow.webContents) throw untrustedSender();
  const senderFrame = event.senderFrame;
  if (!senderFrame || senderFrame !== event.sender.mainFrame) throw untrustedSender();
  if (!trustedFrameUrl(senderFrame.url, { isDev, distRoot, devOrigin })) {
    throw untrustedSender();
  }
}

function assertNoArguments(args, channel) {
  if (args.length !== 0) {
    const error = new Error(`The ${channel} capability does not accept arguments.`);
    error.code = 'INVALID_ARGUMENTS';
    error.retryable = false;
    throw error;
  }
}

function assertWindowAction(action) {
  if (!contract.windowActions.includes(action)) {
    const error = new Error('Unsupported window action.');
    error.code = 'INVALID_WINDOW_ACTION';
    error.retryable = false;
    throw error;
  }
  return action;
}

function hardenWebContents(contents, { isDev, devOrigin = DEV_ORIGIN_DEFAULT }) {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-attach-webview', (event) => event.preventDefault());
  contents.on('will-navigate', (event, url) => {
    try {
      const parsed = new URL(url);
      const allowed =
        (isDev && parsed.origin === devOrigin) ||
        (!isDev && parsed.protocol === 'file:' && parsed.pathname.endsWith('/dist/index.html'));
      if (!allowed) event.preventDefault();
    } catch {
      event.preventDefault();
    }
  });
  contents.on('will-download', (event) => {
    // The platform gate does not need downloads. Keep the renderer from writing
    // arbitrary files until a section defines an explicit export capability.
    event.preventDefault();
  });
  contents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'clipboard-sanitized-write');
  });
  contents.session.setPermissionCheckHandler((_wc, permission) => permission === 'clipboard-sanitized-write');
}

function applyPackagedCsp(session) {
  session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [CSP],
      },
    });
  });
}

module.exports = {
  CSP,
  DEV_ORIGIN_DEFAULT,
  newRequestId,
  requestIdFor,
  ok,
  fail,
  assertTrustedSender,
  assertNoArguments,
  assertWindowAction,
  trustedFrameUrl,
  hardenWebContents,
  applyPackagedCsp,
};
