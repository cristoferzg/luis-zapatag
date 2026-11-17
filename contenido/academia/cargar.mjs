// Carga el catálogo de la Academia (catalogo.json) usando el MCP desplegado (functions/mcpCursos.js).
// Sube portadas y materiales a Storage, crea o actualiza cada curso con su precio y publica las plantillas en Recursos Técnicos.
// Las clases se crean solo si su video ya está en contenido/academia/videos/ (no repite las que ya existen).
//
// Uso:
//   MCP_URL="https://us-central1-innovacontratistas-434d2.cloudfunctions.net/mcpCursos" \
//   MCP_CLAVE="<tu clave>" node contenido/academia/cargar.mjs [--prueba]
// --prueba: solo muestra lo que haría, sin escribir nada.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAMA = process.env.RAMA || 'claude/innova-contratistas-analysis-c3xs14';
const CRUDO = `https://raw.githubusercontent.com/cristoferzg/luis-zapatag/${RAMA}/contenido/academia/`;
const { MCP_URL, MCP_CLAVE } = process.env;
const PRUEBA = process.argv.includes('--prueba');
if (!PRUEBA && (!MCP_URL || !MCP_CLAVE)) { console.error('Falta MCP_URL o MCP_CLAVE.'); process.exit(1); }

let n = 0;
async function herramienta(name, args) {
  if (PRUEBA) { console.log('  ·', name, JSON.stringify(args).slice(0, 140)); return name === 'subir_archivo' ? { url: CRUDO + 'x', tamano: 0, tipo: '' } : { ok: true }; }
  const r = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', authorization: `Bearer ${MCP_CLAVE}` },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name, arguments: args } }),
  });
  const j = await r.json();
  if (j.error) throw new Error(`${name}: ${j.error.message}`);
  if (j.result?.isError) throw new Error(`${name}: ${j.result.content?.[0]?.text}`);
  return j.result.structuredContent;
}

const catalogo = JSON.parse(readFileSync(join(AQUI, 'catalogo.json'), 'utf8'));
for (const c of catalogo.cursos) {
  console.log(`\n▶ ${c.nombre} (S/ ${c.precioSoles})`);
  const portada = await herramienta('subir_archivo', { nombre: `portada-${c.clave}.png`, url: CRUDO + c.portada, carpeta: c.clave });
  const adjuntos = [];
  for (const r of c.recursos) {
    const s = await herramienta('subir_archivo', { nombre: r.archivo.split('/').pop(), url: CRUDO + r.archivo, carpeta: c.clave, tipo: 'application/pdf' });
    adjuntos.push({ nombre: r.nombre, url: s.url, tipo: 'application/pdf', tamano: s.tamano });
  }
  const res = await herramienta('guardar_curso', {
    nombre: c.nombre, descripcion: c.descripcion, gratis: c.gratis, precioSoles: c.precioSoles, precioAntesSoles: c.precioAntesSoles,
    destacado: c.destacado, enSlider: c.enSlider, portadaUrl: portada.url, adjuntos,
  });
  console.log('  ✔', res.accion || 'ok', res.id || '');
  // Clases con video listo (el video se sube desde GitHub y se enlaza a la clase).
  const existentes = PRUEBA ? [] : ((await herramienta('listar_cursos', {})).cursos.find((x) => x.nombre === c.nombre)?.clases || []);
  for (const k of c.clases.filter((k) => k.video && existsSync(join(AQUI, k.video)))) {
    if (existentes.some((e) => e.titulo === k.titulo)) { console.log('  · ya existe:', k.titulo); continue; }
    const v = await herramienta('subir_archivo', { nombre: k.video.split('/').pop(), url: CRUDO + k.video, carpeta: c.clave, tipo: 'video/mp4' });
    await herramienta('guardar_clase', { curso: c.nombre, titulo: k.titulo, descripcion: k.descripcion, videoUrl: v.url, portadaUrl: portada.url, gratis: !!k.gratis });
    console.log('  ✔ clase:', k.titulo);
  }
}
// Recursos Técnicos: plantillas de Techos Metálicos (se abren con «Usar plantilla»).
for (const r of catalogo.recursos_tecnicos || []) {
  console.log(`\n▶ Recurso: ${r.titulo} (S/ ${r.precioSoles})`);
  const portada = await herramienta('subir_archivo', { nombre: r.portada.split('/').pop(), url: CRUDO + r.portada, carpeta: 'plantillas' });
  const datos = JSON.parse(readFileSync(join(AQUI, r.plantilla.archivo), 'utf8'));
  const res = await herramienta('guardar_recurso', {
    titulo: r.titulo, descripcion: r.descripcion, categoria: r.categoria, tipo: r.tipo, gratis: false,
    precioSoles: r.precioSoles, precioAntesSoles: r.precioAntesSoles, destacado: r.destacado, portadaUrl: portada.url,
    plantilla: { modulo: r.plantilla.modulo, datos },
  });
  console.log('  ✔', res.accion || 'ok', res.id || '');
}
console.log('\nListo.');
