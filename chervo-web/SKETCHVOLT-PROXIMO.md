# SketchVolt — PRÓXIMO CAMBIO (pedidos de Ángel, dejados para revisar)

> Notas para arrancar directo la próxima sesión. **No implementado todavía** (pedido de Ángel:
> "lo dejamos para revisar en el próximo cambio, md"). Archivo afectado:
> `chervo-web/apps/sketchvolt/index.html` (todo inline). Al cerrar: bump SW (`sketchvolt-vN`) y
> actualizar `ESTADO-APPS.md`.

Regla base iLStyle a respetar: **negro/tinta = en espera / contexto**, **rojo `#FE0000` = activo /
enfocado**. Nada de borde rojo fijo "decorativo" (Ángel: "no quiero botones halos").

---

## 1 — Botones de herramienta: NEGRO en espera, ROJO activo (cambio de color, no borde fijo)

**Pedido (Ángel):** "Lo que marca la herramienta activa está bien, que cambie de color siempre es
lo mejor. Negro espera y rojo activo."

**Estado actual:** los dos FAB flotantes arriba-derecha están **siempre rojos** (borde + ícono rojo),
no cambian según estado:
- `#btn-elec` (⚡ simbología eléctrica) — CSS ~línea 292, HTML ~línea 478.
  Hoy: `background:#fff;border:1.5px solid var(--accent);color:var(--accent)` **fijo**.
- `#btn-herr` (herramientas; refleja el ícono de la herramienta activa) — CSS ~línea 90, HTML ~línea
  444. Hoy: mismo borde/color rojo fijo. Su ícono se clona del tool activo en `updateFabIcon`/similar
  (~líneas 1989-1992: `phbActive` o `#escBtn`).
- Referencia de cómo SÍ debe comportarse: `#escBtn` (flecha seleccionar) ya lo hace →
  `#escBtn path{fill:none}` y `#escBtn.on path{fill:var(--accent)}` (CSS ~112-113).

**Fix propuesto:**
- Estado **en espera** = ícono **negro/tinta** (`color:var(--ink)`), **sin borde rojo** (borde neutro
  gris `#e5e5ea` o sin borde). Estado **activo** (su panel abierto / su herramienta seleccionada) =
  ícono **rojo** (`color:var(--accent)`) + borde rojo (o el marcador que ya usamos para activo).
- Para `#btn-elec`: rojo cuando el panel de simbología (`#panel-unit`) está abierto o el tool
  `block` está activo; negro si no.
- Para `#btn-herr`: rojo cuando `#panel-herr` está abierto o hay una herramienta de dibujo activa
  (no `select`); negro en `select`/espera. Togglear una clase `.on` desde `toggleTools()` /
  `fabElec()` / al cambiar de herramienta (`ST()` / `updateFabIcon`).
- Homologar el criterio con los íconos de la barra superior (`.ti-t` ya usa `.on` → rojo; ~109-110).

**Criterio de aceptación:** en reposo los FAB se ven **negros finos**; al abrir su panel o activar su
herramienta, se ponen **rojos**; al salir, vuelven a negro. Nunca rojo fijo "de adorno".

---

## 2 — Tacho del long-press = mismo ícono que el del panel

**Pedido (Ángel):** "El tacho de basura ícono que está en el press long, debe ser igual al del panel."

**Estado actual:** son **distintos**:
- Long-press (menú contextual `#ctx`), botón borrar — HTML ~línea 692:
  ```
  <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
  ```
  (tapa + cuerpo, **sin** las barritas internas ni el asa).
- Panel de propiedades (`.pib.danger`), tacho completo — p. ej. en `#grpSel`/`#grpMulti`:
  ```
  <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
  ```
  (agrega **barritas 10/14** y **asa 9 6V4**).

**Fix:** reemplazar el `<svg>` del botón borrar de `#ctx` (~692) por el **svg completo** del panel
(idéntico path). Nada más. (Verificar que no haya otros tachos "cortos" sueltos y homologarlos.)

**Criterio de aceptación:** el tacho del long-press se ve **igual** al del panel (con barritas y asa).

---

## 3 — Rediseño DASHBOARD + HOME con tarjetas visuales (visión de Ángel)

> Bloque grande (pantallas). Menos texto, más íconos, y **miniatura/avatar del dibujo** en cada
> tarjeta. La tarjeta ES el acceso directo al canvas.

**HOME (lista de proyectos):**
- Tarjeta de proyecto **más grande**, que muestra una **foto/avatar del canvas** que se está
  trabajando (miniatura del dibujo).
- Una **tarjeta vacía con "+"** para crear proyecto → **eliminar el formulario/modal "Nuevo
  proyecto"**. Al tocar "+", solo **pide el nombre** → se crea con **fecha y hora** → entra directo
  al dashboard.
- Layout de tarjeta: **avatar del dibujo arriba (~75%)** + franja de **datos abajo (~25%)**: nombre,
  fecha y hora de creación. **Tacho en la esquina derecha** para borrar. **Tocar la tarjeta = abrir
  el canvas** (acceso directo). La **edición de datos va arriba** (íconos sobre el dibujo).

**DASHBOARD (dentro del proyecto):**
- Mismo lenguaje: tarjeta con **datos del proyecto** + **seteo de hoja de trabajo**.
- **Arriba-derecha de la tarjeta: íconos de impresora y exportación** (sobre el avatar).
- Debajo de los datos: **cliente, hoja, rotación (ícono retrato/apaisado), escala** → todo eso
  **llena el rótulo (cajetín)**.
- **Cuadro grande con avatar del dibujo**; si está vacío, muestra un **"+"**. Debajo, otro vacío con
  **"+"** para **crear otra hoja** (piso, etc.) — mismo patrón.
- Al crear la hoja: **íconos arriba-derecha** para editar **nombre de hoja, tamaño de papel,
  rotación**; esos datos + el nombre de la hoja llenan lo principal del rótulo.
- Idea rectora: ver **un pedazo de la hoja de trabajo** con los **íconos arriba sobre el dibujo**;
  firma notoria. Abajo (25%) los datos (nombre, fecha, hora), tacho en esquina.

**Notas técnicas para arrancar:**
- **Miniatura/avatar:** generar un PNG chico de la planta (reusar `renderCleanURL`/`renderSheetURL`
  con canvas reducido) y guardarlo como dataURL en `proy`/`planta` (o regenerar al vuelo al entrar al
  home/dash). Placeholder "+" cuando no hay dibujo.
- **Crear proyecto sin formulario:** reemplazar el modal actual por un pedido mínimo de nombre (o
  inline en la tarjeta "+") → `crearProyecto(nombre)` con `creado:Date.now()` → abrir dashboard.
- **Fecha/hora:** mostrar `creado` formateado (es-UY) en la franja de datos.
- Archivos: todo en `index.html` (home = `#scrHome`/`renderProyList`; dashboard = `#scrDash`/
  `renderPlanos`). Respetar iLStyle (texto grande, sin rosado, íconos finos, negro=contexto/
  rojo=activo).

**Ya hecho (parcial, lote J):** en el dashboard, "Salida" pasó a **botones-ícono** (Imprimir /
Materiales) y el "Dibujar" de cada hoja quedó **solo lápiz**. Falta el rediseño de tarjetas con
avatar de arriba.

---

## RESUELTO (no va más acá)
- **Goma / borradores:** Ángel definió → se **quitó `erase`** (borrar-por-toque, redundante con
  selección + long-press). Quedan **`eraser`** (goma a mano alzada, borra como toda goma de canvas)
  y **`trim`** (recorta segmentos hasta tocar una línea).

---

## Verificación (cuando se implemente)
- Playwright + Chromium (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, `/tmp/node_modules/
  playwright-core`), portrait 430×900. `node --check` sobre el `<script>`.
- FAB: captura en reposo (negros) y con panel/herramienta activa (rojos).
- Long-press: abrir el menú contextual y comparar el tacho contra el del panel (mismo path).
- iLStyle intacto: trazo fino, sin rosado, sin halos.
