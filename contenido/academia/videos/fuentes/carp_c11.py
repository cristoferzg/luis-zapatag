"""Carpintería Metálica · Clase 11: Cercos perimétricos."""
from sold_comun import *
from carp_c8 import ETAPAS_CARP_AV

CURSO = 'CARPINTERÍA METÁLICA · CLASE 11'
E = []

def cerco(en, x, y, n=5, ciego=False, caido=False, mas=0):
    s = f'<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="760" height="420" viewBox="0 0 760 420">'
    s += '<line x1="0" y1="330" x2="760" y2="330" stroke="#56687a" stroke-width="8"/>'
    for k in range(n):
        xx = 60 + k * 160
        rot = f'transform="rotate({12 if caido and k == 2 else 0} {xx} 330)"'
        s += f'<g {rot}><rect x="{xx-8}" y="60" width="16" height="330" fill="#9aa6b0"/></g><rect x="{xx-30}" y="330" width="60" height="70" fill="#7d7468"/>'
        if k < n - 1:
            if ciego: s += f'<rect x="{xx+8}" y="80" width="144" height="240" fill="#7d8f9f"/>'
            else: s += ''.join(f'<line x1="{xx+8}" y1="{80+j*20}" x2="{xx+152}" y2="{80+j*20}" stroke="rgba(201,214,227,.5)" stroke-width="2"/>' for j in range(13)) + ''.join(f'<line x1="{xx+8+j*16}" y1="80" x2="{xx+8+j*16}" y2="320" stroke="rgba(201,214,227,.5)" stroke-width="2"/>' for j in range(10))
    return s + '</svg>'

E.append(dict(antes=0.5, frases=[
  'El cerco del terreno quedó bonito y recto...',
  '...hasta que los postes se pudrieron de óxido a ras del suelo, y una tarde de viento, un tramo se fue al piso.',
  'En esta última clase del módulo aprendes a hacer cercos perimétricos firmes y que duren. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Un tramo', 'al piso', 11, 'CERCOS', soldando=False) + cerco(0, 1080, 320, n=4, caido=True)))

E.append(escena_obra(3, [
  'Llegamos a la última clase del módulo avanzado.',
  'Cercos de terrenos, colegios, fábricas y canchas: muchos metros lineales, y un trabajo que se repite. Si lo haces bien, te llaman para el siguiente.',
], 'Hoy: <span class="nar">cercos perimétricos</span>', ETAPAS_CARP_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'Hay tres tipos comunes. De malla, olímpica o electrosoldada, con postes: económico y deja pasar el viento.',
  'De paneles de reja: más seguro y de mejor vista.',
  'Y ciego, de planchas: da privacidad, pero recibe todo el empuje del viento, como una vela. Necesita postes más fuertes.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Tres <span class="nar">tipos de cerco</span>', top=110) + tarjetas([
  ('🕸️', 'De malla', 'Económico · deja pasar el viento'), ('▮▮▮', 'De paneles de reja', 'Más seguro, mejor vista'), ('⬛', 'Ciego (planchas)', 'Privacidad · recibe todo el viento')],
  lambda i: i, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Los postes: tubo de dos a tres pulgadas, cada dos y medio a tres metros, según la altura y el tipo de cerco.',
  'Cada poste va en un dado de concreto. Como referencia, para un cerco de dos metros de malla, un dado de unos treinta por treinta, por sesenta centímetros de profundidad. En suelos blandos o cercos ciegos, el ingeniero puede pedir más.',
  'Y en las esquinas y en los arranques, el poste lleva un puntal, una diagonal, porque ahí se jala toda la malla.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Los <span class="nar">postes</span>', top=110) + cerco(0, 160, 290, n=4) + lista([
  ('📏', 'Tubo <b>2" a 3"</b>, cada <b>2.5 a 3 m</b>'), ('🧱', 'Dado de concreto: ≈ <b>30 × 30 × 60 cm</b> (cerco de malla de 2 m)'), ('↗️', '<b>Puntales</b> en esquinas y arranques')],
  lambda i: i, top=300, izq=960, der=100, tam=28)))

E.append(dict(frases=[
  'El punto débil de un poste es la línea del suelo: ahí hay humedad y oxígeno, y el óxido avanza rápido.',
  'Remata el dado de concreto con una corona en pendiente, para que el agua escurra y no se empoce junto al tubo.',
  'Pinta con más cuidado ese tramo, y tapa el tubo arriba, para que no entre agua por dentro.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El enemigo: <span class="nar">el óxido en la base</span>', top=110) + '''
<svg style="position:absolute;left:660px;top:250px" width="600" height="520" viewBox="0 0 600 520">
 <rect x="0" y="300" width="600" height="220" fill="#7d7468"/><rect x="200" y="300" width="200" height="200" fill="#a39d92"/>
 <polygon class="ap" data-en="1" points="200,300 300,270 400,300" fill="#c9c3b8"/>
 <rect x="282" y="40" width="36" height="420" fill="#9aa6b0"/><rect class="ap" data-en="2" x="276" y="30" width="48" height="14" fill="#f97316"/>
 <rect class="ap" data-en="0" x="276" y="255" width="48" height="50" fill="none" stroke="#ff6b6b" stroke-width="5"/>
</svg>''' + badge('CORONA EN PENDIENTE · TAPA ARRIBA', 2, 650, 800, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Para que la malla quede templada, lleva alambres tensores: arriba, abajo y al medio, tensados desde los postes de esquina.',
  'Y antes de empezar, algo que evita problemas grandes: confirma con el cliente por dónde va el límite del terreno. Un cerco puesto en terreno del vecino se tiene que sacar.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Malla templada <span class="nar">y en su sitio</span>', top=110) + tarjetas([
  ('〰️', 'Alambres tensores', 'Arriba, abajo y al medio'), ('📍', 'El límite del terreno', 'Confírmalo con el cliente antes de empezar')],
  lambda i: i, top=290, cols=2, alto=300, izq=380)))

E.append(dict(frases=[
  'Ejemplo: un cerco de malla de cuarenta metros de largo y dos de alto.',
  'Con postes cada dos y medio metros: cuarenta entre dos y medio, dieciséis tramos. Diecisiete postes.',
  'Cada poste mide dos metros libres, más sesenta centímetros empotrados: dos sesenta. Diecisiete por dos sesenta: cuarenta y cuatro metros de tubo, más los puntales de las esquinas.',
  'Y el concreto: diecisiete dados de treinta por treinta por sesenta. Cero punto cero cinco cuatro metros cúbicos cada uno: casi un metro cúbico en total.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">cerco de 40 m</span>', top=100) + tabla(
  ['Dato', 'Cálculo', 'Resultado'], [['Tramos', '40 ÷ 2.5', '16'], ['Postes', '16 + 1', '17'], ['Tubo', '17 × (2.00 + 0.60)', '≈ 44.2 m + puntales'], ['Concreto', '17 × 0.30 × 0.30 × 0.60', '≈ 0.92 m³'], ['Malla', '40 m × 2 m', '80 m²']],
  lambda i: [1, 1, 2, 3, 3][i], top=240, izq=280, der=280, tam=31)))

E.append(dict(frases=[
  'Los cinco errores con cercos.',
  'Uno: postes poco empotrados o sin dado de concreto.',
  'Dos: base del poste donde se empoza el agua.',
  'Tres: cerco ciego con los postes de un cerco de malla.',
  'Cuatro: malla floja, sin tensores ni puntales.',
  'Y cinco: no confirmar el límite del terreno.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con cercos</span>', [
  ('Postes sin dado', 'Se inclinan o se caen.'), ('Agua en la base', 'Óxido a ras del suelo.'), ('Ciego con postes de malla', 'El viento lo tumba.'),
  ('Malla floja', 'Se ve mal y se deforma.'), ('Sin confirmar el límite', 'Hay que sacarlo.')])))

E.append(dict(frases=[
  'Tu reto final: calcula los postes, los metros de tubo, el concreto de los dados y la malla para un cerco de sesenta metros de largo y dos de alto, con postes cada tres metros.',
  'Mándanos tu cálculo, y te ayudamos a revisarlo.',
], html=reto('🧮 Cerco de 60 × 2 m, postes cada 3 m:<br><b class="nar">postes · tubo · concreto · malla</b>', 'TU PRÓXIMO CERCO')))

E.append(dict(antes=0.3, despues=3.0, frases=[
  '¡Felicitaciones! Terminaste el curso completo de Carpintería Metálica, con el módulo avanzado.',
  'Ventanas, toldos, estanterías y cercos: ahora tienes muchos más trabajos para ofrecer. ¡Éxitos!',
], html=final('¡Curso <span class="nar">completado</span>!')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'carp_c11')
