import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../shared/contracts';
import { dictionaries } from '../src/locales';

describe('settings contract', () => {
  it('starts with a versioned, privacy-preserving local configuration', () => {
    expect(defaultSettings.settingsVersion).toBe(2);
    expect(defaultSettings.privacy.telemetry).toBe(false);
    expect(defaultSettings.privacy.crashReporting).toBe(false);
    expect(defaultSettings.scanning.reparsePointPolicy).toBe('skip');
  });
});

describe('localization contract', () => {
  it('keeps Arabic and English key coverage identical', () => {
    expect(Object.keys(dictionaries.ar).sort()).toEqual(Object.keys(dictionaries.en).sort());
  });

  it('contains localized labels for every registered renderer tool key', () => {
    for (const id of ['system-health', 'smart-scan', 'disk-overview', 'large-files', 'duplicate-files', 'empty-folders', 'downloads-inventory', 'organize-downloads-preview', 'organize-downloads-apply', 'organize-downloads-undo', 'temp-cleanup-preview', 'startup-items', 'installed-apps', 'network-diagnostics', 'hardware-inventory', 'event-warnings', 'file-hash', 'repair-dism-check-health', 'repair-dism-scan-health', 'repair-dism-restore-health', 'repair-sfc-verify-only', 'repair-sfc-scan-now', 'repair-dns-flush', 'repair-winsock-reset', 'repair-tcpip-reset']) {
      expect(dictionaries.ar[`tools.${id}.name`]).toBeTruthy();
      expect(dictionaries.en[`tools.${id}.description`]).toBeTruthy();
    }
  });
});
