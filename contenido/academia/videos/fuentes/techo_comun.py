"""Utilidades del curso Techos Metálicos a Dos y Cuatro Aguas."""
from sold_comun import *

ETAPAS_T = ['Tipos', 'Pendiente', 'El tijeral', 'Trazo', 'Apoyos', 'Aleros', 'Cuatro aguas', 'Metrado']
ETAPAS_T_AV = ['Coberturas', 'Cortes y remates', 'Limahoyas', 'Aislamiento']
OBRA = 'taller 10 × 16 m y casa 8 × 12 m'
COL = {'sup': '#f97316', 'inf': '#5ec4ff', 'mon': '#ffd166', 'dia': '#7ee08a', 'gris': '#9aa6b0'}

def obra(k, frases, meta):
    return escena_obra(k, frases, meta, ETAPAS_T, OBRA, cab='Las obras: ')

def obra_av(k, frases, meta):
    return escena_obra(k, frases, meta, ETAPAS_T_AV, 'Módulo avanzado', cab='')

def tijeral(x0, x1, base, alto, tipo='howe', en=0, mas=0, n=6, alero=0, grosor=1.0, solo=None):
    """Tijeral a dos aguas en SVG (coordenadas de pantalla). tipo: howe, pratt, fink, warren, escalera.
    alero: px que el cordón superior sale más allá del apoyo. solo: dibuja solo ese grupo (sup, inf, alma)."""
    L = x1 - x0; xm = (x0 + x1) / 2
    def yt(x):
        return base - alto * (1 - abs(2 * (x - x0) / L - 1))
    g = lambda w: f'{w * grosor:.1f}'
    s = f'<g class="ap" data-en="{en}" data-mas="{mas}">'
    sup = (f'<line x1="{x0 - alero:.0f}" y1="{yt(x0) + alto * 2 * alero / L:.0f}" x2="{xm:.0f}" y2="{base - alto:.0f}" stroke="{COL["sup"]}" stroke-width="{g(10)}" stroke-linecap="round"/>'
           f'<line x1="{xm:.0f}" y1="{base - alto:.0f}" x2="{x1 + alero:.0f}" y2="{yt(x1) + alto * 2 * alero / L:.0f}" stroke="{COL["sup"]}" stroke-width="{g(10)}" stroke-linecap="round"/>')
    inf = f'<line x1="{x0:.0f}" y1="{base:.0f}" x2="{x1:.0f}" y2="{base:.0f}" stroke="{COL["inf"]}" stroke-width="{g(10)}" stroke-linecap="round"/>'
    alma = ''
    ln = lambda a, b, c, d, col, w=6: f'<line x1="{a:.0f}" y1="{b:.0f}" x2="{c:.0f}" y2="{d:.0f}" stroke="{col}" stroke-width="{g(w)}"/>'
    if tipo == 'fink':
        b1, b2 = x0 + L / 3, x0 + 2 * L / 3
        t1, t2 = x0 + L / 4, x0 + 3 * L / 4
        alma += ln(b1, base, t1, yt(t1), COL['dia']) + ln(b1, base, xm, base - alto, COL['dia'])
        alma += ln(b2, base, xm, base - alto, COL['dia']) + ln(b2, base, t2, yt(t2), COL['dia'])
    else:
        xs = [x0 + L * i / n for i in range(n + 1)]
        for i in range(1, n):
            if tipo in ('howe', 'pratt', 'escalera'):
                alma += ln(xs[i], base, xs[i], yt(xs[i]), COL['mon'])
        for i in range(n):
            a, b = xs[i], xs[i + 1]
            izq = b <= xm + 1
            if tipo == 'howe':      # diagonales suben hacia el centro
                alma += ln(a, base, b, yt(b), COL['dia']) if izq else ln(b, base, a, yt(a), COL['dia'])
            elif tipo == 'pratt':   # diagonales bajan hacia el centro
                alma += ln(a, yt(a), b, base, COL['dia']) if izq else ln(b, yt(b), a, base, COL['dia'])
            elif tipo == 'warren':
                alma += ln(a, base if i % 2 == 0 else yt(a), b, yt(b) if i % 2 == 0 else base, COL['dia'])
    if solo == 'sup': return s + sup + '</g>'
    if solo == 'inf': return s + inf + '</g>'
    if solo == 'alma': return s + alma + '</g>'
    return s + alma + inf + sup + '</g>'

def svg(contenido):
    return f'<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">{contenido}</svg>'

def planta_4aguas(x, y, w, h, en=0, mas=0, color='#f97316', etiquetas=False, en_et=None):
    """Planta de techo a cuatro aguas: rectángulo, cumbrera al centro y 4 limatesas a 45°."""
    m = min(w, h) / 2
    if w >= h:
        c1, c2 = (x + m, y + m), (x + w - m, y + m)
    else:
        c1, c2 = (x + m, y + m), (x + m, y + h - m)
    s = f'<g class="ap" data-en="{en}" data-mas="{mas}"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="rgba(249,115,22,.10)" stroke="#e8edf2" stroke-width="5"/>'
    s += f'<line x1="{c1[0]}" y1="{c1[1]}" x2="{c2[0]}" y2="{c2[1]}" stroke="#ffd166" stroke-width="8"/>'
    for (a, b) in [((x, y), c1), ((x, y + h), c1), ((x + w, y), c2), ((x + w, y + h), c2)]:
        s += f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="{color}" stroke-width="7"/>'
    s += '</g>'
    if etiquetas:
        e = en if en_et is None else en_et
        s += (f'<text class="ap" data-en="{e}" x="{(c1[0]+c2[0])/2}" y="{c1[1]-16}" fill="#ffd166" font-size="28" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">cumbrera</text>'
              f'<text class="ap" data-en="{e}" x="{x + m/2 + 30}" y="{y + m/2 + 8}" fill="#f97316" font-size="28" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke">limatesa</text>')
    return s

def casa_2aguas(x0, x1, piso, alto_muro, alto_techo, en=0, mas=0, alero=50, color='#f97316'):
    """Fachada simple de casa/taller con techo a dos aguas."""
    xm = (x0 + x1) / 2; t = piso - alto_muro
    pend = alto_techo / ((x1 - x0) / 2)
    return (f'<g class="ap" data-en="{en}" data-mas="{mas}"><rect x="{x0}" y="{t}" width="{x1-x0}" height="{alto_muro}" fill="rgba(255,255,255,.06)" stroke="#9aa6b0" stroke-width="5"/>'
            f'<polygon points="{x0-alero},{t+alero*pend:.0f} {xm},{t-alto_techo} {x1+alero},{t+alero*pend:.0f}" fill="rgba(249,115,22,.18)" stroke="{color}" stroke-width="9" stroke-linejoin="round"/></g>')
