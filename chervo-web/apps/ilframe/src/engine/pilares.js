import { PROFILE_SECTIONS } from '../data/profiles'
import { RETI_PATRONES } from './trusses'

// Armado del pilar/columna: cantidad de perfiles agrupados (multiplicador de kg)
export const PILAR_ARMADOS = [
  { id: 'SIMPLE', name: 'Simple (1 perfil)', piezas: 1, desc: '1 PGC · sufre pandeo torsional' },
  { id: 'DOBLE_ESPALDA', name: 'Doble espalda (I)', piezas: 2, desc: '2 C alma con alma' },
  { id: 'DOBLE_CAJON', name: 'Doble cajón (tubo)', piezas: 2, desc: '2 C boca con boca' },
  { id: 'TRIPLE', name: 'Triple', piezas: 3, desc: '3 perfiles' },
  { id: 'CUADRUPLE', name: 'Cuádruple', piezas: 4, desc: '4 perfiles' },
]
export const pilarArmadoDef = (id) => PILAR_ARMADOS.find((a) => a.id === id) || PILAR_ARMADOS[2]

export function pilarSec(p) {
  return (PROFILE_SECTIONS[p.perfil?.normId]?.C || [])[p.perfil?.secIdx ?? 0]
}

// Huella en planta (mm): [ancho X, ancho Y] de la sección agrupada
export function pilarFootprint(p) {
  const sec = pilarSec(p)
  if (!sec) return [100, 100]
  if (p.kind === 'reticulada') return [Math.max(p.anchoBase || 400, p.anchoTope || 400), sec.h]
  const a = pilarArmadoDef(p.tipoArmado)
  if (a.piezas >= 3) return [sec.w * 2, sec.h] // 3-4 → ~2 anchos × alto
  if (a.piezas === 2) return p.tipoArmado === 'DOBLE_CAJON' ? [sec.w * 2, sec.h] : [sec.h, sec.w * 2]
  return [sec.w, sec.h]
}

// kg de acero = altura × kg/m × cantidad de perfiles
export function pilarKg(p) {
  const sec = pilarSec(p)
  if (!sec) return 0
  return (p.altura / 1000) * sec.kg * pilarArmadoDef(p.tipoArmado).piezas
}

// Tornillos de costura (~cada 15 cm en cada alma unida)
export function pilarTornillos(p) {
  const a = pilarArmadoDef(p.tipoArmado)
  return a.piezas > 1 ? Math.ceil(p.altura / 150) * (a.piezas - 1) * 2 : 0
}

// ── COLUMNA RETICULADA / ACARTELADA ───────────────────────────
// Es una Pratt "parada": misma familia de retícula que la cercha recta
// (A los apoyos / Al centro / Cruces X / Warren / Sin diagonal) + los
// travesaños (verticales) como toggle. Dos cordones (izq/der) de la base
// al tope; si anchoBase ≠ anchoTope es acartelada (trapezoidal).
export const COLUMNA_PATRONES = RETI_PATRONES
export const CARA_RECTA = [
  { id: 'IZQ', name: 'Izquierda a plomo' },
  { id: 'DER', name: 'Derecha a plomo' },
  { id: 'CENTRO', name: 'Simétrica (centro)' },
]

const clen = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])

// Geometría local (mm, y hacia arriba): cordones + alma + largos + alertas
export function columnaGeometry(p) {
  const H = Math.max(1, p.altura || 3000)
  const wb = Math.max(1, p.anchoBase || 400)
  const wt = Math.max(1, p.anchoTope || 400)
  const cara = p.caraRecta || 'IZQ'
  const n = Math.max(2, Math.round(p.divisiones || 5))
  const width = Math.max(wb, wt)
  let baseL, topL, baseR, topR
  if (cara === 'IZQ') { baseL = 0; topL = 0; baseR = wb; topR = wt }
  else if (cara === 'DER') { baseL = width - wb; topL = width - wt; baseR = width; topR = width }
  else { const cx = width / 2; baseL = cx - wb / 2; topL = cx - wt / 2; baseR = cx + wb / 2; topR = cx + wt / 2 }

  const lx = (y) => baseL + (topL - baseL) * (y / H)
  const rx = (y) => baseR + (topR - baseR) * (y / H)
  const ys = []
  for (let i = 0; i <= n; i++) ys.push((i * H) / n)
  const L = ys.map((y) => [lx(y), y])
  const R = ys.map((y) => [rx(y), y])

  const chords = []
  for (let i = 0; i < n; i++) { chords.push([L[i], L[i + 1]]); chords.push([R[i], R[i + 1]]) }

  // alma tipo Pratt vertical: travesaños (verticales) + diagonales simétricas
  const web = []
  web.push([L[0], R[0]]); web.push([L[n], R[n]]) // travesaños base y tope (siempre)
  if (p.verticales !== false) for (let i = 1; i < n; i++) web.push([L[i], R[i]])
  const P = p.patron || 'DA'
  const cy = H / 2
  for (let i = 0; i < n; i++) {
    const lower = (ys[i] + ys[i + 1]) / 2 < cy
    const toApoyo = lower ? [R[i + 1], L[i]] : [R[i], L[i + 1]] // hacia los extremos
    const toCentro = lower ? [L[i], R[i + 1]] : [L[i + 1], R[i]] // hacia el medio
    if (P === 'DA') web.push(toApoyo)
    else if (P === 'DC') web.push(toCentro)
    else if (P === 'X') { web.push(toApoyo); web.push(toCentro) }
    else if (P === 'W') web.push((i % 2 === 0) === lower ? toCentro : toApoyo)
    // 'N' → sin diagonales (solo travesaños)
  }

  const sum = (arr) => arr.reduce((s, [a, b]) => s + clen(a, b), 0)
  const lens = { cordon: sum(chords), reticula: sum(web) }

  const alerts = []
  const anchoMin = Math.min(wb, wt)
  if (H / anchoMin > 15) alerts.push(`Esbeltez alta (${(H / anchoMin).toFixed(1)}) en la zona angosta — riesgo de pandeo.`)
  if (H / n > 1200) alerts.push(`Nudos muy separados (${(H / n / 1000).toFixed(2)} m).`)

  return { width, L, R, chords, web, lens, alerts }
}

export function columnaKg(p) {
  const sec = pilarSec(p)
  const secR = (PROFILE_SECTIONS[p.perfilReticula?.normId]?.C || [])[p.perfilReticula?.secIdx ?? 0] || sec
  if (!sec) return 0
  const g = columnaGeometry(p)
  return (g.lens.cordon / 1000) * sec.kg + (g.lens.reticula / 1000) * (secR ? secR.kg : sec.kg)
}
