# ClearView Magnifier

[中文 README](README.md)

A browser extension with a local screen magnifier, optional live translation, and reading aids to make web content easier to read.

**Current version:** 1.1.4

- **Repository:** [github.com/clearview-tools/clearview-magnifier](https://github.com/clearview-tools/clearview-magnifier)
- **Releases:** [Download ZIP](https://github.com/clearview-tools/clearview-magnifier/releases)
- **Privacy policy:** [Privacy page](https://clearview-tools.github.io/clearview-magnifier/privacy.html)
- **Feedback:** [GitHub Issues](https://github.com/clearview-tools/clearview-magnifier/issues)

## Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Screen magnifier, scroll-wheel zoom | Yes | Yes |
| Reading line, crosshair, invert / contrast | Yes | Yes |
| Color picker, link preview | Yes | Yes |
| Live translation | No | Yes |
| Priority translation channels | No | Yes |
| Translation quota | — | 500 / day |
| Settings storage | Local | Chrome sync |

**Pro activation:** Enter a License Key in the extension popup. **Valid for 1 year from activation** (reverts to free when expired; renew with a new key). Keys are issued after purchase via [Afdian](https://afdian.com/a/clearview-magnifier) (or contact us on [GitHub Issues](https://github.com/clearview-tools/clearview-magnifier/issues) for international inquiries).

## Download & install

> Not on the Chrome Web Store yet — install via **Load unpacked** (Developer mode).

### Chrome / Edge (recommended)

1. Download **`clearview-magnifier-v*.zip`** from [Releases](https://github.com/clearview-tools/clearview-magnifier/releases) — **not** “Source code”
2. Unzip the folder; it must **directly contain `manifest.json`**
3. Open `chrome://extensions/` (Edge: `edge://extensions/`) → enable **Developer mode**
4. Click **Load unpacked** and select that folder
5. On any `https://` page, press **Alt + Right-click** to start the magnifier

**Updates:** Download the new ZIP, replace the folder, click **Reload** on the extension card, then refresh the page (F5).

> The extension does not run on built-in browser pages such as `chrome://`.

### 360 Browser (Secure / Speed)

360 browsers can load the extension in Developer mode. The popup includes **browser compatibility patches** with automatic detection:

| Browser | Extensions page | Recommended patch |
|---------|-----------------|-------------------|
| **360 Speed** | `chrome://extensions/` | 360 Speed patch |
| **360 Secure** | `se://extensions/` | 360 Secure patch |

1. Unzip the [Release ZIP](https://github.com/clearview-tools/clearview-magnifier/releases) (folder must contain `manifest.json` at the top level)
2. Use **Chromium / Speed mode** (lightning icon), not IE compatibility mode
3. Load unpacked from the extensions page above
4. Open the ClearView popup → **Browser compatibility** → keep **Auto** or apply the recommended patch
5. Refresh any `https://` tab (F5), then **Alt + Right-click**

## Buy Pro

| Step | Action |
|------|--------|
| Install | See download & install above |
| Purchase | [Afdian · clearview-magnifier](https://afdian.com/a/clearview-magnifier) |
| Activate | Enter `CVPRO-XXXX-XXXX-XXXX` in the extension popup |

International users can also reach out via [GitHub Issues](https://github.com/clearview-tools/clearview-magnifier/issues).

## Features

- **Screen magnifier** — Circular or rounded lens follows the cursor; adjustable zoom and lens size
- **Live translation (Pro)** — Translates text under the lens
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
- **Magnifier** — Default zoom, lens size, shape
- **Close on release** — If checked, magnifier closes when Alt+Right-click is released (default: stay on)
- **Assistive options** — Reading line, crosshair, link preview, color picker, HUD, etc.
- **Browser compatibility** — Recommended patches for 360 and similar environments

Pro users can sync settings across profiles on the same browser account. Wheel / shortcut adjustments during a session are temporary; the next session uses popup defaults again.

## Privacy

- Translation sends only the text snippet under the lens to public third-party services
- Screenshots are processed locally and are not uploaded
- Settings are stored locally or in browser sync (Pro)

See the [privacy policy](https://clearview-tools.github.io/clearview-magnifier/privacy.html).

## FAQ

**Lens not following / screenshot fails?**
- Use on normal `http://` or `https://` pages, not built-in browser pages
- Reload the extension, then refresh the page (F5)

**Translation not working?**
- Requires **Pro** and “Enable translation” in settings
- Public translation services have rate limits — retry later
- On 360 Secure Browser, enable the “360 Secure” compatibility patch in the popup

**360 browser issues?**
- Popup → **Browser compatibility** → use the recommended patch or keep Auto
- Must use Chromium / Speed mode

**Cannot load after download?**
- Download the Release **`.zip` package**, not Source code
- Select the unzipped folder that **directly contains `manifest.json`**
