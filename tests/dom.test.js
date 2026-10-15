import { test, group, assertEqual } from './runner.js';
import { html, raw, escapeHtml } from '../js/lib/dom.js';

group('dom');
test('html şablonu kullanıcı metnini kaçışlar', () => {
  assertEqual(String(html`<b>${'<script>'}</b>`), '<b>&lt;script&gt;</b>');
});
test('iç içe html kaçışlanmaz', () => {
  const inner = html`<i>${'a&b'}</i>`;
  assertEqual(String(html`<b>${inner}</b>`), '<b><i>a&amp;b</i></b>');
});
test('diziler birleşir', () => {
  assertEqual(String(html`<ul>${[1, 2].map((n) => html`<li>${n}</li>`)}</ul>`), '<ul><li>1</li><li>2</li></ul>');
});
test('false / null / undefined boş metin olur', () => {
  assertEqual(String(html`${false}${null}${undefined}x`), 'x');
});
test('raw kaçışlanmaz, tırnaklar kaçışlanır', () => {
  assertEqual(String(html`${raw('<br>')}`), '<br>');
  assertEqual(escapeHtml(`"'`), '&quot;&#39;');
});
