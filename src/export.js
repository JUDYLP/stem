import { t, localized } from './i18n.js';
import { lightForStatus } from './lights.js';

const LIGHT_WORD = { green: '讲清了', amber: '还差一点', red: '漏掉了', off: '未作答' };

export function reviewItems(questions, progress) {
  return questions.flatMap(question => question.layers
    .filter(layer => progress.items[`${question.id}::${layer.id}`]?.status === 'review')
    .map(layer => ({ question, layer })));
}

const markdown = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_\[\]#]/g, '\\$&');

export function buildCrashSheet(questions, progress, lang = 'zh', entries = []) {
  const items = reviewItems(questions, progress);
  const tr = key => t(key, {}, lang);
  const latest = new Map();
  for (const entry of entries) latest.set(`${entry.questionId}::${entry.layer}`, entry);
  const lines = ['# Unscripted · ' + tr('当前复习单'), '', tr('仅包含当前最后一次判定为「需要复习」的题目层级；不是历史错误次数或能力评分。'), ''];
  if (!items.length) lines.push(tr('当前没有需要复习的条目。'));
  for (const { question, layer } of items) {
    const entry = latest.get(`${question.id}::${layer.id}`);
    const light = entry?.light || lightForStatus(progress.items[`${question.id}::${layer.id}`]?.status);
    lines.push(
      `## ${markdown(question.category)} / ${layer.id} · ${markdown(localized(question, 'title', lang))}`,
      '',
      `${tr('灯色')}：${tr(LIGHT_WORD[light])}`,
      '',
      markdown(localized(layer, 'prompt', lang)),
      '',
      tr('再次解释时检查：'),
      ...localized(layer, 'rubric', lang).map(point => `- ${markdown(point)}`),
      '',
    );
    const rubric = localized(layer, 'rubric', lang);
    const missed = (entry?.missedPoints || []).map(index => rubric[index]).filter(Boolean);
    if (missed.length) lines.push(tr('漏掉的要点：'), ...missed.map(point => `- ${markdown(point)}`), '');
    lines.push(tr('用参考要点自行检查解释。'), '');
  }
  return lines.join('\n') + '\n';
}

export function downloadCrashSheet(text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'unscripted-crash-sheet.md';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
