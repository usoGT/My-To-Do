// Yedek alma / yükleme. Biçim: { app, format, exportedAt, schemaVersion, state, files }
import { SCHEMA_VERSION, migrate } from '../store/schema.js';
import { saveBlob } from './save-file.js';

export const BACKUP_FORMAT = 1;

export function createBackup(state, files = [], now = new Date()) {
  return {
    app: 'planlayici',
    format: BACKUP_FORMAT,
    exportedAt: now.toISOString(),
    schemaVersion: SCHEMA_VERSION,
    state,
    files,
  };
}

export const backupFileName = (dateKey) => `planlayici-yedek-${dateKey}.json`;

// { ok, error, state, files }
export function validateBackup(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { ok: false, error: 'Bu dosya bir My to do yedeği değil.' };
  }
  if (json.app !== 'planlayici') return { ok: false, error: 'Bu dosya bir My to do yedeği değil.' };
  if (!json.state || typeof json.state !== 'object') return { ok: false, error: 'Yedek dosyasında veri bulunamadı.' };
  if (Number(json.schemaVersion) > SCHEMA_VERSION) {
    return { ok: false, error: 'Bu yedek uygulamanın daha yeni bir sürümünden alınmış. Önce uygulamayı güncelle.' };
  }
  const files = Array.isArray(json.files)
    ? json.files.filter((f) => f && typeof f.id === 'string' && typeof f.dataBase64 === 'string')
    : [];
  return { ok: true, state: migrate(json.state), files };
}

export function parseBackupText(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Dosya okunamadı: geçerli bir JSON değil.' };
  }
  return validateBackup(json);
}

export function downloadJson(obj, fileName) {
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
  return saveBlob(blob, fileName);
}

export function readFileText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

// Blob ↔ base64 (ekler için, Faz 9)
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export function base64ToBlob(b64, type = 'application/octet-stream') {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}
