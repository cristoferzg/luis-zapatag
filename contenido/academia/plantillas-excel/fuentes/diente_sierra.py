import sys
from armar import *

p = Plantilla('Techo diente de sierra', 'Llena solo las celdas amarillas (texto azul). Lo gris se calcula solo. Ejemplo cargado: nave de 12 × 24 m con 3 dientes.')
p.catalogo()
p.obra('Ejemplo: Industrias Quispe SAC', 'Nave de 12 × 24 m — Lurín')
p.seccion('GEOMETRÍA')
p.dato('B', 'Ancho total (en el sentido de los dientes)', 12, 'm', 'Medida perpendicular a las cumbreras.', '0.00')
p.dato('largo', 'Largo del techo (a lo largo de los dientes)', 24, 'm', '', '0.00')
p.dato('nd', 'Número de dientes', 3, 'und', 'Cada diente es una agua con una ventana vertical.', '0')
p.dato('hcol', 'Altura de columna', 5, 'm', 'Hasta la parte baja de cada diente.', '0.00')
p.dato('pend', 'Pendiente de cada diente', 0.30, '%', 'Más pendiente = ventana más alta (más luz). Revisa la pendiente mínima de tu cobertura.', '0%')
p.dato('n', 'Paneles por diente', 4, 'und', 'Tramos de la celosía de cada diente (máx. 12).', '0')
p.dato('sep', 'Separación entre pórticos', 4, 'm', 'A lo largo de la nave. Normal: 4 a 6 m.', '0.00')
p.dato('sepc', 'Separación de correas', 1.2, 'm', 'Medida sobre el faldón inclinado.', '0.00')
p.dato('panos', 'Paños arriostrados (cruces en X)', 2, 'paños', 'Mínimo los 2 paños extremos.', '0')
p.dato('volado', 'Volado de cobertura en cada frontis', 0.2, 'm', '', '0.00')
p.dato('orient', 'Hacia dónde miran las ventanas', 'Sur', '', 'En el Perú (hemisferio sur), las ventanas al SUR dan luz pareja sin sol directo.')
p.calc('a', 'Ancho de cada diente', '={B}/{nd}', 'm')
p.calc('hv', 'Alto de la ventana de cada diente', '={pend}*{a}', 'm', 'Es lo que sube el faldón en un diente.')
p.calc('ang', 'Ángulo de cada faldón', '=DEGREES(ATAN({pend}))', '°', '', '0.0')
p.calc('cumbre', 'Altura de cada cumbrera desde el piso', '={hcol}+{hv}', 'm')
p.calc('faldon', 'Largo del faldón de cada diente', '={a}*SQRT(1+{pend}^2)', 'm', 'Largo de la plancha de cobertura.')
p.calc('np', 'Número de pórticos', '=ROUNDUP({largo}/{sep},0)+1', 'und', '', '0')
p.calc('planta', 'Área techada en planta', '={B}*{largo}', 'm²')
p.calc('area_cob', 'Área de cobertura', '={nd}*{faldon}*({largo}+2*{volado})', 'm²')
p.calc('area_vent', 'Área de ventanas (caras verticales)', '={nd}*{hv}*{largo}', 'm²')
p.seccion('PERFILES (elige de la lista)')
p.perfil('pcs', 'Cordón inclinado (faldón)', 'LAC-50X50X2.0', 'Referencia para dientes de 3 a 5 m. Verifica con la memoria de cálculo o un ingeniero.')
p.perfil('pci', 'Cordón inferior', 'LAC-50X50X2.0')
p.perfil('pmv', 'Montante de ventana (vertical alto)', 'LAC-50X50X2.0')
p.perfil('pmo', 'Montantes intermedios', 'LAC-25X25X1.5')
p.perfil('pdi', 'Diagonales', 'LAC-30X30X1.5')
p.perfil('pco', 'Correas', 'LAC-100X50X1.2')
p.perfil('pcol', 'Columnas', 'LAC-150X150X4.5')
p.perfil('par', 'Arriostres de cubierta', 'LAC-RED-48.3X2.0')
p.dato('cob', 'Cobertura', 'Aluzinc TR-4 Estándar Ligero Perú e=0.30mm')
p.precios([('p_vent', 'Cierre de ventana (policarbonato o vidrio con marco)', 95, 'S/ por m²', 'Caras verticales de cada diente.', '"S/ "#,##0.00'),
           ('p_can', 'Canaleta con soportes', 40, 'S/ por m', 'Una al pie de cada diente.', '"S/ "#,##0.00'),
           ('p_baj', 'Bajada de agua (tubo PVC)', 60, 'S/ c/u', '', '"S/ "#,##0.00'),
           ('nbajc', 'Bajadas por canaleta', 2, 'und', '', '0')])
p.cerrar_datos('cob')
dvo = DataValidation(type='list', formula1='"Sur,Norte,Este,Oeste"'); p.D.add_data_validation(dvo); dvo.add(p.ref['orient'].replace('Datos!$B$', 'B'))
fijar(p, 'p_trans', 2500)

T, r0, r1 = p.tabla('Diente', 'Medidas de un diente (desde la parte baja hasta la ventana)',
    'Altura de cada montante y largo de cada diagonal de la celosía de UN diente. El último montante es el de la ventana.',
    ['Nudo', 'x desde la parte baja (m)', 'Altura del montante (m)', 'Diagonal del panel (m)', 'Largo del faldón hasta el nudo (m)'], 13, [
    lambda k, r: f'=IF({k}<={{n}},{k},"")',
    lambda k, r: f'=IF(A{r}="","",{{a}}*A{r}/{{n}})',
    lambda k, r: f'=IF(A{r}="","",{{pend}}*B{r})',
    lambda k, r: (0 if k == 0 else f'=IF(A{r}="","",SQRT(({{a}}/{{n}})^2+C{r}^2))'),
    lambda k, r: f'=IF(A{r}="","",B{r}*SQRT(1+{{pend}}^2))',
], notas=['1. Traza el cordón inferior de un diente (ancho a).', '2. En cada x levanta la altura del montante: el último es el de la ventana.',
          '3. Une cada nudo de arriba con el nudo de abajo anterior (diagonales).', '4. Fabrica todos los dientes iguales sobre un gálibo.',
          'Las ventanas van del lado ALTO de cada diente. En el Perú, que miren al sur.'],
    anchos=[8, 16, 14, 14, 16])
tot = r1 + 1
T.cell(tot, 1, 'Por diente').font = F(bold=True)
T.cell(tot, 3, f'=SUM(C{r0}:C{r1})-{{hv}}'.format(hv=p.ref['hv'])); T.cell(tot, 4, f'=SUM(D{r0}:D{r1})')
T.cell(tot + 1, 1, 'Fila «Por diente»: C = metros de montantes intermedios (sin el de ventana), D = metros de diagonales.').font = F(size=9, italic=True, color='5B6573')
for j in (3, 4): T.cell(tot, j).font = F(bold=True); T.cell(tot, j).fill = fill('FDE3CF'); T.cell(tot, j).number_format = '0.00'
p.ref['mont_d'] = f'Diente!$C${tot}'; p.ref['diag_d'] = f'Diente!$D${tot}'

p.metrado([
    ('Cordón inclinado (1 por diente)', 'pcs', '={nd}*{np}', '={faldon}'),
    ('Cordón inferior (todo el ancho)', 'pci', '={np}', '={B}'),
    ('Montantes de ventana', 'pmv', '={nd}*{np}', '={hv}'),
    ('Montantes intermedios (metros por diente)', 'pmo', '={nd}*{np}', '={mont_d}'),
    ('Diagonales (metros por diente)', 'pdi', '={nd}*{np}', '={diag_d}'),
    ('Correas', 'pco', '={nd}*(ROUNDUP({faldon}/{sepc},0)+1)', '={largo}+2*{volado}'),
    ('Columnas (en cada línea de diente)', 'pcol', '=({nd}+1)*{np}', '={hcol}'),
    ('Arriostres de cubierta (X)', 'par', '={panos}*2*{nd}', '=SQRT({sep}^2+{faldon}^2)'),
], [
    ('Cobertura', '={cob}', 'm²', '={area_cob}*(1+{trasl})', '=' + buscar(p.R['cob_tab'], '{cob}', 4)),
    ('Cierre de ventanas', '', 'm²', '={area_vent}', '={p_vent}'),
    ('Remate de cumbreras (borde alto de cada diente)', '', 'm', '={nd}*({largo}+2*{volado})', '={p_remate}'),
    ('Canaletas con soportes (al pie de cada diente)', '', 'm', '={nd}*({largo}+2*{volado})', '={p_can}'),
    ('Bajadas de agua', '', 'und', '={nd}*{nbajc}', '={p_baj}'),
    ('Fijaciones (perno J / autoperforante)', '', 'und', '=ROUNDUP({area_cob}*{fij_m2},0)', '={p_fij}'),
    ('Tensores de pared 5/8" con templador', '', 'und', '={panos}*4', '={p_tensor}'),
    ('Placas base con pernos de anclaje', '', 'und', '=({nd}+1)*{np}', '={p_placa}'),
    ('Pintura (por kg de acero)', '', 'kg', '={kg}', '={p_pint}'),
])
p.presupuesto('Presupuesto del techo diente de sierra',
    '=CONCATENATE("Techo diente de sierra de ",TEXT({B},"0.00")," × ",TEXT({largo},"0.00")," m · ",{nd}," dientes de ",TEXT({a},"0.00")," m · ventanas de ",TEXT({hv},"0.00")," m")')
p.como_usar('Metrado, medidas de cada diente y presupuesto de un techo diente de sierra (naves con luz natural). Compatible con Techos Metálicos de InnovApp.',
    'Diente', 'Altura de cada montante y largo de cada diagonal de un diente, para trazarlo en el piso. El último montante es el de la ventana.',
    ['Ancho de cada diente = ancho total / número de dientes.', 'Alto de la ventana = pendiente × ancho del diente.',
     'Largo del faldón = ancho del diente × √(1 + pendiente²).', 'Barras a comprar = metros × (1 + desperdicio) / 6 m, redondeado hacia arriba.',
     'Cada diente tiene su canaleta al pie, junto a la ventana del diente vecino: cuida el sellado de esa unión.'],
    'Techos a Dos y Cuatro Aguas')
p.guardar(sys.argv[1] if len(sys.argv) > 1 else 'Plantilla_Techo_Diente_de_Sierra_InnovApp.xlsx')
