import { safeStorage } from './storageManager';
import { db, auth } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';

export interface SavedTechosDesign {
  id: string;
  nombre: string;
  savedAt: string;
  updatedAt?: string;
  authorName?: string;
  authorRole?: string;
  /** Usuario que lo creó (para mostrar a cada uno solo sus planos). */
  authorUid?: string;
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

/** Nombre sin las marcas de copia que se agregaban solas: "Techo (2) (3)" → "Techo". */
export const nombreBase = (n: string) => (n || '').replace(/(\s*\(\d+\))+\s*$/, '').trim();
const claveCopia = (d: SavedTechosDesign) => `${normNombre(nombreBase(d.nombre))}|${d.clientId || ''}`;
const recienteMs = (d: SavedTechosDesign) => d.updatedAtMs || 0;
/** Un diseño por nombre (el más reciente) y la lista de copias viejas de cada uno. */
export function agruparCopias(lista: SavedTechosDesign[]): { unicos: SavedTechosDesign[]; copias: SavedTechosDesign[] } {
  const grupos = new Map<string, SavedTechosDesign[]>();
  for (const d of lista) { const k = claveCopia(d); grupos.set(k, [...(grupos.get(k) || []), d]); }
  const unicos: SavedTechosDesign[] = [], copias: SavedTechosDesign[] = [];
  for (const g of grupos.values()) {
    const orden = [...g].sort((a, b) => recienteMs(b) - recienteMs(a));
    unicos.push(orden[0]); copias.push(...orden.slice(1));
  }
  const pos = new Map(lista.map((d, i) => [d.id, i]));
  unicos.sort((a, b) => (pos.get(a.id)! - pos.get(b.id)!));
  return { unicos, copias };
}
/** Diseño propio con el mismo nombre base (para enlazar en vez de crear otra copia). */
export function buscarMismoNombre(nombre: string, clientId?: string): SavedTechosDesign | undefined {
  const k = `${normNombre(nombreBase(nombre))}|${clientId || ''}`;
  return getCachedTechosDesigns().filter(d => esPlanoMio(d) && claveCopia(d) === k).sort((a, b) => recienteMs(b) - recienteMs(a))[0];
}

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
      // Cada uno ve y guarda en su equipo SOLO sus planos (el admin no ve los de sus
      // usuarios ni los usuarios los del admin).
      for (const [id, d] of map) if (!esPlanoMio(d)) map.delete(id);

      const ordenada = Array.from(map.values()).sort((a, b) => msDe(b) - msDe(a));
      const { lista: merged, quitados } = sinCopias(ordenada);
      quitados.forEach(id => deleteDoc(doc(db, 'planos_techos', id)).catch(() => { /* sin permiso o sin red */ }));

      safeStorage.setItem(STORAGE_KEY, merged);
      return merged;
    }
  } catch (err) {
    console.warn('Notice fetching cloud techos plans (using local cache):', err);
  }

  return localList.filter(d => esPlanoMio(d));
}

/**
 * Returns currently cached designs synchronously
 */
/** ¿Es un plano de este usuario? (los antiguos sin dueño se reconocen por el nombre del autor). */
/** Usuario actual: el de la sesión (admin = 'admin'; usuario = su id) o, mientras la
 *  sesión arranca, el guardado en el equipo (es el mismo id en todos los dispositivos). */
function uidActual(): string | undefined {
  return auth.currentUser?.uid || safeStorage.getItem<{ id?: string } | null>('savedUser', null)?.id || undefined;
}

export function esPlanoMio(d: SavedTechosDesign, nombreUsuario?: string): boolean {
  const uid = uidActual();
  if (d.authorUid) return !!uid && d.authorUid === uid;
  const nombre = nombreUsuario || (safeStorage.getItem<{ name?: string } | null>('savedUser', null)?.name ?? '');
  return !d.authorName || !nombre || normNombre(d.authorName) === normNombre(nombre);
}

export function getCachedTechosDesigns(): SavedTechosDesign[] {
  return (safeStorage.getItem<SavedTechosDesign[]>(STORAGE_KEY, []) || []).filter(d => esPlanoMio(d));
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
  // Si se pide actualizar un plano con id que aún no está en la copia de este equipo
  // (otro dispositivo, la nube aún no respondió), se actualiza ESE id: no se crea otro.
  const targetId = isUpdating ? existingList[existingIndex].id : (overwriteExisting && designData.id ? designData.id : `techos_${Date.now()}`);
  const nowStr = new Date().toLocaleDateString('es-PE') + ' ' + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const previo = isUpdating ? existingList[existingIndex] : undefined;
  const finalDesign: SavedTechosDesign = {
    ...designData,
    // El dueño no cambia al actualizar; un plano nuevo queda a nombre de quien lo guarda.
    authorUid: previo?.authorUid || designData.authorUid || uidActual() || undefined,
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

  // Se sube a la nube en segundo plano: no se espera a internet (sin red o con la red
  // lenta, esperar dejaba el plano sin id y el siguiente cambio creaba otra copia).
  setDoc(doc(db, 'planos_techos', targetId), JSON.parse(JSON.stringify(finalDesign)), { merge: true })
    .catch(dbErr => console.warn('Notice saving plan to Firestore:', dbErr));

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
