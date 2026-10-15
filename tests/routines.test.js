import { test, group, assertEqual, assertThrows, assertDeepEqual, assertTrue } from './runner.js';
import { freshStore } from './helpers.js';
import { getState } from '../js/store/store.js';
import { addRoutine, updateRoutine, toggleRoutineDone, deleteRoutine, setRoutineArchived } from '../js/store/actions/routines.js';
import { getRoutinesForDate, getRoutineStreak, getRoutineBestStreak, getRoutineCompletionRate } from '../js/store/selectors.js';

const TODAY = '2026-10-14'; // Çarşamba
// Pzt-Çar-Cum rutini, 2026-09-28'de oluşturuldu
function setup(doneDays) {
  freshStore();
  const r = addRoutine({ title: 'Spor', weekdays: [0, 2, 4] }, '2026-09-28');
  for (const d of doneDays) toggleRoutineDone(r.id, d, TODAY);
  return r;
}

group('rutinler');
test('doğrulama', () => {
  freshStore();
  assertThrows(() => addRoutine({ title: '', weekdays: [0] }));
  assertThrows(() => addRoutine({ title: 'a', weekdays: [] }));
  assertThrows(() => addRoutine({ title: 'a', weekdays: [0], durationMin: 2 }));
  const r = addRoutine({ title: 'a', weekdays: '4,0,0' });
  assertDeepEqual(r.weekdays, [0, 4]);
  assertEqual(r.durationMin, 30);
});
test('sadece seçili günlerde listelenir', () => {
  const r = setup([]);
  assertEqual(getRoutinesForDate(getState(), '2026-10-14').length, 1);
  assertEqual(getRoutinesForDate(getState(), '2026-10-15').length, 0);
  assertEqual(getRoutinesForDate(getState(), '2026-09-21').length, 0, 'oluşturulmadan önce');
  setRoutineArchived(r.id, true);
  assertEqual(getRoutinesForDate(getState(), '2026-10-14').length, 0, 'arşiv');
});
test('seri örnek 1: bugün yapılmadı, atlanır → 3', () => {
  const r = setup(['2026-10-12', '2026-10-09', '2026-10-07']);
  assertEqual(getRoutineStreak(getState(), r.id, TODAY), 3);
});
test('seri örnek 2: bugün de yapıldı → 4', () => {
  const r = setup(['2026-10-12', '2026-10-09', '2026-10-07', '2026-10-14']);
  assertEqual(getRoutineStreak(getState(), r.id, TODAY), 4);
});
test('seri örnek 3: arada eksik gün → 1', () => {
  const r = setup(['2026-10-12', '2026-10-07']);
  assertEqual(getRoutineStreak(getState(), r.id, TODAY), 1);
});
test('seri örnek 4: hiç yapılmamış → 0', () => {
  const r = setup([]);
  assertEqual(getRoutineStreak(getState(), r.id, TODAY), 0);
});
test('en iyi seri ve oran', () => {
  const r = setup(['2026-09-28', '2026-09-30', '2026-10-02', '2026-10-05', '2026-10-09', '2026-10-12']);
  assertEqual(getRoutineBestStreak(getState(), r.id, TODAY), 4);
  // 28.09–13.10 arası planlı günler: 28,30,2,5,7,9,12 = 7 gün, 6'sı yapıldı (bugün yapılmadı, sayılmaz)
  assertEqual(getRoutineCompletionRate(getState(), r.id, TODAY), 86);
});
test('gelecek gün işaretlenemez; geçmişe işaret başlangıcı çeker', () => {
  const r = setup([]);
  assertThrows(() => toggleRoutineDone(r.id, '2026-10-15', TODAY));
  toggleRoutineDone(r.id, '2026-09-21', TODAY);
  assertEqual(getState().routines[0].startDate, '2026-09-21');
});
test('işaret kaldırma ve silme logları temizler', () => {
  const r = setup(['2026-10-12']);
  toggleRoutineDone(r.id, '2026-10-12', TODAY);
  assertDeepEqual(getState().routineLogs, {});
  toggleRoutineDone(r.id, '2026-10-12', TODAY);
  deleteRoutine(r.id);
  assertDeepEqual(getState().routineLogs, {});
  assertEqual(getState().routines.length, 0);
});
test('güncelleme', () => {
  const r = setup([]);
  updateRoutine(r.id, { weekdays: [1], time: '07:30' });
  assertDeepEqual(getState().routines[0].weekdays, [1]);
  assertTrue(getState().routines[0].time === '07:30');
});
