# Innova Contratistas — Notas del proyecto

PWA de gestión para contratistas (React 19 + Vite 6 + TypeScript + Tailwind + Firebase).

- Build: `npm run build` · Typecheck: `npx tsc --noEmit` (debe dar 0 errores).
- Auth: anónimo + PIN (Cloud Function `loginWithPin` que emite custom token con
  claims `role` ('admin'|'usuario') y `workspace`).
- Funciones (Blaze): `loginWithPin`, `scanReceipt` (boletas), `analyzeRoofPlan`
  (planos a mano). Usan `ANTHROPIC_API_KEY` (secreto). Modelo económico Haiku.

## IA para usuarios — créditos (IMPLEMENTADO, falta desplegar)

- Interruptor SIN recompilar: `config_ia/planes.habilitadaUsuarios` (botón "Activar para
  usuarios" en Configuración → Planes y créditos). Hoy APAGADO: el dueño aún no tiene
  saldo en la API; se despliega solo hosting y luego functions + rules al activar.
  En la interfaz NUNCA se muestra el proveedor ni el modelo.
- Créditos: boleta sin QR = 1, plano a mano = 10 (`COSTO_CREDITOS`, igual en
  `functions/index.js`). QR de boletas gratis. Planes: Gratis 15/mes, Maestro,
  Taller Pro, Empresa (mensual o anual) + recargas que no vencen. Config en
  `config_ia/planes` (`{planes, packs}`), editable en Configuración (admin).
- Cobro en el servidor: `cobrarUsoIA(request, accion)` en `scanReceipt` y
  `analyzeRoofPlan` (transacción en `ai_access/<workspace>`; recarga mensual,
  vencimiento → Gratis; `resource-exhausted 'SIN_CREDITOS'`; devuelve los
  créditos si la IA falla o no lee nada). El cliente solo lee el saldo.
- Validar Compras: `ai_plan_<id>[__anual]` activa plan; `ai_creditos_<n>` suma recarga.
- `firestore.rules`: sin comodín. `config_ia` escribe solo admin; `ai_access`
  lee dueño/admin, escribe solo admin. **Cada colección NUEVA necesita su línea.**
- Despliegue: `firebase deploy --only hosting,functions,firestore:rules`
  (NO subir el ZIP a mano). Poner tope de gasto (Budget alert). Guía:
  `docs/Guia_API_IA_y_App_Android.pdf`.

## Convenciones de atribución (git)
- Commits terminan con las líneas Co-Authored-By / Claude-Session indicadas por la sesión.
- No incluir identificadores de modelo en commits, PRs ni artefactos del repo.

## Regla del dueño
- Antes de empaquetar el `dist_ACTUALIZADO.zip`, mostrar imágenes del **antes y después**
  de los cambios y esperar su aprobación.
