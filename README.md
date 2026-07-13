# ClearView Magnifier（阅屏助手）

[English README](README.en.md)

一款 Chrome 浏览器扩展，提供本地屏幕放大镜、实时翻译与多种阅读辅助功能，帮助用户更轻松地阅读网页内容。

当前版本：**1.1.3**

开源仓库：[github.com/clearview-tools/clearview-magnifier](https://github.com/clearview-tools/clearview-magnifier)  
隐私政策：[clearview-tools.github.io/clearview-magnifier/privacy.html](https://clearview-tools.github.io/clearview-magnifier/privacy.html)

## 免费版 vs Pro

| 功能 | 免费版 | Pro |
|------|--------|-----|
| 屏幕放大镜、滚轮缩放 | ✅ | ✅ |
| 阅读线、十字准星、反色等 | ✅ | ✅ |
| 颜色拾取、链接预览 | ✅ | ✅ |
| 实时翻译 | ❌ | ✅ |
| 优先 API（Google 优先） | ❌ | ✅ |
| 翻译额度 | — | 500 次/天 |
| 设置云同步 | 本地存储 | Chrome 同步 |

Pro 激活：扩展面板输入 License Key，**自激活日起有效期 1 年**（到期后自动恢复免费版，续购可重新激活）。正式密钥通过 [爱发电等渠道](docs/sell-domestic.md) 购买后发放；开发者用 `node scripts/issue-license.js` 生成。

## 下载与安装

### 方式 A：GitHub Release（推荐）

1. 打开 [Releases](https://github.com/clearview-tools/clearview-magnifier/releases) 下载 **`clearview-magnifier-v*.zip`**（不要下载 Source code）
2. 解压到本地文件夹
3. **加载时选中的文件夹里必须直接能看到 `manifest.json`**（若解压后还有一层 `clearview-magnifier` 子目录，请进入该子目录再选）
4. Chrome 打开 `chrome://extensions/` → 开启 **开发者模式**
5. **加载已解压的扩展程序** → 选择上述文件夹
6. 在普通 `https://` 网页上 **Alt + 右键** 启动放大镜

更新：下载新 ZIP 覆盖原目录，在扩展管理页点击 **重新加载**。

### 方式 B：克隆源码（开发者）

```bash
git clone https://github.com/clearview-tools/clearview-magnifier.git
cd clearview-magnifier
.\scripts\pack-extension.ps1
```

然后在 `chrome://extensions/` 加载 **`dist\clearview-magnifier`**（不要直接选项目根目录；根目录若含 `_` 开头的文件夹会导致 Chrome 拒绝加载）。

> 扩展无法在 `chrome://` 页面运行；安装或更新后请刷新网页（F5）。

## 购买 Pro（国内）

暂无上 Chrome 商店时，通过 **GitHub 安装免费版** + **国内平台购买 License**：

| 步骤 | 说明 |
|------|------|
| 安装 | 见上方 Release 下载 |
| 购买 | [爱发电 · clearview-tools](https://afdian.com/a/clearview-tools) |
| 激活 | 扩展面板输入 `CVPRO-XXXX-XXXX-XXXX` |

维护者发布新版本：`.\scripts\release-github.ps1`  
每售出一单：`node scripts/issue-license.js --add --commit` 后 `git push`

## 功能特性

- **屏幕放大镜** — 圆形 / 圆角矩形透镜，跟随鼠标移动，可调放大倍数（1.5x–6x）与透镜大小（120–400px）
- **实时翻译** — 放大镜指向位置的文字自动翻译，支持多 API 自动切换
- **阅读辅助** — 阅读辅助线、十字准星、高对比度 / 反色模式
- **实用工具** — 链接预览、颜色拾取、双击复制原文 + 译文
- **多种启动方式** — 鼠标组合键、快捷键、设置面板

## 安装（旧文档合并见上方「下载与安装」）

图标位于 `icons/`（16 / 48 / 128 px）。

### 隐私政策与品牌

推荐 **GitHub 组织 + Pages** 做品牌开源：对外是 `组织名.github.io`，不暴露个人账号。  
完整步骤见 **[docs/brand-open-source.md](docs/brand-open-source.md)**。

部署 `docs/` 后，将 URL 写入 `background/site-config.js`。国内售卖见 **[docs/sell-domestic.md](docs/sell-domestic.md)**。

## 快速上手

1. 在任意网页上按住 **Alt + 右键** 启动放大镜
2. 移动鼠标，透镜跟随光标
3. **滚轮** 调整放大倍数，**Shift + 滚轮** 调整透镜大小
4. 按 **Esc** 退出

## 快捷操作

### 启动与退出

| 操作 | 说明 |
|------|------|
| `Alt` + 右键 | 启动放大镜（默认松开后保持，继续跟随鼠标） |
| `Alt` + 中键 | 切换常驻跟随模式 |
| `Alt` + `M` | 开关放大镜 |
| `Alt` + `T` | 开关实时翻译 |
| `Space` | 冻结 / 解冻透镜位置 |
| `Esc` | 退出放大镜 |

### 放大与调节

| 操作 | 说明 |
|------|------|
| 滚轮 | 调整放大倍数 |
| `Shift` + 滚轮 | 调整透镜大小 |
| `Ctrl` + 滚轮 | 切换反色模式 |
| `[` / `]` | 放大倍数快捷键（缩小 / 放大） |
| `,` / `.` | 透镜大小快捷键（缩小 / 放大） |

### 其他

| 操作 | 说明 |
|------|------|
| 双击 | 复制原文 + 译文 |
| 右键（透镜内） | 拾取中心颜色 |
| `F` | 高对比度模式 |
| `C` | 复制当前颜色 |
| `R` | 刷新截图画面 |

## 设置

点击扩展图标打开弹出面板，可配置：

- **翻译语言** — 源语言（支持自动检测）与目标语言
- **放大镜** — 默认放大倍数、透镜大小、透镜形状；滑块拖动时实时生效
- **松开后关闭** — 勾选后，松开 Alt+右键 即关闭放大镜（默认保持）
- **辅助功能** — 阅读线、十字准星、链接预览、颜色拾取、操作提示条等

设置通过 `chrome.storage.sync` 同步，登录同一 Google 账号的浏览器间可共享。

使用过程中的滚轮 / 快捷键调节为**临时会话值**，不会覆盖设置面板中的默认值；下次启动时恢复为面板设定值。

## 项目结构

```
clearview-magnifier/
├── manifest.json           # 扩展清单（Manifest V3）
├── background/
│   └── service-worker.js   # 截图捕获、多 API 翻译、快捷键路由
├── content/
│   ├── magnifier.js        # 放大镜核心逻辑（Content Script）
│   └── magnifier.css       # 放大镜样式
├── popup/
│   ├── popup.html          # 设置面板
│   ├── popup.css
│   └── popup.js
├── icons/                  # 扩展图标（16 / 48 / 128）
└── docs/                   # GitHub Pages 隐私政策
    ├── privacy.html
    └── index.html
```

## 技术说明

### 架构

- **Manifest V3** — Service Worker 作为后台脚本
- **截图** — `chrome.tabs.captureVisibleTab` 捕获当前标签页画面，在 Canvas 中局部放大渲染
- **截图防套娃** — 每次截图前临时隐藏 overlay，避免把上一帧放大镜截入画面造成递归放大
- **扩展热更新** — 扩展重载后自动向已打开页面重新注入脚本；若出现「Extension context invalidated」，刷新页面即可

### 翻译

多 API 按优先级自动 fallback，某一服务配额用尽时自动切换下一个：

| 优先级 | 服务 | 说明 |
|--------|------|------|
| 1 | MyMemory | 主服务，免费额度用尽后冷却 1 小时 |
| 2 | Google Translate | 备用通道 |
| 3 | Lingva | 第三备用 |

- 内置 5 分钟翻译缓存，减少重复请求
- 单次翻译最多 500 字符

### 权限

- `activeTab`、`storage`、`scripting`
- `<all_urls>` 及翻译 API 主机权限

## 隐私

- 翻译请求发送至第三方公共翻译 API，仅传输放大镜区域内的文字片段
- 截图仅在本地 Canvas 中处理，不上传至任何服务器
- 设置保存在浏览器本地 / 同步存储中

## 常见问题

**透镜不跟随 / 截图失败？**
- 确认在普通网页上使用，而非 `chrome://` 页面
- 在 `chrome://extensions/` 重新加载扩展后，刷新当前网页（F5）

**放大倍数一直在变？**
- 已在 v1.0.3+ 修复：截图前隐藏 overlay，防止「套娃放大」
- 滚轮调节仅在放大镜开启时生效，按 Esc 关闭后可正常滚动页面

**翻译不可用？**
- 免费 API 有频率限制，扩展会自动切换备用服务
- 稍后重试，或在设置中暂时关闭实时翻译

## 许可证

待定
