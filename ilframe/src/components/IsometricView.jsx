const ISO_SCALE = 0.06

function iso(wx, wy, wz) {
  const c = 0.866
  const s = 0.5
  return {
    x: (wx - wy) * c * ISO_SCALE,
    y: (wx + wy) * s * ISO_SCALE - wz * ISO_SCALE,
  }
}

export default function IsometricView({ room, activeFaceIdx }) {
  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
        <div style={{ fontSize: 48, color: '#d1d5db', fontWeight: 200 }}>[ ]</div>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>Agrega un ambiente para ver la vista 3D</div>
      </div>
    )
  }

  const faces = room.faces || []
  const f0 = faces[0] || {}
  const f1 = faces[1] || {}
  const f2 = faces[2] || {}
  const f3 = faces[3] || {}

  const W = f0.width  || f2.width  || 4000
  const D = f1.width  || f3.width  || 3000
  const H = Math.max(f0.height || 2400, f1.height || 2400, f2.height || 2400, f3.height || 2400)

  const v = {
    a: iso(0, 0, 0), b: iso(W, 0, 0), c: iso(W, D, 0), d: iso(0, D, 0),
    e: iso(0, 0, H), f: iso(W, 0, H), g: iso(W, D, H), h: iso(0, D, H),
  }

  const allPts = Object.values(v)
  const minX = Math.min(...allPts.map(p => p.x))
  const minY = Math.min(...allPts.map(p => p.y))
  const maxX = Math.max(...allPts.map(p => p.x))
  const maxY = Math.max(...allPts.map(p => p.y))
  const pad = 40
  const vW = maxX - minX + pad * 2
  const vH = maxY - minY + pad * 2

  const px = p => p.x - minX + pad
  const py = p => p.y - minY + pad
  const pp = p => `${px(p)},${py(p)}`
  const isoAbs = (wx, wy, wz) => { const p = iso(wx, wy, wz); return `${p.x - minX + pad},${p.y - minY + pad}` }

  const isFront = activeFaceIdx === 0
  const isRight = activeFaceIdx === 1
  const isBack  = activeFaceIdx === 2
  const isLeft  = activeFaceIdx === 3

  const colorFront = isFront ? '#fef2f2' : '#efefef'
  const colorRight = isRight ? '#fef2f2' : '#e2e2e2'
  const colorTop   = '#f8f8f8'
  const strokeFront = isFront ? '#dc2626' : '#c0c0c0'
  const strokeRight = isRight ? '#dc2626' : '#b0b0b0'

  function openingPts(op, faceW, faceH, faceType) {
    const ox = Math.max(0, Math.min(op.offset_x || 0, faceW - op.width))
    const oz = op.sill_height || 0
    const ow = op.width
    const oh = op.height
    if (faceType === 'front') {
      return [
        isoAbs(ox,    0, oz),
        isoAbs(ox+ow, 0, oz),
        isoAbs(ox+ow, 0, oz+oh),
        isoAbs(ox,    0, oz+oh),
      ].join(' ')
    }
    if (faceType === 'right') {
      return [
        isoAbs(W, ox,    oz),
        isoAbs(W, ox+ow, oz),
        isoAbs(W, ox+ow, oz+oh),
        isoAbs(W, ox,    oz+oh),
      ].join(' ')
    }
    return null
  }

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: 'transparent' }}>
      <svg
        viewBox={`0 0 ${vW} ${vH}`}
        style={{ maxWidth: '100%', maxHeight: '100%', width: vW, height: vH }}
      >
        {/* sombra base */}
        <ellipse
          cx={(px(v.a) + px(v.b) + px(v.c) + px(v.d)) / 4}
          cy={(py(v.a) + py(v.b) + py(v.c) + py(v.d)) / 4 + 6}
          rx={(maxX - minX) * 0.38} ry={(maxX - minX) * 0.1}
          fill="rgba(0,0,0,0.07)"
        />

        {/* cara frontal */}
        <polygon
          points={[v.a, v.b, v.f, v.e].map(pp).join(' ')}
          fill={colorFront}
          stroke={strokeFront}
          strokeWidth={isFront ? 2 : 1}
          strokeLinejoin="round"
        />
        {(f0.openings || []).map((op, i) => {
          const pts = openingPts(op, W, H, 'front')
          return pts ? (
            <polygon key={i} points={pts}
              fill="white" stroke="#dc2626" strokeWidth={1.5} strokeLinejoin="round" />
          ) : null
        })}
        {f0.width && (() => {
          const mid = iso(W/2, 0, H * 0.45)
          return (
            <text x={px(mid)} y={py(mid)}
              textAnchor="middle" fontSize={10} fontFamily="Exo, system-ui"
              fill={isFront ? '#dc2626' : '#aaaaaa'} fontWeight="600">
              {f0.name || 'C1'}
            </text>
          )
        })()}

        {/* cara derecha */}
        <polygon
          points={[v.b, v.c, v.g, v.f].map(pp).join(' ')}
          fill={colorRight}
          stroke={strokeRight}
          strokeWidth={isRight ? 2 : 1}
          strokeLinejoin="round"
        />
        {(f1.openings || []).map((op, i) => {
          const pts = openingPts(op, D, H, 'right')
          return pts ? (
            <polygon key={i} points={pts}
              fill="white" stroke="#dc2626" strokeWidth={1.5} strokeLinejoin="round" />
          ) : null
        })}
        {f1.width && (() => {
          const mid = iso(W, D/2, H * 0.45)
          return (
            <text x={px(mid)} y={py(mid)}
              textAnchor="middle" fontSize={10} fontFamily="Exo, system-ui"
              fill={isRight ? '#dc2626' : '#aaaaaa'} fontWeight="600">
              {f1.name || 'C2'}
            </text>
          )
        })()}

        {/* techo */}
        <polygon
          points={[v.e, v.f, v.g, v.h].map(pp).join(' ')}
          fill={colorTop}
          stroke="#c8c8c8"
          strokeWidth={1}
          strokeLinejoin="round"
        />

        {/* aristas ocultas */}
        {[
          [v.c, v.d], [v.d, v.h], [v.d, v.a],
        ].map(([a, b], i) => (
          <line key={i}
            x1={px(a)} y1={py(a)} x2={px(b)} y2={py(b)}
            stroke="#cccccc" strokeWidth={0.8} strokeDasharray="5,4"
          />
        ))}

        {/* cotas */}
        {f0.width && (
          <text
            x={(px(v.a) + px(v.b)) / 2}
            y={(py(v.a) + py(v.b)) / 2 + 16}
            textAnchor="middle" fontSize={9} fontFamily="Exo, system-ui" fill="#aaaaaa">
            {(W/1000).toFixed(2)} m
          </text>
        )}
        {f1.width && (
          <text
            x={(px(v.b) + px(v.c)) / 2 + 16}
            y={(py(v.b) + py(v.c)) / 2}
            textAnchor="start" fontSize={9} fontFamily="Exo, system-ui" fill="#aaaaaa">
            {(D/1000).toFixed(2)} m
          </text>
        )}
        {f0.height && (
          <text
            x={px(v.e) - 14}
            y={(py(v.a) + py(v.e)) / 2}
            textAnchor="middle" fontSize={9} fontFamily="Exo, system-ui" fill="#aaaaaa"
            transform={`rotate(-90, ${px(v.e) - 14}, ${(py(v.a) + py(v.e)) / 2})`}>
            {(H/1000).toFixed(2)} m
          </text>
        )}
      </svg>
    </div>
  )
}
