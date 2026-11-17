# Unscripted｜任务与交接

## 当前状态（由主执行者维护）

- 更新：2026-11-17。项目根目录 E:/Project/stem/unscripted。原目录不再维护。
- T00 DONE；T02工程完成、用户人工审校待办；T03 DONE；T04核心完成、下载落盘待确认；T08 DONE；T09交互和退出完成、桌面视觉通过，最终移动截图已在公开HTTPS补验收通过。
- 已实现三题九层、手动解释/自评、持久化、Depth Meter、复习单、Retry、独立英文模拟Demo。
- 测试：37项Node测试通过（新增灯色规则、history裁剪、回答开关、旧数据兼容）；浏览器流程、动效与未测项见 docs/QA_REPORT.md。
- commits：2613321（题库），a5d1b89（手动练习/存储），d5e7b92（复习单），9246dbf（Retry/Demo）。
- T01公开预览DONE：https://judylp.github.io/stem/；仓库Public，Actions 43706124478 attempt 2成功，部署752dd3f。独立浏览器三题加载、8资源200/MIME/哈希一致、390px Demo与存储隔离通过。Discord具体安排仍待核实。T05已完成无凭证实测，认证成功/JSON验收BLOCKED（用户延后配置Key）；T06/T07未执行，未接入Live API。
- T10–T13待办。优先补验收并准备部署；无Key不影响当前练习与模拟Demo。
- 本轮Subagent 0，已发布静态HTTPS预览，无模型API请求。原始“零代码”是启动事实，不再描述当前状态。

## 本轮补充：题库与首页优化

2026-11-15：三题v2完成场景/反例/条件变更，参考要点与题干对齐，来源补核验但仍待参赛者人工审校。首页约40%模拟练习卡、中文CTA、导航、三列实例框架、宋体标题、对比度优化完成。验收见QA_REPORT；无Live调用、无Subagent。理解自测：为什么原子操作不等于条件更新原子？为什么请求合并不等于缓存？为什么大幅改题后不能沿用旧Pass？

## 2026-11-17 动态点阵与灯的表现力

只做视觉层：固定全屏 canvas 点阵（28px / 390px 32px、慢波、灯色 160px 内染色、1.2s 点亮波纹、聚焦 30% 静音、dpr≤2、30fps、隐藏暂停、reduced-motion 静态一帧）；灯改为亮芯/灯罩/三层光晕与深色玻璃，尺寸按 32/24/18/22px 调整，焦点白环、要点行与热力格内发光；方法区标签加黑底，时间线漏点改分条。纯计算拆到 `src/dotfield.js` 并加 4 项测试；37/37 通过。实测绘制 0.35ms/帧（1440 dpr1）、0.36ms（dpr2）、0.07ms（390），30fps。已部署 67ad40e（Actions 44070234739 success）。证据在 work/qa-signal-20261117/，未提交。

## 2026-11-17 信号灯版修正

按用户 P0/P1/P2 与可发现性清单修正，未加新功能、未改存储结构、未接模型：热力格改为整格填充灯色（60px、左对齐、✓/!/✗）并保留波纹/过渡；练习框架改中性灯与 L1→L2→L3 箭头，修复「适合谁」重叠；中文残留英文清理与 API Key 仅留一处；参考要点常驻图例、灯按钮 aria-label、空格/回车/1-2-3 键盘与 aria-live；导出禁用态、加载间距、清空弹窗先导出、回答对比说明、移动端热力与灯边距。37/37 Node 测试通过。证据在 work/qa-signal-20261117/，未提交。

## 2026-11-17 信号灯视觉重做

按用户本轮要求把整站重做为黑色仪表盘：三色信号灯（绿/琥珀/红 + 形状图标）、逐点自评、确认判定、`unscripted.history.v1`、热力矩阵、作答时间线、回答保存开关（默认关闭）、清空记录与带灯色的导出。37/37 Node 测试通过；1440/390 中英文全页截图、提交流程帧序列、reduced-motion、旧 progress 兼容与外部建议接口已验证。已推送并部署修正 caf3a7c（Actions 44058487591 success），线上 11 个资源哈希与提交一致。无新依赖、无 Live AI、无 Subagent。设计与数据决定见 D18/D19。视觉证据在本地忽略目录 work/qa-signal-20261117/，不提交。

## 2026-11-17 页面体验打磨

P0双语/文案清理完成（d7ed2b3），P1统一Java例子/输入体验完成（7f2e152），P2移动端与八场景截图完成。新增i18n与双语schema测试后20/20通过。语言偏好独立存储，不改progress v1。详见QA_REPORT；T05凭证阻塞不变，本轮无Live AI/无Subagent。后续维护src/i18n.js与questions.json中英文对应项，打包白名单已加入i18n.js。

## 全部任务共同规则

每卡先读 MASTER_PLAN §1 和本卡，再读列明决策及文件；不存在的前置文件应由依赖任务产出，不捏造。状态用 TODO/DOING/DONE/BLOCKED/SKIPPED；条件不成立记 SKIPPED，未测不能写通过。

每阶段主执行者可以更新本文件的状态/摘要；只有决策改变才更新另两份规划。除卡片列出的路径，不随意扩大修改范围。主执行者统一集成、运行相关测试、检查 diff、提交 Git；子 Agent 不提交。

工时为专注工作估计，含必要人工验收，不是模型运行速度承诺；超出上限应删范围或记录阻塞。下面的任务 ID 沿用原交接，实际顺序见主计划。正常发布/外部写入按已有用户授权执行；缺授权时先做好可审查产物再请求。登录、Key 输入、真实个人经历由用户完成。

阶段摘要统一格式（最多约 200 字，测试细节链接到报告）：任务ID｜DONE/BLOCKED等｜真实模型｜变更路径｜测试命令/场景及结果｜commit｜遗留风险｜下一任务。不要填虚构的完成样例。

## T00｜环境、首屏与 Git（Sol；禁止 Subagent）

- 目标/价值：从零获得能启动的页面，为所有后续任务提供可靠基线；依赖无；约 1–2 小时。
- 读取：本卡、MASTER_PLAN §1–3、DECISIONS D01–D03；实际存在的上级 AGENTS.md。
- 允许修改：新项目中的 index.html、styles.css、src/main.js、README.md、.gitignore、docs/SETUP_REPORT.md、docs/planning 三文件；仅在无 Python 但有 Node 时可新增 tools/serve.mjs；Git 元数据仅在确认的新项目根目录。
- 操作：检查目标目录未占用、git --version、Python/Node 和浏览器能力；选已安装 HTTP 服务；新建最小首屏和禁用的未实现入口；复制规划形成单一维护源；初始化 Git，检查身份配置，创建首个有意义提交，不能捏造用户身份。
- 验收：实际 HTTP 打开显示产品名、标语、L1/L2/L3 说明，无致命控制台错误；README 中 PowerShell 命令在实际环境可用；报告真实 URL、环境、文件、commit。缺 Git 身份则页面仍完成，提交标阻塞。
- 风险/退路：没有工具时优先现有替代，不安装整套框架；不能用 file:// 结果冒充 HTTP 验收。
- 完成摘要：启动方式、首屏验收、首次 commit 或真实阻塞 → T02/T01。
- 学习：HTTP 与 file:// 有何区别？commit 与远程仓库有何区别？静态站为什么能运行 JS？

## T01｜公开预览与规则核验（Sol；禁止 Subagent）

- 目标/价值：提前暴露账户/发布问题；依赖 T00；约 1–2 小时加外部等待。
- 读取：README、SETUP_REPORT、index.html、资源路径、D02/D11；官方赛事主页与 rules、实际托管官方文档。
- 允许修改：README、docs/SETUP_REPORT.md、docs/SUBMISSION.md；托管必须的最小配置文件；必要的相对资源路径。
- 操作：核实 GitHub 可用权限；优先 Pages；准备发布配置和可审查内容，按已有授权推送/公开发布；读取本轮已核验的规则记录并检查有无更新，尤其补 Discord 展示与预录要求。
- 验收：无登录窗口可打开 HTTPS 站点，子路径资源无 404；记录部署 commit 和 URL；官方规则记录区分已核实与待核实。
- 风险/退路：权限阻塞不阻断 T02–T04；记录下一步，选择可用静态托管不引入后端。
- 完成摘要：实站 URL、部署版本、规则核验与阻塞 → T05 可准备。
- 学习：为什么必须无痕验证？相对路径与根路径有什么区别？本地 commit 是否等于已发布？

## T02｜首批 3 题和校验（Sol 单独完成；禁止 Subagent）

- 目标/价值：提供可信内容和稳定契约；依赖 T00；约 2–3 小时。
- 读取：MASTER_PLAN §3、src/main.js、README；相关官方技术资料，使用工具可查的原始来源。
- 允许修改：data/questions.json、src/questions.js、src/main.js 中加载入口、docs/QUESTION_REVIEW.md、tests/questions.test.*。
- 操作：写 3 道题，每题三层、每层 2–4 条 rubric；记录来源及具体核验点；校验唯一 ID、层级顺序/数量、非空文本；用户核对知识，不把模型审查冒称用户已审。
- 验收：实际 HTTP fetch 加载；合法 3 题通过；重复 ID、缺层、无效 rubric 被拒绝；加载失败有提示和重试；测试按已安装运行时选最小方案，不引入测试框架工程。
- 风险/退路：技术有争议则换成更窄且可验证问题；不为了凑分类扩题。
- 完成摘要：3 题与来源、schema 检查、尚待人工审校项 → T03。
- 学习：schema 能验证知识正确吗？三层问题如何区分？rubric 为什么不能是空泛标签？

## T03｜无 Key 三层练习与自评（Sol；禁止 Subagent）

- 目标/价值：完成不依赖外部服务的学习主路径；依赖 T02；约 3–5 小时。
- 读取：src/main.js、questions.js、questions.json、index.html、styles.css；D06/D07。
- 允许修改：index.html、styles.css、src/main.js、src/storage.js、tests/storage.test.*、docs/QA_REPORT.md。
- 操作：分类选题、三层切换、回答提交后展开 rubric、人工 pass/review、会话草稿与正式记录分离；按 v1 保存最新状态；坏 JSON/禁用存储优雅降级；说明刷新会清空草稿。
- 验收：空输入提示；中英文及 HTML 字符安全显示；刷新保留自评；切换不串题；损坏/禁用 localStorage 不白屏；无 Key 全流程可操作。
- 风险/退路：先简化样式和选题交互，不简化数据隔离与安全文本渲染。
- 完成摘要：手动路径、存储失败场景、修改文件与 commit → T04。
- 学习：草稿与自评为什么分开？为什么只保存最后状态？AI 为什么不能替学生点 pass？

## T04｜Depth Meter 与复习单（Sol；禁止 Subagent）

- 目标/价值：将自评变成可带走的下一步行动；依赖 T03；约 1–2 小时。
- 读取：storage.js、main.js、questions.json、index.html；D06。
- 允许修改：src/export.js、src/main.js、index.html、styles.css、tests/export.test.*、docs/QA_REPORT.md。
- 操作：显示当前层和 pass/review/未评；按题目×层级最后状态导出 UTF-8 Markdown；无 AI 则如实标注；暂不添加统计图。
- 验收：至少 5 个题层组合校验；review→pass 后从复习单移除；全 pass/空数据有明确提示；下载可打开且中文正确；颜色外有文字状态。
- 风险/退路：保留简单列表和 Markdown，不做复杂排版。
- 完成摘要：导出实测、状态转换、commit → T08/T09。
- 学习：当前复习项和历史失败次数有何区别？为什么不能只靠红绿色？导出如何保证对应正确题层？

## T05｜浏览器 API/CORS Spike（Sol；禁止 Subagent）

- 2026-11-17状态：BLOCKED（认证成功与结构化输出待Key），无凭证调查已完成。基线b8c3443、main干净，15/15测试通过。真实HTTPS origin预检200，浏览器无效测试令牌POST得到可读401；Python无认证请求401。断网/过期AbortSignal为受控测试，429与供应商真实超时NOT RUN。用户要求Key后续配置，真实生成0次，临时面板已移除。结论C，T06/T07不开工。仅改本报告及API_SPIKE_REPORT；无Subagent，实际底层模型子型号未核实。详情与最小补验步骤见 docs/API_SPIKE_REPORT.md。


- 目标/价值：用证据决定是否投入 Live；依赖 T01，优先不拖慢 T04/T09；主动排查 60–90 分钟。
- 读取：SETUP_REPORT、MASTER_PLAN AI 契约、D05/D07；供应商官方说明。
- 允许修改：work/api-spike.html（去敏临时页；如需部署先审查）、docs/API_SPIKE_REPORT.md；不修改正式自评流程。
- 操作：确认用户安全输入有效 Key，从真实 HTTPS origin 发最小请求；检查预检/响应、JSON 模式、延迟；错误 Key、网络/超时可控制测试。429 等无法安全触发则用本地 mock，并标注非供应商实测。不为测试故意耗尽额度。
- 验收：报告时间/origin/endpoint/model、请求结果、去敏证据、JSON 兼容与未测项；只有真实浏览器成功才标通过。没有 Key 标未测试；禁止将 Key 放工具参数、日志或文档。
- 风险/退路：CORS/额度受限就停止 Live 主线；临时测试页从公开发布内容移除；保留手动+模拟。
- 完成摘要：通过/失败/未测、证据、是否进入 T06；必要时向 Astra 提交单一争议点。
- 学习：预检是什么？curl 成功为何不能证明浏览器成功？Key 实际发给谁？

## T06｜BYOK 与安全降级（Sol；禁止 Subagent）

- 目标/价值：真实诊断的最小可靠调用；依赖 T05 通过且 T09 核心稳定；约 2–3 小时。
- 读取：API_SPIKE_REPORT、main.js/storage.js/demo.js、D05–D07。
- 允许修改：src/ai.js、src/main.js、index.html、styles.css、tests/ai.test.*、docs/QA_REPORT.md、README。
- 操作：固定经验证 endpoint/model、临时 Key、用户主动调用、长度限制、单请求、超时取消；保存输入；切层/改答后使旧反馈失效；错误可读且不破坏自评。
- 验收：一次真实成功；认证/限流/超时/网络错误处理（mock 与实测分别记）；Key 不在存储、仓库或日志；Demo 不调用 API；无 Key 仍可练习。
- 风险/退路：稳定性不足禁用 Live 入口；不自动换服务商或增加后台。
- 完成摘要：真实请求证据、错误回退、未测项 → T07。
- 学习：AbortController 解决什么问题？为什么旧请求可能污染新题？Key 留内存是否等于绝对安全？

## T07｜Gap Radar 与真实诊断导出（Sol；禁止 Subagent）

- 目标/价值：输出可核对的漏点和追问；依赖 T06；约 2–3 小时。
- 读取：ai.js、main.js、storage.js、export.js、题库与 D06/D07。
- 允许修改：上述四个 JS 文件、tests/ai.test.*、index.html/styles.css 的反馈区域、docs/QA_REPORT.md。
- 操作：实现结构化 Prompt、字段/枚举/索引校验；最多一条 quote 且必须匹配原输入；唯一聚焦追问；在用户自评且同意保存摘要时绑定当前真实诊断，导出相应 review 条目。
- 验收：完整/遗漏/概念错误回答实际观察；含“可能”的合理回答不以措辞判错；无效 quote/JSON 安全降级；修改回答后不能绑定旧诊断；AI suggestion 不改变自评。
- 风险/退路：响应不稳定则仅显示校验通过的漏点/追问或回退 rubric；不展示伪证据。
- 完成摘要：真实模型反馈与误判、校验测试、导出一致性 → T11。
- 学习：JSON 合法与语义正确是否相同？原句引用怎么验真？为什么漏点不能等同能力分数？

## T08｜手动 Retry（Sol；禁止 Subagent）

- 目标/价值：先实现反馈后的主动再解释；依赖 T04，不等待 AI；约 1–2 小时。
- 读取：main.js、storage.js、index.html、D06/D07。
- 允许修改：src/main.js、index.html、styles.css、docs/QA_REPORT.md。
- 操作：首次回答快照与第二次解释分开显示；无 AI 可根据 rubric 修正，有 AI 后使用当前追问；会话内按题层隔离。
- 验收：Retry 不自动发请求、不自动 pass；切题不串内容；刷新清空行为有说明；旧诊断只能标为首次回答诊断，不能宣称已评估 Retry。
- 风险/退路：简单两个文本区，不做差异高亮或二次评分。
- 完成摘要：Before/After 行为、零自动调用 → T09。
- 学习：改写为什么不证明提升？为什么需要首次快照？二次回答为什么不应自动收费？

## T09｜英文 Simulated Demo（Sol；禁止 Subagent）

- 目标/价值：国际评委无 Key 可理解完整产品；依赖 T08；约 2–3 小时。
- 读取：main.js、storage.js、export.js、index.html、D04/D07/D10。
- 允许修改：src/demo.js、src/main.js、index.html、styles.css、docs/QA_REPORT.md。
- 操作：固定英文题、错误示例、模拟漏点/追问/Retry；独立内存状态；显著入口和持续模拟标记；关键操作英文可读。
- 验收：Network 无 AI 调用；进入/操作/退出前后正式 localStorage 相同；桌面/移动端可读；资源加载后断网可完成。首次无缓存离线访问不作为已支持功能。
- 风险/退路：采用简单固定步骤演示；不开发通用对话引擎。
- 完成摘要：无 Key、隔离、断网边界和公开版本验证。此时才允许讨论可选 Subagent。
- 学习：模拟与 Live 如何区分？为什么不能共用持久化记录？资源已加载后的断网与首次离线有何区别？

## T10｜可选扩到 6 题（Sol 集成；可选 Luna 子任务）

- 目标/价值：增加有限覆盖，不能拖延交付；依赖 T02 且 T09 已验收；约 1–2 小时。
- 读取：当前题库、QUESTION_REVIEW、schema 契约；Luna 只需指定样例和来源要求。
- 允许修改：Luna 仅 work/questions-candidate.json、work/questions-sources.md；Sol 独占 data/questions.json、docs/QUESTION_REVIEW.md。
- 操作：仅在 Sol 同时有独立必要工作时委派 3 题候选；禁止递归、提交或改正式数据；Sol 查技术来源、去重、校验并请用户审校后合入。
- 验收：每题来源/三层/rubric 自洽；schema 测试通过；抽查 UI 实际加载。草稿不能称人工批准。
- 风险/退路：没有并行收益就 Sol 完成；接近冻结或审校耗时就 SKIPPED，保留 3 题。
- 完成摘要：新增数量、来源、审校状态、相关测试 → T11。
- 学习：资料支持的是哪条 rubric？为什么边界题不能只是定义换句话说？数量为何不等于质量？

## T11｜QA 与有限试用（Sol 主执行）

- 目标/价值：得到最终交付的实际证据；依赖 T04/T08/T09，已启用的 T06/T07/T10 也需完成；约 2–4 小时。
- 读取：实际源码相关部分、既有测试、QA_REPORT、README、D07/D10–D12。
- 允许修改：docs/QA_REPORT.md、docs/USER_FEEDBACK.md、现有 tests；缺陷修复单独列精确文件并按原任务边界执行。
- 操作：运行必要自动测试及一次最终端到端；覆盖空/坏存储、空输入、特殊文本、切题、刷新、review→pass、Demo 隔离、资源路径、移动端、已启用 Live 错误路径。按实际情况邀请试用，不捏造人数。
- 验收：P0 全通过或已退回明确功能范围；记录命令、版本、浏览器、实测/mock/未测；首次用户可按 README 启动。可选 Luna 只读检查指定冻结模块，返回发现，不与 Sol 重复整套 QA。
- 风险/退路：禁止 Subagent 执行端到端、共享浏览器或修复主线；非关键缺陷列后续，不扩重构。
- 完成摘要：发布候选 commit、P0 结果、真实试用和剩余风险 → 最终审核/T12。
- 学习：mock 能证明哪些行为？手测和自动测试分别覆盖什么？未测试与通过有什么区别？

## T12｜最终审核、材料与提交（Astra 审核；Sol/用户执行）

- 目标/价值：形成真实可访问的完整参赛交付；依赖 T11；约 3–5 小时加上传/审核等待；11/20 目标，11/21 补救。
- 读取：QA_REPORT、发布候选 diff/commit、README、实站/仓库、官方规则、实际视频与提交草稿。Astra 只按风险补读源码。
- 允许修改：README、docs/SUBMISSION.md、演示脚本和媒体文件；如派 Luna 早期写材料，仅允许 work/submission-draft.md；最终阶段禁止 Subagent。
- 操作：可选 Luna 根据已验证功能起草英文问题/做法/限制，不编经历；Sol/用户核对后整理；Astra 审查版本、隐私、模拟标记、功能与材料一致性；用户录制/确认真实经历、完成必要登录和身份声明；按已有授权发布并提交，缺授权则先呈现最终材料。
- 验收：公开 repo/HTTPS/视频在无登录状态可访问；按官方核实的长度要求检查视频；Education 与 AI 贡献披露正确；保留 Devpost 非草稿的提交确认。外部步骤未完成不得将 T12 标 DONE。
- 风险/退路：先录最短完整手动+明确模拟路径；Key 泄漏需撤销轮换，不能只删当前文件；无新证据不返工全部架构。
- 完成摘要：发布 commit、网站/仓库/视频/提交链接、审核结论、确认时间或待用户项 → T13。
- 学习：AI 开发辅助与产品 AI 有何区别？公开链接如何验收？为什么删代码中的 Key 不足以解决泄漏？

## T13｜Demo Day（Sol/用户；禁止 Subagent）

- 目标/价值：履行展示要求；实际展示基于 T12 的交付版本，公告核查从今天开始，预录截止若更早则前置；约 1–2 小时准备，实际活动另计。
- 读取：官方 Discord/通知、SUBMISSION、README、D10/D11；不可访问的通知请用户提供，不能推断。
- 允许修改：docs/DEMO_DAY.md、备用讲稿、离线演示包；不增加新产品功能。
- 操作：核实直播/预录安排与时区；准备 60–120 秒备用讲解和本地 HTTP Demo；用户排练三层、rubric、BYOK/CORS、人工控制、Simulated/Live 区别。
- 验收：准确时间/交付要求有来源；备用包实测；用户真实参加或提交预录后记录证据，准备完不等于已履约。
- 风险/退路：网络不稳用已准备的本地 Demo；不声称离线能调用 Live AI。
- 完成摘要：展示要求、准备结果、真实履约证据与剩余事项。
- 学习：如何讲清核心技术取舍？离线能展示哪些功能？如何诚实回答未完成项？

## 精简委派模板（仅符合 MASTER_PLAN §6 时使用）

任务：[ID/单一目标]。基准：[commit]。只读：[精确文件/契约片段]。只写：[互斥候选文件]。验收：[明确条件]。禁止创建子 Agent、修改正式源码/规划、运行 Git 写操作、操作共享浏览器、部署或扩大范围。遇到缺输入/技术争议先记录，不自行扩查全仓。最终只回结论、修改文件、测试结果、未解决风险，完整证据留在指定文件；主执行者审查并集成。

## 测试矩阵（本轮全部 NOT RUN）

每条结果记录 commit、时间、环境、实际动作/命令、预期/实际、证据路径。若使用 mock 必须单独标记，不可据此写供应商已支持。候选测试目录是规划，不代表测试文件已创建。

| ID | 范围/方法 | 必须满足的观察结果 | 对应任务 | 当前 |
|---|---|---|---|---|
| Q01 | 本地 HTTP + 浏览器 | 首页/CSS/模块正常，控制台无致命错误 | T00 | NOT RUN |
| Q02 | JSON 正反例校验 | 重复 ID、缺层、空 rubric 被拒绝，合法数据加载 | T02 | NOT RUN |
| Q03 | 加载失败/重试 | 可读提示，无白屏，恢复后可继续 | T02 | NOT RUN |
| Q04 | 无 Key 实际操作 | 选题→回答→rubric→自评→导出可独立完成 | T03/04 | NOT RUN |
| Q05 | 空输入/中文/特殊 HTML | 空输入提示，长文本受控，HTML 作为文字 | T03 | NOT RUN |
| Q06 | 跨题层/刷新 | 自评恢复，不串题；草稿刷新规则明确 | T03 | NOT RUN |
| Q07 | 坏存储/禁用存储 | 不崩溃；提示无法持久化，仍可内存练习 | T03 | NOT RUN |
| Q08 | 五个题层状态/导出 | review→pass 后移除，全 pass/空记录有说明 | T04 | NOT RUN |
| Q09 | Depth Meter | 当前层与自评区分，文字不依赖红绿颜色 | T04 | NOT RUN |
| Q10 | Retry + Network | Before/After 隔离，不自动请求/判 pass | T08 | NOT RUN |
| Q11 | Demo 前后存储/网络 | 无 AI 请求、正式记录完全不变、模拟标签持续可见 | T09 | NOT RUN |
| Q12 | 加载后断网/移动视口 | Demo 仍完成；关键按钮/文字无遮挡 | T09 | NOT RUN |
| Q13 | 无痕实站 + 子路径 | HTML/CSS/JS/JSON 无 404，未登录可访问 | T01/11 | NOT RUN |
| Q14 | HTTPS origin 真实 API | 预检/实际请求/响应证据，JSON 模式结论 | T05 | NOT RUN |
| Q15 | 认证/限流/网络/超时 | 错误可读、保留回答、人工自评可继续 | T06 | NOT RUN |
| Q16 | 快速切层/改答/重复点击 | 无重复请求与过期结果污染 | T06 | NOT RUN |
| Q17 | JSON/引用/建议验证 | 坏字段拒绝；伪引用不展示；建议不改正式状态 | T07 | NOT RUN |
| Q18 | 三类真实回答 | 记录完整、遗漏、错误回答的实际反馈与误判 | T07 | NOT RUN |
| Q19 | 存储/仓库/历史/录屏检查 | 无真实 Key；诊断仅为用户同意保存的 live 摘要 | T11/12 | NOT RUN |
| Q20 | 按 README 从干净副本启动 | 命令可用，资源完整，最终版本一致 | T11 | NOT RUN |

不启用 Live 时，Q14–Q18 中对应未实现功能可标 NOT APPLICABLE 并说明原因；不能改成 PASS。导出、隔离、安全和真实提交等 P0 不因删 AI 而豁免。

## 提交矩阵（本轮全部待完成）

| 交付 | 验收证据 | 负责人 | 截止策略 |
|---|---|---|---|
| 公开源仓 | 未登录访问；README 启动、限制、工具贡献与来源齐全 | Sol/用户 | 先预览，11/20 最终版 |
| HTTPS 产品 | 无 Key 主流程、英文 Demo、发布 commit 对应 | Sol | 11/15 预览，11/18 冻结 |
| 题库审校 | 3 题×3 层的资料依据与真实人工审核状态 | Sol/用户 | 核心内容 11/15，最终 QA 前确认 |
| 视频 | YouTube/Vimeo 可播放、≤6分钟、实际操作、无 Key 暴露 | 用户为主，Sol 协助 | 11/19 草稿，11/20 完成 |
| Devpost 内容 | Education、问题/方案/AI 披露/真实学习/限制 | Sol/用户 | 早建草稿，11/20 提交目标 |
| 正式提交 | 明确成功而非草稿的确认信息及时间 | 用户/获授权执行者 | 11/21 前完成，官方截止仅应急 |
| Demo Day | 实际公告、直播/预录要求、提交或参加证据 | 用户 | 今天查公告，按实际截止执行 |
| 最终审核 | Astra/实际替代者结论，QA、视频、实站一致 | 审查者 | 正式提交前 |

## 八段可复制阶段提示词

这些提示词是未来执行指令，本轮未执行。默认在项目工作区使用 Sol；模型实际不可用时按 MASTER_PLAN 降级并报告真实模型。Prompt 0 可独立粘贴，其余从项目根目录执行。每段禁止 Subagent；只有另行明确执行 T10 等可选任务时才考虑 Luna。

建议次序：0→1→2→3→5（手动模式）→6→4（Spike 通过才执行）→5（AI 增强模式）→7。每次只完成所选阶段，已验收功能不要重复实现。Prompt 3 的部署可在 0 后先执行，Spike 放在手动主线稳定后；若等待账号权限，继续不依赖它的任务。

### Prompt 0｜今晚第一条 Codex 提示词

```text
你负责 Unscripted 的 T00：从零创建能在 Windows 本地浏览器运行并用 Git 提交的最小首屏。本机没有任何项目源码、题库或旧数据；不得依赖旧仓库、远程备份、index.html 或 questions.json。只做本阶段，不开发完整产品，不启动 Subagent。

目标目录：当前用户选定工作区下的 unscripted 子目录。先报告当前工作目录和解析后的绝对目标路径。目标若已有文件，不覆盖、不删除，保留并选择明确的新目录或说明冲突。读取适用的 AGENTS.md；只检查仓库边界，不审计无关旧项目。不能在上级 Documents/Codex 仓库误执行 git add。

1. 实测环境：记录 PowerShell、git --version；通过 Get-Command 等检查 py/python/node，实际运行存在的版本命令；检查可用浏览器和浏览器控制工具。确认目标写入能力、可用端口。不要输出环境变量、凭证或全量配置。不存在的工具写“未安装/不可用”，不宣称现成可用。不自动安装框架、包管理器或大批依赖。

2. 只创建 index.html、styles.css、src/main.js、README.md、.gitignore、docs/SETUP_REPORT.md。若工作区已有 outputs 下的 MASTER_PLAN.md、TASKS.md、DECISIONS.md，复制到新项目 docs/planning 作为后续唯一维护源；缺失不阻塞此首屏，不编造文件内容。仅在无 Python 但 Node 可用时，可新增无第三方依赖的 tools/serve.mjs 用作本地静态 HTTP 服务；只绑定 127.0.0.1，限制访问在项目目录内，设置正确 MIME 类型。

3. 首屏必须真实显示 Unscripted（脱稿）、“AI can write your code. Can you explain it?”、一句产品说明、L1 Explain/L2 Reason/L3 Stress-test 三层说明，以及 Practice、Try Demo 两个入口。练习和 Demo 尚未实现，入口必须 disabled 并标“Coming soon / 开发中”；可以提供可用的页面内说明链接，但不能假装练习/AI 已完成。简单响应式布局，不用 React/Vue、CDN 组件、后端、账户、数据库、外部字体、Key 或模拟实时反馈。使用相对资源路径和 JS ES Module，不提前创建空题库/API 模块。

4. 启动真实 HTTP 服务：如 py 可用，从项目根目录运行 py -m http.server 5173 --bind 127.0.0.1；否则选实际可用的 python 或 Node 方案。端口占用时选空闲端口，绝不结束不明进程。记录实际地址、启动与停止方式。若使用 Start-Process，后台窗口隐藏。不能用双击 file:// 充当验收。没有运行能力时完成文件并报告最小缺口，不声称已运行。

5. 实际验收：HTTP 请求检查首页、CSS、JS 的状态和类型；用可用浏览器工具打开实际 URL，检查产品名、三层、禁用入口、桌面和约390px移动视口、控制台及网络错误。没有浏览器工具时如实写“浏览器验收未执行”，提供用户最小手测清单；HTTP 200 不能冒充视觉/交互通过。不为静态文案编写镜像测试，不安装重型测试框架。

6. README 写本机验证过的 PowerShell 启动命令、真实能力、尚未实现功能、零依赖/实际依赖和停止方式。SETUP_REPORT 写环境版本、目标目录、创建文件、启动地址、每项验收的命令/预期/实际、PASS/FAIL/NOT RUN、阻塞与下一步；所有未运行项目必须 NOT RUN。报告不得含 Key 或敏感配置。

7. 在明确的新项目根目录 git init；核实 git rev-parse --show-toplevel 正是目标目录；检查现有有效提交身份，不伪造姓名邮箱，不擅自修改全局配置。缺身份时先完成其余工作，再请求用户提供该项。检查 git status 和 diff，只暂存本阶段文件，不提交日志、凭证或无关文件。具备条件时创建首个有意义 commit，例如 chore: initialize Unscripted static landing page，并用 git log -1 和 git status 验证。不能只给建议命令就声称提交成功；Git 不可用时明确阻塞。

结束报告保持简洁：实际模型、项目绝对路径、启动命令/URL、文件清单、实际测试及未测试、真实 commit 哈希或阻塞、下一步 T02。若规划文件存在，更新 T00 状态摘要。最后给我三个自测题：HTTP 与 file:// 的区别；ES Module 如何从页面加载；Git commit 与 GitHub 发布的区别。完成 T00 后停止，不自行推进整套产品。
```

### Prompt 1｜首批三题与 schema

```text
仅执行 Unscripted T02，禁止 Subagent。读取 docs/planning/MASTER_PLAN 的数据契约、TASKS T02、src/main.js 和 README；不重读全部聊天，不假设已有题库。
允许修改 data/questions.json、src/questions.js、src/main.js 的加载入口、docs/QUESTION_REVIEW.md 和最少的题库校验测试。
从零写3道题，每题 L1 Explain/L2 Reason/L3 Stress-test，每层2–4条可验证rubric。优先 volatile/复合操作、缓存穿透与击穿、一个明确的数据库事务机制。查官方技术资料并记录每条关键依据；未获用户人工确认标待审，不把模型生成当标准答案。
实现数组schema、唯一ID、恰好三层且顺序正确、非空prompt/rubric校验，通过HTTP fetch加载，失败给提示与重试。题目数据使用真实分类，不硬编码五类。答题前不展示rubric；当前未实现答题时不提前泄露参考答案。
用已安装运行时或浏览器测试合法数据和重复ID/缺层/坏rubric；不新增重框架。报告实际命令和结果、来源、待人工审校项；运行成功后主执行者提交并更新T02摘要。最后给3个自测题：结构校验能否证明知识准确、三层的区别、为什么rubric必须可核验。不要继续写完整练习流程。
```

### Prompt 2｜无 Key 完整主路径

```text
完成 T03→T04，每个任务分别验收再提交；禁止 Subagent。只读当前任务卡、MASTER_PLAN 状态契约、D06/D07 和题库/页面相关文件。允许改 index.html、styles.css、src/main.js、storage.js、export.js、相关最小测试和 QA_REPORT。
实现选题/分类、三层回答、非空提交后查看rubric、人工pass/review、Depth Meter和当前review的Markdown导出。没有API Key也必须全程可用。localStorage键为unscripted.progress.v1，按题ID::层ID保存最新自评；会话草稿与持久化分离。坏JSON/禁用存储要提示并继续内存模式，不白屏，不静默清空用户原记录。
只用安全文本节点渲染输入；AI模块尚不存在，不显示假诊断。复习单无AI时明确写未经过AI分析。review改pass后立即从当前复习单移除；空记录/全pass有明确状态。
实测空输入、中文/HTML、切题层、刷新、损坏/不可用存储、至少5个题层状态、下载UTF-8文件；没运行就NOT RUN。每阶段报告文件/命令/结果/commit/风险并更新摘要。最后问：草稿与正式状态为什么分开、最后状态与历史次数有什么区别、导出如何对应题层。
```

### Prompt 3｜HTTPS 预览与实际 CORS Spike

```text
执行T01发布预览和T05限时Spike，两个任务分别报告；禁止Subagent。若只授权/只具备发布条件则先完成T01，缺Key不阻塞其余开发。读取SETUP_REPORT、README、MASTER_PLAN官方核验记录、D05/D13及当前任务卡。
优先GitHub Pages，先准备可审查文件，检查远程/公开发布权限并遵循已有授权；缺权限时只询问具体阻塞项。相对资源路径必须在项目子路径下可用，用未登录窗口验证真实HTTPS地址。将实际URL和commit写入报告，不能把部署配置文件当作已上线。
由用户在受控界面临时输入Key，不让用户把Key发聊天，不写源文件、日志、localStorage或截图。候选https://api.ant-ling.com/v1、Ling-3.1-flash仅是待测候选；先确认当前官方说明，不能宣称可用。从实际HTTPS origin浏览器测试预检和实际请求、JSON输出、延迟；服务端curl不能代替。只做最少必要请求，主动排查60–90分钟后决定，不自动重试收费调用。
报告docs/API_SPIKE_REPORT.md：时间、origin、endpoint/model、去敏证据、通过/失败/未测试、失败类别与未测项。429等用mock时必须注明。CORS无法支持就停止Live投入，不建代理；缺Key写未测试。CORS不等于API-credit规则例外，相关资格由用户向主办方确认。临时页不留公开凭证。最后解释预检、浏览器与curl差异、Key发送目的地。不要直接接入完整AI。
```

### Prompt 4｜条件性 BYOK、响应契约与降级

```text
仅在T05有真实浏览器成功证据且手动闭环/英文Demo已稳定时执行T06；否则更新阻塞/跳过原因后停止，禁止Subagent。读取API_SPIKE_REPORT、T06/T07响应契约、D05–D07及main/storage/demo相关文件。
允许改src/ai.js、main.js、页面AI设置区、最小ai测试、QA_REPORT和README。固定唯一已验证endpoint/model，Key仅内存，说明会发给供应商；只发当前题层/rubric/回答。主动点击才请求，输入限长、防重复并发、约20秒超时，切层/改答使旧结果失效；失败保留回答和人工自评。
验证missing字符串数组、最多一项evidence_gaps、followup字符串、suggestion枚举pass/review、comment字符串；rubric_index从0开始，quote必须是该次回答子串。非法输出安全降级，不执行模型指令，不innerHTML插入动态文本。此阶段提供规范化响应供下一阶段显示，不扩展复杂Radar UI。
至少一次真实调用；其余认证、限流、超时、坏JSON、过期响应可用最小mock，明确区分。Demo无AI请求，Key不持久化。报告真实测试、费用相关请求次数（如可观察）、风险、commit及阶段摘要。最后问：为什么取消旧请求、JSON合法为何不等于正确、内存Key有什么局限。
```

### Prompt 5｜Retry、Gap Radar 与复习闭环

```text
本提示词有两种作用域：T06尚未完成时只做“手动闭环”；T06完成时只补“AI增强”。先读取TASKS当前状态确认，已完成且有有效验收证据的部分不重写。禁止Subagent。
读取T04/T08或T07当前卡、main/storage/export以及存在的ai.js。允许改这些对应JS、页面相关区域、必要测试与QA_REPORT，不能更改v1契约或加入新服务。
手动闭环：实现T08首次回答快照与Retry对照，结合已有Depth Meter/Crash Sheet。基于rubric自行修正，不自动API调用、不自动pass。草稿按题层隔离，刷新规则清楚；人工自评是唯一最终状态。
AI增强：实现T07显示校验通过的missing、最多一条真实引用和一个聚焦追问；引用必须为首次回答真实子串且索引有效。用户自评并同意保存后才能把当前live摘要绑定本题层；改答后旧诊断不能被误当新评估。复习单只含当前review，明确首次诊断不等于评估Retry。没有live时绝不补造AI线索。
验收手动/已启用AI两路径、切题、Retry不收费、review→pass移除、伪引用/HTML/坏JSON安全处理。记录三类真实回答的反馈和误判，若未启用AI则不适用。提交相应阶段，更新简短状态并给3题：Retry是否证明进步、引用如何验真、为什么AI不能自动修改自评。
```

### Prompt 6｜英文 Simulated Demo 与基本响应式

```text
仅执行T09，禁止Subagent，不等待Live。读取T09、D04/D07/D10及main/storage/export/页面。允许改src/demo.js、main.js、index.html、styles.css和QA_REPORT。
创建一套技术核验过的英文固定题、错误回答、模拟漏点/追问与Retry示例。入口Try Demo — No API Key Needed，所有反馈区域持续显示Simulated example — no live AI call。Demo状态仅在独立内存，不调用API，不写正式进度，退出回练习；关键按钮和反馈英文可读。不翻译整套题库，不创建通用聊天系统。
检查进入前/退出后的正式localStorage完全一致，Network无AI请求；无Key完成流程；页面资源加载后断网仍可演示，不能把首次无缓存离线打开称已支持。检查桌面和移动视口、键盘焦点、标签不被遮挡。记录实际结果、技术内容来源和未测试项，提交并更新T09；最后问模拟与Live区别、隔离的必要性、两种离线场景区别。
```

### Prompt 7｜QA、材料与正式交付

```text
执行T11→T12，并准备/跟踪T13；每个任务独立验收，禁止Subagent做最终检查和外部操作。读取当前任务卡、测试/提交矩阵、D11–D13、QA_REPORT、README和发布候选diff；仅按风险补读源码。
逐条执行适用矩阵，填写PASS/FAIL/NOT RUN/NOT APPLICABLE及证据；mock不当真实API通过。检查无Key、状态恢复、导出、Demo隔离、XSS、失效反馈、移动端、HTTPS子路径。检查当前文件和Git历史/录屏是否含Key，工具输出不得显示秘密；若泄漏先通知撤销轮换，再处理公开内容。禁止为追求全绿伪造结果。
完成README、真实AI工具贡献披露、已知限制、英文Devpost草稿和90–180秒脚本；视频必须实拍运行且≤6分钟，上传YouTube/Vimeo并确认未登录可播放。用户本人确认真实学习经历、身份与必要登录。向Astra或实际可用审查者提交发布commit、QA、实站/视频和差异摘要，审查可交付风险，不重做架构。
在已有授权范围内完成发布/提交；缺授权时先准备最终可审查内容再问具体项。必须取得Devpost正式提交确认才写T12 DONE，草稿不算。目标11/20、11/21补救。核实Discord直播时刻/时区与预录截止，不从获奖公布时间推断；若需先交预录，提前执行。记录真实履约证据，准备好不等于已参加。不能自行发送给组织者消息。
最终报告实际链接、commit、验收结果、未完成/用户待办与3个学习问题：开发辅助AI与产品AI区别、如何证明发布版本一致、如何解释项目当前局限。
```
