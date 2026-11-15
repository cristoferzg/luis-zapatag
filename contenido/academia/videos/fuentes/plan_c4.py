"""Lectura de Planos Metálicos · Clase 4: Simbología de soldadura AWS A2.4."""
from sold_comun import *
from plan_c1 import ETAPAS_PLAN, OBRA

CURSO = 'LECTURA DE PLANOS · CLASE 4'
E = []
W = '#ffffff'; Y = '#ffd166'; O = '#f97316'; B = '#5cc8ff'

def simbolo(en, x, y, arriba='', abajo='', izq='', der='', todo=False, campo=False, cola='', esc=1.0, mas=0, resalta=None):
    s = f'<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="{1000*esc}" height="{420*esc}" viewBox="0 0 1000 420">'
    s += f'<line x1="200" y1="210" x2="760" y2="210" stroke="{W}" stroke-width="6"/><line x1="200" y1="210" x2="80" y2="360" stroke="{W}" stroke-width="6"/><polygon points="80,360 86,326 108,344" fill="{W}"/>'
    if abajo: s += abajo
    if arriba: s += arriba
    if izq: s += f'<text x="{"360" if abajo else "360"}" y="{262 if abajo else 190}" fill="{Y}" font-size="44" font-weight="900" text-anchor="end">{izq}</text>'
    if der: s += f'<text x="520" y="{262 if abajo else 190}" fill="{B}" font-size="40" font-weight="900">{der}</text>'
    if todo: s += f'<circle cx="200" cy="210" r="24" fill="none" stroke="{O}" stroke-width="6"/>'
    if campo: s += f'<line x1="200" y1="210" x2="200" y2="110" stroke="{O}" stroke-width="6"/><polygon points="200,110 270,130 200,150" fill="{O}"/>'
    if cola: s += f'<line x1="760" y1="210" x2="810" y2="170" stroke="{W}" stroke-width="6"/><line x1="760" y1="210" x2="810" y2="250" stroke="{W}" stroke-width="6"/><text x="820" y="222" fill="#7ee08a" font-size="34" font-weight="900">{cola}</text>'
    return s + '</svg>'

FIL_ABAJO = f'<polygon points="380,210 380,270 440,210" fill="none" stroke="{O}" stroke-width="6"/>'
FIL_ARRIBA = f'<polygon points="380,210 380,150 440,210" fill="none" stroke="{O}" stroke-width="6"/>'
V_ABAJO = f'<polyline points="370,210 410,270 450,210" fill="none" stroke="{O}" stroke-width="6"/>'

E.append(dict(antes=0.5, frases=[
  'El plano tenía un triangulito y una banderita junto a la flecha...',
  '...y nadie le hizo caso. El cordón que era para soldar en obra se soldó en el taller, y la viga ya no se pudo montar.',
  'Hoy aprendes a leer los símbolos de soldadura de la norma AWS, que dicen qué cordón, de qué tamaño, de qué lado y dónde. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('El triangulito', 'y la bandera', 4, 'SOLDADURA AWS', soldando=False) +
 simbolo(0, 1000, 330, abajo=FIL_ABAJO, izq='5', campo=True, esc=0.85)))

E.append(escena_obra(3, [
  'En los planos de nuestro mezanine, cada conexión soldada tiene su símbolo. La norma que los define es la AWS A dos punto cuatro.',
  'Si lo sabes leer, sabes exactamente qué soldar. Si no, adivinas.',
], 'Hoy: <span class="nar">símbolos de soldadura AWS A2.4</span>', ETAPAS_PLAN, OBRA))

E.append(dict(frases=[
  'El símbolo tiene tres partes básicas. La flecha: apunta a la junta que se suelda.',
  'La línea de referencia: la línea horizontal, donde se escribe todo.',
  'Y el símbolo del cordón: por ejemplo, un triángulo es un filete.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Las partes <span class="nar">del símbolo</span>', top=100) + simbolo(0, 470, 200, abajo=FIL_ABAJO) + lista([
  ('↙️', '<b>Flecha</b>: señala la junta'), ('➖', '<b>Línea de referencia</b>: ahí se escribe todo'), ('◺', '<b>Símbolo</b>: triángulo = filete')],
  lambda i: i, top=600, izq=420, der=420, tam=27)))

E.append(dict(frases=[
  'La regla más importante. Si el símbolo está debajo de la línea, se suelda del lado al que apunta la flecha.',
  'Si está encima de la línea, se suelda del otro lado de la junta.',
  'Y si está arriba y abajo, se suelda de los dos lados.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿De qué <span class="nar">lado</span>?', top=100) +
 simbolo(0, 40, 250, abajo=FIL_ABAJO, esc=0.62) + simbolo(1, 650, 250, arriba=FIL_ARRIBA, esc=0.62) + simbolo(2, 1260, 250, abajo=FIL_ABAJO, arriba=FIL_ARRIBA, esc=0.62) +
 '<div style="position:absolute;left:40px;right:40px;top:560px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;text-align:center">' + ''.join(
  f'<div class="tarjeta ap" data-en="{i}" style="font-size:28px;font-weight:900">{t}</div>' for i, t in enumerate(['Abajo: <span class="nar">lado de la flecha</span>', 'Arriba: <span style="color:#5cc8ff">el otro lado</span>', 'Arriba y abajo: <span style="color:#7ee08a">ambos lados</span>'])) + '</div>'))

E.append(dict(frases=[
  'Los números. A la izquierda del símbolo va el tamaño: un cinco junto al triángulo es un filete de cinco milímetros.',
  'A la derecha van el largo y el paso, si el cordón es intermitente. Cincuenta guion ciento cincuenta: cordones de cincuenta milímetros, cada ciento cincuenta, de centro a centro.',
  'Si no hay números a la derecha, el cordón va corrido, en todo el largo de la junta.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 50)], html=titulo('Tamaño, largo <span class="nar">y paso</span>', top=100) + simbolo(0, 470, 190, abajo=FIL_ABAJO, izq='5', der='50-150') + lista([
  ('◺', '<b class="nar">5</b> = filete de 5 mm'), ('⋯', '<b style="color:#5cc8ff">50-150</b> = 50 mm cada 150 mm'), ('➖', 'Sin números a la derecha = <b>corrido</b>')],
  lambda i: i, top=600, izq=420, der=420, tam=27)))

E.append(dict(frases=[
  'Tres señales más. Un círculo en el quiebre de la flecha: soldar todo alrededor, por ejemplo, el contorno completo de una columna sobre su placa.',
  'Una bandera: soldadura de campo. Se hace en la obra, no en el taller. Es justo lo que nadie vio en el ejemplo del inicio.',
  'Y la cola, la horquilla al final de la línea: ahí va el proceso o la especificación. Por ejemplo, SMAW, o el electrodo siete cero dieciocho.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Círculo, bandera <span class="nar">y cola</span>', top=100) + simbolo(0, 470, 190, abajo=FIL_ABAJO, izq='5', todo=True, campo=True, cola='E7018') + lista([
  ('⭕', '<b>Círculo</b>: todo alrededor'), ('🚩', '<b>Bandera</b>: se suelda en obra'), ('🔱', '<b>Cola</b>: proceso o electrodo')],
  lambda i: i, top=600, izq=420, der=420, tam=27)))

E.append(dict(frases=[
  'Y los biseles. Una V debajo de la línea: soldadura de ranura con bisel en V, del lado de la flecha.',
  'Junto a la V verás el ángulo, por ejemplo sesenta grados, y la abertura de raíz.',
  'Es la junta a tope con penetración completa que vimos en el curso de soldadura. El símbolo te dice exactamente cómo preparar los bordes.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El símbolo <span class="nar">del bisel</span>', top=100) + simbolo(0, 470, 190, abajo=V_ABAJO + f'<text x="410" y="320" fill="{Y}" font-size="36" font-weight="900" text-anchor="middle">60°</text><text x="410" y="200" fill="{B}" font-size="34" font-weight="900" text-anchor="middle">2</text>') + lista([
  ('V', '<b>V</b> = ranura con bisel en V'), ('∠', '<b class="nar">60°</b> = ángulo del bisel'), ('↔️', '<b style="color:#5cc8ff">2</b> = abertura de raíz (mm)')],
  lambda i: i, top=600, izq=420, der=420, tam=27)))

E.append(dict(frases=[
  'Los cinco errores con los símbolos.',
  'Uno: confundir el lado de la flecha con el otro lado.',
  'Dos: ignorar la bandera, y soldar en el taller lo que era de obra.',
  'Tres: ignorar el círculo, y dejar un lado sin soldar.',
  'Cuatro: soldar corrido un cordón que era intermitente. Más electrodo, más calor, más deformación.',
  'Y cinco: no leer la cola, y usar otro electrodo.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con los símbolos</span>', [
  ('Lado equivocado', 'Abajo = lado de la flecha.'), ('Ignorar la bandera', 'La pieza ya no se monta.'), ('Ignorar el círculo', 'Falta soldar un lado.'),
  ('Corrido en vez de intermitente', 'Más costo y deformación.'), ('Sin leer la cola', 'Otro electrodo u otro proceso.')])))

E.append(dict(frases=[
  'Tu reto: dibuja en un papel el símbolo para un filete de seis milímetros, de los dos lados, todo alrededor, soldado en obra, con electrodo siete cero dieciocho. Mándanos la foto.',
  'En la próxima clase: las notas generales y las especificaciones. Lo que casi nadie lee, y lo que más cuesta ignorar.',
], html=reto('✏️ Dibuja el símbolo: filete 6 mm, ambos lados,<br><b class="nar">todo alrededor · en obra · E7018</b>', 'NOTAS Y ESPECIFICACIONES')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el símbolo te dice qué, cuánto, de qué lado y dónde. Léelo antes de prender el arco.',
  '¡Nos vemos en la clase cinco!',
], html=final('Lee el símbolo <span class="nar">antes de soldar</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'plan_c4')
