// ── Spec del proyecto — el "output de info" de la hoja de Componentes ──
// Toda la definición (material + tipos de perfil) se hace en Componentes.
// projectSpec() resuelve esa definición en un objeto limpio y serializable
// que el canvas (y el cómputo) consumen: cada tipo con su código, nombre,
// espesor/perfiles ya resueltos. El canvas solo dibuja la silueta y toma de
// acá el material; la integración fina se hace después.

import { PROFILE_SECTIONS } from '../data/profiles'
import { LAYER_TEMPLATES } from '../data/layers'

const layerName = (id) => LAYER_TEMPLATES.find((l) => l.id === id)?.name || id
const layerTh = (id) => LAYER_TEMPLATES.find((l) => l.id === id)?.thickness || 0

// Perfil resuelto (etiqueta legible + kg/m) desde una referencia {normId, secIdx}
export function perfilResuelto(ref) {
  const s = (PROFILE_SECTIONS[ref?.normId]?.C || [])[ref?.secIdx ?? 0]
  if (!s) return null
  return { label: `${s.h}×${s.w}×${s.t}mm`, kgM: s.kg, h: s.h, w: s.w, t: s.t }
}

// Espesor del muro (mm) = alma de la montante (núcleo) + capas de ambas caras.
// Sin capas cargadas = solo el núcleo de la montante.
export function muroEspesor(type, profileSection) {
  const core = parseInt((profileSection || '100_0.95').split('_')[0], 10) || 100
  const sum = (arr) => (arr || []).reduce((a, id) => a + layerTh(id), 0)
  const capas = sum(type?.faces?.interior) + sum(type?.faces?.exterior)
  return { core, capas, espesor: Math.round(core + capas) }
}

export function projectSpec(project) {
  const t = project.types || {}
  const ps = project.profileSection

  const walls = (project.wallTypes || []).map((w) => {
    const e = muroEspesor(w, ps)
    return {
      code: w.code, name: w.name || '', kind: w.kind,
      almaMm: e.core, capasMm: e.capas, espesorMm: e.espesor,
      caras: {
        interior: (w.faces?.interior || []).map(layerName),
        exterior: (w.faces?.exterior || []).map(layerName),
      },
    }
  })

  const map = (cat, fn) => (t[cat] || []).map((x) => ({ code: x.code, name: x.name || '', ...fn(x) }))

  return {
    studSpacing: project.studSpacing,
    walls,
    pilares: map('pilar', (x) => ({ armado: x.tipoArmado, perfil: perfilResuelto(x.perfil), altura: x.altura })),
    columnas: map('columna', (x) => ({ patron: x.patron, cordon: perfilResuelto(x.perfil), reticula: perfilResuelto(x.perfilReticula) })),
    cerchas: map('cercha', (x) => ({ modelo: x.modelo, superior: perfilResuelto(x.perfilSuperior), inferior: perfilResuelto(x.perfilInferior), reticula: perfilResuelto(x.perfilReticula) })),
    vigas: map('viga', (x) => ({ armado: x.type, perfil: perfilResuelto({ normId: x.normId, secIdx: x.secIdx }) })),
    losas: map('losa', (x) => ({ vigueta: perfilResuelto(x.perfil), deck: x.deck })),
    techos: map('techo', (x) => ({ forma: x.forma, chapa: x.tipoChapa, clavador: perfilResuelto(x.perfilClavador) })),
    cielos: map('cielo', (x) => ({ perfil: perfilResuelto(x.perfil), placas: (x.placas || []).map(layerName) })),
  }
}

// ¿Hay algo definido? (para el estado vacío / habilitar el plano)
export function specVacio(spec) {
  return !spec.walls.length && !spec.pilares.length && !spec.columnas.length &&
    !spec.cerchas.length && !spec.vigas.length && !spec.losas.length &&
    !spec.techos.length && !spec.cielos.length
}
