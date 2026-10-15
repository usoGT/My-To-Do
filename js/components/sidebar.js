// Kenar çubuğu (masaüstü) / çekmece (telefon) ve mobil alt menü.
import { html } from '../lib/dom.js';
import { icon } from '../lib/icons.js';

export const NAV_ITEMS = [
  { path: '/bugun', label: 'Bugün', icon: 'sun' },
  { path: '/planlayici', label: 'Planlayıcı', icon: 'calendar' },
  { path: '/hizli-notlar', label: 'Hızlı Notlar', icon: 'zap' },
  { path: '/rutinler', label: 'Rutinler', icon: 'repeat' },
  { path: '/program', label: 'Ders Programı', icon: 'grid' },
  { path: '/ders-notlari', label: 'Ders Notları', icon: 'book' },
  { path: '/pomodoro', label: 'Pomodoro', icon: 'timer' },
  { path: '/raporlar', label: 'Raporlarım', icon: 'chart' },
];

export const SETTINGS_ITEM = { path: '/ayarlar', label: 'Ayarlar', icon: 'settings' };

const BOTTOM_ITEMS = [
  { path: '/bugun', label: 'Bugün', icon: 'sun' },
  { path: '/planlayici', label: 'Planlayıcı', icon: 'calendar' },
  { path: '/program', label: 'Program', icon: 'grid' },
  { path: '/pomodoro', label: 'Pomodoro', icon: 'timer' },
];

const navLink = (item) => html`
  <a class="nav-link" href="#${item.path}" data-path="${item.path}">
    ${icon(item.icon)}<span class="truncate">${item.label}</span>
  </a>`;

const courseLink = (c) => html`
  <a class="nav-link c-${c.color}" href="#/ders/${c.id}" data-path="/ders/${c.id}">
    <span class="dot"></span><span class="truncate">${c.name}</span>
  </a>`;

export function sidebarView(courses = []) {
  return html`
    <a class="brand" href="#/bugun" aria-label="My to do ana sayfa">
      <span class="brand-mark">${icon('logo')}</span>
      <span>My to do</span>
    </a>
    <nav class="nav" aria-label="Ana menü">
      ${NAV_ITEMS.map(navLink)}
    </nav>
    <div class="nav-section-title">Derslerim</div>
    <nav class="nav" aria-label="Dersler" id="nav-courses">
      ${courses.length
        ? courses.map(courseLink)
        : html`<a class="nav-empty" href="#/program">Henüz ders yok. Ders Programı'ndan ekle.</a>`}
    </nav>
    <div class="sidebar-footer">
      <div id="sidebar-account"></div>
      <nav class="nav" aria-label="Ayarlar">${navLink(SETTINGS_ITEM)}</nav>
    </div>`;
}

export function bottombarView() {
  return html`
    ${BOTTOM_ITEMS.map((item) => html`
      <a href="#${item.path}" data-path="${item.path}">${icon(item.icon)}<span>${item.label}</span></a>`)}
    <button type="button" data-action="open-drawer" aria-label="Menüyü aç" aria-controls="sidebar" aria-expanded="false">
      ${icon('menu')}<span>Menü</span>
    </button>`;
}

// Kenar çubuğundaki hesap satırı: giriş yapılmışsa ad + eşitleme durumu, değilse "Giriş yap"
export function accountChipView({ user, configured, syncState, syncLabel }) {
  if (!configured) return '';
  if (!user) {
    return html`<a class="nav-link account-chip" href="#/hesap" data-path="/hesap">${icon('user')}<span class="truncate">Giriş yap / Kayıt ol</span></a>`;
  }
  const initial = (user.name || user.email || '?')[0].toLocaleUpperCase('tr-TR');
  return html`
    <a class="nav-link account-chip" href="#/hesap" data-path="/hesap" title="${syncLabel}">
      <span class="avatar">${initial}</span>
      <span class="grow" style="min-width:0">
        <span class="account-chip-name truncate">${user.name || user.email}</span>
        <span class="account-chip-sync"><span class="sync-dot tone-${syncState}"></span>${syncLabel}</span>
      </span>
    </a>`;
}

// Aktif sayfayı menülerde işaretler.
export function markActive(path) {
  document.querySelectorAll('[data-path]').forEach((a) => {
    const p = a.getAttribute('data-path');
    const active = path === p || (p !== '/' && path.startsWith(p + '/') && !p.startsWith('/ders/'));
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}
