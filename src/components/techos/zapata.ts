// =============================================================================
// Zapata aislada cuadrada bajo cada columna (prediseño RNE E.050 / E.060).
//  • Área: (P + 10 % peso propio) / qa, con la presión máxima por el momento del sismo
//    q = P/A · (1 + 6e/B) ≤ 1.33·qa (e = M/P; si e > B/6 se agranda la zapata).
//  • Peralte por punzonamiento: Vu = qu·(A − (c + d)²) ≤ φVc = 0.85 · 1.06 √f'c · bo · d;
//    y por corte como viga: Vu = qu·B·(m − d) ≤ 0.85 · 0.53 √f'c · B · d. h mínimo 50 cm.
//  • Acero en malla: Mu = qu·B·m²/2, As = Mu / (0.9·fy·0.9d), mínimo 0.0018·B·h.
// Prediseño: la capacidad del suelo la da el estudio de mecánica de suelos (EMS).
// =============================================================================
const FC = 210, FY = 4200;

export interface DisenoZapata {
  B: number; h: number; d: number; Df: number; qa: number;
  PKg: number; PuKg: number; MKgM: number; qMax: number; qLim: number;
  vuPunzKg: number; phiVcPunzKg: number; vuCorteKg: number; phiVcCorteKg: number;
  AsCm2: number; barra: string; n: number; sep: number;
  estado: 'CUMPLE' | 'NO_CUMPLE'; motivo: string;
}

const BARRA = { d: '5/8"', area: 1.99 };

/** c = lado de la columna o del pedestal (cm); P, Pu en kg; M (sismo, en la base) en kg·m; qa en kg/cm². */
export function disenarZapata(P: number, Pu: number, M: number, c: number, qa = 1.5, Df = 1.2): DisenoZapata {
  const qLim = 1.33 * qa;
  let B = Math.max(100, Math.ceil(Math.sqrt((1.1 * P) / qa) / 5) * 5); // cm
  let qMax = 0;
  for (let i = 0; i < 60; i++) {
    const e = (M * 100) / Math.max(1, P * 1.1);                         // cm
    qMax = e <= B / 6 ? (1.1 * P) / (B * B) * (1 + (6 * e) / B) : (2 * 1.1 * P) / (3 * B * (B / 2 - e));
    if (qMax <= qLim && e <= B / 3) break;
    B += 5;
  }
  const qu = (Pu / (B * B));                                            // kg/cm² (reacción última del suelo)
  let h = 50, d = 40, vuP = 0, phiP = 0, vuC = 0, phiC = 0;
  for (; h <= 120; h += 5) {
    d = h - 10;
    const bo = 4 * (c + d);
    vuP = qu * (B * B - (c + d) ** 2);
    phiP = 0.85 * 1.06 * Math.sqrt(FC) * bo * d;
    const m = (B - c) / 2;
    vuC = qu * B * Math.max(0, m - d);
    phiC = 0.85 * 0.53 * Math.sqrt(FC) * B * d;
    if (vuP <= phiP && vuC <= phiC) break;
  }
  const m = (B - c) / 2;
  const Mu = (qu * B * m * m) / 2;                                      // kg·cm
  const As = Math.max(Mu / (0.9 * FY * 0.9 * d), 0.0018 * B * h);
  const n = Math.max(4, Math.ceil(As / BARRA.area));
  const sep = Math.floor((B - 15) / (n - 1));
  const ok = qMax <= qLim && vuP <= phiP && vuC <= phiC;
  return {
    B: B / 100, h: h / 100, d: d / 100, Df, qa, PKg: P, PuKg: Pu, MKgM: M, qMax, qLim,
    vuPunzKg: vuP, phiVcPunzKg: phiP, vuCorteKg: vuC, phiVcCorteKg: phiC,
    AsCm2: n * BARRA.area, barra: BARRA.d, n, sep,
    estado: ok ? 'CUMPLE' : 'NO_CUMPLE',
    motivo: ok ? 'Cumple presión del suelo, punzonamiento y corte' : qMax > qLim ? 'La presión del suelo supera la admisible' : 'Peralte insuficiente por corte',
  };
}

/** Metrado de N zapatas iguales (m³ de concreto, kg de acero, m³ de excavación). */
export function metradoZapatas(z: DisenoZapata, n: number) {
  const vol = z.B * z.B * z.h * n;
  const largoBarra = z.B - 0.15 + 2 * 0.15;                             // con patas de 15 cm
  const aceroKg = 2 * z.n * largoBarra * 1.552 * n;                     // malla en dos sentidos, Ø 5/8"
  const excavacion = (z.B + 0.3) * (z.B + 0.3) * z.Df * n;
  const solado = z.B * z.B * 0.1 * n;
  return { n, concretoM3: vol, aceroKg, excavacionM3: excavacion, soladoM3: solado };
}
