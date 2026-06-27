import { useDrawingStore } from '../store/drawingStore'
import '../styles/CommandBar.css'

export default function CommandBar() {
  const elements = useDrawingStore((state) => state.elements)
  const currentPoints = useDrawingStore((state) => state.currentPoints)
  const selectedElement = useDrawingStore((state) => state.selectedElement)
  const selectElement = useDrawingStore((state) => state.selectElement)
  const deselectElement = useDrawingStore((state) => state.deselectElement)
  const updateElement = useDrawingStore((state) => state.updateElement)
  const setElementLength = useDrawingStore((state) => state.setElementLength)
  const finishDrawing = useDrawingStore((state) => state.finishDrawing)
  const cancelDrawing = useDrawingStore((state) => state.cancelDrawing)

  if (currentPoints.length > 0) {
    return (
      <div className="command-bar">
        <div className="cmd-drawing-controls">
          <span className="drawing-info">{currentPoints.length} puntos</span>
          <button className="btn-finish" onClick={() => finishDrawing('plan')}>
            [OK] Finalizar
          </button>
          <button className="btn-cancel" onClick={cancelDrawing}>
            [X] Cancelar
          </button>
        </div>
      </div>
    )
  }

  if (selectedElement) {
    return (
      <div className="command-bar">
        <div className="cmd-editor">
          <div className="editor-header">
            <span className="editor-id">{selectedElement.id}</span>
            <span className="editor-type">{selectedElement.type}</span>
            <button className="btn-close" onClick={deselectElement}>×</button>
          </div>

          <div className="editor-section">
            <label>
              <span className="editor-label">Largo (mm):</span>
              <input
                type="number"
                value={selectedElement.properties?.length || 0}
                onChange={(e) => setElementLength(selectedElement.id, e.target.value)}
              />
            </label>

            <label>
              <span className="editor-label">Alto (mm):</span>
              <input
                type="number"
                value={selectedElement.properties?.height || 3000}
                onChange={(e) => updateElement(selectedElement.id, {
                  properties: { ...selectedElement.properties, height: parseInt(e.target.value) }
                })}
              />
            </label>

            <label>
              <span className="editor-label">Ángulo (°):</span>
              <input
                type="number"
                value={selectedElement.properties?.angle || 0}
                onChange={(e) => updateElement(selectedElement.id, {
                  properties: { ...selectedElement.properties, angle: parseFloat(e.target.value) }
                })}
              />
            </label>
          </div>

          {selectedElement.connections?.length > 0 && (
            <div className="editor-section">
              <div className="editor-label">Conexiones</div>
              <div className="connections">
                {selectedElement.connections.map((connId) => (
                  <span key={connId} className="connection-tag">{connId}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="command-bar">
      <div className="cmd-elements-list">
        <div className="list-header">Elementos dibujados</div>
        {elements.length === 0 ? (
          <div className="list-empty">Dibuja elementos en el canvas</div>
        ) : (
          <div className="list-items">
            {elements.map((el) => (
              <div
                key={el.id}
                className="list-item"
                onClick={() => selectElement(el.id)}
              >
                <span className="item-id">{el.id}</span>
                <span className="item-type">{el.type}</span>
                <span className="item-props">
                  {el.properties?.length ? `${Math.round(el.properties.length)}mm` : '—'}
                </span>
                {el.connections?.length > 0 && (
                  <span className="item-conn">✓ conectado</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
