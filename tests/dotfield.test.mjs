import test from 'node:test';
import assert from 'node:assert/strict';
import {
  falloff, tintStrength, waveAlpha, spacingFor, spillAllowed,
  LAMP_RADIUS, MAX_TINT, BASE_MIN, BASE_MAX,
  SPACING_DESKTOP, SPACING_NARROW,
} from '../src/dotfield.js';

test('light falloff is 1 at the lamp, 0 at the radius edge, monotonic between', () => {
  assert.equal(falloff(0), 1);
  assert.equal(falloff(LAMP_RADIUS), 0);
  assert.equal(falloff(LAMP_RADIUS + 40), 0);
  assert.equal(falloff(-20), falloff(20));
  assert.equal(falloff(Number.NaN), 0);
  let previous = falloff(0);
  for (let distance = 10; distance <= LAMP_RADIUS; distance += 10) {
    const current = falloff(distance);
    assert.ok(current <= previous + 1e-12, `falloff must not rise at ${distance}`);
    previous = current;
  }
  assert.ok(falloff(80) > 0.4 && falloff(80) < 0.6);
});

test('tint strength never exceeds the 0.5 ceiling', () => {
  assert.equal(tintStrength(0), MAX_TINT);
  assert.equal(tintStrength(LAMP_RADIUS), 0);
  assert.equal(tintStrength(LAMP_RADIUS * 3), 0);
  assert.ok(tintStrength(40) < MAX_TINT);
  assert.ok(tintStrength(120) < MAX_TINT * 0.2);
});

test('dot breathing stays inside 0.12-0.20 and quietens to 30%', () => {
  for (let time = 0; time < 30000; time += 250) {
    const alpha = waveAlpha(120, 80, time);
    assert.ok(alpha >= BASE_MIN - 1e-9 && alpha <= BASE_MAX + 1e-9, `alpha ${alpha} at ${time}`);
  }
  const loud = waveAlpha(120, 80, 5000, 1);
  const quiet = waveAlpha(120, 80, 5000, 0.3);
  assert.ok(Math.abs(quiet - 0.16) < Math.abs(loud - 0.16));
  assert.notEqual(waveAlpha(0, 0, 0), waveAlpha(0, 0, 4000));
});

test('dot spacing is 28px on desktop and 32px on a 390px screen', () => {
  assert.equal(spacingFor(1440), SPACING_DESKTOP);
  assert.equal(spacingFor(481), SPACING_DESKTOP);
  assert.equal(spacingFor(480), SPACING_NARROW);
  assert.equal(spacingFor(390), SPACING_NARROW);
});

test('only lamps near the hero panel edge spill onto the page background', () => {
  assert.equal(spillAllowed(0, true), true);
  assert.equal(spillAllowed(80, true), true);
  assert.equal(spillAllowed(81, true), false);
  assert.equal(spillAllowed(10, false), false);
  assert.equal(spillAllowed(Number.NaN, true), false);
});
