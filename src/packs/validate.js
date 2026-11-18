// Node/dev reference entry. Browser bundles use standalone generated code instead.
import Ajv2020 from 'ajv/dist/2020.js';
import schema from '../../docs/architecture/question-pack.schema.v1.json' with { type: 'json' };
import { packAjvOptions } from './ajv-options.js';
import { createPackValidator } from './core.js';
export { comparePackVersions } from './core.js';
const validateStructure = new Ajv2020(packAjvOptions()).compile(schema);
export const { validateQuestionPackText, validateQuestionPackBytes } = createPackValidator(validateStructure);
