import core from '../../data/packs/unscripted-core.v1.json' with {type:'json'};
import intro from '../../data/packs/unscripted-intro.v1.json' with {type:'json'};
import {validateQuestionPackText, validateQuestionPackBytes, comparePackVersions} from './validate.js';
import {computePackDigest} from './digest.js';
const coreText = JSON.stringify(core);
const introText = JSON.stringify(intro);

export function createPackRegistry() {
  const packs = new Map();
  async function register(input, source) {
    const result = typeof input === 'string' ? validateQuestionPackText(input) : validateQuestionPackBytes(input);
    if (!result.valid) throw Object.assign(new Error('Invalid question pack'), {code:'INVALID_PACK', errors:result.errors});
    const validatedPack = result.pack;
    const {packId, packVersion} = validatedPack;
    if (source === 'imported' && packId.startsWith('unscripted-')) throw Object.assign(new Error('Reserved builtin namespace'), {code:'RESERVED_ID'});
    const contentDigest = await computePackDigest(validatedPack);
    // No await between lookup and insertion, including first registration of a pack.
    const versions = packs.get(packId) ?? new Map();
    const existing = versions.get(packVersion);
    if (existing && existing.contentDigest !== contentDigest) throw Object.assign(new Error('Conflicting immutable version'), {code:'VERSION_CONFLICT'});
    if (existing) return structuredClone(existing);
    const record = {packId, packVersion, source, contentDigest, validatedPack};
    versions.set(packVersion, record);
    packs.set(packId, versions);
    return structuredClone(record);
  }
  return {
    registerBuiltin: () => register(coreText, 'builtin'),
    async registerBuiltins() {
      const coreRecord = await register(coreText, 'builtin');
      const introRecord = await register(introText, 'builtin');
      const records = [coreRecord, introRecord];
      // v1 persistence uses question IDs without pack prefixes.
      const ids = records.flatMap(record => record.validatedPack.questions.map(question => question.id));
      if (new Set(ids).size !== ids.length) throw Error('DUPLICATE_BUILTIN_QUESTION_ID');
      return records;
    },
    registerImported: input => register(input, 'imported'),
    get: (id, version) => structuredClone(packs.get(id)?.get(version)),
    versions: id => [...(packs.get(id)?.keys() ?? [])].sort(comparePackVersions),
    list: () => [...packs.keys()].sort(),
  };
}
