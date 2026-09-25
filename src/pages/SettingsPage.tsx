import type { ReactNode } from 'react';
import type { AppSettings } from '@shared/contracts';
import type { Locale } from '../locales';
import { useStore } from '../state/store';

export default function SettingsPage() {
  const { settings, appInfo, update, t } = useStore();
  if (!settings) return <p>{t('common.loading')}</p>;

  const change = <K extends Exclude<keyof AppSettings, 'settingsVersion'>>(section: K, value: AppSettings[K]) => {
    void update({ [section]: value } as Partial<AppSettings>);
  };
  const resetSection = async (section: keyof Omit<AppSettings, 'settingsVersion'>) => {
    update(await window.knoux.resetSettingsSection(section));
  };

  return (
    <section className="settings-page">
      <p className="page-description">{t('settings.subtitle')}</p>
      <SettingsSection title={t('settings.section.general')} resetLabel={t('settings.resetSection')} onReset={() => resetSection('general')}>
        <Toggle label={t('settings.startWithWindows')} checked={settings.general.startWithWindows} onChange={value => change('general', { ...settings.general, startWithWindows: value })} />
        <Toggle label={t('settings.startMinimized')} checked={settings.general.startMinimized} onChange={value => change('general', { ...settings.general, startMinimized: value })} />
        <Toggle label={t('settings.minimizeTray')} checked={settings.general.minimizeToTray} onChange={value => change('general', { ...settings.general, minimizeToTray: value })} />
        <Setting label={t('settings.closeBehavior')}><select value={settings.general.closeBehavior} onChange={e => change('general', { ...settings.general, closeBehavior: e.target.value as AppSettings['general']['closeBehavior'] })}><option value="tray">{t('settings.value.tray')}</option><option value="exit">{t('settings.value.exit')}</option><option value="ask">{t('settings.value.ask')}</option></select></Setting>
        <Toggle label={t('settings.rememberBounds')} checked={settings.general.rememberWindowBounds} onChange={value => change('general', { ...settings.general, rememberWindowBounds: value })} />
        <Toggle label={t('settings.restorePage')} checked={settings.general.restorePreviousPage} onChange={value => change('general', { ...settings.general, restorePreviousPage: value })} />
        <Toggle label={t('settings.confirmExit')} checked={settings.general.confirmExitActiveOperations} onChange={value => change('general', { ...settings.general, confirmExitActiveOperations: value })} />
      </SettingsSection>
      <SettingsSection title={t('settings.section.appearance')} resetLabel={t('settings.resetSection')} onReset={() => resetSection('appearance')}>
        <Setting label={t('settings.theme')}><select value={settings.appearance.theme} onChange={e => change('appearance', { ...settings.appearance, theme: e.target.value as AppSettings['appearance']['theme'] })}><option value="system">{t('common.system')}</option><option value="light">{t('common.light')}</option><option value="dark">{t('common.dark')}</option><option value="high-contrast">{t('settings.value.highContrast')}</option></select></Setting>
        <Setting label={t('settings.accent')}><select value={settings.appearance.accent} onChange={e => change('appearance', { ...settings.appearance, accent: e.target.value as AppSettings['appearance']['accent'] })}>{['violet', 'blue', 'green', 'amber'].map(value => <option key={value} value={value}>{t(`settings.value.${value}`)}</option>)}</select></Setting>
        <Setting label={t('settings.density')}><select value={settings.appearance.density} onChange={e => change('appearance', { ...settings.appearance, density: e.target.value as AppSettings['appearance']['density'] })}><option value="comfortable">{t('common.comfortable')}</option><option value="compact">{t('common.compact')}</option></select></Setting>
        <Setting label={t('settings.fontScale')}><input type="range" min="0.8" max="1.5" step="0.1" value={settings.appearance.fontScale} onChange={e => change('appearance', { ...settings.appearance, fontScale: Number(e.target.value) })} /><output>{Math.round(settings.appearance.fontScale * 100)}%</output></Setting>
        <Toggle label={t('settings.motion')} checked={settings.appearance.reduceMotion} onChange={value => change('appearance', { ...settings.appearance, reduceMotion: value })} />
        <Toggle label={t('settings.transparency')} checked={settings.appearance.transparency} onChange={value => change('appearance', { ...settings.appearance, transparency: value })} />
        <Toggle label={t('settings.animations')} checked={settings.appearance.animations} onChange={value => change('appearance', { ...settings.appearance, animations: value })} />
      </SettingsSection>
      <SettingsSection title={t('settings.section.language')} resetLabel={t('settings.resetSection')} onReset={() => resetSection('localization')}>
        <Setting label={t('settings.language')}><select value={settings.localization.locale} onChange={e => change('localization', { ...settings.localization, locale: e.target.value as Locale })}><option value="ar">العربية</option><option value="en">English</option></select></Setting>
        <Setting label={t('settings.region')}><select value={settings.localization.region} onChange={e => change('localization', { ...settings.localization, region: e.target.value })}><option value="AE">{t('settings.value.ae')}</option><option value="SA">{t('settings.value.sa')}</option><option value="US">{t('settings.value.us')}</option><option value="GB">{t('settings.value.gb')}</option></select></Setting>
        <Setting label={t('settings.dateFormat')}><select value={settings.localization.dateFormat} onChange={e => change('localization', { ...settings.localization, dateFormat: e.target.value as AppSettings['localization']['dateFormat'] })}>{['short', 'medium', 'long'].map(value => <option key={value} value={value}>{t(`settings.value.${value}`)}</option>)}</select></Setting>
        <Setting label={t('settings.timeFormat')}><select value={settings.localization.timeFormat} onChange={e => change('localization', { ...settings.localization, timeFormat: e.target.value as AppSettings['localization']['timeFormat'] })}><option value="short">{t('settings.value.short')}</option><option value="medium">{t('settings.value.medium')}</option></select></Setting>
        <Setting label={t('settings.byteUnits')}><select value={settings.localization.byteUnits} onChange={e => change('localization', { ...settings.localization, byteUnits: e.target.value as AppSettings['localization']['byteUnits'] })}><option value="binary">{t('settings.value.binary')}</option><option value="decimal">{t('settings.value.decimal')}</option></select></Setting>
      </SettingsSection>
      <SettingsSection title={t('settings.section.scanning')} resetLabel={t('settings.resetSection')} onReset={() => resetSection('scanning')}>
        <Toggle label={t('settings.hiddenFiles')} checked={settings.scanning.includeHidden} onChange={value => change('scanning', { ...settings.scanning, includeHidden: value })} />
        <Toggle label={t('settings.systemFiles')} checked={settings.scanning.includeSystem} onChange={value => change('scanning', { ...settings.scanning, includeSystem: value })} />
        <Toggle label={t('settings.removableDisks')} checked={settings.scanning.includeRemovable} onChange={value => change('scanning', { ...settings.scanning, includeRemovable: value })} />
        <Toggle label={t('settings.networkLocations')} checked={settings.scanning.includeNetworkLocations} onChange={value => change('scanning', { ...settings.scanning, includeNetworkLocations: value })} />
        <Setting label={t('settings.duplicate')}><input type="number" min="1" value={Math.round(settings.scanning.minimumDuplicateBytes / 1048576)} onChange={e => change('scanning', { ...settings.scanning, minimumDuplicateBytes: Number(e.target.value) * 1048576 })} /></Setting>
        <Setting label={t('settings.largeFile')}><input type="number" min="1" value={Math.round(settings.scanning.largeFileBytes / 1048576)} onChange={e => change('scanning', { ...settings.scanning, largeFileBytes: Number(e.target.value) * 1048576 })} /></Setting>
        <Setting label={t('settings.scanWorkers')}><input type="number" min="1" max="32" value={settings.scanning.scanWorkers} onChange={e => change('scanning', { ...settings.scanning, scanWorkers: Number(e.target.value) })} /></Setting>
        <Setting label={t('settings.hashWorkers')}><input type="number" min="1" max="16" value={settings.scanning.hashWorkers} onChange={e => change('scanning', { ...settings.scanning, hashWorkers: Number(e.target.value) })} /></Setting>
        <Setting label={t('settings.reparsePolicy')}><select value={settings.scanning.reparsePointPolicy} onChange={e => change('scanning', { ...settings.scanning, reparsePointPolicy: e.target.value as AppSettings['scanning']['reparsePointPolicy'] })}><option value="skip">{t('settings.value.skip')}</option><option value="same-volume">{t('settings.value.sameVolume')}</option></select></Setting>
      </SettingsSection>
      <SettingsSection title={t('settings.section.cleanup')} resetLabel={t('settings.resetSection')} onReset={() => resetSection('cleanup')}>
        <Toggle label={t('settings.recycleDefault')} checked={settings.cleanup.recycleBinByDefault} onChange={value => change('cleanup', { ...settings.cleanup, recycleBinByDefault: value })} />
        <Toggle label={t('settings.destructiveConfirm')} checked={settings.cleanup.confirmDestructive} onChange={value => change('cleanup', { ...settings.cleanup, confirmDestructive: value })} />
        <Setting label={t('settings.minimumAge')}><input type="number" min="0" max="3650" value={settings.cleanup.minimumFileAgeDays} onChange={e => change('cleanup', { ...settings.cleanup, minimumFileAgeDays: Number(e.target.value) })} /></Setting>
        <Toggle label={t('settings.rememberSelection')} checked={settings.cleanup.rememberSelection} onChange={value => change('cleanup', { ...settings.cleanup, rememberSelection: value })} />
        <Toggle label={t('settings.safetyBackup')} checked={settings.cleanup.safetyBackup} onChange={value => change('cleanup', { ...settings.cleanup, safetyBackup: value })} />
      </SettingsSection>
      <SettingsSection title={t('settings.section.performance')} resetLabel={t('settings.resetSection')} onReset={() => resetSection('performance')}>
        <Setting label={t('settings.performanceMode')}><select value={settings.performance.mode} onChange={e => change('performance', { ...settings.performance, mode: e.target.value as AppSettings['performance']['mode'] })}>{['eco', 'balanced', 'performance'].map(value => <option key={value} value={value}>{t(`settings.value.${value}`)}</option>)}</select></Setting>
        <Setting label={t('settings.workerCount')}><input type="number" min="1" max="32" value={settings.performance.workerCount} onChange={e => change('performance', { ...settings.performance, workerCount: Number(e.target.value) })} /></Setting>
        <Setting label={t('settings.ioThrottle')}><select value={settings.performance.ioThrottle} onChange={e => change('performance', { ...settings.performance, ioThrottle: e.target.value as AppSettings['performance']['ioThrottle'] })}>{['low', 'balanced', 'unlimited'].map(value => <option key={value} value={value}>{t(`settings.value.${value}`)}</option>)}</select></Setting>
        <Setting label={t('settings.batteryBehavior')}><select value={settings.performance.batteryBehavior} onChange={e => change('performance', { ...settings.performance, batteryBehavior: e.target.value as AppSettings['performance']['batteryBehavior'] })}>{['pause', 'reduce', 'continue'].map(value => <option key={value} value={value}>{t(`settings.value.${value}`)}</option>)}</select></Setting>
        <Setting label={t('settings.backgroundBehavior')}><select value={settings.performance.backgroundBehavior} onChange={e => change('performance', { ...settings.performance, backgroundBehavior: e.target.value as AppSettings['performance']['backgroundBehavior'] })}>{['continue', 'pause-intensive', 'pause-all'].map(value => <option key={value} value={value}>{t(`settings.value.${value}`)}</option>)}</select></Setting>
      </SettingsSection>
      <SettingsSection title={t('settings.section.privacy')} resetLabel={t('settings.resetSection')} onReset={() => resetSection('privacy')}>
        <Toggle label={t('settings.telemetry')} checked={false} disabled onChange={() => {}} />
        <Toggle label={t('settings.crashReporting')} checked={false} disabled onChange={() => {}} />
        <Toggle label={t('settings.diagnostics')} checked={settings.privacy.diagnostics} onChange={value => change('privacy', { ...settings.privacy, diagnostics: value })} />
        <Toggle label={t('settings.usageAnalytics')} checked={false} disabled onChange={() => {}} />
        <Setting label={t('settings.aiPrivacy')}><output>{t('settings.value.localOnly')}</output></Setting>
      </SettingsSection>
      <SettingsSection title={t('settings.section.notifications')} resetLabel={t('settings.resetSection')} onReset={() => resetSection('notifications')}>
        {(['operationSuccess', 'operationFailure', 'diskWarning', 'scheduledScan', 'update', 'restartRequired'] as const).map(key => <Toggle key={key} label={t(`settings.${key}`)} checked={settings.notifications[key]} onChange={value => change('notifications', { ...settings.notifications, [key]: value })} />)}
      </SettingsSection>
      <SettingsSection title={t('settings.section.automation')} resetLabel={t('settings.resetSection')} onReset={() => resetSection('automation')}>
        <Toggle label={t('settings.automationEnabled')} checked={settings.automation.enabled} onChange={value => change('automation', { ...settings.automation, enabled: value })} />
        <Setting label={t('settings.quietStart')}><input type="time" value={settings.automation.quietHoursStart} onChange={e => change('automation', { ...settings.automation, quietHoursStart: e.target.value })} /></Setting>
        <Setting label={t('settings.quietEnd')}><input type="time" value={settings.automation.quietHoursEnd} onChange={e => change('automation', { ...settings.automation, quietHoursEnd: e.target.value })} /></Setting>
        <Setting label={t('settings.batteryPolicy')}><select value={settings.automation.onBatteryPolicy} onChange={e => change('automation', { ...settings.automation, onBatteryPolicy: e.target.value as AppSettings['automation']['onBatteryPolicy'] })}>{['skip', 'skip-intensive', 'run'].map(value => <option key={value} value={value}>{t(`settings.value.${value}`)}</option>)}</select></Setting>
        <Setting label={t('settings.missedPolicy')}><select value={settings.automation.missedSchedulePolicy} onChange={e => change('automation', { ...settings.automation, missedSchedulePolicy: e.target.value as AppSettings['automation']['missedSchedulePolicy'] })}><option value="skip">{t('settings.value.skip')}</option><option value="run-next-start">{t('settings.value.runNextStart')}</option></select></Setting>
      </SettingsSection>
      <SettingsSection title={t('settings.section.history')} resetLabel={t('settings.resetSection')} onReset={() => resetSection('history')}>
        <Setting label={t('settings.retention')}><input type="number" min="1" max="3650" value={settings.history.retentionDays} onChange={e => change('history', { ...settings.history, retentionDays: Number(e.target.value) })} /></Setting>
        <Toggle label={t('settings.autoCleanup')} checked={settings.history.automaticCleanup} onChange={value => change('history', { ...settings.history, automaticCleanup: value })} />
        <Setting label={t('settings.exportFormat')}><select value={settings.history.exportFormat} onChange={e => change('history', { ...settings.history, exportFormat: e.target.value as AppSettings['history']['exportFormat'] })}><option value="json">JSON</option><option value="csv">CSV</option></select></Setting>
      </SettingsSection>
      <SettingsSection title={t('settings.section.security')} resetLabel={t('settings.resetSection')} onReset={() => resetSection('security')}>
        <Setting label={t('settings.elevationPolicy')}><select value={settings.security.elevationPolicy} onChange={e => change('security', { ...settings.security, elevationPolicy: e.target.value as AppSettings['security']['elevationPolicy'] })}><option value="ask-each-time">{t('settings.value.askEachTime')}</option><option value="deny">{t('settings.value.deny')}</option></select></Setting>
        <Toggle label={t('settings.destructiveConfirm')} checked={settings.security.confirmDestructive} onChange={value => change('security', { ...settings.security, confirmDestructive: value })} />
        <Toggle label={t('settings.externalLinks')} checked={settings.security.confirmExternalLinks} onChange={value => change('security', { ...settings.security, confirmExternalLinks: value })} />
        <Toggle label={t('settings.secureCredentials')} checked={settings.security.secureCredentials} onChange={value => change('security', { ...settings.security, secureCredentials: value })} />
      </SettingsSection>
      <SettingsSection title={t('settings.section.updates')} resetLabel={t('settings.resetSection')} onReset={() => resetSection('updates')}>
        <Toggle label={t('settings.automaticChecks')} checked={settings.updates.automaticChecks} onChange={value => change('updates', { ...settings.updates, automaticChecks: value })} />
        <Setting label={t('settings.updateChannel')}><output>{t('settings.value.stable')}</output></Setting>
        <Setting label={t('settings.currentVersion')}><output>{appInfo?.version || '—'}</output></Setting>
      </SettingsSection>
      <SettingsSection title={t('settings.section.advanced')} resetLabel={t('settings.resetSection')} onReset={() => resetSection('advanced')}>
        <Toggle label={t('settings.diagnosticLogging')} checked={settings.advanced.diagnosticLogging} onChange={value => change('advanced', { ...settings.advanced, diagnosticLogging: value })} />
        <Setting label={t('settings.logLevel')}><select value={settings.advanced.logLevel} onChange={e => change('advanced', { ...settings.advanced, logLevel: e.target.value as AppSettings['advanced']['logLevel'] })}>{['error', 'warn', 'info', 'debug'].map(value => <option key={value} value={value}>{t(`settings.value.${value}`)}</option>)}</select></Setting>
        <Toggle label={t('settings.developerTools')} checked={settings.advanced.developerTools} disabled={import.meta.env.PROD} onChange={value => change('advanced', { ...settings.advanced, developerTools: value })} />
      </SettingsSection>
      <SettingsSection title={t('settings.section.about')}>
        <Setting label={t('settings.currentVersion')}><output>{appInfo?.version || '—'}</output></Setting>
        <Setting label="Electron"><output>{appInfo?.electron || '—'}</output></Setting>
        <Setting label="Chromium"><output>{appInfo?.chromium || '—'}</output></Setting>
        <Setting label={t('settings.license')}><output>MIT</output></Setting>
        <Setting label={t('settings.build')}><output>{appInfo?.isPackaged ? t('settings.value.packaged') : t('settings.value.development')}</output></Setting>
      </SettingsSection>
      <div className="settings-actions">
        <button className="secondary" onClick={() => window.knoux.exportSettings()}>{t('settings.export')}</button>
        <button className="secondary" onClick={async () => { const imported = await window.knoux.importSettings(); if (imported) void update(imported); }}>{t('settings.import')}</button>
        <button className="secondary danger" onClick={async () => update(await window.knoux.resetSettings())}>{t('settings.reset')}</button>
      </div>
    </section>
  );
}

function SettingsSection({ title, resetLabel, onReset, children }: { title: string; resetLabel?: string; onReset?: () => void; children: ReactNode }) {
  return <section className="settings-section"><div className="settings-section-head"><h2>{title}</h2>{onReset && <button className="text-button" onClick={onReset}>{resetLabel}</button>}</div><div className="settings-grid">{children}</div></section>;
}

function Setting({ label, children }: { label: string; children: ReactNode }) {
  return <label className="setting"><span>{label}</span>{children}</label>;
}

function Toggle({ label, checked, disabled = false, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return <label className="setting toggle"><span>{label}</span><input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} /></label>;
}
