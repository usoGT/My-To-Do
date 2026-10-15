// sw.js'deki ASSETS listesini (çevrimdışı önbelleğe alınacak dosyalar) yeniden üretir.
// Yeni bir JS/CSS/ikon dosyası ekleyince çalıştır:  node tools/update-sw.mjs
import { fileURLToPath } from 'node:url';
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url)); // Windows'ta da doğru yol
const walk = (dir) => readdirSync(join(root, dir)).flatMap((f) => {
  const p = `${dir}/${f}`;
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
});
const files = ['css', 'js', 'assets'].flatMap(walk).filter((f) => !f.endsWith('.gitkeep')).sort();
const list = ['./', './index.html', './manifest.webmanifest', ...files.map((f) => `./${f}`)].map((f) => `  '${f}',`).join('\n');
const swPath = join(root, 'sw.js');
const sw = readFileSync(swPath, 'utf8').replace(/const ASSETS = \[\n[\s\S]*?\n\];/, `const ASSETS = [\n${list}\n];`);
writeFileSync(swPath, sw);
console.log(`sw.js güncellendi: ${files.length + 3} dosya.`);
