"""Plantilla Excel: Liquidación de obra (adicionales y deductivos, pagos, penalidad, garantía y acta)."""
import sys, datetime as dt
from comun import F, fill, NAVY, NAR, GRIS, AMARILLO, AZUL_IN, BORDE, encabezado
from openpyxl import Workbook
from openpyxl.styles import Alignment
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.properties import PageSetupProperties
from openpyxl.formatting.rule import FormulaRule

wb = Workbook(); wb.remove(wb.active)
guia = wb.create_sheet('Cómo usar'); D = wb.create_sheet('Datos'); A = wb.create_sheet('Adicionales y deductivos')
PG = wb.create_sheet('Pagos recibidos'); L = wb.create_sheet('Liquidación'); AC = wb.create_sheet('Acta')
SOL = '"S/ "#,##0.00;[Red]-"S/ "#,##0.00'; FEC = 'dd/mm/yyyy'
AD, PGN, LQ = "'Adicionales y deductivos'", "'Pagos recibidos'", "'Liquidación'"

def inp(c, v, fmt=None, **k):
    c.value = v; c.font = F(color=AZUL_IN, **k); c.fill = AMARILLO; c.border = BORDE
    if fmt: c.number_format = fmt
def calc(c, v, fmt=None, bold=False):
    c.value = v; c.font = F(bold=bold); c.fill = fill(GRIS); c.border = BORDE
    if fmt: c.number_format = fmt
def cab(ws, fila, textos, alto=32):
    for j, t in enumerate(textos, 1):
        c = ws.cell(fila, j, t); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY)
        c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws.row_dimensions[fila].height = alto
def lista(ws, celdas, opciones):
    dv = DataValidation(type='list', formula1='"' + ','.join(opciones) + '"', allow_blank=True); ws.add_data_validation(dv)
    for c in celdas: dv.add(c)

# ── Datos ──
encabezado(D, 'Datos de la liquidación', 'Llena las celdas amarillas. Montos con IGV, tal como los pactaste con el cliente.', 3)
REF = {}
datos = [
    ('emp', 'Tu empresa', 'TALLER METÁLICO EJEMPLO S.A.C.', None, ''),
    ('ruc', 'RUC', '20123456789', '@', ''),
    ('cli', 'Cliente', 'Sra. Rosa Huamán', None, ''),
    ('dni', 'DNI / RUC del cliente', '41234567', '@', ''),
    ('obra', 'Obra', 'Techo metálico, portón y baranda — Av. Primavera 820, Ate', None, ''),
    ('fcon', 'Fecha del contrato o acuerdo', dt.date(2026, 9, 25), FEC, ''),
    ('monto', 'Monto contratado (con IGV)', 28500, SOL, 'El precio que firmaron al inicio.'),
    ('ini', 'Fecha de inicio', dt.date(2026, 10, 1), FEC, ''),
    ('plazo', 'Plazo pactado', 30, '0 "días"', 'Días calendario.'),
    ('amp', 'Ampliación de plazo aprobada', 3, '0 "días"', 'Días extra que el cliente aceptó por escrito (adicionales, lluvias, cambios).'),
    ('fin', 'Fecha real de término', dt.date(2026, 11, 5), FEC, 'Día en que entregaste la obra terminada.'),
    ('pen', 'Penalidad por día de atraso', 50, SOL, 'Solo si el contrato la pacta. Si no, pon 0.'),
    ('tope', 'Tope de la penalidad', 0.10, '0%', 'Máximo, como % del monto contratado (suele pactarse un tope).'),
    ('ret', 'Retención de garantía', 0.05, '0%', 'Solo si el contrato la pacta: se paga al terminar el plazo de garantía. Si no, pon 0 %.'),
    ('gar', 'Plazo de garantía', 12, '0 "meses"', ''),
]
for i, (k, e, v, fm, nota) in enumerate(datos, 5):
    D.cell(i, 1, e).font = F(); inp(D.cell(i, 2), v, fm); REF[k] = f'Datos!$B${i}'
    if nota: D.cell(i, 3, nota).font = F(size=9, italic=True, color='5B6573')
r = 5 + len(datos) + 1
D.cell(r, 1, 'CALCULADO').font = F(bold=True, color=NAR)
calcs = [('fprog', 'Fecha de término programada', f'={REF["ini"]}+{REF["plazo"]}+{REF["amp"]}', FEC),
         ('atraso', 'Días de atraso', f'=MAX(0,{REF["fin"]}-({REF["ini"]}+{REF["plazo"]}+{REF["amp"]}))', '0 "días"'),
         ('fgar', 'La garantía vence el', f'=EDATE({REF["fin"]},{REF["gar"]})', FEC)]
for i, (k, e, f, fm) in enumerate(calcs, r + 1):
    D.cell(i, 1, e).font = F(); calc(D.cell(i, 2), f, fm); REF[k] = f'Datos!$B${i}'
D.column_dimensions['A'].width = 34; D.column_dimensions['B'].width = 52; D.column_dimensions['C'].width = 70

# ── Adicionales y deductivos ──
encabezado(A, 'Adicionales y deductivos', 'Todo cambio al trabajo pactado. Solo entran a la liquidación los APROBADOS por el cliente.', 7)
cab(A, 5, ['N°', 'Fecha', 'Descripción', 'Tipo', '¿Aprobado por el cliente?', 'Monto (S/, con IGV)', 'Cómo se aprobó'])
ej = [(dt.date(2026, 10, 9), 'Canaleta adicional en el lado del patio (12 m) con 2 bajadas', 'Adicional', 'Sí', 850, 'WhatsApp del 09/10 con foto del presupuesto'),
      (dt.date(2026, 10, 14), 'Cambio de cobertura a aluzinc 0.40 mm (pedido del cliente)', 'Adicional', 'Sí', 1200, 'Firmado en la hoja de cambios'),
      (dt.date(2026, 10, 20), 'No se ejecuta la baranda de 8 m (la hará otro proveedor)', 'Deductivo', 'Sí', 1760, 'Acuerdo verbal confirmado por WhatsApp'),
      (dt.date(2026, 10, 28), 'Pintura del portón del vecino', 'Adicional', 'No', 300, 'Pendiente: el cliente aún no confirma')]
A0, NA = 6, 30; A1 = A0 + NA - 1
for k in range(NA):
    r = A0 + k; e = ej[k] if k < len(ej) else (None,) * 6
    A.cell(r, 1, f'=IF(C{r}="","",ROW()-{A0 - 1})').font = F(); A.cell(r, 1).border = BORDE; A.cell(r, 1).alignment = Alignment(horizontal='center')
    for j, v in enumerate(e, 2):
        inp(A.cell(r, j), v, {2: FEC, 6: SOL}.get(j))
    A.cell(r, 3).alignment = Alignment(wrap_text=True, vertical='center'); A.cell(r, 7).alignment = Alignment(wrap_text=True, vertical='center')
lista(A, [f'D{A0}:D{A1}'], ['Adicional', 'Deductivo']); lista(A, [f'E{A0}:E{A1}'], ['Sí', 'No'])
A.conditional_formatting.add(f'A{A0}:G{A1}', FormulaRule(formula=[f'$E{A0}="No"'], font=F(color='9CA3AF', italic=True)))
t = A1 + 2
res_a = [('adic', 'Adicionales aprobados', f'=SUMIFS(F{A0}:F{A1},D{A0}:D{A1},"Adicional",E{A0}:E{A1},"Sí")'),
         ('deduc', 'Deductivos aprobados', f'=SUMIFS(F{A0}:F{A1},D{A0}:D{A1},"Deductivo",E{A0}:E{A1},"Sí")'),
         ('pend', 'Pendientes de aprobación (NO entran)', f'=SUMIFS(F{A0}:F{A1},E{A0}:E{A1},"No")')]
for i, (k, e, f) in enumerate(res_a):
    A.cell(t + i, 5, e).font = F(bold=True); A.cell(t + i, 5).alignment = Alignment(horizontal='right')
    calc(A.cell(t + i, 6), f, SOL, bold=True); REF[k] = f"{AD}!$F${t + i}"
A.cell(t + 4, 1, 'Escribe el monto siempre en positivo: la hoja Liquidación suma los adicionales y resta los deductivos.').font = F(size=9, italic=True, color='5B6573')
A.cell(t + 5, 1, 'Consejo: ningún adicional sin aprobación por escrito (un WhatsApp con el monto ya sirve de respaldo).').font = F(size=9, italic=True, color='5B6573')
for col, w in zip('ABCDEFG', [6, 13, 52, 13, 15, 18, 40]): A.column_dimensions[col].width = w
A.freeze_panes = 'A6'

# ── Pagos recibidos ──
encabezado(PG, 'Pagos recibidos', 'Todo lo que el cliente ya te pagó por esta obra: adelanto, valorizaciones y adicionales.', 6)
cab(PG, 5, ['N°', 'Fecha', 'Concepto', 'Medio de pago', 'N° de operación', 'Monto (S/)'])
pj = [(dt.date(2026, 9, 26), 'Adelanto', 'Transferencia', '00128745', 8550),
      (dt.date(2026, 10, 16), 'Valorización 1', 'Yape', '7712093', 9000),
      (dt.date(2026, 10, 30), 'Valorización 2', 'Transferencia', '00131022', 6000)]
P0, NP = 6, 30; P1 = P0 + NP - 1
for k in range(NP):
    r = P0 + k; e = pj[k] if k < len(pj) else (None,) * 5
    PG.cell(r, 1, f'=IF(F{r}="","",ROW()-{P0 - 1})').font = F(); PG.cell(r, 1).border = BORDE; PG.cell(r, 1).alignment = Alignment(horizontal='center')
    for j, v in enumerate(e, 2):
        inp(PG.cell(r, j), v, {2: FEC, 5: '@', 6: SOL}.get(j))
lista(PG, [f'C{P0}:C{P1}'], ['Adelanto', 'Valorización 1', 'Valorización 2', 'Valorización 3', 'Valorización 4', 'Pago de adicional', 'Otro'])
lista(PG, [f'D{P0}:D{P1}'], ['Transferencia', 'Efectivo', 'Yape', 'Plin', 'Depósito', 'Cheque'])
tp = P1 + 2
PG.cell(tp, 5, 'TOTAL PAGADO').font = F(bold=True); PG.cell(tp, 5).alignment = Alignment(horizontal='right')
calc(PG.cell(tp, 6), f'=SUM(F{P0}:F{P1})', SOL, bold=True); REF['pagado'] = f"{PGN}!$F${tp}"
for col, w in zip('ABCDEF', [6, 13, 22, 18, 18, 18]): PG.column_dimensions[col].width = w
PG.freeze_panes = 'A6'

# ── Liquidación ──
encabezado(L, 'Liquidación de obra', 'Cuenta final: lo que vale la obra terminada, lo que ya te pagaron y el saldo. Se arma sola.', 3)
L['A4'] = f'=CONCATENATE("Obra: ",{REF["obra"]})'; L['A5'] = f'=CONCATENATE("Cliente: ",{REF["cli"]},"   ·   Contratista: ",{REF["emp"]})'
L['A4'].font = F(bold=True); L['A5'].font = F()
cab(L, 7, ['Concepto', 'Detalle', 'Monto (S/)'])
filas = [
    ('Monto contratado', f'=CONCATENATE("Contrato del ",TEXT({REF["fcon"]},"dd/mm/yyyy"))', f'={REF["monto"]}', False),
    ('(+) Adicionales aprobados', 'Hoja «Adicionales y deductivos»', f'={REF["adic"]}', False),
    ('(−) Deductivos aprobados', 'Trabajos que no se hicieron', f'=-{REF["deduc"]}', False),
    ('MONTO FINAL DE LA OBRA', '', '=SUM(C8:C10)', True),
    ('(−) Penalidad por atraso', f'=IF({REF["atraso"]}=0,"Sin atraso",CONCATENATE({REF["atraso"]}," días × S/ ",TEXT({REF["pen"]},"0.00"),", con tope"))',
     f'=-MIN({REF["atraso"]}*{REF["pen"]},{REF["tope"]}*{REF["monto"]})', False),
    ('MONTO A COBRAR', '', '=C11+C12', True),
    ('(−) Pagos recibidos', 'Hoja «Pagos recibidos»', f'=-{REF["pagado"]}', False),
    ('SALDO DE LA OBRA', '=IF(C15>=0,"El cliente te debe","Debes devolver al cliente")', '=C13+C14', True),
    ('(−) Retención de garantía', f'=IF({REF["ret"]}=0,"No pactada",CONCATENATE(TEXT({REF["ret"]},"0%")," del monto final; se paga el ",TEXT({REF["fgar"]},"dd/mm/yyyy")))',
     f'=-IF(C15>0,MIN(C15,{REF["ret"]}*C11),0)', False),
    ('SALDO A PAGAR AL ENTREGAR', '', '=C15+C16', True),
]
for i, (a, b, c, neg) in enumerate(filas, 8):
    L.cell(i, 1, a); L.cell(i, 2, b); L.cell(i, 3, c)
    for j in (1, 2, 3):
        x = L.cell(i, j); x.border = BORDE; x.font = F(bold=neg)
        if neg: x.fill = fill(GRIS)
    L.cell(i, 3).number_format = SOL
for j in (1, 2, 3):
    L.cell(17, j).fill = fill(NAR); L.cell(17, j).font = F(bold=True, color='FFFFFF', size=12)
L.cell(19, 1, 'Pendiente de aprobación (no incluido):').font = F(size=10)
calc(L.cell(19, 3), f'={REF["pend"]}', SOL)
L.cell(20, 1, f'Días de atraso:').font = F(size=10); calc(L.cell(20, 3), f'={REF["atraso"]}', '0 "días"')
L.cell(22, 1, 'Plantilla de orientación general: los montos, penalidades y retenciones son los que diga tu contrato. Ante dudas legales o tributarias, consulta a un abogado o contador.').font = F(size=9, italic=True, color='5B6573')
for col, w in zip('ABC', [36, 58, 20]): L.column_dimensions[col].width = w
L.page_setup.fitToWidth = 1; L.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)

# ── Acta ──
encabezado(AC, 'Acta de liquidación de obra', 'Lista para imprimir y firmar. Se llena sola con las otras hojas.', 2)
lin = [
    f'=CONCATENATE("En ",TEXT({REF["fin"]},"dd/mm/yyyy"),", se reúnen ",{REF["cli"]}," (DNI/RUC ",{REF["dni"]},"), en adelante EL CLIENTE, y ",{REF["emp"]}," (RUC ",{REF["ruc"]},"), en adelante EL CONTRATISTA,")',
    f'=CONCATENATE("para liquidar la obra: ",{REF["obra"]},".")',
    '',
    f'=CONCATENATE("1. Monto contratado: S/ ",TEXT({LQ}!C8,"#,##0.00"),". Adicionales aprobados: S/ ",TEXT({LQ}!C9,"#,##0.00"),". Deductivos: S/ ",TEXT(-{LQ}!C10,"#,##0.00"),".")',
    f'=CONCATENATE("2. Monto final de la obra: S/ ",TEXT({LQ}!C11,"#,##0.00"),IF({LQ}!C12<0,CONCATENATE(". Penalidad por atraso: S/ ",TEXT(-{LQ}!C12,"#,##0.00")),""),".")',
    f'=CONCATENATE("3. Pagos recibidos por EL CONTRATISTA: S/ ",TEXT(-{LQ}!C14,"#,##0.00"),".")',
    f'=IF({LQ}!C15>=0,CONCATENATE("4. Saldo a favor de EL CONTRATISTA: S/ ",TEXT({LQ}!C15,"#,##0.00"),IF({LQ}!C16<0,CONCATENATE(", del cual S/ ",TEXT(-{LQ}!C16,"#,##0.00")," se retiene como garantía hasta el ",TEXT({REF["fgar"]},"dd/mm/yyyy")),""),". EL CLIENTE paga hoy S/ ",TEXT({LQ}!C17,"#,##0.00"),"."),CONCATENATE("4. Saldo a favor de EL CLIENTE: S/ ",TEXT(-{LQ}!C15,"#,##0.00"),", que EL CONTRATISTA devuelve."))',
    f'=CONCATENATE("5. EL CONTRATISTA otorga garantía de ",{REF["gar"]}," meses sobre su trabajo, hasta el ",TEXT({REF["fgar"]},"dd/mm/yyyy"),", según el acta de entrega.")',
    '6. Con esta liquidación, ambas partes dan por cerradas las cuentas de la obra, salvo la garantía indicada.',
]
for i, f in enumerate(lin, 5):
    c = AC.cell(i, 1, f); c.font = F(size=11); c.alignment = Alignment(wrap_text=True, vertical='top'); AC.merge_cells(start_row=i, start_column=1, end_row=i, end_column=2)
    AC.row_dimensions[i].height = 34
f0 = 5 + len(lin) + 3
for j, (q, nm) in enumerate([('EL CLIENTE', REF['cli']), ('EL CONTRATISTA', REF['emp'])], 1):
    AC.cell(f0, j, '_______________________________').alignment = Alignment(horizontal='center')
    AC.cell(f0 + 1, j, f'={nm}').alignment = Alignment(horizontal='center'); AC.cell(f0 + 1, j).font = F(bold=True)
    AC.cell(f0 + 2, j, q).alignment = Alignment(horizontal='center'); AC.cell(f0 + 2, j).font = F(size=9)
AC.column_dimensions['A'].width = 55; AC.column_dimensions['B'].width = 55
AC.page_setup.fitToWidth = 1; AC.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)

# ── Cómo usar ──
encabezado(guia, 'Plantilla Excel — Liquidación de obra', 'Cierra cada obra con la cuenta clara: adicionales, deductivos, pagos, atrasos, garantía y el acta lista para firmar.', 3)
cab(guia, 5, ['Paso', 'Hoja', 'Qué hace'])
pasos = [('1', 'Datos', 'Tu empresa, el cliente, el monto contratado, fechas, plazo y lo que pactaron de penalidad y retención (si no pactaron, pon 0).'),
         ('2', 'Adicionales y deductivos', 'Cada cambio al trabajo, con su monto y si el cliente lo aprobó. Solo los aprobados entran a la cuenta.'),
         ('3', 'Pagos recibidos', 'Adelanto, valorizaciones y cualquier otro pago, con fecha, medio y N° de operación.'),
         ('4', 'Liquidación', 'La cuenta final: monto final, penalidad, pagos, saldo y retención de garantía. Se arma sola.'),
         ('5', 'Acta', 'El acta de liquidación con los montos ya escritos, lista para imprimir y firmar con el cliente.')]
for i, fila in enumerate(pasos, 6):
    for j, v in enumerate(fila, 1):
        c = guia.cell(i, j, v); c.font = F(bold=(j == 2)); c.border = BORDE; c.alignment = Alignment(wrap_text=True, vertical='top')
guia.cell(12, 1, 'Colores').font = F(bold=True, color=NAR)
c = guia.cell(13, 1, 'Ejemplo'); c.fill = AMARILLO; c.font = F(color=AZUL_IN, bold=True); guia.cell(13, 2, 'Celda para llenar (dato tuyo)')
c = guia.cell(14, 1, 'Ejemplo'); c.fill = fill(GRIS); c.font = F(bold=True); guia.cell(14, 2, 'Se calcula sola: no la borres')
guia.cell(16, 1, 'Importante').font = F(bold=True, color=NAR)
guia.cell(17, 1, 'Plantilla de orientación general. Penalidades, retenciones y plazos son los que diga tu contrato; ante dudas legales o tributarias, consulta a un abogado o contador.').font = F(size=9)
guia.cell(18, 1, 'Va con el kit de cotización: Cotización → Propuesta → Acuerdo → Presupuesto y valorizaciones → Liquidación → Acta de entrega y garantía.').font = F(size=9)
guia.cell(19, 1, 'Más ayuda: curso «El Negocio del Metalero» en la Academia de InnovApp (acuerdo, adelanto, cobranza y entrega).').font = F(size=9)
for col, w in zip('ABC', [12, 26, 100]): guia.column_dimensions[col].width = w

wb.save(sys.argv[1] if len(sys.argv) > 1 else 'Plantilla_Liquidacion_de_Obra_InnovApp.xlsx')
