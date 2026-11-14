// =============================================================================
// Columnas de CONCRETO ARMADO para techos metálicos (prediseño RNE E.060 + E.030).
//
// Caso típico en Perú: tijerales de acero apoyados sobre columnas de concreto con una
// PLANCHA EMBEBIDA (anclaje articulado). La columna trabaja como VOLADIZO empotrado en
// la zapata:
//  • Cuantía 1 % ≤ ρ ≤ 4 % (E.060 21.6); lado mínimo 25 cm.
//  • Axial: φPn = 0.65 · 0.80 · [0.85 f'c (Ag − As) + fy As] ≥ Pu.
//  • Flexión por sismo: Mu = V·h ≤ φMn = 0.9 · As,cara · fy · (d − a/2).
//  • Deriva: Δ = 0.75·R·V·h³ / (3·Ec·0.7·Ig) ;  Δ/h ≤ 0.007 (concreto, E.030).
//  • Estribos Ø 3/8": 1 @ 5 cm, zona de confinamiento Lo = máx(h/6, lado, 50 cm) @ 10 cm, resto @ 20 cm.
// Es un PREdiseño: la columna, su zapata y el anclaje los firma un ingeniero colegiado.
// =============================================================================
import type { Node3D, Segment3D } from './techosCadEngineTypes';

export const FC = 210, FY = 4200;               // kg/cm²
export const RECUB_CM = 4;
const EC = 15000 * Math.sqrt(FC);                // kg/cm²

export const BARRAS: Record<string, { area: number; kgm: number; db: number }> = {
  '1/2"': { area: 1.29, kgm: 0.994, db: 1.27 },
  '5/8"': { area: 1.99, kgm: 1.552, db: 1.59 },
  '3/4"': { area: 2.84, kgm: 2.235, db: 1.91 },
  '1"': { area: 5.10, kgm: 3.973, db: 2.54 },
};
const ESTRIBO = { d: '3/8"', kgm: 0.56 };

/** Secciones de la más chica a la más grande (b × h en cm, barras). */
const CANDIDATAS: { b: number; h: number; n: number; barra: keyof typeof BARRAS }[] = [
  { b: 25, h: 25, n: 4, barra: '5/8"' },
  { b: 30, h: 30, n: 4, barra: '3/4"' },
  { b: 30, h: 30, n: 8, barra: '5/8"' },
  { b: 35, h: 35, n: 8, barra: '5/8"' },
  { b: 40, h: 40, n: 8, barra: '3/4"' },
  { b: 45, h: 45, n: 12, barra: '3/4"' },
  { b: 50, h: 50, n: 12, barra: '3/4"' },
  { b: 60, h: 60, n: 12, barra: '1"' },
];

export interface DisenoColumnaCA {
  b: number; h: number; n: number; barra: string; asCm2: number; cuantia: number;
  alturaM: number; PuKg: number; phiPnKg: number; VKg: number; MuKgM: number; phiMnKgM: number;
  deltaCm: number; deriva: number; derivaLim: number;
  estribos: string; LoCm: number; nEstribos: number;
  estado: 'CUMPLE' | 'NO_CUMPLE'; motivo: string;
}

function verificar(c: typeof CANDIDATAS[number], hM: number, _PuKg: number, VKg: number, R: number) {
  const Ag = c.b * c.h, As = c.n * BARRAS[c.barra].area, rho = As / Ag;
  const phiPn = 0.65 * 0.8 * (0.85 * FC * (Ag - As) + FY * As);
  // Acero en la cara traccionada: las barras de una cara (4 barras → 2; 8 → 3; 12 → 4).
  const porCara = c.n <= 4 ? 2 : c.n <= 8 ? 3 : 4;
  const AsT = porCara * BARRAS[c.barra].area;
  const d = c.h - RECUB_CM - 0.95 - BARRAS[c.barra].db / 2;
  const a = (AsT * FY) / (0.85 * FC * c.b);
  const phiMn = 0.9 * AsT * FY * (d - a / 2) / 100;        // kg·m
  const Mu = VKg * hM;                                       // kg·m (voladizo)
  const Ig = (c.b * c.h ** 3) / 12;                          // cm⁴
  const hCm = hM * 100;
  const deltaE = (VKg * hCm ** 3) / (3 * EC * 0.7 * Ig);     // cm
  const delta = 0.75 * R * deltaE;
  return { As, rho, phiPn, Mu, phiMn, delta, deriva: delta / hCm };
}

/** Diseña la columna típica (la más cargada) y devuelve la sección más chica que cumple. */
export function disenarColumnaCA(hM: number, PuKg: number, VKg: number, R = 4): DisenoColumnaCA {
  const derivaLim = 0.007;
  let elegida = CANDIDATAS[CANDIDATAS.length - 1], v = verificar(elegida, hM, PuKg, VKg, R), ok = false;
  for (const c of CANDIDATAS) {
    const r = verificar(c, hM, PuKg, VKg, R);
    if (r.rho >= 0.01 && r.rho <= 0.04 && r.phiPn >= PuKg && r.phiMn >= r.Mu && r.deriva <= derivaLim) { elegida = c; v = r; ok = true; break; }
  }
  const LoCm = Math.max(hM * 100 / 6, elegida.h, 50);
  const nLo = Math.ceil((LoCm - 5) / 10);
  const resto = Math.max(0, hM * 100 - 2 * LoCm);
  const nEstribos = 2 * (1 + nLo) + Math.ceil(resto / 20);
  let motivo = 'Cumple cuantía, carga axial, flexión por sismo y deriva';
  if (!ok) motivo = v.deriva > derivaLim ? `Deriva ${v.deriva.toFixed(4)} > ${derivaLim}: arriostrar o agrandar la columna` : 'Ninguna sección de la lista alcanza: revisar con un ingeniero';
  return {
    b: elegida.b, h: elegida.h, n: elegida.n, barra: elegida.barra, asCm2: v.As, cuantia: v.rho,
    alturaM: hM, PuKg, phiPnKg: v.phiPn, VKg, MuKgM: v.Mu, phiMnKgM: v.phiMn, deltaCm: v.delta, deriva: v.deriva, derivaLim,
    estribos: `□ Ø ${ESTRIBO.d}: 1 @ .05, ${nLo} @ .10, Rto. @ .20 c/e`, LoCm, nEstribos,
    estado: ok ? 'CUMPLE' : 'NO_CUMPLE', motivo,
  };
}

export interface MetradoConcreto {
  columnas: number; alturaTotalM: number; volumenM3: number; aceroKg: number; encofradoM2: number;
  cementoBolsas: number; arenaM3: number; piedraM3: number; aguaL: number;
}
/** Metrado de las columnas de concreto con la sección diseñada (o 25 × 25 si no hay diseño). */
export function metradoColumnasCA(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, dis?: DisenoColumnaCA | null): MetradoConcreto {
  const cols = Object.values(segments).filter(s => s.rolEstructural === 'columna_concreto' && nodes[s.nodeAId] && nodes[s.nodeBId]);
  const b = (dis?.b || 25) / 100, h = (dis?.h || 25) / 100;
  let alturaTotalM = 0, aceroKg = 0;
  cols.forEach(s => {
    const A = nodes[s.nodeAId], B = nodes[s.nodeBId];
    const L = Math.hypot(A.x - B.x, A.y - B.y, (A.z || 0) - (B.z || 0));
    alturaTotalM += L;
    if (dis) {
      aceroKg += dis.n * (L + 0.6 + 0.3) * BARRAS[dis.barra].kgm;            // longitudinal + anclaje en zapata y gancho arriba
      const largoEstribo = 2 * (b - 0.08) + 2 * (h - 0.08) + 0.2;            // con ganchos a 135°
      aceroKg += dis.nEstribos * largoEstribo * ESTRIBO.kgm;
    }
  });
  const volumenM3 = alturaTotalM * b * h;
  return {
    columnas: cols.length, alturaTotalM, volumenM3, aceroKg, encofradoM2: alturaTotalM * 2 * (b + h),
    cementoBolsas: volumenM3 * 9.5, arenaM3: volumenM3 * 0.54, piedraM3: volumenM3 * 0.55, aguaL: volumenM3 * 180,
  };
}
