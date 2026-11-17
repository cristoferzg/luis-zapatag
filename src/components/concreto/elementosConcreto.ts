// Elementos de concreto armado de Obra Civil (zapata, columna, viga, losa, muro,
// cimiento, sobrecimiento): medidas → concreto, acero y encofrado, y su costo de
// materiales con los precios del Catálogo. Lo usan Obra Civil y el Presupuesto de obra.

export interface CampoDef { key: string; label: string; def: number; }
export interface ResultadoCalc { concretoM3: number; aceroKg: number; encofradoM2: number; nota?: string; }
export interface ElementoDef {
  id: string;
  nombre: string;
  emoji: string;
  campos: CampoDef[];
  calc: (v: Record<string, number>) => ResultadoCalc;
  // Distribución referencial del acero por diámetro (fracciones que suman 1).
  aceroDist?: Record<string, number>;
}

// Peso lineal (kg/m) por diámetro de varilla de acero corrugado.
export const DIAMETROS_KGM: Record<string, number> = {
  '1/4"': 0.25, '3/8"': 0.56, '1/2"': 0.99, '5/8"': 1.55, '3/4"': 2.24,
};
export const LARGO_VARILLA_M = 9; // Barra comercial estándar

// Convierte kg de acero + distribución por diámetro en metros y # de varillas de 9 m.
export function desgloseVarillas(aceroKg: number, dist?: Record<string, number>) {
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
export const CATALOGO_ELEMENTOS: ElementoDef[] = [
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

export interface Instancia { uid: string; tipoId: string; valores: Record<string, number>; nivel: string; }

export const nuevaInstancia = (tipoId: string, nivel: string): Instancia => {
  const def = CATALOGO_ELEMENTOS.find(e => e.id === tipoId)!;
  const valores: Record<string, number> = {};
  def.campos.forEach(c => { valores[c.key] = c.def; });
  return { uid: `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, tipoId, valores, nivel };
};

/** Totales de concreto, acero y encofrado de una lista de elementos. */
export function sumaElementos(items: Instancia[]) {
  let concretoM3 = 0, aceroKg = 0, encofradoM2 = 0;
  items.forEach(it => {
    const def = CATALOGO_ELEMENTOS.find(e => e.id === it.tipoId);
    if (!def) return;
    const r = def.calc(it.valores);
    concretoM3 += r.concretoM3; aceroKg += r.aceroKg; encofradoM2 += r.encofradoM2;
  });
  return { concretoM3, aceroKg, encofradoM2 };
}

/** Materiales del concreto (dosificación referencial por m³) y su costo con los precios dados. */
export function costoMaterialesConcreto(t: { concretoM3: number; aceroKg: number; encofradoM2: number },
  precios: { cementoBolsa: number; arenaM3: number; piedraM3: number; aceroKg: number; encofradoM2: number }) {
  const cementoBolsas = t.concretoM3 * 9.5;
  const arenaM3 = t.concretoM3 * 0.54;
  const piedraM3 = t.concretoM3 * 0.55;
  const aguaL = t.concretoM3 * 180;
  const costo =
    Math.ceil(cementoBolsas) * precios.cementoBolsa +
    arenaM3 * precios.arenaM3 +
    piedraM3 * precios.piedraM3 +
    t.aceroKg * precios.aceroKg +
    t.encofradoM2 * precios.encofradoM2;
  return { cementoBolsas, arenaM3, piedraM3, aguaL, costo };
}
