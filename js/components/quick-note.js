// Her yerden hızlı not penceresi (N kısayolu, üst çubuktaki şimşek düğmesi).
import { html } from '../lib/dom.js';
import { openModal } from './modal.js';
import { toast } from './toast.js';
import { addQuickNote } from '../store/actions/quick-notes.js';

let open = false;

export function openQuickNote() {
  if (open) return;
  open = true;
  openModal({
    title: 'Hızlı not',
    size: 'sm',
    content: html`
      <div class="field">
        <label for="qn-text" class="visually-hidden">Not</label>
        <textarea id="qn-text" class="textarea" rows="4" maxlength="5000" placeholder="Aklındakini yaz…" autofocus></textarea>
        <span class="field-hint"><kbd>Enter</kbd> kaydet · <kbd>Shift</kbd>+<kbd>Enter</kbd> yeni satır · <kbd>Esc</kbd> kapat</span>
      </div>`,
    footer: html`
      <a class="btn btn--ghost left" href="#/hizli-notlar" data-modal-close>Tüm notlar</a>
      <button type="button" class="btn btn--primary" data-save>Kaydet</button>`,
    onMount(el, close) {
      const ta = el.querySelector('textarea');
      const save = () => {
        if (!ta.value.trim()) { close(); return; }
        try {
          addQuickNote(ta.value);
          close();
          toast('Not alındı', { type: 'success', duration: 2000, action: { label: 'Gör', onClick: () => { location.hash = '#/hizli-notlar'; } } });
        } catch (err) {
          toast(err.message, { type: 'error' });
        }
      };
      el.querySelector('[data-save]').addEventListener('click', save);
      ta.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); save(); }
      });
    },
    onClose: () => { open = false; },
  });
}
