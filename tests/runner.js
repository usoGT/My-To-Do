// Mini test aracı: test(ad, fn), assertEqual, assertDeepEqual, assertTrue, assertThrows.
const tests = [];
let currentGroup = '';

export function group(name) { currentGroup = name; }

export function test(name, fn) {
  tests.push({ name: currentGroup ? `${currentGroup} › ${name}` : name, fn });
}

const show = (v) => { try { return JSON.stringify(v); } catch { return String(v); } };

export function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) throw new Error(`${msg ? msg + ': ' : ''}beklenen ${show(expected)}, gelen ${show(actual)}`);
}

export function assertDeepEqual(actual, expected, msg = '') {
  const a = show(actual);
  const b = show(expected);
  if (a !== b) throw new Error(`${msg ? msg + ': ' : ''}\n  beklenen ${b}\n  gelen    ${a}`);
}

export function assertTrue(value, msg = 'doğru olmalıydı') {
  if (!value) throw new Error(msg);
}

export function assertThrows(fn, msg = 'hata fırlatmalıydı') {
  let threw = false;
  try { fn(); } catch { threw = true; }
  if (!threw) throw new Error(msg);
}

export async function assertRejects(fn, msg = 'hata fırlatmalıydı') {
  let threw = false;
  try { await fn(); } catch { threw = true; }
  if (!threw) throw new Error(msg);
}

export async function run(target) {
  const results = [];
  for (const t of tests) {
    try {
      await t.fn();
      results.push({ name: t.name, ok: true });
    } catch (err) {
      results.push({ name: t.name, ok: false, error: err && err.message ? err.message : String(err) });
    }
  }
  const passed = results.filter((r) => r.ok).length;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  target.innerHTML = `
    <h1 class="${passed === results.length ? 'ok' : 'fail'}">${passed} / ${results.length} geçti</h1>
    <ul>${results.map((r) => `<li class="${r.ok ? 'ok' : 'fail'}">${r.ok ? '✓' : '✗'} ${esc(r.name)}${r.ok ? '' : `<pre>${esc(r.error)}</pre>`}</li>`).join('')}</ul>`;
  window.__testResults = results;
  window.__testsDone = true;
  return results;
}
