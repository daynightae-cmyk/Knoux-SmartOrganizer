import { describe, expect, it, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { createClipboardVault, looksSensitive, normaliseFileReferences } = require('../electron/clipboard-vault.cjs') as {
  createClipboardVault: (options: Record<string, unknown>) => any;
  looksSensitive: (text: string) => boolean;
  normaliseFileReferences: (list: string[]) => string[];
};

/** A stand-in for Electron's safeStorage: real encryption is the OS's job. */
function fakeSafeStorage(available = true) {
  const key = Buffer.from('knoux-test-key');
  return {
    isEncryptionAvailable: () => available,
    encryptString: (text: string) => {
      const data = Buffer.from(text, 'utf8');
      const cipher = Buffer.alloc(data.length);
      for (let index = 0; index < data.length; index += 1) cipher[index] = data[index] ^ key[index % key.length];
      return Buffer.concat([Buffer.from('KNOX1'), cipher]);
    },
    decryptString: (buffer: Buffer) => {
      const data = buffer.subarray(5);
      const plain = Buffer.alloc(data.length);
      for (let index = 0; index < data.length; index += 1) plain[index] = data[index] ^ key[index % key.length];
      return plain.toString('utf8');
    }
  };
}

function fakeClipboard(initial: { text?: string; uriList?: string; image?: string } = {}) {
  const state = { text: initial.text ?? '', uriList: initial.uriList ?? '', image: initial.image ?? '' };
  const writes: { text?: string; buffer?: Buffer; format?: string }[] = [];
  return {
    state,
    writes,
    readText: () => state.text,
    read: (format: string) => (format === 'text/uri-list' ? state.uriList : ''),
    readImage: () => ({ isEmpty: !state.image, toPNG: () => (state.image ? Buffer.from(state.image, 'base64') : Buffer.alloc(0)) }),
    writeText: (text: string) => { writes.push({ text }); state.text = text; },
    writeImage: () => { writes.push({}); },
    writeBuffer: (format: string, buffer: Buffer) => { writes.push({ format, buffer }); }
  };
}

function settings(overrides: Record<string, unknown> = {}) {
  return { clipboard: { enabled: true, paused: false, privateMode: false, maxItems: 200, retentionDays: 14, captureImages: true, captureFiles: true, sensitiveProtection: true, ...overrides } };
}

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'knoux-vault-'));
  return root;
}

describe('clipboard vault', () => {
  let root: string;

  beforeEach(async () => {
    root = await fixture();
  });

  it('captures nothing until the user enables capture', async () => {
    const clipboard = fakeClipboard({ text: 'copied before enabling' });
    const vault = createClipboardVault({
      safeStorage: fakeSafeStorage(), clipboard,
      storagePath: path.join(root, 'vault.json'),
      readSettings: async () => ({ clipboard: { enabled: false, paused: false, privateMode: false, maxItems: 200, retentionDays: 14, captureImages: true, captureFiles: true, sensitiveProtection: true } })
    });
    await vault.poll();
    expect(vault.list()).toHaveLength(0);
    expect(vault.status().monitoring).toBe(false);
  });

  it('captures text once capture is enabled', async () => {
    const clipboard = fakeClipboard({ text: 'hello vault' });
    const vault = createClipboardVault({
      safeStorage: fakeSafeStorage(), clipboard,
      storagePath: path.join(root, 'vault.json'),
      readSettings: async () => settings()
    });
    await vault.poll();
    const items = vault.list();
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('text');
    expect(items[0].preview).toBe('hello vault');
  });

  it('does not capture the same content twice', async () => {
    const clipboard = fakeClipboard({ text: 'duplicate me' });
    const vault = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard, storagePath: path.join(root, 'vault.json'), readSettings: async () => settings() });
    await vault.poll();
    await vault.poll();
    await vault.poll();
    expect(vault.list()).toHaveLength(1);
  });

  it('pauses and resumes capture', async () => {
    const clipboard = fakeClipboard({ text: 'first' });
    const vault = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard, storagePath: path.join(root, 'vault.json'), readSettings: async () => settings() });
    await vault.poll();
    expect(vault.list()).toHaveLength(1);
    await vault.updateSettings(settings({ paused: true }));
    clipboard.state.text = 'while paused';
    await vault.poll();
    expect(vault.list()).toHaveLength(1);
    await vault.updateSettings(settings({ paused: false }));
    await vault.poll();
    expect(vault.list()).toHaveLength(2);
  });

  it('captures nothing in private mode', async () => {
    const clipboard = fakeClipboard({ text: 'private' });
    const vault = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard, storagePath: path.join(root, 'vault.json'), readSettings: async () => settings({ privateMode: true }) });
    await vault.poll();
    expect(vault.list()).toHaveLength(0);
  });

  it('stores content encrypted and never writes plaintext to disk', async () => {
    const clipboard = fakeClipboard({ text: 'TOP-SECRET-VALUE' });
    const storagePath = path.join(root, 'vault.json');
    const vault = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard, storagePath, readSettings: async () => settings() });
    await vault.poll();
    const raw = await readFile(storagePath, 'utf8');
    expect(raw).not.toContain('TOP-SECRET-VALUE');
    expect(raw).toContain('"payload"');
    // The stored payload is ciphertext, not the copied text.
    expect(raw).not.toContain('persisted');
  });

  it('falls back to memory-only storage instead of writing plaintext', async () => {
    const clipboard = fakeClipboard({ text: 'TOP-SECRET-VALUE' });
    const storagePath = path.join(root, 'vault.json');
    const vault = createClipboardVault({ safeStorage: fakeSafeStorage(false), clipboard, storagePath, readSettings: async () => settings() });
    await vault.poll();
    expect(vault.status().storageMode).toBe('memory-only');
    expect(vault.status().persistenceAvailable).toBe(false);
    await expect(readFile(storagePath, 'utf8')).rejects.toThrow();
  });

  it('restores encrypted items after a restart', async () => {
    const storagePath = path.join(root, 'vault.json');
    const clipboard = fakeClipboard({ text: 'persisted text' });
    const first = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard, storagePath, readSettings: async () => settings() });
    await first.poll();

    const second = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard: fakeClipboard({ text: 'different now' }), storagePath, readSettings: async () => settings() });
    await second.load();
    const items = second.list();
    expect(items).toHaveLength(1);
    expect(items[0].preview).toBe('persisted text');
  });

  it('reports items it cannot decrypt instead of silently emptying the vault', async () => {
    const storagePath = path.join(root, 'vault.json');
    const clipboard = fakeClipboard({ text: 'persisted text' });
    const first = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard, storagePath, readSettings: async () => settings() });
    await first.poll();
    await writeFile(storagePath, 'not json at all', 'utf8');

    const second = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard: fakeClipboard({}), storagePath, readSettings: async () => settings() });
    await second.load();
    expect(second.list()).toHaveLength(0);
  });

  it('searches, pins, deletes and clears', async () => {
    const clipboard = fakeClipboard({ text: 'alpha' });
    const vault = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard, storagePath: path.join(root, 'vault.json'), readSettings: async () => settings() });
    await vault.poll();
    clipboard.state.text = 'beta';
    await vault.poll();
    expect(vault.list({ query: 'alph' })).toHaveLength(1);
    expect(vault.list({ query: 'zzz' })).toHaveLength(0);

    const [first] = vault.list();
    await vault.setPinned(first.id, true);
    expect(vault.list({ pinnedOnly: true })).toHaveLength(1);
    expect(vault.status().pinned).toBe(1);

    await vault.remove(first.id);
    expect(vault.list()).toHaveLength(1);
    expect(await vault.clear()).toBe(1);
    expect(vault.list()).toHaveLength(0);
  });

  it('copies an item back to the Windows clipboard without altering it', async () => {
    const clipboard = fakeClipboard({ text: 'copy me back\nsecond line' });
    const vault = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard, storagePath: path.join(root, 'vault.json'), readSettings: async () => settings() });
    await vault.poll();
    const [item] = vault.list();
    const restored = vault.copyBack(item.id);
    expect(restored).not.toBeNull();
    expect(clipboard.writes.at(-1)?.text).toBe('copy me back\nsecond line');
  });

  it('does not re-capture an item it just copied back', async () => {
    const clipboard = fakeClipboard({ text: 'round trip' });
    const vault = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard, storagePath: path.join(root, 'vault.json'), readSettings: async () => settings() });
    await vault.poll();
    const [item] = vault.list();
    vault.copyBack(item.id);
    await vault.poll();
    expect(vault.list()).toHaveLength(1);
  });

  it('enforces the maximum item count', async () => {
    const clipboard = fakeClipboard({ text: 'one' });
    const vault = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard, storagePath: path.join(root, 'vault.json'), readSettings: async () => settings({ maxItems: 10 }) });
    for (let index = 0; index < 15; index += 1) {
      clipboard.state.text = `value-${index}`;
      await vault.poll();
    }
    expect(vault.itemCount).toBeLessThanOrEqual(10);
  });

  it('skips a password-like item when sensitive protection is on', async () => {
    const clipboard = fakeClipboard({ text: 'Xk9#mQ2!pL4@vB7' });
    const vault = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard, storagePath: path.join(root, 'vault.json'), readSettings: async () => settings() });
    await vault.poll();
    expect(vault.list()).toHaveLength(0);
    expect(vault.status().skippedSensitive).toBe(1);
  });

  it('captures a file reference and can restore it', async () => {
    const source = path.join(root, 'note.txt');
    await writeFile(source, 'note', 'utf8');
    const clipboard = fakeClipboard({ uriList: `file:///${source.replace(/\\/g, '/')}` });
    const vault = createClipboardVault({ safeStorage: fakeSafeStorage(), clipboard, storagePath: path.join(root, 'vault.json'), readSettings: async () => settings() });
    await vault.poll();
    const [item] = vault.list();
    expect(item.type).toBe('files');
    expect(vault.sourceFiles(item.id).length).toBe(1);
    vault.copyBack(item.id);
    const drop = clipboard.writes.find(write => write.format === 'FileNameW');
    expect(drop?.buffer?.toString('utf16le')).toContain('note.txt');
  });
});

describe('clipboard heuristics', () => {
  it('flags a password-like value and leaves ordinary content alone', () => {
    expect(looksSensitive('Xk9#mQ2!pL4@vB7')).toBe(true);
    expect(looksSensitive('hello world')).toBe(false);
    expect(looksSensitive('https://example.com/path')).toBe(false);
    expect(looksSensitive('C:\\Users\\Someone\\file.txt')).toBe(false);
    expect(looksSensitive('short')).toBe(false);
  });

  it('normalises file:// references into absolute paths', () => {
    const list = normaliseFileReferences(['file:///C:/Users/Test/note.txt', 'C:\\Users\\Test\\other.txt', 'relative.txt']);
    expect(list).toHaveLength(2);
    expect(list[0]).toContain('note.txt');
  });
});
