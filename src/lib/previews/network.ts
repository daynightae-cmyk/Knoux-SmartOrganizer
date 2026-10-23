import type { PreviewText } from '../service-preview';

/**
 * Network — Network Radar.
 *
 * One real read-only engine. No ping, no traceroute, no invented topology: the
 * world shows the interfaces Windows reports and marks the rest unavailable.
 */
export const networkPreviews: Record<string, PreviewText> = {
  'network-interfaces': {
    purpose: { ar: 'معرفة عنوان كل واجهة وحالتها من Windows مباشرة.', en: 'Know each interface address and state, straight from Windows.' },
    steps: [
      { ar: 'يستعلم الواجهات من النظام', en: 'Query the interfaces from the system' },
      { ar: 'يقرأ العناوين والبوابة وDNS', en: 'Read addresses, gateway and DNS' },
      { ar: 'يصنّف المتصلة والمنفصلة', en: 'Classify connected and disconnected' }
    ],
    output: { ar: 'جرد واجهات حقيقي بوقت القراءة، دون اتصال خارجي.', en: 'A real interface inventory with its read time — no external connection.' },
    risk: 'read-only'
  },
  'network-dns-config': {
    purpose: { ar: 'رؤية خوادم DNS التي يستخدمها كل محوّل.', en: 'See the DNS servers each adapter actually uses.' },
    steps: [
      { ar: 'يقرأ خوادم DNS لكل واجهة', en: 'Read the DNS servers per interface' },
      { ar: 'يميّز الثابت من المُستلم تلقائيًا', en: 'Separate static from automatic servers' },
      { ar: 'يعرض ترتيب الاستعلام', en: 'Show the query order' }
    ],
    output: { ar: 'جدول DNS لكل محوّل، للقراءة فقط.', en: 'A read-only DNS table per adapter.' },
    risk: 'read-only'
  },
  'network-adapters': {
    purpose: { ar: 'جرد محوّلات الشبكة بسرعتها ونوعها.', en: 'Inventory network adapters with their speed and type.' },
    steps: [
      { ar: 'يعدّد المحوّلات المادية', en: 'Enumerate the physical adapters' },
      { ar: 'يقرأ السرعة ونوع الوسيط', en: 'Read the link speed and medium' },
      { ar: 'يعرض حالة التشغيل لكل محوّل', en: 'Show the operational state of each' }
    ],
    output: { ar: 'قائمة محوّلات من بيانات الأجهزة الحقيقية.', en: 'An adapter list from the real device data.' },
    risk: 'read-only'
  },
  'network-connectivity': {
    purpose: { ar: 'تشخيص سبب انقطاع الاتصال خطوة بخطوة.', en: 'Diagnose why connectivity fails, one step at a time.' },
    steps: [
      { ar: 'يفحص الواجهة والعنوان والبوابة', en: 'Check interface, address and gateway' },
      { ar: 'يفحص DNS ثم الوصول الخارجي', en: 'Check DNS, then external reach' },
      { ar: 'يذكر أي خطوة لم تُنفّذ بعد', en: 'Name any step not run yet' }
    ],
    output: { ar: 'مسار تشخيص مع نقاط فشل واضحة، دون ادعاء سرعة.', en: 'A diagnostic path with clear failure points — no speed claims.' },
    risk: 'read-only'
  },
  'network-throughput': {
    purpose: { ar: 'قراءة حركة الشبكة اللحظية على هذا الجهاز.', en: 'Read live network traffic on this machine.' },
    steps: [
      { ar: 'يعيّن عدّادات واجهة الشبكة', en: 'Sample the interface counters' },
      { ar: 'يحوّل الفروق إلى معدل', en: 'Turn the deltas into a rate' },
      { ar: 'يرسم بلا خط حتى تصل أول قراءة', en: 'Draw nothing until the first reading arrives' }
    ],
    output: { ar: 'رسم حركة حقيقي، أو فراغ صريح قبل أول قياس.', en: 'A real traffic chart, or an explicit empty state before the first sample.' },
    risk: 'read-only'
  },
  'network-traceroute': {
    purpose: { ar: 'رسم مسار الحزم إلى مضيف تختاره.', en: 'Draw the packet path to a host you choose.' },
    steps: [
      { ar: 'يطلب المضيف الهدف', en: 'Ask for the target host' },
      { ar: 'يعرض خطة الأوامر قبل التنفيذ', en: 'Show the command plan before running' },
      { ar: 'يرسم القفزات كما وردت', en: 'Draw the hops as reported' }
    ],
    output: { ar: 'مسار مبني على قفزات حقيقية، لا خريطة مُختلقة.', en: 'A path built from real hops — never an invented map.' },
    risk: 'read-only',
    inputs: [{ kind: 'text', label: { ar: 'المضيف الهدف', en: 'Target host' }, hint: { ar: 'اسم أو عنوان', en: 'A name or an address' } }]
  },
  'network-topology': {
    purpose: { ar: 'تمثيل علاقة الجهاز بالبوابة والأجهزة المجاورة.', en: 'Represent how this machine relates to its gateway and neighbours.' },
    steps: [
      { ar: 'يقرأ الواجهات والبوابات', en: 'Read interfaces and gateways' },
      { ar: 'يرسم العُقد من بيانات حقيقية فقط', en: 'Draw nodes only from real data' },
      { ar: 'يعلّم الأجهزة غير المكتشفة', en: 'Mark undiscovered devices' }
    ],
    output: { ar: 'طوبولوجيا جزئية صادقة، بلا أجهزة مُتخيَّلة.', en: 'An honest partial topology — no imagined devices.' },
    risk: 'read-only'
  },
  'network-ports': {
    purpose: { ar: 'معرفة المنافذ المستمعة وأي عملية تملكها.', en: 'Know which ports listen and which process owns them.' },
    steps: [
      { ar: 'يقرأ المنافذ المستمعة من النظام', en: 'Read the listening ports from the system' },
      { ar: 'يضيف العملية المالكة لكل منفذ', en: 'Attach the owning process to each port' },
      { ar: 'يميّز المحلي من الخارجي', en: 'Separate loopback from external binds' }
    ],
    output: { ar: 'جدول منافذ حقيقي قابل للتصفية.', en: 'A filterable real port table.' },
    risk: 'read-only'
  },
  'network-wifi': {
    purpose: { ar: 'قراءة الشبكة اللاسلكية المتصلة وإشارتها.', en: 'Read the connected wireless network and its signal.' },
    steps: [
      { ar: 'يقرأ الشبكة المتصلة من النظام', en: 'Read the joined network from the system' },
      { ar: 'يعرض النطاق وقوة الإشارة', en: 'Show the band and signal strength' },
      { ar: 'يعلن غياب اللاسلكي حين لا يوجد', en: 'Declare the absence of wireless when there is none' }
    ],
    output: { ar: 'بطاقة شبكة لاسلكية حقيقية أو حالة "غير متاح".', en: 'A real wireless card, or an honest unavailable state.' },
    risk: 'read-only'
  },
  'network-hosts': {
    purpose: { ar: 'مراجعة ملف hosts قبل تعديله يدويًا.', en: 'Review the hosts file before editing it by hand.' },
    steps: [
      { ar: 'يقرأ الملف ويعرض أسطره', en: 'Read the file and show its lines' },
      { ar: 'يفصل التعيينات المخصصة عن الافتراضية', en: 'Separate custom mappings from defaults' },
      { ar: 'يتيح نسخ سطر لا تعديله', en: 'Let you copy a line, not edit it' }
    ],
    output: { ar: 'عرض للقراءة فقط، مع تحذير قبل أي تعديل يدوي.', en: 'A read-only view, with a warning before any manual edit.' },
    risk: 'read-only'
  },
  'network-proxies': {
    purpose: { ar: 'كشف إعدادات الوكيل التي قد تعترض الاتصال.', en: 'Surface the proxy settings that may intercept connectivity.' },
    steps: [
      { ar: 'يقرأ إعدادات وكيل النظام', en: 'Read the system proxy settings' },
      { ar: 'يعرض الاستثناءات والقائمة', en: 'Show exceptions and the bypass list' },
      { ar: 'يذكر مصدر كل إعداد', en: 'Name the source of each setting' }
    ],
    output: { ar: 'لوحة وكيل للقراءة فقط، مع مصدر كل قيمة.', en: 'A read-only proxy panel with the source of each value.' },
    risk: 'read-only'
  },
  'network-repair-link': {
    purpose: { ar: 'إصلاح آمن لرابط الشبكة دون تغيير إعداداتك.', en: 'Safely repair a network link without changing your settings.' },
    steps: [
      { ar: 'يجمع أدلة الحالة أولًا', en: 'Collect the state evidence first' },
      { ar: 'يعرض إجراءً واحدًا مقترحًا وسببه', en: 'Propose one action and its reason' },
      { ar: 'يطلب موافقة قبل أي تنفيذ', en: 'Ask for approval before executing anything' }
    ],
    output: { ar: 'خطة إصلاح مرتبة، لا تغيير صامت للإعدادات.', en: 'An ordered repair plan — no silent settings change.' },
    risk: 'needs-admin'
  }
};
