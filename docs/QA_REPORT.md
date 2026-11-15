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

Live AI、Key/CORS、公开HTTPS、真实手机、其他浏览器、用户试用、视频/Devpost均未验证。T02内容仍待用户人工确认；T09退出和桌面截图已补验收，最终移动反馈区截图因自动审批额度限制未执行；T04实际下载落盘待确认。不要将这些写成全部通过。

## 学习自测

- T02：schema能证明知识正确吗？三层区别在哪里？如何从官方资料核对rubric前提？
- T03：草稿与持久化为何分开？坏数据为何不直接清空？同源存储为何不跨端口同步？
- T04：最后状态与累计错题次数有何区别？review改pass如何影响导出？Blob与文件实际落盘有何区别？
- T08：Retry为什么不证明学习提升？如何避免改答污染首次快照？为什么不自动二次收费？
- T09：模拟和Live如何区分？如何证明不写正式记录？加载后断网与首次离线打开有何区别？

补充：在线桌面Demo截图已检查，模拟标记、追问、Retry区域可见。随后移动视口/截图工具的自动审批服务报告额度用尽，未执行，不绕过限制。静态打包脚本实际运行成功，仅含8个页面资源与.nojekyll，未包含docs/tests/.git。
