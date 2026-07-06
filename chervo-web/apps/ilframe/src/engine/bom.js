// ── Cómputo (BOM) iLFrame — adapta los parámetros de SketchFramer ──
// Por panel: montantes (tipo 0) + soleras (tipo 1), refuerzos de abertura =
// perfiles extra, placas/aislante/revestimiento por cara, terminación por m²,
// tornillos estructurales (montante-solera) y de placa, peso por kg/m del perfil.

import { PROFILE_SECTIONS } from '../data/profiles'
import { LAYER_TEMPLATES } from '../data/layers'
import { panelPolygon, polygonArea } from '../store/drawingStore'

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
  const norm = PROFILE_SECTIONS[project.profileNorm] || PROFILE_SECTIONS.cu_1
  const [h, t] = (project.profileSection || '100_0.95').split('_')
  return (norm.C || []).find((c) => `${c.h}_${c.t}` === `${h}_${t}`) || norm.C[0]
}
const layer = (id) => LAYER_TEMPLATES.find((l) => l.id === id)

export function panelBOM(panel, project) {
  const sec = sectionOf(project)
  const kgm = sec ? sec.kg : 1.5
  const spacing = project.studSpacing || 400
  const w = panel.width
  const top = panel.topPath
  const maxH = Math.max(...top.map((p) => p[1]))

  // Montantes repartidos ≤ separación, cortados a la silueta
  const studs = Math.max(2, Math.floor(w / spacing) + 1)
  let montantesMl = 0
  for (let i = 0; i < studs; i++) montantesMl += topYat(top, (i * w) / (studs - 1)) / 1000

  // Soleras: inferior = ancho; superior = contorno
  let topLen = 0
  for (let i = 0; i < top.length - 1; i++) topLen += Math.hypot(top[i + 1][0] - top[i][0], top[i + 1][1] - top[i][1])
  const solerasMl = (w + topLen) / 1000

  // Refuerzos de abertura: king + jack + dintel + antepecho
  let refMl = 0, refStuds = 0
  for (const op of panel.openings || []) {
    refMl += 2 * (maxH / 1000); refStuds += 2 // king
    refMl += 2 * ((op.sill + op.height) / 1000); refStuds += 2 // jack
    refMl += 2 * (op.width / 1000) // dintel doble
    if (op.kind === 'window') refMl += op.width / 1000 // antepecho
  }

  const aceroMl = montantesMl + solerasMl + refMl
  const aceroKg = aceroMl * kgm

  // Superficie neta
  const gross = polygonArea(panelPolygon(panel)) / 1e6
  const opM2 = (panel.openings || []).reduce((a, o) => a + (o.width * o.height) / 1e6, 0)
  const netM2 = Math.max(0, gross - opM2)

  // Materiales por cara (del tipo de muro)
  const wt = project.wallTypes.find((t) => t.id === (panel.typeId || project.wallTypes[0]?.id))
  const faceLayers = [...(wt?.faces?.interior || []), ...(wt?.faces?.exterior || [])]
  const mats = []
  let boardFaces = 0
  for (const id of faceLayers) {
    const l = layer(id); if (!l) continue
    const waste = 1 + (l.waste_pct || 0) / 100
    if (l.unit === 'placa' || l.unit === 'sheet') { mats.push({ name: l.name, qty: Math.ceil((netM2 / 2.88) * waste), unit: 'u' }); boardFaces++ }
    else if (l.unit === 'ml') mats.push({ name: l.name, qty: +(((w / 1000) * (maxH / 1000) / 0.4) * waste).toFixed(1), unit: 'ml' })
    else mats.push({ name: l.name, qty: +(netM2 * waste).toFixed(2), unit: 'm²' })
  }
  const placas = mats.filter((m) => m.unit === 'u').reduce((a, m) => a + m.qty, 0)

  // Terminación (por m² de placa) — masilla, cinta, enduido, imprimación + pintura
  const coats = 2
  if (boardFaces > 0) {
    const a = netM2 * boardFaces
    mats.push({ name: 'Masilla/estucado', qty: +(a * 1.0).toFixed(1), unit: 'kg' })
    mats.push({ name: 'Enduido', qty: +(a * 1.5).toFixed(1), unit: 'kg' })
    mats.push({ name: 'Cinta de juntas', qty: +(a * 0.3).toFixed(1), unit: 'ml' })
    mats.push({ name: 'Imprimación', qty: +((a / 10)).toFixed(1), unit: 'lt' })
    mats.push({ name: `Pintura (${coats} manos)`, qty: +((a * coats / 10)).toFixed(1), unit: 'lt' })
  }

  // Tornillos: estructurales (montante↔solera, 4 por montante) + placa (~20/m²)
  const tornillosEst = (studs + refStuds) * 4
  const tornillosPlaca = Math.round(netM2 * boardFaces * 20)

  return {
    id: panel.id, perfil: sec ? `${sec.h}x${sec.w}x${sec.t}` : '—',
    netM2: +netM2.toFixed(2), studs,
    montantesMl: +montantesMl.toFixed(2), solerasMl: +solerasMl.toFixed(2), refuerzosMl: +refMl.toFixed(2),
    aceroMl: +aceroMl.toFixed(2), aceroKg: +aceroKg.toFixed(1),
    placas, tornillosEst, tornillosPlaca, tornillos: tornillosEst + tornillosPlaca,
    mats,
  }
}

export function projectBOM(panels, project) {
  const rows = panels.map((p) => panelBOM(p, project))
  const total = rows.reduce((a, r) => ({
    netM2: a.netM2 + r.netM2, aceroMl: a.aceroMl + r.aceroMl, aceroKg: a.aceroKg + r.aceroKg,
    placas: a.placas + r.placas, tornillos: a.tornillos + r.tornillos,
  }), { netM2: 0, aceroMl: 0, aceroKg: 0, placas: 0, tornillos: 0 })
  for (const k in total) total[k] = +total[k].toFixed(['placas', 'tornillos'].includes(k) ? 0 : 2)

  // Materiales agregados (por nombre+unidad)
  const agg = {}
  for (const r of rows) for (const m of r.mats) {
    const key = m.name + '|' + m.unit
    if (!agg[key]) agg[key] = { name: m.name, unit: m.unit, qty: 0 }
    agg[key].qty += m.qty
  }
  const sec = rows[0]?.perfil
  const materials = [
    { name: `Acero (perfil ${sec || ''})`, unit: 'kg', qty: total.aceroKg },
    { name: 'Acero (longitud)', unit: 'ml', qty: total.aceroMl },
    ...Object.values(agg).map((m) => ({ ...m, qty: +m.qty.toFixed(2) })),
    { name: 'Tornillos', unit: 'u', qty: total.tornillos },
  ]
  return { rows, total, materials }
}
