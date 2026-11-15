"""Naves Parabólicas · Clase 11: Luz y ventilación — claraboyas y extractores eólicos."""
from sold_comun import *
from comun import arco_reticulado, parabola

CURSO = 'NAVES PARABÓLICAS · CLASE 11'
ETAPAS_NAV_AV = ['Luces grandes', 'Luz y ventilación', 'Cerramientos', 'Mantenimiento']
E = []

def nave_corte(en, x0=360, x1=1560, piso=780, col=230, flecha=200, mas=0):
    """Corte de la nave: columnas + techo parabólico."""
    base = piso - col
    return (f'<g class="ap" data-en="{en}" data-mas="{mas}"><line x1="{x0-80}" y1="{piso}" x2="{x1+80}" y2="{piso}" stroke="#5c6b78" stroke-width="6"/>'
            f'<line x1="{x0}" y1="{piso}" x2="{x0}" y2="{base}" stroke="#9aa6b0" stroke-width="16"/><line x1="{x1}" y1="{piso}" x2="{x1}" y2="{base}" stroke="#9aa6b0" stroke-width="16"/>'
            f'<polyline points="{parabola(x0, x1, base, flecha)}" fill="none" stroke="#f97316" stroke-width="12"/></g>')

# 0. Gancho
E.append(dict(antes=0.5, frases=[
  'Una nave nueva, bien soldada y bien pintada...',
  '...pero adentro está oscura a mediodía, y hace un calor que no se aguanta. El cliente no vuelve a llamarte.',
  'Hoy aprendes a darle luz natural y ventilación a la nave. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Oscura de día', 'y caliente como un horno', 11, 'LUZ Y VENTILACIÓN', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="1" style="position:absolute;left:1230px;top:300px;font-size:220px">🌡️</div>')))

# 1. Mapa
E.append(escena_obra(1, [
  'Ya sabes armar naves de luces grandes. Ahora, lo que hace que una nave sea cómoda para trabajar.',
  'Hoy: claraboyas para la luz, y extractores con entradas de aire para la ventilación.',
], 'Hoy: <span class="nar">luz y ventilación</span>', ETAPAS_NAV_AV, 'Módulo avanzado', cab=''))

# 2. Por qué
E.append(dict(frases=[
  'El techo de aluzinc refleja buena parte del sol, pero igual se calienta, y ese calor baja a la nave.',
  'El aire caliente es más liviano y sube. Se acumula bajo el techo, como en una olla tapada.',
  'La solución es simple: dejar entrar aire fresco por abajo, y dejar salir el aire caliente por arriba. Es el efecto chimenea, y funciona sin luz eléctrica.',
], zoom=[(0, 1.0, 50, 50), (2, 1.03, 50, 55)], html=titulo('El aire caliente <span class="nar">sube</span>', top=100) +
 '<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">' + nave_corte(0) +
 '<g class="ap" data-en="1"><text x="960" y="470" fill="#ff6b6b" font-size="34" font-weight="900" text-anchor="middle">aire caliente atrapado</text></g>'
 '<g class="pop" data-en="2"><path d="M300 720 L520 720" stroke="#5ec4ff" stroke-width="10" marker-end="url(#fl)"/><path d="M1620 720 L1400 720" stroke="#5ec4ff" stroke-width="10" marker-end="url(#fl)"/>'
 '<path d="M960 640 L960 300" stroke="#ff6b6b" stroke-width="10" marker-end="url(#fr)"/>'
 '<text x="410" y="690" fill="#5ec4ff" font-size="28" font-weight="900" text-anchor="middle">aire fresco</text><text x="1510" y="690" fill="#5ec4ff" font-size="28" font-weight="900" text-anchor="middle">aire fresco</text>'
 '<text x="1080" y="320" fill="#ff6b6b" font-size="28" font-weight="900">sale arriba</text></g>'
 '<defs><marker id="fl" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#5ec4ff"/></marker>'
 '<marker id="fr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#ff6b6b"/></marker></defs></svg>'))

# 3. Claraboyas
E.append(dict(frases=[
  'Primero, la luz. En la clase de cobertura viste que puedes cambiar algunas planchas por policarbonato. Ahora veamos cuánto y dónde.',
  'Usa policarbonato con el mismo perfil trapezoidal de tu plancha, para que traslape igual que el aluzinc.',
  'Como referencia, unas claraboyas de alrededor del diez por ciento del área del techo dan buena luz en un taller o almacén.',
  'Repártelas en franjas a lo largo de la nave, en la parte media del arco. No las pongas en la parte baja, junto a la canaleta, donde corre más agua.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 50)], html=titulo('Claraboyas: <span class="nar">cuánto y dónde</span>', top=100) + tarjetas([
  ('🟦', 'Mismo perfil', 'Policarbonato trapezoidal,<br>traslapa como el aluzinc'), ('📏', '≈ 10 % del techo', 'Referencia para<br>talleres y almacenes'),
  ('↔️', 'En franjas', 'En la parte media del arco,<br>lejos de la canaleta')], lambda i: i + 1, top=260, cols=3, alto=320, izq=230)))

# 4. Ejemplo claraboyas
E.append(dict(frases=[
  'Con nuestra nave de quince por treinta: el techo, medido sobre la curva, tiene unos cuatrocientos setenta y dos metros cuadrados. Es el área que ya calculamos en la clase de presupuesto.',
  'El diez por ciento: unos cuarenta y siete metros cuadrados de policarbonato.',
  'Si cada franja va de arco a arco, con cinco metros de largo y una plancha de un metro de ancho útil, cada franja da cinco metros cuadrados.',
  'Cuarenta y siete entre cinco: unas diez franjas. Por ejemplo, cinco por cada lado del arco, en paños alternados.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">claraboyas</span>', top=100) + tabla(
  ['Paso', 'Cálculo', 'Resultado'],
  [['Área del techo', '≈ 15.75 m × 30 m', '≈ 472 m²'], ['Claraboyas (≈ 10 %)', '472 × 0.10', '≈ 47 m²'], ['Una franja', '5 m × 1 m útil', '5 m²'], ['Franjas', '47 ÷ 5', '≈ 10']],
  lambda i: i, top=240, izq=300, der=300, tam=33, nota='El ancho útil de la plancha lo da tu proveedor; aquí se usa 1 m como ejemplo.')))

# 5. Colocación del policarbonato
E.append(dict(frases=[
  'Al colocarlo, tres cuidados. Uno: la cara con protección contra el sol va hacia arriba. Viene marcada en el plástico protector. Al revés, se pone amarilla y frágil en pocos años.',
  'Dos: el policarbonato se estira con el calor mucho más que el acero. Taladra agujeros un poco más grandes que el perno, para que pueda moverse.',
  'Tres: aprieta solo hasta que la arandela selle. Si aprietas de más, se raja alrededor del perno.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Colocar <span class="nar">sin rajar</span>', top=100) + lista([
  ('☀️', 'Cara con <b class="nar">protección UV hacia arriba</b>'), ('🔩', 'Agujero <b class="nar">un poco más grande</b> que el perno: se dilata'), ('✋', 'Aprieta solo hasta que <b class="nar">la arandela selle</b>')],
  lambda i: i, top=270, izq=330, der=330, tam=34)))

# 6. Ventilación: extractores y entradas
E.append(dict(frases=[
  'Ahora, la ventilación. Arriba, en la cumbre, se colocan extractores eólicos: turbinas que giran con el viento y con el aire caliente que sube. No usan electricidad.',
  'Pero un extractor solo no hace nada si no entra aire. Abajo, en los muros, deja entradas: persianas o rejillas.',
  'La regla: las entradas de abajo deben sumar por lo menos el mismo área libre que las salidas de arriba.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 60)], html=titulo('Sale arriba, <span class="nar">entra abajo</span>', top=100) +
 '<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">' + nave_corte(0) +
 ''.join(f'<g class="pop" data-en="0" data-mas="{0.4*k}"><rect x="{x-22}" y="{y-60}" width="44" height="40" rx="6" fill="#c9d6e3"/><ellipse cx="{x}" cy="{y-66}" rx="34" ry="22" fill="#9aa6b0"/></g>' for k, (x, y) in enumerate([(880, 352), (960, 350), (1040, 352)])) +
 ''.join(f'<g class="pop" data-en="1" data-mas="{0.4*k}"><rect x="{x-14}" y="660" width="28" height="80" fill="#5ec4ff"/></g>' for k, x in enumerate([360, 1560])) +
 '<text class="ap" data-en="1" x="960" y="720" fill="#5ec4ff" font-size="30" font-weight="900" text-anchor="middle">persianas o rejillas en los muros</text></svg>'
 + badge('ENTRADAS ≥ SALIDAS', 2, 780, 200, '#3f9e5a', '✓')))

# 7. Cálculo de extractores
E.append(dict(frases=[
  '¿Cuántos extractores? Se calcula con las renovaciones de aire: cuántas veces por hora se cambia todo el aire de la nave.',
  'Primero el volumen. El frontis de nuestra nave es un rectángulo de quince por cinco, setenta y cinco metros cuadrados, más la parábola: dos tercios de quince por dos diez, veintiuno. Noventa y seis metros cuadrados.',
  'Por treinta metros de largo: dos mil ochocientos ochenta metros cúbicos.',
  'Para un almacén, una referencia es unas cinco renovaciones por hora: catorce mil cuatrocientos metros cúbicos por hora.',
  'Y el caudal de cada extractor lo da la ficha del fabricante. Si cada uno mueve mil ochocientos metros cúbicos por hora: catorce mil cuatrocientos entre mil ochocientos, ocho extractores.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55), (4, 1.0, 50, 50)], html=titulo('En la obra: <span class="nar">¿cuántos extractores?</span>', top=100) + tabla(
  ['Paso', 'Cálculo', 'Resultado'],
  [['Área del frontis', '15 × 5 + ⅔ × 15 × 2.10', '96 m²'], ['Volumen', '96 × 30', '2 880 m³'], ['Aire por hora (5 renovaciones)', '2 880 × 5', '14 400 m³/h'],
   ['Extractores (1 800 m³/h c/u, ficha)', '14 400 ÷ 1 800', '8']],
  lambda i: [1, 2, 3, 4][i], top=240, izq=230, der=230, tam=31, nota='Renovaciones y caudal son de referencia: usa los de la ficha técnica y lo que pida el uso de la nave.')))

# 8. Instalación del extractor en el arco
E.append(dict(frases=[
  'Instálalos en la cumbre, donde se junta el aire más caliente, repartidos a lo largo de la nave.',
  'Cada extractor va sobre una base que copia la forma de la plancha, y se apoya en un marco de ángulos entre dos correas, no solo en la plancha.',
  'Y el sellado: cinta butílica bajo la base y pernos con arandela. La silicona sola, al sol, se cuartea en poco tiempo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Instalar <span class="nar">el extractor</span>', top=100) + tarjetas([
  ('⛰️', 'En la cumbre', 'Repartidos a lo largo<br>de la nave'), ('🔲', 'Marco entre correas', 'La base no carga<br>solo en la plancha'), ('🧷', 'Cinta butílica', 'Sello bajo la base;<br>no solo silicona')],
  lambda i: i, top=260, cols=3, alto=320, izq=230)))

# 9. Errores
E.append(dict(frases=[
  'Los cinco errores de luz y ventilación.',
  'Uno: policarbonato con la cara protegida hacia abajo.',
  'Dos: agujeros justos y pernos apretados de más: se raja.',
  'Tres: claraboyas en la parte baja, junto a la canaleta.',
  'Cuatro: extractores sin entradas de aire abajo.',
  'Y cinco: sellar solo con silicona.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">de luz y ventilación</span>', [
  ('Protección UV abajo', 'Se pone amarillo y frágil.'), ('Agujero justo, apriete fuerte', 'El policarbonato se raja.'), ('Claraboya junto a la canaleta', 'Más agua, más goteras.'),
  ('Sin entradas de aire', 'El extractor no saca nada.'), ('Solo silicona', 'Se cuartea al sol.')])))

# 10. Reto
E.append(dict(frases=[
  'Tu reto: una nave de doce por veinticuatro, con columnas de cuatro metros y medio y flecha óptima. Calcula su volumen,',
  'y cuántos extractores de mil ochocientos metros cúbicos por hora necesitas con seis renovaciones por hora.',
  'En la próxima clase: cerramientos y frontis. Cómo cerrar los lados de la nave.',
], html=reto('🧮 Nave de 12 × 24 m, columnas de 4.50 m, flecha óptima:<br><b class="nar">volumen y n.º de extractores</b><br>(6 renovaciones/h, 1 800 m³/h c/u)', 'CERRAMIENTOS Y FRONTIS').replace('data-en="1" style="position:absolute;left:50%', 'data-en="2" style="position:absolute;left:50%')))

# 11. Final
E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: luz por franjas, aire que entra abajo y sale arriba, y buenos sellos.',
  '¡Nos vemos en la clase doce!',
], html=final('Una nave con <span class="nar">luz y aire</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'naves_c11')
