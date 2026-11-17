"""Piezas comunes de las plantillas Excel de techos (InnovApp)."""
import json
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.comments import Comment

NAVY, NAR, GRIS = '0B2A45', 'F97316', 'F2F4F7'
F = lambda **k: Font(name='Arial', size=k.pop('size', 10), **k)
fill = lambda c: PatternFill('solid', fgColor=c)
AMARILLO = fill('FFF2CC'); AZUL_IN = '0000FF'
fino = Side(style='thin', color='C9CED6'); BORDE = Border(left=fino, right=fino, top=fino, bottom=fino)
CAT = json.load(open(__import__('os').path.join(__import__('os').path.dirname(__file__), 'catalogo_techos.json')))

def encabezado(ws, titulo, sub, ancho=6):
    ws.sheet_view.showGridLines = False
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=ancho)
    ws['A1'] = 'INNOVA CONTRATISTAS · ACADEMIA TÉCNICA'
    ws['A1'].font = F(bold=True, color='FFFFFF', size=9); ws['A1'].fill = fill(NAVY)
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=ancho)
    ws['A2'] = titulo; ws['A2'].font = F(bold=True, size=15, color=NAVY)
    ws.merge_cells(start_row=3, start_column=1, end_row=3, end_column=ancho)
    ws['A3'] = sub; ws['A3'].font = F(italic=True, size=9, color='5B6573')
    ws.row_dimensions[2].height = 24

def seccion(ws, fila, texto, ancho=6):
    ws.merge_cells(start_row=fila, start_column=1, end_row=fila, end_column=ancho)
    c = ws.cell(fila, 1, texto); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAR)

def entrada(ws, fila, etiqueta, valor, unidad='', nota='', fmt=None):
    ws.cell(fila, 1, etiqueta).font = F()
    c = ws.cell(fila, 2, valor); c.font = F(color=AZUL_IN, bold=True); c.fill = AMARILLO; c.border = BORDE
    if fmt: c.number_format = fmt
    ws.cell(fila, 3, unidad).font = F(color='5B6573')
    if nota: ws.cell(fila, 4, nota).font = F(size=9, italic=True, color='5B6573')
    return c

def calculo(ws, fila, etiqueta, formula, unidad='', nota='', fmt='0.00'):
    ws.cell(fila, 1, etiqueta).font = F()
    c = ws.cell(fila, 2, formula); c.font = F(bold=True); c.fill = fill(GRIS); c.border = BORDE; c.number_format = fmt
    ws.cell(fila, 3, unidad).font = F(color='5B6573')
    if nota: ws.cell(fila, 4, nota).font = F(size=9, italic=True, color='5B6573')
    return c

def hoja_catalogo(wb):
    ws = wb.create_sheet('Catálogo')
    encabezado(ws, 'Catálogo de perfiles y coberturas', 'Mismo catálogo del módulo Techos Metálicos de InnovApp. Precios referenciales: cámbialos por los de tu proveedor (celdas azules).', 7)
    cab = ['Código', 'Perfil', 'Tipo', 'Peso (kg/m)', 'Largo comercial (m)', 'Precio (S/ por m)']
    for j, h in enumerate(cab, 1):
        c = ws.cell(5, j, h); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY); c.alignment = Alignment(wrap_text=True, vertical='center')
    perf = sorted(CAT['perfiles'], key=lambda p: (p['categoria'], p['codigoComercial']))
    for i, p in enumerate(perf, 6):
        fila = [p['codigoComercial'], p['nombre'], p['categoria'].replace('_', ' '), p['pesoLinealKgM'], p.get('longitudComercialM', 6), round(p['costoMetroSol'], 2)]
        for j, v in enumerate(fila, 1):
            c = ws.cell(i, j, v); c.font = F(color=AZUL_IN if j >= 4 else '000000'); c.border = BORDE
            if j == 6: c.number_format = '"S/ "#,##0.00'
    ult = 5 + len(perf)
    r0 = ult + 3
    for j, h in enumerate(['Cobertura', 'Ancho útil (m)', 'Peso (kg/m²)', 'Precio (S/ por m²)'], 1):
        c = ws.cell(r0, j, h); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY)
    for i, cb in enumerate(CAT['coberturas'], r0 + 1):
        for j, v in enumerate([cb['nombre'], cb['anchoUtilMm'] / 1000, cb.get('pesoM2Kg', 0), cb['costoM2Sol']], 1):
            c = ws.cell(i, j, v); c.font = F(color=AZUL_IN if j >= 2 else '000000'); c.border = BORDE
            if j == 4: c.number_format = '"S/ "#,##0.00'
    cult = r0 + len(CAT['coberturas'])
    for col, w in zip('ABCDEF', [22, 62, 16, 12, 14, 16]): ws.column_dimensions[col].width = w
    ws.freeze_panes = 'A6'
    rng = dict(perf=f"'Catálogo'!$A$6:$A${ult}", perf_tab=f"'Catálogo'!$A$6:$F${ult}",
               cob=f"'Catálogo'!$A${r0+1}:$A${cult}", cob_tab=f"'Catálogo'!$A${r0+1}:$D${cult}")
    return rng

def lista(ws, rango, celdas):
    dv = DataValidation(type='list', formula1='=' + rango, allow_blank=False, showDropDown=False)
    dv.error = 'Elige un valor de la lista (hoja Catálogo).'; ws.add_data_validation(dv)
    for c in celdas: dv.add(c)

def buscar(rango_tab, celda, col):
    return f'INDEX({rango_tab},MATCH({celda},INDEX({rango_tab},0,1),0),{col})'
