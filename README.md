# r2i84a-main — 鹿子野 AI Studio 主站（r2i84a.chat 完整可部署根）

## 项目是什么

`r2i84a.chat` 的**完整静态站点部署根**（Vercel 以本目录为根直接部署，纯静态、无需 build）：

- 首页与导航：`index.html`、`home.html`、`learn.html`、`account.html`
- 后室视觉：`temple*.html/css/js` + `frames-webp/`（帧序列）+ `audio/`
- 体验页：`experience*.html/css`
- AI 情感/关系教练：`ai-relationship-coach.html`、`love-advisor.html`、`eq.html`、`tong-jincheng-skill.html`
- 内容子站：`blog/`（情感博客）、`answers/`（情感问答）、`tools/`
- 全局样式与脚本：`styles.css`、`experience.css`、`temple.css`、`script.js`、`temple-scroll.js`
- 共享图片桶：`assets/`（博客配图、首页 hero、社交二维码、平台 svg）
- 部署配置与 SEO：`vercel.json`、`sitemap.xml`、`sitemap.txt`、`robots.txt`、`llms.txt`

> 说明：`love-advisor` / `ai-relationship-coach` / `eq` / `tong-jincheng-skill` 为**中间迭代版本**，但当前线上仍需保留内容（非死链）。原 `r2i84a-ai` 项目的内容已合并进本目录，旧项目归档于 `AI-Workspace/quarantine/r2i84a-ai-middle-iteration-backup/`。

## 当前状态

- **可部署**：本目录已是扁平单根，`vercel.json` 与 `index.html`、`assets/` 同级，可直接由 Vercel 部署。站点使用根相对路径（`/assets/...`、`/blog/...`），与目录深度无关。
- `git init` 已完成（分支 `main`），但**尚未提交**。
- 源文件已从 `个人网站/` 复制并入本目录（含原 `r2i84a-ai` 的内容），`个人网站/` 原文件仍保留作为源备份、未删除。

## 已核实的命令

> 命令均从 `个人网站/` 现有配置文件核实（这些文件待迁入本目录）。**未实际执行任何命令**，仅静态读取配置；下表「执行验证」列标明。

| 类别 | 命令 | 来源 | 执行验证 | 说明 |
|---|---|---|---|---|
| 安装 | `npm install` | `package.json` | 否（仅读配置） | `package.json` 无 `dependencies` / `devDependencies`，无依赖可装；实际为空操作 |
| 安装 | `npm ci` | `package-lock.json` 存在 | 否 | 有 lockfile 但无依赖，执行结果为空 node_modules |
| 开发 | 当前未配置 | — | — | 无 `dev` script、无框架；站点为静态文件，无需 dev server；`npx serve .` 为通用静态服务，非项目声明命令 |
| 测试 | 当前未配置 | — | — | 本目录无测试配置；`test-results/`（Playwright 产物）与 `site-visual-upgrade-comparison/scripts/*.spec.js` 均不属本项目 |
| 构建 | `npm run vercel-build` → `next build` | `package.json` scripts | 否 | **命令与项目结构不匹配**：无 `next.config.*`、无 `app/` `pages/`、无 `next` 依赖。`next build` 实际无法成功；站点为纯静态 HTML，真实部署无构建步骤 |
| 部署 | `vercel deploy` / `vercel --prod` | `vercel.json`（存在）、`.vercelignore`、`.npmrc` | 否（配置未迁移） | Vercel 静态托管；`vercel.json` 仅声明 cleanUrls / 安全头，**无 buildCommand / outputDirectory** |

### 诚实结论（已更正）

- **线上站点 `r2i84a.chat` 正常运行**（Vercel 静态托管，可访问）——此前「项目不可独立运行」的判断是**错误的**，已更正：静态站点无需构建，`next build` 不参与实际上线。
- **本目录（AI-Workspace 骨架）目前无法单独部署**，仅因为源文件与部署配置尚未迁入；这不代表站点本身有问题。
- 真实形态是**静态文件站点**：无需构建步骤，Vercel 直接托管 HTML/CSS/JS；`vercel.json` 未声明 buildCommand，因此 `next build` 不会被用于上线。
- 本地预览可用任意静态服务器，例如 `npx serve .`（非 package.json 声明命令，仅建议）。
- `package.json` 的 `vercel-build: next build` 与静态结构不匹配（无 `next` 依赖 / 无 `next.config`），属历史遗留配置，迁入后建议核实并移除，避免误导后续维护者以为需要 Next.js 构建。

## 真实的当前目录地图

```
AI-Workspace/projects/r2i84a-main/
├── README.md          ← 本文件
├── AGENTS.md
├── .gitignore
├── .git/              ← git init，分支 main，尚未 commit
├── src/               ← .gitkeep，待迁入 html/css/js
├── artifacts/         ← .gitkeep，待放最终交付物（纳入 git）
└── .scratch/          ← .gitkeep，AI 临时输出（被 .gitignore 忽略）
```

## 尚未迁入 / 尚未确认

**待迁入来源（位于 `个人网站/` 根目录）**
- 页面：`index.html` `home.html` `learn.html` `temple*.html` `experience*.html`
- 样式/脚本：`styles.css` `script.js` `temple.css` `temple-scroll.js` `experience.css`
- 资源：`frames-webp/` `audio/` `oracle.png` `翼天使.png` `93afa334-*.png`
- 部署配置：`package.json` `package-lock.json` `vercel.json` `.vercelignore` `.npmrc` `.well-known/`

**尚未确认**
- `r2i84a-main` 与 `r2i84a-ai` 共用一次 Vercel 部署；物理拆分后部署配置如何分配（是否各子域独立）尚未确认。
- `temple-config.json` 引用 `frames/scene1-hero/` 目录（不存在），拆分后是否仍需要待确认。
- `frames/`（300 张 jpg，约 56M）已无任何代码引用，是否随迁待确认。
- `.env.local` 含密钥，迁入时应移出桌面目录并仅保留 `.env.example`。

---

## 命令核验表（应要求附）

| 写入的命令 | 命令来源 | 是否实际执行验证 | 尚未确认的问题 |
|---|---|---|---|
| `npm install` | `package.json`（无 deps） | 否，仅读取配置 | 无依赖，执行即空操作 |
| `npm ci` | `package-lock.json` 存在 | 否 | 与无依赖一致，结果空 |
| `npx serve .`（开发） | 非项目声明，仅建议 | 否 | 是否作为标准 dev 命令待定 |
| （测试） | 无 | 否 | 本项目无测试配置 |
| `npm run vercel-build` → `next build` | `package.json` scripts | 否 | 与静态结构矛盾，**不用于实际上线**（线上为 Vercel 静态托管）；待核实/移除 |
| `vercel deploy` / `vercel --prod` | `vercel.json` / `.vercelignore` / `.npmrc` | 否（配置未迁移） | 配置迁入本目录根后方可验证 |
