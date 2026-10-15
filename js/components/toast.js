// Kısa bildirimler. toast('Kaydedildi', { type: 'success', action: { label: 'Geri al', onClick } })
import { html, createElement } from '../lib/dom.js';
import { icon } from '../lib/icons.js';

let container = null;
const ICONS = { info: 'info', success: 'check', error: 'alert' };

function ensureContainer() {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.className = 'toasts';
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('role', 'status');
  document.body.append(container);
  return container;
}

export function toast(message, { type = 'info', action = null, duration = 4000 } = {}) {
  const root = ensureContainer();
  const el = createElement(html`
    <div class="toast toast--${type}">
      ${icon(ICONS[type] || 'info')}
      <span class="toast-msg">${message}</span>
      ${action ? html`<button type="button" data-toast-action>${action.label}</button>` : ''}
      <button type="button" data-toast-close aria-label="Kapat">${icon('x')}</button>
    </div>`);
  root.append(el);
  while (root.children.length > 3) root.firstElementChild.remove();

  let timer = null;
  const remove = () => {
    clearTimeout(timer);
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 200);
  };
  const arm = () => { timer = setTimeout(remove, duration); };
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', arm);
  el.querySelector('[data-toast-close]').addEventListener('click', remove);
  if (action) {
    el.querySelector('[data-toast-action]').addEventListener('click', () => {
      action.onClick();
      remove();
    });
  }
  arm();
  return remove;
}
