// 文章页交互：复制后的提示条、阅读进度线、手机底部行动条。
// 二维码弹窗由 mp-qr.js 负责。结构由 tools/article-shell.mjs 生成。
(function () {
  var toast = document.getElementById("toast");
  var toastTimer;

  // 1. 复制回复 → 按钮变「已复制」，底部提示条 3 秒后消失
  Array.prototype.forEach.call(document.querySelectorAll(".reply-head button"), function (button) {
    button.addEventListener("click", function () {
      var card = button.closest(".reply");
      var bubble = card && card.querySelector(".bubble");
      var text = bubble ? (bubble.textContent || "").trim() : "";
      if (!text) return;

      function done() {
        button.textContent = "已复制";
        if (toast) {
          toast.classList.add("on");
          clearTimeout(toastTimer);
          toastTimer = setTimeout(function () {
            toast.classList.remove("on");
            button.textContent = "复制";
          }, 3000);
        } else {
          setTimeout(function () { button.textContent = "复制"; }, 3000);
        }
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }

      function fallback() {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.top = "-9999px";
        document.body.appendChild(area);
        area.select();
        try { document.execCommand("copy"); } catch (e) {}
        area.remove();
        done();
      }
    });
  });

  // 2. 阅读进度线（页头下边沿）
  var progress = document.getElementById("progress");
  var bar = document.getElementById("bar");
  var inlineCta = document.querySelector(".inline-cta");
  var endCta = document.querySelector(".cta");
  var barClosed = false;

  if (bar) {
    var barX = document.getElementById("barX");
    if (barX) barX.addEventListener("click", function () { barClosed = true; bar.classList.remove("on"); });
  }

  function onScroll() {
    var doc = document.documentElement;
    var range = doc.scrollHeight - doc.clientHeight;
    if (progress && range > 0) progress.style.width = (Math.min(Math.max(doc.scrollTop / range, 0), 1) * 100) + "%";

    // 3. 底部行动条：滚过文中行动条后出现，到文末行动区时隐藏；手机上才显示
    if (!bar || !inlineCta) return;
    var afterInline = inlineCta.getBoundingClientRect().top < 0;
    var atEnd = endCta ? endCta.getBoundingClientRect().top < window.innerHeight : false;
    bar.classList.toggle("on", !barClosed && afterInline && !atEnd);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();
