import sys
from armar import *

p = Plantilla('Techo mariposa', 'Llena solo las celdas amarillas (texto azul). Lo gris se calcula solo. Ejemplo cargado: taller de 10 × 18 m.')
p.catalogo()
p.obra('Ejemplo: Taller Huamán', 'Taller de 10 × 18 m — Villa El Salvador')
p.seccion('GEOMETRÍA')
p.dato('L', 'Luz del tijeral (L)', 10, 'm', 'Distancia entre ejes de columnas.', '0.00')
p.dato('largo', 'Largo del techo', 18, 'm', '', '0.00')
p.dato('hcol', 'Altura de columna', 4.5, 'm', 'Hasta el apoyo del tijeral.', '0.00')
p.dato('pend', 'Pendiente de cada faldón', 0.15, '%', 'Los dos faldones caen hacia el canal central. Revisa la pendiente mínima de tu cobertura.', '0%')
p.dato('h0', 'Peralte del tijeral en el canal central', 0.4, 'm', 'Altura mínima en el centro: deja espacio para el canal y su bajada. Normal: 0.30 a 0.60 m.', '0.00')
p.dato('alero', 'Alero (medida horizontal, cada lado)', 0.3, 'm', 'En los bordes altos.', '0.00')
p.dato('sep', 'Separación entre tijerales', 4, 'm', 'Normal: 3 a 5 m.', '0.00')
p.dato('n', 'Paneles por faldón', 4, 'und', 'Tramos del cordón inferior en cada mitad del tijeral (máx. 20).', '0')
p.dato('sepc', 'Separación de correas', 1.2, 'm', 'Medida sobre el faldón. Mejor si cae en los nudos del cordón superior.', '0.00')
p.dato('panos', 'Paños arriostrados (cruces en X)', 2, 'paños', 'Mínimo los 2 paños extremos.', '0')
p.dato('volado', 'Volado de cobertura en cada frontis', 0.2, 'm', '', '0.00')
p.calc('ang', 'Ángulo de cada faldón', '=DEGREES(ATAN({pend}))', '°', '', '0.0')
p.calc('hap', 'Altura del tijeral en el apoyo', '={h0}+{pend}*{L}/2', 'm', 'El tijeral es más alto en los bordes y más bajo en el centro.')
p.calc('hcanal', 'Altura del canal central desde el piso', '={hcol}+{hap}-{h0}', 'm', 'Fondo del canal (cordón superior en el centro).')
p.calc('faldon', 'Largo del faldón (con alero)', '=({L}/2+{alero})*SQRT(1+{pend}^2)', 'm', 'Largo de la plancha de cobertura de cada lado.')
p.calc('nt', 'Número de tijerales', '=ROUNDUP({largo}/{sep},0)+1', 'und', '', '0')
p.calc('planta', 'Área techada en planta', '={L}*{largo}', 'm²')
p.calc('area_cob', 'Área de cobertura', '=2*{faldon}*({largo}+2*{volado})', 'm²')
p.seccion('PERFILES (elige de la lista)')
p.perfil('pcs', 'Cordón superior', 'LAC-50X50X2.0', 'Referencia para luces de 8 a 12 m. Verifica con la memoria de cálculo de Techos Metálicos.')
p.perfil('pci', 'Cordón inferior', 'LAC-50X50X2.0')
p.perfil('pmo', 'Montantes', 'LAC-25X25X1.5')
p.perfil('pdi', 'Diagonales', 'LAC-30X30X1.5')
p.perfil('pco', 'Correas', 'LAC-100X50X1.2')
p.perfil('pcol', 'Columnas', 'LAC-125X125X4.5')
p.perfil('par', 'Arriostres de cubierta', 'LAC-RED-48.3X2.0')
p.dato('cob', 'Cobertura', 'Aluzinc TR-4 Estándar Ligero Perú e=0.30mm')
p.precios([('p_can', 'Canal central (plancha plegada) con soportes', 55, 'S/ por m', 'Más ancho que una canaleta normal: recibe el agua de los dos faldones.', '"S/ "#,##0.00'),
           ('p_baj', 'Bajada de agua (tubo PVC)', 60, 'S/ c/u', '', '"S/ "#,##0.00'),
           ('nbaj', 'Bajadas de agua', 3, 'und', 'En los extremos del canal y una al medio si el techo es largo.', '0')])
p.cerrar_datos('cob')

# Nudos de medio tijeral (desde el apoyo alto hasta el canal central)
T, r0, r1 = p.tabla('Tijeral', 'Medidas del tijeral mariposa (medio tijeral, desde el apoyo hasta el canal)',
    'Altura de cada montante y largo de cada diagonal. Sirve para trazar el tijeral en el piso y para el metrado.',
    ['Nudo', 'x desde el apoyo (m)', 'Altura del montante (m)', 'Montantes por tijeral', 'Diagonal del panel (m)', 'Largo del cordón superior hasta el nudo (m)'], 21, [
    lambda k, r: f'=IF({k}<={{n}},{k},"")',
    lambda k, r: f'=IF(A{r}="","",{{L}}/2*A{r}/{{n}})',
    lambda k, r: f'=IF(A{r}="","",{{h0}}+{{pend}}*({{L}}/2-B{r}))',
    lambda k, r: (f'=2' if k == 0 else f'=IF(A{r}="","",IF(A{r}={{n}},1,2))'),
    lambda k, r: (0 if k == 0 else f'=IF(A{r}="","",SQRT(({{L}}/2/{{n}})^2+MAX(C{r-1},C{r})^2))'),
    lambda k, r: f'=IF(A{r}="","",B{r}*SQRT(1+{{pend}}^2))',
], notas=['1. Traza en el piso la línea del cordón inferior (luz L), recta.', '2. En cada x levanta la altura del montante: el cordón superior BAJA hacia el centro.',
          '3. El montante central (canal) es el más bajo: es el peralte del canal.', '4. Une los nudos con las diagonales; el largo de la tabla es el del lado más alto del panel (metrado con margen).',
          '5. Arma el primero sobre esa plantilla (gálibo) y fabrica los demás iguales.'],
    anchos=[8, 14, 14, 13, 14, 16])
tot = r1 + 1
T.cell(tot, 1, 'Por tijeral').font = F(bold=True)
T.cell(tot, 3, f'=SUMPRODUCT(C{r0}:C{r1},D{r0}:D{r1})'); T.cell(tot, 4, f'=SUM(D{r0}:D{r1})'); T.cell(tot, 5, f'=2*SUM(E{r0}:E{r1})')
T.cell(tot + 1, 1, 'Fila «Por tijeral»: C = metros de montantes, D = cantidad de montantes, E = metros de diagonales (las dos mitades).').font = F(size=9, italic=True, color='5B6573')
for j in (3, 4, 5): T.cell(tot, j).font = F(bold=True); T.cell(tot, j).fill = fill('FDE3CF'); T.cell(tot, j).number_format = '0.00'
p.ref['mont_t'] = f'Tijeral!$C${tot}'; p.ref['diag_t'] = f'Tijeral!$E${tot}'

p.metrado([
    ('Cordón superior (2 por tijeral)', 'pcs', '=2*{nt}', '={faldon}'),
    ('Cordón inferior', 'pci', '={nt}', '={L}'),
    ('Montantes (metros por tijeral)', 'pmo', '={nt}', '={mont_t}'),
    ('Diagonales (metros por tijeral)', 'pdi', '={nt}', '={diag_t}'),
    ('Correas', 'pco', '=2*(ROUNDUP({faldon}/{sepc},0)+1)', '={largo}+2*{volado}'),
    ('Columnas', 'pcol', '=2*{nt}', '={hcol}'),
    ('Arriostres de cubierta (X)', 'par', '={panos}*8', '=SQRT({sep}^2+({faldon}/2)^2)'),
], [
    ('Cobertura', '={cob}', 'm²', '={area_cob}*(1+{trasl})', '=' + buscar(p.R['cob_tab'], '{cob}', 4)),
    ('Remate de los bordes altos', '', 'm', '=2*({largo}+2*{volado})', '={p_remate}'),
    ('Canal central con soportes', '', 'm', '={largo}+2*{volado}', '={p_can}'),
    ('Bajadas de agua', '', 'und', '={nbaj}', '={p_baj}'),
    ('Fijaciones (perno J / autoperforante)', '', 'und', '=ROUNDUP({area_cob}*{fij_m2},0)', '={p_fij}'),
    ('Tensores de pared 5/8" con templador', '', 'und', '={panos}*4', '={p_tensor}'),
    ('Placas base con pernos de anclaje', '', 'und', '=2*{nt}', '={p_placa}'),
    ('Pintura (por kg de acero)', '', 'kg', '={kg}', '={p_pint}'),
])
p.presupuesto('Presupuesto del techo mariposa',
    '=CONCATENATE("Techo mariposa de ",TEXT({L},"0.00")," × ",TEXT({largo},"0.00")," m · pendiente ",TEXT({pend},"0%")," · ",{nt}," tijerales · canal central")')
p.como_usar('Metrado, medidas del tijeral y presupuesto de un techo mariposa (dos faldones que caen a un canal central). Compatible con Techos Metálicos de InnovApp.',
    'Tijeral', 'Altura de cada montante y largo de cada diagonal del tijeral mariposa: para trazarlo en el piso y armar el gálibo.',
    ['Altura en el apoyo = peralte en el canal + pendiente × L/2.', 'Largo del faldón = (L/2 + alero) × √(1 + pendiente²).',
     'Montante a x del apoyo = peralte en el canal + pendiente × (L/2 − x).', 'Barras a comprar = metros × (1 + desperdicio) / 6 m, redondeado hacia arriba.',
     'El canal central recibe el agua de TODO el techo: dale buena sección, bajadas suficientes y límpialo antes de las lluvias.'],
    'Techos a Dos y Cuatro Aguas')
p.guardar(sys.argv[1] if len(sys.argv) > 1 else 'Plantilla_Techo_Mariposa_InnovApp.xlsx')
