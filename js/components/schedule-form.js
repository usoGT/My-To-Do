// Ders saati ekleme / düzenleme formu
import { html } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { openModal } from './modal.js';
import { bindForm, bindPressGroup, formError } from './form.js';
import { toast } from './toast.js';
import { getState } from '../store/store.js';
import { getCoursesSorted } from '../store/selectors.js';
import { addScheduleEntry, updateScheduleEntry, deleteScheduleEntry, ENTRY_TYPES } from '../store/actions/schedule.js';
import { WEEKDAYS_TR, timeToMinutes, minutesToTime } from '../lib/dates.js';

export function openScheduleForm({ entry = null, defaults = {} } = {}) {
  const state = getState();
  const courses = getCoursesSorted(state);
  const isEdit = Boolean(entry);
  const v = entry || {
    courseId: defaults.courseId || courses[0]?.id || '',
    weekday: defaults.weekday ?? 0,
    start: defaults.start || '09:00',
    end: defaults.end || minutesToTime(timeToMinutes(defaults.start || '09:00') + 50),
    type: 'ders',
    room: '',
  };
  const selectedCourse = courses.find((c) => c.id === v.courseId);
  openModal({
    title: isEdit ? 'Ders saatini düzenle' : 'Ders saati ekle',
    content: html`
      <form id="schedule-form" class="stack" novalidate>
        <div class="field">
          <label for="sf-course">Ders</label>
          <select class="select" id="sf-course" name="courseId">
            ${courses.map((c) => html`<option value="${c.id}" ${c.id === v.courseId ? 'selected' : ''}>${c.name}${c.code ? ` (${c.code})` : ''}</option>`)}
          </select>
          <p class="field-error"></p>
        </div>
        <div class="field">
          <label for="sf-day">Gün</label>
          <select class="select" id="sf-day" name="weekday">
            ${WEEKDAYS_TR.map((d, i) => html`<option value="${i}" ${i === Number(v.weekday) ? 'selected' : ''}>${d}</option>`)}
          </select>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="sf-start">Başlangıç</label>
            <input type="time" class="input" id="sf-start" name="start" value="${v.start}" step="300">
            <p class="field-error"></p>
          </div>
          <div class="field">
            <label for="sf-end">Bitiş</label>
            <input type="time" class="input" id="sf-end" name="end" value="${v.end}" step="300">
            <p class="field-error"></p>
          </div>
        </div>
        <div class="field">
          <span class="field-label" id="sf-type-label">Tür</span>
          <div class="segmented" role="group" aria-labelledby="sf-type-label">
            <input type="hidden" name="type" value="${v.type}">
            ${Object.entries(ENTRY_TYPES).map(([k, label]) => html`<button type="button" data-value="${k}" aria-pressed="${k === v.type}">${label}</button>`)}
          </div>
        </div>
        <div class="field">
          <label for="sf-room">Derslik <span class="muted">(boşsa dersin dersliği)</span></label>
          <input class="input" id="sf-room" name="room" value="${v.room}" maxlength="30" placeholder="${selectedCourse?.room || 'B-204'}">
        </div>
        ${formError()}
      </form>`,
    footer: html`
      ${isEdit ? html`<button type="button" class="btn btn--danger left" data-delete>${icon('trash')} Sil</button>` : ''}
      <button type="button" class="btn" data-modal-close>Vazgeç</button>
      <button type="submit" form="schedule-form" class="btn btn--primary">${isEdit ? 'Kaydet' : 'Ekle'}</button>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      bindPressGroup(form, '.segmented');
      // Başlangıç değişince bitişi aynı süre kadar kaydır.
      const startEl = form.querySelector('#sf-start');
      const endEl = form.querySelector('#sf-end');
      let prevStart = startEl.value;
      startEl.addEventListener('change', () => {
        if (!startEl.value || !endEl.value || !prevStart) { prevStart = startEl.value; return; }
        const len = timeToMinutes(endEl.value) - timeToMinutes(prevStart);
        if (len > 0) endEl.value = minutesToTime(Math.min(timeToMinutes(startEl.value) + len, 23 * 60 + 59));
        prevStart = startEl.value;
      });
      bindForm(form, (fd) => {
        const values = Object.fromEntries(fd);
        if (isEdit) updateScheduleEntry(entry.id, values);
        else addScheduleEntry(values);
        toast(isEdit ? 'Ders saati güncellendi' : 'Ders saati eklendi', { type: 'success' });
      }, close);
      el.querySelector('[data-delete]')?.addEventListener('click', () => {
        deleteScheduleEntry(entry.id);
        close();
        toast('Ders saati silindi', { type: 'success' });
      });
    },
  });
}
