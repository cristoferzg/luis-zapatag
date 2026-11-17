// Diseños editables de Carpintería Metálica (plantillas de Recursos Técnicos). Se arman con el mismo generador del módulo.
// Uso: npx tsx contenido/academia/plantillas-carpimetal/generar.ts <carpeta_salida>
import { writeFileSync } from 'node:fs';
import { crearDisenoPorElemento, asegurarCad } from '../../../src/components/herreria/herreriaCatalog';
import { generarEscalera } from '../../../src/components/herreria/escaleraAMedida';

const out = process.argv[2] || '.';
const hoy = '2026-11-16';
const armar = (tipo: any, cambios: any) => {
  const base: any = crearDisenoPorElemento(tipo);
  return asegurarCad({ ...base, ...cambios, piezas: [], accesoriosCad: [], cotasCad: [], fechaCreacion: hoy, ultimaModificacion: hoy });
};

const disenos: Record<string, any> = {
  'porton-corredizo-cochera': armar('porton', {
    id: 'plantilla-porton-corredizo', nombre: 'PORTÓN CORREDIZO DE COCHERA 3.90 × 2.40 m',
    descripcion: 'Portón corredizo de una hoja para cochera: plancha abajo (privacidad y golpes) y barrotes arriba (ventilación y vista). Riel inferior, 2 ruedas de 4", guía superior y topes.',
    anchoM: 3.90, altoM: 2.40, numHojas: 1, tipoAperturaPorton: 'corredizo',
    hojas: [{ id: 'h1', numero: 1, anchoM: 3.90, apertura: 'corredizo' }],
    sentidoAperturaTexto: 'Corredizo sobre riel, abre hacia la izquierda (deja libre 3.80 m)',
    divisiones: [{ id: 'div-por-1', tipo: 'horizontal', posicionM: 1.32, porcentaje: 55, perfilId: 'rect-2x1-1.5' }],
    paneles: [
      { id: 'pan-por-inf', nombre: 'Plancha inferior LAC 1/32"', hojaIndex: 0, relX: 0, relY: 0, relW: 1, relH: 0.55, tipoRelleno: 'plancha', espesorMm: 0.8 },
      { id: 'pan-por-sup', nombre: 'Barrotes superiores 1" × 1"', hojaIndex: 0, relX: 0, relY: 0.55, relW: 1, relH: 0.45, tipoRelleno: 'reja', espesorMm: 25,
        rejaConfig: { orientacion: 'vertical', perfilId: 'cuad-1x1-1.2', separacionObjetivoCm: 11, separacionRealCm: 11, cantidadBarras: 34 } },
    ],
    barrotesConfig: { activo: true, perfilId: 'cuad-1x1-1.2', orientacion: 'vertical', separacionCm: 11, cantidad: 34, separacionRealCm: 11 },
    acabado: { tipoPintura: 'anticorrosivo_esmalte', colorNombre: 'Negro Grafito Mate', colorHex: '#1f2937', manosPintura: 2, costoPorM2: 24 },
  }),
  'puerta-principal-dos-hojas': armar('puerta', {
    id: 'plantilla-puerta-dos-hojas', nombre: 'PUERTA PRINCIPAL DE DOS HOJAS 1.60 × 2.40 m',
    descripcion: 'Puerta de fachada de dos hojas de 0.80 m: una de uso diario y otra con cerrojos que se abre para pasar muebles. Vidrio templado arriba y plancha abajo.',
    anchoM: 1.60, altoM: 2.40, numHojas: 2, tipoAperturaPuerta: 'doble',
    hojas: [{ id: 'h1', numero: 1, anchoM: 0.80, apertura: 'derecha' }, { id: 'h2', numero: 2, anchoM: 0.80, apertura: 'izquierda' }],
    sentidoAperturaTexto: 'Batiente hacia el interior: dos hojas de 0.80 m, la de servicio con cerrojos arriba y abajo',
    divisiones: [{ id: 'div-pu-1', tipo: 'horizontal', posicionM: 1.10, porcentaje: 46, perfilId: 'rect-2x1-1.5' }],
    paneles: [0, 1].flatMap(h => [
      { id: `pan-pu-sup-${h}`, nombre: `Hoja ${h + 1} - Vidrio templado 6 mm`, hojaIndex: h, relX: 0, relY: 0.46, relW: 1, relH: 0.54, tipoRelleno: 'vidrio', espesorMm: 6,
        vidrioConfig: { subtipo: 'templado', espesorMm: 6, colorTinte: 'Incoloro / Arenado', precioM2: 120 } },
      { id: `pan-pu-inf-${h}`, nombre: `Hoja ${h + 1} - Plancha LAC 1/16"`, hojaIndex: h, relX: 0, relY: 0, relW: 1, relH: 0.46, tipoRelleno: 'plancha', espesorMm: 1.5 },
    ]),
    acabado: { tipoPintura: 'anticorrosivo_esmalte', colorNombre: 'Negro Mate', colorHex: '#111827', manosPintura: 2, costoPorM2: 24 },
  }),
  'reja-ventana': armar('reja', {
    id: 'plantilla-reja-ventana', nombre: 'REJA DE VENTANA 1.50 × 1.20 m',
    descripcion: 'Reja de seguridad para ventana con marco de 1.5" × 1.5", barrotes de 1" × 1" cada 11 cm y travesaño al centro. Se fija a la mocheta con pernos.',
    anchoM: 1.50, altoM: 1.20,
    hojas: [{ id: 'h1', numero: 1, anchoM: 1.50, apertura: 'fija' }],
    divisiones: [{ id: 'div-rv-1', tipo: 'horizontal', posicionM: 0.60, porcentaje: 50, perfilId: 'rect-2x1-1.5' }],
    paneles: [{ id: 'pan-rv', nombre: 'Barrotes verticales 1" × 1"', hojaIndex: 0, relX: 0, relY: 0, relW: 1, relH: 1, tipoRelleno: 'reja', espesorMm: 25,
      rejaConfig: { orientacion: 'vertical', perfilId: 'cuad-1x1-1.2', separacionObjetivoCm: 11, separacionRealCm: 11, cantidadBarras: 12 } }],
    barrotesConfig: { activo: true, perfilId: 'cuad-1x1-1.2', orientacion: 'vertical', separacionCm: 11, cantidad: 12, separacionRealCm: 11 },
    accesorios: [{ id: 'acc-rv-anc', categoria: 'accesorio', nombre: 'Pernos de anclaje 3/8" × 3"', descripcion: 'Fijación a la mocheta', unidad: 'und', cantidad: 6, precioUnitario: 4.5, incluido: true }],
  }),
  'baranda-terraza': armar('baranda', {
    id: 'plantilla-baranda-terraza', nombre: 'BARANDA DE TERRAZA 4.00 × 1.00 m',
    descripcion: 'Baranda de seguridad para terraza o balcón: pasamanos de tubo redondo 2", barrotes verticales de 3/4" con luz menor de 13 cm (seguridad para niños) y parantes cada 1.00 m.',
    anchoM: 4.00, altoM: 1.00,
    hojas: [{ id: 'h1', numero: 1, anchoM: 4.00, apertura: 'fija' }],
    divisiones: [1, 2, 3].map(i => ({ id: `div-bt-${i}`, tipo: 'vertical', posicionM: i, porcentaje: i * 25, perfilId: 'cuad-1.5x1.5-1.5' })),
    paneles: [{ id: 'pan-bt', nombre: 'Barrotes verticales 3/4"', hojaIndex: 0, relX: 0, relY: 0, relW: 1, relH: 1, tipoRelleno: 'reja', espesorMm: 19,
      rejaConfig: { orientacion: 'vertical', perfilId: 'cuad-3/4x3/4-1.2', separacionObjetivoCm: 12, separacionRealCm: 12, cantidadBarras: 33 } }],
    barrotesConfig: { activo: true, perfilId: 'cuad-3/4x3/4-1.2', orientacion: 'vertical', separacionCm: 12, cantidad: 33, separacionRealCm: 12 },
  }),
  'escalera-recta-segundo-piso': generarEscalera({ forma: 'recta', alturaTotal: 2.70, ancho: 0.90, huella: 0.28, peldano: 'estriada', baranda: true, nombre: 'ESCALERA RECTA A SEGUNDO PISO (2.70 m)' } as any),
};

for (const [n, d] of Object.entries(disenos)) {
  d.id = 'plantilla-' + n;
  writeFileSync(`${out}/${n}.json`, JSON.stringify(d));
  console.log(n, d.nombre, d.anchoM, d.altoM, 'piezas', d.piezas.length, 'KB', Math.round(JSON.stringify(d).length / 1024));
}
