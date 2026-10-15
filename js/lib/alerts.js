// Süre bitince ses (Web Audio, dosya yok) ve tarayıcı bildirimi.
import { isCapacitor } from './platform.js';
import { nativeNotify } from './native.js';
let ctx = null;

export function playBeep() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    [0, 0.28].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 0 ? 880 : 660;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.26);
    });
  } catch { /* ses çalınamadı */ }
}

// Kullanıcı bir tıklamayla sesi "açtığında" çağrılır (tarayıcı kısıtı).
export function unlockAudio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* yok say */ }
}

export function notify(title, body) {
  if (isCapacitor) { nativeNotify(title, body); return true; }
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  try {
    const n = new Notification(title, { body, tag: 'planlayici-pomodoro' });
    n.onclick = () => { window.focus(); location.hash = '#/pomodoro'; n.close(); };
    return true;
  } catch {
    return false;
  }
}
