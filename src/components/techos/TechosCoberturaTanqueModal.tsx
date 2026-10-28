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
import { X, Layers, Droplets, Trash2, Compass, Cable, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { INVENTARIO_COBERTURAS, INVENTARIO_PERFILES_TUBULARES } from './techosCadCatalog';
import type { Node3D, Segment3D, CoverageZone3D } from './techosCadEngineTypes';
import { MODELOS_TENSOR, TipoTensor, sugerido, generarTensores, quitarTensoresAuto, modeloTensor } from './tensores';
import { safeStorage } from '../../lib/storageManager';
import { zonasDesdeCorreas, generarTanque, TANQUES_ROTOPLAS, caidaPrincipal, transformarEscena, opParaCaida, DireccionCaida, NOMBRE_CAIDA, pendienteActual, cambiarPendiente, PENDIENTE_MIN_PCT, inclinarTechoPlano } from './coberturaAuto';

interface Props {
  engineState: any;
  modo: 'cobertura' | 'tanque' | 'caida' | 'tensores';
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
  // Tensores
  const luz = useMemo(() => { const ns = Object.values(nodes); return ns.length ? Math.max(...ns.map(n => n.x)) - Math.min(...ns.map(n => n.x)) : 0; }, [nodes]);
  const arriostresTubo = Object.values(segments).filter(s => s.rolEstructural === 'arriostre' && !s.tensorAuto).length;
  const [ten, setTen] = useState(() => ({ tipo: 'varilla' as TipoTensor, modelo: sugerido('varilla', luz), correa: 'TEN-VAR-12', techo: true, paredes: true, correas: true, cada: 5, reemplazar: true }));
  const RIGIDOS = INVENTARIO_PERFILES_TUBULARES.filter(p => p.categoria === 'tubo_redondo' || (p.categoria === 'tubo_cuadrado' && p.anchoMm <= 50));
  const tensoresEnEscena = Object.values(segments).filter(s => modeloTensor(s.profileId) || (s.tensorAuto && s.rolEstructural === 'arriostre'));
  const colocarTensores = () => {
    const r = generarTensores(nodes, segments, { modeloCruz: ten.modelo, modeloCorrea: ten.correa, techo: ten.techo, paredes: ten.paredes, correas: ten.correas, cadaPanos: Math.max(2, ten.cada), reemplazarArriostres: ten.reemplazar && arriostresTubo > 0 });
    if (!r.cruces && !r.correas) { setMsg('No encontré pórticos con tijerales repetidos. Genera la nave con el Asistente o dibuja los tensores a mano con la herramienta Tensor.'); return; }
    engineState.loadScene(r.nodes, r.segments, zones);
    setMsg(`✓ ${r.cruces} tensores en cruz (paños ${r.panos.join(', ')}) y ${r.correas} tramos de templador de correas.`);
  };
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

  // Altura del techo en un punto (x): la misma que usa el 3D para la plancha
  // (lo más alto de cordones superiores, correas y vigas, sin contar tanques).
  const perfilTecho = useMemo(() => {
    const m = new Map<number, number>();
    Object.values(segments).forEach(s => {
      if (!['cordon_superior', 'correa', 'viga_principal'].includes(s.rolEstructural)) return;
      [nodes[s.nodeAId], nodes[s.nodeBId]].forEach(n => { if (n && !esTanque(n) && !/^TQ/.test(n.nodeLabel || '')) { const k = Math.round(n.x * 100) / 100; m.set(k, Math.max(m.get(k) ?? -Infinity, n.y)); } });
    });
    return [...m.entries()].map(([x, y]) => ({ x, y })).sort((a, b) => a.x - b.x);
  }, [nodes, segments]);
  const alturaTechoEn = (x: number) => {
    const p = perfilTecho;
    if (!p.length) return 0;
    if (x <= p[0].x) return p[0].y;
    if (x >= p[p.length - 1].x) return p[p.length - 1].y;
    for (let i = 0; i + 1 < p.length; i++) if (x >= p[i].x && x <= p[i + 1].x) { const t = (x - p[i].x) / Math.max(1e-6, p[i + 1].x - p[i].x); return p[i].y + (p[i + 1].y - p[i].y) * t; }
    return p[0].y;
  };
  const hayTecho = perfilTecho.length >= 2;
  const [ubicacion, setUbicacion] = useState<'techo' | 'cota'>(() => (hayTecho ? 'techo' : 'cota'));

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
    const m = new Map<string, { litros: string; xs: number[]; zs: number[]; y: number; techo: boolean }>();
    Object.values(nodes).forEach(n => {
      const g = grupoTanque(n); if (!g) return;
      const t = m.get(g) || { litros: '', xs: [], zs: [], y: 0, techo: false };
      const l = /^TQ(\d+)-P/.exec(n.nodeLabel || '');
      if (l) { t.litros = l[1]; t.xs.push(n.x); t.zs.push(n.z); t.y = n.y; }
      if (/^TQS/.test(n.nodeLabel || '')) t.techo = true;
      m.set(g, t);
    });
    // Orden estable: por id (se crean con la hora) → Tanque 1, 2, 3…
    return [...m.entries()].filter(([, t]) => t.litros).sort(([a], [b]) => a.localeCompare(b)).map(([id, t]) => ({
      id, litros: t.litros, techo: t.techo, y: t.y,
      x: t.xs.reduce((a, b) => a + b, 0) / t.xs.length, z: t.zs.reduce((a, b) => a + b, 0) / t.zs.length,
    }));
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
    // Sobre el techo: cada pata apoya a la altura del techo en su punto (+12 cm de soporte sobre la plancha).
    const h = Math.round((TANQUES_ROTOPLAS[tq.litros].diametro + 0.2) * 100) / 200;
    const cotaPorPata = ubicacion === 'techo' && hayTecho ? [-h, h, h, -h].map(dx => Math.round((alturaTechoEn(tq.x + dx) + 0.12) * 100) / 100) : undefined;
    const g = generarTanque({ ...tq, cotaPorPata });
    engineState.loadScene({ ...nodes, ...g.nodes }, { ...segments, ...g.segments }, { ...zones, ...g.zones });
    setMsg(`✓ Tanque ${tanques.length + 1} (${tq.litros} L) agregado${tq.sobretecho ? ' con sobretecho' : ''}. Para otro tanque, cambia la posición X/Z y vuelve a agregar.`);
    setTq(t => ({ ...t, x: Math.round((t.x - (TANQUES_ROTOPLAS[t.litros].diametro + 0.8)) * 100) / 100 }));
  };
  const quitarTanque = (gid: string) => {
    const ids = new Set(Object.values(nodes).filter(n => grupoTanque(n) === gid).map(n => n.id));
    const n2 = Object.fromEntries(Object.entries(nodes).filter(([id]) => !ids.has(id)));
    const s2 = Object.fromEntries(Object.entries(segments).filter(([, s]) => !ids.has(s.nodeAId) && !ids.has(s.nodeBId)));
    const z2 = Object.fromEntries(Object.entries(zones).filter(([, z]) => !z.nodeIdsBoundary.some(id => ids.has(id))));
    engineState.loadScene(n2, s2, z2);
  };

  const caida = useMemo(() => caidaPrincipal(nodes, segments, zones), [nodes, segments, zones]);
  const aplicar = (op: Parameters<typeof transformarEscena>[1] | null) => {
    if (!op) return;
    engineState.loadScene(transformarEscena(nodes, op), segments, zones);
    setMsg('✓ Diseño reorientado. Guárdalo para verlo así en Concreto.');
  };
  // Techo plano (o sin caída): se le da caída hacia la dirección elegida (10 % o la mínima de la cobertura).
  const orientar = (d: DireccionCaida) => {
    if (caida) { aplicar(opParaCaida(caida, d)); return; }
    const pct = Math.max(10, minCob?.pct || 0);
    const n2 = inclinarTechoPlano(nodes, d, pct);
    const z2 = Object.fromEntries(Object.entries(zones).map(([k, z]) => [k, z.nodeIdsBoundary.some(id => esTanque(nodes[id])) ? z : { ...z, pendientePorcentaje: pct }]));
    engineState.loadScene(n2, segments, Object.keys(z2).length ? z2 : zonasDesdeCorreas(n2, segments, 'cob_aluzinc_030'));
    setMsg(`✓ El techo ahora cae hacia ${NOMBRE_CAIDA[d].toLowerCase()} con ${pct}%. Cambia el % abajo si quieres.`);
  };
  const pend = useMemo(() => pendienteActual(nodes, segments, zones), [nodes, segments, zones]);
  const [pctNuevo, setPctNuevo] = useState<string>('');
  const aplicarPendiente = (pct: number) => {
    const n2 = cambiarPendiente(nodes, segments, zones, pct);
    if (!n2) { setMsg('Este techo es plano: para darle caída usa una plantilla de un agua o dos aguas.'); return; }
    const z2 = Object.fromEntries(Object.entries(zones).map(([k, z]) => [k, z.nodeIdsBoundary.some(id => esTanque(nodes[id])) ? z : { ...z, pendientePorcentaje: pct }]));
    engineState.loadScene(n2, segments, z2);
    setPctNuevo('');
    setMsg(`✓ Pendiente cambiada a ${pct}%. El alero queda a la misma altura; la parte alta se ajustó. Guarda para verlo en Concreto.`);
  };
  // Cobertura con la pendiente mínima más exigente entre las usadas.
  const minCob = useMemo(() => {
    let r: { pct: number; nombre: string } | null = null;
    Object.values(zones).forEach(z => {
      if (z.nodeIdsBoundary.some(id => esTanque(nodes[id]))) return;
      const c = INVENTARIO_COBERTURAS.find(x => x.id === z.coberturaMaterialId);
      const m = c ? PENDIENTE_MIN_PCT[c.categoria] : undefined;
      if (c && m !== undefined && (!r || m > r.pct)) r = { pct: m, nombre: c.nombre };
    });
    return r as { pct: number; nombre: string } | null;
  }, [zones, nodes]);

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
          <div className="inline-flex flex-wrap p-0.5 bg-slate-200/70 rounded-xl">
            <button onClick={() => { setModo('cobertura'); setMsg(''); }} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${modo === 'cobertura' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
              <Layers className="w-3.5 h-3.5" /> Cobertura
            </button>
            <button onClick={() => { setModo('tanque'); setMsg(''); }} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${modo === 'tanque' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
              <Droplets className="w-3.5 h-3.5" /> Tanques
            </button>
            <button onClick={() => { setModo('caida'); setMsg(''); }} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${modo === 'caida' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
              <Compass className="w-3.5 h-3.5" /> Caída
            </button>
            <button onClick={() => { setModo('tensores'); setMsg(''); }} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${modo === 'tensores' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
              <Cable className="w-3.5 h-3.5" /> Tensores
            </button>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          {modo === 'tensores' ? (<>
            <p className="text-xs text-slate-500">Arriostran la nave contra el viento y el sismo y evitan que las correas se doblen de lado. Se colocan solos según el tamaño de la nave, o a mano con la herramienta <b>Tensor</b>.</p>
            <div className="grid grid-cols-3 gap-1.5">
              {([['varilla', 'Varilla lisa + templador', 'Lo más usado y económico'], ['cable', 'Cable de acero + templador', 'Luces largas / naves livianas'], ['rigido', 'Rígido (tubo)', 'También toma compresión']] as [TipoTensor, string, string][]).map(([t, n, d]) => (
                <button key={t} onClick={() => { const m = sugerido(t, luz); setTen({ ...ten, tipo: t, modelo: m }); if (t !== 'rigido') safeStorage.setItem('techos_tensor_modelo', m); }}
                  className={`text-left rounded-xl border px-2.5 py-2 cursor-pointer ${ten.tipo === t ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}>
                  <p className="text-[11px] font-black text-slate-800 leading-tight">{n}</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{d}</p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-bold text-slate-600">Cruces en X
                <select value={ten.modelo} onChange={e => { setTen({ ...ten, modelo: e.target.value }); if (modeloTensor(e.target.value)) safeStorage.setItem('techos_tensor_modelo', e.target.value); }}
                  className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-100 text-xs font-bold focus:outline-none">
                  {ten.tipo === 'rigido' ? RIGIDOS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>) : MODELOS_TENSOR.filter(m => m.tipo === ten.tipo).map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </label>
              <label className="text-[11px] font-bold text-slate-600">Templador de correas
                <select value={ten.correa} onChange={e => setTen({ ...ten, correa: e.target.value })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-100 text-xs font-bold focus:outline-none">
                  {MODELOS_TENSOR.filter(m => m.tipo === 'varilla').map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </label>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" checked={ten.techo} onChange={e => setTen({ ...ten, techo: e.target.checked })} /> Cruces en el plano del techo</label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" checked={ten.paredes} onChange={e => setTen({ ...ten, paredes: e.target.checked })} /> Cruces en las paredes laterales (entre columnas)</label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" checked={ten.correas} onChange={e => setTen({ ...ten, correas: e.target.checked })} /> Templadores de correas (paños de más de 5.5 m)</label>
              {arriostresTubo > 0 && <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" checked={ten.reemplazar} onChange={e => setTen({ ...ten, reemplazar: e.target.checked })} /> Reemplazar los {arriostresTubo} arriostres de tubo en cruz por estos tensores</label>}
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700">Arriostrar los paños extremos y cada
                <input type="number" min={2} max={10} value={ten.cada} onChange={e => setTen({ ...ten, cada: Math.max(2, parseInt(e.target.value) || 5) })} className="w-14 px-2 py-1 rounded-lg bg-slate-100 text-xs font-mono focus:outline-none" /> paños
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={colocarTensores} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer hover:bg-emerald-700"><Cable className="w-4 h-4" /> Colocar tensores</button>
              {tensoresEnEscena.some(s => s.tensorAuto) && (
                <button onClick={() => { const r = quitarTensoresAuto(nodes, segments); engineState.loadScene(r.nodes, r.segments, zones); setMsg('Se quitaron los tensores automáticos.'); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-200"><Trash2 className="w-4 h-4" /> Quitar automáticos</button>
              )}
            </div>
            <p className="text-[11px] font-bold text-slate-600">En el diseño: {tensoresEnEscena.length} tensores{luz ? ` · luz de la nave ${luz.toFixed(1)} m` : ''}. Su varilla o cable, templadores, tuercas y grapas salen en Materiales y en el presupuesto (precios del catálogo).</p>
            <p className="text-[10px] text-slate-500 bg-slate-50 rounded-lg p-2 leading-snug">Norma E.090 (RNE): no impone un tipo de tensor; debe resistir la fuerza de diseño. Las cruces de varilla o cable trabajan solo a tracción y se instalan tensadas con su templador. Diámetros sugeridos por la luz de la nave (práctica usual); confírmalos con el cálculo del ingeniero.</p>
            {ten.tipo === 'rigido' && <p className="text-[10px] text-slate-500">Para dibujar uno a mano usa la herramienta Cruz; la herramienta Tensor usa varilla o cable.</p>}
            {ten.tipo !== 'rigido' && <p className="text-[10px] text-slate-500">Para uno a mano: Más herramientas → <b>Tensor</b> y toca dos nodos; usa el modelo elegido aquí.</p>}
          </>) : modo === 'caida' ? (<>
            <p className="text-xs text-slate-500">Hacia dónde escurre el agua del techo, visto en planta (abajo = adelante / calle). Al cambiarla se gira todo el diseño: columnas, tijerales, correas y cobertura.</p>
            <p className="text-sm font-black text-slate-800">Caída actual: <span className="text-sky-700">{caida ? NOMBRE_CAIDA[caida] : 'techo plano o sin cobertura'}</span></p>
            <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
              <div />
              <button onClick={() => orientar('atras')} className={`flex flex-col items-center gap-0.5 py-2 rounded-xl text-[11px] font-bold cursor-pointer disabled:opacity-40 ${caida === 'atras' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}><ArrowUp className="w-4 h-4" />Atrás</button>
              <div />
              <button onClick={() => orientar('izquierda')} className={`flex flex-col items-center gap-0.5 py-2 rounded-xl text-[11px] font-bold cursor-pointer disabled:opacity-40 ${caida === 'izquierda' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}><ArrowLeft className="w-4 h-4" />Izquierda</button>
              <div className="flex items-center justify-center text-[10px] font-bold text-slate-400 text-center">planta</div>
              <button onClick={() => orientar('derecha')} className={`flex flex-col items-center gap-0.5 py-2 rounded-xl text-[11px] font-bold cursor-pointer disabled:opacity-40 ${caida === 'derecha' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}><ArrowRight className="w-4 h-4" />Derecha</button>
              <div />
              <button onClick={() => orientar('adelante')} className={`flex flex-col items-center gap-0.5 py-2 rounded-xl text-[11px] font-bold cursor-pointer disabled:opacity-40 ${caida === 'adelante' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}><ArrowDown className="w-4 h-4" />Adelante (calle)</button>
              <div />
            </div>
            <div className="rounded-xl bg-slate-50 p-3 space-y-2">
              <p className="text-sm font-black text-slate-800">Pendiente actual: <span className="text-sky-700">{pend && pend.pct > 0 ? `${pend.pct}%` : 'plano'}</span>{pend && pend.pct > 0 ? <span className="text-xs font-bold text-slate-500"> ({(Math.atan(pend.pct / 100) * 180 / Math.PI).toFixed(1)}°) · alero a {pend.yAlero.toFixed(2)} m</span> : null}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[8, 10, 15, 20, 27, 30].map(p => (
                  <button key={p} disabled={!pend || pend.pct <= 0} onClick={() => aplicarPendiente(p)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-40 ${pend?.pct === p ? 'bg-sky-600 text-white' : 'bg-white text-slate-700'}`}>{p}%</button>
                ))}
                <input type="number" min={1} max={100} value={pctNuevo} onChange={e => setPctNuevo(e.target.value)} placeholder="Otro %"
                  className="w-20 px-2 py-1.5 rounded-lg bg-white text-xs font-mono focus:outline-none" />
                <button disabled={!pend || pend.pct <= 0 || !(parseFloat(pctNuevo) > 0)} onClick={() => aplicarPendiente(parseFloat(pctNuevo))}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-black cursor-pointer disabled:opacity-40">Aplicar</button>
              </div>
              {minCob && pend && pend.pct > 0 && pend.pct < minCob.pct && (
                <p className="text-[11px] font-bold text-amber-700">⚠ {minCob.nombre}: se recomienda al menos {minCob.pct}% de pendiente (referencial del fabricante).</p>
              )}
              {minCob && <p className="text-[10px] text-slate-400">Mínimos referenciales: TR-4 10% · calamina 15% · Eternit 27% · policarbonato 10%.</p>}
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <button onClick={() => aplicar('girar90')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"><RotateCw className="w-3.5 h-3.5" /> Girar 90°</button>
              <button onClick={() => aplicar('reflejarX')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"><FlipHorizontal className="w-3.5 h-3.5" /> Espejo ↔</button>
              <button onClick={() => aplicar('reflejarZ')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"><FlipVertical className="w-3.5 h-3.5" /> Espejo ↕</button>
            </div>
          </>) : modo === 'cobertura' ? (<>
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
            <p className="text-xs text-slate-500">Cada tanque lleva su torre metálica de 4 patas y, si quieres, un <b>sobretecho</b> (techito sobre el tanque) con su cobertura. Puedes agregar varios: cambia la posición y vuelve a agregar. El <b>murete o parapeto de ladrillo</b> alrededor (sobrepecho) se agrega luego en Concreto.</p>
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
              <div className="col-span-2">
                <p className="text-[11px] font-bold text-slate-600 mb-0.5">¿Dónde se apoya?</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button type="button" disabled={!hayTecho} onClick={() => setUbicacion('techo')} className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer disabled:opacity-40 ${ubicacion === 'techo' ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-white border-slate-200 text-slate-600'}`}>Sobre el techo</button>
                  <button type="button" onClick={() => setUbicacion('cota')} className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${ubicacion === 'cota' ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-white border-slate-200 text-slate-600'}`}>Piso o losa (cota)</button>
                </div>
              </div>
              {ubicacion === 'cota'
                ? num('Apoya a la cota (m)', tq.cotaBase, v => setTq({ ...tq, cotaBase: Math.max(0, v) }))
                : <p className="text-[11px] text-slate-600 self-end pb-1">Apoya a <b>{alturaTechoEn(tq.x).toFixed(2)} m</b> (techo en ese punto)</p>}
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
                    <span>Tanque {tanques.indexOf(t) + 1} · {t.litros} L · X {t.x.toFixed(2)} Z {t.z.toFixed(2)} · cota {t.y.toFixed(2)} m{t.techo ? ' · con sobretecho' : ''}</span>
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
