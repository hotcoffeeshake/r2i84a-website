# SEO 标题、统计、课程页上线

日期：2026-10-27。用户明确授权生产发布。

## 源码与范围

- main `89ba764`，合并了 PR #4（9 篇改标题和网址、7 篇 noindex、quiz-leadgen 并入 main）、#5（百度统计 + 转化事件、CSP 放行 hm.baidu.com / hmcdn.baidu.com）、#6（/course 课程页、课程入口卡片）。
- 未修改依赖、环境变量、数据库、函数代码。

## 构建与部署

采用 Vercel Build Output API（预构建），不运行 `next build`，做法同 20261027-indexnow.md：

- 从当前生产版本 `dpl_HKabRAMn9ZQJ1zUS7G7oBxynNmbX` 读取 `src/.vercel/output` 清单，函数等 11,708 个非静态文件按原 SHA、mode 原样保留。
- 静态文件按 main 重新整理为 535 个：新增 12 个（9 篇新网址文章、course.html、assets/analytics.js、assets/assistant-wechat.png），移除 9 个改名前的 `blog/qinggan-0xx` 目录，其余按 main 内容更新（共上传 113 个变化文件）。
- `config.json`：保留原路由结构，只把文章 308 跳转换成 vercel.json 当前的 25 条、安全响应头换成 vercel.json 当前值（CSP 新增百度统计域名），overrides 按现有 108 个 HTML 重新生成。
- 新版本：`dpl_CGP4S53Vw2CFJ71u9XqVxDC1GWvR`，`love-train-v12-a1j3gicoc-flyxqc1s-projects.vercel.app`。先以 `autoAssignCustomDomains=false` 创建，候选验证通过后把 `r2i84a.chat` 切到新版本。

## 验证

候选和正式域名均检查：

- `/`、`/course`、`/quiz`、`/wechat-login`、`/answers/she-replies-oh`、`/blog/show-yourself-to-her`、IndexNow key、`/assets/analytics.js`、`/assets/assistant-wechat.png`：HTTP 200。
- `/blog/qinggan-025` → 308 → `/blog/show-yourself-to-her`；`/blog/qinggan-035` 含 `noindex, follow`。
- 响应头 CSP 含 `hm.baidu.com`；首页 `<head>` 含 analytics.js；首页测验脚本仍在；问答页有课程入口。
- `/api/web/health` 返回与旧版本逐字一致（guestReady=true）；`/api/auth/wechat/me` 未登录 401，与旧版本一致。
- 未做真实付款、微信配对测试（函数字节未改）。

## IndexNow

```text
node tools/indexnow-submit.mjs /course + 9 篇新网址 + 9 个旧网址 + 7 篇 noindex
共 26 个网址
IndexNow 返回 200
```

## 待办

- `assets/analytics.js` 的 `BAIDU_ID` 为空，统计暂不发送数据；拿到百度统计站点 ID 后填入并重新发布。

## 回滚

将 `r2i84a.chat` 别名重新指向 `love-train-v12-k1hvpqciq-flyxqc1s-projects.vercel.app`（`dpl_HKabRAMn9ZQJ1zUS7G7oBxynNmbX`）。
