import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, writeFile, rm, mkdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { moveWithFallback, DestinationExistsError } = require('../electron/safe-move.cjs') as {
  moveWithFallback: (source: string, destination: string) => Promise<{ mode: string }>;
  DestinationExistsError: new (destination: string) => Error & { code: string };
};

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'knoux-safe-move-'));
  return root;
}

describe('safe move', () => {
  it('moves a file and leaves the source gone', async () => {
    const root = await fixture();
    try {
      const source = path.join(root, 'source.txt');
      const destination = path.join(root, 'nested', 'destination.txt');
      await writeFile(source, 'payload', 'utf8');
      const outcome = await moveWithFallback(source, destination);
      expect(outcome.mode).toBe('rename');
      expect(await readFile(destination, 'utf8')).toBe('payload');
      await expect(stat(source)).rejects.toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('never overwrites a destination that already exists', async () => {
    const root = await fixture();
    try {
      const source = path.join(root, 'source.txt');
      const destination = path.join(root, 'destination.txt');
      await writeFile(source, 'mine', 'utf8');
      await writeFile(destination, 'theirs', 'utf8');
      await expect(moveWithFallback(source, destination)).rejects.toBeInstanceOf(DestinationExistsError);
      // The pre-existing file keeps its own content and the source is untouched.
      expect(await readFile(destination, 'utf8')).toBe('theirs');
      expect(await readFile(source, 'utf8')).toBe('mine');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('refuses to clobber a destination created between the check and the move', async () => {
    const root = await fixture();
    try {
      const source = path.join(root, 'source.txt');
      const destination = path.join(root, 'destination.txt');
      await writeFile(source, 'mine', 'utf8');
      // Simulate the race: the destination appears after it was observed free.
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, 'late arrival', 'utf8');
      await expect(moveWithFallback(source, destination)).rejects.toMatchObject({ code: 'EEXIST' });
      expect(await readFile(destination, 'utf8')).toBe('late arrival');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('creates the destination directory when it does not exist', async () => {
    const root = await fixture();
    try {
      const source = path.join(root, 'source.txt');
      const destination = path.join(root, 'a', 'b', 'c', 'destination.txt');
      await writeFile(source, 'payload', 'utf8');
      await moveWithFallback(source, destination);
      expect(await readFile(destination, 'utf8')).toBe('payload');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
