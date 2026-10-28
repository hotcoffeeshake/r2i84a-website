// 给所有页面的 <head> 加上全站脚本：统计 /assets/analytics.js、体验/咨询二维码 /assets/mp-qr.js。
// 文章页、问答页再加 /assets/article.js（复制提示、阅读进度、手机底部行动条）。可重复运行（幂等）。
// apply-seo.mjs 末尾会调用；也可以单独运行：node tools/inject-analytics.mjs
import fs from "node:fs";
import path from "node:path";

// 改了脚本内容就改版本号：.js 缓存一年，只能靠版本号让浏览器拿新文件
const V = "20261030";
const TAGS = [
  { tag: `<script src="/assets/analytics.js?v=${V}" defer></script>`, old: /<script src="\/assets\/analytics\.js\?v=[^"]*" defer><\/script>/ },
  { tag: `<script src="/assets/mp-qr.js?v=${V}" defer></script>`, old: /<script src="\/assets\/mp-qr\.js\?v=[^"]*" defer><\/script>/ },
];
const ARTICLE_TAG = `<script src="/assets/article.js?v=${V}" defer></script>`;
const ARTICLE_RE = /<script src="\/assets\/article\.js\?v=[^"]*" defer><\/script>/;
// 文章页 blog/<slug>/index.html、问答页 answers/<slug>.html、专题页（有可复制模板）
const NEEDS_ARTICLE_JS = /^(?:blog\/.+\/index\.html|answers\/(?!index\.html)[^/]+\.html|eq\.html|love-advisor\.html|ai-relationship-coach\.html|tong-jincheng-skill\.html)$/;
const SKIP = new Set(["node_modules", ".git", ".vercel", ".npm-cache", ".scratch", "materials", "test-results", "exports", "release-records", "docs"]);

export function injectAnalytics(root = process.cwd()) {
  let changed = 0;
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { visit(file); continue; }
      if (!entry.name.endsWith(".html")) continue;
      const before = fs.readFileSync(file, "utf8");
      if (!before.includes("</head>")) continue;
      let html = before;
      for (const { tag, old } of TAGS) {
        if (html.includes(tag)) continue;
        html = old.test(html) ? html.replace(old, tag) : html.replace("</head>", `${tag}</head>`);
      }
      html = html.replace(ARTICLE_RE, "");
      const rel = path.relative(root, file).split(path.sep).join("/");
      if (NEEDS_ARTICLE_JS.test(rel)) html = html.replace("</head>", `${ARTICLE_TAG}</head>`);
      if (html === before) continue;
      fs.writeFileSync(file, html);
      changed += 1;
    }
  };
  visit(root);
  return changed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`analytics tag added to ${injectAnalytics()} pages`);
}
