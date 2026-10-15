// Bilinmeyen adresler için sayfa
import { html } from '../lib/dom.js';
import { icon } from '../lib/icons.js';

export default {
  title: 'Sayfa bulunamadı',
  render(root) {
    root.innerHTML = String(html`
      <div class="empty" style="margin-top: var(--space-8)">
        <div class="empty-icon">${icon('alert')}</div>
        <h3>Sayfa bulunamadı</h3>
        <p>Aradığın sayfa yok ya da taşınmış olabilir.</p>
        <a class="btn btn--primary" href="#/bugun">${icon('sun')} Bugün'e dön</a>
      </div>`);
  },
};
