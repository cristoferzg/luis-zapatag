"""Naves Parabólicas · Clase 12: Cerramientos y frontis."""
from sold_comun import *
from comun import parabola

CURSO = 'NAVES PARABÓLICAS · CLASE 12'
ETAPAS_NAV_AV = ['Luces grandes', 'Luz y ventilación', 'Cerramientos', 'Mantenimiento']
E = []

X0, X1, PISO, COL, FL = 460, 1460, 800, 300, 190
BASE = PISO - COL

def y_arco(x):
    t = (x - X0) / (X1 - X0)
    return BASE - 4 * FL * t * (1 - t)

def frontis(en_col=0, en_col_int=None, en_larg=None, en_porton=None, en_zocalo=None, en_remate=None):
    s = '<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">'
    s += f'<g class="ap" data-en="{en_col}"><line x1="{X0-120}" y1="{PISO}" x2="{X1+120}" y2="{PISO}" stroke="#5c6b78" stroke-width="6"/>'
    s += f'<line x1="{X0}" y1="{PISO}" x2="{X0}" y2="{BASE}" stroke="#9aa6b0" stroke-width="18"/><line x1="{X1}" y1="{PISO}" x2="{X1}" y2="{BASE}" stroke="#9aa6b0" stroke-width="18"/>'
    s += f'<polyline points="{parabola(X0, X1, BASE, FL)}" fill="none" stroke="#f97316" stroke-width="14"/></g>'
    if en_col_int is not None:
        for k, x in enumerate((710, 960, 1210)):
            s += f'<line class="ap" data-en="{en_col_int}" data-mas="{0.3*k}" x1="{x}" y1="{PISO}" x2="{x}" y2="{y_arco(x):.0f}" stroke="#ffd166" stroke-width="12"/>'
    if en_larg is not None:
        for k, y in enumerate(range(PISO - 70, BASE - 120, -70)):
            xa = X0; xb = X1
            if y < BASE:  # dentro de la parábola: recortar
                import math
                # resolver BASE - 4FL t(1-t) = y
                d = (BASE - y) / (4 * FL); r = math.sqrt(max(0, 0.25 - d))
                xa = X0 + (X1 - X0) * (0.5 - r); xb = X0 + (X1 - X0) * (0.5 + r)
            s += f'<line class="ap" data-en="{en_larg}" data-mas="{0.2*k:.1f}" x1="{xa:.0f}" y1="{y}" x2="{xb:.0f}" y2="{y}" stroke="#5ec4ff" stroke-width="7"/>'
    if en_zocalo is not None:
        s += f'<rect class="ap" data-en="{en_zocalo}" x="{X0}" y="{PISO-60}" width="{X1-X0}" height="60" fill="#8a6d5a"/>'
    if en_porton is not None:
        s += (f'<g class="pop" data-en="{en_porton}"><rect x="860" y="{PISO-250}" width="200" height="250" fill="rgba(249,115,22,.25)" stroke="#f97316" stroke-width="6"/>'
              f'<line x1="820" y1="{PISO-262}" x2="1100" y2="{PISO-262}" stroke="#ffd166" stroke-width="14"/></g>')
    if en_remate is not None:
        s += f'<polyline class="ap" data-en="{en_remate}" points="{parabola(X0-10, X1+10, BASE-12, FL)}" fill="none" stroke="#7ee08a" stroke-width="8" stroke-dasharray="20 10"/>'
    return s + '</svg>'

# 0. Gancho
E.append(dict(antes=0.5, frases=[
  'El techo está listo, y la nave se ve muy bien...',
  '...hasta que llega el primer ventarrón y el polvo, o la lluvia, entran por los lados. El cliente quiere cerrarla.',
  'Hoy aprendes a cerrar la nave: el frontis, los muros laterales y el portón. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Techo listo...', 'falta cerrar la nave', 12, 'CERRAMIENTOS', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="1" style="position:absolute;left:1250px;top:300px;font-size:200px">🌬️</div>')))

# 1. Mapa
E.append(escena_obra(2, [
  'Ya tienes luz y ventilación. Ahora toca cerrar.',
  'Hoy: cerramientos y frontis. La estructura que sostiene las planchas de los lados, y cómo metrarla.',
], 'Hoy: <span class="nar">cerramientos y frontis</span>', ETAPAS_NAV_AV, 'Módulo avanzado', cab=''))

# 2. Partes
E.append(dict(frases=[
  'El cerramiento tiene cuatro partes.',
  'Los dos frontis, que son los extremos de la nave, con la forma del arco.',
  'Los muros laterales, a lo largo de la nave.',
  'Y los vanos: el portón para los camiones, la puerta para las personas, y las persianas que viste en la clase pasada.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Las partes <span class="nar">del cerramiento</span>', top=100) + tarjetas([
  ('⛺', 'Frontis', 'Los dos extremos,<br>con forma de arco'), ('🧱', 'Muros laterales', 'A lo largo<br>de la nave'), ('🚚', 'Portón', 'Para camiones<br>y montacargas'), ('🚪', 'Puertas y persianas', 'Personas<br>y ventilación')],
  lambda i: [1, 2, 3, 3][i], top=260, cols=4, alto=320, izq=120)))

# 3. Estructura del frontis
E.append(dict(frases=[
  'El frontis trabaja como una vela: el viento lo empuja de frente. Por eso no basta colgar planchas del último arco.',
  'Se colocan columnas de frontis, desde su zapata hasta el arco del extremo, repartidas a lo ancho.',
  'Y entre ellas, largueros horizontales, cada metro veinte a metro y medio, según la plancha que uses. Sobre los largueros se fijan las planchas, en vertical.',
  'Los perfiles, la separación y la unión de las columnas de frontis con el arco los define el cálculo, porque reciben el viento.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('La estructura <span class="nar">del frontis</span>', top=90) + frontis(0, 1, 2) +
 badge('COLUMNAS DE FRONTIS', 1, 140, 300, '#c49a00', '│') + badge('LARGUEROS', 2, 1560, 300, '#2b7fb3', '─')))

# 4. Muros laterales y zócalo
E.append(dict(frases=[
  'En los muros laterales, los largueros van de columna a columna, a lo largo de la nave.',
  'Abajo, no lleves la plancha hasta el piso. Haz un zócalo de concreto o de ladrillo, de unos sesenta centímetros a un metro.',
  'El zócalo aguanta los golpes de los carros y las carretillas, y no deja que el agua del piso oxide el borde de la plancha.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 70)], html=titulo('Muros laterales <span class="nar">y zócalo</span>', top=90) +
 '<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080"><g class="ap" data-en="0">'
 '<line x1="240" y1="800" x2="1680" y2="800" stroke="#5c6b78" stroke-width="6"/>' +
 ''.join(f'<line x1="{x}" y1="800" x2="{x}" y2="420" stroke="#9aa6b0" stroke-width="16"/>' for x in (300, 780, 1260, 1640)) +
 ''.join(f'<line x1="300" y1="{y}" x2="1640" y2="{y}" stroke="#5ec4ff" stroke-width="7"/>' for y in (700, 610, 520, 430)) +
 '</g><rect class="ap" data-en="1" x="300" y="720" width="1340" height="80" fill="#8a6d5a"/>'
 '<text class="ap" data-en="1" x="970" y="772" fill="#fff" font-size="32" font-weight="900" text-anchor="middle">ZÓCALO 0.60 a 1.00 m</text></svg>'
 + badge('LA PLANCHA NO LLEGA AL PISO', 2, 690, 230, '#3f9e5a', '✓')))

# 5. Metrado del frontis
E.append(dict(frases=[
  'Ahora, el metrado. El frontis es un rectángulo más una parábola.',
  'El rectángulo: la luz por la altura de columna. En nuestra nave, quince por cinco: setenta y cinco metros cuadrados.',
  'Y el truco de la parábola: su área es dos tercios de la base por la altura. Dos tercios de quince por dos diez: veintiún metros cuadrados.',
  'Un frontis: noventa y seis metros cuadrados. Es el mismo número que usamos para el volumen en la clase pasada.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 45), (3, 1.0, 50, 50)], html=titulo('Área <span class="nar">del frontis</span>', top=90) +
 '<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">'
 f'<rect class="ap" data-en="1" x="{X0}" y="{BASE}" width="{X1-X0}" height="{COL}" fill="rgba(94,196,255,.25)" stroke="#5ec4ff" stroke-width="5"/>'
 f'<text class="ap" data-en="1" x="960" y="{BASE+170}" fill="#5ec4ff" font-size="40" font-weight="900" text-anchor="middle">15 × 5 = 75 m²</text>'
 f'<polygon class="ap" data-en="2" points="{parabola(X0, X1, BASE, FL)}" fill="rgba(249,115,22,.3)" stroke="#f97316" stroke-width="8"/>'
 f'<text class="ap" data-en="2" x="960" y="{BASE-55}" fill="#ffd166" font-size="36" font-weight="900" text-anchor="middle">⅔ × 15 × 2.10 = 21 m²</text></svg>'
 + badge('UN FRONTIS = 96 m²', 3, 1490, 420, '#f97316', '=')))

# 6. Metrado completo
E.append(dict(frases=[
  'Ahora toda la nave de quince por treinta, con un portón de cuatro por cuatro y medio en un frontis.',
  'Dos frontis: ciento noventa y dos metros cuadrados. Menos el portón, dieciocho: ciento setenta y cuatro.',
  'Dos muros laterales de treinta por cinco: trescientos metros cuadrados.',
  'Si el zócalo es de un metro, se descuenta de todo el perímetro, menos el ancho del portón: ochenta y seis metros cuadrados que van de concreto o ladrillo, no de plancha.',
  'Cerramiento de plancha: unos trescientos ochenta y ocho metros cuadrados. Lo divides entre el ancho útil de la plancha que te da tu proveedor, y sumas los traslapes.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55), (4, 1.0, 50, 50)], html=titulo('En la obra: <span class="nar">metrado del cerramiento</span>', top=90) + tabla(
  ['Partida', 'Cálculo', 'm²'],
  [['Frontis (2)', '2 × 96', '192'], ['Menos portón', '4 × 4.5', '− 18'], ['Muros laterales (2)', '2 × 30 × 5', '300'],
   ['Menos zócalo de 1 m', '(2 × 30) + (2 × 15) − 4 del portón', '− 86'], ['<b class="nar">Plancha de cerramiento</b>', '', '<b class="nar">≈ 388</b>']],
  lambda i: [1, 1, 2, 3, 4][i], top=220, izq=230, der=230, tam=31, nota='Al dividir entre el ancho útil, suma traslapes y cortes de la parábola.')))

# 7. Portón
E.append(dict(frases=[
  'El portón de una nave es grande y pesado. Cómo se fabrica la hoja ya lo viste en el curso de Carpintería Metálica. Aquí lo propio de la nave.',
  'Sobre el vano va una viga dintel, apoyada en dos columnas de frontis más fuertes. Esa viga carga el riel del portón corredizo.',
  'Nunca cuelgues el riel de la plancha ni de un larguero delgado. Y abajo, una guía para que la hoja no se balancee con el viento.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 50)], html=titulo('El <span class="nar">portón</span> de la nave', top=90) + frontis(0, None, None, 1) +
 badge('VIGA DINTEL + RIEL', 1, 1130, 470, '#c49a00', '─', 0.8) + badge('GUÍA ABAJO', 2, 1130, 690, '#3f9e5a', '✓')))

# 8. Remates
E.append(dict(frases=[
  'Y los remates, que son los que evitan el agua y el viento.',
  'En el borde curvo del frontis, un remate que tapa la unión entre el techo y la plancha del frontis. Se dobla en tramos cortos para seguir la curva.',
  'En las esquinas, esquineros. Y sobre el zócalo, un botaguas, para que el agua que baja por la plancha caiga afuera y no se meta detrás.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 40)], html=titulo('Los <span class="nar">remates</span>', top=90) + frontis(0, None, None, None, 2, 1) +
 badge('REMATE CURVO', 1, 1500, 360, '#3f9e5a', '⌒') + badge('BOTAGUAS SOBRE EL ZÓCALO', 2, 1470, 690, '#8a6d5a', '↓', tam=22)))

# 9. Errores
E.append(dict(frases=[
  'Los cinco errores al cerrar una nave.',
  'Uno: frontis sin columnas, colgado del último arco.',
  'Dos: largueros muy separados: la plancha se abolla y suena con el viento.',
  'Tres: plancha hasta el piso, sin zócalo.',
  'Cuatro: riel del portón colgado de la plancha.',
  'Y cinco: olvidar los remates y el botaguas.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al cerrar la nave</span>', [
  ('Frontis sin columnas', 'El viento lo empuja como vela.'), ('Largueros muy separados', 'Plancha abollada y ruidosa.'), ('Plancha hasta el piso', 'Golpes y óxido en el borde.'),
  ('Riel colgado de la plancha', 'Necesita viga dintel.'), ('Sin remates ni botaguas', 'Entra agua y viento.')])))

# 10. Reto
E.append(dict(frases=[
  'Tu reto: una nave de veinte metros de luz, con columnas de seis metros y flecha óptima. ¿Cuál es el área de un frontis?',
  'En la próxima clase, la última del curso: mantenimiento. Cómo hacer que la nave dure, y cómo cobrar por cuidarla.',
], html=reto('🧮 Nave de 20 m de luz, columnas de 6 m, flecha óptima:<br><b class="nar">área de un frontis</b>', 'MANTENIMIENTO')))

# 11. Final
E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el frontis es una vela, la plancha no llega al piso, y los remates no se olvidan.',
  '¡Nos vemos en la clase trece!',
], html=final('Una nave <span class="nar">bien cerrada</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'naves_c12')
