// Ders notu eylemleri. Eklerin dosyası IndexedDB'de (lib/attachments.js), burada sadece bilgisi tutulur.
import { update, getState } from '../store.js';
import { createId, nowIso } from '../../lib/ids.js';
import { fail } from '../../lib/errors.js';

export const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_NOTE = 10;

// Saf doğrulama: { ok, error }
export function validateAttachment(file, existingCount) {
  if (!file) return { ok: false, error: 'Dosya seçilmedi.' };
  if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, error: `"${file.name}" eklenemedi: sadece PDF ve resim (PNG, JPG, WEBP, GIF) eklenebilir.` };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: `"${file.name}" eklenemedi: dosya 10 MB'tan büyük.` };
  if (existingCount >= MAX_FILES_PER_NOTE) return { ok: false, error: 'Bir nota en fazla 10 ek eklenebilir.' };
  return { ok: true };
}

export function addCourseNote({ courseId, title = '', body = '' }) {
  if (!getState().courses.some((c) => c.id === courseId)) fail('Önce bir ders seç.', 'courseId');
  const now = nowIso();
  const note = { id: createId(), courseId, title: String(title).slice(0, 150), body: String(body), attachments: [], createdAt: now, updatedAt: now };
  update('notes/add', (s) => { s.courseNotes.push(note); });
  return note;
}

export function updateCourseNote(id, patch) {
  const state = getState();
  if (patch.courseId && !state.courses.some((c) => c.id === patch.courseId)) fail('Ders bulunamadı.');
  update('notes/update', (s) => {
    const n = s.courseNotes.find((x) => x.id === id);
    if (!n) return;
    if ('title' in patch) n.title = String(patch.title).slice(0, 150);
    if ('body' in patch) n.body = String(patch.body).slice(0, 200000);
    if (patch.courseId) n.courseId = patch.courseId;
    n.updatedAt = nowIso();
  });
}

// Silinen notun ek id'lerini döndürür (dosyaları silmek için).
export function deleteCourseNote(id) {
  const note = getState().courseNotes.find((n) => n.id === id);
  if (!note) return [];
  update('notes/delete', (s) => { s.courseNotes = s.courseNotes.filter((n) => n.id !== id); });
  return note.attachments.map((a) => a.id);
}

export function addAttachmentMeta(noteId, meta) {
  update('notes/attach', (s) => {
    const n = s.courseNotes.find((x) => x.id === noteId);
    if (!n) return;
    n.attachments.push({ id: meta.id || createId(), name: String(meta.name).slice(0, 200), type: meta.type, size: meta.size });
    n.updatedAt = nowIso();
  });
}

export function removeAttachmentMeta(noteId, attachmentId) {
  update('notes/detach', (s) => {
    const n = s.courseNotes.find((x) => x.id === noteId);
    if (!n) return;
    n.attachments = n.attachments.filter((a) => a.id !== attachmentId);
    n.updatedAt = nowIso();
  });
}
