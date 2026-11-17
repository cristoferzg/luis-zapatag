"""El Negocio del Metalero · Clase 12: Crecer (cierre del curso)."""
from neg_comun import *

CURSO = 'EL NEGOCIO DEL METALERO · CLASE 12'
E = []

E.append(dict(antes=0.5, frases=[
  'Ya tienes clientes, cotizas bien, cobras a tiempo y tienes equipo. ¿Y ahora?',
  'El salto de un buen taller a una empresa que crece no es suerte: es medir, elegir hacia dónde ir, e invertir con cabeza.',
  'Hoy, en la última clase, armas tu plan para crecer. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('De taller a empresa', '¿cómo dar el salto?', 12, 'CRECER', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🚀</div>')))

E.append(obra_av(3, [
  'Ya sabes armar y cuidar tu equipo.',
  'Hoy, en la última clase del curso: crecer.',
], 'Hoy: <span class="nar">crecer</span>'))

E.append(dict(frases=[
  'Para crecer, primero mide. Cinco números cada mes.',
  'Las ventas del mes. Tu margen promedio. Y tu tasa de cierre: de cada diez cotizaciones que mandas, cuántas ganas.',
  'El ticket promedio, lo que vale en promedio cada obra. Y la caja disponible a fin de mes.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Tus <span class="nar">cinco números</span>', top=100) + tabla(
  ['Indicador', 'Ejemplo del mes'],
  [['Ventas', 'S/ 21 000'], ['Margen promedio', '18 %'], ['Tasa de cierre', '3 de 10 cotizaciones = 30 %'], ['Ticket promedio', 'S/ 7 000'], ['Caja a fin de mes', 'S/ 4 500']],
  lambda i: [1, 1, 1, 2, 2][i], top=250, izq=330, der=330, tam=32)))

E.append(dict(frases=[
  'Con esos números ves dónde crecer. Hay tres palancas.',
  'Más cotizaciones, con más clientes. Una mejor tasa de cierre, con mejores visitas y cotizaciones. O un mejor margen, con mejor precio y menos desperdicio.',
  'Mira: si tu tasa de cierre sube de treinta a cuarenta por ciento, con las mismas diez cotizaciones ganas una obra más al mes. Con un ticket de siete mil, son siete mil soles más en ventas.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Tres <span class="nar">palancas</span>', top=100) + tarjetas([
  ('📨', 'Más cotizaciones', 'Más clientes'), ('🎯', 'Mejor tasa de cierre', 'Visita y cotización'), ('📊', 'Mejor margen', 'Precio y desperdicio')],
  lambda i: 1, top=250, cols=3, alto=280, izq=230) + badge('30 % → 40 % = +1 OBRA = +S/ 7 000 AL MES', 2, 520, 590, '#3f9e5a', '📈')))

E.append(dict(frases=[
  'Especialízate. El que hace "de todo un poco" compite solo por precio.',
  'Elige una o dos especialidades donde seas el mejor de tu zona: naves y techos, portones automáticos, escaleras, estructuras para empresas.',
  'El especialista cobra mejor, porque el cliente lo busca a él. Los cursos técnicos de la Academia te ayudan a elegir y dominar tu especialidad.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Especialízate', top=100) + tarjetas([
  ('🏭', 'Naves y techos', ''), ('🚪', 'Portones automáticos', ''), ('🪜', 'Escaleras', ''), ('🏗️', 'Estructuras', 'para empresas')],
  lambda i: 1, top=270, cols=4, alto=240, izq=120) + badge('EL ESPECIALISTA COBRA MEJOR', 2, 720, 580, '#f97316', '⭐')))

E.append(dict(frases=[
  'El siguiente nivel son las empresas y constructoras. Te piden RUC y factura, seguros para tu personal, una cotización formal, fotos de trabajos anteriores, y cumplir plazos sin excusas.',
  'Ojo con la caja: muchas pagan a treinta o sesenta días. Como viste en la clase siete, calcula si puedes financiar la obra antes de aceptarla, o negocia un adelanto.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Trabaja <span class="nar">con empresas</span>', top=100) + lista([
  ('🧾', 'RUC y factura'), ('🦺', 'Seguros para tu personal'), ('📄', 'Cotización formal y fotos de trabajos'), ('⏱️', 'Plazos sin excusas'), ('💵', '<b class="nar">Pagos a 30–60 días</b>: cuida tu caja')],
  lambda i: [0, 0, 0, 0, 1][i], top=200, izq=360, der=360, tam=30)))

E.append(dict(frases=[
  'Invierte con cabeza. Una máquina vale la pena si ahorra horas que puedes cobrar.',
  'Por ejemplo, un equipo de corte de seis mil soles que te ahorra veinte horas al mes. A treinta y cuatro soles tu hora, son seiscientos ochenta soles al mes.',
  'Seis mil entre seiscientos ochenta: se paga en unos nueve meses. Si se paga en menos de un año o dos, suele ser buena inversión.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Invierte <span class="nar">con cabeza</span>', top=100) + tabla(
  ['Dato', 'Cálculo', 'Resultado'], [['Equipo de corte', '', 'S/ 6 000'], ['Ahorro al mes', '20 h × 34', 'S/ 680'], ['<b class="nar">Se paga en</b>', '6 000 ÷ 680', '<b class="nar">≈ 9 meses</b>']],
  lambda i: [0, 1, 2][i], top=290, izq=330, der=330, tam=34)))

E.append(dict(frases=[
  'Arma tu plan de doce meses, con metas concretas.',
  'Del mes uno al tres: RUC, perfil en Google y fotos de tus obras. Del cuatro al seis: un ayudante fijo y tus estándares por escrito.',
  'Y del siete al doce: tu especialidad y tu primera obra con una constructora. Revisa tus cinco números cada mes.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Tu plan <span class="nar">de 12 meses</span>', top=100) + tabla(
  ['Meses', 'Metas'], [['1 – 3', 'RUC · perfil en Google · fotos de tus obras'], ['4 – 6', 'Ayudante fijo · estándares por escrito'], ['7 – 12', 'Especialidad · primera obra con constructora']],
  lambda i: i, top=290, izq=300, der=300, tam=33)))

E.append(dict(frases=[
  'Los cinco errores al crecer.',
  'Uno: crecer sin medir.',
  'Dos: hacer de todo y no especializarte.',
  'Tres: aceptar obras grandes sin revisar la caja.',
  'Cuatro: comprar máquinas que no ahorran horas.',
  'Y cinco: no tener metas por escrito.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al crecer</span>', [
  ('Sin medir', 'No sabes qué funciona.'), ('De todo un poco', 'Compites solo por precio.'), ('Obras grandes sin caja', 'Te ahogas.'),
  ('Máquinas por capricho', 'Plata parada.'), ('Sin metas escritas', 'Sin rumbo.')])))

E.append(dict(frases=[
  'Tu último reto: escribe tus tres metas para los próximos doce meses, y empieza a anotar tus cinco números desde este mes.',
  'Mándamelos por WhatsApp. ¡Quiero verte crecer!',
], html=reto('🚀 Tus <b class="nar">3 metas de 12 meses</b><br>y tus 5 números de este mes', '¡CURSO COMPLETADO!')))

temas = ['Mentalidad', 'Tu hora', 'La visita', 'La cotización', 'Precio y negociación', 'Acuerdo y adelanto', 'Cobranza y caja', 'Entrega y garantía',
         'Consigue clientes', 'Formalízate', 'Tu equipo', 'Crecer']
E.append(dict(frases=[
  '¡Terminaste el curso completo del negocio del metalero! Mira todo lo que aprendiste.',
  'En el módulo principal: llevar una obra de principio a fin, desde tu hora y la visita, hasta la cobranza y la garantía.',
  'Y en el módulo avanzado: conseguir clientes, formalizarte, armar tu equipo y crecer.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¡Curso <span class="nar">completado</span>!', top=90) + '<div style="position:absolute;left:200px;right:200px;top:200px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px">' +
  ''.join(f'<div class="ap" data-en="{1 if i < 8 else 2}" data-mas="{0.25*(i if i < 8 else i-8):.2f}" style="display:flex;gap:12px;align-items:center;background:rgba(126,224,138,.08);border:2px solid rgba(126,224,138,.5);border-radius:14px;padding:12px 16px;font-size:25px;font-weight:800"><span style="background:#3f9e5a;border-radius:50%;width:36px;height:36px;display:grid;place-items:center;flex:none">✓</span>{i+1}. {t}</div>' for i, t in enumerate(temas)) +
  '</div>'))

E.append(dict(antes=0.3, despues=3.0, frases=[
  'Gracias por aprender con Innova Contratistas. Sigue creciendo con nuestros cursos técnicos: naves parabólicas, techos a dos y cuatro aguas, soldadura, estructuras, carpintería metálica, y lectura de planos.',
  '¡Éxitos en tu taller, y nos vemos en la próxima!',
], html=f'''
<div style="position:absolute;left:0;right:0;top:190px;text-align:center">
 <img class="pop" data-en="0" src="data:image/png;base64,{EMBLEMA}" style="width:180px;height:174px;background:#fff;border-radius:36px;padding:15px">
 <h2 class="t ap" data-en="0" data-mas="0.4" style="margin-top:28px">¡Gracias y <span class="nar">éxitos en tu taller</span>!</h2>
 <div style="margin-top:30px;display:flex;justify-content:center;gap:14px;flex-wrap:wrap;padding:0 220px">''' + ''.join(f'<div class="paso pop" data-en="0" data-mas="{2+0.5*i:.1f}" style="font-size:20px">{c}</div>' for i, c in enumerate(['NAVES PARABÓLICAS', 'TECHOS A 2 Y 4 AGUAS', 'SOLDADURA', 'ESTRUCTURAS', 'CARPINTERÍA METÁLICA', 'LECTURA DE PLANOS'])) + f'''</div>
 <div class="ap" data-en="1" style="margin-top:40px;font-size:26px;color:#8fa9c2;font-weight:700;letter-spacing:2px">INNOVA CONTRATISTAS · ACADEMIA TÉCNICA · WHATSAPP {WA}</div>
</div>'''))

if __name__ == '__main__':
    render_clase(E, CURSO, 'neg_c12')
