# ESTADO-APPS.md — Registro vivo de iLStorage

> **Para Claude:** este es el registro central. Consultalo al empezar y
> **actualizalo después de cada cambio en cualquier app**. Evita re-verificar
> con navegador/screenshots y evita releer todo el código cada sesión: confiá
> en este archivo + edits cuidadosos. Solo investigá a fondo si Ángel reporta
> un problema puntual.

Última actualización: 2026-07-18

---

## Reglas fijas (no negociar)

- Responder en **español**, saludar a Ángel por su nombre al empezar.
- **Legibilidad**: texto ≥16px (inputs 18px, títulos 20–22, totales 22–26),
  **negrita al mínimo** (peso 400–500), énfasis por **tamaño** no por negrita.
- **Sin rosado** en ninguna app. Estado activo/enfocado = **borde rojo** `#FE0000`.
- **Íconos**: línea fina (stroke ~1.1–1.4), negros = secundario, **rojo = principal**.
  Sin emojis (íconos SVG flat).
- Paleta: blanco `#FFFFFF`, gris `#F2F2F0`/`#DCDCD8`, tinta `#1C1C1C`,
  plata `#C0C0C0`, rojo `#FE0000`. Wordmark: **`iL` rojo + resto plata/tinta**,
  mismo peso y tamaño (solo cambia el color).
- Tipografía **Exo** (bloques largos de texto pueden ir en Inter 300–400).
- Guía completa: `ILSTYLE.md`. Galería de íconos: `ilstyle-iconos.html`.

## Publicación (flujo)

- Deploy a **ilchervo.com** vía Vercel, rama **`master`**. Vercel publica solo.
- Al terminar un cambio: **commit + push a master**.
- Apps estáticas: **bump de versión del Service Worker** en cada cambio
  (`const CACHE = 'app-vN'`), SW network-first.
- La grilla pública de apps está en `index.html` (sección `#apps`).

---

## Apps (carpeta `apps/` salvo iLFrame)

Casi todas son **PWA estáticas** de un solo `index.html` autocontenido + `sw.js`
+ `manifest.json` + `icon-192.svg`. Persistencia con `localStorage`.
**Excepción: iLFrame** (React + Vite, requiere build — ver abajo).

| App | Carpeta | Qué hace | En grilla |
|-----|---------|----------|-----------|
| iLFrame | `apps/ilframe/` (build → `ilframe/`) | Estructuras de acero (steel frame), vistas Planta/Elevación sincronizadas, cómputo | Sí |
| iLWall | `apps/ilwall/` | Cómputo de tabiques de yeso desde DXF: montantes, placas, refuerzos, Excel/PDF | Sí |
| iLDraw | `apps/ildraw/` | Pizarra de dibujo técnico / croquis; export DXF/PNG/PDF | Sí |
| iLMe | `apps/ilme/` | Agenda personal: memoria, rutinas, pagos | Sí |
| iLSanitaria | `apps/ilsanitaria/` | Cálculo hidráulico sanitario (desagües, pluviales, reserva) | Sí |
| iLDJCU | `apps/ildjcu/` | Relevamiento de campo para DDJJ de Caracterización Urbana (DNC) | Sí |
| Bitacorapp | `apps/bitacorapp/` | Bitácora de proyectos: notas, fotos, voz; export PDF con encabezado+logo | Sí |
| Cielorraso DXF | `apps/cielorraso/` | Metrado de cielorraso de yeso desde DXF; export Excel | Sí |
| APU CORE / HA-Calc | `apps/apucore/` | Hormigón armado: materiales, encofrado, acero, mano de obra | Sí |
| GuideCad | `apps/guidecad/` | Guía de comandos AutoCAD | Oculta |
| iLCalc | `apps/ilcalc/` | Calculadora simple | Oculta |
| Demoliciones | `apps/demoliciones/` | (documentar) | No |
| Gastos Ruta 26 | `apps/gastos-ruta26/` | (documentar) | No |

---

## iLFrame — build (IMPORTANTE, no es estática)

- Fuente: `chervo-web/apps/ilframe/` (React 19 + Vite 8 + Zustand + Tailwind + xlsx).
- Servido desde: `chervo-web/ilframe/` (estático, Vercel no compila).
- **Compilar y sincronizar tras cada cambio de código:**
  ```
  cd chervo-web/apps/ilframe
  npx vite build
  rm -rf ../../ilframe/assets && cp -r dist/. ../../ilframe/
  rm -rf dist
  ```
  El `index.html` servido debe referenciar el nuevo hash `assets/index-XXXX.js`.
- `base: '/ilframe/'`. PWA con `vite-plugin-pwa` (autoUpdate, manifest manual).

### Arquitectura iLFrame (lógica clave)
- **Dashboard/Componentes** (`ProjectSetup.jsx`): se define TODO — cada tipo de
  muro/pilar/columna/cercha/viga/losa/techo/cielo con su material y perfiles.
  El **perfil se elige por elemento** (cada muro puede tener el suyo; hay
  fallback global). Perfiles incluyen 35 y 70 para cielorrasos.
- **Canvas** (`src/studio/canvas.html`, motor v1.40 injertado): solo da la
  **forma** (ancho/alto, siluetas de aberturas, uniones). No dimensiona material.
  Muestra un **selector de los tipos precargados** del dashboard; cada pieza
  vuelve con su `tipo` (nombre de Componente) para que el cómputo la valorice.
- **Puente** React↔canvas por `postMessage` (iframe `srcDoc`, sin URL):
  `ready` / `load` / `types` / `focus` / `studio` (guardado debounced 400ms).
- **Link por elemento al plano**: cada tarjeta de Componentes tiene el botón
  **"Dibujar en el plano"** (rojo, al pie) → `focusElement(tool, nombre)` →
  abre el canvas ya conectado a ESE elemento (herramienta + tipo + vista).
  El botón grande **"Ver plano →"** es la entrada general.
- **Cómputo** (`engine/computo.js`, `bom.js`, `spec.js`): valoriza por `o.tipo`.
  Viga cuenta como `type:'viga'` o `cercha+modelo VIGA`. Pilar se separa de
  columna por `kind:'armada'`. Patrones WARREN/LADDER/X_CROSS vía `PATRON_MAP`.
- **Comandas A/B/T** (uniones de muro): definen **quién asume la tapa/cierre**
  del perfil expuesto cuando dos muros chocan al exterior (también entrepisos,
  pilares y caras al exterior). El dato viaja en `wall.uniones` (con `comanda`).
  Cuantificación del material de cierre = **fase siguiente pendiente**.

---

## Historial de cambios por app (lo hecho)

### iLWall (nueva)
- Motor completo de cómputo de tabiques de yeso (simple/doble cara):
  importa DXF (LINE/LWPOLYLINE/POLYLINE) → grilla de montantes; largo/alto;
  lápiz de refuerzos (Mocheta ×1 / Jamba ×2 / Recorte); puertas/ventanas con
  jamba + dintel (+ antepecho en ventana) contabilizados solos.
- Materiales: montantes, soleras, placas, refuerzos, dinteles, antepechos,
  tornillos T1/T2, fijaciones, cinta, masilla, enduido, barrera de vapor, lana.
- Export **Excel** (SheetJS por CDN, necesita internet) y **PDF** (desglose).
- Coeficientes = estándar steel frame (desperdicio placa 10%, ~20 tornillos/m²,
  fijación cada 60cm, barra 6m). **Ajustar si Ángel da los suyos.**

### iLDraw
- iLStyle: `--accent` `#FE0000`, íconos stroke 1.1, activo = borde rojo.
- **FAB cuadrado** (esquinas redondeadas), no círculo.
- Íconos de herramientas **negros por defecto → rojos + borde rojo al activarse**.
  Sin botones grises.
- **Export explícito** DXF / PNG / PDF, siempre **limpio sin grilla**.
- SW: `ildraw-v11`.

### Bitacorapp
- PDF: encabezado editable + logo; **sin nombre de proyecto ni fecha** en la portada.
- Impresión individual de una nota = **misma modal general** con esa nota
  pre-tildada (un solo sistema de impresión).

### iLMe
- Rutinas/recurrentes **solo aparecen su día programado, en rojo** (no persisten
  a diario). Opción **"Un día"** (día de semana, ej. sábados). Cumplida ≠ borrada
  (se destilda y reaparece en la próxima fecha). Borrado = permanente.

### iLDJCU
- Nueva declaración **en blanco** (sin datos pegados de otra). Cache de la lista.
  Multiusuario. iLStyle completo. Económico arranca en cero. Menú hamburguesa a
  la **derecha**. Wordmark mismo peso/tamaño (solo color). Sin "Volver a iLStorage".
  Encabezado + foto editables al generar PDF.

### APU CORE / HA-Calc
- iLStyle, landing con **múltiples proyectos** (persistentes). Export del proyecto
  entero en **PDF + CSV** desde el landing. Encabezado editable + logo. Menú
  hamburguesa a la derecha. Íconos +30%. Quitado el ícono PDF redundante
  (una sola acción "Imprimir o guardar PDF").
  *(Nota: la tarjeta de la grilla todavía figura como "APU CORE".)*

### iLFrame
- Canvas nuevo (motor v1.40) injertado con el puente y el sistema de `tipo`.
- Perfil **por elemento** (antes global). Perfiles 35 y 70 agregados.
- Quitadas las notas "Directrices para Claude" (`RevisionNotes`).
- Botón **"Dibujar en el plano"** visible y con texto en cada elemento.

---

## Pendientes conocidos
- iLFrame: **cuantificar el material de cierre/tapa** que asigna la comanda A/B/T
  (dato ya preservado en `wall.uniones`).
- iLWall: ajustar coeficientes de cómputo si Ángel los define distinto.
- Documentar `demoliciones` y `gastos-ruta26`.
- Revisar si la tarjeta de grilla de APU CORE debe renombrarse a HA-Calc.
