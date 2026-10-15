// Pomodoro: dairesel sayaç, göreve/derse bağlama, bugünün sayaçları, haftalık grafik, ders dağılımı, son seanslar.
// Adres: #/pomodoro?gorev=<id>&ders=<id>
import { html, delegate, qs } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getState, subscribe } from '../store/store.js';
import { getTasksForDate, getOverdueTasks, getCoursesSorted, getCourse, getWeeklyFocus, getDayFocus, getFocusByCourse } from '../store/selectors.js';
import { toggleTask } from '../store/actions/tasks.js';
import { deletePomodoroSession } from '../store/actions/pomodoro.js';
import * as timer from '../lib/timer.js';
import { unlockAudio } from '../lib/alerts.js';
import { isCapacitor as isNativeApp } from '../lib/platform.js';
import { barChart } from '../components/bar-chart.js';
import { toast } from '../components/toast.js';
import { confirmDialog } from '../components/confirm.js';
import { todayKey, startOfWeek, addDays, weekdayIndex, WEEKDAYS_SHORT_TR, formatDuration, formatDateShort, formatRelativeDay, formatClockTime, toDateKey } from '../lib/dates.js';

const R = 110;
const CIRC = 2 * Math.PI * R;

function ringView(t) {
  const progress = t.total ? 1 - t.remaining / t.total : 0;
  return html`
    <div class="pomo-ring mode-${t.mode}">
      <svg viewBox="0 0 260 260" aria-hidden="true">
        <circle cx="130" cy="130" r="${R}" class="pomo-ring-bg"/>
        <circle cx="130" cy="130" r="${R}" class="pomo-ring-fg" data-ring stroke-dasharray="${CIRC.toFixed(2)}" stroke-dashoffset="${(CIRC * (1 - progress)).toFixed(2)}" transform="rotate(-90 130 130)"/>
      </svg>
      <div class="pomo-ring-text">
        <span class="pomo-clock" data-clock role="timer" aria-live="off">${timer.formatClock(t.remaining)}</span>
        <span class="pomo-mode">${timer.MODE_LABELS[t.mode]}</span>
      </div>
    </div>`;
}

function targetView(state, t) {
  const today = todayKey();
  const tasks = [...getOverdueTasks(state, today), ...getTasksForDate(state, today)].filter((x) => !x.done);
  const current = t.taskId ? state.tasks.find((x) => x.id === t.taskId) : null;
  if (current && !tasks.some((x) => x.id === current.id)) tasks.unshift(current);
  const value = t.taskId ? `t:${t.taskId}` : t.courseId ? `c:${t.courseId}` : '';
  return html`
    <div class="field pomo-target">
      <label for="pomo-target">Ne üzerinde çalışıyorsun?</label>
      <select class="select" id="pomo-target" ${t.running ? 'disabled' : ''}>
        <option value="">Hiçbiri</option>
        ${tasks.length ? html`<optgroup label="Görevler">${tasks.map((x) => html`<option value="t:${x.id}" ${value === `t:${x.id}` ? 'selected' : ''}>${x.title}</option>`)}</optgroup>` : ''}
        ${state.courses.length ? html`<optgroup label="Sadece ders">${getCoursesSorted(state).map((c) => html`<option value="c:${c.id}" ${value === `c:${c.id}` ? 'selected' : ''}>${c.name}</option>`)}</optgroup>` : ''}
      </select>
      ${t.running ? html`<span class="field-hint">Sayaç çalışırken değiştirilemez.</span>` : ''}
    </div>
    ${current && !current.done ? html`<button type="button" class="btn btn--sm" data-action="complete-task">${icon('check')} "${current.title}" görevini tamamla</button>` : ''}`;
}

function timerCard(state, t) {
  const p = state.settings.pomodoro;
  const started = t.remainingMs !== null && t.remaining < t.total;
  const dots = Array.from({ length: p.longBreakEvery }, (_, i) => i < (t.completedFocusCount % p.longBreakEvery || (t.completedFocusCount && t.mode === 'long' ? p.longBreakEvery : 0)));
  return html`
    <div class="card pomo-card">
      <div class="segmented pomo-modes" role="group" aria-label="Mod">
        ${Object.entries(timer.MODE_LABELS).map(([k, label]) => html`<button type="button" data-action="mode" data-mode="${k}" aria-pressed="${t.mode === k}">${label}</button>`)}
      </div>
      ${ringView(t)}
      <div class="pomo-controls">
        ${t.running
          ? html`<button type="button" class="btn btn--primary pomo-main" data-action="pause">${icon('pause')} Duraklat</button>`
          : html`<button type="button" class="btn btn--primary pomo-main" data-action="start">${icon('play')} ${started ? 'Devam' : 'Başlat'}</button>`}
        <button type="button" class="btn btn--icon" data-action="reset" aria-label="Sıfırla" title="Sıfırla" ${started ? '' : 'disabled'}>${icon('reset')}</button>
        <button type="button" class="btn btn--icon" data-action="skip" aria-label="Atla" title="Atla (kaydetmeden sonraki moda geç)">${icon('skip')}</button>
        ${t.mode === 'focus' && started ? html`<button type="button" class="btn" data-action="finish-early" title="Geçen süreyi kaydet (en az 5 dk)">${icon('stop')} Erken bitir</button>` : ''}
      </div>
      <div class="pomo-cycle" aria-label="Döngü: ${t.completedFocusCount % p.longBreakEvery} / ${p.longBreakEvery}">
        ${dots.map((on) => html`<span class="${on ? 'on' : ''}"></span>`)}
        <span class="xsmall muted">${p.longBreakEvery} odakta bir uzun mola</span>
      </div>
      <div class="pomo-target-wrap">${targetView(state, t)}</div>
      ${!isNativeApp && 'Notification' in window && Notification.permission === 'default' ? html`
        <p class="xsmall muted">Süre bitince bildirim almak için <button type="button" class="link-btn" data-action="ask-notif">bildirimlere izin ver</button>.</p>` : ''}
    </div>`;
}

function statsView(state, ui) {
  const today = todayKey();
  const tf = getDayFocus(state, today);
  const week = getWeeklyFocus(state, ui.weekStart);
  const weekTotal = week.reduce((s, d) => s + d.minutes, 0);
  const dist = getFocusByCourse(state, ui.weekStart, addDays(ui.weekStart, 6));
  const maxDist = Math.max(1, ...dist.map((d) => d.minutes));
  const recent = [...state.pomodoroSessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 8);
  const isThisWeek = ui.weekStart === startOfWeek(today);
  return html`
    <div class="stats pomo-stats">
      <div class="stat"><span class="stat-label">Bugün</span><span class="stat-value">${tf.count} seans</span><span class="stat-sub">${formatDuration(tf.minutes)} odak</span></div>
      <div class="stat"><span class="stat-label">${isThisWeek ? 'Bu hafta' : 'Seçili hafta'}</span><span class="stat-value">${formatDuration(weekTotal)}</span><span class="stat-sub">günde ort. ${formatDuration(Math.round(weekTotal / 7))}</span></div>
    </div>

    <section class="section">
      <div class="section-title">
        <span>Haftalık odak (dk)</span>
        <span class="row">
          <button type="button" class="btn btn--ghost btn--icon btn--sm" data-action="week-prev" aria-label="Önceki hafta">${icon('chevronLeft')}</button>
          <span class="xsmall" style="text-transform:none;letter-spacing:0">${formatDateShort(ui.weekStart)} – ${formatDateShort(addDays(ui.weekStart, 6))}</span>
          <button type="button" class="btn btn--ghost btn--icon btn--sm" data-action="week-next" aria-label="Sonraki hafta" ${isThisWeek ? 'disabled' : ''}>${icon('chevronRight')}</button>
        </span>
      </div>
      <div class="card card--tight">
        ${barChart(week.map((d) => ({ label: WEEKDAYS_SHORT_TR[weekdayIndex(d.key)], value: d.minutes, highlight: d.key === today, title: `${formatRelativeDay(d.key)}: ${formatDuration(d.minutes)}` })), { ariaLabel: 'Haftalık odak dakikaları' })}
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Derslere göre</h2>
      <div class="card card--tight">
        ${dist.length ? html`<ul class="dist-list">${dist.map((d) => html`
          <li class="${d.course ? `c-${d.course.color}` : ''}">
            <span class="truncate">${d.course ? d.course.name : 'Ders seçilmeden'}</span>
            <span class="dist-bar"><span style="width:${Math.round((d.minutes / maxDist) * 100)}%"></span></span>
            <span class="xsmall muted nowrap">${formatDuration(d.minutes)}</span>
          </li>`)}</ul>` : html`<p class="small muted goal-empty">Bu hafta odak seansı yok.</p>`}
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Son seanslar</h2>
      <div class="card card--tight">
        ${recent.length ? html`<ul class="session-list">${recent.map((p) => {
          const task = p.taskId ? state.tasks.find((x) => x.id === p.taskId) : null;
          const course = p.courseId ? getCourse(state, p.courseId) : task?.courseId ? getCourse(state, task.courseId) : null;
          return html`
            <li>
              <span class="session-when"><strong>${formatRelativeDay(toDateKey(new Date(p.startedAt)))}</strong> <span class="muted">${formatClockTime(p.startedAt)}</span></span>
              <span class="grow truncate">${task ? task.title : course ? course.name : 'Serbest çalışma'}</span>
              ${course ? html`<span class="badge badge--course c-${course.color}"><span class="truncate">${course.name}</span></span>` : ''}
              <span class="small nowrap">${p.durationMin} dk</span>
              <button type="button" class="btn btn--ghost btn--icon btn--sm" data-action="del-session" data-id="${p.id}" aria-label="Seansı sil">${icon('trash')}</button>
            </li>`;
        })}</ul>` : html`<p class="small muted goal-empty">Henüz seans yok. İlk odak seansını başlat!</p>`}
      </div>
    </section>`;
}

function view(state, ui) {
  const t = timer.getTimer();
  return html`
    <div class="page-header"><div><h1>Pomodoro</h1><p>Odaklan, mola ver, ilerlemeni gör.</p></div></div>
    <div class="pomo-layout">
      <div data-region="timer">${timerCard(state, t)}</div>
      <div data-region="stats">${statsView(state, ui)}</div>
    </div>`;
}

export default {
  title: 'Pomodoro',
  render(root, { query }) {
    const ui = { weekStart: startOfWeek(todayKey()) };
    const st = getState();
    const t0 = timer.getTimer();
    if (!t0.running) {
      const task = query.gorev ? st.tasks.find((x) => x.id === query.gorev) : null;
      const course = query.ders ? st.courses.find((c) => c.id === query.ders) : null;
      if (task) timer.setTarget({ taskId: task.id, courseId: task.courseId });
      else if (course) timer.setTarget({ taskId: null, courseId: course.id });
    }

    const drawAll = () => { root.innerHTML = String(view(getState(), ui)); };
    const drawTimer = () => { const r = qs('[data-region="timer"]', root); if (r) r.innerHTML = String(timerCard(getState(), timer.getTimer())); };
    const drawStats = () => { const r = qs('[data-region="stats"]', root); if (r) r.innerHTML = String(statsView(getState(), ui)); };
    drawAll();

    // Her tikte sadece saat ve halka güncellenir.
    let lastSig = '';
    const sig = (t) => `${t.mode}|${t.running}|${t.remainingMs === null}|${t.taskId}|${t.courseId}|${t.completedFocusCount}|${t.total}`;
    lastSig = sig(timer.getTimer());
    const unsubTimer = timer.subscribeTimer((t, kind) => {
      const s = sig(t);
      if (kind !== 'tick' || s !== lastSig) { lastSig = s; drawTimer(); return; }
      const clock = qs('[data-clock]', root);
      const ring = qs('[data-ring]', root);
      if (clock) clock.textContent = timer.formatClock(t.remaining);
      if (ring) ring.setAttribute('stroke-dashoffset', (CIRC * (t.remaining / t.total)).toFixed(2));
    });
    const unsub = subscribe(() => { drawStats(); drawTimer(); });

    const offClick = delegate(root, 'click', '[data-action]', async (e, el) => {
      const a = el.dataset.action;
      if (a === 'start') { unlockAudio(); timer.start(); }
      else if (a === 'pause') timer.pause();
      else if (a === 'reset') timer.reset();
      else if (a === 'skip') timer.skip();
      else if (a === 'mode') {
        const t = timer.getTimer();
        if (t.running && !(await confirmDialog({ title: 'Sayaç durdurulsun mu?', message: 'Çalışan sayaç sıfırlanacak ve bu süre kaydedilmeyecek.', confirmText: 'Durdur ve değiştir' }))) return;
        timer.setMode(el.dataset.mode);
      } else if (a === 'finish-early') {
        const min = timer.finishEarly();
        toast(min ? `${min} dakikalık seans kaydedildi.` : 'Seans 5 dakikadan kısa olduğu için kaydedilmedi.', { type: min ? 'success' : 'info' });
      } else if (a === 'complete-task') {
        const t = timer.getTimer();
        if (t.taskId) { toggleTask(t.taskId, true); toast('Görev tamamlandı', { type: 'success' }); }
      } else if (a === 'ask-notif') {
        await Notification.requestPermission();
        drawTimer();
      } else if (a === 'week-prev') { ui.weekStart = addDays(ui.weekStart, -7); drawStats(); }
      else if (a === 'week-next') { ui.weekStart = addDays(ui.weekStart, 7); drawStats(); }
      else if (a === 'del-session') {
        if (await confirmDialog({ title: 'Seans silinsin mi?', message: 'Yanlış kaydedilen seansları silebilirsin.', confirmText: 'Sil', danger: true })) {
          deletePomodoroSession(el.dataset.id);
        }
      }
    });
    const offChange = delegate(root, 'change', '#pomo-target', (e, el) => {
      const v = el.value;
      if (v.startsWith('t:')) {
        const task = getState().tasks.find((x) => x.id === v.slice(2));
        timer.setTarget({ taskId: task?.id, courseId: task?.courseId });
      } else if (v.startsWith('c:')) timer.setTarget({ taskId: null, courseId: v.slice(2) });
      else timer.setTarget({});
    });

    return () => { unsubTimer(); unsub(); offClick(); offChange(); };
  },
};
