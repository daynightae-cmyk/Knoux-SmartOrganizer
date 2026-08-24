const TYPE_GROUPS = Object.freeze({
  Images: new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.svg', '.bmp', '.tif', '.tiff', '.raw']),
  Video: new Set(['.mp4', '.mkv', '.mov', '.avi', '.webm', '.wmv', '.m4v']),
  Audio: new Set(['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.wma']),
  Documents: new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.csv', '.md']),
  Archives: new Set(['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz']),
  Installers: new Set(['.exe', '.msi', '.msix', '.appx', '.appxbundle']),
  Development: new Set(['.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsx', '.py', '.java', '.cs', '.cpp', '.c', '.h', '.rs', '.go', '.php', '.json', '.html', '.css', '.scss', '.sql', '.yaml', '.yml']),
  Databases: new Set(['.db', '.sqlite', '.sqlite3', '.mdb', '.accdb']),
  Fonts: new Set(['.ttf', '.otf', '.woff', '.woff2'])
});

function pathSegments(value) {
  return String(value || '').split(/[\\/]+/).filter(Boolean);
}

function portableBasename(value) {
  const segments = pathSegments(value);
  return segments.at(-1) || '';
}

function portableExtension(value) {
  const name = portableBasename(value);
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? '' : name.slice(dot).toLowerCase();
}

function relativeSegments(root, filePath) {
  const rootParts = pathSegments(root);
  const fileParts = pathSegments(filePath);
  if (!rootParts.length) return fileParts;
  const rootMatches = rootParts.every((part, index) => String(fileParts[index] || '').toLowerCase() === part.toLowerCase());
  return rootMatches ? fileParts.slice(rootParts.length) : fileParts;
}

function classifyFileType(filePath) {
  const ext = portableExtension(filePath);
  for (const [group, extensions] of Object.entries(TYPE_GROUPS)) if (extensions.has(ext)) return group;
  return ext ? 'Other' : 'No extension';
}

function ageBucket(modifiedAt, now = Date.now()) {
  const timestamp = new Date(modifiedAt).getTime();
  if (!Number.isFinite(timestamp)) return 'unknown';
  const days = Math.max(0, (now - timestamp) / 86400000);
  if (days < 1) return 'today';
  if (days < 7) return 'week';
  if (days < 30) return 'month';
  if (days < 90) return 'quarter';
  if (days < 365) return 'year';
  return 'older';
}

function increment(map, key, bytes = 0) {
  const current = map.get(key) || { files: 0, bytes: 0 };
  current.files += 1;
  current.bytes += Number(bytes) || 0;
  map.set(key, current);
}

function ranked(map, keyName) {
  return [...map.entries()]
    .map(([key, value]) => ({ [keyName]: key, files: value.files, bytes: value.bytes }))
    .sort((a, b) => b.bytes - a.bytes || b.files - a.files || String(a[keyName]).localeCompare(String(b[keyName])));
}

function buildStorageIntelligence(files, root, now = Date.now()) {
  const safeFiles = Array.isArray(files) ? files : [];
  const typeMap = new Map();
  const ageMap = new Map();
  const extensionMap = new Map();
  const folderMap = new Map();
  let totalBytes = 0;

  for (const file of safeFiles) {
    const size = Number(file?.size) || 0;
    const filePath = String(file?.path || '');
    totalBytes += size;
    increment(typeMap, classifyFileType(filePath), size);
    increment(ageMap, ageBucket(file?.modifiedAt, now), size);
    increment(extensionMap, portableExtension(filePath) || '(none)', size);
    const segments = relativeSegments(root, filePath);
    const bucket = segments.length > 1 ? segments[0] : '(root)';
    increment(folderMap, bucket, size);
  }

  const typeGroups = ranked(typeMap, 'type').map(item => ({ ...item, percentBytes: totalBytes ? Math.round((item.bytes / totalBytes) * 1000) / 10 : 0 }));
  return {
    files: safeFiles.length,
    totalBytes,
    typeGroups,
    ageBuckets: ranked(ageMap, 'age'),
    extensionGroups: ranked(extensionMap, 'extension').slice(0, 25),
    topFolders: ranked(folderMap, 'folder').slice(0, 25)
  };
}

function pathDepth(filePath) {
  return pathSegments(filePath).length;
}

function protectedPath(filePath) {
  return /(?:^|[\\/])(windows|program files(?: \(x86\))?|programdata)(?:[\\/]|$)/i.test(String(filePath || ''));
}

function enrichDuplicateGroups(groups) {
  const safeGroups = Array.isArray(groups) ? groups : [];
  let reclaimableBytes = 0;
  const items = safeGroups.map(group => {
    const files = Array.isArray(group?.files) ? [...group.files] : [];
    files.sort((a, b) => {
      const protectedDelta = Number(protectedPath(a.path)) - Number(protectedPath(b.path));
      if (protectedDelta !== 0) return protectedDelta;
      const depthDelta = pathDepth(a.path) - pathDepth(b.path);
      if (depthDelta !== 0) return depthDelta;
      const createdDelta = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      if (Number.isFinite(createdDelta) && createdDelta !== 0) return createdDelta;
      return String(a.path || '').localeCompare(String(b.path || ''));
    });
    const recommendedKeeper = files[0] || null;
    const reviewFiles = files.slice(1);
    const groupReclaimable = Number(group?.reclaimableBytes) || ((Number(group?.size) || 0) * Math.max(0, files.length - 1));
    reclaimableBytes += groupReclaimable;
    return {
      ...group,
      count: files.length,
      files,
      recommendedKeeper,
      reviewFiles,
      reclaimableBytes: groupReclaimable,
      reviewRequired: true,
      risk: files.some(file => protectedPath(file.path)) ? 'high' : 'normal',
      keeperPolicy: 'prefer non-protected path, then shortest path, then oldest stable copy'
    };
  });
  return { items, summary: { duplicateGroups: items.length, duplicateFiles: items.reduce((sum, item) => sum + item.count, 0), reclaimableBytes, reviewRequired: items.length > 0 } };
}

function privacyExposure(files) {
  const safeFiles = Array.isArray(files) ? files : [];
  const findings = [];
  const categories = new Map();
  const patterns = [
    { category: 'environment-config', test: name => /^\.env(?:\.|$)/i.test(name) },
    { category: 'private-key', test: name => /(?:^id_(?:rsa|dsa|ecdsa|ed25519)$|\.(?:pem|key)$)/i.test(name) },
    { category: 'certificate-bundle', test: name => /\.(?:pfx|p12)$/i.test(name) },
    { category: 'credential-config', test: name => /^(?:credentials?|secrets?|auth|tokens?)(?:[._-].*)?\.(?:json|ya?ml|ini|conf|txt)$/i.test(name) },
    { category: 'wallet-data', test: name => /^(?:wallet\.dat|keystore(?:\..*)?)$/i.test(name) }
  ];

  for (const file of safeFiles) {
    const name = portableBasename(file?.path);
    const matched = patterns.find(pattern => pattern.test(name));
    if (!matched) continue;
    const record = { path: file.path, name, category: matched.category, size: Number(file?.size) || 0, modifiedAt: file?.modifiedAt || null, metadataOnly: true };
    findings.push(record);
    increment(categories, matched.category, record.size);
  }

  return {
    items: findings.sort((a, b) => b.size - a.size).slice(0, 200),
    summary: {
      exposureCount: findings.length,
      exposureBytes: findings.reduce((sum, item) => sum + item.size, 0),
      categories: ranked(categories, 'category'),
      metadataOnly: true,
      contentsInspected: false
    }
  };
}

function clusterEventWarnings(events) {
  const safeEvents = Array.isArray(events) ? events.filter(Boolean) : [];
  const groups = new Map();
  for (const event of safeEvents) {
    const provider = String(event.ProviderName || event.providerName || 'Unknown');
    const id = String(event.Id ?? event.id ?? 'Unknown');
    const level = String(event.LevelDisplayName || event.levelDisplayName || 'Unknown');
    const key = `${provider}\u0000${id}\u0000${level}`;
    const current = groups.get(key) || { provider, id, level, count: 0, latestAt: null, sample: null };
    current.count += 1;
    const time = event.TimeCreated || event.timeCreated || null;
    if (!current.latestAt || (time && new Date(time).getTime() > new Date(current.latestAt).getTime())) current.latestAt = time;
    if (!current.sample && event.Message) current.sample = String(event.Message).replace(/\s+/g, ' ').slice(0, 300);
    groups.set(key, current);
  }
  const clusters = [...groups.values()].sort((a, b) => b.count - a.count || String(b.latestAt || '').localeCompare(String(a.latestAt || '')));
  return {
    items: clusters,
    summary: {
      events: safeEvents.length,
      recurringClusters: clusters.filter(item => item.count > 1).length,
      uniqueClusters: clusters.length,
      topProvider: clusters[0]?.provider || null,
      topEventId: clusters[0]?.id || null
    }
  };
}

function analyzeInstalledApps(apps) {
  const safeApps = Array.isArray(apps) ? apps.filter(Boolean) : [];
  const names = new Map();
  const publishers = new Map();
  let missingUninstallCommand = 0;
  let missingInstallLocation = 0;
  for (const app of safeApps) {
    const name = String(app.name || '').trim();
    const key = `${name.toLowerCase()}\u0000${String(app.version || '').toLowerCase()}`;
    names.set(key, (names.get(key) || 0) + 1);
    const publisher = String(app.publisher || '').trim() || 'Unknown';
    publishers.set(publisher, (publishers.get(publisher) || 0) + 1);
    if (!String(app.uninstallString || '').trim()) missingUninstallCommand += 1;
    if (!String(app.installLocation || '').trim()) missingInstallLocation += 1;
  }
  return {
    applications: safeApps.length,
    duplicateRegistrations: [...names.values()].filter(count => count > 1).reduce((sum, count) => sum + count - 1, 0),
    missingUninstallCommand,
    missingInstallLocation,
    publishers: [...publishers.entries()].map(([publisher, count]) => ({ publisher, count })).sort((a, b) => b.count - a.count).slice(0, 15)
  };
}

function diskPressure(disks) {
  const safe = Array.isArray(disks) ? disks.filter(Boolean) : [];
  return safe.map(disk => {
    const total = Number(disk.Size) || 0;
    const free = Number(disk.FreeSpace) || 0;
    const freePercent = total > 0 ? Math.round((free / total) * 1000) / 10 : null;
    const pressure = freePercent === null ? 'unknown' : freePercent < 5 ? 'critical' : freePercent < 10 ? 'high' : freePercent < 20 ? 'medium' : 'healthy';
    return { ...disk, freePercent, usedBytes: Math.max(0, total - free), pressure };
  });
}

function buildSmartScore({ health = {}, disks = [], duplicateSummary = {}, privacySummary = {}, tempEligibleBytes = 0 }) {
  let score = 100;
  const reasons = [];
  const memory = Number(health.memoryUsedPercent) || 0;
  if (memory > 90) { score -= 15; reasons.push('high-memory-pressure'); }
  else if (memory > 80) { score -= 8; reasons.push('memory-pressure'); }
  const pressured = diskPressure(disks).filter(disk => ['critical', 'high'].includes(disk.pressure));
  if (pressured.some(disk => disk.pressure === 'critical')) { score -= 25; reasons.push('critical-disk-pressure'); }
  else if (pressured.length) { score -= 15; reasons.push('disk-pressure'); }
  const reclaimable = Number(duplicateSummary.reclaimableBytes) || 0;
  if (reclaimable >= 10 * 1024 ** 3) { score -= 10; reasons.push('large-duplicate-footprint'); }
  else if (reclaimable >= 1024 ** 3) { score -= 5; reasons.push('duplicate-footprint'); }
  const exposures = Number(privacySummary.exposureCount) || 0;
  if (exposures > 0) { score -= Math.min(15, 3 + exposures); reasons.push('privacy-review'); }
  if ((Number(tempEligibleBytes) || 0) >= 5 * 1024 ** 3) { score -= 5; reasons.push('large-temp-footprint'); }
  return { score: Math.max(0, score), reasons };
}

module.exports = {
  classifyFileType,
  ageBucket,
  buildStorageIntelligence,
  enrichDuplicateGroups,
  privacyExposure,
  clusterEventWarnings,
  analyzeInstalledApps,
  diskPressure,
  buildSmartScore
};
