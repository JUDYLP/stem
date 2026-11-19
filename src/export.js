import { historyRubric, historyVersionLabel } from './history-rubric.js';
import { t, localized } from './i18n.js';
import { lightForStatus } from './lights.js';

const LIGHT_WORD = { green: '讲清了', amber: '还差一点', red: '漏掉了', off: '未作答' };

export function reviewItems(questions, progress) {
  return questions.flatMap(question => question.layers
    .filter(layer => progress.items[`${question.id}::${layer.id}`]?.status === 'review')
    .map(layer => ({ question, layer })));
}

const markdown = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_\[\]#]/g, '\\$&');

export function crashSheetRows(questions, progress, entries = [], lang = 'zh') {
  const byCell = new Map();
  for (const entry of entries) {
    const key = `${entry.questionId}::${entry.layer}`;
    const history = historyRubric(entry, lang);
    if (!byCell.has(key)) byCell.set(key, new Map());
    byCell.get(key).set(`${history.packId ?? ''}@${history.packVersion ?? ''}`, {entry, history});
  }
  return questions.flatMap(question => question.layers.flatMap(layer => {
    const key = `${question.id}::${layer.id}`;
    const records = [...(byCell.get(key)?.values() ?? [])];
    const rated = records.filter(({entry}) => entry.light !== 'green')
      .map(record => ({question, layer, ...record}));
    return rated.length || records.length || progress.items[key]?.status !== 'review'
      ? rated : [{question, layer}];
  }));
}

export function buildCrashSheet(questions, progress, lang = 'zh', entries = []) {
  const items = crashSheetRows(questions, progress, entries, lang);
  const tr = key => t(key, {}, lang);
  const lines = ['# Unscripted · ' + tr('当前复习单'), '', tr('按题库版本列出最近需要复习的判定。'), ''];
  if (!items.length) lines.push(tr('当前没有需要复习的条目。'));
  for (const { question, layer, entry, history } of items) {
    const light = entry?.light || lightForStatus(progress.items[`${question.id}::${layer.id}`]?.status);
    lines.push(
      `## ${markdown(question.category)} / ${layer.id} · ${markdown(localized(question, 'title', lang))}`, '',
      `${tr('灯色')}：${tr(LIGHT_WORD[light])}`, '',
    );
    if (history) {
      lines.push(markdown(historyVersionLabel(history, lang)), '', tr('历史评分标准：'));
      for (const point of history.points) {
        lines.push(`- ${tr(LIGHT_WORD[point.light])} · ${markdown(point.text)}`);
      }
      lines.push('');
      const missed = history.points.filter(point => point.missed);
      if (missed.length) lines.push(tr('漏掉的要点：'), ...missed.map(point => `- ${markdown(point.text)}`), '');
    }
    lines.push(markdown(localized(layer, 'prompt', lang)), '', tr('再次解释时检查：'),
      ...localized(layer, 'rubric', lang).map(point => `- ${markdown(point)}`), '',
      tr('用参考要点自行检查解释。'), '');
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
