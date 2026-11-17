import { t, localized, getLanguage, initLanguage, setLanguage, applyLanguage } from './i18n.js';
import { loadQuestions } from './questions.js';
import { createProgressStore } from './storage.js';
import { reviewItems, buildCrashSheet, downloadCrashSheet } from './export.js';
import { initDemo } from './demo.js';

initLanguage(location.search, navigator.language);
applyLanguage();
initDemo();

const $ = id => document.getElementById(id);
const store = createProgressStore();
const drafts = new Map();
let questions = [], questionId = '', layerIndex = 0;
const current = () => questions.find(q => q.id === questionId);
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
const key = () => `${questionId}::L${layerIndex + 1}`;
const statusText = status => t({pass:'自评通过',review:'需要复习'}[status] || '未评价');
function draft() {
  if (!drafts.has(key())) drafts.set(key(), { text: '', submitted: null, retry: '' });
  return drafts.get(key());
}
function option(value, text) {
  const node = document.createElement('option'); node.value = value; node.textContent = text; return node;
}
function renderProgress() {
  const data = store.snapshot();
  $('depth-meter').replaceChildren(...current().layers.map((layer, index) => {
    const button = document.createElement('button'); button.type = 'button';
    button.textContent = `${layer.id} ${layer.label} · ${statusText(data.items[`${questionId}::${layer.id}`]?.status)}`;
    button.setAttribute('aria-current', index === layerIndex ? 'step' : 'false');
    button.addEventListener('click', () => { layerIndex = index; renderLayer(); });
    return button;
  }));
  $('rating-status').textContent = t('该层最后一次自评：{status}。编辑答案不会自动改变自评。', {status:statusText(data.items[key()]?.status)});
  $('storage-warning').textContent = store.warning; $('storage-warning').hidden = !store.warning;
  renderReview();
}
function renderReview() {
  const items = reviewItems(questions, store.snapshot());
  $('review-count').textContent = items.length ? t('当前 {count} 个题目层级需要复习（全分类）', {count:items.length}) : t('当前没有待复习条目。完成解释后，可自行标记 Review。');
  $('review-list').replaceChildren(...items.map(({question, layer}) => {
    const li = document.createElement('li'), button = document.createElement('button');
    button.type = 'button'; button.className = 'review-link';
    button.textContent = `${question.category} / ${layer.id} · ${localized(question, 'title')}`;
    button.addEventListener('click', () => {
      $('category').value = ''; renderOptions(); selectQuestion(question.id); layerIndex = question.layers.indexOf(layer); renderLayer();
      $('question-title').scrollIntoView({block:'start'}); $('answer').focus({preventScroll:true});
    });
    li.append(button); return li;
  }));
  $('export-review').disabled = !items.length;
  $('export-hint').hidden = !!items.length;
}
$('export-review').addEventListener('click', () => {
  const text = buildCrashSheet(questions, store.snapshot(), getLanguage());
  downloadCrashSheet(text);
  $('export-message').textContent = t('已生成 Markdown 复习单，请在浏览器下载列表中查看。');
});
function renderLayer() {
  const q = current(), layer = q.layers[layerIndex], d = draft();
  $('question-title').textContent = localized(q, 'title');
  $('layer-label').textContent = `${q.category} / ${layer.id} ${layer.label}`;
  $('layer-prompt').textContent = localized(layer, 'prompt');
  $('answer').value = d.text; updateAnswerSize();
  $('answer-message').textContent = ''; $('self-check').hidden = d.submitted === null;
  $('rubric-details').open = false; $('rubric').replaceChildren();
  $('before-answer').textContent = d.submitted || '';
  $('retry-answer').value = d.retry;
  if (d.submitted !== null) fillRubric();
  renderProgress();
}
function fillRubric() {
  $('rubric').replaceChildren(...localized(current().layers[layerIndex], 'rubric').map(text => {
    const li = document.createElement('li'); li.textContent = text; return li;
  }));
}
function selectQuestion(id) { questionId = id; layerIndex = 0; $('question').value = id; renderLayer(); }
function filtered() { return questions.filter(q => !$('category').value || q.category === $('category').value); }
function renderOptions() {
  const list = filtered(); $('question').replaceChildren(...list.map(q => option(q.id, localized(q, 'title'))));
  selectQuestion(list.some(q => q.id === questionId) ? questionId : list[0].id);
}
$('category').addEventListener('change', renderOptions);
$('question').addEventListener('change', event => selectQuestion(event.target.value));
$('random-question').addEventListener('click', () => {
  const list = filtered(), others = list.filter(q => q.id !== questionId), pool = others.length ? others : list;
  selectQuestion(pool[Math.floor(Math.random() * pool.length)].id);
});
$('answer').addEventListener('input', () => {
  const d = draft(); d.text = $('answer').value; d.submitted = null; d.retry = '';
  updateAnswerSize();
  $('self-check').hidden = true; $('rubric').replaceChildren();
  $('answer-message').textContent = t('修改后请重新提交，再进行自评。');
});
$('answer-form').addEventListener('submit', event => {
  event.preventDefault(); const d = draft(); d.text = $('answer').value;
  if (!d.text.trim() || d.text.length > 8000) {
    $('answer-message').textContent = t('请先写下 1–8000 个字符的解释（不能只有空白）。'); $('answer').focus(); return;
  }
  d.submitted = d.text; fillRubric(); $('self-check').hidden = false; $('rubric-details').open = true;
  $('before-answer').textContent = d.submitted; $('retry-answer').value = d.retry;
  $('answer-message').textContent = t('已提交。对照要点后，请选择自己的评价。');
});
for (const status of ['pass','review']) $('rate-' + status).addEventListener('click', () => {
  if (draft().submitted === null) return;
  store.rate(key(), status); renderProgress();
});
$('retry-answer').addEventListener('input', () => { draft().retry = $('retry-answer').value; });
async function boot() {
  $('reload-questions').hidden = true; $('practice-body').hidden = true;
  $('load-message').textContent = t('正在加载题库…');
  try {
    questions = await loadQuestions();
    $('category').replaceChildren(option('',t('全部分类')), ...[...new Set(questions.map(q => q.category))].map(c => option(c,c)));
    renderOptions(); $('practice-body').hidden = false; resizeAnswer();
    $('load-message').textContent = t('已加载 {count} 道题 · 无需 API Key', {count:questions.length});

  } catch {
    $('load-message').textContent = t('题库加载失败，请确认通过 HTTP 打开且题库文件有效，再重试。');
    $('reload-questions').hidden = false;
  }
}
document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => {
  setLanguage(button.dataset.lang);
  const url = new URL(location.href); url.searchParams.set('lang', getLanguage());
  history.replaceState(null, '', url);
  const open = $('rubric-details').open;
  applyLanguage();
  if (questions.length) {
    $('category').options[0].textContent = t('全部分类');
    for (const option of $('question').options) option.textContent = localized(questions.find(q => q.id === option.value), 'title');
    renderLayer(); $('rubric-details').open = open;
    $('load-message').textContent = t('已加载 {count} 道题 · 无需 API Key', {count:questions.length});
  } else if (!$('reload-questions').hidden) $('load-message').textContent = t('题库加载失败，请确认通过 HTTP 打开且题库文件有效，再重试。');
  $('export-message').textContent = '';
}));
$('reload-questions').addEventListener('click', boot);
boot();
