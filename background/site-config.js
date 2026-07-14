/**
 * 对外展示的链接（商店审核、购买页、License 白名单等）
 * 组织：clearview-tools · 仓库：clearview-magnifier
 */
const SITE_CONFIG = {
  /** Chrome 商店「隐私政策」必填 URL */
  privacyUrl: 'https://clearview-tools.github.io/clearview-magnifier/privacy.html',

  /** 购买 Pro / 咨询（爱发电） */
  purchaseUrl: 'https://afdian.com/a/clearview-magnifier',

  /** 用户反馈：组织仓库 Issues */
  supportUrl: 'https://github.com/clearview-tools/clearview-magnifier/issues',

  /**
   * 已售出 License 远程白名单（docs/licenses.json 部署到 Pages 后的 URL）
   * 留空则仅校验码算法有效
   */
  licensesUrl: 'https://clearview-tools.github.io/clearview-magnifier/licenses.json'
};
