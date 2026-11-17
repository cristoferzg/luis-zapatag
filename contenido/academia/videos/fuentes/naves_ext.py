"""Ampliación de las clases de Naves Parabólicas (8–10 min por clase).
Inserta escenas nuevas (segundo ejemplo, caso de obra, ejercicio para pausar y preguntas frecuentes)
antes de la escena de errores de cada clase, sin tocar lo ya grabado."""
from sold_comun import *

def svg(c):
    return f'<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">{c}</svg>'


T = 'font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke"'


def insertar(E, nuevas):
    """Las escenas marcadas inicio=True (respuestas del reto) van después de la escena de la obra; el resto, antes de los errores."""
    ini = [dict((k, v) for k, v in e.items() if k != 'inicio') for e in nuevas if e.get('inicio')]
    resto = [e for e in nuevas if not e.get('inicio')]
    idx = next(i for i, e in enumerate(E) if 'errores' in e['frases'][0].lower())
    E2 = E[:idx] + resto + E[idx:]
    return E2[:2] + ini + E2[2:]


def caja(html, en=0, top=250, izq=330, der=330, tam=32, borde='rgba(249,115,22,.6)', cls='pop', mas=0):
    return (f'<div class="tarjeta {cls}" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{izq}px;right:{der}px;top:{top}px;'
            f'font-size:{tam}px;line-height:1.55;text-align:center;font-weight:700;border:2px solid {borde}">{html}</div>')


def ejercicio(n, enunciado, frases_enunciado, respuesta, frases_respuesta):
    """Dos escenas: el problema (con pausa) y la solución."""
    a = dict(despues=4.0, frases=frases_enunciado + ['Pausa el video y resuélvelo. Te espero.'],
             zoom=[(0, 1.0, 50, 50)],
             html=titulo(f'Ejercicio <span class="nar">{n}</span>', top=90) + caja(enunciado, 0, top=260) +
             badge('PAUSA EL VIDEO Y RESUELVE', len(frases_enunciado), 700, 560, '#5b8def', '⏸'))
    b = dict(frases=frases_respuesta, zoom=[(0, 1.0, 50, 50), (len(frases_respuesta) - 1, 1.04, 50, 55)],
             html=titulo(f'Solución <span class="nar">{n}</span>', top=90) + caja(enunciado, 0, top=220, tam=26, borde='rgba(255,255,255,.25)') +
             caja(respuesta, 0, top=420, borde='rgba(63,158,90,.8)', mas=0.4))
    return [a, b]


def faq(preguntas, intro='Y ahora, las preguntas que más me hacen sobre este tema.'):
    """preguntas: [(pregunta, respuesta_corta_en_pantalla, frase_hablada)]"""
    frases = [intro] + [p[2] for p in preguntas]
    items = ''.join(f'<div class="ap" data-en="{i + 1}" style="background:rgba(255,255,255,.06);border:2px solid rgba(91,141,239,.6);border-radius:14px;padding:14px 22px;margin-bottom:14px">'
                    f'<div style="font-size:30px;font-weight:900;color:#ffd166">❓ {p[0]}</div><div style="font-size:27px;margin-top:6px">{p[1]}</div></div>'
                    for i, p in enumerate(preguntas))
    return dict(frases=frases, zoom=[(0, 1.0, 50, 50), (len(frases) - 1, 1.03, 50, 55)],
                html=titulo('Preguntas <span class="nar">frecuentes</span>', top=80) +
                f'<div style="position:absolute;left:300px;right:300px;top:200px">{items}</div>')


EXT = {}

# ───────────── Clase 1 · Qué es una nave parabólica ─────────────
EXT['naves_c1v2'] = [
  dict(frases=[
    'Antes de los errores, un ejemplo más, para que veas cómo cambian las medidas con el tamaño.',
    'Un taller pide una nave de diez por veinte. Flecha óptima: catorce por ciento de diez, un metro cuarenta.',
    'Peralte del arco: diez entre dieciocho, unos cincuenta y seis centímetros. Y arcos cada cinco metros: cinco arcos.',
    'Si fuera de veinte por cuarenta: flecha dos ochenta, peralte un metro once, y nueve arcos. Fíjate: todo crece en proporción a la luz.',
  ], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=titulo('Dos tamaños, <span class="nar">la misma regla</span>', top=90) + tabla(
    ['Nave', 'Flecha (0.14 L)', 'Peralte (L/18)', 'Arcos (cada 5 m)'],
    [['10 × 20 m', '1.40 m', '0.56 m', '5'], ['15 × 30 m', '2.10 m', '0.83 m', '7'], ['20 × 40 m', '2.80 m', '1.11 m', '9']],
    lambda i: [1, 0, 3][i], top=260, izq=240, der=240, tam=31)),
  faq([
    ('¿Hasta qué luz conviene?', 'Muy común de 10 a 25 m; más grande, con cálculo de ingeniero.', '¿Hasta qué luz conviene? Es muy común entre diez y veinticinco metros. Más que eso se puede, pero siempre con el cálculo de un ingeniero, y lo vemos en el módulo avanzado.'),
    ('¿Sirve para vivienda?', 'Sí: cocheras, terrazas, patios techados.', '¿Sirve para una casa? Sí, para cocheras, terrazas y patios, con arcos más chicos y perfiles más livianos.'),
    ('¿Y si el cliente quiere más altura?', 'Sube la columna, no la flecha.', 'Y si el cliente quiere más altura libre, lo normal es subir las columnas, no exagerar la flecha. Lo explico en la próxima clase.'),
  ]),
]

# ───────────── Clase 2 · Geometría del arco ─────────────
EXT['naves_c2'] = [
  dict(frases=[
    'Un dato que te ahorra cálculos: con la flecha óptima, el arco siempre mide unos cinco por ciento más que la luz.',
    'Quince metros de luz: unos quince setenta y cinco de arco. Veinte metros: veintiuno. Diez metros: diez y medio.',
    'Así, en la visita al cliente, ya sabes cuánto tubo lleva cada cordón sin sacar la calculadora.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Truco: <span class="nar">arco ≈ luz + 5 %</span>', top=90) + tabla(
    ['Luz', 'Flecha óptima', 'Largo del arco'],
    [['10 m', '1.40 m', '≈ 10.50 m'], ['15 m', '2.10 m', '≈ 15.75 m'], ['20 m', '2.80 m', '≈ 21.00 m']],
    lambda i: 1, top=280, izq=360, der=360, tam=32)),
  dict(frases=[
    '¿Y qué pasa si usas una flecha más baja, por ejemplo diez por ciento, para que el techo se vea más plano?',
    'El arco empuja hacia afuera las cabezas de las columnas. Ese empuje es igual a la carga, por la luz al cuadrado, entre ocho veces la flecha.',
    'Como la flecha está abajo, dividiendo: si bajas la flecha de catorce a diez por ciento, el empuje sube cuarenta por ciento. Columnas y anclajes trabajan mucho más.',
    'Por eso la flecha óptima no es un capricho: equilibra altura, viento y empuje. Si el cliente quiere más altura, sube las columnas.',
  ], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('Flecha baja = <span class="nar">más empuje</span>', top=90) +
    caja('Empuje horizontal = <span class="nar">w · L² ÷ (8 · f)</span>', 1, top=270, tam=40) +
    badge('Flecha 0.14 L → 0.10 L: EMPUJE +40 %', 2, 600, 450, '#ff6b6b', '!') + badge('¿Más altura? SUBE LA COLUMNA', 3, 640, 560, '#3f9e5a', '✓')),
  *ejercicio(1,
    'Nave de <b class="nar">10 m</b> de luz con flecha óptima.<br>¿Cuánto sube el cordón inferior a <b class="nar">2 m</b> del apoyo?',
    ['Ahora tú. Una nave de diez metros de luz, con la flecha óptima.', '¿Cuánto sube el cordón inferior a dos metros del apoyo? Usa la tabla rápida.'],
    'Flecha = 0.14 × 10 = <b class="nar">1.40 m</b> · 2 m es la división 2 de 10<br>0.64 × 1.40 = <b class="nar">0.90 m</b>',
    ['La flecha es catorce por ciento de diez: un metro cuarenta.', 'Dos metros es la segunda división de diez, así que el factor es cero sesenta y cuatro.',
     'Cero sesenta y cuatro por un metro cuarenta: noventa centímetros. ¿Te salió?']),
  faq([
    ('¿La flecha se mide desde el piso?', 'No: desde la cabeza de la columna.', '¿La flecha se mide desde el piso? No. Siempre desde la cabeza de la columna, igual que en el Asistente.'),
    ('¿Y si las columnas no están a la misma altura?', 'Se corrige antes: el arco es simétrico.', '¿Y si las columnas quedaron a distinta altura? Se corrige en la columna o en la placa antes de montar. El arco se fabrica simétrico.'),
    ('¿La tabla sirve para cualquier luz?', 'Sí: los factores no cambian.', '¿La tabla rápida sirve para cualquier luz? Sí. Los factores son los mismos; solo cambian la división y la flecha.'),
  ]),
]

# ───────────── Clase 3 · Arco reticulado ─────────────
EXT['naves_c3'] = [
  dict(frases=[
    'Calculemos una pieza de verdad: la diagonal.',
    'En la nave de quince, el arco se divide en diez tramos de un metro y medio, y el peralte es de unos ochenta y tres centímetros.',
    'La diagonal es la hipotenusa: raíz de uno y medio al cuadrado, más cero ochenta y tres al cuadrado. Un metro setenta y uno, aproximadamente.',
    'Es una medida de referencia para pedir material: el largo exacto de corte, nudo por nudo, te lo da la hoja de Cortes.',
  ], zoom=[(0, 1.0, 50, 50), (2, 1.06, 50, 55)], html=titulo('El largo de <span class="nar">la diagonal</span>', top=90) + svg(
    '<line x1="560" y1="640" x2="1360" y2="640" stroke="#f97316" stroke-width="12"/><line x1="560" y1="360" x2="1360" y2="360" stroke="#f97316" stroke-width="12"/>'
    '<line x1="560" y1="360" x2="560" y2="640" stroke="#9aa5ae" stroke-width="8"/><line x1="1360" y1="360" x2="1360" y2="640" stroke="#9aa5ae" stroke-width="8"/>'
    '<line class="dib" data-en="2" x1="560" y1="640" x2="1360" y2="360" stroke="#ffd166" stroke-width="8" style="--l:850"/>'
    f'<text x="960" y="700" fill="#fff" font-size="32" {T} text-anchor="middle">1.50 m</text><text x="1390" y="510" fill="#fff" font-size="32" {T}>0.83 m</text>'
    f'<text class="ap" data-en="2" x="960" y="470" fill="#ffd166" font-size="38" {T} text-anchor="middle">√(1.50² + 0.83²) ≈ 1.71 m</text>')),
  dict(frases=[
    'Un caso que pasa mucho: el soldador puntea todo el arco y al soldar en serio, el arco se cierra y pierde flecha.',
    'La causa es el calor: cada cordón de soldadura encoge al enfriarse. La solución: suelda desde el centro hacia los extremos, alternando caras, y con el arco sujeto a la plantilla.',
    'Y deja enfriar en la plantilla antes de soltarlo. Si lo sueltas caliente, se mueve.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Caso: <span class="nar">el arco se cerró</span>', top=90) + lista([
    ('🔥', 'Causa: la soldadura <b class="nar">encoge al enfriarse</b>'), ('↔️', 'Suelda <b class="nar">del centro a los extremos</b>, alternando caras'), ('🧷', '<b class="nar">Sujeto a la plantilla</b> y enfriar antes de soltar')],
    lambda i: i, top=280, izq=330, der=330, tam=33)),
  *ejercicio(2,
    'Nave de <b class="nar">20 m</b>: arco en 10 tramos de 2 m.<br>¿Peralte con la regla L/18 y largo aproximado de la diagonal?',
    ['Tu turno. Nave de veinte metros, arco dividido en diez tramos de dos metros.', 'Calcula el peralte con la regla de la luz entre dieciocho, y el largo aproximado de la diagonal.'],
    'Peralte = 20 ÷ 18 ≈ <b class="nar">1.11 m</b><br>Diagonal = √(2.00² + 1.11²) ≈ <b class="nar">2.29 m</b>',
    ['El peralte: veinte entre dieciocho, un metro once.', 'La diagonal: raíz de dos al cuadrado más uno once al cuadrado. Unos dos metros veintinueve.']),
  faq([
    ('¿Tubo redondo o cuadrado?', 'Cuadrado: se corta y suelda más fácil. Redondo: necesita boca de pescado.', '¿Tubo redondo o cuadrado? El cuadrado se corta y se suelda más fácil. El redondo se ve bien, pero cada unión necesita un corte de boca de pescado.'),
    ('¿Arco de un solo tubo?', 'Solo en luces chicas: cocheras y techitos.', '¿Puedo hacer el arco de un solo tubo curvado? Solo en luces chicas, como cocheras. En una nave, el arco reticulado es el que trabaja.'),
  ]),
]

# ───────────── Clase 4 · Correas, arriostres y tensores ─────────────
EXT['naves_c4'] = [
  dict(frases=[
    'Metremos una nave más grande: veinte por cuarenta.',
    'El arco mide unos veintiún metros. Con correas cada metro y medio: catorce espacios, quince líneas de correas.',
    'Cada línea mide cuarenta metros: seiscientos metros de correa. En barras de seis metros: cien barras, más las que necesites para los empalmes.',
  ], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('Metrado: <span class="nar">nave 20 × 40 m</span>', top=90) + tabla(
    ['Paso', 'Cálculo', 'Resultado'],
    [['Largo del arco', '≈ 20 × 1.05', '21 m'], ['Líneas de correa', '21 ÷ 1.5 = 14 espacios', '15 líneas'], ['Metros de correa', '15 × 40 m', '600 m'], ['Barras de 6 m', '600 ÷ 6', '100 + empalmes']],
    lambda i: [1, 1, 2, 2][i], top=260, izq=260, der=260, tam=31)),
  dict(frases=[
    'Caso de obra: llegas y ves que una línea de correas quedó apoyada entre dos nudos del arco, no sobre el nudo.',
    'Ese peso dobla el cordón superior en un tramo que no está hecho para eso. No lo dejes así: mueve la correa al nudo, o agrega un montante justo debajo, consultándolo con quien hizo el cálculo.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Caso: <span class="nar">correa fuera del nudo</span>', top=90) + svg(
    '<path d="M400 600 Q960 380 1520 600" fill="none" stroke="#f97316" stroke-width="12"/>'
    + ''.join(f'<circle cx="{x}" cy="{600 - 4 * 220 * (x - 400) * (1520 - x) / 1120 ** 2:.0f}" r="10" fill="#ffd166"/>' for x in (400, 680, 960, 1240, 1520)) +
    '<rect class="pop" data-en="0" x="800" y="430" width="60" height="30" fill="#ff6b6b"/>'
    f'<text class="ap" data-en="0" x="830" y="410" fill="#ff6b6b" font-size="30" {T} text-anchor="middle">entre nudos ✕</text>'
    f'<text class="ap" data-en="1" x="960" y="700" fill="#3f9e5a" font-size="32" {T} text-anchor="middle">muévela al nudo o agrega un montante (consulta)</text>')),
  *ejercicio(3,
    'Nave de <b class="nar">10 × 20 m</b>, correas cada 1.5 m.<br>¿Cuántas líneas de correa y cuántas barras de 6 m?',
    ['Ahora tú. Nave de diez por veinte, correas cada metro y medio.', '¿Cuántas líneas de correa, y cuántas barras de seis metros?'],
    'Arco ≈ 10.5 m → 10.5 ÷ 1.5 = 7 espacios = <b class="nar">8 líneas</b><br>8 × 20 m = 160 m → 160 ÷ 6 ≈ <b class="nar">27 barras</b> (+ empalmes)',
    ['El arco mide unos diez metros y medio. Entre uno y medio: siete espacios, ocho líneas de correas.', 'Ocho por veinte: ciento sesenta metros. Entre seis: unas veintisiete barras, más las de empalme.']),
  faq([
    ('¿Solo arriostro los extremos?', 'En naves largas también hay paños intermedios: lo define el cálculo.', '¿Basta con arriostrar los paños de los extremos? En naves cortas, sí. En naves largas, el cálculo suele pedir también paños intermedios.'),
    ('¿Cuánto aprieto el tensor?', 'Hasta que la varilla no cuelgue, sin deformar nada.', '¿Cuánto aprieto el tensor? Hasta que la varilla quede recta, sin colgar. Si aprietas de más, deformas el arco.'),
  ]),
]

# ───────────── Clase 5 · Columnas, placas y anclajes ─────────────
EXT['naves_c5'] = [
  dict(frases=[
    '¿Cuánto debe sobresalir el perno del concreto? Súmalo de abajo hacia arriba.',
    'El espacio para el grout, unos tres centímetros. El espesor de la placa. La arandela. La tuerca. Y dos o tres hilos de rosca por encima de la tuerca.',
    'Con un perno de tres cuartos y una placa de media pulgada, salen unos siete u ocho centímetros. Si sobresale menos, la tuerca no entra completa.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('¿Cuánto <span class="nar">sobresale el perno</span>?', top=90) + tabla(
    ['Capa', 'Medida aprox.'],
    [['Grout', '≈ 3 cm'], ['Placa', 'su espesor (ej. ½" ≈ 1.3 cm)'], ['Arandela', '≈ 0.5 cm'], ['Tuerca', '≈ su diámetro'], ['Hilos libres', '2 a 3'], ['<span class="nar">TOTAL (perno ¾")</span>', '<b class="nar">≈ 7–8 cm</b>']],
    lambda i: [1, 1, 1, 1, 1, 2][i], top=230, izq=420, der=420, tam=29)),
  dict(frases=[
    'Caso de obra: un perno quedó corrido dos centímetros. La tentación es calentarlo y doblarlo. No lo hagas: el acero calentado y doblado pierde resistencia.',
    'La salida habitual es agrandar el agujero de la placa y cubrirlo con una arandela gruesa soldada a la placa, o anclar un perno nuevo con resina. Cualquiera de las dos, aprobada por el ingeniero.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Caso: <span class="nar">perno corrido</span>', top=90) + lista([
    ('❌', '<b>Nunca</b> calentar y doblar el perno'), ('⭕', 'Agujero agrandado + <b class="nar">arandela gruesa soldada</b>'), ('🧪', 'O perno nuevo con <b class="nar">resina</b>'), ('📘', 'Siempre <b class="nar">aprobado por el ingeniero</b>')],
    lambda i: [0, 1, 1, 1][i], top=250, izq=340, der=340, tam=33)),
  *ejercicio(4,
    'Nave de <b class="nar">20 × 40 m</b> con arcos cada 5 m.<br>¿Cuántas columnas, placas y pernos (4 por placa)?',
    ['Tu turno. Nave de veinte por cuarenta, con arcos cada cinco metros.', '¿Cuántas columnas, placas y pernos, si cada placa lleva cuatro?'],
    '40 ÷ 5 = 8 paños → <b class="nar">9 arcos</b><br>9 × 2 = <b class="nar">18 columnas y 18 placas</b> · 18 × 4 = <b class="nar">72 pernos</b>',
    ['Cuarenta entre cinco son ocho paños, o sea nueve arcos.', 'Nueve arcos por dos: dieciocho columnas y dieciocho placas. Por cuatro pernos: setenta y dos.']),
  faq([
    ('¿Grout o mortero común?', 'Grout sin retracción: no se encoge.', '¿Puedo usar mortero común en vez de grout? No. El grout sin retracción no se encoge al secar, y así la placa apoya en toda su superficie.'),
    ('¿Puedo soldar la tuerca al perno?', 'No: se usa contratuerca.', '¿Puedo soldar la tuerca para que no se afloje? No. Se usa contratuerca o tuerca de seguridad.'),
  ]),
]

# ───────────── Clase 6 · Fabricación en serie ─────────────
EXT['naves_c6'] = [
  dict(frases=[
    'Un código simple para cada pieza evita confusiones. Por ejemplo: A tres, guion, C S, guion, cero dos.',
    'A tres es el arco tres. C S, cordón superior. Cero dos, el tramo dos. Para el cordón inferior, C I; montantes, M; diagonales, D.',
    'El código se escribe con marcador en la pieza y en la hoja de Cortes. En la mesa, cada uno sabe qué agarrar.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('El <span class="nar">código de pieza</span>', top=90) +
    caja('<span style="font-size:72px;letter-spacing:6px" class="nar">A3 - CS - 02</span>', 0, top=270) + tabla(
    ['Parte', 'Significa'], [['A3', 'Arco 3'], ['CS / CI', 'Cordón superior / inferior'], ['M / D', 'Montante / diagonal'], ['02', 'Tramo 2']],
    lambda i: 1, top=470, izq=480, der=480, tam=28)),
  dict(frases=[
    'Planifica los días. Un ejemplo de taller con dos soldadores: el primer arco, con la plantilla nueva, puede tomar un día y medio.',
    'Del segundo en adelante, más o menos uno por día. Siete arcos: unos ocho días, más dos de pintura. Ajusta estos tiempos con los de tu propio taller.',
    'Con ese número le das al cliente una fecha real, y no una promesa.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Ejemplo: <span class="nar">plan de días</span>', top=90) + tabla(
    ['Etapa', 'Días (ejemplo)'], [['Corte en serie', '1'], ['Arco 1 (con plantilla)', '1.5'], ['Arcos 2 a 7', '≈ 6'], ['Pintura', '2'], ['<span class="nar">TOTAL</span>', '<b class="nar">≈ 10.5</b>']],
    lambda i: [0, 0, 1, 1, 2][i], top=250, izq=460, der=460, tam=30) + badge('AJÚSTALO A TU TALLER', 1, 1460, 250, '#5b8def', 'i', tam=22)),
  *ejercicio(5,
    'Arco de la nave de 15 m: <b class="nar">≈ 32 m</b> de cordones (superior + inferior).<br>¿Cuántas barras de 6 m por arco y para los 7 arcos?',
    ['Ahora tú. Cada arco de la nave de quince lleva unos treinta y dos metros de cordones, sumando el superior y el inferior.', '¿Cuántas barras de seis metros por arco, y para los siete arcos?'],
    '32 ÷ 6 = 5.3 → <b class="nar">6 barras por arco</b><br>6 × 7 = <b class="nar">42 barras</b> (el sobrante sirve para montantes)',
    ['Treinta y dos entre seis es cinco coma tres: seis barras por arco.', 'Por siete arcos: cuarenta y dos barras. Y el sobrante no se bota: sirve para montantes y diagonales.']),
  faq([
    ('¿Pinto antes o después de montar?', 'Base en taller; retoques y acabado en obra.', '¿Pinto antes o después de montar? La base anticorrosiva en el taller, y en obra los retoques de las soldaduras y el acabado.'),
    ('¿Y si un arco sale distinto?', 'Revisa la plantilla antes de seguir.', '¿Y si un arco sale distinto a los demás? Para y revisa la plantilla y los tacos antes de seguir. El error se repetiría en todos.'),
  ]),
]

# ───────────── Clase 7 · Izaje y montaje ─────────────
EXT['naves_c7'] = [
  dict(frases=[
    'Un detalle que casi nadie calcula: el ángulo de las eslingas.',
    'Con dos ramales, cada uno carga el peso entre dos veces el seno del ángulo con la horizontal.',
    'Arco de doscientos kilos: con eslingas a sesenta grados, cada ramal carga unos ciento quince kilos. A cuarenta y cinco, ciento cuarenta y uno. A treinta grados, doscientos kilos cada uno: el doble.',
    'Mientras más abiertas las eslingas, más carga cada una. Trabaja con ángulos de sesenta grados o más, y elige eslingas con su capacidad marcada.',
  ], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('El ángulo <span class="nar">de las eslingas</span>', top=80) +
    caja('Carga por ramal = <span class="nar">W ÷ (2 · sen α)</span>', 1, top=210, tam=36) + tabla(
    ['Ángulo α', 'Carga por ramal (arco de 200 kg)'], [['60°', '≈ 115 kg ✓'], ['45°', '≈ 141 kg'], ['30°', '≈ 200 kg ✕']],
    lambda i: 2, top=340, izq=440, der=440, tam=31)),
  dict(frases=[
    'Mientras no estén puestas las correas, el arco recién montado se sostiene con vientos: cables o sogas a anclajes en el piso, en las dos direcciones.',
    'Y no se sueltan hasta que ese arco quede amarrado al módulo rígido. Muchos colapsos en montaje pasan con arcos sueltos y una ráfaga de viento.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Vientos <span class="nar">provisionales</span>', top=90) + svg(
    '<path d="M560 700 Q960 330 1360 700" fill="none" stroke="#f97316" stroke-width="14"/><rect x="540" y="700" width="40" height="40" fill="#9aa5ae"/><rect x="1340" y="700" width="40" height="40" fill="#9aa5ae"/>'
    '<line class="dib" data-en="0" x1="960" y1="420" x2="420" y2="760" stroke="#ffd166" stroke-width="4" style="--l:700"/><line class="dib" data-en="0" x1="960" y1="420" x2="1500" y2="760" stroke="#ffd166" stroke-width="4" style="--l:700"/>'
    f'<text class="ap" data-en="0" x="960" y="380" fill="#ffd166" font-size="30" {T} text-anchor="middle">vientos hasta amarrar al módulo rígido</text>')),
  *ejercicio(6,
    'Arco de <b class="nar">300 kg</b> izado con dos eslingas a <b class="nar">45°</b>.<br>¿Cuánto carga cada eslinga?',
    ['Tu turno. Un arco de trescientos kilos, izado con dos eslingas a cuarenta y cinco grados.', '¿Cuánto carga cada eslinga?'],
    '300 ÷ (2 × 0.707) ≈ <b class="nar">212 kg</b> por eslinga<br>(a 60° serían ≈ 173 kg)',
    ['Seno de cuarenta y cinco: cero setecientos siete. Trescientos entre dos por cero setecientos siete: unos doscientos doce kilos por eslinga.', 'Si las cierras a sesenta grados, bajan a unos ciento setenta y tres.']),
  faq([
    ('¿Grúa o tecle?', 'Depende del peso, la altura y el acceso.', '¿Grúa o tecle? Depende del peso, de la altura y del acceso a la obra. Para naves medianas, una grúa pequeña o un camión grúa ahorra días.'),
    ('¿Puedo montar con lluvia?', 'Mejor no: superficies resbalosas y riesgo eléctrico.', '¿Puedo montar con lluvia? Mejor no. Las superficies resbalan y aumenta el riesgo eléctrico de los equipos.'),
  ]),
]

# ───────────── Clase 8 · Cobertura y canaletas ─────────────
EXT['naves_c8'] = [
  dict(frases=[
    'Metremos la cobertura de una nave de veinte por cuarenta.',
    'El arco mide unos veintiún metros. Por cuarenta de largo: unos ochocientos cuarenta metros cuadrados de techo.',
    'Las planchas TR4 cubren un ancho útil cercano a un metro; el dato exacto está en la ficha del fabricante. Y los pernos, a cuatro y medio por metro cuadrado: unos tres mil ochocientos.',
  ], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('Metrado: <span class="nar">cobertura 20 × 40 m</span>', top=90) + tabla(
    ['Concepto', 'Cálculo', 'Resultado'],
    [['Área sobre la curva', '21 × 40', '≈ 840 m²'], ['Ancho útil TR4', 'según ficha', '≈ 1 m'], ['Pernos autoperforantes', '840 × 4.5', '≈ 3 780']],
    lambda i: [1, 2, 2][i], top=270, izq=280, der=280, tam=31)),
  dict(frases=[
    'Caso de obra: una gotera justo en el traslape entre dos filas de planchas.',
    'Casi siempre es traslape corto, plancha mal orientada contra la pendiente, o falta de sello. La solución de fondo: desmontar, corregir el traslape y poner cinta selladora butílica.',
    'Y recuerda: la fila de abajo va primero, y la de arriba monta encima, como las tejas.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Caso: <span class="nar">gotera en el traslape</span>', top=90) + lista([
    ('📏', 'Traslape <b class="nar">corto</b>'), ('↕️', 'Plancha <b class="nar">mal orientada</b>'), ('🩹', 'Falta de <b class="nar">cinta butílica</b>'), ('🧱', 'Abajo primero, arriba encima: <b class="nar">como tejas</b>')],
    lambda i: [0, 1, 1, 2][i], top=250, izq=360, der=360, tam=33)),
  *ejercicio(7,
    'Nave de <b class="nar">15 × 30 m</b> con flecha óptima.<br>¿Radio de curvatura en la cumbre? (R = L² ÷ 8f)',
    ['Ahora tú. Para la nave de quince por treinta con flecha óptima,', 'calcula el radio de curvatura en la cumbre, con la fórmula ele al cuadrado entre ocho efe.'],
    '15² ÷ (8 × 2.10) = 225 ÷ 16.8 ≈ <b class="nar">13.4 m</b><br>Compáralo con el radio mínimo de la ficha de la plancha',
    ['Quince al cuadrado, doscientos veinticinco, entre ocho por dos diez, dieciséis coma ocho: unos trece metros cuarenta.', 'Ese número lo comparas con el radio mínimo que indica la ficha de la plancha, para saber si se curva sola o hay que rolarla.']),
  faq([
    ('¿Aluzinc o calamina?', 'Aluzinc: dura mucho más a la intemperie.', '¿Aluzinc o calamina galvanizada? El aluzinc resiste mucho mejor la corrosión y dura más. Para una nave, es la opción normal.'),
    ('¿Qué espesor de plancha?', 'El que diga el cálculo y la separación de correas.', '¿Qué espesor de plancha uso? El que permita la separación de correas según la ficha del fabricante, y lo que pida el cálculo.'),
  ]),
]

# ───────────── Clase 9 · Metrado y presupuesto ─────────────
EXT['naves_c9'] = [
  dict(frases=[
    'Una pregunta que te van a hacer siempre: ¿cuánto es con I G V?',
    'El I G V es dieciocho por ciento. Ciento veinticinco mil setecientos doce, por uno dieciocho: unos ciento cuarenta y ocho mil trescientos cuarenta soles.',
    'Deja claro en la cotización si el precio incluye o no el I G V. Es una de las discusiones más comunes al final de la obra.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('Con <span class="nar">IGV</span>', top=90) +
    caja('S/ 125 712 × 1.18 = <span class="nar">S/ 148 340</span>', 1, top=290, tam=44) + badge('DI SIEMPRE SI INCLUYE IGV', 2, 660, 470, '#ffb020', '!')),
  dict(frases=[
    'Y si el precio del acero sube después de cotizar, ¿cuánto te afecta?',
    'Haz esta cuenta: si el acero es, por ejemplo, la mitad del costo de tu obra, un alza del diez por ciento en el acero sube tu costo total un cinco por ciento.',
    'Por eso pon un plazo de validez a tu cotización, por ejemplo quince días, y compra el acero apenas recibes el adelanto.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Si sube <span class="nar">el acero</span>', top=90) + lista([
    ('🧮', 'Acero = 50 % del costo · alza 10 % → <b class="nar">+5 % al total</b>'), ('📅', '<b class="nar">Validez</b> de la cotización: ej. 15 días'), ('🛒', 'Compra el acero <b class="nar">con el adelanto</b>')],
    lambda i: [0, 1, 2][i], top=280, izq=300, der=300, tam=33)),
  dict(frases=[
    'Los pagos, ligados al avance. Una forma usada: cincuenta por ciento de adelanto, treinta cuando la estructura está montada, y veinte a la entrega.',
    'Con la obra de ciento veinticinco mil: sesenta y dos mil ochocientos cincuenta y seis de adelanto, treinta y siete mil setecientos catorce al montar, y veinticinco mil ciento cuarenta y dos al entregar.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('Pagos <span class="nar">por avance</span>', top=90) + tabla(
    ['Hito', '%', 'S/ (sin IGV)'], [['Adelanto', '50 %', '62 856'], ['Estructura montada', '30 %', '37 714'], ['Entrega', '20 %', '25 142']],
    lambda i: 1, top=290, izq=380, der=380, tam=32)),
  *ejercicio(8,
    'Acero de la nave: <b class="nar">5 449 kg</b>. Precio de ejemplo: <b class="nar">S/ 5.50 por kg</b>.<br>¿Cuánto cuesta el acero?',
    ['Último ejercicio del módulo. El acero de la nave pesa cinco mil cuatrocientos cuarenta y nueve kilos.', 'Con un precio de ejemplo de cinco cincuenta por kilo, ¿cuánto cuesta el acero?'],
    '5 449 × 5.50 ≈ <b class="nar">S/ 29 970</b><br>(usa el precio de tu proveedor)',
    ['Cinco mil cuatrocientos cuarenta y nueve por cinco cincuenta: unos veintinueve mil novecientos setenta soles.', 'Con el precio real de tu proveedor, ese número cambia: actualízalo siempre antes de cotizar.']),
]

# ───────────── Clase 10 · Luces grandes ─────────────
EXT['naves_c10'] = [
  dict(frases=[
    'Caso de obra: llegan los tramos y las bridas del empalme no coinciden. Los agujeros están corridos unos milímetros.',
    'Si hiciste el pre-armado en el taller, esto no pasa. Si pasa: no agrandes los agujeros con soplete ni fuerces los pernos a martillazos. Se corrige con la solución que apruebe el ingeniero.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Caso: <span class="nar">bridas que no calzan</span>', top=90) + lista([
    ('🏭', 'Prevención: <b class="nar">pre-armado en taller</b>'), ('🔥', '<b>Nunca</b> agrandar con soplete'), ('🔨', '<b>Nunca</b> forzar pernos a martillazos'), ('📘', 'Solución <b class="nar">aprobada por el ingeniero</b>')],
    lambda i: [0, 1, 1, 1][i], top=250, izq=360, der=360, tam=33)),
  dict(frases=[
    'En naves grandes, controla el arco ya montado. Tres medidas.',
    'La luz real entre apoyos, con wincha o distanciómetro. La flecha, desde la cabeza de columna hasta el cordón inferior en el centro, con nivel láser o manguera de nivel.',
    'Y la simetría: la altura a un cuarto de la luz debe ser igual en los dos lados. Si algo no cuadra, se corrige antes de seguir con el siguiente arco.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Control del arco <span class="nar">montado</span>', top=90) + lista([
    ('📏', '<b class="nar">Luz real</b> entre apoyos'), ('📐', '<b class="nar">Flecha</b> con nivel láser o manguera'), ('⚖️', '<b class="nar">Simetría</b>: altura a L/4 igual en los dos lados')],
    lambda i: [0, 1, 2][i], top=280, izq=340, der=340, tam=34)),
  *ejercicio(9,
    'Nave de <b class="nar">30 m</b> de luz con flecha óptima.<br>Si el camión lleva hasta ≈ 12 m, ¿en cuántos tramos partes el arco?',
    ['Ahora tú. Nave de treinta metros de luz, con flecha óptima.', 'Si el camión lleva piezas de hasta unos doce metros, ¿en cuántos tramos partes el arco?'],
    'Arco ≈ 30 × 1.05 ≈ <b class="nar">31.5 m</b> → 31.5 ÷ 12 = 2.6<br><b class="nar">3 tramos</b> de ≈ 10.5 m (empalmes en nudos)',
    ['El arco mide unos treinta y uno y medio. Entre doce: dos coma seis.', 'Así que tres tramos de unos diez metros y medio, con los empalmes en los nudos. Confírmalo con el transportista.']),
  faq([
    ('¿Empalme soldado o empernado?', 'En obra, de preferencia empernado: más control.', '¿Empalme soldado o empernado en obra? De preferencia empernado: es más fácil de controlar en altura. Lo define el cálculo.'),
  ]),
]

# ───────────── Clase 11 · Luz y ventilación ─────────────
EXT['naves_c11'] = [
  dict(inicio=True, frases=[
    'La respuesta del reto de la clase pasada: nave de veinticinco metros. Flecha óptima, tres metros cincuenta.',
    'El arco mide unos veintiséis metros con veinticinco: no entra entero en el camión. Lo partes en dos o tres tramos, con los empalmes en los nudos.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Respuesta: <span class="nar">nave de 25 m</span>', top=90) + tabla(
    ['Dato', 'Valor'], [['Flecha (0.14 × 25)', '3.50 m'], ['Largo del arco', '≈ 26.25 m'], ['Tramos', '2 o 3, empalme en nudos']],
    lambda i: i, top=290, izq=400, der=400, tam=32)),
  dict(frases=[
    'Repasemos la regla de las entradas de aire con números.',
    'Si arriba pones extractores que suman cierta área de salida, abajo las rejillas o ventanas deben sumar por lo menos esa misma área. Si no, el aire no tiene por dónde entrar y los extractores rinden poco.',
    'Repártelas en los dos costados, a baja altura, y lejos de zonas con polvo o humo.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Entradas <span class="nar">≥ salidas</span>', top=90) + svg(
    '<path d="M460 720 Q960 330 1460 720" fill="none" stroke="#f97316" stroke-width="12"/><rect x="440" y="720" width="40" height="80" fill="#9aa5ae"/><rect x="1440" y="720" width="40" height="80" fill="#9aa5ae"/>'
    '<circle class="pop" data-en="1" cx="960" cy="420" r="34" fill="#ffd166"/>'
    '<path class="dib" data-en="1" d="M380 760 L560 700" stroke="#7dd3fc" stroke-width="8" style="--l:200"/><path class="dib" data-en="1" d="M1540 760 L1360 700" stroke="#7dd3fc" stroke-width="8" style="--l:200"/>'
    '<path class="dib" data-en="1" d="M960 380 L960 260" stroke="#ff6b6b" stroke-width="8" style="--l:130"/>'
    f'<text class="ap" data-en="1" x="960" y="230" fill="#ff6b6b" font-size="30" {T} text-anchor="middle">sale el aire caliente</text>'
    f'<text class="ap" data-en="1" x="960" y="830" fill="#7dd3fc" font-size="30" {T} text-anchor="middle">entra aire fresco abajo (área ≥ salida)</text>')),
  *ejercicio(10,
    'Nave de <b class="nar">18 × 36 m</b> con columnas de 6 m y flecha óptima.<br>¿Volumen aproximado? (frontis = rectángulo + ⅔ · L · f)',
    ['Tu turno. Nave de dieciocho por treinta y seis, columnas de seis metros, flecha óptima.', 'Calcula el volumen aproximado: el frontis es un rectángulo, más dos tercios de la luz por la flecha.'],
    'f = 0.14 × 18 = 2.52 m · Frontis = 18 × 6 + ⅔ × 18 × 2.52 ≈ 108 + 30.2 = <b class="nar">138.2 m²</b><br>Volumen ≈ 138.2 × 36 ≈ <b class="nar">4 977 m³</b>',
    ['La flecha: dos cincuenta y dos. El rectángulo: dieciocho por seis, ciento ocho. La parábola: dos tercios de dieciocho por dos cincuenta y dos, unos treinta. Frontis: ciento treinta y ocho metros cuadrados.', 'Por treinta y seis de largo: unos cuatro mil novecientos setenta y siete metros cúbicos.']),
  faq([
    ('¿Extractor eólico o eléctrico?', 'Eólico: sin luz ni consumo. Eléctrico: caudal fijo.', '¿Extractor eólico o eléctrico? El eólico no gasta luz y funciona con viento y calor. El eléctrico da un caudal fijo, útil en talleres con humo.'),
    ('¿Las claraboyas calientan la nave?', 'Algo, por eso van en franjas y con ventilación.', '¿Las claraboyas no calientan más la nave? Algo, sí. Por eso van repartidas en franjas, y siempre con buena ventilación.'),
  ]),
]

# ───────────── Clase 12 · Cerramientos y frontis ─────────────
EXT['naves_c12'] = [
  dict(inicio=True, frases=[
    'La respuesta del reto de la clase pasada: nave de doce por veinticuatro, con columnas de cuatro y medio y flecha óptima.',
    'Flecha: un metro sesenta y ocho. Frontis: doce por cuatro y medio, cincuenta y cuatro, más dos tercios de doce por uno sesenta y ocho, trece cuarenta y cuatro. Sesenta y siete con cuarenta y cuatro metros cuadrados.',
    'Volumen: por veinticuatro, unos mil seiscientos dieciocho metros cúbicos. Con seis renovaciones: unos nueve mil setecientos once por hora. Entre mil ochocientos: cinco coma cuatro, o sea seis extractores.',
  ], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('Respuesta: <span class="nar">extractores 12 × 24 m</span>', top=90) + tabla(
    ['Paso', 'Resultado'], [['Flecha', '1.68 m'], ['Frontis', '54 + 13.44 = 67.44 m²'], ['Volumen', '≈ 1 618 m³'], ['Caudal (6 renov./h)', '≈ 9 711 m³/h'], ['Extractores de 1 800 m³/h', '5.4 → <b class="nar">6</b>']],
    lambda i: [1, 1, 2, 2, 2][i], top=240, izq=330, der=330, tam=30)),
  dict(frases=[
    'Caso de obra: el viento hace vibrar las planchas del frontis y se escucha un golpeteo.',
    'Casi siempre faltan pernos, o los largueros están muy separados para el espesor de la plancha. Completa la fijación que indica la ficha, y si los largueros están lejos, agrega uno intermedio.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Caso: <span class="nar">frontis que golpea</span>', top=90) + lista([
    ('🔩', '<b class="nar">Faltan pernos</b>: completa la fijación de la ficha'), ('📏', 'Largueros <b class="nar">muy separados</b>: agrega uno intermedio')],
    lambda i: 1, top=300, izq=330, der=330, tam=33)),
  *ejercicio(11,
    'Nave de <b class="nar">15 × 30 m</b>: dos frontis de 96 m² cada uno y muros laterales de <b class="nar">5 m</b> de alto.<br>¿Área total de cerramiento, sin descontar vanos?',
    ['Tu turno. Nave de quince por treinta: dos frontis de noventa y seis metros cuadrados cada uno,', 'y muros laterales de cinco metros de alto. ¿Cuál es el área total de cerramiento, sin descontar vanos?'],
    'Frontis: 2 × 96 = 192 m² · Laterales: 2 × 30 × 5 = 300 m²<br>Total ≈ <b class="nar">492 m²</b> (luego descuentas portón, puertas y zócalo)',
    ['Los dos frontis: ciento noventa y dos. Los dos laterales: dos por treinta por cinco, trescientos.', 'Total: unos cuatrocientos noventa y dos metros cuadrados. Después descuentas el portón, las puertas y el zócalo.']),
  faq([
    ('¿Zócalo de concreto o de plancha?', 'Concreto o ladrillo: aguanta golpes y no deja entrar agua.', '¿Zócalo de concreto o de plancha? De concreto o de ladrillo: aguanta los golpes de los carros y no deja entrar el agua.'),
    ('¿Puerta peatonal dentro del portón?', 'Sí: evita abrir el portón grande para pasar.', '¿Conviene una puerta peatonal dentro del portón? Sí. Así no abres el portón grande cada vez que alguien entra.'),
  ]),
]

# ───────────── Clase 13 · Mantenimiento ─────────────
EXT['naves_c13'] = [
  dict(inicio=True, frases=[
    'Primero, la respuesta del reto de la clase pasada: el frontis de una nave de veinte metros, con columnas de seis y flecha óptima.',
    'El rectángulo: veinte por seis, ciento veinte metros cuadrados. La parábola: dos tercios de veinte por dos ochenta, unos treinta y siete con treinta y tres. Total: unos ciento cincuenta y siete metros cuadrados por frontis.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Respuesta: <span class="nar">frontis de 20 m</span>', top=90) + tabla(
    ['Parte', 'Cálculo', 'Área'], [['Rectángulo', '20 × 6', '120 m²'], ['Parábola', '⅔ × 20 × 2.80', '≈ 37.33 m²'], ['<span class="nar">Frontis</span>', '', '<b class="nar">≈ 157.3 m²</b>']],
    lambda i: [1, 1, 1][i], top=290, izq=360, der=360, tam=32)),
  dict(frases=[
    'Una herramienta simple para el mantenimiento: la ficha de inspección por zonas.',
    'Divide la nave en zonas: cobertura, canaletas, arcos, correas y arriostres, columnas y bases, cerramientos.',
    'En cada visita marcas el estado de cada zona: bien, observar o reparar, con foto y fecha. Así el cliente ve la evolución, y tú sabes qué cotizar.',
  ], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('La ficha <span class="nar">por zonas</span>', top=90) + tabla(
    ['Zona', 'Bien', 'Observar', 'Reparar'], [['Cobertura', '✓', '', ''], ['Canaletas', '', '✓', ''], ['Arcos y correas', '✓', '', ''], ['Columnas y bases', '', '', '✓'], ['Cerramientos', '✓', '', '']],
    lambda i: [1, 1, 1, 2, 2][i], top=250, izq=360, der=360, tam=30)),
  dict(frases=[
    'Caso real: en la visita encuentras la base de una columna con óxido y el pedestal cubierto de tierra húmeda.',
    'Primero, limpia y mide: si el perfil o la placa perdieron espesor, avisa por escrito al cliente y al ingeniero. Si es superficial, limpieza, anticorrosivo y acabado.',
    'Y corrige la causa: que el agua y la tierra no lleguen a la placa. Si no, en un año estás igual.',
  ], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Caso: <span class="nar">base oxidada</span>', top=90) + lista([
    ('🧹', '<b class="nar">Limpia y mide</b> el espesor'), ('📩', 'Perdió espesor: <b class="nar">aviso por escrito</b> al ingeniero'), ('🎨', 'Superficial: limpieza + anticorrosivo + acabado'), ('💧', '<b class="nar">Corrige la causa</b>: agua y tierra')],
    lambda i: [0, 1, 1, 2][i], top=250, izq=340, der=340, tam=32)),
  *ejercicio(12,
    'Tienes <b class="nar">10 naves</b> con contrato de <b class="nar">3 visitas</b> al año.<br>Cada visita deja <b class="nar">S/ 350</b> de ganancia. ¿Cuánto ganas al año?',
    ['Último ejercicio del curso. Tienes diez naves con contrato de tres visitas al año.', 'Cada visita te deja trescientos cincuenta soles de ganancia. ¿Cuánto ganas al año solo por mantenimiento?'],
    '10 × 3 = 30 visitas · 30 × 350 = <b class="nar">S/ 10 500</b> al año<br>+ los trabajos de reparación que salen de esas visitas',
    ['Diez naves por tres visitas: treinta visitas al año. Por trescientos cincuenta: diez mil quinientos soles.', 'Y además, las reparaciones que encuentras en esas visitas. Por eso el mantenimiento es un negocio.']),
]


# ═════════════ Segunda ampliación: repaso rápido y casos extra ═════════════

def repaso(pares, intro='Repaso rápido. Responde mentalmente antes de que aparezca la respuesta.'):
    """pares: [(pregunta, respuesta)] — cada frase dice la pregunta y luego su respuesta."""
    frases = [intro] + [f'{p} {r}' for p, r in pares]
    items = ''.join(f'<div class="ap" data-en="{i + 1}" style="display:flex;gap:16px;align-items:flex-start;background:rgba(255,255,255,.06);border-radius:14px;padding:12px 20px;margin-bottom:12px">'
                    f'<div style="font-size:28px;font-weight:900;color:#ffd166;min-width:46px">{i + 1}.</div>'
                    f'<div><div style="font-size:28px;font-weight:800">{p}</div><div style="font-size:26px;color:#7ee08a;margin-top:4px">✓ {r}</div></div></div>'
                    for i, (p, r) in enumerate(pares))
    return dict(frases=frases, zoom=[(0, 1.0, 50, 50), (len(frases) - 1, 1.03, 50, 55)],
                html=titulo('Repaso <span class="nar">rápido</span>', top=80) + f'<div style="position:absolute;left:300px;right:300px;top:190px">{items}</div>')


def caso(tit, frases, items, en_de=None):
    return dict(frases=frases, zoom=[(0, 1.0, 50, 50), (len(frases) - 1, 1.04, 50, 55)],
                html=titulo(f'Caso: <span class="nar">{tit}</span>', top=90) +
                lista(items, en_de or (lambda i: min(i, len(frases) - 1)), top=270, izq=330, der=330, tam=33))


EXT['naves_c11'] += [
  caso('gotas bajo el techo', [
    'Caso de obra: el cliente dice que en las mañanas caen gotas dentro de la nave, aunque no ha llovido.',
    'No es gotera: es condensación. El aire húmedo de adentro toca la plancha fría de la madrugada y el agua se forma debajo del techo.',
    'La solución: buena ventilación, para sacar la humedad, y si hace falta, una capa aislante bajo la cobertura.',
  ], [('💧', 'No es gotera: es <b class="nar">condensación</b>'), ('🌬️', '<b class="nar">Ventilación</b> para sacar la humedad'), ('🧱', 'Si hace falta, <b class="nar">aislante</b> bajo la plancha')]),
  repaso([
    ('¿Cómo se reparten las claraboyas?', 'En franjas, en la parte media del arco.'),
    ('¿Qué área deben sumar las entradas de aire?', 'Por lo menos la misma que las salidas.'),
    ('¿Qué cara del policarbonato va hacia arriba?', 'La que tiene protección contra el sol.'),
    ('¿Con qué se calcula cuántos extractores?', 'Con el volumen y las renovaciones por hora.'),
  ]),
]

EXT['naves_c12'] += [
  caso('el portón se descuelga', [
    'Caso de obra: a los meses, el portón corredizo de la nave empieza a rozar el piso y cuesta moverlo.',
    'Casi siempre el riel superior está colgado de un larguero delgado o de la plancha, y se fue doblando con el peso.',
    'Se corrige con una viga de soporte propia para el riel, fijada a las columnas, y nivelando de nuevo la hoja.',
  ], [('🚪', 'Síntoma: el portón <b class="nar">roza y cuesta moverlo</b>'), ('📉', 'Causa: riel en larguero delgado o en la plancha'), ('🏗️', 'Solución: <b class="nar">viga propia</b> fijada a las columnas')]),
  repaso([
    ('¿Por qué el frontis se calcula aparte?', 'Porque trabaja como una vela contra el viento.'),
    ('¿La plancha del cerramiento llega al piso?', 'No: va sobre un zócalo.'),
    ('¿De dónde se cuelga el riel del portón?', 'De una viga propia, nunca de la plancha.'),
    ('¿Qué evita que el agua corra por el zócalo?', 'El botaguas.'),
  ]),
]

EXT['naves_c13'] += [
  caso('después de un sismo', [
    'Caso de obra: hubo un sismo fuerte y el cliente te llama para revisar la nave.',
    'Revisa en este orden: bases y pernos, soldaduras de los nudos y empalmes, arriostres y tensores, y la cobertura.',
    'Si ves fisuras en soldaduras, pernos doblados o arcos fuera de plomo, delimita la zona y avisa por escrito al ingeniero antes de reparar.',
  ], [('🧱', '<b class="nar">Bases y pernos</b>'), ('🔥', '<b class="nar">Soldaduras</b> de nudos y empalmes'), ('⛓️', '<b class="nar">Arriostres y tensores</b>'), ('⚠️', 'Daño serio: <b class="nar">delimita y avisa</b> al ingeniero')],
     lambda i: [1, 1, 1, 2][i]),
  repaso([
    ('¿La silicona sola arregla una gotera?', 'No: es un parche, al sol se cuartea.'),
    ('¿Qué haces si un perfil perdió espesor?', 'Avisas al ingeniero; no basta con pintar.'),
    ('¿Dónde se pisa en el techo?', 'Sobre la línea de las correas, con arnés.'),
    ('¿Cómo se vende el mantenimiento?', 'Como un contrato anual con visitas programadas.'),
  ]),
]

EXT['naves_c4'] += [
  caso('la cruz se aflojó', [
    'Caso de obra: a las pocas semanas del montaje, las varillas de las cruces cuelgan y la nave se mueve con el viento.',
    'Es normal que la estructura se acomode. Por eso se vuelven a tensar los tensores, sin pasarse, hasta que la varilla quede recta.',
    'Anótalo en el plan: revisión de tensores al mes del montaje, y luego una vez al año.',
  ], [('〰️', 'Síntoma: varillas <b class="nar">colgando</b>'), ('🔧', '<b class="nar">Retensar</b> hasta que queden rectas, sin pasarse'), ('📅', 'Revisar <b class="nar">al mes</b> y luego cada año')]),
  repaso([
    ('¿Dónde se apoya la correa sobre el arco?', 'Sobre el nudo, nunca entre nudos.'),
    ('¿Dónde van las cruces de arriostre?', 'En el primer y último paño, y donde lo pida el cálculo.'),
    ('¿Para qué sirve el tensor?', 'Para tensar la varilla de la cruz.'),
    ('¿Qué es el módulo rígido?', 'El primer paño arriostrado, desde donde se avanza.'),
  ]),
]

EXT['naves_c5'] += [
  caso('columna fuera de plomo', [
    'Caso de obra: montas la primera columna y el nivel te dice que está inclinada unos milímetros.',
    'Antes del grout tienes la herramienta perfecta: las tuercas de nivelación. Subes o bajas las tuercas hasta dejarla a plomo en las dos direcciones.',
    'Recién con la columna a plomo y el arco montado, se rellena el grout. Después ya no se puede corregir.',
  ], [('📐', 'Síntoma: columna <b class="nar">inclinada</b>'), ('🔩', 'Corrige con las <b class="nar">tuercas de nivelación</b>'), ('🧱', 'El <b class="nar">grout va al final</b>, ya a plomo')]),
  caso('zapata con agua', [
    'Otro caso: el pedestal quedó al nivel del piso y en cada lluvia la placa queda bajo el agua.',
    'En pocos años, la placa y los pernos se oxidan justo donde no se ve. La placa siempre va sobre un pedestal, por encima del piso terminado.',
  ], [('🌧️', 'Placa <b class="nar">bajo el agua</b> en cada lluvia'), ('⬆️', 'La placa va sobre un <b class="nar">pedestal</b> sobre el piso terminado')]),
  repaso([
    ('¿Qué tres cosas recibe la columna?', 'El peso del techo, el empuje del arco y el viento.'),
    ('¿Para qué sirve la plantilla de pernos?', 'Para que los pernos no se muevan al vaciar.'),
    ('¿Qué va debajo de la placa?', 'Grout sin retracción.'),
    ('¿Qué mides entre ejes antes de montar?', 'Las diagonales, que deben ser iguales.'),
  ]),
]

EXT['naves_c6'] += [
  caso('el arco llegó torcido', [
    'Caso de obra: bajas los arcos del camión y uno está torcido.',
    'Mídelo igual que en el taller: flecha, luz y que no esté alabeado. Si está fuera de medida, no se monta así: se corrige en el taller o se reemplaza.',
    'Y revisa por qué pasó: casi siempre faltaron tacos o amarres en el transporte.',
  ], [('📏', '<b class="nar">Mide</b>: flecha, luz y alabeo'), ('🚫', 'Fuera de medida: <b class="nar">no se monta</b>'), ('🪵', 'Causa típica: <b class="nar">sin tacos ni amarres</b>')]),
  repaso([
    ('¿Se corta arco por arco?', 'No: se cortan todas las piezas iguales en serie.'),
    ('¿Qué es la mesa de armado?', 'La plantilla con tacos donde salen todos los arcos iguales.'),
    ('¿Qué zona se deja sin pintar?', 'Unos cinco centímetros donde irán las soldaduras de obra.'),
    ('¿Para qué sirve el código de pieza?', 'Para saber qué pieza va en cada arco y en qué tramo.'),
  ]),
]

EXT['naves_c7'] += [
  caso('las señales al operador', [
    'Caso de obra: dos personas le hacen señas al operador de la grúa al mismo tiempo, y cada una dice algo distinto.',
    'Regla: un solo señalero, que todos conocen, con señales acordadas antes de empezar. La única señal que puede dar cualquiera es la de parar.',
  ], [('🙋', '<b class="nar">Un solo señalero</b>'), ('✋', 'Señales <b class="nar">acordadas</b> antes de izar'), ('🛑', 'Cualquiera puede dar <b class="nar">la señal de parar</b>')]),
  repaso([
    ('¿De cuántos puntos se engancha el arco?', 'De dos, más o menos a un cuarto de la luz desde cada lado.'),
    ('¿Para qué son las cuerdas guía?', 'Para controlar el giro del arco desde lejos.'),
    ('¿Qué ángulo de eslinga conviene?', 'Sesenta grados o más.'),
    ('¿Qué haces si el viento mueve la carga?', 'Se suspende el izaje.'),
  ]),
]

EXT['naves_c8'] += [
  caso('la canaleta rebalsa', [
    'Caso de obra: en la primera lluvia fuerte, la canaleta rebalsa y el agua cae por dentro.',
    'Revisa tres cosas: que tenga pendiente hacia las bajadas, que haya suficientes bajadas para el largo de la nave, y que no esté tapada con virutas o basura.',
  ], [('📐', '<b class="nar">Pendiente</b> hacia las bajadas'), ('⬇️', '<b class="nar">Bajadas</b> suficientes para el largo'), ('🧹', 'Sin <b class="nar">virutas ni basura</b>')]),
  repaso([
    ('¿Traslape mínimo entre filas de planchas?', 'Veinte centímetros.'),
    ('¿Por qué lado se empieza a colocar?', 'Por el lado contrario al viento dominante.'),
    ('¿Cuántos pernos por metro cuadrado, aproximadamente?', 'Unos cuatro y medio.'),
    ('¿Qué se hace al terminar el día?', 'Barrer las virutas de los taladros.'),
  ]),
]

EXT['naves_c9'] += [
  caso('el cliente pide rebaja', [
    'Caso: el cliente dice que otro le cotizó más barato y te pide rebaja.',
    'Antes de bajar el precio, compara lo que incluye cada cotización: perfiles, espesores, pintura, canaletas, obra civil, plazo.',
    'Si igual quiere pagar menos, ofrece quitar alcance, por ejemplo las canaletas o el cerramiento, en vez de bajar tu margen.',
  ], [('🔍', '<b class="nar">Compara qué incluye</b> cada cotización'), ('✂️', 'Mejor <b class="nar">quitar alcance</b>'), ('🛡️', 'que <b class="nar">bajar tu margen</b>')]),
  repaso([
    ('¿Cuántas partidas tiene el presupuesto de la nave?', 'Cinco: materiales, mano de obra, gastos operativos, gastos generales y utilidad.'),
    ('¿Por qué no cotizar solo por metro cuadrado?', 'Porque cada nave cambia: hay que metrar pieza por pieza.'),
    ('¿Qué pones siempre por escrito?', 'Adelanto, plazo, garantía y lo que no incluye.'),
    ('¿Los precios de la app son finales?', 'No: son de referencia; usa los de tu proveedor.'),
  ]),
]

EXT['naves_c10'] += [
  repaso([
    ('¿Qué manda para el transporte: la luz o el largo del arco?', 'El largo del arco.'),
    ('¿Dónde van los empalmes de campo?', 'En los nudos.'),
    ('¿Para qué sirve el pre-armado?', 'Para comprobar que todo calza antes de enviar.'),
    ('¿Desde qué luz se necesita el cálculo del ingeniero?', 'Desde unos veinticinco metros, siempre.'),
  ]),
]

EXT['naves_c3'] += [
  repaso([
    ('¿Cuáles son las cuatro piezas del arco reticulado?', 'Cordón superior, cordón inferior, montantes y diagonales.'),
    ('¿Regla práctica del peralte?', 'La luz entre dieciocho.'),
    ('¿Dónde se ubican los empalmes de los cordones?', 'Cerca de un nudo, nunca a media pieza.'),
    ('¿Cómo se suelda para que el arco no se cierre?', 'Del centro a los extremos, alternando caras, sujeto a la plantilla.'),
  ]),
]
