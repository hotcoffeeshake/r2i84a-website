// 给所有页面的 <head> 加上统计脚本 /assets/analytics.js。可重复运行（幂等）。
// apply-seo.mjs 末尾会调用；也可以单独运行：node tools/inject-analytics.mjs
import fs from "node:fs";
import path from "node:path";

const TAG = '<script src="/assets/analytics.js?v=20261027" defer></script>';
const SKIP = new Set(["node_modules", ".git", ".vercel", ".npm-cache", ".scratch", "materials", "test-results", "exports", "release-records", "docs"]);

export function injectAnalytics(root = process.cwd()) {
  let changed = 0;
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { visit(file); continue; }
      if (!entry.name.endsWith(".html")) continue;
      const html = fs.readFileSync(file, "utf8");
      if (html.includes("/assets/analytics.js") || !html.includes("</head>")) continue;
      fs.writeFileSync(file, html.replace("</head>", `${TAG}</head>`));
      changed += 1;
    }
  };
  visit(root);
  return changed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`analytics tag added to ${injectAnalytics()} pages`);
}
