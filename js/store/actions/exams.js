// Sınav eylemleri (Faz 15)
import { update, getState } from '../store.js';
import { createId, nowIso } from '../../lib/ids.js';
import { fail } from '../../lib/errors.js';
import { isValidDateKey, isValidTime } from '../../lib/dates.js';

export const EXAM_TYPES = { vize: 'Vize', final: 'Final', quiz: 'Quiz', butunleme: 'Bütünleme', proje: 'Proje teslimi' };

function clean(input, state) {
  const courseId = input.courseId;
  if (!state.courses.some((c) => c.id === courseId)) fail('Bir ders seç.', 'courseId');
  const type = EXAM_TYPES[input.type] ? input.type : 'vize';
  const date = String(input.date ?? '');
  if (!isValidDateKey(date)) fail('Sınav tarihi geçersiz.', 'date');
  const time = input.time ? String(input.time) : null;
  if (time && !isValidTime(time)) fail('Saat geçersiz.', 'time');
  return {
    courseId,
    type,
    title: String(input.title ?? '').trim().slice(0, 100),
    date,
    time,
    room: String(input.room ?? '').trim().slice(0, 30),
    notes: String(input.notes ?? '').trim().slice(0, 2000),
  };
}

export function addExam(input) {
  const exam = { id: createId(), ...clean(input, getState()), createdAt: nowIso() };
  update('exams/add', (s) => { s.exams.push(exam); });
  return exam;
}

export function updateExam(id, input) {
  const state = getState();
  const existing = state.exams.find((e) => e.id === id);
  if (!existing) fail('Sınav bulunamadı.');
  const c = clean({ ...existing, ...input }, state);
  update('exams/update', (s) => { Object.assign(s.exams.find((e) => e.id === id), c); });
}

export function deleteExam(id) {
  update('exams/delete', (s) => { s.exams = s.exams.filter((e) => e.id !== id); });
}
