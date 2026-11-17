"""Plantilla Excel: Cotización profesional (A4) con lista de precios."""
import sys
from comun import F, fill, NAVY, NAR, GRIS, AMARILLO, AZUL_IN, BORDE, encabezado
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.properties import PageSetupProperties

wb = Workbook(); C = wb.active; C.title = 'Cotización'
G = wb.create_sheet('Mis precios', 0); guia = wb.create_sheet('Cómo usar', 0)
wb.move_sheet('Cotización', -1)  # orden: Cómo usar · Cotización · Mis precios
wb.active = 1

blanco = Side(style='thin', color='FFFFFF'); fino = Side(style='thin', color='C9CED6'); grueso = Side(style='medium', color=NAVY)
def inp(c, v, **k):
    # En la hoja que ve el cliente las celdas para llenar van limpias (sin color), para que imprima bonito.
    c.value = v; c.font = F(color='1F2937', **k)
def m(rng): C.merge_cells(rng)
ali = lambda **k: Alignment(vertical='center', **k)

# ── Mis precios ──
encabezado(G, 'Mis precios', 'Tu lista de trabajos y materiales con su unidad y precio. En la cotización, al elegir una descripción, la unidad y el precio se llenan solos.', 4)
for j, h in enumerate(['Descripción', 'Unidad', 'Precio (S/)', 'Nota'], 1):
    c = G.cell(5, j, h); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY)
precios = [
    ('Portón corredizo de fierro 3.90 × 2.40 m con plancha', 'und', 3200, 'Incluye riel, ruedas y pintura'),
    ('Automatización de portón corredizo (motor 600 kg)', 'und', 2400, 'Motor, cremallera, 2 controles, fotoceldas'),
    ('Puerta metálica de una hoja 1.00 × 2.20 m', 'und', 1350, 'Con chapa y pintura'),
    ('Reja de ventana de fierro liso 1/2"', 'm²', 180, ''),
    ('Baranda de tubo 2" con barrotes', 'ml', 220, 'Altura 0.90 m'),
    ('Escalera metálica recta con peldaños de plancha', 'und', 2800, 'Hasta 14 pasos'),
    ('Techo de estructura metálica con aluzinc TR-4', 'm²', 120, 'Incluye correas y montaje'),
    ('Techo de policarbonato alveolar 6 mm', 'm²', 95, ''),
    ('Toldo metálico con policarbonato', 'm²', 140, ''),
    ('Pintura anticorrosiva + esmalte', 'm²', 18, '2 capas'),
    ('Soldadura y reparación en obra', 'hora', 45, ''),
    ('Movilidad y traslado de materiales', 'glb', 150, ''),
]
for i, (d, u, p, n) in enumerate(precios, 6):
    for j, v in enumerate([d, u, p, n], 1):
        c = G.cell(i, j, v); c.border = BORDE; c.font = F(color=AZUL_IN); c.fill = AMARILLO if j <= 3 else fill('FFFFFF')
        if j == 3: c.number_format = '"S/ "#,##0.00'
ULT = 60
for i in range(6 + len(precios), ULT + 1):
    for j in range(1, 5):
        c = G.cell(i, j); c.border = BORDE; c.fill = AMARILLO if j <= 3 else fill('FFFFFF'); c.font = F(color=AZUL_IN)
        if j == 3: c.number_format = '"S/ "#,##0.00'
for col, w in zip('ABCD', [58, 10, 14, 40]): G.column_dimensions[col].width = w
G.freeze_panes = 'A6'
LISTA = f"'Mis precios'!$A$6:$A${ULT}"; TABLA = f"'Mis precios'!$A$6:$C${ULT}"

# ── Cotización ──
C.sheet_view.showGridLines = False
for col, w in zip('ABCDEF', [14, 40, 8, 9, 21, 15]): C.column_dimensions[col].width = w
m('A1:F1'); C['A1'].fill = fill(NAVY); C.row_dimensions[1].height = 8
m('A2:B5'); C['A2'] = 'TU LOGO AQUÍ\n(Insertar → Imagen)'; C['A2'].font = F(bold=True, color='9AA4B2', size=12)
C['A2'].alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
dash = Side(style='dashed', color='9AA4B2')
for r in range(2, 6):
    for c_ in 'AB':
        C[f'{c_}{r}'].border = Border(left=dash if c_ == 'A' else None, right=dash if c_ == 'B' else None, top=dash if r == 2 else None, bottom=dash if r == 5 else None)
empresa = [('C2', 'TALLER METÁLICO EJEMPLO S.A.C.', dict(bold=True, size=15)), ('C3', 'RUC: 20123456789', {}),
           ('C4', 'Av. Los Metaleros 123, Ate, Lima', {}), ('C5', 'Cel./WhatsApp: 999 888 777 · ventas@tuempresa.pe', {})]
for celda, v, k in empresa:
    r = celda[1:]; m(f'C{r}:F{r}'); inp(C[celda], v, **k); C[celda].alignment = ali(horizontal='right')
C.row_dimensions[2].height = 26

m('A7:C7'); C['A7'] = 'COTIZACIÓN'; C['A7'].font = F(bold=True, size=24, color=NAR); C.row_dimensions[7].height = 34
C['E7'] = 'N°'; C['E7'].font = F(bold=True); C['E7'].alignment = Alignment(horizontal='right', vertical='bottom'); inp(C['F7'], 'COT-2026-001', bold=True); C['F7'].alignment = Alignment(horizontal='right', vertical='bottom')
C['E8'] = 'Fecha'; C['E8'].alignment = ali(horizontal='right'); inp(C['F8'], '=TODAY()'); C['F8'].number_format = 'dd/mm/yyyy'
C['E9'] = 'Válida hasta'; C['E9'].alignment = ali(horizontal='right'); C['F9'] = '=F8+B38'; C['F9'].number_format = 'dd/mm/yyyy'; C['F9'].font = F(bold=True)
cli = [('Cliente:', 'Sr. Carlos Mendoza'), ('DNI / RUC:', '45678912'), ('Obra / dirección:', 'Cochera — Jr. Las Flores 456, SJL'), ('Atención:', 'Carlos Mendoza · 987 654 321')]
for i, (e, v) in enumerate(cli, 8):
    C[f'A{i}'] = e; C[f'A{i}'].font = F(bold=True, size=9, color='5B6573')
    inp(C[f'B{i}'], v); m(f'B{i}:D{i}')
C['A8'].alignment = C['A9'].alignment = ali()

H = 13
for j, h in enumerate(['N°', 'Descripción', 'Und.', 'Cant.', 'P. unit. (S/)', 'Parcial (S/)'], 1):
    c = C.cell(H, j, h); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY); c.alignment = Alignment(horizontal='center', vertical='center')
C.row_dimensions[H].height = 22
ejemplo = [('Portón corredizo de fierro 3.90 × 2.40 m con plancha', 1), ('Automatización de portón corredizo (motor 600 kg)', 1),
           ('Techo de estructura metálica con aluzinc TR-4', 30), ('Movilidad y traslado de materiales', 1)]
R0, R1 = H + 1, H + 15
dv = DataValidation(type='list', formula1='=' + LISTA, allow_blank=True, showErrorMessage=False); C.add_data_validation(dv)
for k in range(15):
    r = R0 + k
    C.cell(r, 1, f'=IF(B{r}="","",ROW()-{H})')
    b = C.cell(r, 2); inp(b, ejemplo[k][0] if k < len(ejemplo) else None); b.alignment = Alignment(wrap_text=True, vertical='center'); dv.add(b.coordinate)
    u = C.cell(r, 3); inp(u, f'=IFERROR(INDEX({TABLA},MATCH(B{r},{LISTA},0),2),"")')
    q = C.cell(r, 4); inp(q, ejemplo[k][1] if k < len(ejemplo) else None)
    p = C.cell(r, 5); inp(p, f'=IFERROR(INDEX({TABLA},MATCH(B{r},{LISTA},0),3),"")')
    C.cell(r, 6, f'=IF(OR(D{r}="",E{r}=""),"",D{r}*E{r})')
    for j in range(1, 7):
        c = C.cell(r, j); c.border = Border(bottom=fino, left=fino, right=fino)
        if j in (1, 3, 4): c.alignment = Alignment(horizontal='center', vertical='center')
        elif j in (5, 6): c.alignment = Alignment(vertical='center')
        if j == 4: c.number_format = 'General'
        if j in (5, 6): c.number_format = '#,##0.00'
        if k % 2 and j in (1, 6): c.fill = fill('F6F8FB')
    C.row_dimensions[r].height = 28

T = R1 + 2   # bloque de totales y condiciones
tot = [('Subtotal', f'=SUM(F{R0}:F{R1})', None),
       ('Descuento', f'=-F{T}*D{T+1}', 0),
       ('Valor de venta (sin IGV)', f'=IF(D{T+2}="Sí",(F{T}+F{T+1})/(1+D{T+3}),F{T}+F{T+1})', 'No'),
       ('IGV', f'=F{T+2}*D{T+3}', 0.18),
       ('TOTAL (S/)', f'=F{T+2}+F{T+3}', None),
       ('Adelanto', f'=F{T+4}*D{T+5}', 0.5),
       ('Saldo contra entrega', f'=F{T+4}-F{T+5}', None)]
for i, (e, f, entrada_) in enumerate(tot):
    r = T + i
    C.cell(r, 5, e).font = F(bold=(i in (4,)), size=11 if i == 4 else 10); C.cell(r, 5).alignment = ali(horizontal='right')
    c = C.cell(r, 6, f); c.number_format = '#,##0.00'; c.font = F(bold=True); c.border = Border(bottom=fino)
    if entrada_ is not None:
        d = C.cell(r, 4); inp(d, entrada_); d.alignment = ali(horizontal='center')
        d.number_format = '0%' if isinstance(entrada_, (int, float)) else 'General'
    if i == 4:
        for j in (5, 6): C.cell(r, j).fill = fill(NAR); C.cell(r, j).font = F(bold=True, color='FFFFFF', size=12)
        C.row_dimensions[r].height = 24
C.cell(T + 2, 4).number_format = 'General'
dvs = DataValidation(type='list', formula1='"Sí,No"'); C.add_data_validation(dvs); dvs.add(f'D{T+2}')
C.cell(T + 2, 3, '¿Precios con IGV?').font = F(size=8, color='5B6573'); C.cell(T + 2, 3).alignment = ali(horizontal='right', wrap_text=True)

C.cell(T, 1, 'CONDICIONES').font = F(bold=True, color=NAR)
cond = [('Plazo de entrega', '15 días hábiles desde el adelanto'), ('Forma de pago', '50 % de adelanto y 50 % a la entrega'),
        ('Validez (días)', 15), ('Garantía', '12 meses en soldadura y estructura; 6 meses en motor'),
        ('Incluye', 'Fabricación, pintura, transporte e instalación'), ('No incluye', 'Obras de albañilería ni puntos eléctricos')]
for i, (e, v) in enumerate(cond):
    r = T + 1 + i
    C.cell(r, 1, e).font = F(size=9, bold=True, color='5B6573')
    inp(C.cell(r, 2), v, size=9); C.cell(r, 2).alignment = Alignment(wrap_text=True, vertical='center')
C.cell(T + 3, 2).number_format = '0 "días"'
# la fecha "válida hasta" usa la validez
C['F9'] = f'=F8+B{T+3}'

P = T + 9
C.cell(P, 1, 'Pagos a:').font = F(bold=True, size=9, color='5B6573')
m(f'B{P}:F{P}'); inp(C.cell(P, 2), 'BCP Cta. Cte. 191-1234567-0-12 · CCI 002-191-001234567012-55 · Yape 999 888 777 (Taller Metálico Ejemplo)', size=9)
C.cell(P + 1, 1, 'Notas:').font = F(bold=True, size=9, color='5B6573')
m(f'B{P+1}:F{P+1}'); inp(C.cell(P + 1, 2), 'Las medidas se confirman en la visita técnica. Precios en soles.', size=9)
FI = P + 5
for col, txt in (('B', 'Firma y sello de la empresa'), ('E', 'Acepto la cotización (cliente)')):
    rng = f'{col}{FI}:{"C" if col == "B" else "F"}{FI}'
    m(rng); c = C[f'{col}{FI}']; c.value = txt; c.font = F(size=9, color='5B6573'); c.alignment = Alignment(horizontal='center')
    for cc in (('B', 'C') if col == 'B' else ('E', 'F')): C[f'{cc}{FI}'].border = Border(top=Side(style='thin', color='333333'))
m(f'A{FI+2}:F{FI+2}'); C[f'A{FI+2}'] = 'Gracias por su confianza.'; C[f'A{FI+2}'].font = F(italic=True, color=NAR); C[f'A{FI+2}'].alignment = Alignment(horizontal='center')
C.print_area = f'A1:F{FI+2}'
C.page_setup.paperSize = C.PAPERSIZE_A4; C.page_setup.orientation = 'portrait'
C.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True); C.page_setup.fitToWidth = 1; C.page_setup.fitToHeight = 1
C.page_margins.left = C.page_margins.right = 0.4; C.page_margins.top = C.page_margins.bottom = 0.5

# ── Cómo usar ──
encabezado(guia, 'Plantilla Excel — Cotización profesional', 'Cotiza con tu logo y tus precios, y mándala en PDF por WhatsApp o correo.', 3)
pasos = [('1', 'Mis precios', 'Escribe una vez tus trabajos con su unidad y precio. Puedes agregar hasta 55.'),
         ('2', 'Cotización', 'Pon tu logo (Insertar → Imagen) y tus datos arriba. Llena el cliente.'),
         ('3', 'Ítems', 'Elige la descripción de la lista: la unidad y el precio salen solos. Escribe la cantidad. Si el trabajo no está en tu lista, escríbelo y pon tú la unidad y el precio.'),
         ('4', 'Totales', 'Elige si tus precios ya incluyen IGV, el descuento y el % de adelanto. El total y el saldo se calculan solos.'),
         ('5', 'Enviar', 'Archivo → Exportar → PDF (o Imprimir → Guardar como PDF). Sale en una hoja A4 lista para enviar.')]
for j, t in enumerate(['Paso', 'Dónde', 'Qué haces'], 1):
    c = guia.cell(5, j, t); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY)
for i, fila in enumerate(pasos, 6):
    for j, v in enumerate(fila, 1):
        c = guia.cell(i, j, v); c.font = F(bold=(j == 2)); c.border = BORDE; c.alignment = Alignment(wrap_text=True, vertical='top')
guia.cell(12, 1, 'Colores').font = F(bold=True, color=NAR)
c = guia.cell(13, 1, 'Ejemplo'); c.fill = AMARILLO; c.font = F(color=AZUL_IN, bold=True); guia.cell(13, 2, 'Celda para llenar (hoja Mis precios)')
c = guia.cell(14, 1, 'Ejemplo'); c.font = F(bold=True); guia.cell(14, 2, 'Se calcula sola: no la borres')
guia.cell(15, 1, 'En la hoja Cotización las celdas para llenar no tienen color, para que se imprima limpia: escribe encima del ejemplo. Las de N°, Parcial y totales se calculan solas.').font = F(size=9)
guia.cell(16, 1, 'Consejos para vender más').font = F(bold=True, color=NAR)
for i, t in enumerate(['Envía la cotización el mismo día de la visita: el cliente que espera, se enfría.',
                       'Ofrece dos o tres opciones (básica, recomendada, completa): copia la hoja Cotización y cambia los ítems.',
                       'Pon una validez corta (15 días) para que el cliente decida y tus precios no queden viejos.',
                       'Cambia los colores con Diseño de página → Colores, para que vaya con tu marca.']):
    guia.cell(17 + i, 1, '• ' + t).font = F(size=9)
guia.cell(22, 1, 'Los precios de ejemplo son referenciales: reemplázalos por los tuyos. El IGV vigente en Perú es 18 %.').font = F(size=9, italic=True, color='5B6573')
for col, w in zip('ABC', [10, 18, 95]): guia.column_dimensions[col].width = w
guia.sheet_view.showGridLines = False

for _ws in wb.worksheets:
    if not _ws.sheet_properties.pageSetUpPr or not _ws.sheet_properties.pageSetUpPr.fitToPage:
        _ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True); _ws.page_setup.fitToWidth = 1; _ws.page_setup.fitToHeight = 0
    _ws.page_setup.paperSize = _ws.PAPERSIZE_A4
    if _ws.title in ('Valorizaciones', 'Pagos'): _ws.page_setup.orientation = 'landscape'
wb.save(sys.argv[1] if len(sys.argv) > 1 else 'Plantilla_Cotizacion_Profesional_InnovApp.xlsx')
