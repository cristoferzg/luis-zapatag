// =============================================================================
// Optimizador de cortes para tableros de melamina / HDF.
//
// Acomoda rectángulos (piezas ya expandidas por cantidad) en tableros iguales con
// el método MaxRects, regla "mejor lado corto" (best short side fit):
//   · refile: se descuenta en cada borde del tablero (los cantos de fábrica no sirven);
//   · sierra: cada pieza ocupa su medida + el ancho del disco;
//   · giro: la pieza puede girarse 90° salvo que se pida respetar la veta
//     (entonces el largo de la pieza va siempre a lo largo del tablero).
// Determinista: mismas piezas → mismo resultado. Las piezas más grandes que el
// tablero se devuelven aparte (nunca se pierden en silencio).
// =============================================================================

export interface PiezaCorte { id: string; nombre: string; mueble: string; largo: number; ancho: number } // mm
export interface PiezaColocada { id: string; nombre: string; mueble: string; x: number; y: number; w: number; h: number; rotada: boolean }
export interface TableroCortado { piezas: PiezaColocada[]; usoPct: number }
export interface ResultadoOptimizador { tableros: TableroCortado[]; sobredimensionadas: PiezaCorte[] }
export interface OpcionesOptimizador { largo?: number; ancho?: number; sierra?: number; refile?: number; respetarVeta?: boolean }

interface Rect { x: number; y: number; w: number; h: number }
interface Bin { libres: Rect[]; piezas: PiezaColocada[]; area: number }

export function optimizar(piezas: PiezaCorte[], op: OpcionesOptimizador = {}): ResultadoOptimizador {
  const L = op.largo ?? 2440, A = op.ancho ?? 2150, k = op.sierra ?? 4, r = op.refile ?? 10;
  // Zona útil: se suma un ancho de disco porque la última pieza no necesita corte al borde.
  const UW = L - 2 * r + k, UH = A - 2 * r + k;
  const sobredimensionadas: PiezaCorte[] = [];
  const cabe = (w: number, h: number) => w + k <= UW && h + k <= UH;
  // Más grandes primero (por área, luego lado mayor, luego id): resultado estable.
  const orden = [...piezas].filter(p => p.largo > 0 && p.ancho > 0).sort((a, b) =>
    (b.largo * b.ancho - a.largo * a.ancho) || (Math.max(b.largo, b.ancho) - Math.max(a.largo, a.ancho)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const bins: Bin[] = [];
  const nuevoBin = (): Bin => ({ libres: [{ x: 0, y: 0, w: UW, h: UH }], piezas: [], area: 0 });

  for (const p of orden) {
    const opciones: { w: number; h: number; rot: boolean }[] = [{ w: p.largo, h: p.ancho, rot: false }];
    if (!op.respetarVeta && p.largo !== p.ancho) opciones.push({ w: p.ancho, h: p.largo, rot: true });
    if (!opciones.some(o => cabe(o.w, o.h))) { sobredimensionadas.push(p); continue; }
    let mejor: { bin: number; rect: Rect; rot: boolean; s1: number; s2: number } | null = null;
    const probar = (bi: number, bin: Bin) => {
      for (const f of bin.libres) for (const o of opciones) {
        const w = o.w + k, h = o.h + k;
        if (w > f.w || h > f.h) continue;
        const s1 = Math.min(f.w - w, f.h - h), s2 = Math.max(f.w - w, f.h - h);
        if (!mejor || s1 < mejor.s1 || (s1 === mejor.s1 && s2 < mejor.s2)) mejor = { bin: bi, rect: { x: f.x, y: f.y, w, h }, rot: o.rot, s1, s2 };
      }
    };
    // Primero en el tablero abierto donde mejor calce; si no entra en ninguno, tablero nuevo.
    bins.forEach((b, i) => probar(i, b));
    if (!mejor) { bins.push(nuevoBin()); probar(bins.length - 1, bins[bins.length - 1]); }
    const m = mejor as { bin: number; rect: Rect; rot: boolean } | null;
    if (!m) { sobredimensionadas.push(p); continue; }
    const bin = bins[m.bin];
    colocar(bin, m.rect);
    const w = m.rot ? p.ancho : p.largo, h = m.rot ? p.largo : p.ancho;
    bin.piezas.push({ id: p.id, nombre: p.nombre, mueble: p.mueble, x: m.rect.x + r, y: m.rect.y + r, w, h, rotada: m.rot });
    bin.area += w * h;
  }
  return {
    tableros: bins.map(b => ({ piezas: b.piezas, usoPct: Math.round((b.area / (L * A)) * 1000) / 10 })),
    sobredimensionadas,
  };
}

// Parte cada espacio libre que toca la pieza y quita los que quedan dentro de otros.
function colocar(bin: Bin, u: Rect) {
  const nuevos: Rect[] = [];
  for (const f of bin.libres) {
    if (u.x >= f.x + f.w || u.x + u.w <= f.x || u.y >= f.y + f.h || u.y + u.h <= f.y) { nuevos.push(f); continue; }
    if (u.x > f.x) nuevos.push({ x: f.x, y: f.y, w: u.x - f.x, h: f.h });
    if (u.x + u.w < f.x + f.w) nuevos.push({ x: u.x + u.w, y: f.y, w: f.x + f.w - (u.x + u.w), h: f.h });
    if (u.y > f.y) nuevos.push({ x: f.x, y: f.y, w: f.w, h: u.y - f.y });
    if (u.y + u.h < f.y + f.h) nuevos.push({ x: f.x, y: u.y + u.h, w: f.w, h: f.y + f.h - (u.y + u.h) });
  }
  const dentro = (a: Rect, b: Rect) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
  bin.libres = nuevos.filter((a, i) => a.w > 0 && a.h > 0 && !nuevos.some((b, j) => j !== i && dentro(a, b) && (!dentro(b, a) || j < i)));
}
