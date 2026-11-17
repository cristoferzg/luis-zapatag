import sys
from armar import *

p = Plantilla('Pérgola metálica', 'Llena solo las celdas amarillas (texto azul). Lo gris se calcula solo. Ejemplo cargado: terraza de 8 × 12 m.')
p.catalogo()
p.obra('Ejemplo: Sra. Lucía Paredes', 'Terraza de 8 × 12 m — La Molina')
p.seccion('GEOMETRÍA')
p.dato('A', 'Ancho (luz de las vigas secundarias)', 8, 'm', 'Distancia entre las dos líneas de columnas, entre ejes.', '0.00')
p.dato('largo', 'Largo (a lo largo de las vigas principales)', 12, 'm', '', '0.00')
p.dato('hcol', 'Altura de la columna baja', 2.7, 'm', 'Altura libre bajo la viga principal del lado bajo.', '0.00')
p.dato('pend', 'Pendiente (en el sentido del ancho)', 0.05, '%', 'Sin cobertura puede ir plana (0 %). Con policarbonato: mínimo 5 %.', '0%')
p.dato('sepcol', 'Separación entre columnas', 4, 'm', 'A lo largo de cada viga principal. Normal: 3 a 4 m.', '0.00')
p.dato('sepv', 'Separación de vigas secundarias', 0.8, 'm', 'Con policarbonato, la que pida su ficha (6 mm: suele ser menos de 1 m). Sin cobertura: 0.60 a 1.20 m.', '0.00')
p.dato('vs', 'Volado de vigas secundarias (cada lado)', 0.4, 'm', 'Lo que salen por fuera de las vigas principales.', '0.00')
p.dato('vp', 'Volado de vigas principales (cada extremo)', 0.3, 'm', '', '0.00')
p.dato('conlist', '¿Lleva listones de sombra?', 'No', '', 'Sí / No. Listones a lo largo, encima de las vigas secundarias. Para sombra sin cobertura.')
p.dato('sepl', 'Separación de listones', 0.25, 'm', 'Más juntos = más sombra.', '0.00')
p.dato('concob', '¿Lleva cobertura?', 'Sí', '', 'Sí / No. Policarbonato, malla raschel, lona, etc. (elige abajo).')
p.calc('hcolA', 'Altura de la columna alta', '={hcol}+{pend}*{A}', 'm')
p.calc('lvs', 'Largo de cada viga secundaria', '=({A}+2*{vs})*SQRT(1+{pend}^2)', 'm')
p.calc('lvp', 'Largo de cada viga principal', '={largo}+2*{vp}', 'm')
p.calc('ncl', 'Columnas por línea', '=ROUNDUP({largo}/{sepcol},0)+1', 'und', '', '0')
p.calc('nvs', 'Número de vigas secundarias', '=ROUNDUP({lvp}/{sepv},0)+1', 'und', '', '0')
p.calc('nlis', 'Número de listones', '=IF({conlist}="Sí",ROUNDUP({lvs}/{sepl},0)+1,0)', 'und', '', '0')
p.calc('planta', 'Área en planta (sin volados)', '={A}*{largo}', 'm²')
p.calc('area_cob', 'Área de la pérgola (con volados)', '={lvs}*{lvp}', 'm²', 'Se usa para el montaje y, si lleva, la cobertura.')
p.seccion('PERFILES (elige de la lista)')
p.perfil('pcol', 'Columnas', 'LAC-100X100X2.5', 'Referencia para luces de hasta 8 m. Verifica con la memoria de cálculo o un ingeniero.')
p.perfil('pvp', 'Vigas principales', 'LAC-150X50X2.0')
p.perfil('pvs', 'Vigas secundarias', 'LAC-100X50X1.5')
p.perfil('pli', 'Listones', 'LAC-50X25X1.5')
p.dato('cob', 'Cobertura', 'Policarbonato Alveolar 6mm Traslúcido con Filtro UV')
p.precios([('p_can', 'Canaleta con soportes', 35, 'S/ por m', 'Solo si lleva cobertura, en el lado bajo.', '"S/ "#,##0.00'),
           ('p_baj', 'Bajada de agua (tubo PVC)', 60, 'S/ c/u', '', '"S/ "#,##0.00'),
           ('nbaj', 'Bajadas de agua', 2, 'und', '', '0'),
           ('p_perfil', 'Perfil de cierre y cinta para policarbonato', 9, 'S/ por m', 'Bordes del policarbonato alveolar.', '"S/ "#,##0.00')])
p.cerrar_datos('cob')
for clave in ('conlist', 'concob'):
    dv = DataValidation(type='list', formula1='"Sí,No"'); p.D.add_data_validation(dv); dv.add(p.ref[clave].replace('Datos!$B$', 'B'))
fijar(p, 'p_trans', 400); fijar(p, 'p_mont', 15, 'Por m² de pérgola.'); fijar(p, 'p_remate', 0, 'La pérgola no lleva cumbrera.')

T, r0, r1 = p.tabla('Replanteo', 'Replanteo de vigas secundarias',
    'Ubicación de cada viga secundaria sobre la viga principal, medida desde el borde del volado.',
    ['Línea', 'Distancia desde el borde (m)', '¿Cae sobre una columna?'], 41, [
    lambda k, r: f'=IF({k}<{{nvs}},{k}+1,"")',
    lambda k, r: f'=IF(A{r}="","",MIN({k}*{{lvp}}/({{nvs}}-1),{{lvp}}))',
    lambda k, r: f'=IF(A{r}="","",IF(ABS(MOD(B{r}-{{vp}}+0.0001,{{sepcol}}))<0.05,"Sí: refuerza la unión",""))',
], notas=['Las vigas secundarias se reparten parejo en todo el largo, con volados.', 'Marca las posiciones sobre la viga principal con tiza antes de soldar.',
          'Donde cae sobre una columna, la unión recibe más carga: suelda con cuidado o agrega cartela.',
          'Los listones van encima, a lo largo, con la separación de la hoja Datos.'], anchos=[8, 18, 22])

p.metrado([
    ('Columnas bajas', 'pcol', '={ncl}', '={hcol}'),
    ('Columnas altas', 'pcol', '={ncl}', '={hcolA}'),
    ('Vigas principales (2 líneas)', 'pvp', '=2', '={lvp}'),
    ('Vigas secundarias', 'pvs', '={nvs}', '={lvs}'),
    ('Listones de sombra', 'pli', '={nlis}', '={lvp}'),
], [
    ('Cobertura', '={cob}', 'm²', '=IF({concob}="Sí",{area_cob}*(1+{trasl}),0)', '=' + buscar(p.R['cob_tab'], '{cob}', 4)),
    ('Perfil de cierre del policarbonato', '', 'm', '=IF({concob}="Sí",2*({lvs}+{lvp}),0)', '={p_perfil}'),
    ('Canaleta con soportes', '', 'm', '=IF({concob}="Sí",{lvp},0)', '={p_can}'),
    ('Bajadas de agua', '', 'und', '=IF({concob}="Sí",{nbaj},0)', '={p_baj}'),
    ('Fijaciones (autoperforante con arandela)', '', 'und', '=IF({concob}="Sí",ROUNDUP({area_cob}*{fij_m2},0),0)', '={p_fij}'),
    ('Placas base con pernos de anclaje', '', 'und', '=2*{ncl}', '={p_placa}'),
    ('Pintura (por kg de acero)', '', 'kg', '={kg}', '={p_pint}'),
])
p.presupuesto('Presupuesto de la pérgola metálica',
    '=CONCATENATE("Pérgola de ",TEXT({A},"0.00")," × ",TEXT({largo},"0.00")," m · ",2*{ncl}," columnas · ",{nvs}," vigas secundarias",IF({concob}="Sí"," · con cobertura",""))')
p.como_usar('Metrado, replanteo y presupuesto de una pérgola metálica (terrazas, cocheras, jardines), con o sin listones y cobertura. Compatible con Techos Metálicos de InnovApp.',
    'Replanteo', 'Ubicación de cada viga secundaria sobre la viga principal, para marcarlas antes de soldar.',
    ['Viga secundaria = (ancho + 2 volados) × √(1 + pendiente²).', 'Vigas secundarias = largo con volados / separación (redondeado hacia arriba) + 1.',
     'Listones = largo de la viga secundaria / separación + 1 (si lleva).', 'Barras a comprar = metros × (1 + desperdicio) / 6 m, redondeado hacia arriba.',
     'Policarbonato: cara con protección UV hacia el sol, alveolos en el sentido de la pendiente y bordes cerrados con perfil y cinta.'],
    'Techos a Dos y Cuatro Aguas')
p.guardar(sys.argv[1] if len(sys.argv) > 1 else 'Plantilla_Pergola_Metalica_InnovApp.xlsx')
