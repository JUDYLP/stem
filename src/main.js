import { HOSTED_PROXY_URL, HOSTED_MODEL_LABEL } from './ai/hosted.js';
import { startScan, playVerdict } from './fx/verdict-fx.js';
import builtinPack from '../data/packs/unscripted-core.v1.json' with {type:'json'};
import { openDemo } from './ai/demo-scenario.js';
import { createAIProvider } from './ai/provider.js';
import { judgeAnswer, buildEvaluationContext, requestGate } from './ai/judge.js';
import { t, localized, getLanguage, initLanguage, setLanguage, applyLanguage } from './i18n.js';
import { loadQuestions } from './questions.js';
import { createProgressStore } from './storage.js';
import { createHistoryStore, latestByCell, makeRubricSnapshot, shouldUseCompact } from './history.js';
import { historyRubric, historyVersionLabel } from './history-rubric.js';
import { crashSheetRows, buildCrashSheet, downloadCrashSheet } from './export.js';
import { initDemo } from './demo.js';
import { initDotfield } from './dotfield.js';
import {
  createLamp, createLightIcon, setLampState, ignite, nextLight, summarizeLights,
  statusForLight, lightForStatus, lightLabel, keyToLight, pointLabel, pointAnnouncement,
  getSuggestion, clearSuggestion, suggestLights, LIGHT_RGB, isImproving,
} from './lights.js';

const $ = id => document.getElementById(id);
initLanguage(location.search, navigator.language);
applyLanguage();
initDotfield($('dotfield'));

const sectionGlows = new Map();
const edgeTimers = new WeakMap();

function setSectionGlow(name, rgb = '255, 255, 255', alpha = 0.1) {
  const glow = sectionGlows.get(name);
  if (glow) glow.style.backgroundColor = `rgba(${rgb}, ${alpha})`;
}

function initSectionGlows() {
  for (const element of document.querySelectorAll('.section-glow')) sectionGlows.set(element.dataset.glow, element);
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    for (const element of sectionGlows.values()) element.classList.add('is-visible');
    return;
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: .18 });
  for (const element of sectionGlows.values()) observer.observe(element);
}
const EDGE_PANEL = '.example-panel, .practice-panel, .records-panel, .answer-card';

function initPanelGlow() {
  window.addEventListener('lamp:lit', event => {
    const element = event.detail && event.detail.element;
    if (!element || typeof element.closest !== 'function') return;
    const panel = element.closest(EDGE_PANEL);
    const color = LIGHT_RGB[element.dataset.state];
    if (!panel || !color) return;
    const panelRect = panel.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    panel.style.setProperty('--edge-x', `${rect.left + rect.width / 2 - panelRect.left}px`);
    panel.style.setProperty('--edge-y', `${rect.top + rect.height / 2 - panelRect.top}px`);
    panel.style.setProperty('--edge-color', `rgba(${color}, .7)`);
    panel.classList.remove('edge-lit');
    void panel.offsetWidth;
    panel.classList.add('edge-lit');
    clearTimeout(edgeTimers.get(panel));
    edgeTimers.set(panel, setTimeout(() => panel.classList.remove('edge-lit'), 900));
  });
}

initPanelGlow();
initSectionGlows();
initDemo();

const store = createProgressStore();
const log = createHistoryStore();
const drafts = new Map();
let questions = [];
let questionId = '';
let layerIndex = 0;
let revealObserved = false;
let heatDensity = null;

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

function timelineEntries(entries) {
  return [...entries, ...log.versionedEntries(builtinPack.packId)]
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
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
  setSectionGlow('practice', LIGHT_RGB[light] || '255, 255, 255', 0.1);
}

function announcePoint(index, light) {
  const live = $('light-live');
  live.textContent = '';
  setTimeout(() => { live.textContent = pointAnnouncement(index, light); }, 30);
}

const aiGate = requestGate();
// The request signal also owns playback, including highlights left after completion.
function scanAnswer(answerEl, signal) {
  const stop = startScan(answerEl);
  signal.addEventListener('abort', stop, {once:true});
  return () => { signal.removeEventListener('abort', stop); stop(); };
}

function revealVerdict(options, signal) {
  const player = playVerdict(options);
  signal.addEventListener('abort', () => player.cancel(), {once:true});
  return player.done;
}

function demoScanDelay(signal) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
  return new Promise(resolve => {
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, 1200);
    signal.addEventListener('abort', finish, {once:true});
  });
}

let aiEvidence = [];
let suggestedDraft;
const aiConnection = $('ai-connection');
if (!HOSTED_PROXY_URL) aiConnection.querySelector('[value="hosted"]').remove();
aiConnection.value = HOSTED_PROXY_URL ? 'hosted' : 'byok';
$('ai-hosted-model').textContent = HOSTED_MODEL_LABEL;

function renderAiConnection() {
  const mode = aiConnection.value;
  $('ai-hosted-details').hidden = mode !== 'hosted';
  $('ai-byok-fields').hidden = mode !== 'byok';
  $('ai-model-field').hidden = mode === 'hosted';
  $('ai-proxy-field').hidden = mode !== 'custom';
}

renderAiConnection();
function resetJudge() {
  aiGate.cancel();
  if (suggestedDraft && suggestedDraft.confirmed === null) suggestedDraft.lights = [];
  suggestedDraft = null;
  aiEvidence = [];
  $('ai-run').disabled = false;
  $('confirm-rating').disabled = false;
  $('ai-followup').textContent = '';
  $('ai-offer-demo').hidden = true;
  $('ai-status').textContent = t('离线自评');
  $('ai-panel').hidden = $('judge-mode').value !== 'live';
  if (!$('ai-panel').hidden) $('ai-status').textContent = t('在线 AI 已选择');
}
$('ai-clear').onclick = () => {
  $('ai-key').value = '';
  $('ai-proxy').value = '';
  $('ai-settings').open = false;
  $('judge-mode').value = 'offline';
  $('judge-mode').dispatchEvent(new Event('change'));
};
function refreshAiSettings() {
  resetJudge();
  if (draft().submitted !== null) {
    fillRubric();
    renderLayerLight();
    $('rating-status').textContent = '';
  }
}

aiConnection.addEventListener('change', () => {
  renderAiConnection();
  refreshAiSettings();
});
$('ai-offer-demo').onclick = () => {
  $('ai-offer-demo').hidden = true;
  $('judge-mode').value = 'demo';
  $('judge-mode').dispatchEvent(new Event('change'));
  $('demo-judge').focus();
};

for (const id of ['ai-base','ai-model','ai-key','ai-proxy']) {
  $(id).addEventListener('input', () => {
    if (id === 'ai-base') $('ai-key').value = '';
    refreshAiSettings();
  });
}
$('ai-run').onclick = async () => {
  if ($('ai-run').disabled || $('judge-mode').value !== 'live') return;
  resetJudge();
  const d = draft();
  if ($('ai-panel').hidden || d.submitted === null) return;
  fillRubric();
  renderLayerLight();
  const signal = aiGate.start();
  const answer = d.submitted;
  $('ai-run').disabled = true;
  $('ai-status').textContent = t('正在请求判定…');
  const answerEl = $('before-answer');
  answerEl.closest('details').open = true;
  const stop = scanAnswer(answerEl, signal);
  $('confirm-rating').disabled = true;
  const connection = aiConnection.value;
  try {
    const proxyURL = connection === 'hosted' ? HOSTED_PROXY_URL :
      connection === 'custom' ? $('ai-proxy').value.trim() : '';
    if (connection === 'custom' && !proxyURL) throw Error('NO_PROXY');
    const provider = createAIProvider({baseURL:$('ai-base').value.trim(), model:$('ai-model').value.trim(),
      apiKey:connection === 'byok' ? $('ai-key').value : '', proxyURL});
    const context = evaluationContext();
    let result;
    await judgeAnswer(provider, context, answer, signal, validated => { result = validated; });
    stop();
    if (signal.aborted) return;
    const lampEls = $('rubric').querySelectorAll('.point-lamp .lamp');
    await revealVerdict({verdicts:result.verdicts, answerEl, lampEls}, signal);
    if (signal.aborted) return;
    suggestedDraft = d;
    aiEvidence = result.verdicts;
    suggestLights(questionId,currentLayer().id,aiEvidence.map(row=>row.light));
    d.lights = getSuggestion(questionId,currentLayer().id);
    clearSuggestion(questionId,currentLayer().id);
    d.confirmed = null;
    fillRubric();
    renderLayerLight();
    $('rating-status').textContent = $('ai-status').textContent = t('AI 建议，待确认');
    $('ai-followup').textContent = [result.followUp, t('原文引用仅证明出处，请自行核对技术判断。')].filter(Boolean).join(' ');
  } catch (error) {
    if (signal.aborted) return;
    if (connection === 'hosted' && ['HTTP_429','HTTP_503'].includes(error.message)) {
      $('ai-status').textContent = t('演示额度已用完或已关闭（每天北京时间 8:00 重置），可改用评委演示模式或自己的 Key。');
      $('ai-offer-demo').hidden = false;
      return;
    }
    const messages = {NO_PROXY:'请填写代理地址。',NO_KEY:'缺少 Key',TIMEOUT:'请求超时',OFFLINE_NETWORK:'网络断开',NETWORK_OR_CORS:'网络或跨域请求失败，请检查网络和浏览器 CORS 提示'};
    const code = /^(HTTP_[0-9]{3}|INVALID_JSON|EMPTY|TRUNCATED|INCOMPLETE|CONTRACT|ENDPOINT|PACK|RUBRIC_MISMATCH)$/.test(error.message) ? error.message : '';
    $('ai-status').textContent = [t('未取得建议，可继续自评。'),messages[error.message] ? t(messages[error.message]) : code].join(' ');
  } finally {
    stop();
    if (!signal.aborted) { $('ai-run').disabled = false; $('confirm-rating').disabled = false; }
  }
};

function evaluationContext() {
  return buildEvaluationContext({pack: builtinPack, question: current(), layer: currentLayer(), language: getLanguage()});
}

function renderMode() {
  const mode = $('judge-mode').value;
  $('judge-demo-result').replaceChildren();
  $('judge-demo').hidden = mode !== 'demo';
  $('formal-practice').hidden = mode === 'demo';
  $('ai-panel').hidden = mode !== 'live';
  $('ai-settings').open = mode === 'live';
  $('layer-light').hidden = mode === 'demo';
  const topic = builtinPack.questions.find(q => q.id === questionId);
  $('rubric-review').textContent = t(topic?.review.status === 'reviewed' ? '已审校评分标准' : '待审校评分标准 · 建议供参考');
}

$('judge-mode').addEventListener('change', () => {
  aiGate.cancel();
  $('confirm-rating').disabled = false;
  $('ai-run').disabled = false;
  if ($('judge-mode').value === 'offline') {
    resetJudge();
    if (draft().submitted !== null) fillRubric();
    renderLayerLight();
    $('rating-status').textContent = t('离线自评');
  }
  renderMode();
  if ($('judge-mode').value === 'live' && !aiEvidence.length) $('ai-status').textContent = t('在线 AI 已选择');
});

$('demo-judge').addEventListener('click', async () => {
  if ($('judge-mode').value !== 'demo') return;
  const signal = aiGate.start();
  const panel = $('judge-demo-result');
  panel.replaceChildren();
  try {
    const context = evaluationContext();
    const sample = openDemo(context);
    const list = byId('ul', 'point-list rubric');
    const status = byId('p', 'fine-print');
    for (const [index, row] of sample.verdicts.entries()) {
      const item = byId('li', 'point-row');
      const button = byId('button', 'point-lamp');
      const lamp = createLamp(row.light, {label:false});
      button.type = 'button';
      const update = () => {
        item.dataset.state = row.light;
        button.setAttribute('aria-label', pointLabel(index, row.light));
        setLampState(lamp, row.light);
        status.textContent = '';
      };
      button.append(lamp);
      button.onclick = () => { row.light = nextLight(row.light); update(); };
      button.disabled = true;
      button.setAttribute('aria-label', pointLabel(index, 'off'));
      setLampState(lamp, 'off');
      const copy = byId('span', 'point-text', context.criteria[index].criterion);
      copy.append(document.createElement('br'), byId('small','fine-print',row.reason + ' · “' + row.quote + '”'));
      item.append(button, copy);
      list.append(item);
    }
    const confirm = byId('button','button secondary',t('确认模拟灯号'));
    confirm.type = 'button';
    confirm.onclick = () => { status.textContent = t('模拟灯号已确认，仅在本页预览。'); };
    const answerEl = byId('p','answer-text',sample.answer);
    const scoreHost = byId('span', 'mono');
    confirm.disabled = true;
    panel.append(answerEl, list, scoreHost, byId('p','',sample.followUp), confirm, status);
    const stop = scanAnswer(answerEl, signal);
    try { await demoScanDelay(signal); } finally { stop(); }
    if (signal.aborted) return;
    await revealVerdict({verdicts:sample.verdicts, answerEl,
      lampEls:list.querySelectorAll('.lamp'), scoreHost}, signal);
    if (signal.aborted) return;
    for (const [index, item] of [...list.children].entries()) {
      const light = sample.verdicts[index].light;
      item.dataset.state = light;
      const button = item.querySelector('button');
      button.setAttribute('aria-label', pointLabel(index, light));
      button.disabled = false;
    }
    confirm.disabled = false;
  } catch {
    if (signal.aborted) return;
    panel.textContent = t('示例判定暂不可用');
  }
});

function fillRubric() {
  const d = draft();
  const layer = currentLayer();
  $('rubric').replaceChildren(...localized(layer, 'rubric').map((text, index) => {
    const item = byId('li', 'point-row');
    item.style.setProperty('--i', String(index));
    const current = d.lights[index] || 'amber';
    item.dataset.state = current;
    const button = byId('button', 'point-lamp');
    button.type = 'button';
    button.setAttribute('aria-label', pointLabel(index, current));
    const lamp = createLamp(current, { label: false });
    lamp.dataset.point = String(index);
    button.append(lamp);
    const body = byId('span', 'point-text', text);
    const evidence = aiEvidence[index];
    if (evidence) {
      const detail = byId('small', 'fine-print', (evidence.reason || t('模型未评价此项，请自行确认。')) + ' · ' +
        (evidence.quote ? '“' + evidence.quote + '”' : t('无可核验的原文引用')));
      body.append(document.createElement('br'),detail);
    }
    const update = light => {
      aiGate.cancel();
      $('confirm-rating').disabled = false;
      if (!aiEvidence.length) $('ai-status').textContent = t('离线自评');
      $('ai-run').disabled = false;
      d.lights[index] = light;
      item.dataset.state = light;
      setLampState(lamp, light);
      ignite(lamp);
      if (light === 'red') lamp.classList.add('is-flash');
      button.setAttribute('aria-label', pointLabel(index, light));
      d.confirmed = null;
      renderLayerLight();
      $('rating-status').textContent = t('灯变了，记得再点确认判定。');
      announcePoint(index, light);
    };
    button.addEventListener('click', () => update(nextLight(d.lights[index] || 'amber')));
    button.addEventListener('keydown', event => {
      const light = keyToLight(event.key);
      if (!light) return;
      event.preventDefault();
      update(light);
    });
    item.append(button, body);
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
  resetJudge();
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
  renderMode();
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

function historyText(entries) {
  if (!entries.length) return t('没有判定历史');
  const recent = entries.slice(-5);
  return t('最近 {count} 次：{history}', {
    count: recent.length,
    history: recent.map(entry => lightLabel(entry.light)).join(' → '),
  });
}

function heatTooltip(question, layer, entry, entries) {
  const time = entry ? formatTime(entry.ts) : t('未作答');
  return [localized(question, 'title'), layer.id, historyText(entries), time,
    entry && historyVersionLabel(historyRubric(entry, getLanguage()))].filter(Boolean).join(' · ');
}

function heatStat(state, key, count) {
  const item = byId('span', 'heat-stat');
  item.append(createLamp(state, { label: false }), byId('span', 'heat-stat-label', t(key)), byId('span', 'heat-stat-count', String(count)));
  return item;
}

function renderRecords({ changed = null } = {}) {
  if (!questions.length) return;
  const data = index();
  const timeline = timelineEntries(data.entries);
  const review = crashSheetRows(questions, data.progress, timeline);
  const counts = { green: 0, amber: 0, red: 0, off: 0 };
  const histories = new Map();
  for (const entry of data.entries) {
    const key = cellKey(entry.questionId, entry.layer);
    if (!histories.has(key)) histories.set(key, []);
    histories.get(key).push(entry);
  }
  $('heatmap').classList.toggle('is-compact', heatDensity === 'compact');
  for (const button of document.querySelectorAll('[data-density]')) {
    button.setAttribute('aria-pressed', String(button.dataset.density === heatDensity));
  }

  $('heat-body').replaceChildren(...questions.map((question, row) => {
    const rowEl = byId('div', 'heat-row');
    const label = byId('div', 'heat-question');
    label.append(
      byId('span', 'mono heat-category', question.category),
      byId('span', 'heat-index', String(row + 1).padStart(2, '0')),
      byId('span', 'heat-title', localized(question, 'title')),
    );
    rowEl.append(label);
    question.layers.forEach((layer, column) => {
      const key = cellKey(question.id, layer.id);
      const entries = histories.get(key) || [];
      const entry = data.latest.get(key);
      const light = lightOf(data, question.id, layer.id);
      const recent = entries.slice(-5);
      counts[light] += 1;
      const button = byId('button', 'heat-cell');
      button.type = 'button';
      button.dataset.state = light;
      button.dataset.row = String(row);
      button.dataset.column = String(column);
      button.dataset.tip = heatTooltip(question, layer, entry, entries);
      button.setAttribute('aria-label', `${localized(question, 'title')} · ${layer.id} ${layer.label} · ${lightLabel(light)} · ${historyText(entries)}`);
      button.style.setProperty('--reveal-delay', `${(row + column) * 90}ms`);
      button.style.setProperty('--wave-delay', '0ms');
      const corner = byId('span', 'heat-corner');
      corner.append(byId('span', 'heat-layer', layer.id));
      if (isImproving(entries)) corner.append(byId('span', 'heat-up', '↑'));
      button.append(corner);
      if (light === 'off') button.append(byId('span', 'heat-empty'));
      else button.append(createLightIcon(light));
      if (recent.length) {
        const trail = byId('span', 'heat-history');
        trail.setAttribute('aria-hidden', 'true');
        for (const item of recent) {
          const dot = byId('span', 'heat-dot');
          dot.dataset.state = item.light;
          trail.append(dot);
        }
        button.append(trail);
      }
      if (changed === key) {
        button.classList.add('is-changed');
        window.dispatchEvent(new CustomEvent('lamp:lit', { detail: { element: button } }));
      }
      button.addEventListener('click', () => openCell(question.id, layer.id));
      rowEl.append(button);
    });
    return rowEl;
  }));

  if (changed) {
    const target = $('heat-body').querySelector('.heat-cell.is-changed');
    if (target) {
      // Ripple outwards from the updated cell, one faint wave per distance.
      const row = Number(target.dataset.row);
      const column = Number(target.dataset.column);
      for (const cell of $('heat-body').querySelectorAll('.heat-cell')) {
        const distance = Math.abs(Number(cell.dataset.row) - row) + Math.abs(Number(cell.dataset.column) - column);
        if (!distance) continue;
        cell.classList.add('is-wave');
        cell.style.setProperty('--wave-delay', `${distance * 80}ms`);
      }
    }
  }

  const litCells = counts.green + counts.amber + counts.red;
  if (litCells) {
    const red = Math.round((counts.green * 34 + counts.amber * 245 + counts.red * 255) / litCells);
    const green = Math.round((counts.green * 197 + counts.amber * 165 + counts.red * 69) / litCells);
    const blue = Math.round((counts.green * 94 + counts.amber * 36 + counts.red * 58) / litCells);
    setSectionGlow('records', `${red}, ${green}, ${blue}`, 0.1);
  } else {
    setSectionGlow('records', '255, 255, 255', 0.1);
  }
  $('heat-stats').replaceChildren(
    heatStat('green', '绿灯', counts.green),
    heatStat('amber', '琥珀灯', counts.amber),
    heatStat('red', '红灯', counts.red),
    heatStat('off', '未作答', counts.off),
  );
  $('save-answers').checked = log.saveAnswers;
  $('export-review').disabled = !review.length;
  $('clear-export').disabled = !review.length;
  $('export-hint').hidden = review.length > 0;
  $('storage-warning').textContent = [store.warning, log.warning].filter(Boolean).join(' ');
  $('storage-warning').hidden = !$('storage-warning').textContent;
  renderTimeline(timeline);
  observeHeatmap();
}

function renderTimeline(chronologicalEntries) {
  const rows = chronologicalEntries.map(entry => ({ entry, history:historyRubric(entry, getLanguage()) }));
  const entries = [...rows].reverse();
  $('timeline-empty').hidden = entries.length > 0;
  $('timeline-count').textContent = entries.length ? t('{count} 次判定', { count: entries.length }) : '';
  $('timeline').replaceChildren(...entries.map(({entry, history}) => {
    const question = questions.find(item => item.id === entry.questionId);
    if (!question) return byId('li');
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

    main.append(byId('p', 'fine-print', historyVersionLabel(history)));
    const list = byId('ul', 'tl-missed-list');
    for (const {light, text} of history.points) {
      const point = byId('li');
      point.append(createLamp(light), byId('span', '', text));
      list.append(point);
    }
    main.append(list);

    const sameVersion = rows.filter(row => (history.packVersion || row.entry === entry) && row.entry.questionId === entry.questionId &&
      row.entry.layer === entry.layer && row.history.packVersion === history.packVersion &&
      row.history.packId === history.packId);
    const position = sameVersion.findIndex(row => row.entry === entry);
    const trace = sameVersion.slice(0, position + 1).map(row => row.entry);
    if (trace.length > 1) {
      const strip = byId('div', 'tl-trace');
      strip.setAttribute('aria-label', t('同一题层的灯色变化'));
      trace.forEach((step, index) => {
        if (index) strip.append(byId('span', 'arrow', '→'));
        strip.append(createLamp(step.light, { label: false }));
      });
      main.append(strip);
    }

    if (entry.packVersion && entry.answer) {
      const details = byId('details', 'tl-answers');
      details.append(byId('summary', '', t('已保存的判定回答')), byId('p', 'tl-answer', entry.answer));
      main.append(details);
    }
    if (sameVersion.filter(row => !row.entry.packVersion).at(-1)?.entry === entry && log.saveAnswers && entry.answer) {
      const answers = sameVersion.map(row => row.entry).filter(item => !item.packVersion && item.answer);
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
  resetJudge();
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
  resetJudge();
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
  if ($('judge-mode').value === 'demo') return;
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
    rubricSnapshot: makeRubricSnapshot(builtinPack, builtinPack.questions.find(q => q.id === question.id)
      .layers.find(item => item.id === layer.id)),
    missedPoints: d.lights.map((value, index) => (value === 'red' ? index : -1)).filter(index => index >= 0),
    answer: d.submitted,
  });
  d.confirmed = light;
  $('export-message').textContent = '';
  renderLayer();
  renderRecords({ changed: cellKey(question.id, layer.id) });
  $('ai-status').textContent = t('人工确认');
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
    : t('已关闭：本页练习记录中的回答原文已删除。');
});

$('export-review').addEventListener('click', () => {
  const text = buildCrashSheet(questions, store.snapshot(), getLanguage(), timelineEntries(log.snapshot().entries));
  downloadCrashSheet(text);
  $('export-message').textContent = t('已生成 Markdown 复习单，请在浏览器下载列表中查看。');
});

$('clear-history').addEventListener('click', () => {
  const dialog = $('clear-dialog');
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else if (window.confirm(t('清空本页练习记录？'))) confirmClear();
});
$('clear-cancel').addEventListener('click', () => $('clear-dialog').close());
$('clear-export').addEventListener('click', () => {
  if (!crashSheetRows(questions, store.snapshot(), timelineEntries(log.snapshot().entries)).length) return;
  downloadCrashSheet(buildCrashSheet(questions, store.snapshot(), getLanguage(), timelineEntries(log.snapshot().entries)));
  $('clear-dialog').close();
  $('export-message').textContent = t('已生成 Markdown 复习单，请在浏览器下载列表中查看。');
});

function confirmClear() {
  log.clear();
  store.clear();
  for (const d of drafts.values()) d.confirmed = null;
  $('clear-dialog').close();
  renderLayer();
  renderRecords();
  $('export-message').textContent = t('本页练习记录已清空。');
}
$('clear-confirm').addEventListener('click', confirmClear);

document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => {
  setLanguage(button.dataset.lang);
  const url = new URL(location.href);
  url.searchParams.set('lang', getLanguage());
  window.history.replaceState(null, '', url);
  applyLanguage();
  window.dispatchEvent(new CustomEvent('language:changed'));
  if (questions.length) {
    $('category').options[0].textContent = t('全部分类');
    for (const option of $('question').options) option.textContent = localized(questions.find(question => question.id === option.value), 'title');
    renderLayer();
    renderRecords();
    $('load-message').textContent = t('已加载 {count} 道题', { count: questions.length });
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
    if (!heatDensity) heatDensity = shouldUseCompact(questions.length) ? 'compact' : 'expanded';
    $('category').replaceChildren(option('', t('全部分类')), ...[...new Set(questions.map(question => question.category))].map(category => option(category, category)));
    renderOptions();
    $('practice-body').hidden = false;
    $('load-message').textContent = t('已加载 {count} 道题', { count: questions.length });
    renderRecords();
  } catch {
    $('load-message').textContent = t('题库加载失败，请确认通过 HTTP 打开且题库文件有效，再重试。');
    $('reload-questions').hidden = false;
  }
}
document.querySelectorAll('[data-density]').forEach(button => button.addEventListener('click', () => {
  heatDensity = button.dataset.density;
  renderRecords();
}));
$('reload-questions').addEventListener('click', boot);
boot();

// Reserved integration point. A future live-AI response may propose point lights,
// but the UI only shows them; the learner still has to adopt and confirm.
window.Unscripted = { suggestLights, refresh: () => { renderLayer(); renderRecords(); } };
