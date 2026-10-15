import { test, group, assertEqual, assertTrue, assertDeepEqual, assertThrows } from './runner.js';
import { freshStore } from './helpers.js';
import { getState } from '../js/store/store.js';
import { addCourse, deleteCourse } from '../js/store/actions/courses.js';
import { addCourseNote, updateCourseNote, deleteCourseNote, validateAttachment, addAttachmentMeta } from '../js/store/actions/course-notes.js';
import { createBackup, validateBackup } from '../js/lib/backup.js';
import { putFile, getFile, deleteFile } from '../js/lib/files-db.js';
import { collectFiles } from '../js/lib/backup-files.js';

group('ders notları');
test('not ekleme, güncelleme, silme', () => {
  freshStore();
  const c = addCourse({ name: 'Fizik' });
  assertThrows(() => addCourseNote({ courseId: 'yok' }));
  const n = addCourseNote({ courseId: c.id, title: 'Newton' });
  updateCourseNote(n.id, { body: 'F = m·a' });
  assertEqual(getState().courseNotes[0].body, 'F = m·a');
  addAttachmentMeta(n.id, { id: 'f1', name: 'a.pdf', type: 'application/pdf', size: 10 });
  assertDeepEqual(deleteCourseNote(n.id), ['f1']);
  assertEqual(getState().courseNotes.length, 0);
});
test('ek doğrulama: tür, boyut, sayı', () => {
  assertTrue(validateAttachment({ name: 'a.pdf', type: 'application/pdf', size: 1000 }, 0).ok);
  assertTrue(validateAttachment({ name: 'a.png', type: 'image/png', size: 1000 }, 9).ok);
  assertTrue(!validateAttachment({ name: 'a.docx', type: 'application/msword', size: 1000 }, 0).ok);
  assertTrue(!validateAttachment({ name: 'b.pdf', type: 'application/pdf', size: 11 * 1024 * 1024 }, 0).ok);
  assertTrue(!validateAttachment({ name: 'a.png', type: 'image/png', size: 1 }, 10).ok);
});
test('ders silinince notları da silinir', () => {
  freshStore();
  const c = addCourse({ name: 'Fizik' });
  const n = addCourseNote({ courseId: c.id });
  addAttachmentMeta(n.id, { id: 'f9', name: 'a.png', type: 'image/png', size: 5 });
  const r = deleteCourse(c.id);
  assertDeepEqual(r.attachmentIds, ['f9']);
  assertEqual(getState().courseNotes.length, 0);
});
test('yedekte ek biçimi (IndexedDB + base64)', async () => {
  freshStore();
  const c = addCourse({ name: 'Fizik' });
  const n = addCourseNote({ courseId: c.id });
  const id = 'test-ek-' + Date.now();
  await putFile(id, new Blob(['merhaba'], { type: 'image/png' }));
  addAttachmentMeta(n.id, { id, name: 'r.png', type: 'image/png', size: 7 });
  const files = await collectFiles(getState());
  assertEqual(files.length, 1);
  assertEqual(files[0].id, id);
  assertEqual(atob(files[0].dataBase64), 'merhaba');
  const v = validateBackup(createBackup(getState(), files));
  assertEqual(v.files.length, 1);
  assertEqual((await getFile(id)).size, 7);
  await deleteFile(id);
  assertEqual(await getFile(id), undefined);
});
