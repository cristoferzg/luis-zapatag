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
}

interface Ctx { datos: DatosEmpresa; guardar: (p: Partial<DatosEmpresa>) => void }

const vacio: DatosEmpresa = { nombre: '', ruc: '', telefono: '', direccion: '', email: '', logo: '' };
const EmpresaContext = createContext<Ctx>({ datos: vacio, guardar: () => {} });

export const EmpresaProvider = EmpresaContext.Provider;
export const useEmpresa = () => useContext(EmpresaContext);

export function datosDesdeSettings(s: any): DatosEmpresa {
  return {
    nombre: s?.appName || '', ruc: s?.contratistaDni || '', telefono: s?.contratistaPhone || '',
    direccion: s?.contratistaDir || '', email: s?.contratistaEmail || '', logo: s?.logoBase64 || '',
  };
}

export function settingsDesdeDatos(p: Partial<DatosEmpresa>): Record<string, string> {
  const o: Record<string, string> = {};
  if (p.nombre !== undefined) o.appName = p.nombre;
  if (p.ruc !== undefined) o.contratistaDni = p.ruc;
  if (p.telefono !== undefined) o.contratistaPhone = p.telefono;
  if (p.direccion !== undefined) o.contratistaDir = p.direccion;
  if (p.email !== undefined) o.contratistaEmail = p.email;
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
