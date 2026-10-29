// Propiedades de sección de un perfil del catálogo (calculadas con sus medidas)
// y selección del perfil más liviano que cumple la esbeltez de la E.090.
import type { PerfilTubularItem, RolEstructuralSegmento } from './techosCadEngineTypes';

export interface PropsSeccion { areaCm2: number; iMinCm4: number; rMinCm: number; iMaxCm4: number }

export function propsPerfil(p: PerfilTubularItem | undefined): PropsSeccion | null {
  if (!p || !(p.anchoMm > 0) || !(p.espesorMm > 0)) return null;
  const b = p.anchoMm / 10, h = (p.altoMm || p.anchoMm) / 10, t = p.espesorMm / 10; // cm
  let A: number, I: number, Imax = 0;
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
    Imax = Math.max(Ix, Iy);
    if (p.categoria === 'perfil_c' || p.categoria === 'perfil_z' || p.categoria === 'angulo_estructural') { I *= 0.35; Imax *= 0.6; }
  }
  if (!(A > 0) || !(I > 0)) return null;
  return { areaCm2: A, iMinCm4: I, rMinCm: Math.sqrt(I / A), iMaxCm4: Imax || I };
}

const SIN_ANALISIS: RolEstructuralSegmento[] = ['columna_concreto', 'tensor_viento', 'piso_deck'];
const SECUNDARIOS: RolEstructuralSegmento[] = ['correa', 'arriostre'];

export const factorK = (rol: RolEstructuralSegmento) => (rol === 'columna' ? 1.0 : 0.8);
/** Límites de esbeltez (λ): hasta "bajo" no hay riesgo; hasta "maximo" se acepta con cuidado. */
export const limitesLambda = (rol: RolEstructuralSegmento) => (SECUNDARIOS.includes(rol) ? { bajo: 200, maximo: 300 } : { bajo: 120, maximo: 200 });
export const seAnaliza = (rol: RolEstructuralSegmento) => !SIN_ANALISIS.includes(rol);

/** Perfil más liviano de la misma familia con λ ≤ límite "bajo" para el tramo más largo. */
export function perfilRecomendado(catalogo: PerfilTubularItem[], actual: PerfilTubularItem | undefined, rol: RolEstructuralSegmento, longitudMaxM: number, cargas?: CargasGrupo): PerfilTubularItem | null {
  const fam = actual?.categoria === 'perfil_c' || actual?.categoria === 'perfil_z' ? [actual.categoria] : ['tubo_cuadrado', 'tubo_rectangular'];
  const galv = !!actual?.id?.includes('galv');
  const ok = catalogo
    .filter(p => fam.includes(p.categoria) && p.id.includes('galv') === galv)
    .filter(p => cumpleTramo(p, rol, longitudMaxM, cargas))
    .sort((a, b) => a.pesoLinealKgM - b.pesoLinealKgM);
  return ok[0] || null;
}

/** Cargas de servicio de un grupo de elementos (para el perfil más económico). */
export interface CargasGrupo {
  PkN?: number;   // columnas: carga axial por columna (kN)
  qNm?: number;   // vigas y correas: carga repartida sobre el tramo (N/m)
}
const E_ACERO = 200e9; // Pa

/**
 * ¿El perfil cumple para este tramo? Además de la esbeltez máxima de la E.090
 * (λ ≤ 200 en columnas y vigas, ≤ 300 en correas y arriostres):
 *  • columnas: la carga crítica de Euler con factor de seguridad 3 ≥ la carga axial;
 *  • vigas y correas: flecha 5qL⁴/384EI ≤ L/240 (correas L/180), con el lado alto vertical.
 * Sin cargas se usa la regla conservadora de antes (λ ≤ límite "bajo").
 */
export function cumpleTramo(p: PerfilTubularItem, rol: RolEstructuralSegmento, L: number, cargas?: CargasGrupo): boolean {
  const pr = propsPerfil(p);
  if (!pr) return false;
  const lambda = (factorK(rol) * L * 100) / pr.rMinCm;
  if (!cargas) return lambda <= limitesLambda(rol).bajo;
  // Mínimos de obra (para soldar bien): columnas 2.0 mm y 50 mm por lado; vigas 1.5 mm; correas y arriostres 1.2 mm.
  const ladoMin = Math.min(p.anchoMm, p.altoMm || p.anchoMm);
  if (rol === 'columna' && (p.espesorMm < 2.0 || ladoMin < 50)) return false;
  if (!SECUNDARIOS.includes(rol) && rol !== 'columna' && p.espesorMm < 1.5) return false;
  if (lambda > limitesLambda(rol).maximo) return false;
  if (rol === 'columna') {
    const Pcr = (Math.PI ** 2 * E_ACERO * pr.iMinCm4 * 1e-8) / Math.pow(factorK(rol) * Math.max(L, 0.01), 2) / 1000; // kN
    return Pcr / 3 >= (cargas.PkN || 0);
  }
  if (cargas.qNm) {
    const flecha = (5 * cargas.qNm * L ** 4) / (384 * E_ACERO * pr.iMaxCm4 * 1e-8);
    return flecha <= L / (SECUNDARIOS.includes(rol) ? 180 : 240);
  }
  return true;
}

/**
 * Perfil MÁS ECONÓMICO (precio por metro del Catálogo de precios) de la misma
 * familia que cumple el tramo más largo (ver cumpleTramo). Con cargas puede
 * elegir tubos menores (60x40, 50x40, 3"x3"…) cuando de verdad alcanzan.
 */
export function perfilMasEconomico(catalogo: PerfilTubularItem[], actual: PerfilTubularItem | undefined, rol: RolEstructuralSegmento, longitudMaxM: number, precioM: (p: PerfilTubularItem) => number, cargas?: CargasGrupo): PerfilTubularItem | null {
  const fam = actual?.categoria === 'perfil_c' || actual?.categoria === 'perfil_z' ? [actual.categoria] : ['tubo_cuadrado', 'tubo_rectangular'];
  const galv = !!actual?.id?.includes('galv');
  const ok = catalogo
    .filter(p => fam.includes(p.categoria) && p.id.includes('galv') === galv)
    .map(p => ({ p, $: precioM(p) }))
    .filter(x => x.$ > 0 && cumpleTramo(x.p, rol, longitudMaxM, cargas))
    .sort((a, b) => a.$ - b.$ || a.p.pesoLinealKgM - b.p.pesoLinealKgM);
  return ok[0]?.p || null;
}
