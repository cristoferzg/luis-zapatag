"""Lectura de Planos Metálicos · Clase 2: Vistas, cortes y detalles."""
from sold_comun import *
from plan_c1 import ETAPAS_PLAN, OBRA

CURSO = 'LECTURA DE PLANOS · CLASE 2'
E = []
PAPEL = '#f4f1e8'; TINTA = '#2b3640'

def hoja(x, y, w, h, cont, en=0, mas=0, titulo_v=''):
    return (f'<div class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px;text-align:center"><svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<rect x="0" y="0" width="{w}" height="{h}" rx="8" fill="{PAPEL}"/>{cont}</svg><div style="font-size:28px;font-weight:900;margin-top:8px">{titulo_v}</div></div>')

PLACA_PLANTA = f'<rect x="60" y="60" width="200" height="200" fill="none" stroke="{TINTA}" stroke-width="5"/><rect x="110" y="110" width="100" height="100" fill="none" stroke="{TINTA}" stroke-width="4"/>' + ''.join(f'<circle cx="{a}" cy="{b}" r="10" fill="none" stroke="{TINTA}" stroke-width="4"/>' for a in (85, 235) for b in (85, 235))
PLACA_ELEV = f'<rect x="60" y="230" width="200" height="16" fill="none" stroke="{TINTA}" stroke-width="5"/><rect x="110" y="40" width="100" height="190" fill="none" stroke="{TINTA}" stroke-width="4"/><polygon points="110,230 110,180 70,230" fill="none" stroke="{TINTA}" stroke-width="4"/><polygon points="210,230 210,180 250,230" fill="none" stroke="{TINTA}" stroke-width="4"/>'

E.append(dict(antes=0.5, frases=[
  'Soldaste las cartelas de la placa base...',
  '...del lado equivocado. El plano las mostraba en la elevación, y la leíste al revés. Ahora no coinciden con los pernos.',
  'Hoy aprendes a leer vistas, cortes y detalles, para ver la pieza completa antes de cortarla. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Del lado', 'equivocado', 2, 'VISTAS Y CORTES', soldando=False) + hoja(1150, 300, 320, 300, PLACA_ELEV, 0)))

E.append(escena_obra(1, [
  'Seguimos leyendo los planos de nuestro mezanine. Ya sabemos leer el rótulo y la escala.',
  'Hoy: cómo el plano muestra una pieza de tres dimensiones en un papel plano.',
], 'Hoy: <span class="nar">vistas, cortes y detalles</span>', ETAPAS_PLAN, OBRA))

E.append(dict(frases=[
  'Un plano muestra cada pieza desde varios lados. La planta: mirando desde arriba. Ves el largo y el ancho.',
  'La elevación: mirando de frente o de costado. Ves el alto.',
  'Ninguna vista sola te dice todo. Tienes que juntarlas en tu cabeza: la planta te dice dónde van los agujeros, y la elevación, el espesor y las cartelas.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Planta <span class="nar">y elevación</span>', top=100) +
 hoja(330, 250, 320, 320, PLACA_PLANTA, 0, titulo_v='Planta (desde arriba)') + hoja(1270, 250, 320, 320, PLACA_ELEV, 1, titulo_v='Elevación (de frente)') +
 badge('JUNTA LAS VISTAS EN TU CABEZA', 2, 690, 690, '#3f9e5a', '3D')))

E.append(dict(frases=[
  'Las líneas también hablan. La línea continua gruesa: lo que se ve.',
  'La línea discontinua, a trazos: lo que está oculto, detrás.',
  'La línea de raya y punto: un eje, o el centro de una pieza.',
  'Y la línea fina con flechas en las puntas: una cota, una medida.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Los tipos <span class="nar">de línea</span>', top=110) + f'''
<div style="position:absolute;left:380px;right:380px;top:270px">''' + ''.join(
  f'<div class="ap" data-en="{i}" style="display:flex;align-items:center;gap:30px;margin:26px 0"><svg width="420" height="40"><line x1="10" y1="20" x2="410" y2="20" stroke="#fff" stroke-width="{w}" stroke-dasharray="{d}"/>{m}</svg><div style="font-size:32px;font-weight:900">{t}</div></div>'
  for i, (w, d, t, m) in enumerate([(8, '', 'Visible', ''), (5, '18 12', 'Oculta', ''), (4, '34 10 4 10', 'Eje', ''), (2, '', 'Cota', '<polygon points="10,20 30,12 30,28" fill="#fff"/><polygon points="410,20 390,12 390,28" fill="#fff"/>')])) + '</div>'))

E.append(dict(frases=[
  'El corte. Imagina que cortas la pieza con una sierra gigante, y miras lo que queda. Así se ve su interior.',
  'En la planta, la línea de corte tiene una letra en cada punta, por ejemplo A y A, y flechas que dicen hacia dónde estás mirando.',
  'Y en otra parte del plano aparece el dibujo "Corte A-A". Lo que fue cortado se dibuja rayado.',
  'Ojo con las flechas: si miras al revés, ves la pieza en espejo.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El <span class="nar">corte</span>', top=110) + hoja(330, 250, 420, 330, f'''
 <rect x="60" y="80" width="300" height="170" fill="none" stroke="{TINTA}" stroke-width="5"/>
 <line x1="30" y1="165" x2="390" y2="165" stroke="#c0392b" stroke-width="4" stroke-dasharray="30 8 4 8"/>
 <polygon points="30,165 45,190 15,190" fill="#c0392b"/><polygon points="390,165 405,190 375,190" fill="#c0392b"/>
 <text x="30" y="225" fill="#c0392b" font-size="34" font-weight="900" text-anchor="middle">A</text><text x="390" y="225" fill="#c0392b" font-size="34" font-weight="900" text-anchor="middle">A</text>''', 0, titulo_v='Planta con línea de corte') +
 hoja(1170, 250, 420, 330, f'''<rect x="60" y="140" width="300" height="40" fill="url(#ray)" stroke="{TINTA}" stroke-width="4"/>
 <defs><pattern id="ray" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke="{TINTA}" stroke-width="3"/></pattern></defs>''', 2, titulo_v='Corte A-A (rayado)') +
 badge('FLECHAS = HACIA DÓNDE MIRAS', 3, 680, 720, '#ff6b6b', '!')))

E.append(dict(frases=[
  'El detalle. Cuando algo es muy chico para verse en la planta, se dibuja aparte, más grande. Una conexión, por ejemplo.',
  'En la planta verás un círculo, con un número arriba y otro abajo. Tres sobre E cero cuatro: es el detalle tres, que está en la lámina E cero cuatro.',
  'Sigue siempre esas llamadas. Muchas veces, lo que necesitas saber para fabricar está solo en el detalle.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 50)], html=titulo('El <span class="nar">detalle</span>', top=110) + '''
<svg class="ap" data-en="1" style="position:absolute;left:760px;top:280px" width="400" height="400" viewBox="0 0 400 400">
 <circle cx="200" cy="200" r="150" fill="none" stroke="#fff" stroke-width="8"/><line x1="50" y1="200" x2="350" y2="200" stroke="#fff" stroke-width="6"/>
 <text x="200" y="170" fill="#ffd166" font-size="90" font-weight="900" text-anchor="middle">3</text><text x="200" y="300" fill="#5cc8ff" font-size="70" font-weight="900" text-anchor="middle">E-04</text></svg>
<div class="ap" data-en="1" data-mas="1" style="position:absolute;left:1180px;top:350px;font-size:30px;font-weight:900;color:#ffd166">← número del detalle</div>
<div class="ap" data-en="1" data-mas="1.6" style="position:absolute;left:1180px;top:520px;font-size:30px;font-weight:900;color:#5cc8ff">← lámina donde está</div>'''))

E.append(dict(frases=[
  'Y una trampa clásica: las piezas "de mano". Una cartela izquierda y una derecha se ven iguales en el plano, pero son espejo una de la otra.',
  'Si el plano dice "dos piezas, una de cada mano", o "opuesta", corta una normal y la otra en espejo. Si las cortas las dos iguales, una no sirve.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Piezas <span class="nar">"de mano"</span>', top=110) + '''
<svg style="position:absolute;left:560px;top:280px" width="800" height="380" viewBox="0 0 800 380">
 <polygon class="ap" data-en="0" points="80,340 80,60 330,340" fill="#f97316"/><polygon class="ap" data-en="0" data-mas="0.8" points="720,340 720,60 470,340" fill="#5cc8ff"/>
 <line x1="400" y1="40" x2="400" y2="360" stroke="#fff" stroke-width="3" stroke-dasharray="14 10"/></svg>''' +
 badge('UNA DE CADA MANO = UNA EN ESPEJO', 1, 640, 700, '#ff6b6b', '⇄')))

E.append(dict(frases=[
  'Los cinco errores al leer vistas.',
  'Uno: leer una sola vista, sin cruzarla con las otras.',
  'Dos: confundir una línea oculta con una visible.',
  'Tres: mirar un corte en la dirección contraria.',
  'Cuatro: no seguir la llamada al detalle.',
  'Y cinco: cortar iguales las piezas que son de mano.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con las vistas</span>', [
  ('Una sola vista', 'Te falta una dimensión.'), ('Oculta vs visible', 'Sueldas donde no va.'), ('Corte al revés', 'Ves la pieza en espejo.'),
  ('Sin ir al detalle', 'Te pierdes la conexión.'), ('Piezas de mano iguales', 'Una no sirve.')])))

E.append(dict(frases=[
  'Tu reto: en un plano tuyo, busca una línea de corte y su dibujo de corte. Y busca una llamada de detalle. Dinos en qué lámina está ese detalle.',
  'En la próxima clase: ejes, cotas y niveles. Dónde va cada cosa, exactamente.',
], html=reto('🔍 En un plano tuyo, encuentra:<br><b class="nar">un corte A-A · una llamada de detalle y su lámina</b>', 'EJES Y COTAS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: junta las vistas, sigue los cortes y los detalles, y verás la pieza completa antes de cortarla.',
  '¡Nos vemos en la clase tres!',
], html=final('Ve la pieza <span class="nar">antes de cortarla</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'plan_c2')
