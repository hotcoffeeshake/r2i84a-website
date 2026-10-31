# 首页改版上线

日期：2026-10-30。用户确认上线。

## 范围

- main `f674e5b`（PR #11）。首页由 `tools/build-home-page.mjs` 生成静态页面，不再用 React 打包文件；保留标题、描述、canonical、结构化数据（FAQPage 改成页面上的 4 个常见问题）。页面从约 462KB 降到 14KB。
- 首屏：小腾哥 3 个 B 站视频（原标题、2026-10-30 播放量）；聊天示例；三步；会员价格（免费每天 6 次；会员每天 30 次 + 许跃腾 Skill；付款后 2 小时内开通）；证据（5K+ 人在用、B 站 50 万+、330 万+ 播放、GitHub 3K Stars）和一张用户反馈截图；小腾哥课程；常见问题。
- `assets/web-commerce.js` 只改了套餐卡片的样式和文案，付款流程、接口调用不变。
- 新增静态文件：`assets/home.css`、两张视频封面、一张反馈截图。
- 未修改依赖、环境变量、数据库、函数代码、vercel.json。

## 部署

- 基线 `dpl_FDK2dZ9apU8i3vGRsGQREBBfRAvA` → 新版本 `dpl_3WtX1dfC4ygbUNUMaJmod2EDNQ3S`（`love-train-v12-9thbh4k5r-flyxqc1s-projects.vercel.app`），上传 7 个文件，候选验证后切 `r2i84a.chat`。

## 验证

- 构建：README 完整构建命令连续运行两次无变化，test-seo PASS。
- 本地浏览器：1280 / 375 宽度对齐、无横向滚动，三个视频标题都在第一屏；「开通年卡」打开付款弹窗；「立即体验」弹小程序码；测验弹窗照常。
- 候选和正式：首页 200、3 张视频卡、`#r2payGrid` 存在、web-commerce.js v=20261031 含「许跃腾 Skill」、测验 / 统计 / 小程序码脚本都在、无 React 内联数据；新增资源 200；`/api/web/health` 与旧版逐字一致；`/blog/qinggan-025` 308。
- 未做真实付款测试（付款接口代码没改）。

## IndexNow

`/`，返回 200。

## 回滚

`r2i84a.chat` 别名指回 `dpl_FDK2dZ9apU8i3vGRsGQREBBfRAvA`。
