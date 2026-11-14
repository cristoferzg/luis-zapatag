"""Genera los materiales descargables (PDF A4) de los cursos de la Academia Innova Contratistas.
Uso: python3 contenido/academia/fuentes/recursos.py   (requiere playwright + Chrome)
"""
import base64, io, math, pathlib
from pypdf import PdfReader
from playwright.sync_api import sync_playwright

AQUI = pathlib.Path(__file__).parent
SALIDA = AQUI.parent / 'recursos'
EMBLEMA = base64.b64encode((AQUI / 'emblema.png').read_bytes()).decode()

CSS = """
@page{size:A4;margin:16mm 14mm 18mm 14mm}
*{box-sizing:border-box}
body{font-family:"Inter","Liberation Sans",Arial,sans-serif;color:#1e293b;font-size:10pt;line-height:1.38;margin:0}
header{display:flex;align-items:center;gap:12px;border-bottom:3px solid #f97316;padding-bottom:10px;margin-bottom:14px}
header img{width:46px;height:45px}
header .m{font-weight:800;color:#0b2a45;font-size:11pt;letter-spacing:.3px}
header .m small{display:block;color:#f97316;font-size:7.5pt;letter-spacing:1.6px}
header .c{margin-left:auto;text-align:right;font-size:8pt;color:#64748b}
h1{font-size:19pt;color:#0b2a45;margin:4px 0 4px;line-height:1.15}
.lead{color:#475569;margin:0 0 12px}
h2{break-after:avoid;font-size:12.5pt;color:#0b2a45;margin:13px 0 6px;padding-left:8px;border-left:4px solid #f97316}
table{width:100%;border-collapse:collapse;margin:6px 0 8px;font-size:9pt;page-break-inside:auto}
tr{page-break-inside:avoid}
th{background:#0b2a45;color:#fff;text-align:left;padding:6px 7px;font-weight:700}
td{border-bottom:1px solid #e2e8f0;padding:4px 7px;vertical-align:top}
tr:nth-child(even) td{background:#f8fafc}
.caja{background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:9px 12px;margin:10px 0}
.nota{font-size:8.5pt;color:#64748b}
ul.check{list-style:none;padding:0;margin:4px 0}
ul.check li{padding:5px 0 5px 28px;position:relative;border-bottom:1px dashed #e2e8f0}
ul.check li:before{content:"";position:absolute;left:2px;top:6px;width:14px;height:14px;border:2px solid #0b2a45;border-radius:3px}
.campos td{height:24px}
.dos{display:grid;grid-template-columns:1fr 1fr;gap:14px}
code,.f{font-family:"DejaVu Sans Mono",monospace;background:#f1f5f9;padding:1px 5px;border-radius:4px}
.firma{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:22px;font-size:9pt;color:#475569}
.firma div{border-top:1px solid #94a3b8;padding-top:4px}
svg text{font-family:"Inter",Arial,sans-serif}
"""

def doc(titulo, curso, lead, cuerpo):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<header><img src="data:image/png;base64,{EMBLEMA}"><div class="m">INNOVA CONTRATISTAS<small>ACADEMIA TÉCNICA</small></div>
<div class="c">Curso: {curso}<br>Material del alumno · innovacontratistas</div></header>
<h1>{titulo}</h1><p class="lead">{lead}</p>{cuerpo}</body></html>"""

def tabla(cab, filas):
    return '<table><tr>' + ''.join(f'<th>{c}</th>' for c in cab) + '</tr>' + ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in f) + '</tr>' for f in filas) + '</table>'

def checklist(items):
    return '<ul class="check">' + ''.join(f'<li>{i}</li>' for i in items) + '</ul>'

FIRMAS = '<div class="firma"><div>Revisado por</div><div>Fecha</div><div>Firma</div></div>'
DATOS_OBRA = tabla(['Obra / cliente', 'Elemento', 'Fecha'], [['&nbsp;', '&nbsp;', '&nbsp;']])

# ---------------------------------------------------------------- SOLDADURA
SOLD_TABLA = doc('Tabla de electrodos, amperajes y MIG', 'Soldadura Estructural SMAW y MIG',
 'Guía rápida para regular la máquina. Los rangos son referenciales: empieza en el medio del rango y ajusta según posición, espesor y lo que indique la caja del fabricante.',
 '<h2>Cómo leer un electrodo AWS A5.1 (ejemplo E7018)</h2>' + tabla(['Parte', 'Significa'], [
   ['E', 'Electrodo para soldadura por arco'],
   ['70', 'Resistencia a la tracción mínima del depósito: 70 000 psi (≈ 480 MPa)'],
   ['1', 'Posición: 1 = todas las posiciones (plana, horizontal, vertical, sobrecabeza)'],
   ['8', 'Tipo de revestimiento y corriente: 8 = bajo hidrógeno con polvo de hierro, CA o CC electrodo positivo'],
 ]) +
 '<h2>Electrodos más usados en estructuras</h2>' + tabla(['Electrodo', 'Corriente / polaridad', 'Uso típico', 'Ø 2.5 mm (3/32")', 'Ø 3.2 mm (1/8")', 'Ø 4.0 mm (5/32")'], [
   ['<b>E6011</b> (celulósico)', 'CA o CC+ (DCEP)', 'Pase de raíz, penetración profunda, piezas oxidadas o pintadas', '50 – 85 A', '75 – 120 A', '110 – 160 A'],
   ['<b>E6013</b> (rutílico)', 'CA, CC+ o CC−', 'Carpintería metálica, chapa delgada, buena presentación', '60 – 90 A', '80 – 125 A', '120 – 170 A'],
   ['<b>E7018</b> (bajo hidrógeno)', 'CA o CC+ (DCEP)', 'Estructuras, relleno y presentación de uniones que trabajan', '70 – 100 A', '90 – 140 A', '130 – 190 A'],
 ]) +
 '<div class="caja"><b>Regla práctica:</b> vertical y sobrecabeza ≈ 10 – 15 % menos amperaje que en plano. Arco corto (≈ el diámetro del núcleo) con E7018; arco un poco más largo y movimiento de látigo con E6011.</div>' +
 '<h2>Cuidado del E7018 (bajo hidrógeno)</h2>' + checklist([
   'Guardar los paquetes abiertos en horno de mantenimiento (≈ 65 – 150 °C, típicamente 120 °C).',
   'Si se humedeció, resecar según el fabricante (en general 260 – 425 °C por 1 a 2 horas). No resecar más de una vez si el fabricante lo prohíbe.',
   'Sacar solo lo que se usará en las próximas horas; no dejarlo al aire libre toda la jornada.',
   'Electrodo con revestimiento roto, húmedo o con óxido: descartarlo.',
 ]) +
 '<h2>MIG / GMAW con alambre sólido ER70S-6</h2>' + tabla(['Alambre Ø', 'Espesor típico', 'Voltaje', 'Amperaje', 'Gas y caudal'], [
   ['0.8 mm (.030")', '1 – 3 mm', '16 – 19 V', '60 – 130 A', 'CO₂ 100 % o Ar 75 / CO₂ 25 · 10 – 15 L/min'],
   ['0.9 mm (.035")', '2 – 6 mm', '17 – 22 V', '80 – 180 A', 'Ar 75 / CO₂ 25 · 12 – 18 L/min'],
   ['1.0 mm (.040")', '3 – 10 mm', '19 – 25 V', '120 – 250 A', 'Ar 75 / CO₂ 25 · 15 – 20 L/min'],
   ['1.2 mm (.045")', '6 mm a más', '22 – 28 V', '160 – 300 A', 'Ar 75 / CO₂ 25 · 15 – 22 L/min'],
 ]) +
 '<p class="nota">MIG con alambre sólido usa polaridad CC+ (DCEP). Protege la zona del viento: con corrientes de aire el gas se va y aparece porosidad; en obra a la intemperie es mejor SMAW o alambre tubular autoprotegido. Valores referenciales; verifica siempre la ficha técnica del fabricante (Soldexa, Lincoln, ESAB, etc.).</p>')

SOLD_CHECK = doc('Checklist de inspección visual de soldadura', 'Soldadura Estructural SMAW y MIG',
 'Úsalo antes, durante y después de soldar. La inspección visual detecta la mayoría de defectos cuando todavía es barato repararlos. Criterios basados en AWS D1.1 (estructuras de acero); para trabajos con especificación, manda la tabla de aceptación vigente de la norma o del proyecto.',
 DATOS_OBRA +
 '<h2>1. Antes de soldar</h2>' + checklist([
   'Soldador calificado / con experiencia en el proceso y la posición.',
   'Electrodo o alambre correcto según plano (p. ej. E7018 / ER70S-6) y E7018 salido del horno.',
   'Bordes limpios: sin óxido, pintura, grasa, humedad ni escoria de corte (25 mm a cada lado).',
   'Bisel, talón y separación de raíz según plano; piezas alineadas y punteadas.',
   'Máquina regulada y cable de tierra bien conectado cerca de la junta.',
 ]) +
 '<h2>2. Durante la soldadura</h2>' + checklist([
   'Limpieza de escoria entre pases (escobilla / piqueta / esmeril).',
   'Secuencia de soldadura para controlar deformaciones (alternar lados, soldar del centro hacia afuera).',
   'Sin viento fuerte sobre el arco (en MIG usar pantallas).',
 ]) +
 '<h2>3. Después: aceptación visual</h2>' + tabla(['Defecto', 'Criterio típico (AWS D1.1, carga estática)', 'OK / Obs.'], [
   ['Grietas', 'No se acepta ninguna grieta, de ningún tamaño.', ''],
   ['Fusión', 'Fusión completa entre metal de soldadura y metal base, y entre pases.', ''],
   ['Cráteres', 'Cráter lleno en toda la sección, salvo en los extremos de filetes intermitentes fuera de su longitud efectiva.', ''],
   ['Socavación', 'En material &lt; 25 mm: hasta 1 mm de profundidad (se permite hasta 2 mm en un total de 50 mm por cada 300 mm). En material ≥ 25 mm: hasta 2 mm.', ''],
   ['Porosidad', 'En juntas de penetración completa a tope transversales al esfuerzo: sin porosidad tubular visible. En las demás, limitada (ver tabla de la norma).', ''],
   ['Tamaño del filete', 'Igual o mayor al indicado en el plano; se tolera un faltante pequeño solo en una parte corta de la longitud, según tabla.', ''],
   ['Perfil', 'Sin convexidad excesiva ni traslape (overlap); refuerzo suave, sin muescas.', ''],
   ['Salpicadura y escoria', 'Retiradas antes de pintar.', ''],
 ]) +
 '<h2>4. Si hay defecto: causas frecuentes</h2>' + tabla(['Defecto', 'Causa probable', 'Corrección'], [
   ['Porosidad', 'Electrodo húmedo, superficie sucia, arco largo, viento (MIG)', 'Secar electrodo, limpiar, acortar arco, proteger del viento'],
   ['Socavación', 'Amperaje alto, ángulo incorrecto, avance rápido', 'Bajar amperaje, corregir ángulo, pausar en los bordes'],
   ['Falta de fusión', 'Amperaje bajo, avance rápido, mala limpieza', 'Subir amperaje, bajar velocidad, limpiar entre pases'],
   ['Inclusión de escoria', 'Mala limpieza entre pases', 'Esmerilar y volver a soldar'],
 ]) + FIRMAS)

# ---------------------------------------------------------------- NAVES
def tabla_arco():
    fr = [0.05 * i for i in range(0, 11)]
    filas = [[f'{r:.2f}', f'{4*r*(1-r):.3f}'] for r in fr]
    return filas

def ejemplo(L, f, paso=1.0):
    n = int(L / paso)
    filas = []
    for i in range(0, n // 2 + 1):
        x = i * paso
        y = 4 * f * x * (L - x) / L ** 2
        filas.append([f'{x:.2f}', f'{L - x:.2f}', f'{y:.3f}'])
    return filas

def largo_arco(L, f):
    r = f / L
    return L * (1 + 8 / 3 * r ** 2 - 32 / 5 * r ** 4)

def svg_arco():
    pts = ' '.join(f'{40 + 520 * t:.1f},{200 - 160 * 4 * t * (1 - t):.1f}' for t in [i / 50 for i in range(51)])
    return f'''<svg viewBox="0 0 600 240" width="100%" height="190"><polyline points="{pts}" fill="none" stroke="#f97316" stroke-width="4"/>
<line x1="30" y1="200" x2="570" y2="200" stroke="#0b2a45" stroke-width="2"/>
<line x1="300" y1="200" x2="300" y2="40" stroke="#0b2a45" stroke-dasharray="5 4"/>
<text x="306" y="125" font-size="15" fill="#0b2a45" font-weight="700">f (flecha)</text>
<line x1="40" y1="222" x2="560" y2="222" stroke="#0b2a45"/><text x="282" y="238" font-size="15" fill="#0b2a45" font-weight="700">L (luz)</text>
<line x1="170" y1="200" x2="170" y2="{200-160*4*0.25*0.75:.0f}" stroke="#0f766e" stroke-width="2"/><text x="120" y="215" font-size="13" fill="#0f766e">x</text>
<text x="176" y="160" font-size="13" fill="#0f766e" font-weight="700">y</text></svg>'''

NAVES_TRAZO = doc('Tabla de trazo de arcos parabólicos', 'Naves Parabólicas: Diseño, Fabricación y Montaje',
 'Para trazar el arco a escala real en el piso del taller: marca la luz, divide en tramos y levanta en cada punto la altura y. La parábola es simétrica: calcula media luz y repite al otro lado.',
 svg_arco() +
 '<div class="caja"><b>Fórmula:</b> <span class="f">y = 4 · f · x · (L − x) / L²</span> &nbsp; donde L = luz, f = flecha (altura en el centro), x = distancia desde el apoyo. '
 '<br><b>Largo del arco (aprox.):</b> <span class="f">S ≈ L · [1 + 8/3·(f/L)² − 32/5·(f/L)⁴]</span> — útil para el metrado de bridas y la cobertura (válido para f/L ≤ 0.3; para arcos más altos calcula por tramos).'
 '<br><b>Proporción usual:</b> f/L entre 1/6 y 1/4 en naves y coliseos (lo define el proyecto).</div>' +
 '<div class="dos"><div><h2>Tabla universal</h2><p class="nota">Multiplica el factor por la flecha f para obtener y en cualquier luz.</p>' + tabla(['x / L', 'y / f'], tabla_arco()) + '</div>'
 '<div><h2>Ejemplo: L = 20 m, f = 4 m</h2>' + tabla(['x (m)', 'x espejo (m)', 'y (m)'], ejemplo(20, 4)) +
 f'<p class="nota">Largo del arco ≈ {largo_arco(20, 4):.2f} m (contra 20 m de luz).</p></div></div>' +
 '<h2>Largos de arco para luces frecuentes</h2>' + tabla(['Luz L (m)', 'Flecha f (m)', 'f / L', 'Largo del arco S (m)'],
   [[f'{L}', f'{f}', f'{f/L:.2f}', f'{largo_arco(L, f):.2f}'] for L, f in [(10, 2), (12, 2.5), (15, 3), (18, 3.6), (20, 4), (24, 5), (25, 5), (30, 6)]]) +
 '<p class="nota">El arco reticulado tiene dos bridas: la exterior (extradós) y la interior (intradós) separadas por el peralte. Traza ambas con la misma fórmula usando su propia luz y flecha, o traza el eje y mide el peralte perpendicular al arco. Verifica el trazo con diagonales y prueba de simetría antes de soldar. Las dimensiones estructurales (perfiles, peralte, anclajes) las define el cálculo del ingeniero.</p>')

NAVES_CHECK = doc('Checklist de montaje de nave parabólica', 'Naves Parabólicas: Diseño, Fabricación y Montaje',
 'Revísalo por etapas y marca cada punto. Una nave bien montada empieza en los anclajes: un error de nivel o de ejes ahí se multiplica arriba.',
 DATOS_OBRA +
 '<h2>1. Antes de montar</h2>' + checklist([
   'Planos aprobados en obra (estructuras, detalles de anclaje y arriostramiento).',
   'Ejes trazados y verificados con diagonales; distancias entre apoyos según plano.',
   'Pernos de anclaje en posición, nivel y proyección correctos; roscas protegidas.',
   'Concreto de apoyos con resistencia suficiente (respetar tiempo de curado indicado).',
   'Arcos inspeccionados en taller: medidas, soldaduras y pintura base.',
   'Plan de izaje: equipo (grúa / tecle / tirfor), puntos de enganche, eslingas revisadas.',
   'Personal con EPP, arnés y línea de vida; zona de izaje señalizada y sin terceros.',
 ]) +
 '<h2>2. Durante el montaje</h2>' + checklist([
   'Primer arco izado, aplomado y arriostrado provisionalmente (vientos / puntales) antes de soltarlo.',
   'Segundo arco montado y unido de inmediato con correas y arriostres para formar el primer módulo rígido.',
   'Placas base niveladas con tuercas de nivelación o lainas; tuercas ajustadas y punteadas si el plano lo indica.',
   'Correas a la separación de plano, con sus tirantes / templadores.',
   'Arriostramiento en cruz en los paños indicados (techo y laterales); templadores tensados sin deformar.',
   'Verificación de aplome y alineamiento cada 2 – 3 arcos.',
   'Soldaduras de campo inspeccionadas y retocadas con pintura anticorrosiva.',
 ]) +
 '<h2>3. Cobertura y cierre</h2>' + checklist([
   'Calamina / TR4 curvada con el radio adecuado; traslapes longitudinales y laterales según fabricante.',
   'Fijaciones (autoperforantes con arandela de neopreno) en cantidad y ubicación correctas.',
   'Canaletas y bajadas con pendiente; cumbrera y tapajuntas sellados.',
   'Grout bajo placas base vaciado y curado; limpieza final y retoque de pintura.',
 ]) +
 '<h2>4. Mediciones de control</h2>' + tabla(['Arco N°', 'Luz medida (m)', 'Flecha medida (m)', 'Desplome (mm)', 'Observación'], [[str(i), '', '', '', ''] for i in range(1, 6)]) + FIRMAS)

# ---------------------------------------------------------------- ESTRUCTURAS
def kg(area_mm2):
    return area_mm2 * 0.00785  # kg/m con acero de 7850 kg/m³

ANG = [(1, 3), (1, 4.5), (1.5, 3), (1.5, 4.5), (1.5, 6), (2, 3), (2, 4.5), (2, 6), (2.5, 6), (3, 6), (3, 8)]
TUB = [(25, 1.5), (25, 2.0), (30, 1.5), (40, 1.5), (40, 2.0), (50, 2.0), (50, 3.0), (60, 2.0), (75, 3.0), (100, 3.0), (100, 4.0)]
TUBR = [(40, 20, 1.5), (40, 60, 2.0), (50, 100, 2.0), (50, 100, 3.0), (50, 150, 3.0)]
BAR = [('3/8"', 9.5), ('1/2"', 12.7), ('5/8"', 15.9), ('3/4"', 19.1), ('1"', 25.4)]

def filas_ang():
    out = []
    for b_pul, t in ANG:
        b = b_pul * 25.4
        a = t * (2 * b - t)
        out.append([f'L {b_pul:g}" × {t:g} mm', f'{a:.0f}', f'{kg(a):.2f}', f'{kg(a)*6:.1f}'])
    return out

def filas_tub():
    out = []
    for b, t in TUB:
        a = 4 * t * (b - t)
        out.append([f'□ {b} × {b} × {t:g} mm', f'{a:.0f}', f'{kg(a):.2f}', f'{kg(a)*6:.1f}'])
    for b, h, t in TUBR:
        a = 2 * t * (b + h - 2 * t)
        out.append([f'▭ {b} × {h} × {t:g} mm', f'{a:.0f}', f'{kg(a):.2f}', f'{kg(a)*6:.1f}'])
    return out

def filas_bar():
    return [[f'Ø {n} ({d} mm)', f'{math.pi*d*d/4:.0f}', f'{kg(math.pi*d*d/4):.2f}', f'{kg(math.pi*d*d/4)*6:.1f}'] for n, d in BAR]

EST_PERF = doc('Tabla de perfiles y pesos', 'Estructuras Metálicas: Perfiles, Conexiones y Montaje',
 'Pesos teóricos calculados con acero de 7850 kg/m³ y espesor nominal, sin radios de esquina. Sirven para metrar y presupuestar; para el pedido usa el catálogo del proveedor (los pesos reales varían unos pocos %).',
 '<h2>Ángulos de lados iguales (A36)</h2>' + tabla(['Perfil', 'Área (mm²)', 'kg / m', 'kg / barra 6 m'], filas_ang()) +
 '<h2>Tubos cuadrados y rectangulares (LAC / LAF, ASTM A500 / A513)</h2>' + tabla(['Perfil', 'Área (mm²)', 'kg / m', 'kg / barra 6 m'], filas_tub()) +
 '<h2>Barras redondas lisas</h2>' + tabla(['Barra', 'Área (mm²)', 'kg / m', 'kg / barra 6 m'], filas_bar()) +
 '<div class="caja"><b>Fórmulas para cualquier perfil:</b> peso (kg/m) = área (mm²) × 0.00785. &nbsp; Plancha: kg/m² = espesor (mm) × 7.85. '
 '&nbsp; Ángulo: área ≈ t · (2b − t). &nbsp; Tubo cuadrado: área ≈ 4 · t · (b − t). &nbsp; Platina: área = ancho × espesor.</div>' +
 '<p class="nota">Ejemplo de metrado: 14 barras de L 2" × 4.5 mm = 14 × 6 m × ' + f'{kg(4.5*(2*50.8-4.5)):.2f}' + ' kg/m ≈ ' + f'{14*6*kg(4.5*(2*50.8-4.5)):.0f}' + ' kg. Suma 5 – 10 % por desperdicio, soldadura y pernos.</p>')

EST_CHECK = doc('Checklist de control de calidad en taller', 'Estructuras Metálicas: Perfiles, Conexiones y Montaje',
 'Una hoja por pieza o lote. Lo que se controla en taller no se repara en obra (donde cuesta el triple).',
 tabla(['Obra / cliente', 'Marca de la pieza', 'Plano / revisión', 'Fecha'], [['&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;']]) +
 '<h2>1. Material</h2>' + checklist([
   'Perfil, espesor y calidad de acero según plano (A36, A500…); certificado del proveedor archivado.',
   'Sin abolladuras, laminaciones ni óxido profundo; barras rectas.',
 ]) +
 '<h2>2. Corte y armado</h2>' + checklist([
   'Lista de cortes revisada contra el plano antes de cortar.',
   'Cortes a escuadra y sin rebabas; biseles con el ángulo y talón indicados.',
   'Agujeros en posición y diámetro correctos (taladrados, no hechos con soplete).',
   'Armado en mesa o plantilla; diagonales iguales (escuadra) antes de soldar.',
 ]) +
 '<h2>3. Tolerancias de referencia</h2>' + tabla(['Control', 'Tolerancia referencial', 'Medido'], [
   ['Longitud de pieza (hasta 9 m)', '± 2 mm (piezas que apoyan en conexiones) / ± 3 mm (otras)', ''],
   ['Rectitud de columnas y vigas', 'Longitud / 1000', ''],
   ['Diferencia de diagonales en armados', '≤ 3 mm', ''],
   ['Posición de agujeros', '± 1.5 mm', ''],
 ]) + '<p class="nota">Valores referenciales comunes (AISC 303 / buena práctica de taller). Si el proyecto especifica otras tolerancias, mandan las del proyecto.</p>' +
 '<h2>4. Soldadura</h2>' + checklist([
   'Tamaño y longitud de filetes según plano; inspección visual aprobada (ver checklist de soldadura).',
   'Sin escoria ni salpicaduras; deformaciones corregidas.',
 ]) +
 '<h2>5. Limpieza y pintura</h2>' + checklist([
   'Limpieza mecánica o arenado según especificación; superficie sin grasa ni óxido suelto.',
   'Base anticorrosiva aplicada dentro de las horas siguientes a la limpieza.',
   'Espesor de película seca medido (μm) según especificación; acabado en el color del proyecto.',
   'Pieza marcada con su código y lista para despacho.',
 ]) + FIRMAS)

# ---------------------------------------------------------------- CARPINTERIA
CARP_GUIA = doc('Guía de medidas y holguras', 'Carpintería Metálica: Puertas, Portones, Rejas y Barandas',
 'Medidas frecuentes en vivienda y comercio en el Perú. Son referenciales: confirma siempre el vano en obra y, en edificaciones, lo que pida el proyecto y el Reglamento Nacional de Edificaciones (RNE).',
 '<h2>Cómo medir el vano</h2>' + checklist([
   'Mide el ancho arriba, al medio y abajo; y el alto a la izquierda, al centro y a la derecha. Trabaja con la medida MENOR.',
   'Mide las dos diagonales: si difieren más de 5 mm, el vano no está a escuadra (anótalo y ajusta el marco).',
   'Revisa plomo de los muros y nivel del piso terminado (¿falta el piso o el contrapiso?).',
   'Anota hacia dónde abre, de qué lado van las bisagras y dónde va la chapa.',
 ]) +
 '<h2>Medidas frecuentes</h2>' + tabla(['Elemento', 'Medida usual', 'Comentario'], [
   ['Puerta peatonal de calle', '0.90 – 1.00 m × 2.10 – 2.40 m', 'Hoja de 0.90 m es la más pedida'],
   ['Puerta interior / servicio', '0.70 – 0.80 m × 2.10 m', ''],
   ['Portón vehicular (1 auto)', '2.80 – 3.00 m de ancho × 2.20 – 2.60 m', 'Para camioneta, mínimo 3.00 m'],
   ['Portón vehicular (2 autos)', '5.00 – 5.50 m de ancho', 'Batiente de 2 hojas o corredizo'],
   ['Baranda de escalera', '0.85 – 0.90 m de altura', 'Medida vertical desde la nariz del paso'],
   ['Baranda de balcón / terraza', '≥ 0.90 m (más en alturas mayores, según proyecto)', 'Verificar RNE A.010'],
   ['Separación entre barrotes', '≤ 0.10 – 0.13 m libre', 'Para que no pase un niño; verifica la norma aplicable'],
   ['Escalera: contrahuella (paso vertical)', '0.15 – 0.18 m', 'Regla 2C + H ≈ 0.60 – 0.64 m'],
   ['Escalera: huella (paso horizontal)', '≥ 0.25 m', ''],
 ]) +
 '<h2>Holguras de fabricación</h2>' + tabla(['Dónde', 'Holgura', 'Por qué'], [
   ['Marco contra vano (cada lado)', '5 – 10 mm', 'Para aplomar y fijar; se rellena con mortero o espuma'],
   ['Hoja contra marco (laterales y arriba)', '3 – 4 mm', 'Pintura y dilatación sin que roce'],
   ['Bajo la hoja (sin umbral)', '10 – 15 mm', 'Por el piso terminado o alfombra'],
   ['Portón corredizo: hoja contra riel / guía', '5 – 8 mm', 'Juego para que corra sin trabarse'],
   ['Entre hojas de portón batiente', '8 – 10 mm', 'Para que cierre con la pintura y el sol'],
 ]) + '<p class="nota">Acero al sol: una hoja de 3 m puede crecer cerca de 1 mm con 30 °C de diferencia; deja la holgura de las hojas grandes en el lado del cierre.</p>')

CARP_HOJA = doc('Hoja de despiece y cotización', 'Carpintería Metálica: Puertas, Portones, Rejas y Barandas',
 'Imprímela y llénala para cada trabajo. Con el despiece sacas cuántas barras de 6 m comprar; con la cotización armas un precio que cubre todo y deja ganancia.',
 tabla(['Cliente', 'Trabajo', 'Medida del vano (ancho × alto)', 'Fecha'], [['&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;']]) +
 '<h2>1. Lista de cortes</h2>' + '<table class="campos"><tr><th>Pieza</th><th>Perfil</th><th>Largo (mm)</th><th>Cantidad</th><th>Total (m)</th></tr>' + ''.join('<tr><td></td><td></td><td></td><td></td><td></td></tr>' for _ in range(7)) + '</table>' +
 '<h2>2. Material a comprar</h2>' + '<table class="campos"><tr><th>Perfil / insumo</th><th>Metros totales</th><th>Barras de 6 m (redondear arriba)</th><th>Precio unitario</th><th>Subtotal</th></tr>' + ''.join('<tr><td></td><td></td><td></td><td></td><td></td></tr>' for _ in range(5)) + '</table>' +
 '<div class="caja"><b>Optimiza las barras:</b> ordena los cortes del más largo al más corto y llena cada barra de 6 m antes de abrir otra. Descuenta 3 mm por cada corte de disco. Los retazos de más de 0.50 m guárdalos con su medida.</div>' +
 '<h2>3. Cotización</h2>' + tabla(['Concepto', 'Monto (S/)'], [
   ['A. Material (subtotal del cuadro 2)', ''],
   ['B. Insumos: discos, electrodos / alambre, gas, lijas (≈ 8 – 12 % de A)', ''],
   ['C. Accesorios: bisagras, chapa, ruedas, rieles, pernos, anclajes', ''],
   ['D. Pintura: base anticorrosiva + esmalte + thinner', ''],
   ['E. Mano de obra: días × personas × jornal', ''],
   ['F. Transporte e instalación', ''],
   ['<b>Costo directo (A + B + C + D + E + F)</b>', ''],
   ['G. Gastos del taller (luz, alquiler, desgaste) ≈ 10 %', ''],
   ['H. Utilidad (20 – 30 % sobre el costo)', ''],
   ['<b>PRECIO DE VENTA</b>', ''],
   ['Adelanto (50 – 60 %) / saldo contra entrega', ''],
 ]) + '<p class="nota">Tip: en InnovApp puedes hacer el despiece y la cotización automáticos en Carpintería Metálica y mandar la propuesta al cliente.</p>')

# ---------------------------------------------------------------- PLANOS
def simbolo(titulo, dibujo, texto):
    return f'''<div style="border:1px solid #e2e8f0;border-radius:8px;padding:8px;break-inside:avoid">
<svg viewBox="0 0 260 120" width="100%" height="104">
<line x1="40" y1="70" x2="210" y2="70" stroke="#0b2a45" stroke-width="2.5"/>
<line x1="40" y1="70" x2="12" y2="108" stroke="#0b2a45" stroke-width="2.5"/><polygon points="12,108 14,94 24,100" fill="#0b2a45"/>
{dibujo}</svg><b style="color:#0b2a45">{titulo}</b><div class="nota" style="color:#334155">{texto}</div></div>'''

PL_SIMB = doc('Guía de simbología de soldadura (AWS A2.4)', 'Lectura de Planos de Estructuras Metálicas',
 'El símbolo de soldadura dice qué soldadura hacer, de qué tamaño y dónde. Se lee siempre sobre la línea de referencia (horizontal), no según hacia dónde apunte la flecha.',
 '<h2>Partes del símbolo</h2>' + tabla(['Parte', 'Qué indica'], [
   ['Línea de referencia', 'Línea horizontal donde se colocan todos los datos. Siempre se lee de izquierda a derecha.'],
   ['Flecha', 'Señala la junta. El lado donde toca la flecha es el "lado de la flecha".'],
   ['Símbolo DEBAJO de la línea', 'Soldar en el LADO DE LA FLECHA.'],
   ['Símbolo ENCIMA de la línea', 'Soldar en el OTRO LADO de la junta.'],
   ['Símbolo a ambos lados', 'Soldar los dos lados.'],
   ['Número a la izquierda del símbolo', 'Tamaño de la soldadura (p. ej. 6 = filete de 6 mm de cateto).'],
   ['Números a la derecha', 'Longitud y paso (p. ej. 50-150 = tramos de 50 mm cada 150 mm entre centros: soldadura intermitente).'],
   ['Círculo en el quiebre de la flecha', 'Soldar todo alrededor.'],
   ['Banderita en el quiebre', 'Soldadura en campo (en obra, no en taller).'],
   ['Cola (V abierta al final)', 'Especificación, proceso o nota (p. ej. E7018, SMAW, WPS-01).'],
 ]) +
 '<h2>Símbolos más usados</h2><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">' +
 simbolo('Filete, lado de la flecha', '<polygon points="100,70 100,98 128,70" fill="none" stroke="#f97316" stroke-width="3"/><text x="74" y="92" font-size="16" fill="#0b2a45" font-weight="700">6</text>', 'Filete de 6 mm del lado que toca la flecha.') +
 simbolo('Filete, otro lado', '<polygon points="100,70 100,42 128,70" fill="none" stroke="#f97316" stroke-width="3"/><text x="74" y="62" font-size="16" fill="#0b2a45" font-weight="700">6</text>', 'Filete de 6 mm del lado opuesto a la flecha.') +
 simbolo('Filete ambos lados', '<polygon points="100,70 100,98 128,70" fill="none" stroke="#f97316" stroke-width="3"/><polygon points="100,70 100,42 128,70" fill="none" stroke="#f97316" stroke-width="3"/>', 'Mismo filete en los dos lados de la junta.') +
 simbolo('Bisel en V', '<polyline points="92,98 110,70 128,98" fill="none" stroke="#f97316" stroke-width="3"/>', 'Junta a tope con bisel en V del lado de la flecha.') +
 simbolo('Bisel simple', '<polyline points="104,98 104,70 128,98" fill="none" stroke="#f97316" stroke-width="3"/>', 'Solo una pieza biselada; la flecha quebrada apunta a la pieza que se bisela.') +
 simbolo('A tope recto', '<line x1="104" y1="70" x2="104" y2="96" stroke="#f97316" stroke-width="3"/><line x1="116" y1="70" x2="116" y2="96" stroke="#f97316" stroke-width="3"/>', 'Junta a tope sin bisel (chapas delgadas).') +
 simbolo('Todo alrededor', '<circle cx="40" cy="70" r="9" fill="none" stroke="#f97316" stroke-width="3"/><polygon points="100,70 100,98 128,70" fill="none" stroke="#f97316" stroke-width="3"/>', 'Filete en todo el contorno (p. ej. tubo sobre plancha base).') +
 simbolo('Soldadura en campo', '<line x1="40" y1="70" x2="40" y2="36" stroke="#f97316" stroke-width="3"/><polygon points="40,36 64,44 40,52" fill="#f97316"/><polygon points="100,70 100,98 128,70" fill="none" stroke="#f97316" stroke-width="3"/>', 'Se suelda en obra durante el montaje.') +
 simbolo('Intermitente con cola', '<polygon points="100,70 100,98 128,70" fill="none" stroke="#f97316" stroke-width="3"/><text x="76" y="92" font-size="15" fill="#0b2a45" font-weight="700">5</text><text x="134" y="92" font-size="15" fill="#0b2a45" font-weight="700">50-150</text><polyline points="226,56 210,70 226,84" fill="none" stroke="#0b2a45" stroke-width="2.5"/><text x="228" y="75" font-size="12" fill="#0b2a45">E7018</text>', 'Filete de 5 mm, tramos de 50 mm cada 150 mm, con E7018.') +
 '</div><p class="nota" style="margin-top:10px">Resumen basado en la norma AWS A2.4 (símbolos de soldadura y ensayos no destructivos). Algunos planos usan la norma ISO 2553, donde la convención de lados se indica con una línea discontinua adicional: revisa la leyenda del plano.</p>')

PL_GLOS = doc('Glosario de planos estructurales', 'Lectura de Planos de Estructuras Metálicas',
 'Los términos que más aparecen en planos y especificaciones de estructuras metálicas, explicados en palabras de taller.',
 tabla(['Término', 'Qué significa'], [
   ['Rótulo / membrete', 'Cuadro de la lámina con proyecto, número de lámina, escala, fecha, revisión y firmas.'],
   ['Escala 1:50', '1 cm en el plano son 50 cm reales. Mide con escalímetro; nunca escales si hay cota escrita.'],
   ['Cota', 'Medida escrita en el plano. Manda la cota, no lo que mida el dibujo.'],
   ['Eje', 'Línea de referencia (A, B, C… / 1, 2, 3…) desde la que se ubican columnas y apoyos.'],
   ['Nivel (NPT, NFP)', 'Altura respecto a un punto de referencia: Nivel de Piso Terminado, Nivel de Fondo de Placa, etc.'],
   ['Planta', 'Vista desde arriba.'],
   ['Elevación', 'Vista de frente o de costado.'],
   ['Corte / sección', 'Vista como si se cortara la estructura; se indica con una línea y letras (Corte A-A).'],
   ['Detalle', 'Ampliación de una zona (conexión, anclaje) a escala mayor; se llama con un círculo y número.'],
   ['Brida (cordón)', 'Elemento superior o inferior de un tijeral o arco reticulado.'],
   ['Montante / diagonal', 'Elementos verticales e inclinados que unen las bridas (celosía).'],
   ['Peralte', 'Altura total de una viga, tijeral o arco reticulado.'],
   ['Correa', 'Perfil que va sobre los tijerales o arcos y sostiene la cobertura.'],
   ['Arriostre', 'Elemento (a veces en cruz con templadores) que evita que la estructura se mueva o pandee.'],
   ['Templador', 'Pieza con rosca para tensar varillas de arriostre o tirantes.'],
   ['Placa base / plancha base', 'Plancha soldada al pie de la columna o arco que se apoya en el concreto.'],
   ['Perno de anclaje', 'Perno embebido en el concreto que fija la placa base.'],
   ['Grout', 'Mortero sin contracción que se vacía bajo la placa base para un apoyo completo.'],
   ['Cartela', 'Plancha de refuerzo triangular en uniones.'],
   ['Cateto (de filete)', 'Tamaño del filete de soldadura, medido en sus lados.'],
   ['Penetración completa (CJP)', 'Soldadura que atraviesa todo el espesor de la junta.'],
   ['WPS', 'Procedimiento de soldadura escrito: proceso, electrodo, amperaje, posición, etc.'],
   ['A36 / A500', 'Calidad de acero: A36 para perfiles y planchas, A500 para tubos estructurales.'],
   ['Metrado', 'Cálculo de cantidades (kg de acero, m² de cobertura, unidades) para presupuestar.'],
   ['Revisión (Rev. 0, Rev. 1…)', 'Versión del plano. Trabaja siempre con la última revisión aprobada.'],
 ]))

RECURSOS = {
  'soldadura-tabla-electrodos': SOLD_TABLA, 'soldadura-checklist-inspeccion': SOLD_CHECK,
  'naves-tabla-trazo-arco': NAVES_TRAZO, 'naves-checklist-montaje': NAVES_CHECK,
  'estructuras-tabla-perfiles': EST_PERF, 'estructuras-checklist-calidad': EST_CHECK,
  'carpinteria-guia-medidas': CARP_GUIA, 'carpinteria-hoja-despiece': CARP_HOJA,
  'planos-simbologia-soldadura': PL_SIMB, 'planos-glosario': PL_GLOS,
}

if __name__ == '__main__':
    SALIDA.mkdir(exist_ok=True)
    pie = '<div style="font-size:7px;width:100%;padding:0 14mm;color:#94a3b8;display:flex;justify-content:space-between;font-family:Arial"><span>© Innova Contratistas · Academia Técnica · Material exclusivo para alumnos</span><span>Pág. <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = b.new_page()
        for nombre, h in RECURSOS.items():
            pg.set_content(h); pg.wait_for_timeout(100)
            # Si apenas se pasa a una segunda hoja, se achica un poco para que entre en una sola.
            for escala in (1, 0.93, 0.87, 0.82, 1):
                datos = pg.pdf(format='A4', scale=escala, print_background=True, display_header_footer=True, header_template='<span></span>', footer_template=pie, margin={'top': '14mm', 'bottom': '16mm', 'left': '14mm', 'right': '14mm'})
                if len(PdfReader(io.BytesIO(datos)).pages) == 1:
                    break
            (SALIDA / f'{nombre}.pdf').write_bytes(datos)
            print('ok', nombre)
        b.close()
