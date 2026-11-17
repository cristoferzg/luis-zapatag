// =============================================================================
// Lo ACORDADO con el cliente en un techo vs el PRESUPUESTO ACTUAL del diseño.
// El acuerdo se fija cuando el cliente acepta la propuesta por el link o con el
// botón "Marcar como acordado"; se guarda en el proyecto (campo opcional
// `techos`) y el monto acordado pasa a ser el presupuesto del proyecto.
// =============================================================================
import type { Project, TechosDelProyecto } from '../types';
import { getCachedTechosDesigns } from './techosDesignsRepo';
import { leerPropuesta } from './propuestas';

/** Presupuesto actual de un diseño de Techos guardado: precio de venta (con tus % de
 *  gastos y utilidad) y costo directo (materiales + mano de obra + equipos). */
export async function datosDiseno(disenoId?: string): Promise<{ venta: number; costo: number } | null> {
  if (!disenoId) return null;
  const d = getCachedTechosDesigns().find(x => x.id === disenoId);
  if (!d) return null;
  const { generarReportePresupuestoBom } = await import('../components/techos/techosCadCalculations');
  const r = generarReportePresupuestoBom(d.nodes || {}, d.segments || {}, (d as any).coverageZones || {});
  return { venta: r.precioVentaFinalSoles, costo: r.costoDirectoTotalSoles };
}
export async function presupuestoActualDiseno(disenoId?: string): Promise<number | null> {
  return (await datosDiseno(disenoId))?.venta ?? null;
}

/** Precio de cada opción partiendo del precio pactado: la opción base vale exactamente
 *  ese precio y las demás suman o restan solo la diferencia de su cobertura. */
export function opcionesDesdePrecio(opciones: { nombre: string; cobertura: string; total: number }[], baseNombre: string | undefined, precio: number) {
  const base = opciones.find(o => o.nombre === baseNombre) || opciones[Math.min(1, opciones.length - 1)];
  if (!base || !(precio > 0)) return opciones;
  return opciones.map(o => ({ ...o, total: Math.max(0, Math.round((precio + (o.total - base.total)) * 100) / 100) }));
}

/** Aplica un acuerdo al proyecto: guarda el detalle y pone el monto como presupuesto. */
export function conAcuerdo(p: Project, t: TechosDelProyecto, acordado: NonNullable<TechosDelProyecto['acordado']>): Project {
  return { ...p, presupuesto: Math.round(acordado.total * 100) / 100, techos: { ...(p.techos || {}), ...t, acordado } };
}

/**
 * Revisa los links enviados: si el cliente aceptó una opción y el proyecto aún
 * no la tiene como acuerdo, devuelve los proyectos actualizados (o null si nada cambió).
 */
export async function sincronizarAceptadas(projects: Project[]): Promise<Project[] | null> {
  let cambio = false;
  const out = await Promise.all(projects.map(async p => {
    const t = p.techos;
    if (!t?.propuestaId) return p;
    try {
      const r: any = await leerPropuesta(t.propuestaId);
      const estado = r?.bloqueada ? r.doc?.estado : r?.estado;
      const i = r?.bloqueada ? r.doc?.aceptadaOpcion : r?.aceptadaOpcion;
      const en = r?.bloqueada ? r.doc?.aceptadaEn : r?.aceptadaEn;
      if (estado !== 'aceptada' || typeof i !== 'number' || !t.opciones?.[i]) return p;
      if (t.acordado?.fuente === 'link' && t.acordado.fecha === en) return p;
      cambio = true;
      const o = t.opciones[i];
      return conAcuerdo(p, t, { opcion: o.nombre, cobertura: o.cobertura, total: o.total, fecha: en || new Date().toISOString(), fuente: 'link' });
    } catch { return p; }
  }));
  return cambio ? out : null;
}

export const fechaCorta = (iso?: string) => iso ? new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
