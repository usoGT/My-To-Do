// Pomodoro zamanlayıcısı — sayfadan bağımsız tek modül; sayfa değişse de, yenilense de devam eder.
// Süre setInterval saymasıyla değil endsAt - Date.now() ile hesaplanır (arka planda kayma olmaz).

const KEY = 'planlayici-timer';
export const MODE_LABELS = { focus: 'Odak', short: 'Kısa mola', long: 'Uzun mola' };

// ---------- Saf yardımcılar (test edilir) ----------
// completedFocusCount: bu odak dahil tamamlanan odak sayısı
export function nextMode(mode, completedFocusCount, longBreakEvery) {
  if (mode !== 'focus') return 'focus';
  return completedFocusCount > 0 && completedFocusCount % longBreakEvery === 0 ? 'long' : 'short';
}

export const remainingFrom = (endsAt, now) => Math.max(0, endsAt - now);

export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function durationFor(mode, p) {
  const min = mode === 'focus' ? p.focusMin : mode === 'short' ? p.shortBreakMin : p.longBreakMin;
  return min * 60 * 1000;
}

// ---------- Durum ----------
let getSettings = () => ({ focusMin: 25, shortBreakMin: 5, longBreakMin: 15, longBreakEvery: 4, autoStartNext: false });
let onFinishCb = () => {};
let onSessionCb = () => {};
let interval = null;
const listeners = new Set();

const localDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

let t = {
  mode: 'focus',
  running: false,
  endsAt: null,
  remainingMs: null, // null = henüz başlamadı (tam süre)
  startedAt: null, // odak seansının başladığı an (ISO)
  taskId: null,
  courseId: null,
  completedFocusCount: 0,
  cycleDay: localDay(),
};

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* depolama yok */ }
}

function emit() {
  save();
  listeners.forEach((fn) => { try { fn(getTimer()); } catch (err) { console.error(err); } });
}

export function subscribeTimer(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const totalMs = () => durationFor(t.mode, getSettings());

export function remainingMs(now = Date.now()) {
  if (t.running && t.endsAt) return remainingFrom(t.endsAt, now);
  return t.remainingMs ?? totalMs();
}

export function getTimer() {
  return { ...t, remaining: remainingMs(), total: totalMs() };
}

function startTicking() {
  if (interval) return;
  interval = setInterval(() => {
    if (!t.running) return;
    if (remainingMs() <= 0) complete();
    else listeners.forEach((fn) => { try { fn(getTimer(), 'tick'); } catch (err) { console.error(err); } });
  }, 250);
}

function rollDay() {
  if (t.cycleDay !== localDay()) { t.cycleDay = localDay(); t.completedFocusCount = 0; }
}

// Odak süresi doldu ya da mola bitti
function complete({ silent = false } = {}) {
  const finished = t.mode;
  const p = getSettings();
  rollDay();
  let session = null;
  if (finished === 'focus') {
    const endedAt = t.endsAt ? new Date(t.endsAt) : new Date();
    session = {
      startedAt: t.startedAt || new Date(endedAt.getTime() - durationFor('focus', p)).toISOString(),
      endedAt: endedAt.toISOString(),
      durationMin: p.focusMin,
      taskId: t.taskId,
      courseId: t.courseId,
    };
    t.completedFocusCount += 1;
  }
  const next = nextMode(finished, t.completedFocusCount, p.longBreakEvery);
  t.mode = next;
  t.remainingMs = null;
  t.startedAt = null;
  t.endsAt = null;
  t.running = false;
  if (p.autoStartNext && !silent) start(false);
  if (session) onSessionCb(session);
  emit();
  if (!silent) onFinishCb(finished, next, session);
}

export function start(doEmit = true) {
  if (t.running) return;
  rollDay();
  const rem = t.remainingMs ?? totalMs();
  t.endsAt = Date.now() + rem;
  t.running = true;
  if (t.mode === 'focus' && !t.startedAt) t.startedAt = new Date().toISOString();
  t.remainingMs = rem;
  startTicking();
  if (doEmit) emit();
}

export function pause() {
  if (!t.running) return;
  t.remainingMs = remainingMs();
  t.running = false;
  t.endsAt = null;
  emit();
}

export function reset() {
  t.running = false;
  t.endsAt = null;
  t.remainingMs = null;
  t.startedAt = null;
  emit();
}

export function setMode(mode) {
  if (!MODE_LABELS[mode]) return;
  t.mode = mode;
  reset();
}

// Atla: kayıt yapmadan sıradaki moda geç
export function skip() {
  const p = getSettings();
  const next = t.mode === 'focus' ? nextMode('focus', t.completedFocusCount + 1, p.longBreakEvery) : 'focus';
  t.mode = next;
  reset();
}

// Erken bitir: odakta en az 5 dk geçtiyse geçen süre kaydedilir. Dönen değer: kaydedilen dakika (ya da 0).
export function finishEarly() {
  if (t.mode !== 'focus') { skip(); return 0; }
  const elapsedMin = Math.floor((totalMs() - remainingMs()) / 60000);
  if (elapsedMin < 5) { reset(); return 0; }
  const p = getSettings();
  rollDay();
  const session = {
    startedAt: t.startedAt || new Date(Date.now() - elapsedMin * 60000).toISOString(),
    endedAt: new Date().toISOString(),
    durationMin: elapsedMin,
    taskId: t.taskId,
    courseId: t.courseId,
  };
  t.completedFocusCount += 1;
  t.mode = nextMode('focus', t.completedFocusCount, p.longBreakEvery);
  t.running = false;
  t.endsAt = null;
  t.remainingMs = null;
  t.startedAt = null;
  onSessionCb(session);
  emit();
  return elapsedMin;
}

export function setTarget({ taskId = null, courseId = null }) {
  t.taskId = taskId || null;
  t.courseId = courseId || null;
  emit();
}

// Ayarlarda süre değişince başlamamış sayaç yeni süreyi göstersin.
export function settingsChanged() {
  emit();
}

export function initTimer({ settings, onFinish, onSession }) {
  getSettings = settings;
  onFinishCb = onFinish;
  onSessionCb = onSession;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && MODE_LABELS[saved.mode]) t = { ...t, ...saved };
  } catch { /* bozuksa varsayılan */ }
  rollDay();
  if (t.running) {
    if (remainingMs() <= 0) complete({ silent: false });
    else startTicking();
  }
  emit();
}
