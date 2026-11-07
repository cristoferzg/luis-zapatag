// Pruebas de las reglas de Firestore con el emulador (no tocan la base real).
// Ejecutar desde esta carpeta:  npm test
// Simula: admin, usuario A, usuario B, sesión anónima y visitante sin sesión, y prueba
// las mismas consultas que hace la app.
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, addDoc,
} from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-innova',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
});

// Datos de partida (sin reglas).
await env.withSecurityRulesDisabled(async (ctx) => {
  const d = ctx.firestore();
  await setDoc(doc(d, 'projects/pA'), { name: 'Obra A', userId: 'user_A' });
  await setDoc(doc(d, 'projects/pA2'), { name: 'Obra A legado', userId: 'A' });
  await setDoc(doc(d, 'projects/pB'), { name: 'Obra B', userId: 'user_B' });
  await setDoc(doc(d, 'projects/pAdm'), { name: 'Obra admin', userId: 'admin' });
  await setDoc(doc(d, 'clients/cB'), { name: 'Cliente B', userId: 'user_B' });
  await setDoc(doc(d, 'finances/fB'), { monto: 100, userId: 'user_B' });
  await setDoc(doc(d, 'settings/sB'), { appName: 'B', userId: 'user_B' });
  await setDoc(doc(d, 'usuarios/A'), { name: 'A', pin: '111111', role: 'user', userId: 'admin' });
  await setDoc(doc(d, 'usuarios/B'), { name: 'B', pin: '222222', role: 'user', userId: 'admin' });
  await setDoc(doc(d, 'tickets/tA'), { title: 'Ticket A', userId: 'user_A' });
  await setDoc(doc(d, 'tickets/tB'), { title: 'Ticket B', userId: 'user_B' });
  await setDoc(doc(d, 'asesorias/aB'), { tema: 'B', userId: 'user_B' });
  await setDoc(doc(d, 'purchases/compA'), { userId: 'A', status: 'pendiente' });
  await setDoc(doc(d, 'purchases/compB'), { userId: 'B', status: 'pendiente' });
  await setDoc(doc(d, 'cursos/c1'), { name: 'Curso', allowedUserIds: [], userId: 'admin' });
  await setDoc(doc(d, 'notificaciones/n1'), { title: 'Hola' });
  await setDoc(doc(d, 'config_flags/global'), { disabledSections: [] });
  await setDoc(doc(d, 'config_ia/planes'), { planes: [] });
  await setDoc(doc(d, 'ai_access/A'), { planId: 'gratis', creditosRestantes: 15 });
  await setDoc(doc(d, 'ai_access/B'), { planId: 'gratis', creditosRestantes: 15 });
  await setDoc(doc(d, 'planos_techos/dA'), { nombre: 'Techo A', authorUid: 'A', savedAt: 1 });
  await setDoc(doc(d, 'planos_techos/dB'), { nombre: 'Techo B', authorUid: 'B', savedAt: 2 });
  await setDoc(doc(d, 'soporte_chats/B'), { ws: 'B', mensajes: [] });
  await setDoc(doc(d, 'propuestas/prop1'), { titulo: 'Techo', estado: 'enviada', total: 1000 });
  await setDoc(doc(d, 'login_intentos/x'), { fallos: 3 });
});

const admin = env.authenticatedContext('admin', { role: 'admin', workspace: 'admin' }).firestore();
const A = env.authenticatedContext('A', { role: 'user', workspace: 'A' }).firestore();
const anon = env.authenticatedContext('anon123', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const nadie = env.unauthenticatedContext().firestore();
const misIds = ['user_A', 'A'];

let ok = 0, mal = 0;
async function caso(nombre, esperado, fn) {
  try {
    await (esperado === 'permite' ? assertSucceeds(fn()) : assertFails(fn()));
    ok++; console.log('  ✔', nombre);
  } catch (e) {
    mal++; console.log('  ✘', nombre, '→', e?.message?.split('\n')[0]);
  }
}

console.log('\nDatos privados (proyectos, clientes, finanzas, configuración)');
await caso('A lista sus proyectos (consulta de la app)', 'permite', () => getDocs(query(collection(A, 'projects'), where('userId', 'in', misIds))));
await caso('A NO lista todos los proyectos', 'niega', () => getDocs(collection(A, 'projects')));
await caso('A NO lee el proyecto de B', 'niega', () => getDoc(doc(A, 'projects/pB')));
await caso('A NO pide registros "shared"', 'niega', () => getDocs(query(collection(A, 'projects'), where('userId', 'in', [...misIds, 'shared']))));
await caso('A crea un proyecto suyo', 'permite', () => setDoc(doc(A, 'projects/nuevoA'), { name: 'x', userId: 'user_A' }));
await caso('A NO crea un proyecto a nombre de B', 'niega', () => setDoc(doc(A, 'projects/falso'), { name: 'x', userId: 'user_B' }));
await caso('A edita su proyecto (merge)', 'permite', () => setDoc(doc(A, 'projects/pA'), { name: 'Obra A2' }, { merge: true }));
await caso('A NO se pasa su proyecto a B', 'niega', () => updateDoc(doc(A, 'projects/pA'), { userId: 'user_B' }));
await caso('A NO edita el proyecto de B', 'niega', () => setDoc(doc(A, 'projects/pB'), { name: 'hack' }, { merge: true }));
await caso('A NO borra el proyecto de B', 'niega', () => deleteDoc(doc(A, 'projects/pB')));
await caso('A NO lee clientes de B', 'niega', () => getDoc(doc(A, 'clients/cB')));
await caso('A NO lee finanzas de B', 'niega', () => getDoc(doc(A, 'finances/fB')));
await caso('A NO lee la configuración de B', 'niega', () => getDoc(doc(A, 'settings/sB')));
await caso('Admin lista todos los proyectos', 'permite', () => getDocs(collection(admin, 'projects')));
await caso('Admin edita el proyecto de B', 'permite', () => setDoc(doc(admin, 'projects/pB'), { name: 'ok' }, { merge: true }));

console.log('\nSin PIN (sesión anónima o visitante)');
await caso('Anónimo NO lista proyectos', 'niega', () => getDocs(collection(anon, 'projects')));
await caso('Anónimo NO lee usuarios (PIN)', 'niega', () => getDocs(collection(anon, 'usuarios')));
await caso('Anónimo NO crea comunicados', 'niega', () => addDoc(collection(anon, 'notificaciones'), { title: 'spam' }));
await caso('Anónimo NO borra proyectos', 'niega', () => deleteDoc(doc(anon, 'projects/pA')));
await caso('Visitante NO lee nada privado', 'niega', () => getDoc(doc(nadie, 'projects/pA')));
await caso('Anónimo NO lee cursos', 'niega', () => getDocs(collection(anon, 'cursos')));

console.log('\nUsuarios y PIN');
await caso('A lee su propia ficha', 'permite', () => getDoc(doc(A, 'usuarios/A')));
await caso('A NO lee la ficha de B', 'niega', () => getDoc(doc(A, 'usuarios/B')));
await caso('A NO lista usuarios', 'niega', () => getDocs(collection(A, 'usuarios')));
await caso('A NO se hace admin', 'niega', () => updateDoc(doc(A, 'usuarios/A'), { role: 'admin' }));
await caso('A NO crea usuarios', 'niega', () => setDoc(doc(A, 'usuarios/C'), { pin: '333333' }));
await caso('Admin lista usuarios', 'permite', () => getDocs(collection(admin, 'usuarios')));
await caso('Admin cambia un PIN', 'permite', () => updateDoc(doc(admin, 'usuarios/B'), { pin: '444444' }));
await caso('Nadie lee los intentos de ingreso', 'niega', () => getDoc(doc(A, 'login_intentos/x')));

console.log('\nTickets, asesorías y compras');
await caso('A lista sus tickets', 'permite', () => getDocs(query(collection(A, 'tickets'), where('userId', 'in', misIds))));
await caso('A NO lista todos los tickets', 'niega', () => getDocs(collection(A, 'tickets')));
await caso('A crea un ticket suyo', 'permite', () => setDoc(doc(A, 'tickets/tA2'), { title: 'x', userId: 'user_A' }));
await caso('A NO lee asesorías de B', 'niega', () => getDoc(doc(A, 'asesorias/aB')));
await caso('A pide una compra (pendiente)', 'permite', () => addDoc(collection(A, 'purchases'), { userId: 'A', status: 'pendiente', itemId: 'ai_plan_maestro' }));
await caso('A NO crea una compra ya validada', 'niega', () => addDoc(collection(A, 'purchases'), { userId: 'A', status: 'validada' }));
await caso('A NO valida su compra', 'niega', () => updateDoc(doc(A, 'purchases/compA'), { status: 'validada' }));
await caso('A NO ve compras de B', 'niega', () => getDoc(doc(A, 'purchases/compB')));
await caso('Admin valida una compra', 'permite', () => updateDoc(doc(admin, 'purchases/compB'), { status: 'validada' }));

console.log('\nContenido y configuración del sistema');
await caso('A lee cursos', 'permite', () => getDocs(collection(A, 'cursos')));
await caso('A NO se regala un curso', 'niega', () => updateDoc(doc(A, 'cursos/c1'), { allowedUserIds: ['A'] }));
await caso('A lee comunicados', 'permite', () => getDocs(collection(A, 'notificaciones')));
await caso('A NO publica comunicados (push a todos)', 'niega', () => addDoc(collection(A, 'notificaciones'), { title: 'spam' }));
await caso('A NO cambia los apartados ocultos', 'niega', () => setDoc(doc(A, 'config_flags/global'), { disabledSections: ['techos'] }));
await caso('A lee config de la IA', 'permite', () => getDoc(doc(A, 'config_ia/planes')));
await caso('A NO cambia precios de planes', 'niega', () => setDoc(doc(A, 'config_ia/planes'), { planes: [] }));
await caso('Admin publica un comunicado', 'permite', () => addDoc(collection(admin, 'notificaciones'), { title: 'ok' }));

console.log('\nCréditos de IA');
await caso('A lee su saldo', 'permite', () => getDoc(doc(A, 'ai_access/A')));
await caso('A NO lee el saldo de B', 'niega', () => getDoc(doc(A, 'ai_access/B')));
await caso('A NO se suma créditos', 'niega', () => updateDoc(doc(A, 'ai_access/A'), { creditosRestantes: 9999 }));

console.log('\nDiseños de Techos');
await caso('A lista sus diseños (consulta de la app)', 'permite', () => getDocs(query(collection(A, 'planos_techos'), where('authorUid', '==', 'A'))));
await caso('A NO lista todos los diseños', 'niega', () => getDocs(collection(A, 'planos_techos')));
await caso('A guarda un diseño suyo', 'permite', () => setDoc(doc(A, 'planos_techos/dA2'), { nombre: 'x', authorUid: 'A' }));
await caso('A NO pisa el diseño de B', 'niega', () => setDoc(doc(A, 'planos_techos/dB'), { nombre: 'x', authorUid: 'A' }));

console.log('\nAyuda y soporte');
await caso('A escribe en su chat', 'permite', () => setDoc(doc(A, 'soporte_chats/A'), { ws: 'A' }, { merge: true }));
await caso('A NO lee el chat de B', 'niega', () => getDoc(doc(A, 'soporte_chats/B')));

console.log('\nPropuestas para el cliente (link público)');
await caso('El cliente abre la propuesta por su link', 'permite', () => getDoc(doc(nadie, 'propuestas/prop1')));
await caso('Nadie lista todas las propuestas sin PIN', 'niega', () => getDocs(collection(nadie, 'propuestas')));
await caso('El cliente la acepta', 'permite', () => updateDoc(doc(nadie, 'propuestas/prop1'), { estado: 'aceptada', aceptadaOpcion: 'B', aceptadaNombre: 'Rosa', aceptadaEn: 'hoy' }));
await caso('El cliente NO cambia el precio', 'niega', () => updateDoc(doc(nadie, 'propuestas/prop1'), { total: 1, estado: 'aceptada' }));

await env.cleanup();
console.log(`\nResultado: ${ok} correctas, ${mal} con problema.`);
process.exit(mal ? 1 : 0);
