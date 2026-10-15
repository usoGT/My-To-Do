import { test, group, assertEqual, assertDeepEqual } from './runner.js';
import { nextMode, remainingFrom, formatClock, durationFor } from '../js/lib/timer.js';
import { freshStore } from './helpers.js';
import { getState, update } from '../js/store/store.js';
import { addCourse } from '../js/store/actions/courses.js';
import { addTask } from '../js/store/actions/tasks.js';
import { addPomodoroSession, deletePomodoroSession } from '../js/store/actions/pomodoro.js';
import { getWeeklyFocus, getDayFocus, getFocusByCourse } from '../js/store/selectors.js';

group('zamanlayıcı');
test('nextMode: 4. odaktan sonra uzun mola', () => {
  assertEqual(nextMode('focus', 1, 4), 'short');
  assertEqual(nextMode('focus', 3, 4), 'short');
  assertEqual(nextMode('focus', 4, 4), 'long');
  assertEqual(nextMode('focus', 8, 4), 'long');
  assertEqual(nextMode('short', 2, 4), 'focus');
  assertEqual(nextMode('long', 4, 4), 'focus');
});
test('remainingFrom ve formatClock', () => {
  assertEqual(remainingFrom(10000, 4000), 6000);
  assertEqual(remainingFrom(1000, 4000), 0);
  assertEqual(formatClock(25 * 60 * 1000), '25:00');
  assertEqual(formatClock(1499000), '24:59');
  assertEqual(formatClock(1499001), '25:00');
  assertEqual(formatClock(0), '00:00');
  assertEqual(formatClock(61000), '01:01');
});
test('durationFor', () => {
  const p = { focusMin: 25, shortBreakMin: 5, longBreakMin: 15 };
  assertDeepEqual(['focus', 'short', 'long'].map((m) => durationFor(m, p) / 60000), [25, 5, 15]);
});

const at = (key, h) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d, h).toISOString(); };
group('pomodoro kayıtları');
test('seans kaydı görevden dersi alır', () => {
  freshStore();
  const c = addCourse({ name: 'Fizik' });
  const t = addTask({ title: 'a', courseId: c.id });
  const s = addPomodoroSession({ startedAt: at('2026-10-14', 10), endedAt: at('2026-10-14', 10), durationMin: 25, taskId: t.id });
  assertEqual(s.courseId, c.id);
  deletePomodoroSession(s.id);
  assertEqual(getState().pomodoroSessions.length, 0);
});
test('haftalık, günlük ve ders dağılımı', () => {
  freshStore();
  const c = addCourse({ name: 'Fizik' });
  const t = addTask({ title: 'a', courseId: c.id });
  update('x', (s) => {
    s.pomodoroSessions.push(
      { id: '1', startedAt: at('2026-10-12', 9), durationMin: 25, courseId: c.id, taskId: null },
      { id: '2', startedAt: at('2026-10-14', 9), durationMin: 25, courseId: null, taskId: t.id },
      { id: '3', startedAt: at('2026-10-14', 11), durationMin: 50, courseId: null, taskId: null },
      { id: '4', startedAt: at('2026-10-05', 11), durationMin: 25, courseId: c.id, taskId: null },
    );
  });
  assertDeepEqual(getWeeklyFocus(getState(), '2026-10-12').map((d) => d.minutes), [25, 0, 75, 0, 0, 0, 0]);
  assertDeepEqual(getDayFocus(getState(), '2026-10-14'), { count: 2, minutes: 75 });
  const dist = getFocusByCourse(getState(), '2026-10-12', '2026-10-18');
  assertDeepEqual(dist.map((d) => [d.course ? d.course.name : 'Diğer', d.minutes]), [['Fizik', 50], ['Diğer', 50]]);
});
