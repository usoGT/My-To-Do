// app://planlayici/... adreslerini www/ klasöründeki dosyalara çevirir (saf fonksiyonlar, test edilir).
const path = require('node:path');
const fs = require('node:fs');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function mimeFor(file) {
  return MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

// URL → dosya yolu. Kök dışına çıkmaya çalışan (../) ya da olmayan dosyalarda null.
function resolveAppPath(root, urlString) {
  let url;
  try { url = new URL(urlString); } catch { return null; }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return null; }
  if (pathname === '/' || pathname === '') pathname = '/index.html';
  const full = path.normalize(path.join(root, pathname));
  const rootNorm = path.normalize(root + path.sep);
  if (!full.startsWith(rootNorm)) return null;
  try {
    if (!fs.statSync(full).isFile()) return null;
  } catch {
    return null;
  }
  return full;
}

module.exports = { resolveAppPath, mimeFor };
