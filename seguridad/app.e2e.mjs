// Prueba de la app real contra los emuladores: ingreso por PIN (servidor), que cada uno
// vea solo lo suyo, que no queden PIN en el equipo y el bloqueo por intentos fallidos.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const URL = process.env.APP_URL || 'http://localhost:3001';
const OUT = process.env.CAPTURAS || '/tmp';
const b = await chromium.launch();
let ok = 0, mal = 0;
const check = (n, c, extra = '') => { if (c) { ok++; console.log('  ✔', n); } else { mal++; console.log('  ✘', n, extra); } };

async function sesion(pin, nombre) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  const p = await ctx.newPage();
  const permisos = [];
  p.on('console', m => { const t = m.text(); if (/permission|insufficient/i.test(t)) permisos.push(t.slice(0, 160)); });
  await p.addInitScript(() => { localStorage.setItem('innova_notif_preguntado', '1'); localStorage.setItem('innova_recordatorio_app', String(Date.now())); });
  await p.goto(URL); await p.waitForTimeout(3500);
  await p.locator('input').first().fill(pin);
  await p.getByRole('button', { name: /ingresar/i }).click();
  await p.getByText('Panel Principal').first().waitFor({ timeout: 40000 });
  await p.waitForTimeout(2500);
  for (let i = 0; i < 3; i++) { const n = p.getByRole('button', { name: 'Ahora no' }); if (await n.count()) await n.first().click().catch(() => {}); await p.waitForTimeout(300); }
  permisos.length = 0; // solo cuenta lo que pase ya con la sesión con PIN
  const ir = async v => { await p.evaluate(v => window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: v })), v); await p.waitForTimeout(2200); };
  return { ctx, p, ir, permisos, nombre };
}
const texto = p => p.evaluate(() => document.body.innerText);

console.log('\nUsuario A (PIN 111111)');
{
  const s = await sesion('111111', 'A');
  check('A ve el comunicado del admin', (await texto(s.p)).includes('Comunicado de prueba'));
  await s.ir('projects');
  let t = await texto(s.p);
  check('A ve su obra', t.includes('Obra de A'));
  check('A NO ve la obra de B', !t.includes('Obra de B'));
  check('A NO ve la obra del admin', !t.includes('Obra del Admin'));
  // Crea una obra desde la pantalla (se guarda con su dueño).
  const f = s.p.locator('form').filter({ has: s.p.locator('input[placeholder^="Ej. Techo"]') }).first();
  await f.locator('input[placeholder^="Ej. Techo"]').fill('Obra nueva de A');
  await f.locator('select').first().selectOption({ label: 'Cliente A' });
  await f.locator('input[type="number"]').first().fill('5000');
  await f.getByRole('button', { name: /Agregar/ }).click();
  await s.p.waitForTimeout(2500);
  t = await texto(s.p);
  check('A crea una obra', t.includes('Obra nueva de A'));
  await s.ir('clients'); t = await texto(s.p);
  check('A ve su cliente y no el de B', t.includes('Cliente A') && !t.includes('Cliente B'));
  for (const v of ['dashboard', 'finances', 'gastos', 'soporte', 'usabilidad', 'biblioteca', 'settings', 'membresia', 'contracts', 'precios', 'reporte']) await s.ir(v);
  const ls = await s.p.evaluate(() => JSON.stringify(Object.assign({}, localStorage)));
  check('En el equipo de A no queda ningún PIN de otros', !ls.includes('222222'));
  check('En el equipo de A no queda la lista de usuarios', !/sync_cache_usuarios|usuarios_backup_snapshot/.test(ls));
  check('Sin errores de permisos en las pantallas de A', s.permisos.length === 0, JSON.stringify(s.permisos.slice(0, 5)));
  await s.p.screenshot({ path: `${OUT}/e2e_usuarioA.png` });
  await s.ctx.close();
}

console.log('\nAdministrador (PIN de prueba)');
{
  const s = await sesion('135790', 'admin');
  await s.ir('usuarios'); let t = await texto(s.p);
  check('Admin ve la lista de accesos', t.includes('Usuario A') && t.includes('Usuario B'));
  await s.ir('supervision'); t = await texto(s.p);
  check('Admin ve los datos de sus usuarios (Supervisión)', t.includes('Usuario B'));
  await s.ir('projects'); t = await texto(s.p);
  check('Admin ve su obra', t.includes('Obra del Admin'));
  for (const v of ['dashboard', 'soporte', 'usabilidad', 'biblioteca', 'settings', 'admin_purchases']) await s.ir(v);
  check('Sin errores de permisos en las pantallas del admin', s.permisos.length === 0, JSON.stringify(s.permisos.slice(0, 5)));
  await s.p.screenshot({ path: `${OUT}/e2e_admin.png` });
  await s.ctx.close();
}

console.log('\nMismo equipo, otra persona: el trabajo no se comparte');
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => { localStorage.setItem('innova_notif_preguntado', '1'); localStorage.setItem('innova_recordatorio_app', String(Date.now())); });
  const entrar = async (pin) => {
    await p.goto(URL); await p.waitForTimeout(3000);
    await p.locator('input').first().fill(pin);
    await p.getByRole('button', { name: /ingresar/i }).click();
    await p.getByText('Panel Principal').first().waitFor({ timeout: 40000 }); await p.waitForTimeout(2000);
    for (let i = 0; i < 3; i++) { const n = p.getByRole('button', { name: 'Ahora no' }); if (await n.count()) await n.first().click().catch(() => {}); await p.waitForTimeout(300); }
  };
  const salir = async () => { await p.locator('button[title="Cerrar Sesión"]').first().click(); await p.waitForTimeout(1500); };
  const enTechos = async () => { await p.evaluate(() => window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: 'techos' }))); await p.waitForTimeout(3000); return p.evaluate(() => ({ nombre: localStorage.getItem('innova_techos_nombre_actual') || '', nodos: Object.keys((JSON.parse(localStorage.getItem('innova_techos_escena_actual') || '{}').nodes) || {}).length })); };
  await entrar('135790');
  await p.evaluate(() => {
    localStorage.setItem('innova_techos_nombre_actual', JSON.stringify('Techo del Admin'));
    localStorage.setItem('innova_techos_escena_actual', JSON.stringify({ nodes: { n1: { id: 'n1', x: 0, y: 3, z: 0 }, n2: { id: 'n2', x: 6, y: 3, z: 0 } }, segments: { s1: { id: 's1', start: 'n1', end: 'n2', type: 'viga_principal' } }, coverageZones: {} }));
  });
  await salir();
  await entrar('111111');
  const a = await enTechos();
  check('Otro usuario en el mismo equipo NO ve el techo del admin', !a.nombre.includes('Techo del Admin'), JSON.stringify(a));
  check('El área de Techos empieza en blanco para quien entra', a.nodos === 0, JSON.stringify(a));
  await p.screenshot({ path: `${OUT}/e2e_techos_blanco.png` });
  await salir();
  await entrar('135790');
  const ad = await p.evaluate(() => localStorage.getItem('innova_techos_nombre_actual') || '');
  check('El admin recupera su trabajo al volver a entrar', ad.includes('Techo del Admin'), ad);
  await ctx.close();
}

console.log('\nIntentos fallidos');
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  const p = await ctx.newPage();
  await p.goto(URL); await p.waitForTimeout(3500);
  let ultimo = '';
  for (let i = 0; i < 6; i++) {
    await p.locator('input').first().fill('99999' + i);
    await p.getByRole('button', { name: /ingresar/i }).click();
    await p.waitForTimeout(1800);
    ultimo = await texto(p);
  }
  check('Un PIN equivocado no entra', !ultimo.includes('Panel Principal'));
  check('Tras 5 fallos bloquea por unos minutos', /Demasiados intentos/i.test(ultimo));
  await p.locator('input').first().fill('111111');
  await p.getByRole('button', { name: /ingresar/i }).click();
  await p.waitForTimeout(2500);
  check('Bloqueado: ni con el PIN correcto entra (hasta que pase el tiempo)', /Demasiados intentos/i.test(await texto(p)));
  await p.screenshot({ path: `${OUT}/e2e_bloqueo.png` });
  await ctx.close();
}

console.log('\nSin PIN: alguien que cambia el navegador para hacerse pasar por admin');
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => { localStorage.setItem('innova_notif_preguntado', '1'); localStorage.setItem('innova_sesion_v2', '1'); localStorage.setItem('savedUser', JSON.stringify({ id: 'admin', name: 'Falso', role: 'admin', pin: '', isActive: true })); });
  await p.goto(URL); await p.waitForTimeout(7000);
  for (let i = 0; i < 3; i++) { const n = p.getByRole('button', { name: 'Ahora no' }); if (await n.count()) await n.first().click().catch(() => {}); await p.waitForTimeout(300); }
  await p.evaluate(() => window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: 'usuarios' }))); await p.waitForTimeout(2500);
  const t = await texto(p);
  check('El falso admin NO ve los PIN ni los usuarios', !t.includes('111111') && !t.includes('Usuario A'));
  await p.evaluate(() => window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: 'projects' }))); await p.waitForTimeout(2500);
  const t2 = await texto(p);
  check('El falso admin NO ve obras', !t2.includes('Obra de A') && !t2.includes('Obra de B') && !t2.includes('Obra del Admin'));
  await p.screenshot({ path: `${OUT}/e2e_falso_admin.png` });
  await ctx.close();
}

await b.close();
console.log(`\nResultado: ${ok} correctas, ${mal} con problema.`);
process.exit(mal ? 1 : 0);
