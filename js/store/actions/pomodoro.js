// Pomodoro seans kayıtları (sadece odak seansları)
import { update, getState } from '../store.js';
import { createId } from '../../lib/ids.js';

export function addPomodoroSession({ startedAt, endedAt, durationMin, taskId = null, courseId = null }) {
  const state = getState();
  const task = taskId ? state.tasks.find((t) => t.id === taskId) : null;
  const session = {
    id: createId(),
    startedAt,
    endedAt,
    durationMin: Math.max(1, Math.round(durationMin)),
    taskId: task ? task.id : null,
    courseId: courseId && state.courses.some((c) => c.id === courseId) ? courseId : task?.courseId || null,
  };
  update('pomodoro/add', (s) => { s.pomodoroSessions.push(session); });
  return session;
}

export function deletePomodoroSession(id) {
  update('pomodoro/delete', (s) => { s.pomodoroSessions = s.pomodoroSessions.filter((p) => p.id !== id); });
}
