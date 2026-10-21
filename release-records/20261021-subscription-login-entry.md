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

## 同日按钮间距修复

- 提交：b1d3461，仅 index.html 新增相邻操作按钮 12px 上间距，无 JS 改动。
- 部署：dpl_6gAEvNjzVvaTzS2UGQ8HbXnKQ5RV，上一部署为 dpl_DQmasc61yCcFhmFTge1jAPhFoizr。
- 独立 Review、diff 检查通过；部署浏览器实际测得连续按钮间距均为 12px；health 维持 native、guestReady=true、wechatLogin=false。
- 登录参考：https://howtolivebetter.net/sign-in。页面实测显示 6 位配对码，发送到公众号后原页自动登录；另有关键词回复验证码的备用输入入口。没有验证其后台实现或 magic link。
- 本次仅发布显示修复；6 位配对码流程尚未实现，公众号真实收发仍待接入。

## 同日仅保留验证码登录

- 提交：edd05db；未登录入口直接展示订阅号验证码表单；移除新扫码/OAuth入口和微信内自动OAuth；保留访客购买及旧回调兼容代码。
- 部署：dpl_ERtbzMivpC3saG2BcoY4wEZ9dHoa；上一部署 dpl_6gAEvNjzVvaTzS2UGQ8HbXnKQ5RV。
- JS语法、diff、独立Review通过；部署浏览器确认仅有验证码表单及直接购买；health仍native、guestReady=true、wechatLogin=false。
- 无依赖、环境变量、共享目录、支付函数或部署配置改动。实际公众号验证码收发仍未接通，未测试真实付款。
