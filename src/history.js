import { t } from './i18n.js';
import { isLight, summarizeLights } from './lights.js';

export const HISTORY_KEY = 'unscripted.history.v1';
export const MAX_ENTRIES = 200;
export const COMPACT_THRESHOLD = 6;

// More than six questions switches the heat matrix to compact rows by default.
export function shouldUseCompact(count) {
  return Number(count) > COMPACT_THRESHOLD;
}

export const emptyHistory = () => ({ schemaVersion: 1, saveAnswers: false, entries: [] });
export const entryKey = entry => `${entry.questionId}::${entry.layer}`;

const isObject = value => value && typeof value === 'object' && !Array.isArray(value);
const isQuestionId = value => typeof value === 'string' && /^[a-z0-9-]+$/.test(value);
const isTimestamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value));

function isEntry(entry) {
  return isObject(entry)
    && isQuestionId(entry.questionId)
    && /^L[123]$/.test(entry.layer)
    && isTimestamp(entry.ts)
    && isLight(entry.light)
    && Array.isArray(entry.pointLights) && entry.pointLights.length > 0 && entry.pointLights.every(isLight)
    && Array.isArray(entry.missedPoints) && entry.missedPoints.every(index => Number.isInteger(index) && index >= 0);
}

export function validRubricSnapshot(snapshot, count) {
  if (!isObject(snapshot) || !isQuestionId(snapshot.packId) ||
      !/^\d+\.\d+\.\d+$/.test(snapshot.packVersion) ||
      !Array.isArray(snapshot.rubric) || snapshot.rubric.length !== count) return false;
  const ids = new Set();
  return snapshot.rubric.every(row => {
    if (!isObject(row) || !isQuestionId(row.rubricId) || ids.has(row.rubricId) ||
        !isObject(row.criterion)) return false;
    const labels = Object.values(row.criterion);
    if (!labels.length || !labels.every(label => typeof label === 'string' && label.trim())) return false;
    ids.add(row.rubricId);
    return true;
  });
}

export function makeRubricSnapshot(pack, layer) {
  return { packId: pack.packId, packVersion: pack.packVersion, rubric: layer.rubric };
}

function normalize(entry) {
  const clean = {
    questionId: entry.questionId,
    layer: entry.layer,
    ts: entry.ts,
    light: entry.light,
    pointLights: [...entry.pointLights],
    missedPoints: [...entry.missedPoints],
  };
  if (validRubricSnapshot(entry.rubricSnapshot, clean.pointLights.length))
    clean.rubricSnapshot = structuredClone(entry.rubricSnapshot);
  if (typeof entry.answer === 'string' && entry.answer) clean.answer = entry.answer;
  return clean;
}

// A damaged or newer record is never overwritten; the session continues in memory.
export function parseHistory(raw) {
  if (raw === null) return emptyHistory();
  const data = JSON.parse(raw);
  if (!isObject(data) || data.schemaVersion !== 1 || !Array.isArray(data.entries)) {
    throw new Error('历史记录版本或格式不兼容');
  }
  const entries = data.entries.filter(isEntry).map(normalize).slice(-MAX_ENTRIES);
  return { schemaVersion: 1, saveAnswers: data.saveAnswers === true, entries };
}

export function latestByCell(entries) {
  const latest = new Map();
  for (const entry of entries) latest.set(entryKey(entry), entry);
  return latest;
}

export function progressionFor(entries, questionId) {
  return entries.filter(entry => entry.questionId === questionId);
}

export function createHistoryStore(getStorage = () => window.localStorage) {
  let data = emptyHistory();
  let storage = null;
  let readStorage = null;
  let warning = '';

  try {
    readStorage = storage = getStorage();
    data = parseHistory(storage.getItem(HISTORY_KEY));
  } catch {
    storage = null;
    warning = '历史记录不可读、已损坏或版本不兼容。原记录未覆盖；本次记录仅在内存中，刷新会丢失。';
  }

  function persist() {
    if (!storage) return false;
    try {
      storage.setItem(HISTORY_KEY, JSON.stringify(data));
      return true;
    } catch {
      storage = null;
      warning = '历史记录保存失败。本次记录仅在内存中，刷新会丢失。';
      return false;
    }
  }

  return {
    get warning() { return warning ? t(warning) : ''; },
    get saveAnswers() { return data.saveAnswers; },
    snapshot: () => structuredClone(data),
    versionedEntries: packId => readVersionedEntries(readStorage, packId),
    latest: key => latestByCell(data.entries).get(key) || null,
    add({ questionId, layer, light, pointLights, missedPoints, rubricSnapshot, answer, ts = new Date().toISOString() }) {
      if (!isQuestionId(questionId) || !/^L[123]$/.test(layer) || !isLight(light)) throw new Error('无效判定');
      const entry = normalize({
        questionId, layer, ts, light,
        pointLights: pointLights?.length ? pointLights : [light],
        missedPoints: missedPoints || [], rubricSnapshot,
        answer: data.saveAnswers ? answer : undefined,
      });
      if (!isEntry(entry)) throw new Error('无效判定');
      data.entries.push(entry);
      if (data.entries.length > MAX_ENTRIES) data.entries.splice(0, data.entries.length - MAX_ENTRIES);
      persist();
      return entry;
    },
    setSaveAnswers(save) {
      data.saveAnswers = save === true;
      if (!data.saveAnswers) for (const entry of data.entries) delete entry.answer;
      persist();
      return data.saveAnswers;
    },
    clear() {
      data = { schemaVersion: 1, saveAnswers: data.saveAnswers, entries: [] };
      persist();
    },
  };
}

// Read only the history projection. The v2 learning store owns writes and migrations.
export function readVersionedEntries(storage, packId) {
  try {
    const state = JSON.parse(storage?.getItem('unscripted.progress.v2') ?? 'null');
    if (state?.schemaVersion !== 2) return [];
    const versions = state.packs?.[packId]?.versions;
    if (!isObject(versions)) return [];
    return Object.entries(versions).flatMap(([packVersion, version]) => {
      if (!Array.isArray(version?.history) || !/^\d+\.\d+\.\d+$/.test(packVersion)) return [];
      return version.history.flatMap(record => {
        if (record?.packId !== packId || record.packVersion !== packVersion ||
            !Array.isArray(record.criterionResults) || record.criterionResults.length > 12 ||
            !record.criterionResults.every(row => isQuestionId(row?.rubricId) && isLight(row.light))) return [];
        const rubricIds = record.criterionResults.map(row => row.rubricId);
        if (new Set(rubricIds).size !== rubricIds.length) return [];
        const pointLights = record.criterionResults.map(row => row.light);
        if (record.light !== summarizeLights(pointLights)) return [];
        const missedPoints = pointLights.flatMap((light, index) => light === 'red' ? [index] : []);
        const entry = { ...record, layer: record.layerId, pointLights, missedPoints,
          answer: state.saveAnswers === true ? record.answer : undefined };
        if (!isEntry(entry)) return [];
        const clean = normalize(entry);
        if (!clean.rubricSnapshot?.rubric.every((row, i) => row.rubricId === rubricIds[i]) ||
            clean.rubricSnapshot.packId !== packId || clean.rubricSnapshot.packVersion !== packVersion) delete clean.rubricSnapshot;
        return [{ ...clean, packId, packVersion, rubricIds }];
      });
    });
  } catch {
    return [];
  }
}
