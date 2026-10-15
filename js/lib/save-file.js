// Dosya indirme / kaydetme: tarayıcı ve masaüstünde indirme, telefonda paylaşım menüsü.
import { isCapacitor } from './platform.js';
import { nativeShareFile } from './native.js';

export async function saveBlob(blob, fileName) {
  if (isCapacitor) {
    await nativeShareFile(blob, fileName);
    return blob.size;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return blob.size;
}
