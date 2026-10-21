# 公众号配对登录第 3 步发布

- 用户已确认真实公众号欢迎语收到。
- 源码提交：`59f87de`，已推送 `hotcoffeeshake/r2i84a-website` main。
- 生产部署：`dpl_DxgR8Qjde5NifD8x1j8WKcfDkbGD`。
- 候选域名：`love-train-v12-7cbdnh4s1-flyxqc1s-projects.vercel.app`。
- 正式入口：`https://r2i84a.chat/wechat-login`；r2i84a.chat 别名已切换。

## 修改

新增配对 start/claim、站点 me/logout、独立站点会话和 PostgreSQL 事务函数；回调处理六位码。新增登录页及样式/脚本，首页原入口改为获取六位码。生产新增四张隔离表（绑定、配对码、限流、回调去重）与三个事务函数，未修改旧用户表。

不新增依赖，不修改共享项目、现有支付源码、环境文件或 vercel.json。复用已有 POSTGRES_URL、JWT_SECRET、WX_TOKEN；预构建产物新增独立函数和 clean URL override。

## 验证

- Node 测试 35/35 通过；独立 Sol Reviewer PASS。
- 真实 PostgreSQL 隔离 schema 验证：迁移、刷新废旧码、跨 token 拒绝、同用户跨设备复用、不同身份拒绝覆盖、消息重试、并发 claim 一次成功、IP/token 并发限流。临时 schema 已删除，演练后确认 public 原表未变。
- 生产迁移单事务成功，仅创建新增对象。
- 发布请求 35 份函数/静态源文件与最终工作区逐字节一致；原支付函数 11,671 个文件条目/SHA 完全保留。
- 候选 HTTP：start → pending → 签名模拟回调 → claim → Secure/HttpOnly 站点 cookie → me → logout；缺 token 403，重复 claim 401。回调请求往返约 1.38 秒。
- 候选真实浏览器：显示六位码，模拟回调绑定后浏览器自动跳到 /home。模拟身份不等于真实微信验收。
- 正式域名：通过首页新入口进入 /wechat-login，成功显示配对码和等待状态。支付 health 保持 native、guestReady=true、wechatLogin=false（该旧字段只代表原服务号登录）。

## 未验收

- 等待用户在真实公众号发送网页六位码，确认自动登录及跳回来源页。
- 本轮没有发起或支付真实订单；支付文件未变及 health 成功不等于真实付款验收。
- 手机端复制、真实网络时延和第 4/5 步按用户方案在主链路确认后继续。

## 回滚

恢复 `love-train-v12-l6ht3hz2u-flyxqc1s-projects.vercel.app` 的正式别名即可恢复前版欢迎语；不删除真实绑定数据。生产测试只使用明确 synthetic 命名的测试身份，清理仅按确切测试身份与配对码执行。
