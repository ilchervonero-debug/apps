# SketchVolt — Grupos y Componentes (PRÓXIMO A HACER)

> Doc de trabajo. **No implementar todavía** (pedido de Ángel: hacerlo la próxima sesión,
> cuando recarguen los tokens). Acá quedan los **3 arreglos** definidos, con el estado
> actual del código para arrancar directo.

Archivo afectado: `chervo-web/apps/sketchvolt/index.html` (todo inline).
Al cerrar: bump SW (`sketchvolt-vN`) y actualizar `ESTADO-APPS.md`.

---

## Estado actual (cómo está hoy)

- **Selección múltiple:** `selIds` (array, fuente de verdad) + `setSel(ids)` que mantiene
  `selId` sincronizado cuando hay uno solo. `groupIds(gid)`, `expandGroups(ids)`, `objBounds(o)`.
- **Grupo (único concepto actual):** propiedad `o.group = gid` (string `uid()`).
  - `agruparSel()` pone el mismo `group` a todos los seleccionados.
  - `desagruparSel()` borra `group`.
  - `selectAt()`: tocar un miembro → `setSel(groupIds(o.group))` (selecciona el grupo entero).
  - Mover/copiar: `doMovStart` arma un `set` (multiselección o grupo) y `doMovDrag` mueve
    todos juntos. La copia de un grupo se re-agrupa (nuevo `uid()`).
  - Long-press (`ctxDo`) y color operan sobre `set`/`selIds`.
- **Edición aislada:** `editGroupId=gid`. `editarGrupo()` entra, `terminarGrupoEdit()` sale
  (chip flotante `#groupEditBar`). En `drawObj`, lo que NO es del grupo se atenúa
  (`globalAlpha=0.28`). En aislado, `selectAt` deja seleccionar **un miembro suelto**.
- **Persistencia:** `group` viaja en `planta.objects` (se guarda solo).

Limitaciones que hay que reparar → los 3 puntos de abajo.

---

## Arreglo 1 — Definir GRUPO vs COMPONENTE (lógica SketchUp)

Hoy solo existe "grupo" (y encima como copia independiente). Falta la distinción de SketchUp:

- **Grupo** = agrupación de elementos. Si copio un grupo y edito una copia, **cambia solo esa
  copia**, no las demás. (Instancias independientes — es lo que hoy hace `agruparSel`.)
- **Componente** = **entidad única compartida**. Si edito un componente, **cambian TODAS sus
  copias/instancias** (comparten una "definición").

### Enfoque propuesto (definición + instancias)
- Nuevo store por planta: `componentes = { compId: { objetos:[...geometría local...] } }`
  (geometría en coords **locales** al componente: origen en el centro/eje del componente).
- Cada instancia es un objeto liviano: `{ type:'comp', compId, pts:[[x,y]], rotation, flip, cm? , id }`
  con su **transform** (posición `pts[0]`, `rotation`, `flip`, escala opcional).
- **Render:** dibujar una instancia = tomar `componentes[compId].objetos`, aplicarles el
  transform de la instancia (traslación + rotación + flip alrededor del eje del componente) y
  dibujar. (Se puede reusar el pipeline de `drawObj` con un `ctx.translate/rotate/scale`.)
- **Editar el componente** (doble toque / botón "Editar" en la barra de componente) → entra a
  editar **la definición**; al salir, **todas las instancias se re-renderizan** (cambio global).
- **Convertir:** botones "Crear componente" (de una selección/grupo) y "Hacer único"
  (instancia → grupo independiente, rompe el vínculo).
- **Conteo:** cada instancia cuenta como 1 (ver `contarObjs`); la definición no se cuenta.

### Barra inferior (cuando hay selección)
- Grupo seleccionado → `Desagrupar · Editar · Crear componente · Color · Borrar · Terminar`.
- Componente (instancia) seleccionado → `Editar componente · Hacer único · Color · Borrar · Terminar`.
- Sin caja ni bordes (regla de Ángel: orden invisible; acciones-atajo tiradas a la derecha).

### Criterio de aceptación
- Copio un **grupo**, edito una copia (color/tamaño/mover un miembro) → **las otras copias NO
  cambian**.
- Copio un **componente**, edito una instancia (en modo edición de componente) → **todas las
  instancias cambian** igual.
- "Hacer único" rompe el vínculo (a partir de ahí es independiente).

---

## Arreglo 2 — Espejo (y transformaciones) del grupo como UNIDAD (eje de grupo)

**Síntoma (Ángel):** hacer *mirror* a un grupo salió mal. El grupo **no se lee como grupo**,
no asume que tiene un **eje/centro de grupo**, no tiene lógica de comportamiento como entidad.

**Causa:** `ctxDo('mirror')` hace `set.forEach(id => mirrorObj(o))`, y `mirrorObj` refleja
**cada objeto alrededor de su propio centro** (y en `block` solo togglea `flip`). Resultado: cada
elemento se voltea en su lugar, pero **las posiciones relativas del grupo no se reflejan** → el
grupo queda descolocado, no espejado como conjunto.

### Fix
- Definir **centro/eje del grupo** = centro del `objBounds` del conjunto (bbox de todos los
  miembros), p. ej. eje vertical en `cx = (minX+maxX)/2`.
- **Espejo del grupo:** para cada miembro, **reflejar su posición** cruzando el eje del grupo
  (`x' = 2*cx - x` en todos sus `pts`) **y** espejar su geometría (para `block`: `flip=!flip` y
  `rotation → (360-rotation)`; para el resto: reflejar `pts` como ya hace `mirrorObj` pero contra
  el eje del **grupo**, no el propio).
- Generalizar: que **mover / rotar / espejo** del grupo usen el mismo centro/eje del grupo.
  - **Rotar grupo** (hoy pendiente, sólo rota de a uno): rotar cada miembro alrededor del centro
    del grupo (rotar sus `pts` con `rotatePts(pts, cx, cy, ang)` y, en `block`, sumar `ang` a
    `rotation`). Reusar `startRotate` extendido a un conjunto (`rotSet`) en vez de un solo `rotId`.
- Para **componentes** (Arreglo 1) el eje ya es natural (el origen local del componente): el
  espejo/rotación se aplica al **transform de la instancia**, no a la geometría.

### Criterio de aceptación
- Espejar un grupo lo refleja **como conjunto** (se ve el grupo "dado vuelta", posiciones y
  elementos coherentes), no cada pieza volteada en su lugar.
- Rotar un grupo gira todo alrededor del centro del grupo.

---

## Arreglo 3 — Cuadro de propiedades DENTRO de la edición aislada

**Síntoma (Ángel):** en "Editar" el recuadro se abre y se aísla (se atenúa lo de afuera), **pero
no aparece un cuadro de propiedades del elemento** para poder cambiar nada. Debería estar **atado
al cuadro de edición aislada**: al seleccionar un elemento dentro del grupo, ver **sus
propiedades** para editarlo (color, tamaño, giro, etc.), como hace AutoCAD al abrir el editor.

**Nota de implementación:** hoy `selectAt` en aislado hace `setSel([o.id])` y `showSelBar` debería
mostrar `grpSel`. **Verificar por qué no aparece** (posibles causas: el `refreshBottom`/`_hideAllGrp`
lo oculta, el tap arranca el marquee en vez de seleccionar, o el atenuado dificulta el hit-test).
El pedido explícito: que el cuadro de propiedades en modo edición **pueda no seguir la lógica del
resto** — que sea **propio del cuadro de edición** (contexto dedicado), y que exista sí o sí.

### Fix propuesto
- En `editGroupId` (aislado): al tocar un miembro → seleccionarlo y **mostrar el cuadro de
  propiedades del elemento** (reusar `grpSel`, o un `#grpEdit` propio del modo edición si conviene
  desacoplarlo). Debe permitir cambiar **color / tamaño (cm) / giro / grosor / línea / escala**
  del elemento seleccionado, **sin salir** del aislado.
- El chip `#groupEditBar` ("Editando grupo · Terminar") queda visible en paralelo con las
  propiedades del elemento (no chocar: chip flotante arriba, propiedades abajo).
- Al cambiar de elemento dentro del grupo, el cuadro se actualiza. "Terminar" cierra el aislado.
- Que las ediciones queden **dentro** del grupo/definición (si es componente, editar la
  definición → afecta a todas las instancias; ver Arreglo 1).

### Criterio de aceptación
- Entro a "Editar" un grupo → toco un elemento → **aparece su cuadro de propiedades** → cambio
  color/tamaño/giro → se aplica solo a ese elemento (grupo) o a la definición (componente).
- "Terminar" cierra el modo y vuelve al grupo/instancia como unidad.

---

## Orden sugerido de trabajo
1. **Arreglo 3** (propiedades en aislado) — es chico y desbloquea editar grupos ya.
2. **Arreglo 2** (espejo/rotación como unidad con eje de grupo) — mediano.
3. **Arreglo 1** (grupo vs componente) — el más grande (definición + instancias); hacerlo último.

## Verificación (end-to-end, Playwright + Chromium en /opt/pw-browsers)
- Grupo: copiar → editar copia → las otras NO cambian.
- Componente: copiar → editar definición → todas cambian; "hacer único" rompe vínculo.
- Espejo de grupo: refleja como conjunto (comparar posiciones de miembros contra el eje).
- Aislado: tocar miembro muestra propiedades y aplica cambios sin salir.
- iLStyle intacto: trazo fino, rojo `#FE0000`, **sin rosado**, sin cajas/bordes visibles,
  tacho a la derecha suelto, símbolos SIEMPRE por encima del dibujo.
