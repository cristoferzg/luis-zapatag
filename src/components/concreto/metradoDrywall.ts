// =============================================================================
// Metrado detallado de Drywall (tabiques y cielo raso) por piso.
//
// Usa lo dibujado en el plano compartido con Obra Civil (muros de drywall/OSB
// con su alto real bajo el techo de la estructura de Techos, sus vanos, y el
// cielo raso de cada piso) y los precios del Catálogo de precios.
//
// Cuantías referenciales de instalación (sistema estándar, parantes a 0.61 m):
//   tabique: parantes = L/0.61 + 1 (+2 jambas por vano), rieles = 2·L,
//            tornillo de placa ≈ 25 por m² de placa, de perfil ≈ 4 por parante,
//            fijación de riel cada 0.60 m, masilla ≈ 0.9 kg/m², cinta ≈ 1.5 m/m².
//   cielo:   viguetas/omegas cada 0.61 m, perfil primario cada 1.22 m,
//            colgador cada 1.2 m², ángulo perimetral = perímetro.
//   rendimiento: tabique 12 m²/día, cielo raso 15 m²/día por instalador.
// =============================================================================
import type { PlanoElem } from '../ConcretoPlanoCad';
import { EstructuraTechos, contextosObra } from './obraPisos';
import { perfilMuro, areaPerfil, areaAberturas, largoMuro, regionesCielo, mallaCielo, mallaCieloTanque, tanquesEnEstructura, CieloRaso } from './geometriaObra';
import { precio, claveDrywall, claveOsb, claveJornal, AREA_PLANCHA_M2, itemCatalogo } from '../../lib/catalogoPrecios';

export interface LineaDrywall { clave: string; nombre: string; unidad: string; cantidad: number; precio: number; subtotal: number; nota?: string }
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

const PIEZA_M = 3;
const linea = (clave: string, cantidad: number, nota?: string, nombreDef?: string, unidadDef?: string): LineaDrywall => {
  const it = itemCatalogo(clave);
  const p = precio(clave);
  return { clave, nombre: it?.nombre || nombreDef || clave, unidad: it?.unidad || unidadDef || 'und', cantidad, precio: p, subtotal: cantidad * p, nota };
};

export function metradoDrywall(niveles: string[], est: EstructuraTechos | null, elems: PlanoElem[], cielos: Record<string, CieloRaso>): MetradoDrywallPiso[] {
  const { pisos, ctx } = contextosObra(niveles, est);
  const tanques = tanquesEnEstructura(est);
  return pisos.map((n, k) => {
    const c = ctx(n);
    const muros = elems.filter(e => e.tipo === 'muro' && (e.nivel || pisos[0]) === n && e.x2 !== undefined && e.y2 !== undefined);
    const secos = muros.filter(m => m.material === 'drywall' || m.material === 'osb');
    // Placas por material
    const placas = new Map<string, number>(); // clave → m² de placa
    let tabiquesM2 = 0, placaTabiquesM2 = 0, parantes = 0, rielesM = 0, vanosPerimetro = 0, anchoMax = 0;
    secos.forEach(m => {
      const L = largoMuro(m);
      const pf = perfilMuro(m, c);
      const hMax = Math.max(...pf.map(p => p.h));
      const area = Math.max(0, areaPerfil(pf) - areaAberturas(m));
      const caras = m.caras || (m.material === 'osb' ? 1 : 2);
      tabiquesM2 += area; placaTabiquesM2 += area * caras;
      const k2 = m.material === 'osb' ? claveOsb(m.materialId || 'osb_11') : claveDrywall(m.materialId || 'drywall_standard_125');
      placas.set(k2, (placas.get(k2) || 0) + area * caras);
      const abs = m.aberturas || [];
      const nParantes = Math.ceil(L / 0.61) + 1 + abs.length * 2;
      parantes += nParantes * Math.max(1, Math.ceil(hMax / PIEZA_M));
      rielesM += 2 * L + abs.reduce((x, a) => x + a.w * (a.sill > 0 ? 2 : 1), 0);
      vanosPerimetro += abs.reduce((x, a) => x + 2 * a.h + a.w * (a.sill > 0 ? 2 : 1), 0);
      anchoMax = Math.max(anchoMax, m.a || 0);
    });
    // Cielo raso (del piso y, en el último piso, bajo el sobretecho de tanques)
    let cieloM2 = 0, cieloPerim = 0;
    const cfg = cielos[n];
    const claveCielo = cfg?.materialId ? claveDrywall(cfg.materialId) : claveDrywall('drywall_standard_125');
    if (cfg?.activo) { const mc = mallaCielo(regionesCielo(muros, est, c.base), cfg, c); cieloM2 += mc.area; cieloPerim += mc.perimetro; }
    if (k === pisos.length - 1) tanques.forEach(t => { if (cielos[`tanque:${t.id}`]?.activo && t.ySobretecho !== null) { const mc = mallaCieloTanque(t); cieloM2 += mc.area; cieloPerim += mc.perimetro; } });
    if (cieloM2 > 0) placas.set(claveCielo, (placas.get(claveCielo) || 0) + cieloM2);

    const lineas: LineaDrywall[] = [];
    placas.forEach((m2, clave) => lineas.push(linea(clave, Math.ceil((m2 * 1.05) / AREA_PLANCHA_M2), `${m2.toFixed(1)} m² + 5% desperdicio`)));
    if (secos.length) {
      const anchoParante = anchoMax >= 0.12 ? '89' : '64';
      lineas.push(linea(`dw:parante_${anchoParante}`, parantes, 'cada 0.61 m + jambas'));
      lineas.push(linea(`dw:riel_${anchoParante === '89' ? '90' : '65'}`, Math.ceil(rielesM / PIEZA_M), `${rielesM.toFixed(1)} m (arriba, abajo y dinteles)`));
      lineas.push(linea('dw:fijacion', Math.ceil(rielesM / 2 / 0.6 / 100), 'riel inferior cada 0.60 m'));
      lineas.push(linea('dw:tornillo_perfil', Math.ceil((parantes * 4) / 100), '4 por parante'));
      if (vanosPerimetro > 0) lineas.push(linea('dw:esquinero', Math.ceil(vanosPerimetro / PIEZA_M), 'bordes de puertas y ventanas'));
    }
    if (cieloM2 > 0) {
      lineas.push(linea('dw:omega', Math.ceil(cieloM2 / 0.61 / PIEZA_M), 'viguetas cada 0.61 m'));
      lineas.push(linea('dw:parante_64', Math.ceil(cieloM2 / 1.22 / PIEZA_M), 'perfil primario cada 1.22 m'));
      lineas.push(linea('dw:angulo', Math.ceil(cieloPerim / PIEZA_M), `${cieloPerim.toFixed(1)} m de perímetro`));
      lineas.push(linea('dw:colgador', Math.ceil(cieloM2 / 1.2), '1 cada 1.2 m²'));
    }
    const placaTotal = placaTabiquesM2 + cieloM2;
    if (placaTotal > 0) {
      lineas.push(linea('dw:tornillo_placa', Math.ceil((placaTotal * 25) / 100), '≈ 25 por m² de placa'));
      lineas.push(linea('dw:masilla', Math.ceil((placaTotal * 0.9) / 28), '≈ 0.9 kg/m², balde 28 kg'));
      lineas.push(linea('dw:cinta', Math.ceil((placaTotal * 1.5) / 75), '≈ 1.5 m/m², rollo 75 m'));
    }
    const materiales = lineas.reduce((x, l) => x + l.subtotal, 0);
    const dias = Math.round((tabiquesM2 / 12 + cieloM2 / 15) * 10) / 10;
    const jornal = precio(claveJornal('Instalador de drywall'));
    const manoObra = dias * jornal;
    return { nivel: n, tabiquesM2, placaTabiquesM2, cieloM2, lineas, materiales, dias, manoObra, total: materiales + manoObra };
  });
}
