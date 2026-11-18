import { t, getLanguage } from './i18n.js';
import { setLampState, ignite } from './lights.js';

const LOCAL_URL = new URL('../data/hero-demo.v1.json', import.meta.url);
const POINT_LIGHTS = ['green', 'amber', 'red'];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

// The preset judgment mirrors the shape a live model will return later:
// every point has {pointId, light, reason, quote}. Bilingual extras keep the
// demo readable in both languages.
export function validateHeroDemo(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('示例判定必须是对象');
  if (data.schemaVersion !== 1) throw new Error('示例判定版本不兼容');
  const pointIds = data.pointIds;
  if (!Array.isArray(pointIds) || pointIds.length !== 3 || new Set(pointIds).size !== 3) {
    throw new Error('示例要点必须是三个唯一 ID');
  }
  if (!Array.isArray(data.options) || data.options.length !== 3) throw new Error('示例必须提供三个回答');
  const optionIds = new Set();
  for (const option of data.options) {
    if (!option || !nonempty(option.id) || optionIds.has(option.id)) throw new Error('回答 ID 无效或重复');
    if (!nonempty(option.text) || !nonempty(option.textEn)) throw new Error('回答缺少双语文本');
    optionIds.add(option.id);
  }
  if (!data.judgments || typeof data.judgments !== 'object') throw new Error('缺少预设判定');
  if (Object.keys(data.judgments).length !== optionIds.size) throw new Error('预设判定与回答数量不一致');
  for (const [optionId, judgment] of Object.entries(data.judgments)) {
    if (!optionIds.has(optionId)) throw new Error('预设判定指向未知回答');
    if (!judgment || !Array.isArray(judgment.points) || judgment.points.length !== pointIds.length) {
      throw new Error('每条判定必须覆盖三个要点');
    }
    const option = data.options.find(item => item.id === optionId);
    const seen = new Set();
    let hasRed = false;
    for (const point of judgment.points) {
      if (!point || !pointIds.includes(point.pointId) || seen.has(point.pointId)) throw new Error('判定要点 ID 无效或重复');
      if (!POINT_LIGHTS.includes(point.light)) throw new Error('灯色无效');
      if (!nonempty(point.reason) || !nonempty(point.reasonEn)) throw new Error('判定理由为空');
      const quote = typeof point.quote === 'string' ? point.quote : '';
      const quoteEn = typeof point.quoteEn === 'string' ? point.quoteEn : '';
      if (nonempty(quote) !== nonempty(quoteEn)) throw new Error('引用必须双语同时存在或同时为空');
      if (quote && !option.text.includes(quote)) throw new Error('引用必须来自所选回答');
      if (quoteEn && !option.textEn.includes(quoteEn)) throw new Error('引用必须来自所选回答');
      if (point.light === 'red') hasRed = true;
      seen.add(point.pointId);
    }
    if (hasRed && (!nonempty(judgment.followup) || !nonempty(judgment.followupEn))) {
      throw new Error('含红灯的判定必须提供追问');
    }
  }
  return data;
}

function localize(item, key) {
  return getLanguage() === 'zh' ? item[key] : item[`${key}En`];
}

export function initDemo() {
  const $ = id => document.getElementById(id);
  const pointsHost = $('hero-points');
  const optionsHost = $('hero-options');
  const followup = $('hero-followup');
  const result = $('hero-result');
  const tryButton = $('hero-try');
  const status = $('hero-status');
  const glow = $('hero-glow');
  const replay = $('replay-demo');
  if (!pointsHost || !optionsHost) return;

  const points = [...pointsHost.querySelectorAll('[data-point]')].map(row => ({
    id: row.dataset.point,
    row,
    lamp: row.querySelector('.lamp'),
    reason: row.querySelector('.point-reason'),
    quote: row.querySelector('.point-quote'),
  }));
  let data = null;
  let currentOption = null;
  let timers = [];
  let glowTimer = 0;
  let autoTimer = 0;
  let autoPlay = true;

  function setGlow(light, pulse = true) {
    if (!glow) return;
    glow.dataset.light = ['green', 'amber', 'red'].includes(light) ? light : 'white';
    if (!pulse) return;
    glow.classList.remove('is-pulsing');
    void glow.offsetWidth;
    glow.classList.add('is-pulsing');
    clearTimeout(glowTimer);
    glowTimer = setTimeout(() => glow.classList.remove('is-pulsing'), 1000);
  }

  function resetPoints() {
    for (const point of points) {
      setLampState(point.lamp, 'off');
      point.row.dataset.state = 'off';
      point.reason.hidden = true;
      point.reason.textContent = '';
      point.quote.hidden = true;
      point.quote.textContent = '';
    }
  }

  function clearTimers() {
    for (const timer of timers) clearTimeout(timer);
    timers = [];
  }

  function stopAuto() {
    autoPlay = false;
    clearTimeout(autoTimer);
  }

  function summary(judgment) {
    const counts = { green: 0, amber: 0, red: 0 };
    for (const point of judgment.points) counts[point.light] += 1;
    return t('预设判定：{green} 条讲清了，{amber} 条还差一点，{red} 条漏掉了。', counts);
  }

  function finalize(judgment, announce = true) {
    const hasRed = judgment.points.some(point => point.light === 'red');
    const allGreen = judgment.points.every(point => point.light === 'green');
    if (hasRed) {
      followup.textContent = t('追问：{question}', { question: localize(judgment, 'followup') });
      followup.hidden = false;
      requestAnimationFrame(() => followup.classList.add('is-shown'));
      tryButton.hidden = true;
    } else if (allGreen) {
      followup.hidden = true;
      followup.classList.remove('is-shown');
      tryButton.hidden = false;
    } else {
      followup.hidden = true;
      followup.classList.remove('is-shown');
      tryButton.hidden = true;
    }
    if (announce) status.textContent = summary(judgment);
  }

  function paintPoint(point, judgmentPoint) {
    setLampState(point.lamp, judgmentPoint.light);
    ignite(point.lamp);
    point.row.dataset.state = judgmentPoint.light;
    const showReason = judgmentPoint.light !== 'green';
    point.reason.textContent = showReason ? localize(judgmentPoint, 'reason') : '';
    point.reason.hidden = !showReason;
    const quoteText = localize(judgmentPoint, 'quote');
    point.quote.textContent = quoteText ? (getLanguage() === 'zh' ? `「${quoteText}」` : `“${quoteText}”`) : '';
    point.quote.hidden = !quoteText;
  }

  function applyOption(id, { animate = true, announce = true } = {}) {
    if (!data) return;
    const option = data.options.find(item => item.id === id);
    const judgment = data.judgments[id];
    if (!option || !judgment) return;
    clearTimers();
    currentOption = id;
    for (const button of optionsHost.querySelectorAll('.hero-option')) {
      button.setAttribute('aria-pressed', String(button.dataset.option === id));
    }
    resetPoints();
    result.hidden = false;
    followup.hidden = true;
    followup.classList.remove('is-shown');
    tryButton.hidden = true;
    status.textContent = '';
    setGlow('off', false);

    if (!animate || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      for (const judgmentPoint of judgment.points) {
        const point = points.find(item => item.id === judgmentPoint.pointId);
        if (point) paintPoint(point, judgmentPoint);
      }
      setGlow(judgment.points[judgment.points.length - 1].light, false);
      finalize(judgment, announce);
      return;
    }

    judgment.points.forEach((judgmentPoint, index) => {
      timers.push(setTimeout(() => {
        const point = points.find(item => item.id === judgmentPoint.pointId);
        if (!point) return;
        paintPoint(point, judgmentPoint);
        setGlow(judgmentPoint.light);
        if (index === judgment.points.length - 1) {
          timers.push(setTimeout(() => finalize(judgment, announce), 360));
        }
      }, 380 + index * 480));
    });
  }

  function renderOptions() {
    optionsHost.querySelectorAll('.hero-option').forEach(button => button.remove());
    for (const option of data.options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hero-option';
      button.dataset.option = option.id;
      button.textContent = localize(option, 'text');
      button.setAttribute('aria-pressed', String(option.id === currentOption));
      button.addEventListener('click', () => {
        stopAuto();
        applyOption(option.id);
      });
      optionsHost.append(button);
    }
  }

  async function load() {
    try {
      const response = await fetch(LOCAL_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error('示例判定加载失败');
      data = validateHeroDemo(await response.json());
      renderOptions();
      setGlow('off', false);
      autoTimer = setTimeout(() => {
        if (autoPlay) applyOption(data.options[0].id);
      }, 700);
    } catch {
      optionsHost.hidden = true;
      status.textContent = t('示例判定暂不可用');
    }
  }

  tryButton.addEventListener('click', () => {
    document.getElementById('practice')?.scrollIntoView({ block: 'start' });
  });

  replay.addEventListener('click', () => {
    stopAuto();
    if (data) applyOption(currentOption || data.options[0].id);
  });

  window.addEventListener('language:changed', () => {
    if (!data) return;
    stopAuto();
    renderOptions();
    if (currentOption) applyOption(currentOption, { animate: false, announce: false });
  });

  load();
}
