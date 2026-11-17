// Mide el arranque de la app real contra los emuladores: cuántas listas se conectan
// (addTarget del canal de Firestore) en los primeros segundos, cuánto tarda en verse el
// Inicio con datos y cuánto ocupa la copia en el equipo. Uso: dentro de emulators:exec.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const URL = process.env.APP_URL || 'http://localhost:3001';
const OUT = process.env.CAPTURAS || '/tmp';
const ETQ = process.env.ETIQUETA || 'medicion';
const b = await chromium.launch();
async function medir(pin, nombre, espera) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  const p = await ctx.newPage();
  const objetivos = []; let t0 = 0;
  p.on('request', r => {
    if (!/Firestore\/Listen\/channel/.test(r.url()) || r.method() !== 'POST') return;
    const cuerpo = decodeURIComponent((r.postData() || '').replace(/\+/g, ' '));
    const n = (cuerpo.match(/"addTarget"/g) || []).length;
    const cols = [...cuerpo.matchAll(/"collectionId":"([^"]+)"/g)].map(m => m[1]);
    if (n && t0) objetivos.push({ t: Date.now() - t0, n, cols });
  });
  await p.addInitScript(() => { localStorage.setItem('innova_notif_preguntado', '1'); localStorage.setItem('innova_recordatorio_app', String(Date.now())); });
  await p.goto(URL); await p.waitForTimeout(3500);
  await p.locator('input').first().fill(pin);
  t0 = Date.now();
  await p.getByRole('button', { name: /ingresar/i }).click();
  try { await p.getByText('Panel Principal').first().waitFor({ timeout: 40000 }); } catch (e) { await p.screenshot({ path: `${OUT}/${ETQ}_${nombre}_fallo.png` }); console.log('TEXTO ' + (await p.evaluate(() => document.body.innerText)).slice(0, 400).replace(/\n/g, ' | ')); throw e; }
  const tPanel = Date.now() - t0;
  await p.getByText(espera).first().waitFor({ timeout: 40000 });
  const tDatos = Date.now() - t0;
  await p.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) { const n = p.getByRole('button', { name: 'Ahora no' }); if (await n.count()) await n.first().click().catch(() => {}); await p.waitForTimeout(300); }
  await p.screenshot({ path: `${OUT}/${ETQ}_${nombre}_inicio.png` });
  const en3 = objetivos.filter(o => o.t <= 3000).reduce((s, o) => s + o.n, 0);
  const colsEn3 = [...new Set(objetivos.filter(o => o.t <= 3000).flatMap(o => o.cols))];
  await p.waitForTimeout(12000);
  const total = objetivos.reduce((s, o) => s + o.n, 0);
  const ls = await p.evaluate(() => { let t = 0, k = 0; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (/sync_cache_|_backup_snapshot_data/.test(key)) { k++; t += (localStorage.getItem(key) || '').length; } } return { k, t }; });
  const r = { nombre, tPanel, tDatos, listasEn3s: en3, colecciones3s: colsEn3, listasTotal: total, copiasEnEquipo: ls.k, kbEnEquipo: Math.round(ls.t / 1024) };
  console.log('RESULTADO ' + JSON.stringify(r));
  if (process.env.DETALLE) console.log('DETALLE ' + nombre + ' ' + JSON.stringify(objetivos.map(o => [o.t, o.cols.join(',')])));
  await ctx.close();
}
await medir('111111', 'usuario', 'Comunicado de prueba');
await medir('135790', 'admin', 'Panel Principal');
await b.close();
