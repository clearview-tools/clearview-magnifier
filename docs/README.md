# GitHub Pages 部署说明

本目录用于托管 **隐私政策** 等静态页面，供 Chrome 网上应用店审核使用。

## 部署步骤

1. 将本仓库推送到 GitHub（例如 `yourname/clearview-magnifier`）
2. 打开仓库 **Settings → Pages**
3. **Source** 选择 `Deploy from a branch`
4. **Branch** 选择 `main`，文件夹选择 **`/docs`**
5. 保存后等待 1～2 分钟

部署完成后，隐私政策 URL 为：

```
https://<你的用户名>.github.io/clearview-magnifier/privacy.html
```

将此 URL 填入 Chrome Web Store 开发者控制台的 **Privacy policy** 字段。

## 文件说明

| 文件 | 说明 |
|------|------|
| `privacy.html` | 隐私政策正文（商店审核必填） |
| `index.html` | 自动跳转到隐私政策 |

## 自定义

- 修改 `privacy.html` 中的「联系我们」为实际邮箱或 GitHub Issues 链接
- 更新「生效日期」与版本号
