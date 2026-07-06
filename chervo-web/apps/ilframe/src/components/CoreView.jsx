import { useState } from 'react'
import { useDrawingStore } from '../store/drawingStore'
import { GRUPOS_APU } from '../engine/costo'

// Core GLOBAL de la página principal (no del proyecto): acá se arma el APU
// real — mano de obra (SUNCA) + leyes sociales (BPS) + rendimiento por tipo
// de elemento + precio de materiales + aportes/impuestos. Compartido por
// todos los proyectos. El cómputo (cantidades) sale del dibujo de cada
// proyecto; esto solo lo valoriza.
export default function CoreView() {
  const core = useDrawingStore((s) => s.core)
  const addCoreItem = useDrawingStore((s) => s.addCoreItem)
  const updateCoreItem = useDrawingStore((s) => s.updateCoreItem)
  const removeCoreItem = useDrawingStore((s) => s.removeCoreItem)
  const setLeyesSociales = useDrawingStore((s) => s.setLeyesSociales)
  const setRendimiento = useDrawingStore((s) => s.setRendimiento)
  const [tab, setTab] = useState('manoObra')

  const tabs = [
    ['manoObra', 'Mano de obra'],
    ['rendimientos', 'Rendimientos'],
    ['materiales', 'Materiales'],
    ['aportes', 'Aportes e impuestos'],
  ]

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#f7f7f8' }}>
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid #e0e0e0', background: '#fff', overflowX: 'auto' }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: '1 0 auto', minWidth: 110, padding: '14px 10px', border: 'none', cursor: 'pointer', background: 'none', fontSize: 15, whiteSpace: 'nowrap',
              color: tab === id ? '#fe0000' : '#999', borderBottom: tab === id ? '3px solid #fe0000' : '3px solid transparent' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 40px' }}>
        <div style={{ maxWidth: 580, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {tab === 'manoObra' && (
            <ManoObraTab core={core} addCoreItem={addCoreItem} updateCoreItem={updateCoreItem} removeCoreItem={removeCoreItem} setLeyesSociales={setLeyesSociales} />
          )}
          {tab === 'rendimientos' && (
            <RendimientosTab core={core} setRendimiento={setRendimiento} />
          )}
          {tab === 'materiales' && (
            <MaterialesTab core={core} addCoreItem={addCoreItem} updateCoreItem={updateCoreItem} removeCoreItem={removeCoreItem} />
          )}
          {tab === 'aportes' && (
            <AportesTab core={core} addCoreItem={addCoreItem} updateCoreItem={updateCoreItem} removeCoreItem={removeCoreItem} />
          )}
        </div>
      </div>
    </div>
  )
}

function ManoObraTab({ core, addCoreItem, updateCoreItem, removeCoreItem, setLeyesSociales }) {
  const cats = core.manoObra || []
  return (
    <>
      <div style={{ fontSize: 15, color: '#8a8a8a', lineHeight: 1.4, padding: '0 4px 4px' }}>
        Jornal por categoría (laudo SUNCA, Grupo 9 · Industria de la Construcción). Vale para todos los proyectos.
      </div>

      <div style={typeCard}>
        <div>
          <div style={{ fontSize: 16, color: '#1c1c1c' }}>Leyes sociales (BPS · Ley 14.411)</div>
          <div style={{ fontSize: 14, color: '#9a9a9a', marginTop: 4, lineHeight: 1.4 }}>
            Monto imponible 85% de la mano de obra × 83% de aporte ≈ 70,55% adicional sobre el jornal.
            Valor de partida — ajustalo con la planilla SUNCA/BPS vigente.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input value={core.leyesSocialesPct} type="number" onChange={(e) => setLeyesSociales(e.target.value)}
            style={{ ...inp, width: 100, textAlign: 'right' }} />
          <span style={{ fontSize: 16, color: '#8a8a8a' }}>% adicional sobre el jornal</span>
        </div>
      </div>

      <div style={{ fontSize: 14, color: '#9a9a9a', margin: '10px 4px 0' }}>Categorías</div>

      {cats.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 16px', textAlign: 'center', color: '#9a9a9a', fontSize: 16 }}>
          Nada cargado — tocá <span style={{ color: '#fe0000' }}>+</span> para agregar
        </div>
      )}

      {cats.map((it) => (
        <div key={it.id} style={card}>
          <input value={it.name} onChange={(e) => updateCoreItem('manoObra', it.id, { name: e.target.value })}
            placeholder="Ej: Oficial, Medio oficial, Peón…" style={{ ...inp, flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 17, color: '#8a8a8a' }}>$</span>
            <input type="number" value={it.jornal} onChange={(e) => updateCoreItem('manoObra', it.id, { jornal: +e.target.value })}
              style={{ ...inp, width: 110, textAlign: 'right' }} />
          </div>
          <button onClick={() => removeCoreItem('manoObra', it.id)} style={delBtn}>×</button>
        </div>
      ))}

      <AddBtn label="Agregar categoría" onClick={() => addCoreItem('manoObra')} />
    </>
  )
}

function RendimientosTab({ core, setRendimiento }) {
  const cats = core.manoObra || []
  const rend = core.rendimientos || {}
  return (
    <>
      <div style={{ fontSize: 15, color: '#8a8a8a', lineHeight: 1.4, padding: '0 4px 4px' }}>
        Cuánto se monta por jornal, en cada tipo de elemento. El costo de mano de obra sale de cantidad ÷ rendimiento × jornal (con leyes sociales).
      </div>

      {cats.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 16px', textAlign: 'center', color: '#9a9a9a', fontSize: 15, lineHeight: 1.4 }}>
          Cargá primero categorías en <span style={{ color: '#fe0000' }}>Mano de obra</span> para poder asignarlas acá.
        </div>
      )}

      {GRUPOS_APU.map((g) => {
        const r = rend[g.tipo] || {}
        return (
          <div key={g.tipo} style={typeCard}>
            <div style={{ fontSize: 16, color: '#1c1c1c' }}>{g.label}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={r.manoObraId || ''} onChange={(e) => setRendimiento(g.tipo, { manoObraId: e.target.value })}
                disabled={!cats.length} style={{ ...inp, flex: 1 }}>
                <option value="">— categoría —</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name || 'sin nombre'}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" value={r.rendimiento || ''} onChange={(e) => setRendimiento(g.tipo, { rendimiento: +e.target.value })}
                placeholder="0" style={{ ...inp, width: 100, textAlign: 'right' }} />
              <span style={{ fontSize: 15, color: '#8a8a8a' }}>{g.unidad} / jornal</span>
            </div>
          </div>
        )
      })}
    </>
  )
}

function MaterialesTab({ core, addCoreItem, updateCoreItem, removeCoreItem }) {
  const mats = core.materiales || []
  return (
    <>
      <div style={{ fontSize: 15, color: '#8a8a8a', lineHeight: 1.4, padding: '0 4px 4px' }}>
        Precio de cada material por unidad (nombre debe coincidir con la lista del cómputo). Fuente opcional: Sodimac, una barraca, etc.
      </div>

      {mats.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 16px', textAlign: 'center', color: '#9a9a9a', fontSize: 16 }}>
          Nada cargado — tocá <span style={{ color: '#fe0000' }}>+</span> para agregar
        </div>
      )}

      {mats.map((it) => (
        <div key={it.id} style={{ ...card, flexWrap: 'wrap' }}>
          <input value={it.name} onChange={(e) => updateCoreItem('materiales', it.id, { name: e.target.value })}
            placeholder="Material" style={{ ...inp, flex: '1 1 140px' }} />
          <input value={it.unit} onChange={(e) => updateCoreItem('materiales', it.id, { unit: e.target.value })}
            placeholder="u" style={{ ...inp, width: 64, textAlign: 'center' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 17, color: '#8a8a8a' }}>$</span>
            <input type="number" value={it.price} onChange={(e) => updateCoreItem('materiales', it.id, { price: +e.target.value })}
              style={{ ...inp, width: 110, textAlign: 'right' }} />
          </div>
          <input value={it.source || ''} onChange={(e) => updateCoreItem('materiales', it.id, { source: e.target.value })}
            placeholder="Fuente (opcional)" style={{ ...inp, flex: '1 1 140px' }} />
          <button onClick={() => removeCoreItem('materiales', it.id)} style={delBtn}>×</button>
        </div>
      ))}

      <AddBtn label="Agregar material" onClick={() => addCoreItem('materiales')} />
    </>
  )
}

function AportesTab({ core, addCoreItem, updateCoreItem, removeCoreItem }) {
  const aportes = core.aportes || []
  return (
    <>
      <div style={{ fontSize: 15, color: '#8a8a8a', lineHeight: 1.4, padding: '0 4px 4px' }}>
        Aportes e impuestos que se aplican sobre el subtotal (mano de obra + materiales) de la obra.
      </div>

      {aportes.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 16px', textAlign: 'center', color: '#9a9a9a', fontSize: 16 }}>
          Nada cargado — tocá <span style={{ color: '#fe0000' }}>+</span> para agregar
        </div>
      )}

      {aportes.map((it) => (
        <div key={it.id} style={card}>
          <input value={it.name} onChange={(e) => updateCoreItem('aportes', it.id, { name: e.target.value })}
            placeholder="Ej: IVA, aportes, sellado…" style={{ ...inp, flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="number" value={it.pct} onChange={(e) => updateCoreItem('aportes', it.id, { pct: +e.target.value })}
              style={{ ...inp, width: 84, textAlign: 'right' }} />
            <span style={{ fontSize: 17, color: '#8a8a8a' }}>%</span>
          </div>
          <button onClick={() => removeCoreItem('aportes', it.id)} style={delBtn}>×</button>
        </div>
      ))}

      <AddBtn label="Agregar aporte / impuesto" onClick={() => addCoreItem('aportes')} />
    </>
  )
}

function AddBtn({ label, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', marginTop: 4, borderRadius: 12, border: '1.5px dashed #fe0000', background: '#fff', color: '#fe0000', fontSize: 16, cursor: 'pointer' }}>
      <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> {label}
    </button>
  )
}

const card = { background: '#fff', borderRadius: 16, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10 }
const typeCard = { background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }
const inp = { padding: '11px 12px', fontSize: 16, color: '#222', background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }
const delBtn = { border: '1.5px solid #e6e6e6', background: '#fff', color: '#1c1c1c', borderRadius: 8, width: 38, height: 38, fontSize: 18, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }
