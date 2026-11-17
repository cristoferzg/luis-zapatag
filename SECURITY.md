# Seguridad — Innova Contratistas

## Estado actual (noviembre 2026)

| Riesgo | Estado |
|--------|--------|
| Reglas que dejaban leer/escribir todo a cualquier sesión (incluida la anónima) | ✅ Reglas por usuario (`firestore.rules`) |
| Huella (hash) del PIN maestro dentro de la página publicada | ✅ Eliminada; el PIN solo se valida en el servidor |
| Ingreso "de respaldo" en el navegador (lista de usuarios / copias con PIN) | ✅ Eliminado |
| PIN de todos los usuarios descargados en cada equipo | ✅ Solo el admin recibe la lista; se borran copias viejas |
| Probar PIN sin límite | ✅ 5 fallos → bloqueo de 15 min por conexión (`login_intentos`) |
| Cabeceras de seguridad / CSP, endpoint de ZIP, límite de cuerpo | ✅ (fases anteriores) |

## Cómo funciona

- **Ingreso:** `loginWithPin` (Cloud Function) valida el PIN y entrega un token con
  `role` ('admin' | 'user') y `workspace` (id del usuario). El PIN maestro es el secreto
  `ADMIN_PIN` del servidor. La sesión anónima (antes de poner el PIN) no puede leer nada.
- **Reglas:** cada registro tiene dueño (`userId`, o `authorUid` en diseños de Techos).
  El usuario lee y cambia solo lo suyo; el admin, todo. Contenido del sistema
  (cursos, recursos, comunicados, apartados, planes) lo cambia solo el admin. Las compras
  las crea el usuario como "pendiente" y las valida el admin. Los créditos los descuenta
  la función. Las propuestas se abren por su link pero no se pueden listar.

## Pruebas (no tocan la base real)

```
cd seguridad && npm install
npm test          # 59 pruebas de reglas (admin, usuario A/B, anónimo, visitante)
npm run test:app  # la app real contra emuladores: ingreso, aislamiento, bloqueo, falso admin
```
`test:app` usa el PIN de prueba de `functions/.secret.local` (no se sube al repo).

## Al publicar

1. `firebase deploy --only functions` (loginWithPin con bloqueo de intentos).
2. `firebase deploy --only hosting` (app sin el ingreso de respaldo).
3. `firebase deploy --only firestore:rules`.
4. **Cambiar el PIN maestro** (`firebase functions:secrets:set ADMIN_PIN`) y el PIN del
   usuario Demo: el anterior estuvo expuesto en la página publicada.
5. Revisar en la consola las reglas de **Storage** (no están en el repo).

Datos antiguos sin dueño (`userId: 'shared'` o diseños sin `authorUid`) solo los ve el admin.
