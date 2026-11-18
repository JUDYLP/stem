# Unscripted（脱稿）

**AI can write your code. Can you explain it?**

纯前端解释训练器。公开预览：https://judylp.github.io/stem/ 。无需登录或 API Key；尚未接入 Live AI。
英文入口：https://judylp.github.io/stem/?lang=en

## 产品是什么

每条参考要点是一盏信号灯：讲清楚了灯亮绿，讲到一半是琥珀，漏掉了是红，未作答是不发光的暗灰。整站是一块黑色仪表盘，颜色只来自灯。灯同时带 ✓ / ! / ✗ 形状，色弱用户不靠颜色也能分辨。

练习闭环：读题 → 用自己的话解释 → 提交后逐条对照参考要点 → 点灯自评 → 确认判定 → 换一个说法 Retry → 在练习记录里看热力矩阵和时间线 → 导出 Markdown 复习单。

## 已实现

- 黑色信号灯视觉系统：`#000` 背景、`#0E0E10` 面板、三色灯（绿 `#22C55E` / 琥珀 `#F5A524` / 红 `#FF453A`）与多层光晕；正文 `#EDEDED`，次要文字 `#A1A1AA`。
- 动态点阵背景：固定全屏 canvas，桌面 28px / 390px 32px 点阵，基础白点不透明度 0.12–0.20，双正弦慢波呼吸；只有首屏示例面板的三盏灯向背景染色（160px 内），点亮时扩散 320px 点阵波纹；导航 logo 与面板内的灯不染背景点，避免彩点残留。答题框聚焦时动效降到 30%；dpr≤2、30fps、页面隐藏暂停，`prefers-reduced-motion` 只画一帧静态点阵。
- 灯的表现力：示例灯 32px、参考要点灯 24px（44px 点击区）、热力格图标 22px、层级灯与本层灯色 18px；亮芯为白到灯色的径向渐变，带灯罩内高光与左上方反光点、4/14/36px 三层光晕；未亮灯是深色玻璃。要点行与热力格有同色低亮度内发光；面板内有灯点亮时，1px 边框沿灯的方向短暂染成同色后淡出；键盘焦点显示 2px 白色环。
- 整站中英双语，语言优先级为有效 `?lang=`、已保存偏好、浏览器语言；偏好独立存 `unscripted.language`。
- 三题九层（JUC / Redis / MySQL），每题 L1 Explain / L2 Reason / L3 Stress-test，每题每层 2–4 条参考要点。
- 灯判定：参考要点下有常驻图例，每条要点的灯是 button，默认琥珀；空格/回车循环，1/2/3 直接设为 绿/琥珀/红，aria-label 写明当前与下一个状态，切换后 aria-live 播报。该层规则为全绿→绿、有红→红、其余→琥珀；确认后映射到既有 Pass/Review（只有全绿是 Pass），旧 `unscripted.progress.v1` 记录仍可读取。
- 练习记录：3×3 热力矩阵，判定后整格填充灯色并保留 ✓ / ! / ✗，未作答为深灰；桌面 60px 方格、矩阵左对齐，窄屏题名独占一行后接三格；悬停补充时间，点击跳到该题该层。倒序时间线含灯色竖条、漏掉的要点与同题层变化条。
- 「在本机保存我的回答，用于前后对比」默认关闭；只保存开启之后的回答，之前的判定没有原文。开启后同一题层可展开对比首次与最近一次回答，关闭时删除已保存原文。
- 循环判定写入 `unscripted.history.v1`，最多 200 条，超出删除最早；不改 `unscripted.progress.v1` 结构。
- 导出当前 review 的 UTF-8 Markdown 复习单，含灯色与漏掉的要点。
- 「清空记录」二次确认，弹窗内可先导出复习单；确认后同时清空 history 与 progress。
- 独立英文模拟示例（首屏面板）依次点亮 绿、绿、红，再浮现追问；持续标注 Simulated，不写正式记录、不发请求。
- 动效只由事件触发：点亮 300ms、红灯闪一次、琥珀待判定呼吸、热力格 600ms 过渡与按距离传播的波纹、首次进入视口按对角线亮起；`prefers-reduced-motion` 下全部直接切换。
- Ctrl / Cmd + Enter 提交；回答仅存本页内存，刷新清空；存储损坏或禁用时保留原数据、降级为内存练习并提示。

题目已对照官方资料核验，**仍待参赛者人工审校**，见 docs/QUESTION_REVIEW.md。不得据此声称测量掌握程度或学习提升。

## Windows 启动

在项目根目录打开 PowerShell：

```powershell
python -m http.server 5174 --bind 127.0.0.1
```

访问 http://127.0.0.1:5174/ ，练习入口为 #practice 。按 Ctrl+C 停止服务。本机 python 为 3.14.2；py 启动器不可用，使用 python。无 npm 依赖和构建步骤；不要用 file:// 正式测试。

## 测试

本机 Node v24.22.1，仅用内置测试工具：

```powershell
node --test tests/*.test.mjs
node --check src/main.js
node --check src/history.js
node --check src/demo.js
```

38 项自动测试：题库 schema 与双语对齐、本地记录降级、灯色汇总规则、history 200 条裁剪、关闭开关不写原文、旧 progress 兼容、导出过滤与转义、英文导出。浏览器实际结果与未测项见 docs/QA_REPORT.md。

## 数据与隐私

回答与 Retry 仅保存在页面内存，切题保留，刷新清空。localStorage 有三个键：

- `unscripted.progress.v1`：题目×层级最后一次人工评价（pass/review）和更新时间，结构未变。
- `unscripted.history.v1`：每次确认的判定 `{questionId, layer, ts, light, pointLights, missedPoints}`，最多 200 条；只有开启保存回答开关时才附加 `answer`，默认不保存，关闭时删除已存原文。
- `unscripted.language`：语言偏好。

记录只属于当前浏览器与站点 origin；换端口/域名后不会自动同步。没有账号、数据库、后端、遥测或第三方模型调用；页面只请求同源静态文件。

导出内容仅包括当前 review，改为 pass 后移除；灯色与漏点来自最近一次判定。浏览器下载策略可能阻止保存：测试已核对 Blob 的 UTF-8 Markdown 内容和下载触发，当前隔离测试环境未核实磁盘落盘，请在实际浏览器确认下载。

加载完成后示例可断网操作；首次无缓存离线打开或断网刷新不保证可用。

## 文件

- `index.html` / `styles.css`：页面结构、信号灯 token 与动效。
- `data/questions.json`：三层题库（中英）。
- `src/lights.js`：灯色规则、灯组件、外部建议接口。
- `src/dotfield.js`：点阵纯计算（衰减/呼吸/间距）与 canvas 渲染。
- `src/history.js`：判定历史、200 条上限、回答开关。
- `src/questions.js`：加载与 schema 校验。
- `src/storage.js`：自评记录、清空与故障降级。
- `src/main.js`：练习、判定、热力矩阵、时间线。
- `src/i18n.js`：双语字典与语言解析。
- `src/export.js`：复习单 Markdown。
- `src/demo.js`：首屏模拟示例的点亮序列。
- `tests/`：Node 内置测试。
- `docs/planning/`：维护中的计划、任务与决策。

## 后续

T05 API Spike 因缺少有效 Key 为 BLOCKED，T06/T07 Live 未开工；T02 题目待人工审校；下载落盘、真实手机与其他浏览器未验证；视频与 Devpost 提交未完成。远程为 https://github.com/JUDYLP/stem ，Pages 由 `.github/workflows/pages.yml` 打包 11 个静态资源发布。

## AI 辅助开发披露

由用户指导 Codex 编写和测试。未启动 Subagent，具体底层模型子型号无法从本次工具回执核实。产品没有 Live AI；开发使用 AI 与产品集成 AI 分开陈述。题目来源和人工审校状态已记录，不冒称用户已掌握所有技术。
