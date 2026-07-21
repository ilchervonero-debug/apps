# CLAUDE.md

## Registro vivo (leer y mantener SIEMPRE)

**`chervo-web/ESTADO-APPS.md`** es el registro central de todas las apps, su
estado, decisiones y pendientes. **Consultalo al empezar** (para saber qué hay y
qué cambió) y **actualizalo tras cada cambio en cualquier app.**
No re-verificar con navegador/screenshots ni releer todo el código cada sesión:
confiar en este registro + edits cuidadosos. Investigar a fondo solo si Ángel
reporta un problema puntual.

## Modo de trabajo ULTRA-EFICIENTE (interfaz móvil Android — ahorro máximo)

Ángel controla desde un teléfono Android; pantalla chica, tokens al mínimo:

1. **Sin análisis global.** No escanear/mapear/resumir todo el repo salvo pedido
   explícito. Conocimiento incremental.
2. **Lectura quirúrgica.** Leer solo las líneas exactas indicadas; un archivo una
   vez por sesión si se puede; razonar desde el historial, no reabrir.
3. **Alcance ultra-acotado.** Solo lo directamente ligado a la tarea; nada de
   pre-explorar directorios vecinos.
4. **Respuestas de una línea.** Sin saludos/teoría/cortesía. Si salió bien:
   "Hecho." o el output directo. Cero explicaciones salvo pedido.
5. **Batching.** Si un comando local de terminal alcanza, sugerirlo en vez de
   correr análisis pesado.

**Atajos (una palabra):** `resumen`=/compact · `limpio`=vaciar contexto ·
`fijar`=bloquear archivo actual en memoria (no releer directorio).

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

## Íconos y color de estado (regla fija)

- **Ícono rojo `#FE0000` = principal** (navegación, menú, acción destacada); **ícono negro/tinta = contexto/secundario.**
- Ícono de **línea fina** (stroke ~1.1), nunca grueso.
- **Estado encendido/activo/enfocado = BORDE ROJO**, nunca rosado.
- **Sin rosado en ninguna app** (nada de `#fdeaea`, `#ffe2e2`, ni rojo a baja opacidad). "Presionado" = gris apenas más oscuro.

## Contexto del proyecto

- Familia de PWAs **iLStorage** en `chervo-web/` (deploy a **ilchervo.com** vía Vercel, rama `master`).
- Guía de diseño: **`chervo-web/ILSTYLE.md`** (iLStyle). Galería de íconos: `chervo-web/ilstyle-iconos.html`.
- Reglas clave: **sin emojis** (íconos flat), tipografía **Exo**, paleta blanco/gris/rojo
  (`#FE0000` acento, `#C0C0C0` plata, `#1C1C1C` tinta), wordmark **`iL` rojo + resto plata**,
  textos grandes y legibles, service workers **network-first** con bump de versión en cada cambio.
- Al terminar un cambio: commit + push a `master` (Vercel publica solo).
