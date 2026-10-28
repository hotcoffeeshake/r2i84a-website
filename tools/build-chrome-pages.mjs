// 测验页、速查页、登录页：只换成全站统一的页头页脚（设计规范第 6 节），页面自己的样式和功能不动。
// 用法：node tools/build-chrome-pages.mjs（之后再跑 node tools/apply-seo.mjs）。可重复运行：生成的页头页脚包在标记注释里。
import fs from "node:fs";
import path from "node:path";
import { STYLE_VERSION, siteHeader, siteFooter } from "./article-shell.mjs";

const ROOT = process.cwd();
const PAGES = [
  { file: "quiz.html", header: /<header class="top">[\s\S]*?<\/header>/, footer: /<footer>[\s\S]*?<\/footer>/ },
  { file: "quiz-guide.html", header: null, footer: /<footer>[\s\S]*?<\/footer>/ },
  { file: "wechat-login.html", header: null, footer: null },
];
const wrap = (name, html) => `<!-- chrome:${name} -->\n${html}\n<!-- /chrome:${name} -->`;
const marked = (name) => new RegExp(`<!-- chrome:${name} -->[\\s\\S]*?<!-- /chrome:${name} -->`);
const LINKS = `<link rel="stylesheet" href="/assets/tokens.css?v=${STYLE_VERSION}" />\n<link rel="stylesheet" href="/assets/site-chrome.css?v=${STYLE_VERSION}" />`;

for (const page of PAGES) {
  const file = path.join(ROOT, page.file);
  let html = fs.readFileSync(file, "utf8");
  // 样式表放在页面自己的 <style> / 样式表之前，页面自己的变量优先
  html = html.replace(/<!-- chrome:links -->[\s\S]*?<!-- \/chrome:links -->\n?/, "");
  const firstStyle = html.search(/<style|<link rel="stylesheet"/);
  const anchor = firstStyle >= 0 ? firstStyle : html.indexOf("</head>");
  html = html.slice(0, anchor) + wrap("links", LINKS) + "\n" + html.slice(anchor);

  const header = wrap("header", siteHeader({ progress: false }));
  if (marked("header").test(html)) html = html.replace(marked("header"), header);
  else if (page.header && page.header.test(html)) html = html.replace(page.header, header);
  else html = html.replace(/<body([^>]*)>/, `<body$1>\n${header}`);

  if (page.footer || marked("footer").test(html)) {
    const footer = wrap("footer", siteFooter());
    if (marked("footer").test(html)) html = html.replace(marked("footer"), footer);
    else html = html.replace(page.footer, footer);
  }
  fs.writeFileSync(file, html);
  console.log(`chrome ${page.file}`);
}
