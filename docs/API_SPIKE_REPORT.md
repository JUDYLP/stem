# T05 — Ant-Ling API 可行性验证

日期：2026-11-17（北京时间）。结论：**C，暂时无法完成认证成功与结构化输出验证**。用户明确要求Key后续自行配置，本轮不再等待、不调用付费模型。T05凭证无关调查已完成，认证验收BLOCKED；T06/T07开始条件尚未满足。

## 环境与基线

- 仓库：JUDYLP/stem；路径 E:/Project/stem/unscripted；分支main；基线b8c3443d5c037265c0f29e7fb24e9f93ecabffad。
- 本轮工作区切到C:/Users/12248/Documents/Codex，E盘项目仍是维护源。沙箱内git status报work tree错误；通过授权的项目目录只读检查确认顶层正确、状态与暂存区均干净，未改Git配置或复制旧副本。
- Windows、Node v24.22.1、Python 3.14.2；浏览器实际UA Chrome/157.0.0.0（非精确补丁版本）。
- 实站 https://judylp.github.io/stem/；真实Origin https://judylp.github.io；独立Chrome上下文t05-spike。初始页面及7个资源均200。
- 已读取TASKS T05/T06/T07、MASTER_PLAN架构/响应契约、DECISIONS D05–D07/D13和README；检查src全部5模块、data、tests、打包脚本及忽略规则。
- node --test tests/*.test.mjs：15 PASS、0 FAIL。题库校验覆盖3题9层；main.js实现Depth Meter、提交后rubric、人工自评与内存Retry；storage.js仅持久化自评；export.js导出当前review；demo.js为独立固定模拟，未调用模型。没有src/ai.js或正式AI入口。
- 本轮仅修改本报告与TASKS；不改题库、页面、学习逻辑或部署包。

## 官方文档核对（文档证据，不等于服务实测）

1. [Chat Completions](https://developer.ant-ling.com/en/docs/api-reference/chat/openai/)：POST https://api.ant-ling.com/v1/chat/completions，Bearer认证，application/json；model选项仍含Ling-3.1-flash；messages包含role/content。非流式正文示例使用choices[0].message.content及usage。
2. [Structured Outputs](https://developer.ant-ling.com/en/docs/tutorials/structured-outputs/)：说明response_format的json_object和json_schema。当前示例主要使用Ling-3.2-flash，因此不能仅凭文档推断Ling-3.1-flash账户实际支持这两种模式。本轮没有更换模型。
3. [Error Codes](https://developer.ant-ling.com/en/docs/api-reference/api-guide/error-code/)作为后续排错参考；本文实测错误以收到的响应为准。

## 实际步骤与结果

| 检查 | 状态 | 实际证据与边界 |
| --- | --- | --- |
| 基线测试与仓库检查 | PASS | 15/15，main，开始时工作树干净 |
| 接口/模型名称文档核对 | PASS | 官方列有目标路径和Ling-3.1-flash；运行可用性另列 |
| 本机Python HTTP无认证POST | PASS | 401，243ms，code=401，type=sdk_token_not_found，message=未检测到授权令牌；仅证明可达/认证拦截，不证明生成成功 |
| 真实浏览器OPTIONS预检 | PASS | 浏览器自动发起OPTIONS，200；Origin为线上origin，申请POST及authorization,content-type |
| 浏览器无效测试令牌POST | PASS | 使用明确无效、非真实Key的测试字符串；401、330ms、Response.type=cors；JS可读取JSON错误 |
| 有效认证POST及模型生成 | BLOCKED | 用户要求Key后续配置，真实Key调用0次 |
| 成功响应路径的CORS | BLOCKED | 401路径已通过；未取得2xx生成响应，不外推成功路径 |
| Ling-3.1-flash运行权限/额度 | BLOCKED | 需要有效Key及调用确认 |
| JSON object生成与解析 | BLOCKED | 未执行真实生成，不把文档示例当输出 |
| JSON Schema严格约束 | BLOCKED | 未执行；json_object成功将来也不等于严格schema通过 |
| 正常响应字段/finish_reason/usage | BLOCKED | 只有官方示例，没有本账户实际正常响应 |
| 无效认证401 | PASS | 真实供应商401；HTTP错误不会让fetch自动reject，需检查status/ok |
| 真实429/限流响应 | NOT RUN | 不主动耗尽额度、不循环撞限流；未使用mock冒充实测 |
| 网络断开 | PASS（受控浏览器测试） | 另一个隔离上下文t05-controlled-errors，通过DevTools Offline，fetch抛TypeError: Failed to fetch；已恢复联网，不是供应商故障 |
| 客户端超时 | PASS（受控取消） | AbortSignal.timeout(1)，等待20ms后交给fetch，抛TimeoutError: signal timed out；请求发出前已过期，仅验证取消语义，不是20秒在途超时 |
| 供应商真实慢响应/超时 | NOT RUN | 未制造实际长调用，未获得504或供应商超时证据 |
| 凭证保护 | PASS（本轮范围） | 未输入/读取真实Key，未发送付费请求；临时输入面板已移除；无持久化测试代码、无部署变更 |

浏览器POST参数：model=Ling-3.1-flash；messages为单句合成指令“Reply with OK.”；max_tokens=8、stream=false；credentials=omit，20秒AbortSignal；Content-Type=application/json，Authorization使用明确无效的测试字符串。该401发生在认证阶段，不能证明请求体所有字段都被接受。20秒超时本次没有触发。

Python独立测试使用urllib.request，同一路径/合成请求体、不带Authorization、20秒网络超时。Python访问与浏览器跨域证据独立记录，不混用。

## CORS可观察证据

浏览器自动预检（工具请求ID 10）：

```text
OPTIONS /v1/chat/completions -> 200
Origin: https://judylp.github.io
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization,content-type
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization,content-type
Access-Control-Allow-Methods: OPTIONS,HEAD,GET,POST,PUT,DELETE,TRACE
Access-Control-Max-Age: 1600
```

实际POST（工具请求ID 9）返回401，Access-Control-Allow-Origin: *、Content-Type: application/json。JavaScript取得以下去敏错误结构：

```json
{"error":{"code":401,"message":"授权令牌无效","type":"ling_auth_not_exist"}}
```

响应还带Access-Control-Allow-Credentials:true。本轮使用credentials:omit，没有携带Cookie；不会改用include，也不把通配Origin当成Cookie跨域认证许可。没有关闭浏览器安全机制，没有使用代理。

结论：**当前线上origin的预检和401响应跨域读取实际可用；有效认证的成功响应仍待验证。** 不能写“CORS失败”，也不能写“纯前端AI已完全可用”。

## 凭证与临时测试边界

曾在现有HTTPS页面的独立浏览器上下文中临时插入密码输入面板；不写源码/文件，不改变部署。它只允许用户亲自点击并勾选费用确认后进行一次合成JSON测试，固定Ant-Ling地址、20秒客户端超时、无重试。Key仅在输入框/请求闭包，提交前清空输入框；结果仅记录允许的状态/布尔/数值，不输出原始响应或请求头。用户决定延期配置时仍为awaiting-user，面板已清空移除，未发生该调用。

真实Key本轮0次输入、0次模型生成调用；实际API认证失败请求为浏览器1次、Python1次，另有浏览器自动预检。受控断网和过期信号测试不算成功到达供应商的模型调用。

浏览器BYOK不能保证Key对设备所有者、扩展、DevTools或被攻陷的同源脚本不可见。可保证的目标是应用不持久化、不记录、不向其他服务发送Key；不声称绝对不可见。后续真实Key阶段不读取网络请求详情、不截图密码区、不导出HAR。

## 安全架构建议及T06/T07门槛

暂保留原纯静态+无Key练习。可行性方向仍是单一固定HTTPS供应商的浏览器BYOK，但目前只是候选，不是已验证通过的A结论。本轮没有证据要求转架构，因此也不选B，不新增Serverless/后台/代理或更换服务商。

进入T06前最小补验：

1. 用户在受控本地界面输入具有Ling-3.1-flash权限/额度的Key，并明确确认一次可能计费的合成请求。不要发聊天、不要提交仓库。
2. 从同一HTTPS origin实测一次response_format={"type":"json_object"}，取得可读2xx、正常choices/message/content、JSON.parse成功、预期类型与finish_reason，并记录去敏耗时/usage。
3. 若需要严格schema，再独立确认一次json_schema测试；失败时明确区分参数不支持、账号权限、限流、网络和CORS。
4. 根据首个结果决定是否进行更贴近学习反馈契约的最少调用；不自动重试、不自动切模型。取消/超时不保证供应商停止计费。

T06当前BLOCKED，T07依赖T06也未满足。后续若允许T06，应固定已验证端点/模型、Key仅内存、主动单请求、超时取消、旧响应失效、HTTP状态分类、严格字段校验；所有失败保留用户回答及人工自评。T07再验证引用是原文子串、索引有效、反馈不自动修改自评；不要把本次连通性检查当作教学效果验证。

若未来成功路径CORS确实失败，停止直连投入，先保留可提交的手动+模拟版本；再由用户决定是否验证另一个获授权服务商，或另行批准架构调整。本轮不实施替代架构。

## 用户仍需提供及阶段结束

唯一当前关键外部阻塞：有效Key/额度与一次受控计费请求的明确确认。用户已说明稍后配置，本轮就此停止，不执行T06/T07。

自测：为什么401能读到反而说明这条响应的CORS通过？为什么json_object可解析不等于符合业务schema？为什么浏览器超时不保证服务商停止计费？

## 2026-11-19｜Redis L1 真实判题验收

**PASS（localhost）**。用户完成页面自测。Chrome 在 http://localhost:49404 加载静态训练页，向官方 DeepSeek Chat Completions 端点发起两次 Redis L1 判题。以下记录来自保留的网络请求，未再次调用模型。下文早期探测状态按当时结果保留。

| 核查项 | 结果 |
|---|---|
| localhost 成功路径 CORS | 两次 OPTIONS（#93、#96）和两次实际 POST（#92、#95）均为 HTTP 200 |
| 模型响应 | 两次均为 deepseek-flash，finish_reason 为 stop，message.content 可解析为 JSON，各有三个已知 rubricId 及非空理由 |
| 脱敏判题样例 | #92 三项均为红灯，引用为空。#95 三项建议为绿灯，其中两项引用能在回答中逐字找到。按客户端规则应呈现两绿一琥珀，第三项留给学习者核对 |
| 人工确认 | 用户报告自测通过。确认前后存储边界另有合成响应的独立页面验收，详见下文 |
| 回归（代码 b10fcf8） | 164/164 测试通过，35 个 JS 文件语法通过，成功打包 16 项静态资源 |
| 未独立验收 | 有效凭证的 curl 响应未留存；Pages 生产来源成功路径未测；没有留存真实判题当时的页面截图或录像 |

### 历史记录：初次无凭证探测

**LIVE_API_NOT_TESTED**。基线 2a615f1，分支 competition-ai-judging。当前进程没有注入 DEEPSEEK_API_KEY。以下是官方服务的真实网络与鉴权错误路径测试；未取得模型生成结果。

接口为 POST https://api.deepseek.com/chat/completions 。官方列出模型 deepseek-flash 及 JSON 输出能力。[模型表](https://api-docs.deepseek.com/quick_start/pricing/) · [JSON Output](https://api-docs.deepseek.com/guides/json_mode/)

探测使用合成消息 “Return JSON.”、response_format.type=json_object、stream=false、max_tokens=256、20 秒超时和无效 Bearer 占位值。Chrome 使用 credentials:omit。临时空白探测页来自 http://localhost:62268；没有打开训练页、读取学习记录或发送学生答案。

| 项目 | 实测 |
|---|---|
| curl OPTIONS | 200，允许当前 localhost Origin、POST 和 authorization,content-type |
| curl POST | HTTP 401，error.type=authentication_error，error.code=invalid_request_error |
| Chrome 自动 OPTIONS | DevTools 请求 4，HTTP 200。Access-Control-Allow-Origin 为 http://localhost:62268，Allow-Headers 为 authorization,content-type，Allow-Methods 为 POST |
| Chrome 实际 POST | DevTools 请求 3，HTTP 401。页面 fetch 取得 type=cors 的 Response，能读取 JSON authentication_error。此错误路径通过了浏览器跨域检查 |
| 有效 Key、HTTP 200、choices[0].message.content、JSON 解析、finish_reason=stop | BLOCKED，缺有效凭证。鉴权失败发生在成功生成之前 |
| 真实空 content、截断、429、超时 | NOT RUN。设置超时时限不等于观察到超时 |
| Redis L1 逐点判题、两种灯色、原文证据、确认后热力图、线上来源 CORS | NOT RUN。无真实判定样例、截图或录像 |

下一次实测先在本地安全注入有效 Key 并确认允许一次付费测试，禁止将其粘贴至聊天或命令文本。先以 curl 核对成功响应结构，再从 localhost 用同一合成 Redis L1 答案核验认证成功路径。保留脱敏 verdicts、finish_reason 和模型名；真实训练页面的成功演示需另行截图。localhost 鉴权错误路径不足以证明 Pages 来源或成功响应可直接访问。

此阶段保留现有离线自评。若成功响应或生产来源实际被 CORS 拦截，可另行审查受保护的同源 Worker，仅转发固定上游并限制来源、认证、请求大小、时限、速率和预算，凭证与答案不写日志。本次没有部署代理。

本地回归：npm ci 成功；npm test 为 151 通过、0 失败、0 跳过；npm run check:syntax 为 32 个文件通过；python tools/package_site.py work/deepseek-spike-package 在新目录打包 13 个静态资源成功。临时探测服务器已停止。提交范围仅 docs/API_SPIKE_REPORT.md，历史 Ant-Ling 实验保留。

### Redis L1 页面接线及验收

真实凭证测试等待用户在本地密码框中输入并主动点击发送。当前 LIVE_API_NOT_TESTED，暂无真实判定样例或演示截图。Key 仅在当前页临时使用，清除入口可切回离线。BYOK 直接发送至配置的服务地址，代理模式仅向配置的代理发送题目和答案。浏览器对部分 CORS 和网络故障只暴露 TypeError，页面提示两种可能，使用 DevTools 预检记录进一步区分。

修改 src/ai/provider.js、src/ai/judge.js、src/main.js、index.html、src/i18n.js、tools/package_site.py、tests/ai-judge.test.mjs 和本报告。Redis L1 逐项核对当前屏幕及 core@1.0.0 的 prompt 与 rubric 原文，通过 rubricId 验证模型建议；未确认前只更新草稿灯和文本。证据与理由使用文本节点呈现。

npm test：164通过、0失败、0跳过（原151加13项）。npm run check:syntax：35文件通过。独立目录打包16项资源。真实 Chrome 加载打包产物，中文 Redis L1 提交后无 Key 提示正常，仍可离线确认。另一个 localhost 测试来源使用**合成 provider 响应**验证 UI 接线，灯号为绿/琥珀/琥珀，确认前 progress.v1/history.v1 原文不变，点击人工确认后才写入。该测试不是模型能力证据。有效 Key 的 Chrome 判题、成功路径 CORS、真实双灯色截图及 Pages 线上验收仍待完成。未部署。
