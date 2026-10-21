# Manual integration test: PG* environment must target the approved database.
# Creates and removes only its own random isolated schema. No production tables touched.
import subprocess,secrets,pathlib,json,concurrent.futures,os
schema='wx_pair_test_'+secrets.token_hex(6)
def sql(s):
 r=subprocess.run(['psql','-X','-qAt','-v','ON_ERROR_STOP=1'],input='BEGIN; SET LOCAL search_path TO '+schema+';\n'+s+'\nCOMMIT;',text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr)
 return r.stdout.strip()
def start(c,t,ip):return json.loads(sql(f"SELECT wx_pair_start('{c}','{t}','{ip}');"))
def claim(c,t):return json.loads(sql(f"SELECT wx_pair_claim('{c}','{t}');"))
def bind(c,o,msg,acct='gh_test',ts='floor(extract(epoch FROM clock_timestamp()))::bigint'):
 return sql(f"SELECT wx_pair_bind('{c}','{acct}','{o}','{msg}',{ts},'00000000-0000-4000-8000-{secrets.token_hex(6)}');")=='t'
try:
 sql('CREATE SCHEMA '+schema+'; SET search_path TO '+schema+';\n'+pathlib.Path('migrations/20261021-wechat-pair.sql').read_text())
 assert start('100001','token1','ip1')['code']=='100001'
 assert claim('100001','wrong')['status']=='forbidden'
 assert claim('100001','token1')['status']=='pending'
 assert bind('100001','open1','msg1');assert bind('100001','open1','msg1');assert not bind('100001','open2','msg2')
 with concurrent.futures.ThreadPoolExecutor(2) as pool:r=list(pool.map(lambda _:claim('100001','token1'),range(2)))
 assert sorted(x['status'] for x in r)==['expired','ok'];uid=next(x['userId'] for x in r if x['status']=='ok')
 assert bind('100001','open1','msg1')
 assert start('100002','token2','ip2')['code']=='100002';assert bind('100002','open1','msg3');assert claim('100002','token2')['userId']==uid
 assert start('100003','token3','ip3')['code']=='100003';assert start('100004','token3','ip3')['code']=='100004';assert claim('100003','token3')['status']=='expired'
 assert not bind('100004','open1','oldmsg',ts='1')
 sql("UPDATE wechat_pair_codes SET expires_at=clock_timestamp()-interval '1 second' WHERE code='100004';")
 assert claim('100004','token3')['status']=='expired';assert not bind('100004','open1','expiredmsg')
 with concurrent.futures.ThreadPoolExecutor(5) as pool:r=list(pool.map(lambda i:start(str(200000+i),'rate-token','rate-ip'),range(5)))
 assert sum(x.get('status')=='limited' for x in r)==2
 with concurrent.futures.ThreadPoolExecutor(8) as pool:r=list(pool.map(lambda i:start(str(300000+i),'ip-token'+str(i),'shared-ip'),range(22)))
 assert sum(x.get('status')=='limited' for x in r)==2
 print('PASS real PostgreSQL: migration, pending, cross-token, same-account reuse, conflicting identity, callback retry, one concurrent claim, refresh, stale/expired messages, concurrent token/IP rate limits',flush=True)
finally:
 sql('DROP SCHEMA '+schema+' CASCADE;')
 print('isolated test schema removed',flush=True)
