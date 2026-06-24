import { useRef, useEffect, useState } from 'react'
import { useDrawingStore } from '../store/drawingStore'
import '../styles/DrawingCanvas.css'

// Canvas coordinate space (mm = real-world millimetres)
const PLAN_W  = 10000   // plan canvas width  in mm
const PLAN_H  = 6000    // plan canvas height in mm
const ELEV_H  = 4000    // elevation canvas height in mm
const FLOOR_Y = 3600    // floor line position in elevation (from top, mm)
const GRID    = 500     // visual grid spacing (mm)
const SNAP    = 100     // snap increment (mm)

// Convert screen pixels → mm in the SVG coordinate space
function toMM(cx, cy, svgEl, W, H) {
  const r = svgEl.getBoundingClientRect()
  return [(cx - r.left) / r.width * W, (cy - r.top) / r.height * H]
}

function snapPoint(x, y) {
  return [Math.round(x / SNAP) * SNAP, Math.round(y / SNAP) * SNAP]
}

function dist([x1, y1], [x2, y2]) {
  return Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2))
}

export default function DrawingCanvas() {
  const elevRef = useRef(null)
  const planRef = useRef(null)
  const divRef  = useRef(null)

  const [splitPct,  setSplitPct]  = useState(38)   // elevation % of total height
  const [dragging,  setDragging]  = useState(false)
  const [localSnap, setLocalSnap] = useState([500, 500])

  const elements      = useDrawingStore(s => s.elements)
  const selectedId    = useDrawingStore(s => s.selectedId)
  const activeTool    = useDrawingStore(s => s.activeTool)
  const currentPoints = useDrawingStore(s => s.currentPoints)
  const addPoint      = useDrawingStore(s => s.addPoint)
  const finishDrawing = useDrawingStore(s => s.finishDrawing)
  const cancelDrawing = useDrawingStore(s => s.cancelDrawing)
  const setSnapPos    = useDrawingStore(s => s.setSnapPos)

  // Push snap position to store so CommandBar can read it
  useEffect(() => { setSnapPos(localSnap) }, [localSnap, setSnapPos])

  // Redraw both canvases whenever anything changes
  useEffect(() => {
    renderElev(elevRef.current, elements, selectedId)
    renderPlan(planRef.current, elements, selectedId, currentPoints, localSnap, activeTool)
  }, [elements, selectedId, currentPoints, localSnap, activeTool])

  // Divider drag
  useEffect(() => {
    if (!dragging) return
    const move = e => {
      const r = divRef.current.parentElement.getBoundingClientRect()
      setSplitPct(Math.min(75, Math.max(20, (e.clientY - r.top) / r.height * 100)))
    }
    const up = () => setDragging(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [dragging])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') { currentPoints.length >= 2 ? finishDrawing() : cancelDrawing() }
      if (e.key === 'Enter' && currentPoints.length >= 2) finishDrawing()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [currentPoints, finishDrawing, cancelDrawing])

  const onPlanMove = e => {
    if (!planRef.current) return
    const [x, y] = toMM(e.clientX, e.clientY, planRef.current, PLAN_W, PLAN_H)
    setLocalSnap(snapPoint(x, y))
  }

  const onPlanClick = () => {
    if (!activeTool || !['line', 'polyline'].includes(activeTool)) return
    addPoint(localSnap)
  }

  const isDrawing = activeTool && ['line', 'polyline'].includes(activeTool)

  return (
    <div className="drawing-canvas">
      {/* ── Elevation (top) ─────────────────────────────────────── */}
      <div className="canvas-section" style={{ height: `${splitPct}%` }}>
        <div className="canvas-header">Alzado</div>
        <svg
          ref={elevRef}
          className="canvas-svg"
          viewBox={`0 0 ${PLAN_W} ${ELEV_H}`}
          preserveAspectRatio="xMinYMin meet"
          style={{ cursor: 'default' }}
        />
      </div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div
        ref={divRef}
        className={`canvas-divider${dragging ? ' dragging' : ''}`}
        onMouseDown={() => setDragging(true)}
      >
        <div className="divider-handle" />
      </div>

      {/* ── Plan (bottom) ───────────────────────────────────────── */}
      <div className="canvas-section" style={{ height: `${100 - splitPct}%` }}>
        <div className="canvas-header">Planta</div>
        <svg
          ref={planRef}
          className="canvas-svg"
          viewBox={`0 0 ${PLAN_W} ${PLAN_H}`}
          preserveAspectRatio="xMinYMin meet"
          style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
          onMouseMove={onPlanMove}
          onClick={onPlanClick}
        />
      </div>
    </div>
  )
}

// ─── Elevation renderer ──────────────────────────────────────────────────────

function renderElev(svg, elements, selectedId) {
  if (!svg) return
  svg.innerHTML = ''

  bg(svg, PLAN_W, ELEV_H, '#f7f7f7')

  // Vertical grid (aligned with plan X axis)
  for (let x = 0; x <= PLAN_W; x += GRID) {
    ln(svg, x, 0, x, ELEV_H, '#e6e6e6', '1')
  }

  // 3m reference guide line
  const ref3m = FLOOR_Y - 3000
  ln(svg, 0, ref3m, PLAN_W, ref3m, '#ddd', '1.5')
  tx(svg, 90, ref3m - 70, '3.0 m', { sz: '160', fill: '#bbb' })

  // Floor line
  ln(svg, 0, FLOOR_Y, PLAN_W, FLOOR_Y, '#222', '14')

  // Wall rectangles
  elements.forEach(el => {
    if (el.type !== 'line' || el.points.length < 2) return
    const h   = el.properties?.height ?? 3000
    const len = el.properties?.length ?? 0
    const x0  = el.points[0][0]
    const sel = el.id === selectedId

    const rw = Math.max(len, 200)
    const rh = h

    rct(svg, x0, FLOOR_Y - rh, rw, rh, {
      fill:   sel ? 'rgba(254,0,0,.12)' : 'rgba(40,40,40,.08)',
      stroke: sel ? '#fe0000' : '#333',
      sw:     sel ? '14' : '6',
      id:     el.id,
    })

    tx(svg, x0 + rw / 2, FLOOR_Y - rh - 90, el.id, {
      sz: '200', fill: sel ? '#fe0000' : '#999', anchor: 'middle', bold: true,
    })
  })

  // Click to select
  svg.querySelectorAll('[data-id]').forEach(el =>
    el.addEventListener('click', e => {
      e.stopPropagation()
      useDrawingStore.getState().selectElement(el.getAttribute('data-id'))
    })
  )
}

// ─── Plan renderer ───────────────────────────────────────────────────────────

function renderPlan(svg, elements, selectedId, currentPoints, snapPos, activeTool) {
  if (!svg) return
  svg.innerHTML = ''

  bg(svg, PLAN_W, PLAN_H, '#fff')

  // Grid lines
  for (let x = 0; x <= PLAN_W; x += GRID) {
    const major = x % (GRID * 2) === 0
    ln(svg, x, 0, x, PLAN_H, major ? '#d0d0d0' : '#ebebeb', major ? '1.5' : '0.8')
  }
  for (let y = 0; y <= PLAN_H; y += GRID) {
    const major = y % (GRID * 2) === 0
    ln(svg, 0, y, PLAN_W, y, major ? '#d0d0d0' : '#ebebeb', major ? '1.5' : '0.8')
  }

  // Grid dots at every intersection
  for (let x = 0; x <= PLAN_W; x += GRID) {
    for (let y = 0; y <= PLAN_H; y += GRID) {
      cr(svg, x, y, 14, '#c8c8c8')
    }
  }

  // Axis labels (every meter)
  for (let x = GRID; x <= PLAN_W; x += GRID) {
    tx(svg, x, PLAN_H - 25, `${x / 1000}`, { sz: '95', fill: '#bbb', anchor: 'middle' })
  }
  for (let y = GRID; y < PLAN_H; y += GRID) {
    tx(svg, 28, y + 40, `${y / 1000}`, { sz: '95', fill: '#bbb', anchor: 'middle' })
  }

  // Origin axes
  ln(svg, 0, 0, 800, 0, '#fe0000', '5')
  ln(svg, 0, 0, 0, 800, '#fe0000', '5')
  tx(svg, 900, 70, 'X', { sz: '180', fill: '#fe0000', bold: true })
  tx(svg, 60, 960, 'Y', { sz: '180', fill: '#fe0000', bold: true })

  // Drawn walls
  elements.forEach(el => {
    if (el.type !== 'line' || el.points.length < 2) return
    const sel = el.id === selectedId

    pl(svg, el.points, {
      stroke: sel ? '#fe0000' : '#1a1a1a',
      sw:     sel ? '22' : '12',
      id:     el.id,
    })

    el.points.forEach(p => cr(svg, p[0], p[1], sel ? 36 : 24, sel ? '#fe0000' : '#333'))

    const mid = [
      (el.points[0][0] + el.points[1][0]) / 2,
      (el.points[0][1] + el.points[1][1]) / 2 - 100,
    ]
    tx(svg, mid[0], mid[1], `${el.id}  ${el.properties?.length ?? 0}mm`, {
      sz: '160', fill: sel ? '#fe0000' : '#555', anchor: 'middle', bold: true,
    })
  })

  // Preview while drawing
  if (currentPoints.length > 0) {
    const last = currentPoints[currentPoints.length - 1]

    // Placed segments
    currentPoints.forEach((p, i) => {
      if (i > 0) ln(svg, currentPoints[i-1][0], currentPoints[i-1][1], p[0], p[1], '#fe0000', '14')
      cr(svg, p[0], p[1], 42, '#fe0000')
    })

    // Ghost line to snap cursor
    const d = dist(last, snapPos)
    const ghost = ln(svg, last[0], last[1], snapPos[0], snapPos[1], '#fe0000', '8')
    ghost.setAttribute('stroke-dasharray', '200 100')
    ghost.setAttribute('opacity', '0.6')
    ghost.setAttribute('pointer-events', 'none')

    // Distance label
    if (d > 0) {
      const mx = (last[0] + snapPos[0]) / 2
      const my = (last[1] + snapPos[1]) / 2
      const pill = svg_('rect')
      pill.setAttribute('x', mx - 380); pill.setAttribute('y', my - 290)
      pill.setAttribute('width', '760'); pill.setAttribute('height', '260')
      pill.setAttribute('fill', 'white'); pill.setAttribute('opacity', '0.8')
      pill.setAttribute('rx', '50'); pill.setAttribute('pointer-events', 'none')
      svg.appendChild(pill)
      tx(svg, mx, my - 80, `${d} mm`, {
        sz: '230', fill: '#fe0000', anchor: 'middle', bold: true,
      })
    }
  }

  // Snap cursor (when drawing tool is active)
  if (activeTool && ['line', 'polyline'].includes(activeTool)) {
    const [sx, sy] = snapPos
    const arm = 260
    const h = ln(svg, sx - arm, sy, sx + arm, sy, '#2266ff', '3')
    const v = ln(svg, sx, sy - arm, sx, sy + arm, '#2266ff', '3')
    h.setAttribute('pointer-events', 'none')
    v.setAttribute('pointer-events', 'none')
    cr(svg, sx, sy, 80, 'rgba(34,102,255,0.45)')
  }

  // Click-to-select (only when not mid-draw — during draw, clicks add points)
  if (currentPoints.length === 0) {
    svg.querySelectorAll('[data-id]').forEach(el =>
      el.addEventListener('click', e => {
        e.stopPropagation()
        useDrawingStore.getState().selectElement(el.getAttribute('data-id'))
      })
    )
  }
}

// ─── SVG primitives ──────────────────────────────────────────────────────────

function svg_(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag)
}
function bg(svg, w, h, fill) {
  const el = svg_('rect')
  el.setAttribute('width', w); el.setAttribute('height', h); el.setAttribute('fill', fill)
  svg.appendChild(el); return el
}
function ln(svg, x1, y1, x2, y2, stroke, sw = '1') {
  const el = svg_('line')
  el.setAttribute('x1', x1); el.setAttribute('y1', y1)
  el.setAttribute('x2', x2); el.setAttribute('y2', y2)
  el.setAttribute('stroke', stroke); el.setAttribute('stroke-width', sw)
  svg.appendChild(el); return el
}
function cr(svg, cx, cy, r, fill) {
  const el = svg_('circle')
  el.setAttribute('cx', cx); el.setAttribute('cy', cy)
  el.setAttribute('r', r); el.setAttribute('fill', fill)
  el.setAttribute('pointer-events', 'none')
  svg.appendChild(el); return el
}
function rct(svg, x, y, w, h, opts = {}) {
  const el = svg_('rect')
  el.setAttribute('x', x); el.setAttribute('y', y)
  el.setAttribute('width', w); el.setAttribute('height', h)
  if (opts.fill)   el.setAttribute('fill', opts.fill)
  if (opts.stroke) el.setAttribute('stroke', opts.stroke)
  if (opts.sw)     el.setAttribute('stroke-width', opts.sw)
  if (opts.id)     el.setAttribute('data-id', opts.id)
  el.setAttribute('cursor', 'pointer')
  svg.appendChild(el); return el
}
function pl(svg, points, opts = {}) {
  const el = svg_('polyline')
  el.setAttribute('points', points.map(p => `${p[0]},${p[1]}`).join(' '))
  el.setAttribute('fill', 'none')
  if (opts.stroke) el.setAttribute('stroke', opts.stroke)
  if (opts.sw)     el.setAttribute('stroke-width', opts.sw)
  if (opts.id)     el.setAttribute('data-id', opts.id)
  el.setAttribute('cursor', 'pointer')
  svg.appendChild(el); return el
}
function tx(svg, x, y, content, opts = {}) {
  const el = svg_('text')
  el.setAttribute('x', x); el.setAttribute('y', y)
  el.setAttribute('font-size', opts.sz || '150')
  el.setAttribute('fill', opts.fill || '#333')
  el.setAttribute('pointer-events', 'none')
  if (opts.anchor) el.setAttribute('text-anchor', opts.anchor)
  if (opts.bold) el.setAttribute('font-weight', 'bold')
  el.textContent = content
  svg.appendChild(el); return el
}
