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
  /** Momento de la última edición (ms). Las fechas de texto "29/10/2026 08:15" no se pueden comparar. */
  updatedAtMs?: number;
}

/** Fecha de la última edición en ms (acepta el texto es-PE "dd/mm/aaaa hh:mm"). */
export function msDe(d: Pick<SavedTechosDesign, 'updatedAtMs' | 'updatedAt' | 'savedAt'>): number {
  if (d.updatedAtMs) return d.updatedAtMs;
  const t = d.updatedAt || d.savedAt || '';
  const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})\D*(\d{1,2})?:?(\d{2})?\s*([ap])?/i.exec(t);
  if (m) {
    let h = Number(m[4] || 0);
    if (m[6]) { const pm = /p/i.test(m[6]); if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), h, Number(m[5] || 0)).getTime();
  }
  return new Date(t).getTime() || 0;
}

const normNombre = (s: string) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
const firma = (d: SavedTechosDesign) => JSON.stringify([d.nodes, d.segments, d.coverageZones || {}]);

/** Quita copias idénticas (mismo nombre y mismo diseño): queda la más reciente. */
function sinCopias(lista: SavedTechosDesign[]): { lista: SavedTechosDesign[]; quitados: string[] } {
  const vistos = new Set<string>(); const quitados: string[] = [];
  const out = lista.filter(d => {
    const k = normNombre(d.nombre) + '|' + (d.clientId || '') + '|' + firma(d);
    if (vistos.has(k)) { quitados.push(d.id); return false; }
    vistos.add(k); return true;
  });
  return { lista: out, quitados };
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

      // Se juntan la copia local y la de la nube por id: gana la edición más
      // reciente (antes ganaba siempre la nube y un cambio local se perdía).
      const map = new Map<string, SavedTechosDesign>();
      localList.forEach(item => map.set(item.id, item));
      remoteList.forEach(item => { const loc = map.get(item.id); if (!loc || msDe(item) >= msDe(loc)) map.set(item.id, item); });

      const ordenada = Array.from(map.values()).sort((a, b) => msDe(b) - msDe(a));
      const { lista: merged, quitados } = sinCopias(ordenada);
      quitados.forEach(id => deleteDoc(doc(db, 'planos_techos', id)).catch(() => { /* sin permiso o sin red */ }));

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
  let existingIndex = designData.id
    ? existingList.findIndex(item => item.id === designData.id)
    : -1;
  // Sin id pero con el mismo nombre (y cliente) que uno guardado: se actualiza ese,
  // en vez de crear otra copia (pasaba al enviar a Obra Civil / Drywall).
  if (existingIndex < 0 && overwriteExisting && designData.nombre) {
    existingIndex = existingList.findIndex(item => normNombre(item.nombre) === normNombre(designData.nombre) && (item.clientId || '') === (designData.clientId || ''));
  }

  const isUpdating = overwriteExisting && existingIndex >= 0;
  const targetId = isUpdating ? existingList[existingIndex].id : `techos_${Date.now()}`;
  const nowStr = new Date().toLocaleDateString('es-PE') + ' ' + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const finalDesign: SavedTechosDesign = {
    ...designData,
    id: targetId,
    savedAt: isUpdating ? existingList[existingIndex].savedAt : nowStr,
    updatedAt: nowStr,
    updatedAtMs: Date.now(),
  };

  // Update local cache
  let nextList: SavedTechosDesign[];
  if (isUpdating) {
    // El editado pasa al primer lugar (el más reciente).
    nextList = [finalDesign, ...existingList.filter((_, i) => i !== existingIndex)];
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
