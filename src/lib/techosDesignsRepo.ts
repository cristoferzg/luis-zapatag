import { safeStorage } from './storageManager';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';

export interface SavedTechosDesign {
  id: string;
  nombre: string;
  savedAt: string;
  updatedAt?: string;
  authorName?: string;
  authorRole?: string;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  tipoTecho?: string;
  luz?: number;
  largo?: number;
  nodes: any;
  segments: any;
  coverageZones: any;
}

const STORAGE_KEY = 'innova_techos_saved_projects';
const ACTIVE_PLAN_KEY = 'innova_techos_active_loaded_plan';

/**
 * Loads all saved designs from local cache and syncs with Firestore
 */
export async function fetchAllTechosDesigns(): Promise<SavedTechosDesign[]> {
  const localList = safeStorage.getItem<SavedTechosDesign[]>(STORAGE_KEY, []) || [];
  
  try {
    const colRef = collection(db, 'planos_techos');
    const q = query(colRef, orderBy('savedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const remoteList: SavedTechosDesign[] = [];
      snapshot.forEach((d) => {
        remoteList.push({ id: d.id, ...(d.data() as any) });
      });

      // Merge remote into local by id, prioritizing most recent
      const map = new Map<string, SavedTechosDesign>();
      localList.forEach(item => map.set(item.id, item));
      remoteList.forEach(item => map.set(item.id, item));

      const merged = Array.from(map.values()).sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.savedAt).getTime() || 0;
        const timeB = new Date(b.updatedAt || b.savedAt).getTime() || 0;
        return timeB - timeA;
      });

      safeStorage.setItem(STORAGE_KEY, merged);
      return merged;
    }
  } catch (err) {
    console.warn('Notice fetching cloud techos plans (using local cache):', err);
  }

  return localList;
}

/**
 * Returns currently cached designs synchronously
 */
export function getCachedTechosDesigns(): SavedTechosDesign[] {
  return safeStorage.getItem<SavedTechosDesign[]>(STORAGE_KEY, []) || [];
}

/**
 * Saves or updates a roof design:
 * - If overwriteExisting is true and design has an existing id, overwrites it.
 * - If false or no id, creates a new entry.
 * - Persists to Firestore and local storage.
 */
export async function saveOrUpdateTechosDesign(
  designData: Omit<SavedTechosDesign, 'id' | 'savedAt'> & { id?: string },
  overwriteExisting: boolean = true
): Promise<{ design: SavedTechosDesign; isNew: boolean }> {
  const existingList = getCachedTechosDesigns();
  const existingIndex = designData.id 
    ? existingList.findIndex(item => item.id === designData.id) 
    : -1;

  const isUpdating = overwriteExisting && existingIndex >= 0;
  const targetId = isUpdating ? designData.id! : `techos_${Date.now()}`;
  const nowStr = new Date().toLocaleDateString('es-PE') + ' ' + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const finalDesign: SavedTechosDesign = {
    ...designData,
    id: targetId,
    savedAt: isUpdating ? existingList[existingIndex].savedAt : nowStr,
    updatedAt: nowStr
  };

  // Update local cache
  let nextList: SavedTechosDesign[];
  if (isUpdating) {
    nextList = [...existingList];
    nextList[existingIndex] = finalDesign;
  } else {
    nextList = [finalDesign, ...existingList];
  }
  safeStorage.setItem(STORAGE_KEY, nextList);

  // Sync to Firestore in background
  try {
    const docRef = doc(db, 'planos_techos', targetId);
    await setDoc(docRef, finalDesign, { merge: true });
  } catch (dbErr) {
    console.warn('Notice saving plan to Firestore:', dbErr);
  }

  return { design: finalDesign, isNew: !isUpdating };
}

/**
 * Removes a design locally and from Firestore
 */
export async function deleteTechosDesign(id: string): Promise<boolean> {
  const current = getCachedTechosDesigns();
  const next = current.filter(item => item.id !== id);
  safeStorage.setItem(STORAGE_KEY, next);

  try {
    await deleteDoc(doc(db, 'planos_techos', id));
  } catch (err) {
    console.warn('Notice deleting plan from cloud:', err);
  }
  return true;
}

/**
 * Stores active design to load in the CAD viewer
 */
export function setActiveTechosDesignToLoad(design: SavedTechosDesign | null): void {
  if (design) {
    safeStorage.setItem(ACTIVE_PLAN_KEY, design);
  } else {
    safeStorage.removeItem(ACTIVE_PLAN_KEY);
  }
}

/**
 * Retrieves and clears active design to load
 */
export function popActiveTechosDesignToLoad(): SavedTechosDesign | null {
  const design = safeStorage.getItem<SavedTechosDesign | null>(ACTIVE_PLAN_KEY, null);
  if (design) {
    safeStorage.removeItem(ACTIVE_PLAN_KEY);
  }
  return design;
}
