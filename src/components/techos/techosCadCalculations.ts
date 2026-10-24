// Motor de Cálculo Matemático, Despiece 1D (Bin Packing FFD) y Metrados para Techos Metálicos
// Inteligencia de Materiales: Optimización de retazos, modulación con ancho útil y presupuesto paramétrico.

import { 
  Node3D, 
  Segment3D, 
  CoverageZone3D, 
  ResumenDespiecePerfil1D, 
  PatronBarraComercial6M, 
  CortePiezaSegmento, 
  ResumenCálculoCobertura, 
  FullTechosBomReport 
} from './techosCadEngineTypes';

import { 
  INVENTARIO_PERFILES_TUBULARES, 
  INVENTARIO_COBERTURAS, 
  PLACA_BASE_ESTANDAR, 
  PERNO_EPDM_ESTANDAR, 
  PERNO_ANCLAJE_J, 
  SOLDADURA_AWS_E6011 
} from './techosCadCatalog';
import { CostosTechos, leerCostosTechos, totalCuadrilla, totalOperativos } from './costosTechos';
import { precio, precioBarraPerfil, claveCobertura } from '../../lib/catalogoPrecios';

// 1. CÁLCULO DE DISTANCIA EUCLIDIANA 3D ENTRE NODOS
export function calcularLongitudSegmento3D(nodoA: Node3D, nodoB: Node3D): number {
  const dx = nodoB.x - nodoA.x;
  const dy = nodoB.y - nodoA.y;
  const dz = (nodoB.z || 0) - (nodoA.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// 2. ALGORITMO DE DESPIECE 1D (BIN PACKING PROBLEM - FIRST FIT DECREASING FFD)
export function calcularDespieceOptimizado1D(
  segments: Record<string, Segment3D>,
  nodes: Record<string, Node3D>,
  discoCorteKerfM: number = 0.003, // 3 mm de mermas por corte de disco
  precioPerfil: Record<string, number> = {} // S/ por metro del proveedor del usuario
): ResumenDespiecePerfil1D[] {
  
  // Agrupar piezas a cortar por profileId
  const piezasPorPerfil: Record<string, CortePiezaSegmento[]> = {};

  Object.values(segments).forEach(seg => {
    const nodoA = nodes[seg.nodeAId];
    const nodoB = nodes[seg.nodeBId];
    if (!nodoA || !nodoB) return;

    const lenM = calcularLongitudSegmento3D(nodoA, nodoB);
    if (lenM <= 0.01) return;

    if (!piezasPorPerfil[seg.profileId]) {
      piezasPorPerfil[seg.profileId] = [];
    }

    piezasPorPerfil[seg.profileId].push({
      segmentId: seg.id,
      longitudM: Math.round(lenM * 1000) / 1000, // Redondear a mm
      rolEstructural: seg.rolEstructural,
      etiquetaPieza: `${seg.rolEstructural.toUpperCase().slice(0, 4)}-${seg.id.slice(-4)}`
    });
  });

  const resumenesDespiece: ResumenDespiecePerfil1D[] = [];

  // Procesar cada perfil tubular con el Algoritmo FFD
  Object.entries(piezasPorPerfil).forEach(([profileId, listaCortes]) => {
    const perfilInfo = INVENTARIO_PERFILES_TUBULARES.find(p => p.id === profileId) || INVENTARIO_PERFILES_TUBULARES[0];
    const largoBarraComercialM = perfilInfo.longitudComercialM || 6.00;

    // Paso 1: Ordenar cortes en orden descendente (Largest First)
    const cortesOrdenados = [...listaCortes].sort((a, b) => b.longitudM - a.longitudM);

    const barrasComerciales: PatronBarraComercial6M[] = [];

    // Paso 2: Aplicar First-Fit Decreasing
    cortesOrdenados.forEach(corta => {
      let ubicado = false;

      // Buscar la primera barra abierta donde quepa el corte + discoKerf
      for (let i = 0; i < barrasComerciales.length; i++) {
        const barraActual = barrasComerciales[i];
        const espacioRequerido = corta.longitudM + discoCorteKerfM;

        if (barraActual.desperdicioSobraM >= espacioRequerido) {
          barraActual.cortes.push(corta);
          barraActual.totalUsadoM += espacioRequerido;
          barraActual.desperdicioSobraM = Math.max(0, largoBarraComercialM - barraActual.totalUsadoM);
          barraActual.eficienciaPorcentaje = (barraActual.totalUsadoM / largoBarraComercialM) * 100;
          ubicado = true;
          break;
        }
      }

      // Si no cupo en ninguna barra existente, abrir una nueva barra comercial de 6m
      if (!ubicado) {
        const espacioUsado = corta.longitudM + discoCorteKerfM;
        const nuevaBarra: PatronBarraComercial6M = {
          indiceBarra: barrasComerciales.length + 1,
          profileId: perfilInfo.id,
          longitudBarraComercialM: largoBarraComercialM,
          cortes: [corta],
          totalUsadoM: espacioUsado,
          desperdicioSobraM: Math.max(0, largoBarraComercialM - espacioUsado),
          eficienciaPorcentaje: (espacioUsado / largoBarraComercialM) * 100
        };
        barrasComerciales.push(nuevaBarra);
      }
    });

    // Sumatorias y Métricas
    const totalMetrosRequeridosM = listaCortes.reduce((sum, c) => sum + c.longitudM, 0);
    const totalBarras6m = barrasComerciales.length;
    const totalMetrosComprados6mM = totalBarras6m * largoBarraComercialM;
    const desperdicioTotalM = totalMetrosComprados6mM - totalMetrosRequeridosM;
    const eficienciaProm = totalMetrosComprados6mM > 0 ? (totalMetrosRequeridosM / totalMetrosComprados6mM) * 100 : 0;
    const totalPesoAceroKg = totalMetrosComprados6mM * perfilInfo.pesoLinealKgM;
    // Precio del catálogo único (por barra) llevado a metro.
    const largoBarra = perfilInfo.longitudComercialM || 6;
    const costoMetro = precioPerfil[perfilInfo.id] ?? precioBarraPerfil(perfilInfo, perfilInfo.costoMetroSol * largoBarra) / largoBarra;
    const totalCostoSoles = totalMetrosComprados6mM * costoMetro;

    resumenesDespiece.push({
      profileId: perfilInfo.id,
      nombrePerfil: perfilInfo.nombre,
      codigoComercial: perfilInfo.codigoComercial,
      totalBarrasComerciales6m: totalBarras6m,
      totalMetrosRequeridosM: Math.round(totalMetrosRequeridosM * 100) / 100,
      totalMetrosComprados6mM: totalMetrosComprados6mM,
      totalPesoAceroKg: Math.round(totalPesoAceroKg * 10) / 10,
      totalCostoSoles: Math.round(totalCostoSoles * 100) / 100,
      eficienciaPromedioPorcentaje: Math.round(eficienciaProm * 10) / 10,
      desperdicioTotalKg: Math.round((desperdicioTotalM * perfilInfo.pesoLinealKgM) * 10) / 10,
      patronesBarras: barrasComerciales
    });
  });

  return resumenesDespiece;
}

// 3. MOTOR DE CÁLCULO DE COBERTURAS Y PLANCHAS CON ANCHO ÚTIL
export function calcularMetradoCoberturas(
  coverageZones: Record<string, CoverageZone3D>,
  nodes: Record<string, Node3D>,
  precioCobertura: Record<string, number> = {}
): ResumenCálculoCobertura[] {
  const resultados: ResumenCálculoCobertura[] = [];

  Object.values(coverageZones).forEach(zone => {
    const coberturaInfo = INVENTARIO_COBERTURAS.find(c => c.id === zone.coberturaMaterialId) || INVENTARIO_COBERTURAS[0];

    // Calcular área en planta del polígono de nodos
    const boundaryNodes = zone.nodeIdsBoundary.map(id => nodes[id]).filter(Boolean);
    if (boundaryNodes.length < 3) return;

    // Fórmula del polígono en 2D (Shoelace algorithm)
    let areaPlantaM2 = 0;
    for (let i = 0; i < boundaryNodes.length; i++) {
      const j = (i + 1) % boundaryNodes.length;
      areaPlantaM2 += boundaryNodes[i].x * boundaryNodes[j].y;
      areaPlantaM2 -= boundaryNodes[j].x * boundaryNodes[i].y;
    }
    areaPlantaM2 = Math.abs(areaPlantaM2) / 2;

    // Corregir área por pendiente de inclinación
    const pendRad = Math.atan((zone.pendientePorcentaje || 20) / 100);
    const areaRealSuperficieM2 = areaPlantaM2 / Math.cos(pendRad);

    // Estimación de ancho y largo equivalente de la nave
    const minX = Math.min(...boundaryNodes.map(n => n.x));
    const maxX = Math.max(...boundaryNodes.map(n => n.x));
    const minY = Math.min(...boundaryNodes.map(n => n.y));
    const maxY = Math.max(...boundaryNodes.map(n => n.y));

    const anchoNaveM = Math.max(1, maxX - minX);
    const largoNaveM = Math.max(1, (maxY - minY) / Math.cos(pendRad));

    // Modulación por Ancho Útil
    const anchoUtilM = coberturaInfo.anchoUtilMm / 1000; // ej. 1.00 m
    const numColsAncho = Math.ceil(anchoNaveM / anchoUtilM);

    // Modulación por Filas Longitudinales con Traslape
    const largoPlanchaM = coberturaInfo.longitudComercialM || 3.00;
    const traslapeM = (coberturaInfo.traslapeTransversalMinMm || 200) / 1000;
    const largoEfectivoPlanchaM = Math.max(0.5, largoPlanchaM - traslapeM);

    const numRowsLargo = Math.ceil((largoNaveM - traslapeM) / largoEfectivoPlanchaM);
    const totalPlanchas = numColsAncho * numRowsLargo;

    const areaCompradaM2 = totalPlanchas * (coberturaInfo.anchoTotalMm / 1000) * largoPlanchaM;
    const pesoTotalKg = areaCompradaM2 * coberturaInfo.pesoM2Kg;
    const costoTotalSol = areaCompradaM2 * (precioCobertura[coberturaInfo.id] ?? precio(claveCobertura(coberturaInfo.id), coberturaInfo.costoM2Sol));
    const pernosEpdmUnids = Math.ceil(areaRealSuperficieM2 * coberturaInfo.pernosRequeridosPorM2);

    resultados.push({
      coberturaMaterialId: coberturaInfo.id,
      nombreCobertura: coberturaInfo.nombre,
      areaRealSuperficieM2: Math.round(areaRealSuperficieM2 * 100) / 100,
      areaEfectivaCalculadaM2: Math.round(areaCompradaM2 * 100) / 100,
      numColumnasAnchoUtil: numColsAncho,
      numFilasLargoPlancha: numRowsLargo,
      totalPlanchasEstimadas: totalPlanchas,
      pesoTotalCoberturaKg: Math.round(pesoTotalKg * 10) / 10,
      costoTotalCoberturaSoles: Math.round(costoTotalSol * 100) / 100,
      pernosEpdmRequeridosUnidades: pernosEpdmUnids
    });
  });

  return resultados;
}

// 4. GENERADOR COMPLETO DEL REPORTE PRESUPUESTARIO BOM Y COSTOS
export function generarReportePresupuestoBom(
  nodes: Record<string, Node3D>,
  segments: Record<string, Segment3D>,
  coverageZones: Record<string, CoverageZone3D>,
  costos: CostosTechos = leerCostosTechos()
): FullTechosBomReport {
  
  const despiecePerfiles = calcularDespieceOptimizado1D(segments, nodes, 0.003);
  const resumenCoberturas = calcularMetradoCoberturas(coverageZones, nodes);

  // Contar columnas apoyadas para Placas Base y Pernos J
  const numColumnas = Object.values(nodes).filter(n => n.isFixedSupport).length || 4;
  const placasBaseTotales = numColumnas;
  const pernosAnclajeJ = numColumnas * 4;

  // Suma de pernos autoperforantes EPDM de todas las coberturas
  const totalPernosEpdmUnids = resumenCoberturas.reduce((sum, c) => sum + c.pernosEpdmRequeridosUnidades, 0);
  const cajasPernosEpdm = Math.ceil((totalPernosEpdmUnids || 100) / 100);

  // Estimado de soldadura en base a metros lineales de estructura
  const totalMetrosEstructura = Object.values(segments).reduce((sum, seg) => {
    const nA = nodes[seg.nodeAId];
    const nB = nodes[seg.nodeBId];
    return sum + (nA && nB ? calcularLongitudSegmento3D(nA, nB) : 0);
  }, 0);

  const kgSoldaduraEstimados = Math.round(totalMetrosEstructura * SOLDADURA_AWS_E6011.consumoKgPorMetroJunta * 10) / 10;

  // Costos directos acumulados
  const costoPerfilesSoles = despiecePerfiles.reduce((sum, p) => sum + p.totalCostoSoles, 0);
  const costoCoberturasSoles = resumenCoberturas.reduce((sum, c) => sum + c.costoTotalCoberturaSoles, 0);
  const costoPlacasSoles = placasBaseTotales * precio('techos:placa_base', PLACA_BASE_ESTANDAR.costoUnidadSol);
  const costoPernosAnclajeSoles = (pernosAnclajeJ / 100) * precio('techos:perno_anclaje', PERNO_ANCLAJE_J.costoCaja100Sol);
  const costoPernosEpdmSoles = cajasPernosEpdm * precio('techos:perno_epdm', PERNO_EPDM_ESTANDAR.costoCaja100Sol);
  const costoSoldaduraSoles = kgSoldaduraEstimados * precio('soldadura:kg', SOLDADURA_AWS_E6011.costoKgSol);

  const costoDirectoMateriales = costoPerfilesSoles + costoCoberturasSoles + costoPlacasSoles + costoPernosAnclajeSoles + costoPernosEpdmSoles + costoSoldaduraSoles;

  // Mano de obra y gastos operativos: % de materiales o detalle del usuario
  // (cuadrilla con jornales; grúa, transporte… con montos).
  const costoManoObra = costos.manoObraModo === 'detalle' ? totalCuadrilla(costos) : costoDirectoMateriales * costos.manoObraPct / 100; // cuadrilla: jornales del catálogo
  const costoEquiposYGrua = costos.operativosModo === 'detalle' ? totalOperativos(costos) : costoDirectoMateriales * costos.operativosPct / 100;
  const costoDirectoTotal = costoDirectoMateriales + costoManoObra + costoEquiposYGrua;

  const gastosGenerales = costoDirectoTotal * costos.gastosGeneralesPct / 100;
  const utilidad = costoDirectoTotal * costos.utilidadPct / 100;
  const gastosGeneralesYUtilidad = gastosGenerales + utilidad;
  const subtotal = costoDirectoTotal + gastosGeneralesYUtilidad;
  const igv = costos.igv ? subtotal * 0.18 : 0;
  const precioVentaFinal = subtotal + igv;
  const r2 = (v: number) => Math.round(v * 100) / 100;

  return {
    despiecePerfiles,
    resumenCoberturas,
    placasBaseTotalesUnids: placasBaseTotales,
    pernosAnclajeJTotalesUnids: pernosAnclajeJ,
    cajasPernosEpdmTotales: cajasPernosEpdm,
    kgSoldaduraAwsEstimados: kgSoldaduraEstimados,
    costoDirectoMaterialesSoles: Math.round(costoDirectoMateriales * 100) / 100,
    costoManoObraMontajeSoles: Math.round(costoManoObra * 100) / 100,
    costoEquiposGruaSoles: Math.round(costoEquiposYGrua * 100) / 100,
    costoDirectoTotalSoles: Math.round(costoDirectoTotal * 100) / 100,
    gastosGeneralesYUtilidadSoles: Math.round(gastosGeneralesYUtilidad * 100) / 100,
    igvSoles: Math.round(igv * 100) / 100,
    precioVentaFinalSoles: Math.round(precioVentaFinal * 100) / 100,
    costoPerfilesSoles: r2(costoPerfilesSoles),
    costoCoberturasSoles: r2(costoCoberturasSoles),
    costoAccesoriosSoles: r2(costoPlacasSoles + costoPernosAnclajeSoles + costoPernosEpdmSoles + costoSoldaduraSoles),
    gastosGeneralesSoles: r2(gastosGenerales),
    utilidadSoles: r2(utilidad),
    subtotalSoles: r2(subtotal),
  };
}
