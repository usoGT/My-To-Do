// Aylık ve yıllık hedef eylemleri
import { update, getState } from '../store.js';
import { createId, nowIso } from '../../lib/ids.js';
import { fail } from '../../lib/errors.js';

function clean(input, state) {
  const title = String(input.title ?? '').trim().replace(/\s+/g, ' ');
  if (!title) fail('Hedef boş olamaz.', 'title');
  if (title.length > 120) fail('Hedef en fazla 120 karakter olabilir.', 'title');
  const period = input.period === 'year' ? 'year' : input.period === 'month' ? 'month' : fail('Dönem seç.', 'period');
  const periodKey = String(input.periodKey ?? '');
  if (period === 'month' && !/^\d{4}-(0[1-9]|1[0-2])$/.test(periodKey)) fail('Ay geçersiz.', 'periodKey');
  if (period === 'year' && !/^\d{4}$/.test(periodKey)) fail('Yıl geçersiz.', 'periodKey');
  const courseId = input.courseId || null;
  if (courseId && !state.courses.some((c) => c.id === courseId)) fail('Seçilen ders bulunamadı.', 'courseId');
  return { title, period, periodKey, courseId };
}

export function addGoal(input) {
  const goal = { id: createId(), ...clean(input, getState()), done: false, doneAt: null, createdAt: nowIso() };
  update('goals/add', (s) => { s.goals.push(goal); });
  return goal;
}

export function updateGoal(id, input) {
  const state = getState();
  const existing = state.goals.find((g) => g.id === id);
  if (!existing) fail('Hedef bulunamadı.');
  const c = clean({ ...existing, ...input }, state);
  update('goals/update', (s) => { Object.assign(s.goals.find((g) => g.id === id), c); });
}

export function toggleGoal(id) {
  let done = false;
  update('goals/toggle', (s) => {
    const g = s.goals.find((x) => x.id === id);
    if (!g) return;
    g.done = !g.done;
    g.doneAt = g.done ? nowIso() : null;
    done = g.done;
  });
  return done;
}

export function deleteGoal(id) {
  update('goals/delete', (s) => {
    s.goals = s.goals.filter((g) => g.id !== id);
    for (const t of s.tasks) if (t.goalId === id) t.goalId = null;
  });
}
