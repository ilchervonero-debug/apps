// ── Cómputo consolidado del proyecto ──────────────────────────
// Lee lo dibujado en el plano (canvas studio) y lo valoriza con el material
// definido en Componentes: cada pieza dibujada guarda el NOMBRE del tipo
// elegido (muro/cercha/columna/techo); acá se busca ese tipo en
// project.types (o project.wallTypes) para sacar los perfiles reales y
// calcular kg con los mismos motores de siempre (bom/trusses/pilares/beams).
// Devuelve { grupos, materiales, totales } para la pestaña Cómputo/Salida.

import { PROFILE_SECTIONS } from '../data/profiles'
import { panelBOM } from './bom'
import { beamKg } from './beams'
import { cerchaKg, cerchaTypeDef, trussGeometry } from './trusses'
import { columnaKg } from './pilares'

const secOf = (ref) => (PROFILE_SECTIONS[ref?.normId]?.C || [])[ref?.secIdx ?? 0]
const labelOf = (ref) => { const s = secOf(ref); return s ? `${s.h}x${s.w}x${s.t}` : '—' }
const findType = (list, name) => (list || []).find((t) => t.name === name) || (list && list[0])

// El canvas usa sus propios nombres de retícula (WARREN/X_CROSS/LADDER);
// el motor de columnas usa los de cercha (W/X/N…). Se traduce acá.
const PATRON_MAP = { WARREN: 'W', X_CROSS: 'X', LADDER: 'N' }

// Muro dibujado (studio) → shape que espera panelBOM
function wallToPanel(w, project) {
  const width = Math.max(1, Math.round(Math.hypot(w.pB[0] - w.pA[0], w.pB[1] - w.pA[1])))
  const topPath = w.peak
    ? [[0, w.hA || 2400], [Math.max(0, Math.min(width, Math.round(w.peak.x))), Math.round(w.peak.y)], [width, w.hB || 2400]]
    : [[0, w.hA || 2400], [width, w.hB || 2400]]
  const wt = (project.wallTypes || []).find((t) => t.name === w.tipo)
  const openings = (w.aberturas || []).map((a) => ({
    kind: a.type === 'puerta' ? 'door' : a.type === 'ventana' ? 'window' : 'other',
    width: a.w, height: a.h, sill: a.y,
  }))
  return { id: w.label, width, topPath, openings, typeId: wt ? wt.id : project.wallTypes?.[0]?.id }
}

export function computoProyecto(state, project) {
  const studio = state.studio || []
  const walls = studio.filter((o) => o.type === 'wall')
  const cerchasObj = studio.filter((o) => o.type === 'cercha' && o.modelo !== 'VIGA')
  const vigasObj = studio.filter((o) => o.type === 'cercha' && o.modelo === 'VIGA')
  const columnas = studio.filter((o) => o.type === 'columna')
  const techos = studio.filter((o) => o.type === 'roof')

  const steel = {}   // label de perfil -> kg
  const mats = {}    // nombre|unidad -> { name, unit, qty }
  let tornillos = 0
  const addSteel = (label, kg) => { if (!kg) return; steel[label] = (steel[label] || 0) + kg }
  const addMat = (name, unit, qty) => { if (!qty) return; const k = name + '|' + unit; if (!mats[k]) mats[k] = { name, unit, qty: 0 }; mats[k].qty += qty }

  const grupos = []

  // ── Muros ──
  if (walls.length) {
    const filas = walls.map((w) => {
      const panel = wallToPanel(w, project)
      const r = panelBOM(panel, project)
      addSteel(r.perfil, r.aceroKg)
      for (const m of r.mats) addMat(m.name, m.unit, m.qty)
      tornillos += r.tornillos
      return { id: w.label, perfil: r.perfil, det: `${r.netM2} m² · ${r.studs} mont.${w.tipo ? ' · ' + w.tipo : ''}`, kg: r.aceroKg, m2: r.netM2, extra: `${r.placas} placas` }
    })
    grupos.push({ tipo: 'muros', label: 'Muros', filas })
  }

  // ── Cerchas (tipo enlazado a Componentes → Cerchas) ──
  if (cerchasObj.length) {
    const filas = cerchasObj.map((c) => {
      const t = findType(project.types?.cercha, c.tipo) || {}
      const span = Math.max(1, Math.round(Math.hypot(c.pB[0] - c.pA[0], c.pB[1] - c.pA[1])))
      const pico = (c.xPico ?? 0.5) * span
      const baseAtPico = (c.hIzq || 0) + ((c.hDer || 0) - (c.hIzq || 0)) * (pico / span)
      const rise = baseAtPico + (c.hPico || 0)
      const cercha = {
        span, pico, rise, hIzq: c.hIzq || 0, hDer: c.hDer || 0, modelo: c.modelo || 'PRATT', divisiones: c.divisiones || 6,
        perfilSuperior: t.perfilSuperior, perfilInferior: t.perfilInferior, perfilReticula: t.perfilReticula,
      }
      const g = trussGeometry(cercha)
      const sS = secOf(t.perfilSuperior), sI = secOf(t.perfilInferior), sR = secOf(t.perfilReticula)
      addSteel(labelOf(t.perfilSuperior), sS ? (g.lens.sup / 1000) * sS.kg : 0)
      addSteel(labelOf(t.perfilInferior), sI ? (g.lens.inf / 1000) * sI.kg : 0)
      addSteel(labelOf(t.perfilReticula), sR ? (g.lens.web / 1000) * sR.kg : 0)
      const kg = cerchaKg(cercha)
      return { id: c.label, perfil: labelOf(t.perfilSuperior), det: `${cerchaTypeDef(c.modelo).name} · luz ${(span / 1000).toFixed(2)} m${c.tipo ? ' · ' + c.tipo : ''}`, kg: +kg.toFixed(1), ml: +(span / 1000).toFixed(2), extra: '' }
    })
    grupos.push({ tipo: 'cerchas', label: 'Cerchas', filas })
  }

  // ── Vigas (cercha dibujada con modelo VIGA = miembro recto; tipo → Componentes Vigas) ──
  if (vigasObj.length) {
    const filas = vigasObj.map((v) => {
      const t = findType(project.types?.viga, v.tipo) || {}
      const span = Math.max(1, Math.round(Math.hypot(v.pB[0] - v.pA[0], v.pB[1] - v.pA[1])))
      const ref = { normId: t.normId, secIdx: t.secIdx }
      const kg = beamKg({ span, type: t.type || 'back_to_back', ...ref })
      addSteel(labelOf(ref), kg)
      return { id: v.label, perfil: labelOf(ref), det: `Viga recta · luz ${(span / 1000).toFixed(2)} m${v.tipo ? ' · ' + v.tipo : ''}`, kg: +kg.toFixed(1), ml: +(span / 1000).toFixed(2), extra: '' }
    })
    grupos.push({ tipo: 'vigas', label: 'Vigas', filas })
  }

  // ── Columnas reticuladas (tipo enlazado a Componentes → Columnas) ──
  if (columnas.length) {
    const filas = columnas.map((c) => {
      const t = findType(project.types?.columna, c.tipo) || {}
      const pilar = {
        altura: c.altura || 3000, anchoBase: c.anchoBase || 400, anchoTope: c.anchoTope || 400,
        caraRecta: c.caraRecta || 'IZQ', divisiones: c.divisiones || 5, patron: PATRON_MAP[c.patron] || 'DA',
        perfil: t.perfil, perfilReticula: t.perfilReticula,
      }
      const kg = columnaKg(pilar)
      return { id: c.label, perfil: labelOf(t.perfil), det: `Columna reticulada · alto ${(pilar.altura / 1000).toFixed(2)} m${c.tipo ? ' · ' + c.tipo : ''}`, kg: +kg.toFixed(1), ml: +(pilar.altura / 1000).toFixed(2), extra: '' }
    })
    grupos.push({ tipo: 'pilares', label: 'Pilares / Columnas', filas })
  }

  // ── Techos (geometría propia del studio: slope %/fallDir; tipo → Componentes Techos) ──
  if (techos.length) {
    const filas = techos.map((r, i) => {
      const t = findType(project.types?.techo, r.tipo) || {}
      const alero = r.alero || 0
      const w = Math.max(1, Math.abs((r.p2?.[0] ?? 0) - (r.p1?.[0] ?? 0)))
      const d = Math.max(1, Math.abs((r.p2?.[1] ?? 0) - (r.p1?.[1] ?? 0)))
      const totalW = w + alero * 2, totalD = d + alero * 2
      const enX = r.fallDir === 'der' || r.fallDir === 'izq'
      const run = enX ? totalW : totalD
      const perp = enX ? totalD : totalW
      const hip = Math.hypot(run, run * ((r.slope || 0) / 100))
      const area = (hip * perp) / 1e6
      const chapaM2 = area * 1.10
      const clavadorSep = 600
      const mlClavadores = ((Math.ceil(hip / clavadorSep) + 1) * perp) / 1000
      const secC = secOf(t.perfilClavador)
      const clavKg = secC ? mlClavadores * secC.kg : 0
      addSteel(labelOf(t.perfilClavador), clavKg)
      addMat(`Chapa ${(t.tipoChapa || 'trapezoidal').toString().toLowerCase()}`, 'm²', chapaM2)
      const label = r.label || `TE${i + 1}`
      const areaM2 = +((totalW * totalD) / 1e6).toFixed(2)
      return { id: label, perfil: labelOf(t.perfilClavador), det: `Techo · ${(totalW / 1000).toFixed(1)}×${(totalD / 1000).toFixed(1)} m${r.tipo ? ' · ' + r.tipo : ''}`, kg: +clavKg.toFixed(1), m2: areaM2, extra: `${chapaM2.toFixed(1)} m² chapa · ${mlClavadores.toFixed(1)} ml` }
    })
    grupos.push({ tipo: 'techos', label: 'Techos / Cubiertas', filas })
  }

  const aceroKg = Object.values(steel).reduce((a, b) => a + b, 0)
  const materiales = [
    ...Object.entries(steel).sort((a, b) => b[1] - a[1]).map(([lab, kg]) => ({ name: `Acero perfil ${lab}`, unit: 'kg', qty: +kg.toFixed(1) })),
    ...Object.values(mats).map((m) => ({ ...m, qty: +m.qty.toFixed(2) })),
    ...(tornillos ? [{ name: 'Tornillos', unit: 'u', qty: Math.round(tornillos) }] : []),
  ]
  const totales = { aceroKg: +aceroKg.toFixed(1), tornillos: Math.round(tornillos), piezas: grupos.reduce((a, g) => a + g.filas.length, 0) }

  return { grupos, materiales, totales }
}
