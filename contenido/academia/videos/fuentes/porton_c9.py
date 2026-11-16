"""Portones Automáticos · Clase 9: Levadizos y seccionales."""
from porton_comun import *

CURSO = 'PORTONES AUTOMÁTICOS · CLASE 9'
E = []

E.append(dict(antes=0.5, frases=[
  'Un portón levadizo de doscientos kilos... y lo levanta un motor del tamaño de una caja de zapatos. ¿Cómo?',
  'El secreto no está en el motor: está en el contrapeso o en los resortes. El motor solo guía; el equilibrio hace la fuerza.',
  'Hoy aprendes a equilibrar y automatizar levadizos y seccionales. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('200 kg hacia arriba', 'con un motor pequeño', 9, 'LEVADIZOS', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">⤴️</div>')))

E.append(obra_av(0, [
  'Empieza el módulo avanzado.',
  'Hoy: portones que suben, el levadizo o basculante y el seccional.',
], 'Hoy: <span class="nar">portones que suben</span>'))

E.append(dict(frases=[
  'El levadizo o basculante es una sola hoja que gira y sube, y queda casi horizontal bajo el techo.',
  'El seccional son paneles articulados que suben por dos guías laterales y se acuestan bajo el techo. No invade la vereda ni el interior al abrir.',
  'Los dos necesitan altura libre sobre el vano, y un techo o vigas donde fijar las guías.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Levadizo <span class="nar">y seccional</span>', top=90) + tarjetas([
  ('⤴️', 'Levadizo', 'Una hoja que gira<br>y sube'), ('🪟', 'Seccional', 'Paneles que suben<br><b class="nar">sin invadir</b>'), ('📏', 'Ambos', 'Altura libre arriba<br>y techo firme')],
  lambda i: i, top=270, cols=3, alto=300, izq=240)))

E.append(dict(frases=[
  'La regla de oro: antes de motorizar, la hoja tiene que estar equilibrada.',
  'Pruébalo a mano: súbela hasta la mitad y suéltala. Si está bien equilibrada, se queda quieta, ni sube ni baja.',
  'Si cae, falta contrapeso o tensión en los resortes. Si sube sola, sobra. El motor nunca debe cargar el peso.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 55)], html=titulo('Regla de oro: <span class="nar">equilibrio</span>', top=90) + svg(
  '<rect x="760" y="280" width="60" height="460" fill="#5b4a3f"/><rect x="1100" y="280" width="60" height="460" fill="#5b4a3f"/>'
  '<g transform="rotate(-35 960 450)"><rect class="ap" data-en="1" x="820" y="440" width="280" height="22" fill="#f97316" rx="4"/></g>'
  f'<text class="ap" data-en="1" x="960" y="620" fill="#3f9e5a" font-size="36" {T} text-anchor="middle">a media altura: quieta ✓</text>'
  f'<text class="ap" data-en="2" x="960" y="690" fill="#ff6b6b" font-size="30" {T} text-anchor="middle">cae: falta · sube: sobra</text>')))

E.append(dict(frases=[
  'En el levadizo de taller, el equilibrio se logra con contrapesos que corren dentro de los parantes laterales, o con resortes.',
  'El contrapeso pesa más o menos lo mismo que la hoja, repartido a los dos lados. Se ajusta agregando o quitando planchas hasta lograr la prueba de la media altura.',
  'Y los cables o cadenas del contrapeso se revisan siempre: si uno se corta, la hoja cae.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Contrapesos <span class="nar">y resortes</span>', top=90) + lista([
  ('⚖️', 'Contrapeso <b class="nar">≈ peso de la hoja</b>, repartido a los 2 lados'), ('🔧', 'Ajusta con planchas hasta que <b class="nar">quede quieta</b>'),
  ('⛓️', 'Cables y cadenas: <b class="nar">revisar siempre</b>')],
  lambda i: i, top=280, izq=320, der=320, tam=33)))

E.append(dict(frases=[
  'En los seccionales, el equilibrio lo dan resortes de torsión, enrollados en un eje sobre el vano. Guardan muchísima energía.',
  'Si se rompen o se aflojan mal, pueden golpear y causar lesiones graves. El ajuste de esos resortes lo hace un técnico con las barras y el equipo adecuados.',
  'Por eso los seccionales se compran casi siempre como sistema completo de fábrica, y tú los instalas siguiendo su manual.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Resortes de torsión: <span class="nar">peligro</span>', top=90) +
  '<div class="tarjeta pop" data-en="0" style="position:absolute;left:400px;right:400px;top:280px;text-align:center;font-size:36px;font-weight:800">🌀 Guardan <span class="nar">mucha energía</span><br><span style="font-size:28px;color:#c9d6e3">ajuste solo por técnico con equipo adecuado</span></div>' +
  badge('NUNCA AFLOJES UN RESORTE SIN EQUIPO', 1, 560, 580, '#ff6b6b', '!')))

E.append(dict(frases=[
  'Para motorizarlos hay dos opciones. El motor de techo, con un riel y una cadena o correa que tira de la parte alta de la hoja: el más común en casas.',
  'O motores laterales, uno o dos, en los costados. Se usan cuando no hay espacio en el techo o la hoja es muy grande.',
  'Lleva las mismas seguridades del corredizo: fotoceldas, fuerza regulada, desbloqueo manual con cordón o llave, y luz.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El <span class="nar">motor</span>', top=90) + tarjetas([
  ('🔝', 'De techo', 'Riel + cadena o correa<br>el más común'), ('↔️', 'Laterales', 'Sin espacio arriba<br>u hoja grande'), ('🛡️', 'Seguridad', 'Fotoceldas · fuerza<br>desbloqueo · luz')],
  lambda i: i, top=270, cols=3, alto=300, izq=240)))

E.append(dict(frases=[
  'Un ejemplo. Una casa vecina a la cochera tiene un levadizo de dos cincuenta por dos diez, de unos ciento veinte kilos, con contrapesos.',
  'Primero lo equilibramos: le faltaban ocho kilos de contrapeso de cada lado. Recién entonces pusimos el motor de techo con su riel.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Ejemplo: <span class="nar">levadizo 2.50 × 2.10 m</span>', top=90) + tabla(
  ['Paso', 'Resultado'],
  [['Peso de la hoja', '≈ 120 kg'], ['Prueba de media altura', 'Caía: faltaba contrapeso'], ['Ajuste', '+ 8 kg por lado → quieta ✓'], ['Motor', 'De techo con riel']],
  lambda i: [0, 0, 1, 1][i], top=260, izq=360, der=360, tam=32)))

E.append(dict(frases=[
  'Los cuatro errores en portones que suben.',
  'Uno: motorizar sin equilibrar.',
  'Dos: tocar resortes de torsión sin equipo.',
  'Tres: no revisar cables y cadenas del contrapeso.',
  'Y cuatro: no medir la altura libre antes de ofrecerlo.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">en levadizos</span>', [
  ('Sin equilibrar', 'El motor carga todo.'), ('Resortes sin equipo', 'Lesiones graves.'), ('Cables sin revisar', 'La hoja puede caer.'), ('Sin medir altura', 'No entra.')])))

E.append(dict(frases=[
  'Tu reto: haz la prueba de la media altura en un levadizo que conozcas y anota si está equilibrado.',
  'En la próxima clase: control de acceso: teclados, tarjetas y abrir desde el celular.',
], html=reto('⚖️ Haz la <b class="nar">prueba de media altura</b><br>en un levadizo', 'CONTROL DE ACCESO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el equilibrio hace la fuerza, el motor solo guía.',
  '¡Nos vemos en la clase diez!',
], html=final('Primero <span class="nar">el equilibrio</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'porton_c9')
