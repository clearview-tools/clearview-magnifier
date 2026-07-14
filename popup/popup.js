const DEFAULTS = {
  zoom: 2.5,
  lensSize: 220,
  shape: 'circle',
  translateEnabled: false,
  sourceLang: 'auto',
  targetLang: 'zh-CN',
  readingLine: true,
  crosshair: true,
  linkPreview: true,
  colorPicker: true,
  closeOnRelease: false,
  showHud: true
};

const fields = [
  'zoom', 'lensSize', 'shape', 'translateEnabled',
  'sourceLang', 'targetLang', 'readingLine', 'crosshair',
  'linkPreview', 'colorPicker', 'closeOnRelease', 'showHud'
];

let saveTimer = null;
let isPro = false;
let settingsStorage = chrome.storage.local;

async function applySiteLinks() {
  try {
    const site = await chrome.runtime.sendMessage({ type: 'get-site-config' });
    const purchaseLink = document.getElementById('purchaseLink');
    if (purchaseLink && site?.purchaseUrl) {
      purchaseLink.href = site.purchaseUrl;
      purchaseLink.hidden = false;
    }
    const freeHint = document.getElementById('freeHint');
    if (freeHint && site?.purchaseUrl) {
      freeHint.textContent = '购买 Pro 后在此输入 License 激活';
    }
  } catch {
    /* 忽略 */
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await applySiteLinks();
  await refreshProUI();
  await refreshCompatUI();
  await loadSettings();
  bindSettingsEvents();
  bindProEvents();
  bindCompatEvents();
});

async function refreshProUI() {
  const status = await chrome.runtime.sendMessage({ type: 'get-pro-status' });
  isPro = !!status?.isPro;

  const badge = document.getElementById('planBadge');
  const proDetails = document.getElementById('proDetails');
  const freeHint = document.getElementById('freeHint');
  const translateSection = document.getElementById('translateSection');

  if (badge) {
    badge.textContent = isPro ? 'Pro' : '免费版';
    badge.className = isPro ? 'plan-badge plan-pro' : 'plan-badge plan-free';
  }
  if (proDetails) {
    if (isPro) {
      const expiry = status.expiresAt ? formatDate(status.expiresAt) : '';
      proDetails.textContent = `Pro 剩余 ${status.daysRemaining} 天（至 ${expiry}）· 翻译今日剩余 ${status.quotaRemaining}/${status.dailyLimit} 次`;
    } else if (status.licenseExpired) {
      proDetails.textContent = 'Pro 已到期，请续购 License 后重新激活';
    } else {
      proDetails.textContent = '升级 Pro 解锁实时翻译、优先 API、更高额度与设置云同步（License 有效期 1 年）';
    }
  }
  if (freeHint) freeHint.hidden = isPro;
  if (translateSection) translateSection.classList.toggle('pro-locked', !isPro);

  const translateEnabled = document.getElementById('translateEnabled');
  if (translateEnabled) {
    translateEnabled.disabled = !isPro;
    if (!isPro) translateEnabled.checked = false;
  }
}

async function getSettingsStorage() {
  const result = await chrome.runtime.sendMessage({ type: 'get-settings-storage' });
  return result?.area === 'sync' ? chrome.storage.sync : chrome.storage.local;
}

async function loadSettings() {
  settingsStorage = await getSettingsStorage();
  const stored = await settingsStorage.get(DEFAULTS);

  for (const key of fields) {
    const el = document.getElementById(key);
    if (!el) continue;
    if (el.type === 'checkbox') {
      el.checked = key === 'translateEnabled' && !isPro ? false : !!stored[key];
    } else {
      el.value = stored[key];
    }
  }

  updateLabels(stored);
}

function bindSettingsEvents() {
  for (const key of fields) {
    const el = document.getElementById(key);
    if (!el) continue;
    el.addEventListener('change', saveSettings);
    if (el.type === 'range') {
      el.addEventListener('input', () => {
        updateLabels({ [key]: parseFloat(el.value) });
        scheduleSave();
      });
    }
  }
}

function bindProEvents() {
  document.getElementById('activateLicense')?.addEventListener('click', activateLicense);
  document.getElementById('deactivateLicense')?.addEventListener('click', deactivateLicense);
}

async function refreshCompatUI() {
  const status = await chrome.runtime.sendMessage({
    type: 'get-compat-status',
    userAgent: navigator.userAgent
  });
  if (!status) return;

  const detectEl = document.getElementById('compatDetect');
  const patchSelect = document.getElementById('compatPatch');
  const tipsEl = document.getElementById('compatTips');
  const applyBtn = document.getElementById('applyRecommendedPatch');
  const extLink = document.getElementById('compatExtensionsLink');

  const activeLabel = status.effective?.label || '标准';
  const prefLabel = status.patchPreference === 'auto' ? '自动' : activeLabel;

  if (detectEl) {
    detectEl.textContent = `当前浏览器：${status.detectedLabel} · 补丁：${prefLabel}（生效：${activeLabel}）`;
  }

  if (patchSelect) {
    patchSelect.value = status.patchPreference || 'auto';
  }

  if (tipsEl) {
    tipsEl.innerHTML = '';
    const tips = status.effective?.tips || [];
    for (const tip of tips) {
      const li = document.createElement('li');
      li.textContent = tip;
      tipsEl.appendChild(li);
    }
    if (!tips.length && status.detectedFamily === 'chrome') {
      const li = document.createElement('li');
      li.textContent = '未检测到 360 浏览器，使用标准模式即可。';
      tipsEl.appendChild(li);
    }
  }

  const needsRecommend = status.detectedFamily !== 'chrome'
    && status.effectivePatchId !== status.recommendedPatchId;
  if (applyBtn) {
    applyBtn.hidden = !needsRecommend;
    if (needsRecommend) {
      const name = status.recommendedPatchId === '360se'
        ? '360 安全浏览器'
        : status.recommendedPatchId === '360ee'
          ? '360 极速浏览器'
          : '标准';
      applyBtn.textContent = `应用推荐：${name}补丁`;
    }
  }

  if (extLink && status.effective?.extensionsPageUrl) {
    extLink.href = status.effective.extensionsPageUrl;
    extLink.hidden = status.detectedFamily === 'chrome';
    extLink.textContent = status.detectedFamily === '360se'
      ? '打开 se://extensions/'
      : '打开 chrome://extensions/';
  }
}

function bindCompatEvents() {
  const patchSelect = document.getElementById('compatPatch');
  const applyBtn = document.getElementById('applyRecommendedPatch');

  patchSelect?.addEventListener('change', async () => {
    await chrome.runtime.sendMessage({
      type: 'set-compat-patch',
      patchId: patchSelect.value
    });
    await refreshCompatUI();
    notifyTabsCompatUpdated();
  });

  applyBtn?.addEventListener('click', async () => {
    const status = await chrome.runtime.sendMessage({
      type: 'get-compat-status',
      userAgent: navigator.userAgent
    });
    const patchId = status?.recommendedPatchId || 'none';
    const patchSelect = document.getElementById('compatPatch');
    if (patchSelect) patchSelect.value = patchId;
    await chrome.runtime.sendMessage({ type: 'set-compat-patch', patchId });
    await refreshCompatUI();
    notifyTabsCompatUpdated();
  });
}

async function notifyTabsCompatUpdated() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'compat-updated' }).catch(() => {});
    }
  }
}

function updateLabels(data) {
  const zoomVal = document.getElementById('zoomVal');
  const lensSizeVal = document.getElementById('lensSizeVal');
  if (zoomVal && data.zoom !== undefined) zoomVal.textContent = `${data.zoom}x`;
  if (lensSizeVal && data.lensSize !== undefined) lensSizeVal.textContent = `${data.lensSize}px`;
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSettings, 120);
}

async function saveSettings() {
  if (!isPro) {
    const translateEnabled = document.getElementById('translateEnabled');
    if (translateEnabled) translateEnabled.checked = false;
  }

  const settings = {};
  for (const key of fields) {
    const el = document.getElementById(key);
    if (!el) continue;
    if (key === 'translateEnabled' && !isPro) {
      settings[key] = false;
      continue;
    }
    settings[key] = el.type === 'checkbox' ? el.checked : el.value;
    if (el.type === 'range') settings[key] = parseFloat(settings[key]);
  }

  settingsStorage = await getSettingsStorage();
  await settingsStorage.set(settings);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'settings-updated', settings }).catch(() => {});
  }
}

async function activateLicense() {
  const input = document.getElementById('licenseKey');
  const msg = document.getElementById('licenseMsg');
  const key = input?.value?.trim();
  if (!key) {
    if (msg) msg.textContent = '请输入 License Key';
    return;
  }

  const result = await chrome.runtime.sendMessage({ type: 'activate-license', key });
  if (result?.valid) {
    const expiry = result.expiresAt ? formatDate(result.expiresAt) : '';
    if (msg) msg.textContent = expiry ? `Pro 已激活，有效期至 ${expiry}` : 'Pro 已激活';
    settingsStorage = await getSettingsStorage();
    await settingsStorage.set({ translateEnabled: true });
    const translateEnabled = document.getElementById('translateEnabled');
    if (translateEnabled) translateEnabled.checked = true;
    await refreshProUI();
    await loadSettings();
    await saveSettings();
    notifyTabsProUpdated();
  } else if (msg) {
    msg.textContent = result?.error || '激活失败';
  }
}

async function deactivateLicense() {
  await chrome.runtime.sendMessage({ type: 'deactivate-license' });
  const msg = document.getElementById('licenseMsg');
  if (msg) msg.textContent = '已恢复免费版';
  document.getElementById('licenseKey').value = '';
  await refreshProUI();
  await loadSettings();
  notifyTabsProUpdated();
}

async function notifyTabsProUpdated() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'pro-updated' }).catch(() => {});
    }
  }
}
