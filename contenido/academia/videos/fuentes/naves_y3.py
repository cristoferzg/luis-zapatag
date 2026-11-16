"""Naves Parabólicas · Clase 3 ampliada (8–10 min): base + escenas nuevas de naves_ext."""
import naves_c3 as base
from naves_ext import EXT, insertar
from sold_comun import render_clase

E = insertar(base.E, EXT['naves_c3'])
CURSO = base.CURSO

if __name__ == '__main__':
    render_clase(E, CURSO, 'naves_y3')
