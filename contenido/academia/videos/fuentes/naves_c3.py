"""Curso Naves Parabólicas · Clase 3: Arcos reticulados — cordones, montantes, diagonales y fabricación."""
import sys
from motor import render, EMBLEMA
from comun import CAJAS, parabola, arco_reticulado, titulo, pantalla

CURSO = 'NAVES PARABÓLICAS · CLASE 3'
E = []

def tijeral(tipo, x0=40, x1=600, base=230, alto=150, h=34, color='#f97316'):
    """Dibujo esquemático de un tijeral parabólico (tramos rectos entre nudos, como en InnovApp)."""
    n = 10
    inf = [(x0 + (x1 - x0) * i / n, base - 4 * alto * (i / n) * (1 - i / n)) for i in range(n + 1)]
    sup = [(x, yy - h) for x, yy in inf]
    if tipo == 'bowstring': inf = [(x, base) for x, _ in inf]
    pl = lambda pts: ' '.join(f'{x:.0f},{yy:.0f}' for x, yy in pts)
    g = f'<polyline points="{pl(sup)}" fill="none" stroke="{color}" stroke-width="7"/>'
    if tipo != 'simple':
        g += f'<polyline points="{pl(inf)}" fill="none" stroke="{color}" stroke-width="7"/>'
        for i in range(n + 1):
            if tipo in ('pratt', 'bowstring') or i in (0, n):
                g += f'<line x1="{inf[i][0]:.0f}" y1="{inf[i][1]:.0f}" x2="{sup[i][0]:.0f}" y2="{sup[i][1]:.0f}" stroke="#ffb27a" stroke-width="3.5"/>'
        for i in range(n):
            if tipo == 'warren':
                a, b = (inf[i], sup[i + 1]) if i % 2 == 0 else (sup[i], inf[i + 1])
            else:  # pratt / bowstring: diagonales hacia el centro
                a, b = (sup[i], inf[i + 1]) if i < n / 2 else (inf[i], sup[i + 1])
            g += f'<line x1="{a[0]:.0f}" y1="{a[1]:.0f}" x2="{b[0]:.0f}" y2="{b[1]:.0f}" stroke="#ffb27a" stroke-width="3.5"/>'
    return g

# 0. Gancho
E.append(dict(antes=0.8, frases=[
  'El arco es el corazón de la nave. Si el arco está bien hecho, la nave dura décadas. Si no, se deforma con el primer viento fuerte.',
  '¡Bienvenido a la clase tres! Hoy aprendes a armar el arco reticulado: sus piezas, sus tipos, sus perfiles, y cómo fabricarlo en el taller.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 45)], html=f'''
<svg style="position:absolute;left:760px;top:220px" width="1100" height="700" viewBox="0 0 640 380">
 <g class="ap" data-en="0" data-mas="0.3">{tijeral('warren', 30, 610, 330, 250, 40)}</g>
</svg>
<div style="position:absolute;left:120px;top:300px;width:760px">
 <div class="paso pop" data-en="1"><b>3</b>CLASE 3 DE 9</div>
 <h1 class="t ap" data-en="1" data-mas="0.3" style="margin-top:30px">Arcos <span class="nar">reticulados</span></h1>
 <p class="ap" data-en="1" data-mas="0.8" style="margin-top:24px;font-size:38px;font-weight:600;color:#c9d6e3;line-height:1.3">Cordones, celosía, perfiles<br>y fabricación en taller</p>
</div>'''))

# 1. Respuestas del reto
E.append(dict(frases=[
  'Primero, las respuestas del reto de la clase anterior. Nave de doce metros.',
  'La flecha óptima: cero catorce por doce, un metro sesenta y ocho.',
  'A dos metros cuarenta, que es la segunda división: cero sesenta y cuatro por uno sesenta y ocho, un metro siete centímetros.',
  'Y en el centro, la flecha completa: un metro sesenta y ocho. ¿Te salió? ¡Excelente!',
], html=titulo('Respuestas <span class="nar">del reto</span>') + '''
<div style="position:absolute;left:380px;right:380px;top:300px;font-size:40px;line-height:1.9">
 <div class="ap" data-en="1">1️⃣ f = 0.14 × 12 = <b style="color:#ffd166">1.68 m</b></div>
 <div class="ap" data-en="2">2️⃣ x = 2.40 m = 0.2 L → 0.64 × 1.68 = <b style="color:#ffd166">1.075 m</b></div>
 <div class="ap" data-en="3">3️⃣ Centro: y = f = <b style="color:#ffd166">1.68 m</b></div>
</div>'''))

# 2. Piezas del arco
E.append(dict(frases=[
  'Un arco reticulado tiene cuatro tipos de piezas.',
  'El cordón superior y el cordón inferior. Son los que más trabajan: uno se comprime y el otro se estira cuando el arco se flexiona.',
  'Los montantes, que son las piezas verticales entre los cordones.',
  'Y las diagonales, las inclinadas. Montantes y diagonales forman la celosía, y llevan la fuerza de un cordón al otro.',
  'Donde se juntan las piezas se forma un nudo. En un buen nudo, los ejes de todas las piezas se cruzan en un solo punto.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 50), (4, 1.2, 38, 50)], html=f'''
<svg style="position:absolute;left:260px;top:250px" width="1400" height="600" viewBox="0 0 640 275">
 {tijeral('pratt', 20, 620, 250, 190, 42, '#5f7a94')}
 <g class="ap" data-en="1"><polyline points="{' '.join(f'{20+60*i:.0f},{250-4*190*(i/10)*(1-i/10)-42:.0f}' for i in range(11))}" fill="none" stroke="#f97316" stroke-width="8"/></g>
 <g class="ap" data-en="1" data-mas="1.2"><polyline points="{' '.join(f'{20+60*i:.0f},{250-4*190*(i/10)*(1-i/10):.0f}' for i in range(11))}" fill="none" stroke="#ffd166" stroke-width="8"/></g>
 <g class="ap" data-en="2">{''.join(f'<line x1="{20+60*i}" y1="{250-4*190*(i/10)*(1-i/10):.0f}" x2="{20+60*i}" y2="{250-4*190*(i/10)*(1-i/10)-42:.0f}" stroke="#7ee08a" stroke-width="5"/>' for i in range(1, 10))}</g>
 <g class="pop" data-en="4" data-mas="0.8"><circle cx="200" cy="{250-4*190*0.3*0.7:.0f}" r="16" fill="none" stroke="#fff" stroke-width="3"/></g>
</svg>
<div style="position:absolute;left:0;right:0;top:150px;display:flex;justify-content:center;gap:18px;font-size:22px">
 <div class="paso pop" data-en="1" style="background:#f97316"><b>1</b>CORDÓN SUPERIOR</div>
 <div class="paso pop" data-en="1" data-mas="1.2" style="background:#c99a1a"><b>2</b>CORDÓN INFERIOR</div>
 <div class="paso pop" data-en="2" style="background:#3f9e5a"><b>3</b>MONTANTES</div>
 <div class="paso pop" data-en="3" style="background:#a0613a"><b>4</b>DIAGONALES</div>
</div>'''))

# 3. Tipos de tijeral
tipos = [('warren', 'Arco clásico (Warren)', 'Triángulos parejos, sin montantes intermedios. El más usado: liviano y rápido de armar.'),
         ('pratt', 'Arco para techos grandes (Pratt)', 'Montantes en cada nudo y diagonales hacia el centro. Más firme en luces anchas o con más peso.'),
         ('bowstring', 'Arco con tirante (Bowstring)', 'Cordón inferior recto que une las columnas: evita que se abran. Bueno con columnas delgadas.'),
         ('simple', 'Arco simple (un tubo)', 'Solo para techos chicos y livianos, como cocheras o terrazas de hasta unos 8 m.')]
E.append(dict(frases=[
  'En InnovApp tienes cuatro tipos de arco, y cada uno tiene su uso.',
  'El arco clásico, tipo Warren: triángulos parejos. Es el más usado, liviano y rápido de armar.',
  'El arco para techos grandes, tipo Pratt: montantes en cada nudo y diagonales hacia el centro. Más firme para luces anchas.',
  'El arco con tirante, o bowstring: el cordón inferior va recto y amarra las columnas, para que no se abran.',
  'Y el arco simple, de un solo tubo: solo para cocheras y techos chicos.',
], zoom=[(0, 1.0, 50, 50), (1, 1.08, 27, 40), (2, 1.08, 73, 40), (3, 1.08, 27, 72), (4, 1.08, 73, 72)],
 html=titulo('4 tipos <span class="nar">de arco</span>', top=100) + '<div style="position:absolute;left:120px;right:120px;top:220px;display:grid;grid-template-columns:1fr 1fr;gap:26px">' +
 ''.join(f'<div class="tarjeta ap" data-en="{i+1}" style="padding:18px 24px"><svg width="100%" height="190" viewBox="0 0 640 250">{tijeral(t, 30, 610, 235, 160, 36)}</svg>'
         f'<div style="font-size:31px;font-weight:900">{n}</div><div style="font-size:23px;color:#c9d6e3;margin-top:4px">{d}</div></div>' for i, (t, n, d) in enumerate(tipos)) + '</div>'))
E.append(pantalla('p07_tijeral', ['En el Asistente lo eliges aquí, en Tipo de tijeral. InnovApp te marca el recomendado según tu luz.'], CAJAS['p07_tijeral'], 'Tipo de tijeral', fundido=True))

# 4. Peralte
E.append(dict(frases=[
  'Ahora, el peralte: la separación entre los dos cordones.',
  'Con más peralte, los cordones trabajan menos, y puedes usar tubos más livianos.',
  'Pero si te pasas, las diagonales salen largas, y una pieza larga en compresión se pandea más fácil.',
  'La regla práctica es la luz entre dieciocho, entre cuarenta y cinco centímetros y un metro veinte. Es la misma que usa InnovApp.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 70, 50), (3, 1.0, 50, 50)], html=titulo('El <span class="nar">peralte</span> del arco', top=110) + f'''
<div style="position:absolute;left:150px;right:150px;top:250px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:26px;text-align:center">
 <div class="tarjeta ap" data-en="1"><svg width="100%" height="170" viewBox="0 0 640 230">{tijeral('warren', 30, 610, 220, 140, 16, '#ff8a8a')}</svg><b style="font-size:30px;color:#ff8a8a">Muy poco</b><div style="font-size:22px;color:#c9d6e3">Cordones sobrecargados</div></div>
 <div class="tarjeta ap" data-en="3"><svg width="100%" height="170" viewBox="0 0 640 230">{tijeral('warren', 30, 610, 220, 140, 40, '#7ee08a')}</svg><b style="font-size:30px;color:#7ee08a">L / 18 ✔</b><div style="font-size:22px;color:#c9d6e3">0.45 m a 1.20 m</div></div>
 <div class="tarjeta ap" data-en="2"><svg width="100%" height="170" viewBox="0 0 640 230">{tijeral('warren', 30, 610, 220, 140, 80, '#ff8a8a')}</svg><b style="font-size:30px;color:#ff8a8a">Demasiado</b><div style="font-size:22px;color:#c9d6e3">Diagonales largas: pandeo</div></div>
</div>
<div class="tarjeta pop" data-en="3" data-mas="2" style="position:absolute;left:520px;right:520px;top:690px;text-align:center;font-size:34px;font-weight:900">12 m → 0.67 · 15 m → 0.83 · 20 m → 1.11</div>'''))

# 5. Perfiles (lo que propone InnovApp)
perf = [('Cordones (sup. e inf.)', 'Tubo rect. 3"×2"×2.5 mm', 'Tubo rect. 3"×2"×2.5 mm', 'Tubo 3"×3" / 4"×2" ×2.5 mm'),
        ('Montantes', 'Tubo 1½"×1½"×1.5 mm', 'Tubo 1½"×1½"×1.5 mm', 'Tubo 2"×2"×2.0 mm'),
        ('Diagonales', 'Tubo 2"×2"×1.5 mm', 'Tubo 2"×2"×1.5 mm', 'Tubo rect. 3"×2"×2.0 mm'),
        ('Columnas', 'Tubo 6"×6"×4.5 mm', 'Tubo 6"×6"×6.0 mm', 'Tubo 8"×8"×6.0 mm')]
E.append(dict(frases=[
  '¿Y qué tubos uso? Esta tabla es lo que propone InnovApp para naves de doce, quince y veinte metros, verificado con su memoria de cálculo.',
  'Fíjate: los cordones son los tubos más fuertes del arco, porque son los que más trabajan.',
  'La celosía va con tubos más delgados. Y al crecer la luz, todo sube de tamaño, sobre todo las columnas.',
  'Ojo: esto es una guía. Los perfiles dependen de la altura, del viento de la zona y de la cobertura. Por eso siempre verifica tu diseño en la app o con un ingeniero.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 40), (2, 1.05, 50, 60), (3, 1.0, 50, 50)], html=titulo('Perfiles <span class="nar">de referencia</span>', top=100) +
 '<div class="ap" data-en="0" data-mas="0.6" style="position:absolute;left:150px;right:150px;top:210px"><table style="width:100%;border-collapse:collapse;font-size:28px">'
 '<tr style="background:#f97316"><th style="padding:12px;text-align:left">Pieza</th><th>Nave 12 m</th><th>Nave 15 m</th><th>Nave 20 m</th></tr>' +
 ''.join(f'<tr class="ap" data-en="{1 if i == 0 else (2 if i < 3 else 2)}" data-mas="{0.5*i:.1f}" style="background:{"rgba(255,255,255,.06)" if i % 2 else "transparent"}"><td style="padding:14px;font-weight:900">{p}</td><td style="text-align:center">{a}</td><td style="text-align:center">{b}</td><td style="text-align:center">{c}</td></tr>' for i, (p, a, b, c) in enumerate(perf)) +
 '</table><div style="font-size:22px;color:#8fa9c2;margin-top:12px">Naves con columnas de 4.5 / 5 / 6 m, arcos cada 5 m y aluzinc TR4 · catálogo y memoria de cálculo de InnovApp</div></div>'
 '<div class="paso pop" data-en="3" style="position:absolute;left:50%;transform:translateX(-50%);top:760px;font-size:24px;background:#ff6b6b"><b>!</b>GUÍA: VERIFICA SIEMPRE TU DISEÑO</div>'))

# 6. Exigencia en InnovApp
E.append(pantalla('p20_3d_estructura', ['En la vista 3D de InnovApp, baja la opacidad de la cobertura para ver la estructura.'], None, 'Vista 3D · estructura', fundido=True))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.3, 50, 55)]
E.append(pantalla('p21_exigencia', ['Y toca Exigencia. Cada pieza se pinta según cuánto trabaja: azul, poco; verde, normal; amarillo y naranja, cerca de su límite.', 'Mira: los arcos trabajan mucho más que las columnas. Por eso el arco merece tu mejor soldadura.'], CAJAS['p21_exigencia'], 'Exigencia'))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.0, 50, 50), (1, 1.35, 55, 55)]

# 7. Cordón: rolado o por tramos
E.append(dict(frases=[
  '¿Cómo fabrico el cordón curvo? Tienes dos caminos.',
  'Rolado: pasas el tubo por una roladora hasta que copie la curva de la plantilla. Queda continuo y muy elegante.',
  'O por tramos: cortas tramos rectos de nudo a nudo y los sueldas siguiendo la plantilla. No necesitas roladora.',
  'InnovApp dibuja el cordón por tramos, de nudo a nudo, y en Cortes te da cada largo. Así lo puedes fabricar en cualquier taller.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 28, 50), (2, 1.06, 72, 50), (3, 1.0, 50, 50)], html=titulo('El cordón: <span class="nar">rolado o por tramos</span>', top=110) + f'''
<div style="position:absolute;left:140px;top:260px;width:780px" class="tarjeta ap" data-en="1">
 <svg width="720" height="230" viewBox="0 0 720 230"><polyline points="{parabola(30, 690, 210, 170)}" fill="none" stroke="#f97316" stroke-width="12"/></svg>
 <div style="font-size:34px;font-weight:900">Rolado</div><div style="font-size:25px;color:#c9d6e3">Continuo y elegante · necesitas roladora</div></div>
<div style="position:absolute;left:1000px;top:260px;width:780px" class="tarjeta ap" data-en="2">
 <svg width="720" height="230" viewBox="0 0 720 230"><polyline points="{' '.join(f'{30+66*i:.0f},{210-4*170*(i/10)*(1-i/10):.0f}' for i in range(11))}" fill="none" stroke="#f97316" stroke-width="12"/>
 {''.join(f'<circle cx="{30+66*i}" cy="{210-4*170*(i/10)*(1-i/10):.0f}" r="8" fill="#ffd166"/>' for i in range(11))}</svg>
 <div style="font-size:34px;font-weight:900">Por tramos</div><div style="font-size:25px;color:#c9d6e3">De nudo a nudo · sin roladora · como InnovApp</div></div>'''))

# 8. Nudos y secuencia de soldadura
pasos_f = [('Corta todo con la lista', 'Marca cada pieza con su código de Cortes.'), ('Arma en la plantilla', 'Cordones contra los tacos, celosía en su lugar.'),
           ('Puntea, no sueldes', 'Puntos de soldadura en todos los nudos, primero.'), ('Verifica medidas', 'Luz, flecha, peralte y diagonales del arco.'),
           ('Suelda alternando', 'Del centro a los extremos y de un lado al otro.'), ('Voltea y repite', 'Suelda la otra cara; deja enfriar en la plantilla.')]
E.append(dict(frases=[
  'Ahora, la fabricación. En los nudos, que los ejes de las piezas se crucen en un punto. Si no, aparecen esfuerzos extra que nadie calculó.',
  'Y esta es la secuencia de un taller profesional. Corta todo con la lista, y marca cada pieza.',
  'Arma en la plantilla, y puntea. No sueldes todavía.',
  'Verifica las medidas: luz, flecha y peralte. Corregir un punto es fácil; corregir un cordón soldado, no.',
  'Recién ahí suelda, alternando: del centro a los extremos, y de un lado al otro, para que el calor no tuerza el arco.',
  'Voltea, suelda la otra cara, y deja enfriar en la plantilla antes de sacarlo.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 45), (4, 1.05, 50, 65), (5, 1.0, 50, 50)], html=titulo('Fabricación <span class="nar">paso a paso</span>', top=100) +
 '<div style="position:absolute;left:150px;right:150px;top:230px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px">' +
 ''.join(f'<div class="tarjeta ap" data-en="{[1,2,2,3,4,5][i]}" data-mas="{[0,0,1.5,0,0,0][i]}" style="min-height:190px"><div class="paso" style="font-size:20px"><b>{i+1}</b>PASO</div>'
         f'<div style="font-size:31px;font-weight:900;margin-top:12px">{t}</div><div style="font-size:23px;color:#c9d6e3;margin-top:6px">{d}</div></div>' for i, (t, d) in enumerate(pasos_f)) + '</div>'
 '<div class="ap" data-en="0" style="position:absolute;left:0;right:0;top:720px;text-align:center;font-size:32px;font-weight:900;color:#ffd166">En cada nudo: los ejes se cruzan en un solo punto</div>'))

# 9. Empalmes
E.append(dict(frases=[
  'Último tema técnico: los empalmes. Los tubos vienen de seis metros, y un cordón de quince metros no entra en una barra.',
  'Pon el empalme cerca de un nudo, nunca a media pieza.',
  'No pongas los empalmes del cordón superior y del inferior en el mismo lugar: altérnalos.',
  'Y suelda el empalme a penetración completa, o refuérzalo con una platina. InnovApp ya parte las piezas largas y te marca los empalmes en Cortes.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 50, 50), (3, 1.0, 50, 50)], html=titulo('Empalmes <span class="nar">bien hechos</span>', top=110) + f'''
<svg style="position:absolute;left:260px;top:260px" width="1400" height="420" viewBox="0 0 640 190">
 {tijeral('warren', 20, 620, 175, 120, 36, '#5f7a94')}
 <g class="pop" data-en="1"><circle cx="{20+60*3}" cy="{175-4*120*0.3*0.7-36:.0f}" r="11" fill="none" stroke="#7ee08a" stroke-width="4"/></g>
 <g class="pop" data-en="2"><circle cx="{20+60*7}" cy="{175-4*120*0.7*0.3:.0f}" r="11" fill="none" stroke="#7ee08a" stroke-width="4"/></g>
 <g class="pop" data-en="1" data-mas="1.5"><line x1="{20+60*4.5-9}" y1="{175-4*120*0.45*0.55-45:.0f}" x2="{20+60*4.5+9}" y2="{175-4*120*0.45*0.55-27:.0f}" stroke="#ff6b6b" stroke-width="4"/><line x1="{20+60*4.5+9}" y1="{175-4*120*0.45*0.55-45:.0f}" x2="{20+60*4.5-9}" y2="{175-4*120*0.45*0.55-27:.0f}" stroke="#ff6b6b" stroke-width="4"/></g>
</svg>
<div style="position:absolute;left:0;right:0;top:720px;display:flex;justify-content:center;gap:20px">
 <div class="paso pop" data-en="1" style="background:#3f9e5a"><b>✓</b>CERCA DE UN NUDO</div><div class="paso pop" data-en="2" style="background:#3f9e5a"><b>✓</b>ALTERNADOS</div><div class="paso pop" data-en="3" style="background:#3f9e5a"><b>✓</b>PENETRACIÓN COMPLETA</div>
</div>'''))

# 10. Errores
errores = [('Nudos excéntricos', 'Ejes que no se cruzan: esfuerzos que nadie calculó.'), ('Soldar sin puntear y verificar', 'Un error queda soldado para siempre.'),
           ('Soldar todo de un lado', 'El calor tuerce el arco: alterna lados.'), ('Empalmes en el mismo punto', 'Crean una zona débil en el arco.'),
           ('Cambiar perfiles “a ojo”', 'Un tubo más delgado en el cordón puede no cumplir: verifica.')]
E.append(dict(frases=[
  'Los cinco errores que más arcos arruinan.',
  'Uno: nudos excéntricos, donde los ejes no se cruzan.',
  'Dos: soldar sin puntear ni verificar medidas.',
  'Tres: soldar todo de un solo lado. El calor tuerce el arco.',
  'Cuatro: todos los empalmes en el mismo punto.',
  'Y cinco: cambiar perfiles a ojo, por uno más delgado, para ahorrar. Si cambias un tubo, vuelve a verificar.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=titulo('5 errores <span class="nar">en el arco</span>', top=110) +
 '<div style="position:absolute;left:220px;right:220px;top:230px">' +
 ''.join(f'<div class="ap" data-en="{i+1}" style="display:flex;gap:22px;align-items:center;background:rgba(255,93,93,.08);border:2px solid rgba(255,107,107,.55);border-radius:18px;padding:14px 24px;margin:12px 0">'
         f'<span style="background:#ff6b6b;color:#fff;font-weight:900;font-size:30px;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;flex:none">✕</span>'
         f'<div><div style="font-size:33px;font-weight:900">{t}</div><div style="font-size:25px;color:#c9d6e3">{d}</div></div></div>' for i, (t, d) in enumerate(errores)) + '</div>'))

# 11. Reto
E.append(dict(frases=[
  '¡Tu reto de hoy! En InnovApp, arma la nave de quince por treinta, primero con el arco clásico.',
  'Mira en Exigencia qué piezas trabajan más.',
  'Luego vuelve a armarla con el arco con tirante, y compara: ¿qué cambió en las columnas? Lo comentamos en la próxima clase.',
], html='''
<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><div class="paso pop" data-en="0" style="font-size:30px"><b>★</b>TU RETO</div></div>
<div class="tarjeta ap" data-en="0" data-mas="0.5" style="position:absolute;left:380px;right:380px;top:300px;font-size:36px;line-height:1.6">
 <div>🏗️ Nave <b class="nar">15 × 30 m</b> con <b class="nar">arco clásico</b></div>
 <div class="ap" data-en="1">🎨 Mira la <b class="nar">Exigencia</b> en 3D</div>
 <div class="ap" data-en="2">🔁 Ármala con <b class="nar">arco con tirante</b> y compara las columnas</div>
</div>'''))

# 12. Cierre
E.append(dict(antes=0.3, despues=2.4, frases=[
  'Resumiendo: el arco tiene cordones, montantes y diagonales. Elige el tipo según tu luz, con un peralte cercano a la luz entre dieciocho.',
  'Fabrica en plantilla: corta, puntea, verifica y suelda alternando.',
  'En la próxima clase vemos las correas, los arriostres y los tensores, que mantienen la nave firme. ¡Nos vemos!',
], html=f'''
<div style="position:absolute;left:0;right:0;top:220px;text-align:center">
 <img class="pop" data-en="0" src="data:image/png;base64,{EMBLEMA}" style="width:170px;height:164px;background:#fff;border-radius:34px;padding:14px">
 <h2 class="t ap" data-en="0" data-mas="0.4" style="margin-top:30px">¡Clase 3 <span class="nar">completada</span>!</h2>
 <div class="ap" data-en="2" style="margin-top:26px;font-size:34px;color:#c9d6e3;font-weight:600">Siguiente: <b style="color:#fff">Clase 4 · Correas, arriostres y tensores</b></div>
 <div class="paso pop" data-en="1" data-mas="0.6" style="margin-top:36px;font-size:26px"><b>↓</b>MATERIAL: PLANTILLAS DE NAVES EN RECURSOS TÉCNICOS</div>
 <div class="ap" data-en="2" data-mas="3" style="margin-top:42px;font-size:26px;color:#8fa9c2;font-weight:700;letter-spacing:2px">INNOVA CONTRATISTAS · ACADEMIA TÉCNICA · WHATSAPP 966 000 500</div>
</div>'''))

if __name__ == '__main__':
    salida = '/home/claude/video/salida/naves_c3.mp4'
    if len(sys.argv) > 1 and sys.argv[1] == 'prueba':
        render(E, CURSO, salida, cuadros={i: [9.0] for i in range(len(E))})
    else:
        render(E, CURSO, salida)
