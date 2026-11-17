import sys
from armar import *

p = Plantilla('Arcotecho (arco curvo de un solo tubo)', 'Llena solo las celdas amarillas (texto azul). Lo gris se calcula solo. Ejemplo cargado: patio techado de 10 × 20 m.')
p.catalogo()
p.obra('Ejemplo: I.E. San Martín', 'Patio techado de 10 × 20 m — Carabayllo')
p.seccion('GEOMETRÍA')
p.dato('L', 'Luz del arco (L)', 10, 'm', 'Distancia entre apoyos, entre ejes.', '0.00')
p.dato('largo', 'Largo del techo', 20, 'm', '', '0.00')
p.dato('hcol', 'Altura de muro o columna', 3.5, 'm', 'Hasta el arranque del arco.', '0.00')
p.dato('rel', 'Relación flecha / luz', 0.15, '× L', 'Arcos curvos: 0.10 a 0.20 L. Más flecha = arco más rígido.', '0.00')
p.calc('f', 'Flecha del arco (f)', '={L}*{rel}', 'm', 'Medida desde el arranque del arco.')
p.calc('cumbre', 'Altura en la cumbre', '={hcol}+{f}', 'm')
p.dato('sep', 'Separación entre arcos', 3, 'm', 'Arco de un solo tubo: normal 2.5 a 3.5 m.', '0.00')
p.dato('n', 'Tramos para el trazo', 12, 'und', 'Puntos para trazar y curvar el arco (máx. 40).', '0')
p.dato('sepc', 'Separación de correas', 1.2, 'm', 'Medida sobre el arco.', '0.00')
p.dato('ncol', 'Columnas metálicas por arco', 2, 'und', 'Pon 0 si los arcos apoyan en muros o vigas de concreto.', '0')
p.dato('panos', 'Paños arriostrados (cruces en X)', 2, 'paños', 'Mínimo los 2 paños extremos.', '0')
p.dato('volado', 'Volado de cobertura en cada frontis', 0.2, 'm', '', '0.00')
p.calc('na', 'Número de arcos', '=ROUNDUP({largo}/{sep},0)+1', 'und', '', '0')
p.calc('s', 'Largo del arco (desarrollo)', '=SQRT({L}^2+16*{f}^2)/2+{L}^2/(8*{f})*LN((4*{f}+SQRT({L}^2+16*{f}^2))/{L})', 'm', 'Largo exacto de la parábola (lo que mide el tubo y la cobertura).')
p.calc('planta', 'Área techada en planta', '={L}*{largo}', 'm²')
p.calc('area_cob', 'Área de cobertura (desarrollo)', '={s}*({largo}+2*{volado})', 'm²')
p.seccion('PERFILES (elige de la lista)')
p.perfil('parc', 'Arco (tubo curvado)', 'LAC-100X50X3.0', 'El tubo se curva en frío con roladora. Para luces mayores de 12 m usa la plantilla de nave parabólica (arco reticulado).')
p.perfil('ptir', 'Tirante horizontal', 'LAC-RED-48.3X2.0', 'Toma el empuje del arco para que no abra los apoyos.')
p.perfil('pco', 'Correas', 'LAC-60X40X2.0')
p.perfil('pcol', 'Columnas', 'LAC-100X100X3.0')
p.perfil('par', 'Arriostres de cubierta', 'LAC-RED-26.7X1.5')
p.dato('cob', 'Cobertura', 'Aluzinc TR-4 Estándar Ligero Perú e=0.30mm')
p.precios([('p_rol', 'Rolado (curvado) del tubo', 6, 'S/ por m', 'Si lo manda a rolar fuera del taller.', '"S/ "#,##0.00')])
p.cerrar_datos('cob')
fijar(p, 'p_trans', 800)

T, r0, r1 = p.tabla('Trazo', 'Tabla de trazo del arco', 'Ordenadas para trazar y curvar el arco. x desde el apoyo izquierdo; y desde la cuerda (arranque del arco).',
    ['Punto', 'x (m)', 'y desde la cuerda (m)', 'Altura desde el piso (m)', 'Pendiente (°)'], 41, [
    lambda k, r: f'=IF({k}<={{n}},{k},"")',
    lambda k, r: f'=IF(A{r}="","",{{L}}*A{r}/{{n}})',
    lambda k, r: f'=IF(A{r}="","",4*{{f}}*B{r}*({{L}}-B{r})/{{L}}^2)',
    lambda k, r: f'=IF(A{r}="","",{{hcol}}+C{r})',
    lambda k, r: f'=IF(A{r}="","",DEGREES(ATAN(4*{{f}}*({{L}}-2*B{r})/{{L}}^2)))',
], notas=['1. Tira una cuerda de apoyo a apoyo: es el eje x.', '2. Marca cada x y levanta la ordenada y: es la curva del arco.',
          '3. Pide al rolador esta curva (o la flecha y la luz) y compara el primer arco con el trazo.', '4. Usa el primer arco como gálibo para los demás.'],
    anchos=[8, 10, 14, 14, 12])

p.metrado([
    ('Arcos', 'parc', '={na}', '={s}'),
    ('Tirantes horizontales', 'ptir', '={na}', '={L}'),
    ('Correas', 'pco', '=ROUNDUP({s}/{sepc},0)+1', '={largo}+2*{volado}'),
    ('Columnas', 'pcol', '={na}*{ncol}', '={hcol}'),
    ('Arriostres de cubierta (X)', 'par', '={panos}*8', '=SQRT({sep}^2+({s}/4)^2)'),
], [
    ('Cobertura', '={cob}', 'm²', '={area_cob}*(1+{trasl})', '=' + buscar(p.R['cob_tab'], '{cob}', 4)),
    ('Rolado (curvado) de los arcos', '', 'm', '={na}*{s}', '={p_rol}'),
    ('Fijaciones (perno J / autoperforante)', '', 'und', '=ROUNDUP({area_cob}*{fij_m2},0)', '={p_fij}'),
    ('Tensores de pared 5/8" con templador', '', 'und', '=IF({ncol}>0,{panos}*4,0)', '={p_tensor}'),
    ('Placas base con pernos de anclaje', '', 'und', '={na}*MAX({ncol},2)', '={p_placa}'),
    ('Pintura (por kg de acero)', '', 'kg', '={kg}', '={p_pint}'),
])
p.presupuesto('Presupuesto del arcotecho',
    '=CONCATENATE("Arcotecho de ",TEXT({L},"0.00")," × ",TEXT({largo},"0.00")," m · flecha ",TEXT({f},"0.00")," m · ",{na}," arcos")')
p.como_usar('Metrado, trazo y presupuesto de un arcotecho de un solo tubo curvado (patios, coliseos pequeños, cocheras grandes). Compatible con Techos Metálicos de InnovApp.',
    'Trazo', 'Ordenadas del arco para trazarlo en el piso y controlar el rolado del tubo.',
    ['Arco: y = 4·f·x·(L − x) / L².', 'Largo del arco = ½·√(L² + 16f²) + L²/(8f) · ln[(4f + √(L² + 16f²)) / L].',
     'Cada arco lleva un tirante horizontal que toma el empuje.', 'Barras a comprar = metros × (1 + desperdicio) / 6 m, redondeado hacia arriba.'],
    'Naves Parabólicas')
p.guardar(sys.argv[1] if len(sys.argv) > 1 else 'Plantilla_Arcotecho_InnovApp.xlsx')
