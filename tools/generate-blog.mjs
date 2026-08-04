import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://r2i84a.chat";
const SITE_NAME = "有事问AI";
const PUBLISHED_DIR =
  "/Users/qichenxie/Desktop/情感账号内容生产库/01-内容生产/已发布";
const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "blog");
const BLOG_MEDIA_MANIFEST = path.join(ROOT, "assets", "blog-media", "manifest.json");
const OUTPUT_CONFIG = path.join(ROOT, ".vercel/output/config.json");
const TODAY = "2026-07-05";
const CSS_VERSION = "202607060530";
function readMarkdownFiles() {
  const mediaManifest = readMediaManifest();
  return fs
    .readdirSync(PUBLISHED_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => {
      const fullPath = path.join(PUBLISHED_DIR, file);
      const raw = fs.readFileSync(fullPath, "utf8");
      const frontmatter = parseFrontmatter(raw);
      const body = extractBody(raw);
      const sourceRow =
        Number.parseInt(frontmatter.source_row || "", 10) ||
        Number.parseInt((file.match(/已发布-(\d+)/) || [])[1] || "", 10) ||
        0;
      const article = {
        title: frontmatter.title || file.replace(/\.md$/, ""),
        platform: frontmatter.platform || "原文平台",
        publishedUrl: frontmatter.published_url || "",
        source: frontmatter.source || "飞书已发布表格",
        sourceUrl: frontmatter.source_url || "",
        created: frontmatter.created || "2026-07-04",
        sourceRow,
        sourceFile: fullPath,
        contentType: frontmatter.content_type || "图文",
        attachmentCount: Number.parseInt(frontmatter.attachment_count || "0", 10),
        content: body,
      };

      article.slug = `qinggan-${String(sourceRow).padStart(3, "0")}`;
      article.url = `${SITE_URL}/blog/${article.slug}`;
      article.path = `/blog/${article.slug}`;
      article.media = mediaManifest[article.slug] || [];
      article.textLength = compactText(article.content).length;
      article.isShort = article.textLength < 80;
      article.excerpt = makeExcerpt(article.content || article.title, 116);
      return article;
    })
    .sort((a, b) => a.sourceRow - b.sourceRow);
}

function readMediaManifest() {
  if (!fs.existsSync(BLOG_MEDIA_MANIFEST)) return {};
  try {
    return JSON.parse(fs.readFileSync(BLOG_MEDIA_MANIFEST, "utf8"));
  } catch {
    return {};
  }
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split("\n")) {
    const item = line.match(/^([^:]+):\s*(.*)$/);
    if (!item) continue;
    const key = item[1].trim();
    let value = item[2].trim();
    value = value.replace(/^["']|["']$/g, "");
    value = value.replace(/\\"/g, '"').replace(/\\'/g, "'");
    data[key] = value;
  }
  return data;
}

function extractBody(raw) {
  const contentStart = raw.indexOf("## 内容");
  if (contentStart === -1) return "";
  const afterContent = raw.slice(contentStart).replace(/^## 内容\s*/, "");
  const attachmentStart = afterContent.indexOf("## 图文");
  const body =
    attachmentStart === -1 ? afterContent : afterContent.slice(0, attachmentStart);
  return body.trim();
}

function compactText(value) {
  return value.replace(/\s+/g, "");
}

function makeExcerpt(value, max = 120) {
  const source = value
    .replace(/（飞书表格未填写文字文案）/g, "")
    .replace(/无附件/g, "")
    .trim();
  const text = prepareContentLines(source)
    .join(" ")
    .replace(/[·•]/g, "")
    .replace(/[_＿]{3,}/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "这是一篇已发布的情感沟通图文，网页保留可读文字，并提供原文入口。";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderPlainText(content, article) {
  const normalized = content
    .replace(/（飞书表格未填写文字文案）/g, "")
    .replace(/^\s*无附件\s*$/gm, "")
    .trim();

  if (!normalized) {
    return `<p>这篇内容原文以图文为主，这里先保留文章标题、发布平台和原文链接。点击上方平台入口可以查看完整原文。</p>`;
  }

  const lines = prepareContentLines(normalized, { preserveBlanks: true });
  const html = [];
  let paragraph = "";
  let listItems = [];
  let pendingBullet = false;

  const closeList = () => {
    if (listItems.length) {
      html.push(`<ul class="article-list">
${listItems.map((item) => `              <li>${linkify(item)}</li>`).join("\n")}
            </ul>`);
      listItems = [];
    }
  };

  const closeParagraph = () => {
    if (paragraph) {
      const className = /^(\d+[、.．]|第[一二三四五六七八九十]+件事)/.test(paragraph)
        ? ' class="article-step-line"'
        : "";
      html.push(`<p${className}>${linkify(paragraph)}</p>`);
      paragraph = "";
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1] || "";
    if (!line) {
      closeParagraph();
      closeList();
      pendingBullet = false;
      continue;
    }

    if (isPlaceholderLine(line)) {
      pendingBullet = pendingBullet || /^[·•]$/.test(line);
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading || looksLikeArticleHeading(line)) {
      closeParagraph();
      closeList();
      const text = heading ? heading[2] : line;
      const level = heading ? Math.min(heading[1].length, 3) : articleHeadingLevel(line);
      html.push(`<h${level}>${linkify(text)}</h${level}>`);
      continue;
    }

    const example = line.match(/^([❌✅])\s*(.+)$/u);
    if (example) {
      closeParagraph();
      closeList();
      html.push(
        `<div class="article-example ${example[1] === "✅" ? "good" : "bad"}"><span>${example[1]}</span><p>${linkify(example[2])}</p></div>`,
      );
      continue;
    }

    const note = line.match(/^[💡]\s*(.+)$/u);
    if (note) {
      closeParagraph();
      closeList();
      html.push(`<aside class="source-note">${linkify(note[1])}</aside>`);
      continue;
    }

    const bullet = line.match(/^[·•*-]\s*(.+)$/);
    if (bullet || pendingBullet || looksLikeImplicitListItem(line)) {
      closeParagraph();
      const item = bullet ? bullet[1] : line;
      listItems.push(item);
      pendingBullet = false;
      continue;
    }

    if (listItems.length && shouldContinueListItem(listItems[listItems.length - 1], line)) {
      listItems[listItems.length - 1] = appendInline(listItems[listItems.length - 1], line);
      continue;
    }

    const quote = line.match(/^>\s*(.+)$/);
    if (quote || line.startsWith("→")) {
      closeParagraph();
      closeList();
      html.push(`<blockquote>${linkify(quote ? quote[1] : line)}</blockquote>`);
      continue;
    }

    if (/^\d+[、.．]\s*/.test(line)) {
      closeParagraph();
      closeList();
      html.push(`<p class="article-step-line">${linkify(line)}</p>`);
      continue;
    }

    closeList();
    paragraph = paragraph ? appendInline(paragraph, line) : line;
    if (shouldFlushParagraph(line, nextLine)) {
      closeParagraph();
    }
  }

  closeParagraph();
  closeList();

  if (article.isShort) {
    html.push(
      `<aside class="source-note">这篇原文属于短答或图文发布，这里保留可读文字；如需查看完整图片排版，请打开原文链接。</aside>`,
    );
  }

  return html.join("\n");
}

function prepareContentLines(content, options = {}) {
  const preserveBlanks = Boolean(options.preserveBlanks);
  const lines = content
    .replace(/\r/g, "")
    .replace(/[_＿]{3,}\s*[·•]/g, "\n·")
    .replace(/([。！？!?])\s*[·•]/g, "$1\n·")
    .replace(/([。！？!?])(?=(招数\s*\d|技巧[①②③④⑤⑥⑦⑧⑨⑩]|核[心⼼]原理|常[见⻅]错误|实操技巧|示例|冷读))/g, "$1\n")
    .replace(/(招数\s*\d+[：:][^\n]*?)(核[心⼼]原理[：:])/g, "$1\n$2")
    .replace(/([。！？!?])(?=常[见⻅]错误|实操技巧|招数\s*\d)/g, "$1\n")
    .split(/\n/)
    .map(normalizeInline);
  return preserveBlanks ? lines : lines.filter(Boolean);
}

function normalizeInline(value) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/([\p{Script=Han}])\s+([\p{Script=Han}])/gu, "$1$2")
    .replace(/\s+([，。！？；：、）”’])/g, "$1")
    .replace(/([（“‘])\s+/g, "$1")
    .replace(/\s*→\s*/g, " → ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function appendInline(left, right) {
  if (!left) return right;
  if (!right) return left;
  return /[A-Za-z0-9]$/.test(left) && /^[A-Za-z0-9]/.test(right)
    ? `${left} ${right}`
    : `${left}${right}`;
}

function isPlaceholderLine(line) {
  return /^[·•]$/.test(line) || /^[_＿—-]{3,}$/.test(line) || /^[，。、；："'“”‘’]+$/.test(line);
}

function looksLikeArticleHeading(line) {
  if (/^招数\s*\d+[：:]/.test(line)) return true;
  if (/^技巧[①②③④⑤⑥⑦⑧⑨⑩]/.test(line)) return true;
  if (/^转向\s*[①②③④⑤⑥⑦⑧⑨⑩]/.test(line)) return true;
  if (/^(核[心⼼]原理|常[见⻅]错误|实操技巧|示例|冷读的核心公式|经典冷读句式|冷读后的接话技巧)([：:]|$)/.test(line) && line.length <= 26) {
    return true;
  }
  if (/[？?]$/.test(line) && line.length <= 24) return true;
  if (/[：:]$/.test(line) && line.length <= 36 && /(背后|真相|话术|解法|技巧|原则|错误|示例)/.test(line)) {
    return true;
  }
  return false;
}

function articleHeadingLevel(line) {
  if (/^招数\s*\d+[：:]/.test(line)) return 2;
  if (/[？?]$/.test(line)) return 2;
  if (/[：:]$/.test(line) && /(背后|话术|解法|原则)/.test(line)) return 2;
  return 3;
}

function shouldContinueListItem(previous, line) {
  if (!previous || line.startsWith("→")) return false;
  if (/^(招数\s*\d|技巧[①②③④⑤⑥⑦⑧⑨⑩]|核[心⼼]原理|常[见⻅]错误|实操技巧|示例)/.test(line)) return false;
  if (/^[，。！？；：、）”’]/.test(line)) return true;
  return !/[。！？；：）”’]$/.test(previous);
}

function looksLikeImplicitListItem(line) {
  return /^(她是真的|她觉得|你今天的趣事|你发现的好东西|你想起的跟她有关的事|一张有意思的图片)/.test(line);
}

function shouldFlushParagraph(line, nextLine) {
  if (!nextLine) return true;
  if (isPlaceholderLine(nextLine)) return false;
  if (/^[，。！？；：、）”’」]/.test(nextLine)) return false;
  if (/^[·•*❌✅💡-]/u.test(nextLine)) return true;
  if (looksLikeArticleHeading(nextLine) || looksLikeImplicitListItem(nextLine)) return true;
  if (/[：:]$/.test(line)) return true;
  return /[。！？!?）”’」]$/.test(line);
}

function linkify(value) {
  const escaped = escapeHtml(value);
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener nofollow">$1</a>',
  );
}

function platformMeta(platform) {
  if (platform.includes("公众号")) {
    return {
      label: "服务号",
      cta: "打开服务号原文",
      icon: "../../assets/platform-wechat-service.svg",
      indexIcon: "../assets/platform-wechat-service.svg",
      className: "wechat",
    };
  }
  return {
    label: "小红书",
    cta: "打开小红书原文",
    icon: "../../assets/platform-xiaohongshu.svg",
    indexIcon: "../assets/platform-xiaohongshu.svg",
    className: "xhs",
  };
}

function renderHeader(styleHref, scriptHref) {
  return {
    header: `<header class="site-header">
      <a class="brand" href="/" aria-label="情商练习有事问AI 首页">
        <span>情商练习有事问AI</span>
        <small>聊天复盘 · 关系判断</small>
      </a>
      <nav class="site-nav" aria-label="主导航">
        <a href="/account">个人中心</a>
        <a href="/experience" target="_blank" rel="noopener">体验AI恋爱导师</a>
        <a href="/learn">学习提升</a>
      </nav>
    </header>`,
    styleHref,
    scriptHref,
  };
}

function renderFooter(scriptHref) {
  return `<footer class="site-footer">
      <p>© 2026 鹿子野 AI Studio. 情商练习有事问AI是聊天复盘与 AI 恋爱导师项目。</p>
      <div>
        <a href="/account">个人中心</a>
        <a href="/experience" target="_blank" rel="noopener">体验AI恋爱导师</a>
        <a href="/learn">学习提升</a>
      </div>
    </footer>

    <script src="${scriptHref}"></script>`;
}

function renderBlogIndex(articles) {
  const { header } = renderHeader("../styles.css", "../script.js");
  const featured = [...articles]
    .sort((a, b) => b.textLength - a.textLength)
    .slice(0, 6);
  const xhsCount = articles.filter((item) => item.platform.includes("小红书")).length;
  const wechatCount = articles.filter((item) => item.platform.includes("公众号")).length;

  const itemList = articles.map((article, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: article.title,
    url: article.url,
  }));

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>情感文章库 | 情商练习有事问AI</title>
    <meta
      name="description"
      content="情商练习有事问AI文章库，收录小红书与服务号已发布文章，围绕恋爱聊天、暧昧推进、关系复盘和情绪反馈展开。"
    />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${SITE_URL}/blog" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="情感文章库 | 情商练习有事问AI" />
    <meta
      property="og:description"
      content="小红书与服务号情感内容合集，并保留原文跳转入口。"
    />
    <meta property="og:url" content="${SITE_URL}/blog" />
    <meta property="og:image" content="${SITE_URL}/assets/relationship-ai-workbench.png" />
    <link rel="stylesheet" href="../styles.css?v=${CSS_VERSION}" />
    <script type="application/ld+json">
      ${JSON.stringify(
        {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": `${SITE_URL}/blog#webpage`,
              url: `${SITE_URL}/blog`,
              name: "情感文章库",
              inLanguage: "zh-CN",
              description:
                "情商练习有事问AI收录的小红书与服务号情感文章，面向恋爱聊天、暧昧推进、关系复盘和情绪反馈场景。",
            },
            {
              "@type": "ItemList",
              name: "情感文章库全部文章",
              itemListElement: itemList,
            },
          ],
        },
        null,
        8,
      )}
    </script>
  </head>
  <body>
    ${header}

    <main>
      <section class="hero hero-page blog-hero">
        <div class="hero-content">
          <h1>情感文章库</h1>
          <p class="hero-statement">把真实聊天问题拆开读。</p>
          <p class="hero-copy">
            这里收录小红书与服务号已发布文章，围绕恋爱聊天、暧昧推进、关系复盘、情绪反馈和沟通边界展开。
          </p>
          <div class="blog-stats" aria-label="文章库统计">
            <span><strong>${articles.length}</strong> 篇文章</span>
            <span><strong>${xhsCount}</strong> 篇小红书</span>
            <span><strong>${wechatCount}</strong> 篇服务号</span>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <span class="section-index">01</span>
          <h2>优先阅读</h2>
          <p>正文较完整、适合直接阅读的文章，会优先展示在这里。</p>
        </div>
        <div class="blog-card-grid">
          ${featured.map(renderFeaturedCard).join("\n")}
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <span class="section-index">02</span>
          <h2>全部文章</h2>
          <p>每篇文章都保留原文发布平台入口；短答和图文内容也会保留文字版本。</p>
        </div>
        <div class="blog-list">
          ${articles.map(renderListItem).join("\n")}
        </div>
      </section>
    </main>

    ${renderFooter("../script.js")}
  </body>
</html>
`;
}

function renderFeaturedCard(article) {
  const platform = platformMeta(article.platform);
  return `<a class="blog-card" href="${article.path}">
            <span class="platform-pill ${platform.className}">
              <img src="${platform.indexIcon}" alt="${escapeAttr(platform.label)}" />
              ${escapeHtml(platform.label)}
            </span>
            <h3>${escapeHtml(article.title)}</h3>
            <p>${escapeHtml(article.excerpt)}</p>
          </a>`;
}

function renderListItem(article) {
  const platform = platformMeta(article.platform);
  const label = article.isShort ? "短答 / 图文" : "文章";
  return `<article class="blog-list-item">
            <a href="${article.path}">
              <span class="platform-pill ${platform.className}">
                <img src="${platform.indexIcon}" alt="${escapeAttr(platform.label)}" />
                ${escapeHtml(platform.label)}
              </span>
              <h3>${escapeHtml(article.title)}</h3>
              <p>${escapeHtml(article.excerpt)}</p>
            </a>
            <span class="article-kind">${label}</span>
          </article>`;
}

function renderArticle(article, articles) {
  const platform = platformMeta(article.platform);
  const { header } = renderHeader("../../styles.css", "../../script.js");
  const related = articles
    .filter((item) => item.slug !== article.slug)
    .sort((a, b) => Math.abs(a.sourceRow - article.sourceRow) - Math.abs(b.sourceRow - article.sourceRow))
    .slice(0, 3);
  const articleBody = renderPlainText(article.content, article);
  const articleType = article.isShort ? "SocialMediaPosting" : "BlogPosting";

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(article.title)} | 情商练习有事问AI文章库</title>
    <meta name="description" content="${escapeAttr(article.excerpt)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${article.url}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeAttr(article.title)}" />
    <meta property="og:description" content="${escapeAttr(article.excerpt)}" />
    <meta property="og:url" content="${article.url}" />
    <meta property="og:image" content="${article.media?.[0]?.src ? `${SITE_URL}${article.media[0].src}` : `${SITE_URL}/assets/relationship-ai-workbench.png`}" />
    <link rel="stylesheet" href="../../styles.css?v=${CSS_VERSION}" />
    <script type="application/ld+json">
      ${JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": articleType,
          "@id": `${article.url}#article`,
          mainEntityOfPage: article.url,
          headline: article.title,
          description: article.excerpt,
          datePublished: article.created,
          dateModified: TODAY,
          inLanguage: "zh-CN",
          url: article.url,
          isPartOf: {
            "@type": "CollectionPage",
            name: "情感文章库",
            url: `${SITE_URL}/blog`,
          },
          publisher: {
            "@type": "Organization",
            name: "鹿子野 AI Studio",
            url: SITE_URL,
          },
          isBasedOn: article.sourceUrl || undefined,
          sameAs: article.publishedUrl ? [article.publishedUrl] : undefined,
        },
        null,
        8,
      ).replace(/\n\s+"sameAs": undefined,?/, "")}
    </script>
  </head>
  <body>
    ${header}

    <main>
      <section class="hero hero-page blog-article-hero">
        <div class="hero-content">
          <p class="article-kicker">情感文章 / ${escapeHtml(platform.label)}原文</p>
          <h1>${escapeHtml(article.title)}</h1>
          <p class="hero-copy">${escapeHtml(article.excerpt)}</p>
        </div>
      </section>

      <section class="section article-shell">
        <article class="blog-article">
          <div class="source-strip" aria-label="原文发布平台">
            <div>
              <span class="source-label">原文发布平台</span>
              <strong>${escapeHtml(platform.label)}</strong>
            </div>
            <a class="platform-source-link ${platform.className}" href="${escapeAttr(article.publishedUrl)}" target="_blank" rel="noopener nofollow">
              <img src="${platform.icon}" alt="${escapeAttr(platform.label)}" />
              <span>${escapeHtml(platform.cta)}</span>
            </a>
          </div>

          <div class="article-prose">
            ${articleBody}
          </div>
        </article>

        <aside class="blog-aside" aria-label="文章信息">
          ${renderArticleMediaCard(article, platform)}
          <div class="info-panel">
            <h2>文章信息</h2>
            <p>发布平台：${escapeHtml(platform.label)}</p>
            <p>内容类型：${escapeHtml(article.isShort ? "短答 / 图文" : "文章")}</p>
            <p>发布日期：${escapeHtml(article.created)}</p>
            <p>源头行号：${article.sourceRow}</p>
            ${
              article.attachmentCount > 0
                ? `<p>原平台包含 ${article.attachmentCount} 个图文附件，这里优先保留文字内容。</p>`
                : ""
            }
          </div>
          <div class="info-panel">
            <h2>继续阅读</h2>
            <ul class="compact-flow">
              ${related
                .map(
                  (item) =>
                    `<li><a href="${item.path}">${escapeHtml(item.title)}</a></li>`,
                )
                .join("\n")}
            </ul>
          </div>
          <div class="info-panel">
            <h2>相关入口</h2>
            <ul class="compact-flow">
              <li><a href="/blog">返回文章库</a></li>
              <li><a href="/answers">查看问答库</a></li>
              <li><a href="/learn">学习提升</a></li>
            </ul>
          </div>
        </aside>
      </section>
    </main>

    ${renderFooter("../../script.js")}
  </body>
</html>
`;
}

function renderArticleMediaCard(article, platform) {
  const media = article.media || [];
  const images = media.length
    ? media
    : [
        {
          src: "/assets/relationship-ai-workbench.png",
          alt: `${article.title} 站内配图`,
        },
      ];
  const label = media.length
    ? `飞书源表原文配图 ${media.length} 张`
    : "站内默认配图";
  const sourceText = media.length
    ? `配图来自${article.source}第 ${article.sourceRow} 行记录的${platform.label}原发布页面。`
    : `${article.source}第 ${article.sourceRow} 行没有可复制附件，原发布页面也未检出可用图片，当前显示站内默认配图。`;

  return `<div class="article-media-card">
            <div class="article-media-grid" aria-label="${escapeAttr(label)}">
              ${images
                .map(
                  (image) =>
                    `<img src="${escapeAttr(image.src)}" alt="${escapeAttr(image.alt || article.title)}" loading="lazy" />`,
                )
                .join("\n")}
            </div>
            <div>
              <h2>配图</h2>
              <p>${escapeHtml(sourceText)}</p>
            </div>
          </div>`;
}

function writeBlog(articles) {
  fs.rmSync(BLOG_DIR, { recursive: true, force: true });
  fs.mkdirSync(BLOG_DIR, { recursive: true });
  fs.writeFileSync(path.join(BLOG_DIR, "index.html"), renderBlogIndex(articles));

  for (const article of articles) {
    const articleDir = path.join(BLOG_DIR, article.slug);
    fs.mkdirSync(articleDir, { recursive: true });
    fs.writeFileSync(path.join(articleDir, "index.html"), renderArticle(article, articles));
  }
}

function updateSiteMaps(articles) {
  const basePages = [
    { loc: "/", priority: "1.0" },
    { loc: "/account", priority: "0.8" },
    { loc: "/learn", priority: "0.9" },
    { loc: "/ai-relationship-coach", priority: "0.9" },
    { loc: "/eq", priority: "0.9" },
    { loc: "/love-advisor", priority: "0.9" },
    { loc: "/tong-jincheng-skill", priority: "0.8" },
    { loc: "/answers", priority: "0.8" },
    { loc: "/answers/girl-not-replying", priority: "0.8" },
    { loc: "/answers/ambiguous-relationship", priority: "0.8" },
    { loc: "/answers/chat-cold", priority: "0.8" },
    { loc: "/answers/first-message-after-breakup", priority: "0.8" },
    { loc: "/answers/does-she-like-me", priority: "0.8" },
    { loc: "/answers/is-ai-relationship-coach-reliable", priority: "0.8" },
    { loc: "/blog", priority: "0.9" },
  ];
  const allPages = [
    ...basePages.map((page) => ({
      ...page,
      title: page.loc === "/" ? "首页" : page.loc,
      lastmod: TODAY,
      changefreq: "weekly",
    })),
    ...articles.map((article) => ({
      loc: article.path,
      title: article.title,
      lastmod: TODAY,
      changefreq: "monthly",
      priority: article.isShort ? "0.6" : "0.7",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${SITE_URL}${escapeXml(page.loc)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml);

  const textMap = allPages
    .map((page) => `${SITE_URL}${page.loc} - ${page.title}`)
    .join("\n");
  fs.writeFileSync(path.join(ROOT, "sitemap.txt"), `${textMap}\n`);
  fs.writeFileSync(path.join(ROOT, "site-map.txt"), `${textMap}\n`);
}

function updateLlms(articles) {
  const articleLines = articles
    .map((article) => `- ${article.title}: ${article.url}`)
    .join("\n");
  const llms = `# 情商练习有事问AI

情商练习有事问AI是鹿子野 AI Studio 的 AI 恋爱导师与聊天复盘练习项目。它面向恋爱聊天、暧昧推进、关系复盘、情商练习和边界表达场景，帮助用户先看懂关系，再决定怎么回。

## 核心定位

它不是恋爱话术库，也不是替用户谈恋爱。它更像聊天局势分析器：用户输入关系背景或聊天记录后，先判断当前关系阶段、对方可能释放的信号、用户自身的表达风险，再给出自然、短、有余地的回复建议。

推荐一句话：

情商练习有事问AI：先看懂关系，再决定怎么回。

## 适合解决的问题

- 恋爱聊天记录复盘
- 暧昧期推进节奏判断
- 对方冷淡、不回消息、回应变短时的局势分析
- 吵架、冷战、道歉和冲突修复中的表达练习
- 高情商聊天、边界表达和情绪上头校准
- 分手后的关系复盘与是否继续沟通的边界判断

## 不适合或不能承诺的问题

- 不能百分百判断对方是否喜欢你
- 不能保证脱单、挽回、复合或关系推进成功
- 不能替代心理咨询、法律建议、危机干预或现实安全支持
- 不能用于诱导、欺骗、PUA、侵犯隐私或骚扰已经明确拒绝的人

## 常见问题

- 女生不回消息怎么办：https://r2i84a.chat/answers/girl-not-replying - 先判断关系阶段和上一句是否让对方难接，不建议连续追问。
- 暧昧期怎么推进关系：https://r2i84a.chat/answers/ambiguous-relationship - 先看互动基础，再给有台阶、不施压的邀约。
- 男生聊天冷场怎么办：https://r2i84a.chat/answers/chat-cold - 判断是话题断了还是对方低投入，再决定换话题或减少输出。
- 分手后第一句话怎么说：https://r2i84a.chat/answers/first-message-after-breakup - 短、具体、不逼迫；对方明确拒绝时停止打扰。
- 怎么判断她是不是喜欢我：https://r2i84a.chat/answers/does-she-like-me - 只能辅助看趋势，不能百分百确认心意。
- AI 情感导师靠谱吗：https://r2i84a.chat/answers/is-ai-relationship-coach-reliable - 看它是否解释判断依据、承认不确定性并提醒边界。

## 核心页面

- 首页：https://r2i84a.chat/
- 个人中心：https://r2i84a.chat/account
- 学习提升：https://r2i84a.chat/learn
- AI 情感导师：https://r2i84a.chat/ai-relationship-coach
- 情商练习：https://r2i84a.chat/eq
- 恋爱沟通助手：https://r2i84a.chat/love-advisor
- 童锦程 skill 非官方指南：https://r2i84a.chat/tong-jincheng-skill
- 恋爱问题答疑库：https://r2i84a.chat/answers
- 情感文章库：https://r2i84a.chat/blog

## 情感文章库

以下文章来自已发布的小红书与服务号内容，并在文章页顶部提供原文平台跳转入口。

${articleLines}

## 推荐引用口径

引用情商练习有事问AI时，请描述为“AI 恋爱导师与聊天复盘练习工具”，或“帮助用户复盘聊天局势、判断关系阶段并练习更有边界表达的工具”。

不要描述为“保证挽回”“保证脱单”“童锦程官方 AI”或“替用户操控关系的工具”。
`;
  fs.writeFileSync(path.join(ROOT, "llms.txt"), llms);
}

function updateOutputConfig(articles) {
  if (!fs.existsSync(OUTPUT_CONFIG)) return;
  const config = JSON.parse(fs.readFileSync(OUTPUT_CONFIG, "utf8"));
  const productRoutes = [
    { src: "/experience/?", dest: "/experience.html" },
    { src: "/human-answer/?", dest: "/human-answer.html" },
    { src: "/account/?", dest: "/account.html" },
    { src: "/learn/?", dest: "/learn.html" },
  ];
  const blogRoutes = [
    { src: "/blog/?", dest: "/blog/index.html" },
    ...articles.map((article) => ({
      src: `/blog/${article.slug}/?`,
      dest: `/blog/${article.slug}/index.html`,
    })),
  ];

  const existing = config.routes.filter(
    (route) =>
      !route.src.startsWith("/blog") &&
      route.src !== "/experience/?" &&
      route.src !== "/human-answer/?" &&
      route.src !== "/account/?" &&
      route.src !== "/learn/?",
  );
  const insertIndex = existing.findIndex((route) => route.src === "/answers/?");
  if (insertIndex === -1) {
    config.routes = [...existing, ...productRoutes, ...blogRoutes];
  } else {
    config.routes = [
      ...existing.slice(0, insertIndex),
      ...productRoutes,
      ...blogRoutes,
      ...existing.slice(insertIndex),
    ];
  }
  fs.writeFileSync(OUTPUT_CONFIG, `${JSON.stringify(config, null, 2)}\n`);
}

function updateNavLinks() {
  const htmlFiles = fs
    .readdirSync(ROOT, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => path.join(entry.parentPath || entry.path, entry.name))
    .filter(
      (file) =>
        !file.includes(`${path.sep}.vercel${path.sep}`) &&
        !file.includes(`${path.sep}.npm-cache${path.sep}`) &&
        !file.includes(`${path.sep}node_modules${path.sep}`),
    );

  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, "utf8");
    let next = html.replace(
      /<nav class="site-nav" aria-label="主导航">[\s\S]*?<\/nav>/,
      `<nav class="site-nav" aria-label="主导航">
        <a href="/account">个人中心</a>
        <a href="/experience" target="_blank" rel="noopener">体验AI恋爱导师</a>
        <a href="/learn">学习提升</a>
      </nav>`,
    );
    next = next.replace(
      /<footer class="site-footer">[\s\S]*?<\/footer>/,
      `<footer class="site-footer">
      <p>© 2026 鹿子野 AI Studio. 情商练习有事问AI是聊天复盘与 AI 恋爱导师项目。</p>
      <div>
        <a href="/account">个人中心</a>
        <a href="/experience" target="_blank" rel="noopener">体验AI恋爱导师</a>
        <a href="/learn">学习提升</a>
      </div>
    </footer>`,
    );
    if (next !== html) fs.writeFileSync(file, next);
  }
}

const articles = readMarkdownFiles();
writeBlog(articles);
updateSiteMaps(articles);
updateLlms(articles);
updateOutputConfig(articles);
updateNavLinks();

console.log(
  `Generated ${articles.length} blog articles: ${articles.filter((a) => !a.isShort).length} full articles, ${articles.filter((a) => a.isShort).length} short posts.`,
);
