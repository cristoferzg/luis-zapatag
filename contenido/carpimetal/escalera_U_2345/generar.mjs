// Escalera en "U" de dos tramos con descanso (plano "2_ESCALERAS_2345", medidas en cm → m).
// Ejes: X = largo (elevación), Y = altura, Z = ancho (planta). Origen: esquina exterior del descanso, en el piso.
import { writeFileSync } from 'node:fs';
const piezas = []; let n = 0;
const r3 = v => Math.round(v * 1000) / 1000;
const barra = (marca, nombre, a, b, grupo, perfilId = 'rect-4x2-2.0', corte = '90°') => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  piezas.push({ id: `esc-${++n}`, marca, nombre, tipo: 'perfil', material: 'acero', perfilId,
    x1: r3(a[0]), y1: r3(a[1]), z1: r3(a[2]), x2: r3(b[0]), y2: r3(b[1]), z2: r3(b[2]), longitudM: r3(L),
    rotacionDeg: 0, corteInicio: corte, corteFin: corte, cantidad: 1, grupo });
};
// Tablero / peldaño de madera (plancha horizontal de x1..x2, z1..z2 a la altura y).
const tabla = (marca, nombre, x1, x2, z1, z2, y, grupo, espMm = 30) => {
  piezas.push({ id: `esc-${++n}`, marca, nombre, tipo: 'plancha', material: 'especial', perfilId: 'plancha-machihembrada-1.5',
    x1: r3(x1), y1: r3(y), z1: r3(z1), x2: r3(x2), y2: r3(y), z2: r3(z2), longitudM: r3(Math.abs(z2 - z1)),
    rotacionDeg: 0, corteInicio: '90°', corteFin: '90°', esPlancha: true, anchoPlanchaM: r3(Math.abs(x2 - x1)), altoPlanchaM: r3(Math.abs(z2 - z1)),
    espesorPlanchaMm: espMm, subtipoPlancha: 'machihembrada', acabadoMaterial: 'madera', colorHex: '#a0703c', cantidad: 1, grupo });
};
// ── Medidas del plano ──
const H_DESC = 1.47;          // altura del descanso (147,00)
const H_TOTAL = 2.7922;       // llegada (279,22)
const L_DESC = 1.25;          // descanso: largo 125,00
const ANCHO = 2.00;           // planta total 200,00 (cada tramo ≈ 1,00 con las huellas)
const XC = [0.05, 1.44];      // ejes de columnas en X (≈ 139,22 entre ejes)
const ZC = [0.05, 1.05];      // ejes de columnas en Z (100,00 entre ejes)
const TRAMO_A = { z: [1.00, 2.00], x0: 1.025, y0: H_DESC, x1: 2.875, y1: 0, pasos: 8 };       // baja al piso (287,52)
const TRAMO_B = { z: [0.00, 1.00], x0: 1.22, y0: H_DESC, x1: 2.825, y1: H_TOTAL, pasos: 8 };    // sube a la llegada
const HUELLA = 0.28;          // tablero de cada peldaño (28,00)
// Columnas del descanso
let c = 0;
XC.forEach(x => ZC.forEach(z => barra(`C-${++c}`, `Columna ${c}`, [x, 0, z], [x, H_DESC - 0.05, z], 'estructura', 'cuad-3x3-2.0')));
// Bastidor del descanso (perímetro + vigueta central)
const yD = H_DESC - 0.05;
barra('D-1', 'Viga descanso lado muro', [0, yD, 0], [L_DESC, yD, 0], 'descanso');
barra('D-2', 'Viga descanso lado libre', [0, yD, ANCHO], [L_DESC, yD, ANCHO], 'descanso');
barra('D-3', 'Viga descanso fondo', [0, yD, 0], [0, yD, ANCHO], 'descanso');
barra('D-4', 'Viga descanso frente', [L_DESC, yD, 0], [L_DESC, yD, ANCHO], 'descanso');
barra('D-5', 'Vigueta central descanso', [L_DESC / 2, yD, 0], [L_DESC / 2, yD, ANCHO], 'descanso', 'rect-2x1-2.0');
barra('D-6', 'Viga sobre columnas', [XC[1], yD, 0], [XC[1], yD, ANCHO], 'descanso');
tabla('TD-1', 'Tablero descanso (madera) 1', 0, L_DESC, 0, 1.00, H_DESC, 'descanso');
tabla('TD-2', 'Tablero descanso (madera) 2', 0, L_DESC, 1.00, ANCHO, H_DESC, 'descanso');
// Tramos: dos zancos (rect 4"x2") y peldaños de madera sobre soportes 2"x1"
const tramo = (T, letra, nombre) => {
  const [za, zb] = T.z, zz = [za + 0.075, zb - 0.075];
  zz.forEach((z, i) => barra(`Z-${letra}${i + 1}`, `Zanco ${nombre} ${i ? 'derecho' : 'izquierdo'}`, [T.x0, T.y0 - 0.05, z], [T.x1, T.y1 - (T.y1 > T.y0 ? 0.05 : 0), z], 'zancos', 'rect-4x2-2.0', '45°'));
  const g = (T.x1 - T.x0) / T.pasos, r = (T.y1 - T.y0) / T.pasos;
  for (let k = 1; k < T.pasos; k++) {
    const x = T.x0 + k * g, y = T.y0 + k * r;
    const xa = x - HUELLA / 2, xb = x + HUELLA / 2;
    barra(`S-${letra}${k}`, `Soporte peldaño ${nombre} #${k}`, [xa, y - 0.03, zz[0]], [xa, y - 0.03, zz[1]], 'peldanos', 'rect-2x1-2.0');
    tabla(`P-${letra}${String(k).padStart(2, '0')}`, `Peldaño madera ${nombre} #${k}`, xa, xb, za, zb, y, 'peldanos');
  }
};
tramo(TRAMO_A, 'A', 'tramo 1 (baja)');
tramo(TRAMO_B, 'B', 'tramo 2 (sube)');
// Llegada superior (44,07 de largo sobre el tramo 2) y pasamanos corto
const xL = TRAMO_B.x1, xL2 = xL + 0.4407, yL = H_TOTAL - 0.05;
barra('L-1', 'Viga llegada lado muro', [xL, yL, 0], [xL2, yL, 0], 'llegada');
barra('L-2', 'Viga llegada lado libre', [xL, yL, 1.0], [xL2, yL, 1.0], 'llegada');
barra('L-3', 'Viga llegada frente', [xL2, yL, 0], [xL2, yL, 1.0], 'llegada');
tabla('TL-1', 'Tablero llegada (madera)', xL, xL2, 0, 1.0, H_TOTAL, 'llegada');
const design = {
  id: 'escalera-u-2345', tipoElemento: 'escalera_descanso',
  nombre: 'Escalera en U con descanso (plano 2345)',
  descripcion: 'Escalera metálica de dos tramos con descanso de 1,25 × 2,00 m a 1,47 m y llegada a 2,79 m. Zancos y vigas en tubo rectangular 4"×2"×2 mm, columnas 3"×3"×2 mm, peldaños de madera de 28 cm sobre soportes 2"×1". Reconstruida desde el plano en cm.',
  piezas, accesoriosCad: [], cotasCad: [],
  anchoM: 3.27, altoM: H_TOTAL, profundidadMarcoMm: 2000,
  perfilMarcoId: 'rect-4x2-2.0', perfilBastidorId: 'cuad-3x3-2.0', perfilRefuerzoId: 'rect-2x1-2.0',
};
writeFileSync(process.argv[2], JSON.stringify(design, null, 2));
console.log('piezas', piezas.length);
