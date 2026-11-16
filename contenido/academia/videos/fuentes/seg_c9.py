"""Seguridad en Obra · Clase 9: Techos y coberturas."""
from seg_comun import *

CURSO = 'SEGURIDAD EN OBRA · CLASE 9'
E = []

E.append(dict(antes=0.5, frases=[
  'Un paso sobre la plancha traslúcida de la claraboya. Desde arriba parece igual que el resto del techo. No lo es.',
  'Las caídas a través del techo son de las más traicioneras: la persona está "encima de algo", pero ese algo no la sostiene.',
  'Hoy ves cómo trabajar seguro sobre techos y coberturas. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Parece techo', 'y no te sostiene', 9, 'TECHOS', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🏚️</div>')))

E.append(obra_av(0, [
  'Empieza el módulo avanzado.',
  'Hoy: colocar la cobertura de la nave y trabajar encima del techo sin caer a través de él.',
], 'Hoy: <span class="nar">sobre el techo</span>'))

E.append(dict(frases=[
  'La regla principal: no se camina sobre las planchas, se camina sobre la estructura.',
  'Las planchas de aluzinc pisadas entre correas se abollan y pueden ceder.',
  'Las claraboyas de policarbonato y las planchas viejas de fibrocemento pueden romperse con el peso de una persona.',
  'Por eso se pisa siempre sobre la línea de las correas, o sobre tablas de tránsito apoyadas en dos correas.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Pisa <span class="nar">la estructura</span>', top=90) + svg(
  ''.join(f'<rect x="300" y="{330+k*130}" width="1320" height="16" fill="#9aa5ae"/>' for k in range(4)) +
  '<rect x="300" y="330" width="1320" height="406" fill="rgba(201,214,227,.12)"/>'
  '<rect class="ap" data-en="2" x="1100" y="330" width="260" height="406" fill="rgba(125,211,252,.25)" stroke="#7dd3fc" stroke-width="4"/>'
  f'<text class="ap" data-en="2" x="1230" y="545" fill="#7dd3fc" font-size="28" {T} text-anchor="middle">claraboya: NO</text>'
  '<rect class="ap" data-en="3" x="500" y="450" width="80" height="276" rx="6" fill="#c08a52"/>'
  f'<text class="ap" data-en="3" x="540" y="780" fill="#c08a52" font-size="28" {T} text-anchor="middle">tabla de tránsito</text>'
  f'<text x="260" y="345" fill="#9aa5ae" font-size="24" {T} text-anchor="end">correas</text>')))

E.append(dict(frases=[
  'Cubre o protege las claraboyas y las aberturas del techo con malla o barandas mientras se trabaja.',
  'Y al borde del techo, si no hay baranda, arnés enganchado a la línea de vida. Recuerda que la norma lo pide también cerca de bordes sin protección.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Claraboyas <span class="nar">y bordes</span>', top=90) + lista([
  ('🕸️', 'Claraboyas y aberturas: <b class="nar">malla o baranda</b>'), ('🪢', 'Borde sin baranda: <b class="nar">arnés a la línea de vida</b>')],
  lambda i: i, top=300, izq=360, der=360, tam=34)))

E.append(dict(frases=[
  'El viento es otro enemigo. Una plancha suelta es una vela: te puede tumbar o salir volando hacia alguien.',
  'Con viento fuerte se suspende la colocación de planchas. Y cada plancha se fija apenas se coloca, nunca se dejan sueltas al terminar el día.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El <span class="nar">viento</span>', top=90) + tarjetas([
  ('💨', 'Plancha suelta', 'Es una vela'), ('⛔', 'Viento fuerte', 'Se suspende'), ('🔩', 'Al colocarla', '<b class="nar">Se fija</b> de inmediato')],
  lambda i: [0, 1, 1][i], top=270, cols=3, alto=280, izq=240)))

E.append(dict(frases=[
  'Para subir las planchas al techo: con soga o con la grúa, nunca cargándolas por la escalera.',
  'Las herramientas arriba, amarradas o en un bolso, y debajo, la zona marcada para que nadie pase mientras se trabaja encima.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Subir <span class="nar">materiales</span>', top=90) + lista([
  ('🪢', 'Planchas con <b class="nar">soga o grúa</b>'), ('🧰', 'Herramientas <b class="nar">amarradas</b>'), ('🚧', 'Abajo: <b class="nar">zona marcada</b>')],
  lambda i: [0, 1, 1][i], top=280, izq=380, der=380, tam=34)))

E.append(dict(frases=[
  'Y el sol. En el techo metálico, al mediodía, la plancha quema y el calor agota.',
  'Agua a la mano, descansos a la sombra, y si se puede, los trabajos más pesados temprano. Un trabajador mareado en el techo es un accidente esperando.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El <span class="nar">sol</span>', top=90) + tarjetas([
  ('💧', 'Agua', 'A la mano'), ('🌳', 'Descansos', 'A la sombra'), ('🌅', 'Lo pesado', 'Temprano')],
  lambda i: 1, top=270, cols=3, alto=260, izq=240)))

E.append(dict(frases=[
  'En la nave, la cobertura se colocó así: línea de vida a lo largo de la cumbrera, tablas de tránsito, claraboyas protegidas con malla hasta el final, planchas fijadas una por una, y zona marcada abajo.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La obra: <span class="nar">la cobertura</span>', top=90) + '<div style="position:absolute;left:300px;right:300px;top:240px;display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
  ''.join(f'<div class="ap" data-en="0" data-mas="{m}" style="background:rgba(63,158,90,.12);border:2px solid rgba(63,158,90,.7);border-radius:14px;padding:16px 22px;font-size:30px;font-weight:800">✅ {t}</div>'
          for m, t in [(0, 'Línea de vida en cumbrera'), (0.6, 'Tablas de tránsito'), (1.2, 'Claraboyas con malla'), (1.8, 'Planchas fijadas al colocar'), (2.4, 'Zona marcada abajo')]) + '</div>'))

E.append(dict(frases=[
  'Los cuatro errores sobre el techo.',
  'Uno: pisar la claraboya.',
  'Dos: caminar sobre las planchas entre correas.',
  'Tres: dejar planchas sueltas.',
  'Y cuatro: subir las planchas por la escalera.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">sobre el techo</span>', [
  ('Pisar la claraboya', 'Caída a través.'), ('Pisar entre correas', 'Se abolla o cede.'), ('Planchas sueltas', 'El viento las lleva.'), ('Cargar por la escalera', 'Sin manos para agarrarte.')])))

E.append(dict(frases=[
  'Tu reto: en tu próximo techo, marca con tiza dónde están las correas y protege las claraboyas antes de empezar.',
  'En la próxima clase: herramientas y electricidad en obra.',
], html=reto('🖍️ Marca las <b class="nar">correas</b> y protege<br>las claraboyas antes de empezar', 'HERRAMIENTAS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: se pisa la estructura, nunca la plancha.',
  '¡Nos vemos en la clase diez!',
], html=final('Pisa <span class="nar">la estructura</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'seg_c9')
