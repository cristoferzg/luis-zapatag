"""Soldadura Estructural · Clase 8: Soldar en obra, MIG y cobrar bien la soldadura."""
from sold_comun import *

CURSO = 'SOLDADURA ESTRUCTURAL · CLASE 8'
E = []

E.append(dict(antes=0.5, frases=[
  'Cobraste la nave por kilo de fierro...',
  '...y al final, la soldadura se comió tu ganancia. Electrodos, días de soldador, andamios. Nada de eso estaba en tu precio.',
  'En esta última clase aprendes a soldar en obra, y a cobrar bien la soldadura. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('¿Y tu', 'ganancia?', 8, 'EN OBRA Y COSTOS')))

E.append(escena_obra(7, [
  'Llegamos a la última etapa de nuestro almacén. Los arcos ya están soldados, inspeccionados y pintados.',
  'Ahora se montan en la obra, y quedan uniones que se sueldan allá arriba. Y al final, hay que cobrar todo esto bien.',
], 'Hoy: <span class="nar">obra, MIG y costos</span>'))

E.append(dict(frases=[
  'Soldar en obra no es igual que en el taller. Primero, el viento: se lleva el calor y la protección del arco. Pon un biombo o una lona.',
  'Segundo, la lluvia: nunca sueldes con la pieza mojada, ni parado en charcos. Seca, o espera.',
  'Tercero, la altura: andamio firme, arnés con línea de vida, y una manta debajo para que las chispas no caigan sobre nadie. Así lo pide la norma de seguridad en construcción, la G cero cincuenta.',
  'Y cuarto: todo en altura es más lento. Lo que en el taller sale en un día, arriba puede tomar dos.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Soldar <span class="nar">en obra</span>', top=110) + tarjetas([
  ('🌬️', 'Viento', 'Biombo o lona'), ('🌧️', 'Lluvia', 'Nunca con la pieza mojada'), ('🧗', 'Altura', 'Andamio, arnés y manta · Norma G.050'), ('🐢', 'Más lento', 'En altura, hasta el doble de tiempo')],
  lambda i: i)))

E.append(dict(frases=[
  'Y el MIG, la soldadura con alambre. En el taller es una maravilla: alambre continuo, sin cambiar electrodos, sin escoria. Sueldas mucho más rápido.',
  'Para acero estructural se usa alambre E R setenta S seis, con gas: dióxido de carbono, o mejor, una mezcla de argón y dióxido de carbono, que salpica menos.',
  'Pero tiene un enemigo: el viento. El viento se lleva el gas, y el cordón se llena de poros. La norma de estructuras no permite soldar con gas si el viento pasa de unos ocho kilómetros por hora, sin protección.',
  'Por eso la regla práctica: MIG en el taller, y en la obra, electrodo siete cero dieciocho, o alambre tubular autoprotegido, que no necesita gas.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('¿Y el <span class="nar">MIG</span>?', top=110) + f'''
<div style="position:absolute;left:200px;right:200px;top:270px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
 <div class="tarjeta ap" data-en="0" style="border-color:#7ee08a"><div style="font-size:36px;font-weight:900">🏭 En el taller: MIG</div>
  <div style="font-size:27px;line-height:1.6;margin-top:10px">✅ Alambre continuo, sin escoria<br>✅ Mucho más rápido<br><span class="ap" data-en="1">🧵 Alambre <b>ER70S-6</b><br>🫧 Gas CO₂ o mezcla <b>Ar + CO₂</b></span></div></div>
 <div class="tarjeta ap" data-en="2" style="border-color:#ff6b6b"><div style="font-size:36px;font-weight:900">🏗️ En la obra: cuidado</div>
  <div style="font-size:27px;line-height:1.6;margin-top:10px">🌬️ El viento se lleva el gas → poros<br>⚠️ Con gas: máx. ≈ 8 km/h de viento sin protección<br><span class="ap" data-en="3">✅ Usa <b>E7018</b> o <b>alambre tubular autoprotegido</b></span></div></div>
</div>''' + badge('MIG EN TALLER · 7018 EN OBRA', 3, 640, 760, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Y aquí viene la clave del negocio: suelda todo lo que puedas en el taller. Y en la obra, solo lo que no se puede evitar.',
  'Por eso los arcos se fabrican completos en el taller, y en obra solo se unen a las columnas y se sueldan las correas.',
  'Mientras menos soldadura en altura, menos días, menos andamio y menos riesgo.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La clave: <span class="nar">más taller, menos obra</span>', top=110) + f'''
<div style="position:absolute;left:250px;right:250px;top:290px;display:grid;grid-template-columns:1fr 1fr;gap:50px">
 <div class="tarjeta ap" data-en="0" style="text-align:center;border-color:#7ee08a"><div style="font-size:84px">🏭</div><div style="font-size:34px;font-weight:900">Taller</div><div style="font-size:26px;color:#c9d6e3;margin-top:8px">Arcos completos · MIG · rápido y seguro</div></div>
 <div class="tarjeta ap" data-en="1" style="text-align:center;border-color:#ffd166"><div style="font-size:84px">🏗️</div><div style="font-size:34px;font-weight:900">Obra</div><div style="font-size:26px;color:#c9d6e3;margin-top:8px">Solo uniones a columnas y correas</div></div>
</div>'''))

E.append(dict(frases=[
  'Ahora sí: cuánto cuesta la soldadura de nuestro almacén. Ejemplo con números supuestos; tú pon los de tu zona.',
  'Electrodos: ya lo calculamos en la clase dos. Ciento cincuenta metros de cordón, unos cuarenta y nueve kilos comprados, a diecinueve soles: novecientos treinta y un soles.',
  'Mano de obra: supongamos que en el taller un soldador avanza veinte metros de cordón por día. Ciento cincuenta metros son siete días y medio.',
  'Con un soldador a ciento veinte soles por día, y un ayudante a ochenta, son mil quinientos soles.',
  'Más discos, escobillas y energía, digamos ciento cincuenta. Total: unos dos mil quinientos ochenta soles. Más o menos diecisiete soles por metro de cordón.',
], zoom=[(0, 1.0, 50, 50), (4, 1.04, 50, 55)], html=titulo('¿Cuánto cuesta <span class="nar">la soldadura</span>?', top=110) + tabla(
  ['Partida (supuestos de ejemplo)', 'Cálculo', 'Soles'],
  [['Electrodos', '49 kg × S/ 19', '931'], ['Soldador', '7.5 días × S/ 120', '900'], ['Ayudante', '7.5 días × S/ 80', '600'], ['Discos, escobillas, energía', 'estimado', '150'],
   ['<b class="nar">Total</b>', '150 m de cordón', '<b class="nar">≈ 2,580</b>']],
  lambda i: [1, 3, 3, 4, 4][i], top=250, izq=260, der=260, tam=31, nota='Rendimiento supuesto: 20 m de cordón por día en taller. Usa los precios y rendimientos de tu zona.') +
 badge('≈ S/ 17 POR METRO DE CORDÓN', 4, 660, 760, '#3f9e5a', 'S/', mas=4)))

E.append(dict(frases=[
  '¿Y si esa misma soldadura se hiciera en la obra, en altura? Si el rendimiento baja a la mitad, diez metros por día, son quince días.',
  'La mano de obra sube a tres mil soles. El total pasa a unos cuatro mil ochenta. Mil quinientos soles más, por la misma soldadura.',
  'Por eso: la soldadura en obra se cotiza aparte, con su propio rendimiento. Y se suman andamios, arnés y generador, si hacen falta.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Taller vs <span class="nar">obra</span>', top=110) + f'''
<div style="position:absolute;left:300px;right:300px;top:280px;display:grid;grid-template-columns:1fr 1fr;gap:50px">
 <div class="tarjeta ap" data-en="0" style="text-align:center;border-color:#7ee08a"><div style="font-size:32px;font-weight:900">🏭 En taller</div><div style="font-size:26px;color:#c9d6e3">20 m/día · 7.5 días</div><div style="font-size:72px;font-weight:900;color:#7ee08a">S/ 2,580</div></div>
 <div class="tarjeta ap" data-en="1" style="text-align:center;border-color:#ff6b6b"><div style="font-size:32px;font-weight:900">🏗️ En altura</div><div style="font-size:26px;color:#c9d6e3">10 m/día · 15 días</div><div style="font-size:72px;font-weight:900;color:#ff6b6b">S/ 4,080</div></div>
</div>''' + badge('+ S/ 1,500 POR LA MISMA SOLDADURA', 1, 610, 640, '#ff6b6b', '!', mas=2) + badge('COTIZA LA SOLDADURA EN OBRA APARTE', 2, 600, 750, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Para cobrar bien, tu cotización debe separar las partidas. El acero, la fabricación en taller, la soldadura en obra, la pintura, y el montaje.',
  'Así el cliente entiende lo que paga, y tú no regalas trabajo escondido dentro del precio del fierro.',
  'Y no olvides lo que casi nadie cobra: la inspección, los ensayos si los piden, y las reparaciones que pide el inspector.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Cotiza por <span class="nar">partidas</span>', top=110) + lista([
  ('🔩', 'Acero (kg)'), ('🏭', 'Fabricación y soldadura en taller'), ('🏗️', 'Soldadura en obra (rendimiento propio)'), ('🎨', 'Pintura'), ('🏗️', 'Montaje · andamios · equipos'), ('🔍', 'Inspección, ensayos y reparaciones')],
  lambda i: [0, 0, 0, 0, 0, 2][i] if i < 5 else 2, top=240, izq=420, der=420, tam=30)))

E.append(dict(frases=[
  'Los cinco errores que te hacen perder plata.',
  'Uno: meter la soldadura dentro del precio por kilo, sin calcularla.',
  'Dos: soldar en obra lo que se podía hacer en el taller.',
  'Tres: usar MIG con gas en obra con viento, y tener que reparar todo.',
  'Cuatro: olvidar andamios, arnés, generador y tiempos muertos.',
  'Y cinco: no cobrar la inspección ni las reparaciones.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">que cuestan plata</span>', [
  ('Soldadura "dentro del kilo"', 'Nunca sabes cuánto te cuesta.'), ('Mucha soldadura en obra', 'Hasta el doble de tiempo.'), ('MIG con viento', 'Poros y reparaciones.'),
  ('Olvidar equipos y tiempos', 'Andamio, arnés, generador.'), ('No cobrar inspección', 'Trabajo regalado.')])))

E.append(dict(frases=[
  'Tu reto final: calcula el costo de la soldadura de tu próximo trabajo. Metros de cordón, kilos de electrodo, días de soldador y ayudante, y consumibles.',
  'Mándanos tu cálculo, y te ayudamos a revisarlo.',
], html=reto('🧮 Calcula la soldadura de tu próximo trabajo:<br><b class="nar">metros · kilos · días · consumibles</b>', 'TU PRÓXIMA OBRA')))

E.append(dict(antes=0.3, despues=3.0, frases=[
  '¡Felicitaciones! Terminaste el curso de Soldadura Estructural. Desde la seguridad hasta el costo, ya sabes soldar una nave como un profesional.',
  'Suelda bien, cobra bien, y llega entero a casa. ¡Éxitos en tu próxima obra!',
], html=final('¡Curso <span class="nar">completado</span>!')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'sold_c8')
