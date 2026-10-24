// =============================================================================
// Tensores para naves y techos (Techos Metálicos).
//
// Modelos: varilla lisa + templador (lo más usado y económico; trabaja solo a
// tracción y se pretensa con el templador), cable de acero + templador (luces
// largas o naves livianas) y rígido (tubo, también toma compresión).
// La E.090 del RNE no impone un tipo: el tensor debe resistir la fuerza de
// diseño; las cruces que trabajan solo a tracción se colocan tensadas.
//
// Colocación automática (criterio práctico usual, a verificar por el ingeniero):
//   • Cruces en X en el plano del techo y en las paredes laterales, en los paños
//     extremos y cada ~5 paños (≤ 30 m entre paños arriostrados).
//   • Templadores de correas (sag rods) a la mitad del paño si la correa pasa de
//     5.5 m y a los tercios si pasa de 7.5 m, de alero a cumbrera.
// =============================================================================
import type { Node3D, Segment3D } from './techosCadEngineTypes';
import { INVENTARIO_PERFILES_TUBULARES } from './techosCadCatalog';
import { precio, itemCatalogo } from '../../lib/catalogoPrecios';

export type TipoTensor = 'varilla' | 'cable' | 'rigido';
export interface ModeloTensor { id: string; tipo: TipoTensor; nombre: string; pulg: string; diamMm: number; kgM: number; clave: string; claveTemplador: string }

export const MODELOS_TENSOR: ModeloTensor[] = [
  { id: 'TEN-VAR-12', tipo: 'varilla', nombre: 'Varilla lisa Ø 1/2"', pulg: '1/2"', diamMm: 12.7, kgM: 0.994, clave: 'tensor:varilla_12', claveTemplador: 'tensor:templador_12' },
  { id: 'TEN-VAR-58', tipo: 'varilla', nombre: 'Varilla lisa Ø 5/8"', pulg: '5/8"', diamMm: 15.9, kgM: 1.552, clave: 'tensor:varilla_58', claveTemplador: 'tensor:templador_58' },
  { id: 'TEN-VAR-34', tipo: 'varilla', nombre: 'Varilla lisa Ø 3/4"', pulg: '3/4"', diamMm: 19.05, kgM: 2.235, clave: 'tensor:varilla_34', claveTemplador: 'tensor:templador_34' },
  { id: 'TEN-CAB-14', tipo: 'cable', nombre: 'Cable de acero Ø 1/4"', pulg: '1/4"', diamMm: 6.35, kgM: 0.17, clave: 'tensor:cable_14', claveTemplador: 'tensor:templador_12' },
  { id: 'TEN-CAB-38', tipo: 'cable', nombre: 'Cable de acero Ø 3/8"', pulg: '3/8"', diamMm: 9.5, kgM: 0.39, clave: 'tensor:cable_38', claveTemplador: 'tensor:templador_58' },
  { id: 'TEN-CAB-12', tipo: 'cable', nombre: 'Cable de acero Ø 1/2"', pulg: '1/2"', diamMm: 12.7, kgM: 0.69, clave: 'tensor:cable_12', claveTemplador: 'tensor:templador_34' },
];
export const modeloTensor = (id?: string) => MODELOS_TENSOR.find(m => m.id === id);
export const esTensor = (s: Segment3D) => !!modeloTensor(s.profileId);

// Perfil "virtual" (barra redonda) para dibujar el tensor en 2D/3D con su diámetro.
export function perfilDeTensor(id: string) {
  const m = modeloTensor(id);
  if (!m) return undefined;
  return { id: m.id, categoria: 'barra_redonda' as const, nombre: m.nombre, codigoComercial: m.id, anchoMm: m.diamMm, altoMm: m.diamMm, espesorMm: m.diamMm, pesoLinealKgM: m.kgM, longitudComercialM: m.tipo === 'varilla' ? 6 : 1, costoMetroSol: 0, resistenciaFluenciaFyMpa: 250 };
}
// Busca un perfil de Techos incluyendo los tensores.
export const perfilTechos = (id: string) => INVENTARIO_PERFILES_TUBULARES.find(p => p.id === id) || perfilDeTensor(id);

// Perfil rígido para cruces: tubo redondo de ~1½"-2" (o el más chico disponible).
export function perfilRigido() {
  const red = INVENTARIO_PERFILES_TUBULARES.filter(p => p.categoria === 'tubo_redondo').sort((a, b) => a.anchoMm - b.anchoMm);
  return (red.find(p => p.anchoMm >= 38) || red[0] || INVENTARIO_PERFILES_TUBULARES[0]).id;
}

// Diámetro sugerido según la luz de la nave (criterio práctico).
export function sugerido(tipo: TipoTensor, luz: number): string {
  if (tipo === 'cable') return luz > 20 ? 'TEN-CAB-12' : luz > 12 ? 'TEN-CAB-38' : 'TEN-CAB-14';
  if (tipo === 'varilla') return luz > 20 ? 'TEN-VAR-34' : luz > 12 ? 'TEN-VAR-58' : 'TEN-VAR-12';
  return perfilRigido();
}

// ── Detección de pórticos (tijerales) ───────────────────────────────────────
interface Portico { eje: 'x' | 'z'; c: number; nodos: Node3D[] } // c = coordenada del plano
const cerca = (a: number, b: number, t = 0.02) => Math.abs(a - b) <= t;

function porticos(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>): Portico[] {
  // Componentes conexas de cordones superiores = un tijeral cada una.
  const ady = new Map<string, string[]>();
  Object.values(segments).forEach(s => {
    if (s.rolEstructural !== 'cordon_superior') return;
    [[s.nodeAId, s.nodeBId], [s.nodeBId, s.nodeAId]].forEach(([a, b]) => ady.set(a, [...(ady.get(a) || []), b]));
  });
  const visto = new Set<string>(), out: Portico[] = [];
  ady.forEach((_, ini) => {
    if (visto.has(ini)) return;
    const pila = [ini], comp: Node3D[] = [];
    while (pila.length) { const id = pila.pop()!; if (visto.has(id)) continue; visto.add(id); if (nodes[id]) comp.push(nodes[id]); (ady.get(id) || []).forEach(v => pila.push(v)); }
    if (comp.length < 3) return;
    if (comp.every(n => cerca(n.z, comp[0].z))) out.push({ eje: 'z', c: comp[0].z, nodos: comp.sort((a, b) => a.x - b.x) });
    else if (comp.every(n => cerca(n.x, comp[0].x))) out.push({ eje: 'x', c: comp[0].x, nodos: comp.sort((a, b) => a.z - b.z) });
  });
  return out;
}
const otra = (p: Portico, n: Node3D) => (p.eje === 'z' ? n.x : n.z);

export interface OpcionesTensores { modeloCruz: string; modeloCorrea: string; techo: boolean; paredes: boolean; correas: boolean; cadaPanos: number; reemplazarArriostres?: boolean }
export interface ResultadoTensores { nodes: Record<string, Node3D>; segments: Record<string, Segment3D>; cruces: number; correas: number; panos: number[] }

// Quita los tensores colocados automáticamente (y sus nodos sueltos).
export function quitarTensoresAuto(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>) {
  const segs: Record<string, Segment3D> = {};
  Object.values(segments).forEach(s => { if (!s.tensorAuto) segs[s.id] = s; });
  const usados = new Set(Object.values(segs).flatMap(s => [s.nodeAId, s.nodeBId]));
  const ns: Record<string, Node3D> = {};
  Object.values(nodes).forEach(n => { if (!/^n_ten_/.test(n.id) || usados.has(n.id)) ns[n.id] = n; });
  return { nodes: ns, segments: segs };
}

export function generarTensores(nodes0: Record<string, Node3D>, segments0: Record<string, Segment3D>, o: OpcionesTensores): ResultadoTensores {
  const limpio = quitarTensoresAuto(nodes0, segments0);
  const base = limpio.nodes, segsBase: Record<string, Segment3D> = {};
  // Los arriostres de tubo en cruz los reemplazan los tensores (si se pide).
  Object.values(limpio.segments).forEach(s => { if (!(o.reemplazarArriostres && s.rolEstructural === 'arriostre')) segsBase[s.id] = s; });
  const nodes = { ...base }, segments = { ...segsBase };
  let k = 0, cruces = 0, sag = 0;
  const panosArriostrados: number[] = [];
  const rigido = !modeloTensor(o.modeloCruz);
  const seg = (a: string, b: string, perfil: string, funcion: 'cruz' | 'correa') => {
    const id = `s_ten_${++k}_${Date.now().toString(36)}`;
    segments[id] = { id, nodeAId: a, nodeBId: b, profileId: perfil, rolEstructural: funcion === 'cruz' && rigido ? 'arriostre' : 'tensor_viento', tensorAuto: true, funcionTensor: funcion };
  };
  const nodo = (x: number, y: number, z: number) => {
    const ex = Object.values(nodes).find(n => cerca(n.x, x, 0.005) && cerca(n.y, y, 0.005) && cerca(n.z, z, 0.005));
    if (ex) return ex.id;
    const id = `n_ten_${++k}_${Date.now().toString(36)}`;
    nodes[id] = { id, x, y, z };
    return id;
  };
  const pors = porticos(base, segsBase);
  (['z', 'x'] as const).forEach(eje => {
    const lista = pors.filter(p => p.eje === eje).sort((a, b) => a.c - b.c);
    // Pares de pórticos vecinos con la misma forma = un paño.
    const panos: [Portico, Portico][] = [];
    for (let i = 0; i + 1 < lista.length; i++) {
      const A = lista[i], Bp = lista[i + 1];
      if (A.nodos.length === Bp.nodos.length && A.nodos.every((n, j) => cerca(otra(A, n), otra(Bp, Bp.nodos[j]), 0.05) && cerca(n.y, Bp.nodos[j].y, 0.05))) panos.push([A, Bp]);
    }
    if (!panos.length) return;
    const n = panos.length;
    const elegidos = new Set<number>([0, n - 1]);
    for (let i = o.cadaPanos; i < n - 1; i += o.cadaPanos) elegidos.add(i);
    panos.forEach(([A, Bp], idx) => {
      const largoPano = Math.abs(Bp.c - A.c);
      // ── Cruces en X en el techo y en las paredes
      if (elegidos.has(idx)) {
        panosArriostrados.push(idx + 1);
        if (o.techo) {
          // Puntos de panel: alero, cumbrera y puntos intermedios (paneles ~cuadrados).
          const cima = A.nodos.reduce((m, nn, j) => (nn.y > A.nodos[m].y ? j : m), 0);
          const aguas = [[0, cima], [cima, A.nodos.length - 1]].filter(([i0, i1]) => i1 > i0);
          aguas.forEach(([i0, i1]) => {
            const lAgua = Math.hypot(otra(A, A.nodos[i1]) - otra(A, A.nodos[i0]), A.nodos[i1].y - A.nodos[i0].y);
            const paneles = Math.max(1, Math.round(lAgua / Math.max(2.5, largoPano)));
            const idxs: number[] = [];
            for (let p = 0; p <= paneles; p++) idxs.push(Math.round(i0 + ((i1 - i0) * p) / paneles));
            const uniq = [...new Set(idxs)];
            for (let p = 0; p + 1 < uniq.length; p++) {
              const a0 = A.nodos[uniq[p]], a1 = A.nodos[uniq[p + 1]], b0 = Bp.nodos[uniq[p]], b1 = Bp.nodos[uniq[p + 1]];
              seg(a0.id, b1.id, o.modeloCruz, 'cruz'); seg(a1.id, b0.id, o.modeloCruz, 'cruz'); cruces += 2;
            }
          });
        }
        if (o.paredes) {
          // Columnas de los extremos de cada pórtico (paredes laterales).
          const colEn = (P: Portico, lado: 'min' | 'max') => {
            const cols = Object.values(segsBase).filter(s => s.rolEstructural === 'columna' || s.rolEstructural === 'columna_concreto')
              .map(s => [base[s.nodeAId], base[s.nodeBId]]).filter(([a, b]) => a && b && cerca(P.eje === 'z' ? a.z : a.x, P.c) && cerca(P.eje === 'z' ? b.z : b.x, P.c))
              .map(([a, b]) => (a.y < b.y ? { pie: a, cab: b } : { pie: b, cab: a }));
            if (!cols.length) return null;
            const v = (c: { pie: Node3D }) => (P.eje === 'z' ? c.pie.x : c.pie.z);
            return cols.reduce((m, c) => (lado === 'min' ? (v(c) < v(m) ? c : m) : (v(c) > v(m) ? c : m)));
          };
          (['min', 'max'] as const).forEach(lado => {
            const ca = colEn(A, lado), cb = colEn(Bp, lado);
            if (!ca || !cb || ca.cab.y - ca.pie.y < 1.5) return;
            seg(ca.pie.id, cb.cab.id, o.modeloCruz, 'cruz'); seg(ca.cab.id, cb.pie.id, o.modeloCruz, 'cruz'); cruces += 2;
          });
        }
      }
      // ── Templadores de correas (sag rods)
      if (o.correas && largoPano > 5.5) {
        const lineas = largoPano > 7.5 ? [1 / 3, 2 / 3] : [1 / 2];
        const correas = Object.values(segsBase).filter(s => s.rolEstructural === 'correa').map(s => [base[s.nodeAId], base[s.nodeBId]] as const)
          .filter(([a, b]) => a && b && (eje === 'z' ? cerca(a.x, b.x, 0.05) : cerca(a.z, b.z, 0.05)))
          .filter(([a, b]) => { const c1 = eje === 'z' ? a.z : a.x, c2 = eje === 'z' ? b.z : b.x; return Math.min(c1, c2) <= A.c + 0.05 && Math.max(c1, c2) >= Bp.c - 0.05; });
        lineas.forEach(f => {
          const cc = A.c + (Bp.c - A.c) * f;
          const pts = correas.map(([a, b]) => {
            const c1 = eje === 'z' ? a.z : a.x, c2 = eje === 'z' ? b.z : b.x;
            const t = (cc - c1) / (c2 - c1 || 1);
            return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
          }).sort((p, q) => (eje === 'z' ? p.x - q.x : p.z - q.z));
          for (let i = 0; i + 1 < pts.length; i++) {
            const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y, pts[i + 1].z - pts[i].z);
            if (d < 0.2 || d > 3.5) continue;
            seg(nodo(pts[i].x, pts[i].y, pts[i].z), nodo(pts[i + 1].x, pts[i + 1].y, pts[i + 1].z), o.modeloCorrea, 'correa'); sag++;
          }
        });
      }
    });
  });
  return { nodes, segments, cruces, correas: sag, panos: panosArriostrados };
}

// ── Metrado y costo de los tensores (varilla/cable y accesorios) ────────────
export interface LineaTensor { clave: string; nombre: string; unidad: string; cantidad: number; precio: number; subtotal: number; nota: string }
export function metradoTensores(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>): LineaTensor[] {
  const porModelo = new Map<string, { m: number; piezas: number; correa: number; cruz: number }>();
  Object.values(segments).forEach(s => {
    const mod = modeloTensor(s.profileId); if (!mod) return;
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId]; if (!a || !b) return;
    const L = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    const r = porModelo.get(mod.id) || { m: 0, piezas: 0, correa: 0, cruz: 0 };
    r.m += L; r.piezas++; if (s.funcionTensor === 'correa') r.correa++; else r.cruz++;
    porModelo.set(mod.id, r);
  });
  const out: LineaTensor[] = [];
  const add = (clave: string, cantidad: number, nota: string) => {
    if (cantidad <= 0) return;
    const it = itemCatalogo(clave); const p = precio(clave);
    const i = out.findIndex(l => l.clave === clave);
    if (i >= 0) { out[i].cantidad += cantidad; out[i].subtotal = out[i].cantidad * out[i].precio; if (!out[i].nota.includes(nota)) out[i].nota += ` + ${nota}`; return; }
    out.push({ clave, nombre: it?.nombre || clave, unidad: it?.unidad || 'und', cantidad, precio: p, subtotal: cantidad * p, nota });
  };
  porModelo.forEach((r, id) => {
    const mod = modeloTensor(id)!;
    if (mod.tipo === 'varilla') {
      // +0.30 m por extremo (rosca y doblez) y 5% de desperdicio, en barras de 6 m.
      const total = (r.m + r.cruz * 0.6 + r.correa * 0.1) * 1.05;
      add(mod.clave, Math.ceil(total / 6), `${r.m.toFixed(1)} m en ${r.piezas} tramos`);
      add(mod.claveTemplador, r.cruz, `1 por cruz`);
      add('tensor:tuerca', r.cruz * 2 + r.correa * 2, 'tuerca + arandela por extremo');
    } else {
      add(mod.clave, Math.ceil((r.m + r.cruz * 1.0) * 1.05), `${r.m.toFixed(1)} m + amarres`);
      add(mod.claveTemplador, r.cruz, '1 por cruz');
      add('tensor:grapa', r.cruz * 6, '3 grapas por extremo');
      add('tensor:guardacabo', r.cruz * 2, '1 por extremo');
    }
  });
  return out.map(l => ({ ...l, cantidad: Math.ceil(l.cantidad), subtotal: Math.ceil(l.cantidad) * l.precio }));
}
