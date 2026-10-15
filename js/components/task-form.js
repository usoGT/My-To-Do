// Görev ekleme / düzenleme formu (modal)
import { html } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { openModal } from './modal.js';
import { bindForm, bindPressGroup, formError } from './form.js';
import { toast } from './toast.js';
import { getState } from '../store/store.js';
import { getCoursesSorted } from '../store/selectors.js';
import { addTask, updateTask, PRIORITIES } from '../store/actions/tasks.js';
import { todayKey, monthKey, yearKey, formatDuration } from '../lib/dates.js';

const QUICK_ESTIMATES = [15, 30, 45, 60, 90, 120];

// Hedef seçimi: görevin tarihine göre o ayın ve yılın hedefleri (+ şu an seçili olan).
function goalOptions(state, date, selectedId) {
  const key = date || todayKey();
  return state.goals.filter((g) => !g.done || g.id === selectedId).filter((g) =>
    g.id === selectedId
    || (g.period === 'month' && g.periodKey === monthKey(key))
    || (g.period === 'year' && g.periodKey === yearKey(key)));
}

const goalSelectOptions = (state, date, selectedId) => html`
  <option value="">Hedef yok</option>
  ${goalOptions(state, date, selectedId).map((g) => html`
    <option value="${g.id}" ${g.id === selectedId ? 'selected' : ''}>${g.period === 'month' ? 'Ay' : 'Yıl'} · ${g.title}</option>`)}`;

export function openTaskForm({ task = null, defaults = {}, onSaved } = {}) {
  const state = getState();
  const isEdit = Boolean(task);
  const v = task || {
    title: defaults.title || '',
    notes: defaults.notes || '',
    date: 'date' in defaults ? defaults.date : todayKey(),
    time: defaults.time || '',
    estimateMin: defaults.estimateMin || '',
    courseId: defaults.courseId || '',
    goalId: defaults.goalId || '',
    priority: defaults.priority || 'medium',
    dueDate: defaults.dueDate || '',
    reminderAt: defaults.reminderAt || '',
  };
  const courses = getCoursesSorted(state);
  const undated = !v.date;

  openModal({
    title: isEdit ? 'Görevi düzenle' : 'Yeni görev',
    content: html`
      <form id="task-form" class="stack" novalidate>
        <div class="field">
          <label for="tf-title">Başlık</label>
          <input class="input input--lg" id="tf-title" name="title" value="${v.title}" maxlength="200" placeholder="Ne yapılacak?" autocomplete="off" autofocus>
          <p class="field-error"></p>
        </div>
        <div class="field">
          <label for="tf-notes">Notlar <span class="muted">(isteğe bağlı)</span></label>
          <textarea class="textarea" id="tf-notes" name="notes" rows="2" maxlength="5000">${v.notes}</textarea>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="tf-date">Tarih</label>
            <input type="date" class="input" id="tf-date" name="date" value="${v.date || ''}" ${undated ? 'disabled' : ''}>
            <p class="field-error"></p>
          </div>
          <div class="field">
            <label for="tf-time">Saat <span class="muted">(isteğe bağlı)</span></label>
            <input type="time" class="input" id="tf-time" name="time" value="${v.time || ''}" step="300" ${undated ? 'disabled' : ''}>
            <p class="field-error"></p>
          </div>
        </div>
        <label class="switch" for="tf-undated">
          <input type="checkbox" id="tf-undated" ${undated ? 'checked' : ''}>
          <span class="track"></span><span class="small">Tarihsiz ("Bir ara" listesine)</span>
        </label>
        <div class="field-row">
          <div class="field">
            <label for="tf-due">Teslim tarihi <span class="muted">(isteğe bağlı)</span></label>
            <input type="date" class="input" id="tf-due" name="dueDate" value="${v.dueDate || ''}">
            <p class="field-error"></p>
          </div>
          <div class="field">
            <label for="tf-rem">Hatırlatıcı <span class="muted">(isteğe bağlı)</span></label>
            <input type="datetime-local" class="input" id="tf-rem" name="reminderAt" value="${v.reminderAt || ''}" step="300">
            <p class="field-error"></p>
          </div>
        </div>
        <p class="xsmall muted" style="margin-top: calc(var(--space-2) * -1)">Tarih: ne zaman yapacağın · Teslim: son gün. Hatırlatıcı uygulama açıkken çalışır.</p>
        <div class="field">
          <label for="tf-est">Tahmini süre <span class="muted">(dakika)</span></label>
          <div class="row wrap">
            <div class="chips" data-est-chips>
              ${QUICK_ESTIMATES.map((m) => html`<button type="button" class="chip" data-min="${m}" aria-pressed="${Number(v.estimateMin) === m}">${formatDuration(m)}</button>`)}
            </div>
            <input type="number" class="input" id="tf-est" name="estimateMin" value="${v.estimateMin ?? ''}" min="5" max="600" step="5" inputmode="numeric" style="max-width: 96px" placeholder="—">
          </div>
          <p class="field-error"></p>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="tf-course">Ders</label>
            <select class="select" id="tf-course" name="courseId">
              <option value="">Ders yok</option>
              ${courses.map((c) => html`<option value="${c.id}" ${c.id === v.courseId ? 'selected' : ''}>${c.name}</option>`)}
            </select>
          </div>
          <div class="field">
            <label for="tf-goal">Hedef</label>
            <select class="select" id="tf-goal" name="goalId">${goalSelectOptions(state, v.date, v.goalId)}</select>
          </div>
        </div>
        <div class="field">
          <span class="field-label" id="tf-prio-label">Öncelik</span>
          <div class="segmented" role="group" aria-labelledby="tf-prio-label">
            <input type="hidden" name="priority" value="${v.priority}">
            ${Object.entries(PRIORITIES).map(([k, label]) => html`<button type="button" data-value="${k}" aria-pressed="${k === v.priority}">${label}</button>`)}
          </div>
        </div>
        ${formError()}
      </form>`,
    footer: html`
      ${isEdit ? html`<button type="button" class="btn btn--danger left" data-delete>${icon('trash')} Sil</button>` : ''}
      <button type="button" class="btn" data-modal-close>Vazgeç</button>
      <button type="submit" form="task-form" class="btn btn--primary">${isEdit ? 'Kaydet' : 'Ekle'}</button>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      bindPressGroup(form, '.segmented');
      const dateEl = form.querySelector('#tf-date');
      const timeEl = form.querySelector('#tf-time');
      const estEl = form.querySelector('#tf-est');
      const goalEl = form.querySelector('#tf-goal');
      const undatedEl = form.querySelector('#tf-undated');

      undatedEl.addEventListener('change', () => {
        dateEl.disabled = undatedEl.checked;
        timeEl.disabled = undatedEl.checked;
        if (!undatedEl.checked && !dateEl.value) dateEl.value = todayKey();
        goalEl.innerHTML = String(goalSelectOptions(getState(), undatedEl.checked ? null : dateEl.value, goalEl.value));
      });
      dateEl.addEventListener('change', () => {
        goalEl.innerHTML = String(goalSelectOptions(getState(), dateEl.value, goalEl.value));
      });
      form.querySelector('[data-est-chips]').addEventListener('click', (e) => {
        const chip = e.target.closest('[data-min]');
        if (!chip) return;
        const same = estEl.value === chip.dataset.min;
        estEl.value = same ? '' : chip.dataset.min;
        form.querySelectorAll('[data-min]').forEach((c) => c.setAttribute('aria-pressed', String(!same && c === chip)));
      });
      estEl.addEventListener('input', () => {
        form.querySelectorAll('[data-min]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.min === estEl.value)));
      });

      bindForm(form, (fd) => {
        const values = Object.fromEntries(fd);
        if (undatedEl.checked) { values.date = null; values.time = null; }
        if (isEdit) {
          updateTask(task.id, values);
          toast('Görev güncellendi', { type: 'success', duration: 2000 });
        } else {
          const t = addTask(values);
          toast('Görev eklendi', { type: 'success', duration: 2000 });
          if (onSaved) onSaved(t);
        }
      }, close);

      el.querySelector('[data-delete]')?.addEventListener('click', async () => {
        close();
        const { deleteTaskWithUndo } = await import('./task-item.js');
        deleteTaskWithUndo(task.id);
      });
    },
  });
}
