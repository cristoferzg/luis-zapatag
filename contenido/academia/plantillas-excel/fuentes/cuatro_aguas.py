import sys
from armar import *

p = Plantilla('Techo a cuatro aguas', 'Llena solo las celdas amarillas (texto azul). Lo gris se calcula solo. Ejemplo cargado: casa de 8 × 12 m.')
p.catalogo()
p.obra('Ejemplo: Familia Quispe', 'Casa de 8 × 12 m — Chaclacayo')
p.seccion('GEOMETRÍA')
p.dato('B', 'Ancho de la casa (luz del tijeral)', 8, 'm', 'El lado corto, entre ejes.', '0.00')
p.dato('A', 'Largo de la casa', 12, 'm', 'El lado largo. Debe ser igual o mayor que el ancho.', '0.00')
p.dato('hcol', 'Altura de muro o columna', 2.7, 'm', 'Hasta el apoyo de los tijerales.', '0.00')
p.dato('pend', 'Pendiente (igual en los 4 faldones)', 0.30, '%', 'Revisa la pendiente mínima de tu cobertura (ficha técnica).', '0%')
p.dato('h0', 'Peralte del tijeral en el apoyo', 0, 'm', '0 = tijeral triangular.', '0.00')
p.dato('alero', 'Alero (medida horizontal, todo el contorno)', 0.5, 'm', '', '0.00')
p.dato('sep', 'Separación entre tijerales', 2, 'm', 'Tijerales completos en el tramo de la cumbrera.', '0.00')
p.dato('medios', 'Medios tijerales por extremo', 1, 'und', 'Del vértice de las limatesas al centro de cada muro de testero.', '0')
p.dato('n', 'Paneles por faldón del tijeral', 4, 'und', 'Máx. 20.', '0')
p.dato('tipo', 'Tipo de tijeral', 'Pratt', '', 'Pratt, Howe, Warren o Fink (elige de la lista).')
p.dato('sepc', 'Separación de correas', 1.0, 'm', 'Medida sobre el faldón.', '0.00')
p.dato('ncol', 'Columnas metálicas', 6, 'und', 'Pon 0 si el techo apoya en muros o vigas de concreto.', '0')
p.dato('panos', 'Paños arriostrados (cruces en X)', 1, 'paños', '', '0')
p.calc('flecha', 'Altura del tijeral en la cumbrera', '={h0}+{pend}*{B}/2', 'm')
p.calc('cumbre', 'Altura de la cumbrera desde el piso', '={hcol}+{flecha}', 'm')
p.calc('lcumbrera', 'Largo de la cumbrera', '=MAX(0,{A}-{B})', 'm', 'Con pendientes iguales, la cumbrera mide largo − ancho.')
p.calc('faldon', 'Largo del faldón (con alero)', '=({B}/2+{alero})*SQRT(1+{pend}^2)', 'm')
p.calc('limatesa', 'Largo de cada limatesa (con alero)', '=SQRT(2*(({B}+2*{alero})/2)^2+({pend}*({B}+2*{alero})/2)^2)', 'm', 'Son 4 limatesas.')
p.calc('nt', 'Tijerales completos', '=IF({A}>{B},ROUNDUP(({A}-{B})/{sep},0)+1,1)', 'und', '', '0')
p.calc('equiv', 'Tijerales equivalentes', '={nt}+{medios}', 'und', 'Completos + medios tijerales (cada medio cuenta 0.5, y hay 2 extremos).', '0.0')
p.calc('planta', 'Área techada en planta', '={A}*{B}', 'm²')
p.calc('area_cob', 'Área de cobertura (con aleros)', '=({A}+2*{alero})*({B}+2*{alero})*SQRT(1+{pend}^2)', 'm²')
p.seccion('PERFILES (elige de la lista)')
p.perfil('pcs', 'Cordón superior', 'LAC-50X50X2.0', 'Perfiles de la plantilla «Casa a cuatro aguas 8 × 12 m» de Recursos Técnicos.')
p.perfil('pci', 'Cordón inferior', 'LAC-50X50X2.0')
p.perfil('pmo', 'Montantes', 'LAC-25X25X1.5')
p.perfil('pdi', 'Diagonales', 'LAC-25X25X1.5')
p.perfil('plim', 'Limatesas', 'LAC-100X50X3.0')
p.perfil('pco', 'Correas', 'LAC-50X25X1.5')
p.perfil('pvig', 'Viga perimetral (solera)', 'LAC-120X60X3.0')
p.perfil('pcol', 'Columnas', 'LAC-100X100X3.0')
p.perfil('par', 'Arriostres de cubierta', 'LAC-RED-26.7X1.5')
p.dato('cob', 'Cobertura', 'Aluzinc TR-4 Residencial e=0.35mm')
p.precios()
p.cerrar_datos('cob')
fijar(p, 'p_trans', 800)
dv = DataValidation(type='list', formula1='"Pratt,Howe,Warren,Fink"'); p.D.add_data_validation(dv); dv.add(p.ref['tipo'].replace('Datos!$B$', 'B'))
p.D.cell(int(p.ref['trasl'].split('$')[-1]), 2).value = 0.15
p.D.cell(int(p.ref['trasl'].split('$')[-1]), 4).value = 'En cuatro aguas los cortes en las limatesas dejan más merma (15 % a 20 %).'

PRATT = 'OR({tipo}="Pratt",{tipo}="Howe")'
T, r0, r1 = p.tabla('Tijeral', 'Medidas del tijeral (medio tijeral, desde el apoyo hasta la cumbrera)',
    'Altura de cada montante y largo de cada diagonal. Los medios tijerales usan la misma mitad.',
    ['Nudo', 'x desde el apoyo (m)', 'Altura del montante (m)', 'Montantes por tijeral', 'Diagonal del panel (m)'], 21, [
    lambda k, r: f'=IF({k}<={{n}},{k},"")',
    lambda k, r: f'=IF(A{r}="","",{{B}}/2*A{r}/{{n}})',
    lambda k, r: f'=IF(A{r}="","",{{h0}}+{{pend}}*B{r})',
    lambda k, r: (f'=IF({{h0}}>0,2,0)' if k == 0 else f'=IF(A{r}="","",IF(A{r}={{n}},1,IF({PRATT},2,0)))'),
    lambda k, r: (0 if k == 0 else f'=IF(A{r}="","",SQRT(({{B}}/2/{{n}})^2+IF({{tipo}}="Pratt",C{r},IF({{tipo}}="Howe",C{r-1},(C{r-1}+C{r})/2))^2))'),
], notas=['1. Traza el cordón inferior (ancho de la casa) en el piso.', '2. En cada x levanta la altura del montante.',
          '3. Une los nudos con las diagonales y arma el gálibo.', 'Pratt: diagonales hacia el centro, abajo. Howe: al revés. Warren y Fink: largo promedio (aproximado).'],
    anchos=[8, 14, 14, 13, 14])
tot = r1 + 1
T.cell(tot, 1, 'Por tijeral').font = F(bold=True)
T.cell(tot, 3, f'=SUMPRODUCT(C{r0}:C{r1},D{r0}:D{r1})'); T.cell(tot, 4, f'=SUM(D{r0}:D{r1})'); T.cell(tot, 5, f'=2*SUM(E{r0}:E{r1})')
for j in (3, 4, 5): T.cell(tot, j).font = F(bold=True); T.cell(tot, j).fill = fill('FDE3CF'); T.cell(tot, j).number_format = '0.00'
p.ref['mont_t'] = f'Tijeral!$C${tot}'; p.ref['diag_t'] = f'Tijeral!$E${tot}'

# Correas: anillos alrededor de los 4 faldones
C, c0, c1 = p.tabla('Correas', 'Correas por línea (las 4 aguas)',
    'Cada línea de correas da la vuelta a los 4 faldones; se acorta al subir hacia la cumbrera.',
    ['Línea', 'Distancia sobre el faldón (m)', 'Retiro en planta (m)', 'Largo de la línea (m)'], 41, [
    lambda k, r: f'=IF({k}*{{sepc}}<={{faldon}},{k}+1,"")',
    lambda k, r: f'=IF(A{r}="","",{k}*{{sepc}})',
    lambda k, r: f'=IF(A{r}="","",B{r}/SQRT(1+{{pend}}^2))',
    lambda k, r: f'=IF(A{r}="","",MAX(0,2*({{A}}+2*{{alero}}-2*C{r})+2*({{B}}+2*{{alero}}-2*C{r})))',
], notas=['La primera línea va en el borde del alero.', 'Cada línea suma los dos faldones largos (trapecios) y los dos de los extremos (triángulos).',
          'Corta cada correa en la limatesa con el ángulo del techo.'], anchos=[8, 16, 14, 16])
ct = c1 + 1
C.cell(ct, 1, 'Total').font = F(bold=True); C.cell(ct, 4, f'=SUM(D{c0}:D{c1})'); C.cell(ct, 1 + 1, f'=COUNT(A{c0}:A{c1})')
for j in (2, 4): C.cell(ct, j).font = F(bold=True); C.cell(ct, j).fill = fill('FDE3CF'); C.cell(ct, j).number_format = '0.00'
C.cell(ct, 2).number_format = '0 "líneas"'
p.ref['corr_m'] = f'Correas!$D${ct}'; p.ref['corr_n'] = f'Correas!$B${ct}'

p.metrado([
    ('Cordón superior (tijerales)', 'pcs', '=2*{equiv}', '={faldon}'),
    ('Cordón inferior (tijerales)', 'pci', '={equiv}', '={B}'),
    ('Montantes (metros por tijeral)', 'pmo', '={equiv}', '={mont_t}'),
    ('Diagonales (metros por tijeral)', 'pdi', '={equiv}', '={diag_t}'),
    ('Limatesas', 'plim', '=4', '={limatesa}'),
    ('Correas (largo promedio por línea)', 'pco', '={corr_n}', '={corr_m}/{corr_n}'),
    ('Viga perimetral (solera)', 'pvig', '=1', '=2*({A}+{B})'),
    ('Columnas', 'pcol', '={ncol}', '={hcol}'),
    ('Arriostres de cubierta (X)', 'par', '={panos}*4', '=SQRT({sep}^2+({faldon}/2)^2)'),
], [
    ('Cobertura', '={cob}', 'm²', '={area_cob}*(1+{trasl})', '=' + buscar(p.R['cob_tab'], '{cob}', 4)),
    ('Remates de cumbrera y limatesas', '', 'm', '={lcumbrera}+4*{limatesa}', '={p_remate}'),
    ('Fijaciones (perno J / autoperforante)', '', 'und', '=ROUNDUP({area_cob}*{fij_m2},0)', '={p_fij}'),
    ('Placas base con pernos de anclaje', '', 'und', '={ncol}', '={p_placa}'),
    ('Pintura (por kg de acero)', '', 'kg', '={kg}', '={p_pint}'),
])
p.presupuesto('Presupuesto del techo a cuatro aguas',
    '=CONCATENATE("Techo a cuatro aguas de ",TEXT({B},"0.00")," × ",TEXT({A},"0.00")," m · pendiente ",TEXT({pend},"0%")," · ",{nt}," tijerales + ",2*{medios}," medios")')
p.como_usar('Metrado, tijeral, correas y presupuesto de un techo a cuatro aguas. Compatible con el módulo Techos Metálicos de InnovApp.',
    'Tijeral y Correas', 'Medidas del tijeral para trazarlo en el piso, y el largo de cada línea de correas alrededor de las 4 aguas.',
    ['Cumbrera = largo − ancho (pendientes iguales).', 'Limatesa = √[2 × (ancho/2)² + (pendiente × ancho/2)²], con aleros.',
     'Área de cobertura = (largo + 2 aleros) × (ancho + 2 aleros) × √(1 + pendiente²).', 'Barras a comprar = metros × (1 + desperdicio) / 6 m, redondeado hacia arriba.'],
    'Techos a Dos y Cuatro Aguas')
p.guardar(sys.argv[1] if len(sys.argv) > 1 else 'Plantilla_Techo_Cuatro_Aguas_InnovApp.xlsx')
