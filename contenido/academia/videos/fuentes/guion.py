"""Genera el guion en PDF de una clase (frases habladas, numeradas, con pausas) para que el dueño grabe su voz."""
import sys, importlib
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors

mod = importlib.import_module(sys.argv[1]); titulo = sys.argv[2]; salida = sys.argv[3]
T = ParagraphStyle('t', fontName='Helvetica-Bold', fontSize=20, leading=25, textColor=colors.HexColor('#0b2a45'))
I = ParagraphStyle('i', fontName='Helvetica', fontSize=11.5, leading=16, textColor=colors.HexColor('#555555'))
S = ParagraphStyle('s', fontName='Helvetica-Bold', fontSize=13, leading=18, textColor=colors.HexColor('#f97316'), spaceBefore=12)
F = ParagraphStyle('f', fontName='Helvetica', fontSize=15, leading=22, leftIndent=8)
h = [Paragraph(titulo, T), Spacer(1, 6),
     Paragraph('Cómo grabar: lugar sin ruido, celular a un palmo de la boca, tono animado como si le explicaras a un ayudante. '
               'Lee en orden y <b>deja una pausa de 1 a 2 segundos después de cada frase</b> (donde dice "pausa"). Puedes decirlo con tus palabras; '
               'si te equivocas, haz una pausa y repite la frase completa. Puedes mandar un solo audio o uno por escena.', I)]
n = 0
for k, e in enumerate(mod.E):
    h.append(Paragraph(f'Escena {k+1}', S))
    for f in e['frases']:
        n += 1; hab = f[1] if isinstance(f, tuple) else f
        h.append(Paragraph(f'<b>{n}.</b> {hab} <font color="#f97316" size="11">· pausa ·</font>', F))
SimpleDocTemplate(salida, pagesize=A4, leftMargin=50, rightMargin=50, topMargin=45, bottomMargin=45, title=titulo).build(h)
print(n, 'frases')
