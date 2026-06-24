import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from '../utils/nanoid'

const defaultMaterialStack = {
  profile_family: 'CU',
  profile_norm: 'IRAM-IAS-U500',
  profile_height: 100,
  profile_width: 40,
  profile_thickness: 0.95,
  stud_spacing: 400,
  layers: [],
}

export const ROOF_TYPES = {
  1: '1 agua',
  2: '2 aguas',
  3: '3 aguas',
  4: 'Plano',
}

// face = { id, name, width, height, openings: [{id, type, width, height, offset_x, sill_height}] }

export const useProjectStore = create(
  persist(
    (set, get) => ({
      project: { name: 'Proyecto sin nombre' },
      rooms: {},
      activeRoomId: null,

      setProject: (fields) => set(s => ({ project: { ...s.project, ...fields } })),

      addRoom: () => {
        const id = nanoid()
        const room = {
          id,
          name: `Ambiente ${Object.keys(get().rooms).length + 1}`,
          faces: [],
          faceCount: 4,
          roof: { type: 4, slope_pct: 0, ridge_height: 0 },
          materialStack: { ...defaultMaterialStack },
          // campos opcionales de importacion (puntos del poligono)
          points: [],
          wallProps: {},
          closed: false,
        }
        set(s => ({ rooms: { ...s.rooms, [id]: room }, activeRoomId: id }))
        return id
      },

      updateRoom: (id, fields) => set(s => ({
        rooms: { ...s.rooms, [id]: { ...s.rooms[id], ...fields } }
      })),

      deleteRoom: (id) => set(s => {
        const rooms = { ...s.rooms }
        delete rooms[id]
        return { rooms, activeRoomId: s.activeRoomId === id ? null : s.activeRoomId }
      }),

      setActiveRoom: (id) => set({ activeRoomId: id }),

      // ── caras ────────────────────────────────────────────
      setFace: (roomId, faceIdx, fields) => set(s => {
        const room = s.rooms[roomId]
        const faces = [...(room.faces || [])]
        faces[faceIdx] = { id: faces[faceIdx]?.id || nanoid(), ...faces[faceIdx], ...fields }
        return { rooms: { ...s.rooms, [roomId]: { ...room, faces } } }
      }),

      addOpening: (roomId, faceIdx, opening) => set(s => {
        const room = s.rooms[roomId]
        const faces = [...(room.faces || [])]
        const face = { ...faces[faceIdx] }
        face.openings = [...(face.openings || []), { id: nanoid(), ...opening }]
        faces[faceIdx] = face
        return { rooms: { ...s.rooms, [roomId]: { ...room, faces } } }
      }),

      updateOpening: (roomId, faceIdx, openingId, fields) => set(s => {
        const room = s.rooms[roomId]
        const faces = [...(room.faces || [])]
        const face = { ...faces[faceIdx] }
        face.openings = (face.openings || []).map(o => o.id === openingId ? { ...o, ...fields } : o)
        faces[faceIdx] = face
        return { rooms: { ...s.rooms, [roomId]: { ...room, faces } } }
      }),

      removeOpening: (roomId, faceIdx, openingId) => set(s => {
        const room = s.rooms[roomId]
        const faces = [...(room.faces || [])]
        const face = { ...faces[faceIdx] }
        face.openings = (face.openings || []).filter(o => o.id !== openingId)
        faces[faceIdx] = face
        return { rooms: { ...s.rooms, [roomId]: { ...room, faces } } }
      }),

      setRoof: (roomId, fields) => set(s => ({
        rooms: { ...s.rooms, [roomId]: { ...s.rooms[roomId], roof: { ...s.rooms[roomId].roof, ...fields } } }
      })),

      setMaterialStack: (roomId, fields) => set(s => ({
        rooms: { ...s.rooms, [roomId]: { ...s.rooms[roomId], materialStack: { ...s.rooms[roomId].materialStack, ...fields } } }
      })),
    }),
    { name: 'ilframe-v3', version: 3 }
  )
)
