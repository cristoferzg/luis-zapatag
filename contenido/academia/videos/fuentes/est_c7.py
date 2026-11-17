"""Estructuras Metálicas · Clase 7: Montaje del mezanine — ejes, anclajes, plomo, nivel y secuencia."""
from sold_comun import *
from est_c1 import ETAPAS_EST, OBRA

CURSO = 'ESTRUCTURAS METÁLICAS · CLASE 7'
E = []

E.append(dict(antes=0.5, frases=[
  'Todas las piezas llegaron perfectas del taller...',
  '...pero en el taller del cliente, una columna quedó torcida, y las vigas ya no calzaban. El problema no era la fabricación: era el montaje.',
  'En esta última clase montamos el mezanine paso a paso. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Todo perfecto', 'hasta montar', 7, 'MONTAJE', soldando=False) + '''
<svg class="ap" data-en="0" style="position:absolute;left:1150px;top:300px" width="600" height="520" viewBox="0 0 600 520">
 <rect x="60" y="80" width="40" height="420" fill="#9aa6b0"/><rect x="480" y="80" width="40" height="420" fill="#ff6b6b" transform="rotate(4 500 500)"/>
 <rect x="60" y="70" width="440" height="30" fill="#f97316"/><text x="300" y="50" fill="#ff6b6b" font-size="36" font-weight="900" text-anchor="middle">no calza</text></svg>'''))

E.append(escena_obra(6, [
  'Llegamos a la última etapa. Todo el mezanine está fabricado y pintado. Ahora se arma dentro del taller del cliente.',
  'Aquí no hay grúa grande: se monta con tecle, andamio y buena organización.',
], 'Hoy: <span class="nar">montaje del mezanine</span>', ETAPAS_EST, OBRA))

E.append(dict(frases=[
  'Paso uno: el replanteo. Marca en el piso los ejes de las seis columnas, con wincha y tiralíneas.',
  'Y controla con las diagonales, igual que en el taller: en un rectángulo de cuatro por seis, las dos diagonales deben medir igual, unos siete metros veintiún centímetros.',
  'Después, los niveles: con nivel láser o manguera, marca la altura del piso terminado. Ningún piso de taller es perfectamente plano.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('1. <span class="nar">Replanteo</span> de ejes y niveles', top=110) + f'''
<svg style="position:absolute;left:560px;top:250px" width="800" height="520" viewBox="0 0 800 520">
 <rect class="ap" data-en="0" x="100" y="80" width="600" height="400" fill="none" stroke="#c9d6e3" stroke-width="3" stroke-dasharray="12 8"/>
 {"".join(f'<g class="pop" data-en="0" data-mas="{0.3*k:.1f}"><line x1="{x-22}" y1="{y}" x2="{x+22}" y2="{y}" stroke="#f97316" stroke-width="6"/><line x1="{x}" y1="{y-22}" x2="{x}" y2="{y+22}" stroke="#f97316" stroke-width="6"/></g>' for k, (x, y) in enumerate([(100, 80), (400, 80), (700, 80), (100, 480), (400, 480), (700, 480)]))}
 <g class="ap" data-en="1"><line x1="100" y1="80" x2="700" y2="480" stroke="#ffd166" stroke-width="4"/><line x1="700" y1="80" x2="100" y2="480" stroke="#5cc8ff" stroke-width="4"/>
 <text x="400" y="40" fill="#7ee08a" font-size="30" font-weight="900" text-anchor="middle">diagonales iguales ≈ 7.21 m</text></g>
</svg>'''))

E.append(dict(frases=[
  'Paso dos: los anclajes. En un mezanine dentro de un taller, las columnas casi siempre se anclan a un piso de concreto que ya existe.',
  'Para eso hay anclajes químicos, con resina, o mecánicos, de expansión. La profundidad, el diámetro de la broca y la distancia al borde los da el fabricante del anclaje. Respétalos al pie de la letra.',
  'Y antes de perforar: confirma con el ingeniero que ese piso aguanta las cargas de las columnas. Un piso delgado o sin acero puede romperse bajo la placa.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('2. <span class="nar">Anclajes</span> al piso existente', top=110) + tarjetas([
  ('🧪', 'Químico (resina)', 'Muy firme · respeta el tiempo de curado'), ('🔩', 'Mecánico (expansión)', 'Rápido · broca y profundidad exactas'), ('🧱', '¿El piso aguanta?', 'Confírmalo con el ingeniero antes de perforar')],
  lambda i: [0, 1, 2][i] if i < 2 else 2, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Paso tres: el orden de montaje. Primero las columnas, con sus placas sobre los anclajes, sin ajuste final.',
  'Después, las vigas principales, empernadas a las columnas, también sin ajuste final.',
  'Luego, los arriostres, temporales o definitivos, para que el conjunto no se mueva.',
  'Recién ahí, plomo y nivel. Y al final, las viguetas, el piso y la baranda.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('3. El <span class="nar">orden</span> de montaje', top=110) +
 '<div style="position:absolute;left:120px;right:120px;top:320px;display:flex;align-items:center;justify-content:space-between">' + ''.join(
  f'<div class="pop" data-en="{e}" data-mas="{m}" style="text-align:center;width:220px"><div style="width:84px;height:84px;margin:0 auto;border-radius:50%;background:#f97316;display:grid;place-items:center;font-size:36px;font-weight:900">{i+1}</div><div style="font-size:27px;font-weight:900;margin-top:12px">{t}</div></div>'
  for i, (t, e, m) in enumerate([('Columnas', 0, 0), ('Vigas', 1, 0), ('Arriostres', 2, 0), ('Plomo y nivel', 3, 0), ('Viguetas y piso', 3, 1), ('Baranda', 3, 2)])) + '</div>'))

E.append(dict(frases=[
  'Paso cuatro: plomo y nivel. Una referencia común es que la columna no se desvíe más de uno en quinientos de su altura.',
  'En nuestras columnas de tres metros: tres mil entre quinientos, seis milímetros como máximo. Mídelo con plomada o nivel, en las dos caras de la columna.',
  'Las vigas se controlan a nivel con el láser o la manguera. Si hace falta, se corrige con lainas de acero bajo la placa, nunca con piedras ni madera.',
  'Recién cuando todo está a plomo y a nivel, se hace el ajuste final de los pernos.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('4. <span class="nar">Plomo y nivel</span>', top=110) + f'''
<svg style="position:absolute;left:250px;top:250px" width="560" height="560" viewBox="0 0 560 560">
 <rect x="230" y="40" width="70" height="460" fill="#9aa6b0"/><line class="ap" data-en="0" x1="330" y1="40" x2="330" y2="480" stroke="#ffd166" stroke-width="3"/>
 <circle class="ap" data-en="0" cx="330" cy="490" r="14" fill="#ffd166"/><text class="ap" data-en="1" x="360" y="280" fill="#7ee08a" font-size="30" font-weight="900">≤ 6 mm</text>
 <rect x="170" y="500" width="190" height="20" fill="#5cc8ff"/></svg>
<div style="position:absolute;left:900px;right:150px;top:290px">
 <div class="tarjeta ap" data-en="0" style="font-size:30px;margin:12px 0">📐 Plomo: <b class="nar">≤ altura / 500</b></div>
 <div class="tarjeta ap" data-en="1" style="font-size:30px;margin:12px 0">3000 mm ÷ 500 = <b class="nar">6 mm</b> · en las 2 caras</div>
 <div class="tarjeta ap" data-en="2" style="font-size:30px;margin:12px 0;border-color:#5cc8ff">⬛ Corrige con <b>lainas de acero</b>, nunca piedras ni madera</div>
 <div class="tarjeta ap" data-en="3" style="font-size:30px;margin:12px 0;border-color:#7ee08a">🔧 Ajuste final <b>después</b> de plomo y nivel</div>
</div>'''))

E.append(dict(frases=[
  'Paso cinco: la entrega. Retoca la pintura donde se rayó en el montaje y en las cabezas de los pernos.',
  'Revisa todos los pernos con una marca de pintura: así se ve cuáles ya se ajustaron.',
  'Y entrega al cliente con una lista de control: medidas, plomo, nivel, pernos, piso y baranda. Con fotos. Eso te diferencia de los demás.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('5. La <span class="nar">entrega</span>', top=110) + lista([
  ('🖌️', 'Retoca la pintura rayada y las cabezas de pernos'), ('✅', 'Marca cada perno ajustado'), ('📋', 'Lista de control con fotos: medidas, plomo, nivel, pernos, piso, baranda')],
  lambda i: i, top=290, izq=280, der=280, tam=32)))

E.append(dict(frases=[
  'Los cinco errores del montaje.',
  'Uno: no replantear con diagonales, y montar sobre ejes chuecos.',
  'Dos: perforar anclajes sin saber si el piso aguanta, o sin respetar la ficha del anclaje.',
  'Tres: ajustar todos los pernos al final antes de aplomar.',
  'Cuatro: nivelar con piedras o pedazos de madera.',
  'Y cinco: montar sin arriostres, con columnas sueltas que se pueden caer.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">del montaje</span>', [
  ('Ejes chuecos', 'Todo lo demás sale mal.'), ('Anclajes sin ficha', 'El anclaje o el piso fallan.'), ('Ajustar antes de aplomar', 'Queda torcido y trabado.'),
  ('Nivelar con piedras', 'Se aplastan o se mueven.'), ('Sin arriostres', 'Riesgo de que algo se caiga.')])))

E.append(dict(frases=[
  'Tu reto final: arma la lista de control de entrega para tu próxima estructura. Con medidas, plomo, nivel, pernos y fotos.',
  'Mándanosla. Y en la próxima clase empieza el módulo avanzado: los tijerales planos.',
], html=reto('📋 Arma tu lista de control de entrega:<br><b class="nar">medidas · plomo · nivel · pernos · fotos</b>', 'TIJERALES')))

E.append(dict(antes=0.3, despues=3.0, frases=[
  '¡Felicitaciones! Terminaste el módulo principal de Estructuras Metálicas. Desde los perfiles hasta la entrega, ya sabes cómo se hace un trabajo profesional.',
  'Ahora viene el módulo avanzado: tijerales, arriostres y viento, refuerzos, y calidad. ¡Nos vemos en la clase ocho!',
], html=final('¡Módulo principal <span class="nar">completado</span>!')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'est_c7')
