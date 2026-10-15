// Ders Notları: ders filtresi, not listesi (arama), editör (otomatik kayıt) ve ekler (PDF/resim).
// Adres: #/ders-notlari?ders=<id>&not=<id>
import { html, delegate, qs, debounce } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getState, subscribe } from '../store/store.js';
import { getCoursesSorted, getCourse } from '../store/selectors.js';
import { addCourseNote, updateCourseNote, deleteCourseNote, MAX_FILES_PER_NOTE } from '../store/actions/course-notes.js';
import { attachFile, removeAttachment, deleteFilesQuietly, attachmentUrl } from '../lib/attachments.js';
import { isFilesAvailable } from '../lib/files-db.js';
import { emptyState } from '../components/empty-state.js';
import { confirmDialog } from '../components/confirm.js';
import { toast } from '../components/toast.js';
import { updateQuery } from '../router.js';
import { isCapacitor } from '../lib/platform.js';
import { nativeShareFile } from '../lib/native.js';
import { openModal } from '../components/modal.js';
import { matches, firstLine, formatBytes } from '../lib/text.js';
import { formatTimeAgo } from '../lib/dates.js';

function coursesView(state, ui) {
  const courses = getCoursesSorted(state);
  const count = (id) => state.courseNotes.filter((n) => !id || n.courseId === id).length;
  return html`
    <nav class="notes-courses-list" aria-label="Ders filtresi">
      <button type="button" class="notes-course ${!ui.courseId ? 'is-active' : ''}" data-action="filter" data-id="">
        <span class="grow">Tümü</span><span class="count">${count('')}</span>
      </button>
      ${courses.map((c) => html`
        <button type="button" class="notes-course c-${c.color} ${ui.courseId === c.id ? 'is-active' : ''}" data-action="filter" data-id="${c.id}">
          <span class="dot"></span><span class="grow truncate">${c.name}</span><span class="count">${count(c.id)}</span>
        </button>`)}
    </nav>
    <label class="notes-course-select">
      <span class="visually-hidden">Ders</span>
      <select class="select" data-course-select>
        <option value="">Tüm dersler (${count('')})</option>
        ${courses.map((c) => html`<option value="${c.id}" ${ui.courseId === c.id ? 'selected' : ''}>${c.name} (${count(c.id)})</option>`)}
      </select>
    </label>`;
}

function visibleNotes(state, ui) {
  return state.courseNotes
    .filter((n) => !ui.courseId || n.courseId === ui.courseId)
    .filter((n) => !ui.search || matches(`${n.title} ${n.body}`, ui.search))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function listView(state, ui) {
  const notes = visibleNotes(state, ui);
  if (!notes.length) {
    return html`<p class="small muted notes-empty">${ui.search ? 'Aramayla eşleşen not yok.' : ui.courseId ? 'Bu ders için not yok.' : 'Henüz not yok.'}</p>`;
  }
  return html`
    <ul class="notes-list">
      ${notes.map((n) => {
        const c = getCourse(state, n.courseId);
        const preview = firstLine(n.body) || 'Boş not';
        return html`
          <li>
            <button type="button" class="note-row ${n.id === ui.noteId ? 'is-active' : ''} ${c ? `c-${c.color}` : ''}" data-action="open-note" data-id="${n.id}">
              <span class="note-row-title truncate">${n.title || 'Başlıksız not'}</span>
              <span class="note-row-preview truncate">${preview}</span>
              <span class="note-row-meta">
                ${c ? html`<span class="dot"></span><span class="truncate">${c.name}</span>` : ''}
                <span class="grow"></span>
                ${n.attachments.length ? html`<span class="row" style="gap:2px">${icon('paperclip')}${n.attachments.length}</span>` : ''}
                <span class="nowrap">${formatTimeAgo(n.updatedAt)}</span>
              </span>
            </button>
          </li>`;
      })}
    </ul>`;
}

function attachmentsView(note) {
  const canAdd = isFilesAvailable() && note.attachments.length < MAX_FILES_PER_NOTE;
  return html`
    <div class="note-attachments-head">
      <span class="small muted">${icon('paperclip')} Ekler ${note.attachments.length ? `(${note.attachments.length})` : ''}</span>
      ${isFilesAvailable()
        ? html`<label class="btn btn--sm ${canAdd ? '' : 'is-disabled'}" for="note-file" aria-disabled="${!canAdd}">${icon('upload')} Dosya ekle</label>
          <input type="file" id="note-file" class="visually-hidden" accept="application/pdf,image/png,image/jpeg,image/webp,image/gif" multiple ${canAdd ? '' : 'disabled'}>`
        : html`<span class="xsmall muted">Bu tarayıcıda (ör. gizli pencerede) ekler kullanılamıyor.</span>`}
    </div>
    ${note.attachments.length ? html`
      <ul class="att-grid">
        ${note.attachments.map((a) => html`
          <li class="att-card">
            <button type="button" class="att-open" data-action="open-att" data-id="${a.id}" title="${a.name}">
              ${a.type.startsWith('image/')
                ? html`<span class="att-thumb" data-thumb="${a.id}">${icon('image')}</span>`
                : html`<span class="att-thumb att-thumb--pdf">${icon('file')}<span>PDF</span></span>`}
              <span class="att-name truncate">${a.name}</span>
              <span class="xsmall muted">${formatBytes(a.size)}</span>
            </button>
            <button type="button" class="btn btn--ghost btn--icon btn--sm att-del" data-action="del-att" data-id="${a.id}" aria-label="${a.name} ekini sil">${icon('x')}</button>
          </li>`)}
      </ul>` : html`<p class="xsmall muted">PDF ya da resim ekleyebilir veya buraya sürükleyip bırakabilirsin (dosya başına en fazla 10 MB).</p>`}`;
}

function editorView(state, ui) {
  const note = state.courseNotes.find((n) => n.id === ui.noteId);
  if (!note) {
    return emptyState({
      icon: 'note',
      title: 'Bir not seç',
      text: state.courses.length ? 'Soldan bir not seç ya da yeni bir not oluştur.' : 'Not almak için önce Ders Programı sayfasından bir ders ekle.',
      action: state.courses.length ? { label: 'Yeni not', dataAction: 'new-note' } : null,
    });
  }
  const courses = getCoursesSorted(state);
  return html`
    <div class="note-editor" data-note-id="${note.id}">
      <div class="note-editor-top">
        <button type="button" class="btn btn--ghost btn--sm notes-back" data-action="back">${icon('chevronLeft')} Notlar</button>
        <label class="note-course">
          <span class="visually-hidden">Ders</span>
          <select class="select" data-note-course>
            ${courses.map((c) => html`<option value="${c.id}" ${c.id === note.courseId ? 'selected' : ''}>${c.name}</option>`)}
          </select>
        </label>
        <span class="xsmall muted note-status" data-save-status aria-live="polite">Kaydedildi</span>
        <button type="button" class="btn btn--ghost btn--icon btn--sm" data-action="delete-note" aria-label="Notu sil">${icon('trash')}</button>
      </div>
      <input class="note-title-input" data-note-title value="${note.title}" placeholder="Başlık" maxlength="150" aria-label="Not başlığı">
      <textarea class="note-body-input" data-note-body placeholder="Notunu yaz…" aria-label="Not içeriği">${note.body}</textarea>
      <div class="note-attachments" data-region="attachments">${attachmentsView(note)}</div>
      <div class="note-drop" aria-hidden="true">${icon('upload')} Dosyaları buraya bırak</div>
    </div>`;
}

export default {
  title: 'Ders Notları',
  render(root, { query }) {
    const state0 = getState();
    const ui = {
      courseId: state0.courses.some((c) => c.id === query.ders) ? query.ders : '',
      noteId: query.not || '',
      search: '',
    };
    const urls = new Map(); // ek id → object URL (küçük resimler için)

    root.innerHTML = String(html`
      <div class="page-header notes-header">
        <div><h1>Ders Notları</h1><p>Derslerine bağlı notlar ve dosyalar.</p></div>
        <button type="button" class="btn btn--primary" data-action="new-note" ${state0.courses.length ? '' : 'disabled'}>${icon('plus')} Yeni not</button>
      </div>
      <div class="notes-layout ${ui.noteId ? 'has-note' : ''}">
        <aside class="notes-courses" data-region="courses"></aside>
        <section class="notes-list-col card card--flat">
          <label class="notes-search">
            ${icon('search')}
            <span class="visually-hidden">Notlarda ara</span>
            <input type="search" data-search placeholder="Notlarda ara">
          </label>
          <div data-region="list"></div>
        </section>
        <section class="notes-editor-col card card--flat" data-region="editor"></section>
      </div>`);

    const layout = qs('.notes-layout', root);
    const region = (name) => qs(`[data-region="${name}"]`, root);

    const loadThumbs = async () => {
      for (const el of root.querySelectorAll('[data-thumb]')) {
        const id = el.dataset.thumb;
        try {
          if (!urls.has(id)) {
            const u = await attachmentUrl(id);
            if (!u) continue;
            urls.set(id, u);
          }
          el.innerHTML = '';
          const img = document.createElement('img');
          img.src = urls.get(id);
          img.alt = '';
          el.append(img);
        } catch { /* küçük resim yüklenemedi, ikon kalır */ }
      }
    };

    const drawCourses = () => { region('courses').innerHTML = String(coursesView(getState(), ui)); };
    const drawList = () => { region('list').innerHTML = String(listView(getState(), ui)); };
    const drawAttachments = () => {
      const note = getState().courseNotes.find((n) => n.id === ui.noteId);
      const r = region('attachments');
      if (note && r) { r.innerHTML = String(attachmentsView(note)); loadThumbs(); }
    };

    // ---- Otomatik kayıt ----
    const setStatus = (t) => { const el = qs('[data-save-status]', root); if (el) el.textContent = t; };
    const save = debounce((noteId, patch) => {
      try {
        updateCourseNote(noteId, patch);
        setStatus('Kaydedildi');
      } catch (err) {
        setStatus('Kaydedilemedi');
        toast(err.message, { type: 'error' });
      }
    }, 500);
    const flush = () => save.flush();

    const drawEditor = () => {
      flush();
      region('editor').innerHTML = String(editorView(getState(), ui));
      layout.classList.toggle('has-note', Boolean(ui.noteId) && getState().courseNotes.some((n) => n.id === ui.noteId));
      loadThumbs();
    };

    const select = (noteId, { focusTitle = false } = {}) => {
      flush();
      ui.noteId = noteId;
      updateQuery({ ders: ui.courseId || undefined, not: noteId || undefined }, { replace: true });
      drawList();
      drawEditor();
      if (focusTitle) qs('[data-note-title]', root)?.focus();
    };

    drawCourses();
    drawList();
    drawEditor();

    let lastAttSig = '';
    const attSig = () => JSON.stringify(getState().courseNotes.find((n) => n.id === ui.noteId)?.attachments || null);
    lastAttSig = attSig();
    const unsub = subscribe((state, label) => {
      drawCourses();
      drawList();
      const exists = state.courseNotes.some((n) => n.id === ui.noteId);
      if (ui.noteId && !exists) { ui.noteId = ''; drawEditor(); return; }
      if (label === 'courses/delete' || label === 'state/replace' || label === 'backup/restore' || label === 'state/wipe') { drawEditor(); return; }
      const sig = attSig();
      if (sig !== lastAttSig) { lastAttSig = sig; drawAttachments(); }
    });

    // ---- Olaylar ----
    const offClick = delegate(root, 'click', '[data-action]', async (e, el) => {
      const a = el.dataset.action;
      if (a === 'filter') {
        ui.courseId = el.dataset.id;
        updateQuery({ ders: ui.courseId || undefined, not: ui.noteId || undefined }, { replace: true });
        drawCourses();
        drawList();
      } else if (a === 'open-note') select(el.dataset.id);
      else if (a === 'back') select('');
      else if (a === 'new-note') {
        const state = getState();
        const courseId = ui.courseId || getCoursesSorted(state)[0]?.id;
        if (!courseId) return;
        const note = addCourseNote({ courseId });
        ui.search = '';
        const s = qs('[data-search]', root);
        if (s) s.value = '';
        select(note.id, { focusTitle: true });
      } else if (a === 'delete-note') {
        const note = getState().courseNotes.find((n) => n.id === ui.noteId);
        if (!note) return;
        const ok = await confirmDialog({
          title: 'Not silinsin mi?',
          message: `"${note.title || 'Başlıksız not'}"${note.attachments.length ? ` ve ${note.attachments.length} eki` : ''} silinecek.`,
          confirmText: 'Sil',
          danger: true,
        });
        if (!ok) return;
        save.cancel();
        deleteFilesQuietly(deleteCourseNote(note.id));
        toast('Not silindi', { type: 'success' });
      } else if (a === 'open-att' && isCapacitor) {
        const note = getState().courseNotes.find((n) => n.id === ui.noteId);
        const att = note?.attachments.find((x) => x.id === el.dataset.id);
        if (!att) return;
        try {
          const u = urls.get(att.id) || await attachmentUrl(att.id);
          if (!u) throw new Error('Dosya bulunamadı.');
          urls.set(att.id, u);
          if (att.type.startsWith('image/')) {
            openModal({ title: att.name, size: 'lg', content: html`<img src="${u}" alt="${att.name}" class="att-viewer">` });
          } else {
            await nativeShareFile(await (await fetch(u)).blob(), att.name);
          }
        } catch (err) {
          toast(err.message || 'Dosya açılamadı.', { type: 'error' });
        }
      } else if (a === 'open-att') {
        try {
          const u = urls.get(el.dataset.id) || await attachmentUrl(el.dataset.id);
          if (!u) throw new Error('Dosya bulunamadı.');
          urls.set(el.dataset.id, u);
          window.open(u, '_blank', 'noopener');
        } catch (err) {
          toast(err.message || 'Dosya açılamadı.', { type: 'error' });
        }
      } else if (a === 'del-att') {
        const ok = await confirmDialog({ title: 'Ek silinsin mi?', confirmText: 'Sil', danger: true });
        if (!ok) return;
        const id = el.dataset.id;
        await removeAttachment(ui.noteId, id);
        if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
      }
    });

    const offInput = delegate(root, 'input', '[data-note-title], [data-note-body], [data-search]', (e, el) => {
      if (el.matches('[data-search]')) {
        ui.search = el.value;
        drawList();
        return;
      }
      setStatus('Kaydediliyor…');
      const editor = el.closest('[data-note-id]');
      save(editor.dataset.noteId, {
        title: qs('[data-note-title]', editor).value,
        body: qs('[data-note-body]', editor).value,
      });
    });

    const addFiles = async (files) => {
      for (const f of files) {
        try {
          await attachFile(ui.noteId, f);
          toast(`"${f.name}" eklendi`, { type: 'success', duration: 2000 });
        } catch (err) {
          toast(err.message, { type: 'error', duration: 6000 });
        }
      }
    };

    const offChange = delegate(root, 'change', 'select, input[type="file"]', (e, el) => {
      if (el.matches('[data-course-select]')) {
        ui.courseId = el.value;
        updateQuery({ ders: ui.courseId || undefined, not: ui.noteId || undefined }, { replace: true });
        drawCourses();
        drawList();
      } else if (el.matches('[data-note-course]')) {
        flush();
        updateCourseNote(ui.noteId, { courseId: el.value });
      } else if (el.id === 'note-file') {
        const files = [...el.files];
        el.value = '';
        addFiles(files);
      }
    });

    // Sürükle-bırak ile ek
    const onDragOver = (e) => {
      const ed = e.target.closest('.note-editor');
      if (!ed || !e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return;
      e.preventDefault();
      ed.classList.add('is-dragover');
    };
    const onDragLeave = (e) => {
      const ed = e.target.closest('.note-editor');
      if (ed && !ed.contains(e.relatedTarget)) ed.classList.remove('is-dragover');
    };
    const onDrop = (e) => {
      const ed = e.target.closest('.note-editor');
      if (!ed || !e.dataTransfer || !e.dataTransfer.files.length) return;
      e.preventDefault();
      ed.classList.remove('is-dragover');
      if (isFilesAvailable()) addFiles([...e.dataTransfer.files]);
    };
    root.addEventListener('dragover', onDragOver);
    root.addEventListener('dragleave', onDragLeave);
    root.addEventListener('drop', onDrop);

    return () => {
      flush();
      unsub(); offClick(); offInput(); offChange();
      root.removeEventListener('dragover', onDragOver);
      root.removeEventListener('dragleave', onDragLeave);
      root.removeEventListener('drop', onDrop);
      for (const u of urls.values()) URL.revokeObjectURL(u);
    };
  },
};
