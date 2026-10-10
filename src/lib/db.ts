import { collection, deleteDoc, doc, onSnapshot, query, where, setDoc } from 'firebase/firestore';
import { db, authReady } from './firebase';
import { handleFirestoreError } from './firebaseErrors';
import { safeStorage } from './storageManager';
import { useState, useEffect, useRef } from 'react';

const isQuotaError = (err: any) => {
  const str = String(err?.message || err).toLowerCase();
  const code = String(err?.code || '').toLowerCase();
  return code === 'resource-exhausted' || str.includes('resource-exhausted') || str.includes('quota exceeded') || (str.includes('quota') && str.includes('exceeded'));
};

export const subscribeToCollection = <T>(
  collectionName: string,
  userId: string | undefined,
  callback: (data: T[]) => void,
  isGlobal: boolean = false,
  isAdmin: boolean = false
) => {
  // For private/scoped collections (isGlobal is false), we don't want to load admin global or merge everything.
  // We strictly use the userId to separate accounts.
  const isPrivateCollection = !isGlobal && ['projects', 'clients', 'finances', 'settings'].includes(collectionName);

  const cacheKey = isPrivateCollection 
    ? `sync_cache_${collectionName}_${userId || 'shared'}`
    : `sync_cache_${collectionName}_${isAdmin ? 'admin' : (isGlobal ? 'global' : (userId || 'shared'))}`;
  
  // Try subscribing, fall back to safeStorage cache if it fails (e.g. Quota exceeded)
  try {
    // Match multiple possible format variants for userId (e.g. 'user_123', '123', 'shared')
    const userIdsToMatch = userId 
      ? Array.from(new Set([userId, userId.replace(/^user_/, ''), 'user_' + userId.replace(/^user_/, ''), 'shared'])).filter(Boolean)
      : ['shared'];

    const q = (isGlobal || isAdmin)
      ? collection(db, collectionName)
      : query(collection(db, collectionName), where("userId", "in", userIdsToMatch));
    
    return onSnapshot(q, (snapshot) => {
      const remoteItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      
      // Merge intelligently with existing local items so nested collections (materiales, personal, cobros)
      // are never accidentally wiped out if a remote doc was written with empty arrays or missing fields
      const currentCached = safeStorage.getItem<T[]>(cacheKey, []) || [];
      const sharedCached = safeStorage.getItem<T[]>(`sync_cache_${collectionName}_shared`, []) || [];
      const adminCached = safeStorage.getItem<T[]>(`sync_cache_${collectionName}_admin`, []) || [];
      const backupCached = safeStorage.getItem<T[]>(`${collectionName}_backup_snapshot_data`, []) || [];

      const lookupMap = new Map<string, any>();
      const cachedLists = isPrivateCollection 
        ? [currentCached] 
        : [backupCached, sharedCached, adminCached, currentCached];

      cachedLists.forEach((list: any[]) => {
        list.forEach((it: any) => {
          if (it && it.id) {
            const existing = lookupMap.get(it.id);
            if (!existing) {
              lookupMap.set(it.id, it);
            } else {
              lookupMap.set(it.id, {
                ...it,
                ...existing,
                materiales: (existing.materiales && existing.materiales.length > 0 ? existing.materiales : it.materiales) || [],
                personal: (existing.personal && existing.personal.length > 0 ? existing.personal : it.personal) || [],
                cobros: (existing.cobros && existing.cobros.length > 0 ? existing.cobros : it.cobros) || []
              });
            }
          }
        });
      });

      const items = remoteItems.map((rem: any) => {
        const local = lookupMap.get(rem.id);
        if (!local) return rem;
        return {
          ...local,
          ...rem,
          materiales: (rem.materiales && Array.isArray(rem.materiales) && rem.materiales.length > 0)
            ? rem.materiales
            : (local.materiales && Array.isArray(local.materiales) && local.materiales.length > 0)
              ? local.materiales
              : rem.materiales || local.materiales || [],
          personal: (rem.personal && Array.isArray(rem.personal) && rem.personal.length > 0)
            ? rem.personal
            : (local.personal && Array.isArray(local.personal) && local.personal.length > 0)
              ? local.personal
              : rem.personal || local.personal || [],
          cobros: (rem.cobros && Array.isArray(rem.cobros) && rem.cobros.length > 0)
            ? rem.cobros
            : (local.cobros && Array.isArray(local.cobros) && local.cobros.length > 0)
              ? local.cobros
              : rem.cobros || local.cobros || []
        };
      }) as T[];

      // Save to local cache for instant future loads across all cache variants
      safeStorage.setItem(cacheKey, items);
      if (!isPrivateCollection) {
        safeStorage.setItem(`sync_cache_${collectionName}_shared`, items);
        safeStorage.setItem(`sync_cache_${collectionName}_admin`, items);
        safeStorage.setItem(`${collectionName}_backup_snapshot_data`, items);
      }
      callback(items);
    }, (error) => {
      handleFirestoreError(error, 'list', collectionName);
      
      // Set quota exceeded/offline marker so other services handle it
      if (isQuotaError(error)) {
        try {
          safeStorage.setItem('firestore_quota_exceeded', 'true');
          safeStorage.setItem('firestore_quota_exceeded_timestamp', Date.now().toString());
          // Dispatch custom event to notify components
          window.dispatchEvent(new Event('firestore_quota_status_changed'));
        } catch (_e) {}
      }
      
      // Fallback: load from cache immediately on subscription error
      const cachedItems = safeStorage.getItem<T[]>(cacheKey, []);
      callback(cachedItems);
    });
  } catch (error) {
    console.warn(`Firestore subscription failed for ${collectionName}, falling back to local cache:`, error);
    const cachedItems = safeStorage.getItem<T[]>(cacheKey, []);
    callback(cachedItems);
    return () => {};
  }
};

const removeUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      if (obj[key] !== undefined) {
        acc[key] = removeUndefined(obj[key]);
      }
      return acc;
    }, {} as any);
  }
  return obj;
};

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collectionName: string;
  data?: any;
  userId?: string;
  timestamp: number;
}

const queueOperation = (op: PendingOperation) => {
  try {
    const queue = safeStorage.getItem<PendingOperation[]>('db_sync_queue', []);
    const filtered = queue.filter(item => !(item.id === op.id && item.collectionName === op.collectionName));
    filtered.push(op);
    safeStorage.setItem('db_sync_queue', filtered);
  } catch (e) {
    console.error('Queue write failed:', e);
  }
};

let isProcessingQueue = false;

export const processPendingQueue = async () => {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  try {
    const queue = safeStorage.getItem<PendingOperation[]>('db_sync_queue', []);
    if (queue.length === 0) {
      isProcessingQueue = false;
      return;
    }

    const remaining: PendingOperation[] = [];

    for (const op of queue) {
      try {
        if (op.type === 'delete') {
          const docRef = doc(db, op.collectionName, op.id);
          await deleteDoc(docRef);
        } else {
          const docRef = doc(db, op.collectionName, op.id);
          const { id: _, ...rest } = op.data;
          await setDoc(docRef, removeUndefined({ 
            ...rest, 
            ...(op.userId ? { userId: op.userId } : {}) 
          }), { merge: true });
        }
      } catch (err: any) {
        console.warn(`Sync retry failed for ${op.collectionName}/${op.id}:`, err);
        remaining.push(op);
      }
    }

    safeStorage.setItem('db_sync_queue', remaining);
  } catch (e) {
    console.error('Error processing sync queue:', e);
  } finally {
    isProcessingQueue = false;
  }
};

if (typeof window !== 'undefined') {
  setInterval(processPendingQueue, 15000);
  window.addEventListener('online', processPendingQueue);
}

export const triggerBackgroundDriveBackup = () => {
  // Google Drive service was removed
};

export const addRecord = async (collectionName: string, id: string, data: any, userId: string) => {
  try {
    const { id: _, ...rest } = data;
    await setDoc(doc(db, collectionName, id), removeUndefined({ ...rest, userId }));
    triggerBackgroundDriveBackup();
  } catch (error: any) {
    handleFirestoreError(error, 'create', collectionName);
    if (isQuotaError(error)) {
      safeStorage.setItem('firestore_quota_exceeded', 'true');
      window.dispatchEvent(new Event('firestore_quota_status_changed'));
    }
    
    queueOperation({
      id,
      type: 'create',
      collectionName,
      data,
      userId,
      timestamp: Date.now()
    });
  }
};

export const updateRecord = async (collectionName: string, id: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, id);
    const { id: _, userId, ...rest } = data;
    await setDoc(docRef, removeUndefined({ ...rest, ...(userId ? { userId } : {}) }), { merge: true });
    triggerBackgroundDriveBackup();
  } catch (error: any) {
    handleFirestoreError(error, 'update', collectionName);
    if (isQuotaError(error)) {
      safeStorage.setItem('firestore_quota_exceeded', 'true');
      window.dispatchEvent(new Event('firestore_quota_status_changed'));
    }
    
    queueOperation({
      id,
      type: 'update',
      collectionName,
      data,
      timestamp: Date.now()
    });
  }
};

export const deleteRecord = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    triggerBackgroundDriveBackup();
  } catch (error: any) {
    handleFirestoreError(error, 'delete', collectionName);
    if (isQuotaError(error)) {
      safeStorage.setItem('firestore_quota_exceeded', 'true');
      window.dispatchEvent(new Event('firestore_quota_status_changed'));
    }
    
    queueOperation({
      id,
      type: 'delete',
      collectionName,
      timestamp: Date.now()
    });
  }
};

export function useFirestoreArraySync<T extends {id: string}>(
  collectionName: string, 
  userId: string | undefined, 
  isGlobal: boolean = false,
  isAdmin: boolean = false
): [T[], React.Dispatch<React.SetStateAction<T[]>>] {
  const isPrivateCollection = !isGlobal && ['projects', 'clients', 'finances', 'settings'].includes(collectionName);
  
  const cacheKey = isPrivateCollection 
    ? `sync_cache_${collectionName}_${userId || 'shared'}`
    : `sync_cache_${collectionName}_${isAdmin ? 'admin' : (isGlobal ? 'global' : (userId || 'shared'))}`;
  
  // Instant synchronous hydration on initial render frame 0 with strict workspace isolation
  const [data, setData] = useState<T[]>(() => {
    if (isPrivateCollection || (!isAdmin && !isGlobal)) {
      // Private workspace: ONLY read their own primary cache or userCache
      const primary = safeStorage.getItem<T[]>(cacheKey, []);
      const userCache = userId ? safeStorage.getItem<T[]>(`sync_cache_${collectionName}_${userId}`, []) : [];
      const userItems = primary.length > 0 ? primary : userCache;
      return userItems;
    }

    const primary = safeStorage.getItem<T[]>(cacheKey, []);
    const admin = safeStorage.getItem<T[]>(`sync_cache_${collectionName}_admin`, []);
    const shared = safeStorage.getItem<T[]>(`sync_cache_${collectionName}_shared`, []);
    const backup = safeStorage.getItem<T[]>(`${collectionName}_backup_snapshot_data`, []);
    const userCache = userId ? safeStorage.getItem<T[]>(`sync_cache_${collectionName}_${userId}`, []) : [];

    const map = new Map<string, any>();
    [...backup, ...shared, ...userCache, ...admin, ...primary].forEach((item: any) => {
      if (item && item.id) {
        const prev = map.get(item.id);
        if (!prev) {
          map.set(item.id, item);
        } else {
          map.set(item.id, {
            ...item,
            ...prev,
            materiales: (prev.materiales && prev.materiales.length > 0 ? prev.materiales : item.materiales) || [],
            personal: (prev.personal && prev.personal.length > 0 ? prev.personal : item.personal) || [],
            cobros: (prev.cobros && prev.cobros.length > 0 ? prev.cobros : item.cobros) || []
          });
        }
      }
    });

    const combined = Array.from(map.values()) as T[];
    return combined.length > 0 ? combined : (primary.length > 0 ? primary : []);
  });

  const currentDataRef = useRef<T[]>(data);
  currentDataRef.current = data;

  useEffect(() => {
    // If not authenticated and not global and not admin, do not leak admin data
    if (!userId && !isGlobal && !isAdmin) { 
      const localFallback = safeStorage.getItem<T[]>(cacheKey, []);
      if (localFallback && localFallback.length > 0 && data.length === 0) {
        setData(localFallback);
      }
      return; 
    }
    
    // Check if cache has updated for this key
    const cached = safeStorage.getItem<T[]>(cacheKey, []);
    if (cached && cached.length > 0 && currentDataRef.current.length === 0) {
      setData(cached);
    }
    
    // Wait until there is an auth session before opening the listener, so the
    // first request carries request.auth and is not rejected by rules that
    // require authentication. authReady always settles (success or the safety
    // timeout), so this never hangs.
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    authReady.then(() => {
      if (cancelled) return;
      unsubscribe = subscribeToCollection<T>(collectionName, userId, (freshItems) => {
        setData(freshItems);
      }, isGlobal, isAdmin);
    });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [collectionName, userId, isGlobal, isAdmin, cacheKey]);

  const updateData: React.Dispatch<React.SetStateAction<T[]>> = (action) => {
    setData((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      
      const isPrivate = !isGlobal && ['projects', 'clients', 'finances', 'settings'].includes(collectionName);

      // Update local caches strictly scoped
      safeStorage.setItem(cacheKey, next);
      if ((isAdmin || isGlobal) && !isPrivate) {
        safeStorage.setItem(`sync_cache_${collectionName}_admin`, next);
        safeStorage.setItem(`${collectionName}_backup_snapshot_data`, next);
        safeStorage.setItem(`sync_cache_${collectionName}_shared`, next);
      }
      if (userId) {
        safeStorage.setItem(`sync_cache_${collectionName}_${userId}`, next);
      }

      const effectiveUserId = userId || 'shared';
      const prevIds = new Set(prev.map((i: T) => i.id));
      const nextIds = new Set(next.map((i: T) => i.id));
      
      prev.forEach((p: T) => {
        if (!nextIds.has(p.id)) deleteRecord(collectionName, p.id);
      });
      
      next.forEach((n: T) => {
        if (!prevIds.has(n.id)) {
          addRecord(collectionName, n.id, n, effectiveUserId);
        } else {
          const p = prev.find((i: T) => i.id === n.id);
          if (JSON.stringify(p) !== JSON.stringify(n)) {
            updateRecord(collectionName, n.id, n);
          }
        }
      });
      return next;
    });
  };

  return [data, updateData];
}
