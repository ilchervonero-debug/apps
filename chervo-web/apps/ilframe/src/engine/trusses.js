import { CU_SECTIONS } from '../data/profiles'

// ── Estilos de cercha (perfil metálico) ───────────────────────
// Geometría en coords locales: x = 0..luz, y = 0..altura, base abajo.
// Cada estilo devuelve una lista de barras [[x1,y1],[x2,y2]] para dibujar
// el alzado y para estimar los kg de acero (suma de largos × kg/m del perfil).
export const CERCHA_TYPES = [
  { id: 'mono', name: 'Un agua', desc: 'una sola pendiente' },
  { id: 'dual', name: 'Dos aguas', desc: 'cumbrera al centro + pendolón' },
  { id: 'fink', name: 'Fink (W)', desc: 'alma en W · la más común' },
  { id: 'howe', name: 'Howe', desc: 'cumbrera + montantes verticales' },
  { id: 'tijera', name: 'Tijera', desc: 'cordón inferior en dos aguas (cielo inclinado)' },
]

export const cerchaTypeDef = (id) => CERCHA_TYPES.find((t) => t.id === id) || CERCHA_TYPES[2]

// Altura por defecto = pendiente ~25% de la luz (editable por el usuario)
export const defaultRise = (span) => Math.max(300, Math.round(span * 0.25))

// Barras de la cercha en coords locales (mm)
export function trussMembers(type, span, rise) {
  const S = Math.max(1, span), H = Math.max(1, rise)
  const M = []
  const seg = (a, b) => M.push([a, b])
  const apex = [S / 2, H]

  if (type === 'mono') {
    seg([0, 0], [S, 0])            // cordón inferior
    seg([0, 0], [S, H])            // cordón superior (pendiente)
    seg([S, 0], [S, H])            // montante alto
    for (let i = 1; i <= 3; i++) { const x = S * i / 4; seg([x, 0], [x, H * i / 4]) } // montantes
    return M
  }

  // cordones de las de dos aguas
  seg([0, 0], [S, 0])             // cordón inferior
  seg([0, 0], apex)               // cordón superior izq
  seg(apex, [S, 0])               // cordón superior der

  if (type === 'dual') {
    seg([S / 2, 0], apex)         // pendolón
    return M
  }
  if (type === 'fink') {
    seg([S / 2, 0], apex)         // pendolón
    seg([S / 2, 0], [S / 4, H / 2])       // diagonal izq → medio cordón sup
    seg([S / 2, 0], [3 * S / 4, H / 2])   // diagonal der → medio cordón sup  (forma la W)
    return M
  }
  if (type === 'howe') {
    seg([S / 2, 0], apex)         // pendolón
    seg([S / 4, 0], [S / 4, H / 2])       // montante vertical izq
    seg([3 * S / 4, 0], [3 * S / 4, H / 2]) // montante vertical der
    return M
  }
  if (type === 'tijera') {
    // cordón inferior también a dos aguas, más bajo que el superior
    M.length = 0
    const h2 = H * 0.45
    seg([0, 0], [S / 2, h2]); seg([S / 2, h2], [S, 0]) // cordón inferior peraltado
    seg([0, 0], apex); seg(apex, [S, 0])               // cordón superior
    seg([S / 2, h2], apex)                             // pendolón corto
    return M
  }
  // fallback
  seg([S / 2, 0], apex)
  return M
}

// Largo total de barras (mm)
export function trussLengthMm(cercha) {
  const ms = trussMembers(cercha.type, cercha.span, cercha.rise ?? defaultRise(cercha.span))
  return ms.reduce((sum, [a, b]) => sum + Math.hypot(b[0] - a[0], b[1] - a[1]), 0)
}

// kg de acero estimados (largo total × kg/m del perfil C elegido)
export function cerchaKg(cercha) {
  const sec = (CU_SECTIONS[cercha.normId]?.C || [])[cercha.secIdx]
  if (!sec) return 0
  return (trussLengthMm(cercha) / 1000) * sec.kg
}
