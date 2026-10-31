# 修复课程页、专题页缺脚本

日期：2026-10-30。用户确认切换线上。

- 问题：`20261027-remaining-pages-redesign` 那次部署只跑了生成脚本、没跑 `apply-seo.mjs`，/course、/eq、/love-advisor、/ai-relationship-coach、/tong-jincheng-skill 缺 analytics.js、mp-qr.js（专题页还缺 article.js）。点「立即体验」没反应，也不记统计。
- 修复：main `31fb601`（PR #10），按 README 的完整构建命令重新生成，只改这 5 页 `<head>` 的脚本标签；README 构建命令补全所有生成脚本。
- 部署：基线 `dpl_25a9y1KkXSDkenFANjXbNMjqoUyz` → 新版本 `dpl_FDK2dZ9apU8i3vGRsGQREBBfRAvA`（上传 6 个文件），候选验证后切 `r2i84a.chat`。
- 验证：5 页都有 analytics.js、mp-qr.js；`/api/web/health` 与旧版逐字一致；`/blog/qinggan-025` 308。
- 回滚：别名指回 `dpl_25a9y1KkXSDkenFANjXbNMjqoUyz`。
- 以后部署前必须跑 README 里的完整构建命令（最后是 apply-seo + test-seo），否则注入的脚本会丢。
