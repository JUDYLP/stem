# Unscripted — 当前主计划

更新：2026-11-18。目标：可插拔题库的技术理解训练引擎。**Swap the knowledge. Keep the challenge.**

## 当前事实与范围

本轮工程基线f254eea：原生HTML/CSS/ES Modules、静态Pages，3题9层、中英文、逐要点灯号与人工确认、Retry、Depth Meter、Crash Sheet、历史及可选答案保存、独立模拟展示。38项基线测试通过；Stage 2A新增83项后121项全通过。无真实AI成功生成；T05已有401路径CORS证据，有效Key生成/JSON补验仍未完成。

当前任务Stage 1.1规范修订与Stage 2A独立校验/CI门禁已在本地完成，待人工审查，禁止擅自提交/推送。运行时仍使用旧数组及progress/history v1；不能把设计稿当已实现Pack系统。

## 唯一当前设计源

- [架构审计与四层图](../architecture/ARCHITECTURE_AUDIT.md)
- [Question Pack Schema v1契约](../architecture/QUESTION_PACK_SCHEMA_V1.md)及同目录机器Schema/完整示例
- [进度与历史迁移设计](../architecture/PROGRESS_MIGRATION_V2.md)
- [测试矩阵与后续分阶段计划](../architecture/TEST_MATRIX_AND_NEXT_STAGE.md)

保持纯静态架构；不改main训练规则、不引入框架/后台/数据库/RAG/复杂Agent。无Key模式必须完整。API供应商不进入Pack；模型只能建议，人决定最终状态。未获审核不实施注册系统、迁移或部署实验代码。

## 执行顺序

Stage 1设计已交付 → Stage 1.1/2A本地完成待审 → 单独授权2B转换/注册预览 → 2C隔离存储与迁移测试 → 2D最小集成。每段目标/读取/允许修改/验收/学习问题见测试计划。未来AI接入需独立任务与授权，不是Pack系统前置。

旧比赛时间表、零代码起步假设与旧snake_case AI草案已归档到[archive](archive/MASTER_PLAN_pre_question_packs.md)，只供历史追溯，不再据其日期、旧Prompt或旧交付范围自动执行。当前开发不沿用比赛倒计时。默认不启动Subagent，不重读全部历史；先读当前TASKS和对应设计。
