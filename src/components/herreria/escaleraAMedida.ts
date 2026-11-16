// =============================================================================
// ESCALERA A MEDIDA (Carpintería Metálica): arma TODAS las piezas de una escalera
// recta, en L o en U con descanso con las medidas reales (las que escribe el usuario
// o las que la IA leyó de un plano). Ejes del diseño: X = largo, Y = altura, Z = ancho.
//
//  • Cada tramo: dos zancos (tubo rectangular) y peldaños de madera o plancha estriada
//    sobre soportes. Peldaños = contrahuellas − 1 (el último paso es el descanso o la llegada).
//  • Descanso (L y U): bastidor perimetral, vigueta central, tablero y 4 columnas.
//  • Llegada superior opcional y baranda opcional (pasamanos a 0.90 m con postes).
// Lo usan «Escalera a medida» y «Diseñar con IA» (EscaleraAMedida.tsx / functions/carpimetalIA.js).
// =============================================================================
import type { HerreriaDesign, PiezaCad } from './herreriaTypes';
import { crearDisenoPorElemento } from './herreriaCatalog';

export type FormaEscalera = 'recta' | 'L' | 'U';
export interface EscaleraParams {
  forma: FormaEscalera;
  alturaTotal: number;        // m, del piso a la llegada
  ancho: number;              // m, ancho de cada tramo (largo del peldaño)
  alturaDescanso?: number;    // m (L y U); por defecto la mitad
  largoDescanso?: number;     // m (U: a lo largo; L: el descanso es cuadrado de ancho × ancho)
  separacion?: number;        // m entre los dos tramos de la U (ojo de la escalera)
  peldanos1?: number;         // peldaños del 1.er tramo (sin contar el descanso o la llegada)
  peldanos2?: number;         // peldaños del 2.º tramo
  largo1?: number;            // m, desarrollo horizontal del 1.er tramo
  largo2?: number;            // m, desarrollo horizontal del 2.º tramo
  huella?: number;            // m, fondo del tablero de cada peldaño (0.25 a 0.30)
  llegada?: number;           // m, largo de la llegada superior (0 = llega a una losa)
  giro?: 'izquierda' | 'derecha'; // L: hacia dónde voltea el 2.º tramo
  peldano?: 'madera' | 'estriada';
  baranda?: boolean;
  columnas?: boolean;         // columnas bajo el descanso
  perfilZanco?: string;
  perfilColumna?: string;
  perfilSoporte?: string;
  nombre?: string;
}

export const PERFILES_ZANCO = ['rect-4x2-2.0', 'rect-3x1.5-2.0', 'cuad-3x3-2.0', 'rect-2x1-2.0'];
export const PERFILES_COLUMNA = ['cuad-3x3-2.0', 'cuad-2x2-2.0', 'rect-4x2-2.0'];
export const PERFILES_SOPORTE = ['rect-2x1-2.0', 'rect-2x1-1.5', 'cuad-2x2-2.0'];

const entre = (v: any, a: number, b: number, def: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : def; };
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const CONTRA_IDEAL = 0.175; // contrahuella cómoda (RNE A.010: 0.15 a 0.18 m)

/** Completa y limita los datos (nunca se confía en lo que llega). */
export function normalizarEscalera(p: Partial<EscaleraParams>): EscaleraParams {
  const forma: FormaEscalera = p.forma === 'L' || p.forma === 'U' ? p.forma : 'recta';
  const H = entre(p.alturaTotal, 0.5, 8, 2.8);
  const ancho = entre(p.ancho, 0.6, 2.5, 1.0);
  const conDesc = forma !== 'recta';
  const hD = conDesc ? entre(p.alturaDescanso, 0.3, H - 0.3, H / 2) : H;
  const huella = entre(p.huella, 0.18, 0.40, 0.28);
  const peld = (h: number, v: any) => Math.round(entre(v, 1, 30, Math.max(2, Math.round(h / CONTRA_IDEAL)) - 1));
  const p1 = peld(hD, p.peldanos1), p2 = conDesc ? peld(H - hD, p.peldanos2) : 0;
  const largoDef = (n: number) => r3((n + 1) * 0.25); // paso de 25 cm por contrahuella
  return {
    forma, alturaTotal: r3(H), ancho: r3(ancho), alturaDescanso: r3(hD),
    largoDescanso: r3(forma === 'U' ? entre(p.largoDescanso, 0.6, 3, 1.2) : ancho),
    separacion: r3(forma === 'U' ? entre(p.separacion, 0, 1, 0) : 0),
    peldanos1: p1, peldanos2: p2,
    largo1: r3(entre(p.largo1, 0.3, 8, largoDef(p1))), largo2: r3(conDesc ? entre(p.largo2, 0.3, 8, largoDef(p2)) : 0),
    huella: r3(huella), llegada: r3(entre(p.llegada, 0, 2, 0)),
    giro: p.giro === 'derecha' ? 'derecha' : 'izquierda',
    peldano: p.peldano === 'estriada' ? 'estriada' : 'madera',
    baranda: !!p.baranda, columnas: p.columnas !== false,
    perfilZanco: PERFILES_ZANCO.includes(String(p.perfilZanco)) ? String(p.perfilZanco) : 'rect-4x2-2.0',
    perfilColumna: PERFILES_COLUMNA.includes(String(p.perfilColumna)) ? String(p.perfilColumna) : 'cuad-3x3-2.0',
    perfilSoporte: PERFILES_SOPORTE.includes(String(p.perfilSoporte)) ? String(p.perfilSoporte) : 'rect-2x1-2.0',
    nombre: String(p.nombre || '').slice(0, 80),
  };
}

type V3 = [number, number, number];

/** Diseño completo de Carpintería Metálica con todas las piezas de la escalera. */
export function generarEscalera(entrada: Partial<EscaleraParams>): HerreriaDesign {
  const p = normalizarEscalera(entrada);
  const piezas: PiezaCad[] = [];
  let n = 0;
  const ts = Date.now().toString(36);
  const barra = (marca: string, nombre: string, a: V3, b: V3, grupo: string, perfilId: string, corte: '90°' | '45°' = '90°') => {
    piezas.push({ id: `esc-${ts}-${++n}`, marca, nombre, tipo: 'perfil', material: 'acero', perfilId,
      x1: r3(a[0]), y1: r3(a[1]), z1: r3(a[2]), x2: r3(b[0]), y2: r3(b[1]), z2: r3(b[2]),
      longitudM: r3(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])), rotacionDeg: 0, corteInicio: corte, corteFin: corte, cantidad: 1, grupo } as PiezaCad);
  };
  // Tablero horizontal (peldaño, descanso o llegada) entre x1..x2 y z1..z2 a la altura y.
  const tablero = (marca: string, nombre: string, x1: number, x2: number, z1: number, z2: number, y: number, grupo: string) => {
    const madera = p.peldano === 'madera';
    const [xa, xb] = x1 < x2 ? [x1, x2] : [x2, x1], [za, zb] = z1 < z2 ? [z1, z2] : [z2, z1];
    piezas.push({ id: `esc-${ts}-${++n}`, marca, nombre: `${nombre}${madera ? ' (madera)' : ''}`, tipo: 'plancha', material: madera ? 'especial' : 'acero',
      perfilId: madera ? 'plancha-machihembrada-1.5' : 'plancha-estriada-2.5mm',
      x1: r3(xa), y1: r3(y), z1: r3(za), x2: r3(xb), y2: r3(y), z2: r3(zb), longitudM: r3(zb - za), rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
      esPlancha: true, anchoPlanchaM: r3(xb - xa), altoPlanchaM: r3(zb - za), espesorPlanchaMm: madera ? 30 : 2.5,
      subtipoPlancha: madera ? 'machihembrada' : 'estriada', ...(madera ? { acabadoMaterial: 'madera', colorHex: '#a0703c' } : { tipoRelleno: 'plancha_estriada' }),
      cantidad: 1, grupo } as PiezaCad);
  };
  const W = p.ancho, H = p.alturaTotal, hD = p.alturaDescanso!, hu = p.huella!;
  const zancoIn = 0.075; // zancos a 7.5 cm de cada borde
  const alto = 0.05;     // los bastidores van 5 cm debajo del tablero

  /**
   * Un tramo que sube de `a` (x, y, z del eje, borde de arranque) a `b` a lo largo de una dirección en planta,
   * con ancho W hacia el lado `lado` (vector unitario en planta perpendicular a la marcha).
   */
  const tramo = (letra: string, nombre: string, a: V3, b: V3, lado: [number, number], peldanos: number) => {
    const bordes = [zancoIn, W - zancoIn].map(d => [a[0] + lado[0] * d, a[2] + lado[1] * d]);
    bordes.forEach(([ox, oz], i) => barra(`Z-${letra}${i + 1}`, `Zanco ${nombre} ${i ? 'derecho' : 'izquierdo'}`,
      [ox, a[1] - (a[1] > 0 ? alto : 0), oz], [ox + (b[0] - a[0]), b[1] - (b[1] > 0 ? alto : 0), oz + (b[2] - a[2])], 'zancos', p.perfilZanco!, '45°'));
    const pasos = peldanos + 1;
    const dx = (b[0] - a[0]) / pasos, dz = (b[2] - a[2]) / pasos, dy = (b[1] - a[1]) / pasos;
    const L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
    for (let k = 1; k <= peldanos; k++) {
      const cx = a[0] + dx * k, cz = a[2] + dz * k, y = a[1] + dy * k;
      // tablero de huella centrado en el paso, a todo el ancho
      const p1: [number, number] = [cx - ux * hu / 2, cz - uz * hu / 2], p2: [number, number] = [cx + ux * hu / 2, cz + uz * hu / 2];
      const esq = [p1, p2, [p1[0] + lado[0] * W, p1[1] + lado[1] * W], [p2[0] + lado[0] * W, p2[1] + lado[1] * W]];
      const xs = esq.map(e => e[0]), zs = esq.map(e => e[1]);
      tablero(`P-${letra}${String(k).padStart(2, '0')}`, `Peldaño ${nombre} #${k}`, Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs), y, 'peldanos');
      const s1 = bordes[0], s2 = bordes[1];
      barra(`S-${letra}${k}`, `Soporte peldaño ${nombre} #${k}`, [s1[0] + dx * k, y - 0.03, s1[1] + dz * k], [s2[0] + dx * k, y - 0.03, s2[1] + dz * k], 'peldanos', p.perfilSoporte!);
    }
    if (p.baranda) {
      const [ox, oz] = [a[0] + lado[0] * W, a[2] + lado[1] * W];
      const ini: V3 = [ox, a[1], oz], fin: V3 = [ox + (b[0] - a[0]), b[1], oz + (b[2] - a[2])];
      barra(`PS-${letra}`, `Pasamanos ${nombre}`, [ini[0], ini[1] + 0.9, ini[2]], [fin[0], fin[1] + 0.9, fin[2]], 'baranda', 'red-2-2.0');
      [ini, [(ini[0] + fin[0]) / 2, (ini[1] + fin[1]) / 2, (ini[2] + fin[2]) / 2] as V3, fin].forEach((q, i) =>
        barra(`PB-${letra}${i + 1}`, `Poste baranda ${nombre} #${i + 1}`, q, [q[0], q[1] + 0.9, q[2]], 'baranda', 'cuad-1.5x1.5-1.5'));
    }
  };
  /** Plataforma (descanso o llegada) con bastidor, vigueta, tablero y, si se pide, 4 columnas. */
  const plataforma = (letra: string, nombre: string, x1: number, x2: number, z1: number, z2: number, y: number, conColumnas: boolean) => {
    const yb = y - alto;
    barra(`${letra}-1`, `Viga ${nombre} 1`, [x1, yb, z1], [x2, yb, z1], 'descanso', p.perfilZanco!);
    barra(`${letra}-2`, `Viga ${nombre} 2`, [x1, yb, z2], [x2, yb, z2], 'descanso', p.perfilZanco!);
    barra(`${letra}-3`, `Viga ${nombre} 3`, [x1, yb, z1], [x1, yb, z2], 'descanso', p.perfilZanco!);
    barra(`${letra}-4`, `Viga ${nombre} 4`, [x2, yb, z1], [x2, yb, z2], 'descanso', p.perfilZanco!);
    if (Math.abs(x2 - x1) > 0.8) barra(`${letra}-5`, `Vigueta ${nombre}`, [(x1 + x2) / 2, yb, z1], [(x1 + x2) / 2, yb, z2], 'descanso', p.perfilSoporte!);
    tablero(`T${letra}`, `Tablero ${nombre}`, x1, x2, z1, z2, y, 'descanso');
    if (conColumnas) {
      const c = 0.05;
      [[x1 + c, z1 + c], [x2 - c, z1 + c], [x1 + c, z2 - c], [x2 - c, z2 - c]].forEach(([x, z], i) =>
        barra(`C${letra}-${i + 1}`, `Columna ${nombre} ${i + 1}`, [x, 0, z], [x, yb, z], 'estructura', p.perfilColumna!));
    }
  };

  if (p.forma === 'recta') {
    tramo('A', 'tramo', [0, 0, 0], [p.largo1!, H, 0], [0, 1], p.peldanos1!);
    if (p.llegada) plataforma('L', 'llegada', p.largo1!, p.largo1! + p.llegada, 0, W, H, false);
  } else if (p.forma === 'U') {
    // Descanso a la izquierda (x 0..LD) con todo el ancho; tramo 1 baja hacia +X por el lado lejano,
    // tramo 2 sube hacia +X por el lado cercano (vuelta de 180°).
    const LD = p.largoDescanso!, sep = p.separacion!, Z = 2 * W + sep;
    plataforma('D', 'descanso', 0, LD, 0, Z, hD, !!p.columnas);
    tramo('A', 'tramo 1', [LD + p.largo1!, 0, W + sep], [LD, hD, W + sep], [0, 1], p.peldanos1!);
    tramo('B', 'tramo 2', [LD, hD, 0], [LD + p.largo2!, H, 0], [0, 1], p.peldanos2!);
    if (p.llegada) plataforma('L', 'llegada', LD + p.largo2!, LD + p.largo2! + p.llegada, 0, W, H, false);
  } else {
    // L: tramo 1 hacia +X, descanso cuadrado en la esquina, tramo 2 voltea hacia +Z (izquierda) o −Z (derecha).
    const x0 = p.largo1!, s = p.giro === 'derecha' ? -1 : 1;
    tramo('A', 'tramo 1', [0, 0, 0], [x0, hD, 0], [0, 1], p.peldanos1!);
    plataforma('D', 'descanso', x0, x0 + W, 0, W, hD, !!p.columnas);
    const zIni = s > 0 ? W : 0;
    tramo('B', 'tramo 2', [x0 + W, hD, zIni], [x0 + W, H, zIni + s * p.largo2!], [-1, 0], p.peldanos2!);
    if (p.llegada) plataforma('L', 'llegada', x0, x0 + W, zIni + s * p.largo2!, zIni + s * (p.largo2! + p.llegada), H, false);
  }

  const base = crearDisenoPorElemento(p.forma === 'recta' ? 'escalera' : 'escalera_descanso');
  const forma = p.forma === 'recta' ? 'recta' : p.forma === 'L' ? 'en L con descanso' : 'en U con descanso';
  const largoX = Math.max(0, ...piezas.flatMap(q => [q.x1, q.x2])) - Math.min(0, ...piezas.flatMap(q => [q.x1, q.x2]));
  return {
    ...base,
    id: `escalera-${ts}`,
    nombre: p.nombre || `Escalera ${forma} · ${H.toFixed(2)} m`,
    descripcion: `Escalera metálica ${forma}: altura ${H.toFixed(2)} m, ancho ${W.toFixed(2)} m, ${p.peldanos1! + (p.peldanos2 || 0)} peldaños de ${p.peldano === 'madera' ? 'madera' : 'plancha estriada'} de ${Math.round(hu * 100)} cm`
      + `${p.forma !== 'recta' ? `, descanso a ${hD.toFixed(2)} m` : ''}${p.llegada ? `, llegada de ${p.llegada.toFixed(2)} m` : ''}${p.baranda ? ', con baranda' : ''}. Zancos ${p.perfilZanco}.`,
    piezas, accesoriosCad: [], cotasCad: [],
    anchoM: r3(largoX), altoM: H, profundidadMarcoMm: Math.round((p.forma === 'U' ? 2 * W + p.separacion! : W) * 1000),
    perfilMarcoId: p.perfilZanco!, perfilBastidorId: p.perfilColumna!, perfilRefuerzoId: p.perfilSoporte!,
  } as HerreriaDesign;
}
