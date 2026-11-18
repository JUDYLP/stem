import canonicalize from 'canonicalize';

// Accept JSON produced by the pack validator.
export async function computePackDigest(pack) {
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto SHA-256 unavailable');
  const bytes = new TextEncoder().encode(canonicalize(pack));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return 'sha256:' + Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}
