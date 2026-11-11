// ========================================================
// SISTEMA CENTRAL DE AUDITORÍA DE LOGS Y MANEJO DE EXCEPCIONES
// Diseñado para PWA: Monitorea cuota de almacenamiento, ciclo de vida SW y excepciones
// ========================================================

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type LogCategory = 'STORAGE' | 'PWA' | 'NETWORK' | 'CAD_RENDER' | 'AUTH' | 'SYSTEM' | 'EXCEPTION';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: Record<string, unknown> | string;
  stack?: string;
}

type LogListener = (logs: AuditLogEntry[]) => void;

class AuditLogger {
  private maxLogs: number = 150;
  private logs: AuditLogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private isInitialized: boolean = false;

  constructor() {
    this.initGlobalHandlers();
  }

  private initGlobalHandlers() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    // Capturar errores no controlados de scripts
    window.addEventListener('error', (event) => {
      // Ignorar errores benignos de extensiones de navegador
      if (event.filename && (event.filename.includes('chrome-extension://') || event.filename.includes('moz-extension://'))) {
        return;
      }

      this.log('ERROR', 'EXCEPTION', `Error no controlado: ${event.message || 'Error desconocido'}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }, event.error?.stack);
    });

    // Capturar promesas rechazadas no manejadas (ej. fallas de fetch en offline, storage quota, etc.)
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason || 'Promesa rechazada sin motivo');

      // Filtrar rechazos benignos esperados en modo sin conexión
      const isBenignOffline = message.includes('Failed to fetch') || 
                              message.includes('NetworkError') || 
                              message.includes('Could not reach Cloud Firestore');

      const level: LogLevel = isBenignOffline ? 'WARN' : 'ERROR';
      const category: LogCategory = isBenignOffline ? 'NETWORK' : 'EXCEPTION';

      this.log(level, category, `Promesa rechazada: ${message}`, {
        isOfflineHandling: isBenignOffline,
        stack: reason instanceof Error ? reason.stack : undefined
      }, reason instanceof Error ? reason.stack : undefined);
    });

    // Registrar inicio de auditoría
    this.log('INFO', 'SYSTEM', 'Sistema de auditoría y monitoreo PWA inicializado correctamente.');
  }

  public log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: Record<string, unknown> | string,
    stack?: string
  ) {
    const entry: AuditLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('es-PE', { hour12: false }) + `.${String(new Date().getMilliseconds()).padStart(3, '0')}`,
      level,
      category,
      message,
      details,
      stack
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Notificar a observadores UI
    this.notifyListeners();
  }

  public info(category: LogCategory, message: string, details?: Record<string, unknown> | string) {
    this.log('INFO', category, message, details);
  }

  public warn(category: LogCategory, message: string, details?: Record<string, unknown> | string) {
    this.log('WARN', category, message, details);
  }

  public error(category: LogCategory, message: string, details?: Record<string, unknown> | string, stack?: string) {
    this.log('ERROR', category, message, details, stack);
  }

  public getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.log('INFO', 'SYSTEM', 'Registro de auditoría limpiado por el usuario.');
    this.notifyListeners();
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const current = [...this.logs];
    this.listeners.forEach(fn => {
      try {
        fn(current);
      } catch {
        // Ignorar fallas en listeners
      }
    });
  }

  public exportDiagnosticReport(): string {
    const report = {
      reportDate: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      pwaStandalone: typeof window !== 'undefined' ? (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
      ) : false,
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      totalLogsRecorded: this.logs.length,
      logs: this.logs
    };
    return JSON.stringify(report, null, 2);
  }
}

export const auditLogger = new AuditLogger();
