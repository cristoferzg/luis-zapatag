"""Portones Automáticos · Clase 5: Portones batientes."""
from porton_comun import *

CURSO = 'PORTONES AUTOMÁTICOS · CLASE 5'
E = []

E.append(dict(antes=0.5, frases=[
  'El brazo empuja con fuerza la hoja... y el que se mueve es el pilar. El ladrillo se raja y el portón queda colgando.',
  'En los batientes, el motor, las bisagras y el pilar trabajan juntos. Si uno falla, falla todo.',
  'Hoy automatizas un portón batiente de dos hojas. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=CSS_P + batiente_planta(cx=1350, y=620, L=230, en=0, brazos=False) +
  '<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,12,22,.92) 0%,rgba(3,12,22,.55) 45%,rgba(3,12,22,0) 70%)"></div>' +
  gancho('El brazo empuja', 'y se mueve el pilar', 5, 'BATIENTES', soldando=False)))

E.append(obra(4, [
  'Nuestra cochera usa corredizo, pero muchos clientes tienen batientes.',
  'Hoy vemos el mismo vano de tres sesenta con dos hojas de uno ochenta.',
], 'Variante: <span class="nar">2 hojas de 1.80 × 2.40 m</span>'))

E.append(dict(frases=[
  'Hay tres tipos de motor para batientes.',
  'El brazo articulado, que se dobla como un codo: ideal cuando el pilar es ancho y la bisagra queda lejos de la esquina.',
  'El pistón o motor lineal, que empuja en línea recta: el más usado en casas, para hojas de hasta unos dos metros y medio.',
  'Y el motor enterrado bajo la bisagra: no se ve, pero cuesta más y pide un buen drenaje para que no se inunde.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Tres <span class="nar">motores</span>', top=90) + tarjetas([
  ('💪', 'Brazo articulado', 'Pilares anchos<br>bisagra lejos'), ('➡️', 'Pistón lineal', 'El más usado<br>en casas'), ('⬇️', 'Enterrado', 'No se ve<br><b class="nar">necesita drenaje</b>')],
  lambda i: [1, 2, 3][i], top=270, cols=3, alto=300, izq=240)))

E.append(dict(frases=[
  'Con el pistón, todo depende de dos medidas: la cota A y la cota B. Son las distancias desde el eje de la bisagra hasta el soporte trasero del pistón.',
  'Con ellas cambias el ángulo de apertura y la velocidad. El manual trae una tabla: buscas la apertura que quieres, por ejemplo noventa grados, y te da A y B.',
  'Si las inventas, la hoja no abre completo o el pistón llega al final de su carrera y se fuerza.',
], zoom=[(0, 1.0, 50, 50), (1, 1.08, 45, 55)], html=titulo('Cotas <span class="nar">A y B</span>', top=90) + svg(
  '<rect x="560" y="420" width="140" height="300" fill="#5b4a3f"/>'
  '<rect x="700" y="420" width="560" height="22" fill="#f97316" rx="4"/>'
  '<circle cx="700" cy="431" r="12" fill="#fff"/>'
  '<rect x="620" y="520" width="30" height="30" fill="#2b3a47" stroke="#f97316" stroke-width="4"/>'
  '<line x1="650" y1="535" x2="1000" y2="450" stroke="#9aa5ae" stroke-width="22" stroke-linecap="round"/>'
  f'<g class="ap" data-en="0"><line x1="635" y1="600" x2="700" y2="600" stroke="#ffd166" stroke-width="4"/><text x="668" y="645" fill="#ffd166" font-size="34" {T} text-anchor="middle">A</text>'
  f'<line x1="750" y1="431" x2="750" y2="535" stroke="#ffd166" stroke-width="4"/><text x="790" y="500" fill="#ffd166" font-size="34" {T}>B</text></g>'
  f'<text class="ap" data-en="1" x="1300" y="560" fill="#fff" font-size="32" {T}>tabla del manual:</text>'
  f'<text class="ap" data-en="1" data-mas="0.5" x="1300" y="610" fill="#ffd166" font-size="32" {T}>90° → A y B</text>')))

E.append(dict(frases=[
  'Las bisagras cargan todo el peso de la hoja. Usa bisagras robustas, de rodamiento, bien alineadas en el mismo eje.',
  'Prueba sin motor: la hoja debe girar suave con una mano y quedarse quieta en cualquier posición. Si se abre o se cierra sola, el eje no está a plomo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Bisagras <span class="nar">a plomo</span>', top=90) + tarjetas([
  ('🔩', 'Robustas', 'De rodamiento<br>para el peso'), ('📏', 'Mismo eje', 'Alineadas<br><b class="nar">a plomo</b>'), ('⏸️', 'Prueba', 'Se queda quieta<br>en cualquier punto')],
  lambda i: [0, 0, 1][i], top=270, cols=3, alto=300, izq=240)))

E.append(dict(frases=[
  'El pilar recibe el empujón del pistón cada vez que abre y cierra. Tiene que ser una columna de concreto o un tubo metálico bien anclado.',
  'Nunca fijes el soporte en un ladrillo hueco ni en tarrajeo. Ahí está el pilar rajado del inicio de la clase.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El pilar: <span class="nar">firme</span>', top=90) + lista([
  ('✅', 'Columna de <b class="nar">concreto</b> o tubo metálico <b class="nar">anclado</b>'), ('❌', 'Nunca en <b>ladrillo hueco</b> ni tarrajeo')],
  lambda i: i, top=300, izq=380, der=380, tam=35)))

E.append(dict(frases=[
  'Dos detalles que separan al maestro del improvisado.',
  'Topes en el piso: uno al centro, donde se juntan las hojas, y otro al final de la apertura. El motor no debe ser el que frene.',
  'Y el retardo: en dos hojas con traslape, la que lleva la pestaña cierra unos segundos después. Se programa en la tarjeta. Si hay viento o las hojas son largas, suma una cerradura electromagnética.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Detalles <span class="nar">de maestro</span>', top=90) + lista([
  ('🛑', '<b class="nar">Topes en el piso</b>: centro y apertura'), ('⏱️', '<b class="nar">Retardo</b>: la hoja con pestaña cierra después'),
  ('🧲', 'Viento u hojas largas: <b class="nar">cerradura electromagnética</b>')],
  lambda i: [1, 2, 2][i], top=270, izq=320, der=320, tam=33)))

E.append(dict(frases=[
  'Así queda la variante batiente de nuestra cochera. Dos hojas de uno ochenta por dos cuarenta, de unos cien kilos cada una.',
  'Dos pistones que admiten hojas de al menos dos metros y doscientos kilos, cotas A y B para noventa grados, pilares de concreto, topes y retardo.',
  'Ojo: necesita un motor por hoja, por eso cuesta más que el corredizo. Y las hojas abren hacia adentro: el auto debe caber con las hojas abiertas.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=CSS_P + titulo('La variante: <span class="nar">batiente</span>', top=80) +
  batiente_planta(cx=960, y=690, L=250, en=0) + tabla(['Hojas', 'Pistones', 'Apertura'], [['2 × 1.80 m · ≈ 100 kg', '≥ 2 m y 200 kg c/u', '90° (cotas A y B)']],
  lambda i: 1, top=200, izq=330, der=330, tam=29)))

E.append(dict(frases=[
  'Los cinco errores en batientes.',
  'Uno: inventar las cotas A y B.',
  'Dos: fijar el pistón en ladrillo hueco.',
  'Tres: bisagras fuera de plomo.',
  'Cuatro: sin topes en el piso.',
  'Y cinco: no programar el retardo de las hojas.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('5 errores <span class="nar">en batientes</span>', [
  ('Cotas inventadas', 'No abre o se fuerza.'), ('Ladrillo hueco', 'Pilar rajado.'), ('Bisagras sin plomo', 'Se abre sola.'),
  ('Sin topes', 'El motor frena todo.'), ('Sin retardo', 'Las hojas chocan.')])))

E.append(dict(frases=[
  'Tu reto: busca la tabla de cotas A y B de un pistón y elige las medidas para que tu portón abra noventa grados.',
  'En la próxima clase: la instalación eléctrica.',
], html=reto('📐 Busca la <b class="nar">tabla de cotas A y B</b><br>y elige las de 90°', 'ELECTRICIDAD')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: motor, bisagras y pilar trabajan juntos.',
  '¡Nos vemos en la clase seis!',
], html=final('Pilar firme, <span class="nar">hoja a plomo</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'porton_c5')
