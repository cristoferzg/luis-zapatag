"""Techos a Dos y Cuatro Aguas · Clase 8: Metrado y presupuesto del techo (cierre del módulo principal)."""
from techo_comun import *

CURSO = 'TECHOS A DOS Y CUATRO AGUAS · CLASE 8'
E = []
T = 'font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke"'

E.append(dict(antes=0.5, frases=[
  '"Maestro, ¿cuánto me cobra por el techo?"',
  'Si respondes a ojo, o te quedas sin ganancia, o pierdes el trabajo por cobrar de más.',
  'Hoy haces el metrado completo del techo, y armas el presupuesto con números reales. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('¿Cuánto cuesta', 'este techo?', 8, 'METRADO', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.6" style="position:absolute;left:1240px;top:300px;font-size:220px">🧮</div>')))

E.append(obra(7, [
  'Ya diseñaste el taller a dos aguas y la casa a cuatro aguas.',
  'Hoy, en la última clase del módulo principal: el metrado y el presupuesto.',
], 'Hoy: <span class="nar">metrado y presupuesto</span>'))

E.append(dict(frases=[
  'Empecemos por el área de cobertura, con un truco que ahorra mucho trabajo.',
  'Si todos los faldones tienen la misma pendiente, el área real del techo es el área en planta por el factor de inclinación.',
  'Sirve igual para dos aguas que para cuatro aguas, y ya incluye los aleros si mides la planta del techo, no la de los muros.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 50)], html=titulo('El truco <span class="nar">del área</span>', top=100) +
  '<div class="tarjeta pop" data-en="1" style="position:absolute;left:380px;right:380px;top:320px;text-align:center;font-size:44px;font-weight:900">área real = <span class="nar">área en planta × factor</span></div>' +
  badge('MIDE LA PLANTA DEL TECHO, CON ALEROS', 2, 600, 520, '#2b7fb3', '📐')))

E.append(dict(frases=[
  'El taller: diez metros de luz más sesenta centímetros de alero a cada lado, once veinte. Y dieciséis de largo más treinta centímetros de alero en cada frontis, dieciséis sesenta.',
  'En planta: once veinte por dieciséis sesenta, ciento ochenta y cinco coma nueve metros cuadrados.',
  'Por el factor de veinticinco por ciento, uno coma cero tres uno: ciento noventa y uno coma siete metros cuadrados de cobertura.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Área: <span class="nar">el taller</span>', top=100) + tabla(
  ['Dato', 'Cálculo', 'Resultado'],
  [['Ancho con aleros', '10 + 2 × 0.60', '11.20 m'], ['Largo con aleros', '16 + 2 × 0.30', '16.60 m'], ['Área en planta', '11.20 × 16.60', '185.9 m²'], ['<b class="nar">Área real</b>', '185.9 × 1.031', '<b class="nar">191.7 m²</b>']],
  lambda i: [0, 0, 1, 2][i], top=260, izq=300, der=300, tam=33)))

E.append(dict(frases=[
  'La casa: techo de nueve por trece, ciento diecisiete metros cuadrados en planta. Por el factor de treinta por ciento, uno coma cero cuatro cuatro: ciento veintidós coma uno.',
  'Comprobemos el truco por faldones: los dos trapecios suman setenta y seis y medio en planta, y los dos triángulos, cuarenta y medio. Total, ciento diecisiete. Igual.',
  'Pero ojo: en cuatro aguas los cortes en las limatesas generan más desperdicio. Lo calculamos en la clase diez.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Área: <span class="nar">la casa</span>', top=100) + tabla(
  ['Faldón', 'En planta', 'Real (× 1.044)'],
  [['2 trapecios', '2 × (13 + 4) ÷ 2 × 4.5 = 76.5 m²', '79.9 m²'], ['2 triángulos', '2 × 9 × 4.5 ÷ 2 = 40.5 m²', '42.3 m²'], ['<b class="nar">Total</b>', '117.0 m²', '<b class="nar">122.1 m²</b>']],
  lambda i: [1, 1, 0][i], top=260, izq=220, der=220, tam=31)))

E.append(dict(frases=[
  'Ahora, las planchas del taller. El largo de cada plancha es el largo del faldón con alero: cinco setenta y siete. Se piden cortadas a medida, por ejemplo a cinco ochenta.',
  'El número de planchas por faldón: el largo del techo entre el ancho útil de la plancha. Si el ancho útil es de un metro, confírmalo con tu proveedor, dieciséis sesenta entre uno: diecisiete planchas.',
  'Por dos faldones: treinta y cuatro planchas de cinco ochenta.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Las <span class="nar">planchas</span>', top=100) + tabla(
  ['Dato', 'Cálculo', 'Resultado'],
  [['Largo de plancha', 'faldón con alero 5.77 m', '5.80 m'], ['Planchas por faldón', '16.60 ÷ 1.00 útil', '17'], ['<b class="nar">Total</b>', '17 × 2', '<b class="nar">34 planchas</b>']],
  lambda i: [0, 1, 2][i], top=270, izq=280, der=280, tam=33, nota='Ancho útil de ejemplo: usa el de la ficha de tu plancha.')))

E.append(dict(frases=[
  'Los accesorios, que casi siempre se olvidan.',
  'La cumbrera, o caballete: dieciséis sesenta metros. La cenefa en los dos aleros: treinta y tres metros. Y las canaletas, otros treinta y tres.',
  'Los pernos autoperforantes: cuenta cuántas veces cruza cada plancha una correa. Con seis filas de correas por faldón y, por ejemplo, tres pernos en cada cruce: treinta y cuatro por seis por tres, seiscientos doce. Más diez por ciento de reserva: unos seiscientos setenta y cinco.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Los <span class="nar">accesorios</span>', top=100) + tabla(
  ['Accesorio', 'Cálculo', 'Cantidad'],
  [['Cumbrera', 'largo del techo', '16.6 m'], ['Cenefa', '2 × 16.6', '33.2 m'], ['Canaletas', '2 × 16.6', '33.2 m'], ['Pernos', '34 × 6 × 3 + 10 %', '≈ 675']],
  lambda i: [1, 1, 1, 2][i], top=250, izq=300, der=300, tam=33, nota='Pernos por cruce: según la ficha del fabricante.')))

E.append(dict(frases=[
  'Y el acero. Cada tijeral tiene treinta y cuatro metros de tubo según la lista de cortes, más uno veinticuatro de los aleros: unos treinta y cinco metros. Por cinco tijerales, ciento setenta y cinco metros.',
  'Las correas: doce filas, seis por faldón, de dieciséis sesenta metros. Ciento noventa y nueve metros.',
  'Cada tramo se multiplica por el peso por metro de su perfil, que está en el catálogo de perfiles de InnovApp. Así sacas los kilos, que es como se compra el acero.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El <span class="nar">acero</span>', top=100) + tabla(
  ['Partida', 'Cálculo', 'Metros'],
  [['Tijerales', '5 × (33.8 + 1.2)', '≈ 175 m'], ['Correas', '12 filas × 16.6', '≈ 199 m'], ['<b class="nar">Kilos</b>', 'metros × kg/m del perfil', '<b class="nar">catálogo</b>']],
  lambda i: i, top=270, izq=300, der=300, tam=34)))

E.append(dict(frases=[
  'Con el metrado listo, el presupuesto se arma igual que en cualquier obra metálica, como viste en el curso de Naves.',
  'Materiales: acero, cobertura, accesorios, pernos y pintura. Mano de obra: fabricación y montaje. Equipos: andamios, izaje y transporte.',
  'Sobre el costo directo, los gastos generales y la utilidad. Y siempre con los precios de tu zona.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El <span class="nar">presupuesto</span>', top=100) + lista([
  ('🧱', '<b class="nar">Materiales</b>: acero, cobertura, accesorios, pernos, pintura'), ('👷', '<b class="nar">Mano de obra</b>: fabricación y montaje'),
  ('🏗️', '<b class="nar">Equipos</b>: andamios, izaje, transporte'), ('📈', '<b class="nar">Gastos generales y utilidad</b>')],
  lambda i: [1, 1, 1, 2][i], top=250, izq=300, der=300, tam=34)))

E.append(dict(frases=[
  'Los cinco errores en el metrado del techo.',
  'Uno: usar el área en planta, sin el factor.',
  'Dos: olvidar los aleros.',
  'Tres: dividir entre el ancho total de la plancha, en vez del útil.',
  'Cuatro: olvidar cumbrera, cenefa, canaletas y pernos.',
  'Y cinco: en cuatro aguas, no sumar el desperdicio de los cortes.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">en el metrado</span>', [
  ('Área sin factor', 'Faltan planchas.'), ('Sin aleros', 'Techo incompleto.'), ('Ancho total', 'Usa el ancho útil.'),
  ('Sin accesorios', 'Se comen la ganancia.'), ('Sin desperdicio', 'Cuatro aguas corta más.')])))

temas = ['Tipos y partes', 'La pendiente', 'El tijeral', 'Trazo y armado', 'Los apoyos', 'Los aleros', 'Cuatro aguas', 'Metrado y presupuesto']
E.append(dict(frases=[
  '¡Terminaste el módulo principal! Ya puedes diseñar, fabricar y presupuestar un techo a dos y a cuatro aguas.',
  'Ahora viene el módulo avanzado: coberturas, cortes y remates del cuatro aguas, limahoyas y techos en L, y aislamiento térmico y acústico.',
  'Tu reto antes de seguir: calcula el área real de cobertura de la casa del reto anterior, de diez por catorce con treinta por ciento. Mándala por WhatsApp.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¡Módulo principal <span class="nar">completado</span>!', top=100) + '<div style="position:absolute;left:260px;right:260px;top:220px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px">' +
  ''.join(f'<div class="ap" data-en="0" data-mas="{0.3*i:.2f}" style="display:flex;gap:12px;align-items:center;background:rgba(126,224,138,.08);border:2px solid rgba(126,224,138,.5);border-radius:16px;padding:14px 16px;font-size:24px;font-weight:800"><span style="background:#3f9e5a;border-radius:50%;width:38px;height:38px;display:grid;place-items:center;flex:none">✓</span>{i+1}. {t}</div>' for i, t in enumerate(temas)) +
  '</div><div class="paso pop" data-en="1" style="position:absolute;left:50%;transform:translateX(-50%);top:470px;font-size:26px"><b>→</b>PRÓXIMA: COBERTURAS</div>'
  f'<div class="tarjeta ap" data-en="2" style="position:absolute;left:420px;right:420px;top:570px;text-align:center;font-size:30px">🧮 Techo de 10 × 14 m · 30 %: <b class="nar">área real</b><div style="font-size:24px;color:#c9d6e3;margin-top:8px">💬 WhatsApp <b class="nar">{WA}</b></div></div>'))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: área en planta por el factor, ancho útil, y todos los accesorios.',
  '¡Nos vemos en la clase nueve!',
], html=final('Metrado completo, <span class="nar">ganancia segura</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_c8')
