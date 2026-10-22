'use strict';
/**
 * Shared helpers for the Windows packaged smokes.
 *
 * Both the installer and reinstall smokes install into a disposable temporary
 * directory and then have to prove that the uninstaller removed it. Windows
 * holds two traps for that proof:
 *
 *   1. Chromium child processes (GPU, renderer, utility) share the application
 *      executable and can outlive the main process. An NSIS uninstaller cannot
 *      delete a file that is still mapped, so it silently leaves files behind.
 *   2. A directory that is being deleted can reject an access check with EPERM
 *      or EBUSY even though it is not gone. Treating every error as "removed"
 *      turns a locked file into a false pass.
 *
 * These helpers make the proof honest: wait for the disposable instance to
 * finish exiting, terminate any stragglers, and only report removed when the
 * path is really absent.
 */

const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** True only when the path really is gone; a permission error is not absence. */
async function isAbsent(target) {
  try {
    await fs.access(target);
    return false;
  } catch (error) {
    return error.code === 'ENOENT' || error.code === 'ENOTDIR';
  }
}

async function removeWhenUnlocked(target, attempts = 20) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await fs.rm(target, { recursive: true, force: true });
      return { removed: await isAbsent(target), error: null };
    } catch (error) {
      lastError = error;
      if (error.code === 'ENOENT') return { removed: true, error: null };
      await sleep(500);
    }
  }
  return { removed: await isAbsent(target), error: lastError };
}

/** Every process whose executable lives inside the disposable install directory. */
async function installedProcessIds(installDirectory) {
  const quoted = `'${installDirectory.replace(/'/g, "''")}'`;
  const script = `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith(${quoted}, [System.StringComparison]::OrdinalIgnoreCase) } | ForEach-Object { $_.ProcessId }`;
  const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, timeout: 30000 });
  return String(stdout || '')
    .split(/\r?\n/)
    .map(value => Number(value.trim()))
    .filter(value => Number.isInteger(value) && value > 0);
}

/**
 * Wait for the disposable instance's processes to exit, then terminate any that
 * remain. This is a temporary install owned by the smoke, so terminating it is
 * safe; leaving it alive would only make the uninstall proof false.
 */
async function waitForInstalledProcesses(installDirectory, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  let ids = await installedProcessIds(installDirectory);
  while (ids.length && Date.now() < deadline) {
    await sleep(1000);
    ids = await installedProcessIds(installDirectory);
  }
  if (!ids.length) return { exited: true, terminated: [] };
  for (const id of ids) {
    try { process.kill(id, 'SIGKILL'); } catch {}
  }
  await sleep(1500);
  const remaining = await installedProcessIds(installDirectory);
  return { exited: remaining.length === 0, terminated: ids };
}

/**
 * Run the NSIS uninstaller and prove the directory is gone afterwards.
 * `run` is the caller's process runner: (file, args) => Promise<exitCode>.
 */
async function uninstallApplication(installDirectory, run) {
  const processes = await waitForInstalledProcesses(installDirectory);
  if (!processes.exited) throw new Error('The disposable installed application still had running child processes, so the uninstall could not be proven.');
  const uninstallers = (await fs.readdir(installDirectory)).filter(name => /^Uninstall .*\.exe$/i.test(name));
  if (uninstallers.length !== 1) throw new Error('Expected exactly one NSIS uninstaller.');
  const exit = await run(path.join(installDirectory, uninstallers[0]), ['/S']);
  if (exit !== 0) throw new Error(`NSIS uninstaller exited with code ${exit}.`);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await isAbsent(installDirectory)) return { exit, removed: true, reapedProcesses: processes.terminated.length };
    await sleep(500);
  }
  const remaining = await fs.readdir(installDirectory).catch(() => []);
  throw new Error(`Install directory was not removed by the uninstaller. Remaining entries: ${remaining.join(', ') || 'unknown'}.`);
}

module.exports = { sleep, isAbsent, removeWhenUnlocked, installedProcessIds, waitForInstalledProcesses, uninstallApplication };
