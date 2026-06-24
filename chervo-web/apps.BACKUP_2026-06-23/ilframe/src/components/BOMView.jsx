import { useMemo } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { getFaceGeometry, calcFramingBOM } from '../engine/geometry'
import { LAYER_TEMPLATES, BOARD_SIZES } from '../data/layers'
import { CU_SECTIONS } from '../data/profiles'

export default function BOMView() {
  const { rooms } = useProjectStore()
  const activeRooms = Object.values(rooms).filter(r =>
    (r.faces && r.faces.some(f => f.width && f.height)) || r.closed
  )

  const bom = useMemo(() => calcBOM(activeRooms), [activeRooms])

  if (activeRooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Importa un plano para ver la lista de materiales
      </div>
    )
  }

  const grouped = groupBy(bom, 'category')
  const categories = {
    structure: 'Estructura steelframing',
    sheathing: 'Revestimiento estructural',
    insulation: 'Aislante',
    board: 'Placas de terminación',
    fastener: 'Fijaciones',
    tape: 'Junta y masilla',
    finish: 'Pintura / terminación',
  }

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      <div className="text-gray-700 font-semibold">Lista de materiales</div>

      <div className="grid grid-cols-3 gap-3">
        {activeRooms.map(room => {
          const totalNet = (room.faces?.filter(f => f.width && f.height) || [])
            .reduce((s, f) => {
              const gross = (f.width/1000) * (f.height/1000)
              const openings = (f.openings||[]).reduce((a,o) => a + (o.width/1000)*(o.height/1000), 0)
              return s + gross - openings
            }, 0)
          return (
            <div key={room.id} className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-400">{room.name}</div>
              <div className="text-gray-900 font-mono font-semibold">{totalNet.toFixed(2)} m²</div>
              <div className="text-xs text-gray-400">neto de muros</div>
            </div>
          )
        })}
      </div>

      {Object.entries(categories).map(([cat, label]) => {
        const items = grouped[cat]
        if (!items || items.length === 0) return null
        return (
          <div key={cat}>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {label}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-2 text-gray-400 font-normal">Material</th>
                    <th className="text-right px-4 py-2 text-gray-400 font-normal">Cantidad</th>
                    <th className="text-right px-4 py-2 text-gray-400 font-normal">Unidad</th>
                    <th className="text-right px-4 py-2 text-gray-400 font-normal w-24">+Desperdicio</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{item.name}</td>
                      <td className="px-4 py-2 text-right font-mono text-gray-900">{item.qty.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-gray-400">{item.unit}</td>
                      <td className="px-4 py-2 text-right font-mono text-red-600 font-semibold">
                        {item.qty_with_waste.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      <div className="text-xs text-gray-400 pb-4">
        * Cantidades incluyen desperdicio por corte segun material. Perfil basado en norma seleccionada.
      </div>
    </div>
  )
}

function calcBOM(rooms) {
  const totals = {}

  function add(id, name, category, unit, qty, waste_pct) {
    if (!totals[id]) totals[id] = { id, name, category, unit, qty: 0, waste_pct }
    totals[id].qty += qty
  }

  for (const room of rooms) {
    const { materialStack } = room
    const normSections = CU_SECTIONS['cu_1']
    const stud = normSections?.C?.find(c =>
      c.h === (materialStack?.profile_height || 100) &&
      c.t === (materialStack?.profile_thickness || 0.95)
    ) || normSections?.C?.[0]

    // usar faces del wizard o derivar de points+wallProps
    const facesData = room.faces?.filter(f => f.width && f.height)
      || (room.points?.length >= 2
        ? Array.from({ length: room.points.length }, (_, i) => {
            const g = getFaceGeometry(room.points, i, room.wallProps)
            return { width: g.width_mm, height: g.height_mm, openings: g.openings }
          })
        : [])

    for (const face of facesData) {
      const face_geo = {
        width_mm: face.width,
        height_mm: face.height,
        gross_m2: (face.width / 1000) * (face.height / 1000),
        openings_m2: (face.openings || []).reduce((s, op) => s + (op.width / 1000) * (op.height / 1000), 0),
        net_m2: 0,
        openings: face.openings || [],
      }
      face_geo.net_m2 = face_geo.gross_m2 - face_geo.openings_m2

      // reemplazar el bloque original con face_geo
      const spacing = materialStack?.stud_spacing || 400
      const framing = calcFramingBOM(face_geo.width_mm, face_geo.height_mm, spacing, stud)

      // Montantes C
      add('stud_ml', `Montante C ${stud ? stud.h + 'x' + stud.w + 'x' + stud.t : ''}`, 'structure',
        'ml', framing.studs_ml, 5)

      // Soleras U (2x largo del muro)
      const track_len = face_geo.width_mm / 1000 * 2
      add('track_ml', `Solera U`, 'structure', 'ml', track_len, 5)

      // Capas de material
      const layers = materialStack?.layers || ['gyp_standard', 'screws_drywall', 'joint_tape', 'joint_compound', 'primer', 'paint_1st']

      for (const layerId of layers) {
        const tpl = LAYER_TEMPLATES.find(l => l.id === layerId)
        if (!tpl) continue

        if (tpl.unit === 'placa') {
          const boardSize = BOARD_SIZES[tpl.board] || BOARD_SIZES.gyp_1200x2400
          const board_m2 = (boardSize.w / 1000) * (boardSize.h / 1000)
          const qty = Math.ceil(face_geo.net_m2 / board_m2)
          add(layerId, tpl.name, tpl.category, 'placa', qty, tpl.waste_pct)
        } else if (tpl.unit === 'unidad' && tpl.qty_per_m2) {
          add(layerId, tpl.name, tpl.category, 'unidad', face_geo.net_m2 * tpl.qty_per_m2, tpl.waste_pct)
        } else if (tpl.unit === 'ml' && tpl.qty_per_m2) {
          add(layerId, tpl.name, tpl.category, 'ml', face_geo.net_m2 * tpl.qty_per_m2, tpl.waste_pct)
        } else if (tpl.unit === 'kg' && tpl.qty_per_m2) {
          add(layerId, tpl.name, tpl.category, 'kg', face_geo.net_m2 * tpl.qty_per_m2, tpl.waste_pct)
        } else if (tpl.unit === 'lt' && tpl.coverage_m2_per_lt) {
          add(layerId, tpl.name, tpl.category, 'lt', face_geo.net_m2 / tpl.coverage_m2_per_lt, tpl.waste_pct)
        } else if (tpl.unit === 'm2') {
          add(layerId, tpl.name, tpl.category, 'm2', face_geo.net_m2, tpl.waste_pct)
        }
      }
    }
  }

  return Object.values(totals).map(item => ({
    ...item,
    qty_with_waste: item.qty * (1 + item.waste_pct / 100),
  }))
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    ;(acc[item[key]] = acc[item[key]] || []).push(item)
    return acc
  }, {})
}
