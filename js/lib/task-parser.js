// Tek satırlık görev ayrıştırıcı: "Fizik ödevi yarın 14:00 #fiz !yüksek"
// → { title, date, time, courseId, priority }
import { addDays, weekdayIndex, isValidDateKey, formatRelativeDay, WEEKDAYS_TR, parseDate } from './dates.js';
import { normalizeTr } from './text.js';
import { fail } from './errors.js';

const WEEKDAY_WORDS = {
  pazartesi: 0, pzt: 0,
  sali: 1, sal: 1,
  carsamba: 2, car: 2, crs: 2,
  persembe: 3, per: 3, prs: 3,
  cuma: 4, cum: 4,
  cumartesi: 5, cmt: 5,
  pazar: 6, paz: 6,
};

const PRIORITY_WORDS = {
  yuksek: 'high', y: 'high', 1: 'high', '!': 'high',
  orta: 'medium', o: 'medium', 2: 'medium',
  dusuk: 'low', d: 'low', 3: 'low',
};

export const PRIORITY_LABELS = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' };

const pad = (n) => String(n).padStart(2, '0');
const stripPunct = (s) => s.replace(/[.,;:!?]+$/, '');

function matchCourse(word, courses) {
  const q = normalizeTr(word);
  if (!q) return null;
  return courses.find((c) => normalizeTr(c.name).replace(/\s+/g, '').startsWith(q) || normalizeTr(c.name).startsWith(q))
    || courses.find((c) => c.code && normalizeTr(c.code).startsWith(q))
    || null;
}

export function parseTaskInput(text, { today, courses = [] }) {
  const tokens = String(text ?? '').trim().split(/\s+/).filter(Boolean);
  const titleParts = [];
  let date = null;
  let time = null;
  let courseId = null;
  let priority = 'medium';

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const n = normalizeTr(stripPunct(tok));
    const next = tokens[i + 1] ? normalizeTr(stripPunct(tokens[i + 1])) : '';

    if (n === 'bugun') { date = today; continue; }
    if (n === 'yarin') { date = addDays(today, 1); continue; }
    if (n === 'obur' && next === 'gun') { date = addDays(today, 2); i++; continue; }
    if (n === 'oburgun') { date = addDays(today, 2); continue; }
    if (n in WEEKDAY_WORDS && !tok.startsWith('#')) {
      const diff = (WEEKDAY_WORDS[n] - weekdayIndex(today) + 7) % 7;
      date = addDays(today, diff);
      continue;
    }

    const dm = tok.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{4}))?$/);
    if (dm) {
      const y = dm[3] ? Number(dm[3]) : Number(today.slice(0, 4));
      let key = `${y}-${pad(dm[2])}-${pad(dm[1])}`;
      if (isValidDateKey(key)) {
        if (!dm[3] && key < today) key = `${y + 1}-${pad(dm[2])}-${pad(dm[1])}`;
        if (isValidDateKey(key)) { date = key; continue; }
      }
    }

    const tm = tok.match(/^(\d{1,2}):(\d{2})$/);
    if (tm && Number(tm[1]) < 24 && Number(tm[2]) < 60) { time = `${pad(tm[1])}:${tm[2]}`; continue; }

    if (tok.startsWith('#') && tok.length > 1) {
      const c = matchCourse(stripPunct(tok.slice(1)), courses);
      if (c) { courseId = c.id; continue; }
    }

    if (tok === '!!') { priority = 'high'; continue; }
    if (tok.startsWith('!') && tok.length > 1) {
      const p = PRIORITY_WORDS[normalizeTr(tok.slice(1))];
      if (p) { priority = p; continue; }
    }

    titleParts.push(tok);
  }

  const title = titleParts.join(' ').trim();
  if (!title) fail('Görev başlığı boş olamaz.', 'title');
  return { title, date: date || today, time, courseId, priority };
}

// Önizleme parçaları: ['Fizik ödevi', '15 Eki Per 14:00', 'Fizik I', 'Yüksek']
export function describeParsed(p, { today, courses = [] }) {
  const parts = [p.title];
  const d = parseDate(p.date);
  const dayText = formatRelativeDay(p.date, today);
  const longDay = ['Bugün', 'Yarın', 'Dün'].includes(dayText) ? `${dayText}, ${WEEKDAYS_TR[weekdayIndex(d)]}` : dayText;
  parts.push(p.time ? `${longDay} ${p.time}` : longDay);
  const c = p.courseId ? courses.find((x) => x.id === p.courseId) : null;
  if (c) parts.push(c.name);
  if (p.priority !== 'medium') parts.push(PRIORITY_LABELS[p.priority]);
  return parts;
}
