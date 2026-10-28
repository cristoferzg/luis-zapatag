// =============================================================================
// Extras de Obra Civil: acabados por ambiente (piso, pintura, zócalo),
// instalaciones básicas (puntos de luz, tomacorrientes, desagües…), losa
// aligerada (ladrillo de techo) y escalera de concreto. Cada uno con su
// metrado y su costo con el Catálogo de precios (ítems con precio 0 al inicio).
// =============================================================================
import { safeStorage } from '../../lib/storageManager';
import { precio, itemCatalogo } from '../../lib/catalogoPrecios';

// ── Acabados por ambiente ───────────────────────────────────────────────────
export type PisoAcabado = 'ninguno' | 'ceramico' | 'porcelanato' | 'cemento_pulido' | 'laminado' | 'vinilico';
export interface AcabadoAmbiente { piso: PisoAcabado; pintura: boolean; zocalo: boolean }
export const KEY_ACABADOS = 'concreto_acabados_ambiente';
export const ACABADO_VACIO: AcabadoAmbiente = { piso: 'ninguno', pintura: false, zocalo: false };
export const PISOS: { id: PisoAcabado; nombre: string; clave?: string }[] = [
  { id: 'ninguno', nombre: 'Sin piso' },
  { id: 'ceramico', nombre: 'Cerámico', clave: 'acab:piso_ceramico' },
  { id: 'porcelanato', nombre: 'Porcelanato', clave: 'acab:piso_porcelanato' },
  { id: 'cemento_pulido', nombre: 'Cemento pulido', clave: 'acab:piso_pulido' },
  { id: 'laminado', nombre: 'Piso laminado', clave: 'acab:piso_laminado' },
  { id: 'vinilico', nombre: 'Piso vinílico', clave: 'acab:piso_vinilico' },
];
export const leerAcabados = () => safeStorage.getItem<Record<string, AcabadoAmbiente>>(KEY_ACABADOS, {}) || {};

const perimetro = (poly: { x: number; y: number }[]) => poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + Math.hypot(q.x - p.x, q.y - p.y); }, 0);

export interface LineaExtra { clave: string; nombre: string; unidad: string; cantidad: number; precio: number; subtotal: number; nota: string }
const linea = (clave: string, cantidad: number, nota: string): LineaExtra => {
  const it = itemCatalogo(clave); const p = precio(clave);
  return { clave, nombre: it?.nombre || clave, unidad: it?.unidad || 'und', cantidad, precio: p, subtotal: cantidad * p, nota };
};

/** Metrado de acabados de un ambiente (área en m², polígono en m, alto de muro en m). */
export function metradoAcabado(a: AcabadoAmbiente, area: number, poly: { x: number; y: number }[], alto: number, nombre: string): LineaExtra[] {
  const out: LineaExtra[] = [];
  const per = perimetro(poly);
  const piso = PISOS.find(p => p.id === a.piso);
  if (piso?.clave) out.push(linea(piso.clave, Math.ceil(area * 1.05 * 10) / 10, `${nombre}: ${area.toFixed(2)} m² + 5 %`));
  if (a.pintura) out.push(linea('acab:pintura', Math.ceil(per * alto * 10) / 10, `${nombre}: muros ${per.toFixed(2)} m × ${alto.toFixed(2)} m`));
  if (a.zocalo) out.push(linea('acab:zocalo', Math.ceil(per * 10) / 10, `${nombre}: perímetro`));
  return out;
}

// ── Instalaciones básicas ───────────────────────────────────────────────────
export type TipoInstalacion = 'luz' | 'tomacorriente' | 'interruptor' | 'agua' | 'desague' | 'sumidero';
export interface PuntoInstalacion { uid: string; tipo: TipoInstalacion; x: number; y: number; nivel?: string }
export const KEY_INSTALACIONES = 'concreto_instalaciones';
export const INSTALACIONES: Record<TipoInstalacion, { nombre: string; simbolo: string; color: string; clave: string; grupo: 'Eléctricas' | 'Sanitarias' }> = {
  luz: { nombre: 'Punto de luz', simbolo: '✳', color: '#ca8a04', clave: 'inst:punto_luz', grupo: 'Eléctricas' },
  tomacorriente: { nombre: 'Tomacorriente', simbolo: '⏚', color: '#dc2626', clave: 'inst:tomacorriente', grupo: 'Eléctricas' },
  interruptor: { nombre: 'Interruptor', simbolo: 'S', color: '#9333ea', clave: 'inst:interruptor', grupo: 'Eléctricas' },
  agua: { nombre: 'Salida de agua', simbolo: '◉', color: '#0284c7', clave: 'inst:punto_agua', grupo: 'Sanitarias' },
  desague: { nombre: 'Salida de desagüe', simbolo: '⊗', color: '#57534e', clave: 'inst:punto_desague', grupo: 'Sanitarias' },
  sumidero: { nombre: 'Sumidero', simbolo: '▣', color: '#0f766e', clave: 'inst:sumidero', grupo: 'Sanitarias' },
};
export const leerInstalaciones = () => safeStorage.getItem<PuntoInstalacion[]>(KEY_INSTALACIONES, []) || [];
export function metradoInstalaciones(puntos: PuntoInstalacion[]): LineaExtra[] {
  const cuenta = new Map<TipoInstalacion, number>();
  puntos.forEach(p => cuenta.set(p.tipo, (cuenta.get(p.tipo) || 0) + 1));
  return [...cuenta.entries()].map(([t, n]) => linea(INSTALACIONES[t].clave, n, 'por punto (material y mano de obra)'));
}

// ── Losa aligerada ──────────────────────────────────────────────────────────
// Peralte → ladrillo de techo, concreto y acero por m² (valores usuales en Perú).
export const ALIGERADA: Record<string, { ladrilloClave: string; ladrillosM2: number; concretoM3M2: number; aceroKgM2: number }> = {
  '0.17': { ladrilloClave: 'obra:ladrillo_techo_12', ladrillosM2: 8.33, concretoM3M2: 0.075, aceroKgM2: 3.2 },
  '0.20': { ladrilloClave: 'obra:ladrillo_techo_15', ladrillosM2: 8.33, concretoM3M2: 0.0875, aceroKgM2: 3.6 },
  '0.25': { ladrilloClave: 'obra:ladrillo_techo_20', ladrillosM2: 8.33, concretoM3M2: 0.1, aceroKgM2: 4.4 },
};
export const datosAligerada = (h?: number) => ALIGERADA[h && h >= 0.24 ? '0.25' : h && h < 0.185 ? '0.17' : '0.20'];

// ── Escalera de concreto ────────────────────────────────────────────────────
/** Pasos de una escalera recta: largo en planta L, altura H, ancho a. */
export function escalera(L: number, H: number, a: number) {
  const n = Math.max(2, Math.round(H / 0.175));
  const cp = H / n, paso = L / n;
  const garganta = 0.15;
  const incl = Math.hypot(L, H);
  const concretoM3 = a * (incl * garganta + n * (paso * cp) / 2);
  return { n, cp, paso, incl, concretoM3, aceroKg: concretoM3 * 90, encofradoM2: a * incl + 2 * (incl * garganta + n * paso * cp / 2) + n * a * cp, ok: paso >= 0.24 && cp <= 0.185 };
}
