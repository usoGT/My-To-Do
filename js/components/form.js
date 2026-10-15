// Modal formları için yardımcılar: gönderimi yakalar, hatayı ilgili alanın altında gösterir.
import { html } from '../lib/dom.js';

export const formError = () => html`<p class="field-error" data-form-error role="alert"></p>`;

export function clearErrors(form) {
  form.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'));
  form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });
}

export function showError(form, err) {
  const field = err && err.field ? form.querySelector(`[name="${err.field}"]`) : null;
  const msg = err && err.message ? err.message : 'Bir hata oluştu.';
  if (field) {
    field.setAttribute('aria-invalid', 'true');
    const box = field.closest('.field')?.querySelector('.field-error');
    if (box) { box.textContent = msg; field.focus(); return; }
  }
  const general = form.querySelector('[data-form-error]');
  if (general) general.textContent = msg;
}

// onSubmit(values, form) → true/undefined ise kapat; hata fırlatırsa göster.
export function bindForm(form, onSubmit, close) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);
    try {
      const keepOpen = await onSubmit(new FormData(form), form);
      if (keepOpen !== false && close) close();
    } catch (err) {
      if (!err || err.name !== 'ValidationError') console.error(err);
      showError(form, err);
    }
  });
  // Enter ile gönder (textarea hariç)
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      form.requestSubmit();
    }
  });
}

// Segment/renk/gün seçici düğmelerinin aria-pressed durumunu yönetir; değeri gizli input'a yazar.
export function bindPressGroup(root, groupSelector, { multiple = false, onChange } = {}) {
  root.querySelectorAll(groupSelector).forEach((group) => {
    const input = group.querySelector('input[type="hidden"]');
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-value]');
      if (!btn) return;
      if (multiple) {
        btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      } else {
        group.querySelectorAll('button[data-value]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      }
      const values = [...group.querySelectorAll('button[data-value][aria-pressed="true"]')].map((b) => b.dataset.value);
      if (input) input.value = multiple ? values.join(',') : (values[0] || '');
      if (onChange) onChange(multiple ? values : values[0], group);
    });
  });
}
