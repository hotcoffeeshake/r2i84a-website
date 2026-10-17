import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "index.html");
let html = fs.readFileSync(file, "utf8");

const start = html.indexOf("nR=[");
const end = html.indexOf("];function nP", start);
if (start < 0 || end < 0) throw new Error("Homepage FAQ data was not found");

let faqData = html.slice(start, end + 1);
faqData = faqData.replace(
  'question:"AI 情感导师靠谱吗？"',
  'question:"AI 帮我回消息靠谱吗？"',
);

const additions = [
  {
    question: "会不会教我 PUA 或套路？",
    answer: "不会。它不提供操控、欺骗或骚扰的方法。当对方明确拒绝、拉黑或表达不想被打扰时，建议是停止推进并尊重边界。",
  },
  {
    question: "在哪里使用？",
    answer: "产品运行在微信小程序里。微信搜索「练爱导师」，或在电脑上用微信扫描本页的小程序码即可进入。",
  },
];

for (const item of additions) {
  if (faqData.includes(`question:${JSON.stringify(item.question)}`)) continue;
  faqData = faqData.slice(0, -1) + `,{question:${JSON.stringify(item.question)},answer:${JSON.stringify(item.answer)}}]`;
}

html = html.slice(0, start) + faqData + html.slice(end + 1);
html = html.replace(
  "产品能力、六个常见关系问题，以及童锦程 Skill 的非官方说明。",
  "产品能力、常见关系问题，以及童锦程 Skill 的非官方说明。",
);

fs.writeFileSync(file, html);
console.log("Homepage FAQ merged into the existing accordion.");
