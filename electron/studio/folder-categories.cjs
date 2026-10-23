'use strict';

/**
 * Read-only classification table for Studio.
 * Canonical copy of the rules mirrored in src/studio/lib/categorize.ts.
 * tests/node/categories.test.cjs asserts both tables expose the same category keys
 * and the same extension -> category mapping, so they cannot drift silently.
 */

const CATEGORY_ORDER = [
  'image',
  'video',
  'audio',
  'document',
  'spreadsheet',
  'presentation',
  'pdf',
  'archive',
  'installer',
  'code',
  'markup',
  'config',
  'font',
  'design',
  'model',
  'ebook',
  'discImage',
  'other',
];

const CATEGORY_LABELS = {
  image: { ar: 'صور', en: 'Images' },
  video: { ar: 'فيديو', en: 'Videos' },
  audio: { ar: 'صوت', en: 'Audio' },
  document: { ar: 'مستندات', en: 'Documents' },
  spreadsheet: { ar: 'جداول', en: 'Spreadsheets' },
  presentation: { ar: 'عروض', en: 'Presentations' },
  pdf: { ar: 'ملفات PDF', en: 'PDF files' },
  archive: { ar: 'أرشيف', en: 'Archives' },
  installer: { ar: 'تثبيتات', en: 'Installers' },
  code: { ar: 'كود', en: 'Code' },
  markup: { ar: 'تصفح ويب', en: 'Web files' },
  config: { ar: 'إعدادات', en: 'Config' },
  font: { ar: 'خطوط', en: 'Fonts' },
  design: { ar: 'تصميم', en: 'Design' },
  model: { ar: 'نماذج ثلاثية', en: '3D models' },
  ebook: { ar: 'كتب', en: 'E-books' },
  discImage: { ar: 'صور أقراص', en: 'Disc images' },
  other: { ar: 'أخرى', en: 'Other' },
};

/** Extension (lower-case, no dot) -> category key. */
const EXTENSION_CATEGORY = {
  // image
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', bmp: 'image',
  tif: 'image', tiff: 'image', heic: 'image', heif: 'image', avif: 'image', ico: 'image',
  svg: 'image', jfif: 'image', raw: 'image', cr2: 'image', nef: 'image', arw: 'image',
  dng: 'image', apng: 'image',
  // video
  mp4: 'video', mkv: 'video', mov: 'video', avi: 'video', webm: 'video', m4v: 'video',
  wmv: 'video', flv: 'video', mpg: 'video', mpeg: 'video', '3gp': 'video', m2ts: 'video', mts: 'video',
  vob: 'video', h264: 'video', hevc: 'video',
  // audio
  mp3: 'audio', wav: 'audio', flac: 'audio', aac: 'audio', ogg: 'audio', m4a: 'audio',
  opus: 'audio', wma: 'audio', aiff: 'audio', amr: 'audio', m4b: 'audio', mid: 'audio',
  midi: 'audio',
  // document
  doc: 'document', docx: 'document', rtf: 'document', odt: 'document', txt: 'document',
  md: 'document', markdown: 'document', log: 'document', nfo: 'document', wpd: 'document',
  pages: 'document', epub: 'ebook', mobi: 'ebook', azw3: 'ebook', djvu: 'ebook', fb2: 'ebook',
  // spreadsheet / presentation / pdf
  xls: 'spreadsheet', xlsx: 'spreadsheet', xlsm: 'spreadsheet', csv: 'spreadsheet',
  tsv: 'spreadsheet', ods: 'spreadsheet',
  ppt: 'presentation', pptx: 'presentation', potx: 'presentation', odp: 'presentation', key: 'presentation',
  pdf: 'pdf',
  // archive
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
  bz2: 'archive', xz: 'archive', zst: 'archive', lz4: 'archive', tgz: 'archive',
  apk: 'installer', xapk: 'installer',
  // installer
  exe: 'installer', msi: 'installer', msix: 'installer', appx: 'installer',
  dmg: 'installer', iso: 'discImage', img: 'discImage',
  // code
  js: 'code', mjs: 'code', cjs: 'code', ts: 'code', tsx: 'code', jsx: 'code',
  py: 'code', rb: 'code', go: 'code', rs: 'code', java: 'code', kt: 'code', swift: 'code',
  c: 'code', h: 'code', cpp: 'code', hpp: 'code', cs: 'code', php: 'code', lua: 'code',
  sh: 'code', bash: 'code', ps1: 'code', bat: 'code', cmd: 'code', sql: 'code', dart: 'code',
  // markup / config
  html: 'markup', htm: 'markup', css: 'markup', scss: 'markup', less: 'markup', vue: 'markup', svelte: 'markup',
  json: 'config', yaml: 'config', yml: 'config', toml: 'config', ini: 'config',
  xml: 'config', env: 'config', conf: 'config', lock: 'config',
  // font / design
  ttf: 'font', otf: 'font', woff: 'font', woff2: 'font', eot: 'font', fnt: 'font',
  psd: 'design', ai: 'design', sketch: 'design', fig: 'design', xcf: 'design', cdr: 'design',
  blend: 'design', fbx: 'model', glb: 'model',
};

/** Names that are meaningful without an extension. */
const SPECIAL_FILENAMES = {
  dockerfile: 'code',
  makefile: 'code',
  '.gitignore': 'config',
  '.editorconfig': 'config',
  '.env': 'config',
};

function extensionOf(fileName) {
  const base = String(fileName || '');
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return '';
  const ext = base.slice(dot + 1).toLowerCase();
  return /^[a-z0-9+._-]{1,12}$/.test(ext) ? ext : '';
}

function categoryForFileName(fileName) {
  const base = String(fileName || '');
  const lowered = base.toLowerCase();
  if (SPECIAL_FILENAMES[lowered]) return SPECIAL_FILENAMES[lowered];
  const ext = extensionOf(base);
  if (ext && EXTENSION_CATEGORY[ext]) return EXTENSION_CATEGORY[ext];
  return 'other';
}

function categoryForPath(filePath) {
  const path = require('node:path');
  return categoryForFileName(path.basename(String(filePath || '')));
}

function labelFor(category, locale) {
  const entry = CATEGORY_LABELS[category] || CATEGORY_LABELS.other;
  return locale === 'en' ? entry.en : entry.ar;
}

function createCategoryAccumulator() {
  const map = new Map();
  for (const key of CATEGORY_ORDER) map.set(key, { category: key, files: 0, bytes: 0 });
  return map;
}

function finalizeCategories(map) {
  const list = [];
  for (const stat of map.values()) {
    if (stat.files === 0 && stat.bytes === 0) continue;
    list.push({ category: stat.category, files: stat.files, bytes: stat.bytes });
  }
  list.sort((a, b) => b.files - a.files || b.bytes - a.bytes || a.category.localeCompare(b.category));
  return list;
}

module.exports = {
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  EXTENSION_CATEGORY,
  SPECIAL_FILENAMES,
  extensionOf,
  categoryForFileName,
  categoryForPath,
  labelFor,
  createCategoryAccumulator,
  finalizeCategories,
};
