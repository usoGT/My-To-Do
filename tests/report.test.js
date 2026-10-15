import { test, group, assertEqual, assertDeepEqual, assertTrue } from './runner.js';
import { freshStore } from './helpers.js';
import { getState, update } from '../js/store/store.js';
import { addCourse } from '../js/store/actions/courses.js';
import { addTask } from '../js/store/actions/tasks.js';
import { addRoutine, toggleRoutineDone } from '../js/store/actions/routines.js';
import { periodRange, shiftAnchor, periodLabel, computeKpis, delta, buildSeries, buildByCourse, buildRoutineStats, buildReport, reportToCsv } from '../js/store/report.js';

const TODAY = '2026-10-14'; // Çarşamba
const at = (key, h, m = 0) => { const [y, mo, d] = key.split('-').map(Number); return new Date(y, mo - 1, d, h, m).toISOString(); };

group('raporlar');
test('dönem aralıkları ve kaydırma', () => {
  assertDeepEqual(periodRange('gun', TODAY), { start: TODAY, end: TODAY });
  assertDeepEqual(periodRange('hafta', TODAY), { start: '2026-10-12', end: '2026-10-18' });
  assertDeepEqual(periodRange('ay', TODAY), { start: '2026-10-01', end: '2026-10-31' });
  assertDeepEqual(periodRange('ay', '2028-02-10'), { start: '2028-02-01', end: '2028-02-29' });
  assertEqual(shiftAnchor('gun', TODAY, -1), '2026-10-13');
  assertEqual(shiftAnchor('hafta', TODAY, -1), '2026-10-05');
  assertEqual(shiftAnchor('ay', '2026-01-20', -1), '2025-12-01');
});
test('dönem başlıkları', () => {
  assertEqual(periodLabel('hafta', periodRange('hafta', TODAY)), '12–18 Ekim 2026');
  assertEqual(periodLabel('hafta', periodRange('hafta', '2026-11-01')), '26 Ekim – 1 Kasım 2026');
  assertEqual(periodLabel('ay', periodRange('ay', TODAY)), 'Ekim 2026');
});

function setup() {
  freshStore();
  const c = addCourse({ name: 'Fizik' });
  const t1 = addTask({ title: 'a', date: '2026-10-12', courseId: c.id });
  const t2 = addTask({ title: 'b', date: '2026-10-13' });
  addTask({ title: 'c', date: '2026-10-13' }); // yapılmadı → geciken
  addTask({ title: 'd', date: '2026-10-16' }); // gelecek
  update('x', (s) => {
    for (const t of s.tasks) {
      if (t.id === t1.id) { t.done = true; t.doneAt = at('2026-10-12', 15); }
      if (t.id === t2.id) { t.done = true; t.doneAt = at('2026-10-14', 9, 30); }
    }
    s.pomodoroSessions.push(
      { id: 'p1', startedAt: at('2026-10-12', 10), durationMin: 25, courseId: c.id, taskId: null },
      { id: 'p2', startedAt: at('2026-10-14', 9), durationMin: 50, courseId: null, taskId: t1.id },
      { id: 'p3', startedAt: at('2026-10-14', 20), durationMin: 25, courseId: null, taskId: null },
      { id: 'p4', startedAt: at('2026-10-06', 10), durationMin: 25, courseId: null, taskId: null },
    );
  });
  const r = addRoutine({ title: 'Spor', weekdays: [0, 1, 2] }, '2026-10-01');
  toggleRoutineDone(r.id, '2026-10-12', TODAY);
  return { c, r };
}

test('haftalık özet sayıları', () => {
  setup();
  const k = computeKpis(getState(), periodRange('hafta', TODAY), TODAY);
  assertEqual(k.tasksDone, 2);
  assertEqual(k.tasksPlanned, 4);
  assertEqual(k.completionRate, 50);
  assertEqual(k.overdue, 1);
  assertEqual(k.focusMin, 100);
  assertEqual(k.sessions, 3);
  // Pzt yapıldı, Sal yapılmadı, Çar (bugün) yapılmadı → sayılmaz → 1/2
  assertDeepEqual([k.routinesDone, k.routinesPlanned, k.routineRate], [1, 2, 50]);
  assertEqual(k.activeDays, 2);
  assertEqual(k.livedDays, 3);
});
test('değişim yüzdesi', () => {
  assertEqual(delta(150, 100), 50);
  assertEqual(delta(50, 100), -50);
  assertEqual(delta(0, 0), null);
  assertEqual(delta(10, 0), 'yeni');
  assertEqual(delta(null, 5), null);
});
test('seriler: haftalık günler, günlük saatler', () => {
  setup();
  const w = buildSeries(getState(), 'hafta', periodRange('hafta', TODAY), TODAY);
  assertEqual(w.length, 7);
  assertDeepEqual(w.map((s) => s.focusMin), [25, 0, 75, 0, 0, 0, 0]);
  assertDeepEqual(w.map((s) => s.future), [false, false, false, true, true, true, true]);
  const d = buildSeries(getState(), 'gun', periodRange('gun', TODAY), TODAY);
  assertEqual(d[0].key, '08:00');
  assertEqual(d.find((s) => s.key === '09:00').focusMin, 50);
  assertEqual(d.find((s) => s.key === '09:00').tasksDone, 1);
  assertEqual(d.find((s) => s.key === '20:00').focusMin, 25);
});
test('derslere göre: görev üzerinden ders bulunur, dersi olmayan en sonda', () => {
  const { c } = setup();
  const rows = buildByCourse(getState(), periodRange('hafta', TODAY));
  assertEqual(rows[0].course.id, c.id);
  assertDeepEqual([rows[0].focusMin, rows[0].tasksDone], [75, 1]);
  assertEqual(rows[1].course, null);
  assertDeepEqual([rows[1].focusMin, rows[1].tasksDone], [25, 1]);
});
test('rutin istatistikleri ve geçen haftayla kıyas', () => {
  setup();
  const rs = buildRoutineStats(getState(), periodRange('hafta', TODAY), TODAY);
  assertEqual(rs.length, 1);
  assertDeepEqual([rs[0].done, rs[0].planned, rs[0].rate], [1, 2, 50]);
  const rep = buildReport(getState(), 'hafta', TODAY, TODAY);
  assertEqual(rep.prev.focusMin, 25);
  assertTrue(rep.isCurrent);
  assertEqual(rep.hasNext, false);
  assertTrue(rep.insights.some((i) => i.text.includes('%300 arttı')), JSON.stringify(rep.insights));
});
test('CSV: BOM, ; ayraç, tırnak kaçışı', () => {
  setup();
  update('x', (s) => { s.courses[0].name = 'Fizik; "Lab"'; });
  const csv = reportToCsv(buildReport(getState(), 'hafta', TODAY, TODAY));
  assertTrue(csv.startsWith('﻿'));
  assertTrue(csv.includes('Odak (dk);100'));
  assertTrue(csv.includes('"Fizik; ""Lab"""'));
});

import { niceMax } from '../js/components/report-charts.js';
test('grafik üst sınırı (niceMax)', () => {
  assertDeepEqual([0, 1, 3, 7, 23, 100, 130].map((v) => niceMax(v)), [1, 1, 5, 10, 50, 100, 200]);
  assertDeepEqual([0, 1, 3, 5, 7].map((v) => niceMax(v, { integer: true })), [2, 2, 6, 6, 10]);
});
