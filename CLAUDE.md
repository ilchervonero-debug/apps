# CLAUDE.md

## Sobre el usuario

- Nombre: **Ángel** (Ángel Nieves — iLChervoNero).
- Idioma: **español**. Respondé siempre en español.

## Regla de trato (importante)

**Al empezar cualquier diálogo, saludá a Ángel por su nombre.**
Ejemplo: "Hola Ángel, …". Un saludo breve y natural, sin exagerar; después seguí normal.

## Legibilidad (regla fija — no negociar)

Ángel **ve borroso** y las apps son para **gente que trabaja, sin lentes**:

- Texto que se lee: **mínimo 16px** (14 solo micro-captions). Inputs 18px. Títulos 20–22. Totales 22–26.
- **Negrita al mínimo** (peso 400–500); nunca bloques en 700+ → la negrita se ve como una mancha.
- **El énfasis se logra con tamaño, no con negrita.**
- **Letra grande antes que botón/ícono grande.** Hay espacio → texto grande. No achicar texto por adornos.
- Detalle completo en `chervo-web/ILSTYLE.md` §3.

## Contexto del proyecto

- Familia de PWAs **iLStorage** en `chervo-web/` (deploy a **ilchervo.com** vía Vercel, rama `master`).
- Guía de diseño: **`chervo-web/ILSTYLE.md`** (iLStyle). Galería de íconos: `chervo-web/ilstyle-iconos.html`.
- Reglas clave: **sin emojis** (íconos flat), tipografía **Exo**, paleta blanco/gris/rojo
  (`#FE0000` acento, `#C0C0C0` plata, `#1C1C1C` tinta), wordmark **`iL` rojo + resto plata**,
  textos grandes y legibles, service workers **network-first** con bump de versión en cada cambio.
- Al terminar un cambio: commit + push a `master` (Vercel publica solo).
