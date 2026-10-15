// Ayar eylemleri (doğrulamalı). Geçersiz değerde Error fırlatır; arayüz mesajı gösterir.
import { update, getState } from '../store.js';
import { isValidTime, timeToMinutes } from '../../lib/dates.js';

const THEMES = ['light', 'dark', 'system'];

export function validateSettings(partial, current) {
  const out = {};
  if ('name' in partial) {
    const name = String(partial.name ?? '').trim();
    if (name.length > 40) throw new Error('Ad en fazla 40 karakter olabilir.');
    out.name = name;
  }
  if ('theme' in partial) {
    if (!THEMES.includes(partial.theme)) throw new Error('Geçersiz tema.');
    out.theme = partial.theme;
  }
  if ('dayStart' in partial || 'dayEnd' in partial) {
    const start = partial.dayStart ?? current.dayStart;
    const end = partial.dayEnd ?? current.dayEnd;
    if (!isValidTime(start) || !isValidTime(end)) throw new Error('Saat biçimi geçersiz.');
    if (timeToMinutes(end) - timeToMinutes(start) < 240) {
      throw new Error('Gün bitişi, başlangıçtan en az 4 saat sonra olmalı.');
    }
    out.dayStart = start;
    out.dayEnd = end;
  }
  for (const k of ['showWeekend', 'notifications', 'includeAttachmentsInBackup']) {
    if (k in partial) out[k] = Boolean(partial[k]);
  }
  if ('lastBackupAt' in partial) out.lastBackupAt = partial.lastBackupAt;
  return out;
}

export function updateSettings(partial) {
  const clean = validateSettings(partial, getState().settings);
  update('settings/update', (s) => { Object.assign(s.settings, clean); });
}

const POMO_RULES = {
  focusMin: [1, 90, 'Odak süresi'],
  shortBreakMin: [1, 30, 'Kısa mola'],
  longBreakMin: [5, 60, 'Uzun mola'],
  longBreakEvery: [2, 8, 'Uzun mola sıklığı'],
};

export function validatePomodoro(partial) {
  const out = {};
  for (const [k, v] of Object.entries(partial)) {
    if (k in POMO_RULES) {
      const [min, max, label] = POMO_RULES[k];
      const n = Number(v);
      if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${label} ${min}–${max} arasında bir tam sayı olmalı.`);
      out[k] = n;
    } else if (k === 'autoStartNext' || k === 'sound') {
      out[k] = Boolean(v);
    }
  }
  return out;
}

export function updatePomodoroSettings(partial) {
  const clean = validatePomodoro(partial);
  update('settings/pomodoro', (s) => { Object.assign(s.settings.pomodoro, clean); });
}
