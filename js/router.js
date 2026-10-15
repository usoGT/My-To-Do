// Hash router: #/yol/parametre?anahtar=değer
// Sayfalar dinamik import() ile yüklenir. Her sayfa { title, render(root, ctx) } dışa açar;
// render'ın döndürdüğü fonksiyon sayfadan çıkarken çağrılır (temizlik).

export const ROUTES = [
  { path: '/bugun', load: () => import('./pages/today.js') },
  { path: '/planlayici', load: () => import('./pages/planner.js') },
  { path: '/hizli-notlar', load: () => import('./pages/quick-notes.js') },
  { path: '/rutinler', load: () => import('./pages/routines.js') },
  { path: '/program', load: () => import('./pages/schedule.js') },
  { path: '/ders/:id', load: () => import('./pages/course.js') },
  { path: '/ders-notlari', load: () => import('./pages/course-notes.js') },
  { path: '/pomodoro', load: () => import('./pages/pomodoro.js') },
  { path: '/raporlar', load: () => import('./pages/reports.js') },
  { path: '/hesap', load: () => import('./pages/account.js') },
  { path: '/ayarlar', load: () => import('./pages/settings.js') },
];

const DEFAULT_PATH = '/bugun';
const listeners = new Set();
let root = null;
let cleanup = null;
let current = { path: '', params: {}, query: {} };
let renderToken = 0;

// "#/ders/abc?not=1" → { path: '/ders/abc', query: { not: '1' } }
export function parseHash(hash) {
  const clean = (hash || '').replace(/^#/, '');
  const [pathPart, queryPart = ''] = clean.split('?');
  const path = pathPart && pathPart !== '/' ? pathPart.replace(/\/+$/, '') : '';
  const query = Object.fromEntries(new URLSearchParams(queryPart));
  return { path, query };
}

// '/ders/:id' kalıbı ile '/ders/abc' eşleşirse { id: 'abc' } döner, eşleşmezse null.
export function matchPath(pattern, path) {
  const a = pattern.split('/').filter(Boolean);
  const b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

export function buildHash(path, query = {}) {
  const entries = Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const qs = entries.length ? '?' + new URLSearchParams(entries).toString() : '';
  return '#' + path + qs;
}

export function navigate(path, query = {}, { replace = false } = {}) {
  const hash = buildHash(path, query);
  if (replace) {
    history.replaceState(null, '', hash);
    handleChange();
  } else if (location.hash === hash) {
    handleChange();
  } else {
    location.hash = hash;
  }
}

// Sayfayı yeniden çizmeden adresteki sorgu parametrelerini günceller (geri tuşu için kayıt bırakır).
export function updateQuery(query, { replace = false } = {}) {
  const hash = buildHash(current.path, { ...current.query, ...query });
  if (location.hash === hash) return;
  if (replace) history.replaceState(null, '', hash);
  else history.pushState(null, '', hash);
  current = { ...current, query: parseHash(hash).query };
  listeners.forEach((fn) => fn(current));
}

export const getCurrentRoute = () => current;

export function onRouteChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function startRouter(container) {
  root = container;
  window.addEventListener('hashchange', handleChange);
  window.addEventListener('popstate', handleChange);
  handleChange();
}

async function handleChange() {
  const { path, query } = parseHash(location.hash);
  if (!path) {
    history.replaceState(null, '', '#' + DEFAULT_PATH);
    return handleChange();
  }

  // Aynı sayfada sadece sorgu değiştiyse (updateQuery ile geri/ileri) sayfa yeniden yüklenir.
  const token = ++renderToken;
  let route = null;
  let params = {};
  for (const r of ROUTES) {
    const m = matchPath(r.path, path);
    if (m) { route = r; params = m; break; }
  }

  let page;
  try {
    const mod = await (route ? route.load() : import('./pages/not-found.js'));
    page = mod.default;
  } catch (err) {
    console.error('Sayfa yüklenemedi:', err);
    page = (await import('./pages/not-found.js')).default;
  }
  if (token !== renderToken) return; // bu arada başka bir sayfaya geçildi

  if (typeof cleanup === 'function') {
    try { cleanup(); } catch (err) { console.error(err); }
  }
  cleanup = null;

  current = { path, params, query, pattern: route ? route.path : null };
  root.innerHTML = '';
  root.scrollTop = 0;
  window.scrollTo(0, 0);

  const setTitle = (title) => {
    document.title = title ? `${title} · My to do` : 'My to do';
    listeners.forEach((fn) => fn({ ...current, title }));
  };
  setTitle(page.title);

  try {
    cleanup = page.render(root, { params, query, setTitle }) || null;
  } catch (err) {
    console.error('Sayfa çizilemedi:', err);
    root.innerHTML = '<div class="empty"><h3>Bir hata oluştu</h3><p>Bu sayfa açılırken bir sorun çıktı. Sayfayı yenilemeyi dene.</p></div>';
  }
}
