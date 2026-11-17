"""Techos a Dos y Cuatro Aguas · Clase 1 ampliada (≈8 min): base + escenas nuevas de techo_ext."""
import techo_c1 as base
from techo_ext import EXT, insertar
from sold_comun import render_clase

E = insertar(base.E, EXT['techo_c1'])
CURSO = base.CURSO

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_x1')
