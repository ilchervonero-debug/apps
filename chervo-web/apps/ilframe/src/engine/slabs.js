import { PROFILE_SECTIONS } from '../data/profiles'

// ── Losa de piso / Entrepiso ──────────────────────────────────
// En planta se dibuja el rectángulo del área. Las viguetas (perfil C)
// corren en una dirección a una separación; arriba lleva un deck (placa).
export const VIGUETA_DIRS = [
  { id: 'x', name: 'A lo ancho', desc: 'viguetas en el sentido del ancho' },
  { id: 'y', name: 'A lo largo', desc: 'viguetas en el sentido del largo' },
]

export const DECK_TIPOS = [
  { id: 'osb_18', name: 'OSB 18mm', esp: 18 },
  { id: 'ply_18', name: 'Fenólico 18mm', esp: 18 },
  { id: 'cement', name: 'Placa cementicia', esp: 20 },
  { id: 'steel_deck', name: 'Steel deck + hormigón', esp: 50 },
]
export const deckDef = (id) => DECK_TIPOS.find((d) => d.id === id) || DECK_TIPOS[0]

export function slabDims(losa) {
  const w = Math.max(1, Math.abs((losa.b?.[0] ?? 0) - (losa.a?.[0] ?? 0)))
  const d = Math.max(1, Math.abs((losa.b?.[1] ?? 0) - (losa.a?.[1] ?? 0)))
  return { w, d }
}

export function slabSec(losa) {
  return (PROFILE_SECTIONS[losa.perfil?.normId]?.C || [])[losa.perfil?.secIdx ?? 0]
}

// Geometría/cómputo: luz de la vigueta, cantidad, ml, m² de deck, alertas
export function slabGeometry(losa) {
  const { w, d } = slabDims(losa)
  const dir = losa.dir || 'x'
  const sep = Math.max(200, losa.sep || 400)
  // dir 'x' → viguetas corren en X (largo = w), separadas en Y (reparto = d)
  const span = dir === 'x' ? w : d
  const reparto = dir === 'x' ? d : w
  const count = Math.floor(reparto / sep) + 1
  const ml = (count * span) / 1000
  const deckM2 = (w * d) / 1e6

  const alerts = []
  if (span > 4500) alerts.push(`Luz de vigueta ${(span / 1000).toFixed(2)} m — verificá la deflexión (¿apoyo intermedio o perfil mayor?).`)
  if (sep > 600) alerts.push(`Separación ${(sep / 1000).toFixed(2)} m — máx. recomendado 0.60 m para el deck.`)

  return { w, d, dir, span, reparto, count, ml, deckM2, alerts }
}

export function slabKg(losa) {
  const sec = slabSec(losa)
  if (!sec) return 0
  return slabGeometry(losa).ml * sec.kg
}
export function slabCanto(losa) { // canto del entrepiso (mm) = alto vigueta + deck
  const sec = slabSec(losa)
  return (sec ? sec.h : 200) + deckDef(losa.deck).esp
}
