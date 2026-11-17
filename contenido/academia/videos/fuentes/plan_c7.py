"""Lectura de Planos Metálicos · Clase 7: El plano de cimentación y anclajes."""
from sold_comun import *

CURSO = 'LECTURA DE PLANOS · CLASE 7'
ETAPAS_PLAN_AV = ['Cimentación y anclajes', 'Planos de arquitectura', 'Tu croquis acotado']
E = []
PAPEL = '#f4f1e8'; TINTA = '#2b3640'

def zapata_corte(en, x, y, mas=0):
    return f'''<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="600" height="520" viewBox="0 0 600 520">
 <rect x="0" y="0" width="600" height="520" rx="10" fill="{PAPEL}"/>
 <rect x="120" y="360" width="360" height="110" fill="none" stroke="{TINTA}" stroke-width="5"/><rect x="230" y="160" width="140" height="200" fill="none" stroke="{TINTA}" stroke-width="5"/>
 <rect x="215" y="135" width="170" height="16" fill="#9aa6b0"/><rect x="230" y="151" width="140" height="9" fill="#c9c3b8"/>
 <path d="M265 120 V300 Q265 320 285 320" fill="none" stroke="#c0392b" stroke-width="5"/><path d="M335 120 V300 Q335 320 355 320" fill="none" stroke="#c0392b" stroke-width="5"/>
 <line x1="20" y1="150" x2="580" y2="150" stroke="{TINTA}" stroke-width="2" stroke-dasharray="10 6"/><text x="580" y="140" fill="{TINTA}" font-size="20" font-weight="900" text-anchor="end">NPT ±0.00</text>
 <text x="500" y="420" fill="{TINTA}" font-size="22" font-weight="900">Z-1</text><text x="390" y="260" fill="{TINTA}" font-size="20" font-weight="900">pedestal</text></svg>'''

E.append(dict(antes=0.5, frases=[
  'El albañil ya había vaciado los pedestales...',
  '...y cuando llegaste con las columnas, los pernos salían cinco centímetros cortos, y en otra posición. Nadie había leído el detalle de anclajes.',
  'Hoy aprendes a leer el plano de cimentación y anclajes, para coordinar antes de que se vacíe el concreto. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Pernos', 'cortos', 7, 'CIMENTACIÓN', soldando=False) + zapata_corte(0, 1180, 280)))

E.append(escena_obra(0, [
  'Terminamos los planos del mezanine. Ahora empieza el módulo avanzado de lectura de planos.',
  'Hoy: la lámina de cimentación y anclajes. La que se lee antes que todas, porque el concreto no se corrige.',
], 'Hoy: <span class="nar">cimentación y anclajes</span>', ETAPAS_PLAN_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'En la planta de cimentación, cada zapata tiene un código: Z uno, Z dos. Las iguales llevan el mismo código.',
  'Sus medidas no están en la planta: están en el cuadro de zapatas. Largo, ancho, alto, y el acero de refuerzo.',
  'Y en los cortes ves el pedestal: la columnita de concreto que sube desde la zapata hasta el nivel donde se apoya la placa base.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Zapatas <span class="nar">y pedestales</span>', top=110) + zapata_corte(0, 200, 240) + tabla(
  ['Zapata', 'Largo × ancho × alto', 'Pedestal'], [['Z-1', '1.20 × 1.20 × 0.50 m', '0.40 × 0.40 m'], ['Z-2', '1.50 × 1.50 × 0.60 m', '0.45 × 0.45 m']],
  lambda i: 1, top=300, izq=860, der=80, tam=28, nota='Cuadro de zapatas (valores de ejemplo).')))

E.append(dict(frases=[
  'Lo más importante para ti: el detalle de los pernos de anclaje. Ahí dice el diámetro, por ejemplo tres cuartos de pulgada.',
  'El largo total del perno, y su forma: con gancho en J, en L, o recto con tuerca y placa abajo.',
  'La proyección: cuánto debe salir el perno por encima del concreto. Tiene que alcanzar para el grout, la placa base, las arandelas, la tuerca, y unos hilos más.',
  'Y la separación entre pernos, que tiene que coincidir con los agujeros de tu placa base. Por eso se usa una plantilla: la misma para fabricar la placa y para colocar los pernos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('El detalle <span class="nar">de los pernos</span>', top=110) + lista([
  ('⌀', '<b>Diámetro</b>: por ejemplo 3/4"'), ('📏', '<b>Largo total y forma</b>: J, L o recto con tuerca'), ('⬆️', '<b>Proyección</b>: grout + placa + arandela + tuerca + hilos'), ('📐', '<b>Separación</b> = agujeros de la placa · usa <b>plantilla</b>')],
  lambda i: i, top=260, izq=300, der=300, tam=31)))

E.append(dict(frases=[
  'Los niveles. El piso terminado es el cero. El pedestal termina un poco más abajo: por ejemplo, menos cero cinco. Esos cinco centímetros son para el grout, el mortero que va debajo de la placa.',
  'Si el pedestal se vacía al ras del piso, ya no hay espacio para el grout ni para nivelar la columna.',
  'Y el fondo de la cimentación: a qué profundidad se excava. Eso lo controla el maestro de obra, pero te conviene saberlo.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Los <span class="nar">niveles</span>', top=110) + tabla(
  ['Nivel', 'Ejemplo', 'Para qué'], [['Piso terminado (NPT)', '±0.00', 'Referencia'], ['Superior del pedestal', '−0.05', 'Deja 5 cm de grout'], ['Fondo de cimentación', '−1.20', 'Profundidad de excavación']],
  lambda i: i, top=290, izq=260, der=260, tam=32)))

E.append(dict(frases=[
  'Ejemplo: el plano dice pernos de tres cuartos, con gancho en J, de seiscientos milímetros, y proyección de cien milímetros sobre el pedestal.',
  'Revisa que alcance: cincuenta de grout, doce de placa base, unos cuatro de arandela, diecinueve de tuerca. Ochenta y cinco milímetros. Quedan quince para que sobresalgan unos hilos. Alcanza.',
  'Si te dieran ochenta de proyección, no alcanzaría para la tuerca. Eso se pregunta antes del vaciado, no después.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('¿Alcanza <span class="nar">la proyección</span>?', top=110) + tabla(
  ['Capa', 'mm'], [['Grout', '50'], ['Placa base', '12'], ['Arandela', '≈ 4'], ['Tuerca 3/4"', '≈ 19'], ['<b>Suma</b>', '<b>85</b>'], ['<b class="nar">Proyección del plano</b>', '<b class="nar">100 → sobran 15 ✓</b>']],
  lambda i: [1, 1, 1, 1, 1, 1][i], top=240, izq=520, der=520, tam=31) + badge('SE PREGUNTA ANTES DEL VACIADO', 2, 680, 780, '#ff6b6b', '!')))

E.append(dict(frases=[
  'Y la coordinación: la cimentación la hace otro equipo. Antes del vaciado, entrega la plantilla de pernos, revisa con el maestro de obra los ejes, los niveles y la proyección, y toma fotos.',
  'Una hora de coordinación ahorra días de picar concreto y soldar pernos.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Coordina <span class="nar">antes del vaciado</span>', top=110) + tarjetas([
  ('📐', 'Entrega la plantilla', 'Al equipo de concreto'), ('✅', 'Revisa juntos', 'Ejes, niveles y proyección'), ('📸', 'Toma fotos', 'Antes de vaciar')],
  lambda i: i, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Los cinco errores con la cimentación.',
  'Uno: no leer el detalle de pernos.',
  'Dos: proyección que no alcanza para la tuerca.',
  'Tres: pedestal al ras, sin espacio para el grout.',
  'Cuatro: pernos colocados sin plantilla.',
  'Y cinco: no coordinar antes del vaciado.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con la cimentación</span>', [
  ('Sin leer el detalle', 'Pernos equivocados.'), ('Proyección corta', 'No entra la tuerca.'), ('Pedestal al ras', 'Sin espacio para grout.'),
  ('Sin plantilla', 'Los agujeros no coinciden.'), ('Sin coordinar', 'Picar concreto después.')])))

E.append(dict(frases=[
  'Tu reto: con pernos de cinco octavos, grout de cuarenta milímetros y placa de diez milímetros, calcula la proyección mínima que necesitas. Considera arandela y tuerca, y unos hilos extra.',
  'En la próxima clase: cómo leer los planos de arquitectura para encontrar lo que te sirve como metalero.',
], html=reto('🧮 Perno 5/8", grout 40 mm, placa 10 mm:<br><b class="nar">¿proyección mínima?</b>', 'PLANOS DE ARQUITECTURA')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el concreto no se corrige. Lee el plano de cimentación y coordina antes del vaciado.',
  '¡Nos vemos en la clase ocho!',
], html=final('Coordina <span class="nar">antes del concreto</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'plan_c7')
