// Rutin eylemleri
import { update, getState } from '../store.js';
import { COURSE_COLORS } from '../schema.js';
import { createId, nowIso } from '../../lib/ids.js';
import { fail } from '../../lib/errors.js';
import { isValidTime, isValidDateKey, todayKey, toDateKey } from '../../lib/dates.js';

export const routineStartDate = (r) => r.startDate || toDateKey(new Date(r.createdAt));

function clean(input) {
  const title = String(input.title ?? '').trim().replace(/\s+/g, ' ');
  if (!title) fail('Rutin adı boş olamaz.', 'title');
  if (title.length > 80) fail('Rutin adı en fazla 80 karakter olabilir.', 'title');
  const weekdays = [...new Set((Array.isArray(input.weekdays) ? input.weekdays : String(input.weekdays ?? '').split(','))
    .filter((d) => d !== '' && d !== null)
    .map(Number))]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort();
  if (!weekdays.length) fail('En az bir gün seç.', 'weekdays');
  const time = input.time ? String(input.time) : null;
  if (time && !isValidTime(time)) fail('Saat geçersiz.', 'time');
  const durationMin = input.durationMin === '' || input.durationMin == null ? 30 : Number(input.durationMin);
  if (!Number.isInteger(durationMin) || durationMin < 5 || durationMin > 240) fail('Süre 5–240 dakika arasında olmalı.', 'durationMin');
  const color = COURSE_COLORS.includes(input.color) ? input.color : 'green';
  return { title, weekdays, time, durationMin, color };
}

export function addRoutine(input, today = todayKey()) {
  const routine = { id: createId(), ...clean(input), archived: false, createdAt: nowIso(), startDate: today };
  update('routines/add', (s) => { s.routines.push(routine); });
  return routine;
}

export function updateRoutine(id, input) {
  const existing = getState().routines.find((r) => r.id === id);
  if (!existing) fail('Rutin bulunamadı.');
  const c = clean({ ...existing, ...input });
  update('routines/update', (s) => { Object.assign(s.routines.find((r) => r.id === id), c); });
}

export function setRoutineArchived(id, archived) {
  update('routines/archive', (s) => {
    const r = s.routines.find((x) => x.id === id);
    if (r) r.archived = Boolean(archived);
  });
}

export function deleteRoutine(id) {
  update('routines/delete', (s) => {
    s.routines = s.routines.filter((r) => r.id !== id);
    for (const key of Object.keys(s.routineLogs)) {
      s.routineLogs[key] = s.routineLogs[key].filter((rid) => rid !== id);
      if (!s.routineLogs[key].length) delete s.routineLogs[key];
    }
  });
}

// Bir günü işaretler/kaldırır. Gelecek tarih işaretlenemez. Başlangıçtan önceki bir gün
// işaretlenirse rutinin başlangıcı o güne çekilir (geçmişi sonradan doldurmak için).
export function toggleRoutineDone(routineId, dateKey, today = todayKey()) {
  if (!isValidDateKey(dateKey)) fail('Tarih geçersiz.');
  if (dateKey > today) fail('Gelecekteki bir gün işaretlenemez.');
  let done = false;
  update('routines/toggle', (s) => {
    const r = s.routines.find((x) => x.id === routineId);
    if (!r) return;
    const list = s.routineLogs[dateKey] || [];
    if (list.includes(routineId)) {
      s.routineLogs[dateKey] = list.filter((id) => id !== routineId);
      if (!s.routineLogs[dateKey].length) delete s.routineLogs[dateKey];
    } else {
      s.routineLogs[dateKey] = [...list, routineId];
      done = true;
      if (dateKey < routineStartDate(r)) r.startDate = dateKey;
    }
  });
  return done;
}
