// Revisa en el emulador lo que guardó la app.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'innovacontratistas-434d2' });
const s = await getFirestore().collection('projects').where('name', '==', 'Obra nueva de A').get();
const d = s.docs[0]?.data();
const bien = !!d && ['user_A', 'A'].includes(d.userId);
console.log(bien ? '  ✔ La obra nueva quedó guardada a nombre de A' : `  ✘ La obra nueva no quedó a nombre de A (${JSON.stringify(d?.userId)})`);
process.exit(bien ? 0 : 1);
