import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import callback from '../api/wx/callback.mjs';

const token = 'test-token-not-a-production-secret';
function query(extra = {}) {
  const timestamp = '1792560000', nonce = '123456';
  return new URLSearchParams({timestamp,nonce,signature:createHash('sha1').update([token,timestamp,nonce].sort().join('')).digest('hex'),echostr:'123456789',...extra});
}
function call(params, method='GET', configured=true) {
  const old = process.env.WX_TOKEN;
  if(configured) process.env.WX_TOKEN=token; else delete process.env.WX_TOKEN;
  const headers={};let body,ends=0;
  const res={setHeader(k,v){headers[k]=v;},end(s){body=s;ends++;}};
  try { callback({method,url:'/api/wx/callback?'+params},res); }
  finally { if(old===undefined)delete process.env.WX_TOKEN;else process.env.WX_TOKEN=old; }
  assert.equal(ends,1);
  return {status:res.statusCode,body,headers};
}
test('valid signature echoes exact decoded text without caching',()=>{
 const r=call(query({echostr:'a+b<&>'}));assert.equal(r.status,200);assert.equal(r.body,'a+b<&>');assert.equal(r.headers['Cache-Control'],'no-store');assert.match(r.headers['Content-Type'],/^text\/plain/);
});
test('invalid signature rejected',()=>assert.equal(call(query({signature:'0'.repeat(40)})).status,403));
test('tampered nonce rejected',()=>assert.equal(call(query({nonce:'other'})).status,403));
test('malformed signature rejected',()=>assert.equal(call(query({signature:'bad'})).status,403));
test('duplicate signature rejected',()=>{const p=query();p.append('signature',p.get('signature'));assert.equal(call(p).status,403);});
test('missing nonce rejected',()=>{const p=query();p.delete('nonce');assert.equal(call(p).status,403);});
test('missing echostr rejected',()=>{const p=query();p.delete('echostr');assert.equal(call(p).status,400);});
test('duplicate echostr rejected',()=>{const p=query();p.append('echostr','x');assert.equal(call(p).status,400);});
test('encrypted mode is not silently accepted',()=>assert.equal(call(query({encrypt_type:'aes'})).status,400));
test('missing configuration fails closed',()=>assert.equal(call(query(),'GET',false).status,503));
test('valid POST fails explicitly until next approved acceptance step',()=>assert.equal(call(query(),'POST').status,503));
test('unsupported methods rejected',()=>assert.equal(call(query(),'PUT').status,405));
