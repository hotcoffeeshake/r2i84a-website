// 生成 quiz-guide.html：公众号回复「速查」后给的资料页（10 题完整解析 + 高频聊天场景速查）。
// 题目与解析从 assets/chat-quiz.js 读取，只在那里改；本页 noindex，不进 sitemap。
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(ROOT, "assets/chat-quiz.js"), "utf8");
const m = src.match(/var QUESTIONS = (\[[\s\S]*?\n  \]);/);
if (!m) throw new Error("chat-quiz.js 里找不到 QUESTIONS");
const QUESTIONS = vm.runInNewContext(m[1]);
const KEYS = ["A", "B", "C", "D"];

// 她这样说，你该怎么接（按课程原话整理）
const QUICKREF = [
  ["刚加上只回 hi、OK，要不要继续发", "不用，放着。强行接话只会把新鲜感磨没，所以认识的人要多。"],
  ["她才认识几天就喊「哥哥」", "先别上头。前期对你主动，是想让你后面对她产生依赖；她也许跟很多人都这么聊。"],
  ["她问「你这么好怎么还单身」", "提前备好一段经历：被朋友骗过、上两任也是，所以更想在网上把人了解清楚再见面。"],
  ["她问「我们现在算什么关系」", "不正面答，反着问：「你觉得咱俩都这么相处了，你还问我什么关系，你有尊重过我吗？」"],
  ["聊得不错，能不能直接约", "没情感连接直接约，风险很高。先聊到称呼都变了再约。"],
  ["线上老聊日常，越聊越干", "立差异感，别聊纯日常。把自己做成一个 IP：职业 + 反着来的作息 + 自律。"],
  ["她问你做什么工作", "等她来问，别主动推销自己。说的时候往上提一点，最好落在她熟悉的行业上。"],
  ["她问「这边怎么样」「你咋这么专业」", "都从第三方的事物引回你和她：「跟这个人待一块，舒服在哪都一样」「因为我要见你」。"],
  ["她问「什么样的相处方式最好」这种三观题", "车轱辘话要会说：舒服、能让对方成长，外表只是敲门砖。说完接一个具体的故事。"],
  ["怎么提出打电话", "她秒回、回得多的时候问一句「你旁边有人吗」，没人就直接打过去。"],
  ["她回复变慢了", "回复变慢和你聊错了是一个问题。想拉回来，就找出具体是哪一步出的问题；不想就换人。"],
  ["她说「你还是去找下一个吧」", "回「OK」就行，不解释、不道歉。字越少，她想得越多。"],
  ["她借聊天让你帮她干活", "「要咨询的话额外预约时间，我生活号一般不聊工作。」"],
  ["她介意你的工作、跟别人打电话", "引出第三者：「领导安排的，我也是打工的。」"],
  ["约她被推「下次吧」", "回一句「行，你忙你的」，别追问哪天有空。先把线上聊透，下次约晚上、约轻松的地方。"],
  ["她出门前说「我 12 点要撤」", "「嗯，那改日吧。」她问为啥：「还没开始你就说撤，整得像我影响你上班了。」然后马上打电话拉回来。"],
  ["约好了被鸽", "约好了也要做好被鸽的准备。她不出来，可能只是当时没那个窗口。"],
  ["见完一次怎么约第二次", "趁热打铁，第二天就约。隔两三天再约就难了。"],
  ["朋友圈怎么发", "三件事：长相、生活爱好、价值观。置顶最重要，一周发 1～3 条。"],
  ["线上照片要不要很真实", "线上看展示面，线下看状态。照片可以修，但别太假，不然见面交付不了。"],
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const qs = QUESTIONS.map((q, i) => `
        <li class="item">
          <p class="tag">第 ${i + 1} 题 · ${esc(q.tag)}</p>
          <p class="q">${esc(q.stem)}</p>
          <ol class="opts">${q.options.map((o, j) => `<li${j === q.answer ? ' class="ok"' : ""}><b>${KEYS[j]}</b>${esc(o)}</li>`).join("")}</ol>
          <p class="why"><b>答案 ${KEYS[q.answer]}</b>${esc(q.why)}</p>
        </li>`).join("");

const refs = QUICKREF.map(([t, a]) => `
          <li><p class="t">${esc(t)}</p><p>${esc(a)}</p></li>`).join("");

const html = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>聊天反应测试：完整解析与场景速查 | 情商练习有事问AI</title>
    <meta name="description" content="聊天反应测试 10 题的完整解析和更好的回法，以及一份高频聊天场景速查。" />
    <meta name="robots" content="noindex, follow" />
    <meta name="theme-color" content="#0a0a0a" />
    <style>
      :root { --bg:#0a0a0a; --card:#141414; --card-2:#101010; --line:rgba(245,245,245,.12); --ink:#f5f5f5; --soft:rgba(245,245,245,.66); --gold:#f5b347; }
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; background: var(--bg); color: var(--ink); font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.75; -webkit-font-smoothing: antialiased; }
      a { color: inherit; }
      .wrap { width: min(820px, 100%); margin: 0 auto; padding: 0 16px; }
      header { padding: 36px 0 8px; }
      .kicker { display: inline-block; margin: 0 0 12px; padding: 2px 10px; border: 1px solid rgba(245,179,71,.5); border-radius: 6px; color: var(--gold); font-size: .8rem; font-weight: 700; }
      h1, h2 { font-family: "Noto Serif SC","Songti SC",serif; line-height: 1.3; }
      h1 { margin: 0 0 10px; font-size: clamp(1.7rem, 5.5vw, 2.4rem); }
      h2 { margin: 44px 0 14px; font-size: 1.4rem; }
      .lead { margin: 0; color: var(--soft); }
      .toc { display: flex; flex-wrap: wrap; gap: 10px; margin: 18px 0 0; }
      .toc a { padding: 6px 14px; border: 1px solid var(--line); border-radius: 999px; text-decoration: none; font-size: .9rem; color: var(--soft); }
      .toc a:hover { color: var(--gold); border-color: var(--gold); }
      ol.list, ul.ref { margin: 0; padding: 0; list-style: none; display: grid; gap: 12px; }
      .item { padding: 18px; border: 1px solid var(--line); border-radius: 14px; background: var(--card); }
      .tag { margin: 0 0 6px; color: var(--gold); font-size: .82rem; font-weight: 700; }
      .q { margin: 0 0 10px; font-weight: 600; }
      .opts { margin: 0 0 12px; padding: 0; list-style: none; display: grid; gap: 6px; }
      .opts li { display: flex; gap: 10px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 10px; color: var(--soft); font-size: .94rem; }
      .opts li b { color: var(--soft); }
      .opts li.ok { border-color: rgba(245,179,71,.6); background: rgba(245,179,71,.08); color: var(--ink); }
      .opts li.ok b { color: var(--gold); }
      .why { margin: 0; padding: 12px 14px; border-radius: 10px; background: var(--card-2); color: var(--soft); font-size: .95rem; }
      .why b { display: block; color: var(--gold); margin-bottom: 2px; }
      ul.ref li { padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--card-2); }
      ul.ref p { margin: 0; color: var(--soft); font-size: .95rem; }
      ul.ref p.t { margin-bottom: 4px; color: var(--ink); font-weight: 600; }
      .end { margin: 44px 0 0; padding: 24px 20px; border: 1px solid rgba(245,179,71,.4); border-radius: 16px; text-align: center; }
      .end p { margin: 0 0 14px; color: var(--soft); }
      .btn { display: inline-flex; align-items: center; min-height: 44px; padding: 0 22px; border-radius: 999px; background: var(--gold); color: #0a0a0a; font-weight: 700; text-decoration: none; }
      footer { margin-top: 48px; padding: 22px 0 36px; border-top: 1px solid var(--line); color: var(--soft); font-size: .85rem; }
    </style>
  </head>
  <body>
    <main class="wrap">
      <header>
        <p class="kicker">公众号「速查」资料</p>
        <h1>聊天反应测试：完整解析与场景速查</h1>
        <p class="lead">10 题的标准答案和为什么这么回，后面附一份高频聊天场景速查。收藏这页，遇到了直接翻。</p>
        <nav class="toc" aria-label="目录"><a href="#answers">10 题完整解析</a><a href="#quickref">高频场景速查</a><a href="/quiz">再测一次</a></nav>
      </header>
      <section id="answers">
        <h2>10 题完整解析</h2>
        <ol class="list">${qs}
        </ol>
      </section>
      <section id="quickref">
        <h2>高频场景速查：她这样说，你该怎么接</h2>
        <ul class="ref">${refs}
        </ul>
      </section>
      <div class="end">
        <p>道理都懂，具体到你手上这段聊天怎么回？</p>
        <a class="btn" href="/">去问 AI</a>
      </div>
    </main>
    <footer><div class="wrap">情商练习有事问AI · r2i84a.chat</div></footer>
  </body>
</html>
`;

fs.writeFileSync(path.join(ROOT, "quiz-guide.html"), html);
console.log(`quiz-guide.html：${QUESTIONS.length} 题，${QUICKREF.length} 条速查`);
