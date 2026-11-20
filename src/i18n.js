export const messages = {
  "题库": {"zh": "题库", "en": "Question Pack"},
  "软件工程核心题库": {"zh": "软件工程核心题库", "en": "Core Software Engineering"},
  "Python 入门题库": {"zh": "Python 入门题库", "en": "Python Starter Pack"},
  "已加载 {pack} · v{version} · {count} 道题": {"zh": "已加载 {pack} · v{version} · {count} 道题", "en": "{pack} · v{version} · {count} questions"},
  "已加载 {pack} · v{version} · 1 道题": {"zh": "已加载 {pack} · v{version} · 1 道题", "en": "{pack} · v{version} · 1 question"},
  "答错会怎样": {"zh": "答错会怎样", "en": "Why it matters"},
  "impact.float-equality-v1": {"zh": "循环停不下来，或账单差一分钱", "en": "A loop that never stops, or a bill that's off by a cent"},
  "impact.juc-volatile-atomicity-v2": {"zh": "计数器在并发下悄悄丢数", "en": "A counter that silently loses updates under concurrency"},
  "impact.redis-expiration-v2": {"zh": "缓存永不过期，内存被撑爆", "en": "Cache entries that never expire until memory runs out"},
  "impact.mysql-consistent-read-v2": {"zh": "读到旧数据却以为是最新的", "en": "Reading stale data while believing it's current"},
  "先写解释，再看参考要点 · 自己点灯判定": {"zh": "先写解释，再看参考要点 · 自己点灯判定", "en": "Explain first, then check the rubric and rate your answer"},

  "连接方式": {"zh": "连接方式", "en": "Connection"},
  "使用演示代理（无需 Key）": {"zh": "使用演示代理（无需 Key）", "en": "Use hosted demo proxy (no key needed)"},
  "使用自己的 Key（DeepSeek）": {"zh": "使用自己的 Key（DeepSeek）", "en": "Use your own key (DeepSeek)"},
  "使用自定义代理": {"zh": "使用自定义代理", "en": "Use a custom proxy"},
  "代理地址": {"zh": "代理地址", "en": "Proxy URL"},
  "请填写代理地址。": {"zh": "请填写代理地址。", "en": "Enter a proxy URL."},
  "切到评委演示模式": {"zh": "切到评委演示模式", "en": "Switch to Judge Demo"},
  "演示额度已用完或已关闭（每天北京时间 8:00 重置），可改用评委演示模式或自己的 Key。": {"zh": "演示额度已用完或已关闭（每天北京时间 8:00 重置），可改用评委演示模式或自己的 Key。", "en": "The hosted demo has reached its limit or is disabled (resets daily at 00:00 UTC). You can switch to Judge Demo or use your own key."},
  "演示代理会将答案发送到作者的 Cloudflare Worker，由 Cloudflare Workers AI 上的开放权重模型判定。代理不保存答案。": {"zh": "演示代理会将答案发送到作者的 Cloudflare Worker，由 Cloudflare Workers AI 上的开放权重模型判定。代理不保存答案。", "en": "The hosted demo sends your answer to the author’s Cloudflare Worker for judging by an open-weight model on Cloudflare Workers AI. The proxy does not store your answer."},
  "清空本页练习记录？": { "zh": "清空本页练习记录？", "en": "Clear practice records from this page?" },
  "本页练习记录已清空。": { "zh": "本页练习记录已清空。", "en": "Practice records from this page were cleared." },
  "已关闭：本页练习记录中的回答原文已删除。": { "zh": "已关闭：本页练习记录中的回答原文已删除。", "en": "Answer saving is off. Answers saved by this page were deleted." },
  "清空将删除本页保存的练习和回答。来自 v2 的历史为只读。": { "zh": "清空将删除本页保存的练习和回答。来自 v2 的历史为只读。", "en": "This clears practice ratings and answers saved by this page. History from v2 is read-only." },
  "关闭时会删除本页保存的回答。来自 v2 的历史为只读。": { "zh": "关闭时会删除本页保存的回答。来自 v2 的历史为只读。", "en": "Turning this off deletes answers saved by this page. History from v2 is read-only." },
  "历史评分点 #{n}": { "zh": "历史评分点 #{n}", "en": "Historical criterion #{n}" },
  "历史题库版本未确认": { "zh": "历史题库版本未确认", "en": "Historical pack version unconfirmed" },
  "旧判定需重新确认": { "zh": "旧判定需重新确认", "en": "Prior rating needs reconfirmation" },
  "按题库版本列出最近需要复习的判定。": { "zh": "按题库版本列出最近需要复习的判定。", "en": "Latest ratings to review, grouped by pack version." },
  "历史评分标准：": { "zh": "历史评分标准：", "en": "Historical rubric:" },
  "已保存的判定回答": { "zh": "已保存的判定回答", "en": "Saved answer for this rating" },
"在线 AI 判定（Redis L1）": {"zh": "在线 AI 判定（Redis L1）", "en": "Online AI review (Redis L1)"},
"服务地址": {"zh": "服务地址", "en": "Provider base URL"},
"代理地址（可选）": {"zh": "代理地址（可选）", "en": "Proxy endpoint (optional)"},
"模型": {"zh": "模型", "en": "Model"},
"清除 Key，返回离线": {"zh": "清除 Key，返回离线", "en": "Clear key and return offline"},
"发送答案并判定": {"zh": "发送答案并判定", "en": "Send answer for AI review"},
"离线自评不上传答案。在线判题会将当前答案、题目和评分要点发送给所选服务商。": {"zh": "离线自评不上传答案。在线判题会将当前答案、题目和评分要点发送给所选服务商。", "en": "Offline review keeps answers on this device. Online review sends this answer, question and criteria to your selected provider."},
"正在请求判定，可能需要 10–40 秒…": {"zh": "正在请求判定，可能需要 10–40 秒…", "en": "Requesting review. This may take 10–40 seconds."},
"正在请求判定…": {"zh": "正在请求判定…", "en": "Requesting review…"},
"AI 建议，待确认": {"zh": "AI 建议，待确认", "en": "AI suggestion, pending your confirmation"},
"离线自评": {"zh": "离线自评", "en": "Offline self-review"},
"人工确认": {"zh": "人工确认", "en": "Manually confirmed"},
"模型未评价此项，请自行确认。": {"zh": "模型未评价此项，请自行确认。", "en": "No verdict for this criterion. Review it yourself."},
"无可核验的原文引用": {"zh": "无可核验的原文引用", "en": "No verifiable quote from the answer"},
"未取得建议，可继续自评。": {"zh": "未取得建议，可继续自评。", "en": "No suggestion received. You can continue self-review."},
"缺少 Key": {"zh": "缺少 Key", "en": "Enter a key or select a proxy"},
"请求超时": {"zh": "请求超时", "en": "Request timed out"},
"网络断开": {"zh": "网络断开", "en": "Network offline"},
"网络或跨域请求失败，请检查网络和浏览器 CORS 提示": {"zh": "网络或跨域请求失败，请检查网络和浏览器 CORS 提示", "en": "Network or cross-origin request failed. Check connectivity and browser CORS diagnostics."},
"草稿暂存在本页，刷新会清空。": {"zh": "草稿暂存在本页，刷新会清空。", "en": "Drafts stay in this tab until reload."},

  "跳到主要内容": {
    "zh": "跳到主要内容",
    "en": "Skip to main content"
  },
  "Unscripted（脱稿）首页": {
    "zh": "Unscripted（脱稿）首页",
    "en": "Unscripted home"
  },
  "Unscripted": {
    "zh": "Unscripted",
    "en": "Unscripted"
  },
  "脱稿": {
    "zh": "脱稿",
    "en": "脱稿"
  },
  "主导航": {
    "zh": "主导航",
    "en": "Main navigation"
  },
  "方法": {
    "zh": "方法",
    "en": "Method"
  },
  "示例": {
    "zh": "示例",
    "en": "Example"
  },
  "GitHub": {
    "zh": "GitHub",
    "en": "GitHub"
  },
  "语言": {
    "zh": "语言",
    "en": "Language"
  },
  "中": {
    "zh": "中",
    "en": "ZH"
  },
  "/": {
    "zh": "/",
    "en": "/"
  },
  "EN": {
    "zh": "EN",
    "en": "EN"
  },
  "EXPLAIN WHAT YOU SHIP.": {
    "zh": "EXPLAIN WHAT YOU SHIP.",
    "en": "EXPLAIN WHAT YOU SHIP."
  },
  "AI can write your code.": {
    "zh": "AI can write your code.",
    "en": "AI can write your code."
  },
  "Can you explain it?": {
    "zh": "Can you explain it?",
    "en": "Can you explain it?"
  },
  "AI 写的代码，你能讲清楚吗？用自己的话讲出概念、机制和边界，像面试官就坐在对面。": {
    "zh": "AI 写的代码，你能讲清楚吗？用自己的话讲出概念、机制和边界，像面试官就坐在对面。",
    "en": "Can you explain the code AI wrote? Put concepts, mechanisms, and boundaries into your own words—as if an interviewer were sitting across from you."
  },
  "开始练习": {
    "zh": "开始练习",
    "en": "Start practicing"
  },
  "看一个示例": {
    "zh": "看一个示例",
    "en": "See an example"
  },
  "免费 · 无需注册 · 无需 API Key": {
    "zh": "免费 · 无需注册 · 无需 API Key",
    "en": "Free · No sign-up · No API key"
  },
  "一次解释，三层追问": {
    "zh": "一次解释，三层追问",
    "en": "One explanation. Three levels."
  },
  "模拟示例": {
    "zh": "模拟示例",
    "en": "Simulated example"
  },
  "面试官问 / L2": {
    "zh": "面试官问 / L2",
    "en": "INTERVIEW QUESTION / L2"
  },
  "模拟反馈，非真实评分": {
    "zh": "模拟反馈，非真实评分",
    "en": "Simulated feedback, not an actual assessment"
  },
  "L1 ✓": {
    "zh": "L1 ✓",
    "en": "L1 ✓"
  },
  "THE PRACTICE FRAMEWORK": {
    "zh": "THE PRACTICE FRAMEWORK",
    "en": "THE PRACTICE FRAMEWORK"
  },
  "不止说出答案，也说清为什么。": {
    "zh": "不止说出答案，也说清为什么。",
    "en": "Go beyond the answer. Explain why."
  },
  "以一道并发题为例：从概念出发，沿着执行顺序，一直问到方案的边界。": {
    "zh": "以一道并发题为例：从概念出发，沿着执行顺序，一直问到方案的边界。",
    "en": "Follow one concurrency question from the concept, through the execution order, to the limits of the solution."
  },
  "L1 / 讲清概念": {
    "zh": "L1 / 讲清概念",
    "en": "L1 / EXPLAIN THE CONCEPT"
  },
  "Explain": {
    "zh": "Explain",
    "en": "Explain"
  },
  "volatile 保证了什么？": {
    "zh": "volatile 保证了什么？",
    "en": "What does volatile guarantee?"
  },
  "区分可见性与复合操作的原子性。": {
    "zh": "区分可见性与复合操作的原子性。",
    "en": "Distinguish visibility from the atomicity of a compound operation."
  },
  "L2 / 推演机制": {
    "zh": "L2 / 推演机制",
    "en": "L2 / TRACE THE MECHANISM"
  },
  "Reason": {
    "zh": "Reason",
    "en": "Reason"
  },
  "两个线程各加一次，为什么少了一次？": {
    "zh": "两个线程各加一次，为什么少了一次？",
    "en": "Why can two increments lose an update?"
  },
  "列出读、改、写的交错，证明你的判断。": {
    "zh": "列出读、改、写的交错，证明你的判断。",
    "en": "Show an interleaving of reads, calculations, and writes."
  },
  "L3 / 挑战边界": {
    "zh": "L3 / 挑战边界",
    "en": "L3 / TEST THE BOUNDARY"
  },
  "Stress-test": {
    "zh": "Stress-test",
    "en": "Stress-test"
  },
  "换成原子计数器，库存就安全了吗？": {
    "zh": "换成原子计数器，库存就安全了吗？",
    "en": "Does an atomic counter make the stock check safe?"
  },
  "给出反例，再解释修复为什么有效。": {
    "zh": "给出反例，再解释修复为什么有效。",
    "en": "Give a counterexample, then explain why your fix works."
  },
  "适合谁：准备面试的学生 / 用 AI 写代码的人 / 带新人的 reviewer": {
    "zh": "适合谁：准备面试的学生 / 用 AI 写代码的人 / 带新人的评审者",
    "en": "For students preparing for interviews, people coding with AI, and reviewers mentoring new developers."
  },
  "DEMO PREVIEW · NO API KEY NEEDED": {
    "zh": "DEMO PREVIEW · NO API KEY NEEDED",
    "en": "DEMO PREVIEW · NO API KEY NEEDED"
  },
  "Explain. Reflect. Try again.": {
    "zh": "Explain. Reflect. Try again.",
    "en": "Explain. Reflect. Try again."
  },
  "Simulated example — no live AI call. Nothing here changes your practice records.": {
    "zh": "Simulated example — no live AI call. Nothing here changes your practice records.",
    "en": "Simulated example — no live AI call. Nothing here changes your practice records."
  },
  "L1 Explain →": {
    "zh": "L1 Explain →",
    "en": "L1 Explain →"
  },
  "L2 Reason": {
    "zh": "L2 Reason",
    "en": "L2 Reason"
  },
  "→ L3 Stress-test": {
    "zh": "→ L3 Stress-test",
    "en": "→ L3 Stress-test"
  },
  "Why can two increments lose an update?": {
    "zh": "Why can two increments lose an update?",
    "en": "Why can two increments lose an update?"
  },
  "In Java, two threads increment the same volatile integer. How can one update be lost?": {
    "zh": "In Java, two threads increment the same volatile integer. How can one update be lost?",
    "en": "In Java, two threads increment the same volatile integer. How can one update be lost?"
  },
  "Example first explanation": {
    "zh": "Example first explanation",
    "en": "Example first explanation"
  },
  "“Volatile makes i++ thread-safe because every thread sees the latest value.”": {
    "zh": "“Volatile makes i++ thread-safe because every thread sees the latest value.”",
    "en": "“Volatile makes i++ thread-safe because every thread sees the latest value.”"
  },
  "Show simulated feedback": {
    "zh": "Show simulated feedback",
    "en": "Show simulated feedback"
  },
  "Simulated example — no live AI call": {
    "zh": "Simulated example — no live AI call",
    "en": "Simulated example — no live AI call"
  },
  "Reasoning gap:": {
    "zh": "Reasoning gap:",
    "en": "Reasoning gap:"
  },
  "Visibility does not make a read-modify-write operation atomic.": {
    "zh": "Visibility does not make a read-modify-write operation atomic.",
    "en": "Visibility does not make a read-modify-write operation atomic."
  },
  "One follow-up:": {
    "zh": "One follow-up:",
    "en": "One follow-up:"
  },
  "If both threads read 5 before either writes back, what could happen?": {
    "zh": "If both threads read 5 before either writes back, what could happen?",
    "en": "If both threads read 5 before either writes back, what could happen?"
  },
  "Retry in your own words": {
    "zh": "Retry in your own words",
    "en": "Retry in your own words"
  },
  "Explain the steps and what you would change.": {
    "zh": "Explain the steps and what you would change.",
    "en": "Explain the steps and what you would change."
  },
  "Use a sample retry": {
    "zh": "Use a sample retry",
    "en": "Use a sample retry"
  },
  "After:": {
    "zh": "After:",
    "en": "After:"
  },
  "Your retry will appear here.": {
    "zh": "Your retry will appear here.",
    "en": "Your retry will appear here."
  },
  "This retry is not automatically evaluated. Choose a self-rating for this demo:": {
    "zh": "This retry is not automatically evaluated. Choose a self-rating for this demo:",
    "en": "This retry is not automatically evaluated. Choose a self-rating for this demo:"
  },
  "Pass": {
    "zh": "Pass",
    "en": "Pass"
  },
  "Review": {
    "zh": "Review",
    "en": "Review"
  },
  "Not rated.": {
    "zh": "Not rated.",
    "en": "Not rated."
  },
  "A review item will appear here only if you choose Review.": {
    "zh": "A review item will appear here only if you choose Review.",
    "en": "A review item will appear here only if you choose Review."
  },
  "Restart example": {
    "zh": "Restart example",
    "en": "Restart example"
  },
  "Exit demo": {
    "zh": "Exit demo",
    "en": "Exit demo"
  },
  "PRACTICE / 用自己的话解释": {
    "zh": "PRACTICE / 用自己的话解释",
    "en": "PRACTICE / IN YOUR OWN WORDS"
  },
  "先回答，再对照。": {
    "zh": "先回答，再对照。",
    "en": "Explain first. Then reflect."
  },
  "3 道题 · 先写解释，再看参考要点 · 自评由你决定": {
    "zh": "3 道题 · 先写解释，再看参考要点 · 自评由你决定",
    "en": "3 questions · Explain before seeing the checklist · You decide your self-rating"
  },
  "正在加载题库…": {
    "zh": "正在加载题库…",
    "en": "Loading questions…"
  },
  "重试加载": {
    "zh": "重试加载",
    "en": "Retry loading"
  },
  "分类": {
    "zh": "分类",
    "en": "Category"
  },
  "全部分类": {
    "zh": "全部分类",
    "en": "All categories"
  },
  "题目": {
    "zh": "题目",
    "en": "Question"
  },
  "随机选题": {
    "zh": "随机选题",
    "en": "Random question"
  },
  "选择题目层级": {
    "zh": "选择题目层级",
    "en": "Choose a question level"
  },
  "我的解释": {
    "zh": "我的解释",
    "en": "My explanation"
  },
  "先写下你的理解，不必一次就完整。": {
    "zh": "先写下你的理解，不必一次就完整。",
    "en": "Start with your understanding. It does not have to be complete."
  },
  "回答仅留在本页内存中，刷新会清空；自评单独保存于本浏览器。": {
    "zh": "回答仅留在本页内存中，刷新会清空；自评单独保存于本浏览器。",
    "en": "Answers stay in this tab and clear on reload. Self-ratings are saved separately in this browser."
  },
  "0 / 8000": {
    "zh": "0 / 8000",
    "en": "0 / 8000"
  },
  "提交解释，查看参考要点": {
    "zh": "提交解释，查看参考要点",
    "en": "Submit explanation & see checklist"
  },
  "对照参考要点 / Self-check": {
    "zh": "对照参考要点 / Self-check",
    "en": "Compare with the checklist"
  },
  "Retry · 再解释一次": {
    "zh": "Retry · 再解释一次",
    "en": "Retry · Explain again"
  },
  "对照参考要点，再用自己的话解释一次。": {
    "zh": "对照参考要点，再用自己的话解释一次。",
    "en": "Use the checklist, then explain again in your own words."
  },
  "Before · 首次解释": {
    "zh": "Before · 首次解释",
    "en": "Before · First explanation"
  },
  "After · 我的修正": {
    "zh": "After · 我的修正",
    "en": "After · My revision"
  },
  "哪里需要补充？重新用自己的话解释。": {
    "zh": "哪里需要补充？重新用自己的话解释。",
    "en": "What is missing? Explain it again in your own words."
  },
  "修正文本仅留在本页内存中。填写不会自动改动自评。": {
    "zh": "修正文本仅留在本页内存中。填写不会自动改动自评。",
    "en": "Your revision stays in this tab. Editing it does not change your self-rating."
  },
  "请自行判断当前这一层；参考要点不是自动评分。": {
    "zh": "请自行判断当前这一层；参考要点不是自动评分。",
    "en": "Choose your self-rating for this level. The checklist does not grade you."
  },
  "Pass · 自评通过": {
    "zh": "Pass · 自评通过",
    "en": "Pass · I can explain it"
  },
  "Review · 需要复习": {
    "zh": "Review · 需要复习",
    "en": "Review · Needs practice"
  },
  "CRASH SHEET / 下一次复习": {
    "zh": "CRASH SHEET / 下一次复习",
    "en": "CRASH SHEET / NEXT TIME"
  },
  "把还没讲清的，带到下一次。": {
    "zh": "把还没讲清的，带到下一次。",
    "en": "Take unfinished explanations into your next session."
  },
  "导出复习单 .md": {
    "zh": "导出复习单 .md",
    "en": "Export crash sheet .md"
  },
  "Unscripted · 脱稿": {
    "zh": "Unscripted · 脱稿",
    "en": "Unscripted · 脱稿"
  },
  "回答不上传": {
    "zh": "回答不上传",
    "en": "Your answers are not uploaded."
  },
  "请启用 JavaScript 以加载题库和开始练习。": {
    "zh": "请启用 JavaScript 以加载题库和开始练习。",
    "en": "Enable JavaScript to load questions and start practicing."
  },
  "自评通过": {
    "zh": "自评通过",
    "en": "Pass"
  },
  "需要复习": {
    "zh": "需要复习",
    "en": "Review"
  },
  "未评价": {
    "zh": "未评价",
    "en": "Not rated"
  },
  "该层最后一次自评：{status}。编辑答案不会自动改变自评。": {
    "zh": "该层最后一次自评：{status}。编辑答案不会自动改变自评。",
    "en": "Last self-rating for this level: {status}. Editing your answer does not change it."
  },
  "当前 {count} 个题目层级需要复习（全分类）": {
    "zh": "当前 {count} 个题目层级需要复习（全分类）",
    "en": "{count} levels to review across all categories."
  },
  "当前没有待复习条目。完成解释后，可自行标记 Review。": {
    "zh": "当前没有待复习条目。完成解释后，可自行标记 Review。",
    "en": "No review items yet. After explaining, choose Review for a level you want to revisit."
  },
  "已生成 Markdown 复习单，请在浏览器下载列表中查看。": {
    "zh": "已生成 Markdown 复习单，请在浏览器下载列表中查看。",
    "en": "Markdown crash sheet generated. Check your browser downloads."
  },
  "修改后请重新提交，再进行自评。": {
    "zh": "修改后请重新提交，再进行自评。",
    "en": "Submit your edited explanation again before self-rating."
  },
  "请先写下 1–8000 个字符的解释（不能只有空白）。": {
    "zh": "请先写下 1–8000 个字符的解释（不能只有空白）。",
    "en": "Write an explanation of 1–8000 characters, not just whitespace."
  },
  "已提交。对照要点后，请选择自己的评价。": {
    "zh": "已提交。对照要点后，请选择自己的评价。",
    "en": "Submitted. Compare with the checklist, then choose your self-rating."
  },
  "已加载 {count} 道题 · 无需 API Key": {
    "zh": "已加载 {count} 道题 · 无需 API Key",
    "en": "{count} questions loaded · No API key needed"
  },
  "题库加载失败，请确认通过 HTTP 打开且题库文件有效，再重试。": {
    "zh": "题库加载失败，请确认通过 HTTP 打开且题库文件有效，再重试。",
    "en": "Questions could not load. Check your connection and try again."
  },
  "本地记录不可读、已损坏或版本不兼容。原记录未覆盖；本次仅在内存中练习，刷新会丢失新自评。": {
    "zh": "本地记录不可读、已损坏或版本不兼容。原记录未覆盖；本次仅在内存中练习，刷新会丢失新自评。",
    "en": "Saved progress is unavailable or incompatible. It has not been overwritten. New self-ratings stay in memory and will be lost on reload."
  },
  "本地保存失败。本次自评仅在内存中有效，请先导出复习单；刷新会丢失本次更改。": {
    "zh": "本地保存失败。本次自评仅在内存中有效，请先导出复习单；刷新会丢失本次更改。",
    "en": "Saving failed. New self-ratings stay in memory. Export your crash sheet before reloading."
  },
  "当前复习单": {
    "zh": "当前复习单",
    "en": "Current crash sheet"
  },
  "仅包含当前最后一次自评为 review 的题目层级；不是历史错误次数或能力评分。": {
    "zh": "仅包含当前最后一次自评为 review 的题目层级；不是历史错误次数或能力评分。",
    "en": "Only levels whose latest self-rating is review are included. This is not a history of errors or a skill score."
  },
  "当前没有需要复习的条目。": {
    "zh": "当前没有需要复习的条目。",
    "en": "There are no current review items."
  },
  "再次解释时检查：": {
    "zh": "再次解释时检查：",
    "en": "Check these points when explaining again:"
  },
  "用参考要点自行检查解释。": {
    "zh": "用参考要点自行检查解释。",
    "en": "Use the checklist to review your explanation."
  },
  "先把一层标记为 Review": {
    "zh": "先把一层标记为 Review",
    "en": "Mark a level as Review first."
  },
  "Both threads can read 5, calculate 6, and write 6. The increment is several steps, so visibility alone cannot prevent the lost update. I would use an atomic increment or protect the whole operation with the same lock.": {
    "zh": "Both threads can read 5, calculate 6, and write 6. The increment is several steps, so visibility alone cannot prevent the lost update. I would use an atomic increment or protect the whole operation with the same lock.",
    "en": "Both threads can read 5, calculate 6, and write 6. The increment is several steps, so visibility alone cannot prevent the lost update. I would use an atomic increment or protect the whole operation with the same lock."
  },
  "Demo self-rating: {status}. Not saved to practice records.": {
    "zh": "Demo self-rating: {status}. Not saved to practice records.",
    "en": "Demo self-rating: {status}. Not saved to practice records."
  },
  "Demo Crash Sheet: L2 — explain the read-modify-write steps and a lost-update interleaving. Simulated guidance, not a live diagnosis.": {
    "zh": "Demo Crash Sheet: L2 — explain the read-modify-write steps and a lost-update interleaving. Simulated guidance, not a live diagnosis.",
    "en": "Demo Crash Sheet: L2 — explain the read-modify-write steps and a lost-update interleaving. Simulated guidance, not a live diagnosis."
  },
  "Demo Crash Sheet: no current review items. This is not proof of mastery.": {
    "zh": "Demo Crash Sheet: no current review items. This is not proof of mastery.",
    "en": "Demo Crash Sheet: no current review items. This is not proof of mastery."
  },
  "AI 生成代码示例 · Java": {
    "zh": "AI 生成代码示例 · Java",
    "en": "AI-generated example · Java"
  },
  "前提：两个线程共享同一个 Counter，各执行一次 increment()。": {
    "zh": "前提：两个线程共享同一个 Counter，各执行一次 increment()。",
    "en": "Assume two threads share one Counter and each call increment() once."
  },
  "“volatile 让每个线程看到最新的值，所以 i++ 是线程安全的。”": {
    "zh": "“volatile 让每个线程看到最新的值，所以 i++ 是线程安全的。”",
    "en": "“Volatile makes i++ thread-safe because every thread sees the latest value.”"
  },
  "L2 待补充": {
    "zh": "L2 待补充",
    "en": "L2 Needs work"
  },
  "L3 未尝试": {
    "zh": "L3 未尝试",
    "en": "L3 Not tried"
  },
  "如果两个线程都先读到了 5，再各自写回，会怎样？": {
    "zh": "如果两个线程都先读到了 5，再各自写回，会怎样？",
    "en": "If both threads read 5 before either writes back, what could happen?"
  },
  "展开推演，检查你的解释": {
    "zh": "展开推演，检查你的解释",
    "en": "Trace the steps. Check your explanation."
  },
  "两个线程都可能读到 5、计算 6、写回 6。可见性不会让整个读—改—写变成原子操作；可以使用原子增量，或用同一把锁保护整个操作。": {
    "zh": "两个线程都可能读到 5、计算 6、写回 6。可见性不会让整个读—改—写变成原子操作；可以使用原子增量，或用同一把锁保护整个操作。",
    "en": "Both threads can read 5, calculate 6, and write 6. Visibility does not make read-modify-write atomic. Use an atomic increment or protect the entire operation with the same lock."
  },
  "讲清了": {
    "zh": "讲清了",
    "en": "Clear"
  },
  "还差一点": {
    "zh": "还差一点",
    "en": "Almost"
  },
  "漏掉了": {
    "zh": "漏掉了",
    "en": "Missed"
  },
  "未作答": {
    "zh": "未作答",
    "en": "Not answered"
  },
  "解释练习 · 无需 API Key": {
    "zh": "解释练习 · 无需 API Key",
    "en": "Explanation practice · No API key"
  },
  "AI 写完了，": {
    "zh": "AI 写完了，",
    "en": "AI wrote it."
  },
  "你讲得清吗？": {
    "zh": "你讲得清吗？",
    "en": "Can you explain it?"
  },
  "重播示例": {
    "zh": "重播示例",
    "en": "Replay example"
  },
  "模拟示例 · Simulated": {
    "zh": "模拟示例",
    "en": "Simulated example"
  },
  "volatile 的写对后续读可见。": {
    "zh": "volatile 的写对后续读可见。",
    "en": "A volatile write is visible to later reads."
  },
  "i++ 是读、算、写三步。": {
    "zh": "i++ 是读、算、写三步。",
    "en": "i++ is a read, a calculation, and a write."
  },
  "两个线程可能读到同一个 5，交错后丢失一次更新。": {
    "zh": "两个线程可能读到同一个 5，交错后丢失一次更新。",
    "en": "Both threads can read the same 5 and lose one update."
  },
  "追问：如果两个线程都先读到了 5？": {
    "zh": "追问：如果两个线程都先读到了 5？",
    "en": "Follow-up: what if both threads read 5 first?"
  },
  "练习框架": {
    "zh": "练习框架",
    "en": "Practice framework"
  },
  "练习": {
    "zh": "练习",
    "en": "Practice"
  },
  "3 道题 · 先写解释，再看参考要点 · 自己点灯判定": {
    "zh": "3 道题 · 先写解释，再看参考要点 · 自己点灯判定",
    "en": "3 questions · Explain before the checklist · You set the lights"
  },
  "本层灯色": {
    "zh": "本层灯色",
    "en": "Level light"
  },
  "参考要点": {
    "zh": "参考要点",
    "en": "Checklist"
  },
  "点一下灯，自己判断这一条：讲清了、还差一点、漏掉了。": {
    "zh": "点一下灯，自己判断这一条：讲清了、还差一点、漏掉了。",
    "en": "Click a lamp to judge each point: clear, almost, or missed."
  },
  "有一条外部建议，还没有生效。": {
    "zh": "有一条外部建议，还没有生效。",
    "en": "An external suggestion is waiting. It is not applied."
  },
  "采用建议": {
    "zh": "采用建议",
    "en": "Use suggestion"
  },
  "确认判定": {
    "zh": "确认判定",
    "en": "Confirm rating"
  },
  "只有全绿才是 Pass；琥珀和红都会进入复习单。": {
    "zh": "只有全绿才是 Pass；琥珀和红都会进入复习单。",
    "en": "Only all-green is a Pass. Almost and missed go to the review list."
  },
  "练习记录": {
    "zh": "练习记录",
    "en": "Practice log"
  },
  "灯亮在哪里。": {
    "zh": "灯亮在哪里。",
    "en": "Where the lights landed."
  },
  "每次判定留一盏灯：绿是讲清了，琥珀是还差一点，红是漏掉了。": {
    "zh": "每次判定留一盏灯：绿是讲清了，琥珀是还差一点，红是漏掉了。",
    "en": "Every rating leaves a light: green is clear, amber is almost, red is missed."
  },
  "热力矩阵": {
    "zh": "热力矩阵",
    "en": "Heat matrix"
  },
  "每个格子是最近一次判定": {
    "zh": "每个格子是最近一次判定",
    "en": "Each cell is the latest rating"
  },
  "题目与层级的最近灯色": {
    "zh": "题目与层级的最近灯色",
    "en": "Latest light per question and level"
  },
  "作答时间线": {
    "zh": "作答时间线",
    "en": "Rating timeline"
  },
  "还没有判定。提交一次解释并点灯确认，这里就会出现记录。": {
    "zh": "还没有判定。提交一次解释并点灯确认，这里就会出现记录。",
    "en": "No ratings yet. Submit an explanation, set the lights, and confirm."
  },
  "在本机保存我的回答，用于前后对比": {
    "zh": "在本机保存我的回答，用于前后对比",
    "en": "Keep my answers on this device for comparison"
  },
  "默认关闭。关闭时会删除已保存的回答，判定记录不受影响。": {
    "zh": "默认关闭。关闭时会删除已保存的回答，判定记录不受影响。",
    "en": "Off by default. Turning it off deletes saved answers; ratings stay."
  },
  "清空记录": {
    "zh": "清空记录",
    "en": "Clear records"
  },
  "取消": {
    "zh": "取消",
    "en": "Cancel"
  },
  "清空所有练习记录？": {
    "zh": "清空所有练习记录？",
    "en": "Clear all practice records?"
  },
  "热力矩阵、时间线和已保存的回答都会被删除，无法恢复。": {
    "zh": "热力矩阵、时间线和已保存的回答都会被删除，无法恢复。",
    "en": "The heat matrix, timeline, and saved answers will be deleted. This cannot be undone."
  },
  "已提交。对照要点，点灯判断每一条。": {
    "zh": "已提交。对照要点，点灯判断每一条。",
    "en": "Submitted. Compare with the checklist and set a light for each point."
  },
  "该层最近一次判定：{light}。": {
    "zh": "该层最近一次判定：{light}。",
    "en": "Latest rating for this level: {light}."
  },
  "已记录：{light}。": {
    "zh": "已记录：{light}。",
    "en": "Saved: {light}."
  },
  "灯变了，记得再点确认判定。": {
    "zh": "灯变了，记得再点确认判定。",
    "en": "Lights changed. Confirm the rating again."
  },
  "建议已采用，仍需你确认判定。": {
    "zh": "建议已采用，仍需你确认判定。",
    "en": "Suggestion applied. You still confirm the rating."
  },
  "绿 {green} / 琥珀 {amber} / 红 {red} / 未作答 {off}": {
    "zh": "绿 {green} / 琥珀 {amber} / 红 {red} / 未作答 {off}",
    "en": "Green {green} / Almost {amber} / Missed {red} / Untouched {off}"
  },
  "{count} 次判定": {
    "zh": "{count} 次判定",
    "en": "{count} ratings"
  },
  "同一题层的灯色变化": {
    "zh": "同一题层的灯色变化",
    "en": "Light history for this level"
  },
  "对比首次与最近一次回答": {
    "zh": "对比首次与最近一次回答",
    "en": "Compare the first and latest answers"
  },
  "首次": {
    "zh": "首次",
    "en": "First"
  },
  "最近一次": {
    "zh": "最近一次",
    "en": "Latest"
  },
  "已开启：之后的判定会保存回答原文，仅在本机。": {
    "zh": "已开启：之后的判定会保存回答原文，仅在本机。",
    "en": "On: future ratings also keep the answer text on this device."
  },
  "已关闭：已保存的回答原文已删除。": {
    "zh": "已关闭：已保存的回答原文已删除。",
    "en": "Off: saved answer text has been deleted."
  },
  "记录已清空。": {
    "zh": "记录已清空。",
    "en": "Records cleared."
  },
  "灯色": {
    "zh": "灯色",
    "en": "Light"
  },
  "漏掉的要点：": {
    "zh": "漏掉的要点：",
    "en": "Missed points:"
  }
,
  "解释练习": {
    "zh": "解释练习",
    "en": "Explanation practice"
  },
  "模拟示例 — 不调用真实 AI": {
    "zh": "模拟示例 — 不调用真实 AI",
    "en": "Simulated example — no live AI call"
  },
  "逐条判断这一层讲得怎么样。": {
    "zh": "逐条判断这一层讲得怎么样。",
    "en": "Judge how well this level was explained, point by point."
  },
  "点灯切换，也可按 1 / 2 / 3": {
    "zh": "点灯切换，也可按 1 / 2 / 3",
    "en": "Click a lamp to switch; 1 / 2 / 3 also work."
  },
  "再解释一次": {
    "zh": "再解释一次",
    "en": "Explain again"
  },
  "首次解释": {
    "zh": "首次解释",
    "en": "First explanation"
  },
  "修改后": {
    "zh": "修改后",
    "en": "Revised explanation"
  },
  "只有全绿才算讲清；琥珀和红会进复习单。": {
    "zh": "只有全绿才算讲清；琥珀和红会进复习单。",
    "en": "Only all-green counts as clear; almost and missed go to the review list."
  },
  "先完成一次判定，才能导出复习单": {
    "zh": "先完成一次判定，才能导出复习单",
    "en": "Complete one rating before exporting the crash sheet."
  },
  "默认关闭。只保存开启之后的回答，之前的判定没有原文；关闭时会删除已存回答。": {
    "zh": "默认关闭。只保存开启之后的回答，之前的判定没有原文；关闭时会删除已存回答。",
    "en": "Off by default. Only answers saved while it is on are kept; earlier ratings have no text. Turning it off deletes saved answers."
  },
  "热力矩阵、时间线和已保存的回答都会被删除，清空后无法恢复。": {
    "zh": "热力矩阵、时间线和已保存的回答都会被删除，清空后无法恢复。",
    "en": "The heat matrix, timeline, and saved answers will be deleted. This cannot be undone."
  },
  "先导出复习单": {
    "zh": "先导出复习单",
    "en": "Export crash sheet first"
  },
  "已加载 {count} 道题": {
    "zh": "已加载 {count} 道题",
    "en": "{count} questions loaded"
  },
  "第 {n} 条：当前{current}，点击切换为{next}": {
    "zh": "第 {n} 条：当前{current}，点击切换为{next}",
    "en": "Point {n}: currently {current}. Activate to switch to {next}."
  },
  "第 {n} 条已设为{light}": {
    "zh": "第 {n} 条已设为{light}",
    "en": "Point {n} set to {light}."
  },
  "仅包含当前最后一次判定为「需要复习」的题目层级；不是历史错误次数或能力评分。": {
    "zh": "仅包含当前最后一次判定为「需要复习」的题目层级；不是历史错误次数或能力评分。",
    "en": "Only levels whose latest rating is Review are included. This is not a history of errors or a skill score."
  }
,
  "热力图密度": {
    "zh": "热力图密度",
    "en": "Heat map density"
  },
  "展开": {
    "zh": "展开",
    "en": "Expanded"
  },
  "Mini 版": {
    "zh": "Mini 版",
    "en": "Mini"
  },
  "绿灯": {
    "zh": "绿灯",
    "en": "Green"
  },
  "琥珀灯": {
    "zh": "琥珀灯",
    "en": "Amber"
  },
  "红灯": {
    "zh": "红灯",
    "en": "Red"
  },
  "没有判定历史": {
    "zh": "没有判定历史",
    "en": "No rating history"
  },
  "最近 {count} 次：{history}": {
    "zh": "最近 {count} 次：{history}",
    "en": "Last {count} ratings: {history}"
  }
,
  "AI 生成 · 库存服务": {
    "zh": "AI 生成 · 库存服务",
    "en": "AI-generated · Inventory service"
  },
  "两个请求同时下单，库存只剩 1，会发生什么？": {
    "zh": "两个请求同时下单，库存只剩 1，会发生什么？",
    "en": "Two requests place orders at the same time; stock is 1. What happens?"
  },
  "GET 和 SET 是两次独立操作。": {
    "zh": "GET 和 SET 是两次独立操作。",
    "en": "GET and SET are two separate operations."
  },
  "两个请求可能都读到 1，导致超卖。": {
    "zh": "两个请求可能都读到 1，导致超卖。",
    "en": "Both requests can read 1, overselling the item."
  },
  "修复用 DECR 并检查结果，或用 Lua 脚本。": {
    "zh": "修复用 DECR 并检查结果，或用 Lua 脚本。",
    "en": "Fix it with DECR and check the result, or use a Lua script."
  },
  "你的回答": {
    "zh": "你的回答",
    "en": "Your answer"
  },
  "选一个回答，看看预设判定": {
    "zh": "选一个回答，看看预设判定",
    "en": "Pick an answer to see the preset judgment"
  },
  "预设判定，未调用 AI": {
    "zh": "预设判定，未调用 AI",
    "en": "Preset judgment, no AI call"
  },
  "讲清了，试试 L3？": {
    "zh": "讲清了，试试 L3？",
    "en": "Clear. Try L3?"
  },
  "追问：{question}": {
    "zh": "追问：{question}",
    "en": "Follow-up: {question}"
  },
  "预设判定：{green} 条讲清了，{amber} 条还差一点，{red} 条漏掉了。": {
    "zh": "预设判定：{green} 条讲清了，{amber} 条还差一点，{red} 条漏掉了。",
    "en": "Preset judgment: {green} clear, {amber} almost, {red} missed."
  },
  "代码能跑，不代表你讲得出它为什么能跑。": {
    "zh": "代码能跑，不代表你讲得出它为什么能跑。",
    "en": "Code that runs isn't code you can explain."
  },
  "示例判定暂不可用": {
    "zh": "示例判定暂不可用",
    "en": "The preset judgment is unavailable."
  }
,
  "判定结果": {
    "zh": "判定结果",
    "en": "Result"
  },
  "去练习区试试真题 →": {
    "zh": "去练习区试试真题 →",
    "en": "Try a real question in Practice →"
  }
,
"判定模式": {"zh": "判定模式", "en": "Judging mode"},
"评委演示": {"zh": "评委演示", "en": "Judge Demo"},
"在线 AI 判定": {"zh": "在线 AI 判定", "en": "Live AI"},
"模拟判定 · 非真实 AI": {"zh": "模拟判定 · 非真实 AI", "en": "SIMULATED RESULT"},
"使用内置英文示例。你的回答会保留，模拟结果不会保存。": {"zh": "使用内置英文示例。你的回答会保留，模拟结果不会保存。", "en": "This demo uses a preset English answer. Your own answer is preserved. Demo ratings stay in this preview."},
"运行模拟判定": {"zh": "运行模拟判定", "en": "Judge the sample answer"},
"待审校评分标准 · 建议供参考": {"zh": "待审校评分标准 · 建议供参考", "en": "Rubric awaiting human review · experimental guidance"},
"已审校评分标准": {"zh": "已审校评分标准", "en": "Human-reviewed rubric"},
"确认模拟灯号": {"zh": "确认模拟灯号", "en": "Confirm demo lamps"},
"模拟灯号已确认，仅在本页预览。": {"zh": "模拟灯号已确认，仅在本页预览。", "en": "Demo lamps confirmed for this preview only."},
"在线 AI 已选择": {"zh": "在线 AI 已选择", "en": "Live AI selected"},
"原文引用仅证明出处，请自行核对技术判断。": {"zh": "原文引用仅证明出处，请自行核对技术判断。", "en": "A matching quote identifies the source. Check the technical judgment yourself."}
};
export const LANGUAGE_KEY = 'unscripted.language';
let language = 'zh';
export function resolveLanguage(search = '', saved = null, browserLanguage = 'en') {
  const query = new URLSearchParams(search).get('lang');
  if (query === 'zh' || query === 'en') return query;
  if (saved === 'zh' || saved === 'en') return saved;
  return /^zh(?:-|$)/i.test(browserLanguage) ? 'zh' : 'en';
}
export function getLanguage() { return language; }
export function setLanguage(value, getStorage = () => globalThis.localStorage) {
  if (!['zh', 'en'].includes(value)) return false;
  language = value;
  try { getStorage()?.setItem(LANGUAGE_KEY, value); } catch { /* memory-only preference */ }
  return true;
}
export function initLanguage(search, browserLanguage, getStorage = () => globalThis.localStorage) {
  let saved = null;
  try { saved = getStorage()?.getItem(LANGUAGE_KEY); } catch { /* storage can be blocked */ }
  language = resolveLanguage(search, saved, browserLanguage);
  return language;
}
export function t(key, params = {}, lang = language) {
  return (messages[key]?.[lang] ?? key).replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}
export function questionImpact(questionId, lang = language) {
  return messages['impact.' + questionId]?.[lang] ?? '';
}
export function localized(item, field, lang = language) { return item[lang === 'en' ? field + '_en' : field]; }
export function applyLanguage(root = document) {
  root.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  for (const attr of ['placeholder', 'aria-label']) root.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`))));
  root.querySelectorAll('[data-lang]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.lang === language)));
}
