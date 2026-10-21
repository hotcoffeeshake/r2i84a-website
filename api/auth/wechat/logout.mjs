import {cookie,SESSION_COOKIE} from '../../../lib/wx/site-session.mjs';
import {send,method,sameOrigin} from '../../../lib/wx/http.mjs';
export default function logout(req,res){if(!method(req,res,'POST'))return;if(!sameOrigin(req))return send(res,403,{error:'FORBIDDEN'});res.setHeader('Set-Cookie',cookie(SESSION_COOKIE,'',0));send(res,200,{ok:true});}
