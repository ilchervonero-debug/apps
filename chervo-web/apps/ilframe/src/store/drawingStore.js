import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const SNAP      = 100
const DEFAULT_H = 3000

function dist(p1, p2) {
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1]
  return Math.round(Math.sqrt(dx * dx + dy * dy))
}

function wallId(elements) {
  const n = elements.filter(e => e.type === 'line').length
  return `M${n + 1}`
}

function defaultProfile(h = DEFAULT_H) {
  return [{ t: 0, h }, { t: 1, h }]
}

// Interpolate profile height at position t
function interpH(profile, t) {
  const sorted = [...profile].sort((a, b) => a.t - b.t)
  let left  = sorted[0]
  let right = sorted[sorted.length - 1]
  for (const n of sorted) {
    if (n.t <= t) left  = n
    if (n.t >= t) { right = n; break }
  }
  if (left.t === right.t) return left.h
  return Math.round(left.h + (right.h - left.h) * ((t - left.t) / (right.t - left.t)))
}

function makeElement(id, points, length, componentId = null) {
  return {
    id,
    type:             'line',
    points,
    properties:       { length, height: DEFAULT_H },
    elevationProfile: defaultProfile(DEFAULT_H),
    connections:      [],
    componentId,
  }
}

export const useDrawingStore = create(
  persist(
    (set, get) => ({
      elements:          [],
      selectedId:        null,
      selectedElement:   null,
      activeTool:        'line',
      currentPoints:     [],
      snapPos:           [0, 0],
      activeCanvas:      'plan',
      activeComponentId: null,

      setSnapPos:           (pos)    => set({ snapPos: pos }),
      setActiveTool:        (tool)   => set({ activeTool: tool }),
      setActiveCanvas:      (canvas) => set({ activeCanvas: canvas }),
      setActiveComponentId: (id)     => set({ activeComponentId: id }),

      addPoint: (rawPoint) => {
        const state = get()
        const pt  = [Math.round(rawPoint[0] / SNAP) * SNAP, Math.round(rawPoint[1] / SNAP) * SNAP]
        const pts = [...state.currentPoints, pt]

        if (state.activeTool === 'line' && pts.length === 2) {
          const len = dist(pts[0], pts[1])
          if (len < SNAP) return
          set({
            elements: [...state.elements, makeElement(wallId(state.elements), pts, len, state.activeComponentId)],
            currentPoints: [],
          })
          return
        }
        set({ currentPoints: pts })
      },

      finishDrawing: () => {
        const { currentPoints, elements, activeComponentId } = get()
        if (currentPoints.length < 2) { set({ currentPoints: [] }); return }
        const len = dist(currentPoints[0], currentPoints[currentPoints.length - 1])
        set({
          elements: [...elements, makeElement(wallId(elements), currentPoints, len, activeComponentId)],
          currentPoints: [],
        })
      },

      finishLineWithLength: (start, direction, length) => {
        const { elements, activeComponentId } = get()
        const dx = direction[0] - start[0], dy = direction[1] - start[1]
        const d  = Math.sqrt(dx * dx + dy * dy)
        const end = [
          Math.round(start[0] + (d > 0 ? dx / d : 1) * length),
          Math.round(start[1] + (d > 0 ? dy / d : 0) * length),
        ]
        set({
          elements: [...elements, makeElement(wallId(elements), [start, end], length, activeComponentId)],
          currentPoints: [],
        })
      },

      cancelDrawing: () => set({ currentPoints: [] }),

      // ── Element ──────────────────────────────────────────────────────────────

      updateElement: (id, updates) => {
        set(state => {
          const elements = state.elements.map(el => {
            if (el.id !== id) return el
            const updated = { ...el, ...updates }
            if (updates.properties?.height !== undefined) {
              const h = updates.properties.height
              updated.elevationProfile = (updated.elevationProfile || defaultProfile()).map(n =>
                (n.t === 0 || n.t === 1) ? { ...n, h } : n
              )
            }
            return updated
          })
          return { elements, selectedElement: _syncSelected(state, id, elements) }
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

      // ── Elevation profile ────────────────────────────────────────────────────

      updateProfileNode: (id, index, h) => {
        set(state => {
          const elements = state.elements.map(el => {
            if (el.id !== id) return el
            const profile = [...(el.elevationProfile || defaultProfile())]
            if (index < 0 || index >= profile.length) return el
            profile[index] = { ...profile[index], h: Math.max(300, Math.min(10000, Math.round(h))) }
            return { ...el, elevationProfile: profile }
          })
          return { elements, selectedElement: _syncSelected(state, id, elements) }
        })
      },

      addProfileNode: (id, t) => {
        set(state => {
          const el = state.elements.find(e => e.id === id)
          if (!el) return state
          const profile = el.elevationProfile || defaultProfile()
          if (profile.some(n => Math.abs(n.t - t) < 0.02)) return state
          const newH    = interpH(profile, t)
          const newProf = [...profile, { t, h: newH }].sort((a, b) => a.t - b.t)
          const elements = state.elements.map(e => e.id === id ? { ...e, elevationProfile: newProf } : e)
          return { elements, selectedElement: _syncSelected(state, id, elements) }
        })
      },

      removeProfileNode: (id, index) => {
        set(state => {
          const el = state.elements.find(e => e.id === id)
          if (!el) return state
          const profile = el.elevationProfile || defaultProfile()
          const node = profile[index]
          if (!node || node.t === 0 || node.t === 1) return state
          const newProf  = profile.filter((_, i) => i !== index)
          const elements = state.elements.map(e => e.id === id ? { ...e, elevationProfile: newProf } : e)
          return { elements, selectedElement: _syncSelected(state, id, elements) }
        })
      },

      clearAll: () => set({ elements: [], selectedId: null, selectedElement: null, currentPoints: [] }),

      clearComponent: (componentId) => set(state => ({
        elements:        state.elements.filter(el => el.componentId !== componentId),
        selectedId:      null,
        selectedElement: null,
      })),
    }),
    { name: 'ilframe-drawing-v1' }
  )
)

function _syncSelected(state, id, elements) {
  return state.selectedId === id
    ? (elements.find(el => el.id === id) ?? null)
    : state.selectedElement
}
