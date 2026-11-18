# Unscripted — 当前任务

## Stage 1：设计交付待审核

- 基线：0c09c60，开始工作树干净；本轮检查到新增history/lights/dotfield，按最新源码审计。
- 范围：架构审计、四层图、Schema+完整3题双语示例、进度/历史迁移方案、测试矩阵与后续阶段卡。
- 状态：文档与Schema已完成，校验证据见architecture/TEST_MATRIX_AND_NEXT_STAGE.md。产品Pack系统尚未实现，v1数据未改。
- 测试：原有37/37通过；Test-Json合法示例通过。新增设计反例结果记录在测试计划。
- 修改边界：仅docs/architecture与docs/planning（旧计划明确历史归档）；不改src/data/index/styles/tests/部署资源。
- Subagent：0。底层模型子型号未从工具回执核实，不虚报角色调用。
- 下一步：等待人工审核四个关键选择，不自动进入Stage 2。

## 预备任务（均NOT STARTED）

Stage 2A纯校验 → 2BPack转换/注册预览 → 2C存储与迁移故障测试 → 2D最小接线与浏览器验收。每卡的文件权限、目标、验收和自测题见[下一阶段计划](../architecture/TEST_MATRIX_AND_NEXT_STAGE.md)。

## 历史

旧T00–T13状态、比赛计划及页面打磨记录见[归档](archive/TASKS_pre_question_packs.md)。旧日期不是当前开发安排。T05的凭证补验仍未完成，本轮不延伸AI工作。
