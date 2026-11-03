// "Viga simple (sin tijeral)": convierte la nave que arma el Asistente en pórticos de una
// sola viga de tubo rectangular. Se quitan cordón inferior, montantes y diagonales; se
// quitan también los arriostres que quedaban colgados del cordón inferior; el cordón
// superior pasa a ser la viga principal con el perfil elegido.
import type { Node3D, Segment3D } from './techosCadEngineTypes';

const DEL_TIJERAL = new Set(['cordon_inferior', 'montante', 'diagonal']);

export function aVigaSimple(nodes: Record<string, Node3D>, segs: Record<string, Segment3D>, perfilId: string) {
  const sinTijeral = Object.values(segs).filter(sg => !DEL_TIJERAL.has(String(sg.rolEstructural)));
  const usados = new Set<string>();
  sinTijeral.filter(sg => sg.rolEstructural !== 'arriostre').forEach(sg => { usados.add(sg.nodeAId); usados.add(sg.nodeBId); });
  const nuevosSegs: Record<string, Segment3D> = {};
  for (const sg of sinTijeral) {
    if (sg.rolEstructural === 'arriostre' && !(usados.has(sg.nodeAId) && usados.has(sg.nodeBId))) continue;
    nuevosSegs[sg.id] = sg.rolEstructural === 'cordon_superior' ? { ...sg, profileId: perfilId, rolEstructural: 'viga_principal' } : sg;
  }
  const enUso = new Set<string>();
  Object.values(nuevosSegs).forEach(sg => { enUso.add(sg.nodeAId); enUso.add(sg.nodeBId); });
  const nuevosNodos: Record<string, Node3D> = {};
  for (const [id, n] of Object.entries(nodes)) if (enUso.has(id)) nuevosNodos[id] = n;
  return { nodes: nuevosNodos, segs: nuevosSegs };
}

/** Perfil rectangular sugerido según el tramo que cubre cada viga (m). */
export function perfilVigaSugerido(tramoM: number): string {
  if (tramoM <= 3) return 'perfil_rec_80x40_20';
  if (tramoM <= 4.5) return 'perfil_rec_100x50_20';
  if (tramoM <= 6) return 'perfil_rec_4x2_30';
  if (tramoM <= 8) return 'perfil_rec_6x2_30';
  return 'perfil_rec_6x4_45';
}
export const PERFILES_VIGA_SIMPLE = ['perfil_rec_80x40_20', 'perfil_rec_100x50_20', 'perfil_rec_100x50_30', 'perfil_rec_4x2_20', 'perfil_rec_4x2_30', 'perfil_rec_6x2_20', 'perfil_rec_6x2_30', 'perfil_rec_6x4_30', 'perfil_rec_6x4_45', 'perfil_rec_8x4_45'];
