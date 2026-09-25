import { useState } from 'react';
import { CalendarClock, Play, Power, Trash2 } from 'lucide-react';
import { formatDateTime } from '../lib/format';
import { useStore } from '../state/store';
import { SectionTitle } from '../components/common';
import type { AutomationSchedule } from '../state/types';

export default function AutomationPage() {
  const { automations, refreshAutomations, setNotice, t, locale } = useStore();
  const [toolId, setToolId] = useState<AutomationSchedule['toolId']>('smart-scan');
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<'daily' | 'weekly' | 'monthly' | 'startup'>('daily');
  const [time, setTime] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState<'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'>('MON');
  const [dayOfMonth, setDayOfMonth] = useState(1);

  const create = async () => {
    try {
      const trigger = kind === 'startup' ? { kind } as const
        : kind === 'weekly' ? { kind, time, dayOfWeek } as const
        : kind === 'monthly' ? { kind, time, dayOfMonth } as const
        : { kind: 'daily', time } as const;
      await window.knoux.createAutomation({ toolId, label: label.trim() || t(`tools.${toolId}.name`), trigger });
      await refreshAutomations();
      setLabel('');
      setNotice(t('automation.created'));
    } catch (error) { setNotice(String((error as Error).message || error)); }
  };

  const toggle = async (schedule: AutomationSchedule) => {
    try {
      await window.knoux.setAutomationEnabled({ id: schedule.id, enabled: !schedule.enabled });
      await refreshAutomations();
    } catch (error) { setNotice(String((error as Error).message || error)); }
  };

  const remove = async (id: string) => {
    try {
      await window.knoux.removeAutomation(id);
      await refreshAutomations();
    } catch (error) { setNotice(String((error as Error).message || error)); }
  };

  const runNow = async (id: string) => {
    try {
      await window.knoux.runAutomation(id);
      await refreshAutomations();
      setNotice(t('automation.ran'));
    } catch (error) { setNotice(String((error as Error).message || error)); }
  };

  return (
    <div className="automation-page">
      <p className="page-description">{t('automation.subtitle')}</p>
      <section className="settings-section">
        <div className="settings-section-head"><h2>{t('automation.create')}</h2></div>
        <div className="settings-grid">
          <label className="setting"><span>{t('automation.name')}</span><input value={label} onChange={e => setLabel(e.target.value)} placeholder={t('automation.name')} /></label>
          <label className="setting"><span>{t('automation.tool')}</span>
            <select value={toolId} onChange={e => setToolId(e.target.value as AutomationSchedule['toolId'])}>
              <option value="smart-scan">{t('tools.smart-scan.name')}</option>
              <option value="disk-overview">{t('tools.disk-overview.name')}</option>
              <option value="downloads-inventory">{t('tools.downloads-inventory.name')}</option>
              <option value="temp-cleanup-preview">{t('tools.temp-cleanup-preview.name')}</option>
              <option value="system-health">{t('tools.system-health.name')}</option>
            </select>
          </label>
          <label className="setting"><span>{t('automation.trigger')}</span>
            <select value={kind} onChange={e => setKind(e.target.value as typeof kind)}>
              <option value="daily">{t('automation.daily')}</option>
              <option value="weekly">{t('automation.weekly')}</option>
              <option value="monthly">{t('automation.monthly')}</option>
              <option value="startup">{t('automation.startup')}</option>
            </select>
          </label>
          {kind !== 'startup' && <label className="setting"><span>{t('automation.time')}</span><input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>}
          {kind === 'weekly' && <label className="setting"><span>{t('automation.day')}</span>
            <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value as typeof dayOfWeek)}>
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => <option key={day} value={day}>{t(`automation.day.${day}`)}</option>)}
            </select>
          </label>}
          {kind === 'monthly' && <label className="setting"><span>{t('automation.day')}</span><input type="number" min={1} max={28} value={dayOfMonth} onChange={e => setDayOfMonth(Math.max(1, Math.min(28, Number(e.target.value) || 1)))} /></label>}
        </div>
        <button className="primary" onClick={create}><CalendarClock size={16} />{t('automation.create')}</button>
      </section>
      <section className="section">
        <SectionTitle title={t('nav.automation')} subtitle={`${automations.length}`} />
        {automations.length === 0 ? (
          <p className="muted">{t('automation.empty')}</p>
        ) : (
          <div className="automation-list">
            {automations.map(schedule => (
              <article key={schedule.id} className="automation-card">
                <div>
                  <strong>{schedule.label}</strong>
                  <small dir="ltr">{schedule.toolId} · {describeTrigger(schedule)}</small>
                  {schedule.lastRun && <small>{formatDateTime(schedule.lastRun.finishedAt, locale)} · {schedule.lastRun.success ? t('history.success') : t('history.error')}</small>}
                </div>
                <div className="automation-actions">
                  <button className="icon-button" onClick={() => toggle(schedule)} aria-label={t('automation.toggle')} title={t('automation.toggle')}><Power size={16} /></button>
                  <button className="icon-button" onClick={() => runNow(schedule.id)} aria-label={t('automation.runNow')} title={t('automation.runNow')}><Play size={16} /></button>
                  <button className="icon-button danger" onClick={() => remove(schedule.id)} aria-label={t('automation.remove')} title={t('automation.remove')}><Trash2 size={16} /></button>
                  <span className={schedule.enabled ? 'pill ok' : 'pill muted'}>{schedule.enabled ? t('common.on') : t('common.off')}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function describeTrigger(schedule: AutomationSchedule): string {
  const trigger = schedule.trigger as { kind: string; time?: string; dayOfWeek?: string; dayOfMonth?: number };
  if (trigger.kind === 'startup') return 'startup';
  if (trigger.kind === 'weekly') return `weekly ${trigger.dayOfWeek ?? ''} ${trigger.time ?? ''}`;
  if (trigger.kind === 'monthly') return `monthly ${trigger.dayOfMonth ?? ''} ${trigger.time ?? ''}`;
  return `daily ${trigger.time ?? ''}`;
}
