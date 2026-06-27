import { create } from 'zustand'

// ── Modelo iLFrame ──────────────────────────────────────────
// Planta: cada muro dibujado es un PANEL (código M1, M2…).
//   La longitud de la línea = ANCHO del panel (se edita SOLO en planta).
// Alzado: el panel es un POLÍGONO. Arranca como rectángulo de 3 m.
//   El ancho está bloqueado (viene de planta). El contorno superior se
//   edita con números exactos: altura lado A, altura lado B y puntos X/Y.

const GRID_MM = 100
const DEFAULT_HEIGHT = 3000

const snap = (mm) => Math.round(mm / GRID_MM) * GRID_MM
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])

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

export const GRID = GRID_MM
export const DEF_H = DEFAULT_HEIGHT

export const useDrawingStore = create((set) => ({
  panels: [],
  selectedId: null,
  selectedVertex: null, // índice de vértice del contorno en edición (alzado)
  activeTool: 'wall', // 'wall' | 'select'
  elevationHeight: 50, // % de alto del canvas superior
  draft: null, // { a:[mm,mm], b:[mm,mm] } mientras se arrastra en planta

  setActiveTool: (t) => set({ activeTool: t }),
  setElevationHeight: (h) => set({ elevationHeight: Math.max(20, Math.min(80, h)) }),

  // ── PLANTA: dibujar muro ──────────────────────────────────
  startWall: (pt) => set({ draft: { a: [snap(pt[0]), snap(pt[1])], b: [snap(pt[0]), snap(pt[1])] } }),
  dragWall: (pt) => set((s) => (s.draft ? { draft: { ...s.draft, b: [snap(pt[0]), snap(pt[1])] } } : {})),
  finishWall: () => set((s) => {
    if (!s.draft) return {}
    const { a, b } = s.draft
    const width = Math.round(dist(a, b))
    if (width < GRID_MM) return { draft: null }
    const id = nextCode(s.panels)
    const panel = {
      id,
      a,
      b,
      width,
      topPath: [[0, DEFAULT_HEIGHT], [width, DEFAULT_HEIGHT]],
      openings: [],
    }
    return { panels: [...s.panels, panel], draft: null, selectedId: id, selectedVertex: null }
  }),
  cancelWall: () => set({ draft: null }),

  select: (id) => set({ selectedId: id, selectedVertex: null }),
  deselect: () => set({ selectedId: null, selectedVertex: null }),
  selectVertex: (i) => set({ selectedVertex: i }),
  remove: (id) => set((s) => ({
    panels: s.panels.filter((p) => p.id !== id),
    selectedId: s.selectedId === id ? null : s.selectedId,
    selectedVertex: null,
  })),
  clearAll: () => set({ panels: [], selectedId: null, selectedVertex: null }),

  // ── PLANTA: ancho exacto (mueve B en la dirección del trazo) ──
  setWidth: (id, mm) => set((s) => ({
    panels: s.panels.map((p) => {
      if (p.id !== id) return p
      const w = Math.max(GRID_MM, Math.round(+mm || 0))
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
    panels: s.panels.map((p) => {
      if (p.id !== id) return p
      const tp = cloneTop(p.topPath)
      tp[0][1] = Math.max(0, Math.round(+mm || 0))
      return { ...p, topPath: tp }
    }),
  })),
  setHeightB: (id, mm) => set((s) => ({
    panels: s.panels.map((p) => {
      if (p.id !== id) return p
      const tp = cloneTop(p.topPath)
      tp[tp.length - 1][1] = Math.max(0, Math.round(+mm || 0))
      return { ...p, topPath: tp }
    }),
  })),

  // ── ALZADO: agregar punto de contorno (X desde izq, Y altura) ──
  addContourPoint: (id, x, y) => set((s) => ({
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
    panels: s.panels.map((p) => {
      if (p.id !== id) return p
      if (index <= 0 || index >= p.topPath.length - 1) return p // no borrar extremos A/B
      return { ...p, topPath: p.topPath.filter((_, i) => i !== index) }
    }),
  })),
}))
