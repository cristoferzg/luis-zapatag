"""Techos a Dos y Cuatro Aguas · Clase 12 ampliada (≈8 min): base + escenas nuevas de techo_ext."""
import techo_c12 as base
from techo_ext import EXT, insertar
from sold_comun import render_clase

E = insertar(base.E, EXT['techo_c12'])
CURSO = base.CURSO

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_x12')
