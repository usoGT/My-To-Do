// Görev eylemleri
import { update, getState } from '../store.js';
import { createId, nowIso } from '../../lib/ids.js';
import { fail } from '../../lib/errors.js';
import { isValidDateKey, isValidTime } from '../../lib/dates.js';

export const PRIORITIES = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' };

function clean(input, state) {
  const title = String(input.title ?? '').trim().replace(/\s+/g, ' ');
  if (!title) fail('Görev başlığı boş olamaz.', 'title');
  if (title.length > 200) fail('Başlık en fazla 200 karakter olabilir.', 'title');

  const date = input.date ? String(input.date) : null;
  if (date && !isValidDateKey(date)) fail('Tarih geçersiz.', 'date');
  const time = input.time ? String(input.time) : null;
  if (time && !isValidTime(time)) fail('Saat geçersiz.', 'time');
  if (time && !date) fail('Saat seçmek için önce tarih seç.', 'time');

  let estimateMin = input.estimateMin === '' || input.estimateMin == null ? null : Number(input.estimateMin);
  if (estimateMin !== null && (!Number.isInteger(estimateMin) || estimateMin < 5 || estimateMin > 600)) {
    fail('Tahmini süre 5–600 dakika arasında olmalı.', 'estimateMin');
  }

  const dueDate = input.dueDate ? String(input.dueDate) : null;
  if (dueDate && !isValidDateKey(dueDate)) fail('Teslim tarihi geçersiz.', 'dueDate');
  const reminderAt = input.reminderAt ? String(input.reminderAt).slice(0, 16) : null;
  if (reminderAt && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(reminderAt) || !isValidDateKey(reminderAt.slice(0, 10)) || !isValidTime(reminderAt.slice(11)))) {
    fail('Hatırlatıcı zamanı geçersiz.', 'reminderAt');
  }

  const courseId = input.courseId || null;
  if (courseId && !state.courses.some((c) => c.id === courseId)) fail('Seçilen ders bulunamadı.', 'courseId');
  const goalId = input.goalId || null;
  if (goalId && !state.goals.some((g) => g.id === goalId)) fail('Seçilen hedef bulunamadı.', 'goalId');

  return {
    title,
    notes: String(input.notes ?? '').trim().slice(0, 5000),
    date,
    time,
    estimateMin,
    courseId,
    goalId,
    priority: PRIORITIES[input.priority] ? input.priority : 'medium',
    dueDate,
    reminderAt,
  };
}

const nextOrder = (tasks, date) => tasks.filter((t) => t.date === date).reduce((m, t) => Math.max(m, t.order || 0), 0) + 1;

export function addTask(input) {
  const state = getState();
  const c = clean(input, state);
  const task = { id: createId(), ...c, reminderSent: false, done: false, doneAt: null, createdAt: nowIso(), order: nextOrder(state.tasks, c.date) };
  update('tasks/add', (s) => { s.tasks.push(task); });
  return task;
}

export function updateTask(id, input) {
  const state = getState();
  const existing = state.tasks.find((t) => t.id === id);
  if (!existing) fail('Görev bulunamadı.');
  const c = clean({ ...existing, ...input }, state);
  update('tasks/update', (s) => {
    const t = s.tasks.find((x) => x.id === id);
    if (t.date !== c.date) t.order = nextOrder(s.tasks, c.date);
    if (t.reminderAt !== c.reminderAt) t.reminderSent = false;
    Object.assign(t, c);
  });
}

export function toggleTask(id, done = null) {
  let result = false;
  update('tasks/toggle', (s) => {
    const t = s.tasks.find((x) => x.id === id);
    if (!t) return;
    t.done = done === null ? !t.done : Boolean(done);
    t.doneAt = t.done ? nowIso() : null;
    result = t.done;
  });
  return result;
}

// Silinen görevi ve bağlı Pomodoro seanslarının id'lerini döndürür (geri almak için).
export function deleteTask(id) {
  const state = getState();
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return null;
  const sessionIds = state.pomodoroSessions.filter((p) => p.taskId === id).map((p) => p.id);
  update('tasks/delete', (s) => {
    s.tasks = s.tasks.filter((t) => t.id !== id);
    for (const p of s.pomodoroSessions) if (p.taskId === id) p.taskId = null;
  });
  return { task: structuredClone(task), sessionIds };
}

export function restoreTask({ task, sessionIds = [] }) {
  update('tasks/restore', (s) => {
    if (s.tasks.some((t) => t.id === task.id)) return;
    const t = { ...task };
    if (t.courseId && !s.courses.some((c) => c.id === t.courseId)) t.courseId = null;
    if (t.goalId && !s.goals.some((g) => g.id === t.goalId)) t.goalId = null;
    s.tasks.push(t);
    for (const p of s.pomodoroSessions) if (sessionIds.includes(p.id)) p.taskId = t.id;
  });
}

export function moveTaskToDate(id, dateKey) {
  moveTasksToDate([id], dateKey);
}

export function moveTasksToDate(ids, dateKey) {
  if (dateKey !== null && !isValidDateKey(dateKey)) fail('Tarih geçersiz.');
  update('tasks/move', (s) => {
    let order = nextOrder(s.tasks, dateKey);
    for (const t of s.tasks) {
      if (!ids.includes(t.id)) continue;
      t.date = dateKey;
      if (!dateKey) t.time = null;
      t.order = order++;
    }
  });
}

// Bir günün görevlerini verilen id sırasına koyar.
export function reorderTasks(ids) {
  update('tasks/reorder', (s) => {
    ids.forEach((id, i) => {
      const t = s.tasks.find((x) => x.id === id);
      if (t) t.order = i + 1;
    });
  });
}

export function markReminderSent(id) {
  update('tasks/reminded', (s) => {
    const t = s.tasks.find((x) => x.id === id);
    if (t) t.reminderSent = true;
  });
}
