# PENDIENTE — Motor CAD y UX (SketchVolt)

> Guardado para más tarde (pedido de Ángel). La UI (barras, FABs sin bordes, íconos
> iguales, textos mínimos en gris) YA ESTÁ APROBADA — **no** tocar el layout visual.
> Esto es EXCLUSIVAMENTE lógica del motor de dibujo e interacción.

## 1. Modos de Puntero y Precisión Táctil (Cursor Anclado)
Ícono en el **Head** que alterna 3 modos de entrada:
- **Modo 1 · Dedo Directo (Touch Standard):** lo que se toca es lo que se clickea. Ideal para paneo/selección rápida.
- **Modo 2 · Cursor Anclado (Precisión Móvil):**
  1. Apoyás el dedo y arrastrás → mueve un cursor (cruz) desplazado hacia arriba (offset Y) para no tapar el dibujo.
  2. Soltás el dedo → **el cursor queda fijo y anclado en esa coordenada exacta**.
  3. Tap ("pick") en *cualquier* lugar libre → la acción (inicio de línea, selección, vértice) se registra
     **en la coordenada del cursor anclado**, NO en la del nuevo tap.
- **Modo 3 · Ratón (PC):** clásico de escritorio, hover en tiempo real y click directo.

## 2. Ciclo de Dibujo Estilo AutoCAD
Todas las herramientas: **Specify (Fijar) → Adjust (Ajustar) → Confirm (Confirmar)**.
- El usuario especifica un punto (cursor anclado o medidas exactas).
- El punto NO se aplica ciegamente; el cursor queda a la espera del próximo comando/medida.
- Avanza o cierra SOLO al confirmar (pick, Visto Verde ✓, o Enter).

## 3. Corrección de Herramientas Críticas

### A. Cotas (Dimensions) — restaurar flujo CAD
1. **Origen 1:** pick primer punto (cursor anclado).
2. **Origen 2:** pick segundo punto.
3. **Ubicación:** arrastrar el cursor para separar la línea de cota del dibujo.
4. **Confirmación:** tap final ("pick") o ✓ fija la cota en esa posición.

### B. Curvas / Arcos (Arc) — 3 puntos obligatorios
1. **Start:** fijar primer punto.
2. **End:** fijar punto final (línea punteada temporal).
3. **Point on arc (radio/bombeo):** al mover el cursor la curva se infla/desinfla pasando por ese 3er punto.
   Confirmar (pick) para fijar.

### C. SmartPen (trazado de cañerías eléctricas contabilizable)
- **Snap inicial fuerte:** agarre magnético SOLO en `pts[0]` (inicio) para conectar exacto a boca/tablero.
- **Trazado libre:** una vez anclado el inicio, el resto del trazo queda **completamente libre**
  (sin snap a grilla ni a objetos) para dibujar curvas orgánicas — así la longitud medida es realista.
- **Conexión final:** si al hacer el pick final el cursor anclado está cerca de otra boca/caja, auto-snap de cierre.
