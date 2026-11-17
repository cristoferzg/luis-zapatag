"""Ampliación de las clases de «Techos a Dos y Cuatro Aguas» (≈8 min por clase).
Misma receta que Naves: respuesta del reto anterior al inicio, y antes de los errores un segundo ejemplo,
un caso de obra, un ejercicio para pausar, preguntas frecuentes y un repaso rápido."""
from naves_ext import insertar, caja, ejercicio, faq, repaso, caso, svg, T
from sold_comun import *

EXT = {}


def ejemplo(tit, frases, cab, filas, en_de=None, top=270, izq=300, der=300, tam=31):
    n = len(frases)
    return dict(frases=frases, zoom=[(0, 1.0, 50, 50), (n - 1, 1.04, 50, 55)],
                html=titulo(tit, top=90) + tabla(cab, filas, en_de or (lambda i: min(i + 1, n - 1)), top=top, izq=izq, der=der, tam=tam))


def respuesta(tit, frases, cab, filas, en_de=None, tam=31):
    d = ejemplo(f'Respuesta: <span class="nar">{tit}</span>', frases, cab, filas, en_de, top=290, izq=380, der=380, tam=tam)
    d['inicio'] = True
    return d


# ───────────── Clase 1 · Tipos de techo y sus partes ─────────────
EXT['techo_c1'] = [
  ejemplo('¿Qué techo <span class="nar">para cada obra</span>?', [
    'Antes de los errores, cuatro obras típicas y el techo que suele convenir en cada una.',
    'Una cochera de tres por seis, pegada al muro de la casa: una sola agua, con la caída hacia afuera.',
    'Un taller de diez por dieciséis, como nuestra obra: dos aguas, con tijerales que salvan toda la luz.',
    'Una casa con ventanas en las cuatro fachadas: cuatro aguas, que protege todo el contorno. Y un almacén de quince por treinta: arco parabólico, que lo ves en el curso de Naves.',
  ], ['Obra', 'Medidas', 'Techo que conviene'],
    [['Cochera adosada', '3 × 6 m', 'Una agua'], ['Taller', '10 × 16 m', 'Dos aguas'], ['Casa', '8 × 12 m', 'Cuatro aguas'], ['Almacén', '15 × 30 m', 'Arco parabólico']],
    lambda i: [1, 2, 3, 3][i], izq=280, der=280),
  caso('el agua cae en la puerta', [
    'Caso de obra: un maestro hizo una cochera a una sola agua, y la caída quedó hacia la puerta de entrada.',
    'Cada lluvia, toda el agua del techo cae justo donde la gente entra. Y si cae hacia el lote del vecino, el problema es todavía peor.',
    'La regla: decide hacia dónde va el agua antes de diseñar. Siempre hacia tu propio patio o hacia una canaleta con su bajada, nunca hacia la puerta ni hacia el vecino.',
  ], [('🚪', 'El agua caía <b class="nar">sobre la entrada</b>'), ('🏠', 'Nunca hacia la puerta <b class="nar">ni hacia el vecino</b>'), ('🌧️', 'Primero decide <b class="nar">a dónde va el agua</b>: patio o canaleta')]),
  *ejercicio(1,
    'Cuenta las partes:<br>¿cuántas <b class="nar">cumbreras</b>, <b class="nar">limatesas</b> y <b class="nar">faldones</b> tiene<br>un techo a dos aguas y uno a cuatro aguas?',
    ['Ahora tú. Cuenta las partes de cada techo.', '¿Cuántas cumbreras, cuántas limatesas y cuántos faldones tiene un techo a dos aguas? ¿Y uno a cuatro aguas?'],
    'Dos aguas: <b class="nar">1 cumbrera · 0 limatesas · 2 faldones</b> (y 2 frontis)<br>Cuatro aguas: <b class="nar">1 cumbrera · 4 limatesas · 4 faldones</b><br>(2 trapecios y 2 triángulos)',
    ['Dos aguas: una cumbrera, ninguna limatesa, y dos faldones. En los extremos quedan los dos frontis.',
     'Cuatro aguas: una cumbrera, cuatro limatesas y cuatro faldones: dos trapecios en los lados largos y dos triángulos en los cortos.']),
  faq([
    ('¿Cuál es más barato?', 'Dos aguas: menos cortes y menos desperdicio.', '¿Cuál sale más barato? Normalmente el de dos aguas: tiene menos cortes de plancha, menos piezas y menos desperdicio.'),
    ('¿Se hace cuatro aguas en metal?', 'Sí: con limatesas y medios tijerales.', '¿Se puede hacer un cuatro aguas con estructura metálica? Claro. Lleva limatesas y medios tijerales, y lo vemos paso a paso en la clase siete.'),
    ('¿Cuándo usar una sola agua?', 'Luces chicas o techos pegados a un muro.', '¿Y cuándo conviene una sola agua? En luces chicas, o cuando el techo va pegado a un muro, como una cochera o un depósito.'),
  ]),
  repaso([
    ('¿Qué es un agua o faldón?', 'Cada plano inclinado del techo por donde corre la lluvia.'),
    ('¿Qué pieza separa dos faldones en una esquina exterior?', 'La limatesa.'),
    ('¿Qué techo protege las cuatro fachadas?', 'El de cuatro aguas.'),
    ('¿Qué se decide antes que la forma del techo?', 'Hacia dónde va el agua.'),
  ]),
]

# ───────────── Clase 2 · La pendiente ─────────────
EXT['techo_c2'] = [
  dict(inicio=True, frases=[
    'La respuesta del reto de la clase pasada: la casa de diez por catorce, a cuatro aguas, vista en planta.',
    'La cumbrera queda al centro y mide catorce menos diez: cuatro metros. De sus puntas salen las cuatro limatesas, a cuarenta y cinco grados, hacia las esquinas.',
    'Así quedan dos trapecios en los lados largos y dos triángulos en los lados cortos. Si tu dibujo se ve así, vas muy bien.',
  ], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Respuesta: <span class="nar">planta 10 × 14 m</span>', top=90) + svg(
    '<rect x="666" y="250" width="588" height="420" fill="rgba(255,255,255,.05)" stroke="#9aa6b0" stroke-width="6"/>'
    '<line class="dib" data-en="1" x1="876" y1="460" x2="1044" y2="460" stroke="#ffd166" stroke-width="12" style="--l:180"/>'
    + ''.join(f'<line class="dib" data-en="1" data-mas=".5" x1="{a}" y1="{b}" x2="{c}" y2="{d}" stroke="#f97316" stroke-width="8" style="--l:320"/>'
              for a, b, c, d in [(666, 250, 876, 460), (666, 670, 876, 460), (1254, 250, 1044, 460), (1254, 670, 1044, 460)]) +
    f'<text class="ap" data-en="1" x="960" y="442" fill="#ffd166" font-size="28" {T} text-anchor="middle">cumbrera 4 m</text>'
    f'<text x="960" y="712" fill="#fff" font-size="28" {T} text-anchor="middle">14 m</text><text x="640" y="470" fill="#fff" font-size="28" {T} text-anchor="end">10 m</text>'
    f'<text class="ap" data-en="2" x="960" y="330" fill="#7ee08a" font-size="26" {T} text-anchor="middle">trapecio</text>'
    f'<text class="ap" data-en="2" x="750" y="470" fill="#7ee08a" font-size="26" {T} text-anchor="middle">triángulo</text>')),
  ejemplo('Pendiente, grados y <span class="nar">factor</span>', [
    'Una tabla para tener a mano en la obra. El factor sirve para pasar cualquier medida horizontal a su largo real sobre el faldón.',
    'El factor es la raíz de uno más la pendiente al cuadrado. Con veinticinco por ciento: uno coma cero tres uno.',
    'Por ejemplo: cinco metros horizontales, por uno coma cero tres uno, son cinco metros quince de faldón. Es la medida que viste en el taller.',
  ], ['Pendiente', 'Grados', 'Factor (largo real)'],
    [['10 %', '5.7°', '1.005'], ['15 %', '8.5°', '1.011'], ['20 %', '11.3°', '1.020'], ['25 %', '14.0°', '1.031'], ['30 %', '16.7°', '1.044'], ['40 %', '21.8°', '1.077']],
    lambda i: [0, 0, 0, 1, 1, 0][i] if i != 3 else 2, top=250, izq=420, der=420, tam=29),
  caso('“diez de pendiente”', [
    'Caso de obra: el cliente pidió diez de pendiente. El maestro entendió diez grados y el ingeniero había dibujado diez por ciento.',
    'En un techo de diez metros de luz, con diez por ciento, la cumbrera sube cincuenta centímetros. Con diez grados, sube ochenta y ocho. Casi cuarenta centímetros de diferencia.',
    'La solución es simple: escribe siempre la unidad, por ciento o grados, en el plano y en la cotización, y confírmalo con el cliente antes de cortar.',
  ], [('❓', '“10” ¿por ciento o grados?'), ('📏', 'Luz 10 m: 10 % → <b class="nar">0.50 m</b> · 10° → <b class="nar">0.88 m</b>'), ('✍️', 'Escribe <b class="nar">siempre la unidad</b> en plano y cotización')]),
  *ejercicio(2,
    'Techo a dos aguas de <b class="nar">12 m</b> de luz con <b class="nar">20 %</b> de pendiente.<br>Calcula la altura de la cumbrera, el largo del faldón y el ángulo.',
    ['Ahora tú. Un techo a dos aguas de doce metros de luz, con veinte por ciento de pendiente.', 'Calcula la altura de la cumbrera, el largo del faldón y el ángulo. Usa la tabla.'],
    'Cumbrera: 6 × 0.20 = <b class="nar">1.20 m</b><br>Faldón: 6 × 1.020 = <b class="nar">6.12 m</b> · Ángulo: <b class="nar">11.3°</b>',
    ['Cada faldón cubre la mitad de la luz: seis metros. Por veinte por ciento, la cumbrera sube un metro veinte.',
     'El faldón: seis por uno coma cero veinte, seis metros doce. Y el ángulo, según la tabla, once coma tres grados.']),
  faq([
    ('¿Cuál es la pendiente mínima?', 'La que diga la ficha de tu cobertura.', '¿Cuál es la pendiente mínima? No hay un número para todo: la manda la ficha técnica de la cobertura que vas a usar.'),
    ('¿Más pendiente es mejor?', 'Escurre mejor, pero lleva más material y recibe más viento.', '¿Más pendiente siempre es mejor? El agua escurre mejor, pero el techo lleva más material y el viento lo empuja más.'),
    ('¿Cómo mido la pendiente en obra?', 'Nivel de 1 m + regla: cm que sube = %.', '¿Cómo mido la pendiente de un techo que ya existe? Pon un nivel de un metro horizontal y mide cuántos centímetros sube: ese número es el porcentaje.'),
  ]),
  repaso([
    ('¿Qué dice una pendiente de 25 %?', 'Que sube veinticinco centímetros por cada metro horizontal.'),
    ('¿Para qué sirve el factor?', 'Para pasar una medida horizontal a su largo real sobre el faldón.'),
    ('¿Cuánto es el factor con 30 %?', 'Uno coma cero cuarenta y cuatro.'),
    ('¿Qué escribes siempre junto a la pendiente?', 'La unidad: por ciento o grados.'),
  ]),
]

# ───────────── Clase 3 · El tijeral a dos aguas ─────────────
EXT['techo_c3'] = [
  respuesta('casa 8 m con 30 %', [
    'La respuesta del reto de la clase pasada: la casa de ocho metros de luz, con treinta por ciento.',
    'Cada faldón cubre cuatro metros: la cumbrera sube cuatro por cero treinta, un metro veinte.',
    'El faldón mide cuatro por uno coma cero cuarenta y cuatro: cuatro metros dieciocho. Y el ángulo, dieciséis coma siete grados.',
  ], ['Dato', 'Resultado'], [['Altura de la cumbrera', '1.20 m'], ['Largo del faldón', '4.18 m'], ['Ángulo', '16.7°']], lambda i: i),
  ejemplo('¿Cuándo hace falta <span class="nar">talón</span>?', [
    'Apliquemos la regla de la altura a un tijeral de diez metros de luz: entre la luz entre quince y la luz entre diez, o sea entre sesenta y siete centímetros y un metro.',
    'Con veinticinco o veinte por ciento, la cumbrera llega o pasa el metro: tijeral triangular, sin problema. Con quince por ciento, setenta y cinco centímetros: todavía dentro del rango, pero justo.',
    'Con diez por ciento, la cumbrera queda en cincuenta centímetros: le falta altura. Ahí se agrega un talón en el apoyo para recuperarla.',
  ], ['Pendiente', 'Cumbrera (luz 10 m)', 'Rango 0.67 – 1.00 m'],
    [['25 %', '1.25 m', '✓ triangular'], ['20 %', '1.00 m', '✓ triangular'], ['15 %', '0.75 m', '✓ justo'], ['10 %', '0.50 m', '✗ agregar talón']],
    lambda i: [1, 1, 1, 2][i]),
  caso('la plancha se hunde al pisar', [
    'Caso de obra: el cliente se queja de que la plancha se hunde cuando alguien sube a limpiar las canaletas.',
    'Revisas y las correas están a un metro y medio, pero la ficha de esa plancha pedía un metro veinte como máximo.',
    'No basta con agregar una correa al medio: tiene que apoyarse en un nudo. Por eso el paso entre nudos del tijeral se decide con la ficha, antes de fabricar.',
  ], [('🦶', 'La plancha <b class="nar">se hunde</b> al pisar'), ('📏', 'Correas a 1.50 m; la ficha pedía <b class="nar">1.20 m</b>'), ('📐', 'Paso de nudos según la ficha, <b class="nar">antes de fabricar</b>')]),
  *ejercicio(3,
    'Techo de <b class="nar">12 m</b> de luz con <b class="nar">20 %</b>: faldón de <b class="nar">6.12 m</b>.<br>La plancha permite correas hasta <b class="nar">1.30 m</b>. ¿Cuántos paneles por faldón y de qué largo?',
    ['Ahora tú. Un techo de doce metros de luz con veinte por ciento: cada faldón mide seis metros doce.', 'La plancha permite correas hasta un metro treinta. ¿Cuántos paneles por faldón, y de qué largo?'],
    '6.12 ÷ 1.30 = 4.7 → <b class="nar">5 paneles</b> por faldón<br>6.12 ÷ 5 = <b class="nar">1.22 m</b> cada uno · <b class="nar">10 paneles</b> en el tijeral',
    ['Seis doce entre uno treinta da cuatro coma siete. Siempre redondeas hacia arriba: cinco paneles por faldón.',
     'Seis doce entre cinco: un metro veintidós cada panel. Y en todo el tijeral, diez paneles.']),
  faq([
    ('¿Pratt o Howe?', 'En el Pratt, con peso hacia abajo, las diagonales trabajan estiradas.', '¿Pratt o Howe? En el Pratt, con el peso del techo, las diagonales trabajan a tracción, estiradas, y los montantes a compresión. En el Howe es al revés. En acero se usa mucho el Pratt.'),
    ('¿Tubo o ángulo doble?', 'Los dos sirven: el tubo se pinta y limpia más fácil.', '¿Tubo o ángulo doble? Los dos funcionan. El tubo cuadrado se pinta y se limpia más fácil; el ángulo doble se arma bien con planchas de nudo.'),
    ('¿Correa entre nudos con refuerzo?', 'Solo con un cálculo que lo respalde.', '¿Puedo apoyar una correa entre nudos si refuerzo el cordón? Solo si un cálculo lo respalda. Lo normal es mover la correa al nudo.'),
  ]),
  repaso([
    ('¿Qué regla de altura usas para empezar?', 'El peralte, entre la luz entre quince y la luz entre diez.'),
    ('¿Qué haces si la cumbrera queda baja?', 'Agregar un talón en el apoyo.'),
    ('¿Quién decide el paso entre nudos?', 'La separación de correas, que manda la ficha de la cobertura.'),
    ('¿Hacia dónde redondeas los paneles?', 'Siempre hacia arriba.'),
  ]),
]

# ───────────── Clase 4 · Trazo y armado ─────────────
EXT['techo_c4'] = [
  respuesta('paneles de la casa', [
    'La respuesta del reto de la clase pasada: faldones de cuatro metros dieciocho, con correas hasta un metro veinte.',
    'Cuatro dieciocho entre uno veinte: tres coma cuarenta y ocho. Redondeas hacia arriba: cuatro paneles por faldón.',
    'Cada panel mide un metro cero cinco sobre el faldón, y el tijeral completo tiene ocho paneles.',
  ], ['Paso', 'Resultado'], [['4.18 ÷ 1.20', '3.48'], ['Paneles por faldón', '4'], ['Largo de cada panel', '≈ 1.05 m'], ['Paneles en el tijeral', '8']], lambda i: [1, 1, 2, 2][i]),
  ejemplo('El 3-4-5 <span class="nar">a cualquier tamaño</span>', [
    'El tres cuatro cinco funciona a cualquier escala: multiplica los tres números por lo mismo.',
    'Sesenta centímetros, ochenta centímetros y un metro, para escuadras chicas. Uno veinte, uno sesenta y dos metros, para el gálibo.',
    'Y tres, cuatro y cinco metros para el trazo grande. Usa siempre el tamaño más grande que entre en tu losa: mientras más grande, más exacto.',
  ], ['Escala', 'Lado 1', 'Lado 2', 'Diagonal'],
    [['× 0.2', '0.60 m', '0.80 m', '1.00 m'], ['× 0.4', '1.20 m', '1.60 m', '2.00 m'], ['× 1', '3.00 m', '4.00 m', '5.00 m']],
    lambda i: [1, 1, 2][i], izq=380, der=380),
  caso('un tijeral salió más corto', [
    'Caso de obra: al montar, el último tijeral no llega al apoyo: le faltan dos centímetros.',
    'La causa: ese día se usó otra wincha, y las dos no medían igual. Pasa más de lo que crees.',
    'La regla: una sola wincha para todo el trabajo, y antes de soldar cada tijeral, comprueba en el gálibo la luz total y la altura al centro.',
  ], [('📏', 'Faltaban <b class="nar">2 cm</b>: otra wincha'), ('1️⃣', '<b class="nar">Una sola wincha</b> para toda la obra'), ('✅', 'En el gálibo, comprueba <b class="nar">luz y altura</b> de cada uno')]),
  *ejercicio(4,
    'Casa: tijeral Pratt de <b class="nar">8 m</b>, <b class="nar">30 %</b>, paneles de <b class="nar">1 m</b>.<br>Montantes de 0.30, 0.60 y 0.90 m. Calcula las tres diagonales de un lado.',
    ['Ahora tú, con la casa. Tijeral Pratt de ocho metros, treinta por ciento, paneles de un metro.', 'Los montantes miden treinta, sesenta y noventa centímetros. Calcula las tres diagonales de un lado, con Pitágoras.'],
    '√(1² + 0.30²) ≈ <b class="nar">1.04 m</b> · √(1² + 0.60²) ≈ <b class="nar">1.17 m</b><br>√(1² + 0.90²) ≈ <b class="nar">1.35 m</b>',
    ['Cada diagonal une la punta de un montante con el nudo inferior siguiente, a un metro.',
     'Raíz de uno más cero treinta al cuadrado: uno cero cuatro. Con sesenta: uno diecisiete. Con noventa: uno treinta y cinco.']),
  faq([
    ('¿Puedo trazar en tierra?', 'No: losa nivelada o tablero firme.', '¿Puedo trazar el tijeral sobre la tierra? No. Se mueve, y el tijeral sale torcido. Siempre sobre losa nivelada o un tablero firme.'),
    ('¿Puntear o soldar completo?', 'Puntear en el gálibo y soldar alternando.', '¿Lo sueldo completo en el gálibo? Lo punteas en el gálibo, y luego sueldas alternando lados para que no se deforme. Lo viste en el curso de Soldadura.'),
    ('¿Cada cuánto reviso el gálibo?', 'En cada tijeral: luz y altura.', '¿Cada cuánto reviso el gálibo? En cada tijeral. Los topes se golpean y se mueven.'),
  ]),
  repaso([
    ('¿Sobre qué se traza el tijeral?', 'Sobre una superficie plana y nivelada.'),
    ('¿Qué truco levanta la perpendicular?', 'El tres cuatro cinco.'),
    ('¿Para qué sirve el gálibo?', 'Para que todos los tijerales salgan iguales.'),
    ('¿Dónde va el empalme del cordón inferior?', 'En un nudo, nunca a media barra.'),
  ]),
]

# ───────────── Clase 5 · Los apoyos ─────────────
EXT['techo_c5'] = [
  respuesta('montantes de la casa', [
    'La respuesta del reto de la clase pasada: tijeral de ocho metros, treinta por ciento y cuatro paneles por faldón.',
    'Cada panel mide un metro en horizontal. Los montantes: treinta, sesenta y noventa centímetros a cada lado, y el central, un metro veinte.',
    'Son siete montantes, que suman cuatro metros ochenta de tubo por tijeral.',
  ], ['Montante', 'Altura'], [['A 1 m del apoyo (×2)', '0.30 m'], ['A 2 m (×2)', '0.60 m'], ['A 3 m (×2)', '0.90 m'], ['Central', '1.20 m'], ['<span class="nar">Total: 7 montantes</span>', '<b class="nar">4.80 m</b>']], lambda i: [1, 1, 1, 1, 2][i], tam=29),
  ejemplo('¿Cuánto se <span class="nar">estira</span> el tijeral?', [
    'Con la regla de la dilatación, doce milésimas de milímetro por metro y por grado, mira cuánto se mueve un tijeral.',
    'Diez metros, con treinta grados más de temperatura: tres coma seis milímetros. Veinte metros con cuarenta grados: casi diez milímetros.',
    'Por eso en luces grandes el plano suele indicar un apoyo fijo y otro con agujero ovalado, para que el tijeral pueda moverse sin empujar la columna.',
  ], ['Luz', 'Subida de temperatura', 'Se alarga'],
    [['10 m', '30 °C', '≈ 3.6 mm'], ['12 m', '35 °C', '≈ 5.0 mm'], ['20 m', '40 °C', '≈ 9.6 mm']], lambda i: [1, 1, 1][i] if i < 2 else 1),
  caso('el viento levantó el techo', [
    'Caso de obra: después de un ventarrón, un techo liviano apareció levantado en una esquina.',
    'Los tijerales estaban apoyados con dos puntos de soldadura, y los pernos no tenían tuerca completa. El viento succionó el techo hacia arriba.',
    'Cada apoyo, con su plancha, sus pernos con tuerca y contratuerca, y la fijación que indica el plano. Y las planchas, con todos sus pernos en cada correa.',
  ], [('🌪️', 'El viento <b class="nar">succiona</b> hacia arriba'), ('🔩', 'Pernos con <b class="nar">tuerca y contratuerca</b>'), ('📘', 'Fijación según el <b class="nar">plano</b>, no dos puntos de soldadura')]),
  *ejercicio(5,
    'Un taller de <b class="nar">10 × 20 m</b> con tijerales cada <b class="nar">4 m</b>.<br>¿Cuántos tijerales, apoyos y pernos (4 por apoyo)?',
    ['Ahora tú. Un taller de diez por veinte, con tijerales cada cuatro metros.', '¿Cuántos tijerales, cuántos apoyos y cuántos pernos, si cada apoyo lleva cuatro?'],
    '20 ÷ 4 = 5 paños → <b class="nar">6 tijerales</b><br>6 × 2 = <b class="nar">12 apoyos</b> · 12 × 4 = <b class="nar">48 pernos</b>',
    ['Veinte entre cuatro: cinco paños. Siempre un tijeral más que paños: seis tijerales.',
     'Seis tijerales por dos apoyos: doce apoyos. Por cuatro pernos: cuarenta y ocho.']),
  faq([
    ('¿Nivelo con madera?', 'No: con lainas de acero.', '¿Puedo nivelar un apoyo con un taco de madera? No. La madera se aplasta y se pudre. Se nivela con lainas de acero.'),
    ('¿Anclaje químico cerca del borde?', 'No: respeta la distancia del fabricante.', '¿Puedo poner un anclaje químico cerca del borde de la viga? No. Respeta la distancia al borde que indica el fabricante, o el concreto se rompe.'),
    ('¿Soldar o empernar el apoyo?', 'Lo dice el plano.', '¿El tijeral va soldado o empernado al apoyo? Lo dice el plano. Y si un apoyo debe deslizar, no se suelda.'),
  ]),
  repaso([
    ('¿Dónde se apoya el tijeral en una casa de ladrillo?', 'En la viga collar, nunca en el ladrillo.'),
    ('¿Cuánto se alarga el acero?', 'Doce milésimas de milímetro por metro y por grado.'),
    ('¿Qué hace el viento en un techo liviano?', 'Lo succiona hacia arriba.'),
    ('¿Cuántos tijerales hay si tienes cinco paños?', 'Seis: uno más que paños.'),
  ]),
]

# ───────────── Clase 6 · Los aleros ─────────────
EXT['techo_c6'] = [
  respuesta('dilatación 16 m', [
    'La respuesta del reto de la clase pasada: tijeral de dieciséis metros, con cuarenta grados más de temperatura.',
    'Cero coma cero doce milímetros, por dieciséis metros, por cuarenta grados: siete coma siete milímetros. Casi ocho milímetros.',
  ], ['Cálculo', 'Resultado'], [['0.012 × 16 × 40', '7.68 mm'], ['Redondeado', '≈ 7.7 mm']], lambda i: i),
  ejemplo('El alero <span class="nar">cambia las medidas</span>', [
    'Con el taller, a veinticinco por ciento, mira cómo cambia el faldón según el alero.',
    'Sin alero, el faldón mide cinco quince. Con treinta centímetros, cinco cuarenta y seis. Con medio metro, cinco sesenta y siete.',
    'Con un metro, seis diecinueve. Y la punta del alero baja la cuarta parte de lo que sale: con un metro de alero, baja veinticinco centímetros.',
  ], ['Alero', 'Largo del faldón', 'Cuánto baja la punta'],
    [['0', '5.15 m', '—'], ['0.30 m', '5.46 m', '7.5 cm'], ['0.50 m', '5.67 m', '12.5 cm'], ['1.00 m', '6.19 m', '25 cm']], lambda i: [1, 1, 1, 2][i]),
  caso('el alero vibra con el viento', [
    'Caso de obra: un cliente pidió aleros de un metro veinte, y en días de viento se escucha un golpeteo y la punta vibra.',
    'Un alero largo es un volado: el viento lo empuja desde abajo. Un volado tan largo necesita refuerzo y el visto bueno del cálculo.',
    'Y en la fila de planchas del alero, pon más pernos: es la zona donde el viento arranca primero.',
  ], [('💨', 'Alero largo = <b class="nar">volado</b> que el viento levanta'), ('📐', 'Refuerzo y <b class="nar">visto bueno del cálculo</b>'), ('🔩', '<b class="nar">Más pernos</b> en la fila del alero')]),
  *ejercicio(6,
    'Una casa con muros de <b class="nar">7 × 10 m</b> y aleros de <b class="nar">0.60 m</b> en todo el contorno.<br>¿Cuánto mide el techo en planta y cuál es su área?',
    ['Ahora tú. Una casa con muros de siete por diez, y aleros de sesenta centímetros en todo el contorno.', '¿Cuánto mide el techo en planta, y cuál es su área?'],
    '7 + 2 × 0.60 = <b class="nar">8.20 m</b> · 10 + 2 × 0.60 = <b class="nar">11.20 m</b><br>Área en planta: 8.20 × 11.20 = <b class="nar">91.84 m²</b>',
    ['El alero se suma en los dos lados: siete más uno veinte, ocho veinte. Diez más uno veinte, once veinte.',
     'Ocho veinte por once veinte: noventa y uno coma ochenta y cuatro metros cuadrados en planta.']),
  faq([
    ('¿Cuánto alero en una casa?', 'Suele ir de 0.50 a 1.00 m, según lluvia y sol.', '¿Cuánto alero le pongo a una casa? Suele ir de medio metro a un metro, según cuánto llueve y cuánto sol da en esa fachada.'),
    ('¿La cenefa es obligatoria?', 'Muy recomendable: tapa la correa y endurece el borde.', '¿La cenefa es obligatoria? No siempre, pero es muy recomendable: tapa la correa del borde y endurece la punta del alero.'),
    ('¿Y la canaleta?', 'En la punta del alero, con caída hacia las bajadas.', '¿Dónde va la canaleta? En la punta del alero, con una ligera caída hacia las bajadas.'),
  ]),
  repaso([
    ('¿Para qué sirve el alero?', 'Protege muros y ventanas de la lluvia y del sol.'),
    ('¿Qué parte del techo castiga más el viento?', 'El alero.'),
    ('¿Cuánto baja la punta de un alero de un metro al veinticinco por ciento?', 'Veinticinco centímetros.'),
    ('¿Qué se suma al techo en planta?', 'El alero, en los dos lados.'),
  ]),
]

# ───────────── Clase 7 · Cuatro aguas ─────────────
EXT['techo_c7'] = [
  respuesta('aleros de 80 cm', [
    'La respuesta del reto de la clase pasada: el taller con aleros de ochenta centímetros.',
    'Cinco metros más ochenta centímetros: cinco ochenta en horizontal. Por el factor uno coma cero tres uno: cinco noventa y ocho de faldón.',
    'Y la punta baja la cuarta parte de ochenta: veinte centímetros.',
  ], ['Dato', 'Resultado'], [['Horizontal', '5.80 m'], ['Faldón (× 1.031)', '5.98 m'], ['La punta baja', '0.20 m']], lambda i: i),
  ejemplo('Tres techos <span class="nar">a cuatro aguas</span>', [
    'Con treinta por ciento, comparemos tres techos a cuatro aguas.',
    'La casa, de nueve por trece: cumbrera de cuatro metros, sube uno treinta y cinco, y cada limatesa mide seis cincuenta y uno.',
    'Un techo de ocho por diez: cumbrera de dos metros, sube uno veinte, limatesa de cinco setenta y ocho.',
    'Y si el techo es cuadrado, de doce por doce, no hay cumbrera: las cuatro limatesas se juntan en una punta, como una pirámide. Sube uno ochenta, y cada limatesa mide ocho sesenta y siete.',
  ], ['Techo', 'Cumbrera', 'Sube', 'Limatesa real'],
    [['9 × 13 m', '4.00 m', '1.35 m', '6.51 m'], ['8 × 10 m', '2.00 m', '1.20 m', '5.78 m'], ['12 × 12 m', '0 (pirámide)', '1.80 m', '8.67 m']],
    lambda i: i + 1, izq=280, der=280),
  caso('la cumbrera quedó corrida', [
    'Caso de obra: al montar el cuatro aguas, las limatesas no llegan a las puntas de la cumbrera, y la cumbrera queda corrida hacia un lado.',
    'La causa: los faldones de los lados cortos se hicieron con otra pendiente "para que se vean más paraditos". Con pendientes distintas, las limatesas ya no van a cuarenta y cinco grados.',
    'La regla: misma pendiente en los cuatro faldones. Y si el cliente quiere otra, se traza en planta antes de fabricar, no en el techo.',
  ], [('↔️', 'Cumbrera <b class="nar">corrida</b>, limatesas que no llegan'), ('📐', 'Pendientes distintas: ya <b class="nar">no es 45°</b>'), ('✏️', 'Misma pendiente, o <b class="nar">trazo en planta</b> antes')]),
  *ejercicio(7,
    'Techo a cuatro aguas de <b class="nar">9 × 13 m</b> con <b class="nar">25 %</b>.<br>Calcula la cumbrera, cuánto sube y el largo real de una limatesa.',
    ['Ahora tú. Un techo a cuatro aguas de nueve por trece, pero con veinticinco por ciento.', 'Calcula la cumbrera, cuánto sube, y el largo real de una limatesa.'],
    'Cumbrera: 13 − 9 = <b class="nar">4.00 m</b> · Sube: 4.50 × 0.25 = <b class="nar">1.13 m</b><br>Limatesa en planta 4.50 × √2 = 6.36 m → real √(6.36² + 1.13²) ≈ <b class="nar">6.46 m</b>',
    ['La cumbrera: trece menos nueve, cuatro metros. Sube cuatro cincuenta por cero veinticinco: un metro trece.',
     'La limatesa en planta: cuatro cincuenta por raíz de dos, seis treinta y seis. Con la subida, por Pitágoras: unos seis cuarenta y seis.']),
  faq([
    ('¿Qué perfil lleva la limatesa?', 'Lo fija el cálculo; suele ser más robusta que una correa.', '¿Qué perfil lleva la limatesa? Lo fija el cálculo. Suele ser más robusta que una correa, porque recibe las correas de dos faldones.'),
    ('¿Puedo poner otra pendiente en un lado?', 'Sí, pero se traza aparte: ya no es 45°.', '¿Puedo poner otra pendiente en una fachada? Sí, pero las limatesas ya no van a cuarenta y cinco grados, y todo se traza aparte en planta.'),
    ('¿Y si el techo es cuadrado?', 'Sin cumbrera: pirámide de cuatro limatesas.', '¿Y si la casa es cuadrada? El techo no tiene cumbrera: las cuatro limatesas se juntan en una punta.'),
  ]),
  repaso([
    ('¿Cómo se calcula la cumbrera de un cuatro aguas?', 'El largo menos el ancho.'),
    ('¿A cuántos grados van las limatesas en planta?', 'A cuarenta y cinco, si todos los faldones tienen la misma pendiente.'),
    ('¿Cómo sale el largo real de la limatesa?', 'Con Pitágoras: largo en planta y subida.'),
    ('¿Qué pasa en un techo cuadrado?', 'No hay cumbrera: es una pirámide.'),
  ]),
]

# ───────────── Clase 8 · Metrado y presupuesto ─────────────
EXT['techo_c8'] = [
  respuesta('casa 10 × 14 m', [
    'La respuesta del reto de la clase pasada: techo de diez por catorce, con treinta por ciento.',
    'La cumbrera: catorce menos diez, cuatro metros. Sube cinco por cero treinta: un metro cincuenta.',
    'La limatesa: en planta, cinco por raíz de dos, siete cero siete. Con la subida, siete metros veintitrés.',
  ], ['Dato', 'Resultado'], [['Cumbrera', '4.00 m'], ['Altura desde el alero', '1.50 m'], ['Limatesa en planta', '7.07 m'], ['Limatesa real', '7.23 m']], lambda i: [1, 1, 2, 2][i]),
  ejemplo('Metrado exprés: <span class="nar">cochera 6 × 8 m</span>', [
    'Un metrado rápido de otra obra: una cochera a dos aguas cuyo techo, con aleros, mide seis por ocho, con veinte por ciento.',
    'Área: cuarenta y ocho en planta, por uno coma cero veinte: cuarenta y nueve metros cuadrados de cobertura.',
    'Cada faldón: tres por uno coma cero veinte, tres cero seis. Las planchas se piden a tres diez. Con un metro de ancho útil: ocho por faldón, dieciséis en total. Y ocho metros de cumbrera.',
  ], ['Partida', 'Cálculo', 'Resultado'],
    [['Cobertura', '48 × 1.020', '≈ 49 m²'], ['Largo de plancha', '3 × 1.020 = 3.06', 'pedir 3.10 m'], ['Planchas', '8 por faldón × 2', '16'], ['Cumbrera', 'largo del techo', '8 m']],
    lambda i: [1, 2, 2, 2][i], izq=260, der=260),
  caso('el presupuesto salió corto', [
    'Caso de obra: el maestro cotizó acero y planchas, ganó la obra... y al final perdió plata.',
    'Se le olvidaron los pernos autoperforantes, la cenefa, las canaletas y bajadas, la pintura, el transporte y el desperdicio de los cortes.',
    ('Usa siempre una lista de control. Y si lo haces en InnovApp, el presupuesto de techos ya trae esas partidas para que no se te escape ninguna.', 'Usa siempre una lista de control. Y si lo haces en Innova Ap, el presupuesto de techos ya trae esas partidas para que no se te escape ninguna.'),
  ], [('💸', 'Cotizó solo <b class="nar">acero y planchas</b>'), ('🧾', 'Faltaron pernos, cenefa, canaletas, <b class="nar">pintura y transporte</b>'), ('✅', 'Usa una <b class="nar">lista de control</b> en cada cotización')]),
  *ejercicio(8,
    'La cochera: <b class="nar">16 planchas</b>, <b class="nar">4 filas de correas</b> por faldón<br>y <b class="nar">3 pernos</b> en cada cruce. ¿Cuántos pernos, con 10 % de reserva?',
    ['Ahora tú, con la cochera. Dieciséis planchas, cuatro filas de correas por faldón, y tres pernos en cada cruce.', '¿Cuántos pernos autoperforantes compras, con diez por ciento de reserva?'],
    '16 × 4 × 3 = <b class="nar">192 pernos</b><br>+ 10 % = 211.2 → <b class="nar">≈ 212 pernos</b>',
    ['Cada plancha cruza cuatro correas, con tres pernos en cada cruce: dieciséis por cuatro por tres, ciento noventa y dos.',
     'Más diez por ciento: doscientos once coma dos. Compras unos doscientos doce.']),
  faq([
    ('¿Cotizo por metro cuadrado?', 'Sirve para comparar; cotiza con el metrado.', '¿Puedo cotizar por metro cuadrado? Te sirve para comparar y para dar un precio rápido, pero la cotización final se hace con el metrado.'),
    ('¿Incluyo el IGV?', 'Depende de si emites factura: consulta a tu contador.', '¿Incluyo el IGV? Depende de cómo trabajes y de si emites factura. Para tu caso, consulta con un contador.'),
    ('¿Cómo calculo la pintura?', 'Por el área del acero, como en el curso de Estructuras.', '¿Y la pintura? Se calcula por el área del acero y el rendimiento del galón, como viste en el curso de Estructuras.'),
  ]),
  repaso([
    ('¿Cómo sale el área real del techo?', 'Área en planta por el factor de inclinación.'),
    ('¿Con qué medida divides el largo para contar planchas?', 'Con el ancho útil de la plancha.'),
    ('¿Qué accesorios se olvidan más?', 'Pernos, cenefa, canaletas y bajadas.'),
    ('¿Cómo se compra el acero?', 'En kilos: metros por el peso por metro.'),
  ]),
]

# ───────────── Clase 9 · Coberturas ─────────────
EXT['techo_c9'] = [
  ejemplo('¿Cuánto <span class="nar">pesa</span> cada cobertura?', [
    'Por qué cambiar de cobertura es cambiar el techo: mira los pesos, solo como referencia. El dato real está en la ficha.',
    'Una plancha metálica pesa unos cuatro a seis kilos por metro cuadrado. Un panel termoacústico, unos ocho a doce. Una teja de fibrocemento, unos catorce a veinte.',
    'Y la teja de arcilla, unos cuarenta a sesenta kilos, sin contar sus listones. En la casa, con ciento veintidós metros cuadrados, eso es pasar de unos seiscientos kilos a más de cinco toneladas.',
  ], ['Cobertura', 'Peso aprox. (kg/m²)', 'Casa de 122 m²'],
    [['Plancha metálica', '4 – 6', '≈ 0.6 t'], ['Panel termoacústico', '8 – 12', '≈ 1.2 t'], ['Teja de fibrocemento', '14 – 20', '≈ 2.1 t'], ['Teja de arcilla', '40 – 60', '≈ 6 t']],
    lambda i: [1, 1, 1, 2][i], izq=260, der=260),
  caso('goteras en cada tornillo', [
    'Caso de obra: un techo nuevo gotea en puntos pequeños, siempre donde hay un tornillo.',
    'Los pernos se pusieron sin su arandela de jebe, o tan apretados que la arandela se reventó. En otros, el perno quedó chueco.',
    'Usa el perno con arandela que pide la ficha, perpendicular a la plancha, y aprieta solo hasta que la arandela asiente. Ni más, ni menos.',
  ], [('💧', 'Gotea <b class="nar">en cada tornillo</b>'), ('⭕', 'Falta o se reventó la <b class="nar">arandela</b>'), ('🔩', 'Perno <b class="nar">recto</b> y apretado hasta que asiente')]),
  *ejercicio(9,
    'La casa de <b class="nar">122 m²</b> cambia de plancha metálica (<b class="nar">5 kg/m²</b>)<br>a teja de fibrocemento (<b class="nar">18 kg/m²</b>). ¿Cuánto peso se agrega?',
    ['Ahora tú. La casa de ciento veintidós metros cuadrados cambia de plancha metálica, de cinco kilos, a teja de fibrocemento, de dieciocho.', '¿Cuánto peso se le agrega al techo?'],
    '(18 − 5) × 122 = <b class="nar">1 586 kg</b><br>Casi <b class="nar">1.6 toneladas</b> más: hay que revisar correas y tijerales',
    ['La diferencia es de trece kilos por metro cuadrado. Por ciento veintidós: mil quinientos ochenta y seis kilos.',
     'Casi una tonelada y media más. Con ese cambio se revisan correas, tijerales y apoyos.']),
  faq([
    ('¿Se puede caminar sobre el techo?', 'Solo donde la ficha diga, sobre las correas.', '¿Se puede caminar sobre el techo? Solo donde lo permita la ficha, y pisando sobre las correas, nunca entre ellas.'),
    ('¿Calamina o aluzinc?', 'El aluzinc suele durar más frente a la corrosión.', '¿Calamina o aluzinc? El aluzinc suele resistir mejor la corrosión y dura más, sobre todo cerca del mar.'),
    ('¿El policarbonato se pone amarillo?', 'Con la cara con protección UV hacia el sol, dura mucho más.', '¿El policarbonato se pone amarillo? Si se coloca con la cara protegida hacia el sol, dura mucho más. Al revés, se daña rápido.'),
  ]),
  repaso([
    ('¿Qué pasa si cambias la cobertura?', 'Cambias el techo: se revisa la estructura.'),
    ('¿Dónde está el dato exacto del peso?', 'En la ficha técnica.'),
    ('¿Qué falla si gotea en los tornillos?', 'La arandela o el apriete del perno.'),
    ('¿Qué metales no deben tocarse con el aluzinc?', 'El cobre y el acero sin protección.'),
  ]),
]

# ───────────── Clase 10 · Cortes y remates ─────────────
EXT['techo_c10'] = [
  dict(inicio=True, frases=[
    'Sobre el reto de la clase pasada, la ficha técnica: compárala con tu techo.',
    'Si la pendiente mínima de la ficha es mayor que la de tu techo, esa plancha no sirve ahí. Y si pide correas más juntas que las tuyas, tampoco.',
    'Guarda esa ficha: es tu respaldo si el cliente reclama, y la vamos a usar en esta clase.',
  ], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Sobre el reto: <span class="nar">tu ficha técnica</span>', top=90) + lista([
    ('📐', 'Pendiente mínima de la ficha <b class="nar">≤ la de tu techo</b>'), ('📏', 'Correas de la ficha <b class="nar">≥ tu separación</b>'), ('🗂️', 'Guárdala: es tu <b class="nar">respaldo</b>')],
    lambda i: i, top=290, izq=380, der=380, tam=33)),
  ejemplo('Planchas de la casa <span class="nar">con 25 %</span>', [
    'Repitamos la regla de las planchas cortadas, pero con la casa a veinticinco por ciento. El factor ahora es uno coma cero tres uno.',
    'A un metro de la esquina, la plancha mide uno cero tres en su lado largo. A dos, dos cero seis. A tres, tres cero nueve. A cuatro, cuatro doce.',
    'Y la central del faldón triangular: cuatro cincuenta por uno coma cero tres uno, cuatro sesenta y cuatro. Fíjate: con menos pendiente, planchas un poco más cortas.',
  ], ['Distancia a la esquina', 'Lado largo (× 1.031)'],
    [['1 m', '1.03 m'], ['2 m', '2.06 m'], ['3 m', '3.09 m'], ['4 m', '4.12 m'], ['Central (4.50 m)', '4.64 m']],
    lambda i: [1, 1, 1, 1, 2][i], izq=440, der=440, tam=30),
  caso('manchas de óxido en techo nuevo', [
    'Caso de obra: un techo nuevo de aluzinc aparece, a las semanas, lleno de puntitos de óxido.',
    'Las planchas se cortaron con amoladora encima del techo. La limalla caliente se pegó a la plancha y se oxidó.',
    'Corta con cizalla o tijera para metal, lejos de las planchas ya puestas. Y si usas amoladora, protege y barre la limalla el mismo día.',
  ], [('🟤', 'Puntos de <b class="nar">óxido</b> a las semanas'), ('⚙️', 'Limalla caliente de la <b class="nar">amoladora</b>'), ('✂️', 'Corta con <b class="nar">cizalla</b> y barre la limalla')]),
  *ejercicio(10,
    'Techo pirámide de <b class="nar">12 × 12 m</b>: 4 limatesas de <b class="nar">8.67 m</b>.<br>Si cada caballete cubre <b class="nar">1.80 m</b> útiles, ¿cuántas piezas compras?',
    ['Ahora tú. El techo pirámide de doce por doce tiene cuatro limatesas de ocho sesenta y siete, y no tiene cumbrera.', 'Si cada pieza de caballete cubre un metro ochenta útil, ¿cuántas piezas compras?'],
    '4 × 8.67 = <b class="nar">34.68 m</b> de caballete<br>34.68 ÷ 1.80 = 19.3 → <b class="nar">20 piezas</b>',
    ['Cuatro por ocho sesenta y siete: treinta y cuatro metros sesenta y ocho de caballete.',
     'Entre uno ochenta: diecinueve coma tres. Redondeas hacia arriba: veinte piezas.']),
  faq([
    ('¿Sello bajo el caballete?', 'Sí: espuma o cierre que indique el fabricante.', '¿Va algo debajo del caballete? Sí: el cierre o espuma que indique el fabricante, para que no entren agua, polvo ni pájaros.'),
    ('¿El plano de cortes a mano?', 'Sí, en papel cuadriculado, plancha por plancha.', '¿Puedo hacer el plano de cortes a mano? Claro. En papel cuadriculado, dibujas el faldón y cada plancha con su medida.'),
    ('¿Qué hago con los retazos?', 'Aprovecha los triángulos en la otra limatesa.', '¿Qué hago con los retazos? Usa los triángulos que sobran en la limatesa del frente, como viste en esta clase.'),
  ]),
  repaso([
    ('¿Hacia dónde van las planchas?', 'Del alero hacia arriba, perpendiculares al borde.'),
    ('¿Cómo pasas el lado largo de una plancha cortada a real?', 'Distancia a la esquina por el factor.'),
    ('¿Cuánto desperdicio en un cuatro aguas?', 'Como referencia, entre diez y quince por ciento.'),
    ('¿En qué sentido se colocan los caballetes?', 'De abajo hacia arriba.'),
  ]),
]

# ───────────── Clase 11 · Limahoyas y techos en L ─────────────
EXT['techo_c11'] = [
  respuesta('planchas 10 × 14 m', [
    'La respuesta del reto de la clase pasada: la casa de diez por catorce, con treinta por ciento. El factor es uno coma cero cuarenta y cuatro.',
    'A un metro de la esquina: uno cero cuatro. A dos: dos cero nueve. A tres: tres trece.',
    'Y la central del faldón triangular: cinco por uno coma cero cuarenta y cuatro, cinco metros veintidós.',
  ], ['Distancia a la esquina', 'Lado largo'], [['1 m', '1.04 m'], ['2 m', '2.09 m'], ['3 m', '3.13 m'], ['Central (5 m)', '5.22 m']], lambda i: [1, 1, 1, 2][i]),
  ejemplo('Regla rápida: <span class="nar">pendiente de la limahoya</span>', [
    'Un atajo: si los faldones tienen la misma pendiente, la limahoya siempre tiene esa pendiente dividida entre raíz de dos. Cerca del setenta por ciento.',
    'Faldones al veinticinco por ciento: limahoya al diecisiete coma siete. Al treinta: veintiuno coma dos. Al cuarenta: veintiocho coma tres.',
    'Con alas de ocho metros y treinta por ciento, la limahoya mide cinco setenta y ocho. Con alas de doce, ocho sesenta y siete.',
  ], ['Faldones', 'Limahoya (× 0.707)', 'Ala 8 m', 'Ala 12 m'],
    [['25 %', '17.7 %', '5.74 m', '8.62 m'], ['30 %', '21.2 %', '5.78 m', '8.67 m'], ['40 %', '28.3 %', '—', '—']],
    lambda i: [1, 2, 1][i], izq=300, der=300),
  caso('rebalsa en el rincón', [
    'Caso de obra: en una lluvia fuerte, el agua rebalsa por el canal de limahoya y gotea dentro de la casa, justo en el rincón.',
    'El canal era angosto, y además estaba lleno de hojas. Y la bajada estaba lejos del rincón.',
    'Canal ancho, limpieza antes de cada temporada de lluvias, y una bajada generosa justo en el rincón. Díselo al cliente en la entrega.',
  ], [('🌧️', 'Rebalsa <b class="nar">en el rincón</b>'), ('🍂', 'Canal <b class="nar">angosto y con hojas</b>; bajada lejos'), ('🧹', 'Canal ancho, <b class="nar">limpieza</b> y bajada en el rincón')]),
  *ejercicio(11,
    'Casa en L con alas de <b class="nar">6 m</b> de techo y <b class="nar">40 %</b> de pendiente.<br>Calcula el largo real de la limahoya y su pendiente.',
    ['Ahora tú. Una casa en L, con alas de seis metros de techo y cuarenta por ciento.', 'Calcula el largo real de la limahoya y su pendiente.'],
    'En planta: 3 × √2 = 4.24 m · Sube: 3 × 0.40 = 1.20 m<br>Real: √(4.24² + 1.20²) ≈ <b class="nar">4.41 m</b> · Pendiente: 40 × 0.707 ≈ <b class="nar">28 %</b>',
    ['En planta: tres por raíz de dos, cuatro veinticuatro. Sube tres por cero cuarenta: un metro veinte.',
     'Por Pitágoras: cuatro cuarenta y uno de largo real. Y su pendiente: cuarenta por cero setenta y uno, unos veintiocho por ciento.']),
  faq([
    ('¿Qué ancho de canal?', 'El que pida la ficha; mejor de más que de menos.', '¿Qué ancho de canal de limahoya? El que indique el fabricante, y si dudas, mejor de más que de menos.'),
    ('¿Perno en el centro del canal?', 'Nunca: solo en las alas.', '¿Puedo poner pernos en el centro del canal? Nunca. Se fija solo por las alas, lejos de donde corre el agua.'),
    ('¿Y si las alas tienen distinta pendiente?', 'La limahoya ya no va a 45°: se traza aparte.', '¿Y si las dos alas tienen distinta pendiente? La limahoya deja de ir a cuarenta y cinco grados y se traza aparte, igual que la limatesa.'),
  ]),
  repaso([
    ('¿Qué es una limahoya?', 'El rincón donde dos faldones se juntan y recogen el agua.'),
    ('¿Qué pendiente tiene, comparada con los faldones?', 'Menos: la de los faldones por cero coma setenta y uno.'),
    ('¿Dónde va la bajada?', 'Cerca del rincón de la limahoya.'),
    ('¿Por dónde se fija el canal?', 'Solo por las alas, nunca en el centro.'),
  ]),
]

# ───────────── Clase 12 · Aislamiento ─────────────
EXT['techo_c12'] = [
  respuesta('limahoya alas 10 m', [
    'La respuesta del reto de la clase pasada: casa en L con alas de diez metros y veinticinco por ciento.',
    'En planta, la limahoya mide cinco por raíz de dos: siete cero siete. Sube uno veinticinco. Largo real: siete metros dieciocho.',
    'Y su pendiente: veinticinco por cero setenta y uno, unos diecisiete coma siete por ciento.',
  ], ['Dato', 'Resultado'], [['En planta', '7.07 m'], ['Sube', '1.25 m'], ['Largo real', '7.18 m'], ['Pendiente', '≈ 17.7 %']], lambda i: [1, 1, 1, 2][i]),
  ejemplo('Manta para <span class="nar">el taller</span>', [
    'Calculemos la manta del taller. Su cobertura tiene ciento noventa y uno coma siete metros cuadrados.',
    'Con diez por ciento de traslapes: doscientos diez coma nueve metros cuadrados.',
    'Con rollos de cuarenta y ocho metros cuadrados: cuatro coma cuatro. Compras cinco rollos.',
  ], ['Paso', 'Resultado'], [['Área real del techo', '191.7 m²'], ['+ 10 % de traslapes', '210.9 m²'], ['÷ 48 m² por rollo', '4.4 → 5 rollos']], lambda i: i, izq=420, der=420),
  caso('la manta no aísla', [
    'Caso de obra: el cliente pagó por manta reflectiva, pero la casa sigue igual de caliente.',
    'La manta se pegó directo contra la plancha, sin espacio de aire. Así el calor pasa por contacto y la manta casi no hace nada.',
    'La cara brillante necesita mirar hacia un espacio de aire. Revisa la ficha y respeta ese espacio al instalar.',
  ], [('🔥', 'La casa <b class="nar">sigue caliente</b>'), ('🧲', 'Manta <b class="nar">pegada a la plancha</b>, sin aire'), ('🌬️', 'Cara brillante hacia un <b class="nar">espacio de aire</b>')]),
  *ejercicio(12,
    'Nave de <b class="nar">12 × 24 m</b> a dos aguas con <b class="nar">20 %</b>.<br>¿Cuántos rollos de manta de <b class="nar">48 m²</b>, con 10 % de traslapes?',
    ['Ahora tú. Una nave de doce por veinticuatro, a dos aguas, con veinte por ciento.', '¿Cuántos rollos de manta de cuarenta y ocho metros cuadrados, con diez por ciento de traslapes?'],
    '288 × 1.020 = 293.8 m² · + 10 % = 323.2 m²<br>323.2 ÷ 48 = 6.7 → <b class="nar">7 rollos</b>',
    ['En planta, doscientos ochenta y ocho. Por el factor uno coma cero veinte: doscientos noventa y tres coma ocho. Más diez por ciento: trescientos veintitrés.',
     'Entre cuarenta y ocho: seis coma siete. Compras siete rollos.']),
  faq([
    ('¿La manta evita la condensación?', 'Ayuda, junto con buena ventilación.', '¿La manta evita las gotas por condensación? Ayuda mucho, siempre junto con una buena ventilación.'),
    ('¿Panel o plancha con manta?', 'El panel aísla más; plancha con manta es más económica.', '¿Panel termoacústico, o plancha con manta? El panel aísla más y es más rápido de instalar. La plancha con manta es más económica.'),
    ('¿El cielo raso ayuda?', 'Sí: suma una cámara de aire y absorbe ruido.', '¿Un cielo raso ayuda? Sí. Suma otra cámara de aire, y con lana mineral encima, baja mucho el ruido de la lluvia.'),
  ]),
  repaso([
    ('¿Cómo funciona la manta reflectiva?', 'Refleja el calor hacia un espacio de aire.'),
    ('¿Qué ayuda más contra el ruido?', 'La masa y la absorción: lana mineral, cielo raso o panel.'),
    ('¿Cuánto sumas por traslapes?', 'Como referencia, un diez por ciento.'),
    ('¿Qué se combina con el aislante contra la condensación?', 'La ventilación.'),
  ]),
]



# ───────────── Segundo ejercicio por clase (para llegar a ≈7–8 min) ─────────────
_B = {
  1: ('Cochera a <b class="nar">una agua</b> de <b class="nar">4 m</b> de fondo con <b class="nar">15 %</b>.<br>¿Cuánto más alto queda el muro de atrás?',
      ['Uno más. Una cochera a una sola agua, de cuatro metros de fondo, con quince por ciento.', '¿Cuánto más alto queda el apoyo de atrás que el de adelante?'],
      '4 × 0.15 = <b class="nar">0.60 m</b> más alto',
      ['En una sola agua, el faldón cubre todo el fondo: cuatro metros.', 'Cuatro por cero quince: el apoyo de atrás queda sesenta centímetros más alto.']),
  2: ('Pones un nivel de <b class="nar">1 m</b> sobre un techo y sube <b class="nar">18 cm</b>.<br>¿Qué pendiente tiene, y cuántos grados, más o menos?',
      ['Otro, de obra. Pones un nivel de un metro sobre un techo existente, y mides que sube dieciocho centímetros.', '¿Qué pendiente tiene, y cuántos grados, más o menos?'],
      '18 cm en 1 m = <b class="nar">18 %</b><br>Entre 15 % (8.5°) y 20 % (11.3°): <b class="nar">≈ 10°</b>',
      ['Dieciocho centímetros en un metro: dieciocho por ciento.', 'En la tabla, queda entre quince por ciento, ocho coma cinco grados, y veinte, once coma tres. Unos diez grados.']),
  3: ('Un taller de <b class="nar">18 m</b> de largo, con tijerales a <b class="nar">4 m como máximo</b>.<br>¿Cuántos paños, de qué medida, y cuántos tijerales?',
      ['Uno más. Un taller de dieciocho metros de largo, con tijerales separados cuatro metros como máximo.', '¿Cuántos paños, de qué medida, y cuántos tijerales?'],
      '18 ÷ 4 = 4.5 → <b class="nar">5 paños</b> de <b class="nar">3.60 m</b><br>5 + 1 = <b class="nar">6 tijerales</b>',
      ['Dieciocho entre cuatro: cuatro coma cinco. Redondeas hacia arriba: cinco paños, de tres metros sesenta.', 'Y siempre un tijeral más que paños: seis tijerales.']),
  4: ('Tu losa mide solo <b class="nar">2.50 m</b> de ancho.<br>¿Qué medidas del 3-4-5 usas para levantar la perpendicular?',
      ['Otro, de taller. Tu losa mide solo dos metros y medio de ancho.', '¿Qué medidas del tres cuatro cinco usas para levantar la perpendicular?'],
      'El de 3-4-5 m no entra · El más grande que entra:<br><b class="nar">1.20 · 1.60 · 2.00 m</b> (escala × 0.4)',
      ['El de tres, cuatro y cinco metros no entra en la losa.', 'El más grande que sí entra: uno veinte, uno sesenta y dos metros.']),
  5: ('La casa: <b class="nar">4 tijerales</b> sobre viga collar, <b class="nar">2 apoyos</b> cada uno<br>y <b class="nar">2 pernos</b> por apoyo. ¿Cuántos pernos dejas antes del vaciado?',
      ['Uno más, con la casa. Cuatro tijerales sobre la viga collar, dos apoyos cada uno, y dos pernos por apoyo.', '¿Cuántos pernos hay que dejar antes del vaciado?'],
      '4 × 2 = 8 apoyos · 8 × 2 = <b class="nar">16 pernos</b><br>Ubicados según el plano, <b class="nar">antes</b> del vaciado',
      ['Cuatro tijerales por dos apoyos: ocho apoyos.', 'Por dos pernos: dieciséis pernos, en la posición del plano, antes de vaciar.']),
  6: ('La casa: techo de <b class="nar">9 × 13 m</b> con aleros en todo el contorno.<br>¿Cuántos metros de cenefa necesitas?',
      ['Otro. La casa tiene techo de nueve por trece, con aleros en todo el contorno.', '¿Cuántos metros de cenefa necesitas?'],
      'Perímetro: 2 × (9 + 13) = <b class="nar">44 m</b> de cenefa',
      ['La cenefa va en todo el borde del alero: el perímetro del techo.', 'Dos por nueve más trece: cuarenta y cuatro metros.']),
  7: ('Techo a cuatro aguas de <b class="nar">10 × 16 m</b> con <b class="nar">30 %</b>.<br>¿Cumbrera y largo real de la limatesa? Compáralo con el de 10 × 14.',
      ['Uno más. Techo a cuatro aguas de diez por dieciséis, con treinta por ciento.', 'Calcula la cumbrera y la limatesa, y compáralo con el de diez por catorce.'],
      'Cumbrera: 16 − 10 = <b class="nar">6 m</b> · Limatesa: <b class="nar">7.23 m</b><br>¡Igual que en 10 × 14! La limatesa depende <b class="nar">solo del ancho</b>',
      ['La cumbrera: dieciséis menos diez, seis metros.', 'Y la limatesa mide lo mismo que en el de diez por catorce: siete veintitrés. Depende solo del ancho y la pendiente, no del largo.']),
  8: ('El taller lleva <b class="nar">12 filas</b> de correas de <b class="nar">16.60 m</b>.<br>¿Cuántas barras de 6 m compras?',
      ['Otro, del taller. Doce filas de correas de dieciséis metros sesenta.', '¿Cuántas barras de seis metros compras?'],
      '12 × 16.60 = <b class="nar">199.2 m</b><br>199.2 ÷ 6 = 33.2 → <b class="nar">34 barras</b> + las de empalme',
      ['Doce por dieciséis sesenta: ciento noventa y nueve metros con veinte.', 'Entre seis: treinta y tres coma dos. Compras treinta y cuatro barras, más las que pidan los empalmes.']),
  9: ('Techo de <b class="nar">16.60 m</b> de largo. Plancha A: ancho útil <b class="nar">1.00 m</b>.<br>Plancha B: ancho útil <b class="nar">0.85 m</b>. ¿Cuántas por faldón con cada una?',
      ['Uno más, para leer la ficha. Un faldón de dieciséis metros sesenta de largo.', 'La primera plancha tiene un metro de ancho útil, y la segunda, ochenta y cinco centímetros. ¿Cuántas necesitas de cada una?'],
      'A: 16.60 ÷ 1.00 = 16.6 → <b class="nar">17 planchas</b><br>B: 16.60 ÷ 0.85 = 19.5 → <b class="nar">20 planchas</b>',
      ['Con la primera: dieciséis sesenta entre uno, diecisiete planchas.', 'Con la segunda: entre cero ochenta y cinco, diecinueve coma cinco: veinte planchas. Por eso se compara con el ancho útil, no con el total.']),
  10: ('Un cuatro aguas de <b class="nar">150 m²</b> de área real.<br>¿Cuánta plancha compras con <b class="nar">12 %</b> de desperdicio?',
      ['Otro. Un cuatro aguas con ciento cincuenta metros cuadrados de área real.', '¿Cuánta plancha compras, con doce por ciento de desperdicio?'],
      '150 × 1.12 = <b class="nar">168 m²</b> de plancha',
      ['Ciento cincuenta por uno coma doce.', 'Ciento sesenta y ocho metros cuadrados de plancha.']),
  11: ('La limahoya de <b class="nar">7.18 m</b> lleva <b class="nar">0.30 m</b> de traslape con la canaleta.<br>¿De qué largo pides el canal?',
      ['Uno más. La limahoya mide siete dieciocho, y el canal debe montar treinta centímetros sobre la canaleta.', '¿De qué largo pides el canal?'],
      '7.18 + 0.30 = 7.48 m → pídelo de <b class="nar">7.50 m</b>',
      ['Siete dieciocho más treinta centímetros: siete cuarenta y ocho.', 'Lo pides de siete metros y medio.']),
  12: ('La casa: <b class="nar">122 m²</b> de techo. Rollos de <b class="nar">60 m²</b>.<br>¿Cuántos rollos, con 10 % de traslapes?',
      ['Otro. La casa de ciento veintidós metros cuadrados, pero con rollos de sesenta metros cuadrados.', '¿Cuántos rollos, con diez por ciento de traslapes?'],
      '122 × 1.10 = 134.2 m² · 134.2 ÷ 60 = 2.24 → <b class="nar">3 rollos</b>',
      ['Ciento veintidós más diez por ciento: ciento treinta y cuatro coma dos.', 'Entre sesenta: dos coma veinticuatro. Compras tres rollos.']),
}
for _n, (_e, _fe, _r, _fr) in _B.items():
    _lst = EXT[f'techo_c{_n}']
    _i = next(k for k, e in enumerate(_lst) if 'Preguntas' in e['html'])
    _lst[_i:_i] = ejercicio(f'{_n}·B', _e, _fe, _r, _fr)
