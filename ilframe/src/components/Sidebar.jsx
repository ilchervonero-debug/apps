import { useProjectStore } from '../store/useProjectStore'
import RoofPanel from './RoofPanel'
import { CU_NORMS, CU_SECTIONS } from '../data/profiles'
import { LAYER_TEMPLATES, LAYER_PRESETS } from '../data/layers'

export default function Sidebar() {
  const {
    rooms, activeRoomId, activeView,
    addRoom, setActiveRoom, deleteRoom, updateRoom,
    setMaterialStack, setActiveView,
    project, setProject,
  } = useProjectStore()

  const room = activeRoomId ? rooms[activeRoomId] : null
  const ms = room?.materialStack

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-72 min-w-72 overflow-y-auto">
      {/* Header proyecto */}
      <div className="p-4 border-b border-gray-200">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Proyecto</div>
        <input
          className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-gray-900 text-sm focus:outline-none focus:border-red-400"
          value={project.name}
          onChange={e => setProject({ name: e.target.value })}
        />
      </div>

      {/* Ambientes */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400 uppercase tracking-wider">Ambientes</span>
          <button
            onClick={() => addRoom()}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded transition-colors"
          >+ Nuevo</button>
        </div>

        <div className="space-y-1">
          {Object.values(rooms).map(r => (
            <div
              key={r.id}
              className={`
                flex items-center justify-between px-2 py-1.5 rounded cursor-pointer
                ${r.id === activeRoomId ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-100'}
              `}
              onClick={() => setActiveRoom(r.id)}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${r.closed ? 'bg-green-500' : 'bg-amber-400'}`} />
                <input
                  className="bg-transparent text-sm text-gray-900 w-36 cursor-pointer focus:outline-none focus:bg-gray-100 focus:px-1 rounded"
                  value={r.name}
                  onClick={e => e.stopPropagation()}
                  onChange={e => updateRoom(r.id, { name: e.target.value })}
                />
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteRoom(r.id) }}
                className="text-gray-300 hover:text-red-500 text-xs"
              >x</button>
            </div>
          ))}
        </div>
      </div>

      {/* Propiedades del ambiente activo */}
      {room && (
        <div className="flex-1 p-4 space-y-5">

          {/* Techo */}
          <RoofPanel roomId={activeRoomId} />

          <hr className="border-gray-200" />

          {/* Perfil steelframing */}
          <div>
            <div className="font-semibold text-gray-700 text-sm mb-3">Steelframing</div>

            <label className="block text-xs text-gray-400 mb-1">Familia</label>
            <select
              className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-gray-900 text-sm mb-3 focus:outline-none focus:border-red-400"
              value={ms?.profile_family || 'CU'}
              onChange={e => setMaterialStack(activeRoomId, { profile_family: e.target.value })}
            >
              <option value="CU">CU — Stud & Track (muros)</option>
              <option value="CC">CC — Cold-Formed (cielorraso)</option>
            </select>

            <label className="block text-xs text-gray-400 mb-1">Norma</label>
            <select
              className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-gray-900 text-sm mb-3 focus:outline-none focus:border-red-400"
              value={ms?.profile_norm || 'cu_1'}
              onChange={e => setMaterialStack(activeRoomId, { profile_norm: e.target.value })}
            >
              {CU_NORMS.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>

            <label className="block text-xs text-gray-400 mb-1">Perfil C (montante)</label>
            <select
              className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-gray-900 text-sm mb-3 focus:outline-none focus:border-red-400"
              value={`${ms?.profile_height || 100}_${ms?.profile_thickness || 0.95}`}
              onChange={e => {
                const [h, t] = e.target.value.split('_')
                setMaterialStack(activeRoomId, { profile_height: +h, profile_thickness: +t })
              }}
            >
              {(CU_SECTIONS.cu_1?.C || []).map((c, i) => (
                <option key={i} value={`${c.h}_${c.t}`}>
                  {c.h}x{c.w}x{c.t}mm — {c.kg} kg/m
                </option>
              ))}
            </select>

            <label className="block text-xs text-gray-400 mb-1">Separación entre montantes (mm)</label>
            <select
              className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-gray-900 text-sm focus:outline-none focus:border-red-400"
              value={ms?.stud_spacing || 400}
              onChange={e => setMaterialStack(activeRoomId, { stud_spacing: +e.target.value })}
            >
              <option value={300}>300mm</option>
              <option value={400}>400mm</option>
              <option value={600}>600mm</option>
            </select>
          </div>

          <hr className="border-gray-200" />

          {/* Capas de material */}
          <div>
            <div className="font-semibold text-gray-700 text-sm mb-2">Capas de material</div>

            <label className="block text-xs text-gray-400 mb-1">Kit rapido</label>
            <select
              className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-gray-900 text-sm mb-3 focus:outline-none focus:border-red-400"
              onChange={e => {
                const preset = LAYER_PRESETS[e.target.value]
                if (preset) setMaterialStack(activeRoomId, { layers: preset.layers })
              }}
              defaultValue=""
            >
              <option value="" disabled>Seleccionar preset...</option>
              {Object.entries(LAYER_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>

            <div className="space-y-1 max-h-48 overflow-y-auto">
              {(ms?.layers || []).map((layerId, i) => {
                const tpl = LAYER_TEMPLATES.find(l => l.id === layerId)
                if (!tpl) return null
                return (
                  <div key={i} className="flex items-center justify-between bg-gray-100 rounded px-2 py-1">
                    <span className="text-xs text-gray-700">{tpl.name}</span>
                    <button
                      onClick={() => setMaterialStack(activeRoomId, {
                        layers: (ms?.layers || []).filter((_, j) => j !== i)
                      })}
                      className="text-gray-300 hover:text-red-500 text-xs"
                    >x</button>
                  </div>
                )
              })}
            </div>

            <select
              className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-gray-900 text-xs mt-2 focus:outline-none focus:border-red-400"
              onChange={e => {
                if (!e.target.value) return
                setMaterialStack(activeRoomId, {
                  layers: [...(ms?.layers || []), e.target.value]
                })
                e.target.value = ''
              }}
              defaultValue=""
            >
              <option value="" disabled>+ Agregar capa...</option>
              {LAYER_TEMPLATES.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
