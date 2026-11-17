"""Portones Automáticos · Clase 6: La instalación eléctrica."""
from porton_comun import *

CURSO = 'PORTONES AUTOMÁTICOS · CLASE 6'
E = []

E.append(dict(antes=0.5, frases=[
  'Una extensión que sale de la sala, un empalme con cinta debajo de la tierra... y la primera lluvia quema la tarjeta del motor.',
  'La parte eléctrica es la que menos se ve y la que más problemas da.',
  'Hoy ves cómo debe quedar la instalación eléctrica del portón. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Un empalme con cinta', 'y la tarjeta se quema', 6, 'ELECTRICIDAD', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">⚡</div>')))

E.append(obra(5, [
  'El motor ya está instalado y la cremallera engrana bien.',
  'Hoy: cómo llevar la energía desde el tablero hasta el motor, y los cables de los accesorios.',
], 'Hoy: <span class="nar">del tablero al motor</span>'))

E.append(dict(frases=[
  'Antes que nada: la conexión a la red eléctrica de la casa debe hacerla o revisarla un electricista, cumpliendo el Código Nacional de Electricidad.',
  'Tú debes saber qué pedir y cómo dejar todo preparado. Y siempre: corta la energía antes de tocar cualquier cable.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Primero: <span class="nar">seguridad</span>', top=90) +
  '<div class="tarjeta pop" data-en="0" style="position:absolute;left:400px;right:400px;top:290px;text-align:center;font-size:36px;font-weight:800">👷 La conexión a la red la hace o revisa<br><span class="nar">un electricista</span> según el CNE</div>' +
  badge('CORTA LA ENERGÍA ANTES DE TOCAR', 1, 620, 560, '#ff6b6b', '!')))

E.append(dict(frases=[
  'El portón necesita un circuito exclusivo desde el tablero, no una extensión de otro tomacorriente.',
  'Ese circuito lleva un interruptor termomagnético, del amperaje que indique el manual del motor, y un interruptor diferencial de treinta miliamperios, que protege a las personas si hay una fuga.',
  'Y la línea de tierra, conectada al motor. Sin tierra, el diferencial no puede protegerte bien.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('Un <span class="nar">circuito exclusivo</span>', top=90) + tarjetas([
  ('🔌', 'Exclusivo', 'Desde el tablero<br><b class="nar">sin extensiones</b>'), ('🔒', 'Termomagnético', 'Amperaje<br>según el manual'),
  ('🛡️', 'Diferencial 30 mA', 'Protege a<br>las personas'), ('⏚', 'Tierra', 'Conectada<br>al motor')],
  lambda i: [0, 1, 1, 2][i], top=260, cols=4, alto=300, izq=120)))

E.append(dict(frases=[
  'Los cables van por tubería: empotrada en el muro o enterrada en el piso, con cajas de paso donde haga falta.',
  'Nunca dejes empalmes dentro del tubo ni bajo tierra. Los empalmes van solo en cajas, y bien aislados.',
  'Y separa: los cables de doscientos veinte voltios en un tubo, y los de baja tensión, de fotoceldas y pulsadores, en otro. Juntos, el ruido eléctrico puede dar fallas raras.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Por <span class="nar">tubería</span>', top=90) + svg(
  '<rect x="200" y="300" width="160" height="220" rx="12" fill="#2b3a47" stroke="#c9d6e3" stroke-width="5"/>'
  f'<text x="280" y="420" fill="#fff" font-size="26" {T} text-anchor="middle">TABLERO</text>'
  '<rect x="1500" y="560" width="130" height="120" rx="12" fill="#2b3a47" stroke="#f97316" stroke-width="5"/>'
  f'<text x="1565" y="628" fill="#fff" font-size="22" {T} text-anchor="middle">MOTOR</text>'
  '<path class="dib" data-en="0" d="M360 470 L800 470 L800 640 L1500 640" fill="none" stroke="#ffb020" stroke-width="16" style="--l:1200"/>'
  '<path class="dib" data-en="2" d="M360 500 L760 500 L760 690 L1500 690" fill="none" stroke="#5b8def" stroke-width="10" style="--l:1200"/>'
  '<rect class="pop" data-en="1" x="770" y="440" width="60" height="60" rx="6" fill="#3a4651" stroke="#fff" stroke-width="4"/>'
  f'<text class="ap" data-en="1" x="800" y="420" fill="#fff" font-size="26" {T} text-anchor="middle">caja de paso</text>'
  f'<text class="ap" data-en="0" x="1150" y="620" fill="#ffb020" font-size="28" {T} text-anchor="middle">220 V</text>'
  f'<text class="ap" data-en="2" x="1150" y="740" fill="#5b8def" font-size="28" {T} text-anchor="middle">baja tensión (otro tubo)</text>')))

E.append(dict(frases=[
  'El agua es el peor enemigo de la tarjeta.',
  'El motor va sobre su dado, nunca a ras del piso donde se empoza el agua.',
  'Los cables entran por abajo, por los prensaestopas, y con una curva antes de entrar, para que la gota caiga y no corra hacia adentro. Y la tapa del motor siempre bien cerrada.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Contra <span class="nar">el agua</span>', top=90) + lista([
  ('⬆️', 'Motor <b class="nar">elevado</b> sobre su dado'), ('🔽', 'Cables <b class="nar">por abajo</b>, con prensaestopas'),
  ('💧', '<b class="nar">Curva de goteo</b> antes de entrar'), ('🔐', 'Tapa <b class="nar">bien cerrada</b>')],
  lambda i: [1, 2, 2, 2][i], top=260, izq=360, der=360, tam=33)))

E.append(dict(frases=[
  'Deja también los accesorios preparados: un pulsador adentro de la casa para abrir sin control, y si el cliente quiere, un botón de parada.',
  'Y la antena del receptor, en alto y lejos de planchas metálicas. Una antena tapada por la hoja de acero reduce mucho el alcance del control.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Los <span class="nar">accesorios</span>', top=90) + tarjetas([
  ('🔘', 'Pulsador interior', 'Abrir sin control'), ('🛑', 'Botón de parada', 'Opcional'), ('📡', 'Antena', 'En alto<br><b class="nar">lejos del metal</b>')],
  lambda i: [0, 0, 1][i], top=270, cols=3, alto=280, izq=240)))

E.append(dict(frases=[
  'En nuestra cochera el tablero está a doce metros del motor.',
  'Pedimos al electricista un circuito exclusivo con termomagnético y diferencial, cable de dos punto cinco milímetros cuadrados con su tierra, según el manual del motor, por tubo PVC enterrado, con una caja de paso.',
  'Y un segundo tubo para los cables de las fotoceldas y del pulsador.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">lista de pedido</span>', top=90) + tabla(
  ['Partida', 'Detalle'],
  [['Recorrido', 'Tablero → motor: 12 m'], ['Protección', 'Termomagnético + diferencial 30 mA'], ['Cable', '2.5 mm² con tierra (según manual)'],
   ['Canalización', 'Tubo PVC enterrado + caja de paso'], ['Baja tensión', 'Segundo tubo: fotoceldas y pulsador']],
  lambda i: [0, 1, 1, 1, 2][i], top=250, izq=300, der=300, tam=31)))

E.append(dict(frases=[
  'Los cinco errores eléctricos.',
  'Uno: conectar con una extensión.',
  'Dos: sin diferencial ni tierra.',
  'Tres: empalmes enterrados o dentro del tubo.',
  'Cuatro: todos los cables en el mismo tubo.',
  'Y cinco: el motor a ras del piso, donde se empoza el agua.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('5 errores <span class="nar">eléctricos</span>', [
  ('Extensión', 'Falla y riesgo de incendio.'), ('Sin diferencial ni tierra', 'Riesgo para las personas.'), ('Empalmes enterrados', 'Humedad y cortos.'),
  ('Todo en un tubo', 'Fallas raras.'), ('Motor a ras del piso', 'Se inunda la tarjeta.')])))

E.append(dict(frases=[
  'Tu reto: haz la lista de pedido eléctrico para un portón tuyo: distancia al tablero, protecciones, cable y tuberías.',
  'En la próxima clase: la seguridad, lo más importante de todo.',
], html=reto('⚡ Arma la <b class="nar">lista de pedido eléctrico</b><br>de un portón tuyo', 'SEGURIDAD')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: circuito exclusivo, protegido y lejos del agua.',
  '¡Nos vemos en la clase siete!',
], html=final('Circuito <span class="nar">exclusivo</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'porton_c6')
