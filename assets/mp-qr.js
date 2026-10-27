// 「立即体验」/「立即咨询」入口：点链接原地弹二维码，不跳页面。
// - 小程序码：href="#mp-qr"（首页打包代码里还是 /experience，一并拦截）
// - 助理微信：href="#consult-qr"
// 网址带 #mp-qr / #consult-qr 打开时也会自动弹出。样式照文章页定稿的 .qr-card。
(function () {
  var KINDS = {
    "mp-qr": {
      title: "微信扫码，免费体验",
      text: "打开「情商练习有事问AI」小程序，上传聊天截图，AI 帮你判断她的意思、给出下一句。",
      img: "/assets/mp-qrcode.jpg",
      alt: "情商练习有事问AI 小程序码",
      track: ["miniprogram", "qr_open"]
    },
    "consult-qr": {
      title: "加助理微信，立即咨询",
      text: "先语音聊几分钟，看看研学营和 30 天陪跑哪个适合你。",
      img: "/assets/assistant-wechat.png",
      alt: "小腾哥助理微信二维码",
      track: ["course", "consult_open"]
    }
  };

  // 不依赖页面样式：颜色写死，任何页面（含首页 React 部分）都能用
  var css =
    "#mpqr{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:20px;background:rgba(10,10,10,.6);opacity:0;transition:opacity .2s ease}" +
    "#mpqr.is-in{opacity:1}" +
    "#mpqr .qr-card{position:relative;width:min(100%,340px);padding:28px 24px 22px;border-radius:16px;background:#fff;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.6);transform:translateY(8px);transition:transform .2s ease;font-family:'Inter','PingFang SC','Microsoft YaHei',system-ui,sans-serif}" +
    "#mpqr.is-in .qr-card{transform:none}" +
    "#mpqr .qr-card h2{margin:0;font-family:'ChironSungHK','Noto Serif SC','Source Han Serif SC','Songti SC','STSong','PingFang SC','Microsoft YaHei',sans-serif;font-weight:700;font-size:21px;line-height:1.4;color:#1a1a1a}" +
    "#mpqr .qr-card p{margin:6px 0 0;font-size:14px;line-height:1.65;color:#6b6b6b}" +
    "#mpqr .qr-card img{display:block;width:220px;height:220px;margin:16px auto 4px;border-radius:12px;border:1px solid #e8e3d8}" +
    "#mpqr .qr-card .tip{margin-top:10px;padding:9px 12px;border-radius:10px;background:#faf8f3;font-size:13px;color:#6b6b6b}" +
    "#mpqr .qr-x{position:absolute;top:8px;right:10px;width:32px;height:32px;border:0;background:none;color:#6b6b6b;font-size:22px;line-height:1;cursor:pointer}";

  function open(kind) {
    var data = KINDS[kind] || KINDS["mp-qr"];
    if (document.getElementById("mpqr")) return;
    if (!document.getElementById("mpqr-style")) {
      var st = document.createElement("style");
      st.id = "mpqr-style";
      st.textContent = css;
      document.head.appendChild(st);
    }
    var last = document.activeElement;
    var wrap = document.createElement("div");
    wrap.id = "mpqr";
    wrap.innerHTML =
      '<div class="qr-card" role="dialog" aria-modal="true" aria-labelledby="mpqrTitle">' +
      '<button class="qr-x" type="button" aria-label="关闭">×</button>' +
      '<h2 id="mpqrTitle">' + data.title + "</h2>" +
      "<p>" + data.text + "</p>" +
      '<img src="' + data.img + '" width="220" height="220" alt="' + data.alt + '">' +
      '<div class="tip">手机上：长按保存或识别二维码</div>' +
      "</div>";
    document.body.appendChild(wrap);
    var prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (window.r2track) window.r2track(data.track[0], data.track[1], location.pathname);

    function close() {
      document.removeEventListener("keydown", onKey);
      wrap.classList.remove("is-in");
      setTimeout(function () { wrap.remove(); }, 200);
      document.body.style.overflow = prev;
      if (last && last.focus) last.focus({ preventScroll: true });
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    wrap.addEventListener("click", function (e) { if (e.target === wrap || e.target.closest(".qr-x")) close(); });
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(function () { wrap.classList.add("is-in"); wrap.querySelector(".qr-x").focus({ preventScroll: true }); });
  }

  window.MiniProgramQr = { open: open };
  window.ConsultQr = { open: function () { open("consult-qr"); } };

  // 捕获阶段拦截，先于首页 React 的路由处理
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href === "#mp-qr" || /^(https:\/\/r2i84a\.chat)?\/experience(\.html)?(?:[?#]|$)/.test(href)) {
      e.preventDefault();
      e.stopPropagation();
      open("mp-qr");
      return;
    }
    if (href === "#consult-qr") {
      e.preventDefault();
      e.stopPropagation();
      open("consult-qr");
    }
  }, true);

  function fromHash() {
    if (location.hash === "#mp-qr") open("mp-qr");
    else if (location.hash === "#consult-qr") open("consult-qr");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fromHash);
  else fromHash();
})();
