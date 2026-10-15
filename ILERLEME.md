# İlerleme

## Faz 0 — Hazırlık
- Klasör yapısı (PLAN.md bölüm 3), README, .gitignore, .editorconfig oluşturuldu.
- Git deposu başlatıldı.

## Faz 1 — İskelet ve tasarım sistemi
- `tokens.css` (açık/koyu tema, 8 ders rengi, ısı haritası tonları), `base.css`, `layout.css`, `components.css`.
- Hash router (`router.js`), kenar çubuğu, üst çubuk, mobil alt menü + çekmece.
- Tema geçici olarak `localStorage['planlayici-theme']`'de (Faz 3'te store'a taşınacak).
- 9 sayfa yer tutucu, `not-found.js`.
- Kontrol: 1280 px ve 375 px ekran görüntüsü, tema değişimi, çekmece, aktif menü, konsol temiz.
- Not: Bileşen vitrini yerine bileşenler sonraki fazların gerçek sayfalarında doğrulanıyor.

## Faz 2 — Veri katmanı, yardımcılar ve testler
- `store.js` (initStore, getState, update, subscribe, replaceState, onPersistError, bellek içi storage), `schema.js` (tam veri modeli, migrate).
- `dates.js`, `text.js`, `ids.js`; `tests/` altında mini test aracı ve 30 test (hepsi geçiyor).
- Not: Test sayfasında görülen "Kayıtlı veri okunamadı" konsol hatası, bozuk JSON testinin beklenen çıktısıdır.

## Faz 3 — Ortak bileşenler ve Ayarlar
- `modal.js` (<dialog>, Esc/arka plan ile kapanma, odak geri dönüşü, telefonda alttan panel), `toast.js` (geri al eylemi), `confirm.js` (yazarak onay), `empty-state.js`.
- `actions/settings.js` (doğrulamalı), `backup.js` (yedek biçimi, doğrulama, base64), `backup-files.js` (Faz 9'da dolacak).
- Ayarlar sayfası: profil, tema, gün saatleri, hafta sonu, Pomodoro, bildirim izni, yedek al/yükle, tüm verileri sil.
- Tema artık `settings.theme`'de; `<head>` betiği `planlayici-data`'dan okuyor; eski `planlayici-theme` anahtarı bir kez taşınıp siliniyor.
- Değişen önceki dosyalar: `app.js`, `theme.js`, `index.html`, `components.css`.
- Testler: 40/40.

## Faz 4 — Dersler ve Ders Programı
- `actions/courses.js` (ekle/güncelle/sil, ilişki temizliği, etki sayıları), `actions/schedule.js` (çakışma kontrolü), `lib/time-slots.js`, `selectors.js`.
- `components/form.js` (form gönderimi + alan hataları), `course-form.js`, `schedule-form.js`, `lib/errors.js` (ValidationError).
- Ders Programı sayfası: ders kartları, haftalık ızgara (boş alana tıklayınca saat dolu form, şu anki saat çizgisi), günlük boş zaman çubukları, telefonda gün sekmeleri.
- Kenar çubuğunda "Derslerim" (alfabetik).
- `lib/attachments.js` yer tutucu (Faz 9'da IndexedDB'ye bağlanacak).
- Testler: 55/55.

## Faz 5 — Görevler
- `actions/tasks.js` (ekle, güncelle, tamamla, sil + geri al, taşı, sırala), görev seçicileri (`sortTasks`, `getTasksForDate`, `getOverdueTasks`, `getUndatedTasks`).
- `task-item.js` (görev satırı + tüm sayfalarda ortak `bindTaskActions`), `task-form.js` (tarih/saat/tarihsiz, tahmini süre çipleri, ders, öncelik; hedef seçimi Faz 8 için hazır).
- Bugün sayfası (ilk hali): selamlama, hızlı ekleme, gecikenler (+ tümünü taşı), ilerleme çubuğu, "Bir ara".
- Testler: 63/63. Tarayıcıda: HTML kaçışı, silme + geri alma, geciken görev doğrulandı.

## Faz 6 — Rutinler
- `actions/routines.js` (ekle, güncelle, arşivle, sil, gün işaretle; geçmişe işaretlenince başlangıç tarihi geri çekilir, gelecek gün işaretlenemez).
- Seçiciler: `getRoutinesForDate`, `getRoutineStreak` (plandaki kural), `getRoutineBestStreak`, `getRoutineCompletionRate`.
- `routine-form.js` (gün seçici + Her gün/Hafta içi/Hafta sonu), `routine-check.js` (Bugün'de de kullanılacak).
- Rutinler sayfası: bugünün rutinleri, kartlar (seri, en iyi seri, 30 gün oranı, 4 haftalık mini takvim), arşiv.
- Not: Rutine `startDate` alanı eklendi (createdAt'tan türetilir; eski kayıtlar için createdAt kullanılır).
- Testler: 73/73 (plandaki 4 seri örneği dahil).

## Faz 7 — Bugün sayfası (tam) ve örnek veri
- `getDayAgenda` seçicisi: dersler, görevler, gecikenler, rutinler, boş zaman (saatli görev = tahmini süre ya da 30 dk, saatli rutin = süresi), zaman çizelgesi, istatistikler, kalan boş zaman.
- Bugün: istatistik kartları, iki sütun (görevler | rutinler + günün akışı), boş zaman bloğuna tıklayınca saat dolu görev formu, "Şimdi" çizgisi, dakikada bir yenileme.
- `components/quick-add.js` (Faz 12'de ayrıştırıcıyla genişleyecek).
- `lib/sample-data.js` + Ayarlar'da "Örnek veri yükle" (sadece veri boşken). Örnek veri sonraki fazların verilerini de içeriyor (hedefler, notlar, hızlı notlar, Pomodoro seansları).
- Plandan erken: Bugün'de yedek hatırlatması (Faz 13'teki madde).
- Testler: 80/80.

## Faz 8 — Planlayıcı ve hedefler
- `actions/goals.js`; seçiciler: `getGoalsFor`, `getGoalProgress`, `buildActivityIndex`, `dayScore`, `scoreToLevel`, `heatmapCell`, `getYearSummary`.
- `components/goals.js` (hedef paneli, form, ortak eylemler), `components/heatmap.js` (SVG), `components/day-agenda.js` (Bugün'den ayrıştırıldı, gün görünümünde yeniden kullanılıyor).
- Planlayıcı: Gün/Ay/Yıl, ileri-geri, Bugün, adres güncelleniyor (geri tuşu çalışıyor), ay görünümünde sürükle-bırak, seçili günün listesi, aylık hedefler; yıl görünümünde ısı haritası, yıl özeti, yıllık hedefler, aylık hedef oranları.
- Görev formundaki hedef seçimi aktif (görev tarihine göre o ayın ve yılın hedefleri).
- Değişen önceki dosyalar: `today.js` (ortak bileşene geçti).
- Testler: 87/87.

## Faz 9 — Ders Notları ve dosya ekleri
- `lib/files-db.js` (IndexedDB: put/get/delete/list/clear), `actions/course-notes.js` (+ `validateAttachment`: PDF/resim, 10 MB, not başı 10 ek), `lib/attachments.js`, `lib/backup-files.js` (ekler yedekte base64).
- Ders Notları sayfası: ders filtresi (dar ekranda açılır menü), arama (Türkçe karakterden bağımsız), editör (500 ms gecikmeli otomatik kayıt, editör yeniden çizilmiyor), ekler (küçük resim, yeni sekmede açma, silme, sürükle-bırak), telefonda liste ↔ tam ekran editör.
- Ayarlar: "Ekleri yedeğe dahil et" anahtarı.
- Tarayıcıda doğrulandı: not yaz → yenile → kalıcı; PNG+PDF ekleme; 11 MB dosya reddi; yedek al → sil → yükle sonrası notlar ve ekler geri geldi.
- Testler: 91/91.

## Faz 10 — Ders sayfası
- Seçiciler: `getCourseSessions` (çift sayımsız), `sessionsByDay`, `getNextClass`, `getCourseOverview`.
- `components/bar-chart.js` (Faz 11'de de kullanılacak).
- Ders sayfası: renkli başlık bandı + sıradaki ders, 4 istatistik, görevler (gecikenler + açıklar, tamamlananları göster), notlar (son 5), haftalık saatler (tıklayınca düzenle), son 7 gün odak grafiği, derse bağlı hedefler; düzenle/sil; "Pomodoro" bağlantısı. Silinmiş ders adresinde açıklama.
- Testler: 94/94.

## Faz 11 — Pomodoro
- `lib/timer.js`: sayfadan bağımsız zamanlayıcı (endsAt − Date.now(), 250 ms tik, `planlayici-timer` ile yenilemede devam, kapalıyken süre dolduysa açılışta tamamlanır), saf yardımcılar `nextMode`, `remainingFrom`, `formatClock`, `durationFor`; erken bitir (≥ 5 dk kaydeder), atla, sıfırla, mod, hedef.
- `lib/alerts.js`: Web Audio ile iki tonlu bip, tarayıcı bildirimi.
- `actions/pomodoro.js`, seçiciler `getWeeklyFocus`, `getDayFocus`, `getFocusByCourse`.
- Pomodoro sayfası: SVG halka, mod sekmeleri, görev/ders seçimi (adresten `gorev`/`ders`), görevi tamamla, döngü noktaları, bugün/bu hafta, haftalık çubuk grafik (hafta geçişi), ders dağılımı, son seanslar (silme).
- Üst çubukta mini sayaç, sekme başlığında kalan süre, görev satırında "Pomodoro başlat".
- Tarayıcıda doğrulandı: 1 dk'lık odak → sayfa değişimi ve yenilemede devam → seans göreve bağlı kaydedildi → kısa molaya geçti → bildirim/toast.
- Testler: 99/99.

## Faz 12 — Hızlı Notlar ve Komut paleti
- `lib/task-parser.js` (`parseTaskInput`, `describeParsed`): bugün/yarın/öbür gün, gün adları ve kısaltmaları (bugün dahil), `15.10`, `15/10`, `15.10.2026` (geçmişse gelecek yıl), `14:00`, `#ders` (ad ya da kod başı), `!yüksek/!orta/!düşük`, `!1-3`, `!!`.
- `actions/quick-notes.js`, `components/quick-note.js` (N penceresi), Hızlı Notlar sayfası (yazma kutusu, göreve/hedefe/ders notuna çevirme, düzenle, sil + geri al, dönüştürülenleri göster).
- `components/command-palette.js` (Ctrl/⌘+K): son sayfalar, komutlar, dersler, görevler, notlar; ↑↓ Enter; `+` ile canlı önizlemeli görev ekleme.
- `lib/shortcuts.js` (yazarken çalışmaz), `lib/backup-run.js` (Ayarlar ve palet ortak). Ayarlar'a "Klavye kısayolları" kartı.
- Bugün sayfasındaki hızlı ekleme artık ayrıştırıcıyı kullanıyor ve önizleme gösteriyor.
- Testler: 116/116 (plandaki parser tablosunun tamamı dahil).

## Faz 13 — Cila ve yayına hazırlık
- Gözden geçirme (otomatik tarama: 12 sayfa × 360/768/1280 px × açık/koyu tema):
  - [x] Yatay taşma yok
  - [x] Konsolda hata yok
  - [x] Tüm ikon butonlarında ve form alanlarında erişilebilir ad var
  - [x] Boş durumlar her sayfada yönlendirici
  - [x] 1130 görevle (bugün 280 görev) işaretleme + yeniden çizim ~50 ms, sayfa açılışları < 120 ms
  - [x] Uzun başlık / uzun ders adı düzeni bozmuyor
  - [x] Kontrast: açık temada soluk metin, başarı ve ders renkleri koyulaştırıldı (rozet metinleri ≥ 4.5:1)
- PWA: `manifest.webmanifest`, ikonlar (`assets/icons/`), `sw.js` (önce ağ, yoksa önbellek; geliştirirken eski kod görünmez), yeni sürüm toast'ı. Çevrimdışı açılış doğrulandı.
- Ayarlar'a "Hakkında" (sürüm, veri + ek boyutu, son yedek, içerik sayıları). `js/version.js`.
- Yer tutucu sayfa (`placeholder.js`) silindi, README güncellendi.
- Not: Plandan farklı olarak service worker "önce önbellek" yerine "önce ağ" stratejisiyle yazıldı; Live Server ile geliştirirken eski dosyaların görünmesini engellemek için.
- Testler: 116/116.

## Faz 14 — Son tarih ve hatırlatıcı (opsiyonel)
- Şema sürümü 2: görevlere `dueDate`, `reminderAt` (yerel `YYYY-MM-DDTHH:MM`), `reminderSent`. `migrations[1]` eski verileri tamamlıyor (tarayıcıda v1 verisiyle doğrulandı).
- Görev formunda "Teslim tarihi" ve "Hatırlatıcı"; görev satırında teslim rozeti (yaklaşınca sarı, geçince kırmızı) ve zil.
- Bugün: "Yaklaşan teslimler" (geçmiş + 3 gün; zaten listede olanlar tekrar edilmez).
- Hatırlatıcı: uygulama açıkken 30 sn'de bir kontrol; sekme arka plandaysa bildirim, değilse toast + ses; bir kez çalar, zaman değişirse yeniden kurulur. Sekme kapalıyken çalışmaz.
- Testler: 121/121.

## Faz 15 — Sınav takvimi (opsiyonel)
- Şema sürümü 3: `exams` koleksiyonu (`migrations[2]`). Ders silinince sınavları da silinir (onayda sayısı gösterilir).
- `actions/exams.js` (vize, final, quiz, bütünleme, proje teslimi), seçiciler `getUpcomingExams`, `getPastExams`, `getExamsForDate`, `getExamsByCourse`, `examTitle`, `suggestStudyPlan`.
- `components/exams.js`: sınav satırı (geri sayım), form, **çalışma planı önerisi** (sınava kadar, ders programı + saatli görevlere göre boş zamanlardan; sınava yakın günler öncelikli; seans sayısı/süresi seçilebilir; kullanıcı onaylamadan görev eklenmez).
- Ders Programı'nda "Sınav takvimi", Ders sayfasında "Sınavlar", Bugün'de 14 gün içindeki sınavlar için geri sayım kartları, Planlayıcı ay hücrelerinde sınav işareti ve gün görünümünde sınav listesi, komut paletinde "Sınav ekle". Örnek veriye 3 sınav eklendi.
- `sw.js` dosya listesi ve sürüm 1.1.0'a güncellendi.
- Faz 16 (senkronizasyon hazırlığı) plana göre servis kararı (Supabase/Firebase) verildikten sonra yapılacak; bu yüzden uygulanmadı.
- Tam tarama (12 sayfa × 3 genişlik × 2 tema) temiz; testler: 126/126.

## Ek — Raporlarım
- Yeni sayfa `#/raporlar?donem=gun|hafta|ay&tarih=…` (kenar çubuğunda ve komut paletinde "Raporlarım").
- `store/report.js` (saf): dönem aralığı ve kaydırma, özet sayılar (odak, seans, tamamlanan görev, plan tamamlama %, geciken, rutin %, aktif gün), önceki döneme göre değişim, saatlik/günlük seri, derslere göre dağılım, rutin oranları, öne çıkanlar, CSV (Excel için `;` ve UTF-8 BOM).
- `components/report-charts.js`: HTML sütun grafik (ipucu, klavyeyle de gezilebilir, gelecek günler taralı), yatay çubuk listesi, durum çubuğu. Odak ve görev sayısı ayrı grafiklerde (tek eksen kuralı).
- Verileri tablo olarak gösterme, CSV indir, Yazdır / PDF (yazdırırken menüler gizlenir, tablo açılır).
- Ayarlar'da ad alanının örneği "Örn. Üsame" oldu.
- Sürüm 1.2.0 (`sw.js` listesi güncellendi). Testler: 135/135; tarama (15 sayfa × 3 genişlik × 2 tema) temiz.

## Ek 1 — Hesap sistemi (Supabase + tüm cihazlarda senkron)
- `js/config.js`: Supabase adresi ve anon anahtarı (boşsa hesap özellikleri gizli, uygulama yerelde çalışır).
- `js/lib/supabase.js`: SDK'sız REST istemcisi — kayıt, giriş, oturum yenileme, çıkış, şifre sıfırlama, şifre/ad değiştirme, e-posta bağlantısından dönüş; `items` tablosu ve `attachments` dosya deposu; Türkçe hata mesajları.
- `js/lib/sync-core.js` (saf, test edildi): kayıt bazlı fark çıkarma, uzak kayıtları uygulama (bekleyen yerel değişiklik korunur), cihaza özel ayarlar hariç.
- `js/lib/sync.js`: giden kutusu + 1,5 sn sonra gönderim, 30 sn'de bir / odakta / internet gelince çekme, ekleri yükleme-indirme, ilk girişte birleştir/değiştir, çıkışta yereli temizleme.
- `store.subscribeChanges` (önceki/yeni state). Hesabım sayfası (`#/hesap`), kenar çubuğunda hesap satırı, üst çubukta eşitleme göstergesi, Ayarlar'da hesap kartı; "Tüm verileri sil" hesaptaysa bulut uyarısı veriyor.
- `supabase/schema.sql` (tablo, RLS, tetikleyici, dosya deposu kuralları), `docs/HESAP-KURULUM.md`.
- `tools/mock-supabase.mjs`: yerel sahte Supabase. `tools/update-sw.mjs`: sw.js dosya listesini yeniler.
- Test: 143 birim testi + sahte sunucuyla 3 cihazlı uçtan uca test (23/23): kayıt, yanlış şifre, tüm verinin gelmesi, ekin indirilmesi, görev ekleme/silme/rutin yayılımı, çevrimdışı düzenleme ve çakışma, anahtar yenileme, çıkış-giriş, birleştirme sorusu.
- Not: Gerçek Supabase'e bu ortamdan erişilemediği için testler sahte sunucuyla yapıldı.

## Ek 2 — iPhone uygulaması (Capacitor)
- `package.json` (paketleme araçları; uygulama kodu hâlâ saf HTML/CSS/JS), `scripts/build-web.mjs` (www/ klasörü), `capacitor.config.json` (com.planlayici.app), `ios/` Xcode projesi (Swift Package Manager; eklentiler: yerel bildirim, dosya, paylaşım, durum çubuğu).
- `js/lib/platform.js` (tarayıcı / iOS / Android / Electron algılama), `js/lib/native.js` (yerel bildirim, zamanlı bildirim, dosya paylaşma, durum çubuğu), `js/lib/save-file.js`.
- Telefonda: Pomodoro bitişi ve görev hatırlatıcıları zamanlanmış yerel bildirim (uygulama kapalıyken de gelir); yedek ve CSV paylaşım menüsüyle; ek resimleri uygulama içinde, PDF'ler paylaşımla; yazdır düğmesi gizli; service worker kapalı; durum çubuğu temaya uyar.
- CSS: çentik/güvenli alan boşlukları, iPhone'da yazı alanına dokununca yakınlaşmayı önleyen 16 px.
- İkonlar ve açılış ekranı: `scripts/icons.py` ile üretildi (1024 px AppIcon, 2732 px splash).
- Test: Capacitor köprüsü taklit edilerek iOS ve Android yolları tarayıcıda denendi (bildirim izni, hatırlatıcı ve Pomodoro zamanlama/iptal, CSV ve yedek paylaşımı, durum çubuğu) — hepsi doğru çağrıldı. Gerçek derleme Mac + Xcode gerektirir: `docs/UYGULAMALAR.md`.

## Ek 3 — Android uygulaması (Capacitor)
- `android/` projesi (min. Android 7 / SDK 24, hedef SDK 36), sürüm 1.3.0 (versionCode 10300).
- İkonlar: uyarlanabilir ikon (çivit zemin + beyaz takvim), yuvarlak ikon, bildirim ikonu, açılış ekranları.
- İzinler: bildirim gönderme, tam zamanlı alarm (hatırlatıcılar), açılışta bildirimleri yeniden kurma.
- İmza: `PLANLAYICI_KEYSTORE*` ortam değişkenleri varsa imzalı release APK; yoksa debug APK.
- Derleme: bu ortamda Android SDK'ya ve Gradle depolarına erişim olmadığı için APK GitHub Actions'ta üretilecek (Ek 5'teki iş akışı).

## Ek 4-5 — Mac ve Windows uygulamaları (Electron)
- `electron/main.cjs`: `app://planlayici/` özel protokolüyle www/ sunumu (modüller, localStorage ve IndexedDB çalışır), tek pencere kilidi, pencere boyutunu hatırlama, Türkçe menüler, ekler için ayrı pencere, dış bağlantılar tarayıcıda, Windows bildirim kimliği. `electron/preload.cjs` (sadece platform bilgisi; Node erişimi yok, sandbox açık). `electron/serve.cjs` + `serve.test.cjs` (yol güvenliği ve MIME; 4/4 test).
- `package.json` → electron-builder: Mac universal `.dmg` (ad-hoc imza), Windows x64 + arm64 NSIS kurulum (Türkçe), Linux AppImage.
- `.github/workflows/uygulamalar.yml`: testler → Android APK (+ secret'lar varsa imzalı release), iOS simülatör derleme kontrolü, Mac .dmg, Windows .exe; çıktılar Artifacts'ta.
- `docs/UYGULAMALAR.md`: dört platform için adım adım kurulum, güvenlik uyarıları, sürüm çıkarma listesi.
- Not: Electron ikili dosyası bu ortamdan indirilemediği için masaüstü uygulaması burada çalıştırılamadı; dosya sunucusu birim testleri ve platform algılama tarayıcıda denendi, paketler GitHub Actions'ta üretilecek.

## Ek 6 — Uygulamanın adı: My to do
- Görünen ad her yerde "My to do" oldu: sekme başlığı, kenar çubuğu, PWA manifest (ana ekrana ekle), iPhone ve Android uygulama adı, Mac/Windows pencere başlığı, menüler, kurulum kısayolu, CSV raporu, yedek hata mesajları, belgeler.
- Kurulum dosyaları: `MyToDo-<sürüm>-…` (Actions çıktıları `MyToDo-android`, `MyToDo-Mac`, `MyToDo-Windows`).
- Değişmeyenler (bilinçli): "Planlayıcı" sayfası (gün/ay/yıl görünümü) adını korudu; iç anahtarlar (`planlayici-data` vb.), paket kimliği `com.planlayici.app` ve yedek dosyası biçimi aynı kaldı — mevcut veriler ve yedekler sorunsuz açılır.
