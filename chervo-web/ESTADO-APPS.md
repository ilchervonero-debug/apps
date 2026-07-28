# ESTADO-APPS.md — Registro vivo de iLStorage

### Landing ilchervo.com — `chervo-web/index.html` · candado de acceso privado
- **Candado en el landing (reemplaza el control por Notion).** Overlay full-screen que pide una **clave** antes
  de mostrar el hub de apps; clave guardada como **SHA-256** (no en texto), recordada por dispositivo
  (`localStorage il_access`). No toca las apps ni rompe las instaladas. **Clave definitiva ya puesta por Ángel**
  (guardada solo como hash `G_HASH`; para cambiarla, recalcular SHA-256 y reemplazar el hash). **Límite honesto**: protege el LANDING (nivel Notion);
  las URLs directas de cada app siguen abiertas. Candado total por-app = middleware Vercel / plan Pro (pendiente
  si lo pide).


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

### iLWall — `apps/ilwall/` · (SW ilwall-v4) · cómputo de tabiques de yeso
- **v4: cáscara IDÉNTICA a iLCielorraso (pedido Ángel: "quiero que sean iguales exactos").** Porté las clases
  y el markup de cielorraso a iLWall (mismas vars mapeadas): **home** = `list-item` con ícono + **acumulado**
  ("N sección(es) | Emplacado total: X m²") + fecha + `action-btn` borrar. **Proyecto** = `env-card` (borde rojo,
  `env-info` con datos + `env-actions` con íconos editar/borrar), y **"RESUMEN DE MATERIALES (ACUMULADO)"** en
  `summary-card` + `grid-2` + `data-box` (label mayúscula + valor, rojo para superficie/placas/cantoneras).
  Mismo ORDEN que cielorraso (secciones → acumulado). Difieren solo en el contenido de uso (muros vs cielorrasos).
  Verificado headless, 0 errores.
- **v3: navegación como iLCielorraso (pedido Ángel: "quedas atrapado, no hay forma de volver").** La navegación
  existía (home→proj→editor, `goBack`/`btnBack`) pero el botón "Volver" era invisible (`border:none;background:none`)
  y el título no daba contexto. Alineado a cielorraso (su base): **botón "Volver" ahora es una caja roja visible**
  y el header muestra **breadcrumb** (`iLWall | Proyecto` en proj · `| Proyecto · edición` en editor). Editar lo
  ya cargado sigue por "Editar" (restaura segments/openings/refuerzos) y "Cargar paredes". Verificado:
  editor→proj→home, breadcrumb OK, 0 errores.
- **DXF + muros por línea + refuerzos de encuentro + cantoneras (v2, pedido Ángel).**
  · **Parser DXF robusto**: saca BOM, `trim` de valores, tolera **decimales con coma** (`2,5`→2.5) — era la causa
    de "no toma los DXF". Lee LINE/LWPOLYLINE/POLYLINE.
  · **Cada línea = un muro base** (ya generaba montantes por segmento; ahora se etiqueta y grafica como tal).
  · **Encuentros automáticos** (`analyzeNodes`): une extremos a <4 cm y detecta **esquina** (2 muros en ángulo),
    **T** (incluye cuando el extremo cae sobre el INTERIOR de un muro pasante) y **cruz**. Agrega refuerzos de
    montante (esquina×2 · T×1 · cruz×2) al cómputo, suma sus uniones metal-metal.
  · **Cantoneras**: 1 esquinero por esquina (u + ml a lo alto). En el cómputo y marcado en canvas:
    **esquina = cuadro rojo (cantonera)**, **T/cruz = punto rojo (refuerzo)**. Status de import muestra
    nº de muros/esquinas/T/cruces. Verificado headless (rectángulo=4 esquinas, +stem=1 T; coma OK).

### iLDraw — `apps/ildraw/` · (SW ildraw-v16) · fork del canvas de SketchVolt
- **v16: Firebase/nube en iLDraw (pedido Ángel: menos apps solo-local en el móvil).** iLDraw ya heredaba el
  código cloud de SketchVolt (mismo proyecto `bitacorapp-3df06`, local-first). Cableado propio: colección
  **`usuarios/{uid}/ildraw/{id}`** (aislada de sketchvolt), flags **`ild_cloud_optin`/`ild_maillink`**, y
  **devuelto el botón de Cuenta** en el home (Google o Magic Link, opt-in). Local-first: localStorage
  `ildraw_flash` sigue siendo la fuente; la nube hace merge (nunca borra) y sube. Reglas Firestore ya cubren
  `usuarios/{uid}/{document=**}` (sin cambios de consola). Verificado headless: botón presente, `cloudCol`→ildraw,
  0 errores (el SDK no carga en sandbox por red, igual que SketchVolt; en el dominio sí).
- **v15 / SketchVolt v110: desplegables de menú más compactos (ambas apps).** Apretada la grilla de los menús
  del canvas SIN sumar columnas: row-gap 8→4, padding ítem 8→4, gap ítem 6→4, margin título 14/8→8/4, gap panel
  12→7, padding panel 16→12, env-row row-gap→4. Ahora entra todo el menú (los 3 grupos) sin scroll; legibilidad
  intacta (íconos 24 + texto 14).
- **v14: flecha "atrás" en el header (ambas apps) + fix null.** Devuelta la **flecha roja `‹`** al lado del
  nombre en el header (llama `goDash()` → vuelve al flash/dashboard), en iLDraw y SketchVolt (`sketchvolt-v109`).
  Fix: en iLDraw los listeners de "Eléctrica" llamaban `closeUnit()`/`toggleUnit()` que buscaban el `panel-unit`
  borrado → null en cada click; ahora están **blindados** (`if(!pu)return`).
- **v13 (pedido Ángel): tacho de vuelta + estándar de íconos legible.** El **tacho** vuelve al propbar al
  seleccionar cualquier objeto (borrar); la **X** queda solo para cancelar comandos en curso. **Estándar de
  tamaños unificado y legible** (no arbitrario): ítems de menú/entorno **24px** + label 14px; barras de acción
  (propbar/Press Long) **22px**; pestañas **18px** + texto 15px. Íconos y texto en armonía (antes 30px = "miope
  extremo"). (Aplica a iLDraw; SketchVolt mantiene su v107 — puedo espejar el estándar de íconos si Ángel quiere.)
- **iLDraw = canvas de SketchVolt sin Eléctrica ni dashboard (pedido Ángel).** Fork de `sketchvolt/index.html`:
  · Sacada la pestaña **Eléctrica** (`tab-unit` + `panel-unit`) y **SmartLine**; quedan Entorno/Dibujo/Arquitectura.
  · **Sin dashboard de proyectos** de SketchVolt. En su lugar un **flash estilo iLVolt**: input *Nombre del dibujo
    (opcional)* + **Crear** (sin nombre → "Dibujo N"), **Abrir archivo de respaldo**, y lista de dibujos (abrir /
    guardar archivo `.ildraw` / borrar). Cada dibujo = un proyecto de 1 hoja; se abre directo al canvas (sin pasar
    por dashboard). `goDash`/logo vuelven al flash. Persistencia local en `ildraw_flash`; respaldo por archivo
    JSON (`exportHoja`/`importArchivo`). Reusa el motor (`openPlanta`/`savePlanta`/`markDirty`).
  · Título/wordmark **iLDraw** (iL rojo + Draw plata). Verificado headless: crear→canvas→dibujar→autosave→volver
    →reabrir persiste; 3 pestañas; sin errores JS; sin overflow. Manifest/SW ya eran iLDraw (bump a v12).

### SketchVolt — `apps/sketchvolt/` · v1 (SW sketchvolt-v108) · app pro
- **Guías de cinta: borrado + z-order (v108, pedido Ángel):** las `guide_line` ahora rinden **arriba de todo**
  (`zLevelOf`=40). Se pueden **borrar línea por línea**: al seleccionar una guía, el propbar muestra el **tacho**
  (excepción a la regla "sin tacho" de v107, porque la cinta es herramienta de dibujo) — además del Press Long.
  El botón `paDel` cambia de ícono según contexto: **tacho** cuando es borrar (guía/quitar), **X** cuando es
  cancelar un comando en curso (`_paIcon`). Verificado headless: guía seleccionable con tacho, borrado OK,
  z=40, X en comando, 0 errores.
- **Propbar Aberturas grilla rígida + limpieza + ajustes menú (v107, pedido Ángel):**
  · **Familia Aberturas**: `#grpArch` pasa a **grilla rígida 5 cols × 2 filas con SLOTS FIJOS**.
    Fila 1: Ancho(m) · Muro(m) · Invertir X(⇆) · Invertir Y(⇅) · **Vínculo/Proporción (cadena, acento)**.
    Fila 2: Giro/Apertura(↻) · Ajuste/Marco(anclar) · Batiente · Corrediza · Plegable. Si un control no aplica,
    el slot queda **transparente** (`.off` = visibility:hidden) SIN recolocar a los hermanos (memoria muscular).
    Nueva prop `propLock` (chain) bloquea el aspecto al editar Ancho.
  · **Limpieza**: NINGÚN tacho suelto en el propbar. `showActions` de selección (1 y múltiple) ya no muestra
    borrar; el `paDel` durante comandos pasó a **X (Cancelar)**. **Eliminar = solo Press Long centrado**.
  · **Menús**: al aplicar un control de **Entorno** el menú **colapsa** (como el resto de pestañas), para liberar
    el lienzo. El **Puntero (3 modos)** vuelve al **header** (junto al cursor), fuera de Entorno.
- **4 menús idénticos (v106, pedido Ángel):** el panel **Dibujo** se pasó de la estructura vieja
  (`ph-col/ph-lbl/ph-g3/phb`, columnas fijas 72px) a la MISMA de Arquitectura/Eléctrica
  (`pu-scroll/pu-title/pu-grid/pu-item`): grilla que llena el ancho (3 cols, 5 en PC), mismos títulos y
  mismos ítems. Títulos de Entorno también a `.pu-title`. Los 4 menús renderizan igual. Verificado: 15 ítems
  en 3 grupos, selección de herramienta OK, 0 errores.
- **Paneles cristal tipo iOS (v105, pedido Ángel):** los 4 dropdowns pasan a **tarjeta flotante** despegada de
  los bordes (`top:106px;left/right:12px`), esquinas `border-radius:18px`, fondo `rgba(255,255,255,.82)` con
  **`backdrop-filter:blur(20px) saturate(180%)`** (glassmorphism real: se ve el dibujo desenfocado detrás),
  borde hairline claro + sombra `0 14px 44px`. Animación de apertura desde el header (`phDown`: translateY+scale,
  `transform-origin:top center`). Quitado el centrado ≥960px (chocaba con la tarjeta full-width; en PC ya hay
  5 columnas). Verificado headless: blur visible, 0 errores.
- **Paneles unificados + Press Long centrado (v104, pedido Ángel):** Panel **Entorno** = grupo **IMPORTAR**
  (Imagen aislada arriba, listo para DXF/PDF/IA) + grupo **ENTORNO DE DIBUJO** (Grilla/Puntero/Snap/Ortho/Polar
  en grilla 3-col, naked). **Frente/Fondo eliminados de Entorno** (y `#opFloat` removido del canvas). Panel
  **Dibujo** reorganizado en 3 categorías `.ph-lbl`+grid: **TRAZADO** (línea/smartline/arco/polilínea/muro/
  rect/círculo/polígono), **ANOTACIÓN Y RELLENO** (texto/cota/cota dir/cinta/relleno), **EDICIÓN** (goma/recortar).
  **Menú Press Long** ahora **fijo y 100% centrado** (`top/left:50% + translate(-50%,-50%)`), **fila única sin
  scroll**, con Frente/Fondo integrados (`ctxDo('front'/'back')`→zBringFront/zSendBack) y el **tacho = mismo SVG
  exacto del propbar**; resto de íconos homologados (.ci, stroke 1.2). Verificado headless: 7 botones sin
  desborde, Entorno 1+5, Dibujo 3 grupos, 0 errores.
- **Header afinado + PC (v103, pedido Ángel):** botones de Entorno **desnudos** (sin recuadro, ícono+texto,
  activo=rojo). Pestaña "Electricidad"→**"Eléctrica"**. Las **4 pestañas fijas al ancho** (`flex:1`), **sin
  scroll lateral** (`overflow:hidden`); en teléfono se ocultan los íconos de pestaña para que entren solo los
  textos, en PC se ven ícono+texto+hover. **Optimización PC:** el bloqueo de orientación ahora solo aplica a
  teléfono acostado (`landscape and max-height:560px`) → PC/tablet horizontal funcionan; `pu-grid` a 5
  columnas ≥700px; paneles centrados (max 920px) ≥960px; hovers en pestañas/ítems/botones. Verificado headless
  a 430px y 1280px: sin overflow, 0 errores.
- **HEADER DOBLE + pestañas ribbon (v102, rediseño de shell pedido por Ángel):** reemplaza la `.bar`, los 3
  FAB y `#topControls`/`#guide` por un header fijo de 2 niveles. Nivel 1: logo (→dashboard), deshacer/rehacer,
  guía de herramienta (texto, se cierra al tocar), y cursor/Seleccionar a la derecha. Nivel 2: 4 pestañas
  **Entorno · Dibujo · Arquitectura · Electricidad** que abren paneles dropdown (una a la vez; re-tocar cierra).
  `toggleRibbon()` maneja exclusión; `_mountEntorno()` MUEVE (sin duplicar IDs) grilla/puntero/snap/imagen +
  ortho/polar/frente/fondo al panel Entorno. Los paneles herr/arch/unit se reusan tal cual (solo reposicionados
  por CSS como dropdown, ganando por orden). `updateGuide/dismissGuide` apuntan al header (`#l1-guide/#l1-normal`);
  `#guide` viejo eliminado (evita IDs duplicados). Listeners click-away ahora ignoran `#top-header`. Verificado
  headless: header + 4 tabs, Entorno con 8 controles, guía muestra la herramienta, 0 errores JS.
- **Táctil CAD PRO — lógica de Ángel (v101, reemplaza `_chainAim` de v100):** en encadenado (mline/pline/
  línea, modo Directo) el 1er punto arranca en `handleDown` (`_justStartedChain`) y los siguientes se fijan
  al SOLTAR un **tap limpio** (`isTap` = arrastre <15px, comparando `scrn` vs `_dragStartS`). **Arrastrar solo
  orienta** (no clava punto). `handleDown` ya no clava en encadenado activo. Borrada la línea vieja de commit
  de `tool==='line'` en `handleUp` (rect promovido de `else if`→`if`). Delay 120→150ms, umbral 10→15px.
  Cierre por doble-tap solo si el 2º toque cae <26px del 1º. Verificado headless: tap A/B/C=1/2/3, arrastre
  no suma, doble-tap cierra, pinch 2 dedos sin vértice fantasma.
- **Táctil CAD "apuntar-y-soltar" en encadenado (v100, Ángel: cursor pegado + delay 2 dedos):** mline/pline/
  línea en modo Directo ya NO colocan el vértice al tocar a ciegas: se APUNTA con el dedo (rubber-band + snap
  en vivo) y el vértice se fija al SOLTAR → precisión y el cursor sigue el dedo (no queda pegado al punto
  anterior). Delay de toque 70→120ms. Un 2º dedo hace pinch SIN dejar vértice suelto (`_chainAim=false`).
  Doble-tap para cerrar ahora exige que el 2º toque caiga casi en el mismo punto (<26px): toques rápidos en
  lugares distintos = vértices distintos, no cierra por error. Verificado con toques sintéticos headless.
- **BUG rosa eliminado (v99, Ángel: "son horror rosas"):** la GRILLA del lienzo usaba `rgba(139,0,0,op)`
  = rojo oscuro a baja opacidad → se veía ROSA (lo prohibido por regla). Pasada a gris neutro
  `rgba(0,0,0,0.07)` (finas) y `rgba(0,0,0,0.10/0.18)` (metros). El fondo rosado teñía las aberturas.
  El eje 0,0 (X/Y) sigue en rojo a propósito.
- **Puertas rehechas en líneas finas (v98, pedido Ángel: "nada de jambas negras ni bloques"):** con su
  lámina de símbolos de referencia. Batiente = hoja perpendicular + arco de giro fino sólido. Corrediza =
  riel en el eje + hoja corrida como rectángulo fino (se eliminaron los 2 bloques gruesos). Plegable/acordeón
  = zigzag fino de paneles. SIN jambas negras (solo la interrupción fina del muro).
- **Librería curada y modernizada (v97, pedido Ángel: "cuadrados, modernos, estilizados, sin adorno"):**
  reescribí TODO el mobiliario/artefactos con estilo plano moderno (rects redondeados `RR`, poco detalle).
  Nuevas variantes agregadas: **Inodoro 2** (taza en D), **Bacha 1** (rect redond.) y **Bacha 2** (óvalo),
  **Heladera grande** (con freezer) y **Heladera chica**, **Sofá 2** y **Sofá 3** cuerpos, **Cama King**,
  **Silla 1/2/3** (cuadrada / redondeada / con brazos). Inodoro ya NO redondo (semicuadrado). Sofás/sillón
  con apoyabrazos y cojines redondeados; camas con almohadas+acolchado; mesas con sillas redondeadas;
  campana=trapecio; ducha=cuadro+X+desagüe central. Todo con relleno blanco no destructivo. 35 bloques,
  verificados sin error de dibujo (smoke test headless). Menú `#panel-arch` e íconos actualizados.
- **(histórico) Baños rehechos con referencia CAD (v96, pedido Ángel):** el inodoro y demás quedaban feos. Rehechos:
  **inodoro** = mochila (tanque) + taza en forma de HUEVO (bézier) + aro interior; **bidet** = huevo + grifería;
  **bacha/lavatorio** = mesada + bacha ovalada + interior + grifería; **ducha** = cuadro + marco + líneas que
  convergen al **desagüe en la esquina** (estilo plano CAD). Todo con relleno blanco no destructivo.
- **Librería de arquitectura mejorada (v95, dibujos de Ángel adaptados):** integré los símbolos detallados
  que pasó Ángel, **adaptados** de su modelo (`(ctx,obj)`, metros, origen arriba-izq) al motor de SketchVolt
  (centrado→arriba-izq vía `translate(-W/2,-H/2)`, metros→px). Mejorados: inodoro (mochila+taza+hueco),
  bidet, bacha, ducha (marco+cruz+desagüe), cocina (4 hornallas), heladera, sofá (3 cuerpos)/sillón (1),
  cama 1/2 plazas (almohadas+acolchado), pileta doble/simple (con escurridor), mesa 4/6 con sillas alrededor.
  Nuevos: **Bañera** y **Mesa 6** (en `ARCH_DEF` + menú). Todo con enmascarado blanco no destructivo. 0 errores.
- **SmartPen hace splines suaves (v94, pedido Ángel):** la curva sinuosa ya no se convierte en polilínea
  recta sino en **`spline` Catmull-Rom** (líneas sinuosas tipo CAD). El trazo libre se limpia con RDP →
  puntos de control, y `_catmull`/`splinePoly` los interpola en curva suave (14 muestras/tramo). Nuevo tipo
  `spline` integrado en drawObj, getSegs (hit/goma), export DXF (poly muestreado), conteo de metros y
  zLevel 30. Trazo recto sigue → línea; cerrado → rect/círculo. Verificado: onda sinuosa → curva fluida.
- **Cotas: snap fuerte a cualquier vértice (v93, pedido Ángel):** `snapToObject` reescrito con **prioridad
  absoluta al vértice** (extremos/centros) sobre puntos medios, y radio grande para cotas (58px vs 30). En
  `getW` el THRESH de `dim`/`dim2` sube a 52px. Verificado: pick a ~42px del vértice engancha exacto; entre
  vértice y medio cercanos gana el vértice.
- **FABs subidos medio fab (v92):** `top: calc(14% - 28px)` en los 3.
- **Barra de propiedades: nombres de texto debajo + centrado parejo (v91, pedido Ángel):**
  · Las etiquetas de propiedad pasan de **ícono a TEXTO** y van **DEBAJO** del control (`.fi>.fl{order:2}`).
    Conversión ícono→texto 100% por CSS (sin tocar HTML): `.fi>.fl[title] svg{display:none}` +
    `.fi>.fl[title]::after{content:attr(title)}` (Giro, Tamaño (cm), Altura (cm), Grosor, Tipo de línea,
    Patrón, Opacidad, Escala…). Texto gris uniforme 12px, no negrita, no mayúsculas.
  · **Centrado parejo**: la regla de reparto ahora incluye spans (`#propbar>[id^="grp"]`, antes solo `div`),
    así `grpTool` (grosor) deja de irse al borde izquierdo y los controles se reparten `space-evenly`.
  · ⚠ Nota: un `perl` con regex destruyó el archivo (264KB→23KB); se restauró de git y se rehízo todo con
    CSS/Edits seguros. No volver a usar perl slurp sobre este index.
- **Lógica de barra por familia + fix multi-selección (v90, pedido Ángel):**
  · **Fix crítico**: en multi-selección (2+ objetos) NO aparecían Borrar ni Agrupar → `syncMeasureUI`
    ocultaba la fila con `else if(!selO)` (selO solo existe para 1 objeto medible). Corregido a
    `else if(selIds.length===0)`: con cualquier selección la fila queda y `showSelBar` maneja agrupar/tacho/✓.
  · **Misma lógica para toda herramienta de un FAB** (`_isFabTool`, `_CAD_TOOLS`): la fila de acción aparece
    siempre con **Borrar** (`_cancelDrawTool`: cancela lo en curso o sale de la herramienta); **✓ solo si hay
    algo que aceptar**; **Medida solo si aplica**. El branch `dragging` también muestra Borrar (antes lo ocultaba).
  · Verificado: multi-selección → agrupar + tacho + ✓ visibles.
- **Delay del toque para zoom/pan a 2 dedos (v89, pedido Ángel):** en `onTS` el `handleDown` se DIFIERE
  `TAP_DELAY=70ms` (el snap se ve al instante con un `render()`). Si entra un 2º dedo en ese lapso → `_clearTap`
  cancela el trazo y pasa a pinch/pan (ya no dibuja por toque casi-simultáneo). `onTM` dispara el trazo
  antes si se mueve >10px (arrastre); `onTE` coloca el punto si fue tap limpio. El encadenado de muro/línea
  ya NO se descarta al hacer pinch. Verificado: 2 dedos casi-simultáneos → 0 puntos, pinching.
  · PENDIENTE: §2 lógica de la barra de propiedades por FAMILIA (Dibujo/Símbolos/Arquitectura), misma zona
    de aceptar/borrar para todo el grupo.
- **Uniformidad visual de los 3 FABs (v88, pedido Ángel):** `.phb` (Dibujo) y `.pu-item` (Símbolos/
  Arquitectura) ahora idénticos: ícono 30px stroke 1.2, nombre 14px gris `#8e8e93` fino, gap 6px, padding
  8px, grillas gap 8px, títulos de sección (`.ph-lbl`/`.pu-title`) gris 14px 500 (no negrita). Nada grande
  ni muy separado; misma gráfica en todo.
  · PENDIENTE (pedido explícito): §2 lógica de la barra de propiedades por FAMILIA (Dibujo/Símbolos/
    Arquitectura) con misma zona de aceptar/borrar para todo el grupo; §3 delay en el tap para permitir
    zoom/pan a 2 dedos sin dibujar por toque casi-simultáneo.
- **Legibilidad + nombres de herramientas (v87, pedido Ángel, doc §1):** paneles FAB **naked** (sin cajas):
  `.pu-item` transparente, `.pu-title` gris `#8e8e93` fino 14px (no rojo/negrita), nombres de ítem 16px
  que envuelven a 2 líneas (no truncan). **Nombres bajo cada herramienta** (`.phb span`, gris) para que los
  chicos las reconozcan en clase. Etiquetas de la barra (`.pl`/`.fl`) a gris fino 11px (no negrita) + más
  aire (`.fi` gap 4px, barra row-gap 12px) → sin solapamiento. FABs unificados (íconos 28-32px, `top:14%`).
- **Precisión: rótulo no pisa la barra + medida exacta en eje (v86, pedido Ángel):**
  · **Fix texto sobrepuesto**: `#pbTool` usaba `var(--prop)` (1 fila) pero la barra tiene 2 → un
    **ResizeObserver** sobre `#propbar` reubica el rótulo por encima del alto real cada vez que cambia.
  · **Medida EXACTA sobre el eje**: `commitMeasure` ahora fuerza la dirección a Ortho (H/V) o Polar al tipear
    la medida, así la línea va exacta al eje aunque el último toque haya quedado torcido (antes usaba la
    dirección cruda de `dragCurW` → rompía la medida). Verificado: toque (200,40)+Ortho+3m → punto (300,0).
  · Para el flujo "apuntar → soltar → confirmar" exacto está el modo **Cursor Anclado** (botón de puntero).
- **Puerta interrumpe el muro (v85, pedido Ángel):** el parche blanco de la PUERTA ahora es más alto
  (`mH = H + max(4px, H*0.5)`) para tapar también el grosor de línea de las dos caras del muro → hueco
  limpio, sin las 2 líneas finas asomando. La VENTANA queda al ras (redibuja el rectángulo del muro = 2
  líneas siguen). `snapArchToMl` ya iguala `l` al `sepM` del muro.
- **Z-order + masking + SmartPen al eléctrico (v84, doc maestro §3/§5):**
  · **`zLevelOf(o)`**: default por categoría — 0 base, 10 mline, 20 arch/mobiliario, 30 block/eléctrica/pen;
    `obj.zLevel` lo pisa a mano. `render()` dibuja por zLevel (estable por id); los muros van en batch al
    llegar al nivel ≥10 (juntas limpias); lo de nivel superior los tapa por relleno **sin cortar la mline**.
  · **Flechas Frente/Fondo** en el head (al lado de Ortho/Polar): `zBringFront`/`zSendBack` suben/bajan el
    `zLevel` del objeto seleccionado (max+1 / min-1).
  · **Enmascarado no destructivo**: relleno blanco detrás de mobiliario (`drawArchObj`) y símbolos
    eléctricos (case block) → tapan piso/muro sin destruirlos. Verificado visual.
  · **SmartPen reubicado**: sale del FAB de Dibujo, entra al FAB Eléctrico (sección "Cañería").
  · Pendiente del doc maestro: §1 afinar grosor íconos 1.1-1.2 y unificar tamaños FAB vs barras; §2
    consolidar grupos en 3 familias; §4 debounce 65ms multitouch; §6 anidación infinita de grupos.
- **Aceptación uniforme + tips cerrables + SmartPen libre (v83, pedido Ángel):**
  · **✓/Enter aceptan en la Cinta**: el ✓ de la guía crea con el número escrito O con la distancia
    arrastrada (antes usaba `commitMeasure` y sin número no hacía nada). Todos los comandos aceptan igual
    por ✓ y por Enter (`_enterAccept`).
  · **Doble-tap exacto**: al finalizar multipunto, si el último punto quedó <18px del anterior (el 1er toque
    del doble-tap), se descarta → ya no "mueve las cosas".
  · **Tips cerrables**: tap en los textos del `#guide` → `dismissGuide()` lo oculta (flag `_guideDismissed`,
    se resetea al cambiar de herramienta).
  · **SmartPen libre**: excluido del modo Anclado (`ptrMode===1 && tool!=='pen'` en onTS/onTE) → dibuja
    arrastrando como lápiz libre en cualquier modo; 1er punto snap, convierte al soltar.
- **Undo en comando + Enter=aceptar (v82, pedido Ángel):**
  · Botón **"un paso atrás" (`#paUndo` → `stepBack()`) al lado del ✓** en la fila de acciones. Retrocede
    DENTRO del comando (borra el último punto/fase de línea/muro/polilínea/arco/cota/hatch/cinta) SIN salir;
    si no hay comando en curso → `undo()` global. Resuelve que el undo del head queda tapado por el panel guía.
  · La fila de acciones ahora aparece también en **arco y cota** (antes solo medida/multipunto), con undo + ✓.
    El undo se oculta en selección pura; la fila se oculta al quedar sin comando ni selección.
  · **Enter = aceptar**: `_enterAccept` — con medida escrita la aplica; **sin medida, finaliza el comando**
    igual que el ✓ (antes Enter vacío no hacía nada).
- **SmartPen rehecho (v81, pedido Ángel):** el trazo se **pegaba a todo** tras el 1er punto y perdía la
  forma. Ahora: en `getW`, si `tool==='pen'&&drawing&&penPts.length>0` → devuelve `raw` y `snapHit=null`
  (LIBRE, sin snap). Solo el 1er punto se engancha (`nearNode` en handleDown). Al **soltar se convierte**:
  `recognizeStroke` (recta→`line`, cerrado→rect/círculo); curva abierta → `_simplifyRDP` (Douglas-Peucker)
  → `pline` suave. Ya NO auto-snapea el final. Testeado: recta→line, semicírculo→pline (33→9 pts).
- **Nube opt-in (v80):** SketchVolt no toma sola la sesión compartida con la bitácora; la nube se activa
  solo con login explícito (`sv_cloud_optin`). `logout` lo limpia.
- **Auth + Nube (v79, Firebase — reusa proyecto de Bitácora `bitacorapp-3df06`):**
  · SDK 9.23 compat en el head (si no cargan, la app sigue 100% local). `firebaseConfig` embebido.
  · **Login**: Google (popup) + **Magic Link** (enlace por correo, sin contraseña). Botón de cuenta en el
    home (arriba der.). `menuCuenta`: Aceptar=Google, Cancelar=Magic Link.
  · **Datos**: `usuarios/{uid}/sketchvolt/{id}` con campo `user_id`. Aislado de la bitácora.
  · **Local-first**: localStorage = fuente; al entrar `cloudPull` hace `mergeProy` (unión por id, gana `mod`
    más nuevo, **nunca borra** trabajo) y `cloudPushNow` sube lo faltante (debounce 2.5s). Offline OK.
  · **Reglas** `firestore.rules`: `usuarios/{uid}/**` solo el dueño (request.auth.uid==uid) → el "403" del spec.
    Falta en consola: activar Magic Link + publicar reglas (ver `FIREBASE-SETUP.md`).
  · Testeado headless: merge no pierde proyectos (local-only conservado, cloud-only bajado, mod mayor gana).
- **Estabilidad para 299 usuarios (v78):** todo cliente, sin backend.
  · **Auto-guardado**: `_safeSave` en `beforeunload` + `pagehide` + `visibilitychange`(hidden) + intervalo
    de 60s. En móvil `beforeunload` no siempre dispara → por eso los tres eventos. Recuperación tras crash =
    localStorage siempre al día (al reabrir carga el último estado).
  · **Undo/Redo tope 20** (`HIST_MAX`, antes 40) → evita fugas de memoria en gama baja.
  · **Anti-spam**: guard en `handleDown` descarta disparos <55ms (no duplica geometría); throttle 140ms en
    deshacer/rehacer (deep-clone caro).
  · **Auth/backend (Firebase/Supabase + JWT + user_id + 403): PENDIENTE** — requiere backend real, credenciales
    del proveedor y saca datos de menores a la nube (decisión de Ángel). Ver nota abajo.
- **Cinta métrica + líneas guía (v77, estilo SketchUp):** herramienta `tape` (botón huincha en el panel).
  · **Modo Medir**: pick en vacío/vértice → pick B; la distancia aparece VIVA en el input Medida (m);
    al confirmar muestra un flash con la medida y NO deja geometría.
  · **Modo Guía**: pick SOBRE un segmento (línea/muro/borde) → arrastrás al lado y escribís la distancia
    (m) + Enter → crea una **línea guía infinita** paralela exacta (o pick directo = distancia perpendicular).
  · **`guide_line`**: fina, dash largo, celeste `#007aff`. **Seleccionable** (Select) y **borrable** una a una
    (Goma borra la guía entera). Snap normal la reconoce (near + intersecciones). **No imprimible**: excluida
    de export PNG/PDF/DXF, del conteo de materiales y del encuadre (`contentBounds`).
  · Helpers: `segUnderPt`, `perpOf`, `createGuide`, `resetTape`. Estados `tapePh`/`tapeMode`/`tapeRef`.
- **Fix Ortho (v76):** el snap a GRILLA seteaba `snapHit` en cada movimiento y (por la regla "snap domina
  Ortho/Polar") anulaba Ortho → el cursor iba libre (parecía Polar). Ahora solo el snap a OBJETOS domina
  (`snapHit.kind!=='grid'`); Ortho vuelve a bloquear estricto a 90° (H/V).
- **Modos de puntero + cursor anclado (v75, PENDIENTE-MOTOR-CAD §1):** botón en el head (`#ptrBtn`,
  `cyclePtrMode`) que cicla 3 modos:
  · **0 Directo**: sin offset, toca = punto (getS oy=0). Ideal paneo/selección.
  · **1 Anclado (precisión móvil)**: arrastrás → cruz con offset Y; **soltás y ANCLA** (queda fija);
    el próximo **tap en cualquier lado CONFIRMA** el pick en la coord anclada (no en la del tap).
    Doble confirmación = terminar (handleDbl). Lógica en `onTS`/`onTE` con `anchorArmed`/`anchorPt`/`_wasConfirm`.
  · **2 Ratón/cruz viva (default)**: comportamiento actual (offset + fija al soltar). Sin regresión.
  Testeado headless: el punto se coloca en la coord anclada, no en la del tap de confirmación.
- **Herramientas críticas restauradas a flujo CAD (v74, PENDIENTE-MOTOR-CAD §3):**
  · **Arco de 3 puntos**: Inicio → Fin (cuerda punteada) → mover para curvar (curva viva por el 3er punto) →
    soltar/pick fija. Estados `arcPh`/`arcBulge` (el 2º tap no auto-confirma). Ya no es arrastre.
  · **Cota (dim) CAD**: pick A → pick B → **arrastrar** para separar la línea de cota (offset perpendicular
    VARIABLE que sigue al cursor) → soltar fija. `dimAdjust` evita auto-confirmar.
  · **SmartPen (cañería)**: inicio con **snap fuerte** a boca/caja (`nearNode`), **medio libre** (raw, sin
    snap, curva orgánica → metros reales), **fin auto-snap** a boca cercana. Ya NO endereza (sin recognizeStroke).
- **Motor CAD: dibujo continuo + snap ampliado (v73, pedido Ángel, Sección 3):**
  · **Línea CONTINUA (estilo AutoCAD)**: la herramienta `line` pasó de arrastre a **multipunto encadenado**
    (mismo camino que Muro/Polilínea). Tocás cada punto (o medida m + Enter) y la línea encadena; el punto
    nuevo es el inicio del siguiente tramo. Termina con **doble toque** o **✓**; sale con **Escape**. Cada
    tramo se guarda como objeto `line` editable. `line` salió de `_DRAG_TOOLS`.
  · **Snap ampliado**: además de Extremo/Medio/Centro/Cuad/Cercano, ahora reconoce **Intersección**
    (`_segInt`, cruce matemático de 2 segmentos, solo entre segmentos cerca del cursor = barato).
  · **Object Snap DOMINA Ortho/Polar**: `constrainOP` no aplica restricción si hay `snapHit` activo
    (garantiza cierres y enganches a vértices/cruces).
- **Barra inferior en 2 filas + fila de acción en 3 zonas (v72, pedido Ángel):**
  · **2 filos reales**: `#propbar>#propActions` (más específico que `#propbar>div`) fuerza `flex:1 1 100%`
    → la fila de acción SIEMPRE cae en su propio piso aunque las propiedades sean angostas (ej. Línea).
    Antes se amontonaba todo en una línea.
  · **Fila de acción = grid 3 zonas fijas** (`grid-row:1` en las 3, así no se van a un 3er renglón):
    **Medida (izq) · Aceptar ✓ (centro) · Tacho borrar (der, aislado)**. El tacho es BORRAR objeto.
  · **Medida**: rótulo "Medida" gris al lado del recuadro; recuadro con **borde gris** (no rojo), placeholder "m".
  · **Título flotante** de herramienta se calcula en `requestAnimationFrame` → lee el alto real de 2 filas
    y flota despegado, sin pisar la fila 1.
  · **EJE del muro reordenado**: **Ext · Centro · Int** (exterior izq, centro al medio, interior der).
- **Orientación de aberturas por flips estrictos (v71, pedido Ángel):** prohibido el ícono de
  rotación/refresh. Se reemplazó por dos íconos de flechas rectas paralelas opuestas:
  **Invertir horizontal ⇆** (`updateArch('flip')` → `o.flip`, `scale(-1,1)`) e **Invertir vertical ⇅**
  (`updateArch('flipV')` → `o.flipV`, `scale(1,-1)` en `drawArchObj`). Tipo (batiente/corrediza/plegable)
  siguen como íconos minimalistas; medidas por inputs.
- **Íconos sueltos "naked" (v70, pedido Ángel):** CERO botones clásicos. El activo resalta SOLO con
  color de trazo rojo, sin marco. Se quitó el `box-shadow: inset` (marco rojo) de `.pib.on`, `.tb.on`,
  `.phb.on` y del anclaje (`#btnAnchor`). El botón Escape (`.gesc`) ahora es flecha roja suelta
  (`background:none;border:none`), sin caja. Únicos con contenedor: FAB y selector de color.
- **Refinamiento UI Sección 1 (v69, pedido Ángel):**
  · **Barra de propiedades a lo ancho**: grupos `flex:1 1 auto` + `justify-content:space-evenly`
    reparten los controles en TODO el ancho (no amontonados al centro). Muro y abertura verificados.
  · **Abertura sin barra alta**: al seleccionar una abertura se muestra SOLO `grpArch` (medidas, girar,
    espejar, anclar, tipo) — ya no co-aparece `grpSel` (color/componente) → barra de 174px (antes 228).
    `#propbar` con `align-content:center` para filas compactas.
  · **Texto flotante de herramienta** despegado de la barra (`bottom = alto barra + 18px`), sin superponer.
  · **Guía blanca**: fondo blanco puro, texto gris, palabras clave en negro, **cero rojo**; botón Escape
    (`.gesc`) en **rojo acento** (borde+ícono) para que sea obvio.
  · **Íconos Ortho/Polar rediseñados**: Ortho = "L" a 90° con cuadradito delineado en la esquina interior;
    Polar = círculo con dos líneas desde el centro (0° horizontal + 45° diagonal). Rojo cuando activo.
  · Íconos estandarizados (`.pib` 44px botón / 24px svg, `.ok` 26px).
- **Paquete UI/geometría/librería (v66-v67, pedido Ángel):**
  · **Escape siempre visible**: botón Salir (`.gesc`) en la barra de tips `#guide`, ahora **gris**
    (bg `#f2f2f7`, textos grises, comandos en negro, **sin rojo**). FABs planos grises, rojos solo `.on`.
  · **Snap fuerte** (`getW`): imán prioritario (46px) a los puntos de la acción en curso — cerrar
    figura (1er punto) / continuar (último); radio general de dibujo subido a 30px.
  · **Muro**: `mlineOffsetPts(pts,off,closed)` con **inglete en TODAS las esquinas** (wrap-around) para
    bucle cerrado → las dos caras cierran perfecto (el **eje manda**). `_mlStroke` con **relleno en
    anillo** (`evenodd`, la habitación queda libre) que **oculta lo que cruza por debajo**. **Doble tap
    cierra** enganchando al 1er punto (sin tramos sueltos). *Pendiente*: limpieza de cruce muro-muro.
  · **Aberturas**: variante **plegable** (+ botón), **Anclar a muro** (`updateArch('anchor')`), edición
    por íconos (rotar/espejo/anclar/tipo) + inputs de medida en `#grpArch`.
  · **Librería completa** (`ARCH_DEF` con `kind/variant/nom`, `archDef()`): Aberturas (puerta/corrediza/
    plegable/puerta-ventana/ventana), Baños (inodoro/bidet/bacha/ducha), Cocina-Lavadero (cocina/anafe/
    bacha simple/pileta doble/heladera/lavarropas/calefón/microondas/campana), Mobiliario (sofá/sillón/
    cama 1-2 pl/mesa/silla), Extras (auto, corte con `obj.txt` — *texto editable pendiente*). Panel
    reorganizado; íconos con el mismo motor (`mkArchCanvas`).
- **iLDraft — cruce muro-muro + corte editable (v68):** los muros se dibujan en un **pase batcheado**
  `drawWalls()` — relleno blanco de todos los cuerpos + bordes de cada muro **recortando el interior de
  los otros** (clip evenodd) → las juntas muro-muro (T/X/L) se **abren limpias**, las líneas siguen sin
  quedar montadas. **Corte**: `obj.txt` editable desde `#archTxt` en la barra (`updateArch('txt')`),
  se dibuja en ambos círculos del símbolo de sección.
- **iLDraft en SketchVolt — Módulo 1: Muro/multilínea (v61):** herramienta `mline` (botón en panel de
  dibujo). Doble línea paralela al eje con **ancho en metros** (10/15/20/30 cm, `mlSepM`) y
  **justificación** Centro/Int/Ext (`mlJust`); tapas en los extremos. Multipunto como pline (toca
  esquinas, doble toque cierra), compatible con Ortho/Polar y su línea guía. Objeto `type:'mline'`
  (`pts`,`sepM`,`just`); render `drawMlineObj`/`_mlStroke` con offset mitrado `mlineOffsetPts`; UI
  `#grpMline` (ancho+eje) en el propbar; guía propia.
- **iLDraft en SketchVolt — Módulo 2: Librería de bloques + anclaje + enmascarado (v62):** 3er FAB
  `#btn-arch` + `#panel-arch` con categorías (Aberturas, Cocina, Baños, Mobiliario) y 14 bloques
  (`ARCH_DEF`); íconos del panel dibujados con el **mismo motor** (`mkArchCanvas`→`drawArchObj`).
  Objeto `type:'arch'` (kind, w,l en m, rotation, flip, variant, anchored). **Anclaje magnético**
  (`snapArchToMl`): puerta/ventana rota al ángulo del muro más cercano, se pega al eje y **hereda su
  ancho** (l = sepM). **Enmascarado**: parche blanco que oculta las líneas del muro + **mochetas**
  oscuras a los lados (corte real). Capa de render arch sobre el muro.
- **iLDraft en SketchVolt — Módulo 3: Cota dinámica por teclado (v63):** con `mline`/`pline` activos y
  ≥1 punto, escribir la distancia (m) + **Enter** fija el próximo punto a esa distancia en el ángulo
  actual del cursor. Input flotante `#dimTip` junto al cursor (se posiciona en `showDimTip()`, llamado
  en `render()`); `commitDimInput()` proyecta `último_punto + dir(cursor)·(val·PPM)`; `dimTipKey` (Enter/
  Esc) + listener global de teclado (dígitos enfocan el input). 1 unidad = 1 m (PPM=100). **iLDraft
  integrado: 3/3 módulos** (muro, librería+anclaje+enmascarado, cota por teclado).
- **iLDraft — refinamiento UI + edición de aberturas (v64, pedido Ángel):** coordenada + Ortho/Polar
  reagrupados en `#topControls` (fila, íconos con rótulo al lado). La **cota por teclado** pasó del
  tooltip flotante a un input **MEDIDA (M)** en el propbar (`#grpMeasure`, `updateMeasureUI`/
  `commitMeasure`/`measureKey`); soporta también línea/círculo (via `handleUp`). **Guía** más suave
  (fondo `#fcfcfc`, nombre negro peso 500, texto gris, sin negrita pesada). **FABs planos y grises**
  (`#btn-herr/#btn-elec/#btn-arch` fondo `#f2f2f7`, ícono negro); se ponen **rojos solo con su panel
  abierto** (`.on` en los toggles). **Edición de aberturas** al seleccionar (`#grpArch`+`updateArch`):
  Ancho, ancho de Muro, Rotar 90°, Espejo, y **Batiente/Corrediza** (re-ancla y re-corta el muro).
- **iLDraft — dibujo por medida (estado pendiente) + editar medidas en selección + una sola acción
  (v65, pedido Ángel):** al soltar un trazo (line/rect/circle/poly/sline/dim2) queda **PENDIENTE**
  (`drawPending`, no se crea aún); se fija escribiendo la **Medida (m) + ✓** (o Enter). El input de
  medida y el ✓/tacho viven en **una sola fila de acción abajo** (`#propActions`: medida a la izquierda,
  un único ✓) — se quitaron los botones de la barra guía (era la doble aprobación). **Seleccionando** un
  elemento de dibujo se **edita su medida** (línea=largo, círculo/polígono=radio, rect=diagonal;
  `_objMeasure`/`_setObjMeasure`); los **bloques** se escalan, no por medida. `commitPendingDraw`/
  `cancelPendingDraw`, `syncMeasureUI` (fuente única); pending se confirma al tocar/cambiar de
  herramienta. **Aberturas**: botón **Anclar a muro** (`updateArch('anchor')`).
- **Guía discreta + línea guía infinita de Polar (v60):** el panel guía se hizo **discreto** (texto gris
  fino peso 300, **sin negritas**, comandos apenas más oscuros por tono — no rojo; solo el nombre de la
  herramienta en rojo chico), para que no sea protagonista. **Polar/Ortho dibujan una línea guía
  "infinita"** (`drawTrackLine`): cruza el lienzo desde el ancla en la dirección del ángulo fijado
  (roja punteada, alpha .45), en `line`/`sline`/`dim2`/`pline`.
- **Ortho/Polar flotantes + head = panel guía (v59):** los toggles Ortho/Polar salieron
  del head y ahora **flotan junto a la coordenada** (`#opFloat`, íconos negros con rótulo, **rojos al
  activarse**). El **head se cubre por un panel de instrucciones** (`#guide`) cuando hay una herramienta
  activa: muestra en texto el nombre de la herramienta y los **pasos** (fondo blanco, texto negro,
  **comandos en rojo** `<b>`), con botones Deshacer y Salir. Mapa `GUIA` por herramienta + `updateGuide()`
  llamado en `ST()`. En `select` el panel se oculta y vuelve el head normal.
- **Ortho y Polar (v58):** dos toggles en la barra superior (junto a Snap/Grilla),
  excluyentes. **Ortho** fuerza el punto vivo a horizontal/vertical respecto al ancla; **Polar** lo
  snappea a múltiplos de `polarStep` (15°). Función `constrainOP(wp)` aplicada tras el snap en los
  handlers de mouse y touch (down/move/up) para `line`, `sline`, `dim2` y `pline` (ancla = último
  punto). Botones `#orthoBtn`/`#polarBtn` con estado activo en rojo (`.on`).
- **Más símbolos residenciales ajustados a UNIT 24:2019 + leyenda/bloque de referencias rehecho (v57):**
  campanilla (63)=círculo sobre cuadrado; sensor de movimiento (79)=círculo con "SM"; aplique/brazo
  (72)=⊗ con soporte ⊢ a la izquierda; luminaria de techo (73)=rectángulo con X; luz de emergencia
  (77)=rectángulo con flecha. **Bloque de referencias** (`REF_VIVIENDA`/`traerReferencias`) rehecho:
  21 símbolos con **nombres UNIT** y en tinta (la caja usa `renderSimbologiaUNIT`, así refleja los
  símbolos corregidos). Nota: el **DWG** que pasó Ángel no abre en el entorno (sin conversor DWG); se
  usa el **PDF de la norma** como fuente (mismos símbolos). Pendiente: símbolos unifilares de potencia
  (seccionador, termomagnético, diferencial, contactor, guardamotor, relé, fusible) y MT.
- **Panel = símbolo real + banderola a 90° (pedido Ángel, norma UNIT):** los íconos del panel FAB y
  el ícono del FAB ahora se **dibujan con la misma función del canvas** (`renderSimbologiaUNIT` vía
  `drawSymbolInto`/`mkSymCanvas`/`renderPanelIcons`), así el ícono ES la representación (antes eran SVG
  a mano que diferían). La **banderola de la llave sale a 90°** de la palanca (perpendicular), igual que
  el tick de bipolar. `ctx` pasó a `let` para poder redirigir el dibujo a un canvas temporal.
- **Simbología ajustada a la NORMA UNIT 24:2019 (PDF oficial que dio Ángel), Tabla 2 planos de planta:**
  *Llave de corte* (139) = círculo abajo-izq + palanca que sube a la derecha a un vértice + **banderola
  corta que baja a la derecha (∧)**; *bipolar* (141) = + tick en la palanca; *conmutador extremo* (143)
  = tick en la base del círculo; *conmutador intermedio* (144) = **X dentro del círculo**; *dimmer* (145)
  = **flecha rellena** en la punta. *Toma monofásica "tres en línea"* (164) = domo + vástago corto +
  base; *Schuko* (169) = **domo con la mitad derecha rellena**; *en caja de piso* (166) = domo dentro de
  cuadro. *Tablero* (130) = rectángulo con moño lleno (todo el ancho). Canvas + íconos del panel a juego.
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
