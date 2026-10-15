// Rutin ekleme / düzenleme formu
import { html } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { openModal } from './modal.js';
import { bindForm, bindPressGroup, formError } from './form.js';
import { toast } from './toast.js';
import { confirmDialog } from './confirm.js';
import { COURSE_COLORS, COLOR_LABELS } from '../store/schema.js';
import { addRoutine, updateRoutine, deleteRoutine, setRoutineArchived } from '../store/actions/routines.js';
import { WEEKDAYS_SHORT_TR, WEEKDAYS_TR } from '../lib/dates.js';

const PRESETS = { all: [0, 1, 2, 3, 4, 5, 6], weekdays: [0, 1, 2, 3, 4], weekend: [5, 6] };

export function openRoutineForm({ routine = null } = {}) {
  const isEdit = Boolean(routine);
  const v = routine || { title: '', weekdays: [0, 1, 2, 3, 4], time: '', durationMin: 30, color: 'green' };
  openModal({
    title: isEdit ? 'Rutini düzenle' : 'Yeni rutin',
    content: html`
      <form id="routine-form" class="stack" novalidate>
        <div class="field">
          <label for="rf-title">Rutin</label>
          <input class="input" id="rf-title" name="title" value="${v.title}" maxlength="80" placeholder="Örn. 20 dk kitap oku" autofocus>
          <p class="field-error"></p>
        </div>
        <div class="field">
          <span class="field-label" id="rf-days-label">Günler</span>
          <div class="day-picker" role="group" aria-labelledby="rf-days-label">
            <input type="hidden" name="weekdays" value="${v.weekdays.join(',')}">
            ${WEEKDAYS_SHORT_TR.map((d, i) => html`<button type="button" data-value="${i}" aria-pressed="${v.weekdays.includes(i)}" aria-label="${WEEKDAYS_TR[i]}">${d}</button>`)}
          </div>
          <div class="chips" style="margin-top: 6px">
            <button type="button" class="chip" data-preset="all">Her gün</button>
            <button type="button" class="chip" data-preset="weekdays">Hafta içi</button>
            <button type="button" class="chip" data-preset="weekend">Hafta sonu</button>
          </div>
          <input type="hidden" name="_weekdays_err">
          <p class="field-error" data-err="weekdays"></p>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="rf-time">Saat <span class="muted">(isteğe bağlı)</span></label>
            <input type="time" class="input" id="rf-time" name="time" value="${v.time || ''}" step="300">
            <p class="field-error"></p>
          </div>
          <div class="field">
            <label for="rf-dur">Süre (dk)</label>
            <input type="number" class="input" id="rf-dur" name="durationMin" value="${v.durationMin}" min="5" max="240" step="5" inputmode="numeric">
            <p class="field-error"></p>
          </div>
        </div>
        <div class="field">
          <span class="field-label" id="rf-color-label">Renk</span>
          <div class="color-picker" role="group" aria-labelledby="rf-color-label">
            <input type="hidden" name="color" value="${v.color}">
            ${COURSE_COLORS.map((c) => html`<button type="button" class="color-swatch c-${c}" data-value="${c}" aria-pressed="${c === v.color}" aria-label="${COLOR_LABELS[c]}"></button>`)}
          </div>
        </div>
        ${formError()}
      </form>`,
    footer: html`
      ${isEdit ? html`
        <div class="left row">
          <button type="button" class="btn btn--danger" data-delete>${icon('trash')} Sil</button>
          <button type="button" class="btn" data-archive>${icon('archive')} ${routine.archived ? 'Arşivden çıkar' : 'Arşivle'}</button>
        </div>` : ''}
      <button type="button" class="btn" data-modal-close>Vazgeç</button>
      <button type="submit" form="routine-form" class="btn btn--primary">${isEdit ? 'Kaydet' : 'Ekle'}</button>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      bindPressGroup(form, '.day-picker', { multiple: true });
      bindPressGroup(form, '.color-picker');
      form.querySelectorAll('[data-preset]').forEach((chip) => chip.addEventListener('click', () => {
        const days = PRESETS[chip.dataset.preset];
        form.querySelectorAll('.day-picker [data-value]').forEach((b) => b.setAttribute('aria-pressed', String(days.includes(Number(b.dataset.value)))));
        form.querySelector('[name="weekdays"]').value = days.join(',');
      }));
      bindForm(form, (fd) => {
        const values = Object.fromEntries(fd);
        try {
          if (isEdit) updateRoutine(routine.id, values);
          else addRoutine(values);
        } catch (err) {
          if (err.field === 'weekdays') {
            form.querySelector('[data-err="weekdays"]').textContent = err.message;
            return false;
          }
          throw err;
        }
        toast(isEdit ? 'Rutin güncellendi' : 'Rutin eklendi', { type: 'success', duration: 2000 });
        return true;
      }, close);
      el.querySelector('[data-archive]')?.addEventListener('click', () => {
        setRoutineArchived(routine.id, !routine.archived);
        close();
        toast(routine.archived ? 'Rutin arşivden çıkarıldı' : 'Rutin arşivlendi. Geçmişi korunuyor.', { type: 'success' });
      });
      el.querySelector('[data-delete]')?.addEventListener('click', async () => {
        close();
        const ok = await confirmDialog({
          title: `"${routine.title}" silinsin mi?`,
          message: 'Rutinin tüm geçmişi de silinir. Geçmişi korumak için arşivlemeyi düşünebilirsin.',
          confirmText: 'Sil',
          danger: true,
        });
        if (ok) { deleteRoutine(routine.id); toast('Rutin silindi', { type: 'success' }); }
      });
    },
  });
}
