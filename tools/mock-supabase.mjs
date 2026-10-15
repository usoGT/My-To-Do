// Yerel deneme için sahte Supabase sunucusu (bağımlılık yok, sadece Node).
// Uygulamanın kullandığı uç noktaların küçük bir kopyası: kimlik, items tablosu, dosya deposu.
//
// Çalıştırma:   node tools/mock-supabase.mjs          (varsayılan port 54321)
// Uygulamada:   tarayıcı konsoluna →
//   localStorage.setItem('planlayici-supabase', JSON.stringify({ url: 'http://localhost:54321', key: 'yerel-anahtar' })); location.reload();
// Geri almak:   localStorage.removeItem('planlayici-supabase'); location.reload();
//
// Veriler bellekte tutulur; sunucu kapanınca silinir. Gerçek kullanım için docs/HESAP-KURULUM.md.
import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT || 54321);
const TOKEN_TTL = Number(process.env.TOKEN_TTL || 3600); // saniye (yenileme testi için kısaltılabilir)

const users = new Map(); // email → { id, email, password, name }
const access = new Map(); // access_token → { userId, exp }
const refresh = new Map(); // refresh_token → userId
const items = new Map(); // `${userId}|${collection}|${id}` → row
const files = new Map(); // path → { type, data: Buffer }
let clock = 0;

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

function issue(user) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL;
  const token = `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ sub: user.id, email: user.email, exp, user_metadata: { name: user.name } })}.${randomUUID()}`;
  const rt = randomUUID();
  access.set(token, { userId: user.id, exp: exp * 1000 });
  refresh.set(rt, user.id);
  return { access_token: token, refresh_token: rt, token_type: 'bearer', expires_in: TOKEN_TTL, expires_at: exp, user: publicUser(user) };
}

const publicUser = (u) => ({ id: u.id, email: u.email, user_metadata: { name: u.name } });
const findUserById = (id) => [...users.values()].find((u) => u.id === id);

// Sunucu saatiyle artan, benzersiz zaman damgası
function now() {
  const t = Math.max(Date.now(), clock + 1);
  clock = t;
  return new Date(t).toISOString();
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    ...(body !== undefined && !Buffer.isBuffer(body) ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  });
  res.end(body === undefined ? undefined : Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

function authUser(req) {
  const h = req.headers.authorization || '';
  const t = h.replace(/^Bearer\s+/i, '');
  const a = access.get(t);
  if (!a || a.exp < Date.now()) return null;
  return findUserById(a.userId) || null;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const raw = await readBody(req);
  const json = () => { try { return JSON.parse(raw.toString() || 'null'); } catch { return null; } };
  if (!req.headers.apikey && path !== '/__dump') return send(res, 401, { message: 'No API key found in request' });

  // ---------- Kimlik ----------
  if (path === '/auth/v1/signup' && req.method === 'POST') {
    const { email, password, data } = json() || {};
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(res, 400, { code: 400, error_code: 'validation_failed', msg: 'Unable to validate email address: invalid format' });
    if (!password || password.length < 6) return send(res, 422, { code: 422, error_code: 'weak_password', msg: 'Password should be at least 6 characters.' });
    if (users.has(email.toLowerCase())) return send(res, 422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' });
    const user = { id: randomUUID(), email: email.toLowerCase(), password, name: data?.name || '' };
    users.set(user.email, user);
    return send(res, 200, issue(user));
  }
  if (path === '/auth/v1/token' && req.method === 'POST') {
    const grant = url.searchParams.get('grant_type');
    const body = json() || {};
    if (grant === 'password') {
      const u = users.get(String(body.email || '').toLowerCase());
      if (!u || u.password !== body.password) return send(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
      return send(res, 200, issue(u));
    }
    if (grant === 'refresh_token') {
      const uid = refresh.get(body.refresh_token);
      if (!uid) return send(res, 400, { code: 400, error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token: Refresh Token Not Found' });
      refresh.delete(body.refresh_token);
      return send(res, 200, issue(findUserById(uid)));
    }
    return send(res, 400, { msg: 'unsupported grant_type' });
  }
  if (path === '/auth/v1/logout') return send(res, 204);
  if (path === '/auth/v1/recover') return send(res, 200, {});
  if (path === '/auth/v1/user') {
    const u = authUser(req);
    if (!u) return send(res, 401, { code: 401, msg: 'invalid JWT' });
    if (req.method === 'PUT') {
      const body = json() || {};
      if (body.password) {
        if (body.password.length < 6) return send(res, 422, { error_code: 'weak_password', msg: 'Password should be at least 6 characters.' });
        u.password = body.password;
      }
      if (body.data && 'name' in body.data) u.name = body.data.name;
    }
    return send(res, 200, publicUser(u));
  }

  // ---------- items tablosu (satır güvenliği: sadece kendi satırları) ----------
  if (path === '/rest/v1/items') {
    const u = authUser(req);
    if (!u) return send(res, 401, { code: 'PGRST301', message: 'JWT expired' });
    if (req.method === 'GET') {
      let rows = [...items.values()].filter((r) => r.user_id === u.id);
      const gt = url.searchParams.get('updated_at');
      if (gt && gt.startsWith('gt.')) rows = rows.filter((r) => r.updated_at > new Date(gt.slice(3)).toISOString());
      if (url.searchParams.get('deleted') === 'is.false') rows = rows.filter((r) => !r.deleted);
      rows.sort((a, b) => (a.updated_at < b.updated_at ? -1 : a.updated_at > b.updated_at ? 1 : 0));
      const offset = Number(url.searchParams.get('offset') || 0);
      const limit = Number(url.searchParams.get('limit') || 1000);
      return send(res, 200, rows.slice(offset, offset + limit).map(({ collection, id, data, deleted, updated_at }) => ({ collection, id, data, deleted, updated_at })));
    }
    if (req.method === 'POST') {
      const body = json();
      const list = Array.isArray(body) ? body : [body];
      for (const r of list) {
        if (r.user_id && r.user_id !== u.id) return send(res, 403, { code: '42501', message: 'new row violates row-level security policy' });
        if (!r.collection || !r.id) return send(res, 400, { message: 'collection ve id gerekli' });
      }
      for (const r of list) {
        items.set(`${u.id}|${r.collection}|${r.id}`, { user_id: u.id, collection: r.collection, id: String(r.id), data: r.data ?? null, deleted: Boolean(r.deleted), updated_at: now() });
      }
      return send(res, 201);
    }
  }

  // ---------- Dosya deposu ----------
  if (path.startsWith('/storage/v1/object/')) {
    const u = authUser(req);
    if (!u) return send(res, 401, { message: 'Unauthorized' });
    if (req.method === 'DELETE' && path === '/storage/v1/object/attachments') {
      for (const p of (json() || {}).prefixes || []) if (p.startsWith(`${u.id}/`)) files.delete(p);
      return send(res, 200, []);
    }
    const m = path.match(/^\/storage\/v1\/object\/(?:authenticated\/)?attachments\/(.+)$/);
    if (!m) return send(res, 404, { message: 'Not found' });
    const key = decodeURIComponent(m[1]);
    if (!key.startsWith(`${u.id}/`)) return send(res, 403, { message: 'new row violates row-level security policy' });
    if (req.method === 'POST' || req.method === 'PUT') {
      files.set(key, { type: req.headers['content-type'] || 'application/octet-stream', data: raw });
      return send(res, 200, { Key: `attachments/${key}` });
    }
    if (req.method === 'GET') {
      const f = files.get(key);
      if (!f) return send(res, 404, { message: 'Object not found' });
      return send(res, 200, f.data, { 'Content-Type': f.type });
    }
  }

  if (path === '/__dump') {
    return send(res, 200, { users: [...users.values()].map(publicUser), items: [...items.values()], files: [...files.keys()] });
  }
  return send(res, 404, { message: `Bilinmeyen uç nokta: ${req.method} ${path}` });
});

server.listen(PORT, () => console.log(`Sahte Supabase http://localhost:${PORT} adresinde çalışıyor.`));
