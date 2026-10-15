// Hedef paneli ve hedef formu (Planlayıcı ay/yıl görünümlerinde, Ders sayfasında).
import { html, delegate } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { openModal } from './modal.js';
import { bindForm, bindPressGroup, formError } from './form.js';
import { toast } from './toast.js';
import { confirmDialog } from './confirm.js';
import { getState } from '../store/store.js';
import { getCourse, getCoursesSorted, getGoalProgress } from '../store/selectors.js';
import { addGoal, updateGoal, toggleGoal, deleteGoal } from '../store/actions/goals.js';
import { MONTHS_TR, formatMonthYear } from '../lib/dates.js';

export function goalItem(state, g) {
  const course = g.courseId ? getCourse(state, g.courseId) : null;
  const p = getGoalProgress(state, g.id);
  return html`
    <li class="goal ${g.done ? 'is-done' : ''}">
      <button type="button" class="check" role="checkbox" aria-checked="${g.done}" data-action="toggle-goal" data-id="${g.id}" aria-label="${g.done ? 'Tamamlanmadı' : 'Tamamlandı'}: ${g.title}">${icon('check')}</button>
      <button type="button" class="goal-body" data-action="edit-goal" data-id="${g.id}">
        <span class="goal-title">${g.title}</span>
        <span class="task-meta">
          ${course ? html`<span class="badge badge--course c-${course.color}"><span class="truncate">${course.name}</span></span>` : ''}
          ${p.total ? html`<span>${p.done}/${p.total} görev</span>` : ''}
        </span>
        ${p.total ? html`<span class="progress progress--thin"><span style="width:${Math.round((p.done / p.total) * 100)}%"></span></span>` : ''}
      </button>
    </li>`;
}

// period: 'month' | 'year'
export function goalsPanel(state, goals, { period, periodKey, title }) {
  const done = goals.filter((g) => g.done).length;
  return html`
    <section class="section goals-panel">
      <div class="section-title">
        <span>${title} <span class="count">${goals.length ? `${done}/${goals.length}` : ''}</span></span>
        <button type="button" class="btn btn--ghost btn--sm" data-action="add-goal" data-period="${period}" data-period-key="${periodKey}">${icon('plus')} Hedef</button>
      </div>
      <div class="card card--tight">
        ${goals.length
          ? html`<ul class="goal-list">${goals.map((g) => goalItem(state, g))}</ul>`
          : html`<p class="small muted goal-empty">${period === 'month' ? 'Bu ay için hedef yok.' : 'Bu yıl için hedef yok.'}</p>`}
      </div>
    </section>`;
}

export function openGoalForm({ goal = null, defaults = {}, onSaved } = {}) {
  const state = getState();
  const isEdit = Boolean(goal);
  const v = goal || { title: defaults.title || '', period: defaults.period || 'month', periodKey: defaults.periodKey || '', courseId: defaults.courseId || '' };
  const year = v.periodKey.slice(0, 4) || String(new Date().getFullYear());
  const month = v.period === 'month' ? v.periodKey.slice(5, 7) : String(new Date().getMonth() + 1).padStart(2, '0');
  const years = [Number(year) - 1, Number(year), Number(year) + 1];
  openModal({
    title: isEdit ? 'Hedefi düzenle' : 'Yeni hedef',
    size: 'sm',
    content: html`
      <form id="goal-form" class="stack" novalidate>
        <div class="field">
          <label for="gf-title">Hedef</label>
          <input class="input" id="gf-title" name="title" value="${v.title}" maxlength="120" placeholder="Örn. Fizik vizesine hazırlan" autofocus>
          <p class="field-error"></p>
        </div>
        <div class="field">
          <span class="field-label" id="gf-period-label">Dönem</span>
          <div class="segmented" role="group" aria-labelledby="gf-period-label">
            <input type="hidden" name="period" value="${v.period}">
            <button type="button" data-value="month" aria-pressed="${v.period === 'month'}">Aylık</button>
            <button type="button" data-value="year" aria-pressed="${v.period === 'year'}">Yıllık</button>
          </div>
        </div>
        <div class="field-row">
          <div class="field" data-month-field ${v.period === 'year' ? 'hidden' : ''}>
            <label for="gf-month">Ay</label>
            <select class="select" id="gf-month">${MONTHS_TR.map((m, i) => html`<option value="${String(i + 1).padStart(2, '0')}" ${String(i + 1).padStart(2, '0') === month ? 'selected' : ''}>${m}</option>`)}</select>
          </div>
          <div class="field">
            <label for="gf-year">Yıl</label>
            <select class="select" id="gf-year">${years.map((y) => html`<option value="${y}" ${String(y) === year ? 'selected' : ''}>${y}</option>`)}</select>
          </div>
        </div>
        <div class="field">
          <label for="gf-course">Ders <span class="muted">(isteğe bağlı)</span></label>
          <select class="select" id="gf-course" name="courseId">
            <option value="">Ders yok</option>
            ${getCoursesSorted(state).map((c) => html`<option value="${c.id}" ${c.id === v.courseId ? 'selected' : ''}>${c.name}</option>`)}
          </select>
        </div>
        <p class="xsmall muted">Görev formunda bu hedefi seçerek görevleri hedefe bağlayabilirsin; ilerleme bağlı görevlerden hesaplanır.</p>
        ${formError()}
      </form>`,
    footer: html`
      ${isEdit ? html`<button type="button" class="btn btn--danger left" data-delete>${icon('trash')} Sil</button>` : ''}
      <button type="button" class="btn" data-modal-close>Vazgeç</button>
      <button type="submit" form="goal-form" class="btn btn--primary">${isEdit ? 'Kaydet' : 'Ekle'}</button>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      bindPressGroup(form, '.segmented', {
        onChange: (val) => { form.querySelector('[data-month-field]').hidden = val === 'year'; },
      });
      bindForm(form, (fd) => {
        const values = Object.fromEntries(fd);
        const y = form.querySelector('#gf-year').value;
        values.periodKey = values.period === 'year' ? y : `${y}-${form.querySelector('#gf-month').value}`;
        if (isEdit) updateGoal(goal.id, values);
        else {
          const g = addGoal(values);
          if (onSaved) onSaved(g);
        }
        toast(isEdit ? 'Hedef güncellendi' : `Hedef eklendi (${values.period === 'year' ? values.periodKey : formatMonthYear(values.periodKey)})`, { type: 'success', duration: 2000 });
      }, close);
      el.querySelector('[data-delete]')?.addEventListener('click', async () => {
        close();
        const p = getGoalProgress(getState(), goal.id);
        const ok = await confirmDialog({
          title: 'Hedef silinsin mi?',
          message: p.total ? `${p.total} görevin hedef bağlantısı kaldırılacak; görevler silinmez.` : '',
          confirmText: 'Sil',
          danger: true,
        });
        if (ok) { deleteGoal(goal.id); toast('Hedef silindi', { type: 'success' }); }
      });
    },
  });
}

export function bindGoalActions(root) {
  return delegate(root, 'click', '[data-action]', (e, el) => {
    const a = el.dataset.action;
    if (a === 'toggle-goal') {
      if (toggleGoal(el.dataset.id)) toast('Tebrikler, hedef tamamlandı!', { type: 'success', duration: 2500 });
    } else if (a === 'edit-goal') {
      const goal = getState().goals.find((g) => g.id === el.dataset.id);
      if (goal) openGoalForm({ goal });
    } else if (a === 'add-goal') {
      openGoalForm({ defaults: { period: el.dataset.period, periodKey: el.dataset.periodKey, courseId: el.dataset.courseId || '' } });
    }
  });
}
