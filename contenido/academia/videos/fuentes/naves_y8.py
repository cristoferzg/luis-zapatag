"""Naves Parabólicas · Clase 8 ampliada (8–10 min): base + escenas nuevas de naves_ext."""
import naves_c8 as base
from naves_ext import EXT, insertar
from sold_comun import render_clase

E = insertar(base.E, EXT['naves_c8'])
CURSO = base.CURSO

if __name__ == '__main__':
    render_clase(E, CURSO, 'naves_y8')
