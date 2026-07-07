# iLFrame — Visión y flujo de trabajo (histórico)

> **Desactualizado.** La fuente de verdad vigente es `ARQUITECTURA.md`. Esto
> queda como bitácora de una etapa anterior (previa a Core/Componentes por
> proyecto, cómputo consolidado y el resto de los elementos ya construidos).

> Documento para no perder de vista el funcionamiento deseado.
> Magnitudes siempre reales (mm). Objetivo final: una sola app de dibujo
> (motor compartido con iLDraw) + contabilidad de placas/soleras/montantes.

## 0. Motor de dibujo — fusión limpia iLDraw + iLFrame (principio rector)

El canvas NO se sigue parchando: se rehace en limpio como un **mash-up** que
toma lo mejor de iLDraw y lo combina con las necesidades de iLFrame.

**De iLDraw se trae (cómo funciona + mejoras):**
- Un **solo lienzo en Canvas 2D** y **coordenadas de mundo continuas** con una
  única transformación `vpX/vpY/vpZ` (paneo/zoom). Render por frame
  (clear → grilla → objetos → preview): fluido.
- **Gestos:** 1 dedo dibuja, 2 dedos = pan + pinch, rueda = zoom.
- **Snap fuerte:** extremos + puntos medios + intersecciones + centro + grilla,
  con marcador visual y umbral en px reales (`/vpZ`).
- **Modelo de objetos uniforme** `{type, pts[], ...}` con `hitTest`, `getSegs`,
  historial por snapshots, mover/copiar/borrar/trim/rotar/escala, polilínea
  continua, texto y **cotas (acotado)**.

**De iLFrame se conserva (necesidades propias):**
- **Magnitudes reales (mm)**: `cellPx` pasa a ser mm por celda, no px.
- Modelo de **panel** (muro), **ancho bloqueado desde planta**.
- **Pestañas** Planta / Alzado (no split).
- **Alzado con 0,0 local** y dibujo de silueta por polilínea desde la base.
- **Tipo de muro** + composición por cara → espesor y materiales.
- **Aberturas** con reglas de retiro, **T-connect** con descuentos, **contabilidad**.

Resultado buscado: **una sola app de dibujo** (motor compartido). iLFrame = modo
estructural (mm + paneles + cálculo); iLDraw = modo croquis sobre el mismo motor.

## 0.b Reglas: STEEL FRAMING (Uruguay), fuente SketchFramer

- **Todo es steel framing**: cada herramienta y elemento tiene reglas propias del
  sistema (montantes/soleras, separaciones, refuerzos, dinteles, jambas, etc.).
- **La app debe analizar y poner límites** automáticamente: aberturas con
  refuerzos y retiros, luces máximas, etc. No es dibujo libre: valida.
- **Fuente de datos y reglas: SketchFramer** (los perfiles ya salieron de ahí —
  `data/profiles.js`). Se reutiliza ese material para perfiles, secciones y reglas.
- **Paleta de herramientas / elementos** (cada uno con su menú y reglas propias):
  Muro, **Pilar**, **Viga**, **Cercha**, Techo, Cielorraso, Losa de piso, Puerta,
  Ventana, Abertura, T-connect, Seleccionar.
  - Funcionan: Muro, Seleccionar, Puerta/Ventana/Abertura (colocación + retiros).
  - Declaradas (reglas pendientes): Pilar, Viga, Cercha, Techo, Cielorraso, Losa, T-connect.
- **Cercha = Trusses (SketchFramer).** Subsistema propio: tipos de cercha
  (dos aguas, mono-pendiente, tijera, etc.), cordones sup/inf, montantes y
  diagonales de alma, luz y separación entre cerchas. Menú y reglas propias
  (pendiente de datos SketchFramer). Igual idea de submenú para Pilar y Viga.
- **Refuerzos de aberturas = automáticos.** NO son herramienta: al colocar una
  puerta/ventana/abertura, la app **suma sola** los perfiles de refuerzo
  (dintel, jambas, montantes de carga / jack & king, antepecho) según reglas
  de SketchFramer. Igual criterio para refuerzos de pilares/vigas/cerchas donde
  corresponda. Se reflejan en la contabilidad, no se dibujan a mano.

## 0.c Datos de SketchFramer (cargados)

- `src/data/profiles.js` — **todos** los perfiles CU (10 normas) y CC (12 normas)
  con secciones (h/w/lip/t) y kg/m. Generado de `2025_11_13_profiles.json`.
- `src/data/systems.js` — **sistemas** de revestimiento/terminación (EIFS, DEFS,
  SIDING, MADERA, CHAPA, DRYWALL) con **componentes, basis (m²/ml), multiplicador**
  y materiales (rendimiento `yield` + `waste_pct`). Base directa del **BOM**.
- `sketchframer/` (referencia, no se bundlea): JSON crudos + `plans_options.json`.

**Modelo de panel SketchFramer (de la obra de ejemplo):** cada muro =
`base_lines` + `openings_lines` + `profiles` (cada perfil = polígono `points` +
`profile_type`: 0 = montante, 1 = solera; los **refuerzos de abertura son
montantes/soleras extra**, no un tipo aparte) + `bolt_holes` + `opening_labels`
(nombre `anchoxalto` mm) + `auto_dimensions`. → El BOM cuenta ml por tipo de
perfil × kg/m, placas por m², y materiales de sistema por m²/ml × multiplicador.
`plans_options` (85 claves) define el render de **planos** (vista frente, cotas,
bulones, colores, tamaños) para generar láminas.

## Convención de UI (IMPORTANTE)

- **NADA de emojis** en ninguna app. Usar siempre **icon flats** (SVG de línea,
  `stroke=currentColor`). Vale para iLFrame y el resto de las apps de la familia.

## 1. Planta (pestaña)

- Dibujar un muro: **pico inicio → arrastro → fin** (snap a grilla y a vértices).
- Editar la **distancia exacta** del muro en el cajón.
- Se asigna **etiqueta automática** (M1, M2, M3…).
- Repetir → se arma la **lista de muros**, cada uno con su **largo en memoria**.
- En planta **manda el largo** (verdadera magnitud). El ancho del panel = largo de la línea.

## 2. Vistas en PESTAÑAS separadas (no split)

- Pestañas: **Planta** | **Alzado** (y a futuro otras: BOM, 3D…).
- Ya NO se muestran planta y alzado a la vez; se cambia de pestaña.
- En Alzado se trabaja sobre el **muro seleccionado** en planta.

## 3. Alzado (pestaña)

- Aparece la **base = ancho del muro** seleccionado (viene de planta, **bloqueado**).
- Se dibuja **igual que en planta**: se parte de la base y se sube dando
  **alturas y propiedades** hasta **cerrar la figura** (la silueta de la cara).
- Verdadera magnitud y vista desde el **lado exterior** (flecha azul en planta, "voltear" disponible).

## 4. Coordenadas LOCALES del alzado (clave)

- El **punto inferior izquierdo de la base es el (0,0)** de ese alzado.
- Todo se referencia **relativo a ese 0,0** (no al espacio universal).
- Permite puntos exactos. Ej: **cumbrera** a **X=4.00 m, Y=3.50 m** → se genera
  el punto y se une con **polilínea**.

## 5. Tipo de muro y espesor (derivado del proyecto)

- Cada panel tiene la propiedad **tipo de muro**: define **qué muro es** y su
  composición por cara. Ej:
  - **interior/interior** (entre dos ambientes interiores),
  - **interior/exterior** (muro exterior),
  - y los materiales que se le pusieron a cada cara: doble OSB, yeso simple,
    chapa, siding, etc.
- El **espesor de pared** NO es un dato suelto: se **calcula** desde ese tipo =
  **núcleo (alto del montante/perfil)** + **capas de cada cara** (las elegidas en
  la config del proyecto).
- Ese espesor alimenta: el **retiro de aberturas al filo**, los **descuentos de
  conexión (T-connect)** y la **contabilidad** (qué material lleva cada cara).
- En la **config del proyecto** se definen los **tipos de muro** (Exterior,
  Interior, etc.) con su composición; al dibujar, **el panel elige un tipo**.

## 6. Aberturas (puertas / ventanas) referidas al 0,0 local

- Se colocan sobre la cara, en verdadera magnitud.
- Piden **medidas** (ancho, alto, antepecho) y **ubicación** (retiro desde un lado / desde el 0,0).
- **Reglas:**
  - Retiro **nunca menor a 10 cm** desde el borde (puede ser mayor).
  - **No puede llegar al filo final**: debe quedar a una distancia igual al
    **espesor de pared** (que sale del tipo de muro, p. ej. ~10 cm) del extremo.
- De cada abertura salen: **dintel, jambas y refuerzos** (montantes/soleras extra).

## 6. Conexiones / T-connect (para descuentos)

- Indicar **qué muros se conectan** entre sí (esquinas, T).
- La app aplica **descuentos en los encuentros** (no contar material de más),
  porque no se construye al ras/solapado.
- Afecta: **soleras, montantes y placas**.

## 7. Contabilidad (resultado)

- Por panel y total, según superficie real y la **config del proyecto**
  (perfil, separación de montantes, placa, revestimiento, aislante, alfajías,
  capas de pintura, masilla, enduido, cinta, tornillos).
- Descuenta **aberturas** (área neta) y aplica **descuentos por conexión**.
- Exportable (Excel/PDF), en la línea de la app de cálculo de placas.

## Estado / orden sugerido

- [x] Planta: dibujo por arrastre, snap grilla+vértice, largo editable, etiquetas, mover/copiar/borrar, deshacer/rehacer, zoom/pan.
- [x] Alzado (versión split actual): silueta por números, ancho bloqueado, voltear cara.
- [x] Config de proyecto (Etapa 2): elementos, capas por cara, terminación.
- [ ] **(BASE) Motor fusionado iLDraw+iLFrame** (Canvas 2D + coordenadas de mundo en mm, snap fuerte, gestos). Es el cimiento; lo demás se monta encima.
- [ ] **Tipos de muro** en la config + asignar tipo al panel (deriva espesor/materiales).
- [ ] **Pestañas** Planta / Alzado (reemplazar el split).
- [ ] Alzado con **0,0 local** + dibujo desde la base (polilínea de silueta).
- [ ] **Aberturas** con reglas de retiro (mín. 10 cm / espesor de pared del tipo).
- [ ] **Conexiones / T-connect** + descuentos.
- [ ] **Contabilidad** completa + exportar.
