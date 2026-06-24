import { create } from 'zustand'

const GRID_SIZE = 100 // mm por celda de grilla
const DEFAULT_ELEVATION_HEIGHT = 3000 // 3m por defecto

const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE

const calculateDistance = (p1, p2) => {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  return Math.sqrt(dx * dx + dy * dy)
}

const arePointsConnected = (p1, p2, tolerance = 5) => {
  return calculateDistance(p1, p2) <= tolerance
}

const generateElementId = (type, elements) => {
  const prefix = { line: 'L', polyline: 'P', door: 'D', window: 'V', opening: 'A' }[type] || 'E'
  const count = elements.filter((el) => el.type === type).length
  return `${prefix}${count + 1}`
}

export const useDrawingStore = create((set, get) => ({
  elements: [],
  selectedId: null,
  activeTool: 'line',
  selectedElement: null,
  elevationHeight: 50,
  gridSize: GRID_SIZE,
  drawingMode: false,
  currentPoints: [],

  config: {
    tipo: 'wall',
    perfil: 'CU 100x40x0.95',
    props: { largo: 5000, alto: 2400, angulo: 0 },
    avanzado: { btb: false, blocking: false, stiffener: false },
  },

  addPoint: (point) => set((state) => {
    const snappedPoint = [snapToGrid(point[0]), snapToGrid(point[1])]
    return { currentPoints: [...state.currentPoints, snappedPoint] }
  }),

  finishDrawing: (view = 'plan') => set((state) => {
    if (!state.currentPoints || state.currentPoints.length < 2) return state

    const points = state.currentPoints
    const length = calculateDistance(points[0], points[points.length - 1])
    const toolType = state.activeTool || 'polyline'

    const newElement = {
      id: generateElementId(toolType, state.elements),
      type: toolType,
      view,
      points,
      properties: {
        length: Math.round(length),
        height: DEFAULT_ELEVATION_HEIGHT,
        angle: 0,
      },
      connections: [],
    }

    const updatedElements = state.elements.map((el) => {
      if (!el.points) return el
      const connected = points.some((p) => el.points.some((ep) => arePointsConnected(p, ep)))
      return connected ? { ...el, connections: [...new Set([...el.connections, newElement.id])] } : el
    })

    return {
      elements: [...updatedElements, newElement],
      currentPoints: [],
      drawingMode: false,
    }
  }),

  cancelDrawing: () => set({ currentPoints: [], drawingMode: false }),

  addElement: (element) => {
    const state = get()
    const newElement = { ...element, id: generateElementId(element.type, state.elements) }
    set({ elements: [...state.elements, newElement] })
    return newElement.id
  },

  updateElement: (id, updates) => {
    const state = get()
    set({
      elements: state.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    })
  },

  deleteElement: (id) => {
    const state = get()
    set({
      elements: state.elements.filter((el) => el.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })
  },

  selectElement: (id) => {
    const state = get()
    const element = state.elements.find((el) => el.id === id)
    set({
      selectedId: id,
      selectedElement: element,
    })
  },

  deselectElement: () => {
    set({
      selectedId: null,
      selectedElement: null,
    })
  },

  setActiveTool: (tool) => {
    set({ activeTool: tool })
  },

  updateConfig: (key, value) => {
    const state = get()
    set({
      config: { ...state.config, [key]: value },
    })
  },

  updateProps: (props) => {
    const state = get()
    set({
      config: {
        ...state.config,
        props: { ...state.config.props, ...props },
      },
    })
  },

  updateAdvanced: (key, value) => {
    const state = get()
    set({
      config: {
        ...state.config,
        avanzado: { ...state.config.avanzado, [key]: value },
      },
    })
  },

  applyConfig: () => {
    const state = get()
    if (!state.selectedId) return

    set({
      elements: state.elements.map((el) =>
        el.id === state.selectedId
          ? {
              ...el,
              tipo: state.config.tipo,
              perfil: state.config.perfil,
              props: state.config.props,
              avanzado: state.config.avanzado,
            }
          : el
      ),
    })
  },

  setElevationHeight: (height) => {
    set({ elevationHeight: Math.max(20, Math.min(80, height)) })
  },

  clearAll: () => {
    set({
      elements: [],
      selectedId: null,
      selectedElement: null,
    })
  },
}))
