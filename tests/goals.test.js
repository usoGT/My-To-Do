import { test, group, assertEqual, assertThrows, assertDeepEqual } from './runner.js';
import { freshStore } from './helpers.js';
import { getState, update } from '../js/store/store.js';
import { addGoal, updateGoal, toggleGoal, deleteGoal } from '../js/store/actions/goals.js';
import { addTask, toggleTask } from '../js/store/actions/tasks.js';
import { getGoalsFor, getGoalProgress, buildActivityIndex, dayScore, scoreToLevel, heatmapCell, getYearSummary } from '../js/store/selectors.js';

group('hedefler');
test('ekleme ve doğrulama', () => {
  freshStore();
  addGoal({ title: 'Vize', period: 'month', periodKey: '2026-10' });
  addGoal({ title: 'B2', period: 'year', periodKey: '2026' });
  assertThrows(() => addGoal({ title: '', period: 'month', periodKey: '2026-10' }));
  assertThrows(() => addGoal({ title: 'x', period: 'month', periodKey: '2026-13' }));
  assertThrows(() => addGoal({ title: 'x', period: 'year', periodKey: '26' }));
  assertEqual(getGoalsFor(getState(), 'month', '2026-10').length, 1);
  assertEqual(getGoalsFor(getState(), 'year', '2026').length, 1);
});
test('ilerleme bağlı görevlerden', () => {
  freshStore();
  const g = addGoal({ title: 'Vize', period: 'month', periodKey: '2026-10' });
  const a = addTask({ title: 'a', date: '2026-10-14', goalId: g.id });
  addTask({ title: 'b', date: '2026-10-15', goalId: g.id });
  addTask({ title: 'c', date: '2026-10-15', goalId: g.id });
  toggleTask(a.id);
  assertDeepEqual(getGoalProgress(getState(), g.id), { done: 1, total: 3 });
});
test('hedef silinince görev bağlantısı temizlenir', () => {
  freshStore();
  const g = addGoal({ title: 'Vize', period: 'month', periodKey: '2026-10' });
  addTask({ title: 'a', goalId: g.id });
  deleteGoal(g.id);
  assertEqual(getState().tasks[0].goalId, null);
  assertEqual(getState().goals.length, 0);
});
test('tamamlama ve güncelleme', () => {
  freshStore();
  const g = addGoal({ title: 'Vize', period: 'month', periodKey: '2026-10' });
  assertEqual(toggleGoal(g.id), true);
  updateGoal(g.id, { title: 'Vize hazırlığı' });
  assertEqual(getState().goals[0].title, 'Vize hazırlığı');
  assertEqual(getState().goals[0].done, true);
});

group('ısı haritası');
test('gün puanı ve seviye', () => {
  freshStore();
  const t = addTask({ title: 'a', date: '2026-10-14' });
  toggleTask(t.id);
  update('x', (s) => {
    s.routineLogs['2026-10-14'] = ['r1', 'r2'];
    s.pomodoroSessions.push({ id: 'p', startedAt: new Date(2026, 9, 14, 10).toISOString(), durationMin: 50 });
  });
  const a = buildActivityIndex(getState()).get('2026-10-14');
  assertDeepEqual(a, { tasks: 1, routines: 2, focusMin: 50 });
  assertEqual(dayScore(a), 5);
  assertDeepEqual([0, 1, 2, 3, 4, 5, 7, 8, 20].map(scoreToLevel), [0, 1, 1, 2, 2, 3, 3, 4, 4]);
});
test('1 Ocak doğru hücrede', () => {
  // 1 Ocak 2026 Perşembe → sütun 0, satır 3
  assertDeepEqual(heatmapCell('2026', '2026-01-01'), { col: 0, row: 3 });
  assertDeepEqual(heatmapCell('2026', '2026-01-05'), { col: 1, row: 0 });
  assertDeepEqual(heatmapCell('2026', '2026-12-31'), { col: 52, row: 3 });
});
test('yıl özeti', () => {
  freshStore();
  for (const d of ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-05']) toggleTask(addTask({ title: 'a', date: d }).id);
  const s = getYearSummary(getState(), '2026');
  assertEqual(s.tasks, 4);
  assertEqual(s.longestStreak, 3);
  assertEqual(s.bestMonth, 2);
});
