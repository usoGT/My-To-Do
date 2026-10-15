// iPhone/Android'e özel yetenekler: bildirim, dosya paylaşma/kaydetme, durum çubuğu.
// Tarayıcıda ve Electron'da bu fonksiyonlar sessizce hiçbir şey yapmaz (false döner).
import { isCapacitor, plugin } from './platform.js';

const LN = () => plugin('LocalNotifications');

export async function nativeNotifyPermission(request = false) {
  const ln = LN();
  if (!ln) return 'unsupported';
  try {
    let p = await ln.checkPermissions();
    if (request && p.display !== 'granted') p = await ln.requestPermissions();
    return p.display; // 'granted' | 'denied' | 'prompt'
  } catch {
    return 'unsupported';
  }
}

// Hemen bildirim gösterir
export async function nativeNotify(title, body) {
  const ln = LN();
  if (!ln) return false;
  try {
    await ln.schedule({ notifications: [{ id: Math.floor(Math.random() * 1e6) + 1e6, title, body }] });
    return true;
  } catch {
    return false;
  }
}

// Belirli bir zamanda bildirim (uygulama kapalıyken de gelir)
export async function nativeScheduleAt(id, at, title, body) {
  const ln = LN();
  if (!ln) return false;
  try {
    await ln.schedule({ notifications: [{ id, title, body, schedule: { at, allowWhileIdle: true } }] });
    return true;
  } catch {
    return false;
  }
}

export async function nativeCancel(ids) {
  const ln = LN();
  if (!ln || !ids.length) return;
  try { await ln.cancel({ notifications: ids.map((id) => ({ id })) }); } catch { /* yok say */ }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

// Dosyayı geçici klasöre yazar ve paylaşım menüsünü açar ("Dosyalar'a kaydet", Drive, WhatsApp …)
export async function nativeShareFile(blob, fileName) {
  const fs = plugin('Filesystem');
  const share = plugin('Share');
  if (!fs || !share) return false;
  const { uri } = await fs.writeFile({ path: fileName, data: await blobToBase64(blob), directory: 'CACHE' });
  try {
    await share.share({ title: fileName, url: uri, dialogTitle: fileName });
  } catch (err) {
    // Kullanıcı paylaşımı kapattıysa hata değildir
    if (!/cancel/i.test(String(err && err.message))) throw err;
  }
  return true;
}

export async function setStatusBar(dark) {
  const sb = plugin('StatusBar');
  if (!sb) return;
  try { await sb.setStyle({ style: dark ? 'DARK' : 'LIGHT' }); } catch { /* yok say */ }
}

export { isCapacitor };
