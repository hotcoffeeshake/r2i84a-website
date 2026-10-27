// IndexNow 推送：把网址通知给必应、Yandex 等搜索引擎。无依赖。
// 用法：
//   node tools/indexnow-submit.mjs                 推送 sitemap.xml 里的全部网址
//   node tools/indexnow-submit.mjs /blog/a /answers/b   只推送指定网址（新页上线后用）
//   加 --dry-run 只打印，不发送
import fs from 'node:fs';
import { SITE_URL } from './seo-config.mjs';

const KEY = 'b41d19f45715d21028aa0d44466c5955'; // 对应根目录的 b41d19f45715d21028aa0d44466c5955.txt，两处必须一致
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const paths = args.filter((a) => !a.startsWith('--'));

const urls = paths.length
  ? paths.map((p) => new URL(p, SITE_URL).href)
  : [...fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

if (!urls.length) throw new Error('没有可推送的网址');
console.log(`共 ${urls.length} 个网址`);
if (dryRun) {
  console.log(urls.join('\n'));
  process.exit(0);
}

// 线上 key 文件不对时，IndexNow 会拒绝整批请求，先自查。
const live = await fetch(KEY_LOCATION).then((r) => (r.ok ? r.text() : ''));
if (live.trim() !== KEY) throw new Error(`线上 key 文件不可用：${KEY_LOCATION}（先部署再推送）`);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE_URL).host, key: KEY, keyLocation: KEY_LOCATION, urlList: urls.slice(0, 10000) }),
});
console.log(`IndexNow 返回 ${res.status}`, await res.text());
// 200/202 为已接收；403 为 key 不匹配；422 为网址不属于本站。
if (![200, 202].includes(res.status)) process.exit(1);
