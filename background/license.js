const LICENSE_STORAGE_KEY = 'clearviewLicense';
const QUOTA_STORAGE_KEY = 'clearviewTranslateQuota';
const PRO_DAILY_LIMIT = 500;

function normalizeLicenseKey(key) {
  return (key || '').trim().toUpperCase();
}

function isValidLicenseFormat(key) {
  return /^CVPRO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
}

function validateLicenseChecksum(key) {
  const payload = key.replace(/-/g, '');
  const body = payload.slice(0, -4);
  const actual = payload.slice(-4);
  let hash = 0;
  for (let i = 0; i < body.length; i++) {
    hash = (hash * 31 + body.charCodeAt(i)) >>> 0;
  }
  const expected = (hash % 65536).toString(16).toUpperCase().padStart(4, '0');
  return actual === expected;
}

async function fetchRemoteLicenseKeys() {
  const url = typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG.licensesUrl : '';
  if (!url) return [];
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.keys) ? data.keys.map(normalizeLicenseKey) : [];
  } catch {
    return [];
  }
}

async function verifyLicenseKey(key) {
  const normalized = normalizeLicenseKey(key);
  if (!normalized) return { valid: false, error: '请输入 License Key' };
  if (!isValidLicenseFormat(normalized)) {
    return { valid: false, error: '密钥格式应为 CVPRO-XXXX-XXXX-XXXX' };
  }
  if (validateLicenseChecksum(normalized)) return { valid: true };

  const remoteKeys = await fetchRemoteLicenseKeys();
  if (remoteKeys.includes(normalized)) return { valid: true };

  return { valid: false, error: '密钥无效或未授权' };
}

async function getLicenseRecord() {
  const data = await chrome.storage.local.get(LICENSE_STORAGE_KEY);
  return data[LICENSE_STORAGE_KEY] || { active: false, key: '' };
}

async function setLicenseRecord(record) {
  await chrome.storage.local.set({ [LICENSE_STORAGE_KEY]: record });
}

async function isProActive() {
  const record = await getLicenseRecord();
  return !!record.active;
}

async function getProStatus() {
  const isPro = await isProActive();
  const quota = await getTranslateQuota(isPro);
  return {
    isPro,
    dailyLimit: isPro ? PRO_DAILY_LIMIT : 0,
    quotaUsed: quota.used,
    quotaRemaining: isPro ? Math.max(0, PRO_DAILY_LIMIT - quota.used) : 0
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getTranslateQuota(isPro) {
  if (!isPro) return { used: 0, date: todayKey() };
  const data = await chrome.storage.local.get(QUOTA_STORAGE_KEY);
  const quota = data[QUOTA_STORAGE_KEY] || { used: 0, date: todayKey() };
  if (quota.date !== todayKey()) {
    return { used: 0, date: todayKey() };
  }
  return quota;
}

async function consumeTranslateQuota(isPro) {
  if (!isPro) {
    throw new Error('PRO_REQUIRED');
  }
  const quota = await getTranslateQuota(true);
  if (quota.used >= PRO_DAILY_LIMIT) {
    throw new Error('QUOTA_EXCEEDED');
  }
  const next = { used: quota.used + 1, date: todayKey() };
  await chrome.storage.local.set({ [QUOTA_STORAGE_KEY]: next });
  return PRO_DAILY_LIMIT - next.used;
}

async function activateLicense(key) {
  const result = await verifyLicenseKey(key);
  if (!result.valid) return result;

  const normalized = normalizeLicenseKey(key);
  await setLicenseRecord({
    active: true,
    key: normalized,
    activatedAt: Date.now()
  });

  await migrateSettingsToSync();
  return { valid: true, isPro: true };
}

async function deactivateLicense() {
  await migrateSettingsToLocal();
  await setLicenseRecord({ active: false, key: '' });
  return { isPro: false };
}

const SETTING_KEYS = [
  'zoom', 'lensSize', 'shape', 'translateEnabled',
  'sourceLang', 'targetLang', 'readingLine', 'crosshair',
  'linkPreview', 'colorPicker', 'closeOnRelease', 'showHud'
];

async function migrateSettingsToSync() {
  const local = await chrome.storage.local.get(SETTING_KEYS);
  if (Object.keys(local).length) {
    await chrome.storage.sync.set(local);
  }
}

async function migrateSettingsToLocal() {
  const sync = await chrome.storage.sync.get(SETTING_KEYS);
  if (Object.keys(sync).length) {
    await chrome.storage.local.set(sync);
  }
}

async function getSettingsStorageArea() {
  return (await isProActive()) ? chrome.storage.sync : chrome.storage.local;
}
