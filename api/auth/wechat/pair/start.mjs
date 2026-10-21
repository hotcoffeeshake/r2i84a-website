import {randomBytes} from 'node:crypto';
import {startPair} from '../../../../lib/wx/pair-store.mjs';
import {cookie,sessionKey} from '../../../../lib/wx/site-session.mjs';
import {cookies,send,method,sameOrigin,body} from '../../../../lib/wx/http.mjs';
export default async function start(req,res){
 if(!method(req,res,'POST'))return;if(!sameOrigin(req))return send(res,403,{error:'FORBIDDEN'});
 try{await body(req);}catch{return send(res,400,{error:'INVALID_REQUEST'});}
 try{
 sessionKey();
 const current=cookies(req).wx_pair_token;const token=/^[a-f0-9]{32}$/.test(current||'')?current:randomBytes(16).toString('hex');
 // Vercel overwrites x-vercel-forwarded-for with the platform-observed source IP.
 const ip=req.headers['x-vercel-forwarded-for']?.split(',')[0]?.trim();
 if(!ip)return send(res,503,{error:'SOURCE_UNAVAILABLE'});
 const result=await startPair(token,ip);
 if(result.status==='limited'){res.setHeader('Retry-After','60');return send(res,429,{error:'RATE_LIMITED'});}
 res.setHeader('Set-Cookie',cookie('wx_pair_token',token,1800));send(res,200,result);
 }catch{send(res,503,{error:'LOGIN_UNAVAILABLE'});}
}
