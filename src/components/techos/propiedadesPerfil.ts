// Propiedades de sección de un perfil del catálogo (calculadas con sus medidas)
// y selección del perfil más liviano que cumple la esbeltez de la E.090.
import type { PerfilTubularItem, RolEstructuralSegmento } from './techosCadEngineTypes';

export interface PropsSeccion { areaCm2: number; iMinCm4: number; rMinCm: number }

export function propsPerfil(p: PerfilTubularItem | undefined): PropsSeccion | null {
  if (!p || !(p.anchoMm > 0) || !(p.espesorMm > 0)) return null;
  const b = p.anchoMm / 10, h = (p.altoMm || p.anchoMm) / 10, t = p.espesorMm / 10; // cm
  let A: number, I: number;
  if (p.categoria === 'tubo_redondo' || p.categoria === 'barra_redonda') {
    const D = b, d = p.categoria === 'barra_redonda' ? 0 : Math.max(0, D - 2 * t);
    A = (Math.PI / 4) * (D * D - d * d);
    I = (Math.PI / 64) * (D ** 4 - d ** 4);
  } else {
    // Sección cajón (tubos). Para C, Z, H y ángulos es una aproximación conservadora.
    const bi = Math.max(0, b - 2 * t), hi = Math.max(0, h - 2 * t);
    A = b * h - bi * hi;
    const Ix = (b * h ** 3 - bi * hi ** 3) / 12, Iy = (h * b ** 3 - hi * bi ** 3) / 12;
    I = Math.min(Ix, Iy);
    if (p.categoria === 'perfil_c' || p.categoria === 'perfil_z' || p.categoria === 'angulo_estructural') I *= 0.35;
  }
  if (!(A > 0) || !(I > 0)) return null;
  return { areaCm2: A, iMinCm4: I, rMinCm: Math.sqrt(I / A) };
}

const SIN_ANALISIS: RolEstructuralSegmento[] = ['columna_concreto', 'tensor_viento', 'piso_deck'];
const SECUNDARIOS: RolEstructuralSegmento[] = ['correa', 'arriostre'];

export const factorK = (rol: RolEstructuralSegmento) => (rol === 'columna' ? 1.0 : 0.8);
/** Límites de esbeltez (λ): hasta "bajo" no hay riesgo; hasta "maximo" se acepta con cuidado. */
export const limitesLambda = (rol: RolEstructuralSegmento) => (SECUNDARIOS.includes(rol) ? { bajo: 200, maximo: 300 } : { bajo: 120, maximo: 200 });
export const seAnaliza = (rol: RolEstructuralSegmento) => !SIN_ANALISIS.includes(rol);

/** Perfil más liviano de la misma familia con λ ≤ límite "bajo" para el tramo más largo. */
export function perfilRecomendado(catalogo: PerfilTubularItem[], actual: PerfilTubularItem | undefined, rol: RolEstructuralSegmento, longitudMaxM: number): PerfilTubularItem | null {
  const fam = actual?.categoria === 'perfil_c' || actual?.categoria === 'perfil_z' ? [actual.categoria] : ['tubo_cuadrado', 'tubo_rectangular'];
  const galv = !!actual?.id?.includes('galv');
  const KL = factorK(rol) * longitudMaxM * 100; // cm
  const ok = catalogo
    .filter(p => fam.includes(p.categoria) && p.id.includes('galv') === galv)
    .map(p => ({ p, pr: propsPerfil(p) }))
    .filter(x => x.pr && KL / x.pr.rMinCm <= limitesLambda(rol).bajo)
    .sort((a, b) => a.p.pesoLinealKgM - b.p.pesoLinealKgM);
  return ok[0]?.p || null;
}
