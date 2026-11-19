// Verdict-moment FX: scan beam, quote highlight, light pulse, in-row halo.
// This module owns choreography only. Judging logic stays in main.js / src/ai/;
// Codex wires the two exports into the live-AI flow. The ?fx=demo bootstrap at
// the bottom is deliberately kept here so main.js does not have to change.

import { setLampState } from '../lights.js';

const LIGHTS = new Set(['green', 'amber', 'red']);
const LIGHT_RGB = { green: '34, 197, 94', amber: '245, 165, 36', red: '255, 69, 58' };
const SCAN_MS = 1600;   // scan beam period
const STEP_MS = 350;    // per-point reveal interval
const FLIGHT_MS = 400;  // pulse flight time

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const validLight = light => (LIGHTS.has(light) ? light : 'amber');

// ---------------------------------------------------------------- scan beam

// While the request is in flight a thin white beam sweeps the answer top to
// bottom, ~1.6s per pass. Returns a stop() that is safe to call twice.
export function startScan(answerEl) {
  if (!answerEl || reducedMotion()) return () => {};
  answerEl.classList.add('fx-scanning');
  const beam = document.createElement('span');
  beam.className = 'fx-scanbeam';
  beam.setAttribute('aria-hidden', 'true');
  const measure = () =>
    answerEl.style.setProperty('--fx-scan-h', `${answerEl.clientHeight}px`);
  measure();
  let observer = null;
  if (typeof ResizeObserver === 'function') {
    observer = new ResizeObserver(measure);
    observer.observe(answerEl);
  }
  answerEl.append(beam);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    observer?.disconnect();
    beam.remove();
    answerEl.classList.remove('fx-scanning');
    answerEl.style.removeProperty('--fx-scan-h');
  };
}

// ---------------------------------------------------------- quote highlight

// Locate a verbatim quote across text nodes and wrap it in a <mark>, using a
// Range instead of innerHTML so the answer text is never re-parsed.
function findQuoteRange(root, quote) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let text = '';
  let node;
  while ((node = walker.nextNode())) {
    nodes.push({ node, from: text.length });
    text += node.data;
  }
  const at = text.indexOf(quote);
  if (at < 0) return null;
  const end = at + quote.length;
  const range = document.createRange();
  let started = false;
  for (const { node: current, from } of nodes) {
    const to = from + current.data.length;
    if (!started && at >= from && at < to) {
      range.setStart(current, at - from);
      started = true;
    }
    if (started && end > from && end <= to) {
      range.setEnd(current, end - from);
      return range;
    }
  }
  return null;
}

function highlightQuote(answerEl, quote, light) {
  const range = findQuoteRange(answerEl, quote);
  if (!range || range.collapsed) return null;
  const mark = document.createElement('mark');
  mark.className = 'fx-quote';
  mark.dataset.light = light;
  try {
    range.surroundContents(mark);
  } catch {
    return null; // quote crosses element boundaries; skip rather than corrupt
  }
  return mark;
}

// ------------------------------------------------------------- light pulse

function center(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// A hairline curve plus a small dot, drawn in a fixed overlay. Motion uses
// transform/opacity only; the trail stroke is paint-only. Resolves on arrival.
function flyPulse(fromRect, toRect, light) {
  return new Promise(resolve => {
    const from = center(fromRect);
    const to = center(toRect);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 24) {
      resolve();
      return;
    }
    const rgb = LIGHT_RGB[light];
    const bend = Math.min(48, dist * 0.18);
    // Bow the curve upward: pick the normal with a negative y component.
    let nx = -dy / dist;
    let ny = dx / dist;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const control = { x: (from.x + to.x) / 2 + nx * bend, y: (from.y + to.y) / 2 + ny * bend };

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'fx-pulse-layer');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', `rgba(${rgb}, .55)`);
    path.setAttribute('stroke-width', '1');
    svg.append(path);

    const dot = document.createElement('span');
    dot.className = 'fx-pulse-dot';
    dot.dataset.light = light;
    dot.setAttribute('aria-hidden', 'true');

    document.body.append(svg, dot);

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    const start = performance.now();
    const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    let raf = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      clearTimeout(watchdog);
      dot.style.opacity = '0';
      svg.style.opacity = '0';
      setTimeout(() => {
        svg.remove();
        dot.remove();
      }, 220);
      resolve();
    };
    // Watchdog: if rAF is throttled (background tab, virtual time, headless),
    // the verdict still completes instead of hanging mid-flight.
    const watchdog = setTimeout(finish, FLIGHT_MS + 200);
    const frame = now => {
      if (done) return;
      const t = Math.min(1, (now - start) / FLIGHT_MS);
      const k = ease(t);
      // Quadratic bezier point.
      const u = 1 - k;
      const x = u * u * from.x + 2 * u * k * control.x + k * k * to.x;
      const y = u * u * from.y + 2 * u * k * control.y + k * k * to.y;
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      path.style.strokeDashoffset = `${length * (1 - k)}`;
      if (t >= 1) finish();
      else raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  });
}

// ------------------------------------------------------- lamp and ripple

// Same restart-ignite dance as lights.js, but the lamp:lit detail carries
// ripple:false so the dotfield default ripple stays out of the way of the
// tuned FX ripple fired below.
function igniteLamp(lamp) {
  lamp.classList.remove('is-on', 'is-flash');
  void lamp.offsetWidth;
  lamp.classList.add('is-on');
  window.dispatchEvent(new CustomEvent('lamp:lit', { detail: { element: lamp, ripple: false } }));
}

// A halo that grows from the lamp along its own rubric row: the dot field is
// hidden behind the opaque card, so the ripple lives on the row surface.
function waveRow(lamp, light) {
  const row = lamp.closest('.point-row');
  if (!row) return;
  row.querySelector('.fx-row-wave')?.remove();
  const rowRect = row.getBoundingClientRect();
  const rect = lamp.getBoundingClientRect();
  const wave = document.createElement('span');
  wave.className = 'fx-row-wave';
  wave.dataset.light = light;
  wave.setAttribute('aria-hidden', 'true');
  wave.style.setProperty('--fx-wave-x', `${rect.left + rect.width / 2 - rowRect.left}px`);
  wave.addEventListener('animationend', () => wave.remove(), { once: true });
  row.append(wave);
}

// Layer light rule (mirrors lights.js): all green -> green; any red -> red.
function layerLightOf(verdicts) {
  const lights = verdicts.map(v => validLight(v.light));
  if (!lights.length) return 'amber';
  if (lights.every(light => light === 'green')) return 'green';
  return lights.includes('red') ? 'red' : 'amber';
}

// Layer score in the dot-matrix font, e.g. 2/3, coloured by the layer rule.
function renderScore(verdicts) {
  const host = document.getElementById('layer-light');
  if (!host || !verdicts.length) return;
  const greens = verdicts.filter(v => validLight(v.light) === 'green').length;
  const layerLight = layerLightOf(verdicts);
  let score = host.querySelector('.fx-score');
  if (!score) {
    score = document.createElement('span');
    score.className = 'fx-score';
    score.setAttribute('aria-hidden', 'true');
    host.append(score);
  }
  score.dataset.light = layerLight;
  score.textContent = `${greens}/${verdicts.length}`;
}

// ---------------------------------------------------------------- reveal

// Play the full verdict: one point every ~350ms. With a quote, the matching
// original text is underlined first, then a pulse flies to the lamp; the lamp
// only ignites when the pulse arrives. Without a quote the lamp lights at once.
export function playVerdict({ verdicts, answerEl, lampEls } = {}) {
  const list = Array.isArray(verdicts) ? verdicts : [];
  const lamps = Array.from(lampEls || []);
  const reduced = reducedMotion();
  const timers = [];
  let cancelled = false;
  let finished = 0;
  let settle;
  const done = new Promise(resolve => { settle = resolve; });

  const reveal = async (verdict, index) => {
    if (cancelled) return;
    const light = validLight(verdict.light);
    const lamp = lamps[index] || null;
    const quote = typeof verdict.quote === 'string' ? verdict.quote.trim() : '';
    let anchor = null;
    if (quote && answerEl) anchor = highlightQuote(answerEl, quote, light);
    if (!reduced && anchor && lamp) {
      await flyPulse(anchor.getBoundingClientRect(), lamp.getBoundingClientRect(), light);
      if (cancelled) return;
    }
    if (lamp) {
      setLampState(lamp, light);
      igniteLamp(lamp);
      if (light === 'red') lamp.classList.add('is-flash');
      // The row carrying this point lights up with its lamp, so row, lamp and
      // quote stay one visual unit while the sequence plays.
      lamp.closest('.point-row')?.setAttribute('data-state', light);
      if (!reduced) waveRow(lamp, light);
    }
    if (index === list.length - 1) renderScore(list.map(v => ({ light: validLight(v.light) })));
    finished += 1;
    if (finished === list.length) settle();
  };

  list.forEach((verdict, index) => {
    timers.push(setTimeout(() => reveal(verdict, index), index * STEP_MS));
  });
  if (!list.length) settle();

  return {
    done,
    cancel() {
      cancelled = true;
      for (const timer of timers) clearTimeout(timer);
      settle();
    },
  };
}

// ------------------------------------------------------------- ?fx=demo

// Local demo switch for screen recordings. It first switches to the Redis
// question's L1, so the fake verdicts carry that layer's real rubric IDs and
// the answer maps one-to-one onto the three points shown on screen.
const DEMO_QUESTION = 'redis-expiration-v2';
const DEMO_ANSWER =
  '对已有的键执行 EXPIRE key 60，就是把它的生存时间设成 60 秒，到期之后由过期机制移除。普通新建的键默认没有过期时间，除非写入时就显式设置，或者之后再补上。但要记住过期删除并不精确，不能拿它当业务任务调度器。';
const demoVerdicts = () => [
  {
    pointId: 'redis-expiration-v2-l1-c01',
    light: 'green',
    reason: '说清了 EXPIRE 的含义和秒级单位。',
    quote: '把它的生存时间设成 60 秒',
  },
  {
    pointId: 'redis-expiration-v2-l1-c02',
    light: 'amber',
    reason: '提到了默认没有过期时间，但没点明是普通新建的键。',
    quote: '',
  },
  {
    pointId: 'redis-expiration-v2-l1-c03',
    light: 'red',
    reason: '把过期删除当成精确调度，结论文不对题。',
    quote: '不能拿它当业务任务调度器',
  },
];

function bootDemo() {
  const $ = id => document.getElementById(id);
  let running = false;

  const replay = document.createElement('button');
  replay.type = 'button';
  replay.className = 'button secondary fx-demo-replay';
  replay.textContent = '重播判定动效';

  async function run() {
    if (running) return;
    running = true;
    try {
      const answer = $('answer');
      const form = $('answer-form');
      const before = $('before-answer');
      if (!answer || !form || !before) return;
      // Pin the demo to the Redis question's L1 before typing anything.
      const category = $('category');
      if (category && category.value) {
        category.value = '';
        category.dispatchEvent(new Event('change'));
      }
      const picker = $('question');
      if (picker && picker.value !== DEMO_QUESTION) {
        picker.value = DEMO_QUESTION;
        picker.dispatchEvent(new Event('change'));
      }
      answer.value = DEMO_ANSWER;
      form.requestSubmit();
      await new Promise(resolve => setTimeout(resolve, 60));
      const details = before.closest('details');
      if (details) details.open = true;
      const lamps = [...document.querySelectorAll('#rubric .point-lamp .lamp')];
      for (const lamp of lamps) setLampState(lamp, 'off');
      before.scrollIntoView({ block: 'center' });
      const stop = startScan(before);
      await new Promise(resolve => setTimeout(resolve, 2 * SCAN_MS));
      stop();
      const verdicts = demoVerdicts();
      const player = playVerdict({ verdicts, answerEl: before, lampEls: lamps });
      await player.done;
      // Mirror what the real wiring does after adopting a suggestion: rows and
      // the layer lamp follow the verdicts. Demo-only; no judging logic here.
      document.querySelectorAll('#rubric .point-row').forEach((row, index) => {
        if (verdicts[index]) row.dataset.state = verdicts[index].light;
      });
      const slotLamp = document.querySelector('#layer-light-slot .lamp');
      if (slotLamp) {
        setLampState(slotLamp, layerLightOf(verdicts));
        slotLamp.classList.remove('is-pending');
        igniteLamp(slotLamp);
      }
    } finally {
      running = false;
    }
  }

  replay.addEventListener('click', run);
  document.body.append(replay);

  // Wait until the question bank finishes loading, then auto-play once.
  const wait = setInterval(() => {
    const body = $('practice-body');
    if (body && !body.hidden) {
      clearInterval(wait);
      run();
    }
  }, 200);
  setTimeout(() => clearInterval(wait), 30000);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (new URLSearchParams(window.location.search).get('fx') === 'demo') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootDemo, { once: true });
    } else {
      bootDemo();
    }
  }
}
