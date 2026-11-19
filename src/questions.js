const nonempty = value => typeof value === 'string' && value.trim().length > 0;

export function validateQuestions(data) {
  if (!Array.isArray(data) || !data.length) throw new Error('题库必须是非空数组');
  const ids = new Set();
  for (const question of data) {
    if (!question || !nonempty(question.id) || !/^[a-z0-9-]+$/.test(question.id) || ids.has(question.id)) {
      throw new Error('题目 ID 无效或重复');
    }
    ids.add(question.id);
    if (!['category', 'title', 'title_en', 'language'].every(key => nonempty(question[key]))) throw new Error('题目信息不完整');
    if (!Array.isArray(question.layers) || question.layers.length !== 3) throw new Error('每题必须有三层');
    question.layers.forEach((layer, index) => {
      if (!layer || layer.id !== `L${index + 1}` || !nonempty(layer.label) || !nonempty(layer.prompt) || !nonempty(layer.prompt_en)) throw new Error('层级顺序或内容无效');
      if (!Array.isArray(layer.rubric) || layer.rubric.length < 2 || layer.rubric.length > 5 || !layer.rubric.every(nonempty)) throw new Error('每层需要 2–5 条非空参考要点');
      if (!Array.isArray(layer.rubric_en) || layer.rubric_en.length !== layer.rubric.length || !layer.rubric_en.every(nonempty)) throw new Error('English rubric must match the Chinese rubric item count');
    });
  }
  return data;
}

export async function loadQuestions(url = new URL('../data/questions.json', import.meta.url), fetcher = fetch) {
  const response = await fetcher(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`题库请求失败（${response.status}）`);
  return validateQuestions(await response.json());
}

// The training view uses the validated builtin record returned by the pack runtime.
export function questionsFromBuiltin({ source, validatedPack: pack }) {
  if (source !== 'builtin') throw Error('BUILTIN_REQUIRED');
  return pack.questions.map(question => ({
    id: question.id,
    packId: pack.packId,
    packVersion: pack.packVersion,
    title: question.title['zh-CN'],
    title_en: question.title.en,
    category: question.category['zh-CN'],
    category_en: question.category.en,
    review: question.review,
    layers: question.layers.map(layer => ({
      id: layer.id,
      label: layer.label,
      prompt: layer.prompt['zh-CN'],
      prompt_en: layer.prompt.en,
      rubric: layer.rubric.map(row => row.criterion['zh-CN']),
      rubric_en: layer.rubric.map(row => row.criterion.en),
      rubricIds: layer.rubric.map(row => row.rubricId),
    })),
  }));
}
