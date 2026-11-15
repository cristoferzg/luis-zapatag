"""Curso Naves Parabólicas · Clase 2: Geometría del arco — luz, flecha y fórmula (trazo en taller)."""
import math, sys
from motor import render, EMBLEMA
from comun import CAJAS, parabola, arco_reticulado, titulo, pantalla, tarjeta

CURSO = 'NAVES PARABÓLICAS · CLASE 2'
L, F = 15, 2.1
y = lambda x, L=L, f=F: 4 * f * x * (L - x) / L ** 2
def S(L, f): r = f / L; return L * (1 + 8 / 3 * r * r - 32 / 5 * r ** 4)
def circ(x, L, f):
    R = (L * L / 4 + f * f) / (2 * f); d = x - L / 2
    return math.sqrt(R * R - d * d) - (R - f)
fmt = lambda v: f'{v:.2f}'.replace('.', ',') if False else f'{v:.2f}'

E = []

# 0. Gancho
E.append(dict(antes=0.8, frases=[
  'Si trazas el arco con una cuerda o a ojo, los arcos te salen distintos, y en el montaje nada calza.',
  '¡Hola! Bienvenido a la clase dos. Hoy vas a trazar un arco parabólico exacto, punto por punto, como se hace en un taller profesional.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 45)], html=f'''
<svg style="position:absolute;left:760px;top:170px" width="1100" height="760" viewBox="0 0 1100 760">
 <polyline class="dib" data-en="0" points="{parabola(60, 1040, 700, 520)}" fill="none" stroke="#f97316" stroke-width="12" style="--l:1500"/>
 {''.join(f'<g class="pop" data-en="0" data-mas="{1.5+i*0.15:.2f}"><line x1="{60+98*i}" y1="700" x2="{60+98*i}" y2="{700-4*520*(i/10)*(1-i/10):.0f}" stroke="#ffd166" stroke-width="3" stroke-dasharray="8 6"/><circle cx="{60+98*i}" cy="{700-4*520*(i/10)*(1-i/10):.0f}" r="10" fill="#ffd166"/></g>' for i in range(11))}
 <line class="ap" data-en="0" data-mas="1" x1="40" y1="700" x2="1060" y2="700" stroke="#5cc8ff" stroke-width="5"/>
</svg>
<div style="position:absolute;left:120px;top:300px;width:760px">
 <div class="paso pop" data-en="1"><b>2</b>CLASE 2 DE 9</div>
 <h1 class="t ap" data-en="1" data-mas="0.3" style="margin-top:30px">Geometría <span class="nar">del arco</span></h1>
 <p class="ap" data-en="1" data-mas="0.8" style="margin-top:24px;font-size:38px;font-weight:600;color:#c9d6e3;line-height:1.3">Luz, flecha, fórmula<br>y trazo en el taller</p>
</div>'''))

# 1. Agenda
temas = ['Repaso: luz y flecha', 'La fórmula de la parábola', 'Tabla rápida: sin calculadora', 'Parábola vs. arco con cuerda', 'Largo del arco y los dos cordones', 'Cómo trazarlo en el piso del taller']
E.append(dict(frases=[
  'Esto es lo que vas a dominar hoy.',
  'Primero repasamos la luz y la flecha, y vemos la fórmula de la parábola, con un truco para usarla sin calculadora.',
  'Luego vemos por qué no sirve trazarlo con una cuerda, cuánto mide el arco, y cómo van los dos cordones.',
  'Y al final, el procedimiento completo para trazarlo en el piso del taller.',
], html=titulo('Lo que vas a <span class="nar">dominar hoy</span>') + '<div style="position:absolute;left:330px;right:330px;top:280px">' +
 ''.join(f'<div class="ap" data-en="{1 if i < 3 else (2 if i < 5 else 3)}" data-mas="{[0,1.5,3,0,2,0][i]}" style="display:flex;align-items:center;gap:22px;margin:16px 0;font-size:38px;font-weight:700"><span class="paso" style="font-size:22px"><b>{i+1}</b>TEMA</span>{t}</div>' for i, t in enumerate(temas)) + '</div>'))

# 2. Repaso
E.append(dict(frases=[
  'Repasemos. La luz, ele, es la distancia entre los apoyos.',
  'La flecha, efe, es lo que sube el arco desde la cabeza de la columna hasta el punto más alto.',
  'Y la flecha óptima es catorce por ciento de la luz. Para nuestra nave de quince metros: dos metros diez.',
  'Hoy usamos una medida más: equis. Es la distancia horizontal desde el apoyo izquierdo hasta el punto que quieres marcar.',
], zoom=[(0, 1.0, 50, 50), (3, 1.08, 40, 55)], html=titulo('Repaso: <span class="nar">L, f</span> y la nueva: <span class="nar">x</span>', top=120) + f'''
<svg style="position:absolute;left:260px;top:260px" width="1400" height="560" viewBox="0 0 1400 560">
 <rect x="80" y="330" width="24" height="200" fill="#9fb3c6"/><rect x="1296" y="330" width="24" height="200" fill="#9fb3c6"/>
 <polyline points="{parabola(92, 1308, 330, 270)}" fill="none" stroke="#f97316" stroke-width="12"/>
 <g class="ap" data-en="0"><line x1="92" y1="540" x2="1308" y2="540" stroke="#5cc8ff" stroke-width="4"/><text x="700" y="530" fill="#5cc8ff" font-size="40" font-weight="900" text-anchor="middle">L = 15 m</text></g>
 <g class="ap" data-en="1"><line x1="700" y1="330" x2="700" y2="60" stroke="#ffd166" stroke-width="4" stroke-dasharray="10 7"/><line x1="40" y1="330" x2="1360" y2="330" stroke="#8fa9c2" stroke-width="2" stroke-dasharray="6 6"/>
  <text x="716" y="200" fill="#ffd166" font-size="40" font-weight="900">f = 2.10 m</text><text x="1120" y="318" fill="#8fa9c2" font-size="24">cabeza de columna</text></g>
 <g class="ap" data-en="3"><line x1="92" y1="370" x2="335" y2="370" stroke="#7ee08a" stroke-width="5"/><line x1="335" y1="330" x2="335" y2="{330-270*4*0.2*0.8:.0f}" stroke="#7ee08a" stroke-width="5"/>
  <text x="190" y="410" fill="#7ee08a" font-size="38" font-weight="900">x</text><text x="350" y="260" fill="#7ee08a" font-size="38" font-weight="900">y</text></g>
</svg>
<div class="tarjeta pop" data-en="2" style="position:absolute;left:640px;right:640px;top:820px;text-align:center;font-size:34px;font-weight:900;padding:12px">f = 0.14 × 15 = <span class="nar">2.10 m</span></div>'''))

# 3. Fórmula
E.append(dict(frases=[
  'Esta es la fórmula de la parábola. No te asustes, es más fácil de lo que parece.',
  'Y, la altura del arco en cualquier punto, es igual a cuatro, por la flecha, por equis, por ele menos equis, entre ele al cuadrado.',
  'Compruébalo en los extremos: si equis es cero, la altura es cero. El arco nace en la columna.',
  'Y en el centro, cuando equis es la mitad de la luz, la altura es exactamente la flecha.',
], zoom=[(0, 1.0, 50, 50), (1, 1.1, 50, 40), (3, 1.0, 50, 50)], html=titulo('La <span class="nar">fórmula</span>', top=130) + '''
<div class="tarjeta pop" data-en="0" data-mas="0.5" style="position:absolute;left:360px;right:360px;top:280px;text-align:center;font-size:72px;font-weight:900;letter-spacing:1px;padding:34px">
 y = <span class="nar">4</span> · <span style="color:#ffd166">f</span> · <span style="color:#7ee08a">x</span> · (L − <span style="color:#7ee08a">x</span>) / L²</div>
<div style="position:absolute;left:360px;right:360px;top:520px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px;font-size:28px;text-align:center">
 <div class="tarjeta ap" data-en="1" data-mas="0.5"><b style="font-size:40px">y</b><br>altura del arco</div>
 <div class="tarjeta ap" data-en="1" data-mas="2"><b style="font-size:40px;color:#ffd166">f</b><br>flecha</div>
 <div class="tarjeta ap" data-en="1" data-mas="3"><b style="font-size:40px;color:#7ee08a">x</b><br>distancia al apoyo</div>
 <div class="tarjeta ap" data-en="1" data-mas="5"><b style="font-size:40px">L</b><br>luz</div>
</div>
<div style="position:absolute;left:0;right:0;top:760px;display:flex;justify-content:center;gap:30px">
 <div class="paso pop" data-en="2" style="font-size:26px"><b>✓</b>x = 0 → y = 0</div>
 <div class="paso pop" data-en="3" style="font-size:26px"><b>✓</b>x = L/2 → y = f</div>
</div>'''))

# 4. Ejemplo con la fórmula
E.append(dict(frases=[
  'Hagamos un punto juntos. Nave de quince metros, flecha dos metros diez. ¿Cuánto sube el arco a tres metros del apoyo?',
  'Cuatro por dos diez, es ocho cuarenta.',
  'Por tres, veinticinco veinte.',
  'Por quince menos tres, que es doce: trescientos dos con cuarenta.',
  'Y entre quince al cuadrado, doscientos veinticinco: un metro con treinta y cuatro centímetros.',
  'Listo. A tres metros del apoyo, el arco está un metro treinta y cuatro sobre la cabeza de la columna.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 50, 52), (5, 1.0, 50, 50)], html=titulo('Un punto, <span class="nar">paso a paso</span>', top=110) + f'''
<div class="tarjeta ap" data-en="0" data-mas="0.5" style="position:absolute;left:300px;right:300px;top:230px;text-align:center;font-size:34px">L = 15 m · f = 2.10 m · <b style="color:#7ee08a">x = 3 m</b></div>
<div style="position:absolute;left:420px;right:420px;top:350px;font-family:DejaVu Sans Mono,monospace;font-size:44px;line-height:1.75">
 <div class="ap" data-en="1">4 × 2.10 <span style="color:#8fa9c2">=</span> <b class="nar">8.40</b></div>
 <div class="ap" data-en="2">8.40 × 3 <span style="color:#8fa9c2">=</span> <b class="nar">25.20</b></div>
 <div class="ap" data-en="3">25.20 × (15 − 3) <span style="color:#8fa9c2">=</span> <b class="nar">302.40</b></div>
 <div class="ap" data-en="4">302.40 ÷ 225 <span style="color:#8fa9c2">=</span> <b style="color:#ffd166">{y(3):.3f} m</b></div>
</div>
<div class="paso pop" data-en="5" style="position:absolute;left:50%;transform:translateX(-50%);top:800px;font-size:30px"><b>y</b>A 3 m DEL APOYO: 1.34 m</div>'''))

# 5. Tabla rápida
fr = [0.1, 0.2, 0.3, 0.4, 0.5]
E.append(dict(frases=[
  'Ahora el truco para no usar la fórmula en obra: la tabla rápida.',
  'Divide la luz en diez partes iguales. En cada división, la altura es un número fijo por la flecha.',
  'En la primera división, cero treinta y seis por la flecha. En la segunda, cero sesenta y cuatro. Luego cero ochenta y cuatro, cero noventa y seis, y en el centro, uno.',
  'Comprobemos: tres metros es la segunda división de quince. Cero sesenta y cuatro por dos diez: un metro treinta y cuatro. ¡Igual que con la fórmula!',
  'Y un dato de oro: InnovApp, en una nave de quince metros, también divide el arco en diez tramos. Así que los nudos del arco coinciden con esta tabla.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55), (4, 1.0, 50, 50)], html=titulo('Tabla <span class="nar">rápida</span>: y = factor × f', top=110) + f'''
<svg style="position:absolute;left:210px;top:220px" width="1500" height="420" viewBox="0 0 1500 420">
 <polyline points="{parabola(60, 1440, 380, 300)}" fill="none" stroke="#f97316" stroke-width="10"/>
 <line x1="60" y1="380" x2="1440" y2="380" stroke="#5cc8ff" stroke-width="4"/>
 {''.join(f'<g class="ap" data-en="1" data-mas="{0.1*i:.1f}"><line x1="{60+138*i}" y1="380" x2="{60+138*i}" y2="{380-300*4*(i/10)*(1-i/10):.0f}" stroke="#ffd166" stroke-width="3" stroke-dasharray="8 6"/><text x="{60+138*i}" y="414" fill="#8fa9c2" font-size="22" text-anchor="middle">{i/10:.1f}L</text></g>' for i in range(11))}
 {''.join(f'<g class="pop" data-en="2" data-mas="{1.2*k:.1f}"><rect x="{60+138*i-56}" y="{380-300*4*(i/10)*(1-i/10)-68:.0f}" width="112" height="46" rx="10" fill="#f97316"/><text x="{60+138*i}" y="{380-300*4*(i/10)*(1-i/10)-35:.0f}" fill="#fff" font-size="27" font-weight="900" text-anchor="middle">{4*(i/10)*(1-i/10):.2f}</text></g>' for k, i in enumerate(range(1, 6)))}
</svg>
<div class="tarjeta ap" data-en="3" style="position:absolute;left:430px;right:430px;top:690px;text-align:center;font-size:34px;font-weight:800;padding:14px">x = 3 m = 0.2 L → 0.64 × 2.10 = <span style="color:#ffd166">1.34 m ✔</span></div>'''))

# 6. Parábola vs cuerda (círculo)
d1 = (circ(L * 0.1, L, F) - y(L * 0.1)) * 100
L2, F2 = 15, 3.75
d2 = (circ(L2 * 0.25, L2, F2) - 0.75 * F2) * 100
E.append(dict(frases=[
  '¿Y por qué no trazar con una cuerda y un clavo, como un compás? Porque eso da un arco de círculo, no una parábola.',
  'Mira las dos curvas con la misma luz y la misma flecha. Parecen iguales, pero no lo son.',
  f'En nuestra nave de quince metros, la diferencia llega a unos {d1:.0f} centímetros. Y en un arco más alto, de flecha tres setenta y cinco, ¡llega a {d2:.0f} centímetros!',
  'Esos centímetros hacen que los arcos no coincidan entre sí, que las correas queden desniveladas, y que el arco no trabaje como se calculó.',
], zoom=[(0, 1.0, 50, 50), (2, 1.1, 30, 62), (3, 1.0, 50, 50)], html=titulo('Parábola <span class="nar">vs.</span> arco con cuerda', top=110) + f'''
<svg style="position:absolute;left:260px;top:250px" width="1400" height="520" viewBox="0 0 1400 520">
 <polyline class="dib" data-en="1" points="{' '.join(f'{60+1280*i/80:.1f},{470-400*circ(L2*i/80, L2, F2)/F2:.1f}' for i in range(81))}" fill="none" stroke="#5cc8ff" stroke-width="8" style="--l:1800"/>
 <polyline class="dib" data-en="1" data-mas="0.6" points="{parabola(60, 1340, 470, 400)}" fill="none" stroke="#f97316" stroke-width="8" style="--l:1800"/>
 <line x1="40" y1="470" x2="1360" y2="470" stroke="#8fa9c2" stroke-width="3"/>
 <g class="pop" data-en="2" data-mas="3"><circle cx="{60+1280*0.25}" cy="{470-400*0.75:.0f}" r="44" fill="none" stroke="#ffd166" stroke-width="4"/><text x="{60+1280*0.25-30}" y="{470-400*0.75-60:.0f}" fill="#ffd166" font-size="32" font-weight="900">{d2:.0f} cm</text></g>
 <g class="ap" data-en="1" data-mas="1.5"><rect x="980" y="20" width="26" height="26" fill="#f97316"/><text x="1018" y="42" fill="#fff" font-size="28" font-weight="800">Parábola (correcto)</text>
 <rect x="980" y="64" width="26" height="26" fill="#5cc8ff"/><text x="1018" y="86" fill="#fff" font-size="28" font-weight="800">Círculo (cuerda)</text></g>
</svg>
<div style="position:absolute;left:0;right:0;top:800px;display:flex;justify-content:center;gap:22px">
 <div class="paso pop" data-en="3" data-mas="0.3" style="background:#ff6b6b"><b>✕</b>ARCOS DISTINTOS</div><div class="paso pop" data-en="3" data-mas="1.4" style="background:#ff6b6b"><b>✕</b>CORREAS DESNIVELADAS</div>
</div>'''))

# 7. Largo del arco y dos cordones
E.append(dict(frases=[
  'Ahora, ¿cuánto tubo necesita el arco? El largo no es la luz: la curva es más larga.',
  f'Con esta fórmula: ele, por uno más ocho tercios de efe entre ele al cuadrado. En nuestra nave sale {S(L, F):.2f} metros.',
  'Ojo: un arco reticulado tiene dos cordones. El cordón inferior sigue la parábola que calculamos.',
  'Y el cordón superior es la misma curva, subida el peralte del arco: más o menos la luz entre dieciocho. En nuestra nave, ochenta y tres centímetros.',
  'Así lo arma también InnovApp, y en la pestaña Cortes te da el largo exacto de cada tramo de cordón.',
], zoom=[(0, 1.0, 50, 50), (2, 1.08, 50, 50), (4, 1.0, 50, 50)], html=titulo('Largo del arco y <span class="nar">los dos cordones</span>', top=110) + f'''
<div class="tarjeta ap" data-en="1" style="position:absolute;left:160px;top:250px;width:760px;font-size:34px;line-height:1.5">
 <div style="font-family:DejaVu Sans Mono,monospace;font-size:32px">S ≈ L · [1 + 8/3 · (f/L)²]</div>
 <div style="margin-top:14px">S = 15 · [1 + 8/3 · (0.14)²]</div>
 <div style="margin-top:8px;font-size:44px;font-weight:900;color:#ffd166">S ≈ {S(L, F):.2f} m</div>
 <div class="nota" style="font-size:24px;color:#8fa9c2;margin-top:8px">(el curso trae la fórmula completa en la tabla de trazo)</div>
</div>
<svg style="position:absolute;left:960px;top:250px" width="840" height="520" viewBox="0 0 840 520">
 <rect x="40" y="330" width="20" height="170" fill="#9fb3c6"/><rect x="780" y="330" width="20" height="170" fill="#9fb3c6"/>
 <polyline class="dib" data-en="2" points="{parabola(50, 790, 330, 200)}" fill="none" stroke="#f97316" stroke-width="9" style="--l:1100"/>
 <polyline class="dib" data-en="3" points="{parabola(50, 790, 270, 200)}" fill="none" stroke="#ffb27a" stroke-width="9" style="--l:1100"/>
 <line class="ap" data-en="3" x1="50" y1="270" x2="50" y2="330" stroke="#ffb27a" stroke-width="7"/><line class="ap" data-en="3" x1="790" y1="270" x2="790" y2="330" stroke="#ffb27a" stroke-width="7"/>
 <text class="ap" data-en="2" x="420" y="190" fill="#f97316" font-size="28" font-weight="800" text-anchor="middle">cordón inferior = parábola</text>
 <text class="ap" data-en="3" x="420" y="56" fill="#ffb27a" font-size="28" font-weight="800" text-anchor="middle">cordón superior = + peralte</text>
 <g class="pop" data-en="3" data-mas="2"><line x1="420" y1="70" x2="420" y2="130" stroke="#7ee08a" stroke-width="5"/><text x="436" y="112" fill="#7ee08a" font-size="30" font-weight="900">h ≈ L/18 = 0.83 m</text></g>
</svg>'''))

# 8. Trazo en el taller
pasos_t = [('Línea base', 'Traza la luz en el piso con tiralíneas, bien recta y nivelada.'),
           ('Divide', 'Marca la luz en 10 partes iguales (en 15 m: cada 1.50 m).'),
           ('Perpendiculares', 'Levanta una perpendicular en cada marca con la regla 3-4-5.'),
           ('Alturas', 'Mide la altura y de la tabla en cada perpendicular y marca el punto.'),
           ('Une los puntos', 'Pasa un tubo o platina flexible por todos los puntos y dibuja la curva.'),
           ('Plantilla', 'Suelda topes (tacos) siguiendo la curva: todos los arcos salen iguales.')]
E.append(dict(frases=[
  'Ahora sí, el procedimiento de taller. Paso uno: traza la luz en el piso con un tiralíneas, bien recta y nivelada.',
  'Paso dos: divide la luz en diez partes iguales. En quince metros, cada metro cincuenta.',
  'Paso tres: en cada marca, levanta una perpendicular. Usa la regla tres, cuatro, cinco para que salga a escuadra.',
  'Paso cuatro: en cada perpendicular mide la altura de la tabla y marca el punto.',
  'Paso cinco: pasa un tubo delgado o una platina flexible por todos los puntos, y dibuja la curva.',
  'Y paso seis, el secreto de los buenos talleres: suelda tacos siguiendo la curva. Esa plantilla te asegura que todos los arcos salgan idénticos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 30, 50), (4, 1.05, 70, 50), (5, 1.0, 50, 50)], html=titulo('Trazo en el piso <span class="nar">del taller</span>', top=100) + f'''
<svg style="position:absolute;left:880px;top:230px" width="960" height="560" viewBox="0 0 960 560">
 <line class="dib" data-en="0" x1="40" y1="480" x2="920" y2="480" stroke="#5cc8ff" stroke-width="6" style="--l:900"/>
 {''.join(f'<line class="pop" data-en="1" data-mas="{0.1*i:.1f}" x1="{40+88*i}" y1="470" x2="{40+88*i}" y2="495" stroke="#fff" stroke-width="4"/>' for i in range(11))}
 {''.join(f'<line class="dib" data-en="2" data-mas="{0.08*i:.2f}" x1="{40+88*i}" y1="480" x2="{40+88*i}" y2="{480-380*4*(i/10)*(1-i/10)-10:.0f}" stroke="#8fa9c2" stroke-width="2" stroke-dasharray="6 5" style="--l:400"/>' for i in range(1, 10))}
 <g class="ap" data-en="2" data-mas="1.2"><path d="M128 480 L128 440 L158 440" fill="none" stroke="#7ee08a" stroke-width="3"/><text x="134" y="430" fill="#7ee08a" font-size="20" font-weight="800">3-4-5</text></g>
 {''.join(f'<circle class="pop" data-en="3" data-mas="{0.12*i:.2f}" cx="{40+88*i}" cy="{480-380*4*(i/10)*(1-i/10):.0f}" r="9" fill="#ffd166"/>' for i in range(11))}
 <polyline class="dib" data-en="4" points="{parabola(40, 920, 480, 380)}" fill="none" stroke="#f97316" stroke-width="9" style="--l:1300"/>
 {''.join(f'<rect class="pop" data-en="5" data-mas="{0.1*i:.1f}" x="{40+44*i-8}" y="{480-380*4*(i/20)*(1-i/20)+6:.0f}" width="16" height="22" fill="#cfd8e0"/>' for i in range(1, 20))}
</svg>
<div style="position:absolute;left:110px;top:240px;width:740px">''' +
 ''.join(f'<div class="ap" data-en="{i}" style="display:flex;gap:16px;align-items:flex-start;margin:12px 0"><span class="paso" style="font-size:20px;flex:none"><b>{i+1}</b>PASO</span><div><div style="font-size:30px;font-weight:900">{t}</div><div style="font-size:23px;color:#c9d6e3">{d}</div></div></div>' for i, (t, d) in enumerate(pasos_t)) + '</div>'))

# 9. Tabla de la nave 15 m
filas = [(i * 1.5, y(i * 1.5), y(i * 1.5) + 0.83) for i in range(6)]
E.append(dict(frases=[
  'Esta es la tabla completa para nuestra nave de quince metros. Tómale captura.',
  'Cordón inferior: la altura de la parábola. Cordón superior: la misma altura, más ochenta y tres centímetros.',
  'Y como es simétrica, la otra mitad es igual, en espejo. Esta misma tabla la tienes en PDF en los materiales del curso.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55), (2, 1.0, 50, 50)], html=titulo('Tabla de trazo · <span class="nar">nave de 15 m</span>', top=100) +
 '<div class="ap" data-en="0" data-mas="0.5" style="position:absolute;left:420px;right:420px;top:220px"><table style="width:100%;border-collapse:collapse;font-size:32px">'
 '<tr style="background:#f97316"><th style="padding:12px">x (m)</th><th>espejo (m)</th><th>Cordón inferior y (m)</th><th>Cordón superior (m)</th></tr>' +
 ''.join(f'<tr class="ap" data-en="1" data-mas="{0.3*i:.1f}" style="background:{"rgba(255,255,255,.06)" if i % 2 else "transparent"}"><td style="padding:10px;text-align:center">{x:.2f}</td><td style="text-align:center">{L-x:.2f}</td><td style="text-align:center;color:#ffd166;font-weight:800">{yi:.3f}</td><td style="text-align:center;color:#ffb27a;font-weight:800">{ys:.3f}</td></tr>' for i, (x, yi, ys) in enumerate(filas)) +
 '</table><div style="font-size:24px;color:#8fa9c2;margin-top:12px;text-align:center">Alturas medidas desde la cabeza de la columna · peralte 0.83 m</div></div>'))

# 10. En InnovApp: la misma geometría
E.append(pantalla('p09_arriba', ['En InnovApp, en la vista de frente, ves exactamente esta geometría: el cordón inferior, el superior, y los nudos cada metro cincuenta.', 'Así compruebas que lo que trazas en el taller es lo mismo que la app calculó.'], None, 'Vista de frente · Techos Metálicos', fundido=True))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.25, 50, 40)]
E.append(pantalla('p17_cortes', ['Y en Cortes tienes el largo de cada pieza, ya optimizado en barras de seis metros. Tu soldador corta, y la pieza calza en la plantilla.'], None, 'Cortes · largo exacto de cada tramo', fundido=True))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.2, 40, 45)]

# 11. Errores
errores = [('Medir x desde el borde equivocado', 'Siempre desde el eje del apoyo, no desde el borde de la placa.'),
           ('Piso desnivelado', 'Si la línea base no está a nivel, todas las alturas salen mal.'),
           ('Perpendiculares “a ojo”', 'Usa la regla 3-4-5; un grado de error son centímetros arriba.'),
           ('Olvidar el peralte', 'El cordón superior va la misma curva + el peralte, no otra parábola.'),
           ('No verificar la simetría', 'Compara cada punto con su espejo antes de soldar los tacos.')]
E.append(dict(frases=[
  'Cinco errores que veo seguido en el trazo.',
  'Uno: medir equis desde el borde equivocado. Siempre desde el eje del apoyo.',
  'Dos: trazar sobre un piso desnivelado. Todas las alturas salen mal.',
  'Tres: perpendiculares a ojo. Un grado de error, son centímetros arriba.',
  'Cuatro: olvidar el peralte, o trazar el cordón superior como otra parábola distinta.',
  'Y cinco: no verificar la simetría. Compara cada punto con su espejo antes de soldar los tacos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=titulo('5 errores <span class="nar">en el trazo</span>', top=110) +
 '<div style="position:absolute;left:220px;right:220px;top:230px">' +
 ''.join(f'<div class="ap" data-en="{i+1}" style="display:flex;gap:22px;align-items:center;background:rgba(255,93,93,.08);border:2px solid rgba(255,107,107,.55);border-radius:18px;padding:14px 24px;margin:12px 0">'
         f'<span style="background:#ff6b6b;color:#fff;font-weight:900;font-size:30px;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;flex:none">✕</span>'
         f'<div><div style="font-size:33px;font-weight:900">{t}</div><div style="font-size:25px;color:#c9d6e3">{d}</div></div></div>' for i, (t, d) in enumerate(errores)) + '</div>'))

# 12. Reto
E.append(dict(frases=[
  '¡Tu reto! Nave de doce metros, con la flecha óptima.',
  'Primero calcula la flecha. Luego, con la tabla rápida, saca la altura del cordón inferior a dos metros cuarenta del apoyo, y en el centro.',
  'Y el bonus: compáralo en InnovApp, en la vista de frente. En la próxima clase te doy las respuestas.',
], html='''
<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><div class="paso pop" data-en="0" style="font-size:30px"><b>★</b>TU RETO</div></div>
<div class="tarjeta ap" data-en="0" data-mas="0.5" style="position:absolute;left:380px;right:380px;top:300px;font-size:36px;line-height:1.6">
 <div>📏 Nave de <b class="nar">L = 12 m</b>, flecha óptima</div>
 <div class="ap" data-en="1">1️⃣ ¿Cuánto es <b class="nar">f</b>?</div>
 <div class="ap" data-en="1" data-mas="2.5">2️⃣ Altura del cordón inferior en <b class="nar">x = 2.40 m</b></div>
 <div class="ap" data-en="1" data-mas="4.5">3️⃣ Altura en el <b class="nar">centro</b></div>
 <div class="ap" data-en="2">⭐ Compáralo en InnovApp → vista de frente</div>
</div>'''))

# 13. Cierre
E.append(dict(antes=0.3, despues=2.4, frases=[
  'Resumiendo: la altura del arco sale de la fórmula de la parábola, o más fácil, de la tabla rápida por la flecha.',
  'Traza con línea base, perpendiculares y plantilla con tacos, y todos tus arcos saldrán iguales.',
  'En la próxima clase armamos el arco reticulado: perfiles de los cordones, montantes y diagonales. ¡Nos vemos!',
], html=f'''
<div style="position:absolute;left:0;right:0;top:220px;text-align:center">
 <img class="pop" data-en="0" src="data:image/png;base64,{EMBLEMA}" style="width:170px;height:164px;background:#fff;border-radius:34px;padding:14px">
 <h2 class="t ap" data-en="0" data-mas="0.4" style="margin-top:30px">¡Clase 2 <span class="nar">completada</span>!</h2>
 <div class="ap" data-en="2" style="margin-top:26px;font-size:34px;color:#c9d6e3;font-weight:600">Siguiente: <b style="color:#fff">Clase 3 · Arcos reticulados: cordones y celosía</b></div>
 <div class="paso pop" data-en="1" data-mas="0.6" style="margin-top:36px;font-size:26px"><b>↓</b>MATERIAL: TABLA DE TRAZO DE ARCOS (PDF)</div>
 <div class="ap" data-en="2" data-mas="3" style="margin-top:42px;font-size:26px;color:#8fa9c2;font-weight:700;letter-spacing:2px">INNOVA CONTRATISTAS · ACADEMIA TÉCNICA · WHATSAPP 966 000 500</div>
</div>'''))

if __name__ == '__main__':
    salida = '/home/claude/video/salida/naves_c2.mp4'
    if len(sys.argv) > 1 and sys.argv[1] == 'prueba':
        render(E, CURSO, salida, cuadros={i: [9.0] for i in range(len(E))})
    else:
        render(E, CURSO, salida)
