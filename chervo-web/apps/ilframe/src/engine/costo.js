// ── Costo del proyecto (APU real) ──────────────────────────────
// Valoriza el cómputo (cantidades reales de cada elemento) con lo definido
// en el Core: cuadrilla (SUNCA + BPS + desgaste de herramientas) + tarea
// asignada a cada tipo de elemento (rendimiento m²/ml por día) + materiales
// (precio por presentación comercial, compra en paquetes enteros) +
// aportes/impuestos. El cómputo (computo.js) no cambia: esto solo lo valoriza.

import { computoProyecto } from './computo'
import { SEED_DESPERDICIO_PCT } from '../data/coreSeed'

// Un grupo por tipo de elemento del cómputo, con la unidad en que se mide
// su avance de mano de obra (m² de superficie o ml de pieza instalada).
export const GRUPOS_APU = [
  { tipo: 'muros', label: 'Muros', unidad: 'm2' },
  { tipo: 'vigas', label: 'Vigas', unidad: 'ml' },
  { tipo: 'cerchas', label: 'Cerchas', unidad: 'ml' },
  { tipo: 'pilares', label: 'Pilares / Columnas', unidad: 'ml' },
  { tipo: 'techos', label: 'Techos / Cubiertas', unidad: 'm2' },
  { tipo: 'losas', label: 'Losas / Entrepisos', unidad: 'm2' },
]

// Cantidad de un grupo, en la unidad que corresponda (m2 o ml) según fila
function cantidadGrupo(grupo, unidad) {
  return grupo.filas.reduce((a, f) => a + (unidad === 'm2' ? (f.m2 || 0) : (f.ml || 0)), 0)
}

export function costoProyecto(state, project, core) {
  const { grupos, materiales, totales } = computoProyecto(state, project)
  const tareas = core?.tareas || []
  const rendimientos = core?.rendimientos || {}
  const materialesCore = core?.materiales || []
  const aportes = core?.aportes || []
  const cuadrilla = core?.cuadrilla || {}
  const desperdicioPct = core?.desperdicioPct ?? SEED_DESPERDICIO_PCT

  const costoDiarioReal = (cuadrilla.costoDiarioLiquido || 0) * (cuadrilla.multiplicadorBPS || 1)
  const costoPorUnidad = (tarea) => (tarea && tarea.rendimiento ? costoDiarioReal / tarea.rendimiento : 0)

  const manoObraPorGrupo = grupos.map((g) => {
    const meta = GRUPOS_APU.find((m) => m.tipo === g.tipo) || { unidad: 'm2' }
    const rend = rendimientos[g.tipo]
    const tarea = rend?.tareaId ? tareas.find((t) => t.id === rend.tareaId) : null
    const unidad = tarea?.unidad || meta.unidad
    const cantidad = cantidadGrupo(g, unidad)
    if (!tarea || !tarea.rendimiento) {
      return { tipo: g.tipo, label: g.label, unidad, cantidad: +cantidad.toFixed(2), tarea: null, costo: 0, definido: false }
    }
    const costoBase = cantidad * costoPorUnidad(tarea)
    const costo = costoBase * (1 + (cuadrilla.factorHerramientas || 0))
    return { tipo: g.tipo, label: g.label, unidad, cantidad: +cantidad.toFixed(2), tarea: tarea.nombre, costo: +costo.toFixed(0), definido: true }
  })

  const costoManoObra = manoObraPorGrupo.reduce((a, g) => a + g.costo, 0)
  const faltaManoObra = manoObraPorGrupo.some((g) => !g.definido && g.cantidad > 0)

  // Materiales: se compran en paquetes enteros (redondeo hacia arriba),
  // con el desperdicio global aplicado antes de convertir a paquetes.
  let costoMateriales = 0
  let faltaMateriales = false
  const materialesValorizados = materiales.map((m) => {
    const found = materialesCore.find((x) => x.name === m.name && x.unit === m.unit)
    if (!found || !found.price) { faltaMateriales = true; return { ...m, price: 0, paquetes: 0, monto: 0 } }
    const qtyConDesperdicio = m.qty * (1 + desperdicioPct / 100)
    const paquetes = Math.ceil(qtyConDesperdicio / (found.rendimientoPaquete || 1))
    const monto = paquetes * found.price
    costoMateriales += monto
    return { ...m, price: found.price, paquetes, monto: +monto.toFixed(0) }
  })

  const subtotal = costoManoObra + costoMateriales
  const aportesAplicados = aportes.map((ap) => ({ name: ap.name, pct: ap.pct, monto: +(subtotal * (ap.pct || 0) / 100).toFixed(0) }))
  const totalAportes = aportesAplicados.reduce((a, x) => a + x.monto, 0)
  const total = subtotal + totalAportes

  return {
    totales,
    costoDiarioReal: +costoDiarioReal.toFixed(0),
    manoObraPorGrupo,
    costoManoObra: +costoManoObra.toFixed(0),
    materialesValorizados,
    costoMateriales: +costoMateriales.toFixed(0),
    subtotal: +subtotal.toFixed(0),
    aportesAplicados,
    total: +total.toFixed(0),
    faltaManoObra,
    faltaMateriales,
  }
}
