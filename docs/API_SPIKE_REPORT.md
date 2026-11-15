# API Spike 状态

2026-11-15：NOT RUN。

公开HTTPS前置已满足：页面https://judylp.github.io/stem/，实际origin为https://judylp.github.io。尚无安全输入界面，也未输入并验证有效Key/额度。没有向候选服务商发出任何模型请求，没有CORS成功或失败结论。

候选 endpoint/model 仅来自规划，不代表当前可用。不得把尚未测试写成CORS失败。

待部署后：核验供应商官方说明；用户在临时界面输入Key；真实浏览器最小请求及预检/响应/JSON模式测试；20秒超时；最少必要调用；去敏记录。若CORS确定不可用，停止Live扩展，不添加代理，继续保留当前手动和模拟版。
