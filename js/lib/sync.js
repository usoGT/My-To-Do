// Hesap senkronizasyonu: yerel değişiklikler "giden kutusu"na yazılır, sunucuya gönderilir;
// sonra sunucudaki yeni kayıtlar çekilir. Kayıt bazında son yazan kazanır; bu cihazda
// gönderilmemiş bir değişiklik varsa o kayıt için yerel sürüm korunur.
import { getState, update, subscribeChanges, replaceState } from '../store/store.js';
import { createDefaultState } from '../store/schema.js';
import * as api from './supabase.js';
import { diffStates, recordsFromState, applyRemote, keyOf, attachmentIdsOf, maxCursor, hasUserData } from './sync-core.js';
import { getFile, putFile, clearFiles } from './files-db.js';

const OUTBOX_KEY = 'planlayici-sync-outbox';
const META_KEY = 'planlayici-sync-meta';
const PUSH_DELAY = 1500;
const POLL_EVERY = 30 * 1000;
const CURSOR_OVERLAP_MS = 5000; // aynı anda yazılan satırları kaçırmamak için

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* yer yok */ } };

let outbox = read(OUTBOX_KEY, {}); // key → { collection, id, data }
let meta = read(META_KEY, { userId: null, cursor: null, lastSyncAt: null, uploadQueue: [], deleteQueue: [] });
let status = { state: 'off', error: null };
let applyingRemote = false;
let paused = false;
let pushTimer = null;
let pollTimer = null;
let running = null;
const listeners = new Set();

const saveOutbox = () => write(OUTBOX_KEY, outbox);
const saveMeta = () => write(META_KEY, meta);

export function getSyncStatus() {
  return { ...status, pending: Object.keys(outbox).length + meta.uploadQueue.length, lastSyncAt: meta.lastSyncAt, user: api.getUser() };
}
export function onSyncStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function setStatus(state, error = null) {
  status = { state, error };
  const s = getSyncStatus();
  listeners.forEach((fn) => { try { fn(s); } catch (err) { console.error(err); } });
}

const signedIn = () => Boolean(api.isConfigured() && api.getUser() && meta.userId === api.getUser().id);

// ---------- Yerel değişiklikleri yakala ----------
function queue(changes) {
  for (const c of changes) outbox[keyOf(c.collection, c.id)] = c;
  saveOutbox();
}

function trackAttachments(prev, next) {
  const before = attachmentIdsOf(prev);
  const after = attachmentIdsOf(next);
  let changed = false;
  for (const id of after) if (!before.has(id) && !meta.uploadQueue.includes(id)) { meta.uploadQueue.push(id); changed = true; }
  for (const id of before) {
    if (!after.has(id)) {
      meta.uploadQueue = meta.uploadQueue.filter((x) => x !== id);
      if (!meta.deleteQueue.includes(id)) meta.deleteQueue.push(id);
      changed = true;
    }
  }
  if (changed) saveMeta();
}

function onLocalChange(prev, next) {
  if (applyingRemote || paused || !signedIn()) return;
  const changes = diffStates(prev, next);
  if (!changes.length) return;
  queue(changes);
  trackAttachments(prev, next);
  schedulePush();
}

function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { syncNow().catch(() => {}); }, PUSH_DELAY);
  setStatus(navigator.onLine === false ? 'offline' : 'pending');
}

// ---------- Gönder / çek ----------
async function push() {
  const entries = Object.entries(outbox);
  for (let i = 0; i < entries.length; i += 300) {
    const batch = entries.slice(i, i + 300);
    await api.upsertItems(batch.map(([, r]) => r));
    // Gönderim sırasında aynı kayıt tekrar değiştiyse kutuda kalsın
    for (const [k, r] of batch) if (outbox[k] === r) delete outbox[k];
    saveOutbox();
  }
  for (const id of [...meta.uploadQueue]) {
    const blob = await getFile(id).catch(() => null);
    if (blob) await api.uploadFile(id, blob);
    meta.uploadQueue = meta.uploadQueue.filter((x) => x !== id);
    saveMeta();
  }
  if (meta.deleteQueue.length) {
    await api.removeFiles(meta.deleteQueue).catch(() => {});
    meta.deleteQueue = [];
    saveMeta();
  }
}

async function pull() {
  const since = meta.cursor ? new Date(new Date(meta.cursor).getTime() - CURSOR_OVERLAP_MS).toISOString() : null;
  let offset = 0;
  let cursor = meta.cursor;
  const all = [];
  for (;;) {
    const rows = await api.fetchItems({ since, offset, limit: 1000 });
    all.push(...rows);
    cursor = maxCursor(cursor, rows);
    if (rows.length < 1000) break;
    offset += rows.length;
  }
  if (all.length) {
    const skip = new Set(Object.keys(outbox));
    applyingRemote = true;
    try {
      let n = 0;
      update('sync/pull', (s) => { n = applyRemote(s, all, skip); });
      void n;
    } finally {
      applyingRemote = false;
    }
  }
  meta.cursor = cursor;
  saveMeta();
}

export function syncNow() {
  if (!signedIn()) return Promise.resolve();
  if (running) return running;
  if (navigator.onLine === false) { setStatus('offline'); return Promise.resolve(); }
  clearTimeout(pushTimer);
  setStatus('syncing');
  running = (async () => {
    try {
      await push();
      await pull();
      meta.lastSyncAt = new Date().toISOString();
      saveMeta();
      setStatus(Object.keys(outbox).length ? 'pending' : 'idle');
    } catch (err) {
      if (err.code === 'network') setStatus('offline', err.message);
      else if (err.status === 401) { setStatus('error', err.message); }
      else setStatus('error', err.message);
      throw err;
    } finally {
      running = null;
    }
  })();
  return running;
}

// ---------- Oturum başlangıcı ----------
// Hesapta veri var mı? (ilk girişte birleştirme sorusu için)
export async function remoteHasData() {
  const rows = await api.countItems();
  return Array.isArray(rows) && rows.length > 0;
}

export const localHasData = () => hasUserData(getState());

// mode: 'merge' → bu cihazdaki veriler hesaba eklenir; 'replace' → bu cihazdaki veriler silinip hesaptakiler gelir
export async function startForUser(mode) {
  const user = api.getUser();
  if (!user) return;
  paused = true;
  try {
    outbox = {};
    meta = { userId: user.id, cursor: null, lastSyncAt: null, uploadQueue: [], deleteQueue: [] };
    if (mode === 'replace') {
      await clearFiles().catch(() => {});
      applyingRemote = true;
      try { replaceState({ ...createDefaultState(), settings: getState().settings }, 'sync/reset'); } finally { applyingRemote = false; }
    } else {
      queue(recordsFromState(getState()));
      meta.uploadQueue = [...attachmentIdsOf(getState())];
    }
    saveOutbox();
    saveMeta();
  } finally {
    paused = false;
  }
  startPolling();
  return syncNow();
}

// Çıkış: bu cihazdaki veriler silinir (hesapta güvende kalır)
export async function signOutAndClear() {
  stopPolling();
  await api.signOut();
  outbox = {};
  meta = { userId: null, cursor: null, lastSyncAt: null, uploadQueue: [], deleteQueue: [] };
  saveOutbox();
  saveMeta();
  paused = true;
  try {
    await clearFiles().catch(() => {});
    replaceState(createDefaultState(), 'sync/signout');
  } finally {
    paused = false;
  }
  setStatus('off');
}

// Ek dosyası bu cihazda yoksa hesaptan indirir ve saklar.
export async function fetchMissingFile(id) {
  if (!signedIn()) return null;
  const blob = await api.downloadFile(id);
  await putFile(id, blob);
  return blob;
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(() => { if (document.visibilityState !== 'hidden') syncNow().catch(() => {}); }, POLL_EVERY);
}
function stopPolling() { clearInterval(pollTimer); pollTimer = null; }

export const isSignedIn = signedIn;

// Uygulama açılışında çağrılır.
export function initSync() {
  // Store başlatıldıktan sonra dinlemeye başlanır (initStore dinleyicileri sıfırlar).
  subscribeChanges(onLocalChange);
  api.onAuthChange((s) => {
    if (!s) { stopPolling(); setStatus('off'); }
  });
  window.addEventListener('online', () => syncNow().catch(() => {}));
  window.addEventListener('offline', () => { if (signedIn()) setStatus('offline'); });
  window.addEventListener('focus', () => syncNow().catch(() => {}));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow().catch(() => {}); });
  if (signedIn()) {
    setStatus(Object.keys(outbox).length ? 'pending' : 'idle');
    startPolling();
    syncNow().catch(() => {});
  } else if (api.getUser() && meta.userId !== api.getUser().id) {
    // Oturum var ama bu cihazda henüz eşitleme başlatılmamış (ör. e-posta doğrulama dönüşü)
    setStatus('needs-setup');
  } else {
    setStatus('off');
  }
}
