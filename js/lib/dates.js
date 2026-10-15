// Tarih yardımcıları. Gün tarihleri her zaman YEREL saatle "YYYY-MM-DD" metni olarak tutulur.
// DİKKAT: new Date("2026-10-14") KULLANMA (UTC okunur, gün kayar). parseDate() kullan.

export const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const MONTHS_SHORT_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const WEEKDAYS_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const WEEKDAYS_SHORT_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const pad = (n) => String(n).padStart(2, '0');

export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDate(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function isValidDateKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return toDateKey(parseDate(key)) === key;
}

export function isValidTime(t) {
  return typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

export const todayKey = (now = new Date()) => toDateKey(now);

export function addDays(key, n) {
  const d = parseDate(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

// b - a gün sayısı (yaz saati farklarından etkilenmez)
export function diffDays(a, b) {
  const da = parseDate(a);
  const db = parseDate(b);
  return Math.round((Date.UTC(db.getFullYear(), db.getMonth(), db.getDate()) - Date.UTC(da.getFullYear(), da.getMonth(), da.getDate())) / 86400000);
}

// 0 = Pazartesi … 6 = Pazar
export function weekdayIndex(keyOrDate) {
  const d = keyOrDate instanceof Date ? keyOrDate : parseDate(keyOrDate);
  return (d.getDay() + 6) % 7;
}

export const startOfWeek = (key) => addDays(key, -weekdayIndex(key));

export function weekDays(key) {
  const start = startOfWeek(key);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export const monthKey = (key) => String(key).slice(0, 7);
export const yearKey = (key) => String(key).slice(0, 4);

export function daysInMonth(mKey) {
  const [y, m] = mKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function addMonths(mKey, n) {
  const [y, m] = mKey.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

// Takvim için 6×7 = 42 gün (Pazartesi başlangıçlı); her öğe { key, inMonth }
export function monthGrid(mKey) {
  const first = `${mKey}-01`;
  const start = addDays(first, -weekdayIndex(first));
  return Array.from({ length: 42 }, (_, i) => {
    const key = addDays(start, i);
    return { key, inMonth: monthKey(key) === mKey };
  });
}

// Bir yılın tüm günleri
export function yearDays(yKey) {
  const out = [];
  let k = `${yKey}-01-01`;
  while (yearKey(k) === String(yKey)) { out.push(k); k = addDays(k, 1); }
  return out;
}

export function timeToMinutes(t) {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(min) {
  const m = Math.max(0, Math.min(24 * 60, Math.round(min)));
  if (m === 24 * 60) return '24:00';
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export const nowMinutes = (now = new Date()) => now.getHours() * 60 + now.getMinutes();

// "14 Ekim 2026, Çarşamba"
export function formatDateLong(key) {
  const d = parseDate(key);
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}, ${WEEKDAYS_TR[weekdayIndex(d)]}`;
}

// "14 Eki"
export function formatDateShort(key) {
  const d = parseDate(key);
  return `${d.getDate()} ${MONTHS_SHORT_TR[d.getMonth()]}`;
}

// "14 Ekim Çarşamba"
export function formatDayMonth(key) {
  const d = parseDate(key);
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${WEEKDAYS_TR[weekdayIndex(d)]}`;
}

// "Ekim 2026"
export function formatMonthYear(mKey) {
  const [y, m] = mKey.split('-').map(Number);
  return `${MONTHS_TR[m - 1]} ${y}`;
}

// Bugüne göre okunur gün adı: "Bugün", "Yarın", "Dün" ya da "15 Eki Perşembe"
export function formatRelativeDay(key, today = todayKey()) {
  const diff = diffDays(today, key);
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Yarın';
  if (diff === -1) return 'Dün';
  const d = parseDate(key);
  const sameYear = yearKey(key) === yearKey(today);
  return `${d.getDate()} ${MONTHS_SHORT_TR[d.getMonth()]}${sameYear ? '' : ' ' + d.getFullYear()} ${WEEKDAYS_SHORT_TR[weekdayIndex(d)]}`;
}

// 80 → "1 sa 20 dk", 45 → "45 dk", 120 → "2 sa"
export function formatDuration(min) {
  const m = Math.max(0, Math.round(min || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h && r) return `${h} sa ${r} dk`;
  if (h) return `${h} sa`;
  return `${r} dk`;
}

// ISO zamanı → "az önce", "5 dk önce", "3 saat önce", "dün", "12 Eki"
export function formatTimeAgo(iso, now = new Date()) {
  const t = new Date(iso);
  const sec = Math.round((now - t) / 1000);
  if (sec < 60) return 'az önce';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} dk önce`;
  const hr = Math.round(min / 60);
  const days = diffDays(toDateKey(t), toDateKey(now));
  if (days === 0) return `${hr} saat önce`;
  if (days === 1) return 'dün';
  if (days < 7) return `${days} gün önce`;
  return formatDateShort(toDateKey(t)) + (t.getFullYear() !== now.getFullYear() ? ` ${t.getFullYear()}` : '');
}

// ISO → "14:05"
export function formatClockTime(iso) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Saate göre selamlama
export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'Günaydın';
  if (h >= 12 && h < 18) return 'İyi günler';
  if (h >= 18 && h < 23) return 'İyi akşamlar';
  return 'İyi geceler';
}

// Date → 'YYYY-MM-DDTHH:MM' (yerel; <input type="datetime-local"> biçimi)
export function toLocalDateTime(date = new Date()) {
  return `${toDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
