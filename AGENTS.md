# AGENTS.md

本目录是 **r2i84a-main**（r2i84a.chat 主站 / 视觉 / 后室）的工作区。网站源文件已迁入仓库根目录；2026-10-17 的交接更新位于 `codex/website-handoff-20261017`。

## 目录权限（三级）

### ✅ 默认允许修改
- 根目录 HTML/CSS/JS、`assets/`、`answers/`、`blog/`、`tools/` — 页面、资源和生成脚本
- `artifacts/` — 最终交付物（报告、导出图片），纳入 git
- `README.md` / `AGENTS.md` / `.gitignore` 本身
- 新增的业务内容文件（html / css / js / 图片资源）

### ⚠️ 修改前必须说明并获得确认
- `vercel.json`、`.vercelignore`、`.npmrc`、`.well-known/` 等**部署配置** — 改动会影响线上站点，须先告知
- `.env.example` — 环境变量模板，改动意味着部署环境变化
- 跨项目共享资源（如 `../../shared/` 下的内容）— 改动会波及其他项目
- 对现有页面的**结构性重命名 / 移动**（如 `index.html` → 其他）— 会破坏链接与部署
- 删除任何看似「无用」的文件（如 `frames/`、`temple-config.json`）— 可能仍有隐藏引用，先确认

### 🚫 严禁修改
- `node_modules/`、`.npm-cache/` — 依赖与缓存，由包管理器管理
- `.vercel/` — Vercel 构建产物，可再生
- `.scratch/` — AI 临时输出，不纳入版本控制
- `.env` / `.env.local` — 含密钥，绝不可提交或改动后提交；如必须改动，仅改 `.env.example`
- 第三方 / 归档目录（如 `../../archive/`、`../../quarantine/`）— 不属于本项目
- 不属于本项目的源文件（位于 `个人网站/` 原目录或其他 project 目录）

## 工作纪律

- **临时文件统一放入 `.scratch/`**（分析草稿、测试脚本、中间输出）。`.scratch/` 已被 `.gitignore` 忽略，不会污染版本库。
- **禁止创建平行副本绕过原文件**：不允许新建 `xxx_new`、`xxx_final`、`xxx_v2`、`xxx副本`、`xxx_bak` 等文件来替代修改原文件。需要迭代时直接改原文件，或用 git 历史回溯。
- **任务结束必须报告**：
  1. 新增、修改、删除的文件清单（路径 + 动作）
  2. 是否修改了**依赖**（package.json / lockfile / node_modules）
  3. 是否修改了**共享目录**（`shared/` 或其他项目的文件）
  4. 是否修改了**环境配置**（`.env*`）或**部署配置**（`vercel.json` 等）
  5. 执行了哪些**测试**，以及哪些**未执行**、原因

## 测试与运行（当前状态）

- SEO 回归测试：`node tools/test-seo.mjs`（在临时副本运行，无新依赖）；首页布局和 FAQ 仍需浏览器检查。
- 项目为静态站点，可用 `python3 -m http.server 4173` 预览；静态预览不提供登录或支付后端。
- 部署通过 Vercel；生产发布需明确授权，并先核实 API 后端与部署配置。仓库缺少 `/api/web` 服务端实现。

## 合规红线

- 本目录包含情感关系类页面；涉及人物内容时，避免冒充、盗用肖像或暗示官方授权。
