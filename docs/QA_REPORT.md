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

## 2026-11-17 P1 示例与输入体验

- PASS：20/20 Node测试、main.js语法检查、git diff --check。P0提交中遗留的一行HTML尾随空格已在本组清理。
- PASS：真实浏览器默认题为juc-volatile-atomicity-v2；首屏6行Java代码、L2追问/错误回答与英文Demo对应同一丢失更新案例。
- PASS：空复习单按钮disabled且提示可见；标记Review后按钮启用且提示隐藏。
- PASS：输入框初始clientHeight 157px（5行），30行文本增至843px；7001字符才显示计数，短文本隐藏。英文页面未发现中文（产品名除外）。

## 2026-11-17 P2 最终双语视觉与回归

- PASS：P2后20/20 Node测试；语法与diff空白检查通过。保持原配色、字体栈、桌面首屏双栏；修复翻译span引入的Logo字号/边框继承问题。
- PASS：使用本机已安装Chrome的独立headless配置，Node内置WebSocket调用CDP，无第三方依赖、无关闭安全机制。原连接器截图保存因工作区限制失败，随后内联截图及列表卡住，未计通过；独立Chrome补齐验收。
- PASS：1440×1000和390×844，各执行中文/英文首页与练习区截图，共8张，已逐张查看；最终Logo修复后重拍并复查首页。桌面scrollWidth=1425<1440，移动scrollWidth=390，无横向溢出。
- 截图及去敏结果仅在本地忽略目录work/qa-bilingual-20261117/，不提交/部署。文件：{zh,en}-{1440,390}-{home,practice}.png，results.json。headless非真实手机，不能宣称跨浏览器通过。
- PASS：移动端完整题名额外显示、footer flex-direction=column；h2 text-wrap=balance。英文首页/练习可见文本无汉字（产品名脱稿除外）。用户自行输入的内容不会被翻译。
- PASS：英文作答→rubric→Retry→Review→导出真实Blob→Demo；导出全文无中文，Demo无中文，语言切换不改变草稿/Retry/进度。实际Blob文本保存为本地english-crash-sheet.md供查看，不等同于浏览器下载落盘确认。
- PASS：移除URL参数后重新打开，恢复保存的en语言和Review记录。独立Chrome捕获Runtime.exceptionThrown与Log error，结果为空。
- NOT RUN：真实iOS/Android、Safari/Firefox、真实用户试用、参赛者对技术内容的最终人工审校；Live AI仍不在本轮范围。

### 本轮部署确认

2026-11-17：Actions https://github.com/JUDYLP/stem/actions/runs/44043753475 completed/success，部署b72d769f4df63a84dd8a6d67a8964a232b9af63b（P0 d7ed2b3、P1 7f2e152、P2 b72d769）。独立Chrome打开https://judylp.github.io/stem/?lang=en，lang=en、3题、无中文（产品名除外）、390px无溢出、Runtime/Log错误为空。9项静态资源HTTP 200/MIME正确，SHA-256全部与git show HEAD:路径的提交内容一致。与Windows工作树首次比对不一致，进一步实证仅CRLF/LF换行差异，未误写“本地原始字节一致”。

页面地址：https://judylp.github.io/stem/；英文评审入口：https://judylp.github.io/stem/?lang=en 。未引入Live AI或第三方依赖，progress v1保持不变。

## 2026-11-17 信号灯视觉重做与练习记录

范围：整站视觉重做（黑色仪表盘 + 三色信号灯）、灯判定、`unscripted.history.v1`、热力矩阵、时间线、回答保存开关、清空记录。执行者 Codex，无 Subagent；纯静态，无新依赖。

### 自动测试

- `node --test tests/*.test.mjs`：33/33 PASS（Node v24.18.0，WSL）。新增 `tests/lights.test.mjs`（5 项：灯色汇总、Pass 映射、循环顺序、外部建议校验、旧 progress 兼容）与 `tests/history.test.mjs`（7 项：200 条裁剪、默认不存原文、关闭开关删除原文、坏数据不改写、非法条目丢弃、最近灯色、清空保留开关）。
- `node --check src/main.js`、`src/history.js`、`src/demo.js`、`src/export.js`：PASS。

### 浏览器流程（Chrome 157 headless，CDP 独立上下文，http://127.0.0.1:5177）

| 场景 | 实际观察 | 结果 |
|---|---|---|
| 首屏示例序列 | 加载后依次点亮 绿/绿/红，随后显示追问；Simulated 标注常驻；`Replay example` 可重播 | PASS |
| 提交与逐条出现 | 提交后 3 条要点按 70ms 间隔出现，默认琥珀；层灯琥珀呼吸 | PASS |
| 点灯与确认 | 绿/绿/红 → 层灯红；写入 history light=red、missed=[2]；progress=review；热量与时间线同步 | PASS |
| 重做转绿 | 同一题层再次确认全绿：history 2 条（红→绿），progress=pass，热力格转绿，变化条显示红→绿 | PASS（截图） |
| Ctrl+Enter | Redis L1 用 Ctrl+Enter 提交成功，rubric 展开 | PASS |
| 导出 | 真实 Blob 文本含「灯色：漏掉了」「漏掉的要点：」，review 项与题目正确；pass 项不导出 | PASS（生成/触发） |
| 回答开关 | 开启后条目带 answer；关闭后 localStorage 中 answer 全部删除，判定保留，提示文案正确 | PASS |
| 刷新 | 判定、热力、时间线保留；回答与草稿清空 | PASS |
| 清空记录 | 取消保留数据；确认后 history/progress 为空、热力全暗、导出禁用 | PASS |
| 旧数据兼容 | 仅写入旧 progress（pass/review）时，热力按 绿/红 显示，统计正确，导出可用，时间线为空 | PASS |
| 外部建议接口 | `Unscripted.suggestLights` 只显示提示条；progress/history 不变；点「采用建议」后才改灯，仍需确认 | PASS |
| 悬停提示 | 格子 `::after` 显示题目、层级、最近时间；1440 桌面可见 | PASS |
| 减少动态效果 | `prefers-reduced-motion: reduce` 下首屏三灯立即就位、追问直接显示，动画时长约 0 | PASS |
| 对角线亮起 | 首次滚动到热力矩阵时格子按 (行+列)×90ms 依次出现，结束后移除类名不重复播放 | PASS（帧序列） |
| 溢出 | 1440 scrollWidth=1440；390 scrollWidth=390；中英文各 1440/390 全页截图无横向滚动 | PASS |

证据：本地忽略目录 `work/qa-signal-20261117/`（before/after 全页截图、flow 帧序列、motion.json、compat.json、flow/results.json）。截图与录帧不提交、不部署。

### 未验证与限制

- 真实 iOS/Android、Safari/Firefox、触屏点按提示、真实用户试用：NOT RUN。
- 下载文件实际落盘：NOT RUN（只核对 Blob 内容与下载触发）。
- 首屏序列与热力动效只在 Chrome headless 下观察帧序列，未做真实 60fps 录屏；帧间隔 110ms 的截图能确认涟漪与波纹存在，不能据此宣称逐帧流畅。
- 题目技术内容仍待参赛者人工审校。
- Live AI 仍为 BLOCKED；外部建议接口只验证了本地模块调用，没有真实模型接入。

### 本轮部署确认

2026-11-17：Actions https://github.com/JUDYLP/stem/actions/runs/44051497681 completed/success，部署最终代码 `4c0e52f`（7964d98 灯组件、ea029e2 history、b3e28e4 UI、4c0e52f 收尾修复；此前 44051220377 已成功部署 bf104ab）。独立 Chrome 打开 https://judylp.github.io/stem/ ：body 背景为 `rgb(0,0,0)`、9 个热力格、首屏三灯 绿/绿/红 且追问出现；11 个静态资源 HTTP 200、MIME 正确、SHA-256 与 `git show HEAD:` 逐项一致；英文站无中文（产品名除外）；1440/390 均无横向溢出；Console 无错误。线上首页为全暗灰空状态，符合未作答预期。

## 2026-11-17 信号灯版修正（热力格、文案与可发现性）

范围：只修 P0/P1/P2 与可发现性问题，不新增功能，不改 localStorage 结构，不接模型。执行者 Codex，无 Subagent；无新依赖或字体。

### 自动测试

- `node --test tests/*.test.mjs`：33/33 PASS（Node v24.18.0）。新增「1/2/3 键映射与 aria-label 文案」测试；history 的「关闭保存时不写入原文」与「关闭后删除已有原文」继续通过；旧 progress 映射为绿/红仍通过。

### 浏览器验证（Chrome 157 headless，CDP，127.0.0.1:5177）

| 场景 | 实际观察 | 结果 |
|---|---|---|
| 热力格尺寸与对齐 | 桌面 60×60，3 格列宽 60，矩阵总宽 504，左对齐；表头 L1/L2/L3 与格子左边缘一致 | PASS |
| 整格填充 | 判定格背景 `rgb(14,35,22)` / `rgb(36,15,14)` 等低饱和底色，同色细边框，内发光；✓ ! ✗ 居中；未作答深灰 | PASS |
| L1 红 / L2 琥珀 / L3 绿 | 同一行三格同时显示红/琥珀/绿，统计 绿2/琥珀2/红1/未作答4；截图 `heat-showcase.png` | PASS |
| 波纹与过渡 | 确认后整格加 `is-changed`，背景/边框/阴影 600ms 过渡，涟漪从该格向外传播，位移距离按 80ms 递增 | PASS |
| 热力图移动端 | 390px 下表头隐藏，题名独占一行（最多两行），下方一排三个 103×64 格，无横向溢出 | PASS |
| 练习框架 | 三盏中性白圈灯，无判定色；卡片间箭头表示 L1→L2→L3；「适合谁」与卡片底部间距 34px，无重叠 | PASS |
| 中文残留英文 | 页面文本不再出现 Retry / Before / After / Pass / Review / Simulated；「API Key」仅首屏按钮下一处；`reviewer` 改为「评审者」 | PASS |
| 图例与灯按钮 | 参考要点下常驻三灯图例与「点灯切换，也可按 1 / 2 / 3」；每盏灯是 button，aria-label 为「第 N 条：当前…，点击切换为…」 | PASS |
| 键盘 | 焦点在灯上按 3 → 红，按 1 → 绿，空格循环到下一状态；aria-live 播报「第 N 条已设为…」 | PASS |
| 导出禁用态 | 空记录时透明底、深灰细边框与文字；不再出现灰色实心块 | PASS |
| 加载与表单间距 | 「已加载 3 道题」与「分类 / 题目」之间 20px，层级可辨 | PASS |
| 清空弹窗 | 新增「先导出复习单」，有 review 时可用；文案含「清空后无法恢复」；390px 下三个按钮竖排全宽，无重叠 | PASS |
| 回答对比 | 未开启保存时判定无原文、时间线无展开入口；开启后仅最新且带原文的条目显示对比 | PASS |
| 格子详情 | 点击红/琥珀格跳到对应题层（Redis L1 验证），题名在行标题完整显示，tooltip 仅补充时间 | PASS |
| 控制台 | 上述流程 Runtime exception 与 Log error 为空 | PASS |

证据（本地忽略目录 `work/qa-signal-20261117/`，不提交）：`final-{zh,en}-{1440,390}.png`、`heat-showcase.png`、`old-records.png` / `new-records.png`、`old-matrix.png` / `new-matrix.png`、`compare3.png`、`mobile-dialog.png`、`round3-check.json`、`round3-flow.json`。

### 未验证与限制

- 真实 iOS/Android 与 Safari/Firefox：NOT RUN；390px 为 headless 视口模拟。
- 触屏点按 tooltip、真实读屏软件播报：NOT RUN；只验证了 aria 属性、live region 文本和键盘路径。
- 下载文件实际落盘：NOT RUN（仍只核对 Blob 与下载触发）。
- 动效流畅度：用截图与帧序列检查状态，不做真实 60fps 录屏承诺。
- 题目技术内容仍待参赛者人工审校；Live AI 未接入。

### 修正部署确认

2026-11-17：Actions https://github.com/JUDYLP/stem/actions/runs/44058487591 completed/success，部署 `caf3a7c`（741eed3 键盘与标签、2bea3c6 文案、783969f 热力格与灯语义、caf3a7c 文档）。独立 Chrome 打开 https://judylp.github.io/stem/ ：11 个静态资源 HTTP 200、MIME 正确、SHA-256 与 `git show HEAD:` 一致；空状态热力格 60×60、矩阵宽 504、三盏中性灯无 data-state、页面「API Key」1 处、无 Retry/Before/After/Pass/Review/Simulated 残留；英文站无中文；1440/390 无横向溢出；Console 无错误。线上空状态的导出按钮为透明底深灰细边框并禁用。
