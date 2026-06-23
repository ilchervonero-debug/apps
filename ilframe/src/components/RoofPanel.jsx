import { useProjectStore, ROOF_TYPES } from '../store/useProjectStore'

const ROOF_ICONS = { 1: '1A', 2: '2A', 3: '3A', 4: 'PL' }

export default function RoofPanel({ roomId }) {
  const { rooms, setRoof } = useProjectStore()
  const room = rooms[roomId]
  if (!room) return null
  const { roof } = room

  return (
    <div className="space-y-4">
      <div className="font-semibold text-gray-700 text-sm">Techo</div>

      <div>
        <label className="block text-xs text-gray-400 mb-2">Tipo de techo</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(ROOF_TYPES).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setRoof(roomId, { type: +k })}
              className={`
                flex items-center gap-2 px-3 py-2 rounded border text-xs font-medium transition-all
                ${roof.type === +k
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:border-gray-400'}
              `}
            >
              <span className="font-bold">{ROOF_ICONS[k]}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {roof.type !== 4 && (
        <>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Pendiente (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={100} step={1}
                value={roof.slope_pct || 0}
                onChange={e => setRoof(roomId, { slope_pct: +e.target.value })}
                className="flex-1 accent-red-600"
              />
              <span className="text-gray-900 font-mono text-sm w-12 text-right">
                {roof.slope_pct || 0}%
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              = {slopeToDeg(roof.slope_pct || 0)}° aprox. {slopeToRatio(roof.slope_pct || 0)}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Altura de cumbrera (mm)</label>
            <input
              type="number" step="50"
              className="w-full bg-gray-100 border border-gray-200 rounded px-3 py-1.5 text-gray-900 text-sm focus:outline-none focus:border-red-400"
              value={roof.ridge_height || 0}
              onChange={e => setRoof(roomId, { ridge_height: +e.target.value })}
            />
          </div>
        </>
      )}

      {roof.type === 4 && (
        <div className="text-xs text-gray-400 bg-gray-100 rounded px-3 py-2">
          Techo plano — pendiente 0%, sin cumbrera
        </div>
      )}
    </div>
  )
}

function slopeToDeg(pct) {
  return (Math.atan(pct / 100) * 180 / Math.PI).toFixed(1)
}
function slopeToRatio(pct) {
  if (pct === 0) return '0/10'
  return `${Math.round(pct / 10)}/10`
}
