import { MAX_BYTES, parseStrictJson, jsonPath } from './strict-json.js';
import { validatePackSemantics, MAX_ERRORS } from './semantics.js';

// Shared by Node and standalone browser entry points; no Schema compilation here.
export function createPackValidator(validateStructure) {
  const failure = (code, message, path = '$') => ({ valid: false, errors: [{ code, path, message }] });

  function validateQuestionPackText(text) {
    if (typeof text !== 'string') return failure('INPUT_TYPE', 'Input must be a JSON string');
    // Any UTF-8 encoding is at least as long as its UTF-16 code-unit count.
    if (text.length > MAX_BYTES || new TextEncoder().encode(text).byteLength > MAX_BYTES) {
      return failure('MAX_BYTES', 'UTF-8 input exceeds 1 MiB');
    }
    if (!text.isWellFormed()) return failure('INVALID_UNICODE', 'Unpaired Unicode surrogate is not allowed');
    const parsed = parseStrictJson(text);
    if (parsed.error) return { valid: false, errors: [parsed.error] };
    const pack = parsed.value;
    if (pack && typeof pack === 'object' && !Array.isArray(pack)
        && Object.hasOwn(pack, 'schemaVersion') && pack.schemaVersion !== 1) {
      return failure('UNSUPPORTED_SCHEMA_VERSION', 'Only schema version 1 is supported', '$.schemaVersion');
    }
    if (!validateStructure(pack)) {
      // Fail fast inside Ajv; cap again as a public API invariant. Never return data or Ajv params.
      const errors = validateStructure.errors.slice(0, MAX_ERRORS).map(error => {
        const parts = error.instancePath.split('/').slice(1).map(s => s.replace(/~1/g, '/').replace(/~0/g, '~'));
        const pathParts = [];
        let node = pack;
        for (const part of parts) {
          pathParts.push(Array.isArray(node) ? Number(part) : part);
          node = node?.[part];
        }
        if (error.keyword === 'required') pathParts.push(error.params.missingProperty);
        if (error.keyword === 'additionalProperties') pathParts.push(error.params.additionalProperty);
        return {
          code: error.keyword === 'additionalProperties' ? 'UNKNOWN_FIELD' : `SCHEMA_${error.keyword.toUpperCase()}`,
          path: jsonPath(pathParts), message: `Value violates schema rule: ${error.keyword}`,
        };
      });
      return { valid: false, errors };
    }
    const errors = validatePackSemantics(pack);
    return errors.length ? { valid: false, errors } : { valid: true, errors: [], pack };
  }

  function validateQuestionPackBytes(bytes) {
    if (!(bytes instanceof Uint8Array)) return failure('INPUT_TYPE', 'Input must be a Uint8Array');
    if (bytes.byteLength > MAX_BYTES) return failure('MAX_BYTES', 'UTF-8 input exceeds 1 MiB');
    let text;
    try {
      // Preserve a BOM so strict JSON rejects it instead of silently repairing the file.
      text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    } catch {
      return failure('INVALID_UTF8', 'Input must be valid UTF-8');
    }
    return validateQuestionPackText(text);
  }

  return { validateQuestionPackText, validateQuestionPackBytes };
}

// No Number conversion: compare decimal lengths, then equal-length ASCII digits.
export function comparePackVersions(a, b) {
  const pattern = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?![\s\S])/;
  if (typeof a !== 'string' || typeof b !== 'string' || !pattern.test(a) || !pattern.test(b)) {
    throw new TypeError('Invalid pack version: expected MAJOR.MINOR.PATCH without leading zeros or suffixes');
  }
  const left = a.split('.'), right = b.split('.');
  for (let i = 0; i < 3; i++) {
    if (left[i].length !== right[i].length) return left[i].length < right[i].length ? -1 : 1;
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
  }
  return 0;
}
