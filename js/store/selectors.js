// Türetilmiş veriler (saf fonksiyonlar, DOM'a dokunmaz).
import { timeToMinutes, minutesToTime, weekdayIndex, addDays, toDateKey, diffDays } from '../lib/dates.js';
import { findFreeSlots, totalFreeMinutes } from '../lib/time-slots.js';

const byStart = (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start);

export const getCourse = (state, id) => state.courses.find((c) => c.id === id) || null;

export function getCoursesSorted(state) {
  return [...state.courses].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

// Bir haftanın gününe ait ders saatleri (ders bilgisiyle, saate göre).
export function getScheduleForWeekday(state, weekday) {
  return state.schedule
    .filter((e) => e.weekday === weekday)
    .map((e) => ({ ...e, course: getCourse(state, e.courseId) }))
    .filter((e) => e.course)
    .sort(byStart);
}

export const getClassesForDate = (state, key) => getScheduleForWeekday(state, weekdayIndex(key));

export function getWeeklyMinutes(state, courseId) {
  return state.schedule
    .filter((e) => e.courseId === courseId)
    .reduce((sum, e) => sum + timeToMinutes(e.end) - timeToMinutes(e.start), 0);
}

// Sadece derslere göre bir günün boş zamanları (Ders Programı sayfası için).
export function getWeekdayFreeSlots(state, weekday) {
  const { dayStart, dayEnd } = state.settings;
  return findFreeSlots({ dayStart, dayEnd, busy: getScheduleForWeekday(state, weekday) });
}

// ---------- Görevler ----------
// Sıralama: tamamlanmayanlar önce; saati olanlar saate göre; sonra order; tamamlananlar en altta.
export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.time && b.time) return timeToMinutes(a.time) - timeToMinutes(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return (a.order || 0) - (b.order || 0);
  });
}

export const getTasksForDate = (state, key) => sortTasks(state.tasks.filter((t) => t.date === key));

export function getOverdueTasks(state, today) {
  return state.tasks
    .filter((t) => t.date && t.date < today && !t.done)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.order || 0) - (b.order || 0)));
}

export const getUndatedTasks = (state) => sortTasks(state.tasks.filter((t) => !t.date && !t.done));
export const getUndatedDoneTasks = (state) => state.tasks.filter((t) => !t.date && t.done);

export const getTasksByCourse = (state, courseId) => state.tasks.filter((t) => t.courseId === courseId);

export const getTask = (state, id) => state.tasks.find((t) => t.id === id) || null;

// ---------- Rutinler ----------
const startOf = (r) => r.startDate || toDateKey(new Date(r.createdAt));

export const isRoutineDone = (state, routineId, key) => (state.routineLogs[key] || []).includes(routineId);

export function isRoutineScheduled(routine, key) {
  return routine.weekdays.includes(weekdayIndex(key)) && key >= startOf(routine);
}

export function getRoutinesForDate(state, key) {
  return state.routines
    .filter((r) => !r.archived && isRoutineScheduled(r, key))
    .map((r) => ({ ...r, done: isRoutineDone(state, r.id, key) }))
    .sort((a, b) => (a.time && b.time ? timeToMinutes(a.time) - timeToMinutes(b.time) : a.time ? -1 : b.time ? 1 : a.title.localeCompare(b.title, 'tr')));
}

// Güncel seri: bugünden geriye, sadece planlı günler; bugün yapılmadıysa atlanır.
export function getRoutineStreak(state, routineId, today) {
  const r = state.routines.find((x) => x.id === routineId);
  if (!r) return 0;
  const start = startOf(r);
  let d = today;
  if (isRoutineScheduled(r, today) && !isRoutineDone(state, r.id, today)) d = addDays(today, -1);
  let count = 0;
  for (let i = 0; i < 3700 && d >= start; i++) {
    if (r.weekdays.includes(weekdayIndex(d))) {
      if (isRoutineDone(state, r.id, d)) count++;
      else break;
    }
    d = addDays(d, -1);
  }
  return count;
}

export function getRoutineBestStreak(state, routineId, today) {
  const r = state.routines.find((x) => x.id === routineId);
  if (!r) return 0;
  let best = 0;
  let cur = 0;
  for (let d = startOf(r), i = 0; d <= today && i < 3700; d = addDays(d, 1), i++) {
    if (!r.weekdays.includes(weekdayIndex(d))) continue;
    if (isRoutineDone(state, r.id, d)) { cur++; best = Math.max(best, cur); } else if (d !== today) cur = 0;
  }
  return best;
}

// Son N günde planlı günlerin yüzde kaçı yapıldı (bugün yapılmadıysa sayılmaz). Planlı gün yoksa null.
export function getRoutineCompletionRate(state, routineId, today, days = 30) {
  const r = state.routines.find((x) => x.id === routineId);
  if (!r) return null;
  let planned = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i);
    if (!isRoutineScheduled(r, d)) continue;
    const isDone = isRoutineDone(state, r.id, d);
    if (d === today && !isDone) continue;
    planned++;
    if (isDone) done++;
  }
  return planned ? Math.round((done / planned) * 100) : null;
}

// ---------- Gün özeti (Bugün ve Planlayıcı gün görünümü) ----------
const DEFAULT_TASK_MIN = 30;

// now: { key, minutes } — bugünse geçmiş saatler "kalan boş zaman"dan düşülür.
export function getDayAgenda(state, key, now = null) {
  const isToday = now && now.key === key;
  const classes = getClassesForDate(state, key);
  const tasks = getTasksForDate(state, key);
  const routines = getRoutinesForDate(state, key);
  const overdue = isToday ? getOverdueTasks(state, key) : [];

  const busy = [
    ...classes.map((c) => ({ start: c.start, end: c.end })),
    ...tasks.filter((t) => t.time && !t.done).map((t) => ({ start: timeToMinutes(t.time), end: timeToMinutes(t.time) + (t.estimateMin || DEFAULT_TASK_MIN) })),
    ...routines.filter((r) => r.time && !r.done).map((r) => ({ start: timeToMinutes(r.time), end: timeToMinutes(r.time) + (r.durationMin || DEFAULT_TASK_MIN) })),
  ];
  const { dayStart, dayEnd } = state.settings;
  const freeSlots = findFreeSlots({ dayStart, dayEnd, busy });
  const remaining = isToday ? findFreeSlots({ dayStart, dayEnd, busy, fromMinutes: now.minutes }) : freeSlots;

  const timeline = [
    ...classes.map((c) => ({ kind: 'class', start: c.start, end: c.end, item: c })),
    ...tasks.filter((t) => t.time).map((t) => ({ kind: 'task', start: t.time, end: minutesToTime(timeToMinutes(t.time) + (t.estimateMin || DEFAULT_TASK_MIN)), item: t })),
    ...routines.filter((r) => r.time).map((r) => ({ kind: 'routine', start: r.time, end: minutesToTime(timeToMinutes(r.time) + (r.durationMin || DEFAULT_TASK_MIN)), item: r })),
    ...freeSlots.map((f) => ({ kind: 'free', start: f.start, end: f.end, item: f })),
  ].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start) || (a.kind === 'free' ? 1 : -1));

  return {
    classes,
    tasks,
    overdue,
    routines,
    freeSlots,
    timeline,
    stats: {
      tasksDone: tasks.filter((t) => t.done).length,
      tasksTotal: tasks.length,
      routinesDone: routines.filter((r) => r.done).length,
      routinesTotal: routines.length,
      freeMinutes: totalFreeMinutes(freeSlots),
      remainingFreeMinutes: totalFreeMinutes(remaining),
    },
  };
}

// ---------- Hedefler ----------
export function getGoalsFor(state, period, periodKey) {
  return state.goals
    .filter((g) => g.period === period && g.periodKey === periodKey)
    .sort((a, b) => (a.done === b.done ? a.createdAt.localeCompare(b.createdAt) : a.done ? 1 : -1));
}

export function getGoalProgress(state, goalId) {
  const linked = state.tasks.filter((t) => t.goalId === goalId);
  return { done: linked.filter((t) => t.done).length, total: linked.length };
}

// ---------- Etkinlik (ısı haritası) ----------
// Gün başına { tasks, routines, focusMin } — tüm veriden bir kez çıkarılır.
export function buildActivityIndex(state) {
  const idx = new Map();
  const get = (k) => {
    if (!idx.has(k)) idx.set(k, { tasks: 0, routines: 0, focusMin: 0 });
    return idx.get(k);
  };
  for (const t of state.tasks) {
    if (!t.done) continue;
    const k = t.date || (t.doneAt ? toDateKey(new Date(t.doneAt)) : null);
    if (k) get(k).tasks++;
  }
  for (const [k, ids] of Object.entries(state.routineLogs)) get(k).routines += ids.length;
  for (const p of state.pomodoroSessions) get(toDateKey(new Date(p.startedAt))).focusMin += p.durationMin || 0;
  return idx;
}

export const dayScore = (a) => (a ? a.tasks + a.routines + Math.floor(a.focusMin / 25) : 0);

export function scoreToLevel(score) {
  if (score <= 0) return 0;
  if (score <= 2) return 1;
  if (score <= 4) return 2;
  if (score <= 7) return 3;
  return 4;
}

// Isı haritasında bir günün sütunu ve satırı (sütun 0 = 1 Ocak'ı içeren hafta, satır 0 = Pazartesi)
export function heatmapCell(yKey, key) {
  const first = `${yKey}-01-01`;
  const start = addDays(first, -weekdayIndex(first));
  return { col: Math.floor(diffDays(start, key) / 7), row: weekdayIndex(key) };
}

export function getYearSummary(state, yKey, idx = buildActivityIndex(state)) {
  let tasks = 0;
  let focus = 0;
  let best = 0;
  let cur = 0;
  const monthScores = Array(12).fill(0);
  for (let d = `${yKey}-01-01`; d.startsWith(yKey); d = addDays(d, 1)) {
    const a = idx.get(d);
    const sc = dayScore(a);
    if (a) { tasks += a.tasks; focus += a.focusMin; }
    monthScores[Number(d.slice(5, 7)) - 1] += sc;
    if (sc > 0) { cur++; best = Math.max(best, cur); } else cur = 0;
  }
  const max = Math.max(...monthScores);
  return { tasks, focusMin: focus, longestStreak: best, bestMonth: max > 0 ? monthScores.indexOf(max) : null };
}

// ---------- Odak (Pomodoro) ----------
// Bir dersin seansları: courseId'si bu ders olanlar + bu dersin bir görevine bağlı olanlar (çift sayım yok).
export function getCourseSessions(state, courseId) {
  const taskIds = new Set(state.tasks.filter((t) => t.courseId === courseId).map((t) => t.id));
  return state.pomodoroSessions.filter((p) => p.courseId === courseId || (p.taskId && taskIds.has(p.taskId)));
}

export function sessionsByDay(sessions) {
  const m = new Map();
  for (const p of sessions) {
    const k = toDateKey(new Date(p.startedAt));
    m.set(k, (m.get(k) || 0) + (p.durationMin || 0));
  }
  return m;
}

// ---------- Ders sayfası ----------
export function getNextClass(state, courseId, now) {
  const entries = state.schedule.filter((e) => e.courseId === courseId);
  if (!entries.length) return null;
  for (let i = 0; i <= 7; i++) {
    const key = addDays(now.key, i);
    const wd = weekdayIndex(key);
    const list = entries
      .filter((e) => e.weekday === wd && (i > 0 || timeToMinutes(e.start) > now.minutes))
      .sort(byStart);
    if (list.length) return { date: key, ...list[0] };
  }
  return null;
}

export function getCourseOverview(state, courseId, now) {
  const course = getCourse(state, courseId);
  if (!course) return null;
  const today = now.key;
  const tasks = getTasksByCourse(state, courseId);
  const open = tasks.filter((t) => !t.done);
  const sessions = getCourseSessions(state, courseId);
  const byDay = sessionsByDay(sessions);
  const weekStart = addDays(today, -weekdayIndex(today));
  let thisWeek = 0;
  for (const [k, v] of byDay) if (k >= weekStart && k <= today) thisWeek += v;
  return {
    course,
    scheduleEntries: state.schedule.filter((e) => e.courseId === courseId).sort((a, b) => a.weekday - b.weekday || byStart(a, b)),
    weeklyMinutes: getWeeklyMinutes(state, courseId),
    overdueTasks: open.filter((t) => t.date && t.date < today).sort((a, b) => a.date.localeCompare(b.date)),
    openTasks: open.filter((t) => !t.date || t.date >= today).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || (a.time || '99').localeCompare(b.time || '99')),
    doneTasks: tasks.filter((t) => t.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')),
    notes: state.courseNotes.filter((n) => n.courseId === courseId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    goals: state.goals.filter((g) => g.courseId === courseId),
    focus: {
      totalMin: sessions.reduce((s, p) => s + (p.durationMin || 0), 0),
      thisWeekMin: thisWeek,
      last7Days: Array.from({ length: 7 }, (_, i) => {
        const key = addDays(today, i - 6);
        return { key, minutes: byDay.get(key) || 0 };
      }),
    },
    nextClass: getNextClass(state, courseId, now),
  };
}

// ---------- Pomodoro istatistikleri ----------
export function getWeeklyFocus(state, weekStartKey) {
  const byDay = sessionsByDay(state.pomodoroSessions);
  return Array.from({ length: 7 }, (_, i) => {
    const key = addDays(weekStartKey, i);
    return { key, minutes: byDay.get(key) || 0 };
  });
}

export function getDayFocus(state, key) {
  const list = state.pomodoroSessions.filter((p) => toDateKey(new Date(p.startedAt)) === key);
  return { count: list.length, minutes: list.reduce((s, p) => s + (p.durationMin || 0), 0) };
}

// [from, to] aralığında derslere göre odak; dersi olmayanlar "Diğer" (course: null)
export function getFocusByCourse(state, fromKey, toKey) {
  const taskCourse = new Map(state.tasks.map((t) => [t.id, t.courseId]));
  const totals = new Map();
  for (const p of state.pomodoroSessions) {
    const k = toDateKey(new Date(p.startedAt));
    if (k < fromKey || k > toKey) continue;
    const cid = p.courseId || (p.taskId ? taskCourse.get(p.taskId) : null) || null;
    const course = cid ? getCourse(state, cid) : null;
    const key = course ? course.id : '';
    totals.set(key, (totals.get(key) || 0) + (p.durationMin || 0));
  }
  return [...totals.entries()]
    .map(([id, minutes]) => ({ course: id ? getCourse(state, id) : null, minutes }))
    .sort((a, b) => b.minutes - a.minutes || (a.course ? 0 : 1) - (b.course ? 0 : 1));
}

// ---------- Teslim tarihleri ve hatırlatıcılar (Faz 14) ----------
// Teslimi geçmiş ya da önümüzdeki `days` gün içinde olan, tamamlanmamış görevler (en yakın önce)
export function getUpcomingDeadlines(state, today, days = 3) {
  const limit = addDays(today, days);
  return state.tasks
    .filter((t) => !t.done && t.dueDate && t.dueDate <= limit)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

// nowLocal: 'YYYY-MM-DDTHH:MM' (yerel saat)
export function getDueReminders(state, nowLocal) {
  return state.tasks.filter((t) => !t.done && t.reminderAt && !t.reminderSent && t.reminderAt <= nowLocal);
}

// ---------- Sınavlar (Faz 15) ----------
const EXAM_LABELS = { vize: 'Vize', final: 'Final', quiz: 'Quiz', butunleme: 'Bütünleme', proje: 'Proje teslimi' };

export function examTitle(state, exam) {
  const c = getCourse(state, exam.courseId);
  return exam.title || `${c ? c.name : 'Ders'} ${EXAM_LABELS[exam.type] || 'sınavı'}`;
}

const examSort = (a, b) => a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99');

// Bugün ve sonrası; days verilirse o kadar gün içindekiler
export function getUpcomingExams(state, today, days = null) {
  const limit = days === null ? '9999-12-31' : addDays(today, days);
  return state.exams.filter((e) => e.date >= today && e.date <= limit).sort(examSort);
}

export const getPastExams = (state, today) => state.exams.filter((e) => e.date < today).sort((a, b) => examSort(b, a));
export const getExamsForDate = (state, key) => state.exams.filter((e) => e.date === key).sort(examSort);
export const getExamsByCourse = (state, courseId) => state.exams.filter((e) => e.courseId === courseId).sort(examSort);

// Sınava kadar kalan günlerin boş zamanlarına dağılmış çalışma önerileri: [{ date, time, minutes }]
// Yarından sınavdan önceki güne kadar, en az `minutes` dakikalık boşluğu olan günler; sınava yakın günler öncelikli.
export function suggestStudyPlan(state, exam, today, { sessions = 5, minutes = 60 } = {}) {
  const eligible = [];
  for (let d = addDays(today, 1); d < exam.date; d = addDays(d, 1)) {
    const slot = getDayAgenda(state, d, null).freeSlots.find((s) => s.minutes >= minutes);
    if (slot) eligible.push({ date: d, time: slot.start, minutes });
  }
  if (eligible.length <= sessions) return eligible;
  if (sessions <= 1) return [eligible[eligible.length - 1]];
  // Eşit aralıklarla seç; son gün (sınavdan önceki en yakın uygun gün) her zaman dahil
  const picked = new Set();
  for (let i = 0; i < sessions; i++) picked.add(Math.round((i * (eligible.length - 1)) / (sessions - 1)));
  return [...picked].sort((a, b) => a - b).map((i) => eligible[i]);
}
