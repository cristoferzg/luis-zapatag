// Panel por piso: muros (drywall / ladrillo), techos metálicos vinculados y
// soporte metálico de tanque elevado con sobrepecho.
import { Plus, Trash2, PenTool, Droplets, BrickWall } from 'lucide-react';
import { DrywallItem } from '../../catalogo/drywall';
import { LadrilloItem } from '../../catalogo/ladrillo';
import { OsbItem } from '../../catalogo/osb';
import {
  SistemaNivel, MuroCapa, TechoSnapshot, SoporteTanque, CalcSistema,
  PERFILES_TANQUE, TANQUES, tanqueDefault,
} from './obraPisos';
import { INVENTARIO_PERFILES_TUBULARES } from '../techos/techosCadCatalog';

interface Props {
  nivel: string;
  sistema: SistemaNivel;
  calc: CalcSistema;
  drywall: DrywallItem[];
  ladrillo: LadrilloItem[];
  osb: OsbItem[];
  techosLib: TechoSnapshot[];
  onChange: (s: SistemaNivel) => void;
  onIrATechos?: () => void;
}

const inputCls = 'mt-1 w-full px-2.5 py-2 rounded-lg bg-white text-sm text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-200';
const S = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function SistemaPisoPanel({ nivel, sistema, calc, drywall, ladrillo, osb, techosLib, onChange, onIrATechos }: Props) {
  const setMuro = (id: string, patch: Partial<MuroCapa>) =>
    onChange({ ...sistema, muros: sistema.muros.map(m => m.id === id ? { ...m, ...patch } : m) });
  const addMuro = (tipo: MuroCapa['tipo']) => onChange({
    ...sistema,
    muros: [...sistema.muros, {
      id: `mu_${Date.now()}`, tipo, areaM2: 10,
      caras: (tipo === 'osb' ? 1 : 2) as 1 | 2,
      materialId: (tipo === 'drywall' ? drywall[0]?.id : tipo === 'osb' ? osb[0]?.id : ladrillo[0]?.id) || '',
    }],
  });
  const setTanque = (patch: Partial<SoporteTanque>) => sistema.tanque && onChange({ ...sistema, tanque: { ...sistema.tanque, ...patch } });
  const techosLibres = techosLib.filter(t => !sistema.techoIds.includes(t.id));
  // Muros dibujados en el Plano CAD: una fila por material.
  const gruposCad = Object.values(calc.muros.filter(x => x.m.deCad).reduce((acc, { m, r }) => {
    const key = `${m.tipo}:${m.materialId}`;
    const g = acc[key] ||= { key, tipo: m.tipo, nombre: r.nombre, n: 0, area: 0, unidades: 0, costo: 0 };
    g.n++; g.area += m.areaM2; g.unidades += r.unidades; g.costo += r.costo;
    return acc;
  }, {} as Record<string, { key: string; tipo: MuroCapa['tipo']; nombre: string; n: number; area: number; unidades: number; costo: number }>));

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[11px] font-black text-slate-400 uppercase">Sistema del piso <span className="text-stone-500">→ {nivel}</span></p>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 rounded-lg px-2.5 py-1">{S(calc.costo)}</span>
      </div>

      {/* MUROS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><BrickWall className="w-4 h-4 text-orange-400" /> Muros y tabiques</h4>
          <div className="flex gap-2">
            <button onClick={() => addMuro('drywall')} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-200"><Plus className="w-3.5 h-3.5" /> Drywall</button>
            <button onClick={() => addMuro('ladrillo')} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-200"><Plus className="w-3.5 h-3.5" /> Ladrillo</button>
            <button onClick={() => addMuro('osb')} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-200"><Plus className="w-3.5 h-3.5" /> OSB</button>
          </div>
        </div>
        {calc.muros.length === 0 && <p className="text-xs text-slate-400 italic">Sin muros en este piso. Agrega drywall o ladrillo.</p>}
        {gruposCad.map(g => (
          <div key={g.key} className="rounded-xl bg-orange-50/60 px-3 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">{g.nombre} <span className="text-[10px] font-semibold text-orange-600">· {g.n} {g.n === 1 ? 'muro dibujado' : 'muros dibujados'} en el plano</span></p>
              <p className="text-[11px] text-slate-500">{g.area.toFixed(1)} m² · {g.tipo !== 'ladrillo' ? `${g.unidades.toFixed(1)} m² de placa` : `${g.unidades.toLocaleString('es-PE')} ladrillos`}</p>
            </div>
            <span className="text-xs font-bold text-slate-800 shrink-0">{g.costo > 0 ? S(g.costo) : 'Sin precio'}</span>
          </div>
        ))}
        {calc.muros.filter(x => !x.m.deCad).map(({ m, r }) => (
          <div key={m.id} className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2 -mt-1 mb-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">{m.tipo === 'drywall' ? 'Muro de drywall' : m.tipo === 'osb' ? 'Muro de OSB' : 'Muro de ladrillo'}</span>
              <button onClick={() => onChange({ ...sistema, muros: sistema.muros.filter(x => x.id !== m.id) })}
                className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 cursor-pointer" title="Quitar muro"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-[1fr_120px_120px] gap-2 items-end">
              <label className="col-span-2 sm:col-span-1 text-[11px] font-bold text-slate-600">{m.tipo === 'ladrillo' ? 'Ladrillo' : m.tipo === 'osb' ? 'Placa OSB' : 'Placa'}
                <select value={m.materialId} onChange={e => setMuro(m.id, { materialId: e.target.value })} className={inputCls}>
                  {(m.tipo === 'drywall' ? drywall : m.tipo === 'osb' ? osb : ladrillo).map(x => <option key={x.id} value={x.id}>{x.tipo}</option>)}
                </select>
              </label>
              <label className="text-[11px] font-bold text-slate-600">Área muro (m²)
                <input type="number" inputMode="decimal" min={0} value={m.areaM2} onChange={e => setMuro(m.id, { areaM2: Math.max(0, parseFloat(e.target.value) || 0) })} className={inputCls} />
              </label>
              {m.tipo !== 'ladrillo' ? (
                <label className="text-[11px] font-bold text-slate-600">Caras
                  <select value={m.caras} onChange={e => setMuro(m.id, { caras: Number(e.target.value) as 1 | 2 })} className={inputCls}>
                    <option value={1}>1 cara</option><option value={2}>2 caras</option>
                  </select>
                </label>
              ) : <div className="hidden sm:block" />}
            </div>
            <p className="mt-2 text-[11px] font-bold text-slate-600">
              {m.tipo !== 'ladrillo' ? `${r.unidades.toFixed(1)} m² de placa` : `${r.unidades.toLocaleString('es-PE')} ladrillos`}
              {' · '}{r.pesoKg.toFixed(0)} kg · <span className="text-slate-800">{r.costo > 0 ? S(r.costo) : 'Ingresa el precio en "Precios"'}</span>
            </p>
          </div>
        ))}
      </section>

      {/* TECHOS METÁLICOS */}
      <section className="space-y-2 pt-2">
        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><PenTool className="w-4 h-4 text-blue-500" /> Techo / estructura metálica en este piso</h4>
        {calc.techos.map(t => (
          <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{t.nombre}</p>
              <p className="text-[11px] text-slate-600">{t.pesoAceroKg.toFixed(0)} kg acero{t.areaCoberturaM2 > 0 && ` · ${t.areaCoberturaM2.toFixed(1)} m² cobertura`} · costo directo <strong>{S(t.costoDirectoSoles)}</strong></p>
            </div>
            <button onClick={() => onChange({ ...sistema, techoIds: sistema.techoIds.filter(x => x !== t.id) })}
              className="p-2 rounded-lg hover:bg-rose-100 text-rose-500 cursor-pointer shrink-0" title="Desvincular"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {techosLibres.length > 0 ? (
          <select value="" onChange={e => e.target.value && onChange({ ...sistema, techoIds: [...sistema.techoIds, e.target.value] })} className={`${inputCls} !bg-slate-50 !shadow-none`}>
            <option value="">+ Vincular un techo enviado desde Techos Metálicos…</option>
            {techosLibres.map(t => <option key={t.id} value={t.id}>{t.nombre} — {S(t.costoDirectoSoles)} ({t.fecha})</option>)}
          </select>
        ) : (
          <p className="text-xs text-slate-400 italic">
            {techosLib.length === 0 ? 'Aún no hay techos enviados. En Techos Metálicos usa el botón "→ Obra por pisos".' : 'Todos los techos enviados ya están vinculados.'}
            {onIrATechos && <button onClick={onIrATechos} className="ml-1 text-blue-600 font-bold underline cursor-pointer">Ir a Techos</button>}
          </p>
        )}
      </section>

      {/* TANQUE ELEVADO */}
      <section className="space-y-2 pt-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Droplets className="w-4 h-4 text-sky-500" /> Tanque elevado (soporte metálico + sobrepecho)</h4>
          {sistema.tanque ? (
            <button onClick={() => onChange({ ...sistema, tanque: undefined })} className="p-2 rounded-lg hover:bg-rose-100 text-rose-500 cursor-pointer" title="Quitar tanque"><Trash2 className="w-4 h-4" /></button>
          ) : (
            <button onClick={() => onChange({ ...sistema, tanque: tanqueDefault() })} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-200"><Plus className="w-3.5 h-3.5" /> Tanque</button>
          )}
        </div>
        {sistema.tanque && calc.tanque && (
          <div className="rounded-xl bg-slate-50 p-3 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="text-[11px] font-bold text-slate-600">Tanque
                <select value={sistema.tanque.capacidadL} onChange={e => setTanque({ capacidadL: Number(e.target.value) as SoporteTanque['capacidadL'] })} className={inputCls}>
                  {Object.keys(TANQUES).map(c => <option key={c} value={c}>{c} L</option>)}
                </select>
              </label>
              <label className="text-[11px] font-bold text-slate-600">Altura soporte (m)
                <input type="number" inputMode="decimal" min={0.3} step={0.1} value={sistema.tanque.alturaM} onChange={e => setTanque({ alturaM: Math.max(0.3, parseFloat(e.target.value) || 0.3) })} className={inputCls} />
              </label>
              <label className="col-span-2 text-[11px] font-bold text-slate-600">Perfil
                <select value={sistema.tanque.perfilId} onChange={e => {
                  const p = INVENTARIO_PERFILES_TUBULARES.find(x => x.id === e.target.value);
                  setTanque({ perfilId: e.target.value, precioMetro: p?.costoMetroSol || 0 });
                }} className={inputCls}>
                  {PERFILES_TANQUE.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </label>
              <label className="text-[11px] font-bold text-slate-600">Precio perfil (S/ m)
                <input type="number" inputMode="decimal" min={0} value={sistema.tanque.precioMetro} onChange={e => setTanque({ precioMetro: Math.max(0, parseFloat(e.target.value) || 0) })} className={inputCls} />
              </label>
              <label className="text-[11px] font-bold text-slate-600 flex items-end gap-2 pb-2">
                <input type="checkbox" checked={sistema.tanque.sobrepecho} onChange={e => setTanque({ sobrepecho: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                Con sobrepecho
              </label>
              {sistema.tanque.sobrepecho && (
                <>
                  <label className="text-[11px] font-bold text-slate-600">Ladrillo sobrepecho
                    <select value={sistema.tanque.sobrepechoLadrilloId} onChange={e => setTanque({ sobrepechoLadrilloId: e.target.value })} className={inputCls}>
                      {ladrillo.map(l => <option key={l.id} value={l.id}>{l.tipo}</option>)}
                    </select>
                  </label>
                  <label className="text-[11px] font-bold text-slate-600">Alto sobrepecho (m)
                    <input type="number" inputMode="decimal" min={0} step={0.1} value={sistema.tanque.sobrepechoAlturaM} onChange={e => setTanque({ sobrepechoAlturaM: Math.max(0, parseFloat(e.target.value) || 0) })} className={inputCls} />
                  </label>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[
                ['Plataforma', `${calc.tanque.ladoM.toFixed(2)} × ${calc.tanque.ladoM.toFixed(2)} m`],
                ['Perfil', `${calc.tanque.metrosPerfil.toFixed(1)} m · ${calc.tanque.barras6m} barras`],
                ['Sobrepecho', sistema.tanque.sobrepecho ? `${calc.tanque.areaSobrepechoM2.toFixed(1)} m² · ${calc.tanque.ladrillos} lad.` : '—'],
                ['Carga sobre losa', `${calc.tanque.cargaTotalKg.toFixed(0)} kg`],
              ].map(([k, v]) => (
                <div key={k} className="bg-white rounded-lg p-2 shadow-2xs">
                  <p className="text-xs font-black text-slate-800">{v}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{k}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] font-bold text-slate-600">Acero {S(calc.tanque.costoAcero)} + sobrepecho {S(calc.tanque.costoSobrepecho)} = <span className="text-slate-800">{S(calc.tanque.costo)}</span></p>
          </div>
        )}
      </section>
    </div>
  );
}
