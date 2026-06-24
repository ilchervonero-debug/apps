import { useMemo } from 'react'
import { useProjectStore, ELEMENT_TYPES } from '../store/useProjectStore'
import { useDrawingStore } from '../store/drawingStore'
import { calcFramingBOM } from '../engine/geometry'
import { LAYER_TEMPLATES, BOARD_SIZES } from '../data/layers'
import { CU_SECTIONS } from '../data/profiles'

export default function BOMView() {
  const { rooms }        = useProjectStore()
  const drawingElements  = useDrawingStore(s => s.elements)
  const roomList         = Object.values(rooms)

  const perRoom = useMemo(() => roomList.map(r => calcRoomBOM(r, drawingElements)), [rooms, drawingElements])
  const totals  = useMemo(() => mergeTotals(perRoom), [perRoom])

  if (roomList.length === 0) {
    return (
      <div style={{ padding: 20, color: '#bbb', fontSize: 12, fontStyle: 'italic' }}>
        Agregá componentes y dibujá en la Planta para ver materiales
      </div>
    )
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', fontFamily: "'Exo', system-ui, sans-serif" }}>

      {/* Per-component cards */}
      {perRoom.map((roomBOM, i) => {
        const room  = roomList[i]
        const type  = room.elementType || 'wall'
        const color = ELEMENT_TYPES[type]?.color || '#fe0000'
        if (roomBOM.length === 0 && !getGeometry(room, drawingElements).length) return null
        return (
          <div key={room.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
            {/* Room header */}
            <div style={{
              padding: '8px 14px', background: `${color}0a`,
              borderLeft: `3px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{room.name}</span>
                <span style={{ marginLeft: 6, fontSize: 10, color: color, fontWeight: 700, textTransform: 'uppercase' }}>
                  {ELEMENT_TYPES[type]?.label}
                </span>
              </div>
              <RoomMetrics room={room} drawingElements={drawingElements} />
            </div>
            {roomBOM.length > 0 && (
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <tbody>
                  {roomBOM.map((item, j) => (
                    <tr key={j} style={{ borderBottom: '1px solid #f8f8f8' }}>
                      <td style={{ padding: '5px 14px', color: '#444' }}>{item.name}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: '#1a1a1a', fontWeight: 600 }}>
                        {fmt(item.qty)} {item.unit}
                      </td>
                      <td style={{ padding: '5px 12px 5px 4px', textAlign: 'right', fontFamily: 'monospace', color: color, fontSize: 10 }}>
                        +{item.waste_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {roomBOM.length === 0 && (
              <div style={{ padding: '8px 14px', fontSize: 11, color: '#bbb', fontStyle: 'italic' }}>
                Sin geometría — hacé clic en "Dibujar este componente" y dibujá en Planta
              </div>
            )}
          </div>
        )
      })}

      {/* Grand total */}
      {totals.length > 0 && (
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            Total proyecto
          </div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <tbody>
              {totals.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '5px 0', color: '#444' }}>{item.name}</td>
                  <td style={{ padding: '5px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#1a1a1a' }}>
                    {fmt(item.qty_with_waste)} {item.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RoomMetrics({ room, drawingElements }) {
  const faces = getGeometry(room, drawingElements)
  if (!faces.length) return null
  const totalM2 = faces.reduce((s, f) => s + f.net_m2, 0)
  const totalML = faces.reduce((s, f) => s + f.width_mm / 1000, 0)
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#1a1a1a' }}>
        {totalM2.toFixed(2)} m²
      </div>
      <div style={{ fontSize: 10, color: '#aaa' }}>{totalML.toFixed(2)} m lin.</div>
    </div>
  )
}

// ── BOM calculation ───────────────────────────────────────────────────────────

function getGeometry(room, drawingElements) {
  const elems = drawingElements.filter(e => e.componentId === room.id)
  if (elems.length > 0) {
    return elems.map(el => {
      const w = el.properties?.length ?? 0
      const h = el.properties?.height ?? 3000
      const gross = (w / 1000) * (h / 1000)
      const openings_m2 = (el.openings || []).reduce((s, o) => s + (o.width / 1000) * (o.height / 1000), 0)
      return { width_mm: w, height_mm: h, gross_m2: gross, openings_m2, net_m2: Math.max(0, gross - openings_m2), openings: [] }
    })
  }
  // Fall back to room.faces
  return (room.faces || [])
    .filter(f => f.width && f.height)
    .map(f => {
      const gross = (f.width / 1000) * (f.height / 1000)
      const oa = (f.openings || []).reduce((s, o) => s + (o.width / 1000) * (o.height / 1000), 0)
      return { width_mm: f.width, height_mm: f.height, gross_m2: gross, openings_m2: oa, net_m2: Math.max(0, gross - oa), openings: f.openings || [] }
    })
}

function calcRoomBOM(room, drawingElements) {
  const faces = getGeometry(room, drawingElements)
  if (!faces.length) return []

  const ms      = room.materialStack || {}
  const norm    = ms.profile_norm || 'cu_1'
  const sections = CU_SECTIONS[norm]
  const stud = sections?.C?.find(c =>
    c.h === (ms.profile_height || 100) && c.t === (ms.profile_thickness || 0.95)
  ) || sections?.C?.[0]

  const totals = {}
  function add(id, name, category, unit, qty, waste_pct) {
    if (!totals[id]) totals[id] = { id, name, category, unit, qty: 0, waste_pct }
    totals[id].qty += qty
  }

  for (const face of faces) {
    const spacing = ms.stud_spacing || 400
    const framing = calcFramingBOM(face.width_mm, face.height_mm, spacing, stud)

    // Montantes C
    const studLabel = stud ? `C ${stud.h}×${stud.w}×${stud.t}` : 'C'
    add('stud_ml', `Montante ${studLabel}`, 'structure', 'ml', framing.studs_ml, 5)

    // Soleras U (top + bottom = 2 × largo)
    add('track_ml', 'Solera U', 'structure', 'ml', framing.track_ml, 5)

    // Tornillos autoperforantes (estimado: 6/m² estructura)
    add('screw_tek', 'Tornillo autoperforante TEK', 'fastener', 'unidad', face.net_m2 * 6, 10)

    // Refuerzos en aberturas (king + jack studs)
    const openings = face.openings || []
    for (const op of openings) {
      const jacks = Math.ceil((op.width || 0) / 600) + 1
      add('stud_king', `Montante king ${studLabel}`, 'structure', 'ml', jacks * 2 * (face.height_mm / 1000), 5)
      add('screw_opening', 'Tornillo TEK (aberturas)', 'fastener', 'unidad', jacks * 4 * 2, 10)
    }

    // Capas de material
    for (const layerId of (ms.layers || [])) {
      const tpl = LAYER_TEMPLATES.find(l => l.id === layerId)
      if (!tpl) continue
      if (tpl.unit === 'placa') {
        const bs = BOARD_SIZES[tpl.board] || BOARD_SIZES.gyp_1200x2400
        const board_m2 = (bs.w / 1000) * (bs.h / 1000)
        const qty = Math.ceil(face.net_m2 / board_m2)
        add(layerId, tpl.name, tpl.category, 'placa', qty, tpl.waste_pct)
      } else if (tpl.unit === 'unidad' && tpl.qty_per_m2) {
        add(layerId, tpl.name, tpl.category, 'unidad', face.net_m2 * tpl.qty_per_m2, tpl.waste_pct)
      } else if (tpl.unit === 'ml' && tpl.qty_per_m2) {
        add(layerId, tpl.name, tpl.category, 'ml', face.net_m2 * tpl.qty_per_m2, tpl.waste_pct)
      } else if (tpl.unit === 'kg' && tpl.qty_per_m2) {
        add(layerId, tpl.name, tpl.category, 'kg', face.net_m2 * tpl.qty_per_m2, tpl.waste_pct)
      } else if (tpl.unit === 'lt' && tpl.coverage_m2_per_lt) {
        add(layerId, tpl.name, tpl.category, 'lt', face.net_m2 / tpl.coverage_m2_per_lt, tpl.waste_pct)
      } else if (tpl.unit === 'm2') {
        add(layerId, tpl.name, tpl.category, 'm2', face.net_m2, tpl.waste_pct)
      }
    }
  }

  return Object.values(totals).map(item => ({
    ...item,
    qty_with_waste: item.qty * (1 + item.waste_pct / 100),
  }))
}

function mergeTotals(perRoom) {
  const map = {}
  for (const roomBOM of perRoom) {
    for (const item of roomBOM) {
      if (!map[item.id]) map[item.id] = { ...item, qty: 0, qty_with_waste: 0 }
      map[item.id].qty            += item.qty
      map[item.id].qty_with_waste += item.qty_with_waste
    }
  }
  return Object.values(map)
}

function fmt(n) {
  return typeof n === 'number' ? (Number.isInteger(n) ? n : n.toFixed(2)) : n
}
