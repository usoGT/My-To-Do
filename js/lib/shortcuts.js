// Klavye kısayolları. Bir metin alanına yazarken çalışmaz (Ctrl+K hariç).
import { isTypingTarget } from './dom.js';
import { runGlobalAction } from './global-actions.js';

export const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], label: 'Komut paleti: ara, sayfaya git, görev ekle (Mac: ⌘ K)' },
  { keys: ['N'], label: 'Hızlı not al' },
  { keys: ['Esc'], label: 'Açık pencereyi kapat' },
];

export function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      runGlobalAction('open-palette');
      return;
    }
    if (mod || e.altKey || e.repeat) return;
    if (isTypingTarget(e.target) || document.querySelector('dialog[open]')) return;
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      runGlobalAction('quick-note');
    }
  });
}
