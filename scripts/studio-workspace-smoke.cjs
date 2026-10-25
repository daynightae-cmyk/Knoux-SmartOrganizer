#!/usr/bin/env node
'use strict';
/*
 * REAL Electron Studio smoke. Node >=24; Windows interactive desktop required.
 *   node scripts/studio-workspace-smoke.cjs [--skip-restart] [--timeout-ms=600000]
 *   node scripts/studio-workspace-smoke.cjs --help
 * KNOUX_STUDIO_SMOKE_EXECUTABLE: absolute packaged EXE (NO app argument).
 * Otherwise require('electron') and launch this app root; build dist beforehand.
 * KNOUX_STUDIO_SMOKE_PICKER_HELPER: optional absolute .ps1, called with
 *   -ProcessId <spawned main PID> -Directory <exact fixture root>
 *   -TimeoutMs <bounded budget> -Kind <source|destination>.
 * Helper must use native UI, stay PID-scoped, exit 0 only after Select Folder;
 * no bridge replacement, dialog patch, grant injection, or global desktop input.
 * Without that override, a dedicated temp PowerShell UIA/SendKeys helper is used.
 * No build, configuration edits, git, production mutations, or fixed evidence paths.
 * Result JSON, PNGs, logs and disposable fixtures live in ONE unique mkdtemp.
 * Temp result directory is intentionally retained, including failure evidence.
 * Mutating golden path uses real UI clicks; bridge calls are real IPC observations,
 * settings updates in the isolated profile, and explicitly labelled rejection probes.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const net = require('node:net');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const HELP = `Usage: node "${__filename}" [--skip-restart] [--timeout-ms=600000]
Requires Node 24+, Windows interactive desktop, and current built dist/index.html.
KNOUX_STUDIO_SMOKE_EXECUTABLE=<absolute packaged exe>: launch without app argument.
Unset executable: require electron from this project and pass the absolute app root.
KNOUX_STUDIO_SMOKE_PICKER_HELPER=<absolute .ps1>: optional native helper;
parameters: -ProcessId <main PID> -Directory <exact temp root> -TimeoutMs <ms> -Kind <source|destination>.
Default: PID-scoped temporary PowerShell UI Automation/SendKeys helper; never mocks dialogs.
--skip-restart: record restart/reauthorization as not tested (not full PASS).
--timeout-ms: total action budget, 60000..1800000; default 600000.
Outputs only a unique OS temp knoux-studio-smoke-* directory; report path printed.
Exit 0: all requested checks passed; 1: failed/incomplete; 2: environment/native picker blocked.
No build or long run is performed by --help. Retains its own evidence/fixtures/profile.
`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const quote = value => JSON.stringify(value);
const normalize = value => path.resolve(value).toLowerCase();
class Blocked extends Error { constructor(message) { super(message); this.name = 'Blocked'; } }
function assert(value, message) { if (!value) throw new Error(message); }
function budget(ctx, ms) {
  const remaining = ctx.deadline - Date.now();
  if (remaining <= 0) throw new Error('Total smoke action budget exhausted.');
  return Math.max(1, Math.min(ms, remaining));
}
async function bounded(promise, ms, label) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out (${ms}ms).`)), ms);
  })]); } finally { clearTimeout(timer); }
}
async function wait(ctx, label, test, ms = 15000) {
  const until = Date.now() + budget(ctx, ms);
  let last;
  while (Date.now() < until) {
    const result = await bounded(Promise.resolve().then(test), Math.min(5000, until - Date.now()), label);
    if (result) return result;
    last = result;
    await sleep(Math.min(150, Math.max(0, until - Date.now())));
  }
  throw new Error(`${label} timed out; last observation: ${JSON.stringify(last)}.`);
}
function owned(ctx, candidate) {
  const absolute = path.resolve(candidate);
  const rel = path.relative(ctx.directory, absolute);
  assert(rel && rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel), `Outside owned temp directory: ${absolute}`);
  return absolute;
}
async function writeNew(ctx, name, content) {
  const target = owned(ctx, path.join(ctx.directory, name));
  await fs.writeFile(target, content, { flag: 'wx' });
  return target;
}
async function jsonHttp(port, route, ms) {
  return new Promise((resolve, reject) => {
    const request = http.get({ hostname: '127.0.0.1', port, path: route }, response => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { text += chunk; if (text.length > 1024 * 1024) request.destroy(new Error('CDP HTTP response too large.')); });
      response.on('error', reject);
      response.on('end', () => {
        try { assert(response.statusCode === 200, `CDP HTTP ${response.statusCode}`); resolve(JSON.parse(text)); }
        catch (error) { reject(error); }
      });
    });
    const timer = setTimeout(() => request.destroy(new Error('CDP HTTP deadline.')), ms);
    request.once('error', reject);
    request.once('close', () => clearTimeout(timer));
  });
}
async function freePort() {
  const server = net.createServer();
  await bounded(new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); }), 3000, 'Allocate localhost port');
  const port = server.address().port;
  await bounded(new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())), 3000, 'Release localhost port');
  return port;
}
class CDP {
  constructor(socket, ctx) {
    this.socket = socket; this.ctx = ctx; this.nextId = 0; this.pending = new Map();
    socket.addEventListener('message', event => {
      try {
        const message = JSON.parse(String(event.data));
        if (message.id) {
          const entry = this.pending.get(message.id);
          if (!entry) return;
          this.pending.delete(message.id); clearTimeout(entry.timer);
          if (message.error) entry.reject(new Error(`CDP ${entry.method}: ${message.error.message}`));
          else entry.resolve(message.result);
        } else if (['Runtime.exceptionThrown', 'Runtime.consoleAPICalled', 'Log.entryAdded'].includes(message.method)) {
          if (message.method !== 'Runtime.consoleAPICalled' || message.params.type === 'error') {
            if (ctx.report.rendererErrors.length < 100) ctx.report.rendererErrors.push({ method: message.method, params: message.params });
          }
        }
      } catch (error) { this.rejectAll(error); }
    });
    socket.addEventListener('close', () => this.rejectAll(new Error('CDP socket closed.')));
    socket.addEventListener('error', () => this.rejectAll(new Error('CDP socket error.')));
  }
  static async connect(url, ctx) {
    const endpoint = new URL(url);
    assert(['127.0.0.1', 'localhost'].includes(endpoint.hostname), 'Refusing non-local CDP endpoint.');
    const socket = new WebSocket(url);
    try {
      await bounded(new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true });
        socket.addEventListener('error', () => reject(new Error('WebSocket connection failed.')), { once: true });
      }), budget(ctx, 10000), 'Connect CDP');
    } catch (error) { socket.close(); throw error; }
    return new CDP(socket, ctx);
  }
  rejectAll(error) {
    for (const entry of this.pending.values()) { clearTimeout(entry.timer); entry.reject(error); }
    this.pending.clear();
  }
  send(method, params = {}, ms = 10000, cleanup = false) {
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      let timeout;
      try { timeout = cleanup ? ms : budget(this.ctx, ms); } catch (error) { reject(error); return; }
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP ${method} timed out.`)); }, timeout);
      this.pending.set(id, { resolve, reject, timer, method });
      try { this.socket.send(JSON.stringify({ id, method, params })); }
      catch (error) { clearTimeout(timer); this.pending.delete(id); reject(error); }
    });
  }
  async eval(expression, ms = 10000, cleanup = false) {
    const response = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, ms, cleanup);
    if (response.exceptionDetails) throw new Error(`Renderer evaluation: ${response.exceptionDetails.text}: ${response.exceptionDetails.exception?.description || ''}`);
    return response.result?.value;
  }
  close() { this.rejectAll(new Error('Harness disconnected.')); this.socket.close(); }
}
async function api(ctx, method, request, bridge = 'knouxStudio') {
  // The original frozen preload bridge remains intact; these invoke REAL IPC.
  const args = request === undefined ? '' : quote(request);
  return ctx.page.eval(`window.${bridge}[${quote(method)}](${args})`, budget(ctx, 30000));
}
function elementExpression(selector, text, index = 0) {
  return `Array.from(document.querySelectorAll(${quote(selector)})).filter(e => ${text === undefined ? 'true' : `(e.textContent.trim() === ${quote(text)} || e.getAttribute('aria-label') === ${quote(text)})`})[${index}]`;
}
async function click(ctx, selector, text, index = 0) {
  const expression = elementExpression(selector, text, index);
  const point = await wait(ctx, `Clickable ${text || selector}`, () => ctx.page.eval(`(() => {
    const e = ${expression}; if (!e || e.disabled || e.closest('[inert]')) return null;
    e.scrollIntoView({block:'center', inline:'nearest', behavior:'instant'});
    const r=e.getBoundingClientRect(), s=getComputedStyle(e);
    if (!r.width || !r.height || s.visibility==='hidden' || s.display==='none') return null;
    const x=r.left+r.width/2, y=r.top+r.height/2, hit=document.elementFromPoint(x,y);
    return hit && (hit===e || e.contains(hit)) ? {x,y} : null;
  })()`));
  await ctx.page.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
  await ctx.page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  ctx.report.actions.push({ at: new Date().toISOString(), action: 'real-CDP-click', selector, text, index });
}
async function key(ctx, keyName, code, virtualKey, modifiers = 0) {
  await ctx.page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, code, windowsVirtualKeyCode: virtualKey, modifiers });
  await ctx.page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, code, windowsVirtualKeyCode: virtualKey, modifiers });
}
async function fill(ctx, selector, value) {
  await click(ctx, selector);
  await key(ctx, 'a', 'KeyA', 65, 2);
  await key(ctx, 'Backspace', 'Backspace', 8);
  await ctx.page.send('Input.insertText', { text: value });
  await wait(ctx, `Input reflects ${value}`, () => ctx.page.eval(`document.querySelector(${quote(selector)})?.value === ${quote(value)}`));
}
async function surface(ctx, name) {
  await click(ctx, '.st-rail__item', name);
  await wait(ctx, `Studio surface ${name}`, () => ctx.page.eval(`Array.from(document.querySelectorAll('.st-rail__item')).some(e=>e.getAttribute('aria-current')==='page' && e.querySelector('span')?.textContent===${quote(name)})`));
}
async function step(ctx, name, task) {
  const record = { name, startedAt: new Date().toISOString(), status: 'running' };
  ctx.report.steps.push(record);
  try { const result = await task(); record.status = 'passed'; return result; }
  catch (error) { record.status = error instanceof Blocked ? 'blocked' : 'failed'; record.error = error.message; throw error; }
  finally { record.finishedAt = new Date().toISOString(); }
}

// A helper instance handles exactly one native dialog in the spawned main PID.
// SendKeys is guarded by a foreground HWND check before EVERY send. No clipboard.
// If navigation cannot be proved from UIA address/breadcrumb values, no selection.
const NATIVE_PICKER = String.raw`param(
  [Parameter(Mandatory=$true)][int]$ProcessId,
  [Parameter(Mandatory=$true)][string]$Directory,
  [Parameter(Mandatory=$true)][int]$TimeoutMs,
  [Parameter(Mandatory=$true)][ValidateSet('source','destination')][string]$Kind
)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class StudioSmokeWindow {
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
 [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern IntPtr GetDlgItem(IntPtr hDlg, int nIDDlgItem);
}
'@
function Mark([string]$phase) { [Console]::WriteLine(('phase={0} +{1}ms' -f $phase, [int]$watch.Elapsed.TotalMilliseconds)) }
$watch=[Diagnostics.Stopwatch]::StartNew()
$expected=[IO.Path]::GetFullPath($Directory).TrimEnd('\')
if (!(Test-Path -LiteralPath $expected -PathType Container)) { throw 'Fixture directory missing.' }
$proc=Get-Process -Id $ProcessId -ErrorAction Stop
$started=$proc.StartTime
$dialog=$null
$seen=@{}
$lastSample=0
while ($watch.ElapsedMilliseconds -lt $TimeoutMs) {
 $current=Get-Process -Id $ProcessId -ErrorAction Stop
 if ($current.StartTime -ne $started) { throw 'PID was reused.' }
 $children=[Windows.Automation.AutomationElement]::RootElement.FindAll([Windows.Automation.TreeScope]::Children,[Windows.Automation.Condition]::TrueCondition)
 foreach ($window in $children) {
  try {
   $pidOfWindow=$window.Current.ProcessId
   $className=$window.Current.ClassName
   $title=$window.Current.Name
   if ($className -eq '#32770' -or $title -like 'KNOuX*') {
    $key=('{0}|{1}|{2}' -f $pidOfWindow,$className,$title)
    if (!$seen.ContainsKey($key)) { $seen[$key]=[int]$watch.ElapsedMilliseconds }
   }
   if ($pidOfWindow -eq $ProcessId -and $className -eq '#32770' -and $title -like 'KNOuX*') { $dialog=$window; break }
  } catch { }
 }
 if ($dialog) { break }
 if ($watch.ElapsedMilliseconds - $lastSample -gt 5000) {
  $lastSample=[int]$watch.ElapsedMilliseconds
  Mark ('poll-windows-'+$seen.Count)
 }
 Start-Sleep -Milliseconds 100
}
if (!$dialog) {
 [Console]::WriteLine(('observed-top-level={0}' -f (($seen.Keys | Select-Object -First 25) -join ' || ')))
 throw 'No PID-owned KNOuX native folder dialog; see observed-top-level for PID/class/title.'
}
Mark 'dialog-found'
$handle=[IntPtr]$dialog.Current.NativeWindowHandle
function Guard {
 if ($watch.ElapsedMilliseconds -ge $TimeoutMs) { throw 'Native picker deadline.' }
 $current=Get-Process -Id $ProcessId -ErrorAction Stop
 if ($current.StartTime -ne $started -or ![StudioSmokeWindow]::IsWindow($handle)) { throw 'Owned native dialog disappeared.' }
 $foreground=[StudioSmokeWindow]::GetForegroundWindow()
 [uint32]$owner=0
 [void][StudioSmokeWindow]::GetWindowThreadProcessId($foreground,[ref]$owner)
 if ($foreground -ne $handle -or $owner -ne $ProcessId) { throw 'Foreground changed; refusing desktop keys.' }
}
[void][StudioSmokeWindow]::SetForegroundWindow($handle)
# Exact HWND focus, never AppActivate by a partial title.
$focusDeadline=[Math]::Min($TimeoutMs,$watch.ElapsedMilliseconds+2000)
while ([StudioSmokeWindow]::GetForegroundWindow() -ne $handle -and $watch.ElapsedMilliseconds -lt $focusDeadline) { Start-Sleep -Milliseconds 50 }
Guard
[Windows.Forms.SendKeys]::SendWait('%d')
Guard
$escaped=''
foreach ($character in $expected.ToCharArray()) {
 if ('+^%~(){}[]'.Contains([string]$character)) { $escaped += '{'+$character+'}' } else { $escaped += $character }
}
[Windows.Forms.SendKeys]::SendWait($escaped)
Guard
[Windows.Forms.SendKeys]::SendWait('{ENTER}')
Mark 'address-committed'
# A whole-subtree FindAll over a shell folder view materialises thousands of
# UIA elements and cannot finish inside the budget, so every lookup below is a
# targeted FindFirst or a Win32 control-id call. Verification is still required
# before anything is selected: an unproven path cancels the dialog instead.
$verifyUntil=[Math]::Min($TimeoutMs,$watch.ElapsedMilliseconds+12000)
$verified=$false
while ($watch.ElapsedMilliseconds -lt $verifyUntil -and !$verified) {
 Guard
 foreach ($automationId in @('1001','41477')) {
  $node=$dialog.FindFirst([Windows.Automation.TreeScope]::Descendants,(New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::AutomationIdProperty,$automationId)))
  if (!$node) { continue }
  $values=@([string]$node.Current.Name)
  $pattern=$null
  if ($node.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern,[ref]$pattern)) { $values += [string]$pattern.Current.Value }
  foreach ($value in $values) {
   $candidate=($value -replace '^(Address|العنوان)\s*:\s*','').Trim().TrimEnd('\')
   if ($candidate.Equals($expected,[StringComparison]::OrdinalIgnoreCase)) { $verified=$true; break }
  }
  if ($verified) { break }
 }
 if (!$verified) { Start-Sleep -Milliseconds 200 }
}
if (!$verified) {
 [void][StudioSmokeWindow]::SetForegroundWindow($handle)
 [Windows.Forms.SendKeys]::SendWait('{ESCAPE}')
 throw 'Cannot prove exact fixture path in native address UI; selection blocked.'
}
Mark 'address-verified'
# Control 1148 is the file-name edit; clearing it keeps the dialog on the verified folder.
$nameEdit=[StudioSmokeWindow]::GetDlgItem($handle,1148)
if ($nameEdit -ne [IntPtr]::Zero) {
 $editElement=[Windows.Automation.AutomationElement]::FromHandle($nameEdit)
 $editPattern=$null
 if ($editElement -and $editElement.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern,[ref]$editPattern)) { $editPattern.SetValue('') }
}
# Control id 1 is the dialog's accept button (Select Folder).
$selectHandle=[StudioSmokeWindow]::GetDlgItem($handle,1)
if ($selectHandle -eq [IntPtr]::Zero) { throw 'Cannot identify native Select Folder button (control id 1).' }
$select=[Windows.Automation.AutomationElement]::FromHandle($selectHandle)
if (!$select -or !$select.Current.IsEnabled) { throw 'Native Select Folder button is unavailable.' }
Guard
Mark 'select-invoking'
$invoke=$select.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern)
$invoke.Invoke()
while ([StudioSmokeWindow]::IsWindow($handle) -and $watch.ElapsedMilliseconds -lt $TimeoutMs) { Start-Sleep -Milliseconds 100 }
if ([StudioSmokeWindow]::IsWindow($handle)) { throw 'Native selection did not complete.' }
Mark 'selected'
[Console]::WriteLine('Native folder selected: '+$expected)
`;

async function helper(ctx, directory, kind) {
  owned(ctx, directory);
  assert(ctx.child && ctx.child.exitCode === null && ctx.child.signalCode === null, 'Spawned application is not running.');
  const timeout = budget(ctx, 60000);
  const script = process.env.KNOUX_STUDIO_SMOKE_PICKER_HELPER || ctx.nativeHelper;
  if (!path.isAbsolute(script) || path.extname(script).toLowerCase() !== '.ps1') throw new Blocked('Picker helper must be an absolute .ps1 path.');
  await fs.access(script);
  const powershell = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const child = spawn(powershell, ['-NoProfile', '-NonInteractive', '-STA', '-File', script,
    '-ProcessId', String(ctx.child.pid), '-Directory', directory, '-TimeoutMs', String(Math.max(1000, timeout - 2000)), '-Kind', kind],
  { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  ctx.helpers.add(child);
  let output = '';
  const collect = chunk => { if (output.length < 128000) output += chunk.toString(); };
  child.stdout.on('data', collect); child.stderr.on('data', collect);
  try {
    const code = await bounded(new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); }), timeout, 'Native folder helper');
    await writeNew(ctx, `picker-${++ctx.helperSequence}.log`, output);
    if (code !== 0) throw new Blocked(`Native folder automation blocked (exit ${code}): ${output.trim().slice(-3000)}`);
  } catch (error) {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    if (error instanceof Blocked) throw error;
    throw new Blocked(`Native helper unavailable: ${error.message}`);
  } finally { ctx.helpers.delete(child); }
}
async function nativeClick(ctx, selector, text, directory, kind) {
  // A real native picker needs a foreground-capable Electron page, not only
  // an attached CDP renderer. Track a genuine DOM click before the OS dialog.
  await ctx.page.send('Page.bringToFront');
  await ctx.page.eval(`(() => {
    window.__knouxNativeClickEvidence = [];
    document.addEventListener('click', e => {
      window.__knouxNativeClickEvidence.push({
        trusted: e.isTrusted, target: e.target?.closest?.('button')?.textContent?.trim() || '',
        timestamp: Date.now()
      });
    }, { once: true, capture: true });
    return true;
  })()`);
  await click(ctx, selector, text);
  const clickEvidence = await ctx.page.eval('window.__knouxNativeClickEvidence || []');
  ctx.report.actions.push({ action: 'native-trigger-dom-evidence', kind, clickEvidence });
  if (!clickEvidence.length || !clickEvidence[0].trusted) {
    throw new Blocked('The CDP mouse interaction did not deliver a trusted DOM click to the Studio button.');
  }
  await helper(ctx, directory, kind);
  await wait(ctx, `Real ${kind} authorization for exact fixture root`, async () => {
    const records = await api(ctx, kind === 'source' ? 'listSources' : 'listDestinations');
    return records.find(record => normalize(record.folder || record.path) === normalize(directory));
  }, 20000);
  ctx.report.actions.push({ at: new Date().toISOString(), action: 'native-root-authorized', kind, directory, pid: ctx.child.pid });
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngFixture() {
  const width = 120, height = 80;
  const raw = Buffer.alloc((1 + width * 3) * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * (1 + width * 3) + 1 + x * 3;
    raw[i] = x * 2; raw[i + 1] = y * 3; raw[i + 2] = 180;
  }
  const chunk = (type, data) => {
    const name = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
    length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
    return Buffer.concat([length, name, data, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
async function fixtures(ctx) {
  ctx.source = owned(ctx, path.join(ctx.directory, 'fixtures', 'source'));
  ctx.destination = owned(ctx, path.join(ctx.directory, 'fixtures', 'destination'));
  await fs.mkdir(ctx.source, { recursive: true }); await fs.mkdir(ctx.destination, { recursive: true });
  // Files are real disposable bytes; extension markers test classification only,
  // not codec/document validity. Never execute or shell-open any fixture.
  const entries = [
    ['image', 'smoke-image.png', pngFixture()],
    ['video', 'category-marker.mp4'], ['audio', 'category-marker.wav'],
    ['document', 'smoke-note.txt', 'Real Studio smoke text.\nملف اختبار محلي آمن.\n'],
    ['spreadsheet', 'table.csv', 'name,value\nsmoke,24\n'],
    ['presentation', 'category-marker.ppt'], ['pdf', 'category-marker.pdf'],
    ['archive', 'category-marker.zip'], ['installer', 'category-marker.msi'],
    ['code', 'sample.js', "'use strict';\n// Classification fixture, never executed.\n"],
    ['markup', 'sample.html', '<!doctype html><title>Disposable fixture</title>'],
    ['config', 'sample.json', '{"disposable":true}\n'],
    ['font', 'category-marker.ttf'], ['design', 'category-marker.psd'],
    ['model', 'category-marker.fbx'], ['ebook', 'category-marker.epub'],
    ['discImage', 'category-marker.iso'], ['other', 'category-marker.unknown']
  ];
  ctx.fixtureRecords = [];
  for (const [category, name, supplied] of entries) {
    const content = supplied || `Disposable extension classification marker: ${category}; not a valid media/document container.\n`;
    const filename = owned(ctx, path.join(ctx.source, name));
    await fs.writeFile(filename, content, { flag: 'wx' });
    ctx.fixtureRecords.push({ name, category, path: filename, hash: await hash(ctx, filename) });
  }
  ctx.selected = ctx.fixtureRecords.filter(record => ['smoke-image.png', 'smoke-note.txt'].includes(record.name));
  ctx.report.fixtures = ctx.fixtureRecords;
  await fs.mkdir(owned(ctx, path.join(ctx.destination, 'Existing folder')));
  await fs.writeFile(owned(ctx, path.join(ctx.destination, 'Existing file')), 'Disposable collision fixture.', { flag: 'wx' });
}
async function hash(ctx, target) {
  owned(ctx, target);
  return crypto.createHash('sha256').update(await bounded(fs.readFile(target), budget(ctx, 5000), 'Read fixture hash')).digest('hex');
}
async function absent(ctx, target) {
  owned(ctx, target);
  try { await fs.lstat(target); return false; } catch (error) { if (error.code === 'ENOENT') return true; throw error; }
}
async function assertSourceUnchanged(ctx) {
  for (const record of ctx.fixtureRecords) assert(await hash(ctx, record.path) === record.hash, `Read-only index/plan modified fixture: ${record.name}`);
}
async function assertOutputs(ctx, journal, mode) {
  assert(journal.status === 'completed' && journal.completedFiles === 2 && journal.failedFiles === 0 && journal.cancelledFiles === 0 && journal.skippedFiles === 0, `${mode} journal not fully completed: ${JSON.stringify(journal)}`);
  assert(journal.entries.length === 2, `${mode} expected exactly two journal entries.`);
  const output = [];
  for (const entry of journal.entries) {
    const original = ctx.selected.find(record => record.name === entry.name);
    assert(original, 'Transfer included an unexpected file.');
    assert(normalize(entry.sourceRoot) === normalize(ctx.source) && normalize(entry.targetRoot) === normalize(ctx.destination), 'Journal transfer roots differ from disposable native grants.');
    const target = owned(ctx, path.join(entry.targetRoot, entry.targetRelative));
    assert(await hash(ctx, target) === original.hash, `${mode} destination SHA-256 mismatch: ${entry.name}`);
    assert(entry.verification === 'sha256', `${mode} engine did not journal full SHA-256 verification.`);
    if (mode === 'copy') assert(await hash(ctx, original.path) === original.hash, 'COPY removed or altered original.');
    else assert(await absent(ctx, original.path), 'MOVE did not remove original after verified copy.');
    output.push({ name: entry.name, source: original.path, target, sha256: original.hash });
  }
  ctx.report.transfers.push({ mode, journalId: journal.operationId, outputs: output });
}

async function launch(ctx) {
  const port = await freePort();
  const userData = owned(ctx, path.join(ctx.directory, 'user-data'));
  const env = { ...process.env, APPDATA: owned(ctx, path.join(ctx.directory, 'roaming')), LOCALAPPDATA: owned(ctx, path.join(ctx.directory, 'local')), TEMP: owned(ctx, path.join(ctx.directory, 'runtime-temp')), TMP: owned(ctx, path.join(ctx.directory, 'runtime-temp')) };
  delete env.ELECTRON_RUN_AS_NODE;
  for (const directory of [userData, env.APPDATA, env.LOCALAPPDATA, env.TEMP]) await fs.mkdir(directory, { recursive: true });
  const flags = [`--user-data-dir=${userData}`, `--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1'];
  const args = ctx.packaged ? flags : [ROOT, ...flags];
  const child = spawn(ctx.executable, args, { cwd: ROOT, env, windowsHide: false, stdio: ['ignore', 'pipe', 'pipe'] });
  ctx.child = child;
  const run = { pid: child.pid, executable: ctx.executable, args, port, startedAt: new Date().toISOString() };
  ctx.report.launches.push(run);
  let logs = '', spawnError;
  child.stdout.on('data', chunk => { if (logs.length < 5000000) logs += chunk.toString(); });
  child.stderr.on('data', chunk => { if (logs.length < 5000000) logs += chunk.toString(); });
  child.once('error', error => { spawnError = error; });
  child.once('exit', (code, signal) => { run.exitCode = code; run.signal = signal; });
  ctx.logSnapshot = () => logs;
  const version = await wait(ctx, 'Spawned Electron localhost debugger', async () => {
    if (spawnError) throw new Blocked(`Cannot launch Electron: ${spawnError.message}`);
    if (child.exitCode !== null || child.signalCode !== null) throw new Blocked(`Electron exited before CDP. Another instance or startup failure: ${logs.slice(-3000)}`);
    return jsonHttp(port, '/json/version', 1000).catch(() => null);
  }, 45000);
  ctx.browser = await CDP.connect(version.webSocketDebuggerUrl, ctx);
  const processes = await ctx.browser.send('SystemInfo.getProcessInfo');
  const browser = processes.processInfo.find(info => info.type === 'browser');
  assert(Number(browser?.id) === child.pid, 'Local debugger belongs to another process; refusing to interact.');
  const pages = await wait(ctx, 'Real dist renderer target', async () => {
    const list = await jsonHttp(port, '/json/list', 2000);
    return list.find(target => target.type === 'page' && /^file:/i.test(target.url) && /\/dist\/index\.html(?:$|[?#])/i.test(target.url));
  }, 30000);
  ctx.page = await CDP.connect(pages.webSocketDebuggerUrl, ctx);
  await ctx.page.send('Runtime.enable'); await ctx.page.send('Page.enable'); await ctx.page.send('Log.enable');
  await wait(ctx, 'Real frozen Electron preload bridges', () => ctx.page.eval(`!!window.knouxStudio && !!window.knoux && Object.isFrozen(window.knouxStudio) && typeof window.knouxStudio.previewUndo==='function' && typeof window.knoux.updateSettings==='function'`), 30000);
  const info = await api(ctx, 'appInfo', undefined, 'knoux');
  assert(info.electron && info.platform === 'win32' && info.isPackaged === ctx.packaged, `Not the requested real Electron runtime: ${JSON.stringify(info)}`);
  run.appInfo = info; run.rendererUrl = pages.url;
  // Observe original events without wrapping/replacing any method or bridge.
  await ctx.page.eval(`(() => { window.__knouxStudioSmokeEvents=[]; window.__knouxStudioSmokeUnsubscribe=window.knouxStudio.onEvent(e=>{if(window.__knouxStudioSmokeEvents.length<2000)window.__knouxStudioSmokeEvents.push(e)}); return true; })()`);
  // Prove storage isolation before ANY harness settings update or native grant.
  const settingsFiles = await wait(ctx, 'Settings inside isolated launch profile', async () => {
    const inspect = async (directory, depth) => {
      const found = [];
      for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        const target = owned(ctx, path.join(directory, entry.name));
        if (entry.isDirectory() && depth > 0 && !/Cache|GPUCache|Code Cache/.test(entry.name)) found.push(...await inspect(target, depth - 1));
        else if (entry.isFile() && /settings.*\.json$/i.test(entry.name)) found.push(target);
      }
      return found;
    };
    const found = await inspect(userData, 2);
    found.push(...await inspect(env.APPDATA, 3));
    return found.length ? found : null;
  }, 10000).catch(error => { throw new Blocked(`Cannot prove Electron settings storage isolation: ${error.message}`); });
  run.isolatedSettingsFiles = settingsFiles;
  await api(ctx, 'updateSettings', { localization: { locale: 'en' }, appearance: { theme: 'dark', reduceMotion: true }, general: { restorePreviousPage: false } }, 'knoux');
  await wait(ctx, 'English dark settings event applied', () => ctx.page.eval(`document.documentElement.lang==='en' && document.documentElement.dataset.theme==='dark'`));
  await click(ctx, '.sidebar .nav-item', 'Smart Organization Studio');
  await wait(ctx, 'Studio real UI navigation', () => ctx.page.eval(`!!document.querySelector('.st-root:not(.st-root--unavailable) .st-rail')`));
}
async function stop(ctx) {
  for (const child of ctx.helpers) if (child.exitCode === null && child.signalCode === null) child.kill();
  ctx.helpers.clear();
  if (ctx.page) {
    try {
      const events = await ctx.page.eval('window.__knouxStudioSmokeEvents || []', 1500, true);
      ctx.report.events.push(...events.map(event => ({ ...event, launch: ctx.report.launches.length })));
      await ctx.page.eval('window.__knouxStudioSmokeUnsubscribe?.(); true', 1000, true);
    } catch (error) { ctx.report.cleanup.push(`Event collection: ${error.message}`); }
    ctx.page.close(); ctx.page = null;
  }
  const child = ctx.child;
  if (child) {
    const exited = child.exitCode !== null || child.signalCode !== null;
    const exit = exited ? Promise.resolve() : new Promise(resolve => child.once('exit', resolve));
    if (!exited && ctx.browser) await ctx.browser.send('Browser.close', {}, 2000, true).catch(() => {});
    try { await bounded(exit, 6000, 'Owned Electron exit'); }
    catch {
      // Kill ONLY the exact ChildProcess we spawned; never taskkill /IM or peers.
      child.kill();
      ctx.report.cleanup.push(`Forced termination of owned main PID ${child.pid}; descendant cleanup not claimed.`);
      await bounded(exit, 5000, 'Owned Electron termination').catch(error => ctx.report.cleanup.push(error.message));
    }
    if (ctx.logSnapshot) await writeNew(ctx, `electron-${ctx.report.launches.length}.log`, ctx.logSnapshot());
    ctx.child = null; ctx.logSnapshot = null;
  }
  if (ctx.browser) { ctx.browser.close(); ctx.browser = null; }
}

async function capture(ctx, name, locale, theme, expectedCategories = false) {
  await ctx.page.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await api(ctx, 'updateSettings', { localization: { locale }, appearance: { theme } }, 'knoux');
  await wait(ctx, `${locale}/${theme} live DOM settings`, () => ctx.page.eval(`document.documentElement.lang===${quote(locale)} && document.documentElement.dir===${quote(locale === 'ar' ? 'rtl' : 'ltr')} && document.documentElement.dataset.theme===${quote(theme)} && innerWidth===1366 && innerHeight===768`));
  const library = locale === 'ar' ? 'المكتبة المرئية' : 'Visual library';
  // Do not guess Arabic UI labels: the rail's fixed surface order is production DOM.
  if (expectedCategories) {
    await click(ctx, '.st-rail__item', undefined, 1);
    await wait(ctx, '18 category cards rendered after settings event', () => ctx.page.eval(`document.querySelectorAll('.st-category').length===18 && !document.querySelector('[aria-busy="true"]')`));
  }
  await ctx.page.eval(`(() => { document.querySelector('.st-root')?.scrollIntoView({block:'start',behavior:'instant'}); return true; })()`);
  await wait(ctx, 'Fonts and live image previews ready', () => ctx.page.eval(`document.fonts.status==='loaded' && Array.from(document.querySelectorAll('.st-thumb img')).every(e=>e.complete && e.naturalWidth>0)`));
  const metrics = await ctx.page.eval(`(() => {
    const root=document.documentElement, stage=document.querySelector('.st-stage'), box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}};
    const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
    const cards=Array.from(document.querySelectorAll('.st-category'));
    return {lang:root.lang,dir:root.dir,theme:root.dataset.theme,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},clientWidth:root.clientWidth,scrollWidth:root.scrollWidth,horizontalOverflow:root.scrollWidth>root.clientWidth+1,bodyBackground:getComputedStyle(document.body).backgroundColor,studioBackground:getComputedStyle(document.querySelector('.st-root')).backgroundColor,headings:Array.from(document.querySelectorAll('.st-root h1,.st-root h2')).map(e=>e.textContent),stage:stage?box(stage):null,rail:box(document.querySelector('.st-rail')),categoryCount:cards.length,categories:cards.map(e=>({text:e.textContent,rect:box(e),visible:visible(e)})),focusable:Array.from(document.querySelectorAll('.st-root button,.st-root input,.st-root select')).filter(visible).length,overflowing:Array.from(document.querySelectorAll('.st-root *')).filter(e=>{const s=getComputedStyle(e);if(!visible(e)||['absolute','fixed'].includes(s.position)||['hidden','clip','auto','scroll'].includes(s.overflowX))return false;return e.clientWidth>0&&e.scrollWidth>e.clientWidth+4}).slice(0,25).map(e=>({tag:e.tagName,className:String(e.className),rect:box(e)}))};
  })()`);
  const screenshot = await ctx.page.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, 15000);
  const bytes = Buffer.from(screenshot.data, 'base64');
  assert(bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), 'CDP screenshot is not a PNG.');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  const file = await writeNew(ctx, `${name}.png`, bytes);
  ctx.report.screenshots.push({ name, file, capturedVia: 'Page.captureScreenshot / real Electron renderer', locale, theme, width, height, metrics, surfaceHint: expectedCategories ? library : 'current real Studio surface' });
  assert(width === 1366 && height === 768, `Screenshot size mismatch: ${width}x${height}`);
  assert(!metrics.horizontalOverflow, `${name}: document horizontal overflow.`);
  assert(metrics.headings.length && metrics.focusable >= 3, `${name}: Studio did not render an accessible workspace.`);
  if (expectedCategories) assert(metrics.categoryCount === 18, `${name}: missing category cards.`);
}
async function screenshotMatrix(ctx, populated) {
  for (const locale of ['ar', 'en']) for (const theme of ['dark', 'light']) {
    await step(ctx, `Screenshot ${locale}/${theme} 1366x768 (${populated ? 'indexed' : 'blocked-empty'})`, () => capture(ctx, `${populated ? 'studio' : 'studio-blocked'}-${locale}-${theme}-1366x768`, locale, theme, populated));
  }
  await api(ctx, 'updateSettings', { localization: { locale: 'en' }, appearance: { theme: 'dark' } }, 'knoux');
  await wait(ctx, 'Restore English controls for smoke actions', () => ctx.page.eval(`document.documentElement.lang==='en' && document.documentElement.dataset.theme==='dark'`));
}
async function createOutputFolder(ctx, name, validate = false) {
  await surface(ctx, 'Destination explorer');
  if (await ctx.page.eval(`document.querySelector('.st-stage button[aria-label="Up one level"]')?.disabled===false`)) {
    await click(ctx, '.st-stage button[aria-label="Up one level"]');
  }
  await wait(ctx, 'Destination root listing', () => ctx.page.eval(`Array.from(document.querySelectorAll('.st-stage .st-path')).some(e=>e.textContent===${quote(ctx.destination)})`));
  await click(ctx, '.st-stage button', 'New folder');
  await wait(ctx, 'Create folder dialog', () => ctx.page.eval(`!!document.querySelector('.st-modal input')`));
  if (validate) {
    for (const invalid of ['CON', 'bad:name', 'trailing.', '../escape', 'Existing folder', 'Existing file']) {
      await fill(ctx, '.st-modal input', invalid);
      await wait(ctx, `Windows rejects folder name ${invalid}`, () => ctx.page.eval(`!!document.querySelector('.st-modal .st-banner--warning') && document.querySelector('.st-modal__foot .st-btn--primary')?.disabled===true`));
      ctx.report.actions.push({ action: 'real-UI-folder-validation-rejected', name: invalid });
    }
  }
  await fill(ctx, '.st-modal input', name);
  await wait(ctx, 'Main-process folder validation accepted', () => ctx.page.eval(`!!document.querySelector('.st-modal .st-banner--success') && document.querySelector('.st-modal__foot .st-btn--primary')?.disabled===false`));
  await click(ctx, '.st-modal__foot .st-btn--primary', 'Create folder');
  await wait(ctx, 'Folder created by real Main IPC', async () => {
    const stat = await fs.lstat(owned(ctx, path.join(ctx.destination, name))).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    return stat?.isDirectory() && await ctx.page.eval(`!document.querySelector('.st-modal')`);
  });
  await click(ctx, '.st-stage button', 'Use this folder');
  await wait(ctx, 'Builder receives created destination', () => ctx.page.eval(`document.querySelector('.st-destination-path')?.textContent===${quote(path.join(ctx.destination, name))}`));
}
async function executeUI(ctx, mode) {
  await click(ctx, `input[name="studio-mode"][value="${mode}"]`);
  await wait(ctx, `Builder mode ${mode}`, () => ctx.page.eval(`document.querySelector('input[name="studio-mode"]:checked')?.value===${quote(mode)}`));
  await click(ctx, '.st-build-footer button', 'Build immutable plan');
  await wait(ctx, 'Immutable plan review', () => ctx.page.eval(`document.querySelectorAll('.st-plan-identity dd').length===6 && document.querySelectorAll('.st-table tbody tr').length===2`), 30000);
  const identity = await ctx.page.eval(`Array.from(document.querySelectorAll('.st-plan-identity dd')).map(e=>e.textContent.trim())`);
  assert(/^[a-f0-9]{64}$/.test(identity[1]), 'Review missing SHA-256 identity.');
  const before = await api(ctx, 'listHistory');
  assert(await ctx.page.eval(`document.querySelector('.st-approval button')?.disabled===true && Array.from(document.querySelectorAll('.st-approval input')).every(e=>!e.checked)`), 'Execution was enabled without explicit review approval.');
  if (mode === 'copy') await assertSourceUnchanged(ctx);
  const approval = { planId: identity[0], planHash: identity[1], operation: mode, destinationSummary: identity[4], approved: true };
  for (const probe of [{ ...approval, approved: false }, { ...approval, planHash: '0'.repeat(64) }]) {
    const result = await ctx.page.eval(`window.knouxStudio.executePlan(${quote(probe)}).then(()=>({accepted:true}),e=>({accepted:false,message:String(e.message)}))`);
    assert(!result.accepted && /STUDIO_(INPUT_INVALID|PLAN_TAMPERED)/.test(result.message), `Approval/hash rejection probe failed: ${JSON.stringify(result)}`);
    ctx.report.actions.push({ action: 'real-IPC-execution-rejection-probe', message: result.message });
  }
  assert((await api(ctx, 'listHistory')).length === before.length, 'Rejected execution unexpectedly journaled a transfer.');
  await click(ctx, '.st-approval input', undefined, 0);
  assert(await ctx.page.eval(`document.querySelector('.st-approval button').disabled`), 'One approval enabled transfer; expected two.');
  await click(ctx, '.st-approval input', undefined, 1);
  await wait(ctx, 'Both explicit review approvals enable exact plan', () => ctx.page.eval(`!document.querySelector('.st-approval button').disabled`));
  const after = await ctx.page.eval(`Array.from(document.querySelectorAll('.st-plan-identity dd')).map(e=>e.textContent.trim())`);
  assert(JSON.stringify(identity) === JSON.stringify(after), 'Review identity changed during approval.');
  ctx.report.plans.push({ mode, planId: identity[0], planHash: identity[1], destinationSummary: identity[4], approvedViaTwoRealClicks: true });
  await click(ctx, '.st-approval button', 'Approve and execute');
  const journal = await wait(ctx, `${mode.toUpperCase()} real journal terminal state`, async () => {
    const records = await api(ctx, 'listHistory');
    const record = records.find(item => item.planId === identity[0]);
    return record && record.status !== 'running' ? record : null;
  }, 60000);
  await assertOutputs(ctx, journal, mode);
  await wait(ctx, `${mode} terminal live event`, () => ctx.page.eval(`window.__knouxStudioSmokeEvents.some(e=>e.type==='execution' && e.planId===${quote(identity[0])} && e.phase==='completed')`));
  await wait(ctx, `${mode} real execution result visible`, () => ctx.page.eval(`!!document.querySelector('.st-execution') && Array.from(document.querySelectorAll('.st-stage .st-path')).some(e=>e.textContent===${quote(journal.operationId)})`));
  return journal;
}
async function undoUI(ctx, journal, restart) {
  const note = ctx.selected.find(item => item.name === 'smoke-note.txt');
  const image = ctx.selected.find(item => item.name === 'smoke-image.png');
  await fs.writeFile(note.path, 'New file created after MOVE; undo must never overwrite this.\n', { flag: 'wx' });
  const conflictHash = await hash(ctx, note.path);
  await surface(ctx, 'History & undo');
  await wait(ctx, 'Persisted MOVE history card', () => ctx.page.eval(`Array.from(document.querySelectorAll('.st-journal')).some(e=>e.textContent.includes(${quote(journal.operationId)}))`));
  // Select by the durable journal ID, not a global first Undo button.
  const cards = await ctx.page.eval(`Array.from(document.querySelectorAll('.st-journal')).map(e=>e.textContent)`);
  const cardIndex = cards.findIndex(text => text.includes(journal.operationId));
  await click(ctx, `.st-journal:nth-child(${cardIndex + 1}) > button`, 'Preview undo');
  await wait(ctx, 'Undo preview UI loaded', () => ctx.page.eval(`!!document.querySelector('.st-modal .st-stats')`), 30000);
  if (restart) {
    const roots = await ctx.page.eval(`Array.from(document.querySelectorAll('.st-modal .st-panel .st-inline')).filter(e=>e.querySelector('button')).map(e=>({root:e.querySelector('bdi')?.textContent,text:e.querySelector('button')?.textContent}))`);
    assert(roots.length === 2, 'Restart did not require both native-root reauthorizations.');
    ctx.report.restart.requiredRoots = roots;
    for (const grant of roots) {
      const kind = normalize(grant.root) === normalize(ctx.source) ? 'source' : normalize(grant.root) === normalize(ctx.destination) ? 'destination' : null;
      assert(kind, 'Undo requested a root outside the disposable fixtures.');
      await nativeClick(ctx, '.st-modal .st-panel button', grant.text, grant.root, kind);
      await wait(ctx, 'Undo root authorization refreshed', () => ctx.page.eval(`!Array.from(document.querySelectorAll('.st-modal .st-panel bdi')).some(e=>e.textContent===${quote(grant.root)})`), 30000);
    }
    ctx.report.restart.nativeReauthorization = 'passed';
  }
  await wait(ctx, 'Undo eligible rows and one conflict', () => ctx.page.eval(`document.querySelectorAll('.st-modal tbody tr').length===2 && Array.from(document.querySelectorAll('.st-modal tbody tr')).filter(e=>e.textContent.includes('Original path occupied')).length===1`), 30000);
  assert(await ctx.page.eval(`document.querySelector('.st-modal__foot .st-btn--primary').disabled`), 'Undo enabled without approval.');
  // Changed occupancy AFTER preview must fail with zero mutation. Fresh preview
  // supplies a NEW previewId/hash internally; never manufacture those tokens.
  await fs.writeFile(image.path, 'Second new conflict created after undo preview.\n', { flag: 'wx' });
  const imageConflictHash = await hash(ctx, image.path);
  await click(ctx, '.st-modal input[type="checkbox"]');
  await click(ctx, '.st-modal__foot .st-btn--primary', 'Restore verified moves');
  await wait(ctx, 'Stale undo preview rejected in real UI', () => ctx.page.eval(`document.querySelector('.st-modal [role="alert"]')?.textContent.includes('preview') || document.querySelector('.st-modal [role="alert"]')?.textContent.includes('review') || document.querySelector('.st-modal [role="alert"]')?.textContent.includes('STUDIO_UNDO_STALE')`), 30000);
  for (const entry of journal.entries) {
    const record = ctx.selected.find(item => item.name === entry.name);
    assert(await hash(ctx, path.join(entry.targetRoot, entry.targetRelative)) === record.hash, 'Stale undo mutated a moved destination.');
  }
  await click(ctx, '.st-modal button', 'Refresh undo preview');
  await wait(ctx, 'Fresh undo resets approval and exposes two conflicts', () => ctx.page.eval(`!document.querySelector('.st-modal input[type="checkbox"]')?.checked && Array.from(document.querySelectorAll('.st-modal tbody tr')).filter(e=>e.textContent.includes('Original path occupied')).length===2`), 30000);
  await click(ctx, '.st-modal select');
  await key(ctx, 'Home', 'Home', 36); await key(ctx, 'ArrowDown', 'ArrowDown', 40); await key(ctx, 'Enter', 'Enter', 13);
  await wait(ctx, 'Choose rename conflict resolution using native input', () => ctx.page.eval(`document.querySelector('.st-modal select')?.value==='rename'`));
  const restoreNames = await ctx.page.eval(`Array.from(document.querySelectorAll('.st-modal tbody tr')).map(e=>({name:e.cells[0].textContent,restoreName:e.cells[2].textContent}))`);
  await click(ctx, '.st-modal input[type="checkbox"]');
  await click(ctx, '.st-modal__foot .st-btn--primary', 'Restore verified moves');
  await wait(ctx, 'Verified undo result', () => ctx.page.eval(`Array.from(document.querySelectorAll('.st-modal h3')).some(e=>e.textContent==='Undo result')`), 60000);
  const updated = (await api(ctx, 'listHistory')).find(item => item.operationId === journal.operationId);
  assert(updated?.undoCompletedFiles === 2, `Undo did not restore both verified moves: ${JSON.stringify(updated)}`);
  for (const entry of updated.entries) {
    const record = ctx.selected.find(item => item.name === entry.name);
    const restore = restoreNames.find(item => item.name === entry.name);
    assert(entry.undo?.state === 'restored' && restore && restore.restoreName !== record.name, 'Conflict undo was not a renamed verified restore.');
    const restoredPath = owned(ctx, path.join(path.dirname(record.path), restore.restoreName));
    assert(await hash(ctx, restoredPath) === record.hash, 'Undo restored-content SHA-256 mismatch.');
    assert(await absent(ctx, path.join(entry.targetRoot, entry.targetRelative)), 'Undo left moved destination behind.');
  }
  assert(await hash(ctx, note.path) === conflictHash && await hash(ctx, image.path) === imageConflictHash, 'Undo overwrote a newly created original-path conflict.');
  await wait(ctx, 'Real undo completed event', () => ctx.page.eval(`window.__knouxStudioSmokeEvents.some(e=>e.type==='undo' && e.journalId===${quote(journal.operationId)} && e.phase==='completed' && e.restored===2 && e.failed===0)`));
  ctx.report.undo = { journalId: journal.operationId, stalePreviewRejected: true, refreshedApprovalRequired: true, conflictResolution: 'rename', restored: 2, hashesVerified: true, newFilesPreserved: true, restoreNames };
  await click(ctx, '.st-modal__foot button', 'Close');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) { console.log(HELP); return; }
  for (const arg of args) assert(arg === '--skip-restart' || /^--timeout-ms=\d+$/.test(arg), `Unknown argument ${arg}; use --help.`);
  const timeout = Number(args.find(arg => arg.startsWith('--timeout-ms='))?.split('=')[1] || 600000);
  assert(Number.isInteger(timeout) && timeout >= 60000 && timeout <= 1800000, '--timeout-ms must be 60000..1800000.');
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'knoux-studio-smoke-'));
  const ctx = { directory, deadline: Date.now() + timeout, helpers: new Set(), helperSequence: 0,
    packaged: !!process.env.KNOUX_STUDIO_SMOKE_EXECUTABLE,
    report: { schemaVersion: 1, startedAt: new Date().toISOString(), status: 'running', root: ROOT, resultDirectory: directory, scope: 'Real Electron, original native IPC, real UI input and native picker grants; no mocks. Screenshot matrix is renderer CSS viewport at DPR 1, not Windows DPI certification.', steps: [], actions: [], launches: [], screenshots: [], plans: [], transfers: [], events: [], rendererErrors: [], failures: [], blockers: [], cleanup: [], notTested: ['Cancellation, interrupted transfer recovery, multi-drive/cross-volume moves, Windows DPI scaling matrix, unsupported file codec validity'] } };
  console.log(`Studio smoke results: ${path.join(directory, 'report.json')}`);
  let failure;
  try {
    await step(ctx, 'Environment preflight', async () => {
      if (Number(process.versions.node.split('.')[0]) < 24 || typeof WebSocket !== 'function') throw new Blocked('Requires Node 24+ built-in WebSocket.');
      if (process.platform !== 'win32') throw new Blocked('Native Windows folder automation requires a Windows interactive desktop.');
      if (ctx.packaged) {
        if (!path.isAbsolute(process.env.KNOUX_STUDIO_SMOKE_EXECUTABLE)) throw new Blocked('KNOUX_STUDIO_SMOKE_EXECUTABLE must be absolute.');
        ctx.executable = path.resolve(process.env.KNOUX_STUDIO_SMOKE_EXECUTABLE);
      } else {
        ctx.executable = require(require.resolve('electron', { paths: [ROOT] }));
        await fs.access(path.join(ROOT, 'dist', 'index.html')).catch(() => { throw new Blocked('dist/index.html missing; build separately before running. Harness never builds.'); });
      }
      await fs.access(ctx.executable);
      ctx.nativeHelper = await writeNew(ctx, 'native-folder-picker.ps1', `\ufeff${NATIVE_PICKER}`);
      ctx.report.pickerHelper = process.env.KNOUX_STUDIO_SMOKE_PICKER_HELPER || ctx.nativeHelper;
    });
    await step(ctx, 'Create owned disposable fixtures', () => fixtures(ctx));
    await step(ctx, 'Launch isolated real Electron and click Studio', () => launch(ctx));
    try {
      await step(ctx, 'Native source picker and actual read-only index', async () => {
        await nativeClick(ctx, '.st-hero button', 'Add folder', ctx.source, 'source');
        const source = await wait(ctx, 'Real scan result retained by IPC', async () => (await api(ctx, 'listSources')).find(record => normalize(record.folder) === normalize(ctx.source) && record.inventory), 60000);
        const summary = source.inventory;
        assert(summary.totalFiles === 18 && !summary.partial && !summary.truncated && !summary.cancelled && summary.counts.errors === 0, `Incomplete fixture index: ${JSON.stringify(summary)}`);
        const rows = await api(ctx, 'query', { inventoryId: summary.inventoryId, limit: 200 });
        for (const record of ctx.fixtureRecords) assert(rows.rows.some(row => row.name === record.name && row.category === record.category), `Wrong real category: ${record.name}`);
        await wait(ctx, '18 real UI category cards', () => ctx.page.eval(`document.querySelectorAll('.st-category').length===18 && document.querySelectorAll('.st-file').length===18 && !document.querySelector('[aria-busy="true"]')`));
        await wait(ctx, 'Actual scan completed event', () => ctx.page.eval(`window.__knouxStudioSmokeEvents.some(e=>e.type==='scan' && e.inventoryId===${quote(summary.inventoryId)} && e.phase==='completed')`));
        await assertSourceUnchanged(ctx); ctx.report.index = summary;
      });
    } catch (error) {
      if (error instanceof Blocked && ctx.page) {
        // Preserve real empty-state screenshots, explicitly NOT scan evidence.
        await key(ctx, 'Escape', 'Escape', 27).catch(() => {});
        await screenshotMatrix(ctx, false).catch(captureError => ctx.report.failures.push(`Blocked screenshot capture: ${captureError.message}`));
      }
      throw error;
    }
    await screenshotMatrix(ctx, true);
    await step(ctx, 'Real category selection, individual file and inspector', async () => {
      await surface(ctx, 'Visual library');
      await click(ctx, '.st-category strong', 'Images');
      await wait(ctx, 'Image category filter', () => ctx.page.eval(`document.querySelectorAll('.st-file').length===1 && document.querySelector('.st-category.is-active strong')?.textContent==='Images' && !document.querySelector('[aria-busy="true"]')`));
      await click(ctx, '.st-results button', 'Add category to plan');
      await click(ctx, '.st-results button', 'Clear filters');
      await wait(ctx, 'All real library files restored', () => ctx.page.eval(`document.querySelectorAll('.st-file').length===18 && !document.querySelector('[aria-busy="true"]')`));
      await click(ctx, '.st-file__select', 'Select file: smoke-note.txt');
      await click(ctx, '.st-file .st-icon-btn', 'Focus file: smoke-note.txt');
      await wait(ctx, 'File inspector shows actual fixture', () => ctx.page.eval(`Array.from(document.querySelectorAll('.st-inspector h3')).some(e=>e.textContent==='smoke-note.txt')`));
      await surface(ctx, 'Organization builder');
      await wait(ctx, 'Builder resolves group plus file basket', () => ctx.page.eval(`document.querySelectorAll('.st-basket-list > div').length===2`));
      assert(await ctx.page.eval(`document.querySelector('.st-build-footer button').disabled`), 'COPY builder enabled without native destination grant.');
    });
    await step(ctx, 'Native destination picker and folder creation validation', async () => {
      await surface(ctx, 'Destination explorer');
      await nativeClick(ctx, '.st-section-head button', 'Add destination root', ctx.destination, 'destination');
      await createOutputFolder(ctx, 'Copy output', true);
    });
    const copy = await step(ctx, 'Immutable approval and actual COPY SHA-256', () => executeUI(ctx, 'copy'));
    await step(ctx, 'Preserve all originals after COPY', () => assertSourceUnchanged(ctx));
    const move = await step(ctx, 'New destination and actual MOVE SHA-256', async () => {
      await createOutputFolder(ctx, 'Move output');
      return executeUI(ctx, 'move');
    });
    const restart = !args.includes('--skip-restart');
    if (restart) await step(ctx, 'Real process restart with durable journal and revoked grants', async () => {
      await stop(ctx); await launch(ctx);
      const sources = await api(ctx, 'listSources'), destinations = await api(ctx, 'listDestinations');
      assert(sources.length === 0 && destinations.length === 0, 'Native root grants survived process restart.');
      const history = await api(ctx, 'listHistory');
      assert(history.some(item => item.operationId === copy.operationId) && history.some(item => item.operationId === move.operationId), 'Durable COPY/MOVE journal lost on restart.');
      ctx.report.restart = { status: 'passed', durableJournal: true, grantsRevoked: true };
    });
    else { ctx.report.restart = { status: 'not-tested' }; ctx.report.notTested.push('Process restart and native-root reauthorization (--skip-restart)'); }
    await step(ctx, 'Undo native reauthorization, stale preview, refresh and conflict-safe restore', () => undoUI(ctx, move, restart));
    for (const transfer of ctx.report.transfers.filter(item => item.mode === 'copy')) for (const output of transfer.outputs) assert(await hash(ctx, output.target) === output.sha256, 'Undo changed independent COPY output.');
    if (ctx.report.rendererErrors.length) throw new Error(`Real renderer reported ${ctx.report.rendererErrors.length} console/exception error(s); inspect report.`);
    ctx.report.status = restart ? 'passed' : 'incomplete';
    if (!restart) process.exitCode = 1;
  } catch (error) {
    failure = error;
    ctx.report.status = error instanceof Blocked ? 'blocked' : 'failed';
    (error instanceof Blocked ? ctx.report.blockers : ctx.report.failures).push(error.stack || error.message);
    process.exitCode = error instanceof Blocked ? 2 : 1;
    if (ctx.page) {
      try {
        const image = await ctx.page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, 1500, true);
        ctx.report.failureScreenshot = await writeNew(ctx, 'failure-current-window.png', Buffer.from(image.data, 'base64'));
      } catch (captureError) { ctx.report.failures.push(`Failure screenshot: ${captureError.message}`); }
    }
  } finally {
    await stop(ctx).catch(error => { ctx.report.cleanup.push(error.message); process.exitCode = process.exitCode || 1; });
    if (ctx.report.cleanup.some(message => /Forced termination|termination.*timed out/i.test(message)) && ctx.report.status === 'passed') { ctx.report.status = 'incomplete'; process.exitCode = 1; }
    ctx.report.finishedAt = new Date().toISOString();
    ctx.report.retainedResources = 'Only this unique temporary directory is retained for inspection; never removes preexisting files. Forced main termination, if any, does not claim descendant cleanup.';
    const report = await writeNew(ctx, 'report.json', `${JSON.stringify(ctx.report, null, 2)}\n`);
    console.log(`Studio smoke ${ctx.report.status.toUpperCase()}: ${report}${failure ? `\n${failure.message}` : ''}`);
  }
}
main().catch(error => { console.error(`Studio smoke harness error: ${error.message}`); process.exitCode = 1; });
