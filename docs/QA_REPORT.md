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

- `node --test tests/*.test.mjs`：38/38 PASS（Node v24.18.0，WSL）。新增 `tests/lights.test.mjs`（5 项：灯色汇总、Pass 映射、循环顺序、外部建议校验、旧 progress 兼容）与 `tests/history.test.mjs`（7 项：200 条裁剪、默认不存原文、关闭开关删除原文、坏数据不改写、非法条目丢弃、最近灯色、清空保留开关）。
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

- `node --test tests/*.test.mjs`：38/38 PASS（Node v24.18.0）。新增「1/2/3 键映射与 aria-label 文案」测试；history 的「关闭保存时不写入原文」与「关闭后删除已有原文」继续通过；旧 progress 映射为绿/红仍通过。

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

## 2026-11-17 动态点阵与灯的表現力

范围：只做固定全屏点阵背景与灯的视觉表现，不新增功能、不改存储结构、不接模型。执行者 Codex，无 Subagent；无新依赖或字体。

### 自动测试

- `node --test tests/*.test.mjs`：38/38 PASS。新增 `tests/dotfield.test.mjs` 4 项：衰减 0→1 与 160px 边界、单调性、0.5 染色上限、0.06–0.10 呼吸与 30% 静音、28/32px 间距。

### 浏览器测量（Chrome 157 headless，CDP，127.0.0.1:5177）

| 项目 | 结果 |
|---|---|
| 画布与点阵 | 固定 canvas，1440×1000（dpr1）/ 2880×2000（dpr2）；间距 28；390px 下 780×1688、间距 32；`pointer-events:none`、`aria-hidden` |
| 每帧耗时 | 1440 dpr1 平均 0.35ms、最大 1.6ms；1440 dpr2 平均 0.36ms、最大 1.4ms；390 平均 0.07ms、最大 0.3ms |
| 帧率 | 5 秒窗口 30fps，平均间隔 33.3ms（`FRAME_BUDGET` 31.3ms 避免 60Hz 下掉到 50ms） |
| 灯照亮点阵 | 样例灯 160px 内 417 个点全部染色；近灯最大 alpha 147/255≈0.58，40px 处 0.58，80px 0.53，120px 0.47；颜色取最强灯 |
| 点阵波纹 | `lamp:lit` 事件触发，1.2s、300px 扩散；点阵波纹在面板外可见（截图 `tint-crop.png`） |
| 书写静音 | #answer 聚焦后 `quiet=true`，波纹/染色/呼吸强度按 0.3 缩放；失焦恢复 |
| 减少动态 | reduced-motion 下首帧绘制后帧数不再增长（1.2s 内保持 1 帧）；恢复偏好后自动续跑 |
| 灯尺寸 | 示例 32px、要点灯 24px + 44px 按钮、层级/本层 18px、热力图标 22px、logo 8px |
| 灯结构 | 白→灯色径向亮芯、1px 内圈高光、左上反光点、4/14/36px 三层光晕；未亮深色玻璃；焦点为灯外 2px 白环 |
| 面板光 | 要点行左侧同色渐隐（0.10–0.12）与同色边框；热力格径向内发光 + 同色边框 |
| 方法区 | L1/L2/L3 标签黑底内边距，连线不再压字；中性灯 + 向右箭头 |
| 时间线 | 漏点改为分条 `<ul>`，每条前 12px 红灯 |
| 溢出 | 1440 / 390 全页无横向溢出；中英文站点 Console 无错误 |

证据（本地忽略目录 `work/qa-signal-20261117/`，不提交）：`final2-zh-1440-lit.png`（含红/琥珀/绿参考要点与热力格）、`final2-{zh,en}-{1440,390}.png`、`dotseq-01..10.png`（5 秒帧序列）、`compare4.png`、`tint-crop.png`、`hero-old/new.png`、`final2-report.json`。

### 未验证与限制

- 真实 60Hz/120Hz 屏幕、Safari/Firefox、真实手机：NOT RUN；390 为 headless 视口。
- `visibilitychange` 暂停路径已实现但未在真实切后台测量帧数；只做了 reduced-motion 的帧数静止验证。
- 4ms 目标是绘制耗时（canvas 2D 指令），不含浏览器合成与样式动画；headless 数字不能直接等同真机。
- 面板保持不透明，因此位于面板内部的灯主要靠 CSS 内发光，点阵染色只在面板外的间隙可见。
- 题目人工审校、Live AI 仍未进行。

### 本轮部署确认

2026-11-17：Actions https://github.com/JUDYLP/stem/actions/runs/44070234739 completed/success，部署 `67ad40e`（e15f81f 点阵模块、f4791fb 点阵与灯、67ad40e 文档）。独立 Chrome 打开 https://judylp.github.io/stem/ ：12 个静态资源 HTTP 200、MIME 正确、SHA-256 与 `git show HEAD:` 一致；canvas 1440×1000、间距 28、`window.__dotfield` 存在，5 秒窗口 30fps（平均间隔 33.3ms）、绘制平均 0.6ms / 最大 2.1ms；示例灯 32px，点阵有 840 个已染色像素；body 透明、无横向溢出、Console 无错误。英文站无中文。

## 2026-11-18 外观收尾：点阵提亮与灯的外溢

范围：只调点阵与灯的边界表现，不改功能、存储或文案。执行者 Codex，无 Subagent；无新依赖。

### 自动测试

- `node --test tests/*.test.mjs`：38/38 PASS。新增 `spillAllowed` 测试（0/80/81、非首屏面板、NaN）；呼吸区间改为 0.12–0.20。

### 浏览器验证（Chrome 157 headless，CDP，禁用缓存，127.0.0.1:5177）

| 项目 | 结果 |
|---|---|
| 导航 logo 不染色 | 首帧后左上 300×120 区域内彩色点 = 0；只统计 `<main>` 内的灯 |
| 点阵亮度 | 基础像素 alpha 32–51 / 255（0.125–0.20），波峰/波谷比约 1.6；峰值仍为 0.20 |
| 正文对比度 | `#EDEDED` 对 `#000` 17.94:1、对最亮基础点 `#333` 10.79:1；`#A1A1AA` 对 `#000` 8.19:1、对 `#333` 4.93:1（均 ≥4.5） |
| 首屏波纹 | `RIPPLE_SPREAD=320`，`lamp:lit` 触发；1.1s 时在标题区采样到绿色点 alpha 159/255（0.62），波纹越过卡片边缘可见 |
| 面板边缘接光 | 灯点亮后最近面板获得 `edge-lit`，`--edge-color` 为对应 rgba(...,.7)，1px 遮罩环沿灯方向显示，900ms 后移除并淡出 |
| 外溢限制 | 只有首屏示例面板的灯染背景；面板内灯距离边缘 >80px 或不属于示例面板时不染。练习区滚动到视口后左侧 200px 内彩色点 = 0 |
| 视口截图 | 1440×1000 与 390×844，中文/英文，首屏与热力图附近各一张；未做全页拉伸 |
| 性能 | 30fps 门限；桌面绘制约 0.35–0.52ms/帧，峰值 <2.1ms；Console 无错误 |

证据（本地忽略目录 `work/qa-signal-20261117/`，不提交）：`viewport-{zh,en}-{1440,390}-{hero,heat}.png`、`rip-zoom.png`、`edge-left.png`、`edge-glow.png`。

### 未验证与限制

- 真实 60/120Hz 与真机未测；4ms 为 canvas 绘制耗时，不含合成。
- 面板内的灯不再染背景点（比 80px 规则更严格），统一改由面板 1px 边缘光连接内外；这是为避免左侧彩色点条。
- 基础点提亮后，正文字形落在单个亮点上的最坏对比度为 4.93:1（次要文字），仅覆盖 2px 点，实际阅读背景仍是黑底。

### 本轮部署确认

2026-11-18：Actions https://github.com/JUDYLP/stem/actions/runs/44223151827 completed/success，部署 `f92cc82`（fb29cf8 点阵提亮/限流、0e5c608 面板接光、f92cc82 文档）。独立 Chrome 打开 https://judylp.github.io/stem/ ：12 个静态资源 HTTP 200、MIME 正确、SHA-256 与 `git show HEAD:` 一致；左上 300×120 区域彩色点 0；基础点 alpha 32–51/255；30fps（平均间隔 33.3ms）、绘制平均 0.47ms；示例面板点亮后 `edge-lit` 与 `rgba(255,69,58,.7)` 生效；390 下间距 32、canvas 780×1688（dpr 上限 2）、无横向溢出；Console 无错误。

## Stage 1.1 + Stage 2A（2026-11-18，未提交）

- 本地/远端基线f254eea，原38项测试通过。新增83项真实校验测试；npm ci后npm test为121/121 PASS，0失败；npm run check:syntax为21文件PASS。
- 原题库、main、storage/history、UI和打包脚本未改。原打包产物12资源+.nojekyll，无开发依赖或校验器。线上12资源HTTP200，SHA256与HEAD Git原始字节一致；Windows工作树CRLF不是线上内容差异。
- API、大小/深度/错误边界、安全解析、跨题Rubric唯一、翻译、日期、版本测试详见[验证矩阵](architecture/TEST_MATRIX_AND_NEXT_STAGE.md)。
- 新工作流在Pages之前安装Node24依赖、跑测试和语法，保留权限/concurrency；NOT RUN远端CI（用户禁止提交/推送）。本地同等命令通过不等于远端job已成功。
- NOT RUN：本轮浏览器视觉/交互复验；导入UI/注册/迁移/删除/JCS摘要尚未实现。没有操作真实localStorage或Live AI。

## 2026-11-18 热力矩阵：中心光、轨迹、紧凑模式

范围：只改热力矩阵显示，读取既有 `unscripted.history.v1`，不改数据结构、题库或存储。执行者 Codex，无 Subagent。

### 自动测试

- `node --test tests/*.test.mjs`：123/123 PASS（含题库架构阶段新增测试）。新增：`isImproving`（红→琥珀、琥珀→绿、红→绿为真；绿→琥珀、同色、单条、空数组为假）与 `shouldUseCompact`（6 题展开、7/12 题紧凑）。

### 浏览器验证

| 项目 | 结果 |
|---|---|
| 中心光 | 判定格背景为默认中心椭圆渐变（`radial-gradient(... 0%, ... 46%, transparent 78%)`）+ 深色底；`inset 0 0 0 1px` 同色微光与 `inset 0 0 16px` 内发光；不再有 32% 28% 的偏左上色块 |
| 进步轨迹 | JUC L1 三次判定显示红/琥珀/绿三个 5px 点；JUC L2 两次显示红/琥珀；L1/L2 的 L 标签旁出现绿色 ↑；L3 单次无箭头 |
| 历史文案 | L1 aria-label：`… · 讲清了 · 最近 3 次：漏掉了 → 还差一点 → 讲清了`；tooltip 同内容并带最近时间 |
| 统计行 | 绿灯 3、琥珀灯 2、红灯 0、未作答 4，均为小灯 + 数字，无斜杠 |
| 紧凑切换 | 3 题时手动切换为紧凑：28×28 格、行 678+28×3、`展开/紧凑` aria-pressed 正确 |
| 12 题自动紧凑 | CDP Fetch 注入 12 题测试数据（不改 `data/questions.json`）：自动紧凑、12 行、每行 01–12 题号 + 截断题名 + 3 个 28px 格；1440 与 390 均无横向溢出（390 scrollWidth=390） |
| 移动端 | 390 紧凑头部 L1/L2/L3 对齐；12 行 + 统计在 844 视口内完整可见 |

证据（本地忽略目录 `work/qa-signal-20261117/`，不提交）：`trail-1440.png`、`trail-390.png`、`trail-zoom.png`、`compact12-1440.png`、`compact12-390.png`。

### 未验证与限制

- 12 题是浏览器 Fetch 注入的测试数据，不是正式题库；紧凑阈值与显示已验证，但不声称有 12 道审校题目。
- 紧凑 28px 格内 5 个 5px 轨迹点只能无间隙排列，视觉上接近短条；展开模式是完整轨迹视图。
- 真实触屏 hover/tooltip、读屏软件播报仍未实测；只验证了 aria-label 与 data-tip 文本。

### 本轮部署确认

2026-11-18：Actions https://github.com/JUDYLP/stem/actions/runs/44229179238 completed/success，部署 `ea5833b`。独立 Chrome 打开 https://judylp.github.io/stem/ 并写入同一组测试历史：12 个资源 HTTP 200、SHA-256 与提交一致；L1 轨迹为红/琥珀/绿且出现 ↑，aria-label 为「… · 讲清了 · 最近 3 次：漏掉了 → 还差一点 → 讲清了」；统计为「绿灯 3 琥珀灯 2 红灯 0 未作答 4」；格子背景为中心椭圆渐变；手动紧凑后格子 28×28，1440/390 无横向溢出；Console 无错误。

## Stage 2A.1浏览器校验构建

本轮基线123测试，新增15项后138/138通过；25文件语法通过。独立ESM无裸import，不含Ajv编译器，Node禁动态代码生成测试通过。Chrome157实际加载localhost冒烟页（script-src self，无unsafe-eval），合法/非法/嵌套和转义重复键/危险键/超大输入/字节API共8项通过，控制台无消息。临时服务已停止。本轮未复测训练UI、不操作存储、不推送或部署；现有独立页面改动予以保留。

## 2026-11-18 背景光与首屏库存示例

范围：只改首屏示例与点阵/环境光；练习区、题库和存储未改。执行者 Codex，无 Subagent；新增数据只有 `data/hero-demo.v1.json`。

### 自动测试

- 应用测试 `node --test tests/{dotfield,hero-demo,lights,history,export,i18n,questions,storage}.test.mjs`：**44/44 PASS**。新增 `dotfield` 斜向光带（0.08–0.20、12s 周期、峰谷比）与 `hero-demo` 的 JSON 契约（3 回答、3 要点、灯色枚举、引用必须来自所选回答、红灯必须带追问、双语齐全）。
- 说明：`tests/*.test.mjs` 全量还包含并行架构会话未提交的 `pack-browser.test.mjs`；该文件在 WSL 下因 `node_modules/esbuild` 是 win32 版本而失败，与本轮改动无关，未计入本轮通过项。

### 背景与手电筒（Chrome 157 headless，禁用缓存）

| 项目 | 结果 |
|---|---|
| 首屏环境光 | 900px 圆、背景 .22 × 元素 opacity .82 = 中心 .18；中性微白 → 绿 → 红由 800ms 颜色过渡；每次点亮加 1s 扩张/增亮脉冲；红后保持红色；重播重走 |
| 色值 | 红 `rgba(255,69,58,.22)`、绿 `rgba(34,197,94,.22)`、空 `rgba(255,255,255,.22)`（最终不透明度 .18） |
| 分区环境光 | method 白 .1、practice 跟随本层灯色（样例绿 .1）、records 按灯数混色（样例 `rgba(118,184,71,.1)`）；IntersectionObserver 进入视口才 `is-visible` |
| 点阵波动 | 基础 0.08–0.20，12s 斜向宽光带；测试验证周期与峰谷比 |
| 手电筒 | 半径 180、最大 .45、冷白；光标缓动 0.15；画布像素实测中心 `(215,227,255,108)`≈0.42；移到练习面板上 0.9s 后强度 0.012；答题框聚焦强度 0；靠近本层绿灯时像素为 `(33,196,94,108)`（混入灯色）；仅 `pointer:fine` 初始化 |
| 帧耗时 | 带手电筒 5 秒窗口平均 0.37ms、最大 1.7ms、30fps（间隔 33.3ms）；无手电筒约 0.20–0.58ms |
| 减少动态 | 帧数 1.2s 内保持 4 不变；手电筒 0；三分区光晕直接 visible；首屏自动判定一次到位；无脉冲 |
| 对比度 | 正文 #EDEDED：黑底 17.94、最亮基础点 #333 10.79、白/绿/红环境光 11.60/14.28/15.29；次要文字 #A1A1AA：8.19/#333 4.93/白 5.30/绿 6.52/红 6.98，均 ≥4.5 |

### 首屏库存示例

- Spring Boot 风格 `StockService.deduct`（Redis GET → 判空 → SET-1），带 `// Check stock and deduct atomically` 注释；头部「AI 生成 · 库存服务」与 `stock · Redis`。
- 三个预设回答；点选后引用整句、三盏 32px 灯按 JSON 逐盏点亮并显示理由与关键词；红判定出追问；全绿显示「讲清了，试试 L3？」；`aria-live` 汇总「预设判定：X 条讲清了…」；按钮原生键盘可用；持续标注「预设判定，未调用 AI」。
- 进入页面 700ms 后用第一个错误回答自动演示；点击任一选项停止自动；「重播示例」重走当前选项。
- 390 选项竖排（324px 全宽）；英文页除产品名外无中文；首屏卡片在 1440×1000 内完整显示（底边 947px）。
- 截图：`hero-red2.png`、`hero-green2.png`（绿/红首屏视口）、`spot-canvas-black.png` 与 `spot-zoom-final.png`（点阵层手电筒）、`option-{zh,en}-{1,2,3}.png`（6 张选项结果）、`hero-390-options.png`（390 竖排）。
- 手电筒整页截图限制：headless 的 `Page.captureScreenshot` 在指针移动后未包含画布聚光帧；改为保存 canvas 图层并叠黑底，且用 `getImageData` 独立验证像素。实际页面交互仍由 `pointermove` 驱动。

### 未验证与限制

- 真实触屏、Safari/Firefox、真实 60/120Hz 未测；30fps 为门限与 headless 窗口测量。
- `visibilitychange` 暂停沿用旧实现，未做真实切后台帧数测量。
- 首屏「试试 L3」只是文案，不跳转（练习题库主题与库存题不同，避免误导）。
- 12 题紧凑矩阵与上一轮相同，仍是浏览器 Fetch 注入的测试数据。
- 并行架构会话的 `pack-browser.test.mjs` 与 node_modules 平台问题不属于本轮产品代码。

### 本轮部署确认

2026-11-18：Actions https://github.com/JUDYLP/stem/actions/runs/44231982922 completed/success，部署 `2ef6ba6`（564fd1c 点阵波/手电筒、173027a 环境光/库存示例、2ef6ba6 文档）。独立 Chrome 打开 https://judylp.github.io/stem/ ：13 个静态资源 HTTP 200、SHA-256 与 `git show HEAD:` 一致；自动演示选中第一个错误回答，三灯红、环境光 `rgba(255,69,58,.22)`；英文页除产品名外无中文；390 选项宽 324、scrollWidth 390、点距 32；30fps、绘制平均 0.64ms、峰值 1.5ms；Console 无错误。

## 2026-11-18 首屏修正：无边缘环境光与选项前置

范围：只修首屏示例与环境光，不新增功能、不改题库/练习逻辑/数据结构。执行者 Codex，无 Subagent。

### 自动测试

- 应用测试 `node --test tests/{dotfield,hero-demo,lights,history,export,i18n,questions,storage}.test.mjs`：**44/44 PASS**。更新 hero JSON 契约：允许空引用；非空引用必须来自所选回答且中英同时存在；校验三个回答分别落在 red/amber/green。`pack-browser.test.mjs` 仍是并行架构会话未提交的 WSL/win32-esbuild 环境问题，不属本轮提交。

### 首屏环境光

| 项目 | 结果 |
|---|---|
| 渐变 | 1100px 元素、`circle closest-side`，8 个色标（0/16/34/52/68/82/94/100%），94% 已归零、100% `transparent`；外层 `filter: blur(40px)` |
| 位置 | 中心 `left:58% / top:56%`（390 下 28%/58%），对准卡片左侧灯列，不是卡片中心 |
| 颜色 | 白/绿/琥珀/红四层各自渐变，透明度 800ms 交叉淡入；点亮脉冲 1s；红保持 |
| 无硬边 | 1440×900 与 1920×1080 自动演示截图中，左侧红色光晕连续衰减到黑，无圆边界；元素边界 263..1363 / 503..1603 均在透明渐变之外 |

### 卡片顺序与判定

- 代码 8 行（字号 10.5/1.55，最后三个闭合括号合并为 `} } }`）→ 题目 → 三个选项 → 判定结果 → 预设标注；判定前结果区 hidden。
- 1366×768：选项 373–522 全部在首屏内；判定前卡片约 450px，低于 85% 屏高；判定后卡片变高（803px），选项仍在上方可见。1440×900 与 1920×1080 同样选项可见。
- 已选选项 `aria-pressed` 高亮；删除「你的回答」引用块。
- 绿灯只显示要点 + 高亮引用词（不显示理由）；红/琥珀显示一句理由，引用为空则不显示。位置/引用：
  - 红：点1「原子的」；点2/3 无引用。
  - 琥珀：点1「单线程」、点2「安全」；点3 无引用。
  - 绿：点1「读和写之间」、点2「超卖」、点3「DECR」。
- 选项结果分别为 红 / 琥珀 / 绿（Redis 单线程判为琥珀：单命令原子，但 GET+SET 仍非原子）。
- 全绿出现「去练习区试试真题 →」按钮，点击后 scrollY 1254、练习区顶部 72（sticky 头部让位），键盘可操作；红/琥珀不显示该按钮。

### 截图

- `auto-1366x768.png`、`auto-1440x900.png`、`auto-1920x1080.png`（自动演示红灯）。
- `result-red-1440.png`、`result-amber-1440.png`、`result-green-1440.png`（三个选项结果）。

### 限制

- 1366×768 判定后卡片底部到 803px，追问/预设标注需滚动才能看全；选项和灯已按要求在首屏。
- 环境光的 blur 为静态 CSS filter，未单独测 GPU 成本；点阵仍 30fps。
- 手电筒/点阵/分区光沿用上一轮，未在本轮改动。

### 本轮部署确认

2026-11-18：Actions https://github.com/JUDYLP/stem/actions/runs/44244761267 completed/success，部署 `7a69f42`。独立 Chrome 打开 https://judylp.github.io/stem/（1440×900）：13 个静态资源 HTTP 200、SHA-256 与提交一致；自动演示选中第一项，三盏红灯，环境光 `data-light=red`，仅要点 1 显示「原子的」；选项 373–522、卡片 115–803、代码 8 行；Console 无错误。

## 2026-11-18 首屏光晕配色与单线程判定修正

范围：修 CSS 光晕激活规则、预设判定与全绿按钮样式；不改数据结构与练习逻辑。执行者 Codex，无 Subagent。

### 自动测试

- 应用测试 **47/47 PASS**。新增 `tests/styles.test.mjs` 3 项：四色激活选择器两两配对且组内只有 `opacity: 1`；不存在无条件的 `.glow-layer[data-light="red"] { opacity: 1; }`；琥珀有独立渐变块；`hero-try` 为非整行的次级按钮。`hero-demo` 测试改为断言选项灯色 `[red,red,red]`、`[amber,red,red]`、`[green,green,green]`，单线程判定带追问、修复点引用为空。
- `pack-browser.test.mjs` 仍是并行架构会话未提交的 WSL/win32-esbuild 环境问题，不属于本轮提交。

### 光晕修复

- 分组规则现在为 `.hero-glow[data-light="X"] .glow-layer[data-light="X"] { opacity: 1; }`（red 对 red）；琥珀渐变移到独立 `.glow-layer[data-light="amber"]`；删除常亮红色规则。
- 初始/重播：`data-light=white`，`prejudge-white-1440x900.png` 为判定前的中性白；重播后 120ms 采样仍为 white。
- 选项 1：红色；选项 3：绿色；选项 2：按 item 2 把修复点改为红，最终整体红（点1琥珀 380–860ms 时环境光为琥珀，`glow-amber-1440x900.png`；随后点2/3红，环境光红）。「三个选项分别红/琥珀/绿」与「单线程修复点必须红」存在冲突；按更明确的 item 2 执行，选项 2 的截图最终为红，琥珀层通过中途截图与 CSS 测试验证。
- 截图：`option-red-1440x900.png`、`option-single-thread-1440x900.png`、`option-green-1440x900.png`，均 1440×900 视口。

### 单线程判定

- `single-thread` 灯色：点1 琥珀（单命令原子，引用「单线程」）、点2 红（“安全”正是错误结论，引用「安全」）、点3 红（完全没提修复，无引用）；整体红，追问出现，英文同步。
- 点2 选择红而非琥珀：回答直接断言“安全”，遗漏两个请求读到同一值的核心错误，按红更诚实；用户允许二选一。

### 全绿按钮

- `hero-try` 改为 `#0d1a12` 底、`rgba(34,197,94,.5)` 细边框、`#4ade80` 文字，宽度自适应（实测 142×38），不再整行白底；点击后 scrollY 1246、练习区顶部 72。
- 红/琥珀不显示该按钮。

### 限制

- 光晕中心位于卡片内，截图采样使用可见左侧光区/激活层背景；精确中心被不透明卡片遮挡。
- 1366×768 判定后卡片仍可能超出视口底部；选项在首屏，本轮未改布局高度。
- 真实 60/120Hz、Safari/Firefox、触屏未测；`pack-browser` 环境问题同上。
