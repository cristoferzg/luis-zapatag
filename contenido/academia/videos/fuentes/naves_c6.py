"""Curso Naves Parabólicas · Clase 6: Fabricación en serie en el taller (plantilla, control, pintura y transporte)."""
import sys
from motor import render, EMBLEMA
from comun import CAJAS, parabola, titulo, pantalla

CURSO = 'NAVES PARABÓLICAS · CLASE 6'
E = []
def errores_html(titulo_html, errores):
    return titulo(titulo_html, top=110) + '<div style="position:absolute;left:220px;right:220px;top:230px">' + ''.join(
        f'<div class="ap" data-en="{i+1}" style="display:flex;gap:22px;align-items:center;background:rgba(255,93,93,.08);border:2px solid rgba(255,107,107,.55);border-radius:18px;padding:14px 24px;margin:12px 0">'
        f'<span style="background:#ff6b6b;color:#fff;font-weight:900;font-size:30px;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;flex:none">✕</span>'
        f'<div><div style="font-size:33px;font-weight:900">{t}</div><div style="font-size:25px;color:#c9d6e3">{d}</div></div></div>' for i, (t, d) in enumerate(errores)) + '</div>'
def filas_html(items, top=240):
    return f'<div style="position:absolute;left:260px;right:260px;top:{top}px">' + ''.join(
        f'<div class="ap" data-en="{i+1}" style="display:grid;grid-template-columns:70px 1fr 300px;align-items:center;gap:20px;background:rgba(255,255,255,.06);border:2px solid rgba(249,115,22,.45);border-radius:18px;padding:16px 24px;margin:14px 0">'
        f'<span class="paso" style="font-size:22px;padding:8px"><b>{i+1}</b></span><div style="font-size:30px;font-weight:800">{t}</div><div style="font-size:34px;font-weight:900;color:#ffd166;text-align:right">{r}</div></div>' for i, (t, r) in enumerate(items)) + '</div>'
def cierre(n, siguiente, material):
    return f'''
<div style="position:absolute;left:0;right:0;top:220px;text-align:center">
 <img class="pop" data-en="0" src="data:image/png;base64,{EMBLEMA}" style="width:170px;height:164px;background:#fff;border-radius:34px;padding:14px">
 <h2 class="t ap" data-en="0" data-mas="0.4" style="margin-top:30px">¡Clase {n} <span class="nar">completada</span>!</h2>
 <div class="ap" data-en="2" style="margin-top:26px;font-size:34px;color:#c9d6e3;font-weight:600">Siguiente: <b style="color:#fff">{siguiente}</b></div>
 <div class="paso pop" data-en="1" data-mas="0.6" style="margin-top:36px;font-size:26px"><b>↓</b>{material}</div>
 <div class="ap" data-en="2" data-mas="3" style="margin-top:42px;font-size:26px;color:#8fa9c2;font-weight:700;letter-spacing:2px">INNOVA CONTRATISTAS · ACADEMIA TÉCNICA · WHATSAPP 966 000 500</div>
</div>'''

# 0. Gancho
E.append(dict(antes=0.8, frases=[
  'Hacer un arco bien es una cosa. Hacer siete arcos idénticos, a tiempo y sin desperdicio, es lo que separa a un taller profesional.',
  '¡Bienvenido a la clase seis! Hoy organizamos la fabricación en serie: del plano a los arcos pintados y listos para viajar a la obra.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 55, 50)], html=f'''
<svg style="position:absolute;left:820px;top:200px" width="1040" height="700" viewBox="0 0 1040 700">
 {''.join(f'<polyline class="ap" data-en="0" data-mas="{0.35*k:.2f}" points="{parabola(60+k*40, 760+k*40, 640-k*60, 420)}" fill="none" stroke="#f97316" stroke-width="{12-k}" opacity="{1-k*0.12:.2f}"/>' for k in range(6, -1, -1))}
</svg>
<div style="position:absolute;left:120px;top:300px;width:760px">
 <div class="paso pop" data-en="1"><b>6</b>CLASE 6 DE 9</div>
 <h1 class="t ap" data-en="1" data-mas="0.3" style="margin-top:30px">Fabricación <span class="nar">en serie</span></h1>
 <p class="ap" data-en="1" data-mas="0.8" style="margin-top:24px;font-size:38px;font-weight:600;color:#c9d6e3;line-height:1.3">Plantilla, control de calidad,<br>pintura y transporte</p>
</div>'''))

# 1. Respuesta reto
E.append(dict(frases=[
  'La respuesta del reto: siete arcos, cada uno con dos columnas. Catorce columnas.',
  'Catorce placas base.',
  'Y con cuatro pernos por placa: cincuenta y seis pernos de anclaje. ¿Te salió? ¡Perfecto!',
], html=titulo('Respuesta <span class="nar">del reto</span>') + filas_html([('7 arcos × 2 columnas', '14 columnas'), ('Una placa por columna', '14 placas'), ('14 placas × 4 pernos', '56 pernos')], 290)))

# 2. Plan de producción
E.append(dict(frases=[
  'Todo empieza con el plan. Antes de prender la sierra, ten a mano tres cosas de InnovApp.',
  'La lámina del Plano, con las medidas del arco, para el maestro.',
  'La hoja de Cortes, con el largo de cada pieza y cómo sale de cada barra de seis metros.',
  'Y la lista de Materiales, para pedir todo de una sola vez. Una barra que falta a mitad de la obra te para el taller.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 50)], html=titulo('El plan <span class="nar">de producción</span>', top=110) + '<div style="position:absolute;left:160px;right:160px;top:270px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px">' +
 ''.join(f'<div class="tarjeta ap" data-en="{i+1}" style="min-height:280px;text-align:center"><div style="font-size:70px">{e}</div><div style="font-size:34px;font-weight:900;margin-top:10px">{t}</div><div style="font-size:24px;color:#c9d6e3;margin-top:8px">{d}</div></div>'
         for i, (e, t, d) in enumerate([('📐', 'Plano', 'Lámina con las medidas del arco'), ('✂️', 'Cortes', 'Largo de cada pieza y cómo sale de cada barra'), ('📦', 'Materiales', 'Pide todo de una sola vez')])) + '</div>'))
E.append(pantalla('p18_plano', ['Así se ve la lámina en InnovApp: elevación frontal con el arco y sus medidas, elevación lateral y planta. Imprímela y pégala en el taller.'], CAJAS['p18_plano'], 'Plano · lámina para el taller', fundido=True))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.0, 50, 50), (0, 1.25, 40, 60)]
E.append(pantalla('p17_cortes', ['Y la hoja de Cortes: cada barra de seis metros, con los cortes que salen de ella y el sobrante. Así aprovechas al máximo el material.'], CAJAS['p17_cortes'], 'Cortes · barras de 6 m'))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.0, 50, 50), (0, 1.25, 40, 55)]
E[-1]['fundido'] = True

# 3. Corte en serie y codificación
E.append(dict(frases=[
  'Ahora, el corte en serie. No cortes arco por arco: corta todas las piezas iguales de una vez.',
  'Por ejemplo, todas las diagonales de los siete arcos, con un tope fijo en la sierra. Todas salen idénticas, y vas mucho más rápido.',
  'Y marca cada pieza con su código, con plumón de pintura: el número de arco y la posición. Una pieza sin marcar es una pieza perdida.',
  'Ordénalas por arco en burros o estantes. Cuando armes, todo está a la mano.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55), (3, 1.0, 50, 50)], html=titulo('Corte en serie <span class="nar">y codificación</span>', top=110) + '''
<svg style="position:absolute;left:300px;top:250px" width="1320" height="440" viewBox="0 0 1320 440">''' +
 ''.join(f'<g class="ap" data-en="1" data-mas="{0.15*i:.2f}"><rect x="80" y="{40+i*48}" width="520" height="30" rx="4" fill="#9fb3c6"/></g>' for i in range(7)) + '''
 <g class="ap" data-en="1" data-mas="1"><rect x="600" y="20" width="16" height="360" fill="#f97316"/><text x="628" y="200" fill="#f97316" font-size="30" font-weight="900">tope fijo</text></g>''' +
 ''.join(f'<g class="pop" data-en="2" data-mas="{0.2*i:.1f}"><rect x="900" y="{40+i*48}" width="170" height="30" rx="4" fill="#9fb3c6"/><text x="910" y="{63+i*48}" fill="#0b2a45" font-size="22" font-weight="900">A{i+1}-D07</text></g>' for i in range(7)) + '''
</svg>
<div class="paso pop" data-en="2" data-mas="1.5" style="position:absolute;left:50%;transform:translateX(-50%);top:720px;font-size:24px"><b>✎</b>ARCO · PIEZA · POSICIÓN</div>'''))

# 4. La mesa de armado
E.append(dict(frases=[
  'El corazón del taller es la mesa de armado: la plantilla que trazamos en la clase dos, con sus tacos soldados.',
  'Truco profesional: además de los tacos del cordón, suelda topes para los montantes y las diagonales. Así cada pieza cae sola en su lugar.',
  'Y pon prensas o sargentos para sujetar los cordones contra los tacos mientras punteas.',
  'Con una buena mesa, el primer arco tarda, pero del segundo en adelante vas el doble de rápido.',
], zoom=[(0, 1.0, 50, 50), (1, 1.08, 50, 45), (3, 1.0, 50, 50)], html=titulo('La mesa <span class="nar">de armado</span>', top=110) + f'''
<svg style="position:absolute;left:260px;top:240px" width="1400" height="500" viewBox="0 0 1400 500">
 <rect x="20" y="40" width="1360" height="440" rx="12" fill="rgba(255,255,255,.04)" stroke="#5f7a94" stroke-width="3"/>
 <polyline points="{parabola(80, 1320, 440, 340)}" fill="none" stroke="#f97316" stroke-width="10"/>
 <polyline points="{parabola(80, 1320, 380, 340)}" fill="none" stroke="#f97316" stroke-width="10"/>
 {''.join(f'<rect class="pop" data-en="0" data-mas="{0.08*i:.2f}" x="{80+62*i-7}" y="{440-340*4*(i/20)*(1-i/20)+6:.0f}" width="14" height="20" fill="#cfd8e0"/>' for i in range(1, 20))}
 {''.join(f'<rect class="pop" data-en="1" data-mas="{0.1*i:.1f}" x="{80+124*i-18}" y="{410-340*4*(i/10)*(1-i/10):.0f}" width="36" height="10" fill="#7ee08a"/>' for i in range(1, 10))}
 {''.join(f'<g class="pop" data-en="2" data-mas="{0.3*k:.1f}"><rect x="{x-14}" y="{440-340*4*((x-80)/1240)*(1-(x-80)/1240)-80:.0f}" width="28" height="110" rx="6" fill="#5cc8ff" opacity=".85"/></g>' for k, x in enumerate([300, 700, 1100]))}
</svg>'''))

# 5. Control de calidad por arco
E.append(dict(frases=[
  'Cada arco que sale de la mesa se controla. Cinco medidas, siempre.',
  'La luz, de apoyo a apoyo.',
  'La flecha, en el centro.',
  'El peralte, en tres puntos: los dos extremos y el centro.',
  'La simetría: cada punto contra su espejo.',
  'Y que el arco no esté alabeado, o sea, torcido. Apóyalo en el piso: todos los nudos deben tocar. Anota todo en una hoja: es tu garantía ante el cliente.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=titulo('Control <span class="nar">de cada arco</span>', top=100) +
 filas_html([('Luz (apoyo a apoyo)', '± 3 mm'), ('Flecha en el centro', '± 5 mm'), ('Peralte (3 puntos)', 'igual'), ('Simetría (punto vs. espejo)', 'igual'), ('Alabeo: todos los nudos tocan el piso', 'plano')], 210)))

# 6. Pintura
E.append(dict(frases=[
  'Antes de que salga del taller: la pintura. En el taller se pinta mejor y más barato que en la obra.',
  'Primero, la limpieza: escoria, salpicaduras, grasa y óxido. Con grata o escobilla, hasta ver el metal limpio.',
  'Luego la base anticorrosiva, normalmente dos manos, el mismo día de la limpieza, antes de que vuelva a oxidarse.',
  'Ojo: deja sin pintar unos cinco centímetros donde irán las soldaduras de obra. Se pintan después, en el retoque.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55), (3, 1.0, 50, 50)], html=titulo('Pintura <span class="nar">en el taller</span>', top=110) + '<div style="position:absolute;left:160px;right:160px;top:270px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px">' +
 ''.join(f'<div class="tarjeta ap" data-en="{i+1}" style="min-height:300px"><div class="paso" style="font-size:20px"><b>{i+1}</b>PASO</div><div style="font-size:33px;font-weight:900;margin-top:14px">{t}</div><div style="font-size:24px;color:#c9d6e3;margin-top:8px">{d}</div></div>'
         for i, (t, d) in enumerate([('Limpieza', 'Escoria, salpicadura, grasa y óxido: metal limpio.'), ('Base anticorrosiva', 'Dos manos, el mismo día de la limpieza.'), ('Reserva 5 cm', 'Sin pintar donde se suelda en obra; se retoca después.')])) + '</div>'))

# 7. Transporte
E.append(dict(frases=[
  'Y ahora, un problema real: ¿cómo llevo un arco de quince metros a la obra?',
  'Una plataforma de camión mide unos doce metros. Un arco de quince no entra completo.',
  'La solución: fabricar el arco en dos mitades, con una unión empernada en el centro: dos planchas con pernos, que se arma en la obra.',
  'En obra, armas el arco completo en el piso, aprietas los pernos, verificas medidas, y recién lo izas.',
  'Y en el camión: apila los arcos con tacos de madera entre ellos, bien amarrados, para que no se deformen en el viaje.',
], zoom=[(0, 1.0, 50, 50), (2, 1.08, 50, 45), (4, 1.0, 50, 50)], html=titulo('Transporte <span class="nar">a la obra</span>', top=110) + f'''
<svg style="position:absolute;left:260px;top:250px" width="1400" height="460" viewBox="0 0 1400 460">
 <g class="ap" data-en="1"><rect x="80" y="380" width="1000" height="26" fill="#9fb3c6"/><circle cx="200" cy="420" r="28" fill="#334155"/><circle cx="950" cy="420" r="28" fill="#334155"/>
  <rect x="1080" y="300" width="160" height="106" rx="10" fill="#5f7a94"/><text x="580" y="450" fill="#8fa9c2" font-size="26" text-anchor="middle">plataforma ≈ 12 m</text></g>
 <g class="ap" data-en="0" data-mas="1"><polyline points="{parabola(40, 1320, 370, 260)}" fill="none" stroke="#ff6b6b" stroke-width="9" stroke-dasharray="16 10"/></g>
 <g class="ap" data-en="2"><polyline points="{parabola(110, 1000, 370, 180)}" fill="none" stroke="#f97316" stroke-width="10" transform="translate(0 -10)"/>
  <rect x="540" y="164" width="30" height="46" fill="#ffd166"/><text x="590" y="150" fill="#ffd166" font-size="28" font-weight="900">unión empernada</text></g>
</svg>'''))

# 8. Errores
E.append(dict(frases=[
  'Cinco errores de taller que cuestan caro.',
  'Uno: cortar sin la hoja de cortes. Desperdicias barras y te faltan piezas.',
  'Dos: piezas sin código. En la obra nadie sabe qué va dónde.',
  'Tres: no controlar cada arco. El error lo descubres con la grúa en la obra.',
  'Cuatro: pintar sobre óxido o escoria. A los meses se pela.',
  'Y cinco: transportar los arcos sin tacos ni amarres. Llegan torcidos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">de taller</span>', [
  ('Cortar sin hoja de cortes', 'Desperdicio de barras y piezas que faltan.'), ('Piezas sin código', 'En obra nadie sabe qué va dónde.'),
  ('No controlar cada arco', 'El error aparece con la grúa en la obra.'), ('Pintar sobre óxido o escoria', 'A los meses la pintura se pela.'),
  ('Transportar sin tacos ni amarres', 'Los arcos llegan torcidos.')])))

# 9. Reto
E.append(dict(frases=[
  '¡Tu reto! Prepara la hoja de control de calidad de tu taller para los siete arcos de la nave de quince metros.',
  'Una fila por arco, con luz, flecha, peralte, simetría y alabeo. Y los valores esperados de la tabla de la clase dos.',
  'Úsala en tu próxima obra: tus clientes van a notar la diferencia.',
], html='''
<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><div class="paso pop" data-en="0" style="font-size:30px"><b>★</b>TU RETO</div></div>
<div class="tarjeta ap" data-en="0" data-mas="0.5" style="position:absolute;left:380px;right:380px;top:300px;font-size:36px;line-height:1.6">
 <div>📋 Hoja de control para <b class="nar">7 arcos</b></div>
 <div class="ap" data-en="1">📏 Luz · flecha · peralte · simetría · alabeo</div>
 <div class="ap" data-en="2">🏆 Úsala en tu próxima obra</div>
</div>'''))

# 10. Cierre
E.append(dict(antes=0.3, despues=2.4, frases=[
  'Resumiendo: plan con Plano, Cortes y Materiales; corte en serie con códigos; mesa de armado con topes; control de cada arco; pintura en taller; y transporte seguro.',
  'Así fabricas rápido, sin desperdicio, y con calidad que se nota.',
  'En la próxima clase vamos a la obra: izaje y montaje seguro de los arcos. ¡Nos vemos!',
], html=cierre(6, 'Clase 7 · Izaje y montaje seguro', 'MATERIAL: CHECKLIST DE CONTROL DE CALIDAD (PDF)')))

if __name__ == '__main__':
    salida = '/home/claude/video/salida/naves_c6.mp4'
    if len(sys.argv) > 1 and sys.argv[1] == 'prueba':
        render(E, CURSO, salida, cuadros={i: [9.0] for i in range(len(E))})
    else:
        render(E, CURSO, salida)
