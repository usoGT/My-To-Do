// Yıllık ısı haritası (elle çizilmiş SVG). Hücreye tıklayınca o günün gün görünümü açılır.
import { html, raw, escapeHtml } from '../lib/dom.js';
import { yearDays, MONTHS_SHORT_TR, WEEKDAYS_SHORT_TR, formatDayMonth, formatDuration, todayKey } from '../lib/dates.js';
import { heatmapCell, dayScore, scoreToLevel } from '../store/selectors.js';

const CELL = 12;
const GAP = 3;
const LEFT = 28;
const TOP = 18;

export function heatmapView(yKey, idx) {
  const today = todayKey();
  const days = yearDays(yKey);
  const cols = heatmapCell(yKey, days[days.length - 1]).col + 1;
  const width = LEFT + cols * (CELL + GAP);
  const height = TOP + 7 * (CELL + GAP);

  let cells = '';
  const monthLabels = [];
  for (const d of days) {
    const { col, row } = heatmapCell(yKey, d);
    const a = idx.get(d);
    const level = d > today ? -1 : scoreToLevel(dayScore(a));
    const x = LEFT + col * (CELL + GAP);
    const y = TOP + row * (CELL + GAP);
    const tip = `${formatDayMonth(d)}: ${a ? `${a.tasks} görev, ${a.routines} rutin, ${formatDuration(a.focusMin)} odak` : 'kayıt yok'}`;
    cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" class="hm-cell hm-${level < 0 ? 'future' : level}${d === today ? ' hm-today' : ''}" data-date="${d}" tabindex="-1"><title>${escapeHtml(tip)}</title></rect>`;
    if (d.endsWith('-01')) monthLabels.push({ x, label: MONTHS_SHORT_TR[Number(d.slice(5, 7)) - 1] });
  }
  const labels = monthLabels.map((m) => `<text x="${m.x}" y="11" class="hm-label">${m.label}</text>`).join('');
  const dayLabels = [0, 2, 4].map((r) => `<text x="0" y="${TOP + r * (CELL + GAP) + 10}" class="hm-label">${WEEKDAYS_SHORT_TR[r]}</text>`).join('');

  return html`
    <div class="heatmap-wrap">
      <svg class="heatmap" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${yKey} yılı etkinlik ısı haritası">
        ${raw(labels + dayLabels + cells)}
      </svg>
    </div>
    <div class="heatmap-legend xsmall muted">
      <span>Az</span>
      ${[0, 1, 2, 3, 4].map((l) => html`<span class="hm-swatch hm-${l}"></span>`)}
      <span>Çok</span>
      <span class="grow"></span>
      <span>Puan = tamamlanan görev + rutin + her 25 dk odak</span>
    </div>`;
}
