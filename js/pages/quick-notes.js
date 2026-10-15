// Hızlı Notlar: her yerden alınan notlar; göreve, hedefe ya da ders notuna dönüştürme.
import { html, delegate, qs } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getState, subscribe } from '../store/store.js';
import { getCoursesSorted } from '../store/selectors.js';
import { addQuickNote, updateQuickNote, deleteQuickNote, restoreQuickNote, markConverted } from '../store/actions/quick-notes.js';
import { addCourseNote } from '../store/actions/course-notes.js';
import { openTaskForm } from '../components/task-form.js';
import { openGoalForm } from '../components/goals.js';
import { openModal } from '../components/modal.js';
import { bindForm, formError } from '../components/form.js';
import { emptyState } from '../components/empty-state.js';
import { toast } from '../components/toast.js';
import { navigate } from '../router.js';
import { firstLine, restLines } from '../lib/text.js';
import { formatTimeAgo, todayKey, monthKey } from '../lib/dates.js';

const TYPE_LABELS = { task: 'Göreve çevrildi', goal: 'Hedefe çevrildi', courseNote: 'Ders notuna çevrildi' };

function targetLink(state, conv) {
  if (conv.type === 'task') return state.tasks.some((t) => t.id === conv.id) ? html`<button type="button" class="link-btn" data-action="open-task" data-id="${conv.id}">Görevi aç</button>` : '';
  if (conv.type === 'courseNote') {
    const n = state.courseNotes.find((x) => x.id === conv.id);
    return n ? html`<a href="#/ders-notlari?ders=${n.courseId}&not=${n.id}">Notu aç</a>` : '';
  }
  if (conv.type === 'goal') {
    const g = state.goals.find((x) => x.id === conv.id);
    return g ? html`<a href="#/planlayici?view=${g.period === 'year' ? 'yil' : 'ay'}&date=${g.period === 'year' ? `${g.periodKey}-01-01` : `${g.periodKey}-01`}">Hedefi gör</a>` : '';
  }
  return '';
}

function noteCard(state, n) {
  const conv = n.convertedTo;
  return html`
    <li class="qn-card card card--tight ${conv ? 'is-converted' : ''}">
      <p class="qn-text prewrap">${n.text}</p>
      <div class="qn-foot">
        <span class="xsmall muted">${formatTimeAgo(n.createdAt)}</span>
        ${conv ? html`<span class="badge badge--success">${icon('check')} ${TYPE_LABELS[conv.type]}</span> <span class="xsmall">${targetLink(state, conv)}</span>` : ''}
        <span class="grow"></span>
        ${conv ? '' : html`
          <button type="button" class="btn btn--sm" data-action="to-task" data-id="${n.id}">${icon('check')} Göreve çevir</button>
          <button type="button" class="btn btn--sm" data-action="to-goal" data-id="${n.id}">${icon('target')} Hedefe</button>
          <button type="button" class="btn btn--sm" data-action="to-note" data-id="${n.id}" ${state.courses.length ? '' : 'disabled title="Önce bir ders ekle"'}>${icon('book')} Ders notuna</button>`}
        <button type="button" class="btn btn--ghost btn--icon btn--sm" data-action="edit" data-id="${n.id}" aria-label="Notu düzenle">${icon('edit')}</button>
        <button type="button" class="btn btn--ghost btn--icon btn--sm" data-action="delete" data-id="${n.id}" aria-label="Notu sil">${icon('trash')}</button>
      </div>
    </li>`;
}

function listView(state, ui) {
  const all = [...state.quickNotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = all.filter((n) => !n.convertedTo);
  const converted = all.filter((n) => n.convertedTo);
  return html`
    ${open.length
      ? html`<ul class="qn-list">${open.map((n) => noteCard(state, n))}</ul>`
      : emptyState({ icon: 'zap', title: converted.length ? 'Hepsi işlendi' : 'Henüz hızlı not yok', text: 'N tuşuna basarak her yerden not alabilirsin.' })}
    ${converted.length ? html`
      <label class="switch small qn-toggle"><input type="checkbox" data-show-converted ${ui.showConverted ? 'checked' : ''}><span class="track"></span><span>Dönüştürülenleri göster (${converted.length})</span></label>
      ${ui.showConverted ? html`<ul class="qn-list">${converted.map((n) => noteCard(state, n))}</ul>` : ''}` : ''}`;
}

function openEdit(note) {
  openModal({
    title: 'Notu düzenle',
    size: 'sm',
    content: html`<form id="qn-edit" class="stack" novalidate>
      <div class="field"><label for="qn-edit-text" class="visually-hidden">Not</label>
        <textarea id="qn-edit-text" name="text" class="textarea" rows="5" maxlength="5000" autofocus>${note.text}</textarea><p class="field-error"></p></div>
      ${formError()}</form>`,
    footer: html`<button type="button" class="btn" data-modal-close>Vazgeç</button><button type="submit" form="qn-edit" class="btn btn--primary">Kaydet</button>`,
    onMount(el, close) {
      bindForm(el.querySelector('form'), (fd) => { updateQuickNote(note.id, fd.get('text')); }, close);
    },
  });
}

function openToCourseNote(note) {
  const courses = getCoursesSorted(getState());
  openModal({
    title: 'Ders notuna çevir',
    size: 'sm',
    content: html`<form id="qn-cn" class="stack" novalidate>
      <div class="field"><label for="qn-cn-course">Hangi derse?</label>
        <select id="qn-cn-course" name="courseId" class="select" autofocus>${courses.map((c) => html`<option value="${c.id}">${c.name}</option>`)}</select></div>
      <p class="small muted">Başlık: <strong>${firstLine(note.text)}</strong></p>
      ${formError()}</form>`,
    footer: html`<button type="button" class="btn" data-modal-close>Vazgeç</button><button type="submit" form="qn-cn" class="btn btn--primary">Çevir</button>`,
    onMount(el, close) {
      bindForm(el.querySelector('form'), (fd) => {
        const cn = addCourseNote({ courseId: fd.get('courseId'), title: firstLine(note.text), body: restLines(note.text) || note.text });
        markConverted(note.id, { type: 'courseNote', id: cn.id });
        toast('Ders notuna çevrildi', { type: 'success', action: { label: 'Aç', onClick: () => navigate('/ders-notlari', { ders: cn.courseId, not: cn.id }) } });
      }, close);
    },
  });
}

export default {
  title: 'Hızlı Notlar',
  render(root) {
    const ui = { showConverted: false };
    root.innerHTML = String(html`
      <div class="page-header"><div><h1>Hızlı Notlar</h1><p>Aklına geleni yakala, sonra göreve, hedefe ya da ders notuna çevir. Kısayol: <kbd>N</kbd></p></div></div>
      <form class="qn-composer card card--tight" data-composer autocomplete="off">
        <label for="qn-compose" class="visually-hidden">Yeni hızlı not</label>
        <textarea id="qn-compose" class="qn-compose-input" rows="2" maxlength="5000" placeholder="Aklındakini yaz… (Enter kaydeder, Shift+Enter yeni satır)"></textarea>
        <div class="row-between"><span class="xsmall muted">İlk satır, dönüştürürken başlık olur.</span><button type="submit" class="btn btn--primary btn--sm">${icon('plus')} Ekle</button></div>
      </form>
      <div data-region="list"></div>`);
    const listEl = qs('[data-region="list"]', root);
    const draw = () => { listEl.innerHTML = String(listView(getState(), ui)); };
    draw();
    const unsub = subscribe(draw);

    const form = qs('[data-composer]', root);
    const ta = qs('#qn-compose', root);
    const submit = (e) => {
      e?.preventDefault();
      if (!ta.value.trim()) return;
      try { addQuickNote(ta.value); ta.value = ''; } catch (err) { toast(err.message, { type: 'error' }); }
    };
    form.addEventListener('submit', submit);
    const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) submit(e); };
    ta.addEventListener('keydown', onKey);

    const find = (id) => getState().quickNotes.find((n) => n.id === id);
    const offClick = delegate(root, 'click', '[data-action]', (e, el) => {
      const a = el.dataset.action;
      const note = find(el.dataset.id);
      if (a === 'to-task' && note) {
        openTaskForm({
          defaults: { title: firstLine(note.text).slice(0, 200), notes: restLines(note.text), date: todayKey() },
          onSaved: (t) => markConverted(note.id, { type: 'task', id: t.id }),
        });
      } else if (a === 'to-goal' && note) {
        openGoalForm({
          defaults: { title: firstLine(note.text).slice(0, 120), period: 'month', periodKey: monthKey(todayKey()) },
          onSaved: (g) => markConverted(note.id, { type: 'goal', id: g.id }),
        });
      } else if (a === 'to-note' && note) openToCourseNote(note);
      else if (a === 'edit' && note) openEdit(note);
      else if (a === 'delete' && note) {
        const removed = deleteQuickNote(note.id);
        toast('Not silindi', { action: { label: 'Geri al', onClick: () => restoreQuickNote(removed) } });
      } else if (a === 'open-task') {
        const t = getState().tasks.find((x) => x.id === el.dataset.id);
        if (t) openTaskForm({ task: t });
      }
    });
    const offChange = delegate(root, 'change', '[data-show-converted]', (e, el) => { ui.showConverted = el.checked; draw(); });

    return () => { unsub(); offClick(); offChange(); form.removeEventListener('submit', submit); ta.removeEventListener('keydown', onKey); };
  },
};
