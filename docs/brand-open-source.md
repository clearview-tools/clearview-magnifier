# 品牌开源路线图（GitHub 组织）

面向「对外是产品品牌、代码可开源、不暴露个人 GitHub 用户名」的推荐路径。

## 目标架构

```
用户看到的品牌层
├── Chrome 商店：ClearView Magnifier
├── GitHub：github.com/<组织名>/clearview-magnifier
├── 隐私政策：<组织名>.github.io/clearview-magnifier/privacy.html
├── Issues：用户反馈 / Bug
└── Gumroad 等：Pro 购买（站外）

你个人账号
└── 可不公开，或仅作为组织成员存在后台
```

---

## 第一步：创建 GitHub 组织

1. 打开 [GitHub → New organization](https://github.com/organizations/plan)
2. 选 **Free** 即可
3. 组织名建议简短、好记、和扩展一致，例如：
   - `clearview-app`
   - `clearview-tools`
   - `clearview-magnifier`（与仓库同名也行）

> 对外显示的是组织名，不是 `cokicai`。

4. 组织 **Profile** 可填：
   - **Display name**：ClearView
   - **Description**：Screen magnifier & reading assistant for Chrome
   - **URL**：Chrome 商店链接（上架后）或 Gumroad
   - **Logo**：用 `icons/icon128.png`

---

## 第二步：创建公开仓库并推送代码

在组织下 **New repository**：

- Name：`clearview-magnifier`
- Visibility：**Public**（开源）
- 不要勾选把个人仓库 Transfer（若已有个人仓，也可后面 Transfer）

本地推送（组织 **clearview-tools**）：

```bash
cd e:\pythonproject\clearview-magnifier
git remote set-url origin https://github.com/clearview-tools/clearview-magnifier.git
git push -u origin main
```

---

## 第三步：开启 GitHub Pages（隐私政策）

仓库 **Settings → Pages**：

| 项 | 值 |
|----|-----|
| Source | Deploy from a branch |
| Branch | `main` |
| Folder | **`/docs`** |

约 1～2 分钟后可访问：

```
https://clearview-tools.github.io/clearview-magnifier/privacy.html
```

---

## 第四步：项目链接（已配置）

`background/site-config.js` 已写入组织地址；`purchaseUrl` 在 Gumroad 等商品页就绪后再填。

```javascript
const SITE_CONFIG = {
  privacyUrl: 'https://clearview-tools.github.io/clearview-magnifier/privacy.html',
  purchaseUrl: '',
  supportUrl: 'https://github.com/clearview-tools/clearview-magnifier/issues',
  licensesUrl: 'https://clearview-tools.github.io/clearview-magnifier/licenses.json'
};
```

正式售卖前在 `docs/licenses.json` 填入已售密钥并 push（勿提交测试用或无效的公开密钥）。

---

## 第五步：开源品牌清单

上架 / 开源前建议补齐：

| 项 | 说明 |
|----|------|
| **LICENSE** | 建议 MIT（代码开源，不影响 Pro 收费） |
| **README** | 英文摘要 + 功能截图 + 商店安装链接 |
| **CONTRIBUTING.md** | 可选，说明如何提 Issue / PR |
| **Issue 模板** | Bug 报告、功能建议 |
| **Releases** | 每个商店版本打 Git tag，如 `v1.1.1` |
| **隐私政策** | `docs/privacy.html` 联系渠道改为组织 Issues 或客服邮箱 |

### 代码开源 vs Pro 收费

- **开源**：放大镜、阅读辅助等免费功能代码
- **收费**：Pro License 验证 + 翻译额度（`license.js`）
- 这是常见模式（开源 + 商业许可），在 README 写清即可

---

## 第六步：Chrome 商店与品牌统一

商店资料建议与 GitHub 组织一致：

- **开发者名称**：ClearView 或组织显示名
- **隐私政策**：与 `privacyUrl` 相同
- **官网 / 支持链接**：组织仓库或 Issues
- **截图、描述**：强调「免费放大镜 + Pro 翻译」

---

## 个人账号怎么处理

| 做法 | 说明 |
|------|------|
| **推荐** | 个人账号只做组织 Owner，对外只宣传组织链接 |
| 个人仓 | 可 Archive 或改 Private，避免两个入口混淆 |
| 提交记录 | 开源后 commit 会显示你的 GitHub 名；若介意可用组织邮箱、或在 README 用团队品牌署名 |

若希望 commit 也不暴露个人名，需要单独配置 git 邮箱或使用机器账号，一般个人开发者不必做到这步。

---

## 建议时间线

1. **本周**：建组织 → 推代码 → 开 Pages → 填 `site-config.js`
2. **下周**：补 LICENSE、英文 README、商店截图 → 提交 Chrome 审核
3. **上架后**：Gumroad 商品页 + Releases 与商店版本同步
4. **有用户后**：用 Issues 收集反馈，小版本持续开源更新
