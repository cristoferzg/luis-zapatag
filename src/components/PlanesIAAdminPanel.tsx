// =============================================================================
// Panel de ADMIN para configurar los PLANES (precio mensual/anual y créditos
// al mes) y las RECARGAS de créditos. Se guardan en la nube (config_ia/planes)
// y el servidor los usa para recargar y cobrar.
// =============================================================================
import { useEffect, useState } from 'react';
import { Sparkles, Save, Check, Coins } from 'lucide-react';
import { AIPlan, PackCreditos, COSTO_CREDITOS, getConfigIA, setConfigIA, PLANES_IA_DEFAULT, PACKS_CREDITOS_DEFAULT, cargarEstadoIA, setIAHabilitadaUsuarios } from '../lib/aiAccess';

const campo = 'w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-amber-400 outline-none bg-white';
const etiqueta = 'text-[11px] font-bold text-slate-500 uppercase tracking-wide';

export default function PlanesIAAdminPanel() {
  const [planes, setPlanes] = useState<AIPlan[]>(PLANES_IA_DEFAULT);
  const [packs, setPacks] = useState<PackCreditos[]>(PACKS_CREDITOS_DEFAULT);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activa, setActiva] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  useEffect(() => { getConfigIA().then(c => { setPlanes(c.planes); setPacks(c.packs); }); cargarEstadoIA().then(setActiva); }, []);

  const cambiarActiva = async (v: boolean) => {
    setError(null);
    try { await setIAHabilitadaUsuarios(v); setActiva(v); setConfirmar(false); }
    catch (e) { setError(motivoError(e, 'cambiar')); }
  };

  // Permiso denegado siendo admin = faltan publicar las reglas de Firestore (config_ia).
  const motivoError = (e: any, accion: string) => /permission|insufficient/i.test(String(e?.code || e?.message || ''))
    ? `No se pudo ${accion}: el servidor aún no tiene las reglas nuevas. Desde tu PC ejecuta "firebase deploy --only firestore:rules" y vuelve a intentar.`
    : `No se pudo ${accion}. Revisa tu conexión e intenta de nuevo.`;

  const updPlan = (i: number, p: Partial<AIPlan>) => { setPlanes(prev => prev.map((x, k) => k === i ? { ...x, ...p } : x)); setGuardado(false); };
  const updPack = (i: number, p: Partial<PackCreditos>) => { setPacks(prev => prev.map((x, k) => k === i ? { ...x, ...p } : x)); setGuardado(false); };
  const n = (v: string) => Math.max(0, parseFloat(v) || 0);

  const guardar = async () => {
    setGuardando(true); setError(null);
    try { await setConfigIA(planes, packs.map(k => ({ ...k, id: `p${k.creditos}` }))); setGuardado(true); }
    catch (e) { setError(motivoError(e, 'guardar')); }
    finally { setGuardando(false); }
  };

  return (
    <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5 animate-fadeIn">
      <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-xl"><Sparkles className="w-5 h-5" /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Planes y créditos</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cada acción gasta créditos: boleta sin QR = {COSTO_CREDITOS.boleta}, plano a mano = {COSTO_CREDITOS.croquis}. Los créditos del plan se recargan cada mes; las recargas no vencen.
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">Solo Administrador</span>
      </div>

      {/* Interruptor: IA para usuarios */}
      <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${activa ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div>
          <p className="text-sm font-black text-slate-800">Funciones inteligentes para usuarios: {activa ? <span className="text-emerald-700">ACTIVADAS</span> : <span className="text-slate-500">APAGADAS</span>}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {activa ? 'Los usuarios ven sus créditos y los planes, y pueden leer boletas y planos.' : 'Solo tú las usas. Los usuarios no ven planes ni créditos. Actívalas cuando tengas saldo en la API y hayas desplegado funciones y reglas.'}
          </p>
        </div>
        {!confirmar ? (
          <button onClick={() => activa ? cambiarActiva(false) : setConfirmar(true)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-black cursor-pointer ${activa ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
            {activa ? 'Apagar' : 'Activar para usuarios'}
          </button>
        ) : (
          <div className="shrink-0 bg-white border border-amber-300 rounded-xl p-3 space-y-2 max-w-sm">
            <p className="text-[11px] text-amber-800 font-bold">¿Ya cargaste saldo en la API, guardaste la clave y desplegaste con “firebase deploy --only hosting,functions,firestore:rules”? Si no, los usuarios verán errores.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmar(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold cursor-pointer">Cancelar</button>
              <button onClick={() => cambiarActiva(true)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-black cursor-pointer">Sí, activar</button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {planes.map((p, i) => (
          <div key={p.id} className={`p-4 border rounded-2xl space-y-3 ${p.destacado ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50'}`}>
            <div>
              <label className={etiqueta}>Nombre</label>
              <input value={p.nombre} onChange={e => updPlan(i, { nombre: e.target.value })} className={campo} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={etiqueta}>S/ al mes</label>
                <input type="number" step="0.10" min="0" value={p.precioSoles} disabled={p.id === 'gratis'} onChange={e => updPlan(i, { precioSoles: n(e.target.value) })} className={campo} />
              </div>
              <div>
                <label className={etiqueta}>S/ al año</label>
                <input type="number" step="1" min="0" value={p.precioAnualSoles || ''} placeholder="—" disabled={p.id === 'gratis'} onChange={e => updPlan(i, { precioAnualSoles: n(e.target.value) || undefined })} className={campo} />
              </div>
            </div>
            <div>
              <label className={etiqueta}>Créditos al mes</label>
              <input type="number" step="1" min="0" value={p.creditosMes} onChange={e => updPlan(i, { creditosMes: Math.round(n(e.target.value)) })} className={campo} />
              <p className="text-[10px] text-slate-400 mt-1">≈ {p.creditosMes} boletas o {Math.floor(p.creditosMes / COSTO_CREDITOS.croquis)} planos</p>
            </div>
            {p.id !== 'gratis' && (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={!!p.destacado} onChange={e => setPlanes(prev => prev.map((x, k) => ({ ...x, destacado: k === i ? e.target.checked : (e.target.checked ? false : x.destacado) })))} />
                Marcar como “Más elegido”
              </label>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border border-slate-200 rounded-2xl space-y-3">
        <p className="text-sm font-black text-slate-800 flex items-center gap-2"><Coins className="w-4 h-4 text-amber-500" />Recargas de créditos</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {packs.map((k, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <div><label className={etiqueta}>Créditos</label><input type="number" min="1" value={k.creditos} onChange={e => updPack(i, { creditos: Math.round(n(e.target.value)) })} className={campo} /></div>
              <div><label className={etiqueta}>Precio S/</label><input type="number" step="0.10" min="0" value={k.precioSoles} onChange={e => updPack(i, { precioSoles: n(e.target.value) })} className={campo} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={guardar} disabled={guardando}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-2xs ${guardado ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'} disabled:opacity-60`}>
          {guardado ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {guardando ? 'Guardando…' : guardado ? 'Guardado' : 'Guardar planes'}
        </button>
        {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
        <p className="text-xs text-slate-500">Tú (admin) no gastas créditos. Los pedidos de los usuarios llegan a “Validar Compras”.</p>
      </div>
    </div>
  );
}
