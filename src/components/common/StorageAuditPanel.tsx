import React, { useState, useEffect } from 'react';
import { 
  Database, HardDrive, ShieldCheck, 
  Trash2, Download, RefreshCw, CheckCircle2,
  Info, Activity, Zap, Layers
} from 'lucide-react';
import { safeStorage, StorageEstimateInfo, StorageItemDetail } from '../../lib/storageManager';
import { auditLogger, AuditLogEntry } from '../../lib/auditLogger';

export const StorageAuditPanel: React.FC = () => {
  const [quota, setQuota] = useState<StorageEstimateInfo>({
    supported: false,
    usedBytes: 0,
    totalBytes: 0,
    usedMB: 0,
    totalMB: 0,
    percentUsed: 0,
    isPersisted: false
  });
  const [items, setItems] = useState<StorageItemDetail[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPersisting, setIsPersisting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const refreshData = async () => {
    const q = await safeStorage.getStorageQuota();
    setQuota(q);
    const breakdown = safeStorage.getStorageBreakdown();
    setItems(breakdown);
    setLogs(auditLogger.getLogs());
  };

  useEffect(() => {
    refreshData();

    // Suscribirse a nuevos logs en tiempo real
    const unsubscribe = auditLogger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRequestPersistence = async () => {
    setIsPersisting(true);
    const granted = await safeStorage.requestPersistence();
    await refreshData();
    setIsPersisting(false);
    showNotice(granted 
      ? '¡Persistencia garantizada concedida por el navegador!' 
      : 'El navegador no concedió persistencia automática; los datos seguirán respaldados localmente.'
    );
  };

  const handlePruneStorage = () => {
    const freed = safeStorage.pruneTransientStorage();
    refreshData();
    showNotice(freed > 0 
      ? `Se liberaron ${safeStorage.formatBytes(freed)} de almacenamiento temporal.` 
      : 'El almacenamiento ya se encuentra optimizado sin datos residuales.'
    );
  };

  const handleExportLogs = () => {
    try {
      const data = auditLogger.exportDiagnosticReport();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria-logs-innova-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotice('Informe de diagnóstico exportado exitosamente.');
    } catch {
      showNotice('Error al exportar el informe de auditoría.');
    }
  };

  const handleClearLogs = () => {
    auditLogger.clearLogs();
    refreshData();
    showNotice('Registro de auditoría limpiado.');
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.message.toLowerCase().includes(q) ||
      log.category.toLowerCase().includes(q) ||
      (typeof log.details === 'string' && log.details.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>Auditoría de Almacenamiento, Caché PWA y Logs</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                En Línea & Blindado
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisión de cuota de almacenamiento, control de persistencia y registro de excepciones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
          <button
            onClick={handlePruneStorage}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Purga datos temporales sin alterar proyectos guardados"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Optimizar Almacenamiento</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Grid de Métricas de Cuota */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Estimación de Cuota del Navegador (StorageManager) */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>Cuota PWA / Navegador</span>
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {quota.supported ? `${quota.percentUsed}% Usado` : 'Almacenamiento Local'}
            </span>
          </div>

          <div>
            <div className="text-2xl font-bold font-mono">
              {quota.supported ? `${quota.usedMB} MB` : 'Activo'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {quota.supported 
                ? `de ${quota.totalMB >= 1024 ? (quota.totalMB / 1024).toFixed(1) + ' GB' : quota.totalMB + ' MB'} asignados`
                : 'Límite local seguro gestionado con fallback'}
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                quota.percentUsed > 85 ? 'bg-rose-500' : quota.percentUsed > 60 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.max(quota.percentUsed, 2)}%` }}
            />
          </div>
        </div>

        {/* Persistencia de Almacenamiento */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Garantía de Persistencia</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              quota.isPersisted 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {quota.isPersisted ? 'Blindado (Persistente)' : 'Estándar'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {quota.isPersisted 
              ? 'El navegador no desalojará la caché ni los proyectos guardados aunque el dispositivo esté con poco espacio.'
              : 'Solicita persistencia para evitar que el navegador limpie la caché en limpiezas automáticas de almacenamiento.'}
          </p>

          {!quota.isPersisted && (
            <button
              onClick={handleRequestPersistence}
              disabled={isPersisting}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isPersisting ? 'Solicitando...' : 'Activar Persistencia PWA'}</span>
            </button>
          )}
        </div>

        {/* Resumen de Módulos Almacenados */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Módulos en Caché Local</span>
          </span>

          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 text-xs">
            {items.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-700 truncate max-w-[170px]" title={item.key}>
                  {item.key.replace('innova_', '')}
                </span>
                <span className="font-mono text-[11px] font-semibold text-slate-500">
                  {item.sizeFormatted}
                </span>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-xs text-slate-400 italic">No hay claves registradas aún.</p>
            )}
          </div>
        </div>
      </div>

      {/* Visor de Auditoría de Logs en Tiempo Real */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 space-y-4 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm sm:text-base">
              Registro de Auditoría y Excepciones ({filteredLogs.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtros de nivel */}
            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px] font-medium">
              {(['ALL', 'ERROR', 'WARN', 'INFO'] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterLevel === lvl 
                      ? 'bg-blue-600 text-white font-bold' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl === 'ALL' ? 'Todos' : lvl}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportLogs}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Descargar registro de logs en formato JSON"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar JSON</span>
            </button>

            <button
              onClick={handleClearLogs}
              className="p-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700 rounded-lg transition-colors"
              title="Limpiar registro"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Buscador de logs */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en logs por mensaje, categoría o detalle..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Lista de logs */}
        <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-[11px] pr-1">
          {filteredLogs.map(log => {
            const isError = log.level === 'ERROR';
            const isWarn = log.level === 'WARN';
            return (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border transition-all ${
                  isError 
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-200' 
                    : isWarn
                    ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                    : 'bg-slate-950/70 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isError 
                        ? 'bg-rose-600 text-white' 
                        : isWarn 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-blue-600/80 text-white'
                    }`}>
                      {log.level}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-semibold">
                      {log.category}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {log.timestamp}
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 font-sans text-xs">
                  {log.message}
                </div>

                {log.details && (
                  <pre className="mt-1.5 p-2 bg-black/40 rounded-lg text-[10px] overflow-x-auto text-slate-400">
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                  </pre>
                )}

                {log.stack && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-[10px] text-slate-500 hover:text-slate-300">
                      Ver Stack Trace
                    </summary>
                    <pre className="mt-1 p-2 bg-black/50 rounded-lg text-[10px] text-rose-300 overflow-x-auto">
                      {log.stack}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs font-sans">
              No hay logs que coincidan con el filtro actual.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
