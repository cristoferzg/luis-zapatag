// =============================================================================
// Techo a DOS AGUAS desde las medidas de un croquis (o de lo que manda el
// cliente por chat): columnas en los dos lados largos, un tijeral triangular en
// cada línea de columnas con su cumbrera al centro, aleros ("ala") a los lados y
// en los extremos, correas a lo largo sobre los nudos del cordón superior, vigas
// collar en la cabeza de las columnas y tensores en cruz en los paños extremos.
//
// Ejes: X = ancho (los tijerales cruzan el ancho), Z = largo (la cumbrera corre a
// lo largo), Y = altura. Medidas "acabadas" = con alero; las columnas quedan
// metidas el alero hacia adentro.
// Módulo puro (sin Firebase) para usarlo desde la lectura de planos y en pruebas.
// =============================================================================
import type { Node3D, Segment3D, CoverageZone3D, RolEstructuralSegmento } from './techosCadEngineTypes';

export interface DosAguasParams {
  anchoM: number;          // ancho acabado (con aleros)
  largoM: number;          // largo acabado (con aleros)
  aleroAnchoM?: number;    // ala a cada lado del ancho (default 0)
  aleroLargoM?: number;    // volado en los extremos del largo (default = aleroAnchoM)
  columnasCadaM: number;   // separación entre columnas a lo largo
  alturaColM: number;      // altura de la cabeza de columna (apoyo del tijeral)
  cumbreraM: number;       // alto del tijeral en la cumbrera (sobre el apoyo)
  panelM?: number;         // separación de montantes del tijeral (default ~1.2 m)
  coberturaId?: string;
  perfiles?: Partial<Record<'columna' | 'cordon' | 'montante' | 'diagonal' | 'diagonalApoyo' | 'correa' | 'collar', string>>;
}

export const PERFILES_DOS_AGUAS = {
  columna: 'perfil_sq_3x3_20', cordon: 'perfil_sq_2x2_20', montante: 'perfil_sq_30x30_20',
  diagonal: 'perfil_sq_2x2_20', diagonalApoyo: 'perfil_sq_2x2_30', correa: 'perfil_rec_100x50_20', collar: 'perfil_rec_100x50_20',
};

export function armarDosAguas(p: DosAguasParams): { nodes: Record<string, Node3D>; segments: Record<string, Segment3D>; zones: Record<string, CoverageZone3D>; resumen: string } {
  const W = Math.max(1, p.anchoM), L = Math.max(1, p.largoM);
  const aW = Math.min(Math.max(0, p.aleroAnchoM ?? 0), W / 4);
  const aL = Math.min(Math.max(0, p.aleroLargoM ?? aW), L / 4);
  const H = Math.max(1, p.alturaColM), h = Math.max(0.3, p.cumbreraM);
  const P = { ...PERFILES_DOS_AGUAS, ...(p.perfiles || {}) };
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  const nodes: Record<string, Node3D> = {};
  const segments: Record<string, Segment3D> = {};
  const stamp = Date.now().toString(36);
  let nN = 0, nS = 0;
  const nodo = (x: number, y: number, z: number, fijo = false): string => {
    x = r3(x); y = r3(y); z = r3(z);
    const ya = Object.values(nodes).find(n => Math.abs(n.x - x) < 1e-3 && Math.abs(n.y - y) < 1e-3 && Math.abs(n.z - z) < 1e-3);
    if (ya) { if (fijo) ya.isFixedSupport = true; return ya.id; }
    const id = `da_n_${stamp}_${++nN}`;
    nodes[id] = { id, x, y, z, isFixedSupport: fijo, nodeLabel: `N-${nN}` };
    return id;
  };
  const barra = (a: string, b: string, rol: RolEstructuralSegmento, perfil: string) => {
    if (a === b || Object.values(segments).some(s => (s.nodeAId === a && s.nodeBId === b) || (s.nodeAId === b && s.nodeBId === a))) return;
    const id = `da_s_${stamp}_${++nS}`;
    segments[id] = { id, nodeAId: a, nodeBId: b, profileId: perfil, rolEstructural: rol };
  };

  // Paneles del tijeral: nudo en la punta del alero, en el eje de la columna, tramos
  // parejos hasta la cumbrera (nudo central) y el otro lado en espejo.
  const mitad = W / 2;
  const nIn = Math.max(2, Math.round((mitad - aW) / (p.panelM || 1.2)));
  const media = [...(aW > 0.05 ? [0] : []), ...Array.from({ length: nIn + 1 }, (_, i) => (aW > 0.05 ? aW : 0) + ((mitad - (aW > 0.05 ? aW : 0)) * i) / nIn)];
  const nMitad = media.length - 1;
  const xs = [...media, ...media.slice(0, -1).reverse().map(x => W - x)];
  const yTop = (x: number) => H + h * (1 - Math.abs(x - mitad) / mitad);
  const xCol = [aW, W - aW];
  // Columnas a lo largo, parejas entre los extremos interiores.
  const Lint = L - 2 * aL;
  const nVanos = Math.max(1, Math.round(Lint / Math.max(1, p.columnasCadaM)));
  const zCols = Array.from({ length: nVanos + 1 }, (_, i) => aL + (Lint * i) / nVanos);

  zCols.forEach(z => {
    // Tijeral triangular: cordón inferior plano a la altura de apoyo, superior a dos aguas.
    const inf = xs.map(x => nodo(x, H, z));
    const sup = xs.map((x, i) => (i === 0 || i === xs.length - 1) ? inf[i] : nodo(x, yTop(x), z));
    for (let i = 0; i < xs.length - 1; i++) {
      barra(inf[i], inf[i + 1], 'cordon_inferior', P.cordon);
      barra(sup[i], sup[i + 1], 'cordon_superior', P.cordon);
    }
    for (let i = 1; i < xs.length - 1; i++) barra(inf[i], sup[i], 'montante', P.montante);
    // Diagonales tipo Pratt: bajan del cordón superior hacia el centro (trabajan a tracción).
    // Donde el tijeral es poco alto (junto al apoyo) la diagonal queda muy echada y
    // recibe mucha fuerza: ahí va un tubo más grueso.
    const diag = (a: number, b: number) => {
      const A = nodes[sup[a]], B = nodes[inf[b]];
      const sen = Math.abs(A.y - B.y) / Math.hypot(A.x - B.x, A.y - B.y);
      barra(sup[a], inf[b], 'diagonal', sen < 0.25 ? (P.diagonalApoyo || P.diagonal) : P.diagonal);
    };
    for (let i = 0; i < xs.length - 1; i++) {
      if (i < nMitad) { if (i > 0) diag(i, i + 1); }
      else if (i + 1 < xs.length - 1) diag(i + 1, i);
    }
    // Columnas desde el piso hasta el cordón inferior (el nudo más cercano al eje de columna).
    xCol.forEach(xc => {
      const k = xs.reduce((m, x, i) => Math.abs(x - xc) < Math.abs(xs[m] - xc) ? i : m, 0);
      const cab = Math.abs(xs[k] - xc) < 0.02 ? inf[k] : nodo(xc, H, z);
      if (cab !== inf[k]) { // partir el cordón inferior en el eje de la columna
        const j = xs[k] < xc ? k : k - 1;
        const sg = Object.values(segments).find(s => (s.nodeAId === inf[j] && s.nodeBId === inf[j + 1]) || (s.nodeAId === inf[j + 1] && s.nodeBId === inf[j]));
        if (sg) { delete segments[sg.id]; barra(inf[j], cab, 'cordon_inferior', P.cordon); barra(cab, inf[j + 1], 'cordon_inferior', P.cordon); }
      }
      barra(nodo(xc, 0, z, true), cab, 'columna', P.columna);
    });
  });

  // Viga collar (puntal) a lo largo en la cabeza de las columnas: amarra los pórticos, no carga techo.
  xCol.forEach(xc => { for (let i = 0; i < zCols.length - 1; i++) barra(nodo(xc, H, zCols[i]), nodo(xc, H, zCols[i + 1]), 'arriostre', P.collar); });
  // Correas a lo largo sobre cada nudo del cordón superior (y la cumbrera), con volado en los extremos.
  const zCorrea = [0, ...zCols, L].filter((z, i, a) => i === 0 || z - a[i - 1] > 0.02);
  for (let i = 1; i < xs.length - 1; i++) {
    const x = xs[i], y = yTop(x);
    for (let j = 0; j < zCorrea.length - 1; j++) barra(nodo(x, y, zCorrea[j]), nodo(x, y, zCorrea[j + 1]), 'correa', P.correa);
  }
  // Borde del alero a lo largo (canal / tapa) en las puntas del tijeral.
  [0, W].forEach(x => { for (let j = 0; j < zCorrea.length - 1; j++) barra(nodo(x, H, zCorrea[j]), nodo(x, H, zCorrea[j + 1]), 'correa', P.correa); });
  // Tensores en cruz en los paños extremos de cada agua (varilla).
  if (zCols.length > 2) {
    const k = Math.max(1, nMitad - 1);
    [[zCols[0], zCols[1]], [zCols[zCols.length - 2], zCols[zCols.length - 1]]].forEach(([z1, z2]) => {
      [[xs[1], xs[k + 1] ?? xs[nMitad]], [xs[2 * nMitad - 1], xs[2 * nMitad - 1 - k] ?? xs[nMitad]]].forEach(([xa, xb]) => {
        barra(nodo(xa, yTop(xa), z1), nodo(xb, yTop(xb), z2), 'tensor_viento', 'TEN-VAR-12');
        barra(nodo(xb, yTop(xb), z1), nodo(xa, yTop(xa), z2), 'tensor_viento', 'TEN-VAR-12');
      });
    });
  }
  // Cobertura: dos aguas, del alero a la cumbrera, en todo el largo acabado.
  const zones: Record<string, CoverageZone3D> = {};
  const pend = Math.round((h / mitad) * 100);
  if (p.coberturaId) {
    const cum = (z: number) => nodo(mitad, H + h, z);
    const eave = (x: number, z: number) => nodo(x, H, z);
    zones[`da_z1_${stamp}`] = { id: `da_z1_${stamp}`, nombre: 'Agua izquierda', nodeIdsBoundary: [eave(0, 0), cum(0), cum(L), eave(0, L)], coberturaMaterialId: p.coberturaId, pendientePorcentaje: pend, orientacionInclinacionDeg: 0 };
    zones[`da_z2_${stamp}`] = { id: `da_z2_${stamp}`, nombre: 'Agua derecha', nodeIdsBoundary: [cum(0), eave(W, 0), eave(W, L), cum(L)], coberturaMaterialId: p.coberturaId, pendientePorcentaje: pend, orientacionInclinacionDeg: 0 };
  }
  const sep = Lint / nVanos;
  const resumen = `dos aguas ${W.toFixed(2)} × ${L.toFixed(2)} m (a ejes ${(W - 2 * aW).toFixed(2)} × ${Lint.toFixed(2)}), ${zCols.length * 2} columnas cada ${sep.toFixed(2)} m, ${zCols.length} tijerales con cumbrera de ${h.toFixed(2)} m (${pend}%), alero ${aW.toFixed(2)} m.`;
  return { nodes, segments, zones, resumen };
}
