import sys
from armar import *

p = Plantilla('Techo a una agua', 'Llena solo las celdas amarillas (texto azul). Lo gris se calcula solo. Ejemplo cargado: cochera de 5 × 6 m.')
p.catalogo()
p.obra('Ejemplo: Sr. Carlos Mendoza', 'Cochera de 5 × 6 m — San Juan de Lurigancho')
p.seccion('GEOMETRÍA')
p.dato('L', 'Fondo (en el sentido de la caída del agua)', 5, 'm', 'Distancia entre la columna baja y la alta, entre ejes.', '0.00')
p.dato('largo', 'Frente del techo', 6, 'm', '', '0.00')
p.dato('hb', 'Altura de la columna baja', 2.4, 'm', 'Lado por donde cae el agua (canaleta).', '0.00')
p.dato('pend', 'Pendiente', 0.10, '%', 'Aluzinc TR-4: desde 10 %. Policarbonato: desde 10 %. Revisa la ficha técnica.', '0%')
p.dato('alero', 'Alero (medida horizontal, cada lado)', 0.3, 'm', 'Se suma en el lado bajo y en el alto.', '0.00')
p.dato('sep', 'Separación entre pórticos', 3, 'm', 'Pórtico = viga inclinada + 2 columnas. Normal: 2.5 a 4 m.', '0.00')
p.dato('sepc', 'Separación de correas', 1.0, 'm', 'Medida sobre la viga.', '0.00')
p.dato('panos', 'Paños arriostrados (cruces en X)', 1, 'paños', '', '0')
p.dato('volado', 'Volado de cobertura a los costados', 0.15, 'm', '', '0.00')
p.calc('ha', 'Altura de la columna alta', '={hb}+{pend}*{L}', 'm')
p.calc('ang', 'Ángulo del techo', '=DEGREES(ATAN({pend}))', '°', '', '0.0')
p.calc('viga', 'Largo de la viga inclinada (con aleros)', '=({L}+2*{alero})*SQRT(1+{pend}^2)', 'm', 'También es el largo de la plancha de cobertura.')
p.calc('np', 'Número de pórticos', '=ROUNDUP({largo}/{sep},0)+1', 'und', '', '0')
p.calc('planta', 'Área techada en planta', '={L}*{largo}', 'm²')
p.calc('area_cob', 'Área de cobertura', '={viga}*({largo}+2*{volado})', 'm²')
p.seccion('PERFILES (elige de la lista)')
p.perfil('pvi', 'Vigas inclinadas', 'LAC-100X50X2.0', 'Para fondos mayores de 6 m conviene un tijeral: usa la plantilla de dos aguas o consulta la memoria de cálculo.')
p.perfil('pco', 'Correas', 'LAC-60X40X2.0')
p.perfil('pcol', 'Columnas', 'LAC-100X100X2.5')
p.perfil('pvl', 'Vigas de amarre (frente bajo y alto)', 'LAC-80X40X2.0')
p.perfil('par', 'Arriostres de cubierta', 'LAC-RED-26.7X1.5')
p.dato('cob', 'Cobertura', 'Aluzinc TR-4 Estándar Ligero Perú e=0.30mm')
p.precios([('p_can', 'Canaleta con soportes', 35, 'S/ por m', 'En el lado bajo.', '"S/ "#,##0.00'),
           ('p_baj', 'Bajada de agua (tubo PVC)', 60, 'S/ c/u', '', '"S/ "#,##0.00'),
           ('nbaj', 'Bajadas de agua', 2, 'und', '', '0')])
p.cerrar_datos('cob')
fijar(p, 'p_trans', 300)

T, r0, r1 = p.tabla('Pórtico', 'Medidas del pórtico', 'Puntos de la viga inclinada: ubicación de cada correa y su altura desde el piso.',
    ['Correa', 'Distancia sobre la viga (m)', 'x en planta desde el borde bajo (m)', 'Altura desde el piso (m)'], 31, [
    lambda k, r: f'=IF({k}*{{sepc}}<={{viga}},{k}+1,"")',
    lambda k, r: f'=IF(A{r}="","",{k}*{{sepc}})',
    lambda k, r: f'=IF(A{r}="","",B{r}/SQRT(1+{{pend}}^2))',
    lambda k, r: f'=IF(A{r}="","",{{hb}}-{{pend}}*{{alero}}+{{pend}}*C{r})',
], notas=['La primera correa va en el borde del alero bajo.', 'Marca las correas sobre la viga antes de montarla.',
          'Revisa que la última quede a menos de 15 cm del borde alto.'], anchos=[8, 16, 18, 16])
tot = r1 + 1
T.cell(tot, 1, 'Líneas de correas').font = F(bold=True); T.cell(tot, 2, f'=COUNT(A{r0}:A{r1})'); T.cell(tot, 2).font = F(bold=True); T.cell(tot, 2).fill = fill('FDE3CF')
p.ref['ncorr'] = f'Pórtico!$B${tot}'.replace('Pórtico!', "'Pórtico'!")

p.metrado([
    ('Vigas inclinadas', 'pvi', '={np}', '={viga}'),
    ('Correas', 'pco', '={ncorr}', '={largo}+2*{volado}'),
    ('Columnas bajas', 'pcol', '={np}', '={hb}'),
    ('Columnas altas', 'pcol', '={np}', '={ha}'),
    ('Vigas de amarre (frente bajo y alto)', 'pvl', '=2', '={largo}'),
    ('Arriostres de cubierta (X)', 'par', '={panos}*2', '=SQRT({sep}^2+{viga}^2)'),
], [
    ('Cobertura', '={cob}', 'm²', '={area_cob}*(1+{trasl})', '=' + buscar(p.R['cob_tab'], '{cob}', 4)),
    ('Remate del borde alto', '', 'm', '={largo}+2*{volado}', '={p_remate}'),
    ('Canaleta con soportes', '', 'm', '={largo}+2*{volado}', '={p_can}'),
    ('Bajadas de agua', '', 'und', '={nbaj}', '={p_baj}'),
    ('Fijaciones (perno J / autoperforante)', '', 'und', '=ROUNDUP({area_cob}*{fij_m2},0)', '={p_fij}'),
    ('Placas base con pernos de anclaje', '', 'und', '=2*{np}', '={p_placa}'),
    ('Pintura (por kg de acero)', '', 'kg', '={kg}', '={p_pint}'),
])
p.presupuesto('Presupuesto del techo a una agua',
    '=CONCATENATE("Techo a una agua de ",TEXT({L},"0.00")," × ",TEXT({largo},"0.00")," m · pendiente ",TEXT({pend},"0%")," · ",{np}," pórticos")')
p.como_usar('Metrado, ubicación de correas y presupuesto de un techo a una agua (cocheras, patios, terrazas). Compatible con Techos Metálicos de InnovApp.',
    'Pórtico', 'Ubicación de cada correa sobre la viga inclinada y su altura desde el piso.',
    ['Columna alta = columna baja + pendiente × fondo.', 'Largo de la viga = (fondo + 2 aleros) × √(1 + pendiente²).',
     'Pórticos = frente / separación (redondeado hacia arriba) + 1.', 'Barras a comprar = metros × (1 + desperdicio) / 6 m, redondeado hacia arriba.'],
    'Techos a Dos y Cuatro Aguas')
p.guardar(sys.argv[1] if len(sys.argv) > 1 else 'Plantilla_Techo_Una_Agua_InnovApp.xlsx')
