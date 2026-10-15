import { test, group, assertEqual, assertTrue, assertDeepEqual } from './runner.js';
import { initStore, getState, update, subscribe, createMemoryStorage, replaceState } from '../js/store/store.js';
import { createDefaultState, migrate, SCHEMA_VERSION } from '../js/store/schema.js';

group('store');
test('boş depolamada varsayılan state oluşur ve kaydedilir', () => {
  const storage = createMemoryStorage();
  initStore({ storage, storageKey: 'k' });
  assertDeepEqual(getState(), createDefaultState());
  assertTrue(storage.getItem('k') !== null);
});
test('update dinleyiciyi çağırır ve kaydeder', () => {
  const storage = createMemoryStorage();
  initStore({ storage, storageKey: 'k' });
  let called = '';
  subscribe((s, label) => { called = label; });
  update('test/add', (s) => { s.settings.name = 'Taha'; });
  assertEqual(called, 'test/add');
  assertEqual(JSON.parse(storage.getItem('k')).settings.name, 'Taha');
});
test('update eski state nesnesini değiştirmez', () => {
  initStore({ storage: createMemoryStorage(), storageKey: 'k' });
  const before = getState();
  update('x', (s) => { s.tasks.push({ id: 1 }); });
  assertEqual(before.tasks.length, 0);
  assertEqual(getState().tasks.length, 1);
});
test('yeniden açılınca aynı veri gelir', () => {
  const storage = createMemoryStorage();
  initStore({ storage, storageKey: 'k' });
  update('x', (s) => { s.courses.push({ id: 'c1', name: 'Fizik' }); });
  initStore({ storage, storageKey: 'k' });
  assertEqual(getState().courses[0].name, 'Fizik');
});
test('bozuk JSON çökertmez, yedeklenir', () => {
  const storage = createMemoryStorage({ k: '{bozuk' });
  initStore({ storage, storageKey: 'k' });
  assertEqual(getState().version, SCHEMA_VERSION);
  assertTrue(Object.keys(storage._data).some((x) => x.startsWith('k-bozuk-')));
});
test('migrate eksik alanları tamamlar', () => {
  const m = migrate({ version: 1, settings: { name: 'A', pomodoro: { focusMin: 30 } }, tasks: [{ id: 't' }] });
  assertEqual(m.settings.name, 'A');
  assertEqual(m.settings.pomodoro.focusMin, 30);
  assertEqual(m.settings.pomodoro.shortBreakMin, 5);
  assertEqual(m.settings.dayStart, '08:00');
  assertEqual(m.tasks.length, 1);
  assertDeepEqual(m.routines, []);
  assertDeepEqual(m.routineLogs, {});
});
test('migrate geçersiz girdide varsayılan döner', () => {
  assertDeepEqual(migrate(null), createDefaultState());
  assertDeepEqual(migrate([1, 2]), createDefaultState());
});
test('replaceState tüm veriyi değiştirir', () => {
  initStore({ storage: createMemoryStorage(), storageKey: 'k' });
  update('x', (s) => { s.tasks.push({ id: 'a' }); });
  replaceState({ settings: { name: 'B' } });
  assertEqual(getState().tasks.length, 0);
  assertEqual(getState().settings.name, 'B');
});
