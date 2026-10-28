// Datos de la empresa del usuario para cotizaciones, planos y contratos.
// Salen de ⚙ Configuración; si falta alguno, el documento deja escribirlo y
// lo guarda en la misma configuración (no se inventan RUC ni teléfonos).
import { createContext, useContext, useState } from 'react';

export interface DatosEmpresa {
  nombre: string;
  ruc: string;
  telefono: string;
  direccion: string;
  email: string;
  logo: string;
  // Plantilla de presupuesto (opcional)
  colorMarca: string;     // color de la banda de los documentos
  adelantoPct: string;    // % de adelanto para empezar
  validezDias: string;    // validez de la cotización
  garantia: string;       // texto de garantía
  condiciones: string;    // otras condiciones (una por línea)
}

interface Ctx { datos: DatosEmpresa; guardar: (p: Partial<DatosEmpresa>) => void }

const vacio: DatosEmpresa = { nombre: '', ruc: '', telefono: '', direccion: '', email: '', logo: '', colorMarca: '', adelantoPct: '', validezDias: '', garantia: '', condiciones: '' };
const EmpresaContext = createContext<Ctx>({ datos: vacio, guardar: () => {} });

export const EmpresaProvider = EmpresaContext.Provider;
export const useEmpresa = () => useContext(EmpresaContext);

export function datosDesdeSettings(s: any): DatosEmpresa {
  return {
    nombre: s?.appName || '', ruc: s?.contratistaDni || '', telefono: s?.contratistaPhone || '',
    direccion: s?.contratistaDir || '', email: s?.contratistaEmail || '', logo: s?.logoBase64 || '',
    colorMarca: s?.docColor || '', adelantoPct: s?.docAdelantoPct || '', validezDias: s?.docValidezDias || '',
    garantia: s?.docGarantia || '', condiciones: s?.docCondiciones || '',
  };
}

export function settingsDesdeDatos(p: Partial<DatosEmpresa>): Record<string, string> {
  const o: Record<string, string> = {};
  if (p.nombre !== undefined) o.appName = p.nombre;
  if (p.ruc !== undefined) o.contratistaDni = p.ruc;
  if (p.telefono !== undefined) o.contratistaPhone = p.telefono;
  if (p.direccion !== undefined) o.contratistaDir = p.direccion;
  if (p.email !== undefined) o.contratistaEmail = p.email;
  if (p.colorMarca !== undefined) o.docColor = p.colorMarca;
  if (p.adelantoPct !== undefined) o.docAdelantoPct = p.adelantoPct;
  if (p.validezDias !== undefined) o.docValidezDias = p.validezDias;
  if (p.garantia !== undefined) o.docGarantia = p.garantia;
  if (p.condiciones !== undefined) o.docCondiciones = p.condiciones;
  return o;
}

// Cabecera de documento: nombre, RUC, celular y dirección. Los campos vacíos
// se muestran como casillas para completar (no se imprimen si quedan vacíos).
export function CabeceraEmpresa({ subtitulo, oscuro = false }: { subtitulo?: string; oscuro?: boolean }) {
  const { datos, guardar } = useEmpresa();
  const [edit, setEdit] = useState<Partial<DatosEmpresa>>({});
  const v = { ...datos, ...edit };
  const faltan = !datos.nombre || !datos.ruc || !datos.telefono;
  const [editando, setEditando] = useState(false);
  const cambiado = Object.keys(edit).length > 0;
  const campo = (k: keyof DatosEmpresa, ph: string, cls = '') => (
    <input value={v[k]} onChange={e => setEdit(p => ({ ...p, [k]: e.target.value }))} placeholder={ph}
      className={`no-imprimir-vacio bg-transparent border-b border-dashed ${oscuro ? 'border-slate-600 text-slate-100' : 'border-amber-400 text-slate-800'} focus:outline-none px-0.5 ${cls}`} />
  );
  const texto = oscuro ? 'text-slate-400' : 'text-slate-500';
  if (editando || faltan) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          {campo('nombre', 'Nombre de tu empresa', 'text-2xl font-black tracking-tight w-full max-w-md')}
        </div>
        {subtitulo && <p className={`text-xs font-bold ${oscuro ? 'text-slate-300' : 'text-slate-600'}`}>{subtitulo}</p>}
        <div className={`flex flex-wrap gap-x-3 gap-y-1 text-[11px] ${texto}`}>
          <span>RUC: {campo('ruc', 'tu RUC', 'w-28')}</span>
          <span>Cel: {campo('telefono', 'tu celular', 'w-28')}</span>
          <span>{campo('direccion', 'tu dirección', 'w-48')}</span>
        </div>
        <div className="no-imprimir flex items-center gap-2 pt-1">
          <button onClick={() => { guardar(edit); setEdit({}); setEditando(false); }} disabled={!cambiado}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black cursor-pointer disabled:opacity-40">Guardar como datos de mi empresa</button>
          {!faltan && <button onClick={() => { setEdit({}); setEditando(false); }} className="text-[11px] font-bold text-slate-400 cursor-pointer">Cancelar</button>}
          <span className="text-[10px] text-slate-400">Se guardan en ⚙ Configuración y se usan en todas tus cotizaciones.</span>
        </div>
      </div>
    );
  }
  return (
    <div className="group">
      <h1 className={`text-2xl font-black tracking-tight ${oscuro ? 'text-white' : 'text-slate-900'}`}>{datos.nombre}</h1>
      {subtitulo && <p className={`text-xs font-bold ${oscuro ? 'text-slate-300' : 'text-slate-600'}`}>{subtitulo}</p>}
      <p className={`text-[11px] ${texto}`}>
        {[datos.ruc && `RUC: ${datos.ruc}`, datos.telefono && `Cel: ${datos.telefono}`, datos.direccion].filter(Boolean).join(' | ')}
        <button onClick={() => setEditando(true)} className="no-imprimir ml-2 text-[10px] font-bold text-amber-600 opacity-60 group-hover:opacity-100 cursor-pointer">Editar</button>
      </p>
    </div>
  );
}


// ── Plantilla de presupuesto: color de marca y condiciones comerciales ──────
export const COLOR_MARCA_DEFECTO = '#f59e0b';
export const colorMarcaDe = (d: DatosEmpresa) => d.colorMarca || COLOR_MARCA_DEFECTO;
export const condicionesDe = (d: DatosEmpresa) => ({
  adelantoPct: Math.min(100, Math.max(0, parseFloat(d.adelantoPct) || 50)),
  validezDias: Math.max(1, parseInt(d.validezDias) || 15),
  garantia: d.garantia || '12 meses en estructura y montaje, contra defectos de fabricación.',
  condiciones: (d.condiciones || 'Precios en soles.\nNo incluye obras civiles ni trámites municipales, salvo que se indique.')
    .split('\n').map(x => x.trim()).filter(Boolean),
});

/** Banda superior con el color de la empresa (sale en el PDF). */
export function BandaMarca() {
  const { datos } = useEmpresa();
  return <div className="h-2 rounded-full mb-4" style={{ background: colorMarcaDe(datos) }} />;
}

const PALETA_MARCA = ['#f59e0b', '#ea580c', '#dc2626', '#16a34a', '#0d9488', '#2563eb', '#4f46e5', '#7c3aed', '#0f172a'];

/** Condiciones comerciales: adelanto y saldo, validez, garantía y notas. Editables (se guardan en Configuración). */
export function CondicionesComerciales({ total, moneda = 'S/' }: { total: number; moneda?: string }) {
  const { datos, guardar } = useEmpresa();
  const c = condicionesDe(datos);
  const [editando, setEditando] = useState(false);
  const [e, setE] = useState<Partial<DatosEmpresa>>({});
  const v = { ...datos, ...e };
  const S = (n: number) => `${moneda} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const adelanto = (total * c.adelantoPct) / 100;
  const color = colorMarcaDe(datos);
  const inp = 'w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800';
  return (
    <div className="mt-6 rounded-xl border border-slate-200 p-4 text-xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-black uppercase text-[11px]" style={{ color }}>Condiciones comerciales</p>
        <button onClick={() => { setE({}); setEditando(x => !x); }} className="no-imprimir text-[10px] font-bold text-amber-600 cursor-pointer">{editando ? 'Cerrar' : 'Editar plantilla'}</button>
      </div>
      {editando ? (
        <div className="no-imprimir space-y-2">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Color de tu marca</p>
            <div className="flex flex-wrap gap-1.5">
              {PALETA_MARCA.map(col => (
                <button key={col} onClick={() => setE(p => ({ ...p, colorMarca: col }))} className={`w-7 h-7 rounded-full border-2 cursor-pointer ${(v.colorMarca || COLOR_MARCA_DEFECTO) === col ? 'border-slate-900' : 'border-white'}`} style={{ background: col }} aria-label={col} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Adelanto %<input className={inp} inputMode="decimal" value={v.adelantoPct} placeholder="50" onChange={x => setE(p => ({ ...p, adelantoPct: x.target.value }))} /></label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Validez (días)<input className={inp} inputMode="numeric" value={v.validezDias} placeholder="15" onChange={x => setE(p => ({ ...p, validezDias: x.target.value }))} /></label>
          </div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase">Garantía<input className={inp} value={v.garantia} placeholder={c.garantia} onChange={x => setE(p => ({ ...p, garantia: x.target.value }))} /></label>
          <label className="block text-[10px] font-bold text-slate-500 uppercase">Otras condiciones (una por línea)<textarea rows={3} className={inp} value={v.condiciones} placeholder={c.condiciones.join('\n')} onChange={x => setE(p => ({ ...p, condiciones: x.target.value }))} /></label>
          <button onClick={() => { guardar(e); setE({}); setEditando(false); }} className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black cursor-pointer">Guardar plantilla</button>
          <span className="ml-2 text-[10px] text-slate-400">Se usa en todos tus presupuestos.</span>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-500">Adelanto para empezar ({c.adelantoPct}%)</span><b className="block font-mono text-sm">{S(adelanto)}</b></div>
            <div className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-500">Saldo al terminar ({100 - c.adelantoPct}%)</span><b className="block font-mono text-sm">{S(total - adelanto)}</b></div>
          </div>
          <ul className="space-y-0.5 text-[11px] text-slate-600">
            <li>· Validez de la cotización: <b>{c.validezDias} días</b> (hasta el {new Date(Date.now() + c.validezDias * 86400000).toLocaleDateString('es-PE')}).</li>
            <li>· Garantía: {c.garantia}</li>
            {c.condiciones.map((t, i) => <li key={i}>· {t}</li>)}
          </ul>
          <div className="grid grid-cols-2 gap-6 pt-6 text-[10px] text-slate-500 text-center">
            <div className="border-t border-slate-300 pt-1">{datos.nombre || 'La empresa'}</div>
            <div className="border-t border-slate-300 pt-1">Conformidad del cliente</div>
          </div>
        </>
      )}
    </div>
  );
}
