import { test, group, assertEqual, assertTrue } from './runner.js';
import { normalizeTr, matches, highlight } from '../js/lib/text.js';

group('text');
test('normalizeTr Türkçe karakterler', () => {
  assertEqual(normalizeTr('İSTANBUL Çığ'), 'istanbul cig');
  assertEqual(normalizeTr('  ŞÖYLE   Ödev  '), 'soyle odev');
  assertEqual(normalizeTr('IŞIK'), 'isik');
});
test('matches', () => {
  assertTrue(matches('Fizik Ödevi', 'odev'));
  assertTrue(matches('Fizik Ödevi', 'fiz ÖDE'));
  assertTrue(!matches('Fizik Ödevi', 'kimya'));
});
test('highlight kaçışlı vurgu', () => {
  assertEqual(String(highlight('Ödev <b>', 'odev')), '<mark>Ödev</mark> &lt;b&gt;');
});
