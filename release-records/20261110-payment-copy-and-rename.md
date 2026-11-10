# 付款文案 + 小程序改名上线

日期：2026-11-10。用户确认上线。

## 范围

- 分支 `feat/web-order-auto-claim`（`57beca7`、`98310ca`、`79aa7fc`），基于 main `631f173`。
- 付款流程文案：无需登录，会员开到付款的这个微信；付款后用这个微信打开小程序自动到账（依赖小程序后端 `love-train-mp3-122` 的认领逻辑，已于同日全量）。去掉了「同意付款后联系客服人工开通」这一步；付款后页面每 4 秒查一次（最多 10 分钟），到账后自动显示「会员已到账」；客服改为兜底。
- 小程序改名：`SITE_BRAND`、`MINIPROGRAM_NAME` 改为「人小鬼大恋爱助手」，旧名「情商练习有事问AI」加入 `PREVIOUS_BRANDS`。标题、页头页脚、JSON-LD、llms.txt、搜索提示、二维码 alt 全部更新；`alternateName: 练爱导师` 保留；文章正文里的「练爱导师」未改。
- 首页：价格标签改为「付款后打开小程序自动到账」，FAQ「付款后多久能用？」同步。
- 脚本版本：COMMERCE 20261110、STYLE 不变、analytics/mp-qr 20261110、chat-quiz 20261110。
- 未修改依赖、环境变量、数据库、函数代码、vercel.json。

## 部署

- 基线 `dpl_7LReFQbBJji2xQB4ZVZJFjN4ACv3` → `dpl_D1UgK6yjSYgDNFoDL2MJGSyUim4S`（`love-train-v12-jv2nrsd0j-flyxqc1s-projects.vercel.app`）。
- 方式：继承基线全部 12,247 个文件 SHA，只替换 107 个静态文件（替换前逐个核对线上 SHA 与 main `631f173` 一致）；函数（含 `api/web` 17.33MB）原样保留。脚本：`~/Developer/release/website-static-swap.py`（Vercel API `prebuilt=1`）。
- 候选验证后切 `r2i84a.chat`。

## 验证

- 构建：README 完整构建命令连续运行三次，结果一致；test-seo PASS；`tests/wx-*.test.mjs` 37/37 通过；JSON-LD 可解析。
- 本地浏览器（模拟 `/api/web`）：选套餐 → 扫码 → 已付款 → 自动变为已到账，全流程文案正确。
- 正式站：首页标题和品牌为新名，旧名 0 处；`/api/web/health` 与旧版逐字一致；`/eq`、`/blog`、`/quiz`、`/llms.txt`、`/sitemap.xml`、`/wechat-login` 200；`/blog/qinggan-025` 308。
- 未做真实付款测试（付款接口未改）。

## IndexNow

提交 sitemap 内本次变更的 55 个页面，返回 200（已接收，不等于已收录）。另有一次参数拼接错误提交了 1 个无效网址，无影响。

## 回滚

`r2i84a.chat` 别名指回 `dpl_7LReFQbBJji2xQB4ZVZJFjN4ACv3`。

## 补发：付款脚本缓存（同日）

- 问题：切换前我在正式域名上请求过 `web-commerce.js?v=20261110` 做对比，旧版本的脚本被 CDN 缓存在了这个新版本号下，切换后弹窗仍显示旧的「同意付款后联系客服人工开通」。`love-train-v12.vercel.app` 也还指向旧部署。
- 修复：`COMMERCE_VERSION` 改为 `20261110b`（`18102a2`），只替换 `index.html`：`dpl_D1UgK6yjSYgDNFoDL2MJGSyUim4S` → `dpl_2gNamqs88axhFxJA7dys4TVB1JsE`（`love-train-v12-nh2214f6t-flyxqc1s-projects.vercel.app`），`r2i84a.chat` 和 `love-train-v12.vercel.app` 都指过去。
- 验证：两个域名首页都引用 `?v=20261110b`，脚本内容与仓库一致，旧文案 0 处；`/api/web/health` 逐字一致。
- 教训：新版本号在切换前只通过候选 URL 验证，不要在正式域名上请求；项目的两个生产域名都要切。
- 回滚：两个域名都指回 `dpl_7LReFQbBJji2xQB4ZVZJFjN4ACv3`。
