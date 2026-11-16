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
    n = int(round(L / paso))
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
<line x1="300" y1="200" x2="300" y2="40" stroke="#0b2a45" stroke-dasharray="5 4"/><text x="40" y="190" font-size="12" fill="#64748b">cabeza de columna</text>
<text x="306" y="125" font-size="15" fill="#0b2a45" font-weight="700">f (flecha)</text>
<line x1="40" y1="222" x2="560" y2="222" stroke="#0b2a45"/><text x="282" y="238" font-size="15" fill="#0b2a45" font-weight="700">L (luz)</text>
<line x1="170" y1="200" x2="170" y2="{200-160*4*0.25*0.75:.0f}" stroke="#0f766e" stroke-width="2"/><text x="120" y="215" font-size="13" fill="#0f766e">x</text>
<text x="176" y="160" font-size="13" fill="#0f766e" font-weight="700">y</text></svg>'''

NAVES_TRAZO = doc('Tabla de trazo de arcos parabólicos', 'Naves Parabólicas: Diseño, Fabricación y Montaje',
 'Para trazar el arco a escala real en el piso del taller: marca la luz, divide en tramos y levanta en cada punto la altura y. La parábola es simétrica: calcula media luz y repite al otro lado.',
 svg_arco() +
 '<div class="caja"><b>Fórmula:</b> <span class="f">y = 4 · f · x · (L − x) / L²</span> &nbsp; donde L = luz, f = flecha, x = distancia desde el apoyo. '
 '<br><b>Largo del arco (aprox.):</b> <span class="f">S ≈ L · [1 + 8/3·(f/L)² − 32/5·(f/L)⁴]</span> — para el metrado de cordones y cobertura.'
 '<br><b>Flecha recomendada:</b> entre <b>0.10 L y 0.20 L</b>; la <b>óptima es 0.14 L</b>. Se mide desde la cabeza de la columna hasta lo más alto del arco.</div>'
 '<div class="caja" style="background:#eff6ff;border-color:#93c5fd"><b>En InnovApp → Techos Metálicos → Asistente → Parabólico Rolado:</b> el arco se arma con esta misma fórmula. '
 '«Aplicar Flecha Óptima» pone f = 0.14 L; el peralte del arco (separación entre cordón superior e inferior) sale ≈ L / 18 (entre 0.45 y 1.20 m); '
 'los arcos (tijerales) van cada 5 a 6 m y las correas cada 1.2 a 1.6 m. Usa esta tabla para trazar en el taller lo que diseñaste en la app.</div>' +
 '<div class="dos"><div><h2>Tabla universal</h2><p class="nota">Multiplica el factor por la flecha f para obtener y en cualquier luz.</p>' + tabla(['x / L', 'y / f'], tabla_arco()) + '</div>'
 '<div><h2>Ejemplo del curso: L = 15 m, f = 2.10 m</h2>' + tabla(['x (m)', 'x espejo (m)', 'y (m)'], ejemplo(15, 2.1, 0.75)) +
 f'<p class="nota">Largo del arco ≈ {largo_arco(15, 2.1):.2f} m (contra 15 m de luz). Cobertura de una nave de 30 m ≈ {largo_arco(15, 2.1)*30:.0f} m².</p></div></div>' +
 '<h2>Naves frecuentes con la flecha óptima (0.14 L)</h2>' + tabla(['Luz L (m)', 'Flecha f (m)', 'Peralte ≈ L/18 (m)', 'Largo del arco S (m)'],
   [[f'{L}', f'{0.14*L:.2f}', f'{min(1.2, max(0.45, L/18)):.2f}', f'{largo_arco(L, 0.14*L):.2f}'] for L in (10, 12, 15, 18, 20, 24, 30)]) +
 '<p class="nota">El arco reticulado tiene dos cordones (o bridas): el cordón superior y el cordón inferior, separados por el peralte. Traza ambas con la misma fórmula usando su propia luz y flecha, o traza el eje y mide el peralte perpendicular al arco. Verifica el trazo con diagonales y prueba de simetría antes de soldar. Las dimensiones estructurales (perfiles, peralte, anclajes) las define el cálculo del ingeniero.</p>')

NAVES_CHECK = doc('Checklist de montaje de nave parabólica', 'Naves Parabólicas: Diseño, Fabricación y Montaje',
 'Revísalo por etapas y marca cada punto. Una nave bien montada empieza en los anclajes: un error de nivel o de ejes ahí se multiplica arriba.',
 DATOS_OBRA +
 '<h2>1. Antes de montar</h2>' + checklist([
   'Planos aprobados en obra (estructuras, detalles de anclaje y arriostramiento).',
   'Ejes trazados y verificados con diagonales; distancias entre apoyos según plano.',
   'Pernos de anclaje (tipo J) en posición, nivel y proyección correctos; roscas protegidas.',
   'Concreto de apoyos con resistencia suficiente (respetar tiempo de curado indicado).',
   'Arcos inspeccionados en taller: cordón superior, cordón inferior, montantes y diagonales según la lámina; soldaduras y pintura base.',
   'Plan de izaje: equipo (grúa / tecle / tirfor), puntos de enganche, eslingas revisadas.',
   'Personal con EPP, arnés y línea de vida; zona de izaje señalizada y sin terceros.',
 ]) +
 '<h2>2. Durante el montaje</h2>' + checklist([
   'Primer arco izado, aplomado y arriostrado provisionalmente (vientos / puntales) antes de soltarlo.',
   'Segundo arco montado y unido de inmediato con correas y arriostres para formar el primer módulo rígido.',
   'Placas base niveladas con tuercas de nivelación o lainas; tuercas ajustadas y punteadas si el plano lo indica.',
   'Correas a la separación de plano (en InnovApp, cada 1.2 – 1.6 m), con sus tensores.',
   'Arriostramiento en cruz en los paños indicados (techo y laterales); templadores tensados sin deformar.',
   'Verificación de aplome y alineamiento cada 2 – 3 arcos.',
   'Soldaduras de campo inspeccionadas y retocadas con pintura anticorrosiva.',
 ]) +
 '<h2>3. Cobertura y cierre</h2>' + checklist([
   'Aluzinc TR4 (o calamina) curvada con el radio adecuado; traslapes según fabricante y cantidad de planchas según «Materiales» de InnovApp.',
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

import json as _json
_PERF = _json.loads((AQUI / 'perfiles_innovapp.json').read_text())
_CATS = [('tubo_cuadrado', 'Tubos cuadrados (LAC)'), ('tubo_rectangular', 'Tubos rectangulares (LAC)'), ('tubo_redondo', 'Tubos redondos'),
         ('perfil_c', 'Perfiles C'), ('perfil_z', 'Perfiles Z'), ('perfil_h_ipe', 'Vigas H / IPE')]
def _filas(cat):
    return [[x['cod'], x['nombre'].split(' [')[0], f"{x['peso']:.2f}", f"{x['peso']*6:.1f}"] for x in _PERF if x['cat'] == cat]
EST_PERF = doc('Tabla de perfiles y pesos (catálogo de InnovApp)', 'Estructuras Metálicas: Perfiles, Conexiones y Montaje',
 'Son los mismos perfiles y pesos que usa InnovApp en Techos Metálicos (materiales, cortes y presupuesto). Así lo que metras a mano coincide con la app. Barras de 6 m.',
 ''.join('<h2>' + t + '</h2>' + tabla(['Código', 'Perfil', 'kg / m', 'kg / barra 6 m'], _filas(c)) for c, t in _CATS) +
 '<div class="caja"><b>Para cualquier otro perfil:</b> peso (kg/m) = área (mm²) × 0.00785. &nbsp; Plancha: kg/m² = espesor (mm) × 7.85. '
 '&nbsp; Tubo cuadrado: área ≈ 4 · t · (b − t). &nbsp; Ángulo: área ≈ t · (2b − t).</div>'
 '<p class="nota">Ejemplo: 26 barras de tubo rectangular 3" × 2" × 2.5 mm (LAC-75X50X2.5) ≈ 26 × 6 × 4.65 = 725 kg. En la app, «Resumen» te da el total de acero de toda la nave.</p>')

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
   ['Cordón superior / inferior (brida)', 'Elemento de arriba o de abajo de un tijeral o arco reticulado. En InnovApp: «cordón superior» y «cordón inferior».'],
   ['Montante / diagonal', 'Elementos verticales e inclinados que unen los cordones (celosía). Así se llaman también en InnovApp.'],
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


# ---------------------------------------------------------------- TECHOS A DOS Y CUATRO AGUAS
def _fac(p): return math.sqrt(1 + (p / 100) ** 2)
TECHO_TABLA = doc('Tabla de pendientes, factores y alturas', 'Techos Metálicos a Dos y Cuatro Aguas',
 'Para pasar de la pendiente a la altura de la cumbrera, el largo real del faldón y el área real del techo. La pendiente mínima de cada cobertura la da su ficha técnica.',
 '<h2>Pendiente, grados y factor de inclinación</h2>' + tabla(['Pendiente', 'Grados', 'Sube por metro', 'Factor (largo real ÷ horizontal)'],
   [[f'{p} %', f'{math.degrees(math.atan(p/100)):.1f}°', f'{p} cm', f'{_fac(p):.3f}'] for p in (5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 100)]) +
 '<h2>Altura de la cumbrera sobre el apoyo (techo a dos aguas)</h2>' + tabla(['Luz'] + [f'{p} %' for p in (15, 20, 25, 30, 35)],
   [[f'{L} m'] + [f'{L/2*p/100:.2f} m' for p in (15, 20, 25, 30, 35)] for L in (6, 8, 10, 12, 14, 16)]) +
 '<h2>Fórmulas del curso</h2>' + tabla(['Para', 'Fórmula', 'Ejemplo (taller 10 m, 25 %)'], [
   ['Altura de cumbrera', '<span class="f">h = (luz ÷ 2) × pendiente</span>', '5 × 0.25 = 1.25 m'],
   ['Largo del faldón', '<span class="f">horizontal × factor</span>', '5.60 × 1.031 = 5.77 m (con alero 0.60)'],
   ['Ángulo de corte (sierra)', '= ángulo de la pendiente', '14°'],
   ['Área real del techo', '<span class="f">área en planta × factor</span>', '185.9 × 1.031 = 191.7 m²'],
   ['Cumbrera en cuatro aguas', '<span class="f">largo − ancho</span>', 'casa 13 × 9 m → 4 m'],
   ['Limatesa / limahoya (real)', '<span class="f">√[(ancho/2 × √2)² + h²]</span>', 'casa 9 m, 30 % → 6.51 m'],
   ['Pendiente de limatesa', '<span class="f">h ÷ (ancho/2 × √2)</span>', '1.35 ÷ 6.36 ≈ 21 %'],
   ['Plancha junto a la limatesa', '<span class="f">distancia a la esquina × factor</span>', '2 m × 1.044 = 2.09 m'],
   ['Dilatación del acero', '<span class="f">0.012 mm × metros × °C</span>', '10 m × 30 °C = 3.6 mm']]) +
 '<div class="caja">Reglas de predimensionamiento para empezar (el diseño final lo verifica el cálculo): altura del tijeral ≈ luz ÷ 15 a luz ÷ 10; separación de tijerales 3 a 5 m; correas sobre los nudos; misma pendiente en los cuatro faldones.</div>')

TECHO_HOJA = doc('Hoja de metrado de techo', 'Techos Metálicos a Dos y Cuatro Aguas',
 'Llénala para cada techo. A la derecha, el ejemplo del taller de 10 × 16 m a dos aguas (25 %, aleros de 0.60 m a los lados y 0.30 m en los frontis).',
 DATOS_OBRA + '<h2>Datos del techo</h2>' + tabla(['Dato', 'Tu obra', 'Ejemplo'], [
   ['Tipo (una / dos / cuatro aguas)', '', 'Dos aguas'], ['Luz × largo (muros o ejes)', '', '10 × 16 m'], ['Pendiente y factor', '', '25 % · 1.031'],
   ['Aleros (lados / frontis)', '', '0.60 / 0.30 m'], ['Planta del techo con aleros', '', '11.20 × 16.60 m'], ['Separación de tijerales', '', '4 m → 5 tijerales']]) +
 '<h2>Cobertura y accesorios</h2>' + tabla(['Partida', 'Cálculo', 'Tu obra', 'Ejemplo'], [
   ['Área real', 'planta × factor', '', '191.7 m²'], ['Largo de plancha', 'faldón con alero', '', '5.80 m'],
   ['N.º de planchas', 'largo ÷ ancho útil × faldones', '', '17 × 2 = 34'], ['Desperdicio (cuatro aguas: 10–15 %)', '% del área', '', '—'],
   ['Cumbrera / caballetes', 'cumbrera + limatesas', '', '16.6 m'], ['Cenefa', 'perímetro de aleros', '', '33.2 m'], ['Canaletas', 'bordes que reciben agua', '', '33.2 m'],
   ['Pernos', 'planchas × filas × por cruce + 10 %', '', '≈ 675'], ['Manta / aislante', 'área real + 10 %', '', '—']]) +
 '<h2>Estructura</h2>' + tabla(['Partida', 'Cálculo', 'Metros', 'kg/m (catálogo)', 'kg'], [
   ['Tijerales', 'n.º × metros por tijeral', '5 × 35 = 175', '', ''], ['Correas', 'filas × largo', '12 × 16.6 = 199', '', ''],
   ['Limatesas / limahoyas', 'n.º × largo real', '', '', ''], ['Columnas / apoyos', '', '', '', ''], ['<b>Total acero</b>', '', '', '', '']]) +
 '<h2>Presupuesto</h2>' + tabla(['Concepto', 'S/'], [['Materiales (acero, cobertura, accesorios, pernos, pintura)', ''], ['Mano de obra (fabricación + montaje)', ''],
   ['Equipos (andamios, izaje, transporte)', ''], ['Gastos generales', ''], ['Utilidad', ''], ['<b>Total</b>', '']]) + FIRMAS)

# ---------------------------------------------------------------- EL NEGOCIO DEL METALERO
NEG_HORA = doc('Costo de tu hora, precio y flujo de caja', 'El Negocio del Metalero',
 'Llena la columna "Tu taller" con tus números. A la derecha, el ejemplo del curso. Revisa esta hoja cada 6 meses.',
 '<h2>1. Costos fijos del mes</h2>' + tabla(['Concepto', 'Tu taller (S/)', 'Ejemplo (S/)'], [
   ['Alquiler del taller', '', '800'], ['Luz', '', '250'], ['Agua, internet, celular', '', '120'], ['Transporte', '', '300'],
   ['Desgaste de equipos (valor ÷ meses de vida)', '', '250'], ['Mantenimiento y otros', '', '180'], ['<b>Total costos fijos</b>', '', '<b>1 900</b>']]) +
 '<h2>2. Costo de tu hora</h2>' + tabla(['Paso', 'Tu taller', 'Ejemplo'], [
   ['Tu sueldo como maestro (S/ al mes)', '', '3 000'], ['Fijos + sueldo', '', '4 900'], ['Horas al mes (días × horas)', '', '26 × 8 = 208'],
   ['Horas productivas (≈ 70 %)', '', '146'], ['<b>Costo por hora = (fijos + sueldo) ÷ horas productivas</b>', '', '<b>≈ S/ 34</b>']]) +
 '<h2>3. Precio con margen real</h2>' + tabla(['Paso', 'Tu obra', 'Ejemplo'], [
   ['Costo total (materiales + consumibles + transporte + tus horas + ayudante)', '', '5 360'], ['Margen deseado', '', '20 %'],
   ['<b>Precio = costo ÷ (1 − margen)</b>', '', '<b>5 360 ÷ 0.80 = 6 700</b>'], ['Ojo: sumar 20 % al costo da solo', '', '16.7 % de margen']]) +
 '<div class="caja">Un descuento sale de tu ganancia: en el ejemplo, 10 % de descuento sobre S/ 6 500 se lleva el 57 % de la ganancia.</div>' +
 '<h2>4. Flujo de caja de la obra</h2>' + tabla(['Semana', 'Entra (S/)', 'Sale (S/)', 'Caja acumulada (S/)'], [[f'{i}', '', '', ''] for i in range(1, 6)]) +
 '<p class="nota">Regla: sin adelanto no se compra material ni se empieza. Separa la caja del taller de la de tu casa.</p>')

NEG_ACUERDO = doc('Cotización y acuerdo simple', 'El Negocio del Metalero',
 'Modelo para tus cotizaciones y acuerdos. Es una guía práctica: para montos importantes o casos especiales, consulta con un abogado; para impuestos y comprobantes, con un contador.',
 '<h2>Cotización: las 7 partes</h2>' + checklist([
   '<b>Tus datos y logo</b> (nombre del taller, RUC si tienes, teléfono, número de cotización)',
   '<b>Cliente y obra</b> (nombre, dirección, fecha de la visita)',
   '<b>Alcance</b>: qué se hace, medidas, materiales, acabado e instalación (ofrece 3 opciones: básica, estándar, superior)',
   '<b>Lo que NO incluye</b>: obra civil, electricidad, permisos, desmonte…',
   '<b>Plazo</b>, contado desde el pago del adelanto', '<b>Forma de pago</b> (ej.: 50 % adelanto · 50 % a la entrega)', '<b>Validez</b> (ej.: 15 días) y <b>garantía</b>']) +
 '<h2>Acuerdo simple (llenar y firmar, o aceptar por escrito)</h2>' + tabla(['Punto', 'Detalle'], [
   ['Partes (nombre y documento)', '&nbsp;'], ['Cotización aceptada (N.º y opción)', '&nbsp;'], ['Precio total', '&nbsp;'], ['Pagos y fechas', '&nbsp;'],
   ['Plazo de entrega', '&nbsp;'], ['Cambios y adicionales', 'Se cotizan y aceptan por escrito antes de hacerlos'], ['Garantía', 'Cubre: … · No cubre: golpes, mal uso, falta de mantenimiento, cambios de terceros · Plazo: …']]) +
 '<h2>Control de pagos</h2>' + tabla(['Fecha', 'Concepto', 'Monto (S/)', 'Constancia'], [['', 'Adelanto', '', ''], ['', 'Adicional N.º', '', ''], ['', 'Saldo a la entrega', '', '']]) +
 '<h2>Entrega y postventa</h2>' + checklist(['Revisión propia antes de entregar', 'Recorrido con el cliente y conformidad por escrito', 'Fotos, reseña y recomendación', 'Mensaje a los 30 días · recordatorio a los 6 meses']) + FIRMAS)

PORT_MOTOR = doc('Elección del motor y checklist de instalación', 'Portones Automáticos',
 'Para elegir el motor con números y no olvidar nada en la instalación. Los valores son referenciales: manda siempre el manual del fabricante. La conexión a la red eléctrica la hace o revisa un electricista según el CNE.',
 '<h2>1. Peso de la hoja</h2>' + tabla(['Parte', 'Cálculo', 'Peso (kg)'], [
   ['Perfiles del marco y travesaños', 'metros × kg/m (tubo 50×50×2 mm ≈ 3.0 kg/m)', ''], ['Plancha o relleno', 'm² × 7.85 × espesor en mm (1.5 mm ≈ 11.8 kg/m²)', ''],
   ['Ruedas, guías, cremallera, soldadura', 'estimado (≈ 10 %)', ''], ['<b>TOTAL</b>', '', '']]) +
 '<p><b>Ejemplo del curso:</b> hoja corredizo 3.90 × 2.40 m → 73 + 110 + 20 ≈ <b>200 kg</b> → motor de <b>600 kg</b>.</p>' +
 '<h2>2. Elección del motor</h2>' + tabla(['Dato', 'Regla', 'Tu portón'], [
   ['Capacidad', 'Al menos 1.5 a 2 veces el peso real', ''], ['Uso / ciclos', 'Casa: residencial · Condominio/empresa: uso intenso o 24 V', ''],
   ['Velocidad', '≈ 10 a 12 m/min es normal', ''], ['Protección', 'Exterior: IP44 o más', ''], ['Tensión', '220 V (económico) · 24 V (suave, más ciclos, batería)', ''],
   ['Batiente', 'Largo máximo y peso máximo POR HOJA', '']]) +
 '<h2>3. Antes del motor (prueba sin motor)</h2>' + checklist(['Diagonales iguales (± 3 mm)', 'Riel recto y a nivel; largo = hoja + recorrido', 'Ruedas en V con rodamiento, alineadas',
   'Guía superior con 2 a 3 mm de juego', 'Topes mecánicos en ambos extremos', 'Se mueve con una mano y se queda quieta en cualquier punto']) +
 '<h2>4. Instalación</h2>' + checklist(['Dado de concreto nivelado con tubo para cables (antes de vaciar)', 'Medidas de placa y distancia a la hoja según el manual',
   'Cremallera: holgura de 1 a 2 mm con el piñón; empalmes con regla de cremallera', 'Fines de carrera 2 a 3 cm antes de los topes',
   'Circuito exclusivo con termomagnético, diferencial 30 mA y tierra', 'Baja tensión en tubo separado · empalmes solo en cajas · motor elevado']) + FIRMAS)

PORT_SEG = doc('Checklist de seguridad, entrega y mantenimiento', 'Portones Automáticos',
 'Úsalo en cada entrega y en cada visita de mantenimiento. Guárdalo firmado junto con la garantía.',
 DATOS_OBRA +
 '<h2>1. Seguridad</h2>' + checklist(['Fotoceldas a 40–50 cm del piso, alineadas', 'Fuerza / sensibilidad regulada al mínimo que mueve la hoja', 'Luz destellante (obligatoria con cierre automático)',
   'Banda de seguridad en el borde de cierre (si corresponde)', 'Zonas de atrapamiento revisadas · malla en barrotes junto al poste', 'Desbloqueo manual probado',
   '<b>Prueba del obstáculo:</b> para y retrocede', '<b>Prueba de fotoceldas:</b> para y abre']) +
 '<h2>2. Programación y entrega</h2>' + checklist(['Aprendizaje del recorrido y frenada suave', 'Cierre automático solo con fotoceldas y luz', 'Controles de código variable grabados: N.º ____',
   '10 ciclos completos con el cliente', 'Cliente capacitado: desbloqueo, pila, corte de luz', 'Entregados: controles, manual, garantía escrita', 'Primera revisión programada: ____ / ____ / ____']) +
 '<h2>3. Diagnóstico rápido</h2>' + tabla(['Síntoma', 'Revisar primero'], [
   ['No responde al control', 'Energía · pila · receptor · memoria del control'], ['Abre y regresa / se detiene', 'Fotoceldas (sucias o desalineadas) · fuerza baja · roce'],
   ['Zumba y no se mueve', 'Desbloqueo · condensador de arranque (220 V) · traba mecánica'], ['Se pasa del final', 'Fin de carrera'], ['Hace ruido', 'Cremallera · ruedas · riel · guía']]) +
 '<h2>4. Mantenimiento (cada 6 meses)</h2>' + checklist(['Cortar la energía antes de trabajar', 'Limpiar riel y fotoceldas (sin grasa en el riel)', 'Revisar ruedas, guías, topes y pernos de la base',
   'Ajustar cremallera', 'Probar fuerza, fotoceldas, obstáculo y desbloqueo', 'Anotar observaciones y próxima visita']) + FIRMAS)

RECURSOS = {
  'soldadura-tabla-electrodos': SOLD_TABLA, 'soldadura-checklist-inspeccion': SOLD_CHECK,
  'naves-tabla-trazo-arco': NAVES_TRAZO, 'naves-checklist-montaje': NAVES_CHECK,
  'estructuras-tabla-perfiles': EST_PERF, 'estructuras-checklist-calidad': EST_CHECK,
  'carpinteria-guia-medidas': CARP_GUIA, 'carpinteria-hoja-despiece': CARP_HOJA,
  'planos-simbologia-soldadura': PL_SIMB, 'planos-glosario': PL_GLOS,
  'techos-tabla-pendientes': TECHO_TABLA, 'techos-hoja-metrado': TECHO_HOJA,
  'negocio-costo-hora': NEG_HORA, 'negocio-cotizacion-acuerdo': NEG_ACUERDO,
  'portones-motor-instalacion': PORT_MOTOR, 'portones-seguridad-mantenimiento': PORT_SEG,
}

if __name__ == '__main__':
    SALIDA.mkdir(exist_ok=True)
    pie = '<div style="font-size:7px;width:100%;padding:0 14mm;color:#94a3b8;display:flex;justify-content:space-between;font-family:Arial"><span>© Innova Contratistas · Academia Técnica · Material exclusivo para alumnos</span><span>Pág. <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = b.new_page()
        import sys
        solo = sys.argv[1:]
        for nombre, h in RECURSOS.items():
            if solo and nombre not in solo: continue
            pg.set_content(h); pg.wait_for_timeout(100)
            # Si apenas se pasa a una segunda hoja, se achica un poco para que entre en una sola.
            for escala in (1, 0.93, 0.87, 0.82, 1):
                datos = pg.pdf(format='A4', scale=escala, print_background=True, display_header_footer=True, header_template='<span></span>', footer_template=pie, margin={'top': '14mm', 'bottom': '16mm', 'left': '14mm', 'right': '14mm'})
                if len(PdfReader(io.BytesIO(datos)).pages) == 1:
                    break
            (SALIDA / f'{nombre}.pdf').write_bytes(datos)
            print('ok', nombre)
        b.close()
