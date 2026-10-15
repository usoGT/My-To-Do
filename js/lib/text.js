// Türkçe metin yardımcıları (arama için).
import { escapeHtml, raw } from './dom.js';

const MAP = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };

// Türkçe küçük harfe çevirir, Türkçe karakterleri sadeleştirir, boşlukları toparlar.
export function normalizeTr(s) {
  return String(s ?? '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşüâîû]/g, (c) => MAP[c])
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Metin, sorgunun tüm kelimelerini içeriyor mu?
export function matches(text, query) {
  const q = normalizeTr(query);
  if (!q) return true;
  const t = normalizeTr(text);
  return q.split(' ').every((w) => t.includes(w));
}

// Eşleşen ilk kısmı <mark> ile vurgular. Hem metin hem vurgu kaçışlıdır.
// Normalleştirme harf sayısını değiştirmediği için konumlar aynıdır (tek karakter → tek karakter).
export function highlight(text, query) {
  const src = String(text ?? '');
  const q = normalizeTr(query).split(' ')[0];
  if (!q) return raw(escapeHtml(src));
  const lower = src.toLocaleLowerCase('tr-TR').replace(/[çğıöşüâîû]/g, (c) => MAP[c]);
  const i = lower.indexOf(q);
  if (i < 0 || lower.length !== src.length) return raw(escapeHtml(src));
  return raw(`${escapeHtml(src.slice(0, i))}<mark>${escapeHtml(src.slice(i, i + q.length))}</mark>${escapeHtml(src.slice(i + q.length))}`);
}

export function firstLine(s) {
  return String(s ?? '').split('\n')[0].trim();
}

export function restLines(s) {
  return String(s ?? '').split('\n').slice(1).join('\n').trim();
}

// "1 görev", "3 görev" — Türkçede çoğul eki sayıyla kullanılmaz.
export const countText = (n, word) => `${n} ${word}`;

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} MB`;
}
