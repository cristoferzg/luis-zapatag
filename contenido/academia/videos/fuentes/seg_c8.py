"""Seguridad en Obra · Clase 8: Trabajos en caliente e izaje."""
from seg_comun import *

CURSO = 'SEGURIDAD EN OBRA · CLASE 8'
E = []

E.append(dict(antes=0.5, frases=[
  'Una chispa de soldadura cae seis metros, rebota y termina en un montón de cartones al fondo de la nave. Veinte minutos después, humo.',
  'Y en el mismo día, un arco de media tonelada colgando de la grúa, con un ayudante parado justo debajo.',
  'Hoy cerramos el módulo principal con trabajos en caliente e izaje. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Una chispa', 'veinte minutos después, humo', 8, 'CALIENTE E IZAJE', soldando=True)))

E.append(obra(7, [
  'Ya podemos subir y trabajar arriba con seguridad.',
  'Hoy: soldar y cortar sin incendios, e izar los arcos sin que nadie salga herido.',
], 'Hoy: <span class="nar">soldadura e izaje</span>'))

E.append(dict(frases=[
  'Trabajo en caliente es todo lo que hace chispa o llama: soldar, oxicortar, cortar con amoladora.',
  'Antes de empezar: retira lo que pueda arder, o cúbrelo con mantas ignífugas. Las chispas viajan lejos, y desde altura, mucho más.',
  'Coloca pantallas para proteger a los demás, y un extintor de polvo químico A B C a la mano. Junto al extintor, el número de bomberos.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Trabajo <span class="nar">en caliente</span>', top=90) + lista([
  ('🧹', '<b class="nar">Retira o cubre</b> lo que pueda arder'), ('🛡️', '<b class="nar">Pantallas</b> para los demás'), ('🧯', 'Extintor <b class="nar">PQS ABC</b> a la mano + número de bomberos')],
  lambda i: i, top=280, izq=330, der=330, tam=33)))

E.append(dict(frases=[
  'Suma un vigía de fuego: una persona que mira dónde caen las chispas mientras el soldador trabaja, con el extintor en la mano.',
  'Y al terminar, el vigía se queda revisando un rato más. Muchos incendios empiezan cuando todos ya se fueron.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El <span class="nar">vigía de fuego</span>', top=90) + tarjetas([
  ('👀', 'Durante', 'Mira dónde caen<br>las chispas'), ('🧯', 'Con extintor', 'En la mano'), ('⏳', 'Después', 'Se queda revisando<br><b class="nar">un rato más</b>')],
  lambda i: [0, 0, 1][i], top=270, cols=3, alto=290, izq=240)))

E.append(dict(frases=[
  'Los cilindros de oxígeno y acetileno: siempre de pie, amarrados, con su capuchón cuando no se usan, lejos del calor y de las chispas.',
  'Mangueras sin fugas y con válvulas antirretroceso. Y nunca grasa ni aceite en los accesorios del oxígeno.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Los <span class="nar">cilindros</span>', top=90) + lista([
  ('🧯', 'De pie, <b class="nar">amarrados</b>, con capuchón'), ('🔥', 'Lejos del <b class="nar">calor y las chispas</b>'), ('🛑', 'Válvulas <b class="nar">antirretroceso</b> · sin fugas'), ('🚫', '<b class="nar">Nada de grasa</b> en el oxígeno')],
  lambda i: [0, 0, 1, 1][i], top=250, izq=360, der=360, tam=33)))

E.append(dict(frases=[
  'Ahora el izaje. La regla de oro: nadie debajo de una carga suspendida. Nunca.',
  'Se marca y se aísla una zona de exclusión alrededor de la grúa y del recorrido de la carga.',
  'Una sola persona da las señales al operador: el señalero. Y la carga se guía con cuerdas desde lejos, nunca con las manos.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('El <span class="nar">izaje</span>', top=90) + svg('<g transform="translate(0,-110)">' +
  '<line x1="960" y1="200" x2="960" y2="420" stroke="#9aa5ae" stroke-width="6"/>'
  '<path d="M760 470 Q960 360 1160 470" fill="none" stroke="#f97316" stroke-width="22"/>'
  '<ellipse class="pop" data-en="1" cx="960" cy="760" rx="420" ry="110" fill="rgba(255,107,107,.18)" stroke="#ff6b6b" stroke-width="5" stroke-dasharray="16 12"/>'
  '<line class="ap" data-en="2" x1="760" y1="470" x2="520" y2="720" stroke="#ffd166" stroke-width="4"/><line class="ap" data-en="2" x1="1160" y1="470" x2="1400" y2="720" stroke="#ffd166" stroke-width="4"/>'
  f'<text class="ap" data-en="1" x="960" y="775" fill="#ff6b6b" font-size="36" {T} text-anchor="middle">ZONA DE EXCLUSIÓN</text>'
  f'<text class="ap" data-en="2" x="500" y="760" fill="#ffd166" font-size="28" {T} text-anchor="end">cuerda guía</text></g>')
  + badge('NADIE DEBAJO DE LA CARGA', 0, 1300, 260, '#ff6b6b', '✕')))

E.append(dict(frases=[
  'Antes de izar: conoce el peso de la carga, y que la grúa y los estrobos lo aguanten con margen. Revisa estrobos y grilletes: sin hilos rotos, sin deformaciones.',
  'Haz una prueba levantando la carga unos centímetros, para ver que esté equilibrada. Y si hay viento fuerte, no se iza.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Antes <span class="nar">de izar</span>', top=90) + lista([
  ('⚖️', '<b class="nar">Peso conocido</b> · grúa y estrobos con margen'), ('🔗', 'Estrobos y grilletes <b class="nar">revisados</b>'), ('↕️', '<b class="nar">Prueba</b> a pocos centímetros'), ('💨', 'Viento fuerte: <b class="nar">no se iza</b>')],
  lambda i: [0, 0, 1, 1][i], top=250, izq=340, der=340, tam=33)))

E.append(dict(frases=[
  'En la nave, cada día de montaje: permiso de trabajo en caliente para los empalmes, vigía de fuego con extintor, y cartones y madera retirados.',
  'Para los arcos: peso de cada arco calculado, zona aislada con cinta, un señalero, dos cuerdas guía y ATS del izaje con todos. Así terminamos el montaje sin un solo accidente.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">montaje sin accidentes</span>', top=90) + '<div style="position:absolute;left:300px;right:300px;top:240px;display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
  ''.join(f'<div class="ap" data-en="{e}" data-mas="{m}" style="background:rgba(63,158,90,.12);border:2px solid rgba(63,158,90,.7);border-radius:14px;padding:16px 22px;font-size:30px;font-weight:800">✅ {t}</div>'
          for e, m, t in [(0, 0, 'Permiso en caliente'), (0, 0.5, 'Vigía con extintor'), (0, 1.0, 'Inflamables retirados'), (1, 0, 'Peso del arco calculado'),
                          (1, 0.5, 'Zona aislada · señalero'), (1, 1.0, '2 cuerdas guía · ATS')]) + '</div>'))

E.append(dict(frases=[
  'Los cinco errores en caliente e izaje.',
  'Uno: soldar sin retirar lo que arde.',
  'Dos: irse justo al terminar.',
  'Tres: cilindros sueltos.',
  'Cuatro: pararse debajo de la carga.',
  'Y cinco: guiar la carga con las manos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('5 errores <span class="nar">en caliente e izaje</span>', [
  ('Inflamables cerca', 'Incendio.'), ('Irse al terminar', 'El fuego empieza después.'), ('Cilindros sueltos', 'Caen y se rompen.'), ('Debajo de la carga', 'Aplastamiento.'), ('Guiar con las manos', 'Atrapamiento.')])))

E.append(dict(frases=[
  'Tu reto: haz la lista de control de tu próximo trabajo en caliente y de tu próximo izaje, con lo visto hoy.',
  'Terminaste el módulo principal. En el módulo avanzado: trabajos sobre techos y coberturas.',
], html=reto('🔥 Haz tu lista de <b class="nar">trabajo en caliente</b><br>y de <b class="nar">izaje</b>', 'MÓDULO AVANZADO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Módulo principal completado. Recuerda: sin chispas sueltas y nadie debajo de la carga.',
  '¡Nos vemos en el módulo avanzado!',
], html=final('Módulo principal <span class="nar">completado</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'seg_c8')
