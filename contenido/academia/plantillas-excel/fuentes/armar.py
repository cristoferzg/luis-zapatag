"""Constructor genérico de plantillas Excel de techos (Datos · tabla auxiliar · Metrado · Presupuesto · Catálogo)."""
from comun import *
from openpyxl.worksheet.properties import PageSetupProperties

PRECIOS_BASE = [
    ('desp', 'Desperdicio de perfiles', 0.05, '%', '', '0%'),
    ('trasl', 'Traslapes de cobertura', 0.10, '%', 'Traslapes laterales y de extremo.', '0%'),
    ('p_tensor', 'Tensor de pared 5/8" con templador', 65, 'S/ c/u', 'Cruces en X entre columnas de los paños arriostrados.', '"S/ "#,##0.00'),
    ('p_placa', 'Placa base con 4 pernos de anclaje', 90, 'S/ c/u', 'Una por columna.', '"S/ "#,##0.00'),
    ('p_fij', 'Fijación (perno J o autoperforante)', 0.9, 'S/ c/u', '', '"S/ "#,##0.00'),
    ('fij_m2', 'Fijaciones por m² de cobertura', 4, 'und/m²', '', '0.0'),
    ('p_remate', 'Remate de cumbrera / limatesa', 28, 'S/ por m', 'Cumbrera, limatesas o borde superior, según el techo.', '"S/ "#,##0.00'),
    ('p_pint', 'Pintura (anticorrosivo + esmalte)', 1.3, 'S/ por kg', 'Por kg de acero pintado.', '"S/ "#,##0.00'),
    ('p_fab', 'Mano de obra de fabricación', 3.5, 'S/ por kg', '', '"S/ "#,##0.00'),
    ('p_mont', 'Montaje (estructura + cobertura)', 18, 'S/ por m²', 'Por m² de cobertura.', '"S/ "#,##0.00'),
    ('p_trans', 'Transporte, grúa y andamios', 1500, 'S/ global', '', '"S/ "#,##0.00'),
    ('p_otros', 'Otros (canaletas, bajadas, etc.)', 0, 'S/ global', '', '"S/ "#,##0.00'),
    ('gg', 'Gastos generales', 0.08, '%', 'Sobre el costo directo.', '0%'),
    ('util', 'Utilidad', 0.15, '%', 'Sobre el costo directo.', '0%'),
    ('igv', 'IGV', 0.18, '%', '', '0%'),
]


class Plantilla:
    def __init__(self, titulo, sub_datos):
        self.wb = Workbook(); self.wb.remove(self.wb.active)
        self.guia = self.wb.create_sheet('Cómo usar'); self.D = self.wb.create_sheet('Datos')
        self.titulo = titulo
        self.ref = {}; self.fila = 5; self.perfiles = []; self.ntab = 0
        encabezado(self.D, titulo + ' — datos de la obra', sub_datos, 4)

    # ── hoja Datos ──
    def seccion(self, texto):
        self.fila += 1 if self.fila > 5 else 0
        seccion(self.D, self.fila, texto, 4); self.fila += 1

    def _f(self, txt):
        return txt.format(**self.ref) if isinstance(txt, str) and '{' in txt else txt

    def dato(self, clave, etiqueta, valor, unidad='', nota='', fmt=None):
        entrada(self.D, self.fila, etiqueta, self._f(valor), unidad, nota, fmt)
        self.ref[clave] = f'Datos!$B${self.fila}'; self.fila += 1

    def calc(self, clave, etiqueta, formula, unidad='', nota='', fmt='0.00'):
        calculo(self.D, self.fila, etiqueta, self._f(formula), unidad, nota, fmt)
        self.ref[clave] = f'Datos!$B${self.fila}'; self.fila += 1

    def perfil(self, clave, etiqueta, codigo, nota=''):
        self.dato(clave, etiqueta, codigo, '', nota); self.perfiles.append(self.ref[clave].split('$')[-1])

    def precios(self, extra=()):
        self.seccion('PRECIOS Y PORCENTAJES (referenciales: pon los de tu zona)')
        for c, e, v, u, n, fm in list(PRECIOS_BASE) + list(extra):
            self.dato(c, e, v, u, n, fm)

    def cerrar_datos(self, cobertura_clave):
        lista(self.D, self.R['perf'], [f'B{r}' for r in self.perfiles])
        lista(self.D, self.R['cob'], [self.ref[cobertura_clave].replace('Datos!$B$', 'B')])
        for col, w in zip('ABCD', [36, 40, 12, 72]): self.D.column_dimensions[col].width = w
        self.D.freeze_panes = 'A5'

    def catalogo(self):
        self.R = hoja_catalogo(self.wb)
        self.wb.move_sheet('Catálogo', offset=10)

    # ── hoja auxiliar (tabla de nudos / trazo) ──
    def tabla(self, nombre, titulo, sub, columnas, filas_max, formulas, notas=(), anchos=None):
        """formulas: lista de funciones (k, r) -> valor de la celda, una por columna."""
        T = self.wb.create_sheet(nombre, index=2 + self.ntab); self.ntab += 1
        encabezado(T, titulo, sub, len(columnas) + (2 if notas else 0))
        for j, h in enumerate(columnas, 1):
            c = T.cell(5, j, h); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY)
            c.alignment = Alignment(wrap_text=True, horizontal='center', vertical='center')
        T.row_dimensions[5].height = 32
        for k in range(filas_max):
            r = 6 + k
            for j, fn in enumerate(formulas, 1):
                c = T.cell(r, j, self._f(fn(k, r))); c.font = F(); c.border = BORDE; c.alignment = Alignment(horizontal='center')
                c.number_format = '0' if j == 1 else '0.000'
                if columnas[j - 1].startswith(('Montantes por', 'Nudo', 'Línea', 'Correa', 'Punto')): c.number_format = '0'
        if notas:
            col = len(columnas) + 2
            T.cell(6, col, 'Cómo usarla').font = F(bold=True, color=NAR)
            for i, t in enumerate(notas): T.cell(7 + i, col, t).font = F(size=9)
            T.column_dimensions[chr(64 + col)].width = 72
        for j, w in enumerate(anchos or [10] * len(columnas), 1): T.column_dimensions[chr(64 + j)].width = w
        T.freeze_panes = 'A6'
        self.ref[nombre] = nombre
        return T, 6, 5 + filas_max

    # ── Metrado y Presupuesto ──
    def metrado(self, filas, otros):
        M = self.wb.create_sheet('Metrado', index=len(self.wb.sheetnames) - 1)
        encabezado(M, 'Metrado', 'Longitudes, kilos y barras de 6 m por partida. Todo sale de la hoja Datos.', 9)
        cab = ['Partida', 'Perfil', 'Cantidad', 'Largo c/u (m)', 'Largo total (m)', 'Peso (kg/m)', 'Peso total (kg)', 'Barras a comprar', 'Costo (S/)']
        for j, t in enumerate(cab, 1):
            c = M.cell(5, j, t); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY)
            c.alignment = Alignment(wrap_text=True, horizontal='center', vertical='center')
        M.row_dimensions[5].height = 32
        PT = self.R['perf_tab']
        for i, (part, perf, cant, largo) in enumerate(filas):
            r = 6 + i
            M.cell(r, 1, part); M.cell(r, 2, '=' + self.ref[perf]); M.cell(r, 3, self._f(cant)); M.cell(r, 4, self._f(largo))
            M.cell(r, 5, f'=C{r}*D{r}')
            M.cell(r, 6, f'={buscar(PT, f"B{r}", 4)}')
            M.cell(r, 7, f'=E{r}*F{r}')
            M.cell(r, 8, f'=IF(E{r}=0,0,ROUNDUP(E{r}*(1+{self.ref["desp"]})/{buscar(PT, f"B{r}", 5)},0))')
            M.cell(r, 9, f'=H{r}*{buscar(PT, f"B{r}", 5)}*{buscar(PT, f"B{r}", 6)}')
        ft = 6 + len(filas)
        M.cell(ft, 1, 'TOTAL ACERO')
        for j, col in ((5, 'E'), (7, 'G'), (8, 'H'), (9, 'I')): M.cell(ft, j, f'=SUM({col}6:{col}{ft-1})')
        fmts = {3: '0', 4: '0.00', 5: '#,##0.0', 6: '0.00', 7: '#,##0.0', 8: '0', 9: '"S/ "#,##0.00'}
        for r in range(6, ft + 1):
            for j in range(1, 10):
                c = M.cell(r, j); c.border = BORDE; c.font = F(bold=(r == ft)); c.number_format = fmts.get(j, 'General')
                if r == ft: c.fill = fill('FDE3CF')
        self.ref['kg'] = f'Metrado!$G${ft}'; self.ref['acero'] = f'Metrado!$I${ft}'
        o = ft + 2
        seccion(M, o, 'OTROS MATERIALES', 9)
        for j, t in enumerate(['Material', 'Detalle', 'Unidad', 'Cantidad', 'Precio unitario (S/)', 'Costo (S/)'], 1):
            c = M.cell(o + 1, j, t); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY); c.alignment = Alignment(wrap_text=True, vertical='center')
        M.row_dimensions[o + 1].height = 30
        for i, fila in enumerate(otros):
            r = o + 2 + i
            for j, v in enumerate(list(fila) + [f'=D{r}*E{r}'], 1):
                c = M.cell(r, j, self._f(v)); c.border = BORDE; c.font = F()
                c.number_format = {4: '#,##0.0', 5: '"S/ "#,##0.00', 6: '"S/ "#,##0.00'}.get(j, 'General')
        ot = o + 2 + len(otros)
        M.cell(ot, 1, 'TOTAL OTROS MATERIALES').font = F(bold=True); M.cell(ot, 6, f'=SUM(F{o+2}:F{ot-1})')
        M.cell(ot, 6).number_format = '"S/ "#,##0.00'; M.cell(ot, 6).font = F(bold=True); M.cell(ot, 6).fill = fill('FDE3CF')
        self.ref['otros'] = f'Metrado!$F${ot}'
        M.cell(ot + 2, 1, 'Peso de acero por m² techado').font = F(bold=True)
        M.cell(ot + 2, 4, f'=G{ft}/{self.ref["planta"]}'); M.cell(ot + 2, 4).number_format = '0.0 "kg/m²"'; M.cell(ot + 2, 4).font = F(bold=True)
        M.cell(ot + 2, 5, 'Sirve para comparar con otros techos y detectar errores.').font = F(size=9, italic=True, color='5B6573')
        for col, w in zip('ABCDEFGHI', [36, 42, 10, 13, 14, 16, 14, 12, 15]): M.column_dimensions[col].width = w
        M.freeze_panes = 'A6'

    def presupuesto(self, titulo, linea_resumen):
        P = self.wb.create_sheet('Presupuesto', index=len(self.wb.sheetnames) - 1)
        encabezado(P, titulo, 'Resumen para el cliente. Cambia precios y porcentajes en la hoja Datos.', 3)
        P['A5'] = f'=CONCATENATE("Cliente: ",{self.ref["cliente"]})'
        P['A6'] = f'=CONCATENATE("Obra: ",{self.ref["obra"]},"  ·  Fecha: ",{self.ref["fecha"]})'
        P['A7'] = self._f(linea_resumen)
        P['A5'].font = F(bold=True); P['A6'].font = F(); P['A7'].font = F()
        for j, t in enumerate(['Partida', 'Base', 'Monto (S/)'], 1):
            c = P.cell(9, j, t); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY)
        rf = self.ref
        part = [('Estructura metálica (perfiles)', f'=CONCATENATE(TEXT({rf["kg"]},"#,##0")," kg")', f'={rf["acero"]}'),
                ('Cobertura y otros materiales (ver Metrado)', '', f'={rf["otros"]}'),
                ('Mano de obra de fabricación', f'=CONCATENATE(TEXT({rf["p_fab"]},"0.00")," S/ por kg")', f'={rf["kg"]}*{rf["p_fab"]}'),
                ('Montaje', f'=CONCATENATE(TEXT({rf["area_cob"]},"#,##0")," m² de cobertura")', f'={rf["area_cob"]}*{rf["p_mont"]}'),
                ('Transporte, grúa y andamios', 'global', f'={rf["p_trans"]}'),
                ('Otros', 'global', f'={rf["p_otros"]}')]
        for i, (a, b, c_) in enumerate(part):
            r = 10 + i; P.cell(r, 1, a); P.cell(r, 2, b); P.cell(r, 3, c_)
        cd = 10 + len(part)
        res = [('COSTO DIRECTO', '', f'=SUM(C10:C{cd-1})'), ('Gastos generales', f'={rf["gg"]}', f'=C{cd}*{rf["gg"]}'),
               ('Utilidad', f'={rf["util"]}', f'=C{cd}*{rf["util"]}'), ('SUBTOTAL', '', f'=C{cd}+C{cd+1}+C{cd+2}'),
               ('IGV', f'={rf["igv"]}', f'=C{cd+3}*{rf["igv"]}'), ('TOTAL', '', f'=C{cd+3}+C{cd+4}')]
        for i, (a, b, c_) in enumerate(res):
            r = cd + i; P.cell(r, 1, a); P.cell(r, 2, b); P.cell(r, 3, c_)
            if b: P.cell(r, 2).number_format = '0%'
        for r in range(10, cd + len(res)):
            for j in range(1, 4):
                c = P.cell(r, j); c.border = BORDE; c.font = F(bold=r in (cd, cd + 3, cd + 5))
                if j == 3: c.number_format = '"S/ "#,##0.00'
                if r in (cd, cd + 3): c.fill = fill(GRIS)
                if r == cd + 5: c.fill = fill(NAR); c.font = F(bold=True, color='FFFFFF', size=12)
        tr = cd + 7
        P.cell(tr, 1, 'Precio por m² techado (con IGV)').font = F(bold=True)
        P.cell(tr, 3, f'=C{cd+5}/{rf["planta"]}'); P.cell(tr, 3).number_format = '"S/ "#,##0.00'; P.cell(tr, 3).font = F(bold=True)
        P.cell(tr + 2, 1, 'Precios referenciales del catálogo de InnovApp. Verifica precios con tu proveedor y el diseño con la memoria de cálculo antes de cotizar.').font = F(size=9, italic=True, color='5B6573')
        for col, w in zip('ABC', [52, 30, 18]): P.column_dimensions[col].width = w
        P.page_setup.fitToWidth = 1; P.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)

    def como_usar(self, subtitulo, aux_nombre, aux_texto, formulas, curso):
        g = self.guia
        encabezado(g, 'Plantilla Excel — ' + self.titulo, subtitulo, 3)
        pasos = [('1', 'Datos', 'Escribe las medidas de la obra y elige los perfiles y la cobertura de la lista. Solo cambias las celdas amarillas con texto azul.'),
                 ('2', aux_nombre, aux_texto),
                 ('3', 'Metrado', 'Metros, kilos y barras de 6 m de cada partida, más cobertura, remates, fijaciones, tensores, placas y pintura.'),
                 ('4', 'Presupuesto', 'Resumen listo para el cliente: costo directo, gastos generales, utilidad, IGV, total y precio por m².'),
                 ('5', 'Catálogo', 'Perfiles y coberturas del catálogo de InnovApp. Si tu proveedor tiene otros precios, cámbialos ahí (texto azul).')]
        for j, t in enumerate(['Paso', 'Hoja', 'Qué hace'], 1):
            c = g.cell(5, j, t); c.font = F(bold=True, color='FFFFFF'); c.fill = fill(NAVY)
        for i, fila in enumerate(pasos, 6):
            for j, v in enumerate(fila, 1):
                c = g.cell(i, j, v); c.font = F(bold=(j == 2)); c.border = BORDE; c.alignment = Alignment(wrap_text=True, vertical='top')
        L = 12
        g.cell(L, 1, 'Colores').font = F(bold=True, color=NAR)
        c = g.cell(L + 1, 1, 'Ejemplo'); c.fill = AMARILLO; c.font = F(color=AZUL_IN, bold=True); g.cell(L + 1, 2, 'Celda para llenar (dato tuyo)')
        c = g.cell(L + 2, 1, 'Ejemplo'); c.fill = fill(GRIS); c.font = F(bold=True); g.cell(L + 2, 2, 'Se calcula sola: no la borres')
        g.cell(L + 4, 1, 'Fórmulas que usa').font = F(bold=True, color=NAR)
        for i, t in enumerate(formulas): g.cell(L + 5 + i, 1, t).font = F(size=9)
        k = L + 6 + len(formulas)
        g.cell(k, 1, 'Importante').font = F(bold=True, color=NAR)
        g.cell(k + 1, 1, 'Esta hoja calcula cantidades y costos; no reemplaza el cálculo estructural. Verifica los perfiles con la memoria de cálculo de Techos Metálicos o con un ingeniero.').font = F(size=9)
        g.cell(k + 2, 1, f'Más ayuda: curso «{curso}» en la Academia de InnovApp.').font = F(size=9)
        for col, w in zip('ABC', [12, 34, 95]): g.column_dimensions[col].width = w

    def obra(self, cliente, obra):
        self.seccion('OBRA')
        self.dato('cliente', 'Cliente', cliente); self.dato('obra', 'Obra / ubicación', obra); self.dato('fecha', 'Fecha', '16/11/2026')

    def guardar(self, ruta):
        self.wb.save(ruta)


def fijar(p, clave, valor, nota=None):
    r = int(p.ref[clave].split('$')[-1]); p.D.cell(r, 2).value = valor
    if nota: p.D.cell(r, 4).value = nota
