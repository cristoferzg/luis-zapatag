"""Seguridad en Obra · Clase 1: Por qué te cuidas."""
from seg_comun import *

CURSO = 'SEGURIDAD EN OBRA · CLASE 1'
E = []

E.append(dict(antes=0.5, frases=[
  'Seis metros. Es la altura de la columna de la nave. Un paso mal dado sobre una correa y no hay segunda oportunidad.',
  'Las caídas de altura están entre los accidentes más graves de la construcción. Y casi todas se pudieron evitar con cosas simples.',
  'En este curso aprendes a trabajar en altura y en obra sin accidentes, y a cobrar esa seguridad. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Seis metros', 'no hay segunda oportunidad', 1, 'POR QUÉ TE CUIDAS', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🦺</div>')))

E.append(obra(0, [
  'Nuestra obra: el montaje de una nave parabólica de quince por treinta metros, con columnas de seis metros.',
  'Vamos a recorrerla de principio a fin, viendo qué puede salir mal en cada etapa y cómo evitarlo.',
], 'Nave 15 × 30 m · <span class="nar">columnas de 6 m</span>'))

E.append(dict(frases=[
  'Un accidente no viene solo. Detrás de cada caída hay una cadena: un apuro, un "ya casi termino", un arnés que se quedó en la camioneta.',
  'Y las consecuencias no son solo del que cae: la familia, el equipo que lo vio, la obra parada, la multa y el cliente que no te vuelve a llamar.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La <span class="nar">cadena</span> del accidente', top=90) + tarjetas([
  ('⏱️', 'El apuro', '"Ya casi termino"'), ('🙈', 'La costumbre', '"Siempre lo hice así"'), ('🎒', 'El olvido', 'El arnés en la camioneta'), ('💥', 'La caída', 'Y todo lo que sigue')],
  lambda i: [0, 0, 0, 1][i], top=270, cols=4, alto=280, izq=130)))

E.append(dict(frases=[
  'Los peligros de una obra metálica se repiten siempre.',
  'Caer de altura. Que te caiga algo encima. Quemaduras y chispas de la soldadura. Cortes con la amoladora.',
  'Y descargas eléctricas, golpes durante el izaje, y el polvo y el ruido que te dañan de a poquito.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Los <span class="nar">peligros</span> de la obra', top=90) + '<div style="position:absolute;left:280px;right:280px;top:240px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">' +
  ''.join(f'<div class="ap" data-en="{e}" data-mas="{m}" style="background:rgba(255,107,107,.10);border:2px solid rgba(255,107,107,.6);border-radius:14px;padding:18px 20px;font-size:30px;font-weight:800;text-align:center">{t}</div>'
          for e, m, t in [(1, 0, '🪂 Caídas de altura'), (1, 0.4, '🧱 Caída de objetos'), (1, 0.8, '🔥 Chispas y quemaduras'), (1, 1.2, '⚙️ Cortes'),
                          (2, 0, '⚡ Electricidad'), (2, 0.4, '🏗️ Izaje'), (2, 0.8, '😷 Polvo y ruido')]) + '</div>'))

E.append(dict(frases=[
  'Para controlarlos hay un orden, de lo más efectivo a lo menos efectivo.',
  'Primero: eliminar el peligro. Por ejemplo, armar los arcos en el piso en vez de soldarlos arriba.',
  'Segundo: protección colectiva, que cuida a todos sin que nadie tenga que acordarse: barandas, redes, líneas de vida.',
  'Y recién al final, el equipo de protección personal. El arnés es la última barrera, no la primera.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El orden <span class="nar">de los controles</span>', top=90) + svg(
  ''.join(f'<g class="ap" data-en="{e}"><polygon points="{960-w/2},{y} {960+w/2},{y} {960+w/2-40},{y+90} {960-w/2+40},{y+90}" fill="{c}"/>'
          f'<text x="960" y="{y+58}" fill="#fff" font-size="32" {T} text-anchor="middle">{t}</text></g>'
          for e, y, w, c, t in [(1, 260, 900, '#3f9e5a', '1. Eliminar el peligro'), (2, 360, 760, '#5b8def', '2. Protección colectiva'), (3, 460, 620, '#ffb020', '3. EPP: la última barrera')]))))

E.append(dict(frases=[
  'En nuestra nave, lo aplicamos así.',
  'Los arcos se arman y se sueldan en el piso, y se izan completos. Así casi no se suelda en altura.',
  'Antes de subir, se coloca la línea de vida. Y cada trabajador en altura va con arnés, enganchado siempre.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">el orden aplicado</span>', top=90) + lista([
  ('1️⃣', 'Arcos <b class="nar">armados en el piso</b> y izados completos'), ('2️⃣', '<b class="nar">Línea de vida</b> antes de subir'), ('3️⃣', '<b class="nar">Arnés</b> y siempre enganchado')],
  lambda i: i + 1, top=280, izq=340, der=340, tam=34)))

E.append(dict(frases=[
  'Y algo que pocos dicen: la seguridad también es negocio.',
  'Las empresas serias solo contratan a quien llega con su seguro, sus documentos y su equipo. Al final del curso verás cómo cobrarla y cómo presentarla.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La seguridad <span class="nar">también vende</span>', top=90) +
  '<div class="tarjeta pop" data-en="1" style="position:absolute;left:420px;right:420px;top:300px;text-align:center;font-size:36px;font-weight:800">🏢 Las empresas serias contratan a quien llega con<br><span class="nar">seguro, documentos y equipo</span></div>'))

E.append(dict(frases=[
  'Los cuatro errores de mentalidad.',
  'Uno: "a mí no me va a pasar".',
  'Dos: "es solo un ratito".',
  'Tres: confiar solo en el arnés.',
  'Y cuatro: pensar que la seguridad es un gasto.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">de mentalidad</span>', [
  ('"A mí no me pasa"', 'A todos nos puede pasar.'), ('"Es un ratito"', 'Una caída dura un segundo.'), ('Solo el arnés', 'Es la última barrera.'), ('"Es un gasto"', 'Es una inversión que vende.')])))

E.append(dict(frases=[
  'Tu reto: en tu próxima obra, anota tres peligros y para cada uno di qué control usarías: eliminar, colectivo o personal.',
  'En la próxima clase: la ley en simple, y qué te exigen a ti.',
], html=reto('📝 Anota <b class="nar">3 peligros</b> de tu obra<br>y su control: eliminar · colectivo · EPP', 'LA LEY')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: primero eliminar, luego proteger a todos, y al final el EPP.',
  '¡Nos vemos en la clase dos!',
], html=final('Vuelve <span class="nar">a casa</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'seg_c1')
