// =============================================================================
// Piezas comunes de "Carpintería de madera" y "Vidrios y aluminio":
//   · Línea de presupuesto con el precio del catálogo único.
//   · Empaque de cortes en barras (perfiles de 6 m): primero el más largo,
//     en la barra donde menos sobra (best fit decreasing), con ancho de sierra.
//   · Cotización base guardada en el equipo (actual + lista).
// =============================================================================
import { itemCatalogo, precio } from '../../../lib/catalogoPrecios';
import { safeStorage } from '../../../lib/storageManager';

export const uid = () => Math.random().toString(36).slice(2, 10);
export const r2 = (n: number) => Math.round(n * 100) / 100;
/** Redondea hacia arriba a pasos (p. ej. 0.25 galón). */
export const arriba = (n: number, paso: number) => (n <= 0 ? 0 : Math.ceil(n / paso - 1e-9) * paso);

export interface Linea { grupo: string; clave: string; nombre: string; nota: string; cant: number; unidad: string; precio: number; subtotal: number }

/** Línea con nombre, unidad y precio del catálogo (el precio puede llevar un factor, p. ej. color). */
export function linea(grupo: string, clave: string, cant: number, nota = '', op: { nombre?: string; factor?: number; unidad?: string } = {}): Linea {
  const it = itemCatalogo(clave);
  const p = r2(precio(clave) * (op.factor ?? 1));
  const c = r2(cant);
  return { grupo, clave, nombre: op.nombre || it?.nombre || clave, nota, cant: c, unidad: op.unidad || it?.unidad || 'unidad', precio: p, subtotal: r2(c * p) };
}

/** Suma cantidades por clave (y nombre) manteniendo el orden de llegada. */
export class Acumulador {
  private m = new Map<string, { grupo: string; clave: string; cant: number; notas: string[]; nombre?: string; factor?: number }>();
  add(grupo: string, clave: string, cant: number, nota?: string, op: { nombre?: string; factor?: number; id?: string } = {}) {
    if (!(cant > 0)) return;
    const k = op.id || clave;
    const x = this.m.get(k);
    if (x) { x.cant += cant; if (nota && !x.notas.includes(nota)) x.notas.push(nota); return; }
    this.m.set(k, { grupo, clave, cant, notas: nota ? [nota] : [], nombre: op.nombre, factor: op.factor });
  }
  lineas(redondeo: (clave: string, cant: number) => number = (_c, n) => n): Linea[] {
    return [...this.m.values()].map(x => linea(x.grupo, x.clave, redondeo(x.clave, x.cant), x.notas.slice(0, 3).join(' · ') + (x.notas.length > 3 ? '…' : ''), { nombre: x.nombre, factor: x.factor }));
  }
}

// ── Barras de 6 m ───────────────────────────────────────────────────────────
export interface Corte { etiqueta: string; largo: number } // mm
export interface CorteColocado extends Corte { x: number }
export interface Barra { cortes: CorteColocado[]; usado: number; sobrante: number }
/** Acomoda cortes en barras del largo dado. Un corte más largo que la barra se parte en tramos. */
export function empacarBarras(cortes: Corte[], op: { largo?: number; sierra?: number; refile?: number } = {}): Barra[] {
  const L = op.largo ?? 6000, k = op.sierra ?? 4, ref = op.refile ?? 10;
  const util = L - 2 * ref;
  const lista: Corte[] = [];
  cortes.forEach(c => {
    if (!(c.largo > 0)) return;
    if (c.largo <= util) { lista.push(c); return; }
    const n = Math.ceil(c.largo / util);
    for (let i = 0; i < n; i++) lista.push({ etiqueta: `${c.etiqueta} (tramo ${i + 1}/${n})`, largo: Math.round(c.largo / n) });
  });
  lista.sort((a, b) => b.largo - a.largo || (a.etiqueta < b.etiqueta ? -1 : 1));
  const barras: { cortes: CorteColocado[]; libre: number }[] = [];
  lista.forEach(c => {
    let mejor = -1, resto = Infinity;
    barras.forEach((b, i) => { const r = b.libre - c.largo - (b.cortes.length ? k : 0); if (r >= 0 && r < resto) { resto = r; mejor = i; } });
    if (mejor < 0) { barras.push({ cortes: [], libre: util }); mejor = barras.length - 1; }
    const b = barras[mejor];
    const x = ref + (util - b.libre) + (b.cortes.length ? k : 0);
    b.libre -= c.largo + (b.cortes.length ? k : 0);
    b.cortes.push({ ...c, x });
  });
  return barras.map(b => ({ cortes: b.cortes, usado: util - b.libre, sobrante: Math.max(0, b.libre) }));
}

// ── Cotización base ─────────────────────────────────────────────────────────
export interface CotBase { id: string; nombre: string; cliente: string; gg: number; util: number; merma: number; modoMO: 'unidad' | 'jornal'; actualizado?: string; total?: number }
export function leerLista<T>(key: string): T[] { const l = safeStorage.getItem<T[]>(key, []); return Array.isArray(l) ? l : []; }
export function guardarLista<T>(key: string, l: T[]) { safeStorage.setItem(key, l); }
export const totalConGG = (directo: number, c: { gg: number; util: number }) => r2(directo * (1 + (c.gg + c.util) / 100));
