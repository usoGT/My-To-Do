// IndexedDB dosya deposu: ders notu ekleri (Blob) burada, ek id'si anahtarıyla durur.
const DB_NAME = 'planlayici-files';
const STORE = 'attachments';
let dbPromise = null;

export const isFilesAvailable = () => typeof indexedDB !== 'undefined';

function openDb() {
  if (!isFilesAvailable()) return Promise.reject(new Error('Bu tarayıcıda dosya deposu (IndexedDB) kullanılamıyor.'));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { dbPromise = null; reject(req.error || new Error('Dosya deposu açılamadı.')); };
      req.onblocked = () => reject(new Error('Dosya deposu başka bir sekmede meşgul.'));
    });
  }
  return dbPromise;
}

async function run(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    let result;
    const req = fn(store);
    if (req) req.onsuccess = () => { result = req.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('İşlem iptal edildi.'));
  });
}

export const putFile = (id, blob) => run('readwrite', (s) => s.put(blob, id));
export const getFile = (id) => run('readonly', (s) => s.get(id));
export const deleteFile = (id) => run('readwrite', (s) => s.delete(id));
export const listFileIds = () => run('readonly', (s) => s.getAllKeys());
export const clearFiles = () => run('readwrite', (s) => s.clear());

// Toplam boyut (bayt, yaklaşık)
export async function totalFilesSize() {
  const ids = await listFileIds();
  let total = 0;
  for (const id of ids) {
    const b = await getFile(id);
    if (b) total += b.size;
  }
  return total;
}
