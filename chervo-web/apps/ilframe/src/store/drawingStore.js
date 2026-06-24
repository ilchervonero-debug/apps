import { create } from 'zustand'

const SNAP = 100           // mm snap increment
const DEFAULT_H = 3000     // mm default wall height

function dist(p1, p2) {
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1]
  return Math.round(Math.sqrt(dx * dx + dy * dy))
}

function wallId(elements) {
  const n = elements.filter(e => e.type === 'line').length
  return `M${n + 1}`
}

export const useDrawingStore = create((set, get) => ({
  elements:        [],
  selectedId:      null,
  selectedElement: null,
  activeTool:      'line',
  currentPoints:   [],
  snapPos:         [0, 0],

  setSnapPos: (pos) => set({ snapPos: pos }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  addPoint: (rawPoint) => {
    const state = get()
    const pt = [
      Math.round(rawPoint[0] / SNAP) * SNAP,
      Math.round(rawPoint[1] / SNAP) * SNAP,
    ]
    const pts = [...state.currentPoints, pt]

    // Line tool: auto-finish after 2 points
    if (state.activeTool === 'line' && pts.length === 2) {
      const len = dist(pts[0], pts[1])
      if (len < SNAP) return  // ignore near-zero lines
      const el = {
        id:         wallId(state.elements),
        type:       'line',
        points:     pts,
        properties: { length: len, height: DEFAULT_H },
        connections: [],
      }
      set({ elements: [...state.elements, el], currentPoints: [] })
      return
    }

    set({ currentPoints: pts })
  },

  finishDrawing: () => {
    const { currentPoints, elements } = get()
    if (currentPoints.length < 2) { set({ currentPoints: [] }); return }
    const len = dist(currentPoints[0], currentPoints[currentPoints.length - 1])
    const el = {
      id:         wallId(elements),
      type:       'line',
      points:     currentPoints,
      properties: { length: len, height: DEFAULT_H },
      connections: [],
    }
    set({ elements: [...elements, el], currentPoints: [] })
  },

  // Finish line from currentPoints[0] in direction of snapPos, with exact length
  finishLineWithLength: (start, direction, length) => {
    const { elements } = get()
    const dx = direction[0] - start[0]
    const dy = direction[1] - start[1]
    const d  = Math.sqrt(dx * dx + dy * dy)
    const ux = d > 0 ? dx / d : 1
    const uy = d > 0 ? dy / d : 0
    const end = [
      Math.round(start[0] + ux * length),
      Math.round(start[1] + uy * length),
    ]
    const el = {
      id:         wallId(elements),
      type:       'line',
      points:     [start, end],
      properties: { length, height: DEFAULT_H },
      connections: [],
    }
    set({ elements: [...elements, el], currentPoints: [] })
  },

  cancelDrawing: () => set({ currentPoints: [] }),

  updateElement: (id, updates) => {
    set(state => {
      const elements = state.elements.map(el => el.id === id ? { ...el, ...updates } : el)
      const selectedElement =
        state.selectedId === id
          ? (elements.find(el => el.id === id) ?? null)
          : state.selectedElement
      return { elements, selectedElement }
    })
  },

  deleteElement: (id) => {
    set(state => ({
      elements:        state.elements.filter(el => el.id !== id),
      selectedId:      state.selectedId === id ? null : state.selectedId,
      selectedElement: state.selectedId === id ? null : state.selectedElement,
    }))
  },

  selectElement: (id) => {
    set(state => ({
      selectedId:      id,
      selectedElement: state.elements.find(el => el.id === id) ?? null,
    }))
  },

  deselectElement: () => set({ selectedId: null, selectedElement: null }),

  clearAll: () => set({
    elements: [], selectedId: null, selectedElement: null, currentPoints: [],
  }),
}))
