// Tek satırlık görev ekleme kutusu: "Fizik ödevi yarın 14:00 #fiz !yüksek" → canlı önizleme + ekleme.
import { html } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getState } from '../store/store.js';
import { addTask } from '../store/actions/tasks.js';
import { parseTaskInput, describeParsed } from '../lib/task-parser.js';
import { todayKey } from '../lib/dates.js';
import { toast } from './toast.js';

export function quickAddView({ placeholder, id }) {
  return html`
    <form class="today-quick" data-quick-add autocomplete="off">
      <label class="quick-add">
        ${icon('plus')}
        <span class="visually-hidden">Görev ekle</span>
        <input id="${id}" name="q" placeholder="${placeholder}" maxlength="300" aria-describedby="${id}-help">
        <button type="submit" class="btn btn--primary btn--sm">Ekle</button>
      </label>
      <div class="quick-add-preview" data-quick-preview aria-live="polite"></div>
      <p class="xsmall faint quick-add-help" id="${id}-help">İpucu: <code>yarın</code>, <code>cuma</code>, <code>20.10</code>, <code>14:00</code>, <code>#ders</code>, <code>!yüksek</code> yazabilirsin.</p>
    </form>`;
}

export function previewHtml(text) {
  if (!text.trim()) return '';
  const state = getState();
  try {
    const p = parseTaskInput(text, { today: todayKey(), courses: state.courses });
    const parts = describeParsed(p, { today: todayKey(), courses: state.courses });
    return String(html`${parts.map((x, i) => html`<span class="${i === 0 ? 'qa-title' : 'badge'}">${x}</span>`)}`);
  } catch {
    return String(html`<span class="faint">Başlık yaz…</span>`);
  }
}

// defaultDate: () => tarih (yazıda tarih yoksa) ; extra: () => ({ courseId … })
export function bindQuickAdd(root, { defaultDate = todayKey, extra = () => ({}) } = {}) {
  const form = root.querySelector('[data-quick-add]');
  if (!form) return () => {};
  const input = form.querySelector('input');
  const preview = form.querySelector('[data-quick-preview]');
  const onInput = () => { preview.innerHTML = previewHtml(input.value); };
  const onSubmit = (e) => {
    e.preventDefault();
    try {
      const p = parseTaskInput(input.value, { today: defaultDate() || todayKey(), courses: getState().courses });
      const ex = extra();
      addTask({ ...p, courseId: p.courseId || ex.courseId || null });
      input.value = '';
      preview.innerHTML = '';
    } catch (err) {
      toast(err.message, { type: 'error' });
    }
  };
  input.addEventListener('input', onInput);
  form.addEventListener('submit', onSubmit);
  return () => { input.removeEventListener('input', onInput); form.removeEventListener('submit', onSubmit); };
}
