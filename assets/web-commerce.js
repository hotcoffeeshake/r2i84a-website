(function () {
  "use strict";
  var PLANS = [
    {
      id: 'free', name: '免费版', price: '0', per: '', unit: '零门槛开始',
      quota: '每日 6 次提问', primary: false,
      feats: ['聊天截图解析', '关系阶段判断', '基础回复建议'],
      cta: '当前版本'
    },
    {
      id: 'month', name: '月卡', price: '12', per: '/月', unit: '约 ¥0.4 / 天',
      quota: '每日 30 次提问', primary: false,
      feats: ['每日 30 次，不限追问改口', '完整关系阶段判断', '回复逐句打磨', '优先响应速度'],
      cta: '直接购买'
    },
    {
      id: 'year', name: '年卡', price: '60', per: '/年', unit: '折算 ¥5 / 月 · 比月卡省 ¥84',
      quota: '每日 30 次提问', primary: true, badge: '最划算',
      feats: ['月卡全部权益', '全年不限追问改口', '新功能优先体验', '一次开通 ¥60，全年不涨价'],
      cta: '直接购买'
    }
  ];

  function cardHtml(p) {
    var label = p.id === 'free' ? p.cta : '直接购买 ¥' + p.price;
    var cls = p.primary ? 'r2pay-btn gold' : 'r2pay-btn ghost';
    var feats = p.feats.map(function (f) { return '<li><i>&#10003;</i><span>' + f + '</span></li>'; }).join('');
    return '<div class="r2pay-card' + (p.primary ? ' hot' : '') + '">' +
      (p.badge ? '<span class="r2pay-badge">' + p.badge + '</span>' : '') +
      '<p class="r2pay-name">' + p.name + '</p>' +
      '<div class="r2pay-price"><span class="r2pay-cur">&#165;</span><span class="r2pay-num">' + p.price + '</span><span class="r2pay-per">' + p.per + '</span></div>' +
      '<p class="r2pay-unit">' + p.unit + '</p>' +
      '<p class="r2pay-quota">' + p.quota + '</p>' +
      '<ul class="r2pay-feats">' + feats + '</ul>' +
      '<button class="' + cls + '" type="button" data-plan="' + p.id + '">' + label + '</button>' +
      '</div>';
  }

  function render() {
    updateNav();
    grid.innerHTML = PLANS.map(cardHtml).join('');
    (read('pastOrders') || []).forEach(function (order, index) {
      var link = document.createElement('button'); link.type = 'button'; link.className = 'r2pay-btn ghost';
      link.textContent = '订单 …' + order.id.slice(-10) + ' · ' + orderStatus(order);
      link.addEventListener('click', function () { resume(order); }); grid.appendChild(link);
    });
  }

  var API = location.origin;
  var grid = document.getElementById('r2payGrid');
  var mask = document.getElementById('r2payMask');
  var body = document.getElementById('r2payBody');
  var toastEl = document.getElementById('r2payToast');
  if (!grid || !mask || !body) return;
  function browserError(code) { var error = new Error(code); error.code = code; return error; }
  function read(key) {
    try { return JSON.parse(localStorage.getItem('r2guest_' + key) || 'null'); }
    catch (_) { throw browserError('PURCHASE_STORAGE_UNAVAILABLE'); }
  }
  function save(key, value) {
    try { if (value === null) localStorage.removeItem('r2guest_' + key); else localStorage.setItem('r2guest_' + key, JSON.stringify(value)); }
    catch (_) { throw browserError('PURCHASE_STORAGE_UNAVAILABLE'); }
  }
  function idempotencyKey() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      var bytes = new Uint8Array(16); crypto.getRandomValues(bytes);
      return Array.from(bytes, function (value) { return value.toString(16).padStart(2, '0'); }).join('');
    }
    throw browserError('SECURE_RANDOM_UNAVAILABLE');
  }
  function updateNav() {
    document.querySelectorAll('button.nav-login').forEach(function (el) {
      var label = (webUser || siteUser) ? '微信已登录' : '微信登录 / 购买';
      if (el.textContent !== label) el.textContent = label;
    });
  }
  var generation = 0, busy = false, timer, webUser = null, siteUser = null, webSessionChecked = false, webSessionPromise = null;
  function toast(message) { toastEl.textContent = message; toastEl.classList.add('on'); }
  function message(text) { var el = document.getElementById('r2status'); if (el) el.textContent = text; }
  function close() { generation++; clearTimeout(timer); mask.classList.remove('on'); }
  function view(title, text) {
    generation++; clearTimeout(timer);
    body.innerHTML = '<h3 id="r2payModalTitle"></h3><p class="r2pay-msub" id="r2status" role="status" aria-live="polite"></p><div id="r2details"></div><div id="r2content"></div>';
    document.getElementById('r2payModalTitle').textContent = title; message(text); mask.classList.add('on');
    return generation;
  }
  function button(label, action) { var b = document.createElement('button'); b.type = 'button'; b.className = 'r2pay-submit'; b.textContent = label; b.addEventListener('click', action); document.getElementById('r2content').appendChild(b); return b; }
  function image(src, alt) { var img = document.createElement('img'); img.src = src; img.alt = alt; img.width = 200; img.height = 200; img.style.cssText = 'display:block;margin:16px auto;background:white'; document.getElementById('r2content').appendChild(img); }
  function orderStatus(order) {
    if (order.status === 'fulfilled') return '会员已开通';
    if (order.status === 'paid_pending_manual') return '已付款，待人工开通';
    if (order.paymentExpired || order.expired) return '付款码已过期，订单保留';
    if (order.status === 'pending') return '待付款';
    return '状态待查询';
  }
  function orderDetails(order) {
    var area = document.getElementById('r2details'); if (!area || !order || !order.id) return;
    area.innerHTML = '';
    var year = order.sku === 'member_year' || order.plan === 'year';
    var amount = Number.isInteger(order.amount) ? (order.amount / 100).toFixed(2) : year ? '60.00' : '12.00';
    var text = document.createElement('p'); text.className = 'r2pay-msub';
    text.style.cssText = 'overflow-wrap:anywhere;user-select:text';
    text.textContent = '订单号：' + order.id + '\n套餐：' + (year ? '年卡' : '月卡') + ' · ¥' + amount + '\n状态：' + orderStatus(order);
    area.appendChild(text);
    var copy = document.createElement('button'); copy.type = 'button'; copy.className = 'r2pay-btn ghost'; copy.textContent = '复制订单号';
    copy.addEventListener('click', async function () {
      try { if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('unsupported'); await navigator.clipboard.writeText(order.id); toast('订单号已复制，可提供给客服核验小程序账号。'); }
      catch (_) { toast('请长按或选中上方订单号复制。'); }
    });
    area.appendChild(copy);
  }
  function mergeSummary(order, data) {
    ['sku', 'amount', 'status', 'createdAt', 'expiresAt', 'paidAt', 'paymentExpired', 'fulfillment'].forEach(function (key) { if (data[key] !== undefined) order[key] = data[key]; });
    if (order.status === 'fulfilled' || order.status === 'paid_pending_manual') { order.expired = false; order.paymentExpired = false; }
    var active = read('order'); if (active && active.id === order.id) save('order', order);
    var history = read('pastOrders') || [];
    if (history.some(function (item) { return item.id === order.id; })) save('pastOrders', history.map(function (item) { return item.id === order.id ? order : item; }));
    orderDetails(order);
  }
  function errorText(error) {
    if (error && error.name === 'AbortError') return '请求超时，请重试；如已付款请勿重复购买。';
    var code = error && error.code;
    if (code === 'WECHAT_LOGIN_UNAVAILABLE') return '公众号验证码登录暂未开通，请稍后重试。购买入口仍可使用。';
    if (code === 'PURCHASE_STORAGE_UNAVAILABLE') return '当前浏览器无法保存或读取购买凭据，请使用普通浏览器重试；如已付款请保留微信支付凭证，不要重复购买。';
    if (code === 'SECURE_RANDOM_UNAVAILABLE') return '当前浏览器不支持安全生成购买凭据，请使用较新的普通浏览器重试。';
    if (code === 'INVALID_LOGIN_CODE') return '登录码格式不正确，请在公众号内重新发送“登录”后复制完整登录码。';
    if (code === 'NOT_SUBSCRIBED' || code === 'SUBSCRIBE_REQUIRED' || code === 'FOLLOW_REQUIRED') return '请先关注服务号，再重新登录。';
    if (code === 'ACCOUNT_AMBIGUOUS') return '当前微信关联了多个账号，请联系客服核对账号后再购买。';
    if (code === 'ACCOUNT_NOT_LINKED' || code === 'MINIPROGRAM_ACCOUNT_REQUIRED' || code === 'UNIONID_REQUIRED') return '请用同一微信先打开小程序完成登录，再返回网页重新登录。';
    if (code === 'MANUAL_FULFILLMENT_UNAVAILABLE') return '人工开通暂不可用，请稍后购买。';
    if (code === 'MANUAL_FULFILLMENT_CONFIRM_REQUIRED') return '请先确认同意付款后联系客服人工开通，再继续支付。';
    if (code === 'CHANNEL_DISABLED') return '当前微信支付方式暂不可用，请稍后重试。';
    if (code === 'JSAPI_UNAVAILABLE') return '微信支付组件暂不可用，请关闭页面后从服务号菜单重新进入。';
    if (code === 'ORDER_EXPIRED') return '付款码已过期，订单记录仍保留。如已付款请查询到账；确认未付款后才可生成新订单。';
    if (code === 'IDEMPOTENCY_CONFLICT') return '请先恢复之前的订单，确认支付结果后再购买其他套餐。';
    if (error && error.status === 401) return '浏览器购买凭据已失效，请保留微信支付凭证，通过小程序客服申请人工核验。仅凭订单号无法恢复查询，请勿重复购买。';
    return '暂时无法完成操作，请稍后重试；如已付款，请勿重复购买，可重新查询到账状态。';
  }
  async function api(path, options) {
    options = options || {};
    var headers = { 'Content-Type': 'application/json' };
    if (options.key) headers['Idempotency-Key'] = options.key;
    if (options.authorization) headers.Authorization = options.authorization;
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 30000);
    try {
      var response = await fetch(API + path, { method: options.body ? 'POST' : 'GET', headers: headers, body: options.body ? JSON.stringify(options.body) : undefined, cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
      var data = await response.json();
      if (!response.ok) {
        var error = new Error('请求失败'); error.status = response.status; error.code = data.code || data.error; throw error;
      }
      return data;
    } finally { clearTimeout(timeout); }
  }
  async function loadWebUser() {
    if (webSessionChecked) return webUser ? { user: { nickname: webUser.nickname }, fulfillment: webUser.fulfillment, paidUntil: webUser.paidUntil || null } : null;
    if (webSessionPromise) return webSessionPromise;
    webSessionPromise = (async function () {
      try {
        var data = await api('/api/web/auth/me');
        webUser = { nickname: data.user && data.user.nickname || '微信用户', fulfillment: data.fulfillment || 'auto', paidUntil: data.paidUntil || null };
        webSessionChecked = true; updateNav(); return data;
      } catch (error) {
        if (error.status !== 401) throw error;
        webUser = null; webSessionChecked = true; updateNav(); return null;
      } finally { webSessionPromise = null; }
    })();
    return webSessionPromise;
  }
  function isWechatBrowser() { return /MicroMessenger/i.test(navigator.userAgent || ''); }
  function invokeJsapiPayment(payload) {
    var fields = ['appId', 'timeStamp', 'nonceStr', 'package', 'signType', 'paySign'];
    if (!payload || fields.some(function (key) { return typeof payload[key] !== 'string' || !payload[key]; })) return Promise.reject(browserError('JSAPI_UNAVAILABLE'));
    return new Promise(function (resolve, reject) {
      var settled = false, readyTimer;
      function finish(value, error) {
        if (settled) return;
        settled = true; clearTimeout(readyTimer);
        if (document.removeEventListener) document.removeEventListener('WeixinJSBridgeReady', invoke, false);
        error ? reject(error) : resolve(value);
      }
      function invoke() {
        var bridge = window.WeixinJSBridge;
        if (!bridge || typeof bridge.invoke !== 'function') { finish('', browserError('JSAPI_UNAVAILABLE')); return; }
        bridge.invoke('getBrandWCPayRequest', payload, function (result) {
          var message = String(result && result.err_msg || '').toLowerCase();
          if (message === 'get_brand_wcpay_request:ok') finish('ok');
          else if (message === 'get_brand_wcpay_request:cancel') finish('cancel');
          else finish('failed');
        });
      }
      if (window.WeixinJSBridge && typeof window.WeixinJSBridge.invoke === 'function') invoke();
      else {
        document.addEventListener('WeixinJSBridgeReady', invoke, false);
        readyTimer = setTimeout(function () { finish('', browserError('JSAPI_UNAVAILABLE')); }, 10000);
      }
    });
  }
  function finishLogin(data) {
    webUser = { nickname: data.user && data.user.nickname || '微信用户', fulfillment: data.fulfillment || 'auto' };
    webSessionChecked = true;
    updateNav();
    document.getElementById('r2content').innerHTML = '';
    message('微信登录成功。' + (webUser.fulfillment === 'manual' ? '当前微信尚未自动关联小程序账号，购买后需要人工核验开通。' : '已关联同一微信下的小程序账号。'));
    button('查看会员套餐', function () { checkout(null); });
  }
  async function startQrLogin() {
    var g = view('微信扫码登录', '正在生成 5 分钟有效的服务号二维码…');
    try {
      var challenge = await api('/api/web/auth/qr', { body: {} });
      if (g !== generation) return;
      if (!challenge.scene || !challenge.pollToken || !/^data:image\/png;base64,/.test(challenge.qrUrl || '')) throw new Error('二维码不可用');
      image(challenge.qrUrl, '微信扫码登录');
      message('请用微信扫码并关注服务号；已关注用户扫码后会直接确认登录。二维码 5 分钟有效。');
      var poll = async function () {
        if (g !== generation) return;
        if (Date.now() >= challenge.expiresAt) { message('登录二维码已过期，请重新生成。'); button('重新生成二维码', startQrLogin); return; }
        try {
          var result = await api('/api/web/auth/status?scene=' + encodeURIComponent(challenge.scene), { authorization: 'Poll ' + challenge.pollToken });
          if (g !== generation) return;
          if (result.status === 'ok') { finishLogin(result); return; }
          timer = setTimeout(poll, 3000);
        } catch (error) {
          if (g !== generation) return;
          message(error.status === 401 ? '登录二维码已过期，请重新生成。' : errorText(error));
          button('重新生成二维码', startQrLogin);
        }
      };
      timer = setTimeout(poll, 1200);
    } catch (error) { if (g === generation) { message(errorText(error)); button('重试生成二维码', startQrLogin); } }
  }
  function showLoginCode() {
    var g = view('订阅号验证码登录', '扫码关注订阅号，在公众号内发送“登录”，获取一次性登录验证码，再填回本页面。');
    image('/assets/wechat-subscription-follow.jpg', '微信订阅号关注二维码');
    var input = document.createElement('input');
    input.type = 'text'; input.autocomplete = 'one-time-code'; input.inputMode = 'text'; input.maxLength = 16;
    input.placeholder = '请输入登录码，例如 ABCDE-12345';
    input.style.cssText = 'box-sizing:border-box;width:100%;margin:8px 0 12px;padding:12px 14px;border:1px solid #777;border-radius:10px;background:#fff;color:#111;font-size:16px;text-transform:uppercase';
    document.getElementById('r2content').appendChild(input);
    var submit = button('提交登录码', async function () {
      if (busy || g !== generation) return;
      busy = true; submit.disabled = true; message('正在验证一次性登录码…');
      try { finishLogin(await api('/api/web/auth/code', { body: { code: input.value } })); }
      catch (error) { if (g === generation) { message(error.status === 401 ? '登录码无效或已使用，请在公众号内重新发送“登录”。' : errorText(error)); submit.disabled = false; } }
      finally { busy = false; }
    });
    setTimeout(function () { input.focus(); }, 0);
  }
  async function startWechatOauth(purchase) {
    if (!isWechatBrowser()) { toast('请在微信内打开当前网站后使用微信内登录。'); return; }
    try {
      var data = await api('/api/web/auth/oauth/start', { body: {} });
      sessionStorage.setItem('r2_wechat_oauth', JSON.stringify({ state: data.state, pollToken: data.pollToken, createdAt: Date.now(), purchase: purchase === true }));
      location.href = data.authorizeUrl;
    } catch (error) { view('微信内登录失败', errorText(error)); }
  }
  async function completeWechatOauth() {
    var params = new URLSearchParams(location.search), code = params.get('code'), state = params.get('state');
    if (!code || !state) return false;
    var saved;
    try { saved = JSON.parse(sessionStorage.getItem('r2_wechat_oauth') || 'null'); } catch (_) { saved = null; }
    params.delete('code'); params.delete('state');
    history.replaceState({}, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash);
    sessionStorage.removeItem('r2_wechat_oauth');
    var g = view('微信登录', '正在确认微信身份…');
    if (!saved || saved.state !== state || Date.now() - saved.createdAt > 300000) { message('登录请求已过期，请重新发起微信登录。'); button('重新登录', showLogin); return true; }
    try {
      var result = await api('/api/web/auth/oauth/complete', { body: { code: code, state: state }, authorization: 'Poll ' + saved.pollToken });
      if (g === generation) {
        finishLogin(result);
        if (saved.purchase === true) await checkout(null);
      }
    } catch (error) { if (g === generation) { message(errorText(error)); button('重新登录', showLogin); } }
    return true;
  }
  function showLogin() {
    if (webUser) {
      view('微信账号', '已登录：' + webUser.nickname + (webUser.fulfillment === 'manual' ? '；尚未自动关联小程序账号。' : '；已关联小程序账号。'));
      button('购买 / 查询订单', function () { checkout(null); });
      button('退出登录', async function () { try { await api('/api/web/auth/logout', { body: {} }); } finally { webUser = null; webSessionChecked = true; updateNav(); showLogin(); } });
      return;
    }
    if (siteUser) {
      view('微信账号', '已登录：微信用户');
      button('购买 / 查询订单', function () { checkout(null); });
      button('退出登录', async function () { try { await api('/api/auth/wechat/logout', { body: {} }); siteUser = null; updateNav(); showLogin(); } catch (_) { message('退出失败，请重试。'); } });
      return;
    }
    view('微信公众号登录', '关注订阅号，发送网页上的 6 位数字即可登录。');
    button('获取 6 位登录码', function () {
      try { sessionStorage.setItem('login_return', location.pathname + location.search + location.hash); } catch (_) {}
      location.assign('/wechat-login');
    });
    button('暂不登录，直接购买', function () { checkout(null); });
  }
  function hasUnresolvedPurchase() { return !!(read('order') || read('attempt')); }
  async function ensureGuest(g, allowCreate) {
    var current = await loadWebUser();
    if (current) return current;
    var guest = allowCreate && !hasUnresolvedPurchase() && g === generation ? await api('/api/web/auth/guest', { body: {} }) : await api('/api/web/auth/guest/me');
    if (!guest.fulfillment) guest.fulfillment = 'manual';
    return guest;
  }
  function completeOrder(order) {
    if (window.r2track && order.status !== 'fulfilled') window.r2track('purchase', 'paid', order.plan || order.sku || '');
    order.status = 'fulfilled';
    var previous = read('pastOrders') || [];
    var history = previous.filter(function (item) { return item.id !== order.id; }); history.push(order);
    save('pastOrders', history);
    if (read('order') && read('order').id === order.id) { save('order', null); save('attempt', null); }
    render();
  }
  async function manualSupport(order, g) {
    if (g !== generation) return;
    if (window.r2track && order.status !== 'paid_pending_manual') window.r2track('purchase', 'paid_manual', order.plan || order.sku || '');
    order.status = 'paid_pending_manual'; save('order', order); save('attempt', null);
    document.getElementById('r2content').innerHTML = '';
    orderDetails(order);
    message('已核实付款，会员待人工开通。请向客服提供上方订单号，并核验需要升级的小程序账号，请勿重复购买。');
    try {
      var support = await api('/api/web/orders/' + encodeURIComponent(order.id) + '/support');
      if (g !== generation) return;
      if (support.status !== 'paid_pending_manual' || support.orderId !== order.id) throw new Error('客服资料暂不可用');
      var hasWechat = typeof support.wechat === 'string' && !!support.wechat.trim();
      if (hasWechat) {
        var contact = document.createElement('p'); contact.className = 'r2pay-msub'; contact.textContent = '客服微信：' + support.wechat;
        document.getElementById('r2content').appendChild(contact);
      }
      var hasQr = typeof support.qrDataUrl === 'string' && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(support.qrDataUrl);
      if (hasQr) image(support.qrDataUrl, '付款后联系客服人工开通');
      if (!hasWechat && !hasQr) throw new Error('客服资料暂不可用');
      button('查询开通状态', function () { resume(order); });
    } catch (error) {
      if (g !== generation) return;
      message(error.status === 401 ? '已核实付款，会员待人工开通。' + errorText(error) : '已核实付款，会员待人工开通。客服资料暂时无法获取，请重试；无需再次付款。');
      button('重新获取客服资料', function () { resume(order); });
    }
  }
  async function track(order, g) {
    var until = Date.now() + 180000;
    async function poll() {
      if (g !== generation) return;
      try {
        var state = await api('/api/web/orders/' + encodeURIComponent(order.id));
        if (g !== generation) return;
        mergeSummary(order, state);
        if (state.status === 'fulfilled') { completeOrder(order); document.getElementById('r2content').innerHTML = ''; message('会员已到账，请回到小程序查看会员权益。'); return; }
        if (state.status === 'paid_pending_manual') { await manualSupport(order, g); return; }
        if (state.status === 'closed' || state.status === 'failed') { save('order', null); save('attempt', null); message('订单未完成支付，可返回选择套餐。'); return; }
        if (state.status === 'pending' && (order.paymentExpired || order.expired)) { showExpired(order); return; }
        if (Date.now() >= until) { message('尚未确认会员到账。如已付款，请稍后查询，不要重复购买。'); button('重新查询', function () { resume(order); }); return; }
        timer = setTimeout(poll, 2500);
      } catch (error) { if (g === generation) { message(errorText(error)); if (error.status === 401) document.getElementById('r2content').innerHTML = ''; else button('重新查询', function () { resume(order); }); } }
    }
    await poll();
  }
  function showExpired(order) {
    order.expired = true; orderDetails(order);
    var history = read('pastOrders') || [];
    save('pastOrders', history.filter(function (item) { return item.id !== order.id; }).concat([order]));
    var active = read('order'); if (active && active.id === order.id) save('order', order);
    document.getElementById('r2content').innerHTML = '';
    message('仅付款码已过期，订单记录仍保留。已付款请查询到账状态；确认未付款后才可生成新订单。');
    button('查询原订单到账状态', function () { resume(order); });
    button('确认原订单未付款，生成新订单', function () {
      if (busy) { toast('上一请求仍在处理中，请稍候再操作。'); return; }
      var active = read('order');
      if (active && active.id !== order.id) { resume(active); return; }
      save('order', null); save('attempt', null); render(); checkout(order.plan || (order.sku === 'member_year' ? 'year' : 'month'));
    });
    render();
  }
  async function resume(order) {
    var g = view('查询会员到账状态', '正在查询原订单，请勿重复付款。');
    orderDetails(order);
    try { await ensureGuest(g, false); } catch (error) { if (g === generation) message(errorText(error)); return; }
    if (g !== generation) return;
    var attempt = read('attempt');
    if (order.status !== 'paid_pending_manual' && order.status !== 'fulfilled' && !order.expired && attempt && attempt.plan === order.plan) button('继续支付原订单', function (event) {
      var next = view('继续支付原订单', '先确认原订单是否已到账，再恢复付款。');
      var retry = button('继续支付原订单', function (e) { pay(order.plan, next, e.currentTarget, order); });
      pay(order.plan, next, retry, order);
    });
    await track(order, g);
  }
  async function checkout(plan) {
    try { return await checkoutReady(plan); } catch (error) { view('无法准备购买', errorText(error)); }
  }
  async function checkoutReady(plan) {
    if (busy) { toast('上一请求仍在处理中，请稍候再次打开；不会重复下单。'); return; }
    var existing = read('order');
    if (existing) { await resume(existing); return; }
    var p = PLANS.find(function (p) { return p.id === plan && p.id !== 'free'; });
    if (!p) {
      var linked = webUser && webUser.fulfillment !== 'manual';
      view('购买 / 查询订单', linked ? '已关联同一微信下的小程序账号，微信支付确认后会员自动到账。' : '选择会员套餐。账号未自动关联时，付款后需联系客服核验开通。');
      PLANS.filter(function (item) { return item.id !== 'free'; }).forEach(function (item) { button(item.name + ' ¥' + item.price, function () { checkout(item.id); }); });
      return;
    }
    if (window.r2track) window.r2track('purchase', 'checkout_start', plan);
    var g = view('购买' + p.name, '正在准备安全购买会话…');
    busy = true;
    try {
      var identity = await ensureGuest(g, true);
      if (g !== generation) return;
      var manual = identity.fulfillment === 'manual';
      message(manual ? '当前为访客或未关联账号购买。付款后需联系客服人工开通，请保留购买凭据及微信支付凭证。' : '已关联小程序账号，付款确认后将自动开通会员。');
      button(manual ? '同意付款后联系客服人工开通，支付 ¥' + p.price : '微信支付 ¥' + p.price, function (event) { pay(plan, g, event.currentTarget, null, manual); });
    } catch (error) { if (g === generation) message(errorText(error)); }
    finally { busy = false; }
  }
  async function pay(plan, g, btn, existingOrder, manualAccepted) {
    if (busy || g !== generation) return;
    busy = true; btn.disabled = true; btn.textContent = '正在准备微信支付…'; message('正在准备微信支付…');
    var stage = '验证购买凭据';
    try {
      if (existingOrder) {
        var current = await api('/api/web/orders/' + encodeURIComponent(existingOrder.id));
        if (g !== generation) return;
        mergeSummary(existingOrder, current);
        if (current.status === 'pending' && (existingOrder.paymentExpired || existingOrder.expired)) { showExpired(existingOrder); return; }
        if (current.status === 'fulfilled') { await track(existingOrder, g); return; }
        if (current.status === 'paid_pending_manual') { await manualSupport(existingOrder, g); return; }
        var original = read('attempt');
        if (!original || original.plan !== plan) throw new Error('原订单恢复信息不可用');
      }
      // Revalidate identity immediately before order creation, even after a long confirmation pause.
      var identity = await ensureGuest(g, false);
      if (g !== generation) return;
      var needsManual = identity.fulfillment === 'manual';
      var previous = read('attempt');
      if (needsManual && !manualAccepted && !(previous && previous.manualFulfillmentAccepted)) {
        message('此订单付款后需联系客服人工开通，付款不会立即开通。请确认后继续。');
        document.getElementById('r2content').innerHTML = '';
        button('同意付款后联系客服人工开通并继续支付', function (event) { pay(plan, g, event.currentTarget, existingOrder, true); });
        return;
      }
      var channel = !needsManual && isWechatBrowser() ? 'jsapi' : 'native';
      var attempt = read('attempt');
      if (attempt && (attempt.plan !== plan || attempt.channel !== channel)) throw new Error('请先恢复之前的订单');
      if (!attempt) { attempt = { plan: plan, channel: channel, key: idempotencyKey(), manualFulfillmentAccepted: needsManual && !!manualAccepted };  save('attempt', attempt); }
      if (needsManual && manualAccepted && !attempt.manualFulfillmentAccepted) { attempt.manualFulfillmentAccepted = true; save('attempt', attempt); }
      var orderBody = { sku: plan === 'month' ? 'member_month' : 'member_year', payChannel: channel };
      if (needsManual && attempt.manualFulfillmentAccepted) orderBody.manualFulfillmentAccepted = true;
      stage = channel === 'jsapi' ? '发起微信支付' : '生成微信付款码';
      var data = await api('/api/web/orders', { body: orderBody, key: attempt.key });
      if (!data.id) throw new Error('订单未创建');
      if (existingOrder && data.id !== existingOrder.id) throw new Error('原订单不匹配');
      var order = { id: data.id, plan: plan, fulfillment: data.fulfillment, status: data.status }; save('order', order);
      if (window.r2track) window.r2track('purchase', 'order_created', plan);
      if (g !== generation) return;
      mergeSummary(order, data);
      document.getElementById('r2content').innerHTML = '';
      if (data.status === 'fulfilled') { completeOrder(order); message('会员已到账，请回到小程序查看。'); return; }
      if (data.status === 'paid_pending_manual') { await manualSupport(order, g); return; }
      if (data.paymentExpired) { showExpired(order); return; }
      var payment = data.pay || {};
      if (payment.channel === 'native') {
        if (typeof payment.qrDataUrl === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(payment.qrDataUrl)) { image(payment.qrDataUrl, '微信扫码支付'); message(needsManual ? '请用微信扫码付款，收款确认后联系客服人工开通会员。手机上可保存二维码后尝试识别，或用另一台设备扫描。' : '请用微信扫码付款；服务端确认收款后会员将自动到账。'); }
        else { message('扫码支付二维码暂不可用，请稍后恢复原订单。原订单已保留，请勿重复购买。'); }
      } else if (payment.channel === 'jsapi') {
        message('正在调起微信支付…');
        var bridgeResult = await invokeJsapiPayment(payment.jsapi);
        if (g !== generation) return;
        if (bridgeResult !== 'ok') {
          var verified = await api('/api/web/orders/' + encodeURIComponent(order.id));
          if (g !== generation) return;
          mergeSummary(order, verified);
          if (verified.status === 'fulfilled') { completeOrder(order); document.getElementById('r2content').innerHTML = ''; message('会员已到账，请回到小程序查看。'); return; }
          document.getElementById('r2content').innerHTML = '';
          orderDetails(order);
          message(bridgeResult === 'cancel' ? '支付未完成，原订单已保留；如实际已付款请先查询到账状态。' : '支付结果尚未确认，原订单已保留，请勿重复创建订单。');
          button('查询到账状态', function () { resume(order); });
          button('继续支付原订单', function (event) { pay(plan, g, event.currentTarget, order, manualAccepted); });
          return;
        }
        message('微信支付已返回，正在由服务端核实收款并激活会员…');
      } else throw new Error('微信支付参数不可用');
      if (g === generation) await track(order, g);
    } catch (error) {
      if (g === generation) {
        message(stage + '失败：' + errorText(error));
        if (error.code === 'PURCHASE_STORAGE_UNAVAILABLE') { document.getElementById('r2content').innerHTML = ''; return; }
        var order = read('order');
        if (order) orderDetails(order);
        if (error.code === 'ORDER_EXPIRED' && order) {
          order.expired = true; save('order', order);
          showExpired(order);
        }
        else if (order) button('查询原订单', function () { resume(order); });
        else if (error.status === 401) { document.getElementById('r2content').innerHTML = ''; }
        else if (error.code === 'ORDER_EXPIRED') {
          document.getElementById('r2content').innerHTML = '';
          message('原订单付款码已过期，购买凭据仍保留。请恢复原订单查询付款结果。');
          button('恢复原订单并查询', function (event) { pay(plan, g, event.currentTarget, null, manualAccepted); });
        }
        else { btn.disabled = false; btn.textContent = '重试原订单支付'; }
      }
    } finally { busy = false; }
  }
  grid.addEventListener('click', function (event) {
    var b = event.target.closest && event.target.closest('[data-plan]'); if (!b) return;
    var plan = b.getAttribute('data-plan');
    if (plan === 'free') { toast('请在微信小程序中使用免费版。'); return; }
    checkout(plan);
  });
  // Intercept the existing React login entry before its placeholder dialog opens.
  document.addEventListener('click', function (event) {
    var b = event.target.closest && event.target.closest('button');
    if (b && !mask.contains(b) && !grid.contains(b) && ((b.matches && b.matches('button.nav-login')) || /^(请先登录|微信登录|登录|登录 \/ 注册|登录\/注册|注册\/登录)$/.test(b.textContent.trim()))) {
      event.preventDefault(); event.stopImmediatePropagation(); showLogin();
    }
  }, true);
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(updateNav).observe(document.body, { childList: true, subtree: true });
  }
  document.getElementById('r2payClose').addEventListener('click', close);
  mask.addEventListener('click', function (event) { if (event.target === mask) close(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') close(); });
  async function init() {
    render();
    if (await completeWechatOauth()) return;
    await loadWebUser().catch(function () {});
    await api('/api/auth/wechat/me').then(function (data) { siteUser = data.user; updateNav(); }).catch(function () {});
    var purchaseIntent = new URLSearchParams(location.search).get('member') === '1' || location.hash === '#member';
    if (purchaseIntent) {
      if (webUser || siteUser) { await checkout(null); return; }
      showLogin(); return;
    }
    var order = read('order');
    if (order) await resume(order);
    else if (read('attempt')) { var attempt = read('attempt'); var g = view('恢复未确认订单', '上次请求结果尚未确认，继续时将查询或重试同一笔订单。'); button('恢复原订单', function () { checkout(attempt.plan); }); }
  }
  init().catch(function (error) { view('无法恢复购买凭据', errorText(error)); });
})();
