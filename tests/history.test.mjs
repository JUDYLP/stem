import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createHistoryStore, parseHistory, latestByCell, emptyHistory,
  MAX_ENTRIES, HISTORY_KEY,
} from '../src/history.js';

const memory = raw => {
  let value = raw;
  return {
    storage: { getItem: () => value, setItem: (_key, next) => { value = next; } },
    read: () => value,
    writes: () => value,
  };
};

const entry = (index, overrides = {}) => ({
  questionId: 'q',
  layer: 'L1',
  ts: new Date(Date.UTC(2026, 10, 17, 8, 0, index)).toISOString(),
  light: 'amber',
  pointLights: ['green', 'amber'],
  missedPoints: [],
  ...overrides,
});

test('history keeps the newest 200 entries and drops the oldest', () => {
  const { storage, read } = memory(null);
  const log = createHistoryStore(() => storage);
  for (let index = 0; index < MAX_ENTRIES + 3; index += 1) log.add(entry(index));
  const data = log.snapshot();
  assert.equal(data.entries.length, MAX_ENTRIES);
  assert.equal(data.entries[0].ts, entry(3).ts);
  assert.equal(JSON.parse(read()).entries.length, MAX_ENTRIES);
});

test('answer text is only stored after the learner turns the switch on', () => {
  const { storage, read } = memory(null);
  const log = createHistoryStore(() => storage);
  log.add(entry(0, { answer: 'first answer' }));
  assert.equal(log.snapshot().entries[0].answer, undefined);
  assert.equal(JSON.parse(read()).entries[0].answer, undefined);

  log.setSaveAnswers(true);
  log.add(entry(1, { answer: 'kept answer' }));
  assert.equal(log.snapshot().entries[1].answer, 'kept answer');
  assert.equal(JSON.parse(read()).entries[1].answer, 'kept answer');

  log.setSaveAnswers(false);
  assert.equal(log.snapshot().entries[1].answer, undefined);
  assert.equal(JSON.parse(read()).entries[1].answer, undefined);
});

test('turning the switch off deletes answers already stored in older entries', () => {
  const raw = JSON.stringify({
    schemaVersion: 1, saveAnswers: true,
    entries: [entry(0, { answer: 'old answer' }), entry(1, { answer: 'newer answer' })],
  });
  const { storage, read } = memory(raw);
  const log = createHistoryStore(() => storage);
  assert.equal(log.snapshot().entries[0].answer, 'old answer');
  log.setSaveAnswers(false);
  assert.ok(!read().includes('answer'));
});

test('damaged records are not overwritten and the session runs in memory', () => {
  for (const raw of ['{bad', '{"schemaVersion":2,"entries":[]}', '{"schemaVersion":1,"entries":{}}']) {
    let writes = 0;
    const log = createHistoryStore(() => ({ getItem: () => raw, setItem: () => { writes += 1; } }));
    log.add(entry(0));
    assert.equal(log.snapshot().entries.length, 1);
    assert.ok(log.warning);
    assert.equal(writes, 0);
  }
});

test('malformed entries are dropped, unknown fields are not persisted', () => {
  const raw = JSON.stringify({
    schemaVersion: 1,
    saveAnswers: false,
    entries: [
      entry(0, { layer: 'L9' }),
      entry(1, { pointLights: ['blue'] }),
      { ...entry(2), extra: 'drop me' },
      entry(3),
    ],
  });
  const parsed = parseHistory(raw);
  assert.equal(parsed.entries.length, 2);
  assert.equal(parsed.entries[0].extra, undefined);
  assert.equal(parsed.entries[0].ts, entry(2).ts);
  assert.throws(() => parseHistory('{"schemaVersion":1}'));
  assert.deepEqual(parseHistory(null), emptyHistory());
});

test('latest light per question and level follows insertion order', () => {
  const entries = [entry(0, { light: 'red' }), entry(1, { light: 'amber' }), entry(2, { light: 'green', layer: 'L2' })];
  const latest = latestByCell(entries);
  assert.equal(latest.get('q::L1').light, 'amber');
  assert.equal(latest.get('q::L2').light, 'green');
  assert.equal(latest.get('q::L3'), undefined);
  assert.equal(new Set(entries.map(item => item.questionId)).size, 1);
});

test('clear empties the timeline but keeps the answer switch preference', () => {
  const { storage } = memory(null);
  const log = createHistoryStore(() => storage);
  log.setSaveAnswers(true);
  log.add(entry(0, { answer: 'kept' }));
  log.clear();
  assert.deepEqual(log.snapshot().entries, []);
  assert.equal(log.saveAnswers, true);
  const reloaded = createHistoryStore(() => storage);
  assert.equal(reloaded.snapshot().entries.length, 0);
  assert.equal(reloaded.saveAnswers, true);
  assert.equal(HISTORY_KEY, 'unscripted.history.v1');
});
