import { test, group, assertDeepEqual, assertEqual } from './runner.js';
import { mergeBusy, findFreeSlots, totalFreeMinutes, overlaps } from '../js/lib/time-slots.js';

group('boş zaman');
test('mergeBusy çakışan ve bitişik blokları birleştirir', () => {
  assertDeepEqual(mergeBusy([
    { start: '13:00', end: '14:00' }, { start: '09:00', end: '10:00' },
    { start: '09:30', end: '11:00' }, { start: '11:00', end: '11:30' },
  ]), [{ start: 540, end: 690 }, { start: 780, end: 840 }]);
});
test('plandaki örnek: 4 boşluk, toplam 620 dk', () => {
  const slots = findFreeSlots({
    dayStart: '08:00', dayEnd: '23:00',
    busy: [{ start: '09:00', end: '10:50' }, { start: '13:00', end: '14:50' }, { start: '16:00', end: '17:00' }],
  });
  assertDeepEqual(slots, [
    { start: '08:00', end: '09:00', minutes: 60 },
    { start: '10:50', end: '13:00', minutes: 130 },
    { start: '14:50', end: '16:00', minutes: 70 },
    { start: '17:00', end: '23:00', minutes: 360 },
  ]);
  assertEqual(totalFreeMinutes(slots), 620);
});
test('hiç meşgul yok → tüm gün', () => {
  assertDeepEqual(findFreeSlots({ dayStart: '08:00', dayEnd: '12:00' }), [{ start: '08:00', end: '12:00', minutes: 240 }]);
});
test('tüm gün dolu → boşluk yok', () => {
  assertDeepEqual(findFreeSlots({ dayStart: '08:00', dayEnd: '12:00', busy: [{ start: '07:00', end: '13:00' }] }), []);
});
test('sınır dışına taşan blok kırpılır, 15 dk altı sayılmaz', () => {
  const slots = findFreeSlots({ dayStart: '08:00', dayEnd: '12:00', busy: [{ start: '07:00', end: '08:10' }, { start: '11:50', end: '13:00' }] });
  assertDeepEqual(slots, [{ start: '08:10', end: '11:50', minutes: 220 }]);
});
test('fromMinutes: geçmiş saatler düşülür', () => {
  const slots = findFreeSlots({ dayStart: '08:00', dayEnd: '12:00', busy: [{ start: '09:00', end: '10:00' }], fromMinutes: 9 * 60 + 30 });
  assertDeepEqual(slots, [{ start: '10:00', end: '12:00', minutes: 120 }]);
});
test('overlaps', () => {
  assertEqual(overlaps({ start: '09:00', end: '10:00' }, { start: '10:00', end: '11:00' }), false);
  assertEqual(overlaps({ start: '09:00', end: '10:01' }, { start: '10:00', end: '11:00' }), true);
});
