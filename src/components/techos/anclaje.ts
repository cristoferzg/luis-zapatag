// Placas base y pernos de anclaje de las columnas metálicas (Techos Metálicos).
// Cada nudo de apoyo guarda numPernos, boltDiameter y placaMm [ancho, largo, espesor]; lo usan el 3D,
// la memoria de cálculo (anclaje), el plano CM-02 y los costos. Sin datos: 4 pernos Ø 5/8" y la placa recomendada.
import type { Node3D, Segment3D, PerfilTubularItem } from './techosCadEngineTypes';

/** Área resistente (cm²) de cada diámetro de perno. */
export const AREA_PERNO: Record<string, number> = { '1/2"': 1.27, '5/8"': 1.98, '3/4"': 2.85, '7/8"': 3.88, '1"': 5.07, M16: 2.01, M20: 3.14, M24: 4.52 };
export const DIAMETROS_PERNO = ['1/2"', '5/8"', '3/4"', '7/8"', '1"'];
export const PERNOS_OPCIONES = [4, 6, 8];
export const ESPESORES_PLACA = [6, 8, 10, 12, 16, 19, 25];

/** "5/8'" (dato viejo), "5/8" o '5/8"' → '5/8"'. */
export function normalizarDiametro(d?: string): string {
  const s = String(d || '').trim().replace(/['”″]+$/, '').replace(/"+$/, '');
  if (/^M\d+$/i.test(s)) return s.toUpperCase();
  return DIAMETROS_PERNO.includes(`${s}"`) ? `${s}"` : '5/8"';
}
export const diametroMm = (d: string) => { const n = normalizarDiametro(d); if (/^M/.test(n)) return Number(n.slice(1)); const [a, b] = n.replace('"', '').split('/').map(Number); return (b ? a / b : a) * 25.4; };

/** Capacidad a tracción del grupo de pernos (kg): φRnt = 0.75·0.75·Fu·Ab (ASTM A307, Fu 4200 kg/cm²). */
export const capacidadPernosKg = (n: number, d: string) => n * 0.75 * 0.75 * 4200 * (AREA_PERNO[normalizarDiametro(d)] || 1.98);

/** Placa recomendada para la columna: 5 cm de borde a cada lado del perfil (mín. 25 cm), en múltiplos de 5 cm. */
export function placaRecomendada(p?: PerfilTubularItem, numPernos = 4): [number, number, number] {
  const a = p ? p.anchoMm : 100, b = p ? (p.altoMm || p.anchoMm) : 100;
  const r = (v: number) => Math.max(250, Math.ceil((v + 100) / 50) * 50);
  const largo = r(a) + (numPernos >= 6 ? 50 : 0);
  const esp = Math.max(a, b) >= 200 ? 16 : Math.max(a, b) >= 150 ? 12 : 10;
  return [r(b), largo, esp];
}

export interface Anclaje3D { numPernos: number; diametro: string; placaMm: [number, number, number] }

/** Configuración de un nudo de apoyo (con lo recomendado cuando falta). */
export function anclajeDeNudo(n: Partial<Node3D> | undefined, perfil?: PerfilTubularItem): Anclaje3D {
  const numPernos = PERNOS_OPCIONES.includes(n?.numPernos || 0) ? n!.numPernos! : 4;
  return { numPernos, diametro: normalizarDiametro(n?.boltDiameter), placaMm: (n?.placaMm as [number, number, number]) || placaRecomendada(perfil, numPernos) };
}

/** Nudos de apoyo de columnas metálicas (el de abajo de cada columna). */
export function nudosDeApoyo(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>): { nodo: Node3D; seg: Segment3D }[] {
  const out: { nodo: Node3D; seg: Segment3D }[] = [];
  const vistos = new Set<string>();
  Object.values(segments).forEach(s => {
    if (s.rolEstructural !== 'columna') return;
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
    if (!a || !b) return;
    const abajo = a.y <= b.y ? a : b;
    if (vistos.has(abajo.id)) return;
    vistos.add(abajo.id); out.push({ nodo: abajo, seg: s });
  });
  return out;
}

/** Lo que más se repite en las bases (para la memoria, el plano y el panel). */
export function anclajeComun(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, perfilDe: (id: string) => PerfilTubularItem | undefined): Anclaje3D & { n: number } {
  const ap = nudosDeApoyo(nodes, segments);
  const cuenta = new Map<string, { a: Anclaje3D; c: number }>();
  ap.forEach(({ nodo, seg }) => { const a = anclajeDeNudo(nodo, perfilDe(seg.profileId)); const k = JSON.stringify(a); const e = cuenta.get(k); if (e) e.c++; else cuenta.set(k, { a, c: 1 }); });
  const top = [...cuenta.values()].sort((x, y) => y.c - x.c)[0]?.a || anclajeDeNudo(undefined, ap[0] ? perfilDe(ap[0].seg.profileId) : undefined);
  return { ...top, n: ap.length };
}

/** Pernos más económicos que resisten la demanda (kg): primero 4 pernos subiendo el diámetro, luego 6 y 8. */
export function pernosRecomendados(demandaKg: number): { numPernos: number; diametro: string } {
  for (const n of PERNOS_OPCIONES) for (const d of DIAMETROS_PERNO) if (d !== '1/2"' && capacidadPernosKg(n, d) >= demandaKg) return { numPernos: n, diametro: d };
  return { numPernos: 8, diametro: '1"' };
}

/** Peso de la placa (kg), acero 7850 kg/m³. */
export const pesoPlacaKg = (p: [number, number, number]) => (p[0] / 1000) * (p[1] / 1000) * (p[2] / 1000) * 7850;
