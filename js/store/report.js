// Raporlarım: günlük / haftalık / aylık çalışma raporu (saf fonksiyonlar, DOM'a dokunmaz).
// Dönem kodları: 'gun' | 'hafta' | 'ay'
import {
  addDays, addMonths, monthKey, daysInMonth, startOfWeek, toDateKey, parseDate,
  formatDateLong, formatMonthYear, MONTHS_TR, WEEKDAYS_SHORT_TR, weekdayIndex, timeToMinutes,
} from '../lib/dates.js';
import { isRoutineScheduled } from './selectors.js';

export const PERIODS = { gun: 'Günlük', hafta: 'Haftalık', ay: 'Aylık' };
const pad = (n) => String(n).padStart(2, '0');
const localKey = (iso) => toDateKey(new Date(iso));
const localHour = (iso) => new Date(iso).getHours();

export function periodRange(period, anchor) {
  if (period === 'gun') return { start: anchor, end: anchor };
  if (period === 'hafta') {
    const s = startOfWeek(anchor);
    return { start: s, end: addDays(s, 6) };
  }
  const m = monthKey(anchor);
  return { start: `${m}-01`, end: `${m}-${pad(daysInMonth(m))}` };
}

export function shiftAnchor(period, anchor, dir) {
  if (period === 'gun') return addDays(anchor, dir);
  if (period === 'hafta') return addDays(startOfWeek(anchor), dir * 7);
  return `${addMonths(monthKey(anchor), dir)}-01`;
}

// "14 Ekim 2026, Çarşamba" · "12–18 Ekim 2026" · "Ekim 2026"
export function periodLabel(period, range) {
  if (period === 'gun') return formatDateLong(range.start);
  if (period === 'ay') return formatMonthYear(monthKey(range.start));
  const a = parseDate(range.start);
  const b = parseDate(range.end);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MONTHS_TR[b.getMonth()]} ${b.getFullYear()}`;
  const yr = a.getFullYear() === b.getFullYear() ? '' : ` ${a.getFullYear()}`;
  return `${a.getDate()} ${MONTHS_TR[a.getMonth()]}${yr} – ${b.getDate()} ${MONTHS_TR[b.getMonth()]} ${b.getFullYear()}`;
}

export const PREV_LABEL = { gun: 'düne göre', hafta: 'geçen haftaya göre', ay: 'geçen aya göre' };

function daysBetween(start, end) {
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

// Bir oturumun dersi: kendi dersi ya da bağlı görevin dersi
function sessionCourse(state, p, taskCourse) {
  return p.courseId || (p.taskId ? taskCourse.get(p.taskId) : null) || null;
}

// Dönemin temel sayıları. Bugünden sonraki günler (henüz yaşanmamış) oranlara katılmaz.
export function computeKpis(state, range, today) {
  const effEnd = range.end < today ? range.end : today;
  const lived = range.start <= effEnd ? daysBetween(range.start, effEnd) : [];
  const inRange = (k) => k >= range.start && k <= range.end;

  const completed = state.tasks.filter((t) => t.done && t.doneAt && inRange(localKey(t.doneAt)));
  const planned = state.tasks.filter((t) => t.date && inRange(t.date));
  const plannedDone = planned.filter((t) => t.done).length;
  const overdue = planned.filter((t) => !t.done && t.date < today).length;

  const sessions = state.pomodoroSessions.filter((p) => inRange(localKey(p.startedAt)));
  const focusMin = sessions.reduce((s, p) => s + (p.durationMin || 0), 0);

  let routinesPlanned = 0;
  let routinesDone = 0;
  for (const d of lived) {
    const logs = state.routineLogs[d] || [];
    for (const r of state.routines) {
      if (!isRoutineScheduled(r, d)) continue;
      const done = logs.includes(r.id);
      if (r.archived && !done) continue;
      if (d === today && !done) continue; // bugün henüz bitmedi
      routinesPlanned++;
      if (done) routinesDone++;
    }
  }

  const active = new Set([
    ...completed.map((t) => localKey(t.doneAt)),
    ...sessions.map((p) => localKey(p.startedAt)),
    ...lived.filter((d) => (state.routineLogs[d] || []).length),
  ]);

  return {
    tasksDone: completed.length,
    tasksPlanned: planned.length,
    plannedDone,
    completionRate: planned.length ? Math.round((plannedDone / planned.length) * 100) : null,
    overdue,
    focusMin,
    sessions: sessions.length,
    routinesPlanned,
    routinesDone,
    routineRate: routinesPlanned ? Math.round((routinesDone / routinesPlanned) * 100) : null,
    activeDays: [...active].filter((d) => d <= effEnd).length,
    livedDays: lived.length,
    avgFocusPerDay: lived.length ? Math.round(focusMin / lived.length) : 0,
  };
}

// Önceki döneme göre değişim (%). Önceki 0 ise: ikisi de 0 → null, değilse 'yeni'.
export function delta(cur, prev) {
  if (cur === null || prev === null || cur === undefined || prev === undefined) return null;
  if (prev === 0) return cur === 0 ? null : 'yeni';
  return Math.round(((cur - prev) / prev) * 100);
}

// Grafik serisi: günlükte saatler, haftalık/aylıkta günler
export function buildSeries(state, period, range, today) {
  const inRange = (k) => k >= range.start && k <= range.end;
  if (period === 'gun') {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ key: `${pad(h)}:00`, label: pad(h), focusMin: 0, tasksDone: 0, future: false }));
    for (const p of state.pomodoroSessions) if (inRange(localKey(p.startedAt))) buckets[localHour(p.startedAt)].focusMin += p.durationMin || 0;
    for (const t of state.tasks) if (t.done && t.doneAt && inRange(localKey(t.doneAt))) buckets[localHour(t.doneAt)].tasksDone++;
    // Gün saatleri aralığı + veri olan saatler gösterilir
    let from = Math.floor(timeToMinutes(state.settings.dayStart) / 60);
    let to = Math.ceil(timeToMinutes(state.settings.dayEnd) / 60) - 1;
    buckets.forEach((b, h) => { if (b.focusMin || b.tasksDone) { from = Math.min(from, h); to = Math.max(to, h); } });
    return buckets.slice(from, to + 1);
  }
  const days = daysBetween(range.start, range.end);
  const map = new Map(days.map((d) => [d, { key: d, label: '', focusMin: 0, tasksDone: 0, routinesDone: 0, future: d > today }]));
  days.forEach((d) => {
    map.get(d).label = period === 'hafta' ? WEEKDAYS_SHORT_TR[weekdayIndex(d)] : String(parseDate(d).getDate());
    map.get(d).routinesDone = (state.routineLogs[d] || []).length;
  });
  for (const p of state.pomodoroSessions) { const k = localKey(p.startedAt); if (map.has(k)) map.get(k).focusMin += p.durationMin || 0; }
  for (const t of state.tasks) if (t.done && t.doneAt) { const k = localKey(t.doneAt); if (map.has(k)) map.get(k).tasksDone++; }
  return [...map.values()];
}

// Derslere göre odak ve tamamlanan görev; dersi olmayanlar en sonda (course: null)
export function buildByCourse(state, range) {
  const inRange = (k) => k >= range.start && k <= range.end;
  const taskCourse = new Map(state.tasks.map((t) => [t.id, t.courseId]));
  const rows = new Map();
  const row = (id) => {
    if (!rows.has(id)) rows.set(id, { course: id ? state.courses.find((c) => c.id === id) || null : null, focusMin: 0, tasksDone: 0 });
    return rows.get(id);
  };
  for (const p of state.pomodoroSessions) {
    if (!inRange(localKey(p.startedAt))) continue;
    const cid = sessionCourse(state, p, taskCourse);
    row(cid && state.courses.some((c) => c.id === cid) ? cid : '').focusMin += p.durationMin || 0;
  }
  for (const t of state.tasks) {
    if (!t.done || !t.doneAt || !inRange(localKey(t.doneAt))) continue;
    row(t.courseId && state.courses.some((c) => c.id === t.courseId) ? t.courseId : '').tasksDone++;
  }
  return [...rows.values()].sort((a, b) => (a.course ? 0 : 1) - (b.course ? 0 : 1) || b.focusMin - a.focusMin || b.tasksDone - a.tasksDone);
}

// Rutin bazında yapılan / planlanan (bugün henüz yapılmadıysa sayılmaz)
export function buildRoutineStats(state, range, today) {
  const effEnd = range.end < today ? range.end : today;
  if (range.start > effEnd) return [];
  const days = daysBetween(range.start, effEnd);
  return state.routines
    .map((r) => {
      let planned = 0;
      let done = 0;
      for (const d of days) {
        if (!isRoutineScheduled(r, d)) continue;
        const ok = (state.routineLogs[d] || []).includes(r.id);
        if ((r.archived || d === today) && !ok) continue;
        planned++;
        if (ok) done++;
      }
      return { routine: r, planned, done, rate: planned ? Math.round((done / planned) * 100) : null };
    })
    .filter((x) => x.planned > 0)
    .sort((a, b) => b.rate - a.rate || a.routine.title.localeCompare(b.routine.title, 'tr'));
}

export function buildReport(state, period, anchor, today) {
  const range = periodRange(period, anchor);
  const prevRange = periodRange(period, shiftAnchor(period, anchor, -1));
  const kpis = computeKpis(state, range, today);
  const prev = computeKpis(state, prevRange, today);
  const series = buildSeries(state, period, range, today);
  const byCourse = buildByCourse(state, range);
  const routines = buildRoutineStats(state, range, today);

  const insights = [];
  const best = series.reduce((m, s) => (s.focusMin > (m ? m.focusMin : 0) ? s : m), null);
  if (best) {
    insights.push(period === 'gun'
      ? { icon: 'clock', text: `En çok ${best.key}–${pad(Number(best.label) + 1)}:00 arasında odaklandın (${best.focusMin} dk).` }
      : { icon: 'flame', text: `En verimli gün: ${formatDateLong(best.key).split(',')[0]} (${best.focusMin} dk odak).` });
  }
  const topCourse = byCourse.find((r) => r.course && r.focusMin > 0);
  if (topCourse) insights.push({ icon: 'book', text: `En çok çalıştığın ders: ${topCourse.course.name}.` });
  const d = delta(kpis.focusMin, prev.focusMin);
  if (typeof d === 'number' && d !== 0) insights.push({ icon: d > 0 ? 'sparkles' : 'info', text: `Odak süren ${PREV_LABEL[period]} %${Math.abs(d)} ${d > 0 ? 'arttı' : 'azaldı'}.` });
  if (kpis.overdue) insights.push({ icon: 'alert', text: `Bu dönemde planlanıp yapılmamış ${kpis.overdue} görev var.` });

  return {
    period, range, prevRange, label: periodLabel(period, range),
    isCurrent: range.start <= today && today <= range.end,
    hasNext: range.end < today,
    kpis, prev, series, byCourse, routines, insights,
    empty: !kpis.tasksDone && !kpis.focusMin && !kpis.routinesDone && !kpis.tasksPlanned,
  };
}

// CSV (Excel için ; ayraçlı, UTF-8 BOM'lu)
export function reportToCsv(report) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [];
  lines.push([`My to do raporu`, report.label].map(esc).join(';'));
  lines.push('');
  lines.push(['Özet', 'Değer'].join(';'));
  const k = report.kpis;
  lines.push(['Tamamlanan görev', k.tasksDone].join(';'));
  lines.push(['Planlanan görev', k.tasksPlanned].join(';'));
  lines.push(['Plan tamamlama (%)', k.completionRate ?? ''].join(';'));
  lines.push(['Odak (dk)', k.focusMin].join(';'));
  lines.push(['Pomodoro seansı', k.sessions].join(';'));
  lines.push(['Rutin tamamlama (%)', k.routineRate ?? ''].join(';'));
  lines.push(['Aktif gün', k.activeDays].join(';'));
  lines.push('');
  lines.push([report.period === 'gun' ? 'Saat' : 'Tarih', 'Odak (dk)', 'Tamamlanan görev'].join(';'));
  for (const s of report.series) lines.push([s.key, s.focusMin, s.tasksDone].map(esc).join(';'));
  lines.push('');
  lines.push(['Ders', 'Odak (dk)', 'Tamamlanan görev'].join(';'));
  for (const r of report.byCourse) lines.push([r.course ? r.course.name : 'Ders yok', r.focusMin, r.tasksDone].map(esc).join(';'));
  if (report.routines.length) {
    lines.push('');
    lines.push(['Rutin', 'Yapılan', 'Planlanan', 'Oran (%)'].join(';'));
    for (const r of report.routines) lines.push([r.routine.title, r.done, r.planned, r.rate].map(esc).join(';'));
  }
  return '﻿' + lines.join('\r\n');
}

export const reportFileName = (period, range) => `planlayici-rapor-${period}-${range.start}${range.start !== range.end ? `_${range.end}` : ''}.csv`;
