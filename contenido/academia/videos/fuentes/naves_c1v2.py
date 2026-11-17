"""Curso Naves Parabólicas · Clase 1 (versión completa): qué es, dónde conviene, partes, medidas,
ejemplo resuelto 15 x 30 m y práctica en InnovApp → Techos Metálicos."""
import base64, json, pathlib, sys
from motor import render, EMBLEMA

CURSO = 'NAVES PARABÓLICAS · CLASE 1'
PANT = pathlib.Path('/home/claude/video/pantallas')
CAJAS = json.loads((PANT / 'pasos.json').read_text())

def parabola(x0, x1, base, alto, n=60):
    return ' '.join(f'{x0 + (x1 - x0) * i / n:.1f},{base - 4 * alto * (i / n) * (1 - i / n):.1f}' for i in range(n + 1))

def arco_reticulado(x0, x1, base, alto, peralte, color='#f97316', en=0, mas=0, grosor=1.0):
    ext = [(x0 + (x1 - x0) * i / 40, base - 4 * alto * (i / 40) * (1 - i / 40)) for i in range(41)]
    inn = [(x0 + peralte + (x1 - x0 - 2 * peralte) * i / 40, base - 4 * (alto - peralte) * (i / 40) * (1 - i / 40)) for i in range(41)]
    cel = ''.join(f'M{ext[i][0]:.0f} {ext[i][1]:.0f} L{inn[min(i+2,40)][0]:.0f} {inn[min(i+2,40)][1]:.0f} L{ext[min(i+4,40)][0]:.0f} {ext[min(i+4,40)][1]:.0f} ' for i in range(0, 40, 4))
    pe = lambda pts: 'M' + ' L'.join(f'{x:.0f} {y:.0f}' for x, y in pts)
    a = f'data-en="{en}" data-mas="{mas}"'
    return (f'<path class="dib" {a} d="{pe(ext)}" fill="none" stroke="{color}" stroke-width="{9*grosor}" style="--l:2600"/>'
            f'<path class="dib" {a} d="{pe(inn)}" fill="none" stroke="{color}" stroke-width="{6*grosor}" style="--l:2400;animation-delay:.3s"/>'
            f'<path class="dib" {a} d="{cel}" fill="none" stroke="#ffb27a" stroke-width="{3.2*grosor}" style="--l:9000;animation-duration:2.6s;animation-delay:.6s"/>')

def titulo(t, en=0, top=130):
    return f'<div style="position:absolute;left:0;right:0;top:{top}px;text-align:center"><h2 class="t ap" data-en="{en}">{t}</h2></div>'

CURSOR = '<svg viewBox="0 0 24 24" width="44" height="44"><path d="M3 2l7 19 2.6-7.4L20 11z" fill="#fff" stroke="#0b2a45" stroke-width="1.6" stroke-linejoin="round"/></svg>'
_ultimo = [960, 540]

def pantalla(img, frases, caja=None, globo=None, en=0, zoom=1.3, alejar=None, fundido=False):
    """Paso en la pantalla real de InnovApp: cursor que llega, clic, resaltado y acercamiento."""
    b64 = base64.b64encode((PANT / f'{img}.jpg').read_bytes()).decode()
    html = f'<img src="data:image/jpeg;base64,{b64}" style="position:absolute;inset:0;width:1920px;height:1080px">'
    z = [(0, 1.0, 50, 50)]
    if caja:
        x, y, w, h = caja; cx, cy = x + w / 2, y + h / 2
        x0, y0 = _ultimo
        html += (f'<div class="cursor" data-en="{en}" style="--x0:{x0}px;--y0:{y0}px;--x1:{cx-6:.0f}px;--y1:{cy-4:.0f}px">{CURSOR}</div>'
                 f'<div class="clic" data-en="{en}" data-mas="0.9" style="left:{cx-40:.0f}px;top:{cy-40:.0f}px;width:80px;height:80px"></div>'
                 f'<div class="resalta" data-en="{en}" data-mas="0.9" style="left:{x-12}px;top:{y-12}px;width:{w+24}px;height:{h+24}px"></div>')
        if globo:
            gy = y + h + 30 if cy < 700 else y - 90
            gx = min(max(40, cx - 200), 1500)
            html += f'<div class="globo pop" data-en="{en}" data-mas="1.2" style="left:{gx:.0f}px;top:{gy:.0f}px">{globo}</div>'
        _ultimo[:] = [cx, cy]
        px, py = max(25, min(75, cx / 19.2)), max(25, min(75, cy / 10.8))
        z = [(0, 1.0, px, py), (en, zoom, px, py)]
        if alejar is not None: z.append((alejar, 1.0, px, py))
    elif globo:
        html += f'<div class="globo pop" data-en="{en}" data-mas="0.6" style="left:50%;top:140px;transform:translateX(-50%)">{globo}</div>'
    return dict(frases=frases, html=html, zoom=z, sin_marca=True, fundido=fundido, antes=0.3, despues=0.5)

def tarjeta(contenido, en, mas=0, extra=''):
    return f'<div class="tarjeta ap" data-en="{en}" data-mas="{mas}" style="{extra}">{contenido}</div>'

E = []

# 0. Gancho
E.append(dict(antes=0.8, frases=[
  '¿Sabías que una nave parabólica puede techar veinte metros de ancho sin una sola columna en medio?',
  '¡Hola! Bienvenido al curso de naves parabólicas de Innova Contratistas.',
  'Este curso es práctico: lo que aprendas aquí, lo vas a diseñar, metrar y presupuestar en InnovApp.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 45)], html=f'''
<svg style="position:absolute;left:740px;top:130px" width="1120" height="800" viewBox="0 0 1100 800">
 {arco_reticulado(60, 1040, 740, 620, 52, en=0)}
 <g class="ap" data-en="0" data-mas="1.6"><line x1="60" y1="775" x2="1040" y2="775" stroke="#5cc8ff" stroke-width="5"/><text x="550" y="765" fill="#5cc8ff" font-size="40" font-weight="900" text-anchor="middle">20 m sin columnas</text></g>
</svg>
<div style="position:absolute;left:120px;top:290px;width:820px">
 <div class="paso pop" data-en="1"><b>1</b>CLASE 1 DE 9</div>
 <h1 class="t ap" data-en="1" data-mas="0.3" style="margin-top:30px">Naves <span class="nar">Parabólicas</span></h1>
 <p class="ap" data-en="1" data-mas="0.8" style="margin-top:24px;font-size:38px;font-weight:600;color:#c9d6e3;line-height:1.3">Qué es, dónde conviene<br>y cómo diseñarla en InnovApp</p>
</div>'''))

# 1. Agenda
temas = ['Qué es y por qué funciona', 'Dónde conviene usarla', 'Sus partes, con los nombres de InnovApp', 'Las medidas clave', 'Ejemplo resuelto: nave de 15 × 30 m', 'Práctica en Techos Metálicos']
E.append(dict(frases=[
  'Esto es lo que vas a aprender hoy.',
  'Primero la teoría: qué es, por qué funciona y dónde conviene.',
  'Luego sus partes y las medidas clave, con un ejemplo resuelto con números.',
  'Y al final, la diseñamos juntos en InnovApp, paso a paso.',
], html=titulo('Lo que vas a <span class="nar">aprender hoy</span>') + '<div style="position:absolute;left:330px;right:330px;top:280px">' +
 ''.join(f'<div class="ap" data-en="{1 if i < 2 else (2 if i < 5 else 3)}" data-mas="{[0,1.2,0,1,2.2,0][i]}" style="display:flex;align-items:center;gap:22px;margin:16px 0;font-size:38px;font-weight:700"><span class="paso" style="font-size:22px"><b>{i+1}</b>TEMA</span>{t}</div>' for i, t in enumerate(temas)) + '</div>'))

# 2. Qué es
E.append(dict(frases=[
  'Empecemos. ¿Qué es una nave parabólica?',
  'Es una estructura de acero que cubre grandes espacios sin columnas intermedias.',
  'Su techo tiene forma de arco: una parábola.',
  'La forman varios arcos reticulados, uno detrás de otro, a la misma distancia.',
  'Y los arcos se unen con correas, que sostienen la cobertura.',
], zoom=[(0, 1.0, 50, 50), (3, 1.08, 70, 50), (4, 1.0, 50, 50)], html=f'''
<div style="position:absolute;left:120px;top:200px;width:700px">
 <h2 class="t ap" data-en="0">¿Qué es una<br><span class="nar">nave parabólica?</span></h2>
 {tarjeta('Estructura de acero que cubre <b class="nar">grandes luces</b> sin columnas intermedias.', 1, 0, 'margin-top:40px;font-size:32px;line-height:1.4')}
 {tarjeta('Arcos <b class="nar">reticulados</b> repetidos a la misma distancia, unidos con <b class="nar">correas</b>.', 3, 0, 'margin-top:22px;font-size:32px;line-height:1.4')}
</div>
<svg style="position:absolute;left:860px;top:150px" width="1000" height="780" viewBox="0 0 1000 780">
 <polyline class="dib" data-en="2" points="{parabola(80, 920, 700, 560)}" fill="none" stroke="#ffd166" stroke-width="5" stroke-dasharray="14 10" style="--l:1600"/>
 {''.join(f'<g transform="translate({k*34} {-k*30}) scale({1-k*0.07})" style="transform-origin:500px 700px" opacity="{1-k*0.15:.2f}">' + arco_reticulado(80, 920, 700, 560, 40, en=3, mas=k*0.4, grosor=1-k*0.1) + '</g>' for k in range(4, -1, -1))}
 {''.join(f'<line class="ap" data-en="4" data-mas="{i*0.12:.2f}" x1="{80+840*t:.0f}" y1="{700-4*560*t*(1-t):.0f}" x2="{80+840*t+136:.0f}" y2="{700-4*560*t*(1-t)-120:.0f}" stroke="#e8edf2" stroke-width="4"/>' for i, t in enumerate([.1, .22, .34, .5, .66, .78, .9]))}
</svg>'''))

# 3. Por qué funciona: viga recta vs arco
def _ya(x): t = (x - 1000) / 760; return 640 - 4 * 300 * t * (1 - t)
E.append(dict(frases=[
  '¿Y por qué una parábola? Mira esta comparación.',
  'Una viga recta, con el peso del techo, se dobla hacia abajo. Trabaja a flexión, y para no doblarse necesita mucho acero.',
  'En cambio, el arco parabólico, con ese mismo peso repartido, trabaja casi solo a compresión.',
  'El acero rinde mucho más a compresión que a flexión.',
  'Por eso la nave parabólica es ligera, económica y rápida de montar.',
], zoom=[(0, 1.0, 50, 50), (1, 1.12, 27, 55), (2, 1.12, 73, 55), (4, 1.0, 50, 50)], html=f'''
{titulo('¿Por qué <span class="nar">funciona</span>?')}
<style>@keyframes flexa{{from{{d:path("M160 560 Q 480 560 800 560")}}to{{d:path("M160 560 Q 480 720 800 560")}}}}</style>
<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">
 <defs><marker id="fl" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5cc8ff"/></marker>
 <marker id="fc" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ff6b6b"/></marker></defs>
 <g class="ap" data-en="1">
  <text x="480" y="330" fill="#fff" font-size="40" font-weight="900" text-anchor="middle">Viga recta</text>
  {''.join(f'<line x1="{x}" y1="420" x2="{x}" y2="520" stroke="#5cc8ff" stroke-width="5" marker-end="url(#fl)"/>' for x in range(200, 800, 75))}
  <path data-en="1" data-mas="1.5" d="M160 560 Q 480 560 800 560" fill="none" stroke="#9fb3c6" stroke-width="18" style="animation:flexa 1.6s ease-in-out both paused"/>
  <rect x="140" y="570" width="40" height="80" fill="#6b7f93"/><rect x="780" y="570" width="40" height="80" fill="#6b7f93"/>
  <text class="ap" data-en="1" data-mas="2.5" x="480" y="760" fill="#ff8a8a" font-size="38" font-weight="900" text-anchor="middle">FLEXIÓN · mucho acero</text>
 </g>
 <g class="ap" data-en="2">
  <text x="1380" y="250" fill="#fff" font-size="40" font-weight="900" text-anchor="middle">Arco parabólico</text>
  {''.join(f'<line x1="{x}" y1="{_ya(x)-100:.0f}" x2="{x}" y2="{_ya(x)-28:.0f}" stroke="#5cc8ff" stroke-width="5" marker-end="url(#fl)"/>' for x in range(1090, 1700, 75))}
  <polyline points="{parabola(1000, 1760, 640, 300)}" fill="none" stroke="#f97316" stroke-width="16"/>
  <line class="ap" data-en="2" data-mas="1.2" x1="1150" y1="480" x2="1070" y2="600" stroke="#ff6b6b" stroke-width="10" marker-end="url(#fc)"/>
  <line class="ap" data-en="2" data-mas="1.4" x1="1610" y1="480" x2="1690" y2="600" stroke="#ff6b6b" stroke-width="10" marker-end="url(#fc)"/>
  <text class="ap" data-en="2" data-mas="1.8" x="1380" y="760" fill="#7ee08a" font-size="38" font-weight="900" text-anchor="middle">COMPRESIÓN · poco acero</text>
 </g>
</svg>
<div style="position:absolute;left:0;right:0;top:830px;display:flex;justify-content:center;gap:24px">
 <div class="paso pop" data-en="4" data-mas="0.3"><b>✓</b>LIGERA</div><div class="paso pop" data-en="4" data-mas="0.8"><b>✓</b>ECONÓMICA</div><div class="paso pop" data-en="4" data-mas="1.3"><b>✓</b>MONTAJE RÁPIDO</div>
</div>'''))

# 4. Dónde conviene
usos = [('Almacenes y depósitos', 'Espacio libre para mercadería y montacargas'), ('Coliseos y losas deportivas', 'Toda la cancha cubierta, sin columnas'),
        ('Talleres y fábricas', 'Altura en el centro para máquinas'), ('Mercados y ferias', 'Techo amplio, ventilado y económico'),
        ('Patios de colegios', 'Sombra y lluvia cubiertas en todo el patio'), ('Galpones agrícolas', 'Avícolas, establos y secado de granos')]
E.append(dict(frases=[
  '¿Dónde conviene? ¡En muchos trabajos que te van a pedir!',
  'Almacenes y depósitos, coliseos y losas deportivas, y talleres.',
  'Mercados y ferias, patios de colegios y galpones agrícolas.',
  'La regla es simple: si el cliente necesita mucho espacio libre, piensa en una parabólica.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 42), (2, 1.05, 50, 62), (3, 1.0, 50, 50)], html=titulo('¿Dónde <span class="nar">conviene</span>?') +
 '<div style="position:absolute;left:150px;right:150px;top:290px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px">' +
 ''.join(f'<div class="tarjeta ap" data-en="{1 if i < 3 else 2}" data-mas="{(i % 3)*0.9:.1f}" style="min-height:180px"><div class="paso" style="font-size:20px"><b>{i+1}</b>USO</div>'
         f'<div style="font-size:34px;font-weight:800;margin-top:14px">{t}</div><div style="font-size:25px;color:#c9d6e3;margin-top:8px">{d}</div></div>' for i, (t, d) in enumerate(usos)) +
 '</div><div class="ap" data-en="3" style="position:absolute;left:0;right:0;top:770px;text-align:center;font-size:38px;font-weight:900;color:#ffd166">Mucho espacio libre → nave parabólica</div>'))

# 5. Comparación
E.append(dict(frases=[
  'Ahora, compárala con la nave a dos aguas.',
  'La parabólica cubre luces de quince a cuarenta metros o más, sin columnas, y es más ligera.',
  'Pero ojo con tres cosas.',
  'A los costados queda menos altura libre.',
  'La cobertura tiene que ser curvada.',
  'Y el trazo y la fabricación del arco piden más precisión. Por eso este curso es tan importante.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 75, 55), (5, 1.0, 50, 50)], html=f'''
{titulo('Parabólica <span class="nar">vs.</span> dos aguas')}
<div style="position:absolute;left:140px;top:280px;width:780px" class="tarjeta ap" data-en="0" data-mas="0.4">
 <svg width="720" height="200" viewBox="0 0 720 200"><polyline points="{parabola(40, 680, 185, 160)}" fill="none" stroke="#f97316" stroke-width="10"/><line x1="20" y1="190" x2="700" y2="190" stroke="#8fa9c2" stroke-width="3"/></svg>
 <div style="font-size:36px;font-weight:900;margin:10px 0 14px">Nave parabólica</div>
 <div class="ap" data-en="1" style="font-size:31px;margin:8px 0">✔ Luces de 15 a 40 m o más</div>
 <div class="ap" data-en="1" data-mas="1.5" style="font-size:31px;margin:8px 0">✔ Sin columnas intermedias</div>
 <div class="ap" data-en="1" data-mas="3" style="font-size:31px;margin:8px 0">✔ Más ligera y moderna</div>
</div>
<div style="position:absolute;left:1000px;top:280px;width:780px" class="tarjeta ap" data-en="2">
 <div style="font-size:36px;font-weight:900;margin:0 0 18px;color:#ffd166">Lo que hay que cuidar</div>
 <div class="ap" data-en="3" style="font-size:31px;margin:12px 0">⚠ Menos altura libre a los costados</div>
 <div class="ap" data-en="4" style="font-size:31px;margin:12px 0">⚠ Cobertura curvada (aluzinc TR4 curvo)</div>
 <div class="ap" data-en="5" style="font-size:31px;margin:12px 0">⚠ Trazo y fabricación con precisión</div>
 <svg class="ap" data-en="3" width="720" height="150" viewBox="0 0 720 150" style="margin-top:16px"><polyline points="{parabola(40, 680, 140, 120)}" fill="none" stroke="#f97316" stroke-width="7"/>
 <rect x="50" y="78" width="70" height="62" fill="rgba(255,93,93,.25)" stroke="#ff5d5d" stroke-dasharray="6 5"/><rect x="600" y="78" width="70" height="62" fill="rgba(255,93,93,.25)" stroke="#ff5d5d" stroke-dasharray="6 5"/></svg>
</div>'''))

# 6. Partes (nombres de InnovApp)
X0, X1, BASE, ALTO, PER = 540, 1380, 800, 540, 44
def ext(t): return X0 + (X1 - X0) * t, BASE - 4 * ALTO * t * (1 - t)
def inn(t): return X0 + PER + (X1 - X0 - 2 * PER) * t, BASE - 4 * (ALTO - PER) * t * (1 - t)
def lab(frase, mas, x, y, texto, px, py, der):
    ancho = len(texto) * 18 + 30; lx = x if der else x + ancho
    return (f'<g class="pop" data-en="{frase}" data-mas="{mas}"><line x1="{lx}" y1="{y}" x2="{px:.0f}" y2="{py:.0f}" stroke="#ffd166" stroke-width="3"/><circle cx="{px:.0f}" cy="{py:.0f}" r="9" fill="#ffd166"/>'
            f'<rect x="{x}" y="{y-30}" width="{ancho}" height="58" rx="12" fill="#f97316"/><text x="{x+15}" y="{y+10}" font-size="30" font-weight="800" fill="#fff">{texto}</text></g>')
bs, bi = ext(0.72), inn(0.70)
ce = ((ext(0.80)[0] + inn(0.80)[0]) / 2, (ext(0.80)[1] + inn(0.80)[1]) / 2)
E.append(dict(frases=[
  'Veamos las partes, con los mismos nombres que usa InnovApp.',
  'Cada arco tiene un cordón superior y un cordón inferior.',
  'Entre los dos cordones van los montantes y las diagonales: la celosía que le da rigidez.',
  'Sobre los arcos van las correas.',
  'Entre arco y arco, los arriostres y tensores, para que la nave no se mueva con el viento.',
  'Abajo, la placa base con pernos de anclaje tipo jota,',
  'apoyada en la columna o en un pedestal de concreto.',
  'Y encima de todo, la cobertura, por ejemplo aluzinc TR4.',
], zoom=[(0, 1.0, 50, 50), (1, 1.1, 70, 40), (3, 1.08, 35, 40), (5, 1.0, 50, 50)], html=f'''
<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">
 <defs><linearGradient id="cob" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#cfd8e0" stop-opacity=".45"/><stop offset="1" stop-color="#cfd8e0" stop-opacity=".05"/></linearGradient></defs>
 <g transform="translate(80 -70)">
  <path class="ap" data-en="7" d="M{parabola(X0, X1, BASE, ALTO).replace(' ', ' L')} Z" fill="url(#cob)"/>
  <g opacity=".45">{arco_reticulado(X0, X1, BASE, ALTO, PER, en=0, mas=0.4)}</g>
 </g>
 {''.join(f'<line class="ap" data-en="3" data-mas="{i*0.12:.2f}" x1="{ext(t)[0]:.0f}" y1="{ext(t)[1]:.0f}" x2="{ext(t)[0]+80:.0f}" y2="{ext(t)[1]-70:.0f}" stroke="#e8edf2" stroke-width="7"/>' for i, t in enumerate([.06, .18, .3, .42, .58, .7, .82, .94]))}
 <g class="ap" data-en="4" data-mas="0.3" stroke="#5cc8ff" stroke-width="4"><line x1="{ext(.18)[0]:.0f}" y1="{ext(.18)[1]:.0f}" x2="{ext(.3)[0]+80:.0f}" y2="{ext(.3)[1]-70:.0f}"/><line x1="{ext(.3)[0]:.0f}" y1="{ext(.3)[1]:.0f}" x2="{ext(.18)[0]+80:.0f}" y2="{ext(.18)[1]-70:.0f}"/></g>
 {arco_reticulado(X0, X1, BASE, ALTO, PER, en=0)}
 <g class="ap" data-en="5"><rect x="{X0-60}" y="{BASE}" width="120" height="16" fill="#cfd8e0"/><rect x="{X0-80}" y="{BASE+16}" width="160" height="90" fill="#6b7f93"/>
 <rect x="{X1-60}" y="{BASE}" width="120" height="16" fill="#cfd8e0"/><rect x="{X1-80}" y="{BASE+16}" width="160" height="90" fill="#6b7f93"/>
 <line x1="{X0-35}" y1="{BASE-12}" x2="{X0-35}" y2="{BASE+70}" stroke="#ffd166" stroke-width="6"/><line x1="{X0+35}" y1="{BASE-12}" x2="{X0+35}" y2="{BASE+70}" stroke="#ffd166" stroke-width="6"/></g>
 {lab(1, 0, 1500, 300, 'Cordón superior', bs[0], bs[1], True)}
 {lab(1, 1.4, 1500, 400, 'Cordón inferior', bi[0], bi[1], True)}
 {lab(2, 0.3, 1500, 520, 'Montantes y diagonales', ce[0], ce[1], True)}
 {lab(3, 0.3, 90, 300, 'Correas', ext(.3)[0]+40, ext(.3)[1]-40, False)}
 {lab(4, 0.8, 90, 420, 'Arriostres y tensores', ext(.24)[0]+40, ext(.24)[1]-35, False)}
 {lab(5, 0.5, 60, 760, 'Placa base + perno J', X0-40, BASE+8, False)}
 {lab(6, 0.3, 1500, 760, 'Columna o pedestal', X1+40, BASE+60, True)}
 {lab(7, 0.3, 90, 560, 'Cobertura aluzinc TR4', ext(.2)[0]+60, ext(.2)[1]-10, False)}
</svg>
<div style="position:absolute;left:120px;top:150px"><h2 class="t ap" data-en="0" style="font-size:54px">Partes de la <span class="nar">nave</span></h2></div>'''))

# 7. Medidas clave
medidas = [('L', 'Luz', 'Distancia entre apoyos (el ancho)'), ('f', 'Flecha', 'Altura del arco sobre las columnas: 0.10 a 0.20 de L · óptima 0.14 L'),
           ('h', 'Peralte', 'Separación entre cordones: ≈ L / 18'), ('s', 'Separación de arcos', 'Uno cada 5 a 6 m'),
           ('c', 'Correas', 'Cada 1.2 a 1.6 m sobre el arco')]
E.append(dict(frases=[
  'Ahora, las cinco medidas clave. Apúntalas.',
  'La luz: la distancia entre apoyos.',
  'La flecha: la altura del arco sobre las columnas. Va entre diez y veinte por ciento de la luz, y la óptima es catorce por ciento. Es la misma que te recomienda el Asistente de InnovApp.',
  'El peralte del arco, que es la separación entre cordones: más o menos la luz entre dieciocho.',
  'Los arcos se colocan cada cinco a seis metros.',
  'Y las correas, cada metro veinte a metro sesenta sobre el arco.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 50, 48), (5, 1.0, 50, 50)], html=titulo('Las 5 medidas <span class="nar">clave</span>', top=120) + f'''
<svg style="position:absolute;left:120px;top:250px" width="760" height="520" viewBox="0 0 760 520">
 <polyline class="dib" data-en="0" points="{parabola(60, 700, 280, 170)}" fill="none" stroke="#f97316" stroke-width="12" style="--l:1000"/>
 <polyline class="dib" data-en="3" points="{parabola(100, 660, 280, 130)}" fill="none" stroke="#f97316" stroke-width="7" style="--l:900"/>
 <rect x="50" y="280" width="20" height="200" fill="#9fb3c6"/><rect x="690" y="280" width="20" height="200" fill="#9fb3c6"/>
 <g class="ap" data-en="1"><line x1="60" y1="505" x2="700" y2="505" stroke="#5cc8ff" stroke-width="4"/><text x="380" y="498" fill="#5cc8ff" font-size="34" font-weight="900" text-anchor="middle">L</text></g>
 <g class="ap" data-en="2"><line x1="380" y1="280" x2="380" y2="112" stroke="#ffd166" stroke-width="4" stroke-dasharray="10 7"/><text x="395" y="210" fill="#ffd166" font-size="34" font-weight="900">f</text></g>
 <g class="ap" data-en="3"><line x1="380" y1="112" x2="380" y2="150" stroke="#7ee08a" stroke-width="6"/><text x="300" y="140" fill="#7ee08a" font-size="34" font-weight="900">h</text></g>
</svg>
<div style="position:absolute;left:940px;top:250px;width:860px">''' +
 ''.join(f'<div class="ap" data-en="{i+1}" style="display:flex;gap:20px;align-items:flex-start;margin:14px 0"><span class="paso" style="font-size:26px;min-width:64px;justify-content:center;padding:9px 18px">{k}</span><div><div style="font-size:34px;font-weight:900">{n}</div><div style="font-size:26px;color:#c9d6e3">{d}</div></div></div>' for i, (k, n, d) in enumerate(medidas)) + '</div>'))

# 8. Ejemplo resuelto
pasos_ej = [('Flecha', 'f = 0.14 × 15', '2.10 m'), ('Peralte del arco', 'h = 15 ÷ 18', '0.83 m'), ('N.° de arcos', '30 ÷ 5 + 1', '7 arcos'),
            ('Largo de cada arco', 'S ≈ L·[1 + 8/3·(f/L)²]', '≈ 15.75 m'), ('Cobertura', '15.75 × 30', '≈ 472 m²')]
E.append(dict(frases=[
  'Ahora un ejemplo con números. Un cliente quiere un almacén de quince por treinta metros.',
  'Primero la flecha: catorce por ciento de quince. Nos da dos metros diez.',
  'El peralte del arco: quince entre dieciocho. Unos ochenta y tres centímetros.',
  'Los arcos: treinta entre cinco, más uno. Siete arcos.',
  'El largo de cada arco, con la fórmula de la tabla del curso, sale unos quince metros con setenta y cinco.',
  'Y la cobertura: quince setenta y cinco por treinta. Unos cuatrocientos setenta y dos metros cuadrados, más los traslapes.',
  'Con estos datos ya puedes cotizar con seguridad. Y ahora, ¡hagámoslo en InnovApp!',
], zoom=[(0, 1.0, 50, 50), (3, 1.05, 50, 55), (6, 1.0, 50, 50)], html=titulo('Ejemplo: almacén de <span class="nar">15 × 30 m</span>', top=110) +
 '<div style="position:absolute;left:260px;right:260px;top:240px">' +
 ''.join(f'<div class="ap" data-en="{i+1}" style="display:grid;grid-template-columns:70px 1fr 1fr 260px;align-items:center;gap:20px;background:rgba(255,255,255,.06);border:2px solid rgba(249,115,22,.45);border-radius:18px;padding:14px 24px;margin:12px 0">'
         f'<span class="paso" style="font-size:22px;padding:8px"><b>{i+1}</b></span><div style="font-size:32px;font-weight:800">{n}</div><div style="font-size:28px;color:#c9d6e3;font-family:DejaVu Sans Mono,monospace">{f}</div><div style="font-size:38px;font-weight:900;color:#ffd166;text-align:right">{r}</div></div>' for i, (n, f, r) in enumerate(pasos_ej)) + '</div>'))

# 9-… Práctica en InnovApp (pantallas reales del apartado Techos Metálicos)
E.append(dict(frases=[
  'Abre InnovApp y entra a Techos Metálicos.',
], antes=0.4, despues=0.6, html='''<div style="position:absolute;left:0;right:0;top:330px;text-align:center">
 <div class="paso pop" data-en="0" style="font-size:28px"><b>▶</b>PRÁCTICA EN INNOVAPP</div>
 <h1 class="t ap" data-en="0" data-mas="0.3" style="margin-top:30px">Techos <span class="nar">Metálicos</span></h1>
 <p class="ap" data-en="0" data-mas="0.6" style="margin-top:20px;font-size:36px;color:#c9d6e3;font-weight:600">Almacén parabólico de 15 × 30 m</p></div>'''))
E.append(pantalla('p01_vacio', ['Con el lienzo en blanco, toca el botón Asistente, arriba a la derecha.', 'El Asistente arma el techo completo con las medidas que le des.'], CAJAS['p01_vacio'], 'Asistente', fundido=True))
E.append(pantalla('p02_asistente', ['En el tipo de estructura, elige Parabólico Rolado.', 'Mira todas las formas que puedes armar: dos aguas, una agua, cuatro aguas y muchas más.'], CAJAS['p02_asistente'], 'Parabólico Rolado'))
E.append(pantalla('p03_luz', ['En las medidas, pon el ancho, que es la luz: quince metros.', 'Puedes escribirlo o tocar los botones de medidas rápidas.'], CAJAS['p03_luz'], 'Luz = 15 m'))
E.append(pantalla('p04_largo_altura', ['El largo, treinta metros.', 'Y la altura de las columnas: cinco metros. Para un almacén con camiones, puedes subirla a seis.'], CAJAS['p04_largo_altura'], 'Largo 30 m · columnas 5 m'))
E.append(pantalla('p05_flecha', ['Ahora la flecha. Toca Aplicar Flecha Óptima.', '¿Ves? Dos metros diez. Exactamente lo que calculamos a mano. El rango que te muestra al lado va del diez al veinte por ciento de la luz.'], CAJAS['p05_flecha'], 'f = 2.10 m ✔'))
E.append(pantalla('p06_tijerales', ['En la cantidad de tijerales, que son los arcos, pon siete.', 'Debajo te avisa la separación: uno cada cinco metros. Justo lo que buscamos.'], CAJAS['p06_tijerales'], '7 arcos'))
E.append(pantalla('p07_tijeral', ['El tipo de tijeral: deja el Arco clásico, que es el recomendado.', 'Tiene triángulos parejos, se arma rápido y rinde muy bien en esta luz.'], CAJAS['p07_tijeral'], 'Arco clásico'))
E.append(pantalla('p08_armar', ['Y ahora, toca Armar mi techo. InnovApp elige los perfiles y los verifica con la memoria de cálculo.'], CAJAS['p08_armar'], '¡Armar!'))
E.append(pantalla('p09_arriba', ['¡Listo! Aquí está tu nave, vista de frente.', 'Mira las columnas de cinco metros, y el arco con sus dos cordones, los montantes y las diagonales.'], None, 'Vista de frente'))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (1, 1.2, 50, 40)]
E.append(pantalla('p11_3d', ['Ahora entra a la vista en 3D.', 'Aquí están los siete arcos, las correas y los arriostres en cruz. Puedes girarla con el dedo o con el ratón, y mostrársela al cliente.'], CAJAS['p10_frente'], '3D'))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (1, 1.2, 55, 50)]
E.append(pantalla('p14_revision', ['Toca Revisar.', 'InnovApp revisa el diseño: todo conectado, sin piezas sueltas ni repetidas.'], CAJAS['p13_revisar_btn'], 'Revisar ✔'))
E.append(pantalla('p19_resumen', ['En Resumen tienes todo de un vistazo.', 'Kilos de acero, costo de los tubos, planchas de cobertura, y el área del techo: cuatrocientos setenta y dos metros cuadrados. ¡Igual que nuestro cálculo!'], CAJAS['p19_resumen'], 'Resumen'))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (1, 1.2, 50, 25)]
E.append(pantalla('p17_cortes', ['En Cortes, InnovApp te dice cómo cortar cada barra de seis metros, para que no desperdicies material.', 'Le das esta hoja a tu soldador, y a trabajar.'], CAJAS['p17_cortes'], 'Cortes'))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.2, 45, 40), (1, 1.2, 45, 60)]
E.append(pantalla('p15_materiales', ['En Materiales tienes la lista de tubos en barras de seis metros, y las planchas de cobertura.', 'Con esto ya puedes pedir el material a tu proveedor.'], CAJAS['p15_materiales'], 'Materiales'))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.15, 40, 45), (1, 1.15, 60, 45)]
E.append(pantalla('p18_plano', ['En Plano, la lámina estructural sale sola: elevación frontal, lateral y planta, con sus medidas.', 'Lista para imprimir o para llevar a la obra.'], CAJAS['p18_plano'], 'Plano'))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.2, 50, 50), (1, 1.2, 50, 75)]
E.append(pantalla('p16_presupuesto', ['Y en Presupuesto, la cotización formal: materiales, mano de obra, gastos y utilidad.', 'Pones el nombre de tu empresa, y se la mandas al cliente. ¡Así de fácil!'], CAJAS['p16_presupuesto'], 'Presupuesto'))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.15, 45, 40), (1, 1.15, 45, 75)]
E[-1]['fundido'] = True

# Errores comunes
errores = [('Trazar el arco “a ojo” o con cuerda', 'Sale un arco circular, no una parábola. Usa la tabla de trazo.'),
           ('Flecha muy baja', 'Menos de 0.10 L: el arco empuja fuerte hacia afuera y abre las columnas.'),
           ('No arriostrar el primer arco', 'Al montarlo puede voltearse. Primero arriostra, luego suelta.'),
           ('Anclajes fuera de eje o de nivel', 'El error de abajo se multiplica arriba. Verifica con diagonales.'),
           ('Calamina sin curvar', 'Con el radio equivocado aparecen filtraciones y ruidos.')]
E.append(dict(frases=[
  'Antes de terminar: los cinco errores más comunes en obra.',
  'Uno: trazar el arco a ojo, o con una cuerda. Eso da un arco circular, no una parábola.',
  'Dos: una flecha muy baja. El arco empuja fuerte hacia afuera y abre las columnas.',
  'Tres: no arriostrar el primer arco al montarlo. Se puede voltear.',
  'Cuatro: anclajes fuera de eje o desnivelados. El error de abajo se multiplica arriba.',
  'Y cinco: cobertura sin curvar. Vienen las filtraciones.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=titulo('5 errores <span class="nar">que debes evitar</span>', top=110) +
 '<div style="position:absolute;left:220px;right:220px;top:230px">' +
 ''.join(f'<div class="ap" data-en="{i+1}" style="display:flex;gap:22px;align-items:center;background:rgba(255,93,93,.08);border:2px solid rgba(255,107,107,.55);border-radius:18px;padding:14px 24px;margin:12px 0">'
         f'<span style="background:#ff6b6b;color:#fff;font-weight:900;font-size:30px;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;flex:none">✕</span>'
         f'<div><div style="font-size:33px;font-weight:900">{t}</div><div style="font-size:25px;color:#c9d6e3">{d}</div></div></div>' for i, (t, d) in enumerate(errores)) + '</div>'))

# Reto
E.append(dict(frases=[
  '¡Ahora te toca a ti! Este es tu reto.',
  'Diseña en InnovApp una nave parabólica de doce por veinticuatro metros, con columnas de cuatro metros y medio.',
  'Aplica la flecha óptima y anota cuánto te da. Pon seis tijerales.',
  'Revisa el diseño, mira los materiales y saca el presupuesto. En la próxima clase lo comparamos.',
], html=f'''
<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><div class="paso pop" data-en="0" style="font-size:30px"><b>★</b>TU RETO</div></div>
<div class="tarjeta ap" data-en="1" style="position:absolute;left:330px;right:330px;top:300px;font-size:36px;line-height:1.55">
 <div>🏗️ Nave parabólica de <b class="nar">12 × 24 m</b></div>
 <div>📏 Columnas de <b class="nar">4.5 m</b></div>
 <div class="ap" data-en="2">✨ Flecha óptima: anota el valor · <b class="nar">6 tijerales</b></div>
 <div class="ap" data-en="3">✅ Revisar → Materiales → Presupuesto</div>
</div>'''))

# Cierre
E.append(dict(antes=0.3, despues=2.4, frases=[
  'Resumiendo: la nave parabólica cubre grandes luces con poco acero, porque su arco trabaja a compresión.',
  'Con la flecha óptima del catorce por ciento y el Asistente de InnovApp, la tienes diseñada en minutos.',
  'Descarga la tabla de trazo y las plantillas de naves en los materiales del curso. ¡Nos vemos en la clase dos!',
], html=f'''
<div style="position:absolute;left:0;right:0;top:220px;text-align:center">
 <img class="pop" data-en="0" src="data:image/png;base64,{EMBLEMA}" style="width:170px;height:164px;background:#fff;border-radius:34px;padding:14px">
 <h2 class="t ap" data-en="0" data-mas="0.4" style="margin-top:30px">¡Clase 1 <span class="nar">completada</span>!</h2>
 <div class="ap" data-en="1" style="margin-top:26px;font-size:34px;color:#c9d6e3;font-weight:600">Siguiente: <b style="color:#fff">Clase 2 · Geometría del arco: luz, flecha y fórmula</b></div>
 <div class="paso pop" data-en="2" data-mas="0.6" style="margin-top:36px;font-size:26px"><b>↓</b>MATERIAL: TABLA DE TRAZO + PLANTILLAS EN TECHOS</div>
 <div class="ap" data-en="2" data-mas="2.5" style="margin-top:42px;font-size:26px;color:#8fa9c2;font-weight:700;letter-spacing:2px">INNOVA CONTRATISTAS · ACADEMIA TÉCNICA · WHATSAPP 966 000 500</div>
</div>'''))

if __name__ == '__main__':
    salida = '/home/claude/video/salida/naves_c1v2.mp4'
    if len(sys.argv) > 1 and sys.argv[1] == 'prueba':
        idx = {i: [6.0] for i in range(len(E))}
        render(E, CURSO, salida, cuadros=idx)
    else:
        render(E, CURSO, salida)
