"""Curso Naves Parabólicas · Clase 7: Izaje y montaje seguro."""
import sys
from motor import render
from comun import CAJAS, parabola, titulo, pantalla, errores_html, filas_html, cierre

CURSO = 'NAVES PARABÓLICAS · CLASE 7'
E = []

# 0. Gancho
E.append(dict(antes=0.8, frases=[
  'El momento más peligroso de toda la obra es cuando el arco está en el aire. Ahí no se improvisa.',
  '¡Bienvenido a la clase siete! Hoy aprendes a planificar el izaje y a montar la nave paso a paso, con seguridad.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 55, 45)], html=f'''
<svg style="position:absolute;left:820px;top:120px" width="1040" height="820" viewBox="0 0 1040 820">
 <g class="ap" data-en="0"><rect x="60" y="700" width="300" height="60" rx="10" fill="#f59e0b"/><line x1="200" y1="700" x2="760" y2="80" stroke="#f59e0b" stroke-width="22"/>
  <line x1="760" y1="80" x2="760" y2="300" stroke="#cfd8e0" stroke-width="4"/>
  <line x1="760" y1="300" x2="560" y2="400" stroke="#cfd8e0" stroke-width="3"/><line x1="760" y1="300" x2="960" y2="400" stroke="#cfd8e0" stroke-width="3"/>
  <rect x="540" y="398" width="440" height="12" fill="#9fb3c6"/></g>
 <g class="ap" data-en="0" data-mas="0.8"><polyline points="{parabola(420, 1100, 760, 330)}" fill="none" stroke="#f97316" stroke-width="12" transform="translate(-60 0)"/>
  <line x1="560" y1="410" x2="560" y2="{760-330*4*(0.2)*(0.8)+0:.0f}" stroke="#cfd8e0" stroke-width="3"/><line x1="960" y1="410" x2="960" y2="{760-330*4*(0.8)*(0.2):.0f}" stroke="#cfd8e0" stroke-width="3"/></g>
</svg>
<div style="position:absolute;left:120px;top:300px;width:760px">
 <div class="paso pop" data-en="1"><b>7</b>CLASE 7 DE 9</div>
 <h1 class="t ap" data-en="1" data-mas="0.3" style="margin-top:30px">Izaje y montaje <span class="nar">seguro</span></h1>
</div>'''))

# 1. Peso del arco
E.append(dict(frases=[
  'Primero, ¿cuánto pesa lo que vas a levantar? Saquemos el peso de un arco de nuestra nave de quince metros, con los datos de InnovApp.',
  'Los dos cordones: quince setenta y cinco metros cada uno, de tubo tres por dos, que pesa cuatro sesenta y cinco el metro. Unos ciento cuarenta y seis kilos.',
  'Las diagonales y montantes: unos cuarenta y cinco kilos más.',
  'En total, casi doscientos kilos por arco. No es mucho peso. El peligro no es el peso: es que el arco es largo, flexible, y el viento lo mueve como una vela.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 60)], html=titulo('¿Cuánto pesa <span class="nar">un arco</span>?', top=110) + filas_html([
  ('Cordones: 2 × 15.75 m × 4.65 kg/m', '≈ 146 kg'), ('Diagonales y montantes', '≈ 45 kg'), ('Peso de un arco (15 m)', '≈ 190 kg')], 260) +
 '<div class="paso pop" data-en="3" data-mas="2" style="position:absolute;left:50%;transform:translateX(-50%);top:640px;font-size:26px;background:#ff6b6b"><b>!</b>EL PELIGRO: LARGO, FLEXIBLE Y CON VIENTO</div>'))

# 2. Equipos de izaje
E.append(dict(frases=[
  '¿Con qué lo levanto? Depende de la obra.',
  'Un camión grúa es lo más rápido y seguro para arcos grandes o columnas altas. Se paga por día, así que ten todo listo antes de que llegue.',
  'Para naves chicas, un tecle o polipasto colgado de una pluma, o de un andamio firme.',
  'Y el tirfor, que jala con cable, sirve para mover, plomar y tensar.',
  'Sea cual sea el equipo: revisa su capacidad, y que esté en buen estado. Y nunca lo uses al límite.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55), (4, 1.0, 50, 50)], html=titulo('Equipos <span class="nar">de izaje</span>', top=110) + '<div style="position:absolute;left:160px;right:160px;top:270px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px">' +
 ''.join(f'<div class="tarjeta ap" data-en="{i+1}" style="min-height:300px;text-align:center"><div style="font-size:70px">{e}</div><div style="font-size:33px;font-weight:900;margin-top:10px">{t}</div><div style="font-size:24px;color:#c9d6e3;margin-top:8px">{d}</div></div>'
         for i, (e, t, d) in enumerate([('🏗️', 'Camión grúa', 'Rápido y seguro para arcos grandes · se paga por día'), ('⛓️', 'Tecle / polipasto', 'Con pluma o andamio firme · naves chicas'), ('🪝', 'Tirfor', 'Jala con cable: mover, plomar, tensar')])) + '</div>'))

# 3. Cómo enganchar
E.append(dict(frases=[
  'Ahora, lo más importante: cómo enganchar el arco.',
  'Nunca lo cuelgues de un solo punto en el centro. El arco se cierra o se abre, y puede quedar deformado para siempre.',
  'Engánchalo de dos puntos, más o menos a un cuarto de la luz desde cada lado, y en nudos, nunca a media pieza.',
  'Lo ideal es usar un balancín: una viga corta que reparte la carga y mantiene las eslingas verticales.',
  'Y en cada extremo, una cuerda guía, o viento, con una persona que controla que el arco no gire.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 72, 50), (4, 1.0, 50, 50)], html=titulo('Cómo <span class="nar">enganchar</span> el arco', top=110) + f'''
<div style="position:absolute;left:140px;top:250px;width:780px" class="tarjeta ap" data-en="1">
 <svg width="720" height="380" viewBox="0 0 720 380"><line x1="360" y1="10" x2="360" y2="100" stroke="#cfd8e0" stroke-width="4"/>
  <polyline points="{parabola(80, 640, 350, 250)}" fill="none" stroke="#ff6b6b" stroke-width="10"/><text x="360" y="230" fill="#ff8a8a" font-size="34" font-weight="900" text-anchor="middle">✕ un solo punto</text></svg></div>
<div style="position:absolute;left:1000px;top:250px;width:780px" class="tarjeta ap" data-en="2">
 <svg width="720" height="380" viewBox="0 0 720 380"><line x1="360" y1="10" x2="360" y2="50" stroke="#cfd8e0" stroke-width="4"/>
  <g class="ap" data-en="3"><rect x="180" y="50" width="360" height="14" fill="#9fb3c6"/></g>
  <line x1="220" y1="64" x2="220" y2="{350-250*4*0.25*0.75:.0f}" stroke="#cfd8e0" stroke-width="4"/><line x1="500" y1="64" x2="500" y2="{350-250*4*0.75*0.25:.0f}" stroke="#cfd8e0" stroke-width="4"/>
  <polyline points="{parabola(80, 640, 350, 250)}" fill="none" stroke="#7ee08a" stroke-width="10"/>
  <g class="ap" data-en="4"><path d="M80 350 q -30 20 -60 10" stroke="#ffd166" stroke-width="4" fill="none" stroke-dasharray="8 6"/><path d="M640 350 q 30 20 60 10" stroke="#ffd166" stroke-width="4" fill="none" stroke-dasharray="8 6"/></g>
  <text x="360" y="230" fill="#7ee08a" font-size="34" font-weight="900" text-anchor="middle">✓ dos puntos + balancín</text></svg></div>'''))

# 4. Secuencia de montaje
pasos_m = [('Columnas', 'Sobre sus placas, aplomadas y arriostradas provisionalmente.'), ('Arco 1 en el piso', 'Si viene en mitades: armarlo, ajustar y medir antes de izar.'),
           ('Izar arco 1', 'Apoyar, fijar y sujetar con vientos. No soltar la grúa antes.'), ('Arco 2', 'Izar y unir de inmediato con correas y cruces.'),
           ('Módulo rígido', 'Primer paño completo: ya es un cajón firme.'), ('Avanzar', 'Arco por arco, con sus correas. Plomar cada 2-3 arcos.')]
E.append(dict(frases=[
  'Esta es la secuencia de montaje, paso a paso.',
  'Uno: las columnas sobre sus placas, aplomadas, y con arriostres provisionales.',
  'Dos: el primer arco se arma en el piso. Si vino en mitades, aquí se empernan y se miden.',
  'Tres: se iza, se apoya, se fija, y se sujeta con vientos. La grúa no lo suelta hasta que esté seguro.',
  'Cuatro y cinco: el segundo arco, y de inmediato correas y cruces. Ya tienes tu módulo rígido.',
  'Y seis: avanzas arco por arco, plomando cada dos o tres arcos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 40), (4, 1.04, 50, 65), (5, 1.0, 50, 50)], html=titulo('Secuencia <span class="nar">de montaje</span>', top=100) +
 '<div style="position:absolute;left:150px;right:150px;top:220px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px">' +
 ''.join(f'<div class="tarjeta ap" data-en="{[1,2,3,4,4,5][i]}" data-mas="{[0,0,0,0,2,0][i]}" style="min-height:200px"><div class="paso" style="font-size:20px"><b>{i+1}</b>PASO</div>'
         f'<div style="font-size:31px;font-weight:900;margin-top:12px">{t}</div><div style="font-size:23px;color:#c9d6e3;margin-top:6px">{d}</div></div>' for i, (t, d) in enumerate(pasos_m)) + '</div>'))
E.append(pantalla('p20_3d_estructura', ['Antes de empezar, reúne a tu equipo frente a la vista 3D de InnovApp.', 'Muéstrales la secuencia: qué arco va primero, dónde van las cruces, y cómo queda la nave terminada. Un equipo que entiende el plan, trabaja más seguro.'], None, 'Explica el montaje con el 3D', fundido=True))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (1, 1.3, 50, 55)]
E[-1]['fundido'] = True

# 5. Plomado y alineamiento
E.append(dict(frases=[
  'Mientras montas, controla tres cosas.',
  'El plomo: que cada arco esté vertical. Con plomada o nivel láser, en los dos extremos del arco.',
  'La alineación: que todos los arcos estén en línea, mirando a lo largo de la nave con un cordel.',
  'Y la distancia entre arcos, igual en todos los paños. Si un arco se va, se corrige con el tirfor y los tensores, antes de soldar las correas.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=titulo('Plomo, <span class="nar">alineación</span> y distancia', top=110) + filas_html([
  ('Plomo de cada arco (plomada o láser)', 'vertical'), ('Alineación (cordel a lo largo)', 'en línea'), ('Distancia entre arcos', 'igual')], 270)))

# 6. Seguridad
E.append(dict(frases=[
  'Y la seguridad, que no se negocia. En el Perú, la norma G cero cincuenta del Reglamento Nacional de Edificaciones regula la seguridad en construcción.',
  'Todo trabajo en altura: arnés de cuerpo completo, enganchado a una línea de vida.',
  'Casco con barbiquejo, guantes y lentes. Y andamios o plataformas firmes, nunca escaleras improvisadas.',
  'Zona de izaje señalizada, y nadie debajo de la carga. Nunca.',
  'Y si el viento mueve la carga, se suspende el izaje. Ningún arco vale más que una persona.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (4, 1.0, 50, 50)], html=titulo('Seguridad <span class="nar">primero</span>', top=110) + '<div style="position:absolute;left:150px;right:150px;top:260px;display:grid;grid-template-columns:repeat(4,1fr);gap:22px;text-align:center">' +
 ''.join(f'<div class="tarjeta ap" data-en="{i+1}" style="min-height:260px"><div style="font-size:66px">{e}</div><div style="font-size:28px;font-weight:900;margin-top:10px">{t}</div></div>'
         for i, (e, t) in enumerate([('🦺', 'Arnés + línea de vida'), ('⛑️', 'Casco con barbiquejo'), ('🚧', 'Nadie bajo la carga'), ('🌬️', 'Viento: se suspende')])) + '</div>'
 '<div class="ap" data-en="0" data-mas="2" style="position:absolute;left:0;right:0;top:600px;text-align:center;font-size:30px;font-weight:800;color:#ffd166">Norma G.050 · Seguridad durante la construcción (RNE)</div>'))

# 7. Errores
E.append(dict(frases=[
  'Los cinco errores más peligrosos del montaje.',
  'Uno: izar el arco de un solo punto.',
  'Dos: izar sin cuerdas guía.',
  'Tres: soltar el arco antes de arriostrarlo.',
  'Cuatro: personas debajo de la carga.',
  'Y cinco: seguir izando con viento fuerte.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">peligrosos</span>', [
  ('Izar de un solo punto', 'El arco se deforma, y puede quedar así.'), ('Sin cuerdas guía', 'El arco gira y golpea.'),
  ('Soltar sin arriostrar', 'Riesgo de volteo.'), ('Personas bajo la carga', 'Nunca, por ningún motivo.'), ('Izar con viento fuerte', 'El arco actúa como vela.')])))

# 8. Reto
E.append(dict(frases=[
  '¡Tu reto! Escribe el plan de izaje para la nave de quince por treinta.',
  'Peso de cada arco, equipo, puntos de enganche, cuántas personas y qué hace cada una, y los riesgos con su control.',
  'Una hoja. Ese plan, presentado al cliente, te hace ver como una empresa seria.',
], html='''
<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><div class="paso pop" data-en="0" style="font-size:30px"><b>★</b>TU RETO</div></div>
<div class="tarjeta ap" data-en="0" data-mas="0.5" style="position:absolute;left:380px;right:380px;top:300px;font-size:34px;line-height:1.6">
 <div>📝 Plan de izaje · nave <b class="nar">15 × 30 m</b></div>
 <div class="ap" data-en="1">⚖️ Peso · 🏗️ equipo · 🪝 enganche · 👷 equipo humano · ⚠️ riesgos</div>
 <div class="ap" data-en="2">🏆 Preséntalo al cliente</div>
</div>'''))

# 9. Cierre
E.append(dict(antes=0.3, despues=2.4, frases=[
  'Resumiendo: conoce el peso, elige el equipo, engancha de dos puntos con balancín y cuerdas guía, y sigue la secuencia del módulo rígido.',
  'Plomo, alineación y distancia en cada arco. Y la seguridad, siempre primero.',
  'En la próxima clase cerramos la nave: cobertura, canaletas y acabados. ¡Nos vemos!',
], html=cierre(7, 'Clase 8 · Cobertura, canaletas y acabados', 'MATERIAL: CHECKLIST DE MONTAJE (PDF)')))

if __name__ == '__main__':
    salida = '/home/claude/video/salida/naves_c7.mp4'
    if len(sys.argv) > 1 and sys.argv[1] == 'prueba':
        render(E, CURSO, salida, cuadros={i: [9.0] for i in range(len(E))})
    else:
        render(E, CURSO, salida)
