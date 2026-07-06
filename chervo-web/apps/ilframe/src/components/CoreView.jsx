import { useState } from 'react'
import { useDrawingStore } from '../store/drawingStore'

// Core GLOBAL de la página principal (no del proyecto): aportes/impuestos y
// costos de materiales. Compartido por todos los proyectos. El '+' va al
// final de cada lista. Arranca vacío: Ángel carga todo.
export default function CoreView() {
  const core = useDrawingStore((s) => s.core)
  const addCoreItem = useDrawingStore((s) => s.addCoreItem)
  const updateCoreItem = useDrawingStore((s) => s.updateCoreItem)
  const removeCoreItem = useDrawingStore((s) => s.removeCoreItem)
  const [tab, setTab] = useState('aportes')

  const tabs = [['aportes', 'Aportes e impuestos'], ['materiales', 'Costos de materiales']]

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#f7f7f8' }}>
      {/* Pestañas del Core */}
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid #e0e0e0', background: '#fff' }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, padding: '14px 10px', border: 'none', cursor: 'pointer', background: 'none', fontSize: 15, whiteSpace: 'nowrap',
              color: tab === id ? '#fe0000' : '#999', borderBottom: tab === id ? '3px solid #fe0000' : '3px solid transparent' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 40px' }}>
        <div style={{ maxWidth: 580, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 15, color: '#8a8a8a', lineHeight: 1.4, padding: '0 4px 4px' }}>
            {tab === 'aportes'
              ? 'Aportes e impuestos que se aplican al costo de la obra (porcentaje). Valen para todos los proyectos.'
              : 'Precio de cada material por unidad. Vale para todos los proyectos; el cómputo lo usa para valorizar.'}
          </div>

          {(core[tab] || []).length === 0 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px 16px', textAlign: 'center', color: '#9a9a9a', fontSize: 16 }}>
              Nada cargado — tocá <span style={{ color: '#fe0000' }}>+</span> para agregar
            </div>
          )}

          {(core[tab] || []).map((it) => tab === 'aportes'
            ? <AporteRow key={it.id} it={it} onUp={(p) => updateCoreItem('aportes', it.id, p)} onDel={() => removeCoreItem('aportes', it.id)} />
            : <MaterialRow key={it.id} it={it} onUp={(p) => updateCoreItem('materiales', it.id, p)} onDel={() => removeCoreItem('materiales', it.id)} />,
          )}

          <button onClick={() => addCoreItem(tab)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', marginTop: 4, borderRadius: 12, border: '1.5px dashed #fe0000', background: '#fff', color: '#fe0000', fontSize: 16, cursor: 'pointer' }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> {tab === 'aportes' ? 'Agregar aporte / impuesto' : 'Agregar material'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AporteRow({ it, onUp, onDel }) {
  return (
    <div style={card}>
      <input value={it.name} onChange={(e) => onUp({ name: e.target.value })} placeholder="Ej: IVA, aportes, sellado…" style={{ ...inp, flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="number" value={it.pct} onChange={(e) => onUp({ pct: +e.target.value })} style={{ ...inp, width: 84, textAlign: 'right' }} />
        <span style={{ fontSize: 17, color: '#8a8a8a' }}>%</span>
      </div>
      <button onClick={onDel} style={delBtn}>×</button>
    </div>
  )
}

function MaterialRow({ it, onUp, onDel }) {
  return (
    <div style={{ ...card, flexWrap: 'wrap' }}>
      <input value={it.name} onChange={(e) => onUp({ name: e.target.value })} placeholder="Material" style={{ ...inp, flex: '1 1 140px' }} />
      <input value={it.unit} onChange={(e) => onUp({ unit: e.target.value })} placeholder="u" style={{ ...inp, width: 64, textAlign: 'center' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 17, color: '#8a8a8a' }}>$</span>
        <input type="number" value={it.price} onChange={(e) => onUp({ price: +e.target.value })} style={{ ...inp, width: 110, textAlign: 'right' }} />
      </div>
      <button onClick={onDel} style={delBtn}>×</button>
    </div>
  )
}

const card = { background: '#fff', borderRadius: 16, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10 }
const inp = { padding: '11px 12px', fontSize: 16, color: '#222', background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }
const delBtn = { border: '1.5px solid #e6e6e6', background: '#fff', color: '#1c1c1c', borderRadius: 8, width: 38, height: 38, fontSize: 18, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }
