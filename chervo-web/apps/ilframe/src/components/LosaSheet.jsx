import { useDrawingStore } from '../store/drawingStore'
import { PROFILE_NORMS, PROFILE_SECTIONS } from '../data/profiles'
import { VIGUETA_DIRS, DECK_TIPOS, slabGeometry, slabDims, slabKg, slabCanto } from '../engine/slabs'

// Hoja de la Losa de piso / Entrepiso: dirección de viguetas, separación,
// perfil, deck (placa) y nivel. iLStyle.
export default function LosaSheet() {
  const open = useDrawingStore((s) => s.losaSheet)
  const setOpen = useDrawingStore((s) => s.setLosaSheet)
  const config = useDrawingStore((s) => s.losaConfig)
  const setConfig = useDrawingStore((s) => s.setLosaConfig)
  const losas = useDrawingStore((s) => s.losas)
  const selectedLosaId = useDrawingStore((s) => s.selectedLosaId)
  const updateLosa = useDrawingStore((s) => s.updateLosa)
  const removeLosa = useDrawingStore((s) => s.removeLosa)

  if (!open) return null

  const losa = losas.find((x) => x.id === selectedLosaId)
  const cur = losa || config
  const patch = (p) => (losa ? updateLosa(losa.id, p) : setConfig(p))
  const dims = losa ? slabDims(losa) : { w: 4000, d: 5000 }
  const geo = losa ? slabGeometry(losa) : slabGeometry({ ...cur, a: [0, 0], b: [dims.w, dims.d] })

  const cap = { fontSize: 14, fontWeight: 500, color: '#8a8a8a', letterSpacing: '0.03em', textTransform: 'uppercase' }
  const field = { width: '100%', padding: '11px 10px', border: '1px solid #d8d8d8', borderRadius: 10, fontSize: 18, background: '#fff', boxSizing: 'border-box', color: '#1c1c1c' }
  const ref = cur.perfil || { normId: 'cu_1', secIdx: 8 }
  const secs = PROFILE_SECTIONS[ref.normId]?.C || []

  const setDim = (which, v) => {
    if (!losa) return
    const a = losa.a, b = [...losa.b]
    if (which === 'w') b[0] = a[0] + Math.sign(b[0] - a[0] || 1) * v
    else b[1] = a[1] + Math.sign(b[1] - a[1] || 1) * v
    updateLosa(losa.id, { b })
  }
  const numM = (label, value, onSet, opts = {}) => (
    <label style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'block', marginBottom: 5, ...cap, textTransform: 'none' }}>{label}</span>
      <input type="number" step="0.1" defaultValue={(value / 1000).toFixed(2)} key={(losa ? losa.id : 'c') + label + value} disabled={opts.disabled}
        onBlur={(e) => onSet(Math.max(opts.min || 0, Math.round((parseFloat(e.target.value) || 0) * 1000)))}
        style={{ ...field, ...(opts.disabled ? { background: '#efefef', color: '#9a9a9a' } : {}) }} />
    </label>
  )

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 600, borderRadius: '22px 22px 0 0', padding: '8px 0 22px', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e2e2', margin: '6px auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '0 22px' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: '#1c1c1c' }}>{losa ? losa.id : 'Losa de piso'}</div>
          <div style={{ fontSize: 15, color: '#8a8a8a' }}>{losa ? 'parametrizá el entrepiso' : 'arrastrá el rectángulo en planta'}</div>
        </div>

        <div style={{ padding: '12px 22px 0' }}><SlabPreview cur={cur} dims={dims} geo={geo} /></div>

        {geo.alerts.length > 0 && (
          <div style={{ margin: '12px 22px 0', border: '1px solid #fe0000', borderRadius: 12, padding: '10px 14px' }}>
            {geo.alerts.map((a, i) => <div key={i} style={{ fontSize: 15, color: '#fe0000', lineHeight: 1.35 }}>{a}</div>)}
          </div>
        )}

        {/* Dirección de viguetas */}
        <div style={{ padding: '16px 22px 4px', ...cap }}>Dirección de las viguetas</div>
        <div style={{ display: 'flex', gap: 8, padding: '0 22px' }}>
          {VIGUETA_DIRS.map((v) => {
            const on = (cur.dir || 'x') === v.id
            return <button key={v.id} onClick={() => patch({ dir: v.id })} title={v.desc}
              style={{ flex: 1, padding: '11px', borderRadius: 12, cursor: 'pointer', fontSize: 16, fontWeight: 500,
                border: '1px solid', borderColor: on ? '#fe0000' : '#d8d8d8', background: '#fff', color: on ? '#fe0000' : '#1c1c1c' }}>{v.name}</button>
          })}
        </div>

        {/* Medidas */}
        <div style={{ padding: '16px 22px 6px', ...cap }}>Medidas</div>
        <div style={{ display: 'flex', gap: 10, padding: '0 22px 10px' }}>
          {numM('Ancho (m)', dims.w, (v) => setDim('w', Math.max(500, v)), { disabled: !losa, min: 500 })}
          {numM('Largo (m)', dims.d, (v) => setDim('d', Math.max(500, v)), { disabled: !losa, min: 500 })}
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '0 22px' }}>
          {numM('Separación viguetas (m)', cur.sep || 400, (v) => patch({ sep: Math.max(200, v) }), { min: 200 })}
          {numM('Nivel del piso (m)', cur.nivel || 2800, (v) => patch({ nivel: Math.max(0, v) }))}
        </div>

        {/* Perfil de la vigueta */}
        <div style={{ padding: '16px 22px 8px', ...cap }}>Perfil de la vigueta</div>
        <div style={{ display: 'flex', gap: 8, padding: '0 22px' }}>
          <select value={ref.normId} onChange={(e) => patch({ perfil: { normId: e.target.value, secIdx: 0 } })} style={{ ...field, flex: 1 }}>
            {PROFILE_NORMS.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          <select value={ref.secIdx} onChange={(e) => patch({ perfil: { ...ref, secIdx: +e.target.value } })} style={{ ...field, flex: 1 }}>
            {secs.map((s, i) => <option key={i} value={i}>{s.h}×{s.w}×{s.t} · {s.kg}kg/m</option>)}
          </select>
        </div>

        {/* Deck */}
        <div style={{ padding: '16px 22px 8px', ...cap }}>Deck (placa superior)</div>
        <div style={{ padding: '0 22px' }}>
          <select value={cur.deck || 'osb_18'} onChange={(e) => patch({ deck: e.target.value })} style={field}>
            {DECK_TIPOS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* Resumen */}
        <div style={{ padding: '14px 22px 0', fontSize: 15, color: '#6f6f6f' }}>
          {losa ? `${geo.count} viguetas de ${(geo.span / 1000).toFixed(2)} m · ${geo.ml.toFixed(1)} ml (${slabKg(losa).toFixed(1)} kg) · deck ${geo.deckM2.toFixed(1)} m² · canto ${(slabCanto(losa) / 10).toFixed(1)} cm` : 'Dibujá el rectángulo en planta para computar'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px 0' }}>
          {losa ? (
            <button onClick={() => { removeLosa(losa.id); setOpen(false) }}
              style={{ background: 'none', border: 'none', color: '#1c1c1c', fontSize: 16, fontWeight: 500, cursor: 'pointer', padding: 0 }}>Borrar losa</button>
          ) : <span />}
          <button onClick={() => setOpen(false)}
            style={{ background: '#fe0000', border: 'none', color: '#fff', fontSize: 17, fontWeight: 500, borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>
            {losa ? 'Listo' : 'Dibujar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Vista en planta esquemática: rectángulo + viguetas
function SlabPreview({ cur, dims, geo }) {
  const W = 556, H = 150, pad = 18
  const s = Math.min((W - pad * 2) / dims.w, (H - pad * 2) / dims.d)
  const rw = dims.w * s, rh = dims.d * s
  const ox = (W - rw) / 2, oy = (H - rh) / 2
  const dir = cur.dir || 'x'
  const sep = Math.max(200, cur.sep || 400)
  const lines = []
  if (dir === 'x') { for (let y = 0; y <= dims.d; y += sep) lines.push([[ox, oy + y * s], [ox + rw, oy + y * s]]) }
  else { for (let x = 0; x <= dims.w; x += sep) lines.push([[ox + x * s, oy], [ox + x * s, oy + rh]]) }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', background: '#fafafa', border: '1px solid #ececec', borderRadius: 12 }}>
      <rect x={ox} y={oy} width={rw} height={rh} fill="rgba(28,28,28,0.04)" stroke="#fe0000" strokeWidth={1.6} />
      {lines.map((l, i) => <line key={i} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]} stroke="#8a8a8a" strokeWidth={1} />)}
      <text x={W / 2} y={oy + rh + 12} fontSize="12" fill="#8a8a8a" textAnchor="middle">{geo.count} viguetas · {(geo.span / 1000).toFixed(2)} m</text>
    </svg>
  )
}
