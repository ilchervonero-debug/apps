# ESTADO-APPS.md — Registro vivo de iLStorage

> **Para Claude:** este es el índice central de TODAS las apps. Es tu memoria:
> cuando Ángel menciona una app, mirás su ficha acá — **no vas a averiguar ni a
> releer todo el código**. Actualizá la ficha correspondiente **después de cada
> cambio**. Investigá el código a fondo solo si hay un problema puntual que
> resolver, y aun así después volcás lo aprendido acá.

Última actualización: 2026-07-18

---

## Reglas fijas (no negociar)

- Responder en **español**, saludar a Ángel por su nombre al empezar.
- **Legibilidad** (Ángel ve borroso): texto ≥16px (inputs 18px, títulos 20–22,
  totales 22–26), **negrita al mínimo** (peso 400–500), énfasis por **tamaño**.
- **Sin rosado** en ninguna app. Activo/enfocado = **borde rojo** `#FE0000`.
- **Íconos** SVG flat, línea fina (stroke ~1.1–1.4); negro = secundario,
  **rojo = principal**. Sin emojis.
- Paleta: blanco `#FFFFFF`, gris `#F2F2F0`/`#DCDCD8`, tinta `#1C1C1C`,
  plata `#C0C0C0`, rojo `#FE0000`. Wordmark `iL` rojo + resto plata/tinta,
  mismo peso y tamaño (solo cambia el color).
- Tipografía **Exo** (bloques largos de texto pueden ir en Inter 300–400).
- Guía completa: `ILSTYLE.md`. Galería de íconos: `ilstyle-iconos.html`.

## Publicación

- Deploy a **ilchervo.com** vía Vercel, rama **`master`** (Vercel publica solo).
- Al terminar un cambio: **commit + push a master**.
- Apps estáticas: **bump del SW** en cada cambio (`const CACHE='app-vN'`),
  network-first. La grilla pública está en `index.html` (sección `#apps`).
- **iLFrame no es estática**: requiere build (ver su ficha).

---

## Fichas de apps

Salvo iLFrame, todas son **PWA estáticas** de un `index.html` autocontenido +
`sw.js` + `manifest.json` + `icon-192.svg`, con persistencia `localStorage`.
Versión = número de caché del SW.

### iLFrame — `apps/ilframe/` → servido en `ilframe/` · en grilla
- **Qué es:** diseño de estructuras de **steel framing** (acero liviano), vistas
  Planta/Elevación/Techo/Entrepiso/Cielorraso sincronizadas + cómputo de material.
- **Stack (única no estática):** React 19 + Vite 8 + Zustand + Tailwind + xlsx.
  Fuente en `apps/ilframe/`, servido desde `ilframe/` (Vercel no compila).
- **Build tras cada cambio de código:**
  ```
  cd chervo-web/apps/ilframe
  npx vite build
  rm -rf ../../ilframe/assets && cp -r dist/. ../../ilframe/ && rm -rf dist
  ```
  El `index.html` servido debe apuntar al nuevo hash `assets/index-XXXX.js`.
  `base:'/ilframe/'`. PWA con vite-plugin-pwa (autoUpdate, manifest manual).
- **Lógica:**
  - *Componentes/Dashboard* (`ProjectSetup.jsx`): se define TODO — cada tipo de
    muro/pilar/columna/cercha/viga/losa/techo/cielo con material y perfiles.
    **Perfil por elemento** (cada muro el suyo; fallback global). Perfiles 35 y 70.
  - *Canvas* (`src/studio/canvas.html`, motor v1.40 injertado): solo da la
    **forma** (ancho/alto, siluetas de aberturas, uniones); no dimensiona material.
    Selector de tipos precargados; cada pieza vuelve con su `tipo` para el cómputo.
  - *Puente* React↔canvas por postMessage (iframe `srcDoc`): `ready`/`load`/
    `types`/`focus`/`studio` (guardado debounced 400ms).
  - *Link por elemento:* cada tarjeta tiene botón **"Dibujar en el plano"** (rojo,
    al pie) → `focusElement(tool,nombre)` abre el canvas conectado a ese elemento
    (herramienta+tipo+vista). El botón grande **"Ver plano →"** es la entrada general.
  - *Cómputo* (`engine/computo.js`,`bom.js`,`spec.js`): valoriza por `o.tipo`.
    Viga = `type:'viga'` o `cercha+modelo VIGA`; pilar se separa de columna por
    `kind:'armada'`; patrones WARREN/LADDER/X_CROSS vía `PATRON_MAP`.
  - *Comandas A/B/T:* uniones que definen **quién asume la tapa/cierre** del perfil
    expuesto cuando dos muros chocan al exterior (ídem entrepisos, pilares, caras
    exteriores). Dato en `wall.uniones` (con `comanda`).
- **Reciente:** canvas nuevo injertado con puente + `tipo`; perfil por elemento;
  perfiles 35/70; quitadas notas "Directrices para Claude" (`RevisionNotes`);
  botón "Dibujar en el plano" con texto por elemento.
- **Pendiente:** cuantificar el material de cierre/tapa que asigna la comanda.

### iLWall — `apps/ilwall/` · v1 · en grilla
- **Qué es:** cómputo de **tabiques de yeso** (steel frame) simple o doble cara.
- **Lógica:** importa DXF (LINE/LWPOLYLINE/POLYLINE) → grilla de montantes;
  largo (auto del DXF o a mano) + alto; **lápiz** de refuerzos (Mocheta ×1 /
  Jamba ×2 / Recorte); puertas/ventanas con **jamba + dintel** (+ antepecho en
  ventana) contabilizados solos; canvas con pan/zoom.
- **Materiales:** montantes, soleras, placas, refuerzos, dinteles, antepechos,
  tornillos T1/T2, fijaciones, cinta, masilla, enduido, barrera de vapor, lana.
- **Export:** Excel (SheetJS por CDN → necesita internet) y PDF (desglose).
- **Nota:** coeficientes estándar steel frame (desperdicio placa 10%, ~20
  tornillos/m², fijación cada 60cm, barra 6m). Ajustar si Ángel da los suyos.

### iLDraw — `apps/ildraw/` · v11 · en grilla
- **Qué es:** pizarra de **dibujo técnico** / croquis (líneas, arcos, polilíneas,
  rect, círculo, polígono, texto, cotas, hatch; goma/trim). **App aparte, vive en su
  propio mundo** — es el **motor/canvas base**. No se le agregan features de otras apps.
- **iLStyle:** `--accent #FE0000`, íconos stroke 1.1; **FAB cuadrado** (esquinas
  redondeadas); íconos de herramienta **negros → rojos + borde rojo al activarse**;
  sin botones grises.
- **Export explícito** DXF / PNG / PDF, siempre **limpio sin grilla**.

### iLDraw-Volt — `apps/ildraw-volt/` · v1 (SW ildraw-volt-v1) · canvas de iLVolt
- **Qué es:** **variante de iLDraw para iLVolt** (app separada; iLDraw queda intacto de
  motor). Mismo dibujo técnico + dos cosas propias del rubro eléctrico. Se accede
  **desde iLVolt** → Herramientas → *"Canvas · plano y simbología"* (FAB del proyecto y menú
  hamburguesa) → abre `/apps/ildraw-volt/`; el "Volver" regresa a iLVolt.
- **FAB de electricidad (2º FAB):** simbología **UNIT Uruguay** (tomas línea/Schuko/piso,
  interruptores simple/bip/conmutador/intermedio/dimmer, centro Xe/aplique Xa, pulsador,
  sensor; tablero, seccionador, térmica, diferencial, contactor, guardamotor, relé,
  fusible, medidor, tierra). Se elige un símbolo y se **coloca en el plano** (objeto
  `block`): ocupa su tamaño real, con **giro** (0/90/180/270) y **tamaño** ajustables;
  entra al undo y al export (PNG/PDF).
- **Importar plano de fondo (calco):** botón en la barra → **imagen, foto, PDF** (pdf.js
  por CDN) o **DXF** (parser propio → raster). Se **calibra** con opacidad + escala,
  se **mueve**, se **Fija** y se puede **reeditar/reescalar** después. El plano se dibuja
  en coordenadas mundo (panea/zoomea con todo) y **no** sale en el export (queda como
  referencia).
- Motor, herramientas y export DXF/PNG/PDF **heredados de iLDraw**, intactos.
- **Superado por SketchVolt** (abajo) como canvas de iLVolt. Se deja como respaldo.

### SketchVolt — `apps/sketchvolt/` · v1 (SW sketchvolt-v12) · app pro
- **Qué es:** evolución de iLDraw-Volt en **app seria e independiente** para **dibujar
  instalación eléctrica a escala y presentar planos**. Es también el canvas que enlaza iLVolt
  (Herramientas → *"SketchVolt · dibujar a escala"*). Aparece en el landing de iLStorage.
- **Estructura (shell), sin fricción:** Landing **Proyectos** (localStorage `sketchvolt_proy`)
  con **"+ Nuevo proyecto"** (nombre + descripción; nada obligatorio) → **dashboard del
  proyecto**: nombre editable, **General del dibujo** (escala 1/100·1/75·1/50 + **lienzo**
  A4/A3/A2 + orientación), datos de rótulo colapsables, y lista de **Planos/Hojas**. Al abrir
  un proyecto **ya viene la "Hoja 1" precargada**; cada plano tiene su **flecha "Dibujar" → canvas**
  y **"+ Agregar plano"** suma Hoja 2, 3… (auto-nombre, hereda escala/lienzo, editable por plano).
  No hay que llenar nada para entrar. También hay **"Dibujar sin proyecto · lienzo libre"**.
  Logo = volver al dashboard; back del dashboard = Proyectos.
- **Mundo en metros reales** (PPM=100 px/m). Grilla en metros: **0.15 · 0.50 · 1.00 · 3.00**.
  **Origen 0,0** marcable (botón mira). Coordenadas y cotas en metros.
- **Importar plano** (imagen/foto/PDF) + **Calibrar por referencia**: tocás 2 puntos de una
  medida conocida (ej. 0.15 del muro), ingresás los metros y el plano se **escala a magnitud
  real**. Opacidad/escala/fijar/editar.
- **Símbolos UNIT en medida REAL (cm)** — UNIFICADO con grilla/cotas/coordenadas (pedido de Ángel:
  un solo idioma de medidas). Selector **Tam cm** (20·30·40·50·60·80·100; def **30 cm**). El símbolo
  es tamaño real fijo; al imprimir se reduce con la hoja como todo lo demás (30 cm → 3 mm a 1/100).
  Compat: proyectos viejos guardaban `mm` (mm de papel @1/100) → `cm = mm×10`. **Altura desde el
  piso** (cm) por elemento. **Edición a 1:1** (1 m = 100 px) para verlos bien.
- **Comandos de estampado:** elegís el símbolo (FAB rayo) → estampás **uno** → queda
  **seleccionado (azul) esperando edición** y volvés al **cursor (escape)**; el FAB guarda el
  último símbolo: tocá el rayo para **re-estampar** (o de nuevo para abrir el panel y cambiar).
- **Tamaño real del símbolo en cm** (def **30 cm** = 0.30 m); NO cambia con la escala en pantalla,
  pero **al imprimir la hoja lo reduce como a todo** (1/50 = doble en papel respecto a 1/100).
- **Escala técnica en la barra inferior** (línea de comando): 1/100 (def) · 1/50 · 1/75, por planta.
- **0,0 con ejes X (→) e Y (↑)** en la **esquina inferior-izquierda**; el dibujo parte de ahí (AutoCAD).
- **Long-press = fila de íconos**, SOLO ubicación: **Mover, Copiar, Rotar, Espejo, Borrar**
  (sin color/editar/escalar — eso es redundante; va todo abajo).
- **Barra inferior = comando/propiedades dinámica y VACÍA por defecto** (minimalismo): sólo aparece
  algo cuando hace falta, y **UN SOLO contexto a la vez** (nunca se superponen). **Seleccionar**
  un objeto → SOLO sus propiedades; **herramienta** activa → SOLO sus opciones; **editar imagen** →
  SOLO controles de imagen; **Grilla** (ícono arriba) → tamaños + **escala técnica** abajo;
  **Exportar** (ícono arriba) → Hoja PDF/PNG/DXF abajo. Antes se veían juntos (tool+sel+imagen):
  arreglado con `applyToolBar/showSelBar/openBottomPanel` que ocultan todos los grupos y muestran
  el que toca. La **flecha/escape** siempre visible.
- **Un único selector de color** (se eliminó el duplicado): **dots inline por contexto** —
  dibujo (`setDrawColor`), símbolo nuevo (mismos dots), y objeto seleccionado (`selSet('color')`).
  Se quitó el botón/paleta flotante (`#colorBtn`/`#colorPalette`/`pickColor`).
- **Escalar = escala el OBJETO, no el plano.** En las propiedades de selección hay un deslizador
  **Escala** (`selScaleLive`) que agranda/achica el objeto seleccionado (líneas, formas, cotas…)
  alrededor de su centro; en **símbolos** el tamaño se ajusta con **Tam (cm)**. El deslizador de la
  *Imagen* ahora se llama **Tamaño** (escala el calco importado, que es su función).
- **Rotar** arreglado (los símbolos giran por su ángulo, no solo por puntos). **Touch** con umbral
  de long-press (no se cancela por micro-movimiento) → más sensible.
- **Auditoría (limpieza de código fantasma):** se borraron modales/handlers huérfanos —
  `#scmod` (escalar), `#exmod` (exportar), paleta de color flotante, `showFondoBar`, `toggleOrigin`,
  `fijarFondo/editarFondo`, CSS de `#fondoBar`/`.fb-*`, y variables muertas
  (`scaleId`, `_recolorId`, `settingOrigin`, `dim2Drawing`). `node --check` OK.
- **Barra con ÍCONOS (menos texto):** Borrar/Quitar = ícono tacho, Editar = lápiz+papel,
  Fijar/aprobar = **check verde** (igual que la **X** cierra), Calibrar = regla, Nueva imagen = +.
  Cada control lleva su **rótulo ARRIBA y el control ABAJO** (`.fi`) para no hacer slide lateral.
- **Un solo selector de color = una pastilla** (`.cpick`) que abre una **paleta de 12 colores**
  (`#colorPop`); aplica al objeto seleccionado si lo hay, si no al color de dibujo. Ya no hay
  dots repetidos en línea.
- **Medidas UNIFICADAS a real (cm/m):** grilla, cotas, coordenada, altura y **tamaño de símbolo**
  van todos en medida real. El símbolo se elige en **cm** (20…100, def **40**); se acabó el "mm de papel".
- **Simbología SIEMPRE por encima** del plano y del dibujo (capa superior en `render()`: los `block`
  se pintan al final). **Círculo del interruptor agrandado** (0.17→0.30 del radio) por legibilidad,
  según planos reales de Ángel (anteproyecto GLORIA 1/50). Default de símbolo subido a 40 cm.
  Pendiente (analizado con sus láminas): color por función automático en el FAB y afinar fidelidad UNIT.
- **Caja de REFERENCIAS (leyenda de vivienda)** — botón *"Traer caja de referencias"* en el panel del
  FAB eléctrico. Deja en el plano una caja (marco + título + filas símbolo/nombre) con el set
  residencial, **cada uno en su color de función** (centro luz rojo, brazo ext. verde, toma azul,
  tablero cian, aire/motor tinta). Doble uso: es la **leyenda que se imprime** y la **paleta para
  copiar** (no volver al FAB). Los símbolos de la caja llevan `ref:true`: **se imprimen pero NO se
  cuentan**; al **copiarlos** (herramienta Copiar) la copia pierde `ref` y **sí cuenta**. Incluye
  las "aberraciones" fuera de UNIT: **Equipo aire acondicionado** y **Motor aire acondicionado**
  (nuevos símbolos `aire_ac`/`motor_ac`, también en el FAB).
- **Impresión/lienzo arreglado:** la hoja arranca en el **0,0 (esquina inferior-izq)** y crece
  hacia arriba (Y↑) igual que el dibujo → **el dibujo queda DENTRO de la lámina** (antes caía
  fuera / se escalaba cualquier cosa). El **plano importado imprime** (fondo transparente, con su
  opacidad); **lo único que NO se imprime es la grilla**. El **espacio de trabajo viene dibujado**:
  hoja + marco de márgenes + **cajetín "RÓTULO"** de referencia en el canvas, para saber dónde se
  trabaja. Export a hoja verificado end-to-end (dibujo dentro, cajetín con LÁMINA/empresa/obra/
  dibujante/escala/fecha/hoja).
- **Coordenada cartesiana = texto negro suelto arriba-izquierda del canvas** (sin fondo, sin
  botón, sin caja) → libera la barra inferior.
- **Modelo de escala (confirmado con Ángel):** se **dibuja SIEMPRE a 1/100** (mundo real, 1 m =
  100 px). La **grilla es la guía de DIBUJO** (real-métrica, no toca la impresión): **5 cm · 15 cm
  · 50 cm · 1 m**. La **escala (1/100·1/50·1/75) es asunto de la HOJA y se define SOLO en el
  dashboard** — quita del canvas (se sacó el selector de Escala del panel de Grilla y
  `setPlantaEscala`). Al bajar la escala, **la hoja del mundo se reduce** (1/50 → mitad, verificado
  `sheetWorldSize` ratio 0.50; 1/75 → 0.75) y por eso el dibujo **imprime al doble/triple**; el que
  cambia es la hoja, no el dibujo.
- **Barra de selección = orden INVISIBLE** (regla de Ángel: NO le gustan grillas/cajas/bordes
  visibles). Los campos van apenas espaciados, **sin caja ni divisores**. El **selector de color
  es un rectángulo de esquinas redondeadas** (no un círculo). El **Borrar** NO va en la botonera:
  es un **tacho flotante tirado en el rincón inferior-derecha** (`#selTrash`), apartado, que
  aparece solo cuando hay algo seleccionado (su lugar real sigue siendo el long-press; el tacho es
  un atajo suelto, "como los tachos de basura").
- **Selección por arrastre (marquee) + GRUPOS** (tipo AutoCAD): en la herramienta Selección,
  arrastrar sobre vacío dibuja un recuadro — **izq→der = ventana** (azul, solo lo totalmente
  encerrado), **der→izq = cruce** (verde punteado, lo que roza). Toque en vacío = deseleccionar;
  toque en objeto = ese objeto. No choca con el paneo (2 dedos). Con 2+ seleccionados la barra
  muestra **Agrupar · Desagrupar · Editar · Color · Borrar · Terminar**. **Grupos** por propiedad
  `group`: tocar un miembro selecciona todo el grupo; se **mueven/copian/borran juntos** (mover y
  copiar operan sobre el conjunto; la copia de un grupo sigue agrupada). **Editar grupo = modo
  aislado**: chip flotante "Editando grupo · Terminar", se atenúa lo de afuera y editás un miembro
  suelto sin desarmar. `selIds` es la fuente de verdad (con `setSel`, `selId` sigue sincronizado
  para el camino de 1 objeto). Rotar de grupo pendiente (por ahora rotar es de a uno). Persisten
  con el proyecto. Verificado e2e (ventana=3, agrupar, tocar→grupo, mover junto, aislado, cruce).
- **Pendiente:** "+" de nueva imagen (collage/varios planos); rotar grupo completo.
- **Propiedades del objeto seleccionado:** toque simple **selecciona** (queda azul); aparece la
  barra → **Tam cm/Giro/Altura** en símbolos · **Grosor/Línea/Escala** en formas · **Color** +
  **Borrar**. **Long-press = menú SOLO ubicación:** mover/copiar/rotar/espejo/borrar (sin color ni
  escalar: eso vive en la barra de propiedades, no se duplica).
- **Datos del rótulo al crear** el proyecto (obra, cliente, dibujante, empresa/facultad).
- **Salida:** *Hoja a escala (PDF)* → plotea a **A4/A3/A2** a la escala de la planta con
  **cajetín estándar** (modelo UNIT/facultad): marco con márgenes (izq 25mm), rótulo **abajo-
  derecha** tamaño fijo 175×50mm con LÁMINA nº grande, empresa, obra+hoja, dibujante, escala,
  fecha, hoja n/tot y wordmark. Se reduce ×0.5 en 1/50 y ×0.25 en 1/75. Sin hoja → infinito.
- **Persistencia por planta** (objetos, origen, plano+transform, grilla) con autosave.
- **Hoja de conteo de materiales:** botón en la barra → cuenta símbolos por tipo + metros de
  trazado (líneas/polilíneas/arcos), **por planta o por todo el proyecto**, imprimible en PDF
  (A4, con encabezado del proyecto). Base para enganchar el presupuesto (**iLVolt 2.0**).
- **Entrada libre:** al abrir va **directo a un lienzo libre** (sin formularios); Proyectos es
  opcional (se entra por el logo) para guardar/organizar y sacar láminas a escala.
- **Símbolos UNIT reales** (UNIT 821:2015): toma = semicírculo/domo, Schuko = domo relleno,
  interruptor = círculo + palanca con banderola, conmutador intermedio = ⊗ en la palanca,
  luz/centro = ⊗, pulsador = ⊙, tablero = moño, tierra = tres barras. Color editable por símbolo.
- **Pendiente (próximo):** lápiz **inteligente** (vincular llave↔luz y dar largo de cableado),
  leyenda automática, capas eléctricas, collage (varios planos a la vez), rótulo editable.
- **Visión:** SketchVolt será la app **principal**; sumándole el core de presupuesto de iLVolt
  queda como **iLVolt 2.0**.

### iLMe — `apps/ilme/` · v15 · en grilla
- **Qué es:** agenda personal — memoria, **rutinas** y pagos.
- **Lógica:** rutinas/recurrentes **solo aparecen su día programado, en rojo**
  (no persisten a diario); opción **"Un día"** (día de semana, ej. sábados);
  cumplida ≠ borrada (se destilda y reaparece la próxima fecha); borrado = permanente.

### iLSanitaria — `apps/ilsanitaria/` · v7 · en grilla
- **Qué es:** cálculo **hidráulico sanitario** — desagües, pluviales, reserva, etc.

### iLDJCU — `apps/ildjcu/` · v16 · en grilla
- **Qué es:** relevamiento de campo para **DDJJ de Caracterización Urbana (DNC)**.
- **Lógica/estado:** nueva declaración **en blanco** (sin datos pegados de otra);
  cache de la lista; multiusuario; iLStyle completo; Económico arranca en cero;
  menú hamburguesa a la **derecha**; wordmark mismo peso/tamaño (solo color);
  sin "Volver a iLStorage"; encabezado + foto editables al generar PDF.

### Bitacorapp — `apps/bitacorapp/` · v33 · en grilla
- **Qué es:** bitácora de proyectos con **notas, fotos y voz**; export PDF.
- **Lógica/estado:** PDF con encabezado editable + logo, **sin nombre de proyecto
  ni fecha** en portada; impresión individual de una nota = **misma modal general**
  con esa nota pre-tildada (un solo sistema de impresión).

### Cielorraso DXF — `apps/cielorraso/` (título "iLCelling cgg") · v5 · en grilla
- **Qué es:** metrado de **cielorraso de yeso desde DXF** — cenefa, materiales,
  export Excel.

### APU CORE / HA-Calc — `apps/apucore/` (título "HA-Calc") · v12 · en grilla
- **Qué es:** cálculo de **hormigón armado** — materiales, encofrado, acero, mano
  de obra.
- **Lógica/estado:** iLStyle; landing con **múltiples proyectos** persistentes;
  export del proyecto en **PDF + CSV** desde el landing; encabezado editable + logo;
  menú hamburguesa a la derecha; íconos +30%; una sola acción "Imprimir o guardar
  PDF" (quitado el ícono PDF redundante).
- **Nota:** app renombrada a HA-Calc, pero la **tarjeta de grilla aún dice "APU CORE"**.

### GuideCad — `apps/guidecad/` · v3 · **oculta** (no en grilla)
- **Qué es:** guía de **comandos de AutoCAD 2021**.

### iLCalc — `apps/ilcalc/` · v12 · **oculta** (no en grilla)
- **Qué es:** calculadora simple y rápida.

### Gastos Ruta 26 — `apps/gastos-ruta26/` · v1 · privada (no en grilla)
- **Qué es:** **gastos compartidos** de Gerardo y Ana Gracia (predio/ruta 26).
  Registra gastos por persona y calcula total combinado y saldos.

### Demoliciones — `apps/demoliciones/` · v5 · en grilla
- **Qué es:** **APU de demoliciones** para reformas residenciales (Uruguay).
  Spec en `apps/demoliciones/APU_DEMOLICIONES.md` (fuente de verdad).
- **Wordmark:** "Demoliciones" en **plata** con la "D" roja (nombres nunca en negro).
- **Estructura (2 pestañas dentro de la obra):**
  - *Rubros* (dashboard) = **solo carga** de datos: cantidad, acarreo,
    insalubridad, consumibles. **No muestra resultados por rubro ni totales.**
  - *Resumen* = lo **sumado**: tabla desglosada + totales, **encabezado editable**,
    export **Excel (.xlsx, SheetJS)** + **CSV** (offline) + **Imprimir/guardar PDF**
    (vista limpia: solo encabezado + tabla, **sin marca de app**).
- **Lógica:** 12 rubros con rendimiento (matriz §2) → H Ofi + H Peón
  (× acarreo × insalubridad), Costo MO, herramientas (10% pesados), GG (15%),
  **precio con cascada** (+ % beneficio), **escombro** (espesor × esponjamiento o
  bolsas × 0.03 m³) → **volquetas** (ceil vol/cap) + **fletes** global.
- **Config** (hamburguesa derecha): $hora Ofi/Peón/Medio Ofi, % herr, % GG,
  % beneficio, cap. volqueta (5 m³), flete. Cielorraso usa Medio Oficial; hierro
  = chatarra (sin volqueta). localStorage (obras + config).
- **Nota:** a futuro **fusionar con APU/HA-Calc** (mismo esquema de Config/rubros).

### iLVolt — `apps/ilvolt/` · v9 · herramientas afinadas
- **Qué es:** **presupuesto de instalaciones eléctricas** (Uruguay). Primera app que
  estrena la estructura iLStyle 1.8 completa (Core + Proyectos → Dashboard por fases →
  Resultados aparte).
- **Estructura:**
  - *Landing* = **Core** (tarjeta: matriz de precios base editable — mano de obra,
    factores SAU/BPS, módulos por línea económico/estándar/diseño/premium, canalización,
    iluminación, fuerza) + **Proyectos**.
  - *Proyecto* con 4 pestañas (flujo de arriba abajo, **sin costos durante el diseño**),
    con **previa general** (resumen bajo el título: tipo instalación · línea · tableros ·
    ambientes · bocas):
    **Datos** (cliente/ubicación/fecha; **tipo de instalación**: embutida / embutida
    ignífuga / vista-cablecanal / Daisa; **línea de módulos** + acceso al Core;
    **cantidad de tableros**; **metros de caño y de cable por puesta**; jornal, SAU, BPS,
    solo inspecciona + visitas, subterráneo) → **Ambientes** (nodos con bocas:
    tomas 10A/Schuko/Schuko-corte/USB/luces/paneles + cargas: horno-anafe, termofón,
    sensores/reflectores, bomba-piscina) → **Ingeniería** (tableros T1/T2, circuitos,
    térmicas, diferenciales, alertas, medida indirecta >40 kW — **sin costos**) →
    **Resultados** (costos discriminados, desglose por ambiente, encabezado + notas
    legales editables, firmas en el PDF).
- **Motor:** `CorePresupuesto.calcularProyecto` integrado del documento de Ángel
  (reglas UTE: 2×PVC 63mm + cámaras cada 15m, PAT automática, medida indirecta >40 kW;
  mano de obra por rendimiento SAU × jornal × BPS 1.758, o boca fija; peinado de tableros;
  visitas de inspección). Spec completa en `apps/ilvolt/CORE-SPEC.md`.
- **Export:** Excel (.xlsx) + CSV + Imprimir/PDF (limpio, encabezado + firmas + notas,
  sin marca de app). localStorage (core editable + proyectos).
- **Herramientas** (FAB en proyecto + menú hamburguesa):
  - *Armador de tablero:* grilla real DIN (filas de 12; tamaños 2/4/8/12/24/36/48;
    cajas UTE plástica/estanca/metálica/PRFV con IP). Cada llave ocupa sus **polos/módulos
    reales** (general y diferencial = 2, térmica = 1, elegible 1–4 vía `grid-column:span`);
    amperajes por tipo; en térmica se **elige la curva** (B/C/D → label "D16", "C10").
    Regletas neutro/tierra al costado. Export PDF.
  - *Calculadora por bloques* (estilo Excel, no convencional): cada bloque (ej. Habitación 1)
    suma sus valores con **total propio**, y hay **Total general** de todos los bloques.
  - *Bitácora:* notas de "lo que se está haciendo" con **dictado de voz** (Web Speech API
    es-UY, se van acumulando) — para gente que no escribe. Igual criterio que el canvas iLFrame.

---

## Notas
- Al agregar/renombrar una app: crear su ficha acá y (si va pública) su tarjeta
  en la grilla del `index.html`.

## Pendientes conocidos
- **Alinear todas las apps al estándar iLStyle 1.8**: botones sin relleno (ícono +
  borde que cambia de color), FAB cuadrado, estructura Landing(Core+Proyectos) →
  Dashboard → Hoja, y export unificada (Excel + CSV + Imprimir/PDF limpio).
  Aplicado en **Demoliciones** (referencia viva); faltan las demás.
- iLFrame: cuantificar el material de cierre/tapa de la comanda A/B/T.
- iLWall: ajustar coeficientes de cómputo si Ángel los define distinto.
- APU CORE: decidir si la tarjeta de grilla se renombra a HA-Calc.
- Demoliciones: a futuro, fusionar con APU/HA-Calc (Config y matrices compatibles).
