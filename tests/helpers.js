// Testler için ortak yardımcılar: gerçek veriye dokunmadan bellek içi store başlatır.
import { initStore, createMemoryStorage, getState } from '../js/store/store.js';

export function freshStore(initial) {
  const storage = createMemoryStorage(initial ? { 'planlayici-test': JSON.stringify(initial) } : {});
  initStore({ storage, storageKey: 'planlayici-test' });
  return { storage, state: () => getState() };
}
