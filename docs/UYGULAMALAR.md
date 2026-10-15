# iPhone, Android, Mac ve Windows uygulamaları

Dört uygulama da **aynı HTML/CSS/JS kodunu** kullanır; uygulama kodu derlenmez, sadece paketlenir.

| Platform | Araç | Klasör | Çıktı |
|---|---|---|---|
| iPhone / iPad | Capacitor | `ios/` | Xcode projesi |
| Android | Capacitor | `android/` | `.apk` |
| Mac | Electron | `electron/` | `.dmg` |
| Windows | Electron | `electron/` | `.exe` kurulum dosyası |

Paketleme için Node.js 22+ gerekir (npm sadece paketleme araçları için kullanılır, uygulama kodunda kütüphane yoktur).

```bash
npm install          # bir kez
npm run build:web    # uygulama dosyalarını www/ klasörüne kopyalar (her paketlemeden önce otomatik çalışır)
```

> Her uygulamada hesap özelliğinin çalışması için önce `js/config.js`'e Supabase bilgilerini yaz (docs/HESAP-KURULUM.md).

---

## iPhone

iPhone uygulaması sadece **Mac + Xcode** ile derlenip telefona kurulabilir (Apple kuralı).

**Gerekenler:** Mac, App Store'dan **Xcode**, iPhone ve USB kablo, Apple kimliği (ücretsiz yeter).

1. Projeyi Mac'e al, klasörde `npm install`.
2. `npm run ios` → web dosyaları kopyalanır ve Xcode açılır.
3. Xcode'da sol üstte **App** projesine tıkla → **Signing & Capabilities** → **Team**: Apple kimliğinle giriş yapıp kişisel takımını seç. "Bundle Identifier" başkasıyla çakışırsa sonuna bir şey ekle (ör. `com.planlayici.app.taha`).
4. iPhone'u kabloyla bağla, Xcode'un üstündeki cihaz listesinden seç → ▶ (Run).
5. İlk açılışta iPhone'da: **Ayarlar → Genel → VPN ve Cihaz Yönetimi** → geliştirici hesabına güven.

Notlar:
- Ücretsiz Apple kimliğiyle kurulan uygulama **7 günde bir** Xcode'dan yeniden kurulmalı. Ücretli Apple Developer (99 $/yıl) ile bu sınır kalkar ve App Store / TestFlight'a yüklenebilir.
- Kodu değiştirince: `npm run ios` (ya da `npm run sync`) → Xcode'da tekrar ▶.
- GitHub Actions'taki **iOS derleme kontrolü** her gönderimde projenin hatasız derlendiğini kontrol eder (telefona kurulabilir dosya üretmez; bunun için imza gerekir).

**iPhone'a özel davranışlar:**
- Pomodoro ve görev hatırlatıcıları uygulama kapalıyken de **bildirim** olarak gelir (ilk kullanımda Ayarlar → Bildirimler → "Bildirimlere izin ver").
- Yedek ve CSV dosyaları paylaşım menüsüyle kaydedilir ("Dosyalar'a Kaydet", Drive, WhatsApp …).
- Ders notu ekleri: resimler uygulama içinde, PDF'ler paylaşım menüsüyle açılır.
- Çentik ve alt çubuk için güvenli alan boşlukları otomatik.

**Hiç Mac yoksa:** Uygulamayı GitHub Pages'te yayınlayıp iPhone'da Safari → Paylaş → **Ana Ekrana Ekle** ile kurmak da mümkün (PWA; çevrimdışı çalışır).

---

## Android

İki yol var; ikisinde de sonuç telefona kurulabilen bir `.apk` dosyası.

### A) GitHub ile otomatik (bilgisayara bir şey kurmadan)

1. Projeyi GitHub'a yükle (`git push`).
2. GitHub'da depo → **Actions** → **Uygulamaları derle** → en son çalışma → en altta **Artifacts** → `MyToDo-android` indir.
3. Zip'in içindeki `.apk`'yı telefona at, aç. "Bilinmeyen kaynaklardan yüklemeye izin ver" sorusuna izin ver.

### B) Kendi bilgisayarında

1. **Android Studio**'yu kur (Android SDK ile birlikte gelir).
2. Klasörde `npm install`, sonra `npm run android` → Android Studio açılır.
3. Telefonu USB ile bağla (telefonda Geliştirici seçenekleri → USB hata ayıklama açık) → ▶ Run.
   APK dosyası için: Build → Build App Bundle(s) / APK(s) → Build APK(s).

### Güncellemeler ve imza (önemli)

Debug APK'lar her derlemede farklı bir anahtarla imzalanabilir; bu durumda yeni sürümü kurmak için eskisini silmek gerekir (veriler hesapta olduğu için sorun olmaz). Kalıcı bir imza için bir kez anahtar oluştur:

```bash
keytool -genkey -v -keystore planlayici.keystore -alias planlayici -keyalg RSA -keysize 2048 -validity 10000
```

Bu dosyayı **asla** depoya koyma ve kaybetme. GitHub'da depo → Settings → Secrets and variables → Actions → şu gizli değerleri ekle:

| Secret | Değer |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 planlayici.keystore` çıktısı (Mac: `base64 -i planlayici.keystore`) |
| `ANDROID_KEYSTORE_PASSWORD` | anahtar deposu şifresi |
| `ANDROID_KEY_ALIAS` | `planlayici` |
| `ANDROID_KEY_PASSWORD` | anahtar şifresi |

Bunlar tanımlıysa GitHub her seferinde **aynı imzayla** `planlayici-release.apk` da üretir; telefondaki uygulama silinmeden güncellenir. Play Store'a yüklemek için aynı anahtarla `.aab` gerekir (`./gradlew bundleRelease`).

**Android'e özel davranışlar:** bildirimler (Android 13+ izin sorar), paylaşım menüsüyle yedek/CSV, geri tuşu sayfalar arasında geri gider.

---

## Mac ve Windows

Masaüstü uygulaması **Electron** ile paketlenir: aynı uygulama, kendi penceresinde, internet olmadan da çalışır.

### A) GitHub ile otomatik

GitHub'da **Actions → Uygulamaları derle** → son çalışma → **Artifacts**:
- `MyToDo-Mac` → `MyToDo-<sürüm>-mac-universal.dmg` (Intel ve Apple Silicon Mac'lerde çalışır)
- `MyToDo-Windows` → `MyToDo-<sürüm>-win-x64.exe` (ve ARM bilgisayarlar için `arm64`)

### B) Kendi bilgisayarında

```bash
npm install
npm run desktop      # geliştirme: uygulamayı pencerede açar
npm run dist:mac     # Mac'te .dmg üretir   (release/ klasörüne)
npm run dist:win     # Windows'ta .exe üretir (release/ klasörüne)
```

Mac paketi Mac'te, Windows paketi Windows'ta derlenmelidir (bu yüzden GitHub yolu en kolayı).

### İlk açılışta güvenlik uyarısı (normal)

Uygulama ücretli bir geliştirici sertifikasıyla imzalanmadığı için:

- **Mac:** "My to do açılamıyor / geliştirici doğrulanamadı" der. **Sistem Ayarları → Gizlilik ve Güvenlik** → en altta **"Yine de Aç"**. Bir kez yapman yeterli. (Hâlâ açılmazsa Terminal'de: `xattr -cr "/Applications/My to do.app"`)
- **Windows:** "Windows bilgisayarınızı korudu" (SmartScreen) der. **Ek bilgi → Yine de çalıştır**.

Bu uyarıları tamamen kaldırmak için: Mac'te Apple Developer (99 $/yıl) ile imza + noter onayı, Windows'ta kod imzalama sertifikası gerekir.

**Masaüstüne özel davranışlar:**
- Pencere boyutu ve konumu hatırlanır; uygulama ikinci kez açılırsa mevcut pencere öne gelir.
- Türkçe menüler (Düzen, Görünüm, Pencere), Ctrl/⌘ + K ve N kısayolları.
- Yedek ve CSV için "Farklı kaydet" penceresi açılır, Yazdır / PDF çalışır.
- Bildirimler işletim sisteminin bildirim merkezine düşer.
- Ders notu ekleri ayrı pencerede açılır; web bağlantıları varsayılan tarayıcıda.

---

## Sürüm çıkarma kontrol listesi

1. `package.json` → `version` (ör. 1.4.0)
2. `js/version.js` ve `sw.js` → `CACHE_VERSION`
3. `android/app/build.gradle` → `versionCode` (bir artır) ve `versionName`
4. `ios/App/App.xcodeproj` → Xcode'da General → Version / Build
5. `node tools/update-sw.mjs` (yeni dosya eklendiyse)
6. `git push` → Actions'tan dosyaları indir.
