// 站点统计：百度统计页面访问 + 关键动作事件。
// BAIDU_ID 为空时不加载百度统计，事件只打印到控制台；网址带 ?debug_track=1 时也会打印。
// 其他脚本用 window.r2track && window.r2track(分类, 动作, 标签, 数值) 记事件。
(function () {
  var BAIDU_ID = "1f57d5916cf5fdec68997d4a22212bfa"; // 百度统计后台「代码获取」里 hm.js? 后面的 32 位字符
  var hmt = (window._hmt = window._hmt || []);
  var debug = !BAIDU_ID || /[?&]debug_track=1/.test(location.search);

  if (BAIDU_ID) {
    var hm = document.createElement("script");
    hm.async = true;
    hm.src = "https://hm.baidu.com/hm.js?" + BAIDU_ID;
    document.head.appendChild(hm);
  }

  function track(category, action, label, value) {
    var ev = ["_trackEvent", category, action, label || location.pathname];
    if (typeof value === "number") ev.push(value);
    hmt.push(ev);
    if (debug && window.console) console.info("[track]", ev.slice(1).join(" | "));
  }
  window.r2track = track;

  function text(el) {
    return (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 20);
  }

  // 点击：复制回复、进小程序、看价格、进测验
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("a,button");
    if (!t) return;
    if (t.matches(".qa-copy-button")) return track("answer", "copy_reply", location.pathname + "#" + (t.getAttribute("data-copy-target") || ""));
    var href = t.getAttribute("href") || "";
    if (/\/experience(\.html)?(?:[?#]|$)/.test(href)) return track("miniprogram", "cta_click", location.pathname + " | " + text(t));
    if (/#pricing$/.test(href)) return track("purchase", "pricing_click", location.pathname);
    if (/\/quiz(\.html)?(?:[?#]|$)/.test(href)) return track("quiz", "entry_click", location.pathname);
    if (/\/course(\.html)?(?:[?#]|$)/.test(href)) return track("course", "entry_click", location.pathname);
    if (/space\.bilibili\.com/.test(href)) return track("course", "bilibili_click", location.pathname);
    if (/bilibili\.com\/video\//.test(href)) return track("course", "video_click", location.pathname);
  }, true);

  // 二维码出现在屏幕上：订阅号码、小程序码，每页每种只记一次
  var QR = [
    { match: "wechat-subscription-follow", action: "subscription_qr_view" },
    { match: "mp-qrcode", action: "miniprogram_qr_view" },
    { match: "assistant-wechat", action: "assistant_qr_view" },
  ];
  var seen = {};
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      var a = en.target.getAttribute("data-r2qr");
      if (seen[a]) return;
      seen[a] = true;
      track("qr", a, location.pathname);
    });
  }, { threshold: 0.5 }) : null;

  function watch(root) {
    if (!io || !root.querySelectorAll) return;
    var imgs = root.tagName === "IMG" ? [root] : root.querySelectorAll("img");
    Array.prototype.forEach.call(imgs, function (img) {
      if (img.hasAttribute("data-r2qr")) return;
      var src = img.getAttribute("src") || "";
      for (var i = 0; i < QR.length; i++) {
        if (src.indexOf(QR[i].match) !== -1) {
          img.setAttribute("data-r2qr", QR[i].action);
          io.observe(img);
          return;
        }
      }
    });
  }

  function start() {
    watch(document.body);
    // 测验结果页、购买弹窗里的二维码是后插入的
    if ("MutationObserver" in window) {
      new MutationObserver(function (list) {
        list.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) watch(n); }); });
      }).observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
