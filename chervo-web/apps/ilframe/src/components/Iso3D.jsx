import { useRef, useEffect, useState } from 'react'
import { useDrawingStore, panelPolygon } from '../store/drawingStore'

// Vista 3D liviana (axonométrica) en Canvas — 4 esquinas estáticas, sin orbitar.
const CORNERS = [
  { id: 0, label: 'NE', az: 45 },
  { id: 1, label: 'NO', az: 135 },
  { id: 2, label: 'SO', az: 225 },
  { id: 3, label: 'SE', az: 315 },
]
const PITCH = 30 // grados de inclinación

export default function Iso3D() {
  const canvasRef = useRef(null)
  const panels = useDrawingStore((s) => s.panels)
  const [corner, setCorner] = useState(0)
  const [hidden, setHidden] = useState(() => new Set())

  const toggleHidden = (id) => setHidden((prev) => {
    const n = new Set(prev)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const draw = () => render3D(cv, panels, corner, hidden)
    draw()
    let ro
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(draw); ro.observe(cv) }
    return () => ro && ro.disconnect()
  }, [panels, corner, hidden])

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
      {/* selector de esquina */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: '1px solid #ececec', background: '#fff', flexShrink: 0, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#888', fontWeight: 700 }}>Esquina</span>
        {CORNERS.map((c) => (
          <button key={c.id} onClick={() => setCorner(c.id)}
            style={{
              border: '1px solid', borderColor: corner === c.id ? '#fe0000' : '#ddd',
              background: corner === c.id ? '#fe0000' : '#fff', color: corner === c.id ? '#fff' : '#555',
              borderRadius: 7, fontSize: 13, fontWeight: 800, padding: '6px 12px', cursor: 'pointer',
            }}>
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        {panels.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 16 }}>
            Dibujá muros en la planta para ver el 3D
          </div>
        )}
      </div>

      {/* mostrar / ocultar elementos */}
      {panels.length > 0 && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderTop: '1px solid #ececec', background: '#fff', flexShrink: 0, overflowX: 'auto' }}>
          <span style={{ fontSize: 11, color: '#999', fontWeight: 700, alignSelf: 'center', whiteSpace: 'nowrap' }}>Ver:</span>
          {panels.map((p) => {
            const on = !hidden.has(p.id)
            return (
              <button key={p.id} onClick={() => toggleHidden(p.id)}
                style={{
                  border: '1px solid', borderColor: on ? '#0a84ff' : '#ddd',
                  background: on ? '#eaf3ff' : '#f3f3f3', color: on ? '#0a84ff' : '#bbb',
                  borderRadius: 14, fontSize: 12, fontWeight: 700, padding: '5px 11px', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                {on ? '👁 ' : '∅ '}{p.id}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// proyección axonométrica para una esquina (az) + pitch
function makeProject(az, pitch) {
  const a = (az * Math.PI) / 180, e = (pitch * Math.PI) / 180
  const ca = Math.cos(a), sa = Math.sin(a), ce = Math.cos(e), se = Math.sin(e)
  // mundo: X (este), Y (alto), Z (profundidad de planta)
  return (X, Y, Z) => {
    const x1 = X * ca + Z * sa
    const z1 = -X * sa + Z * ca
    const y2 = Y * ce - z1 * se
    const z2 = Y * se + z1 * ce
    return { sx: x1, sy: -y2, depth: z2 }
  }
}

function render3D(cv, panels, corner, hidden) {
  const dpr = window.devicePixelRatio || 1
  const W = cv.clientWidth, H = cv.clientHeight
  if (W === 0 || H === 0) return
  cv.width = W * dpr; cv.height = H * dpr
  const ctx = cv.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)

  const visibles = panels.filter((p) => !hidden.has(p.id))
  if (!visibles.length) return

  const project = makeProject(CORNERS[corner].az, PITCH)

  // construir caras 3D de cada panel
  const faces = []
  for (const p of visibles) {
    const dx = p.b[0] - p.a[0], dy = p.b[1] - p.a[1]
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len, uy = dy / len // dirección del muro en planta
    const local = panelPolygon(p) // [[lx,ly]...] x a lo largo, y alto
    const world = local.map(([lx, ly]) => [p.a[0] + ux * lx, ly, p.a[1] + uy * lx])
    const proj = world.map(([X, Y, Z]) => project(X, Y, Z))
    const depth = proj.reduce((s, q) => s + q.depth, 0) / proj.length
    // aberturas (rectángulos sobre la cara)
    const ops = (p.openings || []).map((op) => {
      const corners = [[op.offset, op.sill], [op.offset + op.width, op.sill], [op.offset + op.width, op.sill + op.height], [op.offset, op.sill + op.height]]
      return corners.map(([lx, ly]) => project(p.a[0] + ux * lx, ly, p.a[1] + uy * lx))
    })
    faces.push({ id: p.id, proj, depth, ops })
  }

  // encuadre: bbox de todas las proyecciones
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const f of faces) for (const q of f.proj) {
    if (q.sx < minX) minX = q.sx; if (q.sx > maxX) maxX = q.sx
    if (q.sy < minY) minY = q.sy; if (q.sy > maxY) maxY = q.sy
  }
  const margin = 40
  const scale = Math.min((W - margin * 2) / (maxX - minX || 1), (H - margin * 2) / (maxY - minY || 1))
  const ox = (W - (maxX - minX) * scale) / 2 - minX * scale
  const oy = (H - (maxY - minY) * scale) / 2 - minY * scale
  const S = (q) => [ox + q.sx * scale, oy + q.sy * scale]

  // pintor: dibujar de atrás hacia adelante (menor depth primero)
  faces.sort((a, b) => a.depth - b.depth)

  for (const f of faces) {
    const pts = f.proj.map(S)
    ctx.beginPath()
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])))
    ctx.closePath()
    ctx.fillStyle = 'rgba(120,140,160,0.45)'
    ctx.fill()
    ctx.strokeStyle = '#3a3a3a'
    ctx.lineWidth = 1.5
    ctx.stroke()
    // aberturas
    for (const op of f.ops) {
      const q = op.map(S)
      ctx.beginPath()
      q.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])))
      ctx.closePath()
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#0a84ff'
      ctx.lineWidth = 1.2
      ctx.stroke()
    }
    // etiqueta del panel en el centro de la cara
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
    ctx.fillStyle = '#fe0000'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(f.id, cx, cy)
  }
}
