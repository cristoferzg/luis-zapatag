"""Naves Parabólicas · Clase 1 ampliada (8–10 min): base + escenas nuevas de naves_ext."""
import naves_c1v2 as base
from naves_ext import EXT, insertar
from sold_comun import render_clase

E = insertar(base.E, EXT['naves_c1v2'])
CURSO = base.CURSO

if __name__ == '__main__':
    render_clase(E, CURSO, 'naves_x1')
