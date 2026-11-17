"""Utilidades del curso Portones Automáticos."""
from sold_comun import *

ETAPAS_P = ['Tipos', 'Peso y motor', 'La hoja', 'Corredizo', 'Batiente', 'Electricidad', 'Seguridad', 'Entrega']
ETAPAS_P_AV = ['Levadizos', 'Control de acceso', 'Sin luz', 'Fallas']
OBRA = 'portón corredizo 3.90 × 2.40 m'
T = 'font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke"'

# Animaciones propias: se disparan con data-en como cualquier .ap/.pop
CSS_P = '''<style>
.corre{animation:corre 4.5s cubic-bezier(.45,0,.4,1) both paused}
@keyframes corre{from{transform:translateX(0)}to{transform:translateX(var(--dx,-500px))}}
.cierra{animation:cierra 4.5s cubic-bezier(.45,0,.4,1) both paused}
@keyframes cierra{from{transform:translateX(var(--dx,-500px))}to{transform:translateX(0)}}
.gira{transform-box:fill-box;animation:gira 3.5s cubic-bezier(.45,0,.4,1) both paused}
@keyframes gira{from{transform:rotate(0)}to{transform:rotate(var(--ang,-80deg))}}
.parpa{animation:parpa 1s steps(2) 6 both paused}
@keyframes parpa{0%{opacity:1}50%{opacity:.15}100%{opacity:1}}
.rayo{animation:rayo 3s ease both paused}
@keyframes rayo{0%{opacity:0}10%{opacity:1}100%{opacity:1}}
</style>'''

def obra(k, frases, meta):
    return escena_obra(k, frases, meta, ETAPAS_P, OBRA, cab='La obra: ')

def obra_av(k, frases, meta):
    return escena_obra(k, frases, meta, ETAPAS_P_AV, 'Módulo avanzado', cab='')

def svg(c):
    return f'<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">{c}</svg>'

def hoja_svg(x, y, w, h, barras=14, color='#f97316', relleno='rgba(249,115,22,.10)'):
    """Hoja de portón: marco, travesaño y barrotes."""
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{relleno}" stroke="{color}" stroke-width="9" rx="3"/>'
    s += f'<line x1="{x}" y1="{y+h*0.5}" x2="{x+w}" y2="{y+h*0.5}" stroke="{color}" stroke-width="7"/>'
    for i in range(1, barras):
        xi = x + w * i / barras
        s += f'<line x1="{xi:.0f}" y1="{y}" x2="{xi:.0f}" y2="{y+h}" stroke="{color}" stroke-width="4" opacity=".75"/>'
    return s

def corredizo(x=360, piso=820, ancho=900, alto=430, vano=820, en_abre=None, en_cierra=None, mas=0, motor=True,
              fotoceldas=False, en_foto=0, cremallera=True, etiquetas=False, en_et=0, luz=False):
    """Vista de frente: muros, vano, hoja con ruedas sobre riel, cremallera, motor, fotoceldas.
    La hoja se abre deslizándose a la izquierda (detrás del muro izquierdo)."""
    xv0 = x + 260                       # inicio del vano
    xv1 = xv0 + vano
    s = ''
    # muros
    s += f'<rect x="{x-40}" y="{piso-alto-60}" width="{xv0-x+40}" height="{alto+60}" fill="#5b4a3f" stroke="#2c2420" stroke-width="4"/>'
    s += f'<rect x="{xv1}" y="{piso-alto-60}" width="200" height="{alto+60}" fill="#5b4a3f" stroke="#2c2420" stroke-width="4"/>'
    for k in range(6):
        yy = piso - alto - 60 + k * (alto + 60) / 6
        s += f'<line x1="{x-40}" y1="{yy:.0f}" x2="{xv0}" y2="{yy:.0f}" stroke="#2c2420" stroke-width="2" opacity=".5"/>'
        s += f'<line x1="{xv1}" y1="{yy:.0f}" x2="{xv1+200}" y2="{yy:.0f}" stroke="#2c2420" stroke-width="2" opacity=".5"/>'
    # piso y riel
    s += f'<rect x="{x-80}" y="{piso}" width="{xv1+260-x}" height="40" fill="#3a4651"/>'
    s += f'<line x1="{x-60}" y1="{piso-6}" x2="{xv1+30}" y2="{piso-6}" stroke="#c9d6e3" stroke-width="8"/>'
    # hoja (se mueve)
    hx = xv0 - 30; hw = vano + 60
    anim = ''
    if en_abre is not None:
        anim = f'class="corre" data-en="{en_abre}" data-mas="{mas}" style="--dx:-{vano-40}px"'
    elif en_cierra is not None:
        anim = f'class="cierra" data-en="{en_cierra}" data-mas="{mas}" style="--dx:-{vano-40}px"'
    g = hoja_svg(hx, piso - alto, hw, alto - 26)
    for rx in (hx + 80, hx + hw - 80):
        g += f'<circle cx="{rx}" cy="{piso-16}" r="16" fill="#1d2a36" stroke="#c9d6e3" stroke-width="5"/>'
    if cremallera:
        g += f'<rect x="{hx}" y="{piso-80}" width="{hw}" height="14" fill="#e8e8e8"/>'
        for k in range(int(hw / 18)):
            g += f'<rect x="{hx + k*18 + 4}" y="{piso-88}" width="9" height="9" fill="#e8e8e8"/>'
    s += f'<g {anim}>{g}</g>'
    # motor (fijo, a la izquierda del vano, detrás de la hoja)
    if motor:
        s += f'<g><rect x="{xv0-130}" y="{piso-120}" width="110" height="114" rx="12" fill="#2b3a47" stroke="#f97316" stroke-width="5"/>'
        s += f'<text x="{xv0-75}" y="{piso-48}" fill="#fff" font-size="20" {T} text-anchor="middle">MOTOR</text>'
        s += f'<circle cx="{xv0-40}" cy="{piso-100}" r="9" fill="#ffd166"/></g>'
    if fotoceldas:
        s += (f'<g class="pop" data-en="{en_foto}"><rect x="{xv0+10}" y="{piso-110}" width="24" height="50" rx="5" fill="#ff6b6b"/>'
              f'<rect x="{xv1-34}" y="{piso-110}" width="24" height="50" rx="5" fill="#ff6b6b"/></g>'
              f'<g class="ap" data-en="{en_foto}" data-mas="0.5"><line x1="{xv0+34}" y1="{piso-85}" x2="{xv1-34}" y2="{piso-85}" stroke="#ff3b3b" stroke-width="6" stroke-dasharray="14 10"/></g>')
    if luz:
        s += (f'<rect x="{xv1+60}" y="{piso-alto-110}" width="44" height="50" rx="10" fill="#ffb020" class="parpa" data-en="{en_foto}"/>')
    if etiquetas:
        s += f'<g class="ap" data-en="{en_et}"><text x="{(xv0+xv1)/2:.0f}" y="{piso+90}" fill="#fff" font-size="30" {T} text-anchor="middle">vano</text>'
        s += f'<line x1="{xv0}" y1="{piso+55}" x2="{xv1}" y2="{piso+55}" stroke="#ffd166" stroke-width="4"/></g>'
    return svg(s)

def batiente_planta(cx=960, y=430, L=300, en=0, ang=85, brazos=True, arco=True):
    """Planta de un portón batiente de 2 hojas (cada una de largo L px) que se abren hacia adentro (arriba)."""
    s = f'<rect x="{cx-L-120}" y="{y}" width="120" height="44" fill="#5b4a3f"/><rect x="{cx+L}" y="{y}" width="120" height="44" fill="#5b4a3f"/>'
    if arco:
        s += f'<path d="M{cx} {y+22} A{L} {L} 0 0 0 {cx-L} {y+22-L}" fill="none" stroke="#9aa6b0" stroke-width="3" stroke-dasharray="10 8"/>'
        s += f'<path d="M{cx} {y+22} A{L} {L} 0 0 1 {cx+L} {y+22-L}" fill="none" stroke="#9aa6b0" stroke-width="3" stroke-dasharray="10 8"/>'
    s += f'<g class="gira" data-en="{en}" style="--ang:{-ang}deg;transform-origin:0% 50%"><rect x="{cx-L}" y="{y+14}" width="{L}" height="16" fill="#f97316" rx="4"/></g>'
    s += f'<g class="gira" data-en="{en}" style="--ang:{ang}deg;transform-origin:100% 50%"><rect x="{cx}" y="{y+14}" width="{L}" height="16" fill="#f97316" rx="4"/></g>'
    if brazos:
        for bx in (cx - L - 70, cx + L + 30):
            s += f'<rect x="{bx}" y="{y-70}" width="40" height="40" rx="8" fill="#2b3a47" stroke="#f97316" stroke-width="4"/>'
    s += f'<text x="{cx}" y="{y+150}" fill="#c9d6e3" font-size="26" {T} text-anchor="middle">calle</text>'
    return svg(s)
