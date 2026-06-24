import { useState } from 'react'
import { useDrawingStore } from '../store/drawingStore'
import '../styles/CommandBar.css'

export default function CommandBar() {
  const elements      = useDrawingStore(s => s.elements)
  const currentPoints = useDrawingStore(s => s.currentPoints)
  const snapPos       = useDrawingStore(s => s.snapPos)
  const selEl         = useDrawingStore(s => s.selectedElement)
  const selectEl      = useDrawingStore(s => s.selectElement)
  const deselect      = useDrawingStore(s => s.deselectElement)
  const updateEl      = useDrawingStore(s => s.updateElement)
  const finishDrawing = useDrawingStore(s => s.finishDrawing)
  const cancelDrawing = useDrawingStore(s => s.cancelDrawing)
  const finishWithLen = useDrawingStore(s => s.finishLineWithLength)
  const deleteEl      = useDrawingStore(s => s.deleteElement)

  const [lenInput, setLenInput] = useState('')

  // ── Drawing mode ─────────────────────────────────────────────────────────
  if (currentPoints.length > 0) {
    const last = currentPoints[currentPoints.length - 1]
    const liveDist = snapPos
      ? Math.round(Math.sqrt((snapPos[0] - last[0]) ** 2 + (snapPos[1] - last[1]) ** 2))
      : 0

    const applyLength = () => {
      const len = parseFloat(lenInput)
      if (!len || len <= 0 || currentPoints.length !== 1 || !snapPos) return
      finishWithLen(currentPoints[0], snapPos, len)
      setLenInput('')
    }

    return (
      <div className="command-bar drawing-mode">
        <div className="cmd-row">
          <span className="cmd-badge draw">DIBUJANDO</span>
          <span className="cmd-pts">
            {currentPoints.length} punto{currentPoints.length !== 1 ? 's' : ''} colocado{currentPoints.length !== 1 ? 's' : ''}
          </span>
          <span className="cmd-sep">·</span>
          <span className="cmd-live">{liveDist} mm</span>
          {currentPoints.length >= 2 && (
            <button className="btn-ok" onClick={finishDrawing}>✓ Finalizar</button>
          )}
          <button className="btn-esc" onClick={cancelDrawing}>✕ Cancelar</button>
        </div>

        {/* Only show length input after first point is placed (line tool) */}
        {currentPoints.length === 1 && (
          <div className="cmd-row cmd-len-row">
            <span className="cmd-label">Longitud exacta</span>
            <input
              className="cmd-len-input"
              type="number"
              placeholder="ej: 3500"
              value={lenInput}
              onChange={e => setLenInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyLength()}
              autoFocus
            />
            <span className="cmd-unit">mm</span>
            <button className="btn-ok" onClick={applyLength} disabled={!lenInput}>→</button>
          </div>
        )}
      </div>
    )
  }

  // ── Selected element ─────────────────────────────────────────────────────
  if (selEl) {
    return (
      <div className="command-bar selected-mode">
        <div className="cmd-row">
          <span className="cmd-badge sel">{selEl.id}</span>

          <label className="cmd-label">Largo</label>
          <input
            type="number"
            className="cmd-prop-input"
            value={selEl.properties?.length ?? 0}
            onChange={e => updateEl(selEl.id, {
              properties: { ...selEl.properties, length: parseInt(e.target.value) || 0 },
            })}
          />
          <span className="cmd-unit">mm</span>

          <label className="cmd-label" style={{ marginLeft: 12 }}>Alto</label>
          <input
            type="number"
            className="cmd-prop-input"
            value={selEl.properties?.height ?? 3000}
            onChange={e => updateEl(selEl.id, {
              properties: { ...selEl.properties, height: parseInt(e.target.value) || 3000 },
            })}
          />
          <span className="cmd-unit">mm</span>

          <button
            className="btn-esc"
            style={{ marginLeft: 'auto' }}
            onClick={() => deleteEl(selEl.id)}
            title="Eliminar"
          >🗑</button>
          <button className="btn-close" onClick={deselect}>×</button>
        </div>
      </div>
    )
  }

  // ── Idle: element list ───────────────────────────────────────────────────
  return (
    <div className="command-bar">
      {elements.length === 0 ? (
        <div className="cmd-empty">
          Seleccioná la herramienta <strong>Línea</strong> y hacé clic en la Planta para dibujar un muro
        </div>
      ) : (
        <div className="cmd-list">
          {elements.map(el => (
            <div key={el.id} className="cmd-item" onClick={() => selectEl(el.id)}>
              <span className="item-id">{el.id}</span>
              <span className="item-len">{el.properties?.length ?? 0} mm</span>
              <span className="item-h">h: {((el.properties?.height ?? 3000) / 1000).toFixed(1)} m</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
