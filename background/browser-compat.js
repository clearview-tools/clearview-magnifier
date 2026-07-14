const COMPAT_STORAGE_KEY = 'clearviewCompat';

const PATCH_PROFILES = {
  none: {
    id: 'none',
    label: '标准（Chrome / Edge）',
    labelEn: 'Standard (Chrome / Edge)',
    fetchTimeoutMs: 10000,
    captureRetries: 0,
    captureRetryDelayMs: 0,
    translateProviderOrder: ['mymemory', 'google', 'lingva'],
    skipProviders: [],
    extensionsPageUrl: 'chrome://extensions/',
    tips: []
  },
  '360ee': {
    id: '360ee',
    label: '360 极速浏览器',
    labelEn: '360 Speed Browser',
    fetchTimeoutMs: 12000,
    captureRetries: 1,
    captureRetryDelayMs: 150,
    translateProviderOrder: ['mymemory', 'google', 'lingva'],
    skipProviders: [],
    extensionsPageUrl: 'chrome://extensions/',
    tips: [
      '已启用截图重试与略长的网络超时',
      '扩展管理页：chrome://extensions/',
      '请确认浏览器处于极速 / Chromium 模式（闪电图标）',
      '安装或更新扩展后请 F5 刷新网页'
    ]
  },
  '360se': {
    id: '360se',
    label: '360 安全浏览器',
    labelEn: '360 Secure Browser',
    fetchTimeoutMs: 15000,
    captureRetries: 2,
    captureRetryDelayMs: 200,
    translateProviderOrder: ['mymemory', 'lingva', 'google'],
    skipProviders: ['google'],
    extensionsPageUrl: 'se://extensions/',
    tips: [
      '已启用截图多次重试、更长超时，翻译优先 MyMemory（Google 常被拦截）',
      '扩展管理页：se://extensions/',
      '必须使用极速 / Chromium 模式，兼容 / IE 模式不支持扩展',
      '若仍无法加载，请改用 360 极速浏览器或 Chrome',
      '安装或更新扩展后请 F5 刷新网页'
    ]
  }
};

function detectBrowserFamily(userAgent) {
  const ua = (userAgent || '').toUpperCase();
  if (ua.includes('360SE') || (ua.includes('QIHU') && ua.includes('360SE'))) {
    return '360se';
  }
  if (ua.includes('360EE') || (ua.includes('QIHOO') && ua.includes('CHROME'))) {
    return '360ee';
  }
  if (ua.includes('360') && /\bSE\b/.test(ua)) {
    return '360se';
  }
  return 'chrome';
}

function browserFamilyLabel(family) {
  if (family === '360se') return '360 安全浏览器';
  if (family === '360ee') return '360 极速浏览器';
  return 'Chrome / Edge / 其他 Chromium';
}

function resolveEffectivePatchId(detectedFamily, patchPreference) {
  if (patchPreference && patchPreference !== 'auto') {
    return PATCH_PROFILES[patchPreference] ? patchPreference : 'none';
  }
  if (detectedFamily === '360se') return '360se';
  if (detectedFamily === '360ee') return '360ee';
  return 'none';
}

async function getCompatRecord() {
  const data = await chrome.storage.local.get(COMPAT_STORAGE_KEY);
  return data[COMPAT_STORAGE_KEY] || { patchId: 'auto' };
}

async function setCompatPatchId(patchId) {
  const record = await getCompatRecord();
  record.patchId = patchId;
  await chrome.storage.local.set({ [COMPAT_STORAGE_KEY]: record });
  return record;
}

async function getCompatStatus(userAgent) {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const record = await getCompatRecord();
  const detectedFamily = detectBrowserFamily(ua);
  const effectivePatchId = resolveEffectivePatchId(detectedFamily, record.patchId);
  const effective = PATCH_PROFILES[effectivePatchId] || PATCH_PROFILES.none;
  const recommendedPatchId = detectedFamily === '360se'
    ? '360se'
    : detectedFamily === '360ee'
      ? '360ee'
      : 'none';

  return {
    detectedFamily,
    detectedLabel: browserFamilyLabel(detectedFamily),
    patchPreference: record.patchId || 'auto',
    effectivePatchId,
    recommendedPatchId,
    effective,
    profiles: Object.values(PATCH_PROFILES).map((p) => ({
      id: p.id,
      label: p.label,
      labelEn: p.labelEn
    }))
  };
}

function getActiveCompatProfile(userAgent) {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const detectedFamily = detectBrowserFamily(ua);
  const recordPatchId = cachedCompatPatchId;
  const effectivePatchId = resolveEffectivePatchId(detectedFamily, recordPatchId);
  return PATCH_PROFILES[effectivePatchId] || PATCH_PROFILES.none;
}

let cachedCompatPatchId = 'auto';

async function refreshCompatCache() {
  const record = await getCompatRecord();
  cachedCompatPatchId = record.patchId || 'auto';
}

refreshCompatCache();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureWithCompat(tabId, userAgent) {
  const profile = getActiveCompatProfile(userAgent);
  const attempts = 1 + (profile.captureRetries || 0);
  let lastError = null;

  for (let i = 0; i < attempts; i++) {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, {
        format: 'png',
        quality: 100
      });
      if (dataUrl) return { dataUrl };
    } catch (err) {
      lastError = err;
      if (i < attempts - 1 && profile.captureRetryDelayMs) {
        await sleep(profile.captureRetryDelayMs);
      }
    }
  }

  throw lastError || new Error('截图失败，请确认页面为 https 且浏览器为极速模式');
}

function orderTranslateProviders(baseProviders, profile) {
  const order = profile.translateProviderOrder || [];
  const skip = new Set(profile.skipProviders || []);
  const byName = new Map(baseProviders.map((p) => [p.name, p]));
  const ordered = [];

  for (const name of order) {
    if (skip.has(name)) continue;
    const provider = byName.get(name);
    if (provider) ordered.push(provider);
  }

  for (const provider of baseProviders) {
    if (!ordered.includes(provider) && !skip.has(provider.name)) {
      ordered.push(provider);
    }
  }

  return ordered;
}
