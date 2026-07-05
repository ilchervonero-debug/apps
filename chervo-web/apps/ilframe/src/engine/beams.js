import { PROFILE_SECTIONS } from '../data/profiles'

// ── Tipos de viga (SketchFramer) ──────────────────────────────
// nC / nU = cantidad de perfiles para el cómputo (kg de acero)
export const BEAM_TYPES = [
  { id: 'simple', name: 'C simple', desc: '1 perfil C · correas y cargas menores', nC: 1, nU: 0 },
  { id: 'back_to_back', name: 'Doble C espalda con espalda', desc: '2 C alma con alma (sección I) · viga estándar', nC: 2, nU: 0 },
  { id: 'box', name: 'Cajón', desc: '2 C boca con boca (tubular) · torsión y luces largas', nC: 2, nU: 0 },
  { id: 'built_up_u', name: 'Compuesta con soleras', desc: '2 C + U superior e inferior · cargas mayores', nC: 2, nU: 2 },
]

export const beamTypeDef = (id) => BEAM_TYPES.find((t) => t.id === id) || BEAM_TYPES[1]

// Ancho total en planta (mm) según composición
export function beamWidthMm(beam) {
  const sec = (PROFILE_SECTIONS[beam.normId]?.C || [])[beam.secIdx]
  if (!sec) return 80
  const t = beamTypeDef(beam.type)
  return t.nC === 2 ? sec.w * 2 : sec.w
}

// kg de acero de la viga (C + U envolventes si aplica)
export function beamKg(beam) {
  const sec = (PROFILE_SECTIONS[beam.normId]?.C || [])[beam.secIdx]
  if (!sec) return 0
  const t = beamTypeDef(beam.type)
  let kg = (beam.span / 1000) * sec.kg * t.nC
  if (t.nU > 0) {
    const us = (PROFILE_SECTIONS[beam.normId]?.U || []).filter((u) => u.h >= sec.h && u.h <= sec.h + 8)
    if (us[0]) kg += (beam.span / 1000) * us[0].kg * t.nU
  }
  return kg
}
