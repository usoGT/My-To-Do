// node --test electron/serve.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { resolveAppPath, mimeFor } = require('./serve.cjs');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'planlayici-www-'));
fs.mkdirSync(path.join(root, 'js'));
fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html>');
fs.writeFileSync(path.join(root, 'js', 'app.js'), '');
fs.writeFileSync(path.join(root, 'js', 'şçğ.js'), '');
fs.writeFileSync(path.join(os.tmpdir(), 'gizli.txt'), 'x');

test('kök adres index.html olur', () => {
  assert.strictEqual(resolveAppPath(root, 'app://planlayici/'), path.join(root, 'index.html'));
  assert.strictEqual(resolveAppPath(root, 'app://planlayici/index.html?x=1#/bugun'), path.join(root, 'index.html'));
});
test('alt klasör ve Türkçe dosya adı', () => {
  assert.strictEqual(resolveAppPath(root, 'app://planlayici/js/app.js'), path.join(root, 'js', 'app.js'));
  assert.strictEqual(resolveAppPath(root, 'app://planlayici/js/%C5%9F%C3%A7%C4%9F.js'), path.join(root, 'js', 'şçğ.js'));
});
test('kök dışına çıkılamaz, olmayan dosya null', () => {
  assert.strictEqual(resolveAppPath(root, 'app://planlayici/../gizli.txt'), null);
  assert.strictEqual(resolveAppPath(root, 'app://planlayici/%2e%2e/gizli.txt'), null);
  assert.strictEqual(resolveAppPath(root, 'app://planlayici/js/yok.js'), null);
  assert.strictEqual(resolveAppPath(root, 'app://planlayici/js'), null);
  assert.strictEqual(resolveAppPath(root, 'bozuk adres'), null);
});
test('MIME türleri (modüller için text/javascript şart)', () => {
  assert.strictEqual(mimeFor('a/b.js'), 'text/javascript; charset=utf-8');
  assert.strictEqual(mimeFor('x.CSS'), 'text/css; charset=utf-8');
  assert.strictEqual(mimeFor('m.webmanifest'), 'application/manifest+json; charset=utf-8');
  assert.strictEqual(mimeFor('dosya.bin'), 'application/octet-stream');
});
