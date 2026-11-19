import frozen from '../data/packs/unscripted-core.v1.0.0.json' with {type:'json'};
import current from '../data/packs/unscripted-core.v1.json' with {type:'json'};
import { t } from './i18n.js';

const knownPacks = [frozen, current];
const rubricFor = (pack, entry) => pack.questions.find(q => q.id === entry.questionId)
  ?.layers.find(layer => layer.id === entry.layer)?.rubric;

export function historyRubric(entry, lang) {
  const locale = lang === 'en' ? 'en' : 'zh-CN';
  const snapshot = entry.rubricSnapshot;
  let packVersion = snapshot?.packVersion ?? entry.packVersion;
  let packId = snapshot?.packId ?? entry.packId;
  let rubric = snapshot?.rubric;
  if (!rubric && packVersion) {
    const pack = knownPacks.find(p => p.packId === packId && p.packVersion === packVersion);
    const candidates = pack ? rubricFor(pack, entry) : [];
    rubric = entry.rubricIds?.map(id => candidates?.find(row => row.rubricId === id));
  } else if (!rubric) {
    // The released v1 writer stored one lamp per criterion. Use text only where
    // shape distinguishes the available releases or all matching rubrics agree.
    const matches = knownPacks.flatMap(pack => {
      const rows = rubricFor(pack, entry);
      return rows?.length === entry.pointLights.length ? [{pack, rows}] : [];
    });
    if (matches.length === 1) {
      packVersion = matches[0].pack.packVersion;
      packId = matches[0].pack.packId;
      rubric = matches[0].rows;
    } else if (matches.length && matches.every(({rows}) => JSON.stringify(rows) === JSON.stringify(matches[0].rows))) {
      rubric = matches[0].rows;
    }
  }
  const points = entry.pointLights.map((light, index) => {
    const row = rubric?.[index];
    const rubricId = row?.rubricId ?? entry.rubricIds?.[index];
    const text = row?.criterion[locale] ?? row?.criterion.en ?? (row && Object.values(row.criterion)[0]) ?? rubricId ?? t('历史评分点 #{n}', {n:index + 1}, lang);
    return {rubricId, text, light, missed:entry.missedPoints.includes(index)};
  });
  const needsReconfirmation = (!snapshot && !entry.packVersion) || packId !== current.packId ||
    packVersion !== current.packVersion || points.some((_, index) => !rubric?.[index]);
  return {packId, packVersion, points, needsReconfirmation};
}

export function historyVersionLabel(history, lang) {
  const version = history.packVersion
    ? `${history.packId}@${history.packVersion}`
    : t('历史题库版本未确认', {}, lang);
  return history.needsReconfirmation ? `${version} · ${t('旧判定需重新确认', {}, lang)}` : version;
}
