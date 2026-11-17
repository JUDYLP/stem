import { t, localized } from './i18n.js';
export function reviewItems(questions, progress) {
  return questions.flatMap(question => question.layers
    .filter(layer => progress.items[`${question.id}::${layer.id}`]?.status === 'review')
    .map(layer => ({ question, layer })));
}
const markdown = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_\[\]#]/g, '\\$&');
export function buildCrashSheet(questions, progress, lang = 'zh') {
  const items = reviewItems(questions, progress);
  const tr = key => t(key, {}, lang);
  const lines = ['# Unscripted · ' + tr('当前复习单'), '', tr('仅包含当前最后一次自评为 review 的题目层级；不是历史错误次数或能力评分。'), ''];
  if (!items.length) lines.push(tr('当前没有需要复习的条目。'));
  for (const {question, layer} of items) {
    lines.push(`## ${markdown(question.category)} / ${layer.id} · ${markdown(localized(question, 'title', lang))}`, '', markdown(localized(layer, 'prompt', lang)), '', tr('再次解释时检查：'), ...localized(layer, 'rubric', lang).map(point => `- ${markdown(point)}`), '', tr('用参考要点自行检查解释。'), '');
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
