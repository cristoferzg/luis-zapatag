"""El Negocio del Metalero · Clase 9: Consigue clientes (módulo avanzado)."""
from neg_comun import *

CURSO = 'EL NEGOCIO DEL METALERO · CLASE 9'
E = []

E.append(dict(antes=0.5, frases=[
  'Haces trabajos muy buenos... pero solo te llaman los mismos de siempre, y hay meses sin obra.',
  'No basta con trabajar bien: la gente tiene que saber que existes y ver lo que haces.',
  'Hoy aprendes a conseguir clientes con fotos, redes y recomendaciones. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Trabajas bien', 'pero nadie te conoce', 9, 'CLIENTES', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">📣</div>')))

E.append(obra_av(0, [
  'Terminaste el módulo principal: ya sabes llevar una obra como empresa.',
  'Ahora, el módulo avanzado. Hoy: cómo conseguir más clientes.',
], 'Hoy: <span class="nar">consigue clientes</span>'))

E.append(dict(frases=[
  'Los clientes llegan por cinco caminos.',
  'Las recomendaciones, que siguen siendo las mejores. Las redes sociales. Google, cuando buscan un taller cerca.',
  'Los letreros en tus obras y en tu taller. Y las alianzas: ferreterías, maestros de obra, arquitectos e ingenieros que necesitan un metalero confiable.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Cinco <span class="nar">caminos</span>', top=100) + lista([
  ('🗣️', '<b class="nar">Recomendaciones</b>'), ('📱', '<b class="nar">Redes sociales</b>'), ('🗺️', '<b class="nar">Google</b>: "taller cerca de mí"'),
  ('🪧', '<b class="nar">Letreros</b> en obra y taller'), ('🤝', '<b class="nar">Alianzas</b>: ferreterías, maestros, arquitectos')],
  lambda i: [1, 1, 1, 2, 2][i], top=240, izq=360, der=360, tam=33)))

E.append(dict(frases=[
  'Todo empieza con buenas fotos. La regla de tres: una foto del antes, una durante el trabajo, y una del después.',
  'De día, de frente, con la obra limpia y sin herramientas tiradas. Y un par de detalles: una soldadura pareja, una chapa bien puesta.',
  'Mejor todavía: un video corto, de quince a treinta segundos, con el portón funcionando. Eso vende más que cualquier texto.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Fotos <span class="nar">que venden</span>', top=100) + tarjetas([
  ('🏚️', 'Antes', 'Cómo estaba'), ('🔥', 'Durante', 'Tu trabajo'), ('✨', 'Después', 'De día, limpio,<br>de frente'), ('🎬', 'Video corto', '15 a 30 s<br>funcionando')],
  lambda i: [0, 0, 1, 2][i], top=260, cols=4, alto=300, izq=120)))

E.append(dict(frases=[
  'WhatsApp Business es tu vitrina. Ponle tu logo, tu horario y tu dirección.',
  'Arma un catálogo con tus trabajos: portones, rejas, techos, escaleras, cada uno con fotos.',
  'Configura respuestas rápidas para las preguntas de siempre, y publica en tus estados una obra cada semana. Tus contactos los ven sin que tengas que escribirles.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('WhatsApp <span class="nar">Business</span>', top=100) + lista([
  ('🏷️', 'Perfil con <b class="nar">logo, horario y dirección</b>'), ('🗂️', '<b class="nar">Catálogo</b> de trabajos con fotos'),
  ('⚡', '<b class="nar">Respuestas rápidas</b>'), ('🔄', '<b class="nar">Estados</b>: una obra por semana')],
  lambda i: [0, 1, 2, 2][i], top=260, izq=360, der=360, tam=34)))

E.append(dict(frases=[
  'En Facebook e Instagram, publica dos o tres veces por semana. Cuenta una pequeña historia: qué necesitaba el cliente, y cómo lo resolviste.',
  'Comparte en los grupos de tu barrio o distrito, respetando sus reglas. Nada de llenar de anuncios: muestra trabajos.',
  'Y responde rápido cada mensaje. Un cliente que pregunta y no recibe respuesta, se va con otro.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Facebook <span class="nar">e Instagram</span>', top=100) + tarjetas([
  ('📅', '2 o 3 veces por semana', 'Constancia'), ('📖', 'Cuenta la historia', 'Problema →<br>solución'), ('🏘️', 'Grupos del barrio', 'Sin llenar<br>de anuncios'), ('⚡', 'Responde rápido', 'O se va<br>con otro')],
  lambda i: [0, 0, 1, 2][i], top=260, cols=4, alto=300, izq=120)))

E.append(dict(frases=[
  'Google: crea gratis tu Perfil de Empresa en Google. Así apareces en el mapa cuando alguien busca "portones metálicos cerca de mí".',
  'Pon fotos, horario y teléfono, y pide a cada cliente contento que deje una reseña. Las reseñas te suben en los resultados y dan confianza.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Aparece <span class="nar">en Google</span>', top=100) +
  '<div class="pop" data-en="0" style="position:absolute;left:520px;top:280px;width:880px;background:#fff;border-radius:16px;padding:20px 26px;color:#0b2a45;font-size:30px">🔍 portones metálicos cerca de mí</div>'
  '<div class="pop" data-en="1" style="position:absolute;left:520px;top:390px;width:880px;background:rgba(255,255,255,.08);border-radius:16px;padding:20px 26px;font-size:30px">📍 <b>Tu taller</b> · ⭐ 4.9 (23 reseñas) · Abierto</div>'))

E.append(dict(frases=[
  'Y no olvides lo más simple: un letrero en cada obra, con permiso del cliente: "Trabajo realizado por", tu nombre y tu WhatsApp.',
  'Un sticker en tu vehículo y polos con tu logo hacen lo mismo: te ven trabajando, y te recuerdan.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Letreros <span class="nar">que trabajan solos</span>', top=100) +
  f'<div class="pop" data-en="0" style="position:absolute;left:560px;top:280px;width:800px;background:#f97316;border-radius:12px;padding:26px;text-align:center;font-size:38px;font-weight:900">TRABAJO REALIZADO POR<br>TU TALLER · WhatsApp {WA}</div>' +
  badge('CON PERMISO DEL CLIENTE', 0, 780, 520, '#2b7fb3', '✓')))

E.append(dict(frases=[
  'Finalmente, mide. A cada cliente nuevo pregúntale: "¿Cómo nos conoció?", y anótalo.',
  'Por ejemplo, de diez clientes: cinco por recomendación, tres por Facebook y dos por Google.',
  'Así sabes dónde poner tu tiempo, y dónde no.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Mide: <span class="nar">¿cómo te conocieron?</span>', top=100) + barras(
  [('Recomendación', 5, '#7ee08a'), ('Facebook', 3, '#5ec4ff'), ('Google', 2, '#ffd166')],
  lambda i: 1, x0=460, base=700, ancho=1000, escala=70, etiqueta=lambda v: f'{v} clientes')))

E.append(dict(frases=[
  'Los cinco errores al buscar clientes.',
  'Uno: fotos oscuras o desordenadas.',
  'Dos: publicar una vez y desaparecer.',
  'Tres: no tener perfil en Google.',
  'Cuatro: responder tarde.',
  'Y cinco: no preguntar cómo te conocieron.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al buscar clientes</span>', [
  ('Malas fotos', 'No muestran tu calidad.'), ('Sin constancia', 'Te olvidan.'), ('Sin Google', 'No te encuentran.'),
  ('Responder tarde', 'Se van con otro.'), ('No medir', 'No sabes qué funciona.')])))

E.append(dict(frases=[
  'Tu reto: esta semana, publica tres obras con fotos de antes y después, y crea tu Perfil de Empresa en Google.',
  'En la próxima clase: formaliza tu taller.',
], html=reto('📸 3 obras con antes y después<br>+ <b class="nar">tu perfil en Google</b>', 'FORMALIZA TU TALLER')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: trabaja bien, y que todos lo vean.',
  '¡Nos vemos en la clase diez!',
], html=final('Que te <span class="nar">encuentren</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'neg_c9')
