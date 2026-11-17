"""Piezas comunes de las clases (dibujos, títulos y pasos en pantallas reales de InnovApp)."""
import base64, json, pathlib
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


from motor import EMBLEMA
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

