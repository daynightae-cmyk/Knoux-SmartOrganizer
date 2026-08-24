const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const root = path.resolve(__dirname, '..');
const artifacts = [
  path.join(root, 'release', 'KNOuX-SmartOrganizer-Setup-x64.exe'),
  path.join(root, 'release', 'win-unpacked', 'KNOuX SmartOrganizer.exe')
];
const evidencePath = path.join(root, 'docs', 'evidence', 'code-signing.json');
const signingRequired = process.env.KNOUX_REQUIRE_SIGNING === '1';

async function invokeAuthenticode(script) {
  const candidates = [
    { executable: 'pwsh.exe', args: ['-NoProfile', '-NonInteractive', '-Command', script] },
    { executable: 'powershell.exe', args: ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script] }
  ];
  const errors = [];
  for (const candidate of candidates) {
    try {
      const { stdout, stderr } = await execFileAsync(candidate.executable, candidate.args, { windowsHide: true, timeout: 30000 });
      const value = JSON.parse(stdout.trim() || '{}');
      if (!value.status) throw new Error(stderr || 'Authenticode verifier returned no status.');
      return { value, verifier: candidate.executable, verifierError: null };
    } catch (error) { errors.push(`${candidate.executable}: ${String(error.stderr || error.message || error).replace(/[\r\n]+/g, ' ').slice(0, 300)}`); }
  }
  return { value: { status: 'VERIFIER_UNAVAILABLE', statusMessage: errors.join(' | ') }, verifier: null, verifierError: errors };
}

async function inspect(filePath) {
  await fs.access(filePath);
  const escaped = filePath.replace(/'/g, "''");
  const script = `$s=Get-AuthenticodeSignature -FilePath '${escaped}'; [pscustomobject]@{path=$s.Path;status=[string]$s.Status;statusMessage=$s.StatusMessage;subject=if($s.SignerCertificate){$s.SignerCertificate.Subject}else{$null};timestampSubject=if($s.TimeStamperCertificate){$s.TimeStamperCertificate.Subject}else{$null};signatureAlgorithm=if($s.SignerCertificate){$s.SignerCertificate.SignatureAlgorithm.FriendlyName}else{$null}} | ConvertTo-Json -Compress`;
  const { value, verifier, verifierError } = await invokeAuthenticode(script);
  return { artifact: path.relative(root, filePath), status: value.status, statusMessage: String(value.statusMessage || '').replace(filePath, '[artifact]').slice(0, 500), subject: value.subject || null, timestampSubject: value.timestampSubject || null, signatureAlgorithm: value.signatureAlgorithm || null, verifier, verifierError };
}

async function main() {
  const inspected = await Promise.all(artifacts.map(inspect));
  const signed = inspected.every(entry => entry.status === 'Valid');
  const evidence = { capturedAt: new Date().toISOString(), signingState: signed ? 'SIGNED_PRODUCTION' : 'UNSIGNED_PRODUCTION_CANDIDATE', signingRequired, artifacts: inspected };
  await fs.mkdir(path.dirname(evidencePath), { recursive: true });
  await fs.writeFile(evidencePath, JSON.stringify(evidence, null, 2), 'utf8');
  console.log(`Code signing state: ${evidence.signingState}`);
  if (signingRequired && !signed) throw new Error('KNOuX_REQUIRE_SIGNING=1 requires valid Authenticode signatures for all release artifacts.');
}

main().catch(error => { console.error(`Code signing verification failed: ${error.message}`); process.exitCode = 1; });
