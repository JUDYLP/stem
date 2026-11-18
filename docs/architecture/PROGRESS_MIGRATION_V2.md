# 进度隔离与v1迁移设计（不执行迁移）

Stage 1审核候选。当前progress、history、language的所有键均保持原样。本文件不包含已运行的localStorage迁移代码。

## 身份与版本隔离

统一逻辑键：`packId::questionId::layerId`，例如`unscripted-core::juc-volatile-atomicity-v2::L1`。不同Pack同名题不会冲突。版本是外层命名空间，不能因为逻辑键相同就跨版本使用进度。

建议未来新键`unscripted.progress.v2`存一个完整学习状态快照，包含按Pack/版本隔离的最新自评和新历史。把同次确认的progress与history放在同一个快照写入，避免当前两个v1键部分写入成功。下例是目标形状，**不是已上线数据结构**：

```json
{
  "schemaVersion": 2,
  "packs": {
    "unscripted-core": {
      "versions": {
        "1.0.0": {
          "contentDigest": "sha256:<verified-canonical-pack-digest>",
          "items": {
            "unscripted-core::juc-volatile-atomicity-v2::L1": {
              "status": "review",
              "updatedAt": "2026-11-18T00:00:00Z",
              "needsReconfirmation": true,
              "source": "legacy-v1"
            }
          },
          "history": []
        }
      }
    }
  },
  "saveAnswers": false,
  "migration": {
    "transactionId": "<locally-generated-id>",
    "sourceProgressDigest": "sha256:<raw-v1-digest>",
    "sourceHistoryDigest": "sha256:<raw-history-digest>",
    "state": "committed"
  }
}
```

新产生的history项必须携带packId、packVersion、questionId、layerId、时间、总灯号，以及`criterionResults:[{rubricId,light}]`；不再以数组下标绑定意义。每版本保留最多200项，删除/容量规则必须显式展示；不能为了迁移偷偷截断旧数据。answers默认不保存，开启后才记录，关闭时沿用当前删除已保存答案的语义；迁移不自动把旧答案复制到v2。

contentDigest由应用计算，不信任题库作者提供：对已通过验证的JSON按对象键排序、数组顺序不变、无多余空白的UTF-8确定性序列化后SHA-256；字符串不进行Unicode归一化。版本/审校/翻译都是内容的一部分。相同ID+版本摘要不同拒绝注册；哈希用于一致性而非作者身份认证。

| 事件 | 策略 |
|---|---|
| 不同Pack同名Question | 完整复合键不同，完全隔离；导出只针对当前上下文 |
| 相同Pack相同版本相同内容 | 幂等复用；进度不变化 |
| 相同版本内容变动 | 拒绝覆盖；要求作者增加版本 |
| Pack新版本 | 默认新版本空进度，旧版本保留可查看；即使仅翻译/标题变更也不自动继承，首版选择保守一致规则 |
| Question ID变更 | 新题；旧ID记录归档，不按题名相似度猜测映射 |
| Rubric重排 | 同一版本不允许变更；新版本要点沿用稳定ID但进度仍默认隔离 |
| 删除/卸载Pack | 删除内容不隐式删除历史；明确用户操作另行清理相应命名空间 |
| 返回旧版本 | 只有恢复完全相同的已验证内容摘要时才能恢复对应旧进度 |
| 草稿和未来AI建议 | 会话键含Pack、版本、题、层和答案revision；切换后不得串入新上下文 |

## 原始v1保护与映射

源1：`unscripted.progress.v1`原始字符串。源2：`unscripted.history.v1`原始字符串（可能包含用户选择保存的答案）。语言键unscripted.language不迁移。

唯一自动路由白名单为三个当前-v2题ID→unscripted-core@1.0.0同ID。非-v2旧ID、任意其他ID或同名导入Pack不可推断映射。未映射项原样保留在备份及旧键，不进入新题有效状态。

旧记录没有Pack版本/题目摘要，**无法证明当时回答对应今天的内容**。因此映射后的status只保留为旧记录，`needsReconfirmation=true`，训练/Depth Meter/Crash Sheet不得把它直接当新版已通过或当前review；单独显示“旧版自评，待重新确认”。完成新版回答与人工确认后才产生新的正常记录；不自动制造新的时间戳冒充旧行为。

history.v1还有位置索引和最多200条的既有裁剪。没有逐条版本证据时，不把missedPoints盲目转换成当前rubricId；历史以只读legacy归档保留，不参与新版本灯号/最新状态。未来若提供人工审核的确定性索引映射，可单独确认导入，标注来源；本阶段不承诺补回此前已被200条上限删除的数据。

## 分阶段写入与恢复（未来实施算法）

1. 迁移只在用户确认后发生。先关闭/提示停用其他同源旧版本标签页；新实现用同源独占Web Lock防止两个新版迁移器并发。不支持可靠锁时关闭自动迁移，提供导出/手动重试，不自行采用有竞态的localStorage自制锁。
2. 严格读取两个原始字符串与目标v2是否存在；记录存在/缺失区别、源摘要和目标题库摘要。源缺失表示空，不是损坏。畸形/未知版本源：停止迁移，原样保留，允许内存练习。不要调用会过滤历史项的parseHistory来“修复后静默导入”。
3. 在内存构造candidate；检查所有映射、计数、日期、status、未映射清单。向用户预览已映射/未映射/待重新确认数量及历史归档政策。未映射记录不丢弃；结构损坏项则整个迁移停止并告知，不当合法数据部分成功。
4. 新建事务专属备份键`unscripted.migration.v2.<transactionId>.backup`，保存两个源的原始字符串和存在标志。**不覆盖同名备份**，写后读回逐字比对。备份可能含用户答案，绝不写Git、日志或网络；容量不足则停止，不能先删旧数据腾空间。
5. 写独立临时键`unscripted.migration.v2.<transactionId>.candidate`，读回并再次完整验证及摘要比对；临时键永远不能被加载器视为有效v2。备份和candidate不可公开导出，除非用户主动选择本地下载。
6. 再次读取源和目标状态：源与快照不一致或目标v2已出现时，中止，不覆盖；若存在有效v2，默认直接使用它且不重复迁移。已存在无效v2也不覆盖，保留并显示具体阻塞。
7. 确认所有检查后，用一次setItem写新`unscripted.progress.v2`完整快照（migration.state=committed），随即读回验证。只有写入及读回均成功，当前会话才切换至v2；然后记录迁移完成并允许清理本事务candidate。原v1和backup持续保留，不自动删除。
8. 下一次启动必须完整验证v2结构/摘要，不仅检查键存在。若是刚迁移而源摘要已不同，则阻止静默合并并提示旧标签页仍可能写v1；用户处理冲突后再继续。有效v2不会被重跑迁移覆盖。

localStorage没有多键事务，也无法阻止不配合Web Lock的旧网页写入；最后复查仍不是跨旧标签页的原子保证。原始v1始终保留，检测到源变化不能“同步修正”并覆盖v2。首版要求迁移时单标签操作，恢复原版本也是显式操作，不静默回退写旧记录。

| 失败位置 | 恢复行为 |
|---|---|
| 读取/解析/映射失败 | v1不变，v2不创建；解释原因，内存模式可用 |
| backup写入或读回失败 | 停止，不写candidate/目标；保留已有内容 |
| candidate写入/校验失败 | 不写目标；忽略或确认后移除仅本事务临时键 |
| 最终setItem配额异常 | 原v1与backup不变；v2仍不存在；不得显示成功 |
| 写完但页面崩溃 | 下次启动对完整v2验证；有效即识别提交，失败保留所有源并阻止自动覆盖 |
| 读回不一致/损坏v2 | 不切换；保留故障数据和备份，用户确认恢复；不能覆盖一个可能已有新进度的v2 |
| 同时两个迁移器 | 独占锁+提交前目标存在检查；第二个不覆盖 |
| 旧标签页继续写v1 | 摘要检测提示冲突，保留两份数据；不保证透明合并 |

当前main.js的clear-confirm会清理两个v1存储；未来接入v2时必须改为明确当前范围且**不得删除遗留备份**。这属于之后受控集成，不在本轮执行。
