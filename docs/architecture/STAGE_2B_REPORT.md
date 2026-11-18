# Stage 2B 交付

基线为本地 Stage 2A 提交 2dd7e629b0039bc60fba7cb2e618ad57f1a89fa7。2A 在同期页面提交之后通过 145/145 项测试、语法检查和 standalone 构建。README 中无关的页面差异留在原工作区。2B 位于独立 worktree 和 stage2b-registry 分支。可用 git log -1 -- docs/architecture/STAGE_2B_REPORT.md 查询本阶段提交。

## 接口与一致性

createPackRegistry() 创建独立内存 Map，按 packId 和 packVersion 两级索引。registerBuiltin() 只读取应用内置数据。registerImported(textOrBytes) 只接受文本或 Uint8Array；每次注册重新走 Stage 2A 完整入口，导入来源不能注册 unscripted- 前缀。get(id,version) 返回副本，list() 返回包 ID，versions(id) 通过既有 comparePackVersions 升序排序。用户可以修改返回值。

每次先解析校验、再异步计算摘要。恢复执行后同步读取最新 Map、比对版本并插入，中间没有 await。同内容重试返回同一版本的副本，同版本冲突抛 VERSION_CONFLICT。无效数据抛 INVALID_PACK，保留前缀抛 RESERVED_ID。失败前没有注册表写入，因此无需撤销旧记录。

computePackDigest(validatedPack) 对校验器输出执行 RFC 8785 JCS、UTF-8 和 Web Crypto SHA-256。采用固定开发依赖 canonicalize 5.1.0（Apache-2.0），核对实现使用 UTF-16 属性排序、ECMAScript 数值序列化、保留数组顺序、拒绝无效代理项。浏览器产物在本地打包此依赖，Web Crypto 不可用即报告失败。摘要用于判断版本内容一致性。参考 https://www.rfc-editor.org/rfc/rfc8785.html 。

previewPack(record, uiLanguage) 返回纯数据。全包一次选择语言，zh 可对应 zh-CN，其余未支持语言回退 defaultLanguage，返回 language、fallback。reviewStatus 汇总作者声明，HTML 字符串保留为文本，未来展示应使用 textContent。

## 内容与文件

新增 data/packs/unscripted-core.v1.json、src/packs/digest.js、src/packs/registry.js、src/packs/preview.js、tools/build-pack-runtime.mjs、tests/pack-runtime.test.mjs、本报告。修改 package.json、package-lock.json、docs/planning/TASKS.md、docs/planning/DECISIONS.md、docs/architecture/TEST_MATRIX_AND_NEXT_STAGE.md。

unscripted-core@1.0.0 保留 Java/JUC、Redis 和 MySQL 的 3 个原 ID、9 个层级和 29 条稳定 rubricId。逐题对照旧数组的双语标题、每层 ID、双语 prompt 与全部 rubric 顺序和内容，并通过 2A 校验。3 题全部 unreviewed。

## 实测

- npm ci 成功。npm test 共 151 项，151 通过、0 失败、0 跳过（基线145项加6项组合测试）。
- npm run check:syntax 通过，32 个文件。npm run build:pack-validator 和 npm run build:pack-runtime 均通过。运行时产物为 work/pack-runtime.mjs，沿用本地 standalone 校验器。
- 验证两次并发相同注册及并发冲突只有一方写入，版本顺序含超过安全整数的分量、无效输入、跨包同题 ID、返回值及输入字节隔离、禁止访问 localStorage、摘要失败保持原快照。
- RFC 8785 数值与 Unicode 属性排序向量通过。属性重排、数组重排及组合字符验证通过。Chrome 157 在 localhost 严格 CSP 下加载运行时、注册内置包并预览。浏览器与 Node 的摘要精确比较为 true：sha256:0fa8b6f483391ded3a0434cc07c13e052f72e00df79f33de6989c7983b038288。
- 已有训练测试全通过；正式页面和打包白名单无本轮变更。远端 CI、线上部署和正式页面浏览器交互复验为 NOT RUN。仅完成本地提交。

## Stage 2C 准备条件

先审核身份、版本不可变规则及内置包摘要，再确认 v1 备份、用户删除权、按包与版本隔离的存储结构，以及配额、崩溃和并发恢复测试方案。2C 需要单独授权。
