// =============================================================================
// Importar un archivo JSON a CarpiMetal sin romper la app.
//
//  • Diseño exportado por CarpiMetal (tiene tipoElemento / piezas): se completa
//    con los valores por defecto que falten.
//  • Formato "inspector_cad" (schema innova_contratistas_manager.inspector_cad):
//    se arma el mueble con piezas reales (tablero, marcos, patas en X, travesaños).
//  • Cualquier otra cosa: se rechaza con un mensaje claro.
// =============================================================================
import type { HerreriaDesign, PiezaCad } from './herreriaTypes';
import { PERFILES_CATALOGO, asegurarCad, crearDisenoVacio } from './herreriaCatalog';

export type ResultadoImportacion = { ok: true; design: HerreriaDesign; avisos: string[] } | { ok: false; error: string };

const esDisenoCarpi = (j: any) => j && typeof j === 'object' && (typeof j.tipoElemento === 'string' || Array.isArray(j.piezas));

// Perfil del catálogo más parecido a unas medidas (mm).
function perfilParecido(anchoMm?: number, altoMm?: number, espesorMm?: number, familia?: string): string {
  const fam = (familia || '').toLowerCase();
  const cands = PERFILES_CATALOGO.filter(p => p.familia !== 'especial' && p.anchoMm > 0 && (!fam || !fam.includes('rect') || p.categoria === 'tubo_rectangular' || p.categoria === 'tubo_cuadrado'));
  let mejor = cands[0], d = Infinity;
  cands.forEach(p => {
    const dd = Math.abs((p.anchoMm || 0) - (anchoMm || 50)) + Math.abs((p.altoMm || 0) - (altoMm || 30)) + 10 * Math.abs((p.espesorMm || 0) - (espesorMm || 2));
    if (dd < d) { d = dd; mejor = p; }
  });
  return mejor?.id || 'rect-2x1-1.5';
}

function desdeInspectorCad(j: any): ResultadoImportacion {
  const o = j.object || {};
  const avisos: string[] = [];
  const cm = (v: any, def: number) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) / 100 : def);
  const dims = o.overall_dimensions_cm || {};
  const W = cm(dims.width, 0.5), D = cm(dims.depth, 0.4);
  let H = cm(dims.height, 0.75);
  // Un taburete o silla no mide más de 1.2 m: si el archivo trae algo así, es una cota dudosa.
  if (/stool|chair|silla|taburete/i.test(`${o.type} ${o.name}`) && H > 1.2) {
    avisos.push(`La altura del archivo (${(H * 100).toFixed(0)} cm) no es razonable para un ${o.name || 'taburete'}: se usó 75 cm. Ajústala en el inspector.`);
    H = 0.75;
  }
  const mp = o.material_profile || {};
  const perfilId = perfilParecido(mp.width_mm, mp.height_mm, mp.wall_thickness_mm, mp.family);
  const piezas: PiezaCad[] = [];
  let n = 0;
  const ts = Date.now();
  const barra = (nombre: string, a: [number, number, number], b: [number, number, number], grupo: string, perfil = perfilId) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    piezas.push({ id: `imp-${ts}-${++n}`, marca: `P-${String(n).padStart(2, '0')}`, nombre, tipo: 'perfil', material: 'acero', perfilId: perfil,
      x1: a[0], y1: a[1], z1: a[2], x2: b[0], y2: b[1], z2: b[2], longitudM: L, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°', cantidad: 1, grupo } as PiezaCad);
  };
  const marco = (nombre: string, w: number, d: number, y: number, grupo: string) => {
    const x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
    barra(`${nombre} frente`, [x0, y, z0], [x1, y, z0], grupo);
    barra(`${nombre} fondo`, [x0, y, z1], [x1, y, z1], grupo);
    barra(`${nombre} izquierdo`, [x0, y, z0], [x0, y, z1], grupo);
    barra(`${nombre} derecho`, [x1, y, z0], [x1, y, z1], grupo);
  };
  const partes: any[] = Array.isArray(o.parts) ? o.parts : [];
  const tablero = partes.find(p => p.kind === 'panel');
  const espTablero = cm(tablero?.dimensions_cm?.thickness, 0.03);
  const ySup = H - espTablero;
  const sup = partes.find(p => p.kind === 'rectangular_frame' && /sup/i.test(`${p.id} ${p.name}`));
  const inf = partes.find(p => p.kind === 'rectangular_frame' && /inf|apoyo|base/i.test(`${p.id} ${p.name}`));
  const ws = cm(sup?.dimensions_cm?.width, W * 0.9), ds = cm(sup?.dimensions_cm?.depth, D * 0.9);
  const wi = cm(inf?.dimensions_cm?.width, W * 0.6), di = cm(inf?.dimensions_cm?.depth, D * 0.6);
  if (sup) marco('Marco superior', ws, ds, ySup, 'estructura');
  if (inf) marco('Marco inferior', wi, di, 0.02, 'estructura');
  if (partes.some(p => p.kind === 'crossed_diagonal_legs')) {
    // Patas en X: cada esquina de arriba baja a la esquina opuesta (en ancho) de abajo.
    const yI = inf ? 0.02 : 0;
    ([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).forEach(([sx, sz], i) => {
      barra(`Pata diagonal ${i + 1}`, [sx * ws / 2, ySup, sz * ds / 2], [-sx * wi / 2, yI, sz * di / 2], 'patas');
    });
  }
  const trav = partes.find(p => p.kind === 'crossbars');
  if (trav) {
    const yM = ySup / 2;
    // En el cruce de las patas (a media altura) van los travesaños, uno por cada lado.
    const wM = (ws + wi) / 4;
    barra('Travesaño frontal', [-wM, yM, -((ds + di) / 4)], [wM, yM, -((ds + di) / 4)], 'refuerzos');
    barra('Travesaño posterior', [-wM, yM, (ds + di) / 4], [wM, yM, (ds + di) / 4], 'refuerzos');
  }
  if (tablero) {
    piezas.push({ id: `imp-${ts}-${++n}`, marca: 'TB-01', nombre: tablero.name || 'Tablero de madera', tipo: 'plancha', material: 'especial', perfilId: 'plancha-madera',
      x1: -W / 2, y1: H - espTablero, z1: -D / 2, x2: W / 2, y2: H - espTablero, z2: D / 2, longitudM: W, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
      esPlancha: true, anchoPlanchaM: W, altoPlanchaM: D, espesorPlanchaMm: espTablero * 1000, subtipoPlancha: 'lisa', tipoRelleno: 'plancha',
      colorHex: '#a16207', cantidad: 1, grupo: 'asiento' } as PiezaCad);
  }
  if (!piezas.length) return { ok: false, error: 'El archivo no tiene piezas que se puedan dibujar.' };
  (o.dimension_notes || []).slice(0, 2).forEach((t: string) => avisos.push(t));

  const base = crearDisenoVacio(o.name || j.project?.name || 'Diseño importado');
  const design: HerreriaDesign = {
    ...base,
    descripcion: j.project?.description || base.descripcion,
    anchoM: W, altoM: H, perfilMarcoId: perfilId, perfilBastidorId: perfilId,
    piezas,
  };
  return { ok: true, design, avisos };
}

export function importarDisenoJson(json: any, nombreArchivo: string): ResultadoImportacion {
  try {
    if (json?.schema && /inspector_cad/i.test(String(json.schema))) return desdeInspectorCad(json);
    if (esDisenoCarpi(json)) {
      const base = crearDisenoVacio(nombreArchivo.replace(/\.json$/i, ''));
      // Completar lo que falte para que nada se rompa al dibujar o cotizar.
      const d = asegurarCad({ ...base, ...json, manoDeObra: { ...base.manoDeObra, ...(json.manoDeObra || {}) }, acabado: { ...base.acabado, ...(json.acabado || {}) } });
      if (!d.nombre) d.nombre = base.nombre;
      return { ok: true, design: d, avisos: [] };
    }
    return { ok: false, error: 'Este archivo JSON no es un diseño de Carpintería Metálica. Exporta el diseño desde Carpintería Metálica (botón Exportar) o usa un archivo DXF.' };
  } catch (e: any) {
    return { ok: false, error: `No se pudo leer el archivo: ${e?.message || 'formato desconocido'}` };
  }
}
