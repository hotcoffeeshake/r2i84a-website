import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Readable} from 'node:stream';
import callback from '../api/wx/callback.mjs';
import {parseWechatXml,readXmlBody,textReply} from '../lib/wx/xml.mjs';
const token='test-welcome-token';
const xml=(event='subscribe')=>`<xml><ToUserName><![CDATA[gh_test]]></ToUserName><FromUserName><![CDATA[openid_test]]></FromUserName><CreateTime>1792560000</CreateTime><MsgType>event</MsgType><Event>${event}</Event></xml>`;
async function post(body, valid=true){
 const old=process.env.WX_TOKEN;process.env.WX_TOKEN=token;
 const signature=valid?createHash('sha1').update([token,'1792560000','nonce'].sort().join('')).digest('hex'):'0'.repeat(40);
 const req=Readable.from([Buffer.from(body)]);Object.assign(req,{method:'POST',url:`/api/wx/callback?timestamp=1792560000&nonce=nonce&signature=${signature}`,headers:{'content-type':'text/xml; charset=utf-8'}});
 let value,ends=0;const headers={};const res={setHeader(k,v){headers[k]=v},end(v){ends++;value=v}};
 try{await callback(req,res);}finally{if(old===undefined)delete process.env.WX_TOKEN;else process.env.WX_TOKEN=old;}
 assert.equal(ends,1);return {status:res.statusCode,body:value,headers};
}
test('subscribe swaps identities and replies welcome exactly once',async()=>{const r=await post(xml());assert.equal(r.status,200);const f=parseWechatXml(r.body);assert.equal(f.ToUserName,'openid_test');assert.equal(f.FromUserName,'gh_test');assert.equal(f.MsgType,'text');assert.equal(f.Content,'欢迎关注！打开 r2i84a.chat，点击"微信登录"，把页面上的 6 位数字发给我，即可自动登录。');assert.match(r.headers['Content-Type'],/^application\/xml/);});
test('duplicate event returns identical response',async()=>assert.equal((await post(xml())).body,(await post(xml())).body));
test('unsubscribe returns success only',async()=>assert.deepEqual((await post(xml('unsubscribe'))).body,'success'));
test('forged signature rejected',async()=>assert.equal((await post(xml(),false)).status,403));
test('DTD rejected',async()=>assert.equal((await post('<!DOCTYPE xml>'+xml())).status,400));
test('duplicate identity rejected',async()=>assert.equal((await post(xml().replace('</xml>','<FromUserName>other</FromUserName></xml>'))).status,400));
test('encrypted body rejected',async()=>assert.equal((await post('<xml><Encrypt>secret</Encrypt></xml>')).status,400));
test('oversize body rejected',async()=>assert.equal((await post('x'.repeat(65537))).status,400));
test('stale pairing callback is rejected',async()=>assert.equal((await post(xml().replace('<MsgType>event</MsgType>','<MsgType>text</MsgType><Content>123456</Content>'))).status,403));
test('reply safely escapes all XML special characters',()=>{const f=parseWechatXml(xml());const text='&<>"\' ]]> 中文';assert.equal(parseWechatXml(textReply(f,text)).Content,text);});
test('body reader supports parsed body',async()=>assert.equal(await readXmlBody({body:xml()}),xml()));
test('malformed or nested XML rejected',()=>{assert.throws(()=>parseWechatXml(xml().replace('<Event>subscribe</Event>','<Event><x>subscribe</x></Event>')));assert.throws(()=>parseWechatXml(xml().replace('gh_test','x]]>&evil;<![CDATA[y')));});
test('keyword 速查 replies with quiz guide link',async()=>{const r=await post(xml().replace('<MsgType>event</MsgType><Event>subscribe</Event>','<MsgType>text</MsgType><Content>速查</Content>'));assert.equal(r.status,200);assert.match(parseWechatXml(r.body).Content,/https:\/\/r2i84a\.chat\/quiz-guide$/);});
test('other text still gets login hint',async()=>{const r=await post(xml().replace('<MsgType>event</MsgType><Event>subscribe</Event>','<MsgType>text</MsgType><Content>你好</Content>'));assert.match(parseWechatXml(r.body).Content,/6 位数字/);});
