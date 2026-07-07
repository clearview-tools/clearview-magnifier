const DEFAULTS = {
  zoom: 2.5,
  lensSize: 220,
  shape: 'circle',
  translateEnabled: true,
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

document.addEventListener('DOMContentLoaded', async () => {
  const stored = await chrome.storage.sync.get(DEFAULTS);

  for (const key of fields) {
    const el = document.getElementById(key);
    if (!el) continue;
    if (el.type === 'checkbox') {
      el.checked = !!stored[key];
    } else {
      el.value = stored[key];
    }
  }

  updateLabels(stored);

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
});

function updateLabels(data) {
  const zoomVal = document.getElementById('zoomVal');
  const lensSizeVal = document.getElementById('lensSizeVal');
  if (zoomVal && data.zoom !== undefined) zoomVal.textContent = `${data.zoom}x`;
  if (lensSizeVal && data.lensSize !== undefined) lensSizeVal.textContent = `${data.lensSize}px`;
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSettings, 120);
}

async function saveSettings() {
  const settings = {};
  for (const key of fields) {
    const el = document.getElementById(key);
    if (!el) continue;
    settings[key] = el.type === 'checkbox' ? el.checked : el.value;
    if (el.type === 'range') settings[key] = parseFloat(settings[key]);
  }

  await chrome.storage.sync.set(settings);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'settings-updated', settings }).catch(() => {});
  }
}
