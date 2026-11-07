// =============================================================================
// Bloques a escala real (como en AutoCAD) para el plano de Obra Civil:
//   • Diseños de CarpiMetal (mesas, rejas, barandas, portones, puertas…) con su
//     geometría real (las mismas piezas que en CarpiMetal).
//   • Muebles de referencia (cama, sofá, mesa, inodoro, cocina…).
// Se colocan sueltos dentro del ambiente, se giran, se reflejan y se imantan a
// los muros. Cada uno puede incluirse o no en la cotización, con observación.
// =============================================================================
import { safeStorage } from '../../lib/storageManager';
import type { HerreriaDesign } from '../herreria/herreriaTypes';
import { PERFILES_CATALOGO } from '../herreria/herreriaCatalog';

export const KEY_BLOQUES = 'concreto_bloques';

export interface Bloque {
  uid: string;
  nivel?: string;
  origen: 'carpi' | 'mueble';
  refId: string;          // id del diseño de CarpiMetal o del mueble
  nombre: string;
  x: number; y: number;   // centro en planta (m)
  rot: number;            // grados (sentido horario en planta)
  espejo?: boolean;
  ancho: number; fondo: number; alto: number; // m
  incluir: boolean;       // suma su costo a la cotización del piso
  obs: string;            // observación que sale en la cotización
}
export const leerBloques = (): Bloque[] => safeStorage.getItem<Bloque[]>(KEY_BLOQUES, []) || [];

// ── Primitivas en coordenadas locales (u = a lo ancho, v = fondo; v = 0 es la
// cara pegada al muro). Medidas en metros.
export type Prim2D =
  | { t: 'rect'; u: number; v: number; w: number; h: number; r?: number; relleno?: boolean }
  | { t: 'circ'; u: number; v: number; r: number }
  | { t: 'elip'; u: number; v: number; rx: number; ry: number }
  | { t: 'linea'; u1: number; v1: number; u2: number; v2: number; grosor?: number };
export interface Caja3D { u: number; v: number; y: number; w: number; d: number; h: number; color: number; cil?: boolean }

export interface Mueble { id: string; nombre: string; emoji: string; grupo: string; ancho: number; fondo: number; alto: number; planta: Prim2D[]; cajas: Caja3D[] }

const R = (u: number, v: number, w: number, h: number, r = 0): Prim2D => ({ t: 'rect', u, v, w, h, r });
const L = (u1: number, v1: number, u2: number, v2: number): Prim2D => ({ t: 'linea', u1, v1, u2, v2 });
const MADERA = 0xb08159, TELA = 0x8a9bb0, BLANCO = 0xf1f5f9, LOZA = 0xffffff, ACERO = 0xcbd5e1, OSCURO = 0x334155;

function cama(id: string, nombre: string, ancho: number): Mueble {
  const almohadas = ancho > 1.2 ? [R(0.1, 0.1, ancho / 2 - 0.15, 0.3, 0.06), R(ancho / 2 + 0.05, 0.1, ancho / 2 - 0.15, 0.3, 0.06)] : [R(0.1, 0.1, ancho - 0.2, 0.3, 0.06)];
  return {
    id, nombre, emoji: '🛏️', grupo: 'Dormitorio', ancho, fondo: 2.0, alto: 0.55,
    planta: [R(0, 0, ancho, 2.0), R(0, 0, ancho, 0.06), ...almohadas, L(0, 0.55, ancho, 0.55), L(0, 0.55, ancho * 0.35, 0.75)],
    cajas: [{ u: 0, v: 0.06, y: 0, w: ancho, d: 1.94, h: 0.3, color: MADERA }, { u: 0.03, v: 0.08, y: 0.3, w: ancho - 0.06, d: 1.9, h: 0.22, color: BLANCO }, { u: 0, v: 0, y: 0, w: ancho, d: 0.06, h: 1.0, color: MADERA }],
  };
}
export const MUEBLES: Mueble[] = [
  cama('cama_2p', 'Cama 2 plazas', 1.4),
  cama('cama_15p', 'Cama 1½ plaza', 1.05),
  { id: 'ropero', nombre: 'Ropero', emoji: '🚪', grupo: 'Dormitorio', ancho: 1.2, fondo: 0.6, alto: 2.1, planta: [R(0, 0, 1.2, 0.6), L(0.6, 0, 0.6, 0.6), L(0, 0.6, 1.2, 0)], cajas: [{ u: 0, v: 0, y: 0, w: 1.2, d: 0.6, h: 2.1, color: MADERA }] },
  { id: 'escritorio', nombre: 'Escritorio', emoji: '🖥️', grupo: 'Dormitorio', ancho: 1.2, fondo: 0.6, alto: 0.75, planta: [R(0, 0, 1.2, 0.6), R(0.4, 0.65, 0.45, 0.45, 0.08)], cajas: [{ u: 0, v: 0, y: 0.72, w: 1.2, d: 0.6, h: 0.03, color: MADERA }, { u: 0, v: 0, y: 0, w: 0.04, d: 0.6, h: 0.72, color: MADERA }, { u: 1.16, v: 0, y: 0, w: 0.04, d: 0.6, h: 0.72, color: MADERA }] },
  { id: 'sofa3', nombre: 'Sofá 3 cuerpos', emoji: '🛋️', grupo: 'Sala y comedor', ancho: 2.0, fondo: 0.85, alto: 0.85, planta: [R(0, 0, 2.0, 0.85, 0.06), R(0, 0, 2.0, 0.2), R(0, 0.2, 0.18, 0.65), R(1.82, 0.2, 0.18, 0.65), L(0.73, 0.2, 0.73, 0.85), L(1.27, 0.2, 1.27, 0.85)], cajas: [{ u: 0, v: 0.2, y: 0, w: 2.0, d: 0.65, h: 0.42, color: TELA }, { u: 0, v: 0, y: 0, w: 2.0, d: 0.2, h: 0.85, color: TELA }, { u: 0, v: 0.2, y: 0, w: 0.18, d: 0.65, h: 0.62, color: TELA }, { u: 1.82, v: 0.2, y: 0, w: 0.18, d: 0.65, h: 0.62, color: TELA }] },
  { id: 'mesa_comedor', nombre: 'Mesa de comedor (4)', emoji: '🍽️', grupo: 'Sala y comedor', ancho: 1.2, fondo: 1.8, alto: 0.75,
    planta: [R(0, 0.5, 1.2, 0.8), R(0.1, 0.05, 0.42, 0.42, 0.06), R(0.68, 0.05, 0.42, 0.42, 0.06), R(0.1, 1.33, 0.42, 0.42, 0.06), R(0.68, 1.33, 0.42, 0.42, 0.06)],
    cajas: [{ u: 0, v: 0.5, y: 0.72, w: 1.2, d: 0.8, h: 0.03, color: MADERA }, ...[[0.03, 0.53], [1.13, 0.53], [0.03, 1.23], [1.13, 1.23]].map(([u, v]) => ({ u, v, y: 0, w: 0.04, d: 0.04, h: 0.72, color: MADERA })), ...[[0.1, 0.05], [0.68, 0.05], [0.1, 1.33], [0.68, 1.33]].map(([u, v]) => ({ u, v, y: 0, w: 0.42, d: 0.42, h: 0.45, color: TELA }))] },
  { id: 'mueble_tv', nombre: 'Mueble de TV', emoji: '📺', grupo: 'Sala y comedor', ancho: 1.8, fondo: 0.4, alto: 0.5, planta: [R(0, 0, 1.8, 0.4), R(0.3, 0.02, 1.2, 0.05)], cajas: [{ u: 0, v: 0, y: 0, w: 1.8, d: 0.4, h: 0.5, color: MADERA }, { u: 0.3, v: 0.12, y: 0.5, w: 1.2, d: 0.05, h: 0.7, color: OSCURO }] },
  { id: 'inodoro', nombre: 'Inodoro', emoji: '🚽', grupo: 'Baño y cocina', ancho: 0.4, fondo: 0.7, alto: 0.75, planta: [R(0, 0, 0.4, 0.18, 0.03), { t: 'elip', u: 0.2, v: 0.45, rx: 0.18, ry: 0.24 }], cajas: [{ u: 0.02, v: 0, y: 0.4, w: 0.36, d: 0.18, h: 0.35, color: LOZA }, { u: 0.04, v: 0.2, y: 0, w: 0.32, d: 0.48, h: 0.4, color: LOZA, cil: true }] },
  { id: 'lavatorio', nombre: 'Lavatorio', emoji: '🚰', grupo: 'Baño y cocina', ancho: 0.5, fondo: 0.45, alto: 0.85, planta: [R(0, 0, 0.5, 0.45, 0.04), { t: 'elip', u: 0.25, v: 0.25, rx: 0.18, ry: 0.14 }], cajas: [{ u: 0, v: 0, y: 0.7, w: 0.5, d: 0.45, h: 0.15, color: LOZA }, { u: 0.18, v: 0.05, y: 0, w: 0.14, d: 0.14, h: 0.7, color: LOZA, cil: true }] },
  { id: 'ducha', nombre: 'Ducha', emoji: '🚿', grupo: 'Baño y cocina', ancho: 0.9, fondo: 0.9, alto: 0.1, planta: [R(0, 0, 0.9, 0.9), L(0, 0, 0.9, 0.9), L(0.9, 0, 0, 0.9), { t: 'circ', u: 0.45, v: 0.45, r: 0.04 }], cajas: [{ u: 0, v: 0, y: 0, w: 0.9, d: 0.9, h: 0.08, color: LOZA }] },
  { id: 'cocina', nombre: 'Cocina 4 hornillas', emoji: '🔥', grupo: 'Baño y cocina', ancho: 0.6, fondo: 0.6, alto: 0.9, planta: [R(0, 0, 0.6, 0.6), ...[[0.17, 0.2], [0.43, 0.2], [0.17, 0.43], [0.43, 0.43]].map(([u, v]) => ({ t: 'circ' as const, u, v, r: 0.08 }))], cajas: [{ u: 0, v: 0, y: 0, w: 0.6, d: 0.6, h: 0.9, color: ACERO }] },
  { id: 'lavadero', nombre: 'Lavadero / tarja', emoji: '🧽', grupo: 'Baño y cocina', ancho: 1.2, fondo: 0.6, alto: 0.9, planta: [R(0, 0, 1.2, 0.6), R(0.1, 0.1, 0.5, 0.42, 0.04), L(0.75, 0.1, 0.75, 0.52), L(0.9, 0.1, 0.9, 0.52), L(1.05, 0.1, 1.05, 0.52)], cajas: [{ u: 0, v: 0, y: 0, w: 1.2, d: 0.6, h: 0.9, color: ACERO }] },
  { id: 'refri', nombre: 'Refrigeradora', emoji: '🧊', grupo: 'Baño y cocina', ancho: 0.7, fondo: 0.7, alto: 1.8, planta: [R(0, 0, 0.7, 0.7), L(0, 0.6, 0.7, 0.6)], cajas: [{ u: 0, v: 0, y: 0, w: 0.7, d: 0.7, h: 1.8, color: ACERO }] },
  { id: 'auto', nombre: 'Auto (cochera)', emoji: '🚗', grupo: 'Exterior', ancho: 1.8, fondo: 4.5, alto: 1.45, planta: [R(0, 0, 1.8, 4.5, 0.35), R(0.15, 1.3, 1.5, 1.9, 0.15), L(0.15, 1.9, 1.65, 1.9)], cajas: [{ u: 0, v: 0, y: 0.2, w: 1.8, d: 4.5, h: 0.75, color: 0x64748b }, { u: 0.15, v: 1.3, y: 0.95, w: 1.5, d: 1.9, h: 0.5, color: 0x94a3b8 }] },
  // ── Más accesorios (dormitorio, baño, cocina) y muebles de drywall ──
  { id: 'velador', nombre: 'Velador', emoji: '🛏️', grupo: 'Dormitorio', ancho: 0.45, fondo: 0.4, alto: 0.55, planta: [R(0, 0, 0.45, 0.4), L(0, 0.2, 0.45, 0.2)], cajas: [{ u: 0, v: 0, y: 0, w: 0.45, d: 0.4, h: 0.55, color: MADERA }] },
  { id: 'camarote', nombre: 'Camarote (1 plaza)', emoji: '🛏️', grupo: 'Dormitorio', ancho: 0.95, fondo: 2.0, alto: 1.6, planta: [R(0, 0, 0.95, 2.0), L(0, 0, 0.95, 2.0), L(0.95, 0, 0, 2.0)], cajas: [{ u: 0, v: 0, y: 0.15, w: 0.95, d: 2.0, h: 0.25, color: MADERA }, { u: 0, v: 0, y: 1.15, w: 0.95, d: 2.0, h: 0.25, color: MADERA }, ...[[0, 0], [0.9, 0], [0, 1.95], [0.9, 1.95]].map(([u, v]) => ({ u, v, y: 0, w: 0.05, d: 0.05, h: 1.6, color: MADERA }))] },
  { id: 'sillon', nombre: 'Sillón individual', emoji: '🛋️', grupo: 'Sala y comedor', ancho: 0.85, fondo: 0.85, alto: 0.85, planta: [R(0, 0, 0.85, 0.85, 0.06), R(0, 0, 0.85, 0.2), R(0, 0.2, 0.15, 0.65), R(0.7, 0.2, 0.15, 0.65)], cajas: [{ u: 0, v: 0.2, y: 0, w: 0.85, d: 0.65, h: 0.42, color: TELA }, { u: 0, v: 0, y: 0, w: 0.85, d: 0.2, h: 0.85, color: TELA }] },
  { id: 'mesa_6', nombre: 'Mesa de comedor (6)', emoji: '🍽️', grupo: 'Sala y comedor', ancho: 1.0, fondo: 2.4, alto: 0.75, planta: [R(0, 0.3, 1.0, 1.8), ...[0.45, 1.0, 1.55].flatMap(v => [R(-0.45, v, 0.42, 0.42, 0.06), R(1.03, v, 0.42, 0.42, 0.06)])], cajas: [{ u: 0, v: 0.3, y: 0.72, w: 1.0, d: 1.8, h: 0.03, color: MADERA }, ...[[0.03, 0.33], [0.93, 0.33], [0.03, 2.03], [0.93, 2.03]].map(([u, v]) => ({ u, v, y: 0, w: 0.04, d: 0.04, h: 0.72, color: MADERA }))] },
  { id: 'vanitorio', nombre: 'Vanitorio (mueble de baño)', emoji: '🚰', grupo: 'Baño y cocina', ancho: 0.8, fondo: 0.5, alto: 0.85, planta: [R(0, 0, 0.8, 0.5), { t: 'elip', u: 0.4, v: 0.27, rx: 0.22, ry: 0.15 }], cajas: [{ u: 0, v: 0, y: 0, w: 0.8, d: 0.5, h: 0.82, color: MADERA }, { u: 0, v: 0, y: 0.82, w: 0.8, d: 0.5, h: 0.04, color: LOZA }] },
  { id: 'tina', nombre: 'Tina / bañera', emoji: '🛁', grupo: 'Baño y cocina', ancho: 1.6, fondo: 0.75, alto: 0.55, planta: [R(0, 0, 1.6, 0.75, 0.05), R(0.08, 0.08, 1.44, 0.59, 0.25)], cajas: [{ u: 0, v: 0, y: 0, w: 1.6, d: 0.75, h: 0.55, color: LOZA }] },
  { id: 'lavadora', nombre: 'Lavadora', emoji: '🫧', grupo: 'Baño y cocina', ancho: 0.6, fondo: 0.6, alto: 0.85, planta: [R(0, 0, 0.6, 0.6), { t: 'circ', u: 0.3, v: 0.32, r: 0.2 }], cajas: [{ u: 0, v: 0, y: 0, w: 0.6, d: 0.6, h: 0.85, color: BLANCO }] },
  { id: 'terma', nombre: 'Terma / calentador', emoji: '♨️', grupo: 'Baño y cocina', ancho: 0.45, fondo: 0.45, alto: 0.8, planta: [{ t: 'circ', u: 0.225, v: 0.225, r: 0.22 }], cajas: [{ u: 0, v: 0, y: 1.4, w: 0.45, d: 0.45, h: 0.8, color: BLANCO, cil: true }] },
  { id: 'cocina_baja', nombre: 'Mueble de cocina bajo', emoji: '🗄️', grupo: 'Baño y cocina', ancho: 2.4, fondo: 0.6, alto: 0.9, planta: [R(0, 0, 2.4, 0.6), L(0.8, 0, 0.8, 0.6), L(1.6, 0, 1.6, 0.6)], cajas: [{ u: 0, v: 0, y: 0, w: 2.4, d: 0.6, h: 0.86, color: MADERA }, { u: 0, v: 0, y: 0.86, w: 2.4, d: 0.6, h: 0.04, color: OSCURO }] },
  { id: 'cocina_alta', nombre: 'Mueble de cocina alto', emoji: '🗄️', grupo: 'Baño y cocina', ancho: 2.4, fondo: 0.35, alto: 0.7, planta: [R(0, 0, 2.4, 0.35), L(0, 0.35, 2.4, 0), L(0, 0, 2.4, 0.35)], cajas: [{ u: 0, v: 0, y: 1.5, w: 2.4, d: 0.35, h: 0.7, color: MADERA }] },
  { id: 'closet_dw', nombre: 'Closet empotrado de drywall', emoji: '🚪', grupo: 'Drywall y acabados', ancho: 1.8, fondo: 0.6, alto: 2.4, planta: [R(0, 0, 1.8, 0.6), L(0.9, 0.6, 0.9, 0), L(0, 0.6, 0.6, 0.35), L(1.8, 0.6, 1.2, 0.35)], cajas: [{ u: 0, v: 0, y: 0, w: 1.8, d: 0.6, h: 2.4, color: BLANCO }] },
  { id: 'centro_tv_dw', nombre: 'Centro de TV de drywall', emoji: '📺', grupo: 'Drywall y acabados', ancho: 2.4, fondo: 0.35, alto: 2.4, planta: [R(0, 0, 2.4, 0.35), R(0.5, 0.25, 1.4, 0.05)], cajas: [{ u: 0, v: 0, y: 0, w: 0.5, d: 0.35, h: 2.4, color: BLANCO }, { u: 1.9, v: 0, y: 0, w: 0.5, d: 0.35, h: 2.4, color: BLANCO }, { u: 0.5, v: 0, y: 2.0, w: 1.4, d: 0.35, h: 0.4, color: BLANCO }, { u: 0.5, v: 0, y: 0, w: 1.4, d: 0.35, h: 0.45, color: BLANCO }, { u: 0.6, v: 0.25, y: 0.9, w: 1.2, d: 0.05, h: 0.7, color: OSCURO }] },
  { id: 'cabecera_dw', nombre: 'Cabecera de drywall con luz', emoji: '💡', grupo: 'Drywall y acabados', ancho: 2.0, fondo: 0.15, alto: 1.3, planta: [R(0, 0, 2.0, 0.15)], cajas: [{ u: 0, v: 0, y: 0.3, w: 2.0, d: 0.15, h: 1.0, color: BLANCO }] },
  { id: 'nicho_dw', nombre: 'Nicho / repisa de drywall', emoji: '🧱', grupo: 'Drywall y acabados', ancho: 1.0, fondo: 0.3, alto: 0.35, planta: [R(0, 0, 1.0, 0.3), L(0.5, 0, 0.5, 0.3)], cajas: [{ u: 0, v: 0, y: 1.2, w: 1.0, d: 0.3, h: 0.05, color: BLANCO }, { u: 0, v: 0, y: 1.5, w: 1.0, d: 0.3, h: 0.05, color: BLANCO }, { u: 0, v: 0, y: 1.2, w: 0.05, d: 0.3, h: 0.35, color: BLANCO }, { u: 0.95, v: 0, y: 1.2, w: 0.05, d: 0.3, h: 0.35, color: BLANCO }] },
  { id: 'columna_dw', nombre: 'Forro de columna / ducto', emoji: '⬜', grupo: 'Drywall y acabados', ancho: 0.4, fondo: 0.4, alto: 2.6, planta: [R(0, 0, 0.4, 0.4), L(0, 0, 0.4, 0.4), L(0.4, 0, 0, 0.4)], cajas: [{ u: 0, v: 0, y: 0, w: 0.4, d: 0.4, h: 2.6, color: BLANCO }] },
  { id: 'escalera_rect', nombre: 'Escalera recta (referencia)', emoji: '🪜', grupo: 'Exterior', ancho: 1.0, fondo: 3.0, alto: 2.7, planta: [R(0, 0, 1.0, 3.0), ...Array.from({ length: 11 }, (_, i) => L(0, 0.25 * (i + 1), 1.0, 0.25 * (i + 1)))], cajas: Array.from({ length: 12 }, (_, i) => ({ u: 0, v: 0.25 * i, y: 0, w: 1.0, d: 0.25, h: 0.225 * (i + 1), color: 0x94a3b8 })) },
  { id: 'maceta', nombre: 'Maceta / planta', emoji: '🪴', grupo: 'Exterior', ancho: 0.5, fondo: 0.5, alto: 1.0, planta: [{ t: 'circ', u: 0.25, v: 0.25, r: 0.24 }, { t: 'circ', u: 0.25, v: 0.25, r: 0.12 }], cajas: [{ u: 0.1, v: 0.1, y: 0, w: 0.3, d: 0.3, h: 0.35, color: 0xb45309, cil: true }, { u: 0, v: 0, y: 0.35, w: 0.5, d: 0.5, h: 0.6, color: 0x16a34a, cil: true }] },
  // ── Accesorios adicionales ──
  { id: 'cama_queen', nombre: 'Cama Queen', emoji: '🛏️', grupo: 'Dormitorio', ancho: 1.6, fondo: 2.0, alto: 0.55, planta: [R(0, 0, 1.6, 2.0), R(0, 0, 1.6, 0.06), R(0.1, 0.1, 0.65, 0.3, 0.06), R(0.85, 0.1, 0.65, 0.3, 0.06), L(0, 0.55, 1.6, 0.55)], cajas: [{ u: 0, v: 0.06, y: 0, w: 1.6, d: 1.94, h: 0.3, color: MADERA }, { u: 0.03, v: 0.08, y: 0.3, w: 1.54, d: 1.9, h: 0.22, color: BLANCO }, { u: 0, v: 0, y: 0, w: 1.6, d: 0.06, h: 1.05, color: MADERA }] },
  { id: 'cama_king', nombre: 'Cama King', emoji: '🛏️', grupo: 'Dormitorio', ancho: 2.0, fondo: 2.0, alto: 0.55, planta: [R(0, 0, 2.0, 2.0), R(0, 0, 2.0, 0.06), R(0.12, 0.1, 0.83, 0.3, 0.06), R(1.05, 0.1, 0.83, 0.3, 0.06), L(0, 0.55, 2.0, 0.55)], cajas: [{ u: 0, v: 0.06, y: 0, w: 2.0, d: 1.94, h: 0.3, color: MADERA }, { u: 0.03, v: 0.08, y: 0.3, w: 1.94, d: 1.9, h: 0.22, color: BLANCO }, { u: 0, v: 0, y: 0, w: 2.0, d: 0.06, h: 1.1, color: MADERA }] },
  { id: 'cuna', nombre: 'Cuna de bebé', emoji: '👶', grupo: 'Dormitorio', ancho: 0.7, fondo: 1.3, alto: 0.95, planta: [R(0, 0, 0.7, 1.3), R(0.05, 0.05, 0.6, 1.2)], cajas: [{ u: 0, v: 0, y: 0.3, w: 0.7, d: 1.3, h: 0.12, color: BLANCO }, ...[[0, 0], [0.66, 0], [0, 1.26], [0.66, 1.26]].map(([u, v]) => ({ u, v, y: 0, w: 0.04, d: 0.04, h: 0.95, color: BLANCO }))] },
  { id: 'comoda', nombre: 'Cómoda / cajonera', emoji: '🗄️', grupo: 'Dormitorio', ancho: 1.0, fondo: 0.45, alto: 0.9, planta: [R(0, 0, 1.0, 0.45), L(0, 0.15, 1.0, 0.15), L(0, 0.3, 1.0, 0.3)], cajas: [{ u: 0, v: 0, y: 0, w: 1.0, d: 0.45, h: 0.9, color: MADERA }] },
  { id: 'mesa_centro', nombre: 'Mesa de centro', emoji: '☕', grupo: 'Sala y comedor', ancho: 1.0, fondo: 0.55, alto: 0.42, planta: [R(0, 0, 1.0, 0.55, 0.05)], cajas: [{ u: 0, v: 0, y: 0.38, w: 1.0, d: 0.55, h: 0.04, color: MADERA }, { u: 0.08, v: 0.08, y: 0, w: 0.84, d: 0.39, h: 0.38, color: OSCURO }] },
  { id: 'sofa_l', nombre: 'Sofá en L', emoji: '🛋️', grupo: 'Sala y comedor', ancho: 2.6, fondo: 1.7, alto: 0.85, planta: [R(0, 0, 2.6, 0.9, 0.06), R(1.7, 0.9, 0.9, 0.8, 0.06), R(0, 0, 2.6, 0.2), L(0.87, 0.2, 0.87, 0.9), L(1.73, 0.2, 1.73, 0.9)], cajas: [{ u: 0, v: 0.2, y: 0, w: 2.6, d: 0.7, h: 0.42, color: TELA }, { u: 1.7, v: 0.9, y: 0, w: 0.9, d: 0.8, h: 0.42, color: TELA }, { u: 0, v: 0, y: 0, w: 2.6, d: 0.2, h: 0.85, color: TELA }] },
  { id: 'mesa_8', nombre: 'Mesa de comedor (8)', emoji: '🍽️', grupo: 'Sala y comedor', ancho: 1.0, fondo: 3.0, alto: 0.75, planta: [R(0, 0.3, 1.0, 2.4), ...[0.45, 1.05, 1.65, 2.25].flatMap(v => [R(-0.45, v, 0.42, 0.42, 0.06), R(1.03, v, 0.42, 0.42, 0.06)])], cajas: [{ u: 0, v: 0.3, y: 0.72, w: 1.0, d: 2.4, h: 0.03, color: MADERA }, ...[[0.03, 0.33], [0.93, 0.33], [0.03, 2.63], [0.93, 2.63]].map(([u, v]) => ({ u, v, y: 0, w: 0.04, d: 0.04, h: 0.72, color: MADERA }))] },
  { id: 'librero', nombre: 'Librero / estante', emoji: '📚', grupo: 'Sala y comedor', ancho: 0.9, fondo: 0.35, alto: 1.8, planta: [R(0, 0, 0.9, 0.35), L(0.45, 0, 0.45, 0.35)], cajas: [{ u: 0, v: 0, y: 0, w: 0.9, d: 0.35, h: 1.8, color: MADERA }] },
  { id: 'isla_cocina', nombre: 'Isla de cocina', emoji: '🍳', grupo: 'Baño y cocina', ancho: 1.8, fondo: 0.9, alto: 0.9, planta: [R(0, 0, 1.8, 0.9), R(0.2, 0.2, 0.5, 0.4, 0.04), ...[[1.2, 0.3], [1.45, 0.3], [1.2, 0.6], [1.45, 0.6]].map(([u, v]) => ({ t: 'circ' as const, u, v, r: 0.07 }))], cajas: [{ u: 0, v: 0, y: 0, w: 1.8, d: 0.9, h: 0.86, color: MADERA }, { u: -0.05, v: -0.05, y: 0.86, w: 1.9, d: 1.0, h: 0.04, color: OSCURO }] },
  { id: 'horno', nombre: 'Horno empotrado', emoji: '🔥', grupo: 'Baño y cocina', ancho: 0.6, fondo: 0.6, alto: 0.6, planta: [R(0, 0, 0.6, 0.6), L(0, 0.5, 0.6, 0.5)], cajas: [{ u: 0, v: 0, y: 0.85, w: 0.6, d: 0.6, h: 0.6, color: OSCURO }] },
  { id: 'campana', nombre: 'Campana extractora', emoji: '💨', grupo: 'Baño y cocina', ancho: 0.9, fondo: 0.5, alto: 0.9, planta: [R(0, 0, 0.9, 0.5), L(0, 0, 0.9, 0.5), L(0.9, 0, 0, 0.5)], cajas: [{ u: 0, v: 0, y: 1.6, w: 0.9, d: 0.5, h: 0.12, color: ACERO }, { u: 0.3, v: 0, y: 1.72, w: 0.3, d: 0.25, h: 0.7, color: ACERO }] },
  { id: 'urinario', nombre: 'Urinario', emoji: '🚽', grupo: 'Baño y cocina', ancho: 0.4, fondo: 0.35, alto: 0.7, planta: [R(0, 0, 0.4, 0.1), { t: 'elip', u: 0.2, v: 0.2, rx: 0.17, ry: 0.15 }], cajas: [{ u: 0.03, v: 0, y: 0.5, w: 0.34, d: 0.32, h: 0.7, color: LOZA }] },
  { id: 'ducha_esq', nombre: 'Ducha esquinera con mampara', emoji: '🚿', grupo: 'Baño y cocina', ancho: 0.9, fondo: 0.9, alto: 2.0, planta: [R(0, 0, 0.9, 0.9), L(0.9, 0.35, 0.35, 0.9), { t: 'circ', u: 0.3, v: 0.3, r: 0.04 }], cajas: [{ u: 0, v: 0, y: 0, w: 0.9, d: 0.9, h: 0.08, color: LOZA }, { u: 0.86, v: 0, y: 0.08, w: 0.04, d: 0.9, h: 1.9, color: 0xa9d8ee }, { u: 0, v: 0.86, y: 0.08, w: 0.9, d: 0.04, h: 1.9, color: 0xa9d8ee }] },
  { id: 'escritorio_l', nombre: 'Escritorio en L', emoji: '🖥️', grupo: 'Oficina', ancho: 1.6, fondo: 1.4, alto: 0.75, planta: [R(0, 0, 1.6, 0.6), R(0, 0.6, 0.6, 0.8), R(0.75, 0.65, 0.45, 0.45, 0.08)], cajas: [{ u: 0, v: 0, y: 0.72, w: 1.6, d: 0.6, h: 0.03, color: MADERA }, { u: 0, v: 0.6, y: 0.72, w: 0.6, d: 0.8, h: 0.03, color: MADERA }, { u: 0, v: 0, y: 0, w: 0.04, d: 1.4, h: 0.72, color: MADERA }, { u: 1.56, v: 0, y: 0, w: 0.04, d: 0.6, h: 0.72, color: MADERA }] },
  { id: 'silla_oficina', nombre: 'Silla de oficina', emoji: '🪑', grupo: 'Oficina', ancho: 0.6, fondo: 0.6, alto: 1.0, planta: [{ t: 'circ', u: 0.3, v: 0.3, r: 0.28 }, R(0.1, 0.05, 0.4, 0.1, 0.03)], cajas: [{ u: 0.08, v: 0.1, y: 0.42, w: 0.44, d: 0.44, h: 0.08, color: OSCURO }, { u: 0.08, v: 0.05, y: 0.5, w: 0.44, d: 0.06, h: 0.5, color: OSCURO }, { u: 0.27, v: 0.27, y: 0, w: 0.06, d: 0.06, h: 0.42, color: ACERO, cil: true }] },
  { id: 'archivador', nombre: 'Archivador metálico', emoji: '🗃️', grupo: 'Oficina', ancho: 0.5, fondo: 0.6, alto: 1.3, planta: [R(0, 0, 0.5, 0.6), L(0, 0.55, 0.5, 0.55)], cajas: [{ u: 0, v: 0, y: 0, w: 0.5, d: 0.6, h: 1.3, color: ACERO }] },
  { id: 'mesa_reuniones', nombre: 'Mesa de reuniones (6)', emoji: '👥', grupo: 'Oficina', ancho: 1.2, fondo: 2.4, alto: 0.75, planta: [R(0, 0.3, 1.2, 1.8, 0.1), ...[0.5, 1.05, 1.6].flatMap(v => [{ t: 'circ' as const, u: -0.3, v: v + 0.15, r: 0.22 }, { t: 'circ' as const, u: 1.5, v: v + 0.15, r: 0.22 }])], cajas: [{ u: 0, v: 0.3, y: 0.72, w: 1.2, d: 1.8, h: 0.03, color: MADERA }, { u: 0.45, v: 0.9, y: 0, w: 0.3, d: 0.6, h: 0.72, color: OSCURO }] },
  { id: 'muro_bajo_dw', nombre: 'Muro bajo divisorio de drywall', emoji: '🧱', grupo: 'Drywall y acabados', ancho: 1.5, fondo: 0.12, alto: 1.1, planta: [R(0, 0, 1.5, 0.12)], cajas: [{ u: 0, v: 0, y: 0, w: 1.5, d: 0.12, h: 1.1, color: BLANCO }] },
  { id: 'muro_tecnico_dw', nombre: 'Muro técnico (inodoro suspendido)', emoji: '🚽', grupo: 'Drywall y acabados', ancho: 1.0, fondo: 0.25, alto: 1.2, planta: [R(0, 0, 1.0, 0.25), L(0, 0.25, 1.0, 0)], cajas: [{ u: 0, v: 0, y: 0, w: 1.0, d: 0.25, h: 1.2, color: BLANCO }] },
  { id: 'panel_tv_ranurado', nombre: 'Panel ranurado para TV', emoji: '📺', grupo: 'Drywall y acabados', ancho: 2.2, fondo: 0.08, alto: 2.4, planta: [R(0, 0, 2.2, 0.08)], cajas: [...Array.from({ length: 11 }, (_, i) => ({ u: i * 0.2, v: 0, y: 0, w: 0.17, d: 0.08, h: 2.4, color: MADERA })), { u: 0.5, v: 0.08, y: 1.0, w: 1.2, d: 0.04, h: 0.68, color: OSCURO }] },
  { id: 'repisa_flotante', nombre: 'Repisa flotante', emoji: '🪵', grupo: 'Drywall y acabados', ancho: 1.2, fondo: 0.25, alto: 0.05, planta: [R(0, 0, 1.2, 0.25)], cajas: [{ u: 0, v: 0, y: 1.4, w: 1.2, d: 0.25, h: 0.05, color: MADERA }] },
  { id: 'banca_dw', nombre: 'Banca empotrada de drywall', emoji: '🪑', grupo: 'Drywall y acabados', ancho: 1.8, fondo: 0.45, alto: 0.45, planta: [R(0, 0, 1.8, 0.45)], cajas: [{ u: 0, v: 0, y: 0, w: 1.8, d: 0.45, h: 0.45, color: BLANCO }] },
  { id: 'jardinera_dw', nombre: 'Jardinera de drywall (RH)', emoji: '🌿', grupo: 'Drywall y acabados', ancho: 1.2, fondo: 0.4, alto: 0.6, planta: [R(0, 0, 1.2, 0.4), R(0.06, 0.06, 1.08, 0.28)], cajas: [{ u: 0, v: 0, y: 0, w: 1.2, d: 0.4, h: 0.6, color: BLANCO }, { u: 0.06, v: 0.06, y: 0.6, w: 1.08, d: 0.28, h: 0.25, color: 0x16a34a }] },
  { id: 'moto', nombre: 'Moto (estacionamiento)', emoji: '🏍️', grupo: 'Exterior', ancho: 0.8, fondo: 2.1, alto: 1.1, planta: [R(0.25, 0, 0.3, 2.1, 0.12), L(0, 0.5, 0.8, 0.5)], cajas: [{ u: 0.25, v: 0, y: 0.25, w: 0.3, d: 2.1, h: 0.55, color: 0x475569 }] },
  { id: 'lavadero_ropa', nombre: 'Lavadero de ropa', emoji: '🧺', grupo: 'Exterior', ancho: 0.6, fondo: 0.55, alto: 0.9, planta: [R(0, 0, 0.6, 0.55), R(0.06, 0.06, 0.48, 0.3, 0.04), L(0.06, 0.4, 0.54, 0.4)], cajas: [{ u: 0, v: 0, y: 0, w: 0.6, d: 0.55, h: 0.9, color: 0x9ca3af }] },
  { id: 'parrilla', nombre: 'Parrilla / zona BBQ', emoji: '🍖', grupo: 'Exterior', ancho: 1.5, fondo: 0.7, alto: 0.9, planta: [R(0, 0, 1.5, 0.7), R(0.15, 0.1, 0.8, 0.5)], cajas: [{ u: 0, v: 0, y: 0, w: 1.5, d: 0.7, h: 0.9, color: 0xb45309 }, { u: 0.15, v: 0.1, y: 0.9, w: 0.8, d: 0.5, h: 0.05, color: OSCURO }] },
  { id: 'mesa_jardin', nombre: 'Mesa de jardín con sombrilla', emoji: '⛱️', grupo: 'Exterior', ancho: 1.0, fondo: 1.0, alto: 2.2, planta: [{ t: 'circ', u: 0.5, v: 0.5, r: 0.45 }, { t: 'circ', u: 0.5, v: 0.5, r: 0.04 }], cajas: [{ u: 0.05, v: 0.05, y: 0.72, w: 0.9, d: 0.9, h: 0.03, color: BLANCO, cil: true }, { u: 0.48, v: 0.48, y: 0, w: 0.04, d: 0.04, h: 2.2, color: ACERO, cil: true }, { u: -0.4, v: -0.4, y: 2.0, w: 1.8, d: 1.8, h: 0.1, color: 0xf59e0b, cil: true }] },
];
export const muebleDe = (id: string) => MUEBLES.find(m => m.id === id);

// ── Geometría de un diseño de CarpiMetal (piezas reales) ────────────────────
export interface BarraCarpi { a: [number, number, number]; b: [number, number, number]; s1: number; s2: number }
export interface PanelCarpi { x: number; y: number; z: number; w: number; h: number; d: number; vidrio: boolean }
export interface GeomCarpi { ancho: number; alto: number; fondo: number; barras: BarraCarpi[]; paneles: PanelCarpi[] }

export function geometriaCarpi(d: HerreriaDesign): GeomCarpi {
  const barras: BarraCarpi[] = [], paneles: PanelCarpi[] = [];
  (d.piezas || []).forEach(pz => {
    const z1 = pz.z1 || 0, z2 = pz.z2 || 0;
    const plancha = pz.esPlancha || pz.tipo === 'plancha' || pz.tipo === 'vidrio' || pz.tipo === 'malla' || (pz.anchoPlanchaM && pz.altoPlanchaM);
    if (plancha) {
      const horizontal = Math.abs(pz.y2 - pz.y1) < 0.02 && (Math.abs(z2 - z1) > 0.01 || !!pz.altoPlanchaM);
      const w = Math.max(0.02, pz.anchoPlanchaM || Math.abs(pz.x2 - pz.x1));
      const esp = Math.max(0.003, (pz.espesorPlanchaMm || 2) / 1000);
      const vidrio = pz.tipo === 'vidrio' || pz.tipoRelleno === 'vidrio';
      if (horizontal) paneles.push({ x: Math.min(pz.x1, pz.x2), y: pz.y1, z: Math.min(z1, z2), w, h: esp, d: Math.max(0.02, pz.altoPlanchaM || Math.abs(z2 - z1)), vidrio });
      else paneles.push({ x: Math.min(pz.x1, pz.x2), y: Math.min(pz.y1, pz.y2), z: z1, w, h: Math.max(0.02, pz.altoPlanchaM || Math.abs(pz.y2 - pz.y1)), d: esp, vidrio });
      return;
    }
    const p = PERFILES_CATALOGO.find(x => x.id === pz.perfilId) || PERFILES_CATALOGO[0];
    const s1 = Math.max(0.008, (p?.anchoMm || 25) / 1000), s2 = Math.max(0.008, (p?.altoMm || p?.anchoMm || 25) / 1000);
    for (let k = 0; k < Math.max(1, pz.cantidad || 1); k++) barras.push({ a: [pz.x1, pz.y1, z1], b: [pz.x2, pz.y2, z2], s1, s2 });
  });
  if (!barras.length && !paneles.length) {
    // Diseño sin piezas CAD: marco del ancho × alto del diseño.
    const W = d.anchoM, H = d.altoM, s = 0.05;
    [[[0, 0, 0], [W, 0, 0]], [[0, H, 0], [W, H, 0]], [[0, 0, 0], [0, H, 0]], [[W, 0, 0], [W, H, 0]]].forEach(([a, b]) => barras.push({ a: a as [number, number, number], b: b as [number, number, number], s1: s, s2: s }));
  }
  // Normalizar al origen (esquina inferior, frente).
  const xs: number[] = [], ys: number[] = [], zs: number[] = [];
  barras.forEach(b => { xs.push(b.a[0], b.b[0]); ys.push(b.a[1], b.b[1]); zs.push(b.a[2], b.b[2]); });
  paneles.forEach(p => { xs.push(p.x, p.x + p.w); ys.push(p.y, p.y + p.h); zs.push(p.z, p.z + p.d); });
  const mx = Math.min(...xs), my = Math.min(...ys), mz = Math.min(...zs);
  const margen = Math.max(...barras.map(b => Math.max(b.s1, b.s2)), 0.02) / 2;
  barras.forEach(b => { b.a = [b.a[0] - mx, b.a[1] - my, b.a[2] - mz]; b.b = [b.b[0] - mx, b.b[1] - my, b.b[2] - mz]; });
  paneles.forEach(p => { p.x -= mx; p.y -= my; p.z -= mz; });
  return {
    ancho: Math.max(0.05, Math.max(...xs) - mx), alto: Math.max(0.05, Math.max(...ys) - my), fondo: Math.max(margen * 2, Math.max(...zs) - mz),
    barras, paneles,
  };
}

// Planta (vista superior) de un diseño de CarpiMetal: proyección de las piezas.
export function plantaCarpi(g: GeomCarpi): Prim2D[] {
  const out: Prim2D[] = [];
  g.barras.forEach(b => {
    const du = b.b[0] - b.a[0], dv = b.b[2] - b.a[2];
    if (Math.hypot(du, dv) < 0.01) out.push({ t: 'rect', u: b.a[0] - b.s1 / 2, v: b.a[2] - b.s2 / 2, w: b.s1, h: b.s2, relleno: true });
    else out.push({ t: 'linea', u1: b.a[0], v1: b.a[2], u2: b.b[0], v2: b.b[2], grosor: Math.max(b.s1, b.s2) });
  });
  g.paneles.forEach(p => out.push({ t: 'rect', u: p.x, v: p.z, w: p.w, h: Math.max(p.d, 0.01) }));
  return out;
}

// Tipos de CarpiMetal que tienen sentido como bloque suelto en el ambiente.
export const SUELTOS = new Set(['mesa', 'silla', 'escalera', 'escalera_descanso', 'escalera_caracol', 'baranda', 'reja', 'cerco', 'porton', 'mampara', 'cerramiento', 'personalizado', 'reja_abanico', 'puerta', 'ventana']);

// Coloca un punto local (u, v) del bloque en el plano.
export function aPlano(b: Pick<Bloque, 'x' | 'y' | 'rot' | 'espejo' | 'ancho' | 'fondo'>, u: number, v: number) {
  const lu = (b.espejo ? b.ancho - u : u) - b.ancho / 2, lv = v - b.fondo / 2;
  const a = (b.rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return { x: b.x + lu * c - lv * s, y: b.y + lu * s + lv * c };
}
// ¿El punto (x, y) cae dentro del bloque?
export function dentroBloque(b: Bloque, x: number, y: number, holgura = 0.05) {
  const a = (-b.rot * Math.PI) / 180, dx = x - b.x, dy = y - b.y;
  const lu = dx * Math.cos(a) - dy * Math.sin(a), lv = dx * Math.sin(a) + dy * Math.cos(a);
  return Math.abs(lu) <= b.ancho / 2 + holgura && Math.abs(lv) <= b.fondo / 2 + holgura;
}
