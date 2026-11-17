# Guía de despliegue — Innova Contratistas

Pasos para publicar la app en Firebase (proyecto `innovacontratistas-434d2`).
Resumen rápido abajo; el detalle de seguridad está en `SECURITY.md`.

## 0) Requisitos (una sola vez, en tu computadora)
```bash
# Node 18+ y Firebase CLI
npm install -g firebase-tools
firebase login
```
El proyecto ya está fijado en `.firebaserc`, así que no necesitas `firebase use`.

## 1) Traer el código y construir
```bash
git clone -b claude/innova-contratistas-analysis-c3xs14 \
  https://github.com/cristoferzg/luis-zapatag.git
cd luis-zapatag
npm install
npm run build        # genera la carpeta dist/
```

## 2) Publicar la app (Hosting) — GRATIS
```bash
firebase deploy --only hosting
```
Verifica en https://innovacontratistas-434d2.web.app que todo cargue:
login, dashboard, Techos, Herrería, Contratos, etc.

> Importante: usa SIEMPRE `--only hosting` (o `--only firestore:rules`).
> Un `firebase deploy` sin `--only` intentaría desplegar también las Functions,
> que requieren el plan Blaze.

## 3) Seguridad — Fases 1 y 2a (GRATIS, hazlo en este orden)
Ya están en el código. El ORDEN importa para no bloquearte:

1. **Firebase Console → Authentication → Sign-in method → activar "Anónimo".**
2. `npm run build && firebase deploy --only hosting`
3. Verifica en vivo que entras y los datos cargan.
4. Recién entonces: `firebase deploy --only firestore:rules`
   (publica `firestore.rules`, que exige sesión autenticada).

Si algo falla, puedes volver temporalmente a la regla abierta mientras
diagnosticas, pero no la dejes así.

## 4) Seguridad — Fase 3 (aislamiento real, requiere plan Blaze)
Mantiene el login por PIN pero lo verifica en el servidor. Pasos:
```bash
cd functions && npm install && cd ..
firebase functions:secrets:set ADMIN_PIN      # define tu PIN de admin (6 dígitos)
firebase deploy --only functions
```
Prueba en un canal temporal antes de producción:
```bash
firebase hosting:channel:deploy prueba-seguridad
```
Cuando funcione, activa las reglas estrictas por claims:
```bash
cp firestore.rules.phase3 firestore.rules
firebase deploy --only firestore:rules
```
Detalle completo en `SECURITY.md`.

## 5) Cambiar el PIN de administrador
- **Antes de Fase 3:** edita `MASTER_ADMIN_PIN_HASH` en `src/App.tsx` con el
  SHA-256 de tu PIN nuevo (`printf 'TUPIN' | sha256sum`), luego build + deploy.
- **Con Fase 3:** se define como secreto `ADMIN_PIN` (paso 4), sin tocar código.
- Recuerda: el PIN demo `602908` usado en pruebas debe reemplazarse.

## (Opcional) Escaneo de comprobantes con IA (Claude) en Materiales & Gastos
El botón "Escanear comprobante" ya funciona GRATIS con el **QR** de las boletas/
facturas electrónicas (no requiere nada). Para que también lea **fotos sin QR**
con IA (Claude lee la foto), despliega la función `scanReceipt` (requiere Blaze):
```bash
# 1) Consigue una clave de API en https://console.anthropic.com/  (sección API Keys)
cd functions && npm install && cd ..
firebase functions:secrets:set ANTHROPIC_API_KEY   # pega tu clave
firebase deploy --only functions
```
Usa el modelo económico `claude-haiku-5-5` (costo bajo por foto). Mientras no se
despliegue, el QR sigue funcionando y las fotos sin QR se registran a mano
(nada se rompe).

## Comandos útiles
```bash
npm run build                        # compilar
firebase deploy --only hosting       # publicar web
firebase deploy --only firestore:rules
firebase hosting:channel:deploy NOMBRE   # canal de preview temporal
```
