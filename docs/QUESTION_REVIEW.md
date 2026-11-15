# 首批题目审校记录

2026-11-15。状态：已由开发代理对照官方资料检查；**用户人工审校待完成**。页面会展示这一状态，不宣称题目已经人工批准。没有实际运行 Java、Redis 或 MySQL 实例实验。

| ID | 资料与核对范围 | 人工审核 |
|---|---|---|
| juc-volatile-atomicity | [Oracle Atomic Access](https://docs.oracle.com/javase/tutorial/essential/concurrency/atomic.html)：单次访问与复合操作不同；[Thread Interference](https://docs.oracle.com/javase/tutorial/essential/concurrency/interfere.html) 可进一步复核交错。L3 明确两线程均先读5的前提，6是题设推演，不是所有调度的唯一结果。 | 待用户确认 |
| redis-expiration | [Redis EXPIRE](https://redis.io/docs/latest/commands/expire/)：L1 对应基本过期；L2 对应主动/被动清理；L3 对应普通SET与INCR对TTL的不同影响。不讨论搜索索引或副本过期的特殊规则。 | 待用户确认 |
| mysql-consistent-read | [MySQL 8.4 Consistent Nonlocking Reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)：L1快照与自身修改例外；L2两隔离级别的快照时机；L3不能推广至DML/锁定读。 | 待用户确认 |

取舍：将 Redis 题由宽泛缓存故障分类缩小为可明确核验的过期机制；缓存架构官方页读取超时，未用搜索摘要冒充完整核验。题目为原创中文改写，非官方原文复制。

请按题逐层检查：问题是否有歧义；参考要点是否正确且足以自查；L3的前提与结论是否一致。发现争议先修题，不扩容。题库 schema 测试只能证明结构合法，不能证明知识正确。
