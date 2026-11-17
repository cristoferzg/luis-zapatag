# Registro de mejoras — InnovApp (Innova Contratistas)

Documento vivo: **una conversación = una mejora**. Al terminar cada mejora se añade una entrada nueva
arriba (la más reciente primero) con qué se pidió, qué se hizo, dónde está en el código, cómo se probó,
qué versión la lleva y qué quedó pendiente. Así cada conversación nueva empieza sabiendo lo anterior.

**Plantilla de cada entrada**

```
## AAAA-MM-DD · Título corto de la mejora
- Pedido del dueño: …
- Qué se hizo: …
- Archivos principales: …
- Cómo se probó: (tsc, build, pruebas, capturas antes/después)
- Versión: web AAAA.MM.DD.HHmm · Android código N  (o "sin compilar aún")
- Commit(s): …
- Pendiente / a vigilar: …
```

---

## 2026-11-17 · Compilación web 2026.11.17.0953 (sin app nueva)
- Pedido del dueño: "Compila".
- Incluye: Administración → Créditos (recargas y gasto), visor 3D más robusto, menú del celular por encima, Revit (octet-stream +
  aviso de cómo abrirlo), «Diseño editable» en vez de .json y Contratos en el celular (pestañas y letra de cláusulas).
- Android: SIN AAB (no hubo cambios nativos desde 26110427). Manual: sin cambios.
- Despliegue: `firebase deploy --only hosting,functions` (functions por el registro del gasto en cobrarUsoIA y mcpCursos).
- Commit(s): (este commit)

## 2026-11-17 · Academia: 7 plantillas nuevas en Recursos Técnicos (Excel de techos, liquidación y diseños de Carpintería Metálica)
- Pedido del dueño: "3" (de la lista de ideas: más plantillas para vender).
- Qué se hizo (ninguna gratis):
  - Excel de techos (S/ 9.90, Techos Metálicos): **Techo mariposa** (bib_1794920090880, taller 10 × 18 m: tijeral con canal central),
    **Techo diente de sierra** (bib_1794920091907, nave 12 × 24 m, 3 dientes, ventanas al sur), **Pérgola metálica** (bib_1794920093028,
    terraza 8 × 12 m, listones y/o cobertura Sí/No, hoja Replanteo). Mismo constructor `armar.py` (Datos · tabla · Metrado · Presupuesto · Catálogo).
  - **Liquidación de obra** (S/ 9.90, Plantillas, bib_1794920093981): adicionales/deductivos (solo aprobados), pagos, penalidad con tope, retención
    de garantía, saldo y Acta de liquidación que se llena sola. Orientación general (manda el contrato).
  - Diseños editables de Carpintería Metálica (S/ 5.90, Herrería): **Portón batiente de dos hojas 3.00 × 2.20** (bib_1794920094952),
    **Ventana de fierro con vidrio 1.80 × 1.20** (bib_1794920095810) y **Escalera en L con descanso** (bib_1794920096656). El "toldo" se cambió por
    la ventana: el módulo no tiene tipo toldo.
- Archivos: `contenido/academia/plantillas-excel/` (+ `fuentes/mariposa.py`, `diente_sierra.py`, `pergola.py`, `portadas_excel.py`),
  `contenido/academia/plantillas-kit/` (+ `fuentes/liquidacion_obra.py`, `portadas_kit.py`, `render.html` con cámara `__cam`),
  `contenido/academia/plantillas-carpimetal/generar.ts` + 3 .json nuevos.
- Cómo se probó: recalc con 0 errores en los 4 Excel; valores revisados a mano (montantes, áreas, saldo); vista de cada hoja; vistas 3D de los diseños.
- Versión: sin cambios de la app (solo contenido vía MCP).
- Commit(s): (este commit)
- Pendiente / a vigilar: abrir un diseño nuevo en la app real; sumar los nuevos a los paquetes sugeridos (Excel de Techos, Kit del contratista, Diseños de Carpintería).

## 2026-11-17 · Academia: curso «Techos a Dos y Cuatro Aguas» ampliado (≈45 min → ≈1 h 22 min)
- Pedido del dueño: "1" (de la lista de ideas: alargar los cursos a ≈8–10 min por clase, empezando por Techos).
- Qué se hizo: las 12 clases pasaron de 3.3–4.6 min a 6.0–7.4 min (total ≈82 min). Sin regrabar lo que ya estaba: se insertan escenas
  nuevas con la receta de Naves → respuesta del reto de la clase anterior al inicio; antes de los errores: segundo ejemplo con tabla,
  caso de obra, dos ejercicios para pausar (A y B) con solución, preguntas frecuentes y repaso rápido. Números verificados (factor
  √(1+p²), limatesa/limahoya por Pitágoras, limahoya = pendiente × 0.707, dilatación 0.012 mm/m·°C, metrados).
- Portada del curso con "≈1 h 22 min" y descripción actualizada.
- Archivos: `contenido/academia/videos/fuentes/techo_ext.py` + `techo_x1.py` … `techo_x12.py`; portada `contenido/academia/portadas/techos-v3.jpg`
  (`fuentes/portadas3.py`). Videos en la rama academia-videos `techos/techo-xN.mp4`.
- Cómo se probó: pronunciación de todas las frases nuevas con revisar_voz.py ("InnovApp" → "Innova Ap"; "sesenta, ochenta y un metro" → con centímetros);
  hojas de contacto (se achicó el dibujo de la respuesta de la clase 2 que tapaba el subtítulo); fotogramas de los videos.
- Versión: sin cambios de la app (solo contenido vía MCP; mismas clases, video nuevo).
- Commit(s): (este commit)
- Pendiente / a vigilar: siguen 7 cursos cortos (Soldadura, Estructuras, Carpintería, Planos, Negocio, Portones, Seguridad).

## 2026-11-17 · Créditos de usuarios (cómo recargan y en qué gastan) + arreglos del visor 3D y del menú
- Pedido del dueño: "Permíteme poder ver en qué los usuarios recargan sus créditos" → eligió «Recargas y gasto». Durante el trabajo:
  "verifica y corrige el visualizar 3D dentro de la Academia, algunos no se ven el botón" (captura: menú lateral tapado en Techos).
- Qué se hizo: Administración → Créditos (`CreditosUsuariosView`): tarjetas (créditos recargados, ingresos, créditos gastados,
  regalados), «¿Cómo recargan?» (Yape, Plin, Transferencia, Google Play, Mercado Pago, WhatsApp, validada a mano; de purchases
  validadas), «¿En qué gastan?» (barras por función y canjes), tabla por usuario (saldo, recargó, gastó) y detalle con sus recargas,
  últimos movimientos y «Regalar créditos». Periodo: este mes / mes pasado / todo.
  Servidor: `cobrarUsoIA` anota en ai_access gastoPorAccion, gastoMes (12 meses) y movimientos (últimos 40, con el nombre del
  curso/plantilla/paquete en los canjes); la devolución por error de IA lo descuenta. Regalos (referidos y a mano) quedan anotados.
  Visor 3D: el botón sale en toda plantilla de Techos/Carpintería y en diseños .json; acepta escena envuelta, texto JSON y diseños
  sin piezas (asegurarCad). Menú lateral del celular por encima de las ventanas (z 170; antes la de inicio de Techos lo tapaba).
- Archivos: `src/components/CreditosUsuariosView.tsx`, `functions/index.js`, `src/lib/aiAccess.ts`, `src/App.tsx`, `src/types/index.ts`,
  `academia/VisorPlantilla3D.tsx`, `academia/TarjetaRecurso.tsx`, `UsuariosView.tsx`, `seguridad/canje.test.mjs`.
- Cómo se probó: tsc 0 errores; `npm run test:canje` 15/15 (3 nuevas del registro de gasto); capturas antes/después (panel PC y celular,
  visor con escena envuelta y con .json, menú en Techos).
- Versión: sin compilar aún (hosting + functions: el gasto se anota desde que se despliegue).
- Commit(s): (este commit)
- Pendiente / a vigilar: el gasto anterior al despliegue no tiene detalle por función (solo el total de usos).
- Vuelta 3 (captura de Contratos & EPP en el celular): las pestañas «1. Llenar datos / 2. Ver contrato» ya no quedan pegadas arriba
  tapando el formulario al bajar, y las cláusulas usan letra normal (antes de máquina de escribir) y el cuadro se puede agrandar.
- Vuelta 2 (dueño: "No pongas archivo json. Revisa Revit… no lo reconoce"): «archivo .json» era solo el título de prueba; los diseños
  subidos como .json ahora se llaman «Diseño editable». IFC: validado con reglas EXPRESS completas (0 errores en techo, escalera y
  obra) → el contenido está bien. Se descarga como application/octet-stream (Android ya no puede cambiarle la extensión), cabecera
  CoordinationView_V2.0 y aviso al bajarlo: «Ábrelo desde Revit: Archivo → Abrir → IFC, o Insertar → Vincular IFC».

## 2026-11-17 · Compilación 26110427 (web 2026.11.16.2218) — «carga todo, compila todo»
- Web + AAB/APK 26110427 (firmados 01:D3…74:33, verificado). Manual V6 subido con el MCP a Recursos
  (bib_1792893362869 «Manual de Usuario de la Plataforma V6», archivo en academia/mcp/manual/).
- Play: la subida automática (subir-play.yml) NO se pudo lanzar: el archivo no está en la rama principal (master) → GitHub da 404.
  Para usarla: pasar .github/workflows/subir-play.yml a master y cargar los secretos KEYSTORE_BASE64/KEYSTORE_PASSWORD/
  PLAY_SERVICE_ACCOUNT_JSON. Esta vez el dueño sube el .aab a mano.
- Firebase: sin credenciales en el equipo de trabajo → el dueño despliega `firebase deploy --only hosting,functions`.
- Pendiente: tras desplegar functions, cargar `detalles` del visor 3D a las plantillas con el MCP.

## 2026-11-17 · Compilación web 2026.11.16.2212 (sin app nueva)
- Pedido del dueño: "Compila".
- Incluye: carga más rápida, Carpeta privada rediseñada (descargas PDF/AutoCAD/Revit), Academia con tarjetas de cursos para
  plantillas/recursos, búsqueda tolerante y mini visor 3D (+ `detalles` en el MCP).
- Android: SIN AAB nuevo (no hubo cambios nativos desde 26110426; la app carga la web del servidor).
- Manual: págs. 65 (Carpeta privada: Paso 1 lista + Paso 2 nuevo) y 78 (Mis plantillas con «Ver en 3D») con capturas nuevas
  (`docs/herramientas/manual_carpeta_plantillas.py`).
- Despliegue: `firebase deploy --only hosting,functions` (functions por mcpCursos/detalles; si ya se desplegaron las de 26110426
  basta `--only hosting,functions:mcpCursos`).
- Commit(s): (este commit)

## 2026-11-17 · Academia: plantillas y recursos con el mismo diseño que los cursos + mini visor 3D
- Pedido del dueño: "plantilla y recursos debe visualizar igual que los cursos… mejorar el diseño"; con capturas: buscar
  «plantillas» no las encontraba y «Mis plantillas» (admin) mostraba carrusel y tarjetas viejas. Además: "añade una opción para
  visualizar el diseño en 3D sin editarlo, sin descargar, como un mini visor, para que el MCP pueda añadir los detalles".
- Qué se hizo: `academia/TarjetaRecurso.tsx` (misma tarjeta que los cursos: portada 16:9 completa, etiquetas Plantilla editable /
  Destacado / Gratis / -%, tipo de archivo en simple —Se abre en Techos, Excel editable, Word, PDF, plano— título en 2 líneas,
  descripción y pie con precio + «Comprar» / «Canjear» con texto, o «Tienes acceso · Abrir →»). La usan la Tienda (3 columnas como
  cursos; antes 4 y la portada salía cortada) y «Mis plantillas» (ya no muestra el precio de lo que ya tienes ni el carrusel).
  Búsqueda tolerante (`coincideBusqueda`: sin tildes, plural/singular, por tipo). Mini visor `academia/VisorPlantilla3D.tsx`
  (botón «Ver en 3D» en plantillas de Techos y Carpintería Metálica; también antes de comprar): gira solo, se arrastra y acerca;
  ficha con medidas, piezas y metros calculados + «Detalles» que carga el MCP (`guardar_recurso.detalles` [{etiqueta, valor}],
  máx. 20, se limpian en el servidor). Usa las mismas piezas que AutoCAD/Revit (solidosCad).
- Archivos: `src/components/academia/TarjetaRecurso.tsx`, `VisorPlantilla3D.tsx`, `AcademiaTienda.tsx`,
  `src/components/BibliotecaPremiumView.tsx`, `functions/mcpCursos.js`, `seguridad/mcpCursos.test.mjs`.
- Cómo se probó: tsc 0 errores; `npm run test:mcp` OK (detalles nuevos); capturas antes/después en PC y celular con los 11 cursos
  y 14 recursos reales (títulos/precios del MCP); visor con la nave 12×24 y la escalera en U (medidas reales); búsqueda «plantillas» → 10.
- Versión: sin compilar aún (web: hosting; functions: mcpCursos por el campo detalles).
- Commit(s): (este commit)
- Pendiente / a vigilar: cargar «detalles» a las plantillas con el MCP (tras desplegar functions); Drywall no tiene vista 3D.

## 2026-11-16 · Academia: 6 tutoriales de uso DESDE EL CELULAR (Usabilidad de la plataforma)
- Pedido del dueño: "en usabilidad agrega videos tutoriales que se usen en el teléfono; solo hay desde la PC". Elegido: animados por Claude, todos los temas necesarios.
- Qué se hizo: serie "InnovApp en el celular" (6 clases gratis, 2–3.5 min cada una, voz es-MX, pantallas del celular animadas con los textos reales de la app):
  1 Conoce la app (PIN, Panel, barras, Más, botón naranja, pestañas, campana, logo y datos) · 2 Cliente y proyecto (cobros, avance con fotos,
  especificaciones, carpeta) · 3 Materiales, gastos, costo/margen y Reporte del mes · 4 Techo con el Asistente → 3D → materiales → presupuesto →
  propuesta por WhatsApp · 5 Portón en Carpintería Metálica (marco, plancha, accesorios, 3D, cortes, Imprimir → Guardar como PDF) ·
  6 Academia (Tienda / Mis cursos / Mis plantillas, canje con créditos; recarga en Android solo con Google Play).
- Archivos: `contenido/academia/videos/fuentes/cel_comun.py`, `cel_01.py` … `cel_06.py` (videos en la rama academia-videos, `usabilidad/celular-0N.mp4`).
- Cómo se probó: pronunciación revisada con revisar_voz.py (arreglos: "Innova Ap", "Drai-uol"); hojas de contacto de cada escena; videos revisados.
- Versión: sin cambios de la app (solo contenido vía MCP). Clases tut-1794886446046 … tut-1794886450286.
- Commit(s): (este commit)
- Pendiente / a vigilar: si cambia una pantalla del celular (p. ej. la Carpeta rediseñada el 17/11), rehacer la escena con su fuente.
- Segunda vuelta (17/11, "Dale"): escena 8 del Celular 2 rehecha con la Carpeta nueva (lista con conteos y "Por cobrar", dentro ficha + "+ Documento / + Fotos / + Nota",
  pestañas Todo/Documentos/Fotos/Planos/Notas y "Descargar todo (ZIP)"). Clase tut-1794886446776-3da14d actualizada con el video nuevo (3:10).

## 2026-11-17 · Carpeta privada de clientes: rediseño más claro (Proyectos & Clientes → Carpeta)
- Pedido del dueño: "rediseña las carpetas porque es un poco confuso" → la carpeta privada de Proyectos y Personal.
- Qué confundía: dos títulos repetidos ("Carpeta Privada de Clientes" + "Carpeta Privada de Juan"), un número suelto sin explicar,
  "+ Plano 3D" que saltaba a Techos, y dentro dos juegos de botones para subir (4 arriba + "Subir" en cada bloque), "Últimos
  movimientos" que repetía lo de abajo y 5 bloques seguidos.
- Qué se hizo: lista con UN título ("Carpetas de clientes") + buscador; cada tarjeta muestra cuántos documentos, fotos, planos y
  si tiene nota (íconos) y "Por cobrar S/ …" o "Pagado ✓". Dentro: ficha del cliente (presupuesto/cobrado/por cobrar), UNA fila
  para agregar (+ Documento, + Fotos, + Nota) y pestañas Todo / Docs / Fotos / Planos / Notas. "Dibujar un plano en Techos
  Metálicos" queda dentro de Planos. Mismos datos y funciones (ZIP, ver, eliminar, abrir plano, nota que se guarda sola).
- Archivos: `src/components/ProyectosYClientesView.tsx`.
- Cómo se probó: tsc 0 errores; capturas antes/después en PC y celular con 3 clientes de ejemplo; pestañas y nota probadas.
- Versión: sin compilar aún (solo web: hosting).
- Commit(s): (este commit)
- Pendiente / a vigilar: el Manual habla de la Carpeta privada → revisar al compilar si hay que actualizar su texto/captura.
- Segunda vuelta (pedido: "debe permitirme descargar los PDF… o también en Revit o AutoCAD si se guarda el techo"): cada documento
  tiene «Ver» y «Descargar» (antes solo «Ver», que en la web abría el PDF sin bajarlo); la ficha del contrato ya no sale repetida
  cuando su PDF está en la carpeta; cada plano de techo trae PDF (láminas A3), AutoCAD (láminas .DXF) y Revit (.IFC), preparados
  al momento en el equipo (gratis, sin IA). Probado: las 4 descargas bajan desde la carpeta (PDF 305 KB, DXF 221 KB, IFC 219 KB).

## 2026-11-17 · Carga más rápida al entrar (25 % menos espera con internet de celular)
- Pedido del dueño: "que cargue mucho más rápido la base de datos porque demora un poco" (también pidió: plantillas 5 opciones,
  Academia en el Inicio según el usuario y rediseño de la carpeta privada de Proyectos/Personal → siguientes conversaciones).
- Análisis (medido): (1) el bloque inicial pesaba 525 KB comprimidos: la regla de `manualChunks` metía TODO node_modules en
  vendor-main (librerías de PDF, QR y ZIP que solo usan algunos apartados) y el ayudante de carga diferida de Vite quedaba dentro
  del bloque de PDF. (2) App importaba catalogoPrecios.ts y con él los catálogos de Carpintería Metálica y Techos (≈ 200 KB de
  código) solo para leer el estado de precios. (3) Firestore sin memoria en el equipo: cada apertura vuelve a pedir las listas.
- Qué se hizo: `vite.config.ts` con bloques vendor-react / vendor-iconos (un solo archivo de íconos) / vendor-firebase /
  vendor-pdf / vendor-zip / vendor-qr y el resto con quien lo usa; `lib/catalogoEstado.ts` (estado de precios liviano; App ya no
  carga los catálogos; la migración de precios viejos se carga aparte y corre una vez). Firestore con `persistentLocalCache`
  (IndexedDB, varias pestañas): muestra lo guardado al instante y, si se vuelve a abrir dentro de ~30 min, el servidor manda solo
  lo cambiado; si el equipo no la permite, queda como antes. Al cerrar sesión se borra (`borrarMemoriaBase`) y la app se recarga.
  db.ts no pisa la copia del equipo con una lista vacía que venga de la memoria aún vacía.
- Resultado: bloque inicial 525 → 352 KB comprimidos; Inicio visible en 4G simulado (1.6 Mbps, 150 ms) 3.2 s → 2.4 s (3 tomas cada uno).
- Archivos: `vite.config.ts`, `src/lib/firebase.ts`, `src/lib/db.ts`, `src/lib/catalogoEstado.ts`, `src/lib/catalogoPrecios.ts`,
  `src/App.tsx`, `seguridad/semilla_volumen.mjs` (datos de volumen para medir en emuladores).
- Cómo se probó: tsc 0 errores; build; vista previa compilada recorriendo Carpintería Metálica, Techos, Obra Civil, Academia y
  Melamina sin errores; PDF A3 de Techos (su librería se descarga recién al pedirlo); memoria creada al entrar y borrada al salir;
  medición en emuladores con 300 obras/800 gastos/200 clientes (una sola petición por lista; el emulador no imita el envío de solo
  cambios, por eso esa parte no se pudo medir aquí). Imagen de la carga segundo a segundo antes/después.
- Versión: sin compilar aún (solo web: hosting).
- Commit(s): (este commit)
- Pendiente / a vigilar: en emuladores las funciones con disparadores no arrancan por el proxy del equipo de trabajo
  ("upstream r…"): para medir se simuló el ingreso con PIN. Siguientes: Academia en el Inicio, plantillas, carpeta privada.

## 2026-11-17 · Compilación 26110426 (web 2026.11.16.1909)
- Pedido del dueño: "Compila".
- Incluye: notificaciones (probarAviso, canal 'avisos'), Escalera a medida + «Leer con IA» (disenarCarpimetal), grabador de
  Carpintería Metálica arreglado, exportar AutoCAD 3D y Revit (IFC, gratis por decisión del dueño 16/11) y avisos de descarga
  en Android (cartel con «Abrir» + notificación «Descarga lista» del plugin Archivos).
- Archivos: dist_ACTUALIZADO.zip, InnovApp_26110426.aab / .apk (firmados con la llave 01:D3…74:33, verificado con apksigner/keytool).
- Manual: sin cambios (no describe DXF, grabador ni descargas; nada de lo que explica quedó distinto).
- Despliegue: `firebase deploy --only hosting,functions` (functions nuevas: probarAviso, disenarCarpimetal).
- Commit(s): (este commit)

## 2026-11-16 · Descargas en la app de Android: aviso visible con «Abrir» (y grabador más liviano)
- Pedido del dueño: "análisis no profundo de qué falla con el grabador… al descargar un archivo la aplicación no me muestra la
  descarga ni las alertas".
- Análisis: (1) el grabador de Carpintería Metálica reconstruía el visor cada segundo (arreglado en la entrada anterior).
  (2) En Android el archivo SÍ se guardaba en Descargas/InnovApp, pero el único aviso era un Toast de ~3 s (sin notificación ni forma
  de abrirlo) → parece que "no descarga". (3) El video iba a 8 Mbps y pasa en base64 por el puente nativo (≈20 MB de texto en 15 s):
  lento o pesado en celulares modestos. Se descartó que revocar el blob al instante rompa la descarga (probado: no la rompe).
- Qué se hizo: web (`lib/descargasNativas.ts`): cartel dentro de la app «Guardando…» → «✅ Guardado en Descargas › InnovApp» con
  botón «Abrir» (12 s) o mensaje de error claro; descargas de internet avisan que se ven en la barra de notificaciones. Video a 5 Mbps.
  Android (`ArchivosPlugin.java`, requiere AAB nuevo): notificación «Descarga lista» (canal «descargas») que abre el archivo al tocarla,
  `guardar` devuelve la `uri` y método nuevo `abrir`. Con la app vieja el cartel sale igual (sin el botón «Abrir»).
  DEV: `window.__descargaNativaSimulada` (incluir en el grep del dist).
- Cómo se probó: tsc 0 errores; `gradle :app:compileDebugJavaWithJavac` OK; capturas antes/después en celular simulado (Pixel 7).
- Versión: sin compilar (web: hosting; Android: necesita AAB nuevo, código 26110426).
- Commit(s): (este commit)
- Pendiente / a vigilar: probar en un celular real la notificación y el botón «Abrir» con la AAB nueva.

## 2026-11-16 · Grabador de Carpintería Metálica arreglado · exportar a AutoCAD 3D y a Revit (IFC)
- Pedido del dueño: "el grabador de carpintería metálica no funciona… verifica que al exportar se pueda exportar en AutoCAD y si es
  posible que todo el sistema pueda exportar a Revit".
- Causa del grabador: en `HerreriaViewer3D` la función `resetCamera` era nueva en cada render y estaba en las dependencias del efecto
  del 3D → con cualquier cambio de pantalla se volvía a crear todo el visor (lienzo WebGL, luces, modelo). Al grabar, el contador de
  segundos lo reconstruía cada segundo: 7 lienzos nuevos en 6 s, la cámara volvía al inicio (el video no giraba, con cuadros en
  blanco) y en el celular se agotaban los contextos WebGL. Arreglo: `resetCamera` con `useCallback([design])` → 0 lienzos nuevos.
- Exportar: base común `src/lib/solidosCad.ts` (cada pieza = sólido extruido con su sección real; superficies con contorno libre):
  `dxf3D` (DXF R12 con volúmenes 3DFACE por capas + ejes en capa EJES, Z arriba) e `ifc` (IFC 2x3: IfcColumn/Beam/Member/Plate/
  Slab/Wall/Footing/Railing con perfil tubo rectangular/redondo/macizo, material y nivel; Revit: Insertar → Vincular IFC).
  · Carpintería Metálica: el botón DXF ahora baja el modelo 3D con cada tubo y plancha (antes: solo ejes y el archivo salía
    llamado «download» sin .dxf) + botón nuevo REVIT (también en «Herramientas» del celular). `herreria/exportarCad.ts`.
  · Techos: botón «AutoCAD / Revit»; el «Modelo 3D» del DXF lleva cada tubo en su medida y la cobertura; opción nueva
    «Modelo para Revit (.IFC)». `techos/exportarCadTechos.ts`.
  · Obra Civil / Drywall: botón Revit (columnas, zapatas, cimientos, vigas, losas, muros, placas, escaleras y el techo vinculado).
    `concreto/exportarCadObra.ts`. Las puertas/ventanas aún no se recortan en los muros del IFC.
- Cómo se probó: tsc 0 errores; grabación en Chromium (antes 7 lienzos nuevos / video quieto; después 0 / vuelta completa);
  descargas reales desde la app (escalera DXF+IFC, techo IFC, obra IFC); validación con ifcopenshell (0 errores de esquema) y ezdxf,
  y vista 3D de la geometría IFC; capturas antes/después de Carpintería Metálica, Techos y Obra Civil.
- Versión: sin compilar aún (solo web: basta desplegar hosting).
- Commit(s): (este commit)
- Pendiente / a vigilar: aberturas en muros del IFC; Melamina/Drywall 3D/Gasfitería/Electricidad aún sin IFC propio.

## 2026-11-16 · Academia: portadas v3 (3D real + datos) en los 11 cursos
- Pedido del dueño: "Cambia la portada de los cursos que ya estaban. Y mejorarlo" → eligió "Todos los 11" y "3D real + datos".
- Qué se hizo: portada nueva para los 9 cursos técnicos + «Usabilidad de la plataforma» + «Curso Revit Básico a Profesional».
  Cada una con la estructura en 3D (nave 15 × 30 y casa a cuatro aguas de las plantillas de Techos Metálicos; mezanine, portón,
  puerta, reja y escalera armados con el generador de Carpintería Metálica; nudo soldado; cochera; casa BIM para Revit), título grande,
  gancho y datos: «Clase 1 gratis» (o «Gratis»), duración y la obra real del curso. Detalles por curso (chispas en soldadura, lámina
  de plano, cotización, escudo de seguridad, control del portón, laptop y celular con InnovApp). Se respetan las zonas libres de la
  app (insignias arriba a la izquierda y franja de abajo). Solo cambió `portadaUrl` (precios, clases y alumnos intactos).
- Archivos principales: `contenido/academia/fuentes/portadas3.py`, `contenido/academia/portadas/*-v3.jpg` y `portadas/3d/*.png`,
  `contenido/academia/plantillas-kit/fuentes/escenas.py`, `render_cursos.py`, `escena.html`.
- Cómo se probó: hoja de antes y después de los 9 cursos técnicos (las portadas viejas de Usabilidad y Revit no se pudieron descargar
  desde aquí); revisión de cada portada a tamaño real.
- Versión: sin compilar (solo contenido de la Academia).
- Commit(s): (este commit)
- Pendiente / a vigilar: si alguna no gusta, se vuelve a la v2 con el mismo MCP (las v2 siguen en Storage).

## 2026-11-16 · Recursos Técnicos: kit de cotización (Excel y Word) y 5 diseños editables de Carpintería Metálica
- Pedido del dueño: "otro tipo de plantillas… para presupuestos, cotizaciones… llamativo al público… y de diseños… que puedan
  modificarse según las condiciones que los usuarios quieran" → eligió "Las dos a la vez" y "Excel y Word".
- Qué se hizo (todo subido con el MCP, ninguno gratis):
  · Kit de cotización (categoría Plantillas): Excel «Cotización profesional» (A4 imprimible, logo, hoja «Mis precios» con
    lista que llena unidad y precio, IGV incluido o no, descuento, adelanto/saldo, validez automática) bib_1794875832031 S/ 9.90;
    Excel «Presupuesto de obra y valorizaciones» (títulos que suman sus partidas con SUMPRODUCT, GG/utilidad/IGV, 4 valorizaciones
    por % de avance con amortización del adelanto, cronograma de pagos con control) bib_1794875832895 S/ 9.90; Word «Propuesta
    comercial» bib_1794875833724, «Acta de entrega y certificado de garantía» bib_1794875834636 y «Acuerdo de trabajo» (con aviso de
    orientación general / consultar abogado) bib_1794875835524, S/ 6.90 c/u. Campos a cambiar resaltados en amarillo.
  · Diseños editables (categoría Herrería, plantilla `carpimetal` por datosUrl, se abren en Carpintería Metálica): portón
    corredizo 3.90 × 2.40 bib_1794875836611, puerta de dos hojas 1.60 × 2.40 bib_1794875837749, reja de ventana 1.50 × 1.20
    bib_1794875839174, baranda de terraza 4.00 × 1.00 bib_1794875840239, escalera recta a 2.70 m bib_1794875841279 (S/ 5.90 c/u).
    Armados con el generador del módulo (`crearDisenoPorElemento` + `asegurarCad`, y `generarEscalera`).
- Archivos principales: `contenido/academia/plantillas-kit/` (xlsx, docx, portadas; `fuentes/` con cotizacion.py, presupuesto_obra.py,
  documentos.js, portadas_kit.py y el visor 3D de portadas render.html/capturar.py), `contenido/academia/plantillas-carpimetal/`
  (generar.ts + los .json).
- Cómo se probó: recálculo LibreOffice 0 errores (cuadre de cobros = presupuesto total al 100 % de avance); Word validado (XSD) y
  revisado en PDF; diseños revisados en 3D (se quitó un cerco porque el generador no dibuja la malla). Los emuladores no arrancaron
  (descarga bloqueada), por eso las vistas 3D de las portadas salen de un visor propio con las piezas del diseño.
- Versión: sin compilar (solo contenido de Recursos Técnicos).
- Commit(s): (este commit)
- Pendiente / a vigilar: el dueño crea los paquetes «Kit del contratista» (S/ 24.90) y «Diseños de Carpintería Metálica» (S/ 19.90);
  conviene abrir un diseño en la app real para confirmar que carga igual que en la vista previa.

## 2026-11-16 · Recursos Técnicos: 5 plantillas Excel de techos
- Pedido del dueño: "Nos falta poder añadir plantillas Excel para techos parabólicos, a dos aguas y etc." → se mostró una muestra
  (parabólica), luego: "Sí dale. Agrego todo pero no lo pongas gratis".
- Qué se hizo: 5 hojas de Excel con fórmulas (solo se llenan las celdas amarillas): Nave parabólica, Techo a dos aguas (tijeral
  Pratt/Howe/Warren/Fink), Techo a cuatro aguas (limatesas, medios tijerales, correas por línea), Techo a una agua (cocheras) y
  Arcotecho (tubo curvado con tirante). Cada una: Cómo usar · Datos · tabla de trazo/tijeral · Metrado (m, kg, barras de 6 m) ·
  Presupuesto (GG, utilidad, IGV, precio por m²) · Catálogo (perfiles y coberturas de `techosCadCatalog`, precios editables).
  Criterios de Techos Metálicos: flecha 0.14 L, peralte L/18, mismos nombres y perfiles de las plantillas de Recursos Técnicos.
  Subidas con el MCP a Recursos Técnicos (categoría Techos Metálicos): parabólica bib_1794874514436, dos aguas bib_1794874515477,
  cuatro aguas bib_1794874516538 (S/ 9.90 c/u), una agua bib_1794874517583 (S/ 4.90, antes 9.90) y arcotecho bib_1794874518657 (S/ 9.90).
  La app ya aceptaba .xlsx (MIME en `mcpCursos.js` y subida «PDF, DWG, DXF, XLSX, ZIP»): no hubo cambios de código.
- Archivos principales: `contenido/academia/plantillas-excel/` (xlsx, portadas y `fuentes/`: `armar.py` constructor común, un script por techo).
- Cómo se probó: recálculo con LibreOffice, 0 errores en las 5 hojas; números revisados contra las plantillas 3D (p. ej. nave 15 × 30 m:
  arco de 15.75 m, 7 arcos, 12.1 kg/m²); vista previa de cada hoja.
- Versión: sin compilar (solo contenido de Recursos Técnicos).
- Commit(s): (este commit)
- Pendiente / a vigilar: el dueño crea el paquete «Plantillas Excel de Techos» (5 ids, sugerido S/ 24.90) en la Tienda; precios de mano de
  obra, montaje y placas son referenciales.

## 2026-11-16 · Academia: video «Instalar InnovApp en tu iPhone o iPad»
- Pedido del dueño: "No tenemos video de instalación desde iPhone" → hacerlo y subirlo, cuidando el léxico y la pronunciación de la voz.
- Qué se hizo: tutorial de 2 min 32 s con un iPhone dibujado y círculo de toque: Safari → Compartir → «Agregar a pantalla de inicio»
  → «Abrir como app web» activado → Agregar → ícono en inicio → entrar con la clave PIN; preguntas frecuentes y resumen.
  Pronunciación revisada transcribiendo cada frase con whisper (`revisar_voz.py` / `probar.py`): el texto hablado va aparte del
  subtítulo (tupla) para iOS ("ai o ese"), iPad ("ái pad"), InnovApp ("Innova Ap"), PIN ("clave PIN"), "app" → "aplicación",
  y la dirección web se muestra en pantalla en vez de deletrearla. Subido como clase gratis al curso «Usabilidad de la plataforma»
  (id tut-1794854309419-0d01d0).
- Archivos principales: `contenido/academia/videos/fuentes/ios_tuto.py`, `revisar_voz.py`, `probar.py`.
- Cómo se probó: hoja de cuadros (se movió el teléfono para que el subtítulo no tape la barra de Safari y se corrigieron los toques);
  transcripción de la voz; tamaño del video en el enlace comparado con el local antes de subirlo.
- Versión: sin compilar (solo contenido de la Academia).
- Commit(s): (este commit)
- Pendiente / a vigilar: usar `revisar_voz.py` antes de grabar los próximos videos.

## 2026-11-16 · Academia: clases de Naves Parabólicas más largas (≈7–8.5 min)
- Pedido del dueño: "Que más sigue" → eligió "Alargar clases" (la regla pide clases de 8–10 min; las nuevas duraban 3–4).
- Qué se hizo: las 13 clases de Naves se volvieron a grabar con escenas nuevas antes de los errores: segundo ejemplo con números,
  caso de obra, ejercicio para pausar con su solución, preguntas frecuentes y repaso rápido (empuje = wL²/8f, arco ≈ luz + 5 %,
  diagonal, perno J y tolerancias, carga por eslinga W/(2·sen α), radio en la cumbre, IGV y pagos por avance, condensación, etc.).
  Las respuestas de los retos van al inicio de la clase siguiente. Duración: de ≈68 min a ≈1 h 35 min (6.7 a 8.5 min por clase).
  Se reemplazaron los videos en las mismas clases (ids sin cambios) y se actualizó la descripción del curso.
- Archivos principales: `contenido/academia/videos/fuentes/naves_ext.py` (escenas nuevas + `insertar`), `naves_x1..x13.py`, `naves_y3..y10.py`.
- Cómo se probó: hojas de cuadros revisadas (se quitó una escena repetida de tolerancias); tamaño de cada video comparado antes de subir.
- Versión: sin compilar (solo contenido).
- Commit(s): este.
- Pendiente / a vigilar: hacer lo mismo con los otros 8 cursos (3–4 min por clase), empezando por Techos y Soldadura.

## 2026-11-16 · Academia: curso "Seguridad en Obra y Trabajos en Altura"
- Pedido del dueño: "Dale" (curso de seguridad en obra y trabajos en altura).
- Qué se hizo: 12 clases (≈35 min) publicadas con el MCP sobre el montaje de la nave 15 × 30 m: controles, la ley en simple (Ley 29783, DS 011-2019-TR, G.050, SCTR), IPERC/ATS/PETAR, EPP, arnés-línea-anclaje (2 265 kg), espacio libre ≈ 5.40 m y rescate (10 min), andamios y escaleras (baranda 1.05/0.54 m, rodapié 10 cm, 4 a 1), caliente e izaje; avanzado: techos, herramientas y electricidad, emergencias (105/106/116, 911 Lima-Callao), seguridad que vende. Valores verificados en la web contra la G.050. S/ 29 (antes 59), clase 1 gratis, portada v2 y 2 PDFs. También: plantilla "Nave a dos aguas 12 × 24 m" recreada (el dueño la borró por error) y aclarado que los paquetes no se ven en Android por la regla de Play.
- Archivos principales: `contenido/academia/videos/fuentes/seg_comun.py`, `seg_c1..c12.py`; `fuentes/portadas2.py` (ilustración seguridad), `recursos.py` (SEG_ALTURA, SEG_EMERG); `portadas/seguridad-v2.png`, `recursos/seguridad-*.pdf`; `catalogo.json`.
- Cómo se probó: hojas de cuadros de cada clase revisadas y corregidas antes de grabar; tamaño de cada video comparado antes de subir; `listar_cursos`.
- Versión: sin compilar (solo contenido).
- Commit(s): este.
- Pendiente / a vigilar: el canje de paquetes con créditos ya se programó en otra conversación (entrada de abajo); falta desplegar `functions`.

## 2026-11-16 · Carpintería Metálica: «Escalera a medida» y «Leer con IA» (escaleras)
- Pedido del dueño: "¿La IA del sistema puede leer el plano y montarlo?" → "sí, empieza por escaleras".
- Qué se hizo: (1) Generador `escaleraAMedida.ts` (`generarEscalera`, `normalizarEscalera`): escalera RECTA, en L (voltea a izquierda o derecha) o en U
  con descanso, con medidas reales: altura total, ancho, altura y largo del descanso, separación entre tramos, peldaños y largo de cada tramo, fondo
  del peldaño, llegada, peldaños de madera o plancha estriada, baranda opcional, columnas bajo el descanso y perfiles (zanco, columna, soporte).
  Arma zancos, soportes, peldaños, bastidor del descanso con vigueta, tablero, columnas, llegada y baranda. (2) Ventana «Escalera a medida»
  (`EscaleraAMedida.tsx`, botón en Carpintería Metálica y en Herramientas del celular) con resumen por tramo (cuánto sube cada escalón y el paso) y
  avisos de comodidad (RNE A.010: 15–18 cm, paso ≥ 25 cm, 2C+P 60–64 cm). Funciona SIN IA. (3) «Leer con IA» dentro de la ventana: Cloud Function
  `disenarCarpimetal` (functions/carpimetalIA.js, 8 créditos `COSTO_CREDITOS.carpimetal`, lee PDF, foto o texto) devuelve SOLO las medidas (herramienta
  forzada, el servidor las limita); llena el formulario y el usuario revisa y toca «Armar escalera». Tabla de costos de Membresía: «Escalera desde un plano · 8».
- Archivos principales: `src/components/herreria/escaleraAMedida.ts`, `EscaleraAMedida.tsx`, `HerreriaModuleView.tsx`, `functions/carpimetalIA.js`,
  `functions/index.js`, `src/lib/aiAccess.ts`, `PlanesIAModal.tsx`, `seguridad/carpimetalIA.test.mjs` (`npm run test:carpimetal`).
- Cómo se probó: tsc 0 errores; test:carpimetal 12/12 (IA simulada: lectura del plano 2345, PDF como documento, cobro y devolución, límites); en el navegador
  el flujo completo con la IA simulada (`__iaSimulada.disenarCarpimetal`) arma la U del plano (47 piezas, 54.77 m), la recta con baranda y la L; capturas.
- Versión: sin compilar aún (requiere hosting + functions; la IA debe estar activa para usuarios y con saldo).
- Commit(s): este.
- Pendiente / a vigilar: probar «Leer con IA» con saldo real y el PDF 2345. Siguientes: puertas, portones, rejas y barandas.

## 2026-11-16 · Notificaciones: llegan con la app abierta, suenan y se pueden probar de punta a punta
- Pedido del dueño: "Las notificaciones no funcionan" (app de Android y campana; no suenan; comunicados, compras, chat, clases).
- Qué se hizo: (1) Push con la app ABIERTA: Android no lo muestra solo; ahora `pushNotificationReceived` lo pasa a la campana y a una notificación
  con sonido (`alRecibirPush` en pushNativo.ts + App). Antes con la app abierta se perdían los que la app no vigila (pagos por validar, chat de soporte).
  (2) Notificaciones locales en el canal «Avisos de Innova» de prioridad ALTA (`asegurarCanal`, channelId 'avisos'): suenan y aparecen arriba; el
  servidor manda `sound: 'default'`. (3) La campana no repite el mismo aviso que llega por push y por la app (mismo título y texto en 3 min) y
  solo se notifica lo que entró. (4) «Probar» ya no se queda callado si la app recién se abrió. (5) Configuración → Notificaciones muestra si hay
  permiso y si el celular quedó registrado, y «Probar desde el servidor» (Cloud Function `probarAviso`) envía un aviso a los celulares de la
  cuenta y dice qué respondió Google.
- Archivos principales: `src/lib/pushNativo.ts`, `src/lib/notificaciones.ts`, `src/lib/bandejaAvisos.ts`, `src/App.tsx`, `SettingsView.tsx`, `functions/index.js`.
- Cómo se probó: tsc 0 errores; `node --check` de functions; capturas antes/después de la tarjeta (celular simulado con `__pushSimulado`).
- Versión: sin compilar aún (va en la web: no hace falta otro AAB; requiere desplegar hosting y functions).
- Commit(s): este.
- Pendiente / a vigilar: si «Probar desde el servidor» da error, revisar en Play que la app tenga permiso de notificaciones y en Firebase que FCM esté activo.

## 2026-11-16 · Compilación 26110425 (web 2026.11.16.1331)
- Pedido del dueño: "Compila".
- Qué lleva: memoria y «Aplicar recomendados» con una sola regla (columnas con sismo, sin cruces si no hacen falta); sin «Mis apartados»; Mis cursos /
  Mis plantillas solo con lo del usuario; Gasfitería y Electricidad rediseñadas (lienzo limpio, fondo arriba con el techo elegido, aparatos en una
  franja, sin tarjeta flotante); selector «Proyecto» y «Enviar al proyecto» en los apartados de diseño.
- Manual: págs. 3, 4, 6, 70 y 84 sin «Mis apartados»; Paso 4 del capítulo 1 ahora es «Vincular a un proyecto» con su captura
  (`docs/herramientas/manual_sin_mis_apartados.py`).
- Cómo se probó: tsc 0 errores; grep del dist sin simulaciones ni proveedor; AAB/APK versionCode 26110425, firma SHA-256 01:D3…74:33.
- Versión: web **2026.11.16.1331** · Android código **26110425**. Despliegue: solo hosting (functions y reglas sin cambios desde la entrega anterior).
- Commit(s): este.
- Pendiente / a vigilar: Obra Civil (captura del dueño). Tras aprobar Play: «App de Android» 26110425 + «Avisar a todos que actualicen».

## 2026-11-16 · «Enviar al proyecto» desde los apartados de diseño
- Pedido del dueño: "sí, agrega enviar al proyecto".
- Qué se hizo: botón «Enviar al proyecto» junto a Guardar en Gasfitería, Electricidad, Drywall, Melamina, Madera, Vidrios, Acabados y Presupuesto de obra
  (`BotonEnviarProyecto` en common/ElegirProyecto.tsx). Guarda la cotización como PARTIDA del proyecto vinculado (`project.partidas`, clave =
  apartado + id de cotización) y suma su total al presupuesto; volver a enviarla ACTUALIZA el monto (suma solo la diferencia, respeta lo puesto a mano).
  El botón muestra "Enviado al proyecto ✓" / "Actualizar en el proyecto" si cambió el total. Sin proyecto vinculado explica que primero se vincule.
  En Proyectos & Clientes cada tarjeta muestra "Cotizaciones del proyecto" con cada partida. App registra el manejador (`fijarManejadorEnvio`, `conPartida`).
- Archivos principales: `src/lib/proyectosActivos.ts`, `src/components/common/ElegirProyecto.tsx`, `src/types/index.ts` (Project.partidas), `src/App.tsx`,
  `ProyectosYClientesView.tsx` y los 8 apartados.
- Cómo se probó: tsc 0 errores; flujo completo en el navegador: ejemplo de Gasfitería → vincular "Casa 2 pisos" → Enviar → presupuesto 45 000 → 48 624.27
  y la partida aparece en la tarjeta del proyecto; capturas antes/después.
- Versión: sin compilar aún.
- Commit(s): este.
- Pendiente / a vigilar: quitar una partida desde el proyecto (hoy se corrige editando el presupuesto).

## 2026-11-16 · Vincular cada cotización a un proyecto de Proyectos & Clientes
- Pedido del dueño: "no veo que me permita elegir un proyecto o enlazar un proyecto a partir de un cliente ya creado… sería conveniente".
- Qué se hizo: selector "Proyecto" (`common/ElegirProyecto.tsx`, con buscador) junto a Obra y Cliente en Gasfitería, Electricidad, Drywall, Melamina,
  Carpintería de madera y Vidrios (comun/ui.tsx), Acabados y Presupuesto de obra. Al elegir un proyecto se llenan solos la obra y el cliente y queda
  guardado `proyectoId` en la cotización; "Quitar el vínculo" lo deja sin proyecto (no borra nada). La lista sale de Proyectos & Clientes
  (`lib/proyectosActivos.ts`: App la fija con `fijarProyectos(projects)`; cada usuario ve solo los suyos). En Gasfitería/Electricidad los botones
  Guardar/Mis cotizaciones/Nueva pasan a su propia fila para que los campos no se aprieten.
- Archivos principales: `src/components/common/ElegirProyecto.tsx`, `src/lib/proyectosActivos.ts`, `src/App.tsx`, los 7 apartados y sus tipos de cotización.
- Cómo se probó: tsc 0 errores; capturas antes/después (Gasfitería, Drywall, Melamina) con 2 proyectos de prueba: lista, búsqueda y elección.
- Versión: sin compilar aún.
- Commit(s): este.
- Pendiente / a vigilar: siguiente paso posible: "Enviar a proyectos" que sume el total de la cotización al proyecto vinculado.

## 2026-11-16 · Gasfitería y Electricidad: lienzo limpio, fondo con proyecto elegido y sin tarjeta flotante
- Pedido del dueño: "no hay una opción para elegir el proyecto y aparece superpuesto el otro proyecto (se debe limpiar el lienzo)"; "los aparatos aparecen
  arriba y abajo"; "mejorar el diseño de los botones y la distribución" (también Electricidad); "ese botón flotante quítalo… todo ese cuadrado";
  "el área de Techos u Obra Civil no se visualiza bien".
- Qué se hizo: (1) Lienzo limpio por defecto ("En blanco", sin muros) en las cotizaciones nuevas de los dos apartados. (2) Barra "Fondo" arriba, junto a Obra y
  Cliente (en Gasfitería estaba al final de la página): En blanco · Ambiente (ancho y largo) · Obra Civil (por piso) · Techos (con selector del techo: el
  abierto en Techos o cualquiera de los guardados) · Gasfitería/Melamina en Electricidad. (3) Techos de fondo dibujado de verdad en planta: contorno,
  columnas y vigas/correas (`src/lib/planoTecho.ts`: `plantaTecho`, `techosDisponibles`), y la vista se encuadra al elegirlo; muros de Obra Civil más
  visibles. (4) Aparatos / puntos en UNA sola franja arriba del plano, siempre visible (se quitaron las tarjetas repetidas de abajo y de la columna
  derecha). (5) Se quitó la tarjeta flotante que tapaba el plano; queda una franja delgada con "Cargar ejemplo".
- Archivos principales: `src/lib/planoTecho.ts` (nuevo), `gasfiteria/PlanoGas.tsx`, `gasfiteria/modeloGasfiteria.ts`, `electricidad/PlanoElectrico.tsx`,
  `electricidad/modeloElectricidad.ts` (tipo de fondo `ninguno`).
- Cómo se probó: tsc 0 errores; capturas antes/después a 1040 px y en celular (390 px), con y sin techo de fondo.
- Versión: sin compilar aún.
- Commit(s): este.
- Pendiente / a vigilar: las cotizaciones ya guardadas conservan su fondo (el usuario elige "En blanco" si quiere limpiar).

## 2026-11-16 · Techos: memoria y «Aplicar recomendados» coherentes · sin «Mis apartados» · Mis cursos/plantillas solo lo propio
- Pedido del dueño: (1) la memoria dice que no cumple y el botón de recomendados no lo arregla ("esos errores no pueden ocurrir");
  no siempre se ponen arriostres o tensores (presupuesto del cliente). (2) Los usuarios no deben desactivar sus apartados.
  (3) En "Mis cursos" y "Mis plantillas" solo lo que el usuario tiene; destacados y ofertas solo en la Tienda. (4) Obra Civil: tubos y cobertura se descuadran.
- Qué se hizo: (1) Una sola regla para las columnas metálicas (`columnaQueCumple` en memoriaCalculo.ts): el tubo más económico que cumple esbeltez,
  carga, mínimo de obra 3"×3"×3 mm, sismo X y sismo Y SIN cruces; solo si ninguna columna sola alcanza el sismo Y se agregan cruces de pared. La usan
  analizarPiezas → memoria, colores del 3D, Asistente y `cambiosRecomendados`. El botón de la memoria ahora es el mismo que el del 3D
  (`aplicarCambiosRecomendados`). Antes: la memoria bajaba las columnas sin mirar el sismo (CUMPLE → NO CUMPLE al aplicar) y el 3D las subía sin mirar
  el mínimo de obra (OBSERVACIÓN); se alternaban sin fin. Ahora un clic deja CUMPLE y otro clic no cambia nada. (2) Se quitó la ventana y el botón
  «Mis apartados»; todos los apartados se ven siempre (lo que alguien apagó vuelve). (3) `soloMios` en UsabilidadVideosView y BibliotecaPremiumView
  (solo dentro de la Academia): solo cursos gratis o habilitados para el usuario, progreso solo de esos, sin pestaña Destacadas/Ofertas, sin carrusel
  ni insignia «Destacado»; el admin sigue viendo todo para gestionarlo. (4) Con un techo estándar enviado a Obra Civil no se reprodujo: se pidió captura.
- Archivos principales: `src/components/techos/memoriaCalculo.ts`, `TechosEstructuralAnalysisView.tsx`, `TechosViewer3D.tsx`, `src/App.tsx`,
  `src/components/UsabilidadVideosView.tsx`, `src/components/BibliotecaPremiumView.tsx`.
- Cómo se probó: tsc 0 errores; punto fijo en 8 plantillas y el techo de 2 792 piezas (antes: columnas alternaban en cada clic; ahora 0 cambios
  en la 2.ª vuelta, todo CUMPLE, el techo grande cumple sin cruces); UI: memoria CUMPLE→NO CUMPLE (antes) vs CUMPLE→CUMPLE (después) en 4 aguas y
  una agua; capturas antes/después del menú y de Mis cursos / Mis plantillas. analizarPiezas +60 ms en el techo grande.
- Versión: sin compilar aún.
- Commit(s): este.
- Pendiente / a vigilar: Obra Civil (esperar captura del dueño). Opcional: avisar cuánto se ahorraría con cruces de pared en vez de columnas más grandes.

## 2026-11-16 · Academia: canjear créditos por cursos, plantillas y paquetes (también en Android)
- Pedido del dueño: "habilitar la compra de créditos para todos los cursos o el canje de créditos por contenido que existe ya en la plataforma" (app de Android).
- Qué se hizo: en la Tienda de la Academia, en Android ahora se ven TODOS los cursos, plantillas y paquetes de pago con su precio en créditos y el botón "Canjear créditos" (antes solo lo gratis y la clase de muestra). En la web/PC sigue "Comprar" con Yape y se suma "o N créditos" / "Canjear con N créditos". Paquetes: canje nuevo en el servidor (`canjearCurso` con `tipo: 'paquete'` → `canjearPaquete`: lee `config_academia/paquetes`, cobra `precioCreditos` o su precio en soles en créditos, habilita todos sus cursos y recursos de una vez, devuelve los créditos si algo falla, registra `paquetesCanjeados`). El canje ya no depende del interruptor "IA para usuarios" (no usa la IA) en Mis cursos y Mis plantillas. Si no alcanza y no se puede recargar (Android sin Google Play activo) la ventana dice cuántos créditos faltan en vez de "Recargar". Sin textos de pago fuera de Play en Android.
- Archivos principales: `functions/index.js` (`canjearPaquete`), `src/components/academia/AcademiaTienda.tsx`, `src/components/ConfirmarCanjeCreditos.tsx`, `src/lib/cursosCreditos.ts` (`creditosDePaquete`, `canjearPaqueteConCreditos`), `src/lib/paquetesAcademia.ts` (`precioCreditos?`), `UsabilidadVideosView.tsx`, `BibliotecaPremiumView.tsx`, `seguridad/canje.test.mjs` (`npm run test:canje`).
- Cómo se probó: `npx tsc --noEmit` 0 errores; `npm run test:canje` 10/10 (paquete oculto, sin créditos, canje de paquete 250, saldo exacto, habilita todo, no cobra dos veces, curso suelto, admin); capturas antes/después en Android simulado y web.
- Versión: web **2026.11.16.1026** · Android código **26110424** (firmado 01:D3…74:33). Manual: capítulo 16 (pasos 3, 4 y 6) dice cómo canjear créditos y que en Android se canjea.
- Commit(s): este.
- Segunda vuelta ("pon el precio según el precio"): el precio en créditos = precio en soles (con descuento vigente) × los créditos por sol de la recarga más conveniente de `config_ia/planes.packs` (hoy 500 por S/ 54.90 ≈ 9.1). Naves S/ 79 = 719 créditos, plantilla S/ 9.90 = 90. Igual en cliente (`useFactorCreditos`) y servidor (`creditosPorSol`); si el admin cambia las recargas, los precios se ajustan solos. Prueba 12/12.
- Tercera vuelta: el deploy fallaba por los secretos WA_* (WhatsApp aún sin conectar) → WhatsApp apagado en el servidor (exports comentados, como Mercado Pago); `functions_ACTUALIZADO.zip` nuevo. test:canje 12/12 y test:whatsapp 27/27.
- Pendiente / a vigilar: `precioCreditos` por curso/paquete sigue mandando si el admin lo pone.

## 2026-11-16 · Academia: plantillas verificadas, Naves 1-8 corregidas, paquetes y curso "Portones Automáticos"
- Pedido del dueño: "Que sigue" → "Todas" (paquetes, plantillas, rehacer Naves 1-8, curso nuevo).
- Qué se hizo: (1) 5 plantillas nuevas en Recursos Técnicos (taller 2 aguas 10×16, nave 2 aguas 12×24, casa 4 aguas 8×12, parabólicas 10×20 y 18×36), generadas con el motor real de Techos Metálicos y memoria de cálculo CUMPLE, S/ 9.90 c/u. (2) Naves clases 1-8 vueltas a grabar ("CLASE n DE 13") y reemplazadas en sus mismas clases. (3) Propuesta de 4 paquetes con ids y precios en el doc del proyecto "Paquetes_Academia_propuesta" (los carga el admin en la Tienda). (4) Curso nuevo "Portones Automáticos": 12 clases (≈39 min), obra = portón corredizo 3.90 × 2.40 m de una cochera; S/ 39 (antes 79), clase 1 gratis, portada v2 y 2 PDFs.
- Archivos principales: `contenido/academia/plantillas/*` (5 json + vista); `contenido/academia/videos/fuentes/porton_comun.py`, `porton_c1..c12.py`, `naves_c1v2.py`, `naves_c2..c8.py`; `contenido/academia/fuentes/portadas2.py` (ilustración portones), `recursos.py` (PORT_MOTOR, PORT_SEG); `portadas/portones-v2.png`, `recursos/portones-*.pdf`; `catalogo.json`.
- Cómo se probó: hoja de cuadros de prueba de cada clase revisada y corregida antes de grabar; tamaño de cada video en la rama comparado antes de subir; `listar_cursos` / `listar_recursos` confirman todo.
- Versión: sin compilar (solo contenido).
- Commit(s): este.
- Pendiente / a vigilar: el dueño carga los paquetes en la Tienda y borra los 3 duplicados viejos de plantillas de naves (bib_1794716266314, …267262, …268146). Temas eléctricos del curso remiten a electricista (CNE).

## 2026-11-16 · Academia: curso "El Negocio del Metalero" y portadas nuevas
- Pedido del dueño: "Dale" (curso del negocio) y "mejorar las imágenes de los cursos, que llamen la atención".
- Qué se hizo: 12 clases publicadas con el MCP siguiendo el caso de una cochera (costo de la hora, visita, cotización, precio y margen, acuerdo y adelanto, cobranza y caja, entrega y garantía; avanzado: clientes, formalización —orientación general, remite a contador—, equipo, crecer). S/ 39 (antes 79), clase 1 gratis, 2 PDFs. Portadas v2 para los 7 cursos (título grande, gancho, etiquetas, ilustración con brillo; zonas libres para las insignias y el contador de clases de la tarjeta) ya puestas en la Academia; se mostraron antes y después.
- Archivos principales: `contenido/academia/videos/fuentes/neg_comun.py`, `neg_c1..c12.py`; `contenido/academia/fuentes/portadas2.py`, `recursos.py`; `portadas/*-v2.png`, `recursos/negocio-*.pdf`; `catalogo.json`.
- Cómo se probó: hoja de cuadros de prueba de cada clase; regímenes SUNAT verificados en la web (4 regímenes; el Nuevo RUS no emite factura).
- Versión: sin compilar (solo contenido).
- Commit(s): este.
- Pendiente / a vigilar: si el dueño quiere otro estilo de portada, se cambia en `portadas2.py` y se vuelven a subir.

## 2026-11-16 · Academia: curso nuevo "Techos a Dos y Cuatro Aguas"
- Pedido del dueño: "Sigamos con el contenido" → eligió el curso nuevo de techos a 2 y 4 aguas.
- Qué se hizo: 12 clases publicadas con el MCP (módulo principal 1-8: tipos, pendiente, tijeral, trazo y gálibo, apoyos, aleros, cuatro aguas, metrado; avanzado 9-12: coberturas, cortes y remates, limahoyas, aislamiento). Obras: taller 10 × 16 m a dos aguas y casa 8 × 12 m a cuatro aguas. S/ 45 (antes 89), clase 1 gratis. Portada y 2 PDFs (tabla de pendientes y fórmulas, hoja de metrado). Sin repetir lo de Estructuras (tijerales planos) ni Naves (canaletas, presupuesto).
- Archivos principales: `contenido/academia/videos/fuentes/techo_comun.py`, `techo_c1..c12.py`, `hoja.sh`, `montaje.py`; `contenido/academia/fuentes/portadas.py` y `recursos.py` (aceptan nombres para generar solo esos); `portadas/techos.png`, `recursos/techos-*.pdf`; `catalogo.json`.
- Cómo se probó: hoja de cuadros de prueba de cada clase revisada antes de grabar; `listar_cursos` confirma las 12 clases con video.
- Versión: sin compilar (solo contenido).
- Commit(s): este.
- Pendiente / a vigilar: nada nuevo.

## 2026-11-15 · Academia: módulo avanzado de Naves Parabólicas
- Pedido del dueño: seguir con lo propuesto ("Empieza") → ampliar Naves igual que los otros cursos.
- Qué se hizo: 4 clases nuevas publicadas con el MCP (10 luces grandes 25-40 m, 11 luz y ventilación, 12 cerramientos y frontis, 13 mantenimiento y contrato anual); clase 9 vuelta a grabar con cierre "¡Módulo principal completado!"; descripción del curso actualizada (sin "clases animadas", igual que los otros 4).
- Archivos principales: `contenido/academia/videos/fuentes/naves_c9..c13.py`.
- Cómo se probó: cuadros de prueba revisados; `listar_cursos`.
- Versión: sin compilar (solo contenido).
- Commit(s): este.
- Pendiente / a vigilar: las clases 1-8 de Naves dicen "CLASE n DE 9" en la portada (rehacerlas si el dueño lo pide).

## 2026-11-15 · Academia: módulo avanzado en 4 cursos y precios más bajos
- Pedido del dueño: "En los otros cursos tienes que subirle los videos, son muy pocos para el precio" → eligió agregar clases y bajar precio.
- Qué se hizo: 15 clases nuevas (Soldadura 9–12, Estructuras 8–11, Carpintería 8–11, Planos 7–9) publicadas con el MCP; cierre de la última clase del módulo principal vuelto a grabar ("¡Módulo principal completado!" y anuncio de la clase avanzada); descripciones de los cursos actualizadas. Precios: Soldadura S/ 39, Estructuras S/ 45, Carpintería S/ 29, Planos S/ 19 (Naves sigue en S/ 79).
- Archivos principales: `contenido/academia/videos/fuentes/` (sold_c9-12, est_c8-11, carp_c8-11, plan_c7-9, sold_comun.py, cola3.sh, esperar_publicar.sh).
- Cómo se probó: cuadros de prueba de cada clase revisados; `listar_cursos` confirma clases, videos y precios.
- Versión: sin compilar (solo contenido, no cambia la app).
- Commit(s): este.
- Pendiente / a vigilar: el dueño borra los duplicados (3 plantillas .json de naves y el catálogo de barandas repetido).

## Estado actual (actualizar en cada entrada)

| Dato | Valor |
|---|---|
| Última mejora sin compilar | — (web 2026.11.17.0953 compilada el 17/11/2026) |
| Última versión compilada | Web **2026.11.17.0953** (17/11/2026) · Android **código 26110427** |
| Play Console | Código **26110424** subido por el dueño el 16/11/2026 (canje de créditos en la Academia). Al aprobarlo: Configuración → Descargas → «App de Android» 26110424 y «Avisar a todos que actualicen» |
| Próximo código Android | **26110428** (nunca bajar de 26110427) |
| Llave de firma | `llave_google_play.zip` del dueño (alias `innovapp`, SHA-256 01:D3:…:74:33). Pedirla en cada compilación |
| Asistente WhatsApp | **Apagado en el servidor** (16/11/2026, exports comentados para que el deploy no pida los secretos). Programado y probado; para activarlo **falta** conectar Meta (registro de desarrollador, secretos `WA_TOKEN`/`WA_APP_SECRET`/`WA_VERIFY_TOKEN`, webhook, desplegar funciones) |
| MCP de Academia | **Publicado y conectado** (15/11/2026). **9 cursos completos** (104 clases): Seguridad en Obra y Trabajos en Altura 12 (S/ 29, ≈35 min), Naves Parabólicas 13 (S/ 79, ≈1 h 35 min, clases ampliadas), Techos a Dos y Cuatro Aguas 12 (S/ 45, ≈45 min), El Negocio del Metalero 12 (S/ 39, ≈40 min), Portones Automáticos 12 (S/ 39, ≈39 min), Soldadura 12 (S/ 39, ≈50 min), Estructuras Metálicas 11 (S/ 45, ≈42 min), Carpintería Metálica 11 (S/ 29, ≈36 min), Lectura de Planos 9 (S/ 19, ≈28 min); cada curso con módulo principal + módulo avanzado; la clase 1 es gratis. 8 plantillas de techos y naves en Recursos Técnicos (`plantilla.datosUrl`, memoria CUMPLE). Paquetes propuestos en el doc del proyecto (los carga el admin). Voz: la mexicana automática. Videos en la rama `academia-videos` |
| Datos de venta | Acceso **S/ 50, pago único y permanente** · Yape **966000500** a nombre del **Ing. Luis Zapata** |
| Despliegue web | `firebase deploy --only hosting,firestore:rules` (+ `functions` cuando estén los secretos de WhatsApp) |

---

## 2026-11-15 · Academia: «Cargando cursos…» mientras llegan
- Pedido del dueño: la Tienda parecía vacía unos segundos (los cursos llegan de internet).
- Qué se hizo: tarjetas "fantasma" animadas con «Cargando cursos…» y cifras "…" mientras llegan; si en 15 s no llega
  nada, aviso de revisar la conexión (antes: "No hay cursos que coincidan").
- Archivo: `academia/AcademiaTienda.tsx`. Pruebas: tsc 0 errores; capturas antes/después (celular).
- Versión: web 2026.11.15.1250 · Android código 26110423.

## 2026-11-15 · Techos 3D más rápido en techos grandes (y en PCs con Windows 7/8)
- Pedido del dueño: su techo parabólico 23 × 35 m (2 792 piezas, 1 115 nudos) se ponía lento en el 3D y al desplazarse.
- Causa: cada pieza era un objeto aparte con material clonado y contorno propio (≈ 6 800 dibujos por imagen, 2 804
  materiales, 659 000 triángulos); los nudos eran esferas de 16×16; en cada imagen se recorrían los 2 792 tubos; y la
  memoria de cálculo (2 s) se calculaba varias veces al abrir porque `luzLibre` comparaba cada pieza con todas.
- Qué se hizo (TechosViewer3D.tsx y memoriaCalculo.ts):
  - Materiales COMPARTIDOS por color (2 804 → 13); contornos de todos los tubos en UN objeto (`bordes_tubos`);
    nudos en una malla instanciada liviana (`joint_nudos`).
  - Techos > 400 piezas: FUSIÓN de los tubos por material (`tubos_fusionados`); las piezas sueltas siguen debajo para
    tocar/seleccionar, y se muestran solas en sismo y «Exigencia». La seleccionada recibe su propio material.
  - El ciclo de imagen solo repone/repinta los tubos al cambiar algo (no en cada imagen).
  - Memoria de cálculo: caché por techo/cargas/precios y `luzLibre` con candidatos (columnas/apoyos) → 1 959 → 215 ms,
    resultados idénticos (comprobado con huella en 2 techos).
  - Resultado con el techo del dueño: 6 840 → 161 dibujos por imagen; abrir 3D 20 → 12 s (equipo de prueba sin GPU);
    1.6 → 3.7 img/s en el equipo de prueba (en una PC real, mucho más).
- Cómo se probó: tsc 0 errores; medición antes/después; selección de pieza; sismo en techo grande (piezas sueltas en
  sismo, fusión al volver); botón de cambios recomendados (NO CUMPLE → CUMPLE) en techo chico.
- Versión: web 2026.11.15.1250 · Android código 26110423 (llave 01:D3…74:33). Manual sin cambios.

## 2026-11-15 · Academia en la app de Android: no se veían los cursos de pago
- Pedido del dueño: "no se ven los cursos".
- Causa: en la app de Android la Tienda solo mostraba cursos gratis o comprados (1 de 7). "Mis cursos" sí mostraba los que
  tienen clase de muestra: incoherente. En la plataforma los datos estaban bien (7 cursos; Naves 9 clases, Soldadura 7).
- Qué se hizo: en Android la Tienda muestra también los cursos de pago con clase de muestra gratis ("Clase de muestra
  gratis", sin precio ni descuento; en la ficha "Ver clase gratis" lleva a Mis cursos). Se quitaron los textos que en
  Android invitaban a pagar por fuera de Google Play ("entra desde la web o la PC para comprar", "Pago seguro · Yape",
  "Pagas una vez"). Los cursos sin clases (Estructuras, Carpintería, Lectura de Planos) aparecen al subir sus videos.
- Archivos: `academia/AcademiaTienda.tsx`, `src/lib/plataforma.ts` (DEV: `window.__androidSimulado`).
- Cómo se probó: tsc 0 errores; Android simulado: 1 → 4 cursos; web: 7 cursos; capturas antes/después.
- Versión: web 2026.11.15.0021 · Android código 26110422 (llave 01:D3…74:33). Manual sin cambios.

## 2026-11-15 · Techos 3D: botón «Aplicar cambios recomendados», arriostres, rueda del mouse, barra y cinta LED
- Pedido del dueño: el botón del sismo no funcionaba; los arriostres salían como correas; no podía mover la vista con la
  rueda del mouse; la barra del 3D se cortaba; la casilla de cinta LED no funcionaba.
- Qué se hizo:
  - Botón del 3D: antes ponía perfiles FIJOS a todo y cambiaba el rol de las piezas (tensores/arriostres → "correa",
    cordón inferior → superior): el sismo seguía NO CUMPLE. Ahora usa la memoria de cálculo (`cambiosRecomendados` en
    memoriaCalculo.ts + `aplicarCambiosRecomendados` del motor): perfil más económico que cumple en cada pieza, columnas
    al tubo más económico que cumple la deriva X (se recalcula con cada candidato), cruces de pared si falla Y, y repara
    los arriostres que quedaron como correa (diagonales en planta → arriostre; en pared → tensor). Muestra qué cambió.
    Prueba: deriva 2.84 (NO CUMPLE) → 0.0091 (CUMPLE).
  - Inspector: "Columnas de concreto armado" con su nombre (salía COLUMNA_CONCRETO).
  - Rueda del mouse: zoom proporcional a la distancia y sin que se desplace la página (listener no pasivo); rueda
    apretada (botón del medio) mueve la vista sin que Windows active el desplazamiento automático.
  - Barra de herramientas del 3D: pasa a dos líneas cuando no cabe (antes se cortaba bajo el inspector).
  - Cinta LED: si el techo es de tijerales (sin vigas) va bajo el cordón inferior (antes no marcaba nada).
- Archivos: `techos/TechosViewer3D.tsx`, `techos/useTechosCadEngineState.ts`, `techos/memoriaCalculo.ts`, `techos/PropiedadesCad.tsx`.
- Cómo se probó: tsc 0 errores; navegador: botón (NO CUMPLE → CUMPLE), casilla LED, zoom con rueda, barra a 1500 px;
  capturas antes/después.
- Versión: web 2026.11.14.2336 · Android código 26110421 (llave 01:D3…74:33). Manual sin cambios.
- Pendiente: el diseño del dueño que ya quedó con arriostres como correas se repara al tocar el botón nuevo (o con «Atrás»).

## 2026-11-15 · Pantallas anchas: la Academia de borde a borde y más ancho en todos los apartados
- Pedido del dueño: en la PC la Academia dejaba franjas vacías a los lados ("me quita espacio"); revisar otros apartados.
- Qué se hizo: el contenedor general pasa de máx. 1280 px (`max-w-7xl`) a 1536 px (`max-w-screen-2xl`) en todos los apartados
  (y Cotización rápida); la Academia usa todo el ancho (portada oscura de borde a borde) y su contenido 1280 px; Mis cursos
  1280 px; Membresía de 1024 a 1152 px. Los módulos de diseño ya iban a todo el ancho.
- Archivos: `src/App.tsx`, `academia/AcademiaTienda.tsx`, `academia/AcademiaView.tsx`, `UsabilidadVideosView.tsx`, `MembresiaView.tsx`.
- Cómo se probó: tsc 0 errores; capturas antes/después a 1920 px (Academia, Inicio, Proyectos, Membresía, Configuración).
- Versión: web 2026.11.14.2313 · Android código 26110420 (llave 01:D3…74:33). Manual sin cambios.

## 2026-11-15 · Membresía pensada para vender + cobro solo con Yape (Luis Zap*) y transferencia bancaria
- Pedido del dueño: "mejorar la membresía porque no hay ventas todavía"; no tiene Plin; a nombre de "Luis Zap*"; aceptar
  también transferencia bancaria (usuarios de otros países) sin incumplir las normas de Google Play.
- Qué se hizo:
  - Membresía: arriba la oferta ("Saca la foto de tu plano y el techo se arma solo", primera recarga doble 40 créditos por
    S/ 3.90, "Recargar ahora" / "Ver planes") con un dibujo de plano a mano → techo armado; beneficios con el tiempo que
    ahorran; recargas ANTES que los planes; costo "≈ S/ x por plano a mano" en cada plan; tarjeta de la Academia;
    "licencia para siempre" pasa al final; en el celular, botón fijo "40 créditos por S/ 3.90 · Recargar".
  - Se quitó la casilla "Leí y acepto" que dejaba las recargas en gris: ahora "Al comprar aceptas las condiciones" (enlace).
  - Texto corregido: ya no dice "coordinas el pago por WhatsApp" (se paga ahí mismo).
  - Cobro directo: Plin se oculta si no hay número; los textos dicen "Yape" o "Yape o transferencia bancaria" según lo
    configurado (`nombreMediosPago`). Nuevo medio **transferencia bancaria** (banco, titular, cuenta, CCI, SWIFT, moneda,
    indicaciones) en `config_ia/pago_directo.transferencia`; editor en Configuración → Planes y créditos; en la ventana de
    pago, pestaña "Transferencia" con botones Copiar y aviso para pagos desde otro país. Compras muestran "Transferencia · voucher".
    Como Yape, NUNCA en la app de Android (Google Play).
- Archivos principales: `src/components/MembresiaView.tsx`, `PlanesIAModal.tsx`, `VentanaPagoDirecto.tsx`, `VentasIAPanel.tsx`,
  `TarjetaGooglePlay.tsx`, `AdminPurchasesView.tsx`, `academia/AcademiaTienda.tsx`, `src/lib/pagoDirecto.ts`,
  `functions/index.js` (aviso "(transferencia)"), `functions/whatsappBot.js` (texto).
- Cómo se probó: tsc 0 errores; capturas antes/después en celular y PC (inicio de Membresía, recargas y botón fijo, ventana
  de pago Yape y transferencia, editor del admin).
- Versión: web 2026.11.14.2236 · Android código 26110419 (firmado con la llave 01:D3…74:33). Manual: capítulo 16 rehecho
  (`docs/herramientas/manual_academia.mjs`).
- Pendiente / a vigilar: el dueño debe poner en el panel su Yape (titular "Luis Zap*"), borrar Plin y, si quiere, su cuenta
  bancaria; confirmar que "Funciones inteligentes activadas para usuarios" esté encendido.

## 2026-11-15 · Academia: Recursos integrado (Mis plantillas), diseño A y pestañas sin cuadro en otros apartados
- Pedido del dueño: no le gustó la franja de pestañas "como un cuadrado"; quiere el contenido integrado. Eligió el diseño A
  y pidió juntar "Recursos / plantillas" dentro de la Academia y revisar que los otros apartados se integren igual.
- Qué se hizo:
  - Academia técnica = un solo apartado (menú "Academia técnica", sin la fila "Academia | Recursos") con 3 pestañas dentro
    de la portada oscura: **Tienda**, **Mis cursos** y **Mis plantillas** (antes "Recursos Técnicos": mismas funciones,
    "Abrir en Techos/Carpintería/Drywall" y gestión del admin). Todo de borde a borde.
  - Cualquier enlace o aviso a 'biblioteca' abre la pestaña Mis plantillas; el contador de novedades suma clases y recursos.
    Si el admin apaga "Recursos", la pestaña no aparece.
  - Ficha del curso: "Practica con estas plantillas" (plantillas que van con el curso, con su precio o "Abrir").
  - Diseño A fijo (se quitaron las opciones B y C).
  - Arreglo: el fondo decorativo de la portada tapaba los botones de las pestañas (no se podían tocar).
  - Otros apartados en el celular: las pestañas ya no van en un cuadro blanco, sino integradas con raya de color
    (Proyectos/Clientes, Personal, Materiales/Gastos con `PestanasMovil`; Contratos/Documentos EPP y "1. Llenar datos /
    2. Ver contrato"). En PC siguen igual.
  - 2.ª vuelta (revisión de TODOS los apartados): también integradas las barras de pestañas de Acabados, Drywall,
    Electricidad, Gasfitería, Madera, Melamina, Vidrios, Presupuesto de obra (`carpinteria/comun/ui` y cada vista),
    Obra Civil ("Por partidas | Dibujar plano"), Precios ("Mis precios | Referencia de mercado"), Techos y Carpintería
    metálica (secciones del celular). Sin cambios: Inicio, Membresía, Finanzas, Configuración, Ayuda, Administración,
    Reporte, Carpeta, WhatsApp, Supervisión (ya estaban bien).
  - Prueba de adaptación: 18 apartados medidos en celular chico (360 px), celular (390), tablet (768) y PC (1366):
    nada se sale de la pantalla. Arreglo: en 360 px las pestañas de la Academia se partían en dos líneas.
  - Barra superior del celular RECTA (sin las esquinas curvas de abajo): sobre la portada oscura de la Academia dejaba
    una cuña de otro color. Cambio en `src/index.css` (`.app-marca .barra-app`), vale para toda la app.
- Archivos principales: `src/components/academia/AcademiaView.tsx`, `AcademiaTienda.tsx`, `src/App.tsx`,
  `src/components/BibliotecaPremiumView.tsx` (`sinTitulo`), `src/components/common/PestanasMovil.tsx`, `src/components/ContratosYEPPView.tsx`,
  vistas de módulos (Acabados, Drywall, Electricidad, Gasfitería, Melamina, ObraIntegral, ConcretoMetrados, CatalogoPrecios, techos/TechosModuleView, herreria/HerreriaModuleView, carpinteria/comun/ui).
- Cómo se probó: tsc 0 errores; capturas antes/después en celular y PC (Academia: Tienda, Mis cursos, Mis plantillas, ficha;
  Proyectos, Personal, Gastos, Contratos).
- Versión: sin compilar aún.
- Commit(s): ver rama.
- Pendiente / a vigilar: el Manual de usuario menciona "Recursos Técnicos" como apartado aparte: actualizarlo al compilar.

## 2026-11-14 · Academia técnica rediseñada: Tienda con paquetes, cursos y plantillas
- Pedido del dueño: vender en la Academia por paquetes (p. ej. 5 cursos por un único precio), que los cursos se vean más
  atractivos y que los usuarios puedan comprar todo el contenido, plantillas incluidas. Rediseñar la Academia técnica.
- Qué se hizo:
  - Academia con dos pestañas: **Tienda** (nueva) y **Mis clases** (el reproductor y la gestión de siempre).
  - Tienda: portada con cifras (cursos, clases, plantillas), beneficios, buscador, **Paquetes con descuento** (portadas de
    sus cursos, "Por separado S/ X", "Ahorras N %", "Más vendido"), cursos en tarjetas grandes con portada, nº de clases,
    materiales, precio con descuento y "Tienes acceso / Pago en revisión", ficha del curso con su temario (candado en lo
    que falta comprar) y **Plantillas y recursos** de la biblioteca con su precio.
  - Comprar (curso, paquete o plantilla): en web/PC con **Yape/Plin** (captura → compra pendiente); si el cobro directo no
    está listo, WhatsApp. En la app de Android **no se vende** (solo se ve lo gratis y lo que ya se tiene).
  - Editor de paquetes (solo admin, botón "Gestionar paquetes"): nombre, descripción, cursos y plantillas de pago, precio,
    color, "Más vendido" y visible/oculto. Se guarda en `config_academia/paquetes` (regla existente: lee con PIN, escribe admin).
  - Validar compras: `paq_<id>` habilita todos los cursos y recursos del paquete; una compra con id de la biblioteca
    habilita ese recurso/plantilla.
- Archivos principales: `src/components/academia/AcademiaView.tsx`, `src/components/academia/AcademiaTienda.tsx`,
  `src/lib/paquetesAcademia.ts`, `src/components/AdminPurchasesView.tsx`, `src/App.tsx`, `src/components/UsabilidadVideosView.tsx`
  (`cursoInicial`), `src/components/VentanaPagoDirecto.tsx` (texto).
- Cómo se probó: tsc 0 errores; capturas antes/después en PC y celular (usuario y admin) con datos simulados
  (`__paquetesSimulados`, `__comprasAcademiaSimuladas`, `__pagoDirectoSimulado`).
- Versión: sin compilar aún.
- Commit(s): ver rama.
- Pendiente / a vigilar: crear los paquetes reales desde "Gestionar paquetes"; incluir `__paquetesSimulados` y
  `__comprasAcademiaSimuladas` en el grep del dist.

## 2026-11-14 · Lámina E-03 (detalles de conexiones) rehecha
- Pedido del dueño: "E-03 está mal replanteado".
- Qué se hizo: cuadrícula 2×2 que ocupa la hoja; cada detalle a escala con las medidas reales de los perfiles del diseño
  (D-1 correa sobre tijeral 1:2.5 con clip L, perno y soldadura; D-2 cumbrera 1:2.5 con cartela y pendiente; D-3 apoyo del
  tijeral en la columna 1:5 con plancha embebida y espárragos o placa de cabeza; D-4 nudo del tijeral 1:2.5); piezas con
  contorno y eje, cortes de continuidad, notas con flecha, cotas, título con número de detalle y notas de conexiones.
- Archivo: `src/lib/dxfLamina.ts`. Pruebas: tsc 0 errores; DXF descargado de la app y revisado.
- Versión: sin compilar aún.

## 2026-11-14 · MCP de Academia y catálogo de cursos de pago
- Pedido del dueño: un MCP para que la IA suba cursos de pago a la Academia (soldadura, estructuras, carpintería metálica, naves parabólicas), con precios, recursos dentro de los cursos y portadas atractivas. Solo MCP y contenido; no tocar pantallas.
- Qué se hizo:
  - Cloud Function `mcpCursos` (MCP por HTTP, protegida con el secreto `MCP_CLAVE`): `listar_cursos`, `guardar_curso`, `guardar_clase`, `subir_archivo`. Escribe en `cursos`/`tutoriales` igual que el panel del admin (los avisos push salen solos). No borra nada.
  - Catálogo de 5 cursos de pago (`contenido/academia/catalogo.json`): precios bajados a pedido del dueño: Naves Parabólicas S/ 79 (antes 119), Estructuras Metálicas S/ 59 (antes 89), Soldadura Estructural S/ 49 (antes 79), Carpintería Metálica S/ 39 (antes 59), Lectura de Planos S/ 29 (antes 49); plantillas S/ 9.90 (antes 19.90), con el temario de clases (la 1.ª de cada curso, gratis de muestra).
  - MCP ampliado a Recursos Técnicos: `listar_recursos` y `guardar_recurso` (archivos, planos y plantillas prediseñadas de Techos/Carpintería/Drywall).
  - Video de Naves Parabólicas · Clase 1 rehecho a pedido del dueño (7:41: voz más ágil con música, ejemplo 15×30 m, práctica con pantallas reales de Techos Metálicos, errores y reto).
  - Curso Naves Parabólicas COMPLETO en video: 9 clases (≈ 48 min) con teoría animada, ejemplos con números del motor de InnovApp (15 × 30 m), pantallas reales de Techos Metálicos, errores comunes y retos encadenados. Videos en `contenido/academia/videos/naves-clase-N.mp4`; `cargar.mjs` crea las clases.
  - Compatibilidad con Techos Metálicos: flecha óptima 0.14 L y nombres del módulo en materiales y videos; tabla de perfiles = catálogo de la app; 3 plantillas de naves parabólicas (12×24, 15×30, 20×40) generadas con el motor real y verificadas (CUMPLE) para Recursos Técnicos, con portada 3D.
  - 5 portadas 1280×720 con la marca y 10 PDF de material (tablas de electrodos, trazo de arcos, perfiles y pesos, checklists, guía de medidas, hoja de despiece, simbología AWS, glosario).
- Archivos principales: `functions/mcpCursos.js`, `functions/index.js` (export), `seguridad/mcpCursos.test.mjs`, `contenido/academia/*`.
- Cómo se probó: `npm run test:mcp` (base y Storage simulados) y cliente MCP oficial contra el servidor local (listar herramientas, crear curso, listar).
- Versión: sin compilar (no cambia la app; solo una función nueva).
- Commit(s): ver rama.
- Pendiente / a vigilar: desplegar la función y la clave; correr `contenido/academia/cargar.mjs` (o pedírselo a la IA con el conector); grabar los videos de los otros 4 cursos (Soldadura, Estructuras, Carpintería, Planos) y adaptar Carpintería a su módulo.

---
## 2026-11-14 · Paquete de 11 mejoras (despiece, presupuesto, ingeniería, planos, presentación)
- Pedido del dueño: "hazlo todo" (lista de pendientes).
- Qué se hizo:
  1. Despiece: piezas > 6 m se parten solas en tramos iguales con empalme ("1/2 empalme") (`techosCadCalculations.ts`).
  2. Presupuesto: obra civil (concreto, fierro y encofrado de columnas; excavación, solado, concreto y fierro de zapatas)
     suma al costo directo, con precios del catálogo (`techos:concreto_columna_m3`, `techos:fierro_kg`…). Se ve en Materiales y Presupuesto formal.
  3. Dirección Y: `arriostresPared.ts` (cruces de varilla 5/8" en 1.er y último paño de cada costado); memoria `sismo.dirY`
     (deriva Y con columnas + varillas, fuerza por varilla); el Asistente las agrega si Y no cumple; botón en el panel de piezas.
  4. Modos de vibración X, Y y torsión (`sismo.modos`), en Comportamiento sísmico y en la memoria (lámina).
  5. Fuerzas en las barras del tijeral (vista Axiales: compresión roja / tracción azul, grosor según fuerza).
  6. Anclaje: pernos J / espárragos contra levantamiento por viento (+ momento por sismo en bases rígidas) (`memoria.anclaje`).
  7. Lámina PLANTA DE CIMENTACIÓN (zapatas Z-1 con ejes, cotas, cuadro y notas; escala mayor que quepa).
  8. Lámina DETALLES DE CONEXIONES (D-1 correa sobre tijeral, D-2 cumbrera, D-3 apoyo del tijeral, D-4 nudo).
  9. Láminas en PDF A3 / A1 (`pdfLaminas`, jsPDF) desde la ventana de exportar.
  10. Botón Grabar: 3.ª fase "Sismo de diseño E.030" con colores por exigencia.
  11. Botón "Exigencia" en el 3D: colores por ratio demanda/capacidad con carga normal + leyenda.
- Pruebas: tsc 0 errores; dos aguas (concreto) y cuatro aguas (acero) desde la app; 5 láminas DXF y PDF de 5 páginas.
  Cuatro aguas: el Asistente agregó 8 varillas de pared → dir. Y deriva 0.0007 CUMPLE.
- Versión: sin compilar aún.

---

## 2026-11-14 · Sismo en el 3D como SAP2000 y diagramas de esfuerzos
- Pedido del dueño: ver el comportamiento sísmico como en programas de ingeniería (SAP).
- Qué se hizo:
  - 3D (botón Simulador sísmico): se reemplazó la simulación anterior (magnitud Mw y "colapso" sin cálculo) por la deformada
    del modo con el desplazamiento CALCULADO (E.030), en dirección X (pórticos) o Y (a lo largo), con escala de exageración y
    colores por exigencia (ratio demanda/capacidad: azul < 0.5, verde, amarillo, naranja, rojo > 1). Cada tubo se mueve y
    gira con sus nudos; la cobertura y los nudos se ocultan mientras dura. Panel con periodo, V, Δ, deriva y CUMPLE/NO CUMPLE.
  - Comportamiento sísmico (Análisis estructural): pestañas Deformada / Momentos / Cortantes / Axiales (diagramas en las columnas
    del pórtico: voladizo M = V·h, nudo rígido ±V·h/2; axial de servicio y fuerza en cordones); columnas curvas en la deformada.
- Archivos: `techos/TechosViewer3D.tsx`, `techos/ComportamientoSismico.tsx`.
- Pruebas: tsc 0 errores; capturas 3D X/Y con columnas de concreto y metálicas, y diagramas.
- Versión: sin compilar aún.
- Pendiente: análisis modal con varios modos; colores por exigencia también fuera del modo sismo.

## 2026-11-14 · Zapatas, botón de material de columnas y comportamiento sísmico
- Pedido del dueño: añadir lo que faltaba (zapata y pasar columnas existentes a concreto) y ver el comportamiento sísmico
  como en los programas de ingeniería.
- Qué se hizo:
  - `techos/zapata.ts` (nuevo): zapata aislada cuadrada Z-1 (E.050/E.060): área con presión por sismo q = P/A(1+6e/B)
    ≤ 1.33qa, peralte por punzonamiento y corte como viga, malla Ø 5/8" en dos sentidos; metrado (excavación, solado,
    concreto, fierro). Selector "Suelo qa" (0.8–4 kg/cm²) en Análisis estructural. Va en la memoria (app y E-03), en el
    Resumen y en la lámina E-02 (Detalle 5 corte y planta 1:25 + cuadro de zapatas). Funciona con columnas de acero y de concreto.
  - Panel de piezas: "Material de las columnas: Metálicas (tubo) / Concreto armado" (`setColumnasMaterial`), pasa todas
    las columnas del techo dibujado y calcula su sección; al volver a metal pone el perfil que cumple.
  - `techos/ComportamientoSismico.tsx` (nuevo, en Análisis estructural): periodo fundamental dinámico (Rayleigh) y de norma,
    cortante basal y % del peso, desplazamiento del techo, deriva; pórtico deformado ANIMADO (modo 1) con columnas curvas
    (voladizo o nudo rígido) coloreadas por deriva y la fuerza V; espectro de diseño E.030 con T marcado; fuerzas en la
    base y barra deriva vs límite.
- Pruebas: tsc 0 errores; dos aguas 10×18×4 m con concreto: T = 0.30 s, V = 1 572 kg, Δ = 2.03 cm, deriva 0.0051 ≤ 0.007,
  zapata 1.25 × 1.25 × 0.50 m 6 Ø 5/8" @ 22 → CUMPLE; con acero: zapata 1.20 m (parabólico 1.50 m).
- Versión: sin compilar aún.
- Pendiente: análisis modal con varios modos (dirección Y con arriostres); animación en el 3D.

## 2026-11-14 · Columnas de concreto armado para techos metálicos
- Pedido del dueño: ver cómo sería la mejora de columnas de concreto armado en techos metálicos (capturas antes de compilar).
- Qué se hizo:
  - Asistente: opción "Columnas de: Metálicas (tubo) / Concreto armado" (se recuerda). Con concreto, la nave se arma igual y
    las columnas pasan a `columna_concreto` con la sección diseñada (`seccionCm`).
  - `techos/columnaConcreto.ts` (nuevo): prediseño E.060 — sección de la lista 25×25 … 60×60, cuantía 1–4 %, φPn ≥ Pu,
    φMn ≥ Mu = V·h (voladizo, tijeral articulado sobre plancha embebida), deriva 0.75·R·V·h³/(3·Ec·0.7Ig)/h ≤ 0.007,
    estribos Ø 3/8" 1 @ .05, n @ .10 en Lo, Rto. @ .20; metrado (concreto, fierro, encofrado, cemento, arena, piedra, agua).
  - Memoria (`memoriaCalculo.ts`): sismo con columnas de concreto (`sismo.concreto`), en la app y en la lámina E-03.
  - 3D: columnas grises con su sección real. Resumen: tarjeta "Columnas de concreto armado" con acero, estribos y metrado.
  - Láminas: E-01 cuadro con "C-1 25×25 cm · 4 Ø 5/8""; E-02 con Detalle 1 sección, Detalle 2 elevación con estribos y Lo,
    Detalle 3 plancha embebida + espárragos + apoyo del tijeral, Detalle 4 empalme; cuadro de columnas de concreto;
    especificaciones de anclaje y concreto adaptadas.
- Pruebas: tsc 0 errores; dos aguas 10×18×4 m desde la app: C-1 25×25 cm, 4 Ø 5/8" (ρ 1.27 %), deriva 0.0051 ≤ 0.007 → CUMPLE;
  metrado 2.50 m³, 453 kg de fierro, 40 m² encofrado.
- Versión: sin compilar aún.
- Pendiente: zapata de la columna (hoy "ver Obra Civil"); botón para pasar columnas existentes a concreto desde el panel.

## 2026-11-14 · Láminas solo estructurales (sin despiece)
- Pedido del dueño: el despiece de cortes NO va en las láminas; verificar que todas sean estructurales.
- Qué se hizo: se quitó la lámina de despiece del DXF (queda en la app, pestaña Despiece y cortes). Juego final: E-01 estructura,
  E-02 detalles y especificaciones técnicas, E-03 memoria de cálculo (E.020, E.090, sismo E.030). El cuadro de E-01 pasó a
  "CUADRO DE ELEMENTOS ESTRUCTURALES" con Material (ASTM A500 Gr. B / A36) en vez de longitudes (eso es metrado).
  Notas sin referencias al despiece. Regla: en las láminas solo contenido estructural.
- Archivos: `src/lib/dxfLamina.ts`, `techos/TechosModuleView.tsx`.
- Pruebas: tsc 0 errores; DXF descargados (dos aguas 1:100 y 1:50, parabólico 1:50, cuatro aguas 1:100): sin despiece.
- Versión: sin compilar aún.

## 2026-11-14 · Láminas estructurales E-01…, escala 1:50 / 1:100 y análisis sísmico E.030
- Pedido del dueño: escala 1:50 o 1:100 que se pueda elegir; cálculo sísmico; que las láminas salgan como láminas estructurales.
- Qué se hizo:
  - Ventana "Exportar a AutoCAD": escala Automática / 1:50 / 1:75 / 1:100 (se recuerda). Con escala fija, las vistas que no
    entran en una A1 pasan a otra lámina o a A0, sin cambiar la escala; la isométrica va "S/E".
  - Láminas con código estructural E-01, E-02…: estructura; detalles y especificaciones (placa base en elevación y planta 1:5,
    empalme soldado, cuadro de columnas C-1, especificaciones técnicas, cargas, parámetros sísmicos, normas); despiece; memoria.
    Rótulo estructural: empresa, proyecto, plano, especialidad ESTRUCTURAS, escala, ing. responsable y CIP, lámina "n de N", fecha, formato.
  - Análisis sísmico estático E.030-2018 en `memoriaCalculo.ts` (`sismo`): Z, U (categoría), S/Tp/TL (suelo), T = hn/35, C,
    R = 4 (pórtico ordinario de acero), P = acero + área·(D + 0.25 L), V = ZUCS/R·P, corte por columna, deriva con 12EI
    (nudo rígido, base empotrada) ≤ 0.010 y flexión M = V·h/2. Se ve en la memoria de la app, en E-02 y en la memoria de la lámina.
  - Análisis estructural: selectores de tipo de suelo (S0–S3) y categoría de uso (A/B/C).
  - El Asistente sube un tamaño la columna si el sismo no cumple (además de los refuerzos de la memoria).
- Archivos: `src/lib/dxfLamina.ts`, `techos/memoriaCalculo.ts`, `techos/MemoriaCalculoTechos.tsx`,
  `techos/TechosEstructuralAnalysisView.tsx`, `techos/useTechosCadEngineState.ts`, `techos/techosCadEngineTypes.ts`, `techos/TechosModuleView.tsx`.
- Pruebas: tsc 0 errores; 8 techos × 3 escalas (Automática, 1:50, 1:100) descargados desde la app: todos CUMPLE (incluido sismo).
  Con el sismo las columnas salen 5" × 5" (6" en el parabólico de 12 m).
- Versión: sin compilar aún.
- Pendiente: columnas de concreto armado (el dueño preguntó); despiece con empalme para piezas > 6 m; confirmar en AutoCAD.

## 2026-11-14 · AutoCAD: juego de 3 láminas listo para imprimir + perfiles verificados
- Pedido del dueño: faltaban medidas, despiece de cortes y memoria de cálculo en el archivo; que esté listo para
  imprimir con marcos; líneas más gruesas según el perfil; probar con varios tipos de techo.
- Qué se hizo (`src/lib/dxfLamina.ts`, ahora en milímetros de papel, formato A1; en A3 "ajustar al papel"):
  - TM-01 Estructura: planta, elevación frontal, elevación lateral e isométrica a escala normalizada (1:50, 1:75,
    1:100…); cotas de separación de correas y de pórticos (en cadena), luz, largo, altura de columna, altura total,
    peralte del tijeral y pendiente; ejes A, B… y 1, 2…; cuadro de elementos, leyenda de grosores y notas.
  - TM-02 Despiece y cortes: resumen de compra y cada barra de 6 m dibujada con sus cortes y sobrante (patrones
    iguales agrupados ×N); piezas de más de 6 m marcadas en rojo "requiere empalme soldado"; sigue en otra lámina si no cabe.
  - TM-03 Memoria de cálculo: datos, cargas y combinaciones, tijeral, reacciones, peso, criterios, tabla de
    verificación por tipo de pieza (λ, demanda ≤ capacidad, ratio, estado) y sello de resultado.
  - Marco, margen de encuadernación y rótulo (empresa, proyecto, lámina TM-0n "n de N", fecha, formato).
  - Trazos con grosor proporcional al perfil (polilíneas con ancho: columna 4" gruesa, diagonal 1" delgada).
- Perfiles del Asistente verificados: después de la tabla de perfiles aptos, la memoria de cálculo refuerza solo lo
  que sale NO CUMPLE (2 vueltas). Columnas con el mínimo de obra (3 mm); correas y arriostres elegidos pieza por pieza
  por esbeltez (λ ≤ 260). Resultado en las 8 pruebas: todas CUMPLE (antes: parabólico y forma L "NO CUMPLE").
  Archivos: `techos/perfilesAptos.ts`, `techos/useTechosCadEngineState.ts`.
- Pruebas: tsc 0 errores; DXF reales descargados de la app para 8 techos (una agua, cuatro aguas, mariposa, dientes de
  sierra, marquesina, forma L, dos aguas, parabólico) y dibujados como AutoCAD.
- Versión: sin compilar aún.
- Pendiente: el cálculo de despiece mete piezas de más de 6 m en una barra (arriostres largos en cuatro aguas y
  parabólico): conviene partirlas con empalme en el despiece mismo. Confirmar en el AutoCAD del dueño.

## 2026-11-14 · Exportar a AutoCAD: lámina con 4 vistas y modelo 3D
- Pedido del dueño: al exportar a AutoCAD solo se veía la vista frontal/lateral (el sistema "elegía" la vista);
  quería otra maquetación.
- Causa: se exportaban las líneas 3D con la altura en el eje Y; AutoCAD abre mirando desde arriba (plano X-Y) y solo
  se veía el frente con todos los pórticos encimados.
- Qué se hizo: el botón "DXF AutoCAD" abre una ventana con dos opciones:
  1. **Lámina con 4 vistas (recomendado):** planta de techo y correas, elevación frontal (pórtico), elevación lateral e
     isométrica; cotas (luz, largo, alturas), ejes A-B y 1..n, cuadro de elementos y perfiles (cantidad, perfil,
     longitud), notas técnicas, marco y rótulo (empresa, proyecto, fecha, lámina TM-01, escala). Capas por tipo de pieza
     con colores (COLUMNAS, CORDON_SUPERIOR, CORREAS, EJES discontinua, COTAS…).
  2. **Modelo 3D:** altura en Z y largo en Y (sin espejo), capas por pieza, para girar con Órbita 3D.
  DXF R12 (abre en cualquier AutoCAD), tildes como \U+XXXX, extensión del dibujo en la cabecera.
- Archivos: `src/lib/dxfLamina.ts` (nuevo: `dxfLamina`, `dxfModelo3D`), `techos/TechosModuleView.tsx` (ventana de opciones).
- Cómo se probó: tsc 0 errores; se descargaron los DXF reales desde la app (dos aguas 10×18 y parabólico 12×24) antes y
  después y se dibujaron con un visor propio como AutoCAD (fondo negro, colores por capa).
- Versión: sin compilar aún (esperando "compila").
- Pendiente / a vigilar: confirmar en el AutoCAD del dueño (abrir, ZOOM EXTENSIÓN, imprimir). Posible siguiente paso:
  la misma exportación para Obra Civil, Drywall y Carpintería metálica.

## 2026-11-14 · Inicio del registro de mejoras
- Pedido del dueño: trabajar una mejora nueva por conversación y llevar este documento con los datos.
- Qué se hizo: se creó este registro y se resumió lo hecho en las conversaciones anteriores (abajo).
- Archivos: `docs/Registro_de_mejoras.md`; regla añadida en `CLAUDE.md`.
- Versión: sin compilar (solo documentación).

## 2026-11-11 · WhatsApp: precio y respuesta automática
- Pedido: que el asistente responda el costo del programa; mientras tanto, un texto para responder desde Chrome.
- Qué se hizo: el asistente dice siempre "S/ 50, pago único y acceso permanente" y cómo pagar. Se entregó el texto
  para el cuadro "Notas" (Administración → WhatsApp) y un prompt para que Claude en Chrome responda en WhatsApp Web
  (solo consultas del programa; nunca entrega PIN ni confirma pagos).
- Archivos: `functions/whatsappBot.js` (línea VENTAS del mensaje de sistema).
- Pruebas: `cd seguridad && npm run test:whatsapp` → todas pasan.
- Commit: `fc7a495`.
- Pendiente: configurar en la app precio 50 y Yape 966000500 / Luis Zapata; conectar Meta y desplegar funciones.

## 2026-11-11 · Google Play: ofuscación DEX y código de versión
- Pedido: Play avisó "optimización de código DEX por debajo del umbral (ofuscación 1 %)"; luego error al lanzar
  ("no permite que los usuarios actualicen").
- Qué se hizo: R8 activado en release (`minifyEnabled`, `shrinkResources`) con reglas para plugins de Capacitor,
  Cordova (`cc.fovea`, compras) y los propios (Imprimir, Archivos) → 89 % ofuscado, AAB de 7.9 a 6.1 MB. El código
  de versión pasó a **26110418** porque en Play ya existía el 26110417 (versión vieja hecha con fecha).
- Archivos: `android/app/build.gradle`, `android/app/proguard-rules.pro`, `android/app/codigo-version.txt`, `CLAUDE.md`.
- Commits: `5048d61`, `2fc705f`, `95a0c66`.
- Pendiente: probar en el celular la versión de Prueba interna (PIN, 3D, avisos, compras, imprimir, descargas)
  antes de pasarla a Producción.

## 2026-11-11 · Techos: 3D, perfiles aptos, planchas, Resumen y modo Sencillo
- Pedido: sombra en franjas en el arco, tijeral que asomaba por la calamina, uniones abiertas en esquinas y cumbrera
  (todos los techos, movible y canaleta); la vista cliente no coincidía con la estructura; que el Asistente ponga
  perfiles aptos; Materiales no decía cuántas planchas; mejorar Resumen y el cuadro del plano CM-02; no había
  diferencia entre Sencillo y Experto.
- Qué se hizo:
  - Tubos sin giro sobre su eje; las piezas principales se alargan en cada nudo (4 mm antes de la cara) → esquinas cerradas.
  - Calamina del arco suavizada cada ~30 cm (`suavizarArco`); holgura según el tubo más alto; cumbrera encima de la plancha;
    cámara con mejor precisión de profundidad.
  - `perfilesAptos.ts`: columnas, cordones, alma, correas, vigas y arriostres según luz, altura y separación de pórticos
    (ej. 10×18 m, 4 m: columnas 4"×4", cordones 2"×2", alma 1"×1", correas 3"×1½", arriostres Ø¾"). Solo reemplaza los
    perfiles de relleno; respeta lo elegido a mano. La vista cliente ya no engrosa los tubos.
  - Materiales: número de planchas (estimado con las correas si aún no hay cobertura; no suma al costo).
  - Resumen rediseñado (acero, costo de tubos, planchas, área; piezas por función; barras de 6 m). Cuadro CM-02 en tabla.
  - Sencillo oculta Subir CAD, Exportar, DXF, → Obra Civil, → Obra por pisos, Panel CAD, Propiedades y Análisis RNE;
    pestañas con nombres cortos; coordenadas de nudos solo en Experto.
- Archivos: `techos/TechosViewer3D.tsx`, `techos/perfilesAptos.ts`, `techos/useTechosCadEngineState.ts`,
  `techos/TechosNovatosWizardModal.tsx`, `techos/techosCadCalculations.ts`, `techos/TechosMaterialesView.tsx`,
  `techos/TechosModuleView.tsx`, `techos/TechosPlanoCadView.tsx`, `techos/TechosCanvas2D.tsx`.
- Pruebas: tsc 0 errores, build; capturas antes/después de 5 techos y de cada pantalla.
- Commit: `2ae30a8`.
- Pendiente: revisar el techo movible en 3D (la prueba no activó el mecanismo); vigilar rapidez en celulares con
  calamina ondulada en naves largas.

## 2026-11-11 · Melamina: 3D realista y formato común
- Qué se hizo: veta de madera, granito en cocina, porcelanato, metal y vidrio con reflejos, sombras y luz natural
  (texturas dibujadas, sin descargas); Grabar/Foto como los demás 3D; Luz · Agua · Todo en 3D; lavadero sugerido según
  el tipo de mueble; cabecera sin texto apretado.
- Archivos: `melamina/Melamina3D.tsx`, `melamina/texturasMelamina.ts`, `instalaciones/fondoMelamina.ts`, `MelaminaView.tsx`.
- Commits: `6656473`, `e4d8e5e`.

## Antes del 11/11/2026 (resumen)
- Grabar y Foto iguales en todos los 3D: MP4 de 15 s, una vuelta, por fases; foto JPG; marca con la empresa del
  usuario + "hecho con InnovApp" (`src/lib/captura3d.ts`).
- Techos: modo Sencillo/Experto y "¿Qué es?"; techo + luz + agua en una sola vista 3D ("Todo en 3D").
- Asistente de WhatsApp fase 1 (servidor, reglas, panel admin, pruebas).
- Ventas de créditos: bienvenida 20, recarga S/ 3.90 × 20, primera recarga doble, referidos, Yape/Plin directo, embudo.
