"""Estructuras Metálicas · Clase 8: Tijerales planos — salvar luces grandes sin columnas."""
from sold_comun import *

CURSO = 'ESTRUCTURAS METÁLICAS · CLASE 8'
ETAPAS_EST_AV = ['Tijerales', 'Arriostres y viento', 'Refuerzos', 'Calidad y documentos']
E = []

def tijeral(en, x, y, tipo='pratt', w=1200, h=200, n=8, mas=0, resalta=None):
    s = f'<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="{w+40}" height="{h+60}" viewBox="0 0 {w+40} {h+60}">'
    p = w / n; x0 = 20; yt = 20; yb = 20 + h
    c = lambda k: '#ffd166' if resalta == k else '#9aa6b0'
    s += f'<line x1="{x0}" y1="{yt}" x2="{x0+w}" y2="{yt}" stroke="{c("sup")}" stroke-width="10"/><line x1="{x0}" y1="{yb}" x2="{x0+w}" y2="{yb}" stroke="{c("inf")}" stroke-width="10"/>'
    for i in range(n + 1):
        xx = x0 + i * p
        if tipo != 'warren' or i in (0, n):
            s += f'<line x1="{xx}" y1="{yt}" x2="{xx}" y2="{yb}" stroke="{c("mon")}" stroke-width="6"/>'
    for i in range(n):
        xa = x0 + i * p; xb = xa + p
        if tipo == 'pratt':
            s += (f'<line x1="{xa}" y1="{yt}" x2="{xb}" y2="{yb}" stroke="{c("dia")}" stroke-width="6"/>' if i < n / 2 else f'<line x1="{xa}" y1="{yb}" x2="{xb}" y2="{yt}" stroke="{c("dia")}" stroke-width="6"/>')
        elif tipo == 'howe':
            s += (f'<line x1="{xa}" y1="{yb}" x2="{xb}" y2="{yt}" stroke="{c("dia")}" stroke-width="6"/>' if i < n / 2 else f'<line x1="{xa}" y1="{yt}" x2="{xb}" y2="{yb}" stroke="{c("dia")}" stroke-width="6"/>')
        else:
            s += (f'<line x1="{xa}" y1="{yb}" x2="{xb}" y2="{yt}" stroke="{c("dia")}" stroke-width="6"/>' if i % 2 == 0 else f'<line x1="{xa}" y1="{yt}" x2="{xb}" y2="{yb}" stroke="{c("dia")}" stroke-width="6"/>')
    return s + '</svg>'

E.append(dict(antes=0.5, frases=[
  'El cliente quiere techar su taller de doce metros de ancho...',
  '...pero sin ninguna columna al medio, porque ahí maniobran los carros. Una viga común de doce metros sería enorme y pesadísima.',
  'La solución: el tijeral. Hoy aprendes a entenderlo y a fabricarlo bien. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('12 metros', 'sin columnas', 8, 'TIJERALES', soldando=False) + tijeral(0, 1000, 340, w=780, h=150, n=6)))

E.append(escena_obra(0, [
  'Terminamos el mezanine. Ahora empieza el módulo avanzado de estructuras: lo que vas a encontrar en obras más grandes.',
  'Hoy: los tijerales planos, para salvar luces grandes con poco acero.',
], 'Hoy: <span class="nar">tijerales planos</span>', ETAPAS_EST_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'Un tijeral es una viga hecha de barras que forman triángulos. El triángulo es la única figura que no se deforma si sus lados no cambian de largo.',
  'Sus partes tienen los mismos nombres que en el módulo de techos de InnovApp: cordón superior, cordón inferior,',
  'montantes, las barras verticales,',
  'y diagonales, las inclinadas. Cada barra trabaja solo estirada o apretada, y por eso un tijeral pesa mucho menos que una viga maciza.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Las partes <span class="nar">del tijeral</span>', top=110) + tijeral(0, 340, 300, w=1200, h=260, n=8, resalta=None) +
 tijeral(1, 340, 300, w=1200, h=260, n=8, resalta='sup') + tijeral(2, 340, 300, w=1200, h=260, n=8, resalta='mon') + tijeral(3, 340, 300, w=1200, h=260, n=8, resalta='dia')))

E.append(dict(frases=[
  'Hay tres tipos muy usados. El Pratt: las diagonales bajan hacia el centro. Con carga de arriba, las diagonales trabajan estiradas, y los montantes, apretados.',
  'El Howe: al revés, las diagonales suben hacia el centro. Trabajan apretadas.',
  'Y el Warren: sin montantes, con diagonales alternadas en zigzag. Muy usado por ser simple y liviano.',
  'Como las barras apretadas pueden pandearse, conviene que las largas, las diagonales, trabajen estiradas. Por eso el Pratt es tan común en acero.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Pratt, Howe <span class="nar">y Warren</span>', top=100) +
 tijeral(0, 350, 220, 'pratt', w=900, h=150, n=8) + '<div class="ap" data-en="0" style="position:absolute;left:1300px;top:270px;font-size:32px;font-weight:900">Pratt</div>' +
 tijeral(1, 350, 440, 'howe', w=900, h=150, n=8) + '<div class="ap" data-en="1" style="position:absolute;left:1300px;top:490px;font-size:32px;font-weight:900">Howe</div>' +
 tijeral(2, 350, 660, 'warren', w=900, h=150, n=8) + '<div class="ap" data-en="2" style="position:absolute;left:1300px;top:710px;font-size:32px;font-weight:900">Warren</div>'))

E.append(dict(frases=[
  'El peralte, la altura del tijeral. Una regla para empezar: entre la luz entre diez y la luz entre quince.',
  'Para doce metros: entre ochenta centímetros y un metro veinte. Un tijeral muy bajo necesita barras mucho más pesadas.',
  'Y el ángulo de las diagonales: entre unos treinta y sesenta grados. Muy acostadas o muy paradas, trabajan mal y los nudos se complican.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El <span class="nar">peralte</span>', top=110) + tabla(
  ['Regla', 'Para 12 m'], [['Peralte ≈ L/10 a L/15', '0.80 a 1.20 m'], ['Ángulo de diagonales', '≈ 30° a 60°']],
  lambda i: i, top=290, izq=420, der=420, tam=36, nota='Reglas para predimensionar. Las barras y conexiones las verifica el ingeniero.')))

E.append(dict(frases=[
  'La regla de oro de la fabricación: en cada nudo, los ejes de todas las barras se cruzan en un solo punto.',
  'Si una diagonal llega corrida, aparece una palanca que dobla el cordón, y el tijeral trabaja peor de lo calculado.',
  'Y las correas del techo deben apoyarse sobre los nudos del cordón superior, no entre nudos. Una correa entre nudos dobla el cordón como una viga.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Los <span class="nar">nudos</span>', top=110) + '''
<svg style="position:absolute;left:420px;top:270px" width="1080" height="420" viewBox="0 0 1080 420">
 <g class="ap" data-en="0"><line x1="40" y1="300" x2="480" y2="300" stroke="#9aa6b0" stroke-width="14"/><line x1="260" y1="300" x2="260" y2="60" stroke="#9aa6b0" stroke-width="10"/><line x1="260" y1="300" x2="80" y2="80" stroke="#9aa6b0" stroke-width="10"/>
  <circle cx="260" cy="300" r="16" fill="#7ee08a"/><text x="260" y="370" fill="#7ee08a" font-size="28" font-weight="900" text-anchor="middle">ejes en un punto ✓</text></g>
 <g class="ap" data-en="1"><line x1="600" y1="300" x2="1040" y2="300" stroke="#9aa6b0" stroke-width="14"/><line x1="820" y1="300" x2="820" y2="60" stroke="#9aa6b0" stroke-width="10"/><line x1="760" y1="300" x2="620" y2="80" stroke="#ff6b6b" stroke-width="10"/>
  <text x="820" y="370" fill="#ff6b6b" font-size="28" font-weight="900" text-anchor="middle">diagonal corrida ✕</text></g>
</svg>''' + badge('CORREAS SOBRE LOS NUDOS', 2, 720, 720, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Ejemplo: un tijeral Pratt de doce metros, con un metro de peralte y ocho paneles de uno punto cinco metros.',
  'Cordón superior e inferior: doce metros cada uno. Nueve montantes de un metro: nueve metros.',
  'Ocho diagonales: cada una mide la raíz de uno punto cinco al cuadrado más uno al cuadrado, uno punto ochenta metros. Catorce punto cuatro metros en total.',
  'Unos cuarenta y siete metros de perfil por tijeral. Con el peso por metro del perfil que verifique el ingeniero, tienes su peso, y lo multiplicas por el número de tijerales.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">tijeral de 12 m</span>', top=100) + tabla(
  ['Barra', 'Cálculo', 'Metros'], [['Cordón superior', '12.00', '12.0'], ['Cordón inferior', '12.00', '12.0'], ['Montantes', '9 × 1.00', '9.0'], ['Diagonales', '8 × √(1.5² + 1²) = 8 × 1.80', '14.4'], ['<b class="nar">Total</b>', '', '<b class="nar">≈ 47.4 m</b>']],
  lambda i: [1, 1, 1, 2, 3][i], top=240, izq=300, der=300, tam=31)))

E.append(dict(frases=[
  'Y un detalle que se olvida mucho: el cordón superior va apretado, y si es largo, se puede pandear de costado.',
  'Lo sujetan las correas y los arriostres del techo. Sin ellos, el tijeral se tuerce de lado aunque esté bien calculado.',
  'Lo vemos a fondo en la próxima clase.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El cordón superior <span class="nar">se pandea de lado</span>', top=110) + tarjetas([
  ('↔️', 'Cordón superior apretado', 'Si es largo, se pandea de costado'), ('🔗', 'Lo sujetan', 'Las correas y los arriostres'), ('➡️', 'Próxima clase', 'Arriostres y viento')],
  lambda i: i, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Los cinco errores con tijerales.',
  'Uno: peralte muy bajo, que obliga a barras pesadas.',
  'Dos: ejes que no se cruzan en el nudo.',
  'Tres: correas apoyadas entre nudos.',
  'Cuatro: armar un Pratt con las diagonales al revés.',
  'Y cinco: montar tijerales sin arriostrar el cordón superior.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con tijerales</span>', [
  ('Peralte bajo', 'Barras más pesadas.'), ('Ejes corridos', 'Palancas que doblan el cordón.'), ('Correas entre nudos', 'Doblan el cordón superior.'),
  ('Pratt al revés', 'Diagonales apretadas que se pandean.'), ('Sin arriostrar', 'Se tuerce de lado.')])))

E.append(dict(frases=[
  'Tu reto: calcula los metros de perfil de un tijeral Pratt de diez metros, con ochenta centímetros de peralte y ocho paneles.',
  'En la próxima clase: arriostres y viento. Cómo se mantiene en pie una estructura cuando el viento empuja.',
], html=reto('🧮 Tijeral Pratt de 10 m, peralte 0.80 m, 8 paneles:<br><b class="nar">metros de cordones, montantes y diagonales</b>', 'ARRIOSTRES Y VIENTO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: triángulos, ejes en un punto, y correas sobre los nudos.',
  '¡Nos vemos en la clase nueve!',
], html=final('Triángulos que <span class="nar">salvan luces</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'est_c8')
