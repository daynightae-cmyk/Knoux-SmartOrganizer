import type { WorldId } from './service-catalog';
import type { Text } from './service-preview';

/**
 * What a world guarantees before any of its services is opened.
 *
 * These are boundaries, not features: each line is something the world either
 * reads from Windows or refuses to do. They exist so a category landing says
 * what the category will never do on its own, in the place a person looks
 * before they run anything.
 */
export interface WorldBrief {
  facts: [Text, Text, Text];
  boundary: Text;
}

export const worldBriefs: Partial<Record<WorldId, WorldBrief>> = {
  cleanup: {
    facts: [
      { ar: 'كل ما يخرج من مكانه يمر أولًا بمجلد حجر مستقل.', en: 'Everything that leaves its place goes into a separate quarantine folder first.' },
      { ar: 'الحد العمري يأتي من إعداداتك ولا يُخفَّض بصمت.', en: 'The minimum age comes from your settings and is never lowered silently.' },
      { ar: 'سلة المحذوفات لا تُفرَّغ تلقائيًا في أي مسار.', en: 'The Recycle Bin is never emptied automatically on any path.' }
    ],
    boundary: { ar: 'لا يحذف KNOuX ملفًا بلا سجل يستطيع إرجاعه.', en: 'KNOuX does not delete a file without a journal that can return it.' }
  },
  startup: {
    facts: [
      { ar: 'يقرأ ويكتب مفتاح Run الخاص بالمستخدم الحالي فقط.', en: 'It reads and writes the current user Run key only.' },
      { ar: 'الإيقاف نقل إلى مساحة محفوظة، لا حذف للقيمة.', en: 'Disabling moves the value into a preserved holding area, never deletes it.' },
      { ar: 'لا درجات أثر أو نسب تحسين مُختلقة.', en: 'No impact scores or invented speed-up percentages.' }
    ],
    boundary: { ar: 'لا يلمس بدء تشغيل حساب آخر ولا مهام النظام المحمية.', en: 'It never touches another account startup or a protected system task.' }
  },
  system: {
    facts: [
      { ar: 'الصحة والأحداث والعمليات من ثلاثة محركات مسجّلة.', en: 'Health, events and processes come from three registered engines.' },
      { ar: 'أي لوحة بلا قراءة تبقى فارغة مع محاورها.', en: 'Any panel without a reading stays empty, axes included.' },
      { ar: 'وقت كل قراءة مذكور بجانب قيمتها.', en: 'Every reading carries the time it was taken.' }
    ],
    boundary: { ar: 'لا ينهي عملية ولا يعدّل سجل أحداث.', en: 'It never ends a process and never edits an event log.' }
  },
  repair: {
    facts: [
      { ar: 'ثمانية أوامر Windows حقيقية، كلها تتطلب صلاحية مسؤول.', en: 'Eight real Windows commands, all of them requiring administrator rights.' },
      { ar: 'الأمر الكامل يُعرض قبل التشغيل، لا بعده.', en: 'The full command is shown before it runs, not after.' },
      { ar: 'التحقق خطوة منفصلة عن الإصلاح نفسه.', en: 'Verification is a separate step from the repair itself.' }
    ],
    boundary: { ar: 'لا يصلح شيئًا بلا موافقة صريحة ومسجّلة.', en: 'It repairs nothing without an explicit, recorded approval.' }
  },
  services: {
    facts: [
      { ar: 'الخدمات المحمية ترفض أي تغيير دائمًا.', en: 'Protected services refuse every change, always.' },
      { ar: 'كل تغيير حالة يُقرأ مرة أخرى للتأكيد.', en: 'Every state change is read back to confirm it.' },
      { ar: 'لا حذف خدمة في أي مسار من هذا العالم.', en: 'No service is ever deleted on any path in this world.' }
    ],
    boundary: { ar: 'لا يغيّر خدمة بلا صلاحية مسؤول وسجل تراجع.', en: 'It changes no service without administrator rights and a journal entry.' }
  },
  network: {
    facts: [
      { ar: 'الواجهات والعناوين وDNS تُقرأ من Windows مباشرة.', en: 'Interfaces, addresses and DNS are read straight from Windows.' },
      { ar: 'لا ping ولا traceroute ولا طوبولوجيا مُختلقة.', en: 'No ping, no traceroute, no invented topology.' },
      { ar: 'المنافذ والمحوّلات تُعرض من سجل النظام.', en: 'Ports and adapters come from the system register.' }
    ],
    boundary: { ar: 'لا يرسل حركة إلى خارج جهازك من هذا العالم.', en: 'This world sends no traffic beyond your machine.' }
  },
  hardware: {
    facts: [
      { ar: 'اللوحة والمعالج والذاكرة من WMI مباشرة.', en: 'Board, processor and memory come straight from WMI.' },
      { ar: 'المستشعرات الغائبة تُعلن غيابها بدل قيمة مُقدّرة.', en: 'Missing sensors declare their absence instead of a guessed value.' },
      { ar: 'البطارية من تقرير Windows الرسمي.', en: 'Battery figures come from the official Windows report.' }
    ],
    boundary: { ar: 'لا يخترع قراءة SMART أو حرارة غير موجودة.', en: 'It never invents a SMART reading or a temperature that is not there.' }
  }
};
