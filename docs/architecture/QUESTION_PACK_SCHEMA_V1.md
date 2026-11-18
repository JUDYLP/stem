# Question Pack JSON Schema v1

状态：Stage 1审核候选，审批前不接入产品。理念：**Swap the knowledge. Keep the challenge.**

权威机器文件：[question-pack.schema.v1.json](question-pack.schema.v1.json)。完整双语示例：[question-pack.example.v1.json](question-pack.example.v1.json)，含原有3题9层和逐项Rubric，非省略示意。示例仅在docs，不替换data/questions.json。

## 字段契约

采用JSON Schema Draft 2020-12。层顺序用prefixItems + const + minItems/maxItems=3 + items=false。参考[官方数组规范说明](https://json-schema.org/understanding-json-schema/reference/array)和[核心规范](https://json-schema.org/draft/2020-12/json-schema-core)。Schema中的$ref全部为本地$defs；导入数据不允许自带Schema或远程引用。

| 对象 | 必填字段及语义 |
|---|---|
| Pack | schemaVersion=整数1；packId稳定ID；packVersion为严格三段非负整数版本如1.0.0；title/description为语言映射；defaultLanguage；supportedLanguages；questions |
| Question | id；category/title语言映射；review对象；layers |
| Layer | id固定L1/L2/L3；label固定Explain/Reason/Stress-test；prompt语言映射；rubric对象数组 |
| Rubric | rubricId稳定ID；criterion语言映射，描述一个可观察、可举证的标准，不能仅写“理解了” |
| review | status=unreviewed或reviewed；reviewed必须附reviewer及reviewedAt UTC时间；unreviewed不得填这两字段 |

label是稳定层级语义标识，不是任意领域标签；引擎UI可本地化显示，但不能修改这三个含义。category不参与身份，可自由命名并翻译。无HTML、JS、正则评分器、权重、工具定义、Provider地址、Key字段；Schema不开放自定义层级。

语言映射如`{"zh-CN":"概念","en":"Concept"}`，不是`title_en`后缀。v1使用BCP47的受限常用子集：2–3位小写语言，可带TitleCase四字母脚本、两位大写地区或三位数字地区；例en、zh-CN、zh-Hant、ja。未来可增加语言，不需改变字段结构；不承诺当前UI已支持其他语言。

## 唯一性与版本

- packId在本浏览器注册表的逻辑题库中唯一，不是全球可信注册。内置保留`unscripted-`前缀，导入新Pack不得冒用；已有内置更新只能来自应用维护者发布。
- Question id只在一个Pack内唯一；不同Pack允许同名。`packId::questionId::layerId`是统一逻辑记录键，ID只允许小写字母/数字和内部单连字符，禁止分隔符`::`。
- rubricId在整个Pack内唯一，不仅在一层内；不同Pack可复用。建议`question-id-l1-c01`，但命名不代替重复检测。初次转换按位置赋ID，之后重排保留ID，含义改变创建新ID，不能按新位置重编号。
- `schemaVersion`代表结构协议；`packVersion`代表题库内容。支持1.0.0三段版本，暂不接受v前缀/预发布/构建后缀；版本按整数三元组比较，不能字符串排序。
- 同packId同packVersion的规范化JSON内容必须不可变。相同内容重导为幂等，内容不同拒绝；新版本并存、显式激活。不同题库重复ID不能仅靠单个JSON的Schema检查。

## 强制语义校验：Schema通过还不等于可导入

JSON Schema的uniqueItems不能检查对象某个属性的唯一值，也无法在此通用Schema中动态要求每个翻译对象等于supportedLanguages。后续导入器必须在结构校验后完成：

1. Question ID集合无重复；所有层rubricId组成一个Pack级集合，无重复。
2. defaultLanguage属于supportedLanguages；每个语言映射键集合**恰好等于**supportedLanguages，值trim后非空（包括Unicode空白）。未声明翻译也拒绝，防止拼写错误被忽略。
3. reviewedAt是有效UTC日历时间，而不只是符合时间字符串正则；review只是作者声明，预览显示“作者声称已审校”，不当作平台认证。无审校明确写unreviewed，不能省略并默认reviewed。
4. 注册表ID/版本/内置保留命名冲突检查；只有显式确认才激活。
5. 入口限制文件UTF-8字节数≤1,048,576、JSON嵌套≤32；拒绝非有限数、重复对象成员名和畸形编码；最终字段按Schema白名单构造对象，不深合并用户对象。

**完整接受条件＝入口检查＋Schema＋语义＋注册冲突检查。** 文档示例的语义检查并不是产品已实现的校验器。

## 翻译缺失、未知字段与容量

- 声称支持的语言缺任何一个title/category/prompt/criterion翻译：整包拒绝，错误指出JSON路径。作者应补齐或从supportedLanguages及所有映射中统一移除该语言；不在导入时静默删字段。
- 用户UI语言不在Pack支持集合：整包内容统一回退defaultLanguage并提示，不逐条混用不同语言；UI继续自己的语言。当前UI zh映射请求zh-CN，en映射en；将来新UI语言明确映射后使用相同规则。
- 所有固定对象additionalProperties=false；未知字段报错，不静默接受/剥离。内容字符串里的HTML等符号不是字段，允许作为纯文本题目材料。
- 无效包不部分导入、不修改注册表、不切换当前练习。预览只有全包校验通过才可确认导入。
- 1–200题，每题恰好3层，每层1–12条Rubric，每包1–8种语言。现有2–4条是旧加载器限制，新Schema扩为1–12的通用限制；切换运行时前须同步测试，不能声称旧加载器现在可读新格式。
- 单语言文本上限：Pack标题160/说明2000；题目标题240/分类80；prompt12000；criterion2000。长度按Unicode码点；ID64、rubricId96。总字节限制独立优先，不能用字符数替代。
- 建议注册表最多10个导入Pack、每Pack3个版本、导入原始内容累计≤5 MiB；这不是localStorage可用容量保证。QuotaExceededError必须保留现有注册表并退回未导入状态；用户自行卸载后重试。卸载内容不自动删除对应历史/进度。

## 纯数据与安全渲染

只接受JSON.parse/合规JSON解码后的数据，绝不eval、Function、import(blob)、执行script或注册用户模板。JSON文本中的`<script>`/`<img onerror>`/`javascript:`作为普通字符串展示，全部走textContent；不写innerHTML、href/src/style或事件属性，不自动识别成链接，不执行代码块。Markdown导出延续现有转义，防止用户内容变成HTML/链接。限制大小/深度/数量，错误消息也按文本渲染。

禁止原型污染：拒绝未知键、保留constructor/prototype等标识；映射/索引用Map或无原型对象，采用明确字段拷贝。禁止把Pack的review、rubric或prompt当系统级指令；未来发送模型时作为有边界的数据，Provider权限/端点不由题库决定。Schema只能约束结构，不能证明内容正确或消除模型提示注入。

## 当前三题如何转换

建议首次内置Pack为`unscripted-core@1.0.0`，保留三道题现有ID以及每层内容；这样与旧数组一一对应，进度映射最少。示例已完整实现这种数据形状，但尚未投入产品。

| 旧题ID | 默认目标 | 若将来按领域拆包（备选，非自动执行） |
|---|---|---|
| juc-volatile-atomicity-v2 | unscripted-core，同ID | unscripted-java，同ID |
| redis-expiration-v2 | unscripted-core，同ID | unscripted-redis，同ID |
| mysql-consistent-read-v2 | unscripted-core，同ID | unscripted-mysql，同ID |

转换规则：旧title/title_en→title.zh-CN/en；prompt同理；rubric与rubric_en按已验证相同长度逐项转为{rubricId,criterion}；category变语言映射；id/label保留；review=unreviewed。旧顶层language不进入新Question，提升为Pack语言声明。不根据题干自动识别领域。现有题库数组不被误当Pack导入；用户选择旧格式时显示明确的不兼容说明，后续提供受审查的离线转换器，不混写两个协议。

首次保留组合Pack优于立即拆为三个单题Pack；若人工决定拆分，显式映射每个旧questionId到唯一目标Pack，不把旧进度复制到所有含同名题的导入包。未知旧ID保留为未映射历史。

## Evaluation Contract v1（文档接口，尚未实现）

输入必需：contractVersion=1、requestId、packId、packVersion、contentDigest、questionId、layerId、answerRevision、language、prompt、rubric:[{rubricId,criterion}]、answer。只发送当前层/当前回答，不发送所有历史、用户身份或Key。prompt和rubric由经过验证的当前Pack解析取得，不由Provider重新生成标准。

输出必需：contractVersion、requestId、同一组上下文标识，以及：

| 字段 | 契约 |
|---|---|
| criterionResults | 每个输入rubricId恰好一次；对象{rubricId,result,comment}；result=met/partial/missing/uncertain |
| missing | 当前层未满足项的rubricId数组，唯一；对应criterionResults的partial/missing，不能用数组下标 |
| evidenceGaps | 最多3项{rubricId,quote,issue}，quote为本次answer的非空连续子串；无证据允许空数组，不得捏造 |
| redFlags | 最多3项{rubricId,reason}，只指向当前层标准，不引入题外评分标准 |
| followup | 一个非空字符串，最多500码点，只提一个聚焦追问 |
| suggestion | pass或review，仅建议；任何项非met不得输出pass，不自动写正式记录 |
| comment | 非空字符串，最多1000码点 |

输出comment/issue/reason每项≤1000、quote≤8000、criterionResults数量等于输入rubric数量，响应总UTF-8≤64 KiB，未知字段拒绝。所有引用/ID/上下文校验失败则不采纳，显示可理解的错误并保留手动流程；不静默拼接“部分通过”的诊断。正常json_object可解析不等于上述契约正确。

未来灯号建议映射met→green、partial/uncertain→amber、missing→red；按rubricId映射到当前顺序，仅作为可采纳建议，仍需人工确认。切Pack、版本、题层、语言或编辑回答时使旧requestId/answerRevision失效；响应即使晚到也不能污染新上下文。旧规划snake_case evidence_gaps/rubric_index是历史草案，无真实已部署AI集成，不做不存在的在线协议迁移。

Provider接口`evaluate(input,{signal,credential})`返回上述规范化输出，服务商原始字段不进入训练引擎；无API时不创建伪评价结果。Provider不能调用storage/history，不能替用户确认。具体厂商、额度及真实JSON验证留到独立获授权阶段。
