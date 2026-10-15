import { test, group, assertEqual, assertThrows, assertTrue } from './runner.js';
import { freshStore } from './helpers.js';
import { updateSettings, updatePomodoroSettings } from '../js/store/actions/settings.js';
import { getState } from '../js/store/store.js';

group('ayarlar');
test('ad ve tema kaydedilir', () => {
  freshStore();
  updateSettings({ name: '  Taha ', theme: 'dark' });
  assertEqual(getState().settings.name, 'Taha');
  assertEqual(getState().settings.theme, 'dark');
});
test('geçersiz tema reddedilir', () => {
  freshStore();
  assertThrows(() => updateSettings({ theme: 'mor' }));
});
test('gün saatleri: bitiş başlangıçtan en az 4 saat sonra', () => {
  freshStore();
  assertThrows(() => updateSettings({ dayStart: '10:00', dayEnd: '12:00' }));
  assertThrows(() => updateSettings({ dayEnd: '07:00' }));
  updateSettings({ dayStart: '07:00', dayEnd: '22:30' });
  assertEqual(getState().settings.dayEnd, '22:30');
});
test('Pomodoro aralık dışı değerleri reddeder', () => {
  freshStore();
  assertThrows(() => updatePomodoroSettings({ focusMin: 0 }));
  assertThrows(() => updatePomodoroSettings({ focusMin: 91 }));
  assertThrows(() => updatePomodoroSettings({ longBreakEvery: 1 }));
  assertThrows(() => updatePomodoroSettings({ shortBreakMin: 2.5 }));
  updatePomodoroSettings({ focusMin: '30', sound: false });
  assertEqual(getState().settings.pomodoro.focusMin, 30);
  assertTrue(getState().settings.pomodoro.sound === false);
});
