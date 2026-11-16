"""Techos a Dos y Cuatro Aguas · Clase 10: Cortes de plancha y remates en cuatro aguas."""
from techo_comun import *

CURSO = 'TECHOS A DOS Y CUATRO AGUAS · CLASE 10'
E = []
T = 'font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke"'

def faldon_triangular(en, x, y, base, alto, n, mas=0, recorte=False):
    """Faldón triangular (vista sobre el faldón) con planchas verticales cortadas por las limatesas."""
    s = f'<g class="ap" data-en="{en}" data-mas="{mas}"><polygon points="{x},{y} {x+base},{y} {x+base/2},{y-alto}" fill="rgba(255,255,255,.05)" stroke="#f97316" stroke-width="6"/>'
    w = base / n
    for i in range(n):
        x0, x1 = x + i * w, x + (i + 1) * w
        def h(xx):
            return alto * (1 - abs(2 * (xx - x) / base - 1))
        s += f'<polygon points="{x0:.0f},{y} {x1:.0f},{y} {x1:.0f},{y-h(x1):.0f} {x0:.0f},{y-h(x0):.0f}" fill="rgba(249,115,22,{0.12 + 0.03*(i%2):.2f})" stroke="#c9d6e3" stroke-width="2"/>'
    return s + '</g>'

E.append(dict(antes=0.5, frases=[
  'En el techo a dos aguas, todas las planchas miden lo mismo. En el de cuatro aguas, no.',
  'En las limatesas, cada plancha tiene otro largo y un corte en diagonal. Si no lo planeas, compras de menos, cortas de más, y el desperdicio se come la ganancia.',
  'Hoy aprendes a calcular los cortes, aprovechar los recortes, y rematar bien el cuatro aguas. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Faldón triangular', 'planchas de todo largo', 10, 'CORTES Y REMATES', soldando=False,
              extra_html=svg(faldon_triangular(0, 1150, 620, 560, 300, 9, 0.5)))))

E.append(obra_av(1, [
  'Ya sabes elegir la cobertura y leer su ficha.',
  'Hoy: los cortes de plancha y los remates en el techo a cuatro aguas.',
], 'Hoy: <span class="nar">cortes y remates</span>'))

E.append(dict(frases=[
  'Las planchas siempre van del alero hacia arriba, perpendiculares al borde del faldón.',
  'En la parte central de los faldones largos, llegan enteras hasta la cumbrera. Pero cerca de cada limatesa, la plancha choca con ella y se corta en diagonal.',
  'En los faldones triangulares, todas las planchas se cortan, y cada una es más corta que la anterior al acercarse a la esquina.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Planchas <span class="nar">que se cortan</span>', top=100) + svg(
  faldon_triangular(0, 460, 720, 1000, 420, 9) +
  f'<text class="ap" data-en="2" x="960" y="770" fill="#fff" font-size="30" {T} text-anchor="middle">faldón triangular de la casa: 9 m de alero</text>')))

E.append(dict(frases=[
  '¿Cuánto mide cada plancha? Con limatesas a cuarenta y cinco grados, hay una regla simple.',
  'A una distancia del rincón medida en el alero, la plancha cortada tiene, en su lado más largo, esa misma distancia en horizontal. Para pasarla a largo real, por el factor.',
  'En la casa, con treinta por ciento y planchas de un metro útil: a un metro de la esquina, uno cero cuatro. A dos, dos cero nueve. A tres, tres trece. A cuatro, cuatro dieciocho. Y al centro, la más larga: cuatro setenta.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El largo <span class="nar">de cada plancha</span>', top=100) + tabla(
  ['Distancia a la esquina', 'Cálculo', 'Lado largo de la plancha'],
  [['1 m', '1 × 1.044', '1.04 m'], ['2 m', '2 × 1.044', '2.09 m'], ['3 m', '3 × 1.044', '3.13 m'], ['4 m', '4 × 1.044', '4.18 m'], ['Centro (4.5 m)', '4.5 × 1.044', '4.70 m']],
  lambda i: 2, top=240, izq=300, der=300, tam=32, nota='Planchas de 1 m útil, de ejemplo. Lado largo medido sobre el faldón.')))

E.append(dict(frases=[
  'Y el ángulo del corte. En planta, la limatesa va a cuarenta y cinco grados. Pero sobre la plancha inclinada, el corte no es exactamente de cuarenta y cinco.',
  'Por cada metro que avanzas en el alero, el corte sube un metro cero cuatro cuatro sobre la plancha. Eso da unos cuarenta y seis grados, medidos desde el borde del alero.',
  'La diferencia es pequeña, pero en planchas largas se nota: marca el corte con dos medidas, no con la escuadra de cuarenta y cinco.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El ángulo <span class="nar">del corte</span>', top=100) + svg(
  '<g class="ap" data-en="0"><rect x="760" y="240" width="400" height="430" fill="rgba(249,115,22,.15)" stroke="#c9d6e3" stroke-width="4"/></g>'
  '<line class="ap" data-en="1" x1="760" y1="670" x2="1160" y2="252" stroke="#ff6b6b" stroke-width="7"/>'
  f'<text class="ap" data-en="1" x="960" y="720" fill="#5ec4ff" font-size="30" {T} text-anchor="middle">1.00 m en el alero</text>'
  f'<text class="ap" data-en="1" x="1190" y="460" fill="#ffd166" font-size="30" {T}>1.044 m</text>'
  f'<text class="ap" data-en="1" x="840" y="645" fill="#ff6b6b" font-size="30" {T}>≈ 46°</text>') +
  badge('MARCA CON 2 MEDIDAS', 2, 1250, 300, '#3f9e5a', '📏')))

E.append(dict(frases=[
  'El truco para ahorrar: el triángulo que sobra al cortar una plancha en una limatesa tiene la forma justa para el faldón vecino, al otro lado de la misma limatesa.',
  'Como los dos faldones tienen la misma pendiente, el recorte encaja volteado.',
  'Planea los cortes por pares, limatesa por limatesa, y numera los recortes. Así el desperdicio baja mucho.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Aprovecha <span class="nar">los recortes</span>', top=100) + svg(
  '<g class="ap" data-en="0"><polygon points="560,720 960,720 960,320" fill="rgba(249,115,22,.25)" stroke="#f97316" stroke-width="6"/>'
  f'<text x="840" y="680" fill="#fff" font-size="28" {T} text-anchor="middle">plancha cortada</text></g>'
  '<g class="ap" data-en="0" data-mas="0.6"><polygon points="560,720 960,320 560,320" fill="rgba(94,196,255,.25)" stroke="#5ec4ff" stroke-width="6" stroke-dasharray="14 8"/>'
  f'<text x="680" y="400" fill="#5ec4ff" font-size="28" {T} text-anchor="middle">recorte</text></g>'
  '<path class="ap" data-en="1" d="M720 450 C 950 250, 1180 250, 1300 420" fill="none" stroke="#7ee08a" stroke-width="7" marker-end="url(#fr2)"/>'
  '<g class="ap" data-en="1" data-mas="0.6"><polygon points="1160,720 1560,720 1160,320" fill="rgba(94,196,255,.25)" stroke="#5ec4ff" stroke-width="6"/>'
  f'<text x="1300" y="680" fill="#7ee08a" font-size="28" {T} text-anchor="middle">en el faldón vecino ✓</text></g>'
  '<defs><marker id="fr2" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#7ee08a"/></marker></defs>')))

E.append(dict(frases=[
  '¿Cuánto desperdicio considerar? Como referencia, en un cuatro aguas se suele sumar entre diez y quince por ciento al área real. En dos aguas, bastante menos.',
  'En la casa, con ciento veintidós metros cuadrados de área real y un doce por ciento: unos ciento treinta y siete metros cuadrados de plancha para comprar.',
  'Si el plano de cortes está bien hecho, te acercas al mínimo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El <span class="nar">desperdicio</span>', top=100) + tabla(
  ['Dato', 'Cálculo', 'Resultado'], [['Área real de la casa', 'clase 8', '122.1 m²'], ['Desperdicio (ejemplo)', '12 %', '+ 14.7 m²'], ['<b class="nar">Plancha a comprar</b>', '122.1 × 1.12', '<b class="nar">≈ 137 m²</b>']],
  lambda i: [1, 1, 1][i], top=280, izq=300, der=300, tam=34, nota='Referencia general: el desperdicio real depende del plano de cortes.')))

E.append(dict(frases=[
  'Ahora, los remates. Sobre la cumbrera y sobre cada limatesa va un caballete, que tapa la unión entre faldones.',
  'En las limatesas, los caballetes se colocan de abajo hacia arriba, cada uno montando sobre el anterior, para que el agua pase por encima de los traslapes.',
  'Bajo el caballete, las ondas de la plancha dejan huecos: se cierran con tapaondas de espuma, para que no entren agua, polvo ni aves.',
  'Y donde el techo choca con un muro, va un botaguas contra muro, que sube por la pared y monta sobre la plancha.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Los <span class="nar">remates</span>', top=90) + svg(
  planta_4aguas(200, 300, 760, 420, en=0) +
  '<line class="ap" data-en="1" x1="200" y1="300" x2="410" y2="510" stroke="#7ee08a" stroke-width="16" stroke-dasharray="40 8" opacity=".85"/>') + lista([
  ('⛰️', '<b class="nar">Caballete</b>: cumbrera y limatesas'), ('🧽', '<b class="nar">Tapaondas</b> bajo el caballete'), ('🧱', '<b class="nar">Botaguas</b> contra muro')],
  lambda i: [0, 2, 3][i], top=330, izq=1040, der=120, tam=30)))

E.append(dict(frases=[
  'En la casa: cuatro metros de cumbrera y veintiséis de limatesas. Treinta metros de caballete.',
  'Si cada pieza de caballete cubre, por ejemplo, un metro ochenta útil después del traslape: treinta entre uno ochenta, dieciséis coma siete. Diecisiete piezas.',
  'Más los tapaondas a lo largo de esos treinta metros, en los dos lados del caballete.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">los remates</span>', top=100) + tabla(
  ['Remate', 'Cálculo', 'Cantidad'], [['Caballete', '4 + 26 m', '30 m'], ['Piezas (1.80 m útil, ejemplo)', '30 ÷ 1.80', '17'], ['Tapaondas', '2 lados × 30 m', '60 m']],
  lambda i: [0, 1, 2][i], top=280, izq=280, der=280, tam=34)))

E.append(dict(frases=[
  'Los cinco errores en cortes y remates.',
  'Uno: comprar planchas solo por el área, sin plano de cortes.',
  'Dos: cortar con la escuadra de cuarenta y cinco.',
  'Tres: botar los recortes.',
  'Cuatro: colocar los caballetes de arriba hacia abajo.',
  'Y cinco: dejar las ondas abiertas, sin tapaondas.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">en cortes y remates</span>', [
  ('Sin plano de cortes', 'Compras de más o de menos.'), ('Escuadra de 45°', 'Sobre la plancha son ≈ 46°.'), ('Botar los recortes', 'Sirven en el faldón vecino.'),
  ('Caballetes al revés', 'El agua entra en los traslapes.'), ('Ondas abiertas', 'Agua, polvo y aves.')])))

E.append(dict(frases=[
  'Tu reto: en la casa de diez por catorce, con treinta por ciento, calcula el lado largo de las planchas a uno, dos y tres metros de una esquina, y la plancha central del faldón triangular.',
  'En la próxima clase: limahoyas y techos en L.',
], html=reto('🧮 Techo de 10 × 14 m · 30 % · faldón triangular:<br><b class="nar">planchas a 1, 2 y 3 m de la esquina y la central</b>', 'LIMAHOYAS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: plano de cortes, recortes aprovechados, y caballetes de abajo hacia arriba.',
  '¡Nos vemos en la clase once!',
], html=final('Corta una vez, <span class="nar">aprovecha dos</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_c10')
