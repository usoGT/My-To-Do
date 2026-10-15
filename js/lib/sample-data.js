// Örnek veri: uygulamayı denemek için anlamlı bir başlangıç. Sadece veri boşken yüklenir.
import { createDefaultState } from '../store/schema.js';
import { createId } from './ids.js';
import { addDays, weekdayIndex, monthKey, yearKey, parseDate } from './dates.js';

// Tekrarlanabilir "rastgele" sayılar (her yüklemede aynı sonuç)
function seeded(seed) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

const iso = (dateKey, h = 12, m = 0) => {
  const d = parseDate(dateKey);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export function createSampleData(today, current = null) {
  const s = createDefaultState();
  if (current) s.settings = { ...current.settings };
  const rand = seeded(42);
  const start = addDays(today, -60);

  const course = (name, code, color, teacher, room) => ({ id: createId(), name, code, color, teacher, room, createdAt: iso(start) });
  const mat = course('Matematik I', 'MAT101', 'indigo', 'Dr. Öğr. Üyesi Ayşe Demir', 'A-101');
  const fiz = course('Fizik I', 'FİZ101', 'blue', 'Doç. Dr. Mehmet Kaya', 'B-204');
  const prog = course('Programlamaya Giriş', 'BİL101', 'teal', 'Dr. Öğr. Üyesi Can Aydın', 'Lab-3');
  const ing = course('İngilizce', 'ENG101', 'amber', 'Okt. Elif Şahin', 'C-12');
  s.courses = [mat, fiz, prog, ing];

  const entry = (c, weekday, st, en, type = 'ders', room = '') => ({ id: createId(), courseId: c.id, weekday, start: st, end: en, type, room });
  s.schedule = [
    entry(mat, 0, '09:00', '10:50'),
    entry(fiz, 0, '13:00', '14:50'),
    entry(prog, 1, '10:00', '11:50'),
    entry(ing, 1, '14:00', '15:50'),
    entry(mat, 2, '09:00', '10:50'),
    entry(prog, 2, '13:00', '14:50', 'lab', 'Lab-3'),
    entry(fiz, 3, '10:00', '11:50'),
    entry(ing, 3, '14:00', '14:50'),
    entry(fiz, 4, '09:00', '09:50', 'lab', 'Fizik Lab'),
    entry(prog, 4, '11:00', '12:50'),
  ];

  let order = 1;
  const task = (title, date, extra = {}) => ({
    id: createId(), title, notes: '', date, time: null, estimateMin: null, courseId: null, goalId: null,
    priority: 'medium', dueDate: null, reminderAt: null, reminderSent: false, done: false, doneAt: null, createdAt: iso(date || today, 9), order: order++, ...extra,
  });
  const doneTask = (title, date, extra = {}) => task(title, date, { done: true, doneAt: iso(date, 18), ...extra });

  s.tasks = [
    task('Fizik ödevi: 3. bölüm problemleri', today, { time: '16:00', estimateMin: 90, courseId: fiz.id, priority: 'high' }),
    task('Matematik konu tekrarı (türev)', today, { estimateMin: 60, courseId: mat.id }),
    task('Kütüphaneden kitap al', today, { estimateMin: 30, priority: 'low' }),
    doneTask('İngilizce kelime listesi', today, { courseId: ing.id, estimateMin: 30 }),
    task('Lab raporunu bitir', addDays(today, -1), { courseId: prog.id, priority: 'high', estimateMin: 60, dueDate: addDays(today, 1) }),
    task('Programlama ödevi 2', addDays(today, 2), { time: '20:00', estimateMin: 120, courseId: prog.id, priority: 'high', dueDate: addDays(today, 3) }),
    task('Fizik quiz hazırlığı', addDays(today, 3), { courseId: fiz.id, estimateMin: 60 }),
    task('Staj başvurularını araştır', null, { notes: 'Yaz stajı için 3 şirket seç.' }),
  ];
  // Geçmiş günlere tamamlanmış görevler (ısı haritası için)
  for (let i = 1; i <= 60; i++) {
    const d = addDays(today, -i);
    const n = Math.floor(rand() * 4);
    for (let k = 0; k < n; k++) {
      const c = s.courses[Math.floor(rand() * 4)];
      s.tasks.push(doneTask(`${c.name} çalışması`, d, { courseId: c.id, estimateMin: 30 }));
    }
  }

  const routine = (title, weekdays, time, durationMin, color) => ({
    id: createId(), title, weekdays, time, durationMin, color, archived: false, createdAt: iso(start), startDate: addDays(today, -28),
  });
  const spor = routine('Spor', [0, 2, 4], '07:30', 45, 'green');
  const kitap = routine('20 dk kitap oku', [0, 1, 2, 3, 4, 5, 6], null, 20, 'pink');
  const kelime = routine('İngilizce kelime çalış', [0, 1, 2, 3, 4], '21:00', 15, 'amber');
  s.routines = [spor, kitap, kelime];
  for (let i = 1; i <= 28; i++) {
    const d = addDays(today, -i);
    const wd = weekdayIndex(d);
    const list = [];
    for (const r of s.routines) {
      if (!r.weekdays.includes(wd)) continue;
      const chance = i <= 6 ? 1 : 0.75; // son günlerde seri olsun
      if (rand() < chance) list.push(r.id);
    }
    if (list.length) s.routineLogs[d] = list;
  }

  s.goals = [
    { id: createId(), title: 'Fizik vizesine hazırlan', period: 'month', periodKey: monthKey(today), courseId: fiz.id, done: false, doneAt: null, createdAt: iso(today) },
    { id: createId(), title: 'Her gün kitap oku', period: 'month', periodKey: monthKey(today), courseId: null, done: false, doneAt: null, createdAt: iso(today) },
    { id: createId(), title: 'Dönemi 3.0 üzeri ortalamayla bitir', period: 'year', periodKey: yearKey(today), courseId: null, done: false, doneAt: null, createdAt: iso(today) },
    { id: createId(), title: 'İngilizce B2 sertifikası al', period: 'year', periodKey: yearKey(today), courseId: ing.id, done: false, doneAt: null, createdAt: iso(today) },
  ];
  // İlk göreve hedef bağla
  s.tasks[0].goalId = s.goals[0].id;
  s.tasks[6].goalId = s.goals[0].id;

  s.courseNotes = [
    { id: createId(), courseId: fiz.id, title: 'Newton yasaları', body: '1. Eylemsizlik: Net kuvvet sıfırsa cisim durumunu korur.\n2. F = m · a\n3. Etki-tepki: Her kuvvete eşit ve zıt bir tepki vardır.\n\nSınavda serbest cisim diyagramı mutlaka çizilecek.', attachments: [], createdAt: iso(addDays(today, -7)), updatedAt: iso(addDays(today, -7)) },
    { id: createId(), courseId: mat.id, title: 'Türev kuralları', body: '(xⁿ)\' = n·xⁿ⁻¹\n(sin x)\' = cos x\n(eˣ)\' = eˣ\nZincir kuralı: (f(g(x)))\' = f\'(g(x)) · g\'(x)', attachments: [], createdAt: iso(addDays(today, -3)), updatedAt: iso(addDays(today, -2)) },
    { id: createId(), courseId: prog.id, title: 'Döngüler', body: 'for, while ve do-while farkları.\nSonsuz döngüye dikkat: koşul mutlaka bir noktada false olmalı.', attachments: [], createdAt: iso(addDays(today, -5)), updatedAt: iso(addDays(today, -5)) },
    { id: createId(), courseId: ing.id, title: 'Unit 3 kelimeler', body: 'achieve, consider, establish, require, significant', attachments: [], createdAt: iso(addDays(today, -1)), updatedAt: iso(addDays(today, -1)) },
  ];

  s.quickNotes = [
    { id: createId(), text: 'Kayıt yenileme için öğrenci işlerine uğra', createdAt: iso(today, 10, 15), convertedTo: null },
    { id: createId(), text: 'Proje fikri: kampüs etkinlik takvimi\nHuawei kulübüne öner', createdAt: iso(addDays(today, -1), 21, 40), convertedTo: null },
  ];

  s.exams = [
    { id: createId(), courseId: fiz.id, type: 'vize', title: '', date: addDays(today, 6), time: '10:00', room: 'Amfi 1', notes: 'Kinematik ve Newton yasaları (1–5. bölümler)', createdAt: iso(today) },
    { id: createId(), courseId: mat.id, type: 'quiz', title: '', date: addDays(today, 2), time: '09:00', room: 'A-101', notes: 'Türev kuralları', createdAt: iso(today) },
    { id: createId(), courseId: prog.id, type: 'final', title: '', date: addDays(today, 60), time: '13:00', room: 'Lab-3', notes: '', createdAt: iso(today) },
  ];

  // Pomodoro seansları (son 14 gün)
  for (let i = 0; i <= 14; i++) {
    const d = addDays(today, -i);
    const n = i === 0 ? 2 : Math.floor(rand() * 5);
    for (let k = 0; k < n; k++) {
      const c = s.courses[Math.floor(rand() * 4)];
      const startedAt = iso(d, 10 + k * 2, 0);
      s.pomodoroSessions.push({ id: createId(), startedAt, endedAt: iso(d, 10 + k * 2, 25), durationMin: 25, taskId: null, courseId: c.id });
    }
  }

  return s;
}
