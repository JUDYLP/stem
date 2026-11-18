# Stage 2C 学习状态与迁移

基线为 PR #1 合并提交 2a615f16871b4ead7ffcd35366afc0b22eb2ce2a。实现与生产页面独立，测试只注入合成 Storage、排队锁和经过 2B 注册的 Pack。

## 快照示例

以下为一次单层人工确认后的完整合成快照。外层版本和实际内置摘要共同选取题目上下文。

```json
{"schemaVersion":2,"saveAnswers":false,"migration":null,"packs":{"unscripted-core":{"versions":{"1.0.0":{"contentDigest":"sha256:0fa8b6f483391ded3a0434cc07c13e052f72e00df79f33de6989c7983b038288","items":{"unscripted-core::juc-volatile-atomicity-v2::L1":{"status":"pass","updatedAt":"2026-01-01T00:00:00.000Z"}},"history":[{"packId":"unscripted-core","packVersion":"1.0.0","questionId":"juc-volatile-atomicity-v2","layerId":"L1","ts":"2026-01-01T00:00:00.000Z","light":"green","criterionResults":[{"rubricId":"juc-volatile-atomicity-v2-l1-c01","light":"green"},{"rubricId":"juc-volatile-atomicity-v2-l1-c02","light":"green"},{"rubricId":"juc-volatile-atomicity-v2-l1-c03","light":"green"}]}]}}}}}
```

## 接口与恢复

createLearningStore({storage,locks,registry}) 使用调用方注入的对象。view(ctx) 返回独立的 items、legacyItems、history。ctx 必需 packId、packVersion、contentDigest，人工确认还需 questionId、layerId。recordSelfRating(ctx,{confirmed:true,criterionResults,answer?,ts?}) 核对全部当前层 rubricId，再从灯号派生状态。单个 setItem 保存最新自评及历史，读回成功才返回 persisted:true。每版本按插入顺序保留最后 200 条。异常通过 rejected Promise 报告，读取错误抛异常；本模块不缓存失败写入，调用者保留未保存草稿。写完后读回失败时结果待检查，不能直接声称磁盘未写入。

setSaveAnswers(boolean) 控制以后写入，关闭会清除 v2 正常历史的原文。clearPack(ctx,true) 清空该包所有版本，保留共享旧源与备份；deleteAll(true) 枚举专属学习键和迁移命名空间并逐项删除，再报告 remaining。取消不写入。权限失败须重试。网页不能删除已下载文件。

createMigrationService 接收相同依赖。先在可信 registry 调用 registerBuiltin()。preflightMigration 检查目标可读性及原始键存在性；previewMigration 严格检查源，生成源摘要绑定 token、映射数、未映射键、历史归档数。显示预览并取得确认后调用 migrateLegacyData({confirmed:true,token})。仅白名单三题路由到内置版本。旧状态以 needsReconfirmation:true、source:legacy-v1 保留，默认有效视图排除。readLegacyArchive() 按原始摘要核验备份并返回独立副本，旧下标永久留在旧数据形状中。

事务使用 UUID 专属 .backup / .candidate。备份内 progress/history 各为原始字符串或 null，空字符串与缺失严格区分。顺序为备份读回、candidate 读回及结构校验、重新比对源和目标、单次正式写入、读回、识别 committed。最终 metadata 包括 transactionId、两个源摘要和 state。首次写入 v2 时已有 v1 会要求先处理迁移。inspectMigrationState 返回 absent/interrupted/existing/committed/source-conflict；损坏状态抛错。中断时原样保留遗留临时键，可重新预览后开启新事务，永不提升孤立 candidate。已写入有效 v2 的重复请求只检查，不覆盖。备份异常需要人工恢复，禁止先清空空间。

所有写操作共用独占 Web Locks 名称 unscripted.learning.v2。浏览器接线时显式传入 navigator.locks，缺锁即拒绝。旧标签页不遵守新锁，迁移和彻底删除前要关闭旧标签页。最后一次检查之后旧页仍可能写入，检查源摘要可检测分歧；多键操作没有跨标签页数据库事务保证。删除后旧页重新创建数据无法永久阻止。

## 验证与接线条件

npm ci 成功。修改前151项，最终 npm test 169通过、0失败、0跳过；npm run check:syntax 检查36文件；两个 Pack 构建命令通过。新增18项覆盖版本和包隔离、人工确认、历史裁剪、答案开关、坏数据与 quota、各迁移写入/读回故障、并发重复、旧源变化、部分删除和恢复检查。新工作流在 pull_request 上执行相同安装、测试、语法和构建。真实用户记录未用于验证。

Stage 2D 接线前，审查确认提示、用户明确点击事件、未映射与待确认视图、错误与源冲突提示、备份含答案说明及关闭旧标签页流程。仅将 view().items 交给 Depth Meter/Crash Sheet。真实浏览器多标签交互和生产数据迁移未执行。

交付分支 stage2c-storage，实施提交 0ef45c2a959bf2ea9c8b40b853f020277b161cb7。[PR #2](https://github.com/JUDYLP/stem/pull/2) 等待人工审核。[远端 PR 测试](https://github.com/JUDYLP/stem/actions/runs/44300355998) 的安装、测试、语法和两个构建步骤均已完成并通过。
