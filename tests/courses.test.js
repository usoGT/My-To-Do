import { test, group, assertEqual, assertThrows, assertTrue, assertDeepEqual } from './runner.js';
import { freshStore } from './helpers.js';
import { getState, update } from '../js/store/store.js';
import { addCourse, updateCourse, deleteCourse, getCourseImpact, nextFreeColor } from '../js/store/actions/courses.js';
import { addScheduleEntry, updateScheduleEntry, findOverlap } from '../js/store/actions/schedule.js';
import { getScheduleForWeekday, getWeeklyMinutes } from '../js/store/selectors.js';

group('dersler');
test('ders eklenir, renk otomatik seçilir', () => {
  freshStore();
  const a = addCourse({ name: 'Fizik I' });
  const b = addCourse({ name: 'Matematik I', color: 'teal' });
  assertEqual(a.color, 'indigo');
  assertEqual(b.color, 'teal');
  assertEqual(nextFreeColor(getState().courses), 'blue');
});
test('boş ve tekrar eden ad reddedilir', () => {
  freshStore();
  addCourse({ name: 'Fizik I' });
  assertThrows(() => addCourse({ name: '  ' }));
  assertThrows(() => addCourse({ name: 'fizik ı' }));
});
test('ders güncellenir', () => {
  freshStore();
  const a = addCourse({ name: 'Fizik' });
  updateCourse(a.id, { name: 'Fizik I', room: 'B-204' });
  assertEqual(getState().courses[0].name, 'Fizik I');
  assertEqual(getState().courses[0].room, 'B-204');
});
test('ders silinince ilişkiler temizlenir', () => {
  freshStore();
  const a = addCourse({ name: 'Fizik' });
  addScheduleEntry({ courseId: a.id, weekday: 0, start: '09:00', end: '10:50' });
  update('t', (s) => {
    s.tasks.push({ id: 't1', courseId: a.id });
    s.goals.push({ id: 'g1', courseId: a.id });
    s.courseNotes.push({ id: 'n1', courseId: a.id, attachments: [{ id: 'f1' }] });
    s.pomodoroSessions.push({ id: 'p1', courseId: a.id, durationMin: 25 });
  });
  assertDeepEqual(getCourseImpact(getState(), a.id), { scheduleCount: 1, taskCount: 1, noteCount: 1, goalCount: 1, examCount: 0 });
  const r = deleteCourse(a.id);
  const s = getState();
  assertDeepEqual(r.attachmentIds, ['f1']);
  assertEqual(s.courses.length, 0);
  assertEqual(s.schedule.length, 0);
  assertEqual(s.courseNotes.length, 0);
  assertEqual(s.tasks[0].courseId, null);
  assertEqual(s.goals[0].courseId, null);
  assertEqual(s.pomodoroSessions[0].courseId, null);
  assertEqual(s.pomodoroSessions[0].durationMin, 25);
});

group('ders programı');
test('ders saati eklenir ve sıralanır', () => {
  freshStore();
  const a = addCourse({ name: 'Fizik' });
  addScheduleEntry({ courseId: a.id, weekday: 2, start: '13:00', end: '14:50' });
  addScheduleEntry({ courseId: a.id, weekday: 2, start: '09:00', end: '10:50' });
  const day = getScheduleForWeekday(getState(), 2);
  assertEqual(day.length, 2);
  assertEqual(day[0].start, '09:00');
  assertEqual(day[0].course.name, 'Fizik');
  assertEqual(getWeeklyMinutes(getState(), a.id), 220);
});
test('çakışan saat reddedilir, uç uca saat kabul edilir', () => {
  freshStore();
  const a = addCourse({ name: 'Fizik' });
  const b = addCourse({ name: 'Kimya' });
  addScheduleEntry({ courseId: a.id, weekday: 0, start: '09:00', end: '10:50' });
  let msg = '';
  try { addScheduleEntry({ courseId: b.id, weekday: 0, start: '10:00', end: '11:00' }); } catch (e) { msg = e.message; }
  assertTrue(msg.includes('Fizik'), 'hata mesajı çakışan dersi söylemeli: ' + msg);
  addScheduleEntry({ courseId: b.id, weekday: 0, start: '10:50', end: '12:00' });
  addScheduleEntry({ courseId: b.id, weekday: 1, start: '09:00', end: '10:00' });
  assertEqual(getState().schedule.length, 3);
});
test('geçersiz saatler reddedilir', () => {
  freshStore();
  const a = addCourse({ name: 'Fizik' });
  assertThrows(() => addScheduleEntry({ courseId: a.id, weekday: 0, start: '10:00', end: '09:00' }));
  assertThrows(() => addScheduleEntry({ courseId: a.id, weekday: 0, start: '10:00', end: '10:10' }));
  assertThrows(() => addScheduleEntry({ courseId: 'yok', weekday: 0, start: '10:00', end: '11:00' }));
  assertThrows(() => addScheduleEntry({ courseId: a.id, weekday: 7, start: '10:00', end: '11:00' }));
});
test('düzenlemede kendisiyle çakışma sayılmaz', () => {
  freshStore();
  const a = addCourse({ name: 'Fizik' });
  const e = addScheduleEntry({ courseId: a.id, weekday: 0, start: '09:00', end: '10:00' });
  updateScheduleEntry(e.id, { courseId: a.id, weekday: 0, start: '09:30', end: '10:30' });
  assertEqual(getState().schedule[0].start, '09:30');
  assertEqual(findOverlap(getState().schedule, { weekday: 0, start: '10:00', end: '11:00' }, e.id), null);
});
