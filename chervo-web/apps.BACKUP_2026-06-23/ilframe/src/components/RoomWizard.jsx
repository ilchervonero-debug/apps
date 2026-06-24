import { useState } from 'react'
import { useProjectStore, ROOF_TYPES } from '../store/useProjectStore'
import FaceEditor from './FaceEditor'

const FACE_NAMES = ['Norte', 'Este', 'Sur', 'Oeste', 'Interior A', 'Interior B', 'Interior C', 'Interior D']

const inputStyle = {
  width: '100%',
  fontSize: 17,
  fontWeight: 600,
  color: '#222',
  background: '#fff',
  border: '1.5px solid #ccc',
  borderRadius: 14,
  padding: '13px 18px',
  outline: 'none',
  boxSizing: 'border-box',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
}

export default function RoomWizard({ roomId, onDone, onSetActiveFace }) {
  const { rooms, updateRoom, setFace, addOpening, removeOpening, setRoof } = useProjectStore()
  const room = rooms[roomId]
  const [step, setStep] = useState(0)

  if (!room) return null

  const faceCount = room.faceCount || 4
  const totalSteps = faceCount + 2

  function goNext() {
    if (step === 0) { onSetActiveFace(0); setStep(1) }
    else if (step <= faceCount) {
      if (step < faceCount) { onSetActiveFace(step); setStep(step + 1) }
      else { onSetActiveFace(null); setStep(faceCount + 1) }
    }
  }

  function goPrev() {
    if (step === 1) { onSetActiveFace(null); setStep(0) }
    else if (step > 1 && step <= faceCount) { onSetActiveFace(step - 2); setStep(step - 1) }
    else if (step === faceCount + 1) { onSetActiveFace(faceCount - 1); setStep(faceCount) }
  }

  // Paso 0: datos del ambiente
  if (step === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <ProgressBar step={1} total={totalSteps} label="Datos del ambiente" />

        <div>
          <Label>Nombre del ambiente</Label>
          <input
            style={inputStyle}
            value={room.name}
            onChange={e => updateRoom(roomId, { name: e.target.value })}
            placeholder="Sala, Dormitorio, Cocina..."
          />
        </div>

        <div>
          <Label>Cantidad de muros</Label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {[3, 4, 5, 6, 8].map(n => (
              <button key={n}
                onClick={() => updateRoom(roomId, { faceCount: n })}
                style={{
                  flex: 1, height: 52, borderRadius: 14, border: 'none', fontSize: 18, fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s',
                  background: faceCount === n ? '#222' : '#fff',
                  color: faceCount === n ? '#fff' : '#888',
                  boxShadow: faceCount === n ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#aaa', marginTop: 8 }}>Rectangular = 4. Forma en L = 6 u 8.</p>
        </div>

        <BigBtn onClick={goNext}>Continuar — Cara 1</BigBtn>
      </div>
    )
  }

  // Pasos 1..N: caras
  if (step >= 1 && step <= faceCount) {
    const faceIdx = step - 1
    const face = (room.faces || [])[faceIdx] || {}
    const defaultName = FACE_NAMES[faceIdx] || `Cara ${step}`

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ProgressBar step={step + 1} total={totalSteps} label={face.name || defaultName} />

        <div>
          <Label>Nombre de la cara</Label>
          <input style={inputStyle}
            value={face.name ?? defaultName}
            onChange={e => setFace(roomId, faceIdx, { name: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Label>Ancho (mm)</Label>
            <input type="number" step="100" style={inputStyle}
              value={face.width || ''}
              placeholder="3000"
              onChange={e => setFace(roomId, faceIdx, { width: +e.target.value })}
            />
          </div>
          <div>
            <Label>Alto (mm)</Label>
            <input type="number" step="100" style={inputStyle}
              value={face.height || ''}
              placeholder="2400"
              onChange={e => setFace(roomId, faceIdx, { height: +e.target.value })}
            />
          </div>
        </div>

        {face.width && face.height ? (
          <FaceEditor
            face={face}
            onAddOpening={op => addOpening(roomId, faceIdx, op)}
            onRemoveOpening={id => removeOpening(roomId, faceIdx, id)}
          />
        ) : (
          <div style={{ border: '2px dashed #ddd', borderRadius: 16, padding: '28px', textAlign: 'center', color: '#bbb', fontSize: 15 }}>
            Ingresa ancho y alto para ver el diagrama
          </div>
        )}

        <BtnRow onPrev={goPrev} onNext={goNext} nextLabel={step < faceCount ? `Cara ${step + 1}` : 'Techo'} />
      </div>
    )
  }

  // Paso N+1: techo
  if (step === faceCount + 1) {
    const roof = room.roof || {}
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <ProgressBar step={totalSteps} total={totalSteps} label="Techo" />

        <div>
          <Label>Tipo de techo</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            {Object.entries(ROOF_TYPES).map(([k, label]) => (
              <button key={k}
                onClick={() => setRoof(roomId, { type: +k })}
                style={{
                  padding: '14px', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  background: roof.type === +k ? '#222' : '#fff',
                  color: roof.type === +k ? '#fff' : '#666',
                  boxShadow: roof.type === +k ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {roof.type !== 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label>Pendiente — <span style={{ fontFamily: 'monospace', color: '#222', fontSize: 17 }}>{roof.slope_pct || 0}%</span></Label>
              <input type="range" min={0} max={100} step={1}
                value={roof.slope_pct || 0}
                onChange={e => setRoof(roomId, { slope_pct: +e.target.value })}
                style={{ width: '100%', marginTop: 8, accentColor: '#dc2626' }}
              />
            </div>
            <div>
              <Label>Altura cumbrera (mm)</Label>
              <input type="number" step="50" style={inputStyle}
                value={roof.ridge_height || 0}
                onChange={e => setRoof(roomId, { ridge_height: +e.target.value })}
              />
            </div>
          </div>
        )}

        <BtnRow onPrev={goPrev} onNext={onDone} nextLabel="Guardar ambiente" nextRed />
      </div>
    )
  }

  return null
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
      {children}
    </div>
  )
}

function ProgressBar({ step, total, label }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: '#222' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#aaa', background: '#e8e8e8', padding: '3px 12px', borderRadius: 99 }}>{step}/{total}</span>
      </div>
      <div style={{ height: 6, background: '#e0e0e0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#dc2626', borderRadius: 99, width: `${(step / total) * 100}%`, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

function BigBtn({ onClick, children }) {
  return (
    <div style={{ padding: '0 12px' }}>
      <button onClick={onClick} style={{
        width: '100%', padding: '16px', fontSize: 17, fontWeight: 800, color: '#fff',
        background: '#dc2626', border: 'none', borderRadius: 16, cursor: 'pointer',
        boxShadow: '0 3px 12px rgba(220,38,38,0.4)', letterSpacing: '0.01em',
      }}>
        {children}
      </button>
    </div>
  )
}

function BtnRow({ onPrev, onNext, nextLabel, nextRed }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '0 12px' }}>
      <button onClick={onPrev} style={{
        flex: 1, padding: '15px', fontSize: 16, fontWeight: 700, color: '#555',
        background: '#e8e8e8', border: 'none', borderRadius: 16, cursor: 'pointer',
      }}>
        Atras
      </button>
      <button onClick={onNext} style={{
        flex: 2, padding: '15px', fontSize: 16, fontWeight: 800, color: '#fff',
        background: nextRed !== false ? '#dc2626' : '#dc2626', border: 'none', borderRadius: 16, cursor: 'pointer',
        boxShadow: '0 3px 12px rgba(220,38,38,0.35)',
      }}>
        {nextLabel}
      </button>
    </div>
  )
}
