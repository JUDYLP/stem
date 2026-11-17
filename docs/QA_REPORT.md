# 开发验收记录 — 2026-11-15

范围：T02/T03/T04 与提前完成的 T08/T09。执行者 Codex，无 Subagent。实际运行于 E:/Project/stem/unscripted，Chrome DevTools 隔离上下文 unscripted-qa，HTTP 127.0.0.1:5174。

## 自动测试

`node --test tests/*.test.mjs`：15/15 PASS。Node v24.22.1，无新增依赖。
`node --check src/main.js`、`node --check src/demo.js`：PASS。

- 题库8项：三题九层、重复ID、缺层、顺序、空rubric、缺分类、空/非法根数据、HTTP/JSON错误。
- 存储4项：最后状态覆盖和重载、坏/新版本原始记录不被覆盖、读取拒绝/写入配额异常降级、无效评价/快照隔离。
- 导出3项：五个题层组合过滤、review→pass移除、未知ID忽略、空/全pass、HTML转义及UTF-8往返（合并在3个测试中）。

## 实际浏览器操作

| 场景 | 实际观察 | 结果 |
|---|---|---|
| HTTP题库 | 加载3题，分类为全部/JUC/Redis/MySQL；首次rubric隐藏 | PASS |
| 空解释 | 显示1–8000字符提示，不开放自评 | PASS |
| 中文及script字符串 | 输入作为文字，window.pwned未执行 | PASS |
| 提交与参考要点 | 提交后显示3条rubric，可手动自评 | PASS |
| 切层/返回 | 新层为空，返回恢复本页草稿 | PASS |
| 刷新 | 自评review恢复，回答为空 | PASS |
| review→pass→review | 待复习数量1→0→1，与最后状态同步 | PASS |
| 分类与复习跳转 | Redis筛选仅1题；复习条目跳回正确题层 | PASS |
| 导出 | 点击下载，捕获实际Blob，type=text/markdown;charset=utf-8，中文与review条目正确 | PASS（生成/触发） |
| 文件落盘 | 默认Downloads未找到目标；工具不允许访问chrome://downloads | NOT RUN（落盘未核实） |
| 桌面/移动 | 1440px无横向溢出，390px scrollWidth=clientWidth=390；实际截图检查主体可读 | PASS（手动练习版） |
| 503后重试 | 页面注入仅一次mock503，显示错误/重试，再点击后真实加载成功 | PASS（故障注入） |
| 坏记录 | 注入{bad，自评后原始值仍为{bad，内存review有效 | PASS（隔离测试数据） |
| 禁止存储 | 注入localStorage访问SecurityError，仍可自评，有警告 | PASS（故障注入） |
| Console/Network | 无控制台消息；仅同源HTML/CSS/JS/JSON，200或正常304 | PASS（正常加载） |
| Retry | 首次解释和修正文本切层返回仍在，自评未自动变化 | PASS |
| 英文Demo | 固定反馈、sample retry、demo review可操作；实践区隐藏，模拟标签存在 | PASS（DOM/交互） |
| 加载后断网 | 先固定390px视口加载，再Offline；反馈→sample retry→review完成，资源请求数不增，正式记录不变 | PASS |
| 首次断网重载 | 第一次切设备和断网同时执行触发重载，Chrome离线错误页 | 不支持；不宣称离线PWA |
| Demo全页截图 | 离线全页截图工具超时/卡住，已终止等待并恢复联网 | NOT RUN（最终视觉待补） |
| Demo退出 | 新隔离页面重测：practiceVisible=true，demoHidden=true，正式存储不变 | PASS |

浏览器异常注入仅作用于隔离测试页面；正常重载后恢复，无修改正式用户数据。自动测试和浏览器验证不能代替参赛者题目人工审校。

## 未实现或未验证

Live AI、Key/CORS、真实手机、其他浏览器、用户试用、视频/Devpost均未验证。T02内容仍待用户人工确认；T09退出和桌面截图已补验收，最终移动反馈区截图已在下述HTTPS复验补齐；T04实际下载落盘待确认。不要将这些写成全部通过。

## 学习自测

- T02：schema能证明知识正确吗？三层区别在哪里？如何从官方资料核对rubric前提？
- T03：草稿与持久化为何分开？坏数据为何不直接清空？同源存储为何不跨端口同步？
- T04：最后状态与累计错题次数有何区别？review改pass如何影响导出？Blob与文件实际落盘有何区别？
- T08：Retry为什么不证明学习提升？如何避免改答污染首次快照？为什么不自动二次收费？
- T09：模拟和Live如何区分？如何证明不写正式记录？加载后断网与首次离线打开有何区别？

补充：在线桌面Demo截图已检查，模拟标记、追问、Retry区域可见。随后移动视口/截图工具的自动审批服务报告额度用尽，未执行，不绕过限制。静态打包脚本实际运行成功，仅含8个页面资源与.nojekyll，未包含docs/tests/.git。

## 2026-11-15 公开HTTPS补验收

- PASS：Actions运行43706124478 attempt 2成功，部署752dd3f；独立浏览器上下文访问https://judylp.github.io/stem/，三题加载。
- PASS：8个应用资源HTTP 200、MIME正确，线上SHA-256与本地逐项一致；子路径无404。
- PASS：390×844移动模拟，全页截图已人工观察，标签/反馈/Retry/按钮可读，无横向溢出。
- PASS：Demo打开→模拟反馈→sample retry→review→退出；正式进度存储不变，退出恢复练习。
- PASS：控制台无消息；应用加载请求只有同源静态资源，无AI请求。
- NOT RUN：真实API/CORS、真实手机、下载文件落盘确认、参赛者题目审校、真实用户试用、视频/正式提交。

本轮仅更新文档，沿用前轮15项通过的Node测试，不将其描述为本轮重跑。

## 2026-11-15 首页与题库v2验收

- PASS：node --test tests/*.test.mjs，15/15；node --check src/demo.js；git diff --check。
- PASS：本地真实HTTP http://127.0.0.1:5176/，Chrome独立上下文；1440×1000桌面截图、390×844全页截图检查完成，390px scrollWidth=390。
- PASS：代码示例原生details可展开；三道v2题的L3多行题干显示，参考要点答题前保持隐藏；提交后展开3条要点，Review进入复习单；Demo打开/退出存储不变。
- PASS：Demo开启后“开始练习”恢复练习区；Console无消息（修复前全流程），修复后导航/题层检查正常。
- PASS：WCAG亮度公式检查：muted/米白6.55:1、白字/主绿7.88:1、代码关键字/深底7.36:1、代码说明8.55:1、警示标签6.43:1。
- 本地首次5175预览因沙箱套接字限制失败；获环境权限后5176预览成功。没有把失败预览算通过。
- NOT RUN：Java/Redis/MySQL实例实验、用户学习效果试验、真实设备/多浏览器、新版下载落盘；题目内容依旧待参赛者人工审校。
- 中文标题使用本机Noto/思源/宋体回退，未下载或内嵌字体；不同系统的字形可能不同。首屏模拟示例不会执行fetch代码、不会自动评级。


2026-11-15 v2公开发布复验：Actions https://github.com/JUDYLP/stem/actions/runs/43707943812 completed/success，部署提交2510c80bae45af9a159e6e94d996b95f2569eb3b。Chrome打开https://judylp.github.io/stem/确认模拟卡存在、开始练习中文CTA、8行代码及三个-v2题ID。

## 2026-11-17 P0 双语与文案清理

- PASS：node --test tests/*.test.mjs，20/20；新增语言优先级、持久化失败降级、字典、双语schema、英文导出测试。
- PASS：真实Chrome http://127.0.0.1:5177/?lang=en，首页→空输入错误→作答→rubric→Retry→Review→实际下载触发及Blob文本；英文页面/导出无中文（产品名除外）。下载落盘仍未单独核实。
- PASS：中英来回切换后回答/Retry保持原值，unscripted.progress.v1内容不变；英文Demo展开/示例/Review无中文；Console无消息。
- 语言优先级：有效URL lang > 已保存语言 > navigator.language；偏好独立存unscripted.language，不改进度schema。
- 已删除开发状态块/练习内部备注；审校状态保留README与QUESTION_REVIEW。技术语义为对照翻译，仍待参赛者人工审校。
- 桌面/移动截图留至P2最终版统一执行，本组不冒称截图通过。
