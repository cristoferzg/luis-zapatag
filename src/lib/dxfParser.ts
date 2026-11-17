// Parser y Exportador de AutoCAD DXF (Drawing Exchange Format)
// Soporta entidades LINE, LWPOLYLINE, POLYLINE, CIRCLE, ARC, POINT, 3DFACE, TEXT
// Convierte entidades a nodos, segmentos y tubos con detección automática de escala (mm/cm/m)

export interface DxfPoint {
  x: number;
  y: number;
  z?: number;
}

export interface DxfLineEntity {
  type: 'LINE';
  layer: string;
  start: DxfPoint;
  end: DxfPoint;
  color?: number;
}

export interface DxfPolylineEntity {
  type: 'LWPOLYLINE' | 'POLYLINE';
  layer: string;
  vertices: DxfPoint[];
  isClosed: boolean;
  color?: number;
}

export interface DxfCircleEntity {
  type: 'CIRCLE';
  layer: string;
  center: DxfPoint;
  radius: number;
  color?: number;
}

export interface DxfArcEntity {
  type: 'ARC';
  layer: string;
  center: DxfPoint;
  radius: number;
  startAngleDeg: number;
  endAngleDeg: number;
  color?: number;
}

export interface DxfPointEntity {
  type: 'POINT';
  layer: string;
  point: DxfPoint;
  color?: number;
}

export interface DxfTextEntity {
  type: 'TEXT' | 'MTEXT';
  layer: string;
  point: DxfPoint;
  text: string;
  height: number;
}

export type DxfEntity = 
  | DxfLineEntity 
  | DxfPolylineEntity 
  | DxfCircleEntity 
  | DxfArcEntity 
  | DxfPointEntity 
  | DxfTextEntity;

export interface DxfParsedModel {
  entities: DxfEntity[];
  layers: string[];
  bounds: {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
    width: number;
    height: number;
    depth: number;
  };
  detectedUnit: 'mm' | 'cm' | 'm' | 'in';
  unitScaleToMeters: number;
}

/**
 * Parsea el contenido en texto plano de un archivo DXF de AutoCAD
 */
export function parseDxfContent(dxfText: string): DxfParsedModel {
  const lines = dxfText.split(/\r?\n/).map(l => l.trim());
  const entities: DxfEntity[] = [];
  const layersSet = new Set<string>();

  let inEntitiesSection = false;
  let i = 0;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  const updateBounds = (x: number, y: number, z: number = 0) => {
    if (isNaN(x) || isNaN(y)) return;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z || 0);
    maxZ = Math.max(maxZ, z || 0);
  };

  while (i < lines.length) {
    const code = lines[i];
    const value = lines[i + 1] || '';

    if (code === '0' && value === 'SECTION') {
      const nextCode = lines[i + 2];
      const nextValue = lines[i + 3] || '';
      if (nextCode === '2' && nextValue === 'ENTITIES') {
        inEntitiesSection = true;
        i += 4;
        continue;
      }
    }

    if (code === '0' && (value === 'ENDSEC' || value === 'EOF')) {
      if (inEntitiesSection) {
        inEntitiesSection = false;
      }
    }

    if (inEntitiesSection && code === '0') {
      const entityType = value.toUpperCase();

      if (entityType === 'LINE') {
        let layer = '0';
        let x1 = 0, y1 = 0, z1 = 0;
        let x2 = 0, y2 = 0, z2 = 0;
        let color: number | undefined;

        let j = i + 2;
        while (j < lines.length && lines[j] !== '0') {
          const c = lines[j];
          const v = lines[j + 1] || '';
          if (c === '8') layer = v;
          else if (c === '10') x1 = parseFloat(v) || 0;
          else if (c === '20') y1 = parseFloat(v) || 0;
          else if (c === '30') z1 = parseFloat(v) || 0;
          else if (c === '11') x2 = parseFloat(v) || 0;
          else if (c === '21') y2 = parseFloat(v) || 0;
          else if (c === '31') z2 = parseFloat(v) || 0;
          else if (c === '62') color = parseInt(v, 10);
          j += 2;
        }

        updateBounds(x1, y1, z1);
        updateBounds(x2, y2, z2);
        layersSet.add(layer);

        entities.push({
          type: 'LINE',
          layer,
          start: { x: x1, y: y1, z: z1 },
          end: { x: x2, y: y2, z: z2 },
          color
        });
        i = j;
        continue;
      }

      if (entityType === 'LWPOLYLINE' || entityType === 'POLYLINE') {
        let layer = '0';
        let isClosed = false;
        const vertices: DxfPoint[] = [];
        let currX: number | null = null;
        let currY: number | null = null;
        let currZ = 0;
        let color: number | undefined;

        let j = i + 2;
        while (j < lines.length && lines[j] !== '0') {
          const c = lines[j];
          const v = lines[j + 1] || '';
          if (c === '8') layer = v;
          else if (c === '70') isClosed = (parseInt(v, 10) & 1) === 1;
          else if (c === '38' || c === '30') currZ = parseFloat(v) || 0;
          else if (c === '62') color = parseInt(v, 10);
          else if (c === '10') {
            if (currX !== null && currY !== null) {
              vertices.push({ x: currX, y: currY, z: currZ });
              updateBounds(currX, currY, currZ);
              currY = null;
            }
            currX = parseFloat(v) || 0;
          } else if (c === '20') {
            currY = parseFloat(v) || 0;
          }
          j += 2;
        }

        if (currX !== null && currY !== null) {
          vertices.push({ x: currX, y: currY, z: currZ });
          updateBounds(currX, currY, currZ);
        }

        if (vertices.length > 0) {
          layersSet.add(layer);
          entities.push({
            type: entityType,
            layer,
            vertices,
            isClosed,
            color
          });
        }
        i = j;
        continue;
      }

      if (entityType === 'CIRCLE') {
        let layer = '0';
        let cx = 0, cy = 0, cz = 0;
        let radius = 0;
        let color: number | undefined;

        let j = i + 2;
        while (j < lines.length && lines[j] !== '0') {
          const c = lines[j];
          const v = lines[j + 1] || '';
          if (c === '8') layer = v;
          else if (c === '10') cx = parseFloat(v) || 0;
          else if (c === '20') cy = parseFloat(v) || 0;
          else if (c === '30') cz = parseFloat(v) || 0;
          else if (c === '40') radius = parseFloat(v) || 0;
          else if (c === '62') color = parseInt(v, 10);
          j += 2;
        }

        updateBounds(cx - radius, cy - radius, cz);
        updateBounds(cx + radius, cy + radius, cz);
        layersSet.add(layer);

        entities.push({
          type: 'CIRCLE',
          layer,
          center: { x: cx, y: cy, z: cz },
          radius,
          color
        });
        i = j;
        continue;
      }

      if (entityType === 'ARC') {
        let layer = '0';
        let cx = 0, cy = 0, cz = 0;
        let radius = 0;
        let startAngle = 0;
        let endAngle = 360;
        let color: number | undefined;

        let j = i + 2;
        while (j < lines.length && lines[j] !== '0') {
          const c = lines[j];
          const v = lines[j + 1] || '';
          if (c === '8') layer = v;
          else if (c === '10') cx = parseFloat(v) || 0;
          else if (c === '20') cy = parseFloat(v) || 0;
          else if (c === '30') cz = parseFloat(v) || 0;
          else if (c === '40') radius = parseFloat(v) || 0;
          else if (c === '50') startAngle = parseFloat(v) || 0;
          else if (c === '51') endAngle = parseFloat(v) || 0;
          else if (c === '62') color = parseInt(v, 10);
          j += 2;
        }

        updateBounds(cx - radius, cy - radius, cz);
        updateBounds(cx + radius, cy + radius, cz);
        layersSet.add(layer);

        entities.push({
          type: 'ARC',
          layer,
          center: { x: cx, y: cy, z: cz },
          radius,
          startAngleDeg: startAngle,
          endAngleDeg: endAngle,
          color
        });
        i = j;
        continue;
      }

      if (entityType === 'POINT') {
        let layer = '0';
        let px = 0, py = 0, pz = 0;
        let color: number | undefined;

        let j = i + 2;
        while (j < lines.length && lines[j] !== '0') {
          const c = lines[j];
          const v = lines[j + 1] || '';
          if (c === '8') layer = v;
          else if (c === '10') px = parseFloat(v) || 0;
          else if (c === '20') py = parseFloat(v) || 0;
          else if (c === '30') pz = parseFloat(v) || 0;
          else if (c === '62') color = parseInt(v, 10);
          j += 2;
        }

        updateBounds(px, py, pz);
        layersSet.add(layer);
        entities.push({
          type: 'POINT',
          layer,
          point: { x: px, y: py, z: pz },
          color
        });
        i = j;
        continue;
      }

      if (entityType === 'TEXT' || entityType === 'MTEXT') {
        let layer = '0';
        let px = 0, py = 0, pz = 0;
        let text = '';
        let height = 0.2;

        let j = i + 2;
        while (j < lines.length && lines[j] !== '0') {
          const c = lines[j];
          const v = lines[j + 1] || '';
          if (c === '8') layer = v;
          else if (c === '10') px = parseFloat(v) || 0;
          else if (c === '20') py = parseFloat(v) || 0;
          else if (c === '30') pz = parseFloat(v) || 0;
          else if (c === '40') height = parseFloat(v) || 0.2;
          else if (c === '1' || c === '3') text += v;
          j += 2;
        }

        updateBounds(px, py, pz);
        layersSet.add(layer);
        entities.push({
          type: entityType,
          layer,
          point: { x: px, y: py, z: pz },
          text,
          height
        });
        i = j;
        continue;
      }
    }

    i += 2;
  }

  // Si no se encontraron coordenadas válidas
  if (minX === Infinity) {
    minX = 0; maxX = 10;
    minY = 0; maxY = 10;
    minZ = 0; maxZ = 0;
  }

  const rawWidth = Math.max(0.001, maxX - minX);
  const rawHeight = Math.max(0.001, maxY - minY);
  const rawDepth = Math.max(0, maxZ - minZ);
  const maxSpan = Math.max(rawWidth, rawHeight, rawDepth);

  // Detección automática de escala
  // Si la dimensión es > 100, probablemente está en milímetros (típico en planos de AutoCAD mecánicos y de perfiles)
  // Si está entre 25 y 100, podría ser centímetros o metros grandes
  // Si está < 50, típicamente metros
  let detectedUnit: 'mm' | 'cm' | 'm' | 'in' = 'm';
  let unitScaleToMeters = 1.0;

  if (maxSpan > 80) {
    detectedUnit = 'mm';
    unitScaleToMeters = 0.001;
  } else if (maxSpan > 45 && maxSpan <= 80) {
    detectedUnit = 'cm';
    unitScaleToMeters = 0.01;
  } else {
    detectedUnit = 'm';
    unitScaleToMeters = 1.0;
  }

  return {
    entities,
    layers: Array.from(layersSet),
    bounds: {
      minX, minY, minZ,
      maxX, maxY, maxZ,
      width: rawWidth,
      height: rawHeight,
      depth: rawDepth
    },
    detectedUnit,
    unitScaleToMeters
  };
}

/**
 * Generador de Archivos AutoCAD DXF R12 estándar
 * Exporta cualquier geometría vectorial 2D/3D a formato .dxf que puede abrirse en cualquier AutoCAD
 */
export function generateDxfContent(
  lines: { x1: number; y1: number; z1?: number; x2: number; y2: number; z2?: number; layer?: string }[],
  projectName: string = 'Innova_Export'
): string {
  const output: string[] = [
    '999', `INNOVA CONTRATISTAS CAD - ${projectName}`,
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$ACADVER',
    '1', 'AC1009', // AutoCAD R12 ASCII DXF (máxima compatibilidad)
    '9', '$INSUNITS',
    '70', '6', // 6 = Meters
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'TABLES',
    '0', 'TABLE',
    '2', 'LAYER',
    '70', '1',
    '0', 'LAYER',
    '2', 'ESTRUCTURA',
    '70', '0',
    '62', '7', // White / Default
    '6', 'CONTINUOUS',
    '0', 'ENDTAB',
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'ENTITIES'
  ];

  lines.forEach((l) => {
    output.push(
      '0', 'LINE',
      '8', (l.layer || 'ESTRUCTURA').toUpperCase().replace(/\s+/g, '_'),
      '10', l.x1.toFixed(4),
      '20', l.y1.toFixed(4),
      '30', (l.z1 || 0).toFixed(4),
      '11', l.x2.toFixed(4),
      '21', l.y2.toFixed(4),
      '31', (l.z2 || 0).toFixed(4)
    );
  });

  output.push(
    '0', 'ENDSEC',
    '0', 'EOF'
  );

  return output.join('\n');
}

/**
 * Convierte un modelo DXF a piezas CAD estructuradas para el módulo de Herrería
 */
export function dxfModelToHerreriaPiezas(dxfModel: DxfParsedModel, customScale: number = 1.0): {
  piezas: any[];
  width: number;
  height: number;
} {
  const piezas: any[] = [];
  const minX = dxfModel.bounds.minX * customScale;
  const minY = dxfModel.bounds.minY * customScale;

  let index = 1;

  dxfModel.entities.forEach((entity) => {
    if (entity.type === 'LINE') {
      const x1 = entity.start.x * customScale - minX;
      const y1 = entity.start.y * customScale - minY;
      const z1 = (entity.start.z || 0) * customScale;
      const x2 = entity.end.x * customScale - minX;
      const y2 = entity.end.y * customScale - minY;
      const z2 = (entity.end.z || 0) * customScale;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const dz = z2 - z1;
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (length > 0.005) {
        piezas.push({
          id: `pieza_dxf_${Date.now()}_${index}`,
          marca: `DXF-${String(index).padStart(2, '0')}`,
          nombre: `Elemento ${entity.layer || 'CAD'} #${index}`,
          tipo: 'perfil',
          material: 'acero',
          perfilId: 'tub_sq_50_2',
          x1,
          y1,
          z1,
          x2,
          y2,
          z2,
          longitudM: parseFloat(length.toFixed(4)),
          rotacionDeg: 0,
          corteInicio: '90°',
          corteFin: '90°',
          cantidad: 1,
          grupo: entity.layer || 'ESTRUCTURA'
        });
        index++;
      }
    } else if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
      const v = entity.vertices;
      for (let k = 0; k < v.length - 1; k++) {
        const x1 = v[k].x * customScale - minX;
        const y1 = v[k].y * customScale - minY;
        const z1 = (v[k].z || 0) * customScale;
        const x2 = v[k + 1].x * customScale - minX;
        const y2 = v[k + 1].y * customScale - minY;
        const z2 = (v[k + 1].z || 0) * customScale;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (length > 0.005) {
          piezas.push({
            id: `pieza_dxf_${Date.now()}_${index}`,
            marca: `DXF-${String(index).padStart(2, '0')}`,
            nombre: `Polilínea ${entity.layer || 'CAD'} #${index}`,
            tipo: 'perfil',
            material: 'acero',
            perfilId: 'tub_sq_50_2',
            x1,
            y1,
            z1,
            x2,
            y2,
            z2,
            longitudM: parseFloat(length.toFixed(4)),
            rotacionDeg: 0,
            corteInicio: '90°',
            corteFin: '90°',
            cantidad: 1,
            grupo: entity.layer || 'POLILINEA'
          });
          index++;
        }
      }

      if (entity.isClosed && v.length > 2) {
        const first = v[0];
        const last = v[v.length - 1];
        const x1 = last.x * customScale - minX;
        const y1 = last.y * customScale - minY;
        const z1 = (last.z || 0) * customScale;
        const x2 = first.x * customScale - minX;
        const y2 = first.y * customScale - minY;
        const z2 = (first.z || 0) * customScale;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (length > 0.005) {
          piezas.push({
            id: `pieza_dxf_${Date.now()}_${index}`,
            marca: `DXF-${String(index).padStart(2, '0')}`,
            nombre: `Cierre Polilínea ${entity.layer || 'CAD'} #${index}`,
            tipo: 'perfil',
            material: 'acero',
            perfilId: 'tub_sq_50_2',
            x1,
            y1,
            z1,
            x2,
            y2,
            z2,
            longitudM: parseFloat(length.toFixed(4)),
            rotacionDeg: 0,
            corteInicio: '90°',
            corteFin: '90°',
            cantidad: 1,
            grupo: entity.layer || 'POLILINEA'
          });
          index++;
        }
      }
    }
  });

  const width = Math.max(0.5, dxfModel.bounds.width * customScale);
  const height = Math.max(0.5, dxfModel.bounds.height * customScale);

  return {
    piezas,
    width: parseFloat(width.toFixed(3)),
    height: parseFloat(height.toFixed(3))
  };
}

/**
 * Genera el archivo AutoCAD DXF desde el diseño de Herrería
 */
export function generateHerreriaDxf(design: any): string {
  const lines: { x1: number; y1: number; z1?: number; x2: number; y2: number; z2?: number; layer?: string }[] = [];

  // 1. Piezas CAD estructuradas
  if (Array.isArray(design.piezas) && design.piezas.length > 0) {
    design.piezas.forEach((p: any) => {
      lines.push({
        x1: p.x1 || 0,
        y1: p.y1 || 0,
        z1: p.z1 || 0,
        x2: p.x2 || 0,
        y2: p.y2 || 0,
        z2: p.z2 || 0,
        layer: p.grupo || p.marca || 'HERRERIA_PIEZA'
      });
    });
  } else {
    // 2. Si no tiene piezas CAD, extraer marco exterior por defecto
    const w = design.anchoM || 1.0;
    const h = design.altoM || 2.1;
    lines.push(
      { x1: 0, y1: 0, z1: 0, x2: w, y2: 0, z2: 0, layer: 'MARCO_INFERIOR' },
      { x1: w, y1: 0, z1: 0, x2: w, y2: h, z2: 0, layer: 'MARCO_DERECHO' },
      { x1: w, y1: h, z1: 0, x2: 0, y2: h, z2: 0, layer: 'MARCO_SUPERIOR' },
      { x1: 0, y1: h, z1: 0, x2: 0, y2: 0, z2: 0, layer: 'MARCO_IZQUIERDO' }
    );
  }

  // 3. Tubos personalizados si existen
  if (Array.isArray(design.tubosPersonalizados)) {
    design.tubosPersonalizados.forEach((t: any) => {
      lines.push({
        x1: t.x1 || 0,
        y1: t.y1 || 0,
        z1: 0,
        x2: t.x2 || 0,
        y2: t.y2 || 0,
        z2: 0,
        layer: t.marca || 'TUBO_PERSONALIZADO'
      });
    });
  }

  return generateDxfContent(lines, design.nombre || 'Herreria_Innova');
}
