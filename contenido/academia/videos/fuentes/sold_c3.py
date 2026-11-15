"""Soldadura Estructural · Clase 3: La máquina — regula el amperaje como un maestro."""
from sold_comun import *

CURSO = 'SOLDADURA ESTRUCTURAL · CLASE 3'
E = []

E.append(dict(antes=0.5, frases=[
  'El electrodo se te pega a la plancha...',
  '...o al revés: salpica por todos lados y te perfora la pieza. Casi siempre, el culpable es el mismo: la máquina mal regulada.',
  'Hoy aprendes a regular tu máquina como un maestro. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('¿Se te pega', 'o te perfora?', 3, 'LA MÁQUINA')))

E.append(escena_obra(2, [
  'En nuestro almacén ya elegimos los electrodos: siete cero dieciocho para todo lo que carga.',
  'Ahora prendemos la máquina. Y de cómo la regules depende que el cordón aguante o no.',
], 'Hoy: <span class="nar">máquina, corriente y amperaje</span>'))

E.append(dict(frases=[
  'Primero, conoce tu máquina. Hay tres tipos comunes.',
  'El transformador: la clásica, pesada y barata. Da corriente alterna. Sirve para seis cero once y seis cero trece.',
  'El rectificador: convierte a corriente continua. Más estable, pero también pesado.',
  'Y la inversora: liviana, ahorra energía y da continua con un arco muy estable. Es la más usada hoy en talleres y obras.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 60, 50)], html=titulo('Conoce tu <span class="nar">máquina</span>', top=110) + tarjetas([
  ('🧱', 'Transformador', 'Pesado y barato · corriente alterna (CA)'), ('🔁', 'Rectificador', 'Corriente continua (CC) · estable · pesado'), ('⚡', 'Inversora', 'Liviana · ahorra energía · CC muy estable')],
  lambda i: i + 1, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Corriente alterna o continua. ¿Cuál es la diferencia para ti?',
  'La continua da un arco más estable y suave, con menos salpicadura. El siete cero dieciocho rinde mejor en continua.',
  'Y en continua importa la polaridad. Electrodo al positivo: más penetración. Es lo normal para el siete cero dieciocho y el seis cero once.',
  'Electrodo al negativo: menos penetración, se usa en chapa delgada. Si dudas, mira la caja: ahí dice la polaridad.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 40, 60)], html=maquina(140, 300, 120, 0) + titulo('Corriente y <span class="nar">polaridad</span>', top=110) + f'''
<div style="position:absolute;left:820px;right:140px;top:290px">
 <div class="tarjeta ap" data-en="1" style="font-size:30px;margin:12px 0">〰️ <b>CA</b>: arco más inquieto · 🟰 <b>CC</b>: arco estable</div>
 <div class="tarjeta ap" data-en="2" style="font-size:30px;margin:12px 0;border-color:#7ee08a">➕ <b>Electrodo al +</b>: más penetración<br><span style="font-size:24px;color:#c9d6e3">7018 y 6011 · lo normal en estructura</span></div>
 <div class="tarjeta ap" data-en="3" style="font-size:30px;margin:12px 0;border-color:#5cc8ff">➖ <b>Electrodo al −</b>: menos penetración<br><span style="font-size:24px;color:#c9d6e3">chapa delgada · si dudas, mira la caja</span></div>
</div>'''))

E.append(dict(frases=[
  'Ahora, el ciclo de trabajo. Está en la placa de la máquina, y casi nadie lo lee.',
  'Por ejemplo: sesenta por ciento a ciento sesenta amperios. Quiere decir que, de cada diez minutos, a ese amperaje puedes soldar seis, y los otros cuatro la máquina tiene que enfriarse.',
  'Si te pasas, la protección térmica la apaga. Y si la fuerzas siempre, la quemas.',
  'A menos amperaje, más tiempo puedes soldar seguido.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('El <span class="nar">ciclo de trabajo</span>', top=110) + f'''
<div class="tarjeta ap" data-en="1" style="position:absolute;left:300px;right:300px;top:260px;text-align:center;font-size:34px">Placa: <b class="nar">60 % a 160 A</b></div>
<div style="position:absolute;left:300px;right:300px;top:400px;display:flex;height:110px;border-radius:20px;overflow:hidden">
 <div class="ap" data-en="1" data-mas="1.5" style="flex:6;background:#f97316;display:grid;place-items:center;font-size:34px;font-weight:900">6 min soldando</div>
 <div class="ap" data-en="1" data-mas="2.5" style="flex:4;background:#5cc8ff;color:#0b2a45;display:grid;place-items:center;font-size:34px;font-weight:900">4 min enfría</div>
</div>
<div class="ap" data-en="1" data-mas="1" style="position:absolute;left:0;right:0;top:525px;text-align:center;font-size:26px;color:#c9d6e3">Cada 10 minutos</div>''' +
 badge('PROTECCIÓN TÉRMICA: SE APAGA', 2, 590, 620, '#ff6b6b', '!') + badge('MENOS AMPERIOS = MÁS TIEMPO', 3, 620, 720, '#3f9e5a', '✓')))

E.append(dict(frases=[
  '¿Y cuánto amperaje? Regla de oro: empieza al medio del rango de la caja, haz un cordón de prueba en un retazo, y ajusta mirando el cordón.',
  'Mira estos tres cordones. Arriba: amperaje bajo. El electrodo se pega, el cordón sale angosto, alto y torcido, y no se funde bien con la plancha.',
  'Abajo: amperaje alto. Salpica mucho, el cordón sale ancho y plano, y en los bordes aparece una canaleta: se llama socavación o mordedura. Y el electrodo se pone rojo.',
  'Al medio: el correcto. Parejo, con ondas finas y regulares. Y suena como tocino friéndose en la sartén.',
], zoom=[(0, 1.0, 50, 50), (1, 1.08, 45, 38), (2, 1.08, 45, 72), (3, 1.08, 45, 55)], html=titulo('Lee el cordón: <span class="nar">¿bajo, alto o justo?</span>', top=110) +
 cordon(260, 250, 900, 'bajo', 1, etiqueta='❌ Bajo: se pega, angosto y alto', color_et='#ff6b6b') +
 cordon(260, 470, 900, 'ok', 3, etiqueta='✅ Justo: parejo, ondas finas · suena a tocino friéndose', color_et='#7ee08a') +
 cordon(260, 690, 900, 'alto', 2, etiqueta='❌ Alto: salpica, ancho, mordedura en los bordes', color_et='#ff6b6b')))

E.append(dict(frases=[
  'Dos ajustes más. En vertical y sobre cabeza, baja entre diez y quince por ciento, para que el charco no se te caiga.',
  'Y el largo del arco: más o menos igual al diámetro del electrodo. Con el siete cero dieciocho, arco corto, casi pegado.',
  'Arco largo es más salpicadura, más poros y menos penetración.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Dos ajustes <span class="nar">más</span>', top=110) + tarjetas([
  ('↕️', 'Vertical o sobre cabeza', 'Baja 10 a 15 % el amperaje'), ('📏', 'Largo de arco', '≈ el diámetro del electrodo · 7018: arco corto'), ('🫧', 'Arco largo =', 'salpicadura, poros y poca penetración')],
  lambda i: i, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Ejemplo en nuestra obra. Vamos a soldar la placa base de una columna, plana, con siete cero dieciocho de tres punto dos.',
  'La caja dice de cien a ciento cuarenta amperios. Empezamos al medio: ciento veinte.',
  'Cordón de prueba en un retazo del mismo espesor. Sale un poquito alto y angosto: subimos a ciento veinticinco.',
  'Después soldamos la unión del arco a la columna, que está en vertical. Bajamos como doce por ciento: más o menos ciento diez amperios.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 30, 55), (3, 1.05, 30, 55)], html=titulo('En la obra: <span class="nar">placa base y columna</span>', top=110) +
 maquina(120, 300, 120, 1) + f'''
<div style="position:absolute;left:760px;right:120px;top:280px">
 <div class="tarjeta ap" data-en="1" style="font-size:30px;margin:12px 0">📦 Caja 7018 de 3.2 mm: <b>100 – 140 A</b> → empieza en <b class="nar">120 A</b></div>
 <div class="tarjeta ap" data-en="2" style="font-size:30px;margin:12px 0">🧪 Prueba: alto y angosto → sube a <b class="nar">125 A</b></div>
 <div class="tarjeta ap" data-en="3" style="font-size:30px;margin:12px 0;border-color:#5cc8ff">↕️ Unión en vertical: −12 % → <b class="nar">≈ 110 A</b></div>
</div>'''))

E.append(dict(frases=[
  'Cuida también los cables. Mientras más largo el cable, más se pierde: el arco se siente débil y le subes sin necesidad.',
  'Usa el cable del calibre que pide la máquina, sin empalmes con cinta. Y no lo dejes enrollado mientras sueldas: se calienta.',
  'En obra, si usas generador, mira en la placa de la máquina cuánta potencia pide, y usa un generador con margen. Un generador justo hace que el arco se corte.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 60)], html=titulo('Cables y <span class="nar">generador</span>', top=110) + lista([
  ('➰', 'Cable muy largo = arco débil'), ('🔌', 'Calibre correcto, <b>sin empalmes con cinta</b>'), ('🌀', 'No sueldes con el cable <b>enrollado</b>'), ('⚙️', 'Generador con <b>margen</b> sobre lo que pide la placa')],
  lambda i: [0, 1, 1, 2][i], top=260, izq=300, der=300, tam=32)))

E.append(dict(frases=[
  'Los cinco errores con la máquina.',
  'Uno: regular "de oído" sin hacer cordón de prueba.',
  'Dos: usar la polaridad al revés con el siete cero dieciocho.',
  'Tres: no respetar el ciclo de trabajo y quemar la máquina.',
  'Cuatro: la tierra lejos o floja.',
  'Y cinco: cables largos, delgados o parchados.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con la máquina</span>', [
  ('Regular sin cordón de prueba', 'Pruebas en la pieza buena, y la arruinas.'), ('Polaridad al revés', 'Menos penetración y arco inestable.'),
  ('Ignorar el ciclo de trabajo', 'Se apaga… o se quema.'), ('Tierra lejos o floja', 'Arco débil y chispas donde no debe.'), ('Cables malos', 'Pierdes corriente y te arriesgas.')])))

E.append(dict(frases=[
  'Tu reto: tómale foto a la placa de tu máquina. Anota el amperaje máximo y el ciclo de trabajo, y dinos cuántos minutos puedes soldar seguido a ciento veinte amperios.',
  'En la próxima clase: las juntas y los biseles. Porque un buen cordón en una junta mal preparada, igual falla.',
], html=reto('📸 Foto de la placa de tu máquina:<br><b class="nar">amperaje máximo · ciclo de trabajo</b>', 'JUNTAS Y BISELES')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: la máquina no suelda sola. Pero bien regulada, te hace el trabajo mucho más fácil.',
  '¡Nos vemos en la clase cuatro!',
], html=final('Máquina bien regulada, <span class="nar">cordón parejo</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'sold_c3')
