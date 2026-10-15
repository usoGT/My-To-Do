import { test, group, assertEqual, assertDeepEqual } from './runner.js';
import { freshStore } from './helpers.js';
import { getState } from '../js/store/store.js';
import { addCourse } from '../js/store/actions/courses.js';
import { addScheduleEntry } from '../js/store/actions/schedule.js';
import { addTask, toggleTask } from '../js/store/actions/tasks.js';
import { addRoutine } from '../js/store/actions/routines.js';
import { getDayAgenda } from '../js/store/selectors.js';
import { createSampleData } from '../js/lib/sample-data.js';
import { migrate } from '../js/store/schema.js';

const DAY = '2026-10-14'; // Çarşamba = 2

function setup() {
  freshStore();
  const c = addCourse({ name: 'Fizik' });
  addScheduleEntry({ courseId: c.id, weekday: 2, start: '09:00', end: '10:50' });
  addScheduleEntry({ courseId: c.id, weekday: 2, start: '13:00', end: '14:50' });
  addScheduleEntry({ courseId: c.id, weekday: 3, start: '09:00', end: '10:50' });
  addTask({ title: 'Saatli, süresiz', date: DAY, time: '16:00' }); // 30 dk sayılır
  addTask({ title: 'Saatsiz', date: DAY });
  addTask({ title: 'Dün', date: '2026-10-13' });
  addRoutine({ title: 'Spor', weekdays: [2], time: '18:00', durationMin: 60 }, '2026-10-01');
  addRoutine({ title: 'Kitap', weekdays: [0, 1, 2, 3, 4, 5, 6] }, '2026-10-01');
}

group('gün özeti');
test('ders, görev, rutin sayıları', () => {
  setup();
  const a = getDayAgenda(getState(), DAY, { key: DAY, minutes: 8 * 60 });
  assertEqual(a.classes.length, 2);
  assertEqual(a.tasks.length, 2);
  assertEqual(a.overdue.length, 1);
  assertEqual(a.routines.length, 2);
  assertDeepEqual([a.stats.tasksDone, a.stats.tasksTotal, a.stats.routinesDone, a.stats.routinesTotal], [0, 2, 0, 2]);
});
test('boş zaman: saatli görev (30 dk) ve saatli rutin dahil', () => {
  setup();
  const a = getDayAgenda(getState(), DAY, null);
  // 08-23 = 900 dk; dersler 220, görev 30, rutin 60 → 590
  assertEqual(a.stats.freeMinutes, 590);
  assertDeepEqual(a.freeSlots.map((s) => s.start + '-' + s.end), ['08:00-09:00', '10:50-13:00', '14:50-16:00', '16:30-18:00', '19:00-23:00']);
});
test('tamamlanan saatli görev meşgul sayılmaz', () => {
  setup();
  toggleTask(getState().tasks.find((t) => t.time).id);
  assertEqual(getDayAgenda(getState(), DAY, null).stats.freeMinutes, 620);
});
test('bugünse kalan boş zaman şu andan sonrası', () => {
  setup();
  const a = getDayAgenda(getState(), DAY, { key: DAY, minutes: 17 * 60 });
  // 17:00-18:00 (60) + 19:00-23:00 (240)
  assertEqual(a.stats.remainingFreeMinutes, 300);
});
test('zaman çizelgesi sıralı', () => {
  setup();
  const kinds = getDayAgenda(getState(), DAY, null).timeline.map((t) => t.kind + '@' + t.start);
  assertDeepEqual(kinds.slice(0, 4), ['free@08:00', 'class@09:00', 'free@10:50', 'class@13:00']);
});
test('başka gün geciken listesi boş', () => {
  setup();
  assertEqual(getDayAgenda(getState(), '2026-10-15', { key: DAY, minutes: 0 }).overdue.length, 0);
});

group('örnek veri');
test('örnek veri geçerli ve tutarlı', () => {
  const s = migrate(createSampleData(DAY));
  assertEqual(s.courses.length, 4);
  assertEqual(s.schedule.length, 10);
  assertEqual(s.routines.length, 3);
  const ids = new Set(s.courses.map((c) => c.id));
  assertEqual(s.schedule.every((e) => ids.has(e.courseId)), true);
  assertEqual(s.tasks.filter((t) => t.date && t.date < DAY && !t.done).length >= 1, true);
});
