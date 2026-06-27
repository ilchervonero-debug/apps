// ── Cómputo (BOM) iLFrame — adapta los parámetros de SketchFramer ──
// Replica el criterio de SketchFramer: por panel, montantes (perfil tipo 0) y
// soleras (tipo 1), refuerzos de abertura = montantes/soleras extra, placas por
// m², materiales de sistema por m²/ml × multiplicador, y peso por kg/m del perfil.

import { CU_SECTIONS } from '../data/profiles'
import { LAYER_TEMPLATES } from '../data/layers'
import { panelPolygon, polygonArea } from '../store/drawingStore'

// altura del contorno (mm) en una posición x (0..width)
function topYat(topPath, x) {
  const p = topPath
  for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0] = p[i], [x1, y1] = p[i + 1]
    if (x >= Math.min(x0, x1) && x <= Math.max(x0, x1) && x1 !== x0) {
      const t = (x - x0) / (x1 - x0)
      return y0 + t * (y1 - y0)
    }
  }
  return p[p.length - 1][1]
}

function sectionOf(project) {
  const norm = CU_SECTIONS[project.profileNorm] || CU_SECTIONS.cu_1
  const [h, t] = (project.profileSection || '100_0.95').split('_')
  return (norm.C || []).find((c) => `${c.h}_${c.t}` === `${h}_${t}`) || norm.C[0]
}

const layer = (id) => LAYER_TEMPLATES.find((l) => l.id === id)

// BOM de un panel
export function panelBOM(panel, project) {
  const sec = sectionOf(project)
  const kgm = sec ? sec.kg : 1.5
  const spacing = project.studSpacing || 400
  const w = panel.width
  const top = panel.topPath
  const maxH = Math.max(...top.map((p) => p[1]))

  // ── Montantes (tipo 0): repartidos ≤ separación, cortados a la silueta ──
  const n = Math.max(2, Math.floor(w / spacing) + 1)
  let montantesMl = 0
  for (let i = 0; i < n; i++) {
    const x = (i * w) / (n - 1)
    montantesMl += topYat(top, x) / 1000
  }

  // ── Soleras (tipo 1): inferior = ancho; superior = contorno ──
  let topLen = 0
  for (let i = 0; i < top.length - 1; i++) topLen += Math.hypot(top[i + 1][0] - top[i][0], top[i + 1][1] - top[i][1])
  const solerasMl = (w + topLen) / 1000

  // ── Refuerzos de abertura (montantes/soleras extra) ──
  let refMl = 0
  let lintelMl = 0
  for (const op of panel.openings || []) {
    refMl += 2 * (maxH / 1000) // 2 king studs (carga, altura completa)
    refMl += 2 * ((op.sill + op.height) / 1000) // 2 jack studs (hasta el hueco)
    lintelMl += 2 * (op.width / 1000) // dintel doble
    if (op.kind === 'window') lintelMl += op.width / 1000 // antepecho
  }

  const aceroMl = montantesMl + solerasMl + refMl + lintelMl
  const aceroKg = aceroMl * kgm

  // ── Superficie neta (cara) descontando aberturas ──
  const gross = polygonArea(panelPolygon(panel)) / 1e6
  const opM2 = (panel.openings || []).reduce((a, o) => a + (o.width * o.height) / 1e6, 0)
  const netM2 = Math.max(0, gross - opM2)

  // ── Placas / revestimiento / aislante por cara (del tipo de muro) ──
  const wt = project.wallTypes.find((t) => t.id === (panel.typeId || project.wallTypes[0]?.id))
  const materials = {}
  const addMat = (id, qty, unit) => { if (!materials[id]) materials[id] = { id, qty: 0, unit }; materials[id].qty += qty }
  const faceLayers = [...(wt?.faces?.interior || []), ...(wt?.faces?.exterior || [])]
  for (const id of faceLayers) {
    const l = layer(id)
    if (!l) continue
    const waste = 1 + (l.waste_pct || 0) / 100
    if (l.unit === 'placa' || l.unit === 'sheet') addMat(id, Math.ceil((netM2 / 2.88) * waste), 'placas')
    else if (l.unit === 'ml') addMat(id, +(((w / 1000) * (maxH / 1000) / 0.4) * waste).toFixed(1), 'ml') // alfajías ~cada 40cm
    else addMat(id, +(netM2 * waste).toFixed(2), 'm²')
  }

  // ── Tornillos: ~20 por m² de placa ──
  const boardM2 = faceLayers.filter((id) => ['placa', 'sheet'].includes(layer(id)?.unit)).length * netM2
  const tornillos = Math.round(boardM2 * 20)

  return {
    id: panel.id,
    netM2: +netM2.toFixed(2),
    montantesMl: +montantesMl.toFixed(2),
    solerasMl: +solerasMl.toFixed(2),
    refuerzosMl: +(refMl + lintelMl).toFixed(2),
    aceroMl: +aceroMl.toFixed(2),
    aceroKg: +aceroKg.toFixed(1),
    placas: Object.values(materials).filter((m) => m.unit === 'placas').reduce((a, m) => a + m.qty, 0),
    tornillos,
    materials: Object.values(materials),
    perfil: sec ? `${sec.h}x${sec.w}x${sec.t}` : '—',
  }
}

export function projectBOM(panels, project) {
  const rows = panels.map((p) => panelBOM(p, project))
  const total = rows.reduce((a, r) => ({
    netM2: a.netM2 + r.netM2,
    aceroMl: a.aceroMl + r.aceroMl,
    aceroKg: a.aceroKg + r.aceroKg,
    placas: a.placas + r.placas,
    tornillos: a.tornillos + r.tornillos,
  }), { netM2: 0, aceroMl: 0, aceroKg: 0, placas: 0, tornillos: 0 })
  for (const k in total) total[k] = +total[k].toFixed(k === 'placas' || k === 'tornillos' ? 0 : 2)
  return { rows, total }
}
