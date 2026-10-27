// 给所有页面的 <head> 加上统计脚本 /assets/analytics.js。可重复运行（幂等）。
// apply-seo.mjs 末尾会调用；也可以单独运行：node tools/inject-analytics.mjs
import fs from "node:fs";
import path from "node:path";

const TAG = '<script src="/assets/analytics.js?v=20261028" defer></script>';
const OLD_TAG = /<script src="\/assets\/analytics\.js\?v=[^"]*" defer><\/script>/;
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
      if (html.includes(TAG) || !html.includes("</head>")) continue;
      // 改了 TAG 的版本号时，替换旧标签（.js 缓存一年，只能靠版本号让浏览器拿新文件）
      fs.writeFileSync(file, OLD_TAG.test(html) ? html.replace(OLD_TAG, TAG) : html.replace("</head>", `${TAG}</head>`));
      changed += 1;
    }
  };
  visit(root);
  return changed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`analytics tag added to ${injectAnalytics()} pages`);
}
