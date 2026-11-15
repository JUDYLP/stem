import { loadQuestions } from './questions.js';
import { createProgressStore } from './storage.js';

const $ = id => document.getElementById(id);
const store = createProgressStore();
const drafts = new Map();
let questions = [], questionId = '', layerIndex = 0;
const current = () => questions.find(q => q.id === questionId);
const key = () => `${questionId}::L${layerIndex + 1}`;
const statusText = status => ({pass:'自评通过',review:'需要复习'}[status] || '未评价');
function draft() {
  if (!drafts.has(key())) drafts.set(key(), { text: '', submitted: null });
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
  $('rating-status').textContent = `该层最后一次自评：${statusText(data.items[key()]?.status)}。编辑答案不会自动改变自评。`;
  $('storage-warning').textContent = store.warning; $('storage-warning').hidden = !store.warning;
}
function renderLayer() {
  const q = current(), layer = q.layers[layerIndex], d = draft();
  $('question-title').textContent = q.title;
  $('layer-label').textContent = `${q.category} / ${layer.id} ${layer.label}`;
  $('layer-prompt').textContent = layer.prompt;
  $('answer').value = d.text; $('answer-count').textContent = `${d.text.length} / 8000`;
  $('answer-message').textContent = ''; $('self-check').hidden = d.submitted === null;
  $('rubric-details').open = false; $('rubric').replaceChildren();
  if (d.submitted !== null) fillRubric();
  renderProgress();
}
function fillRubric() {
  $('rubric').replaceChildren(...current().layers[layerIndex].rubric.map(text => {
    const li = document.createElement('li'); li.textContent = text; return li;
  }));
}
function selectQuestion(id) { questionId = id; layerIndex = 0; $('question').value = id; renderLayer(); }
function filtered() { return questions.filter(q => !$('category').value || q.category === $('category').value); }
function renderOptions() {
  const list = filtered(); $('question').replaceChildren(...list.map(q => option(q.id, q.title)));
  selectQuestion(list.some(q => q.id === questionId) ? questionId : list[0].id);
}
$('category').addEventListener('change', renderOptions);
$('question').addEventListener('change', event => selectQuestion(event.target.value));
$('random-question').addEventListener('click', () => {
  const list = filtered(), others = list.filter(q => q.id !== questionId), pool = others.length ? others : list;
  selectQuestion(pool[Math.floor(Math.random() * pool.length)].id);
});
$('answer').addEventListener('input', () => {
  const d = draft(); d.text = $('answer').value; d.submitted = null;
  $('answer-count').textContent = `${d.text.length} / 8000`;
  $('self-check').hidden = true; $('rubric').replaceChildren();
  $('answer-message').textContent = '修改后请重新提交，再进行自评。';
});
$('answer-form').addEventListener('submit', event => {
  event.preventDefault(); const d = draft(); d.text = $('answer').value;
  if (!d.text.trim() || d.text.length > 8000) {
    $('answer-message').textContent = '请先写下 1–8000 个字符的解释（不能只有空白）。'; $('answer').focus(); return;
  }
  d.submitted = d.text; fillRubric(); $('self-check').hidden = false; $('rubric-details').open = true;
  $('answer-message').textContent = '已提交。对照要点后，请选择自己的评价。';
});
for (const status of ['pass','review']) $('rate-' + status).addEventListener('click', () => {
  if (draft().submitted === null) return;
  store.rate(key(), status); renderProgress();
});
async function boot() {
  $('reload-questions').hidden = true; $('practice-body').hidden = true;
  $('load-message').textContent = '正在加载题库…';
  try {
    questions = await loadQuestions();
    $('category').replaceChildren(option('','全部分类'), ...[...new Set(questions.map(q => q.category))].map(c => option(c,c)));
    renderOptions(); $('practice-body').hidden = false;
    $('load-message').textContent = `已加载 ${questions.length} 道题 · 无需 API Key`;
    $('page-status').textContent = '手动练习 · 回答不上传';
  } catch {
    $('load-message').textContent = '题库加载失败，请确认通过 HTTP 打开且题库文件有效，再重试。';
    $('reload-questions').hidden = false;
  }
}
$('reload-questions').addEventListener('click', boot);
boot();
