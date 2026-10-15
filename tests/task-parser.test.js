import { test, group, assertDeepEqual, assertThrows } from './runner.js';
import { parseTaskInput } from '../js/lib/task-parser.js';

const today = '2026-10-14'; // Çarşamba
const courses = [{ id: 'fiz', name: 'Fizik I', code: 'FİZ101' }, { id: 'mat', name: 'Matematik I', code: 'MAT101' }];
const P = (s) => parseTaskInput(s, { today, courses });
const pick = (r) => [r.title, r.date, r.time, r.courseId, r.priority];

group('görev ayrıştırıcı');
const cases = [
  ['Fizik ödevi yarın 14:00 #fiz !yüksek', ['Fizik ödevi', '2026-10-15', '14:00', 'fiz', 'high']],
  ['Kitap oku', ['Kitap oku', '2026-10-14', null, null, 'medium']],
  ['Lab raporu cuma', ['Lab raporu', '2026-10-16', null, null, 'medium']],
  ['Sunum hazırla çarşamba', ['Sunum hazırla', '2026-10-14', null, null, 'medium']],
  ['Spor pzt 07:30 !düşük', ['Spor', '2026-10-19', '07:30', null, 'low']],
  ['Proje teslimi 20.10', ['Proje teslimi', '2026-10-20', null, null, 'medium']],
  ['Kayıt yenile 05.01', ['Kayıt yenile', '2027-01-05', null, null, 'medium']],
  ['Quiz #mat101 öbür gün', ['Quiz', '2026-10-16', null, 'mat', 'medium']],
  ['Ödev #kimya', ['Ödev #kimya', '2026-10-14', null, null, 'medium']],
  ['Toplantı 9:30 !!', ['Toplantı', '2026-10-14', '09:30', null, 'high']],
  ['Kira öde 1/11/2026 !3', ['Kira öde', '2026-11-01', null, null, 'low']],
  ['Saat 14.30 gibi ara', ['Saat 14.30 gibi ara', '2026-10-14', null, null, 'medium']],
];
for (const [input, expected] of cases) {
  test(`"${input}"`, () => assertDeepEqual(pick(P(input)), expected));
}
test('"yarın 10:00" → hata: başlık boş', () => assertThrows(() => P('yarın 10:00')));
test('boş girdi → hata', () => assertThrows(() => P('   ')));
