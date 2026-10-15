// Uygulamanın nerede çalıştığını söyler: tarayıcı, iPhone/Android (Capacitor) ya da Mac/Windows (Electron).
const cap = typeof window !== 'undefined' ? window.Capacitor : null;

export const isCapacitor = Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
export const nativePlatform = isCapacitor ? cap.getPlatform() : null; // 'ios' | 'android'
export const isIOS = nativePlatform === 'ios';
export const isAndroid = nativePlatform === 'android';
export const isElectron = typeof window !== 'undefined' && Boolean(window.planlayiciDesktop);
export const desktopOS = isElectron ? window.planlayiciDesktop.platform : null; // 'darwin' | 'win32' | 'linux'
export const isNative = isCapacitor || isElectron;

const cache = new Map();
// Capacitor eklentisine erişim (npm paketini içe aktarmadan, yerel köprü üzerinden)
export function plugin(name) {
  if (!isCapacitor) return null;
  if (!cache.has(name)) {
    let p = null;
    try { p = typeof cap.registerPlugin === 'function' ? cap.registerPlugin(name) : (cap.Plugins || {})[name] || null; } catch { p = null; }
    cache.set(name, p);
  }
  return cache.get(name);
}

if (typeof document !== 'undefined') {
  document.documentElement.dataset.platform = isCapacitor ? nativePlatform : isElectron ? `desktop-${desktopOS}` : 'web';
}
