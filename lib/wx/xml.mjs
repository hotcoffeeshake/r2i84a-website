const LIMIT = 65536;
export async function readXmlBody(req) {
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    if (Buffer.byteLength(req.body) > LIMIT) throw new Error('Body too large');
    return req.body.toString();
  }
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    const cleanup = () => { clearTimeout(timer); req.off('data', data); req.off('end', end); req.off('error', error); req.off('aborted', error); };
    const error = () => { cleanup(); reject(new Error('Invalid body')); };
    const data = chunk => {
      size += chunk.length;
      if (size > LIMIT) { error(); req.resume(); return; }
      chunks.push(Buffer.from(chunk));
    };
    const end = () => { cleanup(); resolve(Buffer.concat(chunks).toString('utf8')); };
    const timer = setTimeout(() => { error(); req.resume(); }, 1500);
    req.on('data', data); req.on('end', end); req.on('error', error); req.on('aborted', error);
  });
}
function decode(text) {
  return text.replace(/&([^;]*);/g, (_, entity) => {
    const named = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};
    if (Object.hasOwn(named,entity)) return named[entity];
    if (!/^#(?:[0-9]+|x[0-9a-fA-F]+)$/.test(entity)) throw new Error('Invalid entity');
    const n = entity.startsWith('#x') ? parseInt(entity.slice(2),16) : Number(entity.slice(1));
    if (!(n===9||n===10||n===13||n>=32&&n<=0xD7FF||n>=0xE000&&n<=0xFFFD||n>=0x10000&&n<=0x10FFFF)) throw new Error('Invalid character');
    return String.fromCodePoint(n);
  });
}
export function parseWechatXml(xml) {
  if (Buffer.byteLength(xml)>LIMIT || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Invalid XML');
  const root = xml.trim().match(/^(?:<\?xml\s[^?]*\?>\s*)?<xml>([\s\S]*)<\/xml>$/);
  if (!root) throw new Error('Invalid XML');
  const fields = Object.create(null);
  let rest=root[1].trim();
  while(rest) {
    const m=rest.match(/^<([A-Za-z][A-Za-z0-9_]*)>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<&]*(?:(?:&[^;\s]+;)[^<&]*)*))<\/\1>/);
    if(!m || (m[2] !== undefined && m[2].includes(']]>')) || (m[3] !== undefined && m[3].includes(']]>')) || Object.hasOwn(fields,m[1])) throw new Error('Invalid XML field');
    fields[m[1]]=m[2]!==undefined?m[2]:decode(m[3]);rest=rest.slice(m[0].length).trim();
  }
  if(fields.Encrypt!==undefined)throw new Error('Plaintext mode required');
  if(!fields.FromUserName||!fields.ToUserName||!fields.MsgType||!/^\d{1,16}$/.test(fields.CreateTime||''))throw new Error('Missing fields');
  if(fields.FromUserName.length>256||fields.ToUserName.length>256)throw new Error('Invalid identity');
  return fields;
}
export function textReply(fields, text) {
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  // Deterministic on WeChat retries; no state change or external send API.
  return `<xml><ToUserName>${escape(fields.FromUserName)}</ToUserName><FromUserName>${escape(fields.ToUserName)}</FromUserName><CreateTime>${fields.CreateTime}</CreateTime><MsgType>text</MsgType><Content>${escape(text)}</Content></xml>`;
}
