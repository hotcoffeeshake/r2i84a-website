// 「体验」入口：点任何指向 /experience 的链接，弹出小程序二维码，不再跳转体验页。
// 页面里的体验链接都是 href="#mp-qr"；首页打包代码里还是 /experience，一并拦截。网址带 #mp-qr 打开时也会自动弹出。
(function () {
  var QR = "/assets/mp-qrcode.jpg";
  var NAME = "情商练习有事问AI";

  var css =
    "#mpqr{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:20px;background:rgba(15,15,25,.55);opacity:0;transition:opacity .2s ease}" +
    "#mpqr.is-in{opacity:1}" +
    "#mpqr .mpqr-card{position:relative;width:min(100%,340px);padding:28px 24px 22px;border-radius:18px;background:#fff;color:#1a1a2e;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.3);font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;transform:translateY(8px);transition:transform .2s ease}" +
    "#mpqr.is-in .mpqr-card{transform:none}" +
    "#mpqr .mpqr-x{position:absolute;top:8px;right:10px;width:32px;height:32px;border:0;background:none;color:#8a8f9c;font-size:22px;line-height:1;cursor:pointer}" +
    "#mpqr h2{margin:0;font-size:19px;line-height:1.4}" +
    "#mpqr p{margin:6px 0 0;color:#5b6170;font-size:14px;line-height:1.65}" +
    "#mpqr img{display:block;width:220px;height:220px;margin:16px auto 6px;border-radius:12px;border:1px solid #eceef2}" +
    "#mpqr .mpqr-tip{margin-top:10px;padding:10px 12px;border-radius:10px;background:#f6f7f9;font-size:13px;color:#5b6170}";

  function open() {
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
      '<div class="mpqr-card" role="dialog" aria-modal="true" aria-labelledby="mpqrTitle">' +
      '<button class="mpqr-x" type="button" aria-label="关闭">×</button>' +
      '<h2 id="mpqrTitle">微信扫码，免费体验</h2>' +
      "<p>打开「" + NAME + "」小程序，上传聊天截图，AI 帮你判断她的意思、给出下一句。</p>" +
      '<img src="' + QR + '" width="220" height="220" alt="' + NAME + ' 小程序码">' +
      '<div class="mpqr-tip">手机上：长按识别二维码，或截图后用微信扫一扫 → 相册<br>也可以在微信里搜索「练爱导师」</div>' +
      "</div>";
    document.body.appendChild(wrap);
    var prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (window.r2track) window.r2track("miniprogram", "qr_open", location.pathname);

    function close() {
      document.removeEventListener("keydown", onKey);
      wrap.classList.remove("is-in");
      setTimeout(function () { wrap.remove(); }, 200);
      document.body.style.overflow = prev;
      if (last && last.focus) last.focus({ preventScroll: true });
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    wrap.addEventListener("click", function (e) { if (e.target === wrap || e.target.closest(".mpqr-x")) close(); });
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(function () { wrap.classList.add("is-in"); wrap.querySelector(".mpqr-x").focus({ preventScroll: true }); });
  }

  window.MiniProgramQr = { open: open };

  // 捕获阶段拦截，先于首页 React 的路由处理
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (!/^(https:\/\/r2i84a\.chat)?\/experience(\.html)?(?:[?#]|$)/.test(href) && href !== "#mp-qr") return;
    e.preventDefault();
    e.stopPropagation();
    open();
  }, true);

  function fromHash() { if (location.hash === "#mp-qr") open(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fromHash);
  else fromHash();
})();
