"""Genera las portadas (1280x720 PNG) de los cursos de la Academia Innova Contratistas.
Uso: python3 contenido/academia/fuentes/portadas.py   (requiere playwright + Chrome)
"""
import base64, pathlib
from playwright.sync_api import sync_playwright

AQUI = pathlib.Path(__file__).parent
SALIDA = AQUI.parent / 'portadas'
EMBLEMA = base64.b64encode((AQUI / 'emblema.png').read_bytes()).decode()

NAVY, NAVY2, NAR = '#0b2a45', '#123d63', '#f97316'

def chispas(cx, cy, n=46, r=260, semilla=7):
    import random
    rnd = random.Random(semilla); out = []
    for _ in range(n):
        import math
        a = rnd.uniform(-math.pi * 0.95, -math.pi * 0.05) if rnd.random() < .75 else rnd.uniform(0, math.pi * 2)
        d1 = rnd.uniform(10, 40); d2 = d1 + rnd.uniform(40, r)
        x1, y1 = cx + math.cos(a) * d1, cy + math.sin(a) * d1
        x2, y2 = cx + math.cos(a) * d2, cy + math.sin(a) * d2 + rnd.uniform(0, 60)
        w = rnd.uniform(1.2, 3.4); col = rnd.choice(['#fff7d6', '#ffd166', '#ffb347', '#ff8c1a'])
        out.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="{col}" stroke-width="{w:.1f}" stroke-linecap="round" opacity="{rnd.uniform(.55,1):.2f}"/>')
    return ''.join(out)

def naves():
    def par(x0, x1, base, alto, t):
        return x0 + (x1 - x0) * t, base - 4 * alto * t * (1 - t)
    out = ['''<defs><linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f97316" stop-opacity="0"/><stop offset="1" stop-color="#f97316" stop-opacity=".35"/></linearGradient></defs>
<defs><radialGradient id="sol"><stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset=".5" stop-color="#f97316" stop-opacity=".18"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient></defs><circle cx="380" cy="640" r="300" fill="url(#sol)"/>''']
    # arcos del fondo (perspectiva)
    for k in range(5):
        x0, x1, base, alto = 250 + k*4 - 0, 690 - k*4, 600 - k*14, 300 - k*22
        x0 = 200 + k * 30; x1 = 720 - k * 10; base = 615 - k * 12; alto = 330 - k * 30
        pts = ' '.join('%.0f,%.0f' % par(x0, x1, base, alto, t / 40) for t in range(41))
        out.append(f'<polyline points="{pts}" fill="none" stroke="#e8edf2" stroke-width="{4 - k*0.5:.1f}" opacity="{0.6 - k*0.1:.2f}"/>')
    # correas (líneas que unen los arcos)
    for t in [0.12, 0.25, 0.38, 0.5, 0.62, 0.75, 0.88]:
        a = par(60, 700, 650, 470, t); b = par(320, 680, 555, 210, t)
        out.append(f'<line x1="{a[0]:.0f}" y1="{a[1]:.0f}" x2="{b[0]:.0f}" y2="{b[1]:.0f}" stroke="#9fb3c6" stroke-width="2.5" opacity=".7"/>')
    # arco reticulado del frente
    ext = [par(60, 700, 650, 470, t / 60) for t in range(61)]
    inn = [par(105, 655, 650, 420, t / 60) for t in range(61)]
    out.append('<polyline points="%s" fill="none" stroke="#f97316" stroke-width="11"/>' % ' '.join('%.0f,%.0f' % p for p in ext))
    out.append('<polyline points="%s" fill="none" stroke="#f97316" stroke-width="8"/>' % ' '.join('%.0f,%.0f' % p for p in inn))
    for i in range(0, 60, 3):
        a, b = ext[i], inn[i + 3 if i + 3 <= 60 else 60]
        out.append(f'<line x1="{a[0]:.0f}" y1="{a[1]:.0f}" x2="{b[0]:.0f}" y2="{b[1]:.0f}" stroke="#ffb27a" stroke-width="3.5"/>')
        c = inn[i]; out.append(f'<line x1="{a[0]:.0f}" y1="{a[1]:.0f}" x2="{c[0]:.0f}" y2="{c[1]:.0f}" stroke="#ffb27a" stroke-width="3.5"/>')
    out.append('<rect x="0" y="645" width="760" height="75" fill="#0a2238"/><rect x="40" y="638" width="90" height="14" fill="#cfd8e0"/><rect x="630" y="638" width="90" height="14" fill="#cfd8e0"/>')
    return ''.join(out)

ILUSTRACIONES = {
'techos': '''
<defs><radialGradient id="solt"><stop offset="0" stop-color="#ffb347" stop-opacity=".5"/><stop offset=".5" stop-color="#f97316" stop-opacity=".15"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient></defs>
<circle cx="560" cy="250" r="300" fill="url(#solt)"/>
<line x1="309" y1="330" x2="309" y2="300" stroke="#ffd166" stroke-width="2.4" opacity="0.45"/><line x1="368" y1="330" x2="368" y2="270" stroke="#ffd166" stroke-width="2.4" opacity="0.45"/><line x1="426" y1="330" x2="426" y2="240" stroke="#ffd166" stroke-width="2.4" opacity="0.45"/><line x1="485" y1="330" x2="485" y2="210" stroke="#ffd166" stroke-width="2.4" opacity="0.45"/><line x1="544" y1="330" x2="544" y2="240" stroke="#ffd166" stroke-width="2.4" opacity="0.45"/><line x1="602" y1="330" x2="602" y2="270" stroke="#ffd166" stroke-width="2.4" opacity="0.45"/><line x1="661" y1="330" x2="661" y2="300" stroke="#ffd166" stroke-width="2.4" opacity="0.45"/><line x1="250" y1="330" x2="309" y2="330" stroke="#7ee08a" stroke-width="2.4" opacity="0.45"/><line x1="309" y1="300" x2="368" y2="330" stroke="#7ee08a" stroke-width="2.4" opacity="0.45"/><line x1="368" y1="270" x2="426" y2="330" stroke="#7ee08a" stroke-width="2.4" opacity="0.45"/><line x1="426" y1="240" x2="485" y2="330" stroke="#7ee08a" stroke-width="2.4" opacity="0.45"/><line x1="544" y1="240" x2="485" y2="330" stroke="#7ee08a" stroke-width="2.4" opacity="0.45"/><line x1="602" y1="270" x2="544" y2="330" stroke="#7ee08a" stroke-width="2.4" opacity="0.45"/><line x1="661" y1="300" x2="602" y2="330" stroke="#7ee08a" stroke-width="2.4" opacity="0.45"/><line x1="720" y1="330" x2="661" y2="330" stroke="#7ee08a" stroke-width="2.4" opacity="0.45"/><line x1="250" y1="330" x2="720" y2="330" stroke="#5ec4ff" stroke-width="4.8" opacity="0.45"/><polyline points="210,350 485.0,210 760,350" fill="none" stroke="#f97316" stroke-width="6.6" stroke-linejoin="round" opacity="0.45"/><line x1="221" y1="380" x2="221" y2="345" stroke="#ffd166" stroke-width="3.2" opacity="0.7"/><line x1="282" y1="380" x2="282" y2="310" stroke="#ffd166" stroke-width="3.2" opacity="0.7"/><line x1="344" y1="380" x2="344" y2="275" stroke="#ffd166" stroke-width="3.2" opacity="0.7"/><line x1="405" y1="380" x2="405" y2="240" stroke="#ffd166" stroke-width="3.2" opacity="0.7"/><line x1="466" y1="380" x2="466" y2="275" stroke="#ffd166" stroke-width="3.2" opacity="0.7"/><line x1="528" y1="380" x2="528" y2="310" stroke="#ffd166" stroke-width="3.2" opacity="0.7"/><line x1="589" y1="380" x2="589" y2="345" stroke="#ffd166" stroke-width="3.2" opacity="0.7"/><line x1="160" y1="380" x2="221" y2="380" stroke="#7ee08a" stroke-width="3.2" opacity="0.7"/><line x1="221" y1="345" x2="282" y2="380" stroke="#7ee08a" stroke-width="3.2" opacity="0.7"/><line x1="282" y1="310" x2="344" y2="380" stroke="#7ee08a" stroke-width="3.2" opacity="0.7"/><line x1="344" y1="275" x2="405" y2="380" stroke="#7ee08a" stroke-width="3.2" opacity="0.7"/><line x1="466" y1="275" x2="405" y2="380" stroke="#7ee08a" stroke-width="3.2" opacity="0.7"/><line x1="528" y1="310" x2="466" y2="380" stroke="#7ee08a" stroke-width="3.2" opacity="0.7"/><line x1="589" y1="345" x2="528" y2="380" stroke="#7ee08a" stroke-width="3.2" opacity="0.7"/><line x1="650" y1="380" x2="589" y2="380" stroke="#7ee08a" stroke-width="3.2" opacity="0.7"/><line x1="160" y1="380" x2="650" y2="380" stroke="#5ec4ff" stroke-width="6.4" opacity="0.7"/><polyline points="120,403 405.0,240 690,403" fill="none" stroke="#f97316" stroke-width="8.8" stroke-linejoin="round" opacity="0.7"/><line x1="140" y1="470" x2="140" y2="420" stroke="#ffd166" stroke-width="4.0" opacity="1.0"/><line x1="220" y1="470" x2="220" y2="370" stroke="#ffd166" stroke-width="4.0" opacity="1.0"/><line x1="300" y1="470" x2="300" y2="320" stroke="#ffd166" stroke-width="4.0" opacity="1.0"/><line x1="380" y1="470" x2="380" y2="270" stroke="#ffd166" stroke-width="4.0" opacity="1.0"/><line x1="460" y1="470" x2="460" y2="320" stroke="#ffd166" stroke-width="4.0" opacity="1.0"/><line x1="540" y1="470" x2="540" y2="370" stroke="#ffd166" stroke-width="4.0" opacity="1.0"/><line x1="620" y1="470" x2="620" y2="420" stroke="#ffd166" stroke-width="4.0" opacity="1.0"/><line x1="60" y1="470" x2="140" y2="470" stroke="#7ee08a" stroke-width="4.0" opacity="1.0"/><line x1="140" y1="420" x2="220" y2="470" stroke="#7ee08a" stroke-width="4.0" opacity="1.0"/><line x1="220" y1="370" x2="300" y2="470" stroke="#7ee08a" stroke-width="4.0" opacity="1.0"/><line x1="300" y1="320" x2="380" y2="470" stroke="#7ee08a" stroke-width="4.0" opacity="1.0"/><line x1="460" y1="320" x2="380" y2="470" stroke="#7ee08a" stroke-width="4.0" opacity="1.0"/><line x1="540" y1="370" x2="460" y2="470" stroke="#7ee08a" stroke-width="4.0" opacity="1.0"/><line x1="620" y1="420" x2="540" y2="470" stroke="#7ee08a" stroke-width="4.0" opacity="1.0"/><line x1="700" y1="470" x2="620" y2="470" stroke="#7ee08a" stroke-width="4.0" opacity="1.0"/><line x1="60" y1="470" x2="700" y2="470" stroke="#5ec4ff" stroke-width="8.0" opacity="1.0"/><polyline points="20,495 380.0,270 740,495" fill="none" stroke="#f97316" stroke-width="11.0" stroke-linejoin="round" opacity="1.0"/><rect x="48" y="450" width="24" height="12" fill="#c9d6e3"/><rect x="88" y="425" width="24" height="12" fill="#c9d6e3"/><rect x="128" y="400" width="24" height="12" fill="#c9d6e3"/><rect x="168" y="375" width="24" height="12" fill="#c9d6e3"/><rect x="208" y="350" width="24" height="12" fill="#c9d6e3"/><rect x="248" y="325" width="24" height="12" fill="#c9d6e3"/><rect x="288" y="300" width="24" height="12" fill="#c9d6e3"/><rect x="328" y="275" width="24" height="12" fill="#c9d6e3"/><rect x="368" y="250" width="24" height="12" fill="#c9d6e3"/><rect x="80" y="470" width="26" height="175" fill="#8d99a6"/><rect x="654" y="470" width="26" height="175" fill="#8d99a6"/><rect x="0" y="645" width="760" height="75" fill="#0a2238"/>''',
'soldadura': f'''
<defs>
 <radialGradient id="brillo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe6"/><stop offset=".18" stop-color="#ffd166"/><stop offset=".45" stop-color="#f97316" stop-opacity=".55"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient>
 <linearGradient id="placa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b7f93"/><stop offset="1" stop-color="#2c3e50"/></linearGradient>
 <linearGradient id="cordon" x1="0" x2="1"><stop offset="0" stop-color="#7a8b99"/><stop offset=".55" stop-color="#c9a227"/><stop offset=".85" stop-color="#ff9a3c"/><stop offset="1" stop-color="#fff2c4"/></linearGradient>
</defs>
<polygon points="0,560 330,470 700,560 370,690" fill="url(#placa)"/>
<polygon points="330,470 700,560 700,585 330,495" fill="#1d2b38"/>
<polygon points="40,560 690,560 690,575 40,575" fill="#3b4c5d" opacity=".0"/>
<path d="M60 572 Q 220 535 360 575 T 560 588" stroke="url(#cordon)" stroke-width="16" fill="none" stroke-linecap="round"/>
<g opacity=".55">{''.join(f'<path d="M{80+i*26} 566 q 8 -10 16 0" stroke="#d9dde2" stroke-width="2" fill="none"/>' for i in range(17))}</g>
<circle cx="565" cy="585" r="230" fill="url(#brillo)"/>
{chispas(565, 585)}
<g transform="translate(565 585) rotate(-38)">
 <rect x="-6" y="-300" width="12" height="230" rx="4" fill="#9aa5ae"/>
 <rect x="-3" y="-75" width="6" height="68" fill="#4a3a2a"/>
 <rect x="-34" y="-470" width="68" height="190" rx="18" fill="#1f2933" stroke="#f97316" stroke-width="4"/>
 <rect x="-34" y="-420" width="68" height="14" fill="#f97316"/>
</g>
''',
'naves': naves(),
'estructuras': '''
<defs><linearGradient id="viga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff9a4a"/><stop offset="1" stop-color="#d9560b"/></linearGradient></defs>
<rect x="0" y="640" width="760" height="80" fill="#0a2238"/>
''' + ''.join(f'<rect x="{x}" y="{y}" width="22" height="{640-y}" fill="url(#viga)"/><rect x="{x-8}" y="{y}" width="38" height="8" fill="#ffb27a"/><rect x="{x-8}" y="632" width="38" height="8" fill="#ffb27a"/>' for x,y in [(140,260),(330,200),(520,260)]) + ''.join(f'<rect x="{x1}" y="{y}" width="{x2-x1}" height="20" fill="url(#viga)"/>' for x1,x2,y in [(140,352,260),(330,542,260),(140,352,400),(330,542,400),(140,352,520),(330,542,520)]) + ''.join(f'<line x1="{a}" y1="{b}" x2="{c}" y2="{d}" stroke="#ffd2ad" stroke-width="5"/>' for a,b,c,d in [(162,280,330,400),(352,280,520,400),(162,420,330,520),(352,420,520,520)]) + '''
<g stroke="#e8edf2" stroke-width="5" fill="none">
 <line x1="640" y1="640" x2="640" y2="70"/><line x1="660" y1="640" x2="660" y2="70"/>
''' + ''.join(f'<line x1="640" y1="{y}" x2="660" y2="{y+40}"/>' for y in range(80,630,40)) + '''
 <line x1="250" y1="80" x2="740" y2="80"/><line x1="250" y1="100" x2="740" y2="100"/>
''' + ''.join(f'<line x1="{x}" y1="80" x2="{x+20}" y2="100"/>' for x in range(260,740,30)) + '''
 <line x1="330" y1="100" x2="330" y2="160"/>
</g>
<rect x="250" y="160" width="160" height="16" fill="#ffd166"/>
<rect x="250" y="176" width="160" height="6" fill="#f97316"/>
''',
'carpinteria': '''
<defs><linearGradient id="hierro" x1="0" x2="1"><stop offset="0" stop-color="#2b3a47"/><stop offset=".5" stop-color="#5e7183"/><stop offset="1" stop-color="#2b3a47"/></linearGradient></defs>
<rect x="0" y="640" width="760" height="80" fill="#0a2238"/>
<rect x="110" y="150" width="30" height="490" fill="#f97316"/><rect x="660" y="150" width="30" height="490" fill="#f97316"/>
<circle cx="125" cy="140" r="22" fill="#ffb27a"/><circle cx="675" cy="140" r="22" fill="#ffb27a"/>
<g fill="none" stroke="url(#hierro)" stroke-width="10">
 <rect x="110" y="220" width="265" height="410"/><rect x="385" y="220" width="265" height="410"/>
 <path d="M110 260 Q 380 120 650 260"/>
</g>
''' + ''.join(f'<line x1="{x}" y1="{230 if x<150 or x>610 else 205 - int(70*(1-((x-380)/270)**2))}" x2="{x}" y2="625" stroke="#cfd8e0" stroke-width="7"/><polygon points="{x-9},{(230 if x<150 or x>610 else 205 - int(70*(1-((x-380)/270)**2)))} {x},{(230 if x<150 or x>610 else 205 - int(70*(1-((x-380)/270)**2)))-24} {x+9},{(230 if x<150 or x>610 else 205 - int(70*(1-((x-380)/270)**2)))}" fill="#f97316"/>' for x in range(135,640,30) if abs(x-380)>8) + '''
<g fill="none" stroke="#f97316" stroke-width="6">
''' + ''.join(f'<path d="M{cx-40} 430 C {cx-40} 380, {cx+40} 380, {cx+40} 430 C {cx+40} 470, {cx} 470, {cx} 440"/><path d="M{cx-40} 430 C {cx-40} 480, {cx+40} 480, {cx+40} 430" opacity=".0"/>' for cx in [180,300,460,580]) + '''
</g>
<rect x="110" y="500" width="540" height="10" fill="#5e7183"/>
''',
'planos': '''
<defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#3d7bb3" stroke-width="1" opacity=".55"/></pattern></defs>
<g transform="rotate(-6 380 400)">
<rect x="40" y="130" width="680" height="520" rx="6" fill="#0f4c81"/>
<rect x="40" y="130" width="680" height="520" fill="url(#grid)"/>
<g stroke="#e8f1fb" stroke-width="4" fill="none">
 <polyline points="90,500 380,300 670,500 90,500"/>
''' + ''.join(f'<line x1="{x}" y1="500" x2="{x}" y2="{500 - (x-90)*200/290 if x<=380 else 500-(670-x)*200/290}"/>' for x in range(162,640,72)) + ''.join(f'<line x1="{x}" y1="500" x2="{x+72}" y2="{500-((x+72)-90)*200/290 if x+72<=380 else 500-(670-(x+72))*200/290}"/>' for x in range(90,300,72)) + ''.join(f'<line x1="{x}" y1="500" x2="{x-72}" y2="{500-(670-(x-72))*200/290}"/>' for x in range(670,460,-72)) + '''
</g>
<g stroke="#ffd166" stroke-width="2.5" fill="#ffd166" font-family="Inter,Arial" font-size="22" font-weight="700">
 <line x1="90" y1="560" x2="670" y2="560"/><line x1="90" y1="545" x2="90" y2="575"/><line x1="670" y1="545" x2="670" y2="575"/>
 <text x="335" y="590" stroke="none">12.00 m</text>
 <line x1="380" y1="300" x2="380" y2="250" /><line x1="380" y1="250" x2="470" y2="250"/>
 <polygon points="380,300 372,284 388,284" stroke="none"/>
 <polygon points="410,250 430,250 410,230" fill="none"/>
 <text x="438" y="242" stroke="none" font-size="20">E7018</text>
</g>
<rect x="520" y="590" width="180" height="46" fill="none" stroke="#e8f1fb" stroke-width="2"/>
<text x="532" y="620" fill="#e8f1fb" font-family="Inter,Arial" font-size="17" font-weight="700">LÁMINA E-01</text>
</g>
''',
}

def html(clave, titulo, subtitulo, etiqueta, puntos):
    li = ''.join(f'<li>{p}</li>' for p in puntos)
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1280px;height:720px;overflow:hidden;font-family:"Inter","Liberation Sans",Arial,sans-serif;
 background:radial-gradient(120% 120% at 85% 20%, {NAVY2} 0%, {NAVY} 55%, #061a2c 100%);color:#fff;position:relative}}
.ilus{{position:absolute;right:0;top:0;width:760px;height:720px}}
.velo{{position:absolute;left:0;top:0;width:640px;height:720px;background:linear-gradient(90deg,{NAVY} 0%,{NAVY} 70%,rgba(11,42,69,0) 100%)}}
.txt{{position:absolute;left:64px;top:56px;width:560px}}
.marca{{display:flex;align-items:center;gap:14px;font-weight:800;letter-spacing:.5px;font-size:20px}}
.marca img{{width:64px;height:62px;background:#fff;border-radius:14px;padding:6px}}
.marca small{{display:block;font-weight:600;font-size:13px;color:#ffb27a;letter-spacing:2px}}
.chip{{display:inline-block;margin-top:46px;background:{NAR};color:#fff;font-weight:800;font-size:16px;letter-spacing:2px;padding:8px 16px;border-radius:999px}}
h1{{margin-top:20px;font-size:62px;line-height:1.02;font-weight:900;letter-spacing:-1px}}
h1 span{{color:{NAR}}}
p.sub{{margin-top:18px;font-size:24px;color:#c9d6e3;font-weight:500;line-height:1.3}}
ul{{margin-top:26px;list-style:none;display:flex;flex-wrap:wrap;gap:10px}}
li{{font-size:17px;font-weight:700;color:#fff;border:2px solid rgba(249,115,22,.75);padding:7px 13px;border-radius:10px;background:rgba(249,115,22,.10)}}
.pie{{position:absolute;left:64px;bottom:40px;font-size:15px;color:#8fa9c2;font-weight:600;letter-spacing:1px}}
.barra{{position:absolute;left:0;bottom:0;width:100%;height:10px;background:linear-gradient(90deg,{NAR},#ffb347)}}
</style></head><body>
<svg class="ilus" viewBox="0 0 760 720">{ILUSTRACIONES[clave]}</svg>
<div class="velo"></div>
<div class="txt">
 <div class="marca"><img src="data:image/png;base64,{EMBLEMA}"><div>INNOVA CONTRATISTAS<small>ACADEMIA TÉCNICA</small></div></div>
 <div class="chip">{etiqueta}</div>
 <h1>{titulo}</h1>
 <p class="sub">{subtitulo}</p>
 <ul>{li}</ul>
</div>
<div class="pie">CURSO EN VIDEO · MATERIAL DESCARGABLE · CERTIFICA TU OFICIO</div>
<div class="barra"></div>
</body></html>'''

PORTADAS = [
  ('soldadura', 'Soldadura <span>Estructural</span>', 'SMAW y MIG con calidad de obra, de la seguridad a la inspección AWS D1.1', 'CURSO PREMIUM', ['E6011 · E6013 · E7018', 'Posiciones 1G–4G', 'Defectos e inspección']),
  ('naves', 'Naves <span>Parabólicas</span>', 'Diseño, fabricación y montaje de arcos reticulados paso a paso', 'CURSO ESTRELLA', ['Trazo del arco', 'Anclajes y montaje', 'Metrado y presupuesto']),
  ('estructuras', 'Estructuras <span>Metálicas</span>', 'Perfiles, conexiones, control de calidad y montaje en obra', 'CURSO PREMIUM', ['Tabla de perfiles', 'Soldadas y empernadas', 'Montaje seguro']),
  ('carpinteria', 'Carpintería <span>Metálica</span>', 'Puertas, portones, rejas y barandas: fabrica y cotiza con ganancia', 'MÁS VENDIDO', ['Medidas y holguras', 'Despiece de barras 6 m', 'Cotización']),
  ('techos', 'Techos a <span>2 y 4 Aguas</span>', 'Tijerales, pendientes, cuatro aguas y metrado de techos metálicos', 'CURSO NUEVO', ['Pendiente y cumbrera', 'Tijeral y trazo', 'Limatesas y limahoyas']),
  ('planos', 'Lectura de <span>Planos</span>', 'Interpreta planos de estructuras metálicas y pásalos a la lista de cortes', 'CURSO PREMIUM', ['Simbología AWS', 'Cortes y detalles', 'Del plano al taller']),
]

def sin_piso(svg):
    import re
    return re.sub(r'<rect x="0" y="6[0-9]{2}" width="760" height="[0-9]+" fill="#0a2238"/>', '', svg)

def html_limpio(clave):
    """Portada SIN textos: la Academia ya pone el título y el precio encima (carrusel) y debajo (tarjeta).
    Lo importante va en la franja central: el carrusel recorta arriba y abajo."""
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0}}
body{{width:1280px;height:720px;overflow:hidden;position:relative;
 background:radial-gradient(90% 120% at 75% 50%, {NAVY2} 0%, {NAVY} 55%, #061a2c 100%)}}
.grid{{position:absolute;inset:0;background-image:linear-gradient(rgba(143,169,194,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(143,169,194,.08) 1px,transparent 1px);background-size:40px 40px}}
.ilus{{position:absolute;left:470px;top:60px;width:634px;height:600px;overflow:visible}}
.piso{{position:absolute;left:0;right:0;top:600px;bottom:0;background:linear-gradient(180deg,rgba(6,26,44,.0),rgba(6,26,44,.9) 30%)}}
.marca{{position:absolute;right:34px;bottom:96px;width:70px;height:68px;background:#fff;border-radius:16px;padding:7px;box-shadow:0 6px 20px rgba(0,0,0,.35)}}
.barra{{position:absolute;left:0;bottom:0;width:100%;height:10px;background:linear-gradient(90deg,{NAR},#ffb347)}}

</style></head><body><div class="grid"></div>
<svg class="ilus" viewBox="0 0 760 720">{sin_piso(ILUSTRACIONES[clave])}</svg><div class="piso"></div>
<img class="marca" src="data:image/png;base64,{EMBLEMA}"><div class="barra"></div></body></html>'''

if __name__ == '__main__':
    SALIDA.mkdir(exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = b.new_page(viewport={'width': 1280, 'height': 720})
        import sys
        solo = sys.argv[1:]
        for clave, *resto in PORTADAS:
            if solo and clave not in solo: continue
            pg.set_content(html_limpio(clave)); pg.wait_for_timeout(150)
            pg.screenshot(path=str(SALIDA / f'{clave}.png'))
            print('ok', clave)
        b.close()
