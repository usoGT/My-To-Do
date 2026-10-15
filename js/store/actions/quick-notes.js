// Hızlı not eylemleri
import { update } from '../store.js';
import { createId, nowIso } from '../../lib/ids.js';
import { fail } from '../../lib/errors.js';

function clean(text) {
  const t = String(text ?? '').replace(/\r\n/g, '\n').trim();
  if (!t) fail('Not boş olamaz.', 'text');
  if (t.length > 5000) fail('Not en fazla 5000 karakter olabilir.', 'text');
  return t;
}

export function addQuickNote(text) {
  const note = { id: createId(), text: clean(text), createdAt: nowIso(), convertedTo: null };
  update('quickNotes/add', (s) => { s.quickNotes.push(note); });
  return note;
}

export function updateQuickNote(id, text) {
  const t = clean(text);
  update('quickNotes/update', (s) => {
    const n = s.quickNotes.find((x) => x.id === id);
    if (n) n.text = t;
  });
}

export function deleteQuickNote(id) {
  let removed = null;
  update('quickNotes/delete', (s) => {
    removed = s.quickNotes.find((x) => x.id === id) || null;
    s.quickNotes = s.quickNotes.filter((x) => x.id !== id);
  });
  return removed;
}

export function restoreQuickNote(note) {
  update('quickNotes/restore', (s) => { if (!s.quickNotes.some((x) => x.id === note.id)) s.quickNotes.push(note); });
}

// type: 'task' | 'goal' | 'courseNote'
export function markConverted(id, target) {
  update('quickNotes/convert', (s) => {
    const n = s.quickNotes.find((x) => x.id === id);
    if (n) n.convertedTo = { type: target.type, id: target.id };
  });
}
