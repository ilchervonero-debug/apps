import { useDrawingStore } from '../store/drawingStore'
import { PROFILE_NORMS, PROFILE_SECTIONS } from '../data/profiles'
import { BEAM_TYPES, beamTypeDef, beamKg } from '../engine/beams'

// Hoja inferior: configura la próxima viga (sin selección) o edita la
// viga seleccionada. Mismo patrón visual que el panel iLStorage.
// iLStyle: textos legibles, énfasis por tamaño (no negrita), íconos finos,
// rojo = seleccionado/principal, tinta = secundario, sin rosado.
export default function BeamSheet() {
  const open = useDrawingStore((s) => s.beamSheet)
  const setOpen = useDrawingStore((s) => s.setBeamSheet)
  const config = useDrawingStore((s) => s.beamConfig)
  const setConfig = useDrawingStore((s) => s.setBeamConfig)
  const beams = useDrawingStore((s) => s.beams)
  const selectedBeamId = useDrawingStore((s) => s.selectedBeamId)
  const updateBeam = useDrawingStore((s) => s.updateBeam)
  const removeBeam = useDrawingStore((s) => s.removeBeam)

  if (!open) return null

  const beam = beams.find((b) => b.id === selectedBeamId)
  const cur = beam || config
  const patch = (p) => (beam ? updateBeam(beam.id, p) : setConfig(p))
  const sections = PROFILE_SECTIONS[cur.normId]?.C || []
  const sec = sections[cur.secIdx]

  const cap = { fontSize: 14, fontWeight: 500, color: '#8a8a8a', letterSpacing: '0.04em', textTransform: 'uppercase' }
  const field = { width: '100%', padding: '11px 10px', border: '1px solid #d8d8d8', borderRadius: 10, fontSize: 18, background: '#fff', boxSizing: 'border-box', color: '#1c1c1c' }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 600, borderRadius: '22px 22px 0 0', padding: '8px 0 20px', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: '82dvh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e2e2', margin: '6px auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '0 22px' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: '#1c1c1c' }}>
            {beam ? beam.id : 'Viga'}
          </div>
          <div style={{ fontSize: 15, color: '#8a8a8a' }}>
            {beam ? 'editar' : 'elegí tipo y dibujá en planta'}
          </div>
        </div>

        {/* Tipo */}
        <div style={{ padding: '16px 22px 4px', ...cap }}>Tipo</div>
        {BEAM_TYPES.map((t) => {
          const on = cur.type === t.id
          return (
            <button key={t.id} onClick={() => patch({ type: t.id })}
              style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', padding: '12px 22px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <BeamIcon type={t.id} on={on} />
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
          <select value={cur.normId}
            onChange={(e) => patch({ normId: e.target.value, secIdx: 0 })}
            style={{ ...field, flex: 1 }}>
            {PROFILE_NORMS.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          <select value={cur.secIdx}
            onChange={(e) => patch({ secIdx: +e.target.value })}
            style={{ ...field, flex: 1 }}>
            {sections.map((s, i) => <option key={i} value={i}>{s.h}×{s.w}×{s.t} · {s.kg} kg/m</option>)}
          </select>
        </div>

        {/* Medidas */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 22px 4px' }}>
          {beam && (
            <label style={{ flex: 1 }}>
              <span style={{ display: 'block', marginBottom: 5, ...cap, textTransform: 'none' }}>Luz (mm)</span>
              <input type="number" step={100} defaultValue={beam.span} key={beam.id + beam.span}
                onBlur={(e) => { const v = +e.target.value; if (v > 0) updateBeam(beam.id, { span: v }) }}
                style={field} />
            </label>
          )}
          <label style={{ flex: 1 }}>
            <span style={{ display: 'block', marginBottom: 5, ...cap, textTransform: 'none' }}>Nivel inferior (mm)</span>
            <input type="number" step={100} defaultValue={cur.level} key={(beam ? beam.id : 'cfg') + ':' + cur.level}
              onBlur={(e) => { const v = Math.max(0, +e.target.value || 0); patch({ level: v }) }}
              style={field} />
          </label>
        </div>

        {/* Resumen + acciones */}
        <div style={{ padding: '12px 22px 0', fontSize: 15, color: '#6f6f6f' }}>
          {sec && (
            <>
              Composición: {beamTypeDef(cur.type).nC}×C {sec.h}×{sec.w}×{sec.t}
              {beamTypeDef(cur.type).nU > 0 ? ` + ${beamTypeDef(cur.type).nU}×U envolvente` : ''}
              {beam ? ` · ${beamKg(beam).toFixed(1)} kg acero` : ''}
            </>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px 0' }}>
          {beam ? (
            <button onClick={() => { removeBeam(beam.id); setOpen(false) }}
              style={{ background: 'none', border: 'none', color: '#1c1c1c', fontSize: 16, fontWeight: 500, cursor: 'pointer', padding: 0 }}>
              Borrar viga
            </button>
          ) : <span />}
          <button onClick={() => setOpen(false)}
            style={{ background: '#fe0000', border: 'none', color: '#fff', fontSize: 17, fontWeight: 500, borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>
            {beam ? 'Listo' : 'Dibujar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Sección transversal de cada tipo (icon flat fino, sin emojis)
function BeamIcon({ type, on }) {
  const p = { width: 40, height: 40, viewBox: '0 0 24 24', fill: 'none', stroke: on ? '#fe0000' : '#1c1c1c', strokeWidth: 1, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'simple') return <svg {...p}><path d="M15 4h-5v16h5" /></svg>
  if (type === 'back_to_back') return <svg {...p}><path d="M7 4h4v16H7" /><path d="M17 4h-4v16h4" /></svg>
  if (type === 'box') return <svg {...p}><path d="M6 4h5v16H6" /><path d="M18 4h-5v16h5" /></svg>
  return <svg {...p}><path d="M9 7h3v10H9" /><path d="M15 7h-3v10h3" /><path d="M5 6V3h14v3" /><path d="M5 18v3h14v-3" /></svg>
}
