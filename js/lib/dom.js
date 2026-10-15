// HTML üretimi ve DOM yardımcıları.
// Kullanıcı metni her zaman html`` şablonu ile kaçışlanarak HTML'e girer.

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export class SafeHtml {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}

// Güvenilir (kendi ürettiğimiz) HTML'i kaçışlamadan eklemek için.
export const raw = (s) => new SafeHtml(String(s));

function toHtml(v) {
  if (v instanceof SafeHtml) return v.s;
  if (Array.isArray(v)) return v.map(toHtml).join('');
  if (v === false || v === null || v === undefined) return '';
  return escapeHtml(v);
}

// Etiketli şablon: içine giren her değer kaçışlanır; html`` sonuçları ve diziler olduğu gibi eklenir.
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => {
    out += toHtml(v) + strings[i + 1];
  });
  return new SafeHtml(out);
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

// Olay delegasyonu: delegate(root, 'click', '[data-action]', (e, el) => …)
// Dinlemeyi bırakmak için dönen fonksiyon çağrılır.
export function delegate(root, type, selector, handler, options) {
  const listener = (e) => {
    const el = e.target instanceof Element ? e.target.closest(selector) : null;
    if (el && root.contains(el)) handler(e, el);
  };
  root.addEventListener(type, listener, options);
  return () => root.removeEventListener(type, listener, options);
}

// HTML metninden tek bir öğe üretir.
export function createElement(markup) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(markup).trim();
  return tpl.content.firstElementChild;
}

// Bir kabı yeniden çizer; odak kaybolmasın diye odaklı öğenin id'sini korur.
export function renderInto(el, markup) {
  const activeId = document.activeElement && el.contains(document.activeElement) ? document.activeElement.id : null;
  el.innerHTML = String(markup);
  if (activeId) {
    const again = document.getElementById(activeId);
    if (again) again.focus();
  }
}

// Bir eylemi gecikmeli çalıştırır (otomatik kayıt vb.).
export function debounce(fn, ms) {
  let t = null;
  const wrapped = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => { t = null; fn(...args); }, ms);
  };
  wrapped.flush = (...args) => { if (t) { clearTimeout(t); t = null; fn(...args); } };
  wrapped.cancel = () => { clearTimeout(t); t = null; };
  return wrapped;
}

// Kullanıcının o an bir metin alanına yazıp yazmadığı (kısayollar için).
export function isTypingTarget(el) {
  if (!el || !(el instanceof Element)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}
