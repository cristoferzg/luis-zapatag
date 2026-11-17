// ========================================================
// GESTOR SEGURO DE ALMACENAMIENTO Y CUOTA PARA PWA
// Previene caídas por DOMException QuotaExceededError,
// gestiona límites ampliados y monitoriza la persistencia
// ========================================================

import { auditLogger } from './auditLogger';

export interface StorageEstimateInfo {
  supported: boolean;
  usedBytes: number;
  totalBytes: number;
  usedMB: number;
  totalMB: number;
  percentUsed: number;
  isPersisted: boolean;
}

export interface StorageItemDetail {
  key: string;
  bytes: number;
  sizeFormatted: string;
  isTransient: boolean;
}

// Respaldo en memoria por si el almacenamiento local está restringido o lleno
const memoryFallback = new Map<string, string>();

class SafeStorageManager {
  private isQuotaAlertTriggered = false;

  /**
   * Obtiene un valor de forma segura, deserializando JSON si se especifica
   */
  public getItem<T = string>(key: string, defaultValue: T): T {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        const mem = memoryFallback.get(key);
        return mem !== undefined ? this.parseValue(mem, defaultValue) : defaultValue;
      }

      const raw = localStorage.getItem(key);
      if (raw === null) {
        // Revisar si existe en memoria
        const mem = memoryFallback.get(key);
        return mem !== undefined ? this.parseValue(mem, defaultValue) : defaultValue;
      }

      return this.parseValue(raw, defaultValue);
    } catch (err) {
      auditLogger.warn('STORAGE', `Fallo de lectura en clave "${key}". Usando valor por defecto.`, {
        error: String(err)
      });
      return defaultValue;
    }
  }

  /**
   * Guarda un valor en el almacenamiento con manejo automático de excepciones de cuota
   */
  public setItem(key: string, value: unknown): boolean {
    let serialized = '';
    try {
      serialized = typeof value === 'string' ? value : JSON.stringify(value);
    } catch (serializeErr) {
      auditLogger.error('STORAGE', `Error serializando valor para clave "${key}"`, {
        error: String(serializeErr)
      });
      return false;
    }

    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        memoryFallback.set(key, serialized);
        return true;
      }

      localStorage.setItem(key, serialized);
      // Mantener copia sincronizada en memoria para redundancia
      memoryFallback.set(key, serialized);
      return true;
    } catch (err) {
      const errorStr = String(err);
      const isQuotaError =
        errorStr.includes('QuotaExceededError') ||
        errorStr.includes('quota') ||
        (err instanceof DOMException && (err.code === 22 || err.code === 1014 || err.name === 'QuotaExceededError'));

      if (isQuotaError) {
        auditLogger.error('STORAGE', `⚠️ Límite de cuota de almacenamiento excedido al guardar "${key}". Aplicando mitigación.`, {
          key,
          itemLengthBytes: serialized.length,
          error: errorStr
        });

        // Intentar liberar almacenamiento transitorio automáticamente
        this.pruneTransientStorage();

        // Reintentar guardar tras liberar espacio
        try {
          localStorage.setItem(key, serialized);
          auditLogger.info('STORAGE', `Recuperación exitosa: "${key}" guardado tras purga de almacenamiento temporal.`);
          return true;
        } catch {
          // Si sigue fallando, recurrir al respaldo en memoria para no romper la experiencia de usuario
          memoryFallback.set(key, serialized);
          if (!this.isQuotaAlertTriggered) {
            this.isQuotaAlertTriggered = true;
            auditLogger.warn('STORAGE', `Guardado en memoria de emergencia para "${key}". Los datos persisten durante la sesión actual.`);
          }
          return false;
        }
      } else {
        auditLogger.error('STORAGE', `Error no relacionado con cuota al guardar "${key}"`, { error: errorStr });
        memoryFallback.set(key, serialized);
        return false;
      }
    }
  }

  /**
   * Elimina un elemento de forma segura
   */
  public removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
      memoryFallback.delete(key);
    } catch (err) {
      auditLogger.warn('STORAGE', `Error al eliminar clave "${key}"`, { error: String(err) });
    }
  }

  /**
   * Analiza el uso actual del almacenamiento por claves
   */
  public getStorageBreakdown(): StorageItemDetail[] {
    const list: StorageItemDetail[] = [];
    try {
      if (typeof window === 'undefined' || !window.localStorage) return list;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const val = localStorage.getItem(key) || '';
        const bytes = (key.length + val.length) * 2; // Aproximación UTF-16
        const isTransient = key.includes('_temp_') || key.includes('_cache_') || key.includes('recent_views');
        
        list.push({
          key,
          bytes,
          sizeFormatted: this.formatBytes(bytes),
          isTransient
        });
      }

      // Ordenar de mayor a menor tamaño
      list.sort((a, b) => b.bytes - a.bytes);
    } catch (err) {
      auditLogger.warn('STORAGE', 'Error obteniendo desglose de almacenamiento', { error: String(err) });
    }
    return list;
  }

  /**
   * Consulta la cuota estimada de almacenamiento a través del API StorageManager del navegador
   */
  public async getStorageQuota(): Promise<StorageEstimateInfo> {
    const defaultInfo: StorageEstimateInfo = {
      supported: false,
      usedBytes: 0,
      totalBytes: 0,
      usedMB: 0,
      totalMB: 0,
      percentUsed: 0,
      isPersisted: false
    };

    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
      return defaultInfo;
    }

    try {
      const estimate = await navigator.storage.estimate();
      let isPersisted = false;
      if (navigator.storage.persisted) {
        isPersisted = await navigator.storage.persisted();
      }

      const usedBytes = estimate.usage || 0;
      const totalBytes = estimate.quota || 1;
      const usedMB = Math.round((usedBytes / (1024 * 1024)) * 100) / 100;
      const totalMB = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;
      const percentUsed = Math.min(100, Math.round((usedBytes / totalBytes) * 1000) / 10);

      const info: StorageEstimateInfo = {
        supported: true,
        usedBytes,
        totalBytes,
        usedMB,
        totalMB,
        percentUsed,
        isPersisted
      };

      if (percentUsed > 85) {
        auditLogger.warn('STORAGE', `Almacenamiento PWA al ${percentUsed}% de capacidad (${usedMB} MB / ${totalMB} MB).`);
      }

      return info;
    } catch (err) {
      auditLogger.warn('STORAGE', 'No se pudo consultar navigator.storage.estimate()', { error: String(err) });
      return defaultInfo;
    }
  }

  /**
   * Solicita al navegador persistencia garantizada para evitar desalojo de caché
   */
  public async requestPersistence(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
      auditLogger.warn('PWA', 'navigator.storage.persist no está soportado en este navegador.');
      return false;
    }

    try {
      const granted = await navigator.storage.persist();
      if (granted) {
        auditLogger.info('PWA', 'Persistencia de almacenamiento concedida con éxito por el navegador.');
      } else {
        auditLogger.warn('PWA', 'El navegador no concedió persistencia automática de almacenamiento.');
      }
      return granted;
    } catch (err) {
      auditLogger.error('PWA', 'Error al solicitar persistencia de almacenamiento', { error: String(err) });
      return false;
    }
  }

  /**
   * Limpia datos temporales sin tocar proyectos ni diseños principales
   */
  public pruneTransientStorage(): number {
    let freedBytes = 0;
    try {
      if (typeof window === 'undefined' || !window.localStorage) return 0;

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.includes('_temp_') || key.includes('_cache_') || key.startsWith('tmp_')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(k => {
        const val = localStorage.getItem(k) || '';
        freedBytes += (k.length + val.length) * 2;
        localStorage.removeItem(k);
      });

      auditLogger.info('STORAGE', `Limpieza preventiva de cuota completada. Liberados: ${this.formatBytes(freedBytes)}.`);
    } catch (err) {
      auditLogger.warn('STORAGE', 'Error en pruneTransientStorage', { error: String(err) });
    }
    return freedBytes;
  }

  private parseValue<T>(raw: string, defaultValue: T): T {
    if (typeof defaultValue === 'string') {
      return raw as unknown as T;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const safeStorage = new SafeStorageManager();
