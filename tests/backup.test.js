import { test, group, assertEqual, assertTrue } from './runner.js';
import { createBackup, validateBackup, parseBackupText, blobToBase64, base64ToBlob } from '../js/lib/backup.js';
import { createDefaultState, SCHEMA_VERSION } from '../js/store/schema.js';

group('yedek');
test('geçerli yedek doğrulanır', () => {
  const st = createDefaultState();
  st.settings.name = 'Taha';
  const r = validateBackup(createBackup(st));
  assertTrue(r.ok);
  assertEqual(r.state.settings.name, 'Taha');
});
test('başka JSON reddedilir', () => {
  const r = validateBackup({ a: 1 });
  assertTrue(!r.ok);
  assertTrue(r.error.includes('My to do'));
});
test('bozuk metin reddedilir', () => {
  assertTrue(!parseBackupText('{bozuk').ok);
});
test('daha yeni sürüm reddedilir', () => {
  const r = validateBackup({ app: 'planlayici', schemaVersion: SCHEMA_VERSION + 1, state: {} });
  assertTrue(!r.ok);
});
test('eksik alanlı yedek migrate ile tamamlanır', () => {
  const r = validateBackup({ app: 'planlayici', schemaVersion: 1, state: { settings: { name: 'X' } } });
  assertTrue(r.ok);
  assertEqual(r.state.settings.dayStart, '08:00');
  assertEqual(r.state.tasks.length, 0);
});
test('base64 gidiş-dönüş', async () => {
  const b64 = await blobToBase64(new Blob(['merhaba ğüş'], { type: 'text/plain' }));
  const back = await base64ToBlob(b64, 'text/plain').text();
  assertEqual(back, 'merhaba ğüş');
});
