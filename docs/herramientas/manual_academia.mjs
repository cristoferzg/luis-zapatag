// Rehace el capítulo 16 "Aprende y soporte" del Manual (páginas 75 a 78) para la Academia nueva:
// pestañas Tienda / Mis cursos / Mis plantillas, paquetes, ficha del curso, pago con Yape y canje con créditos.
// Mismo diseño que el resto del manual (A4, Inter, portada turquesa, "Paso N" y leyenda numerada).
// Uso:
//   node docs/herramientas/manual_academia.mjs <manual.pdf de entrada> <carpeta de capturas> <salida.pdf>
// Las capturas (m_1_tienda.png … m_6_misplantillas.png) se toman de la app con las marcas rojas numeradas.
// Requiere Playwright (/opt/node-tools) y pypdf (python3).
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const [entrada, carpeta, salida] = process.argv.slice(2);
const DESDE = 75, HASTA = 78; // páginas que se reemplazan (la 79, Ayuda y soporte, se queda igual)
const img = n => `data:image/png;base64,${readFileSync(`${carpeta}/m_${n}.png`).toString('base64')}`;

const CAPITULO = [
  'Academia: Tienda, Mis cursos y Mis plantillas', 'Paquetes con descuento', 'La ficha de un curso',
  'Comprar con Yape o transferencia', 'Mis cursos', 'Mis plantillas', 'Ayuda y soporte: tu chat', 'Agendar asesoría o reportar un problema',
];
const PASOS = [
  ['Academia: Tienda, Mis cursos y Mis plantillas', 'La Academia técnica junta en un solo lugar los cursos y las plantillas (lo que antes era “Recursos”). Arriba eliges la pestaña: <b>Tienda</b> para ver y comprar, <b>Mis cursos</b> para ver tus clases y <b>Mis plantillas</b> para abrir tus diseños listos.', '1_tienda', ['Cambiar de pestaña', 'Ver los paquetes', 'Buscar cursos o plantillas']],
  ['Paquetes con descuento', 'Un paquete trae varios cursos (y a veces plantillas) por un único precio. Verás cuánto costarían por separado y cuánto ahorras. Al validar tu pago se habilita todo lo que incluye.', '2_paquetes', ['Precio por separado', 'Lo que ahorras', 'Comprar el paquete']],
  ['La ficha de un curso', 'Toca un curso para ver su temario (las clases con candado se abren al comprarlo), el material descargable y las plantillas para practicar. Para tenerlo: “Comprar curso” o “Canjear con créditos” (se abre al instante). Si ya lo tienes, toca “Ir a las clases”.', '3_ficha', ['Temario del curso', 'Plantillas para practicar', 'Comprar el curso']],
  ['Comprar con Yape o transferencia', 'Desde la web, el programa de PC o Chrome del celular. Yapea el monto exacto (o elige “Transferencia” para pagar a la cuenta bancaria, también desde otro país), toca “Elegir captura”, sube la foto del pago y “Enviar comprobante”. Mientras se revisa verás “Pago en revisión”; al validarse se habilita solo y te llega un aviso. En la app de Android no se paga por fuera de Google Play: ahí cada curso, plantilla o paquete muestra su precio en créditos y se abre al instante con “Canjear créditos”.', '4_pago', ['Copiar el número', 'Subir la captura', 'Enviar comprobante']],
  ['Mis cursos', 'Tus cursos con su avance. Toca uno para ver sus clases; al ver una clase se marca como completada. Si el curso trae material (PDF, planos, fotos), lo descargas desde arriba.', '5_miscursos', ['Pestaña Mis cursos', 'Buscar un curso', 'Curso destacado']],
  ['Mis plantillas', 'Plantillas listas (techos, puertas, drywall), planos y libros técnicos. Toca “Abrir en Techos / Carpintería / Drywall” y se abre una COPIA para que cambies medidas y precios; lo que tenías abierto se guarda como respaldo. Las de pago se compran o se canjean con créditos en la Tienda.', '6_misplantillas', ['Solo plantillas', 'Buscar', 'Solicitar una de pago']],
];

const css = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Inter', sans-serif; color: #0f172a; }
.pag { width: 210mm; height: 297mm; position: relative; page-break-after: always; overflow: hidden; }
.cont { padding: 13mm 13mm 0; }
.cab { display: flex; align-items: center; gap: 7px; font-size: 8pt; font-weight: 700; letter-spacing: .12em; color: #1094b4; margin-bottom: 9px; }
.cab i { width: 9px; height: 9px; border-radius: 3px; background: #1094b4; display: inline-block; }
.paso { margin-bottom: 7mm; }
.pt { display: flex; align-items: center; gap: 10px; font-size: 13.5pt; font-weight: 700; margin-bottom: 4px; }
.pt span { background: #1094b4; color: #fff; font-size: 7.5pt; font-weight: 700; padding: 4px 10px; border-radius: 99px; }
.txt { font-size: 9.6pt; line-height: 1.42; color: #334155; margin: 0 0 7px; }
.foto { width: 140mm; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 9px; padding: 5px; background: #f8fafc; }
.foto img { width: 100%; display: block; border-radius: 6px; }
.ley { width: 140mm; margin-left: auto; margin-right: auto; display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 6px; font-size: 8.4pt; font-weight: 700; color: #1e293b; }
.ley b { display: inline-flex; width: 16px; height: 16px; border-radius: 50%; background: #e11d48; color: #fff; font-size: 8pt; align-items: center; justify-content: center; margin-right: 5px; }
.pie { position: absolute; left: 13mm; right: 13mm; bottom: 9mm; border-top: 1px solid #e2e8f0; padding-top: 5px; display: flex; justify-content: space-between; font-size: 7pt; color: #94a3b8; }
.portada { background: #ecf0f5; }
.banda { background: linear-gradient(135deg, #1094b4, #209cba); height: 118mm; color: #fff; padding: 22mm 18mm 0; position: relative; }
.banda .num { position: absolute; right: 16mm; top: 12mm; font-size: 64pt; font-weight: 800; color: rgba(255,255,255,.25); }
.banda .ic { font-size: 30pt; }
.banda h1 { font-size: 30pt; margin: 6mm 0 4mm; font-weight: 800; }
.banda p { font-size: 11pt; line-height: 1.45; margin: 0; max-width: 140mm; }
.indice { position: absolute; left: 14mm; right: 14mm; top: 104mm; background: #fff; border-radius: 12px; padding: 7mm 8mm; box-shadow: 0 6px 18px rgba(15,23,42,.12); }
.indice h3 { margin: 0 0 5mm; font-size: 8pt; letter-spacing: .14em; color: #475569; }
.indice div { display: flex; align-items: center; gap: 9px; font-size: 10pt; font-weight: 600; padding: 2.2mm 0; }
.indice div b { width: 17px; height: 17px; border-radius: 50%; background: #1094b4; color: #fff; font-size: 8pt; display: inline-flex; align-items: center; justify-content: center; }
`;
const pie = n => `<div class="pie"><span>Aprende y soporte · Innova Contratistas · Manual de usuario</span><span>${n}</span></div>`;
const paso = (i, [t, txt, im, ley]) => `<div class="paso"><div class="pt"><span>Paso ${i}</span>${t}</div><p class="txt">${txt}</p>
  <div class="foto"><img src="${img(im)}"></div><div class="ley">${ley.map((l, k) => `<span><b>${k + 1}</b>${l}</span>`).join('')}</div></div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="pag portada"><div class="banda"><div class="num">16</div><div class="ic">🎓</div><h1>Aprende y soporte</h1>
<p>La Academia técnica (tienda de cursos y paquetes, tus cursos y tus plantillas listas para usar) y el chat de Ayuda y soporte, con asistente, asesorías y reportes.</p></div>
<div class="indice"><h3>EN ESTE CAPÍTULO</h3>${CAPITULO.map((c, k) => `<div><b>${k + 1}</b>${c}</div>`).join('')}</div>${pie(DESDE)}</div>
${[0, 2, 4].map((i, k) => `<div class="pag"><div class="cont"><div class="cab"><i></i>16. APRENDE Y SOPORTE</div>
${paso(i + 1, PASOS[i])}${paso(i + 2, PASOS[i + 1])}</div>${pie(DESDE + 1 + k)}</div>`).join('')}
</body></html>`;

const b = await chromium.launch();
const p = await b.newPage();
await p.setContent(html, { waitUntil: 'networkidle' });
const nuevas = salida.replace(/\.pdf$/, '_cap16.pdf');
await p.pdf({ path: nuevas, format: 'A4', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
await b.close();
const py = `
import pypdf,sys
r=pypdf.PdfReader(sys.argv[1]); e=pypdf.PdfReader(sys.argv[2]); w=pypdf.PdfWriter()
for i in range(${DESDE - 1}): w.add_page(r.pages[i])
for pg in e.pages: w.add_page(pg)
for i in range(${HASTA}, len(r.pages)): w.add_page(r.pages[i])
w.add_metadata(r.metadata or {})
w.write(sys.argv[3]); print(len(w.pages), len(e.pages))`;
writeFileSync(salida + '.py', py);
console.log('páginas (total, nuevas):', execFileSync('python3', [salida + '.py', entrada, nuevas, salida]).toString().trim());
