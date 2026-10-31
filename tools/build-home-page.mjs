// 生成首页 index.html（设计稿：网站SEO_GEO/首页设计稿.html）。不再用 React 打包文件。
// 用法：node tools/build-home-page.mjs（之后再跑 node tools/apply-seo.mjs，会加上测验弹窗、统计、小程序码弹窗脚本）
// <head> 保留原首页的标题、描述、canonical、结构化数据；去掉 React 的内联数据和样式。<body> 按设计稿重新生成。可重复运行。
// 购买流程沿用 assets/web-commerce.js：它把套餐卡片渲染进 #r2payGrid，付款弹窗用 #r2payMask / #r2payBody / #r2payToast。
import fs from "node:fs";
import path from "node:path";
import { STYLE_VERSION, escapeHtml, siteHeader, siteFooter } from "./article-shell.mjs";

const ROOT = process.cwd();
const FILE = path.join(ROOT, "index.html");
const COMMERCE_VERSION = "20261031";

// 首屏视频：原标题一字不改；播放量为 2026-10-30 的 B 站数据，更新时改这里
const VIDEOS = [
  {
    url: "https://www.bilibili.com/video/BV1RRxPzHEN7",
    title: "B站超强搭讪区UP主，上街实操展示搭讪技巧，弹无虚发，硕果累累",
    plays: "172 万",
    duration: "34:43",
    by: "摩的司机徐师傅",
    tag: "其他 UP 主实拍",
    cover: "/assets/home-video-BV1RRxPzHEN7.jpg",
  },
  {
    url: "https://www.bilibili.com/video/BV1u8411y77P",
    title: "炸裂！之前在地铁上搭讪的阿姨，我把她女儿约出来了..【必拿下16】",
    plays: "147 万",
    duration: "8:24",
    by: "许跃腾腾",
    cover: "/assets/home-video-BV1u8411y77P.jpg",
  },
  {
    url: "https://www.bilibili.com/video/BV1JtJn6VEfd",
    title: "23岁压抑理工男因被骗2个月感情，带他搭讪173御姐约会！",
    plays: "19.8 万",
    duration: "10:08",
    by: "许跃腾腾 · 带学员实战",
    cover: "/assets/home-video-BV1JtJn6VEfd.jpg",
  },
];
const TOTAL_PLAYS = "330 万+"; // 172.4 + 147.6 + 19.8

// 常见问题：页面和结构化数据（FAQPage）共用，保证一致
const FAQS = [
  ["免费和会员有什么区别？", "免费每天 6 次；会员每天 30 次，并且可以用许跃腾 Skill，按小腾哥的思路判断和回复。"],
  ["付款后多久能用？", "微信支付后 2 小时内开通会员，开通后回到小程序就能用。"],
  ["我的聊天截图会被保存吗？", "截图只用于本次分析。"],
  ["和童锦程 Skill 是什么关系？", "童锦程 Skill 是我们开源的项目；小程序在它的基础上做了优化，手机上直接用，还能记住你们的聊天背景。本站不代表童锦程本人或官方。"],
];

const QUICK_ANSWERS = [
  ["girl-not-replying", "女生不回消息怎么办"],
  ["she-replies-oh", "女生回“哦”怎么回"],
  ["she-says-whatever", "女生说“随便”怎么回"],
  ["she-says-busy", "女生说在忙怎么回"],
  ["chat-cold", "男生聊天冷场怎么办"],
  ["ambiguous-relationship", "暧昧期怎么推进关系"],
  ["how-to-ask-her-out", "第一次约女生出来怎么说"],
  ["girlfriend-angry", "女朋友生气了怎么哄"],
];

function videoCard(v, i) {
  const cover = v.textCover
    ? `<div class="vcover text"><div class="big">${escapeHtml(v.plays)}<small>播放</small></div><div class="by">${escapeHtml(v.textCover)}</div></div>`
    : `<div class="vcover"><img src="${v.cover}" width="640" height="360" alt="${escapeHtml(v.title)} 视频封面"${i ? ' loading="lazy"' : ""}><span class="play"></span><span class="dur">${v.duration}</span></div>`;
  const meta = v.tag
    ? `<span class="tag">${escapeHtml(v.tag)}</span>${escapeHtml(v.plays)}播放 · ${escapeHtml(v.by)}`
    : `<span class="tag">${escapeHtml(v.plays)}播放</span>${escapeHtml(v.by)}`;
  return `          <a class="vcard" href="${v.url}" target="_blank" rel="noopener" data-video="${i + 1}">
            ${cover}
            <div class="vbody"><b>${escapeHtml(v.title)}</b><div class="vmeta">${meta}</div></div>
          </a>`;
}

function body() {
  return `<body class="home">
${siteHeader({ progress: false })}

    <section class="hero">
      <div class="in hero-grid">
        <div class="hero-text">
          <span class="kicker">6 年约会实战 · B 站 50 万+ 粉丝</span>
          <h1>看小腾哥怎么带人，<br>再让 AI 用<em>他的思路</em><br>看你的聊天。</h1>
          <p class="sub">把聊天截图发给 AI，先判断她现在是什么态度，再给你一句能直接发的回复。</p>
          <div class="hero-cta">
            <a class="btn btn-primary" href="#mp-qr" data-cta="hero">立即体验</a>
            <small>免费，每天 6 次 · 微信扫码就能用</small>
          </div>
          <div class="proof-row">
            <span><b>5K+</b>人在用</span>
            <span><b>50 万+</b>B 站粉丝</span>
            <span><b>3K</b>GitHub Stars（童锦程 Skill）</span>
          </div>
        </div>
        <div class="hero-wall">
          <div class="wall-head"><h3>先看他怎么带人</h3><a href="https://space.bilibili.com/77669328" target="_blank" rel="noopener">B 站主页 →</a></div>
          <div class="wall">
${VIDEOS.map(videoCard).join("\n")}
          </div>
        </div>
      </div>
    </section>

    <section class="sec">
      <div class="in">
        <span class="kicker light">你自己的聊天</span>
        <h2>她只回了一个「哦」，下一句怎么发？</h2>
        <p class="lead">把截图发给小程序，它会先告诉你她现在是什么态度，再给一句能直接发的。比如下面这段。</p>
        <div class="demo">
          <div class="phone">
            <div class="hd">你们的聊天</div>
            <div class="msg me"><span>我到家了，今天加班好累</span></div>
            <div class="msg her"><span>哦</span></div>
            <div class="msg me"><span>你怎么了？是不是不开心</span></div>
            <div class="msg her"><span>没有啊</span></div>
          </div>
          <div class="ai">
            <div class="step"><span class="n">1</span><div><b>先判断：问题出在你上一句</b><p>「我到家了」是在汇报，她不知道接什么。你再追问「你怎么了」，她就更不想聊了。</p></div></div>
            <div class="step"><span class="n">2</span><div><b>再调整：别追问，换一句她能接的</b><p>说一件具体的小事，她才有话回。</p></div></div>
            <div class="step"><span class="n">3</span><div><b>可以直接发：</b><div class="reply">刚加完班出来，楼下新开了家烤红薯，排了十几个人，我也去排了。</div></div></div>
            <div class="src">示例出自本站问答 <a href="/answers/she-replies-oh">女生回“哦”怎么回</a></div>
          </div>
        </div>
      </div>
    </section>

    <section class="sec" style="padding-top:0">
      <div class="in">
        <h2>三步用起来</h2>
        <div class="steps3">
          <div><span class="n">01</span><b>扫码打开小程序</b><p>微信扫码，或在微信搜「练爱导师」。</p></div>
          <div><span class="n">02</span><b>上传聊天截图</b><p>或者直接描述你们现在的情况。</p></div>
          <div><span class="n">03</span><b>拿到判断和回复</b><p>先看她的态度，再给能直接发的一句。</p></div>
        </div>
      </div>
    </section>

    <section class="sec sec-dark" id="pricing">
      <div class="in">
        <span class="kicker">免费每天 6 次 · 不够再升级</span>
        <h2>会员每天 30 次，<br>还能用小腾哥的思路复盘。</h2>
        <div class="price-grid">
          <div class="plans" id="r2payGrid"></div>
          <div class="free-qr">
            <b>先免费试</b>
            <p>每天 6 次，微信扫码就能用</p>
            <img src="/assets/mp-qrcode.jpg" width="150" height="150" alt="情商练习有事问AI 小程序码">
            <small>微信扫码 · 手机长按识别</small>
          </div>
        </div>
        <div class="assure">
          <span>微信支付</span>
          <span>付款后 2 小时内开通</span>
          <span>聊天截图只用于本次分析</span>
        </div>
      </div>
    </section>

    <section class="sec">
      <div class="in">
        <h2>用过的人怎么说</h2>
        <div class="proof">
          <div><b>5K+</b><span>人在用「情商练习有事问AI」</span></div>
          <div><b>50 万+</b><span>B 站粉丝，6 年约会实战</span></div>
          <div><b>${TOTAL_PLAYS}</b><span>首页 3 个视频的总播放</span></div>
          <div><b>3K</b><span>童锦程 Skill 的 GitHub Stars</span></div>
        </div>
        <figure class="feedback">
          <img src="/assets/home-feedback-1.jpg" width="674" height="900" alt="用户反馈：用小程序把一直约不出来的女生约了出来" loading="lazy">
          <figcaption>一位用户发来的反馈：之前一直约不出来的女生，用小程序聊了几轮约出来了。截图里的「10 次」是当时的免费次数，现在是每天 6 次。</figcaption>
        </figure>
      </div>
    </section>

    <section class="sec" style="padding-top:0">
      <div class="in">
        <div class="course" data-cta="consult">
          <div>
            <span class="kicker">真人带练 · 立即咨询</span>
            <h2>想让小腾哥本人带你走一遍？</h2>
            <p>小腾哥本人带，从认识人一直带到线下约会。先加助理微信聊几分钟，看适合哪一门。</p>
            <ul><li>亲密关系研学营（第 6 期）：8 节课，从认识异性到线下约会</li><li>30 天实战陪跑：4 次 1V1 电话 + 30 天微信答疑</li></ul>
            <a class="link" href="/course">看看小腾哥的课程 →</a>
          </div>
          <figure class="qr"><img src="/assets/assistant-wechat.png" width="156" height="156" alt="小腾哥助理微信二维码" loading="lazy"><figcaption>加助理微信咨询<br>手机长按识别</figcaption></figure>
        </div>
      </div>
    </section>

    <section class="sec" style="padding-top:0">
      <div class="in">
        <h2>常见问题</h2>
        <div class="faq">
${FAQS.map(([q, a], i) => `          <details${i ? "" : " open"}><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join("\n")}
        </div>
        <div class="quick">
          <b>大家常问</b>
          <nav aria-label="常见聊天问题">${QUICK_ANSWERS.map(([slug, t]) => `<a href="/answers/${slug}">${escapeHtml(t)}</a>`).join("")}<a href="/answers">全部问答 →</a></nav>
        </div>
      </div>
    </section>

    <section class="sec sec-dark final">
      <div class="in">
        <h2>下次不知道怎么回，先发给它看看。</h2>
        <a class="btn btn-primary" href="#mp-qr" data-cta="end">立即体验 · 免费</a>
      </div>
    </section>

${siteFooter()}

<div class="r2pay-mask" id="r2payMask" role="dialog" aria-modal="true" aria-labelledby="r2payModalTitle">
  <div class="r2pay-modal">
    <button class="r2pay-close" id="r2payClose" type="button" aria-label="关闭">&#215;</button>
    <div id="r2payBody"></div>
  </div>
</div>
<div class="r2pay-toast" id="r2payToast"></div>
${MP_FLOAT}
<script id="r2pay-js" src="/assets/web-commerce.js?v=${COMMERCE_VERSION}" defer></script>
  </body>`;
}

// 右下角小程序码浮窗（旧首页原样搬来）
const MP_FLOAT = fs.readFileSync(path.join(ROOT, "tools", "home-mp-float.html"), "utf8").trim();

const html = fs.readFileSync(FILE, "utf8");
const headEnd = html.indexOf("<body");
if (headEnd < 0) throw new Error("index.html: 找不到 <body>");
let head = html.slice(0, headEnd);
head = head
  .replace(/\s*<script>\s*window\.__INLINE_DATA__[\s\S]*?<\/script>/, "")
  .replace(/\s*<style[^>]*>[\s\S]*?<\/style>/g, "")
  .replace(/\s*<link rel="stylesheet" href="[^"]*(?:tokens|site-chrome|home)\.css[^"]*" \/>/g, "")
  .replace(/\s*<script src="\/assets\/[a-z-]+\.js[^"]*" defer><\/script>/g, "")
  .replace(
    /\s*<\/head>\s*$/,
    `\n    <link rel="stylesheet" href="/assets/tokens.css?v=${STYLE_VERSION}" />\n    <link rel="stylesheet" href="/assets/site-chrome.css?v=${STYLE_VERSION}" />\n    <link rel="stylesheet" href="/assets/home.css?v=${STYLE_VERSION}" />\n  </head>`,
  );
// 结构化数据里的 FAQPage 换成页面上实际的常见问题
head = head.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (m, open, json, close) => {
  const data = JSON.parse(json);
  for (const node of data["@graph"] || []) {
    if (node["@type"] === "FAQPage") {
      node.mainEntity = FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }));
    }
  }
  return `${open}${JSON.stringify(data)}${close}`;
});
fs.writeFileSync(FILE, `${head}\n  ${body()}\n</html>\n`);
console.log("generated index.html");
