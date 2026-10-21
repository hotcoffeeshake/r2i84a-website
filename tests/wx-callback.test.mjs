import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import callback from '../api/wx/callback.mjs';

const token = 'test-token-not-a-production-secret';
function query(extra = {}) {
  const timestamp = '1792560000', nonce = '123456';
  return new URLSearchParams({timestamp,nonce,signature:createHash('sha1').update([token,timestamp,nonce].sort().join('')).digest('hex'),echostr:'123456789',...extra});
}
async function call(params, method='GET', configured=true) {
  const old = process.env.WX_TOKEN;
  if(configured) process.env.WX_TOKEN=token; else delete process.env.WX_TOKEN;
  const headers={};let body,ends=0;
  const res={setHeader(k,v){headers[k]=v;},end(s){body=s;ends++;}};
  try { await callback({method,url:'/api/wx/callback?'+params},res); }
  finally { if(old===undefined)delete process.env.WX_TOKEN;else process.env.WX_TOKEN=old; }
  assert.equal(ends,1);
  return {status:res.statusCode,body,headers};
}
test('valid signature echoes exact decoded text without caching',async()=>{
 const r=await call(query({echostr:'a+b<&>'}));assert.equal(r.status,200);assert.equal(r.body,'a+b<&>');assert.equal(r.headers['Cache-Control'],'no-store');assert.match(r.headers['Content-Type'],/^text\/plain/);
});
test('invalid signature rejected',async()=>assert.equal((await call(query({signature:'0'.repeat(40)}))).status,403));
test('tampered nonce rejected',async()=>assert.equal((await call(query({nonce:'other'}))).status,403));
test('malformed signature rejected',async()=>assert.equal((await call(query({signature:'bad'}))).status,403));
test('duplicate signature rejected',async()=>{const p=query();p.append('signature',p.get('signature'));assert.equal((await call(p)).status,403);});
test('missing nonce rejected',async()=>{const p=query();p.delete('nonce');assert.equal((await call(p)).status,403);});
test('missing echostr rejected',async()=>{const p=query();p.delete('echostr');assert.equal((await call(p)).status,400);});
test('duplicate echostr rejected',async()=>{const p=query();p.append('echostr','x');assert.equal((await call(p)).status,400);});
test('encrypted mode is not silently accepted',async()=>assert.equal((await call(query({encrypt_type:'aes'}))).status,400));
test('missing configuration fails closed',async()=>assert.equal((await call(query(),'GET',false)).status,503));
test('POST requires XML content type',async()=>assert.equal((await call(query(),'POST')).status,415));
test('unsupported methods rejected',async()=>assert.equal((await call(query(),'PUT')).status,405));
