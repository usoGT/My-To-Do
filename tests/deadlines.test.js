import { test, group, assertEqual, assertThrows, assertDeepEqual, assertTrue } from './runner.js';
import { freshStore } from './helpers.js';
import { getState } from '../js/store/store.js';
import { addTask, updateTask, toggleTask, markReminderSent } from '../js/store/actions/tasks.js';
import { getUpcomingDeadlines, getDueReminders } from '../js/store/selectors.js';
import { migrate, SCHEMA_VERSION } from '../js/store/schema.js';
import { toLocalDateTime } from '../js/lib/dates.js';

group('teslim ve hatırlatıcı (Faz 14)');
test('v1 verisi v2\'ye geçer: görevlere yeni alanlar eklenir', () => {
  const m = migrate({ version: 1, tasks: [{ id: 't', title: 'a', dueDate: '2026-10-20' }, { id: 'u', title: 'b' }] });
  assertTrue(m.version >= 2);
  assertEqual(m.tasks[0].dueDate, '2026-10-20', 'var olan değer korunur');
  assertDeepEqual([m.tasks[1].dueDate, m.tasks[1].reminderAt, m.tasks[1].reminderSent], [null, null, false]);
  assertEqual(SCHEMA_VERSION >= 2, true);
});
test('doğrulama', () => {
  freshStore();
  assertThrows(() => addTask({ title: 'a', dueDate: '2026-02-31' }));
  assertThrows(() => addTask({ title: 'a', reminderAt: '2026-10-14 10:00' }));
  assertThrows(() => addTask({ title: 'a', reminderAt: '2026-10-14T25:00' }));
  const t = addTask({ title: 'a', dueDate: '2026-10-20', reminderAt: '2026-10-14T10:00' });
  assertEqual(t.reminderSent, false);
});
test('yaklaşan teslimler: geçmiş + 3 gün, tamamlananlar hariç', () => {
  freshStore();
  addTask({ title: 'geçti', dueDate: '2026-10-12' });
  addTask({ title: 'bugün', dueDate: '2026-10-14' });
  addTask({ title: '3 gün', dueDate: '2026-10-17' });
  addTask({ title: '4 gün', dueDate: '2026-10-18' });
  toggleTask(addTask({ title: 'bitti', dueDate: '2026-10-15' }).id);
  assertDeepEqual(getUpcomingDeadlines(getState(), '2026-10-14').map((t) => t.title), ['geçti', 'bugün', '3 gün']);
});
test('hatırlatıcı zamanı gelince bir kez döner; değişince yeniden kurulur', () => {
  freshStore();
  const t = addTask({ title: 'a', reminderAt: '2026-10-14T10:00' });
  assertEqual(getDueReminders(getState(), '2026-10-14T09:59').length, 0);
  assertEqual(getDueReminders(getState(), '2026-10-14T10:00').length, 1);
  markReminderSent(t.id);
  assertEqual(getDueReminders(getState(), '2026-10-14T11:00').length, 0);
  updateTask(t.id, { reminderAt: '2026-10-14T12:00' });
  assertEqual(getState().tasks[0].reminderSent, false);
  assertEqual(getDueReminders(getState(), '2026-10-14T12:30').length, 1);
});
test('toLocalDateTime', () => {
  assertEqual(toLocalDateTime(new Date(2026, 9, 14, 9, 5)), '2026-10-14T09:05');
});
