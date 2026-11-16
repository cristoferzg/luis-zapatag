"""Utilidades del curso Seguridad en Obra y Trabajos en Altura."""
from sold_comun import *

ETAPAS_S = ['Por qué', 'La ley', 'Planifica', 'EPP', 'Arnés', 'Espacio libre', 'Andamios', 'Caliente e izaje']
ETAPAS_S_AV = ['Techos', 'Herramientas', 'Emergencias', 'Seguridad que vende']
OBRA = 'montaje de la nave 15 × 30 m'
T = 'font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke"'


def obra(k, frases, meta):
    return escena_obra(k, frases, meta, ETAPAS_S, OBRA, cab='La obra: ')


def obra_av(k, frases, meta):
    return escena_obra(k, frases, meta, ETAPAS_S_AV, 'Módulo avanzado', cab='')


def svg(c):
    return f'<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">{c}</svg>'


def trabajador(x, y, s=1.0, casco='#ffd166', arnes=True, cls='', en=0):
    """Figura simple de un trabajador de pie (x = centro, y = pies)."""
    k = s
    a = f'class="{cls}" data-en="{en}"' if cls else ''
    g = f'<g {a}>'
    g += f'<circle cx="{x}" cy="{y-150*k}" r="{20*k}" fill="#f2c9a0"/>'
    g += f'<path d="M{x-24*k} {y-162*k} Q{x} {y-196*k} {x+24*k} {y-162*k} Z" fill="{casco}"/>'
    g += f'<rect x="{x-22*k}" y="{y-128*k}" width="{44*k}" height="{70*k}" rx="{10*k}" fill="#f97316"/>'
    g += f'<line x1="{x-12*k}" y1="{y-58*k}" x2="{x-16*k}" y2="{y}" stroke="#334155" stroke-width="{16*k}" stroke-linecap="round"/>'
    g += f'<line x1="{x+12*k}" y1="{y-58*k}" x2="{x+16*k}" y2="{y}" stroke="#334155" stroke-width="{16*k}" stroke-linecap="round"/>'
    g += f'<line x1="{x-22*k}" y1="{y-120*k}" x2="{x-36*k}" y2="{y-64*k}" stroke="#f97316" stroke-width="{12*k}" stroke-linecap="round"/>'
    g += f'<line x1="{x+22*k}" y1="{y-120*k}" x2="{x+36*k}" y2="{y-64*k}" stroke="#f97316" stroke-width="{12*k}" stroke-linecap="round"/>'
    if arnes:
        g += f'<path d="M{x-16*k} {y-126*k} L{x+14*k} {y-62*k} M{x+16*k} {y-126*k} L{x-14*k} {y-62*k}" stroke="#facc15" stroke-width="{6*k}" fill="none"/>'
        g += f'<path d="M{x-20*k} {y-62*k} Q{x} {y-40*k} {x+20*k} {y-62*k}" stroke="#facc15" stroke-width="{6*k}" fill="none"/>'
    g += '</g>'
    return g
