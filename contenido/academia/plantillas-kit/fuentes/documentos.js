// Plantillas Word editables (InnovApp): propuesta comercial, acta de entrega con garantía y acuerdo de trabajo.
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  BorderStyle, LevelFormat, Header, Footer, PageNumber, HeightRule, VerticalAlign,
} = require('docx');

const NAVY = '0B2A45', NAR = 'F97316', GRIS = '5B6573';
const W = 9638; // ancho útil A4 con márgenes de 2 cm (11906 − 2×1134)

// Texto con campos [EDITABLES] resaltados en amarillo
function runs(texto, base = {}) {
  return String(texto).split(/(\[[^\]]+\])/).filter(Boolean).map(t =>
    t.startsWith('[') ? new TextRun({ text: t, highlight: 'yellow', ...base }) : new TextRun({ text: t, ...base }));
}
const p = (texto, o = {}) => new Paragraph({ children: runs(texto, o.run || {}), spacing: { after: o.after ?? 120, before: o.before ?? 0 }, alignment: o.align, ...(o.extra || {}) });
const h = (texto) => new Paragraph({ heading: 'Heading1', children: [new TextRun(texto)] });
const bullet = (texto) => new Paragraph({ numbering: { reference: 'vinetas', level: 0 }, children: runs(texto), spacing: { after: 60 } });
const num = (texto, ref = 'numeros') => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(texto), spacing: { after: 80 } });
const borde = { style: BorderStyle.SINGLE, size: 4, color: 'C9CED6' };
const bordes = { top: borde, bottom: borde, left: borde, right: borde };
function tabla(cols, filas, opts = {}) {
  const total = cols.reduce((a, b) => a + b, 0);
  const celda = (txt, i, cab, fila) => new TableCell({
    width: { size: cols[i], type: WidthType.DXA }, borders: bordes, verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    shading: cab ? { type: ShadingType.CLEAR, color: 'auto', fill: NAVY } : (opts.total && fila === filas.length - 1 ? { type: ShadingType.CLEAR, color: 'auto', fill: 'FDE3CF' } : undefined),
    children: [new Paragraph({ alignment: (opts.derecha || []).includes(i) ? AlignmentType.RIGHT : AlignmentType.LEFT,
      children: runs(txt, cab ? { bold: true, color: 'FFFFFF' } : (opts.total && fila === filas.length - 1 ? { bold: true } : {})) })],
  });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: cols,
    rows: [new TableRow({ tableHeader: true, children: opts.cab.map((t, i) => celda(t, i, true)) }),
      ...filas.map((f, k) => new TableRow({ children: f.map((t, i) => celda(t, i, false, k)) }))],
  });
}
const espacio = () => new Paragraph({ children: [], spacing: { after: 120 } });
function firmas(izq, der) {
  const c = (t1, t2) => new TableCell({ width: { size: W / 2, type: WidthType.DXA }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
    margins: { left: 300, right: 300 },
    children: [new Paragraph({ children: [], spacing: { before: 900 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '333333', space: 4 } } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: runs(t1, { bold: true, size: 18 }) }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: runs(t2, { size: 18, color: GRIS }) })] });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W / 2, W / 2],
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
    rows: [new TableRow({ children: [c(...izq), c(...der)] })] });
}
function membrete() {
  const sinBorde = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const nb = { top: sinBorde, bottom: sinBorde, left: sinBorde, right: sinBorde };
  const logo = new TableCell({ width: { size: 2600, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
    borders: { top: { style: BorderStyle.DASHED, size: 6, color: '9AA4B2' }, bottom: { style: BorderStyle.DASHED, size: 6, color: '9AA4B2' }, left: { style: BorderStyle.DASHED, size: 6, color: '9AA4B2' }, right: { style: BorderStyle.DASHED, size: 6, color: '9AA4B2' } },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TU LOGO AQUÍ', bold: true, color: '9AA4B2', size: 18 })] })] });
  const datos = new TableCell({ width: { size: W - 2600, type: WidthType.DXA }, borders: nb, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: runs('[NOMBRE DE TU EMPRESA]', { bold: true, size: 26, color: NAVY }) }),
      new Paragraph({ alignment: AlignmentType.RIGHT, children: runs('RUC [20XXXXXXXXX] · [Dirección del taller]', { size: 16, color: GRIS }) }),
      new Paragraph({ alignment: AlignmentType.RIGHT, children: runs('Cel./WhatsApp [999 999 999] · [correo@tuempresa.pe]', { size: 16, color: GRIS }) })] });
  return new Header({ children: [
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2600, W - 2600], rows: [new TableRow({ height: { value: 900, rule: HeightRule.ATLEAST }, children: [logo, datos] })] }),
    new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: NAR, space: 4 } }, spacing: { after: 200 } }),
  ] });
}
const pie = (txt) => new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
  new TextRun({ text: txt + '   ·   Página ', size: 16, color: GRIS }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRIS })] })] });
const titulo = (t, sub) => [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 40, color: NAR })], spacing: { after: 60 } }),
  ...(sub ? [new Paragraph({ children: runs(sub, { size: 20, color: GRIS }), spacing: { after: 240 } })] : [])];
const nota = (t) => new Paragraph({ children: [new TextRun({ text: t, italics: true, size: 17, color: GRIS })], spacing: { before: 120, after: 120 },
  shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F2F4F7' }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: NAR, space: 8 } } });

function documento(hijos, piePagina) {
  return new Document({
    creator: 'InnovApp', title: piePagina,
    styles: {
      default: { document: { run: { font: 'Arial', size: 21 } } },
      paragraphStyles: [{ id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'Arial', size: 24, bold: true, color: NAVY }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 0 } }],
    },
    numbering: { config: [
      { reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      { reference: 'numeros', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 340 } } } }] },
      { reference: 'clausulas', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 400 } } } }] },
    ] },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134, header: 500 } } },
      headers: { default: membrete() }, footers: { default: pie(piePagina) }, children: hijos }],
  });
}

// ───────── 1. Propuesta comercial ─────────
const propuesta = documento([
  ...titulo('PROPUESTA COMERCIAL', 'N° [PROP-2026-001]   ·   [Lima], [16 de noviembre de 2026]'),
  p('Señor(a): [Nombre del cliente]', { run: { bold: true }, after: 40 }),
  p('[Empresa del cliente, si aplica]', { after: 40 }),
  p('Presente.—', { after: 200 }),
  p('Asunto: [Fabricación e instalación de techo metálico y portón corredizo]', { run: { bold: true }, after: 200 }),
  p('Estimado(a) [Sr./Sra. Apellido]: gracias por la visita del [fecha de la visita]. Con las medidas tomadas en obra le presentamos nuestra propuesta para [describir el trabajo en una línea], con materiales de primera y mano de obra garantizada.'),
  h('1. Qué vamos a hacer'),
  bullet('[Fabricar e instalar un techo metálico de 6 × 5 m con estructura de tubo LAC y cobertura aluzinc TR-4 de 0.40 mm.]'),
  bullet('[Fabricar e instalar un portón corredizo de 3.90 × 2.40 m con plancha y riel.]'),
  bullet('[Aplicar pintura anticorrosiva y esmalte (2 capas) en todas las piezas.]'),
  bullet('[Retirar los desperdicios y dejar la zona limpia.]'),
  h('2. Materiales y especificaciones'),
  tabla([3000, W - 3000], [
    ['Estructura', '[Tubo LAC 100 × 50 × 2 mm (vigas) y 4" × 4" × 3 mm (columnas)]'],
    ['Cobertura', '[Aluzinc TR-4 de 0.40 mm, con pernos autoperforantes y capuchón]'],
    ['Portón', '[Marco de tubo 3" × 2", plancha de 1/32", ruedas de 4" y riel de ángulo]'],
    ['Acabado', '[Anticorrosivo epóxico + esmalte sintético, color a elegir]'],
    ['Soldadura', '[Electrodo E6011 y E7018, cordones continuos y esmerilados]'],
  ], { cab: ['Elemento', 'Especificación'] }),
  h('3. Inversión'),
  tabla([W - 2600, 2600], [
    ['[Techo metálico 6 × 5 m (30 m²)]', '[S/ 3,600.00]'],
    ['[Portón corredizo 3.90 × 2.40 m]', '[S/ 3,200.00]'],
    ['[Transporte e instalación]', '[S/ 150.00]'],
    ['TOTAL [incluye IGV]', '[S/ 6,950.00]'],
  ], { cab: ['Descripción', 'Monto'], derecha: [1], total: true }),
  nota('Si prefieres, adjunta el detalle de la plantilla Excel «Cotización profesional» y deja aquí solo el total.'),
  h('4. Plazo'),
  p('[15] días hábiles desde la recepción del adelanto y la confirmación de medidas. El cronograma se coordina con usted antes de empezar.'),
  h('5. Forma de pago'),
  bullet('[50 %] de adelanto para la compra de materiales: [S/ 3,475.00].'),
  bullet('[50 %] a la entrega y conformidad del trabajo: [S/ 3,475.00].'),
  p('Pagos a: [Banco / N° de cuenta / CCI / Yape a nombre de …].', { before: 80 }),
  h('6. Garantía'),
  p('[12] meses en soldadura y estructura, y [6] meses en pintura, contados desde la entrega. Los detalles van en el acta de entrega y certificado de garantía.'),
  h('7. Por qué elegirnos'),
  bullet('[X] años fabricando estructuras y carpintería metálica en [ciudad].'),
  bullet('Trabajo con medidas tomadas en obra y planos aprobados por usted antes de fabricar.'),
  bullet('Personal con equipos de seguridad y seguro de trabajo (SCTR) cuando la obra lo requiere.'),
  bullet('Fotos del avance por WhatsApp durante toda la obra.'),
  p('Esta propuesta es válida por [15] días. Quedamos atentos a sus consultas.', { before: 200 }),
  p('Atentamente,', { before: 120 }),
  firmas(['[Nombre del responsable]', '[Cargo] · [Nombre de tu empresa]'], ['Acepto la propuesta', '[Nombre y DNI del cliente] · Fecha: ____/____/____']),
], 'Propuesta comercial');

// ───────── 2. Acta de entrega y certificado de garantía ─────────
const acta = documento([
  ...titulo('ACTA DE ENTREGA Y CONFORMIDAD', 'Obra: [Techo metálico y portón — Jr. Las Flores 456, SJL]'),
  p('En [Lima], el [día] de [mes] de [2026], a las [hora], se reúnen en la obra:', { after: 80 }),
  bullet('Por el contratista: [Nombre], [cargo], de [Nombre de tu empresa], RUC [20XXXXXXXXX].'),
  bullet('Por el cliente: [Nombre del cliente], DNI [XXXXXXXX].'),
  p('para la entrega de los trabajos detallados a continuación, según la [cotización / propuesta N° …] del [fecha].', { before: 80 }),
  h('1. Trabajos entregados'),
  tabla([600, W - 600 - 1500 - 1800, 1500, 1800], [
    ['1', '[Techo metálico 6 × 5 m con cobertura aluzinc TR-4]', '[30 m²]', '[Conforme]'],
    ['2', '[Portón corredizo 3.90 × 2.40 m]', '[1 und]', '[Conforme]'],
    ['3', '[Pintura anticorrosiva y esmalte]', '[global]', '[Conforme]'],
    ['4', '[ ]', '[ ]', '[ ]'],
  ], { cab: ['N°', 'Descripción', 'Cantidad', 'Estado'] }),
  h('2. Revisión en presencia del cliente'),
  bullet('Estructura sin deformaciones, uniones soldadas completas y limpias.  ☐ Sí  ☐ No'),
  bullet('Cobertura bien fijada, sin goteras en la prueba con agua.  ☐ Sí  ☐ No'),
  bullet('Portón corre suave, con topes, chapa y llaves entregadas ([2] juegos).  ☐ Sí  ☐ No'),
  bullet('Pintura pareja, sin óxido ni partes sin pintar.  ☐ Sí  ☐ No'),
  bullet('Zona de trabajo limpia y sin desperdicios.  ☐ Sí  ☐ No'),
  h('3. Observaciones'),
  p('[Ninguna. / Detallar aquí lo que falta corregir y el plazo acordado para hacerlo: …]'),
  h('4. Conformidad y pago'),
  p('El cliente declara haber recibido los trabajos [a su conformidad / con las observaciones del punto 3]. Monto total de la obra: [S/ 6,950.00]. Pagado a la fecha: [S/ 6,950.00]. Saldo: [S/ 0.00].'),
  firmas(['Entregué conforme', '[Nombre] · [Nombre de tu empresa]'], ['Recibí conforme', '[Nombre y DNI del cliente]']),
  new Paragraph({ pageBreakBefore: true, children: [new TextRun({ text: 'CERTIFICADO DE GARANTÍA', bold: true, size: 36, color: NAR })], spacing: { after: 120 } }),
  p('N° [GAR-2026-001]   ·   Fecha de entrega: [dd/mm/2026]', { run: { color: GRIS } }),
  p('[Nombre de tu empresa] garantiza los trabajos entregados a [Nombre del cliente] en [dirección de la obra], en las condiciones siguientes:', { before: 120 }),
  h('Qué cubre y por cuánto tiempo'),
  tabla([W - 2400, 2400], [
    ['[Soldaduras y estructura metálica]', '[12 meses]'],
    ['[Pintura (desprendimiento u óxido por mala aplicación)]', '[6 meses]'],
    ['[Fijación de la cobertura y filtraciones por instalación]', '[12 meses]'],
    ['[Motor y accesorios (según garantía del fabricante)]', '[6 meses]'],
  ], { cab: ['Elemento', 'Plazo'] }),
  h('Qué no cubre'),
  bullet('Golpes, choques de vehículos, mal uso o cambios hechos por terceros.'),
  bullet('Daños por sismos, incendios, inundaciones u otros eventos fuera de lo normal.'),
  bullet('Óxido por falta del mantenimiento recomendado o por ambientes salinos sin protección especial.'),
  bullet('Desgaste normal de piezas móviles (ruedas, bisagras, chapas).'),
  h('Mantenimiento recomendado'),
  bullet('Revisar y retocar la pintura cada [12] meses (cada [6] meses cerca del mar).'),
  bullet('Limpiar canaletas antes de la temporada de lluvias.'),
  bullet('Engrasar ruedas, bisagras y chapas cada [3] meses.'),
  h('Cómo hacer válida la garantía'),
  p('Escríbenos al [999 999 999] con fotos del problema y este certificado. Visitamos la obra en un máximo de [5] días hábiles y, si corresponde a la garantía, la reparación no tiene costo.'),
  firmas(['[Nombre del responsable]', '[Nombre de tu empresa]'], ['Recibí el certificado', '[Nombre del cliente]']),
], 'Acta de entrega y garantía');

// ───────── 3. Acuerdo de trabajo simple ─────────
const cl = (t) => num(t, 'clausulas');
const acuerdo = documento([
  ...titulo('ACUERDO DE TRABAJO', 'Fabricación e instalación de [techo metálico y portón]'),
  nota('Modelo de orientación general para trabajos pequeños entre un taller y un cliente. Revísalo y adáptalo a cada obra; para obras grandes, montos altos o si tienes dudas, consulta con un abogado.'),
  p('Conste por el presente documento el acuerdo que celebran:', { before: 120 }),
  bullet('EL CONTRATISTA: [Nombre de tu empresa], RUC [20XXXXXXXXX], con domicilio en [dirección], representado por [nombre], DNI [XXXXXXXX].'),
  bullet('EL CLIENTE: [Nombre del cliente], DNI/RUC [XXXXXXXX], con domicilio en [dirección].'),
  p('en los términos siguientes:', { before: 80 }),
  h('Cláusulas'),
  cl('OBJETO. EL CONTRATISTA fabricará e instalará [descripción del trabajo] en [dirección de la obra], según la [cotización / propuesta N° …] del [fecha], que forma parte de este acuerdo.'),
  cl('PRECIO. El precio total es de [S/ 6,950.00] ([seis mil novecientos cincuenta con 00/100 soles]), [incluido / no incluido] el IGV.'),
  cl('FORMA DE PAGO. [50 %] de adelanto a la firma ([S/ 3,475.00]) y [50 %] a la entrega y conformidad ([S/ 3,475.00]), mediante [transferencia / Yape] a [cuenta]. Cada pago se respalda con comprobante.'),
  cl('PLAZO. El trabajo se realizará en [15] días hábiles desde el pago del adelanto. El plazo se amplía por lluvias, falta de acceso a la obra o cambios pedidos por EL CLIENTE, lo que se anotará por escrito o por WhatsApp.'),
  cl('CAMBIOS Y ADICIONALES. Todo cambio de medidas, materiales o trabajos no incluidos se cotiza aparte y solo se ejecuta con la aprobación de EL CLIENTE por escrito o por WhatsApp, indicando su precio y plazo.'),
  cl('OBLIGACIONES DEL CONTRATISTA. Usar los materiales ofrecidos, trabajar con seguridad, mantener el orden y la limpieza de la zona, y entregar el trabajo terminado con acta de entrega.'),
  cl('OBLIGACIONES DEL CLIENTE. Dar acceso a la obra en el horario acordado, contar con un punto de energía eléctrica [y agua], y pagar en las fechas acordadas.'),
  cl('GARANTÍA. EL CONTRATISTA garantiza el trabajo por [12] meses en soldadura y estructura y [6] meses en pintura, según el certificado de garantía que entrega con el acta.'),
  cl('ENTREGA. Al terminar, ambas partes revisan el trabajo y firman el acta de entrega. Si hay observaciones, EL CONTRATISTA las corrige en el plazo que se anote en el acta.'),
  cl('DESACUERDOS. Las partes buscarán primero una solución conversando. Si no llegan a un acuerdo, podrán acudir a un centro de conciliación o a las autoridades que correspondan.'),
  p('Firmado en dos ejemplares, en [Lima], el [día] de [mes] de [2026].', { before: 200 }),
  firmas(['EL CONTRATISTA', '[Nombre y DNI] · [Nombre de tu empresa]'], ['EL CLIENTE', '[Nombre y DNI]']),
], 'Acuerdo de trabajo');

(async () => {
  for (const [doc, n] of [[propuesta, 'Plantilla_Propuesta_Comercial_InnovApp.docx'], [acta, 'Plantilla_Acta_de_Entrega_y_Garantia_InnovApp.docx'], [acuerdo, 'Plantilla_Acuerdo_de_Trabajo_InnovApp.docx']]) {
    fs.writeFileSync(n, await Packer.toBuffer(doc)); console.log('ok', n);
  }
})();
