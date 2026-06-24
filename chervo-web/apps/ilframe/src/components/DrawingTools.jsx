import { useState } from 'react'
import { useDrawingStore } from '../store/drawingStore'
import '../styles/DrawingTools.css'

export default function DrawingTools() {
  const [expanded, setExpanded] = useState(false)
  const activeTool = useDrawingStore((state) => state.activeTool)
  const setActiveTool = useDrawingStore((state) => state.setActiveTool)

  const tools = [
    { id: 'line', label: 'Línea', icon: 'line' },
    { id: 'point', label: 'Punto', icon: 'point' },
    { id: 'polyline', label: 'Polilínea', icon: 'polyline' },
    { id: 'door', label: 'Puerta', icon: 'door' },
    { id: 'window', label: 'Ventana', icon: 'window' },
    { id: 'truss', label: 'Cercha', icon: 'truss' },
  ]

  const handleSelectTool = (toolId) => {
    setActiveTool(toolId)
    setExpanded(false)
  }

  return (
    <div className="drawing-tools-container">
      <button
        className="tools-toggle"
        onClick={() => setExpanded(!expanded)}
        title={expanded ? 'Contraer' : 'Herramientas'}
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
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ToolIcon({ type }) {
  const iconProps = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

  const icons = {
    line: <svg {...iconProps}><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    point: <svg {...iconProps}><circle cx="12" cy="12" r="4" fill="currentColor" /></svg>,
    polyline: <svg {...iconProps}><polyline points="3 12 9 6 15 12 21 6" /></svg>,
    door: <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M 12 7 L 12 12 L 3 19" /></svg>,
    window: <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="1" /><line x1="12" y1="3" x2="12" y2="21" /><line x1="3" y1="12" x2="21" y2="12" /></svg>,
    truss: <svg {...iconProps}><line x1="3" y1="20" x2="21" y2="20" /><line x1="12" y1="3" x2="3" y2="20" /><line x1="12" y1="3" x2="21" y2="20" /></svg>,
  }

  return <span className="tool-icon">{icons[type]}</span>
}
