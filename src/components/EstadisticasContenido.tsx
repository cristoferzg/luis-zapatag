// Ventana de estadísticas (solo admin): vistas de clases y aperturas/descargas de recursos.
import { useEffect, useState } from 'react';
import { X, BarChart3 } from 'lucide-react';
import { leerEstadisticas, EstadisticaContenido, TipoContenido } from '../lib/estadisticas';

export default function EstadisticasContenido({ tipoInicial, onClose }: { tipoInicial: TipoContenido; onClose: () => void }) {
  const [tipo, setTipo] = useState<TipoContenido>(tipoInicial);
  const [datos, setDatos] = useState<EstadisticaContenido[] | null>(null);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null);
  useEffect(() => { leerEstadisticas().then(setDatos).catch(() => setError('No se pudieron leer las estadísticas (¿sin internet o sin permiso?).')); }, []);
  const lista = (datos || []).filter(d => d.tipo === tipo)
    .map(d => ({ ...d, total: (d.vista || 0) + (d.apertura || 0) + (d.descarga || 0), nUsu: Object.keys(d.usuarios || {}).length }))
    .sort((a, b) => b.total - a.total);
  const max = Math.max(1, ...lista.map(d => d.total));
  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-2xl max-h-[88vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <h3 className="flex-1 text-base font-black text-slate-900">Estadísticas de contenido <span className="text-xs font-bold text-slate-400">· solo admin</span></h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1">
          {(['video', 'recurso'] as TipoContenido[]).map(t => (
            <button key={t} onClick={() => setTipo(t)} className={`flex-1 py-2 rounded-lg text-xs font-black cursor-pointer ${tipo === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
              {t === 'video' ? '🎓 Academia (clases)' : '📘 Recursos (archivos)'}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">Cuenta las visitas de los usuarios (las tuyas no) desde que se activó esta función.</p>
        {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
        {!datos && !error && <p className="text-xs text-slate-400">Cargando…</p>}
        {datos && !lista.length && <p className="text-sm text-slate-500 py-6 text-center">Aún no hay visitas registradas.</p>}
        <div className="space-y-2">
          {lista.map(d => (
            <div key={d.id} className="rounded-2xl border border-slate-200 p-3">
              <button onClick={() => setAbierto(abierto === d.id ? null : d.id)} className="w-full text-left cursor-pointer">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{d.nombre}</p>
                    {d.grupo && <p className="text-[10px] font-bold text-slate-400 truncate">{d.grupo}</p>}
                  </div>
                  <div className="text-right text-[11px] font-bold text-slate-600 shrink-0">
                    {tipo === 'video' ? <span>{d.vista || 0} vistas</span> : <span>{d.apertura || 0} abiertos · {d.descarga || 0} descargas</span>}
                    <span className="block text-slate-400">{d.nUsu} usuario{d.nUsu === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(d.total / max) * 100}%` }} /></div>
              </button>
              {abierto === d.id && (
                <div className="mt-2 space-y-1">
                  {Object.entries(d.usuarios || {}).sort((a, b) => (b[1].veces || 0) - (a[1].veces || 0)).map(([uid, u]) => (
                    <div key={uid} className="flex items-center justify-between text-[11px] bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <span className="font-bold text-slate-700 truncate">{u.nombre}</span>
                      <span className="text-slate-500 shrink-0">{u.veces} {u.veces === 1 ? 'vez' : 'veces'} · {u.ultima ? new Date(u.ultima).toLocaleDateString('es-PE') : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
