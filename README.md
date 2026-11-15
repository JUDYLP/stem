# Unscripted（脱稿）

**AI can write your code. Can you explain it?**

一个计划帮助软件学习者用自己的话解释概念、机制和边界的训练网站。

## 当前状态：T00 首屏

已实现产品介绍、L1 Explain / L2 Reason / L3 Stress-test 说明、响应式样式、页面内说明链接与原生 ES Module 加载状态。

Practice 和 Try Demo 均为原生 disabled 按钮，并标注 Coming soon / 开发中。题库、练习、自评、记录、复习单、Demo 和 AI **尚未实现**。当前页面没有第三方资源、API 请求、Key、账户、数据库或本地存储操作。

## Windows 本地运行

需要 Python 3 和浏览器；Git 用于版本管理，Node 不属于运行依赖。无需安装 npm 包或执行构建。

在项目根目录打开 PowerShell：

```powershell
python --version
python -m http.server 5174 --bind 127.0.0.1
```

然后访问 <http://127.0.0.1:5174/>。保持该 PowerShell 窗口运行；按 **Ctrl+C** 停止服务。端口被占用时换一个空闲端口并使用对应 URL，不要终止不明进程。

本机实测 Python 3.14.2。`py` 启动器虽然存在，但报告 `No installed Python found!`，因此本机使用 `python`，不使用 `py`。不要双击 HTML 作为正式验收；ES Module 和后续 JSON 读取需要通过 HTTP 测试。

服务仅供本地开发，不是生产服务器。之后部署时只发布必要的静态资源，不应暴露 `.git`、内部文件或秘密。

## 文件

```text
index.html              首屏内容与语义结构
styles.css              响应式样式，无外部字体
src/main.js             页面模块加载提示，无业务逻辑
docs/SETUP_REPORT.md    实际环境与验收证据
docs/planning/          后续唯一维护的三份计划
.gitignore             忽略本地日志、临时文件与常见秘密文件
```

## 当前验证与待办

HTTP 首页、CSS、JS 均已实测返回 200，类型分别为 text/html、text/css、text/javascript。`node --check src/main.js` 已通过。

Chrome 桌面（1440×1000）和移动视口（390×844）已验收：无横向溢出或内容遮挡，按钮禁用、说明链接跳转、模块执行正常，控制台无错误，网络仅请求本地资源。移动视口模拟不等于真实手机测试；其他浏览器未测。证据见 SETUP_REPORT。

T00 已完成；下一步按独立任务执行 T02，当前未开发 T02。

## 开发工具披露

T00 由用户指导 Codex 完成文件编写、HTTP 检查与 Git 操作。本次会话未切换模型、未启动 Subagent；具体底层模型型号无法从工具回执核实，未冒称为 Sol 或 Astra。使用 Windows PowerShell、Python 标准库 HTTP 服务、Git 和 Node 语法检查；未使用产品 AI 服务或第三方前端库。
