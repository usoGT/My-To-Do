// Komut paleti (Ctrl+K): sayfalar, komutlar, dersler, görevler, notlar; "+" ile tek satırda görev ekleme.
import { html, createElement } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getState } from '../store/store.js';
import { addTask } from '../store/actions/tasks.js';
import { updateSettings } from '../store/actions/settings.js';
import { NAV_ITEMS, SETTINGS_ITEM } from './sidebar.js';
import { openTaskForm } from './task-form.js';
import { openQuickNote } from './quick-note.js';
import { openExamForm } from './exams.js';
import { toast } from './toast.js';
import { navigate, onRouteChange } from '../router.js';
import { parseTaskInput, describeParsed } from '../lib/task-parser.js';
import { matches, highlight, firstLine } from '../lib/text.js';
import { todayKey, formatRelativeDay } from '../lib/dates.js';
import { isDarkNow } from '../lib/theme.js';
import { runBackup } from '../lib/backup-run.js';

const PAGES = [...NAV_ITEMS, SETTINGS_ITEM];
const recent = [];

onRouteChange((route) => {
  const page = PAGES.find((p) => p.path === route.path);
  if (!page) return;
  const i = recent.indexOf(page.path);
  if (i >= 0) recent.splice(i, 1);
  recent.unshift(page.path);
  recent.length = Math.min(recent.length, 4);
});

function commands() {
  return [
    { label: 'Görev ekle', sub: '"+" ile başlayarak yaz', icon: 'plus', keywords: 'yeni gorev ekle', run: (ctx) => ctx.setInput('+') },
    { label: 'Sınav ekle', sub: 'Vize, final, quiz…', icon: 'calendar', keywords: 'sinav vize final quiz butunleme', run: (ctx) => { ctx.close(); openExamForm(); } },
    { label: 'Hızlı not al', sub: 'N', icon: 'zap', keywords: 'not yaz', run: (ctx) => { ctx.close(); openQuickNote(); } },
    { label: 'Tema değiştir', sub: isDarkNow() ? 'Açık temaya geç' : 'Koyu temaya geç', icon: isDarkNow() ? 'sun' : 'moon', keywords: 'karanlik aydinlik gece', run: (ctx) => { updateSettings({ theme: isDarkNow() ? 'light' : 'dark' }); ctx.close(); } },
    { label: 'Pomodoro başlat', sub: 'Odak sayacına git', icon: 'timer', keywords: 'odak zamanlayici sayac', run: (ctx) => { ctx.close(); navigate('/pomodoro'); } },
    { label: 'Yedek al', sub: 'Tüm verileri JSON olarak indir', icon: 'download', keywords: 'yedekle disa aktar', run: (ctx) => { ctx.close(); runBackup(); } },
    { label: 'Örnek veri yükle', sub: 'Ayarlar sayfasında', icon: 'sparkles', keywords: 'demo deneme', run: (ctx) => { ctx.close(); navigate('/ayarlar'); } },
  ];
}

function buildResults(query) {
  const state = getState();
  const q = query.trim();
  const groups = [];
  const add = (title, items) => { if (items.length) groups.push({ title, items: items.slice(0, 5) }); };

  if (!q) {
    add('Son sayfalar', recent.map((p) => PAGES.find((x) => x.path === p)).filter(Boolean).map((p) => ({ label: p.label, icon: p.icon, run: (ctx) => { ctx.close(); navigate(p.path); } })));
    add('Komutlar', commands());
    return groups;
  }

  add('Sayfalar', PAGES.filter((p) => matches(p.label, q)).map((p) => ({ label: p.label, icon: p.icon, run: (ctx) => { ctx.close(); navigate(p.path); } })));
  add('Komutlar', commands().filter((c) => matches(`${c.label} ${c.keywords}`, q)));
  add('Dersler', state.courses.filter((c) => matches(`${c.name} ${c.code}`, q)).map((c) => ({
    label: c.name, sub: c.code, color: c.color, icon: 'book', run: (ctx) => { ctx.close(); navigate(`/ders/${c.id}`); },
  })));
  add('Görevler', state.tasks
    .filter((t) => matches(`${t.title} ${t.notes}`, q))
    .sort((a, b) => Number(a.done) - Number(b.done) || (b.date || '').localeCompare(a.date || ''))
    .map((t) => ({
      label: t.title, sub: [t.date ? formatRelativeDay(t.date) : 'Tarihsiz', t.done ? 'tamamlandı' : ''].filter(Boolean).join(' · '),
      icon: t.done ? 'check' : 'list', run: (ctx) => { ctx.close(); openTaskForm({ task: t }); },
    })));
  const notes = [
    ...state.courseNotes.filter((n) => matches(`${n.title} ${n.body}`, q)).map((n) => ({
      label: n.title || 'Başlıksız not', sub: state.courses.find((c) => c.id === n.courseId)?.name || 'Ders notu', icon: 'note',
      run: (ctx) => { ctx.close(); navigate('/ders-notlari', { ders: n.courseId, not: n.id }); },
    })),
    ...state.quickNotes.filter((n) => matches(n.text, q)).map((n) => ({
      label: firstLine(n.text), sub: 'Hızlı not', icon: 'zap', run: (ctx) => { ctx.close(); navigate('/hizli-notlar'); },
    })),
  ];
  add('Notlar', notes);
  return groups;
}

let openEl = null;

export function openPalette(initial = '') {
  if (openEl) { openEl.querySelector('input').focus(); return; }
  const opener = document.activeElement;
  const dlg = createElement(html`
    <dialog class="palette" aria-label="Komut paleti">
      <div class="palette-search">
        ${icon('search')}
        <input type="text" placeholder="Ara, sayfaya git ya da + ile görev ekle…" aria-label="Komut paleti araması" autocomplete="off" spellcheck="false"
          role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list">
        <kbd>Esc</kbd>
      </div>
      <div class="palette-body" id="palette-list" role="listbox"></div>
      <div class="palette-foot xsmall muted">
        <span><kbd>↑</kbd> <kbd>↓</kbd> gezin</span><span><kbd>Enter</kbd> seç</span><span><code>+Fizik ödevi yarın 14:00 #fiz !yüksek</code></span>
      </div>
    </dialog>`);
  document.body.append(dlg);
  openEl = dlg;
  const input = dlg.querySelector('input');
  const body = dlg.querySelector('.palette-body');
  let flat = [];
  let active = 0;

  const close = () => { if (dlg.open) dlg.close(); };
  const ctx = {
    close,
    setInput: (v) => { input.value = v; input.focus(); render(); },
  };

  function renderAddMode(text) {
    const state = getState();
    const raw = text.replace(/^\+\s*/, '');
    let parts = null;
    let error = '';
    try {
      const p = parseTaskInput(raw, { today: todayKey(), courses: state.courses });
      parts = describeParsed(p, { today: todayKey(), courses: state.courses });
    } catch (err) {
      error = raw ? err.message : 'Görevi yaz: başlık, tarih, saat, #ders, !öncelik';
    }
    flat = parts ? [{ run: () => {
      try {
        const p = parseTaskInput(raw, { today: todayKey(), courses: getState().courses });
        const t = addTask(p);
        close();
        toast(`Görev eklendi: ${formatRelativeDay(t.date)}`, { type: 'success', action: { label: 'Aç', onClick: () => openTaskForm({ task: getState().tasks.find((x) => x.id === t.id) }) } });
      } catch (err) { toast(err.message, { type: 'error' }); }
    } }] : [];
    active = 0;
    body.innerHTML = String(html`
      <div class="palette-group-title">Görev ekle</div>
      ${parts
        ? html`<button type="button" class="palette-item is-active" role="option" aria-selected="true" data-index="0">
            <span class="palette-icon">${icon('plus')}</span>
            <span class="palette-preview">${parts.map((x, i) => html`<span class="${i === 0 ? 'qa-title' : 'badge'}">${x}</span>`)}</span>
            <kbd>Enter</kbd>
          </button>`
        : html`<p class="palette-empty">${error}</p>`}`);
  }

  function render() {
    const text = input.value;
    if (text.trimStart().startsWith('+')) { renderAddMode(text.trimStart()); return; }
    const groups = buildResults(text);
    flat = groups.flatMap((g) => g.items);
    active = Math.min(active, Math.max(0, flat.length - 1));
    let i = 0;
    body.innerHTML = groups.length
      ? String(html`${groups.map((g) => html`
          <div class="palette-group-title">${g.title}</div>
          ${g.items.map((it) => {
            const idx = i++;
            return html`
              <button type="button" class="palette-item ${idx === active ? 'is-active' : ''} ${it.color ? `c-${it.color}` : ''}" role="option" aria-selected="${idx === active}" data-index="${idx}">
                <span class="palette-icon">${it.color ? html`<span class="dot"></span>` : icon(it.icon || 'arrowRight')}</span>
                <span class="palette-label truncate">${highlight(it.label, text)}</span>
                ${it.sub ? html`<span class="palette-sub truncate">${it.sub}</span>` : ''}
              </button>`;
          })}`)}`)
      : String(html`<p class="palette-empty">"${text}" için sonuç yok. Görev olarak eklemek için başına <code>+</code> koy.</p>`);
  }

  function setActive(n) {
    if (!flat.length) return;
    active = (n + flat.length) % flat.length;
    body.querySelectorAll('.palette-item').forEach((el) => {
      const on = Number(el.dataset.index) === active;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', String(on));
      if (on) el.scrollIntoView({ block: 'nearest' });
    });
  }

  input.addEventListener('input', () => { active = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); flat[active]?.run(ctx); }
  });
  body.addEventListener('click', (e) => {
    const item = e.target.closest('.palette-item');
    if (item) flat[Number(item.dataset.index)]?.run(ctx);
  });
  body.addEventListener('mousemove', (e) => {
    const item = e.target.closest('.palette-item');
    if (item && Number(item.dataset.index) !== active) setActive(Number(item.dataset.index));
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener('close', () => {
    dlg.remove();
    openEl = null;
    if (opener && document.contains(opener) && !document.querySelector('dialog[open]')) opener.focus?.();
  });

  input.value = initial;
  dlg.showModal();
  input.focus();
  render();
}
