# 2026-10-17 SEO 首页与问答页生产发布

## 发布结果

- 生产域名：<https://r2i84a.chat>
- 源码提交：`deb98cb97d1c1d96e5d2b9fe17dbcf1b59e26024`
- Vercel 部署：`dpl_Yfq6Zov3THG3b5tV5LAgnRgdmEp7`
- 部署地址：<https://love-train-v12-hazczm60r-flyxqc1s-projects.vercel.app>
- 发布时间：2026-10-17（Asia/Shanghai）

## 发布内容

- 合并 PR #1 与 PR #2 的网站源码和 SEO 修改。
- 首页使用新的 title 与唯一 H1。
- 新增 15 个恋爱问答页，并为旧文章地址配置永久跳转。
- 将 PR 中裸露的 SEO 静态正文改为与网站一致的黑金卡片布局。
- 修复 390px 手机宽度下首屏品牌标题裁切。
- 保留原生产部署的私有 `api/web` Node Function，公开静态目录不含密钥文件。

## 验证

- `node tools/test-seo.mjs`：通过。
- `git diff --check`：通过。
- Build Output API：708 个静态文件，`api/web` 函数共 11,671 个文件，Vercel 识别为 Node.js 22 函数。
- `GET /`：200；title 和 H1 与源码一致；全页仅一个 H1。
- `GET /answers/she-replies-oh`：200。
- `GET /api/web/auth/me`：401，响应 `GUEST_SESSION_EXPIRED`，证明购买后端路由正常工作。
- `GET /blog/qinggan-031`：308，跳转至 `/blog/she-replies-en`。
- 桌面 1440px 与手机 390px 浏览器实测：卡片布局生效，无页面脚本错误；手机为单列布局，首屏品牌标题未溢出。
- HSTS、CSP、X-Content-Type-Options、X-Frame-Options 与 Referrer-Policy 均存在。

## 发布过程与回滚

首次静态发布 `dpl_248DzZ4vQM3KimjV2QfAz6D1ofBd` 未包含 `api/web`，检查发现接口返回 404 后立即回滚至 `dpl_2MeGyct4rRJstuGpe63eRZcben7b`。随后从该稳定部署恢复私有函数并重新发布。包含后端且已验证的上一版本为 `dpl_2dUJZtdtu8u9F8zYyJM86vfdpRRT`。

如需回滚当前发布，可执行：

```sh
vercel alias set love-train-v12-fm91a18oq-flyxqc1s-projects.vercel.app r2i84a.chat
```

回滚后必须再次确认 `/api/web/auth/me` 返回 401，而不是 404。

## FAQ 合并补充发布

- 源码提交：`d8f375b`
- Vercel 部署：`dpl_8W8x3uxoWQFYXkJN7Gp48opeCg2z`
- 将首页两个 FAQ 区块合并为原有的双列折叠区。
- 5 个重复问题合并，补入“会不会教我 PUA 或套路？”和“在哪里使用？”两个独有问题，最终共 16 项。
- 删除下方重复的静态 FAQ 卡片；保留首页 FAQPage 结构化数据。
- 桌面和 390px 手机浏览器均验证 16 项可展开，“展开全部”可一次打开全部项目，无页面脚本错误。
- `/api/web/auth/me` 继续返回 401 `GUEST_SESSION_EXPIRED`。
