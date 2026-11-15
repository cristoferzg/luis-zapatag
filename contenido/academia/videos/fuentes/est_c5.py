"""Estructuras Metálicas · Clase 5: Corte, taladrado y tolerancias en el taller."""
from sold_comun import *
from est_c1 import ETAPAS_EST, OBRA

CURSO = 'ESTRUCTURAS METÁLICAS · CLASE 5'
E = []

E.append(dict(antes=0.5, frases=[
  'La viga llegó a la obra ocho milímetros más corta...',
  '...y no alcanzó la plancha de conexión. Hubo que soldarle un suplemento, en altura, con el cliente mirando.',
  'Hoy aprendes a cortar, taladrar y controlar las medidas en el taller, para que todo calce. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('8 mm', 'más corta', 5, 'CORTE Y TOLERANCIAS', soldando=False) + '''
<svg class="ap" data-en="0" style="position:absolute;left:1080px;top:380px" width="720" height="260" viewBox="0 0 720 260">
 <rect x="20" y="40" width="60" height="200" fill="#9aa6b0"/><rect x="640" y="40" width="60" height="200" fill="#9aa6b0"/>
 <rect x="80" y="110" width="530" height="50" fill="#f97316"/><text x="470" y="100" fill="#ff6b6b" font-size="34" font-weight="900" text-anchor="middle">↔ 8 mm</text></svg>'''))

E.append(escena_obra(4, [
  'Ya diseñamos el entrepiso del mezanine. Ahora toca fabricar todas las piezas en el taller.',
  'Y en estructuras, unos milímetros mal cortados pueden costar un día entero en la obra.',
], 'Hoy: <span class="nar">corte, taladrado y tolerancias</span>', ETAPAS_EST, OBRA))

E.append(dict(frases=[
  'Cuatro formas de cortar. La tronzadora con disco abrasivo: barata y rápida, pero calienta, deja rebaba y se desvía si el disco está gastado.',
  'La sierra de cinta: corta en frío, recto y en serie. Ideal para perfiles y tubos.',
  'El plasma: para planchas, rápido y con borde limpio.',
  'Y el oxicorte: para planchas gruesas. Deja escoria y borde áspero, que se limpia con esmeril antes de soldar o pintar.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Cómo <span class="nar">cortar</span>', top=110) + tarjetas([
  ('⚙️', 'Tronzadora', 'Barata · calienta y deja rebaba'), ('🪚', 'Sierra de cinta', 'En frío, recta, en serie'), ('⚡', 'Plasma', 'Planchas · borde limpio'), ('🔥', 'Oxicorte', 'Planchas gruesas · limpiar escoria')],
  lambda i: i)))

E.append(dict(frases=[
  'Medir bien empieza por algo simple: todo el taller usa la misma wincha, o winchas comparadas entre sí. Dos winchas pueden diferir uno o dos milímetros.',
  'Traza con rayador o lápiz de punta fina, y escuadra. Y acuérdate del ancho del disco: unos dos o tres milímetros. Corta por el lado de afuera de la línea.',
  'Y corta primero una pieza, mídela, y recién corta las demás. Si la primera sale mal, solo pierdes una.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('Mide y <span class="nar">traza</span>', top=110) + lista([
  ('📏', 'La <b>misma wincha</b> para todo el taller'), ('✏️', 'Rayador y escuadra · <b>disco ≈ 2–3 mm</b>: corta por fuera de la línea'), ('1️⃣', '<b>Primera pieza de prueba</b>, mídela, luego en serie')],
  lambda i: i, top=280, izq=280, der=280, tam=33)))

E.append(dict(frases=[
  '¿Cuánto se puede equivocar una pieza? Para eso existen las tolerancias. Una referencia muy usada es el código de práctica de la AISC.',
  'Piezas cuyos extremos van a tope, apoyados en contacto: más o menos un milímetro.',
  'Otras piezas de hasta nueve metros: más o menos dos milímetros. Y de más de nueve metros: más o menos tres.',
  'Y la rectitud de una columna: la curvatura no debe pasar de un milésimo de su largo. En una columna de tres metros, tres milímetros.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Las <span class="nar">tolerancias</span>', top=110) + tabla(
  ['Pieza', 'Tolerancia de largo'], [['Extremos a tope (en contacto)', '± 1 mm'], ['Hasta 9 m', '± 2 mm'], ['Más de 9 m', '± 3 mm'], ['Rectitud de columnas', 'L / 1000 → 3 m = 3 mm']],
  lambda i: [1, 2, 2, 3][i], top=270, izq=330, der=330, tam=34, nota='Referencia: AISC Code of Standard Practice. Si el plano o el ingeniero piden otra cosa, manda el plano.')))

E.append(dict(frases=[
  'Para taladrar vigas y planchas gruesas, lo mejor es el taladro magnético: se pega al acero y perfora recto.',
  'Usa refrigerante o aceite de corte, y para agujeros grandes, primero una broca piloto.',
  'Y siempre con plantilla, como vimos en la clase tres. Así los agujeros de la viga y de la plancha coinciden.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El <span class="nar">taladrado</span>', top=110) + tarjetas([
  ('🧲', 'Taladro magnético', 'Se pega al acero, perfora recto'), ('💧', 'Refrigerante y piloto', 'Broca fresca, agujero limpio'), ('📐', 'Siempre con plantilla', 'Viga y plancha coinciden')],
  lambda i: i, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Para los marcos y los paños, controla la escuadra midiendo las diagonales. Si las dos diagonales miden igual, está a escuadra.',
  'Si una diagonal es más larga, el marco está "chueco". Corrígelo antes de soldar completo, cuando todavía está solo punteado.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Escuadra: <span class="nar">mide las diagonales</span>', top=110) + '''
<svg style="position:absolute;left:560px;top:260px" width="800" height="480" viewBox="0 0 800 480">
 <rect x="80" y="40" width="640" height="380" fill="none" stroke="#9aa6b0" stroke-width="18"/>
 <line class="ap" data-en="0" x1="80" y1="40" x2="720" y2="420" stroke="#ffd166" stroke-width="5" stroke-dasharray="14 10"/>
 <line class="ap" data-en="0" data-mas="1" x1="720" y1="40" x2="80" y2="420" stroke="#5cc8ff" stroke-width="5" stroke-dasharray="14 10"/>
 <text class="ap" data-en="0" data-mas="2" x="400" y="470" fill="#7ee08a" font-size="34" font-weight="900" text-anchor="middle">D1 = D2 → a escuadra ✓</text>
</svg>''' + badge('CORRIGE CUANDO SOLO ESTÁ PUNTEADO', 1, 620, 800, '#5cc8ff', '!')))

E.append(dict(frases=[
  'Ejemplo: la viga principal del mezanine. Entre ejes de columnas hay cuatro metros. Las columnas son tubos de ciento cincuenta.',
  'De cara a cara de columna quedan tres mil ochocientos cincuenta milímetros.',
  'Como la viga se empalma a una plancha soldada en cada columna, dejamos diez milímetros de holgura en cada extremo: la viga se corta a tres mil ochocientos treinta.',
  'Y con su tolerancia de más o menos dos milímetros, entre tres mil ochocientos veintiocho y tres mil ochocientos treinta y dos. Así entra sin forzar.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">el largo de la viga</span>', top=110) + '''
<svg style="position:absolute;left:160px;top:250px" width="1600" height="300" viewBox="0 0 1600 300">
 <rect x="100" y="40" width="90" height="240" fill="#9aa6b0"/><rect x="1410" y="40" width="90" height="240" fill="#9aa6b0"/>
 <g class="ap" data-en="0"><line x1="145" y1="20" x2="1455" y2="20" stroke="#c9d6e3" stroke-width="3"/><text x="800" y="14" fill="#c9d6e3" font-size="26" font-weight="900" text-anchor="middle">4000 mm entre ejes</text></g>
 <g class="ap" data-en="1"><line x1="190" y1="300" x2="1410" y2="300" stroke="#5cc8ff" stroke-width="3"/><text x="800" y="294" fill="#5cc8ff" font-size="26" font-weight="900" text-anchor="middle">3850 mm cara a cara</text></g>
 <g class="ap" data-en="2"><rect x="215" y="130" width="1170" height="50" fill="#f97316"/><text x="800" y="165" fill="#fff" font-size="28" font-weight="900" text-anchor="middle">viga: 3830 mm</text>
  <text x="202" y="120" fill="#ffd166" font-size="22" font-weight="900" text-anchor="middle">10</text><text x="1398" y="120" fill="#ffd166" font-size="22" font-weight="900" text-anchor="middle">10</text></g>
</svg>''' + badge('3830 ± 2 mm → ENTRE 3828 Y 3832', 3, 620, 640, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Los cinco errores en el taller.',
  'Uno: medir con winchas distintas.',
  'Dos: olvidar el ancho del disco.',
  'Tres: cortar todo en serie sin una pieza de prueba.',
  'Cuatro: no medir las diagonales antes de soldar.',
  'Y cinco: dejar la escoria del oxicorte, y soldar o pintar encima.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">en el taller</span>', [
  ('Winchas distintas', 'Uno o dos milímetros de diferencia.'), ('Olvidar el disco', 'Cada corte pierde 2 a 3 mm.'), ('Sin pieza de prueba', 'Un error repetido en todas.'),
  ('Sin medir diagonales', 'Marcos fuera de escuadra.'), ('Escoria de oxicorte', 'Mala soldadura y pintura que se pela.')])))

E.append(dict(frases=[
  'Tu reto: toma dos winchas de tu taller, mide la misma pieza de tres metros con las dos, y anota la diferencia. Después, mide las diagonales de un marco y dinos si está a escuadra.',
  'En la próxima clase: la pintura. Cuánto comprar, qué espesor dar, y cómo calcularlo.',
], html=reto('📏 Compara 2 winchas en 3 m · mide las diagonales de un marco:<br><b class="nar">¿cuánto difieren? ¿está a escuadra?</b>', 'PINTURA')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: en el taller los milímetros son baratos. En la obra, se pagan caro.',
  '¡Nos vemos en la clase seis!',
], html=final('Milímetros en el taller, <span class="nar">horas en la obra</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'est_c5')
