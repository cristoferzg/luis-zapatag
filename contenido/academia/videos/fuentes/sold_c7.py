"""Soldadura Estructural · Clase 7: Defectos e inspección (AWS D1.1) — pasa la revisión del inspector."""
from sold_comun import *

CURSO = 'SOLDADURA ESTRUCTURAL · CLASE 7'
E = []
P = '#7d8f9f'; S = '#f97316'

def defecto(nombre, svg_int, causa, en):
    return (f'<div class="tarjeta pop" data-en="{en}" style="text-align:center;padding:14px 10px">'
            f'<svg width="260" height="150" viewBox="0 0 260 150"><rect x="0" y="70" width="260" height="60" fill="{P}"/>{svg_int}</svg>'
            f'<div style="font-size:28px;font-weight:900">{nombre}</div><div style="font-size:21px;color:#c9d6e3;margin-top:4px">{causa}</div></div>')

C = f'<path d="M20 70 Q130 30 240 70 Z" fill="{S}"/>'
DEF1 = [
  ('Fisura', C + '<path d="M60 58 l20 6 l15 -8 l20 9 l18 -7 l22 8" stroke="#0b0b0b" stroke-width="4" fill="none"/>', 'Nunca se acepta'),
  ('Poros', C + ''.join(f'<circle cx="{x}" cy="{y}" r="5" fill="#0b2a45"/>' for x, y in [(70, 58), (110, 52), (150, 56), (185, 60), (95, 62)]), 'Sucio, húmedo o arco largo'),
  ('Socavación', C + '<path d="M10 70 q10 10 22 0" stroke="#0b2a45" stroke-width="7" fill="none"/><path d="M228 70 q10 10 22 0" stroke="#0b2a45" stroke-width="7" fill="none"/>', 'Mordedura: amperaje alto'),
  ('Traslape', f'<path d="M40 70 Q130 20 250 60 L250 76 L215 76 Z" fill="{S}"/>', 'Cordón que "cae" sin fundir'),
]
DEF2 = [
  ('Falta de fusión', C + '<line x1="22" y1="70" x2="60" y2="70" stroke="#0b0b0b" stroke-width="6"/>', 'No se pegó a la plancha'),
  ('Escoria atrapada', C + '<ellipse cx="130" cy="58" rx="30" ry="7" fill="#3a2a1d"/>', 'No picaste entre pasadas'),
  ('Cráter', C + '<ellipse cx="225" cy="60" rx="18" ry="8" fill="#0b2a45"/>', 'Terminaste sin llenarlo'),
  ('Filete chico', '<path d="M70 70 Q130 52 190 70 Z" fill="' + S + '"/>', 'Menos de lo que pide el plano'),
]

E.append(dict(antes=0.5, frases=[
  'Llega el inspector. Una linterna, una lupa y una galga...',
  '...y en diez minutos decide si tu trabajo se aprueba, o si hay que picar y volver a soldar.',
  'Hoy aprendes a ver los defectos como él, antes que él. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Llega', 'el inspector', 7, 'DEFECTOS E INSPECCIÓN')))

E.append(escena_obra(6, [
  'En nuestro almacén ya soldamos los siete arcos sin torcerlos.',
  'Antes de pintar y montar, toca la inspección. Lo que se pinta con defectos, se esconde, pero no se arregla.',
], 'Hoy: <span class="nar">inspección visual con AWS D1.1</span>'))

E.append(dict(frases=[
  'La inspección visual se hace en tres momentos, no solo al final.',
  'Antes: revisa la junta, el bisel, la limpieza, el electrodo y que esté seco.',
  'Durante: cada pasada limpia, sin escoria, y con el amperaje correcto.',
  'Después: el cordón terminado, con la galga y la linterna. Esto es lo que hoy vamos a aprender a mirar.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Inspección en <span class="nar">3 momentos</span>', top=110) + tarjetas([
  ('🔍', 'Antes', 'Junta, bisel, limpieza y electrodo seco'), ('🔥', 'Durante', 'Pasadas limpias y amperaje correcto'), ('📏', 'Después', 'Cordón terminado: galga y linterna')],
  lambda i: i + 1, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Estos son los defectos que vas a encontrar. Fisura: una grieta en el cordón. Es el peor defecto, y no se acepta nunca.',
  'Poros: agujeritos de gas. Salen por suciedad, humedad del electrodo o arco largo.',
  'Socavación, o mordedura: una canaleta al borde del cordón, que adelgaza la plancha. Sale por amperaje alto o mal ángulo.',
  'Y traslape: metal que se derrama sobre la plancha sin fundirse con ella.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Los defectos <span class="nar">(1)</span>', top=110) +
 '<div style="position:absolute;left:120px;right:120px;top:290px;display:grid;grid-template-columns:repeat(4,1fr);gap:22px">' + ''.join(defecto(n, s, c, i) for i, (n, s, c) in enumerate(DEF1)) + '</div>'))

E.append(dict(frases=[
  'Más defectos. Falta de fusión: el cordón está encima, pero no se pegó a la plancha.',
  'Escoria atrapada: quedó escoria adentro, porque no se picó entre pasadas.',
  'Cráter sin llenar: el hueco del final del cordón. Ahí nacen las fisuras.',
  'Y filete chico: menos tamaño del que pide el plano. Se ve bonito, pero no aguanta lo que debe.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Los defectos <span class="nar">(2)</span>', top=110) +
 '<div style="position:absolute;left:120px;right:120px;top:290px;display:grid;grid-template-columns:repeat(4,1fr);gap:22px">' + ''.join(defecto(n, s, c, i) for i, (n, s, c) in enumerate(DEF2)) + '</div>'))

E.append(dict(frases=[
  '¿Qué tanto acepta la norma? Estos son criterios de la AWS D uno punto uno para estructuras con carga estática, en inspección visual.',
  'Fisuras: ninguna. Fusión: completa entre el cordón y la plancha. Cráteres: llenos.',
  'Socavación: en planchas de menos de veinticinco milímetros, hasta un milímetro de profundidad.',
  'Y el filete puede quedar hasta unos dos milímetros más chico, pero solo en un tramo corto: no más del diez por ciento del largo del cordón.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('¿Qué acepta <span class="nar">la norma</span>?', top=110) + tabla(
  ['Revisión', 'Criterio (carga estática)'],
  [['Fisuras', '<b style="color:#ff6b6b">Ninguna</b>'], ['Fusión', 'Completa'], ['Cráteres', 'Llenos'], ['Socavación (plancha &lt; 25 mm)', 'Hasta 1 mm'], ['Filete más chico', '≈ 2 mm, máx. 10 % del largo']],
  lambda i: [1, 1, 1, 2, 3][i], top=260, izq=330, der=330, tam=32,
  nota='Resumen de criterios de inspección visual AWS D1.1. Para cargas cíclicas o casos especiales, la norma es más exigente: consulta el plano y al ingeniero.')))

E.append(dict(frases=[
  'Las herramientas del inspector son sencillas, y tú también deberías tenerlas.',
  'Una linterna, para mirar el cordón de costado y ver las mordeduras y los poros.',
  'Una lupa, para las fisuras chiquitas.',
  'Y una galga de filetes: la pones en la esquina y te dice el tamaño del filete en un segundo.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Tus herramientas <span class="nar">de inspección</span>', top=110) + tarjetas([
  ('🔦', 'Linterna', 'Luz de costado: mordeduras y poros'), ('🔍', 'Lupa', 'Fisuras pequeñas'), ('📐', 'Galga de filetes', 'Tamaño del filete en un segundo'), ('📏', 'Wincha', 'Largo de cordones y medidas')],
  lambda i: [1, 2, 3, 3][i])))

E.append(dict(frases=[
  'Si encuentras un defecto, se repara bien. Fisura: esmerila hasta que desaparezca por completo, y vuelve a soldar.',
  'Poros o escoria: esmerila esa zona y vuelve a soldar.',
  'Socavación: rellénala con un cordón fino. Filete chico: agrégale una pasada.',
  'Y cuando el cordón debe tener penetración completa, como el empalme del arco, se puede pedir un ensayo: tintes penetrantes, partículas magnéticas o ultrasonido.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Cómo <span class="nar">reparar</span>', top=110) + lista([
  ('🪚', '<b>Fisura</b>: esmerila hasta eliminarla y vuelve a soldar'), ('🫧', '<b>Poros o escoria</b>: esmerila la zona y resuelda'),
  ('➕', '<b>Socavación</b>: cordón fino · <b>Filete chico</b>: una pasada más'), ('🧪', 'Penetración completa: <b>tintes, partículas magnéticas o ultrasonido</b>')],
  lambda i: i, top=260, izq=260, der=260, tam=30)))

E.append(dict(frases=[
  'Ejemplo en el almacén. Revisamos la placa base de una columna. El plano pide filete de cinco milímetros.',
  'Con la galga: en casi todo el contorno mide cinco. En una esquina mide cuatro, en unos dos centímetros. Es menos del diez por ciento: se acepta.',
  'Pero con la linterna aparece un poro grande al final de un cordón, y el cráter sin llenar. Eso se esmerila y se vuelve a soldar, antes de pintar.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">placa base</span>', top=110) + lista([
  ('📐', 'Plano: filete de <b>5 mm</b>'), ('✅', 'Esquina con 4 mm en 2 cm · menos del 10 % → <b style="color:#7ee08a">se acepta</b>'),
  ('❌', 'Poro grande + cráter sin llenar → <b style="color:#ff6b6b">esmerilar y resoldar</b>')], lambda i: i, top=270, izq=300, der=300, tam=32)))

E.append(dict(frases=[
  'Los cinco errores frente al inspector.',
  'Uno: pintar antes de inspeccionar. El defecto se tapa, pero sigue ahí.',
  'Dos: esmerilar el cordón para que "se vea bonito", y dejarlo más chico de lo que pide el plano.',
  'Tres: no picar la escoria final. El inspector no puede ver el cordón.',
  'Cuatro: reparar una fisura sin eliminarla completa.',
  'Y cinco: no anotar nada. Lleva un registro simple: qué se soldó, quién, con qué electrodo, y qué se reparó.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">ante el inspector</span>', [
  ('Pintar antes de inspeccionar', 'El defecto queda escondido.'), ('Esmerilar de más', 'El filete queda más chico.'), ('Escoria sin picar', 'No se puede inspeccionar.'),
  ('Fisura mal reparada', 'Vuelve a abrirse.'), ('Sin registro', 'No puedes demostrar tu trabajo.')])))

E.append(dict(frases=[
  'Tu reto: con el checklist de inspección del curso, revisa cinco cordones tuyos. Anota qué encontraste y cómo lo reparaste.',
  'En la próxima y última clase: soldar en obra, y cómo calcular y cobrar bien la soldadura.',
], html=reto('📋 Con el checklist del curso, revisa 5 cordones:<br><b class="nar">qué encontraste · cómo lo reparaste</b>', 'EN OBRA Y COSTOS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el mejor inspector de tu soldadura eres tú. Revisa antes de que te revisen.',
  '¡Nos vemos en la clase ocho!',
], html=final('Revisa antes <span class="nar">de que te revisen</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'sold_c7')
