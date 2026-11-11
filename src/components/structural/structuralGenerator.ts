import { 
  StructuralGeometry, 
  StructureOptions, 
  CoberturaOptions, 
  ConexionesOptions, 
  ColumnElement, 
  BeamElement, 
  PurlinElement,
  Point2D,
  TipoTijeral,
  PatronTijeral
} from './structuralTypes';

export interface RoofCalculatedGeometry {
  alturaLadoAlto: number;
  alturaLadoBajo: number;
  deltaZ: number;
  pendientePct: number;
  pendienteRealPct: number;
  pendienteGrados: number;
  ridgeZ: number;
  luzPendiente: number; // span along which slope occurs
  direccionTexto: string;
  alertaPendienteBaja: boolean;
  areaCoberturaM2: number;
  areaBrutaM2?: number;
  areaVaciosM2?: number;
  metrosCanaleta: number;
  tieneCanaleta: boolean;
  cantBajantes: number;
  metrosBajantes: number;
  metrosCumbrera: number;
  metrosRematesLaterales: number;
  sectoresDetalle?: Array<{
    id: string;
    nombre: string;
    areaPlantaM2: number;
    areaInclinadaM2: number;
    pendientePct: number;
    sistemaCobertura: string;
  }>;
}

/**
 * Calculates polygon area using the Shoelace formula
 */
export function calcPolygonArea(vertices: Point2D[]): number {
  if (!vertices || vertices.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return parseFloat((Math.abs(area) / 2).toFixed(2));
}

/**
 * Calculates polygon perimeter
 */
export function calcPolygonPerimeter(vertices: Point2D[]): number {
  if (!vertices || vertices.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    perimeter += Math.hypot(vertices[j].x - vertices[i].x, vertices[j].y - vertices[i].y);
  }
  return parseFloat(perimeter.toFixed(2));
}

/**
 * Calculates length of each edge of a polygon
 */
export function calcEdgeLengths(vertices: Point2D[]): number[] {
  if (!vertices || vertices.length < 2) return [];
  const lengths: number[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    lengths.push(parseFloat(Math.hypot(vertices[j].x - vertices[i].x, vertices[j].y - vertices[i].y).toFixed(2)));
  }
  return lengths;
}

/**
 * Bounding box of a polygon
 */
export function getPolygonBounds(vertices: Point2D[]): { minX: number; maxX: number; minY: number; maxY: number; width: number; length: number } {
  if (!vertices || vertices.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, length: 0 };
  let minX = vertices[0].x;
  let maxX = vertices[0].x;
  let minY = vertices[0].y;
  let maxY = vertices[0].y;
  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }
  return {
    minX: parseFloat(minX.toFixed(2)),
    maxX: parseFloat(maxX.toFixed(2)),
    minY: parseFloat(minY.toFixed(2)),
    maxY: parseFloat(maxY.toFixed(2)),
    width: parseFloat((maxY - minY).toFixed(2)),
    length: parseFloat((maxX - minX).toFixed(2))
  };
}

/**
 * Point in polygon test
 */
export function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculates exact elevations and slopes according to user inputs
 */
export function calculateRoofGeometry(geom: StructuralGeometry): RoofCalculatedGeometry {
  const { 
    largo, 
    ancho, 
    altura, 
    tipoTecho, 
    direccionCaida = 'calle',
    modoCalculoPendiente = 'por_pendiente',
    flechaArco = 1.20,
    sectores = [],
    vacios = []
  } = geom;

  // Multi-sector calculation if sectors are defined
  if (sectores && sectores.length > 0) {
    let totalPlantaM2 = 0;
    let totalInclinadaM2 = 0;
    let totalCanaletaM = 0;
    let totalBajantesCant = 0;
    let totalBajantesM = 0;
    let maxZAlto = 0;
    let minZBajo = 999;
    let sumPendiente = 0;

    const sectoresDetalle = sectores.map(sec => {
      const areaPlanta = calcPolygonArea(sec.vertices);
      const factorInclinacion = Math.sqrt(1 + Math.pow(sec.pendientePct / 100, 2));
      const areaInclinada = parseFloat((areaPlanta * factorInclinacion).toFixed(2));
      
      totalPlantaM2 += areaPlanta;
      totalInclinadaM2 += areaInclinada;
      sumPendiente += sec.pendientePct;

      if (sec.alturaLadoAlto > maxZAlto) maxZAlto = sec.alturaLadoAlto;
      if (sec.alturaLadoBajo < minZBajo) minZBajo = sec.alturaLadoBajo;

      // Canaletas for this sector
      const edgeLengths = calcEdgeLengths(sec.vertices);
      const gutterEdges = sec.canaletaBordes || [];
      let secCanaletaM = 0;
      gutterEdges.forEach(eIdx => {
        if (edgeLengths[eIdx]) secCanaletaM += edgeLengths[eIdx];
      });
      if (gutterEdges.length === 0 && edgeLengths.length > 0) {
        // Default to the first edge if none explicitly selected
        secCanaletaM = edgeLengths[0];
      }
      totalCanaletaM += secCanaletaM;

      // Bajantes
      const secBajantes = sec.bajantes?.length || Math.max(1, Math.ceil(secCanaletaM / 8));
      totalBajantesCant += secBajantes;
      totalBajantesM += secBajantes * (sec.alturaLadoAlto || 3.5);

      return {
        id: sec.id,
        nombre: sec.nombre,
        areaPlantaM2: areaPlanta,
        areaInclinadaM2: areaInclinada,
        pendientePct: sec.pendientePct,
        sistemaCobertura: sec.sistemaCobertura === 'aluzinc' ? 'Aluzinc' : 'Panel Termoacústico'
      };
    });

    // Calculate voids to subtract
    let areaVaciosM2 = 0;
    vacios.forEach(v => {
      areaVaciosM2 += calcPolygonArea(v.vertices);
    });
    areaVaciosM2 = parseFloat(areaVaciosM2.toFixed(2));

    const netCoverageM2 = Math.max(0, parseFloat((totalInclinadaM2 - areaVaciosM2).toFixed(2)));
    const avgPendiente = parseFloat((sumPendiente / sectores.length).toFixed(1));
    const hAlto = maxZAlto > 0 ? maxZAlto : 3.50;
    const hBajo = minZBajo < 999 ? minZBajo : 3.00;

    return {
      alturaLadoAlto: parseFloat(hAlto.toFixed(2)),
      alturaLadoBajo: parseFloat(hBajo.toFixed(2)),
      deltaZ: parseFloat((hAlto - hBajo).toFixed(3)),
      pendientePct: avgPendiente,
      pendienteRealPct: avgPendiente,
      pendienteGrados: parseFloat(((Math.atan(avgPendiente / 100) * 180) / Math.PI).toFixed(2)),
      ridgeZ: parseFloat(hAlto.toFixed(2)),
      luzPendiente: ancho,
      direccionTexto: sectores.length === 1 ? `Sector ${sectores[0].nombre}` : `${sectores.length} Sectores Independientes`,
      alertaPendienteBaja: avgPendiente < 2.0,
      areaCoberturaM2: netCoverageM2,
      areaBrutaM2: parseFloat(totalInclinadaM2.toFixed(2)),
      areaVaciosM2,
      metrosCanaleta: parseFloat(totalCanaletaM.toFixed(2)),
      tieneCanaleta: totalCanaletaM > 0,
      cantBajantes: totalBajantesCant,
      metrosBajantes: parseFloat(totalBajantesM.toFixed(2)),
      metrosCumbrera: 0,
      metrosRematesLaterales: parseFloat((calcPolygonPerimeter(sectores[0]?.vertices || [])).toFixed(2)),
      sectoresDetalle
    };
  }

  // Fallback to single geometry calculation
  // Determine span along slope
  let luzPendiente = ancho;
  if (direccionCaida === 'calle' || direccionCaida === 'interior') {
    luzPendiente = largo;
  } else if (tipoTecho === 'dos_aguas' || tipoTecho === 'dos_aguas_cumbrera') {
    luzPendiente = ancho / 2;
  }

  let alturaAlto = geom.alturaLadoAlto || altura || 3.50;
  let pendientePct = geom.pendiente || 5.0;

  if (tipoTecho === 'casi_plano' || tipoTecho === 'plano') {
    pendientePct = Math.max(1.5, geom.pendiente || 2.0); // minimum recommended technical slope
  }

  let deltaZ = 0;
  let alturaBajo = geom.alturaLadoBajo;

  if (tipoTecho === 'parabolico' || tipoTecho === 'arco') {
    deltaZ = flechaArco;
    alturaBajo = alturaAlto;
  } else if (modoCalculoPendiente === 'por_alturas' && typeof geom.alturaLadoBajo === 'number' && geom.alturaLadoBajo > 0) {
    deltaZ = Math.max(0.05, alturaAlto - geom.alturaLadoBajo);
    pendientePct = (deltaZ / (luzPendiente || 1)) * 100;
    alturaBajo = geom.alturaLadoBajo;
  } else {
    // por pendiente
    deltaZ = (luzPendiente * (pendientePct / 100));
    alturaBajo = Math.max(0.5, parseFloat((alturaAlto - deltaZ).toFixed(3)));
  }

  const pendienteGrados = (Math.atan(pendientePct / 100) * 180) / Math.PI;
  const ridgeZ = alturaAlto;
  const pendienteRealPct = parseFloat(pendientePct.toFixed(1));
  const alertaPendienteBaja = (tipoTecho === 'casi_plano' || tipoTecho === 'plano') && pendientePct < 2.0;

  // Real slope surface area
  const hipotenusa = Math.hypot(luzPendiente, deltaZ);
  let areaCoberturaM2 = largo * ancho;
  if (tipoTecho === 'dos_aguas' || tipoTecho === 'dos_aguas_cumbrera') {
    areaCoberturaM2 = 2 * (hipotenusa * largo);
  } else if (tipoTecho === 'parabolico' || tipoTecho === 'arco') {
    const arcLen = ancho * (1 + (8 * Math.pow(flechaArco, 2)) / (3 * Math.pow(ancho, 2)));
    areaCoberturaM2 = arcLen * largo;
  } else {
    if (direccionCaida === 'calle' || direccionCaida === 'interior') {
      areaCoberturaM2 = ancho * hipotenusa;
    } else {
      areaCoberturaM2 = largo * hipotenusa;
    }
  }
  areaCoberturaM2 = parseFloat(areaCoberturaM2.toFixed(2));

  // Drainage and accessories
  const tieneCanaleta = geom.evacuacion ? geom.evacuacion.tieneCanaleta : true;
  let metrosCanaleta = 0;
  if (tieneCanaleta) {
    if (tipoTecho === 'dos_aguas' || tipoTecho === 'dos_aguas_cumbrera') {
      metrosCanaleta = largo * 2;
    } else if (direccionCaida === 'calle' || direccionCaida === 'interior') {
      metrosCanaleta = ancho;
    } else {
      metrosCanaleta = largo;
    }
  }

  const cantBajantes = geom.evacuacion?.bajanteCantidad || Math.max(1, Math.ceil(metrosCanaleta / 8));
  const metrosBajantes = cantBajantes * (geom.evacuacion?.bajanteAlturaM || alturaAlto);
  const metrosCumbrera = (tipoTecho === 'dos_aguas' || tipoTecho === 'dos_aguas_cumbrera') ? largo : 0;
  const metrosRematesLaterales = parseFloat((2 * (hipotenusa || luzPendiente)).toFixed(2));

  let direccionTexto = 'Hacia la Calle (Frontal)';
  if (direccionCaida === 'interior') direccionTexto = 'Hacia el Interior (Posterior)';
  else if (direccionCaida === 'izquierda') direccionTexto = 'Hacia la Izquierda (Lateral)';
  else if (direccionCaida === 'derecha') direccionTexto = 'Hacia la Derecha (Lateral)';
  else if (direccionCaida === 'personalizada') direccionTexto = 'Personalizada';

  return {
    alturaLadoAlto: parseFloat(alturaAlto.toFixed(2)),
    alturaLadoBajo: parseFloat((alturaBajo || 3.0).toFixed(2)),
    deltaZ: parseFloat(deltaZ.toFixed(3)),
    pendientePct: parseFloat(pendientePct.toFixed(1)),
    pendienteRealPct,
    pendienteGrados: parseFloat(pendienteGrados.toFixed(2)),
    ridgeZ: parseFloat(ridgeZ.toFixed(2)),
    luzPendiente,
    direccionTexto,
    alertaPendienteBaja,
    areaCoberturaM2,
    areaBrutaM2: areaCoberturaM2,
    areaVaciosM2: 0,
    metrosCanaleta,
    tieneCanaleta,
    cantBajantes,
    metrosBajantes,
    metrosCumbrera,
    metrosRematesLaterales
  };
}

export function generateParametricStructure(
  geometria: StructuralGeometry,
  estructura: StructureOptions,
  _cobertura: CoberturaOptions,
  conexiones: ConexionesOptions,
  existingColumns?: ColumnElement[],
  existingVigas?: BeamElement[],
  existingCorreas?: PurlinElement[]
): { columnas: ColumnElement[]; vigas: BeamElement[]; correas: PurlinElement[] } {
  const { 
    largo, 
    ancho, 
    separacionPorticos, 
    tipoTecho,
    direccionCaida = 'calle',
    flechaArco = 1.20,
    anchoCorteL = 4.00,
    sectores = [],
    vacios = []
  } = geometria;

  const columnas: ColumnElement[] = [];
  const vigas: BeamElement[] = [];
  const correas: PurlinElement[] = [];

  const safePushViga = (v: BeamElement) => {
    const existing = existingVigas?.find(ex => ex.id === v.id);
    if (existing) {
      v.profileId = existing.profileId;
      v.material = existing.material;
      if (existing.isLocked) v.isLocked = true;
      if (existing.tag) v.tag = existing.tag;
    }
    vigas.push(v);
  };

  const safePushCorrea = (c: PurlinElement) => {
    const existing = existingCorreas?.find(ex => ex.id === c.id);
    if (existing) {
      c.profileId = existing.profileId;
      c.material = existing.material;
      if (existing.isLocked) c.isLocked = true;
      if (existing.tag) c.tag = existing.tag;
    }
    correas.push(c);
  };

  const safePushColumna = (c: ColumnElement) => {
    const existing = existingColumns?.find(ex => ex.id === c.id);
    if (existing) {
      c.profileId = existing.profileId;
      c.material = existing.material;
      if (existing.isLocked) c.isLocked = true;
      if (existing.tag) c.tag = existing.tag;
    }
    columnas.push(c);
  };

  let colCounter = 1;
  let beamCounter = 1;
  let purlinCounter = 1;

  // MULTI-SECTOR & FREE GEOMETRY GENERATION
  if (sectores && sectores.length > 0) {
    // Helper to find or add column at (x, y)
    const getOrAddColumn = (
      x: number, 
      y: number, 
      targetZ: number, 
      profileId = 'tub-cuad-100x100x3',
      material = 'A500 Gr. B'
    ): ColumnElement => {
      const existing = columnas.find(c => Math.hypot(c.x - x, c.y - y) < 0.20);
      if (existing) {
        if (targetZ > existing.altura && !existing.isCustom) {
          existing.altura = parseFloat(targetZ.toFixed(2));
        }
        return existing;
      }

      // Check if user previously had a column here with custom height or properties
      const prevCol = existingColumns?.find(c => Math.hypot(c.x - x, c.y - y) < 0.35);
      const chosenHeight = (prevCol && (prevCol.isCustom || prevCol.altura !== undefined))
        ? prevCol.altura
        : parseFloat(targetZ.toFixed(2));
      const chosenProfile = prevCol?.profileId || profileId;
      const chosenMaterial = prevCol?.material || material;
      const chosenPlate = prevCol?.basePlate !== undefined ? prevCol.basePlate : conexiones.placasBase;
      const chosenBolts = prevCol?.anchorBoltsCount !== undefined ? prevCol.anchorBoltsCount : (conexiones.pernosAnclaje ? 4 : 0);
      const isCustom = prevCol?.isCustom || false;

      const rawId = prevCol?.id || `col-sec-${colCounter}`;
      const uniqueId = columnas.some(c => c.id === rawId) ? `${rawId}-${colCounter}-${Math.random().toString(36).substring(2, 5)}` : rawId;

      const newCol: ColumnElement = {
        id: uniqueId,
        tag: prevCol?.tag || `C-${String(colCounter++).padStart(2, '0')}`,
        x: parseFloat(x.toFixed(2)),
        y: parseFloat(y.toFixed(2)),
        altura: chosenHeight,
        baseZ: 0,
        profileId: chosenProfile,
        material: chosenMaterial as any,
        basePlate: chosenPlate,
        anchorBoltsCount: chosenBolts,
        isCustom,
        isLocked: prevCol?.isLocked || false
      };
      safePushColumna(newCol);
      return newCol;
    };

    sectores.forEach((sec, secIdx) => {
      const vertices = sec.vertices;
      if (!vertices || vertices.length < 3) return;

      const bounds = getPolygonBounds(vertices);
      const deltaZ = Math.max(0.05, sec.alturaLadoAlto - sec.alturaLadoBajo);

      // Height function for this specific sector
      const getSectorZAt = (x: number, y: number): number => {
        let t = 0;
        if (sec.direccionCaida === 'calle') {
          // Low at minX, high at maxX
          const span = bounds.length || 1;
          t = (x - bounds.minX) / span;
        } else if (sec.direccionCaida === 'interior' || sec.direccionCaida === 'fondo') {
          const span = bounds.length || 1;
          t = 1 - (x - bounds.minX) / span;
        } else if (sec.direccionCaida === 'izquierda') {
          const span = bounds.width || 1;
          t = (y - bounds.minY) / span;
        } else if (sec.direccionCaida === 'derecha') {
          const span = bounds.width || 1;
          t = 1 - (y - bounds.minY) / span;
        } else {
          // Custom / diagonal
          const span = Math.hypot(bounds.length, bounds.width) || 1;
          t = ((x - bounds.minX) + (y - bounds.minY)) / (2 * span);
        }
        t = Math.max(0, Math.min(1, t));
        return sec.alturaLadoBajo + t * deltaZ;
      };

      // 1. Generate columns along polygon boundary
      const boundaryCols: ColumnElement[] = [];
      for (let i = 0; i < vertices.length; i++) {
        const p1 = vertices[i];
        const p2 = vertices[(i + 1) % vertices.length];
        const z1 = p1.z !== undefined ? p1.z : getSectorZAt(p1.x, p1.y);
        const col1 = getOrAddColumn(p1.x, p1.y, z1);
        boundaryCols.push(col1);

        const edgeLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const maxSpan = separacionPorticos || 4.0;
        if (edgeLen > maxSpan) {
          const numInter = Math.ceil(edgeLen / maxSpan) - 1;
          for (let k = 1; k <= numInter; k++) {
            const frac = k / (numInter + 1);
            const interX = p1.x + frac * (p2.x - p1.x);
            const interY = p1.y + frac * (p2.y - p1.y);
            const interZ = getSectorZAt(interX, interY);
            getOrAddColumn(interX, interY, interZ);
          }
        }
      }

      // 2. Generate perimeter beams connecting boundary columns
      if (estructura.vigasPrincipales) {
        for (let i = 0; i < vertices.length; i++) {
          const p1 = vertices[i];
          const p2 = vertices[(i + 1) % vertices.length];
          const z1 = getSectorZAt(p1.x, p1.y);
          const z2 = getSectorZAt(p2.x, p2.y);

          safePushViga({
            id: `beam-perim-s${secIdx}-${i}`,
            tag: `V-PER-${sec.nombre.replace(/\s+/g, '')}-${i + 1}`,
            startNode: { x: p1.x, y: p1.y, z: z1 },
            endNode: { x: p2.x, y: p2.y, z: z2 },
            profileId: 'ipe-200',
            material: 'A36',
            type: 'principal'
          });
        }

        // 3. Generate intermediate transverse frames (tijerales o vigas de carga)
        const frameInterval = separacionPorticos || 3.5;
        const numFrames = Math.max(1, Math.floor(bounds.length / frameInterval));
        for (let f = 1; f < numFrames; f++) {
          const curX = bounds.minX + f * (bounds.length / numFrames);
          const zA = getSectorZAt(curX, bounds.minY);
          const zB = getSectorZAt(curX, bounds.maxY);

          // Check if frame intersects sector polygon
          if (isPointInPolygon({ x: curX, y: (bounds.minY + bounds.maxY) / 2 }, vertices)) {
            if (estructura.tijerales) {
              const span = Math.max(1.0, bounds.maxY - bounds.minY);
              const panels = Math.max(4, Math.round(span / 1.5));
              const hTijeral = (geometria as any).peralteTijeral || 0.80;
              const trussZOffset = -0.06; // Offset to sit below purlins
              const baseTrussZ = Math.min(zA, zB) - hTijeral + trussZOffset;
              const chordProf = (estructura as any).perfilCuerda || 'tub-cuad-75x75x3';
              const webProf = (estructura as any).perfilWeb || 'tub-cuad-50x50x2';

              // Top chord
              safePushViga({
                id: `truss-top-s${secIdx}-${f}`,
                tag: `TJ-CS-${f}`,
                startNode: { x: curX, y: bounds.minY, z: zA + trussZOffset },
                endNode: { x: curX, y: bounds.maxY, z: zB + trussZOffset },
                profileId: chordProf,
                material: 'A500 Gr. B',
                type: 'tijeral_cuerda'
              });

              // Bottom chord
              safePushViga({
                id: `truss-bot-s${secIdx}-${f}`,
                tag: `TJ-CI-${f}`,
                startNode: { x: curX, y: bounds.minY, z: baseTrussZ },
                endNode: { x: curX, y: bounds.maxY, z: baseTrussZ },
                profileId: chordProf,
                material: 'A500 Gr. B',
                type: 'tijeral_cuerda'
              });

              // Verticals & Diagonals
              for (let p = 0; p <= panels; p++) {
                const frac = p / panels;
                const py = bounds.minY + frac * span;
                const pzTop = zA + frac * (zB - zA);

                // Montante
                safePushViga({
                  id: `truss-mon-s${secIdx}-${f}-${p}`,
                  tag: `TJ-M-${f}-${p + 1}`,
                  startNode: { x: curX, y: py, z: baseTrussZ },
                  endNode: { x: curX, y: py, z: pzTop },
                  profileId: webProf,
                  material: 'A500 Gr. B',
                  type: 'tijeral_montante'
                });

                // Diagonal
                if (p < panels) {
                  const nextFrac = (p + 1) / panels;
                  const nextY = bounds.minY + nextFrac * span;
                  const nextZTop = zA + nextFrac * (zB - zA);

                  const isEven = p % 2 === 0;
                  const diagStart = isEven 
                    ? { x: curX, y: py, z: baseTrussZ } 
                    : { x: curX, y: py, z: pzTop };
                  const diagEnd = isEven 
                    ? { x: curX, y: nextY, z: nextZTop } 
                    : { x: curX, y: nextY, z: baseTrussZ };

                  safePushViga({
                    id: `truss-diag-s${secIdx}-${f}-${p}`,
                    tag: `TJ-D-${f}-${p + 1}`,
                    startNode: diagStart,
                    endNode: diagEnd,
                    profileId: webProf,
                    material: 'A500 Gr. B',
                    type: 'tijeral_diagonal'
                  });
                }
              }
            } else {
              safePushViga({
                id: `beam-trans-s${secIdx}-${f}`,
                tag: `VP-${sec.nombre.replace(/\s+/g, '')}-${f}`,
                startNode: { x: curX, y: bounds.minY, z: zA },
                endNode: { x: curX, y: bounds.maxY, z: zB },
                profileId: 'ipe-240',
                material: 'A36',
                type: 'principal'
              });
            }
          }
        }
      }

      // 4. Generate purlins (correas) adapted to sector and direction
      if (estructura.correas) {
        const purlinSpacing = sec.correasConfig?.separacionM || estructura.separacionCorreas || 1.0;
        const purlinProfile = sec.correasConfig?.perfilId || 'perfil-c-100x50x2';
        const purlinDir = sec.correasConfig?.direccion || estructura.direccionCorreas || 'horizontal';

        if (purlinDir === 'vertical') {
          // Vertical purlins (running along Y, spaced along X)
          const numPurlinLines = Math.max(2, Math.round(bounds.length / purlinSpacing));
          for (let p = 0; p <= numPurlinLines; p++) {
            const curX = bounds.minX + p * (bounds.length / numPurlinLines);
            const pStart = { x: curX, y: bounds.minY };
            const pEnd = { x: curX, y: bounds.maxY };

            const isMidInVoid = vacios.some(v => isPointInPolygon({ x: curX, y: (pStart.y + pEnd.y) / 2 }, v.vertices));
            if (!isMidInVoid) {
              const z1 = getSectorZAt(curX, pStart.y) + 0.05;
              const z2 = getSectorZAt(curX, pEnd.y) + 0.05;

              safePushCorrea({
                id: `purlin-sec${secIdx}-v-${p}`,
                tag: `COR-${String(purlinCounter++).padStart(2, '0')}`,
                bayIndex: secIdx,
                slopePos: p * purlinSpacing,
                startNode: { x: curX, y: pStart.y, z: z1 },
                endNode: { x: curX, y: pEnd.y, z: z2 },
                profileId: purlinProfile,
                material: 'A36'
              });
            }
          }
        } else if (purlinDir === 'diagonal') {
          // Diagonal purlins (at angle across sector)
          const diagonalSteps = Math.max(3, Math.round((bounds.width + bounds.length) / (purlinSpacing * 1.4)));
          for (let p = 0; p <= diagonalSteps; p++) {
            const offset = (p / diagonalSteps) * (bounds.width + bounds.length);
            const pStart = { 
              x: Math.max(bounds.minX, bounds.minX + offset - bounds.width), 
              y: Math.min(bounds.maxY, bounds.minY + offset) 
            };
            const pEnd = { 
              x: Math.min(bounds.maxX, bounds.minX + offset), 
              y: Math.max(bounds.minY, bounds.minY + offset - bounds.length) 
            };

            if (Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y) > 0.5) {
              const z1 = getSectorZAt(pStart.x, pStart.y) + 0.05;
              const z2 = getSectorZAt(pEnd.x, pEnd.y) + 0.05;

              safePushCorrea({
                id: `purlin-sec${secIdx}-diag-${p}`,
                tag: `COR-${String(purlinCounter++).padStart(2, '0')}`,
                bayIndex: secIdx,
                slopePos: p * purlinSpacing,
                startNode: { x: pStart.x, y: pStart.y, z: z1 },
                endNode: { x: pEnd.x, y: pEnd.y, z: z2 },
                profileId: purlinProfile,
                material: 'A36'
              });
            }
          }
        } else {
          // Horizontal purlins (default - running along X, spaced along Y)
          const numPurlinLines = Math.max(2, Math.round(bounds.width / purlinSpacing));

          for (let p = 0; p <= numPurlinLines; p++) {
            const curY = bounds.minY + p * (bounds.width / numPurlinLines);
            const pStart = { x: bounds.minX, y: curY };
            const pEnd = { x: bounds.maxX, y: curY };

            // Check if purlin passes through void
            const isMidInVoid = vacios.some(v => isPointInPolygon({ x: (pStart.x + pEnd.x) / 2, y: curY }, v.vertices));

            if (!isMidInVoid && (isPointInPolygon({ x: (pStart.x + pEnd.x) / 2, y: curY }, vertices) || isPointInPolygon(pStart, vertices) || isPointInPolygon(pEnd, vertices))) {
              const z1 = getSectorZAt(pStart.x, curY) + 0.05;
              const z2 = getSectorZAt(pEnd.x, curY) + 0.05;

              safePushCorrea({
                id: `purlin-sec${secIdx}-${p}`,
                tag: `COR-${String(purlinCounter++).padStart(2, '0')}`,
                bayIndex: secIdx,
                slopePos: p * purlinSpacing,
                startNode: { x: pStart.x, y: curY, z: z1 },
                endNode: { x: pEnd.x, y: curY, z: z2 },
                profileId: purlinProfile,
                material: 'A36'
              });
            }
          }
        }
      }
    });

    return { columnas, vigas, correas };
  }

  // FALLBACK SINGLE GEOMETRY GENERATION (Standard Rectangular / L / Parabolic)
  const calc = calculateRoofGeometry(geometria);

  // Calculate number of frames (pórticos)
  const numSpans = Math.max(1, Math.round(largo / (separacionPorticos || 4.0)));
  const bayLength = largo / numSpans;
  const numFrames = numSpans + 1;

  const isDosAguas = tipoTecho === 'dos_aguas' || tipoTecho === 'dos_aguas_cumbrera';
  const isParabolic = tipoTecho === 'parabolico' || tipoTecho === 'arco';

  // Determine width of each frame for L shape (only if explicitly forma_l)
  const getFrameWidth = (fIndex: number): number => {
    if (tipoTecho === 'forma_l' && (anchoCorteL || 0) < ancho && (anchoCorteL || 0) > 0) {
      const stepCutIndex = Math.max(1, Math.floor(numFrames * 0.60));
      return fIndex >= stepCutIndex ? (anchoCorteL || ancho) : ancho;
    }
    return ancho;
  };

  // Helper function to get roof height at (x, y)
  const getZAt = (x: number, y: number, frameWidth: number = ancho): number => {
    if (isParabolic) {
      const normY = frameWidth > 0 ? y / frameWidth : 0;
      return calc.alturaLadoBajo + 4 * flechaArco * normY * (1 - normY);
    }

    if (isDosAguas) {
      const halfW = frameWidth / 2;
      const distFromApex = Math.abs(y - halfW);
      // High at apex, low at eaves
      return calc.alturaLadoAlto - (distFromApex / (halfW || 1)) * calc.deltaZ;
    }

    // Single slope (UNA CAÍDA) or CASI PLANO:
    // Direction determines where it is high and where it is low:
    if (direccionCaida === 'calle') {
      // Calle is at x = 0 (low), interior is at x = largo (high)
      const frac = x / (largo || 1);
      return calc.alturaLadoBajo + frac * calc.deltaZ;
    }
    if (direccionCaida === 'interior') {
      // High at street (x = 0), low at interior (x = largo)
      const frac = x / (largo || 1);
      return calc.alturaLadoAlto - frac * calc.deltaZ;
    }
    if (direccionCaida === 'izquierda') {
      // Low at y = 0, high at y = frameWidth
      const frac = y / (frameWidth || 1);
      return calc.alturaLadoBajo + frac * calc.deltaZ;
    }
    if (direccionCaida === 'derecha') {
      // High at y = 0, low at y = frameWidth
      const frac = y / (frameWidth || 1);
      return calc.alturaLadoAlto - frac * calc.deltaZ;
    }

    // Default: sloped across width (low at 0, high at width)
    const frac = y / (frameWidth || 1);
    return calc.alturaLadoBajo + frac * calc.deltaZ;
  };

  // 1. GENERATE COLUMNS
  if (estructura.columnas) {
    for (let f = 0; f < numFrames; f++) {
      const x = f * bayLength;
      const curWidth = getFrameWidth(f);

      // Left Column (y = 0)
      const prevLeft = existingColumns?.find(c => Math.hypot(c.x - x, c.y - 0) < 0.35);
      const hLeft = (prevLeft && (prevLeft.isCustom || prevLeft.altura !== undefined)) ? prevLeft.altura : parseFloat(getZAt(x, 0, curWidth).toFixed(2));
      const leftIdRaw = prevLeft?.id || `col-left-${f}`;
      const leftId = columnas.some(c => c.id === leftIdRaw) ? `${leftIdRaw}-${f}` : leftIdRaw;
      columnas.push({
        id: leftId,
        tag: prevLeft?.tag || `C-${String(colCounter++).padStart(2, '0')}`,
        x,
        y: 0,
        altura: hLeft,
        baseZ: 0,
        profileId: prevLeft?.profileId || 'tub-cuad-100x100x3',
        material: (prevLeft?.material || 'A500 Gr. B') as any,
        basePlate: prevLeft?.basePlate !== undefined ? prevLeft.basePlate : conexiones.placasBase,
        anchorBoltsCount: prevLeft?.anchorBoltsCount !== undefined ? prevLeft.anchorBoltsCount : (conexiones.pernosAnclaje ? 4 : 0),
        isCustom: prevLeft?.isCustom || false,
        isLocked: prevLeft?.isLocked || false
      });

      // Right Column (y = curWidth)
      const prevRight = existingColumns?.find(c => Math.hypot(c.x - x, c.y - curWidth) < 0.35);
      const hRight = (prevRight && (prevRight.isCustom || prevRight.altura !== undefined)) ? prevRight.altura : parseFloat(getZAt(x, curWidth, curWidth).toFixed(2));
      const rightIdRaw = prevRight?.id || `col-right-${f}`;
      const rightId = columnas.some(c => c.id === rightIdRaw) ? `${rightIdRaw}-${f}` : rightIdRaw;
      columnas.push({
        id: rightId,
        tag: prevRight?.tag || `C-${String(colCounter++).padStart(2, '0')}`,
        x,
        y: curWidth,
        altura: hRight,
        baseZ: 0,
        profileId: prevRight?.profileId || 'tub-cuad-100x100x3',
        material: (prevRight?.material || 'A500 Gr. B') as any,
        basePlate: prevRight?.basePlate !== undefined ? prevRight.basePlate : conexiones.placasBase,
        anchorBoltsCount: prevRight?.anchorBoltsCount !== undefined ? prevRight.anchorBoltsCount : (conexiones.pernosAnclaje ? 4 : 0),
        isCustom: prevRight?.isCustom || false,
        isLocked: prevRight?.isLocked || false
      });

      // L-shape extra corner column
      if (tipoTecho === 'forma_l' && (anchoCorteL || 0) < ancho && (anchoCorteL || 0) > 0) {
        const stepCutIndex = Math.max(1, Math.floor(numFrames * 0.60));
        if (f === stepCutIndex && curWidth < ancho) {
          const hStep = getZAt(x, ancho, ancho);
          columnas.push({
            id: `col-step-corner-${f}`,
            tag: `C-${String(colCounter++).padStart(2, '0')}`,
            x,
            y: ancho,
            altura: parseFloat(hStep.toFixed(2)),
            baseZ: 0,
            profileId: 'tub-cuad-100x100x3',
            material: 'A500 Gr. B',
            basePlate: conexiones.placasBase,
            anchorBoltsCount: conexiones.pernosAnclaje ? 4 : 0
          });
        }
      }
    }
  }

  // 2. GENERATE TRANSVERSE FRAMES (Vigas principales o Tijerales)
  for (let f = 0; f < numFrames; f++) {
    const x = f * bayLength;
    const curWidth = getFrameWidth(f);

    const trussProfileChord = 'tub-rec-100x50x2';
    const trussProfileWeb = 'ang-1.5x1.5x3/16';

    const zStart = getZAt(x, 0, curWidth);
    const zEnd = getZAt(x, curWidth, curWidth);

    if (estructura.tijerales) {
      const trussType: TipoTijeral = estructura.tipoTijeral || 'dos_aguas';
      const trussPattern: PatronTijeral = estructura.patronTijeral || 'warren';
      
      const isAsymTruss = trussType === 'asimetrico';
      const isPlanoTruss = trussType === 'plano';
      const isMonoTruss = trussType === 'una_agua';
      const isParaTruss = trussType === 'parabolico' || isParabolic;
      const isDosAguasTruss = trussType === 'dos_aguas' || (!isAsymTruss && !isPlanoTruss && !isMonoTruss && !isParaTruss && isDosAguas);
      if (isDosAguasTruss) {}

      const trussZOffset = -0.06; // 6cm offset to sit exactly below purlins/roof covering
      const hTijeral = (geometria as any).peralteTijeral || 0.70;

      if (isParaTruss) {
        // Parabólico
        const segments = Math.max(6, Math.round(curWidth / 1.2));
        const minZ = calc.alturaLadoBajo;
        
        // Bottom chord (Flat base for typical parabolic truss in this app context, or could be curved)
        safePushViga({
          id: `truss-bot-${f}`,
          tag: `TJ-INF-${f + 1}`,
          startNode: { x, y: 0, z: minZ },
          endNode: { x, y: curWidth, z: minZ },
          profileId: trussProfileChord,
          material: 'A36',
          type: 'tijeral_cuerda',
          tipoTijeral: 'parabolico',
          patronTijeral: trussPattern
        });

        // Top chord & web
        for (let i = 0; i < segments; i++) {
          const y1 = (i / segments) * curWidth;
          const y2 = ((i + 1) / segments) * curWidth;
          const z1 = getZAt(x, y1, curWidth) + trussZOffset;
          const z2 = getZAt(x, y2, curWidth) + trussZOffset;

          safePushViga({
            id: `truss-arc-top-${f}-${i}`,
            tag: `TJ-ARC-${f + 1}`,
            startNode: { x, y: y1, z: z1 },
            endNode: { x, y: y2, z: z2 },
            profileId: trussProfileChord,
            material: 'A36',
            type: 'tijeral_cuerda',
            tipoTijeral: 'parabolico',
            patronTijeral: trussPattern
          });

          if (i > 0) {
            safePushViga({
              id: `truss-arc-mon-${f}-${i}`,
              tag: `TJ-MON-${f + 1}`,
              startNode: { x, y: y1, z: minZ },
              endNode: { x, y: y1, z: z1 },
              profileId: trussProfileWeb,
              material: 'A36',
              type: 'tijeral_montante'
            });

            const yPrev = ((i - 1) / segments) * curWidth;
            safePushViga({
              id: `truss-arc-diag-${f}-${i}`,
              tag: `TJ-DIAG-${f + 1}`,
              startNode: { x, y: yPrev, z: minZ },
              endNode: { x, y: y1, z: z1 },
              profileId: trussProfileWeb,
              material: 'A36',
              type: 'tijeral_diagonal'
            });
          }
        }
      } else if (isPlanoTruss) {
        // 1. TIJERAL PLANO (Cordones paralelos / Peralte constante)
        const depth = hTijeral; 
        const divisions = Math.max(4, Math.round(curWidth / 1.5));
        const zTopStart = zStart + trussZOffset;
        const zTopEnd = zEnd + trussZOffset;

        // Bottom chord
        safePushViga({
          id: `truss-plano-bot-${f}`,
          tag: `TJ-PLANO-INF-${f + 1}`,
          startNode: { x, y: 0, z: zTopStart - depth },
          endNode: { x, y: curWidth, z: zTopEnd - depth },
          profileId: trussProfileChord,
          material: 'A36',
          type: 'tijeral_cuerda',
          tipoTijeral: 'plano',
          patronTijeral: trussPattern,
          trussHeight: depth,
          trussSpan: curWidth
        });

        // Top chord
        safePushViga({
          id: `truss-plano-top-${f}`,
          tag: `TJ-PLANO-SUP-${f + 1}`,
          startNode: { x, y: 0, z: zTopStart },
          endNode: { x, y: curWidth, z: zTopEnd },
          profileId: trussProfileChord,
          material: 'A36',
          type: 'tijeral_cuerda',
          tipoTijeral: 'plano',
          patronTijeral: trussPattern,
          trussHeight: depth,
          trussSpan: curWidth
        });

        // Web (Verticals and Diagonals)
        for (let i = 0; i <= divisions; i++) {
          const frac = i / divisions;
          const yPos = frac * curWidth;
          const zTopPos = zTopStart + frac * (zTopEnd - zTopStart);
          const zBotPos = zTopPos - depth;

          safePushViga({
            id: `truss-plano-mon-${f}-${i}`,
            tag: `TJ-MON-${f + 1}-${i}`,
            startNode: { x, y: yPos, z: zBotPos },
            endNode: { x, y: yPos, z: zTopPos },
            profileId: trussProfileWeb,
            material: 'A36',
            type: 'tijeral_montante'
          });

          if (i < divisions) {
            const fracNext = (i + 1) / divisions;
            const yNext = fracNext * curWidth;
            const zTopNext = zTopStart + fracNext * (zTopEnd - zTopStart);
            const zBotNext = zTopNext - depth;

            // Pattern logic
            let diagStart, diagEnd;
            if (trussPattern === 'pratt') {
              const isFirstHalf = frac < 0.5;
              diagStart = isFirstHalf ? { x, y: yNext, z: zBotNext } : { x, y: yPos, z: zBotPos };
              diagEnd = isFirstHalf ? { x, y: yPos, z: zTopPos } : { x, y: yNext, z: zTopNext };
            } else if (trussPattern === 'howe') {
              const isFirstHalf = frac < 0.5;
              diagStart = isFirstHalf ? { x, y: yPos, z: zBotPos } : { x, y: yNext, z: zBotNext };
              diagEnd = isFirstHalf ? { x, y: yNext, z: zTopNext } : { x, y: yPos, z: zTopPos };
            } else {
              const isEven = i % 2 === 0;
              diagStart = isEven ? { x, y: yPos, z: zBotPos } : { x, y: yPos, z: zTopPos };
              diagEnd = isEven ? { x, y: yNext, z: zTopNext } : { x, y: yNext, z: zBotNext };
            }

            safePushViga({
              id: `truss-plano-diag-${f}-${i}`,
              tag: `TJ-DIAG-${f + 1}-${i}`,
              startNode: diagStart,
              endNode: diagEnd,
              profileId: trussProfileWeb,
              material: 'A36',
              type: 'tijeral_diagonal'
            });
          }
        }
      } else if (isAsymTruss) {
        // 2. TIJERAL ASIMÉTRICO (Cumbrera desplazada ej. 35% / 65%)
        const apexRatio = 0.35;
        const apexY = curWidth * apexRatio;
        const zRidgeLocal = getZAt(x, apexY, curWidth) + trussZOffset;
        const zEaves = Math.min(zStart, zEnd) + trussZOffset;
        const depth = hTijeral;

        // Bottom chord
        safePushViga({
          id: `truss-asym-bot-${f}`,
          tag: `TJ-ASYM-INF-${f + 1}`,
          startNode: { x, y: 0, z: zEaves - depth },
          endNode: { x, y: curWidth, z: zEaves - depth },
          profileId: trussProfileChord,
          material: 'A36',
          type: 'tijeral_cuerda',
          tipoTijeral: 'asimetrico',
          patronTijeral: trussPattern,
          trussSpan: curWidth
        });

        // Top chords (left steep, right long)
        safePushViga({
          id: `truss-asym-top-l-${f}`,
          tag: `TJ-ASYM-SUP-L-${f + 1}`,
          startNode: { x, y: 0, z: zStart + trussZOffset },
          endNode: { x, y: apexY, z: zRidgeLocal },
          profileId: trussProfileChord,
          material: 'A36',
          type: 'tijeral_cuerda',
          tipoTijeral: 'asimetrico',
          patronTijeral: trussPattern
        });
        safePushViga({
          id: `truss-asym-top-r-${f}`,
          tag: `TJ-ASYM-SUP-R-${f + 1}`,
          startNode: { x, y: apexY, z: zRidgeLocal },
          endNode: { x, y: curWidth, z: zEnd + trussZOffset },
          profileId: trussProfileChord,
          material: 'A36',
          type: 'tijeral_cuerda',
          tipoTijeral: 'asimetrico',
          patronTijeral: trussPattern
        });

        // Web reticulation
        const divisions = 6;
        for (let i = 0; i <= divisions; i++) {
           const frac = i / divisions;
           const yPos = frac * curWidth;
           const zT = getZAt(x, yPos, curWidth) + trussZOffset;
           const zB = zEaves - depth;
           safePushViga({
             id: `truss-asym-web-${f}-${i}`,
             tag: `TJ-WEB-${f + 1}-${i}`,
             startNode: { x, y: yPos, z: zB },
             endNode: { x, y: yPos, z: zT },
             profileId: trussProfileWeb,
             material: 'A36',
             type: 'tijeral_montante'
           });
        }
      } else if (isMonoTruss) {
        // 3. TIJERAL UNA AGUA (Monopendiente / Cuña)
        const divisions = Math.max(5, Math.round(curWidth / 1.5));
        const zMinEave = Math.min(zStart, zEnd);
        const depth = hTijeral;
        const zStartAdj = zStart + trussZOffset;
        const zEndAdj = zEnd + trussZOffset;

        // Bottom chord
        safePushViga({
          id: `truss-mono-bot-${f}`,
          tag: `TJ-INF-${f + 1}`,
          startNode: { x, y: 0, z: zMinEave - depth },
          endNode: { x, y: curWidth, z: zMinEave - depth },
          profileId: trussProfileChord,
          material: 'A36',
          type: 'tijeral_cuerda',
          tipoTijeral: 'una_agua',
          patronTijeral: trussPattern,
          trussSpan: curWidth
        });

        // Top chord
        safePushViga({
          id: `truss-mono-top-${f}`,
          tag: `TJ-SUP-${f + 1}`,
          startNode: { x, y: 0, z: zStartAdj },
          endNode: { x, y: curWidth, z: zEndAdj },
          profileId: trussProfileChord,
          material: 'A36',
          type: 'tijeral_cuerda',
          tipoTijeral: 'una_agua',
          patronTijeral: trussPattern
        });

        // Web uprights & diagonals
        for (let i = 0; i <= divisions; i++) {
          const frac = i / divisions;
          const yPos = frac * curWidth;
          const zTop = getZAt(x, yPos, curWidth) + trussZOffset;
          const zBot = zMinEave - depth;

          safePushViga({
            id: `truss-mon-${f}-${i}`,
            tag: `TJ-MON-${f + 1}-${i}`,
            startNode: { x, y: yPos, z: zBot },
            endNode: { x, y: yPos, z: zTop },
            profileId: trussProfileWeb,
            material: 'A36',
            type: 'tijeral_montante'
          });

          if (i < divisions) {
            const fracNext = (i + 1) / divisions;
            const yNext = fracNext * curWidth;
            const zTopNext = getZAt(x, yNext, curWidth) + trussZOffset;
            const zBotNext = zMinEave - depth;
            
            const isEven = i % 2 === 0;
            safePushViga({
              id: `truss-diag-${f}-${i}`,
              tag: `TJ-DIAG-${f + 1}-${i}`,
              startNode: isEven ? { x, y: yPos, z: zBot } : { x, y: yPos, z: zTop },
              endNode: isEven ? { x, y: yNext, z: zTopNext } : { x, y: yNext, z: zBotNext },
              profileId: trussProfileWeb,
              material: 'A36',
              type: 'tijeral_diagonal'
            });
          }
        }
      } else {
        // 4. TIJERAL DOS AGUAS (Simétrico / Por defecto)
        const apexY = curWidth / 2;
        const zRidgeLocal = getZAt(x, apexY, curWidth) + trussZOffset;
        const zEaves = Math.min(zStart, zEnd) + trussZOffset;
        const depth = hTijeral;
        const zBotEave = zEaves - depth;

        // Bottom chord
        safePushViga({
          id: `truss-dos-bot-${f}`,
          tag: `TJ-INF-${f + 1}`,
          startNode: { x, y: 0, z: zBotEave },
          endNode: { x, y: curWidth, z: zBotEave },
          profileId: trussProfileChord,
          material: 'A36',
          type: 'tijeral_cuerda',
          tipoTijeral: 'dos_aguas',
          patronTijeral: trussPattern,
          trussSpan: curWidth
        });

        // Top chords
        safePushViga({
          id: `truss-dos-top-l-${f}`,
          tag: `TJ-SUP-L-${f + 1}`,
          startNode: { x, y: 0, z: zStart + trussZOffset },
          endNode: { x, y: apexY, z: zRidgeLocal },
          profileId: trussProfileChord,
          material: 'A36',
          type: 'tijeral_cuerda',
          tipoTijeral: 'dos_aguas',
          patronTijeral: trussPattern
        });
        safePushViga({
          id: `truss-dos-top-r-${f}`,
          tag: `TJ-SUP-R-${f + 1}`,
          startNode: { x, y: apexY, z: zRidgeLocal },
          endNode: { x, y: curWidth, z: zEnd + trussZOffset },
          profileId: trussProfileChord,
          material: 'A36',
          type: 'tijeral_cuerda',
          tipoTijeral: 'dos_aguas',
          patronTijeral: trussPattern
        });

        // Reticulation
        const divSide = 4;
        for (let i = 0; i <= divSide * 2; i++) {
          const y = (i / (divSide * 2)) * curWidth;
          const zT = getZAt(x, y, curWidth) + trussZOffset;
          const zB = zBotEave;
          
          safePushViga({
            id: `truss-da-mon-${f}-${i}`,
            tag: `TJ-MON-${f + 1}-${i}`,
            startNode: { x, y, z: zB },
            endNode: { x, y, z: zT },
            profileId: trussProfileWeb,
            material: 'A36',
            type: 'tijeral_montante'
          });

          if (i < divSide * 2) {
             const yNext = ((i + 1) / (divSide * 2)) * curWidth;
             const zTNext = getZAt(x, yNext, curWidth) + trussZOffset;
             const isEven = i % 2 === 0;
             safePushViga({
               id: `truss-da-diag-${f}-${i}`,
               tag: `TJ-DIAG-${f + 1}-${i}`,
               startNode: isEven ? { x, y, z: zB } : { x, y, z: zT },
               endNode: isEven ? { x, y: yNext, z: zTNext } : { x, y: yNext, z: zB },
               profileId: trussProfileWeb,
               material: 'A36',
               type: 'tijeral_diagonal'
             });
          }
        }
      }
    } else if (estructura.vigasPrincipales) {
      // Solid Rafter Beams (Vigas IPE / Tubulares)
      if (isDosAguas) {
        const apexY = curWidth / 2;
        const zRidgeLocal = getZAt(x, apexY, curWidth);
        safePushViga({
          id: `beam-main-l-${f}`,
          tag: `V-${String(beamCounter++).padStart(2, '0')}`,
          startNode: { x, y: 0, z: zStart },
          endNode: { x, y: apexY, z: zRidgeLocal },
          profileId: 'ipe-240',
          material: 'A36',
          type: 'principal'
        });
        safePushViga({
          id: `beam-main-r-${f}`,
          tag: `V-${String(beamCounter++).padStart(2, '0')}`,
          startNode: { x, y: apexY, z: zRidgeLocal },
          endNode: { x, y: curWidth, z: zEnd },
          profileId: 'ipe-240',
          material: 'A36',
          type: 'principal'
        });
      } else {
        // Una sola caída / casi plano
        safePushViga({
          id: `beam-main-${f}`,
          tag: `V-${String(beamCounter++).padStart(2, '0')}`,
          startNode: { x, y: 0, z: zStart },
          endNode: { x, y: curWidth, z: zEnd },
          profileId: 'ipe-240',
          material: 'A36',
          type: 'principal'
        });
      }
    }
  }

  // 3. LONGITUDINAL TIE BEAMS (Vigas de amarre perimetrales)
  for (let f = 0; f < numSpans; f++) {
    const x1 = f * bayLength;
    const x2 = (f + 1) * bayLength;
    const w1 = getFrameWidth(f);
    const w2 = getFrameWidth(f + 1);

    // Left edge (y = 0)
    const zL1 = getZAt(x1, 0, w1);
    const zL2 = getZAt(x2, 0, w2);
    safePushViga({
      id: `beam-long-alero-l-${f}`,
      tag: `VA-L-${f + 1}`,
      startNode: { x: x1, y: 0, z: zL1 },
      endNode: { x: x2, y: 0, z: zL2 },
      profileId: 'tub-rec-100x50x2',
      material: 'A500 Gr. B',
      type: 'secundaria'
    });

    // Right edge
    const minW = Math.min(w1, w2);
    const zR1 = getZAt(x1, minW, w1);
    const zR2 = getZAt(x2, minW, w2);
    safePushViga({
      id: `beam-long-alero-r-${f}`,
      tag: `VA-R-${f + 1}`,
      startNode: { x: x1, y: minW, z: zR1 },
      endNode: { x: x2, y: minW, z: zR2 },
      profileId: 'tub-rec-100x50x2',
      material: 'A500 Gr. B',
      type: 'secundaria'
    });

    // Cumbrera central si es dos aguas
    if (isDosAguas) {
      const halfW1 = w1 / 2;
      const halfW2 = w2 / 2;
      safePushViga({
        id: `beam-long-cumbrera-${f}`,
        tag: `VC-${f + 1}`,
        startNode: { x: x1, y: halfW1, z: getZAt(x1, halfW1, w1) },
        endNode: { x: x2, y: halfW2, z: getZAt(x2, halfW2, w2) },
        profileId: 'tub-rec-100x50x2',
        material: 'A500 Gr. B',
        type: 'secundaria'
      });
    }

    // Arriostres en primer y último vano
    if (estructura.arriostres && (f === 0 || f === numSpans - 1)) {
      safePushViga({
        id: `arriostre-col-l1-${f}`,
        tag: `ARR-C-${f + 1}A`,
        startNode: { x: x1, y: 0, z: 0.2 },
        endNode: { x: x2, y: 0, z: zL2 },
        profileId: 'ang-1.5x1.5x3/16',
        material: 'A36',
        type: 'arriostre'
      });
      safePushViga({
        id: `arriostre-col-l2-${f}`,
        tag: `ARR-C-${f + 1}B`,
        startNode: { x: x1, y: 0, z: zL1 },
        endNode: { x: x2, y: 0, z: 0.2 },
        profileId: 'ang-1.5x1.5x3/16',
        material: 'A36',
        type: 'arriostre'
      });
    }
  }

  // 4. GENERATE PURLINS (Correas)
  if (estructura.correas) {
    const spacing = estructura.separacionCorreas || 1.0;
    const purlinProfile = 'perfil-c-100x50x2';
    const purlinPosMode = estructura.posicionCorreas || (geometria as any).posicionCorreas || 'sobre_cuerda_superior';

    // Distribute purlins across each bay
    for (let f = 0; f < numSpans; f++) {
      const x1 = f * bayLength;
      const x2 = (f + 1) * bayLength;
      const curBayWidth = Math.min(getFrameWidth(f), getFrameWidth(f + 1));
      const zMinEave = Math.min(getZAt(x1, 0, curBayWidth), getZAt(x1, curBayWidth, curBayWidth));

      const generatePurlinRow = (yPos: number, zOffset: number, tagSuffix: string, zPlac: 'techo_superior' | 'cuerda_inferior', sIdx: number) => {
        const z1 = zPlac === 'cuerda_inferior' ? (zMinEave + zOffset) : (getZAt(x1, yPos, curBayWidth) + zOffset);
        const z2 = zPlac === 'cuerda_inferior' ? (zMinEave + zOffset) : (getZAt(x2, yPos, curBayWidth) + zOffset);

        safePushCorrea({
          id: `purlin-${f}-${tagSuffix}-${sIdx}`,
          tag: `COR-${String(purlinCounter++).padStart(2, '0')}`,
          bayIndex: f,
          slopePos: sIdx * spacing,
          startNode: { x: x1, y: yPos, z: z1 },
          endNode: { x: x2, y: yPos, z: z2 },
          profileId: purlinProfile,
          material: 'A36',
          zLevelPlacement: zPlac
        });
      };

      if (isDosAguas) {
        const apexY = curBayWidth / 2;
        const numPurlinsPerSide = Math.max(2, Math.round(apexY / spacing));

        for (let s = 0; s <= numPurlinsPerSide; s++) {
          const frac = s / numPurlinsPerSide;
          const yLeft = frac * apexY;
          const yRight = curBayWidth - yLeft;

          // Upper chord placement (red line - support for aluzinc roof)
          if (purlinPosMode === 'sobre_cuerda_superior' || purlinPosMode === 'ambas') {
            generatePurlinRow(yLeft, 0.05, 'top-l', 'techo_superior', s);
            if (s < numPurlinsPerSide) {
              generatePurlinRow(yRight, 0.05, 'top-r', 'techo_superior', s);
            }
          }

          // Lower chord placement (ceiling support)
          if (purlinPosMode === 'bajo_cuerda_inferior' || purlinPosMode === 'ambas') {
            generatePurlinRow(yLeft, -0.05, 'bot-l', 'cuerda_inferior', s);
            if (s < numPurlinsPerSide) {
              generatePurlinRow(yRight, -0.05, 'bot-r', 'cuerda_inferior', s);
            }
          }
        }
      } else {
        // Monopendiente (Una caída / casi plano / parabólico)
        const numPurlins = Math.max(3, Math.round(curBayWidth / spacing));
        for (let s = 0; s <= numPurlins; s++) {
          const frac = s / numPurlins;
          const y = frac * curBayWidth;

          if (purlinPosMode === 'sobre_cuerda_superior' || purlinPosMode === 'ambas') {
            generatePurlinRow(y, 0.05, 'top', 'techo_superior', s);
          }
          if (purlinPosMode === 'bajo_cuerda_inferior' || purlinPosMode === 'ambas') {
            generatePurlinRow(y, -0.05, 'bot', 'cuerda_inferior', s);
          }
        }
      }
    }
  }

  // Preserve any custom user-added columns that were not part of automatic grid
  if (existingColumns && existingColumns.length > 0) {
    existingColumns.forEach(c => {
      if (c.isCustom && !columnas.some(col => col.id === c.id || Math.hypot(col.x - c.x, col.y - c.y) < 0.15)) {
        columnas.push(c);
      }
    });
  }

  return { columnas, vigas, correas };
}
