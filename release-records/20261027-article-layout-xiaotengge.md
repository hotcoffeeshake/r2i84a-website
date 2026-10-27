# 文章页阅读版式、首页小腾哥区块、百度统计 ID 上线

日期：2026-10-27。用户明确授权生产发布。

## 源码与范围

- main `5126aee`：`6424fc9`（百度统计 ID 填入，analytics.js 升到 v=20261028）+ PR #7（文章页单栏阅读版式 assets/article.css + apply-seo articleLayout()；首页小腾哥静态区块；全站「腾哥」改「小腾哥」、名字改「许跃腾」；B 站视频点击统计）。
- 未修改依赖、环境变量、数据库、函数代码、vercel.json。

## 构建与部署

做法同 20261027-seo-analytics-course.md，脚本见项目外的 `网站SEO_GEO/部署脚本/deploy.py`：

- 基线：`dpl_CGP4S53Vw2CFJ71u9XqVxDC1GWvR`；函数等非静态文件按原 SHA 保留。
- 静态文件新增 `assets/article.css`、`assets/xiaotengge-video-cover.jpg`，其余按 main 更新，上传 110 个变化文件。
- 新版本：`dpl_9n4YmLX7tHFwrAYowWY2GjQgXijB`，`love-train-v12-ajcov8slf-flyxqc1s-projects.vercel.app`。候选验证后把 `r2i84a.chat` 切过去。
- 中间建过的 `dpl_99vun7vbEmerKCfXWep2zF4ziHXp`（只含统计 ID）未使用。

## 验证

- 候选与正式：`/`、`/course`、`/quiz`、`/wechat-login`、`/answers/she-replies-oh`、`/blog/entp-girlfriend`、`/assets/article.css`、封面图 HTTP 200；首页含 `id="xiaotengge"`；文章页加载 article.css；analytics.js 的 BAIDU_ID 有值；`/blog/qinggan-025` 308；`/api/web/health` 与旧版逐字一致。
- 本地预览看过手机（375px）和电脑宽度。

## IndexNow

首页、/course 和 24 篇可收录文章，共 26 个网址，返回 200。

## 回滚

将 `r2i84a.chat` 别名指回 `dpl_CGP4S53Vw2CFJ71u9XqVxDC1GWvR`（`love-train-v12-a1j3gicoc-flyxqc1s-projects.vercel.app`）。
