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
| Última mejora sin compilar | Paquete de 11 mejoras (despiece con empalmes, obra civil en presupuesto, dir. Y, modos, anclaje, cimentación, conexiones, PDF, video sismo, exigencia) |
| Última versión compilada | Web **2026.11.11.1031** · Android **código 26110418** |
| Play Console | Lanzada en **Prueba interna** el 11/11/2026 (falta marcar listas de testers y pasar a Producción) |
| Próximo código Android | **26110419** (el contador sigue +1 desde aquí; nunca bajar de 26110418) |
| Llave de firma | `llave_google_play.zip` del dueño (alias `innovapp`, SHA-256 01:D3:…:74:33). Pedirla en cada compilación |
| Asistente WhatsApp | Programado y probado; **falta** conectar Meta (registro de desarrollador, secretos `WA_TOKEN`/`WA_APP_SECRET`/`WA_VERIFY_TOKEN`, webhook, desplegar funciones) |
| MCP de Academia | Programado y probado (`mcpCursos`); **falta** `firebase functions:secrets:set MCP_CLAVE` + `firebase deploy --only functions:mcpCursos` y agregarlo como conector en Claude. Contenido listo en `contenido/academia/` |
| Datos de venta | Acceso **S/ 50, pago único y permanente** · Yape **966000500** a nombre del **Ing. Luis Zapata** |
| Despliegue web | `firebase deploy --only hosting,firestore:rules` (+ `functions` cuando estén los secretos de WhatsApp) |

---

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
  - Catálogo de 5 cursos de pago (`contenido/academia/catalogo.json`): Soldadura Estructural S/ 89 (antes 129), Naves Parabólicas S/ 129 (antes 179), Estructuras Metálicas S/ 99 (antes 139), Carpintería Metálica S/ 69 (antes 99), Lectura de Planos S/ 49 (antes 69), con el temario de clases (la 1.ª de cada curso, gratis de muestra).
  - 5 portadas 1280×720 con la marca y 10 PDF de material (tablas de electrodos, trazo de arcos, perfiles y pesos, checklists, guía de medidas, hoja de despiece, simbología AWS, glosario).
- Archivos principales: `functions/mcpCursos.js`, `functions/index.js` (export), `seguridad/mcpCursos.test.mjs`, `contenido/academia/*`.
- Cómo se probó: `npm run test:mcp` (base y Storage simulados) y cliente MCP oficial contra el servidor local (listar herramientas, crear curso, listar).
- Versión: sin compilar (no cambia la app; solo una función nueva).
- Commit(s): ver rama.
- Pendiente / a vigilar: desplegar la función y la clave; correr `contenido/academia/cargar.mjs` (o pedírselo a la IA con el conector); grabar los videos de las clases y subirlos con `guardar_clase`.

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
