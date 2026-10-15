// Service worker: uygulama dosyalarını önbelleğe alır, internet yokken de açılmasını sağlar.
// Strateji: önce ağ (her zaman en güncel dosyalar; geliştirirken eski kod görmezsin), ağ yoksa önbellek.
// Yeni sürüm yayınlarken CACHE_VERSION'ı ve js/version.js'i birlikte artır.
const CACHE_VERSION = 'planlayici-v1.3.0';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-32.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/icon.svg',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/pages/course-notes.css',
  './css/pages/course.css',
  './css/pages/planner.css',
  './css/pages/pomodoro.css',
  './css/pages/quick-notes.css',
  './css/pages/reports.css',
  './css/pages/routines.css',
  './css/pages/schedule.css',
  './css/pages/settings.css',
  './css/pages/today.css',
  './css/tokens.css',
  './js/app.js',
  './js/components/bar-chart.js',
  './js/components/command-palette.js',
  './js/components/confirm.js',
  './js/components/course-form.js',
  './js/components/day-agenda.js',
  './js/components/empty-state.js',
  './js/components/exams.js',
  './js/components/form.js',
  './js/components/goals.js',
  './js/components/heatmap.js',
  './js/components/modal.js',
  './js/components/quick-add.js',
  './js/components/quick-note.js',
  './js/components/report-charts.js',
  './js/components/routine-check.js',
  './js/components/routine-form.js',
  './js/components/schedule-form.js',
  './js/components/sidebar.js',
  './js/components/task-form.js',
  './js/components/task-item.js',
  './js/components/toast.js',
  './js/components/topbar.js',
  './js/config.js',
  './js/lib/alerts.js',
  './js/lib/attachments.js',
  './js/lib/backup-files.js',
  './js/lib/backup-run.js',
  './js/lib/backup.js',
  './js/lib/dates.js',
  './js/lib/dom.js',
  './js/lib/errors.js',
  './js/lib/files-db.js',
  './js/lib/global-actions.js',
  './js/lib/icons.js',
  './js/lib/ids.js',
  './js/lib/native.js',
  './js/lib/platform.js',
  './js/lib/sample-data.js',
  './js/lib/save-file.js',
  './js/lib/shortcuts.js',
  './js/lib/supabase.js',
  './js/lib/sync-core.js',
  './js/lib/sync.js',
  './js/lib/task-parser.js',
  './js/lib/text.js',
  './js/lib/theme.js',
  './js/lib/time-slots.js',
  './js/lib/timer.js',
  './js/pages/account.js',
  './js/pages/course-notes.js',
  './js/pages/course.js',
  './js/pages/not-found.js',
  './js/pages/planner.js',
  './js/pages/pomodoro.js',
  './js/pages/quick-notes.js',
  './js/pages/reports.js',
  './js/pages/routines.js',
  './js/pages/schedule.js',
  './js/pages/settings.js',
  './js/pages/today.js',
  './js/router.js',
  './js/store/actions/course-notes.js',
  './js/store/actions/courses.js',
  './js/store/actions/exams.js',
  './js/store/actions/goals.js',
  './js/store/actions/pomodoro.js',
  './js/store/actions/quick-notes.js',
  './js/store/actions/routines.js',
  './js/store/actions/schedule.js',
  './js/store/actions/settings.js',
  './js/store/actions/tasks.js',
  './js/store/report.js',
  './js/store/schema.js',
  './js/store/selectors.js',
  './js/store/store.js',
  './js/version.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))),
  );
});
