// Boş zaman hesabı (saf fonksiyonlar). Bloklar { start, end } — 'HH:MM' ya da dakika.
import { timeToMinutes, minutesToTime } from './dates.js';

const toMin = (v) => (typeof v === 'number' ? v : timeToMinutes(v));

// Çakışan ve bitişik blokları birleştirir → dakika cinsinden, sıralı [{ start, end }]
export function mergeBusy(blocks) {
  const list = blocks
    .map((b) => ({ start: toMin(b.start), end: toMin(b.end) }))
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start);
  const out = [];
  for (const b of list) {
    const last = out[out.length - 1];
    if (last && b.start <= last.end) last.end = Math.max(last.end, b.end);
    else out.push({ ...b });
  }
  return out;
}

// Gün sınırları içinde, meşgul blokların arasındaki boşluklar.
// fromMinutes verilirse (ör. şu an), ondan önceki zaman hesaba katılmaz.
export function findFreeSlots({ dayStart, dayEnd, busy = [], minMinutes = 15, fromMinutes = null }) {
  let start = toMin(dayStart);
  const end = toMin(dayEnd);
  if (fromMinutes !== null && fromMinutes > start) start = Math.min(fromMinutes, end);
  const merged = mergeBusy(busy)
    .map((b) => ({ start: Math.max(b.start, start), end: Math.min(b.end, end) }))
    .filter((b) => b.end > b.start);
  const slots = [];
  let cursor = start;
  for (const b of merged) {
    if (b.start - cursor >= minMinutes) slots.push(slot(cursor, b.start));
    cursor = Math.max(cursor, b.end);
  }
  if (end - cursor >= minMinutes) slots.push(slot(cursor, end));
  return slots;
}

function slot(a, b) {
  return { start: minutesToTime(a), end: minutesToTime(b), minutes: b - a };
}

export const totalFreeMinutes = (slots) => slots.reduce((sum, s) => sum + s.minutes, 0);

// İki zaman aralığı çakışıyor mu? (uç uca değmek çakışma değildir)
export function overlaps(a, b) {
  return toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);
}
