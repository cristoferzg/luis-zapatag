import sys
from comun import *
from openpyxl.worksheet.properties import PageSetupProperties

wb = Workbook(); wb.remove(wb.active)
guia = wb.create_sheet('Cómo usar'); D = wb.create_sheet('Datos'); T = wb.create_sheet('Trazo')
M = wb.create_sheet('Metrado'); P = wb.create_sheet('Presupuesto')
R = hoja_catalogo(wb)

# ───────── Datos ─────────
encabezado(D, 'Nave parabólica — datos de la obra', 'Llena solo las celdas amarillas (texto azul). Lo gris se calcula solo. Ejemplo cargado: nave de 15 × 30 m.', 4)
seccion(D, 5, 'OBRA', 4)
entrada(D, 6, 'Cliente', 'Ejemplo: Almacén San José'); entrada(D, 7, 'Obra / ubicación', 'Nave de 15 × 30 m — Lurín'); entrada(D, 8, 'Fecha', '16/11/2026')
seccion(D, 10, 'GEOMETRÍA', 4)
entrada(D, 11, 'Luz del arco (L)', 15, 'm', 'Distancia entre ejes de columnas.', '0.00')
entrada(D, 12, 'Largo de la nave', 30, 'm', '', '0.00')
entrada(D, 13, 'Altura de columna', 5, 'm', 'Hasta la cabeza de columna (arranque del arco).', '0.00')
entrada(D, 14, 'Relación flecha / luz', 0.14, '× L', 'Óptima 0.14 L (rango 0.10 a 0.20 L), como el Asistente de Techos Metálicos.', '0.00')
calculo(D, 15, 'Flecha del arco (f)', '=B11*B14', 'm', 'Medida desde la cabeza de columna.')
calculo(D, 16, 'Altura en la cumbre', '=B13+B15', 'm')
entrada(D, 17, 'Peralte del arco (h)', '=ROUND(B11/18,2)', 'm', 'Sugerido ≈ L/18. Puedes escribir otro valor.', '0.00')
entrada(D, 18, 'Separación entre arcos', 5, 'm', 'Normal: 4 a 6 m.', '0.00')
entrada(D, 19, 'Paneles de celosía por arco', 10, 'und', 'Tramos de diagonales (Warren) a lo largo del arco.', '0')
entrada(D, 20, 'Montantes por arco', 2, 'und', '2 = solo en los extremos. Si usas Pratt, pon paneles + 1.', '0')
entrada(D, 21, 'Separación de correas', 1.5, 'm', 'Medida sobre el arco. Revisa la luz máxima de tu cobertura.', '0.00')
entrada(D, 22, 'Paños arriostrados (cruces en X)', 2, 'paños', 'Mínimo los 2 paños extremos.', '0')
entrada(D, 23, 'Volado de cobertura en cada frontis', 0.2, 'm', '', '0.00')
calculo(D, 24, 'Número de arcos', '=ROUNDUP(B12/B18,0)+1', 'und', '', '0')
calculo(D, 25, 'Largo del arco (desarrollo)', '=SQRT(B11^2+16*B15^2)/2+B11^2/(8*B15)*LN((4*B15+SQRT(B11^2+16*B15^2))/B11)', 'm', 'Largo exacto de la parábola: es lo que mide la cobertura.')
calculo(D, 26, 'Área techada en planta', '=B11*B12', 'm²')
calculo(D, 27, 'Área de cobertura (desarrollo)', '=B25*(B12+2*B23)', 'm²')

seccion(D, 29, 'PERFILES (elige de la lista)', 4)
perfiles = [(30, 'Cordón superior', 'LAC-75X50X2.5'), (31, 'Cordón inferior', 'LAC-75X50X2.5'), (32, 'Montantes', 'LAC-38X38X1.5'),
            (33, 'Diagonales', 'LAC-50X50X1.5'), (34, 'Correas', 'LAC-100X50X2.5'), (35, 'Columnas', 'LAC-150X150X6.0'),
            (36, 'Arriostres de cubierta', 'LAC-RED-48.3X2.0')]
for f, et, cod in perfiles: entrada(D, f, et, cod)
lista(D, R['perf'], [f'B{f}' for f, _, _ in perfiles])
D['D30'] = 'Perfiles de la plantilla «Nave parabólica 15 × 30 m» de Recursos Técnicos (memoria de cálculo CUMPLE).'
D['D30'].font = F(size=9, italic=True, color='5B6573')
entrada(D, 37, 'Cobertura', 'Aluzinc TR-4 Estándar Ligero Perú e=0.30mm'); lista(D, R['cob'], ['B37'])

seccion(D, 39, 'PRECIOS Y PORCENTAJES (referenciales: pon los de tu zona)', 4)
precios = [(40, 'Desperdicio de perfiles', 0.05, '%', '', '0%'), (41, 'Traslapes de cobertura', 0.10, '%', 'Traslapes laterales y de extremo.', '0%'),
           (42, 'Tensor de pared 5/8" con templador', 65, 'S/ c/u', 'Cruces en X entre columnas de los paños arriostrados.', '"S/ "#,##0.00'),
           (43, 'Placa base con 4 pernos de anclaje', 90, 'S/ c/u', 'Una por columna.', '"S/ "#,##0.00'),
           (44, 'Fijación (perno J o autoperforante)', 0.9, 'S/ c/u', '', '"S/ "#,##0.00'),
           (45, 'Fijaciones por m² de cobertura', 4, 'und/m²', '', '0.0'),
           (46, 'Pintura (anticorrosivo + esmalte)', 1.3, 'S/ por kg', 'Por kg de acero pintado.', '"S/ "#,##0.00'),
           (47, 'Mano de obra de fabricación', 3.5, 'S/ por kg', '', '"S/ "#,##0.00'),
           (48, 'Montaje (estructura + cobertura)', 18, 'S/ por m²', 'Por m² de cobertura.', '"S/ "#,##0.00'),
           (49, 'Transporte, grúa y andamios', 1500, 'S/ global', '', '"S/ "#,##0.00'),
           (50, 'Otros (canaletas, bajadas, etc.)', 0, 'S/ global', '', '"S/ "#,##0.00'),
           (51, 'Gastos generales', 0.08, '%', 'Sobre el costo directo.', '0%'),
           (52, 'Utilidad', 0.15, '%', 'Sobre el costo directo.', '0%'),
           (53, 'IGV', 0.18, '%', '', '0%')]
for f, et, v, u, n, fm in precios: entrada(D, f, et, v, u, n, fm)
for col, w in zip('ABCD', [36, 40, 12, 70]): D.column_dimensions[col].width = w
D.freeze_panes = 'A5'

# ───────── Trazo ─────────
encabezado(T, 'Tabla de trazo del arco', 'Ordenadas para trazar el arco en el piso del taller. x desde el eje de la columna izquierda; y desde la cuerda (cabeza de columna).', 7)
for j, h in enumerate(['Punto', 'x (m)', 'y cordón superior (m)', 'Altura desde el piso (m)', 'Pendiente (°)', 'y cordón inferior (m)', 'Largo del tramo (m)'], 1):
    c = T.cell(5, j, h); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY); c.alignment = Alignment(wrap_text=True, horizontal='center', vertical='center')
T.row_dimensions[5].height = 32
L, f_, h, n = 'Datos!$B$11', 'Datos!$B$15', 'Datos!$B$17', 'Datos!$B$19'
for k in range(0, 41):
    r = 6 + k
    T.cell(r, 1, f'=IF({k}<={n},{k},"")')
    T.cell(r, 2, f'=IF(A{r}="","",{L}*A{r}/{n})')
    T.cell(r, 3, f'=IF(A{r}="","",4*{f_}*B{r}*({L}-B{r})/{L}^2)')
    T.cell(r, 4, f'=IF(A{r}="","",Datos!$B$13+C{r})')
    T.cell(r, 5, f'=IF(A{r}="","",DEGREES(ATAN(4*{f_}*({L}-2*B{r})/{L}^2)))')
    T.cell(r, 6, f'=IF(A{r}="","",C{r}-{h}/COS(RADIANS(E{r})))')
    T.cell(r, 7, '' if k == 0 else f'=IF(A{r}="","",SQRT((B{r}-B{r-1})^2+(C{r}-C{r-1})^2))')
    for j in range(1, 8):
        c = T.cell(r, j); c.font = F(); c.border = BORDE; c.alignment = Alignment(horizontal='center')
        c.number_format = '0' if j == 1 else ('0.0' if j == 5 else '0.000')
T['I6'] = 'Cómo usarla'; T['I6'].font = F(bold=True, color=NAR)
for i, t in enumerate(['1. Tira una cuerda (línea recta) de una columna a la otra: es el eje x.', '2. Marca cada x y levanta la ordenada y del cordón superior.',
                       '3. Une los puntos con el tubo y repite con el cordón inferior.', '4. Usa el primer arco como gálibo para fabricar los demás.',
                       'El cordón inferior se mide igual, desde la misma cuerda (puede salir negativo cerca de los apoyos).']):
    T.cell(7 + i, 9, t).font = F(size=9)
for col, w in zip('ABCDEFGHI', [8, 10, 14, 14, 12, 14, 13, 3, 70]): T.column_dimensions[col].width = w
T.freeze_panes = 'A6'

# ───────── Metrado ─────────
encabezado(M, 'Metrado de la nave', 'Longitudes, kilos y barras de 6 m por partida. Todo sale de la hoja Datos.', 9)
cab = ['Partida', 'Perfil', 'Cantidad', 'Largo c/u (m)', 'Largo total (m)', 'Peso (kg/m)', 'Peso total (kg)', 'Barras a comprar', 'Costo (S/)']
for j, t in enumerate(cab, 1):
    c = M.cell(5, j, t); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY); c.alignment = Alignment(wrap_text=True, horizontal='center', vertical='center')
M.row_dimensions[5].height = 32
nA, s, sep = 'Datos!$B$24', 'Datos!$B$25', 'Datos!$B$18'
filas = [
  ('Cordón superior', 'Datos!$B$30', f'={nA}', f'={s}'),
  ('Cordón inferior', 'Datos!$B$31', f'={nA}', f'={s}'),
  ('Montantes', 'Datos!$B$32', f'={nA}*Datos!$B$20', f'={h}'),
  ('Diagonales (celosía)', 'Datos!$B$33', f'={nA}*{n}', f'=SQRT({h}^2+({s}/{n})^2)'),
  ('Correas', 'Datos!$B$34', f'=ROUNDUP({s}/Datos!$B$21,0)+1', '=Datos!$B$12'),
  ('Columnas', 'Datos!$B$35', f'=2*{nA}', '=Datos!$B$13'),
  ('Arriostres de cubierta (X)', 'Datos!$B$36', '=Datos!$B$22*8', f'=SQRT({sep}^2+({s}/4)^2)'),
]
for i, (part, perf, cant, largo) in enumerate(filas):
    r = 6 + i
    M.cell(r, 1, part); M.cell(r, 2, f'={perf}'); M.cell(r, 3, cant); M.cell(r, 4, largo)
    M.cell(r, 5, f'=C{r}*D{r}')
    M.cell(r, 6, f'={buscar(R["perf_tab"], f"B{r}", 4)}')
    M.cell(r, 7, f'=E{r}*F{r}')
    M.cell(r, 8, f'=ROUNDUP(E{r}*(1+Datos!$B$40)/{buscar(R["perf_tab"], f"B{r}", 5)},0)')
    M.cell(r, 9, f'=H{r}*{buscar(R["perf_tab"], f"B{r}", 5)}*{buscar(R["perf_tab"], f"B{r}", 6)}')
ft = 6 + len(filas)
M.cell(ft, 1, 'TOTAL ACERO'); M.cell(ft, 5, f'=SUM(E6:E{ft-1})'); M.cell(ft, 7, f'=SUM(G6:G{ft-1})'); M.cell(ft, 8, f'=SUM(H6:H{ft-1})'); M.cell(ft, 9, f'=SUM(I6:I{ft-1})')
fmts = {3: '0', 4: '0.00', 5: '#,##0.0', 6: '0.00', 7: '#,##0.0', 8: '0', 9: '"S/ "#,##0.00'}
for r in range(6, ft + 1):
    for j in range(1, 10):
        c = M.cell(r, j); c.border = BORDE; c.font = F(bold=(r == ft)); c.number_format = fmts.get(j, 'General')
        if r == ft: c.fill = fill('FDE3CF')
o = ft + 2
seccion(M, o, 'OTROS MATERIALES', 9)
otros = [
  ('Cobertura', '=Datos!$B$37', 'm²', '=Datos!$B$27*(1+Datos!$B$41)', f'={buscar(R["cob_tab"], "Datos!$B$37", 4)}'),
  ('Fijaciones (perno J / autoperforante)', '', 'und', '=ROUNDUP(Datos!$B$27*Datos!$B$45,0)', '=Datos!$B$44'),
  ('Tensores de pared 5/8" con templador', '', 'und', '=Datos!$B$22*4', '=Datos!$B$42'),
  ('Placas base con pernos de anclaje', '', 'und', f'=2*{nA}', '=Datos!$B$43'),
  ('Pintura (por kg de acero)', '', 'kg', f'=G{ft}', '=Datos!$B$46'),
]
for j, t in enumerate(['Material', 'Detalle', 'Unidad', 'Cantidad', 'Precio unitario (S/)', 'Costo (S/)'], 1):
    c = M.cell(o + 1, j, t); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY); c.alignment = Alignment(wrap_text=True, vertical='center')
M.row_dimensions[o + 1].height = 30
for i, (mat, det, und, cant, pu) in enumerate(otros):
    r = o + 2 + i
    for j, v in enumerate([mat, det, und, cant, pu, f'=D{r}*E{r}'], 1):
        c = M.cell(r, j, v); c.border = BORDE; c.font = F()
        c.number_format = {4: '#,##0.0', 5: '"S/ "#,##0.00', 6: '"S/ "#,##0.00'}.get(j, 'General')
ot = o + 2 + len(otros)
M.cell(ot, 1, 'TOTAL OTROS MATERIALES').font = F(bold=True); M.cell(ot, 6, f'=SUM(F{o+2}:F{ot-1})')
M.cell(ot, 6).number_format = '"S/ "#,##0.00'; M.cell(ot, 6).font = F(bold=True); M.cell(ot, 6).fill = fill('FDE3CF')
M.cell(ot + 2, 1, 'Peso de acero por m² techado').font = F(bold=True)
M.cell(ot + 2, 4, f'=G{ft}/Datos!$B$26'); M.cell(ot + 2, 4).number_format = '0.0 "kg/m²"'; M.cell(ot + 2, 4).font = F(bold=True)
M.cell(ot + 2, 5, 'Sirve para comparar con otras naves y detectar errores.').font = F(size=9, italic=True, color='5B6573')
for col, w in zip('ABCDEFGHI', [36, 42, 10, 13, 14, 16, 14, 12, 15]): M.column_dimensions[col].width = w
M.freeze_panes = 'A6'

# ───────── Presupuesto ─────────
encabezado(P, 'Presupuesto de la nave parabólica', 'Resumen para el cliente. Cambia precios y porcentajes en la hoja Datos.', 4)
P['A5'] = '=CONCATENATE("Cliente: ",Datos!B6)'; P['A6'] = '=CONCATENATE("Obra: ",Datos!B7,"  ·  Fecha: ",Datos!B8)'
P['A7'] = '=CONCATENATE("Nave de ",TEXT(Datos!B11,"0.00")," × ",TEXT(Datos!B12,"0.00")," m · flecha ",TEXT(Datos!B15,"0.00")," m · ",Datos!B24," arcos")'
for r in (5, 6, 7): P[f'A{r}'].font = F(bold=(r == 5))
for j, t in enumerate(['Partida', 'Base', 'Monto (S/)'], 1):
    c = P.cell(9, j, t); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY)
part = [
  ('Estructura metálica (perfiles)', f'=CONCATENATE(TEXT(Metrado!G{ft},"#,##0")," kg")', f'=Metrado!I{ft}'),
  ('Cobertura, fijaciones, tensores, placas y pintura', '', f'=Metrado!F{ot}'),
  ('Mano de obra de fabricación', f'=CONCATENATE(TEXT(Datos!B47,"0.00")," S/ por kg")', f'=Metrado!G{ft}*Datos!B47'),
  ('Montaje', f'=CONCATENATE(TEXT(Datos!B27,"#,##0")," m² de cobertura")', '=Datos!B27*Datos!B48'),
  ('Transporte, grúa y andamios', 'global', '=Datos!B49'),
  ('Otros', 'global', '=Datos!B50'),
]
for i, (a, b, c_) in enumerate(part):
    r = 10 + i; P.cell(r, 1, a); P.cell(r, 2, b); P.cell(r, 3, c_)
cd = 10 + len(part)
res = [('COSTO DIRECTO', '', f'=SUM(C10:C{cd-1})'), ('Gastos generales', '=Datos!B51', f'=C{cd}*Datos!B51'),
       ('Utilidad', '=Datos!B52', f'=C{cd}*Datos!B52'), ('SUBTOTAL', '', f'=C{cd}+C{cd+1}+C{cd+2}'),
       ('IGV', '=Datos!B53', f'=C{cd+3}*Datos!B53'), ('TOTAL', '', f'=C{cd+3}+C{cd+4}')]
for i, (a, b, c_) in enumerate(res):
    r = cd + i; P.cell(r, 1, a); P.cell(r, 2, b); P.cell(r, 3, c_)
    if b.startswith('=Datos'): P.cell(r, 2).number_format = '0%'
for r in range(10, cd + len(res)):
    for j in range(1, 4):
        c = P.cell(r, j); c.border = BORDE; c.font = F(bold=r in (cd, cd + 3, cd + 5))
        if j == 3: c.number_format = '"S/ "#,##0.00'
        if r in (cd, cd + 3): c.fill = fill(GRIS)
        if r == cd + 5: c.fill = fill(NAR); c.font = F(bold=True, color='FFFFFF', size=12)
tr = cd + 7
P.cell(tr, 1, 'Precio por m² techado (con IGV)').font = F(bold=True)
P.cell(tr, 3, f'=C{cd+5}/Datos!B26'); P.cell(tr, 3).number_format = '"S/ "#,##0.00'; P.cell(tr, 3).font = F(bold=True)
P.cell(tr + 2, 1, 'Precios referenciales del catálogo de InnovApp. Verifica precios con tu proveedor y el diseño con la memoria de cálculo antes de cotizar.').font = F(size=9, italic=True, color='5B6573')
for col, w in zip('ABC', [50, 30, 18]): P.column_dimensions[col].width = w
P.page_setup.orientation = 'portrait'; P.page_setup.fitToWidth = 1; P.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)

# ───────── Cómo usar ─────────
encabezado(guia, 'Plantilla Excel — Nave parabólica', 'Metrado, trazo y presupuesto de una nave con arcos reticulados. Compatible con el módulo Techos Metálicos de InnovApp.', 3)
pasos = [('1', 'Datos', 'Escribe luz, largo, altura de columna, separación de arcos y elige los perfiles y la cobertura de la lista. Solo cambias las celdas amarillas con texto azul.'),
         ('2', 'Trazo', 'Tabla de ordenadas para trazar el arco en el piso del taller y fabricar el gálibo.'),
         ('3', 'Metrado', 'Metros, kilos y barras de 6 m de cada partida, más cobertura, fijaciones, tensores, placas y pintura.'),
         ('4', 'Presupuesto', 'Resumen listo para el cliente: costo directo, gastos generales, utilidad, IGV, total y precio por m².'),
         ('5', 'Catálogo', 'Perfiles y coberturas del catálogo de InnovApp. Si tu proveedor tiene otros precios, cámbialos ahí (texto azul).')]
for j, t in enumerate(['Paso', 'Hoja', 'Qué hace'], 1):
    c = guia.cell(5, j, t); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY)
for i, (a, b, c_) in enumerate(pasos, 6):
    for j, v in enumerate([a, b, c_], 1):
        c = guia.cell(i, j, v); c.font = F(bold=(j == 2)); c.border = BORDE; c.alignment = Alignment(wrap_text=True, vertical='top')
leyenda = 12
guia.cell(leyenda, 1, 'Colores').font = F(bold=True, color=NAR)
c = guia.cell(leyenda + 1, 1, 'Ejemplo'); c.fill = AMARILLO; c.font = F(color=AZUL_IN, bold=True)
guia.cell(leyenda + 1, 2, 'Celda para llenar (dato tuyo)')
c = guia.cell(leyenda + 2, 1, 'Ejemplo'); c.fill = fill(GRIS); c.font = F(bold=True)
guia.cell(leyenda + 2, 2, 'Se calcula sola: no la borres')
guia.cell(leyenda + 4, 1, 'Fórmulas que usa').font = F(bold=True, color=NAR)
for i, t in enumerate(['Flecha óptima f = 0.14 L, medida desde la cabeza de columna (rango 0.10 a 0.20 L).',
                       'Arco: y = 4·f·x·(L − x) / L²   ·   Peralte del arco ≈ L/18.',
                       'Largo del arco = ½·√(L² + 16f²) + L²/(8f) · ln[(4f + √(L² + 16f²)) / L].',
                       'Barras a comprar = metros × (1 + desperdicio) / 6 m, redondeado hacia arriba.']):
    guia.cell(leyenda + 5 + i, 1, t).font = F(size=9)
guia.cell(leyenda + 10, 1, 'Importante').font = F(bold=True, color=NAR)
guia.cell(leyenda + 11, 1, 'Esta hoja calcula cantidades y costos; no reemplaza el cálculo estructural. Verifica los perfiles con la memoria de cálculo de Techos Metálicos o con un ingeniero.').font = F(size=9)
guia.cell(leyenda + 12, 1, 'Más ayuda: curso «Naves Parabólicas» en la Academia de InnovApp.').font = F(size=9)
for col, w in zip('ABC', [12, 34, 95]): guia.column_dimensions[col].width = w

wb.save(sys.argv[1] if len(sys.argv) > 1 else 'Plantilla_Nave_Parabolica_InnovApp.xlsx')
