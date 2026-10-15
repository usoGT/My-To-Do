// Ders sayfası: bir derse ait görevler, saatler, notlar, hedefler ve odak süresi tek sayfada.
import { html, delegate } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getState, subscribe } from '../store/store.js';
import { getCourseOverview, getExamsByCourse } from '../store/selectors.js';
import { examItem, bindExamActions } from '../components/exams.js';
import { ENTRY_TYPES } from '../store/actions/schedule.js';
import { addCourseNote } from '../store/actions/course-notes.js';
import { taskList, bindTaskActions } from '../components/task-item.js';
import { goalItem, bindGoalActions } from '../components/goals.js';
import { openCourseForm, confirmDeleteCourse } from '../components/course-form.js';
import { openScheduleForm } from '../components/schedule-form.js';
import { barChart } from '../components/bar-chart.js';
import { emptyState } from '../components/empty-state.js';
import { navigate } from '../router.js';
import { todayKey, nowMinutes, formatDuration, formatRelativeDay, WEEKDAYS_TR, WEEKDAYS_SHORT_TR, weekdayIndex, formatTimeAgo, monthKey } from '../lib/dates.js';
import { firstLine } from '../lib/text.js';

const now = () => ({ key: todayKey(), minutes: nowMinutes() });

function notFound() {
  return html`
    <div class="empty" style="margin-top: var(--space-8)">
      <div class="empty-icon">${icon('book')}</div>
      <h3>Ders bulunamadı</h3>
      <p>Bu ders silinmiş olabilir.</p>
      <a class="btn btn--primary" href="#/program">${icon('grid')} Ders Programı'na git</a>
    </div>`;
}

function view(state, id, ui) {
  const o = getCourseOverview(state, id, now());
  if (!o) return notFound();
  const c = o.course;
  const next = o.nextClass;
  const chart = barChart(o.focus.last7Days.map((d, i) => ({
    label: WEEKDAYS_SHORT_TR[weekdayIndex(d.key)],
    value: d.minutes,
    highlight: i === 6,
    title: `${formatRelativeDay(d.key)}: ${formatDuration(d.minutes)}`,
  })), { format: (v) => `${v}`, ariaLabel: 'Son 7 günün odak dakikaları' });

  return html`
    <header class="course-hero c-${c.color}">
      <div class="grow">
        <div class="course-hero-code">${c.code || 'Ders'}</div>
        <h1>${c.name}</h1>
        <p class="course-hero-meta">${[c.teacher, c.room].filter(Boolean).join(' · ') || html`<span class="faint">Öğretim üyesi ve derslik eklenmedi</span>`}</p>
        <p class="course-hero-next">${icon('clock')}<span>${next
          ? html`Sıradaki ders: <strong>${formatRelativeDay(next.date)} ${next.start}</strong>${next.room || c.room ? `, ${next.room || c.room}` : ''}`
          : 'Programda ders saati yok'}</span></p>
      </div>
      <div class="row">
        <a class="btn" href="#/pomodoro?ders=${c.id}">${icon('timer')} Pomodoro</a>
        <button type="button" class="btn btn--icon" data-action="edit-course" aria-label="Dersi düzenle">${icon('edit')}</button>
        <button type="button" class="btn btn--icon btn--danger" data-action="delete-course" aria-label="Dersi sil">${icon('trash')}</button>
      </div>
    </header>

    <div class="stats course-stats">
      <div class="stat"><span class="stat-label">Haftalık ders</span><span class="stat-value">${formatDuration(o.weeklyMinutes)}</span></div>
      <div class="stat"><span class="stat-label">Açık görev</span><span class="stat-value">${o.openTasks.length + o.overdueTasks.length}</span>${o.overdueTasks.length ? html`<span class="stat-sub" style="color:var(--danger)">${o.overdueTasks.length} geciken</span>` : ''}</div>
      <div class="stat"><span class="stat-label">Bu hafta odak</span><span class="stat-value">${formatDuration(o.focus.thisWeekMin)}</span></div>
      <div class="stat"><span class="stat-label">Toplam odak</span><span class="stat-value">${formatDuration(o.focus.totalMin)}</span></div>
    </div>

    <div class="course-grid">
      <div class="course-main">
        <section class="section">
          <div class="section-title">
            <span>Görevler</span>
            <button type="button" class="btn btn--ghost btn--sm" data-action="add-task">${icon('plus')} Bu derse görev ekle</button>
          </div>
          ${o.overdueTasks.length || o.openTasks.length
            ? html`<div class="card card--tight">${taskList(state, [...o.overdueTasks, ...o.openTasks], { showDate: true })}</div>`
            : emptyState({ icon: 'check', title: 'Açık görev yok', compact: true })}
          ${o.doneTasks.length ? html`
            <label class="switch small"><input type="checkbox" data-toggle-done ${ui.showDone ? 'checked' : ''}><span class="track"></span><span>Tamamlananları göster (${o.doneTasks.length})</span></label>
            ${ui.showDone ? html`<div class="card card--tight">${taskList(state, o.doneTasks.slice(0, 30), { showDate: true })}</div>` : ''}` : ''}
        </section>

        <section class="section">
          <div class="section-title">
            <span>Notlar <span class="count">${o.notes.length || ''}</span></span>
            <span class="row">
              ${o.notes.length ? html`<a class="btn btn--ghost btn--sm" href="#/ders-notlari?ders=${c.id}">Tüm notlar ${icon('arrowRight')}</a>` : ''}
              <button type="button" class="btn btn--ghost btn--sm" data-action="new-note">${icon('plus')} Yeni not</button>
            </span>
          </div>
          ${o.notes.length ? html`
            <ul class="card card--tight course-notes">
              ${o.notes.slice(0, 5).map((n) => html`
                <li><a class="course-note" href="#/ders-notlari?ders=${c.id}&not=${n.id}">
                  <span class="grow"><strong class="truncate">${n.title || 'Başlıksız not'}</strong><span class="xsmall muted truncate">${firstLine(n.body) || 'Boş not'}</span></span>
                  ${n.attachments.length ? html`<span class="xsmall muted row" style="gap:2px">${icon('paperclip')}${n.attachments.length}</span>` : ''}
                  <span class="xsmall faint nowrap">${formatTimeAgo(n.updatedAt)}</span>
                </a></li>`)}
            </ul>` : html`<p class="small muted">Bu ders için henüz not yok.</p>`}
        </section>
      </div>

      <aside class="course-side">
        <section class="section">
          <div class="section-title">
            <span>Haftalık saatler</span>
            <a class="btn btn--ghost btn--sm" href="#/program">Programda göster</a>
          </div>
          <div class="card card--tight">
            ${o.scheduleEntries.length
              ? html`<ul class="course-hours">${o.scheduleEntries.map((e) => html`
                  <li><button type="button" data-action="edit-entry" data-id="${e.id}">
                    <span class="course-hours-day">${WEEKDAYS_TR[e.weekday]}</span>
                    <span class="nowrap">${e.start}–${e.end}</span>
                    <span class="xsmall muted truncate">${[e.room || c.room, e.type !== 'ders' ? ENTRY_TYPES[e.type] : ''].filter(Boolean).join(' · ')}</span>
                  </button></li>`)}</ul>`
              : html`<p class="small muted goal-empty">Ders saati eklenmedi.</p>`}
            <button type="button" class="btn btn--ghost btn--sm" data-action="add-entry">${icon('plus')} Ders saati ekle</button>
          </div>
        </section>

        <section class="section">
          <div class="section-title">
            <span>Sınavlar</span>
            <button type="button" class="btn btn--ghost btn--sm" data-action="add-exam" data-course-id="${c.id}">${icon('plus')} Sınav ekle</button>
          </div>
          ${getExamsByCourse(state, c.id).length
            ? html`<ul class="card card--tight exam-list">${getExamsByCourse(state, c.id).map((e) => examItem(state, e, { showCourse: false }))}</ul>`
            : html`<p class="small muted">Bu ders için sınav eklenmedi.</p>`}
        </section>

        <section class="section">
          <div class="section-title">
            <span>Odak · son 7 gün</span>
            <span class="xsmall muted" style="text-transform:none;letter-spacing:0">dakika</span>
          </div>
          <div class="card card--tight">${chart}</div>
        </section>

        <section class="section">
          <div class="section-title">
            <span>Hedefler</span>
            <button type="button" class="btn btn--ghost btn--sm" data-action="add-goal" data-period="month" data-period-key="${monthKey(todayKey())}" data-course-id="${c.id}">${icon('plus')} Hedef</button>
          </div>
          <div class="card card--tight">
            ${o.goals.length ? html`<ul class="goal-list">${o.goals.map((g) => goalItem(state, g))}</ul>` : html`<p class="small muted goal-empty">Bu derse bağlı hedef yok.</p>`}
          </div>
        </section>
      </aside>
    </div>`;
}

export default {
  title: 'Ders',
  render(root, { params, setTitle }) {
    const id = params.id;
    const ui = { showDone: false };
    const draw = () => {
      const c = getState().courses.find((x) => x.id === id);
      setTitle(c ? c.name : 'Ders bulunamadı');
      root.innerHTML = String(view(getState(), id, ui));
    };
    draw();
    const unsub = subscribe(draw);
    const offTasks = bindTaskActions(root, { defaults: () => ({ courseId: id, date: todayKey() }) });
    const offGoals = bindGoalActions(root);
    const offExams = bindExamActions(root);
    const offClick = delegate(root, 'click', '[data-action]', async (e, el) => {
      const a = el.dataset.action;
      const state = getState();
      const course = state.courses.find((c) => c.id === id);
      if (a === 'edit-course') openCourseForm({ course });
      else if (a === 'delete-course') {
        if (await confirmDeleteCourse(course)) navigate('/program');
      } else if (a === 'add-entry') openScheduleForm({ defaults: { courseId: id } });
      else if (a === 'edit-entry') openScheduleForm({ entry: state.schedule.find((x) => x.id === el.dataset.id) });
      else if (a === 'new-note') {
        const n = addCourseNote({ courseId: id });
        navigate('/ders-notlari', { ders: id, not: n.id });
      }
    });
    const offChange = delegate(root, 'change', '[data-toggle-done]', (e, el) => { ui.showDone = el.checked; draw(); });
    return () => { unsub(); offTasks(); offGoals(); offExams(); offClick(); offChange(); };
  },
};
