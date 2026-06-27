import { useRef, useEffect, useState } from 'react'
import { useDrawingStore } from '../store/drawingStore'
import '../styles/DrawingCanvas.css'

const SCALE = 0.5 // 1 mm en canvas = 0.5 píxeles
const GRID_SIZE = 100
const snapToGrid = (v) => Math.round(v / GRID_SIZE) * GRID_SIZE

export default function DrawingCanvas() {
  const elevationRef = useRef(null)
  const planRef = useRef(null)
  const dividerRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mousePos, setMousePos] = useState([0, 0])

  const elements = useDrawingStore((state) => state.elements)
  const selectedId = useDrawingStore((state) => state.selectedId)
  const elevationHeight = useDrawingStore((state) => state.elevationHeight)
  const setElevationHeight = useDrawingStore((state) => state.setElevationHeight)
  const activeTool = useDrawingStore((state) => state.activeTool)
  const currentPoints = useDrawingStore((state) => state.currentPoints)
  const addPoint = useDrawingStore((state) => state.addPoint)
  const finishDrawing = useDrawingStore((state) => state.finishDrawing)
  const cancelDrawing = useDrawingStore((state) => state.cancelDrawing)
  const [drawingView, setDrawingView] = useState(null)

  useEffect(() => {
    drawView(elevationRef.current, 'elevation', elements, selectedId, currentPoints, mousePos, activeTool)
    drawView(planRef.current, 'plan', elements, selectedId, currentPoints, mousePos, activeTool)
  }, [elements, selectedId, currentPoints, mousePos, activeTool])

  const getClientY = (e) => e.touches ? e.touches[0].clientY : e.clientY

  const handleDividerStart = (e) => {
    setIsDragging(true)
    e.preventDefault()
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e) => {
      const container = dividerRef.current.parentElement
      const rect = container.getBoundingClientRect()
      const clientY = getClientY(e)
      const newHeight = Math.min(80, Math.max(20, ((clientY - rect.top) / rect.height) * 100))
      setElevationHeight(newHeight)
    }
    const handleUp = () => setIsDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [isDragging])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        const state = useDrawingStore.getState()
        if (state.currentPoints.length >= 2) {
          state.finishDrawing(drawingView || 'plan')
        } else {
          state.cancelDrawing()
        }
        setDrawingView(null)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const state = useDrawingStore.getState()
        if (state.currentPoints.length >= 2) {
          state.finishDrawing(drawingView || 'plan')
          setDrawingView(null)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [drawingView])

  const getSvgCoords = (e, svg) => {
    const rect = svg.getBoundingClientRect()
    const touch = e.changedTouches?.[0] || e.touches?.[0]
    const clientX = touch ? touch.clientX : e.clientX
    const clientY = touch ? touch.clientY : e.clientY
    return [
      (clientX - rect.left) / (rect.width / 1000) * SCALE,
      (clientY - rect.top) / (rect.height / 400) * SCALE,
    ]
  }

  const dragRef = useRef({ active: false, moved: false, start: [0, 0] })
  const TAP_TOOLS = ['polyline', 'door', 'window']

  const handlePointerDown = (e, view) => {
    const svg = view === 'elevation' ? elevationRef.current : planRef.current
    if (!svg) return
    const [x, y] = getSvgCoords(e, svg)
    setMousePos([x, y])
    if (activeTool === 'line') {
      // arrastrar para dibujar: marcamos el punto de inicio
      try { svg.setPointerCapture?.(e.pointerId) } catch { /* no-op */ }
      dragRef.current = { active: true, moved: false, start: [x, y] }
      setDrawingView(view)
      addPoint([x, y])
    }
  }

  const handlePointerMove = (e, view) => {
    const svg = view === 'elevation' ? elevationRef.current : planRef.current
    if (!svg) return
    const [x, y] = getSvgCoords(e, svg)
    setMousePos([x, y])
    if (dragRef.current.active) {
      const dx = x - dragRef.current.start[0]
      const dy = y - dragRef.current.start[1]
      if (Math.sqrt(dx * dx + dy * dy) > 8) dragRef.current.moved = true
    }
  }

  const handlePointerUp = (e, view) => {
    const svg = view === 'elevation' ? elevationRef.current : planRef.current
    if (!svg) return
    const [x, y] = getSvgCoords(e, svg)
    if (activeTool === 'line' && dragRef.current.active) {
      if (dragRef.current.moved) {
        addPoint([x, y])
        finishDrawing(view) // crea la línea y la auto-selecciona
      } else {
        cancelDrawing() // fue un toque sin arrastre: descartamos
      }
      dragRef.current.active = false
      setDrawingView(null)
      return
    }
    // herramientas por toque: agregan punto a punto
    if (TAP_TOOLS.includes(activeTool)) {
      setDrawingView(view)
      addPoint([x, y])
    }
  }

  return (
    <div className="drawing-canvas">
      <div className="canvas-section" style={{ height: `${elevationHeight}%` }}>
        <div className="canvas-header">Elevación (A)</div>
        <svg
          ref={elevationRef}
          className="canvas-svg"
          viewBox="0 0 1000 400"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => handlePointerDown(e, 'elevation')}
          onPointerMove={(e) => handlePointerMove(e, 'elevation')}
          onPointerUp={(e) => handlePointerUp(e, 'elevation')}
        />
      </div>

      <div
        ref={dividerRef}
        className={`canvas-divider ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleDividerStart}
        onTouchStart={handleDividerStart}
      >
        <div className="divider-handle"></div>
      </div>

      <div className="canvas-section" style={{ height: `${100 - elevationHeight}%` }}>
        <div className="canvas-header">Planta (P)</div>
        <svg
          ref={planRef}
          className="canvas-svg"
          viewBox="0 0 1000 400"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => handlePointerDown(e, 'plan')}
          onPointerMove={(e) => handlePointerMove(e, 'plan')}
          onPointerUp={(e) => handlePointerUp(e, 'plan')}
        />
      </div>
    </div>
  )
}

function drawView(svgElement, view, elements, selectedId, currentPoints, mousePos, activeTool) {
  if (!svgElement) return
  svgElement.innerHTML = ''

  // Fondo blanco
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  bg.setAttribute('width', '1000')
  bg.setAttribute('height', '400')
  bg.setAttribute('fill', 'white')
  svgElement.appendChild(bg)

  // Grilla
  drawGrid(svgElement, GRID_SIZE)

  // Ejes
  drawAxes(svgElement, view)

  // Elementos dibujados
  elements.forEach((el) => {
    if (el.type === 'line' || el.type === 'polyline') {
      drawPolyline(svgElement, el, selectedId, view)
    }
  })

  // Línea temporal mientras se dibuja
  if (currentPoints.length > 0) {
    currentPoints.forEach((p, i) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', p[0])
      circle.setAttribute('cy', p[1])
      circle.setAttribute('r', '4')
      circle.setAttribute('fill', '#fe0000')
      svgElement.appendChild(circle)

      if (i > 0) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', currentPoints[i - 1][0])
        line.setAttribute('y1', currentPoints[i - 1][1])
        line.setAttribute('x2', p[0])
        line.setAttribute('y2', p[1])
        line.setAttribute('stroke', '#fe0000')
        line.setAttribute('stroke-width', '2')
        line.setAttribute('stroke-dasharray', '4')
        svgElement.appendChild(line)
      }
    })

    if (currentPoints.length > 0) {
      const lastPoint = currentPoints[currentPoints.length - 1]
      const snapped = [snapToGrid(mousePos[0]), snapToGrid(mousePos[1])]
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', lastPoint[0])
      line.setAttribute('y1', lastPoint[1])
      line.setAttribute('x2', snapped[0])
      line.setAttribute('y2', snapped[1])
      line.setAttribute('stroke', '#fe0000')
      line.setAttribute('stroke-width', '1')
      line.setAttribute('stroke-dasharray', '2')
      line.setAttribute('opacity', '0.5')
      svgElement.appendChild(line)

      // largo en vivo mientras se arrastra
      const dx = snapped[0] - lastPoint[0]
      const dy = snapped[1] - lastPoint[1]
      const dist = Math.round(Math.sqrt(dx * dx + dy * dy))
      if (dist > 0) {
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        txt.setAttribute('x', (lastPoint[0] + snapped[0]) / 2)
        txt.setAttribute('y', (lastPoint[1] + snapped[1]) / 2 - 8)
        txt.setAttribute('font-size', '12')
        txt.setAttribute('font-weight', 'bold')
        txt.setAttribute('fill', '#fe0000')
        txt.setAttribute('text-anchor', 'middle')
        txt.setAttribute('pointer-events', 'none')
        txt.textContent = `${dist}mm`
        svgElement.appendChild(txt)
      }
    }
  }

  // Indicador de snap: muestra dónde caerá el próximo punto
  const drawTools = ['line', 'polyline', 'door', 'window']
  if (activeTool && drawTools.includes(activeTool) && mousePos) {
    const sx = snapToGrid(mousePos[0])
    const sy = snapToGrid(mousePos[1])
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    ring.setAttribute('cx', sx)
    ring.setAttribute('cy', sy)
    ring.setAttribute('r', '5')
    ring.setAttribute('fill', 'none')
    ring.setAttribute('stroke', '#fe0000')
    ring.setAttribute('stroke-width', '1.5')
    ring.setAttribute('pointer-events', 'none')
    svgElement.appendChild(ring)
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    dot.setAttribute('cx', sx)
    dot.setAttribute('cy', sy)
    dot.setAttribute('r', '1.5')
    dot.setAttribute('fill', '#fe0000')
    dot.setAttribute('pointer-events', 'none')
    svgElement.appendChild(dot)
  }
}

function drawGrid(svgElement, gridSize) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  // mismas celdas en X e Y para que la grilla coincida con el snap
  for (let x = 0; x <= 1000; x += gridSize) {
    const major = (x % (gridSize * 5)) === 0
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', x)
    line.setAttribute('y1', '0')
    line.setAttribute('x2', x)
    line.setAttribute('y2', '400')
    line.setAttribute('stroke', major ? '#d8d8d8' : '#ececec')
    line.setAttribute('stroke-width', major ? '0.8' : '0.5')
    g.appendChild(line)
  }
  for (let y = 0; y <= 400; y += gridSize) {
    const major = (y % (gridSize * 5)) === 0
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', '0')
    line.setAttribute('y1', y)
    line.setAttribute('x2', '1000')
    line.setAttribute('y2', y)
    line.setAttribute('stroke', major ? '#d8d8d8' : '#ececec')
    line.setAttribute('stroke-width', major ? '0.8' : '0.5')
    g.appendChild(line)
  }
  svgElement.appendChild(g)
}

function drawAxes(svgElement, view) {
  const axisX = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  axisX.setAttribute('x1', '50')
  axisX.setAttribute('y1', '350')
  axisX.setAttribute('x2', '950')
  axisX.setAttribute('y2', '350')
  axisX.setAttribute('stroke', '#fe0000')
  axisX.setAttribute('stroke-width', '1')
  axisX.setAttribute('opacity', '0.3')
  svgElement.appendChild(axisX)

  const axisY = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  axisY.setAttribute('x1', '50')
  axisY.setAttribute('y1', '350')
  axisY.setAttribute('x2', '50')
  axisY.setAttribute('y2', '50')
  axisY.setAttribute('stroke', '#fe0000')
  axisY.setAttribute('stroke-width', '1')
  axisY.setAttribute('opacity', '0.3')
  svgElement.appendChild(axisY)

  const labelX = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  labelX.setAttribute('x', '960')
  labelX.setAttribute('y', '368')
  labelX.setAttribute('font-size', '10')
  labelX.setAttribute('fill', '#fe0000')
  labelX.setAttribute('opacity', '0.5')
  labelX.textContent = 'X'
  svgElement.appendChild(labelX)

  const labelY = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  labelY.setAttribute('x', '25')
  labelY.setAttribute('y', '45')
  labelY.setAttribute('font-size', '10')
  labelY.setAttribute('fill', '#fe0000')
  labelY.setAttribute('opacity', '0.5')
  labelY.textContent = view === 'elevation' ? 'Z' : 'Y'
  svgElement.appendChild(labelY)
}

function drawPolyline(svgElement, el, selectedId, view) {
  if (el.points.length < 2) return

  if (view === 'plan') {
    // PLANTA: Dibuja línea
    drawLine(svgElement, el, selectedId)
  } else {
    // ELEVACIÓN: Dibuja rectángulo basado en puntos de planta
    drawRectangle(svgElement, el, selectedId)
  }
}

function drawLine(svgElement, el, selectedId) {
  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
  const points = el.points.map((p) => `${p[0]},${p[1]}`).join(' ')
  polyline.setAttribute('points', points)
  polyline.setAttribute('fill', 'none')
  polyline.setAttribute('stroke', el.id === selectedId ? '#fe0000' : '#333')
  polyline.setAttribute('stroke-width', el.id === selectedId ? '3' : '2')
  polyline.setAttribute('data-id', el.id)
  polyline.setAttribute('cursor', 'pointer')
  svgElement.appendChild(polyline)

  // Puntos
  el.points.forEach((p) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', p[0])
    circle.setAttribute('cy', p[1])
    circle.setAttribute('r', el.id === selectedId ? '3' : '2')
    circle.setAttribute('fill', el.id === selectedId ? '#fe0000' : '#666')
    circle.setAttribute('pointer-events', 'none')
    svgElement.appendChild(circle)
  })

  // Label con longitud
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  const midPoint = [
    (el.points[0][0] + el.points[el.points.length - 1][0]) / 2,
    (el.points[0][1] + el.points[el.points.length - 1][1]) / 2,
  ]
  label.setAttribute('x', midPoint[0])
  label.setAttribute('y', midPoint[1] - 8)
  label.setAttribute('font-size', '10')
  label.setAttribute('font-weight', 'bold')
  label.setAttribute('fill', el.id === selectedId ? '#fe0000' : '#666')
  label.setAttribute('pointer-events', 'none')
  label.setAttribute('text-anchor', 'middle')
  label.textContent = `${el.id} ${el.properties?.length || 0}mm`
  svgElement.appendChild(label)

  polyline.addEventListener('click', (e) => {
    e.stopPropagation()
    useDrawingStore.getState().selectElement(el.id)
  })
}

function drawRectangle(svgElement, el, selectedId) {
  const length = el.properties?.length || 0
  const height = el.properties?.height || 3000
  const x = el.points[0][0]
  const y = 200 - (height / 3000) * 150 // Escala altura a visual

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('x', x)
  rect.setAttribute('y', y)
  rect.setAttribute('width', Math.max(length / 10, 20))
  rect.setAttribute('height', (height / 3000) * 150)
  rect.setAttribute('fill', el.id === selectedId ? 'rgba(254, 0, 0, 0.2)' : 'rgba(51, 51, 51, 0.1)')
  rect.setAttribute('stroke', el.id === selectedId ? '#fe0000' : '#333')
  rect.setAttribute('stroke-width', el.id === selectedId ? '3' : '2')
  rect.setAttribute('data-id', el.id)
  rect.setAttribute('cursor', 'pointer')
  svgElement.appendChild(rect)

  // Label
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  label.setAttribute('x', x + (Math.max(length / 10, 20) / 2))
  label.setAttribute('y', y - 8)
  label.setAttribute('font-size', '10')
  label.setAttribute('font-weight', 'bold')
  label.setAttribute('fill', el.id === selectedId ? '#fe0000' : '#666')
  label.setAttribute('pointer-events', 'none')
  label.setAttribute('text-anchor', 'middle')
  label.textContent = `${el.id} ${height}mm`
  svgElement.appendChild(label)

  rect.addEventListener('click', (e) => {
    e.stopPropagation()
    useDrawingStore.getState().selectElement(el.id)
  })
}
