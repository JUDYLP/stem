// Shared compiler policy; only used in Node/build time.
export function packAjvOptions() {
  return {
    strict: true, strictRequired: false, allErrors: false,
    coerceTypes: false, useDefaults: false, removeAdditional: false, ownProperties: true,
    code: { source: true, esm: true },
  };
}
