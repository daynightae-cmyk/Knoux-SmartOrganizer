'use strict';
/**
 * Mutation verification helpers.
 *
 * A zero exit code is not proof that a mutation achieved the requested state.
 * Every write/admin engine re-queries local state after the change and reports
 * one of:
 *   verified    - re-query proves the requested state
 *   unverified  - the change ran but the requested state could not be proven
 *   failed      - re-query proves the state is NOT what was requested
 *
 * Callers must not report `success: true` for unverified/failed mutations.
 */

const { fsp } = require('./windows-fs-metadata.cjs');

const path = require('node:path');

function check(name, expected, observed, ok) {
  return Object.freeze({ name, expected, observed, ok: Boolean(ok) });
}

function summarize(checks) {
  const list = Array.isArray(checks) ? checks.filter(Boolean) : [];
  if (!list.length) return { status: 'unverified', checks: list };
  if (list.some(item => item.ok === false)) return { status: 'failed', checks: list };
  if (list.every(item => item.ok === true)) return { status: 'verified', checks: list };
  return { status: 'unverified', checks: list };
}

function verification(checks, extra = {}) {
  const base = summarize(checks);
  return {
    status: base.status,
    verifiedAt: new Date().toISOString(),
    method: 'post-mutation re-query of local state',
    checks: base.checks.map(item => ({ ...item })),
    ...extra
  };
}

async function pathState(target) {
  try {
    const stats = await fsp.lstat(target);
    return {
      exists: true,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isLink: typeof stats.isSymbolicLink === 'function' && stats.isSymbolicLink(),
      size: Number(stats.size) || 0,
      fileIdentity: Number(stats.ino) > 0 ? `${Number(stats.dev)}:${Number(stats.ino)}` : null,
      modifiedAt: new Date(stats.mtimeMs).toISOString()
    };
  } catch (error) {
    return { exists: false, code: error?.code || 'UNKNOWN', isFile: false, isDirectory: false, isLink: false, size: 0, fileIdentity: null, modifiedAt: null };
  }
}

/** A move is proven only when the destination holds the file and the source is gone. */
async function verifyMove({ source, destination, expectedIdentity = null }) {
  const [before, after] = await Promise.all([pathState(source), pathState(destination)]);
  const checks = [
    check('destination-present', true, after.exists, after.exists),
    check('source-removed', false, before.exists, !before.exists),
    check('destination-is-file', true, after.isFile, after.isFile)
  ];
  if (expectedIdentity) {
    const identityMatched = !after.fileIdentity || after.fileIdentity === expectedIdentity;
    checks.push(check('file-identity-preserved', expectedIdentity, after.fileIdentity, identityMatched));
  }
  return {
    ...verification(checks),
    source: path.resolve(source),
    destination: path.resolve(destination),
    destinationState: after
  };
}

/** A quarantine/move-out is proven when the source is gone and the target holds the bytes. */
async function verifyRelocation({ source, target, expectedSize = null }) {
  const [before, after] = await Promise.all([pathState(source), pathState(target)]);
  const checks = [
    check('source-removed', false, before.exists, !before.exists),
    check('target-present', true, after.exists, after.exists)
  ];
  if (expectedSize != null) checks.push(check('target-size', expectedSize, after.size, after.size === expectedSize));
  return { ...verification(checks), source: path.resolve(source), target: path.resolve(target), targetState: after };
}

/** Undo of a relocation is proven when the original path is back and the target is gone. */
async function verifyRestore({ original, relocated, expectedSize = null }) {
  const [restored, stillRelocated] = await Promise.all([pathState(original), pathState(relocated)]);
  const checks = [
    check('original-present', true, restored.exists, restored.exists),
    check('relocated-removed', false, stillRelocated.exists, !stillRelocated.exists)
  ];
  if (expectedSize != null) checks.push(check('original-size', expectedSize, restored.size, restored.size === expectedSize));
  return { ...verification(checks), original: path.resolve(original), relocated: path.resolve(relocated), originalState: restored };
}

/** Registry-value absence/presence proof used by the startup manager. */
function verifyRegistryValue(expectedPresent, entry) {
  const present = Boolean(entry);
  return {
    ...verification([check('registry-value-present', expectedPresent, present, present === expectedPresent)]),
    valueName: entry?.valueName ?? null,
    observedEntry: entry ?? null
  };
}

/**
 * Aggregates many per-item verifications for a batch mutation.
 * `verified` when every item verified, `failed` when any item failed,
 * otherwise `unverified`.
 */
function aggregateVerifications(entries) {
  const list = Array.isArray(entries) ? entries.filter(Boolean) : [];
  const counts = { verified: 0, unverified: 0, failed: 0 };
  for (const entry of list) {
    if (entry.status === 'verified') counts.verified += 1;
    else if (entry.status === 'failed') counts.failed += 1;
    else counts.unverified += 1;
  }
  const status = list.length === 0 ? 'unverified' : (counts.failed > 0 ? 'failed' : (counts.unverified > 0 ? 'unverified' : 'verified'));
  return {
    status,
    verifiedAt: new Date().toISOString(),
    method: 'post-mutation re-query of local state',
    itemsVerified: counts.verified,
    itemsUnverified: counts.unverified,
    itemsFailed: counts.failed,
    itemsTotal: list.length
  };
}

/**
 * Exit-code-only evidence (used by the fixed privileged repair allowlist where
 * Windows exposes no clean post-condition re-query).
 * This is reported honestly as `exit-code-only`, never as `verified`.
 */
function exitCodeOnlyVerification(engine, exitCode, spec) {
  return {
    status: exitCode === 0 ? 'unverified' : 'failed',
    verifiedAt: new Date().toISOString(),
    method: 'exit-code-only',
    limitation: 'Windows exposes no documented post-condition re-query for this operation; success is inferred from the process exit code only.',
    checks: [check('process-exit-code', 0, exitCode, exitCode === 0)],
    operation: engine,
    documentedRestartRequired: Boolean(spec?.restartRequired)
  };
}

/** Truthful success gate: mutations only report success when verification proves it. */
function mutationSucceeded(verificationResult) {
  return verificationResult?.status === 'verified';
}

function mutationRestartState(verificationResult, spec) {
  const documented = Boolean(spec?.restartRequired);
  if (!documented) return 'not-required';
  if (verificationResult?.status !== 'verified') return 'unverified-pending-restart';
  return 'pending-restart';
}

module.exports = {
  check,
  summarize,
  verification,
  pathState,
  verifyMove,
  verifyRelocation,
  verifyRestore,
  verifyRegistryValue,
  aggregateVerifications,
  exitCodeOnlyVerification,
  mutationSucceeded,
  mutationRestartState,
  resolvePath: p => path.resolve(p)
};
