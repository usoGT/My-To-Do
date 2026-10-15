// My to do masaüstü uygulaması (Mac / Windows / Linux) — Electron ana süreci.
// Uygulama dosyaları www/ klasöründen app://planlayici/ adresiyle sunulur (JS modülleri file:// ile çalışmadığı için).
const { app, BrowserWindow, protocol, shell, Menu, nativeTheme, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { resolveAppPath, mimeFor } = require('./serve.cjs');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const START_URL = 'app://planlayici/index.html';
const isMac = process.platform === 'darwin';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

// Windows bildirimlerinde uygulama adı doğru görünsün
if (process.platform === 'win32') app.setAppUserModelId('com.planlayici.app');

// Tek pencere: ikinci kez açılırsa mevcut pencere öne gelir
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

// ---------- Pencere boyutunu hatırla ----------
const statePath = () => path.join(app.getPath('userData'), 'pencere.json');
function loadWindowState() {
  try {
    const s = JSON.parse(fs.readFileSync(statePath(), 'utf8'));
    const visible = screen.getAllDisplays().some((d) => {
      const b = d.workArea;
      return s.x >= b.x - 50 && s.y >= b.y - 50 && s.x < b.x + b.width && s.y < b.y + b.height;
    });
    return visible ? s : { width: s.width, height: s.height };
  } catch {
    return { width: 1280, height: 860 };
  }
}
function saveWindowState(win) {
  if (win.isMinimized() || win.isFullScreen()) return;
  try {
    fs.writeFileSync(statePath(), JSON.stringify({ ...win.getNormalBounds(), maximized: win.isMaximized() }));
  } catch { /* yok say */ }
}

let mainWindow = null;

function createWindow() {
  const st = loadWindowState();
  mainWindow = new BrowserWindow({
    width: st.width || 1280,
    height: st.height || 860,
    x: st.x,
    y: st.y,
    minWidth: 380,
    minHeight: 560,
    title: 'My to do',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0F1115' : '#F6F6F3',
    icon: path.join(ROOT, 'build', 'icon.png'),
    show: false,
    autoHideMenuBar: !isMac,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });
  if (st.maximized) mainWindow.maximize();
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', () => saveWindowState(mainWindow));
  mainWindow.on('closed', () => { mainWindow = null; });

  const wc = mainWindow.webContents;
  wc.session.setSpellCheckerLanguages(['tr', 'en-US']);
  // Ekler (blob:) yeni pencerede açılır; web bağlantıları varsayılan tarayıcıda
  wc.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('blob:app://')) {
      return { action: 'allow', overrideBrowserWindowOptions: { width: 900, height: 1000, autoHideMenuBar: true, title: 'Ek' } };
    }
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  wc.on('will-navigate', (e, url) => {
    if (url.startsWith('app://planlayici/')) return;
    e.preventDefault();
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
  });

  mainWindow.loadURL(START_URL);
}

function buildMenu() {
  const template = [
    ...(isMac ? [{
      label: 'My to do',
      submenu: [
        { role: 'about', label: 'My to do Hakkında' },
        { type: 'separator' },
        { role: 'hide', label: 'My to do\'yu Gizle' },
        { role: 'hideOthers', label: 'Diğerlerini Gizle' },
        { role: 'unhide', label: 'Tümünü Göster' },
        { type: 'separator' },
        { role: 'quit', label: 'My to do\'dan Çık' },
      ],
    }] : [{
      label: 'Dosya',
      submenu: [{ role: 'quit', label: 'Çık' }],
    }]),
    {
      label: 'Düzen',
      submenu: [
        { role: 'undo', label: 'Geri Al' },
        { role: 'redo', label: 'Yinele' },
        { type: 'separator' },
        { role: 'cut', label: 'Kes' },
        { role: 'copy', label: 'Kopyala' },
        { role: 'paste', label: 'Yapıştır' },
        { role: 'selectAll', label: 'Tümünü Seç' },
      ],
    },
    {
      label: 'Görünüm',
      submenu: [
        { role: 'reload', label: 'Yeniden Yükle' },
        { role: 'toggleDevTools', label: 'Geliştirici Araçları' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Gerçek Boyut' },
        { role: 'zoomIn', label: 'Yakınlaştır' },
        { role: 'zoomOut', label: 'Uzaklaştır' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tam Ekran' },
      ],
    },
    {
      label: 'Pencere',
      submenu: [
        { role: 'minimize', label: 'Küçült' },
        ...(isMac ? [{ role: 'zoom', label: 'Büyüt' }, { role: 'front', label: 'Tümünü Öne Getir' }] : [{ role: 'close', label: 'Kapat' }]),
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(() => {
  protocol.handle('app', async (request) => {
    const file = resolveAppPath(WWW, request.url);
    if (!file) return new Response('Bulunamadı', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    const data = await fs.promises.readFile(file);
    return new Response(data, { headers: { 'content-type': mimeFor(file), 'cache-control': 'no-cache' } });
  });
  app.setAboutPanelOptions({ applicationName: 'My to do', applicationVersion: app.getVersion(), copyright: 'Öğrenciler için görev ve ders planlayıcısı' });
  buildMenu();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});
