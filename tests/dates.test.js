import { test, group, assertEqual, assertDeepEqual, assertTrue } from './runner.js';
import * as D from '../js/lib/dates.js';

group('dates');
test('toDateKey yerel tarih verir', () => assertEqual(D.toDateKey(new Date(2026, 9, 14)), '2026-10-14'));
test('parseDate gün kaydırmaz', () => {
  assertEqual(D.parseDate('2026-10-14').getDate(), 14);
  assertEqual(D.parseDate('2026-01-01').getMonth(), 0);
});
test('weekdayIndex: 0 = Pazartesi', () => {
  assertEqual(D.weekdayIndex('2026-10-14'), 2);
  assertEqual(D.weekdayIndex('2026-10-18'), 6);
  assertEqual(D.weekdayIndex('2026-10-19'), 0);
});
test('addDays ay ve yıl geçişleri', () => {
  assertEqual(D.addDays('2026-10-31', 1), '2026-11-01');
  assertEqual(D.addDays('2026-03-28', 2), '2026-03-30');
  assertEqual(D.addDays('2026-12-31', 1), '2027-01-01');
  assertEqual(D.addDays('2026-03-01', -1), '2026-02-28');
});
test('diffDays', () => {
  assertEqual(D.diffDays('2026-10-14', '2026-10-20'), 6);
  assertEqual(D.diffDays('2026-10-14', '2026-10-01'), -13);
});
test('startOfWeek Pazartesi', () => {
  assertEqual(D.startOfWeek('2026-10-14'), '2026-10-12');
  assertEqual(D.startOfWeek('2026-10-18'), '2026-10-12');
  assertEqual(D.startOfWeek('2026-10-19'), '2026-10-19');
});
test('weekDays 7 gün', () => {
  const w = D.weekDays('2026-10-14');
  assertEqual(w.length, 7);
  assertEqual(w[0], '2026-10-12');
  assertEqual(w[6], '2026-10-18');
});
test('monthGrid 42 gün, Pazartesi başlangıç', () => {
  const g = D.monthGrid('2026-10');
  assertEqual(g.length, 42);
  assertEqual(g[0].key, '2026-09-28');
  assertEqual(g[0].inMonth, false);
  assertDeepEqual(g.find((x) => x.key === '2026-10-01'), { key: '2026-10-01', inMonth: true });
});
test('addMonths', () => {
  assertEqual(D.addMonths('2026-12', 1), '2027-01');
  assertEqual(D.addMonths('2026-01', -1), '2025-12');
});
test('yearDays', () => {
  assertEqual(D.yearDays('2026').length, 365);
  assertEqual(D.yearDays('2028').length, 366);
});
test('saat dönüşümleri', () => {
  assertEqual(D.timeToMinutes('09:30'), 570);
  assertEqual(D.minutesToTime(1380), '23:00');
  assertEqual(D.minutesToTime(65), '01:05');
});
test('biçimlendirme', () => {
  assertEqual(D.formatDateLong('2026-10-14'), '14 Ekim 2026, Çarşamba');
  assertEqual(D.formatDateShort('2026-10-14'), '14 Eki');
  assertEqual(D.formatDuration(80), '1 sa 20 dk');
  assertEqual(D.formatDuration(45), '45 dk');
  assertEqual(D.formatDuration(120), '2 sa');
  assertEqual(D.formatRelativeDay('2026-10-15', '2026-10-14'), 'Yarın');
  assertEqual(D.formatRelativeDay('2026-10-20', '2026-10-14'), '20 Eki Sal');
});
test('geçerlilik kontrolleri', () => {
  assertTrue(D.isValidDateKey('2026-02-28'));
  assertTrue(!D.isValidDateKey('2026-02-30'));
  assertTrue(D.isValidTime('23:59'));
  assertTrue(!D.isValidTime('24:00'));
});
test('selamlama', () => {
  assertEqual(D.greeting(new Date(2026, 9, 14, 9)), 'Günaydın');
  assertEqual(D.greeting(new Date(2026, 9, 14, 14)), 'İyi günler');
  assertEqual(D.greeting(new Date(2026, 9, 14, 20)), 'İyi akşamlar');
  assertEqual(D.greeting(new Date(2026, 9, 14, 2)), 'İyi geceler');
});
