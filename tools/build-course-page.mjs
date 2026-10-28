// 生成课程页 course.html：整页深色（设计规范「品牌面」），助理微信二维码直接放在标题区和页尾。
// 用法：node tools/build-course-page.mjs（之后再跑 node tools/apply-seo.mjs）
// <head> 保留原页面的标题、描述、结构化数据，只换样式表；<body> 重新生成。不写价格。
import fs from "node:fs";
import path from "node:path";
import { STYLE_VERSION, escapeHtml, siteHeader, siteFooter, qrFigure, BILIBILI_URL, CONSULT_QR } from "./article-shell.mjs";

const ROOT = process.cwd();
const FILE = path.join(ROOT, "course.html");

const CAMP = [
  ["前瞻课", "每个人做自我介绍，说出自己卡在哪，课程按大家的卡点来讲。"],
  ["认识异性的渠道", "线上线下都有哪些渠道，哪些适合你。"],
  ["用 AI 做展示面", "头像、朋友圈、资料怎么整理，让对方愿意多了解你。"],
  ["线上怎么精准聊天", "开场、接话、判断她的状态、什么时候推进。"],
  ["线上怎么语音打电话", "什么时候提出打电话，打电话聊什么。"],
  ["线下约会流程", "约在哪、怎么安排、见面怎么聊。"],
  ["实战纪实课", "拿真实案例从头到尾拆一遍。"],
  ["结课答疑", "收尾答疑，介绍后续的系列课。"],
];
const COACHING = [
  ["4 节真实语音案例课", "每节 60 分钟左右，用小腾哥本人的真实语音案例讲。"],
  ["4 次 1V1 电话指导", "每次 30 分钟，时间灵活预约。"],
  ["30 天微信答疑", "文字、语音都可以问，不限次数。"],
  ["关键聊天实时辅助", "重要节点可以预约，同步指导你怎么回。"],
];
const FAQS = [
  ["课程多少钱？", "不同期次和名额不一样，扫码加助理微信咨询。"],
  ["我适合报哪一门？", "想系统学一遍，选研学营；已经有具体在聊的人、想有人带着走完全程，选 30 天实战陪跑。拿不准可以先和助理语音聊几分钟。"],
  ["和小程序会员是什么关系？", "小程序是 AI 帮你复盘聊天截图、给回复建议；课程是小腾哥本人带，讲方法、给反馈。两者可以一起用，也可以只用其中一个。"],
];

const consultQr = () => qrFigure({ src: CONSULT_QR, alt: "小腾哥助理微信二维码", caption: "加助理微信咨询<br>手机长按识别" });

function body() {
  return `<body class="page-dark">
${siteHeader({ progress: false })}

    <section class="hero course-hero">
      <div class="hero-in course-hero-in">
        <div class="course-hero-text">
          <div class="crumbs"><a href="/learn">学习提升</a><span>/</span><span>小腾哥的课程</span></div>
          <h1>小腾哥的课程</h1>
          <div class="verdict"><div class="label">真人带练</div><p>AI 帮你看一段聊天，小腾哥带你走完从认识到约会的全程。</p></div>
          <p class="course-lead">两门课都由小腾哥（许跃腾）本人带。适合有一点基础，但认识的人少、聊天和约会成功率一般的男生。</p>
          <div class="facts"><span><b>6 年</b>约会实战</span><span><b>50 万+</b>B 站粉丝</span><span><b>2 门课</b>研学营 · 30 天陪跑</span></div>
        </div>
        ${consultQr()}
      </div>
    </section>

    <div class="layout course-layout">
      <main>
      <article class="course">
        <h2 id="camp"><span class="num">01</span>亲密关系研学营（第 6 期）</h2>
        <p>一共 8 节课，按「认识人 → 线上聊 → 线下见」的顺序讲，每一步都讲到能直接用。</p>
        <ol class="course-steps">
${CAMP.map(([t, d]) => `          <li><b>${escapeHtml(t)}</b><span>${escapeHtml(d)}</span></li>`).join("\n")}
        </ol>

        <h2 id="coaching"><span class="num">02</span>30 天实战陪跑</h2>
        <p>适合已经有在聊的人，想有人带着走完全程的男生。小腾哥 1V1 跟进，从展示面、聊天、邀约、约会到复盘。</p>
        <div class="course-cards">
${COACHING.map(([t, d]) => `          <div><b>${escapeHtml(t)}</b><span>${escapeHtml(d)}</span></div>`).join("\n")}
        </div>

        <h2 id="faq"><span class="num">03</span>常见问题</h2>
        <div class="faq">
${FAQS.map(([q, a]) => `          <details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join("\n")}
        </div>
      </article>

      <section class="author dark-card course-consult" data-cta="consult">
        <div class="author-text">
          <span class="cta-kicker">真人带练 · 立即咨询</span>
          <h3 class="course-consult-title">加助理微信，先聊几分钟</h3>
          <p>先简单语音聊几分钟，看看适不适合你、适合哪一门。</p>
          <a class="course-link" href="${BILIBILI_URL}" target="_blank" rel="noopener">先看看小腾哥：B 站主页 →</a>
        </div>
        ${consultQr()}
      </section>
      </main>
    </div>
${siteFooter()}
  </body>`;
}

const html = fs.readFileSync(FILE, "utf8");
const headEnd = html.indexOf("<body");
if (headEnd < 0) throw new Error("course.html: 找不到 <body>");
const head = html
  .slice(0, headEnd)
  .replace(/\s*<link rel="stylesheet" href="[^"]*(?:styles\.css|tokens\.css|article\.css)[^"]*" \/>/g, "")
  .replace(/\s*<style>[\s\S]*?\.course-[\s\S]*?<\/style>/g, "")
  .replace(/\s*<script src="\/assets\/[a-z-]+\.js[^"]*" defer><\/script>/g, "")
  .replace(
    /\s*<\/head>\s*$/,
    `\n    <link rel="stylesheet" href="./assets/tokens.css?v=${STYLE_VERSION}" />\n    <link rel="stylesheet" href="./assets/article.css?v=${STYLE_VERSION}" />\n  </head>`,
  );
fs.writeFileSync(FILE, `${head}\n  ${body()}\n</html>\n`);
console.log("generated course.html");
