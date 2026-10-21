# 公众号配对码登录：第一步接入校验

- 用户方案：公众号配对码登录—执行方案，第 6 节要求按顺序逐步验收。
- 源码提交：706292f。
- 部署：dpl_AxQHu9Az8jfArawU7pai6JsitiHN，正式域名 r2i84a.chat 已切换。
- 回退部署：dpl_ERtbzMivpC3saG2BcoY4wEZ9dHoa。
- 新增 GET /api/wx/callback：有效签名原样返回 echostr，错误签名 403，无配置 503。
- 有效 POST 暂时返回 503，尚未实现关注事件/配对码，不应宣称登录已完成。
- 环境变化：Vercel Production 新增 encrypted WX_TOKEN，不记录值；WX_APP_ID/WX_ENCODING_AES_KEY 暂未配置，明文 GET 不需要。
- 依赖：无新增。共享目录：未改。仓库部署配置：未改；预构建部署新增独立 nodejs24.x 回调函数、iad1 region，全部 11,671 个支付函数文件原样保留。
- 本地：12 项测试通过，diff 检查通过，独立 Review PASS。
- 线上：新部署与正式域名均验证有效签名 200 且正确回显、错误签名 403；新部署有效 POST 503；支付 health 保持 native、guestReady=true、wechatLogin=false。
- 待验收：用户在公众号后台提交并启用成功，之后继续第 2 步关注欢迎语；未验证真实微信消息和付款，不进行第 3 步数据库/登录改造。
