chrome.runtime.onInstalled.addListener(async () => {
  await reinjectContentScripts();
});

async function reinjectContentScripts() {
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
  } catch {
    return;
  }

  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/magnifier.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/magnifier.css']
      });
    } catch {
      // 受限页面（chrome:// 等）跳过
    }
  }
}

const CACHE_TTL = 5 * 60 * 1000;
const translateCache = new Map();
const providerCooldown = new Map();

const PROVIDERS = [
  { name: 'mymemory', translate: translateMyMemory, cooldownOnFail: 60 * 60 * 1000 },
  { name: 'google', translate: translateGoogle, cooldownOnFail: 5 * 60 * 1000 },
  { name: 'lingva', translate: translateLingva, cooldownOnFail: 5 * 60 * 1000 }
];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'capture-screenshot') {
    handleCapture(sender.tab?.id)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === 'translate') {
    handleTranslate(message.text, message.from, message.to)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message, translated: message.text }));
    return true;
  }
});

async function handleCapture(tabId) {
  if (!tabId) {
    throw new Error('无法获取当前标签页');
  }

  const dataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: 'png',
    quality: 100
  });

  return { dataUrl };
}

async function handleTranslate(text, from, to) {
  const trimmed = (text || '').trim();
  if (!trimmed || trimmed.length > 500) {
    return { translated: trimmed, cached: false };
  }

  const cacheKey = `${from}|${to}|${trimmed}`;
  const cached = translateCache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return { translated: cached.text, cached: true, provider: cached.provider };
  }

  let lastError = null;

  for (const provider of PROVIDERS) {
    if (!isProviderAvailable(provider.name)) continue;

    try {
      const translated = await provider.translate(trimmed, from, to);
      if (!translated) continue;

      translateCache.set(cacheKey, {
        text: translated,
        time: Date.now(),
        provider: provider.name
      });
      trimCache();

      return { translated, cached: false, provider: provider.name };
    } catch (err) {
      lastError = err;
      if (err.rateLimited) {
        markProviderCooldown(provider.name, provider.cooldownOnFail);
      }
      console.warn(`[ClearView] ${provider.name} 翻译失败:`, err.message);
    }
  }

  throw lastError || new Error('所有翻译服务暂不可用');
}

function isProviderAvailable(name) {
  const until = providerCooldown.get(name);
  return !until || Date.now() > until;
}

function markProviderCooldown(name, ms) {
  providerCooldown.set(name, Date.now() + ms);
}

function trimCache() {
  if (translateCache.size > 200) {
    const oldest = translateCache.keys().next().value;
    translateCache.delete(oldest);
  }
}

function normalizeLang(code) {
  const map = {
    'zh-CN': 'zh-CN',
    zh: 'zh-CN',
    en: 'en',
    ja: 'ja',
    ko: 'ko',
    fr: 'fr',
    de: 'de',
    es: 'es',
    ru: 'ru'
  };
  return map[code] || code;
}

function toLingvaLang(code) {
  if (code === 'zh-CN') return 'zh';
  return code;
}

async function translateMyMemory(text, from, to) {
  const langpair = `${normalizeLang(from)}|${normalizeLang(to)}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;

  const response = await fetch(url);
  if (!response.ok) {
    const err = new Error(`MyMemory 异常 (${response.status})`);
    err.rateLimited = response.status === 429;
    throw err;
  }

  const data = await response.json();
  const details = data?.responseDetails || '';

  if (
    data?.responseStatus === 429 ||
    /USED ALL AVAILABLE|QUOTA|LIMIT/i.test(details)
  ) {
    const err = new Error('MyMemory 配额已用尽');
    err.rateLimited = true;
    throw err;
  }

  const translated = data?.responseData?.translatedText;
  if (!translated) throw new Error('MyMemory 返回空结果');
  return translated;
}

async function translateGoogle(text, from, to) {
  const sl = from === 'auto' ? 'auto' : normalizeLang(from);
  const tl = normalizeLang(to);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url);
  if (!response.ok) {
    const err = new Error(`Google 翻译异常 (${response.status})`);
    err.rateLimited = response.status === 429;
    throw err;
  }

  const data = await response.json();
  const translated = data?.[0]?.map((part) => part[0]).join('');
  if (!translated) throw new Error('Google 翻译返回空结果');
  return translated;
}

async function translateLingva(text, from, to) {
  const source = from === 'auto' ? 'en' : toLingvaLang(from);
  const target = toLingvaLang(to);
  const url = `https://lingva.ml/api/v1/${source}/${target}/${encodeURIComponent(text)}`;

  const response = await fetch(url);
  if (!response.ok) {
    const err = new Error(`Lingva 异常 (${response.status})`);
    err.rateLimited = response.status === 429;
    throw err;
  }

  const data = await response.json();
  if (!data?.translation) throw new Error('Lingva 返回空结果');
  return data.translation;
}

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  if (command === 'toggle-magnifier') {
    chrome.tabs.sendMessage(tab.id, { type: 'command', action: 'toggle-magnifier' });
  } else if (command === 'toggle-translate') {
    chrome.tabs.sendMessage(tab.id, { type: 'command', action: 'toggle-translate' });
  }
});
