"""Utilidades del curso El Negocio del Metalero."""
from sold_comun import *

ETAPAS_N = ['Mentalidad', 'Tu hora', 'La visita', 'Cotización', 'Precio', 'Acuerdo', 'Cobranza', 'Entrega']
ETAPAS_N_AV = ['Clientes', 'Formalízate', 'Tu equipo', 'Crecer']
OBRA = 'cochera con portón y techo'
T = 'font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke"'

def obra(k, frases, meta):
    return escena_obra(k, frases, meta, ETAPAS_N, OBRA, cab='El caso: ')

def obra_av(k, frases, meta):
    return escena_obra(k, frases, meta, ETAPAS_N_AV, 'Módulo avanzado', cab='')

def svg(c):
    return f'<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">{c}</svg>'

def barras(datos, en_de, x0=360, base=720, ancho=1200, escala=0.08, etiqueta=lambda v: f'S/ {v:,.0f}'.replace(',', ' ')):
    """Barras verticales positivas/negativas. datos: [(nombre, valor, color)]."""
    n = len(datos); w = ancho / n
    s = f'<line x1="{x0}" y1="{base}" x2="{x0+ancho}" y2="{base}" stroke="#9aa6b0" stroke-width="3"/>'
    for i, (nom, v, col) in enumerate(datos):
        h = abs(v) * escala; x = x0 + i * w + w * 0.2; y = base - h if v >= 0 else base
        e = en_de(i)
        s += (f'<g class="ap" data-en="{e}"><rect x="{x:.0f}" y="{y:.0f}" width="{w*0.6:.0f}" height="{h:.0f}" fill="{col}" rx="6"/>'
              f'<text x="{x + w*0.3:.0f}" y="{(y - 14) if v >= 0 else (y + h + 36):.0f}" fill="#fff" font-size="28" {T} text-anchor="middle">{etiqueta(v)}</text>'
              f'<text x="{x + w*0.3:.0f}" y="{base + (40 if v >= 0 else -16):.0f}" fill="#c9d6e3" font-size="24" {T} text-anchor="middle">{nom}</text></g>')
    return svg(s)
