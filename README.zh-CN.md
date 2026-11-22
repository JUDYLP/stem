# Unscripted（脱稿）

**AI can write your code. Can you explain it?**

[English](README.md) | 中文

静态前端解释训练器，可接入真实 AI 判题。公开预览：https://judylp.github.io/stem/ 。离线练习、模拟演示和托管 AI 判题都无需登录或 API Key。
英文入口：https://judylp.github.io/stem/?lang=en
演示视频（2:30，英文）：https://youtu.be/mZTNTnT0S9M

## 产品是什么

每条参考要点是一盏信号灯：讲清楚了灯亮绿，讲到一半是琥珀，漏掉了是红，未作答是不发光的暗灰。整站是一块黑色仪表盘，颜色只来自灯。灯同时带 ✓ / ! / ✗ 形状，色弱用户不靠颜色也能分辨。

练习闭环：读题 → 用自己的话解释 → 提交后逐条对照参考要点 → 点灯自评 → 确认判定 → 换一个说法 Retry → 在练习记录里看热力矩阵和时间线 → 导出 Markdown 复习单。

## 已实现

- AI 判题：提交回答后，模型逐条给出参考要点的灯色、理由和回答原文引用，并可提出一个追问。引用必须是回答的原文片段，前端会核对，不符的判定不会亮绿。结果只是建议，学习者确认后才写入记录。三种连接方式：托管演示（Cloudflare Workers AI，免 Key）、自带 DeepSeek Key 或自定义兼容代理、评委演示（预设模拟，标注 Simulated）。托管不可用或额度用完时，页面会提示改用评委演示。
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

题目已对照官方资料核验，仍待作者最终审校，见 docs/QUESTION_REVIEW.md。目前没有测量学习效果，本工具也不能用来证明掌握程度。

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

261 项自动测试：题库 Pack 的 schema 与语义校验、双语对齐、AI 判定解析与引用核对、托管 Worker（来源白名单、限流、超时、JSON 恢复）、本地记录降级、灯色汇总规则、history 200 条裁剪、关闭开关不写原文、旧 progress 兼容、导出过滤与转义、英文导出。浏览器实际结果与未测项见 docs/QA_REPORT.md。

## 数据与隐私

回答与 Retry 仅保存在页面内存，切题保留，刷新清空。localStorage 有四个键：

- `unscripted.progress.v1`：题目×层级最后一次人工评价（pass/review）和更新时间，结构未变。
- `unscripted.history.v1`：每次确认的判定 `{questionId, layer, ts, light, pointLights, missedPoints}`，每个 Pack 最多 200 条；只有开启保存回答开关时才附加 `answer`，默认不保存，关闭时删除已存原文。
- `unscripted.language`：语言偏好。
- `unscripted.questionPack`：上次选择的题库。

记录只属于当前浏览器与站点 origin，换端口或域名后不会自动同步。在线判题会把答案、题干和评分要点发送到所选服务；演示代理不保存答案。离线练习与模拟演示在浏览器内运行。

导出内容仅包括当前 review，改为 pass 后移除；灯色与漏点来自最近一次判定。浏览器下载策略可能阻止保存：测试已核对 Blob 的 UTF-8 Markdown 内容和下载触发，当前隔离测试环境未核实磁盘落盘，请在实际浏览器确认下载。

加载完成后示例可断网操作；首次无缓存离线打开或断网刷新不保证可用。

## 文件

- `index.html` / `styles.css`：页面结构、信号灯 token 与动效。
- `data/packs/`：内置题库 Pack（Core 三题、Python Starter 一题，中英双语，带版本）。
- `src/packs/`：Pack 校验（Ajv Schema + 语义检查）、注册与内容摘要。
- `src/ai/`：AI 连接（托管 / DeepSeek / 自定义代理）、判定提示词与结果校验、评委演示脚本。
- `src/fx/`：判定动效。
- `worker/`：托管演示用的 Cloudflare Worker 代理。
- `tools/`：Pack 运行时构建、语法检查、托管回归脚本。
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

题目待人工审校。托管演示已部署，部署步骤见 [Worker 指南](worker/README.md)。下一步是在公开页面上做浏览器实测，并收集真实用户的使用反馈。

## AI 辅助开发披露

代码、测试和大部分文档基本都由 AI 编程工具完成：**Codex**（OpenAI）负责规划、大部分实现、题库校验、AI 判题、Cloudflare Worker、测试和文档；**OpenCode**（使用 **DeepSeek** 模型）负责前端视觉与界面。作者负责提出想法、写各阶段需求、分配任务、审查并合并 PR，并按自己定的标准（最多 1 个误判为绿、延迟可接受）根据回归结果选定托管模型。

第三方服务与依赖：Cloudflare Workers 与 Workers AI（GPT-OSS 120B）、DeepSeek API；仅用于开发和构建的 Ajv（MIT）、jsonc-parser（MIT）、canonicalize（Apache-2.0）、esbuild（MIT）。

产品提供三种与判题有关的体验：

- **托管演示**使用 Cloudflare Workers AI 上的开放权重模型 **GPT-OSS 120B**（`@cf/openai/gpt-oss-120b`，低推理强度）。评委可免 Key 使用，页面根据 Worker 响应显示实际模型。同时对比过 Qwen3.8 27B（超时）和 Gemma 4 26B（关闭思考后过宽，7 个点误判为绿），最终选用 GPT-OSS。
- **自带 Key**支持 DeepSeek，另可选择自定义兼容代理。DeepSeek Key 仅用于直接模式。
- **评委演示**展示预设模拟，页面标注 Simulated。

真实模型输出为建议，由学习者确认正式判定。2026-11-20 对 4 道题共 12 层、38 个要点跑托管回归：12 个请求全部成功，每次约 9 到 21 秒，与预设灯色一致 68.4%，有 1 个预设为琥珀的要点被判为绿。预设只是对照样例，不是准确率基准。详见 [托管回归报告](docs/HOSTED_REGRESSION.md)。

## 题库架构

题库是带版本的 JSON Pack（见 [Schema 规范](docs/architecture/QUESTION_PACK_SCHEMA_V1.md)）。校验分三步：安全 JSON 解析、Ajv 2020 结构校验、语义检查，并为内容计算 JCS 摘要。Pages 发布时构建浏览器端 Pack Runtime，页面不依赖 CDN，也不在浏览器里动态编译。Stage 2C 的学习记录迁移模块已实现并有测试，但尚未接入页面，页面仍使用 `unscripted.progress.v1` 和 `unscripted.history.v1`。各阶段报告见 `docs/architecture/`。

## 许可证

代码与文档以 [MIT 许可证](LICENSE) 发布。内置的 Doto 字体沿用其 SIL Open Font License 1.1。
