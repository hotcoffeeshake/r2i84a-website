export function cookies(req){const out={};for(const part of (req.headers?.cookie||'').split(';')){const i=part.indexOf('=');if(i<0)continue;const key=part.slice(0,i).trim();if(Object.hasOwn(out,key))out[key]='';else out[key]=part.slice(i+1).trim();}return out;}
export function send(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(data));}
export function method(req,res,allowed){if(req.method===allowed)return true;res.setHeader('Allow',allowed);send(res,405,{error:'METHOD_NOT_ALLOWED'});return false;}
export function sameOrigin(req){const origin=req.headers?.origin;const host=req.headers?.host;return typeof host==='string'&&origin===`https://${host}`&&(!req.headers['sec-fetch-site']||req.headers['sec-fetch-site']==='same-origin');}
export async function body(req){
 if(!/^application\/json(?:;|$)/i.test(req.headers?.['content-type']||''))throw new Error('Invalid body');
 let raw=req.body;
 if(raw===undefined){const chunks=[];let n=0;for await(const c of req){n+=c.length;if(n>1024)throw new Error('Too large');chunks.push(c);}raw=Buffer.concat(chunks).toString();}
 if(typeof raw==='object'&&!Buffer.isBuffer(raw)){if(JSON.stringify(raw).length>1024||!raw||Array.isArray(raw))throw new Error('Invalid body');return raw;}
 if(Buffer.byteLength(raw)>1024)throw new Error('Too large');const result=JSON.parse(raw.toString());if(!result||typeof result!=='object'||Array.isArray(result))throw new Error('Invalid body');return result;
}
