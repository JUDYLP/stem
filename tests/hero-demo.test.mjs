import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHeroDemo } from '../src/demo.js';

const raw = JSON.parse(await readFile(new URL('../data/hero-demo.v1.json', import.meta.url)));
const clone = () => structuredClone(raw);

test('the preset hero judgment covers three options and three points with valid lights', () => {
  const data = validateHeroDemo(clone());
  assert.equal(data.options.length, 3);
  assert.deepEqual(data.pointIds, ['two-ops', 'both-read-1', 'fix']);
  for (const judgment of Object.values(data.judgments)) {
    assert.equal(judgment.points.length, 3);
    for (const point of judgment.points) {
      assert.ok(['green', 'amber', 'red'].includes(point.light));
      assert.ok(point.reason && point.reasonEn);
      assert.equal(typeof point.quote, 'string');
      assert.equal(typeof point.quoteEn, 'string');
    }
  }
  const lights = Object.values(data.judgments).map(judgment => judgment.points.map(point => point.light));
  assert.ok(lights.some(points => points.every(light => light === 'red')));
  assert.ok(lights.some(points => points.every(light => light === 'amber')));
  assert.ok(lights.some(points => points.every(light => light === 'green')));
});

test('every quote is a substring of its option in both languages', () => {
  const data = validateHeroDemo(clone());
  for (const option of data.options) {
    assert.doesNotMatch(option.textEn, /[\u4e00-\u9fff]/);
    for (const point of data.judgments[option.id].points) {
      assert.equal(Boolean(point.quote), Boolean(point.quoteEn));
      if (point.quote) {
        assert.ok(option.text.includes(point.quote), `${point.pointId} zh quote`);
        assert.ok(option.textEn.includes(point.quoteEn), `${point.pointId} en quote`);
      }
      assert.doesNotMatch(point.reasonEn + point.quoteEn, /[\u4e00-\u9fff]/);
    }
  }
});

test('invalid preset shapes are rejected', () => {
  for (const mutate of [
    data => data.options.pop(),
    data => { data.options[1].id = data.options[0].id; },
    data => { data.options[0].textEn = ' '; },
    data => { data.judgments['comment-atomic'].points.pop(); },
    data => { data.judgments['comment-atomic'].points[0].light = 'off'; },
    data => { data.judgments['comment-atomic'].points[0].quote = 'not in the answer'; },
    data => { data.judgments['comment-atomic'].points[0].quoteEn = 'not in the answer'; },
    data => { data.judgments['comment-atomic'].followup = ''; },
    data => { data.judgments['comment-atomic'].points[0].quoteEn = ''; },
    data => { data.judgments['comment-atomic'].points[0].pointId = 'unknown'; },
    data => { data.pointIds = ['two-ops']; },
    data => { data.schemaVersion = 2; },
  ]) {
    const data = clone();
    mutate(data);
    assert.throws(() => validateHeroDemo(data));
  }
});
