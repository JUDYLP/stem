import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('the active hero glow pairs each light with itself and only toggles opacity', () => {
  const start = css.indexOf('.hero-glow[data-light="white"] .glow-layer[data-light="white"]');
  const red = css.indexOf('.hero-glow[data-light="red"] .glow-layer[data-light="red"]', start);
  assert.ok(start >= 0 && red > start, 'activation group must exist and end on red -> red');
  const group = css.slice(start, css.indexOf('}', red) + 1);
  for (const color of ['white', 'green', 'amber', 'red']) {
    assert.ok(group.includes(`.hero-glow[data-light="${color}"] .glow-layer[data-light="${color}"]`), `${color} activation is paired`);
  }
  assert.doesNotMatch(group, /background/, 'activation group must not carry a gradient');
  assert.match(group, /opacity:\s*1/);
});

test('no unconditional red glow and amber has its own gradient block', () => {
  assert.doesNotMatch(css, /^\.glow-layer\[data-light="red"\]\s*\{\s*opacity:\s*1\s*;?\s*\}/m);
  assert.match(css, /\.glow-layer\[data-light="amber"\]\s*\{\s*background:\s*radial-gradient/);
  for (const color of ['white', 'green', 'amber', 'red']) {
    assert.match(css, new RegExp(`\\.glow-layer\\[data-light="${color}"\\]\\s*\\{\\s*background:\\s*radial-gradient`));
  }
});

test('the try button is a secondary, content-width button', () => {
  const rule = css.match(/\.hero-try\s*\{([^}]*)\}/);
  assert.ok(rule, 'hero-try rule exists');
  assert.match(rule[1], /width:\s*auto/);
  assert.match(rule[1], /border:\s*1px solid rgba\(34, 197, 94/);
  assert.match(rule[1], /color:\s*#4ade80/);
  assert.doesNotMatch(html, /class="button primary hero-try"/);
});
