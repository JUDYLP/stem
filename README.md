# Unscripted（脱稿）

**AI can write your code. Can you explain it?**

纯前端解释训练器。当前为本地开发版，尚未公开部署，尚未接入 Live AI。

## 已实现

- 三道题、每题 L1 Explain / L2 Reason / L3 Stress-test；分类、选题与随机选题。
- 先回答再查看参考要点；自评 Pass / Review 由用户主动选择。
- Depth Meter 显示当前层和最后自评；当前 review 可跳回练习或导出 Markdown。
- Retry 保留首次提交与修正文本在本页内存中，不调用模型、不自动判通过。
- 独立英文 Demo，持续标注 Simulated，完全不使用正式练习存储或 AI 请求。
- 损坏或禁用存储时保留原数据，改为内存练习并提示。

题目已对照官方资料核验，**尚待参赛者人工审校**，见 docs/QUESTION_REVIEW.md。不得据此声称测量掌握程度或学习提升。

## Windows 启动

在项目根目录打开 PowerShell：

```powershell
python -m http.server 5174 --bind 127.0.0.1
```

访问 http://127.0.0.1:5174/ ，练习入口为 #practice。按 Ctrl+C 停止服务。本机 python 为 3.14.2；py 启动器不可用，使用 python。无 npm 依赖和构建步骤；不要用 file:// 正式测试。

## 测试

本机 Node v24.22.1，仅用内置测试工具：

```powershell
node --test tests/*.test.mjs
node --check src/main.js
node --check src/demo.js
```

15 项自动测试已通过。浏览器实际结果、mock 边界和未测项见 docs/QA_REPORT.md；T00 历史基线见 docs/SETUP_REPORT.md。

## 数据与隐私

回答与 Retry 仅保存在页面内存，切题保留，刷新清空。localStorage 的 unscripted.progress.v1 仅保存题目×层级最后一次人工评价和更新时间，不存回答、Key 或身份信息。记录只属于当前浏览器与站点 origin；换端口/域名后不会自动同步。请避免多标签同时修改同一份记录，当前没有跨标签冲突合并。

默认页面只请求同源静态文件。没有账号、数据库、后端、遥测或第三方模型调用。英文 Demo 为固定模拟示例，不能称作真实 AI 诊断。

导出内容仅包括当前 review，改为 pass 后移除；不统计历史失败次数。浏览器下载策略可能阻止保存：测试已核对 Blob 的 UTF-8 Markdown 内容和下载触发，当前隔离测试环境未核实磁盘落盘，请在实际浏览器确认下载。

加载完成后 Demo 可断网操作；首次无缓存离线打开或断网刷新不保证可用。

## 文件与后续

- data/questions.json：三层题库。
- src/questions.js：加载与 schema 校验。
- src/storage.js：自评记录与故障降级。
- src/main.js：手动练习 UI 与事件。
- src/export.js：当前复习单。
- src/demo.js：固定英文模拟交互，与正式存储隔离。
- tests/：Node 内置测试。
- docs/planning/：后续唯一维护的计划、任务与决策。

后续需要：用户人工审校、公开 HTTPS 部署、真实浏览器 API/CORS 实验（有 Key 且已授权才执行）、正式提交材料。没有 Git 远程，未创建公开仓库或发布。

## AI 辅助开发披露

由用户指导 Codex 编写和测试。未启动 Subagent，具体底层模型子型号无法从本次工具回执核实。产品没有 Live AI；开发使用 AI 与产品集成 AI 分开陈述。题目来源和人工审校状态已记录，不冒称用户已掌握所有技术。
