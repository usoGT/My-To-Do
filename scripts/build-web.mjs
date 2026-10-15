// Uygulama dosyalarını (HTML/CSS/JS) www/ klasörüne kopyalar.
// iPhone/Android (Capacitor) ve Mac/Windows (Electron) uygulamaları bu klasörü paketler.
// Uygulama kodu derlenmez, olduğu gibi kopyalanır.
import { fileURLToPath } from 'node:url';
import { rmSync, mkdirSync, cpSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url)); // Windows'ta da doğru yol
const out = join(root, 'www');
const ENTRIES = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const e of ENTRIES) {
  const src = join(root, e);
  if (!existsSync(src)) throw new Error(`Bulunamadı: ${e}`);
  cpSync(src, join(out, e), { recursive: true, filter: (p) => !p.endsWith('.gitkeep') });
}

// Yerel geliştirme ayarı (sahte sunucu) yanlışlıkla pakete girmesin diye uyarı
const cfg = readFileSync(join(root, 'js/config.js'), 'utf8');
if (/SUPABASE_URL = ''/.test(cfg)) {
  console.warn('Uyarı: js/config.js içinde Supabase adresi boş; uygulamalarda hesap özellikleri kapalı olur.');
}
console.log('www/ hazır.');
