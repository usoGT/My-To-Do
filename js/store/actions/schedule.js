// Ders programı eylemleri
import { update, getState } from '../store.js';
import { createId } from '../../lib/ids.js';
import { fail } from '../../lib/errors.js';
import { isValidTime, timeToMinutes, WEEKDAYS_TR } from '../../lib/dates.js';
import { overlaps } from '../../lib/time-slots.js';

export const ENTRY_TYPES = { ders: 'Ders', lab: 'Lab', diger: 'Diğer' };

// Aynı gün çakışan blok (varsa) döner.
export function findOverlap(schedule, entry, ignoreId = null) {
  return schedule.find((e) => e.id !== ignoreId && e.weekday === entry.weekday && overlaps(e, entry)) || null;
}

export function validateEntry(state, input, ignoreId = null) {
  const courseId = input.courseId;
  if (!state.courses.some((c) => c.id === courseId)) fail('Bir ders seç.', 'courseId');
  const weekday = Number(input.weekday);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) fail('Geçersiz gün.', 'weekday');
  if (!isValidTime(input.start)) fail('Başlangıç saati geçersiz.', 'start');
  if (!isValidTime(input.end)) fail('Bitiş saati geçersiz.', 'end');
  const len = timeToMinutes(input.end) - timeToMinutes(input.start);
  if (len <= 0) fail('Bitiş saati başlangıçtan sonra olmalı.', 'end');
  if (len < 15) fail('Ders saati en az 15 dakika olmalı.', 'end');
  const entry = {
    courseId,
    weekday,
    start: input.start,
    end: input.end,
    type: ENTRY_TYPES[input.type] ? input.type : 'ders',
    room: String(input.room ?? '').trim().slice(0, 30),
  };
  const clash = findOverlap(state.schedule, entry, ignoreId);
  if (clash) {
    const other = state.courses.find((c) => c.id === clash.courseId);
    fail(`${WEEKDAYS_TR[weekday]} ${clash.start}–${clash.end} arasında "${other ? other.name : 'başka bir ders'}" var; saatler çakışıyor.`, 'start');
  }
  return entry;
}

export function addScheduleEntry(input) {
  const entry = { id: createId(), ...validateEntry(getState(), input) };
  update('schedule/add', (s) => { s.schedule.push(entry); });
  return entry;
}

export function updateScheduleEntry(id, input) {
  const entry = validateEntry(getState(), input, id);
  update('schedule/update', (s) => {
    const t = s.schedule.find((e) => e.id === id);
    if (t) Object.assign(t, entry);
  });
}

export function deleteScheduleEntry(id) {
  update('schedule/delete', (s) => { s.schedule = s.schedule.filter((e) => e.id !== id); });
}
