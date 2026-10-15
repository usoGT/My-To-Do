// Ek dosyası işlemleri: doğrula → IndexedDB'ye yaz → store'a bilgisini ekle.
import { getState } from '../store/store.js';
import { createId } from './ids.js';
import { putFile, getFile, deleteFile } from './files-db.js';
import { validateAttachment, addAttachmentMeta, removeAttachmentMeta } from '../store/actions/course-notes.js';

export async function attachFile(noteId, file) {
  const note = getState().courseNotes.find((n) => n.id === noteId);
  if (!note) throw new Error('Not bulunamadı.');
  const v = validateAttachment(file, note.attachments.length);
  if (!v.ok) throw new Error(v.error);
  const id = createId();
  await putFile(id, file);
  addAttachmentMeta(noteId, { id, name: file.name, type: file.type, size: file.size });
}

export async function removeAttachment(noteId, attachmentId) {
  removeAttachmentMeta(noteId, attachmentId);
  await deleteFile(attachmentId).catch((err) => console.error(err));
}

export function deleteFilesQuietly(ids = []) {
  for (const id of ids) deleteFile(id).catch(() => {});
}

// Ek bu cihazda yoksa (başka cihazdan eklenmişse) hesaptan indirilir.
export async function attachmentUrl(attachmentId) {
  let blob = await getFile(attachmentId).catch(() => null);
  if (!blob) {
    const { fetchMissingFile } = await import('./sync.js');
    blob = await fetchMissingFile(attachmentId).catch(() => null);
  }
  return blob ? URL.createObjectURL(blob) : null;
}
