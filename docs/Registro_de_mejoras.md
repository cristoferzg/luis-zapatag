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
| Última mejora sin compilar | AutoCAD: juego de 3 láminas (estructura, despiece, memoria) + perfiles verificados |
| Última versión compilada | Web **2026.11.11.1031** · Android **código 26110418** |
| Play Console | Lanzada en **Prueba interna** el 11/11/2026 (falta marcar listas de testers y pasar a Producción) |
| Próximo código Android | **26110419** (el contador sigue +1 desde aquí; nunca bajar de 26110418) |
| Llave de firma | `llave_google_play.zip` del dueño (alias `innovapp`, SHA-256 01:D3:…:74:33). Pedirla en cada compilación |
| Asistente WhatsApp | Programado y probado; **falta** conectar Meta (registro de desarrollador, secretos `WA_TOKEN`/`WA_APP_SECRET`/`WA_VERIFY_TOKEN`, webhook, desplegar funciones) |
| Datos de venta | Acceso **S/ 50, pago único y permanente** · Yape **966000500** a nombre del **Ing. Luis Zapata** |
| Despliegue web | `firebase deploy --only hosting,firestore:rules` (+ `functions` cuando estén los secretos de WhatsApp) |

---

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
