# Unscripted — 当前任务

## Stage 1.1 + 2A：本地完成待人工审查

- 基线f254eea，与远端一致，修改前干净。
- 已完成：CI门禁、数据删除权/JCS/版本规范、独立Ajv+严格token校验。
- 121/121测试（原38+新83），21文件语法检查；原12资源打包与线上原始Git字节一致。
- 未执行：新远端CI、浏览器新增流程、注册/导入UI/摘要/迁移/删除。
- 用户要求：不提交、不推送；改动保留工作区等待审核。Subagent为0。
- 下一步只准备Stage 2B，必须单独授权；详见architecture/STAGE_2A_REPORT.md。
- 自测：为何重复键不能只靠JSON.parse？Schema为何不能独立确认翻译完整性？为何关闭保存答案不等于清除了迁移备份？


## 历史：Stage 1设计交付

- 基线：0c09c60，开始工作树干净；本轮检查到新增history/lights/dotfield，按最新源码审计。
- 范围：架构审计、四层图、Schema+完整3题双语示例、进度/历史迁移方案、测试矩阵与后续阶段卡。
- 状态：文档与Schema已完成，校验证据见architecture/TEST_MATRIX_AND_NEXT_STAGE.md。产品Pack系统尚未实现，v1数据未改。
- 测试：原有37/37通过；Test-Json合法示例通过。新增设计反例结果记录在测试计划。
- 修改边界：仅docs/architecture与docs/planning（旧计划明确历史归档）；不改src/data/index/styles/tests/部署资源。
- Subagent：0。底层模型子型号未从工具回执核实，不虚报角色调用。
- 下一步：等待人工审核四个关键选择，不自动进入Stage 2。

## 后续阶段（2A现已本地完成；2B/2C/2D NOT STARTED）

Stage 2A纯校验 → 2BPack转换/注册预览 → 2C存储与迁移故障测试 → 2D最小接线与浏览器验收。每卡的文件权限、目标、验收和自测题见[下一阶段计划](../architecture/TEST_MATRIX_AND_NEXT_STAGE.md)。

## 历史

旧T00–T13状态、比赛计划及页面打磨记录见[归档](archive/TASKS_pre_question_packs.md)。旧日期不是当前开发安排。T05的凭证补验仍未完成，本轮不延伸AI工作。

Stage 1完成复核：Schema结构用例10/10、语义反例4/4符合预期；示例3题9层29条Rubric与原题库逐项对应。同期视觉工作后基线f92cc82的现有测试38/38通过。等待人工审核，不进入Stage 2。

## Stage 2A.1：构建闭环本地完成待审

npm ci/test/check:syntax/build:pack-validator及指定静态打包均通过；138测试、25语法文件，Chrome157严格CSP冒烟8项通过。Node与浏览器共享规则，产物work/pack-validator/pack-validator.mjs。保留全部已有修改，未提交/推送/部署，未进入2B。详情见STAGE_2A_REPORT.md末节。

Stage 2B 已在 stage2b-registry 完成本地交付，151 项测试通过。当前审核入口为 docs/architecture/STAGE_2B_REPORT.md。2C 等待单独授权。
