import { test, group, assertEqual, assertDeepEqual, assertTrue } from './runner.js';
import { diffStates, recordsFromState, applyRemote, keyOf, hasUserData, maxCursor, attachmentIdsOf } from '../js/lib/sync-core.js';
import { createDefaultState } from '../js/store/schema.js';
import { friendlyError, consumeUrlTokens } from '../js/lib/supabase.js';

const base = () => {
  const s = createDefaultState();
  s.tasks = [{ id: 't1', title: 'a' }, { id: 't2', title: 'b' }];
  s.courses = [{ id: 'c1', name: 'Fizik' }];
  s.routineLogs = { '2026-10-14': ['r1'] };
  return s;
};

group('senkron çekirdeği');
test('değişmeyen state → değişiklik yok', () => {
  assertDeepEqual(diffStates(base(), base()), []);
});
test('ekleme, güncelleme, silme, rutin günlüğü, ayar', () => {
  const a = base();
  const b = structuredClone(a);
  b.tasks[0].title = 'a2';
  b.tasks.splice(1, 1);
  b.tasks.push({ id: 't3', title: 'c' });
  b.routineLogs['2026-10-14'] = [];
  b.routineLogs['2026-10-15'] = ['r1'];
  b.settings.name = 'Üsame';
  const d = diffStates(a, b);
  const keys = d.map((x) => `${keyOf(x.collection, x.id)}=${x.data === null ? 'SİL' : 'VAR'}`).sort();
  assertDeepEqual(keys, [
    'routineLogs:2026-10-14=SİL', 'routineLogs:2026-10-15=VAR', 'settings:main=VAR',
    'tasks:t1=VAR', 'tasks:t2=SİL', 'tasks:t3=VAR',
  ]);
});
test('cihaza özel ayar (bildirim izni) senkronlanmaz', () => {
  const a = base();
  const b = structuredClone(a);
  b.settings.notifications = true;
  b.settings.lastBackupAt = '2026-10-14T10:00:00Z';
  assertDeepEqual(diffStates(a, b), []);
});
test('tüm kayıtlar: koleksiyonlar + günlük + ayar', () => {
  const r = recordsFromState(base());
  assertEqual(r.length, 5);
  assertTrue(r.some((x) => x.collection === 'settings' && x.id === 'main' && !('notifications' in x.data)));
});
test('uzaktan gelenler uygulanır; bekleyen yerel değişiklik korunur', () => {
  const s = base();
  s.settings.notifications = true;
  const n = applyRemote(s, [
    { collection: 'tasks', id: 't1', data: { id: 't1', title: 'uzaktan' } },
    { collection: 'tasks', id: 't2', data: null, deleted: true },
    { collection: 'tasks', id: 't9', data: { id: 't9', title: 'yeni' } },
    { collection: 'courses', id: 'c1', data: { id: 'c1', name: 'UZAK' } },
    { collection: 'routineLogs', id: '2026-10-14', data: null, deleted: true },
    { collection: 'settings', id: 'main', data: { name: 'Uzak', notifications: false } },
  ], new Set(['courses:c1']));
  assertEqual(n, 5);
  assertDeepEqual(s.tasks.map((t) => t.title), ['uzaktan', 'yeni']);
  assertEqual(s.courses[0].name, 'Fizik', 'bekleyen yerel değişiklik ezilmemeli');
  assertDeepEqual(s.routineLogs, {});
  assertEqual(s.settings.name, 'Uzak');
  assertEqual(s.settings.notifications, true, 'cihaz ayarı korunur');
});
test('yardımcılar', () => {
  assertTrue(hasUserData(base()));
  assertTrue(!hasUserData(createDefaultState()));
  assertEqual(maxCursor(null, [{ updated_at: '2026-10-14T10:00:00.000Z' }, { updated_at: '2026-10-14T09:00:00.000Z' }]), '2026-10-14T10:00:00.000Z');
  const s = createDefaultState();
  s.courseNotes = [{ id: 'n', attachments: [{ id: 'f1' }, { id: 'f2' }] }];
  assertDeepEqual([...attachmentIdsOf(s)], ['f1', 'f2']);
});

group('hesap istemcisi');
test('Türkçe hata mesajları', () => {
  assertEqual(friendlyError(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' }), 'E-posta ya da şifre hatalı.');
  assertEqual(friendlyError(422, { error_code: 'user_already_exists' }), 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.');
  assertEqual(friendlyError(422, { error_code: 'weak_password' }), 'Şifre en az 6 karakter olmalı.');
  assertEqual(friendlyError(500, {}), 'Sunucuda bir sorun var. Biraz sonra tekrar dene.');
});
test('bağlantıdan dönüşte adres ayrıştırılır', () => {
  const payload = btoa(JSON.stringify({ sub: 'u1', email: 'a@b.co', user_metadata: { name: 'Üsame'.normalize() } }).replace(/[^\x00-\x7F]/g, '')).replace(/=+$/, '');
  const fake = { hash: `#access_token=x.${payload}.y&refresh_token=r&expires_in=3600&type=recovery` };
  const saved = localStorage.getItem('planlayici-session');
  const r = consumeUrlTokens(fake);
  assertEqual(r.type, 'recovery');
  assertEqual(JSON.parse(localStorage.getItem('planlayici-session')).user.email, 'a@b.co');
  if (saved) localStorage.setItem('planlayici-session', saved); else localStorage.removeItem('planlayici-session');
  assertEqual(consumeUrlTokens({ hash: '#/bugun' }), null);
  assertEqual(consumeUrlTokens({ hash: '#error=access_denied&error_description=Email+link+is+invalid' }).error, 'Email link is invalid');
});
