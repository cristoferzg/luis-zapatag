"""Soldadura Estructural · Clase 9: Las 4 posiciones — vertical, horizontal y sobre cabeza."""
from sold_comun import *

CURSO = 'SOLDADURA ESTRUCTURAL · CLASE 9'
E = []

def pos_svg(en, x, y, tipo, etiqueta, mas=0):
    P = '#7d8f9f'; S = '#f97316'
    cont = {
      'plana': f'<rect x="20" y="120" width="220" height="30" fill="{P}"/><rect x="115" y="40" width="30" height="80" fill="{P}"/><polygon points="115,120 115,95 90,120" fill="{S}"/><line x1="70" y1="60" x2="105" y2="110" stroke="#d9d2c5" stroke-width="8"/>',
      'horizontal': f'<rect x="20" y="40" width="30" height="140" fill="{P}"/><rect x="50" y="95" width="190" height="30" fill="{P}"/><polygon points="50,95 75,95 50,70" fill="{S}"/><line x1="130" y1="40" x2="62" y2="88" stroke="#d9d2c5" stroke-width="8"/>',
      'vertical': f'<rect x="20" y="20" width="30" height="170" fill="{P}"/><rect x="50" y="20" width="160" height="30" fill="{P}"/><line x1="54" y1="185" x2="54" y2="56" stroke="{S}" stroke-width="10"/><line x1="140" y1="170" x2="62" y2="120" stroke="#d9d2c5" stroke-width="8"/><text x="200" y="150" fill="#7ee08a" font-size="40" font-weight="900">↑</text>',
      'sobrecabeza': f'<rect x="20" y="20" width="220" height="30" fill="{P}"/><rect x="115" y="50" width="30" height="80" fill="{P}"/><polygon points="115,50 115,75 90,50" fill="{S}"/><line x1="60" y1="160" x2="105" y2="62" stroke="#d9d2c5" stroke-width="8"/>',
    }[tipo]
    return (f'<div class="tarjeta pop" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px;text-align:center;padding:14px">'
            f'<svg width="260" height="200" viewBox="0 0 260 200">{cont}</svg><div style="font-size:30px;font-weight:900">{etiqueta}</div></div>')

E.append(dict(antes=0.5, frases=[
  'En la mesa, tu cordón sale perfecto...',
  '...pero el nudo que falta está arriba, en vertical, y el charco se te cae como lágrima. O peor: sobre tu cabeza.',
  'Hoy aprendes a soldar en las cuatro posiciones. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('El charco', 'se cae', 9, 'POSICIONES') ))

E.append(escena_obra(0, [
  'Ya terminamos el almacén. Ahora empieza el módulo avanzado. En cada obra hay uniones que no se pueden soldar en la mesa: en vertical, de costado o sobre la cabeza.',
  'Hoy aprendemos a dominarlas.',
], 'Hoy: <span class="nar">las 4 posiciones</span>', ETAPAS_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'La norma AWS numera las posiciones del uno al cuatro. Uno: plana. Dos: horizontal. Tres: vertical. Cuatro: sobre cabeza.',
  'Y una letra: F, si es soldadura de filete, y G, si es de ranura, a tope. Por eso escucharás "tres F", o "cuatro G".',
  'En una prueba de soldador, mientras más difícil la posición, más cosas te habilita a soldar.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Las <span class="nar">4 posiciones</span>', top=100) +
 pos_svg(0, 110, 260, 'plana', '1 · Plana') + pos_svg(0, 540, 260, 'horizontal', '2 · Horizontal', mas=0.6) + pos_svg(0, 970, 260, 'vertical', '3 · Vertical', mas=1.2) + pos_svg(0, 1400, 260, 'sobrecabeza', '4 · Sobre cabeza', mas=1.8) +
 badge('F = FILETE · G = RANURA → 3F, 4G…', 1, 640, 620, '#5cc8ff', 'i')))

E.append(dict(frases=[
  'Regla número uno, la más rentable: mueve la pieza, no el cuerpo.',
  'Si la pieza se puede girar o voltear en el taller, hazlo, y suelda en plano. En plano se suelda más rápido, con más calidad y menos cansancio.',
  'Las otras posiciones quedan para lo que de verdad no se puede mover: las uniones en la obra.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Mueve la pieza, <span class="nar">no el cuerpo</span>', top=110) + tarjetas([
  ('🔄', 'Gira o voltea la pieza', 'En el taller, casi siempre se puede'), ('⚡', 'En plano', 'Más rápido, más calidad, menos cansancio'), ('🏗️', 'Las demás posiciones', 'Para lo que no se puede mover')],
  lambda i: i, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'La vertical. Con siete cero dieciocho, siempre subiendo, de abajo hacia arriba.',
  'Baja el amperaje, como vimos, y usa un arco corto. El electrodo apunta un poquito hacia arriba, de cinco a diez grados.',
  'El movimiento: un triángulo o un zigzag corto, con una pequeña pausa en cada borde para que se llene, y pasando rápido por el centro.',
  'El secreto: un charco pequeño. Un charco grande pesa y se cae.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('La <span class="nar">vertical</span> (3F / 3G)', top=110) + pos_svg(0, 200, 260, 'vertical', 'Siempre subiendo ↑') + lista([
  ('⬆️', '7018: <b>siempre subiendo</b>'), ('📏', 'Arco corto · electrodo <b>5–10° hacia arriba</b>'), ('🔺', 'Triángulo o zigzag corto, <b>pausa en los bordes</b>'), ('💧', '<b>Charco pequeño</b>: el grande se cae')],
  lambda i: [0, 1, 2, 3][i], top=270, izq=620, der=120, tam=30)))

E.append(dict(frases=[
  'La horizontal. La gravedad jala el charco hacia la plancha de abajo.',
  'Por eso, el electrodo apunta un poquito hacia arriba, y en juntas grandes se hacen varios cordones angostos, apilados de abajo hacia arriba.',
  'Cada cordón nuevo se apoya en el anterior, como ladrillos en un muro.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La <span class="nar">horizontal</span> (2F / 2G)', top=110) + pos_svg(0, 200, 260, 'horizontal', 'Apunta un poco arriba') + f'''
<svg class="ap" data-en="1" style="position:absolute;left:760px;top:280px" width="900" height="420" viewBox="0 0 900 420">
 <rect x="40" y="40" width="80" height="340" fill="#7d8f9f"/><rect x="120" y="240" width="700" height="80" fill="#7d8f9f"/>
 {"".join(f'<ellipse cx="{170 + 0 * k}" cy="{225 - k * 38}" rx="46" ry="20" fill="#f97316" stroke="#ffd166" stroke-width="3" class="pop" data-en="2" data-mas="{0.6*k}"/>' for k in range(4))}
 <text x="300" y="150" fill="#ffd166" font-size="30" font-weight="900">cordones apilados ↑</text></svg>'''))

E.append(dict(frases=[
  'Sobre cabeza: la más difícil y la más peligrosa.',
  'Arco muy corto y un poco menos de amperaje. Cordones rectos y angostos: nada de vaivén ancho, porque el charco se cae encima.',
  'Y la protección extra: capucha o gorra de soldador, cuello y mangas cerradas, lentes debajo de la careta. Una chispa en el cuello o en la oreja es una quemadura segura.',
  'Busca una postura estable, con el cable apoyado en el hombro para que no jale la pinza.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Sobre <span class="nar">cabeza</span> (4F / 4G)', top=110) + pos_svg(0, 200, 260, 'sobrecabeza', 'Cordones angostos') + lista([
  ('📏', 'Arco <b>muy corto</b>, algo menos de amperaje'), ('➖', 'Cordones <b>rectos y angostos</b>, sin vaivén ancho'), ('🧢', '<b>Capucha</b>, cuello y mangas cerradas, lentes'), ('🧍', 'Postura estable · cable sobre el hombro')],
  lambda i: i, top=270, izq=620, der=120, tam=30)))

E.append(dict(frases=[
  'En nuestro almacén: los arcos se soldaron en plano, en la mesa. Pero en la obra quedan uniones del arco a la columna: unas en vertical y otras sobre cabeza.',
  'Plan: se arman con andamio a buena altura, para soldar de frente y no estirado. Primero los cordones verticales, subiendo. Después los de abajo, sobre cabeza, cortos y angostos.',
  'Y se calcula más tiempo: en estas posiciones avanzas bastante más lento que en plano, como vimos en la clase de costos.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('En la obra: <span class="nar">arco a columna</span>', top=110) + lista([
  ('🏭', 'Arcos: soldados en <b>plano</b>, en el taller'), ('🧗', 'Obra: andamio a buena altura, soldar <b>de frente</b>'), ('⬆️', 'Primero verticales, <b>subiendo</b>'), ('⬇️', 'Luego sobre cabeza: <b>cortos y angostos</b>'), ('⏱️', 'Calcula <b>más tiempo</b> que en plano')],
  lambda i: [0, 1, 1, 1, 2][i], top=250, izq=330, der=330, tam=30)))

E.append(dict(frases=[
  'Cómo practicar: dos planchas de seis milímetros en T, puntéalas, y fíjalas a la altura del pecho, en vertical.',
  'Haz tres filetes subiendo. Cuando salgan parejos, sin lágrimas abajo, pasa a la horizontal. Y al final, sobre cabeza.',
  'Corta un filete de práctica con el esmeril de punta a punta y mira por dentro: tiene que estar fundido hasta la raíz.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Cómo <span class="nar">practicar</span>', top=110) + tarjetas([
  ('🧱', 'Plancha 6 mm en T', 'A la altura del pecho'), ('⬆️', '3 filetes subiendo', 'Sin lágrimas abajo'), ('↔️ ⬇️', 'Luego horizontal y sobre cabeza', 'En ese orden'), ('🔪', 'Córtalo y mira', 'Fundido hasta la raíz')],
  lambda i: [0, 1, 1, 2][i])))

E.append(dict(frases=[
  'Los cinco errores en posición.',
  'Uno: usar el mismo amperaje que en plano.',
  'Dos: soldar el siete cero dieciocho bajando en vertical.',
  'Tres: charco grande, que se cae.',
  'Cuatro: vaivén ancho sobre cabeza.',
  'Y cinco: soldar estirado o sin protección en el cuello.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">en posición</span>', [
  ('Mismo amperaje que en plano', 'El charco se descontrola.'), ('7018 bajando', 'Falta de fusión.'), ('Charco grande', 'Se cae y deja lágrimas.'),
  ('Vaivén ancho sobre cabeza', 'El metal te cae encima.'), ('Postura mala, cuello abierto', 'Cordón disparejo y quemaduras.')])))

E.append(dict(frases=[
  'Tu reto: suelda tres filetes en vertical subiendo, en planchas de seis milímetros. Córtalo con el esmeril y mándanos la foto del corte.',
  'En la próxima clase: soldar tubos y perfiles delgados sin perforarlos.',
], html=reto('🔥 3 filetes en vertical, subiendo:<br><b class="nar">córtalo y manda la foto del corte</b>', 'TUBOS Y PERFILES DELGADOS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: mueve la pieza cuando puedas, y cuando no, charco pequeño y arco corto.',
  '¡Nos vemos en la clase diez!',
], html=final('Charco pequeño, <span class="nar">arco corto</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'sold_c9')
