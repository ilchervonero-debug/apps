import { useDrawingStore } from '../store/drawingStore'
import { CU_NORMS, CU_SECTIONS } from '../data/profiles'
import { CERCHA_TYPES, trussMembers, cerchaKg, defaultRise } from '../engine/trusses'

// Hoja inferior de la Cercha: elegí estilo, perfil y medidas (luz + altura).
// La vista previa dibuja la cercha real; el alzado la muestra a escala.
// iLStyle: textos legibles, énfasis por tamaño, íconos finos, rojo=elegido.
export default function CerchaSheet() {
  const open = useDrawingStore((s) => s.cerchaSheet)
  const setOpen = useDrawingStore((s) => s.setCerchaSheet)
  const config = useDrawingStore((s) => s.cerchaConfig)
  const setConfig = useDrawingStore((s) => s.setCerchaConfig)
  const cerchas = useDrawingStore((s) => s.cerchas)
  const selectedCerchaId = useDrawingStore((s) => s.selectedCerchaId)
  const updateCercha = useDrawingStore((s) => s.updateCercha)
  const removeCercha = useDrawingStore((s) => s.removeCercha)

  if (!open) return null

  const cercha = cerchas.find((c) => c.id === selectedCerchaId)
  const cur = cercha || config
  const patch = (p) => (cercha ? updateCercha(cercha.id, p) : setConfig(p))
  const sections = CU_SECTIONS[cur.normId]?.C || []
  const sec = sections[cur.secIdx]
  const span = cercha ? cercha.span : 6000
  const rise = cur.rise || defaultRise(span)

  const cap = { fontSize: 14, fontWeight: 500, color: '#8a8a8a', letterSpacing: '0.04em', textTransform: 'uppercase' }
  const field = { width: '100%', padding: '11px 10px', border: '1px solid #d8d8d8', borderRadius: 10, fontSize: 18, background: '#fff', boxSizing: 'border-box', color: '#1c1c1c' }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 600, borderRadius: '22px 22px 0 0', padding: '8px 0 20px', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: '86dvh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e2e2', margin: '6px auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '0 22px' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: '#1c1c1c' }}>
            {cercha ? cercha.id : 'Cercha'}
          </div>
          <div style={{ fontSize: 15, color: '#8a8a8a' }}>
            {cercha ? 'editar' : 'elegí estilo y dibujá la luz en planta'}
          </div>
        </div>

        {/* Vista previa del estilo elegido */}
        <div style={{ padding: '12px 22px 0' }}>
          <TrussPreview type={cur.type} span={span} rise={rise} />
        </div>

        {/* Estilo */}
        <div style={{ padding: '14px 22px 4px', ...cap }}>Estilo</div>
        {CERCHA_TYPES.map((t) => {
          const on = cur.type === t.id
          return (
            <button key={t.id} onClick={() => patch({ type: t.id })}
              style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', padding: '12px 22px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <TrussIcon type={t.id} on={on} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 17, fontWeight: 500, color: on ? '#fe0000' : '#1c1c1c' }}>{t.name}</span>
                <span style={{ display: 'block', fontSize: 14, color: '#8a8a8a' }}>{t.desc}</span>
              </span>
            </button>
          )
        })}

        {/* Perfil */}
        <div style={{ padding: '16px 22px 8px', ...cap }}>Perfil C</div>
        <div style={{ display: 'flex', gap: 10, padding: '0 22px' }}>
          <select value={cur.normId} onChange={(e) => patch({ normId: e.target.value, secIdx: 0 })} style={{ ...field, flex: 1 }}>
            {CU_NORMS.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          <select value={cur.secIdx} onChange={(e) => patch({ secIdx: +e.target.value })} style={{ ...field, flex: 1 }}>
            {sections.map((s, i) => <option key={i} value={i}>{s.h}×{s.w}×{s.t} · {s.kg} kg/m</option>)}
          </select>
        </div>

        {/* Medidas */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 22px 4px' }}>
          {cercha && (
            <label style={{ flex: 1 }}>
              <span style={{ display: 'block', marginBottom: 5, ...cap, textTransform: 'none' }}>Luz (mm)</span>
              <input type="number" step={100} defaultValue={cercha.span} key={cercha.id + cercha.span}
                onBlur={(e) => { const v = +e.target.value; if (v > 0) updateCercha(cercha.id, { span: v }) }}
                style={field} />
            </label>
          )}
          <label style={{ flex: 1 }}>
            <span style={{ display: 'block', marginBottom: 5, ...cap, textTransform: 'none' }}>Altura / peralte (mm)</span>
            <input type="number" step={100} defaultValue={rise} key={(cercha ? cercha.id : 'cfg') + ':' + rise}
              onBlur={(e) => { const v = Math.max(100, +e.target.value || 0); patch({ rise: v }) }}
              style={field} />
          </label>
        </div>

        {/* Resumen + acciones */}
        <div style={{ padding: '12px 22px 0', fontSize: 15, color: '#6f6f6f' }}>
          {sec && (
            <>Perfil C {sec.h}×{sec.w}×{sec.t}
              {cercha ? ` · luz ${(span / 1000).toFixed(2)} m · alto ${(rise / 1000).toFixed(2)} m · ${cerchaKg({ ...cur, span, rise }).toFixed(1)} kg acero` : ''}
            </>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px 0' }}>
          {cercha ? (
            <button onClick={() => { removeCercha(cercha.id); setOpen(false) }}
              style={{ background: 'none', border: 'none', color: '#1c1c1c', fontSize: 16, fontWeight: 500, cursor: 'pointer', padding: 0 }}>
              Borrar cercha
            </button>
          ) : <span />}
          <button onClick={() => setOpen(false)}
            style={{ background: '#fe0000', border: 'none', color: '#fff', fontSize: 17, fontWeight: 500, borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>
            {cercha ? 'Listo' : 'Dibujar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Vista previa a escala de la cercha (misma geometría que el alzado)
function TrussPreview({ type, span, rise }) {
  const W = 556, H = 150, pad = 22
  const ms = trussMembers(type, span, rise)
  const s = Math.min((W - pad * 2) / span, (H - pad * 2) / Math.max(rise, 1))
  const ox = pad, oy = H - pad
  const tx = ([x, y]) => [ox + x * s, oy - y * s]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', background: '#fafafa', border: '1px solid #ececec', borderRadius: 12 }}>
      {ms.map(([a, b], i) => {
        const p = tx(a), q = tx(b)
        return <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#fe0000" strokeWidth={1.4} strokeLinecap="round" />
      })}
    </svg>
  )
}

// Icono chico del estilo (línea fina, sin emojis)
function TrussIcon({ type, on }) {
  const p = { width: 40, height: 40, viewBox: '0 0 40 26', fill: 'none', stroke: on ? '#fe0000' : '#1c1c1c', strokeWidth: 1, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const ms = trussMembers(type, 36, 20)
  const s = Math.min(36 / 36, 22 / 20)
  const ox = 2, oy = 24
  const tx = ([x, y]) => [ox + x * s, oy - y * s]
  return (
    <svg {...p}>
      {ms.map(([a, b], i) => { const u = tx(a), v = tx(b); return <line key={i} x1={u[0]} y1={u[1]} x2={v[0]} y2={v[1]} /> })}
    </svg>
  )
}
