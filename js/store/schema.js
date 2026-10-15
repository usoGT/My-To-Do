// Varsayılan state, şema sürümü ve geçiş (migration).

export const SCHEMA_VERSION = 3;

export const COURSE_COLORS = ['indigo', 'blue', 'teal', 'green', 'amber', 'orange', 'red', 'pink'];

export const COLOR_LABELS = {
  indigo: 'Çivit', blue: 'Mavi', teal: 'Turkuaz', green: 'Yeşil',
  amber: 'Kehribar', orange: 'Turuncu', red: 'Kırmızı', pink: 'Pembe',
};

export function createDefaultSettings() {
  return {
    name: '',
    theme: 'system',
    dayStart: '08:00',
    dayEnd: '23:00',
    showWeekend: true,
    pomodoro: {
      focusMin: 25,
      shortBreakMin: 5,
      longBreakMin: 15,
      longBreakEvery: 4,
      autoStartNext: false,
      sound: true,
    },
    notifications: false,
    includeAttachmentsInBackup: true,
    lastBackupAt: null,
  };
}

export function createDefaultState() {
  return {
    version: SCHEMA_VERSION,
    settings: createDefaultSettings(),
    courses: [],
    schedule: [],
    tasks: [],
    routines: [],
    routineLogs: {},
    goals: [],
    quickNotes: [],
    courseNotes: [],
    pomodoroSessions: [],
    exams: [],
    // { id, courseId, title, type ('vize'|'final'|'quiz'|'butunleme'|'proje'), date, time|null, room, notes } (Faz 15)
  };
}

const COLLECTIONS = ['courses', 'schedule', 'tasks', 'routines', 'goals', 'quickNotes', 'courseNotes', 'pomodoroSessions', 'exams'];

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Varsayılan nesneye kayıtlı değerleri derinlemesine yerleştirir (eksik alanlar varsayılandan gelir).
function deepMerge(base, saved) {
  if (!isPlainObject(saved)) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(saved)) {
    if (isPlainObject(base[k]) && isPlainObject(v)) out[k] = deepMerge(base[k], v);
    else if (v !== undefined) out[k] = v;
  }
  return out;
}

// Şema geçişleri: migrations[n] veriyi n. sürümden n+1'e çevirir.
const migrations = {
  // v1 → v2 (Faz 14): görevlere teslim tarihi ve hatırlatıcı
  1: (d) => ({
    ...d,
    tasks: (Array.isArray(d.tasks) ? d.tasks : []).map((t) => ({ dueDate: null, reminderAt: null, reminderSent: false, ...t })),
  }),
  // v2 → v3 (Faz 15): sınav takvimi
  2: (d) => ({ ...d, exams: Array.isArray(d.exams) ? d.exams : [] }),
};

// Kayıtlı (belki eski ya da eksik) veriyi geçerli şemaya getirir.
export function migrate(data) {
  if (!isPlainObject(data)) return createDefaultState();
  let d = { ...data };
  let v = Number.isInteger(d.version) ? d.version : 1;
  while (v < SCHEMA_VERSION) {
    if (migrations[v]) d = migrations[v](d);
    v += 1;
  }
  const def = createDefaultState();
  const out = { ...def, ...d, version: SCHEMA_VERSION };
  out.settings = deepMerge(def.settings, d.settings);
  for (const c of COLLECTIONS) out[c] = Array.isArray(d[c]) ? d[c] : [];
  out.routineLogs = isPlainObject(d.routineLogs) ? d.routineLogs : {};
  return out;
}
