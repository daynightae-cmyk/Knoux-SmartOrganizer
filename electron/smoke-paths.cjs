'use strict';
/**
 * Where a smoke run is allowed to write.
 *
 * A command line can ask the application to write a file, so the write is
 * confined to a temporary root. The set of roots has to cover every location
 * Windows actually uses for temporary work, because the CI runner keeps
 * RUNNER_TEMP on a different volume from the user's TEMP directory. Confining
 * the write to `os.tmpdir()` alone made the packaged application refuse its
 * own smoke paths on the CI runner and exit with code 1.
 *
 * The path rules are the DECLARED platform's rules, not the host's. The
 * application runs on Windows, so a smoke path is a Windows path; resolving it
 * with the host rules made a `C:\...` target resolve against the host working
 * directory, which broke the very check that is supposed to protect the user.
 */

const path = require('node:path');
const os = require('node:os');

/** The path implementation that matches the declared platform. */
function pathApi(platform) {
  return platform === 'win32' ? path.win32 : path.posix;
}

/** Every temporary root this machine offers. */
function temporaryRoots(environment = process.env, platform = process.platform) {
  const api = pathApi(platform);
  const roots = new Set();
  const add = (value) => {
    if (typeof value !== 'string' || !value.trim()) return;
    try { roots.add(api.resolve(value.trim())); } catch { /* an unusable value is simply not a root */ }
  };
  // The host's own temporary directory is a root only when the declared
  // platform is the host platform. Otherwise it names a location that does
  // not exist on the machine the paths are being checked against.
  if (platform === process.platform) { try { add(os.tmpdir()); } catch { /* ignore */ } }
  add(environment.TEMP);
  add(environment.TMP);
  add(environment.RUNNER_TEMP);
  if (environment.LOCALAPPDATA) add(path.win32.join(environment.LOCALAPPDATA, 'Temp'));
  if (environment.SystemRoot) add(path.win32.join(environment.SystemRoot, 'Temp'));
  if (platform === 'win32' && environment.WINDIR) add(path.win32.join(environment.WINDIR, 'Temp'));
  return [...roots];
}

/**
 * Resolves a smoke target and refuses anything outside a temporary root.
 * @returns {string} the resolved absolute path
 */
function requireTemporaryPath(target, label, environment = process.env, platform = process.platform) {
  const api = pathApi(platform);
  const resolved = api.resolve(String(target || ''));
  const roots = temporaryRoots(environment, platform);
  const allowed = roots.some(root => resolved === root || resolved.startsWith(root.endsWith(api.sep) ? root : root + api.sep));
  if (!allowed) throw new Error(`${label} must be inside a temporary directory.`);
  return resolved;
}

module.exports = { pathApi, temporaryRoots, requireTemporaryPath };
