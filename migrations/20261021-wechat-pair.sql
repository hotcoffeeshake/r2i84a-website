-- Additive, isolated website identities. Existing users and payment data are untouched.
CREATE TABLE IF NOT EXISTS wechat_bindings (
 user_id text PRIMARY KEY, official_account_id text NOT NULL, wechat_openid text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(official_account_id,wechat_openid)
);
CREATE TABLE IF NOT EXISTS wechat_pair_codes (
 code text PRIMARY KEY CHECK(code ~ '^[0-9]{6}$'), pair_token text NOT NULL,
 openid text, user_id text REFERENCES wechat_bindings(user_id), status text NOT NULL DEFAULT 'pending',
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 used_at timestamptz, CHECK(status IN ('pending','claimed','expired'))
);
CREATE INDEX IF NOT EXISTS wechat_pair_token_idx ON wechat_pair_codes(pair_token);
CREATE TABLE IF NOT EXISTS wechat_pair_limits (
 key text PRIMARY KEY, attempts timestamptz[] NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS wechat_pair_receipts (
 message_key text PRIMARY KEY, result boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION wx_pair_start(p_code text,p_token text,p_ip text) RETURNS jsonb LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
DECLARE t timestamptz:=clock_timestamp(); a timestamptz[]; n integer;
BEGIN
 -- Consistent lock order serializes both rate counters and refreshes across instances.
 PERFORM pg_advisory_xact_lock(hashtextextended('wx-ip:'||p_ip,0));
 PERFORM pg_advisory_xact_lock(hashtextextended('wx-token:'||p_token,0));
 INSERT INTO wechat_pair_limits(key) VALUES ('ip:'||p_ip),('token:'||p_token) ON CONFLICT DO NOTHING;
 SELECT ARRAY(SELECT x FROM unnest(attempts) x WHERE x>t-interval '1 hour') INTO a FROM wechat_pair_limits WHERE key='ip:'||p_ip;
 IF cardinality(a)>=20 THEN RETURN '{"status":"limited"}'::jsonb; END IF;
 SELECT count(*) INTO n FROM wechat_pair_limits,unnest(attempts) x WHERE key='token:'||p_token AND x>t-interval '1 minute';
 IF n>=3 THEN RETURN '{"status":"limited"}'::jsonb; END IF;
 -- Do not invalidate the prior browser code unless the replacement is available.
 INSERT INTO wechat_pair_codes(code,pair_token,expires_at,created_at) VALUES(p_code,p_token,t+interval '5 minutes',t)
 ON CONFLICT(code) DO UPDATE SET pair_token=EXCLUDED.pair_token,openid=NULL,user_id=NULL,status='pending',created_at=t,expires_at=EXCLUDED.expires_at,used_at=NULL
 WHERE wechat_pair_codes.expires_at<t-interval '10 minutes';
 IF NOT FOUND THEN RETURN '{"status":"collision"}'::jsonb; END IF;
 UPDATE wechat_pair_codes SET status='expired' WHERE pair_token=p_token AND code<>p_code AND status='pending';
 UPDATE wechat_pair_limits SET attempts=array_append(a,t) WHERE key='ip:'||p_ip;
 UPDATE wechat_pair_limits SET attempts=ARRAY(SELECT x FROM unnest(attempts) x WHERE x>t-interval '1 minute')||ARRAY[t] WHERE key='token:'||p_token;
 RETURN jsonb_build_object('code',p_code,'expiresIn',300);
END $$;
CREATE OR REPLACE FUNCTION wx_pair_bind(p_code text,p_account text,p_openid text,p_message text,p_created bigint,p_user text) RETURNS boolean LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
DECLARE r wechat_pair_codes%ROWTYPE; previous boolean; uid text; result boolean:=false;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('wx-message:'||p_message,0));
 SELECT x.result INTO previous FROM wechat_pair_receipts x WHERE message_key=p_message;
 IF FOUND THEN RETURN previous; END IF;
 SELECT * INTO r FROM wechat_pair_codes WHERE code=p_code FOR UPDATE;
 IF FOUND AND r.status='pending' AND r.expires_at>clock_timestamp()
 AND p_created>=floor(extract(epoch FROM r.created_at)) AND p_created<=extract(epoch FROM clock_timestamp())+60
 AND (r.openid IS NULL OR (r.openid=p_openid AND EXISTS(SELECT 1 FROM wechat_bindings WHERE user_id=r.user_id AND official_account_id=p_account))) THEN
   INSERT INTO wechat_bindings(user_id,official_account_id,wechat_openid) VALUES(p_user,p_account,p_openid)
   ON CONFLICT(official_account_id,wechat_openid) DO UPDATE SET wechat_openid=EXCLUDED.wechat_openid RETURNING user_id INTO uid;
   UPDATE wechat_pair_codes SET openid=p_openid,user_id=uid WHERE code=p_code;
   result:=true;
 END IF;
 INSERT INTO wechat_pair_receipts(message_key,result) VALUES(p_message,result);
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION wx_pair_claim(p_code text,p_token text) RETURNS jsonb LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
DECLARE r wechat_pair_codes%ROWTYPE;
BEGIN
 SELECT * INTO r FROM wechat_pair_codes WHERE code=p_code FOR UPDATE;
 IF NOT FOUND OR r.pair_token<>p_token THEN RETURN '{"status":"forbidden"}'::jsonb; END IF;
 IF r.status<>'pending' OR r.expires_at<=clock_timestamp() THEN RETURN '{"status":"expired"}'::jsonb; END IF;
 IF r.user_id IS NULL THEN RETURN '{"status":"pending"}'::jsonb; END IF;
 UPDATE wechat_pair_codes SET status='claimed',used_at=clock_timestamp() WHERE code=p_code;
 RETURN jsonb_build_object('status','ok','userId',r.user_id);
END $$;
REVOKE ALL ON wechat_bindings,wechat_pair_codes,wechat_pair_limits,wechat_pair_receipts FROM PUBLIC;
REVOKE ALL ON FUNCTION wx_pair_start(text,text,text),wx_pair_bind(text,text,text,text,bigint,text),wx_pair_claim(text,text) FROM PUBLIC;
