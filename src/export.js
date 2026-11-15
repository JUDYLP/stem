export function reviewItems(questions, progress) {
  return questions.flatMap(question => question.layers
    .filter(layer => progress.items[`${question.id}::${layer.id}`]?.status === 'review')
    .map(layer => ({ question, layer })));
}
const markdown = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_\[\]#]/g, '\\$&');
export function buildCrashSheet(questions, progress) {
  const items = reviewItems(questions, progress);
  const lines = ['# Unscripted · 当前复习单', '', '仅包含当前最后一次自评为 review 的题目层级；不是历史错误次数或能力评分。', '题目仍待参赛者人工审校。', ''];
  if (!items.length) lines.push('当前没有需要复习的条目。');
  for (const {question, layer} of items) {
    lines.push(`## ${markdown(question.category)} / ${layer.id} · ${markdown(question.title)}`, '', markdown(layer.prompt), '', '再次解释时检查：', ...layer.rubric.map(point => `- ${markdown(point)}`), '', '未经过 AI 诊断，可对照参考要点自查。', '');
  }
  return lines.join('\n') + '\n';
}

export function downloadCrashSheet(text) {
  const blob = new Blob([text], {type:'text/markdown;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'unscripted-crash-sheet.md';
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
