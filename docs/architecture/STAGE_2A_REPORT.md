# Stage 1.1 + Stage 2A交付报告

最新状态：Stage 2A.1浏览器构建闭环已完成，见文末；前面为Stage 2A历史交付记录。

日期：2026-11-18。仓库：E:/Project/stem/unscripted。分支main；本地HEAD与通过GitHub连接器核实的远端main均为f254eea4f6c2235e86e514b78a702d6d2ab6a3b8。开始时工作区干净，已包含Stage 1。未发现适用AGENTS.md。

状态：本地实施完成，等待人工审查。**未暂存、未提交、未推送、未部署本轮改动。** 不启动Subagent。所有新增依赖仅用于开发测试，原产品无需npm或新服务即可运行。

## A. 架构修订

1. CI：保留原Pages权限、concurrency与Python资源白名单；Checkout后加Node24、npm ci、全量测试和语法检查，之后才打包部署。没有continue-on-error或always绕过失败。
2. 删除权：局部清理仅当前Pack所有版本，不动其他Pack或迁移备份；全量删除须明确确认，覆盖所有进度/历史/答案、旧v1、全部backup/candidate和迁移元数据。关闭答案开关不保证备份无答案；备份不是不可删除。仅修订规范，没有删除实现。
3. 版本：固定无前导零MAJOR.MINOR.PATCH；无prerelease/build metadata。比较十进制分量长度再按等长数字比较，完全不用Number转换，支持任意长整数语义；Pack字段仍限32码点。
4. 摘要：未来采用[RFC8785 JCS](https://www.rfc-editor.org/rfc/rfc8785.html)规范化UTF8后SHA256，保留数组顺序、按规范排序键、不做Unicode归一化；应用计算，不信任作者摘要，也不代表认证。没有摘要实现。
5. 校验边界：Schema负责完整Draft2020-12结构与三层对应，语义模块负责动态翻译集合、包级ID唯一和真实UTC。全包拒绝，不修复、不部分导入。Schema修正Ajv strictTypes要求和末尾换行正则漏洞。

没有阻塞本阶段的设计冲突。后续仍需审查浏览器端校验分发方式：本轮为Node/dev入口，不能直接从浏览器import裸npm依赖；不得将此限制误当需要后端。JCS实现及注册上下文冲突不属于本阶段。

## B. 工程文件及API

新增8个文件：

- package.json、package-lock.json：固定开发依赖和Node24测试命令。
- src/packs/validate.js：文本/字节校验与版本比较入口。
- src/packs/strict-json.js：限制深度的token遍历、重复/危险键/非法Unicode检查。
- src/packs/semantics.js：独立语义检查和最多50条错误。
- tests/packs.test.mjs：83项新增真实测试。
- tools/check-syntax.mjs：递归检查src/tests/tools的JS/MJS语法。
- docs/architecture/STAGE_2A_REPORT.md：本报告。

修改12个文件：.github/workflows/pages.yml、.gitignore、README.md、docs/QA_REPORT.md；architecture下ARCHITECTURE_AUDIT.md、PROGRESS_MIGRATION_V2.md、QUESTION_PACK_SCHEMA_V1.md、TEST_MATRIX_AND_NEXT_STAGE.md、question-pack.schema.v1.json；planning下MASTER_PLAN.md、TASKS.md、DECISIONS.md。

API：

```js
validateQuestionPackText(text);       // string
validateQuestionPackBytes(bytes);     // Uint8Array，包括Buffer
comparePackVersions(a, b);            // -1 / 0 / 1；非法版本抛TypeError
// valid: true  -> { valid: true, errors: [], pack }
// valid: false -> { valid: false, errors: [{ code, path, message }] }
```

采用Ajv8.20.0的2020入口完整校验权威Schema；Microsoft jsonc-parser3.3.1仅用visitor，不用容错parse结果。检查过官方仓库/许可证与包脚本；二者MIT，lockfile共6个开发包（含传递依赖）；安装使用ignore-scripts，官方registry URL与integrity锁定。没有dependencies字段或浏览器第三方资源。

重复键在解码后逐对象Set比对，转义别名同样拒绝；对象物化前拒绝__proto__/constructor/prototype成员名；不深合并输入。第33层容器即停止。之后JSON.parse再次验证严格语法，避免JSONC容错。UTF8 fatal解码，实际字节上限1MiB；不接受BOM、非有限数或孤立代理项。

错误不携带完整输入/部分Pack，不写日志；语法及结构快速失败，语义最多50条。结构allErrors:false防止先产生海量诊断再裁剪。无DOM/storage/network访问；成功返回的是本次新解析对象，不共享之前结果。HTML字符串作为数据保留，不能等同未来UI渲染已安全。

## C. 真实验证

| 执行 | 结果 |
|---|---|
| 修改前node --test tests/*.test.mjs | 原38/38 PASS |
| npm ci --ignore-scripts --no-audit --no-fund | PASS，重装锁定开发包，不跑安装脚本 |
| npm test | 121/121 PASS：原38+新83；0失败、0跳过 |
| npm run check:syntax | 21文件PASS |
| python tools/package_site.py work/stage2a-static-check | PASS，12资源+.nojekyll；无node_modules/校验器/docs/tests |
| 线上12资源只读GET+SHA256 | HTTP200，与HEAD提交的原始blob全部一致 |
| 新GitHub Actions运行 | NOT RUN：禁止提交/推送；不能声称远端CI通过 |
| 本轮真实浏览器视觉交互复验 | NOT RUN，产品资源没有变化 |
| 注册、导入、迁移、删除、摘要、AI | NOT RUN/未实现，均不在本阶段范围 |

安全与边界用例：见TEST_MATRIX_AND_NEXT_STAGE.md及测试代码。包括恰好1MiB/+1、32/33层、200/201题、8/9语言、50错误上限；32层测试明确是入口合法而非Pack结构合法。纯函数子进程禁止DOM/storage/network/console后实际导入并验证；未用mock代替核心解析或Ajv。

已解决的验证问题：首次Ajv严格编译报告tuple allOf缺object类型，补充Schema类型后通过。首次线上比对按Windows工作树字节遇到questions.json换行差异，改按Git HEAD原始blob比对后12项全部一致。没有把初始失败记录成未经修复的通过。

## D. 产品回归与限制

data/questions.json、原9个src模块、index.html、styles.css、原7个测试、tools/package_site.py均未改。无localStorage迁移、无progress/history结构变更。线上仍是已有纯静态产品，无新后端或AI API。工作流代码门禁已配置，但需要人工审核后提交才能实际在GitHub执行；本阶段不验证新部署成功。

技术内容正确性、作者身份与审校声明真实性不由格式校验保证。当前valid:true只证明单包输入/结构/语义有效，不证明注册冲突、渲染、迁移或来源可信。格式错误按固定遍历次序报告，最多50条，不承诺一次列出全部错误。JCS、跨包进度、存储故障恢复等仍只有设计。

## E. Stage 2B准备条件

先审查本轮diff和测试结果；单独授权后才做内置Pack转换及注册/只读预览。需明确内置组合Pack/保留ID、不可变版本策略、浏览器校验分发方案与JCS验证向量。保留旧题库和旧训练入口；Stage 2C迁移及2D正式接线仍需要另外授权。

工程自测：为什么JSON.parse不能发现重复键？为什么版本字符串不能整体按字典序或Number比较？为什么关闭答案保存后仍需要“删除全部学习数据”？

## Stage 2A.1 — 浏览器构建闭环（2026-11-18）

本轮开始时Stage 2A全部修改尚未提交，另有页面/灯号/历史模块等独立修改；已保留，没有覆盖。开始测试基线为123项（原121项仍保留，其他工作新增2项）。没有操作Git暂存、提交、推送或部署。

### 构建与同源规则

- 新增tools/build-pack-validator.mjs；命令`npm run build:pack-validator`。
- 构建阶段Ajv8.20.0/2020读取仓库唯一Schema，按共享ajv-options.js编译；Ajv standalone生成structure.mjs，esbuild0.28.2将其与共享core.js、strict-json.js、semantics.js打包为独立浏览器ESM。jsonc-parser3.3.1保留visitor实现。
- Node参考入口validate.js只负责Ajv编译后注入createPackValidator；浏览器生成入口注入standalone函数。API包装、UTF8/大小检查、语义、版本比较均复用源码，不维护两套规则。
- 产物：`work/pack-validator/pack-validator.mjs`。同目录structure.mjs/entry.mjs是中间件；metafile.json与build-info.json提供依赖图及Schema/产物SHA256证据。这些文件均被work/规则忽略，不要求提交。
- metafile确认无外部import，且没有Ajv compiler/core/2020模块；仅打包必要的Ajv运行辅助函数。无CDN、无浏览器Schema动态编译、无eval/new Function。Ajv本身在Node构建期使用Function编译，这是构建行为，不进入浏览器产物。
- esbuild是固定开发依赖，lockfile锁定平台二进制包；本机npm ci实际安装8个包。已读安装脚本：检测平台并检查二进制版本，缺平台包时有下载后备路径。本机平台包存在；CI原ignore-scripts方式仍可使用平台包，不新增服务。
- 本轮不将产物加入Pages白名单，不接main.js，不实现注册或UI。目标为支持现代ES2022及String.isWellFormed的浏览器；实际验证Chrome157，其他浏览器兼容性未测。

### 架构决策正式接受

**Ajv allErrors:false**：接受结构快速失败，允许仅首个结构错误；组合规则可能有少量关联诊断，不保证一次列出全部问题。限制不可信输入的诊断开销。语义错误仍最多50条，失败不返回部分Pack。

**jsonc-parser visitor**：保留，不改parseTree。已检查node_modules/jsonc-parser/lib/umd/impl/parser.js中的visit、parseString(false)、onObjectProperty路径：scanner解码字符串后调用属性回调。项目strict-json.js在对象开始/结束维护独立Set，属性回调先检查危险键及解码后的重复键，全部通过后才JSON.parse物化对象。嵌套/数组内重复、转义重复、危险/转义危险键均有实际测试；对象生成前拦截也有测试证明。原83项packs测试文件未修改。

### 实测结果

| 命令/检查 | 结果 |
|---|---|
| npm ci | PASS |
| npm test | 138/138 PASS，0失败：本轮基线123+浏览器构建测试15；没有删除或弱化原121项 |
| npm run check:syntax | PASS：25个JS/MJS文件 |
| npm run build:pack-validator | PASS，生成独立ESM |
| python tools/package_site.py work/stage2a-static-check | PASS：12资源+.nojekyll；先将原同名目录保留到带时间戳的同级备份，没有删除旧产物 |
| Node/浏览器产物一致性 | PASS：合法/非法结构、翻译、日期、Rubric重复、JSON重复/转义键、危险键、容量/深度、UTF8及大整数比较 |
| 禁动态代码生成 | PASS：产物在Node --disallow-code-generation-from-strings下导入并验证 |
| 真实Chrome157 | PASS：独立本地HTTP页面，CSP为default-src 'none'; script-src 'self'; connect-src 'self'，无unsafe-eval；8项冒烟检查全true，控制台无消息 |
| 远端CI/部署 | NOT RUN，明确禁止提交/推送/部署 |

Chrome页面只执行校验冒烟，不加载训练页面、不访问localStorage。临时服务器127.0.0.1:54362已停止；work目录保留smoke.html/smoke.mjs便于手动复查。HTTP下ESM加载成功不是整个训练界面的回归结论，本轮未复测产品交互。

新增：src/packs/core.js、src/packs/ajv-options.js、tools/build-pack-validator.mjs、tests/pack-browser.test.mjs。修改：Node validate.js入口、package.json/lockfile及架构/阶段记录。strict-json.js、semantics.js和原packs测试没有更改；工作区原有其他修改完整保留。

浏览器分发技术缺口已闭合，实际注册/导入集成仍须Stage 2B独立授权。本轮到此停止，等待人工审查。

构建证据：产物132,004字节；Schema SHA256 `8e92282d9143ef689efb0d3d6d5f640959ee4531dc18bb8fe7ad94cdaab1023d`；产物SHA256 `5affa1dbd350bb6ff1e031d85bcab4418bb833a414afbd70bc1cec7ac0cd1e48`。Schema摘要用于验证构建来源，不是实现Pack contentDigest/JCS。

并行工作说明：完成检查时HEAD已由其他工作推进到9545470（ea5833b热力矩阵功能及9545470部署记录）。本Agent没有执行commit/push/deploy；本轮全部构建文件仍未提交，暂存区为空。基线保护的12个文件摘要仍一致。指定静态打包目录也已核对只包含原12项白名单及.nojekyll。
