# ClearView Magnifier

[中文 README](README.md)

A Chrome extension with a local screen magnifier, optional live translation, and reading aids to make web content easier to read.

**Current version:** 1.1.1

- **Repository:** [github.com/clearview-tools/clearview-magnifier](https://github.com/clearview-tools/clearview-magnifier)
- **Releases:** [Download ZIP](https://github.com/clearview-tools/clearview-magnifier/releases)
- **Privacy policy:** [clearview-tools.github.io/clearview-magnifier/privacy.html](https://clearview-tools.github.io/clearview-magnifier/privacy.html)
- **Feedback:** [GitHub Issues](https://github.com/clearview-tools/clearview-magnifier/issues)

## Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Screen magnifier, scroll-wheel zoom | Yes | Yes |
| Reading line, crosshair, invert / contrast | Yes | Yes |
| Color picker, link preview | Yes | Yes |
| Live translation | No | Yes |
| Priority translation APIs | No | Yes |
| Translation quota | — | 500 / day |
| Settings storage | Local | Chrome sync |

**Pro activation:** Enter a License Key in the extension popup. Keys are issued after purchase via [Afdian](https://afdian.com/a/clearview-magnifier) (or contact us on GitHub Issues for international users). Maintainers generate keys with `node scripts/issue-license.js`.

## Download & install

> Not on the Chrome Web Store yet — install via **Load unpacked** (Developer mode).

### Option A: GitHub Release (recommended)

1. Download the latest `clearview-magnifier-v*.zip` from [Releases](https://github.com/clearview-tools/clearview-magnifier/releases)
2. Unzip to a folder on your computer
3. Open `chrome://extensions/` in Chrome
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** and select the unzipped folder
6. On any `https://` page, press **Alt + Right-click** to start the magnifier

**Updates:** Download the new ZIP, replace the folder, then click **Reload** on the extension card in `chrome://extensions/`.

### Option B: Clone source (developers)

```bash
git clone https://github.com/clearview-tools/clearview-magnifier.git
```

Load the project root directory in `chrome://extensions/`.

> The extension does not run on `chrome://` pages. After install or update, refresh the current tab (F5).

## Buy Pro

| Step | Action |
|------|--------|
| Install | See Release download above |
| Purchase | [Afdian · clearview-tools](https://afdian.com/a/clearview-tools) or [open an Issue](https://github.com/clearview-tools/clearview-magnifier/issues) |
| Activate | Enter `CVPRO-XXXX-XXXX-XXXX` in the extension popup |

## Features

- **Screen magnifier** — Circular or rounded lens follows the cursor; zoom 1.5x–6x, lens size 120–400px
- **Live translation (Pro)** — Translates text under the lens; multi-API fallback
- **Reading aids** — Reading line, crosshair, high contrast / invert
- **Utilities** — Link preview, color picker, double-click to copy source + translation
- **Multiple ways to start** — Mouse chords, keyboard shortcuts, popup settings

## Quick start

1. On any web page, hold **Alt + Right-click** to start the magnifier
2. Move the mouse — the lens follows the cursor
3. **Scroll wheel** adjusts zoom; **Shift + scroll** adjusts lens size
4. Press **Esc** to exit

## Shortcuts

### Start & exit

| Action | Description |
|--------|-------------|
| `Alt` + Right-click | Start magnifier (stays on after release by default) |
| `Alt` + Middle-click | Toggle follow mode |
| `Alt` + `M` | Toggle magnifier |
| `Alt` + `T` | Toggle translation (Pro) |
| `Space` | Freeze / unfreeze lens position |
| `Esc` | Exit magnifier |

### Zoom & lens

| Action | Description |
|--------|-------------|
| Scroll wheel | Adjust zoom |
| `Shift` + scroll | Adjust lens size |
| `Ctrl` + scroll | Toggle invert colors |
| `[` / `]` | Zoom out / in |
| `,` / `.` | Lens smaller / larger |

### Other

| Action | Description |
|--------|-------------|
| Double-click | Copy source + translation |
| Right-click (on lens) | Pick color at center |
| `F` | High contrast mode |
| `C` | Copy current color |
| `R` | Refresh screenshot |

## Settings

Click the extension icon to open the popup:

- **Languages** — Source (auto-detect supported) and target
- **Magnifier** — Default zoom, lens size, shape; sliders apply live
- **Close on release** — If checked, magnifier closes when Alt+Right-click is released (default: stay on)
- **Assistive options** — Reading line, crosshair, link preview, color picker, HUD, etc.

Pro users: settings sync via `chrome.storage.sync` across Chrome profiles on the same Google account.

Wheel / shortcut adjustments during a session are **temporary**; the next session uses popup defaults again.

## Project structure

```
clearview-magnifier/
├── manifest.json           # Manifest V3
├── background/
│   ├── service-worker.js   # Screenshots, translation, commands
│   ├── license.js          # Pro license & quota
│   └── site-config.js      # Public URLs (privacy, purchase, support)
├── content/
│   ├── magnifier.js        # Core magnifier logic
│   └── magnifier.css
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── icons/
└── docs/                   # GitHub Pages (privacy policy, etc.)
```

## Technical notes

### Architecture

- **Manifest V3** with a Service Worker background script
- **Screenshots** — `chrome.tabs.captureVisibleTab`; rendered locally on Canvas
- **No recursive zoom** — Overlay hidden before each capture so the lens is not captured inside itself
- **Hot reload** — Re-injects content scripts after extension reload; refresh the page if you see “Extension context invalidated”

### Translation (Pro)

APIs are tried in order; on quota or failure, the next provider is used:

| Priority | Provider | Notes |
|----------|----------|-------|
| 1 | MyMemory | Primary; 1h cooldown after free quota |
| 2 | Google Translate | Fallback |
| 3 | Lingva | Fallback |

- 5-minute translation cache
- Max 500 characters per request

### Permissions

- `activeTab`, `storage`, `scripting`
- `<all_urls>` and translation API host permissions

## Privacy

- Translation sends only the text snippet under the lens to public third-party APIs
- Screenshots are processed locally in Canvas and are not uploaded
- Settings are stored locally or in Chrome sync (Pro)

## FAQ

**Lens not following / screenshot fails?**
- Use on normal `http://` or `https://` pages, not `chrome://`
- Reload the extension in `chrome://extensions/`, then refresh the page (F5)

**Zoom keeps changing?**
- Fixed in v1.0.3+: overlay hidden before capture prevents “nested zoom”
- Scroll-wheel zoom only applies while the magnifier is active

**Translation not working?**
- Live translation requires **Pro** and “Enable translation” in settings
- Public APIs have rate limits; the extension switches providers automatically
- Retry later or disable translation temporarily

## License

TBD

## Maintainer docs

- [Brand & open source](docs/brand-open-source.md)
- [Domestic sales (CN)](docs/sell-domestic.md)
- Pack for release: `.\scripts\pack-extension.ps1`
- Publish release: `.\scripts\release-github.ps1`
