const nonempty = value => typeof value === 'string' && value.trim().length > 0;

export function validateQuestions(data) {
  if (!Array.isArray(data) || !data.length) throw new Error('题库必须是非空数组');
  const ids = new Set();
  for (const question of data) {
    if (!question || !nonempty(question.id) || !/^[a-z0-9-]+$/.test(question.id) || ids.has(question.id)) {
      throw new Error('题目 ID 无效或重复');
    }
    ids.add(question.id);
    if (!['category', 'title', 'language'].every(key => nonempty(question[key]))) throw new Error('题目信息不完整');
    if (!Array.isArray(question.layers) || question.layers.length !== 3) throw new Error('每题必须有三层');
    question.layers.forEach((layer, index) => {
      if (!layer || layer.id !== `L${index + 1}` || !nonempty(layer.label) || !nonempty(layer.prompt)) throw new Error('层级顺序或内容无效');
      if (!Array.isArray(layer.rubric) || layer.rubric.length < 2 || layer.rubric.length > 4 || !layer.rubric.every(nonempty)) throw new Error('每层需要 2–4 条非空参考要点');
    });
  }
  return data;
}

export async function loadQuestions(url = new URL('../data/questions.json', import.meta.url), fetcher = fetch) {
  const response = await fetcher(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`题库请求失败（${response.status}）`);
  return validateQuestions(await response.json());
}
