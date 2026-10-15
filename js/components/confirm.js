// Onay penceresi: const ok = await confirmDialog({ title, message, confirmText, danger, requireText })
import { html } from '../lib/dom.js';
import { openModal } from './modal.js';

export function confirmDialog({ title = 'Emin misin?', message = '', details = [], confirmText = 'Onayla', cancelText = 'Vazgeç', danger = false, requireText = null }) {
  return new Promise((resolve) => {
    let result = false;
    openModal({
      title,
      size: 'sm',
      content: html`
        ${message ? html`<p>${message}</p>` : ''}
        ${details.length ? html`<ul class="stack-sm small muted" style="list-style: disc; padding-left: 20px">${details.map((d) => html`<li>${d}</li>`)}</ul>` : ''}
        ${requireText ? html`
          <div class="field">
            <label for="confirm-text">Onaylamak için <strong>${requireText}</strong> yaz</label>
            <input id="confirm-text" class="input" autocomplete="off" autofocus>
          </div>` : ''}`,
      footer: html`
        <button type="button" class="btn" data-modal-close>${cancelText}</button>
        <button type="button" class="btn ${danger ? 'btn--danger-solid' : 'btn--primary'}" data-confirm ${requireText ? 'disabled' : ''}>${confirmText}</button>`,
      onMount(el, close) {
        const btn = el.querySelector('[data-confirm]');
        btn.addEventListener('click', () => { result = true; close(); });
        if (requireText) {
          const input = el.querySelector('#confirm-text');
          input.addEventListener('input', () => {
            btn.disabled = input.value.trim().toLocaleUpperCase('tr-TR') !== requireText;
          });
          input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !btn.disabled) btn.click(); });
        } else {
          btn.focus();
        }
      },
      onClose: () => resolve(result),
    });
  });
}
