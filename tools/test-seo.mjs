// 无依赖回归测试：仅在系统临时目录运行，不改工作区。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = process.cwd();
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'website-seo-test-'));
const read = (file) => fs.readFileSync(path.join(temp, file), 'utf8');
const write = (file, text) => fs.writeFileSync(path.join(temp, file), text);
const run = (ok = true) => {
  if (ok) {
    const build = spawnSync(process.execPath, ['tools/build-answer-pages.mjs'], { cwd: temp, encoding: 'utf8' });
    assert.equal(build.status, 0, build.stderr);
  }
  const result = spawnSync(process.execPath, ['tools/apply-seo.mjs'], { cwd: temp, encoding: 'utf8' });
  assert.equal(result.status === 0, ok, result.stderr || result.stdout);
  return result;
};
const snapshot = () => {
  const hash = createHash('sha256');
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else hash.update(path.relative(temp, file)).update(fs.readFileSync(file));
    }
  };
  visit(temp);
  return hash.digest('hex');
};
const countCards = () => (read('blog/index.html').match(/class="blog-list-item"/g) || []).length;
const learnSection = (id) => read('learn.html').match(new RegExp(`<h2[^>]*id="${id}"[^>]*>[\\s\\S]*?</section>`))[0];
try {
  for (const entry of fs.readdirSync(root)) {
    if (['tools', 'blog', 'answers'].includes(entry) || /\.(html|json|txt|xml)$/.test(entry)) {
      fs.cpSync(path.join(root, entry), path.join(temp, entry), { recursive: true });
    }
  }
  run();
  assert.equal(countCards(), 31);
  const first = snapshot(); run(); assert.equal(snapshot(), first, 'default build must be idempotent');
  const originalConfig = read('tools/seo-config.mjs');
  write('tools/seo-config.mjs', originalConfig.replace(/export const NOINDEX_POSTS = \[[\s\S]*?\];/, 'export const NOINDEX_POSTS = [];').replace('THIN_TEXT_LENGTH = 80', 'THIN_TEXT_LENGTH = 0'));
  run();
  assert.equal(countCards(), 66, 'removed noindex and thin filters restore all nonduplicates');
  assert.equal((learnSection('all-articles-title').match(/class="learn-row"/g) || []).length, 66);
  assert.match(read('blog/index.html'), /<strong>66<\/strong> 篇文章/);
  assert.match(read('sitemap.xml'), /\/blog\/qinggan-005</);
  assert.equal(JSON.parse(read('blog/index.html').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'].find(x => x['@type'] === 'ItemList').itemListElement.length, 66);
  write('tools/seo-config.mjs', originalConfig.replace('  "qinggan-005",', '  "qinggan-025",\n  "qinggan-005",'));
  run(); assert.doesNotMatch(learnSection('priority-title'), /qinggan-025/);
  write('tools/seo-config.mjs', originalConfig); run(); assert.match(learnSection('priority-title'), /qinggan-025/);
  const thinPath = 'blog/qinggan-001/index.html';
  const wasThin = read(thinPath); assert.match(wasThin, /noindex, follow/);
  write(thinPath, wasThin.replace('<div class="article-prose">', `<div class="article-prose"><p>${'补充具体聊天情境与处理建议。'.repeat(12)}</p>`));
  run(); assert.equal(countCards(), 32); assert.match(learnSection('all-articles-title'), /qinggan-001/);
  const firstSlug = 'why-guys-dont-know-what-to-say';
  const history = ['qinggan-002', firstSlug];
  write('tools/answer-pages-data.mjs', read('tools/answer-pages-data.mjs').replace(/\/blog\/[a-z0-9-]+/, `/blog/${firstSlug}`));
  for (const slug of ['chatting-guide-v2', 'chatting-guide-v3']) {
    const oldSlug = history.at(-1);
    write('tools/seo-config.mjs', read('tools/seo-config.mjs').replace(`slug: "${oldSlug}"`, `slug: "${slug}"`));
    write('migration-links.html', history.map(alias => `<a href="/blog/${alias}?from=test#tip">test</a>`).join('\n'));
    run();
    assert.ok(fs.existsSync(path.join(temp, 'blog', slug, 'index.html')));
    assert.ok(!fs.existsSync(path.join(temp, 'blog', oldSlug)));
    const redirects = JSON.parse(read('vercel.json')).redirects;
    for (const alias of history) {
      const redirect = redirects.find(r => r.source === `/blog/${alias}`);
      assert.equal(redirect.destination, `/blog/${slug}`);
      assert.equal(redirect.permanent, true);
    }
    assert.ok(!redirects.some(r => r.source === `/blog/${slug}`));
    assert.equal((read('migration-links.html').match(new RegExp(`/blog/${slug}\\?from=test#tip`, 'g')) || []).length, history.length);
    assert.match(read('sitemap.xml'), new RegExp(`/blog/${slug}<`));
    assert.ok(fs.readdirSync(path.join(temp, 'answers')).filter(f => f.endsWith('.html')).some(f => read(`answers/${f}`).includes(`href="/blog/${slug}"`)), 'answer generator resolves historical related links');
    history.push(slug);
    const built = snapshot(); run(); assert.equal(snapshot(), built, 'migration must be idempotent');
  }
  const stableConfig = read('tools/seo-config.mjs');
  write('tools/seo-config.mjs', stableConfig.replace('slug: "chat-opening-lines"', 'slug: "chatting-guide-v3"'));
  let before = snapshot(); assert.match(run(false).stderr, /Slug conflict|Ambiguous/); assert.equal(snapshot(), before, 'collision must not mutate files');
  write('tools/seo-config.mjs', stableConfig);
  const stableDeployment = read('vercel.json');
  const conflictConfig = JSON.parse(stableDeployment);
  conflictConfig.redirects.push({source:'/blog/qinggan-002', destination:'/blog/chat-opening-lines', permanent:true});
  write('vercel.json', JSON.stringify(conflictConfig));
  before = snapshot(); assert.match(run(false).stderr, /Conflicting redirect source/); assert.equal(snapshot(), before);
  write('vercel.json', stableDeployment);
  fs.cpSync(path.join(temp, 'blog/chatting-guide-v3'), path.join(temp, 'blog/qinggan-002'), { recursive: true });
  write('blog/qinggan-002/index.html', read('blog/qinggan-002/index.html').replace('<h1>', '<h1>最新导入内容：'));
  before = snapshot(); assert.match(run(false).stderr, /Ambiguous/); assert.equal(snapshot(), before, 'regenerated originals must not be silently discarded');
  console.log('PASS: 默认幂等、66篇恢复、精选恢复、正文增厚恢复、二/三次迁移及历史直达、链接更新、迁移幂等、冲突与双目录零写入失败。');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
