// ── Costo del proyecto (APU real) ──────────────────────────────
// Valoriza el cómputo (cantidades reales de cada elemento) con lo definido
// en el Core: cuadrilla (SUNCA + BPS + desgaste de herramientas) + tarea
// asignada a cada tipo de elemento (rendimiento m²/ml por día) + materiales
// (precio por presentación comercial, compra en paquetes enteros) +
// aportes/impuestos. El cómputo (computo.js) no cambia: esto solo lo valoriza.

import { computoProyecto } from './computo'
import { SEED_DESPERDICIO_PCT } from '../data/coreSeed'
import { PROFILE_SECTIONS } from '../data/profiles'

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

// ── Matching de materiales ──────────────────────────────────────
// Las unidades no siempre se escriben igual ('u'/'unid', 'm²'/'m2',
// 'lt'/'litro') y el acero se nombra por MEDIDA en el cómputo ("Acero
// perfil 100x40x0.95") pero por PRODUCTO en el catálogo ("Perfil PGC
// 90x0.94"). Acá se normaliza y se matchea por lo que corresponda.
const normUnit = (u) => {
  const x = (u || '').toLowerCase().trim()
  if (x === 'u' || x === 'unid' || x === 'unidad') return 'u'
  if (x === 'm²' || x === 'm2') return 'm2'
  if (x === 'lt' || x === 'litro' || x === 'l') return 'l'
  if (x === 'm³' || x === 'm3') return 'm3'
  return x
}
const normName = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
const ACERO_RE = /^acero perfil ([\d.]+)x([\d.]+)x([\d.]+)$/

// kg/m real de un perfil h,w,t (buscado en cualquier norma) - para poder
// convertir el acero de KG (como lo computa el computo) a ML (como lo
// vende la barraca) antes de armar los paquetes.
function kgPorMetro(h, w, t) {
  for (const norm of Object.values(PROFILE_SECTIONS)) {
    const sec = (norm.C || []).find((s) => Math.abs(s.h - h) < 1 && Math.abs(s.w - w) < 1 && Math.abs(s.t - t) < 0.05)
    if (sec) return sec.kg
  }
  return null
}

// Busca el material del Core que valoriza una línea del cómputo.
function matchMaterial(m, materialesCore) {
  const nm = normName(m.name)
  const um = normUnit(m.unit)
  const aceroMatch = nm.match(ACERO_RE)
  if (aceroMatch) {
    const h = +aceroMatch[1], t = +aceroMatch[3]
    const byPerfil = materialesCore.find((x) => x.perfilH != null && Math.abs(x.perfilH - h) < 1 && Math.abs(x.perfilT - t) < 0.05)
    if (byPerfil) return byPerfil
  }
  if (nm.includes('omega')) {
    const byOmega = materialesCore.find((x) => x.perfilOmega)
    if (byOmega) return byOmega
  }
  const exact = materialesCore.find((x) => normName(x.name) === nm && normUnit(x.unit) === um)
  if (exact) return exact
  return materialesCore.find((x) => normUnit(x.unit) === um && (normName(x.name).includes(nm) || nm.includes(normName(x.name))))
}

// Grupos que se costean pieza por pieza contando operaciones reales
// (cortes de perfil + tornillos o soldadura) en vez de una tarea m²/ml.
export const GRUPOS_RETICULADOS = ['cerchas', 'pilares']

// Costo de mano de obra de UNA pieza reticulada (cercha o columna),
// contando cortes + conexiones (tornillos, o soldadura con piso de
// jornal del herrero). horasJornada convierte el costo diario en $/hora.
function costoPiezaReticulada(fila, cuadrilla, operaciones) {
  const horasJornada = cuadrilla.horasJornada || 8
  const costoDiarioReal = (cuadrilla.costoDiarioLiquido || 0) * (cuadrilla.multiplicadorBPS || 1)
  const costoHora = costoDiarioReal / horasJornada
  const rendCortes = operaciones.cortesPorHora || 0
  const rendTornillos = operaciones.tornillosPorHora || 0
  if (!rendCortes || !rendTornillos) return { horas: 0, costo: 0, definido: false }

  const { cortes, conexiones } = fila.ops || { cortes: 0, conexiones: 0 }
  const horasCortes = cortes / rendCortes
  if (fila.soldada) {
    const tornillosEquiv = conexiones * (operaciones.soldaduraEquivTornillos || 5)
    const horas = horasCortes + tornillosEquiv / rendTornillos
    const costoCalc = horas * costoHora * (1 + (cuadrilla.factorHerramientas || 0))
    const piso = operaciones.jornalHerrero || costoDiarioReal
    return { horas: +horas.toFixed(2), costo: +Math.max(costoCalc, piso).toFixed(0), definido: true }
  }
  const tornillos = conexiones * (operaciones.tornillosPorConexion || 4)
  const horas = horasCortes + tornillos / rendTornillos
  const costo = horas * costoHora * (1 + (cuadrilla.factorHerramientas || 0))
  return { horas: +horas.toFixed(2), costo: +costo.toFixed(0), definido: true }
}

export function costoProyecto(state, project, core) {
  const { grupos, materiales, totales } = computoProyecto(state, project)
  const tareas = core?.tareas || []
  const rendimientos = core?.rendimientos || {}
  const materialesCore = core?.materiales || []
  const aportes = core?.aportes || []
  const cuadrilla = core?.cuadrilla || {}
  const operaciones = core?.operaciones || {}
  const desperdicioPct = core?.desperdicioPct ?? SEED_DESPERDICIO_PCT

  const costoDiarioReal = (cuadrilla.costoDiarioLiquido || 0) * (cuadrilla.multiplicadorBPS || 1)
  const costoPorUnidad = (tarea) => (tarea && tarea.rendimiento ? costoDiarioReal / tarea.rendimiento : 0)

  const manoObraPorGrupo = grupos.map((g) => {
    // Cerchas y columnas reticuladas: costo por pieza (cortes + conexiones),
    // no por tarea m²/ml — ya no hace falta vincularlas en el Core.
    if (GRUPOS_RETICULADOS.includes(g.tipo)) {
      let costo = 0, definido = true, cortesTotal = 0
      for (const f of g.filas) {
        const r = costoPiezaReticulada(f, cuadrilla, operaciones)
        if (!r.definido) definido = false
        costo += r.costo
        cortesTotal += (f.ops || {}).cortes || 0
      }
      return { tipo: g.tipo, label: g.label, unidad: 'cortes', cantidad: cortesTotal, tarea: 'Por pieza (cortes + conexiones)', costo: +costo.toFixed(0), definido }
    }
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
    const found = matchMaterial(m, materialesCore)
    if (!found || !found.price) { faltaMateriales = true; return { ...m, price: 0, paquetes: 0, monto: 0 } }
    // El acero se computa en KG pero se vende por METRO (tira); si el
    // match fue por medida de perfil, convertir antes de armar paquetes.
    let qty = m.qty
    const aceroMatch = normName(m.name).match(ACERO_RE)
    if (aceroMatch && found.perfilH != null) {
      const kgm = kgPorMetro(+aceroMatch[1], +aceroMatch[2], +aceroMatch[3])
      if (kgm) qty = m.qty / kgm
    }
    const qtyConDesperdicio = qty * (1 + desperdicioPct / 100)
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
