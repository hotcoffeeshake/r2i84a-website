# 订阅号验证码登录入口发布

- 源码提交：5a057c48b96e7325d74256bae6a7003068c70feb
- 线上：https://r2i84a.chat/
- Vercel 项目：love-train-v12
- 新部署：dpl_DQmasc61yCcFhmFTge1jAPhFoizr
- 上一部署：dpl_8W8x3uxoWQFYXkJN7Gp48opeCg2z
- 发布方式：Vercel prebuilt API 继承上一部署全部 .vercel/output 源文件 SHA，仅替换 index.html、assets/web-commerce.js，新增 assets/wechat-subscription-follow.jpg；保留全部 11,671 个函数文件。新部署 READY 且验收后切换 r2i84a.chat alias。
- 改动：验证码登录入口改用订阅号二维码及文案；登录开关关闭时明确提示；首页脚本版本更新。
- 检查：JS 语法、diff 空白、独立 Review 通过；二维码逐字节匹配用户提供素材；下单及支付函数与上一源码提交一致；部署页面实际打开订阅号二维码和验证码输入框；auth/me 返回预期未认证 401；health 显示 Native、访客购买、人工开通维持原状。
- 未完成：公众号服务器配置、订阅号身份适配、验证码真实收发与登录验收。wechatLogin 仍为 false。未发起真实支付、未测试收款及会员开通。
- 未修改：依赖、共享目录、环境变量、仓库部署配置及生产支付函数。
- 回退：将 r2i84a.chat alias 指回 love-train-v12-el1viboco-flyxqc1s-projects.vercel.app。
