import { test, group, assertEqual, assertThrows, assertTrue, assertDeepEqual } from './runner.js';
import { freshStore } from './helpers.js';
import { getState, update } from '../js/store/store.js';
import { addTask, updateTask, toggleTask, deleteTask, restoreTask, moveTasksToDate } from '../js/store/actions/tasks.js';
import { addCourse } from '../js/store/actions/courses.js';
import { getTasksForDate, getOverdueTasks, getUndatedTasks, sortTasks } from '../js/store/selectors.js';

group('görevler');
test('görev eklenir, varsayılanlar dolar', () => {
  freshStore();
  const t = addTask({ title: '  Fizik   ödevi ', date: '2026-10-14' });
  assertEqual(t.title, 'Fizik ödevi');
  assertEqual(t.priority, 'medium');
  assertEqual(t.done, false);
  assertEqual(t.estimateMin, null);
  assertEqual(getState().tasks.length, 1);
});
test('doğrulamalar', () => {
  freshStore();
  assertThrows(() => addTask({ title: '' }), 'boş başlık');
  assertThrows(() => addTask({ title: 'x'.repeat(201) }), 'uzun başlık');
  assertThrows(() => addTask({ title: 'a', time: '10:00' }), 'tarihsiz saat');
  assertThrows(() => addTask({ title: 'a', date: '2026-13-01' }), 'geçersiz tarih');
  assertThrows(() => addTask({ title: 'a', estimateMin: 3 }), 'kısa süre');
  assertThrows(() => addTask({ title: 'a', estimateMin: 601 }), 'uzun süre');
  assertThrows(() => addTask({ title: 'a', courseId: 'yok' }), 'olmayan ders');
});
test('toggle tamamlar ve geri alır', () => {
  freshStore();
  const t = addTask({ title: 'a', date: '2026-10-14' });
  assertEqual(toggleTask(t.id), true);
  assertTrue(getState().tasks[0].doneAt !== null);
  assertEqual(toggleTask(t.id), false);
  assertEqual(getState().tasks[0].doneAt, null);
});
test('silme ve geri alma (Pomodoro bağlantısıyla)', () => {
  freshStore();
  const t = addTask({ title: 'a', date: '2026-10-14' });
  update('x', (s) => { s.pomodoroSessions.push({ id: 'p1', taskId: t.id, durationMin: 25 }); });
  const removed = deleteTask(t.id);
  assertEqual(getState().tasks.length, 0);
  assertEqual(getState().pomodoroSessions[0].taskId, null);
  restoreTask(removed);
  assertEqual(getState().tasks[0].id, t.id);
  assertEqual(getState().pomodoroSessions[0].taskId, t.id);
});
test('güncelleme ders bağlantısı', () => {
  freshStore();
  const c = addCourse({ name: 'Fizik' });
  const t = addTask({ title: 'a' });
  updateTask(t.id, { courseId: c.id, date: '2026-10-15', time: '14:00', priority: 'high' });
  const s = getState().tasks[0];
  assertEqual(s.courseId, c.id);
  assertEqual(s.time, '14:00');
  assertEqual(s.priority, 'high');
});
test('geciken görevler (bugün = 2026-10-14)', () => {
  freshStore();
  addTask({ title: 'dün', date: '2026-10-13' });
  addTask({ title: 'geçen hafta', date: '2026-10-07' });
  const done = addTask({ title: 'bitmiş', date: '2026-10-12' });
  toggleTask(done.id);
  addTask({ title: 'bugün', date: '2026-10-14' });
  addTask({ title: 'tarihsiz' });
  const o = getOverdueTasks(getState(), '2026-10-14');
  assertDeepEqual(o.map((t) => t.title), ['geçen hafta', 'dün']);
  assertDeepEqual(getUndatedTasks(getState()).map((t) => t.title), ['tarihsiz']);
});
test('sıralama: saatli önce, sonra sıra, tamamlanan en altta', () => {
  const list = sortTasks([
    { id: 1, done: true, order: 1 },
    { id: 2, done: false, order: 2 },
    { id: 3, done: false, time: '14:00', order: 3 },
    { id: 4, done: false, time: '09:00', order: 4 },
    { id: 5, done: false, order: 1 },
  ]);
  assertDeepEqual(list.map((t) => t.id), [4, 3, 5, 2, 1]);
});
test('toplu taşıma', () => {
  freshStore();
  const a = addTask({ title: 'a', date: '2026-10-10' });
  const b = addTask({ title: 'b', date: '2026-10-11', time: '09:00' });
  moveTasksToDate([a.id, b.id], '2026-10-14');
  assertEqual(getTasksForDate(getState(), '2026-10-14').length, 2);
  moveTasksToDate([b.id], null);
  assertEqual(getState().tasks.find((t) => t.id === b.id).time, null);
});
