// Raporlarım: günlük / haftalık / aylık çalışma raporu — özet kartlar, grafikler, dersler, rutinler; CSV ve yazdır/PDF.
// Adres: #/raporlar?donem=gun|hafta|ay&tarih=YYYY-MM-DD
import { html, delegate } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getState, subscribe } from '../store/store.js';
import { buildReport, shiftAnchor, delta, PERIODS, PREV_LABEL, reportToCsv, reportFileName } from '../store/report.js';
import { columnChart, hbarList, statusBar, bindChartTips } from '../components/report-charts.js';
import { emptyState } from '../components/empty-state.js';
import { toast } from '../components/toast.js';
import { updateQuery } from '../router.js';
import { saveBlob } from '../lib/save-file.js';
import { isCapacitor } from '../lib/platform.js';
import { todayKey, isValidDateKey, formatDuration, formatDayMonth, formatDateShort } from '../lib/dates.js';

const CURRENT_LABEL = { gun: 'Bugün', hafta: 'Bu hafta', ay: 'Bu ay' };

function deltaChip(cur, prev, period, { invert = false } = {}) {
  const d = delta(cur, prev);
  if (d === null) return html`<span class="kpi-delta">${PREV_LABEL[period]} değişim yok</span>`;
  if (d === 'yeni') return html`<span class="kpi-delta is-up">${icon('trendUp')} ${PREV_LABEL[period]} yeni</span>`;
  if (d === 0) return html`<span class="kpi-delta">${PREV_LABEL[period]} aynı</span>`;
  const good = invert ? d < 0 : d > 0;
  return html`<span class="kpi-delta ${good ? 'is-up' : 'is-down'}">${icon(d > 0 ? 'trendUp' : 'trendDown')} %${Math.abs(d)} ${PREV_LABEL[period]}</span>`;
}

function kpiCards(r) {
  const k = r.kpis;
  const p = r.prev;
  return html`
    <div class="kpi-grid">
      <div class="kpi">
        <span class="stat-label">Odak süresi</span>
        <span class="kpi-value">${formatDuration(k.focusMin)}</span>
        <span class="stat-sub">${k.sessions} Pomodoro seansı${r.period !== 'gun' ? ` · günde ort. ${formatDuration(k.avgFocusPerDay)}` : ''}</span>
        ${deltaChip(k.focusMin, p.focusMin, r.period)}
      </div>
      <div class="kpi">
        <span class="stat-label">Tamamlanan görev</span>
        <span class="kpi-value">${k.tasksDone}</span>
        <span class="stat-sub">${k.completionRate === null ? 'Bu döneme planlı görev yok' : `Planlananların %${k.completionRate}'i tamam (${k.plannedDone}/${k.tasksPlanned})`}</span>
        ${deltaChip(k.tasksDone, p.tasksDone, r.period)}
      </div>
      <div class="kpi">
        <span class="stat-label">Rutin tamamlama</span>
        <span class="kpi-value">${k.routineRate === null ? '—' : `%${k.routineRate}`}</span>
        <span class="stat-sub">${k.routinesPlanned ? `${k.routinesDone}/${k.routinesPlanned} rutin yapıldı` : 'Henüz değerlendirilecek rutin yok'}</span>
        ${deltaChip(k.routineRate, p.routineRate, r.period)}
      </div>
      ${r.period === 'gun' ? html`
        <div class="kpi">
          <span class="stat-label">Geciken görev</span>
          <span class="kpi-value">${k.overdue}</span>
          <span class="stat-sub">Bu güne planlanıp yapılmayan</span>
        </div>` : html`
        <div class="kpi">
          <span class="stat-label">Aktif gün</span>
          <span class="kpi-value">${k.activeDays}<span class="stat-of">/${k.livedDays}</span></span>
          <span class="stat-sub">Görev, rutin ya da odak olan gün</span>
          ${deltaChip(k.activeDays, p.activeDays, r.period)}
        </div>`}
    </div>`;
}

function trendCharts(r) {
  const today = todayKey();
  const isDay = r.period === 'gun';
  const labelEvery = r.period === 'ay' ? 5 : isDay ? 2 : 1;
  const name = (s) => (isDay ? `${s.key}–${String(Number(s.label) + 1).padStart(2, '0')}:00` : r.period === 'hafta' ? formatDayMonth(s.key) : formatDateShort(s.key));
  const focus = r.series.map((s) => ({
    label: s.label, value: s.focusMin, future: s.future, strong: !isDay && s.key === today,
    tip: s.future ? `${name(s)}: henüz gelmedi` : `${name(s)}: ${formatDuration(s.focusMin)} odak`,
  }));
  const tasks = r.series.map((s) => ({
    label: s.label, value: s.tasksDone, future: s.future, strong: !isDay && s.key === today,
    tip: s.future ? `${name(s)}: henüz gelmedi` : `${name(s)}: ${s.tasksDone} görev tamamlandı`,
  }));
  return html`
    <div class="report-grid-2">
      <section class="card card--tight report-card">
        <h2 class="report-card-title">Odak süresi <span class="muted">· ${isDay ? 'saatlere göre' : 'günlere göre'}, dakika</span></h2>
        ${columnChart(focus, { ariaLabel: 'Odak süresi grafiği', labelEvery })}
      </section>
      <section class="card card--tight report-card">
        <h2 class="report-card-title">Tamamlanan görevler <span class="muted">· ${isDay ? 'saatlere göre' : 'günlere göre'}</span></h2>
        ${columnChart(tasks, { ariaLabel: 'Tamamlanan görev grafiği', labelEvery, integer: true })}
      </section>
    </div>`;
}

function courseSection(r) {
  const rows = r.byCourse.filter((x) => x.focusMin || x.tasksDone);
  return html`
    <section class="card card--tight report-card">
      <h2 class="report-card-title">Derslere göre <span class="muted">· odak süresi</span></h2>
      ${rows.length
        ? hbarList(rows.map((x) => ({
          label: x.course ? x.course.name : 'Ders seçilmeden',
          color: x.course ? x.course.color : null,
          value: x.focusMin,
          valueText: formatDuration(x.focusMin),
          sub: `${x.tasksDone} görev`,
        })))
        : html`<p class="small muted">Bu dönemde derse bağlı çalışma yok.</p>`}
    </section>`;
}

function taskStatusSection(r) {
  const k = r.kpis;
  const upcoming = k.tasksPlanned - k.plannedDone - k.overdue;
  return html`
    <section class="card card--tight report-card">
      <h2 class="report-card-title">Planlanan görevlerin durumu <span class="muted">· ${k.tasksPlanned} görev</span></h2>
      ${statusBar([
        { label: 'Tamamlandı', value: k.plannedDone, tone: 'success' },
        { label: 'Gecikti', value: k.overdue, tone: 'danger' },
        { label: 'Sırada', value: upcoming, tone: 'neutral' },
      ])}
    </section>`;
}

function routineSection(r) {
  return html`
    <section class="card card--tight report-card">
      <h2 class="report-card-title">Rutinler <span class="muted">· yapılan / planlanan</span></h2>
      ${r.routines.length
        ? hbarList(r.routines.map((x) => ({
          label: x.routine.title,
          color: x.routine.color,
          value: x.rate,
          valueText: `%${x.rate}`,
          sub: `${x.done}/${x.planned}`,
        })), { max: 100 })
        : html`<p class="small muted">Bu dönemde yapılmış ya da kaçırılmış rutin yok. Bugünün rutinleri işaretlendikçe burada görünür.</p>`}
    </section>`;
}

function dataTable(r) {
  const isDay = r.period === 'gun';
  const rows = r.series.filter((s) => !s.future);
  return html`
    <details class="fold report-table no-print-toggle">
      <summary>${icon('chevronRight')} Verileri tablo olarak göster</summary>
      <div class="fold-body card card--tight table-wrap">
        <table class="data-table">
          <thead><tr><th scope="col">${isDay ? 'Saat' : 'Gün'}</th><th scope="col" class="num">Odak</th><th scope="col" class="num">Tamamlanan görev</th>${isDay ? '' : html`<th scope="col" class="num">Yapılan rutin</th>`}</tr></thead>
          <tbody>
            ${rows.map((s) => html`<tr>
              <td>${isDay ? s.key : formatDayMonth(s.key)}</td>
              <td class="num">${formatDuration(s.focusMin)}</td>
              <td class="num">${s.tasksDone}</td>
              ${isDay ? '' : html`<td class="num">${s.routinesDone}</td>`}
            </tr>`)}
          </tbody>
          <tfoot><tr><th scope="row">Toplam</th><td class="num">${formatDuration(r.kpis.focusMin)}</td><td class="num">${r.kpis.tasksDone}</td>${isDay ? '' : html`<td class="num">${r.kpis.routinesDone}</td>`}</tr></tfoot>
        </table>
      </div>
    </details>`;
}

function view(state, ui) {
  const r = buildReport(state, ui.period, ui.anchor, todayKey());
  return html`
    <div class="page-header report-header">
      <div>
        <h1>Raporlarım</h1>
        <p>Çalışmalarının ${PERIODS[ui.period].toLocaleLowerCase('tr-TR')} özeti.</p>
      </div>
      <div class="row wrap no-print">
        <button type="button" class="btn" data-action="csv">${icon(isCapacitor ? 'upload' : 'download')} ${isCapacitor ? 'CSV paylaş' : 'CSV indir'}</button>
        ${isCapacitor ? '' : html`<button type="button" class="btn" data-action="print">${icon('printer')} Yazdır / PDF</button>`}
      </div>
    </div>

    <div class="planner-toolbar report-toolbar">
      <div class="segmented no-print" role="group" aria-label="Rapor dönemi">
        ${Object.entries(PERIODS).map(([k, label]) => html`<button type="button" data-action="period" data-period="${k}" aria-pressed="${ui.period === k}">${label}</button>`)}
      </div>
      <div class="row planner-nav">
        <button type="button" class="btn btn--icon btn--sm no-print" data-action="prev" aria-label="Önceki dönem">${icon('chevronLeft')}</button>
        <h2 class="planner-title">${r.label}</h2>
        <button type="button" class="btn btn--icon btn--sm no-print" data-action="next" aria-label="Sonraki dönem" ${r.hasNext ? '' : 'disabled'}>${icon('chevronRight')}</button>
      </div>
      <button type="button" class="btn btn--sm no-print" data-action="current" ${r.isCurrent ? 'disabled' : ''}>${CURRENT_LABEL[ui.period]}</button>
    </div>

    ${r.empty
      ? emptyState({ icon: 'chart', title: 'Bu dönem için veri yok', text: 'Görev tamamladıkça, rutinlerini işaretledikçe ve Pomodoro ile çalıştıkça raporların burada oluşur.' })
      : html`
        ${kpiCards(r)}
        ${r.insights.length ? html`<ul class="insights">${r.insights.map((i) => html`<li>${icon(i.icon)}<span>${i.text}</span></li>`)}</ul>` : ''}
        ${trendCharts(r)}
        <div class="report-grid-2">
          ${courseSection(r)}
          <div class="report-stack">
            ${taskStatusSection(r)}
            ${routineSection(r)}
          </div>
        </div>
        ${dataTable(r)}
        <p class="xsmall muted report-foot">Tamamlanan görevler tamamlandıkları güne, odak süresi seansın başladığı güne sayılır. Henüz yaşanmamış günler oranlara katılmaz.</p>`}`;
}

function readUi(query) {
  return {
    period: PERIODS[query.donem] ? query.donem : 'hafta',
    anchor: isValidDateKey(query.tarih) && query.tarih <= todayKey() ? query.tarih : todayKey(),
  };
}

export default {
  title: 'Raporlarım',
  render(root, { query }) {
    const ui = readUi(query);
    const draw = () => {
      const open = root.querySelector('.report-table')?.open;
      root.innerHTML = String(view(getState(), ui));
      if (open) root.querySelector('.report-table')?.setAttribute('open', '');
    };
    const go = (patch) => {
      Object.assign(ui, patch);
      updateQuery({ donem: ui.period, tarih: ui.anchor === todayKey() ? undefined : ui.anchor });
      draw();
    };
    draw();
    const unsub = subscribe(draw);
    const offTips = bindChartTips(root);
    const offClick = delegate(root, 'click', '[data-action]', (e, el) => {
      const a = el.dataset.action;
      if (a === 'period') go({ period: el.dataset.period });
      else if (a === 'prev') go({ anchor: shiftAnchor(ui.period, ui.anchor, -1) });
      else if (a === 'next') {
        const next = shiftAnchor(ui.period, ui.anchor, 1);
        go({ anchor: next > todayKey() ? todayKey() : next });
      } else if (a === 'current') go({ anchor: todayKey() });
      else if (a === 'print') window.print();
      else if (a === 'csv') {
        const r = buildReport(getState(), ui.period, ui.anchor, todayKey());
        const blob = new Blob([reportToCsv(r)], { type: 'text/csv;charset=utf-8' });
        saveBlob(blob, reportFileName(ui.period, r.range))
          .then(() => { if (!isCapacitor) toast('Rapor CSV olarak indirildi (Excel ile açılabilir).', { type: 'success' }); })
          .catch((err) => toast(err.message || 'Dosya kaydedilemedi.', { type: 'error' }));
      }
    });
    return () => { unsub(); offTips(); offClick(); };
  },
};
