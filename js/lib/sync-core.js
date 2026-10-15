// Senkronizasyonun saf çekirdeği (DOM ve ağdan bağımsız, test edilir).
// Sunucudaki her satır bir kayıttır: { collection, id, data, deleted }.
//   - Dizi koleksiyonları (görevler, dersler …): id = kaydın id'si
//   - routineLogs: id = 'YYYY-MM-DD', data = o gün yapılan rutin id'leri
//   - settings: id = 'main', data = ayarlar (cihaza özel alanlar hariç)

export const ARRAY_COLLECTIONS = ['courses', 'schedule', 'tasks', 'routines', 'goals', 'quickNotes', 'courseNotes', 'pomodoroSessions', 'exams'];

// Cihaza özel ayarlar senkronlanmaz (bildirim izni her cihazda ayrı verilir).
const DEVICE_SETTINGS = ['notifications', 'lastBackupAt'];

export const keyOf = (collection, id) => `${collection}:${id}`;

function settingsData(settings) {
  const out = { ...settings };
  for (const k of DEVICE_SETTINGS) delete out[k];
  return out;
}

// State'teki tüm kayıtlar (ilk yüklemede "her şeyi gönder" için)
export function recordsFromState(state) {
  const out = [];
  for (const c of ARRAY_COLLECTIONS) {
    for (const item of state[c] || []) out.push({ collection: c, id: String(item.id), data: item });
  }
  for (const [day, ids] of Object.entries(state.routineLogs || {})) {
    if (ids && ids.length) out.push({ collection: 'routineLogs', id: day, data: ids });
  }
  out.push({ collection: 'settings', id: 'main', data: settingsData(state.settings) });
  return out;
}

// Sadece kullanıcının kendi verisi var mı? (Ayarlar sayılmaz)
export function hasUserData(state) {
  return ARRAY_COLLECTIONS.some((c) => (state[c] || []).length > 0) || Object.keys(state.routineLogs || {}).length > 0;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// İki state arasındaki değişen kayıtlar: [{ collection, id, data }] — silinenlerde data = null
export function diffStates(prev, next) {
  const changes = [];
  for (const c of ARRAY_COLLECTIONS) {
    const before = new Map((prev[c] || []).map((x) => [String(x.id), x]));
    const after = new Map((next[c] || []).map((x) => [String(x.id), x]));
    for (const [id, item] of after) {
      if (!before.has(id) || !same(before.get(id), item)) changes.push({ collection: c, id, data: item });
    }
    for (const id of before.keys()) if (!after.has(id)) changes.push({ collection: c, id, data: null });
  }
  const la = prev.routineLogs || {};
  const lb = next.routineLogs || {};
  for (const day of new Set([...Object.keys(la), ...Object.keys(lb)])) {
    const a = la[day] || [];
    const b = lb[day] || [];
    if (!same(a, b)) changes.push({ collection: 'routineLogs', id: day, data: b.length ? b : null });
  }
  const sa = settingsData(prev.settings || {});
  const sb = settingsData(next.settings || {});
  if (!same(sa, sb)) changes.push({ collection: 'settings', id: 'main', data: sb });
  return changes;
}

// Sunucudan gelen kayıtları state taslağına uygular. skip: bu cihazda gönderilmeyi bekleyen
// kayıtların anahtarları (yereldeki son değişiklik kazanır, sonra sunucuya gider).
// Döner: uygulanan kayıt sayısı
export function applyRemote(draft, records, skip = new Set()) {
  let applied = 0;
  for (const r of records) {
    const k = keyOf(r.collection, r.id);
    if (skip.has(k)) continue;
    const gone = r.deleted || r.data === null || r.data === undefined;
    if (ARRAY_COLLECTIONS.includes(r.collection)) {
      const list = draft[r.collection] || (draft[r.collection] = []);
      const i = list.findIndex((x) => String(x.id) === r.id);
      if (gone) { if (i >= 0) { list.splice(i, 1); applied++; } } else if (i >= 0) { list[i] = r.data; applied++; } else { list.push(r.data); applied++; }
    } else if (r.collection === 'routineLogs') {
      if (gone) delete draft.routineLogs[r.id];
      else draft.routineLogs[r.id] = r.data;
      applied++;
    } else if (r.collection === 'settings' && !gone) {
      const keep = {};
      for (const f of DEVICE_SETTINGS) keep[f] = draft.settings[f];
      draft.settings = { ...draft.settings, ...r.data, ...keep };
      applied++;
    }
  }
  return applied;
}

// Ders notlarındaki ek id'leri (yüklenecek / silinecek dosyaları bulmak için)
export function attachmentIdsOf(state) {
  const ids = new Set();
  for (const n of state.courseNotes || []) for (const a of n.attachments || []) ids.add(a.id);
  return ids;
}

// Sunucu zaman damgalarından en büyüğü (bir sonraki çekmenin başlangıcı)
export function maxCursor(cursor, records) {
  let m = cursor;
  for (const r of records) if (r.updated_at && (!m || r.updated_at > m)) m = r.updated_at;
  return m;
}
