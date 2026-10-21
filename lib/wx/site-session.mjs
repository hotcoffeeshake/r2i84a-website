import {createHmac,timingSafeEqual,randomBytes} from 'node:crypto';
export const SESSION_COOKIE='__Host-r2_site_session';
export function sessionKey(){const secret=process.env.JWT_SECRET;if(!secret||Buffer.byteLength(secret)<32)throw new Error('Session not configured');return createHmac('sha256',secret).update('r2i84a-site-session-v1').digest();}
export function signSession(userId,now=Math.floor(Date.now()/1000)){
 const payload=Buffer.from(JSON.stringify({sub:userId,aud:'r2i84a-site',iat:now,exp:now+86400,jti:randomBytes(16).toString('hex')})).toString('base64url');
 return payload+'.'+createHmac('sha256',sessionKey()).update(payload).digest('base64url');
}
export function verifySession(token,now=Math.floor(Date.now()/1000)){
 if(typeof token!=='string'||token.length>2048)return null;
 const parts=token.split('.');if(parts.length!==2||!parts.every(p=>/^[\w-]+$/.test(p)))return null;
 const expected=createHmac('sha256',sessionKey()).update(parts[0]).digest();const given=Buffer.from(parts[1],'base64url');
 if(given.length!==expected.length||!timingSafeEqual(given,expected))return null;
 try{const p=JSON.parse(Buffer.from(parts[0],'base64url'));return p.aud==='r2i84a-site'&&typeof p.sub==='string'&&/^[0-9a-f-]{36}$/.test(p.sub)&&Number.isInteger(p.iat)&&Number.isInteger(p.exp)&&p.iat<=now+60&&p.exp>now&&p.exp-p.iat===86400?{id:p.sub,nickname:'微信用户'}:null;}catch{return null;}
}
export function cookie(name,value,maxAge){return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;}
