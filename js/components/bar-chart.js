// Basit SVG çubuk grafik. data: [{ label, value, highlight, title }]
import { html, raw, escapeHtml } from '../lib/dom.js';

export function barChart(data, { height = 150, format = (v) => String(v), ariaLabel = 'Çubuk grafik' } = {}) {
  const w = 44;
  const gap = 10;
  const top = 18;
  const bottom = 22;
  const width = data.length * (w + gap) - gap;
  const max = Math.max(1, ...data.map((d) => d.value));
  const inner = height - top - bottom;
  let out = `<line x1="0" x2="${width}" y1="${top + inner}" y2="${top + inner}" class="bc-axis"/>`;
  data.forEach((d, i) => {
    const h = d.value > 0 ? Math.max(3, (d.value / max) * inner) : 0;
    const x = i * (w + gap);
    const y = top + inner - h;
    out += `<g class="bc-bar${d.highlight ? ' is-hl' : ''}">`;
    out += `<title>${escapeHtml(d.title || `${d.label}: ${format(d.value)}`)}</title>`;
    if (h > 0) out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`;
    if (d.value > 0) out += `<text x="${x + w / 2}" y="${y - 5}" class="bc-value">${escapeHtml(format(d.value))}</text>`;
    out += `<text x="${x + w / 2}" y="${height - 6}" class="bc-label">${escapeHtml(d.label)}</text></g>`;
  });
  return html`<svg class="bar-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${ariaLabel}">${raw(out)}</svg>`;
}
