"""Estructuras Metálicas · Clase 3: Conexiones empernadas — pernos, agujeros, distancias y apriete."""
from sold_comun import *
from est_c1 import ETAPAS_EST, OBRA

CURSO = 'ESTRUCTURAS METÁLICAS · CLASE 3'
E = []

def placa(en, x=300, y=250, esc=1.0):
    pts = [(140, 120), (290, 120), (140, 270), (290, 270)]
    return f'''<svg class="ap" data-en="{en}" style="position:absolute;left:{x}px;top:{y}px" width="{440*esc}" height="{420*esc}" viewBox="0 0 440 420">
 <rect x="60" y="40" width="310" height="320" rx="6" fill="#7d8f9f"/>
 {"".join(f'<circle cx="{px}" cy="{py}" r="22" fill="#0b2a45" stroke="#c9d6e3" stroke-width="4"/>' for px, py in pts)}
</svg>'''

E.append(dict(antes=0.5, frases=[
  'Llegaste a la obra con las vigas. Las subes, las acercas a la columna...',
  '...y los agujeros no coinciden. Alguien saca el soplete y los agranda "a ojo". La conexión queda débil, y fea.',
  'Hoy aprendes a hacer conexiones empernadas que calzan a la primera y aguantan. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Los agujeros', 'no coinciden', 3, 'CONEXIONES EMPERNADAS', soldando=False) + placa(0, 1150, 300)))

E.append(escena_obra(2, [
  'En nuestro mezanine, las vigas principales se unen a las columnas con pernos. Así se fabrican en el taller y se arman rápido en la obra.',
  'Hoy vemos qué perno usar, cómo hacer los agujeros, a qué distancia, y cómo ajustarlos.',
], 'Hoy: <span class="nar">pernos, agujeros y apriete</span>', ETAPAS_EST, OBRA))

E.append(dict(frases=[
  'No todos los pernos son iguales. El A trescientos siete es un perno común, de baja resistencia: sirve para elementos secundarios, como barandas o soportes livianos.',
  'El A trescientos veinticinco es el perno estructural de alta resistencia. Trae marcado "A325" en la cabeza. Es el que va en vigas y columnas.',
  'Y cuidado con el perno de ferretería "grado cinco": se parece, pero no es un perno estructural certificado. En una estructura que carga, pide A trescientos veinticinco, con su certificado.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('El <span class="nar">perno</span> correcto', top=110) + tabla(
  ['Perno', 'Resistencia', 'Úsalo en'], [['ASTM A307', 'Común', 'Barandas, soportes livianos'], ['ASTM A325', '<b style="color:#7ee08a">Alta</b> · cabeza marcada "A325"', 'Vigas, columnas, conexiones que cargan'],
  ['"Grado 5" de ferretería', 'Sin certificado estructural', '<b style="color:#ff6b6b">No en estructura</b>']], lambda i: i, top=280, izq=180, der=180, tam=31)))

E.append(dict(frases=[
  'El agujero estándar es el diámetro del perno más un dieciseisavo de pulgada, un milímetro y seis décimas.',
  'Para un perno de cinco octavos, el agujero es de once dieciseisavos: unos diecisiete y medio milímetros. Para tres cuartos, trece dieciseisavos: unos veinte punto seis.',
  'Y se hace con taladro. No con soplete. El soplete deja el agujero irregular, quema el borde y debilita la plancha.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El <span class="nar">agujero</span>', top=110) + tabla(
  ['Perno', 'Agujero estándar'], [['5/8" (15.9 mm)', '11/16" ≈ 17.5 mm'], ['3/4" (19.1 mm)', '13/16" ≈ 20.6 mm'], ['7/8" (22.2 mm)', '15/16" ≈ 23.8 mm']],
  lambda i: (1, 0.6 * i), top=270, izq=460, der=460, tam=34, nota='Agujero estándar = diámetro del perno + 1/16" (1.6 mm).') +
 badge('CON TALADRO · NUNCA CON SOPLETE', 2, 640, 640, '#ff6b6b', '!')))

E.append(dict(frases=[
  'Ahora, las distancias. Entre agujero y agujero, deja por lo menos tres veces el diámetro del perno.',
  'Y del agujero al borde de la plancha, como regla práctica, al menos una vez y media el diámetro. La tabla de la norma da el mínimo exacto para cada perno.',
  'Si los pones muy pegados o muy al borde, la plancha se rasga por ahí.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 40, 55)], html=titulo('Las <span class="nar">distancias</span>', top=110) + placa(0, 260, 240, 1.25) + f'''
<svg class="ap" data-en="0" style="position:absolute;left:260px;top:240px" width="550" height="525" viewBox="0 0 440 420">
 <line x1="140" y1="85" x2="290" y2="85" stroke="#ffd166" stroke-width="5"/><text x="215" y="75" fill="#ffd166" font-size="22" font-weight="900" text-anchor="middle">≥ 3 d</text></svg>
<svg class="ap" data-en="1" style="position:absolute;left:260px;top:240px" width="550" height="525" viewBox="0 0 440 420">
 <line x1="60" y1="300" x2="140" y2="300" stroke="#5cc8ff" stroke-width="5"/><text x="100" y="330" fill="#5cc8ff" font-size="22" font-weight="900" text-anchor="middle">≥ 1.5 d</text></svg>
<div style="position:absolute;left:900px;right:150px;top:300px">
 <div class="tarjeta ap" data-en="0" style="font-size:31px;margin:14px 0">↔️ Entre agujeros: <b class="nar">≥ 3 × diámetro</b></div>
 <div class="tarjeta ap" data-en="1" style="font-size:31px;margin:14px 0">⇤ Al borde: <b class="nar">≈ 1.5 × diámetro</b> (mínimo según tabla de la norma)</div>
 <div class="tarjeta ap" data-en="2" style="font-size:31px;margin:14px 0;border-color:#ff6b6b">❌ Muy pegados o al borde: la plancha se rasga</div>
</div>'''))

E.append(dict(frases=[
  'El apriete. La mayoría de conexiones se ajustan "a tope": con la llave normal, con la fuerza completa de un trabajador, hasta que las planchas quedan pegadas, sin luz.',
  'Algunas conexiones, las que indique el plano, van pretensadas. Un método sencillo es el giro de tuerca: después de ajustar a tope, marcas la tuerca y le das un tercio de vuelta más, en pernos de largo hasta cuatro diámetros.',
  'Siempre con arandela del lado que gira. Y la punta del perno debe quedar por lo menos al ras de la tuerca, o sobresaliendo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('El <span class="nar">apriete</span>', top=110) + tarjetas([
  ('🔧', 'A tope', 'Llave normal, fuerza completa · planchas pegadas, sin luz'), ('↻', 'Pretensado', 'Si el plano lo pide · giro de tuerca: +⅓ de vuelta'), ('⭕', 'Arandela y rosca', 'Arandela del lado que gira · punta al ras o afuera')],
  lambda i: i, top=290, cols=3, alto=330, izq=200)))

E.append(dict(frases=[
  'Ejemplo: la unión de la viga W ocho a la columna del mezanine. Una plancha soldada a la columna, con cuatro pernos A trescientos veinticinco de cinco octavos.',
  'Agujeros de once dieciseisavos, unos diecisiete y medio milímetros. Entre agujeros, tres diámetros serían cuarenta y ocho milímetros: usamos setenta y cinco, para que entre la llave cómoda.',
  'Al borde, una vez y media serían veinticuatro: dejamos treinta y cinco. Y lo más importante: los agujeros de la viga y de la plancha se marcan con la misma plantilla. Así calzan a la primera.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">viga – columna</span>', top=110) + lista([
  ('🔩', '4 pernos <b>A325 de 5/8"</b>'), ('⭕', 'Agujeros <b>11/16" ≈ 17.5 mm</b>'), ('↔️', 'Entre agujeros: mín. 48 mm → usamos <b class="nar">75 mm</b>'),
  ('⇤', 'Al borde: mín. ≈ 24 mm → dejamos <b class="nar">35 mm</b>'), ('📐', 'Misma <b>plantilla</b> para viga y plancha')], lambda i: [0, 1, 1, 2, 2][i], top=250, izq=330, der=330, tam=31)))

E.append(dict(frases=[
  'Los cinco errores con pernos.',
  'Uno: usar pernos de ferretería sin grado en una estructura que carga.',
  'Dos: hacer o agrandar agujeros con soplete.',
  'Tres: agujeros muy pegados o muy al borde.',
  'Cuatro: sin arandela, o con la rosca tan corta que no llega a la tuerca.',
  'Y cinco: marcar los agujeros pieza por pieza, sin plantilla. Así es como no coinciden en la obra.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con pernos</span>', [
  ('Perno sin grado', 'No está certificado para cargar.'), ('Agujeros con soplete', 'Borde quemado e irregular.'), ('Distancias mínimas', 'La plancha se rasga.'),
  ('Sin arandela o rosca corta', 'La tuerca no agarra bien.'), ('Sin plantilla', 'No coinciden en la obra.')])))

E.append(dict(frases=[
  'Tu reto: diseña en un papel una plancha de conexión con cuatro pernos de tres cuartos. Pon el diámetro del agujero, la distancia entre agujeros y al borde.',
  'En la próxima clase: el entrepiso. Viguetas, tablero o placa colaborante, y la baranda del mezanine.',
], html=reto('✏️ Dibuja una plancha con 4 pernos de 3/4":<br><b class="nar">agujero · distancia entre agujeros · al borde</b>', 'EL ENTREPISO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: una conexión bien hecha en el taller, se arma en minutos en la obra.',
  '¡Nos vemos en la clase cuatro!',
], html=final('Agujeros con plantilla, <span class="nar">calzan a la primera</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'est_c3')
