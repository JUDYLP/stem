import { jsonPath } from './strict-json.js';
export const MAX_ERRORS = 50;

// Called only after structural validation. Never repairs or writes to the pack.
export function validatePackSemantics(pack) {
  const errors = [];
  function add(code, parts, message) {
    if (errors.length < MAX_ERRORS) errors.push({ code, path: jsonPath(parts), message });
  }
  const languages = new Set(pack.supportedLanguages);
  function translations(map, parts) {
    for (const lang of pack.supportedLanguages) {
      if (!Object.hasOwn(map, lang)) add('MISSING_TRANSLATION', [...parts, lang], 'Declared language translation is required');
    }
    for (const lang of Object.keys(map).sort()) {
      if (!languages.has(lang)) add('UNDECLARED_LANGUAGE', [...parts, lang], 'Translation language is not declared');
      if (!map[lang].trim()) add('BLANK_TEXT', [...parts, lang], 'Text must not be blank');
    }
  }
  if (!languages.has(pack.defaultLanguage)) add('DEFAULT_LANGUAGE', ['defaultLanguage'], 'Default language must be declared');
  translations(pack.title, ['title']);
  translations(pack.description, ['description']);
  const questionIds = new Set();
  const rubricIds = new Set();
  for (const [qi, q] of pack.questions.entries()) {
    if (errors.length === MAX_ERRORS) break;
    const qp = ['questions', qi];
    if (questionIds.has(q.id)) add('DUPLICATE_QUESTION_ID', [...qp, 'id'], 'Question ID must be unique');
    questionIds.add(q.id);
    translations(q.category, [...qp, 'category']);
    translations(q.title, [...qp, 'title']);
    if (q.review.status === 'reviewed' && !validUtc(q.review.reviewedAt)) {
      add('INVALID_REVIEW_DATE', [...qp, 'review', 'reviewedAt'], 'Review date must be a real UTC calendar time');
    }
    for (const [li, layer] of q.layers.entries()) {
      const lp = [...qp, 'layers', li];
      translations(layer.prompt, [...lp, 'prompt']);
      for (const [ri, rubric] of layer.rubric.entries()) {
        if (rubricIds.has(rubric.rubricId)) add('DUPLICATE_RUBRIC_ID', [...lp, 'rubric', ri, 'rubricId'], 'Rubric ID must be unique across the pack');
        rubricIds.add(rubric.rubricId);
        translations(rubric.criterion, [...lp, 'rubric', ri, 'criterion']);
      }
    }
  }
  return errors;
}

function validUtc(text) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(text)) return false;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) && date.toISOString() === text.replace('Z', '.000Z');
}
