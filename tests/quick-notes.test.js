import { test, group, assertEqual, assertThrows, assertDeepEqual } from './runner.js';
import { freshStore } from './helpers.js';
import { getState } from '../js/store/store.js';
import { addQuickNote, updateQuickNote, deleteQuickNote, restoreQuickNote, markConverted } from '../js/store/actions/quick-notes.js';
import { firstLine, restLines } from '../js/lib/text.js';

group('hızlı notlar');
test('ekle, düzenle, sil, geri al', () => {
  freshStore();
  assertThrows(() => addQuickNote('   '));
  const n = addQuickNote('  Kayıt yenile\nöğrenci işleri  ');
  assertEqual(n.text, 'Kayıt yenile\nöğrenci işleri');
  updateQuickNote(n.id, 'Kayıt yenile!');
  assertEqual(getState().quickNotes[0].text, 'Kayıt yenile!');
  const removed = deleteQuickNote(n.id);
  assertEqual(getState().quickNotes.length, 0);
  restoreQuickNote(removed);
  assertEqual(getState().quickNotes.length, 1);
});
test('dönüştürme işareti', () => {
  freshStore();
  const n = addQuickNote('a');
  markConverted(n.id, { type: 'task', id: 't1' });
  assertDeepEqual(getState().quickNotes[0].convertedTo, { type: 'task', id: 't1' });
});
test('ilk satır / kalan satırlar', () => {
  assertEqual(firstLine('Başlık\nikinci\nüçüncü'), 'Başlık');
  assertEqual(restLines('Başlık\nikinci\nüçüncü'), 'ikinci\nüçüncü');
  assertEqual(restLines('Tek'), '');
});
