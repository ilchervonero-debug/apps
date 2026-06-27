import { useState } from 'react'
import { useDrawingStore } from '../store/drawingStore'
import '../styles/DrawingTools.css'

export default function DrawingTools() {
  const [expanded, setExpanded] = useState(false)
  const activeTool = useDrawingStore((state) => state.activeTool)
  const setActiveTool = useDrawingStore((state) => state.setActiveTool)

  const tools = [
    { id: 'wall', label: 'Muro', icon: 'line' },
    { id: 'select', label: 'Seleccionar', icon: 'select' },
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
    select: <svg {...iconProps}><path d="M5 3l14 9-7 1-4 7z" fill="currentColor" stroke="none" /></svg>,
  }

  return <span className="tool-icon">{icons[type]}</span>
}
