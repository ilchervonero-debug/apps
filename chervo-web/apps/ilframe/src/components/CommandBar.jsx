import { useState } from 'react'
import { useDrawingStore } from '../store/drawingStore'
import '../styles/CommandBar.css'

export default function CommandBar() {
  const elements      = useDrawingStore(s => s.elements)
  const currentPoints = useDrawingStore(s => s.currentPoints)
  const snapPos       = useDrawingStore(s => s.snapPos)
  const selEl         = useDrawingStore(s => s.selectedElement)
  const activeCanvas  = useDrawingStore(s => s.activeCanvas)
  const selectEl      = useDrawingStore(s => s.selectElement)
  const deselect      = useDrawingStore(s => s.deselectElement)
  const updateEl      = useDrawingStore(s => s.updateElement)
  const finishDrawing = useDrawingStore(s => s.finishDrawing)
  const cancelDrawing = useDrawingStore(s => s.cancelDrawing)
  const finishWithLen = useDrawingStore(s => s.finishLineWithLength)
  const deleteEl      = useDrawingStore(s => s.deleteElement)
  const addNode       = useDrawingStore(s => s.addProfileNode)
  const removeNode    = useDrawingStore(s => s.removeProfileNode)
  const updateNode    = useDrawingStore(s => s.updateProfileNode)

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

  // ── Selected element — Elevation canvas ──────────────────────────────────
  if (selEl && activeCanvas === 'elevation') {
    const profile = [...(selEl.elevationProfile || [{ t: 0, h: 3000 }, { t: 1, h: 3000 }])]
      .sort((a, b) => a.t - b.t)

    const addCumbrera = () => addNode(selEl.id, 0.5)

    return (
      <div className="command-bar elev-mode">
        <div className="cmd-row">
          <span className="cmd-badge elev">{selEl.id}</span>
          <span className="cmd-label">ALZADO</span>
          <span className="cmd-sep">·</span>
          <span className="cmd-pts">
            {profile.length} nodo{profile.length !== 1 ? 's' : ''}
          </span>
          <button className="btn-add-node" onClick={addCumbrera} title="Agregar nodo central (cumbrera)">
            + Cumbrera
          </button>
          <button className="btn-close" onClick={deselect}>×</button>
        </div>

        <div className="cmd-row cmd-nodes-row">
          {profile.map((node, i) => {
            const isEndpoint = node.t === 0 || node.t === 1
            const label = node.t === 0 ? 'Inicio' : node.t === 1 ? 'Fin' : `t=${(node.t * 100).toFixed(0)}%`
            return (
              <div key={i} className={`node-item${isEndpoint ? ' endpoint' : ''}`}>
                <span className="node-label">{label}</span>
                <input
                  type="number"
                  className="cmd-prop-input node-h-input"
                  value={+(node.h / 1000).toFixed(3)}
                  step="0.1"
                  min="0.3"
                  max="10"
                  onChange={e => updateNode(selEl.id, i, parseFloat(e.target.value) * 1000 || node.h)}
                />
                <span className="cmd-unit">m</span>
                {!isEndpoint && (
                  <button
                    className="btn-del-node"
                    onClick={() => removeNode(selEl.id, i)}
                    title="Eliminar nodo"
                  >×</button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Selected element — Plan canvas ───────────────────────────────────────
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
