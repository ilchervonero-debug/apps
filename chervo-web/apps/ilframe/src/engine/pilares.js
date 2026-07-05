import { PROFILE_SECTIONS } from '../data/profiles'

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
