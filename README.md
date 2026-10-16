# r2i84a.chat 官网前端

这是 r2i84a.chat 的静态 HTML、CSS、JavaScript 网站源码。

## 本次交接

2026-10-17 将维护者本机 `/Users/qichenxie/Desktop/个人网站` 中的网站页面和资源同步至 `codex/website-handoff-20261017` 分支。此同步不是线上部署，也不证明每个文件与生产版本完全一致。请基于该分支开始工作；旧 main 分支停留于 2026-08-04。

## 获取与预览

```sh
git clone --branch codex/website-handoff-20261017 https://github.com/hotcoffeeshake/r2i84a-website.git
cd r2i84a-website
python3 -m http.server 4173
```

浏览器访问 http://127.0.0.1:4173/index.html 。Python 静态服务器不实现 Vercel 的 cleanUrls 和 API 转发，本地访问其他页面时使用 `.html` 后缀。

项目没有前端框架依赖；`package.json` 的 `vercel-build: next build` 是历史遗留配置，不能作为有效构建命令。

## 代码入口

- `index.html`：首页；`styles.css`、`script.js`：全局样式和交互。
- `assets/`：图片、二维码、`web-commerce.js` 登录与购买前端。
- `human-answer.html/css/js`：真人答复页面。
- `account.html`、`learn.html`、`experience.html`：账号、学习和体验页面。
- `answers/`、`blog/`、`tools/`：内容页面及生成脚本。
- `vercel.json`：路由和响应头；`sitemap.xml`、`robots.txt`、`llms.txt`：站点索引。

## 后端与发布边界

`assets/web-commerce.js` 调用 `/api/web/*`。本仓库目前没有 `api/web` 服务端实现；`vercel.json` 的 rewrite 本身不能提供后端。静态预览只能检查前端，不能验收登录、订单或支付。

关联小程序仓库：https://github.com/hotcoffeeshake/love-train-mp 。需要修改业务功能时，应另行确认最新后端源码与接口部署，不能假设这个仓库的 main 已包含所需实现。

本机 Vercel 绑定记录的项目名为 `love-train-v12`。生产配置与当前部署来源尚未完整核验；不要将此交接分支直接覆盖生产。

本次没有提交 `.env*`、部署凭证、本地 `.vercel` 目录、研究资料或临时产物。GitHub 写入权限不等于 Vercel 部署权限。

## 协作

公开仓库可直接读取、克隆及 Fork。直接推送需要维护者为准确的 GitHub 用户名授予 Write 权限，对方接受邀请后生效。建议从交接分支创建工作分支并提交 PR。不要提交密钥或生产数据。

## SEO 维护

SEO 相关配置和脚本都在 `tools/`：

- `tools/seo-config.mjs`：品牌名 `SITE_BRAND`、小程序名 `MINIPROGRAM_NAME`、不收录的文章名单、文章新标题/URL 映射。品牌或小程序改名后重新生成，并检查首页等手工维护内容。
- `tools/answer-pages-data.mjs`：问答页内容，新增问答页就在这里加一项。
- `tools/build-answer-pages.mjs`：把问答数据渲染成 `answers/<slug>.html`。
- `tools/apply-seo.mjs`：处理文章页（字符修复、删除内部信息、标题/描述/URL、noindex、CTA）、更新列表页，并重新生成 `sitemap.xml`、`sitemap.txt`、`llms.txt`、`llms-full.txt` 和 `vercel.json` 里的文章永久跳转（Vercel 的 `permanent: true` 使用 308）。可重复运行。

改完配置或内容后，在仓库根目录运行：

```sh
node tools/build-answer-pages.mjs && node tools/apply-seo.mjs
```

注意：`tools/generate-blog.mjs` 和 `tools/generate-qa-pages.mjs` 是旧生成器，读取的是维护者本机路径，而且模板已经落后于线上页面（例如导航仍是「个人中心」）。不要直接运行它们覆盖现有页面；如果重新生成后同一文章同时存在原始目录与改名目录，SEO 脚本会停止并报错；先核对内容并统一到唯一目录，再运行 SEO 脚本，避免静默覆盖较新的正文。


### 首页内容与维护边界

首页产品说明、问答入口和 FAQ 位于 `#home-guide`，与 React 的 `#root` 分开，JavaScript 加载后仍然可见。修改首页 FAQ 时同步修改 JSON-LD，保证问题和答案与可见正文一致。本次修订移除了 SEO 改动新增的隐私承诺，不新增相关声明。

代码同步与本地验证不等于线上发布。生产发布前仍需在 Vercel Preview 核验文章旧网址到新网址的永久跳转；登录和支付需要已配置的后端才能验收。


### 文章列表与网址迁移

文章库和学习页列表从文章数据重新生成。移出 `NOINDEX_POSTS` 或补足薄内容后，符合收录条件的文章会重新进入列表；`PRIORITY_POST_IDS` 保留优先阅读的人工选择和顺序。

`vercel.json` 的文章重定向同时保存历史网址关系。修改已有文章的 `POST_OVERRIDES.slug` 时保留历史记录，脚本会定位原目录、检查冲突，再将历次旧网址直接指向最终网址。不要手工清空这些历史重定向。发现多个候选目录或网址冲突时，先核对来源再继续，不要直接删除其中一份。


### 回归检查

运行 `node tools/test-seo.mjs`。测试只在临时副本内执行，覆盖默认生成幂等、恢复收录与优先阅读、正文增厚、连续两次改名、历史相关链接、网址冲突和重复目录。无需安装新依赖。
