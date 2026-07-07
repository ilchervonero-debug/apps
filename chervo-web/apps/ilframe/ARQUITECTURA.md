# iLFrame — Arquitectura y norte de trabajo

> Documento de referencia (fuente de verdad vigente — reemplaza a `ROADMAP.md`,
> que quedó desactualizado). Todo cambio se piensa contra esto ANTES de tocar
> código. No se hacen mejoras sueltas que no encajen en este flujo.

## Para qué existe esta app

Cotizar obras de steel framing. El público objetivo **odia la tecnología** —
no quiere aprender a usar una app, quiere sacar su número y seguir con su
día. Cada pantalla se tiene que entender sola. Si algo necesita explicación
o manual, está mal diseñado. La app existe para ser liviana, no para lucirse.

## El flujo completo, de punta a punta

### 1. Página principal — el Core (de la empresa, no del proyecto)

Ahí se cargan los parámetros de **la empresa**, no de un proyecto puntual:
costo de mano de obra (cuadrilla, jornales, BPS), materiales con precio real
por presentación comercial, rendimientos por tarea, aportes e impuestos.

Vienen **precargados** (semilla real, no una pantalla vacía) y el usuario los
puede modificar después — nunca arranca en cero, pero tampoco se le pisa lo
que ya editó si se vuelve a cargar la semilla. Se define **una sola vez** y
sirve para **todos** los proyectos.

### 2. Proyectos

Se crean, se abren. **Cada proyecto es un mundo aparte** — nada se hereda de
un proyecto a otro salvo el Core.

### 3. Dentro del proyecto — Componentes (la hoja del proyecto)

Se agregan los elementos que van a formar parte de **ese** proyecto puntual:
muro, pilar, columna, cercha, viga, techo, losa, cielorraso. Si un tipo no se
menciona, no va — no hay obligación de tener de todo. De cada tipo puede
haber uno o muchos, es indiferente; cada proyecto decide.

**Por cada elemento se define ACÁ** (no en el plano) de qué materiales está
compuesto, cómo está armado, qué capas lleva. Esto es la **directriz** — la
receta de ese tipo de elemento.

### 4. "Definir la forma" → Canvas (el plano)

Desde cada elemento, un botón manda al plano. Ahí, y **solo ahí**, se dibuja:

- Forma / silueta.
- Alto, largo, áreas.
- Sentido de montantes, orientación.
- Agujeros / recortes / pases.
- Todo el detalle de **forma** que hace falta para el cómputo.

**Regla dura: en el canvas NO se elige perfil, NO se elige capa, NO se elige
material.** Eso ya vino precargado desde Componentes. El canvas es puro
dibujo — cero fricción de "otra vez tengo que decir de qué está hecho esto".
Tiene varias vistas (planta, alzado, techo, entrepiso, cielo, 3D) para ayudar
a ver bien lo que se está dibujando; ninguna vista pide material.

Se termina de dibujar y se vuelve a la hoja del proyecto — elemento por
elemento, hasta terminar todos los que se definieron.

### 5. Cómputo

Con la forma (del canvas) + los materiales (de Componentes) ya definidos por
cada elemento, el cómputo **lee las dos cosas** y calcula: área real,
cantidad de material, kg de acero — por ítem y consolidado. Acá es donde se
sabe, por primera vez, cómo es realmente la forma y qué la compone.

### 6. Costo final

Suma de todos los ítems del proyecto = el presupuesto.

### 7. Salida — justificativo y trazabilidad

Lo que hace falta para justificar el presupuesto no es solo el total: es el
**detalle de cada elemento** — su dibujo/vista, su resumen de área y de qué
materiales está compuesto. Cada ítem se tiene que poder mostrar y explicar
por separado. Eso es lo que sostiene el precio final frente al cliente.

## Filosofía de trabajo (el norte)

- **Liviana.** Menos pantallas, menos clics, menos texto. Si algo necesita
  scroll largo para resolver algo simple, está mal.
- **Sin redundancia.** Un dato se pide **una sola vez**, en el lugar que le
  corresponde (Core = precios/mano de obra; Componentes = materiales;
  Canvas = forma). Nunca se vuelve a pedir en otro lado.
- **Sin fricción tecnológica.** El público no quiere "aprender la app" —
  quiere cotizar. Nada de curva de aprendizaje, nada de jerga, nada de
  configuración previa que no sea imprescindible.
- **Cada feature se gana su lugar.** Si no ayuda a cotizar más rápido o a
  justificar el precio final (trazabilidad), no entra.

## Cómo trabajamos (Ángel + Claude)

- El plano (canvas) tiene una copia independiente en HTML suelto para que
  Ángel lo revise y lo desarrolle por su cuenta, sin depender de correr toda
  la app. Cuando quiere, la trae de vuelta para integrarla acá.
- Las notas de revisión (en Cómputo/Salida) **no son un diario**: son
  directrices. Ángel las escribe, Claude las lee, comenta ítem por ítem cómo
  las va a resolver (o si entendió bien) y recién ahí ejecuta.
- Ningún cambio se hace "porque sí": se piensa contra este documento antes
  de tocar código, para no ir haciendo una cosa acá y deshaciendo otra allá
  sin sentido de conjunto.

## Documentos viejos

`ROADMAP.md` y `SESION.md` quedan como bitácora histórica (describen una
etapa anterior de la app, con reglas y prioridades que ya cambiaron). Este
archivo es el que manda de acá en adelante.
