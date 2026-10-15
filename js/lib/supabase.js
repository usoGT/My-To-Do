// Supabase için küçük REST istemcisi (SDK kullanmadan, sadece fetch).
// Kimlik: /auth/v1 · Veri: /rest/v1/items · Dosyalar: /storage/v1 (bucket: attachments)
import { getServerConfig } from '../config.js';

const SESSION_KEY = 'planlayici-session';
const authListeners = new Set();
let session = loadSession();
let refreshing = null;

export class ApiError extends Error {
  constructor(message, { status = 0, code = '' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const isConfigured = () => Boolean(getServerConfig().url && getServerConfig().key);

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}

function saveSession(s) {
  session = s;
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* depolama yok */ }
  authListeners.forEach((fn) => { try { fn(s); } catch (err) { console.error(err); } });
}

export const getSession = () => session;
export const getUser = () => (session ? session.user : null);
export function onAuthChange(fn) { authListeners.add(fn); return () => authListeners.delete(fn); }

function toSession(data) {
  const expiresIn = Number(data.expires_in) || 3600;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at ? Number(data.expires_at) * 1000 : Date.now() + expiresIn * 1000,
    user: data.user ? { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name || '' } : (session?.user || null),
  };
}

// Supabase hata kodlarını Türkçe mesaja çevirir
export function friendlyError(status, body) {
  const code = String(body?.error_code || body?.code || body?.error || '');
  const msg = String(body?.msg || body?.message || body?.error_description || '');
  const all = `${code} ${msg}`.toLowerCase();
  if (all.includes('invalid_credentials') || all.includes('invalid login')) return 'E-posta ya da şifre hatalı.';
  if (all.includes('already') && all.includes('regist')) return 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.';
  if (all.includes('user_already_exists')) return 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.';
  if (all.includes('weak_password') || all.includes('password should be')) return 'Şifre en az 6 karakter olmalı.';
  if (all.includes('email_not_confirmed') || all.includes('not confirmed')) return 'Önce e-postana gelen doğrulama bağlantısına tıkla.';
  if (all.includes('rate') && all.includes('limit')) return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.';
  if (all.includes('invalid') && all.includes('email')) return 'E-posta adresi geçersiz.';
  if (status === 401 || status === 403) return 'Oturumun sona erdi. Lütfen yeniden giriş yap.';
  if (status >= 500) return 'Sunucuda bir sorun var. Biraz sonra tekrar dene.';
  return msg || 'Beklenmeyen bir hata oluştu.';
}

async function request(path, { method = 'GET', body, headers = {}, auth = false, raw = false, retry = true } = {}) {
  const { url, key } = getServerConfig();
  if (!url || !key) throw new ApiError('Hesap sunucusu ayarlanmamış (js/config.js).', { code: 'not_configured' });
  const h = { apikey: key, ...headers };
  if (body !== undefined && !(body instanceof Blob) && !h['Content-Type']) h['Content-Type'] = 'application/json';
  if (auth) {
    await ensureFreshToken();
    if (!session) throw new ApiError('Oturum açık değil.', { status: 401, code: 'no_session' });
    h.Authorization = `Bearer ${session.access_token}`;
  } else if (key.startsWith('eyJ')) {
    // Eski tip "anon" anahtarı (JWT) Authorization'da da gönderilir.
    // Yeni "sb_publishable_…" anahtarları JWT değildir; sadece apikey başlığında gider.
    h.Authorization = `Bearer ${key}`;
  }
  let res;
  try {
    res = await fetch(url + path, { method, headers: h, body: body === undefined ? undefined : body instanceof Blob ? body : JSON.stringify(body) });
  } catch {
    throw new ApiError('Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.', { code: 'network' });
  }
  if (res.status === 401 && auth && session && retry) {
    // Erişim anahtarı geçersizse bir kez yenileyip tekrar dene
    await refreshSession(true);
    return request(path, { method, body, headers, auth, raw, retry: false });
  }
  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch { /* gövde yok */ }
    throw new ApiError(friendlyError(res.status, data), { status: res.status, code: String(data?.error_code || data?.code || '') });
  }
  if (raw) return res;
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ---------- Kimlik ----------
export async function signUp(email, password, name = '') {
  const data = await request('/auth/v1/signup', { method: 'POST', body: { email, password, data: { name } } });
  if (data && data.access_token) {
    saveSession(toSession(data));
    return { signedIn: true };
  }
  // E-posta doğrulaması açıksa oturum gelmez
  return { signedIn: false, needsConfirm: true };
}

export async function signIn(email, password) {
  const data = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
  saveSession(toSession(data));
  return session.user;
}

async function refreshSession(force = false) {
  if (!session) return;
  if (!force && session.expires_at - Date.now() > 60 * 1000) return;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const data = await request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } });
        saveSession(toSession(data));
      } catch (err) {
        // Yenileme anahtarı geçersizse oturum kapanır; ağ hatasında oturum korunur
        if (err.code !== 'network') saveSession(null);
        throw err;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

const ensureFreshToken = () => refreshSession(false);

export async function signOut() {
  const s = session;
  saveSession(null);
  if (!s) return;
  try {
    const { url, key } = getServerConfig();
    await fetch(`${url}/auth/v1/logout`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${s.access_token}` } });
  } catch { /* çevrimdışı olabilir; yerel oturum zaten kapandı */ }
}

export function resetPassword(email, redirectTo) {
  return request(`/auth/v1/recover${redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ''}`, { method: 'POST', body: { email } });
}

export async function updatePassword(password) {
  await request('/auth/v1/user', { method: 'PUT', body: { password }, auth: true });
}

export async function updateProfile(name) {
  const data = await request('/auth/v1/user', { method: 'PUT', body: { data: { name } }, auth: true });
  if (data && session) saveSession({ ...session, user: { ...session.user, name: data.user_metadata?.name || name } });
}

// E-posta doğrulama ya da şifre sıfırlama bağlantısından dönüşte adresteki anahtarları alır.
// Döner: 'recovery' | 'signup' | 'magiclink' | null
export function consumeUrlTokens(loc = window.location) {
  const hash = loc.hash || '';
  if (!hash.includes('access_token=') && !hash.includes('error_description=')) return null;
  const params = new URLSearchParams(hash.replace(/^#\/?/, ''));
  if (params.get('error_description')) {
    return { error: params.get('error_description').replace(/\+/g, ' ') };
  }
  const data = {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    expires_in: params.get('expires_in'),
    expires_at: params.get('expires_at'),
  };
  const type = params.get('type') || 'signup';
  // Kullanıcı bilgisi JWT içinde
  try {
    const payload = JSON.parse(atob(data.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    data.user = { id: payload.sub, email: payload.email, user_metadata: payload.user_metadata || {} };
  } catch { /* yok say */ }
  saveSession(toSession(data));
  return { type };
}

// ---------- Veri (items tablosu) ----------
export function fetchItems({ since = null, limit = 1000, offset = 0 } = {}) {
  const q = new URLSearchParams({ select: 'collection,id,data,deleted,updated_at', order: 'updated_at.asc,collection.asc,id.asc', limit: String(limit), offset: String(offset) });
  if (since) q.set('updated_at', `gt.${since}`);
  return request(`/rest/v1/items?${q}`, { auth: true });
}

export function countItems() {
  return request('/rest/v1/items?select=id&deleted=is.false&limit=1', { auth: true });
}

export function upsertItems(rows) {
  const userId = session?.user?.id;
  return request('/rest/v1/items?on_conflict=user_id,collection,id', {
    method: 'POST',
    auth: true,
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: rows.map((r) => ({ user_id: userId, collection: r.collection, id: r.id, data: r.data ?? null, deleted: !r.data })),
  });
}

// ---------- Dosyalar (Storage) ----------
const filePath = (id) => `${session.user.id}/${id}`;

export function uploadFile(id, blob) {
  return request(`/storage/v1/object/attachments/${filePath(id)}`, {
    method: 'POST', auth: true, body: blob, headers: { 'Content-Type': blob.type || 'application/octet-stream', 'x-upsert': 'true' },
  });
}

export async function downloadFile(id) {
  const res = await request(`/storage/v1/object/authenticated/attachments/${filePath(id)}`, { auth: true, raw: true });
  return res.blob();
}

export function removeFiles(ids) {
  if (!ids.length) return Promise.resolve();
  return request('/storage/v1/object/attachments', { method: 'DELETE', auth: true, body: { prefixes: ids.map((id) => `${session.user.id}/${id}`) } });
}
