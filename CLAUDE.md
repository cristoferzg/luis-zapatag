# Innova Contratistas — Notas del proyecto

PWA de gestión para contratistas (React 19 + Vite 6 + TypeScript + Tailwind + Firebase).

- Build: `npm run build` · Typecheck: `npx tsc --noEmit` (debe dar 0 errores).
- Auth: anónimo + PIN (Cloud Function `loginWithPin` que emite custom token con
  claims `role` ('admin'|'usuario') y `workspace`).
- Funciones (Blaze): `loginWithPin`, `scanReceipt` (boletas), `analyzeRoofPlan`
  (planos a mano). Usan `ANTHROPIC_API_KEY` (secreto). Modelo económico Haiku.

## ⚠️ PENDIENTE IMPORTANTE — Seguridad de la IA (NO olvidar)

Estado actual (decisión del dueño): **la IA está habilitada SOLO para el ADMIN**
(pruebas internas). Los usuarios NO la ven ni se les ofrecen planes todavía.
Switch: `IA_HABILITADA_USUARIOS` en `src/lib/aiAccess.ts` (hoy = `false`).

Cuando el dueño dé luz verde para abrir la IA a usuarios (planes de pago),
implementar TODO esto junto (ya está diseñado y aprobado en concepto):

1. **Reglas de Firestore** (`firestore.rules`): quitar `config_ia` y `ai_access`
   de la regla comodín y bloquearlas:
   - `config_ia/*`: lee cualquiera autenticado; **escribe solo admin**.
   - `ai_access/*`: lee su dueño (`uid == token.workspace`) o admin; **escribe solo admin**.
   - El resto de colecciones se listan explícitas (`allow read,write: if authed()`),
     porque en Firestore "si alguna regla permite, se concede": una comodín abierta
     anularía las restricciones de arriba.
   - **Cada colección NUEVA que se agregue a la app hay que añadirle su línea aquí**,
     o esa sección no podrá leer/escribir.

2. **Cobro/enforcement en la Cloud Function** (server-side, a prueba de trampas):
   agregar `cobrarUsoIA(req)` al inicio de `scanReceipt` y `analyzeRoofPlan`:
   - admin → ilimitado (return).
   - lee `ai_access/<uid>` (uid = `req.auth.token.workspace`), transacción:
     verifica plan, recarga mensual leyendo `config_ia/planes`, rechaza si agotado
     (`resource-exhausted`) o sin plan (`permission-denied`), y **descuenta 1 uso**.
   - Motivo: como las reglas bloquean que el cliente escriba `ai_access`, el
     descuento DEBE hacerse en el servidor.

3. **Cliente**: `checkAIAccess` queda **solo lectura** (para mostrar el modal de
   planes antes); quitar los `consumeAIUse` del cliente (ahora lo hace el servidor).
   Poner `IA_HABILITADA_USUARIOS = true`. El QR de boletas sigue GRATIS para todos.

4. **Operación**: desplegar con `firebase deploy --only hosting,functions,firestore:rules`
   (NO subir el ZIP a mano: así no se aplican `firebase.json` ni las reglas).
   Poner tope de gasto (Budget alert) en Google Cloud Billing.

## Convenciones de atribución (git)
- Commits terminan con las líneas Co-Authored-By / Claude-Session indicadas por la sesión.
- No incluir identificadores de modelo en commits, PRs ni artefactos del repo.

## Regla del dueño
- Antes de empaquetar el `dist_ACTUALIZADO.zip`, mostrar imágenes del **antes y después**
  de los cambios y esperar su aprobación.
