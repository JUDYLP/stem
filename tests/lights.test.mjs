import test from 'node:test';
import assert from 'node:assert/strict';
import {
  summarizeLights, statusForLight, lightForStatus, nextLight,
  keyToLight, pointLabel, pointAnnouncement,
  suggestLights, getSuggestion, clearSuggestion,
} from '../src/lights.js';
import { setLanguage } from '../src/i18n.js';

test('layer light: all green is clear, any red misses, the rest is almost', () => {
  assert.equal(summarizeLights(['green', 'green', 'green']), 'green');
  assert.equal(summarizeLights(['green', 'amber', 'green']), 'amber');
  assert.equal(summarizeLights(['green', 'green', 'red']), 'red');
  assert.equal(summarizeLights(['red', 'red', 'red']), 'red');
  assert.equal(summarizeLights([]), 'amber');
});

test('only a green layer maps to an existing pass record', () => {
  assert.equal(statusForLight('green'), 'pass');
  assert.equal(statusForLight('amber'), 'review');
  assert.equal(statusForLight('red'), 'review');
  assert.equal(lightForStatus('pass'), 'green');
  assert.equal(lightForStatus('review'), 'red');
  assert.equal(lightForStatus(undefined), 'off');
  assert.equal(summarizeLights(['green', 'green']), 'green');
});

test('clicking a point lamp cycles green, red, amber without an off state', () => {
  assert.equal(nextLight('amber'), 'green');
  assert.equal(nextLight('green'), 'red');
  assert.equal(nextLight('red'), 'amber');
  assert.equal(nextLight('off'), 'amber');
});

test('external light suggestions are validated and never applied by themselves', () => {
  assert.equal(suggestLights('q', 'L1', ['green', 'red']), true);
  assert.deepEqual(getSuggestion('q', 'L1'), ['green', 'red']);
  assert.equal(suggestLights('q', 'L1', ['off']), false);
  assert.equal(suggestLights('q', 'L9', ['green']), false);
  assert.equal(suggestLights('q', 'L2', []), false);
  assert.equal(getSuggestion('q', 'L2'), null);
  clearSuggestion('q', 'L1');
  assert.equal(getSuggestion('q', 'L1'), null);
});

test('legacy progress records stay readable and map to lights', async () => {
  const { parseProgress } = await import('../src/storage.js');
  const parsed = parseProgress(JSON.stringify({
    schemaVersion: 1,
    items: {
      'juc-volatile-atomicity-v2::L2': { status: 'pass', updatedAt: '2026-11-15T08:00:00.000Z' },
      'redis-expiration-v2::L1': { status: 'review', updatedAt: '2026-11-15T09:00:00.000Z' },
    },
  }));
  assert.equal(parsed.items['juc-volatile-atomicity-v2::L2'].status, 'pass');
  assert.equal(lightForStatus(parsed.items['juc-volatile-atomicity-v2::L2'].status), 'green');
  assert.equal(lightForStatus(parsed.items['redis-expiration-v2::L1'].status), 'red');
});


test('number keys set a light directly and the label names the current and next state', () => {
  assert.equal(keyToLight('1'), 'green');
  assert.equal(keyToLight('2'), 'amber');
  assert.equal(keyToLight('3'), 'red');
  assert.equal(keyToLight('4'), null);
  assert.equal(keyToLight('Enter'), null);

  setLanguage('zh', () => null);
  assert.equal(pointLabel(0, 'amber'), '第 1 条：当前还差一点，点击切换为讲清了');
  assert.equal(pointLabel(1, 'red'), '第 2 条：当前漏掉了，点击切换为还差一点');
  assert.equal(pointAnnouncement(0, 'green'), '第 1 条已设为讲清了');

  setLanguage('en', () => null);
  assert.equal(pointLabel(0, 'amber'), 'Point 1: currently Almost. Activate to switch to Clear.');
  assert.equal(pointAnnouncement(2, 'red'), 'Point 3 set to Missed.');
  setLanguage('zh', () => null);
});
