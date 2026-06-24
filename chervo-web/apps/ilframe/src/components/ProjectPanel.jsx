import { useState } from 'react'
import { useProjectStore, ELEMENT_TYPES } from '../store/useProjectStore'
import { useDrawingStore } from '../store/drawingStore'
import { CU_NORMS, CU_SECTIONS } from '../data/profiles'
import { LAYER_PRESETS } from '../data/layers'

const TYPE_ICONS = {
  wall:   '▭',
  roof:   '△',
  floor:  '▬',
  beam:   '━',
  column: '│',
}

export default function ProjectPanel() {
  const [addingType, setAddingType] = useState(null)

  const {
    project, rooms, activeRoomId,
    setProject, addRoom, deleteRoom, setActiveRoom, updateRoom, setMaterialStack,
  } = useProjectStore()

  const setActiveComponentId = useDrawingStore(s => s.setActiveComponentId)
  const activeComponentId    = useDrawingStore(s => s.activeComponentId)
  const drawingElements      = useDrawingStore(s => s.elements)
  const clearComponent       = useDrawingStore(s => s.clearComponent)

  const roomList  = Object.values(rooms)
  const activeRoom = activeRoomId ? rooms[activeRoomId] : null
  const ms        = activeRoom?.materialStack

  const studSections = (CU_SECTIONS[ms?.profile_norm || 'cu_1']?.C || [])

  function handleAddRoom(type) {
    const id = addRoom(type)
    setActiveComponentId(id)
    setAddingType(null)
  }

  function handleSelectRoom(id) {
    setActiveRoom(id)
    setActiveComponentId(id)
  }

  function handleDeleteRoom(id) {
    clearComponent(id)
    deleteRoom(id)
    if (activeComponentId === id) setActiveComponentId(null)
  }

  function countElements(roomId) {
    return drawingElements.filter(e => e.componentId === roomId).length
  }

  return (
    <div style={{
      width: 270, minWidth: 270, background: 'white',
      borderRight: '1px solid #e8e8e8',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      fontFamily: "'Exo', system-ui, sans-serif",
    }}>

      {/* Project name */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Proyecto</div>
        <input
          style={{
            width: '100%', background: '#f7f7f7', border: '1px solid #eee',
            borderRadius: 5, padding: '6px 9px', fontSize: 13,
            fontFamily: 'inherit', color: '#1a1a1a', boxSizing: 'border-box',
          }}
          value={project.name}
          onChange={e => setProject({ name: e.target.value })}
          placeholder="Nombre del proyecto..."
        />
      </div>

      {/* Components list */}
      <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Componentes
          </span>
          <button
            onClick={() => setAddingType(addingType ? null : 'picker')}
            style={{
              background: addingType ? '#1a1a1a' : '#fe0000',
              color: 'white', border: 'none', borderRadius: 4,
              fontSize: 11, fontWeight: 700, padding: '3px 9px', cursor: 'pointer',
            }}
          >
            {addingType ? '×' : '+ Agregar'}
          </button>
        </div>

        {/* Type picker */}
        {addingType === 'picker' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
            {Object.entries(ELEMENT_TYPES).map(([type, { label, color }]) => (
              <button
                key={type}
                onClick={() => handleAddRoom(type)}
                style={{
                  background: '#f7f7f7', border: `1.5px solid ${color}20`,
                  borderRadius: 5, padding: '7px 6px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 600, color: '#333',
                  transition: 'background 0.1s',
                }}
              >
                <span style={{ fontSize: 14, color }}>{TYPE_ICONS[type]}</span>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Room list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
          {roomList.length === 0 && (
            <div style={{ fontSize: 12, color: '#bbb', fontStyle: 'italic', padding: '6px 0' }}>
              Agregá un componente para empezar
            </div>
          )}
          {roomList.map(room => {
            const type   = room.elementType || 'wall'
            const color  = ELEMENT_TYPES[type]?.color || '#fe0000'
            const isActive = room.id === activeRoomId
            const nLines = countElements(room.id)
            return (
              <div
                key={room.id}
                onClick={() => handleSelectRoom(room.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                  background: isActive ? `${color}0f` : 'transparent',
                  border: `1.5px solid ${isActive ? color + '40' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ color, fontSize: 13, flexShrink: 0 }}>{TYPE_ICONS[type]}</span>
                <input
                  value={room.name}
                  onClick={e => e.stopPropagation()}
                  onChange={e => updateRoom(room.id, { name: e.target.value })}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    fontSize: 12, fontWeight: 600, color: '#1a1a1a',
                    fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                    minWidth: 0,
                  }}
                />
                <span style={{ fontSize: 10, color: nLines > 0 ? color : '#ccc', fontFamily: 'monospace', flexShrink: 0 }}>
                  {nLines > 0 ? `${nLines}L` : '—'}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteRoom(room.id) }}
                  style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}
                >×</button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active room config */}
      {activeRoom && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Configurar: {activeRoom.name}
          </div>

          {/* Element type badge */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 5 }}>Tipo</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {Object.entries(ELEMENT_TYPES).map(([type, { label, color }]) => (
                <button
                  key={type}
                  onClick={() => updateRoom(activeRoom.id, { elementType: type })}
                  style={{
                    padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', border: `1.5px solid ${(activeRoom.elementType || 'wall') === type ? color : '#e0e0e0'}`,
                    background: (activeRoom.elementType || 'wall') === type ? `${color}15` : 'transparent',
                    color: (activeRoom.elementType || 'wall') === type ? color : '#888',
                    transition: 'all 0.15s',
                  }}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* Norm */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Norma</div>
            <select
              value={ms?.profile_norm || 'cu_1'}
              onChange={e => setMaterialStack(activeRoom.id, { profile_norm: e.target.value })}
              style={selectStyle}
            >
              {CU_NORMS.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>

          {/* Stud profile */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Perfil C (montante)</div>
            <select
              value={`${ms?.profile_height || 100}_${ms?.profile_thickness || 0.95}`}
              onChange={e => {
                const [h, t] = e.target.value.split('_')
                setMaterialStack(activeRoom.id, { profile_height: +h, profile_thickness: +t })
              }}
              style={selectStyle}
            >
              {studSections.map((c, i) => (
                <option key={i} value={`${c.h}_${c.t}`}>
                  C {c.h}×{c.w}×{c.t}mm — {c.kg} kg/m
                </option>
              ))}
            </select>
          </div>

          {/* Spacing */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Separación montantes</div>
            <select
              value={ms?.stud_spacing || 400}
              onChange={e => setMaterialStack(activeRoom.id, { stud_spacing: +e.target.value })}
              style={selectStyle}
            >
              <option value={300}>300 mm</option>
              <option value={400}>400 mm</option>
              <option value={600}>600 mm</option>
            </select>
          </div>

          {/* Layer preset */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Kit de capas</div>
            <select
              defaultValue=""
              onChange={e => {
                const preset = LAYER_PRESETS[e.target.value]
                if (preset) setMaterialStack(activeRoom.id, { layers: preset.layers })
                e.target.value = ''
              }}
              style={selectStyle}
            >
              <option value="" disabled>Seleccionar preset...</option>
              {Object.entries(LAYER_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
            {(ms?.layers?.length > 0) && (
              <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {ms.layers.slice(0, 4).map((l, i) => (
                  <span key={i} style={{ fontSize: 10, background: '#f0f0f0', borderRadius: 3, padding: '2px 6px', color: '#666' }}>
                    {l}
                  </span>
                ))}
                {ms.layers.length > 4 && (
                  <span style={{ fontSize: 10, color: '#aaa' }}>+{ms.layers.length - 4} más</span>
                )}
              </div>
            )}
          </div>

          {/* Draw button */}
          <button
            onClick={() => setActiveComponentId(activeRoom.id)}
            style={{
              width: '100%', padding: '9px 0',
              background: activeComponentId === activeRoom.id ? '#22aa55' : '#fe0000',
              color: 'white', border: 'none', borderRadius: 6,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.15s', letterSpacing: '0.3px',
            }}
          >
            {activeComponentId === activeRoom.id ? '✓ Dibujando aquí' : '→ Dibujar este componente'}
          </button>

          {activeComponentId === activeRoom.id && countElements(activeRoom.id) > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`¿Borrar las ${countElements(activeRoom.id)} líneas de ${activeRoom.name}?`)) {
                  clearComponent(activeRoom.id)
                }
              }}
              style={{
                width: '100%', marginTop: 6, padding: '6px 0',
                background: 'transparent', color: '#aaa',
                border: '1px solid #eee', borderRadius: 6,
                fontSize: 11, cursor: 'pointer',
              }}
            >
              Limpiar geometría
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const selectStyle = {
  width: '100%', background: '#f7f7f7', border: '1px solid #eee',
  borderRadius: 5, padding: '6px 8px', fontSize: 12,
  fontFamily: 'inherit', color: '#1a1a1a', appearance: 'auto',
  cursor: 'pointer',
}
