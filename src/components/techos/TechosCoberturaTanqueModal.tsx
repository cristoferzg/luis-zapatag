// =============================================================================
// Cobertura y tanque elevado (Techos Metálicos).
//
// • Cobertura: cubre el techo a partir de las correas dibujadas (una zona por
//   cada agua) con el material elegido —Aluzinc TR-4, Eternit, calamina,
//   policarbonato…— y permite cambiar el material de cada zona.
// • Tanque elevado: agrega la torre metálica de un tanque tipo Rotoplas con su
//   sobretecho opcional. Todo se ve y se metra también en Concreto por pisos.
// =============================================================================
import { useMemo, useState } from 'react';
import { X, Layers, Droplets, Trash2 } from 'lucide-react';
import { INVENTARIO_COBERTURAS, INVENTARIO_PERFILES_TUBULARES } from './techosCadCatalog';
import type { Node3D, Segment3D, CoverageZone3D } from './techosCadEngineTypes';
import { zonasDesdeCorreas, generarTanque, TANQUES_ROTOPLAS } from './coberturaAuto';

interface Props {
  engineState: any;
  modo: 'cobertura' | 'tanque';
  onClose: () => void;
}

const esTanque = (n?: Node3D) => /^TQ/.test(n?.nodeLabel || '');
const grupoTanque = (n?: Node3D) => /@(.+)$/.exec(n?.nodeLabel || '')?.[1];
const PERFILES_TORRE = INVENTARIO_PERFILES_TUBULARES.filter(p => p.categoria === 'tubo_cuadrado' && p.anchoMm >= 40);

export default function TechosCoberturaTanqueModal({ engineState, modo: modoInicial, onClose }: Props) {
  const [modo, setModo] = useState(modoInicial);
  const nodes: Record<string, Node3D> = engineState?.nodes || {};
  const segments: Record<string, Segment3D> = engineState?.segments || {};
  const zones: Record<string, CoverageZone3D> = engineState?.coverageZones || {};
  const [cobId, setCobId] = useState<string>('cob_aluzinc_030');
  const [msg, setMsg] = useState('');

  // Medidas de la obra (sin contar tanques) para proponer la posición.
  const caja = useMemo(() => {
    const ns = Object.values(nodes).filter(n => !esTanque(n));
    if (!ns.length) return { minX: 0, maxX: 6, minZ: 0, maxZ: 6, losa: 0 };
    let losa = 0;
    Object.values(segments).forEach(s => {
      if (!['viga_principal', 'viga_secundaria', 'piso_deck'].includes(s.rolEstructural)) return;
      const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
      if (a && b && !esTanque(a) && Math.abs(a.y - b.y) < 0.01) losa = Math.max(losa, a.y);
    });
    return { minX: Math.min(...ns.map(n => n.x)), maxX: Math.max(...ns.map(n => n.x)), minZ: Math.min(...ns.map(n => n.z)), maxZ: Math.max(...ns.map(n => n.z)), losa };
  }, [nodes, segments]);

  const [tq, setTq] = useState(() => ({
    litros: 1100 as 600 | 1100 | 2500,
    x: Math.round((caja.maxX - 1.0) * 100) / 100,
    z: Math.round((caja.minZ + 1.0) * 100) / 100,
    cotaBase: caja.losa,
    alturaSoporte: 1.5,
    perfilId: (PERFILES_TORRE.find(p => p.espesorMm >= 2) || PERFILES_TORRE[0] || INVENTARIO_PERFILES_TUBULARES[0]).id,
    sobretecho: true,
    coberturaId: 'cob_eternit_perfil4',
    pendientePct: 15,
  }));

  const zonasTechos = Object.values(zones).filter(z => !z.nodeIdsBoundary.some(id => esTanque(nodes[id])));
  const tanques = useMemo(() => {
    const m = new Map<string, string>();
    Object.values(nodes).forEach(n => { const g = grupoTanque(n); const l = /^TQ(\d+)-P/.exec(n.nodeLabel || ''); if (g && l) m.set(g, l[1]); });
    return [...m.entries()].map(([id, litros]) => ({ id, litros }));
  }, [nodes]);

  const cubrir = () => {
    const nuevas = zonasDesdeCorreas(nodes, segments, cobId);
    const n = Object.keys(nuevas).length;
    if (!n) { setMsg('No hay correas para cubrir. Dibuja o genera correas primero.'); return; }
    const conservadas = Object.fromEntries(Object.entries(zones).filter(([, z]) => z.nodeIdsBoundary.some(id => esTanque(nodes[id]))));
    engineState.loadScene(nodes, segments, { ...conservadas, ...nuevas });
    setMsg(`✓ Techo cubierto: ${n} zona${n > 1 ? 's' : ''} de ${INVENTARIO_COBERTURAS.find(c => c.id === cobId)?.nombre || 'cobertura'}.`);
  };
  const cambiarMaterial = (id: string, mat: string) => engineState.loadScene(nodes, segments, { ...zones, [id]: { ...zones[id], coberturaMaterialId: mat } });
  const quitarZona = (id: string) => { const z = { ...zones }; delete z[id]; engineState.loadScene(nodes, segments, z); };

  const agregarTanque = () => {
    const g = generarTanque(tq);
    engineState.loadScene({ ...nodes, ...g.nodes }, { ...segments, ...g.segments }, { ...zones, ...g.zones });
    setMsg(`✓ Tanque de ${tq.litros} L agregado${tq.sobretecho ? ' con sobretecho' : ''}. Se verá también en Concreto por pisos.`);
  };
  const quitarTanque = (gid: string) => {
    const ids = new Set(Object.values(nodes).filter(n => grupoTanque(n) === gid).map(n => n.id));
    const n2 = Object.fromEntries(Object.entries(nodes).filter(([id]) => !ids.has(id)));
    const s2 = Object.fromEntries(Object.entries(segments).filter(([, s]) => !ids.has(s.nodeAId) && !ids.has(s.nodeBId)));
    const z2 = Object.fromEntries(Object.entries(zones).filter(([, z]) => !z.nodeIdsBoundary.some(id => ids.has(id))));
    engineState.loadScene(n2, s2, z2);
  };

  const selCob = (value: string, onChange: (v: string) => void, cls = '') => (
    <select value={value} onChange={e => onChange(e.target.value)} className={`px-2 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 focus:outline-none ${cls}`}>
      {INVENTARIO_COBERTURAS.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
    </select>
  );
  const num = (label: string, value: number, on: (v: number) => void, step = 0.05) => (
    <label className="text-[11px] font-bold text-slate-600">{label}
      <input type="number" step={step} value={value} onChange={e => on(parseFloat(e.target.value) || 0)}
        className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-100 text-xs font-mono focus:outline-none" />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3" onClick={onClose}>
      <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
          <div className="inline-flex p-0.5 bg-slate-200/70 rounded-xl">
            <button onClick={() => { setModo('cobertura'); setMsg(''); }} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${modo === 'cobertura' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
              <Layers className="w-3.5 h-3.5" /> Cobertura
            </button>
            <button onClick={() => { setModo('tanque'); setMsg(''); }} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${modo === 'tanque' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
              <Droplets className="w-3.5 h-3.5" /> Tanque elevado
            </button>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          {modo === 'cobertura' ? (<>
            <p className="text-xs text-slate-500">Cubre el techo sobre las correas: una zona por cada agua (en techos curvos, una por tramo).</p>
            <div className="flex gap-2 items-center flex-wrap">
              {selCob(cobId, setCobId, 'flex-1 min-w-[200px]')}
              <button onClick={cubrir} className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black cursor-pointer">Cubrir techo</button>
            </div>
            {zonasTechos.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase">Zonas de cobertura ({zonasTechos.length})</p>
                {zonasTechos.map(z => (
                  <div key={z.id} className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 w-28 truncate">{z.nombre}</span>
                    {selCob(z.coberturaMaterialId, v => cambiarMaterial(z.id, v), 'flex-1 min-w-0')}
                    <button onClick={() => quitarZona(z.id)} className="p-1 rounded-lg text-rose-400 hover:bg-rose-50 cursor-pointer" title="Quitar zona"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </>) : (<>
            <p className="text-xs text-slate-500">Torre metálica de 4 patas para tanque tipo Rotoplas, con sobretecho a un agua opcional.</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-bold text-slate-600">Tanque
                <select value={tq.litros} onChange={e => setTq({ ...tq, litros: Number(e.target.value) as 600 | 1100 | 2500 })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-100 text-xs font-bold focus:outline-none">
                  {Object.entries(TANQUES_ROTOPLAS).map(([l, d]) => <option key={l} value={l}>{l} L · Ø{d.diametro} m</option>)}
                </select>
              </label>
              <label className="text-[11px] font-bold text-slate-600">Perfil de la torre
                <select value={tq.perfilId} onChange={e => setTq({ ...tq, perfilId: e.target.value })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-100 text-xs font-bold focus:outline-none">
                  {PERFILES_TORRE.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </label>
              {num('Centro X (m)', tq.x, v => setTq({ ...tq, x: v }))}
              {num('Centro Z (m)', tq.z, v => setTq({ ...tq, z: v }))}
              {num('Apoya a la cota (m)', tq.cotaBase, v => setTq({ ...tq, cotaBase: Math.max(0, v) }))}
              {num('Alto de la torre (m)', tq.alturaSoporte, v => setTq({ ...tq, alturaSoporte: Math.max(0.3, v) }))}
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={tq.sobretecho} onChange={e => setTq({ ...tq, sobretecho: e.target.checked })} /> Sobretecho sobre el tanque
            </label>
            {tq.sobretecho && (
              <div className="grid grid-cols-3 gap-2 items-end">
                <label className="col-span-2 text-[11px] font-bold text-slate-600">Cobertura
                  {selCob(tq.coberturaId, v => setTq({ ...tq, coberturaId: v }), 'mt-0.5 w-full')}
                </label>
                {num('Pendiente %', tq.pendientePct, v => setTq({ ...tq, pendientePct: Math.max(0, v) }), 1)}
              </div>
            )}
            <p className="text-[10px] text-slate-400">La obra mide X {caja.minX.toFixed(1)}–{caja.maxX.toFixed(1)} m · Z {caja.minZ.toFixed(1)}–{caja.maxZ.toFixed(1)} m. Losa/entrepiso más alto: {caja.losa.toFixed(2)} m.</p>
            <button onClick={agregarTanque} className="w-full px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black cursor-pointer">Agregar tanque</button>
            {tanques.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase">Tanques en el diseño</p>
                {tanques.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-[11px] font-bold text-slate-600 bg-slate-50 rounded-lg px-2 py-1">
                    Tanque {t.litros} L
                    <button onClick={() => quitarTanque(t.id)} className="p-1 rounded-lg text-rose-400 hover:bg-rose-50 cursor-pointer" title="Quitar tanque"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </>)}
          {msg && <p className="text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
