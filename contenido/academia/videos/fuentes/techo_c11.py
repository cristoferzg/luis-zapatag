"""Techos a Dos y Cuatro Aguas · Clase 11: Limahoyas y techos en L."""
from techo_comun import *

CURSO = 'TECHOS A DOS Y CUATRO AGUAS · CLASE 11'
E = []
_svg = svg
def svg(c):
    return _svg('<g transform="translate(160,-20) scale(0.85)">' + c + '</g>')
T = 'font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke"'

def planta_L(en=0, mas=0, resalta=None, en_r=1):
    s = (f'<g class="ap" data-en="{en}" data-mas="{mas}"><polygon points="400,320 1500,320 1500,800 1200,800 1200,620 400,620" fill="rgba(249,115,22,.10)" stroke="#e8edf2" stroke-width="5"/>'
         '<line x1="550" y1="470" x2="1350" y2="470" stroke="#ffd166" stroke-width="8"/><line x1="1350" y1="470" x2="1350" y2="650" stroke="#ffd166" stroke-width="8"/>')
    for a, b in [((400, 320), (550, 470)), ((400, 620), (550, 470)), ((1500, 320), (1350, 470)), ((1200, 800), (1350, 650)), ((1500, 800), (1350, 650))]:
        s += f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="#f97316" stroke-width="7"/>'
    s += '</g>'
    s += f'<line class="ap" data-en="{en_r}" x1="1200" y1="620" x2="1350" y2="470" stroke="#5ec4ff" stroke-width="12"/>'
    return s

E.append(dict(antes=0.5, frases=[
  'Donde dos techos se juntan formando un rincón, se junta toda el agua de los dos.',
  'Ese rincón se llama limahoya, y es el punto número uno de goteras en cualquier techo.',
  'Hoy aprendes a calcularla, a armarla y a sellarla bien. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Donde se juntan dos techos', 'se junta toda el agua', 11, 'LIMAHOYAS', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1300px;top:300px;font-size:200px">💧</div>')))

E.append(obra_av(2, [
  'Ya sabes cortar y rematar el cuatro aguas.',
  'Hoy: las limahoyas, que aparecen en casas en forma de L, de T, o con ampliaciones.',
], 'Hoy: <span class="nar">limahoyas y techos en L</span>'))

E.append(dict(frases=[
  'Mira una casa en L desde arriba. Tiene sus cumbreras, en amarillo, y sus limatesas en las esquinas de afuera, en naranja.',
  'Pero en el rincón de adentro, los dos faldones se juntan bajando: esa es la limahoya, en celeste.',
  'La limatesa reparte el agua hacia los dos lados. La limahoya hace lo contrario: la recibe de los dos faldones y la concentra en una sola línea.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 65, 50)], html=titulo('La <span class="nar">limahoya</span>', top=90) + svg(
  planta_L(0) + f'<text class="ap" data-en="1" x="1150" y="560" fill="#5ec4ff" font-size="30" {T} text-anchor="end">limahoya</text>'
  f'<text class="ap" data-en="0" x="1440" y="380" fill="#f97316" font-size="26" {T} text-anchor="end">limatesa</text>'
  f'<text class="ap" data-en="0" x="900" y="455" fill="#ffd166" font-size="26" {T} text-anchor="middle">cumbrera</text>')))

E.append(dict(frases=[
  'La geometría es la misma de la limatesa. Si los faldones tienen la misma pendiente, la limahoya va a cuarenta y cinco grados en planta.',
  'Con alas de nueve metros de techo y treinta por ciento: en planta mide cuatro cincuenta por raíz de dos, seis treinta y seis. Sube uno treinta y cinco. Largo real, seis cincuenta y uno.',
  'Y su pendiente es de veintiuno por ciento, menos que los faldones. Justo donde hay más agua, el agua corre más lento. Por eso necesita un canal generoso.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Geometría <span class="nar">de la limahoya</span>', top=100) + tabla(
  ['Dato', 'Cálculo', 'Resultado'], [['En planta', '4.50 × √2', '6.36 m'], ['Sube', '4.50 × 0.30', '1.35 m'], ['Largo real', '√(6.36² + 1.35²)', '6.51 m'], ['Pendiente', '1.35 ÷ 6.36', '≈ 21 %']],
  lambda i: [1, 1, 1, 2][i], top=260, izq=300, der=300, tam=34)))

E.append(dict(frases=[
  'En la estructura, por la limahoya va una viga o un tijeral de limahoya, que recibe las correas de los dos faldones, cortadas en ángulo.',
  'Es una pieza que carga más que una correa común, porque recoge parte del techo de las dos alas. Su perfil y sus uniones los define el cálculo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 65, 50)], html=titulo('La <span class="nar">estructura</span>', top=90) + svg(
  planta_L(0) +
  ''.join(f'<line class="ap" data-en="0" data-mas="{0.2*k}" x1="{1200 - 40*k - 40}" y1="{620 - 40*k - 40}" x2="{1200 - 40*k - 40}" y2="{620}" stroke="#c9d6e3" stroke-width="5"/>' for k in range(2)) +
  ''.join(f'<line class="ap" data-en="0" data-mas="{0.2*k}" x1="{1200 + 40*k + 40}" y1="{620 - 40*k - 40}" x2="{1200}" y2="{620 - 40*k - 40}" stroke="#c9d6e3" stroke-width="5"/>' for k in range(2))) +
  badge('LA VIGA DE LIMAHOYA CARGA MÁS', 1, 520, 600, '#2b7fb3', '🧮')))

E.append(dict(frases=[
  'Ahora, la cobertura. Bajo los faldones va un canal de limahoya: una plancha lisa doblada, con alas anchas que quedan debajo de las planchas de los dos lados.',
  'Las planchas montan sobre el canal, pero sus cortes no se tocan en el centro. Se deja una franja libre al medio, para que el agua y la basura corran sin trabas.',
  'Nunca perfores el canal en su centro, por donde corre el agua. Las fijaciones van por fuera, y los bordes se sellan con cinta butílica.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('El canal <span class="nar">de limahoya</span>', top=100) + svg(
  '<g class="ap" data-en="0"><polyline points="560,420 960,620 1360,420" fill="none" stroke="#c9d6e3" stroke-width="12"/>'
  f'<text x="960" y="680" fill="#c9d6e3" font-size="30" {T} text-anchor="middle">canal de limahoya</text></g>'
  '<g class="ap" data-en="1"><polyline points="480,330 860,520" fill="none" stroke="#f97316" stroke-width="16"/><polyline points="1440,330 1060,520" fill="none" stroke="#f97316" stroke-width="16"/>'
  f'<text x="960" y="540" fill="#5ec4ff" font-size="28" {T} text-anchor="middle">franja libre</text></g>'
  '<g class="pop" data-en="2"><line x1="940" y1="590" x2="980" y2="630" stroke="#ff6b6b" stroke-width="7"/><line x1="980" y1="590" x2="940" y2="630" stroke="#ff6b6b" stroke-width="7"/></g>') +
  badge('NO PERFORES EL CENTRO', 2, 760, 230, '#c0392b', '✕')))

E.append(dict(frases=[
  'Y al final del recorrido: la limahoya descarga toda esa agua en la canaleta, justo en el rincón.',
  'Ahí la canaleta recibe mucho más que en cualquier otro punto. Coloca una bajada cerca del rincón, y refuerza los soportes de la canaleta en ese tramo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55)], html=titulo('Donde <span class="nar">termina</span>', top=90) + svg(
  planta_L(0) + '<circle class="pop" data-en="0" cx="1200" cy="620" r="38" fill="none" stroke="#5ec4ff" stroke-width="7"/>'
  f'<g class="pop" data-en="1"><rect x="1170" y="640" width="24" height="24" fill="#7ee08a"/><text x="1160" y="700" fill="#7ee08a" font-size="28" {T} text-anchor="end">bajada cerca del rincón</text></g>')))

E.append(dict(frases=[
  'Resumen de una casa en L con alas de nueve metros de techo y treinta por ciento.',
  'Una limahoya de seis cincuenta y uno, con veintiuno por ciento. Canal de limahoya de unos siete metros, contando el traslape con la canaleta.',
  'Y una bajada en el rincón.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('En la obra: <span class="nar">casa en L</span>', top=100) + tabla(
  ['Pieza', 'Dato', 'Resultado'], [['Limahoya', 'largo real', '6.51 m'], ['Pendiente', 'menor que el faldón', '≈ 21 %'], ['Canal de limahoya', '6.51 + traslapes', '≈ 7 m'], ['Bajada', 'en el rincón', '1']],
  lambda i: [0, 1, 1, 2][i], top=260, izq=300, der=300, tam=34)))

E.append(dict(frases=[
  'Los cinco errores en las limahoyas.',
  'Uno: juntar las planchas en el centro del canal.',
  'Dos: un canal angosto.',
  'Tres: perforar el canal en su centro.',
  'Cuatro: sellar solo con silicona.',
  'Y cinco: no poner bajada cerca del rincón.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">en las limahoyas</span>', [
  ('Planchas juntas al centro', 'Se atasca el agua.'), ('Canal angosto', 'Rebalsa.'), ('Perforar el centro', 'Gotera segura.'),
  ('Solo silicona', 'Se cuartea al sol.'), ('Sin bajada en el rincón', 'La canaleta rebalsa.')])))

E.append(dict(frases=[
  'Tu reto: una casa en L con alas de diez metros de techo y veinticinco por ciento de pendiente. Calcula el largo real de la limahoya y su pendiente.',
  'En la próxima clase, la última del curso: aislamiento térmico y acústico.',
], html=reto('🧮 Casa en L · alas de 10 m · 25 %:<br><b class="nar">largo real y pendiente de la limahoya</b>', 'AISLAMIENTO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: la limahoya concentra el agua. Canal ancho, centro libre y bajada cerca.',
  '¡Nos vemos en la clase doce!',
], html=final('Limahoya bien hecha, <span class="nar">rincón seco</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_c11')
