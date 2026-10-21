import { verifyWechatSignature } from '../../lib/wx/signature.mjs';

import { readXmlBody, parseWechatXml, textReply } from '../../lib/wx/xml.mjs';

// Step 2: passive welcome message. Pair-code business remains gated.
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
    // Do not acknowledge a pairing attempt until step 3 has been implemented.
    if (fields.MsgType === 'text') return send(503, 'Pairing pending welcome-message acceptance');
    return send(200, 'success');
  }
  if (params.getAll('echostr').length !== 1 || params.get('echostr').length > 1024) return send(400, 'Invalid echostr');
  return send(200, params.get('echostr'));
}
