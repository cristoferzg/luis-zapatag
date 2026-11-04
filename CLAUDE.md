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
  de los cambios. Después de mandarlas, **compilar todo (ZIP, APK y el Manual de usuario
  actualizado con los cambios: `docs/Manual_de_usuario_Innova_Contratistas.pdf`) sin esperar** su
  aprobación (indicación del dueño). No reconstruir ni reenviar si no hubo cambios.

## Avisos push (FCM)
- App Android con `@capacitor/push-notifications` + `android/app/google-services.json`.
  Token por celular en `push_tokens/<token>` `{ws, role}` (`src/lib/pushNativo.ts`).
- Envío desde Cloud Functions (`aviso*` en `functions/index.js`, triggers de Firestore):
  comunicados/clases/recursos → usuarios; ticket/asesoría nueva → admin; cambio de estado → autor.
- Con la app abierta el sistema no muestra el push; la app avisa con notificaciones locales
  (`notificar` evita repetir lo que ya llegó por push al volver a abrirla).

## Ayuda y soporte (chat)
- Reemplaza "Atención & Asesorías" en el menú (`AyudaSoporteView`). Un chat por usuario en
  `soporte_chats/<ws>` (`src/lib/soporte.ts`); regla: dueño o admin.
- Asistente: Cloud Function `asistenteSoporte` (gratis, tope 30/día por usuario en
  `ai_access/<ws>.soporteDia`; solo con la IA activada para usuarios). Sin IA: respuestas
  locales (FAQ). Nunca menciona proveedor ni modelo.
- Asesorías y reportes del chat se guardan también en `asesorias` / `tickets` (sus avisos y su
  gestión siguen igual; el admin los gestiona en la pestaña "Asesorías y reportes").
- Push del chat: `avisoSoporte` (trigger). Compras en la app: `config_ia/planes.comprasEnApp`.

## Descargas de la app y versión nueva
- `config_ia/descargas` (`src/lib/appDescargas.ts`): enlaces Android/PC/iPhone con `activo`,
  `recordatorioDias` y `ultima {fecha (= __BUILD__), nota, obligatoria}`. Panel en Configuración
  (`DescargasAppPanel`); aviso al entrar y recordatorio en `AvisoVersionApp` (montado en App).
- Flujo al publicar: desplegar hosting, subir la app nueva a Play, y luego el admin pulsa
  "Avisar a todos que actualicen" (también publica un comunicado → push).
- Programa de PC 2.0 (`desktop/`, `npm run dist`): manda su versión en el agente (`InnovaContratistasPC/x.y.z`); si el instalador subido (versión tomada del nombre `InnovApp-Setup-x.y.z.exe`) es más nuevo, `AvisoVersionApp` invita a descargarlo.
- Instalador de PC: el admin lo sube desde el panel (web/PC) a `descargas/pc` (Storage: lectura pública, escritura admin). En la app Android no se ofrecen otros instaladores; el aviso de actualización solo lleva a la ficha de Play (`enlacePlaySeguro`).
- Simulación solo en DEV: `window.__descargasSimuladas` (incluirlo en el grep del dist).

## Seguridad (reglas por usuario)
- `firestore.rules`: cada usuario solo lo suyo (`userId` / `authorUid`); contenido del sistema
  solo admin; sin PIN (sesión anónima) no se lee nada. Ver `SECURITY.md`.
- El PIN se valida SOLO en `loginWithPin` (bloqueo tras 5 fallos). No volver a poner hashes de
  PIN ni ingresos de respaldo en el cliente. Los listeners se abren solo con sesión con PIN.
- Pruebas: `cd seguridad && npm test` (reglas), `npm run test:storage` (Storage) y `npm run test:app` (app + emuladores;
  `VITE_EMULADORES=1` solo en DEV). Correrlas antes de publicar cambios de reglas o de datos.

## Versión y comunicados
- Versión única automática `AAAA.MM.DD.HHmm` (Lima) generada por Vite (`__VERSION__`, `dist/version.txt`);
  Gradle la lee de `android/app/src/main/assets/public/version.txt` (tras `npx cap sync`) para
  versionName. versionCode = contador en `android/app/codigo-version.txt` (subir 1 por cada versión a Play; NO usar fechas: Play rechaza saltos grandes).
- Comunicados: `src/lib/comunicados.ts` (publicar/quitar uno por uno). No reescribir la lista
  `notificaciones` con el setter del hook (borraba los que faltaban en la copia local).
- Google Play: `cd android && gradle bundleRelease` firma con `android/keystore.properties` (fuera del repo).

## Compras con Google Play (app Android)
- `cordova-plugin-purchase` (Billing 9). Cliente `src/lib/pagosPlay.ts`; interruptor `config_ia/planes.pagosGooglePlay`
  (Configuración → Planes y créditos). Con él activo, en Android los planes/recargas de IA se pagan SOLO con Google.
- IDs: `creditos_<n>` (consumible) y `plan_<id>` (suscripción, planes base `mensual`/`anual`).
- Servidor: `validarCompraPlay` verifica con la API de Google Play (cuenta de servicio de las funciones invitada en
  Play Console), entrega una sola vez (`compras_play/<sha256 token>`, solo servidor), consume/reconoce y registra en
  `purchases` (`origen: 'google_play'`). Renovaciones: se confirman al abrir la app.
- Pruebas: `cd seguridad && npm run test:play` (API de Google simulada, solo en emulador).
