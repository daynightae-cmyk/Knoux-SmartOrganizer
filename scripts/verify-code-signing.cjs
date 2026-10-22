#!/usr/bin/env node
'use strict';
/**
 * Verifies the real Authenticode state of the release artifacts.
 *
 * The result is reported honestly: a build with no certificate is an
 * UNSIGNED_PRODUCTION_CANDIDATE and is never described as signed. Set
 * KNOUX_REQUIRE_SIGNING=1 to turn an unsigned artifact into a hard failure —
 * that is how a release gate should behave once a certificate exists.
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const root = path.resolve(__dirname, '..');
const evidencePath = path.join(root, 'docs', 'evidence', 'code-signing.json');

const artifacts = [
  { role: 'installer', file: path.join('release', 'KNOuX-SmartOrganizer-Setup-x64.exe') },
  { role: 'installed-executable', file: path.join('release', 'win-unpacked', 'KNOuX SmartOrganizer.exe') }
];

function shellCandidates() {
  const systemRoot = process.env.SystemRoot || 'C:\\Windows';
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  return [
    path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
    path.join(programFiles, 'PowerShell', '7', 'pwsh.exe'),
    path.join(systemRoot, 'System32', 'pwsh.exe')
  ].filter(candidate => {
    try { return fs.existsSync(candidate); } catch { return false; }
  });
}

/** Windows PowerShell can prefix redirected output with a UTF-16 BOM. */
function parseJson(text) {
  const cleaned = String(text || '').replace(/^\uFEFF/, '').trim();
  if (!cleaned) throw new Error('The verifier produced no output.');
  return JSON.parse(cleaned);
}

const SCRIPT = '& { param($target) $s = Get-AuthenticodeSignature -LiteralPath $target; $ts = $null; if ($s.TimeStamperCertificate) { $ts = $s.TimeStamperCertificate.Subject }; [pscustomobject]@{ State = $s.Status.ToString(); Status = $s.StatusMessage; Subject = $s.SignerCertificate.Subject; TimestampSubject = $ts; Algorithm = $s.SignerCertificate.SignatureAlgorithm.FriendlyName } | ConvertTo-Json -Compress }';

async function inspect(target) {
  for (const shell of shellCandidates()) {
    try {
      const { stdout } = await execFileAsync(shell, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', SCRIPT, target], { windowsHide: true, timeout: 60000, maxBuffer: 1024 * 1024 });
      const payload = parseJson(stdout);
      const state = String(payload?.State || 'Unknown');
      const signed = state === 'Valid';
      return {
        verifier: path.basename(shell),
        status: state,
        statusMessage: payload?.Status ? String(payload.Status).slice(0, 300) : null,
        publisher: payload?.Subject ? String(payload.Subject).slice(0, 300) : null,
        timestampPublisher: payload?.TimestampSubject ? String(payload.TimestampSubject).slice(0, 300) : null,
        signatureAlgorithm: payload?.Algorithm ? String(payload.Algorithm).slice(0, 120) : null,
        timestamped: Boolean(payload?.TimestampSubject),
        signed
      };
    } catch { /* try the next shell */ }
  }
  return { verifier: null, status: 'VERIFIER_UNAVAILABLE', statusMessage: 'No PowerShell host was available to inspect the Authenticode signature.', publisher: null, timestampPublisher: null, signatureAlgorithm: null, timestamped: false, signed: false };
}

async function main() {
  const results = [];
  for (const artifact of artifacts) {
    const absolute = path.join(root, artifact.file);
    if (!fs.existsSync(absolute)) {
      results.push({ role: artifact.role, file: artifact.file, present: false, status: 'ARTIFACT_MISSING', signed: false, timestamped: false });
      continue;
    }
    const inspection = await inspect(absolute);
    results.push({ role: artifact.role, file: artifact.file, present: true, ...inspection });
  }
  const anySigned = results.some(entry => entry.signed);
  const allSigned = results.length > 0 && results.every(entry => entry.signed);
  const signingState = allSigned ? 'SIGNED_PRODUCTION' : (anySigned ? 'PARTIALLY_SIGNED' : 'UNSIGNED_PRODUCTION_CANDIDATE');
  const required = process.env.KNOUX_REQUIRE_SIGNING === '1';
  const evidence = {
    capturedAt: new Date().toISOString(),
    signingState,
    signingRequired: required,
    allArtifactsSigned: allSigned,
    artifacts: results
  };
  await fsp.mkdir(path.dirname(evidencePath), { recursive: true });
  await fsp.writeFile(evidencePath, JSON.stringify(evidence, null, 2), 'utf8');
  console.log(`Code signing state: ${signingState}`);
  for (const entry of results) console.log(`- ${entry.role}: ${entry.status}`);
  if (required && !allSigned) {
    console.error('KNOUX_REQUIRE_SIGNING=1 and the artifacts are not fully signed. Release gate FAILED.');
    process.exit(1);
  }
  console.log(`Evidence written to ${path.relative(root, evidencePath)}`);
}

main().catch(error => { console.error(`Code signing verification FAILED: ${error.message}`); process.exitCode = 1; });
