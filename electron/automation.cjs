const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { z } = require('zod');

const AUTOMATION_TOOLS = Object.freeze(['smart-scan', 'disk-overview', 'downloads-inventory', 'temp-cleanup-preview', 'system-health']);
const triggerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('daily'), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }).strict(),
  z.object({ kind: z.literal('weekly'), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), dayOfWeek: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']) }).strict(),
  z.object({ kind: z.literal('monthly'), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), dayOfMonth: z.number().int().min(1).max(28) }).strict(),
  z.object({ kind: z.literal('startup') }).strict()
]);
const createSchema = z.object({ toolId: z.enum(AUTOMATION_TOOLS), label: z.string().trim().min(1).max(80), trigger: triggerSchema }).strict();
const scheduleSchema = z.object({ id: z.string().uuid(), toolId: z.enum(AUTOMATION_TOOLS), label: z.string().min(1).max(80), trigger: triggerSchema, enabled: z.boolean(), createdAt: z.string().datetime(), updatedAt: z.string().datetime(), lastRun: z.object({ startedAt: z.string().datetime(), finishedAt: z.string().datetime(), success: z.boolean(), summary: z.record(z.unknown()), warnings: z.array(z.string()), errors: z.array(z.string()) }).nullable() }).strict();
const storeSchema = z.object({ version: z.literal(1), schedules: z.array(scheduleSchema) }).strict();

function taskName(id) { return `KNOuXSmartOrganizer-${id}`; }
function taskArgs(schedule, executable) {
  const command = `"${executable}" "--automation-run=${schedule.id}"`;
  const args = ['/Create', '/TN', taskName(schedule.id), '/TR', command, '/SC'];
  if (schedule.trigger.kind === 'daily') args.push('DAILY', '/ST', schedule.trigger.time);
  if (schedule.trigger.kind === 'weekly') args.push('WEEKLY', '/D', schedule.trigger.dayOfWeek, '/ST', schedule.trigger.time);
  if (schedule.trigger.kind === 'monthly') args.push('MONTHLY', '/D', String(schedule.trigger.dayOfMonth), '/ST', schedule.trigger.time);
  if (schedule.trigger.kind === 'startup') args.push('ONSTART');
  return [...args, '/F'];
}
function safeError(error) { return String(error?.message || 'Windows Task Scheduler request failed.').replace(/[\r\n]+/g, ' ').slice(0, 500); }

function createAutomationStore({ userDataPath, executablePath, runTask = async () => ({ stdout: '', stderr: '' }) }) {
  const target = path.join(userDataPath, 'automations.json');
  async function read() { try { return storeSchema.parse(JSON.parse(await fs.readFile(target, 'utf8'))); } catch { return { version: 1, schedules: [] }; } }
  async function write(value) { const parsed = storeSchema.parse(value); const temp = `${target}.${process.pid}.${Date.now()}.tmp`; await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(temp, JSON.stringify(parsed, null, 2), 'utf8'); await fs.rename(temp, target); return parsed; }
  async function list() { return (await read()).schedules; }
  async function create(input) {
    const requested = createSchema.parse(input); const now = new Date().toISOString(); const schedule = { id: crypto.randomUUID(), ...requested, enabled: true, createdAt: now, updatedAt: now, lastRun: null };
    try { await runTask(taskArgs(schedule, executablePath)); } catch (error) { throw new Error(safeError(error)); }
    const current = await read(); await write({ ...current, schedules: [...current.schedules, schedule] }); return schedule;
  }
  async function remove(id) {
    const parsedId = z.string().uuid().parse(id); const current = await read(); const schedule = current.schedules.find(item => item.id === parsedId); if (!schedule) throw new Error('Automation schedule is unavailable.');
    try { await runTask(['/Delete', '/TN', taskName(parsedId), '/F']); } catch (error) { throw new Error(safeError(error)); }
    await write({ ...current, schedules: current.schedules.filter(item => item.id !== parsedId) }); return true;
  }
  async function setEnabled(id, enabled) {
    const parsedId = z.string().uuid().parse(id); const value = z.boolean().parse(enabled); const current = await read(); const schedule = current.schedules.find(item => item.id === parsedId); if (!schedule) throw new Error('Automation schedule is unavailable.');
    const args = value ? ['/Change', '/TN', taskName(parsedId), '/ENABLE'] : ['/Change', '/TN', taskName(parsedId), '/DISABLE'];
    try { await runTask(args); } catch (error) { throw new Error(safeError(error)); }
    const updated = { ...schedule, enabled: value, updatedAt: new Date().toISOString() }; await write({ ...current, schedules: current.schedules.map(item => item.id === parsedId ? updated : item) }); return updated;
  }
  async function recordRun(id, result) {
    const parsedId = z.string().uuid().parse(id); const current = await read(); const schedule = current.schedules.find(item => item.id === parsedId); if (!schedule) throw new Error('Automation schedule is unavailable.');
    const lastRun = { startedAt: String(result.startedAt), finishedAt: String(result.finishedAt), success: result.success === true, summary: result.summary || {}, warnings: Array.isArray(result.warnings) ? result.warnings.map(String) : [], errors: Array.isArray(result.errors) ? result.errors.map(String) : [] };
    const updated = { ...schedule, lastRun, updatedAt: new Date().toISOString() }; await write({ ...current, schedules: current.schedules.map(item => item.id === parsedId ? updated : item) }); return updated;
  }
  async function find(id) { const parsedId = z.string().uuid().parse(id); return (await read()).schedules.find(item => item.id === parsedId) || null; }
  return { list, create, remove, setEnabled, recordRun, find, taskArgs: schedule => taskArgs(schedule, executablePath) };
}

module.exports = { AUTOMATION_TOOLS, createAutomationStore, taskArgs, taskName };
