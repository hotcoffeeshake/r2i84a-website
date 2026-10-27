# 文章页改版、体验弹窗、导航调整上线

日期：2026-10-27。用户授权：「检查后可以推送改动上线」。

## 源码与范围

- main `9448fef`：PR #8（体验入口原地弹小程序码、删除 /experience、顶部导航去掉购买会员）+ PR #9（文章页按设计规范改版）。
- PR #9 由执行 Agent 完成主体，上线前检查修正：生成模板同步到定稿（文末小程序码区块、作者卡左文右码放助理微信、去掉目录行动卡）；旧文章外壳可重复更新；发布平台用 data-platform 保存；两句课程原话出处改准。
- 未包含：问答页、课程页、学习页仍是旧样式（实施规范第 6、7 节待做）。
- 未修改依赖、环境变量、数据库、函数代码。

## 部署

- 基线 `dpl_9n4YmLX7tHFwrAYowWY2GjQgXijB`，函数文件原样保留；静态文件新增 tokens.css、article.js、mp-qr.js，删除 experience.html/css，上传 116 个变化文件。
- 新版本 `dpl_5ernYyMzLqL5Xrw4Agf1Sgt2cxxJ`（`love-train-v12-k2p6elu2u-flyxqc1s-projects.vercel.app`），候选验证后切 `r2i84a.chat`。

## 验证

- test-seo PASS，连续运行无变化。
- 本地浏览器：375 / 911 / 1363 宽度左边缘一致（20 / 108 / 206），两个二维码左边缘一致；手机一句话结论底部 318px、第一条回复 514px；复制提示、体验弹窗正常；旧文章平台与原始页面逐篇比对 67 篇一致。
- 候选和正式：主要页面 200，`/experience` 404，`/blog/qinggan-025` 308，`/api/web/health` 与旧版逐字一致。

## IndexNow

24 篇可收录文章，返回 200。

## 回滚

`r2i84a.chat` 别名指回 `dpl_9n4YmLX7tHFwrAYowWY2GjQgXijB`。
