"""Curso Naves Parabólicas · Clase 1: Qué es una nave parabólica y dónde conviene."""
import sys
from motor import render

CURSO = 'NAVES PARABÓLICAS · CLASE 1'

def parabola(x0, x1, base, alto, n=60):
    return ' '.join(f'{x0 + (x1 - x0) * i / n:.1f},{base - 4 * alto * (i / n) * (1 - i / n):.1f}' for i in range(n + 1))

def arco_reticulado(x0, x1, base, alto, peralte, color='#f97316', clase='', en=0, mas=0, grosor=1.0):
    ext = [(x0 + (x1 - x0) * i / 40, base - 4 * alto * (i / 40) * (1 - i / 40)) for i in range(41)]
    inn = [(x0 + peralte + (x1 - x0 - 2 * peralte) * i / 40, base - 4 * (alto - peralte) * (i / 40) * (1 - i / 40)) for i in range(41)]
    cel = ''.join(f'M{ext[i][0]:.0f} {ext[i][1]:.0f} L{inn[min(i+2,40)][0]:.0f} {inn[min(i+2,40)][1]:.0f} L{ext[min(i+4,40)][0]:.0f} {ext[min(i+4,40)][1]:.0f} ' for i in range(0, 40, 4))
    pe = lambda pts: 'M' + ' L'.join(f'{x:.0f} {y:.0f}' for x, y in pts)
    a = f'data-en="{en}" data-mas="{mas}"'
    return (f'<path class="dib {clase}" {a} d="{pe(ext)}" fill="none" stroke="{color}" stroke-width="{9*grosor}" style="--l:2600"/>'
            f'<path class="dib" {a} data-x d="{pe(inn)}" fill="none" stroke="{color}" stroke-width="{6*grosor}" style="--l:2400;animation-delay:.3s"/>'
            f'<path class="dib" {a} d="{cel}" fill="none" stroke="#ffb27a" stroke-width="{3.2*grosor}" style="--l:9000;animation-duration:2.6s;animation-delay:.6s"/>')

E = []

# 0. Portada
E.append(dict(antes=1.2, frases=[
  'Bienvenido al curso de naves parabólicas de Innova Contratistas.',
  'En esta primera clase vas a conocer qué es una nave parabólica, dónde conviene usarla y cuáles son sus partes.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 45)], html=f'''
<svg style="position:absolute;left:760px;top:120px" width="1100" height="820" viewBox="0 0 1100 820">
 {arco_reticulado(60, 1040, 760, 640, 52, en=0)}
 <rect class="ap" data-en="0" data-mas="1.4" x="20" y="752" width="120" height="22" rx="4" fill="#cfd8e0"/>
 <rect class="ap" data-en="0" data-mas="1.4" x="960" y="752" width="120" height="22" rx="4" fill="#cfd8e0"/>
</svg>
<div style="position:absolute;left:120px;top:300px;width:820px">
 <div class="paso pop" data-en="0" data-mas="0.3"><b>1</b>CLASE 1 DE 9</div>
 <h1 class="t ap" data-en="0" data-mas="0.6" style="margin-top:34px">Naves <span class="nar">Parabólicas</span></h1>
 <p class="ap" data-en="1" style="margin-top:28px;font-size:40px;font-weight:600;color:#c9d6e3;line-height:1.3">Qué es una nave parabólica<br>y dónde conviene</p>
</div>'''))

# 1. Qué es
E.append(dict(frases=[
  'Una nave parabólica es una estructura de acero que cubre grandes espacios sin columnas intermedias.',
  'Su techo tiene forma de arco: una parábola.',
  'La forman varios arcos reticulados, colocados uno detrás de otro a la misma distancia.',
  'Los arcos se unen con correas, que sostienen la cobertura de calamina o de teja metálica.',
], zoom=[(0, 1.0, 50, 50), (2, 1.08, 70, 50), (3, 1.0, 50, 50)], html=f'''
<div style="position:absolute;left:120px;top:210px;width:700px">
 <h2 class="t ap" data-en="0">¿Qué es una<br><span class="nar">nave parabólica?</span></h2>
 <div class="tarjeta ap" data-en="0" data-mas="1" style="margin-top:40px;font-size:32px;line-height:1.4">Estructura de acero que cubre <b class="nar">grandes luces</b> sin columnas intermedias.</div>
 <div class="tarjeta ap" data-en="2" style="margin-top:22px;font-size:32px;line-height:1.4">Arcos <b class="nar">reticulados</b> repetidos a la misma distancia, unidos con <b class="nar">correas</b>.</div>
</div>
<svg style="position:absolute;left:860px;top:150px" width="1000" height="780" viewBox="0 0 1000 780">
 <polyline class="dib" data-en="1" points="{parabola(80, 920, 700, 560)}" fill="none" stroke="#ffd166" stroke-width="5" stroke-dasharray="14 10" style="--l:1600"/>
 {''.join(f'<g transform="translate({k*34} {-k*30}) scale({1-k*0.07})" style="transform-origin:500px 700px" opacity="{1-k*0.15:.2f}">' + arco_reticulado(80, 920, 700, 560, 40, en=2, mas=k*0.5, grosor=1-k*0.1) + '</g>' for k in range(4, -1, -1))}
 {''.join(f'<line class="ap" data-en="3" data-mas="{i*0.15:.2f}" x1="{80+840*t:.0f}" y1="{700-4*560*t*(1-t):.0f}" x2="{80+840*t+136:.0f}" y2="{700-4*560*t*(1-t)-120:.0f}" stroke="#e8edf2" stroke-width="4"/>' for i, t in enumerate([.1, .22, .34, .5, .66, .78, .9]))}
</svg>'''))

# 2. Por qué parábola
def _y2(x): t=(x-100)/1000; return 560-4*400*t*(1-t)
E.append(dict(frases=[
  '¿Por qué una parábola?',
  'Porque con el peso repartido del techo, el arco parabólico trabaja casi solo a compresión.',
  'Se dobla muy poco, y por eso necesita menos acero que una viga recta de la misma luz.',
  'Esa es la razón por la que una nave parabólica es ligera, económica y rápida de montar.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 45), (3, 1.0, 50, 50)], html=f'''
<div style="position:absolute;left:0;right:0;top:140px;text-align:center"><h2 class="t ap" data-en="0">¿Por qué <span class="nar">parabólica</span>?</h2></div>
<svg style="position:absolute;left:360px;top:250px" width="1200" height="600" viewBox="0 0 1200 600">
 <defs><marker id="fl" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5cc8ff"/></marker>
 <marker id="fc" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ff6b6b"/></marker></defs>
 <text class="ap" data-en="1" x="600" y="40" fill="#5cc8ff" font-size="32" font-weight="800" text-anchor="middle">Peso repartido del techo</text>
 {''.join(f'<line class="ap" data-en="1" data-mas="{i*0.06:.2f}" x1="{x}" y1="{_y2(x)-110:.0f}" x2="{x}" y2="{_y2(x)-34:.0f}" stroke="#5cc8ff" stroke-width="5" marker-end="url(#fl)"/>' for i, x in enumerate(range(250, 960, 70)))}
 <polyline class="dib" data-en="0" points="{parabola(100, 1100, 560, 400)}" fill="none" stroke="#f97316" stroke-width="16" style="--l:1500"/>
 <line class="ap" data-en="1" data-mas="2" x1="330" y1="330" x2="210" y2="470" stroke="#ff6b6b" stroke-width="10" marker-end="url(#fc)" transform="translate(-40 -20)"/>
 <line class="ap" data-en="1" data-mas="2.2" x1="870" y1="330" x2="990" y2="470" stroke="#ff6b6b" stroke-width="10" marker-end="url(#fc)" transform="translate(40 -20)"/>
 <text class="ap" data-en="1" data-mas="2.4" x="600" y="380" fill="#ff8a8a" font-size="44" font-weight="900" text-anchor="middle">COMPRESIÓN</text>
 <text class="ap" data-en="2" x="600" y="450" fill="#ffd166" font-size="34" font-weight="800" text-anchor="middle">Menos flexión = menos acero</text>
</svg>
<div style="position:absolute;left:0;right:0;top:830px;display:flex;justify-content:center;gap:24px">
 <div class="paso pop" data-en="3" data-mas="0.2"><b>✓</b>LIGERA</div><div class="paso pop" data-en="3" data-mas="0.6"><b>✓</b>ECONÓMICA</div><div class="paso pop" data-en="3" data-mas="1.0"><b>✓</b>MONTAJE RÁPIDO</div>
</div>'''))

# 3. Dónde conviene
usos = [('Almacenes y depósitos', 'Mucho espacio libre para mercadería y montacargas'), ('Coliseos y losas deportivas', 'Cubren la cancha completa sin columnas'),
        ('Talleres y fábricas', 'Altura en el centro para máquinas y puente grúa liviano'), ('Mercados y ferias', 'Techo amplio, ventilado y económico'),
        ('Patios de colegios', 'Sombra y lluvia cubiertas en todo el patio'), ('Galpones agrícolas', 'Avícolas, establos y secado de granos')]
E.append(dict(frases=[
  '¿Dónde conviene una nave parabólica?',
  'En almacenes y depósitos, coliseos y losas deportivas, y talleres.',
  'También en mercados, patios de colegios y galpones agrícolas.',
  'En general, donde necesitas mucho espacio libre, sin columnas que estorben.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 40), (2, 1.05, 50, 65), (3, 1.0, 50, 50)], html='''
<div style="position:absolute;left:0;right:0;top:140px;text-align:center"><h2 class="t ap" data-en="0">¿Dónde <span class="nar">conviene</span>?</h2></div>
<div style="position:absolute;left:150px;right:150px;top:300px;display:grid;grid-template-columns:repeat(3,1fr);gap:28px">''' +
 ''.join(f'<div class="tarjeta ap" data-en="{1 if i < 3 else 2}" data-mas="{(i % 3)*0.9:.1f}" style="min-height:190px"><div class="paso" style="font-size:20px"><b>{i+1}</b>USO</div>'
         f'<div style="font-size:34px;font-weight:800;margin-top:16px">{t}</div><div style="font-size:24px;color:#c9d6e3;margin-top:8px">{d}</div></div>' for i, (t, d) in enumerate(usos)) +
 '''</div>
<div class="ap" data-en="3" style="position:absolute;left:0;right:0;top:770px;text-align:center;font-size:36px;font-weight:800;color:#ffd166">Mucho espacio libre · sin columnas intermedias</div>'''))

# 4. Comparación con dos aguas
E.append(dict(frases=[
  'Comparada con una nave a dos aguas, la parabólica cubre luces más grandes, de quince a cuarenta metros o más, sin columnas.',
  'Es más ligera y se ve moderna.',
  'Pero también tiene sus cuidados: a los costados queda menos altura libre,',
  'la cobertura debe ser curvada, y el trazo y la fabricación del arco piden más precisión.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 75, 55), (3, 1.0, 50, 50)], html=f'''
<div style="position:absolute;left:0;right:0;top:140px;text-align:center"><h2 class="t ap" data-en="0">Parabólica <span class="nar">vs.</span> dos aguas</h2></div>
<div style="position:absolute;left:140px;top:290px;width:780px" class="tarjeta ap" data-en="0" data-mas="0.5">
 <svg width="720" height="220" viewBox="0 0 720 220"><polyline points="{parabola(40, 680, 200, 170)}" fill="none" stroke="#f97316" stroke-width="10"/><line x1="20" y1="205" x2="700" y2="205" stroke="#8fa9c2" stroke-width="3"/></svg>
 <div style="font-size:36px;font-weight:900;margin:10px 0 14px">Nave parabólica</div>
 <div class="ap" data-en="0" data-mas="2" style="font-size:30px;margin:8px 0">✔ Luces de 15 a 40 m o más</div>
 <div class="ap" data-en="0" data-mas="3" style="font-size:30px;margin:8px 0">✔ Sin columnas intermedias</div>
 <div class="ap" data-en="1" style="font-size:30px;margin:8px 0">✔ Más ligera y moderna</div>
</div>
<div style="position:absolute;left:1000px;top:290px;width:780px" class="tarjeta ap" data-en="2">
 <div style="font-size:36px;font-weight:900;margin:0 0 18px;color:#ffd166">Lo que hay que cuidar</div>
 <div class="ap" data-en="2" data-mas="0.6" style="font-size:30px;margin:12px 0">⚠ Menos altura libre a los costados</div>
 <div class="ap" data-en="3" style="font-size:30px;margin:12px 0">⚠ Cobertura curvada (calamina o TR4 curva)</div>
 <div class="ap" data-en="3" data-mas="1.6" style="font-size:30px;margin:12px 0">⚠ Trazo y fabricación con precisión</div>
 <svg class="ap" data-en="2" data-mas="0.3" width="720" height="150" viewBox="0 0 720 150" style="margin-top:20px"><polyline points="{parabola(40, 680, 140, 120)}" fill="none" stroke="#f97316" stroke-width="7"/>
 <rect x="50" y="78" width="70" height="62" fill="rgba(255,93,93,.25)" stroke="#ff5d5d" stroke-dasharray="6 5"/><rect x="600" y="78" width="70" height="62" fill="rgba(255,93,93,.25)" stroke="#ff5d5d" stroke-dasharray="6 5"/></svg>
</div>'''))

# 5. Partes
X0, X1, BASE, ALTO, PER = 540, 1380, 800, 540, 44
def ext(t): return X0 + (X1 - X0) * t, BASE - 4 * ALTO * t * (1 - t)
def inn(t): return X0 + PER + (X1 - X0 - 2 * PER) * t, BASE - 4 * (ALTO - PER) * t * (1 - t)
def lab(frase, mas, x, y, texto, px, py, der):
    ancho = len(texto) * 18 + 30
    lx = x if der else x + ancho
    return (f'<g class="pop" data-en="{frase}" data-mas="{mas}"><line x1="{lx}" y1="{y}" x2="{px:.0f}" y2="{py:.0f}" stroke="#ffd166" stroke-width="3"/><circle cx="{px:.0f}" cy="{py:.0f}" r="9" fill="#ffd166"/>'
            f'<rect x="{x}" y="{y-30}" width="{ancho}" height="58" rx="12" fill="#f97316"/><text x="{x+15}" y="{y+10}" font-size="30" font-weight="800" fill="#fff">{texto}</text></g>')
bs, bi = ext(0.72), inn(0.70)
ce = ((ext(0.80)[0] + inn(0.80)[0]) / 2, (ext(0.80)[1] + inn(0.80)[1]) / 2)
co = (ext(0.3)[0] + 40, ext(0.3)[1] - 40)
E.append(dict(frases=[
  'Ahora veamos las partes de la nave.',
  'Cada arco reticulado tiene una brida superior y una brida inferior.',
  'Entre las dos bridas va la celosía, que son las diagonales que le dan rigidez.',
  'Sobre los arcos van las correas,',
  'y entre arco y arco, los arriostres con templadores, que evitan que la nave se mueva.',
  'Abajo, el arco se apoya en una placa base con pernos de anclaje,',
  'sobre un pedestal o columna de concreto.',
  'Y encima de todo, la cobertura de calamina o teja metálica curvada.',
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
 {lab(1, 0, 1500, 300, 'Brida superior', bs[0], bs[1], True)}
 {lab(1, 1.2, 1500, 400, 'Brida inferior', bi[0], bi[1], True)}
 {lab(2, 0.3, 1500, 520, 'Celosía (diagonales)', ce[0], ce[1], True)}
 {lab(3, 0.3, 90, 300, 'Correas', co[0], co[1], False)}
 {lab(4, 0.8, 90, 420, 'Arriostres y templadores', ext(.24)[0]+40, ext(.24)[1]-35, False)}
 {lab(5, 0.5, 60, 760, 'Placa base y pernos', X0-40, BASE+8, False)}
 {lab(6, 0.3, 1500, 760, 'Pedestal de concreto', X1+40, BASE+60, True)}
 {lab(7, 0.3, 90, 560, 'Cobertura (calamina / TR4)', ext(.2)[0]+60, ext(.2)[1]-10, False)}
</svg>
<div style="position:absolute;left:120px;top:150px"><h2 class="t ap" data-en="0" style="font-size:54px">Partes de la <span class="nar">nave</span></h2></div>'''))

# 6. Luz y flecha
E.append(dict(frases=[
  'Para terminar, dos medidas que vas a usar en todo el curso.',
  'La luz, que es la distancia entre apoyos, y la flecha, que es la altura del arco en el centro.',
  'En naves y coliseos, la flecha suele estar entre la sexta y la cuarta parte de la luz.',
  ('En la próxima clase aprenderás a calcular la altura de cada punto del arco con la fórmula de la parábola.', 'En la próxima clase aprenderás a calcular la altura de cada punto del arco, con la fórmula de la parábola.'),
], zoom=[(0, 1.0, 50, 50), (2, 1.08, 50, 45), (3, 1.0, 50, 50)], html=f'''
<div style="position:absolute;left:0;right:0;top:140px;text-align:center"><h2 class="t ap" data-en="0">Luz <span class="nar">y</span> flecha</h2></div>
<svg style="position:absolute;left:310px;top:230px" width="1300" height="560" viewBox="0 0 1300 560">
 <polyline class="dib" data-en="0" points="{parabola(100, 1200, 460, 330)}" fill="none" stroke="#f97316" stroke-width="14" style="--l:1500"/>
 <g class="ap" data-en="1"><line x1="100" y1="520" x2="1200" y2="520" stroke="#5cc8ff" stroke-width="4"/><line x1="100" y1="500" x2="100" y2="540" stroke="#5cc8ff" stroke-width="4"/><line x1="1200" y1="500" x2="1200" y2="540" stroke="#5cc8ff" stroke-width="4"/>
 <text x="650" y="510" font-size="40" font-weight="900" fill="#5cc8ff" text-anchor="middle">L = luz</text></g>
 <g class="ap" data-en="1" data-mas="2.6"><line x1="650" y1="460" x2="650" y2="130" stroke="#ffd166" stroke-width="4" stroke-dasharray="12 8"/><text x="672" y="310" font-size="40" font-weight="900" fill="#ffd166">f = flecha</text></g>
</svg>
<div class="tarjeta pop" data-en="2" style="position:absolute;left:600px;right:600px;top:800px;text-align:center;font-size:40px;font-weight:900;padding:14px">f / L ≈ <span class="nar">1/6</span> a <span class="nar">1/4</span></div>'''))

# 7. Cierre
E.append(dict(antes=0.4, despues=2.2, frases=[
  'Resumiendo: la nave parabólica cubre grandes luces con poco acero, porque su arco trabaja a compresión.',
  'Descarga la tabla de trazo del arco en los materiales del curso. Nos vemos en la clase dos.',
], html='''
<div style="position:absolute;left:0;right:0;top:250px;text-align:center">
 <img class="pop" data-en="0" src="data:image/png;base64,EMB" style="width:170px;height:164px;background:#fff;border-radius:34px;padding:14px">
 <h2 class="t ap" data-en="0" data-mas="0.4" style="margin-top:34px">¡Clase 1 <span class="nar">completada</span>!</h2>
 <div class="ap" data-en="1" style="margin-top:28px;font-size:36px;color:#c9d6e3;font-weight:600">Siguiente: <b style="color:#fff">Clase 2 · Geometría del arco: luz, flecha y fórmula</b></div>
 <div class="paso pop" data-en="1" data-mas="2.5" style="margin-top:40px;font-size:26px"><b>↓</b>MATERIAL: TABLA DE TRAZO DE ARCOS</div>
 <div class="ap" data-en="1" data-mas="3.5" style="margin-top:46px;font-size:26px;color:#8fa9c2;font-weight:700;letter-spacing:2px">INNOVA CONTRATISTAS · ACADEMIA TÉCNICA · WHATSAPP 966 000 500</div>
</div>'''))

if __name__ == '__main__':
    from motor import EMBLEMA
    E[-1]['html'] = E[-1]['html'].replace('EMB', EMBLEMA)
    if len(sys.argv) > 1 and sys.argv[1] == 'prueba':
        render(E, CURSO, '/home/claude/video/salida/naves_c1.mp4', cuadros={5: [10.0, 33.0]})
    else:
        render(E, CURSO, '/home/claude/video/salida/naves_c1.mp4')
