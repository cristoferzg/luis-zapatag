"""Portones Automáticos · Clase 3: La hoja que corre sola."""
from porton_comun import *

CURSO = 'PORTONES AUTOMÁTICOS · CLASE 3'
E = []

E.append(dict(antes=0.5, frases=[
  'El mejor motor del mercado no arregla un portón mal hecho.',
  'Si la hoja está torcida, si el riel sube y baja o las ruedas se traban, el motor fuerza, hace ruido y se rinde.',
  'Hoy fabricamos la hoja y el riel para que el portón corra suave, como debe ser. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('El motor no arregla', 'un portón mal hecho', 3, 'LA HOJA', soldando=True)))

E.append(obra(2, [
  'Ya sabemos que la hoja pesa unos doscientos kilos y que el motor es de seiscientos.',
  'Hoy: la hoja, el riel, las ruedas y la guía superior.',
], 'Hoy: <span class="nar">hoja, riel, ruedas y guía</span>'))

E.append(dict(frases=[
  'Primero, la hoja tiene que salir a escuadra y rígida.',
  'Arma el marco sobre una mesa nivelada y mide las dos diagonales: deben ser iguales, con una diferencia de dos o tres milímetros como máximo.',
  'Suelda alternando lados, para que el calor no la tuerza, y pon los travesaños que hagan falta para que no se doble al empujarla.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 55)], html=titulo('Hoja <span class="nar">a escuadra</span>', top=90) + svg(
  hoja_svg(610, 250, 700, 360, barras=10) +
  '<line class="dib" data-en="1" x1="610" y1="250" x2="1310" y2="610" stroke="#ffd166" stroke-width="6" style="--l:800"/>'
  '<line class="dib" data-en="1" data-mas="0.6" x1="1310" y1="250" x2="610" y2="610" stroke="#ffd166" stroke-width="6" style="--l:800"/>'
  f'<text class="ap" data-en="1" data-mas="1.2" x="960" y="680" fill="#ffd166" font-size="36" {T} text-anchor="middle">D1 = D2 (± 3 mm)</text>')))

E.append(dict(frases=[
  'El riel es el camino del portón. Usa un riel en V o un ángulo colocado con la punta hacia arriba, bien anclado al concreto.',
  'Tiene que estar recto y a nivel en todo el recorrido. Si baja, el portón se va solo; si sube, el motor sufre.',
  '¿Cuánto mide? El largo de la hoja más lo que recorre. En nuestra obra: tres noventa más tres setenta, unos siete metros sesenta de riel.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 60)], html=titulo('El riel: <span class="nar">recto y a nivel</span>', top=90) + svg(
  '<rect x="260" y="640" width="1400" height="40" fill="#3a4651"/>'
  '<line class="dib" data-en="0" x1="300" y1="634" x2="1620" y2="634" stroke="#c9d6e3" stroke-width="10" style="--l:1320"/>'
  + hoja_svg(980, 380, 600, 230, barras=8) +
  '<circle cx="1060" cy="618" r="16" fill="#1d2a36" stroke="#c9d6e3" stroke-width="5"/><circle cx="1500" cy="618" r="16" fill="#1d2a36" stroke="#c9d6e3" stroke-width="5"/>'
  f'<g class="ap" data-en="2"><line x1="300" y1="720" x2="1620" y2="720" stroke="#ffd166" stroke-width="4"/>'
  f'<text x="960" y="770" fill="#ffd166" font-size="34" {T} text-anchor="middle">riel ≈ 3.90 + 3.70 = 7.60 m</text></g>') +
  badge('NIVEL EN TODO EL RECORRIDO', 1, 300, 300, '#3f9e5a', '═')))

E.append(dict(frases=[
  'Las ruedas: dos ruedas en V, con rodamiento, del tamaño que pida el peso. Para doscientos kilos, ruedas de unos ochenta a cien milímetros van sobradas.',
  'Colócalas cerca de los extremos de la hoja, alineadas con el riel. Una rueda torcida frena todo el portón.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Las ruedas: <span class="nar">en V con rodamiento</span>', top=90) + tarjetas([
  ('⚙️', 'Con rodamiento', 'Giran suaves<br>y duran'), ('🔻', 'En V', 'Encajan en el riel<br>sin salirse'), ('↔️', 'En los extremos', 'Alineadas<br><b class="nar">con el riel</b>')],
  lambda i: [0, 0, 1][i], top=270, cols=3, alto=300, izq=240)))

E.append(dict(frases=[
  'Arriba, la guía superior mantiene la hoja vertical. Son dos rodillos de nylon, uno a cada lado de la hoja, en un poste o en el muro.',
  'Deben guiar, no apretar. Deja un par de milímetros de juego: si aprietan, frenan; si están muy sueltos, la hoja cabecea con el viento.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 50)], html=titulo('La guía <span class="nar">superior</span>', top=90) + svg(
  '<rect x="900" y="300" width="120" height="420" fill="#5b4a3f"/>'
  '<rect x="940" y="360" width="40" height="360" fill="rgba(249,115,22,.35)" stroke="#f97316" stroke-width="6"/>'
  '<circle class="pop" data-en="0" cx="915" cy="380" r="22" fill="#e8e8e8" stroke="#2b3a47" stroke-width="5"/>'
  '<circle class="pop" data-en="0" data-mas="0.3" cx="1005" cy="380" r="22" fill="#e8e8e8" stroke="#2b3a47" stroke-width="5"/>'
  f'<text class="ap" data-en="1" x="1120" y="390" fill="#ffd166" font-size="32" {T}>← juego de 2 a 3 mm</text>'
  f'<text class="ap" data-en="0" x="700" y="390" fill="#fff" font-size="30" {T} text-anchor="end">rodillos de nylon</text>')))

E.append(dict(frases=[
  'Pon topes mecánicos en los dos extremos del recorrido: dos piezas soldadas o empernadas que detienen la hoja aunque falle todo lo demás.',
  'El motor tendrá sus fines de carrera, pero el tope es la última defensa: evita que la hoja se salga del riel y caiga.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Topes <span class="nar">en los extremos</span>', top=90) + lista([
  ('🛑', 'Tope al <b class="nar">abrir</b> y tope al <b class="nar">cerrar</b>'), ('🛡️', 'La <b class="nar">última defensa</b> si falla el fin de carrera'),
  ('⚠️', 'Evita que la hoja <b class="nar">se salga y caiga</b>')],
  lambda i: [0, 1, 1][i], top=280, izq=360, der=360, tam=34)))

E.append(dict(frases=[
  'Hay otra opción sin riel en el piso: el portón en voladizo o autoportante. La hoja corre sobre unos carros fijos y tiene una cola que hace de contrapeso.',
  'Sirve cuando el piso es de tierra o se ensucia mucho, pero la cola mide casi la mitad del vano y la estructura es más pesada. Por eso la dejamos para obras especiales.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Otra opción: <span class="nar">voladizo</span>', top=90) + tarjetas([
  ('✅', 'Ventaja', 'Sin riel en el piso<br>no se ensucia'), ('⚠️', 'Pero', 'Cola ≈ <b class="nar">mitad del vano</b><br>más acero y más espacio')],
  lambda i: i, top=280, cols=2, alto=290, izq=380)))

E.append(dict(frases=[
  'Antes de pasar a la siguiente etapa, prueba la hoja sin motor.',
  'Uno: se mueve con una mano. Dos: si la dejas en cualquier punto, se queda quieta, no se va sola. Y tres: no golpea ni roza en ningún tramo.',
  'Si pasa las tres pruebas, está lista para el motor.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La prueba <span class="nar">sin motor</span>', top=90) + lista([
  ('✋', 'Se mueve <b class="nar">con una mano</b>'), ('⏸️', 'En cualquier punto <b class="nar">se queda quieta</b>'), ('🔇', '<b class="nar">No golpea ni roza</b>')],
  lambda i: (1, 0.9 * i), top=270, izq=380, der=380, tam=35) + badge('LISTA PARA EL MOTOR', 2, 760, 660, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Los cinco errores en la hoja.',
  'Uno: no medir las diagonales.',
  'Dos: riel sin nivel.',
  'Tres: ruedas sin rodamiento o torcidas.',
  'Cuatro: guía superior apretada.',
  'Y cinco: sin topes en los extremos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('5 errores <span class="nar">en la hoja</span>', [
  ('Sin medir diagonales', 'Hoja torcida.'), ('Riel sin nivel', 'Se va sola o fuerza.'), ('Ruedas malas', 'Frenan todo.'),
  ('Guía apretada', 'Roce constante.'), ('Sin topes', 'Puede caer.')])))

E.append(dict(frases=[
  'Tu reto: haz la prueba sin motor en un portón corredizo que conozcas. Anota qué pasa en cada una de las tres pruebas.',
  'En la próxima clase: instalamos el motor y la cremallera.',
], html=reto('✋ Haz las <b class="nar">3 pruebas sin motor</b><br>en un portón corredizo', 'EL MOTOR CORREDIZO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: si corre suave a mano, correrá suave con motor.',
  '¡Nos vemos en la clase cuatro!',
], html=final('Suave <span class="nar">a mano</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'porton_c3')
