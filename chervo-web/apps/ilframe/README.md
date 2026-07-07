# iLFrame — Steel Framing CAD

Aplicación de diseño estructural en steel framing (Uruguay), con parámetros y
perfiles adaptados de SketchFramer.

## Características

- Dibujo por paneles — Planta (línea = panel) y Alzado (silueta en verdadera
  magnitud, 0,0 local).
- Tipos de muro por composición de capas → espesor y materiales.
- Aberturas (puertas / ventanas) con reglas de retiro y refuerzos automáticos.
- Perfiles CU/CC precargados (normas IRAM, Euro, ABNT, etc.).
- Vista 3D liviana — 4 esquinas estáticas, con ocultar elementos.
- Cómputo (BOM) automático: perfiles, placas, terminación y tornillos.
- Salida: Excel (materiales / partes / completo) y planos PDF.

## Inicio rápido

```bash
npm install
npm run dev
```

## Estructura

```
ilframe/
├── src/
│   ├── components/   # Componentes React (canvas, setup, BOM, salida)
│   ├── data/         # Perfiles CU/CC, sistemas, capas
│   ├── store/        # Estado (Zustand)
│   ├── engine/       # Geometría y cómputo (BOM)
│   ├── App.jsx
│   └── main.jsx
├── public/
└── README.md
```

## Convención de UI

- Nada de emojis. Usar siempre icon flats (SVG de línea, `stroke=currentColor`).

Ver `ARQUITECTURA.md` para la visión y el flujo de trabajo completos
(fuente de verdad vigente).
