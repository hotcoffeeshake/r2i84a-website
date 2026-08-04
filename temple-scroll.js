/**
 * temple-scroll.js — 2-page scroll-driven frame-sequence player
 * Skill: scroll-frame-video-portfolio
 * v3: fix TDZ crash + smarter preloading for smoothness
 */

// ─── CONFIG ──────────────────────────────────────────────
const CONFIG = {
  framesPerSecond: 30,
  secondsPerPage: 5,
  totalFrames: 300,
  page1End: 150,
  page2Start: 151,
  frameVersion: 'jul27-v9',
  sensitivity: 0.08,
  maxFrameDeltaPerWheel: 5,
  lerpFactor: 0.22,             // 略降，滚动更丝滑
  transitionDuration: 520,
  sourceWidth: 1920,
  sourceHeight: 1080,
};

const NODES = [
  { id: 'page1', startFrame: 1, endFrame: 150 },
  { id: 'page2', startFrame: 151, endFrame: 300 },
];

// ─── STATE (必须在 resizeCanvas 之前声明，避免 TDZ 崩溃) ──
let state = 'page1-scrub';
let currentFrame = 1;
let targetFrame = 1;
let isTransitioning = false;

// 滚轮速度跟踪 — 用于自适应 lerp
let scrollVelocity = 0;
let lastWheelTime = 0;

// 鼠标视差 — 画面随鼠标微妙偏移，产生景深
let mouseX = 0, mouseY = 0;              // 目标值 -1~1
let smoothMouseX = 0, smoothMouseY = 0;  // 平滑值

const frameImages = new Array(CONFIG.totalFrames + 1);
let loadedCount = 0;
let failedCount = 0;
let allLoaded = false;
let firstFrameReady = false;

// ─── DOM ─────────────────────────────────────────────────
const canvas = document.getElementById('video-canvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');
const loaderProgress = document.getElementById('loader-progress');
const loaderStage = document.getElementById('loader-stage');
const loaderText = document.getElementById('loader-text');
const loaderHint = document.getElementById('loader-hint');
const loadChip = document.getElementById('load-chip');
const loadChipText = document.getElementById('load-chip-text');
const page1 = document.getElementById('page1');
const page2 = document.getElementById('page2');
const pageHeight = window.innerHeight;
const heroCenter = document.querySelector('.hero-center');
const navPanel = document.querySelector('.nav-panel');

document.body.style.height = `${pageHeight * 2}px`;
window.history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// ─── CANVAS ──────────────────────────────────────────────
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

const ratio = Math.max(1, window.devicePixelRatio || 1);
function resizeCanvas() {
  canvas.width = Math.round(window.innerWidth * ratio);
  canvas.height = Math.round(window.innerHeight * ratio);
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  if (firstFrameReady) render(currentFrame);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─── FRAME PATH ──────────────────────────────────────────
function framePath(n) {
  return `frames-webp/frame_${String(n).padStart(4, '0')}.webp?v=${CONFIG.frameVersion}`;
}

// ─── LOADING ─────────────────────────────────────────────
function setStage(stage, hint) {
  if (loaderStage) loaderStage.textContent = stage;
  if (loaderHint) loaderHint.textContent = hint || '';
  console.log(`[loader] ${stage}${hint ? ' — ' + hint : ''}`);
}

function updateLoader() {
  const pct = (loadedCount / CONFIG.totalFrames) * 100;
  if (loaderProgress) loaderProgress.style.width = `${pct.toFixed(1)}%`;
  const countText = `${loadedCount}/${CONFIG.totalFrames}`;
  if (loaderText) loaderText.textContent = `${loadedCount} / ${CONFIG.totalFrames}${failedCount > 0 ? '  (' + failedCount + ' failed)' : ''}`;
  if (loadChipText) loadChipText.textContent = countText;
}

function loadOneFrame(i) {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      if (ok && img.naturalWidth > 0) {
        frameImages[i] = img;
        loadedCount++;
      } else {
        failedCount++;
      }
      updateLoader();
      resolve();
    };
    img.onload = () => done(true);
    img.onerror = () => { console.warn(`[loader] frame ${i} FAILED`); done(false); };
    img.src = framePath(i);
  });
}

function loadFrames() {
  setStage('LOADING FIRST FRAME', 'fetching frame 1…');
  updateLoader(); // 立即显示 0/300

  // 超时看门狗：8 秒后首帧仍未就绪 → 强制进入
  const watchdog = setTimeout(() => {
    if (!firstFrameReady) {
      console.error('[loader] WATCHDOG: first frame timeout, forcing enter');
      setStage('TIMEOUT — FORCING ENTER', 'frames loading in background');
      enterScene();
    }
  }, 8000);

  loadOneFrame(1).then(() => {
    clearTimeout(watchdog);
    if (firstFrameReady) return;
    enterScene();
  });
}

function enterScene() {
  if (firstFrameReady) return;
  firstFrameReady = true;
  setStage('ENTERING', 'background loading continues…');
  loader.classList.add('hidden');
  loadChip.classList.add('visible');
  render(currentFrame);
  loop();
  // 后台加载剩余帧 — 智能策略：先加载 page1 前段，再 page2 前段，再补全
  loadRemainingSmart();
}

/**
 * 智能预加载：优先加载用户可能马上滚到的帧
 * 1. page1 前段 (2-30) — 用户一进来就会滚
 * 2. page2 前段 (151-180) — 翻页后马上需要
 * 3. 其余帧按顺序补全
 */
function loadRemainingSmart() {
  const t0 = performance.now();
  const batchSize = 15; // 小批次，进度更新更频繁

  // 优先队列：page1前段 → page2前段 → page1剩余 → page2剩余
  const queue = [];
  for (let i = 2; i <= 30; i++) queue.push(i);        // page1 前 30 帧
  for (let i = 151; i <= 180; i++) queue.push(i);     // page2 前 30 帧
  for (let i = 31; i <= 150; i++) queue.push(i);      // page1 剩余
  for (let i = 181; i <= 300; i++) queue.push(i);     // page2 剩余

  const totalBatches = Math.ceil(queue.length / batchSize);
  let batchIdx = 0;

  function loadNextBatch() {
    if (queue.length === 0) {
      allLoaded = true;
      setStage('READY', `${loadedCount} frames in ${((performance.now() - t0) / 1000).toFixed(1)}s`);
      console.log(`[loader] ALL DONE — ${loadedCount} loaded, ${failedCount} failed`);
      loadChip.classList.add('done');
      return;
    }
    batchIdx++;
    const batch = queue.splice(0, batchSize);
    const last = batch[batch.length - 1];
    setStage(`BATCH ${batchIdx}/${totalBatches}`, `frames near ${last}`);
    Promise.all(batch.map(loadOneFrame)).then(() => {
      // 用 requestIdleCallback 让出主线程，避免卡顿
      if (window.requestIdleCallback) {
        requestIdleCallback(() => loadNextBatch());
      } else {
        setTimeout(loadNextBatch, 0);
      }
    });
  }
  loadNextBatch();
}

// ─── RENDER ──────────────────────────────────────────────
function render(frameIndex) {
  const targetIdx = Math.round(frameIndex);
  let img = frameImages[targetIdx];
  // 目标帧未加载 → 找最近的已加载帧
  if (!img || !img.complete || img.naturalWidth === 0) {
    for (let d = 1; d < 30; d++) {
      const prev = frameImages[targetIdx - d];
      const next = frameImages[targetIdx + d];
      if (prev && prev.complete && prev.naturalWidth > 0) { img = prev; break; }
      if (next && next.complete && next.naturalWidth > 0) { img = next; break; }
    }
    if (!img || !img.complete || img.naturalWidth === 0) return;
  }

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // Overscan: 多画 8px 边距，鼠标视差偏移时不露黑边
  const overscan = 8 * ratio;
  const scale = Math.max((cw + overscan * 2) / iw, (ch + overscan * 2) / ih);
  const dw = Math.round(iw * scale);
  const dh = Math.round(ih * scale);
  // 鼠标视差：画面跟随鼠标偏移 5px
  const px = smoothMouseX * 5 * ratio;
  const py = smoothMouseY * 5 * ratio;
  const dx = Math.round((cw - dw) / 2 + px);
  const dy = Math.round((ch - dh) / 2 + py);

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

// ─── STATE MACHINE ───────────────────────────────────────
function clampFrame(frame, min, max) {
  return Math.max(min, Math.min(max, frame));
}

function onWheel(e) {
  e.preventDefault();
  if (!firstFrameReady || isTransitioning) return;

  const dir = Math.sign(e.deltaY);
  const absDelta = Math.abs(e.deltaY);
  const frameDelta = Math.min(absDelta * CONFIG.sensitivity, CONFIG.maxFrameDeltaPerWheel);

  // 跟踪滚轮速度 — 快滚时 lerp 加大产生"冲过去再缓下来"的惯性
  const now = performance.now();
  const dt = now - lastWheelTime;
  if (dt < 250) {
    const instantVel = frameDelta / Math.max(dt, 16);
    scrollVelocity = scrollVelocity * 0.6 + instantVel * 0.4;
  } else {
    scrollVelocity = 0;
  }
  lastWheelTime = now;

  if (state === 'page1-scrub') {
    const prevTarget = targetFrame;
    targetFrame = clampFrame(targetFrame + dir * frameDelta, 1, CONFIG.page1End);
    if (prevTarget >= CONFIG.page1End - 0.5 && dir > 0) {
      startTransition('page1-to-page2');
    }
  } else if (state === 'page2-scrub') {
    const prevTarget = targetFrame;
    targetFrame = clampFrame(targetFrame + dir * frameDelta, CONFIG.page2Start, CONFIG.totalFrames);
    if (prevTarget <= CONFIG.page2Start + 0.5 && dir < 0) {
      startTransition('page2-to-page1');
    }
  }
}

function startTransition(transitionState) {
  isTransitioning = true;
  state = transitionState;

  const targetTop = transitionState === 'page1-to-page2' ? pageHeight : 0;
  const startTop = window.scrollY;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / CONFIG.transitionDuration, 1);
    // easeOutExpo — 先快后慢，"冲入后沉降"的不对称感
    const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    window.scrollTo(0, Math.round(startTop + (targetTop - startTop) * ease));

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      finishTransition(transitionState);
    }
  }
  requestAnimationFrame(animate);
}

function finishTransition(transitionState) {
  if (transitionState === 'page1-to-page2') {
    state = 'page2-scrub';
    currentFrame = CONFIG.page2Start;
    targetFrame = CONFIG.page2Start;
  } else {
    state = 'page1-scrub';
    currentFrame = CONFIG.page1End;
    targetFrame = CONFIG.page1End;
  }
  isTransitioning = false;
}

function loop() {
  if (!isTransitioning) {
    // 自适应 lerp：快滚时快速追赶，接近目标时缓慢沉降
    const dist = Math.abs(targetFrame - currentFrame);
    let lerp;
    if (scrollVelocity > 0.08) {
      lerp = 0.38;               // 正在快速滚动 → 快速追赶
    } else if (dist > 8) {
      lerp = 0.22;               // 离目标远 → 中速
    } else if (dist > 2) {
      lerp = 0.14;               // 接近目标 → 减速
    } else {
      lerp = 0.08;               // 几乎到位 → 缓慢沉降
    }
    currentFrame += (targetFrame - currentFrame) * lerp;
    // 速度衰减
    scrollVelocity *= 0.93;
  }

  // 鼠标视差平滑（每帧 lerp 6%）
  smoothMouseX += (mouseX - smoothMouseX) * 0.06;
  smoothMouseY += (mouseY - smoothMouseY) * 0.06;

  // 文字反向位移 — 画面往右，文字往左，产生景深
  if (heroCenter) {
    heroCenter.style.transform = `translate(${-smoothMouseX * 4}px, ${-smoothMouseY * 4}px)`;
  }
  if (navPanel) {
    navPanel.style.transform = `translateY(-50%) translate(${-smoothMouseX * 3}px, ${-smoothMouseY * 3}px)`;
  }

  render(currentFrame);
  requestAnimationFrame(loop);
}

// ─── EVENTS ──────────────────────────────────────────────
function isInteractiveTarget(e) {
  return e.target.closest && e.target.closest('button, a, .audio-toggle, .nav-entry, .lg-btn, input, textarea, .contact-modal-panel, .social-link');
}
window.addEventListener('wheel', onWheel, { passive: false });
window.addEventListener('touchmove', (e) => {
  if (isInteractiveTarget(e)) return;
  e.preventDefault();
}, { passive: false });
window.addEventListener('touchstart', (e) => {
  if (isInteractiveTarget(e)) return;
  e.preventDefault();
}, { passive: false });

// 鼠标视差 — 归一化到 -1~1
window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = (e.clientY / window.innerHeight) * 2 - 1;
});

// 入口按钮 → 翻到 page2
const enterBtn = document.getElementById('enter-btn');
const bgm = document.getElementById('bgm');
const audioToggle = document.getElementById('audio-toggle');
const audioIcon = document.getElementById('audio-icon');

// 统一更新音频按钮 UI
function setAudioUI(playing) {
  if (audioIcon) audioIcon.textContent = playing ? '♪' : '○';
  if (audioToggle) audioToggle.classList.toggle('muted', !playing);
}

// 初始状态：未播放
setAudioUI(false);

// 用户主动暂停标志 — kickoff 不覆盖用户意图
let userPaused = false;

// 纯粹的开关切换 — 基于 bgm.paused 实际状态，play 成功后才更新 UI
function toggleAudio() {
  if (!bgm) return;
  if (bgm.paused) {
    userPaused = false;
    bgm.volume = 0.5;
    bgm.play().then(() => setAudioUI(true)).catch(() => setAudioUI(false));
  } else {
    userPaused = true;
    bgm.pause();
    setAudioUI(false);
  }
}

// 自动播放尝试（部分浏览器允许无手势播放）
function tryAutoplay() {
  if (!bgm || !bgm.paused || userPaused) return;
  bgm.volume = 0.5;
  bgm.play().then(() => {
    setAudioUI(true);
    removeKickoffListeners();
  }).catch(() => { /* 被拦截，等首次交互 */ });
}

// kickoff 监听器 — 首次任意交互后立即移除，避免与按钮 toggle 冲突
function kickoffAutoplay() {
  removeKickoffListeners();
  if (!userPaused) tryAutoplay();
}
function removeKickoffListeners() {
  document.removeEventListener('click', kickoffAutoplay);
  document.removeEventListener('keydown', kickoffAutoplay);
  document.removeEventListener('touchstart', kickoffAutoplay);
  document.removeEventListener('wheel', kickoffAutoplay);
}

// 页面加载后立即尝试播放
tryAutoplay();
// 被拦截则首次交互启动
document.addEventListener('click', kickoffAutoplay);
document.addEventListener('keydown', kickoffAutoplay);
document.addEventListener('touchstart', kickoffAutoplay);
document.addEventListener('wheel', kickoffAutoplay);

if (enterBtn) {
  enterBtn.addEventListener('click', () => {
    if (!firstFrameReady || isTransitioning) return;
    if (state === 'page1-scrub') {
      targetFrame = CONFIG.page1End;
      currentFrame = CONFIG.page1End;
      startTransition('page1-to-page2');
    }
  });
}

// 静音切换 — 按钮独占控制，首次点击即清理 kickoff 防干扰
if (audioToggle) {
  audioToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    removeKickoffListeners();
    toggleAudio();
  });
}

// ─── 联络口 留言板 ───────────────────────────────────────
const contactEntry = document.getElementById('contact-entry');
const contactModal = document.getElementById('contact-modal');
const contactModalClose = document.getElementById('contact-modal-close');
const contactModalBackdrop = document.getElementById('contact-modal-backdrop');
const contactSubmit = document.getElementById('contact-submit');
const contactInput = document.getElementById('contact-input');
const socialQrTriggers = document.querySelectorAll('[data-qr-trigger]');

function closeSocialQrs(except) {
  socialQrTriggers.forEach((trigger) => {
    if (trigger === except) return;
    trigger.classList.remove('is-open');
    const button = trigger.querySelector('.social-link');
    const popover = trigger.querySelector('.social-qr-popover');
    if (button) button.setAttribute('aria-expanded', 'false');
    if (popover) popover.setAttribute('aria-hidden', 'true');
  });
}

function openContactModal() {
  if (contactModal) contactModal.classList.add('open');
}
function closeContactModal() {
  closeSocialQrs();
  if (contactModal) contactModal.classList.remove('open');
}

if (contactEntry) {
  contactEntry.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openContactModal();
  });
}
if (contactModalClose) contactModalClose.addEventListener('click', closeContactModal);
if (contactModalBackdrop) contactModalBackdrop.addEventListener('click', closeContactModal);
socialQrTriggers.forEach((trigger) => {
  const button = trigger.querySelector('.social-link');
  const popover = trigger.querySelector('.social-qr-popover');
  if (!button || !popover) return;

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const willOpen = !trigger.classList.contains('is-open');
    closeSocialQrs(trigger);
    trigger.classList.toggle('is-open', willOpen);
    button.setAttribute('aria-expanded', String(willOpen));
    popover.setAttribute('aria-hidden', String(!willOpen));
  });
});
document.addEventListener('click', () => closeSocialQrs());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeContactModal();
});

if (contactSubmit) {
  contactSubmit.addEventListener('click', () => {
    const msg = contactInput ? contactInput.value.trim() : '';
    if (!msg) {
      if (contactInput) contactInput.focus();
      return;
    }
    // 客户端确认 — 后续可接入后端 / Formspree 等
    contactSubmit.innerHTML = '<span>✓ 留言已收到</span>';
    contactSubmit.style.pointerEvents = 'none';
    setTimeout(() => {
      closeContactModal();
      setTimeout(() => {
        contactSubmit.innerHTML = '<span>提交</span><span class="lg-btn-arrow">→</span>';
        contactSubmit.style.pointerEvents = '';
        if (contactInput) contactInput.value = '';
      }, 400);
    }, 1500);
  });
}

// ─── START ───────────────────────────────────────────────
loadFrames();
