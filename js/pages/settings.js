// Ayarlar sayfası: profil, görünüm, gün saatleri, Pomodoro, bildirimler, veri.
import { html, delegate, renderInto } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getState, subscribe, replaceState, storageSize } from '../store/store.js';
import { createDefaultState } from '../store/schema.js';
import { updateSettings, updatePomodoroSettings } from '../store/actions/settings.js';
import { toast } from '../components/toast.js';
import { confirmDialog } from '../components/confirm.js';
import { readFileText, parseBackupText } from '../lib/backup.js';
import { runBackup } from '../lib/backup-run.js';
import { SHORTCUTS } from '../lib/shortcuts.js';
import { isCapacitor } from '../lib/platform.js';
import { nativeNotifyPermission } from '../lib/native.js';
import { APP_VERSION } from '../version.js';
import { formatBytes } from '../lib/text.js';
import { isFilesAvailable, totalFilesSize } from '../lib/files-db.js';
import { todayKey, formatTimeAgo } from '../lib/dates.js';
import * as backupFiles from '../lib/backup-files.js';
import { isConfigured as apiConfigured, getUser as currentUser } from '../lib/supabase.js';
import { createSampleData } from '../lib/sample-data.js';

const THEME_OPTIONS = [
  { value: 'light', label: 'Açık', icon: 'sun' },
  { value: 'dark', label: 'Koyu', icon: 'moon' },
  { value: 'system', label: 'Sistem', icon: 'settings' },
];

let nativePerm = null;
function notificationStatus() {
  if (isCapacitor) {
    if (nativePerm === 'granted') return { text: 'Bildirimlere izin verildi. Pomodoro ve hatırlatıcılar uygulama kapalıyken de bildirim gönderir.', tone: 'success' };
    if (nativePerm === 'denied') return { text: 'Bildirimler kapalı. Telefonun Ayarlar → My to do → Bildirimler bölümünden açabilirsin.', tone: 'danger' };
    return { text: 'Pomodoro bittiğinde ve hatırlatıcı zamanı geldiğinde haber vermemiz için izin ver.', tone: 'muted', ask: true };
  }
  if (!('Notification' in window)) return { text: 'Bu tarayıcı bildirimleri desteklemiyor.', tone: 'muted' };
  if (Notification.permission === 'granted') return { text: 'Bildirimlere izin verildi.', tone: 'success' };
  if (Notification.permission === 'denied') return { text: 'Bildirimler reddedildi. Tarayıcı ayarlarından açabilirsin.', tone: 'danger' };
  return { text: 'Pomodoro bittiğinde haber vermemiz için izin ver.', tone: 'muted' };
}

const switchField = (id, label, checked, hint = '') => html`
  <label class="switch" for="${id}">
    <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
    <span class="track"></span>
    <span><span>${label}</span>${hint ? html`<br><span class="xsmall muted">${hint}</span>` : ''}</span>
  </label>`;

const numberField = (id, label, value, min, max, unit = 'dk') => html`
  <div class="field">
    <label for="${id}">${label}</label>
    <div class="row">
      <input type="number" class="input" id="${id}" value="${value}" min="${min}" max="${max}" step="1" inputmode="numeric" style="max-width: 96px">
      <span class="small muted">${unit}</span>
    </div>
  </div>`;

function view(state) {
  const s = state.settings;
  const p = s.pomodoro;
  const notif = notificationStatus();
  return html`
    <div class="page-header">
      <div>
        <h1>Ayarlar</h1>
        <p>Değişiklikler otomatik kaydedilir.</p>
      </div>
    </div>

    <div class="settings">
      <section class="card" aria-labelledby="set-account">
        <div class="card-header"><h2 id="set-account">${icon('repeat')} Hesap ve eşitleme</h2></div>
        ${!apiConfigured()
          ? html`<p class="small muted">Hesap sistemi kurulmadı. Kurulum: <code>docs/HESAP-KURULUM.md</code>. Veriler şu an sadece bu cihazda.</p>`
          : currentUser()
            ? html`<div class="row-between wrap"><p class="small"><b>${currentUser().email}</b> ile giriş yapıldı. Veriler tüm cihazlarında eşitleniyor.</p><a class="btn" href="#/hesap">Hesabım</a></div>`
            : html`<div class="row-between wrap"><p class="small muted">Giriş yaparsan verilerin telefonunda ve bilgisayarında aynı olur.</p><a class="btn btn--primary" href="#/hesap">Giriş yap / Kayıt ol</a></div>`}
      </section>

      <section class="card" aria-labelledby="set-profile">
        <div class="card-header"><h2 id="set-profile">${icon('user')} Profil</h2></div>
        <div class="field">
          <label for="set-name">Adın</label>
          <input class="input" id="set-name" value="${s.name}" maxlength="40" placeholder="Örn. Üsame" autocomplete="given-name">
          <span class="field-hint">Bugün sayfasında seni selamlamak için kullanılır.</span>
        </div>
      </section>

      <section class="card" aria-labelledby="set-look">
        <div class="card-header"><h2 id="set-look">${icon('palette')} Görünüm</h2></div>
        <div class="field">
          <span class="field-label" id="theme-label">Tema</span>
          <div class="segmented" role="group" aria-labelledby="theme-label">
            ${THEME_OPTIONS.map((o) => html`
              <button type="button" id="theme-${o.value}" data-action="set-theme" data-value="${o.value}" aria-pressed="${s.theme === o.value}">${o.label}</button>`)}
          </div>
        </div>
      </section>

      <section class="card" aria-labelledby="set-day">
        <div class="card-header"><h2 id="set-day">${icon('clock')} Gün saatleri</h2></div>
        <p class="small muted" style="margin-bottom: var(--space-4)">Boş zaman hesabı ve ders programı bu aralığa göre yapılır.</p>
        <div class="field-row">
          <div class="field">
            <label for="set-day-start">Gün başlangıcı</label>
            <input type="time" class="input" id="set-day-start" value="${s.dayStart}" step="900">
          </div>
          <div class="field">
            <label for="set-day-end">Gün bitişi</label>
            <input type="time" class="input" id="set-day-end" value="${s.dayEnd}" step="900">
          </div>
        </div>
        <div style="margin-top: var(--space-4)">
          ${switchField('set-weekend', 'Ders programında hafta sonunu göster', s.showWeekend)}
        </div>
      </section>

      <section class="card" aria-labelledby="set-pomo">
        <div class="card-header"><h2 id="set-pomo">${icon('timer')} Pomodoro</h2></div>
        <div class="field-row">
          ${numberField('pomo-focusMin', 'Odak', p.focusMin, 1, 90)}
          ${numberField('pomo-shortBreakMin', 'Kısa mola', p.shortBreakMin, 1, 30)}
          ${numberField('pomo-longBreakMin', 'Uzun mola', p.longBreakMin, 5, 60)}
          ${numberField('pomo-longBreakEvery', 'Uzun mola sıklığı', p.longBreakEvery, 2, 8, 'odakta bir')}
        </div>
        <div class="stack-sm" style="margin-top: var(--space-4)">
          ${switchField('pomo-autoStartNext', 'Sonraki seansı otomatik başlat', p.autoStartNext)}
          ${switchField('pomo-sound', 'Süre bitince ses çal', p.sound)}
        </div>
      </section>

      <section class="card" aria-labelledby="set-notif">
        <div class="card-header"><h2 id="set-notif">${icon('bell')} Bildirimler</h2></div>
        <div class="row-between wrap">
          <p class="small" style="color: var(--${notif.tone === 'muted' ? 'text-muted' : notif.tone})" id="notif-status">${notif.text}</p>
          ${notif.ask || ('Notification' in window && Notification.permission === 'default')
            ? html`<button type="button" class="btn" data-action="ask-notif">${icon('bell')} Bildirimlere izin ver</button>`
            : ''}
        </div>
      </section>

      <section class="card" aria-labelledby="set-keys">
        <div class="card-header"><h2 id="set-keys">${icon('keyboard')} Klavye kısayolları</h2></div>
        <div class="shortcut-list">
          ${SHORTCUTS.map((k) => html`<span class="nowrap">${k.keys.map((x, i) => html`${i ? ' + ' : ''}<kbd>${x}</kbd>`)}</span><span class="muted">${k.label}</span>`)}
        </div>
        <p class="xsmall muted" style="margin-top: var(--space-3)">Görev eklerken: <code>yarın</code>, <code>cuma</code>, <code>20.10</code>, <code>14:00</code>, <code>#ders</code>, <code>!yüksek</code> yazabilirsin. Örnek: <code>Fizik ödevi yarın 14:00 #fiz !yüksek</code></p>
      </section>

      <section class="card" aria-labelledby="set-about">
        <div class="card-header"><h2 id="set-about">${icon('info')} Hakkında</h2></div>
        <dl class="about-list small">
          <dt>Sürüm</dt><dd>${APP_VERSION}</dd>
          <dt>Veri boyutu</dt><dd data-size>${formatBytes(storageSize())} veri${isFilesAvailable() ? ' + ekler hesaplanıyor…' : ''}</dd>
          <dt>Son yedek</dt><dd>${s.lastBackupAt ? formatTimeAgo(s.lastBackupAt) : 'Henüz yedek alınmadı'}</dd>
          <dt>İçerik</dt><dd>${state.courses.length} ders · ${state.tasks.length} görev · ${state.routines.length} rutin · ${state.courseNotes.length} not</dd>
        </dl>
        <p class="xsmall muted" style="margin-top: var(--space-3)">My to do sadece HTML, CSS ve JavaScript ile yazıldı. Hesap açmazsan verilerin sadece bu cihazda kalır; hesapla yalnızca senin hesabına eşitlenir.</p>
      </section>

      <section class="card" aria-labelledby="set-data">
        <div class="card-header"><h2 id="set-data">${icon('database')} Veri</h2></div>
        <div class="stack">
          <div class="row-between wrap">
            <div>
              <h3>Yedek al</h3>
              <p class="small muted">Tüm verilerini bir JSON dosyası olarak indir.${s.lastBackupAt ? html` Son yedek: ${formatTimeAgo(s.lastBackupAt)}.` : ''}</p>
            </div>
            <button type="button" class="btn" data-action="backup">${icon('download')} Yedek al</button>
          </div>
          ${switchField('set-include-att', 'Ders notu eklerini (PDF, resim) yedeğe dahil et', s.includeAttachmentsInBackup, 'Ekler yedek dosyasını büyütebilir.')}
          <div class="row-between wrap">
            <div>
              <h3>Yedek yükle</h3>
              <p class="small muted">Bir yedek dosyasını aç. Mevcut verilerin yerine geçer.</p>
            </div>
            <label class="btn" for="restore-file">${icon('upload')} Yedek yükle</label>
            <input type="file" id="restore-file" accept="application/json,.json" class="visually-hidden">
          </div>
          <div class="row-between wrap">
            <div>
              <h3>Örnek veri yükle</h3>
              <p class="small muted">${canLoadSample(state) ? 'Uygulamayı denemek için 4 ders, görevler, rutinler ve notlar ekler.' : 'Sadece hiç ders ve görev yokken kullanılabilir. Önce verileri sil.'}</p>
            </div>
            <button type="button" class="btn" data-action="sample-data" ${canLoadSample(state) ? '' : 'disabled'}>${icon('sparkles')} Örnek veri yükle</button>
          </div>
          <div class="row-between wrap">
            <div>
              <h3 style="color: var(--danger)">Tüm verileri sil</h3>
              <p class="small muted">Görevler, dersler, notlar ve ayarlar silinir. Geri alınamaz.</p>
            </div>
            <button type="button" class="btn btn--danger" data-action="wipe">${icon('trash')} Verileri sil</button>
          </div>
          <p class="xsmall muted">Verilerin sadece bu tarayıcıda saklanıyor. Başka bilgisayarda aynı verileri görmek için yedek alıp orada yükle.</p>
        </div>
      </section>
    </div>`;
}

const canLoadSample = (state) => state.courses.length === 0 && state.tasks.length === 0;

function loadSample() {
  const state = getState();
  if (!canLoadSample(state)) return;
  replaceState(createSampleData(todayKey(), state), 'state/sample');
  toast('Örnek veri yüklendi. Bugün sayfasına göz at!', { type: 'success', action: { label: 'Bugün', onClick: () => { location.hash = '#/bugun'; } } });
}

function trySave(fn, okMsg = 'Kaydedildi') {
  try {
    fn();
    toast(okMsg, { type: 'success', duration: 1500 });
    return true;
  } catch (err) {
    toast(err.message, { type: 'error' });
    return false;
  }
}

async function doRestore(input) {
  const file = input.files && input.files[0];
  input.value = '';
  if (!file) return;
  let result;
  try {
    result = parseBackupText(await readFileText(file));
  } catch {
    result = { ok: false, error: 'Dosya okunamadı.' };
  }
  if (!result.ok) {
    toast(result.error, { type: 'error', duration: 6000 });
    return;
  }
  const ok = await confirmDialog({
    title: 'Yedek yüklensin mi?',
    message: `"${file.name}" yüklenecek. Mevcut tüm verilerin yerine geçecek.`,
    confirmText: 'Yükle',
    danger: true,
  });
  if (!ok) return;
  try {
    await backupFiles.restoreFiles(result.files);
  } catch (err) {
    console.error(err);
    toast('Bazı ekler geri yüklenemedi.', { type: 'error' });
  }
  replaceState(result.state, 'backup/restore');
  toast('Yedek yüklendi.', { type: 'success' });
}

async function doWipe() {
  const ok = await confirmDialog({
    title: 'Tüm veriler silinsin mi?',
    message: currentUser()
      ? 'Hesabına giriş yaptığın için veriler TÜM cihazlarından ve hesabından da silinir. Bu işlem geri alınamaz. Önce yedek almanı öneririz.'
      : 'Bu işlem geri alınamaz. Önce yedek almanı öneririz.',
    confirmText: 'Hepsini sil',
    danger: true,
    requireText: 'SİL',
  });
  if (!ok) return;
  await backupFiles.clearFiles();
  replaceState(createDefaultState(), 'state/wipe');
  toast('Tüm veriler silindi.', { type: 'success' });
}

export default {
  title: 'Ayarlar',
  render(root) {
    if (isCapacitor && nativePerm === null) nativeNotifyPermission(false).then((p) => { nativePerm = p; draw(); });
    const draw = () => {
      renderInto(root, view(getState()));
      if (isFilesAvailable()) {
        totalFilesSize().then((bytes) => {
          const el = root.querySelector('[data-size]');
          if (el) el.textContent = `${formatBytes(storageSize())} veri + ${formatBytes(bytes)} ek`;
        }).catch(() => {});
      }
    };
    draw();
    const unsub = subscribe(draw);

    const offClick = delegate(root, 'click', '[data-action]', async (e, el) => {
      const a = el.dataset.action;
      if (a === 'set-theme') trySave(() => updateSettings({ theme: el.dataset.value }));
      else if (a === 'ask-notif') {
        const res = isCapacitor ? (nativePerm = await nativeNotifyPermission(true)) : await Notification.requestPermission();
        updateSettings({ notifications: res === 'granted' });
        draw();
      } else if (a === 'backup') runBackup();
      else if (a === 'wipe') doWipe();
      else if (a === 'sample-data') loadSample();
    });

    const offChange = delegate(root, 'change', 'input', (e, el) => {
      const id = el.id;
      if (id === 'set-name') trySave(() => updateSettings({ name: el.value }));
      else if (id === 'set-day-start' || id === 'set-day-end') {
        const ok = trySave(() => updateSettings({
          dayStart: root.querySelector('#set-day-start').value,
          dayEnd: root.querySelector('#set-day-end').value,
        }));
        if (!ok) draw();
      } else if (id === 'set-weekend') trySave(() => updateSettings({ showWeekend: el.checked }));
      else if (id.startsWith('pomo-')) {
        const key = id.slice(5);
        const value = el.type === 'checkbox' ? el.checked : el.value;
        if (!trySave(() => updatePomodoroSettings({ [key]: value }))) draw();
      } else if (id === 'restore-file') doRestore(el);
    });

    return () => { unsub(); offClick(); offChange(); };
  },
};
