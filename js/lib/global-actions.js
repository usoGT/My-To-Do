// Üst çubuk gibi sayfa dışı düğmelerin eylemleri (hızlı not, komut paleti) burada kaydedilir.
const actions = new Map();

export function registerGlobalAction(name, fn) { actions.set(name, fn); }
export function runGlobalAction(name, ...args) {
  const fn = actions.get(name);
  if (fn) { fn(...args); return true; }
  return false;
}
export const hasGlobalAction = (name) => actions.has(name);
