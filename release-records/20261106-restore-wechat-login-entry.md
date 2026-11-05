# 恢复微信登录入口上线

日期：2026-11-06。用户确认上线。

- main `631f173`（PR #13）：统一页头加回「微信登录」链接（默认跳 `/wechat-login`）；首页打开登录弹窗并显示订阅号二维码；宽度小于 360px 隐藏入口；STYLE_VERSION、COMMERCE_VERSION 升到 20261105。
- 原因：PR #11 首页改版重写页头时去掉了登录按钮，公众号欢迎语指向的入口不存在。`/wechat-login` 和配对接口未受影响，欢迎语未改。
- 部署：基线 `dpl_ChVtjknn1sdGadVvkKRQ4Yi4Zq4b` → `dpl_7LReFQbBJji2xQB4ZVZJFjN4ACv3`（`love-train-v12-mrz4qfmck-flyxqc1s-projects.vercel.app`），继承基线全部文件 SHA，只替换 103 个静态文件，保留 11,706 个函数文件；替换前核对这 103 个文件的线上 SHA 与旧 main 一致。候选验证后切 `r2i84a.chat`。
- 验证：test-seo PASS；`tests/wx-*.test.mjs` 37 项通过；候选上主要页面 200、`/blog/qinggan-025` 308、`/api/web/health` 与旧版逐字一致；正式站首页弹窗显示二维码和两个按钮；脚本未加载完时点击会跳到 `/wechat-login`，页面正常出码。
- 未验证：真实微信扫码、发送 6 位码、网页自动登录的完整流程。
- 未修改依赖、环境变量、数据库、函数代码、vercel.json。
- 回滚：别名指回 `dpl_ChVtjknn1sdGadVvkKRQ4Yi4Zq4b`。

## IndexNow

提交 sitemap 内本次变更的页面 55 个，`tools/indexnow-submit.mjs` 返回 200（已接收，不等于已收录）。
