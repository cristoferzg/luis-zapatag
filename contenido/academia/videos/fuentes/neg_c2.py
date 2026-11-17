"""El Negocio del Metalero · Clase 2: Cuánto cuesta tu hora de taller."""
from neg_comun import *

CURSO = 'EL NEGOCIO DEL METALERO · CLASE 2'
E = []

E.append(dict(antes=0.5, frases=[
  '¿Cuánto cuesta una hora de tu taller? La mayoría responde con lo que cobra un ayudante por día... y se equivoca.',
  'Tu hora carga el alquiler, la luz, el desgaste de la máquina, el celular, el transporte, y tu propio sueldo.',
  'Hoy la calculas con tus números reales. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('¿Cuánto cuesta', 'tu hora de taller?', 2, 'TU HORA', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">⏱️</div>')))

E.append(obra(1, [
  'Ya sabes por qué el taller debe manejarse con números.',
  'Hoy: el primer número, el costo de tu hora. Con él vamos a cotizar la cochera.',
], 'Hoy: <span class="nar">el costo de tu hora</span>'))

E.append(dict(frases=[
  'Primero, los costos fijos: los que pagas al mes aunque no tengas obra.',
  'Por ejemplo: alquiler del taller, ochocientos soles. Luz, doscientos cincuenta. Agua, internet y celular, ciento veinte. Transporte, trescientos.',
  'El desgaste de tus equipos: si tienes doce mil soles en máquinas que duran unos cuatro años, separa doscientos cincuenta al mes para reponerlas.',
  'Más mantenimiento y otros gastos, ciento ochenta. Total: mil novecientos soles al mes.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Tus <span class="nar">costos fijos</span>', top=90) + tabla(
  ['Costo fijo mensual', 'S/'],
  [['Alquiler del taller', '800'], ['Luz', '250'], ['Agua, internet, celular', '120'], ['Transporte', '300'], ['Desgaste de equipos (12 000 ÷ 48 meses)', '250'],
   ['Mantenimiento y otros', '180'], ['<b class="nar">Total</b>', '<b class="nar">1 900</b>']],
  lambda i: [1, 1, 1, 1, 2, 3, 3][i], top=190, izq=440, der=440, tam=29, nota='Números de ejemplo: pon los tuyos.')))

E.append(dict(frases=[
  'Segundo: tu sueldo. Tú también eres un trabajador del taller, y tu trabajo se paga.',
  'Pon lo que quieres ganar al mes como maestro, sin contar la utilidad del negocio. Por ejemplo, tres mil soles.',
  'Costos fijos más tu sueldo: cuatro mil novecientos soles al mes. Eso es lo que el taller debe cubrir, haya o no haya obra.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 50)], html=titulo('Tu <span class="nar">sueldo</span> también cuenta', top=100) +
  '<div class="tarjeta pop" data-en="2" style="position:absolute;left:460px;right:460px;top:330px;text-align:center;font-size:44px;font-weight:900">1 900 + 3 000 = <span class="nar">S/ 4 900 al mes</span></div>'))

E.append(dict(frases=[
  'Tercero: las horas que de verdad puedes cobrar.',
  'Si trabajas veintiséis días de ocho horas, son doscientas ocho horas. Pero no todas son de producción.',
  'Visitas, compras, traslados, cotizaciones y trámites se comen una buena parte. Con un setenta por ciento de horas productivas: unas ciento cuarenta y seis horas al mes.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Las horas <span class="nar">que se cobran</span>', top=100) + barras(
  [('Horas al mes', 208, '#5ec4ff'), ('Productivas (70 %)', 146, '#7ee08a'), ('No cobradas', 62, '#ff6b6b')],
  lambda i: [1, 2, 2][i], x0=460, base=650, ancho=1000, escala=1.75, etiqueta=lambda v: f'{v} h')))

E.append(dict(frases=[
  'Ahora sí: el costo de tu hora es lo que el taller debe cubrir al mes, dividido entre las horas productivas.',
  'Cuatro mil novecientos entre ciento cuarenta y seis: unos treinta y cuatro soles por hora.',
  'Ese número no incluye los materiales ni la utilidad. Es lo mínimo para no perder.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 50)], html=titulo('El costo <span class="nar">de tu hora</span>', top=100) +
  '<div class="tarjeta pop" data-en="0" style="position:absolute;left:400px;right:400px;top:300px;text-align:center;font-size:40px;font-weight:900">costo por hora = <span class="nar">(fijos + tu sueldo) ÷ horas productivas</span></div>'
  '<div class="tarjeta pop" data-en="1" style="position:absolute;left:520px;right:520px;top:460px;text-align:center;font-size:48px;font-weight:900">4 900 ÷ 146 ≈ <span class="nar">S/ 34 / hora</span></div>' +
  badge('SIN MATERIALES NI UTILIDAD', 2, 760, 620, '#c0392b', '!')))

E.append(dict(frases=[
  'Apliquémoslo a la cochera. Estimas cuarenta horas de taller entre fabricación e instalación, y veinte horas de ayudante.',
  'Tus cuarenta horas por treinta y cuatro: mil trescientos sesenta. El ayudante se cuenta aparte, con lo que le pagas: por ejemplo, veinte horas a quince soles, trescientos.',
  'A eso sumas materiales, consumibles y transporte de la obra. Y al final, la utilidad, que veremos en la clase cinco.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El caso: <span class="nar">la cochera</span>', top=100) + tabla(
  ['Partida', 'Cálculo', 'S/'],
  [['Tu taller', '40 h × 34', '1 360'], ['Ayudante', '20 h × 15', '300'], ['Materiales y consumibles', 'metrado', '+ ...'], ['Utilidad', 'clase 5', '+ ...']],
  lambda i: [1, 1, 2, 2][i], top=260, izq=330, der=330, tam=33)))

E.append(dict(frases=[
  'Un detalle: revisa este número cada seis meses, o cuando cambie algo grande, como el alquiler o una máquina nueva.',
  'Y si tienes muchas horas sin obra, no bajes tu precio por hora: busca más clientes. Eso lo vemos en el módulo avanzado.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Mantén <span class="nar">el número al día</span>', top=100) + lista([
  ('🔄', 'Revisa tu costo por hora <b class="nar">cada 6 meses</b>'), ('🏷️', 'Sin obra: <b class="nar">más clientes</b>, no menos precio')],
  lambda i: i, top=300, izq=380, der=380, tam=36)))

E.append(dict(frases=[
  'Los cinco errores al calcular tu hora.',
  'Uno: no pagarte un sueldo.',
  'Dos: olvidar el desgaste de las máquinas.',
  'Tres: contar todas las horas como productivas.',
  'Cuatro: meter la utilidad dentro del costo por hora.',
  'Y cinco: no actualizarlo nunca.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al calcular tu hora</span>', [
  ('Sin tu sueldo', 'Trabajas gratis.'), ('Sin desgaste de equipos', 'No podrás reponerlos.'), ('Todas las horas productivas', 'La hora sale barata.'),
  ('Utilidad dentro del costo', 'Luego no sabes cuánto ganas.'), ('Nunca actualizarlo', 'Los costos suben.')])))

E.append(dict(frases=[
  'Tu reto: con los gastos que anotaste en la semana, calcula tus costos fijos del mes, pon tu sueldo, y saca el costo de tu hora.',
  'En la próxima clase: la visita técnica.',
], html=reto('🧮 Tus costos fijos + tu sueldo ÷ tus horas productivas:<br><b class="nar">¿cuánto cuesta tu hora?</b>', 'LA VISITA TÉCNICA')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: sin el costo de tu hora, cualquier precio es una adivinanza.',
  '¡Nos vemos en la clase tres!',
], html=final('Conoce <span class="nar">tu hora</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'neg_c2')
