// Giriş noktası: store'u başlat, temayı uygula, düzeni çiz, router'ı başlat.
import { qs, delegate } from './lib/dom.js';
import { applyTheme, isDarkNow, watchSystemTheme, takeLegacyThemePref } from './lib/theme.js';
import { sidebarView, bottombarView, markActive } from './components/sidebar.js';
import { topbarView } from './components/topbar.js';
import { toast } from './components/toast.js';
import { startRouter, onRouteChange, getCurrentRoute } from './router.js';
import { initStore, getState, subscribe, onPersistError } from './store/store.js';
import { updateSettings } from './store/actions/settings.js';
import { getCoursesSorted, getDueReminders } from './store/selectors.js';
import { markReminderSent } from './store/actions/tasks.js';
import { formatDateLong, todayKey, toLocalDateTime } from './lib/dates.js';
import { hasGlobalAction, runGlobalAction, registerGlobalAction } from './lib/global-actions.js';
import { initTimer, subscribeTimer, getTimer, formatClock, MODE_LABELS, setTarget, settingsChanged } from './lib/timer.js';
import { addPomodoroSession } from './store/actions/pomodoro.js';
import { playBeep, notify } from './lib/alerts.js';
import { html } from './lib/dom.js';
import { initShortcuts } from './lib/shortcuts.js';
import { openQuickNote } from './components/quick-note.js';
import { openPalette } from './components/command-palette.js';
import { accountChipView } from './components/sidebar.js';
import * as api from './lib/supabase.js';
import { initSync, getSyncStatus, onSyncStatus, syncNow } from './lib/sync.js';
import { icon } from './lib/icons.js';
import { isCapacitor, isNative } from './lib/platform.js';
import { nativeScheduleAt, nativeCancel, setStatusBar } from './lib/native.js';

// ---------- Telefon: zamanlanmış bildirimler (uygulama arka plandayken / kapalıyken de gelir) ----------
const POMO_NOTIF_ID = 900001;
const REMINDER_IDS_KEY = 'planlayici-native-reminders';
let lastPomoSig = '';
function syncPomodoroNotification() {
  if (!isCapacitor) return;
  const t = getTimer();
  const sig = t.running && t.endsAt ? `${t.mode}|${t.endsAt}` : '';
  if (sig === lastPomoSig) return;
  lastPomoSig = sig;
  nativeCancel([POMO_NOTIF_ID]).then(() => {
    if (!sig) return;
    const focus = t.mode === 'focus';
    nativeScheduleAt(POMO_NOTIF_ID, new Date(t.endsAt), focus ? 'Odak bitti' : 'Mola bitti', focus ? 'Mola zamanı.' : 'Yeni bir odak seansına hazır mısın?');
  });
}

// Görev hatırlatıcılarını telefona zamanlar (en yakın 50 tanesi)
const hashId = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 800000; return 100000 + h; };
let lastReminderSig = '';
async function syncNativeReminders(state) {
  if (!isCapacitor) return;
  const now = toLocalDateTime();
  const list = state.tasks
    .filter((t) => !t.done && t.reminderAt && !t.reminderSent && t.reminderAt > now)
    .sort((a, b) => a.reminderAt.localeCompare(b.reminderAt))
    .slice(0, 50);
  const sig = JSON.stringify(list.map((t) => [t.id, t.reminderAt, t.title]));
  if (sig === lastReminderSig) return;
  lastReminderSig = sig;
  let old = [];
  try { old = JSON.parse(localStorage.getItem(REMINDER_IDS_KEY) || '[]'); } catch { old = []; }
  await nativeCancel(old);
  const ids = [];
  for (const t of list) {
    const [d, tm] = t.reminderAt.split('T');
    const [y, m, day] = d.split('-').map(Number);
    const [h, mi] = tm.split(':').map(Number);
    const id = hashId(t.id);
    ids.push(id);
    await nativeScheduleAt(id, new Date(y, m - 1, day, h, mi), 'Hatırlatıcı', `${t.title}${t.time ? ` · ${t.time}` : ''}`);
  }
  try { localStorage.setItem(REMINDER_IDS_KEY, JSON.stringify(ids)); } catch { /* yok say */ }
}

const SYNC_TEXT = { off: 'Eşitleme kapalı', idle: 'Eşitlendi', pending: 'Eşitlenecek', syncing: 'Eşitleniyor…', offline: 'Çevrimdışı', error: 'Eşitleme hatası', 'needs-setup': 'Eşitleme başlatılmadı' };
const SYNC_TONE = { idle: 'success', pending: 'primary', syncing: 'primary', offline: 'warning', error: 'danger', 'needs-setup': 'warning', off: 'neutral' };

// ---------- Hesap: kenar çubuğu satırı ve üst çubuktaki eşitleme göstergesi ----------
function drawAccount() {
  const s = getSyncStatus();
  const slot = qs('#sidebar-account');
  if (slot) {
    slot.innerHTML = String(accountChipView({ user: api.getUser(), configured: api.isConfigured(), syncState: SYNC_TONE[s.state] || 'neutral', syncLabel: SYNC_TEXT[s.state] || '' }));
    markActive(getCurrentRoute().path || '');
  }
  const sync = qs('#sync-slot');
  if (sync) {
    const show = api.getUser() && s.state !== 'off';
    sync.innerHTML = show ? String(html`
      <button type="button" class="btn btn--ghost btn--icon sync-btn ${s.state === 'syncing' ? 'is-spinning' : ''}" data-action="sync-click"
        aria-label="${SYNC_TEXT[s.state]}${s.pending ? `, ${s.pending} bekleyen değişiklik` : ''}" title="${SYNC_TEXT[s.state]}">${icon('repeat')}<span class="sync-dot tone-${SYNC_TONE[s.state]}"></span></button>`) : '';
  }
}

const sidebarEl = qs('#sidebar');
const topbarEl = qs('#topbar');
const bottombarEl = qs('#bottombar');
const backdropEl = qs('#drawer-backdrop');
const pageEl = qs('#page');

let pageTitle = '';
let lastTheme = null;
let lastCoursesSig = null;
let lastDay = todayKey();

function drawTopbar() {
  topbarEl.innerHTML = String(topbarView({ title: pageTitle, dateText: formatDateLong(todayKey()), isDark: isDarkNow() }));
  drawMiniTimer();
  drawAccount();
}

// ---------- Pomodoro: mini sayaç, sekme başlığı, bitiş uyarıları ----------
function drawMiniTimer() {
  const slot = qs('#mini-timer-slot');
  if (!slot) return;
  const t = getTimer();
  const active = t.running || (t.remainingMs !== null && t.remaining < t.total);
  const onPage = getCurrentRoute().path === '/pomodoro';
  if (!active || onPage) { if (slot.innerHTML) slot.innerHTML = ''; return; }
  const markup = String(html`
    <a class="mini-timer ${t.running ? '' : 'paused'}" href="#/pomodoro" aria-label="Pomodoro: ${MODE_LABELS[t.mode]}, kalan ${formatClock(t.remaining)}">
      <span class="pulse"></span><span>${formatClock(t.remaining)}</span>
    </a>`);
  if (slot.innerHTML !== markup) slot.innerHTML = markup;
}

function updateDocTitle() {
  const t = getTimer();
  document.title = t.running
    ? `${formatClock(t.remaining)} · ${MODE_LABELS[t.mode]} · My to do`
    : (pageTitle ? `${pageTitle} · My to do` : 'My to do');
}

// ---------- Görev hatırlatıcıları (Faz 14): uygulama açıkken 30 sn'de bir kontrol ----------
function checkReminders() {
  const due = getDueReminders(getState(), toLocalDateTime());
  for (const t of due) {
    markReminderSent(t.id);
    const body = `${t.title}${t.time ? ` · ${t.time}` : ''}`;
    if (getState().settings.pomodoro.sound) playBeep();
    const shown = document.hidden && notify('Hatırlatıcı', body);
    if (!shown) toast(`Hatırlatıcı: ${body}`, { duration: 10000, action: { label: 'Aç', onClick: () => import('./components/task-form.js').then((m) => m.openTaskForm({ task: getState().tasks.find((x) => x.id === t.id) })) } });
  }
}

function setupTimer() {
  initTimer({
    settings: () => getState().settings.pomodoro,
    onSession: (session) => addPomodoroSession(session),
    onFinish: (finished, next, session) => {
      const p = getState().settings.pomodoro;
      if (p.sound) playBeep();
      const task = session && session.taskId ? getState().tasks.find((x) => x.id === session.taskId) : null;
      const title = finished === 'focus' ? 'Odak bitti' : 'Mola bitti';
      const body = finished === 'focus'
        ? `${task ? `${task.title} · ` : ''}${session.durationMin} dk. ${next === 'long' ? 'Uzun mola zamanı.' : 'Mola zamanı.'}`
        : 'Yeni bir odak seansına hazır mısın?';
      // Telefonda bildirim zaten süre başlarken zamanlandı; burada sadece uygulama içi uyarı
      if (isCapacitor) toast(`${title}. ${body}`, { type: 'success', duration: 8000 });
      else if (document.hidden || !notify(title, body)) toast(`${title}. ${body}`, { type: 'success', duration: 8000 });
      else toast(`${title}. ${body}`, { type: 'success' });
    },
  });
  subscribeTimer(() => { drawMiniTimer(); updateDocTitle(); syncPomodoroNotification(); });
  registerGlobalAction('start-pomodoro', ({ taskId, courseId } = {}) => {
    const t = getTimer();
    if (!t.running) setTarget({ taskId, courseId });
  });
  let lastPomo = JSON.stringify(getState().settings.pomodoro);
  subscribe((state) => {
    const sig = JSON.stringify(state.settings.pomodoro);
    if (sig !== lastPomo) { lastPomo = sig; settingsChanged(); }
  });
}

function drawSidebar(state) {
  const courses = getCoursesSorted(state);
  const sig = JSON.stringify(courses.map((c) => [c.id, c.name, c.color]));
  if (sig === lastCoursesSig) return;
  lastCoursesSig = sig;
  sidebarEl.innerHTML = String(sidebarView(courses));
  markActive(getCurrentRoute().path || '');
  drawAccount();
}

function syncTheme(state) {
  if (state.settings.theme === lastTheme) return;
  lastTheme = state.settings.theme;
  applyTheme(lastTheme);
  setStatusBar(isDarkNow());
  drawTopbar();
}

function openDrawer() {
  sidebarEl.classList.add('open');
  backdropEl.classList.add('open');
  qs('[data-action="open-drawer"]', bottombarEl)?.setAttribute('aria-expanded', 'true');
  qs('.nav-link', sidebarEl)?.focus();
}

function closeDrawer() {
  if (!sidebarEl.classList.contains('open')) return;
  sidebarEl.classList.remove('open');
  backdropEl.classList.remove('open');
  qs('[data-action="open-drawer"]', bottombarEl)?.setAttribute('aria-expanded', 'false');
}

function init() {
  initStore();

  const legacy = takeLegacyThemePref();
  if (legacy && legacy !== getState().settings.theme) {
    try { updateSettings({ theme: legacy }); } catch { /* geçersizse yok say */ }
  }

  watchSystemTheme(drawTopbar);
  syncTheme(getState());
  drawSidebar(getState());
  bottombarEl.innerHTML = String(bottombarView());
  drawTopbar();

  subscribe((state) => {
    syncTheme(state);
    drawSidebar(state);
    syncNativeReminders(state);
  });
  syncNativeReminders(getState());

  onPersistError(() => {
    toast('Veri kaydedilemedi: tarayıcı depolaması dolu olabilir. Yedek alıp eski ekleri silmeyi dene.', { type: 'error', duration: 8000 });
  });

  delegate(document, 'click', '[data-action]', (e, el) => {
    const action = el.dataset.action;
    if (action === 'open-drawer') openDrawer();
    else if (action === 'toggle-theme') updateSettings({ theme: isDarkNow() ? 'light' : 'dark' });
    else if (action === 'sync-click') {
      if (getSyncStatus().state === 'needs-setup' || getSyncStatus().state === 'error') location.hash = '#/hesap';
      else syncNow().catch((err) => toast(err.message, { type: 'error' }));
    }
    else if (hasGlobalAction(action) && !el.closest('#page, dialog')) runGlobalAction(action, e, el);
  });
  delegate(sidebarEl, 'click', 'a', closeDrawer);
  backdropEl.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  onRouteChange((route) => {
    if (route.title !== undefined) {
      pageTitle = route.title;
      const t = qs('#topbar-title');
      if (t) t.textContent = pageTitle;
    }
    markActive(route.path);
    closeDrawer();
    drawMiniTimer();
    updateDocTitle();
  });

  setupTimer();
  registerGlobalAction('quick-note', () => openQuickNote());
  registerGlobalAction('open-palette', () => openPalette());
  initShortcuts();

  // Gün değişince (gece yarısı) üst çubuğu ve sayfayı yenile.
  setInterval(() => {
    if (todayKey() !== lastDay) {
      lastDay = todayKey();
      drawTopbar();
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  }, 60 * 1000);

  // E-posta doğrulama / şifre sıfırlama bağlantısından dönüş (#access_token=…)
  const back = api.consumeUrlTokens();
  if (back) {
    if (back.error) {
      history.replaceState(null, '', '#/hesap');
      setTimeout(() => toast(`Bağlantı geçersiz ya da süresi dolmuş: ${back.error}`, { type: 'error', duration: 8000 }), 300);
    } else {
      history.replaceState(null, '', back.type === 'recovery' ? '#/hesap?sifre=yeni' : '#/hesap');
    }
  }
  onSyncStatus(drawAccount);
  api.onAuthChange(drawAccount);
  initSync();
  drawAccount();

  startRouter(pageEl);
  registerServiceWorker();
  checkReminders();
  setInterval(checkReminders, 30 * 1000);
}

// PWA: çevrimdışı çalışma ve "ana ekrana ekle". Sadece https ya da localhost'ta çalışır.
function registerServiceWorker() {
  if (isNative || !('serviceWorker' in navigator) || !window.isSecureContext) return;
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && hadController) {
          toast('Yeni sürüm hazır.', { duration: 15000, action: { label: 'Yenile', onClick: () => { w.postMessage('skip-waiting'); location.reload(); } } });
        }
      });
    });
  }).catch((err) => console.error('Service worker kaydedilemedi:', err));
}

init();
