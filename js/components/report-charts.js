// Rapor grafikleri: HTML sütun grafik (ipuçlu), yatay çubuk listesi, durum çubuğu.
// Tek seri tek renk; metinler metin renginde; eksen ve ızgara geri planda.
import { html, delegate } from '../lib/dom.js';

// 0'dan başlayan "yuvarlak" üst sınır: 1, 2, 5 × 10^n. integer: ara çizgi (yarısı) de tam sayı olsun.
export function niceMax(v, { integer = false } = {}) {
  if (v <= 0) return integer ? 2 : 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const m = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  if (!integer) return m;
  const whole = Math.max(2, Math.ceil(m));
  return whole % 2 ? whole + 1 : whole;
}

// data: [{ label, value, tip, future, strong }]
export function columnChart(data, { ariaLabel, unit = '', labelEvery = 1, integer = false }) {
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)), { integer });
  const fmt = (v) => `${Math.round(v)}${unit ? ` ${unit}` : ''}`;
  return html`
    <div class="col-chart" role="group" aria-label="${ariaLabel}">
      <div class="col-plot">
        <div class="col-grid" aria-hidden="true">
          ${[max, max / 2, 0].map((t) => html`<div class="col-gridline"><span>${fmt(t)}</span></div>`)}
        </div>
        <div class="col-bars" style="--n:${data.length}">
          ${data.map((d) => html`
            <button type="button" class="col ${d.future ? 'is-future' : ''} ${d.strong ? 'is-strong' : ''}" data-tip="${d.tip}" aria-label="${d.tip}">
              ${d.value > 0 ? html`<span class="col-bar" style="height:${((d.value / max) * 100).toFixed(1)}%"></span>` : ''}
            </button>`)}
        </div>
      </div>
      <div class="col-labels" style="--n:${data.length}" aria-hidden="true">
        ${data.map((d, i) => html`<span class="${d.strong ? 'is-strong' : ''}">${i % labelEvery === 0 || d.strong ? d.label : ''}</span>`)}
      </div>
      <div class="chart-tip" role="tooltip" hidden></div>
    </div>`;
}

// rows: [{ label, value, valueText, sub, color }] — color: ders/rutin renk anahtarı
export function hbarList(rows, { max = null } = {}) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  return html`
    <ul class="hbar-list">
      ${rows.map((r) => html`
        <li class="${r.color ? `c-${r.color}` : 'c-none'}">
          <span class="hbar-label"><span class="dot"></span><span class="truncate">${r.label}</span></span>
          <span class="hbar-track"><span class="hbar-fill" style="width:${r.value > 0 ? Math.max(2, (r.value / m) * 100).toFixed(1) : 0}%"></span></span>
          <span class="hbar-value">${r.valueText}${r.sub ? html`<span class="hbar-sub">${r.sub}</span>` : ''}</span>
        </li>`)}
    </ul>`;
}

// segments: [{ label, value, tone: 'success' | 'danger' | 'neutral' }]
export function statusBar(segments) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return html`
    <div class="status-bar" role="img" aria-label="${segments.map((s) => `${s.label}: ${s.value}`).join(', ')}">
      ${segments.filter((s) => s.value > 0).map((s) => html`<span class="status-seg tone-${s.tone}" style="flex-grow:${s.value}" title="${s.label}: ${s.value}"></span>`)}
      ${total === 0 ? html`<span class="status-seg tone-empty" style="flex-grow:1"></span>` : ''}
    </div>
    <ul class="status-legend">
      ${segments.map((s) => html`<li><span class="status-key tone-${s.tone}"></span>${s.label} <strong>${s.value}</strong></li>`)}
    </ul>`;
}

// Sütunların üzerinde gezinince / odaklanınca ipucu gösterir.
export function bindChartTips(root) {
  const show = (e, col) => {
    const chart = col.closest('.col-chart');
    const tip = chart.querySelector('.chart-tip');
    tip.textContent = col.dataset.tip;
    tip.hidden = false;
    const c = chart.getBoundingClientRect();
    const b = col.getBoundingClientRect();
    const bar = col.querySelector('.col-bar');
    const top = (bar ? bar.getBoundingClientRect().top : b.bottom) - c.top;
    const x = b.left + b.width / 2 - c.left;
    tip.style.left = `${Math.min(Math.max(x, tip.offsetWidth / 2), c.width - tip.offsetWidth / 2)}px`;
    tip.style.top = `${Math.max(0, top - tip.offsetHeight - 6)}px`;
    chart.querySelectorAll('.col.is-hover').forEach((x2) => x2.classList.remove('is-hover'));
    col.classList.add('is-hover');
  };
  const hide = (e, col) => {
    const chart = col.closest('.col-chart');
    chart.querySelector('.chart-tip').hidden = true;
    col.classList.remove('is-hover');
  };
  const offs = [
    delegate(root, 'mouseover', '.col', show),
    delegate(root, 'focusin', '.col', show),
    delegate(root, 'mouseout', '.col', hide),
    delegate(root, 'focusout', '.col', hide),
  ];
  return () => offs.forEach((f) => f());
}
