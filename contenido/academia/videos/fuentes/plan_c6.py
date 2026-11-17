"""Lectura de Planos Metálicos · Clase 6: Marcas de piezas y plano de montaje."""
from sold_comun import *
from plan_c1 import ETAPAS_PLAN, OBRA

CURSO = 'LECTURA DE PLANOS · CLASE 6'
E = []

def planta_montaje(en, x, y, esc=1.0):
    xs = [120, 420, 720]; ys = [120, 520]
    s = f'<svg class="ap" data-en="{en}" style="position:absolute;left:{x}px;top:{y}px" width="{860*esc}" height="{640*esc}" viewBox="0 0 860 640"><rect x="0" y="0" width="860" height="640" rx="10" fill="#f4f1e8"/>'
    for yy in ys: s += f'<line x1="{xs[0]}" y1="{yy}" x2="{xs[2]}" y2="{yy}" stroke="#2b3640" stroke-width="3" stroke-dasharray="20 8"/>'
    for xx in xs: s += f'<line x1="{xx}" y1="{ys[0]}" x2="{xx}" y2="{ys[1]}" stroke="#c0392b" stroke-width="10"/><text x="{xx+14}" y="330" fill="#c0392b" font-size="28" font-weight="900">V1</text>'
    for k in range(1, 8):
        for x0 in (120, 420):
            yy = 120 + k * 50
            s += f'<line x1="{x0}" y1="{yy}" x2="{x0+300}" y2="{yy}" stroke="#5c6b7a" stroke-width="4"/>'
    s += '<text x="270" y="105" fill="#5c6b7a" font-size="24" font-weight="900" text-anchor="middle">VT1 (típ.)</text>'
    for xx in xs:
        for yy in ys: s += f'<rect x="{xx-18}" y="{yy-18}" width="36" height="36" fill="#f97316"/><text x="{xx}" y="{yy+(56 if yy > 300 else -30)}" fill="#2b3640" font-size="26" font-weight="900" text-anchor="middle">C1</text>'
    return s + '</svg>'

E.append(dict(antes=0.5, frases=[
  'Llegaron a la obra cuarenta piezas que parecen iguales...',
  '...pero no lo son. Una viga es dos centímetros más larga, una cartela es de la otra mano. Y nadie sabe cuál va dónde. Medio día perdido probando.',
  'En esta última clase aprendes a leer las marcas de las piezas y el plano de montaje. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('¿Cuál', 'va dónde?', 6, 'MARCAS Y MONTAJE', soldando=False) + planta_montaje(0, 1080, 280, 0.8)))

E.append(escena_obra(5, [
  'Ya sabemos leer las láminas del mezanine: escalas, vistas, ejes, soldaduras y notas.',
  'Falta lo que conecta el taller con la obra: las marcas de las piezas, y el plano de montaje.',
], 'Hoy: <span class="nar">marcas y plano de montaje</span>', ETAPAS_PLAN, OBRA))

E.append(dict(frases=[
  'Cada pieza de una estructura tiene una marca: un código corto. Las letras dicen qué es: C, columna. V, viga. V T, vigueta. P L, plancha.',
  'Y el número distingue piezas distintas del mismo tipo: V uno, V dos.',
  'La regla: piezas idénticas llevan la misma marca. Si dos piezas se diferencian en algo, aunque sea un agujero, llevan marcas diferentes.',
  'Y las piezas de mano, como vimos en la clase dos, se marcan distinto: V uno, y V uno opuesta.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Las <span class="nar">marcas</span>', top=110) + tabla(
  ['Marca', 'Qué es'], [['C1', 'Columna'], ['V1 · V2', 'Vigas distintas'], ['VT1', 'Vigueta'], ['PL1', 'Plancha'], ['V1 opuesta', 'Pieza de mano (espejo)']],
  lambda i: [0, 1, 0, 0, 3][i], top=250, izq=520, der=520, tam=33) + badge('IDÉNTICAS = MISMA MARCA · DISTINTAS = OTRA MARCA', 2, 470, 800, '#3f9e5a', '=')))

E.append(dict(frases=[
  'Hay dos tipos de planos para esto. Los planos de fabricación: un dibujo por cada marca, con todas sus medidas, agujeros y soldaduras. Son para el taller.',
  'Y el plano de montaje: la estructura completa, vista en planta y elevación, mostrando qué marca va en cada sitio. Es para la obra.',
  'Mira el plano de montaje del mezanine: seis columnas C uno en los cruces de ejes, tres vigas V uno, y las viguetas V T uno, marcadas como típicas.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 30, 55)], html=titulo('Fabricación <span class="nar">y montaje</span>', top=100) + planta_montaje(2, 160, 230, 0.95) + lista([
  ('🏭', '<b>Fabricación</b>: un dibujo por marca, con todo'), ('🏗️', '<b>Montaje</b>: qué marca va en cada sitio'), ('🗺️', 'Mezanine: 6 × C1 · 3 × V1 · VT1 típicas')],
  lambda i: i, top=300, izq=1030, der=90, tam=28)))

E.append(dict(frases=[
  'Junto al plano de montaje viene la lista de piezas: marca, cantidad, perfil, largo y peso.',
  'Es la misma tabla del metrado que hicimos en el curso de estructuras. Y sirve para tres cosas: comprar, controlar la fabricación, y revisar el despacho.',
  'Antes de que salga el camión, se marca en la lista cada pieza que se carga. En la obra, se vuelve a marcar al recibirla. Así no se pierde nada.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La <span class="nar">lista de piezas</span>', top=100) + tabla(
  ['Marca', 'Cant.', 'Perfil', 'Largo', 'Peso'], [['C1', '6', 'Tubo 6"×6"×4.5', '3.00 m', '364 kg'], ['V1', '3', 'W8×18', '3.83 m', '≈ 308 kg'], ['VT1', '16', 'C 6"×2"×2.5', '≈ 2.85 m', '≈ 242 kg'], ['PL1', '6', 'PL 300×300×12', '—', '51 kg']],
  lambda i: 0, top=240, izq=230, der=230, tam=30, nota='Largos de corte de V1 y VT1 descontando las columnas, como en la clase de tolerancias de Estructuras.') +
 badge('SE MARCA AL CARGAR Y AL RECIBIR', 2, 650, 680, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Cómo marcar en el taller: con plumón de pintura o con punzón, siempre en el mismo extremo de la pieza. Por ejemplo, el extremo que va hacia el eje uno.',
  'Así, en la obra, la marca no solo dice qué pieza es, sino también hacia dónde va.',
  'Y cuida que la pintura no tape la marca: márcala otra vez después de pintar, o déjala en una zona protegida.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Cómo <span class="nar">marcar</span>', top=110) + '''
<svg style="position:absolute;left:330px;top:300px" width="1260" height="260" viewBox="0 0 1260 260">
 <rect x="40" y="90" width="1180" height="80" fill="#9aa6b0"/>
 <g class="ap" data-en="0"><text x="80" y="145" fill="#f4f1e8" font-size="46" font-weight="900">V1 →1</text></g>
 <g class="ap" data-en="1"><text x="80" y="60" fill="#ffd166" font-size="30" font-weight="900">marca + orientación (hacia el eje 1)</text></g>
</svg>''' + badge('REMARCA DESPUÉS DE PINTAR', 2, 690, 650, '#ff6b6b', '!')))

E.append(dict(frases=[
  'Los cinco errores con marcas y montaje.',
  'Uno: piezas sin marca.',
  'Dos: la misma marca para piezas que no son idénticas.',
  'Tres: pintar encima de la marca.',
  'Cuatro: montar sin plano de montaje, "a ojo".',
  'Y cinco: no controlar el despacho con la lista. Una pieza que se queda en el taller para toda la obra.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con marcas y montaje</span>', [
  ('Piezas sin marca', 'Nadie sabe cuál va dónde.'), ('Marca repetida', 'Piezas distintas se confunden.'), ('Marca pintada', 'Se pierde en el taller.'),
  ('Montar a ojo', 'Piezas en el sitio equivocado.'), ('Sin control de despacho', 'Falta una pieza en la obra.')])))

E.append(dict(frases=[
  'Tu reto final: para un trabajo tuyo, haz la lista de piezas con marca, cantidad, perfil, largo y peso, y un croquis de montaje con las marcas en su sitio.',
  'Mándanoslo. Y en la próxima clase empieza el módulo avanzado: el plano de cimentación y anclajes.',
], html=reto('🗺️ Para un trabajo tuyo:<br><b class="nar">lista de piezas con marcas · croquis de montaje</b>', 'CIMENTACIÓN')))

E.append(dict(antes=0.3, despues=3.0, frases=[
  '¡Felicitaciones! Terminaste el módulo principal de Lectura de Planos. Rótulo, escalas, vistas, ejes, soldaduras, notas y montaje: ya puedes leer un plano de principio a fin.',
  'Ahora viene el módulo avanzado: cimentación, planos de arquitectura y tu propio croquis. ¡Nos vemos en la clase siete!',
], html=final('¡Módulo principal <span class="nar">completado</span>!')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'plan_c6')
