// "Yedek al" işlemi (Ayarlar ve komut paleti ortak kullanır).
import { getState } from '../store/store.js';
import { updateSettings } from '../store/actions/settings.js';
import { createBackup, backupFileName, downloadJson } from './backup.js';
import { collectFiles } from './backup-files.js';
import { todayKey } from './dates.js';
import { formatBytes } from './text.js';
import { toast } from '../components/toast.js';

export async function runBackup() {
  const state = getState();
  let files = [];
  try {
    files = await collectFiles(state);
  } catch (err) {
    console.error(err);
    toast('Ekler yedeğe eklenemedi; sadece veriler yedekleniyor.', { type: 'error' });
  }
  const size = await downloadJson(createBackup(state, files), backupFileName(todayKey()));
  updateSettings({ lastBackupAt: new Date().toISOString() });
  toast(`Yedek indirildi (${formatBytes(size)}).`, { type: 'success' });
}
