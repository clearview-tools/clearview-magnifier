/**
 * 对外展示的链接（商店审核、购买页、License 白名单等）
 *
 * 品牌开源路线：使用 GitHub 组织（见 docs/brand-open-source.md）
 * 把 YOUR-ORG 换成你的组织名，例如 clearview-app：
 *
 *   privacyUrl:  'https://YOUR-ORG.github.io/clearview-magnifier/privacy.html'
 *   supportUrl:  'https://github.com/YOUR-ORG/clearview-magnifier/issues'
 *   licensesUrl: 'https://YOUR-ORG.github.io/clearview-magnifier/licenses.json'
 */
const SITE_CONFIG = {
  /** Chrome 商店「隐私政策」必填 URL */
  privacyUrl: '',

  /** 购买 Pro / 咨询（Gumroad、Lemon Squeezy 商品页等） */
  purchaseUrl: '',

  /** 用户反馈：组织仓库 Issues 或 mailto: */
  supportUrl: '',

  /**
   * 已售出 License 远程白名单（docs/licenses.json 部署到 Pages 后的 URL）
   * 留空则仅校验码算法 + 开发测试密钥有效
   */
  licensesUrl: ''
};
