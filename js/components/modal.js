// Modal pencere (<dialog>). Esc ve arka plana tıklama kapatır; kapanınca odak açan öğeye döner.
import { html, createElement } from '../lib/dom.js';
import { icon } from '../lib/icons.js';

let seq = 0;

export function openModal({ title, content, footer = null, size = 'md', onMount, onClose, className = '' }) {
  const opener = document.activeElement;
  const titleId = `modal-title-${++seq}`;
  const dlg = createElement(html`
    <dialog class="modal modal--${size} ${className}" aria-labelledby="${titleId}">
      <div class="modal-header">
        <h2 id="${titleId}">${title}</h2>
        <button type="button" class="btn btn--ghost btn--icon btn--sm" data-modal-close aria-label="Kapat">${icon('x')}</button>
      </div>
      <div class="modal-body">${content}</div>
      ${footer ? html`<div class="modal-footer">${footer}</div>` : ''}
    </dialog>`);
  document.body.append(dlg);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    if (dlg.open) dlg.close();
  };

  dlg.addEventListener('close', () => {
    closed = true;
    dlg.remove();
    if (onClose) onClose();
    if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
  });

  // Sadece hem basma hem bırakma arka plandaysa kapat (metin seçerken yanlışlıkla kapanmasın).
  let downOnBackdrop = false;
  dlg.addEventListener('mousedown', (e) => { downOnBackdrop = e.target === dlg; });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg && downOnBackdrop) close();
    if (e.target.closest('[data-modal-close]')) close();
  });

  dlg.showModal();
  if (onMount) onMount(dlg, close);
  const first = dlg.querySelector('[autofocus]') || dlg.querySelector('.modal-body input:not([type="hidden"]):not([type="checkbox"]), .modal-body textarea, .modal-body select');
  if (first) first.focus();

  return { el: dlg, close };
}
