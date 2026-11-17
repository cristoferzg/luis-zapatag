"""Naves Parabólicas · Clase 13: Mantenimiento de la nave (cierre del curso)."""
from sold_comun import *

CURSO = 'NAVES PARABÓLICAS · CLASE 13'
ETAPAS_NAV_AV = ['Luces grandes', 'Luz y ventilación', 'Cerramientos', 'Mantenimiento']
E = []

# 0. Gancho
E.append(dict(antes=0.5, frases=[
  'Una gotera pequeña hoy...',
  '...es óxido en la correa el próximo año, y una plancha perdida después. Las naves no fallan de golpe: fallan por falta de cuidado.',
  'Hoy aprendes a mantener una nave, y a convertir ese cuidado en un trabajo que se cobra todos los años. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Una gotera hoy...', 'es óxido mañana', 13, 'MANTENIMIENTO', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="1" style="position:absolute;left:1260px;top:300px;font-size:200px">💧</div>')))

# 1. Mapa
E.append(escena_obra(3, [
  'Llegamos a la última clase del curso.',
  'Hoy: mantenimiento. Dónde falla una nave, cómo repararla, y cómo venderle al cliente un plan para cuidarla.',
], 'Hoy: <span class="nar">mantenimiento</span>', ETAPAS_NAV_AV, 'Módulo avanzado', cab=''))

# 2. Dónde falla
E.append(dict(frases=[
  'Una nave falla casi siempre en los mismos seis puntos.',
  'Las canaletas y bajadas tapadas, que rebalsan y mojan la estructura.',
  'Los pernos autoperforantes, cuando la arandela de jebe se reseca y deja pasar agua. Y los traslapes de las planchas.',
  'Las bases de las columnas, donde se junta agua y tierra.',
  'Las soldaduras hechas en obra, que es donde empieza el óxido. Y los tensores, que se aflojan con el tiempo.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 50), (4, 1.0, 50, 50)], html=titulo('Dónde <span class="nar">falla</span> una nave', top=100) + tarjetas([
  ('🌧️', 'Canaletas', 'Tapadas,<br>rebalsan'), ('🔩', 'Pernos', 'Arandela<br>reseca'), ('🧩', 'Traslapes', 'Sello<br>vencido'),
  ('🧱', 'Bases', 'Agua y tierra<br>en la placa'), ('🔥', 'Soldaduras de obra', 'Primer punto<br>de óxido'), ('🪢', 'Tensores', 'Se<br>aflojan')],
  lambda i: [1, 2, 2, 3, 4, 4][i], top=230, cols=3, alto=230, izq=260)))

# 3. Goteras
E.append(dict(frases=[
  'Empecemos por las goteras. Para encontrarlas, entra a la nave en un día de sol: cada agujero o perno flojo se ve como un punto de luz. Y busca manchas de óxido en las correas.',
  'Si haces la prueba con manguera, moja de abajo hacia arriba, por franjas, con alguien adentro mirando. Si mojas todo de golpe, no sabes de dónde viene.',
  'Para repararla: cambia el perno por uno nuevo con su arandela, y en los traslapes, sella con cinta butílica.',
  'La silicona sola encima de la plancha es un parche: al sol se cuartea, y la gotera vuelve.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Encontrar y <span class="nar">reparar goteras</span>', top=100) + lista([
  ('☀️', 'Día de sol, desde adentro: <b class="nar">puntos de luz</b> y manchas de óxido'), ('🚿', 'Manguera <b class="nar">de abajo hacia arriba</b>, por franjas'),
  ('🔩', 'Perno nuevo con arandela · <b class="nar">cinta butílica</b> en traslapes'), ('⚠️', 'Silicona sola = parche que se cuartea')],
  lambda i: [0, 1, 2, 3][i], top=250, izq=290, der=290, tam=32)))

# 4. Óxido: tres niveles
E.append(dict(frases=[
  'Ahora, el óxido. Lo que haces depende de qué tan avanzado está.',
  'Nivel uno: manchas superficiales. Lija o escobilla, limpia, y repinta con anticorrosivo y acabado.',
  'Nivel dos: óxido con escamas, que se levanta. Escobilla hasta el metal limpio, y dale las manos completas de base y acabado.',
  'Nivel tres: el perfil ya perdió espesor o tiene agujeros. Eso ya no se pinta: avisa al ingeniero, porque la pieza se refuerza o se cambia.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=titulo('El óxido: <span class="nar">tres niveles</span>', top=100) + tabla(
  ['Nivel', 'Cómo se ve', 'Qué hacer'],
  [['1 · Superficial', 'Manchas', 'Limpiar y repintar'], ['2 · Con escamas', 'Se levanta en láminas', 'Escobillar a metal limpio + base + acabado'],
   ['3 · Pérdida de espesor', 'Huecos, perfil delgado', '<b style="color:#ff6b6b">Avisar al ingeniero: reforzar o cambiar</b>']],
  lambda i: i + 1, top=250, izq=200, der=200, tam=30)))

# 5. Bases de columnas
E.append(dict(frases=[
  'Un punto que se olvida: la base de las columnas.',
  'Si el piso de la nave se rellenó por encima de la placa base, la placa queda enterrada, y la tierra húmeda la come por debajo.',
  'La placa y los pernos deben quedar sobre un pedestal de concreto, por encima del piso terminado, limpios y a la vista.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Las <span class="nar">bases</span> de las columnas', top=100) + '''
<svg style="position:absolute;left:330px;top:260px" width="1260" height="440" viewBox="0 0 1260 440">
 <g class="ap" data-en="1"><rect x="40" y="250" width="500" height="150" fill="#6b5240"/><rect x="230" y="40" width="60" height="230" fill="#9aa6b0"/><rect x="190" y="260" width="140" height="18" fill="#c0392b"/>
  <text x="290" y="430" fill="#ff6b6b" font-size="30" font-weight="900" text-anchor="middle">placa enterrada ✕</text></g>
 <g class="ap" data-en="2"><rect x="700" y="300" width="500" height="100" fill="#6b5240"/><rect x="860" y="200" width="180" height="110" fill="#8d99a6"/><rect x="920" y="20" width="60" height="170" fill="#9aa6b0"/><rect x="880" y="182" width="140" height="18" fill="#7ee08a"/>
  <text x="950" y="430" fill="#7ee08a" font-size="30" font-weight="900" text-anchor="middle">pedestal sobre el piso ✓</text></g>
</svg>'''))

# 6. Seguridad en el techo
E.append(dict(frases=[
  'Antes de subir al techo, la seguridad. Arnés, siempre enganchado a una línea de vida.',
  'Pisa solo sobre las líneas de pernos, que es donde están las correas. Entre correas, la plancha se dobla.',
  'Y nunca pises una claraboya de policarbonato: no aguanta a una persona. Las caídas a través de claraboyas son de los accidentes más graves en techos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('Seguridad <span class="nar">en el techo</span>', top=100) + tarjetas([
  ('🦺', 'Arnés + línea de vida', 'Siempre<br>enganchado'), ('👣', 'Sobre las correas', 'Pisa en la línea<br>de pernos'), ('🚫', 'Nunca la claraboya', 'El policarbonato<br>no te aguanta')],
  lambda i: i, top=260, cols=3, alto=320, izq=230)))

# 7. Plan de mantenimiento
E.append(dict(frases=[
  'Con todo esto, arma el plan de mantenimiento de la nave.',
  'Cada tres a seis meses, y siempre antes de la temporada de lluvias: limpiar canaletas, bajadas y rejillas.',
  'Una vez al año: revisar pernos, traslapes y sellos, tensores, bases, y retocar la pintura.',
  'Y después de un sismo fuerte o un ventarrón: una revisión completa, aunque no se vea nada roto.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El plan de <span class="nar">mantenimiento</span>', top=100) + tabla(
  ['Cuándo', 'Qué se hace'],
  [['Cada 3 a 6 meses<br>y antes de lluvias', 'Limpiar canaletas, bajadas y rejillas'], ['Una vez al año', 'Pernos, traslapes y sellos, tensores, bases, retoque de pintura'],
   ['Tras sismo o ventarrón', 'Revisión completa de la nave']],
  lambda i: i + 1, top=250, izq=240, der=240, tam=31)))

# 8. Vender el mantenimiento
E.append(dict(frases=[
  'Y ahora, el negocio. Ese plan se vende como un contrato anual. El cliente se olvida del problema, y tú tienes trabajo fijo.',
  'Un ejemplo con la nave de quince por treinta: dos visitas al año, dos operarios, dos días por visita. Supongamos ciento cincuenta soles por día de cada operario.',
  'Mano de obra por visita: dos por dos por ciento cincuenta, seiscientos soles. Más unos doscientos cincuenta en pernos, cinta y pintura: ochocientos cincuenta.',
  'Con un treinta por ciento de gastos y utilidad: mil ciento cinco por visita. Dos visitas: dos mil doscientos diez soles al año.',
  'Pon los precios de tu zona. Lo importante es la idea: cada nave que construyes puede ser un cliente de todos los años.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (4, 1.0, 50, 50)], html=titulo('En la obra: <span class="nar">el contrato anual</span>', top=100) + tabla(
  ['Partida', 'Cálculo', 'S/'],
  [['Mano de obra por visita', '2 operarios × 2 días × 150', '600'], ['Materiales por visita', 'pernos, cinta, pintura', '250'], ['Costo por visita', '600 + 250', '850'],
   ['Con 30 % gastos y utilidad', '850 × 1.30', '1 105'], ['<b class="nar">Contrato anual (2 visitas)</b>', '1 105 × 2', '<b class="nar">2 210</b>']],
  lambda i: [2, 2, 2, 3, 3][i], top=230, izq=240, der=240, tam=31, nota='Precios de ejemplo: usa los jornales y materiales de tu zona.')))

# 9. Errores
E.append(dict(frases=[
  'Los cinco errores de mantenimiento.',
  'Uno: subir sin arnés, o pisar una claraboya.',
  'Dos: tapar goteras solo con silicona.',
  'Tres: pintar encima del óxido sin limpiar.',
  'Cuatro: dejar las canaletas tapadas hasta que llueve.',
  'Y cinco: pintar una pieza que ya perdió espesor, en vez de avisar al ingeniero.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">de mantenimiento</span>', [
  ('Sin arnés o sobre la claraboya', 'Riesgo de caída grave.'), ('Solo silicona', 'La gotera vuelve.'), ('Pintar sobre óxido', 'Se levanta en meses.'),
  ('Canaletas tapadas', 'Rebalsan y mojan la estructura.'), ('Pintar pieza dañada', 'Se refuerza o se cambia.')])))

# 10. Reto
E.append(dict(frases=[
  'Tu último reto: calcula un contrato anual con tres visitas, dos operarios, dos días por visita, ciento cincuenta soles por día,',
  'doscientos soles de materiales por visita, y treinta por ciento de gastos y utilidad.',
], html=reto('🧮 3 visitas · 2 operarios · 2 días · S/ 150 por día<br>S/ 200 de materiales por visita · 30 %:<br><b class="nar">¿cuánto cobras al año?</b>', '¡CURSO COMPLETADO!')))

# 11. Curso completado
temas = ['Qué es y dónde conviene', 'Geometría y trazo', 'Arcos reticulados', 'Correas y arriostres', 'Columnas y anclajes', 'Fabricación en serie',
         'Izaje y montaje', 'Cobertura y canaletas', 'Metrado y presupuesto', 'Luces grandes', 'Luz y ventilación', 'Cerramientos', 'Mantenimiento']
E.append(dict(frases=[
  '¡Y con esto, terminaste el curso completo de naves parabólicas! Mira todo lo que aprendiste.',
  'En el módulo principal: del arco y su trazo, a la fabricación, el montaje y el presupuesto.',
  'Y en el módulo avanzado: naves de luces grandes, luz y ventilación, cerramientos y mantenimiento.',
  'Usa las plantillas de naves en Recursos Técnicos para tu próxima cotización.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¡Curso <span class="nar">completado</span>!', top=90) + '<div style="position:absolute;left:160px;right:160px;top:200px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px">' +
 ''.join(f'<div class="ap" data-en="{1 if i < 9 else 2}" data-mas="{0.25*(i if i < 9 else i-9):.2f}" style="display:flex;gap:12px;align-items:center;background:rgba(126,224,138,.08);border:2px solid rgba(126,224,138,.5);border-radius:14px;padding:10px 16px;font-size:23px;font-weight:800"><span style="background:#3f9e5a;border-radius:50%;width:34px;height:34px;display:grid;place-items:center;flex:none">✓</span>{i+1}. {t}</div>' for i, t in enumerate(temas)) +
 '</div><div class="paso pop" data-en="3" style="position:absolute;left:50%;transform:translateX(-50%);top:700px;font-size:24px"><b>↓</b>PLANTILLAS DE NAVES EN RECURSOS TÉCNICOS</div>'))

# 12. Gracias
E.append(dict(antes=0.3, despues=3.0, frases=[
  'Gracias por aprender con Innova Contratistas. Sigue creciendo con nuestros otros cursos: soldadura estructural, estructuras metálicas, carpintería metálica, y lectura de planos.',
  '¡Éxitos en tus obras, y nos vemos en la próxima!',
], html=f'''
<div style="position:absolute;left:0;right:0;top:200px;text-align:center">
 <img class="pop" data-en="0" src="data:image/png;base64,{EMBLEMA}" style="width:190px;height:184px;background:#fff;border-radius:38px;padding:16px">
 <h2 class="t ap" data-en="0" data-mas="0.4" style="margin-top:30px">¡Gracias y <span class="nar">éxitos en tus obras</span>!</h2>
 <div style="margin-top:34px;display:flex;justify-content:center;gap:16px;flex-wrap:wrap">''' + ''.join(f'<div class="paso pop" data-en="0" data-mas="{2+0.6*i:.1f}" style="font-size:22px">{c}</div>' for i, c in enumerate(['SOLDADURA ESTRUCTURAL', 'ESTRUCTURAS METÁLICAS', 'CARPINTERÍA METÁLICA', 'LECTURA DE PLANOS'])) + f'''</div>
 <div class="ap" data-en="1" style="margin-top:46px;font-size:26px;color:#8fa9c2;font-weight:700;letter-spacing:2px">INNOVA CONTRATISTAS · ACADEMIA TÉCNICA · WHATSAPP {WA}</div>
</div>'''))

if __name__ == '__main__':
    render_clase(E, CURSO, 'naves_c13')
