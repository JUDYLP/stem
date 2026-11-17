# 首批题目审校记录

2026-11-15。状态：已由开发代理对照官方资料检查；**用户人工审校待完成**。页面会展示这一状态，不宣称题目已经人工批准。没有实际运行 Java、Redis 或 MySQL 实例实验。

| ID | 资料与核对范围 | 人工审核 |
|---|---|---|
| juc-volatile-atomicity | [Oracle Atomic Access](https://docs.oracle.com/javase/tutorial/essential/concurrency/atomic.html)：单次访问与复合操作不同；[Thread Interference](https://docs.oracle.com/javase/tutorial/essential/concurrency/interfere.html) 可进一步复核交错。L3 明确两线程均先读5的前提，6是题设推演，不是所有调度的唯一结果。 | 待用户确认 |
| redis-expiration | [Redis EXPIRE](https://redis.io/docs/latest/commands/expire/)：L1 对应基本过期；L2 对应主动/被动清理；L3 对应普通SET与INCR对TTL的不同影响。不讨论搜索索引或副本过期的特殊规则。 | 待用户确认 |
| mysql-consistent-read | [MySQL 8.4 Consistent Nonlocking Reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)：L1快照与自身修改例外；L2两隔离级别的快照时机；L3不能推广至DML/锁定读。 | 待用户确认 |

取舍：将 Redis 题由宽泛缓存故障分类缩小为可明确核验的过期机制；缓存架构官方页读取超时，未用搜索摘要冒充完整核验。题目为原创中文改写，非官方原文复制。

请按题逐层检查：问题是否有歧义；参考要点是否正确且足以自查；L3的前提与结论是否一致。发现争议先修题，不扩容。题库 schema 测试只能证明结构合法，不能证明知识正确。

## 2026-11-15 场景题 v2

当前data/questions.json的三个ID均追加-v2。上表是首版来源与审校历史，v2继续沿用基础依据并增加以下核对。题目变化较大，不沿用旧题Pass；旧localStorage条目保留，但当前题库/导出仅显示v2题目。仍待参赛者人工确认，未运行Java/Redis/MySQL实例实验。

- Java L2要求分别构造6与7的交错；L3改为库存check-then-act反例。依据[AtomicInteger](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/atomic/AtomicInteger.html)的get/decrementAndGet/compareAndSet契约推演。明确发货不会失败，排除分布式业务原子性问题。
- Redis L3给出SET→EXPIRE→INCR→SET时序，题设约束键未到期；区分保留到期时刻与重新计时。补查[SET](https://redis.io/docs/latest/commands/set/)的KEEPTTL选项，指定Redis 7+。
- MySQL L2明确100→80与RR/RC的快照时机，L3明确UPDATE减10后读到自己的70。继续依据[MySQL 8.4一致性读](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)，限定显式事务、单行、无其他写入及操作成功。

人工纸面辨别检查（不是自动评分或学习效果实验）：

| 挑战 | 背术语回答缺什么 | 典型错误 | 完整回答需要 |
| --- | --- | --- | --- |
| Java L3 | 只说CAS，未给交错和成功资格 | 原子类保证整个if安全 | 两次读1、扣到0/-1；锁或CAS条件更新 |
| Redis L3 | 只说有TTL，未逐步追踪 | INCR重置60秒、SET保留TTL | 值1→1→2→9；无TTL→有→保留→清除；KEEPTTL |
| MySQL L3 | 只说MVCC，未预测数值 | RR所有语句都读100所以为90 | UPDATE用80减10，自身修改可见为70 |

首页JavaScript示例为独立固定展示，不是新增正式题或实际网络调用；仅合并同一函数实例中尚未完成的fetch Promise，不保证跨页面去重或响应体读取完成前持续合并。展开追问说明finally清空后的再次请求。L1/L2勾选明确为模拟，不改变练习状态。

## 2026-11-17 英文对应版本

三题增加title_en、每层prompt_en/rubric_en，与现有中文前提、结论和要点逐项对应，未扩充知识点。中英rubric条目数量由schema校验；20项软件测试不等同技术内容人工审校。参赛者人工审校仍待完成，页面不再展示此内部状态。题目ID及进度v1结构不变。
