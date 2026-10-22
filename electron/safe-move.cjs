'use strict';
/**
 * Move primitives that never silently overwrite.
 *
 * The whole point of this module is that a destination which was free during
 * the plan can become occupied before the mutation. Checking with
 * `fs.existsSync` and then renaming is a time-of-check/time-of-use race that
 * replaces somebody else's file. Instead the destination is reserved with an
 * exclusive create, and a cross-volume move is staged, size-verified and only
 * then swapped in.
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

class DestinationExistsError extends Error {
  constructor(destination) {
    super(`Destination already exists: ${destination}`);
    this.code = 'EEXIST';
    this.destination = destination;
  }
}

/**
 * Moves a file to `destination`.
 *
 * @returns {Promise<{mode: 'rename' | 'copy-then-delete'}>}
 */
async function moveWithFallback(source, destination) {
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  const reservation = await fsp.open(destination, 'wx').catch(error => {
    if (error?.code === 'EEXIST') return null;
    throw error;
  });
  if (!reservation) throw new DestinationExistsError(destination);
  await reservation.close();
  try {
    await fsp.rename(source, destination);
    return { mode: 'rename' };
  } catch (error) {
    if (error?.code !== 'EXDEV') { await fsp.rm(destination, { force: true }).catch(() => {}); throw error; }
  }
  const staged = `${destination}.knoux-${crypto.randomUUID()}.part`;
  try {
    await fsp.copyFile(source, staged, fs.constants.COPYFILE_EXCL);
    const expected = await fsp.stat(source);
    const copied = await fsp.stat(staged);
    if (expected.size !== copied.size) {
      const mismatch = new Error('The copied file size does not match the source; the source was left untouched.');
      mismatch.code = 'ECOPYVERIFY';
      throw mismatch;
    }
    await fsp.rename(staged, destination);
  } catch (error) {
    await fsp.rm(staged, { force: true }).catch(() => {});
    await fsp.rm(destination, { force: true }).catch(() => {});
    throw error;
  }
  try { await fsp.unlink(source); }
  catch (error) {
    const failure = new Error(`The file was copied but the original could not be removed: ${error.code || error.message}`);
    failure.code = 'ESOURCESTILLPRESENT';
    throw failure;
  }
  return { mode: 'copy-then-delete' };
}

module.exports = { moveWithFallback, DestinationExistsError };
