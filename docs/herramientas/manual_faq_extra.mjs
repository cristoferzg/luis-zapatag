// Rehace la ÚLTIMA página de "Preguntas frecuentes" del Manual (con las que ya tenía) y agrega
// las nuevas, con el mismo diseño (A4, Inter, tarjetas). Uso:
//   node docs/herramientas/manual_faq_extra.mjs <manual.pdf de entrada> <salida.pdf>
// Requiere Playwright (/opt/node-tools) y pypdf (python3) para unir las páginas.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [entrada, salida] = process.argv.slice(2);
const PAG_REEMPLAZO = 84; // última página de FAQ en el manual de entrada

const FAQS = [
  // Las que ya estaban en la página 84
  ['No encuentro un apartado en el menú', 'Revisa las pestañas de arriba (Personal y Carpeta están en Proyectos; Precios, en Configuración; Cotización rápida, en Techos). Si apagaste un apartado, enciéndelo otra vez en “Mis apartados”, al final del menú.'],
  ['¿Puedo cambiar la moneda?', 'Sí. En Configuración eliges la moneda y se aplica en todo el sistema: presupuestos, propuestas, gastos y precios.'],
  ['Algo no funciona', 'Entra a Ayuda y soporte y escríbelo en el chat, o toca “Reportar un problema”. Puedes adjuntar una foto de la pantalla.'],
  // Nuevas
  ['¿Cuántos créditos trae una cuenta nueva?', 'Cada cuenta nueva recibe 20 créditos de regalo para probar las funciones inteligentes (por ejemplo, 2 planos a mano). Tu saldo se ve arriba, junto a la campana; el botón verde “+” o “Recargar” te lleva a las recargas. Si no te alcanza para una acción, se pone rojo.'],
  ['¿Cuánto cuesta cada función?', 'Cada botón de IA muestra su costo (por ejemplo “Leer plano · 10”). En Membresía está la tabla completa: boleta con QR gratis, boleta sin QR 1, redactar documento 2, melamina 5, drywall 5, gasfitería o electricidad 6, obra civil 8 y plano a mano de techo 10 créditos.'],
  ['¿Cómo compro créditos con Yape o Plin?', 'Desde la web, el programa de PC o Chrome del celular: Membresía → Recargas, elige la recarga (desde 20 créditos por S/ 3.90). Se abre la ventana con el QR, el número y el monto exacto: paga, toca “Elegir captura”, sube la captura y “Enviar comprobante”. Cuando se valida tu pago, los créditos se cargan solos y te llega un aviso.'],
  ['¿Mi primera recarga vale el doble?', 'Sí: la primera recarga de cada cuenta te da el doble de créditos (por ejemplo, compras 20 y recibes 40). Solo la primera vez.'],
  ['¿Por qué en la app de Android no veo Yape ni WhatsApp para comprar?', 'Por las reglas de Google Play, dentro de la app de Android solo se compra con Google Play. Si prefieres Yape o Plin, entra a InnovApp desde Chrome o desde la computadora: tus créditos son los mismos en la app, en la web y en la PC.'],
  ['¿Cómo gano créditos invitando a un colega?', 'En Membresía toca “Invitar por WhatsApp” y comparte la app. Cuando el administrador le cree su acceso y diga que tú lo recomendaste, se te suman 20 créditos de regalo. Sin límite de invitados.'],
  ['¿Cómo hago un techo con cortaviento (sin cumbrera)?', 'En Techos abre el Asistente, elige A dos aguas, Parabólico, Mansarda, Curvo autoportante, Alpino, En L o En U y marca “Con cortaviento”. Ajusta la abertura (0.20 a 1.50 m), cuánto vuela un lado sobre el otro y cuál es el lado alto (ponlo contra el viento). Al leer un plano a mano también puedes elegir “¿Con cortaviento?”.'],
  ['¿Dónde pongo un horno o una parrilla?', 'En Obra Civil o Drywall usa la herramienta “Accesorios” → Exterior: “Horno de barro (leña)” o “Parrilla con campana”. Toca el plano para colocarlo; se ve en el 3D. Si llevas tu techo con “→ Obra Civil”, quedan bajo el techo.'],
  ['(Administrador) ¿Cómo cobro con Yape o Plin?', 'En Configuración → Planes y créditos → “Para vender créditos” pon tu número de Yape y/o Plin, a nombre de quién y sube tu QR; toca “Activar”. Por cada pago te llega un aviso: en Administración → Compras toca “Comprobante” para leer la captura (avisa si el N° de operación ya se usó) y luego “Validar”. Al comprador le llega su aviso solo a él.'],
  ['(Administrador) ¿Cómo regalo créditos por recomendación?', 'Al crear un acceso en Administración → Accesos, elige en “¿Quién lo recomendó?” al usuario que lo trajo: se le suman 20 créditos.'],
  ['Al entrar, Academia o Ayuda tardan unos segundos en actualizarse', 'Es normal: para que el Inicio abra más rápido, primero se cargan tus proyectos, clientes, finanzas y comunicados, y unos segundos después lo demás. Si entras a esos apartados se actualizan al instante.'],
];

const css = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Inter', sans-serif; color: #0f172a; }
.pag { width: 210mm; height: 297mm; padding: 11mm 13mm 0; position: relative; page-break-after: always; overflow: hidden; }
.tit { display: flex; align-items: center; gap: 14px; font-size: 19pt; font-weight: 700; padding-bottom: 8px; border-bottom: 2px solid #f59e0b; margin-bottom: 15px; }
.tit span { font-size: 21pt; }
.faq { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 12px 10px; margin-bottom: 8px; }
.faq b { display: block; font-size: 9.6pt; font-weight: 700; margin-bottom: 4px; }
.faq p { margin: 0; font-size: 9.6pt; line-height: 1.32; color: #1e293b; }
.pie { position: absolute; left: 13mm; right: 13mm; bottom: 9mm; border-top: 1px solid #e2e8f0; padding-top: 5px; display: flex; justify-content: space-between; font-size: 7pt; color: #94a3b8; }
`;
const POR_PAG = 7;
const paginas = [];
for (let i = 0; i < FAQS.length; i += POR_PAG) paginas.push(FAQS.slice(i, i + POR_PAG));
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${paginas.map((lista, k) => `
<div class="pag"><div class="tit"><span>❓</span>Preguntas frecuentes (continuación)</div>
${lista.map(([q, r]) => `<div class="faq"><b>${q}</b><p>${r}</p></div>`).join('')}
<div class="pie"><span>Innova Contratistas · Manual de usuario</span><span>${PAG_REEMPLAZO + k}</span></div></div>`).join('')}</body></html>`;
const b = await chromium.launch();
const p = await b.newPage();
await p.setContent(html, { waitUntil: 'networkidle' });
const extra = salida.replace(/\.pdf$/, '_extra.pdf');
await p.pdf({ path: extra, format: 'A4', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
await b.close();
const py = `
import pypdf,sys
r=pypdf.PdfReader(sys.argv[1]); e=pypdf.PdfReader(sys.argv[2]); w=pypdf.PdfWriter()
for i in range(${PAG_REEMPLAZO - 1}): w.add_page(r.pages[i])
for pg in e.pages: w.add_page(pg)
for i in range(${PAG_REEMPLAZO}, len(r.pages)): w.add_page(r.pages[i])
w.add_metadata(r.metadata or {})
w.write(sys.argv[3]); print(len(w.pages))`;
writeFileSync(salida + '.py', py);
console.log('páginas:', execFileSync('python3', [salida + '.py', entrada, extra, salida]).toString().trim());
