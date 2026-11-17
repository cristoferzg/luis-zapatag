"""Portadas 1280×720 de las plantillas Excel."""
import base64
from playwright.sync_api import sync_playwright
EMB = base64.b64encode(open('/home/claude/luis-zapatag/contenido/academia/fuentes/emblema.png', 'rb').read()).decode()

def techo(tipo):
    s = 'stroke="#f97316" stroke-width="7" fill="none" stroke-linejoin="round" stroke-linecap="round"'
    c = 'stroke="#8fb8de" stroke-width="7"'
    base = f'<line x1="60" y1="300" x2="60" y2="190" {c}/><line x1="460" y1="300" x2="460" y2="190" {c}/><line x1="20" y1="300" x2="500" y2="300" stroke="#8fb8de" stroke-width="3"/>'
    if tipo == 'parabolica':
        arco = '<path d="M60 190 Q260 20 460 190" ' + s + '/><path d="M80 196 Q260 60 440 196" stroke="#f97316" stroke-width="4" fill="none"/>'
        celos = ''.join(f'<line x1="{80+i*36}" y1="{196-4*0.5*(1-((80+i*36-260)/180)**2)*130*0.5}" x2="{98+i*36}" y2="{190-4*0.5*(1-((98+i*36-260)/200)**2)*170*0.5}" stroke="#fdba74" stroke-width="3"/>' for i in range(10))
        return base + arco
    if tipo == 'dos':
        return base + f'<polyline points="30,205 260,80 490,205" {s}/><line x1="60" y1="190" x2="460" y2="190" stroke="#f97316" stroke-width="5"/>' + ''.join(
            f'<line x1="{60+i*50}" y1="190" x2="{60+i*50}" y2="{190-(i if i<=4 else 8-i)*27.5}" stroke="#fdba74" stroke-width="3"/>' for i in range(1, 8)) + ''.join(
            f'<line x1="{60+i*50}" y1="190" x2="{60+(i+1)*50}" y2="{190-((i+1) if i<4 else 7-i)*27.5}" stroke="#fdba74" stroke-width="3"/>' for i in range(0, 7) if i != 3)
    if tipo == 'cuatro':
        return (f'<polygon points="40,230 140,110 380,110 480,230" fill="rgba(249,115,22,.18)" {s}/><line x1="140" y1="110" x2="380" y2="110" stroke="#f97316" stroke-width="7"/>'
                f'<line x1="70" y1="225" x2="70" y2="300" {c}/><line x1="450" y1="225" x2="450" y2="300" {c}/><rect x="70" y="225" width="380" height="75" fill="rgba(143,184,222,.15)" stroke="#8fb8de" stroke-width="3"/>'
                f'<line x1="20" y1="300" x2="500" y2="300" stroke="#8fb8de" stroke-width="3"/>')
    if tipo == 'una':
        return (f'<line x1="80" y1="300" x2="80" y2="200" {c}/><line x1="440" y1="300" x2="440" y2="150" {c}/><line x1="20" y1="300" x2="500" y2="300" stroke="#8fb8de" stroke-width="3"/>'
                f'<line x1="40" y1="206" x2="480" y2="144" {s}/>' + ''.join(f'<rect x="{90+i*58}" y="{188-i*8.2}" width="16" height="12" fill="#fdba74" transform="rotate(-8 {98+i*58} {194-i*8.2})"/>' for i in range(6)))
    if tipo == 'arco':
        return base + '<path d="M60 190 Q260 60 460 190" ' + s + '/><line x1="60" y1="190" x2="460" y2="190" stroke="#fdba74" stroke-width="4" stroke-dasharray="14 8"/>'
    if tipo == 'mariposa':
        vy = lambda x: 112 + 52 * (1 - abs(x - 260) / 230)
        return (base + f'<polyline points="30,112 260,164 490,112" {s}/><line x1="60" y1="190" x2="460" y2="190" stroke="#f97316" stroke-width="5"/>'
                + ''.join(f'<line x1="{x}" y1="190" x2="{x}" y2="{vy(x):.0f}" stroke="#fdba74" stroke-width="3"/>' for x in range(60, 461, 50))
                + ''.join(f'<line x1="{x}" y1="190" x2="{x+50}" y2="{vy(x+50):.0f}" stroke="#fdba74" stroke-width="3"/>' for x in range(60, 260, 50))
                + ''.join(f'<line x1="{x}" y1="{vy(x):.0f}" x2="{x+50}" y2="190" stroke="#fdba74" stroke-width="3"/>' for x in range(260, 460, 50))
                + '<rect x="242" y="152" width="36" height="14" rx="3" fill="#38bdf8"/><text x="260" y="140" fill="#7dd3fc" font-size="18" font-weight="800" text-anchor="middle" font-family="Inter,Arial">canal</text>')
    if tipo == 'diente':
        out = '<line x1="20" y1="300" x2="500" y2="300" stroke="#8fb8de" stroke-width="3"/>'
        for k in range(3):
            x0 = 50 + k * 140
            out += (f'<line x1="{x0}" y1="300" x2="{x0}" y2="200" {c}/>'
                    f'<polygon points="{x0},200 {x0+140},130 {x0+140},200" fill="rgba(56,189,248,.10)"/>'
                    f'<line x1="{x0}" y1="200" x2="{x0+140}" y2="130" {s}/><line x1="{x0}" y1="200" x2="{x0+140}" y2="200" stroke="#f97316" stroke-width="4"/>'
                    f'<rect x="{x0+132}" y="134" width="10" height="64" fill="#7dd3fc" opacity=".85"/>'
                    + ''.join(f'<line x1="{x0+j*35}" y1="200" x2="{x0+j*35}" y2="{200-j*17.5}" stroke="#fdba74" stroke-width="3"/>' for j in (1, 2, 3)))
        return out + '<line x1="470" y1="300" x2="470" y2="200" stroke="#8fb8de" stroke-width="7"/>'
    if tipo == 'pergola':
        out = '<line x1="20" y1="300" x2="500" y2="300" stroke="#8fb8de" stroke-width="3"/>'
        out += ''.join(f'<line x1="{x}" y1="300" x2="{x}" y2="{y}" {c}/>' for x, y in ((90, 170), (230, 150), (330, 185), (450, 165)))
        out += f'<line x1="60" y1="172" x2="260" y2="146" {s}/><line x1="300" y1="188" x2="480" y2="162" {s}/>'
        out += ''.join(f'<line x1="{70+i*44}" y1="{176-i*5.5+0}" x2="{250+i*26}" y2="{188-i*3}" stroke="#fdba74" stroke-width="5"/>' for i in range(0, 0))
        out += ''.join(f'<line x1="{80+i*40}" y1="{170-i*3.3}" x2="{310+i*20}" y2="{186-i*3}" stroke="#fdba74" stroke-width="5"/>' for i in range(9))
        return out + '<polygon points="80,170 400,144 480,160 310,186" fill="rgba(125,211,252,.18)"/>'


def html(tit, sub, tipo, hojas):
    celdas = ''.join(f'<div style="display:flex;gap:6px;margin-bottom:6px">' + ''.join(
        f'<div style="flex:{w};height:20px;border-radius:4px;background:{"#fff2cc" if (j == 1 and i < 5) else ("#e8f0fa" if i % 2 else "#ffffff")}"></div>' for j, w in enumerate((3, 2, 1, 2))) + '</div>' for i in range(9))
    tabs = ''.join(f'<span style="padding:6px 12px;border-radius:8px 8px 0 0;background:{"#f97316" if k == 0 else "#1d4f7a"};font-size:15px;font-weight:700">{h}</span>' for k, h in enumerate(hojas))
    return f'''<html><body style="margin:0;width:1280px;height:720px;font-family:Inter,Arial,sans-serif;color:#fff;
background:radial-gradient(90% 120% at 75% 40%,#123d63 0%,#0b2a45 55%,#061a2c 100%);position:relative;overflow:hidden">
<div style="position:absolute;inset:0;background-image:linear-gradient(rgba(143,169,194,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(143,169,194,.07) 1px,transparent 1px);background-size:48px 48px"></div>
<div style="position:absolute;left:56px;top:44px;display:flex;align-items:center;gap:14px;font-weight:800;font-size:22px">
<img src="data:image/png;base64,{EMB}" style="width:58px;height:56px;background:#fff;border-radius:13px;padding:5px">
<div>INNOVA CONTRATISTAS<div style="color:#ffb27a;font-size:13px;letter-spacing:2.5px">RECURSOS TÉCNICOS</div></div></div>
<div style="position:absolute;left:56px;top:170px;display:inline-flex;align-items:center;gap:10px;background:#1d7a3e;padding:10px 20px;border-radius:999px;font-weight:800;font-size:24px">
<svg width="28" height="28" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4" fill="#fff"/><path d="M7 7l10 10M17 7L7 17" stroke="#1d7a3e" stroke-width="3"/></svg>PLANTILLA EXCEL</div>
<div style="position:absolute;left:56px;top:250px;width:620px;font-size:68px;font-weight:900;line-height:1.02;letter-spacing:-1.5px">{tit}</div>
<div style="position:absolute;left:58px;top:430px;width:600px;font-size:27px;line-height:1.35;color:#d6e4f0">{sub}</div>
<div style="position:absolute;left:58px;top:600px;display:flex;gap:12px;font-size:21px;font-weight:700">
<span style="background:rgba(249,115,22,.18);border:2px solid #f97316;padding:8px 16px;border-radius:12px">Fórmulas listas</span>
<span style="background:rgba(249,115,22,.18);border:2px solid #f97316;padding:8px 16px;border-radius:12px">Solo llenas medidas</span>
<span style="background:rgba(249,115,22,.18);border:2px solid #f97316;padding:8px 16px;border-radius:12px">Precio por m²</span></div>
<svg style="position:absolute;left:720px;top:60px" width="520" height="320" viewBox="0 0 520 320">{techo(tipo)}</svg>
<div style="position:absolute;left:740px;top:400px;width:480px;transform:rotate(-2deg);box-shadow:0 20px 50px rgba(0,0,0,.5)">
<div style="display:flex;gap:4px">{tabs}</div>
<div style="background:#f2f4f7;padding:14px;border-radius:0 10px 10px 10px">{celdas}</div></div>
</body></html>'''

ITEMS = [
    ('parabolica', 'Nave parabólica', 'Trazo del arco, metrado de cordones, celosía, correas y cobertura, y presupuesto con IGV.', ['Datos', 'Trazo', 'Metrado', 'Presupuesto']),
    ('dos', 'Techo a dos aguas', 'Medidas del tijeral (Pratt, Howe, Warren o Fink), metrado y presupuesto con IGV.', ['Datos', 'Tijeral', 'Metrado', 'Presupuesto']),
    ('cuatro', 'Techo a cuatro aguas', 'Limatesas, tijerales, correas por línea, metrado y presupuesto con IGV.', ['Datos', 'Tijeral', 'Correas', 'Presupuesto']),
    ('una', 'Techo a una agua', 'Cocheras, patios y terrazas: pórticos, correas, canaleta, metrado y presupuesto.', ['Datos', 'Pórtico', 'Metrado', 'Presupuesto']),
    ('mariposa', 'Techo mariposa', 'Dos faldones hacia un canal central: medidas del tijeral, metrado, canal y presupuesto con IGV.', ['Datos', 'Tijeral', 'Metrado', 'Presupuesto']),
    ('diente', 'Techo diente de sierra', 'Naves con luz natural: dientes, ventanas, canaletas, metrado y presupuesto con IGV.', ['Datos', 'Diente', 'Metrado', 'Presupuesto']),
    ('pergola', 'Pérgola metálica', 'Terrazas y jardines: columnas, vigas, listones o policarbonato, replanteo y presupuesto.', ['Datos', 'Replanteo', 'Metrado', 'Presupuesto']),
    ('arco', 'Arcotecho', 'Arco curvo de un tubo con tirante: trazo, rolado, metrado y presupuesto con IGV.', ['Datos', 'Trazo', 'Metrado', 'Presupuesto']),
]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 720})
    import sys
    for t, tit, sub, h in [x for x in ITEMS if len(sys.argv) < 2 or x[0] in sys.argv[1:]]:
        pg.set_content(html(tit, sub, t, h)); pg.wait_for_timeout(200)
        pg.screenshot(path=f'/home/claude/excel/portada-excel-{t}.jpg', type='jpeg', quality=88)
    b.close()
print('ok')
