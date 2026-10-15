// Planlayıcı: gün, ay (takvim) ve yıl (ısı haritası) görünümleri; aylık/yıllık hedefler.
// Adres: #/planlayici?view=gun|ay|yil&date=YYYY-MM-DD
import { html, delegate, qs } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getState, subscribe } from '../store/store.js';
import { getDayAgenda, getClassesForDate, getGoalsFor, buildActivityIndex, getYearSummary, getCourse, getExamsForDate, examTitle } from '../store/selectors.js';
import { examItem, bindExamActions } from '../components/exams.js';

const EXAM_SHORT = { vize: 'Vize', final: 'Final', quiz: 'Quiz', butunleme: 'Büt', proje: 'Proje' };
import { moveTaskToDate } from '../store/actions/tasks.js';
import { taskList, bindTaskActions } from '../components/task-item.js';
import { bindRoutineChecks } from '../components/routine-check.js';
import { dayRoutinesView, dayTimelineView } from '../components/day-agenda.js';
import { goalsPanel, bindGoalActions } from '../components/goals.js';
import { heatmapView } from '../components/heatmap.js';
import { emptyState } from '../components/empty-state.js';
import { toast } from '../components/toast.js';
import { updateQuery } from '../router.js';
import {
  todayKey, isValidDateKey, addDays, monthKey, yearKey, addMonths, monthGrid, parseDate, formatDateLong,
  formatMonthYear, formatDuration, nowMinutes, WEEKDAYS_SHORT_TR, MONTHS_TR, formatRelativeDay,
} from '../lib/dates.js';

const VIEWS = { gun: 'Gün', ay: 'Ay', yil: 'Yıl' };

function periodTitle(ui) {
  if (ui.view === 'gun') return formatDateLong(ui.date);
  if (ui.view === 'ay') return formatMonthYear(monthKey(ui.date));
  return yearKey(ui.date);
}

function toolbar(ui) {
  return html`
    <div class="planner-toolbar">
      <div class="segmented" role="group" aria-label="Görünüm">
        ${Object.entries(VIEWS).map(([k, label]) => html`<button type="button" data-action="set-view" data-view="${k}" aria-pressed="${ui.view === k}">${label}</button>`)}
      </div>
      <div class="row planner-nav">
        <button type="button" class="btn btn--icon btn--sm" data-action="prev" aria-label="Önceki">${icon('chevronLeft')}</button>
        <h2 class="planner-title">${periodTitle(ui)}</h2>
        <button type="button" class="btn btn--icon btn--sm" data-action="next" aria-label="Sonraki">${icon('chevronRight')}</button>
      </div>
      <button type="button" class="btn btn--sm" data-action="today">Bugün</button>
    </div>`;
}

// ---------- Gün ----------
function dayView(state, ui) {
  const today = todayKey();
  const key = ui.date;
  const a = getDayAgenda(state, key, { key: today, minutes: nowMinutes() });
  return html`
    <div class="today-grid">
      <div class="today-col">
        ${a.overdue.length ? html`
          <section class="section">
            <div class="section-title section-title--warning"><span class="row">${icon('alert')} Gecikenler <span class="count">${a.overdue.length}</span></span></div>
            <div class="card card--tight">${taskList(state, a.overdue, { showDate: true, moveToday: true })}</div>
          </section>` : ''}
        ${getExamsForDate(state, key).length ? html`
          <section class="section">
            <div class="section-title"><span>Sınavlar</span></div>
            <ul class="card card--tight exam-list">${getExamsForDate(state, key).map((e) => examItem(state, e))}</ul>
          </section>` : ''}
        <section class="section">
          <div class="section-title">
            <span>${formatRelativeDay(key, today)} · Görevler <span class="count">${a.tasks.length || ''}</span></span>
            <button type="button" class="btn btn--ghost btn--sm" data-action="add-task" data-date="${key}">${icon('plus')} Görev ekle</button>
          </div>
          ${a.tasks.length
            ? html`<div class="card card--tight">${taskList(state, a.tasks)}</div>`
            : emptyState({ icon: 'calendar', title: 'Bu gün için görev yok', compact: true, action: { label: 'Görev ekle', dataAction: 'add-task' } })}
        </section>
      </div>
      <aside class="today-side">
        ${dayRoutinesView(state, a, key, today)}
        ${dayTimelineView(a, { dateKey: key, isToday: key === today, isPast: key < today })}
      </aside>
    </div>`;
}

// ---------- Ay ----------
function monthView(state, ui, compact) {
  const today = todayKey();
  const mKey = monthKey(ui.date);
  const grid = monthGrid(mKey);
  const byDate = new Map();
  for (const t of state.tasks) {
    if (!t.date) continue;
    if (!byDate.has(t.date)) byDate.set(t.date, []);
    byDate.get(t.date).push(t);
  }
  for (const list of byDate.values()) list.sort((a, b) => (a.done === b.done ? (a.time || '99').localeCompare(b.time || '99') : a.done ? 1 : -1));
  const goals = getGoalsFor(state, 'month', mKey);
  const selected = ui.date;
  const selTasks = byDate.get(selected) || [];

  return html`
    <div class="planner-month-layout">
      <div>
        <div class="month-grid" role="grid" aria-label="${formatMonthYear(mKey)}">
          ${WEEKDAYS_SHORT_TR.map((d) => html`<div class="month-head" role="columnheader">${d}</div>`)}
          ${grid.map(({ key, inMonth }) => {
            const tasks = byDate.get(key) || [];
            const classes = getClassesForDate(state, key);
            const open = tasks.filter((t) => !t.done).length;
            return html`
              <div class="month-cell ${inMonth ? '' : 'is-out'} ${key === today ? 'is-today' : ''} ${key === selected ? 'is-selected' : ''}" role="gridcell" data-drop-date="${key}">
                <div class="month-cell-top">
                  <button type="button" class="month-day" data-action="pick-date" data-date="${key}" aria-label="${formatDateLong(key)}">${parseDate(key).getDate()}</button>
                  <button type="button" class="btn btn--ghost btn--icon btn--sm month-add" data-action="add-task" data-date="${key}" aria-label="${formatDateLong(key)} için görev ekle">${icon('plus')}</button>
                </div>
                ${getExamsForDate(state, key).map((ex) => html`<button type="button" class="month-exam" data-action="edit-exam" data-id="${ex.id}" title="${examTitle(state, ex)}">${EXAM_SHORT[ex.type] || 'Sınav'} · ${getCourse(state, ex.courseId)?.name || ''}</button>`)}
                ${classes.length ? html`<div class="month-classes" title="${classes.map((c) => c.course.name).join(', ')}">${classes.map((c) => html`<span class="c-${c.course.color}"></span>`)}</div>` : ''}
                ${compact
                  ? html`${tasks.length ? html`<div class="month-dots">${tasks.slice(0, 4).map((t) => html`<span class="${t.done ? 'done' : ''}"></span>`)}</div>` : ''}`
                  : html`
                    <ul class="month-tasks">
                      ${tasks.slice(0, 3).map((t) => {
                        const c = t.courseId ? getCourse(state, t.courseId) : null;
                        return html`<li class="month-task ${t.done ? 'is-done' : ''} ${c ? `c-${c.color}` : ''}" draggable="${t.done ? 'false' : 'true'}" data-task-id="${t.id}">
                          <button type="button" data-action="edit-task" data-id="${t.id}"><span class="dot"></span><span class="truncate">${t.time ? `${t.time} ` : ''}${t.title}</span></button>
                        </li>`;
                      })}
                      ${tasks.length > 3 ? html`<li><button type="button" class="month-more" data-action="pick-date" data-date="${key}">+${tasks.length - 3} daha</button></li>` : ''}
                    </ul>`}
                ${open && compact ? html`<span class="visually-hidden">${open} açık görev</span>` : ''}
              </div>`;
          })}
        </div>
        <p class="xsmall muted month-hint">Görevleri sürükleyip başka bir güne bırakabilirsin. Bir güne tıklayınca ayrıntısı açılır.</p>
        <section class="section month-selected">
          <div class="section-title">
            <span>${formatDateLong(selected)}</span>
            <button type="button" class="btn btn--ghost btn--sm" data-action="open-day" data-date="${selected}">Gün görünümü ${icon('arrowRight')}</button>
          </div>
          <div class="card card--tight">
            ${selTasks.length ? taskList(state, selTasks) : html`<p class="small muted goal-empty">Bu gün için görev yok.</p>`}
            <button type="button" class="btn btn--ghost btn--sm" data-action="add-task" data-date="${selected}" style="margin-top:4px">${icon('plus')} Görev ekle</button>
          </div>
        </section>
      </div>
      <aside>${goalsPanel(state, goals, { period: 'month', periodKey: mKey, title: `${MONTHS_TR[Number(mKey.slice(5)) - 1]} hedefleri` })}</aside>
    </div>`;
}

// ---------- Yıl ----------
function yearView(state, ui) {
  const yKey = yearKey(ui.date);
  const idx = buildActivityIndex(state);
  const sum = getYearSummary(state, yKey, idx);
  const goals = getGoalsFor(state, 'year', yKey);
  const monthGoals = Array.from({ length: 12 }, (_, i) => {
    const list = getGoalsFor(state, 'month', `${yKey}-${String(i + 1).padStart(2, '0')}`);
    return { total: list.length, done: list.filter((g) => g.done).length };
  });
  return html`
    <div class="stats year-stats">
      <div class="stat"><span class="stat-label">Tamamlanan görev</span><span class="stat-value">${sum.tasks}</span></div>
      <div class="stat"><span class="stat-label">Toplam odak</span><span class="stat-value">${formatDuration(sum.focusMin)}</span></div>
      <div class="stat"><span class="stat-label">En uzun aktif seri</span><span class="stat-value">${sum.longestStreak} gün</span></div>
      <div class="stat"><span class="stat-label">En verimli ay</span><span class="stat-value">${sum.bestMonth === null ? '—' : MONTHS_TR[sum.bestMonth]}</span></div>
    </div>
    <section class="section">
      <h2 class="section-title">Etkinlik</h2>
      <div class="card card--tight">${heatmapView(yKey, idx)}</div>
    </section>
    <div class="planner-year-bottom">
      ${goalsPanel(state, goals, { period: 'year', periodKey: yKey, title: `${yKey} hedefleri` })}
      <section class="section">
        <h2 class="section-title">Aylık hedefler</h2>
        <div class="card card--tight month-goal-bars">
          ${monthGoals.map((m, i) => html`
            <button type="button" class="month-goal-row" data-action="open-month" data-date="${yKey}-${String(i + 1).padStart(2, '0')}-01">
              <span class="small">${MONTHS_TR[i]}</span>
              <span class="progress"><span style="width:${m.total ? Math.round((m.done / m.total) * 100) : 0}%"></span></span>
              <span class="xsmall muted nowrap">${m.total ? `${m.done}/${m.total}` : '—'}</span>
            </button>`)}
        </div>
      </section>
    </div>`;
}

function view(state, ui) {
  const compact = window.matchMedia('(max-width: 767px)').matches;
  return html`
    <div class="page-header">
      <div><h1>Planlayıcı</h1><p>Günlerini, aylarını ve yılını planla.</p></div>
    </div>
    ${toolbar(ui)}
    <div class="planner-body">
      ${ui.view === 'gun' ? dayView(state, ui) : ui.view === 'yil' ? yearView(state, ui) : monthView(state, ui, compact)}
    </div>`;
}

function readUi(query) {
  const view = VIEWS[query.view] ? query.view : 'ay';
  const date = isValidDateKey(query.date) ? query.date : todayKey();
  return { view, date };
}

export default {
  title: 'Planlayıcı',
  render(root, { query }) {
    const ui = readUi(query);
    const draw = () => {
      const y = window.scrollY;
      root.innerHTML = String(view(getState(), ui));
      window.scrollTo(0, y);
    };
    const go = (patch) => {
      Object.assign(ui, patch);
      updateQuery({ view: ui.view, date: ui.date });
      draw();
    };
    draw();
    const unsub = subscribe(draw);
    const mq = window.matchMedia('(max-width: 767px)');
    mq.addEventListener('change', draw);

    const offTasks = bindTaskActions(root, { defaults: () => ({ date: ui.date }) });
    const offRoutines = bindRoutineChecks(root, todayKey);
    const offGoals = bindGoalActions(root);
    const offExams = bindExamActions(root);
    const offNav = delegate(root, 'click', '[data-action]', (e, el) => {
      const a = el.dataset.action;
      if (a === 'set-view') go({ view: el.dataset.view });
      else if (a === 'today') go({ date: todayKey() });
      else if (a === 'prev' || a === 'next') {
        const dir = a === 'prev' ? -1 : 1;
        if (ui.view === 'gun') go({ date: addDays(ui.date, dir) });
        else if (ui.view === 'ay') go({ date: `${addMonths(monthKey(ui.date), dir)}-01` });
        else go({ date: `${Number(yearKey(ui.date)) + dir}-01-01` });
      } else if (a === 'pick-date') {
        if (window.matchMedia('(max-width: 767px)').matches || ui.date !== el.dataset.date) go({ date: el.dataset.date });
        else go({ view: 'gun', date: el.dataset.date });
      } else if (a === 'open-day') go({ view: 'gun', date: el.dataset.date });
      else if (a === 'open-month') go({ view: 'ay', date: el.dataset.date });
    });

    // Isı haritasında güne tıklama
    const offHeat = delegate(root, 'click', '.hm-cell', (e, el) => go({ view: 'gun', date: el.getAttribute('data-date') }));

    // Ay görünümünde sürükle-bırak
    let dragId = null;
    const onDragStart = (e) => {
      const li = e.target.closest('[data-task-id][draggable="true"]');
      if (!li) return;
      dragId = li.dataset.taskId;
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragId);
    };
    const onDragOver = (e) => {
      const cell = e.target.closest('[data-drop-date]');
      if (!cell || !dragId) return;
      e.preventDefault();
      qs('.drop-target', root)?.classList.remove('drop-target');
      cell.classList.add('drop-target');
    };
    const onDrop = (e) => {
      const cell = e.target.closest('[data-drop-date]');
      if (!cell || !dragId) return;
      e.preventDefault();
      const id = dragId;
      dragId = null;
      const task = getState().tasks.find((t) => t.id === id);
      if (task && task.date !== cell.dataset.dropDate) {
        moveTaskToDate(id, cell.dataset.dropDate);
        toast(`Görev ${formatRelativeDay(cell.dataset.dropDate)} gününe taşındı`, { type: 'success', duration: 2000 });
      } else draw();
    };
    const onDragEnd = () => { dragId = null; qs('.drop-target', root)?.classList.remove('drop-target'); qs('.dragging', root)?.classList.remove('dragging'); };
    root.addEventListener('dragstart', onDragStart);
    root.addEventListener('dragover', onDragOver);
    root.addEventListener('drop', onDrop);
    root.addEventListener('dragend', onDragEnd);

    return () => {
      unsub(); mq.removeEventListener('change', draw);
      offTasks(); offRoutines(); offGoals(); offExams(); offNav(); offHeat();
      root.removeEventListener('dragstart', onDragStart);
      root.removeEventListener('dragover', onDragOver);
      root.removeEventListener('drop', onDrop);
      root.removeEventListener('dragend', onDragEnd);
    };
  },
};
