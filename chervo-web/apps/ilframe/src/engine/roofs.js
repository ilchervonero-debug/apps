import { PROFILE_SECTIONS } from '../data/profiles'

// ── Cubiertas (techos) ────────────────────────────────────────
// En planta se dibuja el rectángulo de huella (luz × largo). Los aleros
// (voladizos) extienden la cubierta hacia afuera y entran en el cómputo.
export const ROOF_FORMAS = [
  { id: 'DOS_AGUAS', name: 'Dos aguas', desc: 'cumbrera al centro, dos faldones' },
  { id: 'UN_AGUA', name: 'Un agua', desc: 'una sola pendiente' },
  { id: 'CUATRO_AGUAS', name: 'Cuatro aguas', desc: 'a cuatro faldones (pabellón)' },
]
export const roofFormaDef = (id) => ROOF_FORMAS.find((f) => f.id === id) || ROOF_FORMAS[0]

export const CHAPA_TIPOS = [
  { id: 'TRAPEZOIDAL', name: 'Trapezoidal' },
  { id: 'SINUSOIDAL', name: 'Sinusoidal (acanalada)' },
  { id: 'TEJA', name: 'Teja metálica' },
]

const ha = (a) => ({ frente: a?.frente || 0, fondo: a?.fondo || 0, izq: a?.izq || 0, der: a?.der || 0 })

// Dimensiones de huella (mm) desde las dos esquinas del rectángulo
export function roofDims(techo) {
  const w = Math.max(1, Math.abs((techo.b?.[0] ?? 0) - (techo.a?.[0] ?? 0)))
  const d = Math.max(1, Math.abs((techo.b?.[1] ?? 0) - (techo.a?.[1] ?? 0)))
  return { w, d }
}

// Geometría y cómputo (superficie real con aleros, clavadores, chapa)
export function roofGeometry(techo) {
  const { w, d } = roofDims(techo)
  const a = ha(techo.aleros)
  const H = Math.max(1, techo.alturaPico || 1500)
  const totalW = w + a.izq + a.der
  const totalD = d + a.frente + a.fondo
  const sep = Math.max(200, techo.clavadorSep || 600)
  const forma = techo.forma || 'DOS_AGUAS'

  let area, mlClavadores, hip, ang
  if (forma === 'DOS_AGUAS') {
    hip = Math.hypot(totalW / 2, H)
    area = hip * 2 * totalD
    const lineas = Math.ceil(hip / sep) + 1
    mlClavadores = lineas * 2 * totalD
    ang = Math.atan(H / (totalW / 2)) * 180 / Math.PI
  } else if (forma === 'UN_AGUA') {
    hip = Math.hypot(totalW, H)
    area = hip * totalD
    const lineas = Math.ceil(hip / sep) + 1
    mlClavadores = lineas * totalD
    ang = Math.atan(H / totalW) * 180 / Math.PI
  } else { // CUATRO_AGUAS (aprox: 2 faldones trapezoidales + 2 triangulares)
    const hipW = Math.hypot(totalW / 2, H)
    const hipD = Math.hypot(totalD / 2, H)
    area = hipW * totalD + hipD * totalW - hipW * hipD // aprox de superposición
    const lineas = Math.ceil(hipW / sep) + 1
    mlClavadores = lineas * 2 * totalD + (Math.ceil(hipD / sep) + 1) * 2 * totalW
    ang = Math.atan(H / (totalW / 2)) * 180 / Math.PI
  }

  const alerts = []
  if (ang < 5) alerts.push(`Pendiente muy baja (${ang.toFixed(0)}°) — riesgo de filtración.`)
  if (ang > 45) alerts.push(`Pendiente muy alta (${ang.toFixed(0)}°) — revisá fijaciones de chapa.`)

  return { w, d, totalW, totalD, area, mlClavadores, hip, ang, alerts }
}

// Ecuación de plano para el "limitador" de muros: Z = pend·X + h0 (por faldón)
export function roofPlanes(techo) {
  const { totalW } = roofGeometry(techo)
  const H = Math.max(0, techo.alturaPico || 0)
  if (techo.forma === 'UN_AGUA') return [{ pend: H / totalW, h0: 0 }]
  return [ // dos aguas: sube al centro y baja
    { pend: (2 * H) / totalW, h0: 0 },
    { pend: -(2 * H) / totalW, h0: 2 * H },
  ]
}

export function chapaM2(techo) {
  const g = roofGeometry(techo)
  return (g.area / 1e6) * 1.10 // +10% de recorte/solape
}
export function clavadorMl(techo) { return roofGeometry(techo).mlClavadores / 1000 }
export function clavadorKg(techo) {
  const sec = (PROFILE_SECTIONS[techo.perfilClavador?.normId]?.C || [])[techo.perfilClavador?.secIdx ?? 0]
  return sec ? clavadorMl(techo) * sec.kg : 0
}
