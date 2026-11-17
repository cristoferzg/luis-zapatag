"""Portones Automáticos · Clase 8: Programación, cotización y entrega."""
from porton_comun import *

CURSO = 'PORTONES AUTOMÁTICOS · CLASE 8'
E = []

E.append(dict(antes=0.5, frases=[
  'El portón funciona perfecto. Lo entregas, cobras... y a la semana te llaman: "Perdí un control", "se fue la luz y no pude abrir".',
  'La diferencia entre un trabajo que se olvida y uno que te trae más clientes está en cómo programas, cobras y entregas.',
  'Hoy cerramos la obra de la cochera. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Funciona perfecto', 'y aun así te llaman', 8, 'LA ENTREGA', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🔑</div>')))

E.append(obra(7, [
  'El portón ya es seguro.',
  'Hoy: programar la tarjeta, cotizar la automatización y entregar al cliente.',
], 'Hoy: <span class="nar">programa, cobra y entrega</span>'))

E.append(dict(frases=[
  'Programar la tarjeta es seguir el manual, pero casi todas hacen lo mismo.',
  'Uno: el aprendizaje del recorrido. El motor abre y cierra solo una vez para medir el camino.',
  'Dos: la frenada suave al final, para que la hoja llegue despacio al tope.',
  'Tres: el cierre automático, por ejemplo a los treinta segundos. Actívalo solo si hay fotoceldas y luz destellante.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Programa <span class="nar">la tarjeta</span>', top=90) + lista([
  ('📏', '<b class="nar">Aprendizaje</b> del recorrido'), ('🐢', '<b class="nar">Frenada suave</b> al final'), ('⏲️', '<b class="nar">Cierre automático</b> solo con fotoceldas y luz')],
  lambda i: i + 1, top=270, izq=340, der=340, tam=35)))

E.append(dict(frases=[
  'Los controles. Usa controles de código variable, que cambian el código en cada uso y no se pueden copiar fácilmente.',
  'Graba cada control en la tarjeta y anota cuántos entregaste. Si el cliente pierde uno, sabrás borrarlo para que nadie más abra su cochera.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Los <span class="nar">controles</span>', top=90) + tarjetas([
  ('🔐', 'Código variable', 'No se copian<br>fácilmente'), ('📝', 'Anota cuántos', 'Entregados<br>y grabados'), ('🗑️', 'Control perdido', 'Bórralo de<br><b class="nar">la memoria</b>')],
  lambda i: [0, 1, 1][i], top=270, cols=3, alto=290, izq=240)))

E.append(dict(frases=[
  'Ahora, la cotización de la automatización. El portón se cotiza aparte.',
  'Estos son precios de ejemplo; cotiza siempre con tus proveedores y tu zona.',
  'Kit de motor de seiscientos kilos con dos controles: mil doscientos cincuenta. Cremallera, fotoceldas, luz, material eléctrico y la base: seiscientos.',
  'Mano de obra de dos personas por un día, con movilidad: cuatrocientos cincuenta.',
  'Costo total: dos mil trescientos soles. Con un margen del veinticinco por ciento sobre el precio, cobras tres mil cien.',
], zoom=[(0, 1.0, 50, 50), (4, 1.05, 50, 60)], html=titulo('Cotiza <span class="nar">la automatización</span>', top=80) + tabla(
  ['Partida', 'S/'],
  [['Kit motor 600 kg + 2 controles', '1 250'], ['Cremallera 4 m', '140'], ['Fotoceldas + luz destellante', '170'], ['Material eléctrico', '220'], ['Base y anclajes', '70'],
   ['Mano de obra y movilidad', '450'], ['<b>COSTO</b>', '<b>2 300</b>'], ['<span class="nar">PRECIO (margen 25 %)</span>', '<b class="nar">3 100</b>']],
  lambda i: [2, 2, 2, 2, 2, 3, 4, 4][i], top=200, izq=420, der=420, tam=28) + badge('PRECIOS DE EJEMPLO', 1, 1530, 210, '#5b8def', 'i', tam=22)))

E.append(dict(frases=[
  'La entrega es parte del trabajo.',
  'Haz con el cliente diez ciclos completos y las dos pruebas de seguridad.',
  'Enséñale a desbloquear con la llave, a cambiar la pila del control y qué hacer si se va la luz.',
  'Y entrégale los controles, el manual, la garantía por escrito y la fecha de la primera revisión, a los seis meses.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('La <span class="nar">entrega</span>', top=90) + lista([
  ('🔁', '<b class="nar">10 ciclos</b> + pruebas de seguridad con el cliente'), ('🔑', 'Enseña: <b class="nar">desbloqueo, pila, corte de luz</b>'),
  ('📄', 'Entrega: <b class="nar">controles, manual y garantía escrita</b>'), ('📅', '<b class="nar">Primera revisión</b> a los 6 meses')],
  lambda i: i + 1, top=250, izq=300, der=300, tam=32)))

E.append(dict(frases=[
  'La garantía, clara: por ejemplo doce meses por tu instalación, y la del motor según el fabricante.',
  'Y deja dicho lo que no cubre: golpes de auto, sobretensiones, mojado por tapa abierta o manipulación de otros.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Garantía <span class="nar">clara</span>', top=90) + tarjetas([
  ('✅', 'Cubre', 'Tu instalación: <b class="nar">12 meses</b><br>Motor: según fabricante'), ('❌', 'No cubre', 'Golpes · sobretensiones<br>mojado · manipulación')],
  lambda i: i, top=280, cols=2, alto=290, izq=380)))

E.append(dict(frases=[
  'Así terminó la cochera: portón corredizo de tres noventa, motor de seiscientos kilos, eléctrico protegido, seguridad completa y cliente capacitado.',
  'Automatización cobrada en tres mil cien soles, y un contrato de mantenimiento ofrecido para cada seis meses.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=CSS_P + titulo('Obra <span class="nar">terminada</span>', top=70) +
  corredizo(x=430, piso=770, alto=400, vano=820, en_abre=0, mas=1.5, fotoceldas=True, en_foto=0, luz=True) +
  badge('S/ 3 100 · CLIENTE CAPACITADO', 1, 700, 250, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Los cuatro errores al cerrar la obra.',
  'Uno: activar el cierre automático sin seguridad.',
  'Dos: no anotar ni explicar los controles.',
  'Tres: cotizar sin margen.',
  'Y cuatro: entregar sin garantía ni revisión.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">al cerrar</span>', [
  ('Cierre automático inseguro', 'Accidentes.'), ('Controles sin registro', 'Riesgo de robo.'), ('Sin margen', 'Trabajas gratis.'), ('Sin garantía', 'Reclamos sin fin.')])))

E.append(dict(frases=[
  'Tu reto: arma la cotización de una automatización con los precios de tus proveedores y tu margen.',
  'Terminaste el módulo principal. En el módulo avanzado: portones levadizos y seccionales.',
], html=reto('🧾 Cotiza una <b class="nar">automatización</b><br>con tus precios y tu margen', 'MÓDULO AVANZADO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Módulo principal completado. Recuerda: programa bien, cobra bien y entrega mejor.',
  '¡Nos vemos en el módulo avanzado!',
], html=final('Módulo principal <span class="nar">completado</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'porton_c8')
