// 文章页外壳：页头、页脚、标题区、收尾、各个组件的 HTML。
// 结构照网站SEO_GEO/文章页设计稿.html；build-article-pages.mjs（新文章）和
// apply-seo.mjs（还没写进数据文件的旧文章）共用这里，保证两种文章长得一样。
import { SITE_URL, SITE_BRAND, SEO_UPDATED } from "./seo-config.mjs";

export const STYLE_VERSION = "20261031";
export const BILIBILI_URL = "https://space.bilibili.com/77669328";
export const COURSE_LINK_TEXT = "看看小腾哥的课程 →";
export const TRY_LINK_TEXT = "立即体验";
// 两个二维码：行动区放小程序码，作者卡放助理微信，宽度一样，左边缘对齐
export const MINI_QR = "/assets/mp-qrcode.jpg";
export const CONSULT_QR = "/assets/assistant-wechat.png";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** 页头：深色、跟随、56px；文章页多一条阅读进度线 */
export function siteHeader({ progress = true } = {}) {
  return `    <header class="site-header">
      <span class="brand">${SITE_BRAND}</span>
      <nav><a class="learn" href="/learn">学习提升</a><a class="btn-try" href="#mp-qr" data-cta="header">${TRY_LINK_TEXT}</a></nav>${progress ? '\n      <span class="progress" id="progress"></span>' : ""}
    </header>`;
}

/** 页脚：品牌名 + 一句描述 + 四个链接（会员只放在这里） */
export function siteFooter() {
  return `    <footer class="site-footer">
      <div class="in">
        <div><span class="brand">${SITE_BRAND}</span><br>聊天复盘 · 关系判断 · 小腾哥真人带练</div>
        <nav><a href="/blog">文章库</a><a href="/answers">问答库</a><a href="/course">小腾哥的课程</a><a href="/#pricing">购买会员</a></nav>
      </div>
    </footer>`;
}

/** 深色标题区：面包屑 → H1 → 一句话结论 → 作者行 */
export function articleHero({ category, title, verdict, label = "一句话结论", minutes = 5, byline, root = { href: "/blog", label: "文章库" } }) {
  const home = `<a href="${root.href}">${escapeHtml(root.label)}</a>`;
  const crumbs = category ? `${home}<span>/</span><span>${escapeHtml(category)}</span>` : home;
  return `    <section class="hero">
      <div class="hero-in">
        <div class="crumbs">${crumbs}</div>
        <h1>${escapeHtml(title)}</h1>
        <div class="verdict"><div class="label">${escapeHtml(label)}</div><p>${escapeHtml(verdict)}</p></div>
${byline ? `        <div class="byline">
          <div class="avatar">${byline.avatar}</div>
          <div>${byline.html}</div>
        </div>
` : ""}      </div>
    </section>`;
}

/** 小腾哥作者行（数据里的文章才署他的名字） */
export function authorByline({ minutes, fromCourse = false }) {
  return {
    avatar: "腾",
    html: `<b>小腾哥</b> <span class="gold">· 6 年约会实战</span> · 约 ${minutes} 分钟${fromCourse ? '<span class="src"> · 内容出自研学营课程</span>' : ""}`,
  };
}

/** 旧文章的作者行：不署小腾哥，写整理方 */
export function editorByline({ minutes }) {
  return {
    avatar: "情",
    html: `<b>${SITE_BRAND}</b> <span class="gold">· 编辑整理</span> · 约 ${minutes} 分钟`,
  };
}

export function replyCard({ she, text, why, source }) {
  return `        <div class="reply">
          <div class="reply-head">${escapeHtml(she)}<button type="button">复制</button></div>
          <div class="reply-body">
            <div class="bubble">${escapeHtml(text)}</div>${why ? `
            <div class="reply-why">${escapeHtml(why)}</div>` : ""}${source ? `\n            <div class="reply-src">回复出自 ${escapeHtml(source)}</div>` : ""}
          </div>
        </div>`;
}

export function stageBlock(stages) {
  return `        <div class="stage">
${stages
  .map(
    (item) => `          <div class="stage-item${item.warn ? " warn" : ""}"><div class="when">${escapeHtml(item.when)}</div><div class="what">${escapeHtml(item.what)}</div><p>${escapeHtml(item.note)}</p></div>`,
  )
  .join("\n")}
        </div>`;
}

export function dontsBlock(donts) {
  return `        <ul class="donts">
${donts.map((item) => `          <li><b>${escapeHtml(item.say)}</b>${escapeHtml(item.why)}</li>`).join("\n")}
        </ul>`;
}

export function quoteBlock({ text, source }) {
  return `        <div class="quote">
          <span class="mark">“</span>
          <p>${escapeHtml(text)}</p>
          <cite><b>小腾哥</b> · ${escapeHtml(source)}</cite>
        </div>`;
}

export function inlineCta() {
  return `        <div class="inline-cta">不确定哪句适合你们？截图问 AI，按你们的聊天挑一句。<a href="#mp-qr" data-cta="inline">${TRY_LINK_TEXT} →</a></div>`;
}

export function tocBlock({ items, first = true }) {
  return `    <aside class="toc" aria-label="本文目录">
      <b>本文目录</b>
${items.map((item, index) => `      <a${index === 0 && first ? ' class="on"' : ""} href="#${item.id}">${escapeHtml(item.label)}</a>`).join("\n")}
    </aside>`;
}

/** 二维码：白底圆角 + 两行说明。行动区和作者卡共用，右栏同宽（article.css 里 172px），两个码左边缘对齐。 */
export function qrFigure({ src, alt, caption }) {
  return `<figure class="cta-qr">
          <img src="${src}" width="156" height="156" alt="${escapeHtml(alt)}" loading="lazy" />
          <figcaption>${caption}</figcaption>
        </figure>`;
}

/** 文末行动区：左文右码，直接放小程序码，不放按钮 */
export function ctaSection() {
  return `      <section class="cta dark-card" data-cta="end">
        <div class="cta-text">
          <span class="cta-kicker">立即体验 · 免费</span>
          <h3>你们的情况不一样？</h3>
          <p>微信扫码打开「情商练习有事问AI」小程序，上传你们的聊天截图，AI 先判断她现在的状态，再给适合你们的下一句。</p>
          <ol class="cta-steps"><li>扫码打开小程序</li><li>上传聊天截图</li><li>拿到判断和回复</li></ol>
        </div>
        ${qrFigure({ src: MINI_QR, alt: "情商练习有事问AI 小程序码", caption: "微信扫码<br>手机长按识别" })}
      </section>`;
}

/** 作者卡：和行动区同一个结构（左文右码），右侧直接放助理微信二维码 */
export function authorCard({ fromCourse = true } = {}) {
  const tail = fromCourse ? "本站文章的判断和原话出自他的课程。" : "";
  return `      <section class="author dark-card" data-cta="consult">
        <div class="author-text">
          <span class="cta-kicker">真人带练 · 立即咨询</span>
          <div class="who"><div class="avatar">腾</div><h3>小腾哥 <small>许跃腾</small></h3></div>
          <p>2021 年开始在 <a class="inline" href="${BILIBILI_URL}" target="_blank" rel="noopener">B 站</a>记录自己的约会和情感经历，现在带学员从认识人、线上聊天到线下约会。${tail}</p>
          <div class="facts"><span><b>6 年</b>约会实战</span><span><b>50 万+</b>B 站粉丝</span><span><b>6 期</b>研学营</span></div>
          <a class="course-link" href="/course">${COURSE_LINK_TEXT}</a>
        </div>
        ${qrFigure({ src: CONSULT_QR, alt: "小腾哥助理微信二维码", caption: "加助理微信咨询<br>手机长按识别" })}
      </section>`;
}

export function relatedBlock(items) {
  return `      <section class="related">
        <h3>接着读</h3>
        <div class="related-list">
${items
  .map(
    (item) => `          <a href="/blog/${item.slug}"><span class="tag-light">${escapeHtml(item.category)}</span><b>${escapeHtml(item.title)}</b><span class="sum">${escapeHtml(item.summary)}</span></a>`,
  )
  .join("\n")}
        </div>
      </section>`;
}

export function metaFoot({ platform, published }) {
  // data-platform 留给 apply-seo 重复运行时读回原发布平台（顶部原文平台条已经去掉）
  const first = platform ? `<span data-platform="${escapeHtml(platform)}">首发：${escapeHtml(platform)} ${escapeHtml(published)}</span>` : "";
  return `      <div class="meta-foot">${first}<span>最后更新：${SEO_UPDATED}</span><a href="/blog">返回文章库</a></div>`;
}

/** 复制提示条 + 手机底部行动条（没有回复卡和文中行动条的旧文章不放） */
export function overlays() {
  return `    <div class="toast" id="toast">已复制。发之前看看她现在什么状态 → <a href="#mp-qr" data-cta="toast">${TRY_LINK_TEXT}</a></div>
    <div class="bottom-bar" id="bar"><span>截图问 AI，看她现在什么态度</span><a href="#mp-qr" data-cta="bottom-bar">${TRY_LINK_TEXT}</a><button type="button" aria-label="关闭" id="barX">×</button></div>`;
}

export function jsonLd({ url, title, description, published, image, category }) {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      mainEntityOfPage: url,
      headline: title,
      description,
      datePublished: published,
      dateModified: SEO_UPDATED,
      inLanguage: "zh-CN",
      url,
      articleSection: category || undefined,
      image,
      isPartOf: { "@type": "CollectionPage", name: "情感文章库", url: `${SITE_URL}/blog` },
      author: { "@type": "Person", name: "小腾哥" },
      publisher: { "@type": "Organization", name: "鹿子野 AI Studio", url: SITE_URL },
    },
    null,
    2,
  );
}
