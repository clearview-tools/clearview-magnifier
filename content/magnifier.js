/* ClearView 阅屏助手 - Content Script */

(function () {
  'use strict';

  let EXT_VERSION = '';
  try {
    EXT_VERSION = chrome.runtime.getManifest().version;
  } catch {
    showStaticRefreshBanner();
    return;
  }

  if (window.__clearviewVersion === EXT_VERSION) return;
  if (typeof window.__clearviewCleanup === 'function') {
    try { window.__clearviewCleanup(); } catch { /* 旧上下文可能已失效 */ }
  }

  function showStaticRefreshBanner() {
    if (document.getElementById('clearview-refresh-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'clearview-refresh-banner';
    banner.textContent = 'ClearView 扩展已更新，请按 F5 刷新页面';
    banner.style.cssText = [
      'position:fixed', 'top:16px', 'left:50%', 'transform:translateX(-50%)',
      'z-index:2147483647', 'padding:12px 20px', 'background:#1e293b', 'color:#f8fafc',
      'font:14px/1.4 "Segoe UI","Microsoft YaHei",sans-serif', 'border-radius:10px',
      'box-shadow:0 8px 30px rgba(0,0,0,.25)', 'pointer-events:none'
    ].join(';');
    (document.body || document.documentElement).appendChild(banner);
  }

  let contextInvalidated = false;

  const DEFAULTS = {
    zoom: 2.5,
    lensSize: 220,
    shape: 'circle',
    translateEnabled: false,
    sourceLang: 'auto',
    targetLang: 'zh-CN',
    highContrast: false,
    invertColors: false,
    readingLine: true,
    crosshair: true,
    linkPreview: true,
    colorPicker: true,
    closeOnRelease: false,
    showHud: true
  };

  let settings = { ...DEFAULTS };
  let state = {
    active: false,
    frozen: false,
    followMode: false,
    altRightHeld: false,
    screenshot: null,
    mouseX: 0,
    mouseY: 0,
    lastTranslateKey: '',
    translatePending: false,
    colorHex: '',
    linkUrl: '',
    captureInProgress: false
  };

  let root = null;
  let lens = null;
  let hud = null;
  let translatePanel = null;
  let colorBadge = null;
  let linkBadge = null;
  let canvas = null;
  let ctx = null;
  let translateTimer = null;
  let screenshotTimer = null;
  let linkPreviewTimer = null;
  let drawRafId = null;
  let lastColorPick = 0;
  // 会话级缩放/大小，每次启动放大镜时从设置重置，滚轮调整不写入 storage
  let sessionZoom = DEFAULTS.zoom;
  let sessionLensSize = DEFAULTS.lensSize;
  let isPro = false;
  let proStatus = { dailyLimit: 0, quotaRemaining: 0, quotaUsed: 0 };
  let settingsStorageArea = 'local';

  init();

  bindEvents();

  async function init() {
    if (!isContextValid()) return;
    try {
      await refreshProStatus();
      const storage = await getSettingsStorage();
      settingsStorageArea = storage === chrome.storage.sync ? 'sync' : 'local';
      const stored = await storage.get(DEFAULTS);
      settings = { ...DEFAULTS, ...stored };
      if (stored.closeOnRelease === undefined) {
        settings.closeOnRelease = false;
      }
      if (!isPro) settings.translateEnabled = false;
    } catch (err) {
      if (handleIfInvalidated(err)) return;
      console.warn('[ClearView] 读取设置失败:', err);
    }
    chrome.storage.onChanged.addListener(onStorageChanged);
    chrome.runtime.onMessage.addListener(handleMessage);
  }

  async function refreshProStatus() {
    try {
      proStatus = await sendToBackground({ type: 'get-pro-status' });
      isPro = !!proStatus.isPro;
    } catch {
      isPro = false;
      proStatus = { isPro: false, dailyLimit: 0, quotaRemaining: 0, quotaUsed: 0 };
    }
    return proStatus;
  }

  async function getSettingsStorage() {
    if (!isContextValid()) return chrome.storage.local;
    try {
      const result = await sendToBackground({ type: 'get-settings-storage' });
      return result?.area === 'sync' ? chrome.storage.sync : chrome.storage.local;
    } catch {
      return chrome.storage.local;
    }
  }

  async function saveSetting(key, value) {
    const storage = await getSettingsStorage();
    await storage.set({ [key]: value });
  }

  function applySettingsChanges(partial) {
    if (partial.zoom !== undefined) sessionZoom = settings.zoom;
    if (partial.lensSize !== undefined) sessionLensSize = settings.lensSize;
    if (partial.lensSize !== undefined || partial.shape !== undefined) applyLensSize();
    if (partial.readingLine !== undefined || partial.crosshair !== undefined) toggleAssistiveElements();
    if (state.active) {
      syncLensPosition();
      scheduleLensDraw();
      updateHud();
      if (partial.translateEnabled !== undefined) scheduleTranslate();
    }
  }

  function onStorageChanged(changes, areaName) {
    if (areaName !== settingsStorageArea) return;
    for (const key of Object.keys(changes)) {
      settings[key] = changes[key].newValue;
    }
    applySettingsChanges(changes);
  }

  function isContextValid() {
    if (contextInvalidated) return false;
    try {
      return !!chrome.runtime?.id;
    } catch {
      return false;
    }
  }

  function isInvalidatedError(err) {
    const msg = err?.message || String(err);
    return /extension context invalidated|context invalidated/i.test(msg);
  }

  function handleIfInvalidated(err) {
    if (!isInvalidatedError(err)) return false;
    handleContextInvalidated();
    return true;
  }

  function handleContextInvalidated() {
    if (contextInvalidated) return;
    contextInvalidated = true;
    try { deactivateMagnifier(); } catch { /* ignore */ }
    showStaticRefreshBanner();
  }

  async function sendToBackground(message) {
    if (!isContextValid()) {
      handleContextInvalidated();
      throw new Error('扩展已更新，请刷新页面');
    }
    try {
      const response = await chrome.runtime.sendMessage(message);
      if (response?.error && message.type === 'translate') {
        throw new Error(response.error);
      }
      return response;
    } catch (err) {
      if (handleIfInvalidated(err)) {
        throw new Error('扩展已更新，请刷新页面');
      }
      throw err;
    }
  }

  function handleMessage(msg) {
    if (msg.type === 'command') {
      if (msg.action === 'toggle-magnifier') toggleMagnifier();
      if (msg.action === 'toggle-translate') {
        refreshProStatus().then(() => {
          if (!isPro) {
            showToast('实时翻译为 Pro 功能 — 请在扩展面板购买或激活 License');
            return;
          }
          settings.translateEnabled = !settings.translateEnabled;
          saveSetting('translateEnabled', settings.translateEnabled);
          showToast(settings.translateEnabled ? '实时翻译已开启' : '实时翻译已关闭');
          if (state.active) scheduleTranslate();
        });
      }
    }
    if (msg.type === 'pro-updated') {
      refreshProStatus().then(async () => {
        const storage = await getSettingsStorage();
        settingsStorageArea = storage === chrome.storage.sync ? 'sync' : 'local';
        const stored = await storage.get(['translateEnabled']);
        if (isPro) {
          settings.translateEnabled = !!stored.translateEnabled;
        } else {
          settings.translateEnabled = false;
          if (translatePanel) translatePanel.style.display = 'none';
        }
        if (state.active && settings.translateEnabled) scheduleTranslate();
      });
    }
    if (msg.type === 'settings-updated') {
      refreshProStatus().then(() => {
        Object.assign(settings, msg.settings);
        if (!isPro) settings.translateEnabled = false;
        applySettingsChanges(msg.settings);
      });
    }
  }

  function bindEvents() {
    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('mousemove', onPointerMove, true);
    window.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('mouseup', onMouseUp, true);
    window.addEventListener('wheel', onWheel, { capture: true, passive: false });
    window.addEventListener('dblclick', onDoubleClick, true);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('contextmenu', onContextMenu, true);
    window.addEventListener('scroll', onPageScroll, { capture: true, passive: true });
  }

  function onPointerMove(e) {
    if (!state.active || state.frozen) return;
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
    syncLensPosition();
    scheduleLensDraw();
    scheduleTranslate();
    scheduleLinkPreview();
  }

  function onPageScroll() {
    if (!state.active || state.frozen) return;
    clearTimeout(screenshotTimer);
    screenshotTimer = setTimeout(refreshScreenshot, 400);
  }

  function onMouseDown(e) {
    if (!isOurOverlay(e.target)) {
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
    }

    // Alt + 右键按住 → 启动并跟随鼠标
    if (e.altKey && e.button === 2 && !state.active) {
      e.preventDefault();
      e.stopPropagation();
      state.altRightHeld = true;
      state.followMode = true;
      activateMagnifier(e.clientX, e.clientY);
      return;
    }

    // Alt + 中键 → 切换常驻跟随模式
    if (e.altKey && e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      if (state.active && state.followMode) {
        deactivateMagnifier();
      } else {
        state.followMode = true;
        activateMagnifier(e.clientX, e.clientY);
      }
      return;
    }

    // 放大镜激活时：左键在透镜上冻结/解冻
    if (state.active && e.button === 0 && isInsideLens(e.clientX, e.clientY)) {
      e.preventDefault();
      e.stopPropagation();
      state.frozen = !state.frozen;
      updateLensPointerEvents();
      updateHud();
      if (!state.frozen) {
        state.mouseX = e.clientX;
        state.mouseY = e.clientY;
        updateLens();
      }
      showToast(state.frozen ? '已冻结 — 可仔细阅读' : '已解冻 — 跟随鼠标');
      return;
    }
  }

  function onMouseUp(e) {
    if (state.altRightHeld && e.button === 2) {
      state.altRightHeld = false;
      if (settings.closeOnRelease) {
        deactivateMagnifier();
        return;
      }
      state.followMode = true;
      updateLensPointerEvents();
      updateHud();
      showToast('放大镜已保持 — 滚轮缩放 · Esc 退出');
    }
  }

  function onWheel(e) {
    if (!state.active) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.ctrlKey && !e.shiftKey) {
      settings.invertColors = !settings.invertColors;
      settings.highContrast = false;
      applyLensFilters();
      showToast(settings.invertColors ? '反色模式' : '正常色彩');
      return;
    }

    if (e.shiftKey) {
      const delta = e.deltaY > 0 ? -20 : 20;
      sessionLensSize = clamp(sessionLensSize + delta, 120, 400);
      applyLensSize();
      syncLensPosition();
      scheduleLensDraw();
      updateHud();
      showToast(`透镜 ${sessionLensSize}px`);
      return;
    }

    const zoomDelta = e.deltaY > 0 ? -0.25 : 0.25;
    sessionZoom = clamp(Math.round((sessionZoom + zoomDelta) * 100) / 100, 1.5, 6);
    scheduleLensDraw();
    updateHud();
    showToast(`放大 ${sessionZoom}x`);
  }

  function onDoubleClick(e) {
    if (!state.active) return;
    if (!isInsideLens(e.clientX, e.clientY)) return;
    e.preventDefault();
    e.stopPropagation();
    copyCurrentText();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && state.active) {
      e.preventDefault();
      deactivateMagnifier();
      return;
    }

    if (e.code === 'Space' && state.active && !isInputElement(e.target)) {
      e.preventDefault();
      state.frozen = !state.frozen;
      updateLensPointerEvents();
      updateHud();
      showToast(state.frozen ? '已冻结' : '已解冻 — 跟随鼠标');
      return;
    }

    if (e.key === 'f' && state.active && !isInputElement(e.target)) {
      settings.highContrast = !settings.highContrast;
      if (settings.highContrast) settings.invertColors = false;
      applyLensFilters();
      showToast(settings.highContrast ? '高对比度模式' : '正常对比度');
    }

    if (e.key === 'c' && state.active && settings.colorPicker && !isInputElement(e.target)) {
      copyColor();
    }

    if (e.key === 'r' && state.active && !isInputElement(e.target)) {
      refreshScreenshot();
      showToast('画面已刷新');
    }

    if (!state.active || isInputElement(e.target)) return;

    if (e.key === '[' || e.key === '-') {
      e.preventDefault();
      sessionZoom = clamp(Math.round((sessionZoom - 0.25) * 100) / 100, 1.5, 6);
      scheduleLensDraw();
      updateHud();
      showToast(`放大 ${sessionZoom}x`);
    }
    if (e.key === ']' || e.key === '=' || e.key === '+') {
      e.preventDefault();
      sessionZoom = clamp(Math.round((sessionZoom + 0.25) * 100) / 100, 1.5, 6);
      scheduleLensDraw();
      updateHud();
      showToast(`放大 ${sessionZoom}x`);
    }
    if (e.key === ',' || e.key === '<') {
      e.preventDefault();
      sessionLensSize = clamp(sessionLensSize - 20, 120, 400);
      applyLensSize();
      syncLensPosition();
      scheduleLensDraw();
      updateHud();
      showToast(`透镜 ${sessionLensSize}px`);
    }
    if (e.key === '.' || e.key === '>') {
      e.preventDefault();
      sessionLensSize = clamp(sessionLensSize + 20, 120, 400);
      applyLensSize();
      syncLensPosition();
      scheduleLensDraw();
      updateHud();
      showToast(`透镜 ${sessionLensSize}px`);
    }
  }

  function onContextMenu(e) {
    if (state.active && isInsideLens(e.clientX, e.clientY)) {
      e.preventDefault();
      if (settings.colorPicker) pickColorAtCenter();
    }
  }

  function toggleMagnifier() {
    if (state.active) {
      deactivateMagnifier();
    } else {
      state.followMode = true;
      activateMagnifier(state.mouseX || window.innerWidth / 2, state.mouseY || window.innerHeight / 2);
    }
  }

  async function activateMagnifier(x, y) {
    if (state.active) return;

    state.active = true;
    state.frozen = false;
    state.mouseX = x;
    state.mouseY = y;
    sessionZoom = settings.zoom;
    sessionLensSize = settings.lensSize;

    await refreshProStatus();

    createOverlay();
    syncLensPosition();
    showToast('ClearView 已启动 — 移动鼠标跟随 · Alt+滚轮缩放 · Esc 退出');
    refreshScreenshot().then(() => scheduleLensDraw());
    scheduleTranslate();
    scheduleLinkPreview();
  }

  function deactivateMagnifier() {
    state.active = false;
    state.frozen = false;
    state.followMode = false;
    state.altRightHeld = false;
    state.screenshot = null;
    cancelLensDraw();
    clearTimeout(translateTimer);
    clearTimeout(screenshotTimer);
    clearTimeout(linkPreviewTimer);

    if (root) {
      root.remove();
      root = lens = hud = translatePanel = colorBadge = linkBadge = canvas = ctx = null;
    }
  }

  function createOverlay() {
    root = document.createElement('div');
    root.id = 'clearview-root';
    root.innerHTML = `
      <div id="clearview-lens" class="clearview-lens">
        <canvas id="clearview-canvas"></canvas>
        <div class="clearview-crosshair-h"></div>
        <div class="clearview-crosshair-v"></div>
        <div class="clearview-reading-line"></div>
        <div class="clearview-lens-ring"></div>
      </div>
      <div id="clearview-hud" class="clearview-hud"></div>
      <div id="clearview-translate" class="clearview-translate"></div>
      <div id="clearview-color" class="clearview-color"></div>
      <div id="clearview-link" class="clearview-link"></div>
      <div id="clearview-toast" class="clearview-toast"></div>
    `;
    document.body.appendChild(root);

    lens = root.querySelector('#clearview-lens');
    hud = root.querySelector('#clearview-hud');
    translatePanel = root.querySelector('#clearview-translate');
    colorBadge = root.querySelector('#clearview-color');
    linkBadge = root.querySelector('#clearview-link');
    canvas = root.querySelector('#clearview-canvas');
    ctx = canvas.getContext('2d', { willReadFrequently: true });

    applyLensSize();
    applyLensFilters();
    toggleAssistiveElements();
    updateLensPointerEvents();
  }

  function updateLensPointerEvents() {
    if (!lens) return;
    // 跟随模式让事件穿透，避免滚轮/点击被透镜截获；冻结后才可交互
    lens.style.pointerEvents = state.frozen ? 'auto' : 'none';
  }

  function applyLensSize() {
    if (!lens || !canvas) return;
    const size = sessionLensSize;
    lens.style.width = `${size}px`;
    lens.style.height = `${size}px`;
    canvas.width = size;
    canvas.height = size;
    lens.classList.toggle('clearview-shape-circle', settings.shape === 'circle');
    lens.classList.toggle('clearview-shape-rect', settings.shape === 'rect');
  }

  function applyLensFilters() {
    if (!lens) return;
    const filters = [];
    if (settings.highContrast) filters.push('contrast(1.8) brightness(1.1)');
    if (settings.invertColors) filters.push('invert(1) hue-rotate(180deg)');
    lens.style.filter = filters.length ? filters.join(' ') : 'none';
  }

  function toggleAssistiveElements() {
    if (!lens) return;
    lens.querySelector('.clearview-crosshair-h').style.display = settings.crosshair ? 'block' : 'none';
    lens.querySelector('.clearview-crosshair-v').style.display = settings.crosshair ? 'block' : 'none';
    lens.querySelector('.clearview-reading-line').style.display = settings.readingLine ? 'block' : 'none';
  }

  async function waitForRepaint() {
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
  }

  async function refreshScreenshot() {
    if (!isContextValid() || state.captureInProgress) return;

    state.captureInProgress = true;
    const prevVisibility = root?.style.visibility ?? '';

    try {
      // 截图必须隐藏 overlay，否则会把上一帧放大镜截进去造成递归放大
      if (root) root.style.visibility = 'hidden';
      await waitForRepaint();

      const response = await sendToBackground({ type: 'capture-screenshot' });
      if (response?.dataUrl) {
        const img = new Image();
        img.src = response.dataUrl;
        await img.decode();
        state.screenshot = img;
        scheduleLensDraw();
      }
    } catch (err) {
      if (handleIfInvalidated(err)) return;
      console.warn('[ClearView] 截图失败:', err);
      showToast('截图失败：请在扩展面板启用对应浏览器兼容补丁，或 F5 刷新后重试');
    } finally {
      if (root) root.style.visibility = prevVisibility;
      state.captureInProgress = false;
    }
  }

  function syncLensPosition() {
    if (!lens) return;
    const size = sessionLensSize;
    const left = Math.round(state.mouseX - size / 2);
    const top = Math.round(state.mouseY - size / 2);
    lens.style.left = `${left}px`;
    lens.style.top = `${top}px`;
    positionPanels(left, top, size);
    updateHud();
  }

  function scheduleLensDraw() {
    if (drawRafId) return;
    drawRafId = requestAnimationFrame(() => {
      drawRafId = null;
      drawLensCanvas();
    });
  }

  function cancelLensDraw() {
    if (drawRafId) {
      cancelAnimationFrame(drawRafId);
      drawRafId = null;
    }
  }

  function drawLensCanvas() {
    if (!state.active || !lens || !canvas || !ctx || !state.screenshot) return;

    const size = sessionLensSize;
    const zoom = sessionZoom;
    const dpr = window.devicePixelRatio || 1;
    const sx = (state.mouseX - size / (2 * zoom)) * dpr;
    const sy = (state.mouseY - size / (2 * zoom)) * dpr;
    const sw = (size / zoom) * dpr;
    const sh = (size / zoom) * dpr;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(state.screenshot, sx, sy, sw, sh, 0, 0, size, size);
    scheduleColorPick();
  }

  function updateLens() {
    syncLensPosition();
    drawLensCanvas();
  }

  function positionPanels(left, top, size) {
    const margin = 12;
    if (hud && settings.showHud) {
      hud.style.left = `${left}px`;
      hud.style.top = `${Math.max(8, top - 36)}px`;
      hud.style.display = 'block';
    } else if (hud) {
      hud.style.display = 'none';
    }

    if (translatePanel) {
      translatePanel.style.left = `${left}px`;
      translatePanel.style.top = `${top + size + margin}px`;
      translatePanel.style.maxWidth = `${Math.max(size, 280)}px`;
    }

    if (colorBadge) {
      colorBadge.style.left = `${left + size - 80}px`;
      colorBadge.style.top = `${top + 8}px`;
    }

    if (linkBadge) {
      linkBadge.style.left = `${left}px`;
      linkBadge.style.top = `${top + size + margin + (translatePanel?.offsetHeight || 0) + 4}px`;
    }
  }

  function updateHud() {
    if (!hud) return;
    const mode = state.frozen ? '冻结' : (state.followMode ? '跟随' : '按住');
    hud.textContent = `${mode} | ${sessionZoom}x | ${sessionLensSize}px | 滚轮缩放 · Shift+滚轮调大小 · [ ] 快捷键`;
  }

  function scheduleTranslate() {
    if (!settings.translateEnabled) {
      if (translatePanel) translatePanel.style.display = 'none';
      return;
    }
    clearTimeout(translateTimer);
    translateTimer = setTimeout(() => doTranslate(), 500);
  }

  function showProUpgradePanel(text) {
    if (!translatePanel) return;
    translatePanel.style.display = 'block';
    translatePanel.dataset.loaded = '1';
    const original = text
      ? `<div class="clearview-translate-original">${escapeHtml(text)}</div>`
      : '';
    translatePanel.innerHTML = `${original}
      <div class="clearview-translate-error">实时翻译为 Pro 功能</div>
      <div class="clearview-translate-original">点击扩展图标购买 Pro 或输入 License 激活 · 每日 ${proStatus.dailyLimit || 500} 次额度</div>`;
  }

  function scheduleLinkPreview() {
    if (!settings.linkPreview) return;
    clearTimeout(linkPreviewTimer);
    linkPreviewTimer = setTimeout(updateLinkPreview, 200);
  }

  function scheduleColorPick() {
    if (!settings.colorPicker) return;
    const now = Date.now();
    if (now - lastColorPick < 150) return;
    lastColorPick = now;
    pickColorSilent();
  }

  async function doTranslate() {
    if (!state.active || !settings.translateEnabled) return;

    await refreshProStatus();
    if (!isPro) {
      showProUpgradePanel();
      return;
    }

    const textInfo = getTextAtPoint(state.mouseX, state.mouseY);
    const text = textInfo.text;
    if (!text || text.length < 2) {
      if (translatePanel) translatePanel.style.display = 'none';
      return;
    }

    const key = `${settings.sourceLang}|${settings.targetLang}|${text}`;
    if (key === state.lastTranslateKey && translatePanel?.dataset.loaded === '1') return;
    state.lastTranslateKey = key;

    if (translatePanel) {
      translatePanel.style.display = 'block';
      translatePanel.dataset.loaded = '0';
      translatePanel.innerHTML = `<div class="clearview-translate-loading">翻译中…</div>
        <div class="clearview-translate-original">${escapeHtml(text)}</div>`;
    }

    const from = settings.sourceLang === 'auto' ? detectLang(text) : settings.sourceLang;
    const to = settings.targetLang;

    if (from === to || (from === 'zh-CN' && to === 'zh')) {
      if (translatePanel) {
        translatePanel.dataset.loaded = '1';
        translatePanel.innerHTML = `
          <div class="clearview-translate-label">原文 ${langLabel(from)}</div>
          <div class="clearview-translate-original">${escapeHtml(text)}</div>
          <div class="clearview-translate-error">源语言与目标语言相同，请在设置中修改目标语言</div>`;
      }
      return;
    }

    try {
      const result = await sendToBackground({
        type: 'translate',
        text,
        from,
        to
      });
      if (!state.active) return;
      const translated = result?.translated || text;
      if (translatePanel) {
        translatePanel.dataset.loaded = '1';
        const quotaHint = result?.quotaRemaining !== undefined
          ? `<div class="clearview-translate-label">Pro 今日剩余 ${result.quotaRemaining} 次</div>`
          : '';
        translatePanel.innerHTML = `
          ${quotaHint}
          <div class="clearview-translate-label">译文 ${langLabel(to)}</div>
          <div class="clearview-translate-result">${escapeHtml(translated)}</div>
          <div class="clearview-translate-label">原文 ${langLabel(from)}</div>
          <div class="clearview-translate-original">${escapeHtml(text)}</div>`;
      }
    } catch (err) {
      const code = err?.message || '';
      if (translatePanel) {
        if (code === 'PRO_REQUIRED') {
          showProUpgradePanel(text);
        } else if (code === 'QUOTA_EXCEEDED') {
          translatePanel.innerHTML = `<div class="clearview-translate-original">${escapeHtml(text)}</div>
            <div class="clearview-translate-error">今日 Pro 翻译额度已用完，明日自动重置</div>`;
        } else {
          translatePanel.innerHTML = `<div class="clearview-translate-original">${escapeHtml(text)}</div>
            <div class="clearview-translate-error">翻译暂不可用${code ? `（${escapeHtml(code)}）` : ''}</div>`;
        }
      }
    }
  }

  function getTextAtPoint(x, y) {
    const hidden = root?.style.visibility;
    if (root) root.style.visibility = 'hidden';
    let range = null;
    try {
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(x, y);
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(x, y);
        if (pos) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }
    } finally {
      if (root) root.style.visibility = hidden || '';
    }

    if (!range || range.startContainer.nodeType !== Node.TEXT_NODE) {
      const el = document.elementFromPoint(x, y);
      const block = findTextBlock(el);
      if (block) {
        const text = block.innerText?.trim().slice(0, 300) || '';
        return { text: text.split('\n')[0], element: block };
      }
      return { text: '', element: null };
    }

    const word = expandToSentence(range);
    return { text: word, element: range.startContainer.parentElement };
  }

  function expandToSentence(range) {
    const node = range.startContainer;
    const full = node.textContent || '';
    let start = range.startOffset;
    let end = range.startOffset;

    while (start > 0 && !/[\s。！？.!?\n]/.test(full[start - 1])) start--;
    while (end < full.length && !/[\s。！？.!?\n]/.test(full[end])) end++;

    let text = full.slice(start, end).trim();
    if (text.length < 8 && node.parentElement) {
      const block = findTextBlock(node.parentElement);
      if (block) {
        const blockText = block.innerText?.trim() || '';
        const sentences = blockText.match(/[^。！？.!?\n]+[。！？.!?]?/g) || [blockText];
        const idx = Math.max(0, sentences.findIndex((s) => s.includes(text.slice(0, 4))));
        text = sentences[idx] || text;
      }
    }
    return text.trim().slice(0, 300);
  }

  function findTextBlock(el) {
    if (!el) return null;
    const tags = ['P', 'SPAN', 'DIV', 'LI', 'TD', 'TH', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'LABEL', 'ARTICLE', 'SECTION'];
    let cur = el;
    while (cur && cur !== document.body) {
      if (tags.includes(cur.tagName) && (cur.innerText?.trim().length > 0)) return cur;
      cur = cur.parentElement;
    }
    return el;
  }

  function detectLang(text) {
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh-CN';
    if (/[\u3040-\u30ff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    if (/[\u0400-\u04ff]/.test(text)) return 'ru';
    return 'en';
  }

  function langLabel(code) {
    const map = {
      'zh-CN': '中文', en: 'English', ja: '日本語', ko: '한국어',
      fr: 'Français', de: 'Deutsch', es: 'Español', ru: 'Русский', auto: '自动'
    };
    return map[code] || code;
  }

  function updateLinkPreview() {
    if (!settings.linkPreview || !linkBadge) return;
    const hidden = root?.style.visibility;
    if (root) root.style.visibility = 'hidden';
    const el = document.elementFromPoint(state.mouseX, state.mouseY);
    if (root) root.style.visibility = hidden || '';
    const link = el?.closest('a');
    if (link?.href) {
      state.linkUrl = link.href;
      linkBadge.style.display = 'block';
      linkBadge.textContent = `🔗 ${link.href}`;
    } else {
      state.linkUrl = '';
      linkBadge.style.display = 'none';
    }
  }

  function pickColorSilent() {
    if (!settings.colorPicker || !ctx || !colorBadge) return;
    const cx = Math.floor(sessionLensSize / 2);
    const cy = Math.floor(sessionLensSize / 2);
    const pixel = ctx.getImageData(cx, cy, 1, 1).data;
    state.colorHex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    colorBadge.style.display = 'flex';
    colorBadge.innerHTML = `<span class="clearview-swatch" style="background:${state.colorHex}"></span>${state.colorHex}`;
  }

  function pickColorAtCenter() {
    pickColorSilent();
    copyColor();
  }

  async function copyColor() {
    if (!state.colorHex) return;
    await copyToClipboard(state.colorHex);
    showToast(`颜色已复制: ${state.colorHex}`);
  }

  async function copyCurrentText() {
    const { text } = getTextAtPoint(state.mouseX, state.mouseY);
    if (!text) {
      showToast('未检测到文字');
      return;
    }
    let output = text;
    if (settings.translateEnabled && isPro) {
      const from = settings.sourceLang === 'auto' ? detectLang(text) : settings.sourceLang;
      try {
        const result = await sendToBackground({
          type: 'translate', text, from, to: settings.targetLang
        });
        if (result?.translated) output = `${result.translated}\n---\n${text}`;
      } catch { /* keep original */ }
    } else if (settings.translateEnabled && !isPro) {
      showToast('译文复制为 Pro 功能');
    }
    await copyToClipboard(output);
    showToast('文字已复制到剪贴板');
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  function isInsideLens(x, y) {
    const size = sessionLensSize;
    const left = state.mouseX - size / 2;
    const top = state.mouseY - size / 2;
    return x >= left && x <= left + size && y >= top && y <= top + size;
  }

  function isOurOverlay(target) {
    return target?.closest?.('#clearview-root');
  }

  function isInputElement(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  let toastTimer = null;
  function showToast(msg) {
    const toast = root?.querySelector('#clearview-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('clearview-toast-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('clearview-toast-show'), 2200);
  }

  // 页面有动画时低频补刷截图
  const screenshotIntervalId = setInterval(() => {
    if (state.active && !state.frozen && isContextValid()) {
      clearTimeout(screenshotTimer);
      screenshotTimer = setTimeout(refreshScreenshot, 600);
    }
  }, 8000);

  function cleanup() {
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('mousemove', onPointerMove, true);
    window.removeEventListener('mousedown', onMouseDown, true);
    window.removeEventListener('mouseup', onMouseUp, true);
    window.removeEventListener('wheel', onWheel, true);
    window.removeEventListener('dblclick', onDoubleClick, true);
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('contextmenu', onContextMenu, true);
    window.removeEventListener('scroll', onPageScroll, true);
    try { chrome.storage.onChanged.removeListener(onStorageChanged); } catch { /* ignore */ }
    try { chrome.runtime.onMessage.removeListener(handleMessage); } catch { /* ignore */ }
    clearInterval(screenshotIntervalId);
    clearTimeout(translateTimer);
    clearTimeout(screenshotTimer);
    clearTimeout(linkPreviewTimer);
    cancelLensDraw();
    try { deactivateMagnifier(); } catch { /* ignore */ }
    document.getElementById('clearview-refresh-banner')?.remove();
  }

  window.__clearviewCleanup = cleanup;
  window.__clearviewVersion = EXT_VERSION;
})();
