"""Portadas llamativas (1280x720) de los cursos de la Academia, versión 2.
Texto grande a la izquierda (título + gancho + chips) e ilustración grande con brillo a la derecha.
Zonas libres para la app: arriba a la izquierda (insignias) y franja de abajo (número de clases).
Uso: python3 contenido/academia/fuentes/portadas2.py [clave ...]
"""
import base64, math, pathlib, random, sys
from playwright.sync_api import sync_playwright
from portadas import ILUSTRACIONES, sin_piso

AQUI = pathlib.Path(__file__).parent
SALIDA = AQUI.parent / 'portadas'
EMBLEMA = base64.b64encode((AQUI / 'emblema.png').read_bytes()).decode()

def negocio():
    s = '<defs><linearGradient id="oro" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#d99a1e"/></linearGradient></defs>'
    # documento de cotización
    s += '<g transform="rotate(-6 300 330)"><rect x="150" y="120" width="300" height="400" rx="16" fill="#f8fafc"/>'
    s += '<rect x="150" y="120" width="300" height="34" rx="16" fill="#f97316"/><rect x="150" y="140" width="300" height="14" fill="#f97316"/>'
    s += '<text x="175" y="200" font-family="Inter,Arial" font-weight="900" font-size="26" fill="#0b2a45">COTIZACIÓN</text>'
    for k, w in enumerate((220, 180, 240, 160, 210, 190)):
        s += f'<rect x="175" y="{230 + 34*k}" width="{w}" height="12" rx="6" fill="#cbd5e1"/>'
    s += '<rect x="175" y="450" width="250" height="44" rx="10" fill="#0b2a45"/><text x="190" y="481" font-family="Inter,Arial" font-weight="900" font-size="24" fill="#7ee08a">TOTAL  S/ 7 150</text></g>'
    # barras que suben + flecha
    for k, h in enumerate((90, 150, 220, 310)):
        s += f'<rect x="{470 + 62*k}" y="{600 - h}" width="44" height="{h}" rx="8" fill="{["#3f9e5a", "#4fb36a", "#62c97c", "#7ee08a"][k]}"/>'
    s += '<path d="M450 470 L540 400 L610 430 L720 300" fill="none" stroke="#ffd166" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>'
    s += '<path d="M690 292 L728 292 L728 330" fill="none" stroke="#ffd166" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>'
    # monedas
    for k in range(5):
        s += f'<ellipse cx="560" cy="{630 - 22*k}" rx="70" ry="22" fill="url(#oro)" stroke="#a8730f" stroke-width="3"/>'
    s += '<text x="560" y="548" text-anchor="middle" font-family="Inter,Arial" font-weight="900" font-size="30" fill="#7a5207">S/</text>'
    return s

ILUS = dict(ILUSTRACIONES)
ILUS['negocio'] = negocio()

def portones():
    s = ''
    s += '<rect x="60" y="200" width="90" height="410" fill="#6b5446" stroke="#3a2c24" stroke-width="4"/>'
    s += '<rect x="540" y="200" width="90" height="410" fill="#6b5446" stroke="#3a2c24" stroke-width="4"/>'
    s += '<rect x="20" y="610" width="660" height="34" fill="#334155"/>'
    s += '<line x1="20" y1="604" x2="600" y2="604" stroke="#cbd5e1" stroke-width="8"/>'
    x0, y0, w, h = 30, 270, 400, 300
    s += f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" fill="rgba(249,115,22,.16)" stroke="#f97316" stroke-width="10" rx="4"/>'
    s += f'<line x1="{x0}" y1="{y0+h/2}" x2="{x0+w}" y2="{y0+h/2}" stroke="#f97316" stroke-width="8"/>'
    for k in range(1, 9):
        s += f'<line x1="{x0+w*k/9:.0f}" y1="{y0}" x2="{x0+w*k/9:.0f}" y2="{y0+h}" stroke="#f97316" stroke-width="5" opacity=".8"/>'
    s += f'<rect x="{x0}" y="{y0+h-46}" width="{w}" height="12" fill="#e5e7eb"/>'
    for rx in (x0 + 55, x0 + w - 55):
        s += f'<circle cx="{rx}" cy="{y0+h+18}" r="15" fill="#0f172a" stroke="#e5e7eb" stroke-width="5"/>'
    s += '<path d="M500 240 L410 240" stroke="#ffd166" stroke-width="12" stroke-linecap="round"/><path d="M440 215 L405 240 L440 265" fill="none" stroke="#ffd166" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>'
    s += '<rect x="440" y="526" width="90" height="78" rx="12" fill="#1e293b" stroke="#ffd166" stroke-width="5"/><circle cx="510" cy="545" r="8" fill="#7ee08a"/>'
    s += '<rect x="160" y="500" width="18" height="42" rx="5" fill="#f43f5e"/><rect x="520" y="470" width="18" height="42" rx="5" fill="#f43f5e"/>'
    s += '<circle cx="585" cy="170" r="22" fill="#ffb020"/><circle cx="585" cy="170" r="40" fill="none" stroke="#ffb020" stroke-width="5" opacity=".5"/>'
    s += '<g transform="rotate(12 680 420)"><rect x="645" y="350" width="76" height="140" rx="22" fill="#f8fafc" stroke="#0b2a45" stroke-width="5"/>'
    s += '<circle cx="683" cy="398" r="16" fill="#f97316"/><circle cx="683" cy="448" r="16" fill="#94a3b8"/></g>'
    for k, r in enumerate((30, 55, 80)):
        s += f'<path d="M{640-r*0.2:.0f} {345-r:.0f} A{r} {r} 0 0 0 {640-r:.0f} {345-r*0.2:.0f}" fill="none" stroke="#7dd3fc" stroke-width="8" stroke-linecap="round" opacity="{1-k*0.25}"/>'
    return s

ILUS['portones'] = portones()

# clave: (línea 1, línea 2 en color, gancho, chips, color de acento, color del brillo)
CURSOS = {
  'soldadura':   ('SOLDADURA', 'ESTRUCTURAL', 'Suelda como profesional: SMAW y MIG', ['Módulo avanzado', 'AWS D1.1', 'Prueba de soldador'], '#f97316', '#ffb347'),
  'naves':       ('NAVES', 'PARABÓLICAS', 'Diseña, fabrica y monta arcos que cumplen', ['Módulo avanzado', 'Luces de 25 a 40 m', 'Plantillas'], '#f97316', '#ffd166'),
  'estructuras': ('ESTRUCTURAS', 'METÁLICAS', 'Fabrica y monta estructuras seguras', ['Módulo avanzado', 'Tijerales', 'Viento y sismo'], '#38bdf8', '#7dd3fc'),
  'carpinteria': ('CARPINTERÍA', 'METÁLICA', 'Portones, rejas y escaleras que se venden', ['Módulo avanzado', 'Despiece', 'Cotización'], '#f43f5e', '#fb7185'),
  'planos':      ('LECTURA DE', 'PLANOS', 'Entiende cualquier plano metálico', ['Módulo avanzado', 'Simbología AWS', 'Tu croquis'], '#22d3ee', '#67e8f9'),
  'techos':      ('TECHOS A', '2 Y 4 AGUAS', 'Tijerales, pendientes y cuatro aguas', ['NUEVO', 'Limatesas', 'Metrado'], '#f97316', '#ffd166'),
  'negocio':     ('EL NEGOCIO', 'DEL METALERO', 'Cotiza, cobra y haz crecer tu taller', ['NUEVO', 'Precio y margen', 'Clientes'], '#22c55e', '#86efac'),
  'portones':    ('PORTONES', 'AUTOMÁTICOS', 'Automatiza portones que no fallan', ['NUEVO', 'Motor y seguridad', 'Mantenimiento'], '#38bdf8', '#7dd3fc'),
}

def rayos(color):
    rnd = random.Random(3); s = ''
    for k in range(9):
        a = -1.35 + k * 0.33 + rnd.uniform(-.05, .05)
        x2, y2 = 900 + math.cos(a) * 1400, 360 + math.sin(a) * 1400
        s += f'<polygon points="900,360 {x2:.0f},{y2:.0f} {900 + math.cos(a + .09) * 1400:.0f},{360 + math.sin(a + .09) * 1400:.0f}" fill="{color}" opacity=".05"/>'
    return s

def chispas(color):
    rnd = random.Random(11); s = ''
    for _ in range(60):
        x, y, r = rnd.uniform(560, 1280), rnd.uniform(40, 680), rnd.uniform(1, 3.2)
        s += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="{color}" opacity="{rnd.uniform(.25, .9):.2f}"/>'
    return s

def html(clave):
    l1, l2, gancho, chips, acento, brillo = CURSOS[clave]
    chips_h = ''.join(f'<span>{c}</span>' for c in chips)
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1280px;height:720px;overflow:hidden;position:relative;font-family:"Inter","Liberation Sans",Arial,sans-serif;
 background:radial-gradient(70% 90% at 72% 48%, {acento}55 0%, #0f3557 38%, #081d33 72%, #04101f 100%)}}
.fondo{{position:absolute;inset:0}}
.grid{{position:absolute;inset:0;background-image:linear-gradient(rgba(143,169,194,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(143,169,194,.07) 1px,transparent 1px);background-size:40px 40px}}
.ilus{{position:absolute;left:640px;top:50px;width:640px;height:606px;filter:drop-shadow(0 0 28px {brillo}66) drop-shadow(0 18px 30px rgba(0,0,0,.55))}}
.velo{{position:absolute;left:0;top:0;width:700px;height:720px;background:linear-gradient(90deg,rgba(4,16,31,.92) 0%,rgba(4,16,31,.75) 55%,rgba(4,16,31,0) 100%)}}
.txt{{position:absolute;left:64px;top:150px;width:640px}}
.l1{{font-size:78px;font-weight:900;line-height:.95;color:#fff;letter-spacing:-1.5px;text-shadow:0 6px 24px rgba(0,0,0,.6)}}
.l2{{font-size:78px;font-weight:900;line-height:1.0;color:{acento};letter-spacing:-1.5px;text-shadow:0 0 30px {acento}88}}
.raya{{width:120px;height:10px;border-radius:6px;background:{acento};margin:22px 0 18px;box-shadow:0 0 18px {acento}}}
.gancho{{font-size:30px;font-weight:800;color:#e2ecf6;line-height:1.2;max-width:600px}}
.chips{{margin-top:22px;display:flex;flex-wrap:wrap;gap:10px}}
.chips span{{font-size:21px;font-weight:900;color:#fff;background:rgba(255,255,255,.10);border:2px solid {acento};padding:7px 14px;border-radius:12px}}
.chips span:first-child{{background:{acento};color:#04101f}}
.marca{{position:absolute;right:30px;top:28px;width:66px;height:64px;background:#fff;border-radius:16px;padding:7px;box-shadow:0 6px 20px rgba(0,0,0,.45)}}
.barra{{position:absolute;left:0;bottom:0;width:100%;height:10px;background:linear-gradient(90deg,{acento},{brillo})}}
</style></head><body>
<svg class="fondo" viewBox="0 0 1280 720">{rayos(brillo)}</svg><div class="grid"></div>
<svg class="ilus" viewBox="0 0 760 720">{sin_piso(ILUS[clave])}</svg>
<svg class="fondo" viewBox="0 0 1280 720">{chispas(brillo)}</svg>
<div class="velo"></div>
<div class="txt"><div class="l1">{l1}</div><div class="l2">{l2}</div><div class="raya"></div>
<div class="gancho">{gancho}</div><div class="chips">{chips_h}</div></div>
<img class="marca" src="data:image/png;base64,{EMBLEMA}"><div class="barra"></div></body></html>'''

if __name__ == '__main__':
    SALIDA.mkdir(exist_ok=True)
    solo = sys.argv[1:] or list(CURSOS)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = b.new_page(viewport={'width': 1280, 'height': 720})
        for clave in solo:
            pg.set_content(html(clave)); pg.wait_for_timeout(200)
            pg.screenshot(path=str(SALIDA / f'{clave}-v2.png'))
            print('ok', clave)
        b.close()
