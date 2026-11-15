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

## Estado actual (actualizar en cada entrada)

| Dato | Valor |
|---|---|
| Última mejora sin compilar | — (todo compilado el 15/11/2026) |
| Última versión compilada | Web **2026.11.15.0021** · Android **código 26110422** (15/11/2026: cursos visibles en la app de Android; incluye todo lo anterior) |
| Play Console | Código **26110421** subido por el dueño el 15/11/2026 (Prueba interna). Falta pasar a Producción cuando lo decida |
| Próximo código Android | **26110423** (el contador sigue +1 desde aquí; nunca bajar de 26110422) |
| Llave de firma | `llave_google_play.zip` del dueño (alias `innovapp`, SHA-256 01:D3:…:74:33). Pedirla en cada compilación |
| Asistente WhatsApp | Programado y probado; **falta** conectar Meta (registro de desarrollador, secretos `WA_TOKEN`/`WA_APP_SECRET`/`WA_VERIFY_TOKEN`, webhook, desplegar funciones) |
| MCP de Academia | **Publicado y conectado** (15/11/2026), conector "Academia Innova". 5 cursos con portada + 2 PDF. **Naves Parabólicas: 9 clases subidas** (la 1 gratis). Soldadura: clase 1 (gratis, estilo nuevo) subida. 3 plantillas de naves subidas a Recursos Técnicos (S/ 9.90; el MCP acepta `plantilla.datosUrl`, desplegado 15/11/2026). Videos en la rama `academia-videos` |
| Datos de venta | Acceso **S/ 50, pago único y permanente** · Yape **966000500** a nombre del **Ing. Luis Zapata** |
| Despliegue web | `firebase deploy --only hosting,firestore:rules` (+ `functions` cuando estén los secretos de WhatsApp) |

---

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
