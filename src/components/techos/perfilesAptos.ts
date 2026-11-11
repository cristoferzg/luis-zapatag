// Perfiles APTOS que el Asistente pone solo, según el tamaño del techo (luz, altura de
// columnas y separación entre pórticos). Antes todo salía en tubo de 3 × 3 cm y había que
// cambiar pieza por pieza; ahora sale con medidas de taller habituales en Perú y el usuario
// las ve en el 3D tal como se van a fabricar (la vista normal y la del cliente coinciden).
// Es un predimensionamiento práctico: el Análisis estructural (E.090) sigue verificándolo.
import type { Node3D, Segment3D } from './techosCadEngineTypes';
import { INVENTARIO_PERFILES_TUBULARES } from './techosCadCatalog';

export interface PerfilesAptos { columna: string; cordon: string; alma: string; correa: string; viga: string; arriostre: string }

/** Tabla de predimensionamiento (luz y separación en m, altura de columna en m). */
export function perfilesAptos(luzM: number, alturaM: number, sepM: number): PerfilesAptos {
  const L = Math.max(1, luzM), H = Math.max(1, alturaM), S = Math.max(1, sepM);
  // Columna: manda la altura (pandeo) y el tamaño del techo que carga.
  const columna = L <= 6 && H <= 3.5 ? 'perfil_sq_3x3_25'
    : L <= 10 && H <= 5 ? 'perfil_sq_4x4_25'
    : L <= 15 && H <= 6.5 ? 'perfil_sq_4x4_32'
    : L <= 20 && H <= 8 ? 'perfil_sq_5x5_45'
    : 'perfil_sq_6x6_45';
  // Cordones del tijeral (arriba y abajo).
  const cordon = L <= 6 ? 'perfil_rec_2x1_15'
    : L <= 10 ? 'perfil_sq_2x2_20'
    : L <= 15 ? 'perfil_rec_3x2_25'
    : L <= 20 ? 'perfil_rec_4x2_25'
    : 'perfil_rec_6x2_25';
  // Montantes y diagonales (el "alma" del tijeral): más delgados que los cordones.
  const alma = L <= 10 ? 'perfil_sq_1x1_15' : L <= 15 ? 'perfil_sq_15x15_15' : 'perfil_sq_2x2_20';
  // Correas: mandan la distancia entre pórticos (lo que cada correa salva).
  const correa = S <= 4 ? 'perfil_rec_2x1_15' : S <= 5 ? 'perfil_rec_3x15_20' : S <= 6.5 ? 'perfil_c_4x2_15' : 'perfil_c_6x2_20';
  // Viga sin tijeral (marquesina, pérgola, vigas de amarre): según su tramo.
  const viga = L <= 4 ? 'perfil_rec_80x40_20' : L <= 6 ? 'perfil_rec_100x50_25' : L <= 8 ? 'perfil_rec_4x2_30' : 'perfil_rec_6x2_30';
  const arriostre = 'perfil_round_34_15';
  const existe = (id: string, resp: string) => (INVENTARIO_PERFILES_TUBULARES.some(p => p.id === id) ? id : resp);
  return {
    columna: existe(columna, 'perfil_sq_4x4_25'), cordon: existe(cordon, 'perfil_sq_2x2_20'), alma: existe(alma, 'perfil_sq_1x1_15'),
    correa: existe(correa, 'perfil_rec_2x1_15'), viga: existe(viga, 'perfil_rec_4x2_25'), arriostre: existe(arriostre, 'perfil_sq_1x1_15'),
  };
}

/** Los perfiles "de relleno" que ponían los generadores (los 5 primeros del catálogo, 3 × 3 cm). */
const RELLENO = new Set(INVENTARIO_PERFILES_TUBULARES.slice(0, 5).map(p => p.id));

/** Medidas del techo armado: luz (ancho), altura de columnas y separación entre pórticos. */
export function medidasTecho(nodes: Record<string, Node3D>, segs: Record<string, Segment3D>) {
  const ns = Object.values(nodes);
  const xs = ns.map(n => n.x), luz = xs.length ? Math.max(...xs) - Math.min(...xs) : 6;
  let altura = 0;
  const zs = new Set<number>();
  Object.values(segs).forEach(s => {
    if (s.rolEstructural !== 'columna') return;
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
    if (!a || !b) return;
    altura = Math.max(altura, Math.abs(a.y - b.y));
    zs.add(Math.round((a.z || 0) * 100) / 100);
  });
  const zz = [...zs].sort((p, q) => p - q);
  const pasos = zz.slice(1).map((z, i) => z - zz[i]).filter(d => d > 0.3).sort((p, q) => p - q);
  const sep = pasos.length ? pasos[Math.floor(pasos.length / 2)] : 4;
  return { luz, altura: altura || 4, sep };
}

/**
 * Cambia SOLO los perfiles de relleno por los aptos según su función. Lo que el usuario
 * eligió a propósito (otro perfil, viga simple, tensores, tanques) se respeta.
 */
export function aplicarPerfilesAptos(nodes: Record<string, Node3D>, segs: Record<string, Segment3D>): { segs: Record<string, Segment3D>; cambios: number } {
  const { luz, altura, sep } = medidasTecho(nodes, segs);
  const p = perfilesAptos(luz, altura, sep);
  const porRol: Record<string, string> = {
    columna: p.columna, cordon_superior: p.cordon, cordon_inferior: p.cordon, montante: p.alma, diagonal: p.alma,
    correa: p.correa, viga_principal: p.viga, viga_secundaria: p.correa, arriostre: p.arriostre,
  };
  let cambios = 0;
  const out: Record<string, Segment3D> = {};
  for (const [id, s] of Object.entries(segs)) {
    const nuevo = porRol[s.rolEstructural || ''];
    // En un tijeral la viga principal hace de cordón (no de viga sola).
    const elegido = s.rolEstructural === 'viga_principal' && (s as any).tijeral ? p.cordon : nuevo;
    if (elegido && s.profileId && RELLENO.has(s.profileId) && !/^tq[0-9a-z]+_/.test(id)) { out[id] = { ...s, profileId: elegido }; cambios++; }
    else out[id] = s;
  }
  return { segs: out, cambios };
}
