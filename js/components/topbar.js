// Üst çubuk: sayfa başlığı, tarih, arama, hızlı not, tema düğmesi, mini sayaç alanı.
import { html } from '../lib/dom.js';
import { icon } from '../lib/icons.js';

export function topbarView({ title, dateText, isDark }) {
  return html`
    <div class="topbar-title">
      <strong class="truncate" id="topbar-title">${title}</strong>
      <span id="topbar-date">${dateText}</span>
    </div>
    <div class="topbar-actions">
      <span id="mini-timer-slot"></span>
      <span id="sync-slot"></span>
      <button type="button" class="search-trigger" data-action="open-palette" aria-label="Ara ve komut çalıştır (Ctrl K)">
        ${icon('search')}<span class="label">Ara…</span><kbd>Ctrl K</kbd>
      </button>
      <button type="button" class="btn btn--ghost btn--icon" data-action="quick-note" aria-label="Hızlı not al (N)" title="Hızlı not (N)">${icon('zap')}</button>
      <button type="button" class="btn btn--ghost btn--icon" data-action="toggle-theme" aria-label="${isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}" title="Temayı değiştir">${icon(isDark ? 'sun' : 'moon')}</button>
    </div>`;
}
