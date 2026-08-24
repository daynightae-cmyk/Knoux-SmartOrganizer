const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

function freezeOperationSpec(spec) {
  return Object.freeze({
    executable: spec.executable,
    args: Object.freeze([...spec.args]),
    restartRequired: spec.restartRequired,
    duration: spec.duration,
    effect: spec.effect,
    doesNot: spec.doesNot
  });
}

const OPERATION_SPECS = Object.freeze(Object.fromEntries(Object.entries({
  dismCheckHealth: { executable: 'dism.exe', args: ['/Online', '/Cleanup-Image', '/CheckHealth'], restartRequired: false, duration: '2–5 minutes', effect: 'Checks whether the Windows component store is marked as corrupted.', doesNot: 'It does not repair files or remove user data.' },
  dismScanHealth: { executable: 'dism.exe', args: ['/Online', '/Cleanup-Image', '/ScanHealth'], restartRequired: false, duration: '5–20 minutes', effect: 'Performs a deeper component-store corruption scan.', doesNot: 'It does not repair detected corruption.' },
  dismRestoreHealth: { executable: 'dism.exe', args: ['/Online', '/Cleanup-Image', '/RestoreHealth'], restartRequired: true, duration: '10–45 minutes', effect: 'Repairs the Windows component store using configured Windows repair sources.', doesNot: 'It does not reinstall Windows or delete personal files.' },
  sfcVerifyOnly: { executable: 'sfc.exe', args: ['/VerifyOnly'], restartRequired: false, duration: '5–20 minutes', effect: 'Verifies protected Windows system files.', doesNot: 'It does not change files.' },
  sfcScanNow: { executable: 'sfc.exe', args: ['/ScanNow'], restartRequired: true, duration: '10–45 minutes', effect: 'Scans and repairs protected Windows system files when possible.', doesNot: 'It does not reset applications or delete personal files.' },
  flushDns: { executable: 'ipconfig.exe', args: ['/flushdns'], restartRequired: false, duration: 'Under a minute', effect: 'Clears the local DNS resolver cache.', doesNot: 'It does not change DNS servers or network passwords.' },
  winsockReset: { executable: 'netsh.exe', args: ['winsock', 'reset'], restartRequired: true, duration: 'Under a minute', effect: 'Resets the Windows Winsock catalog.', doesNot: 'It does not configure Wi-Fi credentials or router settings.' },
  tcpIpReset: { executable: 'netsh.exe', args: ['int', 'ip', 'reset'], restartRequired: true, duration: 'Under a minute', effect: 'Resets TCP/IP configuration components to Windows defaults.', doesNot: 'It does not reset the router or restore custom static addressing.' }
}).map(([engine, spec]) => [engine, freezeOperationSpec(spec)])));

const SERVICE_ACTIONS = Object.freeze({
  start: Object.freeze([Object.freeze(['start'])]),
  stop: Object.freeze([Object.freeze(['stop'])]),
  restart: Object.freeze([Object.freeze(['stop']), Object.freeze(['start'])]),
  automatic: Object.freeze([Object.freeze(['config', null, 'start=', 'auto'])]),
  delayedAutomatic: Object.freeze([Object.freeze(['config', null, 'start=', 'delayed-auto'])]),
  manual: Object.freeze([Object.freeze(['config', null, 'start=', 'demand'])]),
  disabled: Object.freeze([Object.freeze(['config', null, 'start=', 'disabled'])])
});
const PROTECTED_SERVICES = new Set(['RpcSs', 'DcomLaunch', 'PlugPlay', 'Power', 'WinDefend', 'EventLog', 'SamSs', 'LSM', 'Winmgmt', 'Schedule', 'CryptSvc', 'Dhcp', 'Dnscache', 'ProfSvc']);

function resolveExecutable(spec, windowsDirectory = process.env.WINDIR || 'C:\\Windows') {
  return path.join(windowsDirectory, 'System32', spec.executable);
}
function validateServiceName(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_.-]{1,256}$/.test(value)) throw new Error('Invalid Windows service name.');
  return value;
}
function quotePowerShell(value) { return `'${String(value).replace(/'/g, "''")}'`; }
function assertExactKeys(input, allowed, label) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error(`${label} input must be an object.`);
  for (const key of Object.keys(input)) if (!allowed.includes(key)) throw new Error(`${label} input contains an unsupported field.`);
}
function normalizeRepairOptions(input = {}) {
  assertExactKeys(input, ['dryRun'], 'Privileged operation');
  if (input.dryRun !== undefined && typeof input.dryRun !== 'boolean') throw new Error('Privileged operation dryRun must be boolean.');
  return { dryRun: input.dryRun === true };
}
function publicRepairMetadata(engine, spec, dryRun, exitCode = null) {
  return {
    operation: engine,
    execution: dryRun ? 'dry-run' : 'elevated',
    allowlisted: true,
    adminRequired: true,
    restartRequired: spec.restartRequired,
    expectedDuration: spec.duration,
    effect: spec.effect,
    doesNot: spec.doesNot,
    ...(exitCode === null ? {} : { exitCode, succeeded: exitCode === 0 })
  };
}
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
      ? { available: true, capability: 'windows-elevation' }
      : { available: false, reason: 'Required Windows component is unavailable.', capability: 'windows-elevation' };
  }
  async function run(engine, input = {}) {
    const { dryRun } = normalizeRepairOptions(input);
    const spec = OPERATION_SPECS[engine];
    if (!spec) throw new Error('Privileged operation is not allowlisted.');
    const capability = await probe(engine);
    if (!capability.available) throw new Error(capability.reason);
    const metadata = publicRepairMetadata(engine, spec, dryRun);
    if (dryRun) return { summary: { ...metadata, dryRun: true }, items: [{ operation: engine, status: 'planned' }], restartRequired: spec.restartRequired };
    const result = await elevatedExecutor({ executable: resolveExecutable(spec, windowsDirectory), args: [...spec.args] });
    const exitCode = Number(result.exitCode);
    return {
      summary: { ...publicRepairMetadata(engine, spec, false, exitCode), dryRun: false },
      items: [{ operation: engine, status: exitCode === 0 ? 'completed' : 'failed', exitCode }],
      warnings: result.stderr ? [result.stderr] : [],
      restartRequired: spec.restartRequired
    };
  }
  async function probeService() {
    if (platform !== 'win32') return { available: false, reason: 'Windows is required.', capability: 'windows-service-control' };
    const executable = path.join(windowsDirectory, 'System32', 'sc.exe');
    return fs.existsSync(executable)
      ? { available: true, capability: 'windows-service-control' }
      : { available: false, reason: 'Required Windows component is unavailable.', capability: 'windows-service-control' };
  }
  function isProtectedService(serviceName) { return PROTECTED_SERVICES.has(validateServiceName(serviceName)); }
  async function runService(input) {
    assertExactKeys(input, ['serviceName', 'action', 'dryRun'], 'Service control');
    const name = validateServiceName(input.serviceName); const templates = SERVICE_ACTIONS[input.action]; const dryRun = input.dryRun === true;
    if (input.dryRun !== undefined && typeof input.dryRun !== 'boolean') throw new Error('Service control dryRun must be boolean.');
    if (!templates) throw new Error('Service action is not allowlisted.');
    if (isProtectedService(name)) throw new Error('This protected Windows service cannot be changed by SmartOrganizer.');
    const capability = await probeService(); if (!capability.available) throw new Error(capability.reason);
    const commands = templates.map(template => template.map(value => value === null ? name : value).concat(template.includes(null) ? [] : [name]));
    if (dryRun) return { summary: { dryRun: true, serviceName: name, action: input.action, adminRequired: true, protected: false, allowlisted: true, plannedCommands: commands.length }, items: commands.map((_args, index) => ({ operation: 'service-control', serviceName: name, action: input.action, commandIndex: index + 1, status: 'planned' })) };
    const items = [];
    for (let index = 0; index < commands.length; index++) {
      const result = await elevatedExecutor({ executable: path.join(windowsDirectory, 'System32', 'sc.exe'), args: commands[index] });
      const exitCode = Number(result.exitCode);
      items.push({ operation: 'service-control', serviceName: name, action: input.action, commandIndex: index + 1, exitCode, status: exitCode === 0 ? 'completed' : 'failed' });
      if (exitCode !== 0 && !(input.action === 'restart' && commands[index][0] === 'stop' && exitCode === 1062)) throw new Error(`Service action exited with code ${exitCode}.`);
    }
    return { summary: { dryRun: false, serviceName: name, action: input.action, commandsCompleted: items.length, adminRequired: true, allowlisted: true }, items };
  }
  return { probe, run, probeService, runService, isProtectedService };
}

module.exports = { OPERATION_SPECS, SERVICE_ACTIONS, PROTECTED_SERVICES, createPrivilegedRunner, resolveExecutable, validateServiceName };
