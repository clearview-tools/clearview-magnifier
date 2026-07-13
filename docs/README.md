# 静态页面托管（隐私政策）

Chrome 网上应用店要求填写**可公开访问的隐私政策 URL**。

**若你走「品牌 + 开源」路线**，推荐 **GitHub 组织 + Pages**，完整步骤见 **[brand-open-source.md](./brand-open-source.md)**。

## 推荐：GitHub 组织 + Pages

1. 创建组织（如 `clearview-app`），仓库 `clearview-magnifier` 设为 **Public**
2. **Settings → Pages** → 分支 `main`，目录 **`/docs`**
3. 隐私政策 URL：

```
https://<组织名>.github.io/clearview-magnifier/privacy.html
```

4. License 白名单（可选）：将 `licenses.json` 放在 `docs/` 一并发布：

```
https://<组织名>.github.io/clearview-magnifier/licenses.json
```

5. 填入 `background/site-config.js` 的 `privacyUrl`、`licensesUrl`、`supportUrl`

对外显示组织品牌，不出现个人用户名。

## 备选：Cloudflare Pages

若暂时不想用 GitHub 公开仓库，可只上传 `docs/` 到 Cloudflare Pages（`*.pages.dev`）。适合纯静态托管，与开源品牌弱绑定。

## 备选：自有域名

将 `docs/` 部署到 Vercel / Netlify / 对象存储，例如 `https://clearview.example.com/privacy.html`。

---

## 项目内配置

编辑 **`background/site-config.js`**：

| 字段 | 用途 |
|------|------|
| `privacyUrl` | Chrome 商店隐私政策 |
| `purchaseUrl` | 扩展面板「购买 / 咨询」 |
| `supportUrl` | 组织 Issues 或客服邮箱 |
| `licensesUrl` | 已售 License 列表（可留空） |

## 文件说明

| 文件 | 说明 |
|------|------|
| `privacy.html` | 隐私政策正文 |
| `index.html` | 跳转到隐私政策 |
| `licenses.example.json` | 复制为 `licenses.json` 后部署 |
| `brand-open-source.md` | 组织创建、开源与上架路线图 |
