const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const verificationKit = require('./verification.cjs');

const execFileAsync = promisify(execFile);

/** Documented log locations Windows writes for each allowlisted operation. */
const LOG_LOCATIONS = Object.freeze({
  dismCheckHealth: Object.freeze(['%windir%\\Logs\\DISM\\dism.log']),
  dismScanHealth: Object.freeze(['%windir%\\Logs\\DISM\\dism.log']),
  dismRestoreHealth: Object.freeze(['%windir%\\Logs\\DISM\\dism.log', '%windir%\\Logs\\CBS\\CBS.log']),
  sfcVerifyOnly: Object.freeze(['%windir%\\Logs\\CBS\\CBS.log']),
  sfcScanNow: Object.freeze(['%windir%\\Logs\\CBS\\CBS.log']),
  flushDns: Object.freeze([]),
  winsockReset: Object.freeze(['%windir%\\inf\\setupapi.dev.log']),
  tcpIpReset: Object.freeze(['%windir%\\inf\\setupapi.dev.log', '%windir%\\System32\\LogFiles\\TCPIP\\tcpip_statistics.log'])
});

/** Documented outcome text Windows emits, mapped to a normalized state. */
const OUTCOME_PATTERNS = Object.freeze([
  { engine: 'dismCheckHealth', pattern: /no component store corruption detected/i, state: 'healthy', restartMayBeRequired: false },
  { engine: 'dismCheckHealth', pattern: /component store is corrupt/i, state: 'corrupt', restartMayBeRequired: false },
  { engine: 'dismScanHealth', pattern: /no component store corruption detected/i, state: 'healthy', restartMayBeRequired: false },
  { engine: 'dismScanHealth', pattern: /component store corruption detected/i, state: 'corrupt', restartMayBeRequired: false },
  { engine: 'dismRestoreHealth', pattern: /the restore operation completed successfully/i, state: 'restore-succeeded', restartMayBeRequired: true },
  { engine: 'dismRestoreHealth', pattern: /corruption could not be repaired/i, state: 'restore-incomplete', restartMayBeRequired: false },
  { engine: 'sfcVerifyOnly', pattern: /did not find any integrity violations/i, state: 'intact', restartMayBeRequired: false },
  { engine: 'sfcVerifyOnly', pattern: /found integrity violations/i, state: 'violations-found', restartMayBeRequired: false },
  { engine: 'sfcScanNow', pattern: /did not find any integrity violations/i, state: 'intact', restartMayBeRequired: false },
  { engine: 'sfcScanNow', pattern: /found integrity violations|could not perform the requested operation/i, state: 'repair-incomplete', restartMayBeRequired: false }
]);

function summarizeOutput(stdout, limit = 1200) {
  const text = String(stdout || '').split(String.fromCharCode(0)).join('').trim();
  if (!text) return null;
  const lines = text.split(/\r?\n/).map(line => line.trimEnd()).filter(line => line.trim() !== '');
  return { lineCount: lines.length, head: lines.slice(0, 4).join('\n'), tail: lines.slice(-6).join('\n'), truncated: lines.length > 10, length: text.length > limit ? limit : text.length };
}

function classifyOutcome(engine, stdout) {
  for (const rule of OUTCOME_PATTERNS) if (rule.engine === engine && rule.pattern.test(String(stdout || ''))) return { state: rule.state, source: 'Microsoft documented output text' };
  return { state: 'undetermined', source: 'no documented outcome text matched' };
}

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
  // Output is captured to a temp transcript so stdout/stderr survive elevation.
  const transcript = path.join(os.tmpdir(), `knoux-elevated-${crypto.randomUUID()}.log`);
  const script = `$ErrorActionPreference='Stop'; $out=${quotePowerShell(transcript)}; $p=Start-Process -FilePath ${quotePowerShell(executable)} -ArgumentList ${argumentList} -Verb RunAs -Wait -PassThru -RedirectStandardOutput $out -RedirectStandardError ($out + '.err'); [pscustomobject]@{exitCode=$p.ExitCode;transcript=$out} | ConvertTo-Json -Compress`;
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  const { stdout, stderr } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { windowsHide: true, timeout: 60 * 60 * 1000, maxBuffer: 4 * 1024 * 1024 });
  const parsed = JSON.parse(stdout.trim() || '{}');
  let captured = ''; let capturedErr = '';
  try { captured = await fsp.readFile(transcript, 'utf8'); } catch {}
  try { capturedErr = await fsp.readFile(`${transcript}.err`, 'utf8'); } catch {}
  await fsp.rm(transcript, { force: true }).catch(() => {});
  await fsp.rm(`${transcript}.err`, { force: true }).catch(() => {});
  return { exitCode: Number(parsed.exitCode), stdout: captured, stderr: [stderr.trim(), capturedErr].filter(Boolean).join('\n').trim() };
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
    const logLocations = [...(LOG_LOCATIONS[engine] || [])];
    if (dryRun) return { summary: { ...metadata, dryRun: true, logLocations, verification: { status: 'unverified', method: 'dry-run: no state was changed', logLocations } }, items: [{ operation: engine, status: 'planned', commandIdentity: engine }], restartRequired: spec.restartRequired };
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();
    const result = await elevatedExecutor({ executable: resolveExecutable(spec, windowsDirectory), args: [...spec.args] });
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startedMs;
    const exitCode = Number(result.exitCode);
    const outcome = classifyOutcome(engine, result.stdout);
    const verification = verificationKit.exitCodeOnlyVerification(engine, exitCode, spec);
    verification.finalState = outcome.state;
    verification.finalStateSource = outcome.source;
    // A documented restart requirement means the final state is not observable yet.
    const restartState = verificationKit.mutationRestartState({ ...verification, status: 'verified' }, spec);
    return {
      summary: {
        ...publicRepairMetadata(engine, spec, false, exitCode), dryRun: false,
        // The allowlisted engine name IS the command identity in this architecture.
        // The literal executable/argument list is deliberately never surfaced.
        commandIdentity: engine, startedAt, finishedAt, durationMs,
        adminState: 'elevated', stdoutSummary: summarizeOutput(result.stdout), stderrSummary: summarizeOutput(result.stderr),
        logLocations, finalState: outcome.state, finalStateSource: outcome.source, restartState, verification
      },
      items: [{ operation: engine, status: exitCode === 0 ? (outcome.state === 'undetermined' ? 'completed-unverified-state' : 'completed') : 'failed', exitCode, finalState: outcome.state, finalStateSource: outcome.source, commandIdentity: engine, durationMs, logLocations }],
      warnings: [
        ...(result.stderr ? [summarizeOutput(result.stderr)?.head || 'The elevated operation reported output on stderr.'] : []),
        ...(outcome.state === 'undetermined' ? [`Windows reported no documented outcome text for this operation; the final state could not be classified from output.`] : []),
        ...(verificationKit.mutationRestartState({ ...verification, status: 'verified' }, spec) === 'pending-restart' ? ['The documented behaviour of this operation requires a restart before the final state can be observed.'] : [])
      ],
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
  /**
   * Read-side classification only. This must never throw: the Windows service
   * inventory contains names that are not valid for `sc.exe` control, and a
   * single such name must not fail the whole read. A name that cannot be
   * controlled is reported as protected; the strict `validateServiceName`
   * check still runs at the mutation boundary in `runService`.
   */
  function isProtectedService(serviceName) {
    if (typeof serviceName !== 'string' || serviceName.length === 0) return true;
    if (!/^[A-Za-z0-9_.-]{1,256}$/.test(serviceName)) return true;
    return PROTECTED_SERVICES.has(serviceName);
  }
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
