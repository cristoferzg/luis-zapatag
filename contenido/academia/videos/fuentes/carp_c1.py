"""Carpintería Metálica · Clase 1: Herramientas y toma de medidas en obra."""
from sold_comun import *

CURSO = 'CARPINTERÍA METÁLICA · CLASE 1'
ETAPAS_CARP = ['Medidas', 'Despiece', 'Puerta', 'Portón', 'Rejas y barandas', 'Escalera', 'Instalar y cotizar']
OBRA = 'casa de 2 pisos'
E = []

def vano(en, x, y, w=420, h=560, extra=''):
    return f'''<svg class="ap" data-en="{en}" style="position:absolute;left:{x}px;top:{y}px" width="{w+120}" height="{h+120}" viewBox="0 0 {w+120} {h+120}">
 <rect x="20" y="20" width="{w+80}" height="{h+60}" fill="#56687a"/><rect x="60" y="60" width="{w}" height="{h}" fill="#0b2a45"/>{extra}</svg>'''

E.append(dict(antes=0.5, frases=[
  'Mediste el vano una sola vez, por el medio...',
  '...y cuando llegaste con la puerta, no entraba. El vano era cuatro centímetros más angosto arriba. A cortar y volver a soldar, en la casa del cliente.',
  'En este curso aprendes carpintería metálica de verdad, y empezamos por lo que más dinero hace perder: medir mal. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('No entraba', 'la puerta', 1, 'MEDIDAS', soldando=False) + vano(0, 1200, 230)))

E.append(escena_obra(0, [
  'En este curso hacemos todo el trabajo metálico de una casa de dos pisos: la puerta de calle, el portón de la cochera, las rejas, la baranda y la escalera.',
  'Paso a paso: medir, despiezar, fabricar, instalar y cotizar. Hoy: las herramientas, y cómo medir en obra.',
], 'Hoy: <span class="nar">herramientas y medidas</span>', ETAPAS_CARP, OBRA))

E.append(dict(frases=[
  'Las herramientas de medición van siempre en tu maletín: wincha de ocho metros, nivel de burbuja, escuadra metálica y plomada, o nivel láser.',
  'En el taller: tronzadora o sierra, esmeril angular, máquina de soldar, taladro, prensas y una mesa plana. Sin mesa plana, nada sale a escuadra.',
  'Y el equipo de protección que vimos en el curso de soldadura: careta, lentes, guantes y tapones.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Tus <span class="nar">herramientas</span>', top=110) + tarjetas([
  ('📏', 'Para medir', 'Wincha 8 m · nivel · escuadra · plomada o láser'), ('🛠️', 'Para fabricar', 'Sierra · esmeril · soldadora · taladro · prensas'), ('🟫', 'Mesa plana', 'Sin ella, nada sale a escuadra'), ('🥽', 'Protección', 'Careta, lentes, guantes, tapones')],
  lambda i: [0, 1, 1, 2][i])))

E.append(dict(frases=[
  'Regla de oro: un vano nunca es perfecto. Mide el ancho en tres alturas: abajo, al medio y arriba.',
  'Y el alto en tres puntos: a la izquierda, al centro y a la derecha.',
  'Para fabricar, usa siempre la medida más pequeña. Si usas la mayor, no entra.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Mide en <span class="nar">3 puntos</span>', top=110) + vano(0, 260, 220, extra=''.join(
  f'<g class="ap" data-en="0" data-mas="{0.6*k}"><line x1="60" y1="{y}" x2="480" y2="{y}" stroke="#ffd166" stroke-width="5"/><text x="270" y="{y-10}" fill="#ffd166" font-size="26" font-weight="900" text-anchor="middle">{t}</text></g>' for k, (y, t) in enumerate([(100, '0.88'), (330, '0.90'), (590, '0.89')])) + ''.join(
  f'<g class="ap" data-en="1" data-mas="{0.6*k}"><line x1="{x}" y1="60" x2="{x}" y2="620" stroke="#5cc8ff" stroke-width="5"/></g>' for k, x in enumerate([110, 270, 430]))) + f'''
<div style="position:absolute;left:900px;right:150px;top:300px">
 <div class="tarjeta ap" data-en="0" style="font-size:31px;margin:14px 0">↔️ Ancho: 0.89 · 0.90 · <b class="nar">0.88</b></div>
 <div class="tarjeta ap" data-en="1" style="font-size:31px;margin:14px 0">↕️ Alto: 2.11 · <b class="nar">2.10</b> · 2.12</div>
 <div class="tarjeta ap" data-en="2" style="font-size:31px;margin:14px 0;border-color:#7ee08a">✅ Fabrica con la <b>más pequeña</b>: 0.88 × 2.10</div>
</div>'''))

E.append(dict(frases=[
  'Después revisa la escuadra del vano: mide las dos diagonales. Si difieren más de medio centímetro, el vano está chueco, y tu marco tendrá que absorberlo.',
  'Revisa también el plomo de los costados con el nivel, y si el piso está a nivel. Un piso inclinado cambia la holgura de abajo de la puerta.',
  'Anota todo en un croquis, con las medidas y el lado hacia donde abre la puerta. La memoria falla; el croquis no.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Escuadra, plomo <span class="nar">y croquis</span>', top=110) + lista([
  ('✖️', 'Diagonales del vano: si difieren <b>más de 5 mm</b>, está chueco'), ('📐', 'Plomo de costados y <b>nivel del piso</b>'), ('📝', '<b>Croquis</b> con medidas y hacia dónde abre')],
  lambda i: i, top=280, izq=300, der=300, tam=33)))

E.append(dict(frases=[
  'Ahora, las holguras: el espacio que dejas para que todo entre y se mueva.',
  'Entre el marco y el muro, unos cinco milímetros por lado, para poder aplomarlo y fijarlo. Así, el marco se fabrica unos diez milímetros más chico que el vano.',
  'Entre la hoja y el marco, unos tres milímetros a los costados y arriba, para que no roce cuando se pinte.',
  'Y abajo, entre la hoja y el piso, de diez a quince milímetros, según el piso que vaya a llevar.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('Las <span class="nar">holguras</span>', top=110) + tabla(
  ['Dónde', 'Holgura típica'], [['Marco – muro (cada lado)', '≈ 5 mm'], ['Hoja – marco (costados y arriba)', '≈ 3 mm'], ['Hoja – piso', '10 a 15 mm']],
  lambda i: i + 1, top=280, izq=360, der=360, tam=35, nota='Referencias de taller. Ajusta según el tipo de piso, pintura y bisagras.') +
 badge('MARCO ≈ VANO − 10 mm', 1, 760, 640, '#3f9e5a', '✓', mas=2)))

E.append(dict(frases=[
  'Ejemplo: la puerta de calle de nuestra casa. Vano medido: cero ochenta y ocho por dos diez, usando las medidas más chicas.',
  'Marco: diez milímetros menos en ancho, y cinco menos en alto, porque abajo no lleva holgura con el muro: ochocientos setenta por dos mil noventa y cinco.',
  'Y la hoja: el ancho interior del marco menos seis milímetros, y el alto interior menos tres arriba y doce abajo. Con esas medidas, la puerta entra, abre y cierra sin rozar.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">la puerta de calle</span>', top=110) + lista([
  ('📏', 'Vano (medida menor): <b>880 × 2100 mm</b>'), ('🔲', 'Marco: <b class="nar">870 × 2095 mm</b>'), ('🚪', 'Hoja: ancho interior − 6 mm · alto interior − 3 arriba − 12 abajo')],
  lambda i: i, top=280, izq=300, der=300, tam=33)))

E.append(dict(frases=[
  'Los cinco errores al medir.',
  'Uno: medir una sola vez, por el medio.',
  'Dos: fabricar con la medida más grande.',
  'Tres: no revisar diagonales ni plomo del vano.',
  'Cuatro: olvidar las holguras.',
  'Y cinco: no anotar hacia dónde abre. Una puerta que abre al revés es una puerta nueva.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al medir</span>', [
  ('Una sola medida', 'Los vanos nunca son perfectos.'), ('La medida mayor', 'No entra.'), ('Sin diagonales ni plomo', 'Marco chueco o forzado.'),
  ('Sin holguras', 'No entra, o roza al pintar.'), ('Sin sentido de apertura', 'Abre al revés.')])))

E.append(dict(frases=[
  'Tu reto: mide un vano de tu casa o de un trabajo: ancho en tres alturas, alto en tres puntos y las dos diagonales. Calcula las medidas del marco.',
  'En la próxima clase: el despiece, y cómo sacar el máximo de cada barra de seis metros.',
], html=reto('📏 Mide un vano: 3 anchos, 3 altos y 2 diagonales<br><b class="nar">calcula el marco</b>', 'DESPIECE')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: tres medidas, la más chica, y las holguras. Así todo entra a la primera.',
  '¡Nos vemos en la clase dos!',
], html=final('Mide tres veces, <span class="nar">corta una</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'carp_c1')
