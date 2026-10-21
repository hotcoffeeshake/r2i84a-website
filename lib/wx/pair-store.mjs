import { createHash, randomInt, randomUUID } from 'node:crypto';
export const digest = value => createHash('sha256').update(value).digest('hex');
export async function query(query, params = []) {
 const connection = process.env.POSTGRES_URL;
 const url = new URL(connection);
 if (!['postgres:','postgresql:'].includes(url.protocol) || !/^[a-z0-9-]+\.[a-z0-9.-]+\.neon\.tech$/.test(url.hostname)) throw new Error('Database not configured');
 const endpoint = 'https://api.' + url.hostname.split('.').slice(1).join('.') + '/sql';
 const response = await fetch(endpoint, {method:'POST',headers:{'Content-Type':'application/json','Neon-Connection-String':connection,'Neon-Raw-Text-Output':'false'},body:JSON.stringify({query,params}),signal:AbortSignal.timeout(2800)});
 if (!response.ok) throw new Error('Database unavailable');
 const result = await response.json();
 if (!Array.isArray(result.rows)) throw new Error('Database unavailable');
 return result.rows;
}
export async function startPair(token, ip) {
 for(let i=0;i<5;i++) {
  const code=String(randomInt(100000,1000000));
  const [row]=await query('SELECT wx_pair_start($1,$2,$3) AS result',[code,digest(token),digest(ip)]);
  if(row.result.status!=='collision')return row.result;
 }
 throw new Error('Codes unavailable');
}
export async function bindPair(fields) {
 if(!/^\d{1,24}$/.test(fields.MsgId||''))throw new Error('Missing message ID');
 const message=digest(JSON.stringify([fields.ToUserName,fields.FromUserName,fields.MsgId]));
 const [row]=await query('SELECT wx_pair_bind($1,$2,$3,$4,$5,$6) AS result',[fields.Content,fields.ToUserName,fields.FromUserName,message,fields.CreateTime,randomUUID()]);
 return row.result===true;
}
export async function claimPair(code,token){const [row]=await query('SELECT wx_pair_claim($1,$2) AS result',[code,digest(token)]);return row.result;}
