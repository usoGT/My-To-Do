# My to do

Öğrencilerin günlük, aylık ve yıllık görevlerini, rutinlerini, ders programını ve ders notlarını tek uygulamada toplayan planlama aracı. **Sadece HTML, CSS ve saf JavaScript** ile yazıldı: kütüphane, framework, derleme adımı yok. Veriler tarayıcıda saklanır, hiçbir sunucuya gönderilmez.

## Çalıştırma

`index.html` dosyasına çift tıklayarak açma: JavaScript modülleri `file://` ile çalışmaz. Şunlardan biriyle aç:

- **VS Code / Antigravity:** *Live Server* eklentisini kur → `index.html`'e sağ tık → *Open with Live Server*
- **Terminal:** `npx serve .` ya da `python -m http.server 5500` → tarayıcıda `http://localhost:5500`

İlk açılışta denemek için **Ayarlar → Örnek veri yükle**.

## Özellikler

| Sayfa | Ne yapıyor |
|---|---|
| Bugün | Günün görevleri, geciken görevler, rutinler, dersler ve aradaki boş zamanlar ("Günün akışı") |
| Planlayıcı (sayfa) | Gün, ay (takvim, sürükle-bırak) ve yıl (ısı haritası) görünümleri; aylık ve yıllık hedefler |
| Hızlı Notlar | N tuşuyla her yerden not; notu göreve, hedefe ya da ders notuna çevirme |
| Rutinler | Günlere göre tekrar eden alışkanlıklar, seri, 30 günlük oran, 4 haftalık mini takvim |
| Ders Programı | Haftalık ızgara, her günün boş zaman hesabı, ders yönetimi |
| Ders sayfası | Bir dersin görevleri, notları, saatleri, hedefleri ve odak süresi |
| Ders Notları | Derse bağlı notlar (otomatik kayıt) ve PDF/resim ekleri |
| Pomodoro | Göreve bağlı odak seansları, haftalık grafik, bildirim ve ses |
| Ayarlar | Ad, tema, gün saatleri, Pomodoro süreleri, yedek alma/yükleme |
| Raporlarım | Günlük / haftalık / aylık rapor: odak, tamamlanan görev, rutin oranı, aktif gün (önceki döneme göre değişimle), grafikler, derslere göre dağılım, CSV indir, yazdır/PDF |
| Sınav takvimi | Vize/final/quiz tarihleri, Bugün'de geri sayım, boş zamanlara göre çalışma planı önerisi |

Görevlere teslim tarihi ve hatırlatıcı eklenebilir (hatırlatıcı uygulama açıkken çalışır).

## Hesap ve uygulamalar

- **Hesap ve cihazlar arası eşitleme** (Supabase): kurulum `docs/HESAP-KURULUM.md`. Hesap olmadan da çalışır.
- **iPhone, Android, Mac, Windows uygulamaları**: aynı kod; nasıl derleneceği `docs/UYGULAMALAR.md`. GitHub'a yüklenince APK, .dmg ve .exe otomatik derlenir (Actions → Uygulamaları derle).

## Klavye kısayolları

| Kısayol | Ne yapar |
|---|---|
| `Ctrl` + `K` (Mac: `⌘` + `K`) | Komut paleti: ara, sayfaya git, görev ekle |
| `N` | Hızlı not al |
| `Esc` | Açık pencereyi kapat |

Görev eklerken tek satırda yazabilirsin: `Fizik ödevi yarın 14:00 #fiz !yüksek`
(`bugün`, `yarın`, `öbür gün`, gün adları, `20.10`, `14:00`, `#ders adı/kodu`, `!yüksek` `!orta` `!düşük`). Komut paletinde başına `+` koy.

## Telefona kurma (ana ekrana ekle)

Service worker ve "ana ekrana ekle" sadece `https` ya da `localhost` üzerinde çalışır. En kolayı GitHub Pages: depo → Settings → Pages → `main` dalı. Sonra telefonda adresi aç → tarayıcı menüsü → *Ana ekrana ekle*. İnternet yokken de açılır.

## Yedekleme

Veriler sadece o tarayıcıda durur. **Ayarlar → Yedek al** ile JSON dosyası indir, başka bilgisayarda **Yedek yükle** ile aç. Ders notu ekleri (PDF, resim) de yedeğe dahil edilir (Ayarlar'dan kapatılabilir).

## Geliştirme

- Plan ve kurallar: `PLAN.md` · Yapılanlar: `ILERLEME.md`
- Testler: uygulama açıkken `/tests/tests.html` → hepsi yeşil olmalı.
- Klasörler: `js/store` (veri: tek kaynak, değişiklik sadece `update()` ile), `js/lib` (saf yardımcılar), `js/components` (arayüz parçaları), `js/pages` (sayfalar), `css/` (tasarım değişkenleri `tokens.css`'te).
- Yeni bir JS/CSS dosyası eklersen `node tools/update-sw.mjs` çalıştır; sürüm çıkarırken `docs/UYGULAMALAR.md`'deki kontrol listesini izle.
- Paketleme klasörleri: `ios/`, `android/` (Capacitor), `electron/` (Electron), `scripts/`, `tools/` (sahte Supabase, sw listesi). `npm install` sadece paketleme içindir.
