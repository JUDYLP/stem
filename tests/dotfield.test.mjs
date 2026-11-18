import test from 'node:test';
import assert from 'node:assert/strict';
import {
  falloff, tintStrength, waveAlpha, spacingFor, spillAllowed, screenPhase, spotFalloff, WAVE_PERIOD,
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

test('dot breathing is a slow diagonal band with a 2.5x peak-to-trough range', () => {
  let min = 1;
  let max = 0;
  for (let time = 0; time < WAVE_PERIOD; time += 100) {
    for (let phase = 0; phase <= 1; phase += 0.05) {
      const alpha = waveAlpha(phase, time);
      min = Math.min(min, alpha);
      max = Math.max(max, alpha);
    }
  }
  assert.ok(min >= 0.08 - 1e-9, `trough ${min}`);
  assert.ok(max <= 0.20 + 1e-9, `peak ${max}`);
  assert.ok(max / min > 2.3, `ratio ${max / min}`);
  assert.equal(waveAlpha(0.4, 0), waveAlpha(0.4, WAVE_PERIOD));
  assert.notEqual(waveAlpha(0.4, 0), waveAlpha(0.4, WAVE_PERIOD / 2));
  const loud = waveAlpha(0.5, WAVE_PERIOD / 2, 1);
  const quiet = waveAlpha(0.5, WAVE_PERIOD / 2, 0.3);
  assert.ok(Math.abs(quiet - 0.08) < Math.abs(loud - 0.08));
});

test('screen phase and spotlight falloff use the diagonal and the pointer radius', () => {
  assert.equal(screenPhase(0, 0, 1440, 900), 0);
  assert.ok(Math.abs(screenPhase(1440, 900, 1440, 900) - 1) < 1e-9);
  assert.ok(Math.abs(screenPhase(720, 450, 1440, 900) - 0.5) < 1e-9);
  assert.equal(spotFalloff(0), 1);
  assert.equal(spotFalloff(180), 0);
  assert.equal(spotFalloff(181), 0);
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
