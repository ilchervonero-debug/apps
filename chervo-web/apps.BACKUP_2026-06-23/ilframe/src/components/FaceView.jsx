import { useMemo } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { getFaceGeometry, calculateBoardLayout } from '../engine/geometry'
import { BOARD_SIZES, LAYER_TEMPLATES } from '../data/layers'

const FACE_SCALE = 0.08   // px/mm para la vista de cara

export default function FaceView() {
  const { rooms, activeRoomId } = useProjectStore()
  const room = activeRoomId ? rooms[activeRoomId] : null

  if (!room || !room.closed) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 text-sm">
        <div>Importa un plano para ver las caras de muro</div>
      </div>
    )
  }

  const wallCount = room.points.length

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      <div className="text-gray-700 font-semibold">{room.name} — Caras de muro</div>

      {Array.from({ length: wallCount }, (_, i) => (
        <WallFace key={i} room={room} wallIdx={i} />
      ))}
    </div>
  )
}

function WallFace({ room, wallIdx }) {
  const wp = room.wallProps[wallIdx] || { height: 2400, name: '', openings: [] }
  const face = useMemo(
    () => getFaceGeometry(room.points, wallIdx, room.wallProps),
    [room.points, wallIdx, room.wallProps]
  )

  // Placa de yeso estándar por default
  const boardTemplate = LAYER_TEMPLATES.find(l => l.id === 'gyp_standard')
  const boardSize = boardTemplate ? BOARD_SIZES[boardTemplate.board] : BOARD_SIZES.gyp_1200x2400

  const layout = useMemo(
    () => calculateBoardLayout(face.width_mm, face.height_mm, boardSize.w, boardSize.h, face.openings),
    [face, boardSize]
  )

  const svgW = Math.ceil(face.width_mm * FACE_SCALE)
  const svgH = Math.ceil(face.height_mm * FACE_SCALE)

  function mm(v) { return v * FACE_SCALE }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="font-semibold text-gray-900">
            Muro {wallIdx + 1} {wp.name ? `— ${wp.name}` : ''}
          </span>
          <div className="text-xs text-gray-400 mt-0.5">
            {(face.width_mm / 1000).toFixed(2)}m x {(face.height_mm / 1000).toFixed(2)}m
            &nbsp;·&nbsp;
            Neto: <span className="text-green-600">{face.net_m2.toFixed(2)} m²</span>
            {face.openings_m2 > 0 && (
              <span className="text-red-500"> (-{face.openings_m2.toFixed(2)} aberturas)</span>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-400 text-right">
          <div>{layout.total_boards} placas</div>
          <div className="text-gray-300">{layout.full_boards} enteras · {layout.cut_boards} cortadas</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={svgW + 2}
          height={svgH + 2}
          style={{ display: 'block', maxWidth: '100%' }}
          viewBox={`-1 -1 ${svgW + 2} ${svgH + 2}`}
        >
          <rect x={0} y={0} width={mm(face.width_mm)} height={mm(face.height_mm)}
            fill="#f9fafb" stroke="#d1d5db" strokeWidth={1} />

          {layout.boards.map((b, i) => (
            <rect key={i}
              x={mm(b.x)} y={mm(face.height_mm - b.y - b.h_mm)}
              width={mm(b.w_mm) - 1} height={mm(b.h_mm) - 1}
              fill={b.is_opening ? 'transparent' : b.is_full ? '#dbeafe' : '#bfdbfe'}
              stroke={b.is_opening ? 'transparent' : b.is_cut ? '#dc2626' : '#93c5fd'}
              strokeWidth={b.is_cut ? 1.5 : 0.5}
              opacity={b.is_opening ? 0 : 1}
            />
          ))}

          {face.openings.map((op, i) => {
            const ox = op.offset_x ?? (face.width_mm / 2 - op.width / 2)
            const oy = op.sill_height ?? 0
            return (
              <g key={i}>
                <rect
                  x={mm(ox)} y={mm(face.height_mm - oy - op.height)}
                  width={mm(op.width)} height={mm(op.height)}
                  fill="#f3f4f6" stroke="#dc2626" strokeWidth={1.5}
                />
                <text
                  x={mm(ox + op.width / 2)} y={mm(face.height_mm - oy - op.height / 2)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={Math.max(7, mm(op.width) * 0.2)}
                  fill="#dc2626"
                >
                  {op.type === 'door' ? 'P' : 'V'}
                </text>
              </g>
            )
          })}

          {layout.cols > 1 && (() => {
            const boardSize = BOARD_SIZES.gyp_1200x2400
            const lines = []
            for (let c = 1; c < layout.cols; c++) {
              const x = mm(c * boardSize.w)
              if (x < svgW) {
                lines.push(<line key={c} x1={x} y1={0} x2={x} y2={mm(face.height_mm)}
                  stroke="#d1d5db" strokeWidth={0.5} strokeDasharray="3,3" />)
              }
            }
            return lines
          })()}

          <text x={mm(face.width_mm / 2)} y={mm(face.height_mm) + 12}
            textAnchor="middle" fontSize={9} fill="#6b7280">
            {(face.width_mm / 1000).toFixed(2)}m
          </text>
          <text x={-4} y={mm(face.height_mm / 2)}
            textAnchor="middle" fontSize={9} fill="#6b7280"
            transform={`rotate(-90, -4, ${mm(face.height_mm / 2)})`}>
            {(face.height_mm / 1000).toFixed(2)}m
          </text>
        </svg>
      </div>

      <div className="flex gap-4 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-300 rounded-sm"></span> Placa entera
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-blue-100 border border-red-500 rounded-sm"></span> Cortada
        </span>
        <span className="flex items-center gap-1 ml-auto">
          {boardSize.w/1000}x{boardSize.h/1000}m por placa
        </span>
      </div>
    </div>
  )
}
