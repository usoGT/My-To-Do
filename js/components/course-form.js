// Ders ekleme / düzenleme formu
import { html } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { openModal } from './modal.js';
import { bindForm, bindPressGroup, formError } from './form.js';
import { toast } from './toast.js';
import { confirmDialog } from './confirm.js';
import { getState } from '../store/store.js';
import { COURSE_COLORS, COLOR_LABELS } from '../store/schema.js';
import { addCourse, updateCourse, deleteCourse, getCourseImpact, nextFreeColor } from '../store/actions/courses.js';
import { deleteFilesQuietly } from '../lib/attachments.js';

export function openCourseForm({ course = null, onSaved } = {}) {
  const isEdit = Boolean(course);
  const color = course ? course.color : nextFreeColor(getState().courses);
  openModal({
    title: isEdit ? 'Dersi düzenle' : 'Ders ekle',
    content: html`
      <form id="course-form" class="stack" novalidate>
        <div class="field">
          <label for="cf-name">Ders adı</label>
          <input class="input" id="cf-name" name="name" value="${course?.name}" maxlength="60" placeholder="Örn. Fizik I" required autofocus>
          <p class="field-error"></p>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="cf-code">Ders kodu <span class="muted">(isteğe bağlı)</span></label>
            <input class="input" id="cf-code" name="code" value="${course?.code}" maxlength="20" placeholder="FİZ101">
          </div>
          <div class="field">
            <label for="cf-room">Derslik <span class="muted">(isteğe bağlı)</span></label>
            <input class="input" id="cf-room" name="room" value="${course?.room}" maxlength="30" placeholder="B-204">
          </div>
        </div>
        <div class="field">
          <label for="cf-teacher">Öğretim üyesi <span class="muted">(isteğe bağlı)</span></label>
          <input class="input" id="cf-teacher" name="teacher" value="${course?.teacher}" maxlength="60">
        </div>
        <div class="field">
          <span class="field-label" id="cf-color-label">Renk</span>
          <div class="color-picker" role="group" aria-labelledby="cf-color-label">
            <input type="hidden" name="color" value="${color}">
            ${COURSE_COLORS.map((c) => html`
              <button type="button" class="color-swatch c-${c}" data-value="${c}" aria-pressed="${c === color}" aria-label="${COLOR_LABELS[c]}" title="${COLOR_LABELS[c]}"></button>`)}
          </div>
        </div>
        ${formError()}
      </form>`,
    footer: html`
      ${isEdit ? html`<button type="button" class="btn btn--danger left" data-delete>${icon('trash')} Sil</button>` : ''}
      <button type="button" class="btn" data-modal-close>Vazgeç</button>
      <button type="submit" form="course-form" class="btn btn--primary">${isEdit ? 'Kaydet' : 'Ekle'}</button>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      bindPressGroup(form, '.color-picker');
      bindForm(form, (fd) => {
        const values = Object.fromEntries(fd);
        if (isEdit) updateCourse(course.id, values);
        const saved = isEdit ? course : addCourse(values);
        toast(isEdit ? 'Ders güncellendi' : `"${values.name.trim()}" eklendi`, { type: 'success' });
        if (onSaved) onSaved(saved);
      }, close);
      el.querySelector('[data-delete]')?.addEventListener('click', async () => {
        close();
        await confirmDeleteCourse(course);
      });
    },
  });
}

export async function confirmDeleteCourse(course) {
  const imp = getCourseImpact(getState(), course.id);
  const details = [];
  if (imp.scheduleCount) details.push(`${imp.scheduleCount} ders saati silinecek`);
  if (imp.noteCount) details.push(`${imp.noteCount} ders notu ve ekleri silinecek`);
  if (imp.examCount) details.push(`${imp.examCount} sınav silinecek`);
  if (imp.taskCount) details.push(`${imp.taskCount} görevin ders bağlantısı kaldırılacak (görevler kalır)`);
  if (imp.goalCount) details.push(`${imp.goalCount} hedefin ders bağlantısı kaldırılacak`);
  const ok = await confirmDialog({
    title: `"${course.name}" silinsin mi?`,
    message: details.length ? 'Bu dersle birlikte:' : 'Bu derse bağlı bir şey yok.',
    details,
    confirmText: 'Dersi sil',
    danger: true,
  });
  if (!ok) return false;
  const { attachmentIds } = deleteCourse(course.id);
  deleteFilesQuietly(attachmentIds);
  toast('Ders silindi', { type: 'success' });
  return true;
}
