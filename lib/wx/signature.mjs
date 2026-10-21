import { createHash, timingSafeEqual } from 'node:crypto';

/** WeChat plaintext callback signature; reject ambiguous duplicate parameters. */
export function verifyWechatSignature(params, token) {
  if (typeof token !== 'string' || !token) return false;
  for (const key of ['signature', 'timestamp', 'nonce']) {
    if (params.getAll(key).length !== 1) return false;
  }
  const signature = params.get('signature');
  const timestamp = params.get('timestamp');
  const nonce = params.get('nonce');
  if (!/^[a-f0-9]{40}$/.test(signature) || !/^\d{1,16}$/.test(timestamp) || !nonce || nonce.length > 256) return false;
  const expected = createHash('sha1').update([token, timestamp, nonce].sort().join('')).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
