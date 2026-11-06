// =============================================================================
// Panel de ADMIN para configurar los PLANES (precio mensual/anual y créditos
// al mes) y las RECARGAS de créditos. Se guardan en la nube (config_ia/planes)
// y el servidor los usa para recargar y cobrar.
// =============================================================================
import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { Sparkles, Save, Check, Coins } from 'lucide-react';
import { AIPlan, PackCreditos, COSTO_CREDITOS, getConfigIA, setConfigIA, PLANES_IA_DEFAULT, PACKS_CREDITOS_DEFAULT, cargarEstadoIA, setIAHabilitadaUsuarios, setComprasEnApp, setPagosGooglePlay } from '../lib/aiAccess';
import { comprasEnAppActivas, pagosPlayActivos } from '../lib/plataforma';
import { idProductoPack, idProductoPlan } from '../lib/pagosPlay';
import { simb, enMoneda, aSoles } from '../lib/currency';
import CampoNumero from './CampoNumero';
import InputNumero from './common/InputNumero';

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
  const [enApp, setEnApp] = useState(comprasEnAppActivas());
  const [conPlay, setConPlay] = useState(pagosPlayActivos());
  useEffect(() => { getConfigIA().then(c => { setPlanes(c.planes); setPacks(c.packs); }); cargarEstadoIA().then(v => { setActiva(v); setEnApp(comprasEnAppActivas()); setConPlay(pagosPlayActivos()); }); }, []);

  const cambiarActiva = async (v: boolean) => {
    setError(null);
    try { await setIAHabilitadaUsuarios(v); setActiva(v); setConfirmar(false); }
    catch (e) { setError(await motivoError(e, 'activar')); }
  };

  // Si el servidor niega el permiso, se revisa la sesión para decir la causa real.
  const motivoError = async (e: any, accion: string): Promise<string> => {
    if (!/permission|insufficient/i.test(String(e?.code || e?.message || ''))) return `No se pudo ${accion}. Revisa tu conexión e intenta de nuevo.`;
    const u = auth.currentUser;
    if (!u || u.isAnonymous) return `No se pudo ${accion}: tu sesión es antigua y no tiene permiso de administrador. Cierra sesión y vuelve a entrar con tu PIN de administrador.`;
    const rol = (await u.getIdTokenResult().catch(() => null))?.claims?.role;
    if (rol !== 'admin') return `No se pudo ${accion}: tu sesión no es de administrador. Cierra sesión y entra con el PIN de administrador. Si sigue igual, el PIN guardado en el servidor (ADMIN_PIN) es distinto.`;
    return `No se pudo ${accion}: el servidor no tiene las reglas nuevas. Ejecuta "firebase deploy --only firestore:rules".`;
  };

  const updPlan = (i: number, p: Partial<AIPlan>) => { setPlanes(prev => prev.map((x, k) => k === i ? { ...x, ...p } : x)); setGuardado(false); };
  const updPack = (i: number, p: Partial<PackCreditos>) => { setPacks(prev => prev.map((x, k) => k === i ? { ...x, ...p } : x)); setGuardado(false); };
  const n = (v: string) => Math.max(0, parseFloat(v) || 0);

  const guardar = async () => {
    setGuardando(true); setError(null);
    try { await setConfigIA(planes, packs.map(k => ({ ...k, id: `p${k.creditos}` }))); setGuardado(true); }
    catch (e) { setError(await motivoError(e, 'guardar')); }
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
            {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}
          </div>
        )}
      </div>

      {/* Interruptor: compras dentro de la app de Android */}
      <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${enApp ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div>
          <p className="text-sm font-black text-slate-800">Compras dentro de la app de Android: {enApp ? <span className="text-emerald-700">PERMITIDAS</span> : <span className="text-slate-500">SOLO EN LA WEB</span>}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {enApp ? 'Desde la app se pueden pedir planes, recargas, cursos y recursos (pago por WhatsApp/Yape). Apágalo si publicas la app en Play Store: Google exige su propio cobro.' : 'En la app solo se ve el saldo; para comprar hay que entrar a la web.'}
          </p>
        </div>
        <button onClick={async () => { setError(null); try { await setComprasEnApp(!enApp); setEnApp(!enApp); } catch (e) { setError(await motivoError(e, 'cambiar las compras en la app')); } }}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-black cursor-pointer ${enApp ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
          {enApp ? 'Solo en la web' : 'Permitir en la app'}
        </button>
      </div>

      {/* Interruptor: cobrar con Google Play en la app de Android */}
      <div className={`rounded-2xl border p-4 grid gap-2 ${conPlay ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800">Cobrar con Google Play en la app: {conPlay ? <span className="text-emerald-700">ACTIVO</span> : <span className="text-slate-500">APAGADO</span>}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{conPlay ? 'En la app de Android los planes y recargas se pagan con Google Play y se cargan solos (nunca por WhatsApp/Yape). En la web y la PC sigue igual.' : 'Actívalo cuando los productos ya estén creados y activos en Play Console.'}</p>
          </div>
          <button onClick={async () => { setError(null); try { await setPagosGooglePlay(!conPlay); setConPlay(!conPlay); } catch (e) { setError(await motivoError(e, 'cambiar el cobro con Google Play')); } }}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-black cursor-pointer ${conPlay ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
            {conPlay ? 'Apagar' : 'Activar Google Play'}
          </button>
        </div>
        <details className="text-[11px] text-slate-600">
          <summary className="font-bold cursor-pointer">IDs que debes crear en Play Console</summary>
          <p className="mt-1">Productos integrados (consumibles): {packs.map(k => <b key={k.id} className="font-mono mr-2">{idProductoPack(k.creditos)}</b>)}</p>
          <p>Suscripciones (plan base <b className="font-mono">mensual</b>{planes.some(p => p.precioAnualSoles) ? <> y <b className="font-mono">anual</b> en Empresa</> : null}): {planes.filter(p => p.precioSoles > 0).map(p => <b key={p.id} className="font-mono mr-2">{idProductoPlan(p.id)}</b>)}</p>
          <p>Si cambias un precio aquí, cámbialo también en Play Console (en la app se cobra el de Google).</p>
        </details>
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
                <label className={etiqueta}>{simb()} al mes</label>
                <CampoNumero step={0.1} min={0} value={enMoneda(p.precioSoles)} disabled={p.id === 'gratis'} onCommit={v => updPlan(i, { precioSoles: aSoles(v || 0) })} className={campo} />
              </div>
              <div>
                <label className={etiqueta}>{simb()} al año</label>
                <CampoNumero step={1} min={0} value={p.precioAnualSoles ? enMoneda(p.precioAnualSoles) : undefined} permitirVacio placeholder="—" disabled={p.id === 'gratis'} onCommit={v => updPlan(i, { precioAnualSoles: v ? aSoles(v) : undefined })} className={campo} />
              </div>
            </div>
            <div>
              <label className={etiqueta}>Créditos al mes</label>
              <InputNumero type="number" step="1" min="0" value={p.creditosMes} onChange={e => updPlan(i, { creditosMes: Math.round(n(e.target.value)) })} className={campo} />
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
              <div><label className={etiqueta}>Créditos</label><InputNumero type="number" min="1" value={k.creditos} onChange={e => updPack(i, { creditos: Math.round(n(e.target.value)) })} className={campo} /></div>
              <div><label className={etiqueta}>Precio {simb()}</label><CampoNumero step={0.1} min={0} value={enMoneda(k.precioSoles)} onCommit={v => updPack(i, { precioSoles: aSoles(v || 0) })} className={campo} /></div>
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
