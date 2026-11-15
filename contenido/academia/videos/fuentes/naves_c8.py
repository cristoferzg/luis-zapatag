"""Curso Naves Parabólicas · Clase 8: Cobertura, canaletas y acabados."""
import sys
from motor import render
from comun import CAJAS, parabola, titulo, pantalla, errores_html, filas_html, cierre

CURSO = 'NAVES PARABÓLICAS · CLASE 8'
E = []
L, F = 15, 2.1
R = L * L / (8 * F)

# 0. Gancho
E.append(dict(antes=0.8, frases=[
  'Puedes tener la mejor estructura del mundo, pero si el techo gotea, el cliente solo va a recordar las goteras.',
  '¡Bienvenido a la clase ocho! Hoy cerramos la nave: la cobertura curvada, las canaletas, y los acabados que hacen que dure.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 55, 45)], html=f'''
<svg style="position:absolute;left:820px;top:200px" width="1040" height="700" viewBox="0 0 1040 700">
 <defs><linearGradient id="tr" x1="0" x2="1"><stop offset="0" stop-color="#1e6fa8"/><stop offset=".5" stop-color="#3b8fd0"/><stop offset="1" stop-color="#1e6fa8"/></linearGradient></defs>
 <path class="ap" data-en="0" d="M{parabola(60, 980, 620, 470).replace(' ', ' L')} L 980 640 L 60 640 Z" fill="url(#tr)" opacity=".9"/>
 {''.join(f'<polyline class="ap" data-en="0" data-mas="{0.05*i:.2f}" points="{parabola(60+i*0, 980, 620-i*0, 470)}" fill="none" stroke="#9cc9ec" stroke-width="2" transform="translate(0 {i*16})" opacity=".35"/>' for i in range(0, 1))}
</svg>
<div style="position:absolute;left:120px;top:300px;width:760px">
 <div class="paso pop" data-en="1"><b>8</b>CLASE 8 DE 9</div>
 <h1 class="t ap" data-en="1" data-mas="0.3" style="margin-top:30px">Cobertura <span class="nar">y canaletas</span></h1>
</div>'''))

# 1. Respuesta del reto
E.append(dict(frases=[
  'El reto de la clase pasada fue tu plan de izaje. Un buen plan responde cinco preguntas.',
  'Cuánto pesa: casi doscientos kilos por arco. Con qué se levanta. De dónde se engancha: dos puntos y balancín.',
  'Quién hace qué: el operador, el señalero y los que llevan las cuerdas guía. Y qué riesgos hay, con su control. Si tu hoja tiene eso, ¡vas muy bien!',
], html=titulo('Respuesta <span class="nar">del reto</span>') + filas_html([('Peso por arco', '≈ 190 kg'), ('Enganche', '2 puntos + balancín'), ('Equipo humano', 'operador · señalero · guías')], 290)))

# 2. La cobertura TR4
E.append(dict(frases=[
  'La cobertura más usada en naves es el aluzinc TR4: planchas de acero con capa de aluminio y zinc, con perfil trapezoidal.',
  'En InnovApp tienes espesores de cero veinticinco, cero treinta, cero treinta y cinco y cero cuarenta milímetros. Para naves, cero treinta es lo más común; si hay mucho viento, o quieres que dure más, sube el espesor.',
  'El ancho útil es un metro: la plancha mide un metro ocho, pero se traslapa una onda con la de al lado.',
  'Y entre filas, el traslape mínimo es de veinte centímetros. InnovApp ya considera todo esto al contar tus planchas.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 50, 55), (3, 1.0, 50, 50)], html=titulo('Aluzinc <span class="nar">TR4</span>', top=110) + '''
<svg style="position:absolute;left:360px;top:250px" width="1200" height="260" viewBox="0 0 1200 260">
 <g class="ap" data-en="0"><path d="M40 160 ''' + ''.join(f'L {60+i*220} 160 L {100+i*220} 80 L {180+i*220} 80 L {220+i*220} 160 ' for i in range(5)) + '''" fill="none" stroke="#9cc9ec" stroke-width="8"/></g>
 <g class="ap" data-en="2"><line x1="40" y1="220" x2="1140" y2="220" stroke="#ffd166" stroke-width="4"/><text x="590" y="250" fill="#ffd166" font-size="28" font-weight="900" text-anchor="middle">1.08 m total · 1.00 m útil</text></g>
</svg>
<div style="position:absolute;left:0;right:0;top:560px;display:flex;justify-content:center;gap:20px">
 <div class="paso pop" data-en="1">0.25</div><div class="paso pop" data-en="1" data-mas="0.4" style="background:#3f9e5a">0.30 · NAVES</div><div class="paso pop" data-en="1" data-mas="0.8">0.35</div><div class="paso pop" data-en="1" data-mas="1.2">0.40 mm</div>
</div>
<div class="tarjeta pop" data-en="3" style="position:absolute;left:560px;right:560px;top:690px;text-align:center;font-size:32px;font-weight:900">Traslape entre filas: <span class="nar">20 cm mínimo</span></div>'''))

# 3. Curvado
E.append(dict(frases=[
  'Ahora, el punto clave: la plancha tiene que seguir la curva del arco.',
  'Mira la curvatura: en la parte alta el arco es más cerrado. El radio en la cumbre es la luz al cuadrado, entre ocho veces la flecha.',
  f'En nuestra nave: doscientos veinticinco, entre dieciséis ochenta: unos {R:.1f} metros de radio.',
  'Pregúntale a tu proveedor el radio mínimo para curvar su plancha en obra, de forma natural. Si tu arco es más cerrado que eso, pídela curvada de fábrica.',
  'Una plancha forzada a una curva que no aguanta se arruga, se abre en los traslapes, y por ahí entra el agua.',
], zoom=[(0, 1.0, 50, 50), (2, 1.08, 50, 45), (4, 1.0, 50, 50)], html=titulo('La plancha <span class="nar">sigue la curva</span>', top=110) + f'''
<svg style="position:absolute;left:310px;top:240px" width="1300" height="460" viewBox="0 0 1300 460">
 <polyline points="{parabola(80, 1220, 420, 300)}" fill="none" stroke="#3b8fd0" stroke-width="14"/>
 <g class="ap" data-en="1"><circle cx="650" cy="{120+1140**2/2400:.0f}" r="{1140**2/2400:.0f}" fill="none" stroke="#ffd166" stroke-width="3" stroke-dasharray="12 9"/>
  <line x1="650" y1="120" x2="650" y2="420" stroke="#ffd166" stroke-width="3"/><text x="670" y="300" fill="#ffd166" font-size="34" font-weight="900">R = L² / 8f</text></g>
</svg>
<div class="tarjeta pop" data-en="2" style="position:absolute;left:560px;right:560px;top:730px;text-align:center;font-size:34px;font-weight:900">R ≈ 225 ÷ 16.8 ≈ <span class="nar">{R:.1f} m</span></div>'''))

# 4. Instalación
pasos_c = [('Empieza a sotavento', 'Contra el viento dominante: el traslape queda protegido.'), ('Primera plancha a escuadra', 'Si la primera sale chueca, todas salen chuecas.'),
           ('Fija en cada correa', 'Autoperforante con arandela de neopreno, como indique el fabricante.'), ('Ni flojo ni sobreapretado', 'La arandela se aplasta un poco, sin deformarse.'),
           ('Traslapes con sello', 'En la parte alta, donde casi no hay pendiente, sella los traslapes.'), ('Limpia las virutas', 'Las limaduras de acero se oxidan y manchan el aluzinc.')]
E.append(dict(frases=[
  'Ahora, la instalación. Empieza por el lado contrario al viento dominante, para que el viento no levante los traslapes.',
  'La primera plancha, perfectamente a escuadra. Si la primera sale chueca, todas salen chuecas.',
  'Fija en cada correa con autoperforantes con arandela de neopreno, en la posición que indique el fabricante. InnovApp calcula unos cuatro y medio pernos por metro cuadrado.',
  'Ni flojos ni sobreapretados: la arandela se aplasta un poco, sin deformarse.',
  'En la parte alta del arco, donde casi no hay pendiente, sella los traslapes.',
  'Y al terminar el día, barre las virutas de los taladros. Se oxidan y dejan manchas de óxido en el aluzinc.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 40), (4, 1.04, 50, 65), (5, 1.0, 50, 50)], html=titulo('Instalación <span class="nar">paso a paso</span>', top=100) +
 '<div style="position:absolute;left:150px;right:150px;top:220px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px">' +
 ''.join(f'<div class="tarjeta ap" data-en="{i}" style="min-height:200px"><div class="paso" style="font-size:20px"><b>{i+1}</b>PASO</div>'
         f'<div style="font-size:30px;font-weight:900;margin-top:12px">{t}</div><div style="font-size:23px;color:#c9d6e3;margin-top:6px">{d}</div></div>' for i, (t, d) in enumerate(pasos_c)) + '</div>'))

# 5. Metrado de cobertura (InnovApp)
E.append(dict(frases=[
  'Metrado de la cobertura. De la clase uno, el largo del arco es quince setenta y cinco, y por treinta metros, unos cuatrocientos setenta y dos metros cuadrados.',
  'InnovApp mide la cobertura con traslapes: cuatrocientos setenta y seis metros cuadrados, que son ciento cincuenta y dos planchas.',
  'Y los pernos: cuatro y medio por metro cuadrado, unos dos mil ciento cincuenta. Unas veintidós cajas de cien.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Metrado de <span class="nar">cobertura</span> · 15 × 30 m', top=110) + filas_html([
  ('15.75 m × 30 m (sin traslapes)', '≈ 472 m²'), ('InnovApp, con traslapes', '476 m² · 152 planchas'), ('476 m² × 4.5 pernos/m²', '≈ 2 150 pernos')], 270)))
E.append(pantalla('p15_materiales', ['Lo ves en la pestaña Materiales: las planchas de aluzinc, y las cajas de pernos autoperforantes, listas para el pedido.'], CAJAS['p15_materiales'], 'Materiales · cobertura', fundido=True))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.0, 50, 50), (0, 1.3, 72, 50)]

# 6. Canaletas
E.append(dict(frases=[
  'Ahora, las canaletas. En una nave parabólica, el agua baja por la curva y llega con fuerza a los costados. Ahí la recoges.',
  'Las canaletas van en los bordes de la caída, a todo el largo de la nave. Y las bajadas, en los extremos y como máximo cada diez metros.',
  'En InnovApp las activas en la vista 3D, con el botón Canaletas.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('<span class="nar">Canaletas</span> y bajadas', top=110) + f'''
<svg style="position:absolute;left:360px;top:250px" width="1200" height="460" viewBox="0 0 1200 460">
 <polyline points="{parabola(150, 1050, 380, 300)}" fill="none" stroke="#3b8fd0" stroke-width="14"/>
 <g class="ap" data-en="0" data-mas="1">{''.join(f'<path d="M{x} {380-300*4*((x-150)/900)*(1-(x-150)/900):.0f} q {"-" if x < 600 else ""}20 18 {"-" if x < 600 else ""}40 30" stroke="#9cc9ec" stroke-width="4" fill="none"/>' for x in (260, 330, 870, 940))}</g>
 <g class="ap" data-en="1"><rect x="90" y="370" width="80" height="34" rx="6" fill="none" stroke="#ffd166" stroke-width="7"/><rect x="1030" y="370" width="80" height="34" rx="6" fill="none" stroke="#ffd166" stroke-width="7"/>
  <line x1="110" y1="404" x2="110" y2="450" stroke="#ffd166" stroke-width="10"/><line x1="1090" y1="404" x2="1090" y2="450" stroke="#ffd166" stroke-width="10"/></g>
</svg>
<div style="position:absolute;left:0;right:0;top:740px;display:flex;justify-content:center;gap:20px">
 <div class="paso pop" data-en="1"><b>✓</b>A TODO EL LARGO</div><div class="paso pop" data-en="1" data-mas="1.5"><b>✓</b>BAJADAS ≤ 10 m</div>
</div>'''))
E.append(pantalla('p26_canaletas_3d', ['Marcas El techo lleva canaletas, y eliges el modelo: rectangular, media caña, cajón. El material: galvanizada o PVC. Y cómo baja el agua: con tubo hasta el piso, o con gárgola.', 'InnovApp las dibuja en el 3D y las suma solas al presupuesto.'], CAJAS['p26_canaletas_3d'], 'Canaletas y bajadas', fundido=True))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.45, 4, 40)]
E[-1]['fundido'] = True

# 7. Acabados
E.append(dict(frases=[
  'Y los acabados, para que la nave dure.',
  'Retoque: todas las soldaduras de obra se limpian y se pintan con anticorrosivo. Ese es el punto donde empieza el óxido.',
  'Acabado: esmalte sobre la base, en el color del proyecto. Y revisa que no queden zonas sin pintar, sobre todo arriba.',
  'Y para la luz natural: puedes cambiar algunas planchas por policarbonato, como claraboyas. En InnovApp también lo tienes en el catálogo de coberturas.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('<span class="nar">Acabados</span> que duran', top=110) + '<div style="position:absolute;left:160px;right:160px;top:270px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px">' +
 ''.join(f'<div class="tarjeta ap" data-en="{i+1}" style="min-height:300px;text-align:center"><div style="font-size:70px">{e}</div><div style="font-size:33px;font-weight:900;margin-top:10px">{t}</div><div style="font-size:24px;color:#c9d6e3;margin-top:8px">{d}</div></div>'
         for i, (e, t, d) in enumerate([('🖌️', 'Retoque', 'Soldaduras de obra: limpiar y anticorrosivo'), ('🎨', 'Esmalte', 'Sobre la base, color del proyecto'), ('☀️', 'Claraboyas', 'Policarbonato para luz natural')])) + '</div>'))

# 8. Errores
E.append(dict(frases=[
  'Los cinco errores que causan goteras.',
  'Uno: forzar la plancha a una curva que no aguanta.',
  'Dos: traslapes cortos, sobre todo en la parte alta.',
  'Tres: pernos sobreapretados, o en ángulo.',
  'Cuatro: canaletas chicas, o sin suficientes bajadas.',
  'Y cinco: dejar las virutas sobre el techo.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">que causan goteras</span>', [
  ('Plancha forzada', 'Se arruga y abre los traslapes.'), ('Traslapes cortos', 'Sobre todo en la parte alta, sin pendiente.'), ('Pernos mal puestos', 'Sobreapretados o en ángulo: la arandela no sella.'),
  ('Canaletas chicas', 'O sin bajadas suficientes: el agua rebalsa.'), ('Virutas sobre el techo', 'Se oxidan y manchan el aluzinc.')])))

# 9. Reto
E.append(dict(frases=[
  '¡Tu reto! Calcula el radio en la cumbre de la nave de veinte metros, con la flecha óptima.',
  'Y en InnovApp, activa las canaletas en tu nave de quince por treinta, y mira cuánto suben el presupuesto.',
  'Las respuestas, en la última clase.',
], html='''
<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><div class="paso pop" data-en="0" style="font-size:30px"><b>★</b>TU RETO</div></div>
<div class="tarjeta ap" data-en="0" data-mas="0.5" style="position:absolute;left:380px;right:380px;top:300px;font-size:36px;line-height:1.6">
 <div>📐 Radio en la cumbre · nave de <b class="nar">20 m</b>, f óptima</div>
 <div class="ap" data-en="1">💧 Activa las <b class="nar">canaletas</b> y mira el presupuesto</div>
</div>'''))

# 10. Cierre
E.append(dict(antes=0.3, despues=2.4, frases=[
  'Resumiendo: aluzinc TR4 del espesor adecuado, curvado según el radio del arco, bien fijado, con traslapes sellados arriba.',
  'Canaletas a todo el largo, bajadas cada diez metros, y retoque de pintura. Así, cero goteras.',
  'En la última clase juntamos todo: metrado y presupuesto completo de la nave. ¡Nos vemos!',
], html=cierre(8, 'Clase 9 · Metrado y presupuesto de la nave', 'MATERIAL: CHECKLIST DE MONTAJE (PDF)')))

if __name__ == '__main__':
    salida = '/home/claude/video/salida/naves_c8.mp4'
    if len(sys.argv) > 1 and sys.argv[1] == 'prueba':
        render(E, CURSO, salida, cuadros={i: [9.0] for i in range(len(E))})
    else:
        render(E, CURSO, salida)
