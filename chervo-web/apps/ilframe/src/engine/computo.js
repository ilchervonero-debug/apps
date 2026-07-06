// ── Cómputo consolidado del proyecto ──────────────────────────
// Junta el acero y los materiales de TODOS los elementos (muros, vigas,
// cerchas, pilares, columnas, techos, losas) reutilizando cada motor.
// Devuelve { grupos, materiales, totales } para la pestaña Cómputo/Salida.

import { PROFILE_SECTIONS } from '../data/profiles'
import { panelBOM } from './bom'
import { beamKg, beamTypeDef } from './beams'
import { cerchaKg, cerchaTypeDef, trussGeometry } from './trusses'
import { pilarKg, pilarTornillos, columnaKg, columnaGeometry, pilarSec, pilarArmadoDef } from './pilares'
import { chapaM2, clavadorKg, clavadorMl, roofFormaDef, roofDims } from './roofs'
import { slabKg, slabGeometry, deckDef } from './slabs'

const secOf = (ref) => (PROFILE_SECTIONS[ref?.normId]?.C || [])[ref?.secIdx ?? 0]
const labelOf = (ref) => { const s = secOf(ref); return s ? `${s.h}x${s.w}x${s.t}` : '—' }

export function computoProyecto(state, project) {
  const panels = state.panels || []
  const beams = state.beams || []
  const cerchas = state.cerchas || []
  const pilares = state.pilares || []
  const techos = state.techos || []
  const losas = state.losas || []

  const steel = {}   // label de perfil -> kg
  const mats = {}    // nombre|unidad -> { name, unit, qty }
  let tornillos = 0
  const addSteel = (label, kg) => { if (!kg) return; steel[label] = (steel[label] || 0) + kg }
  const addMat = (name, unit, qty) => { if (!qty) return; const k = name + '|' + unit; if (!mats[k]) mats[k] = { name, unit, qty: 0 }; mats[k].qty += qty }

  const grupos = []

  // ── Muros ──
  if (panels.length) {
    const filas = panels.map((p) => {
      const r = panelBOM(p, project)
      addSteel(r.perfil, r.aceroKg)
      for (const m of r.mats) addMat(m.name, m.unit, m.qty)
      tornillos += r.tornillos
      return { id: r.id, perfil: r.perfil, det: `${r.netM2} m² · ${r.studs} mont.`, kg: r.aceroKg, m2: r.netM2, extra: `${r.placas} placas` }
    })
    grupos.push({ tipo: 'muros', label: 'Muros', filas })
  }

  // ── Vigas ──
  if (beams.length) {
    const filas = beams.map((b) => {
      const kg = beamKg(b), lab = labelOf(b)
      addSteel(lab, kg)
      return { id: b.id, perfil: lab, det: `${beamTypeDef(b.type).name} · luz ${(b.span / 1000).toFixed(2)} m`, kg: +kg.toFixed(1), extra: '' }
    })
    grupos.push({ tipo: 'vigas', label: 'Vigas', filas })
  }

  // ── Cerchas (3 perfiles: superior/inferior/retícula) ──
  if (cerchas.length) {
    const filas = cerchas.map((c) => {
      const g = trussGeometry(c)
      const sS = secOf(c.perfilSuperior), sI = secOf(c.perfilInferior), sR = secOf(c.perfilReticula)
      addSteel(labelOf(c.perfilSuperior), sS ? (g.lens.sup / 1000) * sS.kg : 0)
      addSteel(labelOf(c.perfilInferior), sI ? (g.lens.inf / 1000) * sI.kg : 0)
      addSteel(labelOf(c.perfilReticula), sR ? (g.lens.web / 1000) * sR.kg : 0)
      const kg = cerchaKg(c)
      return { id: c.id, perfil: labelOf(c.perfilSuperior), det: `${cerchaTypeDef(c.modelo).name} · luz ${(g.p.span / 1000).toFixed(2)} m`, kg: +kg.toFixed(1), extra: '' }
    })
    grupos.push({ tipo: 'cerchas', label: 'Cerchas', filas })
  }

  // ── Pilares y Columnas ──
  if (pilares.length) {
    const filas = pilares.map((p) => {
      if (p.kind === 'reticulada') {
        const g = columnaGeometry(p)
        const sC = pilarSec(p), sR = secOf(p.perfilReticula) || sC
        addSteel(labelOf(p.perfil), sC ? (g.lens.cordon / 1000) * sC.kg : 0)
        addSteel(labelOf(p.perfilReticula), sR ? (g.lens.reticula / 1000) * sR.kg : 0)
        return { id: p.id, perfil: labelOf(p.perfil), det: `Columna reticulada · alto ${((p.altura || 2800) / 1000).toFixed(2)} m`, kg: +columnaKg(p).toFixed(1), extra: '' }
      }
      addSteel(labelOf(p.perfil), pilarKg(p))
      const t = pilarTornillos(p); tornillos += t
      return { id: p.id, perfil: labelOf(p.perfil), det: `${pilarArmadoDef(p.tipoArmado).name} · alto ${((p.altura || 2800) / 1000).toFixed(2)} m`, kg: +pilarKg(p).toFixed(1), extra: t ? `${t} torn.` : '' }
    })
    grupos.push({ tipo: 'pilares', label: 'Pilares / Columnas', filas })
  }

  // ── Techos ──
  if (techos.length) {
    const filas = techos.map((t) => {
      addSteel(labelOf(t.perfilClavador), clavadorKg(t))
      addMat(`Chapa ${(t.tipoChapa || 'trapezoidal').toLowerCase()}`, 'm²', chapaM2(t))
      const d = roofDims(t)
      return { id: t.id, perfil: labelOf(t.perfilClavador), det: `${roofFormaDef(t.forma).name} · ${(d.w / 1000).toFixed(1)}×${(d.d / 1000).toFixed(1)} m`, kg: +clavadorKg(t).toFixed(1), extra: `${chapaM2(t).toFixed(1)} m² chapa · ${clavadorMl(t).toFixed(1)} ml` }
    })
    grupos.push({ tipo: 'techos', label: 'Techos / Cubiertas', filas })
  }

  // ── Losas / Entrepisos ──
  if (losas.length) {
    const filas = losas.map((lo) => {
      addSteel(labelOf(lo.perfil), slabKg(lo))
      const g = slabGeometry(lo)
      addMat(deckDef(lo.deck).name, 'm²', g.deckM2)
      return { id: lo.id, perfil: labelOf(lo.perfil), det: `${g.count} viguetas · luz ${(g.span / 1000).toFixed(2)} m`, kg: +slabKg(lo).toFixed(1), extra: `${g.deckM2.toFixed(1)} m² deck` }
    })
    grupos.push({ tipo: 'losas', label: 'Losas / Entrepisos', filas })
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
