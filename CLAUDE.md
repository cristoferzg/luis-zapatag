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
- Créditos: boleta sin QR = 1, plano a mano = 10, diseño de melamina = 5 (`COSTO_CREDITOS`, igual en
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
  de los cambios y **ESPERAR a que el dueño diga "compila"** (indicación del dueño, 06/11/2026; reemplaza
  la regla anterior de compilar sin esperar). Al compilar: ZIP, APK/AAB y el Manual de usuario
  (`docs/Manual_de_usuario_Innova_Contratistas.pdf`) si cambia. No reconstruir ni reenviar si no hubo cambios.
- SIEMPRE en parejas: por cada pantalla que cambie, una captura del ANTES y otra del DESPUÉS (también en
  los ajustes pequeños y en cada nueva vuelta de un mismo cambio).
- Al entregar lo compilado, decir SIEMPRE (sin que lo pida) qué archivos del ZIP copiar y a qué carpeta,
  qué comandos correr y qué subir a Play.
- El Manual SOLO se rehace y se envía si los cambios afectan lo que explica (pasos, textos, preguntas
  frecuentes). Si no cambia nada en el Manual, no se crea ni se manda.

## Avisos push (FCM)
- App Android con `@capacitor/push-notifications` + `android/app/google-services.json`.
  Token por celular en `push_tokens/<token>` `{ws, role}` (`src/lib/pushNativo.ts`).
- Envío desde Cloud Functions (`aviso*` en `functions/index.js`, triggers de Firestore):
  comunicados/clases/recursos → usuarios; ticket/asesoría nueva → admin; cambio de estado → autor.
- Con la app abierta el sistema no muestra el push; la app avisa con notificaciones locales
  (`notificar` evita repetir lo que ya llegó por push al volver a abrirla).

## Comunicados programados y automáticos
- Panel admin `ComunicadosProgramadosPanel` (Configuración, debajo de "Publicar comunicado"). Datos en
  `comunicados_programados/<id>` {title, message, priority, durationHours, publicarEn, estado} y la biblioteca en
  `comunicados_programados/_auto` {activo, frecuencia semanal|quincenal|mensual, dia (0-6), hora, mensajes[], indice}.
  Regla: solo admin. La Cloud Function `comunicadosAutomaticos` (onSchedule cada 15 min, America/Lima) los publica en
  `notificaciones` (→ push con avisoComunicado). Tope: la biblioteca no publica si ese día ya salió uno automático.
  Prueba: `firebase emulators:exec --only firestore --project demo-innova "node seguridad/comunicados.test.mjs"`.
  DEV: `window.__programadosSimulados` (incluir en el grep del dist).

## Ayuda y soporte (chat)
- Reemplaza "Atención & Asesorías" en el menú (`AyudaSoporteView`). Un chat por usuario en
  `soporte_chats/<ws>` (`src/lib/soporte.ts`); regla: dueño o admin.
- Asistente: Cloud Function `asistenteSoporte` (gratis, tope 30/día por usuario en
  `ai_access/<ws>.soporteDia`; solo con la IA activada para usuarios). Sin IA: respuestas
  locales (FAQ). Nunca menciona proveedor ni modelo.
- Asesorías y reportes del chat se guardan también en `asesorias` / `tickets` (sus avisos y su
  gestión siguen igual; el admin los gestiona en la pestaña "Asesorías y reportes").
- Push del chat: `avisoSoporte` (trigger). Compras en la app: `config_ia/planes.comprasEnApp`.

## Avisos de contenido y bandeja
- Campana (`BandejaAvisos`, `lib/bandejaAvisos.ts`): guarda en el equipo los avisos (comunicados, clases, recursos,
  tickets, asesorías) aunque se borre la notificación del celular. La alimenta el efecto de avisos de App.
- Clases/recursos: solo se avisa y cuenta en "Novedades" lo que el usuario ve (`lib/accesoContenido.ts`; en Android,
  lo de pago que no tiene no aparece). Servidor: `avisoClaseNueva`/`avisoRecursoNuevo` solo a quien tiene acceso;
  `avisoClaseHabilitada`/`avisoCursoHabilitado`/`avisoRecursoHabilitado` al pasar a gratis o al dar acceso.
- Google Play: el botón Android se muestra siempre (`enlaceAndroid`, ficha oficial si no hay enlace). Tarjeta
  `TarjetaGooglePlay` en el Inicio: SOLO navegador de celular Android y SOLO si aún no tiene la app: la app anota
  `appAndroid {codigo, visto}` en el settings del usuario (App.tsx → `fijarAppEnCuenta`) y Chrome comprueba la app en
  el celular (`getInstalledRelatedApps`: `related_applications` en el manifest PWA + `asset_statements` en Android).

## Descargas de la app y versión nueva
- `config_ia/descargas` (`src/lib/appDescargas.ts`): enlaces Android/PC/iPhone con `activo`,
  `recordatorioDias` y `ultima {fecha (= __BUILD__), nota, obligatoria}`. Panel en Configuración
  (`DescargasAppPanel`); aviso al entrar y recordatorio en `AvisoVersionApp` (montado en App).
- Flujo al publicar: desplegar hosting, subir la app nueva a Play, y luego el admin pulsa
  "Avisar a todos que actualicen" (también publica un comunicado → push).
- Actualización obligatoria: `ultima.obligatoria`. Web/PC se comparan por `fecha` (= __BUILD__); la app Android por
  `ultima.codigoAndroid` (versionCode) contra `__CODIGO_ANDROID__` (vite lo lee de android/app/codigo-version.txt:
  SUBIR el contador ANTES de `npm run build`). El admin marca "App de Android" solo cuando Play ya aprobó la versión;
  "Quitar obligación" la desactiva. El admin nunca queda bloqueado.
- Programa de PC 2.0 (`desktop/`, `npm run dist`): manda su versión en el agente (`InnovaContratistasPC/x.y.z`); si el instalador subido (versión tomada del nombre `InnovApp-Setup-x.y.z.exe`) es más nuevo, `AvisoVersionApp` invita a descargarlo.
- Avisos en el programa de PC (2.1.0): Windows solo muestra notificaciones si el acceso directo del menú Inicio lleva el
  AppUserModelID `pe.innovacontratistas.pc` → `registrarAvisosWindows()` en desktop/main.cjs lo arregla/crea al abrir.
  Cerrar la ventana la oculta en la bandeja (Tray; "Salir" cierra de verdad); "Iniciar con Windows" (`--oculto`) activo
  por defecto. `preload.cjs` expone solo `innovaPC.mostrar()` (al tocar un aviso de la web se muestra la ventana).
- Programa de PC obligatorio: `config_ia/descargas.pc.obligatoria` (casilla en la fila Computadora del panel). Si el
  programa es más antiguo que `pc.version`, `AvisoVersionApp` bloquea con "Descargar el programa nuevo" (admin exento).
- Instalador de PC: el admin lo sube desde el panel (web/PC) a `descargas/pc` (Storage: lectura pública, escritura admin). En la app Android no se ofrecen otros instaladores; el aviso de actualización solo lleva a la ficha de Play (`enlacePlaySeguro`).
- Simulación solo en DEV: `window.__descargasSimuladas`, `__avanceSimulado`, `__iaSimulada`, `__programadosSimulados`, `__escenaTechos` (incluirlos en el grep del dist).

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

## Melamina (extras)
- `disenarMelamina` (Cloud Function, 5 créditos): texto y/o foto → muebles con medidas, partes, colores y ubicación
  (herramienta con esquema; el servidor limita los valores). UI: `src/components/melamina/DisenoIA.tsx`.
- Diseño de frentes por mueble: `estiloPuerta` (lisa/ranurada/vidrio), `tirador` (barra/boton/gola/push), `colorFrente`
  (bicolor: las piezas llevan `color` y se optimizan con ese tablero). 3D: puertas y cajones se abren (tocar o "Abrir puertas").
- Diseñador: en Android el arrastre bloquea el scroll solo si el toque empieza sobre un mueble (`data-mueble`).

## 3D (WebGL)
- TODOS los visores crean y liberan el lienzo con `crearRenderer` / `liberarRenderer` (src/lib/webglSeguro.ts): reintento con
  opciones livianas y `forceContextLoss` al desmontar (antes se acumulaban contextos → "Error creating WebGL context").
  Nunca usar `new THREE.WebGLRenderer` directo. Programa de PC 2.1.1: `ignore-gpu-blocklist` + `enable-unsafe-swiftshader`.

## Impresión en la app Android
- El WebView no tiene `window.print()`: `imprimirElemento` (src/lib/imprimir.ts) manda el HTML autocontenido al plugin nativo
  `Imprimir` (android/.../ImprimirPlugin.java → PrintManager: impresoras o "Guardar como PDF").

## Obra Civil (extras)
- `disenarObra` (Cloud Function, 8 créditos): texto y/o plano → muros (eje, espesor, alto, aberturas con `desde` al
  centro) y columnas; se cargan en el piso activo con `commit` (se puede deshacer). UI: `src/components/concreto/DisenoIAObra.tsx`.
- Aberturas con diseño: `estilo`, `color`, `abre`, `hacia`, `apertura` (geometriaObra: `estiloDe`, `aperturaDe`).
  3D (ConcretoViewer3D): puertas/ventanas cerradas; `registrar()` las anima en el loop; tocar = abrir/cerrar; botón "Abrir puertas".

## Drywall (extras)
- `disenarDrywall` (functions/drywallIA.js, fábrica `crearDisenarDrywall`, exportada en index.js; 5 créditos): texto/foto → partidas.
  UI: `src/components/drywall/DisenoIADrywall.tsx` (pestaña Cotizar).
- Pestaña 3D (`drywall/Drywall3D.tsx`): puertas y ventanas que se abren; "Ver por dentro (parantes)".
- Vanos con estilo/lado/tipo de ventana y "sumar al precio"; acabado por partida (empastado y pintado, colores).
  Catálogo extra: `DRYWALL_ITEMS_EXTRA` (src/catalogo/drywall.ts). 7 sistemas nuevos (murete, nicho, forros, cabecera, repisa, cielo curvo).

## Gasfitería y Electricidad
- Gasfitería (`GasfiteriaView`, `src/components/gasfiteria/*`, catálogo `gas:*`): aparatos, redes (fría/caliente/desagüe/ventilación),
  trazado automático, empalmes calculados, avisos IS.010, 3D, materiales y presupuesto. Clave `gasfiteria_`.
- Electricidad (`ElectricidadView`, `src/components/electricidad/*`, catálogo `ele:*`): puntos, circuitos, trazado, cuadro de cargas
  y unifilar, avisos CNE, 3D, materiales y presupuesto. Fondo desde Obra Civil/Gasfitería/Melamina/Techos; botón
  `BotonElectricidad` en esos apartados (guarda `electricidad_origen`). Clave `electricidad_`.

## Presupuesto de obra, Acabados, Madera, Vidrios, Avance e IA de instalaciones
- Presupuesto de obra (`ObraIntegralView`, `obraIntegral/fuentes.ts`: un lector por apartado; cronograma Gantt). Clave `obra_integral_`.
- Acabados (`AcabadosView`, `acabados/*`, `acab:*`), Carpintería de madera (`MaderaView`, `madera/*`, `mad:*`),
  Vidrios y aluminio (`VidriosView`, `vidrios/*`, `vid:*`); comunes en `carpinteria/comun/`. Cada uno guarda `*_cotizacion_actual.total`.
- Avance de obra con fotos: dentro de Proyectos (`avance/AvanceObraPanel.tsx`, `lib/avanceObra.ts`), datos en `project.avance`,
  fotos en Storage `obras/<ws>/<proyecto>/`.
- IA: `disenarGasfiteria` / `disenarElectricidad` (functions/gasfiteriaIA.js, electricidadIA.js, plantaIA.js; 6 créditos cada uno).
