# iLStyle — Sistema de diseño iLStorage

Guía viva para todas las apps de la familia **iL** (iLMe, iLDraw, iLSanitaria, iLCalc,
iLDJCU, Bitácora, Cielorraso, GuideCad, APU CORE, iLFrame…).
Objetivo: que todas se vean **hermanas**, legibles y limpias.

---

## 1. Paleta

| Uso | Color |
|---|---|
| Rojo de familia (acento) | `#FE0000` |
| Rojo oscuro (variante) | `#C70000` |
| Tinta / "negro para letras e íconos" | `#1C1C1C` |
| Gris texto secundario | `#7A7A7A` — `#8A8A8A` |
| Plata (segunda parte del logo) | `#C0C0C0` |
| Fondo claro | `#F2F2F0` / `#FFFFFF` |
| Fondo 2 (cajas, inputs) | `#E7E7E4` / `#F6F6F6` |
| Línea | `#DCDCD8` / `#ECECEC` |

Regla de proporción: **blanco 60% · gris 30% · rojo 10%**.
El **rojo es acento**, no relleno de fondos. El **negro puro no se usa** en fondos ni
rellenos; para texto e íconos se usa la tinta `#1C1C1C` (negro para letras, no para vestir la app).

---

## 2. Logo (nombre de la app)

**`iL` en rojo `#FE0000`** + **el resto pegado, con mayúscula inicial, en plata `#C0C0C0`**.
Sin negrita en el resto; `iL` puede ir en `font-weight:800`.

```
iL<span style="color:#C0C0C0">Calc</span>   →  iL rojo + Calc plata
```

Vale igual en el header y en el panel iLStorage (¡no invertir!).

---

## 3. Tipografía y legibilidad — REGLA DEFINITIVA

- Familia: **Exo** (`https://fonts.googleapis.com/css2?family=Exo:wght@300;400;500;600;700;800`).
  Números / monoespaciado (opcional): Geist Mono.
- Esto es para **gente que trabaja, sin lentes**. Ángel **ve borroso** → texto **grande y limpio**.
  **Hay espacio: se usa texto grande.** No se discute más.

**Tamaños — piso OBLIGATORIO:**

| Elemento | px |
|---|---|
| Cualquier texto que se lee | **16** (nunca menos) |
| Micro-etiqueta / caption (única excepción) | **14** mínimo |
| Etiquetas de campo | 15–16 |
| Inputs | **18** (≥16 obligatorio → evita zoom iOS) |
| Contenido / lectura | 16–18 |
| Título de sección | 20–22 |
| Totales / resultados | 22–26 |

**Negrita: uso mínimo.** Lectura en peso **400–500**; 600 solo para un título o acento puntual.
**Nunca** bloques de texto en 700+. Un texto en negrita se ve como **una mancha** para quien ve
borroso. **El énfasis se logra con tamaño, no con negrita.**

**Prioridad: letra grande > botón grande > ícono grande.** Si hay que elegir, se agranda el
**texto**. Jamás achicar texto para que entren botones o adornos.

---

## 4. Header

- Nombre de la app a la **izquierda**; cuenta/usuario (avatar Google) a la **derecha**.
- Tocar el nombre abre el panel **iLStorage** (versión + "Volver a iLStorage").
- Sin quedar encerrado en una pestaña: flechas/menú de navegación siempre visibles.
- Nada de negro/casi-negro en barras; fondo blanco o gris claro, pestaña activa con rojo.

---

## 5. Service Worker

Network-first para HTML (el usuario nunca queda pegado a una versión vieja),
cache-first para assets. **Subir la versión del cache en cada cambio.**
Excluir del cache: firebase/googleapis/firestore/supabase y APIs externas.

---

## 6. Íconos — REGLA iLStyle

Todos los íconos son **un solo sistema** (se ven dibujados por la misma mano).

**Envoltorio estándar** (copiar tal cual, solo cambia el contenido interno):

```html
<svg viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" stroke-width="1.5"
     stroke-linecap="round" stroke-linejoin="round">…</svg>
```

Reglas:

1. **Monolínea**: `fill:none`, `stroke-width:1.5` parejo en todos (fino, nunca negrita: un trazo pesado se vuelve una mancha para quien ve borroso). Sin rellenos, sin partes gruesas.
2. **Grilla 24×24**: mismo alto óptico, mismo aire alrededor.
3. **Caps y joins redondos** (`round`) → trazo suave, no técnico.
4. **Una metáfora por ícono**, simple.
5. **Monocromo tinta `#1C1C1C`**; el **rojo `#FE0000` solo como acento** (una flecha `›`, un punto "new", una barra de "resistente"), nunca todo el ícono.
6. **Tamaño, no negrita.** Para que un ícono resalte, se agranda (28px standalone / 40px en botones de menú), no se engrosa.
7. En botones se usa `stroke:currentColor` para heredar el color del contexto cuando haga falta.

### Set base (contenido interno del `<svg>`)

**Sistema / navegación**

- **home** — `<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>`
- **back** (chevron) — `<path d="M15 5 8 12l7 7"/>`
- **chevron** (acento rojo `›`) — `<path d="M9 5 16 12 9 19" stroke="#FE0000"/>`
- **close** — `<path d="M6 6 18 18M18 6 6 18"/>`
- **menu-grid** — `<rect x="3.5" y="3.5" width="7" height="7" rx="1.3"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.3"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.3"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.3"/>`
- **search** — `<circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.6-3.6"/>`
- **scan** — `<path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M20 16v2a2 2 0 0 1-2 2h-2"/><path d="M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M8 8.5v7M11.5 8.5v7M15 8.5v7"/>`
- **settings** — `<circle cx="12" cy="12" r="3.5"/><path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6"/>`
- **account** — `<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>`
- **save** — `<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4"/><rect x="8.5" y="13" width="7" height="5"/>`
- **print** — `<path d="M7 9V4h10v5"/><path d="M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="15" width="10" height="5"/>`
- **share** — `<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M8.2 10.8 14.8 7.2M8.2 13.2l6.6 3.6"/>`
- **add** — `<path d="M12 5v14M5 12h14"/>`
- **edit** — `<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>`
- **delete** — `<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/>`
- **filter** — `<path d="M4 5h16l-6 7v6l-4 2v-8z"/>`
- **favorite** — `<path d="M12 20 4.5 12.5a4.3 4.3 0 0 1 6-6l1.5 1.5 1.5-1.5a4.3 4.3 0 0 1 6 6z"/>`
- **new-star** — `<path d="m12 3 2.6 5.6 6 .7-4.5 4 1.3 6-5.4-3-5.4 3 1.3-6-4.5-4 6-.7z"/>`
- **info** — `<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>`

**Cálculo / catálogo**

- **calculator** — `<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h0M12 12h0M16 12h0M8 16h0M12 16h0M16 15v3"/>`
- **ruler** — `<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6.5 8v3M10 8v4M13.5 8v3M17 8v4"/>`
- **areas** — `<rect x="3" y="4" width="9" height="9" rx="1"/><path d="M13 20l5-9 5 9z"/>`
- **balance** (regla de 3) — `<path d="M12 4v16"/><path d="M5 8h14"/><path d="M5 8 2.5 13a2.5 2.5 0 0 0 5 0z"/><path d="M19 8l-2.5 5a2.5 2.5 0 0 0 5 0z"/><path d="M8.5 20h7"/>`
- **triangle** (Pitágoras) — `<path d="M5 19V6l13 13z"/><path d="M5 15h4v4"/>`
- **slope** (pendientes) — `<path d="M3 20h18"/><path d="M4 20 19 7"/><path d="M19 7v13"/>`
- **currency** — `<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10"/><path d="M14.5 9.3a2.4 2 0 0 0-2.5-1.3c-1.5 0-2.7.8-2.7 2s1.2 1.7 2.7 2.1 2.7.9 2.7 2.1-1.2 2-2.7 2a2.6 2 0 0 1-2.6-1.4"/>`
- **product** — `<path d="M12 3 21 7.5 12 12 3 7.5z"/><path d="M3 7.5v5L12 17l9-4.5v-5"/>`
- **design** — `<path d="M4 7v11a2 2 0 0 0 2 2h10"/><rect x="6" y="4" width="13" height="15" rx="1.2"/><path d="M9 8h.01M12.5 8h.01M16 8h.01M9 12h.01M12.5 12h.01M16 12h.01M9 16h.01M12.5 16h.01"/>`
- **texture** — `<circle cx="12" cy="12" r="1.6"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8"/>`
- **color** — `<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.7-1.8 0-.9-.7-1.5-.7-2.4 0-.8.7-1.5 1.5-1.5H18a3 3 0 0 0 3-3c0-4.2-4-6.3-9-6.3z"/><circle cx="7.7" cy="12" r=".9"/><circle cx="10" cy="8" r=".9"/><circle cx="14.5" cy="8" r=".9"/>`
- **droplet** (características) — `<path d="M12 3.5s6 6.3 6 10.5a6 6 0 0 1-12 0c0-4.2 6-10.5 6-10.5z"/><path d="M9.5 15.5 15 10" stroke="#FE0000"/>`

> Galería visual (viva) desplegada en **`/ilstyle-iconos.html`**.

### Ícono de app instalada (launcher / PWA)

Es distinto al ícono de interfaz: es la **identidad** de la app en la pantalla del celu.
Todos comparten el mismo molde para verse hermanos:

- Lienzo **192×192**, fondo **full-bleed** `#F2F2F0` (sin margen ni esquinas propias):
  `<rect width="192" height="192" fill="#F2F2F0"/>` — el launcher aplica su propia máscara.
- Glifo de identidad en **gris `#888888`** (relleno o trazo grueso, legible a tamaño chico).
- Acento en **rojo `#FF3333`** (un detalle, no todo el glifo).
- Contenido dentro de la **zona segura** (círculo central ~80%): nada pegado al borde.
- En `manifest.json`: `"purpose": "any maskable"`, `background_color` y `theme_color` = `#F2F2F0`.

> **Ojo (Android):** el ícono instalado se **congela al instalar** (WebAPK). Cambiar el
> archivo no actualiza el que ya está en la pantalla — hay que **reinstalar** la app.

---

## 7. Botones e íconos: "el texto es el botón"

- Acciones secundarias = **texto** (sin recuadro). El recuadro/relleno se reserva a la
  **acción primaria única** (guardar, +, =).
- Menús: fila = ícono monolínea + etiqueta. Ícono en tinta, acento rojo mínimo.

---

_Versión iLStyle 1.3 — se agrega el estándar de ícono de app instalada (launcher full-bleed maskable) y se uniforman los íconos instalados._
