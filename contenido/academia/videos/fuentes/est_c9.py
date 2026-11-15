"""Estructuras Metálicas · Clase 9: Arriostres, viento y sismo — que la estructura no se mueva."""
from sold_comun import *
from est_c8 import ETAPAS_EST_AV

CURSO = 'ESTRUCTURAS METÁLICAS · CLASE 9'
E = []

def portico(en, x, y, arriostre=False, deformado=False, mas=0):
    d = 40 if deformado else 0
    s = f'<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="520" height="440" viewBox="0 0 520 440">'
    s += f'<line x1="60" y1="400" x2="{60+d}" y2="80" stroke="#9aa6b0" stroke-width="16"/><line x1="460" y1="400" x2="{460+d}" y2="80" stroke="#9aa6b0" stroke-width="16"/><line x1="{60+d}" y1="80" x2="{460+d}" y2="80" stroke="#f97316" stroke-width="16"/>'
    s += '<line x1="20" y1="410" x2="500" y2="410" stroke="#56687a" stroke-width="10"/>'
    if arriostre:
        s += '<line x1="60" y1="400" x2="460" y2="80" stroke="#7ee08a" stroke-width="7"/><line x1="460" y1="400" x2="60" y2="80" stroke="#7ee08a" stroke-width="7"/>'
    return s + '</svg>'

E.append(dict(antes=0.5, frases=[
  'Los tijerales estaban bien soldados, las columnas derechas...',
  '...pero en una tarde de viento fuerte, toda la nave se movía como un acordeón. Faltaban los arriostres.',
  'Hoy aprendes cómo se mantiene en pie una estructura cuando la empujan de costado. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Se movía', 'como acordeón', 9, 'ARRIOSTRES Y VIENTO', soldando=False) + portico(0, 1150, 300, deformado=True)))

E.append(escena_obra(1, [
  'Seguimos con el módulo avanzado. Hasta ahora pensamos en las cargas que bajan: el peso y la gente.',
  'Hoy, las que empujan de costado: el viento y el sismo.',
], 'Hoy: <span class="nar">arriostres, viento y sismo</span>', ETAPAS_EST_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'Mira este pórtico: dos columnas y una viga. Si sus uniones son simples, empernadas sin rigidez, un empujón de costado lo tumba como un rectángulo de palitos.',
  'Hay tres formas de darle estabilidad. Una: arriostres, diagonales en forma de X que forman triángulos.',
  'Dos: uniones rígidas entre viga y columna, que no dejan que el ángulo cambie. Es un pórtico rígido.',
  'Y tres: apoyarse en muros o placas de concreto. Cuál se usa, lo decide el ingeniero. Tu trabajo es fabricarlo y montarlo tal cual.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Cómo se mantiene <span class="nar">en pie</span>?', top=100) + portico(0, 160, 260, deformado=True) + portico(1, 700, 260, arriostre=True) + lista([
  ('✖️', '<b>Arriostres en X</b>: triángulos'), ('📐', '<b>Uniones rígidas</b>: pórtico rígido'), ('🧱', '<b>Muros o placas</b> de concreto')],
  lambda i: i + 1, top=300, izq=1260, der=60, tam=27)))

E.append(dict(frases=[
  'Los arriostres de varilla o de cable trabajan solo estirados. Si los aprietas, se doblan como un hilo.',
  'Por eso van en X: cuando el viento empuja hacia un lado, trabaja una diagonal. Cuando empuja hacia el otro, trabaja la otra.',
  'Se tensan con un templador, hasta que queden firmes, sin quedar flojos ni torcer la estructura.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Por qué <span class="nar">en X</span>?', top=110) + portico(0, 300, 260, arriostre=True) + lista([
  ('🪢', 'Varilla o cable: <b>solo estirados</b>'), ('↔️', 'En X: <b>una trabaja</b> según hacia dónde empuja el viento'), ('🔧', 'Se tensan con <b>templador</b>: firmes, sin torcer')],
  lambda i: i, top=300, izq=900, der=120, tam=30)))

E.append(dict(frases=[
  'Los arriostres forman un camino, igual que las cargas que bajan. El viento empuja la pared, la pared pasa la fuerza al techo, el techo a los paños arriostrados, y de ahí, a las columnas y a la cimentación.',
  'Por eso hay arriostres en el techo y en las paredes, y en las dos direcciones. Normalmente, en los paños de los extremos.',
  'Si falta un eslabón, la fuerza no tiene por dónde ir.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El camino <span class="nar">del viento</span>', top=110) +
 '<div style="position:absolute;left:150px;right:150px;top:330px;display:flex;align-items:center;justify-content:space-between">' + ''.join(
  f'<div class="pop" data-en="0" data-mas="{0.5*i}" style="text-align:center;width:260px"><div style="font-size:72px">{ic}</div><div style="font-size:28px;font-weight:900;margin-top:8px">{t}</div></div>' + (f'<div class="ap" data-en="0" data-mas="{0.5*i}" style="font-size:56px;color:#f97316">→</div>' if i < 4 else '')
  for i, (ic, t) in enumerate([('🌬️', 'Pared'), ('🏠', 'Techo'), ('✖️', 'Paños arriostrados'), ('🏛️', 'Columnas'), ('🧱', 'Cimentación')])) + '</div>' +
 badge('TECHO Y PAREDES · EN LAS 2 DIRECCIONES', 1, 600, 640, '#3f9e5a', '✓')))

E.append(dict(frases=[
  '¿Cuánto empuja el viento? La norma peruana E punto cero veinte usa una velocidad mínima de diseño de setenta y cinco kilómetros por hora.',
  'La presión básica sale de una fórmula: cero punto cero cero cinco, por un coeficiente, por la velocidad al cuadrado. Con setenta y cinco kilómetros por hora y coeficiente uno: unos veintiocho kilos por metro cuadrado.',
  'Parece poco. Pero una pared de treinta por cinco metros son ciento cincuenta metros cuadrados. Con un coeficiente de cero ocho, el empuje total es de unas tres toneladas y media.',
  'Y en el techo, el viento muchas veces succiona: intenta levantarlo. Por eso importan tanto los anclajes y los pernos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('¿Cuánto <span class="nar">empuja</span>?', top=100) + f'''
<div class="tarjeta ap" data-en="1" style="position:absolute;left:330px;right:330px;top:240px;text-align:center;font-size:34px">p = 0.005 × C × V² → 0.005 × 1 × 75² ≈ <b class="nar">28 kg/m²</b></div>
<div class="tarjeta ap" data-en="2" style="position:absolute;left:330px;right:330px;top:390px;text-align:center;font-size:32px">Pared 30 × 5 m = 150 m² × 0.8 × 28 ≈ <b class="nar">3,400 kg</b></div>
<div class="tarjeta ap" data-en="3" style="position:absolute;left:330px;right:330px;top:540px;text-align:center;font-size:32px;border-color:#ff6b6b">⬆️ En el techo, el viento <b>succiona</b>: anclajes y pernos</div>''' +
 badge('NORMA E.020 · V MÍNIMA 75 km/h', 0, 690, 700, '#5cc8ff', 'i')))

E.append(dict(frases=[
  'Y en el Perú hay algo que muchas veces pesa más que el viento: el sismo. La norma E punto cero treinta define cómo se calcula.',
  'Esa fuerza también va de costado, y usa los mismos arriostres y uniones. El cálculo es del ingeniero.',
  'Tu parte es igual de importante: no cambiar, no quitar y no debilitar ningún arriostre ni conexión del plano.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El <span class="nar">sismo</span>', top=110) + tarjetas([
  ('🌎', 'Norma E.030', 'Define la fuerza sísmica'), ('↔️', 'También empuja de costado', 'Usa los mismos arriostres'), ('🚫', 'Tu parte', 'No quitar ni debilitar nada del plano')],
  lambda i: i, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'En el montaje, los arriostres van a tiempo, no al final. Cada paño que levantas, se arriostra, aunque sea con arriostres temporales.',
  'Nunca dejes columnas o tijerales sueltos al terminar el día. Un viento de la tarde puede tumbarlos.',
  'Y si el cliente pide quitar una diagonal porque estorba una puerta, no se quita: se consulta al ingeniero, que puede cambiarla por un pórtico rígido u otra solución.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('En el <span class="nar">montaje</span>', top=110) + lista([
  ('⏱️', 'Arriostra <b>cada paño</b> al montarlo'), ('🌙', 'Nada suelto <b>al terminar el día</b>'), ('🚪', '¿Estorba una diagonal? <b>Consulta al ingeniero</b>, no la quites')],
  lambda i: i, top=290, izq=300, der=300, tam=33)))

E.append(dict(frases=[
  'Los cinco errores con arriostres.',
  'Uno: quitar una diagonal porque estorba.',
  'Dos: dejar los arriostres flojos.',
  'Tres: arriostrar en una sola dirección.',
  'Cuatro: montar todo y arriostrar al final.',
  'Y cinco: conexiones de arriostre débiles, con un puntito de soldadura.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con arriostres</span>', [
  ('Quitar una diagonal', 'La estructura queda sin camino.'), ('Arriostres flojos', 'No trabajan hasta que se mueve.'), ('Una sola dirección', 'La otra queda floja.'),
  ('Arriostrar al final', 'Riesgo en el montaje.'), ('Conexión débil', 'Falla antes que el arriostre.')])))

E.append(dict(frases=[
  'Tu reto: calcula el empuje de viento sobre una pared de veinte por cuatro metros, con la presión básica de veintiocho kilos por metro cuadrado y un coeficiente de cero ocho.',
  'En la próxima clase: refuerzos y ampliaciones de estructuras que ya existen.',
], html=reto('🌬️ Pared de 20 × 4 m, 28 kg/m², C = 0.8:<br><b class="nar">¿cuántos kilos empuja el viento?</b>', 'REFUERZOS Y AMPLIACIONES')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: lo que no está arriostrado, se mueve. Y lo que se mueve, falla.',
  '¡Nos vemos en la clase diez!',
], html=final('Arriostra a tiempo, <span class="nar">en las 2 direcciones</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'est_c9')
