# iLFrame — Visión y flujo de trabajo (fuente de verdad)

> Documento para no perder de vista el funcionamiento deseado.
> Magnitudes siempre reales (mm). Objetivo final: una sola app de dibujo
> (motor compartido con iLDraw) + contabilidad de placas/soleras/montantes.

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

## 5. Aberturas (puertas / ventanas) referidas al 0,0 local

- Se colocan sobre la cara, en verdadera magnitud.
- Piden **medidas** (ancho, alto, antepecho) y **ubicación** (retiro desde un lado / desde el 0,0).
- **Reglas (muros exteriores):**
  - Retiro **nunca menor a 10 cm** desde el borde (puede ser mayor).
  - **No puede llegar al filo final**: debe quedar a **10 cm (espesor de pared)** del extremo.
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
- [ ] **Pestañas** Planta / Alzado (reemplazar el split).
- [ ] Alzado con **0,0 local** + dibujo desde la base (polilínea de silueta).
- [ ] **Aberturas** con reglas de retiro (10 cm / espesor de pared).
- [ ] **Conexiones / T-connect** + descuentos.
- [ ] **Contabilidad** completa + exportar.
- [ ] (Base) Motor unificado estilo iLDraw (Canvas + coordenadas de mundo en mm).
