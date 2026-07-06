import { useState, useRef } from 'react'
import { useDrawingStore } from '../store/drawingStore'
import '../styles/DrawingTools.css'

export default function DrawingTools() {
  const [expanded, setExpanded] = useState(false)
  const [bottom, setBottom] = useState(16) // posición vertical del FAB (px desde abajo)
  const dragRef = useRef({ active: false, moved: false, startY: 0, startBottom: 16 })
  const activeTool = useDrawingStore((state) => state.activeTool)
  const setActiveTool = useDrawingStore((state) => state.setActiveTool)

  const togDown = (e) => {
    dragRef.current = { active: true, moved: false, startY: e.clientY, startBottom: bottom }
    try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* no-op */ }
  }
  const togMove = (e) => {
    if (!dragRef.current.active) return
    const d = dragRef.current.startY - e.clientY // subir el dedo => sube el FAB
    if (Math.abs(d) > 4) dragRef.current.moved = true
    const max = Math.max(40, window.innerHeight - 200)
    setBottom(Math.max(8, Math.min(max, dragRef.current.startBottom + d)))
  }
  const togUp = () => {
    if (dragRef.current.active && !dragRef.current.moved) setExpanded((v) => !v)
    dragRef.current.active = false
  }

  const tools = [
    { id: 'wall', label: 'Muro', icon: 'wall' },
    { id: 'pilar', label: 'Pilar', icon: 'pilar' },
    { id: 'columna', label: 'Columna', icon: 'columna' },
    { id: 'viga', label: 'Viga', icon: 'viga' },
    { id: 'cercha', label: 'Cercha', icon: 'cercha' },
    { id: 'roof', label: 'Techo', icon: 'roof' },
    { id: 'ceiling', label: 'Cielorraso', icon: 'ceiling' },
    { id: 'slab', label: 'Losa de piso', icon: 'slab' },
    { id: 'door', label: 'Puerta', icon: 'door' },
    { id: 'window', label: 'Ventana', icon: 'window' },
    { id: 'opening', label: 'Abertura', icon: 'opening' },
    { id: 'tconnect', label: 'T-connect', icon: 'tconnect' },
    { id: 'select', label: 'Seleccionar', icon: 'select' },
  ]

  const handleSelectTool = (toolId) => {
    setActiveTool(toolId)
    setExpanded(false)
    const st = useDrawingStore.getState()
    st.setTcFirst(null) // reinicia la secuencia de T-connect al cambiar de herramienta
    if (toolId === 'viga') {
      st.selectBeam(null)
      st.setBeamSheet(true) // submenú: tipo de viga + perfil + nivel
    } else if (toolId === 'cercha') {
      st.selectCercha(null)
      st.setCerchaSheet(true) // submenú: estilo + perfil + medidas
    } else if (toolId === 'pilar') {
      st.selectPilar(null)
      st.setPilarConfig({ kind: 'armada' })
      st.setPilarSheet(true) // pilar armado: perfiles agrupados
    } else if (toolId === 'columna') {
      st.selectPilar(null)
      st.setPilarConfig({ kind: 'reticulada' })
      st.setPilarSheet(true) // columna reticulada / acartelada
    } else if (toolId === 'roof') {
      st.selectTecho(null)
      st.setTechoSheet(true) // forma + aleros + clavadores + chapa
    } else if (toolId === 'slab') {
      st.selectLosa(null)
      st.setLosaSheet(true) // dirección + separación + perfil + deck
    }
  }

  return (
    <div className="drawing-tools-container" style={{ bottom }}>
      <button
        className="tools-toggle"
        onPointerDown={togDown}
        onPointerMove={togMove}
        onPointerUp={togUp}
        style={{ touchAction: 'none' }}
        title={expanded ? 'Contraer' : 'Herramientas · arrastrá para mover'}
      >
        {expanded ? '×' : '≡'}
      </button>

      {expanded && (
        <div className="tools-grid">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => handleSelectTool(tool.id)}
              title={tool.label}
            >
              <ToolIcon type={tool.icon} />
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ToolIcon({ type }) {
  const iconProps = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1, strokeLinecap: 'round', strokeLinejoin: 'round' }

  const icons = {
    wall: <svg {...iconProps}><line x1="4" y1="12" x2="20" y2="12" /></svg>,
    roof: <svg {...iconProps}><path d="M3 13L12 5l9 8" /></svg>,
    ceiling: <svg {...iconProps}><line x1="4" y1="6" x2="20" y2="6" /><line x1="7" y1="6" x2="7" y2="10" /><line x1="12" y1="6" x2="12" y2="10" /><line x1="17" y1="6" x2="17" y2="10" /></svg>,
    slab: <svg {...iconProps}><rect x="3" y="9" width="18" height="6" rx="1" /></svg>,
    pilar: <svg {...iconProps}><rect x="9" y="3" width="6" height="18" rx="1" /></svg>,
    columna: <svg {...iconProps}><line x1="8" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="16" y2="21" /><path d="M8 5h8" /><path d="M8 19h8" /><path d="M8 8 16 15" /><path d="M16 8 8 15" /></svg>,
    viga: <svg {...iconProps}><rect x="3" y="9" width="18" height="6" rx="1" /><line x1="3" y1="12" x2="21" y2="12" /></svg>,
    cercha: <svg {...iconProps}><path d="M3 20h18L12 5z" /><line x1="12" y1="5" x2="12" y2="20" /><line x1="7.5" y1="20" x2="12" y2="12.5" /><line x1="16.5" y1="20" x2="12" y2="12.5" /></svg>,
    door: <svg {...iconProps}><rect x="6" y="3" width="12" height="18" rx="1" /><circle cx="14" cy="12" r="1" fill="currentColor" /></svg>,
    window: <svg {...iconProps}><rect x="4" y="5" width="16" height="14" rx="1" /><line x1="12" y1="5" x2="12" y2="19" /><line x1="4" y1="12" x2="20" y2="12" /></svg>,
    opening: <svg {...iconProps}><rect x="5" y="5" width="14" height="14" rx="1" stroke-dasharray="3 2" /></svg>,
    tconnect: <svg {...iconProps}><line x1="4" y1="8" x2="20" y2="8" /><line x1="12" y1="8" x2="12" y2="20" /></svg>,
    select: <svg {...iconProps}><path d="M5 3l14 9-7 1-4 7z" fill="currentColor" stroke="none" /></svg>,
  }

  return <span className="tool-icon">{icons[type]}</span>
}
