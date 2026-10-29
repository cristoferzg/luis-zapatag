// Módulo de Análisis Estructural, Simulador de Pandeo y Normativa Peruana (RNE E.020, E.030, E.050, E.090)
// Diseño amigable con la paleta y componentes de la plataforma
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Play,
  Pause,
  Zap,
  Building
} from 'lucide-react';

import { UseTechosCadEngineReturn } from './useTechosCadEngineState';
import { INVENTARIO_PERFILES_TUBULARES } from './techosCadCatalog';
import PandeoEstructura3D, { Riesgo } from './PandeoEstructura3D';
import { propsPerfil, factorK, limitesLambda, seAnaliza, perfilRecomendado, perfilMasEconomico, cumpleTramo } from './propiedadesPerfil';
import { precio, clavePerfilDe } from '../../lib/catalogoPrecios';

interface TechosEstructuralAnalysisViewProps {
  engineState: UseTechosCadEngineReturn;
}

export const TechosEstructuralAnalysisView: React.FC<TechosEstructuralAnalysisViewProps> = ({ engineState }) => {
  const { structuralReport, structuralInputs, setStructuralInputs, segments, nodes } = engineState;

  // Estados locales como string para edición numérica fluida sin saltos ni bloqueos al borrar
  const [cmStr, setCmStr] = useState<string>(String(structuralInputs.cargaMuertaKgM2 || 15));
  const [cvStr, setCvStr] = useState<string>(String(structuralInputs.cargaVivaKgM2 || 30));
  const [vvStr, setVvStr] = useState<string>(String(structuralInputs.velocidadVientoKmH || 75));

  // Estado del Simulador de Pandeo Animado
  const [isSimulatingBuckling, setIsSimulatingBuckling] = useState<boolean>(false);
  const [pieza3d, setPieza3d] = useState<string | null>(null);
  const [bucklingScale, setBucklingScale] = useState<number>(1.5);

  const isOK = structuralReport.resultadoGlobal === 'CUMPLE';

  const perfilDe = (id: string) => INVENTARIO_PERFILES_TUBULARES.find(p => p.id === id);
  const [avisoAplicar, setAvisoAplicar] = useState<string | null>(null);
  // Precio por metro del perfil según el Catálogo de precios (o el de referencia).
  const precioM = (p: any) => { const largo = p.longitudComercialM || 6; return precio(clavePerfilDe(p), (p.costoMetroSol || 0) * largo) / largo; };
  const [ahorro, setAhorro] = useState<null | { cambios: { rol: string; n: number; de: string; a: string; ahorro: number }[]; nuevos: Record<string, string>; total: number }>(null);

  // Cargas de servicio: área del techo en planta × (muerta + viva), repartida.
  const ns = Object.values(nodes);
  const xs = ns.map(n => n.x), zs = ns.map(n => n.z || 0);
  const areaTecho = ns.length ? (Math.max(...xs) - Math.min(...xs)) * (Math.max(...zs) - Math.min(...zs)) : 0;
  const qArea = ((structuralInputs.cargaMuertaKgM2 || 15) + (structuralInputs.cargaVivaKgM2 || 30)) * 9.81; // N/m²
  const largoDe = (seg: any) => { const a = nodes[seg.nodeAId], b = nodes[seg.nodeBId]; return a && b ? Math.hypot(b.x - a.x, b.y - a.y, (b.z || 0) - (a.z || 0)) : 0; };
  const segs = Object.values(segments) as any[];
  const nCols = Math.max(1, segs.filter(sg => sg.rolEstructural === 'columna' && Math.min(nodes[sg.nodeAId]?.y ?? 9, nodes[sg.nodeBId]?.y ?? 9) < 0.1).length);
  const LVigas = segs.filter(sg => /^viga|^cordon_superior/.test(sg.rolEstructural)).reduce((x, sg) => x + largoDe(sg), 0);
  const LCorreas = segs.filter(sg => sg.rolEstructural === 'correa').reduce((x, sg) => x + largoDe(sg), 0);
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const cargasDe = (rol: string) => {
    if (rol === 'columna') return { PkN: (areaTecho * qArea / 1000 / nCols) * 1.5 };   // ×1.5 viento/sismo y reparto desigual
    if (/^viga|^cordon_superior/.test(rol) && LVigas > 0) return { qNm: qArea * clamp(areaTecho / LVigas, 0.5, 4) * 1.2 };
    if (rol === 'correa' && LCorreas > 0) return { qNm: qArea * clamp(areaTecho / LCorreas, 0.3, 2.5) };
    return {};
  };

  // Cálculos de pandeo por elemento con la sección REAL de su perfil.
  const bucklingAnalysis = Object.values(segments).map(seg => {
    const nA = nodes[seg.nodeAId];
    const nB = nodes[seg.nodeBId];
    if (!nA || !nB || !seAnaliza(seg.rolEstructural)) return null;
    const lengthM = Math.hypot(nB.x - nA.x, nB.y - nA.y, (nB.z || 0) - (nA.z || 0));
    const perfil = perfilDe(seg.profileId);
    const pr = propsPerfil(perfil) || { areaCm2: 4, iMinCm4: 6, rMinCm: 1.2 };
    const K = factorK(seg.rolEstructural);
    const lambdaEsbeltez = (K * lengthM * 100) / pr.rMinCm;
    const lim = limitesLambda(seg.rolEstructural);
    const esbeltezOk = lambdaEsbeltez <= lim.maximo;
    // Carga crítica de Euler: Pcr = π²·E·I / (K·L)², acero A36 (E = 200 GPa).
    const PcrkN = (Math.PI ** 2 * 200e6 * (pr.iMinCm4 * 1e-8)) / Math.pow(K * Math.max(lengthM, 0.01), 2);
    // Con las cargas del techo: BAJO si cumple esbeltez E.090 y carga (columna) o flecha (viga).
    const riesgoPandeo: 'BAJO' | 'MEDIO' | 'ALTO' = lambdaEsbeltez > lim.maximo ? 'ALTO'
      : (perfil && cumpleTramo(perfil, seg.rolEstructural, lengthM, cargasDe(seg.rolEstructural))) || lambdaEsbeltez <= lim.bajo ? 'BAJO' : 'MEDIO';
    return {
      id: seg.id,
      rol: seg.rolEstructural,
      perfil: perfil?.nombre || seg.profileId,
      longitudM: lengthM.toFixed(2),
      lambdaEsbeltez: lambdaEsbeltez.toFixed(0),
      limite: lim.maximo,
      esbeltezOk,
      PcrkN: PcrkN.toFixed(1),
      riesgoPandeo
    };
  }).filter(Boolean) as any[];

  // Por cada rol y perfil actual, cambia al perfil más liviano que deja el tramo
  // más largo en riesgo BAJO. No cambia los roles ni los elementos que ya cumplen.
  const aplicarRecomendados = () => {
    const grupos = new Map<string, { ids: string[]; rol: any; perfil: string; Lmax: number }>();
    bucklingAnalysis.forEach(b => {
      if (b.riesgoPandeo === 'BAJO') return;
      const seg = segments[b.id];
      const k = `${seg.rolEstructural}|${seg.profileId}`;
      const g = grupos.get(k) || { ids: [], rol: seg.rolEstructural, perfil: seg.profileId, Lmax: 0 };
      g.ids.push(b.id); g.Lmax = Math.max(g.Lmax, parseFloat(b.longitudM)); grupos.set(k, g);
    });
    if (!grupos.size) { setAvisoAplicar('Todos los elementos ya están en riesgo bajo: no hay nada que cambiar.'); return; }
    const cambios: string[] = [];
    const nuevos: Record<string, string> = {};
    let sinOpcion = 0;
    grupos.forEach(g => {
      const rec = perfilRecomendado(INVENTARIO_PERFILES_TUBULARES, perfilDe(g.perfil), g.rol, g.Lmax, cargasDe(g.rol));
      if (!rec) { sinOpcion += g.ids.length; return; }
      if (rec.id === g.perfil) return;
      g.ids.forEach(id => { nuevos[id] = rec.id; });
      cambios.push(`${g.ids.length} ${String(g.rol).replace(/_/g, ' ')} → ${rec.nombre}`);
    });
    engineState.updateSegmentsProfiles(nuevos);
    setAvisoAplicar((cambios.length ? `✓ Cambiado: ${cambios.join(' · ')}.` : 'No hubo cambios.') + (sinOpcion ? ` ${sinOpcion} tramo(s) son muy largos para cualquier perfil del catálogo: agrega un apoyo o arriostre intermedio.` : ''));
    setTimeout(() => setAvisoAplicar(null), 12000);
  };

  // Busca, por cada grupo (rol + perfil), el perfil más barato que sigue sin
  // riesgo de pandeo (λ ≤ límite bajo) y calcula cuánto se ahorra.
  const calcularAhorro = () => {
    const grupos = new Map<string, { ids: string[]; rol: any; perfil: string; Lmax: number; Ltot: number }>();
    const vacio = (): string[] => [];
    Object.values(segments).forEach((seg: any) => {
      if (!seAnaliza(seg.rolEstructural)) return;
      const a = nodes[seg.nodeAId], b = nodes[seg.nodeBId]; if (!a || !b) return;
      const L = Math.hypot(b.x - a.x, b.y - a.y, (b.z || 0) - (a.z || 0));
      // Cada pieza por su largo: los tramos se agrupan por rol, perfil y largo (cada 0.5 m).
      const k = `${seg.rolEstructural}|${seg.profileId}|${Math.ceil(L * 2) / 2}`;
      const g = grupos.get(k) || { ids: vacio(), rol: seg.rolEstructural, perfil: seg.profileId, Lmax: 0, Ltot: 0 };
      g.ids.push(seg.id); g.Lmax = Math.max(g.Lmax, L); g.Ltot += L; grupos.set(k, g);
    });
    const cambios: { rol: string; n: number; de: string; a: string; ahorro: number }[] = [];
    const nuevos: Record<string, string> = {};
    grupos.forEach(g => {
      const act = perfilDe(g.perfil);
      const rec = perfilMasEconomico(INVENTARIO_PERFILES_TUBULARES, act, g.rol, g.Lmax, precioM, cargasDe(g.rol));
      if (!rec || !act || rec.id === act.id) return;
      const dif = (precioM(act) - precioM(rec)) * g.Ltot;
      if (dif <= 0.5) return;
      g.ids.forEach(id => { nuevos[id] = rec.id; });
      cambios.push({ rol: String(g.rol).replace(/_/g, ' '), n: g.ids.length, de: act.nombre, a: rec.nombre, ahorro: dif });
    });
    setAhorro({ cambios, nuevos, total: cambios.reduce((x, c) => x + c.ahorro, 0) });
  };
  const aplicarAhorro = () => {
    if (!ahorro) return;
    engineState.updateSegmentsProfiles(ahorro.nuevos);
    setAvisoAplicar(`✓ Aplicado: ahorras S/ ${ahorro.total.toFixed(2)} en perfiles y todo sigue sin riesgo de pandeo.`);
    setAhorro(null);
    setTimeout(() => setAvisoAplicar(null), 12000);
  };

  return (
    <div className="w-full h-full bg-slate-50 text-slate-800 p-4 sm:p-6 overflow-y-auto space-y-6 font-sans select-none">
      
      {/* 1. CABECERA NORMATIVA Y ESTADO GLOBAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">ANÁLISIS ESTRUCTURAL Y SIMULADOR DE PANDEO (RNE E.090)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verificación paramétrica de esfuerzos, esbeltez (λ), carga crítica de Euler (Pcr) y riesgo de pandeo lateral-torsional.
          </p>
        </div>

        {/* Estado de Cumplimiento Global y Acción Rápida */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={aplicarRecomendados}
            className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Aplica con un solo clic las dimensiones óptimas para cumplir la norma E.090"
          >
            <Zap className="w-4 h-4 text-slate-950" />
            <span>⚡ APLICAR CAMBIOS RECOMENDADOS (E.090)</span>
          </button>

          <button onClick={calcularAhorro}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Busca el perfil más barato que cumple la E.090 (sin riesgo de pandeo) en cada grupo">
            💰 <span>PERFIL MÁS ECONÓMICO QUE CUMPLE</span>
          </button>

          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold tracking-wide shadow-2xs ${
            isOK 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}>
            {isOK ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{isOK ? 'CUMPLE PREDISEÑO ESTRUCTURAL' : 'REQUIERE REFUERZO / MAYOR PERFIL'}</span>
          </div>
        </div>
      </div>

      {ahorro && (
        <div className="p-4 bg-white border-2 border-emerald-300 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-emerald-800">{ahorro.cambios.length ? `Puedes ahorrar S/ ${ahorro.total.toFixed(2)} en perfiles` : 'Tus perfiles ya son los más económicos que cumplen'}</p>
            <button onClick={() => setAhorro(null)} className="text-xs font-bold text-slate-400 cursor-pointer">Cerrar</button>
          </div>
          {ahorro.cambios.length > 0 && (<>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[480px]">
                <thead><tr className="text-[10px] uppercase text-slate-400 text-left"><th className="py-1">Elementos</th><th>Perfil actual</th><th>Más económico que cumple</th><th className="text-right">Ahorro</th></tr></thead>
                <tbody>
                  {ahorro.cambios.map((c, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-1.5 font-bold capitalize">{c.n} {c.rol}</td><td className="text-slate-500">{c.de}</td><td className="font-bold text-emerald-700">{c.a}</td><td className="text-right font-mono font-bold">S/ {c.ahorro.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500">Se compara con los precios de tu Catálogo de precios. Cada cambio deja cada tramo dentro de la esbeltez máxima de la E.090 y soporta la carga del techo (columnas) o no se flecha más de L/240 (vigas), con espesores mínimos para soldar (columnas 2 mm, vigas 1.5 mm). Es un prediseño: valídalo con un ingeniero.</p>
            <button onClick={aplicarAhorro} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer">Aplicar y ahorrar S/ {ahorro.total.toFixed(2)}</button>
          </>)}
        </div>
      )}

      {avisoAplicar && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900">{avisoAplicar}</div>
      )}

      {/* DISCLAIMER OBLIGATORIO */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs leading-relaxed shadow-2xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Nota de Ingeniería Estructural:</strong> Los cálculos de estabilidad y deformaciones por pandeo siguen las fórmulas de Euler e Inercia de la norma RNE E.090 (Estructuras Metálicas en Perú).
        </div>
      </div>

      {/* 2. PARÁMETROS NORMATIVOS (CARGA MUERTA, VIVA, VIENTO, SÍSMICA) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
          <span className="block text-xs font-black text-slate-700 uppercase">Carga Muerta (D) - E.020</span>
          <div className="flex items-center justify-between gap-2">
            <input 
              type="number"
              value={cmStr}
              onChange={(e) => {
                const val = e.target.value;
                setCmStr(val);
                const num = parseFloat(val);
                if (!isNaN(num) && num >= 0) {
                  setStructuralInputs(prev => ({ ...prev, cargaMuertaKgM2: num }));
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono text-sm font-bold focus:border-amber-500 focus:bg-white focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-bold shrink-0">kg/m²</span>
          </div>
          <p className="text-[10px] text-slate-500">Cobertura + peso propio acero</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
          <span className="block text-xs font-black text-slate-700 uppercase">Carga Viva (L) - E.020</span>
          <div className="flex items-center justify-between gap-2">
            <input 
              type="number"
              value={cvStr}
              onChange={(e) => {
                const val = e.target.value;
                setCvStr(val);
                const num = parseFloat(val);
                if (!isNaN(num) && num >= 0) {
                  setStructuralInputs(prev => ({ ...prev, cargaVivaKgM2: num }));
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono text-sm font-bold focus:border-amber-500 focus:bg-white focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-bold shrink-0">kg/m²</span>
          </div>
          <p className="text-[10px] text-slate-500">Sobrecarga de mantenimiento</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
          <span className="block text-xs font-black text-slate-700 uppercase">Velocidad Viento (V)</span>
          <div className="flex items-center justify-between gap-2">
            <input 
              type="number"
              value={vvStr}
              onChange={(e) => {
                const val = e.target.value;
                setVvStr(val);
                const num = parseFloat(val);
                if (!isNaN(num) && num >= 0) {
                  setStructuralInputs(prev => ({ ...prev, velocidadVientoKmH: num }));
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono text-sm font-bold focus:border-amber-500 focus:bg-white focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-bold shrink-0">km/h</span>
          </div>
          <p className="text-[10px] text-slate-500">Presión dinámica de viento</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
          <span className="block text-xs font-black text-slate-700 uppercase">Zona Sísmica - E.030</span>
          <select 
            value={structuralInputs.zonaSismica}
            onChange={(e) => setStructuralInputs(prev => ({ ...prev, zonaSismica: e.target.value as any }))}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono text-xs font-bold focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="Z4">Zona 4 (Costa / Z = 0.45g)</option>
            <option value="Z3">Zona 3 (Sierra / Z = 0.35g)</option>
            <option value="Z2">Zona 2 (Selva / Z = 0.25g)</option>
            <option value="Z1">Zona 1 (Z = 0.10g)</option>
          </select>
          <p className="text-[10px] text-slate-500">Factor de zona sísmica Z</p>
        </div>
      </div>

      {/* 3. SIMULADOR ANIMADO DE PANDEO ESTRUCTURAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase">Simulador Gráfico de Pandeo por Carga Crítica</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulatingBuckling(!isSimulatingBuckling)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                isSimulatingBuckling ? 'bg-amber-500 text-slate-950 shadow-xs font-black' : 'bg-sky-600 hover:bg-sky-700 text-white font-bold'
              }`}
            >
              {isSimulatingBuckling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isSimulatingBuckling ? 'PAUSAR SIMULACIÓN' : 'SIMULAR DEFORMACIÓN DE PANDEO'}</span>
            </button>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-bold">Escala:</span>
              <input 
                type="range"
                min="0.5"
                max="3.0"
                step="0.25"
                value={bucklingScale}
                onChange={(e) => setBucklingScale(parseFloat(e.target.value))}
                className="w-16 accent-amber-500 cursor-pointer"
              />
              <span className="font-mono font-bold text-amber-700">{bucklingScale}x</span>
            </div>
          </div>
        </div>

        {/* TU ESTRUCTURA EN 3D: dónde hay pandeo o flecha */}
        {(() => {
          const riesgos: Record<string, Riesgo> = {};
          bucklingAnalysis.forEach(b => { riesgos[b.id] = b.riesgoPandeo; });
          const n = (r: Riesgo) => bucklingAnalysis.filter(b => b.riesgoPandeo === r).length;
          const sel = bucklingAnalysis.find(b => b.id === pieza3d);
          return (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className="text-slate-700">En tu estructura:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">● {n('BAJO')} sin riesgo</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">● {n('MEDIO')} riesgo medio</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">● {n('ALTO')} riesgo alto</span>
                <span className="text-slate-400 font-semibold">Columnas que se arquean = pandeo · vigas que bajan = flecha (exagerado ×{bucklingScale}). Toca una pieza para ver su dato.</span>
              </div>
              <div className="relative w-full h-[360px] rounded-xl border border-slate-200 overflow-hidden">
                <PandeoEstructura3D nodes={nodes} segments={segments} riesgos={riesgos} escala={bucklingScale} animar={isSimulatingBuckling} alSeleccionar={setPieza3d} />
                {sel && (
                  <div className="absolute left-3 bottom-3 bg-white/95 border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-[11px] space-y-0.5">
                    <p className="font-black text-slate-800 capitalize">{String(sel.rol).replace(/_/g, ' ')} · {sel.longitudM} m</p>
                    <p className="text-slate-600">{sel.perfil}</p>
                    <p className="text-slate-600">Esbeltez λ = {sel.lambdaEsbeltez} (máx. {sel.limite}) · Pcr = {sel.PcrkN} kN</p>
                    <p className={`font-black ${sel.riesgoPandeo === 'ALTO' ? 'text-rose-600' : sel.riesgoPandeo === 'MEDIO' ? 'text-amber-600' : 'text-emerald-600'}`}>Riesgo {sel.riesgoPandeo.toLowerCase()}</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase pt-1">Cómo se ve cada caso</p>
            </div>
          );
        })()}

        {/* Lienzo 2D de Simulación de Pandeo en Líneas */}
        <div className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden flex items-center justify-center p-4">
          <svg className="w-full h-full">
            {/* Suelo */}
            <line x1="50" y1="160" x2="350" y2="160" stroke="#94a3b8" strokeWidth="4" />
            <line x1="450" y1="160" x2="750" y2="160" stroke="#94a3b8" strokeWidth="4" />

            {/* Muestra 1: Columna Sin Pandeo */}
            <g transform="translate(100, 0)">
              <line x1="100" y1="160" x2="100" y2="30" stroke="#2563eb" strokeWidth="6" />
              <text x="100" y="20" fill="#475569" fontSize="10" textAnchor="middle" fontWeight="bold">Recto (Normal)</text>
              <rect x="80" y="155" width="40" height="10" fill="#cbd5e1" />
            </g>

            {/* Muestra 2: Columna con Pandeo Animado */}
            <g transform="translate(350, 0)">
              <path 
                d={isSimulatingBuckling 
                  ? `M 100 160 Q ${100 + 25 * bucklingScale} 95 100 30` 
                  : 'M 100 160 Q 100 95 100 30'} 
                fill="none" 
                stroke="#d97706" 
                strokeWidth="6" 
                className={isSimulatingBuckling ? 'animate-pulse' : ''}
              />
              {/* Flecha Carga Compresión */}
              <line x1="100" y1="5" x2="100" y2="25" stroke="#dc2626" strokeWidth="3" markerEnd="url(#arrow)" />
              <text x="100" y="20" fill="#d97706" fontSize="10" textAnchor="middle" fontWeight="black">Pandeo Euler (λ &gt; 150)</text>
              <rect x="80" y="155" width="40" height="10" fill="#cbd5e1" />
            </g>

            {/* Muestra 3: Viga / Tijeral con Flecha Deflexión */}
            <g transform="translate(600, 0)">
              <path 
                d={isSimulatingBuckling 
                  ? `M 20 80 Q 100 ${80 + 20 * bucklingScale} 180 80` 
                  : 'M 20 80 Q 100 80 180 80'} 
                fill="none" 
                stroke="#0284c7" 
                strokeWidth="5" 
              />
              <text x="100" y="65" fill="#0284c7" fontSize="10" textAnchor="middle" fontWeight="bold">Flexión / Deflexión Viga</text>
            </g>
          </svg>
        </div>

        {/* RECOMENDACIONES DE TALLER PARA EVITAR PANDEO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs font-black text-amber-700 block flex items-center gap-1">
              <Building className="w-3.5 h-3.5" />
              1. Pandeo en Columnas
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Si la longitud supera los 4.0m, utilizar tubo cuadrado de mínimo <strong>100x100x3.0mm</strong> o adicionar cartelas triangulares de refuerzo en la plancha base.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs font-black text-amber-700 block flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              2. Pandeo Lateral en Vigas
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Colocar viguetas/correas a un espaciamiento máximo de <strong>1.20m a 1.40m</strong> para brindar soporte lateral continuo al cordón comprimido.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs font-black text-amber-700 block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              3. Templadores (Sag Rods)
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Instalar templadores lisos de 1/2" en el centro de los paños de correas para evitar que las correas C/Z se alabeen antes de instalar la cobertura.
            </p>
          </div>
        </div>
      </div>

      {/* 4. TABLA DE EVALUACIÓN DE ESBELTEZ Y PANDEO POR PIEZA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-600" />
          <span>VERIFICACIÓN DE ESBELTEZ Y CARGA CRÍTICA (Pcr) DE PANDEO</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-black">
                <th className="p-3">ID Elemento</th>
                <th className="p-3">Rol Estructural</th>
                <th className="p-3">Perfil</th>
                <th className="p-3">Longitud</th>
                <th className="p-3">Esbeltez (λ = KL/r)</th>
                <th className="p-3">Carga Crítica (Pcr)</th>
                <th className="p-3">Nivel de Riesgo Pandeo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bucklingAnalysis.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                    No hay elementos trazados en el modelo CAD para simular pandeo.
                  </td>
                </tr>
              ) : (
                bucklingAnalysis.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors font-mono">
                    <td className="p-3 text-amber-700 font-bold">{b.id}</td>
                    <td className="p-3 text-slate-700 capitalize font-sans">{b.rol.replace('_', ' ')}</td>
                    <td className="p-3 text-slate-600 font-sans text-[11px]">{b.perfil}</td>
                    <td className="p-3 text-slate-600">{b.longitudM} m</td>
                    <td className={`p-3 font-bold ${b.esbeltezOk ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {b.lambdaEsbeltez} {b.esbeltezOk ? `✓ (<=${b.limite})` : `⚠️ Excesiva (>${b.limite})`}
                    </td>
                    <td className="p-3 text-sky-700 font-bold">{b.PcrkN} kN</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        b.riesgoPandeo === 'BAJO' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                          : b.riesgoPandeo === 'MEDIO'
                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
                          : 'bg-rose-50 text-rose-800 border border-rose-300'
                      }`}>
                        RIESGO {b.riesgoPandeo}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TechosEstructuralAnalysisView;
