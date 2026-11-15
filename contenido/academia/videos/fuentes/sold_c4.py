"""Soldadura Estructural · Clase 4: Juntas y biseles — prepara bien y el cordón aguanta."""
from sold_comun import *

CURSO = 'SOLDADURA ESTRUCTURAL · CLASE 4'
E = []
P = '#7d8f9f'; S = '#f97316'

def svg(cont, w=300, h=220):
    return f'<svg width="{w}" height="{h}" viewBox="0 0 300 220">{cont}</svg>'

JUNTAS = {
    'A tope': svg(f'<rect x="20" y="110" width="125" height="40" fill="{P}"/><rect x="155" y="110" width="125" height="40" fill="{P}"/><path d="M140 110 Q150 90 160 110 Z" fill="{S}"/>'),
    'En T': svg(f'<rect x="20" y="150" width="260" height="36" fill="{P}"/><rect x="132" y="30" width="36" height="120" fill="{P}"/><polygon points="132,150 132,118 100,150" fill="{S}"/><polygon points="168,150 168,118 200,150" fill="{S}"/>'),
    'En esquina': svg(f'<rect x="60" y="150" width="200" height="36" fill="{P}"/><rect x="60" y="30" width="36" height="120" fill="{P}"/><polygon points="96,150 96,118 128,150" fill="{S}"/>'),
    'Traslape': svg(f'<rect x="20" y="140" width="190" height="34" fill="{P}"/><rect x="110" y="106" width="170" height="34" fill="{P}"/><polygon points="110,140 110,106 78,140" fill="{S}"/>'),
    'De borde': svg(f'<rect x="100" y="40" width="40" height="150" fill="{P}"/><rect x="160" y="40" width="40" height="150" fill="{P}"/><path d="M100 40 Q150 0 200 40 Z" fill="{S}"/>'),
}

E.append(dict(antes=0.5, frases=[
  'Un cordón precioso. Parejo, brillante...',
  '...y se partió en dos con el primer golpe. Por dentro, el metal nunca se fundió con la plancha. La junta estaba mal preparada.',
  'Hoy aprendes a preparar juntas y biseles para que tu soldadura aguante de verdad.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Bonito por fuera,', 'vacío por dentro', 4, 'JUNTAS Y BISELES')))

E.append(escena_obra(3, [
  'En el almacén ya tenemos electrodos y la máquina regulada.',
  'Ahora, antes de soldar el primer arco, preparamos las uniones. Es la parte que nadie ve, y la que más importa.',
], 'Hoy: <span class="nar">juntas, filetes y biseles</span>'))

E.append(dict(frases=[
  'Hay cinco juntas básicas. A tope: dos piezas, una al lado de la otra.',
  'En T: una pieza parada sobre otra, como la columna sobre su placa base.',
  'En esquina: dos piezas que forman un ángulo, como el marco de una puerta.',
  'Traslape: una pieza encima de la otra.',
  'Y de borde: dos piezas paralelas, soldadas por la orilla. Esta casi no se usa en estructuras.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Las 5 <span class="nar">juntas básicas</span>', top=110) +
 '<div style="position:absolute;left:80px;right:80px;top:300px;display:grid;grid-template-columns:repeat(5,1fr);gap:18px">' + ''.join(
  f'<div class="tarjeta pop" data-en="{i}" style="text-align:center;padding:18px 8px">{s}<div style="font-size:30px;font-weight:900;margin-top:6px">{n}</div></div>'
  for i, (n, s) in enumerate(JUNTAS.items())) + '</div>'))

E.append(dict(frases=[
  'Y hay dos formas de soldarlas. La soldadura de filete: el cordón va en la esquina, con forma de triángulo. Es la más común en estructuras.',
  'Su tamaño se mide por el cateto, la pierna del triángulo. Un filete de cinco milímetros tiene cinco milímetros de cada lado.',
  'La otra es la soldadura de ranura: se corta un bisel en el borde de la pieza, para que la soldadura entre en todo el espesor. Se llama penetración completa.',
], zoom=[(0, 1.0, 50, 50), (1, 1.08, 30, 55), (2, 1.06, 72, 55)], html=titulo('Filete o <span class="nar">ranura</span>', top=110) + f'''
<div class="tarjeta ap" data-en="0" style="position:absolute;left:150px;top:260px;width:760px;text-align:center">
 <svg width="560" height="360" viewBox="0 0 560 360"><rect x="40" y="250" width="480" height="60" fill="{P}"/><rect x="250" y="40" width="60" height="210" fill="{P}"/>
 <polygon points="250,250 250,170 170,250" fill="{S}"/>
 <g class="ap" data-en="1"><line x1="170" y1="275" x2="250" y2="275" stroke="#ffd166" stroke-width="5"/><line x1="225" y1="170" x2="225" y2="250" stroke="#ffd166" stroke-width="5"/>
 <text x="210" y="300" fill="#ffd166" font-size="28" font-weight="900" text-anchor="middle">cateto</text></g></svg>
 <div style="font-size:34px;font-weight:900">Filete</div></div>
<div class="tarjeta ap" data-en="2" style="position:absolute;left:1010px;top:260px;width:760px;text-align:center">
 <svg width="560" height="360" viewBox="0 0 560 360"><polygon points="40,160 250,160 250,240 220,300 40,300" fill="{P}"/><polygon points="310,160 520,160 520,300 340,300 310,240" fill="{P}"/>
 <polygon points="250,160 310,160 310,240 340,300 220,300 250,240" fill="{S}" opacity=".95"/></svg>
 <div style="font-size:34px;font-weight:900">Ranura con bisel</div></div>'''))

filas = [['Hasta 6 mm', '3 mm'], ['Más de 6 a 12 mm', '5 mm'], ['Más de 12 a 20 mm', '6 mm'], ['Más de 20 mm', '8 mm']]
E.append(dict(frases=[
  '¿De qué tamaño el filete? Primero manda el plano. Si el plano no lo dice, usa por lo menos el mínimo de la norma AWS D uno punto uno.',
  'Con electrodo de bajo hidrógeno, como el siete cero dieciocho, el mínimo depende del espesor de la pieza más delgada.',
  'Hasta seis milímetros: filete de tres. De seis a doce: cinco. De doce a veinte: seis. Y más de veinte: ocho milímetros.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('Tamaño mínimo <span class="nar">del filete</span>', top=110) + tabla(
  ['Pieza más delgada', 'Filete mínimo'], filas, lambda i: (2, 0.7 * i), top=290, izq=470, der=470, tam=36,
  nota='AWS D1.1 · con electrodo de bajo hidrógeno (E7018). Si el plano pide más, manda el plano.') + badge('PRIMERO MANDA EL PLANO', 0, 700, 200, '#3f9e5a', '1', mas=3)))

E.append(dict(frases=[
  'Y un secreto que te ahorra plata: no sobresuldes.',
  'El peso de un filete crece con el cuadrado del tamaño. Un filete de cinco milímetros deposita como cien gramos por metro.',
  'Uno de diez, que es el doble de grande, deposita unos cuatrocientos gramos. Cuatro veces más electrodo, más tiempo, más calor, y la pieza se deforma más.',
  'Haz el filete que pide el plano. Ni menos, ni "por si acaso" el doble.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('No <span class="nar">sobresuldes</span>', top=110) + f'''
<div style="position:absolute;left:300px;right:300px;top:280px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
 <div class="tarjeta ap" data-en="1" style="text-align:center"><svg width="240" height="200" viewBox="0 0 240 200"><polygon points="60,180 60,130 110,180" fill="{S}"/><rect x="20" y="180" width="200" height="14" fill="{P}"/><rect x="46" y="20" width="14" height="160" fill="{P}"/></svg>
  <div style="font-size:34px;font-weight:900">Filete 5 mm</div><div style="font-size:54px;font-weight:900;color:#7ee08a">≈ 0.1 kg/m</div></div>
 <div class="tarjeta ap" data-en="2" style="text-align:center;border-color:#ff6b6b"><svg width="240" height="200" viewBox="0 0 240 200"><polygon points="60,180 60,80 160,180" fill="{S}"/><rect x="20" y="180" width="200" height="14" fill="{P}"/><rect x="46" y="20" width="14" height="160" fill="{P}"/></svg>
  <div style="font-size:34px;font-weight:900">Filete 10 mm</div><div style="font-size:54px;font-weight:900;color:#ff6b6b">≈ 0.4 kg/m</div></div>
</div>''' + badge('EL DOBLE DE TAMAÑO = 4 VECES EL PESO', 2, 560, 770, '#ff6b6b', '×4', mas=2)))

E.append(dict(frases=[
  'Ahora el bisel. Cuando unes a tope piezas gruesas, de más de seis milímetros, y la unión debe trabajar con todo su espesor, necesitas bisel.',
  'Una medida muy usada: bisel en V con ángulo total de sesenta grados, treinta de cada lado.',
  'Un talón, o cara de raíz, de cero a tres milímetros, y una abertura de raíz de cero a tres milímetros. Así el arco llega hasta abajo.',
  'La raíz la pasas con seis cero once, y el relleno y el acabado con siete cero dieciocho, como vimos en la clase dos.',
], zoom=[(0, 1.0, 50, 50), (1, 1.1, 50, 45), (2, 1.1, 50, 62)], html=titulo('El <span class="nar">bisel en V</span>', top=110) + f'''
<svg class="ap" data-en="0" style="position:absolute;left:360px;top:250px" width="1200" height="520" viewBox="0 0 1200 520">
 <polygon points="80,140 500,140 560,380 560,440 80,440" fill="{P}"/><polygon points="640,380 700,140 1120,140 1120,440 640,440" fill="{P}"/>
 <g class="ap" data-en="1"><path d="M500 140 L560 380" stroke="#ffd166" stroke-width="6"/><path d="M700 140 L640 380" stroke="#ffd166" stroke-width="6"/>
  <path d="M530 210 A 90 90 0 0 0 670 210" fill="none" stroke="#ffd166" stroke-width="4"/><text x="600" y="190" fill="#ffd166" font-size="40" font-weight="900" text-anchor="middle">60°</text></g>
 <g class="ap" data-en="2"><line x1="560" y1="380" x2="560" y2="440" stroke="#5cc8ff" stroke-width="8"/><text x="470" y="425" fill="#5cc8ff" font-size="28" font-weight="900" text-anchor="end">talón 0–3 mm</text>
  <line x1="560" y1="480" x2="640" y2="480" stroke="#7ee08a" stroke-width="6"/><text x="600" y="515" fill="#7ee08a" font-size="28" font-weight="900" text-anchor="middle">abertura 0–3 mm</text></g>
 <g class="ap" data-en="3"><polygon points="560,440 640,440 640,380 560,380" fill="{S}"/><text x="760" y="425" fill="{S}" font-size="28" font-weight="900">raíz E6011</text></g>
</svg>'''))

E.append(dict(frases=[
  'Antes de soldar, limpia. Por lo menos dos o tres centímetros alrededor de la junta: sin óxido, sin pintura, sin grasa, y sin galvanizado.',
  'Después, puntea: puntos cortos para fijar las piezas, cada quince o veinte centímetros, y alternando de un lado al otro para que no se jale.',
  'Los puntos deben quedar bien fundidos, porque van a quedar dentro del cordón final.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Limpia y <span class="nar">puntea</span>', top=110) + tarjetas([
  ('🧽', 'Limpia 2 a 3 cm', 'Sin óxido, pintura, grasa ni galvanizado'), ('📍', 'Puntos cada 15 a 20 cm', 'Cortos y alternando lados'), ('🔥', 'Puntos bien fundidos', 'Quedan dentro del cordón final')],
  lambda i: i, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'En nuestro almacén, ¿qué juntas hay?',
  'Columna sobre placa base: junta en T, con filete alrededor de todo el perfil.',
  'Los nudos del arco, donde montantes y diagonales llegan al cordón: también filete.',
  'Y el empalme del cordón del arco, cuando el tubo no alcanza: a tope, con penetración completa. Ese empalme no puede quedar a medias.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('En nuestra obra: <span class="nar">¿qué juntas hay?</span>', top=110) + tarjetas([
  ('🧱', 'Columna – placa base', 'Junta en T · filete alrededor'), ('🔺', 'Nudos del arco', 'Montantes y diagonales · filete'), ('🔗', 'Empalme del cordón', 'A tope · penetración completa')],
  lambda i: i + 1, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Los cinco errores en la preparación.',
  'Uno: soldar sobre óxido, pintura o grasa.',
  'Dos: soldar galvanizado sin quitar el zinc.',
  'Tres: juntas a tope gruesas sin bisel ni abertura.',
  'Cuatro: filetes más chicos que el mínimo, o el doble "por si acaso".',
  'Y cinco: puntos gordos y fríos que quedan sin fundir dentro del cordón.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al preparar</span>', [
  ('Soldar sobre óxido o pintura', 'Poros y falta de fusión.'), ('Galvanizado sin quitar', 'Humo tóxico y poros.'), ('Grueso sin bisel', 'La raíz queda sin fundir.'),
  ('Filete fuera de medida', 'Muy chico no aguanta; muy grande deforma y cuesta.'), ('Puntos gordos y fríos', 'Quedan como defecto dentro del cordón.')])))

E.append(dict(frases=[
  'Tu reto: en tu próximo trabajo, toma foto de tres juntas antes de soldar, ya limpias y punteadas. Dinos qué tipo de junta es cada una y de qué tamaño será el filete.',
  'En la próxima clase: el cordón perfecto. Ángulo, velocidad y movimiento.',
], html=reto('📸 3 juntas limpias y punteadas:<br><b class="nar">tipo de junta · tamaño de filete</b>', 'EL CORDÓN PERFECTO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: la soldadura se gana antes de prender el arco. Junta bien preparada, cordón que aguanta.',
  '¡Nos vemos en la clase cinco!',
], html=final('Prepara bien, <span class="nar">suelda seguro</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'sold_c4')
