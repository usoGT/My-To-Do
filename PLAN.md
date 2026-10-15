# Planlayıcı — Uygulama Planı (HTML + CSS + JavaScript)

> Bu dosya, Planlayıcı uygulamasının **sadece HTML, CSS ve saf JavaScript** ile sıfırdan yazılması için yapay zeka kodlama ajanına (Antigravity) verilecek ana plandır.
> Uygulama **fazlar halinde** yazılır. Her faz bir öncekinin üstüne kurulur, her fazın sonunda **kabul kontrolleri** yapılır ve onaylanmadan sonraki faza geçilmez.

---

## 0. Bu dosya nasıl kullanılır (Taha için)

1. Boş bir klasör aç (örnek: `planlayici`), bu dosyayı klasörün içine `PLAN.md` adıyla koy.
2. Klasörü Antigravity'de aç.
3. Her faz için ajana aşağıdaki promptu ver, sadece `N` sayısını değiştir:

```
@PLAN.md dosyasını oku.
Önce şu bölümleri oku ve kurallarına uy: "1. Proje özeti", "2. Değişmez kurallar",
"3. Klasör yapısı", "4. Veri modeli", "5. Temel sözleşmeler".
Sonra SADECE "Faz N" bölümünü uygula.

- Başka bir fazın işine geçme, sonraki fazların dosyalarını oluşturma.
- Koda başlamadan önce: oluşturacağın/değiştireceğin dosyaların listesini ve kısa planını yaz, onayımı bekle.
- Bitirince: Faz N'nin "Kabul kontrolleri" listesini tek tek kontrol et, tests/tests.html'deki
  testlerin geçtiğini doğrula, ILERLEME.md'ye özet ekle ve bana "Elle test adımları"nı listele.
```

4. Ajan bitirince **"Elle test adımları"nı kendin dene.** Sorun varsa aynı sohbette düzelttir.
5. Her şey çalışıyorsa commit at:
   ```
   git add .
   git commit -m "Faz N: <fazın adı>"
   ```
6. Ajan bir şeyi bozduysa son commit'e dön: `git checkout .` (commit atılmamış değişiklikleri siler).
7. Her fazı **yeni bir sohbette** başlatmak daha temiz olur; plan dosyası zaten tüm bağlamı veriyor.

**Uygulamayı çalıştırmak:** `index.html` dosyasını çift tıklayarak AÇMA (JS modülleri `file://` ile çalışmaz). VS Code/Antigravity'ye **Live Server** eklentisini kur, `index.html`'e sağ tıkla → *Open with Live Server*. Alternatif: terminalde `npx serve .` veya `python -m http.server 5500`.

---

## 1. Proje özeti

**Planlayıcı**; öğrencilerin günlük, aylık ve yıllık görevlerini, rutinlerini, ders programını ve ders notlarını tek uygulamada toplayan bir planlama aracı. Notion fazla genel, Todoist ve Trello öğrenciye özel değil; Planlayıcı bu üçünün sade ve öğrenciye uygun bir karışımı.

- **Kimin için:** Öğrenciler ve düzenli rutinleri olan herkes.
- **Farkı:** Görevler, dersler, notlar ve odak süreleri birbirine bağlı. Bir derse tıklayınca ona ait her şey tek sayfada görünür.
- **Bu planın hedefi:** Bilgisayarda ve telefon tarayıcısında sorunsuz çalışan, verileri tarayıcıda saklayan bir sürüm.
- **Sonraki hedefler (bu planın dışında):** Hesap ve cihazlar arası senkronizasyon, telefon uygulaması, yapay zeka desteği. Mimari bunlara hazır olacak şekilde kurulur: tüm veri tek bir `store` üzerinden geçer.

### Sayfalar

| Sayfa | Adres | Ne yapıyor |
|---|---|---|
| Bugün | `#/bugun` | Günün görevleri, geciken görevler, rutinler, dersler ve aradaki boş zamanlar |
| Planlayıcı | `#/planlayici` | Gün, ay (takvim) ve yıl (ısı haritası) görünümleri; aylık ve yıllık hedefler |
| Hızlı Notlar | `#/hizli-notlar` | N tuşuyla her yerden not alma; notu göreve, hedefe ya da ders notuna çevirme |
| Rutinler | `#/rutinler` | Günlere göre tekrar eden alışkanlıklar ve seri (streak) takibi |
| Ders Programı | `#/program` | Haftalık takvim ızgarası, her günün boş zaman hesabı, ders yönetimi |
| Ders sayfası | `#/ders/:id` | Bir dersin görevleri, notları, saatleri ve toplam odak süresi |
| Ders Notları | `#/ders-notlari` | Derse bağlı notlar ve dosya ekleri (PDF, resim) |
| Pomodoro | `#/pomodoro` | Göreve bağlı odak seansları, haftalık grafik, bildirim |
| Ayarlar | `#/ayarlar` | Ad, tema, gün saatleri, Pomodoro süreleri, yedek alma ve yükleme |

Ek olarak her yerden çalışan **komut paleti (Ctrl + K)**: sayfalara gitme, arama ve tek satırda görev ekleme.

### Faz haritası

| Faz | Ad | Sonunda elimizde ne var |
|---|---|---|
| 0 | Hazırlık | Klasör yapısı, git, boş sayfa açılıyor |
| 1 | İskelet ve tasarım sistemi | Kenar çubuğu, 9 boş sayfa arası gezinme, açık/koyu tema, mobil düzen |
| 2 | Veri katmanı ve testler | Store, kalıcı kayıt, tarih yardımcıları, test sayfası |
| 3 | Ortak bileşenler ve Ayarlar | Modal, bildirim, onay penceresi; çalışan Ayarlar ve yedekleme |
| 4 | Dersler ve Ders Programı | Ders ekleme, haftalık ızgara, günlük boş zaman |
| 5 | Görevler | Görev ekle/düzenle/sil/tamamla, Bugün sayfasında görev listesi |
| 6 | Rutinler | Rutin ekleme, günlük işaretleme, seri hesabı |
| 7 | Bugün sayfası (tam) | Görev + rutin + ders + boş zaman tek ekranda, örnek veri |
| 8 | Planlayıcı ve hedefler | Gün/ay/yıl görünümleri, ısı haritası, aylık/yıllık hedefler |
| 9 | Ders Notları ve ekler | Not editörü, PDF/resim ekleri (IndexedDB) |
| 10 | Ders sayfası | Derse ait her şey tek sayfada |
| 11 | Pomodoro | Zamanlayıcı, göreve bağlama, bildirim, haftalık grafik |
| 12 | Hızlı Notlar ve Komut paleti | N kısayolu, nottan dönüştürme, Ctrl+K |
| 13 | Cila ve yayına hazırlık | Erişilebilirlik, boş durumlar, PWA (ana ekrana ekle), son test |
| 14+ | Opsiyonel | Son tarih ve hatırlatıcı, sınav takvimi |

---

## 2. Değişmez kurallar (her fazda geçerli)

### Teknoloji
1. **Sadece HTML, CSS ve saf JavaScript (ES2022).** React, Vue, jQuery, Tailwind, Bootstrap, TypeScript, Vite, npm paketi, CDN **yasak**. Grafik, takvim, ikon kütüphanesi de yok; hepsi elle yazılır.
2. JavaScript **ES modülleri** ile yazılır: `index.html` içinde tek bir `<script type="module" src="js/app.js">` olur, diğer dosyalar `import`/`export` ile bağlanır. Global değişken kullanılmaz.
3. Yazı tipi sistem fontudur: `font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;` (dış font yüklenmez).
4. İkonlar `js/lib/icons.js` içinde elle yazılmış satır içi SVG'lerdir (24×24, `stroke="currentColor"`).
5. Tek sayfa uygulamasıdır (SPA): tek `index.html`, sayfalar JavaScript ile `#/...` adreslerine göre çizilir.

### Kod düzeni
6. **Değişken, fonksiyon ve dosya adları İngilizce; arayüz metinleri ve kod yorumları Türkçe.** (Örnek: `function getOverdueTasks()`, ekranda "Geciken görevler".)
7. **Veri sadece store üzerinden değişir.** Sayfalar ve bileşenler `state`'i doğrudan değiştirmez; `js/store/actions/` içindeki fonksiyonları çağırır.
8. **Kullanıcı metni asla kaçışsız HTML'e girmez.** HTML üretimi her zaman `html` etiketli şablonu ile yapılır (bkz. 5.2). `innerHTML = "..." + userText` yasak.
9. Satır içi olay yasak (`onclick="..."`). Olaylar `addEventListener` ile, listelerde **olay delegasyonu** ve `data-action` öznitelikleri ile bağlanır.
10. Bir dosya ~400 satırı geçiyorsa bölünür. Her fonksiyon tek iş yapar.
11. Hesaplama içeren her saf fonksiyon (tarih, boş zaman, seri, ayrıştırıcı vb.) `js/lib/` veya `js/store/selectors.js` içinde, **DOM'a dokunmadan** yazılır ve test edilir.
12. `console.log` bırakılmaz (hata için `console.error` olabilir).

### Tarih ve saat (en sık hata kaynağı)
13. Gün tarihleri her zaman **yerel saatle** `"YYYY-MM-DD"` metni olarak saklanır; saatler `"HH:MM"` metni olarak.
14. **`new Date("2026-10-14")` KULLANMA** (UTC olarak okunur, Türkiye'de gün kayar). Her zaman `js/lib/dates.js` içindeki `parseDate()` / `toDateKey()` kullanılır.
15. Haftanın günleri **0 = Pazartesi … 6 = Pazar** olarak tutulur. JS'deki `getDay()` (0 = Pazar) sadece `weekdayIndex()` yardımcısı içinde dönüştürülür.
16. Tarih/saat gösterimi Türkçe: `Intl.DateTimeFormat('tr-TR')` ya da `dates.js` içindeki ay/gün adları.

### Arayüz
17. Tüm renkler, boşluklar, yazı boyutları, köşe yuvarlaklıkları `css/tokens.css` içindeki CSS değişkenlerinden gelir. CSS dosyalarında sabit renk kodu yazılmaz.
18. Açık ve koyu tema `<html data-theme="light|dark">` ile değişir.
19. Her sayfa 360 px genişlikte (telefon) yatay kaydırma olmadan çalışır. Kırılım noktası: `768px`.
20. Butonlar `<button>`, bağlantılar `<a>`; her form alanının `<label>`'ı var; klavye ile her şeye ulaşılır; odak çerçevesi görünür.
21. Animasyonlar kısa (150–250 ms) ve `prefers-reduced-motion` açıkken kapalı.

### Süreç
22. Ajan **sadece istenen fazı** yapar. Önceki fazların dosyalarına sadece gerektiğinde dokunur ve bunu ILERLEME.md'de belirtir.
23. Her faz sonunda: kabul kontrolleri tek tek işaretlenir, `tests/tests.html` tamamen yeşil olur, `ILERLEME.md`'ye "Faz N — yapılanlar, değişen dosyalar, bilinen sorunlar" eklenir.
24. Bir kural uygulanamıyorsa ajan kendi kafasına göre çözmez, durur ve sorar.

---

## 3. Klasör yapısı

Bu yapı Faz 0'da klasörler olarak açılır; dosyalar ilgili fazda oluşturulur.

```
planlayici/
├── PLAN.md                    # bu dosya
├── ILERLEME.md                # her fazın özeti (ajan doldurur)
├── README.md                  # nasıl çalıştırılır
├── index.html                 # tek HTML sayfası
├── manifest.webmanifest       # Faz 13
├── sw.js                      # Faz 13 (service worker)
├── assets/
│   └── icons/                 # uygulama ikonları (Faz 13)
├── css/
│   ├── tokens.css             # renk, boşluk, yazı değişkenleri + tema
│   ├── base.css               # sıfırlama, tipografi, genel stiller
│   ├── layout.css             # kenar çubuğu, üst çubuk, ana alan, mobil alt menü
│   ├── components.css         # buton, input, kart, modal, toast, rozet, sekme, liste
│   └── pages/                 # sayfaya özel stiller (today.css, schedule.css …)
├── js/
│   ├── app.js                 # giriş noktası: store'u başlat, düzeni çiz, router'ı başlat
│   ├── router.js              # hash router
│   ├── store/
│   │   ├── store.js           # state, update, subscribe, kalıcı kayıt
│   │   ├── schema.js          # varsayılan state, sürüm, migrate
│   │   ├── selectors.js       # türetilmiş veriler (geciken görevler, seri, boş zaman …)
│   │   └── actions/
│   │       ├── settings.js
│   │       ├── courses.js
│   │       ├── schedule.js
│   │       ├── tasks.js
│   │       ├── routines.js
│   │       ├── goals.js
│   │       ├── quick-notes.js
│   │       ├── course-notes.js
│   │       └── pomodoro.js
│   ├── lib/
│   │   ├── dom.js             # html şablonu, escape, qs, delegate
│   │   ├── dates.js           # tarih yardımcıları
│   │   ├── ids.js             # benzersiz id üretimi
│   │   ├── icons.js           # SVG ikonlar
│   │   ├── text.js            # Türkçe normalleştirme, arama
│   │   ├── time-slots.js      # boş zaman hesabı (Faz 4)
│   │   ├── files-db.js        # IndexedDB dosya deposu (Faz 9)
│   │   ├── backup.js          # yedek al / yükle (Faz 3)
│   │   ├── sample-data.js     # örnek veri (Faz 7)
│   │   └── task-parser.js     # tek satırlık görev ayrıştırıcı (Faz 12)
│   ├── components/            # tekrar kullanılan arayüz parçaları
│   │   ├── sidebar.js
│   │   ├── topbar.js
│   │   ├── modal.js
│   │   ├── toast.js
│   │   ├── confirm.js
│   │   ├── empty-state.js
│   │   ├── task-item.js
│   │   ├── task-form.js
│   │   ├── heatmap.js
│   │   ├── bar-chart.js
│   │   ├── quick-note.js
│   │   └── command-palette.js
│   └── pages/
│       ├── today.js
│       ├── planner.js
│       ├── quick-notes.js
│       ├── routines.js
│       ├── schedule.js
│       ├── course.js
│       ├── course-notes.js
│       ├── pomodoro.js
│       ├── settings.js
│       └── not-found.js
└── tests/
    ├── tests.html             # tarayıcıda açılınca tüm testleri çalıştırır
    ├── runner.js              # mini test aracı (test, assertEqual …)
    └── *.test.js              # her modülün testi
```

---

## 4. Veri modeli

Tüm uygulama verisi **tek bir JSON nesnesi** olarak `localStorage`'da `planlayici-data` anahtarında tutulur. Dosya ekleri (PDF, resim) büyük olduğu için ayrıca **IndexedDB**'de tutulur (Faz 9).

Bu modelin tamamı Faz 2'de `schema.js` içinde boş koleksiyonlarla tanımlanır; sonraki fazlar sadece doldurur.

```js
// js/store/schema.js — varsayılan state
export const SCHEMA_VERSION = 1;

export function createDefaultState() {
  return {
    version: SCHEMA_VERSION,

    settings: {
      name: '',                 // kullanıcının adı (selamlama için)
      theme: 'system',          // 'light' | 'dark' | 'system'
      dayStart: '08:00',        // günün başladığı saat (boş zaman hesabı için)
      dayEnd: '23:00',          // günün bittiği saat
      showWeekend: true,        // ders programında Cmt/Paz göster
      pomodoro: {
        focusMin: 25,
        shortBreakMin: 5,
        longBreakMin: 15,
        longBreakEvery: 4,      // kaç odak seansında bir uzun mola
        autoStartNext: false,
        sound: true,
      },
      notifications: false,     // tarayıcı bildirim izni verildi mi
    },

    courses: [],
    // { id, name, code, color, teacher, room, createdAt }
    // color: COURSE_COLORS listesinden bir anahtar ('indigo', 'teal' …)

    schedule: [],
    // { id, courseId, weekday (0=Pzt..6=Paz), start 'HH:MM', end 'HH:MM', type ('ders'|'lab'|'diger'), room }

    tasks: [],
    // { id, title, notes, date 'YYYY-MM-DD'|null, time 'HH:MM'|null, estimateMin number|null,
    //   courseId|null, goalId|null, priority ('low'|'medium'|'high'),
    //   done boolean, doneAt ISO|null, createdAt ISO, order number }

    routines: [],
    // { id, title, weekdays [0..6], time 'HH:MM'|null, durationMin number, color, archived boolean, createdAt ISO }

    routineLogs: {},
    // { 'YYYY-MM-DD': [routineId, routineId, …] }  → o gün tamamlanan rutinler

    goals: [],
    // { id, title, period ('month'|'year'), periodKey ('2026-10' | '2026'), courseId|null,
    //   done boolean, doneAt ISO|null, createdAt ISO }

    quickNotes: [],
    // { id, text, createdAt ISO, convertedTo: null | { type: 'task'|'goal'|'courseNote', id } }

    courseNotes: [],
    // { id, courseId, title, body, attachments: [{ id, name, type, size }], createdAt ISO, updatedAt ISO }
    // ekin kendisi (Blob) IndexedDB'de attachment.id anahtarıyla durur

    pomodoroSessions: [],
    // { id, startedAt ISO, endedAt ISO, durationMin, taskId|null, courseId|null }
    // sadece ODAK seansları kaydedilir, molalar kaydedilmez
  };
}
```

**İlişki kuralları**
- Bir ders silinince: ona bağlı `schedule` kayıtları silinir, `tasks`/`goals`/`pomodoroSessions` içindeki `courseId` `null` yapılır, `courseNotes` ve ekleri silinir. Silmeden önce onay penceresinde bu sayılar gösterilir.
- Bir hedef silinince: bağlı görevlerin `goalId`'si `null` yapılır.
- Bir görev silinince: bağlı Pomodoro seanslarının `taskId`'si `null` yapılır (süreler kaybolmaz).
- Bir rutin silinince: `routineLogs` içindeki id'leri de temizlenir. ("Arşivle" seçeneği geçmişi korur.)

**Ders renkleri** (`js/lib/colors.js` ya da `schema.js` içinde):
`indigo, blue, teal, green, amber, orange, red, pink` — her birinin açık ve koyu tema için CSS değişkeni `tokens.css`'te tanımlıdır (`--course-indigo` gibi).

**Sürüm ve geçiş (migration):** Kayıtlı veri okunurken `migrate(data)` çalışır: eksik alanları varsayılanlarla doldurur (settings için derin birleştirme, koleksiyonlar için boş dizi). İleride bir alanın şekli değişirse `SCHEMA_VERSION` artırılır ve `migrations[eskiSürüm]` fonksiyonu yazılır.

---

## 5. Temel sözleşmeler (tüm kod bunlara uyar)

### 5.1 Store

```js
// js/store/store.js
const DEFAULT_KEY = 'planlayici-data';
let state = null;
let storage = null;
let key = DEFAULT_KEY;
const listeners = new Set();

// Uygulama açılışında bir kez çağrılır. Testler bellek içi bir storage verir.
export function initStore({ storage: s = window.localStorage, storageKey = DEFAULT_KEY } = {}) { … }

// State'i okur. Dönen nesne DEĞİŞTİRİLMEZ, sadece okunur.
export function getState() { return state; }

// Tek değişiklik kapısı. label: hata ayıklama için kısa ad ('tasks/add').
export function update(label, recipe) {
  const next = structuredClone(state);
  recipe(next);           // recipe taslağı değiştirir
  state = next;
  persist();              // localStorage'a yazar; kota dolarsa toast ile uyarır
  listeners.forEach((fn) => fn(state, label));
}

// Değişiklikleri dinler; dinlemeyi bırakmak için dönen fonksiyon çağrılır.
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// Yedek yüklerken ya da "tüm verileri sil"de kullanılır.
export function replaceState(newState) { … }
```

Action örneği:
```js
// js/store/actions/tasks.js
import { update } from '../store.js';
import { createId } from '../../lib/ids.js';

export function addTask(input) {
  const task = { id: createId(), title: input.title.trim(), /* … varsayılanlar … */ };
  update('tasks/add', (s) => { s.tasks.push(task); });
  return task;
}
```

Her action girişini doğrular (ör. boş başlık → `Error` fırlatır); arayüz bu hatayı yakalayıp formda gösterir.

### 5.2 HTML üretimi ve DOM

```js
// js/lib/dom.js
export function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

class SafeHtml { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new SafeHtml(s);

// Etiketli şablon: içine giren her değer kaçışlanır; html`` sonuçları ve diziler olduğu gibi eklenir.
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => {
    out += toHtml(v) + strings[i + 1];
  });
  return new SafeHtml(out);
}
function toHtml(v) {
  if (v instanceof SafeHtml) return v.s;
  if (Array.isArray(v)) return v.map(toHtml).join('');
  if (v === false || v === null || v === undefined) return '';
  return escapeHtml(v);
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

// Olay delegasyonu: delegate(root, 'click', '[data-action]', (e, el) => …)
export function delegate(root, type, selector, handler) { … return () => root.removeEventListener(…); }
```

Kullanım: `root.innerHTML = html\`<h2>${task.title}</h2>${items.map(renderItem)}\`;`

### 5.3 Sayfa modülü

```js
// js/pages/today.js
export default {
  title: 'Bugün',
  // root: sayfa alanı (<main> içindeki kap). ctx: { params, query }
  // Dönen fonksiyon sayfadan çıkarken çağrılır (abonelikleri, zamanlayıcıları, olayları temizler).
  render(root, ctx) {
    const draw = () => { root.innerHTML = String(view(getState())); };
    draw();
    const unsub = subscribe(draw);
    const off = delegate(root, 'click', '[data-action]', onAction);
    return () => { unsub(); off(); };
  },
};
```

Kural: Sayfa yeniden çizilirken açık bir form kaybolmasın diye **formlar modal içinde** açılır. Sayfa içi satır içi düzenleme (ör. not editörü) varsa o bölüm yeniden çizilmez, sadece listeler yeniden çizilir.

### 5.4 Router

- Adres biçimi: `#/yol/parametre?anahtar=değer`.
- Rota tablosu `router.js` içinde: `{ path: '/ders/:id', page: () => import('./pages/course.js') }` (sayfalar dinamik `import()` ile yüklenir).
- Adres değişince: önceki sayfanın temizlik fonksiyonu çağrılır → yeni sayfa çizilir → `document.title = "<Sayfa> · Planlayıcı"` → kenar çubuğunda aktif öğe işaretlenir → sayfa en üste kaydırılır.
- Boş adres `#/bugun`'a yönlenir. Bilinmeyen adres `not-found.js`'i gösterir.
- `navigate(path, query)` yardımcısı dışa açılır.

### 5.5 Testler

`tests/runner.js` küçük bir test aracı sağlar: `test(ad, fn)`, `assertEqual(gerçek, beklenen)`, `assertDeepEqual`, `assertThrows`. `tests/tests.html` tüm `*.test.js` dosyalarını içe aktarır, sonuçları sayfada yeşil/kırmızı liste olarak ve en üstte "X / Y geçti" olarak gösterir. Testler **gerçek veriye dokunmaz**: store'u bellek içi storage ile başlatır.

---

## Faz 0 — Hazırlık

**Amaç:** Proje klasörünü, kuralları ve git'i hazırlamak. Neredeyse hiç kod yok.

**Yapılacaklar**
1. Bölüm 3'teki klasörleri oluştur (boş klasörlerde git için `.gitkeep`).
2. `index.html`: `lang="tr"`, `meta charset="utf-8"`, `meta viewport`, başlık "Planlayıcı", gövdede sadece `<h1>Planlayıcı çalışıyor</h1>`.
3. `README.md`: uygulamanın bir paragraflık tanımı + nasıl çalıştırılır (Live Server veya `npx serve .`) + testler nasıl açılır (`/tests/tests.html`).
4. `ILERLEME.md`: başlık + "Faz 0 — Hazırlık" özeti.
5. `.gitignore`: `.DS_Store`, `Thumbs.db`, `node_modules/`, `.vscode/` (isteğe bağlı).
6. `.editorconfig`: 2 boşluk girinti, UTF-8, satır sonu LF.
7. Git deposunu başlat ve ilk commit'i hazırla (commit'i Taha atar).

**Bu fazda YAPMA:** CSS, JS, sayfa tasarımı.

**Kabul kontrolleri**
- [ ] Klasör yapısı bölüm 3 ile aynı.
- [ ] Live Server ile açınca "Planlayıcı çalışıyor" yazısı görünüyor.
- [ ] `git status` temiz bir başlangıç gösteriyor.

**Elle test:** Live Server ile aç, yazıyı gör. `git log` ile commit'i kontrol et.

---

## Faz 1 — İskelet ve tasarım sistemi

**Amaç:** Uygulamanın kabuğu: kenar çubuğu, üst çubuk, 9 sayfa arasında gezinme, açık/koyu tema, telefon düzeni. Sayfaların içi şimdilik sadece başlık ve "Bu sayfa Faz X'te gelecek" yazısı.

**Dosyalar:** `index.html`, `css/tokens.css`, `css/base.css`, `css/layout.css`, `css/components.css`, `js/app.js`, `js/router.js`, `js/lib/dom.js`, `js/lib/icons.js`, `js/components/sidebar.js`, `js/components/topbar.js`, `js/pages/*.js` (hepsi yer tutucu), `js/pages/not-found.js`.

**1. Tasarım değişkenleri (`tokens.css`)**

| Değişken | Açık | Koyu |
|---|---|---|
| `--bg` | `#F6F6F3` | `#0F1115` |
| `--surface` | `#FFFFFF` | `#171A21` |
| `--surface-2` | `#F0F0EC` | `#1E222B` |
| `--text` | `#1C1F24` | `#E7E9EC` |
| `--text-muted` | `#6A707A` | `#9BA3AE` |
| `--border` | `#E3E3DE` | `#2A2F3A` |
| `--primary` | `#4F46E5` | `#8B85F8` |
| `--primary-text` | `#FFFFFF` | `#0F1115` |
| `--success` | `#16A34A` | `#4ADE80` |
| `--warning` | `#D97706` | `#FBBF24` |
| `--danger` | `#DC2626` | `#F87171` |

Ayrıca: boşluk ölçeği `--space-1: 4px` … `--space-8: 48px`; yazı boyutları `--text-xs: 12px`, `--text-sm: 14px`, `--text-md: 16px`, `--text-lg: 20px`, `--text-xl: 28px`; `--radius: 10px`, `--radius-sm: 6px`; `--shadow-1`, `--shadow-2`; `--sidebar-w: 240px`; 8 ders rengi (`--course-indigo` … `--course-pink`) ve her biri için açık zemin tonu (`--course-indigo-soft` …).

Tema seçimi: `<html data-theme="light">` / `"dark"`. "Sistem" seçiliyse `matchMedia('(prefers-color-scheme: dark)')` dinlenir. Tema, sayfa çizilmeden önce uygulanır: beyaz yanıp sönme olmasın diye `index.html` `<head>` içine kayıtlı temayı okuyup `data-theme`'i ayarlayan 3–4 satırlık tek bir satır içi `<script>` konur (bu, kural 2'nin tek istisnasıdır).

> Not: Faz 1'de ayarlar henüz store'da değil; tema geçici olarak `localStorage['planlayici-theme']`'de tutulur. Faz 3'te store'a taşınır.

**2. Düzen (`layout.css`, `sidebar.js`, `topbar.js`)**
- Masaüstü (≥ 768 px): solda 240 px sabit kenar çubuğu; üstte logo/uygulama adı, altında menü: Bugün, Planlayıcı, Hızlı Notlar, Rutinler, Ders Programı, Ders Notları, Pomodoro; en altta Ayarlar. Her öğe ikon + yazı. Aktif öğe vurgulu.
- Kenar çubuğunda "Derslerim" başlıklı boş bir bölüm bırak (Faz 4'te dolacak).
- Üst çubuk: sayfa başlığı, bugünün tarihi ("14 Ekim 2026, Çarşamba"), sağda: arama butonu ("Ara… Ctrl K" yazılı, şimdilik işlevsiz), hızlı not butonu (işlevsiz), tema değiştir butonu (çalışır).
- Telefon (< 768 px): kenar çubuğu gizlenir; altta sabit 5 öğeli menü: Bugün, Planlayıcı, Program, Pomodoro, Menü. "Menü" soldan açılan bir çekmece açar (tüm menü + Ayarlar). Çekmece dışına tıklayınca veya Esc ile kapanır.
- Ana alan en fazla 1100 px genişlikte, ortalı, iç boşluk `--space-6` (telefonda `--space-4`).

**3. Router (`router.js`)** bölüm 5.4'e göre. Tüm rotalar tanımlı; `#/ders/:id` şimdilik "Ders: {id}" yazar.

**4. Bileşen stilleri (`components.css`)** — şimdilik sadece stiller: `.btn` (`--primary`, `--ghost`, `--danger`, `--sm`, `--icon`), `.input`, `.select`, `.textarea`, `.checkbox`, `.card`, `.badge`, `.tabs`, `.list`, `.list-item`, `.empty`. Test için değil, görmek için `#/ayarlar` yer tutucusunun altına bir "Bileşen vitrini" koy (Faz 3'te kaldırılacak).

**Bu fazda YAPMA:** store, veri kaydetme, gerçek sayfa içerikleri, Ctrl+K, N kısayolu.

**Kabul kontrolleri**
- [ ] 9 sayfa arasında hem kenar çubuğundan hem adres çubuğundan geçiş yapılıyor; geri/ileri tuşları çalışıyor.
- [ ] Aktif sayfa menüde vurgulu, sekme başlığı "Bugün · Planlayıcı" gibi değişiyor.
- [ ] `#/olmayan-sayfa` "Sayfa bulunamadı" ve Bugün'e dönüş bağlantısı gösteriyor.
- [ ] Tema butonu açık/koyu arasında geçiyor, sayfa yenilenince seçim korunuyor.
- [ ] 360 px genişlikte yatay kaydırma yok, alt menü ve çekmece çalışıyor.
- [ ] Tab tuşuyla tüm menü öğelerine ulaşılıyor, odak çerçevesi görünüyor.
- [ ] CSS dosyalarında `tokens.css` dışında sabit renk kodu yok.

**Elle test:** Tarayıcı geliştirici araçlarında cihaz modunu aç (iPhone SE), menüleri dene. Tema değiştir, yenile. Adres çubuğuna `#/ders/abc` yaz.

---

## Faz 2 — Veri katmanı, yardımcılar ve test altyapısı

**Amaç:** Uygulamanın beyni. Ekranda neredeyse değişiklik yok; ama her şey test edilmiş durumda.

**Dosyalar:** `js/store/store.js`, `js/store/schema.js`, `js/store/selectors.js` (boş başlangıç), `js/lib/ids.js`, `js/lib/dates.js`, `js/lib/text.js`, `tests/tests.html`, `tests/runner.js`, `tests/dates.test.js`, `tests/store.test.js`, `tests/text.test.js`, `tests/dom.test.js`.

**1. Store** — bölüm 5.1'deki API'nin tamamı:
- `initStore`: storage'dan okur; yoksa `createDefaultState()`; bozuk JSON ise varsayılanla başlar, bozuk veriyi `planlayici-data-bozuk-<zaman>` anahtarına yedekler ve `console.error` yazar.
- `persist`: `JSON.stringify` + `setItem`; `QuotaExceededError` yakalanır ve dinleyicilere bildirilir (Faz 3'te toast'a bağlanır).
- `migrate(data)`: bölüm 4'teki kurala göre.
- `app.js` açılışta `initStore()` çağırır.

**2. `ids.js`:** `createId()` → `crypto.randomUUID()` varsa onu, yoksa zaman + rastgele sayıdan oluşan bir id döndürür.

**3. `dates.js`** (hepsi saf fonksiyon):
- `toDateKey(date)` → `"2026-10-14"` (yerel)
- `parseDate(key)` → yerel gece yarısında `Date`
- `todayKey()`
- `addDays(key, n)`, `diffDays(a, b)`
- `weekdayIndex(keyOrDate)` → 0 = Pazartesi … 6 = Pazar
- `startOfWeek(key)` (Pazartesi), `weekDays(key)` → 7 günlük dizi
- `monthKey(key)` → `"2026-10"`, `yearKey(key)` → `"2026"`
- `monthGrid(monthKey)` → takvim için 6×7 = 42 günlük dizi (Pazartesi başlangıçlı, önceki/sonraki ayın günleri dahil, her öğede `{ key, inMonth }`)
- `timeToMinutes("09:30")` → 570, `minutesToTime(570)` → `"09:30"`
- `formatDateLong(key)` → "14 Ekim 2026, Çarşamba"; `formatDateShort(key)` → "14 Eki"; `formatDuration(dk)` → "1 sa 20 dk"
- `MONTHS_TR`, `WEEKDAYS_TR` ("Pazartesi" …), `WEEKDAYS_SHORT_TR` ("Pzt" …)

**4. `text.js`:**
- `normalizeTr(s)` → Türkçe küçük harf (`toLocaleLowerCase('tr-TR')`) + `ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u` + baş/son boşluk temizliği. Aramalarda kullanılır.
- `matches(text, query)` → normalize edilmiş metin sorguyu içeriyor mu.

**5. Test altyapısı** — bölüm 5.5.

**Zorunlu testler (en az):**
- `toDateKey(new Date(2026, 9, 14))` → `"2026-10-14"`
- `parseDate("2026-10-14").getDate()` → `14` (gün kaymıyor)
- `weekdayIndex("2026-10-14")` → `2` (Çarşamba), `weekdayIndex("2026-10-18")` → `6` (Pazar), `weekdayIndex("2026-10-19")` → `0`
- `addDays("2026-10-31", 1)` → `"2026-11-01"`; `addDays("2026-03-28", 2)` → `"2026-03-30"`
- `startOfWeek("2026-10-14")` → `"2026-10-12"`
- `monthGrid("2026-10")` 42 öğe, ilk öğe `"2026-09-28"`, `"2026-10-01"` `inMonth: true`
- `timeToMinutes("09:30")` → `570`, `minutesToTime(1380)` → `"23:00"`
- `normalizeTr("İSTANBUL Çığ")` → `"istanbul cig"`; `matches("Fizik Ödevi", "odev")` → `true`
- Store: `update` sonrası dinleyici çağrılıyor; storage'a yazılıyor; yeniden `initStore` ile aynı veri geri geliyor; eksik alanlı eski veri `migrate` ile tamamlanıyor; bozuk JSON'da uygulama çökmüyor.
- `html` şablonu: `html\`<b>${'<script>'}</b>\`` → `<b>&lt;script&gt;</b>`; iç içe `html` kaçışlanmıyor; dizi birleşiyor; `false`/`null` boş metin.

**Bu fazda YAPMA:** Arayüzde veri gösterme, action dosyaları (sadece klasör).

**Kabul kontrolleri**
- [ ] `/tests/tests.html` açılınca tüm testler yeşil.
- [ ] Uygulama açılınca `localStorage['planlayici-data']` varsayılan state ile oluşuyor.
- [ ] `localStorage['planlayici-data']`'ya elle bozuk metin yazıp yenileyince uygulama çökmüyor.
- [ ] `dates.js` içinde `new Date("YYYY-MM-DD")` kullanımı yok.

**Elle test:** Testler sayfasını aç. Geliştirici araçları → Application → Local Storage'da veriyi gör, bozup yenile.

---

## Faz 3 — Ortak bileşenler ve Ayarlar

**Amaç:** Sonraki tüm fazların kullanacağı modal, bildirim (toast) ve onay penceresi; tamamen çalışan Ayarlar sayfası ve yedekleme.

**Dosyalar:** `js/components/modal.js`, `toast.js`, `confirm.js`, `empty-state.js`, `js/store/actions/settings.js`, `js/lib/backup.js`, `js/pages/settings.js`, `css/pages/settings.css`, `tests/backup.test.js`, `tests/settings.test.js`.

**1. Modal (`modal.js`)**
- `openModal({ title, content (SafeHtml), size: 'sm'|'md'|'lg', onMount(el, close), onClose })` → `{ el, close }`.
- `<dialog>` öğesi kullanılır (`showModal()`); arka plan karartılır; Esc ve arka plana tıklama kapatır; açılınca ilk input'a odaklanır, kapanınca odak açan butona döner.
- Telefonda modal alttan açılan tam genişlik panel olur.

**2. Toast (`toast.js`)** — `toast(mesaj, { type: 'info'|'success'|'error', action: { label, onClick }, duration: 4000 })`. Sağ altta (telefonda altta, menünün üstünde) yığılır; `aria-live="polite"`. "Geri al" gibi eylem butonu destekler (Faz 5'te görev silmede kullanılacak).

**3. Onay (`confirm.js`)** — `await confirmDialog({ title, message, confirmText: 'Sil', danger: true, requireText: null })` → `true/false`. `requireText: 'SİL'` verilirse kullanıcı o metni yazmadan buton aktif olmaz.

**4. Boş durum (`empty-state.js`)** — `emptyState({ icon, title, text, action: { label, dataAction } })`.

**5. Ayarlar sayfası** — kart kart bölümler:
- **Profil:** Ad (selamlamada kullanılacak).
- **Görünüm:** Tema (Açık / Koyu / Sistem — üçlü seçim düğmesi). Faz 1'deki geçici `planlayici-theme` anahtarı kaldırılır, tema artık `settings.theme`'den gelir (eski değer varsa bir kez taşınır). `<head>` içindeki satır içi tema betiği de artık `planlayici-data` içindeki `settings.theme`'i okuyacak şekilde güncellenir.
- **Gün saatleri:** Gün başlangıcı, gün bitişi (`<input type="time">`). Doğrulama: bitiş başlangıçtan sonra olmalı, en az 4 saat fark.
- **Ders programı:** "Hafta sonunu göster" anahtarı.
- **Pomodoro:** Odak (5–90 dk), kısa mola (1–30), uzun mola (5–60), kaç odakta bir uzun mola (2–8), sonraki seansı otomatik başlat, ses.
- **Bildirimler:** "Bildirimlere izin ver" butonu → `Notification.requestPermission()`; sonucu gösterir (izin verildi / reddedildi / tarayıcı desteklemiyor).
- **Veri:**
  - *Yedek al:* `planlayici-yedek-2026-10-14.json` dosyasını indirir.
  - *Yedek yükle:* dosya seç → doğrula → onay ("Mevcut tüm verilerin yerine geçecek") → `replaceState` → toast.
  - *Tüm verileri sil:* `requireText: 'SİL'` ile onay → varsayılan state.
  - Altta küçük yazı: "Verilerin sadece bu tarayıcıda saklanıyor. Başka bilgisayarda aynı verileri görmek için yedek alıp orada yükle."
- Değişiklikler **anında kaydedilir** (Kaydet butonu yok); kaydedilince küçük "Kaydedildi" toast'ı.
- Faz 1'deki bileşen vitrini kaldırılır.

**6. Yedek biçimi (`backup.js`)**
```json
{ "app": "planlayici", "format": 1, "exportedAt": "2026-10-14T11:53:00.000Z",
  "schemaVersion": 1, "state": { … }, "files": [] }
```
- `createBackup(state, files)` → nesne; `downloadJson(nesne, dosyaAdı)`.
- `validateBackup(json)` → `{ ok, error, state }`: `app === 'planlayici'` değilse, `state` yoksa, `schemaVersion` mevcuttan büyükse hata ("Bu yedek daha yeni bir sürümden"). Geçerliyse `migrate` uygulanmış state döner.
- `files` alanı Faz 9'da doldurulacak; şimdilik boş dizi.

**7. Settings action'ları:** `updateSettings(partial)`, `updatePomodoroSettings(partial)` — sayısal aralık doğrulaması ile.

**Testler:** `validateBackup` geçerli/geçersiz örnekler; eksik alanlı yedek migrate ile tamamlanıyor; `updateSettings` geçersiz saat aralığını reddediyor; Pomodoro aralık dışı değerleri reddediyor.

**Bu fazda YAPMA:** Ders, görev, rutin özellikleri.

**Kabul kontrolleri**
- [ ] Tema "Sistem"deyken işletim sistemi teması değişince uygulama da değişiyor.
- [ ] Ayarlar yenilemeden sonra korunuyor.
- [ ] Yedek al → tüm verileri sil → yedek yükle: ayarlar geri geliyor.
- [ ] Başka bir JSON (ör. `{"a":1}`) yüklenince anlaşılır hata mesajı çıkıyor, veri bozulmuyor.
- [ ] Modal Esc ile kapanıyor, odak geri dönüyor; telefonda alttan açılıyor.
- [ ] Tüm testler yeşil.

**Elle test:** Adını yaz, temayı değiştir, Pomodoro süresini 30 yap, yedek al, verileri sil, yedeği yükle.

---

## Faz 4 — Dersler ve Ders Programı

**Amaç:** Uygulamanın merkezindeki "ders" varlığı ve haftalık program. Görevler, notlar ve odak süreleri sonradan derslere bağlanacak.

**Dosyalar:** `js/store/actions/courses.js`, `js/store/actions/schedule.js`, `js/lib/time-slots.js`, `js/pages/schedule.js`, `css/pages/schedule.css`, `js/components/sidebar.js` (Derslerim bölümü), `tests/courses.test.js`, `tests/time-slots.test.js`.

**1. Ders action'ları:** `addCourse({ name, code, color, teacher, room })`, `updateCourse(id, partial)`, `deleteCourse(id)` (bölüm 4'teki ilişki kurallarıyla). Ad zorunlu, en fazla 60 karakter; aynı adda ders varsa uyarı. Renk verilmezse kullanılmayan ilk renk seçilir.

**2. Program action'ları:** `addScheduleEntry({ courseId, weekday, start, end, type, room })`, `updateScheduleEntry`, `deleteScheduleEntry`. Doğrulama: bitiş > başlangıç; en az 15 dk; **aynı gün çakışan blok varsa reddet** ve hangi dersle çakıştığını söyle.

**3. Boş zaman hesabı (`time-slots.js`)** — saf fonksiyonlar:
- `mergeBusy(blocks)` → `[{start, end}]` (dakika), çakışan/bitişik blokları birleştirir.
- `findFreeSlots({ dayStart, dayEnd, busy, minMinutes = 15 })` → `[{ start: 'HH:MM', end: 'HH:MM', minutes }]`.
- `totalFreeMinutes(...)`.
- Gün sınırının dışına taşan bloklar sınıra kırpılır.

Örnek (test olarak yazılacak): gün 08:00–23:00; meşguller 09:00–10:50, 13:00–14:50, 16:00–17:00 → boşluklar: 08:00–09:00 (60), 10:50–13:00 (130), 14:50–16:00 (70), 17:00–23:00 (360); toplam 620 dk.

**4. Ders Programı sayfası (`#/program`)**
- **Üst kısım:** "Derslerim" listesi — renkli kartlar (ad, kod, öğretmen, haftalık saat toplamı). "Ders ekle" butonu → modal (ad, kod, renk seçici: 8 renk dairesi, öğretmen, derslik). Karttaki menü: Düzenle, Sil (onayda: "3 ders saati, 5 görev bağlantısı, 2 not etkilenecek").
- **Haftalık ızgara:**
  - Sütunlar Pzt–Paz (`showWeekend` kapalıysa Pzt–Cum), satırlar `dayStart`–`dayEnd` arası saatler; 1 saat = 48 px.
  - Bloklar mutlak konumla yerleşir, ders rengiyle boyanır; içinde ders adı, saat aralığı, derslik.
  - Boş bir alana tıklayınca o gün ve o saatle (30 dk'ya yuvarlanmış) dolu "Ders saati ekle" modalı açılır. Bloğa tıklayınca düzenleme modalı (Sil butonu dahil).
  - Bugünün sütunu hafifçe vurgulu; şu anki saati gösteren yatay çizgi (dakikada bir güncellenir, sayfadan çıkınca zamanlayıcı temizlenir).
  - Hiç ders yoksa boş durum: "Önce bir ders ekle".
- **Izgaranın altında "Günlük boş zaman":** her gün için `findFreeSlots` sonucu: "Pazartesi — 6 sa 20 dk boş" ve küçük yatay çubuk (dolu/boş oranı).
- **Telefon:** ızgara yerine gün sekmeleri (Pzt … Paz) ve seçili günün derslerinin dikey listesi; bugün varsayılan seçili.

**5. Kenar çubuğu:** "Derslerim" bölümünde her ders renkli nokta + ad olarak listelenir, `#/ders/:id`'e gider. Ders sayfası Faz 10'da dolacak; şimdilik ders adını ve "Yakında" yazısını göstersin.

**Testler:** ders ekleme/silme ve ilişki temizliği; çakışma reddi; `mergeBusy`; `findFreeSlots` yukarıdaki örnek + hiç meşgul yok + tüm gün dolu + sınır dışına taşan blok.

**Bu fazda YAPMA:** Görevler, Bugün sayfası.

**Kabul kontrolleri**
- [ ] 4 ders ve 8 ders saati eklenebiliyor; ızgarada doğru gün ve saatte, doğru yükseklikte görünüyorlar.
- [ ] Çakışan saat eklenmek istenince anlaşılır hata çıkıyor.
- [ ] Ders silinince program blokları da kayboluyor.
- [ ] Gün saatleri Ayarlar'dan değişince ızgara ve boş zaman hesabı güncelleniyor.
- [ ] Telefonda gün sekmeleri çalışıyor.
- [ ] Tüm testler yeşil.

**Elle test:** Kendi gerçek ders programını gir. Boş zaman sayılarını elle hesapla ve karşılaştır.

---

## Faz 5 — Görevler

**Amaç:** Görev ekleme, düzenleme, tamamlama, silme. Bugün sayfasının ilk hali: bugünün görevleri ve gecikenler.

**Dosyalar:** `js/store/actions/tasks.js`, `js/store/selectors.js`, `js/components/task-item.js`, `js/components/task-form.js`, `js/pages/today.js`, `css/pages/today.css`, `tests/tasks.test.js`.

**1. Görev action'ları**
- `addTask(input)`, `updateTask(id, partial)`, `toggleTask(id)` (`done`, `doneAt`), `deleteTask(id)` (silinen görevi döndürür), `restoreTask(task)` (geri al için), `moveTaskToDate(id, dateKey)`, `reorderTasks(dateKey, idler)`.
- Doğrulama: başlık zorunlu, en fazla 200 karakter; `time` varsa `date` da olmalı; `estimateMin` 5–600.

**2. Seçiciler (`selectors.js`)**
- `getTasksForDate(state, key)` → sıralama: tamamlanmayanlar önce; saati olanlar saate göre; sonra `order`; tamamlananlar en altta.
- `getOverdueTasks(state, today)` → `date < today` ve `done === false`, en eskiden yeniye.
- `getUndatedTasks(state)` → tarihsiz, tamamlanmamış ("Bir ara" listesi).
- `getTasksByCourse(state, courseId)`.

**3. Görev formu (`task-form.js`)** — modal içinde:
- Başlık (otomatik odak), Notlar (textarea), Tarih (varsayılan: açıldığı sayfanın günü), Saat (isteğe bağlı), Tahmini süre (15/30/45/60/90/120 dk hızlı seçim + elle), Ders (seçim listesi, renk noktasıyla), Öncelik (Düşük/Orta/Yüksek üçlü düğme), Tarihsiz ("Bir ara") seçeneği.
- `openTaskForm({ task, defaults })` → hem ekleme hem düzenleme. Düzenlemede altta "Sil" butonu.
- Enter kaydeder (textarea hariç), Esc kapatır. Hata mesajları alanın altında.
- Hedef seçimi (`goalId`) Faz 8'de eklenecek.

**4. Görev satırı (`task-item.js`)**
- Yuvarlak onay kutusu, başlık, altında küçük satır: saat · ders rozeti (renkli) · tahmini süre · öncelik işareti (yüksek = kırmızı ünlem, orta = sarı; düşük gösterilmez).
- Tamamlanınca üstü çizili ve soluk; kısa bir onay animasyonu.
- Tıklayınca düzenleme formu; onay kutusu ayrı tıklanır.
- Silmede toast: "Görev silindi — Geri al".

**5. Bugün sayfası (ilk hali)**
- Başlık: selamlama ("Günaydın, Taha" — 05–12 Günaydın, 12–18 İyi günler, 18–23 İyi akşamlar, diğer İyi geceler; ad yoksa sadece selamlama) + uzun tarih.
- Üstte tek satırlık hızlı ekleme kutusu: yaz + Enter → bugüne görev ekler (ayrıştırma Faz 12'de gelecek, şimdilik sadece başlık).
- **Gecikenler** (varsa, uyarı renginde başlık): her satırda "Bugüne taşı" butonu, başlıkta "Tümünü bugüne taşı".
- **Bugün:** görev listesi + "Görev ekle" butonu. İlerleme: "5 görevden 2'si tamam" ve ince çubuk.
- **Bir ara:** tarihsiz görevler (katlanabilir bölüm).
- Boş durum: "Bugün için görev yok. Bir tane ekle ya da günün tadını çıkar."

**Testler:** ekleme doğrulamaları; toggle; silme + geri alma; geciken görev seçici (bugün = 2026-10-14 ile); sıralama kuralı.

**Bu fazda YAPMA:** Rutinler, Bugün'de ders ve boş zaman bölümü.

**Kabul kontrolleri**
- [ ] Görev ekle/düzenle/tamamla/sil çalışıyor, yenilemeden sonra korunuyor.
- [ ] Silinen görev "Geri al" ile aynı yerine geri geliyor.
- [ ] Dünün tarihli bir görev "Gecikenler"de çıkıyor, "Bugüne taşı" çalışıyor.
- [ ] Derse bağlı görevde renkli ders rozeti görünüyor; ders silinince rozet kayboluyor ama görev kalıyor.
- [ ] Başlığa `<b>deneme</b>` yazılınca HTML olarak değil metin olarak görünüyor.
- [ ] Tüm testler yeşil.

**Elle test:** 6–7 görev ekle (biri dün, biri tarihsiz, biri derse bağlı, biri saatli). Hepsini dene.

---

## Faz 6 — Rutinler

**Amaç:** Günlere göre tekrar eden alışkanlıklar ve seri takibi.

**Dosyalar:** `js/store/actions/routines.js`, `selectors.js` (rutin seçicileri), `js/pages/routines.js`, `css/pages/routines.css`, `tests/routines.test.js`.

**1. Rutin action'ları:** `addRoutine({ title, weekdays, time, durationMin, color })`, `updateRoutine`, `archiveRoutine` / `unarchiveRoutine`, `deleteRoutine`, `toggleRoutineDone(routineId, dateKey)`. Doğrulama: başlık zorunlu, en az bir gün seçili, süre 5–240 dk (varsayılan 30). Gelecek tarih için işaretleme yapılamaz.

**2. Seçiciler**
- `getRoutinesForDate(state, key)` → arşivlenmemiş, `weekdays` o günü içeren, `createdAt` tarihinden önce olmayan rutinler; her biri `{ ...rutin, done }` ile.
- `getRoutineStreak(state, routineId, today)` — **kural:**
  - Bugünden geriye doğru gidilir; sadece rutinin planlı olduğu günlere bakılır.
  - Bugün planlıysa ve henüz yapılmadıysa bugün **atlanır** (seriyi bozmaz).
  - Planlı bir gün yapılmamışsa sayım durur.
  - Rutinin oluşturulduğu günden öncesine gidilmez.
- `getRoutineBestStreak(state, routineId)`.
- `getRoutineCompletionRate(state, routineId, days = 30)` → son 30 günde planlı günlerin yüzde kaçı yapıldı.

**Seri test örnekleri** (bugün = 2026-10-14 Çarşamba; rutin Pzt-Çar-Cum, 2026-09-28'de oluşturuldu):
- Yapılanlar: 10-12 (Pzt), 10-09 (Cum), 10-07 (Çar) → seri **3** (bugün yapılmadı, atlanır).
- Aynısı + 10-14 yapıldı → seri **4**.
- Yapılanlar: 10-12, 10-07 (10-09 eksik) → seri **1**.
- Hiç yapılmamış → seri **0**.

**3. Rutinler sayfası**
- Üstte "Bugünün rutinleri": büyük onay kutuları ile hızlı işaretleme.
- Altta tüm rutinler kart olarak: başlık, günler (Pzt Sal Çar … küçük rozetler, seçililer dolu), saat, alev ikonu (SVG) + "5 gün seri", en iyi seri, son 30 gün oranı.
- Her kartta **son 4 haftanın mini takvimi** (7×4 küçük kare): yapıldı = dolu renk, planlı ama yapılmadı = çerçeve, planlı değil = soluk. Geçmiş bir kareye tıklayınca o günü işaretle/kaldır.
- "Rutin ekle" modalı: başlık, gün seçici (7 düğme + "Her gün" / "Hafta içi" kısayolları), saat (isteğe bağlı), süre, renk.
- Arşivlenenler katlanabilir bölümde.

**Bu fazda YAPMA:** Bugün sayfasına rutin ekleme (Faz 7).

**Kabul kontrolleri**
- [ ] Rutin eklenebiliyor; sadece seçili günlerde "Bugünün rutinleri"nde çıkıyor.
- [ ] Mini takvimde geçmiş günleri işaretleyince seri doğru güncelleniyor.
- [ ] Arşivlenen rutin bugünün listesinden kalkıyor, geçmişi korunuyor.
- [ ] Yukarıdaki 4 seri örneği testte geçiyor.

**Elle test:** "Spor — Pzt/Çar/Cum" rutini ekle, geçmiş günleri işaretleyerek seriyi 3 yap, sonra arada bir günü kaldır.

---

## Faz 7 — Bugün sayfası (tam hali) ve örnek veri

**Amaç:** Uygulamanın ana ekranı: görevler, rutinler, dersler ve boş zaman tek bakışta.

**Dosyalar:** `js/pages/today.js`, `css/pages/today.css`, `selectors.js` (`getDayAgenda`), `js/lib/sample-data.js`, `js/pages/settings.js` (örnek veri butonu), `tests/agenda.test.js`.

**1. `getDayAgenda(state, key)`** — saf fonksiyon, döndürür:
```js
{
  classes:   [...],  // o günün ders saatleri (weekday'e göre), saate göre sıralı, ders bilgisiyle
  tasks:     [...],  // getTasksForDate
  overdue:   [...],  // sadece key bugünse
  routines:  [...],  // getRoutinesForDate
  freeSlots: [...],  // findFreeSlots
  stats: { tasksDone, tasksTotal, routinesDone, routinesTotal, freeMinutes }
}
```
Boş zaman hesabında meşgul sayılanlar: ders saatleri + saati olan görevler (`estimateMin`, yoksa 30 dk) + saati olan rutinler (`durationMin`). Bugünse ve şu an gün içindeyse, geçmiş saatler hesaptan düşülür ("kalan boş zaman").

**2. Sayfa düzeni**
- **Üst şerit:** selamlama + tarih; sağda 3 küçük istatistik kartı: "Görevler 2/5", "Rutinler 1/3", "Kalan boş zaman 3 sa 40 dk".
- **Masaüstü iki sütun:**
  - Sol (geniş): Gecikenler → Bugünün görevleri → Bir ara.
  - Sağ (dar): **Günün akışı** — dikey zaman çizelgesi: ders blokları (ders rengi), saatli görevler, saatli rutinler ve aralarında kesik çizgili **boş zaman** blokları ("1 sa 10 dk boş — görev ekle" → tıklayınca o saatle dolu görev formu açılır). Şu anki saat çizgisi. Altında **Bugünün rutinleri** (onay kutuları).
- **Telefon:** tek sütun; sıra: istatistikler → gecikenler → görevler → rutinler → günün akışı.
- Bugün ders yoksa akışta "Bugün ders yok" yazar ama boş zaman yine gösterilir.

**3. Örnek veri (`sample-data.js`)**
- `createSampleData(todayKey)` → 4 ders (Matematik I, Fizik I, Programlamaya Giriş, İngilizce), 10 ders saati, 8 görev (biri dün → geciken, biri tarihsiz, ikisi saatli), 3 rutin, geçmiş 2 haftaya dağılmış rutin kayıtları.
- Ayarlar → Veri bölümüne "Örnek veri yükle" butonu: sadece hiç ders ve görev yokken aktif; değilse "Önce verileri sil" açıklaması.
- Sonraki fazlar bu dosyayı genişletir (hedefler, notlar, Pomodoro seansları).

**Testler:** `getDayAgenda` — örnek bir state ile ders/görev/rutin sayıları, boş zaman hesabına saatli görev ve rutinin dahil edildiği; tahmini süresi olmayan saatli görev 30 dk sayılıyor.

**Kabul kontrolleri**
- [ ] Örnek veri yüklenince Bugün sayfası dolu ve anlamlı görünüyor.
- [ ] Görev tamamlanınca üstteki istatistik anında güncelleniyor.
- [ ] Boş zaman bloğuna tıklayınca saat dolu görev formu açılıyor; eklenen görev akışta yerini alıyor ve boş zaman azalıyor.
- [ ] Telefon düzeni doğru sırada.
- [ ] Tüm testler yeşil.

**Elle test:** Verileri sil → örnek veri yükle → bir gün boyunca gerçekten kullan.

---

## Faz 8 — Planlayıcı (gün / ay / yıl) ve hedefler

**Amaç:** Zaman içinde gezinme ve aylık/yıllık hedefler.

**Dosyalar:** `js/store/actions/goals.js`, `selectors.js` (hedef ve ısı haritası seçicileri), `js/components/heatmap.js`, `js/pages/planner.js`, `css/pages/planner.css`, `js/components/task-form.js` (hedef seçimi), `tests/goals.test.js`, `tests/heatmap.test.js`.

**1. Adres:** `#/planlayici?view=gun|ay|yil&date=YYYY-MM-DD`. Varsayılan `view=ay`, `date=bugün`. Görünüm ve tarih değişince adres güncellenir (geri tuşu çalışsın).

**2. Üst araç çubuğu:** Gün | Ay | Yıl sekmeleri, ‹ › önceki/sonraki, "Bugün" butonu, ortada dönem adı ("Ekim 2026").

**3. Gün görünümü:** Bugün sayfasındaki `getDayAgenda` bileşenlerini yeniden kullanır (kopyalamadan, ortak render fonksiyonlarına ayır). Geçmiş günlerde rutin işaretlenebilir, gelecekte işaretlenemez.

**4. Ay görünümü:**
- Pazartesi başlangıçlı 6×7 takvim (`monthGrid`). Ay dışı günler soluk, bugün vurgulu.
- Her hücre: gün numarası, en fazla 3 görev başlığı (ders rengi noktasıyla, tamamlananlar üstü çizili), fazlası "+2 daha". Ders günleri küçük renkli çizgilerle.
- Hücreye tıklayınca gün görünümüne gider; hücredeki "+" butonu o güne görev ekler.
- **Görevi sürükleyip başka güne bırakma** (HTML5 drag & drop) → `moveTaskToDate`. Telefonda sürükleme yok, görev formundan tarih değişir.
- Telefonda hücrelerde başlık yerine sadece nokta sayısı; altta seçili günün listesi.
- Sağda (telefonda altta) **Bu ayın hedefleri** paneli.

**5. Yıl görünümü:**
- **Isı haritası (`heatmap.js`):** 53 sütun × 7 satır (satırlar Pzt → Paz), elle çizilmiş SVG. Üstte ay adları.
- Gün puanı: `tamamlanan görev + tamamlanan rutin + floor(odak dakikası / 25)`. Seviyeler: 0 → 0; 1–2 → 1; 3–4 → 2; 5–7 → 3; 8+ → 4. Renkler `--primary`'nin 5 tonu (tokens.css'e ekle).
- Kareye gelince ipucu: "14 Ekim: 3 görev, 2 rutin, 50 dk odak". Tıklayınca o günün gün görünümü.
- Altta yıl özeti: toplam tamamlanan görev, toplam odak süresi, en uzun aktif gün serisi, en verimli ay.
- Sağda **Bu yılın hedefleri** paneli + 12 ayın aylık hedef tamamlanma oranı (küçük çubuklar).

**6. Hedefler**
- Action'lar: `addGoal({ title, period, periodKey, courseId })`, `updateGoal`, `toggleGoal`, `deleteGoal`.
- Hedef kartı: onay kutusu, başlık, bağlı ders rozeti, bağlı görev ilerlemesi ("4/6 görev").
- Görev formuna **Hedef** seçimi eklenir: görevin tarihine göre o ayın ve yılın hedefleri listelenir.
- Seçici: `getGoalProgress(state, goalId)` → `{ done, total }` (bağlı görevler).

**Testler:** ısı haritası puan ve seviye hesabı (`getDayScore`, `scoreToLevel`); yılın ilk gününün doğru sütun/satıra düşmesi; hedef ilerlemesi; hedef silinince görevlerin `goalId`'si temizleniyor.

**Kabul kontrolleri**
- [ ] Üç görünüm arasında geçiş ve ileri/geri çalışıyor, adres güncelleniyor, sayfa yenilenince aynı görünüm açılıyor.
- [ ] Ay görünümünde görev sürüklenerek başka güne taşınabiliyor.
- [ ] Isı haritası örnek veride renkleniyor, ipuçları doğru.
- [ ] Aylık ve yıllık hedef eklenip tamamlanabiliyor; göreve bağlanan hedefin ilerlemesi doğru.
- [ ] Tüm testler yeşil.

**Elle test:** Geçen ayın bir gününe görev ekle ve tamamla, yıl görünümünde rengini gör. Bir hedefe 3 görev bağla, birini tamamla.

---

## Faz 9 — Ders Notları ve dosya ekleri

**Amaç:** Derse bağlı notlar ve PDF/resim ekleri.

**Dosyalar:** `js/lib/files-db.js`, `js/store/actions/course-notes.js`, `js/pages/course-notes.js`, `css/pages/course-notes.css`, `js/lib/backup.js` (ekleri dahil etme), `tests/course-notes.test.js`.

**1. `files-db.js` (IndexedDB)**
- Veritabanı `planlayici-files`, depo `attachments`, anahtar = ek id'si, değer = `Blob`.
- `putFile(id, blob)`, `getFile(id)`, `deleteFile(id)`, `listFileIds()`, `clearFiles()` — hepsi Promise döndürür.
- IndexedDB yoksa (gizli pencere vb.) ekler devre dışı kalır ve kullanıcıya açıklama gösterilir; notlar yine çalışır.

**2. Not action'ları:** `addCourseNote({ courseId, title })` → boş not oluşturur ve döndürür; `updateCourseNote(id, { title, body })` (`updatedAt` güncellenir); `deleteCourseNote(id)` (eklerini de IndexedDB'den siler); `addAttachment(noteId, file)` ve `removeAttachment(noteId, attachmentId)` — önce IndexedDB'ye yazar, sonra store'a meta veriyi ekler.
- Ek kuralları: sadece `application/pdf`, `image/png`, `image/jpeg`, `image/webp`, `image/gif`; dosya başı en fazla 10 MB; not başı en fazla 10 ek. Aşılırsa anlaşılır hata.

**3. Ders Notları sayfası (`#/ders-notlari?ders=<id>&not=<id>`)**
- **Masaüstü 3 sütun:** (1) ders filtresi listesi ("Tümü" + dersler, not sayılarıyla), (2) not listesi (başlık, ilk satırdan önizleme, güncellenme tarihi, ek ikonu; üstte arama kutusu ve "Yeni not"), (3) editör.
- **Editör:** başlık input'u, gövde için büyük textarea (düz metin; satır sonları korunur), ders seçimi, "Kaydedildi / Kaydediliyor…" durumu. Yazarken **500 ms gecikmeli otomatik kayıt**. Editör bölümü store değişiminde yeniden çizilmez (imleç kaybolmasın), sadece listeler çizilir.
- **Ekler:** "Dosya ekle" butonu + editöre sürükle-bırak. Ekler küçük kartlar: resimse küçük önizleme, PDF ise ikon + ad + boyut. Tıklayınca `URL.createObjectURL` ile yeni sekmede açılır (URL'ler sayfadan çıkınca `revokeObjectURL` ile temizlenir). Sil butonu (onaylı).
- **Telefon:** önce not listesi (üstte ders filtresi açılır menü), nota dokununca tam ekran editör, "‹ Geri" butonu.
- Boş durum: "Bu ders için not yok."

**4. Yedekleme güncellemesi:** `createBackup` artık ekleri `files: [{ id, name, type, dataBase64 }]` olarak ekler; yüklemede IndexedDB'ye geri yazılır. Yedek alırken toplam boyut gösterilir ("Yedek 14,2 MB"). Ayarlar'a "Ekleri yedeğe dahil et" seçeneği (varsayılan açık).

**5. Örnek veri:** Her derse 1–2 not (eksiz).

**Testler:** not ekleme/güncelleme/silme; dosya türü ve boyut doğrulama fonksiyonu (`validateAttachment`); ders silinince notların silinmesi; yedekte `files` alanının biçimi (base64 dönüşümü için küçük bir Blob ile).

**Kabul kontrolleri**
- [ ] Not yazınca otomatik kaydediliyor, yenileyince yerinde.
- [ ] PDF ve resim eklenip açılabiliyor; 10 MB üstü dosya reddediliyor.
- [ ] Yedek al → verileri sil → yedek yükle: notlar ve ekler geri geliyor.
- [ ] Arama Türkçe karakterden bağımsız çalışıyor ("odev" → "Ödev").
- [ ] Tüm testler yeşil.

**Elle test:** Bir derse ders notu yaz, bir PDF ve bir fotoğraf ekle. Yedekle-sil-yükle döngüsünü dene.

---

## Faz 10 — Ders sayfası

**Amaç:** Bir derse tıklayınca ona ait her şey tek sayfada.

**Dosyalar:** `js/pages/course.js`, `css/pages/course.css`, `selectors.js` (`getCourseOverview`), `tests/course-overview.test.js`.

**1. `getCourseOverview(state, courseId, today)`** → `{ course, scheduleEntries, weeklyMinutes, openTasks, doneTasks, overdueTasks, notes (son 5), goals, focus: { totalMin, thisWeekMin, last7Days: [{ key, minutes }] }, nextClass }`.
- Odak süresi: `courseId`'si bu ders olan seanslar **ve** `taskId`'si bu dersin bir görevine bağlı olan seanslar (aynı seans iki kez sayılmaz).
- `nextClass`: bugünden itibaren bu dersin bir sonraki saati ("Yarın 09:00, B-204").

**2. Sayfa düzeni (`#/ders/:id`)**
- **Başlık bandı** ders renginde: ad, kod, öğretmen, derslik; sağda "Düzenle" ve "…" menüsü (Sil). Altında "Sıradaki ders: Yarın 09:00".
- **4 istatistik kartı:** Haftalık ders saati, Açık görev, Bu hafta odak, Toplam odak.
- **Görevler:** gecikenler + açıklar (tarihe göre) + "Tamamlananları göster" anahtarı; "Bu derse görev ekle" (ders önceden seçili form).
- **Haftalık saatler:** küçük liste (Pzt 09:00–10:50 B-204 …), "Programda göster" bağlantısı.
- **Notlar:** son 5 not, "Tüm notlar" → `#/ders-notlari?ders=<id>`, "Yeni not".
- **Hedefler:** bu derse bağlı hedefler.
- **Odak:** son 7 günün küçük çubuk grafiği (Faz 11'deki `bar-chart.js` henüz yoksa basit bir SVG çubuk bileşeni bu fazda yazılır ve Faz 11'de yeniden kullanılır).
- "Bu dersle Pomodoro başlat" butonu → `#/pomodoro?ders=<id>` (Faz 11'de çalışacak).
- Ders bulunamazsa: "Bu ders silinmiş olabilir" + Ders Programı'na bağlantı.

**Kabul kontrolleri**
- [ ] Kenar çubuğundan bir derse gidince tüm bölümler doğru verilerle doluyor.
- [ ] Bu sayfadan eklenen görev ve not doğrudan bu derse bağlı oluşuyor.
- [ ] Silinmiş bir dersin adresine gidince çökmeden açıklama çıkıyor.
- [ ] Tüm testler yeşil.

**Elle test:** Örnek verideki Fizik I sayfasını aç, oradan görev ve not ekle, başka sayfalarda göründüğünü kontrol et.

---

## Faz 11 — Pomodoro

**Amaç:** Göreve veya derse bağlı odak seansları, bildirim ve istatistik.

**Dosyalar:** `js/lib/timer.js`, `js/store/actions/pomodoro.js`, `js/components/bar-chart.js`, `js/pages/pomodoro.js`, `css/pages/pomodoro.css`, `js/components/topbar.js` (mini sayaç), `tests/timer.test.js`, `tests/pomodoro.test.js`.

**1. Zamanlayıcı (`timer.js`)** — sayfadan bağımsız tek bir modül (sayfa değişse de çalışır):
- Durum: `{ mode: 'focus'|'short'|'long', running, endsAt (ms) | null, remainingMs, startedAt, taskId, courseId, completedFocusCount }`.
- **Süre `setInterval` sayarak değil, `endsAt - Date.now()` ile hesaplanır** (sekme arka planda kalınca kayma olmasın). Arayüz 250 ms'de bir güncellenir.
- Durum her değişimde `localStorage['planlayici-timer']`'a yazılır; sayfa yenilense de kaldığı yerden devam eder. Kapalıyken süre dolduysa açılışta seans tamamlanmış sayılır.
- Olaylar: `onTick`, `onFinish(mode)`. Fonksiyonlar: `start()`, `pause()`, `resume()`, `reset()`, `skip()`, `finishEarly()`, `setMode(mode)`, `setTarget({ taskId, courseId })`.
- **Odak bitince:** seans store'a kaydedilir (`addPomodoroSession`), sayaç artar, `longBreakEvery`'ye göre kısa/uzun molaya geçilir; `autoStartNext` açıksa otomatik başlar.
- **Erken bitir:** odakta en az 5 dk geçtiyse geçen süre seans olarak kaydedilir; azsa kaydedilmez ve kullanıcıya söylenir.
- Saf yardımcılar (test edilir): `nextMode(mode, completedFocusCount, longBreakEvery)`, `remainingFrom(endsAt, now)`, `formatClock(ms)` → `"24:59"`.

**2. Bildirim ve ses**
- Süre bitince: izin varsa `new Notification('Odak bitti', { body: 'Fizik ödevi · 25 dk. Mola zamanı.' })`; yoksa sadece toast.
- Ses: dosya yok, **Web Audio API** ile kısa iki tonlu "bip" (ayarlarda `sound` kapalıysa çalmaz).
- Çalışırken sekme başlığı: `"12:34 · Odak · Planlayıcı"`.

**3. Pomodoro sayfası (`#/pomodoro?gorev=<id>&ders=<id>`)**
- Ortada büyük **dairesel sayaç** (SVG halka, kalan süre oranıyla dolar), içinde `24:59` ve mod adı.
- Üstte mod sekmeleri: Odak / Kısa mola / Uzun mola.
- Butonlar: Başlat / Duraklat / Devam, Sıfırla, Atla, Erken bitir.
- "Ne üzerinde çalışıyorsun?" seçimi: bugünün açık görevleri + "Sadece ders seç" + "Hiçbiri". Adresteki `gorev`/`ders` parametresi önceden seçer. Görev seçilince dersi otomatik dolar.
- Seçili görev için "Görevi tamamla" butonu.
- Bugünün sayaçları: "Bugün 4 seans · 1 sa 40 dk" ve 4'lük döngüyü gösteren noktalar.
- **Haftalık grafik (`bar-chart.js`):** bu haftanın Pzt–Paz günlük odak dakikaları, elle çizilmiş SVG çubuklar, bugün vurgulu, çubuğun üstünde değer; ‹ › ile önceki haftalar.
- **Ders dağılımı:** bu hafta derslere göre odak süresi (yatay çubuk listesi, ders renkleriyle).
- **Son seanslar:** tarih, saat, süre, görev/ders; silme butonu (yanlış kayıt için).

**4. Üst çubukta mini sayaç:** zamanlayıcı çalışırken başka sayfalarda üst çubukta `● 12:34` görünür, tıklayınca Pomodoro sayfasına gider.

**5. Diğer bağlantılar:** Görev satırının menüsüne "Pomodoro başlat" eklenir. Ders sayfasındaki buton çalışır hale gelir. Örnek veriye son 2 haftaya dağılmış seanslar eklenir.

**Testler:** `nextMode` (4. odaktan sonra uzun mola); `remainingFrom`; `formatClock`; seans kaydı; haftalık özet seçicisi (`getWeeklyFocus(state, weekStartKey)`); ders dağılımı; ders odak toplamında çift sayım olmaması.

**Kabul kontrolleri**
- [ ] Odak seansı başlatılıp başka sayfaya gidilince üstte mini sayaç devam ediyor.
- [ ] Sayfa yenilenince sayaç kaldığı yerden devam ediyor.
- [ ] Süre bitince bildirim/toast ve ses geliyor, seans kaydediliyor, molaya geçiliyor.
- [ ] Haftalık grafik ve ders dağılımı seanslarla tutarlı; yıl ısı haritası da odak dakikalarını yansıtıyor.
- [ ] Tüm testler yeşil.

**Elle test:** Ayarlar'dan odak süresini geçici olarak 1 dk yap, bir göreve bağlı seans tamamla, bildirimi gör, grafiklerde ve ders sayfasında süreyi kontrol et. Sonra 25'e geri al.

---

## Faz 12 — Hızlı Notlar ve Komut paleti

**Amaç:** Her yerden hızlı not (N) ve her yerden komut/arama (Ctrl + K).

**Dosyalar:** `js/store/actions/quick-notes.js`, `js/components/quick-note.js`, `js/pages/quick-notes.js`, `css/pages/quick-notes.css`, `js/lib/task-parser.js`, `js/components/command-palette.js`, `js/lib/shortcuts.js`, `tests/task-parser.test.js`, `tests/quick-notes.test.js`, `tests/search.test.js`.

**1. Klavye kısayolları (`shortcuts.js`)**
- Kısayollar, odak bir `input`, `textarea`, `select` veya `contenteditable` içindeyken **çalışmaz** (Ctrl+K hariç).
- `N` → hızlı not penceresi. `Ctrl+K` / `Cmd+K` → komut paleti. `Esc` → açık pencereyi kapatır.
- Ayarlar'a "Klavye kısayolları" listesi eklenir.

**2. Hızlı not**
- Küçük modal: tek textarea, yer tutucu "Aklındakini yaz…". `Enter` kaydeder, `Shift+Enter` yeni satır, `Esc` kapatır. Kaydedince toast: "Not alındı".
- Üst çubuktaki hızlı not butonu da aynı pencereyi açar.
- Action'lar: `addQuickNote(text)`, `updateQuickNote`, `deleteQuickNote`, `markConverted(id, { type, id })`.

**3. Hızlı Notlar sayfası**
- En yeni üstte liste; her not: metin (satır sonları korunur), "3 saat önce" gibi göreli zaman.
- Her notun eylemleri:
  - **Göreve çevir** → görev formu açılır: ilk satır başlık, kalan satırlar notlar; kaydedilince not "dönüştürüldü" olur.
  - **Hedefe çevir** → hedef formu (bu ay / bu yıl seçimi).
  - **Ders notuna çevir** → ders seç → yeni ders notu (ilk satır başlık, tamamı gövde) → isteğe bağlı o nota git.
  - Düzenle, Sil.
- Dönüştürülen notlar listeden gizlenir; "Dönüştürülenleri göster" anahtarıyla soluk olarak ve oluşturulan öğeye bağlantıyla görünür.
- Üstte büyük yazma kutusu (sayfadayken de hızlı ekleme). Boş durum: "N tuşuna basarak her yerden not alabilirsin."

**4. Tek satırlık görev ayrıştırıcı (`task-parser.js`)** — `parseTaskInput(metin, { today, courses })` → `{ title, date, time, courseId, priority }`. Kurallar:
- `bugün`, `yarın`, `öbür gün` → tarih.
- Gün adı (`pazartesi` … `pazar`, kısaltmalar `pzt sal çar per cum cmt paz`) → **bugün dahil** ilk gelen o gün.
- `15.10`, `15/10`, `15.10.2026` → tarih; yıl yazılmamış ve tarih geçmişse gelecek yıl.
- `14:00`, `9:30` → saat (sadece iki nokta üst üste ile; `14.30` tarih sayılmaz, olduğu gibi başlıkta kalır).
- `#kelime` → adı veya kodu bu kelimeyle başlayan ilk ders (Türkçe normalize ederek); bulunamazsa `#kelime` başlıkta kalır.
- `!yüksek` `!orta` `!düşük` (ya da `!1` `!2` `!3`, `!!` = yüksek) → öncelik.
- Tarih verilmezse `today`. Kalan kelimeler (tek boşlukla birleşik) başlık. Başlık boş kalırsa hata.

**Test örnekleri** (today = `2026-10-14` Çarşamba; dersler: Fizik I, Matematik I (kod MAT101)):

| Girdi | Beklenen |
|---|---|
| `Fizik ödevi yarın 14:00 #fiz !yüksek` | başlık "Fizik ödevi", 2026-10-15, 14:00, Fizik I, high |
| `Kitap oku` | başlık "Kitap oku", 2026-10-14, saat yok, ders yok, medium |
| `Lab raporu cuma` | 2026-10-16 |
| `Sunum hazırla çarşamba` | 2026-10-14 (bugün dahil) |
| `Spor pzt 07:30 !düşük` | 2026-10-19, 07:30, low |
| `Proje teslimi 20.10` | 2026-10-20 |
| `Kayıt yenile 05.01` | 2027-01-05 (tarih geçmiş → gelecek yıl) |
| `Quiz #mat101 öbür gün` | 2026-10-16, Matematik I |
| `Ödev #kimya` | başlık "Ödev #kimya", ders yok |
| `yarın 10:00` | hata: başlık boş |

**5. Komut paleti (`command-palette.js`)**
- Ekranın üst ortasında açılan pencere; büyük arama kutusu; altında gruplanmış sonuçlar; ↑ ↓ ile gezinme, Enter ile seçme, Esc ile kapatma; fareyle de çalışır.
- Boşken: son ziyaret edilen sayfalar + sık komutlar.
- **Gruplar:**
  - *Sayfalar:* tüm sayfalar ("Bugün", "Ders Programı" …).
  - *Komutlar:* "Görev ekle", "Hızlı not al", "Tema değiştir", "Pomodoro başlat", "Yedek al", "Örnek veri yükle".
  - *Dersler:* ad/koda göre → ders sayfası.
  - *Görevler:* başlık ve notlarda arama → görev formu açılır.
  - *Notlar:* ders notları (başlık + gövde) ve hızlı notlar → ilgili sayfa.
- Her grup en fazla 5 sonuç; eşleşen kısım `<mark>` ile vurgulanır (vurgulama da kaçışlı yapılır).
- **Görev ekleme modu:** metin `+` ile başlıyorsa (ya da "Görev ekle" komutu seçilince) ayrıştırıcı çalışır ve canlı önizleme gösterilir: `Fizik ödevi · 15 Eki Perşembe 14:00 · Fizik I · Yüksek`. Enter → görev eklenir, toast "Görev eklendi — Aç".
- Bugün sayfasındaki tek satırlık ekleme kutusu da artık aynı ayrıştırıcıyı kullanır ve aynı önizlemeyi gösterir.

**Kabul kontrolleri**
- [ ] Herhangi bir sayfada N → hızlı not; input'a yazarken N harfi pencere açmıyor.
- [ ] Hızlı not göreve, hedefe ve ders notuna çevrilebiliyor.
- [ ] Ctrl+K her sayfada açılıyor; klavyeyle sayfa, ders, görev, not bulunup açılıyor.
- [ ] `+Fizik ödevi yarın 14:00 #fiz !yüksek` ile görev doğru ekleniyor.
- [ ] Parser tablosundaki tüm örnekler testte geçiyor.
- [ ] Tüm testler yeşil.

**Elle test:** Bir gün boyunca görevleri sadece Ctrl+K ile ekle. Aklına gelenleri N ile not al, akşam bunları dönüştür.

---

## Faz 13 — Cila ve yayına hazırlık

**Amaç:** Uygulamanın her gün kullanılacak kadar sağlam ve düzgün olması; telefona "ana ekrana ekle".

**1. Gözden geçirme turu** (ajan her sayfa için kontrol eder ve bulduklarını ILERLEME.md'ye liste olarak yazar, sonra düzeltir):
- Her sayfanın boş durumu var ve yönlendirici.
- Her liste 200+ öğeyle akıcı (örnek veriyi 10 katına çıkaran geçici bir test fonksiyonu ile dene).
- 360 px, 768 px, 1280 px genişliklerde taşma yok.
- Koyu temada okunmayan metin yok (metin/zemin kontrastı en az 4.5:1).
- Klavye ile tüm akışlar yapılabiliyor; modallar odağı içinde tutuyor.
- Tüm ikon butonlarında `aria-label` var.
- Uzun metinler (100 karakterlik görev başlığı, uzun ders adı) düzeni bozmuyor (`text-overflow: ellipsis` / satır kaydırma).
- Konsolda hata veya uyarı yok.

**2. PWA (telefona ana ekrana ekle)**
- `manifest.webmanifest`: ad "Planlayıcı", kısa ad, `start_url: "./#/bugun"`, `display: "standalone"`, tema ve arka plan rengi, ikonlar (`assets/icons/` içinde 192 ve 512 px PNG + maskable; basit bir logo SVG'den üretilir).
- `sw.js`: uygulama dosyalarını önbelleğe alan service worker (önce önbellek, sonra ağ); sürüm sabiti (`CACHE_VERSION`) değişince eski önbelleği siler. İnternet yokken uygulama açılır.
- `index.html`'e manifest bağlantısı, `theme-color`, iOS için `apple-touch-icon`.
- Yeni sürüm yüklendiğinde toast: "Yeni sürüm hazır — Yenile".

**3. Son eklemeler**
- Ayarlar'a "Hakkında" kartı: sürüm numarası (`js/version.js`), veri boyutu (localStorage + IndexedDB yaklaşık), son yedek tarihi. Son yedek 7 günden eskiyse Bugün sayfasında küçük hatırlatma: "En son 9 gün önce yedek aldın."
- README.md güncellenir: özellikler, kısayollar, çalıştırma, telefona kurma, yedekleme.

**Kabul kontrolleri**
- [ ] Gözden geçirme listesindeki her madde işaretli.
- [ ] Telefonda (aynı Wi-Fi'de bilgisayarın IP adresiyle ya da yayınladıktan sonra) "Ana ekrana ekle" çalışıyor, uygulama tam ekran açılıyor.
- [ ] İnternet kapalıyken uygulama açılıyor.
- [ ] Tüm testler yeşil.

**Not:** Service worker ve "ana ekrana ekle" sadece `https` veya `localhost` üzerinde çalışır. Ücretsiz yayınlamak için GitHub Pages kullanılabilir (depo → Settings → Pages → main dalı).

---

## Faz 14+ — Opsiyonel geliştirmeler

Ana plan bittikten sonra, aynı kurallarla ayrı fazlar olarak:

**14 — Son tarih ve hatırlatıcı**
- Görevlere `dueDate` (teslim tarihi, `date`'ten ayrı: "ne zaman yapacağım" vs "ne zaman teslim") ve `reminderAt` alanları; `SCHEMA_VERSION` 2'ye çıkar, migration yazılır.
- Teslim tarihi yaklaşan görevler Bugün'de "Yaklaşan teslimler" bölümünde (3 gün içinde).
- Hatırlatıcı: uygulama açıkken dakikada bir kontrol edilip bildirim gösterilir (sekme kapalıyken çalışmayacağı açıkça yazılır).

**15 — Sınav takvimi**
- `exams` koleksiyonu: `{ id, courseId, title, date, time, room, type: 'vize'|'final'|'quiz'|'bütünleme', notes }`.
- Planlayıcı ay görünümünde sınav günleri özel işaretle; Bugün'de "Sınava 5 gün" geri sayımı; ders sayfasında sınavlar bölümü.
- "Sınav için çalışma planı oluştur": sınava kadar kalan günlerin boş zamanlarına eşit dağılmış çalışma görevleri öner (kullanıcı onaylamadan eklenmez).

**16 — Senkronizasyona hazırlık**
- Store'a `updatedAt` / silinen kayıtlar için `deletedIds` eklenmesi; servis seçimi (Supabase / Firebase) kararı verildikten sonra planlanır.

---

## Ek A — Her faz sonu kontrol listesi (Taha için)

- [ ] Ajan sadece o fazın dosyalarını mı değiştirdi? (`git status` ile bak)
- [ ] `tests/tests.html` tamamen yeşil mi?
- [ ] Önceki fazların özellikleri hâlâ çalışıyor mu? (Bugün sayfası, görev ekleme, tema, yedek)
- [ ] Telefon görünümünde bozulma var mı?
- [ ] Konsolda kırmızı hata var mı?
- [ ] ILERLEME.md güncellendi mi?
- [ ] Commit atıldı mı?

## Ek B — Ajan hata yaptığında kullanılacak promptlar

**Bir şey bozulduysa:**
```
Faz N'den sonra şu çalışmıyor: <ne yaptım, ne bekledim, ne oldu>. Konsoldaki hata: <hata>.
Önce sebebini bul ve açıkla, sonra en küçük değişiklikle düzelt. Başka bir şeye dokunma.
Düzeltmeyi gösteren bir test ekle.
```

**Kurallara uymadıysa:**
```
PLAN.md'deki "2. Değişmez kurallar" bölümünü tekrar oku. Son değişikliklerinde şu kural
çiğnenmiş: <kural>. Bu fazda yazdığın tüm dosyaları bu kurala göre düzelt.
```

**Faz çok büyük geldiyse:**
```
Faz N'yi iki parçaya böl. Önce sadece <ilk yarı: ör. action'lar, seçiciler ve testler> kısmını yap,
arayüze dokunma. Bitince dur ve bana göster.
```
