/*
 * 聊天反应测试：/quiz 页面与全站弹窗共用。
 * - 页面：<div id="cq-root"></div> + <script src="/assets/chat-quiz.js?v=…" data-mode="page"></script>
 * - 弹窗：<script src="/assets/chat-quiz.js?v=…" data-mode="popup" defer></script>
 * 题目与解析只改这里。
 */
(function () {
  "use strict";

  var QUESTIONS = [
    { tag: "刚加上", stem: "刚加上的女生，你发了句话，她回了个「hi」；你接着发，她又只回了个「OK」。你怎么做？",
      options: ["换个有趣的话题，表现诚意", "问她「是不是不想聊」", "发个表情包活跃一下气氛", "先放着，不发了"], answer: 3,
      why: "她回个 hi、OK，要么当下没社交欲望，要么不知道聊啥只能接。你硬接只会把那点新鲜感磨没。放着，去聊别的——这也是为什么要多认识人。" },
    { tag: "识别信号", stem: "刚认识三天，她就开始喊你「哥哥」，还说想听你的声音。这说明什么？",
      options: ["她喜欢上你了，赶紧约", "典型小绿茶：先别上头，她可能跟好几个人都这么聊", "她就是性格热情，正常聊就好", "她在试探你有没有对象"], answer: 1,
      why: "才几天，哥哥先喊上了，典型小绿茶。前期对你主动，是想让你后面对她产生依赖、慢慢陷进去。克制住，知道她也许会跟很多人都这么聊，别急着表白或送东西。" },
    { tag: "被问住", stem: "聊得不错，她突然问：「你条件这么好，怎么还单身？」你怎么回？",
      options: ["「大学时被身边很多朋友骗过，上两任也是，对现实里交朋友有点无力。所以现在更想在网上把一个人了解清楚了，再去见面。」", "「一直没遇到像你这样的」", "「眼光比较高吧」", "「缘分还没到吧」"], answer: 0,
      why: "这是个万能问题，提前备好一段话。讲一段经历，显得你对感情负责、不随便见面；后面还能顺着这段话，自然聊到你对一段关系的要求。「没遇到像你这样的」太急，「缘分没到」等于没回答。" },
    { tag: "约被推", stem: "聊了一周挺开心，你约她周六吃饭，她说「那天有事，下次吧」。你回？",
      options: ["「那你哪天有空？」", "「好吧，忙完记得找我哦」", "「行，你忙你的。」这周先不再约", "发一段话，说你很期待见她"], answer: 2,
      why: "追问哪天有空，等于把主动权交给她。纯吃饭本来就是性价比最低的约法，线上还没聊到位就约，被推很正常。回一句就行，先把线上聊透，下次约晚上、约更轻松的地方。" },
    { tag: "聊不下去", stem: "聊了半个月，每天都是「吃了吗」「下班了吗」，越聊越干。问题出在哪？",
      options: ["只聊日常，没让她看到你和别人有什么不一样", "你还不够关心她", "她对你没兴趣，直接换人", "聊得还不够多"], answer: 0,
      why: "聊日常一定升不了温，谁都会聊日常。线上聊天就一个要义：立出你的差异感——你的工作、作息、在坚持的事，要么聊的戳中她，要么让她主动来探索你。" },
    { tag: "被追问", stem: "你们已经很暧昧了，她突然问：「我们现在算什么关系？」你怎么回？",
      options: ["认真表白，给她安全感", "「你想是什么就是什么」", "「你觉得咱俩都这么相处了，你还问我什么关系，你有尊重过我吗？」", "「顺其自然，享受当下就好」"], answer: 2,
      why: "不正面回答，反着问，把问题抛回给她。别说「顺其自然、享受当下」——女生会觉得你更轻浮了，好像你在责怪她。" },
    { tag: "变冷了", stem: "她从秒回，变成隔几个小时才回一句。你该怎么办？",
      options: ["问她「我是不是哪里做错了」", "先别追，找出是哪一步出的问题；不想拉回来就换人", "连发几条找话题，把热度拉回来", "故意也晚点回她"], answer: 1,
      why: "回复变慢和你聊错了，不是两个问题，是一个问题。想拉回来还是拉倒，看你自己；想拉回来，就得找出具体是哪一步出的问题。追问、连发只会让她更想躲。" },
    { tag: "第一次约会", stem: "第一次约会，下面哪个最不建议？",
      options: ["晚上一起吃烧烤", "下午喝杯咖啡", "看电影", "找个小酒馆坐坐"], answer: 2,
      why: "电影院先避雷。线上没聊到很开的程度就约电影，两个小时啥也干不成，纯垃圾时间。约晚上，烧烤或者小酒馆。" },
    { tag: "见面前", stem: "约好今晚见，她出门前发：「我玩不了太晚哈，明天要上班，12 点左右撤。」你回？",
      options: ["「没事，几点都行」", "「好的，那我们早点开始」", "「12 点太早了吧，多玩会儿」", "「嗯，那改日吧。」"], answer: 3,
      why: "还没开始就先定撤退时间，你直接退一步：「那改日吧」。她问为啥，就说「你都还没开始就先说撤，整得好像我影响你明天上班了」。然后马上打个电话，把情绪拉回来——她反而会跟你玩得更久。" },
    { tag: "她想结束", stem: "刚认识两天，她发来一句：「你还是去找下一个吧。」你怎么回？",
      options: ["回一句「OK」，不解释", "道歉，问她怎么了", "发长消息，解释自己不是那种人", "「别这样，我是认真的」"], answer: 0,
      why: "她在钓你。很多人这时候就道歉、想弥补，那是上头了，她也知道你上头了。回个「OK」就行——你字越少，她想得越多；你解释越多，她后面就会跟你要更多。" }
  ];

  var KEYS = ["A", "B", "C", "D"];
  var FREE_WHY = 2;                 // 结果页免费展示几题解析
  var POPUP_DELAY_MS = 6000;        // 进入页面后几秒弹出
  var SNOOZE_DAYS = 3;              // 关掉弹窗后几天内不再弹
  var QR_SRC = "/assets/wechat-subscription-follow.jpg";
  var KEYWORD = "速查";
  var STORE_DONE = "cq_done";
  var STORE_SNOOZE = "cq_snooze_until";

  function store(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, String(val));
    } catch (e) { return null; }
  }

  var CSS = "" +
    ".cq{--cq-bg:#0a0a0a;--cq-card:#141414;--cq-line:rgba(245,245,245,.12);--cq-ink:#f5f5f5;--cq-soft:rgba(245,245,245,.66);--cq-gold:#f5b347;--cq-ok:#4ade80;--cq-no:#f87171;" +
      "color:var(--cq-ink);font-family:Inter,'PingFang SC','Microsoft YaHei',sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}" +
    ".cq *,.cq *::before,.cq *::after{box-sizing:border-box}" +
    ".cq-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:46px;padding:0 24px;border:0;border-radius:999px;background:var(--cq-gold);color:#0a0a0a;font:inherit;font-weight:700;font-size:1rem;cursor:pointer;transition:transform .15s,box-shadow .15s}" +
    ".cq-btn:hover{transform:translateY(-1px);box-shadow:0 10px 30px rgba(245,179,71,.3)}" +
    ".cq-btn:focus-visible,.cq-opt:focus-visible,.cq-x:focus-visible,.cq-link:focus-visible{outline:2px solid var(--cq-gold);outline-offset:3px}" +
    ".cq-btn--ghost{background:transparent;color:var(--cq-ink);border:1px solid var(--cq-line)}" +
    ".cq-btn--ghost:hover{box-shadow:none;border-color:var(--cq-gold)}" +
    ".cq-link{background:none;border:0;padding:0;color:var(--cq-soft);font:inherit;font-size:.9rem;text-decoration:underline;text-underline-offset:3px;cursor:pointer}" +
    ".cq-kicker{display:inline-block;margin:0 0 10px;padding:2px 10px;border:1px solid rgba(245,179,71,.5);border-radius:6px;color:var(--cq-gold);font-size:.78rem;font-weight:700;letter-spacing:.04em}" +
    ".cq-title{margin:0 0 8px;font-family:'ChironSungHK','Noto Serif SC','Songti SC',serif;font-size:1.6rem;line-height:1.35;font-weight:700}" +
    ".cq-sub{margin:0 0 18px;color:var(--cq-soft)}" +
    ".cq-meta{display:flex;flex-wrap:wrap;gap:8px 18px;margin:0 0 22px;padding:0;list-style:none;color:var(--cq-soft);font-size:.92rem}" +
    ".cq-meta li::before{content:'✓ ';color:var(--cq-gold);font-weight:700}" +
    ".cq-actions{display:flex;flex-wrap:wrap;align-items:center;gap:14px}" +
    ".cq-progress{display:flex;justify-content:space-between;margin-bottom:10px;font-size:.88rem;color:var(--cq-soft)}" +
    ".cq-bar{height:4px;border-radius:999px;background:var(--cq-line);overflow:hidden;margin-bottom:20px}" +
    ".cq-bar span{display:block;height:100%;background:var(--cq-gold);transition:width .3s ease}" +
    ".cq-tag{display:inline-block;margin-bottom:10px;padding:2px 10px;border-radius:999px;background:rgba(245,179,71,.14);color:var(--cq-gold);font-size:.78rem;font-weight:700}" +
    ".cq-stem{margin:0 0 18px;font-size:1.12rem;font-weight:600}" +
    ".cq-opts{display:grid;gap:10px;margin:0;padding:0;list-style:none}" +
    ".cq-opt{display:flex;gap:12px;align-items:flex-start;width:100%;padding:14px 16px;border:1px solid var(--cq-line);border-radius:12px;background:#101010;color:var(--cq-ink);font:inherit;font-size:1rem;line-height:1.6;text-align:left;cursor:pointer;transition:border-color .15s,background .15s}" +
    ".cq-opt:hover:not([disabled]){border-color:var(--cq-gold);background:rgba(245,179,71,.07)}" +
    ".cq-opt[disabled]{cursor:default}" +
    ".cq-key{flex:0 0 26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(245,245,245,.08);font-weight:700;font-size:.82rem;color:var(--cq-soft)}" +
    ".cq-opt.is-right{border-color:var(--cq-ok);background:rgba(74,222,128,.08)}.cq-opt.is-right .cq-key{background:var(--cq-ok);color:#0a0a0a}" +
    ".cq-opt.is-wrong{border-color:var(--cq-no);background:rgba(248,113,113,.08)}.cq-opt.is-wrong .cq-key{background:var(--cq-no);color:#0a0a0a}" +
    ".cq-verdict{margin:16px 0 0;font-weight:700}.cq-verdict.ok{color:var(--cq-ok)}.cq-verdict.no{color:var(--cq-no)}" +
    ".cq-next{margin-top:18px;display:flex;justify-content:flex-end}" +
    ".cq-score{text-align:center}.cq-score strong{display:block;font-size:3.2rem;line-height:1.1;color:var(--cq-gold);font-family:'Space Grotesk',Inter,sans-serif}.cq-score span{color:var(--cq-soft);font-size:.9rem}" +
    ".cq-tier{margin:12px 0 0;text-align:center;font-size:1.06rem;font-weight:700}" +
    ".cq-list{margin:20px 0 0;padding:0;list-style:none;display:grid;gap:8px}" +
    ".cq-item{border:1px solid var(--cq-line);border-radius:12px;padding:11px 14px;background:#101010}" +
    ".cq-item-head{display:flex;gap:10px;align-items:baseline;font-weight:600;font-size:.95rem}" +
    ".cq-mark{flex:0 0 auto;font-weight:800}.cq-mark.ok{color:var(--cq-ok)}.cq-mark.no{color:var(--cq-no)}" +
    ".cq-why{margin:8px 0 0;padding:10px 12px;border-radius:10px;background:rgba(245,179,71,.07);border-left:3px solid var(--cq-gold);color:var(--cq-soft);font-size:.93rem}.cq-why b{color:var(--cq-ink)}" +
    ".cq-locked{margin:6px 0 0;color:var(--cq-soft);font-size:.86rem}" +
    ".cq-lead{margin-top:22px;display:grid;grid-template-columns:150px 1fr;gap:18px;align-items:center;padding:18px;border-radius:14px;border:1px solid rgba(245,179,71,.4);background:linear-gradient(135deg,rgba(245,179,71,.12),rgba(245,179,71,.02))}" +
    ".cq-lead img{display:block;width:100%;height:auto;aspect-ratio:1/1;padding:8px;border-radius:10px;background:#fff}" +
    ".cq-lead h3{margin:0 0 6px;font-size:1.05rem;color:var(--cq-gold)}" +
    ".cq-lead p{margin:0 0 4px;color:var(--cq-soft);font-size:.93rem}" +
    ".cq-kw{display:inline-block;margin:0 3px;padding:0 8px;border-radius:6px;background:var(--cq-gold);color:#0a0a0a;font-weight:800}" +
    ".cq-lead ul{margin:6px 0 0;padding-left:1.1em;color:var(--cq-soft);font-size:.93rem}" +
    ".cq-mobile{display:none;font-size:.82rem}" +
    ".cq-again{margin-top:16px;display:flex;justify-content:center;gap:12px;flex-wrap:wrap}" +
    /* 弹窗 */
    ".cq-overlay{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.8);opacity:0;transition:opacity .25s ease}" +
    ".cq-overlay.is-in{opacity:1}" +
    ".cq-dialog{position:relative;width:min(560px,100%);max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);overflow-y:auto;padding:28px 24px 24px;border:1px solid var(--cq-line);border-radius:18px;background:var(--cq-card);box-shadow:0 24px 80px rgba(0,0,0,.6);transform:translateY(12px);transition:transform .25s cubic-bezier(.2,.8,.2,1);overscroll-behavior:contain}" +
    ".cq-overlay.is-in .cq-dialog{transform:none}" +
    ".cq-x{position:absolute;top:10px;right:12px;width:34px;height:34px;border:0;border-radius:50%;background:transparent;color:var(--cq-soft);font-size:22px;line-height:1;cursor:pointer}" +
    ".cq-x:hover{color:var(--cq-ink);background:rgba(245,245,245,.06)}" +
    "@media (max-width:600px){.cq-title{font-size:1.35rem}.cq-dialog{padding:24px 16px 18px}.cq-lead{grid-template-columns:1fr;text-align:center}.cq-lead img{max-width:200px;margin:0 auto}.cq-lead ul{text-align:left}.cq-mobile{display:block}}" +
    "@media (prefers-reduced-motion:reduce){.cq-overlay,.cq-dialog,.cq-bar span,.cq-btn{transition:none}}";

  function injectCss() {
    if (document.getElementById("cq-style")) return;
    var s = document.createElement("style");
    s.id = "cq-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function button(cls, text, onClick) {
    var b = el("button", cls, text);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  function tierText(s) {
    if (s <= 3) return "你的第一反应，大多正好是让她降温的那一个。";
    if (s <= 7) return "有感觉，但关键几步还在凭本能——而本能往往恰恰是错的。";
    return "底子不错，差的是一套稳定、可复用的打法。";
  }

  /* 在 root 里跑一轮测试。opts.compact：弹窗里用 */
  function Quiz(root, opts) {
    var picks = [], idx = 0;
    opts = opts || {};

    function scrollTop() {
      if (opts.onScrollTop) opts.onScrollTop();
    }

    function score() {
      var s = 0;
      picks.forEach(function (p, i) { if (p === QUESTIONS[i].answer) s += 1; });
      return s;
    }

    function intro() {
      root.innerHTML = "";
      root.appendChild(el("span", "cq-kicker", "聊天反应测试"));
      root.appendChild(el("h2", "cq-title", "10 个聊天场景，你能对几题？"));
      root.appendChild(el("p", "cq-sub", "她只回 OK、刚认识就喊哥哥、问你为什么还单身……凭第一反应选，大约 2 分钟。"));
      var meta = el("ul", "cq-meta");
      ["选完马上知道对错", "测完看你的聊天习惯", "免费领完整解析"].forEach(function (t) { meta.appendChild(el("li", null, t)); });
      root.appendChild(meta);
      var act = el("div", "cq-actions");
      var start = button("cq-btn", "开始测试 →", function () { idx = 0; picks = []; question(); });
      act.appendChild(start);
      if (opts.onLater) act.appendChild(button("cq-link", "以后再说", opts.onLater));
      root.appendChild(act);
      if (opts.focus) start.focus({ preventScroll: true });
    }

    function question() {
      var q = QUESTIONS[idx];
      root.innerHTML = "";
      var head = el("div", "cq-progress");
      head.appendChild(el("span", null, "第 " + (idx + 1) + " / " + QUESTIONS.length + " 题"));
      head.appendChild(el("span", null, "已答对 " + score()));
      root.appendChild(head);
      var bar = el("div", "cq-bar");
      var fill = el("span");
      fill.style.width = (idx / QUESTIONS.length * 100) + "%";
      bar.appendChild(fill);
      root.appendChild(bar);
      root.appendChild(el("span", "cq-tag", q.tag));
      root.appendChild(el("p", "cq-stem", q.stem));
      var list = el("ul", "cq-opts");
      var buttons = [];
      q.options.forEach(function (text, i) {
        var li = el("li");
        var b = el("button", "cq-opt");
        b.type = "button";
        b.appendChild(el("span", "cq-key", KEYS[i]));
        b.appendChild(el("span", null, text));
        b.addEventListener("click", function () { choose(i, buttons); });
        buttons.push(b);
        li.appendChild(b);
        list.appendChild(li);
      });
      root.appendChild(list);
      buttons[0].focus({ preventScroll: true });
    }

    function choose(i, buttons) {
      var q = QUESTIONS[idx];
      picks[idx] = i;
      buttons.forEach(function (b, j) {
        b.disabled = true;
        if (j === q.answer) b.classList.add("is-right");
        else if (j === i) b.classList.add("is-wrong");
      });
      var ok = i === q.answer;
      root.appendChild(el("p", "cq-verdict " + (ok ? "ok" : "no"), ok ? "✓ 选对了" : "✗ 不对，更好的选择是 " + KEYS[q.answer]));
      var last = idx === QUESTIONS.length - 1;
      var next = el("div", "cq-next");
      var btn = button("cq-btn", last ? "看我的结果 →" : "下一题 →", function () {
        idx += 1;
        if (last) result(); else question();
        scrollTop();
      });
      next.appendChild(btn);
      root.appendChild(next);
      btn.focus({ preventScroll: true });
    }

    function result() {
      var s = score();
      store(STORE_DONE, "1");
      root.innerHTML = "";
      var sc = el("div", "cq-score");
      sc.appendChild(el("strong", null, s + " / " + QUESTIONS.length));
      sc.appendChild(el("span", null, "你答对的题数"));
      root.appendChild(sc);
      root.appendChild(el("p", "cq-tier", tierText(s)));

      var wrong = [];
      QUESTIONS.forEach(function (q, i) { if (picks[i] !== q.answer) wrong.push(i); });
      var free = (wrong.length ? wrong : [0, 1]).slice(0, FREE_WHY);

      var list = el("ol", "cq-list");
      QUESTIONS.forEach(function (q, i) {
        var ok = picks[i] === q.answer;
        var li = el("li", "cq-item");
        var h = el("div", "cq-item-head");
        h.appendChild(el("span", "cq-mark " + (ok ? "ok" : "no"), ok ? "✓" : "✗"));
        h.appendChild(el("span", null, (i + 1) + ". " + q.tag + "：你选 " + KEYS[picks[i]] + "，更好的是 " + KEYS[q.answer]));
        li.appendChild(h);
        if (free.indexOf(i) !== -1) {
          var w = el("div", "cq-why");
          w.appendChild(el("b", null, "解析："));
          w.appendChild(document.createTextNode(q.why));
          li.appendChild(w);
        } else {
          li.appendChild(el("div", "cq-locked", "🔒 解析在资料里，扫下方二维码领取"));
        }
        list.appendChild(li);
      });

      var lead = el("div", "cq-lead");
      var img = el("img");
      img.src = QR_SRC;
      img.alt = "情商练习有事问AI 公众号二维码";
      img.width = 430; img.height = 430;
      img.loading = "lazy";
      lead.appendChild(img);
      var box = el("div");
      box.appendChild(el("h3", null, "免费领取：完整解析 + 高频场景速查"));
      var p = el("p");
      p.appendChild(document.createTextNode("微信扫码关注公众号，发送"));
      p.appendChild(el("span", "cq-kw", KEYWORD));
      p.appendChild(document.createTextNode("，自动发给你："));
      box.appendChild(p);
      var ul = el("ul");
      ["这 10 题的完整解析和更好的回法", "高频聊天场景速查：她这样说，你该怎么接"].forEach(function (t) { ul.appendChild(el("li", null, t)); });
      box.appendChild(ul);
      box.appendChild(el("p", "cq-mobile", "手机上：长按二维码识别，或截图后用微信扫一扫 → 相册"));
      lead.appendChild(box);
      // 领取入口放在得分下面，手机上不用滑到底才看到
      root.appendChild(lead);
      root.appendChild(list);

      var again = el("div", "cq-again");
      again.appendChild(button("cq-btn cq-btn--ghost", "再测一次", function () { idx = 0; picks = []; question(); scrollTop(); }));
      if (opts.onClose) again.appendChild(button("cq-btn cq-btn--ghost", "关闭", opts.onClose));
      root.appendChild(again);
    }

    intro();
  }

  /* ---------- 页面模式 ---------- */
  function mountPage() {
    var root = document.getElementById("cq-root");
    if (!root) return;
    root.classList.add("cq");
    Quiz(root, {
      onScrollTop: function () {
        var top = root.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: top, behavior: "smooth" });
      }
    });
    // 页面上的「开始测试」按钮滚到测试区
    document.querySelectorAll("[data-cq-start]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        root.scrollIntoView({ behavior: "smooth", block: "start" });
        var b = root.querySelector(".cq-btn");
        if (b) b.focus({ preventScroll: true });
      });
    });
  }

  /* ---------- 弹窗模式 ---------- */
  function shouldPopup() {
    if (store(STORE_DONE) === "1") return false;
    var until = parseInt(store(STORE_SNOOZE) || "0", 10);
    if (until && Date.now() < until) return false;
    return true;
  }

  function openPopup() {
    if (document.getElementById("cq-overlay")) return;
    var lastFocus = document.activeElement;
    var overlay = el("div", "cq cq-overlay");
    overlay.id = "cq-overlay";
    var dialog = el("div", "cq-dialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", "聊天反应测试");
    var x = button("cq-x", "×", function () { close(true); });
    x.setAttribute("aria-label", "关闭");
    var body = el("div");
    dialog.appendChild(x);
    dialog.appendChild(body);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // 弹窗打开时先藏起小程序浮窗，避免两个二维码同时出现
    var hidden = [];
    ["mpFloat", "mpBubble"].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) { hidden.push([n, n.style.visibility]); n.style.visibility = "hidden"; }
    });

    function close(snooze) {
      if (snooze && store(STORE_DONE) !== "1") store(STORE_SNOOZE, Date.now() + SNOOZE_DAYS * 864e5);
      document.removeEventListener("keydown", onKey);
      overlay.classList.remove("is-in");
      setTimeout(function () { overlay.remove(); }, 250);
      document.body.style.overflow = prevOverflow;
      hidden.forEach(function (h) { h[0].style.visibility = h[1]; });
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    function onKey(e) {
      if (e.key === "Escape") { close(true); return; }
      if (e.key === "Tab") {
        var f = dialog.querySelectorAll("button:not([disabled]),a[href]");
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(true); });

    Quiz(body, {
      focus: true,
      onLater: function () { close(true); },
      onClose: function () { close(false); },
      onScrollTop: function () { dialog.scrollTop = 0; }
    });
    requestAnimationFrame(function () { overlay.classList.add("is-in"); });
  }

  function schedulePopup() {
    if (!shouldPopup()) return;
    var timer = null;
    function arm() {
      if (timer || document.hidden) return;
      timer = setTimeout(function () {
        if (!document.hidden && shouldPopup()) openPopup();
      }, POPUP_DELAY_MS);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && timer) { clearTimeout(timer); timer = null; }
      else arm();
    });
    arm();
  }

  var me = document.currentScript;
  var mode = (me && me.getAttribute("data-mode")) || "popup";
  window.ChatQuiz = { open: function () { injectCss(); openPopup(); } };

  function start() {
    injectCss();
    if (mode === "page") mountPage(); else schedulePopup();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
