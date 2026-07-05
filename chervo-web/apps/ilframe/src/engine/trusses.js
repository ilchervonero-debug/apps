import { CU_SECTIONS } from '../data/profiles'

// ── Generador paramétrico de cerchas ──────────────────────────
// Coords locales en mm, Y hacia arriba (0 = base de apoyos).
// Parámetros (spec iLFrame):
//   span        luz total (heredada de planta)
//   pico        X del vértice superior (0..span) → simétrica, a un agua o asimétrica
//   rise        altura del pico (Y)
//   hIzq, hDer  altura de los apoyos (talón); 0 = triángulo puro
//   modelo      FINK | HOWE | PRATT | TIJERA | UN_AGUA
//   divisiones  tramos del cordón inferior (nudos)

export const CERCHA_TYPES = [
  { id: 'FINK', name: 'Fink (W)', desc: 'alma en W · la más común' },
  { id: 'HOWE', name: 'Howe', desc: 'montantes + diagonales al pico' },
  { id: 'PRATT', name: 'Pratt', desc: 'montantes + diagonales a los apoyos' },
  { id: 'TIJERA', name: 'Tijera', desc: 'cordón inferior a dos aguas (cielo inclinado)' },
  { id: 'UN_AGUA', name: 'Un agua', desc: 'una sola pendiente (mono)' },
]

export const cerchaTypeDef = (id) => CERCHA_TYPES.find((t) => t.id === id) || CERCHA_TYPES[0]
export const defaultRise = (span) => Math.max(300, Math.round(span * 0.25))

const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])

// Normaliza parámetros con defaults sensatos
export function cerchaParams(c) {
  const span = Math.max(1, c.span || 1)
  const modelo = c.modelo || 'FINK'
  let pico = c.pico != null ? c.pico : span / 2
  if (modelo === 'UN_AGUA') pico = span // a un agua → pico en el apoyo derecho
  pico = Math.max(0, Math.min(span, pico))
  const rise = c.rise != null ? c.rise : defaultRise(span)
  const hIzq = Math.max(0, c.hIzq || 0)
  const hDer = Math.max(0, c.hDer || 0)
  const divisiones = Math.max(2, Math.round(c.divisiones || 6))
  return { span, pico, rise, hIzq, hDer, modelo, divisiones }
}

// Y del cordón superior en x (piecewise entre apoyos y pico)
function yTopAt(p, x) {
  const { span, pico, rise, hIzq, hDer } = p
  if (p.modelo === 'UN_AGUA') return hIzq + (rise - hIzq) * (x / span)
  if (x <= pico) return pico <= 0 ? rise : hIzq + (rise - hIzq) * (x / pico)
  return (span - pico) <= 0 ? rise : rise + (hDer - rise) * ((x - pico) / (span - pico))
}
// Y del cordón inferior en x (recto salvo TIJERA que sube al centro)
function yBotAt(p, x) {
  const base = p.hIzq + (p.hDer - p.hIzq) * (x / p.span)
  if (p.modelo !== 'TIJERA') return base
  const hb = p.rise * 0.45
  if (x <= p.pico) return p.pico <= 0 ? hb : base + (hb - p.hIzq) * (x / p.pico)
  return (p.span - p.pico) <= 0 ? hb : hb + (p.hDer - hb) * ((x - p.pico) / (p.span - p.pico))
}

// Geometría completa: cordones + alma + nudos + largos + alertas
export function trussGeometry(cercha) {
  const p = cerchaParams(cercha)
  const { span, pico, divisiones, modelo } = p

  // nudos en X (división regular + el pico como vértice)
  const xs = []
  for (let i = 0; i <= divisiones; i++) xs.push((i * span) / divisiones)
  if (pico > 0 && pico < span) xs.push(pico)
  const ux = [...new Set(xs.map((x) => Math.round(x)))].sort((a, b) => a - b)

  const top = ux.map((x) => [x, yTopAt(p, x)])
  const bot = ux.map((x) => [x, yBotAt(p, x)])

  // cordones (segmentos consecutivos)
  const chordTop = []
  const chordBot = []
  for (let i = 0; i < ux.length - 1; i++) { chordTop.push([top[i], top[i + 1]]); chordBot.push([bot[i], bot[i + 1]]) }

  // alma (web) según modelo — usa los nudos de la división regular
  const web = []
  const nodeAt = (x) => {
    const i = ux.findIndex((v) => Math.abs(v - x) < 1)
    return i >= 0 ? i : null
  }
  const div = []
  for (let i = 0; i <= divisiones; i++) div.push(Math.round((i * span) / divisiones))
  const picoIdx = nodeAt(Math.round(pico))

  // montante central (pendolón) hasta el pico, salvo mono
  if (modelo !== 'UN_AGUA' && picoIdx != null) web.push([bot[picoIdx], top[picoIdx]])

  const vertical = (i) => web.push([bot[i], top[i]])
  const diagTo = (iBot, iTop) => { if (ux[iTop]) web.push([bot[iBot], top[iTop]]) }

  for (let k = 1; k < divisiones; k++) {
    const i = nodeAt(div[k])
    if (i == null) continue
    if (modelo === 'HOWE' || modelo === 'PRATT' || modelo === 'TIJERA' || modelo === 'UN_AGUA') {
      vertical(i)
      const toApex = ux[i] < pico ? 1 : -1 // dirección hacia el pico
      const dir = (modelo === 'PRATT') ? -toApex : toApex
      const j = nodeAt(div[k + (dir > 0 ? 1 : -1)])
      if (j != null && j !== i) diagTo(i, j)
    } else { // FINK → W: diagonal alternada sin montantes intermedios
      const toApex = ux[i] < pico ? 1 : -1
      const j = nodeAt(div[k + (k % 2 === 1 ? toApex : 0)])
      if (k % 2 === 1) { const jj = nodeAt(div[k + toApex]); if (jj != null) diagTo(i, jj) }
      else vertical(i)
      void j
    }
  }

  // largos por cordón (para el cómputo)
  const sum = (arr) => arr.reduce((s, [a, b]) => s + len(a, b), 0)
  const lens = { sup: sum(chordTop), inf: sum(chordBot), web: sum(web) }

  // validaciones estructurales (alertas)
  const alerts = []
  const sepNudo = span / divisiones
  if (sepNudo > 1200) alerts.push(`Nudos muy separados (${(sepNudo / 1000).toFixed(2)} m) — riesgo de pandeo del cordón inferior.`)
  const angL = pico > 0 ? Math.atan((p.rise - p.hIzq) / pico) * 180 / Math.PI : 0
  const angR = (span - pico) > 0 ? Math.atan((p.rise - p.hDer) / (span - pico)) * 180 / Math.PI : 0
  if ((angL > 0 && angL < 10) || (angR > 0 && angR < 10)) alerts.push('Pendiente muy baja (< 10°) — riesgo de estancamiento.')
  if (angL > 60 || angR > 60) alerts.push('Pendiente excesiva (> 60°) — revisá el diseño.')

  return { p, top, bot, chordTop, chordBot, web, lens, alerts, angL, angR, sepNudo }
}

// kg de acero por cordón usando 3 perfiles (superior / inferior / retícula)
function kgOf(ref, mm) {
  const sec = (CU_SECTIONS[ref?.normId]?.C || [])[ref?.secIdx ?? 0]
  return sec ? (mm / 1000) * sec.kg : 0
}
export function cerchaKg(cercha) {
  const { lens } = trussGeometry(cercha)
  const s = cercha.perfilSuperior || cercha.perfil
  const i = cercha.perfilInferior || cercha.perfil
  const r = cercha.perfilReticula || cercha.perfil
  return kgOf(s, lens.sup) + kgOf(i, lens.inf) + kgOf(r, lens.web)
}

// Todas las barras juntas (para dibujar) con su rol
export function trussMembers(cercha) {
  const g = trussGeometry(cercha)
  return [
    ...g.chordTop.map((m) => ({ seg: m, role: 'sup' })),
    ...g.chordBot.map((m) => ({ seg: m, role: 'inf' })),
    ...g.web.map((m) => ({ seg: m, role: 'web' })),
  ]
}
