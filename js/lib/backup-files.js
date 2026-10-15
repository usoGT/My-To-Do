// Yedeğe eklerin (IndexedDB'deki dosyalar) dahil edilmesi.
import { getFile, putFile, clearFiles as clearDb, isFilesAvailable } from './files-db.js';
import { blobToBase64, base64ToBlob } from './backup.js';

export async function collectFiles(state) {
  if (!state.settings.includeAttachmentsInBackup || !isFilesAvailable()) return [];
  const out = [];
  for (const note of state.courseNotes) {
    for (const a of note.attachments) {
      const blob = await getFile(a.id);
      if (blob) out.push({ id: a.id, name: a.name, type: a.type, dataBase64: await blobToBase64(blob) });
    }
  }
  return out;
}

export async function restoreFiles(files = []) {
  if (!isFilesAvailable()) return;
  await clearDb();
  for (const f of files) await putFile(f.id, base64ToBlob(f.dataBase64, f.type));
}

export async function clearFiles() {
  if (!isFilesAvailable()) return;
  await clearDb().catch(() => {});
}
