import { test, group, assertEqual, assertThrows, assertDeepEqual, assertTrue } from './runner.js';
import { freshStore } from './helpers.js';
import { getState } from '../js/store/store.js';
import { addCourse, deleteCourse } from '../js/store/actions/courses.js';
import { addScheduleEntry } from '../js/store/actions/schedule.js';
import { addExam, updateExam, deleteExam } from '../js/store/actions/exams.js';
import { updateSettings } from '../js/store/actions/settings.js';
import { getUpcomingExams, getPastExams, getExamsForDate, examTitle, suggestStudyPlan } from '../js/store/selectors.js';
import { migrate } from '../js/store/schema.js';

const TODAY = '2026-10-14';

group('sınavlar (Faz 15)');
test('v2 verisi v3\'e geçer', () => {
  const m = migrate({ version: 2, tasks: [] });
  assertTrue(m.version >= 3);
  assertDeepEqual(m.exams, []);
});
test('ekle, doğrula, güncelle, sil', () => {
  freshStore();
  const c = addCourse({ name: 'Fizik I' });
  assertThrows(() => addExam({ courseId: 'yok', date: '2026-10-20' }));
  assertThrows(() => addExam({ courseId: c.id, date: '2026-10-32' }));
  const e = addExam({ courseId: c.id, type: 'vize', date: '2026-10-20', time: '10:00' });
  assertEqual(examTitle(getState(), e), 'Fizik I Vize');
  updateExam(e.id, { title: 'Ara sınav', room: 'Amfi 1' });
  assertEqual(examTitle(getState(), getState().exams[0]), 'Ara sınav');
  deleteExam(e.id);
  assertEqual(getState().exams.length, 0);
});
test('yaklaşan / geçmiş / güne göre', () => {
  freshStore();
  const c = addCourse({ name: 'Fizik' });
  addExam({ courseId: c.id, date: '2026-10-10' });
  addExam({ courseId: c.id, date: '2026-10-20', time: '14:00' });
  addExam({ courseId: c.id, date: '2026-10-20', time: '09:00', type: 'quiz' });
  addExam({ courseId: c.id, date: '2026-11-30' });
  assertEqual(getUpcomingExams(getState(), TODAY).length, 3);
  assertEqual(getUpcomingExams(getState(), TODAY, 14).length, 2);
  assertEqual(getPastExams(getState(), TODAY).length, 1);
  assertDeepEqual(getExamsForDate(getState(), '2026-10-20').map((e) => e.time), ['09:00', '14:00']);
});
test('ders silinince sınavları da silinir', () => {
  freshStore();
  const c = addCourse({ name: 'Fizik' });
  addExam({ courseId: c.id, date: '2026-10-20' });
  deleteCourse(c.id);
  assertEqual(getState().exams.length, 0);
});
test('çalışma planı: boş zamanlara dağıtılır, dolu gün atlanır', () => {
  freshStore();
  updateSettings({ dayStart: '08:00', dayEnd: '12:00' });
  const c = addCourse({ name: 'Fizik' });
  // Cuma (16 Ekim) tüm gün dolu → atlanmalı
  addScheduleEntry({ courseId: c.id, weekday: 4, start: '08:00', end: '12:00' });
  // Perşembe 08:00-09:30 dolu → ilk uygun boşluk 09:30
  addScheduleEntry({ courseId: c.id, weekday: 3, start: '08:00', end: '09:30' });
  const exam = addExam({ courseId: c.id, date: '2026-10-21' });
  const plan = suggestStudyPlan(getState(), exam, TODAY, { sessions: 10, minutes: 60 });
  assertDeepEqual(plan.map((p) => p.date + ' ' + p.time), [
    '2026-10-15 09:30', '2026-10-17 08:00', '2026-10-18 08:00', '2026-10-19 08:00', '2026-10-20 08:00',
  ]);
  const three = suggestStudyPlan(getState(), exam, TODAY, { sessions: 3, minutes: 60 });
  assertDeepEqual(three.map((p) => p.date), ['2026-10-15', '2026-10-18', '2026-10-20']);
});
