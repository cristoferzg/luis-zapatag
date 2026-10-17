# Seguridad — Innova Contratistas

Estado del endurecimiento de seguridad, por fases. Cada fase es incremental y
se puede desplegar y probar por separado.

## Resumen de riesgos originales

| # | Riesgo | Gravedad | Estado |
|---|--------|----------|--------|
| 1 | Reglas de Firestore totalmente abiertas (`allow read, write: if true`) | Crítico | Fase 2a (parcial) → Fase 3 (completo) |
| 2 | Autenticación 100% en el cliente; PIN de admin (hash) en el bundle | Crítico | Fase 2a (rotado) → Fase 3 (server-side) |
| 3 | PINs de usuario en texto plano en Firestore | Alto | Fase 3 (lectura restringida) |
| 4 | Endpoint `/api/download-zip` sin autenticación | Crítico | ✅ Fase 1 |
| 5 | Sin cabeceras de seguridad / CSP | Alto | ✅ Fase 1 |
| 6 | Posible fuga de `VITE_GEMINI_API_KEY` al bundle | Alto | ✅ Fase 1 |
| 7 | `express.json({ limit: '500mb' })` (DoS) | Medio | ✅ Fase 1 |
| 8 | PIN en claro en `localStorage` (`savedPin`) | Medio | ✅ Fase 2b |

## Fase 1 — endurecimiento seguro (desplegado) ✅

- Cabeceras de seguridad + CSP en `firebase.json`.
- Eliminado `/api/download-zip` y su botón en el cliente.
- Quitado el fallback `VITE_GEMINI_API_KEY` en `server.ts`.
- Límite de cuerpo de Express 500 MB → 2 MB.
- Repo limpio (sin scripts de parcheo / backups) + `.gitignore`.

No cambia el comportamiento para el usuario.

## Fase 2a — sesión autenticada + reglas que exigen auth ✅

- `ensureAnonymousAuth()` en `firebase.ts` / `main.tsx`: sesión anónima al cargar.
- `firestore.rules`: `if request.auth != null` (ya no abierto).
- PIN maestro de admin rotado.

**Orden de despliegue (obligatorio):**
1. Firebase Console → Authentication → Sign-in method → activar **Anónimo**.
2. `npm run build && firebase deploy --only hosting`.
3. Verificar login y carga de datos en producción.
4. `firebase deploy --only firestore:rules`.

**Limitación:** con login solo-PIN, estas reglas evitan el escrapeo sin
autenticar, pero no aíslan del todo un workspace de otro (el cliente elige su
`userId`). Eso se resuelve en la Fase 3.

## Fase 2b — menos exposición de PIN ✅

- Eliminado el guardado del PIN en claro en `localStorage` (`savedPin`, que
  además nunca se leía).
- Nota: los PINs siguen siendo visibles para el admin en pantalla (función
  deseada), por eso NO se hashean en el cliente; su protección real es
  restringir la lectura de la colección `usuarios` (Fase 3).

## Fase 3 — aislamiento real con Cloud Function (preparado, requiere plan Blaze)

Mantiene la experiencia de PIN, pero verifica el PIN **en el servidor** y emite
un token con claims de confianza (`role`, `workspace`). Archivos incluidos:

- `functions/index.js` — función `loginWithPin` (Admin SDK + custom token).
- `functions/package.json`.
- `firestore.rules.phase3` — reglas basadas en claims (aislamiento por workspace;
  `usuarios` solo legible por admin / la función).
- `src/lib/pinAuth.ts` — helper de cliente `loginWithPinViaFunction`, **ya
  cableado** en `handlePinLogin` como vía preferente, con **fallback** al flujo
  heredado si la función aún no está desplegada (la app funciona antes y después
  del despliegue).

### Pasos para activar la Fase 3

1. `cd functions && npm install`
2. Define el PIN maestro como secreto (no lo pongas en código):
   `firebase functions:secrets:set ADMIN_PIN`
3. `firebase deploy --only functions`
   - El cliente ya llama a la función automáticamente; en cuanto esté
     desplegada, el login empieza a usar la vía servidor. No hay que tocar más
     código.
4. **Prueba en un canal de preview antes de ir a producción:**
   `firebase hosting:channel:deploy prueba-seguridad`
   Entra por la URL temporal que te da y verifica login (admin + un usuario).
5. Cuando funcione, despliega a producción: `firebase deploy --only hosting`.
6. Prueba también con el emulador si quieres:
   `firebase emulators:start --only firestore,functions`.
7. Sustituye `firestore.rules` por `firestore.rules.phase3` y despliega:
   `firebase deploy --only firestore:rules`.
8. (Opcional, recomendado) Una vez todo funcione con la función, elimina el
   hash del PIN de admin del bundle en `src/App.tsx`: el PIN de admin ya se
   verifica server-side con el secreto `ADMIN_PIN`.

### Por qué resuelve los riesgos
- El cliente ya no lee `usuarios`, así que los PINs dejan de estar expuestos.
- Nada del PIN de admin viaja en el bundle; la verificación es server-side y
  limitable por tasa.
- `request.auth.uid` / `request.auth.token.role` son de confianza, así que las
  reglas aíslan de verdad cada workspace.
