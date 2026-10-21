import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/wechat-login.js',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function browser(fetch,locks){
 const events={},elements=new Map(),timers=new Map();let timerId=0;const redirects=[];
 const el=id=>{if(!elements.has(id))elements.set(id,{textContent:'',classList:{toggle(){}},addEventListener(name,fn){this[name]=fn;}});return elements.get(id);};
 const sandbox={document:{getElementById:el},window:{addEventListener(name,fn){events[name]=fn;}},navigator:{locks,clipboard:{writeText:async()=>{}}},location:{origin:'https://r2i84a.chat',replace:p=>redirects.push(p)},sessionStorage:{getItem:()=>'/home',removeItem(){}},fetch,URL,AbortSignal,Date,console,setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);}};
 vm.runInNewContext(source,sandbox);return {events,elements,redirects,timers};
}
const response=data=>({ok:true,status:200,json:async()=>data});
test('two first-load tabs serialize start so the second request sees the first cookie',async()=>{
 let queue=Promise.resolve(),cookie='',seen=[];const locks={request(name,fn){assert.equal(name,'r2_wechat_pair_start');const result=queue.then(fn);queue=result.catch(()=>{});return result;}};
 const fetch=async path=>{assert.match(path,/pair\/start$/);seen.push(cookie);await tick();if(!cookie)cookie='browser-token';return response({code:'123456',expiresIn:300});};
 browser(fetch,locks);browser(fetch,locks);for(let i=0;i<8;i++)await tick();assert.deepEqual(seen,['','browser-token']);
});
test('bfcache return resumes existing code claim and never invalidates a bound code',async()=>{
 let starts=0,claims=[];const b=browser(async(path,options)=>{if(path.endsWith('/start')){starts++;return response({code:'345678',expiresIn:300});}claims.push(JSON.parse(options.body).code);return response({status:'ok'});},{request:(_,fn)=>fn()});
 await tick();b.events.pagehide();assert.equal(b.timers.size,0);b.events.pageshow({persisted:true});await tick();assert.equal(starts,1);assert.deepEqual(claims,['345678']);assert.deepEqual(b.redirects,['/home']);
});
test('unsupported browser does not create a racing first-session pairing',async()=>{let called=false;const b=browser(async()=>{called=true;});await tick();assert.equal(called,false);assert.match(b.elements.get('pairStatus').textContent,/新版浏览器/);});
