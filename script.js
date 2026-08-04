document.documentElement.classList.add("motion-ready");

const reveals = document.querySelectorAll(".reveal");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!reduceMotion.matches) {
  let scrollFrame = 0;

  const updateScrollProgress = () => {
    const scrollRange = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1
    );
    const progress = Math.min(Math.max(window.scrollY / scrollRange, 0), 1);
    document.documentElement.style.setProperty(
      "--scroll-progress",
      progress.toFixed(4)
    );
    scrollFrame = 0;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollProgress);
    },
    { passive: true }
  );
  updateScrollProgress();
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  reveals.forEach((section) => observer.observe(section));
} else {
  reveals.forEach((section) => section.classList.add("revealed"));
}

const copyQaText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea fallback for stricter browser permission states.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    textarea.remove();
  }
};

document.querySelectorAll(".qa-copy-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const targetId = button.getAttribute("data-copy-target");
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    const text = target.textContent ? target.textContent.trim() : "";
    if (!text) return;

    try {
      const copied = await copyQaText(text);
      if (!copied) throw new Error("copy failed");
      const oldText = button.textContent;
      button.textContent = "已复制";
      window.setTimeout(() => {
        button.textContent = oldText || "复制";
      }, 1600);
    } catch {
      button.textContent = "复制失败";
      window.setTimeout(() => {
        button.textContent = "复制";
      }, 1600);
    }
  });
});

document.querySelectorAll(".qa-faq-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
  });
});

const qaSections = Array.from(document.querySelectorAll(".qa-section[id]"));
const qaTocLinks = Array.from(document.querySelectorAll(".qa-toc a[href^='#']"));

if (qaSections.length && qaTocLinks.length && "IntersectionObserver" in window) {
  const tocObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      const activeId = visible.target.id;
      qaTocLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
      });
    },
    { rootMargin: "-18% 0px -62% 0px", threshold: [0.08, 0.2, 0.5] }
  );

  qaSections.forEach((section) => tocObserver.observe(section));
}
