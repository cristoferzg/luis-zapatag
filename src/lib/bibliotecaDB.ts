// IndexedDB helper for storing large PDF and Video files locally for Biblioteca Premium

const DB_NAME = 'InnovaBibliotecaDB';
const DB_VERSION = 1;
const STORE_FILES = 'biblioteca_files';
const STORE_ITEMS_BACKUP = 'biblioteca_backup';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES);
      }
      if (!db.objectStoreNames.contains(STORE_ITEMS_BACKUP)) {
        db.createObjectStore(STORE_ITEMS_BACKUP);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBibliotecaFile(id: string, dataUrl: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_FILES, 'readwrite');
    const store = tx.objectStore(STORE_FILES);
    store.put(dataUrl, id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error saving file to IndexedDB:', err);
  }
}

export async function getBibliotecaFile(id: string): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_FILES, 'readonly');
    const store = tx.objectStore(STORE_FILES);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error reading file from IndexedDB:', err);
    return null;
  }
}

export async function deleteBibliotecaFile(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_FILES, 'readwrite');
    const store = tx.objectStore(STORE_FILES);
    store.delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error deleting file from IndexedDB:', err);
  }
}

export async function saveBibliotecaBackup(items: any[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_ITEMS_BACKUP, 'readwrite');
    const store = tx.objectStore(STORE_ITEMS_BACKUP);
    store.put(items, 'current_items');
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error saving items backup to IndexedDB:', err);
  }
}

export async function getBibliotecaBackup(): Promise<any[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_ITEMS_BACKUP, 'readonly');
    const store = tx.objectStore(STORE_ITEMS_BACKUP);
    const request = store.get('current_items');
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error reading items backup from IndexedDB:', err);
    return null;
  }
}
