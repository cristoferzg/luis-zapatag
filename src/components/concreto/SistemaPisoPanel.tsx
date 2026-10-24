// Panel por piso: muros (drywall / ladrillo), techos metálicos vinculados y
// soporte metálico de tanque elevado con sobrepecho.
import { Plus, Trash2, PenTool, Droplets, BrickWall } from 'lucide-react';
import { DrywallItem } from '../../catalogo/drywall';
import { LadrilloItem } from '../../catalogo/ladrillo';
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
  techosLib: TechoSnapshot[];
  onChange: (s: SistemaNivel) => void;
  onIrATechos?: () => void;
}

const inputCls = 'mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white';
const S = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function SistemaPisoPanel({ nivel, sistema, calc, drywall, ladrillo, techosLib, onChange, onIrATechos }: Props) {
  const setMuro = (id: string, patch: Partial<MuroCapa>) =>
    onChange({ ...sistema, muros: sistema.muros.map(m => m.id === id ? { ...m, ...patch } : m) });
  const addMuro = (tipo: MuroCapa['tipo']) => onChange({
    ...sistema,
    muros: [...sistema.muros, {
      id: `mu_${Date.now()}`, tipo, areaM2: 10, caras: 2,
      materialId: tipo === 'drywall' ? drywall[0]?.id : ladrillo[0]?.id,
    }],
  });
  const setTanque = (patch: Partial<SoporteTanque>) => sistema.tanque && onChange({ ...sistema, tanque: { ...sistema.tanque, ...patch } });
  const techosLibres = techosLib.filter(t => !sistema.techoIds.includes(t.id));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[11px] font-black text-slate-400 uppercase">Sistema del piso <span className="text-stone-500">→ {nivel}</span></p>
        <span className="text-xs font-black text-stone-700 bg-stone-100 border border-stone-200 rounded-lg px-2 py-1">{S(calc.costo)}</span>
      </div>

      {/* MUROS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><BrickWall className="w-4 h-4 text-rose-700" /> Muros y tabiques</h4>
          <div className="flex gap-2">
            <button onClick={() => addMuro('drywall')} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold cursor-pointer hover:bg-sky-100"><Plus className="w-3.5 h-3.5" /> Drywall</button>
            <button onClick={() => addMuro('ladrillo')} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold cursor-pointer hover:bg-rose-100"><Plus className="w-3.5 h-3.5" /> Ladrillo</button>
          </div>
        </div>
        {calc.muros.length === 0 && <p className="text-xs text-slate-400 italic">Sin muros en este piso. Agrega drywall o ladrillo.</p>}
        {calc.muros.map(({ m, r }) => (
          <div key={m.id} className={`rounded-xl border p-3 ${m.tipo === 'drywall' ? 'border-sky-200 bg-sky-50/40' : 'border-rose-200 bg-rose-50/40'}`}>
            <div className="flex items-center justify-between gap-2 -mt-1 mb-1">
              <span className={`text-[10px] font-black uppercase ${m.tipo === 'drywall' ? 'text-sky-700' : 'text-rose-700'}`}>{m.tipo === 'drywall' ? 'Muro de drywall' : 'Muro de ladrillo'}</span>
              <button onClick={() => onChange({ ...sistema, muros: sistema.muros.filter(x => x.id !== m.id) })}
                className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 cursor-pointer" title="Quitar muro"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-[1fr_120px_120px] gap-2 items-end">
              <label className="col-span-2 sm:col-span-1 text-[11px] font-bold text-slate-600">{m.tipo === 'drywall' ? 'Placa' : 'Ladrillo'}
                <select value={m.materialId} onChange={e => setMuro(m.id, { materialId: e.target.value })} className={inputCls}>
                  {(m.tipo === 'drywall' ? drywall : ladrillo).map(x => <option key={x.id} value={x.id}>{x.tipo}</option>)}
                </select>
              </label>
              <label className="text-[11px] font-bold text-slate-600">Área muro (m²)
                <input type="number" inputMode="decimal" min={0} value={m.areaM2} onChange={e => setMuro(m.id, { areaM2: Math.max(0, parseFloat(e.target.value) || 0) })} className={inputCls} />
              </label>
              {m.tipo === 'drywall' ? (
                <label className="text-[11px] font-bold text-slate-600">Caras
                  <select value={m.caras} onChange={e => setMuro(m.id, { caras: Number(e.target.value) as 1 | 2 })} className={inputCls}>
                    <option value={1}>1 cara</option><option value={2}>2 caras</option>
                  </select>
                </label>
              ) : <div className="hidden sm:block" />}
            </div>
            <p className="mt-2 text-[11px] font-bold text-slate-600">
              {m.tipo === 'drywall' ? `${r.unidades.toFixed(1)} m² de placa` : `${r.unidades.toLocaleString('es-PE')} ladrillos`}
              {' · '}{r.pesoKg.toFixed(0)} kg · <span className="text-stone-800">{r.costo > 0 ? S(r.costo) : 'Ingresa el precio en "Precios"'}</span>
            </p>
          </div>
        ))}
      </section>

      {/* TECHOS METÁLICOS */}
      <section className="space-y-2 border-t border-slate-100 pt-3">
        <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><PenTool className="w-4 h-4 text-indigo-600" /> Techo / estructura metálica en este piso</h4>
        {calc.techos.map(t => (
          <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-800 truncate">{t.nombre}</p>
              <p className="text-[11px] text-slate-600">{t.pesoAceroKg.toFixed(0)} kg acero{t.areaCoberturaM2 > 0 && ` · ${t.areaCoberturaM2.toFixed(1)} m² cobertura`} · costo directo <strong>{S(t.costoDirectoSoles)}</strong></p>
            </div>
            <button onClick={() => onChange({ ...sistema, techoIds: sistema.techoIds.filter(x => x !== t.id) })}
              className="p-2 rounded-lg hover:bg-rose-100 text-rose-500 cursor-pointer shrink-0" title="Desvincular"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {techosLibres.length > 0 ? (
          <select value="" onChange={e => e.target.value && onChange({ ...sistema, techoIds: [...sistema.techoIds, e.target.value] })} className={inputCls}>
            <option value="">+ Vincular un techo enviado desde Techos Metálicos…</option>
            {techosLibres.map(t => <option key={t.id} value={t.id}>{t.nombre} — {S(t.costoDirectoSoles)} ({t.fecha})</option>)}
          </select>
        ) : (
          <p className="text-xs text-slate-400 italic">
            {techosLib.length === 0 ? 'Aún no hay techos enviados. En Techos Metálicos usa el botón "→ Obra por pisos".' : 'Todos los techos enviados ya están vinculados.'}
            {onIrATechos && <button onClick={onIrATechos} className="ml-1 text-indigo-600 font-bold underline cursor-pointer">Ir a Techos</button>}
          </p>
        )}
      </section>

      {/* TANQUE ELEVADO */}
      <section className="space-y-2 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><Droplets className="w-4 h-4 text-cyan-600" /> Tanque elevado (soporte metálico + sobrepecho)</h4>
          {sistema.tanque ? (
            <button onClick={() => onChange({ ...sistema, tanque: undefined })} className="p-2 rounded-lg hover:bg-rose-100 text-rose-500 cursor-pointer" title="Quitar tanque"><Trash2 className="w-4 h-4" /></button>
          ) : (
            <button onClick={() => onChange({ ...sistema, tanque: tanqueDefault() })} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold cursor-pointer hover:bg-cyan-100"><Plus className="w-3.5 h-3.5" /> Tanque</button>
          )}
        </div>
        {sistema.tanque && calc.tanque && (
          <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-3 space-y-2">
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
                <input type="checkbox" checked={sistema.tanque.sobrepecho} onChange={e => setTanque({ sobrepecho: e.target.checked })} className="w-4 h-4 accent-rose-600" />
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
                <div key={k} className="bg-white rounded-lg border border-cyan-100 p-2">
                  <p className="text-xs font-black text-slate-800">{v}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{k}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] font-bold text-slate-600">Acero {S(calc.tanque.costoAcero)} + sobrepecho {S(calc.tanque.costoSobrepecho)} = <span className="text-stone-800">{S(calc.tanque.costo)}</span></p>
          </div>
        )}
      </section>
    </div>
  );
}
