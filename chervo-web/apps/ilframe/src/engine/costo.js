// ── Costo del proyecto (APU) ───────────────────────────────────
// Valoriza el cómputo (cantidades reales de cada elemento) con lo definido
// en el Core: jornales SUNCA + leyes sociales (BPS, Ley 14.411) + rendimiento
// por grupo (unidades por jornal) + precio de materiales + aportes/impuestos.
// El cómputo (computo.js) no cambia: esto solo lo valoriza.

import { computoProyecto } from './computo'

// Un grupo por tipo de elemento del cómputo, con la unidad en que se mide
// su rendimiento de mano de obra (kg de acero montado, o m² de tabique).
export const GRUPOS_APU = [
  { tipo: 'muros', label: 'Muros', unidad: 'm²' },
  { tipo: 'vigas', label: 'Vigas', unidad: 'kg' },
  { tipo: 'cerchas', label: 'Cerchas', unidad: 'kg' },
  { tipo: 'pilares', label: 'Pilares / Columnas', unidad: 'kg' },
  { tipo: 'techos', label: 'Techos / Cubiertas', unidad: 'kg' },
  { tipo: 'losas', label: 'Losas / Entrepisos', unidad: 'kg' },
]

function cantidadGrupo(grupo) {
  return grupo.filas.reduce((a, f) => a + (grupo.tipo === 'muros' ? (f.m2 || 0) : (f.kg || 0)), 0)
}

export function costoProyecto(state, project, core) {
  const { grupos, materiales, totales } = computoProyecto(state, project)
  const manoObra = core?.manoObra || []
  const rendimientos = core?.rendimientos || {}
  const materialesCore = core?.materiales || []
  const aportes = core?.aportes || []
  const leyesPct = core?.leyesSocialesPct ?? 0

  const jornalCon = (catId) => {
    const cat = manoObra.find((c) => c.id === catId)
    if (!cat || !cat.jornal) return 0
    return cat.jornal * (1 + leyesPct / 100)
  }

  const manoObraPorGrupo = grupos.map((g) => {
    const meta = GRUPOS_APU.find((m) => m.tipo === g.tipo) || { unidad: 'kg' }
    const cantidad = cantidadGrupo(g)
    const rend = rendimientos[g.tipo]
    if (!rend || !rend.rendimiento || !rend.manoObraId) {
      return { tipo: g.tipo, label: g.label, unidad: meta.unidad, cantidad: +cantidad.toFixed(2), jornales: 0, costo: 0, definido: false }
    }
    const jornales = cantidad / rend.rendimiento
    const costo = jornales * jornalCon(rend.manoObraId)
    return { tipo: g.tipo, label: g.label, unidad: meta.unidad, cantidad: +cantidad.toFixed(2), jornales: +jornales.toFixed(2), costo: +costo.toFixed(0), definido: true }
  })

  const costoManoObra = manoObraPorGrupo.reduce((a, g) => a + g.costo, 0)
  const faltaManoObra = manoObraPorGrupo.some((g) => !g.definido && g.cantidad > 0)

  let costoMateriales = 0
  let faltaMateriales = false
  const materialesValorizados = materiales.map((m) => {
    const found = materialesCore.find((x) => x.name === m.name && x.unit === m.unit)
    const price = found?.price || 0
    if (!price) faltaMateriales = true
    const monto = price * m.qty
    costoMateriales += monto
    return { ...m, price, monto: +monto.toFixed(0) }
  })

  const subtotal = costoManoObra + costoMateriales
  const aportesAplicados = aportes.map((ap) => ({ name: ap.name, pct: ap.pct, monto: +(subtotal * (ap.pct || 0) / 100).toFixed(0) }))
  const totalAportes = aportesAplicados.reduce((a, x) => a + x.monto, 0)
  const total = subtotal + totalAportes

  return {
    totales,
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
