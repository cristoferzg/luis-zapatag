// =============================================================================
// Catálogo de precios (menú "Precios").
//   • Mis precios: un precio por producto, en su unidad de compra, que usan
//     Techos, CarpiMetal, Obra Civil y Drywall. Si cambias un precio aquí (o en
//     cualquiera de esos apartados) cambia en todos.
//   • Referencia de mercado: la tabla comparativa de siempre.
// =============================================================================
import { useMemo, useState } from 'react';
import { Search, RotateCcw, Users, Tag } from 'lucide-react';
import { itemsCatalogo, useCatalogo, precio, fijarPrecio, quitarPrecio, importarJornales, GrupoCatalogo } from '../lib/catalogoPrecios';
import { PreciosView } from './PreciosView';

// Búsqueda tolerante: sin tildes, "40x40x2" = "40 × 40 × 2", medidas en
// pulgadas ("2x2" = 50 × 50 mm), las medidas repetidas cuentan ("40x40" pide
// dos lados de 40) y los números se comparan enteros (2 no encuentra 25).
const normal = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/×/g, 'x').replace(/,/g, '.')
  .replace(/(\d)\s*x\s*(?=\d)/g, '$1 ').replace(/(\d)\s*(mm|m)\b/g, '$1 $2').replace(/1 1\/2/g, '1.5').replace(/3\/4/g, '0.75').replace(/1\/2/g, '0.5');
const PULGADA_MM: Record<string, string[]> = { '0.5': ['13', '12.7'], '0.75': ['19', '20'], '1': ['25'], '1.5': ['38', '40'], '2': ['50'], '2.5': ['65'], '3': ['75'], '4': ['100'], '6': ['150'], '8': ['200'] };
const esNum = (t: string) => /^\d+(\.\d+)?$/.test(t);
function tokensBusqueda(q: string) { return normal(q).split(/[\s"']+/).filter(Boolean); }
const numerosDe = (t: string) => (normal(t).match(/\d+(\.\d+)?/g) || []).map(Number);
// Empareja cada medida buscada con una medida distinta del producto: primero
// iguales, luego pulgadas → mm y, si se permite, medidas cercanas (±8%).
function emparejar(pedidas: number[], tiene: number[], cerca: boolean): number {
  const libres = [...tiene];
  let pts = 0;
  const quitar = (f: (d: number) => boolean) => { const i = libres.findIndex(f); if (i < 0) return false; libres.splice(i, 1); return true; };
  const pend: number[] = [];
  for (const q of pedidas) if (quitar(d => d === q)) pts += 3; else pend.push(q);
  const pend2: number[] = [];
  for (const q of pend) { const mm = (PULGADA_MM[String(q)] || []).map(Number); if (mm.length && quitar(d => mm.includes(d))) pts += 2; else pend2.push(q); }
  for (const q of pend2) { if (cerca && q >= 10 && quitar(d => Math.abs(d - q) <= Math.max(2, q * 0.08))) pts += 1; else return 0; }
  return pts;
}
// 0 = no coincide; mayor = más relevante.
function puntaje(nombre: string, extra: string, tokens: string[], cerca: boolean): number {
  const hn = ` ${normal(nombre).replace(/[()"/·,]/g, ' ')} `;
  const h = `${hn} ${normal(extra).replace(/[()"/·,]/g, ' ')} `;
  const palabras = tokens.filter(t => !esNum(t));
  if (!palabras.every(t => h.includes(t))) return 0;
  const nums = tokens.filter(esNum).map(Number);
  let pts = 1 + palabras.filter(t => hn.includes(t)).length + 2 * palabras.filter(t => hn.includes(` ${t}`)).length;
  if (nums.length) {
    const dims = numerosDe(nombre);
    const e = emparejar(nums, dims, cerca); if (!e) return 0; pts += e;
    // "2x2", "40x40": las dos primeras medidas son los lados del perfil.
    if (nums.length >= 2 && dims.length >= 2) {
      const vale = (q: number, d: number) => d === q || (PULGADA_MM[String(q)] || []).map(Number).includes(d) || (cerca && q >= 10 && Math.abs(d - q) <= Math.max(2, q * 0.08));
      if ((vale(nums[0], dims[0]) && vale(nums[1], dims[1])) || (vale(nums[0], dims[1]) && vale(nums[1], dims[0]))) pts += 6;
    }
  }
  return pts;
}

const S = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const COLOR_APARTADO: Record<string, string> = { Techos: 'bg-amber-50 text-amber-800', CarpiMetal: 'bg-sky-50 text-sky-800', 'Obra Civil': 'bg-stone-100 text-stone-700', Drywall: 'bg-violet-50 text-violet-800', Personal: 'bg-emerald-50 text-emerald-800' };

export default function CatalogoPreciosView({ projects = [] }: { projects?: any[] }) {
  const [pestana, setPestana] = useState<'mios' | 'mercado'>('mios');
  const [buscar, setBuscar] = useState('');
  const [grupo, setGrupo] = useState<GrupoCatalogo | 'Todos'>('Todos');
  const [soloMios, setSoloMios] = useState(false);
  const [aviso, setAviso] = useState('');
  const cat = useCatalogo();
  const items = itemsCatalogo();
  const grupos = useMemo(() => [...new Set(items.map(i => i.grupo))], [items]);
  const trabajadores = useMemo(() => projects.flatMap(p => p.workers || []), [projects]);

  const tokens = tokensBusqueda(buscar);
  const base = items.filter(i => (grupo === 'Todos' || i.grupo === grupo) && (!soloMios || cat.precios[i.clave] !== undefined));
  const buscarCon = (cerca: boolean) => base
    .map(i => ({ i, p: tokens.length ? puntaje(i.nombre, `${(i.alias || []).join(' ')} ${i.unidad} ${i.grupo}`, tokens, cerca) : 1 }))
    .filter(x => x.p > 0).sort((a, b) => b.p - a.p).map(x => x.i);
  const exactos = buscarCon(false);
  // Si la medida exacta no existe (p. ej. 40 × 40), se muestran las más cercanas (38 × 38).
  const cercanos = exactos.length === 0 && tokens.some(esNum);
  const filtrados = cercanos ? buscarCon(true) : exactos;
  const propios = Object.keys(cat.precios).length;

  return (
    <div className="space-y-4 pb-24">
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600"><Tag className="w-6 h-6" /></div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Catálogo de precios</h2>
            <p className="text-xs text-slate-500">Un solo precio por producto para Techos, CarpiMetal, Obra Civil y Drywall.</p>
          </div>
        </div>
        <div className="inline-flex p-1 bg-slate-100 rounded-xl self-start">
          <button onClick={() => setPestana('mios')} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${pestana === 'mios' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>Mis precios</button>
          <button onClick={() => setPestana('mercado')} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${pestana === 'mercado' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>Referencia de mercado</button>
        </div>
      </div>

      {pestana === 'mercado' ? <PreciosView /> : (<>
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar: tubo 2x2, drywall, cemento, soldador…"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
              <input type="checkbox" checked={soloMios} onChange={e => setSoloMios(e.target.checked)} /> Solo con mi precio ({propios})
            </label>
            <button onClick={() => { const n = importarJornales(trabajadores); setAviso(n ? `✓ ${n} jornales importados desde Personal (promedio por cargo).` : 'No hay trabajadores con jornal diario en Personal.'); setTimeout(() => setAviso(''), 4000); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold cursor-pointer hover:bg-emerald-100">
              <Users className="w-4 h-4" /> Jornales desde Personal
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(['Todos', ...grupos] as (GrupoCatalogo | 'Todos')[]).map(g => (
              <button key={g} onClick={() => setGrupo(g)} className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${grupo === g ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{g}</button>
            ))}
          </div>
          {aviso && <p className="text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5">{aviso}</p>}
          <p className="text-[11px] text-slate-500">Escribe el precio de tu proveedor en la unidad en que compras (barra de 6 m, plancha, millar, bolsa, día…). Si lo dejas sin tocar se usa el precio de referencia (en gris).</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xs divide-y divide-slate-100">
          {cercanos && filtrados.length > 0 && <p className="px-3 py-2 text-[11px] font-bold text-amber-800 bg-amber-50 rounded-t-2xl">No hay esa medida exacta; estas son las más cercanas del mercado.</p>}
          {filtrados.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Sin resultados. Prueba con menos palabras (ej. “cuadrado 50 2”).</p>}
          {filtrados.slice(0, 400).map(i => {
            const propio = cat.precios[i.clave] !== undefined;
            return (
              <div key={i.clave} className="p-3 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_110px_150px_auto] gap-x-3 gap-y-1.5 items-center">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{i.nombre}</p>
                  {i.alias && i.alias.length > 0 && <p className="text-[10px] text-slate-400 truncate">{i.alias.join(' · ')}</p>}
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    {i.usadoEn.map(u => <span key={u} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${COLOR_APARTADO[u] || 'bg-slate-100 text-slate-600'}`}>{u}</span>)}
                    {propio && cat.fechas[i.clave] && <span className="text-[10px] text-slate-400">actualizado {cat.fechas[i.clave]}</span>}
                  </div>
                </div>
                <span className="hidden sm:block text-xs font-bold text-slate-500 text-right">por {i.unidad}</span>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-xs font-bold text-slate-400">S/</span>
                  <input type="number" step="0.1" min={0} value={propio ? cat.precios[i.clave] : ''} placeholder={S(i.ref)}
                    onChange={e => e.target.value === '' ? quitarPrecio(i.clave) : fijarPrecio(i.clave, parseFloat(e.target.value) || 0, 'Catálogo')}
                    className={`w-28 px-2 py-1.5 rounded-lg text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-amber-300 ${propio ? 'bg-amber-50 ring-1 ring-amber-300 text-slate-900' : 'bg-slate-100 text-slate-700'}`} />
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-end gap-2">
                  <span className="sm:hidden text-[11px] font-bold text-slate-500">por {i.unidad} · vigente S/ {S(precio(i.clave))}</span>
                  {propio && <button onClick={() => quitarPrecio(i.clave)} title="Volver al precio de referencia" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /></button>}
                </div>
              </div>
            );
          })}
          {filtrados.length > 400 && <p className="p-3 text-center text-xs text-slate-400">Mostrando 400 de {filtrados.length}. Usa el buscador para encontrar el resto.</p>}
        </div>
      </>)}
    </div>
  );
}
