"""Seguridad en Obra · Clase 10: Herramientas y electricidad."""
from seg_comun import *

CURSO = 'SEGURIDAD EN OBRA · CLASE 10'
E = []

E.append(dict(antes=0.5, frases=[
  'Le quitó la guarda a la amoladora "porque estorbaba", y le puso un disco más grande del que soporta. A los pocos segundos, el disco reventó.',
  'Las herramientas del taller son nuestras compañeras de todos los días, y por eso mismo les perdemos el respeto.',
  'Hoy ves cómo usar amoladora, taladro y extensiones sin accidentes. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Sin guarda', 'y el disco reventó', 10, 'HERRAMIENTAS', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">⚙️</div>')))

E.append(obra_av(1, [
  'Ya trabajamos seguros sobre el techo.',
  'Hoy: herramientas eléctricas y la energía en la obra.',
], 'Hoy: <span class="nar">herramientas y electricidad</span>'))

E.append(dict(frases=[
  'La amoladora es la herramienta que más lesiones causa en el taller.',
  'La guarda siempre puesta. El disco del diámetro correcto, y con una velocidad máxima igual o mayor que la de la máquina: está impresa en el disco.',
  'Disco de corte para cortar y disco de desbaste para desbastar; nunca desbastar con el de corte. Y las dos manos en la máquina, con el cuerpo fuera de la línea del disco.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('La <span class="nar">amoladora</span>', top=90) + lista([
  ('🛡️', 'Guarda <b class="nar">siempre puesta</b>'), ('🔢', 'Disco: diámetro correcto y <b class="nar">RPM ≥ la máquina</b>'), ('🔄', 'Corte para cortar · <b class="nar">desbaste para desbastar</b>'),
  ('🙌', 'Dos manos · <b class="nar">fuera de la línea del disco</b>')],
  lambda i: [0, 1, 2, 2][i], top=250, izq=330, der=330, tam=32)))

E.append(dict(frases=[
  'Antes de cambiar el disco o la broca: desenchufa la herramienta. No basta con apagarla.',
  'Revisa el cable y el enchufe: sin cortes, sin cinta aislante remendada. Y si una herramienta da corriente o huele a quemado, sale de la obra hasta que se repare.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Antes <span class="nar">de usarla</span>', top=90) + tarjetas([
  ('🔌', 'Cambiar disco', '<b class="nar">Desenchufada</b><br>no solo apagada'), ('🧵', 'Cable', 'Sin cortes<br>ni remiendos'), ('🚫', 'Da corriente', 'Sale de la obra')],
  lambda i: [0, 1, 1][i], top=270, cols=3, alto=280, izq=240)))

E.append(dict(frases=[
  'La energía en obra: un tablero provisional con interruptor diferencial y puesta a tierra. El diferencial corta si hay una fuga a tierra, y es lo que te salva de una descarga.',
  'Extensiones de cable vulcanizado, sin empalmes, y fuera de los charcos y del paso de vehículos. Este tablero lo instala o revisa un electricista.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La energía <span class="nar">en obra</span>', top=90) + lista([
  ('🔌', 'Tablero con <b class="nar">diferencial y tierra</b>'), ('🧶', 'Extensiones de <b class="nar">cable vulcanizado</b> sin empalmes'), ('💧', '<b class="nar">Fuera de charcos</b> y del paso de vehículos'),
  ('👷', 'Lo instala o revisa <b class="nar">un electricista</b>')],
  lambda i: [0, 1, 1, 1][i], top=250, izq=330, der=330, tam=32)))

E.append(dict(frases=[
  'La soldadura eléctrica también tiene riesgo de descarga: nunca soldar con la ropa o los guantes mojados, ni parado en un charco.',
  'La pinza de tierra va cerca de la zona que se suelda, y la pinza del electrodo nunca se apoya sobre la estructura ni bajo el brazo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Soldar <span class="nar">sin descargas</span>', top=90) + lista([
  ('💧', '<b class="nar">Nunca mojado</b> ni en un charco'), ('🧲', 'Pinza de tierra <b class="nar">cerca de la soldadura</b>'), ('✋', 'Porta-electrodo <b class="nar">nunca apoyado</b> en la estructura')],
  lambda i: [0, 1, 1][i], top=280, izq=330, der=330, tam=33)))

E.append(dict(frases=[
  'Y las líneas eléctricas aéreas: el peligro silencioso en el izaje y con tubos largos.',
  'Antes de izar o subir perfiles largos, mira hacia arriba. Si hay cables cerca, mantén una buena distancia y coordina con la empresa eléctrica.',
  'La electricidad puede saltar sin que toques el cable.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Líneas <span class="nar">aéreas</span>', top=90) + svg(
  '<line x1="200" y1="300" x2="1720" y2="320" stroke="#c9d6e3" stroke-width="5"/><line x1="200" y1="340" x2="1720" y2="360" stroke="#c9d6e3" stroke-width="5"/>'
  '<line x1="1000" y1="800" x2="1150" y2="420" stroke="#f97316" stroke-width="18"/>'
  '<path class="pop" data-en="0" d="M1160 400 l30 -40 l-14 30 l34 -10 l-40 50 l14 -30 z" fill="#ffd166"/>'
  f'<text class="ap" data-en="1" x="960" y="260" fill="#ff6b6b" font-size="36" {T} text-anchor="middle">mira arriba · mantén distancia · coordina</text>')))

E.append(dict(frases=[
  'En la nave: tablero provisional con diferencial instalado por el electricista, amoladoras con guarda y discos revisados, y soldadoras con cables sanos.',
  'Y la grúa trabajó lejos del cable de media tensión de la calle, coordinado con la empresa eléctrica.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">energía segura</span>', top=90) + tabla(
  ['Equipo', 'Control'],
  [['Tablero provisional', 'Diferencial + tierra (electricista)'], ['Amoladoras', 'Guarda · discos revisados'], ['Soldadoras', 'Cables sanos · pinza de tierra cerca'], ['Grúa', 'Lejos de la línea · coordinado']],
  lambda i: 0, top=260, izq=300, der=300, tam=31)))

E.append(dict(frases=[
  'Los cinco errores con herramientas y electricidad.',
  'Uno: quitar la guarda.',
  'Dos: disco equivocado.',
  'Tres: cambiar el disco enchufada.',
  'Cuatro: extensiones remendadas en el charco.',
  'Y cinco: no mirar hacia arriba antes de izar.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('5 errores <span class="nar">con herramientas</span>', [
  ('Sin guarda', 'Disco que revienta.'), ('Disco equivocado', 'Se rompe.'), ('Enchufada', 'Arranque inesperado.'), ('Extensión en el charco', 'Descarga.'), ('No mirar arriba', 'Contacto con la línea.')])))

E.append(dict(frases=[
  'Tu reto: revisa hoy todas tus amoladoras: guarda, disco y cable. Y anota cuáles hay que reparar.',
  'En la próxima clase: emergencias y primeros auxilios.',
], html=reto('⚙️ Revisa tus <b class="nar">amoladoras</b>:<br>guarda · disco · cable', 'EMERGENCIAS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: guarda puesta, disco correcto y diferencial en el tablero.',
  '¡Nos vemos en la clase once!',
], html=final('Respeta <span class="nar">la herramienta</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'seg_c10')
