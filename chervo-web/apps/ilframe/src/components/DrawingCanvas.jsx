import { useRef, useEffect, useState } from 'react'
import { useDrawingStore, panelPolygon, panelMaxHeight, MAJOR, snapPoint, nearestVertex, VERT_RADIUS } from '../store/drawingStore'
import '../styles/DrawingCanvas.css'

const SVG = 'http://www.w3.org/2000/svg'

// ── Transformaciones de coordenadas ────────────────────────
// PLANTA: mm → viewBox (1000x400), origen abajo-izquierda, Y hacia arriba
const PLAN = { ox: 60, oy: 350, s: 0.05 } // s = vb por mm (1000mm = 50vb → ~18m visibles)
const planToVb = ([x, y]) => [PLAN.ox + x * PLAN.s, PLAN.oy - y * PLAN.s]
const vbToPlan = ([vx, vy]) => [(vx - PLAN.ox) / PLAN.s, (PLAN.oy - vy) / PLAN.s]

function el(tag, attrs) {
  const n = document.createElementNS(SVG, tag)
  for (const k in attrs) n.setAttribute(k, attrs[k])
  return n
}

export default function DrawingCanvas() {
  const elevRef = useRef(null)
  const planRef = useRef(null)
  const dividerRef = useRef(null)
  const dragRef = useRef({ active: false, moved: false })
  const lpRef = useRef({ timer: null, fired: false, startVb: null, client: [0, 0] })
  const movingRef = useRef(null) // { id, origA, origB, startMm } durante el arrastre de mover
  const [isResizing, setIsResizing] = useState(false)
  const [cursor, setCursor] = useState(null)
  const [menu, setMenu] = useState(null) // { id, x, y } menú contextual (coords de pantalla)
  const [moving, setMoving] = useState(null) // id del panel en modo mover

  const panels = useDrawingStore((s) => s.panels)
  const selectedId = useDrawingStore((s) => s.selectedId)
  const selectedVertex = useDrawingStore((s) => s.selectedVertex)
  const activeTool = useDrawingStore((s) => s.activeTool)
  const draft = useDrawingStore((s) => s.draft)
  const elevationHeight = useDrawingStore((s) => s.elevationHeight)
  const gridMm = useDrawingStore((s) => s.gridMm)
  const setGrid = useDrawingStore((s) => s.setGrid)

  // ── Render reactivo ──
  useEffect(() => {
    drawPlan(planRef.current, panels, selectedId, draft, cursor, activeTool, gridMm)
    drawElevation(elevRef.current, panels, selectedId, selectedVertex, gridMm)
  }, [panels, selectedId, selectedVertex, draft, cursor, activeTool, gridMm])

  // ── Divisor arrastrable ──
  const startResize = (e) => { setIsResizing(true); e.preventDefault() }
  useEffect(() => {
    if (!isResizing) return
    const move = (e) => {
      const rect = dividerRef.current.parentElement.getBoundingClientRect()
      const cy = e.touches ? e.touches[0].clientY : e.clientY
      useDrawingStore.getState().setElevationHeight(((cy - rect.top) / rect.height) * 100)
    }
    const up = () => setIsResizing(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
    }
  }, [isResizing])

  // Conversión exacta pantalla → viewBox usando la matriz del SVG.
  // (Evita el error de snap cuando el SVG no llena exacto su viewBox.)
  const getVb = (e, svg) => {
    const t = e.touches?.[0] || e.changedTouches?.[0]
    const cx = t ? t.clientX : e.clientX
    const cy = t ? t.clientY : e.clientY
    const ctm = svg.getScreenCTM()
    if (ctm) {
      const pt = svg.createSVGPoint()
      pt.x = cx
      pt.y = cy
      const p = pt.matrixTransform(ctm.inverse())
      return [p.x, p.y]
    }
    const r = svg.getBoundingClientRect()
    return [(cx - r.left) / (r.width / 1000), (cy - r.top) / (r.height / 400)]
  }

  const clearLongPress = () => {
    if (lpRef.current.timer) { clearTimeout(lpRef.current.timer); lpRef.current.timer = null }
  }

  // ── PLANTA: dibujar / seleccionar / mover / menú ──
  const planDown = (e) => {
    const svg = planRef.current
    const vb = getVb(e, svg)
    const mm = vbToPlan(vb)
    const st = useDrawingStore.getState()
    const cx = e.touches?.[0]?.clientX ?? e.clientX
    const cy = e.touches?.[0]?.clientY ?? e.clientY
    setMenu(null)

    // modo mover: arrastrar el panel seleccionado
    if (moving) {
      const p = st.panels.find((x) => x.id === moving)
      if (p) { movingRef.current = { id: moving, origA: p.a, origB: p.b, startMm: mm }; setCursor({ view: 'plan', vb }); return }
    }

    try { svg.setPointerCapture?.(e.pointerId) } catch { /* no-op */ }
    lpRef.current = { timer: null, fired: false, startVb: vb, client: [cx, cy] }

    // long-press: abre menú contextual sobre el muro
    lpRef.current.timer = setTimeout(() => {
      lpRef.current.fired = true
      if (dragRef.current.active) { useDrawingStore.getState().cancelWall(); dragRef.current.active = false }
      const hit = pickPanel(mm, useDrawingStore.getState().panels)
      if (hit) { useDrawingStore.getState().select(hit); setMenu({ id: hit, x: lpRef.current.client[0], y: lpRef.current.client[1] }) }
    }, 480)

    if (activeTool === 'wall') {
      dragRef.current = { active: true, moved: false }
      st.startWall(mm)
    }
    setCursor({ view: 'plan', vb })
  }

  const planMove = (e) => {
    const vb = getVb(e, planRef.current)
    setCursor({ view: 'plan', vb })

    // mover panel
    if (movingRef.current) {
      const mm = vbToPlan(vb)
      const g = useDrawingStore.getState().gridMm
      const { id, origA, origB, startMm } = movingRef.current
      const dx = Math.round((mm[0] - startMm[0]) / g) * g
      const dy = Math.round((mm[1] - startMm[1]) / g) * g
      useDrawingStore.getState().movePanelTo(id, [origA[0] + dx, origA[1] + dy], [origB[0] + dx, origB[1] + dy])
      return
    }

    // si el dedo se movió, cancelar el long-press (es un trazo/gesto)
    if (lpRef.current.startVb) {
      const d = Math.hypot(vb[0] - lpRef.current.startVb[0], vb[1] - lpRef.current.startVb[1])
      if (d > 6) clearLongPress()
    }
    if (dragRef.current.active) {
      useDrawingStore.getState().dragWall(vbToPlan(vb))
      dragRef.current.moved = true
    }
  }

  const planUp = (e) => {
    clearLongPress()
    // terminar movimiento
    if (movingRef.current) { movingRef.current = null; setMoving(null); return }
    // terminar trazo
    if (dragRef.current.active) {
      useDrawingStore.getState().finishWall()
      dragRef.current.active = false
    }
    // tap corto con herramienta seleccionar → abrir menú
    if (!lpRef.current.fired && activeTool === 'select') {
      const vb = getVb(e, planRef.current)
      const mm = vbToPlan(vb)
      const st = useDrawingStore.getState()
      const hit = pickPanel(mm, st.panels)
      const cx = e.changedTouches?.[0]?.clientX ?? e.clientX
      const cy = e.changedTouches?.[0]?.clientY ?? e.clientY
      if (hit) { st.select(hit); setMenu({ id: hit, x: cx, y: cy }) }
      else st.deselect()
    }
  }

  // acciones del menú contextual
  const doMove = () => { if (menu) { setMoving(menu.id); setMenu(null) } }
  const doCopy = () => { if (menu) { useDrawingStore.getState().duplicatePanel(menu.id); setMenu(null) } }
  const doDelete = () => { if (menu) { useDrawingStore.getState().remove(menu.id); setMenu(null) } }

  // ── ALZADO: seleccionar vértice del panel activo ──
  const elevDown = (e) => {
    const st = useDrawingStore.getState()
    const panel = st.panels.find((p) => p.id === st.selectedId)
    if (!panel) return
    const vb = getVb(e, elevRef.current)
    const tf = elevTransform(panel)
    // buscar vértice más cercano del contorno (topPath)
    let best = null, bestD = 28
    panel.topPath.forEach((pt, i) => {
      const v = tf.toVb(pt)
      const d = Math.hypot(v[0] - vb[0], v[1] - vb[1])
      if (d < bestD) { bestD = d; best = i }
    })
    st.selectVertex(best)
  }

  return (
    <div className="drawing-canvas">
      {/* Banner modo mover */}
      {moving && (
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: '#fe0000', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.25)', display: 'flex', gap: 10, alignItems: 'center' }}>
          Moviendo {moving} — arrastralo a su lugar
          <button onClick={() => setMoving(null)} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', borderRadius: 12, padding: '2px 10px', fontWeight: 700, cursor: 'pointer' }}>Listo</button>
        </div>
      )}

      {/* Menú contextual */}
      {menu && (
        <>
          <div onClick={() => setMenu(null)} onPointerDown={() => setMenu(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
          <div style={{
            position: 'fixed', left: Math.min(menu.x, window.innerWidth - 150), top: Math.min(menu.y, window.innerHeight - 160),
            zIndex: 91, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12,
            boxShadow: '0 6px 24px rgba(0,0,0,0.18)', overflow: 'hidden', minWidth: 140,
          }}>
            <div style={{ padding: '8px 14px', fontSize: 11, fontWeight: 800, color: '#fe0000', borderBottom: '1px solid #f0f0f0' }}>{menu.id}</div>
            <CtxItem label="Mover" onClick={doMove} />
            <CtxItem label="Copiar" onClick={doCopy} />
            <CtxItem label="Borrar" danger onClick={doDelete} />
          </div>
        </>
      )}

      <div className="canvas-section" style={{ height: `${elevationHeight}%` }}>
        <div className="canvas-header">Alzado — cara del panel {selectedId ? `(${selectedId})` : ''}</div>
        <svg
          ref={elevRef}
          className="canvas-svg"
          viewBox="0 0 1000 400"
          style={{ touchAction: 'none' }}
          onPointerDown={elevDown}
        />
      </div>

      <div
        ref={dividerRef}
        className={`canvas-divider ${isResizing ? 'dragging' : ''}`}
        onMouseDown={startResize}
        onTouchStart={startResize}
      >
        <div className="divider-handle"></div>
      </div>

      <div className="canvas-section" style={{ height: `${100 - elevationHeight}%` }}>
        <div className="canvas-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Planta — {moving ? 'arrastrá el muro a su lugar' : activeTool === 'wall' ? 'arrastrá para dibujar · mantené presionado para editar' : 'tocá un muro para editar'}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: '#999' }}>Grilla</span>
            {[400, 600].map((g) => (
              <button key={g} onClick={() => setGrid(g)}
                style={{
                  border: '1px solid', borderColor: gridMm === g ? '#fe0000' : '#ddd',
                  background: gridMm === g ? '#fe0000' : '#fff', color: gridMm === g ? '#fff' : '#666',
                  borderRadius: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', cursor: 'pointer',
                }}>
                {g === 400 ? '40' : '60'}
              </button>
            ))}
            <span style={{ fontSize: 10, color: '#999' }}>cm</span>
          </span>
        </div>
        <svg
          ref={planRef}
          className="canvas-svg"
          viewBox="0 0 1000 400"
          style={{ touchAction: 'none' }}
          onPointerDown={planDown}
          onPointerMove={planMove}
          onPointerUp={planUp}
        />
      </div>
    </div>
  )
}

function CtxItem({ label, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px',
      background: '#fff', border: 'none', borderBottom: '1px solid #f5f5f5',
      fontSize: 14, fontWeight: 600, color: danger ? '#fe0000' : '#333', cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}

// ── Selección de muro por cercanía (mm) ────────────────────
function pickPanel(mm, panels) {
  let best = null, bestD = 600 // tolerancia 600mm
  for (const p of panels) {
    const d = distPointSeg(mm, p.a, p.b)
    if (d < bestD) { bestD = d; best = p.id }
  }
  return best
}
function distPointSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const l2 = dx * dx + dy * dy
  if (l2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

// ── Transformación del alzado (ajusta el panel al canvas) ──
function elevTransform(panel) {
  const maxH = panelMaxHeight(panel)
  const w = panel.width || 1000
  const margin = 70
  const s = Math.min((1000 - margin * 2) / w, (400 - margin * 2) / maxH)
  const ox = (1000 - w * s) / 2
  const oy = 400 - margin
  return { s, ox, oy, toVb: ([x, y]) => [ox + x * s, oy - y * s] }
}

// ── Dibujo PLANTA ──────────────────────────────────────────
function drawPlan(svg, panels, selectedId, draft, cursor, activeTool, gridMm) {
  if (!svg) return
  svg.innerHTML = ''
  svg.appendChild(el('rect', { width: 1000, height: 400, fill: 'white' }))
  drawPlanGrid(svg, gridMm)

  // muros
  panels.forEach((p) => {
    const a = planToVb(p.a), b = planToVb(p.b)
    const sel = p.id === selectedId
    svg.appendChild(el('line', {
      x1: a[0], y1: a[1], x2: b[0], y2: b[1],
      stroke: sel ? '#fe0000' : '#333', 'stroke-width': sel ? 4 : 2.5, 'stroke-linecap': 'round',
    }))
    ;[a, b].forEach((pt) => svg.appendChild(el('circle', { cx: pt[0], cy: pt[1], r: sel ? 4 : 3, fill: sel ? '#fe0000' : '#666' })))
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const code = el('text', { x: mid[0], y: mid[1] - 10, 'font-size': 15, 'font-weight': 'bold', fill: sel ? '#fe0000' : '#333', 'text-anchor': 'middle' })
    code.textContent = p.id
    svg.appendChild(code)
    const len = el('text', { x: mid[0], y: mid[1] + 16, 'font-size': 11, fill: '#888', 'text-anchor': 'middle' })
    len.textContent = `${(p.width / 1000).toFixed(2)} m`
    svg.appendChild(len)
  })

  // trazo en curso
  if (draft) {
    const a = planToVb(draft.a), b = planToVb(draft.b)
    svg.appendChild(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#fe0000', 'stroke-width': 2, 'stroke-dasharray': '5 4' }))
    const w = Math.round(Math.hypot(draft.b[0] - draft.a[0], draft.b[1] - draft.a[1]))
    if (w > 0) {
      const t = el('text', { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 - 8, 'font-size': 13, 'font-weight': 'bold', fill: '#fe0000', 'text-anchor': 'middle' })
      t.textContent = `${w} mm`
      svg.appendChild(t)
    }
  }

  // indicador de snap: verde si engancha a un vértice, rojo si a la grilla
  if (cursor?.view === 'plan' && activeTool === 'wall') {
    const mm = vbToPlan(cursor.vb)
    const sp = snapPoint(mm, gridMm, panels)
    const onVertex = nearestVertex(mm, panels, gridMm * VERT_RADIUS) != null
    const v = planToVb(sp)
    if (onVertex) {
      svg.appendChild(el('circle', { cx: v[0], cy: v[1], r: 7, fill: 'none', stroke: '#16a34a', 'stroke-width': 2 }))
      svg.appendChild(el('circle', { cx: v[0], cy: v[1], r: 2.5, fill: '#16a34a' }))
    } else {
      svg.appendChild(el('circle', { cx: v[0], cy: v[1], r: 5, fill: 'none', stroke: '#fe0000', 'stroke-width': 1.5 }))
    }
  }
}

function drawPlanGrid(svg, gridMm) {
  const g = el('g', {})
  for (let mm = 0; mm <= 24000; mm += gridMm) {
    const v = planToVb([mm, 0])[0]
    if (v > 1000) break
    const major = mm % MAJOR === 0
    g.appendChild(el('line', { x1: v, y1: 0, x2: v, y2: 400, stroke: major ? '#cfcfcf' : '#eee', 'stroke-width': major ? 1 : 0.5 }))
  }
  for (let mm = 0; mm <= 9000; mm += gridMm) {
    const v = planToVb([0, mm])[1]
    if (v < 0) break
    const major = mm % MAJOR === 0
    g.appendChild(el('line', { x1: 0, y1: v, x2: 1000, y2: v, stroke: major ? '#cfcfcf' : '#eee', 'stroke-width': major ? 1 : 0.5 }))
  }
  svg.appendChild(g)
}

// ── Dibujo ALZADO ──────────────────────────────────────────
function drawElevation(svg, panels, selectedId, selectedVertex, gridMm) {
  if (!svg) return
  svg.innerHTML = ''
  svg.appendChild(el('rect', { width: 1000, height: 400, fill: 'white' }))

  const panel = panels.find((p) => p.id === selectedId)
  if (!panel) {
    const t = el('text', { x: 500, y: 200, 'font-size': 15, fill: '#bbb', 'text-anchor': 'middle' })
    t.textContent = 'Seleccioná un muro en la planta para editar su cara'
    svg.appendChild(t)
    return
  }

  const tf = elevTransform(panel)

  // grilla del alzado (cada gridMm, mayor cada 1.20m)
  const maxH = panelMaxHeight(panel)
  const g = el('g', {})
  for (let x = 0; x <= panel.width; x += gridMm) {
    const a = tf.toVb([x, 0]), b = tf.toVb([x, maxH])
    g.appendChild(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: x % MAJOR === 0 ? '#d4d4d4' : '#efefef', 'stroke-width': x % MAJOR === 0 ? 0.9 : 0.5 }))
  }
  for (let y = 0; y <= maxH; y += gridMm) {
    const a = tf.toVb([0, y]), b = tf.toVb([panel.width, y])
    g.appendChild(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: y % MAJOR === 0 ? '#d4d4d4' : '#efefef', 'stroke-width': y % MAJOR === 0 ? 0.9 : 0.5 }))
  }
  svg.appendChild(g)

  // polígono de la cara
  const poly = panelPolygon(panel).map(tf.toVb)
  const pts = poly.map((v) => `${v[0]},${v[1]}`).join(' ')
  svg.appendChild(el('polygon', { points: pts, fill: 'rgba(254,0,0,0.07)', stroke: '#fe0000', 'stroke-width': 2, 'stroke-linejoin': 'round' }))

  // base bloqueada (ancho de planta) — más gruesa y gris
  const baseA = tf.toVb([0, 0]), baseB = tf.toVb([panel.width, 0])
  svg.appendChild(el('line', { x1: baseA[0], y1: baseA[1], x2: baseB[0], y2: baseB[1], stroke: '#555', 'stroke-width': 4, 'stroke-linecap': 'round' }))

  // cota de ancho (bloqueado)
  const wt = el('text', { x: (baseA[0] + baseB[0]) / 2, y: baseA[1] + 22, 'font-size': 12, 'font-weight': 'bold', fill: '#555', 'text-anchor': 'middle' })
  wt.textContent = `ancho ${(panel.width / 1000).toFixed(2)} m (planta)`
  svg.appendChild(wt)

  // vértices del contorno con etiqueta de altura
  panel.topPath.forEach((pt, i) => {
    const v = tf.toVb(pt)
    const isEnd = i === 0 || i === panel.topPath.length - 1
    const selV = i === selectedVertex
    svg.appendChild(el('circle', { cx: v[0], cy: v[1], r: selV ? 7 : 5, fill: selV ? '#fe0000' : '#fff', stroke: '#fe0000', 'stroke-width': 2 }))
    const lbl = el('text', { x: v[0], y: v[1] - 12, 'font-size': 11, 'font-weight': 'bold', fill: '#fe0000', 'text-anchor': 'middle' })
    lbl.textContent = isEnd ? `${i === 0 ? 'A' : 'B'} ${pt[1]}mm` : `${pt[1]}mm`
    svg.appendChild(lbl)
  })
}
