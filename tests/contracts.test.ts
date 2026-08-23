import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../shared/contracts';
import { dictionaries } from '../src/locales';

describe('settings contract', () => {
  it('starts with a versioned, privacy-preserving local configuration', () => {
    expect(defaultSettings.settingsVersion).toBe(1);
    expect(defaultSettings.privacy.telemetry).toBe(false);
    expect(defaultSettings.privacy.crashReports).toBe(false);
    expect(defaultSettings.scan.followReparsePoints).toBe(false);
  });
});

describe('localization contract', () => {
  it('keeps Arabic and English key coverage identical', () => {
    expect(Object.keys(dictionaries.ar).sort()).toEqual(Object.keys(dictionaries.en).sort());
  });

  it('contains localized labels for every registered renderer tool key', () => {
    for (const id of ['system-health', 'smart-scan', 'disk-overview', 'large-files', 'duplicate-files', 'empty-folders', 'downloads-inventory', 'temp-cleanup-preview', 'startup-items', 'installed-apps', 'network-diagnostics', 'hardware-inventory', 'event-warnings', 'file-hash']) {
      expect(dictionaries.ar[`tools.${id}.name`]).toBeTruthy();
      expect(dictionaries.en[`tools.${id}.description`]).toBeTruthy();
    }
  });
});
