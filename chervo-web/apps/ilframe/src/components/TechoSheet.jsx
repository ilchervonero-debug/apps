import { useDrawingStore } from '../store/drawingStore'
import { PROFILE_NORMS, PROFILE_SECTIONS } from '../data/profiles'
import { ROOF_FORMAS, CHAPA_TIPOS, roofGeometry, roofDims, chapaM2, clavadorMl, clavadorKg } from '../engine/roofs'

// Hoja de la Cubierta: forma, altura, aleros, clavadores, chapa y el
// toggle "limitar muros". iLStyle.
export default function TechoSheet() {
  const open = useDrawingStore((s) => s.techoSheet)
  const setOpen = useDrawingStore((s) => s.setTechoSheet)
  const config = useDrawingStore((s) => s.techoConfig)
  const setConfig = useDrawingStore((s) => s.setTechoConfig)
  const techos = useDrawingStore((s) => s.techos)
  const selectedTechoId = useDrawingStore((s) => s.selectedTechoId)
  const updateTecho = useDrawingStore((s) => s.updateTecho)
  const removeTecho = useDrawingStore((s) => s.removeTecho)

  if (!open) return null

  const techo = techos.find((t) => t.id === selectedTechoId)
  const cur = techo || config
  const patch = (p) => (techo ? updateTecho(techo.id, p) : setConfig(p))
  const dims = techo ? roofDims(techo) : { w: 6000, d: 8000 }
  const geo = techo ? roofGeometry(techo) : roofGeometry({ ...cur, a: [0, 0], b: [dims.w, dims.d] })

  const cap = { fontSize: 14, fontWeight: 500, color: '#8a8a8a', letterSpacing: '0.03em', textTransform: 'uppercase' }
  const field = { width: '100%', padding: '11px 10px', border: '1px solid #d8d8d8', borderRadius: 10, fontSize: 18, background: '#fff', boxSizing: 'border-box', color: '#1c1c1c' }

  const setDim = (which, v) => { // edita luz/largo moviendo la esquina b
    if (!techo) return
    const a = techo.a, b = [...techo.b]
    if (which === 'w') b[0] = a[0] + Math.sign(b[0] - a[0] || 1) * v
    else b[1] = a[1] + Math.sign(b[1] - a[1] || 1) * v
    updateTecho(techo.id, { b })
  }
  const numM = (label, value, onSet, opts = {}) => (
    <label style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'block', marginBottom: 5, ...cap, textTransform: 'none' }}>{label}</span>
      <input type="number" step="0.1" defaultValue={(value / 1000).toFixed(2)} key={(techo ? techo.id : 'c') + label + value} disabled={opts.disabled}
        onBlur={(e) => onSet(Math.max(opts.min || 0, Math.round((parseFloat(e.target.value) || 0) * 1000)))}
        style={{ ...field, ...(opts.disabled ? { background: '#efefef', color: '#9a9a9a' } : {}) }} />
    </label>
  )
  const al = cur.aleros || { frente: 0, fondo: 0, izq: 0, der: 0 }
  const setAlero = (k, v) => patch({ aleros: { ...al, [k]: v } })

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 600, borderRadius: '22px 22px 0 0', padding: '8px 0 22px', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e2e2', margin: '6px auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '0 22px' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: '#1c1c1c' }}>{techo ? techo.id : 'Techo'}</div>
          <div style={{ fontSize: 15, color: '#8a8a8a' }}>{techo ? 'parametrizá la cubierta' : 'arrastrá el rectángulo en planta'}</div>
        </div>

        {/* Preview de sección */}
        <div style={{ padding: '12px 22px 0' }}><RoofPreview cur={cur} dims={dims} /></div>

        {geo.alerts.length > 0 && (
          <div style={{ margin: '12px 22px 0', border: '1px solid #fe0000', borderRadius: 12, padding: '10px 14px' }}>
            {geo.alerts.map((a, i) => <div key={i} style={{ fontSize: 15, color: '#fe0000', lineHeight: 1.35 }}>{a}</div>)}
          </div>
        )}

        {/* Forma */}
        <div style={{ padding: '16px 22px 4px', ...cap }}>Forma</div>
        {ROOF_FORMAS.map((f) => {
          const on = (cur.forma || 'DOS_AGUAS') === f.id
          return (
            <button key={f.id} onClick={() => patch({ forma: f.id })}
              style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', padding: '11px 22px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <FormaIcon forma={f.id} on={on} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 17, fontWeight: 500, color: on ? '#fe0000' : '#1c1c1c' }}>{f.name}</span>
                <span style={{ display: 'block', fontSize: 14, color: '#8a8a8a' }}>{f.desc}</span>
              </span>
            </button>
          )
        })}

        {/* Medidas */}
        <div style={{ padding: '16px 22px 6px', ...cap }}>Medidas</div>
        <div style={{ display: 'flex', gap: 10, padding: '0 22px 10px' }}>
          {numM('Luz / ancho (m)', dims.w, (v) => setDim('w', Math.max(1000, v)), { disabled: !techo, min: 1000 })}
          {numM('Largo / fondo (m)', dims.d, (v) => setDim('d', Math.max(1000, v)), { disabled: !techo, min: 1000 })}
          {numM('Altura cumbrera (m)', cur.alturaPico || 1500, (v) => patch({ alturaPico: Math.max(100, v) }), { min: 100 })}
        </div>

        {/* Aleros */}
        <div style={{ padding: '10px 22px 6px', ...cap }}>Aleros / voladizos</div>
        <div style={{ display: 'flex', gap: 8, padding: '0 22px' }}>
          {[['frente', 'Frente'], ['fondo', 'Fondo'], ['izq', 'Izq'], ['der', 'Der']].map(([k, lbl]) => numM(lbl + ' (m)', al[k] || 0, (v) => setAlero(k, v)))}
        </div>

        {/* Clavadores + chapa */}
        <div style={{ padding: '14px 22px 6px', ...cap }}>Clavadores y chapa</div>
        <div style={{ display: 'flex', gap: 10, padding: '0 22px 8px' }}>
          {numM('Separación (m)', cur.clavadorSep || 600, (v) => patch({ clavadorSep: Math.max(200, v) }), { min: 200 })}
          <label style={{ flex: 1 }}>
            <span style={{ display: 'block', marginBottom: 5, ...cap, textTransform: 'none' }}>Chapa</span>
            <select value={cur.tipoChapa || 'TRAPEZOIDAL'} onChange={(e) => patch({ tipoChapa: e.target.value })} style={field}>
              {CHAPA_TIPOS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div style={{ padding: '0 22px' }}>
          <div style={{ ...cap, marginBottom: 5 }}>Perfil del clavador</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={(cur.perfilClavador || {}).normId || 'cu_1'} onChange={(e) => patch({ perfilClavador: { normId: e.target.value, secIdx: 0 } })} style={{ ...field, flex: 1 }}>
              {PROFILE_NORMS.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
            <select value={(cur.perfilClavador || {}).secIdx ?? 0} onChange={(e) => patch({ perfilClavador: { ...(cur.perfilClavador || { normId: 'cu_1' }), secIdx: +e.target.value } })} style={{ ...field, flex: 1 }}>
              {(PROFILE_SECTIONS[(cur.perfilClavador || {}).normId || 'cu_1']?.C || []).map((s, i) => <option key={i} value={i}>{s.h}×{s.w}×{s.t} · {s.kg}kg/m</option>)}
            </select>
          </div>
        </div>

        {/* Limitar muros */}
        <div style={{ padding: '14px 22px 0' }}>
          <button onClick={() => patch({ esLimitador: !cur.esLimitador })}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, cursor: 'pointer', width: '100%', textAlign: 'left',
              border: '1px solid', borderColor: cur.esLimitador ? '#fe0000' : '#d8d8d8', background: '#fff' }}>
            <span style={{ width: 20, height: 20, borderRadius: 5, background: cur.esLimitador ? '#fe0000' : '#e8e8e8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{cur.esLimitador ? '✓' : ''}</span>
            <span style={{ fontSize: 16, fontWeight: 500, color: '#1c1c1c' }}>Limitar muros a la pendiente del techo</span>
          </button>
        </div>

        {/* Resumen */}
        <div style={{ padding: '14px 22px 0', fontSize: 15, color: '#6f6f6f' }}>
          {techo ? `Proyección ${(geo.totalW / 1000).toFixed(2)}×${(geo.totalD / 1000).toFixed(2)} m · pend ${geo.ang.toFixed(0)}° · ${chapaM2(techo).toFixed(1)} m² chapa · clavadores ${clavadorMl(techo).toFixed(1)} ml (${clavadorKg(techo).toFixed(1)} kg)` : 'Dibujá el rectángulo en planta para computar'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px 0' }}>
          {techo ? (
            <button onClick={() => { removeTecho(techo.id); setOpen(false) }}
              style={{ background: 'none', border: 'none', color: '#1c1c1c', fontSize: 16, fontWeight: 500, cursor: 'pointer', padding: 0 }}>Borrar techo</button>
          ) : <span />}
          <button onClick={() => setOpen(false)}
            style={{ background: '#fe0000', border: 'none', color: '#fff', fontSize: 17, fontWeight: 500, borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>
            {techo ? 'Listo' : 'Dibujar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Sección transversal del techo (perfil de la pendiente)
function RoofPreview({ cur, dims }) {
  const W = 556, H = 150, pad = 24
  const al = cur.aleros || {}
  const totalW = dims.w + (al.izq || 0) + (al.der || 0)
  const Hp = cur.alturaPico || 1500
  const s = Math.min((W - pad * 2) / totalW, (H - pad * 2) / Hp)
  const ox = (W - totalW * s) / 2, oy = H - pad
  const tx = ([x, y]) => [ox + x * s, oy - y * s]
  let pts
  if ((cur.forma || 'DOS_AGUAS') === 'UN_AGUA') pts = [[0, 0], [totalW, Hp]]
  else pts = [[0, 0], [totalW / 2, Hp], [totalW, 0]]
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${tx(p)[0]} ${tx(p)[1]}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', background: '#fafafa', border: '1px solid #ececec', borderRadius: 12 }}>
      <line x1={tx([0, 0])[0]} y1={oy} x2={tx([totalW, 0])[0]} y2={oy} stroke="#bbb" strokeWidth={1} strokeDasharray="5 5" />
      <path d={d} stroke="#fe0000" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FormaIcon({ forma, on }) {
  const p = { width: 40, height: 40, viewBox: '0 0 24 24', fill: 'none', stroke: on ? '#fe0000' : '#1c1c1c', strokeWidth: 1, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (forma === 'UN_AGUA') return <svg {...p}><path d="M4 17 20 7" /><path d="M4 17h16" /></svg>
  if (forma === 'CUATRO_AGUAS') return <svg {...p}><path d="M4 16 12 8l8 8" /><path d="M4 16h16" /><path d="M12 8 8 16" /><path d="M12 8 16 16" /></svg>
  return <svg {...p}><path d="M4 16 12 8l8 8" /><path d="M4 16h16" /></svg>
}
