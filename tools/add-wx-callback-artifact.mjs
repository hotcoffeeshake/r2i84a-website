// Extend an existing, private prebuilt deployment request; never rebuild payment.
import { readFileSync, writeFileSync } from 'node:fs';
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node tools/add-wx-callback-artifact.mjs input.json output.json');
const request = JSON.parse(readFileSync(input, 'utf8'));
const paymentFiles = request.files.filter(f => f.file.startsWith('.vercel/output/functions/api/web.func/'));
if (!paymentFiles.length) throw new Error('Existing payment function must be preserved');
const prefix = '.vercel/output/functions/api/wx/callback.func/';
const files = ['api/wx/callback.mjs', 'lib/wx/signature.mjs'].map(path => ({
  file: prefix + path,
  data: readFileSync(path).toString('base64'), encoding: 'base64'
}));
files.push({file: prefix + '.vc-config.json', data: JSON.stringify({
  runtime: 'nodejs24.x', handler: 'api/wx/callback.mjs', launcherType: 'Nodejs',
  regions: ['iad1'], maxDuration: 5
}), encoding: 'utf-8'});
request.files = request.files.filter(f => !f.file.startsWith(prefix)).concat(files);
request.autoAssignCustomDomains = false;
request.meta = {...request.meta, change: 'wechat-callback-step-1'};
if (JSON.stringify(paymentFiles) !== JSON.stringify(request.files.filter(f => f.file.startsWith('.vercel/output/functions/api/web.func/')))) throw new Error('Payment artifact changed');
writeFileSync(output, JSON.stringify(request));
console.log(`Added callback function; preserved ${paymentFiles.length} payment files`);
