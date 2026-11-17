import { t, localized, getLanguage, initLanguage, setLanguage, applyLanguage } from './i18n.js';
import { loadQuestions } from './questions.js';
import { createProgressStore } from './storage.js';
import { createHistoryStore, latestByCell } from './history.js';
import { reviewItems, buildCrashSheet, downloadCrashSheet } from './export.js';
import { initDemo } from './demo.js';
import {
  createLamp, setLampState, ignite, nextLight, summarizeLights,
  statusForLight, lightForStatus, lightLabel, getSuggestion, clearSuggestion, suggestLights,
} from './lights.js';

const $ = id => document.getElementById(id);
initLanguage(location.search, navigator.language);
applyLanguage();
initDemo();

const store = createProgressStore();
const log = createHistoryStore();
const drafts = new Map();
let questions = [];
let questionId = '';
let layerIndex = 0;
let revealObserved = false;

const current = () => questions.find(question => question.id === questionId);
const currentLayer = () => current().layers[layerIndex];
const key = () => `${questionId}::L${layerIndex + 1}`;
const cellKey = (id, layerId) => `${id}::${layerId}`;
const byId = (selector, className, text) => {
  const node = document.createElement(selector);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const formatTime = ts => new Date(ts).toLocaleString(getLanguage() === 'zh' ? 'zh-CN' : 'en-US', {
  month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});

function draft() {
  if (!drafts.has(key())) drafts.set(key(), { text: '', submitted: null, retry: '', lights: [], confirmed: null });
  return drafts.get(key());
}

function index() {
  const entries = log.snapshot().entries;
  return { entries, latest: latestByCell(entries), progress: store.snapshot() };
}

function lightOf(data, id, layerId) {
  const entry = data.latest.get(cellKey(id, layerId));
  return entry ? entry.light : lightForStatus(data.progress.items[cellKey(id, layerId)]?.status);
}

function resizeAnswer() {
  const input = $('answer');
  if (!input.getClientRects().length) return;
  input.style.height = 'auto';
  input.style.height = `${input.scrollHeight + 2}px`;
}

function updateAnswerSize() {
  $('answer-count').textContent = `${$('answer').value.length} / 8000`;
  $('answer-count').hidden = $('answer').value.length <= 7000;
  resizeAnswer();
}

window.addEventListener('resize', resizeAnswer);

function option(value, text) {
  const node = document.createElement('option');
  node.value = value;
  node.textContent = text;
  return node;
}

function renderTabs() {
  const data = index();
  const question = current();
  $('depth-meter').replaceChildren(...question.layers.map((layer, index) => {
    const button = byId('button');
    button.type = 'button';
    button.setAttribute('aria-current', String(index === layerIndex));
    button.append(createLamp(lightOf(data, question.id, layer.id), { label: false }));
    button.append(byId('span', 'tab-text', `${layer.id} ${layer.label}`));
    button.addEventListener('click', () => { layerIndex = index; renderLayer(); });
    return button;
  }));
}

function renderLayerLight() {
  const d = draft();
  const light = d.submitted !== null ? summarizeLights(d.lights) : lightOf(index(), questionId, currentLayer().id);
  const lamp = createLamp(light);
  if (d.submitted !== null && light === 'amber' && !d.confirmed) lamp.classList.add('is-pending');
  $('layer-light-slot').replaceChildren(lamp);
}

function fillRubric() {
  const d = draft();
  const layer = currentLayer();
  $('rubric').replaceChildren(...localized(layer, 'rubric').map((text, index) => {
    const item = byId('li');
    item.style.setProperty('--i', String(index));
    const button = byId('button', 'point');
    button.type = 'button';
    const lamp = createLamp(d.lights[index] || 'amber');
    lamp.dataset.point = String(index);
    const body = byId('span', 'point-text', text);
    button.append(lamp, body);
    button.setAttribute('aria-label', `${text} · ${lightLabel(d.lights[index] || 'amber')}`);
    button.addEventListener('click', () => {
      d.lights[index] = nextLight(d.lights[index] || 'amber');
      setLampState(lamp, d.lights[index]);
      ignite(lamp);
      if (d.lights[index] === 'red') lamp.classList.add('is-flash');
      button.setAttribute('aria-label', `${text} · ${lightLabel(d.lights[index])}`);
      d.confirmed = null;
      renderLayerLight();
      $('rating-status').textContent = t('灯变了，记得再点确认判定。');
    });
    item.append(button);
    return item;
  }));
}

function renderSuggestion() {
  const suggestion = getSuggestion(questionId, currentLayer().id);
  $('suggestion-bar').hidden = !suggestion;
  $('apply-suggestion').onclick = () => {
    const d = draft();
    d.lights = currentLayer().rubric.map((_, index) => suggestion[index] || 'amber');
    d.confirmed = null;
    fillRubric();
    renderLayerLight();
    $('rating-status').textContent = t('建议已采用，仍需你确认判定。');
    clearSuggestion(questionId, currentLayer().id);
    $('suggestion-bar').hidden = true;
  };
}

function renderLayer() {
  const question = current();
  const layer = currentLayer();
  const d = draft();
  $('layer-label').textContent = `${question.category} / ${layer.id} ${layer.label}`;
  $('question-title').textContent = localized(question, 'title');
  $('layer-prompt').textContent = localized(layer, 'prompt');
  $('answer').value = d.text;
  updateAnswerSize();
  $('answer-message').textContent = '';
  $('self-check').hidden = d.submitted === null;
  $('before-answer').textContent = d.submitted || '';
  $('retry-answer').value = d.retry;
  if (d.submitted !== null) {
    if (!d.lights.length) d.lights = layer.rubric.map(() => 'amber');
    fillRubric();
  } else {
    $('rubric').replaceChildren();
  }
  $('rating-status').textContent = t('该层最近一次判定：{light}。', { light: lightLabel(lightOf(index(), questionId, layer.id)) });
  renderTabs();
  renderLayerLight();
  renderSuggestion();
}

function selectQuestion(id) {
  questionId = id;
  layerIndex = 0;
  $('question').value = id;
  renderLayer();
}

function filtered() {
  return questions.filter(question => !$('category').value || question.category === $('category').value);
}

function renderOptions(preferred = questionId) {
  const list = filtered();
  $('question').replaceChildren(...list.map(question => option(question.id, localized(question, 'title'))));
  if (!list.length) return;
  selectQuestion(list.some(question => question.id === preferred) ? preferred : list[0].id);
}

function openCell(id, layerId) {
  const question = questions.find(entry => entry.id === id);
  if (!question) return;
  $('category').value = '';
  renderOptions(id);
  const index = question.layers.findIndex(layer => layer.id === layerId);
  layerIndex = index >= 0 ? index : 0;
  renderLayer();
  $('question-title').scrollIntoView({ block: 'start' });
  $('answer').focus({ preventScroll: true });
}

function heatTooltip(question, layer, entry) {
  const time = entry ? formatTime(entry.ts) : t('未作答');
  return `${localized(question, 'title')} · ${layer.id} ${layer.label} · ${time}`;
}

function renderRecords({ changed = null } = {}) {
  if (!questions.length) return;
  const data = index();
  const review = reviewItems(questions, data.progress);
  const counts = { green: 0, amber: 0, red: 0, off: 0 };

  $('heat-body').replaceChildren(...questions.map((question, row) => {
    const tr = byId('tr');
    const th = byId('th');
    th.scope = 'row';
    th.append(byId('span', 'mono', question.category), byId('span', 'heat-title', localized(question, 'title')));
    tr.append(th);
    question.layers.forEach((layer, column) => {
      const td = byId('td');
      const entry = data.latest.get(cellKey(question.id, layer.id));
      const light = lightOf(data, question.id, layer.id);
      counts[light] += 1;
      const button = byId('button', 'heat-cell');
      button.type = 'button';
      button.dataset.tip = heatTooltip(question, layer, entry);
      button.setAttribute('aria-label', `${localized(question, 'title')} · ${layer.id} ${layer.label} · ${lightLabel(light)}`);
      button.style.setProperty('--reveal-delay', `${(row + column) * 90}ms`);
      button.style.setProperty('--wave-delay', '0ms');
      button.append(createLamp(light, { label: false }));
      if (changed === cellKey(question.id, layer.id)) {
        button.classList.add('is-changed');
        ignite(button.firstElementChild);
      }
      button.addEventListener('click', () => openCell(question.id, layer.id));
      td.append(button);
      tr.append(td);
    });
    return tr;
  }));

  if (changed) {
    const cells = [...$('heat-body').querySelectorAll('.heat-cell')];
    const target = $('heat-body').querySelector('.heat-cell.is-changed');
    if (target) {
      // Ripple outwards from the updated cell, one faint wave per distance.
      cells.forEach(cell => {
        const row = cell.closest('tr').rowIndex - 1;
        const column = cell.cellIndex - 1;
        const distance = Math.abs(row - (target.closest('tr').rowIndex - 1)) + Math.abs(column - (target.cellIndex - 1));
        if (distance === 0) return;
        cell.classList.add('is-wave');
        cell.style.setProperty('--wave-delay', `${distance * 80}ms`);
      });
    }
  }

  $('heat-stats').textContent = t('绿 {green} / 琥珀 {amber} / 红 {red} / 未作答 {off}', counts);
  $('save-answers').checked = log.saveAnswers;
  $('export-review').disabled = !review.length;
  $('export-hint').hidden = review.length > 0;
  $('storage-warning').textContent = [store.warning, log.warning].filter(Boolean).join(' ');
  $('storage-warning').hidden = !$('storage-warning').textContent;
  renderTimeline(data);
  observeHeatmap();
}

function traceFor(data, entry, upTo) {
  const sequence = [];
  for (const item of data.entries) {
    if (item.questionId === entry.questionId && item.layer === entry.layer) sequence.push(item);
    if (item === upTo) break;
  }
  return sequence;
}

function renderTimeline(data) {
  const entries = [...data.entries].reverse();
  $('timeline-empty').hidden = entries.length > 0;
  $('timeline-count').textContent = entries.length ? t('{count} 次判定', { count: entries.length }) : '';
  $('timeline').replaceChildren(...entries.map(entry => {
    const question = questions.find(item => item.id === entry.questionId);
    if (!question) return byId('li');
    const layer = question.layers.find(item => item.id === entry.layer);
    const item = byId('li', 'tl-item');
    const bar = byId('span', 'tl-bar');
    bar.dataset.state = entry.light;
    const main = byId('div', 'tl-main');
    const head = byId('div', 'tl-head');
    head.append(byId('span', 'mono tl-time', formatTime(entry.ts)), byId('span', 'tl-verdict', lightLabel(entry.light)));
    const jump = byId('button', 'tl-question', `${question.category} / ${entry.layer} · ${localized(question, 'title')}`);
    jump.type = 'button';
    jump.addEventListener('click', () => openCell(question.id, entry.layer));
    main.append(head, jump);

    if (layer && entry.missedPoints.length) {
      const rubric = localized(layer, 'rubric');
      const missed = entry.missedPoints.map(index => rubric[index]).filter(Boolean);
      if (missed.length) {
        const note = byId('p', 'tl-missed');
        note.append(createLamp('red', { label: false }), byId('span', '', missed.join(' / ')));
        main.append(note);
      }
    }

    const trace = traceFor(data, entry, entry);
    if (trace.length > 1) {
      const strip = byId('div', 'tl-trace');
      strip.setAttribute('aria-label', t('同一题层的灯色变化'));
      trace.forEach((step, index) => {
        if (index) strip.append(byId('span', 'arrow', '→'));
        strip.append(createLamp(step.light, { label: false }));
      });
      main.append(strip);
    }

    const lastForCell = data.entries.filter(item => item.questionId === entry.questionId && item.layer === entry.layer).at(-1);
    if (lastForCell === entry && log.saveAnswers && entry.answer) {
      const answers = data.entries.filter(item => item.questionId === entry.questionId && item.layer === entry.layer && item.answer);
      const first = answers[0];
      const last = answers[answers.length - 1];
      if (first && last) {
        const details = byId('details', 'tl-answers');
        details.append(byId('summary', '', t('对比首次与最近一次回答')));
        if (first === last) {
          details.append(byId('p', 'tl-answer', last.answer));
        } else {
          details.append(byId('p', 'tl-answer', `${t('首次')}：${first.answer}`), byId('p', 'tl-answer', `${t('最近一次')}：${last.answer}`));
        }
        main.append(details);
      }
    }
    item.append(bar, main);
    return item;
  }));
}

function observeHeatmap() {
  if (revealObserved || !('IntersectionObserver' in window)) {
    $('heatmap').classList.remove('is-revealed');
    return;
  }
  revealObserved = true;
  const observer = new IntersectionObserver(records => {
    if (!records.some(record => record.isIntersecting)) return;
    $('heatmap').classList.add('is-revealed');
    observer.disconnect();
    setTimeout(() => $('heatmap').classList.remove('is-revealed'), 1800);
  }, { threshold: .25 });
  observer.observe($('heatmap'));
}

$('category').addEventListener('change', () => renderOptions());
$('question').addEventListener('change', event => selectQuestion(event.target.value));
$('random-question').addEventListener('click', () => {
  const list = filtered();
  const others = list.filter(question => question.id !== questionId);
  const pool = others.length ? others : list;
  if (!pool.length) return;
  selectQuestion(pool[Math.floor(Math.random() * pool.length)].id);
});

$('answer').addEventListener('input', () => {
  const d = draft();
  d.text = $('answer').value;
  d.submitted = null;
  d.retry = '';
  d.lights = [];
  d.confirmed = null;
  updateAnswerSize();
  $('self-check').hidden = true;
  $('rubric').replaceChildren();
  $('rating-status').textContent = '';
  $('answer-message').textContent = t('修改后请重新提交，再进行自评。');
});

$('answer').addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    $('answer-form').requestSubmit();
  }
});

$('answer-form').addEventListener('submit', event => {
  event.preventDefault();
  const d = draft();
  d.text = $('answer').value;
  if (!d.text.trim() || d.text.length > 8000) {
    $('answer-message').textContent = t('请先写下 1–8000 个字符的解释（不能只有空白）。');
    $('answer').focus();
    return;
  }
  d.submitted = d.text;
  d.confirmed = null;
  d.lights = currentLayer().rubric.map(() => 'amber');
  fillRubric();
  $('rubric').classList.add('is-entering');
  setTimeout(() => $('rubric').classList.remove('is-entering'), 900);
  $('self-check').hidden = false;
  $('before-answer').textContent = d.submitted;
  $('retry-answer').value = d.retry;
  renderLayerLight();
  $('answer-message').textContent = t('已提交。对照要点，点灯判断每一条。');
});

$('confirm-rating').addEventListener('click', () => {
  const d = draft();
  if (d.submitted === null) return;
  const question = current();
  const layer = currentLayer();
  if (!d.lights.length) d.lights = layer.rubric.map(() => 'amber');
  const light = summarizeLights(d.lights);
  const status = statusForLight(light);
  store.rate(key(), status);
  log.add({
    questionId: question.id,
    layer: layer.id,
    light,
    pointLights: [...d.lights],
    missedPoints: d.lights.map((value, index) => (value === 'red' ? index : -1)).filter(index => index >= 0),
    answer: d.submitted,
  });
  d.confirmed = light;
  renderLayer();
  renderRecords({ changed: cellKey(question.id, layer.id) });
  $('rating-status').textContent = t('已记录：{light}。', { light: lightLabel(light) });
  const lamp = $('layer-light-slot').firstElementChild;
  if (lamp) {
    ignite(lamp);
    if (light === 'red') lamp.classList.add('is-flash');
  }
});

$('retry-answer').addEventListener('input', () => { draft().retry = $('retry-answer').value; });

$('save-answers').addEventListener('change', event => {
  log.setSaveAnswers(event.target.checked);
  renderRecords();
  $('export-message').textContent = event.target.checked
    ? t('已开启：之后的判定会保存回答原文，仅在本机。')
    : t('已关闭：已保存的回答原文已删除。');
});

$('export-review').addEventListener('click', () => {
  const text = buildCrashSheet(questions, store.snapshot(), getLanguage(), log.snapshot().entries);
  downloadCrashSheet(text);
  $('export-message').textContent = t('已生成 Markdown 复习单，请在浏览器下载列表中查看。');
});

$('clear-history').addEventListener('click', () => {
  const dialog = $('clear-dialog');
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else if (window.confirm(t('清空所有练习记录？'))) confirmClear();
});
$('clear-cancel').addEventListener('click', () => $('clear-dialog').close());

function confirmClear() {
  log.clear();
  store.clear();
  for (const d of drafts.values()) d.confirmed = null;
  $('clear-dialog').close();
  renderLayer();
  renderRecords();
  $('export-message').textContent = t('记录已清空。');
}
$('clear-confirm').addEventListener('click', confirmClear);

document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => {
  setLanguage(button.dataset.lang);
  const url = new URL(location.href);
  url.searchParams.set('lang', getLanguage());
  window.history.replaceState(null, '', url);
  applyLanguage();
  if (questions.length) {
    $('category').options[0].textContent = t('全部分类');
    for (const option of $('question').options) option.textContent = localized(questions.find(question => question.id === option.value), 'title');
    renderLayer();
    renderRecords();
    $('load-message').textContent = t('已加载 {count} 道题 · 无需 API Key', { count: questions.length });
    $('rating-status').textContent = draft().confirmed
      ? t('已记录：{light}。', { light: lightLabel(draft().confirmed) })
      : t('该层最近一次判定：{light}。', { light: lightLabel(lightOf(index(), questionId, currentLayer().id)) });
  } else if (!$('reload-questions').hidden) {
    $('load-message').textContent = t('题库加载失败，请确认通过 HTTP 打开且题库文件有效，再重试。');
  }
  $('export-message').textContent = '';
}));

async function boot() {
  $('reload-questions').hidden = true;
  $('practice-body').hidden = true;
  $('load-message').hidden = false;
  $('load-message').textContent = t('正在加载题库…');
  try {
    questions = await loadQuestions();
    $('category').replaceChildren(option('', t('全部分类')), ...[...new Set(questions.map(question => question.category))].map(category => option(category, category)));
    renderOptions();
    $('practice-body').hidden = false;
    $('load-message').textContent = t('已加载 {count} 道题 · 无需 API Key', { count: questions.length });
    renderRecords();
  } catch {
    $('load-message').textContent = t('题库加载失败，请确认通过 HTTP 打开且题库文件有效，再重试。');
    $('reload-questions').hidden = false;
  }
}
$('reload-questions').addEventListener('click', boot);
boot();

// Reserved integration point. A future live-AI response may propose point lights,
// but the UI only shows them; the learner still has to adopt and confirm.
window.Unscripted = { suggestLights, refresh: () => { renderLayer(); renderRecords(); } };
