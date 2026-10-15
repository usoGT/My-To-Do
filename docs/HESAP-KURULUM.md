# Hesap sistemi kurulumu (Supabase)

My to do'da hesap ve cihazlar arası eşitleme için **Supabase** kullanılır. Ücretsiz katman öğrenci kullanımı için fazlasıyla yeterli. Kurulum yaklaşık 10 dakika.

> Hesap kurulmasa da uygulama çalışır; veriler sadece o cihazda kalır.

## 1. Proje aç

1. https://supabase.com → **Start your project** → GitHub ile giriş yap.
2. **New project**: ad `planlayici`, güçlü bir veritabanı şifresi (bir yere not et), bölge olarak **Central EU (Frankfurt)**.
3. Proje hazır olunca (1–2 dk) devam et.

## 2. Veritabanını hazırla

1. Sol menü → **SQL Editor** → **New query**.
2. Projedeki `supabase/schema.sql` dosyasının **tamamını** yapıştır → **Run**.
3. "Success. No rows returned" görmelisin. Bu adım:
   - `items` tablosunu açar (tüm görevler, dersler, notlar burada, her kullanıcı ayrı),
   - **satır güvenliğini (RLS)** açar: herkes sadece kendi verisini görebilir,
   - ders notu ekleri için özel `attachments` dosya deposunu açar.

## 3. Anahtarları uygulamaya yaz

1. Sol menü → **Project Settings → API** (yeni panelde **Data API** / **API Keys**).
2. **Project URL** ve **Publishable key** (`sb_publishable_…`) anahtarını kopyala. Eski panelde adı **anon public**'tir (`eyJ…`); ikisi de çalışır.
3. `js/config.js` dosyasını aç:

```js
export const SUPABASE_URL = 'https://abcdefgh.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_...';
```

> Publishable/`anon` anahtarı uygulamanın içinde durur ve herkes görebilir; bu normaldir. Verileri koruyan şey 2. adımdaki RLS kurallarıdır. **secret** / **service_role** anahtarını ASLA uygulamaya yazma.

## 4. E-posta ayarları

**Authentication → Sign In / Providers → Email**:

- **Confirm email** açıksa: kayıt olan kişiye doğrulama e-postası gider, bağlantıya tıklayınca uygulama açılır ve giriş yapılmış olur. Denerken kapatabilirsin, yayına çıkarken açık tut.

**Authentication → URL Configuration**:

- **Site URL**: uygulamanın adresi (ör. `https://kullaniciadi.github.io/planlayici/`). Doğrulama ve şifre sıfırlama bağlantıları buraya döner.
- **Redirect URLs**: yerelde deniyorsan `http://localhost:5500/**` (Live Server) ekle.

Ücretsiz katmanda Supabase'in kendi e-posta sunucusu saatte birkaç e-postayla sınırlıdır. Çok kullanıcı olursa **Authentication → SMTP Settings**'ten kendi e-posta servisini (ör. Resend, Brevo) bağla.

## 5. Dene

1. Uygulamayı aç → kenar çubuğunun altında **Giriş yap / Kayıt ol** → hesap oluştur.
2. Başka bir tarayıcıda (ya da telefonda) aynı hesapla giriş yap: veriler gelir.
3. Bir cihazda görev ekle → diğerinde en geç 30 saniye içinde görünür (sayfaya dönünce hemen).

## Nasıl çalışıyor?

- Her değişiklik önce cihazda kaydedilir, sonra 1,5 sn içinde sunucuya gönderilir. İnternet yoksa bekler, gelince gönderilir.
- Diğer cihazlar 30 sn'de bir, sayfaya dönüldüğünde ve internet geldiğinde yeni kayıtları çeker.
- Aynı kaydı iki cihaz aynı anda değiştirirse **en son gönderen kazanır** (kayıt bazında; farklı görevler birbirini etkilemez).
- Ders notu ekleri (PDF, resim) `attachments` deposuna yüklenir; diğer cihaz eki açınca indirir.
- İlk girişte hem cihazda hem hesapta veri varsa uygulama sorar: birleştir ya da hesaptakini kullan.
- Çıkış yapınca o cihazdaki veriler silinir (hesapta durur).

## Sunucusuz deneme (geliştirme için)

Supabase açmadan hesap sistemini denemek için projede sahte bir sunucu var:

```bash
node tools/mock-supabase.mjs
```

Sonra uygulamada tarayıcı konsoluna:

```js
localStorage.setItem('planlayici-supabase', JSON.stringify({ url: 'http://localhost:54321', key: 'yerel' })); location.reload();
```

Geri almak için: `localStorage.removeItem('planlayici-supabase'); location.reload();` — Sahte sunucu verileri bellekte tutar, kapatınca silinir.

## Sorun giderme

| Belirti | Çözüm |
|---|---|
| "Hesap sistemi henüz kurulmadı" | `js/config.js`'deki iki değer boş. |
| "Sunucuya ulaşılamadı" | İnternet yok ya da URL yanlış (sonunda `/` olmasın). |
| Kayıt oldum ama giriş olmuyor | E-posta doğrulaması açık; gelen bağlantıya tıkla. |
| "new row violates row-level security policy" | `schema.sql` çalıştırılmamış ya da yarım kalmış; tekrar çalıştır. |
| Doğrulama bağlantısı yanlış adrese gidiyor | 4. adımdaki **Site URL**'yi düzelt. |
