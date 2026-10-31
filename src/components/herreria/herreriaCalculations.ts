// Motor de cálculos matemáticos, despiece, optimización de cortes y costos de HERRERÍA
import { precio, precioBarraPerfil, tienePrecioPropio } from '../../lib/catalogoPrecios';
import { 
  HerreriaDesign, 
  PerfilCatalogo, 
  PiezaDespiece, 
  DespieceResult, 
  BarraOptimizada,
  MaterialAgrupado,
  CostoDesglosado,
  PresupuestoHerreriaResult,
  ItemPresupuestoHerreria
} from './herreriaTypes';
import { PERFILES_CATALOGO } from './herreriaCatalog';

// Cálculo paramétrico de barrotes según espacio disponible y orientación
export function calcularEspaciadoReja(
  anchoLibreM: number,
  espaciadoObjetivoCm: number,
  anchoPerfilMm: number
) {
  const anchoLibreCm = anchoLibreM * 100;
  const anchoBarraCm = anchoPerfilMm / 10;
  
  if (anchoLibreCm <= 0 || espaciadoObjetivoCm <= 0) {
    return { cantBarras: 0, separacionRealCm: espaciadoObjetivoCm };
  }

  // Fórmula: anchoLibre = n * barra + (n + 1) * espacio
  // n = (anchoLibre - espacio) / (barra + espacio)
  const nEstimado = Math.round((anchoLibreCm - espaciadoObjetivoCm) / (anchoBarraCm + espaciadoObjetivoCm));
  const cantBarras = Math.max(1, nEstimado);
  
  const separacionRealCm = (anchoLibreCm - cantBarras * anchoBarraCm) / (cantBarras + 1);

  return {
    cantBarras,
    separacionRealCm: Math.round(separacionRealCm * 10) / 10
  };
}

// Lienzo en blanco sin nada dibujado: no hay piezas, materiales ni costos.
export const disenoSinContenido = (d: HerreriaDesign) =>
  !!d.isLienzoBlanco && !(d.piezas?.length) && !(d.accesoriosCad?.length) && !(d.paneles?.length) && !(d.accesorios?.length);

// Generador automático de lista de corte (Despiece)
export function generarDespiece(design: HerreriaDesign): DespieceResult {
  if (disenoSinContenido(design)) {
    return { piezas: [], totalPiezas: 0, longitudTotalPerfilesM: 0, pesoTotalAceroKg: 0, barrasComerciales6m: 0, desperdicioEstimadoPct: 0, optimizacionBarras: [] };
  }
  // 1. PRIORIDAD: Si el usuario está en el Centro CAD Paramétrico con piezas personalizadas
  if (design.piezas && design.piezas.length > 0) {

    const piezas: PiezaDespiece[] = [];
    design.piezas.forEach((pz, idx) => {
      const perfil = PERFILES_CATALOGO.find(p => p.id === pz.perfilId) || PERFILES_CATALOGO[0];
      const longMm = Math.max(10, Math.round(pz.longitudM * 1000));
      const cant = pz.cantidad || 1;
      const pesoUnit = (pz.longitudM * perfil.pesoKgPorMetro);
      piezas.push({
        id: pz.id || `pz-${idx}`,
        marca: pz.marca || `P-${String(idx + 1).padStart(2, '0')}`,
        descripcion: pz.nombre || `Pieza ${pz.marca || idx + 1}`,
        perfilNombre: perfil.nombre,
        perfilDimensiones: perfil.dimensiones,
        material: pz.material || perfil.familia,
        longitudMm: longMm,
        longitudM: pz.longitudM,
        cantidad: cant,
        corteInicio: pz.corteInicio || '90°',
        corteFin: pz.corteFin || '90°',
        pesoUnitarioKg: pesoUnit,
        pesoTotalKg: pesoUnit * cant,
        ubicacion: (pz.grupo as any) || 'refuerzo'
      });
    });

    const totalPiezas = piezas.reduce((acc, p) => acc + p.cantidad, 0);
    const longitudTotalPerfilesM = piezas.reduce((acc, p) => acc + (p.longitudM * p.cantidad), 0);
    const pesoTotalAceroKg = piezas.reduce((acc, p) => acc + p.pesoTotalKg, 0);
    const barrasComerciales6m = Math.ceil((longitudTotalPerfilesM * 1.08) / 6);

    return {
      piezas,
      totalPiezas,
      longitudTotalPerfilesM: Math.round(longitudTotalPerfilesM * 100) / 100,
      pesoTotalAceroKg: Math.round(pesoTotalAceroKg * 10) / 10,
      barrasComerciales6m: Math.max(1, barrasComerciales6m),
      desperdicioEstimadoPct: 8.5,
      optimizacionBarras: optimizarCortes(piezas, 6)
    };
  }

  const piezas: PiezaDespiece[] = [];
  
  const perfilMarco = PERFILES_CATALOGO.find(p => p.id === design.perfilMarcoId) || PERFILES_CATALOGO[1];
  const perfilBastidor = PERFILES_CATALOGO.find(p => p.id === design.perfilBastidorId) || PERFILES_CATALOGO[3];
  const perfilRefuerzo = PERFILES_CATALOGO.find(p => p.id === design.perfilRefuerzoId) || PERFILES_CATALOGO[4];

  const marcoAnchoMm = perfilMarco.anchoMm;
  const bastidorAnchoMm = perfilBastidor.anchoMm;

  // 1. MARCO PERIMÉTRICO
  const esVentanaOReja = design.tipoElemento === 'ventana' || design.tipoElemento === 'reja' || design.tipoElemento === 'reja_abanico' || design.tipoElemento === 'mampara';
  
  // Marco Cabezal Superior
  piezas.push({
    id: 'piez-m-sup',
    marca: 'M-01',
    descripcion: 'Marco Cabezal Superior',
    perfilNombre: perfilMarco.nombre,
    perfilDimensiones: perfilMarco.dimensiones,
    material: perfilMarco.familia,
    longitudMm: Math.round(design.anchoM * 1000),
    longitudM: design.anchoM,
    cantidad: 1,
    corteInicio: '45°',
    corteFin: '45°',
    pesoUnitarioKg: design.anchoM * perfilMarco.pesoKgPorMetro,
    pesoTotalKg: design.anchoM * perfilMarco.pesoKgPorMetro,
    ubicacion: 'marco'
  });

  // Marco Jambas Laterales
  piezas.push({
    id: 'piez-m-lat',
    marca: 'M-02',
    descripcion: 'Marco Jambas Laterales',
    perfilNombre: perfilMarco.nombre,
    perfilDimensiones: perfilMarco.dimensiones,
    material: perfilMarco.familia,
    longitudMm: Math.round(design.altoM * 1000),
    longitudM: design.altoM,
    cantidad: 2,
    corteInicio: '45°',
    corteFin: esVentanaOReja ? '45°' : '90°',
    pesoUnitarioKg: design.altoM * perfilMarco.pesoKgPorMetro,
    pesoTotalKg: design.altoM * perfilMarco.pesoKgPorMetro * 2,
    ubicacion: 'marco'
  });

  // Marco Umbral Inferior (si aplica como en ventanas o rejas)
  if (esVentanaOReja) {
    piezas.push({
      id: 'piez-m-inf',
      marca: 'M-03',
      descripcion: 'Marco Umbral Inferior',
      perfilNombre: perfilMarco.nombre,
      perfilDimensiones: perfilMarco.dimensiones,
      material: perfilMarco.familia,
      longitudMm: Math.round(design.anchoM * 1000),
      longitudM: design.anchoM,
      cantidad: 1,
      corteInicio: '45°',
      corteFin: '45°',
      pesoUnitarioKg: design.anchoM * perfilMarco.pesoKgPorMetro,
      pesoTotalKg: design.anchoM * perfilMarco.pesoKgPorMetro,
      ubicacion: 'marco'
    });
  }

  // 2. BASTIDORES DE HOJAS
  const numHojas = Math.max(1, design.numHojas);
  const luzVanoAnchoMm = (design.anchoM * 1000) - (2 * marcoAnchoMm);
  const luzVanoAltoMm = (design.altoM * 1000) - (esVentanaOReja ? 2 * marcoAnchoMm : marcoAnchoMm);
  const holguraMm = 10;
  const altoHojaMm = Math.max(100, Math.round(luzVanoAltoMm - holguraMm));

  design.hojas.forEach((hoja, hIdx) => {
    // Si la hoja tiene ancho configurado, usarlo; sino dividir uniformemente
    const anchoHojaMm = Math.max(100, Math.round(
      hoja.anchoM 
        ? hoja.anchoM * 1000 - marcoAnchoMm 
        : (luzVanoAnchoMm / numHojas) - holguraMm
    ));

    // Montantes verticales de la hoja (2 por hoja)
    piezas.push({
      id: `piez-b-vert-h${hIdx + 1}`,
      marca: `B-0${hIdx * 2 + 1}`,
      descripcion: `Bastidor Montantes Verticales Hoja ${hIdx + 1}`,
      perfilNombre: perfilBastidor.nombre,
      perfilDimensiones: perfilBastidor.dimensiones,
      material: perfilBastidor.familia,
      longitudMm: altoHojaMm,
      longitudM: altoHojaMm / 1000,
      cantidad: 2,
      corteInicio: '45°',
      corteFin: '45°',
      pesoUnitarioKg: (altoHojaMm / 1000) * perfilBastidor.pesoKgPorMetro,
      pesoTotalKg: (altoHojaMm / 1000) * perfilBastidor.pesoKgPorMetro * 2,
      ubicacion: 'hoja'
    });

    // Travesaños horizontales (zócalo y cabezal) de la hoja
    piezas.push({
      id: `piez-b-horiz-h${hIdx + 1}`,
      marca: `B-0${hIdx * 2 + 2}`,
      descripcion: `Bastidor Travesaños Hoja ${hIdx + 1}`,
      perfilNombre: perfilBastidor.nombre,
      perfilDimensiones: perfilBastidor.dimensiones,
      material: perfilBastidor.familia,
      longitudMm: anchoHojaMm,
      longitudM: anchoHojaMm / 1000,
      cantidad: 2,
      corteInicio: '45°',
      corteFin: '45°',
      pesoUnitarioKg: (anchoHojaMm / 1000) * perfilBastidor.pesoKgPorMetro,
      pesoTotalKg: (anchoHojaMm / 1000) * perfilBastidor.pesoKgPorMetro * 2,
      ubicacion: 'hoja'
    });
  });

  // 3. REFUERZOS Y DIVISIONES HORIZONTALES / VERTICALES
  if (design.divisiones && design.divisiones.length > 0) {
    design.divisiones.forEach((div, idx) => {
      const pDiv = PERFILES_CATALOGO.find(p => p.id === div.perfilId) || perfilRefuerzo;
      const longMm = div.tipo === 'horizontal'
        ? Math.round(luzVanoAnchoMm / numHojas - 2 * bastidorAnchoMm)
        : Math.round(altoHojaMm - 2 * bastidorAnchoMm);

      piezas.push({
        id: `piez-ref-${div.id}`,
        marca: `R-0${idx + 1}`,
        descripcion: `Refuerzo ${div.tipo === 'horizontal' ? 'Horizontal Intermedio' : 'Vertical'}`,
        perfilNombre: pDiv.nombre,
        perfilDimensiones: pDiv.dimensiones,
        material: pDiv.familia,
        longitudMm: Math.max(50, longMm),
        longitudM: Math.max(50, longMm) / 1000,
        cantidad: numHojas,
        corteInicio: '90°',
        corteFin: '90°',
        pesoUnitarioKg: (Math.max(50, longMm) / 1000) * pDiv.pesoKgPorMetro,
        pesoTotalKg: (Math.max(50, longMm) / 1000) * pDiv.pesoKgPorMetro * numHojas,
        ubicacion: 'refuerzo'
      });
    });
  }

  // 4. BARROTES DE REJA
  // Buscar paneles que tengan reja o si barrotesConfig está activo
  const panelesReja = design.paneles.filter(p => p.tipoRelleno === 'reja');

  if (panelesReja.length > 0) {
    panelesReja.forEach((panel, pIdx) => {
      const pBarraId = panel.rejaConfig?.perfilId || design.barrotesConfig.perfilId;
      const pBarra = PERFILES_CATALOGO.find(p => p.id === pBarraId) || PERFILES_CATALOGO[9];
      const hojaAnchoMm = luzVanoAnchoMm / numHojas;
      const anchoZonaMm = (hojaAnchoMm - 2 * bastidorAnchoMm) * panel.relW;
      const altoZonaMm = (altoHojaMm - 2 * bastidorAnchoMm) * panel.relH;
      
      const orientacion = panel.rejaConfig?.orientacion || 'vertical';
      let cantBarras = panel.rejaConfig?.cantidadBarras || 0;
      let longBarroteMm = orientacion === 'vertical' ? altoZonaMm : anchoZonaMm;

      if (!cantBarras || cantBarras <= 0) {
        const dimCalc = orientacion === 'vertical' ? anchoZonaMm / 1000 : altoZonaMm / 1000;
        const calc = calcularEspaciadoReja(
          dimCalc, 
          panel.rejaConfig?.separacionObjetivoCm || 12, 
          pBarra.anchoMm
        );
        cantBarras = calc.cantBarras;
      }

      piezas.push({
        id: `piez-barrote-p${pIdx}`,
        marca: `BR-0${pIdx + 1}`,
        descripcion: `Barrote ${orientacion} (${panel.nombre})`,
        perfilNombre: pBarra.nombre,
        perfilDimensiones: pBarra.dimensiones,
        material: pBarra.familia,
        longitudMm: Math.round(longBarroteMm),
        longitudM: Math.round(longBarroteMm) / 1000,
        cantidad: cantBarras * (panel.hojaIndex !== undefined ? 1 : numHojas),
        corteInicio: '90°',
        corteFin: '90°',
        pesoUnitarioKg: (longBarroteMm / 1000) * pBarra.pesoKgPorMetro,
        pesoTotalKg: (longBarroteMm / 1000) * pBarra.pesoKgPorMetro * cantBarras,
        ubicacion: 'barrote'
      });
    });
  } else if (design.barrotesConfig.activo) {
    const pBarra = PERFILES_CATALOGO.find(p => p.id === design.barrotesConfig.perfilId) || PERFILES_CATALOGO[9];
    const longBarroteMm = altoHojaMm - 2 * bastidorAnchoMm;
    piezas.push({
      id: 'piez-barrote-gral',
      marca: 'BR-01',
      descripcion: `Barrote ${design.barrotesConfig.orientacion}`,
      perfilNombre: pBarra.nombre,
      perfilDimensiones: pBarra.dimensiones,
      material: pBarra.familia,
      longitudMm: Math.round(longBarroteMm),
      longitudM: Math.round(longBarroteMm) / 1000,
      cantidad: design.barrotesConfig.cantidad,
      corteInicio: '90°',
      corteFin: '90°',
      pesoUnitarioKg: (longBarroteMm / 1000) * pBarra.pesoKgPorMetro,
      pesoTotalKg: (longBarroteMm / 1000) * pBarra.pesoKgPorMetro * design.barrotesConfig.cantidad,
      ubicacion: 'barrote'
    });
  }

  // 4. TUBOS Y EMPALMES PERSONALIZADOS (Ensamble tipo Rompecabezas en cualquier dirección)
  if (design.tubosPersonalizados && design.tubosPersonalizados.length > 0) {
    design.tubosPersonalizados.forEach((tb, tIdx) => {
      const pTubo = PERFILES_CATALOGO.find(p => p.id === tb.perfilId) || perfilBastidor;
      const longMm = Math.max(50, Math.round(tb.longitudM * 1000));
      piezas.push({
        id: tb.id || `piez-custom-${tIdx}`,
        marca: tb.marca || `T-${String(tIdx + 1).padStart(2, '0')}`,
        descripcion: tb.etiqueta || `Tubo Rompecabezas (Ángulo ${Math.round(tb.anguloDeg)}°)`,
        perfilNombre: pTubo.nombre,
        perfilDimensiones: pTubo.dimensiones,
        material: pTubo.familia,
        longitudMm: longMm,
        longitudM: tb.longitudM,
        cantidad: 1,
        corteInicio: tb.tipoUnionInicio === '45_inglete' ? '45°' : '90°',
        corteFin: tb.tipoUnionFin === '45_inglete' ? '45°' : '90°',
        pesoUnitarioKg: tb.longitudM * pTubo.pesoKgPorMetro,
        pesoTotalKg: tb.longitudM * pTubo.pesoKgPorMetro,
        ubicacion: 'refuerzo'
      });
    });
  }

  // 5. ARCO SUPERIOR PARAMÉTRICO (Tubo Rolado y Barrotes de Arco)
  if (design.arco && design.arco.activo && design.arco.flechaM > 0) {
    const pArco = PERFILES_CATALOGO.find(p => p.id === design.arco?.perfilArcoId) || perfilMarco;
    const w = design.anchoM;
    const h = design.arco.flechaM;
    const r = (h * h + (w / 2) * (w / 2)) / (2 * h);
    const angRad = 2 * Math.asin(Math.min(0.999, (w / 2) / r));
    const longArcoM = Math.max(w, Math.round(r * angRad * 100) / 100);
    piezas.push({
      id: 'piez-arco-rolado',
      marca: 'ARC-01',
      descripcion: `Tubo Rolado Superior Arco (${design.arco.tipo.replace('_', ' ').toUpperCase()} Flecha: ${(h * 100).toFixed(0)}cm)`,
      perfilNombre: pArco.nombre,
      perfilDimensiones: pArco.dimensiones,
      material: pArco.familia,
      longitudMm: Math.round(longArcoM * 1000),
      longitudM: longArcoM,
      cantidad: 1,
      corteInicio: '45°',
      corteFin: '45°',
      pesoUnitarioKg: longArcoM * pArco.pesoKgPorMetro,
      pesoTotalKg: longArcoM * pArco.pesoKgPorMetro,
      ubicacion: 'marco'
    });

    if (design.arco.conBarrotesRadiales && (design.arco.cantidadBarrotesArco || 0) > 0) {
      const cant = design.arco.cantidadBarrotesArco || 5;
      const pBarrote = PERFILES_CATALOGO.find(p => p.id === design.barrotesConfig?.perfilId) || PERFILES_CATALOGO[9];
      const longPromedioM = h * 0.7;
      piezas.push({
        id: 'piez-barrotes-arco',
        marca: 'ARC-B',
        descripcion: 'Barrotes de Ventilación / Relleno de Arco',
        perfilNombre: pBarrote.nombre,
        perfilDimensiones: pBarrote.dimensiones,
        material: pBarrote.familia,
        longitudMm: Math.round(longPromedioM * 1000),
        longitudM: Math.round(longPromedioM * 100) / 100,
        cantidad: cant,
        corteInicio: '90°',
        corteFin: 'otro',
        pesoUnitarioKg: longPromedioM * pBarrote.pesoKgPorMetro,
        pesoTotalKg: longPromedioM * pBarrote.pesoKgPorMetro * cant,
        ubicacion: 'barrote'
      });
    }
  }

  // Métricas totales
  const totalPiezas = piezas.reduce((acc, p) => acc + p.cantidad, 0);
  const longitudTotalPerfilesM = piezas.reduce((acc, p) => acc + (p.longitudM * p.cantidad), 0);
  const pesoTotalAceroKg = piezas.reduce((acc, p) => acc + p.pesoTotalKg, 0);
  const barrasComerciales6m = Math.ceil((longitudTotalPerfilesM * 1.08) / 6); // con 8% de merma técnica
  const desperdicioEstimadoPct = 8.5;

  // Optimización de barras comerciales
  const optimizacionBarras = optimizarCortes(piezas, 6);

  return {
    piezas,
    totalPiezas,
    longitudTotalPerfilesM: Math.round(longitudTotalPerfilesM * 100) / 100,
    pesoTotalAceroKg: Math.round(pesoTotalAceroKg * 10) / 10,
    barrasComerciales6m,
    desperdicioEstimadoPct,
    optimizacionBarras
  };
}

// Algoritmo de Optimización de Corte 1D (First Fit Decreasing)
export function optimizarCortes(piezas: PiezaDespiece[], longitudBarraM: number = 6): BarraOptimizada[] {
  const longitudBarraMm = longitudBarraM * 1000;
  const anchoDiscoCorteMm = 3; // 3mm por corte con disco abrasivo

  // Desenrollar todas las piezas individuales agrupadas por perfil
  const itemsPorPerfil: { [perfil: string]: { marca: string; longitudMm: number }[] } = {};

  piezas.forEach(p => {
    if (!itemsPorPerfil[p.perfilNombre]) {
      itemsPorPerfil[p.perfilNombre] = [];
    }
    for (let i = 0; i < p.cantidad; i++) {
      itemsPorPerfil[p.perfilNombre].push({
        marca: p.marca,
        longitudMm: p.longitudMm
      });
    }
  });

  const barrasOptimizadas: BarraOptimizada[] = [];
  let barraGlobalIndex = 1;

  Object.keys(itemsPorPerfil).forEach(perfilNombre => {
    const piezasPerfil = itemsPorPerfil[perfilNombre];
    // Ordenar de mayor a menor longitud (heurística FFD)
    piezasPerfil.sort((a, b) => b.longitudMm - a.longitudMm);

    const barrasPerfil: {
      piezas: { marca: string; longitudMm: number }[];
      longitudUsadaMm: number;
    }[] = [];

    piezasPerfil.forEach(pieza => {
      let colocada = false;
      for (const b of barrasPerfil) {
        if (b.longitudUsadaMm + pieza.longitudMm + anchoDiscoCorteMm <= longitudBarraMm) {
          b.piezas.push(pieza);
          b.longitudUsadaMm += pieza.longitudMm + anchoDiscoCorteMm;
          colocada = true;
          break;
        }
      }
      if (!colocada) {
        barrasPerfil.push({
          piezas: [pieza],
          longitudUsadaMm: pieza.longitudMm + anchoDiscoCorteMm
        });
      }
    });

    barrasPerfil.forEach(b => {
      const sobranteMm = Math.max(0, longitudBarraMm - b.longitudUsadaMm);
      const porcentajeAprovechamiento = Math.round(((longitudBarraMm - sobranteMm) / longitudBarraMm) * 1000) / 10;
      barrasOptimizadas.push({
        barraIndex: barraGlobalIndex++,
        longitudComercialM: longitudBarraM,
        perfilNombre,
        piezas: b.piezas,
        longitudUsadaMm: b.longitudUsadaMm,
        sobranteMm,
        porcentajeAprovechamiento
      });
    });
  });

  return barrasOptimizadas;
}

// Generador de Materiales Agrupados
export function generarMaterialesAgrupados(design: HerreriaDesign, despiece: DespieceResult): MaterialAgrupado[] {
  if (disenoSinContenido(design)) return [];
  const agrupados: { [cat: string]: any[] } = {
    perfiles: [],
    planchas: [],
    mallas: [],
    vidrios: [],
    bisagras: [],
    cerraduras: [],
    ruedas: [],
    rieles: [],
    tornillos: [],
    soldadura: [],
    pintura: []
  };

  // 1. PERFILES (Agrupados por perfil de catálogo y barras de 6m calculadas)
  const perfilesMap: { [id: string]: { perfil: PerfilCatalogo; metrosTotales: number; pesoKg: number } } = {};
  
  despiece.piezas.forEach(p => {
    const perfilCat = PERFILES_CATALOGO.find(cat => cat.nombre === p.perfilNombre) || PERFILES_CATALOGO[1];
    if (!perfilesMap[perfilCat.id]) {
      perfilesMap[perfilCat.id] = { perfil: perfilCat, metrosTotales: 0, pesoKg: 0 };
    }
    perfilesMap[perfilCat.id].metrosTotales += p.longitudM * p.cantidad;
    perfilesMap[perfilCat.id].pesoKg += p.pesoTotalKg;
  });

  Object.values(perfilesMap).forEach(item => {
    const barras6m = Math.ceil((item.metrosTotales * 1.08) / 6);
    const precioBarra = precioBarraPerfil(item.perfil, item.perfil.precioPorBarra6m);
    const subtotal = barras6m * precioBarra;
    agrupados.perfiles.push({
      id: item.perfil.id,
      nombre: item.perfil.nombre,
      unidad: 'barra 6m',
      cantidad: barras6m,
      precioUnitario: precioBarra,
      subtotal,
      observacion: `Requerido: ${item.metrosTotales.toFixed(2)}m (${item.pesoKg.toFixed(1)} kg)`
    });
  });

  // 2. PLANCHAS Y LÁMINAS ACANALADAS / CORRUGADAS / LISAS
  const panelesPlancha = design.paneles.filter(p => p.tipoRelleno === 'plancha' || p.tipoRelleno === 'plancha_estriada' || p.tipoRelleno === 'plancha_perforada');
  const piezasPlancha = (design.piezas || []).filter(p => p.esPlancha);

  let areaAcanaladaM2 = 0;
  let areaLisaM2 = 0;

  panelesPlancha.forEach(p => {
    const wM = (design.anchoM / Math.max(1, design.numHojas)) * p.relW;
    const hM = design.altoM * p.relH;
    const area = wM * hM;
    if (p.planchaConfig?.subtipo === 'acanalada' || p.planchaConfig?.subtipo === 'machihembrada' || p.planchaConfig?.subtipo === 'corrugada') {
      areaAcanaladaM2 += area;
    } else {
      areaLisaM2 += area;
    }
  });

  piezasPlancha.forEach(pz => {
    const area = (pz.anchoPlanchaM || 1) * (pz.altoPlanchaM || 1);
    if (pz.subtipoPlancha === 'acanalada' || pz.subtipoPlancha === 'machihembrada' || pz.subtipoPlancha === 'corrugada') {
      areaAcanaladaM2 += area;
    } else {
      areaLisaM2 += area;
    }
  });

  if (areaAcanaladaM2 > 0) {
    const planchasComerciales = Math.max(1, Math.ceil(areaAcanaladaM2 / (1.00 * 2.40)));
    const precioPlancha = precio('carpi:plancha_acanalada', 128); // catálogo de precios
    agrupados.planchas.push({
      id: 'plancha-acanalada-1.2',
      nombre: 'Plancha Acanalada / Corrugada LAC 1.2mm (Panel Cerrajería 1.00m × 2.40m)',
      unidad: 'pln',
      cantidad: planchasComerciales,
      precioUnitario: precioPlancha,
      subtotal: planchasComerciales * precioPlancha,
      observacion: `Panel rígido acanalado corrugada • Área calculada: ${areaAcanaladaM2.toFixed(2)} m²`
    });
  }

  if (areaLisaM2 > 0) {
    const planchasComerciales = Math.max(1, Math.ceil(areaLisaM2 / (1.20 * 2.40)));
    const precioPlancha = precio('carpi:plancha_lisa', 135);
    agrupados.planchas.push({
      id: 'plancha-lac-1/16',
      nombre: 'Plancha LAC 1/16" (1.5mm) 1.20m × 2.40m',
      unidad: 'pln',
      cantidad: planchasComerciales,
      precioUnitario: precioPlancha,
      subtotal: planchasComerciales * precioPlancha,
      observacion: `Área neta calculada: ${areaLisaM2.toFixed(2)} m²`
    });
  }

  // 3. MALLAS
  const panelesMalla = design.paneles.filter(p => p.tipoRelleno === 'malla');
  if (panelesMalla.length > 0) {
    let areaMallaM2 = 0;
    panelesMalla.forEach(p => {
      areaMallaM2 += (design.anchoM / Math.max(1, design.numHojas) * p.relW) * (design.altoM * p.relH);
    });
    const precioMalla = precio('carpi:malla', 45);
    const subtotal = areaMallaM2 * precioMalla;
    agrupados.mallas.push({
      id: 'malla-electrosoldada',
      nombre: 'Malla Electrosoldada Galvanizada 50x50x3mm',
      unidad: 'm²',
      cantidad: Math.round(areaMallaM2 * 100) / 100,
      precioUnitario: precioMalla,
      subtotal,
      observacion: 'Corte e instalación en marco'
    });
  }

  // 4. VIDRIOS
  const panelesVidrio = design.paneles.filter(p => p.tipoRelleno === 'vidrio');
  if (panelesVidrio.length > 0) {
    let areaVidrioM2 = 0;
    panelesVidrio.forEach(p => {
      areaVidrioM2 += (design.anchoM / Math.max(1, design.numHojas) * p.relW) * (design.altoM * p.relH);
    });
    const precioM2 = precio('carpi:vidrio', 110);
    agrupados.vidrios.push({
      id: 'vidrio-templado-6mm',
      nombre: 'Vidrio Templado Incoloro 6mm con Bordes Pulidos',
      unidad: 'm²',
      cantidad: Math.round(areaVidrioM2 * 100) / 100,
      precioUnitario: precioM2,
      subtotal: Math.round(areaVidrioM2 * precioM2),
      observacion: 'Cintas estructurales 3M y silicona neutra'
    });
  }

  // 5. ACCESORIOS (Bisagras, cerraduras, ruedas, rieles, etc.)
  if (design.accesoriosCad && design.accesoriosCad.length > 0) {
    design.accesoriosCad.forEach(acc => {
      const pu = tienePrecioPropio(`carpicad:${acc.tipo}`) ? precio(`carpicad:${acc.tipo}`) : acc.precioUnitario;
      const sub = acc.cantidad * pu;
      const item = {
        id: acc.id,
        nombre: acc.nombre,
        unidad: 'und',
        cantidad: acc.cantidad,
        precioUnitario: pu,
        subtotal: sub,
        observacion: acc.especificacion || acc.descripcion || ''
      };
      if (acc.tipo.includes('bisagra')) agrupados.bisagras.push(item);
      else if (acc.tipo.includes('chapa') || acc.tipo.includes('cerradura') || acc.tipo.includes('cerrojo')) agrupados.cerraduras.push(item);
      else if (acc.tipo.includes('rueda')) agrupados.ruedas.push(item);
      else if (acc.tipo.includes('placa_base') || acc.tipo.includes('escuadra')) agrupados.tornillos.push(item);
      else agrupados.tornillos.push(item);
    });
  }

  if (design.accesorios) {
    design.accesorios.filter(a => a.incluido).forEach(acc => {
      const pu = tienePrecioPropio(`carpi:${acc.id}`) ? precio(`carpi:${acc.id}`) : acc.precioUnitario; // catálogo único (o el del diseño)
      const sub = acc.cantidad * pu;
      const item = {
        id: acc.id,
        nombre: acc.nombre,
        unidad: acc.unidad,
        cantidad: acc.cantidad,
        precioUnitario: pu,
        subtotal: sub,
        observacion: acc.descripcion
      };
      if (acc.categoria === 'bisagra') agrupados.bisagras.push(item);
      else if (acc.categoria === 'cerradura') agrupados.cerraduras.push(item);
      else if (acc.categoria === 'rueda') agrupados.ruedas.push(item);
      else if (acc.categoria === 'riel') agrupados.rieles.push(item);
      else agrupados.tornillos.push(item);
    });
  }

  // 6. TORNILLOS Y ANCLAJES (Si hay piezas pero no se definieron anclajes)
  if (despiece.totalPiezas > 0 && agrupados.tornillos.length === 0) {
    agrupados.tornillos.push({
      id: 'pernos-anclaje-std',
      nombre: 'Pernos de Expansión Hilti 3/8" x 3 1/2" + Arandelas',
      unidad: 'jgo',
      cantidad: 8,
      precioUnitario: precio('carpi:perno_expansion', 4.5),
      subtotal: 8 * precio('carpi:perno_expansion', 4.5),
      observacion: 'Fijación y anclaje de estructura'
    });
  }

  // 7. CONSUMIBLES: SOLDADURA Y DISCOS (Solo si hay piezas de acero)
  if (despiece.totalPiezas > 0) {
    const kilosSoldadura = Math.max(1, Math.round(despiece.pesoTotalAceroKg * 0.025 * 10) / 10);
    const cantDiscosCorte = Math.max(2, Math.ceil(despiece.totalPiezas / 4));
    agrupados.soldadura.push({
      id: 'electrodos-6011-7018',
      nombre: 'Electrodos E6011 / E7018 1/8" Conarco / Indura',
      unidad: 'kg',
      cantidad: kilosSoldadura,
      precioUnitario: precio('soldadura:kg', 22),
      subtotal: kilosSoldadura * precio('soldadura:kg', 22),
      observacion: 'Cordón continuo y de penetración'
    });
    agrupados.soldadura.push({
      id: 'discos-corte-4.5',
      nombre: 'Discos de Corte Extra Fino 4 1/2" Norton / DeWalt',
      unidad: 'und',
      cantidad: cantDiscosCorte,
      precioUnitario: precio('carpi:disco_corte', 5.5),
      subtotal: cantDiscosCorte * precio('carpi:disco_corte', 5.5),
      observacion: 'Cortes limpios a 90° y 45°'
    });
    agrupados.soldadura.push({
      id: 'discos-corte-desbaste',
      nombre: 'Discos de Corte Fino 4 1/2" + Discos Flap de Esmerilado',
      unidad: 'und',
      cantidad: cantDiscosCorte,
      precioUnitario: precio('carpi:disco_desbaste', 8.5),
      subtotal: cantDiscosCorte * precio('carpi:disco_desbaste', 8.5),
      observacion: 'Corte limpio y desbaste de cordones'
    });

    // 8. PINTURA
    const areaTotalPinturaM2 = Math.round((design.anchoM * design.altoM * 2.2) * 10) / 10;
    const galonesPintura = Math.max(1, Math.ceil(areaTotalPinturaM2 / 12));
    agrupados.pintura.push({
      id: 'pintura-anticorrosiva-esmalte',
      nombre: `Pintura Base Anticorrosiva Epóxica + Esmalte (${design.acabado.colorNombre})`,
      unidad: 'gal',
      cantidad: galonesPintura,
      precioUnitario: precio('pintura:anticorrosiva', 65),
      subtotal: galonesPintura * precio('pintura:anticorrosiva', 65),
      observacion: `Área superficial calculada: ${areaTotalPinturaM2} m²`
    });
    agrupados.pintura.push({
      id: 'diluyente-thinner-acrilico',
      nombre: 'Thinner Acrílico Extra para Limpieza y Dilución',
      unidad: 'gal',
      cantidad: 1,
      precioUnitario: precio('pintura:thinner', 25),
      subtotal: precio('pintura:thinner', 25),
      observacion: 'Desengrase y aplicación con soplete'
    });
  }

  // Armar lista de categorías formales
  const categorias: { key: MaterialAgrupado['categoria']; label: string }[] = [
    { key: 'perfiles', label: 'Perfiles Metálicos' },
    { key: 'planchas', label: 'Planchas y Coberturas' },
    { key: 'mallas', label: 'Mallas y Tejidos' },
    { key: 'vidrios', label: 'Vidrios y Cristales' },
    { key: 'bisagras', label: 'Bisagras y Pivotes' },
    { key: 'cerraduras', label: 'Cerraduras y Cerrojos' },
    { key: 'ruedas', label: 'Ruedas y Rodamientos' },
    { key: 'rieles', label: 'Rieles y Guías' },
    { key: 'tornillos', label: 'Tornillería y Anclajes' },
    { key: 'soldadura', label: 'Soldadura y Abrasivos' },
    { key: 'pintura', label: 'Pintura y Acabados' }
  ];

  return categorias.map(c => {
    const items = agrupados[c.key] || [];
    const subtotalCategoria = items.reduce((sum: number, it: any) => sum + it.subtotal, 0);
    return {
      categoria: c.key,
      items,
      subtotalCategoria
    };
  }) as MaterialAgrupado[];
}

// Desglose de Costos por Rubro (Materiales, Corte, Soldadura, Armado, Esmerilado, Pintura, Accesorios, Instalación, Transporte)
export function calcularCostosDesglosados(design: HerreriaDesign, materialesAgrupados: MaterialAgrupado[]): CostoDesglosado {
  const subtotalMateriales = materialesAgrupados
    .filter(m => m.categoria !== 'bisagras' && m.categoria !== 'cerraduras' && m.categoria !== 'ruedas' && m.categoria !== 'rieles')
    .reduce((sum, m) => sum + m.subtotalCategoria, 0);

  const subtotalAccesorios = materialesAgrupados
    .filter(m => m.categoria === 'bisagras' || m.categoria === 'cerraduras' || m.categoria === 'ruedas' || m.categoria === 'rieles')
    .reduce((sum, m) => sum + m.subtotalCategoria, 0);

  const mo = design.manoDeObra;
  if (disenoSinContenido(design)) {
    return { materiales: 0, corte: 0, soldadura: 0, armado: 0, esmerilado: 0, pintura: 0, accesorios: 0, instalacion: 0, transporte: 0,
      costoDirectoTotal: 0, gastosGenerales: 0, utilidad: 0, subtotal: 0, igv: 0, precioTotalVenta: 0 };
  }

  const corte = mo.costoCorteHoras || 80;
  const soldadura = mo.costoSoldaduraHoras || 150;
  const armado = mo.costoArmadoHoras || 140;
  const esmerilado = mo.costoEsmeriladoHoras || 70;
  const pintura = mo.costoPinturaHoras || 110;
  const instalacion = mo.costoInstalacion || 250;
  const transporte = mo.costoTransporte || 100;

  const costoDirectoTotal = 
    subtotalMateriales + 
    subtotalAccesorios + 
    corte + 
    soldadura + 
    armado + 
    esmerilado + 
    pintura + 
    instalacion + 
    transporte;

  const gastosGenerales = Math.round(costoDirectoTotal * 0.10); // 10%
  const utilidad = Math.round(costoDirectoTotal * 0.20); // 20%
  const subtotal = costoDirectoTotal + gastosGenerales + utilidad;
  const igv = 0; // Sin impuestos automaticos
  const precioTotalVenta = subtotal;

  return {
    materiales: subtotalMateriales,
    corte,
    soldadura,
    armado,
    esmerilado,
    pintura,
    accesorios: subtotalAccesorios,
    instalacion,
    transporte,
    costoDirectoTotal,
    gastosGenerales,
    utilidad,
    subtotal,
    igv,
    precioTotalVenta
  };
}

// Generador de Presupuesto Formal para el Sistema de Innova Contratistas.
// Reparte EXACTAMENTE los mismos costos de la "Estructura de costos" en partidas
// y aplica los mismos gastos generales y utilidad, para que ambos cuadren.
export function generarPresupuesto(design: HerreriaDesign, costos: CostoDesglosado, despiece: DespieceResult): PresupuestoHerreriaResult {
  const items: ItemPresupuestoHerreria[] = [];
  const areaM2 = design.anchoM * design.altoM;
  const areaPintura = Math.max(0.1, areaM2 * 2.2);
  // Precio de venta / costo directo (incluye gastos generales y utilidad).
  const factor = costos.costoDirectoTotal > 0 ? costos.subtotal / costos.costoDirectoTotal : 1.3;
  const partida = (p: Omit<ItemPresupuestoHerreria, 'precioUnitario' | 'subtotal'>): ItemPresupuestoHerreria => {
    const subtotal = (p.material + p.manoDeObra) * factor;
    return { ...p, precioUnitario: subtotal / Math.max(0.0001, p.cantidad), subtotal };
  };

  // 1. Estructura y Marco Principal
  items.push(partida({
    id: 'item-marco-bastidor',
    descripcion: `Fabricación de marco perimétrico (${design.anchoM.toFixed(2)}m × ${design.altoM.toFixed(2)}m) y bastidores en tubo rectangular de acero estructural`,
    unidad: 'und',
    cantidad: 1,
    metrado: areaM2,
    material: costos.materiales * 0.55,
    manoDeObra: costos.corte + costos.armado,
    observaciones: `Peso acero estructural: ~${despiece.pesoTotalAceroKg.toFixed(1)} kg`
  }));

  // 2. Relleno, Barrotes y Paneles
  items.push(partida({
    id: 'item-barrotes-paneles',
    descripcion: `Habilitado y soldado de paños (${design.nombre}), refuerzos y cerramientos según diseño CAD`,
    unidad: 'm²',
    cantidad: Math.max(0.1, Math.round(areaM2 * 10) / 10),
    metrado: areaM2,
    material: costos.materiales * 0.45,
    manoDeObra: costos.soldadura + costos.esmerilado,
    observaciones: `${despiece.totalPiezas} piezas cortadas y desbastadas a ras`
  }));

  // 3. Accesorios, Cerrajería y Rodajes (solo si hay)
  if (costos.accesorios > 0) {
    items.push(partida({
      id: 'item-accesorios',
      descripcion: 'Suministro e instalación de bisagras, cerraduras, pasadores, rieles y herrajes',
      unidad: 'gl',
      cantidad: 1,
      metrado: 1,
      material: costos.accesorios,
      manoDeObra: 0,
      observaciones: 'Herrajes según la lista de materiales'
    }));
  }

  // 4. Tratamiento Anticorrosivo y Pintura (mano de obra; la pintura está en materiales)
  items.push(partida({
    id: 'item-pintura',
    descripcion: `Limpieza, desengrasado, 2 manos de base anticorrosiva y esmalte de acabado (${design.acabado.colorNombre})`,
    unidad: 'm²',
    cantidad: Math.round(areaPintura * 10) / 10,
    metrado: areaPintura,
    material: 0,
    manoDeObra: costos.pintura,
    observaciones: 'Acabado profesional con pistola / soplete'
  }));

  // 5. Transporte e Instalación en Obra
  items.push(partida({
    id: 'item-montaje',
    descripcion: 'Transporte desde el taller, flete, acarreo, izaje, nivelación y anclaje con pernos expansivos al vano',
    unidad: 'gl',
    cantidad: 1,
    metrado: 1,
    material: 0,
    manoDeObra: costos.instalacion + costos.transporte,
    observaciones: 'Incluye pruebas de cierre, ajuste de cerradura y entrega conforme'
  }));

  const totalPresupuestoPEN = costos.subtotal;
  return {
    items,
    costoDirecto: costos.costoDirectoTotal,
    gastosGeneralesPct: 10,
    gastosGeneralesMonto: costos.gastosGenerales,
    utilidadPct: 20,
    utilidadMonto: costos.utilidad,
    subtotalSinIgv: costos.subtotal,
    igvPct: 0,
    igvMonto: 0,
    totalPresupuestoPEN,
    costoPorM2PEN: Math.round(totalPresupuestoPEN / Math.max(0.1, areaM2))
  };
}
