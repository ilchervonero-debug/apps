# APU Demoliciones — especificación (fuente de verdad)

> Datos para la futura **app Demoliciones** (se fusionará con otra app de APU / costos).
> Origen: guía propia de demoliciones para reformas residenciales en Uruguay.
> Objetivo: calcular por rubro la **mano de obra (H Oficial + H Peón)**, los **consumibles/equipos**,
> el **volumen de escombro** y las **volquetas**, y cerrar el **precio con cascada** (herramientas + GG + beneficio).
> Los precios de hora salen de la **Config del usuario** (no se hardcodean valores de venta).

---

## 1. Modelo de cálculo

**Inputs por rubro (interfaz simple):**
1. Cantidad (en la unidad del rubro: M², M³, ML, Un o Gl).
2. Dificultad de acarreo → multiplicador: **1.0** baja (PB, <20 m) · **1.3** media (pasillos largos/giros) · **1.4** alta (plantas altas por escalera).
3. Insalubridad / altura → multiplicador: **1.0** no aplica · **1.3** sí (lana de vidrio, hollín o >3 m de altura).

**Fórmulas:**
```
Horas Oficial = Cantidad × Hofi_base × multAcarreo × multInsalubridad
Horas Peon    = Cantidad × Hpeon_base × multAcarreo × multInsalubridad
Costo MO      = Horas Oficial × $hora_oficial + Horas Peon × $hora_peon     (precios de Config)

Costo Herr. Menores = (rubro pesado) ? Costo MO × 0.10 : 0          // hormigón, contrapiso, estufas, hierro
Subtotal Directo    = Costo MO + Costo Herr. Menores + Materiales/Consumibles
+ Gastos Generales  = Subtotal Directo × 0.15                        // 12–15 %, usar 15 %
Precio de Venta     = (Subtotal Directo + GG) × (1 + %Beneficio)     // %Beneficio de Config
```

**Escombro y volquetas:**
```
Volumen suelto = Cantidad × espesor_teorico(m) × factor_esponjamiento
Volquetas      = ceil( Volumen suelto / 5 )         // volqueta estándar ≈ 5 m³
```
Factores de **esponjamiento**: mampostería/revoque **×1.4** · hormigón/contrapiso **×1.5** · tabiquería/cielorraso seco **×1.8** (mucho aire por perfiles/placas).

> Acarreo interno base = hasta 20 m horizontales en PB. Planta alta / pasillos largos → +30 % a +40 % H Peón (ya cubierto por multAcarreo).

---

## 2. Matriz de rendimientos por rubro

| # | Rubro | Unidad | H Ofi | H Peón | Esponj. | Pesado (10%) | Bolsas/u | Consumible clave |
|---|-------|--------|------|--------|---------|--------------|----------|------------------|
| 1 | Romper piso (solo revestimiento) | M² | 0.00 | 0.45 | 1.3 | no | 1–1.5 | rotomartillo liviano 5 kg, disco |
| 2 | Contrapiso grueso / platea | M² (≤12 cm; si más → M³) | 0.80 | 1.00 | 1.5 | **sí** | 4–5 | rotomartillo pesado 11–16 kg, puntas |
| 3 | Tabiques livianos (yeso/placas) | M² | 0.00 | 0.40 | 1.8 | no | 2 | atornilladora, amoladora, hojas sierra |
| 4 | Pared mampostería ≤15 cm | M² | 0.80 | 1.10 | 1.4 | no | 4 | rotomartillo 5–11 kg, disco diamante 9" |
| 5 | Muro de carga ≥30 cm | M³ | 4.50 | 5.50 | 1.4 | no | 25–30 | rotomartillo pesado, andamio, apuntalamiento |
| 6 | Hormigón armado (vigas/columnas/losas) | M³ | 18.00 | 22.00 | 1.5 | **sí** | 40 | martillo rompepavimentos 16–30 kg, discos metal (≈5), oxicorte |
| 7 | Hierro estructural (IPN/columnas) | ML (o Un) | 1.35 | 1.65 | 1.1 | **sí** | — | amoladora 9", discos metal (≈0.7/ML), aparejo/tirfor, puntales |
| 8 | Estufas / parrilleros | Un (o Gl) | 11.00 | 13.00 | 1.4 | **sí** | 45–60 | rotomartillo 11 kg, amoladora 9", nylon+cinta (sellado hollín) |
| 9 | Cielorraso suspendido (yeso/madera/PVC) | M² | 0.35 (Medio Ofi) | 0.35 | 1.8 | no | 1.5 | atornilladora, amoladora 4.5", andamio liviano |
| 10a | Abertura a conservar (desmonte técnico) | Un | 1.00 | 1.00 | — | no | — | amoladora 4.5" fina, cuñas, palancas |
| 10b | Abertura a descartar | Un | 0.00 | 0.50 | — | no | — | marra, cortafierro, amoladora 9" |
| 11 | Baño integral | Gl (3–5 m²) | 14.00 | 18.00 | 1.4 | no | 50 | rotomartillo mediano, tapones agua 1/2"–3/4"+teflón |
| 12 | Cocina integral | Gl (6–10 m²) | 16.00 | 20.00 | 1.5 | no | 45 | rotomartillo, discos diamante+metal, tapón gas certificado+sellador |

> "Medio Oficial" en cielorraso: tratar como una categoría de MO propia o asimilar a Oficial según Config.
> Aberturas y baño/cocina no usan volqueta por esponjamiento de espesor (cargar bolsas como dato directo).

---

## 3. Criterios y recargos por rubro (notas de obra)

- **1. Romper piso:** corte perimetral con amoladora en zócalos/aberturas que se conservan; atacar con cincel plano a 15–20°. *Recargo:* monolítico lavado / piso hecho in situ = tan duro como contrapiso → aplicar rendimiento del rubro 2. Losa radiante a conservar → ×3 o por administración.
- **2. Contrapiso/platea:** cuadricular con amoladora 9" en paños de 1×1 m, atacar a 90°; peón corta malla electrosoldada con cizalla.
- **3. Tabique yeso:** encintar cables antes de golpear; quebrar placa entre perfiles, cortar papel con trincheta. *Clave cobro:* enderezar/atar perfiles en manojos para no desperdiciar volqueta. *Recargo:* lana de vidrio = +30 % MO (trabajo insalubre).
- **4. Pared ≤15 cm:** corte testigo vertical con amoladora 9" (junta de dilatación), derribo de arriba hacia abajo, regar agua. Si es portante, incluir apuntalamiento. *Recargo:* instalaciones activas empotradas +20 %.
- **5. Muro ≥30 cm:** **apuntalamiento obligatorio** (puntales telescópicos + vigas de reparto) antes del primer ladrillo si sostiene techo/losa; descalce de trabas a mano. Si arriba hay viga de HºAº → esa parte se cobra con rubro 6.
- **6. Hormigón armado:** apuntalar masivamente losas/vigas adyacentes; corte perimetral de aislación; **descarnar el hormigón y recién después cortar el hierro** (nunca al revés); trozar varillas. *Recargo:* doble armadura/malla cima +30 %; demolición en altura sin tirar al piso (balde por balde) +100 % H Peón. Hierro viejo = recupero (chatarra).
- **7. Hierro estructural:** verificar que el perfil esté **libre de carga** (si está comprimido, al cortar se cierra y atrapa/estalla el disco); suspender con eslingas/aparejo antes del corte; cortar en tramos de 1.5–2 m; descenso controlado. *Recargo:* hierro fundido antiguo (<1930) +50 % H Ofi.
- **8. Estufas/parrilleros:** **sellar hermético** boca y accesos con nylon+cinta (hollín volátil mancha todo); desarmar chimenea de arriba hacia abajo desde el techo; tapiar el hueco del techo. *Recargo:* herrajes inox/hierro fundido a conservar +2 H Ofi; chimenea que cruza 2 plantas +50 %.
- **9. Cielorraso:** **cortar la luz** del sector (cables/cajas ocultas); retirar artefactos primero; gafas estancas+mascarilla. *Recargo:* lana de vidrio +30 %; altura >3 m +25 %.
- **10a. Abertura a conservar:** descolgar hojas; localizar grapas; cortar la grapa con disco fino en la junta (no romper la pared); descalce con cuñas. *Recargo:* vidrios fijos grandes a salvar +40 % H Ofi; marco amurado en HºAº → cobrar por administración.
- **10b. Abertura a descartar:** dos cortes verticales en parantes, arrancar con marra. Rendimiento alto, costo bajo.
- **11. Baño:** cerrar llave general y purgar; desmontar artefactos; **tapones roscados con teflón** y **prueba de presión** (abrir llave general 5 min) antes de picar; romper piso para liberar sifón/desagües. *Recargo:* bañera de hierro fundido +2 H Peón; volqueta lejana +30 %.
- **12. Cocina:** **punto crítico: condenar gas** (cerrar válvula, tapón roscado con sellador de gas) antes de golpear; desmontar muebles; cortar mesada de granito con amoladora 9" cada 1 m (tramos manejables); picar revestimientos/piso. *Recargo:* mesada sobre muretes de ladrillo +3 H Peón; campana de conducto rígido al exterior +2 H Ofi.

---

## 4. Implantación y protecciones (rubro de inicio, fijo o por ML)

Cotizar como global de inicio o por metro lineal:
- **Vallado perimetral** (fenólicos/chapas/tirantería, altura mín. 2 m hacia vía pública).
- **Pantallas/lonas** antipolvo (media sombra o polietileno hacia linderos).
- **Señalización y seguridad** (carteles "Peligro Demolición", cintas, extintores).
- MO: Oficial + Medio Oficial (carpintería/armado). MAT: madera, puntales, chapas, clavos, alambre, lona.

---

## 5. Checklist de obra (capataz) — orden cronológico

**Fase 1 — Implantación y seguridad previa:** vallado ≥2 m · mallas antipolvo · corte de energía (verificar con buscapolos) · corte de agua + purgado · corte y sellado de gas · condena de agua con tapones+teflón · prueba de presión 5 min · entrega de EPP (casco, calzado, guantes, gafas estancas).
**Fase 2 — Apuntalamiento y desmonte limpio:** revisar cargas/sentido de vigas · puntales sobre tablones de reparto · retiro de aberturas a conservar (cortar grapas) · acopio protegido · desmonte de artefactos · sellado contra hollín (estufas).
**Fase 3 — Demolición:** corte testigo con amoladora 9" · secuencia de arriba hacia abajo (prohibido socavar bases) · cuadricular contrapisos 1×1 m · descarnar hormigón antes de cortar hierro · verificar carga cero en hierro estructural · descenso controlado de piezas pesadas.
**Fase 4 — Logística y desescombro:** humedecer cascote · separar en origen (chatarra/madera/cascote) · compactar/atar chatarra seca · llenar bolsas a peso manejable (mitad si es hormigón) · proteger pasajes con tablones · cargar volqueta uniforme (pesado abajo).

---

## 6. Estructura comercial del precio

```
Costo Directo   = MO + Alquiler neto Equipos + Consumibles directos (bolsas/tapones/nylon)
Costo Operación = Costo Directo + 10 % (herramientas menores, solo rubros pesados)
Precio Venta    = Costo Operación + 15 % (GG e imprevistos) + % Beneficio
```
- **Herramientas menores:** 8–12 % (usar **10 %**) sobre MO/EQ en rubros pesados (puntas SDS-Max, discos diamante 9", marras, carretillas).
- **GG e imprevistos:** 12–15 % (usar **15 %**) — fisuras en linderos por vibración, cañerías obsoletas ocultas, multas por ruido/limpieza.
- **Fletes/volquetas** ($3.500–$5.000 por viaje, ref.): sumar como **ítem global aparte**, no prorratear en el unitario.

---

## 7. Notas de implementación (app)

- **Data model** `RUBROS_DEMO`: `{ key, label, unidad, hOfi, hPeon, esponjamiento, espesorTeorico, pesado:bool, bolsasU, consumibles[] }` (valores de la tabla §2).
- Precios de hora (Oficial/Peón/Medio Oficial), % beneficio, capacidad de volqueta (5 m³) y % GG/herramientas → en **Config** (reusar el patrón de APU CORE).
- Salida por rubro: H Ofi, H Peón, Costo MO, Herr. menores, GG, **volumen de escombro**, **volquetas**, Precio de venta.
- Resumen de obra: suma de rubros + ítem global de fletes/volquetas.
- **Fusión futura:** esta app Demoliciones se integrará con otra de APU/costos → mantener el mismo esquema de Config y de "rubros con rendimiento" para que las matrices sean compatibles.
- UI/estilo familia iLStorage: blanco/gris/rojo (#FE0000), texto negro, botones grandes, íconos flat rojos sin fondo, header con nombre a la izquierda + panel (versión / Volver a iLStorage), service worker network-first.

---

## 8. Normativa (referencia mínima — no es foco operativo)

Permiso de demolición en la Intendencia si supera ~4 m² (Decreto 213/025); firma técnica (Arq./Ing. Civil, Decreto 89/95); gestión de RCD con empresas registradas en Min. de Ambiente (Decreto 213/025); EPP y protección a terceros, vallado ≥2 m (Reglamento Gral. de Obras 2018); corte de servicios antes de iniciar. *Para asesoramiento legal, consultar a un profesional.*
