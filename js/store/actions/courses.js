// Ders eylemleri
import { update, getState } from '../store.js';
import { COURSE_COLORS } from '../schema.js';
import { createId, nowIso } from '../../lib/ids.js';
import { fail } from '../../lib/errors.js';
import { normalizeTr } from '../../lib/text.js';

export function nextFreeColor(courses) {
  const used = new Set(courses.map((c) => c.color));
  return COURSE_COLORS.find((c) => !used.has(c)) || COURSE_COLORS[courses.length % COURSE_COLORS.length];
}

function clean(input, courses, ignoreId = null) {
  const name = String(input.name ?? '').trim();
  if (!name) fail('Ders adı boş olamaz.', 'name');
  if (name.length > 60) fail('Ders adı en fazla 60 karakter olabilir.', 'name');
  if (courses.some((c) => c.id !== ignoreId && normalizeTr(c.name) === normalizeTr(name))) {
    fail('Bu adda bir ders zaten var.', 'name');
  }
  const color = COURSE_COLORS.includes(input.color) ? input.color : null;
  return {
    name,
    code: String(input.code ?? '').trim().slice(0, 20),
    color,
    teacher: String(input.teacher ?? '').trim().slice(0, 60),
    room: String(input.room ?? '').trim().slice(0, 30),
  };
}

export function addCourse(input) {
  const { courses } = getState();
  const c = clean(input, courses);
  const course = { id: createId(), ...c, color: c.color || nextFreeColor(courses), createdAt: nowIso() };
  update('courses/add', (s) => { s.courses.push(course); });
  return course;
}

export function updateCourse(id, input) {
  const { courses } = getState();
  const existing = courses.find((c) => c.id === id);
  if (!existing) fail('Ders bulunamadı.');
  const c = clean({ ...existing, ...input }, courses, id);
  update('courses/update', (s) => {
    const t = s.courses.find((x) => x.id === id);
    Object.assign(t, c, { color: c.color || t.color });
  });
}

// Silmeden önce onay penceresinde gösterilecek etkiler.
export function getCourseImpact(state, id) {
  return {
    scheduleCount: state.schedule.filter((e) => e.courseId === id).length,
    taskCount: state.tasks.filter((t) => t.courseId === id).length,
    noteCount: state.courseNotes.filter((n) => n.courseId === id).length,
    goalCount: state.goals.filter((g) => g.courseId === id).length,
    examCount: state.exams.filter((e) => e.courseId === id).length,
  };
}

// Ders silinir: program blokları ve notlar silinir, diğer bağlantılar boşa çıkar.
// Dönen attachmentIds IndexedDB'den silinmeli (Faz 9).
export function deleteCourse(id) {
  const state = getState();
  const attachmentIds = state.courseNotes
    .filter((n) => n.courseId === id)
    .flatMap((n) => (n.attachments || []).map((a) => a.id));
  update('courses/delete', (s) => {
    s.courses = s.courses.filter((c) => c.id !== id);
    s.schedule = s.schedule.filter((e) => e.courseId !== id);
    s.courseNotes = s.courseNotes.filter((n) => n.courseId !== id);
    s.exams = s.exams.filter((e) => e.courseId !== id);
    for (const t of s.tasks) if (t.courseId === id) t.courseId = null;
    for (const g of s.goals) if (g.courseId === id) g.courseId = null;
    for (const p of s.pomodoroSessions) if (p.courseId === id) p.courseId = null;
  });
  return { attachmentIds };
}
