// Sınav satırı, sınav formu ve çalışma planı önerisi (Faz 15)
import { html, delegate } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { openModal } from './modal.js';
import { bindForm, bindPressGroup, formError } from './form.js';
import { toast } from './toast.js';
import { confirmDialog } from './confirm.js';
import { getState } from '../store/store.js';
import { getCourse, getCoursesSorted, examTitle, suggestStudyPlan } from '../store/selectors.js';
import { addExam, updateExam, deleteExam, EXAM_TYPES } from '../store/actions/exams.js';
import { addTask } from '../store/actions/tasks.js';
import { todayKey, diffDays, formatRelativeDay, formatDayMonth, addDays, formatDuration } from '../lib/dates.js';

export function countdownText(days) {
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Yarın';
  return `${days} gün`;
}

export function examItem(state, exam, { showCourse = true } = {}) {
  const c = getCourse(state, exam.courseId);
  const days = diffDays(todayKey(), exam.date);
  const past = days < 0;
  return html`
    <li class="exam ${past ? 'is-past' : ''} ${c ? `c-${c.color}` : ''}">
      <div class="exam-count ${!past && days <= 3 ? 'is-soon' : ''}">
        ${past ? html`<span class="xsmall">Geçti</span>` : html`<strong>${days > 1 ? days : countdownText(days)}</strong>${days > 1 ? html`<span class="xsmall">gün</span>` : ''}`}
      </div>
      <button type="button" class="exam-body" data-action="edit-exam" data-id="${exam.id}">
        <span class="exam-title">${examTitle(state, exam)}</span>
        <span class="task-meta">
          <span>${formatRelativeDay(exam.date)}${exam.time ? ` ${exam.time}` : ''}</span>
          <span class="badge">${EXAM_TYPES[exam.type]}</span>
          ${showCourse && c ? html`<span class="badge badge--course c-${c.color}"><span class="truncate">${c.name}</span></span>` : ''}
          ${exam.room ? html`<span>${exam.room}</span>` : ''}
        </span>
      </button>
      ${past ? '' : html`<button type="button" class="btn btn--sm" data-action="study-plan" data-id="${exam.id}" title="Sınava kadar boş zamanlarına çalışma görevleri öner">${icon('sparkles')} Çalışma planı</button>`}
    </li>`;
}

export function openExamForm({ exam = null, defaults = {} } = {}) {
  const state = getState();
  const courses = getCoursesSorted(state);
  if (!courses.length) { toast('Sınav eklemek için önce bir ders ekle.', { type: 'error' }); return; }
  const isEdit = Boolean(exam);
  const v = exam || { courseId: defaults.courseId || courses[0].id, type: 'vize', title: '', date: defaults.date || addDays(todayKey(), 7), time: '', room: '', notes: '' };
  openModal({
    title: isEdit ? 'Sınavı düzenle' : 'Sınav ekle',
    content: html`
      <form id="exam-form" class="stack" novalidate>
        <div class="field">
          <label for="ef-course">Ders</label>
          <select class="select" id="ef-course" name="courseId" autofocus>${courses.map((c) => html`<option value="${c.id}" ${c.id === v.courseId ? 'selected' : ''}>${c.name}</option>`)}</select>
          <p class="field-error"></p>
        </div>
        <div class="field">
          <span class="field-label" id="ef-type-label">Tür</span>
          <div class="segmented exam-types" role="group" aria-labelledby="ef-type-label">
            <input type="hidden" name="type" value="${v.type}">
            ${Object.entries(EXAM_TYPES).map(([k, label]) => html`<button type="button" data-value="${k}" aria-pressed="${k === v.type}">${label}</button>`)}
          </div>
        </div>
        <div class="field-row">
          <div class="field"><label for="ef-date">Tarih</label><input type="date" class="input" id="ef-date" name="date" value="${v.date}"><p class="field-error"></p></div>
          <div class="field"><label for="ef-time">Saat <span class="muted">(isteğe bağlı)</span></label><input type="time" class="input" id="ef-time" name="time" value="${v.time || ''}" step="300"><p class="field-error"></p></div>
          <div class="field"><label for="ef-room">Yer <span class="muted">(isteğe bağlı)</span></label><input class="input" id="ef-room" name="room" value="${v.room}" maxlength="30" placeholder="Amfi 1"></div>
        </div>
        <div class="field">
          <label for="ef-title">Başlık <span class="muted">(boşsa "Ders + tür")</span></label>
          <input class="input" id="ef-title" name="title" value="${v.title}" maxlength="100">
        </div>
        <div class="field">
          <label for="ef-notes">Konular / notlar <span class="muted">(isteğe bağlı)</span></label>
          <textarea class="textarea" id="ef-notes" name="notes" rows="2" maxlength="2000" placeholder="Örn. 1–5. bölümler">${v.notes}</textarea>
        </div>
        ${formError()}
      </form>`,
    footer: html`
      ${isEdit ? html`<button type="button" class="btn btn--danger left" data-delete>${icon('trash')} Sil</button>` : ''}
      <button type="button" class="btn" data-modal-close>Vazgeç</button>
      <button type="submit" form="exam-form" class="btn btn--primary">${isEdit ? 'Kaydet' : 'Ekle'}</button>`,
    onMount(el, close) {
      const form = el.querySelector('form');
      bindPressGroup(form, '.segmented');
      bindForm(form, (fd) => {
        const values = Object.fromEntries(fd);
        if (isEdit) updateExam(exam.id, values);
        else {
          const e = addExam(values);
          toast('Sınav eklendi', { type: 'success', action: { label: 'Çalışma planı', onClick: () => openStudyPlan(e) } });
          return;
        }
        toast('Sınav güncellendi', { type: 'success', duration: 2000 });
      }, close);
      el.querySelector('[data-delete]')?.addEventListener('click', async () => {
        close();
        if (await confirmDialog({ title: 'Sınav silinsin mi?', confirmText: 'Sil', danger: true })) {
          deleteExam(exam.id);
          toast('Sınav silindi', { type: 'success' });
        }
      });
    },
  });
}

// Çalışma planı önerisi: kullanıcı onaylamadan hiçbir görev eklenmez.
export function openStudyPlan(exam) {
  const state = getState();
  const course = getCourse(state, exam.courseId);
  const title = examTitle(state, exam);
  const opts = { sessions: 5, minutes: 60 };
  const listHtml = () => {
    const plan = suggestStudyPlan(getState(), exam, todayKey(), opts);
    if (!plan.length) return html`<p class="small muted">Sınava kadar ${formatDuration(opts.minutes)} boşluğu olan gün bulunamadı. Süreyi kısaltmayı dene.</p>`;
    return html`<ul class="plan-list">${plan.map((p, i) => html`
      <li><label class="plan-item">
        <input type="checkbox" checked data-i="${i}" data-date="${p.date}" data-time="${p.time}">
        <span class="grow"><strong>${formatDayMonth(p.date)}</strong> <span class="muted">${p.time}</span></span>
        <span class="xsmall muted">${formatDuration(p.minutes)}</span>
      </label></li>`)}</ul>`;
  };
  openModal({
    title: 'Çalışma planı önerisi',
    content: html`
      <p class="small">${title} · <strong>${formatRelativeDay(exam.date)}</strong> (${countdownText(diffDays(todayKey(), exam.date))}${diffDays(todayKey(), exam.date) > 1 ? ' kaldı' : ''})</p>
      <div class="field-row">
        <div class="field"><label for="sp-n">Kaç seans?</label>
          <select class="select" id="sp-n">${[3, 5, 7, 10].map((n) => html`<option value="${n}" ${n === 5 ? 'selected' : ''}>${n}</option>`)}</select></div>
        <div class="field"><label for="sp-m">Seans süresi</label>
          <select class="select" id="sp-m">${[30, 45, 60, 90, 120].map((m) => html`<option value="${m}" ${m === 60 ? 'selected' : ''}>${formatDuration(m)}</option>`)}</select></div>
      </div>
      <p class="xsmall muted">Öneriler ders programın ve saatli görevlerine göre boş zamanlarından seçildi; sınava yakın günler öncelikli. İstemediklerinin işaretini kaldır.</p>
      <div data-plan>${listHtml()}</div>`,
    footer: html`
      <button type="button" class="btn" data-modal-close>Vazgeç</button>
      <button type="button" class="btn btn--primary" data-add-plan>${icon('plus')} Seçilenleri görev olarak ekle</button>`,
    onMount(el, close) {
      const redraw = () => { el.querySelector('[data-plan]').innerHTML = String(listHtml()); };
      el.querySelector('#sp-n').addEventListener('change', (e) => { opts.sessions = Number(e.target.value); redraw(); });
      el.querySelector('#sp-m').addEventListener('change', (e) => { opts.minutes = Number(e.target.value); redraw(); });
      el.querySelector('[data-add-plan]').addEventListener('click', () => {
        const picked = [...el.querySelectorAll('[data-plan] input:checked')];
        if (!picked.length) { toast('Hiç seans seçilmedi.', { type: 'error' }); return; }
        for (const cb of picked) {
          addTask({
            title: `${title} çalışması`,
            date: cb.dataset.date,
            time: cb.dataset.time,
            estimateMin: opts.minutes,
            courseId: course ? course.id : null,
            priority: 'high',
            notes: exam.notes ? `Konular: ${exam.notes}` : '',
          });
        }
        close();
        toast(`${picked.length} çalışma görevi eklendi`, { type: 'success' });
      });
    },
  });
}

export function bindExamActions(root) {
  return delegate(root, 'click', '[data-action]', (e, el) => {
    const a = el.dataset.action;
    const exam = el.dataset.id ? getState().exams.find((x) => x.id === el.dataset.id) : null;
    if (a === 'edit-exam' && exam) openExamForm({ exam });
    else if (a === 'study-plan' && exam) openStudyPlan(exam);
    else if (a === 'add-exam') openExamForm({ defaults: { courseId: el.dataset.courseId, date: el.dataset.date } });
  });
}
