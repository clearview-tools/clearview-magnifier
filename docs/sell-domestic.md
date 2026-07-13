# GitHub 分发 + 国内平台卖 Pro

在暂时无法访问 Chrome 开发者控制台时，用 **GitHub Releases 发安装包** + **国内平台卖 License**。

## 用户流程

```
GitHub Releases 下载 ZIP
        ↓
Chrome 开发者模式加载扩展（免费版）
        ↓
爱发电 / 小报童 购买 Pro
        ↓
收到 License Key（私信或邮件）
        ↓
扩展面板激活 → 开启实时翻译
```

---

## 一、发布安装包（你操作）

### 1. 打包

```powershell
cd e:\pythonproject\clearview-magnifier
.\scripts\pack-extension.ps1
```

生成：`dist/clearview-magnifier-v1.1.1.zip`

### 2. 创建 GitHub Release

> 下载说明：只让用户下 **`clearview-magnifier-v*.zip`**，不要下 **Source code**（源码归档会包含 `scripts/` 等，且无 `.git`）。

**方式 A：命令行**

```powershell
.\scripts\release-github.ps1
```

**方式 B：网页发布**（网络进不了 `gh login` 时用）

```powershell
.\scripts\pack-extension.ps1
```

或双击 `scripts\pack-for-release.bat`，然后：

1. 打开 https://github.com/clearview-tools/clearview-magnifier/releases/new  
2. **Choose a tag** → 输入 `v1.1.1`（与 `manifest.json` 版本一致）→ **Create new tag**  
3. 上传 `dist/clearview-magnifier-v1.1.1.zip`  
4. **Publish release**

> `gh auth login` 失败多为网络问题。GitHub 网页能打开时，用方式 B 即可，不必强求 CLI。

### 3. 用户安装步骤（写在商品页和 README）

1. 打开 [Releases](https://github.com/clearview-tools/clearview-magnifier/releases) 下载最新 ZIP  
2. 解压到任意文件夹（如 `D:\clearview-magnifier`）  
3. Chrome 地址栏输入 `chrome://extensions/`  
4. 开启右上角 **开发者模式**  
5. 点击 **加载已解压的扩展程序**，选择解压后的文件夹  
6. 打开任意 `https://` 网页，**Alt + 右键** 启动放大镜  

> 更新版本：下载新 ZIP 解压覆盖原文件夹，在 `chrome://extensions/` 点扩展的 **重新加载**。

---

## 二、国内售卖平台（选一个）

| 平台 | 网址 | 特点 |
|------|------|------|
| **爱发电** | [afdian.com](https://afdian.com) | 国内常用，微信/支付宝，适合个人创作者 |
| **小报童** | [xiaobot.net](https://xiaobot.net) | 专栏/付费内容，可卖「Pro 权益说明 + 密钥」 |

### 爱发电商品建议

| 项 | 内容 |
|----|------|
| **标题** | ClearView 阅屏助手 Pro — 实时翻译一年 |
| **价格** | ¥39～68（先低价测转化） |
| **封面** | 商品图：`icons/icon160.png` 或 `icon256.png`；主页横幅：`docs/cover-1440x360.png`（1440×360） |
| **正文** | 功能说明 + 安装链接 + 「付款后私信发 License」 |

**商品正文模板：**

```
【ClearView Pro 包含】
✅ 放大镜内实时翻译
✅ 多 API 优先与每日 500 次额度
✅ 设置 Chrome 云同步

【安装扩展（免费加载）】
1. 下载：https://github.com/clearview-tools/clearview-magnifier/releases
2. 解压后 chrome://extensions/ → 开发者模式 → 加载已解压的扩展程序

【激活 Pro】
付款后我会私信发送 License Key（格式 CVPRO-XXXX-XXXX-XXXX）
打开扩展图标 → 输入密钥 → 点「激活」→ 勾选「启用实时翻译」

【说明】
- 需 Chrome / Edge 等 Chromium 浏览器
- 翻译需访问外网 API，网络不佳时可能变慢
- 支持：GitHub Issues 留言
```

### 小报童

可建专栏「ClearView 使用与 Pro 激活」，首篇写安装教程，购买后通过专栏/私信发 License。

---

## 三、每卖出一单（你操作）

```powershell
node scripts/issue-license.js --add --commit
git push origin main
```

1. 终端会打印 License 和发给买家的文字  
2. `--add` 写入 `docs/licenses.json`（远程白名单校验）  
3. `git push` 后约 1～2 分钟 Pages 更新  

也可手动：

```powershell
node scripts/generate-license-key.js
# 复制密钥到 docs/licenses.json 的 keys 数组，commit + push
```

---

## 四、扩展里显示购买链接

爱发电商品页创建后，编辑 `background/site-config.js`：

```javascript
purchaseUrl: 'https://afdian.com/a/clearview-tools',
```

重新打包 Release，用户扩展面板会出现 **购买 / 咨询**。

---

## 五、注意事项

- **不要**在公开商品页、安装包或源码中发布测试用 License 密钥  
- `docs/licenses.json` 在 GitHub 公开；只放**已售出**密钥即可  
- 退款：从 `licenses.json` 删除对应 key 并 push，远程校验即失效（已激活用户本地仍有效，严重情况需改密钥算法批次）  
- 以后能访问 Google 时，再上架 Chrome 商店，商店版可与 GitHub 版共用 License  

---

## 六、检查清单

- [ ] Release 已发布且 ZIP 可下载  
- [ ] README 安装说明清晰  
- [ ] 爱发电/小报童商品已上架  
- [ ] `purchaseUrl` 已填入并发了新 Release  
- [ ] 自己走一遍：下载 ZIP → 安装 → 模拟发 License → 激活 Pro  
