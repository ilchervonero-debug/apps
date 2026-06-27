import { create } from 'zustand'
import { LAYER_TEMPLATES } from '../data/layers'

// Espesor de pared (mm) = núcleo (alto del montante) + capas de ambas caras
export function wallThickness(type, profileSection) {
  if (!type) return 100
  const core = parseInt((profileSection || '100_0.95').split('_')[0], 10) || 100
  const th = (id) => LAYER_TEMPLATES.find((l) => l.id === id)?.thickness || 0
  const sum = (arr) => (arr || []).reduce((a, id) => a + th(id), 0)
  return Math.round(core + sum(type.faces?.interior) + sum(type.faces?.exterior))
}

// ── Modelo iLFrame ──────────────────────────────────────────
// Planta: cada muro dibujado es un PANEL (código M1, M2…).
//   La longitud de la línea = ANCHO del panel (se edita SOLO en planta).
// Alzado: el panel es un POLÍGONO. Arranca como rectángulo de 3 m.
//   El ancho está bloqueado (viene de planta). El contorno superior se
//   edita con números exactos: altura lado A, altura lado B y puntos X/Y.

const DEFAULT_GRID = 400 // mm — separación de montantes (40 cm)
const MAJOR_MM = 1200 // mm — línea grande de grilla (1.20 m)
const DEFAULT_HEIGHT = 3000

const snap1 = (mm, g) => Math.round(mm / g) * g
const snapPt = (pt, g) => [snap1(pt[0], g), snap1(pt[1], g)]
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])

const VERT_FRAC = 0.6 // radio de enganche a vértices = fracción de celda

// Vértice (inicio/fin de muro) más cercano dentro de maxD; null si ninguno
export function nearestVertex(pt, panels, maxD, ignoreId) {
  let best = null
  let bestD = maxD
  for (const p of panels) {
    if (ignoreId && p.id === ignoreId) continue
    for (const v of [p.a, p.b]) {
      const d = Math.hypot(pt[0] - v[0], pt[1] - v[1])
      if (d < bestD) { bestD = d; best = v }
    }
  }
  return best
}

// Snap con prioridad: 1) vértice de muro cercano  2) intersección de grilla
export function snapPoint(pt, g, panels) {
  const v = nearestVertex(pt, panels, g * VERT_FRAC)
  return v ? [v[0], v[1]] : snapPt(pt, g)
}

export const VERT_RADIUS = VERT_FRAC

const nextCode = (panels) => {
  const used = new Set(panels.map((p) => p.id))
  let n = 1
  while (used.has('M' + n)) n++
  return 'M' + n
}

const cloneTop = (tp) => tp.map((a) => [...a])

// Polígono local (mm, y hacia arriba): base + contorno superior izq→der
export function panelPolygon(p) {
  return [[0, 0], ...p.topPath, [p.width, 0]]
}

export function polygonArea(poly) {
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % poly.length]
    a += x1 * y2 - x2 * y1
  }
  return Math.abs(a) / 2 // mm²
}

export function panelMaxHeight(p) {
  return Math.max(DEFAULT_HEIGHT, ...p.topPath.map((pt) => pt[1]))
}

export const MAJOR = MAJOR_MM
export const DEF_H = DEFAULT_HEIGHT

// ── Historial (deshacer / rehacer) ─────────────────────────
const clonePanels = (panels) => panels.map((p) => ({
  ...p,
  a: [...p.a],
  b: [...p.b],
  topPath: p.topPath.map((t) => [...t]),
  openings: (p.openings || []).map((o) => ({ ...o })),
}))

let _hKey = null
let _hTime = 0
// Devuelve el patch {past, future} apilando el estado actual.
// coalesce=true junta ediciones seguidas del mismo campo en 1 paso.
const histPatch = (s, key, coalesce = false) => {
  const now = Date.now()
  if (coalesce && key === _hKey && now - _hTime < 700) {
    _hTime = now
    return { future: [] }
  }
  _hKey = key
  _hTime = now
  return { past: [...s.past, clonePanels(s.panels)].slice(-60), future: [] }
}

// Elemento con composición por caras (muros/techo) o capa única (piso/losa)
function defaultElement(on, twoFaces) {
  return {
    on,
    faces: twoFaces
      ? { interior: ['gyp_standard'], exterior: ['osb_11', 'mineral_wool_50'] }
      : { unica: [] },
    finish: { paintCoats: 2, masilla: true, enduido: true, cinta: true, tornillos: true },
  }
}

export const useDrawingStore = create((set) => ({
  panels: [],
  past: [],
  future: [],
  selectedId: null,
  selectedVertex: null, // índice de vértice del contorno en edición (alzado)
  activeTool: 'wall', // 'wall' | 'select'
  gridMm: DEFAULT_GRID, // 400 o 600
  elevationHeight: 50, // % de alto del canvas superior
  draft: null, // { a:[mm,mm], b:[mm,mm] } mientras se arrastra en planta

  // ── Configuración del proyecto (Etapa 2) ──────────────────
  appView: 'setup', // 'setup' | 'draw'
  tab: 'plan', // 'plan' | 'elev' — pestaña activa del dibujo
  project: {
    name: 'Proyecto sin nombre',
    // estructura de acero (global)
    profileNorm: 'cu_1',
    profileSection: '100_0.95', // `${h}_${t}`
    studSpacing: 400,
    // tipos de muro: cada panel referencia uno → define espesor y materiales
    wallTypes: [
      { id: 'ext', name: 'Muro exterior', kind: 'exterior', faces: { interior: ['gyp_standard'], exterior: ['osb_11', 'mineral_wool_50'] } },
      { id: 'int', name: 'Muro interior', kind: 'interior', faces: { interior: ['gyp_standard'], exterior: ['gyp_standard'] } },
    ],
    // elementos del proyecto; cada uno con su composición
    elements: {
      muros: defaultElement(true, true),
      piso: defaultElement(false, false),
      techo: defaultElement(false, true),
      cerchas: { on: false, structural: true },
      columnas: { on: false, structural: true },
      losas: defaultElement(false, false),
    },
  },
  setAppView: (v) => set({ appView: v }),
  setTab: (t) => set({ tab: t }),
  setProject: (patch) => set((s) => ({ project: { ...s.project, ...patch } })),
  toggleElement: (key) => set((s) => ({
    project: { ...s.project, elements: { ...s.project.elements, [key]: { ...s.project.elements[key], on: !s.project.elements[key].on } } },
  })),
  addFaceLayer: (key, face, layerId) => set((s) => {
    const elx = s.project.elements[key]
    const cur = (elx.faces?.[face] || [])
    if (!layerId || cur.includes(layerId)) return {}
    const faces = { ...elx.faces, [face]: [...cur, layerId] }
    return { project: { ...s.project, elements: { ...s.project.elements, [key]: { ...elx, faces } } } }
  }),
  removeFaceLayer: (key, face, layerId) => set((s) => {
    const elx = s.project.elements[key]
    const faces = { ...elx.faces, [face]: (elx.faces?.[face] || []).filter((l) => l !== layerId) }
    return { project: { ...s.project, elements: { ...s.project.elements, [key]: { ...elx, faces } } } }
  }),
  setFinish: (key, patch) => set((s) => {
    const elx = s.project.elements[key]
    return { project: { ...s.project, elements: { ...s.project.elements, [key]: { ...elx, finish: { ...elx.finish, ...patch } } } } }
  }),

  // ── Tipos de muro ─────────────────────────────────────────
  addWallType: () => set((s) => {
    const id = 't' + Date.now().toString(36)
    const wt = { id, name: 'Muro nuevo', kind: 'interior', faces: { interior: ['gyp_standard'], exterior: ['gyp_standard'] } }
    return { project: { ...s.project, wallTypes: [...s.project.wallTypes, wt] } }
  }),
  updateWallType: (id, patch) => set((s) => ({
    project: { ...s.project, wallTypes: s.project.wallTypes.map((t) => (t.id === id ? { ...t, ...patch } : t)) },
  })),
  removeWallType: (id) => set((s) => {
    if (s.project.wallTypes.length <= 1) return {}
    return { project: { ...s.project, wallTypes: s.project.wallTypes.filter((t) => t.id !== id) } }
  }),
  addTypeLayer: (id, face, layerId) => set((s) => ({
    project: {
      ...s.project,
      wallTypes: s.project.wallTypes.map((t) => {
        if (t.id !== id) return t
        const cur = t.faces[face] || []
        if (!layerId || cur.includes(layerId)) return t
        return { ...t, faces: { ...t.faces, [face]: [...cur, layerId] } }
      }),
    },
  })),
  removeTypeLayer: (id, face, layerId) => set((s) => ({
    project: {
      ...s.project,
      wallTypes: s.project.wallTypes.map((t) => (t.id === id
        ? { ...t, faces: { ...t.faces, [face]: (t.faces[face] || []).filter((l) => l !== layerId) } }
        : t)),
    },
  })),
  setPanelType: (panelId, typeId) => set((s) => ({
    ...histPatch(s, 'ptype'),
    panels: s.panels.map((p) => (p.id === panelId ? { ...p, typeId } : p)),
  })),

  setActiveTool: (t) => set({ activeTool: t }),
  setGrid: (mm) => set({ gridMm: mm }),
  setElevationHeight: (h) => set({ elevationHeight: Math.max(20, Math.min(80, h)) }),

  // ── PLANTA: dibujar con arrastre (snap a vértice / grilla) ─
  startWall: (pt) => set((s) => {
    const p = snapPoint(pt, s.gridMm, s.panels)
    return { draft: { a: p, b: p } }
  }),
  dragWall: (pt) => set((s) => (s.draft ? { draft: { ...s.draft, b: snapPoint(pt, s.gridMm, s.panels) } } : {})),
  finishWall: () => set((s) => {
    if (!s.draft) return {}
    const { a, b } = s.draft
    const width = Math.round(dist(a, b))
    if (width < s.gridMm) return { draft: null }
    const id = nextCode(s.panels)
    const panel = {
      id,
      a,
      b,
      width,
      typeId: s.project.wallTypes[0]?.id || 'ext',
      topPath: [[0, DEFAULT_HEIGHT], [width, DEFAULT_HEIGHT]],
      openings: [],
    }
    return { ...histPatch(s, 'draw'), panels: [...s.panels, panel], draft: null }
  }),
  cancelWall: () => set({ draft: null }),

  select: (id) => set({ selectedId: id, selectedVertex: null }),
  deselect: () => set({ selectedId: null, selectedVertex: null }),

  // ── Historial ─────────────────────────────────────────────
  pushHistory: (key) => set((s) => histPatch(s, key)),
  undo: () => set((s) => {
    if (!s.past.length) return {}
    const prev = s.past[s.past.length - 1]
    _hKey = null
    return {
      panels: clonePanels(prev),
      past: s.past.slice(0, -1),
      future: [clonePanels(s.panels), ...s.future].slice(0, 60),
      selectedId: null,
      selectedVertex: null,
      draft: null,
    }
  }),
  redo: () => set((s) => {
    if (!s.future.length) return {}
    const next = s.future[0]
    _hKey = null
    return {
      panels: clonePanels(next),
      future: s.future.slice(1),
      past: [...s.past, clonePanels(s.panels)].slice(-60),
      selectedId: null,
      selectedVertex: null,
      draft: null,
    }
  }),

  // ── EDICIÓN: copiar / mover ───────────────────────────────
  duplicatePanel: (id) => set((s) => {
    const src = s.panels.find((p) => p.id === id)
    if (!src) return {}
    const code = nextCode(s.panels)
    const off = s.gridMm
    const copy = {
      ...src,
      id: code,
      a: [src.a[0] + off, src.a[1] - off],
      b: [src.b[0] + off, src.b[1] - off],
      topPath: src.topPath.map((p) => [...p]),
      openings: (src.openings || []).map((o) => ({ ...o })),
    }
    return { ...histPatch(s, 'dup'), panels: [...s.panels, copy], selectedId: code, selectedVertex: null }
  }),
  movePanelTo: (id, a, b) => set((s) => ({
    panels: s.panels.map((p) => (p.id === id ? { ...p, a, b } : p)),
  })),
  // Voltear: ver la cara desde el otro lado (exterior/interior).
  // Solo espeja la vista; el ancho (verdadera magnitud) no cambia.
  flipPanel: (id) => set((s) => ({
    ...histPatch(s, 'flip'),
    panels: s.panels.map((p) => (p.id === id ? { ...p, flip: !p.flip } : p)),
  })),
  selectVertex: (i) => set({ selectedVertex: i }),
  remove: (id) => set((s) => ({
    ...histPatch(s, 'remove'),
    panels: s.panels.filter((p) => p.id !== id),
    selectedId: s.selectedId === id ? null : s.selectedId,
    selectedVertex: null,
  })),
  clearAll: () => set((s) => ({ ...histPatch(s, 'clear'), panels: [], selectedId: null, selectedVertex: null })),

  // ── PLANTA: ancho exacto (mueve B en la dirección del trazo) ──
  setWidth: (id, mm) => set((s) => ({
    ...histPatch(s, 'width:' + id, true),
    panels: s.panels.map((p) => {
      if (p.id !== id) return p
      const w = Math.max(100, Math.round(+mm || 0))
      const d = dist(p.a, p.b) || 1
      const ux = (p.b[0] - p.a[0]) / d
      const uy = (p.b[1] - p.a[1]) / d
      const nb = [p.a[0] + ux * w, p.a[1] + uy * w]
      const sx = w / (p.width || w)
      const topPath = cloneTop(p.topPath).map(([x, y]) => [x * sx, y])
      topPath[0][0] = 0
      topPath[topPath.length - 1][0] = w
      return { ...p, b: nb, width: w, topPath }
    }),
  })),

  // ── ALZADO: altura lado A (izq) / B (der) ─────────────────
  setHeightA: (id, mm) => set((s) => ({
    ...histPatch(s, 'hA:' + id, true),
    panels: s.panels.map((p) => {
      if (p.id !== id) return p
      const tp = cloneTop(p.topPath)
      tp[0][1] = Math.max(0, Math.round(+mm || 0))
      return { ...p, topPath: tp }
    }),
  })),
  setHeightB: (id, mm) => set((s) => ({
    ...histPatch(s, 'hB:' + id, true),
    panels: s.panels.map((p) => {
      if (p.id !== id) return p
      const tp = cloneTop(p.topPath)
      tp[tp.length - 1][1] = Math.max(0, Math.round(+mm || 0))
      return { ...p, topPath: tp }
    }),
  })),

  // ── ALZADO: agregar punto de contorno (X desde izq, Y altura) ──
  addContourPoint: (id, x, y) => set((s) => ({
    ...histPatch(s, 'addpt'),
    panels: s.panels.map((p) => {
      if (p.id !== id) return p
      const px = Math.max(0, Math.min(p.width, Math.round(+x || 0)))
      const py = Math.max(0, Math.round(+y || 0))
      const pts = cloneTop(p.topPath)
      const ends = [pts[0], pts[pts.length - 1]]
      const mids = pts.slice(1, -1)
      mids.push([px, py])
      mids.sort((m, n) => m[0] - n[0])
      return { ...p, topPath: [ends[0], ...mids, ends[1]] }
    }),
  })),

  updateContourPoint: (id, index, x, y) => set((s) => ({
    ...histPatch(s, 'updpt:' + id + ':' + index, true),
    panels: s.panels.map((p) => {
      if (p.id !== id) return p
      const pts = cloneTop(p.topPath)
      if (!pts[index]) return p
      if (index === 0) {
        pts[0][1] = Math.max(0, Math.round(+y || 0))
      } else if (index === pts.length - 1) {
        pts[index][1] = Math.max(0, Math.round(+y || 0))
      } else {
        pts[index] = [Math.max(0, Math.min(p.width, Math.round(+x || 0))), Math.max(0, Math.round(+y || 0))]
      }
      const ends = [pts[0], pts[pts.length - 1]]
      const mids = pts.slice(1, -1).sort((m, n) => m[0] - n[0])
      return { ...p, topPath: [ends[0], ...mids, ends[1]] }
    }),
  })),

  removeContourPoint: (id, index) => set((s) => ({
    ...histPatch(s, 'rmpt'),
    panels: s.panels.map((p) => {
      if (p.id !== id) return p
      if (index <= 0 || index >= p.topPath.length - 1) return p // no borrar extremos A/B
      return { ...p, topPath: p.topPath.filter((_, i) => i !== index) }
    }),
  })),
}))
