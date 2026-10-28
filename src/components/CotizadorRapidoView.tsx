// =============================================================================
// Calculadora estructural rápida de techos: forma (una agua, dos aguas, arco),
// tijerales (sí/no, cantidad y tipo), correas según la cobertura, columnas
// automáticas con placa y pernos, despiece en barras comerciales, cobertura
// completa (planchas, cumbrera, pernos, canaletas) y presupuesto por m² o por
// materiales con los precios del catálogo. "Abrir en Techos 3D" pasa las
// medidas al Asistente de Techos.
// =============================================================================
import { useState, useEffect, useMemo } from 'react';
import { Calculator, TrendingUp, DollarSign, PieChart, ShieldCheck, Box, Layers, Scissors, Package, FileText } from 'lucide-react';
import { safeStorage } from '../lib/storageManager';
import { INVENTARIO_PERFILES_TUBULARES, INVENTARIO_COBERTURAS, SOLDADURA_AWS_E6011, PLACA_BASE_ESTANDAR, PERNO_ANCLAJE_J, PERNO_EPDM_ESTANDAR } from './techos/techosCadCatalog';
import { precio, clavePerfilDe, claveCobertura, useCatalogo } from '../lib/catalogoPrecios';

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
const n = (v: string, d = 0) => { const x = parseFloat(v); return Number.isFinite(x) ? x : d; };

type Forma = 'una_agua' | 'dos_aguas' | 'arco';
type TipoTij = 'pratt' | 'howe' | 'warren' | 'escalera_vierendeel' | 'parabolico_warren';
const TIPOS_TIJERAL: { id: TipoTij; nombre: string; nota: string }[] = [
  { id: 'pratt', nombre: 'Pratt', nota: 'Montantes + diagonales al centro' },
  { id: 'howe', nombre: 'Howe', nota: 'Montantes + diagonales a los apoyos' },
  { id: 'warren', nombre: 'Warren', nota: 'Solo diagonales en zigzag' },
  { id: 'escalera_vierendeel', nombre: 'Escalera', nota: 'Solo montantes a 90°' },
  { id: 'parabolico_warren', nombre: 'Arco reticulado', nota: 'Para techo en arco' },
];

const perfil = (id: string) => INVENTARIO_PERFILES_TUBULARES.find(p => p.id === id) || INVENTARIO_PERFILES_TUBULARES[0];
/** Precio por metro del perfil (del catálogo de precios, que viene por barra comercial). */
const precioMetro = (id: string) => { const p = perfil(id); return precio(clavePerfilDe(p), p.costoMetroSol * (p.longitudComercialM || 6)) / (p.longitudComercialM || 6); };
const PERFILES_OPC = INVENTARIO_PERFILES_TUBULARES.filter(p => ['tubo_cuadrado', 'tubo_rectangular', 'tubo_redondo', 'perfil_c'].includes(p.categoria));

/** Separación de correas recomendada según la cobertura. */
function sepCorreas(cobId: string) {
  const c = INVENTARIO_COBERTURAS.find(x => x.id === cobId);
  if (!c) return 1.0;
  if (c.categoria === 'fibrocemento_eternit') return Math.round(Math.max(0.6, Math.min(1.45, c.longitudComercialM - c.traslapeTransversalMinMm / 1000)) * 100) / 100;
  if (c.categoria === 'panel_sandwich_pur') return 1.5;
  if (c.categoria === 'policarbonato_alveolar' || c.categoria === 'upvc_termoacustica') return 0.9;
  return 1.0;
}

/** Corte de piezas en barras comerciales (primero las más largas). */
function despiece(piezas: number[], barra: number) {
  const restos: number[] = []; let barras = 0, empalmes = 0;
  const lista: number[] = [];
  piezas.forEach(p => {
    let r = p;
    while (r > barra + 1e-6) { barras++; empalmes++; r -= barra; } // piezas largas: barras enteras + empalme soldado
    if (r > 0.01) lista.push(r);
  });
  lista.sort((a, b) => b - a).forEach(p => {
    const i = restos.findIndex(x => x >= p - 0.01); // 3 mm de corte entre piezas (1 cm de tolerancia)
    if (i >= 0) restos[i] -= p + 0.003; else { barras++; restos.push(barra - p - 0.003); }
  });
  const total = piezas.reduce((s, p) => s + p, 0);
  return { barras, empalmes, metros: total, desperdicio: barras > 0 ? Math.max(0, 1 - total / (barras * barra)) : 0 };
}

const CLAVE = 'innova_cotizador_rapido_data';
const GANANCIA_MAX = 20; // % máximo de ganancia del contratista sobre el precio
const inicial = {
  calcLargo: '', calcAncho: '', calcAlero: '0', calcBarLength: '6', calcAlturaColumnas: '3', calcNumColumnas: '',
  precioPorM2: '140', margenGananciaPct: '20', v: 3,
  forma: 'dos_aguas' as Forma, pendiente: '15', flecha: '',
  conTijerales: true, numTijerales: '', sepPorticos: '5', tipoTijeral: 'pratt' as TipoTij, peralte: '',
  perfilCordon: 'perfil_sq_2x2_20', perfilCelosia: 'perfil_sq_1x1_15', perfilViga: 'perfil_rec_100x50_20', perfilColumna: 'perfil_sq_4x4_20', perfilCorrea: 'perfil_rec_2x1_15',
  cobertura: 'cob_aluzinc_tr4_035', sepCorrea: '', canaletas: false, placas: false,
  modo: 'materiales' as 'm2' | 'materiales', manoObraPct: '40', gastosPct: '10',
};

interface Props {
  /** Dentro de Materiales & Gastos: sin título grande. */
  embebida?: boolean;
  /** Si hay proyecto elegido: pasa el precio y el detalle al contrato. */
  onAgregarAlContrato?: (d: { total: number; detalle: string }) => void;
}

const CotizadorRapidoView = ({ embebida = false, onAgregarAlContrato }: Props = {}) => {
  useCatalogo(); // recalcula si cambian los precios del catálogo
  const [f, setF] = useState(() => {
    const d = safeStorage.getItem<any>(CLAVE, null) || {};
    const cob = INVENTARIO_COBERTURAS.some(c => c.id === d.cobertura) ? d.cobertura : (INVENTARIO_COBERTURAS.find(c => /tr4/i.test(c.id))?.id || INVENTARIO_COBERTURAS[0].id);
    const g = (d.v ?? 0) >= 2 ? d.margenGananciaPct : '20'; // antes venía en 25 %
    // v3: cálculo clásico por m² sin adicionales (alero, canaletas, placas apagados al empezar)
    const sinAdicionales = (d.v ?? 0) < 3 ? { calcAlero: '0', canaletas: false, placas: false } : {};
    return { ...inicial, ...d, ...sinAdicionales, cobertura: cob, margenGananciaPct: g, v: 3 };
  });
  const set = <K extends keyof typeof inicial>(k: K, v: (typeof inicial)[K]) => setF((x: typeof inicial) => ({ ...x, [k]: v }));
  useEffect(() => { safeStorage.setItem(CLAVE, f); }, [f]);

  const r = useMemo(() => {
    const L = n(f.calcLargo), A = n(f.calcAncho), alero = Math.max(0, n(f.calcAlero)), H = n(f.calcAlturaColumnas, 3);
    const p = Math.max(0, n(f.pendiente, 15)) / 100;
    const forma = f.forma as Forma;
    if (L <= 0 || A <= 0) return null;
    // Faldones: largo inclinado de cada caída (sin y con alero)
    const flecha = forma === 'arco' ? (n(f.flecha) > 0 ? n(f.flecha) : Math.round(A * 0.15 * 100) / 100) : 0;
    const arco = (c: number, fl: number) => c + (8 * fl * fl) / (3 * c);
    const faldones = forma === 'una_agua' ? [Math.hypot(A, A * p)] : forma === 'dos_aguas' ? [Math.hypot(A / 2, A / 2 * p), Math.hypot(A / 2, A / 2 * p)] : [arco(A, flecha)];
    const faldonesAlero = forma === 'arco' ? [arco(A + 2 * alero, flecha * (1 + 2 * alero / A) ** 2)] : faldones.map(fl => fl * (1 + (forma === 'una_agua' ? 2 * alero / A : alero / (A / 2))));
    const largoCob = L + 2 * alero;
    const areaPlanta = (A + 2 * alero) * largoCob;
    // Lo que se cobra al cliente: largo × ancho, como siempre (sin alero ni inclinación).
    const areaCobro = L * A;
    const areaReal = faldonesAlero.reduce((s, x) => s + x, 0) * largoCob;
    const subida = forma === 'una_agua' ? A * p : forma === 'dos_aguas' ? A / 2 * p : flecha;

    // Pórticos (tijerales o vigas)
    const sepP = Math.max(1, n(f.sepPorticos, 5));
    const nP = Math.max(2, n(f.numTijerales) > 1 ? Math.round(n(f.numTijerales)) : Math.ceil(L / sepP) + 1);
    const sepReal = L / (nP - 1);
    const topLen = faldones.reduce((s, x) => s + x, 0);
    const peralte = n(f.peralte) > 0 ? n(f.peralte) : Math.round(Math.max(0.4, Math.min(1.2, A / 15)) * 100) / 100;
    const piezasPorPerfil = new Map<string, number[]>();
    const add = (id: string, largo: number, veces = 1) => { if (largo <= 0 || veces <= 0) return; const a = piezasPorPerfil.get(id) || []; for (let i = 0; i < veces; i++) a.push(largo); piezasPorPerfil.set(id, a); };
    let tij: { paneles: number; montantes: number; diagonales: number; largoDiag: number } | null = null;
    if (f.conTijerales) {
      const tipo = f.tipoTijeral as TipoTij;
      const paneles = Math.max(4, Math.ceil(topLen / Math.max(0.5, peralte)) + (Math.ceil(topLen / Math.max(0.5, peralte)) % 2));
      const panel = topLen / paneles;
      const montantes = tipo === 'warren' || tipo === 'parabolico_warren' ? 0 : paneles + 1;
      const diagonales = tipo === 'escalera_vierendeel' ? 0 : paneles;
      const largoDiag = Math.hypot(panel, peralte);
      tij = { paneles, montantes, diagonales, largoDiag };
      faldones.forEach(fl => add(f.perfilCordon, fl, nP)); // cordón superior por faldón
      add(f.perfilCordon, forma === 'arco' ? arco(A, Math.max(0, flecha - peralte)) : topLen, nP); // cordón inferior paralelo
      add(f.perfilCelosia, peralte, montantes * nP);
      add(f.perfilCelosia, largoDiag, diagonales * nP);
    } else {
      faldones.forEach(fl => add(f.perfilViga, fl, nP)); // viga simple por pórtico
    }
    // Columnas: 2 por pórtico (o lo que diga el usuario)
    const nCol = n(f.calcNumColumnas) > 0 ? Math.round(n(f.calcNumColumnas)) : nP * 2;
    const altCol = forma === 'una_agua' ? [H, H + A * p] : [H, H];
    for (let i = 0; i < nCol; i++) add(f.perfilColumna, altCol[i % 2]);
    // Vigas de amarre longitudinales (cabeza de columnas)
    add(f.perfilViga, L, 2);
    // Correas
    const sepC = n(f.sepCorrea) > 0 ? n(f.sepCorrea) : sepCorreas(f.cobertura);
    const lineasCorrea = faldonesAlero.reduce((s, fl) => s + Math.ceil(fl / sepC) + 1, 0);
    add(f.perfilCorrea, largoCob, lineasCorrea);

    const barra = n(f.calcBarLength, 6);
    const despieces = [...piezasPorPerfil.entries()].map(([id, piezas]) => {
      const d = despiece(piezas, barra);
      const pm = precioMetro(id);
      return { id, nombre: perfil(id).nombre, piezas: piezas.length, ...d, costo: d.barras * barra * pm, precioBarra: pm * barra };
    });
    const metrosAcero = despieces.reduce((s, d) => s + d.metros, 0);
    const costoAcero = despieces.reduce((s, d) => s + d.costo, 0);

    // Cobertura completa
    const cob = INVENTARIO_COBERTURAS.find(c => c.id === f.cobertura) || INVENTARIO_COBERTURAS[0];
    const anchoUtil = cob.anchoUtilMm / 1000, largoPl = cob.longitudComercialM || 6, traslape = cob.traslapeTransversalMinMm / 1000;
    const planchas = faldonesAlero.reduce((s, fl) => s + Math.ceil(largoCob / anchoUtil) * Math.max(1, Math.ceil((fl - traslape) / Math.max(0.3, largoPl - traslape))), 0);
    const items: { nombre: string; cant: string; costo: number }[] = [];
    items.push({ nombre: cob.nombre, cant: `${planchas} planchas (${areaReal.toFixed(1)} m²)`, costo: areaReal * precio(claveCobertura(cob.id), cob.costoM2Sol) });
    const pernos = Math.ceil(areaReal * (cob.pernosRequeridosPorM2 || 4));
    items.push({ nombre: 'Pernos autoperforantes con arandela EPDM', cant: `${pernos} und (${Math.ceil(pernos / 100)} caja${pernos > 100 ? 's' : ''})`, costo: Math.ceil(pernos / 100) * precio('techos:perno_epdm', PERNO_EPDM_ESTANDAR.costoCaja100Sol) });
    if (forma === 'dos_aguas') items.push({ nombre: 'Cumbrera', cant: `${largoCob.toFixed(1)} m`, costo: largoCob * precio('techos:cumbrera') });
    if (f.canaletas) {
      const lados = forma === 'una_agua' ? 1 : 2;
      const bajadas = lados * Math.max(2, Math.ceil(largoCob / 10) + 1);
      items.push({ nombre: 'Canaleta galvanizada', cant: `${(largoCob * lados).toFixed(1)} m`, costo: largoCob * lados * precio('agua:canaleta_galv') });
      items.push({ nombre: 'Bajadas de agua', cant: `${bajadas} × ${H.toFixed(1)} m`, costo: bajadas * H * precio('agua:bajada_galv') });
    }
    if (f.placas) {
      items.push({ nombre: 'Placas base', cant: `${nCol} und`, costo: nCol * precio('techos:placa_base', PLACA_BASE_ESTANDAR.costoUnidadSol) });
      items.push({ nombre: 'Pernos de anclaje', cant: `${nCol * 4} und`, costo: (nCol * 4 / 100) * precio('techos:perno_anclaje', PERNO_ANCLAJE_J.costoCaja100Sol) }); // se compran por unidad
    }
    const kgSold = Math.round(metrosAcero * SOLDADURA_AWS_E6011.consumoKgPorMetroJunta * 0.35 * 10) / 10;
    items.push({ nombre: 'Soldadura E6011', cant: `${kgSold} kg`, costo: kgSold * precio('soldadura:kg', SOLDADURA_AWS_E6011.costoKgSol) });
    const costoCob = items.reduce((s, i) => s + i.costo, 0);

    const materiales = costoAcero + costoCob;
    const manoObra = materiales * n(f.manoObraPct, 40) / 100;
    const gastos = (materiales + manoObra) * n(f.gastosPct, 10) / 100;
    const costoDirecto = materiales + manoObra + gastos;
    // La ganancia del contratista es como máximo el 20 % del precio al cliente.
    const utilidadPct = Math.min(GANANCIA_MAX, Math.max(0, n(f.margenGananciaPct, GANANCIA_MAX)));
    const totalMateriales = costoDirecto / (1 - utilidadPct / 100);
    const precioM2Sugerido = totalMateriales / areaCobro;
    // Por m²: del precio sale primero tu ganancia (20 %); de lo que queda se pagan
    // materiales y, lo restante, la mano de obra y los gastos.
    const totalM2 = areaCobro * n(f.precioPorM2, 140);
    const gananciaM2 = totalM2 * utilidadPct / 100;
    const paraManoObraM2 = totalM2 - gananciaM2 - materiales;

    return { L, A, H, alero, forma, flecha, subida, areaPlanta, areaCobro, areaReal, largoCob, nP, sepReal, peralte, tij, nCol, altCol, sepC, lineasCorrea, despieces, metrosAcero, costoAcero, planchas, items, costoCob, materiales, manoObra, gastos, costoDirecto, totalMateriales, totalM2, utilidadPct, precioM2Sugerido, gananciaM2, paraManoObraM2 };
  }, [f]);

  const total = r ? (f.modo === 'm2' ? r.totalM2 : r.totalMateriales) : 0;
  const ganancia = r ? (f.modo === 'm2' ? r.gananciaM2 : r.totalMateriales - r.costoDirecto) : 0;
  const costos = r ? (f.modo === 'm2' ? r.totalM2 - r.gananciaM2 : r.costoDirecto) : 0;
  const noAlcanza = !!r && f.modo === 'm2' && r.paraManoObraM2 < r.manoObra + r.gastos; // el m² no cubre mano de obra y gastos estimados

  const detalleContrato = () => {
    if (!r) return '';
    const formaTxt = r.forma === 'una_agua' ? 'a una agua' : r.forma === 'dos_aguas' ? 'a dos aguas' : 'en arco';
    const tipoTxt = TIPOS_TIJERAL.find(t => t.id === f.tipoTijeral)?.nombre || '';
    const cob = INVENTARIO_COBERTURAS.find(c => c.id === f.cobertura);
    return [
      `Estructura de techo metálico ${formaTxt}.`,
      `Medidas: ${r.L} m × ${r.A} m, alero ${r.alero} m. Área ${r.areaCobro.toFixed(2)} m² (largo × ancho).`,
      `Estructura: ${r.nP} ${f.conTijerales ? `tijerales tipo ${tipoTxt} (peralte ${r.peralte} m)` : 'vigas'} cada ${r.sepReal.toFixed(2)} m, ${r.nCol} columnas de ${r.H} m, correas cada ${r.sepC} m.`,
      `Acero: ${r.despieces.map(d => `${d.barras} barras ${perfil(d.id).nombre}`).join('; ')}.`,
      `Cobertura: ${cob?.nombre || ''}, ${r.planchas} planchas.`,
      ...r.items.slice(1).map(i => `- ${i.nombre}: ${i.cant}`),
      '',
      `Presupuesto a todo costo: S/ ${total.toFixed(2)}`,
    ].join('\n');
  };

  const abrirEn3D = () => {
    if (!r) return;
    try {
      localStorage.setItem('innova_cotizador_a_techos', JSON.stringify({
        tipo: r.forma === 'arco' ? 'parabolico' : r.forma, luzStr: String(r.A), largoStr: String(r.L), alturaColStr: String(r.H),
        pendienteStr: String(n(f.pendiente, 15)), alturaCol2Str: String(Math.round((r.H + r.subida * (r.forma === 'una_agua' ? 1 : 0)) * 100) / 100),
        flechaStr: String(r.flecha || ''), numTijeralesStr: String(r.nP), tipoTijeral: f.conTijerales ? f.tipoTijeral : 'escalera_vierendeel', trussHeightM: r.peralte,
      }));
    } catch { /* sin almacenamiento */ }
    window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: 'techos' }));
  };

  const inp = 'w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500';
  const lab = 'block text-xs font-semibold text-indigo-800 mb-1 uppercase tracking-wider';
  const chip = (on: boolean) => `px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${on ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`;
  const selPerfil = (k: 'perfilCordon' | 'perfilCelosia' | 'perfilViga' | 'perfilColumna' | 'perfilCorrea', t: string) => (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">{t}</label>
      <select value={f[k]} onChange={e => set(k, e.target.value)} className={inp + ' text-xs'}>
        {PERFILES_OPC.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </select>
    </div>
  );

  // Dibujo del tijeral (elevación) para ver el tipo elegido
  const dibujoTijeral = () => {
    const W = 320, Hh = 90, x0 = 10, x1 = W - 10, yB = Hh - 12;
    const forma = f.forma as Forma;
    const topY = (x: number) => { const t = (x - x0) / (x1 - x0); if (forma === 'una_agua') return 22 + t * 30; if (forma === 'dos_aguas') return 22 + Math.abs(t - 0.5) * 60; return 18 + 4 * (t - 0.5) ** 2 * 34; };
    const pk = 22; const k = 10;
    const pts = Array.from({ length: k + 1 }, (_, i) => x0 + (i * (x1 - x0)) / k);
    const bot = (x: number) => topY(x) + pk;
    const tipo = f.tipoTijeral as TipoTij;
    const lineas: [number, number, number, number][] = [];
    pts.forEach((x, i) => {
      if (i < k) { lineas.push([x, topY(x), pts[i + 1], topY(pts[i + 1])]); lineas.push([x, bot(x), pts[i + 1], bot(pts[i + 1])]); }
      if (tipo !== 'warren' && tipo !== 'parabolico_warren') lineas.push([x, topY(x), x, bot(x)]);
      if (i < k && tipo !== 'escalera_vierendeel') {
        const xa = pts[i + 1], izq = i < k / 2;
        if (tipo === 'warren' || tipo === 'parabolico_warren') lineas.push(i % 2 ? [x, topY(x), xa, bot(xa)] : [x, bot(x), xa, topY(xa)]);
        else if ((tipo === 'pratt') === izq) lineas.push([x, topY(x), xa, bot(xa)]); else lineas.push([x, bot(x), xa, topY(xa)]);
      }
    });
    return (
      <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full h-24">
        {f.conTijerales ? lineas.map(([a, b, c, d], i) => <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#4f46e5" strokeWidth={1.4} />)
          : pts.slice(0, -1).map((x, i) => <line key={i} x1={x} y1={topY(x)} x2={pts[i + 1]} y2={topY(pts[i + 1])} stroke="#4f46e5" strokeWidth={4} />)}
        <line x1={x0} y1={topY(x0)} x2={x0} y2={yB + 8} stroke="#059669" strokeWidth={3} />
        <line x1={x1} y1={topY(x1)} x2={x1} y2={yB + 8} stroke="#059669" strokeWidth={3} />
      </svg>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <header className="mb-2 flex flex-wrap justify-between items-end gap-3">
        <div className={embebida ? 'hidden' : ''}>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center">
            <Calculator className="w-8 h-8 mr-3 text-indigo-500" />
            Calculadora Estructural y Presupuesto
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Tijerales, correas, columnas, despiece en barras, cobertura completa y precio real con tu catálogo.</p>
        </div>
        {r && onAgregarAlContrato && (
          <button onClick={() => onAgregarAlContrato({ total, detalle: detalleContrato() })} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow cursor-pointer hover:bg-emerald-700">
            <FileText className="w-4 h-4" /> Agregar al Contrato
          </button>
        )}
        {r && (
          <button onClick={abrirEn3D} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow cursor-pointer hover:bg-indigo-700">
            <Box className="w-4 h-4" /> Abrir en Techos 3D
          </button>
        )}
      </header>

      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 sm:p-6 space-y-6">
        {/* 1. MEDIDAS Y FORMA */}
        <section className="space-y-3">
          <h4 className="font-bold text-slate-800 text-sm border-b border-indigo-200/60 pb-2">1. Medidas y forma del techo</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div><label className={lab}>Largo (m)</label><input value={f.calcLargo} onChange={e => set('calcLargo', e.target.value)} type="number" step="0.1" min="0" className={inp} placeholder="Ej. 10.5" /></div>
            <div><label className={lab}>Ancho / luz (m)</label><input value={f.calcAncho} onChange={e => set('calcAncho', e.target.value)} type="number" step="0.1" min="0" className={inp} placeholder="Ej. 6.2" /></div>
            <div><label className={lab}>Altura columnas (m)</label><input value={f.calcAlturaColumnas} onChange={e => set('calcAlturaColumnas', e.target.value)} type="number" step="0.1" className={inp} placeholder="3.0" /></div>
            <div><label className={lab}>Alero (m)</label><input value={f.calcAlero} onChange={e => set('calcAlero', e.target.value)} type="number" step="0.05" min="0" className={inp} placeholder="0.30" /></div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {([['una_agua', 'Una agua'], ['dos_aguas', 'Dos aguas'], ['arco', 'Arco']] as [Forma, string][]).map(([k, t]) => (
              <button key={k} type="button" onClick={() => set('forma', k)} className={chip(f.forma === k)}>{t}</button>
            ))}
            {f.forma !== 'arco' ? (
              <div className="w-28"><label className="block text-[11px] font-semibold text-slate-500 mb-1">Pendiente (%)</label><input value={f.pendiente} onChange={e => set('pendiente', e.target.value)} type="number" className={inp} /></div>
            ) : (
              <div className="w-32"><label className="block text-[11px] font-semibold text-slate-500 mb-1">Flecha del arco (m)</label><input value={f.flecha} onChange={e => set('flecha', e.target.value)} type="number" step="0.1" className={inp} placeholder={r ? String(r.flecha) : 'auto'} /></div>
            )}
          </div>
        </section>

        {/* 2. TIJERALES / VIGAS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
            <h4 className="font-bold text-slate-800 text-sm">2. Tijerales</h4>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <span>{f.conTijerales ? 'Con tijerales' : 'Sin tijerales (vigas simples)'}</span>
              <button type="button" role="switch" aria-checked={f.conTijerales} aria-label="Usar tijerales" onClick={() => set('conTijerales', !f.conTijerales)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${f.conTijerales ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${f.conTijerales ? 'left-5' : 'left-0.5'}`} />
              </button>
            </label>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[11px] font-semibold text-slate-500 mb-1">Cantidad</label><input value={f.numTijerales} onChange={e => set('numTijerales', e.target.value)} type="number" className={inp} placeholder={r ? `${r.nP} (auto)` : 'auto'} /></div>
                <div><label className="block text-[11px] font-semibold text-slate-500 mb-1">o cada (m)</label><input value={f.sepPorticos} onChange={e => set('sepPorticos', e.target.value)} type="number" step="0.5" className={inp} /></div>
                {f.conTijerales && <div><label className="block text-[11px] font-semibold text-slate-500 mb-1">Peralte (m)</label><input value={f.peralte} onChange={e => set('peralte', e.target.value)} type="number" step="0.05" className={inp} placeholder={r ? `${r.peralte} (auto)` : 'auto'} /></div>}
              </div>
              {f.conTijerales && (
                <div className="flex flex-wrap gap-1.5">
                  {TIPOS_TIJERAL.map(t => (
                    <button key={t.id} type="button" onClick={() => set('tipoTijeral', t.id)} title={t.nota} className={chip(f.tipoTijeral === t.id)}>{t.nombre}</button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {f.conTijerales ? <>{selPerfil('perfilCordon', 'Perfil de cordones')}{selPerfil('perfilCelosia', 'Perfil de montantes y diagonales')}</> : selPerfil('perfilViga', 'Perfil de la viga')}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Así queda cada pórtico</p>
              {dibujoTijeral()}
              {r && <p className="text-[11px] text-slate-600">{r.nP} pórticos cada {r.sepReal.toFixed(2)} m{r.tij ? ` · ${r.tij.paneles} paneles · ${r.tij.montantes} montantes y ${r.tij.diagonales} diagonales por tijeral · peralte ${r.peralte} m` : ''}</p>}
            </div>
          </div>
        </section>

        {/* 3. COLUMNAS, CORREAS Y COBERTURA */}
        <section className="space-y-3">
          <h4 className="font-bold text-slate-800 text-sm border-b border-indigo-200/60 pb-2">3. Columnas, correas y cobertura</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div><label className="block text-[11px] font-semibold text-slate-500 mb-1">Columnas (cantidad)</label><input value={f.calcNumColumnas} onChange={e => set('calcNumColumnas', e.target.value)} type="number" className={inp} placeholder={r ? `${r.nP * 2} (2 por pórtico)` : 'auto'} /></div>
            {selPerfil('perfilColumna', 'Perfil de columna')}
            <div><label className="block text-[11px] font-semibold text-slate-500 mb-1">Correas cada (m)</label><input value={f.sepCorrea} onChange={e => set('sepCorrea', e.target.value)} type="number" step="0.05" className={inp} placeholder={`${sepCorreas(f.cobertura)} (según cobertura)`} /></div>
            {selPerfil('perfilCorrea', 'Perfil de correa')}
          </div>
          <div className="grid lg:grid-cols-4 gap-3 items-end">
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cobertura</label>
              <select value={f.cobertura} onChange={e => set('cobertura', e.target.value)} className={inp + ' font-bold text-indigo-900'}>
                {INVENTARIO_COBERTURAS.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Barra comercial</label>
              <select value={f.calcBarLength} onChange={e => set('calcBarLength', e.target.value)} className={inp}>
                <option value="6">6.00 m</option><option value="12">12.00 m</option><option value="13.5">13.50 m</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={f.canaletas} onChange={e => set('canaletas', e.target.checked)} className="w-4 h-4 accent-indigo-600" /> Canaletas y bajadas <span className="text-slate-400 font-semibold">(adicional)</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={f.placas} onChange={e => set('placas', e.target.checked)} className="w-4 h-4 accent-indigo-600" /> Placas base y pernos <span className="text-slate-400 font-semibold">(adicional)</span></label>
            </div>
          </div>
        </section>

        {r && (
          <>
            {/* RESUMEN */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {([
                ['Área a cobrar', `${r.areaCobro.toFixed(1)} m²`, `largo × ancho${r.alero > 0 ? ` (el alero no se cobra)` : ''}`, 'bg-indigo-50 border-indigo-200 text-indigo-900'],
                ['Área de cobertura', `${r.areaReal.toFixed(1)} m²`, 'real, con la inclinación', 'bg-orange-50 border-orange-200 text-orange-900'],
                ['Acero', `${r.metrosAcero.toFixed(0)} m`, `${r.despieces.reduce((s, d) => s + d.barras, 0)} barras de ${f.calcBarLength} m`, 'bg-slate-50 border-slate-200 text-slate-900'],
                ['Cobertura', `${r.planchas}`, 'planchas', 'bg-emerald-50 border-emerald-200 text-emerald-900'],
              ] as [string, string, string, string][]).map(([t, v, s, c]) => (
                <div key={t} className={`p-3 rounded-xl border text-center ${c}`}>
                  <p className="text-[11px] font-bold uppercase opacity-80">{t}</p>
                  <p className="text-2xl font-black">{v}</p>
                  <p className="text-[11px] opacity-70">{s}</p>
                </div>
              ))}
            </div>

            {/* DESPIECE */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2"><Scissors className="w-4 h-4 text-indigo-500" /> Despiece en barras de {f.calcBarLength} m (cortes optimizados)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[560px]">
                  <thead><tr className="text-[10px] uppercase text-slate-400 text-left"><th className="py-1">Perfil</th><th className="text-right">Piezas</th><th className="text-right">Metros</th><th className="text-right">Barras</th><th className="text-right">Desperdicio</th><th className="text-right">Costo</th></tr></thead>
                  <tbody>
                    {r.despieces.map(d => (
                      <tr key={d.id} className="border-t border-slate-100">
                        <td className="py-1.5 font-bold text-slate-800">{d.nombre}{d.empalmes > 0 && <span className="ml-1 text-[10px] font-semibold text-amber-600">({d.empalmes} empalmes)</span>}</td>
                        <td className="text-right">{d.piezas}</td><td className="text-right">{d.metros.toFixed(1)}</td>
                        <td className="text-right font-black text-indigo-700">{d.barras}</td>
                        <td className="text-right">{(d.desperdicio * 100).toFixed(0)} %</td>
                        <td className="text-right font-mono">{formatCurrency(d.costo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* COBERTURA Y ACCESORIOS */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2"><Layers className="w-4 h-4 text-orange-500" /> Cobertura y accesorios</h4>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                {r.items.map(i => (
                  <div key={i.nombre} className="flex justify-between gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="min-w-0"><p className="font-bold text-slate-800">{i.nombre}</p><p className="text-[11px] text-slate-500">{i.cant}</p></div>
                    <span className="font-mono font-bold text-slate-700 shrink-0">{i.costo > 0 ? formatCurrency(i.costo) : <span className="text-slate-400 font-sans text-[10px]">sin precio</span>}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Los precios salen de tu catálogo (Precios). Los que dicen "sin precio" ponlos ahí una vez y quedan para siempre.</p>
            </div>

            {/* PRESUPUESTO */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-5 md:p-8 rounded-2xl border border-indigo-800/80 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><TrendingUp className="w-32 h-32 text-indigo-400" /></div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-5 pb-4 border-b border-indigo-800/60 relative z-10 gap-4">
                <div>
                  <h4 className="font-bold text-indigo-300 text-sm uppercase tracking-wider flex items-center gap-2"><PieChart className="w-4 h-4 text-emerald-400" /> Presupuesto al cliente</h4>
                  <div className="flex gap-1 mt-2 bg-slate-800/80 p-1 rounded-lg w-fit">
                    {([['materiales', 'Por materiales'], ['m2', 'Por m²']] as ['materiales' | 'm2', string][]).map(([k, t]) => (
                      <button key={k} onClick={() => set('modo', k)} className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer ${f.modo === k ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs font-bold">
                  {f.modo === 'm2' && (
                    <label className="text-slate-400">PRECIO/m²<span className="flex items-center text-indigo-300 mt-0.5">S/ <input type="number" value={f.precioPorM2} onChange={e => set('precioPorM2', e.target.value)} className="w-16 ml-1 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-right" /></span></label>
                  )}
                  <>
                    <label className="text-slate-400">MANO DE OBRA<span className="flex items-center text-indigo-300 mt-0.5"><input type="number" value={f.manoObraPct} onChange={e => set('manoObraPct', e.target.value)} className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-right" /><span className="ml-1">%</span></span></label>
                    <label className="text-slate-400">GASTOS<span className="flex items-center text-indigo-300 mt-0.5"><input type="number" value={f.gastosPct} onChange={e => set('gastosPct', e.target.value)} className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-right" /><span className="ml-1">%</span></span></label>
                    <label className="text-slate-400">GANANCIA<span className="flex items-center text-emerald-300 mt-0.5"><input type="number" min={0} max={GANANCIA_MAX} value={f.margenGananciaPct} onChange={e => set('margenGananciaPct', String(Math.min(GANANCIA_MAX, Number(e.target.value) || 0)))} className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-right" /><span className="ml-1">% <span className="text-slate-500">(máx. {GANANCIA_MAX})</span></span></span></label>
                  </>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <div className="bg-indigo-600/30 p-5 rounded-xl border border-indigo-500/40 text-center">
                  <h5 className="text-indigo-200 text-xs font-semibold uppercase mb-2 flex justify-center items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Precio al cliente</h5>
                  <p className="text-3xl font-bold">{formatCurrency(total)}</p>
                  <p className="text-xs text-indigo-300 mt-1">{f.modo === 'm2' ? `${r.areaCobro.toFixed(1)} m² (largo × ancho) × S/ ${f.precioPorM2}` : `S/ ${(total / r.areaCobro).toFixed(0)} por m² (largo × ancho)`}</p>
                </div>
                <div className={`p-5 rounded-xl border text-center ${!noAlcanza ? 'bg-emerald-950/70 border-emerald-500/60' : 'bg-rose-950/70 border-rose-500/60'}`}>
                  <h5 className="text-emerald-300 text-xs font-extrabold uppercase mb-2 flex justify-center items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Tu ganancia</h5>
                  <p className={`text-3xl font-extrabold ${!noAlcanza ? 'text-emerald-300' : 'text-rose-300'}`}>{formatCurrency(ganancia)}</p>
                  <p className="text-xs text-emerald-200/80 mt-1">{total > 0 ? `${((ganancia / total) * 100).toFixed(0)} % del precio` : ''}</p>
                </div>
                <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60 text-center">
                  <h5 className="text-slate-300 text-xs font-semibold uppercase mb-2 flex justify-center items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Tus costos</h5>
                  <p className="text-3xl font-bold text-slate-200">{formatCurrency(costos)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{f.modo === 'm2'
                    ? `Materiales ${formatCurrency(r.materiales)} · Queda para mano de obra y gastos ${formatCurrency(r.paraManoObraM2)} (calculado: ${formatCurrency(r.manoObra + r.gastos)})`
                    : `Materiales ${formatCurrency(r.materiales)} · Mano de obra ${formatCurrency(r.manoObra)} · Gastos ${formatCurrency(r.gastos)}`}</p>
                </div>
              </div>
              {noAlcanza && (
                <p className="relative z-10 mt-4 text-xs font-bold text-rose-200 bg-rose-950/60 border border-rose-500/50 rounded-lg px-3 py-2">
                  {r.paraManoObraM2 < 0 ? 'Con este precio por m² no alcanza ni para los materiales.' : 'Con este precio por m² no alcanza para la mano de obra y los gastos calculados.'} Sube el precio a S/ {Math.ceil(r.precioM2Sugerido)} por m².
                </p>
              )}
              <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <Package className="w-3.5 h-3.5" />
                <span>Precio justo por m² (materiales + mano de obra + gastos + {r.utilidadPct} % de ganancia): <b className="text-white">S/ {Math.ceil(r.precioM2Sugerido)}</b> · total {formatCurrency(r.totalMateriales)}.</span>
                {f.modo === 'm2' && Math.ceil(r.precioM2Sugerido) !== n(f.precioPorM2) && (
                  <button onClick={() => set('precioPorM2', String(Math.ceil(r.precioM2Sugerido)))} className="px-2 py-1 rounded-md bg-indigo-600 text-white font-bold cursor-pointer">Usar S/ {Math.ceil(r.precioM2Sugerido)}/m²</button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CotizadorRapidoView;
