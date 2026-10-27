(function(){
 'use strict';
 var codeEl=document.getElementById('pairCode'),statusEl=document.getElementById('pairStatus'),copy=document.getElementById('copyCode'),refresh=document.getElementById('refreshCode');
 var current='',expires=0,timer,generation=0,copyTimer;
 function status(text,waiting){statusEl.textContent=text;statusEl.classList.toggle('waiting',!!waiting);}
 function returnPath(){try{sessionStorage.removeItem('login_return');}catch(_){}return '/';}
 async function request(path,data){var response=await fetch('/api/auth/wechat/'+path,{method:data?'POST':'GET',credentials:'same-origin',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,cache:'no-store',signal:AbortSignal.timeout(8000)});var result;try{result=await response.json();}catch(_){throw new Error('暂时无法连接登录服务，请重试。');}return {ok:response.ok,status:response.status,data:result};}
 function expired(){clearTimeout(timer);current='';copy.disabled=true;status('登录码已过期，请重新获取。');refresh.hidden=false;}
 async function poll(g){if(g!==generation)return;if(Date.now()>=expires)return expired();var delay=2000;
 try{var r=await request('pair/claim',{code:current});if(g!==generation)return;
 if(r.ok&&r.data.status==='ok'){status('✅ 配对成功，正在进入…');if(window.r2track)window.r2track('login','pair_success');copy.disabled=true;location.replace(returnPath());return;}
 if(r.status===401||r.status===403)return expired();
 if(!r.ok){delay=5000;status('网络暂时不稳定，正在重试…',true);}else status('等待你在公众号发送登录码…',true);
 }catch(_){delay=5000;if(g===generation)status('网络暂时不稳定，正在重试…',true);}
 if(g===generation)timer=setTimeout(function(){poll(g);},Math.min(delay,Math.max(0,expires-Date.now())));
 }
 async function start(){var g=++generation;clearTimeout(timer);current='';codeEl.textContent='······';copy.disabled=true;refresh.hidden=true;status('正在获取登录码…');
 try{if(!navigator.locks)throw new Error('请使用新版浏览器打开登录页面。');var r=await navigator.locks.request('r2_wechat_pair_start',function(){return request('pair/start',{});});if(g!==generation)return;
 if(!r.ok)throw new Error(r.status===429?'获取过于频繁，请稍后重试。':'暂时无法获取登录码，请重试。');
 if(!/^\d{6}$/.test(r.data.code)||r.data.expiresIn!==300)throw new Error('登录码暂不可用，请重试。');
 current=r.data.code;expires=Date.now()+r.data.expiresIn*1000;codeEl.textContent=current;copy.disabled=false;status('等待你在公众号发送登录码…',true);timer=setTimeout(function(){poll(g);},2000);
 }catch(e){if(g===generation){status(e.name==='TypeError'||e.name==='TimeoutError'?'网络连接失败或超时，请重试。':e.message);refresh.hidden=false;}}
 }
 copy.addEventListener('click',async function(){try{await navigator.clipboard.writeText(current);copy.textContent='已复制 ✓';clearTimeout(copyTimer);copyTimer=setTimeout(function(){copy.textContent='复制';},2000);}catch(_){status('请长按或选中上方 6 位数字复制。');}});
 refresh.addEventListener('click',start);window.addEventListener('pagehide',function(){generation++;clearTimeout(timer);});
 window.addEventListener('pageshow',function(event){if(event.persisted){if(current&&Date.now()<expires){var g=++generation;poll(g);}else start();}});
 start();
})();
