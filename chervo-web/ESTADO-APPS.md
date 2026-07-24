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

### SketchVolt — `apps/sketchvolt/` · v1 (SW sketchvolt-v53) · app pro
- **Tomas e interruptores redibujados según la leyenda de Ángel (v50):** toma = **medio círculo
  perfecto + vástago corto arriba (parte del símbolo, no un error) + línea base**; schuko igual pero
  relleno; toma de piso con vástago hasta el borde del cuadro y su línea base. Interruptores con
  **círculo más grande** + palanca + banderola, variantes diferenciadas (bipolar/conmutador/
  intermedio/dimmer). Íconos del panel actualizados a juego.
- **Simbología UNIT ampliada + tablero corregido + FAB reagrupado (pedido Ángel, con su leyenda
  oficial):** se reemplazó `renderSimbologiaUNIT` por la versión detallada y se sumaron símbolos
  (corrientes débiles: timbre/TV/datos/tel; iluminación: tubo, emergencia, caja derivación; MT/
  industria: transformador, generador, motor, baterías, descargador). **Tablero** = rectángulo
  apaisado con **moño relleno a la izquierda** (dos triángulos que se tocan), resto vacío — según su
  leyenda (antes estaba mal). `NOM_BLOQUE` y `REF_VIVIENDA` ampliados. **Panel FAB reagrupado**:
  *Tomas monofásicas* (monofásico/schuko/piso) primero, luego *Interruptores*, *Puntos de luz*,
  *Potencia/Tablero*, *Corrientes débiles*, *Iluminación especial*, *MT/Industria*, *Aire*.
  Nota: recuperado de una base vieja (el contenedor se reclonó en la rama `claude/…`@v38); rehecho
  sobre `master`@v48 sin perder cursor/snap/SmartLine/texto.
- **Snap más tolerante en SmartLine (dedo inexacto, pedido Ángel):** el radio de snap sube a
  **42px** para `sline` tanto en vivo (`getW` con umbral por herramienta) como al cerrar
  (`nearNode` en `handleUp`), asegurando el enganche del **1er y último punto** a nodos/símbolos.
  Verificado: engancha a 35px (antes 22px fallaba).
- **SmartLine — modo propio (cañería eléctrica, pedido Ángel):** herramienta `sline` (botón en
  panel-herr, icono línea con 2 nodos) para **conexiones eléctricas**. Arrastre = línea recta con
  **auto-conexión** de extremos al nodo más cercano (`nearNode`, incluye símbolos), se guarda como
  `type:'line', elec:true`; se dibuja con **puntos de conexión** en los extremos. El **cómputo**
  separa **Cañería eléctrica** (suma de líneas `elec`) del **Trazado dibujado** (líneas comunes) en
  pantalla y en la impresión. Verificado Playwright: auto-conexión a símbolo + 3 m de cañería.
- **Icono snap + flecha unificada (pedido Ángel):** icono de `#snapBtn` cambiado a **cuadro
  punteado + nodo rojo en esquina** (ref. de Ángel; sin rosado, nodo con borde rojo). La **flecha**
  se unificó al **cursor puntero**: mismo path en `#escBtn` (seleccionar), FAB (clona escBtn) y el
  **cursor del canvas** (`drawCursorSnap`); se agrandó el glifo para igualar el tamaño visual del
  resto de íconos del head (todos 28px).
- **Botones snap/grilla + SmartPen + tarjeta de texto (lote spec completo):**
  · **Botón snap** (`#snapBtn`/`toggleSnapCursor`, icono flecha+cuadro+nodo rojo de Ángel) prende/
  apaga el snap del cursor a dibujos (`snapObjOn`). · **Botón grilla** unificado (`#gridBtn`/
  `toggleGrid`, un solo botón, no dos): prende/apaga la grilla (visible+snap) **y abre el panel de
  medidas** `#grpGrid` (5/15/50cm/1m). · **SmartPen** (ya estaba: `recognizeStroke`+`nearNode`):
  trazo abierto recto→línea, cerrado→círculo o rectángulo por razón de área/aspecto, auto-conexión
  de extremos a nodos. · **Tarjeta contextual de texto §4** (`#txtCard`, `openTextCard`/`tcUpdate`/
  `closeTextCard`): tocar un texto abre tarjeta flotante mínima con **contenido, tamaño (num+slider)
  y variable/precio** (`o.attr`) en vivo; se cierra al tocar otro lado o cambiar de herramienta.
  Verificado Playwright: rect/line/circle OK, toggles OK, tarjeta actualiza texto/tamaño/attr, sin
  errores. **Redundancia §5:** se fusionaron los 2 botones de grilla en 1.
- **Indicador de snap = cuadradito rojo (ref. de Ángel):** el snap a dibujos se marca con un
  **cuadrado rojo `#FE0000` con borde blanco** (nodo/grip, como su icono flecha+cuadro+nodo rojo),
  en vez de la cruz. Grilla sigue con glifo gris.
- **Snap simplificado (pedido Ángel):** un solo botón **Grilla** (`#gridBtn`/`toggleGrid`) que
  prende/apaga la grilla (visible + snap); la **medida** se cambia desde el panel `#grpGrid`
  (5/15/50cm/1m). Se **quitó el botón de cruz** (snap a dibujos): el snap a dibujos es **siempre
  ON**. Su indicador pasó a **cruz ROJA** (`#FE0000`, activo/enfocado — nada de naranja, respeta
  paleta blanco/gris/rojo); el snap a grilla sigue con glifo **gris**. `drawGrid` respeta `gridOn`.
- **SmartPen (spec §3):** la herramienta lápiz (`pen`) ahora, al soltar, **reconoce el trazo** y lo
  limpia a vector: recta→`line`, lazo cerrado→`rect` o `circle` (círculo vs rect por **razón de área
  shoelace/bbox**: ≤0.85 y aspecto ~1 → círculo; si no → rect), curva abierta → queda freehand
  (`pen`). **Auto-conexión**: los extremos de la línea reconocida se enganchan al nodo de objeto
  más cercano (`nearNode`, sin grilla). Funciones `recognizeStroke`/`nearNode` nuevas. Verificado
  Playwright: recta→line, cuadrado→rect, círculo→circle(r80), curva→pen, sin errores de código.
  Pendiente spec: tarjeta contextual de texto (§4) y auditar redundancia UI (§5).
- **Snap doble e independiente (pedido Ángel):** dos flags `snapObjOn` (dibujos) y `snapGridOn`
  (grilla) con **dos botones** en la barra (`#snapObjBtn` nodo · `#snapGridBtn` cuadrícula) →
  apagar la grilla **no** apaga el snap a objetos. `getW` prueba objetos si `snapObjOn`, cae a
  grilla si `snapGridOn`, si no crudo. Se quitó el **indicador de snap viejo** (azul/verde en
  `drawPreview`, redundante); ahora todo lo pinta `drawCursorSnap` (naranja=dibujos, gris=grilla).
- **Ajuste lote T (pedido Ángel):** más offset de cursor (`CURSOR_OFFY` 44→58) y snap de grilla
  diferenciado (ícono gris de cuadrícula vs naranja de dibujos).
- **Cursor offset + snap magnético con glifos (lote T · spec canvas liviano):** el touch ahora
  dibuja con un **cursor flecha rojo** desplazado `CURSOR_OFFY=44px` hacia arriba (resuelve el
  "dedo gordo"): toda la lógica (dibujo/selección/snap) usa el punto del cursor, no el crudo del
  dedo (offset aplicado en `getS` solo para touch). `getW` reescrito para **clasificar** el snap y
  guardarlo en `snapHit={x,y,kind}`; `drawCursorSnap()` (llamado en `render` salvo `_exporting`)
  pinta glifos **naranja neón `#FF5F1F`**: extremo=cuadrado, medio=triángulo, centro=círculo con
  punto, cuadrante=rombo, cercano=X. `touchActive/cursorS` seteados en `onTS/onTM`, limpiados en
  `onTE`. Verificado Playwright: snap `end` en (300,0), cursor y touchActive OK, sin errores.
  **Pendiente del mismo spec (próximas tandas):** SmartPen (reconocer trazo→línea/rect/círculo en
  pointer_up), tarjeta contextual de texto, y auditar redundancia de UI (1 entrada por acción).
- **Hoja: 3 íconos en línea + colores (lote S — pedido de Ángel):** los íconos de la tarjeta de hoja
  (imprimir/borrar) se movieron del thumbnail al **pie, en línea con editar** → orden **editar ·
  imprimir · borrar**, todos **grises** (`.pl-acts`, `flex-shrink:0`). **Nombres largos** resueltos:
  `.pcard-name/.pcard-date` con elipsis (`min-width:0` en `.pl-meta`) → los 3 íconos quedan SIEMPRE en
  su lugar a la derecha. El **lápiz del proyecto** (encabezado) también **gris**. En el **head del
  proyecto**, imprimir + cómputo pasaron a **ROJO** (`#scrProj .scr-head .iconbtn`). **Wordmark
  invertido**: **"Sketch" en ROJO, "Volt" en GRIS** (`.wm`/`.wm b` y `.bar-logo`/`span`). Verificado
  e2e (colores, 3 íconos, nombre largo no desplaza).
- **Hoja: editar INLINE + íconos grises + sin path (lote R — pedido de Ángel):** el editar de la
  hoja ahora **se despliega inline en su propia tarjeta** (`.pl-edit` con nombre/hoja/escala/
  orientación, `togglePlEdit`/`savePl`), mismo lenguaje que el proyecto — **nunca en el canvas**
  (se quitó `hojaModal`/`editHoja`/`saveHoja`). **Todos los íconos de la tarjeta de hoja en GRIS**
  (`.pcard .iconbtn` #9a9a9e: imprimir, tacho y lápiz). Se **quitó el texto "PLANOS / HOJAS · DATOS
  DE PLANO"** (el path/guía). El thumb y el meta abren el dibujo; el resto de la tarjeta no. Verificado
  e2e (editar inline cambia escala y guarda, íconos grises, sin path).
- **Dashboard afinado (lote Q — pedido de Ángel):** **imprimir del PROYECTO (todas las láminas) +
  materiales → al HEAD** (barra superior); junto al nombre queda **solo el lápiz** de editar.
  **Imprimir por-HOJA** en la **esquina superior derecha** de la miniatura; **tacho en la esquina
  inferior derecha, en GRIS** (`.pc-trash` #9a9a9e, no resalta). El **editar del proyecto se DESPLIEGA
  INLINE** en el dashboard (`#pjEditPanel`, `toggleProyEdit`), ya no es modal (`proyModal`/`editProy`/
  `closeProy` eliminados). La tarjeta **"+" (Nueva hoja / Nuevo proyecto) pasó a GRIS** (borde, cruz y
  texto). Verificado e2e (2 íconos en head, 1 en título, print arriba/tacho abajo gris, panel inline,
  "+" gris).
- **Dashboard: datos del proyecto VISIBLES como texto, cajas de llenado OCULTAS (lote P):** el
  dashboard ya no muestra inputs/selectores del proyecto. El **nombre + datos** (escala · hoja ·
  orientación · cliente · obra · dibujante · empresa) se ven como **texto** (`renderProyHeader` →
  `#pjTitleTxt` + `#pjMeta`); un **lápiz** junto al nombre abre el modal `proyModal` donde se llenan
  (mismos IDs `pjTitle/pjDesc/pjEsc/pjHoja/pjOri/pjObra/pjCli/pjDib/pjEmp`, ahora dentro del modal).
  **Solo las hojas tienen caja** (tarjetas). Imprimir/Materiales + lápiz = íconos sueltos junto al
  nombre. **Logo del rótulo:** subir imagen (`onLogoFile` → `proy.logo` dataURL), preview en el
  modal, se dibuja en el cajetín (`_logoImg` en `drawRotulo`, col1). El **título de plano del rótulo
  es el nombre de la hoja** (ya lo tomaba). Se quitaron `pjName2/pjEdit` (live) → `saveProy`.
  Verificado e2e (0 inputs visibles, texto correcto, modal edita, rótulo refleja). **Pendiente**
  (`SKETCHVOLT-PROXIMO.md`): re-dibujar el cajetín al estilo de la referencia de Ángel (LOGO grande
  izq · PROYECTO/TÍTULO/ESCALA/SUP/FECHA/CLAVE/PLANO Nº · flecha norte; plano arriba / proyecto abajo).
- **Dashboard limpio (lote O — pedido de Ángel):** **Imprimir** y **Materiales** pasaron a **íconos
  sueltos** (sin borde/fondo, clase `.iconbtn`) **arriba-derecha del nombre del proyecto** (se quitó
  la sección "Salida" y las tarjetas `.dact`). La **tarjeta de hoja** se limpió: **sin selects a la
  vista** (nada "por llenar") → pie con **nombre · tamaño · escala · orientación como texto** a la
  izquierda y **lápiz de editar** a la derecha; al tocar el lápiz abre un **modal "Editar hoja"**
  (`hojaModal`: nombre + hoja + escala + orientación). En la esquina, **tacho + imprimir sueltos**
  (sin fondo). **Imprimir por-hoja**: `imprimirLaminas(soloId)` + `imprimirPlanta(id)`. El tacho del
  landing también quedó suelto (mismo lenguaje). Limpieza: se borraron `renombrarPlano/planoEsc/
  planoHoja` y el CSS `.dact/.pcard-del`. Verificado e2e.
- **Rediseño LANDING + DASHBOARD con tarjetas + MINIATURA del dibujo (lote N — visión de Ángel):**
  nuevo generador `plantaThumb(pl)` (reusa el motor con `_exporting`: render limpio de los objetos a
  un PNG chico) + `proyThumb`/`fFecha`. **Landing:** tarjetas visuales `.pcard` (miniatura arriba
  ~75%, nombre + fecha/hora abajo ~25%, **tacho en la esquina**, tocar = abrir). Tarjeta **"+"**
  crea proyecto **sin formulario**: modal que pide **solo el nombre** → `crearProyRapido` con
  `creado:Date.now()` → abre el dashboard (se sacó el `npForm` con todos los campos del rótulo; esos
  se completan en el dashboard). **Dashboard:** las hojas pasaron de filas a **tarjetas** con
  miniatura, nombre editable, hoja/escala/orientación y tacho; tarjeta **"+"** agrega hoja
  (`planoOri` nuevo para rotación). Verificado e2e (crear sin form, dibujar, miniatura en landing y
  en dashboard, agregar 2ª hoja). Pendiente fino (`SKETCHVOLT-PROXIMO.md` §3): íconos de impresora/
  exportar sobre el avatar y el layout exacto 75/25 con acciones arriba.
- **Línea de acción en TODAS las herramientas + flecha volver + sin exportar en toolbar (lote M):**
  `showActions` se generalizó (recibe funciones `delFn/okFn`) y ahora **Imagen** (tacho=quitar fondo,
  tick=listo), **Grilla** (tick=listo) y selección usan la **misma línea de acción** centrada (tacho
  gris + tick) — antes Imagen/Grilla tenían tacho/cerrar inline (lo que veía Ángel). Se agregó una
  **flecha roja de "Volver al dashboard"** ANTES del wordmark (antes solo se volvía tocando el nombre,
  no era obvio). Se **quitó el botón Exportar (↓) del toolbar** del canvas (exportar/imprimir van al
  dashboard). Verificado e2e (toolbar con flecha y sin exportar; grid=tick; image=tacho gris+tick).
- **Barras de herramienta: ícono ARRIBA + reparto parejo a TODO el ancho (lote K — pedido de
  Ángel):** las props de las herramientas de dibujo salían **apiladas y pegadas a la izquierda**
  (contenedor genérico). Ahora: (1) **ícono arriba, control abajo** en TODOS (se arregló `grpTool`/
  grosor, que tenía el ícono al costado → ahora patrón `.fi`); (2) se quitaron los **10 divisores
  `.pdiv`** (orden invisible); (3) los controles se **distribuyen parejo a lo ancho** según cuántos
  tenga la herramienta: `#propbar{justify-content:space-evenly}` y las cajas multi-control
  (`#grpBlock,#grpHatch,#grpDim`) ocupan el ancho y reparten adentro. Resultado: polígono =
  grosor·línea·color·tamaño·lados repartidos a lo ancho; símbolo = giro·tamaño·altura·color. Sin
  scroll lateral, sin apilado forzado, mismo lenguaje en todas. Verificado e2e (line/poly/block en
  una fila, distribuidos). **Ojo especificidad:** los overrides van como `#propbar>#grpX` para ganarle
  a `#propbar>div` (si no, el bloque quedaba "castigado al centro" sin tomar el ancho).
- **LÍNEA DE ACCIÓN dinámica: borrar / aprobar / finalizar (lote L — pedido de Ángel):** el **tacho
  ya NO va fijo a la derecha** (apretaba los controles). Ahora hay una **línea propia abajo**,
  centrada, separada por una línea fina: `#propActions`. El **tacho va GRIS** (`#8e8e93`) y centrado;
  si hay algo que **aprobar/finalizar** aparece el **tick** y comparten el centro (el tacho se corre).
  Así los controles de arriba **se expanden a todo el ancho** (space-evenly en grpSel/grpMulti). JS:
  `showActions(del,ok)` — 1 objeto = tacho solo; grupo/multi = tacho + tick; herramienta/vacío = línea
  oculta. Se ocultó también desde `_hideAllGrp`. Verificado e2e (1 objeto gris centrado, grupo
  tacho+tick, herramienta sin línea).
- **Borradores consolidados + dashboard más icónico (lote J):** se **quitó `erase`** (borrar-por-
  toque) por redundante — ya hay 2 firmas de borrar objeto entero (selección + long-press). Quedan
  **`eraser`** (goma a mano alzada) y **`trim`** (recorta hasta tocar línea). En el dashboard, la
  sección "Salida" pasó a **botones-ícono** (Imprimir = impresora / Materiales = lista) y el
  **"Dibujar"** de cada hoja quedó **solo lápiz** (sin texto). Falta el rediseño grande de tarjetas
  con **avatar del dibujo** (home + dashboard) → documentado en `SKETCHVOLT-PROXIMO.md` §3 con la
  visión completa de Ángel (tarjeta con miniatura arriba, datos abajo 25%, "+" sin formulario, íconos
  de impresora/exportar/rotación sobre el dibujo).
- **Barra de comandos: íconos grandes + CERO texto (lote I — pedido de Ángel):** `.pib` 40→**48px**
  (svg 24→**30**), íconos-rótulo `.fl` 18→**23px**. Se quitó **todo el texto** de la barra de grupo/
  multiselección (`gmCount` "N seleccionados" y `gmNameField` GRUPO/nombre) → el nombre ya NO se
  repite: queda **solo en el rótulo flotante** `#pbTool` ("Grupo · X"), afuera de la barra (era la
  redundancia que marcó Ángel). Verificado: barra sin texto, rótulo flotante con el nombre, sin
  h-scroll.
- **Imprimir SOLO desde el dashboard:** se quitó el botón **"Hoja"** (imprimir la lámina) del panel
  de exportar del canvas y su función `exportarHoja` (el canvas ya no manda a imprimir; queda PNG/DXF
  como exportación de archivo). La impresión de láminas se hace desde el dashboard (`imprimirLaminas`,
  que sigue usando `renderSheetURL`). Bug de borrado: **no reproducible** (select+tacho y `erase` por
  toque borran bien, incluso 6px desviado) → era la versión vieja cacheada. Pendiente decidir: la
  **goma a mano alzada `eraser`** (fragmenta líneas, deja pedacitos — la "de iLDraw que siempre tiene
  algo") vs. `erase` (toca y borra el objeto entero). **Dashboard con más íconos/menos texto:**
  pendiente (ejemplo que pasó Ángel: tarjetas con acciones-ícono abrir/compartir/duplicar/editar/
  imprimir/borrar).
- **PRÓXIMO CAMBIO (dejado por Ángel, ver `SKETCHVOLT-PROXIMO.md`):** (1) FABs de herramienta
  **negro en espera / rojo activo** (hoy `#btn-elec` y `#btn-herr` están rojo fijo — cambiar a
  color-por-estado, sin borde rojo de adorno); (2) el **tacho del long-press** (`#ctx`, ~línea 692)
  debe usar el **mismo svg** que el tacho del panel (`.pib.danger`, con barritas + asa). No
  implementado aún; el md tiene las referencias de código para arrancar directo.
- **Más íconos, menos letras + sin halos (lote H — pedido de Ángel):** se quitó el **anillo/halo
  verde** del tick de Aceptar/Terminar (`.pib.ok` ahora pelado, grande 50px con check 34px → se nota
  por TAMAÑO, no por caja). Los **rótulos de texto** de las barras de propiedades se pasaron a
  **íconos finos** (línea, gris de contexto): regla=Tamaño(cm), rotar=Giro, flechas↕=Altura(cm),
  pesos=Grosor, guiones=Línea, gota=Opacidad, diagonales=Patrón, goma=Goma. El rótulo **"Color" se
  eliminó** (la pastilla de color ya ES el color). Se dejaron como texto los ambiguos (Fuente, Lados,
  Texto cota, Grilla). CSS `.fi>.fl svg` (18px). Verificado e2e (símbolo: regla·giro·altura·color·
  agrupar·tacho; línea: grosor·línea·escala·color·agrupar·tacho; sin halos, sin h-scroll). node OK.
- **Propbar = PANEL que sube/baja desde abajo (lote G — pedido de Ángel):** la barra de
  propiedades dejó de ser una franja fija en el flujo (que dejaba un hueco blanco y tenía **scroll
  lateral**). Ahora es un **panel overlay** (`position:fixed;bottom:0`, esquinas redondeadas +
  sombra) que **se desliza fuera** cuando no hay contexto (`translateY`, sin clase `.up`) y **sube**
  al seleccionar/usar herramienta (`refreshBottom` alterna `.up`). Así el **canvas/grilla llena todo
  el pie** (el `#wrap` es `flex:1` y la propbar ya no ocupa flujo). **Sin scroll lateral nunca:** la
  fila activa es `flex:1 1 100%;flex-wrap:wrap` → si no entra, **se apila hacia arriba** (el panel se
  hace más alto), jamás desborda al costado. **Rótulo de nombre/acción** (`#pbTool`) más grande
  (18px, antes 14) y flota **justo encima del panel** (alto real vía JS, aunque envuelva). **Tick de
  Aceptar/Terminar más grande y notorio:** `.pib.ok` 50×50 con **anillo verde** y check 32px
  (énfasis por tamaño, iLStyle). Modales subidos a `z-index:400` (el diálogo de agrupar queda sobre
  el panel). Verificado e2e (idle→panel abajo y grilla al pie; selección→panel sube 2 filas sin
  h-scroll; diálogo clickable por encima). `node --check` OK.
- **Ícono de agrupar = el de referencia de Ángel** (dos cuadros dentro de un **marco punteado con
  4 esquinas/tiradores**, estilo "selección"), no dos cuadros pelados. Y **fuera el ejemplo inventado
  "Toma doble"** del placeholder → ahora dice *"Ponle un nombre (opcional)"*.
- **Flujo de grupo/componente simplificado (lote F — pedido de Ángel):** el nombre **se fija al
  crear y ya no se cambia**. Un solo **ícono de agrupar** (dos cuadros) abre el **diálogo** que:
  (1) deja **elegir Grupo o Componente** (segmentado, borde rojo = activo) con una línea que explica
  cada uno, (2) pide **nombre**, (3) **Crear → cierra** (fin de acción). Después, sobre el
  grupo/componente la barra muestra el **nombre en solo lectura** (etiqueta GRUPO/COMPONENTE) y solo
  **Editar** (lápiz) + **Descomponer** (ícono de separar). Se quitaron los botones de texto
  *Agrupar/Desagrupar/Componente/Independizar* y el input editable de nombre (`setGroupName`,
  `independizarComp` eliminados). `agruparSel` acepta 1+ objeto (un símbolo suelto se puede volver
  grupo/componente desde el mismo ícono). Verificado e2e (multi→diálogo→elegir componente→nombrar→
  crear→barra con nombre fijo + Editar/Descomponer, color oculto en componente). `node --check` OK.
- **Auditoría estructural (lote E — para 100 estudiantes):** barrido de código muerto y
  discrepancias. **Removido el panel `#ilsx-ov` (bottom-sheet "iLStorage")**: era código fantasma
  de otra app — `ilsxOpen()` estaba definido pero **nunca se llamaba** (inalcanzable), y arrastraba
  su propio `<link>` de Google Fonts y `<style>`. Verificado: sin refs colgadas a `getElementById`,
  sin handlers `on*` indefinidos, sin funciones huérfanas reales (los falsos positivos son callbacks
  pasados por referencia). `node --check` OK; la fuente Exo del header y el `loadScript` de pdf.js
  (fondo PDF) se conservan por ser reales. −30 líneas.
- **Flujo de agrupación claro (diálogo):** con 2+ (o 1 objeto) seleccionados, **Agrupar** o
  **Componente** abren un **diálogo que pide NOMBRE** → Crear → hecho (fin de acción). `agruparSel`/
  `crearComponente` reciben el nombre. Es la norma unificada para TODOS los elementos (línea, arco,
  polígono, símbolo): todo se agrupa/componentiza igual.
- **Bug de arcos resuelto:** el arco solo se podía tocar por su **cuerda**, por eso "quedaba
  separado". Ahora `hitTest` prueba contra la **curva** muestreada (`arcPolyPts`) → el arco se
  selecciona y entra a grupos/componentes como cualquier elemento.
- **Rotar conjunto/grupo/instancia:** rota TODO lo seleccionado alrededor del **centro del box
  imaginario** que lo envuelve (`_setBoundsCenter`), como el resto de transformaciones. `startRotate`
  acepta un set (`rotSet`), `applyRot` rota cada miembro alrededor del eje común; los bloques suman
  su `rotation`. (Arreglado bug latente: `rotDragStart==0` era falsy.) En componentes, rotar la
  instancia desde afuera es por instancia (no propaga).
- **Etiqueta/nombre y símbolo→bloque:** grupo y componente llevan **nombre editable** en la barra
  (etiqueta "GRUPO"/"COMPONENTE"; en componente el nombre es de la definición → compartido por las
  instancias). Un **símbolo/objeto suelto se puede convertir en Componente** (botón "Componente" en
  la barra de 1 objeto): queda como bloque repetible; sus copias se vinculan (nueva instancia con
  grupo fresco) y **editar la definición en el editor propaga a todas las copias**. Un objeto que ya
  es grupo/componente muestra su barra aunque sea de 1 pieza. Verificado e2e (convertir, nombrar,
  copiar, editar-propaga).
- **Componente vs Grupo — semántica afinada (según Ángel):** **Grupo** → cambiar color/props
  DESDE AFUERA afecta a todas sus piezas (color visible en la barra). **Componente** → color/
  estructura NO se toca desde afuera (color OCULTO en la barra): solo por el **editor** (isolation),
  que **propaga a todas las instancias**. **Escalar / espejo la INSTANCIA desde afuera = por
  instancia** (no afecta al resto): `selScaleSetLive` escala el conjunto alrededor de su centro sin
  propagar (incl. `cm` de símbolos); mirror por long-press opera solo sobre esa instancia.
  (Pendiente menor: rotar la instancia completa —hoy rotar es de a un objeto.)
- **Spec de refactor (lote D):** **Grilla** afinada — trazo DELGADO pero **notoria para trabajar**
  (metros `rgba(139,0,0,.24)` lineWidth .7, subdivisiones `rgba(139,0,0,.11)`). **2B GRUPO vs
  COMPONENTE (lógica SketchUp) IMPLEMENTADO:** `comp` = definición compartida, `cidx` = índice de
  hijo; **Componente** (botón, convierte un grupo) queda vinculado entre copias; **editar un
  miembro en modo aislado PROPAGA a todas las instancias** (color/tamaño/línea vía `selSet` y el
  desplazamiento vía `doMovEnd`, ambos gated en `editGroupId`); **Independizar** rompe el vínculo de
  una instancia (grupo suelto). La copia de un componente hereda `comp`/`cidx` (nueva instancia).
  Verificado e2e (crear, copiar, editar-propaga, independizar). Guardado
  `SKETCHVOLT-cables-presupuesto.py` (código de Ángel para el futuro "lápiz inteligente").
- **Spec de refactor (lote C — hojas 4A):** formatos **+A1 (841×594)** en dashboard y por-plano;
  **medidas de usuario** (`custom` + ancho/alto mm en el dashboard, `hojaMM()` con fallback a
  `proy.customW/H`); **impresión de TODAS las láminas desde el dashboard** (`imprimirLaminas()`
  carga cada planta —con su fondo— renderiza la hoja y las junta en una ventana de impresión,
  restaurando el estado). Falta de la spec: **2B grupo vs componente** (definición compartida
  tipo SketchUp) — es el único ítem grande pendiente; está especificado en `SKETCHVOLT-GRUPOS.md`.
- **Spec de refactor (lote B — grupos):** **Espejo/transformación del grupo como UNIDAD** con
  **eje baricéntrico global** (`mirrorSet` usa el bounds de toda la selección, no el centro de cada
  pieza) → el grupo ya no se desarma. En **edición aislada** el cuadro de propiedades del elemento
  tocado funciona (props + edición aplican dentro del aislado). Pendiente mayor: **2B grupo vs
  componente** y **4A medidas de usuario + impresión desde el dashboard**.
- **Spec de refactor (lote A):** `selSet` aplica a TODA la selección (multi/grupo). **Grilla en
  BORDÓ BAJO**: módulos por metro `rgba(139,0,0,.22)` + subdivisiones finas `rgba(139,0,0,.07)`
  (casi imperceptibles, ganan nitidez al zoom in). **Nombre de herramienta suelto** arriba-izq de
  la barra (estilo `#coord`, sin caja; se oculta en vacío). **Cajetín físico FIJO 175×50 mm** (sin
  factor de escala; `mm2w` lo escala solo). **Hojas +A1** (841×594). **Márgenes atenuados**
  (izq 25 / resto 10 mm) + cajetín reservado → se ve el área real de trabajo. **Borrar homologado**
  al ícono tacho (fino 1.1) también en el dashboard (se quitó la ✕ cruda). Símbolos **sin máscara**
  (decisión de Ángel: van encima, sin tapar con blanco). Import de imagen ya unificado (`#planoInput`).
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
  es un rectángulo de esquinas redondeadas** (no un círculo). El **Borrar (tacho)** va **en la
  misma fila, al final, empujado a la derecha** (`margin-left:auto` → "viene de derecha a
  izquierda"), sin seguir el ritmo de los demás campos y sin caja. (Se descartó el intento de
  tacho flotante en el rincón: quedaba como un "monumento", Ángel lo quiere discreto y en su fila.)
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
- **Pendiente:** "+" de nueva imagen (collage/varios planos).
- **Idea futura (Ángel):** símbolos se dejan como componentes cerrados (no geometría abierta).
  Lo nuevo se crea dibujando; más adelante, una **paleta/caja de componentes del proyecto**
  (biblioteca reutilizable, "llamable" desde cualquier hoja) — como la Caja de Referencias pero
  con componentes propios guardados a nivel proyecto.
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
