// Configuración:
//  - Admin: "Cuentas desde la app" (registro abierto, precio del pago único y datos de Yape).
//  - Usuario: "Eliminar mi cuenta" (lo exige Google Play para apps con registro).
import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Check } from 'lucide-react';
import { ConfigMembresia, leerConfigMembresia, guardarConfigMembresia, eliminarMiCuenta } from '../lib/cuentas';
import { ConfirmarBorrado } from './AccesoCuenta';
import { auth } from '../lib/firebase';

export default function CuentaMembresiaPanel({ isAdmin }: { isAdmin: boolean }) {
  return isAdmin ? <AdminMembresia /> : <EliminarCuenta />;
}

function AdminMembresia() {
  const [c, setC] = useState<ConfigMembresia>({});
  const [msg, setMsg] = useState('');
  useEffect(() => { leerConfigMembresia().then(v => setC({ precioSoles: 50, ...v })); }, []);
  const guardar = async (nuevo: ConfigMembresia) => {
    setC(nuevo);
    try { await guardarConfigMembresia(nuevo); setMsg('Guardado.'); } catch { setMsg('No se pudo guardar. Revisa tu conexión.'); }
    setTimeout(() => setMsg(''), 2500);
  };
  const abierto = c.registroAbierto === true;
  const campo = 'w-full min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800';
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex flex-nowrap items-center gap-3">
        <span className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0"><UserPlus className="w-5 h-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-800">Cuentas desde la app</h2>
          <p className="text-xs text-slate-500">Cualquiera crea su cuenta y la activa con un pago único.</p>
        </div>
        <button type="button" role="switch" aria-checked={abierto} onClick={() => guardar({ ...c, registroAbierto: !abierto })}
          className={`shrink-0 min-h-[36px] px-3 rounded-full text-[11px] font-black cursor-pointer ${abierto ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{abierto ? 'Abierto' : 'Cerrado'}</button>
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        <label className="grid gap-1 text-[11px] font-bold text-slate-500">PAGO ÚNICO (S/)
          <input type="number" min={0} step="0.1" className={campo} value={c.precioSoles ?? ''} onChange={e => setC({ ...c, precioSoles: Number(e.target.value) })} onBlur={() => guardar(c)} /></label>
        <label className="grid gap-1 text-[11px] font-bold text-slate-500">YAPE: NÚMERO
          <input className={campo} inputMode="numeric" maxLength={9} value={c.yapeNumero || ''} onChange={e => setC({ ...c, yapeNumero: e.target.value.replace(/\D/g, '') })} onBlur={() => guardar(c)} /></label>
        <label className="grid gap-1 text-[11px] font-bold text-slate-500">YAPE: A NOMBRE DE
          <input className={campo} maxLength={40} value={c.yapeNombre || ''} onChange={e => setC({ ...c, yapeNombre: e.target.value })} onBlur={() => guardar(c)} /></label>
      </div>
      <ul className="text-[11px] text-slate-500 list-disc pl-4 space-y-0.5">
        <li>Entran con <b>celular + PIN</b>. Hasta pagar solo ven la pantalla de activación (no pueden usar ni ver nada).</li>
        <li>En la web/PC ven cómo pagar y un botón que te escribe por WhatsApp ("ya pagué, necesito activación"); además queda en <b>Validar Compras</b> (tipo Membresía): al validarla, la cuenta se activa.</li>
        <li>En la app de Android no se habla de pagos (regla de Google Play): ahí no aparece "Crear cuenta" y una cuenta sin activar solo ve "pendiente de activación".</li>
        <li>Los usuarios que creas tú siguen entrando con su PIN, sin pagar.</li>
      </ul>
      {msg && <p className="text-xs font-bold text-emerald-700 flex items-center gap-1"><Check className="w-4 h-4" /> {msg}</p>}
    </div>
  );
}

function EliminarCuenta() {
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const borrar = async () => {
    setOcupado(true); setError('');
    try {
      await eliminarMiCuenta();
      try { await auth.signOut(); } catch { /* nada */ }
      try { localStorage.clear(); } catch { /* nada */ }
      window.location.reload();
    } catch (e: any) {
      setError(/CONFIRMA_PIN|unauth/i.test(`${e?.message} ${e?.code}`) ? 'Confirma tu PIN (cierra sesión y vuelve a entrar) y repite.' : 'No se pudo eliminar. Revisa tu conexión.');
      setOcupado(false);
    }
  };
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex flex-nowrap items-center gap-3">
        <span className="p-2 bg-rose-50 text-rose-600 rounded-xl shrink-0"><Trash2 className="w-5 h-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-slate-800">Eliminar mi cuenta</h2>
          <p className="text-xs text-slate-500">Borra tu cuenta y todos tus datos de la nube.</p>
        </div>
        {!abierto && <button onClick={() => setAbierto(true)} className="shrink-0 min-h-[36px] px-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer">Eliminar</button>}
      </div>
      {abierto && <ConfirmarBorrado ocupado={ocupado} onSi={borrar} onNo={() => setAbierto(false)} />}
      {error && <p className="text-xs font-bold text-rose-700">{error}</p>}
    </div>
  );
}
