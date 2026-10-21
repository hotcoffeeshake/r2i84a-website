// Extend a private prebuilt deployment request; never rebuild or change payment.
import {readFileSync,writeFileSync} from 'node:fs';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw new Error('Usage: node tools/add-wx-callback-artifact.mjs input.json output.json');
const request=JSON.parse(readFileSync(input,'utf8'));
const payment=request.files.filter(f=>f.file.startsWith('.vercel/output/functions/api/web.func/'));
if(!payment.length)throw new Error('Existing payment function must be preserved');
const libs=['signature','xml','pair-store','site-session','http'].map(n=>'lib/wx/'+n+'.mjs');
for(const entry of ['api/wx/callback','api/auth/wechat/pair/start','api/auth/wechat/pair/claim','api/auth/wechat/me','api/auth/wechat/logout']){
 const prefix='.vercel/output/functions/'+entry+'.func/';
 request.files=request.files.filter(f=>!f.file.startsWith(prefix));
 for(const path of [entry+'.mjs',...libs])request.files.push({file:prefix+path,data:readFileSync(path).toString('base64'),encoding:'base64'});
 request.files.push({file:prefix+'.vc-config.json',data:JSON.stringify({runtime:'nodejs24.x',handler:entry+'.mjs',launcherType:'Nodejs',regions:['iad1'],maxDuration:5}),encoding:'utf-8'});
}
for(const path of ['index.html','assets/web-commerce.js','wechat-login.html','assets/wechat-login.js','assets/wechat-login.css']){
 const file='.vercel/output/static/'+path;
 request.files=request.files.filter(f=>f.file!==file);
 request.files.push({file,data:readFileSync(path).toString('base64'),encoding:'base64'});
}
const configFile=request.files.find(f=>f.file==='.vercel/output/config.json');
if(!configFile?.data)throw new Error('Private request must include current config.json data');
const config=JSON.parse(configFile.encoding==='base64'?Buffer.from(configFile.data,'base64').toString():configFile.data);
config.overrides={...config.overrides,'wechat-login.html':{path:'wechat-login'}};
Object.assign(configFile,{data:JSON.stringify(config),encoding:'utf-8'});delete configFile.sha;
request.autoAssignCustomDomains=false;request.meta={...request.meta,change:'wechat-pair-login-step-3'};
if(JSON.stringify(payment)!==JSON.stringify(request.files.filter(f=>f.file.startsWith('.vercel/output/functions/api/web.func/'))))throw new Error('Payment artifact changed');
writeFileSync(output,JSON.stringify(request));
console.log(`Built pairing functions and login page; preserved ${payment.length} payment files`);
