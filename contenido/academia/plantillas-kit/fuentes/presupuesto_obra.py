"""Plantilla Excel: Presupuesto de obra por partidas + valorizaciones + cronograma de pagos."""
import sys
from comun import F, fill, NAVY, NAR, GRIS, AMARILLO, AZUL_IN, BORDE, encabezado
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.properties import PageSetupProperties

wb = Workbook(); wb.remove(wb.active)
guia = wb.create_sheet('Cómo usar'); D = wb.create_sheet('Datos'); P = wb.create_sheet('Presupuesto')
V = wb.create_sheet('Valorizaciones'); PG = wb.create_sheet('Pagos')
MON = '#,##0.00'; SOL = '"S/ "#,##0.00'

def inp(c, v, fmt=None, **k):
    c.value = v; c.font = F(color=AZUL_IN, **k); c.fill = AMARILLO; c.border = BORDE
    if fmt: c.number_format = fmt
def cab(ws, fila, textos, alto=30):
    for j, t in enumerate(textos, 1):
        c = ws.cell(fila, j, t); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY)
        c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws.row_dimensions[fila].height = alto

# ── Datos ──
encabezado(D, 'Datos del presupuesto', 'Llena las celdas amarillas. Todo lo demás se calcula en las otras hojas.', 3)
datos = [('emp', 'Empresa', 'TALLER METÁLICO EJEMPLO S.A.C.', None), ('ruc', 'RUC', '20123456789', None),
         ('cli', 'Cliente', 'Sra. Rosa Huamán', None), ('obra', 'Obra', 'Techo metálico, portón y baranda — Av. Primavera 820, Ate', None),
         ('fecha', 'Fecha del presupuesto', '=TODAY()', 'dd/mm/yyyy'), ('plazo', 'Plazo de ejecución', 30, '0 "días calendario"'),
         ('gg', 'Gastos generales', 0.08, '0%'), ('util', 'Utilidad', 0.12, '0%'), ('igv', 'IGV', 0.18, '0%'),
         ('adel', 'Adelanto que paga el cliente', 0.30, '0%')]
REF = {}
for i, (k, e, v, fm) in enumerate(datos, 5):
    D.cell(i, 1, e).font = F(); inp(D.cell(i, 2), v, fm); REF[k] = f'Datos!$B${i}'
D.cell(15, 1, 'El adelanto se descuenta (amortiza) en cada valorización, en la misma proporción.').font = F(size=9, italic=True, color='5B6573')
D.column_dimensions['A'].width = 30; D.column_dimensions['B'].width = 60

# ── Presupuesto ──
encabezado(P, 'Presupuesto de obra', 'Ítems con punto (01.01) son partidas; sin punto (01) son títulos y suman solos lo de abajo.', 7)
P['A4'] = f'=CONCATENATE("Obra: ",{REF["obra"]},"   ·   Cliente: ",{REF["cli"]})'; P['A4'].font = F(bold=True)
H = 6; cab(P, H, ['Ítem', 'Descripción', 'Und.', 'Metrado', 'P. unit. (S/)', 'Parcial (S/)', 'calc'])
partidas = [
    ('01', 'OBRAS PRELIMINARES', None, None, None),
    ('01.01', 'Trazo, nivelación y replanteo', 'glb', 1, 250),
    ('01.02', 'Movilización de equipos y herramientas', 'glb', 1, 300),
    ('02', 'ESTRUCTURA DEL TECHO METÁLICO', None, None, None),
    ('02.01', 'Columnas de tubo 4" × 4" × 3 mm con placa base y anclajes', 'und', 6, 480),
    ('02.02', 'Vigas y tijerales de tubo LAC (fabricación y montaje)', 'kg', 850, 9.5),
    ('02.03', 'Correas de tubo 100 × 50 × 2 mm', 'ml', 96, 28),
    ('02.04', 'Cobertura aluzinc TR-4 0.40 mm con fijaciones', 'm²', 72, 52),
    ('02.05', 'Canaleta y bajadas de agua', 'ml', 12, 45),
    ('03', 'CARPINTERÍA METÁLICA', None, None, None),
    ('03.01', 'Portón corredizo 3.90 × 2.40 m con plancha', 'und', 1, 3200),
    ('03.02', 'Baranda de tubo 2" con barrotes, h = 0.90 m', 'ml', 8, 220),
    ('04', 'PINTURA Y ACABADOS', None, None, None),
    ('04.01', 'Pintura anticorrosiva y esmalte (2 capas)', 'm²', 140, 18),
    ('04.02', 'Limpieza final de obra', 'glb', 1, 200),
]
R0 = H + 1; NF = 40; R1 = R0 + NF - 1
rng = lambda col: f'${col}${R0}:${col}${R1}'
for k in range(NF):
    r = R0 + k; it = partidas[k] if k < len(partidas) else (None, None, None, None, None)
    titulo = it[0] is not None and '.' not in str(it[0])
    for j, v in enumerate(it, 1):
        if j <= 5: inp(P.cell(r, j), v, bold=titulo)
    P.cell(r, 1).number_format = '@'
    P.cell(r, 7, f'=IFERROR(D{r}*E{r},0)')
    P.cell(r, 6, f'=IF(A{r}="","",IF(D{r}="",SUMPRODUCT(--(LEFT({rng("A")},LEN(A{r})+1)=A{r}&"."),{rng("G")}),G{r}))')
    P.cell(r, 6).number_format = MON; P.cell(r, 6).border = BORDE; P.cell(r, 6).font = F(bold=titulo)
    P.cell(r, 4).number_format = '#,##0.00'; P.cell(r, 5).number_format = MON
    P.cell(r, 2).alignment = Alignment(wrap_text=True, vertical='center')
    for j in (1, 3): P.cell(r, j).alignment = Alignment(horizontal='center', vertical='center')
P.column_dimensions['G'].hidden = True
T = R1 + 2
res = [('COSTO DIRECTO', f'=SUM({rng("G")})'), ('Gastos generales', f'=F{T}*{REF["gg"]}'), ('Utilidad', f'=F{T}*{REF["util"]}'),
       ('SUBTOTAL', f'=F{T}+F{T+1}+F{T+2}'), ('IGV', f'=F{T+3}*{REF["igv"]}'), ('PRESUPUESTO TOTAL', f'=F{T+3}+F{T+4}')]
for i, (e, f) in enumerate(res):
    r = T + i
    P.cell(r, 5, e).font = F(bold=i in (0, 3, 5)); P.cell(r, 5).alignment = Alignment(horizontal='right')
    c = P.cell(r, 6, f); c.number_format = SOL; c.font = F(bold=True); c.border = BORDE
    if i in (1, 2, 4): P.cell(r, 4, f'={[REF["gg"], REF["util"], None, REF["igv"]][i-1]}').number_format = '0%'
    if i == 5:
        for j in (5, 6): P.cell(r, j).fill = fill(NAR); P.cell(r, j).font = F(bold=True, color='FFFFFF', size=12)
P.cell(T + 7, 1, f'=CONCATENATE("Plazo de ejecución: ",{REF["plazo"]}," días calendario.  Precios en soles.")').font = F(size=9, italic=True)
for col, w in zip('ABCDEF', [8, 52, 7, 10, 24, 17]): P.column_dimensions[col].width = w
P.freeze_panes = f'A{R0}'
P.page_setup.paperSize = P.PAPERSIZE_A4; P.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True); P.page_setup.fitToWidth = 1; P.page_setup.fitToHeight = 0
REF['cd'] = f'Presupuesto!$F${T}'; REF['subtot'] = f'Presupuesto!$F${T+3}'; REF['total'] = f'Presupuesto!$F${T+5}'

# ── Valorizaciones ──
encabezado(V, 'Valorizaciones (cobro por avance)', 'Escribe el % de avance de cada partida en cada valorización. La hoja calcula cuánto cobrar.', 12)
cab(V, 5, ['Ítem', 'Descripción', 'Parcial (S/)', '% Val. 1', '% Val. 2', '% Val. 3', '% Val. 4', '% acumulado', 'Monto Val. 1', 'Monto Val. 2', 'Monto Val. 3', 'Monto Val. 4'], 32)
avances = {'01.01': [1], '01.02': [1], '02.01': [1], '02.02': [0.6, 0.4], '02.03': [0, 1], '02.04': [0, 0.5, 0.5], '02.05': [0, 0, 1],
           '03.01': [0, 0.5, 0.5], '03.02': [0, 0, 1], '04.01': [0, 0.3, 0.4, 0.3], '04.02': [0, 0, 0, 1]}
V0 = 6
for k in range(NF):
    r = V0 + k; pr = R0 + k
    V.cell(r, 1, f'=IF(Presupuesto!A{pr}="","",Presupuesto!A{pr})'); V.cell(r, 2, f'=IF(Presupuesto!B{pr}="","",Presupuesto!B{pr})')
    V.cell(r, 3, f'=IF(Presupuesto!D{pr}="","",Presupuesto!G{pr})'); V.cell(r, 3).number_format = MON
    it = partidas[k][0] if k < len(partidas) else None
    av = avances.get(it, [])
    for j in range(4):
        c = V.cell(r, 4 + j)
        es_partida = it is not None and '.' in str(it)
        inp(c, (av[j] if j < len(av) and av[j] else None) if es_partida else None, '0%')
    V.cell(r, 8, f'=IF(C{r}="","",SUM(D{r}:G{r}))'); V.cell(r, 8).number_format = '0%'
    for j in range(4):
        col = 'DEFG'[j]
        c = V.cell(r, 9 + j, f'=IF(C{r}="","",C{r}*{col}{r})'); c.number_format = MON
    for j in (1, 2, 3, 8, 9, 10, 11, 12): V.cell(r, j).border = BORDE
    V.cell(r, 2).alignment = Alignment(wrap_text=False)
VT = V0 + NF + 1
VC = lambda col: f'{col}{V0}:{col}{V0+NF-1}'
filas_v = [('Avance valorizado (costo directo)', [f'=SUM({VC(c)})' for c in 'IJKL']),
           ('+ Gastos generales y utilidad', [f'={c}{VT}*({REF["gg"]}+{REF["util"]})' for c in 'IJKL']),
           ('Valorización bruta', [f'={c}{VT}+{c}{VT+1}' for c in 'IJKL']),
           ('− Amortización del adelanto', [f'=-{c}{VT+2}*{REF["adel"]}' for c in 'IJKL']),
           ('Subtotal (sin IGV)', [f'={c}{VT+2}+{c}{VT+3}' for c in 'IJKL']),
           ('+ IGV', [f'={c}{VT+4}*{REF["igv"]}' for c in 'IJKL']),
           ('NETO A COBRAR', [f'={c}{VT+4}+{c}{VT+5}' for c in 'IJKL'])]
for i, (e, fs) in enumerate(filas_v):
    r = VT + i
    V.merge_cells(start_row=r, start_column=5, end_row=r, end_column=8)
    V.cell(r, 5, e).font = F(bold=i in (2, 6)); V.cell(r, 5).alignment = Alignment(horizontal='right')
    for j, f in enumerate(fs):
        c = V.cell(r, 9 + j, f); c.number_format = MON; c.border = BORDE; c.font = F(bold=i in (2, 6))
        if i == 6: c.fill = fill(NAR); c.font = F(bold=True, color='FFFFFF')
V.cell(VT + 8, 1, 'Avance físico acumulado de la obra:').font = F(bold=True)
V.cell(VT + 8, 4, f'=IFERROR(SUM(I{VT}:L{VT})/{REF["cd"]},0)'); V.cell(VT + 8, 4).number_format = '0.0%'; V.cell(VT + 8, 4).font = F(bold=True, color=NAR, size=12)
V.cell(VT + 9, 1, 'Si el % acumulado de una partida pasa de 100 %, revisa: no puedes cobrar más de lo presupuestado.').font = F(size=9, italic=True, color='5B6573')
for col, w in zip('ABCDEFGHIJKL', [8, 44, 13, 9, 9, 9, 9, 11, 13, 13, 13, 13]): V.column_dimensions[col].width = w
V.freeze_panes = 'C6'
REF['neto'] = [f'Valorizaciones!${c}${VT+6}' for c in 'IJKL']

# ── Pagos ──
encabezado(PG, 'Cronograma de pagos', 'Lo que el cliente debe pagar, cuándo y cuánto ya pagó. Marca Pagado o Pendiente.', 7)
cab(PG, 5, ['Concepto', 'Monto a cobrar (S/)', 'Fecha prevista', 'Estado', 'Monto pagado (S/)', 'Fecha de pago', 'Por cobrar (S/)'])
conceptos = [('Adelanto', f'={REF["total"]}*{REF["adel"]}'), ('Valorización 1', f'={REF["neto"][0]}'), ('Valorización 2', f'={REF["neto"][1]}'),
             ('Valorización 3', f'={REF["neto"][2]}'), ('Valorización 4 / liquidación', f'={REF["neto"][3]}')]
ejemplo = [('Pagado', 1), ('Pagado', 1), ('Pendiente', 0), ('Pendiente', 0), ('Pendiente', 0)]
dv = DataValidation(type='list', formula1='"Pagado,Pendiente,Parcial"'); PG.add_data_validation(dv)
for i, (cpt, f) in enumerate(conceptos):
    r = 6 + i
    PG.cell(r, 1, cpt).font = F(bold=True)
    PG.cell(r, 2, '=ROUND(' + f[1:] + ',2)').number_format = MON
    inp(PG.cell(r, 3), f'={REF["fecha"]}+{[0, 10, 20, 30, 35][i]}', 'dd/mm/yyyy')
    inp(PG.cell(r, 4), ejemplo[i][0]); dv.add(PG.cell(r, 4).coordinate)
    inp(PG.cell(r, 5), f'=ROUND(B{r},2)' if ejemplo[i][1] else None, MON)
    inp(PG.cell(r, 6), f'=C{r}' if ejemplo[i][1] else None, 'dd/mm/yyyy')
    PG.cell(r, 7, f'=B{r}-N(E{r})').number_format = MON
    for j in (1, 2, 7): PG.cell(r, j).border = BORDE
r = 12
PG.cell(r, 1, 'TOTAL').font = F(bold=True)
for j, col in ((2, 'B'), (5, 'E'), (7, 'G')):
    c = PG.cell(r, j, f'=SUM({col}6:{col}10)'); c.number_format = SOL; c.font = F(bold=True); c.fill = fill('FDE3CF'); c.border = BORDE
PG.cell(14, 1, 'Control:').font = F(bold=True)
PG.cell(14, 2, f'=IF(ABS(B12-{REF["total"]})<1,"✔ Los cobros suman el presupuesto total","Ojo: los cobros suman "&TEXT(B12,"#,##0.00")&" y el presupuesto es "&TEXT({REF["total"]},"#,##0.00")&". Completa los avances al 100 %.")')
PG.cell(14, 2).font = F(bold=True, color=NAR)
for col, w in zip('ABCDEFG', [30, 18, 14, 12, 18, 14, 16]): PG.column_dimensions[col].width = w

# ── Cómo usar ──
encabezado(guia, 'Plantilla Excel — Presupuesto de obra y valorizaciones', 'Presupuesta por partidas, cobra por avance y controla lo que te falta cobrar.', 3)
pasos = [('1', 'Datos', 'Tu empresa, el cliente, la obra, gastos generales, utilidad, IGV y el % de adelanto.'),
         ('2', 'Presupuesto', 'Escribe tus partidas. Un título lleva número sin punto (02) y sus partidas con punto (02.01, 02.02): el título suma solo. Pon metrado y precio unitario.'),
         ('3', 'Valorizaciones', 'Cada periodo (semana, quincena o mes) escribe el % que avanzó cada partida. La hoja calcula la valorización, descuenta el adelanto y suma el IGV.'),
         ('4', 'Pagos', 'Anota fechas y lo que el cliente pagó. Ves al instante cuánto te falta cobrar.'),
         ('5', 'Enviar', 'Exporta la hoja Presupuesto o Valorizaciones a PDF y mándala al cliente con las fotos del avance.')]
cab(guia, 5, ['Paso', 'Hoja', 'Qué haces'], 20)
for i, fila in enumerate(pasos, 6):
    for j, v in enumerate(fila, 1):
        c = guia.cell(i, j, v); c.font = F(bold=(j == 2)); c.border = BORDE; c.alignment = Alignment(wrap_text=True, vertical='top')
guia.cell(12, 1, 'Colores').font = F(bold=True, color=NAR)
c = guia.cell(13, 1, 'Ejemplo'); c.fill = AMARILLO; c.font = F(color=AZUL_IN, bold=True); guia.cell(13, 2, 'Celda para llenar')
c = guia.cell(14, 1, 'Ejemplo'); c.font = F(bold=True); guia.cell(14, 2, 'Se calcula sola: no la borres')
guia.cell(16, 1, 'Viene con el ejemplo de una obra (techo metálico, portón y baranda): escribe encima con tu obra.').font = F(size=9)
guia.cell(17, 1, 'Precios referenciales. Para contratos con el Estado aplican reglas propias (consulta las bases del proceso).').font = F(size=9, italic=True, color='5B6573')
for col, w in zip('ABC', [10, 18, 100]): guia.column_dimensions[col].width = w
guia.sheet_view.showGridLines = False
for _ws in wb.worksheets:
    if not _ws.sheet_properties.pageSetUpPr or not _ws.sheet_properties.pageSetUpPr.fitToPage:
        _ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True); _ws.page_setup.fitToWidth = 1; _ws.page_setup.fitToHeight = 0
    _ws.page_setup.paperSize = _ws.PAPERSIZE_A4
    if _ws.title in ('Valorizaciones', 'Pagos'): _ws.page_setup.orientation = 'landscape'
wb.save(sys.argv[1] if len(sys.argv) > 1 else 'Plantilla_Presupuesto_de_Obra_y_Valorizaciones_InnovApp.xlsx')
