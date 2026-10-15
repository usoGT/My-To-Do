// Tek veri kaynağı. Veri SADECE update() ile değişir.
import { createDefaultState, migrate } from './schema.js';

export const DEFAULT_KEY = 'planlayici-data';

let state = null;
let storage = null;
let key = DEFAULT_KEY;
const listeners = new Set();
const errorListeners = new Set();
const changeListeners = new Set();

// Testler için bellek içi depolama.
export function createMemoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    _data: data,
  };
}

function safeStorage() {
  try {
    const s = window.localStorage;
    const t = '__planlayici_test__';
    s.setItem(t, '1');
    s.removeItem(t);
    return s;
  } catch {
    return createMemoryStorage(); // gizli pencere vb.: veri oturum boyunca bellekte kalır
  }
}

// Uygulama açılışında bir kez çağrılır. Testler bellek içi bir storage verir.
export function initStore({ storage: s, storageKey = DEFAULT_KEY } = {}) {
  storage = s || safeStorage();
  key = storageKey;
  listeners.clear();
  changeListeners.clear();
  const rawValue = storage.getItem(key);
  if (rawValue === null) {
    state = createDefaultState();
    persist();
    return state;
  }
  try {
    state = migrate(JSON.parse(rawValue));
  } catch (err) {
    // Bozuk veri: kaybolmasın diye ayrı bir anahtara yedekle, varsayılanla devam et.
    try { storage.setItem(`${key}-bozuk-${Date.now()}`, rawValue); } catch { /* yer yoksa geç */ }
    console.error('Kayıtlı veri okunamadı, varsayılan veriyle başlatıldı.', err);
    state = createDefaultState();
  }
  persist();
  return state;
}

// State'i okur. Dönen nesne DEĞİŞTİRİLMEZ, sadece okunur.
export function getState() {
  return state;
}

function persist() {
  try {
    storage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.error('Veri kaydedilemedi.', err);
    errorListeners.forEach((fn) => fn(err));
  }
}

// Tek değişiklik kapısı. label: hata ayıklama için kısa ad ('tasks/add').
export function update(label, recipe) {
  if (!state) throw new Error('Store başlatılmadı: önce initStore() çağır.');
  const prev = state;
  const next = structuredClone(state);
  recipe(next);
  state = next;
  persist();
  changeListeners.forEach((fn) => {
    try { fn(prev, state, label); } catch (err) { console.error(err); }
  });
  listeners.forEach((fn) => {
    try { fn(state, label); } catch (err) { console.error(err); }
  });
  return state;
}

// Değişiklikleri dinler; dinlemeyi bırakmak için dönen fonksiyon çağrılır.
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Önceki ve yeni state ile çağrılır (senkronizasyon hangi kayıtların değiştiğini buradan bulur).
export function subscribeChanges(fn) {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}

// Kayıt hatalarını (ör. kota doldu) dinler.
export function onPersistError(fn) {
  errorListeners.add(fn);
  return () => errorListeners.delete(fn);
}

// Yedek yüklerken ya da "tüm verileri sil"de kullanılır.
export function replaceState(newState, label = 'state/replace') {
  return update(label, (s) => {
    const m = migrate(structuredClone(newState));
    Object.keys(s).forEach((k) => delete s[k]);
    Object.assign(s, m);
  });
}

// Depolamadaki ham veri boyutu (bayt, yaklaşık).
export function storageSize() {
  const v = storage && storage.getItem(key);
  return v ? new Blob([v]).size : 0;
}
