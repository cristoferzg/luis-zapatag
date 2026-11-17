# Asistente de WhatsApp: cómo conectarlo a tu número

El asistente atiende tu número de **WhatsApp Business** desde InnovApp: responde a los clientes,
revisa la captura del Yape o Plin y te avisa. **Nada se entrega sin tu "sí"** (Administración → WhatsApp).
Sigues usando la app WhatsApp Business en tu celular con el mismo número ("coexistencia").

## 1. Meta (una sola vez)
1. Entra a business.facebook.com y crea (o usa) tu cuenta comercial de Meta. Verifica tu negocio si te lo pide.
2. Entra a developers.facebook.com → **Crear app** → tipo **Negocios** → agrega el producto **WhatsApp**.
3. Conecta tu número **existente de la app WhatsApp Business** (opción de coexistencia: "conectar la app
   WhatsApp Business"). Se escanea un código QR desde tu celular y se comparte el historial.
   - Si en tu panel no aparece esa opción, se hace con un proveedor oficial de Meta (BSP). Avísame y lo vemos.
4. En **Usuarios del sistema** (configuración del negocio) crea un usuario del sistema con permiso sobre la app y
   el número, y genera un **token permanente** con los permisos `whatsapp_business_messaging` y
   `whatsapp_business_management`. Ese es tu `WA_TOKEN`.
5. En la app de Meta → Configuración → Básica, copia la **Clave secreta de la app**. Ese es tu `WA_APP_SECRET`.
6. Inventa una palabra secreta (por ejemplo `innova-2026-xyz`). Ese es tu `WA_VERIFY_TOKEN`.

## 2. Guardar las claves y desplegar (en la carpeta del proyecto, en CMD)
```
firebase functions:secrets:set WA_TOKEN
firebase functions:secrets:set WA_APP_SECRET
firebase functions:secrets:set WA_VERIFY_TOKEN
firebase deploy --only hosting,functions,firestore:rules
```
(Cada comando te pide pegar el valor. Nunca los mandes por chat.)

## 3. Conectar el webhook en Meta
WhatsApp → Configuración → Webhook:
- URL de devolución: `https://us-central1-innovacontratistas-434d2.cloudfunctions.net/whatsappWebhook`
- Token de verificación: tu `WA_VERIFY_TOKEN`
- Suscribirse a los campos **messages** y **smb_message_echoes** (este último hace que el asistente se calle
  cuando tú escribes desde tu celular).

## 4. Plantillas (para cuando pasan más de 24 h)
Meta solo deja escribir libremente dentro de las 24 h desde el último mensaje del cliente. Para enviar el PIN
después de ese plazo, crea estas plantillas (categoría **Utilidad**, idioma **Español**) en WhatsApp Manager:
- `innovapp_acceso`: "Hola {{1}}, tu acceso a InnovApp ya está activo. Tu PIN es {{2}}. Entra desde la app o la web y escribe tu PIN."
- `innovapp_creditos`: "Listo, ya cargamos {{1}} créditos a tu cuenta de InnovApp."

## 5. Encenderlo
InnovApp → Administración → WhatsApp → Ajustes → **Asistente de WhatsApp** (encendido). Revisa el precio (S/ 50)
y escribe en "Indicaciones" lo que el asistente debe saber (qué incluye el acceso, si es de por vida o mensual,
horarios, promociones). Necesita la IA con saldo (la misma clave `ANTHROPIC_API_KEY`).

## Costos
Meta cobra por conversación según su tarifa para Perú y la IA cobra por cada respuesta. Revisa los montos en tu
panel de Meta y en el de la IA antes de encender; el asistente tiene un tope de 300 respuestas al día.
