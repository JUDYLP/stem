export function previewPack({validatedPack: pack, source}, requestedLanguage) {
  const supported = pack.supportedLanguages;
  const requested = requestedLanguage === 'zh' && !supported.includes('zh') ? 'zh-CN' : requestedLanguage;
  const fallback = !supported.includes(requested);
  const language = fallback ? pack.defaultLanguage : requested;
  const questionSummaries = pack.questions.map(q => ({
    questionId:q.id, title:q.title[language], category:q.category[language], reviewStatus:q.review.status,
  }));
  const layers = pack.questions.flatMap(q => q.layers);
  const authorReviewed = questionSummaries.filter(q => q.reviewStatus === 'reviewed').length;
  return {
    packId:pack.packId, packVersion:pack.packVersion, title:pack.title[language], description:pack.description[language],
    source, supportedLanguages:[...supported], defaultLanguage:pack.defaultLanguage, language, fallback,
    questionCount:questionSummaries.length, layerCount:layers.length,
    rubricCount:layers.reduce((sum, layer) => sum + layer.rubric.length, 0),
    categories:[...new Set(questionSummaries.map(q => q.category))], questionSummaries,
    reviewStatus:{authorReviewed, unreviewed:questionSummaries.length-authorReviewed},
  };
}
