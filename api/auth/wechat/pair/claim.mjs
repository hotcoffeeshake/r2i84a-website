import {claimPair} from '../../../../lib/wx/pair-store.mjs';
import {cookie,sessionKey,signSession,SESSION_COOKIE} from '../../../../lib/wx/site-session.mjs';
import {cookies,send,method,sameOrigin,body} from '../../../../lib/wx/http.mjs';
export default async function claim(req,res){
 if(!method(req,res,'POST'))return;if(!sameOrigin(req))return send(res,403,{error:'FORBIDDEN'});
 const token=cookies(req).wx_pair_token;if(!/^[a-f0-9]{32}$/.test(token||''))return send(res,403,{error:'FORBIDDEN'});
 let data;try{data=await body(req);if(!/^\d{6}$/.test(data.code||'')||typeof data.code!=='string')throw 0;}catch{return send(res,400,{error:'INVALID_REQUEST'});}
 try{sessionKey();const result=await claimPair(data.code,token);
 if(result.status==='forbidden')return send(res,403,{error:'FORBIDDEN'});
 if(result.status==='expired')return send(res,401,{status:'expired'});
 if(result.status==='ok')res.setHeader('Set-Cookie',cookie(SESSION_COOKIE,signSession(result.userId),86400));
 return send(res,200,{status:result.status});
 }catch{return send(res,503,{error:'LOGIN_UNAVAILABLE'});}
}
