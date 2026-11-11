// =============================================================================
// Presupuesto de obra: de dónde sale cada apartado.
//
// Cada apartado (Obra Civil, Techos, Drywall, Melamina, Gasfitería, Electricidad,
// CarpiMetal…) guarda en el equipo lo que se está cotizando. Aquí se LEE (nunca se
// escribe) con las mismas funciones de cálculo del apartado, para que el monto sea
// el mismo que se ve allá.
//
// Para sumar un apartado nuevo basta con agregar una entrada a FUENTES:
//   { id, nombre, icono, vista, color, leer(): Lectura | Promise<Lectura> }
// Los apartados que aún se están armando (Acabados, Carpintería de madera, Vidrios y
// aluminio) se leen de forma tolerante: si su clave existe y trae un total, entran.
// =============================================================================
import { Box, PenTool, PanelsTopLeft, Armchair, Droplets, Zap, DoorClosed, Paintbrush, TreePine, AppWindow } from 'lucide-react';
import { safeStorage } from '../../lib/storageManager';
import { leerCotizacionActual as leerMelamina } from '../melamina/cotizacionMelamina';
import { metradoMelamina, nombreMueble } from '../melamina/calculoMelamina';
import { leerCotizacionActual as leerDrywall } from '../drywall/cotizacionDrywall';
import { metradoPartidas, medidaPartida, sistemaDe } from '../drywall/calculoDrywall';
import { metradoDrywall } from '../concreto/metradoDrywall';
import { leerCotizacionActual as leerGas, defAparato } from '../gasfiteria/modeloGasfiteria';
import { metradoGas, GRUPOS_LINEA as GRUPOS_GAS } from '../gasfiteria/calculoGasfiteria';
import { leerCotizacionActual as leerEle } from '../electricidad/modeloElectricidad';
import { metradoEle, GRUPOS_LINEA as GRUPOS_ELE } from '../electricidad/calculoElectricidad';
import { leerDisenosCarpi } from '../concreto/carpiObra';
import { generarDespiece, generarMaterialesAgrupados, calcularCostosDesglosados } from '../herreria/herreriaCalculations';
import type { HerreriaDesign } from '../herreria/herreriaTypes';
import { sumaElementos, costoMaterialesConcreto, CATALOGO_ELEMENTOS, Instancia } from '../concreto/elementosConcreto';
import {
  SistemaNivel, TechoSnapshot, calcMuro, calcTanque, muroDesdePlano, KEY_SISTEMAS_NIVEL, KEY_TECHOS_DISPONIBLES, KEY_CAT_DRYWALL, KEY_CAT_LADRILLO,
  KEY_OBRA_TECHOS_ID, EstructuraTechos, contextosObra, obraPorPiso, drywallConCatalogo, ladrilloConCatalogo, osbConCatalogo, preciosConcretoCatalogo,
  sinOcultos, leerCatalogoOsb,
} from '../concreto/obraPisos';
import { KEY_CIELOS, KEY_AMBIENTES, KEY_SOBREPECHOS, CieloRaso, Sobrepecho } from '../concreto/geometriaObra';
import { DRYWALL_DEFAULTS, DrywallItem } from '../../catalogo/drywall';
import { LADRILLO_DEFAULTS, LadrilloItem } from '../../catalogo/ladrillo';
import type { PlanoElem } from '../ConcretoPlanoCad';
import { getCachedTechosDesigns } from '../../lib/techosDesignsRepo';
import { leerCostosTechos } from '../techos/costosTechos';

/** Una línea del presupuesto de un apartado (montos a costo directo). */
export interface PartidaFuente {
  descripcion: string;
  cantidad?: number;
  unidad?: string;
  subtotal: number;
  /** Si esta línea también la cotiza otro apartado (id): se omite cuando ese apartado está incluido. */
  origen?: string;
}
export interface Lectura {
  vacio: boolean;
  trabajo?: string;      // nombre de la cotización en el apartado
  cliente?: string;
  partidas: PartidaFuente[];
  directo: number;       // costo directo (materiales + mano de obra)
  venta: number;         // precio con los GG y la utilidad del propio apartado
  dias: number;          // días de trabajo
  diasEstimados?: boolean; // el apartado no da días: se estiman
  resumen: string;       // alcance corto para el cliente
  avisos?: string[];
}
export interface Fuente {
  id: string;
  nombre: string;
  icono: any;
  color: string;   // color de la barra del cronograma
  vista?: string;  // id de la vista para "Abrir apartado"
  leer: () => Lectura | Promise<Lectura>;
}

const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const f1 = (n: number) => n.toLocaleString('es-PE', { maximumFractionDigits: 1 });
const VACIA: Lectura = { vacio: true, partidas: [], directo: 0, venta: 0, dias: 0, resumen: '' };
const suma = (ps: PartidaFuente[]) => r2(ps.reduce((s, p) => s + p.subtotal, 0));
/** Reparte un total en partes proporcionales a sus montos sueltos (para que la suma cuadre). */
function repartir<T>(items: T[], suelto: (t: T) => number, total: number): number[] {
  const v = items.map(suelto), s = v.reduce((a, b) => a + b, 0);
  if (!(s > 0)) return items.map(() => r2(total / Math.max(1, items.length)));
  const out = v.map(x => r2(total * x / s));
  if (out.length) out[out.length - 1] = r2(out[out.length - 1] + total - out.reduce((a, b) => a + b, 0));
  return out;
}
const lista = (xs: string[], max = 4) => xs.length <= max ? xs.join(', ') : `${xs.slice(0, max).join(', ')} y ${xs.length - max} más`;

// ── Melamina ────────────────────────────────────────────────────────────────
function leerMelaminaFuente(): Lectura {
  const cot = leerMelamina();
  if (!cot.muebles.length) return VACIA;
  const op = { incluirCorte: cot.incluirCorte, incluirEnchape: cot.incluirEnchape, respetarVeta: cot.respetarVeta };
  const r = metradoMelamina(cot.muebles, op);
  const directo = r2(r.materiales + r.manoObra);
  // Un renglón por mueble: su parte del total (los tableros se optimizan juntos).
  const montos = repartir(cot.muebles, m => metradoMelamina([m], op).total, directo);
  const partidas = cot.muebles.map((m, i) => ({
    descripcion: `${nombreMueble(m)} (${f1(m.ancho)} × ${f1(m.alto)} m, ${m.color})`,
    cantidad: Math.max(1, Math.round(m.cantidad || 1)), unidad: 'und', subtotal: montos[i],
  }));
  return {
    vacio: false, trabajo: cot.nombre, cliente: cot.cliente, partidas, directo,
    venta: r2(directo * (1 + (cot.gg + cot.util) / 100)), dias: r.dias,
    resumen: `${cot.muebles.length} mueble(s) a medida: ${lista(cot.muebles.map(m => nombreMueble(m)))} · ${r.nTableros} tableros`,
  };
}

// ── Drywall (cotizador + lo dibujado en el plano compartido) ───────────────
function planoObra() {
  const niveles = safeStorage.getItem<string[]>('concreto_metrados_niveles', ['Cimentación', 'Piso 1']) || ['Cimentación', 'Piso 1'];
  const elems = safeStorage.getItem<PlanoElem[]>('concreto_plano_elems', []) || [];
  const cielos = safeStorage.getItem<Record<string, CieloRaso>>(KEY_CIELOS, {}) || {};
  const techosId = safeStorage.getItem<string>(KEY_OBRA_TECHOS_ID, '') || '';
  const diseno = techosId ? getCachedTechosDesigns().find(d => d.id === techosId) : undefined;
  const est = sinOcultos((diseno as unknown as EstructuraTechos) || null);
  return { niveles, elems, cielos, est, diseno };
}
function leerDrywallFuente(): Lectura {
  const cot = leerDrywall();
  const { niveles, elems, cielos, est } = planoObra();
  const plano = cot.excluirPlano ? [] : metradoDrywall(niveles, est, elems, cielos).filter(p => p.lineas.length > 0);
  if (!cot.partidas.length && !plano.length) return VACIA;
  const res = metradoPartidas(cot.partidas);
  const montos = repartir(cot.partidas, p => metradoPartidas([p]).total, res.total);
  const partidas: PartidaFuente[] = cot.partidas.map((p, i) => {
    const m = medidaPartida(p);
    return { descripcion: `${sistemaDe(p.sistema).nombre}${p.nombre ? ` – ${p.nombre}` : ''}`, cantidad: r2(m.valor), unidad: m.unidad, subtotal: montos[i] };
  });
  plano.forEach(p => partidas.push({ descripcion: `Drywall dibujado en el plano – ${p.nivel}`, cantidad: r2(p.tabiquesM2 + p.cieloM2), unidad: 'm²', subtotal: r2(p.materiales + p.manoObra) }));
  const directo = suma(partidas);
  const dias = res.dias + plano.reduce((x, p) => x + p.dias, 0);
  const m2 = cot.partidas.reduce((x, p) => x + medidaPartida(p).valor, 0) + plano.reduce((x, p) => x + p.tabiquesM2 + p.cieloM2, 0);
  return {
    vacio: false, trabajo: cot.nombre, cliente: cot.cliente, partidas, directo, venta: r2(directo * (1 + (cot.gg + cot.util) / 100)), dias,
    resumen: `${cot.partidas.length} partida(s)${plano.length ? ' + plano' : ''} · ${f1(m2)} m² de tabiques, cielos y cenefas`,
  };
}

// ── Obra Civil (igual que "COSTO REFERENCIAL TOTAL" de Metrados) ───────────
function leerObraCivilFuente(): Lectura {
  const niveles = safeStorage.getItem<string[]>('concreto_metrados_niveles', ['Cimentación', 'Piso 1']) || ['Cimentación', 'Piso 1'];
  const n0 = niveles[0] || 'Piso 1';
  const items = (safeStorage.getItem<Instancia[]>('concreto_metrados_items', []) || []).map(i => ({ ...i, nivel: i.nivel || n0 }))
    .filter(i => CATALOGO_ELEMENTOS.some(e => e.id === i.tipoId));
  const sistemas = safeStorage.getItem<Record<string, SistemaNivel>>(KEY_SISTEMAS_NIVEL, {}) || {};
  const catDrywall = drywallConCatalogo(safeStorage.getItem<DrywallItem[]>(KEY_CAT_DRYWALL, DRYWALL_DEFAULTS) || DRYWALL_DEFAULTS);
  const catLadrillo = ladrilloConCatalogo(safeStorage.getItem<LadrilloItem[]>(KEY_CAT_LADRILLO, LADRILLO_DEFAULTS) || LADRILLO_DEFAULTS);
  const catOsb = osbConCatalogo(leerCatalogoOsb());
  const techosLib = safeStorage.getItem<TechoSnapshot[]>(KEY_TECHOS_DISPONIBLES, []) || [];
  const { elems, cielos, est } = planoObra();
  const { ctx, pisos } = contextosObra(niveles, est);
  const nombres = safeStorage.getItem<Record<string, string>>(KEY_AMBIENTES, {}) || {};
  const sobrepechos = safeStorage.getItem<Record<string, Sobrepecho>>(KEY_SOBREPECHOS, {}) || {};
  // Lo dibujado en drywall lo cuenta Drywall (salvo que allá se haya quitado "Sumar lo dibujado").
  const dwPlano = leerDrywall().excluirPlano ? undefined : 'drywall';
  const resumen = obraPorPiso(niveles, est, elems, cielos, nombres, catDrywall, catOsb, catLadrillo, sobrepechos);

  const partidas: PartidaFuente[] = [];
  const t = sumaElementos(items);
  if (items.length) {
    const c = costoMaterialesConcreto(t, preciosConcretoCatalogo());
    const tipos = [...new Set(items.map(i => CATALOGO_ELEMENTOS.find(e => e.id === i.tipoId)!.nombre.toLowerCase()))];
    partidas.push({ descripcion: `Concreto armado: ${lista(tipos)} (concreto, acero ${f1(t.aceroKg)} kg y encofrado)`, cantidad: r2(t.concretoM3), unidad: 'm³', subtotal: r2(c.costo) });
  }
  let unidadesLadrillo = 0;
  niveles.forEach(nivel => {
    const sis = sistemas[nivel];
    const murosCad = elems.filter(e => e.tipo === 'muro' && (e.nivel || pisos[0] || niveles[0]) === nivel).map(e => muroDesdePlano(e, ctx(nivel)));
    const muros = [...murosCad.map(m => ({ m, cad: true })), ...(sis?.muros || []).map(m => ({ m, cad: false }))];
    const porTipo = new Map<string, { m2: number; costo: number; origen?: string }>();
    muros.forEach(({ m, cad }) => {
      const r = calcMuro(m, catDrywall, catLadrillo, catOsb);
      if (m.tipo === 'ladrillo') unidadesLadrillo += r.unidades;
      // Los muros secos dibujados en el plano también los metra Drywall.
      const clave = m.tipo === 'ladrillo' ? 'Muros de albañilería' : m.tipo === 'osb' ? 'Muros de OSB' : 'Muros de drywall (placas)';
      const org = cad && m.tipo !== 'ladrillo' ? dwPlano : undefined;
      const k = `${clave}|${org || ''}`;
      const x = porTipo.get(k) || { m2: 0, costo: 0, origen: org };
      x.m2 += m.areaM2; x.costo += r.costo; porTipo.set(k, x);
    });
    porTipo.forEach((v, k) => { if (v.costo > 0) partidas.push({ descripcion: `${k.split('|')[0]} – ${nivel}`, cantidad: r2(v.m2), unidad: 'm²', subtotal: r2(v.costo), origen: v.origen }); });
    if (sis?.tanque) { const tq = calcTanque(sis.tanque, catLadrillo); if (tq.costo) partidas.push({ descripcion: `Soporte de tanque elevado – ${nivel}`, cantidad: 1, unidad: 'glb', subtotal: r2(tq.costo) }); }
    (sis?.techoIds || []).map(id => techosLib.find(x => x.id === id)).forEach(tc => {
      if (tc && tc.costoDirectoSoles) partidas.push({ descripcion: `Techo metálico "${tc.nombre}" – ${nivel}`, cantidad: r2(tc.areaCoberturaM2), unidad: 'm²', subtotal: r2(tc.costoDirectoSoles), origen: 'techos' });
    });
    const o = resumen[nivel];
    if (!o) return;
    if (o.metal && (o.metal.costoAcero + o.metal.costoCobertura) > 0) partidas.push({ descripcion: `Estructura metálica y cobertura (de Techos) – ${nivel}`, cantidad: r2(o.metal.kg), unidad: 'kg', subtotal: r2(o.metal.costoAcero + o.metal.costoCobertura), origen: 'techos' });
    if (o.cielo?.costo) partidas.push({ descripcion: `Cielo raso ${o.cielo.nombre} – ${nivel}`, cantidad: r2(o.cielo.area), unidad: 'm²', subtotal: r2(o.cielo.costo), origen: dwPlano });
    if (o.cieloTanque?.costo) partidas.push({ descripcion: `Cielo raso bajo tanques – ${nivel}`, cantidad: r2(o.cieloTanque.area), unidad: 'm²', subtotal: r2(o.cieloTanque.costo), origen: dwPlano });
    o.carpi?.forEach(c => { if (c.costo) partidas.push({ descripcion: `${c.nombre} (${c.medidas}) – ${nivel}`, cantidad: 1, unidad: 'und', subtotal: r2(c.costo) }); });
    if (o.drywall && (o.drywall.accesorios + o.drywall.manoObra) > 0) partidas.push({ descripcion: `Drywall: perfiles, accesorios e instalación – ${nivel}`, subtotal: r2(o.drywall.accesorios + o.drywall.manoObra), origen: dwPlano });
    if (o.drywallCotizador?.total) partidas.push({ descripcion: `Drywall del cotizador (${o.drywallCotizador.partidas} partidas) – ${nivel}`, subtotal: r2(o.drywallCotizador.total), origen: 'drywall' });
    if (o.entrepisoOsb?.costo) partidas.push({ descripcion: `Entrepiso ${o.entrepisoOsb.nombre} – ${nivel}`, cantidad: r2(o.entrepisoOsb.area), unidad: 'm²', subtotal: r2(o.entrepisoOsb.costo) });
    o.tanques?.forEach(tq => { if (tq.costoSobrepecho) partidas.push({ descripcion: `Sobrepecho del tanque ${tq.numero} – ${nivel}`, cantidad: r2(tq.sobrepechoM2), unidad: 'm²', subtotal: r2(tq.costoSobrepecho) }); });
  });
  if (!partidas.length) return VACIA;
  const directo = suma(partidas);
  // Obra Civil no da plazo: ~1 día por m³ de concreto (cuadrilla con encofrado y acero) + ladrillo a 400 und/día.
  const dias = Math.max(1, Math.ceil(t.concretoM3 * 1 + unidadesLadrillo / 400));
  const ambientes = Object.values(resumen).flatMap(o => o.ambientes);
  return {
    vacio: false, partidas, directo, venta: directo, dias, diasEstimados: true,
    resumen: [items.length ? `${items.length} elemento(s) de concreto · ${f1(t.concretoM3)} m³` : '', ambientes.length ? `${ambientes.length} ambiente(s) · ${f1(ambientes.reduce((s, a) => s + a.area, 0))} m²` : '', `${niveles.length} nivel(es)`].filter(Boolean).join(' · '),
  };
}

// ── Techos Metálicos (el diseño abierto en Techos) ─────────────────────────
async function leerTechosFuente(): Promise<Lectura> {
  const escena = safeStorage.getItem<{ nodes: any; segments: any; coverageZones: any } | null>('innova_techos_escena_actual', null);
  if (!escena || !escena.segments || !Object.keys(escena.segments).length) return VACIA;
  const { generarReportePresupuestoBom } = await import('../techos/techosCadCalculations');
  const b = generarReportePresupuestoBom(escena.nodes || {}, escena.segments || {}, escena.coverageZones || {});
  if (!(b.costoDirectoTotalSoles > 0)) return VACIA;
  const area = b.resumenCoberturas.reduce((s, c) => s + c.areaRealSuperficieM2, 0);
  const kg = b.despiecePerfiles.reduce((s, p) => s + p.totalPesoAceroKg, 0);
  const partidas: PartidaFuente[] = [
    { descripcion: `Estructura metálica (${b.despiecePerfiles.length} perfiles, ${b.despiecePerfiles.reduce((s, p) => s + p.totalBarrasComerciales6m, 0)} barras)`, cantidad: r2(kg), unidad: 'kg', subtotal: r2(b.costoPerfilesSoles || 0) },
    { descripcion: `Cobertura: ${lista([...new Set(b.resumenCoberturas.map(c => c.nombreCobertura))])}`, cantidad: r2(area), unidad: 'm²', subtotal: r2(b.costoCoberturasSoles || 0) },
    { descripcion: 'Placas base, pernos, soldadura y tensores', subtotal: r2(b.costoAccesoriosSoles || 0) },
    { descripcion: 'Canaletas y bajadas', subtotal: r2(b.costoCanaletasSoles || 0) },
    { descripcion: 'Iluminación LED', subtotal: r2(b.costoLedSoles || 0) },
    { descripcion: 'Mecanismo móvil', subtotal: r2(b.costoMovilSoles || 0) },
    { descripcion: 'Fabricación y montaje (mano de obra)', subtotal: r2(b.costoManoObraMontajeSoles) },
    { descripcion: 'Equipos, grúa y transporte', subtotal: r2(b.costoEquiposGruaSoles) },
  ].filter(p => p.subtotal > 0);
  const directo = suma(partidas);
  const costos = leerCostosTechos();
  const diasCuadrilla = costos.manoObraModo === 'detalle' ? Math.max(0, ...costos.cuadrilla.map(f => f.dias || 0)) : 0;
  // Sin cuadrilla con días: ~250 kg de estructura por día (fabricación y montaje) + 60 m² de cobertura por día.
  const dias = diasCuadrilla || Math.max(2, Math.ceil(kg / 250 + area / 60));
  const nombre = safeStorage.getItem<string>('innova_techos_nombre_actual', '') || '';
  return {
    vacio: false, trabajo: nombre, partidas, directo, venta: r2(b.subtotalSoles ?? directo + b.gastosGeneralesYUtilidadSoles), dias, diasEstimados: !diasCuadrilla,
    resumen: `${nombre ? `${nombre} · ` : ''}${f1(area)} m² de cobertura · ${f1(kg)} kg de acero`,
  };
}

// ── Gasfitería y Electricidad ──────────────────────────────────────────────
function leerGasFuente(): Lectura {
  const cot = leerGas();
  if (!cot.aparatos.length && !cot.tramos.length) return VACIA;
  const r = metradoGas(cot);
  const cant: Record<string, [number, string] | undefined> = { 'Agua fría': [r.puntos.fria, 'pto'], 'Agua caliente': [r.puntos.caliente, 'pto'], 'Desagüe': [r.puntos.desague, 'pto'], 'Ventilación': [r.puntos.ventilacion, 'pto'] };
  const partidas = GRUPOS_GAS.map(g => {
    const s = r.lineas.filter(l => l.grupo === g).reduce((x, l) => x + l.subtotal, 0);
    return { descripcion: g === 'Mano de obra' ? 'Mano de obra de instalación y pruebas' : `${g}${cant[g] ? ' (tuberías y conexiones)' : ''}`, cantidad: cant[g]?.[0], unidad: cant[g]?.[1], subtotal: r2(s) };
  }).filter(p => p.subtotal > 0);
  const tipos = new Map<string, number>(); cot.aparatos.forEach(a => tipos.set(defAparato(a.tipo).corto, (tipos.get(defAparato(a.tipo).corto) || 0) + 1));
  return {
    vacio: false, trabajo: cot.nombre, cliente: cot.cliente, partidas, directo: r2(r.directo), venta: r2(r.directo * (1 + (cot.gg + cot.util) / 100)), dias: r.dias,
    resumen: `${cot.aparatos.length} aparato(s): ${lista([...tipos.entries()].map(([t, n]) => `${t}${n > 1 ? ` ×${n}` : ''}`))} · ${r.puntos.fria + r.puntos.caliente + r.puntos.desague} puntos`,
  };
}
function leerEleFuente(): Lectura {
  const cot = leerEle();
  if (!cot.puntos.length) return VACIA;
  const r = metradoEle(cot);
  const partidas = GRUPOS_ELE.map(g => ({ descripcion: g === 'Mano de obra' ? 'Mano de obra de instalación y pruebas' : g, subtotal: r2(r.lineas.filter(l => l.grupo === g).reduce((x, l) => x + l.subtotal, 0)) }))
    .filter(p => p.subtotal > 0);
  return {
    vacio: false, trabajo: cot.nombre, cliente: cot.cliente, partidas, directo: r2(r.directo), venta: r2(r.directo * (1 + (cot.gg + cot.util) / 100)), dias: r.dias,
    resumen: `${r.puntos.luz} luces · ${r.puntos.toma} tomacorrientes${r.puntos.fuerza ? ` · ${r.puntos.fuerza} de fuerza` : ''}${r.puntos.debil ? ` · ${r.puntos.debil} comunicaciones` : ''} · ${cot.circuitos.length} circuitos`,
  };
}

// ── CarpiMetal (el diseño abierto en Carpintería Metálica) ─────────────────
function leerCarpiFuente(): Lectura {
  const d = safeStorage.getItem<HerreriaDesign | null>('innova_herreria_current_design', null);
  if (!d || !(d.anchoM > 0) || !(d.altoM > 0)) return VACIA;
  let c;
  try { c = calcularCostosDesglosados(d, generarMaterialesAgrupados(d, generarDespiece(d))); } catch { return VACIA; }
  if (!(c.costoDirectoTotal > 0)) return VACIA;
  // Si el diseño está puesto en un vano de Obra Civil, Obra Civil ya lo suma.
  const elems = safeStorage.getItem<PlanoElem[]>('concreto_plano_elems', []) || [];
  const enObra = elems.some(e => (e.aberturas || []).some((a: any) => a.carpiId === d.id && a.incluir !== false));
  const origen = enObra ? 'concreto' : undefined;
  const partidas: PartidaFuente[] = [
    { descripcion: `${d.nombre || 'Diseño'}: materiales y accesorios`, cantidad: 1, unidad: 'und', subtotal: r2(c.materiales + c.accesorios), origen },
    { descripcion: 'Fabricación (corte, soldadura, armado, esmerilado y pintura)', subtotal: r2(c.corte + c.soldadura + c.armado + c.esmerilado + c.pintura), origen },
    { descripcion: 'Instalación y transporte', subtotal: r2(c.instalacion + c.transporte), origen },
  ].filter(p => p.subtotal > 0);
  const otros = leerDisenosCarpi().length;
  return {
    vacio: false, trabajo: d.nombre, partidas, directo: r2(c.costoDirectoTotal), venta: r2(c.precioTotalVenta), dias: 3, diasEstimados: true,
    resumen: `${d.nombre || d.tipoElemento} · ${f1(d.anchoM)} × ${f1(d.altoM)} m`,
    avisos: [enObra ? 'Este diseño está puesto en un vano de Obra Civil: si incluyes Obra Civil, se cuenta allá.' : '', otros > 1 ? 'Se toma el diseño abierto en Carpintería Metálica.' : ''].filter(Boolean),
  };
}

// ── Apartados nuevos (lectura tolerante) ───────────────────────────────────
// Busca, en orden, `<prefijo>resumen_integral`, `<prefijo>cotizacion_actual` y `<prefijo>presupuesto_actual`.
// Acepta { total | subtotal | directo, dias?, nombre?, cliente?, partidas?: [{ descripcion|nombre, cantidad?, unidad?, subtotal|total }] }.
function leerTolerante(prefijo: string): Lectura {
  for (const k of ['resumen_integral', 'cotizacion_actual', 'presupuesto_actual']) {
    let x: any = null;
    try { x = safeStorage.getItem<any>(prefijo + k, null); } catch { x = null; }
    if (!x || typeof x !== 'object') continue;
    const num = (v: any) => (typeof v === 'number' && isFinite(v) ? v : 0);
    const ps: PartidaFuente[] = (Array.isArray(x.partidas) ? x.partidas : Array.isArray(x.lineas) ? x.lineas : [])
      .map((p: any) => ({ descripcion: String(p?.descripcion || p?.nombre || 'Partida'), cantidad: num(p?.cantidad ?? p?.cant) || undefined, unidad: typeof p?.unidad === 'string' ? p.unidad : undefined, subtotal: r2(num(p?.subtotal ?? p?.total)) }))
      .filter((p: PartidaFuente) => p.subtotal > 0);
    const directo = r2(num(x.directo) || num(x.subtotal) || suma(ps) || num(x.total));
    if (!(directo > 0)) continue;
    const venta = r2(num(x.total) || num(x.venta) || directo);
    return {
      vacio: false, trabajo: typeof x.nombre === 'string' ? x.nombre : undefined, cliente: typeof x.cliente === 'string' ? x.cliente : undefined,
      partidas: ps.length ? ps : [{ descripcion: 'Según presupuesto del apartado', subtotal: directo }],
      directo, venta, dias: Math.max(0, num(x.dias)) || 2, diasEstimados: !num(x.dias), resumen: typeof x.resumen === 'string' ? x.resumen : (x.nombre || ''),
    };
  }
  return VACIA;
}

// Los apartados nuevos que ya traen su módulo de cálculo (modelo*.ts con leerCotizacionActual y
// calculo*.ts con metrado…()) se calculan igual que allá; si el módulo cambia o falla, se usa la lectura tolerante.
const MODULOS = import.meta.glob(['../acabados/*.ts', '../madera/*.ts', '../vidrios/*.ts']);
async function leerConModulo(carpeta: string, prefijo: string, cosas: string): Promise<Lectura> {
  try {
    const rutas = Object.keys(MODULOS).filter(k => k.startsWith(`../${carpeta}/`));
    const modelo = rutas.find(k => /\/modelo[^/]*\.ts$/.test(k)), calculo = rutas.find(k => /\/calculo[^/]*\.ts$/.test(k));
    if (modelo && calculo) {
      const [mm, mc] = await Promise.all([MODULOS[modelo](), MODULOS[calculo]()]) as [any, any];
      const fn = Object.entries(mc).find(([k, v]) => /^metrado/.test(k) && typeof v === 'function')?.[1] as any;
      if (typeof mm.leerCotizacionActual === 'function' && fn) {
        const cot = mm.leerCotizacionActual();
        const lista0 = Array.isArray(cot.items) ? cot.items : Array.isArray(cot.ambientes) ? cot.ambientes : Array.isArray(cot.partidas) ? cot.partidas : [];
        if (!lista0.length) return VACIA;
        const r = fn.length >= 2 ? fn(lista0, cot) : fn(cot);
        const directo = r2(r?.directo);
        if (directo > 0 && Array.isArray(r.lineas)) {
          const grupos = new Map<string, number>();
          r.lineas.forEach((l: any) => grupos.set(String(l.grupo || 'Materiales'), (grupos.get(String(l.grupo || 'Materiales')) || 0) + (Number(l.subtotal) || 0)));
          const partidas = [...grupos.entries()].map(([g, v]) => ({ descripcion: g === 'Mano de obra' ? 'Mano de obra' : g, subtotal: r2(v) })).filter(x => x.subtotal > 0);
          const pct = (Number(cot.gg) || 0) + (Number(cot.util) || 0);
          const dias = Number(r.dias) || 0;
          const nombres = lista0.map((x: any, i: number) => String(x?.nombre || `${cosas} ${i + 1}`));
          return {
            vacio: false, trabajo: cot.nombre, cliente: cot.cliente, partidas, directo, venta: r2(directo * (1 + pct / 100)),
            dias: dias || Math.max(1, Math.ceil(lista0.length * 1.5)), diasEstimados: !dias,
            resumen: `${lista0.length} ${cosas.toLowerCase()}(s): ${lista(nombres)}`,
          };
        }
      }
    }
  } catch { /* módulo en construcción: lectura tolerante */ }
  return leerTolerante(prefijo);
}

/** Apartados en el orden habitual de una obra (también el orden por defecto del cronograma). */
export const FUENTES: Fuente[] = [
  { id: 'concreto', nombre: 'Obra Civil', icono: Box, color: '#64748b', vista: 'concreto', leer: leerObraCivilFuente },
  { id: 'techos', nombre: 'Techos Metálicos', icono: PenTool, color: '#f59e0b', vista: 'techos', leer: leerTechosFuente },
  { id: 'gasfiteria', nombre: 'Gasfitería', icono: Droplets, color: '#0284c7', vista: 'gasfiteria', leer: leerGasFuente },
  { id: 'electricidad', nombre: 'Electricidad', icono: Zap, color: '#eab308', vista: 'electricidad', leer: leerEleFuente },
  { id: 'drywall', nombre: 'Drywall', icono: PanelsTopLeft, color: '#8b5cf6', vista: 'drywall', leer: leerDrywallFuente },
  { id: 'herreria', nombre: 'Carpintería Metálica', icono: DoorClosed, color: '#475569', vista: 'herreria', leer: leerCarpiFuente },
  { id: 'vidrios', nombre: 'Vidrios y aluminio', icono: AppWindow, color: '#06b6d4', vista: 'vidrios', leer: () => leerConModulo('vidrios', 'vidrios_', 'Ítem') },
  { id: 'madera', nombre: 'Carpintería de madera', icono: TreePine, color: '#a16207', vista: 'madera', leer: () => leerConModulo('madera', 'madera_', 'Ítem') },
  { id: 'acabados', nombre: 'Acabados', icono: Paintbrush, color: '#ec4899', vista: 'acabados', leer: () => leerConModulo('acabados', 'acabados_', 'Ambiente') },
  { id: 'melamina', nombre: 'Melamina', icono: Armchair, color: '#0d9488', vista: 'melamina', leer: leerMelaminaFuente },
];
export const fuenteDe = (id: string) => FUENTES.find(f => f.id === id);

/** Lee todos los apartados (los que fallan quedan vacíos). */
export async function leerFuentes(): Promise<Record<string, Lectura>> {
  const out: Record<string, Lectura> = {};
  await Promise.all(FUENTES.map(async f => {
    try { out[f.id] = await f.leer(); } catch { out[f.id] = VACIA; }
  }));
  return out;
}
