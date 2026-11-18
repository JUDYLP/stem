import { visit } from 'jsonc-parser';

export const MAX_BYTES = 1024 * 1024;
export const MAX_DEPTH = 32;
const forbidden = new Set(['__proto__', 'constructor', 'prototype']);

export function jsonPath(parts) {
  return '$' + parts.map(p => typeof p === 'number' ? `[${p}]`
    : /^[A-Za-z_$][\w$]*$/.test(p) ? `.${p}` : `[${JSON.stringify(p)}]`).join('');
}

class InputError extends Error {
  constructor(code, path, message) { super(message); this.code = code; this.path = path; }
}

// No objects representing input data are built during this token visit.
// Each object scope has its own decoded member-name set (escaped aliases collide).
export function parseStrictJson(text) {
  const stack = [];
  const fail = (code, path, message) => { throw new InputError(code, path, message); };
  function unicode(value, path) {
    if (!value.isWellFormed()) fail('INVALID_UNICODE', path, 'Unpaired Unicode surrogate is not allowed');
  }
  function begin(names, path) {
    if (stack.length === MAX_DEPTH) fail('MAX_DEPTH', jsonPath(path()), 'JSON nesting exceeds 32 containers');
    stack.push(names);
  }
  try {
    visit(text, {
      onObjectBegin: (_o, _l, _line, _col, path) => begin(new Set(), path),
      onArrayBegin: (_o, _l, _line, _col, path) => begin(null, path),
      onObjectEnd: () => { stack.pop(); },
      onArrayEnd: () => { stack.pop(); },
      onObjectProperty: (key, _o, _l, _line, _col, path) => {
        const location = jsonPath([...path(), key]);
        unicode(key, location);
        if (forbidden.has(key)) fail('DANGEROUS_KEY', location, 'Reserved object member is forbidden');
        const names = stack.at(-1);
        if (names.has(key)) fail('DUPLICATE_JSON_KEY', location, 'JSON object member must be unique');
        names.add(key);
      },
      onLiteralValue: (value, _o, _l, _line, _col, path) => {
        if (typeof value === 'string') unicode(value, jsonPath(path()));
        if (typeof value === 'number' && !Number.isFinite(value)) {
          fail('NON_FINITE_NUMBER', jsonPath(path()), 'JSON number must be finite');
        }
      },
      onError: () => fail('INVALID_JSON', '$', 'Invalid JSON syntax'),
    }, { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false });
    // Native grammar check is intentional: JSONC's tolerant parser must never repair input.
    return { value: JSON.parse(text) };
  } catch (error) {
    if (error instanceof InputError) return { error: { code: error.code, path: error.path, message: error.message } };
    if (error instanceof SyntaxError) return { error: { code: 'INVALID_JSON', path: '$', message: 'Invalid JSON syntax' } };
    throw error;
  }
}
