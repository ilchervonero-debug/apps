# Resumen de sesión — iLFrame y otras apps

> Bitácora de lo hecho y lo pendiente. Todo está publicado (push a master → Vercel).

## Hecho esta sesión

### iLDraw
- Restaurada versión correcta (accent rojo `#C70000`, sin logo inventado).
- `escBtn` (flecha selección/ESC) separado a la derecha con borde.
- Service worker a v6 (limpia caché viejo en todos los dispositivos).

### iLMe
- Notas / ítems de agenda en **negrita**; "Memory" queda liviano.

### Bitacorapp
- Export **PDF** desde la app instalada (PWA) con `window.print()` + `@media print`.

### Cielorraso DXF
- **Publicado** en `ilchervo.com/apps/cielorraso/` + tarjeta en la landing.
- Fix canvas: refuerzos visibles, `setDir/setRef` redibujan.

### iLFrame (el grueso de la sesión)
- **Rediseño por paneles**: cada muro de planta = un panel (M1, M2…); el largo de la
  línea = **ancho** (bloqueado), editable solo en planta.
- **Dibujo por arrastre** en planta, con **largo real** editable.
- **Grilla + snap** en múltiplos de **40/60 cm** (elegible), mayor cada **1.20 m**.
- **Snap arreglado** (getScreenCTM) con prioridad: **vértice de muro → grilla**.
- **Zoom y pan** en planta (pinch 2 dedos + rueda); tamaños constantes en pantalla.
- **Grilla infinita** (viewBox responsivo, sin bandas blancas).
- **Deshacer / rehacer** con historial agrupado por acción + atajos + botones.
- Inputs con **buffer local** (podés vaciar y escribir tu medida).
- **Menú contextual** mover/copiar/borrar **solo con long-press**.
- **Etapa 2 — Configuración de proyecto**: nombre, perfil de acero (norma, montante,
  separación), **tipos de muro** con composición por cara y **espesor calculado**,
  y elementos (techo, piso, losas, cerchas, columnas) con capas + terminación.
- **Pestañas Planta / Alzado / 3D** a pantalla completa (reemplazó el split).
- **Alzado en verdadera magnitud** con **0,0 local** (esquina inf. izq. de la base),
  **base bloqueada**, **vértices arrastrables** y edición numérica exacta (cumbreras).
- **Voltear cara** (ver desde el lado exterior) + **flecha de exterior** en planta.
- **Aberturas** (puerta/ventana/abertura) sobre la cara, con **reglas de retiro**
  (mín. 10 cm / espesor de pared, no pega al filo); colocación por tap o por número.
- **Tipo de muro por panel** (define espesor y materiales).
- **Paleta de herramientas**: Muro, Pilar, Viga, Cercha, Techo, Cielorraso,
  Losa de piso, Puerta, Ventana, Abertura, T-connect, Seleccionar — en **2 columnas**,
  **caja fija**, botón ≡ anclado, **íconos grandes** y estilo limpio.
- **Vista 3D liviana** (Canvas): **4 esquinas estáticas** (NE/NO/SO/SE, sin orbitar),
  modelo completo con siluetas y aberturas, **esconder elementos**.
- **Icono/favicon** alineados a la familia (cuadro redondeado, rojo `#FF3333`).
- Documentos: `ROADMAP.md` (visión y reglas) y este `SESION.md`.

## Pendiente

### Reglas steel framing (esperando datos de SketchFramer)
- Cargar JSON/tablas del plugin SketchFramer (perfiles ya están; faltan **reglas**).
- **Refuerzos automáticos de abertura**: dintel, jambas, jack & king, antepecho.
- **Cerchas (trusses)**: tipos, cordones, alma, luces y separaciones — submenú propio.
- **Pilar / Viga**: reglas y submenú propios.
- **Techo / Cielorraso / Losa**: comportamiento y reglas.
- **T-connect**: marcar encuentros entre muros y aplicar **descuentos** (soleras,
  montantes, placas).

### Contabilidad y salida
- **BOM por cara + total**: soleras, montantes (por separación), placas (enteras/
  cortadas), refuerzos, aislante/revestimiento por m², **kg de acero**.
- **Exportar** a Excel/PDF (como cielorraso).
- **Planos esquemáticos** imprimibles (planta + cada cara con cotas y conteo).
- **Previews / galería** de caras.

### Mejoras de motor / 3D
- Unificar el motor (mash-up iLDraw + iLFrame) como base compartida.
- 3D: dar **grosor** a las caras; sumar techos/cerchas/losas cuando tengan reglas.
- Validaciones/límites automáticos por elemento (luces máximas, etc.).

## Orden sugerido para retomar
1. Cargar datos/reglas de **SketchFramer**.
2. **Refuerzos automáticos de abertura** (ya hay aberturas + tipo de muro).
3. **T-connect + descuentos**.
4. **BOM v1 + exportar**.
5. **Planos imprimibles**.
6. Reglas de cerchas/pilares/vigas/techos/losas.
