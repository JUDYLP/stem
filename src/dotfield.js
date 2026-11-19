// Fixed dot-field background. Pure maths lives at the top so it can be tested
// without a DOM; the renderer only runs in a browser.

export const SPACING_DESKTOP = 28;
export const SPACING_NARROW = 32;
export const NARROW_MAX = 480;
export const LAMP_RADIUS = 160;
export const MAX_TINT = 0.5;
export const RIPPLE_MS = 1200;
export const RIPPLE_SPREAD = 320;
export const RIPPLE_BAND = 56;
export const BASE_MIN = 0.08;
export const BASE_MAX = 0.20;
export const WAVE_PERIOD = 12000;
export const WAVE_SIGMA = 0.2;
export const SPOT_RADIUS = 180;
export const SPOT_ALPHA = 0.45;
export const SPOT_LAMP_RADIUS = 220;
export const SPOT_EASE = 0.15;

export function spacingFor(width) {
  return width <= NARROW_MAX ? SPACING_NARROW : SPACING_DESKTOP;
}

// Smoothstep falloff: 1 at the lamp, 0 at the radius edge, monotonic between.
export function falloff(distance, radius = LAMP_RADIUS) {
  if (!(radius > 0)) return 0;
  const value = Number(distance);
  if (!Number.isFinite(value)) return 0;
  const d = Math.abs(value);
  if (d >= radius) return 0;
  const t = 1 - d / radius;
  return t * t * (3 - 2 * t);
}

export function tintStrength(distance, radius = LAMP_RADIUS) {
  return falloff(distance, radius) * MAX_TINT;
}

// Only the hero example panel is a page-level light source. Other lamps live
// inside opaque panels: if they sit more than 80px from that panel edge they
// must not paint stray dots outside it.
export function spillAllowed(distanceToEdge, isHeroPanel = false, limit = 80) {
  return isHeroPanel && Number.isFinite(distanceToEdge) && distanceToEdge <= limit;
}

// A wide diagonal band travels across the screen once every 12 seconds.
export function screenPhase(x, y, width, height) {
  const diagonal = width * 0.62 + height * 0.78;
  if (!(diagonal > 0)) return 0;
  return (x * 0.62 + y * 0.78) / diagonal;
}

export function waveAlpha(phase, time, intensity = 1) {
  const center = ((Number(time) || 0) % WAVE_PERIOD) / WAVE_PERIOD;
  let delta = (Number(phase) || 0) - center;
  delta -= Math.round(delta);
  const band = Math.exp(-(delta * delta) / (2 * WAVE_SIGMA * WAVE_SIGMA));
  const amplitude = (BASE_MAX - BASE_MIN) * Math.max(0, Math.min(1, intensity));
  return BASE_MIN + amplitude * band;
}

export function spotFalloff(distance, radius = SPOT_RADIUS) {
  return falloff(distance, radius);
}

const COLORS = {
  white: [255, 255, 255],
  green: [34, 197, 94],
  amber: [245, 165, 36],
  red: [255, 69, 58],
  spot: [214, 226, 255],
};
const STATE_INDEX = { green: 1, amber: 2, red: 3 };
const CSS_COLORS = ['#ffffff', '#22c55e', '#f5a524', '#ff453a', '#d6e2ff'];
const LEVELS = 16;
const MAX_DRAW_ALPHA = 0.8;
// A little under 33.3ms so a 60Hz display always gets every second frame.
const FRAME_BUDGET = 1000 / 30 - 2;
const PANEL_SELECTOR = '.example-panel, .practice-panel, .records-panel, .answer-card, .layer-body';
const LAMP_SELECTOR = [
  '.lamp[data-state="green"]', '.lamp[data-state="amber"]', '.lamp[data-state="red"]',
  '.heat-cell[data-state="green"]', '.heat-cell[data-state="amber"]', '.heat-cell[data-state="red"]',
].join(', ');

export function initDotfield(canvas) {
  if (!canvas || typeof canvas.getContext !== 'function') return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });
  let { width, height } = viewport();
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let spacing = spacingFor(width);
  let dots = [];
  let lamps = [];
  let allLamps = [];
  let ripples = [];
  let quiet = false;
  let raf = 0;
  let lastFrame = 0;
  let lastScan = 0;
  let scrollTimer = 0;
  const perf = { frames: 0, total: 0, last: 0, avg: 0, max: 0, interval: 0, intervalAvg: 0, intervals: 0 };
  const buckets = Array.from({ length: 5 * LEVELS }, () => []);
  const motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let reduced = !!motion?.matches;
  const finePointer = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false, overPanel: false, suspended: false, strength: 0, moved: false, locked: false };

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    ({ width, height } = viewport());
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spacing = spacingFor(width);
    buildDots();
    collectLamps();
  }

  function buildDots() {
    dots = [];
    for (let y = spacing / 2; y < height; y += spacing) {
      for (let x = spacing / 2; x < width; x += spacing) dots.push({ x, y });
    }
  }

  function collectLamps() {
    const found = [];
    const visible = [];
    const root = document.querySelector('main') || document;
    for (const element of root.querySelectorAll(LAMP_SELECTOR)) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.bottom < -40 || rect.top > height + 40 || rect.right < -40 || rect.left > width + 40) continue;
      const color = element.dataset.state;
      if (!STATE_INDEX[color]) continue;
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      visible.push({ x, y, color });
      const panel = element.closest(PANEL_SELECTOR);
      if (panel) {
        const panelRect = panel.getBoundingClientRect();
        const distanceToEdge = Math.min(x - panelRect.left, panelRect.right - x, y - panelRect.top, panelRect.bottom - y);
        if (!spillAllowed(distanceToEdge, panel.classList.contains('example-panel'))) continue;
      }
      found.push({ x, y, color });
    }
    lamps = found;
    allLamps = visible;
  }

  function updatePointer() {
    if (pointer.locked) return;
    const target = (finePointer && pointer.active && !pointer.overPanel && !pointer.suspended) ? 1 : 0;
    pointer.strength += (target - pointer.strength) * SPOT_EASE;
    if (pointer.strength < 0.005) pointer.strength = 0;
    if (pointer.moved) {
      pointer.x += (pointer.tx - pointer.x) * SPOT_EASE;
      pointer.y += (pointer.ty - pointer.y) * SPOT_EASE;
    }
  }

  function draw(now, staticMode) {
    const start = performance.now();
    const intensity = quiet ? 0.3 : 1;
    if (!staticMode) {
      updatePointer();
      ripples = ripples.filter(ripple => now - ripple.start < ripple.duration);
    } else {
      pointer.strength = 0;
      ripples = [];
    }
    for (const bucket of buckets) bucket.length = 0;

    const diagonal = width * 0.62 + height * 0.78;
    const radiusSq = LAMP_RADIUS * LAMP_RADIUS;
    const spotActive = !staticMode && finePointer && pointer.strength > 0.01;
    const spotR2 = SPOT_RADIUS * SPOT_RADIUS;
    let spotColorIndex = 4;
    if (spotActive) {
      let best = 0;
      for (const lamp of allLamps) {
        const f = falloff(Math.hypot(pointer.x - lamp.x, pointer.y - lamp.y), SPOT_LAMP_RADIUS);
        if (f > best) {
          best = f;
          spotColorIndex = STATE_INDEX[lamp.color];
        }
      }
      if (best < 0.12) spotColorIndex = 4;
    }

    for (const dot of dots) {
      let alpha = staticMode
        ? (BASE_MIN + BASE_MAX) / 2
        : waveAlpha(diagonal ? (dot.x * 0.62 + dot.y * 0.78) / diagonal : 0, now, intensity);
      let colorIndex = 0;

      let bestTint = 0;
      for (const lamp of lamps) {
        const dx = dot.x - lamp.x;
        const dy = dot.y - lamp.y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq >= radiusSq) continue;
        const strength = tintStrength(Math.sqrt(distanceSq)) * intensity;
        if (strength > bestTint) {
          bestTint = strength;
          colorIndex = STATE_INDEX[lamp.color];
        }
      }
      if (bestTint > 0) alpha = Math.min(0.62, alpha + bestTint);

      for (const ripple of ripples) {
        const age = now - ripple.start;
        if (age < 0 || age > ripple.duration) continue;
        const radius = (age / ripple.duration) * ripple.spread;
        const dx = dot.x - ripple.x;
        const dy = dot.y - ripple.y;
        const distance = Math.hypot(dx, dy);
        if (Math.abs(distance - radius) > RIPPLE_BAND) continue;
        const fade = Math.pow(1 - age / ripple.duration, 0.6);
        const strength = ripple.strength * fade * falloff(Math.abs(distance - radius), RIPPLE_BAND) * intensity;
        if (strength > bestTint) {
          bestTint = strength;
          alpha = Math.min(0.7, alpha + strength);
          colorIndex = STATE_INDEX[ripple.color];
        }
      }

      if (spotActive) {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq < spotR2) {
          const spot = SPOT_ALPHA * falloff(Math.sqrt(distanceSq), SPOT_RADIUS) * pointer.strength;
          if (spot > alpha) {
            alpha = spot;
            colorIndex = spotColorIndex;
          }
        }
      }

      const level = Math.min(LEVELS - 1, Math.max(0, Math.floor((alpha / MAX_DRAW_ALPHA) * LEVELS)));
      buckets[colorIndex * LEVELS + level].push(dot.x, dot.y);
    }

    ctx.clearRect(0, 0, width, height);
    for (let index = 0; index < buckets.length; index += 1) {
      const bucket = buckets[index];
      if (!bucket.length) continue;
      const colorIndex = Math.floor(index / LEVELS);
      const level = index % LEVELS;
      ctx.globalAlpha = ((level + 0.5) / LEVELS) * MAX_DRAW_ALPHA;
      ctx.fillStyle = CSS_COLORS[colorIndex];
      for (let item = 0; item < bucket.length; item += 2) {
        ctx.fillRect(bucket[item] - 1, bucket[item + 1] - 1, 2, 2);
      }
    }
    ctx.globalAlpha = 1;

    perf.last = performance.now() - start;
    perf.frames += 1;
    perf.total += perf.last;
    perf.avg = perf.total / perf.frames;
    perf.max = Math.max(perf.max, perf.last);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - lastFrame < FRAME_BUDGET) return;
    if (lastFrame > 0) {
      perf.interval = now - lastFrame;
      perf.intervalAvg = perf.intervals === 0 ? perf.interval : (perf.intervalAvg * perf.intervals + perf.interval) / (perf.intervals + 1);
      perf.intervals += 1;
    }
    lastFrame = now;
    if (now - lastScan > 500) {
      lastScan = now;
      collectLamps();
    }
    draw(now, false);
  }

  function start() {
    if (reduced || raf) return;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function drawStatic() {
    collectLamps();
    draw(performance.now(), true);
  }

  function onScroll() {
    if (scrollTimer) return;
    scrollTimer = setTimeout(() => {
      scrollTimer = 0;
      collectLamps();
      if (reduced) drawStatic();
    }, 120);
  }

  function onResize() {
    resizeCanvas();
    if (reduced) drawStatic();
  }

  function pushRipple(x, y, color, { spread = RIPPLE_SPREAD, duration = RIPPLE_MS, strength = 0.8 } = {}) {
    if (!STATE_INDEX[color]) return;
    ripples.push({ x, y, color, start: performance.now(), spread, duration, strength });
    if (ripples.length > 8) ripples.shift();
  }

  function onLampLit(event) {
    const element = event.detail && event.detail.element;
    if (!element || !element.dataset) return;
    collectLamps();
    const color = element.dataset.state;
    if (!STATE_INDEX[color]) return;
    if (reduced) {
      drawStatic();
      return;
    }
    // FX choreography fires its own tuned ripple; skip the default one then.
    if (event.detail.ripple === false) return;
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > height || rect.right < 0 || rect.left > width) return;
    pushRipple(rect.left + rect.width / 2, rect.top + rect.height / 2, color);
  }

  document.addEventListener('focusin', event => {
    if (event.target instanceof Element && event.target.matches('#answer, #retry-answer')) {
      quiet = true;
      pointer.suspended = true;
    }
  });
  document.addEventListener('focusout', event => {
    if (event.target instanceof Element && event.target.matches('#answer, #retry-answer')) {
      quiet = false;
      pointer.suspended = false;
    }
  });
  if (finePointer) {
    window.addEventListener('pointermove', event => {
      pointer.tx = event.clientX;
      pointer.ty = event.clientY;
      if (!pointer.moved) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
        pointer.moved = true;
      }
      pointer.active = true;
      pointer.locked = false;
      pointer.overPanel = !!(event.target instanceof Element && event.target.closest(PANEL_SELECTOR));
    }, { passive: true });
    window.addEventListener('pointerout', event => {
      if (!event.relatedTarget) pointer.active = false;
    });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('lamp:lit', onLampLit);
  motion?.addEventListener?.('change', event => {
    reduced = event.matches;
    if (reduced) {
      stop();
      drawStatic();
    } else {
      start();
    }
  });

  resizeCanvas();
  if (reduced) drawStatic();
  else start();

  const api = {
    perf,
    refresh: collectLamps,
    redraw: drawStatic,
    get spacing() { return spacing; },
    get lampCount() { return lamps.length; },
    get quiet() { return quiet; },
    get reduced() { return reduced; },
    get rippleCount() { return ripples.length; },
    get pointerStrength() { return pointer.strength; },
    spotlightAt(x, y, strength = 1) {
      pointer.x = x; pointer.y = y; pointer.tx = x; pointer.ty = y;
      pointer.moved = true; pointer.active = true; pointer.overPanel = false; pointer.suspended = false;
      pointer.strength = strength;
      pointer.locked = true;
      if (!reduced) draw(performance.now(), false);
    },
    get finePointer() { return finePointer; },
    // Tuned ripple for choreographed moments (e.g. verdict FX). No-op while
    // reduced motion is on.
    ripple(x, y, color, options) {
      if (reduced) return;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      pushRipple(x, y, color, options);
    },
  };
  window.__dotfield = api;

  // Optional verdict-moment demo (?fx=demo). Loaded dynamically so node tests
  // never touch DOM code and main.js stays free for the Codex wiring.
  if (new URLSearchParams(window.location.search).get('fx') === 'demo') {
    import('./fx/verdict-fx.js').catch(() => {});
  }

  return api;
}
