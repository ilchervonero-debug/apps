import { useRef, useEffect, useState } from 'react'
import { useDrawingStore, panelPolygon, panelMaxHeight, MAJOR, snapPoint, nearestVertex, VERT_RADIUS } from '../store/drawingStore'
import '../styles/DrawingCanvas.css'

const SVG = 'http://www.w3.org/2000/svg'

// ── Transformaciones de coordenadas ────────────────────────
// PLANTA: mm → viewBox (ancho 1000, alto según pantalla), Y hacia arriba.
// PLAN.h y PLAN.oy se actualizan según el tamaño real del canvas (sin bandas blancas).
const PLAN = { ox: 60, oy: 350, s: 0.05, h: 400 }
const ELEV = { h: 500 } // alto del viewBox del alzado (responsivo)
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
  const dragRef = useRef({ active: false, moved: false })
  const lpRef = useRef({ timer: null, fired: false, startVb: null, client: [0, 0] })
  const movingRef = useRef(null) // { id, origA, origB, startMm } durante el arrastre de mover
  const pointersRef = useRef(new Map()) // pointerId → [vbX, vbY]
  const gestureRef = useRef({ active: false, dist0: 0, mid0: [0, 0], view0: null })
  const elevDragRef = useRef(null) // { index } arrastrando un vértice del contorno en alzado
  const elevPointersRef = useRef(new Map())
  const elevGestureRef = useRef({ active: false, dist0: 0, mid0: [0, 0], view0: null })
  const elevPanRef = useRef(null) // { startVb, view0 } paneo con un dedo en alzado
  const viewRef = useRef({ z: 1, tx: 0, ty: 0 }) // transform de vista (en unidades viewBox)
  const [view, setViewState] = useState({ z: 1, tx: 0, ty: 0 })
  const setView = (v) => { viewRef.current = v; setViewState(v) }
  const elevViewRef = useRef({ z: 1, tx: 0, ty: 0 })
  const [elevView, setElevViewState] = useState({ z: 1, tx: 0, ty: 0 })
  const setElevView = (v) => { elevViewRef.current = v; setElevViewState(v) }
  const [cursor, setCursor] = useState(null)
  const [menu, setMenu] = useState(null) // { id, x, y } menú contextual (coords de pantalla)
  const [moving, setMoving] = useState(null) // id del panel en modo mover
  const [planH, setPlanH] = useState(400) // alto del viewBox del plano (según pantalla)
  const [elevH, setElevH] = useState(500) // alto del viewBox del alzado

  const panels = useDrawingStore((s) => s.panels)
  const tab = useDrawingStore((s) => s.tab)
  const selectedId = useDrawingStore((s) => s.selectedId)
  const selectedVertex = useDrawingStore((s) => s.selectedVertex)
  const activeTool = useDrawingStore((s) => s.activeTool)
  const draft = useDrawingStore((s) => s.draft)
  const gridMm = useDrawingStore((s) => s.gridMm)
  const setGrid = useDrawingStore((s) => s.setGrid)
  const canUndo = useDrawingStore((s) => s.past.length > 0)
  const canRedo = useDrawingStore((s) => s.future.length > 0)

  // viewBox responsivo (sin bandas blancas) para cada lienzo
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const mk = (svg, set, target) => {
      if (!svg) return null
      const ro = new ResizeObserver(() => {
        const r = svg.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) {
          const h = Math.round(1000 * (r.height / r.width))
          if (target === 'plan') { PLAN.h = h; PLAN.oy = h - 50 } else { ELEV.h = h }
          set(h)
        }
      })
      ro.observe(svg)
      return ro
    }
    const r1 = mk(planRef.current, setPlanH, 'plan')
    const r2 = mk(elevRef.current, setElevH, 'elev')
    return () => { r1 && r1.disconnect(); r2 && r2.disconnect() }
  }, [])

  // atajos de teclado: Ctrl/Cmd+Z deshacer, Ctrl+Shift+Z o Ctrl+Y rehacer
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? useDrawingStore.getState().redo() : useDrawingStore.getState().undo() }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); useDrawingStore.getState().redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Render reactivo ──
  useEffect(() => {
    drawPlan(planRef.current, panels, selectedId, draft, cursor, activeTool, gridMm, view)
    drawElevation(elevRef.current, panels, selectedId, selectedVertex, gridMm, elevView)
  }, [panels, selectedId, selectedVertex, draft, cursor, activeTool, gridMm, view, planH, elevH, tab, elevView])

  // al cambiar de panel, reinicia la vista del alzado (encaja la cara)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setElevView({ z: 1, tx: 0, ty: 0 })
  }, [selectedId])

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
  // viewBox → mundo (coords base) quitando la transform de vista
  const worldFromVb = (vb) => {
    const { z, tx, ty } = viewRef.current
    return [(vb[0] - tx) / z, (vb[1] - ty) / z]
  }
  const startGesture = () => {
    const pts = [...pointersRef.current.values()]
    gestureRef.current = {
      active: true,
      dist0: Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]) || 1,
      mid0: [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2],
      view0: { ...viewRef.current },
    }
    // cancelar dibujo/long-press en curso
    clearLongPress()
    if (dragRef.current.active) { useDrawingStore.getState().cancelWall(); dragRef.current.active = false }
    movingRef.current = null
  }

  // ── PLANTA: dibujar / seleccionar / mover / menú / gestos ──
  const planDown = (e) => {
    const svg = planRef.current
    const vb = getVb(e, svg)
    pointersRef.current.set(e.pointerId, vb)
    setMenu(null)

    if (pointersRef.current.size >= 2) { startGesture(); return }

    const mm = vbToPlan(worldFromVb(vb))
    const st = useDrawingStore.getState()
    const cx = e.touches?.[0]?.clientX ?? e.clientX
    const cy = e.touches?.[0]?.clientY ?? e.clientY

    // modo mover: arrastrar el panel seleccionado
    if (moving) {
      const p = st.panels.find((x) => x.id === moving)
      if (p) { st.pushHistory('move'); movingRef.current = { id: moving, origA: p.a, origB: p.b, startMm: mm }; setCursor({ view: 'plan', vb }); return }
    }

    try { svg.setPointerCapture?.(e.pointerId) } catch { /* no-op */ }
    lpRef.current = { timer: null, fired: false, startVb: vb, client: [cx, cy] }
    lpRef.current.timer = setTimeout(() => {
      lpRef.current.fired = true
      if (dragRef.current.active) { useDrawingStore.getState().cancelWall(); dragRef.current.active = false }
      const hit = pickPanel(mm, useDrawingStore.getState().panels)
      if (hit) { useDrawingStore.getState().select(hit); setMenu({ id: hit, x: lpRef.current.client[0], y: lpRef.current.client[1], t: Date.now() }) }
    }, 480)

    if (activeTool === 'wall') {
      dragRef.current = { active: true, moved: false }
      st.startWall(mm)
    }
    setCursor({ view: 'plan', vb })
  }

  const planMove = (e) => {
    const svg = planRef.current
    const vb = getVb(e, svg)
    if (pointersRef.current.has(e.pointerId)) pointersRef.current.set(e.pointerId, vb)

    // gesto de 2 dedos: zoom + pan
    if (gestureRef.current.active && pointersRef.current.size >= 2) {
      const pts = [...pointersRef.current.values()]
      const distNow = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]) || 1
      const midNow = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2]
      const { dist0, mid0, view0 } = gestureRef.current
      const z = Math.max(0.25, Math.min(8, view0.z * (distNow / dist0)))
      // punto del mundo que estaba bajo el centro inicial
      const wx = (mid0[0] - view0.tx) / view0.z
      const wy = (mid0[1] - view0.ty) / view0.z
      setView({ z, tx: midNow[0] - wx * z, ty: midNow[1] - wy * z })
      return
    }

    setCursor({ view: 'plan', vb })

    if (movingRef.current) {
      const mm = vbToPlan(worldFromVb(vb))
      const g = useDrawingStore.getState().gridMm
      const { id, origA, origB, startMm } = movingRef.current
      const dx = Math.round((mm[0] - startMm[0]) / g) * g
      const dy = Math.round((mm[1] - startMm[1]) / g) * g
      useDrawingStore.getState().movePanelTo(id, [origA[0] + dx, origA[1] + dy], [origB[0] + dx, origB[1] + dy])
      return
    }

    if (lpRef.current.startVb) {
      const d = Math.hypot(vb[0] - lpRef.current.startVb[0], vb[1] - lpRef.current.startVb[1])
      if (d > 6) clearLongPress()
    }
    if (dragRef.current.active) {
      useDrawingStore.getState().dragWall(vbToPlan(worldFromVb(vb)))
      dragRef.current.moved = true
    }
  }

  const planUp = (e) => {
    pointersRef.current.delete(e.pointerId)
    clearLongPress()

    // saliendo de un gesto
    if (gestureRef.current.active) {
      if (pointersRef.current.size < 2) gestureRef.current.active = false
      return
    }

    if (movingRef.current) { movingRef.current = null; setMoving(null); return }
    if (dragRef.current.active) {
      useDrawingStore.getState().finishWall()
      dragRef.current.active = false
    }
    // tap corto = solo seleccionar (el menú mover/borrar sale con long-press)
    if (!lpRef.current.fired && !dragRef.current.moved) {
      const mm = vbToPlan(worldFromVb(getVb(e, planRef.current)))
      const st = useDrawingStore.getState()
      const hit = pickPanel(mm, st.panels)
      if (['door', 'window', 'opening'].includes(activeTool)) {
        if (hit) { st.select(hit); st.addOpening(hit, activeTool); st.setTab('elev') }
      } else if (activeTool === 'select' || activeTool === 'wall') {
        if (hit) st.select(hit)
        else if (activeTool === 'select') st.deselect()
      }
    }
  }

  const planCancel = (e) => {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) gestureRef.current.active = false
  }

  // rueda del mouse: zoom alrededor del cursor (desktop)
  const planWheel = (e) => {
    e.preventDefault()
    const vb = getVb(e, planRef.current)
    const v0 = viewRef.current
    const z = Math.max(0.25, Math.min(8, v0.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12)))
    const wx = (vb[0] - v0.tx) / v0.z
    const wy = (vb[1] - v0.ty) / v0.z
    setView({ z, tx: vb[0] - wx * z, ty: vb[1] - wy * z })
  }

  const resetView = () => setView({ z: 1, tx: 0, ty: 0 })

  // acciones del menú contextual
  const doMove = () => { if (menu) { setMoving(menu.id); setMenu(null) } }
  const doCopy = () => { if (menu) { useDrawingStore.getState().duplicatePanel(menu.id); setMenu(null) } }
  const doDelete = () => { if (menu) { useDrawingStore.getState().remove(menu.id); setMenu(null) } }

  // ── ALZADO: seleccionar vértice del panel activo ──
  // viewBox del alzado → coords base (quita la vista) → local mm
  const elevLocal = (vb, panel) => {
    const v = elevViewRef.current
    const base = [(vb[0] - v.tx) / v.z, (vb[1] - v.ty) / v.z]
    return elevTransform(panel).fromVb(base)
  }

  const elevDown = (e) => {
    const st = useDrawingStore.getState()
    const panel = st.panels.find((p) => p.id === st.selectedId)
    if (!panel) return
    const vb = getVb(e, elevRef.current)
    elevPointersRef.current.set(e.pointerId, vb)
    if (elevPointersRef.current.size >= 2) {
      const pts = [...elevPointersRef.current.values()]
      elevGestureRef.current = {
        active: true,
        dist0: Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]) || 1,
        mid0: [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2],
        view0: { ...elevViewRef.current },
      }
      elevDragRef.current = null
      elevPanRef.current = null
      return
    }
    try { elevRef.current.setPointerCapture?.(e.pointerId) } catch { /* no-op */ }
    // herramienta de abertura → coloca en la X tocada (sobre la cara)
    if (['door', 'window', 'opening'].includes(st.activeTool)) {
      const [lx] = elevLocal(vb, panel)
      st.addOpening(panel.id, st.activeTool, Math.round(lx))
      return
    }
    // ¿tocó un vértice? (en coords de pantalla, considerando la vista)
    const tf = elevTransform(panel)
    let best = null, bestD = 26
    panel.topPath.forEach((pt, i) => {
      const base = tf.toVb(pt)
      const v = [base[0] * elevViewRef.current.z + elevViewRef.current.tx, base[1] * elevViewRef.current.z + elevViewRef.current.ty]
      const d = Math.hypot(v[0] - vb[0], v[1] - vb[1])
      if (d < bestD) { bestD = d; best = i }
    })
    if (best != null) { st.selectVertex(best); elevDragRef.current = { index: best } }
    else { elevPanRef.current = { startVb: vb, view0: { ...elevViewRef.current } } }
  }

  const elevMove = (e) => {
    const vb = getVb(e, elevRef.current)
    if (elevPointersRef.current.has(e.pointerId)) elevPointersRef.current.set(e.pointerId, vb)

    if (elevGestureRef.current.active && elevPointersRef.current.size >= 2) {
      const pts = [...elevPointersRef.current.values()]
      const distNow = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]) || 1
      const midNow = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2]
      const { dist0, mid0, view0 } = elevGestureRef.current
      const z = Math.max(0.25, Math.min(8, view0.z * (distNow / dist0)))
      const wx = (mid0[0] - view0.tx) / view0.z
      const wy = (mid0[1] - view0.ty) / view0.z
      setElevView({ z, tx: midNow[0] - wx * z, ty: midNow[1] - wy * z })
      return
    }
    if (elevPanRef.current) {
      const { startVb, view0 } = elevPanRef.current
      setElevView({ z: view0.z, tx: view0.tx + (vb[0] - startVb[0]), ty: view0.ty + (vb[1] - startVb[1]) })
      return
    }
    if (!elevDragRef.current) return
    const st = useDrawingStore.getState()
    const panel = st.panels.find((p) => p.id === st.selectedId)
    if (!panel) return
    const [lx, ly] = elevLocal(vb, panel)
    const g = st.gridMm
    const sx = Math.round(lx / g) * g
    const sy = Math.max(0, Math.round(ly / g) * g)
    const i = elevDragRef.current.index
    if (i === 0) st.setHeightA(panel.id, sy)
    else if (i === panel.topPath.length - 1) st.setHeightB(panel.id, sy)
    else st.updateContourPoint(panel.id, i, Math.max(0, Math.min(panel.width, sx)), sy)
  }

  const elevUp = (e) => {
    elevPointersRef.current.delete(e.pointerId)
    if (elevPointersRef.current.size < 2) elevGestureRef.current.active = false
    elevDragRef.current = null
    elevPanRef.current = null
  }

  const elevWheel = (e) => {
    e.preventDefault()
    const vb = getVb(e, elevRef.current)
    const v0 = elevViewRef.current
    const z = Math.max(0.25, Math.min(8, v0.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12)))
    const wx = (vb[0] - v0.tx) / v0.z
    const wy = (vb[1] - v0.ty) / v0.z
    setElevView({ z, tx: vb[0] - wx * z, ty: vb[1] - wy * z })
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
          <div onClick={() => { if (Date.now() - (menu.t || 0) > 350) setMenu(null) }}
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

      {/* Barra de acciones de la pestaña */}
      <div className="canvas-toolbar">
        <span className="ct-hint">
          {(() => {
            const open = { door: 'puerta', window: 'ventana', opening: 'abertura' }
            const soon = { roof: 'Techo', ceiling: 'Cielorraso', slab: 'Losa de piso', tconnect: 'T-connect', pilar: 'Pilar', cercha: 'Cercha' }
            if (tab === 'plan') {
              if (moving) return 'Arrastrá el muro a su lugar'
              if (activeTool === 'wall') return 'Arrastrá para dibujar · mantené presionado para editar'
              if (open[activeTool]) return `Tocá un muro para agregarle ${open[activeTool]}`
              if (soon[activeTool]) return `${soon[activeTool]}: reglas próximamente`
              return 'Tocá un muro para editar'
            }
            if (!selectedId) return 'Seleccioná un muro en la pestaña Planta'
            if (open[activeTool]) return `Tocá la cara para ubicar ${open[activeTool]}`
            return `Cara de ${selectedId} · arrastrá vértices · base bloqueada`
          })()}
        </span>
        <span className="ct-actions">
          <button onClick={() => useDrawingStore.getState().undo()} disabled={!canUndo} title="Deshacer" className="ct-btn">↶</button>
          <button onClick={() => useDrawingStore.getState().redo()} disabled={!canRedo} title="Rehacer" className="ct-btn">↷</button>
          {tab === 'plan' && <>
            <span className="ct-sep" />
            <span className="ct-lbl">Grilla</span>
            {[400, 600].map((g) => (
              <button key={g} onClick={() => setGrid(g)} className={`ct-btn ${gridMm === g ? 'on' : ''}`}>{g === 400 ? '40' : '60'}</button>
            ))}
            <span className="ct-lbl">cm</span>
            <button onClick={resetView} title="Reiniciar vista" className="ct-btn">⌖</button>
          </>}
        </span>
      </div>

      {/* PLANTA */}
      <div className="canvas-section" style={{ flex: 1, minHeight: 0, display: tab === 'plan' ? 'flex' : 'none' }}>
        <svg
          ref={planRef}
          className="canvas-svg"
          viewBox={`0 0 1000 ${planH}`}
          preserveAspectRatio="none"
          style={{ touchAction: 'none' }}
          onPointerDown={planDown}
          onPointerMove={planMove}
          onPointerUp={planUp}
          onPointerCancel={planCancel}
          onWheel={planWheel}
        />
      </div>

      {/* ALZADO */}
      <div className="canvas-section" style={{ flex: 1, minHeight: 0, display: tab === 'elev' ? 'flex' : 'none' }}>
        <svg
          ref={elevRef}
          className="canvas-svg"
          viewBox={`0 0 1000 ${elevH}`}
          preserveAspectRatio="none"
          style={{ touchAction: 'none' }}
          onPointerDown={elevDown}
          onPointerMove={elevMove}
          onPointerUp={elevUp}
          onPointerCancel={elevUp}
          onWheel={elevWheel}
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
// Alzado con 0,0 LOCAL = esquina inferior izquierda de la base.
function elevTransform(panel) {
  const maxH = panelMaxHeight(panel)
  const w = panel.width || 1000
  const marginX = 64, marginTop = 56, marginBot = 64
  const s = Math.min((1000 - marginX * 2) / w, (ELEV.h - marginTop - marginBot) / maxH)
  const ox = marginX // x=0 (lado A) a la izquierda
  const oy = ELEV.h - marginBot // y=0 (base) abajo
  // flip = ver desde el otro lado: espeja en X (el ancho real no cambia)
  return {
    s, ox, oy,
    toVb: ([x, y]) => [ox + (panel.flip ? (w - x) : x) * s, oy - y * s],
    fromVb: ([vx, vy]) => [panel.flip ? (w - (vx - ox) / s) : (vx - ox) / s, (oy - vy) / s],
  }
}

// ── Dibujo PLANTA ──────────────────────────────────────────
function drawPlan(svg, panels, selectedId, draft, cursor, activeTool, gridMm, view) {
  if (!svg) return
  svg.innerHTML = ''
  svg.appendChild(el('rect', { width: 1000, height: PLAN.h, fill: 'white' }))

  // grupo con la transform de vista (zoom/pan)
  const g = el('g', { transform: `translate(${view.tx} ${view.ty}) scale(${view.z})` })
  svg.appendChild(g)
  svg = g // a partir de acá todo se dibuja dentro del grupo transformado
  const k = 1 / view.z // factor para tamaños constantes en pantalla

  drawPlanGrid(svg, gridMm, view)

  // muros
  panels.forEach((p) => {
    const a = planToVb(p.a), b = planToVb(p.b)
    const sel = p.id === selectedId
    svg.appendChild(el('line', {
      x1: a[0], y1: a[1], x2: b[0], y2: b[1],
      stroke: sel ? '#fe0000' : '#333', 'stroke-width': (sel ? 4 : 2.5) * k, 'stroke-linecap': 'round',
    }))
    ;[a, b].forEach((pt) => svg.appendChild(el('circle', { cx: pt[0], cy: pt[1], r: (sel ? 4 : 3) * k, fill: sel ? '#fe0000' : '#666' })))
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const code = el('text', { x: mid[0], y: mid[1] - 10 * k, 'font-size': 15 * k, 'font-weight': 'bold', fill: sel ? '#fe0000' : '#333', 'text-anchor': 'middle' })
    code.textContent = p.id
    svg.appendChild(code)
    const len = el('text', { x: mid[0], y: mid[1] + 16 * k, 'font-size': 11 * k, fill: '#888', 'text-anchor': 'middle' })
    len.textContent = `${(p.width / 1000).toFixed(2)} m`
    svg.appendChild(len)

    // flecha de lado exterior (solo en el panel seleccionado)
    if (sel) {
      const dx = b[0] - a[0], dy = b[1] - a[1]
      const L = Math.hypot(dx, dy) || 1
      const ux = dx / L, uy = dy / L // dirección del muro
      const nx = (p.flip ? uy : -uy), ny = (p.flip ? -ux : ux) // normal hacia el exterior
      const len2 = 26 * k
      const tip = [mid[0] + nx * len2, mid[1] + ny * len2]
      svg.appendChild(el('line', { x1: mid[0], y1: mid[1], x2: tip[0], y2: tip[1], stroke: '#0a84ff', 'stroke-width': 2 * k }))
      // punta de flecha
      const hb = 8 * k, hw = 4 * k
      const p1 = [tip[0] - nx * hb + ux * hw, tip[1] - ny * hb + uy * hw]
      const p2 = [tip[0] - nx * hb - ux * hw, tip[1] - ny * hb - uy * hw]
      svg.appendChild(el('polygon', { points: `${tip[0]},${tip[1]} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`, fill: '#0a84ff' }))
      const et = el('text', { x: tip[0] + nx * 8 * k, y: tip[1] + ny * 8 * k + 3 * k, 'font-size': 9 * k, 'font-weight': 'bold', fill: '#0a84ff', 'text-anchor': 'middle' })
      et.textContent = 'ext'
      svg.appendChild(et)
    }
  })

  // trazo en curso
  if (draft) {
    const a = planToVb(draft.a), b = planToVb(draft.b)
    svg.appendChild(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#fe0000', 'stroke-width': 2 * k, 'stroke-dasharray': `${5 * k} ${4 * k}` }))
    // marca del inicio (sobre la intersección de grilla)
    svg.appendChild(el('circle', { cx: a[0], cy: a[1], r: 4 * k, fill: '#fe0000' }))
    const w = Math.round(Math.hypot(draft.b[0] - draft.a[0], draft.b[1] - draft.a[1]))
    if (w > 0) {
      const t = el('text', { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 - 8 * k, 'font-size': 13 * k, 'font-weight': 'bold', fill: '#fe0000', 'text-anchor': 'middle' })
      t.textContent = `${w} mm`
      svg.appendChild(t)
    }
  }

  // indicador de snap: verde si engancha a un vértice, rojo si a la grilla
  if (cursor?.view === 'plan' && activeTool === 'wall') {
    const mm = vbToPlan(worldFromVbView(cursor.vb, view))
    const sp = snapPoint(mm, gridMm, panels)
    const onVertex = nearestVertex(mm, panels, gridMm * VERT_RADIUS) != null
    const v = planToVb(sp)
    if (onVertex) {
      svg.appendChild(el('circle', { cx: v[0], cy: v[1], r: 7 * k, fill: 'none', stroke: '#16a34a', 'stroke-width': 2 * k }))
      svg.appendChild(el('circle', { cx: v[0], cy: v[1], r: 2.5 * k, fill: '#16a34a' }))
    } else {
      svg.appendChild(el('circle', { cx: v[0], cy: v[1], r: 5 * k, fill: 'none', stroke: '#fe0000', 'stroke-width': 1.5 * k }))
    }
  }
}

function worldFromVbView(vb, view) {
  return [(vb[0] - view.tx) / view.z, (vb[1] - view.ty) / view.z]
}

function drawPlanGrid(svg, gridMm, view) {
  const g = el('g', {})
  // rango visible en coords base (viewBox) según zoom/pan
  const x0 = (0 - view.tx) / view.z
  const x1 = (1000 - view.tx) / view.z
  const y0 = (0 - view.ty) / view.z
  const y1 = (PLAN.h - view.ty) / view.z
  // convertir a mm y alinear a la grilla
  const mmX0 = Math.floor(vbToPlan([Math.min(x0, x1), 0])[0] / gridMm) * gridMm
  const mmX1 = Math.ceil(vbToPlan([Math.max(x0, x1), 0])[0] / gridMm) * gridMm
  const mmYtop = vbToPlan([0, Math.min(y0, y1)])[1] // mayor (arriba)
  const mmYbot = vbToPlan([0, Math.max(y0, y1)])[1] // menor (abajo)
  const mmY0 = Math.floor(mmYbot / gridMm) * gridMm
  const mmY1 = Math.ceil(mmYtop / gridMm) * gridMm
  const lw = (major) => (major ? 1 : 0.5) / view.z // grosor constante en pantalla
  for (let mm = mmX0; mm <= mmX1; mm += gridMm) {
    const v = planToVb([mm, 0])[0]
    const major = Math.round(mm) % MAJOR === 0
    g.appendChild(el('line', { x1: v, y1: planToVb([0, mmY1])[1], x2: v, y2: planToVb([0, mmY0])[1], stroke: major ? '#cfcfcf' : '#eee', 'stroke-width': lw(major) }))
  }
  for (let mm = mmY0; mm <= mmY1; mm += gridMm) {
    const v = planToVb([0, mm])[1]
    const major = Math.round(mm) % MAJOR === 0
    g.appendChild(el('line', { x1: planToVb([mmX0, 0])[0], y1: v, x2: planToVb([mmX1, 0])[0], y2: v, stroke: major ? '#cfcfcf' : '#eee', 'stroke-width': lw(major) }))
  }
  svg.appendChild(g)
}

// ── Dibujo ALZADO (0,0 local en la base izquierda) ─────────
function drawElevation(svg, panels, selectedId, selectedVertex, gridMm, elevView) {
  if (!svg) return
  svg.innerHTML = ''
  svg.appendChild(el('rect', { width: 1000, height: ELEV.h, fill: 'white' }))

  const panel = panels.find((p) => p.id === selectedId)
  if (!panel) {
    const t = el('text', { x: 500, y: ELEV.h / 2, 'font-size': 18, fill: '#bbb', 'text-anchor': 'middle' })
    t.textContent = 'Seleccioná un muro en la pestaña Planta'
    svg.appendChild(t)
    return
  }

  const ev = elevView || { z: 1, tx: 0, ty: 0 }
  const vg = el('g', { transform: `translate(${ev.tx} ${ev.ty}) scale(${ev.z})` })
  svg.appendChild(vg)
  svg = vg // todo el alzado se dibuja dentro del grupo con zoom/pan

  const tf = elevTransform(panel)
  const maxH = panelMaxHeight(panel)

  // grilla (cada gridMm, mayor cada 1.20m)
  const g = el('g', {})
  for (let x = 0; x <= panel.width + 1; x += gridMm) {
    const a = tf.toVb([Math.min(x, panel.width), 0]), b = tf.toVb([Math.min(x, panel.width), maxH])
    g.appendChild(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: x % MAJOR === 0 ? '#d8d8d8' : '#efefef', 'stroke-width': x % MAJOR === 0 ? 0.9 : 0.5 }))
  }
  for (let y = 0; y <= maxH + 1; y += gridMm) {
    const a = tf.toVb([0, Math.min(y, maxH)]), b = tf.toVb([panel.width, Math.min(y, maxH)])
    g.appendChild(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: y % MAJOR === 0 ? '#d8d8d8' : '#efefef', 'stroke-width': y % MAJOR === 0 ? 0.9 : 0.5 }))
  }
  svg.appendChild(g)

  // ejes 0,0 local (origen abajo-izquierda)
  const o = tf.toVb([0, 0])
  const xEnd = tf.toVb([panel.width, 0]), yEnd = tf.toVb([0, maxH])
  svg.appendChild(el('line', { x1: o[0], y1: o[1], x2: xEnd[0], y2: o[1], stroke: '#0a84ff', 'stroke-width': 1, opacity: 0.5 }))
  svg.appendChild(el('line', { x1: o[0], y1: o[1], x2: o[0], y2: yEnd[1], stroke: '#0a84ff', 'stroke-width': 1, opacity: 0.5 }))
  const ot = el('text', { x: o[0] - 6, y: o[1] + 16, 'font-size': 11, 'font-weight': 'bold', fill: '#0a84ff', 'text-anchor': 'end' })
  ot.textContent = '0,0'
  svg.appendChild(ot)

  // polígono de la cara
  const poly = panelPolygon(panel).map(tf.toVb)
  svg.appendChild(el('polygon', { points: poly.map((v) => `${v[0]},${v[1]}`).join(' '), fill: 'rgba(254,0,0,0.07)', stroke: '#fe0000', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }))

  // base bloqueada (ancho de planta)
  const baseA = tf.toVb([0, 0]), baseB = tf.toVb([panel.width, 0])
  svg.appendChild(el('line', { x1: baseA[0], y1: baseA[1], x2: baseB[0], y2: baseB[1], stroke: '#555', 'stroke-width': 5, 'stroke-linecap': 'round' }))
  const wt = el('text', { x: (baseA[0] + baseB[0]) / 2, y: baseA[1] + 24, 'font-size': 13, 'font-weight': 'bold', fill: '#555', 'text-anchor': 'middle' })
  wt.textContent = `base ${(panel.width / 1000).toFixed(2)} m · bloqueada (planta)`
  svg.appendChild(wt)

  const vn = el('text', { x: 500, y: 26, 'font-size': 13, 'font-weight': 'bold', fill: '#999', 'text-anchor': 'middle' })
  vn.textContent = `${panel.id} · vista exterior${panel.flip ? ' (volteada)' : ''}`
  svg.appendChild(vn)

  // aberturas (puertas / ventanas)
  ;(panel.openings || []).forEach((op) => {
    const x0 = op.offset, x1 = op.offset + op.width, y0 = op.sill, y1 = op.sill + op.height
    const c = [tf.toVb([x0, y0]), tf.toVb([x1, y0]), tf.toVb([x1, y1]), tf.toVb([x0, y1])]
    svg.appendChild(el('polygon', { points: c.map((v) => `${v[0]},${v[1]}`).join(' '), fill: '#fff', stroke: '#0a84ff', 'stroke-width': 2 }))
    const cx = (c[0][0] + c[2][0]) / 2, cy = (c[0][1] + c[2][1]) / 2
    const t1 = el('text', { x: cx, y: cy, 'font-size': 16, 'font-weight': 'bold', fill: '#0a84ff', 'text-anchor': 'middle' })
    t1.textContent = op.kind === 'door' ? 'P' : op.kind === 'window' ? 'V' : 'A'
    svg.appendChild(t1)
    const t2 = el('text', { x: cx, y: cy + 16, 'font-size': 10, fill: '#0a84ff', 'text-anchor': 'middle' })
    t2.textContent = `${(op.width / 1000).toFixed(2)}×${(op.height / 1000).toFixed(2)}`
    svg.appendChild(t2)
  })

  // vértices del contorno con coordenadas locales (X desde A, Y altura)
  panel.topPath.forEach((pt, i) => {
    const v = tf.toVb(pt)
    const isEnd = i === 0 || i === panel.topPath.length - 1
    const selV = i === selectedVertex
    svg.appendChild(el('circle', { cx: v[0], cy: v[1], r: selV ? 9 : 6, fill: selV ? '#fe0000' : '#fff', stroke: '#fe0000', 'stroke-width': 2.5 }))
    const lbl = el('text', { x: v[0], y: v[1] - 14, 'font-size': 12, 'font-weight': 'bold', fill: '#fe0000', 'text-anchor': 'middle' })
    lbl.textContent = isEnd
      ? `${i === 0 ? 'A' : 'B'} ${(pt[1] / 1000).toFixed(2)}m`
      : `${(pt[0] / 1000).toFixed(2)} ; ${(pt[1] / 1000).toFixed(2)}`
    svg.appendChild(lbl)
  })
}
