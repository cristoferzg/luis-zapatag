// Motor de cálculos matemáticos, estructurales, despiece y metrados para Carpintería Metálica
import { 
  PuertaVentanaDesign, 
  PerfilCatalogo, 
  PiezaDespiece, 
  DespieceResult, 
  BarraOptimizada,
  MetradoCarpinteriaItem, 
  PresupuestoCarpinteriaResult 
} from './carpinteriaTypes';
import { PERFILES_CATALOGO } from './carpinteriaCatalog';

// Cálculo paramétrico de barrotes de reja
export function calcularEspaciadoReja(
  anchoLibreM: number,
  espaciadoObjetivoCm: number,
  anchoPerfilBarroteMm: number
) {
  const anchoLibreCm = anchoLibreM * 100;
  const anchoBarraCm = anchoPerfilBarroteMm / 10;
  
  if (anchoLibreCm <= 0 || espaciadoObjetivoCm <= 0) {
    return { cantBarras: 0, separacionRealCm: espaciadoObjetivoCm };
  }

  // Fórmula: anchoLibre = n * barra + (n + 1) * espacio
  // n = (anchoLibre - espacio) / (barra + espacio)
  const nEstimado = Math.round((anchoLibreCm - espaciadoObjetivoCm) / (anchoBarraCm + espaciadoObjetivoCm));
  const cantBarras = Math.max(1, nEstimado);
  
  // Separación exacta entre caras de barrotes
  const separacionRealCm = (anchoLibreCm - cantBarras * anchoBarraCm) / (cantBarras + 1);

  return {
    cantBarras,
    separacionRealCm: Math.round(separacionRealCm * 10) / 10
  };
}

// Generador de Despiece (Cutting List) con optimización de barras de 6m
export function generarDespiece(design: PuertaVentanaDesign): DespieceResult {
  const piezas: PiezaDespiece[] = [];
  
  const perfilMarco = PERFILES_CATALOGO.find(p => p.id === design.perfilMarcoId) || PERFILES_CATALOGO[2];
  const perfilBastidor = PERFILES_CATALOGO.find(p => p.id === design.perfilBastidorId) || PERFILES_CATALOGO[7];
  const perfilRefuerzo = PERFILES_CATALOGO.find(p => p.id === design.perfilRefuerzoId) || PERFILES_CATALOGO[4];

  const marcoAnchoMm = perfilMarco.anchoMm;
  const bastidorAnchoMm = perfilBastidor.anchoMm;

  // 1. MARCO PERIMÉTRICO
  // Si es puerta o portón abatible: normalmente 2 laterales + 1 cabezal superior (sin umbral inferior o con solera)
  const tieneUmbral = design.tipoElemento === 'ventana' || design.tipoElemento === 'reja' || design.tipoElemento === 'mampara';
  
  // Marco Superior
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

  // Marco Laterales (2 unidades)
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
    corteFin: tieneUmbral ? '45°' : '90°',
    pesoUnitarioKg: design.altoM * perfilMarco.pesoKgPorMetro,
    pesoTotalKg: design.altoM * perfilMarco.pesoKgPorMetro * 2,
    ubicacion: 'marco'
  });

  // Marco Inferior (si tiene umbral cerrado)
  if (tieneUmbral) {
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
  const holguraLuzMm = 8; // holgura perimétrica estándar en mm
  const holguraEntreHojasMm = (numHojas - 1) * 6;
  
  const vanoInteriorAnchoMm = (design.anchoM * 1000) - (2 * marcoAnchoMm);
  const vanoInteriorAltoMm = (design.altoM * 1000) - (tieneUmbral ? 2 * marcoAnchoMm : marcoAnchoMm);
  
  const anchoHojaMm = Math.max(100, Math.round((vanoInteriorAnchoMm - holguraLuzMm * 2 - holguraEntreHojasMm) / numHojas));
  const altoHojaMm = Math.max(100, Math.round(vanoInteriorAltoMm - holguraLuzMm * 2));

  // Bastidor Verticales por Hoja (2 por cada hoja)
  const cantMontantesHoja = numHojas * 2;
  piezas.push({
    id: 'piez-b-vert',
    marca: 'B-01',
    descripcion: `Bastidor Montantes Verticales (${numHojas} ${numHojas > 1 ? 'hojas' : 'hoja'})`,
    perfilNombre: perfilBastidor.nombre,
    perfilDimensiones: perfilBastidor.dimensiones,
    material: perfilBastidor.familia,
    longitudMm: altoHojaMm,
    longitudM: altoHojaMm / 1000,
    cantidad: cantMontantesHoja,
    corteInicio: '45°',
    corteFin: '45°',
    pesoUnitarioKg: (altoHojaMm / 1000) * perfilBastidor.pesoKgPorMetro,
    pesoTotalKg: (altoHojaMm / 1000) * perfilBastidor.pesoKgPorMetro * cantMontantesHoja,
    ubicacion: 'hoja'
  });

  // Bastidor Horizontales por Hoja (2 por cada hoja: zócalo y cabezal)
  const cantTravesañosHoja = numHojas * 2;
  piezas.push({
    id: 'piez-b-horiz',
    marca: 'B-02',
    descripcion: `Bastidor Travesaños Zócalo y Cabezal (${numHojas} ${numHojas > 1 ? 'hojas' : 'hoja'})`,
    perfilNombre: perfilBastidor.nombre,
    perfilDimensiones: perfilBastidor.dimensiones,
    material: perfilBastidor.familia,
    longitudMm: anchoHojaMm,
    longitudM: anchoHojaMm / 1000,
    cantidad: cantTravesañosHoja,
    corteInicio: '45°',
    corteFin: '45°',
    pesoUnitarioKg: (anchoHojaMm / 1000) * perfilBastidor.pesoKgPorMetro,
    pesoTotalKg: (anchoHojaMm / 1000) * perfilBastidor.pesoKgPorMetro * cantTravesañosHoja,
    ubicacion: 'hoja'
  });

  // 3. DIVISIONES Y REFUERZOS INTERIORES
  if (design.divisiones && design.divisiones.length > 0) {
    design.divisiones.forEach((div, idx) => {
      const pDiv = PERFILES_CATALOGO.find(p => p.id === div.perfilId) || perfilRefuerzo;
      const longMm = Math.round(
        div.tipo === 'travesaño_horizontal' 
          ? (anchoHojaMm - 2 * bastidorAnchoMm) 
          : (altoHojaMm - 2 * bastidorAnchoMm)
      );
      piezas.push({
        id: `piez-ref-${div.id}`,
        marca: `R-0${idx + 1}`,
        descripcion: `Refuerzo Interior: ${div.tipo.replace(/_/g, ' ')}`,
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

  // 4. BARROTES DE REJA (si hay paneles de reja)
  const panelesReja = design.paneles.filter(p => 
    p.tipoRelleno === 'reja_vertical' || 
    p.tipoRelleno === 'reja_horizontal' || 
    p.tipoRelleno === 'reja_cuadricula'
  );

  panelesReja.forEach((panel, pIdx) => {
    const pBarra = PERFILES_CATALOGO.find(p => p.id === (panel.perfilRejaId || 'cuad-1/2x1/2-solido')) || PERFILES_CATALOGO[11];
    const anchoPanelLibreMm = (anchoHojaMm - 2 * bastidorAnchoMm) * panel.relW;
    const altoPanelLibreMm = (altoHojaMm - 2 * bastidorAnchoMm) * panel.relH;
    
    const calc = calcularEspaciadoReja(
      anchoPanelLibreMm / 1000, 
      panel.espaciadoRejaCm || 11, 
      pBarra.anchoMm
    );

    const cantTotalBarras = calc.cantBarras * numHojas;
    const longBarraMm = Math.max(100, Math.round(altoPanelLibreMm));

    piezas.push({
      id: `piez-bar-${panel.id}`,
      marca: `BAR-0${pIdx + 1}`,
      descripcion: `Barrotes Verticales Reja (${calc.cantBarras} barras x ${numHojas} hojas @ ${calc.separacionRealCm}cm)`,
      perfilNombre: pBarra.nombre,
      perfilDimensiones: pBarra.dimensiones,
      material: pBarra.familia,
      longitudMm: longBarraMm,
      longitudM: longBarraMm / 1000,
      cantidad: cantTotalBarras,
      corteInicio: '90°',
      corteFin: '90°',
      pesoUnitarioKg: (longBarraMm / 1000) * pBarra.pesoKgPorMetro,
      pesoTotalKg: (longBarraMm / 1000) * pBarra.pesoKgPorMetro * cantTotalBarras,
      ubicacion: 'barrote'
    });
  });

  // 5. PUERTA PEATONAL INTEGRADA EN PORTÓN (si aplica)
  if (design.portonConfig?.puertaPeatonalIntegrada) {
    const peatonalAnchoMm = Math.round((design.portonConfig.peatonalAnchoM || 0.85) * 1000);
    const peatonalAltoMm = Math.round((design.portonConfig.peatonalAltoM || 2.00) * 1000);
    
    piezas.push({
      id: 'piez-peatonal-vert',
      marca: 'PT-01',
      descripcion: 'Marco / Bastidor Puerta Peatonal de Escape (Montantes)',
      perfilNombre: perfilBastidor.nombre,
      perfilDimensiones: perfilBastidor.dimensiones,
      material: perfilBastidor.familia,
      longitudMm: peatonalAltoMm,
      longitudM: peatonalAltoMm / 1000,
      cantidad: 4, // 2 para marco y 2 para hoja
      corteInicio: '45°',
      corteFin: '45°',
      pesoUnitarioKg: (peatonalAltoMm / 1000) * perfilBastidor.pesoKgPorMetro,
      pesoTotalKg: (peatonalAltoMm / 1000) * perfilBastidor.pesoKgPorMetro * 4,
      ubicacion: 'hoja'
    });

    piezas.push({
      id: 'piez-peatonal-horiz',
      marca: 'PT-02',
      descripcion: 'Marco / Bastidor Puerta Peatonal de Escape (Travesaños)',
      perfilNombre: perfilBastidor.nombre,
      perfilDimensiones: perfilBastidor.dimensiones,
      material: perfilBastidor.familia,
      longitudMm: peatonalAnchoMm,
      longitudM: peatonalAnchoMm / 1000,
      cantidad: 4,
      corteInicio: '45°',
      corteFin: '45°',
      pesoUnitarioKg: (peatonalAnchoMm / 1000) * perfilBastidor.pesoKgPorMetro,
      pesoTotalKg: (peatonalAnchoMm / 1000) * perfilBastidor.pesoKgPorMetro * 4,
      ubicacion: 'hoja'
    });
  }

  // Optimización de Barras de 6.00m (Algoritmo First Fit Decreasing)
  const barrasOptimizadas = optimizarCorteEnBarras6m(piezas);
  const totalPiezas = piezas.reduce((sum, p) => sum + p.cantidad, 0);
  const longitudTotalPerfilesM = piezas.reduce((sum, p) => sum + p.longitudM * p.cantidad, 0);
  const pesoTotalAceroKg = piezas.reduce((sum, p) => sum + p.pesoTotalKg, 0);

  const barrasComerciales6m = barrasOptimizadas.length;
  const longitudComercialTotalM = barrasComerciales6m * 6.0;
  const desperdicioEstimadoPct = longitudComercialTotalM > 0 
    ? Math.max(4, Math.round(((longitudComercialTotalM - longitudTotalPerfilesM) / longitudComercialTotalM) * 100))
    : 8;

  return {
    piezas,
    totalPiezas,
    longitudTotalPerfilesM: Math.round(longitudTotalPerfilesM * 100) / 100,
    pesoTotalAceroKg: Math.round(pesoTotalAceroKg * 10) / 10,
    barrasComerciales6m,
    desperdicioEstimadoPct,
    optimizacionBarras: barrasOptimizadas
  };
}

// Algoritmo de optimización 1D para corte de barras comerciales de 6000 mm
function optimizarCorteEnBarras6m(piezas: PiezaDespiece[]): BarraOptimizada[] {
  const LARGO_BARRA_MM = 6000;
  const ESPESOR_CORTE_SIERRA_MM = 3; // 3mm por disco de corte

  // Expandir todas las piezas individuales y ordenar de mayor a menor
  const cortes: { marca: string; longitudMm: number }[] = [];
  piezas.forEach(p => {
    for (let i = 0; i < p.cantidad; i++) {
      cortes.push({ marca: p.marca, longitudMm: p.longitudMm });
    }
  });

  cortes.sort((a, b) => b.longitudMm - a.longitudMm);

  const barras: BarraOptimizada[] = [];

  cortes.forEach(c => {
    let colocada = false;
    for (const b of barras) {
      if (b.retazoMm >= c.longitudMm + ESPESOR_CORTE_SIERRA_MM) {
        b.piezas.push(c);
        b.longitudUsadaMm += c.longitudMm + ESPESOR_CORTE_SIERRA_MM;
        b.retazoMm = LARGO_BARRA_MM - b.longitudUsadaMm;
        b.porcentajeAprovechamiento = Math.round((b.longitudUsadaMm / LARGO_BARRA_MM) * 100);
        colocada = true;
        break;
      }
    }

    if (!colocada) {
      const usada = c.longitudMm + ESPESOR_CORTE_SIERRA_MM;
      barras.push({
        barraIndex: barras.length + 1,
        longitudComercialM: 6.0,
        piezas: [c],
        longitudUsadaMm: usada,
        retazoMm: LARGO_BARRA_MM - usada,
        porcentajeAprovechamiento: Math.round((usada / LARGO_BARRA_MM) * 100)
      });
    }
  });

  return barras;
}

// Calculadora integral de Metrados, Presupuesto y Costos
export function calcularPresupuestoCarpinteria(design: PuertaVentanaDesign): PresupuestoCarpinteriaResult {
  const despiece = generarDespiece(design);
  const areaTotalVanoM2 = Math.max(0.1, design.anchoM * design.altoM);
  
  const items: MetradoCarpinteriaItem[] = [];

  // 1. PERFILES ESTRUCTURALES (Agrupados por perfil comercial)
  const barrasPorPerfil: Record<string, { perfil: PerfilCatalogo; cantPiezas: number; longTotalM: number }> = {};

  despiece.piezas.forEach(p => {
    const perf = PERFILES_CATALOGO.find(item => item.nombre === p.perfilNombre) || PERFILES_CATALOGO[2];
    if (!barrasPorPerfil[perf.id]) {
      barrasPorPerfil[perf.id] = { perfil: perf, cantPiezas: 0, longTotalM: 0 };
    }
    barrasPorPerfil[perf.id].cantPiezas += p.cantidad;
    barrasPorPerfil[perf.id].longTotalM += p.longitudM * p.cantidad;
  });

  Object.values(barrasPorPerfil).forEach(val => {
    const barrasNecesarias = Math.max(1, Math.ceil((val.longTotalM * 1.08) / 6.0));
    const sub = barrasNecesarias * val.perfil.precioPorBarra6m;
    items.push({
      id: `met-perf-${val.perfil.id}`,
      categoria: 'perfiles',
      descripcion: `${val.perfil.nombre} (Barras de 6.00m)`,
      unidad: 'barras',
      cantidad: barrasNecesarias,
      precioUnitario: val.perfil.precioPorBarra6m,
      subtotal: sub,
      detalle: `${val.cantPiezas} cortes (${val.longTotalM.toFixed(2)}m lineales netos + 8% merma)`
    });
  });

  // 2. PLANCHAS METÁLICAS
  const panelesPlancha = design.paneles.filter(p => 
    p.tipoRelleno === 'plancha_lisa' || 
    p.tipoRelleno === 'plancha_perforada' || 
    p.tipoRelleno === 'plancha_estriada' || 
    p.tipoRelleno === 'plancha_galvanizada' ||
    p.tipoRelleno === 'aluzinc'
  );

  let areaTotalPlanchaM2 = 0;
  panelesPlancha.forEach(p => {
    const a = areaTotalVanoM2 * p.relW * p.relH;
    areaTotalPlanchaM2 += a;
  });

  if (areaTotalPlanchaM2 > 0) {
    const precioM2Plancha = 85.00; // S/. 85 por m² de plancha LAF 1/16" procesada
    const subPlancha = areaTotalPlanchaM2 * precioM2Plancha;
    items.push({
      id: 'met-plancha-metal',
      categoria: 'planchas',
      descripcion: 'Plancha de Acero LAF / LAC (1/16" / 1.5mm) cizallada y soldada',
      unidad: 'm²',
      cantidad: Math.round(areaTotalPlanchaM2 * 100) / 100,
      precioUnitario: precioM2Plancha,
      subtotal: subPlancha,
      detalle: `Corte y troquelado con 10% de desperdicio (${(areaTotalPlanchaM2 / 2.88).toFixed(1)} planchas estándar 1.20x2.40m)`
    });
  }

  // 3. VIDRIOS
  const panelesVidrio = design.paneles.filter(p => 
    p.tipoRelleno === 'vidrio_simple' || 
    p.tipoRelleno === 'vidrio_templado' || 
    p.tipoRelleno === 'vidrio_laminado' || 
    p.tipoRelleno === 'vidrio_doble_dvh' ||
    p.tipoRelleno === 'vidrio_traslucido'
  );

  let areaTotalVidrioM2 = 0;
  panelesVidrio.forEach(p => {
    areaTotalVidrioM2 += areaTotalVanoM2 * p.relW * p.relH;
  });

  if (areaTotalVidrioM2 > 0) {
    const precioM2Vidrio = 125.00; // S/. 125/m² estándar templado 6mm
    const subVidrio = areaTotalVidrioM2 * precioM2Vidrio;
    items.push({
      id: 'met-vidrio-templado',
      categoria: 'vidrios',
      descripcion: 'Vidrio Templado de Seguridad 6mm con cantos pulidos y junquillos',
      unidad: 'm²',
      cantidad: Math.round(areaTotalVidrioM2 * 100) / 100,
      precioUnitario: precioM2Vidrio,
      subtotal: subVidrio,
      detalle: `${panelesVidrio.length} paneles vidriados instalados con silicona estructural`
    });
  }

  // 4. MALLAS
  const panelesMalla = design.paneles.filter(p => 
    p.tipoRelleno === 'malla_electrosoldada' || 
    p.tipoRelleno === 'malla_expandida' || 
    p.tipoRelleno === 'malla_ciclonica'
  );

  let areaTotalMallaM2 = 0;
  panelesMalla.forEach(p => {
    areaTotalMallaM2 += areaTotalVanoM2 * p.relW * p.relH;
  });

  if (areaTotalMallaM2 > 0) {
    const precioM2Malla = 45.00;
    const subMalla = areaTotalMallaM2 * precioM2Malla;
    items.push({
      id: 'met-malla-electro',
      categoria: 'mallas',
      descripcion: 'Malla Metálica de Protección / Desplegada con platina de fijación',
      unidad: 'm²',
      cantidad: Math.round(areaTotalMallaM2 * 100) / 100,
      precioUnitario: precioM2Malla,
      subtotal: subMalla,
      detalle: `Marco perimetral fijado a bastidor`
    });
  }

  // 5. ACCESORIOS Y CERRAJERÍA
  (design.accesorios || []).filter(a => a.incluido).forEach(acc => {
    const subAcc = acc.cantidad * acc.precioUnitario;
    items.push({
      id: `met-acc-${acc.id}`,
      categoria: 'accesorios',
      descripcion: acc.nombre,
      unidad: acc.unidad,
      cantidad: acc.cantidad,
      precioUnitario: acc.precioUnitario,
      subtotal: subAcc,
      detalle: acc.descripcion
    });
  });

  // 6. CONSUMIBLES E INSUMOS DE TALLER
  // Electrodos E6011/E7018 (~0.08 kg por metro de perfil)
  const kgSoldadura = Math.max(2, Math.ceil(despiece.longitudTotalPerfilesM * 0.08));
  const costoSoldadura = kgSoldadura * 14.00; // S/. 14/kg electrodo
  items.push({
    id: 'met-consumible-soldadura',
    categoria: 'consumibles',
    descripcion: 'Soldadura por Arco Eléctrico (Electrodos Cellocord E6011 / Supercito 7018)',
    unidad: 'kg',
    cantidad: kgSoldadura,
    precioUnitario: 14.00,
    subtotal: costoSoldadura,
    detalle: 'Cordones continuos y por puntos según norma AWS'
  });

  // Discos de corte y desbaste
  const cantDiscos = Math.max(2, Math.ceil(despiece.totalPiezas / 8));
  const costoDiscos = cantDiscos * 12.00;
  items.push({
    id: 'met-consumible-discos',
    categoria: 'consumibles',
    descripcion: 'Discos Abrasivos de Corte 4 1/2", 14" y Discos Flap de Pulido',
    unidad: 'und',
    cantidad: cantDiscos,
    precioUnitario: 12.00,
    subtotal: costoDiscos,
    detalle: 'Corte limpio y esmerilado de rebabas en uniones'
  });

  // 7. PINTURA Y ACABADOS
  const areaPinturaM2 = areaTotalVanoM2 * 2.4; // 2 caras + perfiles interiores
  const costoM2Pintura = design.acabado.costoPorM2 || 25.00;
  const subtotalPintura = areaPinturaM2 * costoM2Pintura;
  items.push({
    id: 'met-pintura-acabado',
    categoria: 'pintura',
    descripcion: `Acabado de Superficie: Base Epóxica Anticorrosiva + ${design.acabado.colorNombre}`,
    unidad: 'm²',
    cantidad: Math.round(areaPinturaM2 * 100) / 100,
    precioUnitario: costoM2Pintura,
    subtotal: subtotalPintura,
    detalle: `${design.acabado.manosPintura} manos aplicadas con soplete / pistola de gravedad`
  });

  // 8. MANO DE OBRA ESPECIALIZADA
  const dias = design.manoDeObra.diasEstimados || 1.5;
  const costoOperario = (design.manoDeObra.cantOperarios || 1) * dias * (design.manoDeObra.costoOperarioDia || 130);
  const costoAyudante = (design.manoDeObra.cantAyudantes || 1) * dias * (design.manoDeObra.costoAyudanteDia || 90);

  items.push({
    id: 'met-mo-operario',
    categoria: 'mano_obra',
    descripcion: `Mano de Obra: Operario Maestro Soldador y Armador (${dias} ${dias > 1 ? 'jornales' : 'jornal'})`,
    unidad: 'jor',
    cantidad: dias * (design.manoDeObra.cantOperarios || 1),
    precioUnitario: design.manoDeObra.costoOperarioDia || 130.00,
    subtotal: costoOperario,
    detalle: 'Trazo, corte, habilitación, armado en escuadra y soldadura'
  });

  if ((design.manoDeObra.cantAyudantes || 0) > 0) {
    items.push({
      id: 'met-mo-ayudante',
      categoria: 'mano_obra',
      descripcion: `Mano de Obra: Ayudante de Taller Cerrajero (${dias} ${dias > 1 ? 'jornales' : 'jornal'})`,
      unidad: 'jor',
      cantidad: dias * (design.manoDeObra.cantAyudantes || 1),
      precioUnitario: design.manoDeObra.costoAyudanteDia || 90.00,
      subtotal: costoAyudante,
      detalle: 'Pulido, desbaste, lijado y apoyo en montaje'
    });
  }

  // Agrupación y Totales Financieros
  const subtotalMateriales = items.filter(i => i.categoria === 'perfiles' || i.categoria === 'planchas' || i.categoria === 'vidrios' || i.categoria === 'mallas').reduce((s, i) => s + i.subtotal, 0);
  const subtotalAccesorios = items.filter(i => i.categoria === 'accesorios').reduce((s, i) => s + i.subtotal, 0);
  const subtotalConsumibles = items.filter(i => i.categoria === 'consumibles').reduce((s, i) => s + i.subtotal, 0);
  const subPintura = items.filter(i => i.categoria === 'pintura').reduce((s, i) => s + i.subtotal, 0);
  const subMO = items.filter(i => i.categoria === 'mano_obra').reduce((s, i) => s + i.subtotal, 0);

  const costoDirecto = subtotalMateriales + subtotalAccesorios + subtotalConsumibles + subPintura + subMO;
  const gastosGeneralesPct = 10; // 10% gastos generales de taller
  const gastosGeneralesMonto = costoDirecto * (gastosGeneralesPct / 100);
  
  const utilidadPct = 15; // 15% utilidad de contratista
  const utilidadMonto = (costoDirecto + gastosGeneralesMonto) * (utilidadPct / 100);

  const subtotalSinIgv = costoDirecto + gastosGeneralesMonto + utilidadMonto;
  const igvPct = 0;
  const igvMonto = 0;
  const totalPresupuestoPEN = subtotalSinIgv;
  const costoPorM2PEN = totalPresupuestoPEN / areaTotalVanoM2;

  return {
    items,
    subtotalMateriales: Math.round(subtotalMateriales * 100) / 100,
    subtotalAccesorios: Math.round(subtotalAccesorios * 100) / 100,
    subtotalConsumibles: Math.round(subtotalConsumibles * 100) / 100,
    subtotalPintura: Math.round(subPintura * 100) / 100,
    subtotalManoObra: Math.round(subMO * 100) / 100,
    costoDirecto: Math.round(costoDirecto * 100) / 100,
    gastosGeneralesPct,
    gastosGeneralesMonto: Math.round(gastosGeneralesMonto * 100) / 100,
    utilidadPct,
    utilidadMonto: Math.round(utilidadMonto * 100) / 100,
    subtotalSinIgv: Math.round(subtotalSinIgv * 100) / 100,
    igvPct,
    igvMonto: Math.round(igvMonto * 100) / 100,
    totalPresupuestoPEN: Math.round(totalPresupuestoPEN * 100) / 100,
    costoPorM2PEN: Math.round(costoPorM2PEN * 100) / 100
  };
}
