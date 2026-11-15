# T00 环境与验收报告

日期：2026-11-15（北京时间；11/14 初建，11/15 迁入新工作区并复测）。这是实际执行记录，不是全产品测试报告。

## 结论

首屏文件、HTTP、JS 语法、Chrome 桌面与移动视口验收及首次 Git 提交均已完成，T00 为 **DONE**。未执行 T02 或任何 AI/部署功能。

执行者：Codex 当前会话；未切换模型、未启动 Subagent。具体底层模型型号无法从本次工具回执核实，不推断为 Sol/Astra。

## 工作区和边界

- 工作区：`E:\Project\stem`
- 新项目：`E:\Project\stem\unscripted`
- 新目标不存在；从此前创建的 T00 目录复制全部文件与尚无提交的 Git 元数据，旧目录保留且未改动。不是复用未知旧项目。
- 从驱动器根目录至工作区的祖先路径未找到 AGENTS.md。
- 新项目 `git rev-parse --show-toplevel` 确认为 E:/Project/stem/unscripted，无上级仓库操作。
- 已复制三份规划至 `docs/planning`，该处是后续唯一维护源；原 outputs 版本为历史交付，不再同步。

## 环境实测

| 项目 | 结果 |
|---|---|
| PowerShell | 7.6.9 |
| Git | 2.54.0.windows.1 |
| py | 存在，但 `py --version` 报 No installed Python found!，未采用 |
| python | Python 3.14.2，可用 |
| node | v24.22.1，可用，仅用于语法检查 |
| Chrome | 本机安装 157.0.8103.78 |
| Edge | 本机安装 157.0.4341.46；未运行验收 |
| Chrome 控制工具 | 首次连接失败；用户启用远程调试后于 11/15 成功连接并完成验收 |
| 写入能力 | 实际创建项目文件成功 |
| 5174 端口 | TCP loopback bind 探测成功；后续实际服务响应成功 |
| Git 身份 | user.name/user.email 均已有非空配置；未修改或公开其值 |

未安装任何运行时、依赖、浏览器或框架，未读取凭证或输出环境变量。

## 实际启动与停止

在项目根目录执行：

```powershell
python -m http.server 5174 --bind 127.0.0.1
```

实测 URL：`http://127.0.0.1:5174/`。前台服务以 Ctrl+C 停止。

首次沙箱内隐藏后台进程未保持运行，随后的 HTTP 请求遭套接字权限限制；未把该尝试记作成功。随后通过获准的执行会话启动上述服务，并完成本机只读 HTTP 请求。11/15 在新项目以 5174 端口重新启动并复测三项 HTTP 资源；验收结束后停止本轮服务，用户需要预览时按 README 重新启动。不处理其他进程。

## 验收证据

| 检查/命令 | 预期 | 实际 | 状态 |
|---|---|---|---|
| `Invoke-WebRequest http://127.0.0.1:5174/ -NoProxy` | 200 + HTML | 200，text/html，3527 bytes | PASS |
| 同命令请求 `/styles.css` | 200 + CSS | 200，text/css，4130 bytes | PASS |
| 同命令请求 `/src/main.js` | 200 + JavaScript | 200，text/javascript，228 bytes | PASS |
| `node --check src/main.js` | 语法有效 | 退出 0，无错误 | PASS |
| Git 根目录检查 | 只属于新项目 | 返回新建 unscripted 目录 | PASS |
| HTML 源码审阅 | 名称、标语、三层、禁用入口和相对路径 | 文件中存在；未替代浏览器验证 | PASS（源码层） |
| 桌面浏览器视觉 | 文本与布局可见、无遮挡 | 1440×1000 全页截图检查，内容清晰无遮挡 | PASS |
| 约 390px 移动视口 | 无横向溢出/遮挡 | 390×844 全页截图检查；scrollWidth/clientWidth 均为 390 | PASS |
| 浏览器 ES Module 实际执行 | 页脚更新为“首屏已加载 · 功能开发中” | 读取实际 DOM，文本一致 | PASS |
| 浏览器交互 | 禁用按钮不可操作；说明链接可跳转 | 两按钮 disabled=true，点击事件为0；链接跳至 #method，目标距视口顶部约24px | PASS |
| 浏览器控制台与 Network | 无致命错误、资源正常 | Console 无消息；Network 仅首页304、CSS200、JS200，304为正常缓存验证 | PASS |

所有资源仅由本机静态服务提供。尚无题库/Key/AI/持久化代码，不运行或宣称这些未来功能的测试通过。不为静态文案创建镜像测试。

## 文件与 Git

产品文件：`index.html`、`styles.css`、`src/main.js`。

支持文件：`.gitignore`、`README.md`、本报告、`docs/planning/MASTER_PLAN.md`、`TASKS.md`、`DECISIONS.md`。

提交主题为 chore: initialize Unscripted static landing page；实际 commit 由 git log -1 和最终交付答复提供，避免报告自引用哈希。没有远程仓库或发布行为。

## 已完成的浏览器验收步骤

1. 启动 README 中的 HTTP 服务，并打开实际 URL。
2. 桌面检查产品名、英文标语、三层说明及开发中提示；Practice/Try Demo 不可点击。
3. 点击“先了解三层训练”，确认跳转到说明区域。
4. 打开 DevTools，切换约 390px 宽度，检查无遮挡和横向滚动；同时检查 Console 和 Network。
5. 确认页脚显示“首屏已加载 · 功能开发中”，证明模块实际执行。

以上检查已通过 Chrome DevTools 工具执行，桌面和移动全页截图已实际查看。未覆盖真实手机或其他浏览器，不宣称跨浏览器全面兼容。当前停止在 T00，下一任务为 T02。

首个代码提交：8393ed99c6e025853b56303c156531127a3540f2。此次仅补充验收记录，不更改产品源码。

## 工程自测

1. HTTP 与 file:// 有什么区别？
2. 页面如何加载 JavaScript ES Module？
3. Git commit 与 GitHub 发布有什么区别？
