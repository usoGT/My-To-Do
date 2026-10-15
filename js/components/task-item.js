// Görev satırı + görev eylemlerinin ortak işleyicisi (her sayfada aynı davranış).
import { html, delegate } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getState } from '../store/store.js';
import { getCourse, getTask } from '../store/selectors.js';
import { toggleTask, deleteTask, restoreTask, moveTaskToDate } from '../store/actions/tasks.js';
import { formatDuration, formatRelativeDay, todayKey, diffDays } from '../lib/dates.js';
import { toast } from './toast.js';
import { openTaskForm } from './task-form.js';
import { runGlobalAction } from '../lib/global-actions.js';

// options: { showDate, moveToday, draggable, compact }
export function taskItem(state, task, options = {}) {
  const course = task.courseId ? getCourse(state, task.courseId) : null;
  const goal = task.goalId ? state.goals.find((g) => g.id === task.goalId) : null;
  const meta = [];
  if (options.showDate && task.date) meta.push(html`<span class="${task.date < todayKey() && !task.done ? 'overdue-date' : ''}">${formatRelativeDay(task.date)}</span>`);
  if (task.time) meta.push(html`<span class="row" style="gap:3px">${icon('clock')}${task.time}</span>`);
  if (task.estimateMin) meta.push(html`<span>${formatDuration(task.estimateMin)}</span>`);
  if (course) meta.push(html`<span class="badge badge--course c-${course.color}"><span class="truncate">${course.name}</span></span>`);
  if (goal) meta.push(html`<span class="badge">${icon('target')}<span class="truncate">${goal.title}</span></span>`);
  if (task.dueDate) {
    const left = diffDays(todayKey(), task.dueDate);
    const tone = task.done ? '' : left < 0 ? 'badge--danger' : left <= 1 ? 'badge--warning' : '';
    meta.push(html`<span class="badge ${tone}" title="Teslim tarihi">${icon('alert')}Teslim: ${formatRelativeDay(task.dueDate)}</span>`);
  }
  if (task.reminderAt && !task.done) meta.push(html`<span class="faint row" style="gap:3px" title="Hatırlatıcı: ${task.reminderAt.replace('T', ' ')}">${icon('bell')}${task.reminderSent ? '' : task.reminderAt.slice(11)}</span>`);
  if (task.notes) meta.push(html`<span class="faint" title="Notu var">${icon('note')}</span>`);

  return html`
    <li class="task ${task.done ? 'is-done' : ''} prio-${task.priority}" data-task-id="${task.id}" ${options.draggable && !task.done ? html`draggable="true"` : ''}>
      <button type="button" class="check" role="checkbox" aria-checked="${task.done}" data-action="toggle-task" data-id="${task.id}" aria-label="${task.done ? 'Tamamlanmadı olarak işaretle' : 'Tamamla'}: ${task.title}">${icon('check')}</button>
      <button type="button" class="task-body" data-action="edit-task" data-id="${task.id}">
        <span class="task-title">
          ${task.priority === 'high' ? html`<span class="prio-mark prio-mark--high" title="Yüksek öncelik">!</span>` : ''}
          ${task.title}
        </span>
        ${meta.length ? html`<span class="task-meta">${meta}</span>` : ''}
      </button>
      <div class="task-actions">
        ${options.moveToday && !task.done ? html`<button type="button" class="btn btn--sm" data-action="move-task-today" data-id="${task.id}">Bugüne taşı</button>` : ''}
        ${!task.done ? html`<button type="button" class="btn btn--ghost btn--icon btn--sm task-pomo" data-action="task-pomodoro" data-id="${task.id}" aria-label="Bu görevle Pomodoro başlat" title="Pomodoro başlat">${icon('timer')}</button>` : ''}
      </div>
    </li>`;
}

export const taskList = (state, tasks, options) => html`<ul class="task-list">${tasks.map((t) => taskItem(state, t, options))}</ul>`;

// Görev silme + "Geri al" toast'ı
export function deleteTaskWithUndo(id) {
  const removed = deleteTask(id);
  if (!removed) return;
  toast('Görev silindi', { action: { label: 'Geri al', onClick: () => restoreTask(removed) } });
}

// Kapsayıcıdaki tüm görev eylemlerini bağlar. Dinlemeyi bırakan fonksiyon döner.
export function bindTaskActions(root, { defaults = () => ({}) } = {}) {
  return delegate(root, 'click', '[data-action]', (e, el) => {
    const a = el.dataset.action;
    const id = el.dataset.id;
    if (a === 'toggle-task') {
      const done = toggleTask(id);
      if (done) {
        const again = root.querySelector(`[data-task-id="${CSS.escape(id)}"] .check`);
        if (again) again.classList.add('pop');
      }
    } else if (a === 'edit-task') {
      const task = getTask(getState(), id);
      if (task) openTaskForm({ task });
    } else if (a === 'move-task-today') {
      moveTaskToDate(id, todayKey());
      toast('Görev bugüne taşındı', { type: 'success', duration: 2000 });
    } else if (a === 'add-task') {
      openTaskForm({ defaults: { ...defaults(), ...(el.dataset.date ? { date: el.dataset.date } : {}), ...(el.dataset.time ? { time: el.dataset.time } : {}) } });
    } else if (a === 'task-pomodoro') {
      runGlobalAction('start-pomodoro', { taskId: id });
      location.hash = `#/pomodoro?gorev=${encodeURIComponent(id)}`;
    }
  });
}
