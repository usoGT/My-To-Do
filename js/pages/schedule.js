// Ders Programı: dersler, haftalık ızgara, günlük boş zaman. Telefonda gün sekmeleri.
import { html, delegate } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getState, subscribe } from '../store/store.js';
import { getCoursesSorted, getScheduleForWeekday, getWeeklyMinutes, getWeekdayFreeSlots, getCourse } from '../store/selectors.js';
import { ENTRY_TYPES } from '../store/actions/schedule.js';
import { openCourseForm, confirmDeleteCourse } from '../components/course-form.js';
import { openScheduleForm } from '../components/schedule-form.js';
import { emptyState } from '../components/empty-state.js';
import { WEEKDAYS_TR, WEEKDAYS_SHORT_TR, timeToMinutes, minutesToTime, formatDuration, weekdayIndex, todayKey, nowMinutes, weekDays, parseDate } from '../lib/dates.js';
import { totalFreeMinutes } from '../lib/time-slots.js';
import { getUpcomingExams, getPastExams } from '../store/selectors.js';
import { examItem, bindExamActions } from '../components/exams.js';

const HOUR_PX = 48;

function visibleWeekdays(state) {
  const days = state.settings.showWeekend ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];
  // Hafta sonu gizliyken bile orada ders varsa göster
  if (!state.settings.showWeekend) {
    for (const d of [5, 6]) if (state.schedule.some((e) => e.weekday === d)) days.push(d);
  }
  return days;
}

function hourRange(state) {
  const startH = Math.floor(timeToMinutes(state.settings.dayStart) / 60);
  const endH = Math.ceil(timeToMinutes(state.settings.dayEnd) / 60);
  return { startH, endH: Math.max(endH, startH + 1) };
}

const courseCard = (state, c) => {
  const weekly = getWeeklyMinutes(state, c.id);
  return html`
    <article class="course-card c-${c.color}">
      <a class="course-card-main" href="#/ders/${c.id}">
        <span class="course-card-name truncate">${c.name}</span>
        <span class="xsmall muted truncate">${[c.code, c.teacher].filter(Boolean).join(' · ') || 'Bilgi eklenmedi'}</span>
        <span class="xsmall course-card-hours">${weekly ? `Haftada ${formatDuration(weekly)}` : 'Ders saati yok'}</span>
      </a>
      <div class="course-card-actions">
        <button type="button" class="btn btn--ghost btn--icon btn--sm" data-action="edit-course" data-id="${c.id}" aria-label="${c.name} dersini düzenle">${icon('edit')}</button>
        <button type="button" class="btn btn--ghost btn--icon btn--sm" data-action="delete-course" data-id="${c.id}" aria-label="${c.name} dersini sil">${icon('trash')}</button>
      </div>
    </article>`;
};

function block(state, e, startH) {
  const top = ((timeToMinutes(e.start) - startH * 60) / 60) * HOUR_PX;
  const height = Math.max(((timeToMinutes(e.end) - timeToMinutes(e.start)) / 60) * HOUR_PX - 2, 18);
  const room = e.room || e.course.room;
  return html`
    <button type="button" class="sched-block c-${e.course.color} ${height < 40 ? 'is-short' : ''}" style="top:${top}px;height:${height}px"
      data-action="edit-entry" data-id="${e.id}" aria-label="${e.course.name}, ${WEEKDAYS_TR[e.weekday]} ${e.start}–${e.end}">
      <span class="sched-block-name">${e.course.name}</span>
      <span class="sched-block-meta">${e.start}–${e.end}${room ? ` · ${room}` : ''}${e.type !== 'ders' ? ` · ${ENTRY_TYPES[e.type]}` : ''}</span>
    </button>`;
}

function gridView(state) {
  const days = visibleWeekdays(state);
  const { startH, endH } = hourRange(state);
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const today = weekdayIndex(todayKey());
  const dates = weekDays(todayKey());
  const height = (endH - startH) * HOUR_PX;
  return html`
    <div class="sched-grid" style="--cols:${days.length};--hour:${HOUR_PX}px">
      <div class="sched-head sched-corner"></div>
      ${days.map((d) => html`
        <div class="sched-head ${d === today ? 'is-today' : ''}">
          <span>${WEEKDAYS_SHORT_TR[d]}</span><span class="sched-head-date">${parseDate(dates[d]).getDate()}</span>
        </div>`)}
      <div class="sched-hours" style="height:${height}px">
        ${hours.map((h) => html`<span style="top:${(h - startH) * HOUR_PX}px">${String(h).padStart(2, '0')}:00</span>`)}
      </div>
      ${days.map((d) => html`
        <div class="sched-col ${d === today ? 'is-today' : ''}" style="height:${height}px" data-weekday="${d}" data-start-h="${startH}">
          ${getScheduleForWeekday(state, d).map((e) => block(state, e, startH))}
          ${d === today ? html`<div class="now-line" data-now-line hidden></div>` : ''}
        </div>`)}
    </div>`;
}

function freeTimeView(state) {
  const days = visibleWeekdays(state);
  const dayStart = timeToMinutes(state.settings.dayStart);
  const dayLen = timeToMinutes(state.settings.dayEnd) - dayStart;
  return html`
    <div class="free-list">
      ${days.map((d) => {
        const free = totalFreeMinutes(getWeekdayFreeSlots(state, d));
        const classes = getScheduleForWeekday(state, d);
        return html`
          <div class="free-row">
            <span class="free-day">${WEEKDAYS_TR[d]}</span>
            <div class="free-bar" aria-hidden="true">
              ${classes.map((e) => {
                const left = Math.max(0, (timeToMinutes(e.start) - dayStart) / dayLen) * 100;
                const width = Math.max(0, Math.min(100 - left, ((timeToMinutes(e.end) - timeToMinutes(e.start)) / dayLen) * 100));
                return html`<span class="c-${e.course.color}" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%"></span>`;
              })}
            </div>
            <span class="free-total"><strong>${formatDuration(free)}</strong> boş</span>
          </div>`;
      })}
    </div>
    <p class="xsmall muted">Gün ${state.settings.dayStart}–${state.settings.dayEnd} arası sayılır, 15 dakikadan kısa aralıklar dahil edilmez. Ayarlar'dan değiştirebilirsin.</p>`;
}

function mobileDayView(state, day) {
  const classes = getScheduleForWeekday(state, day);
  const free = totalFreeMinutes(getWeekdayFreeSlots(state, day));
  return html`
    <div class="tabs sched-tabs" role="tablist" aria-label="Günler">
      ${[0, 1, 2, 3, 4, 5, 6].map((d) => html`
        <button type="button" class="tab" role="tab" aria-selected="${d === day}" data-action="pick-day" data-day="${d}">${WEEKDAYS_SHORT_TR[d]}</button>`)}
    </div>
    <div class="sched-day-list">
      ${classes.length
        ? classes.map((e) => html`
          <button type="button" class="sched-day-item c-${e.course.color}" data-action="edit-entry" data-id="${e.id}">
            <span class="sched-day-time">${e.start}<br><span class="muted">${e.end}</span></span>
            <span class="grow">
              <span class="sched-day-name">${e.course.name}</span>
              <span class="xsmall muted">${[e.room || e.course.room, e.type !== 'ders' ? ENTRY_TYPES[e.type] : ''].filter(Boolean).join(' · ') || ' '}</span>
            </span>
          </button>`)
        : html`<p class="small muted" style="padding: var(--space-4) 0">${WEEKDAYS_TR[day]} günü ders yok.</p>`}
      <p class="small"><strong>${formatDuration(free)}</strong> <span class="muted">boş zaman</span></p>
      <button type="button" class="btn btn--sm" data-action="add-entry" data-weekday="${day}">${icon('plus')} ${WEEKDAYS_TR[day]} için ders saati ekle</button>
    </div>`;
}

function examsView(state) {
  const upcoming = getUpcomingExams(state, todayKey());
  const past = getPastExams(state, todayKey());
  return html`
    ${upcoming.length
      ? html`<ul class="card card--tight exam-list">${upcoming.map((e) => examItem(state, e))}</ul>`
      : html`<p class="small muted">Yaklaşan sınav yok. Vize ve final tarihlerini ekle, geri sayımı Bugün sayfasında gör.</p>`}
    ${past.length ? html`
      <details class="fold" data-fold="past-exams">
        <summary>${icon('chevronRight')} Geçmiş sınavlar <span class="count">${past.length}</span></summary>
        <ul class="fold-body card card--tight exam-list">${past.map((e) => examItem(state, e))}</ul>
      </details>` : ''}`;
}

function view(state, ui) {
  const courses = getCoursesSorted(state);
  return html`
    <div class="page-header">
      <div>
        <h1>Ders Programı</h1>
        <p>Derslerini ve haftalık ders saatlerini buradan yönet.</p>
      </div>
      <div class="row wrap">
        <button type="button" class="btn" data-action="add-course">${icon('plus')} Ders ekle</button>
        ${courses.length ? html`<button type="button" class="btn btn--primary" data-action="add-entry">${icon('clock')} Ders saati ekle</button>` : ''}
      </div>
    </div>

    <section class="section">
      <h2 class="section-title">Derslerim <span class="count">${courses.length || ''}</span></h2>
      ${courses.length
        ? html`<div class="course-cards">${courses.map((c) => courseCard(state, c))}</div>`
        : emptyState({ icon: 'book', title: 'Önce bir ders ekle', text: 'Derslerini ekledikten sonra haftalık ders saatlerini programa yerleştirebilirsin.', action: { label: 'Ders ekle', dataAction: 'add-course' } })}
    </section>

    ${courses.length ? html`
      <section class="section">
        <h2 class="section-title">Haftalık program</h2>
        <div class="card card--flat sched-card desktop-only">
          ${gridView(state)}
          <p class="xsmall muted sched-hint">Boş bir alana tıklayarak o saate ders ekleyebilirsin.</p>
        </div>
        <div class="card card--flat mobile-only">${mobileDayView(state, ui.day)}</div>
      </section>

      <section class="section">
        <div class="section-title">
          <span>Sınav takvimi <span class="count">${getUpcomingExams(state, todayKey()).length || ''}</span></span>
          <button type="button" class="btn btn--ghost btn--sm" data-action="add-exam">${icon('plus')} Sınav ekle</button>
        </div>
        ${examsView(state)}
      </section>

      <section class="section">
        <h2 class="section-title">Günlük boş zaman</h2>
        <div class="card card--flat">${freeTimeView(state)}</div>
      </section>` : ''}`;
}

function placeNowLine(root, state) {
  const line = root.querySelector('[data-now-line]');
  if (!line) return;
  const { startH, endH } = hourRange(state);
  const m = nowMinutes();
  if (m < startH * 60 || m > endH * 60) { line.hidden = true; return; }
  line.hidden = false;
  line.style.top = `${((m - startH * 60) / 60) * HOUR_PX}px`;
}

export default {
  title: 'Ders Programı',
  render(root) {
    const ui = { day: weekdayIndex(todayKey()) };
    const draw = () => {
      root.innerHTML = String(view(getState(), ui));
      placeNowLine(root, getState());
    };
    draw();
    const unsub = subscribe(draw);
    const timer = setInterval(() => placeNowLine(root, getState()), 60 * 1000);

    const offExams = bindExamActions(root);
    const offClick = delegate(root, 'click', '[data-action]', (e, el) => {
      const a = el.dataset.action;
      const state = getState();
      if (a === 'add-course') openCourseForm();
      else if (a === 'edit-course') openCourseForm({ course: getCourse(state, el.dataset.id) });
      else if (a === 'delete-course') confirmDeleteCourse(getCourse(state, el.dataset.id));
      else if (a === 'add-entry') openScheduleForm({ defaults: el.dataset.weekday ? { weekday: Number(el.dataset.weekday) } : {} });
      else if (a === 'edit-entry') {
        e.stopPropagation();
        const entry = state.schedule.find((x) => x.id === el.dataset.id);
        if (entry) openScheduleForm({ entry });
      } else if (a === 'pick-day') {
        ui.day = Number(el.dataset.day);
        draw();
      }
    });

    // Izgarada boş alana tıklama → o gün ve saatle (30 dk'ya yuvarlanmış) form
    const offGrid = delegate(root, 'click', '.sched-col', (e, col) => {
      if (e.target.closest('.sched-block')) return;
      const rect = col.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const startH = Number(col.dataset.startH);
      const minutes = startH * 60 + Math.floor(((y / HOUR_PX) * 60) / 30) * 30;
      openScheduleForm({ defaults: { weekday: Number(col.dataset.weekday), start: minutesToTime(minutes) } });
    });

    return () => { unsub(); offClick(); offGrid(); offExams(); clearInterval(timer); };
  },
};
