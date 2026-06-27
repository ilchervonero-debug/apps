import { useState } from 'react'
import { useDrawingStore, panelPolygon, polygonArea } from '../store/drawingStore'
import '../styles/CommandBar.css'

// Input numérico con buffer local: te deja vaciar el campo y escribir
// tu medida sin que salte al mínimo en cada tecla.
function NumInput({ value, onCommit, className, step = 100 }) {
  const [text, setText] = useState(String(value ?? ''))
  const [focused, setFocused] = useState(false)
  const [prev, setPrev] = useState(value)
  // sincroniza desde el store solo si cambió por fuera y no estás editando
  if (!focused && value !== prev) {
    setPrev(value)
    setText(String(value ?? ''))
  }
  return (
    <input
      type="number"
      step={step}
      className={className}
      value={text}
      onFocus={(e) => { setFocused(true); e.target.select() }}
      onChange={(e) => {
        setText(e.target.value)
        if (e.target.value !== '' && !isNaN(+e.target.value)) onCommit(e.target.value)
      }}
      onBlur={() => {
        setFocused(false)
        if (text === '' || isNaN(+text)) setText(String(value ?? ''))
        else onCommit(text)
      }}
    />
  )
}

export default function CommandBar() {
  const panels = useDrawingStore((s) => s.panels)
  const selectedId = useDrawingStore((s) => s.selectedId)
  const selectedVertex = useDrawingStore((s) => s.selectedVertex)
  const select = useDrawingStore((s) => s.select)
  const deselect = useDrawingStore((s) => s.deselect)
  const remove = useDrawingStore((s) => s.remove)
  const setWidth = useDrawingStore((s) => s.setWidth)
  const setHeightA = useDrawingStore((s) => s.setHeightA)
  const setHeightB = useDrawingStore((s) => s.setHeightB)
  const addContourPoint = useDrawingStore((s) => s.addContourPoint)
  const updateContourPoint = useDrawingStore((s) => s.updateContourPoint)
  const removeContourPoint = useDrawingStore((s) => s.removeContourPoint)
  const flipPanel = useDrawingStore((s) => s.flipPanel)

  const [npX, setNpX] = useState('')
  const [npY, setNpY] = useState('')

  const panel = panels.find((p) => p.id === selectedId)

  // ── Sin selección: lista de paneles + totales ──
  if (!panel) {
    const totalArea = panels.reduce((a, p) => a + polygonArea(panelPolygon(p)) / 1e6, 0)
    return (
      <div className="command-bar">
        <div className="cmd-elements-list">
          <div className="list-header">
            Paneles: {panels.length}
            {panels.length > 0 && <span style={{ float: 'right', color: '#888' }}>{totalArea.toFixed(2)} m² total</span>}
          </div>
          {panels.length === 0 ? (
            <div className="list-empty">Dibujá muros en la planta (cada uno es un panel)</div>
          ) : (
            <div className="list-items">
              {panels.map((p) => (
                <div key={p.id} className="list-item" onClick={() => select(p.id)}>
                  <span className="item-id">{p.id}</span>
                  <span className="item-props">{(p.width / 1000).toFixed(2)} m ancho</span>
                  <span className="item-props">{(polygonArea(panelPolygon(p)) / 1e6).toFixed(2)} m²</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const heightA = panel.topPath[0][1]
  const heightB = panel.topPath[panel.topPath.length - 1][1]
  const mids = panel.topPath.slice(1, -1) // puntos intermedios del contorno
  const area = polygonArea(panelPolygon(panel)) / 1e6

  return (
    <div className="command-bar">
      <div className="cmd-editor">
        <div className="editor-header">
          <span className="editor-id">{panel.id}</span>
          <span className="editor-type">{area.toFixed(2)} m²</span>
          <button className="btn-close" onClick={deselect}>×</button>
        </div>

        {/* PLANTA: ancho (única medida editable de planta) */}
        <div className="editor-section">
          <div className="editor-sublabel">Planta</div>
          <label>
            <span className="editor-label">Ancho (mm):</span>
            <NumInput value={panel.width} onCommit={(v) => setWidth(panel.id, v)} />
          </label>
        </div>

        {/* ALZADO: alturas de extremos */}
        <div className="editor-section">
          <div className="editor-sublabel" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Alzado — contorno{panel.flip ? ' (vista volteada)' : ''}</span>
            <button onClick={() => flipPanel(panel.id)}
              style={{ marginLeft: 'auto', border: '1px solid #ddd', background: '#fff', color: '#555', borderRadius: 6, fontSize: 11, fontWeight: 700, padding: '3px 9px', cursor: 'pointer' }}>
              ⇄ Ver del otro lado
            </button>
          </div>
          <label>
            <span className="editor-label">Altura lado A (mm):</span>
            <NumInput value={heightA} onCommit={(v) => setHeightA(panel.id, v)} />
          </label>
          <label>
            <span className="editor-label">Altura lado B (mm):</span>
            <NumInput value={heightB} onCommit={(v) => setHeightB(panel.id, v)} />
          </label>
        </div>

        {/* Puntos intermedios del contorno */}
        <div className="editor-section">
          <div className="editor-sublabel">Puntos del contorno (X desde A, Y altura)</div>
          {mids.length === 0 && <div className="list-empty" style={{ padding: '6px 0' }}>Sin puntos intermedios</div>}
          {mids.map((pt, i) => {
            const idx = i + 1 // índice real en topPath
            const selV = idx === selectedVertex
            return (
              <div key={idx} className={`contour-row ${selV ? 'sel' : ''}`}>
                <NumInput value={pt[0]} onCommit={(v) => updateContourPoint(panel.id, idx, v, pt[1])} />
                <span className="contour-x">×</span>
                <NumInput value={pt[1]} onCommit={(v) => updateContourPoint(panel.id, idx, pt[0], v)} />
                <button className="contour-del" onClick={() => removeContourPoint(panel.id, idx)}>×</button>
              </div>
            )
          })}

          {/* agregar punto exacto */}
          <div className="contour-add">
            <input type="number" step="100" placeholder="X" value={npX} onChange={(e) => setNpX(e.target.value)} />
            <span className="contour-x">×</span>
            <input type="number" step="100" placeholder="Y" value={npY} onChange={(e) => setNpY(e.target.value)} />
            <button className="contour-addbtn" onClick={() => {
              if (npX === '' || npY === '') return
              addContourPoint(panel.id, npX, npY)
              setNpX(''); setNpY('')
            }}>+ Punto</button>
          </div>
        </div>

        <button className="btn-delete-panel" onClick={() => remove(panel.id)}>Eliminar panel {panel.id}</button>
      </div>
    </div>
  )
}
