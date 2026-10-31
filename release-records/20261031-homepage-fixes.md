# 首页修复上线

日期：2026-10-31。

- main `48f1cd2`（PR #12）：「开通月卡」按钮透明底（之前浏览器默认浅灰底 + 白字看不见）；第一个视频用真实封面；恢复右下角小程序码浮窗（tools/home-mp-float.html）；STYLE_VERSION 升到 20261101。
- 部署：基线 `dpl_3WtX1dfC4ygbUNUMaJmod2EDNQ3S` → `dpl_ChVtjknn1sdGadVvkKRQ4Yi4Zq4b`，上传 103 个文件（全站样式版本号变了）。
- 验证：首页含浮窗和第一个视频封面，home.css 含按钮修复；/course、/learn、文章页 200；`/api/web/health` 与旧版逐字一致。
- 回滚：别名指回 `dpl_3WtX1dfC4ygbUNUMaJmod2EDNQ3S`。
