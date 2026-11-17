// =============================================================================
// Metrado de Drywall por piso a partir del plano compartido con Obra Civil
// (muros de drywall/OSB con su alto real bajo el techo de la estructura de
// Techos, sus vanos, y el cielo raso de cada piso). Usa el mismo motor que el
// Cotizador de Drywall (drywall/calculoDrywall) y el Catálogo de precios.
// =============================================================================
import type { PlanoElem } from '../ConcretoPlanoCad';
import { EstructuraTechos, contextosObra } from './obraPisos';
import { perfilMuro, areaPerfil, areaAberturas, largoMuro, regionesCielo, mallaCielo, mallaCieloTanque, tanquesEnEstructura, CieloRaso } from './geometriaObra';
import { claveOsb } from '../../lib/catalogoPrecios';
import { acumuladoVacio, agregarTabique, agregarCielo, lineasDe, LineaDrywall } from '../drywall/calculoDrywall';

export type { LineaDrywall };
export interface MetradoDrywallPiso {
  nivel: string;
  tabiquesM2: number;       // área de muro (sin vanos)
  placaTabiquesM2: number;  // área de placa (× caras)
  cieloM2: number;
  lineas: LineaDrywall[];
  materiales: number;
  dias: number;             // días-instalador
  manoObra: number;
  total: number;
}

export function metradoDrywall(niveles: string[], est: EstructuraTechos | null, elems: PlanoElem[], cielos: Record<string, CieloRaso>): MetradoDrywallPiso[] {
  const { pisos, ctx } = contextosObra(niveles, est);
  const tanques = tanquesEnEstructura(est);
  return pisos.map((n, k) => {
    const c = ctx(n);
    const muros = elems.filter(e => e.tipo === 'muro' && (e.nivel || pisos[0]) === n && e.x2 !== undefined && e.y2 !== undefined);
    const secos = muros.filter(m => m.material === 'drywall' || m.material === 'osb');
    const a = acumuladoVacio();
    let placaTabiquesM2 = 0;
    secos.forEach(m => {
      const pf = perfilMuro(m, c);
      const area = Math.max(0, areaPerfil(pf) - areaAberturas(m));
      const caras = m.caras || (m.material === 'osb' ? 1 : 2);
      placaTabiquesM2 += area * caras;
      const id = m.material === 'osb' ? (m.materialId || 'osb_11') : (m.materialId || 'drywall_standard_125');
      agregarTabique(a, {
        L: largoMuro(m), areaNeta: area, hMax: Math.max(...pf.map(p => p.h)), placas: Array(caras).fill(id),
        vanos: (m.aberturas || []).map(ab => ({ w: ab.w, h: ab.h, sill: ab.sill })), parante: (m.a || 0) >= 0.12 ? '89' : '64',
      });
      // El OSB va con su propia clave del catálogo (no la de drywall).
      if (m.material === 'osb') { const k2 = `drywall:${id}`; const v = a.placaM2.get(k2) || 0; a.placaM2.delete(k2); a.placaM2.set(claveOsb(id), (a.placaM2.get(claveOsb(id)) || 0) + v); }
    });
    // Cielo raso (del piso y, en el último piso, bajo el sobretecho de tanques)
    const cfg = cielos[n];
    const placaCielo = cfg?.materialId || 'drywall_standard_125';
    if (cfg?.activo) { const mc = mallaCielo(regionesCielo(muros, est, c.base), cfg, c); if (mc.area > 0) agregarCielo(a, mc.area, mc.perimetro, placaCielo); }
    if (k === pisos.length - 1) tanques.forEach(t => {
      const ct = cielos[`tanque:${t.id}`];
      if (ct?.activo && t.ySobretecho !== null) { const mc = mallaCieloTanque(t); agregarCielo(a, mc.area, mc.perimetro, ct.materialId || placaCielo); }
    });
    const r = lineasDe(a);
    return { nivel: n, tabiquesM2: a.tabiqueM2, placaTabiquesM2, cieloM2: a.cieloM2, ...r };
  });
}
