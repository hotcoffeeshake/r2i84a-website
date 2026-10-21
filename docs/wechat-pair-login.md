# 公众号配对码登录：按阶段验收

执行用户提供的《公众号配对码登录—执行方案》，按第 6 节顺序推进。

## 第 1 步：服务器接入校验

- 入口：`https://r2i84a.chat/api/wx/callback`
- 源码：`api/wx/callback.mjs`、`lib/wx/signature.mjs`
- Vercel production 环境变量：`WX_TOKEN`，与公众号后台 Token 完全一致；不要写入 Git、浏览器代码或发布日志。
- 公众号后台：设置与开发 → 基本配置 → 服务器配置。填写上述 URL 与 Token；EncodingAESKey 由后台随机生成，第一版选择明文模式。
- GET 签名有效时原样回显 echostr，否则 403；缺少服务端 Token 时 503。
- 第 1 步已由用户截图确认提交/启用成功（明文 XML）。第 2 步关注欢迎语已由用户确认收到；subscribe 被动返回 XML，unsubscribe 返回 success。第 3 步处理 6 位配对码，其他文本返回操作指引。
- 若此公众号原本已启用其他服务器，应先核对原有服务，不能直接覆盖。
- 第一阶段不需要 AppSecret、用户资料查询、网页授权、开放平台或带参数二维码。

## 发布

现项目是静态首页和独立支付函数，并非可以直接重新构建的 React 源工程。
新增函数采用 Vercel Build Output API；`tools/add-wx-callback-artifact.mjs` 只在私有部署请求中新增独立函数，断言保留全部支付函数文件，不向 static 暴露服务端源码。
函数 region 沿用当前 iad1（方案要求尽量单 region）；只使用 Node 内置库，无新增依赖。第 3 步复用现有 POSTGRES_URL 与 JWT_SECRET，新增独立配对函数和 /wechat-login 静态页面。

测试：`node --test tests/wx-*.test.mjs`。

第 2 步无数据库写入或外呼：相同事件返回相同欢迎语，XML 响应只发送一次。XML 输入限 64KiB，流读取限 1.5 秒；拒绝 DTD、重复字段、加密体和畸形 XML。函数 maxDuration=5 不代表真实微信收信或冷启动时延保证，需手机关注验收。

## 后续验收门槛

1. 用户确认公众号后台提交并启用成功。
2. 实现/验证关注事件欢迎语。
3. 复用现有数据库，实现配对码、openid 绑定与浏览器会话；接入前必须核对现有账号和支付身份契约。
4. 错码、过期、重复领取、无领取凭证、限流验证。
5. 前端 /wechat-login、复制、刷新与来源页跳转。
6. 本轮不做 P2 反向验证码/magic link。

待处理的必要准确性问题：前端隐私文案不能写“不获取任何个人信息”同时又保存 openid；实施第 5 步时应准确说明仅用于账号识别，避免把真实数据处理描述成零采集。此处不改变登录流程。

## 第 3 步实现与身份边界

- 网页：`wechat-login.html`、`assets/wechat-login.js`、`assets/wechat-login.css`。每 2 秒轮询，失败退避 5 秒；5 分钟有效期，过期重取；来源地址只允许本站路径。
- 入口：`assets/web-commerce.js`，首页导航只保留配对码登录入口；购买仍沿用原流程。
- 接口：`api/auth/wechat/pair/start.mjs`、`claim.mjs`；`api/auth/wechat/me.mjs`、`logout.mjs`。
- 回调：`api/wx/callback.mjs`，收到 6 位码先事务落库，再返回成功 XML。
- 持久化：`lib/wx/pair-store.mjs`，Node fetch 调用现有 Neon SQL HTTP；参数化 SQL，无数据库凭据进入浏览器。
- 迁移：`migrations/20261021-wechat-pair.sql`，只新增 wechat_bindings、wechat_pair_codes 及限流/消息去重辅助表，不改原 users。
- 数据库的三个事务函数用行锁及 advisory transaction lock 保证刷新、绑定、领取和全局限流；已绑定身份不能被其他 openid 覆盖。
- 站点身份用 `(公众号原始 ID, openid)` 唯一绑定，不声称已关联小程序会员。`JWT_SECRET` 派生独立签名密钥，签发 `__Host-r2_site_session`，24 小时有效。
- **不能复用支付 Cookie**：原支付接口会把 `oaOpenid` 传给旧服务号查询。订阅号 openid 不能混用，因此 `siteUser` 只负责站点登录显示，原 `webUser`、访客购买、订单逻辑与支付函数保持原样。
- 浏览器配对 Cookie `wx_pair_token` 为 128 bit 随机数，只在服务端保存其哈希；所有身份 Cookie 为 HttpOnly / Secure / SameSite=Lax。
- IP 每小时 20 次，浏览器 token 每分钟 3 次；信任 Vercel 注入的 x-vercel-forwarded-for，不接受用户自行声明的其他 IP 头。
- 配对码行可在过期 10 分钟后复用；回调 CreateTime 必须晚于该次生成时间，MsgId 去重，避免旧消息绑定新码。

### 验证与发布

`node --test tests/wx-*.test.mjs`。

真实事务测试：以已授权数据库 PG* 环境运行 `python3 tests/wx-pair-db.py`。脚本仅在自己随机生成的隔离 schema 内演练并发，结束删除该临时 schema。不能用 mock 冒充数据库并发验证。

迁移用 psql `-X -v ON_ERROR_STOP=1 --single-transaction -f migrations/20261021-wechat-pair.sql`，通过标准 PG* 环境传凭据，固定目标 schema 为 public。新表不在请求路径懒创建。

发布前必须重新生成预构建请求，校验所有新增函数/静态源文件与产物逐字节一致，断言原支付 11671 个文件及 SHA 不变。先部署不自动绑定域名的候选版本，验证完整模拟配对、Cookie、me/logout、拒绝重复领取、支付 health 后再切别名。

停止条件：SQL、并发、身份隔离或独立 Review 未通过时不得发布；候选接口失败或支付产物发生变化时不得切域名。

回滚：恢复上个生产版本的 r2i84a.chat 别名。保留已产生的真实身份绑定表，不删除真实用户数据。第 3 步以前的回滚版本为 `dpl_GYCJ3FSmdV4amqUtqUmPVkuuDpE4`。

本地/模拟测试不能替代真实微信发送配对码后浏览器自动登录的验收。用户确认此步后继续第 4、5 步实测，不实施 P2。
