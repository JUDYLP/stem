# 验证证据与下一阶段计划

当前状态：Stage 1.1 + 2A本地实现完成待审核。当前证据见文末；Stage 1记录保留供追溯。

## 总体验收矩阵（部分由Stage 2A覆盖，注册/UI/迁移仍未实现）

| 场景 | 预期 | 校验位置 |
|---|---|---|
| 完整JSON示例 | 全包通过，预览3题9层，默认Pack不变直到确认 | 入口+结构+语义+UI |
| 非法JSON/顶层null或数组 | 拒绝并指出错误，不部分导入 | JSON/Schema |
| 空questions | 拒绝 | minItems |
| 重复Pack ID | 内置ID受保护；相同版本同摘要幂等，不同摘要拒绝；新版本需确认 | 注册表 |
| 重复Question ID | 即使题干不同仍拒绝 | Pack语义集合 |
| 不同Pack同Question ID | 都可注册且草稿/记录互不影响 | 注册+训练 |
| 重复Rubric ID | 包内跨题/跨层均拒绝，不能靠uniqueItems | Pack语义集合 |
| 缺层/多层/顺序错误/label错误 | 只接受L1 Explain、L2 Reason、L3 Stress-test | Schema tuple |
| 缺rubric/空rubric/重复语言条目 | 拒绝 | Schema |
| 声明语言但漏译/多出未声明译文 | 拒绝，不自动删字段或机器补译 | 语义 |
| 不支持用户UI语言 | 全包内容回退defaultLanguage，明确提示，不混译 | UI |
| 非法类型/空白字符串/未知字段 | 拒绝，错误带JSON路径 | Schema+语义trim |
| 超大JSON/嵌套32与33边界 | 1MiB边界允许，超过拒绝；超深在昂贵递归前拒绝 | 入口 |
| 非法UTF-8/非有限数/重复JSON成员名 | 拒绝，不能依赖JSON.parse丢掉重复成员 | 入口 |
| reviewed无审校人/无效日期 | 拒绝；有效声明也不等于平台认证 | Schema+日历语义 |
| HTML/script/事件属性字符串 | 可作为纯文本材料；预览/练习/错误/导出不执行 | 真实浏览器 |
| __proto__/constructor未知键、外部$ref、Provider字段 | 拒绝；Map和白名单不受原型污染 | 结构+安全 |
| Pack切换中有草稿/延迟建议 | 先确认；旧内容/历史/请求不得串包 | 集成 |
| 版本更新/降级/同版本不同内容 | 按不可变版本与摘要处理，旧Pass不自动继承 | 注册+存储 |
| v1合法/无数据/损坏/未知ID | 明确映射或阻止；保留源字节，不猜题目版本 | 迁移 |
| history.v1含answer/位置漏点 | 保留原始私有备份；不把下标关联到新Rubric | 迁移 |
| 配额/读回失败/崩溃后恢复 | 每一步故障注入；不覆盖v1，不把临时数据当成功 | 迁移 |
| 双标签/重复迁移/已有有效或损坏v2 | 独占锁及源目标复查；不覆盖已有目标，幂等 | 迁移 |
| 导出当前Pack/当前版本 | 包名版本可见，只含其review；HTML/Markdown安全转义 | export |
| 无API/无Key/模拟Demo | 全部手动流程继续可用，Demo不写正式记录 | 回归 |
| Evaluation错ID/过期revision/伪引用/缺字段 | 丢弃无效建议，保留回答，人工确认唯一写入点 | 未来独立AI阶段 |

结构通过不证明技术正确、翻译准确或有学习效果；人工内容审核单独记录。

## 本轮实际执行与未执行

- 已执行：最新基线`node --test tests/*.test.mjs`，37/37 PASS（含新增灯号/历史/点阵测试）。
- 已执行：PowerShell内置`Test-Json -Path docs/architecture/question-pack.example.v1.json -SchemaFile docs/architecture/question-pack.schema.v1.json`返回True。未安装第三方依赖；本机Python未安装jsonschema，未假称使用它。
- Schema/示例为审核数据，不是导入器。结构反例及示例一致性检查结果见文末。
- NOT RUN：正式导入UI、注册表、存储v2迁移、跨Pack实际隔离、故障恢复、真实AI；这些系统尚未实现。
- 不重复做页面截图：本轮不改生产源码/页面/题库/部署白名单；通过本阶段提交文件范围检查确认未夹带产品修改（期间存在独立的页面动效工作），不能声称新Pack已在浏览器运行。

## 下一阶段实施计划（需人工审核后才启动）

Stage 2A已本地完成；下表保留阶段边界，2B/2C/2D仍需单独授权。先读ARCHITECTURE_AUDIT、QUESTION_PACK_SCHEMA_V1、PROGRESS_MIGRATION_V2；以最新Git基线为准，不按旧比赛日程推进。默认串行、无Subagent。下面的路径是允许范围建议，尚未创建。

| 阶段 | 目标/读取 | 允许修改 | 验收及退出摘要 | 学习自测 |
|---|---|---|---|---|
| Stage 2A | 纯解析/结构/语义验证；读Schema、示例、旧questions.js | 新src/packs/validate.js、对应Node测试、设计纠错文档；不接main | 矩阵所有输入边界通过；无存储/网络副作用；报告通过/拒绝样本及限制 | 为什么Schema不能验证ID属性唯一？ |
| Stage 2B | 内置Pack转换与只读注册/预览；读2A、题库、i18n | 新data/packs/、src/packs/registry.js、content-language.js、测试；保留旧题库 | 原文逐项相等；所有RubricID稳定；同ID版本冲突、语言回退正确；尚不切正式流程 | 内容语言和UI语言为何不同？ |
| Stage 2C | 独立v2迁移与存储测试；读history/storage/export与迁移设计 | 新存储适配模块、故障注入测试；不自动运行迁移 | 原v1字节不变、备份/候选读回、未知ID/旧答案/并发/配额失败不丢数据；人工复核证据 | 为什么只复制progress会漏掉历史风险？ |
| Stage 2D | 最小接线、导入/切换/卸载；读上述模块和main相关函数 | main入口/key/上下文局部、history/lights建议键、export、必要UI/i18n/部署白名单与测试 | 无API闭环回归；2个同名题Pack互不影响；旧草稿/旧响应不污染；确认后才切换；可恢复旧版 | 为什么相同Question ID不能做全局key？ |
| 独立后续阶段 | Evaluation契约/Provider；以另行授权为前提 | 只按新任务批准范围 | 未获真实接口证据不开Live；不与Pack导入绑定交付 | AI建议为何不能直接写自评？ |

每段完成后记录：实际变更、测试与未测项、commit、风险、下一步。可逆增量优先，不一次性创建整个注册/导入/Provider系统。每段上线前单独审查；本Stage 1完成即停。

## 需人工审核的关键选择

1. 首个内置Pack为组合的unscripted-core，还是立即分成三包？建议组合，减少初次迁移分支。
2. 新版本默认空进度、旧v1映射只作为待重新确认记录：建议接受，防止旧Pass误当新掌握。
3. 声明语言必须逐字段完整、未知字段和无效包整体拒绝：建议接受，减少不可解释的半包状态。
4. 导入容量1MiB/200题/8语言/每层最多12条及history只读归档策略：建议接受为v1上限，实际压力测试再调整。

这些是下一阶段开工前的审核点，不阻塞本轮设计产物交付。作者审校声明的可信来源、未来Provider选择、跨设备同步均不在本轮解决范围。

## 完成时验证记录（2026-11-18）

- 审计初始基线0c09c60：37/37 PASS。期间独立页面工作推进到f92cc82，新增一个点阵测试；完成时重新执行 `node --test tests/*.test.mjs`：**38/38 PASS**，0失败。
- PowerShell `Test-Json -Json <case> -SchemaFile docs/architecture/question-pack.schema.v1.json`：**10/10预期结果正确**。完整示例接受；空题库、缺层、层顺序错误、缺rubric、错误版本类型、未知字段、reviewed缺审校人、label不匹配、保留rubricId分别拒绝。
- Python标准库独立核对：完整示例3题9层29条Rubric；题ID、双语title/prompt/rubric逐项与data/questions.json相同；全部语言映射与声明一致，ID不重复，默认语言有效。示例UTF-8为20,223字节，低于1MiB。
- 4个语义反例均按预期拒绝：重复题ID、跨题重复RubricID、缺少声明语言译文、defaultLanguage不在支持列表。此检查是设计验证脚本，不是已实现的生产校验器。
- 未单独执行官方metaschema验证；本机Test-Json成功加载并执行Schema。技术知识人工审校、恶意HTML浏览器执行验证、导入/迁移/注册端到端仍为NOT RUN。
- 同期工作提交了src/dotfield.js、src/lights.js、src/main.js、styles.css及相关测试和页面文档；它们不是本Stage的实现。TASKS/DECISIONS的Stage 1摘要已被同期文档提交f92cc82包含；本轮保留其后新增的D21记录，不重置提交、不覆盖他人工作。剩余交付仅暂存docs/architecture和docs/planning。

## Stage 1.1 / 2A验证（2026-11-18）

环境Windows、Node24.22.1、npm11.9.0。修改前本地/远端main均f254eea，工作区干净，38/38基线PASS。

| 检查 | 实际结果 |
|---|---|
| npm ci --ignore-scripts --no-audit --no-fund | PASS：固定lockfile，从官方npm registry重装6个开发包；无生命周期脚本执行 |
| npm test | PASS：121/121，原有38项+新增83项，0失败 |
| npm run check:syntax | PASS：21个JS/MJS文件（含全部src、tests、tools） |
| Schema合法示例与原题逐项对应 | PASS：3题9层29条Rubric，title/prompt/rubric双语与原数组一致 |
| Schema异常/嵌套未知字段 | PASS：版本/类型/必填/三层顺序和label/审校字段/空及过量Rubric/所有固定对象额外字段 |
| 语义 | PASS：默认语言、每类翻译缺失/额外语言、包级题ID/跨题跨层RubricID、真实UTC及闰年 |
| 输入安全 | PASS：重复及转义键、对象生成前拒绝、危险键、非法JSON/UTF8/非有限数/代理项、注释/尾逗号/BOM |
| 容量边界 | PASS：UTF8 1MiB及+1字节、32及33容器、200及201题、8及9语言、50错误封顶；10000层快速拒绝 |
| 版本 | PASS：大小/相同/非法/前导零/后缀/末尾换行、超过2^53及24位、100位数字比较 |
| 纯函数 | PASS：输入字节不变、输出互不别名、重复结果相同；子进程禁止DOM/storage/network/console仍可导入和校验 |
| 原打包脚本 | PASS：work/stage2a-static-check中仅12资源+.nojekyll，内容与工作树一致，无校验器/npm/docs/tests |
| 线上回归只读检查 | PASS：12资源HTTP200且SHA256与HEAD原始blob一致（初次与Windows工作树比出现CRLF差异，改用Git原始字节后全一致） |
| 新GitHub Actions远端执行 | NOT RUN：按用户要求不提交/推送、不触发部署；本地执行了对应安装/测试/语法/打包步骤 |
| 真实浏览器UI回归/导入/迁移/删除/JCS摘要 | NOT RUN：页面资产未改；新增运行时、删除与摘要尚未实现，不把HTTP200当视觉通过 |

新增测试在tests/packs.test.mjs；没有删除或替换原测试。语义50条上限不代表返回全部诊断，结构快速失败最多首条（组合规则可能给少量关联诊断），都不返回部分有效数据。

补充未来矩阵：全量删除必须覆盖孤立backup/candidate、旧v1、答案、迁移元数据；取消不写入、失败不声称全清、其他Pack保持（局部清理）、旧标签页写回防护。JCS须用RFC官方向量验证Unicode键排序/转义/数字/数组顺序。以上均设计标准，尚未运行。

Stage 2B准备条件：人工审查本轮差异；确认组合内置Pack与受保护ID策略；单独批准注册预览范围与浏览器端校验分发方案（当前入口仅Node/dev）。不得将校验valid:true当注册/摘要/内容审校通过，也不授权2C迁移或2D接线。

## Stage 2A.1补充证据

本轮基线123项（原121项保留），新增tests/pack-browser.test.mjs的15项，最终138/138通过；25文件语法通过。实际执行npm ci、npm test、npm run check:syntax、npm run build:pack-validator、指定Python打包。构建metafile无外部import/无Ajv编译器；Schema SHA256与仓库一致；共享语义模块直接进入产物。Node禁止动态代码生成测试通过，真实Chrome157在不含unsafe-eval的CSP下8项冒烟通过，控制台无消息。远端CI/部署仍NOT RUN；2B未实现。更多构建证据见STAGE_2A_REPORT.md。

Stage 2B 实测 151/151、32 文件语法通过，Chrome 与 Node 摘要一致。并发、失败原子性、存储隔离及 RFC 向量证据见 STAGE_2B_REPORT.md。远端 CI 为 NOT RUN。

Stage 2C 的18项合成存储验收、读回与崩溃故障注入见 tests/storage-v2.test.mjs。正式页面接线与真实用户迁移未执行。
