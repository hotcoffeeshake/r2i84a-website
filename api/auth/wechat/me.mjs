import {verifySession,SESSION_COOKIE} from '../../../lib/wx/site-session.mjs';
import {cookies,send,method} from '../../../lib/wx/http.mjs';
export default function me(req,res){if(!method(req,res,'GET'))return;try{const user=verifySession(cookies(req)[SESSION_COOKIE]);send(res,user?200:401,user?{user}:{error:'UNAUTHORIZED'});}catch{send(res,503,{error:'LOGIN_UNAVAILABLE'});}}
