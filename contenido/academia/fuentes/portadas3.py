"""Portadas v3 (1280x720) de los cursos: estructura en 3D real + título grande + datos del curso.
Las vistas 3D salen de plantillas-kit/fuentes/render_cursos.py (PNG con fondo transparente).
Zonas libres para la app: arriba a la izquierda (insignias) y franja de abajo (número de clases).
Uso: python3 contenido/academia/fuentes/portadas3.py <carpeta_3d> [clave ...]
"""
import base64, pathlib, random, sys
from playwright.sync_api import sync_playwright
from PIL import Image

AQUI = pathlib.Path(__file__).parent
SALIDA = AQUI.parent / 'portadas'
EMBLEMA = base64.b64encode((AQUI / 'emblema.png').read_bytes()).decode()

# clave: (línea 1, línea 2, gancho, duración, acceso, obra real, acento, brillo)
CURSOS = {
  'soldadura':   ('SOLDADURA', 'ESTRUCTURAL', 'Suelda nudos que pasan inspección: SMAW y MIG', '≈50 min', 'Clase 1 gratis', 'Obra real: Almacén de 15 × 30 m', '#f97316', '#ffb347'),
  'naves':       ('NAVES', 'PARABÓLICAS', 'Diseña, fabrica y monta arcos que cumplen', '≈1 h 35 min', 'Clase 1 gratis', 'Obra real: Nave de 15 × 30 m', '#f97316', '#ffd166'),
  'estructuras': ('ESTRUCTURAS', 'METÁLICAS', 'Fabrica y monta estructuras seguras', '≈42 min', 'Clase 1 gratis', 'Obra real: Mezanine de 4 × 6 m', '#38bdf8', '#7dd3fc'),
  'carpinteria': ('CARPINTERÍA', 'METÁLICA', 'Puertas, rejas y escaleras que se venden', '≈36 min', 'Clase 1 gratis', 'Obra real: Casa de 2 pisos', '#f43f5e', '#fb7185'),
  'planos':      ('LECTURA DE', 'PLANOS', 'Del plano a la obra sin dudas', '≈28 min', 'Clase 1 gratis', 'Obra real: Planos del mezanine', '#22d3ee', '#67e8f9'),
  'techos':      ('TECHOS A', '2 Y 4 AGUAS', 'Tijerales, pendientes y limatesas', '≈1 h 22 min', 'Clase 1 gratis', 'Obra real: Taller 10 × 16 y casa 8 × 12 m', '#f97316', '#ffd166'),
  'negocio':     ('EL NEGOCIO', 'DEL METALERO', 'Cotiza, cobra y haz crecer tu taller', '≈40 min', 'Clase 1 gratis', 'Obra real: Cochera con portón y techo', '#22c55e', '#86efac'),
  'portones':    ('PORTONES', 'AUTOMÁTICOS', 'Automatiza portones que no fallan', '≈39 min', 'Clase 1 gratis', 'Obra real: Portón de 3.90 × 2.40 m', '#38bdf8', '#7dd3fc'),
  'seguridad':   ('SEGURIDAD', 'EN OBRA Y ALTURA', 'Trabaja arriba y vuelve a casa', '≈35 min', 'Clase 1 gratis', 'Obra real: Montaje de nave 15 × 30 m', '#facc15', '#fde68a'),
  'usabilidad':  ('USA', 'INNOVAPP', 'Cotiza, diseña y organiza tu taller desde el celular o la PC', 'Tutoriales cortos', 'Gratis', 'Aprende con ejemplos reales', '#a78bfa', '#c4b5fd'),
  'revit':       ('REVIT', 'BÁSICO A PRO', 'Modela, documenta y saca planos en BIM', 'De cero a profesional', 'Clase 1 gratis', 'Proyecto: casa de 2 pisos', '#60a5fa', '#93c5fd'),
}
ICONO_RELOJ = '<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>'
ICONO_OBRA = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 20h18M5 20V9l7-5 7 5v11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M10 20v-6h4v6" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>'
ICONO_PLAY = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>'

def recorte(png):
    """Recorta el PNG 3D a lo que tiene contenido y lo devuelve en base64."""
    im = Image.open(png).convert('RGBA'); bb = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    im = im.crop(bb); p = pathlib.Path('/tmp') / ('rec_' + pathlib.Path(png).name); im.save(p)
    return base64.b64encode(p.read_bytes()).decode(), im.size

def chispas(color, zona=(600, 40, 1280, 680), n=50, semilla=11):
    rnd = random.Random(semilla); s = ''
    for _ in range(n):
        x, y, r = rnd.uniform(zona[0], zona[2]), rnd.uniform(zona[1], zona[3]), rnd.uniform(1, 3)
        s += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="{color}" opacity="{rnd.uniform(.2, .8):.2f}"/>'
    return s

def extra(clave):
    """Detalles encima del 3D según el curso."""
    if clave == 'soldadura':
        rnd = random.Random(5); s = '<svg class="fondo" viewBox="0 0 1280 720">'
        for cx, cy in ((905, 300), (1010, 470)):
            s += f'<circle cx="{cx}" cy="{cy}" r="46" fill="#fff4d6" opacity=".9" filter="url(#bl)"/>'
            for _ in range(26):
                import math
                a = rnd.uniform(0, 6.28); L = rnd.uniform(30, 120)
                s += f'<line x1="{cx}" y1="{cy}" x2="{cx + math.cos(a) * L:.0f}" y2="{cy + math.sin(a) * L:.0f}" stroke="#ffd166" stroke-width="{rnd.uniform(1.5, 3.5):.1f}" opacity=".85" stroke-linecap="round"/>'
        return s + '<defs><filter id="bl"><feGaussianBlur stdDeviation="12"/></filter></defs></svg>'
    if clave == 'planos':
        lineas = ''.join(f'<line x1="{30 + 30 * k}" y1="18" x2="{30 + 30 * k}" y2="232" stroke="#ffffff22"/>' for k in range(11))
        return ('<div style="position:absolute;left:600px;top:420px;width:340px;height:250px;transform:rotate(-5deg);background:#1d4ed8;border:3px solid #93c5fd;border-radius:8px;box-shadow:0 20px 40px rgba(0,0,0,.5)">'
                f'<svg width="340" height="250">{lineas}<polyline points="40,190 170,80 300,190" fill="none" stroke="#fff" stroke-width="3"/><line x1="40" y1="190" x2="300" y2="190" stroke="#fff" stroke-width="3"/>'
                '<line x1="40" y1="215" x2="300" y2="215" stroke="#fde68a" stroke-width="2"/><text x="150" y="235" fill="#fde68a" font-family="Arial" font-size="15" font-weight="700">6.00 m</text>'
                '<text x="180" y="70" fill="#fde68a" font-family="Arial" font-size="15" font-weight="700">E7018 ⊿</text><rect x="230" y="20" width="96" height="30" fill="none" stroke="#fff"/><text x="238" y="40" fill="#fff" font-family="Arial" font-size="13">LÁMINA E-01</text></svg></div>')
    if clave == 'negocio':
        filas = ''.join(f'<div style="height:10px;width:{w}px;border-radius:5px;background:#cbd5e1;margin:9px 0"></div>' for w in (200, 160, 220, 140))
        return ('<div style="position:absolute;left:610px;top:380px;width:270px;padding:16px 18px;transform:rotate(-6deg);background:#f8fafc;border-radius:14px;box-shadow:0 22px 45px rgba(0,0,0,.55);border-top:22px solid #22c55e">'
                f'<div style="font-weight:900;font-size:22px;color:#0b2a45">COTIZACIÓN</div>{filas}'
                '<div style="margin-top:10px;background:#0b2a45;color:#86efac;font-weight:900;font-size:22px;padding:8px 12px;border-radius:9px">TOTAL S/ 7 150</div></div>')
    if clave == 'seguridad':
        return ('<div style="position:absolute;left:640px;top:440px;width:150px;height:170px;filter:drop-shadow(0 16px 30px rgba(0,0,0,.6))">'
                '<svg viewBox="0 0 100 115" width="150" height="170"><path d="M50 4 L92 20 V55 C92 82 72 102 50 111 C28 102 8 82 8 55 V20 Z" fill="#16a34a" stroke="#fff" stroke-width="4"/>'
                '<path d="M30 57 L45 72 L72 42" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
                '<div style="position:absolute;left:800px;top:560px;background:#facc15;color:#04101f;font-weight:900;font-size:24px;padding:8px 14px;border-radius:12px;box-shadow:0 10px 24px rgba(0,0,0,.5)">Arnés desde 1.80 m</div>')
    if clave == 'portones':
        return ('<div style="position:absolute;left:1120px;top:470px;width:90px;height:150px;transform:rotate(10deg);background:#f8fafc;border-radius:26px;border:4px solid #0b2a45;box-shadow:0 18px 36px rgba(0,0,0,.55)">'
                '<div style="width:34px;height:34px;border-radius:50%;background:#f97316;margin:26px auto 14px"></div><div style="width:34px;height:34px;border-radius:50%;background:#94a3b8;margin:0 auto"></div></div>')
    return ''

def visual(clave, b64, tam):
    w, h = tam
    if clave == 'usabilidad':
        return ('<div style="position:absolute;left:620px;top:120px;width:560px;height:350px;background:#0f172a;border-radius:22px 22px 6px 6px;border:12px solid #1e293b;box-shadow:0 30px 60px rgba(0,0,0,.6);overflow:hidden">'
                '<div style="height:34px;background:#0b2a45;display:flex;align-items:center;gap:8px;padding:0 12px;color:#fff;font-weight:800;font-size:15px">'
                f'<img src="data:image/png;base64,{EMBLEMA}" style="width:22px;height:22px;background:#fff;border-radius:5px;padding:2px">InnovApp · Techos Metálicos</div>'
                '<div style="position:absolute;left:0;top:34px;width:150px;bottom:0;background:#0b2a45cc"></div>'
                f'<img src="data:image/png;base64,{b64}" style="position:absolute;left:160px;top:50px;width:370px;height:260px;object-fit:contain"></div>'
                '<div style="position:absolute;left:560px;top:470px;width:680px;height:26px;background:linear-gradient(#cbd5e1,#64748b);border-radius:0 0 26px 26px;box-shadow:0 20px 40px rgba(0,0,0,.5)"></div>'
                '<div style="position:absolute;left:1080px;top:300px;width:150px;height:300px;background:#0f172a;border:8px solid #1e293b;border-radius:28px;box-shadow:0 26px 50px rgba(0,0,0,.6);overflow:hidden;text-align:center;color:#fff">'
                f'<img src="data:image/png;base64,{EMBLEMA}" style="width:58px;height:56px;background:#fff;border-radius:14px;padding:5px;margin-top:46px">'
                '<div style="font-weight:900;font-size:18px;margin-top:10px">InnovApp</div><div style="display:flex;gap:6px;justify-content:center;margin-top:18px">'
                + ''.join('<div style="width:20px;height:26px;border-radius:5px;background:#334155"></div>' for _ in range(4)) + '</div></div>')
    caja_w, caja_h = 610, 580
    esc = min(caja_w / w, caja_h / h); ww, hh = w * esc, h * esc
    return f'<img class="d3" src="data:image/png;base64,{b64}" style="left:{650 + (caja_w - ww) / 2:.0f}px;top:{75 + (caja_h - hh) / 2:.0f}px;width:{ww:.0f}px;height:{hh:.0f}px">'

def html(clave, b64, tam):
    l1, l2, gancho, dur, acceso, obra, acento, brillo = CURSOS[clave]
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1280px;height:720px;overflow:hidden;position:relative;font-family:"Inter","Liberation Sans",Arial,sans-serif;
 background:radial-gradient(60% 80% at 74% 52%, {acento}66 0%, #0f3557 40%, #081d33 72%, #04101f 100%)}}
.fondo{{position:absolute;inset:0}}
.grid{{position:absolute;inset:0;background-image:linear-gradient(rgba(143,169,194,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(143,169,194,.07) 1px,transparent 1px);background-size:40px 40px}}
.piso{{position:absolute;left:560px;top:520px;width:720px;height:200px;background:radial-gradient(50% 50% at 50% 50%,{brillo}33,transparent 70%)}}
.d3{{position:absolute;filter:drop-shadow(0 0 22px {brillo}55) drop-shadow(0 22px 30px rgba(0,0,0,.55))}}
.velo{{position:absolute;left:0;top:0;width:660px;height:720px;background:linear-gradient(90deg,rgba(4,16,31,.94) 0%,rgba(4,16,31,.8) 60%,rgba(4,16,31,0) 100%)}}
.txt{{position:absolute;left:64px;top:140px;width:600px}}
.l1{{font-size:80px;font-weight:900;line-height:.95;color:#fff;letter-spacing:-1.5px;text-shadow:0 6px 24px rgba(0,0,0,.6)}}
.l2{{font-size:80px;font-weight:900;line-height:1.0;color:{acento};letter-spacing:-1.5px;text-shadow:0 0 30px {acento}88}}
.raya{{width:120px;height:10px;border-radius:6px;background:{acento};margin:20px 0 16px;box-shadow:0 0 18px {acento}}}
.gancho{{font-size:29px;font-weight:800;color:#e2ecf6;line-height:1.2;max-width:560px}}
.datos{{margin-top:22px;display:flex;flex-wrap:wrap;gap:10px}}
.datos span{{display:inline-flex;align-items:center;gap:8px;font-size:22px;font-weight:900;color:#fff;background:rgba(255,255,255,.10);border:2px solid {acento}aa;padding:7px 14px;border-radius:12px}}
.datos span.g{{background:{acento};color:#04101f;border-color:{acento}}}
.obra{{margin-top:14px;display:inline-flex;align-items:center;gap:10px;font-size:22px;font-weight:800;color:{brillo}}}
.marca{{position:absolute;right:30px;top:28px;width:66px;height:64px;background:#fff;border-radius:16px;padding:7px;box-shadow:0 6px 20px rgba(0,0,0,.45)}}
.barra{{position:absolute;left:0;bottom:0;width:100%;height:10px;background:linear-gradient(90deg,{acento},{brillo})}}
</style></head><body>
<div class="grid"></div><div class="piso"></div>
<svg class="fondo" viewBox="0 0 1280 720">{chispas(brillo)}</svg>
{visual(clave, b64, tam)}{extra(clave)}
<div class="velo"></div>
<div class="txt"><div class="l1">{l1}</div><div class="l2">{l2}</div><div class="raya"></div>
<div class="gancho">{gancho}</div>
<div class="datos"><span class="g">{ICONO_PLAY}{acceso}</span><span>{ICONO_RELOJ}{dur}</span></div>
<div class="obra">{ICONO_OBRA}{obra}</div></div>
<img class="marca" src="data:image/png;base64,{EMBLEMA}"><div class="barra"></div></body></html>'''

if __name__ == '__main__':
    carpeta = pathlib.Path(sys.argv[1]); solo = sys.argv[2:] or list(CURSOS)
    SALIDA.mkdir(exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = b.new_page(viewport={'width': 1280, 'height': 720})
        for clave in solo:
            b64, tam = recorte(carpeta / f'{clave}.png')
            pg.set_content(html(clave, b64, tam)); pg.wait_for_timeout(250)
            pg.screenshot(path=str(SALIDA / f'{clave}-v3.jpg'), type='jpeg', quality=90)
            print('ok', clave)
        b.close()
