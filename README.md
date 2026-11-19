# Unscripted（脱稿）

**AI can write your code. Can you explain it?**

静态前端解释训练器。公开预览：https://judylp.github.io/stem/ 。离线练习与模拟演示无需登录或 API Key。
英文入口：https://judylp.github.io/stem/?lang=en

## 产品是什么

每条参考要点是一盏信号灯：讲清楚了灯亮绿，讲到一半是琥珀，漏掉了是红，未作答是不发光的暗灰。整站是一块黑色仪表盘，颜色只来自灯。灯同时带 ✓ / ! / ✗ 形状，色弱用户不靠颜色也能分辨。

练习闭环：读题 → 用自己的话解释 → 提交后逐条对照参考要点 → 点灯自评 → 确认判定 → 换一个说法 Retry → 在练习记录里看热力矩阵和时间线 → 导出 Markdown 复习单。

## 已实现

- 黑色信号灯视觉系统：`#000` 背景、`#0E0E10` 面板、三色灯（绿 `#22C55E` / 琥珀 `#F5A524` / 红 `#FF453A`）与多层光晕；正文 `#EDEDED`，次要文字 `#A1A1AA`。
- 动态点阵背景：固定全屏 canvas，桌面 28px / 390px 32px 点阵，基础白点不透明度 0.12–0.20，双正弦慢波呼吸；只有首屏示例面板的三盏灯向背景染色（160px 内），点亮时扩散 320px 点阵波纹；导航 logo 与面板内的灯不染背景点，避免彩点残留。答题框聚焦时动效降到 30%；dpr≤2、30fps、页面隐藏暂停，`prefers-reduced-motion` 只画一帧静态点阵。
- 灯的表现力：示例灯 32px、参考要点灯 24px（44px 点击区）、热力格图标 22px、层级灯与本层灯色 18px；亮芯为白到灯色的径向渐变，带灯罩内高光与左上方反光点、4/14/36px 三层光晕；未亮灯是深色玻璃。要点行与热力格有同色低亮度内发光；面板内有灯点亮时，1px 边框沿灯的方向短暂染成同色后淡出；键盘焦点显示 2px 白色环。
- 整站中英双语，语言优先级为有效 `?lang=`、已保存偏好、浏览器语言；偏好独立存 `unscripted.language`。
- 两个内置题库：Core Software Engineering（三题，JUC / Redis / MySQL）与 Python Starter Pack（一题）。首次打开练习时默认 Python Starter Pack，之后记住题库选择。每题包含 Explain、Reason、Stress-test 三层。
- 灯判定：参考要点下有常驻图例，每条要点的灯是 button，默认琥珀；空格/回车循环，1/2/3 直接设为 绿/琥珀/红，aria-label 写明当前与下一个状态，切换后 aria-live 播报。该层规则为全绿→绿、有红→红、其余→琥珀；确认后映射到既有 Pass/Review（只有全绿是 Pass），旧 `unscripted.progress.v1` 记录仍可读取。
- 练习记录：3×3 热力矩阵，判定后整格填充灯色并保留 ✓ / ! / ✗，未作答为深灰；桌面 60px 方格、矩阵左对齐，窄屏题名独占一行后接三格；悬停补充时间，点击跳到该题该层。倒序时间线含灯色竖条、漏掉的要点与同题层变化条。
- 「在本机保存我的回答，用于前后对比」默认关闭；只保存开启之后的回答，之前的判定没有原文。开启后同一题层可展开对比首次与最近一次回答，关闭时删除已保存原文。
- 循环判定写入 `unscripted.history.v1`，每个 Pack 最多 200 条，超出从该 Pack 裁剪最早记录；不改 `unscripted.progress.v1` 结构。
- 导出当前 review 的 UTF-8 Markdown 复习单，含灯色与漏掉的要点。
- 「清空记录」二次确认，弹窗内可先导出复习单；确认后同时清空 history 与 progress。
- 独立英文模拟示例（首屏面板）依次点亮 绿、绿、红，再浮现追问；持续标注 Simulated，不写正式记录、不发请求。
- 动效只由事件触发：点亮 300ms、红灯闪一次、琥珀待判定呼吸、热力格 600ms 过渡与按距离传播的波纹、首次进入视口按对角线亮起；`prefers-reduced-motion` 下全部直接切换。
- Ctrl / Cmd + Enter 提交；回答仅存本页内存，刷新清空；存储损坏或禁用时保留原数据、降级为内存练习并提示。

题目已对照官方资料核验，**仍待参赛者人工审校**，见 docs/QUESTION_REVIEW.md。不得据此声称测量掌握程度或学习提升。

## Windows 启动

在项目根目录打开 PowerShell：

```powershell
npm ci
npm run build:pack-runtime
python -m http.server 5174 --bind 127.0.0.1
```

访问 http://127.0.0.1:5174/ ，练习入口为 #practice 。按 Ctrl+C 停止服务。本机 python 为 3.14.2；py 启动器不可用，使用 python。本地启动前需生成浏览器 Pack Runtime。Pages 发布自动构建，浏览器只加载生成的静态模块。请通过 HTTP 打开。

## 测试

本机 Node v24.22.1；Node内置测试工具，Pack校验新增固定开发依赖Ajv8.20.0与jsonc-parser3.3.1（MIT）。无浏览器runtime依赖：

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run check:syntax
```

121 项自动测试（原38项+Pack83项）：题库 schema 与双语对齐、本地记录降级、灯色汇总规则、history 200 条裁剪、关闭开关不写原文、旧 progress 兼容、导出过滤与转义、英文导出。浏览器实际结果与未测项见 docs/QA_REPORT.md。

## 数据与隐私

回答与 Retry 仅保存在页面内存，切题保留，刷新清空。localStorage 有三个键：

- `unscripted.progress.v1`：题目×层级最后一次人工评价（pass/review）和更新时间，结构未变。
- `unscripted.history.v1`：每次确认的判定 `{questionId, layer, ts, light, pointLights, missedPoints}`，每个 Pack 最多 200 条；只有开启保存回答开关时才附加 `answer`，默认不保存，关闭时删除已存原文。
- `unscripted.language`：语言偏好。

记录只属于当前浏览器与站点 origin，换端口或域名后不会自动同步。在线判题会把答案、题干和评分要点发送到所选服务；演示代理不保存答案。离线练习与模拟演示在浏览器内运行。

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

题目待人工审校。托管演示的 Gemma 真实模型回归待执行，部署步骤见 [Worker 指南](worker/README.md)。

## AI 辅助开发披露

Codex 在用户指导下辅助开发和测试。产品提供三种与判题有关的体验：

- **托管演示**的部署配置使用 Cloudflare Workers AI 上的开放权重模型 **Gemma 4 26B**（`@cf/google/gemma-4-26b-a4b-it`）。评委可免 Key 使用，页面根据 Worker 响应显示实际模型。
- **自带 Key**支持 DeepSeek，另可选择自定义兼容代理。DeepSeek Key 仅用于直接模式。
- **评委演示**展示预设模拟，页面标注 Simulated。

真实模型输出为建议，由学习者确认正式判定。部署后的托管实测见 [托管回归报告](docs/HOSTED_REGRESSION.md)。

## Stage 2A：独立题库校验（未接入页面）

`src/packs/validate.js`提供validateQuestionPackText(text)、validateQuestionPackBytes(Uint8Array)、comparePackVersions(a,b)。前三段流程为安全JSON解析→Ajv2020结构→语义检查；成功返回valid/errors/pack，失败仅valid/errors，错误带code/path/message且最多50条。不注册、不修复、无DOM/存储/网络副作用。技术内容正确性仍需人工审核。

开发依赖和lockfile仅用于Node校验/测试；不在现有Pages白名单中，不要求服务器或AI Key。CI新增安装→测试→语法检查，失败阻止原有打包部署。当前只完成本地验证；按要求不提交、不推送、不触发新部署。

详见[Stage 2A交付报告](docs/architecture/STAGE_2A_REPORT.md)与[Schema规范](docs/architecture/QUESTION_PACK_SCHEMA_V1.md)。2B注册/预览、2C迁移、2D训练接线均未实现。

## 浏览器校验器构建（Stage 2A.1，未接入训练）

安装开发依赖后运行`npm run build:pack-validator`，生成`work/pack-validator/pack-validator.mjs`。Ajv standalone在构建期生成Schema校验代码，esbuild打包共享解析/语义规则，不依赖CDN或浏览器动态编译。work目录不提交也不由当前Pages发布。最新本地测试138/138通过；构建与Chrome冒烟结果见Stage 2A报告末节。
