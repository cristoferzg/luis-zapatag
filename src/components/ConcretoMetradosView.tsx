// =============================================================================
// Metrados de Concreto / Obra Civil
//
// Calculador de metrados para elementos de concreto armado: el usuario agrega
// elementos (zapata, columna, viga, losa, muro, cimiento, sobrecimiento), pone
// sus medidas y cantidades, y obtiene automáticamente:
//   - Volumen de concreto (m³)
//   - Acero de refuerzo estimado (kg)
//   - Encofrado (m²)
// más los materiales (cemento, arena, piedra, agua) y un costo referencial.
//
// Es data-driven: agregar un elemento nuevo es solo añadir una entrada a
// CATALOGO_ELEMENTOS. Autónomo (no depende del CAD de Techos).
// =============================================================================
import { useMemo, useState, useEffect } from 'react';
import { Box, Plus, Trash2, Calculator, Download } from 'lucide-react';
import { safeStorage } from '../lib/storageManager';
import { useCatalogo, fijarPrecio } from '../lib/catalogoPrecios';
import ConcretoElementoSVG from './ConcretoElementoSVG';
import ConcretoPlanoCad, { PlanoElem } from './ConcretoPlanoCad';
import { List, PenTool } from 'lucide-react';
import { DRYWALL_DEFAULTS, DrywallItem } from '../catalogo/drywall';
import { LADRILLO_DEFAULTS, LadrilloItem } from '../catalogo/ladrillo';
import { OsbItem } from '../catalogo/osb';
import { setActiveTechosDesignToLoad, getCachedTechosDesigns } from '../lib/techosDesignsRepo';
import { KEY_CIELOS, KEY_AMBIENTES, KEY_SOBREPECHOS, CieloRaso, Sobrepecho } from './concreto/geometriaObra';
import {
  SistemaNivel, TechoSnapshot, MuroCapa, calcSistema, sistemaVacio, muroDesdePlano,
  KEY_SISTEMAS_NIVEL, KEY_TECHOS_DISPONIBLES, KEY_CAT_DRYWALL, KEY_CAT_LADRILLO, KEY_CAT_OSB, leerCatalogoOsb,
  KEY_OBRA_TECHOS_ID, EstructuraTechos, contextosObra, obraPorPiso, ObraPiso,
  drywallConCatalogo, ladrilloConCatalogo, osbConCatalogo, preciosConcretoCatalogo,
} from './concreto/obraPisos';
import { SistemaPisoPanel } from './concreto/SistemaPisoPanel';
import { AdminCatalogosMateriales } from './concreto/AdminCatalogosMateriales';

interface CampoDef { key: string; label: string; def: number; }
interface ResultadoCalc { concretoM3: number; aceroKg: number; encofradoM2: number; nota?: string; }
interface ElementoDef {
  id: string;
  nombre: string;
  emoji: string;
  campos: CampoDef[];
  calc: (v: Record<string, number>) => ResultadoCalc;
  // Distribución referencial del acero por diámetro (fracciones que suman 1).
  aceroDist?: Record<string, number>;
}

// Peso lineal (kg/m) por diámetro de varilla de acero corrugado.
const DIAMETROS_KGM: Record<string, number> = {
  '1/4"': 0.25, '3/8"': 0.56, '1/2"': 0.99, '5/8"': 1.55, '3/4"': 2.24,
};
const LARGO_VARILLA_M = 9; // Barra comercial estándar

// Convierte kg de acero + distribución por diámetro en metros y # de varillas de 9 m.
function desgloseVarillas(aceroKg: number, dist?: Record<string, number>) {
  const out: Record<string, { kg: number; metros: number; varillas: number }> = {};
  if (!dist || aceroKg <= 0) return out;
  for (const [d, frac] of Object.entries(dist)) {
    const kg = aceroKg * frac;
    const metros = kg / (DIAMETROS_KGM[d] || 1);
    out[d] = { kg, metros, varillas: Math.ceil(metros / LARGO_VARILLA_M) };
  }
  return out;
}

// Cuantías de acero referenciales (kg por m³ de concreto) por tipo de elemento.
const CATALOGO_ELEMENTOS: ElementoDef[] = [
  {
    id: 'zapata', nombre: 'Zapata', emoji: '🟫',
    campos: [
      { key: 'a', label: 'Ancho (m)', def: 1.0 },
      { key: 'b', label: 'Largo (m)', def: 1.0 },
      { key: 'h', label: 'Altura (m)', def: 0.5 },
      { key: 'n', label: 'Cantidad', def: 1 },
    ],
    calc: v => {
      const vol = v.a * v.b * v.h * v.n;
      return { concretoM3: vol, aceroKg: vol * 55, encofradoM2: 2 * (v.a + v.b) * v.h * v.n };
    },
    aceroDist: { '1/2"': 1 },
  },
  {
    id: 'columna', nombre: 'Columna', emoji: '🔲',
    campos: [
      { key: 'a', label: 'Ancho sección (m)', def: 0.25 },
      { key: 'b', label: 'Alto sección (m)', def: 0.25 },
      { key: 'H', label: 'Altura (m)', def: 3.0 },
      { key: 'n', label: 'Cantidad', def: 1 },
    ],
    calc: v => {
      const vol = v.a * v.b * v.H * v.n;
      return { concretoM3: vol, aceroKg: vol * 120, encofradoM2: 2 * (v.a + v.b) * v.H * v.n };
    },
    aceroDist: { '1/2"': 0.70, '3/8"': 0.30 },
  },
  {
    id: 'viga', nombre: 'Viga', emoji: '📏',
    campos: [
      { key: 'a', label: 'Ancho (m)', def: 0.25 },
      { key: 'h', label: 'Peralte (m)', def: 0.40 },
      { key: 'L', label: 'Longitud (m)', def: 4.0 },
      { key: 'n', label: 'Cantidad', def: 1 },
    ],
    calc: v => {
      const vol = v.a * v.h * v.L * v.n;
      return { concretoM3: vol, aceroKg: vol * 110, encofradoM2: (2 * v.h + v.a) * v.L * v.n };
    },
    aceroDist: { '5/8"': 0.45, '1/2"': 0.25, '3/8"': 0.30 },
  },
  {
    id: 'losa', nombre: 'Losa aligerada', emoji: '🧱',
    campos: [
      { key: 'largo', label: 'Largo (m)', def: 4.0 },
      { key: 'ancho', label: 'Ancho (m)', def: 4.0 },
      { key: 'e', label: 'Espesor (m)', def: 0.20 },
      { key: 'n', label: 'Cantidad', def: 1 },
    ],
    calc: v => {
      const area = v.largo * v.ancho * v.n;
      // Aligerada: ~65% del volumen macizo (el resto son ladrillos de techo).
      const vol = area * v.e * 0.65;
      return {
        concretoM3: vol, aceroKg: vol * 85, encofradoM2: area,
        nota: `${Math.ceil(area * 8.33)} ladrillos de techo aprox.`,
      };
    },
    aceroDist: { '1/2"': 0.55, '3/8"': 0.25, '1/4"': 0.20 },
  },
  {
    id: 'muro', nombre: 'Muro / Placa', emoji: '🟥',
    campos: [
      { key: 'L', label: 'Longitud (m)', def: 3.0 },
      { key: 'H', label: 'Altura (m)', def: 2.5 },
      { key: 'e', label: 'Espesor (m)', def: 0.15 },
      { key: 'n', label: 'Cantidad', def: 1 },
    ],
    calc: v => {
      const vol = v.L * v.H * v.e * v.n;
      return { concretoM3: vol, aceroKg: vol * 80, encofradoM2: 2 * v.L * v.H * v.n };
    },
    aceroDist: { '3/8"': 0.65, '1/2"': 0.35 },
  },
  {
    id: 'cimiento', nombre: 'Cimiento corrido', emoji: '🟤',
    campos: [
      { key: 'L', label: 'Longitud (m)', def: 10.0 },
      { key: 'a', label: 'Ancho (m)', def: 0.50 },
      { key: 'h', label: 'Altura (m)', def: 0.60 },
    ],
    calc: v => {
      const vol = v.L * v.a * v.h;
      // Concreto ciclópeo: sin acero.
      return { concretoM3: vol, aceroKg: 0, encofradoM2: 0, nota: 'Ciclópeo (incluye 30% piedra grande)' };
    },
  },
  {
    id: 'sobrecimiento', nombre: 'Sobrecimiento', emoji: '🧱',
    campos: [
      { key: 'L', label: 'Longitud (m)', def: 10.0 },
      { key: 'a', label: 'Ancho (m)', def: 0.15 },
      { key: 'h', label: 'Altura (m)', def: 0.30 },
    ],
    calc: v => {
      const vol = v.L * v.a * v.h;
      return { concretoM3: vol, aceroKg: 0, encofradoM2: 2 * v.L * v.h, nota: 'Ciclópeo (25% piedra mediana)' };
    },
  },
];

interface Instancia { uid: string; tipoId: string; valores: Record<string, number>; nivel: string; }

const nuevaInstancia = (tipoId: string, nivel: string): Instancia => {
  const def = CATALOGO_ELEMENTOS.find(e => e.id === tipoId)!;
  const valores: Record<string, number> = {};
  def.campos.forEach(c => { valores[c.key] = c.def; });
  return { uid: `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, tipoId, valores, nivel };
};

const NIVELES_DEFAULT = ['Cimentación', 'Piso 1'];

// Precios unitarios referenciales por defecto (S/). Editables.
const PRECIOS_DEFAULT = { cementoBolsa: 28, arenaM3: 55, piedraM3: 60, aceroKg: 4.2, encofradoM2: 25 };

export default function ConcretoMetradosView({ onIrATechos }: { onIrATechos?: () => void } = {}) {
  const [niveles, setNiveles] = useState<string[]>(() =>
    safeStorage.getItem<string[]>('concreto_metrados_niveles', NIVELES_DEFAULT) || NIVELES_DEFAULT
  );
  const [nivelActivo, setNivelActivo] = useState<string>(() => {
    const ns = safeStorage.getItem<string[]>('concreto_metrados_niveles', NIVELES_DEFAULT) || NIVELES_DEFAULT;
    return ns[0] || 'Piso 1';
  });
  const [items, setItems] = useState<Instancia[]>(() => {
    const raw = safeStorage.getItem<Instancia[]>('concreto_metrados_items', []) || [];
    // Migración: elementos antiguos sin nivel → al primer nivel.
    const n0 = (safeStorage.getItem<string[]>('concreto_metrados_niveles', NIVELES_DEFAULT) || NIVELES_DEFAULT)[0] || 'Piso 1';
    return raw.map(i => ({ ...i, nivel: i.nivel || n0 }));
  });
  // Precios del Catálogo de precios único (cemento, arena, piedra, acero, encofrado).
  const catalogo = useCatalogo();
  const precios = useMemo(() => preciosConcretoCatalogo(), [catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  const CLAVE_PRECIO: Record<keyof typeof PRECIOS_DEFAULT, string> = { cementoBolsa: 'concreto:cemento', arenaM3: 'concreto:arena', piedraM3: 'concreto:piedra', aceroKg: 'concreto:acero', encofradoM2: 'concreto:encofrado' };
  const [showPrecios, setShowPrecios] = useState(false);
  // Modo de trabajo: lista (formulario) o plano CAD 2D.
  const [modo, setModo] = useState<'lista' | 'cad'>(() => (safeStorage.getItem<'lista' | 'cad'>('concreto_modo', 'lista') || 'lista'));
  useEffect(() => { safeStorage.setItem('concreto_modo', modo); }, [modo]);

  useEffect(() => { safeStorage.setItem('concreto_metrados_items', items); }, [items]);
  useEffect(() => { safeStorage.setItem('concreto_metrados_niveles', niveles); }, [niveles]);

  // Sistema de cada piso: muros (drywall/ladrillo), techos metálicos y tanque.
  const [sistemas, setSistemas] = useState<Record<string, SistemaNivel>>(() =>
    safeStorage.getItem<Record<string, SistemaNivel>>(KEY_SISTEMAS_NIVEL, {}) || {}
  );
  const [catDrywallBase, setCatDrywall] = useState<DrywallItem[]>(() =>
    safeStorage.getItem<DrywallItem[]>(KEY_CAT_DRYWALL, DRYWALL_DEFAULTS) || DRYWALL_DEFAULTS
  );
  const [catLadrilloBase, setCatLadrillo] = useState<LadrilloItem[]>(() =>
    safeStorage.getItem<LadrilloItem[]>(KEY_CAT_LADRILLO, LADRILLO_DEFAULTS) || LADRILLO_DEFAULTS
  );
  // Biblioteca de techos enviados desde el módulo Techos (solo lectura aquí).
  const [techosLib] = useState<TechoSnapshot[]>(() =>
    safeStorage.getItem<TechoSnapshot[]>(KEY_TECHOS_DISPONIBLES, []) || []
  );
  const [catOsbBase, setCatOsb] = useState<OsbItem[]>(leerCatalogoOsb);
  const catDrywall = useMemo(() => drywallConCatalogo(catDrywallBase), [catDrywallBase, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  const catLadrillo = useMemo(() => ladrilloConCatalogo(catLadrilloBase), [catLadrilloBase, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  const catOsb = useMemo(() => osbConCatalogo(catOsbBase), [catOsbBase, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  // Lo dibujado en el Plano CAD (muros, aberturas, ambientes, cielo raso) y la
  // estructura de Techos vinculada, por piso. Se relee al volver a Lista.
  const obraCad = useMemo(() => {
    const muros: Record<string, MuroCapa[]> = {};
    let resumen: Record<string, ObraPiso> = {};
    let nombreEst = '';
    if (modo !== 'lista') return { muros, resumen, nombreEst };
    const elems = safeStorage.getItem<PlanoElem[]>('concreto_plano_elems', []) || [];
    const techosId = safeStorage.getItem<string>(KEY_OBRA_TECHOS_ID, '') || '';
    const diseno = techosId ? getCachedTechosDesigns().find(d => d.id === techosId) : undefined;
    const est = (diseno as unknown as EstructuraTechos) || null;
    nombreEst = diseno?.nombre || '';
    const { ctx, pisos } = contextosObra(niveles, est);
    elems.filter(e => e.tipo === 'muro').forEach(e => {
      const n = e.nivel || pisos[0] || niveles[0];
      (muros[n] ||= []).push(muroDesdePlano(e, ctx(n)));
    });
    const cielos = safeStorage.getItem<Record<string, CieloRaso>>(KEY_CIELOS, {}) || {};
    const nombres = safeStorage.getItem<Record<string, string>>(KEY_AMBIENTES, {}) || {};
    const sobrepechos = safeStorage.getItem<Record<string, Sobrepecho>>(KEY_SOBREPECHOS, {}) || {};
    resumen = obraPorPiso(niveles, est, elems, cielos, nombres, catDrywall, catOsb, catLadrillo, sobrepechos);
    return { muros, resumen, nombreEst };
  }, [modo, niveles, catDrywall, catOsb, catLadrillo]); // eslint-disable-line react-hooks/exhaustive-deps
  const murosCad = obraCad.muros;
  useEffect(() => { safeStorage.setItem(KEY_SISTEMAS_NIVEL, sistemas); }, [sistemas]);
  useEffect(() => { safeStorage.setItem(KEY_CAT_DRYWALL, catDrywallBase); }, [catDrywallBase]);
  useEffect(() => { safeStorage.setItem(KEY_CAT_LADRILLO, catLadrilloBase); }, [catLadrilloBase]);
  useEffect(() => { safeStorage.setItem(KEY_CAT_OSB, catOsbBase); }, [catOsbBase]);

  const addItem = (tipoId: string) => setItems(prev => [...prev, nuevaInstancia(tipoId, nivelActivo)]);
  const removeItem = (uid: string) => setItems(prev => prev.filter(i => i.uid !== uid));

  const agregarNivel = () => {
    const base = 'Piso ' + (niveles.filter(n => /^Piso/i.test(n)).length + 1);
    let nombre = base, k = 1;
    while (niveles.includes(nombre)) { nombre = `${base} (${++k})`; }
    setNiveles(prev => [...prev, nombre]);
    setNivelActivo(nombre);
  };
  const eliminarNivel = (nombre: string) => {
    if (niveles.length <= 1) return;
    setItems(prev => prev.filter(i => i.nivel !== nombre));
    setSistemas(prev => { const { [nombre]: _omit, ...rest } = prev; return rest; });
    setNiveles(prev => {
      const next = prev.filter(n => n !== nombre);
      if (nivelActivo === nombre) setNivelActivo(next[0]);
      return next;
    });
  };
  const updateVal = (uid: string, key: string, val: number) =>
    setItems(prev => prev.map(i => i.uid === uid ? { ...i, valores: { ...i.valores, [key]: val } } : i));

  const totales = useMemo(() => {
    let concretoM3 = 0, aceroKg = 0, encofradoM2 = 0;
    const metrosPorDiam: Record<string, number> = {}; // acumula metros por diámetro
    const porItem = items.map(it => {
      const def = CATALOGO_ELEMENTOS.find(e => e.id === it.tipoId)!;
      const r = def.calc(it.valores);
      concretoM3 += r.concretoM3; aceroKg += r.aceroKg; encofradoM2 += r.encofradoM2;
      const varillas = desgloseVarillas(r.aceroKg, def.aceroDist);
      Object.entries(varillas).forEach(([d, info]) => {
        metrosPorDiam[d] = (metrosPorDiam[d] || 0) + info.metros;
      });
      return { it, def, r, varillas };
    });
    // Varillas totales de 9 m por diámetro (redondeo al final para no inflar).
    const varillasTotales = Object.entries(metrosPorDiam)
      .map(([d, metros]) => ({ d, metros, varillas: Math.ceil(metros / LARGO_VARILLA_M) }))
      .sort((a, b) => (DIAMETROS_KGM[b.d] || 0) - (DIAMETROS_KGM[a.d] || 0));
    // Agrupa por nivel/piso con subtotales de concreto y acero.
    const porNivel = niveles.map(nivel => {
      const its = porItem.filter(p => (p.it.nivel || niveles[0]) === nivel);
      const subConcreto = its.reduce((s, p) => s + p.r.concretoM3, 0);
      const subAcero = its.reduce((s, p) => s + p.r.aceroKg, 0);
      const sistema = calcSistema(sistemas[nivel], catDrywall, catLadrillo, techosLib, murosCad[nivel], catOsb);
      return { nivel, its, subConcreto, subAcero, sistema };
    });
    const costoSistemas = porNivel.reduce((s, n) => s + n.sistema.costo + (obraCad.resumen[n.nivel]?.costo || 0), 0);
    const cementoBolsas = concretoM3 * 9.5;
    const arenaM3 = concretoM3 * 0.54;
    const piedraM3 = concretoM3 * 0.55;
    const aguaL = concretoM3 * 180;
    const costo =
      Math.ceil(cementoBolsas) * precios.cementoBolsa +
      arenaM3 * precios.arenaM3 +
      piedraM3 * precios.piedraM3 +
      aceroKg * precios.aceroKg +
      encofradoM2 * precios.encofradoM2;
    return { porItem, porNivel, concretoM3, aceroKg, encofradoM2, cementoBolsas, arenaM3, piedraM3, aguaL, costo, costoSistemas, costoTotal: costo + costoSistemas, varillasTotales };
  }, [items, precios, niveles, sistemas, catDrywall, catLadrillo, techosLib, murosCad, catOsb, obraCad]);

  const exportar = () => {
    let txt = `INNOVA CONTRATISTAS — METRADO DE CONCRETO / OBRA CIVIL\nFecha: ${new Date().toLocaleDateString('es-PE')}\n`;
    txt += `============================================================\n\n`;
    totales.porNivel.forEach(({ nivel, its, subConcreto, subAcero, sistema }) => {
      const ob = obraCad.resumen[nivel];
      if (its.length === 0 && sistema.costo === 0 && sistema.muros.length === 0 && !sistema.tanque && sistema.techos.length === 0 && !ob?.costo && !ob?.ambientes.length) return;
      txt += `### ${nivel.toUpperCase()}\n`;
      if (ob?.metal && ob.metal.perfiles) txt += `  Estructura metálica (${obraCad.nombreEst}): ${ob.metal.perfiles} perfiles · ${ob.metal.metros.toFixed(1)} m · ${ob.metal.kg.toFixed(0)} kg · S/ ${ob.metal.costoAcero.toFixed(2)}${ob.metal.coberturaM2 ? ` | Cobertura ${ob.metal.coberturaM2.toFixed(1)} m² (${ob.metal.coberturas.join(', ')}) · S/ ${ob.metal.costoCobertura.toFixed(2)}` : ''}\n`;
      ob?.ambientes.forEach(a => { txt += `  Ambiente: ${a.nombre} · ${a.area.toFixed(2)} m²\n`; });
      if (ob && ob.puertas + ob.ventanas + ob.vanos > 0) txt += `  Aberturas: ${ob.puertas} puertas · ${ob.ventanas} ventanas · ${ob.vanos} vanos\n`;
      if (ob?.cielo) txt += `  Cielo raso ${ob.cielo.nombre} (${ob.cielo.modo}): ${ob.cielo.area.toFixed(2)} m² · ángulo perimetral ${ob.cielo.perimetro.toFixed(1)} m · S/ ${ob.cielo.costo.toFixed(2)}\n`;
      ob?.carpi?.forEach(c => { txt += `  CarpiMetal: ${c.nombre} (${c.medidas}) · S/ ${c.costo.toFixed(2)}\n`; });
      if (ob?.entrepisoOsb) txt += `  Entrepiso ${ob.entrepisoOsb.nombre}: ${ob.entrepisoOsb.area.toFixed(2)} m² · S/ ${ob.entrepisoOsb.costo.toFixed(2)}\n`;
      ob?.tanques?.forEach(t => { txt += `  Tanque T${t.numero} (${t.litros} L): sobretecho ${t.sobretecho ? `${t.sobretecho} ${t.sobretechoM2.toFixed(2)} m²` : 'no'} · sobrepecho ${t.sobrepechoM2 ? `${t.sobrepechoM2.toFixed(2)} m² (${t.ladrillos} ladrillos) S/ ${t.costoSobrepecho.toFixed(2)}` : 'no'}\n`; });
      if (ob?.cieloTanque) txt += `  Cielo raso bajo sobretecho de tanque: ${ob.cieloTanque.area.toFixed(2)} m² · S/ ${ob.cieloTanque.costo.toFixed(2)}\n`;
      sistema.muros.forEach(({ m, r }) => {
        txt += `  Muro ${m.tipo}: ${r.nombre} · ${m.areaM2.toFixed(2)} m²${m.tipo !== 'ladrillo' ? ` x ${m.caras} cara(s)` : ''} → ${m.tipo !== 'ladrillo' ? `${r.unidades.toFixed(1)} m² placa` : `${r.unidades} ladrillos`} · S/ ${r.costo.toFixed(2)}\n`;
      });
      sistema.techos.forEach(t => { txt += `  Techo metálico: ${t.nombre} · ${t.pesoAceroKg.toFixed(0)} kg acero · costo directo S/ ${t.costoDirectoSoles.toFixed(2)}\n`; });
      if (sistema.tanque) {
        const k = sistema.tanque;
        txt += `  Soporte de tanque: ${k.metrosPerfil.toFixed(1)} m de perfil (${k.barras6m} barras 6 m) · S/ ${k.costoAcero.toFixed(2)}${k.ladrillos ? ` | Sobrepecho ${k.areaSobrepechoM2.toFixed(1)} m² (${k.ladrillos} ladrillos) · S/ ${k.costoSobrepecho.toFixed(2)}` : ''} | Carga ${k.cargaTotalKg.toFixed(0)} kg\n`;
      }
      its.forEach(({ def, it, r }, i) => {
        const dims = def.campos.map(c => `${c.label.split(' (')[0]}=${it.valores[c.key]}`).join(', ');
        txt += `  ${i + 1}. ${def.nombre} (${dims})\n     Concreto: ${r.concretoM3.toFixed(3)} m³ | Acero: ${r.aceroKg.toFixed(1)} kg | Encofrado: ${r.encofradoM2.toFixed(2)} m²${r.nota ? ` | ${r.nota}` : ''}\n`;
      });
      txt += `  Subtotal ${nivel}: ${subConcreto.toFixed(2)} m³ concreto · ${subAcero.toFixed(1)} kg acero\n\n`;
    });
    txt += `\n--- TOTALES ---\nConcreto: ${totales.concretoM3.toFixed(2)} m³\nAcero: ${totales.aceroKg.toFixed(1)} kg\nEncofrado: ${totales.encofradoM2.toFixed(2)} m²\n`;
    txt += `Cemento: ${Math.ceil(totales.cementoBolsas)} bolsas | Arena: ${totales.arenaM3.toFixed(2)} m³ | Piedra: ${totales.piedraM3.toFixed(2)} m³ | Agua: ${Math.round(totales.aguaL)} L\n`;
    if (totales.varillasTotales.length > 0) {
      txt += `Acero por varillas (9 m): ` + totales.varillasTotales.map(v => `Ø${v.d}: ${v.varillas} var. (${v.metros.toFixed(1)} m)`).join(' | ') + `\n`;
    }
    txt += `Costo concreto/acero/encofrado: S/ ${totales.costo.toFixed(2)}\n`;
    txt += `Costo muros, estructura metálica, cielo raso y tanques: S/ ${totales.costoSistemas.toFixed(2)}\n`;
    txt += `COSTO REFERENCIAL TOTAL: S/ ${totales.costoTotal.toFixed(2)}\n`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `metrado_concreto_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const ModoToggle = (
    <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200">
      <button onClick={() => setModo('lista')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${modo === 'lista' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
        <List className="w-3.5 h-3.5" /> Lista
      </button>
      <button onClick={() => setModo('cad')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${modo === 'cad' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
        <PenTool className="w-3.5 h-3.5 text-stone-500" /> Plano CAD
      </button>
    </div>
  );

  // MODO CAD: plano de cimentación 2D con metrado automático.
  if (modo === 'cad') {
    return (
      <div className="w-full h-full flex flex-col bg-slate-50 font-sans">
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-stone-500/10 text-stone-600 border border-stone-500/20">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase leading-tight">Obra Civil · Plano CAD</h2>
              <p className="text-[11px] text-slate-500">Dibuja columnas, zapatas, vigas y cimientos; el metrado sale solo.</p>
            </div>
          </div>
          {ModoToggle}
        </div>
        <div className="flex-1 min-h-0">
          <ConcretoPlanoCad onEditarEnTechos={d => { setActiveTechosDesignToLoad(d); onIrATechos?.(); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 text-slate-800 p-4 sm:p-6 overflow-y-auto space-y-5 font-sans">
      {/* Cabecera */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-stone-500/10 text-stone-600 border border-stone-500/20">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">Obra Civil · Metrados</h2>
            <p className="text-xs text-slate-500">Agrega elementos, pon medidas y obtén concreto, acero, encofrado y costo.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {ModoToggle}
          <button onClick={() => setShowPrecios(s => !s)} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer flex items-center gap-1.5">
            <Calculator className="w-4 h-4" /> Precios
          </button>
          <button onClick={exportar} disabled={items.length === 0 && totales.costoSistemas === 0} className="px-3 py-2 rounded-xl bg-stone-600 hover:bg-stone-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-40">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {/* Editor de precios */}
      {showPrecios && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs grid grid-cols-2 sm:grid-cols-5 gap-3">
          {([
            ['cementoBolsa', 'Cemento (S/ bolsa)'], ['arenaM3', 'Arena (S/ m³)'], ['piedraM3', 'Piedra (S/ m³)'],
            ['aceroKg', 'Acero (S/ kg)'], ['encofradoM2', 'Encofrado (S/ m²)'],
          ] as [keyof typeof PRECIOS_DEFAULT, string][]).map(([k, label]) => (
            <label key={k} className="text-[11px] font-bold text-slate-600">
              {label}
              <input type="number" value={precios[k]} onChange={e => fijarPrecio(CLAVE_PRECIO[k], parseFloat(e.target.value) || 0, 'Obra Civil')}
                className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-400" />
            </label>
          ))}
        </div>
      )}
      {showPrecios && (
        <AdminCatalogosMateriales drywall={catDrywall} ladrillo={catLadrillo} onDrywall={setCatDrywall} onLadrillo={setCatLadrillo} osb={catOsb} onOsb={setCatOsb} />
      )}

      {/* Selector de NIVEL / PISO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
        <p className="text-[11px] font-black text-slate-400 uppercase px-1 mb-2">Nivel / Piso activo</p>
        <div className="flex flex-wrap gap-2 items-center">
          {niveles.map(n => (
            <div key={n} className={`group inline-flex items-center gap-1 rounded-xl border text-xs font-bold transition-all ${
              nivelActivo === n ? 'bg-stone-700 text-white border-stone-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}>
              <button onClick={() => setNivelActivo(n)} className="pl-3 pr-1.5 py-2 cursor-pointer">{n}</button>
              {niveles.length > 1 && (
                <button onClick={() => eliminarNivel(n)} title="Eliminar piso (y sus elementos)"
                  className={`pr-2 py-2 cursor-pointer ${nivelActivo === n ? 'text-stone-300 hover:text-white' : 'text-slate-300 hover:text-rose-500'}`}>
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button onClick={agregarNivel} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold cursor-pointer hover:bg-amber-100">
            <Plus className="w-3.5 h-3.5" /> Piso
          </button>
        </div>
      </div>

      <SistemaPisoPanel
        nivel={nivelActivo}
        sistema={sistemas[nivelActivo] || sistemaVacio()}
        calc={totales.porNivel.find(n => n.nivel === nivelActivo)?.sistema || calcSistema(undefined, catDrywall, catLadrillo, techosLib, [], catOsb)}
        drywall={catDrywall}
        ladrillo={catLadrillo}
        osb={catOsb}
        techosLib={techosLib}
        onChange={s => setSistemas(prev => ({ ...prev, [nivelActivo]: s }))}
        onIrATechos={onIrATechos}
        obra={obraCad.resumen[nivelActivo]}
        estructuraNombre={obraCad.nombreEst}
      />

      {/* Paleta de elementos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
        <p className="text-[11px] font-black text-slate-400 uppercase px-1 mb-2">
          Agregar elemento <span className="text-stone-500">→ {nivelActivo}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {CATALOGO_ELEMENTOS.map(el => (
            <button key={el.id} onClick={() => addItem(el.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold cursor-pointer active:scale-95 transition-all">
              <span className="text-sm">{el.emoji}</span> {el.nombre} <Plus className="w-3.5 h-3.5 text-stone-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Lista de elementos */}
      {items.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-400">
          <Box className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="font-bold text-sm">Agrega elementos de concreto para empezar el metrado</p>
          <p className="text-xs mt-1">Zapatas, columnas, vigas, losas, muros, cimientos…</p>
        </div>
      ) : (
        <div className="space-y-5">
          {totales.porNivel.filter(g => g.its.length > 0).map(({ nivel, its, subConcreto, subAcero }) => (
            <div key={nivel} className="space-y-3">
              {/* Cabecera de nivel con subtotal */}
              <div className="flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-1.5 rounded-full bg-stone-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">{nivel}</h3>
                  <span className="text-[10px] font-bold text-slate-400">({its.length})</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="bg-stone-100 text-stone-700 border border-stone-200 rounded-lg px-2 py-1">{subConcreto.toFixed(2)} m³</span>
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-2 py-1">{subAcero.toFixed(0)} kg acero</span>
                </div>
              </div>
              {its.map(({ it, def, r, varillas }, idx) => (
                <div key={it.uid} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{def.emoji}</span>
                      <span className="text-sm font-black text-slate-800">{idx + 1}. {def.nombre}</span>
                    </div>
                    <button onClick={() => removeItem(it.uid)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3 mb-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-2 flex-1">
                      {def.campos.map(c => (
                        <label key={c.key} className="text-[11px] font-bold text-slate-600">
                          {c.label}
                          <input type="number" inputMode="decimal" value={it.valores[c.key]}
                            onChange={e => updateVal(it.uid, c.key, parseFloat(e.target.value) || 0)}
                            className="mt-1 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-400" />
                        </label>
                      ))}
                    </div>
                    <div className="shrink-0 bg-slate-50 border border-slate-100 rounded-xl p-1.5 flex items-center justify-center self-center">
                      <ConcretoElementoSVG tipoId={it.tipoId} v={it.valores} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold text-slate-700 border-t border-slate-100 pt-2.5">
                    <span>🧱 Concreto: <span className="text-stone-700">{r.concretoM3.toFixed(3)} m³</span></span>
                    <span>🔩 Acero: <span className="text-stone-700">{r.aceroKg.toFixed(1)} kg</span></span>
                    <span>🪵 Encofrado: <span className="text-stone-700">{r.encofradoM2.toFixed(2)} m²</span></span>
                    {r.nota && <span className="text-slate-400 font-medium">· {r.nota}</span>}
                  </div>
                  {Object.keys(varillas).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(varillas).map(([d, info]) => (
                        <span key={d} className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg">
                          Ø {d}: <span className="text-slate-900">{info.varillas} var.</span> <span className="text-slate-400 font-medium">({info.metros.toFixed(1)} m)</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Totales */}
      {(items.length > 0 || totales.costoSistemas > 0) && (
        <div className="bg-stone-800 text-white rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-black uppercase mb-3 text-stone-300">Totales del metrado</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              ['Concreto', `${totales.concretoM3.toFixed(2)} m³`],
              ['Acero', `${totales.aceroKg.toFixed(0)} kg`],
              ['Encofrado', `${totales.encofradoM2.toFixed(1)} m²`],
              ['Cemento', `${Math.ceil(totales.cementoBolsas)} bolsas`],
              ['Arena', `${totales.arenaM3.toFixed(2)} m³`],
              ['Piedra', `${totales.piedraM3.toFixed(2)} m³`],
              ['Agua', `${Math.round(totales.aguaL)} L`],
            ].map(([label, val]) => (
              <div key={label} className="bg-stone-700/60 rounded-xl p-3 text-center">
                <p className="text-lg font-black">{val}</p>
                <p className="text-[10px] font-bold text-stone-300 uppercase">{label}</p>
              </div>
            ))}
            <div className="bg-amber-500 text-slate-950 rounded-xl p-3 text-center">
              <p className="text-lg font-black">S/ {totales.costoTotal.toFixed(0)}</p>
              <p className="text-[10px] font-bold uppercase">Costo ref. total</p>
            </div>
          </div>

          {/* Costo por piso: concreto + muros + techo metálico + tanque */}
          <div className="mb-4">
            <p className="text-[11px] font-black uppercase text-stone-300 mb-2">Costo por piso</p>
            <div className="space-y-1.5">
              {totales.porNivel.map(n => {
                const conc = n.its.reduce((s, p) => s + p.r.concretoM3, 0);
                return (
                  <div key={n.nivel} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-stone-700/60 rounded-xl px-3 py-2 text-xs">
                    <span className="font-black">{n.nivel}</span>
                    <span className="text-stone-300">
                      {conc.toFixed(2)} m³ concreto
                      {n.sistema.costoMuros > 0 && <> · muros S/ {n.sistema.costoMuros.toFixed(0)}</>}
                      {n.sistema.costoTechos > 0 && <> · techo metálico S/ {n.sistema.costoTechos.toFixed(0)}</>}
                      {n.sistema.costoTanque > 0 && <> · tanque S/ {n.sistema.costoTanque.toFixed(0)}</>}
                      {(obraCad.resumen[n.nivel]?.metal?.costoAcero || 0) + (obraCad.resumen[n.nivel]?.metal?.costoCobertura || 0) > 0 && <> · estructura S/ {((obraCad.resumen[n.nivel]?.metal?.costoAcero || 0) + (obraCad.resumen[n.nivel]?.metal?.costoCobertura || 0)).toFixed(0)}</>}
                      {(obraCad.resumen[n.nivel]?.cielo?.costo || 0) > 0 && <> · cielo raso S/ {obraCad.resumen[n.nivel]!.cielo!.costo.toFixed(0)}</>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Acero detallado por varillas (barras de 9 m) */}
          {totales.varillasTotales.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-black uppercase text-stone-300 mb-2">Acero por varillas (barras de 9 m)</p>
              <div className="flex flex-wrap gap-2">
                {totales.varillasTotales.map(({ d, varillas, metros }) => (
                  <div key={d} className="bg-stone-700/60 rounded-xl px-3 py-2 text-center min-w-[88px]">
                    <p className="text-base font-black">{varillas} <span className="text-xs font-bold">var.</span></p>
                    <p className="text-[10px] font-bold text-amber-300">Ø {d}</p>
                    <p className="text-[9px] text-stone-400">{metros.toFixed(1)} m</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-stone-400 leading-snug">
            Estimados referenciales (f'c=210, dosificación 1:2:3; cuantías de acero típicas por elemento). Ajusta los precios (concreto, drywall y ladrillo) con el botón "Precios". El costo del techo metálico es el costo directo calculado en Techos. No reemplaza el cálculo estructural de un ingeniero.
          </p>
        </div>
      )}
    </div>
  );
}
