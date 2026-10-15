// Bugün sayfası: görevler, rutinler, dersler ve boş zaman tek ekranda.
import { html, delegate, qs } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getState, subscribe } from '../store/store.js';
import { getDayAgenda, getUndatedTasks, getOverdueTasks, getUpcomingDeadlines, getUpcomingExams, getCourse, examTitle } from '../store/selectors.js';
import { bindExamActions, countdownText } from '../components/exams.js';
import { moveTasksToDate } from '../store/actions/tasks.js';
import { taskList, bindTaskActions } from '../components/task-item.js';
import { bindRoutineChecks } from '../components/routine-check.js';
import { dayRoutinesView, dayTimelineView } from '../components/day-agenda.js';
import { emptyState } from '../components/empty-state.js';
import { toast } from '../components/toast.js';
import { bindQuickAdd, quickAddView } from '../components/quick-add.js';
import { todayKey, formatDateLong, greeting, formatDuration, nowMinutes, diffDays, toDateKey, formatRelativeDay } from '../lib/dates.js';

const nowInfo = () => ({ key: todayKey(), minutes: nowMinutes() });

function header(state, today) {
  const name = state.settings.name;
  const last = state.settings.lastBackupAt;
  const hasData = state.tasks.length + state.courses.length > 0;
  const backupAge = last ? diffDays(toDateKey(new Date(last)), today) : null;
  return html`
    <div class="page-header today-header">
      <div>
        <h1>${greeting()}${name ? `, ${name}` : ''}</h1>
        <p>${formatDateLong(today)}</p>
      </div>
      ${hasData && (backupAge === null || backupAge >= 7) ? html`
        <a class="badge badge--warning backup-reminder" href="#/ayarlar">${icon('download')} ${backupAge === null ? 'Henüz yedek almadın' : `En son ${backupAge} gün önce yedek aldın`}</a>` : ''}
    </div>`;
}

function statsView(a) {
  const { tasksDone, tasksTotal, routinesDone, routinesTotal, remainingFreeMinutes } = a.stats;
  const pct = (d, t) => (t ? Math.round((d / t) * 100) : 0);
  return html`
    <div class="stats today-stats">
      <div class="stat">
        <span class="stat-label">Görevler</span>
        <span class="stat-value">${tasksDone}<span class="stat-of">/${tasksTotal}</span></span>
        <div class="progress ${tasksTotal && tasksDone === tasksTotal ? 'progress--success' : ''}"><span style="width:${pct(tasksDone, tasksTotal)}%"></span></div>
      </div>
      <div class="stat">
        <span class="stat-label">Rutinler</span>
        <span class="stat-value">${routinesDone}<span class="stat-of">/${routinesTotal}</span></span>
        <div class="progress ${routinesTotal && routinesDone === routinesTotal ? 'progress--success' : ''}"><span style="width:${pct(routinesDone, routinesTotal)}%"></span></div>
      </div>
      <div class="stat">
        <span class="stat-label">Kalan boş zaman</span>
        <span class="stat-value">${formatDuration(remainingFreeMinutes)}</span>
        <span class="stat-sub">${a.classes.length ? `${a.classes.length} ders saati var` : 'Bugün ders yok'}</span>
      </div>
    </div>`;
}

function tasksColumn(state, a, today) {
  const undated = getUndatedTasks(state);
  const shown = new Set([...a.overdue, ...a.tasks].map((t) => t.id));
  const deadlines = getUpcomingDeadlines(state, today, 3).filter((t) => !shown.has(t.id));
  return html`
    ${a.overdue.length ? html`
      <section class="section">
        <div class="section-title section-title--warning">
          <span class="row">${icon('alert')} Gecikenler <span class="count">${a.overdue.length}</span></span>
          <button type="button" class="btn btn--sm" data-action="move-all-overdue">Tümünü bugüne taşı</button>
        </div>
        <div class="card card--tight">${taskList(state, a.overdue, { showDate: true, moveToday: true })}</div>
      </section>` : ''}

    ${deadlines.length ? html`
      <section class="section">
        <div class="section-title"><span class="row">${icon('alert')} Yaklaşan teslimler <span class="count">${deadlines.length}</span></span></div>
        <div class="card card--tight">${taskList(state, deadlines, { showDate: true })}</div>
      </section>` : ''}

    <section class="section">
      <div class="section-title">
        <span>Bugünün görevleri <span class="count">${a.tasks.length || ''}</span></span>
        <button type="button" class="btn btn--ghost btn--sm" data-action="add-task" data-date="${today}">${icon('plus')} Görev ekle</button>
      </div>
      ${a.tasks.length
        ? html`<div class="card card--tight">${taskList(state, a.tasks)}</div>`
        : emptyState({ icon: 'sun', title: 'Bugün için görev yok', text: 'Bir tane ekle ya da günün tadını çıkar.', compact: true })}
    </section>

    ${undated.length ? html`
      <section class="section">
        <details class="fold" ${undated.length <= 5 ? 'open' : ''} data-fold="undated">
          <summary>${icon('chevronRight')} Bir ara <span class="count">${undated.length}</span></summary>
          <div class="fold-body card card--tight">${taskList(state, undated)}</div>
        </details>
      </section>` : ''}`;
}

function examBanner(state, today) {
  const exams = getUpcomingExams(state, today, 14);
  if (!exams.length) return '';
  return html`
    <div class="exam-banner">
      ${exams.slice(0, 3).map((e) => {
        const c = getCourse(state, e.courseId);
        const days = diffDays(today, e.date);
        return html`
          <button type="button" class="exam-chip ${c ? `c-${c.color}` : ''}" data-action="edit-exam" data-id="${e.id}">
            <strong>${days > 1 ? days : countdownText(days)}</strong>
            <span class="grow">
              <span class="small truncate">${days > 1 ? 'gün kaldı · ' : ''}<b>${examTitle(state, e)}</b></span>
              <span class="xsmall muted">${formatRelativeDay(e.date)}${e.time ? ` ${e.time}` : ''}${e.room ? ` · ${e.room}` : ''}</span>
            </span>
          </button>`;
      })}
    </div>`;
}

function body(state) {
  const today = todayKey();
  const a = getDayAgenda(state, today, nowInfo());
  return html`
    ${statsView(a)}
    ${examBanner(state, today)}
    <div class="today-grid">
      <div class="today-col">${tasksColumn(state, a, today)}</div>
      <aside class="today-side">${dayRoutinesView(state, a, today, today)}${dayTimelineView(a, { dateKey: today, isToday: true })}</aside>
    </div>`;
}

export default {
  title: 'Bugün',
  render(root) {
    const state = getState();
    root.innerHTML = String(html`
      <div data-region="header">${header(state, todayKey())}</div>
      ${quickAddView({ placeholder: "Bugüne görev ekle ve Enter'a bas", id: 'today-quick-input' })}
      <div data-region="body">${body(state)}</div>`);

    // Hızlı ekleme kutusu yeniden çizilmesin diye sadece bölgeler yenilenir.
    const draw = (s) => {
      const fold = qs('[data-fold="undated"]', root);
      const foldOpen = fold ? fold.open : null;
      qs('[data-region="header"]', root).innerHTML = String(header(s, todayKey()));
      qs('[data-region="body"]', root).innerHTML = String(body(s));
      const fold2 = qs('[data-fold="undated"]', root);
      if (fold2 && foldOpen !== null) fold2.open = foldOpen;
    };
    const unsub = subscribe(draw);
    const timer = setInterval(() => draw(getState()), 60 * 1000);

    const offTasks = bindTaskActions(root, { defaults: () => ({ date: todayKey() }) });
    const offRoutines = bindRoutineChecks(root, todayKey);
    const offExams = bindExamActions(root);
    const offQuick = bindQuickAdd(root, { defaultDate: todayKey });
    const offPage = delegate(root, 'click', '[data-action="move-all-overdue"]', () => {
      const ids = getOverdueTasks(getState(), todayKey()).map((t) => t.id);
      moveTasksToDate(ids, todayKey());
      toast(`${ids.length} görev bugüne taşındı`, { type: 'success' });
    });

    return () => { unsub(); clearInterval(timer); offTasks(); offRoutines(); offExams(); offQuick(); offPage(); };
  },
};
