import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLISHED_DIR =
  "/Users/qichenxie/Desktop/情感账号内容生产库/01-内容生产/已发布";
const OUT_DIR = path.join(ROOT, "assets", "blog-media");
const MANIFEST = path.join(OUT_DIR, "manifest.json");
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36";

fs.mkdirSync(OUT_DIR, { recursive: true });

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

function readArticles() {
  return fs
    .readdirSync(PUBLISHED_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => {
      const fullPath = path.join(PUBLISHED_DIR, file);
      const raw = fs.readFileSync(fullPath, "utf8");
      const frontmatter = parseFrontmatter(raw);
      const sourceRow =
        Number.parseInt(frontmatter.source_row || "", 10) ||
        Number.parseInt((file.match(/已发布-(\d+)/) || [])[1] || "", 10) ||
        0;
      return {
        slug: `qinggan-${String(sourceRow).padStart(3, "0")}`,
        title: frontmatter.title || file.replace(/\.md$/, ""),
        platform: frontmatter.platform || "",
        publishedUrl: frontmatter.published_url || "",
      };
    })
    .filter((item) => item.publishedUrl);
}

function decodeHtml(value) {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .replace(/\\&/g, "&")
    .replace(/^\/\//, "https://");
}

function normalizeUrl(value) {
  let next = decodeHtml(value).trim().replace(/^['"]|['"]$/g, "");
  if (next.startsWith("http://")) next = `https://${next.slice("http://".length)}`;
  return next;
}

function extractImageUrls(html, article) {
  const urls = new Set();
  const patterns = [
    /(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)/gi,
    /content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/gi,
    /data-src=["']([^"']+)["']/gi,
    /cdn_url:\s*["']([^"']+)["']/gi,
    /msg_cdn_url\s*=\s*["']([^"']+)["']/gi,
    /(https?:\/\/[^"'<>\\\s]+(?:sns-webpic|mmbiz|mmecoa|qpic)[^"'<>\\\s]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html))) {
      urls.add(normalizeUrl(match[1]));
    }
  }

  return [...urls].filter((url) => shouldKeepImage(url, article)).slice(0, 9);
}

function shouldKeepImage(url, article) {
  if (!/^https?:\/\//.test(url)) return false;
  if (/\.(svg|ico)(?:$|\?)/i.test(url)) return false;
  if (/pic_blank\.gif|blank\.gif/i.test(url)) return false;
  if (/qlogo|avatar|beian|fe-static|fe-platform|picasso-static|w3\.org/i.test(url)) {
    return false;
  }
  if (/xiaohongshu|xhs/i.test(article.platform)) {
    return /sns-webpic/i.test(url);
  }
  if (/公众号|服务号|微信/i.test(article.platform)) {
    return /(?:mmbiz|mmecoa|qpic)/i.test(url);
  }
  return /(?:sns-webpic|mmbiz|mmecoa|qpic)/i.test(url);
}

function extensionFromType(contentType, url) {
  if (/png/i.test(contentType) || /wx_fmt=png/i.test(url)) return "png";
  if (/webp/i.test(contentType) || /wx_fmt=webp/i.test(url)) return "webp";
  return "jpg";
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function downloadImage(url, article, index) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      Referer: article.publishedUrl,
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const contentType = response.headers.get("content-type") || "";
  if (!/^image\//i.test(contentType)) throw new Error(`not image: ${contentType}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024) throw new Error(`too small: ${bytes.length}`);
  const ext = extensionFromType(contentType, url);
  const filename = `${article.slug}-${String(index + 1).padStart(2, "0")}.${ext}`;
  fs.writeFileSync(path.join(OUT_DIR, filename), bytes);
  return {
    src: `/assets/blog-media/${filename}`,
    originalUrl: url,
    bytes: bytes.length,
  };
}

const existing = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
  : {};
const manifest = { ...existing };
const articles = readArticles();

for (const article of articles) {
  try {
    const html = await fetchText(article.publishedUrl);
    const urls = extractImageUrls(html, article);
    if (!urls.length) {
      console.log(`${article.slug}: no image candidates`);
      continue;
    }

    const media = [];
    for (let index = 0; index < urls.length; index += 1) {
      try {
        media.push(await downloadImage(urls[index], article, index));
      } catch (error) {
        console.log(`${article.slug}: image ${index + 1} failed: ${error.message}`);
      }
    }

    if (media.length) {
      manifest[article.slug] = media.map((item, index) => ({
        src: item.src,
        originalUrl: item.originalUrl,
        alt: `${article.title} 配图 ${index + 1}`,
        source: "feishu-row-original-url",
      }));
      console.log(`${article.slug}: saved ${media.length} image(s)`);
      fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
    }
  } catch (error) {
    console.log(`${article.slug}: page failed: ${error.message}`);
  }
}

fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
