"""Techos a Dos y Cuatro Aguas · Clase 5: Los apoyos del tijeral."""
from techo_comun import *

CURSO = 'TECHOS A DOS Y CUATRO AGUAS · CLASE 5'
E = []
T = 'font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke"'

def columna(x, top, piso, en=0, mas=0):
    return f'<g class="ap" data-en="{en}" data-mas="{mas}"><rect x="{x-22}" y="{top}" width="44" height="{piso-top}" fill="#8d99a6"/><rect x="{x-50}" y="{top-14}" width="100" height="14" fill="#ffd166"/></g>'

def muro(x, top, piso, en=0, mas=0):
    return (f'<g class="ap" data-en="{en}" data-mas="{mas}"><rect x="{x-60}" y="{top+70}" width="120" height="{piso-top-70}" fill="#a0522d" opacity=".75"/>'
            + ''.join(f'<line x1="{x-60}" y1="{y}" x2="{x+60}" y2="{y}" stroke="#5a2d14" stroke-width="3"/>' for y in range(top + 100, piso, 30)) +
            f'<rect x="{x-66}" y="{top}" width="132" height="70" fill="#9aa6b0"/><text x="{x}" y="{top+44}" fill="#0b2a45" font-size="15" font-weight="900" text-anchor="middle">VIGA COLLAR</text></g>')

E.append(dict(antes=0.5, frases=[
  'El tijeral está perfecto: bien trazado, bien soldado...',
  '...pero lo apoyan directo sobre el ladrillo, sin anclaje. Con el primer viento fuerte, el techo se levanta, o el muro se raja.',
  'Hoy aprendes a apoyar y anclar el tijeral, sobre columna metálica o sobre muro. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Buen tijeral...', '¿y dónde se apoya?', 5, 'LOS APOYOS', soldando=False,
              extra_html=svg(tijeral(1120, 1740, 520, 150, 'pratt', en=0, n=8) + muro(1120, 520, 800, en=0, mas=0.4) + muro(1740, 520, 800, en=0, mas=0.4)))))

E.append(obra(4, [
  'Ya tienes los tijerales armados.',
  'Hoy: los apoyos. El taller los apoya sobre columnas metálicas, y la casa, sobre sus muros.',
], 'Hoy: <span class="nar">los apoyos</span>'))

E.append(dict(frases=[
  'Caso uno, el taller: columna metálica.',
  'En la cabeza de la columna se suelda una plancha de apoyo. Sobre ella se asienta el nudo del extremo del tijeral, y se fija con pernos o con soldadura, según el plano.',
  'La regla de los nudos se cumple también aquí: los ejes del cordón superior, del cordón inferior y de la columna se encuentran en un punto.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 45, 55)], html=titulo('Sobre <span class="nar">columna metálica</span>', top=100) + svg(
  columna(700, 480, 800, en=0) + columna(1500, 480, 800, en=0) + tijeral(700, 1500, 466, 200, 'pratt', en=1, n=8) +
  '<g class="pop" data-en="2"><circle cx="700" cy="466" r="40" fill="none" stroke="#7ee08a" stroke-width="7"/>'
  f'<text x="560" y="390" fill="#7ee08a" font-size="30" {T} text-anchor="middle">ejes en un punto</text></g>'
  f'<text class="ap" data-en="1" x="560" y="530" fill="#ffd166" font-size="28" {T} text-anchor="middle">plancha de apoyo</text>')))

E.append(dict(frases=[
  'Caso dos, la casa: muro de ladrillo.',
  'El tijeral nunca se apoya directo sobre el ladrillo: lo aplasta en un punto y lo raja.',
  'Se apoya sobre la viga collar, o solera, de concreto armado, que corre por todo el muro. La diseña el ingeniero y la construye el maestro de obra.',
  'En ella se dejan los pernos de anclaje antes del vaciado, en la posición del plano. Si ya está construida, se usan anclajes químicos, lejos del borde para no romper el concreto.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 50)], html=titulo('Sobre <span class="nar">muro</span>', top=100) + svg(
  muro(760, 440, 790, en=0) + muro(1560, 440, 790, en=0) + tijeral(760, 1560, 426, 200, 'pratt', en=1, n=8) +
  '<g class="pop" data-en="3"><line x1="740" y1="390" x2="740" y2="480" stroke="#ffd166" stroke-width="7"/><line x1="780" y1="390" x2="780" y2="480" stroke="#ffd166" stroke-width="7"/>'
  f'<text x="560" y="400" fill="#ffd166" font-size="28" {T} text-anchor="middle">pernos de anclaje</text></g>') +
  badge('NUNCA DIRECTO SOBRE LADRILLO', 1, 900, 600, '#c0392b', '✕')))

E.append(dict(frases=[
  'El acero se estira con el calor. Un tubo de diez metros, si su temperatura sube treinta grados, se alarga unos tres milímetros y medio.',
  'Si los dos apoyos están fijos, ese movimiento empuja las columnas o los muros, una y otra vez, todos los días.',
  'Por eso en luces grandes se hace un apoyo fijo y el otro deslizante: los agujeros de ese lado son ovalados, para que el tijeral pueda correr unos milímetros.',
  'Cuándo hace falta y cuánto, lo indica el plano.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Fijo <span class="nar">y deslizante</span>', top=100) + svg(
  tijeral(560, 1360, 620, 220, 'pratt', en=0, n=8) + columna(560, 634, 800, en=0) + columna(1360, 634, 800, en=0) +
  f'<g class="pop" data-en="2"><text x="510" y="730" fill="#fff" font-size="30" {T} text-anchor="end">FIJO ●</text>'
  f'<text x="1410" y="730" fill="#7ee08a" font-size="30" {T}>DESLIZANTE ⬭</text></g>'
  f'<text class="ap" data-en="0" x="960" y="690" fill="#ffd166" font-size="30" {T} text-anchor="middle">10 m × 30 °C → ≈ 3.6 mm</text>')))

E.append(dict(frases=[
  'Otro punto clave: el empuje. Un tijeral con su cordón inferior completo funciona como un triángulo cerrado: carga los apoyos hacia abajo, no los empuja hacia afuera.',
  'Pero si alguien hace el techo con dos vigas inclinadas apoyadas en los muros, sin tirante abajo, esas vigas abren los muros, como un compás.',
  'Por eso nunca cortes ni quites el cordón inferior, aunque estorbe. Si hace falta más altura libre, que el ingeniero diseñe otra solución.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El <span class="nar">empuje</span>', top=100) + svg(
  tijeral(240, 840, 700, 200, 'fink', en=0, n=6) + '<text class="ap" data-en="0" x="540" y="770" fill="#7ee08a" font-size="30" ' + T + ' text-anchor="middle">con tirante: no empuja ✓</text>' +
  f'<g class="ap" data-en="1"><line x1="1080" y1="700" x2="1380" y2="500" stroke="#f97316" stroke-width="10"/><line x1="1380" y1="500" x2="1680" y2="700" stroke="#f97316" stroke-width="10"/>'
  '<path d="M1060 700 L980 700" stroke="#ff6b6b" stroke-width="8"/><path d="M1700 700 L1780 700" stroke="#ff6b6b" stroke-width="8"/>'
  f'<text x="1380" y="770" fill="#ff6b6b" font-size="30" {T} text-anchor="middle">sin tirante: abre los muros ✕</text></g>')))

E.append(dict(frases=[
  'Y el viento. No solo empuja: en techos livianos, la succión puede levantar el techo completo.',
  'Por eso los apoyos trabajan también hacia arriba. El tijeral nunca se deja "asentado por su peso": se ancla con pernos o soldadura en cada apoyo.',
  'Lo mismo las correas sobre el tijeral, y las planchas sobre las correas. Un techo se vuela por su eslabón más débil.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El viento <span class="nar">levanta</span>', top=100) + svg(
  casa_2aguas(560, 1360, 840, 260, 180, en=0, alero=60) +
  ''.join(f'<path class="pop" data-en="0" data-mas="{0.2*k}" d="M{x} 520 L{x} 400" stroke="#5ec4ff" stroke-width="9" marker-end="url(#fa)"/>' for k, x in enumerate((700, 860, 1060, 1220))) +
  '<defs><marker id="fa" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#5ec4ff"/></marker></defs>') +
  badge('ANCLA CADA APOYO', 1, 800, 250, '#3f9e5a', '🔩')))

E.append(dict(frases=[
  'En nuestras obras: el taller tiene cinco tijerales, con diez apoyos sobre columnas metálicas, cada uno con su plancha y sus pernos.',
  'La casa apoya sus tijerales sobre la viga collar, con pernos dejados antes del vaciado.',
  'Antes de montar, verifica en obra: que todos los apoyos estén al mismo nivel, y alineados. Si un apoyo está alto, el tijeral queda torcido.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">los apoyos</span>', top=100) + tabla(
  ['Obra', 'Apoyo', 'Cantidad', 'Fijación'],
  [['Taller 10 × 16 m', 'Columna metálica', '5 × 2 = 10', 'Plancha + pernos'], ['Casa 8 × 12 m', 'Viga collar', 'según tijerales', 'Pernos de anclaje']],
  lambda i: i, top=260, izq=220, der=220, tam=31) + badge('TODOS AL MISMO NIVEL Y ALINEADOS', 2, 600, 560, '#2b7fb3', '📏')))

E.append(dict(frases=[
  'Los cinco errores en los apoyos.',
  'Uno: apoyar el tijeral directo sobre el ladrillo.',
  'Dos: dejarlo sin anclaje, solo por su peso.',
  'Tres: pernos muy cerca del borde del concreto.',
  'Cuatro: quitar o cortar el cordón inferior.',
  'Y cinco: apoyos a distinto nivel.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">en los apoyos</span>', [
  ('Directo sobre ladrillo', 'Lo aplasta y raja.'), ('Sin anclaje', 'El viento lo levanta.'), ('Pernos al borde', 'Rompe el concreto.'),
  ('Sin cordón inferior', 'Abre los muros.'), ('Apoyos desnivelados', 'Tijeral torcido.')])))

E.append(dict(frases=[
  'Tu reto: un tijeral de dieciséis metros de luz, con una subida de temperatura de cuarenta grados. ¿Cuánto se alarga? Usa doce milésimas de milímetro por metro y por grado.',
  'En la próxima clase: los aleros.',
], html=reto('🧮 Tijeral de 16 m · +40 °C<br>(0.012 mm por metro y por grado):<br><b class="nar">¿cuántos milímetros se alarga?</b>', 'LOS ALEROS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: apoyo firme, anclado, y nunca sobre el ladrillo.',
  '¡Nos vemos en la clase seis!',
], html=final('Bien apoyado, <span class="nar">bien anclado</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_c5')
