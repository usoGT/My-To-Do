// Tema: 'light' | 'dark' | 'system'. <html data-theme> özniteliğini ayarlar.
// Tercih store'daki settings.theme'den gelir (Faz 3).
const media = window.matchMedia('(prefers-color-scheme: dark)');
let pref = 'system';

export function resolveTheme(p) {
  if (p === 'light' || p === 'dark') return p;
  return media.matches ? 'dark' : 'light';
}

export function applyTheme(p = pref) {
  pref = p;
  const t = resolveTheme(p);
  document.documentElement.setAttribute('data-theme', t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#0F1115' : '#F6F6F3');
}

export const isDarkNow = () => document.documentElement.getAttribute('data-theme') === 'dark';

// Sistem teması değişince, tercih 'system' ise uygula.
export function watchSystemTheme(onChange) {
  media.addEventListener('change', () => {
    if (pref === 'system') { applyTheme('system'); if (onChange) onChange(); }
  });
}

// Faz 1'deki geçici anahtardan eski tercihi bir kez okur ve siler.
export function takeLegacyThemePref() {
  try {
    const v = localStorage.getItem('planlayici-theme');
    if (v) localStorage.removeItem('planlayici-theme');
    return v;
  } catch {
    return null;
  }
}
