import { bindPair } from '../../lib/wx/pair-store.mjs';
import { verifyWechatSignature } from '../../lib/wx/signature.mjs';

import { readXmlBody, parseWechatXml, textReply } from '../../lib/wx/xml.mjs';

// Passive replies only; persist a pairing before acknowledging it.
export default async function callback(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const send = (status, text) => { res.statusCode = status; res.end(text); };
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return send(405, 'Method not allowed');
  }
  const token = process.env.WX_TOKEN;
  if (!token) return send(503, 'Callback not configured');
  const params = new URL(req.url, 'https://r2i84a.chat').searchParams;
  if (!verifyWechatSignature(params, token)) return send(403, 'Forbidden');
  if (params.has('encrypt_type') || params.has('msg_signature')) return send(400, 'Plaintext mode required');
  if (req.method === 'POST') {
    if (!/^(text|application)\/xml(?:;|$)/i.test(req.headers?.['content-type'] || '')) return send(415, 'XML required');
    let fields;
    try { fields = parseWechatXml(await readXmlBody(req)); }
    catch { return send(400, 'Invalid plaintext XML'); }
    if (fields.MsgType === 'event' && fields.Event === 'subscribe') {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return send(200, textReply(fields, '欢迎关注！打开 r2i84a.chat，点击"微信登录"，把页面上的 6 位数字发给我，即可自动登录。'));
    }
    if (fields.MsgType === 'event' && fields.Event === 'unsubscribe') return send(200, 'success');
    if (fields.MsgType === 'text') {
      let reply='回复网页上的 6 位数字即可登录。网站：https://r2i84a.chat';
      if (/^\d{6}$/.test(fields.Content || '')) {
        if (Math.abs(Date.now()/1000-Number(params.get('timestamp')))>300) return send(403,'Stale callback');
        if (process.env.WX_ACCOUNT_ID && fields.ToUserName!==process.env.WX_ACCOUNT_ID) return send(403,'Unexpected account');
        try { reply=await bindPair(fields) ? '✅ 配对成功，请回到网页，页面会自动登录。' : '该登录码无效或已过期。请回到网页刷新一个新的 6 位登录码再发送。'; }
        catch { return send(503,'Pairing unavailable'); }
      }
      res.setHeader('Content-Type','application/xml; charset=utf-8');
      return send(200,textReply(fields,reply));
    }
    return send(200, 'success');
  }
  if (params.getAll('echostr').length !== 1 || params.get('echostr').length > 1024) return send(400, 'Invalid echostr');
  return send(200, params.get('echostr'));
}
