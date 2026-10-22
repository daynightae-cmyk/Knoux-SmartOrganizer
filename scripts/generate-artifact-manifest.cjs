#!/usr/bin/env node
'use strict';
/**
 * Builds the final artifact manifest: the hashes, sizes and provenance of the
 * files a user actually receives. The manifest is generated from the files on
 * disk, so it cannot drift away from them the way a hand-written table does.
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const evidenceDirectory = path.join(root, 'docs', 'evidence');
const manifestPath = path.join(evidenceDirectory, 'FINAL_ARTIFACT_MANIFEST.json');

const artifacts = [
  { role: 'installer', file: path.join('release', 'KNOuX-SmartOrganizer-Setup-x64.exe') },
  { role: 'installed-executable', file: path.join('release', 'win-unpacked', 'KNOuX SmartOrganizer.exe') }
];

function sha256(target) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(target));
  return hash.digest('hex');
}

function gitSha() {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); }
  catch { return null; }
}

function packageVersion() {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version; }
  catch { return null; }
}

function installedVersion(name) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8'));
    return manifest.version;
  } catch { return null; }
}

function signingState() {
  try {
    const evidence = JSON.parse(fs.readFileSync(path.join(evidenceDirectory, 'code-signing.json'), 'utf8'));
    return evidence.signingState || 'UNKNOWN';
  } catch { return 'UNKNOWN'; }
}

async function main() {
  const entries = [];
  for (const artifact of artifacts) {
    const absolute = path.join(root, artifact.file);
    if (!fs.existsSync(absolute)) { entries.push({ role: artifact.role, file: artifact.file, present: false }); continue; }
    const stats = await fsp.stat(absolute);
    entries.push({
      role: artifact.role,
      file: artifact.file,
      present: true,
      bytes: stats.size,
      sha256: sha256(absolute),
      builtAt: stats.mtime.toISOString()
    });
  }
  const manifest = {
    generatedAt: new Date().toISOString(),
    gitSha: gitSha(),
    version: packageVersion(),
    signingState: signingState(),
    toolchain: {
      node: process.versions.node,
      platform: process.platform,
      arch: process.arch,
      electron: installedVersion('electron'),
      electronBuilder: installedVersion('electron-builder')
    },
    artifacts: entries
  };
  await fsp.mkdir(evidenceDirectory, { recursive: true });
  await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Artifact manifest written to ${path.relative(root, manifestPath)}`);
  for (const entry of entries) console.log(`- ${entry.role}: ${entry.present ? `${entry.bytes} bytes, sha256 ${entry.sha256}` : 'MISSING'}`);
}

main().catch(error => { console.error(`Artifact manifest FAILED: ${error.message}`); process.exitCode = 1; });
