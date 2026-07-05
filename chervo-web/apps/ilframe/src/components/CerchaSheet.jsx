import { useDrawingStore } from '../store/drawingStore'
import { PROFILE_NORMS, PROFILE_SECTIONS } from '../data/profiles'
import { CERCHA_TYPES, RETI_PATRONES, trussGeometry, cerchaKg, defaultRise } from '../engine/trusses'

// Hoja paramétrica de la Cercha (spec iLFrame): modelo + geometría del alzado
// (pico, altura, apoyos) + retícula (divisiones) + 3 perfiles (superior/inferior/
// retícula). Preview en vivo y alertas estructurales. iLStyle: legible, sin negrita
// en bloque, sin rosado; el rojo marca lo seleccionado y las alertas.
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
  const span = cercha ? cercha.span : 8400
  const pico = cur.pico ?? Math.round(span / 2)
  const rise = cur.rise ?? defaultRise(span)
  const geo = trussGeometry({ ...cur, span, pico, rise })

  const cap = { fontSize: 14, fontWeight: 500, color: '#8a8a8a', letterSpacing: '0.03em' }
  const field = { width: '100%', padding: '11px 10px', border: '1px solid #d8d8d8', borderRadius: 10, fontSize: 18, background: '#fff', boxSizing: 'border-box', color: '#1c1c1c' }
  const mono = cur.modelo === 'UN_AGUA'
  const recta = cur.modelo === 'RECTA'

  // input en metros ↔ mm
  const numM = (label, value, onSet, opts = {}) => (
    <label style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'block', marginBottom: 5, ...cap }}>{label}</span>
      <input type="number" step="0.1" defaultValue={(value / 1000).toFixed(2)} key={(cercha ? cercha.id : 'c') + label + value}
        disabled={opts.disabled}
        onBlur={(e) => { const v = Math.round((parseFloat(e.target.value) || 0) * 1000); onSet(opts.clampMax ? Math.min(opts.clampMax, Math.max(opts.clampMin || 0, v)) : Math.max(opts.clampMin || 0, v)) }}
        style={{ ...field, ...(opts.disabled ? { background: '#efefef', color: '#9a9a9a' } : {}) }} />
    </label>
  )

  const perfilSel = (label, key) => {
    const ref = cur[key] || { normId: 'cu_1', secIdx: 0 }
    const secs = PROFILE_SECTIONS[ref.normId]?.C || []
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ ...cap, marginBottom: 5 }}>{label}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={ref.normId} onChange={(e) => patch({ [key]: { normId: e.target.value, secIdx: 0 } })} style={{ ...field, flex: 1 }}>
            {PROFILE_NORMS.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          <select value={ref.secIdx} onChange={(e) => patch({ [key]: { ...ref, secIdx: +e.target.value } })} style={{ ...field, flex: 1 }}>
            {secs.map((s, i) => <option key={i} value={i}>{s.h}×{s.w}×{s.t} · {s.kg}kg/m</option>)}
          </select>
        </div>
      </div>
    )
  }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 600, borderRadius: '22px 22px 0 0', padding: '8px 0 22px', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e2e2', margin: '6px auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '0 22px' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: '#1c1c1c' }}>{cercha ? cercha.id : 'Cercha'}</div>
          <div style={{ fontSize: 15, color: '#8a8a8a' }}>{cercha ? 'parametrizá el alzado' : 'elegí y dibujá la luz en planta'}</div>
        </div>

        {/* Preview en vivo */}
        <div style={{ padding: '12px 22px 0' }}>
          <TrussPreview geo={geo} span={span} rise={rise} />
        </div>

        {/* Alertas estructurales (borde rojo, sin rosado) */}
        {geo.alerts.length > 0 && (
          <div style={{ margin: '12px 22px 0', border: '1px solid #fe0000', borderRadius: 12, padding: '10px 14px' }}>
            {geo.alerts.map((a, i) => (
              <div key={i} style={{ fontSize: 15, color: '#fe0000', lineHeight: 1.35 }}>{a}</div>
            ))}
          </div>
        )}

        {/* Modelo */}
        <div style={{ padding: '16px 22px 4px', ...cap, textTransform: 'uppercase' }}>Modelo de retícula</div>
        {CERCHA_TYPES.map((t) => {
          const on = cur.modelo === t.id
          return (
            <button key={t.id} onClick={() => patch({ modelo: t.id })}
              style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', padding: '11px 22px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <TrussIcon modelo={t.id} on={on} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 17, fontWeight: 500, color: on ? '#fe0000' : '#1c1c1c' }}>{t.name}</span>
                <span style={{ display: 'block', fontSize: 14, color: '#8a8a8a' }}>{t.desc}</span>
              </span>
            </button>
          )
        })}

        {/* Traviesas (retícula) — solo para la reticulada recta */}
        {recta && (
          <>
            <div style={{ padding: '14px 22px 8px', ...cap, textTransform: 'uppercase' }}>Traviesas</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 22px' }}>
              {RETI_PATRONES.map((r) => {
                const on = (cur.patron || 'DA') === r.id
                return (
                  <button key={r.id} onClick={() => patch({ patron: r.id })} title={r.desc}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 10px', borderRadius: 12, cursor: 'pointer',
                      border: '1px solid', borderColor: on ? '#fe0000' : '#d8d8d8', background: '#fff' }}>
                    <PatronIcon patron={r.id} vert={cur.verticales !== false} on={on} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: on ? '#fe0000' : '#1c1c1c' }}>{r.name}</span>
                  </button>
                )
              })}
            </div>
            {/* Verticales como agregado independiente a cualquier patrón */}
            <div style={{ padding: '10px 22px 0' }}>
              <button onClick={() => patch({ verticales: cur.verticales === false })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, cursor: 'pointer', width: '100%', textAlign: 'left',
                  border: '1px solid', borderColor: cur.verticales !== false ? '#fe0000' : '#d8d8d8', background: '#fff' }}>
                <span style={{ width: 20, height: 20, borderRadius: 5, background: cur.verticales !== false ? '#fe0000' : '#e8e8e8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{cur.verticales !== false ? '✓' : ''}</span>
                <span style={{ fontSize: 16, fontWeight: 500, color: '#1c1c1c' }}>Sumar montantes (verticales)</span>
              </button>
            </div>
          </>
        )}

        {/* Geometría del alzado */}
        <div style={{ padding: '16px 22px 6px', ...cap, textTransform: 'uppercase' }}>{recta ? 'Medidas' : 'Silueta (alzado)'}</div>
        <div style={{ display: 'flex', gap: 10, padding: '0 22px 10px' }}>
          {numM('Luz (m)', span, (v) => cercha && updateCercha(cercha.id, { span: v }), { disabled: !cercha, clampMin: 500 })}
          {numM(recta ? 'Canto (m)' : 'Altura pico (m)', rise, (v) => patch({ rise: v }), { clampMin: 100 })}
        </div>
        {!recta && (
          <div style={{ display: 'flex', gap: 10, padding: '0 22px' }}>
            {numM('Pico X (m)', pico, (v) => patch({ pico: v }), { disabled: mono, clampMax: span })}
            {numM('Apoyo izq (m)', cur.hIzq || 0, (v) => patch({ hIzq: v }))}
            {numM('Apoyo der (m)', cur.hDer || 0, (v) => patch({ hDer: v }))}
          </div>
        )}

        {/* Retícula */}
        <div style={{ display: 'flex', gap: 10, padding: '14px 22px 0', alignItems: 'flex-end' }}>
          <label style={{ flex: 1 }}>
            <span style={{ display: 'block', marginBottom: 5, ...cap }}>Divisiones (nudos inf.)</span>
            <input type="number" step="1" defaultValue={cur.divisiones || 6} key={(cercha ? cercha.id : 'c') + 'div' + (cur.divisiones || 6)}
              onBlur={(e) => patch({ divisiones: Math.max(2, parseInt(e.target.value) || 6) })} style={field} />
          </label>
          <div style={{ flex: 1, fontSize: 14, color: '#6f6f6f', paddingBottom: 12 }}>
            nudo cada {(geo.sepNudo / 1000).toFixed(2)} m · {geo.angL.toFixed(0)}°/{geo.angR.toFixed(0)}°
          </div>
        </div>

        {/* Perfiles por cordón */}
        <div style={{ padding: '16px 22px 2px', ...cap, textTransform: 'uppercase' }}>Perfiles</div>
        <div style={{ padding: '0 22px' }}>
          {perfilSel('Cordón superior', 'perfilSuperior')}
          {perfilSel('Cordón inferior', 'perfilInferior')}
          {perfilSel('Retícula (alma)', 'perfilReticula')}
        </div>

        {/* Resumen + acciones */}
        <div style={{ padding: '14px 22px 0', fontSize: 15, color: '#6f6f6f' }}>
          {cercha ? `Luz ${(span / 1000).toFixed(2)} m · sup ${(geo.lens.sup / 1000).toFixed(2)} + inf ${(geo.lens.inf / 1000).toFixed(2)} + alma ${(geo.lens.web / 1000).toFixed(2)} ml · ${cerchaKg({ ...cur, span, pico, rise }).toFixed(1)} kg acero` : 'Dibujá la luz en planta para computar el acero'}
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

// Vista previa a escala (misma geometría que el alzado grande)
function TrussPreview({ geo, span, rise }) {
  const W = 556, H = 190, pad = 26
  const maxY = Math.max(rise, 1)
  const s = Math.min((W - pad * 2) / span, (H - pad * 2) / maxY)
  const ox = (W - span * s) / 2, oy = H - pad
  const tx = ([x, y]) => [ox + x * s, oy - y * s]
  const line = (m) => { const p = tx(m[0]), q = tx(m[1]); return `M${p[0]} ${p[1]} L${q[0]} ${q[1]}` }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', background: '#fafafa', border: '1px solid #ececec', borderRadius: 12 }}>
      {geo.web.map((m, i) => <path key={'w' + i} d={line(m)} stroke="#9a9a9a" strokeWidth={1.2} fill="none" strokeLinecap="round" />)}
      {geo.chordBot.map((m, i) => <path key={'b' + i} d={line(m)} stroke="#fe0000" strokeWidth={1.8} fill="none" strokeLinecap="round" />)}
      {geo.chordTop.map((m, i) => <path key={'t' + i} d={line(m)} stroke="#fe0000" strokeWidth={1.8} fill="none" strokeLinecap="round" />)}
    </svg>
  )
}

// Icono chico del patrón de traviesas (reticulada recta)
function PatronIcon({ patron, on, vert = true }) {
  const geo = trussGeometry({ span: 3600, rise: 1200, divisiones: 4, modelo: 'RECTA', patron, verticales: vert })
  const s = Math.min(34 / 3600, 18 / 1200), ox = 3, oy = 21
  const tx = ([x, y]) => [ox + x * s, oy - y * s]
  const seg = (m, i, extra) => { const p = tx(m[0]), q = tx(m[1]); return <line key={extra + i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} /> }
  const col = on ? '#fe0000' : '#1c1c1c'
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke={col} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      {geo.web.map((m, i) => seg(m, i, 'w'))}
      {geo.chordBot.map((m, i) => seg(m, i, 'b'))}
      {geo.chordTop.map((m, i) => seg(m, i, 't'))}
    </svg>
  )
}

// Icono chico del modelo
function TrussIcon({ modelo, on }) {
  const geo = trussGeometry({ span: 3600, pico: modelo === 'UN_AGUA' ? 3600 : 1800, rise: 1400, divisiones: 4, modelo })
  const s = Math.min(36 / 3600, 22 / 1400), ox = 2, oy = 24
  const tx = ([x, y]) => [ox + x * s, oy - y * s]
  const seg = (m) => { const p = tx(m[0]), q = tx(m[1]); return <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} /> }
  const col = on ? '#fe0000' : '#1c1c1c'
  return (
    <svg width="40" height="40" viewBox="0 0 40 26" fill="none" stroke={col} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      {geo.web.map((m, i) => <g key={'w' + i} opacity="0.7">{seg(m)}</g>)}
      {geo.chordBot.map((m, i) => <g key={'b' + i}>{seg(m)}</g>)}
      {geo.chordTop.map((m, i) => <g key={'t' + i}>{seg(m)}</g>)}
    </svg>
  )
}
