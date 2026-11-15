"""Carpintería Metálica · Clase 8: Ventanas de fierro con vidrio."""
from sold_comun import *

CURSO = 'CARPINTERÍA METÁLICA · CLASE 8'
ETAPAS_CARP_AV = ['Ventanas con vidrio', 'Toldos y techitos', 'Estanterías y muebles', 'Cercos']
E = []

def ventana(en, x, y, esc=1.0, rajado=False, mas=0):
    s = (f'<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="{460*esc}" height="{400*esc}" viewBox="0 0 460 400">'
         '<rect x="20" y="20" width="420" height="360" fill="none" stroke="#9aa6b0" stroke-width="22"/><rect x="44" y="44" width="372" height="312" fill="rgba(92,200,255,.25)" stroke="#5cc8ff" stroke-width="3"/>')
    if rajado: s += '<path d="M120 60 L180 160 L150 230 L230 320" stroke="#fff" stroke-width="4" fill="none"/>'
    return s + '</svg>'

E.append(dict(antes=0.5, frases=[
  'Instalaste una ventana impecable...',
  '...y a la semana, el vidrio amaneció rajado. Nadie lo tocó. El vidrio estaba apretado contra el fierro, y con el calor del sol, se partió.',
  'Hoy aprendes a fabricar ventanas de fierro con vidrio que duren. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Se rajó', 'solo', 8, 'VENTANAS CON VIDRIO', soldando=False) + ventana(0, 1250, 300, 0.9, rajado=True)))

E.append(escena_obra(0, [
  'Terminamos la casa. Ahora empieza el módulo avanzado de carpintería metálica, con los trabajos que más se piden después.',
  'Hoy: ventanas de fierro con vidrio.',
], 'Hoy: <span class="nar">ventanas con vidrio</span>', ETAPAS_CARP_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'Las partes. El marco, fijo al muro. Las hojas, que pueden ser fijas, batientes o corredizas.',
  'El junquillo: el ángulo o la platina que sujeta el vidrio por dentro.',
  'Los calzos: tacos de jebe o neopreno donde se apoya el vidrio. Y el sellado: silicona o masilla.',
  'La regla de oro: el vidrio nunca toca el fierro. Siempre hay un calzo, una goma o un sellador entre los dos.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Las <span class="nar">partes</span>', top=110) + ventana(0, 220, 270) + lista([
  ('🔲', '<b>Marco</b> y <b>hojas</b> (fijas, batientes o corredizas)'), ('📐', '<b>Junquillo</b>: sujeta el vidrio'), ('⬛', '<b>Calzos</b> de jebe · <b>sellado</b>'), ('🚫', 'El vidrio <b>nunca toca el fierro</b>')],
  lambda i: i, top=290, izq=760, der=120, tam=30)))

E.append(dict(frases=[
  'El vidrio se dilata con el calor, igual que el fierro, pero distinto. Por eso necesita holgura: unos tres a cinco milímetros por lado, entre el canto del vidrio y el marco.',
  'Abajo se apoya en dos calzos, cada uno a más o menos un cuarto del ancho desde las esquinas.',
  'Y el junquillo va atornillado, no soldado. Si lo sueldas, el día que se rompa el vidrio, no lo podrán cambiar sin cortar.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 60)], html=titulo('Holgura, calzos <span class="nar">y junquillo</span>', top=110) + '''
<svg style="position:absolute;left:520px;top:250px" width="880" height="500" viewBox="0 0 880 500">
 <rect x="40" y="40" width="800" height="420" fill="none" stroke="#9aa6b0" stroke-width="24"/>
 <rect x="70" y="70" width="740" height="360" fill="rgba(92,200,255,.25)" stroke="#5cc8ff" stroke-width="3"/>
 <g class="ap" data-en="0"><line x1="52" y1="250" x2="70" y2="250" stroke="#ffd166" stroke-width="5"/><text x="80" y="240" fill="#ffd166" font-size="26" font-weight="900">3–5 mm</text></g>
 <g class="ap" data-en="1"><rect x="230" y="430" width="50" height="18" fill="#1d2731" stroke="#ffd166" stroke-width="3"/><rect x="600" y="430" width="50" height="18" fill="#1d2731" stroke="#ffd166" stroke-width="3"/>
  <text x="440" y="495" fill="#ffd166" font-size="26" font-weight="900" text-anchor="middle">calzos a ¼ del ancho</text></g>
</svg>''' + badge('JUNQUILLO ATORNILLADO, NO SOLDADO', 2, 640, 800, '#3f9e5a', '🔩')))

E.append(dict(frases=[
  '¿Qué vidrio? Para paños chicos, vidrio de cuatro milímetros. Para paños más grandes, seis. El proveedor te dice el espesor según el tamaño.',
  'Y donde alguien puede chocar, como puertas, mamparas o ventanas hasta el piso, vidrio de seguridad: templado o laminado. Un vidrio común roto en esos lugares corta como cuchillo.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Qué <span class="nar">vidrio</span>?', top=110) + tabla(
  ['Lugar', 'Vidrio'], [['Paños chicos', '4 mm'], ['Paños más grandes', '6 mm (según el proveedor)'], ['Puertas, mamparas, ventanas al piso', '<b class="nar">Templado o laminado</b>']],
  lambda i: [0, 0, 1][i], top=290, izq=380, der=380, tam=34)))

E.append(dict(frases=[
  'Y el agua. El marco de abajo, el alféizar, debe botar el agua hacia afuera, con una pequeña pendiente o un goterón: una pestaña que corta la gota.',
  'Sella el contorno del marco con el muro, por fuera, con silicona o sellador. Y deja agujeritos de drenaje en las hojas corredizas, para que el agua de la lluvia salga.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Que no <span class="nar">entre el agua</span>', top=110) + tarjetas([
  ('↘️', 'Pendiente o goterón', 'El agua sale hacia afuera'), ('🧴', 'Sella el contorno', 'Marco con muro, por fuera'), ('💧', 'Drenajes', 'En las hojas corredizas')],
  lambda i: [0, 1, 1][i], top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Ejemplo: una ventana de uno veinte por uno, con una hoja batiente. La luz libre del bastidor de la hoja queda en mil cien por novecientos milímetros.',
  'Con cuatro milímetros de holgura por lado, el vidrio se pide de mil noventa y dos por ochocientos noventa y dos.',
  'Vidrio de cuatro milímetros, porque es un paño chico, dos calzos abajo, junquillo de ángulo atornillado, y silicona.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('En la obra: <span class="nar">ventana 1.20 × 1.00</span>', top=110) + lista([
  ('📏', 'Luz libre de la hoja: <b>1100 × 900 mm</b>'), ('🪟', 'Vidrio: <b class="nar">1092 × 892 mm</b> (4 mm de holgura por lado)'), ('⬛', 'Vidrio 4 mm · 2 calzos · junquillo atornillado · silicona')],
  lambda i: i, top=290, izq=300, der=300, tam=32)))

E.append(dict(frases=[
  'Los cinco errores con ventanas.',
  'Uno: el vidrio apretado, sin holgura.',
  'Dos: vidrio tocando el fierro, sin calzos.',
  'Tres: junquillo soldado.',
  'Cuatro: vidrio común donde alguien puede chocar.',
  'Y cinco: sin pendiente ni sellado, y entra el agua.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con ventanas</span>', [
  ('Vidrio apretado', 'Se raja con el calor.'), ('Vidrio contra el fierro', 'Se rompe en el canto.'), ('Junquillo soldado', 'No se puede cambiar el vidrio.'),
  ('Vidrio común en zona de choque', 'Corta como cuchillo.'), ('Sin pendiente ni sello', 'Entra el agua.')])))

E.append(dict(frases=[
  'Tu reto: calcula las medidas del vidrio para una hoja con luz libre de ochocientos por mil doscientos milímetros, con cuatro milímetros de holgura por lado. Y dinos qué vidrio usarías si es una puerta.',
  'En la próxima clase: toldos y techitos de policarbonato.',
], html=reto('🪟 Hoja con luz libre 800 × 1200 mm:<br><b class="nar">medidas del vidrio · ¿qué vidrio si es puerta?</b>', 'TOLDOS Y TECHITOS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el vidrio nunca toca el fierro, y siempre tiene su holgura.',
  '¡Nos vemos en la clase nueve!',
], html=final('Vidrio con holgura, <span class="nar">ventana que dura</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'carp_c8')
