const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const OPERATION_SPECS = Object.freeze({
  dismCheckHealth: { executable: 'dism.exe', args: ['/Online', '/Cleanup-Image', '/CheckHealth'], restartRequired: false, duration: '2–5 minutes', effect: 'Checks whether the Windows component store is marked as corrupted.', doesNot: 'It does not repair files or remove user data.' },
  dismScanHealth: { executable: 'dism.exe', args: ['/Online', '/Cleanup-Image', '/ScanHealth'], restartRequired: false, duration: '5–20 minutes', effect: 'Performs a deeper component-store corruption scan.', doesNot: 'It does not repair detected corruption.' },
  dismRestoreHealth: { executable: 'dism.exe', args: ['/Online', '/Cleanup-Image', '/RestoreHealth'], restartRequired: true, duration: '10–45 minutes', effect: 'Repairs the Windows component store using configured Windows repair sources.', doesNot: 'It does not reinstall Windows or delete personal files.' },
  sfcVerifyOnly: { executable: 'sfc.exe', args: ['/VerifyOnly'], restartRequired: false, duration: '5–20 minutes', effect: 'Verifies protected Windows system files.', doesNot: 'It does not change files.' },
  sfcScanNow: { executable: 'sfc.exe', args: ['/ScanNow'], restartRequired: true, duration: '10–45 minutes', effect: 'Scans and repairs protected Windows system files when possible.', doesNot: 'It does not reset applications or delete personal files.' },
  flushDns: { executable: 'ipconfig.exe', args: ['/flushdns'], restartRequired: false, duration: 'Under a minute', effect: 'Clears the local DNS resolver cache.', doesNot: 'It does not change DNS servers or network passwords.' },
  winsockReset: { executable: 'netsh.exe', args: ['winsock', 'reset'], restartRequired: true, duration: 'Under a minute', effect: 'Resets the Windows Winsock catalog.', doesNot: 'It does not configure Wi-Fi credentials or router settings.' },
  tcpIpReset: { executable: 'netsh.exe', args: ['int', 'ip', 'reset'], restartRequired: true, duration: 'Under a minute', effect: 'Resets TCP/IP configuration components to Windows defaults.', doesNot: 'It does not reset the router or restore custom static addressing.' }
});

function resolveExecutable(spec, windowsDirectory = process.env.WINDIR || 'C:\\Windows') { return path.join(windowsDirectory, 'System32', spec.executable); }
function quotePowerShell(value) { return `'${String(value).replace(/'/g, "''")}'`; }
async function defaultElevatedExecutor({ executable, args }) {
  const argumentList = `@(${args.map(quotePowerShell).join(',')})`;
  const script = `$ErrorActionPreference='Stop'; $p=Start-Process -FilePath ${quotePowerShell(executable)} -ArgumentList ${argumentList} -Verb RunAs -Wait -PassThru; [pscustomobject]@{exitCode=$p.ExitCode} | ConvertTo-Json -Compress`;
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  const { stdout, stderr } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { windowsHide: true, timeout: 60 * 60 * 1000, maxBuffer: 1024 * 1024 });
  const parsed = JSON.parse(stdout.trim() || '{}');
  return { exitCode: Number(parsed.exitCode), stderr: stderr.trim() };
}

function createPrivilegedRunner({ platform = process.platform, windowsDirectory = process.env.WINDIR || 'C:\\Windows', elevatedExecutor = defaultElevatedExecutor } = {}) {
  async function probe(engine) {
    const spec = OPERATION_SPECS[engine];
    if (!spec) return { available: false, reason: 'Unknown privileged operation.', capability: 'windows-elevation' };
    if (platform !== 'win32') return { available: false, reason: 'Windows is required.', capability: 'windows-elevation' };
    const executable = resolveExecutable(spec, windowsDirectory);
    return fs.existsSync(executable)
      ? { available: true, capability: 'windows-elevation', executable }
      : { available: false, reason: `${spec.executable} is unavailable.`, capability: 'windows-elevation' };
  }
  async function run(engine, { dryRun = false } = {}) {
    const spec = OPERATION_SPECS[engine];
    if (!spec) throw new Error('Privileged operation is not allowlisted.');
    const capability = await probe(engine);
    if (!capability.available) throw new Error(capability.reason);
    const technical = { operation: engine, executable: spec.executable, arguments: [...spec.args] };
    if (dryRun) return { summary: { dryRun: true, adminRequired: true, restartRequired: spec.restartRequired, expectedDuration: spec.duration, effect: spec.effect, doesNot: spec.doesNot }, items: [technical], restartRequired: spec.restartRequired };
    const result = await elevatedExecutor({ executable: capability.executable, args: [...spec.args] });
    return { summary: { dryRun: false, exitCode: result.exitCode, adminRequired: true, restartRequired: spec.restartRequired, expectedDuration: spec.duration, effect: spec.effect, doesNot: spec.doesNot }, items: [{ ...technical, exitCode: result.exitCode }], warnings: result.stderr ? [result.stderr] : [], restartRequired: spec.restartRequired };
  }
  return { probe, run };
}

module.exports = { OPERATION_SPECS, createPrivilegedRunner, resolveExecutable };
