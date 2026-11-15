export const STORAGE_KEY = 'unscripted.progress.v1';
export const emptyProgress = () => ({ schemaVersion: 1, items: {} });
const object = value => value && typeof value === 'object' && !Array.isArray(value);
export function parseProgress(raw) {
  if (raw === null) return emptyProgress();
  const data = JSON.parse(raw);
  if (!object(data) || data.schemaVersion !== 1 || !object(data.items)) throw new Error('记录版本或格式不兼容');
  const items = {};
  for (const [key, item] of Object.entries(data.items)) {
    if (!/^[a-z0-9-]+::L[123]$/.test(key) || !object(item) || !['pass', 'review'].includes(item.status) || typeof item.updatedAt !== 'string' || !Number.isFinite(Date.parse(item.updatedAt))) throw new Error('记录内容损坏');
    items[key] = { status: item.status, updatedAt: item.updatedAt };
  }
  return { schemaVersion: 1, items };
}
// Unreadable records stay untouched; this session can continue in memory.
export function createProgressStore(getStorage = () => window.localStorage) {
  let data = emptyProgress(), storage, warning = '';
  try { storage = getStorage(); data = parseProgress(storage.getItem(STORAGE_KEY)); }
  catch { storage = null; warning = '本地记录不可读、已损坏或版本不兼容。原记录未覆盖；本次仅在内存中练习，刷新会丢失新自评。'; }
  return {
    snapshot: () => structuredClone(data),
    get warning() { return warning; },
    rate(key, status) {
      if (!/^[a-z0-9-]+::L[123]$/.test(key) || !['pass', 'review'].includes(status)) throw new Error('无效自评');
      data.items[key] = { status, updatedAt: new Date().toISOString() };
      if (storage) {
        try { storage.setItem(STORAGE_KEY, JSON.stringify(data)); }
        catch { storage = null; warning = '本地保存失败。本次自评仅在内存中有效，请先导出复习单；刷新会丢失本次更改。'; }
      }
    },
  };
}
