import { useDrawingStore } from '../store/drawingStore'
import { PROFILE_NORMS, PROFILE_SECTIONS } from '../data/profiles'
import { PILAR_ARMADOS, pilarKg, pilarTornillos, pilarFootprint } from '../engine/pilares'

// Hoja del Pilar / Columna armada. En planta se coloca por tap (cuadrado
// gris); acá se define altura, armado (1–4 perfiles) y el perfil. iLStyle.
export default function PilarSheet() {
  const open = useDrawingStore((s) => s.pilarSheet)
  const setOpen = useDrawingStore((s) => s.setPilarSheet)
  const config = useDrawingStore((s) => s.pilarConfig)
  const setConfig = useDrawingStore((s) => s.setPilarConfig)
  const pilares = useDrawingStore((s) => s.pilares)
  const selectedPilarId = useDrawingStore((s) => s.selectedPilarId)
  const updatePilar = useDrawingStore((s) => s.updatePilar)
  const removePilar = useDrawingStore((s) => s.removePilar)

  if (!open) return null

  const pilar = pilares.find((x) => x.id === selectedPilarId)
  const cur = pilar || config
  const patch = (p) => (pilar ? updatePilar(pilar.id, p) : setConfig(p))
  const ref = cur.perfil || { normId: 'cu_1', secIdx: 0 }
  const secs = PROFILE_SECTIONS[ref.normId]?.C || []
  const [fx, fy] = pilarFootprint(cur)

  const cap = { fontSize: 14, fontWeight: 500, color: '#8a8a8a', letterSpacing: '0.03em', textTransform: 'uppercase' }
  const field = { width: '100%', padding: '11px 10px', border: '1px solid #d8d8d8', borderRadius: 10, fontSize: 18, background: '#fff', boxSizing: 'border-box', color: '#1c1c1c' }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 600, borderRadius: '22px 22px 0 0', padding: '8px 0 22px', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: '88dvh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e2e2', margin: '6px auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '0 22px' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: '#1c1c1c' }}>{pilar ? pilar.id : 'Pilar'}</div>
          <div style={{ fontSize: 15, color: '#8a8a8a' }}>{pilar ? 'editar' : 'elegí armado y tocá en planta'}</div>
        </div>

        {/* Armado */}
        <div style={{ padding: '16px 22px 4px', ...cap }}>Armado</div>
        {PILAR_ARMADOS.map((a) => {
          const on = cur.tipoArmado === a.id
          return (
            <button key={a.id} onClick={() => patch({ tipoArmado: a.id })}
              style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', padding: '11px 22px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <ArmadoIcon tipo={a.id} on={on} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 17, fontWeight: 500, color: on ? '#fe0000' : '#1c1c1c' }}>{a.name}</span>
                <span style={{ display: 'block', fontSize: 14, color: '#8a8a8a' }}>{a.desc}</span>
              </span>
            </button>
          )
        })}

        {/* Perfil */}
        <div style={{ padding: '16px 22px 8px', ...cap }}>Perfil</div>
        <div style={{ display: 'flex', gap: 10, padding: '0 22px' }}>
          <select value={ref.normId} onChange={(e) => patch({ perfil: { normId: e.target.value, secIdx: 0 } })} style={{ ...field, flex: 1 }}>
            {PROFILE_NORMS.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          <select value={ref.secIdx} onChange={(e) => patch({ perfil: { ...ref, secIdx: +e.target.value } })} style={{ ...field, flex: 1 }}>
            {secs.map((s, i) => <option key={i} value={i}>{s.h}×{s.w}×{s.t} · {s.kg}kg/m</option>)}
          </select>
        </div>

        {/* Altura */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 22px 0' }}>
          <label style={{ flex: 1 }}>
            <span style={{ display: 'block', marginBottom: 5, ...cap, textTransform: 'none' }}>Altura (m)</span>
            <input type="number" step="0.1" defaultValue={((cur.altura || 2800) / 1000).toFixed(2)} key={(pilar ? pilar.id : 'c') + (cur.altura || 2800)}
              onBlur={(e) => patch({ altura: Math.max(300, Math.round((parseFloat(e.target.value) || 0) * 1000)) })} style={field} />
          </label>
        </div>

        {/* Resumen */}
        <div style={{ padding: '14px 22px 0', fontSize: 15, color: '#6f6f6f' }}>
          Huella ≈ {(fx / 10).toFixed(0)}×{(fy / 10).toFixed(0)} cm · {pilar ? `${pilarKg(cur).toFixed(1)} kg acero · ${pilarTornillos(cur)} tornillos` : 'colocá para computar'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px 0' }}>
          {pilar ? (
            <button onClick={() => { removePilar(pilar.id); setOpen(false) }}
              style={{ background: 'none', border: 'none', color: '#1c1c1c', fontSize: 16, fontWeight: 500, cursor: 'pointer', padding: 0 }}>Borrar pilar</button>
          ) : <span />}
          <button onClick={() => setOpen(false)}
            style={{ background: '#fe0000', border: 'none', color: '#fff', fontSize: 17, fontWeight: 500, borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>
            {pilar ? 'Listo' : 'Colocar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Sección en planta de cada armado (línea fina)
function ArmadoIcon({ tipo, on }) {
  const p = { width: 40, height: 40, viewBox: '0 0 24 24', fill: 'none', stroke: on ? '#fe0000' : '#1c1c1c', strokeWidth: 1, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (tipo === 'SIMPLE') return <svg {...p}><path d="M15 5h-5v14h5" /></svg>
  if (tipo === 'DOBLE_ESPALDA') return <svg {...p}><path d="M8 5h4v14H8" /><path d="M16 5h-4v14h4" /></svg>
  if (tipo === 'DOBLE_CAJON') return <svg {...p}><path d="M7 5h5v14H7" /><path d="M17 5h-5v14h5" /></svg>
  if (tipo === 'TRIPLE') return <svg {...p}><path d="M6 5h3v14H6" /><path d="M13.5 5h-3v14h3" /><path d="M18 5h-3v14h3" /></svg>
  return <svg {...p}><rect x="5" y="6" width="6" height="12" /><rect x="13" y="6" width="6" height="12" /></svg>
}
