# iLVolt — Directrices de arquitectura y lógica (fuente de verdad)

> Core de presupuestación eléctrica (Uruguay). Costos minoristas
> (Sodimac/Atenea/marcas), variables SUNCA/BPS/SAU, canalizaciones, reglas UTE
> y esquema modular de tableros. El código del Core vive integrado en `index.html`
> (`CorePresupuesto.calcularProyecto`).

## 1. Flujo de carga (arriba → abajo, sin mezclar costos en el diseño)

- **Fase 1 — Datos/Config:** Cliente, Ubicación, Fecha. Selector de línea de módulos
  (Económico/Estándar/Diseño/Premium). Jornal base editable ($2.500 ref. ½ oficial).
  Switch BPS unificado (Ley 14.411 → +75.8%). Switches: SAU, vista/embutida, incendio,
  T2 exterior, solo inspecciona (+visitas), tramo subterráneo (+metros +cambio dirección).
- **Fase 2 — Ambientes:** nodos (Cocina, Baño, Dormitorio, Patio…). Bocas: tomas 10A,
  Schuko 16A, Schuko con corte, USB, luces/dicroicas, paneles LED. Cargas pesadas:
  horno/anafe, termofón, bomba/piscina, sensores/fotocélulas, reflectores.
- **Fase 3 — Ingeniería de tableros (automática, sin costos):** diseña T1/T2, circuitos,
  térmicas y diferenciales; genera alertas.
- **Fase 4 — Resultados (pestaña independiente):** sumatoria discriminada por rubros,
  área de firmas y notas legales de deslinde comercial.

## 2. Reglas clave (UTE / ingeniería)

- **Medida indirecta:** si la potencia calculada supera **40 kW** (230 V) / 70 kW (400 V),
  exige combo UTE: CM doble + CT (barras de cobre estañadas, bulones M12) + CI.
- **Circuitos aislados:** separación obligatoria para cocinas (mesadas pesadas), termofones
  e instalaciones exteriores (bombas/piscinas).
- **Doble diferencial:** si hay cargas exteriores (patio/piscina), diferencial exclusivo
  para el exterior (una falla por humedad no deja a oscuras el interior).
- **Sub-tableros:** consumos exteriores pesados o distancias críticas → separar T1 (interior)
  y T2 (exterior).
- **Acometida subterránea:** 2 caños PVC 63mm (servicio + reserva); cámaras a cada extremo
  y una extra cada 15 m o por cambio de dirección.
- **PAT:** kit de puesta a tierra contabilizado automáticamente.

## 3. Valores por defecto (editables en el Core)

- **Mano de obra:** boca fija $800; peinado llave/tablero $400; visita inspección $2.500.
- **SAU/BPS:** jornal ½ oficial $2.500; coef. boca embutida 0.522, vista 0.418; multiplicador
  BPS unificado 1.758 (+75.8%).
- **Módulos por línea** (interruptor / toma10A / schuko / usb / schuko-corte):
  Económico 105/116/163/600/280 · Estándar (Atenea) 75/85/229/600/350 ·
  Diseño (Duomo) 180/210/325/650/480 · Premium (Cambre) 240/280/410/750/590.
- **Canalización:** corrugado naranja $15/m, azul ignífugo $25/m, reforzado $26/m; caja
  embutir 10×5 $45; Daisa tubo $100/m, conector $130, caja aluminio $440; PVC subterráneo
  63mm $90/m; cámara 40×40 $1.800; kit PAT $1.500.
- **Iluminación:** dicroica LED $180; panel/plafón $450; reflector exterior $650;
  sensor/fotocélula $550.
- **Fuerza exterior:** bomba agua/piscina $4.500.

## 4. Estimaciones internas del motor

- Caño por boca: 4 m (azul si entorno incendio, si no naranja). Cableado: 6 m/boca (naranja).
- Caja de embutir por cada boca. Potencias estimadas: cocina base 3.5 kW, +horno/anafe 4.5 kW,
  termofón 2 kW, bomba 1.5 kW.
- Mano de obra SAU = bocas × coef × jornal × (BPS 1.758 si aplica); o bocas × $800 (fijo).
  + peinado = térmicas × $400. + visitas × $2.500 si solo inspecciona.
