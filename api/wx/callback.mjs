import { verifyWechatSignature } from '../../lib/wx/signature.mjs';

// Step 1 of the approved execution plan: server URL verification only.
// Message handling is deliberately gated until the account setup is verified.
export default function callback(req, res) {
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
  if (req.method === 'POST') return send(503, 'Message handling pending account verification');
  if (params.getAll('echostr').length !== 1 || params.get('echostr').length > 1024) return send(400, 'Invalid echostr');
  return send(200, params.get('echostr'));
}
