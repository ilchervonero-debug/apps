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
  rect, círculo, polígono, texto, cotas, hatch; goma/trim).
- **iLStyle:** `--accent #FE0000`, íconos stroke 1.1; **FAB cuadrado** (esquinas
  redondeadas); íconos de herramienta **negros → rojos + borde rojo al activarse**;
  sin botones grises.
- **Export explícito** DXF / PNG / PDF, siempre **limpio sin grilla**.

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
