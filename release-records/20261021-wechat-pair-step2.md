# 公众号配对码登录：第二步关注欢迎语

- 前提：用户截图确认 /api/wx/callback 已启用，明文 XML。
- 源码提交：c672c04。
- 部署：dpl_GYCJ3FSmdV4amqUtqUmPVkuuDpE4；上一部署 dpl_AxQHu9Az8jfArawU7pai6JsitiHN。
- 新增 XML 读取/解析及被动回复。subscribe 返回方案欢迎语，unsubscribe 返回 success；文本消息配对功能暂未实现，返回 503。
- 24 项本地测试、语法检查、diff 检查、独立 Review 通过。
- 新部署模拟请求：合法 subscribe 200 且身份正确对调，重复请求 XML 一致，unsubscribe 200/success，伪造签名 403。
- 正式域名模拟 subscribe 200，回包约 1.43 秒。此耗时不是微信到 Vercel 的实测，也不能保证冷启动或跨境时延。
- 全部 11,671 个支付函数文件保留，health 维持 native、guestReady=true、wechatLogin=false。
- 未改依赖、共享目录、环境变量或仓库部署配置；预构建新增 XML 模块。
- 待用户用微信新关注并确认真实收到欢迎语，之后才进入方案第 3 步。未验收配对登录或真实支付。
