"""Techos a Dos y Cuatro Aguas · Clase 9: Coberturas (módulo avanzado)."""
from techo_comun import *

CURSO = 'TECHOS A DOS Y CUATRO AGUAS · CLASE 9'
E = []
T = 'font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke"'

def perfil_onda(en, x, y, w, tipo, mas=0, color='#c9d6e3'):
    pts = []
    if tipo == 'ondulada':
        import math
        pts = [f'{x + i:.0f},{y + 14 * math.sin(i / 22):.0f}' for i in range(0, w + 1, 4)]
    elif tipo == 'trapezoidal':
        p = 0; xx = x
        while xx < x + w:
            pts += [f'{xx},{y+18}', f'{xx+40},{y+18}', f'{xx+55},{y-18}', f'{xx+95},{y-18}', f'{xx+110},{y+18}']
            xx += 110
    elif tipo == 'teja':
        import math
        pts = [f'{x + i:.0f},{y + 24 * abs(math.sin(i / 40)):.0f}' for i in range(0, w + 1, 4)]
    elif tipo == 'panel':
        return (f'<g class="ap" data-en="{en}" data-mas="{mas}"><rect x="{x}" y="{y-20}" width="{w}" height="40" fill="#ffd166" opacity=".55"/>'
                + perfil_onda(en, x, y - 22, w, 'trapezoidal', mas).replace('class="ap"', 'class="x"') + f'<line x1="{x}" y1="{y+20}" x2="{x+w}" y2="{y+20}" stroke="{color}" stroke-width="5"/></g>')
    return f'<polyline class="ap" data-en="{en}" data-mas="{mas}" points="{" ".join(pts)}" fill="none" stroke="{color}" stroke-width="6"/>'

E.append(dict(antes=0.5, frases=[
  'Misma estructura, misma casa... pero el cliente cambia la plancha por teja, "porque se ve más bonita".',
  'Nadie revisa nada, y a los meses las correas están dobladas. La teja pesaba más, y pedía otra pendiente y otras correas.',
  'Hoy aprendes a elegir la cobertura y a leer su ficha técnica. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Otra cobertura', 'otro techo', 9, 'COBERTURAS', soldando=False,
              extra_html=svg(perfil_onda(0, 1150, 360, 560, 'trapezoidal', 0.4, '#f97316') + perfil_onda(0, 1150, 520, 560, 'teja', 0.9, '#e07a5f')))))

E.append(obra_av(0, [
  'Terminaste el módulo principal. Ahora, el módulo avanzado: lo que te piden los clientes cuando el techo ya está diseñado.',
  'Hoy: las coberturas.',
], 'Hoy: <span class="nar">coberturas</span>'))

E.append(dict(frases=[
  'Las más usadas sobre estructura metálica son cuatro.',
  'La calamina ondulada galvanizada: la más económica, pero delgada, ruidosa con la lluvia, y con menos duración frente a la corrosión.',
  'La plancha trapezoidal tipo TR4 de aluzinc, la que usamos en el curso: resistente, en largos a medida, y con buen escurrimiento.',
  'La teja andina de fibrocemento, con aspecto de teja: más pesada y con más pendiente. Y el panel termoacústico, un sándwich con aislante en medio: silencioso y fresco, pero más caro.',
], zoom=[(0, 1.0, 50, 50), (2, 1.03, 50, 50)], html=titulo('Cuatro <span class="nar">coberturas</span>', top=90) + svg(
  perfil_onda(1, 300, 330, 560, 'ondulada') + f'<text class="ap" data-en="1" x="580" y="410" fill="#fff" font-size="30" {T} text-anchor="middle">Calamina ondulada</text>' +
  perfil_onda(2, 1060, 330, 560, 'trapezoidal', 0, '#f97316') + f'<text class="ap" data-en="2" x="1340" y="410" fill="#fff" font-size="30" {T} text-anchor="middle">Trapezoidal TR4</text>' +
  perfil_onda(3, 300, 560, 560, 'teja', 0, '#e07a5f') + f'<text class="ap" data-en="3" x="580" y="650" fill="#fff" font-size="30" {T} text-anchor="middle">Teja andina</text>' +
  perfil_onda(3, 1060, 570, 560, 'panel', 0.8, '#c9d6e3') + f'<text class="ap" data-en="3" x="1340" y="650" fill="#fff" font-size="30" {T} text-anchor="middle">Panel termoacústico</text>')))

E.append(dict(frases=[
  'Comparémoslas en lo que le importa al cliente y a la estructura.',
  'En peso, la teja andina es la más pesada de las cuatro. En pendiente, también es la que más pide.',
  'En ruido, el panel termoacústico es el más silencioso, y la calamina, el más ruidoso. Y en precio, el panel es el más caro.',
  'Los valores exactos de cada producto están en su ficha técnica.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Comparación <span class="nar">rápida</span>', top=100) + tabla(
  ['Cobertura', 'Peso', 'Pendiente', 'Ruido', 'Precio'],
  [['Calamina ondulada', 'Bajo', 'Media', 'Alto', 'Bajo'], ['Trapezoidal TR4', 'Bajo', 'Baja', 'Medio', 'Medio'],
   ['Teja andina', '<b style="color:#ff6b6b">Alto</b>', '<b style="color:#ff6b6b">Alta</b>', 'Bajo', 'Medio'], ['Panel termoacústico', 'Medio', 'Baja', '<b style="color:#7ee08a">Muy bajo</b>', '<b style="color:#ff6b6b">Alto</b>']],
  lambda i: [0, 0, 1, 2][i], top=250, izq=200, der=200, tam=31, nota='Comparación relativa y general: manda la ficha técnica de cada producto.')))

E.append(dict(frases=[
  'La regla más importante: cambiar de cobertura es cambiar el techo.',
  'Una cobertura más pesada carga más a las correas y a los tijerales. Puede pedir correas más juntas, más pendiente, o perfiles más fuertes.',
  'Por eso, si el cliente cambia la cobertura, se vuelve a revisar todo: pendiente, separación de correas y el cálculo de la estructura.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Otra cobertura = <span class="nar">otro techo</span>', top=100) + lista([
  ('⚖️', 'Más peso → correas y tijerales <b class="nar">más fuertes</b>'), ('📐', 'Puede pedir <b class="nar">más pendiente</b>'),
  ('↔️', 'Puede pedir <b class="nar">correas más juntas</b>'), ('🧮', 'Se revisa <b class="nar">el cálculo</b>')],
  lambda i: [1, 1, 1, 2][i], top=260, izq=330, der=330, tam=34)))

E.append(dict(frases=[
  'Entonces, aprende a leer la ficha técnica. Busca siete datos.',
  'El peso por metro cuadrado, el ancho útil y los largos disponibles.',
  'La pendiente mínima, la separación máxima entre correas, y los traslapes: cuánto monta una plancha sobre la otra, a lo largo y a lo ancho.',
  'Y la fijación: qué perno, dónde va y cuántos por correa. Con esos siete datos diseñas y metras sin adivinar.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('La <span class="nar">ficha técnica</span>', top=90) + '<div style="position:absolute;left:300px;right:300px;top:220px;display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
  ''.join(f'<div class="ap" data-en="{e}" data-mas="{0.25*k:.2f}" style="background:rgba(255,255,255,.06);border:2px solid rgba(249,115,22,.6);border-radius:14px;padding:16px 20px;font-size:30px;font-weight:800">{t}</div>'
          for k, (e, t) in enumerate([(1, '⚖️ Peso por m²'), (1, '↔️ Ancho útil'), (1, '📏 Largos disponibles'), (2, '📐 Pendiente mínima'), (2, '🪵 Separación máx. de correas'), (2, '🔁 Traslapes'), (3, '🔩 Fijación')])) + '</div>'))

E.append(dict(frases=[
  'Dos reglas de colocación que valen para casi todas.',
  'Uno: las planchas se colocan empezando por el lado contrario al viento dominante. Así los traslapes laterales quedan de espaldas al viento, y la lluvia no entra empujada.',
  'Dos: en cada faldón se empieza por abajo, en el alero, y se sube. La plancha de arriba monta sobre la de abajo, como las escamas de un pez.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Cómo <span class="nar">se coloca</span>', top=100) + svg(
  ''.join(f'<rect class="pop" data-en="1" data-mas="{0.3*k}" x="{760 + 170*k}" y="360" width="190" height="300" fill="rgba(249,115,22,{0.35 - 0.05*k:.2f})" stroke="#f97316" stroke-width="5"/>' for k in range(4)) +
  '<path class="ap" data-en="1" d="M1700 500 L1560 500" stroke="#5ec4ff" stroke-width="10" marker-end="url(#fv)"/>'
  f'<text class="ap" data-en="1" x="1640" y="460" fill="#5ec4ff" font-size="28" {T} text-anchor="middle">viento</text>'
  f'<text class="ap" data-en="1" x="855" y="710" fill="#fff" font-size="26" {T} text-anchor="middle">1.ª →</text>'
  '<defs><marker id="fv" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#5ec4ff"/></marker></defs>') +
  badge('DE ABAJO HACIA ARRIBA', 2, 380, 450, '#3f9e5a', '↑')))

E.append(dict(frases=[
  'Cuidado con mezclar metales. Si el aluzinc o el galvanizado tocan cobre, o acero sin protección, con la humedad se forma una pila, y uno de los dos se corroe rápido.',
  'Usa pernos y accesorios compatibles con tu plancha, normalmente galvanizados o con recubrimiento, y no dejes restos de viruta de acero sobre la plancha al taladrar: se oxidan y la manchan.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('No mezcles <span class="nar">metales</span>', top=100) + tarjetas([
  ('⚡', 'Par galvánico', 'Aluzinc + cobre<br>= corrosión'), ('🔩', 'Pernos compatibles', 'Galvanizados o<br>con recubrimiento'), ('🧹', 'Limpia la viruta', 'Se oxida y<br>mancha la plancha')],
  lambda i: 0 if i == 0 else 1, top=260, cols=3, alto=320, izq=230)))

E.append(dict(frases=[
  'Los cinco errores con las coberturas.',
  'Uno: cambiar de cobertura sin revisar la estructura.',
  'Dos: menos pendiente de la que pide la ficha.',
  'Tres: colocar a favor del viento dominante.',
  'Cuatro: mezclar metales.',
  'Y cinco: dejar viruta sobre la plancha.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con las coberturas</span>', [
  ('Cambiar sin revisar', 'Correas dobladas.'), ('Poca pendiente', 'Filtra.'), ('A favor del viento', 'Entra la lluvia.'),
  ('Mezclar metales', 'Corrosión rápida.'), ('Viruta encima', 'Manchas de óxido.')])))

E.append(dict(frases=[
  'Tu reto: consigue la ficha técnica de una cobertura que vendan en tu zona, y anota sus siete datos: peso, ancho útil, largos, pendiente mínima, correas, traslapes y fijación.',
  'En la próxima clase: cortes de plancha y remates en el techo a cuatro aguas.',
], html=reto('📄 Ficha técnica de una cobertura de tu zona:<br><b class="nar">anota sus 7 datos</b>', 'CORTES Y REMATES')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: la cobertura se elige con su ficha, y si cambia, se revisa el techo.',
  '¡Nos vemos en la clase diez!',
], html=final('La ficha técnica <span class="nar">manda</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_c9')
