import { t } from './i18n.js';
import { isLight } from './lights.js';

export const HISTORY_KEY = 'unscripted.history.v1';
export const MAX_ENTRIES = 200;

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

function normalize(entry) {
  const clean = {
    questionId: entry.questionId,
    layer: entry.layer,
    ts: entry.ts,
    light: entry.light,
    pointLights: [...entry.pointLights],
    missedPoints: [...entry.missedPoints],
  };
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
  let warning = '';

  try {
    storage = getStorage();
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
    latest: key => latestByCell(data.entries).get(key) || null,
    add({ questionId, layer, light, pointLights, missedPoints, answer, ts = new Date().toISOString() }) {
      if (!isQuestionId(questionId) || !/^L[123]$/.test(layer) || !isLight(light)) throw new Error('无效判定');
      const entry = normalize({
        questionId, layer, ts, light,
        pointLights: pointLights?.length ? pointLights : [light],
        missedPoints: missedPoints || [],
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
