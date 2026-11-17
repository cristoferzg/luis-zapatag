"""Portones Automáticos · Clase 10: Control de acceso."""
from porton_comun import *

CURSO = 'PORTONES AUTOMÁTICOS · CLASE 10'
E = []

E.append(dict(antes=0.5, frases=[
  'Un condominio con cuarenta familias y un solo portón. Controles perdidos, copias que nadie sabe quién tiene, y el vigilante abriendo a cualquiera.',
  'El control de acceso resuelve eso, y para ti es una venta extra en cada portón que instalas.',
  'Hoy ves teclados, tarjetas y apertura desde el celular. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('40 familias', 'un solo portón', 10, 'CONTROL DE ACCESO', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">📲</div>')))

E.append(obra_av(1, [
  'Ya sabes automatizar cualquier tipo de portón.',
  'Hoy: decidir quién puede abrir, y cómo.',
], 'Hoy: <span class="nar">quién abre y cómo</span>'))

E.append(dict(frases=[
  'Las opciones más comunes.',
  'El teclado con clave, en la parte de afuera. Cada familia puede tener su propia clave.',
  'Las tarjetas o llaveros de proximidad: se acercan al lector y abre. Si alguien pierde el suyo, se borra solo ese.',
  'Y la apertura desde el celular, con un receptor wifi o por llamada. Útil para abrir a una visita estando lejos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Las <span class="nar">opciones</span>', top=90) + tarjetas([
  ('🔢', 'Teclado', 'Clave por familia'), ('💳', 'Tarjeta o llavero', 'Se borra uno<br>sin afectar a otros'), ('📱', 'Celular', 'Wifi o llamada<br>abre de lejos')],
  lambda i: i + 1, top=270, cols=3, alto=290, izq=240)))

E.append(dict(frases=[
  'También puedes conectar el portón al intercomunicador o al videoportero: desde adentro, con un botón, abres al que llama.',
  'Y en edificios y empresas se usan lectores de placa del auto y barreras. Eso ya es un proyecto aparte, con su proveedor especializado.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Más <span class="nar">opciones</span>', top=90) + lista([
  ('📞', '<b class="nar">Intercomunicador o videoportero</b> con botón de apertura'), ('🚗', 'Lector de placas y barreras: <b class="nar">proyecto aparte</b>')],
  lambda i: i, top=300, izq=330, der=330, tam=34)))

E.append(dict(frases=[
  'Todos estos equipos le hablan a la tarjeta del motor de la misma forma: con un contacto que dice "abre", como si alguien pulsara el botón.',
  'Por eso casi cualquier teclado o receptor se puede conectar a casi cualquier motor. Revisa en el manual la bornera de "abrir" o "paso a paso", y el voltaje que da para alimentar accesorios.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 55)], html=titulo('Cómo se <span class="nar">conectan</span>', top=90) + svg(
  ''.join(f'<g class="pop" data-en="0" data-mas="{0.3*k}"><rect x="{300}" y="{280+k*130}" width="300" height="90" rx="14" fill="#2b3a47" stroke="#5b8def" stroke-width="4"/>'
          f'<text x="450" y="{335+k*130}" fill="#fff" font-size="28" {T} text-anchor="middle">{t}</text></g>'
          f'<path class="dib" data-en="0" data-mas="{0.6+0.3*k}" d="M600 {325+k*130} L1150 450" fill="none" stroke="#ffd166" stroke-width="5" style="--l:600"/>'
          for k, t in enumerate(['Teclado', 'Lector de tarjetas', 'Receptor wifi']))
  + '<rect x="1150" y="360" width="400" height="180" rx="16" fill="#2b3a47" stroke="#f97316" stroke-width="5"/>'
  f'<text x="1350" y="440" fill="#fff" font-size="30" {T} text-anchor="middle">TARJETA</text>'
  f'<text x="1350" y="490" fill="#ffd166" font-size="28" {T} text-anchor="middle">borne "abrir"</text>')))

E.append(dict(frases=[
  'La seguridad del acceso importa tanto como la del portón.',
  'Cambia la clave de fábrica de todos los equipos. Usa controles de código variable. Y lleva una lista de quién tiene qué tarjeta o clave, para borrar a quien se muda o pierde la suya.',
  'Con el wifi, una contraseña fuerte y el equipo actualizado.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Seguridad <span class="nar">del acceso</span>', top=90) + lista([
  ('🔑', 'Cambia la <b class="nar">clave de fábrica</b>'), ('🔐', 'Controles de <b class="nar">código variable</b>'), ('📋', '<b class="nar">Lista</b> de quién tiene qué'),
  ('📶', 'Wifi: <b class="nar">contraseña fuerte</b> y actualizado')],
  lambda i: [1, 1, 1, 2][i], top=250, izq=360, der=360, tam=33)))

E.append(dict(frases=[
  'Ejemplo: un condominio de cuarenta familias.',
  'Teclado afuera con una clave por familia, cuarenta llaveros de proximidad, botón en la caseta del vigilante, y un receptor wifi para el administrador.',
  'Para ti son partidas de venta adicionales sobre la automatización, y además un servicio continuo: dar de alta y de baja usuarios.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Ejemplo: <span class="nar">condominio de 40 familias</span>', top=90) + tabla(
  ['Equipo', 'Para qué'],
  [['Teclado exterior', 'Una clave por familia'], ['40 llaveros', 'Entrada sin control'], ['Botón en caseta', 'El vigilante abre'], ['Receptor wifi', 'Administrador desde el celular']],
  lambda i: 1, top=260, izq=360, der=360, tam=32) + badge('VENTA EXTRA + SERVICIO CONTINUO', 2, 620, 650, '#3f9e5a', 'S/')))

E.append(dict(frases=[
  'Los cuatro errores en control de acceso.',
  'Uno: dejar la clave de fábrica.',
  'Dos: no llevar la lista de usuarios.',
  'Tres: conectar sin revisar el voltaje de la tarjeta.',
  'Y cuatro: el lector a la intemperie sin protección.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">de acceso</span>', [
  ('Clave de fábrica', 'Cualquiera entra.'), ('Sin lista de usuarios', 'No sabes a quién borrar.'), ('Voltaje sin revisar', 'Equipo quemado.'), ('Lector sin protección', 'Se malogra con la lluvia.')])))

E.append(dict(frases=[
  'Tu reto: propón un control de acceso para un edificio o condominio que conozcas: qué equipos, para quién, y cuánto cobrarías.',
  'En la próxima clase: qué hacer cuando se va la luz.',
], html=reto('📲 Propón un <b class="nar">control de acceso</b><br>para un condominio que conozcas', 'SIN LUZ')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: cada portón puede llevar su control de acceso.',
  '¡Nos vemos en la clase once!',
], html=final('Quién abre, <span class="nar">y cómo</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'porton_c10')
