import { test, group, assertEqual, assertDeepEqual } from './runner.js';
import { freshStore } from './helpers.js';
import { getState, update } from '../js/store/store.js';
import { addCourse } from '../js/store/actions/courses.js';
import { addScheduleEntry } from '../js/store/actions/schedule.js';
import { addTask, toggleTask } from '../js/store/actions/tasks.js';
import { getCourseOverview, getNextClass } from '../js/store/selectors.js';

const NOW = { key: '2026-10-14', minutes: 12 * 60 }; // Çarşamba 12:00
const at = (key, h) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d, h).toISOString(); };

group('ders özeti');
test('görevler, odak (çift sayımsız), sıradaki ders', () => {
  freshStore();
  const c = addCourse({ name: 'Fizik' });
  const other = addCourse({ name: 'Kimya' });
  addScheduleEntry({ courseId: c.id, weekday: 2, start: '09:00', end: '10:50' });
  addScheduleEntry({ courseId: c.id, weekday: 4, start: '13:00', end: '14:00', room: 'B-1' });
  const t1 = addTask({ title: 'a', date: '2026-10-13', courseId: c.id });
  addTask({ title: 'b', date: '2026-10-20', courseId: c.id });
  const t3 = addTask({ title: 'c', date: '2026-10-14', courseId: c.id });
  toggleTask(t3.id);
  addTask({ title: 'başka', courseId: other.id });
  update('x', (s) => {
    s.pomodoroSessions.push(
      { id: 'p1', startedAt: at('2026-10-14', 10), durationMin: 25, courseId: c.id, taskId: t1.id }, // ikisi de eşleşir, bir kez sayılmalı
      { id: 'p2', startedAt: at('2026-10-12', 10), durationMin: 25, courseId: null, taskId: t1.id },
      { id: 'p3', startedAt: at('2026-10-01', 10), durationMin: 50, courseId: c.id, taskId: null },
      { id: 'p4', startedAt: at('2026-10-14', 11), durationMin: 25, courseId: other.id, taskId: null },
    );
  });
  const o = getCourseOverview(getState(), c.id, NOW);
  assertEqual(o.overdueTasks.length, 1);
  assertEqual(o.openTasks.length, 1);
  assertEqual(o.doneTasks.length, 1);
  assertEqual(o.weeklyMinutes, 170);
  assertEqual(o.focus.totalMin, 100);
  assertEqual(o.focus.thisWeekMin, 50);
  assertEqual(o.focus.last7Days.length, 7);
  assertEqual(o.focus.last7Days[6].minutes, 25);
  assertDeepEqual([o.nextClass.date, o.nextClass.start], ['2026-10-16', '13:00']);
});
test('sıradaki ders: bugün daha sonra varsa bugün', () => {
  freshStore();
  const c = addCourse({ name: 'Fizik' });
  addScheduleEntry({ courseId: c.id, weekday: 2, start: '15:00', end: '16:00' });
  assertEqual(getNextClass(getState(), c.id, NOW).date, '2026-10-14');
  assertEqual(getNextClass(getState(), c.id, { key: '2026-10-14', minutes: 16 * 60 }).date, '2026-10-21');
});
test('olmayan ders → null', () => {
  freshStore();
  assertEqual(getCourseOverview(getState(), 'yok', NOW), null);
});
