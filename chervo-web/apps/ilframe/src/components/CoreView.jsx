import { useState } from 'react'
import { useDrawingStore } from '../store/drawingStore'
import { GRUPOS_APU } from '../engine/costo'

// Core GLOBAL de la página principal: acá se arma el APU real — cuadrilla
// (SUNCA + BPS + herramientas) + tareas (rendimiento m²/ml por día) +
// vinculación de cada tipo de elemento a su tarea + materiales (precio por
// presentación comercial, se compra en paquetes) + aportes/impuestos.
// Cargado con una base real de partida; todo editable. Compartido por
// todos los proyectos. El cómputo (cantidades) sale del dibujo de cada
// proyecto; esto solo lo valoriza.
export default function CoreView() {
  const core = useDrawingStore((s) => s.core)
  const addCoreItem = useDrawingStore((s) => s.addCoreItem)
  const updateCoreItem = useDrawingStore((s) => s.updateCoreItem)
  const removeCoreItem = useDrawingStore((s) => s.removeCoreItem)
  const setCuadrilla = useDrawingStore((s) => s.setCuadrilla)
  const setRendimiento = useDrawingStore((s) => s.setRendimiento)
  const [tab, setTab] = useState('cuadrilla')

  const tabs = [
    ['cuadrilla', 'Cuadrilla'],
    ['tareas', 'Tareas'],
    ['vincular', 'Vincular'],
    ['materiales', 'Materiales'],
    ['aportes', 'Aportes e impuestos'],
  ]

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#f7f7f8' }}>
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid #e0e0e0', background: '#fff', overflowX: 'auto' }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: '1 0 auto', minWidth: 100, padding: '14px 10px', border: 'none', cursor: 'pointer', background: 'none', fontSize: 15, whiteSpace: 'nowrap',
              color: tab === id ? '#fe0000' : '#999', borderBottom: tab === id ? '3px solid #fe0000' : '3px solid transparent' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 40px' }}>
        <div style={{ maxWidth: 580, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'cuadrilla' && <CuadrillaTab core={core} setCuadrilla={setCuadrilla} />}
          {tab === 'tareas' && <TareasTab core={core} addCoreItem={addCoreItem} updateCoreItem={updateCoreItem} removeCoreItem={removeCoreItem} />}
          {tab === 'vincular' && <VincularTab core={core} setRendimiento={setRendimiento} />}
          {tab === 'materiales' && <MaterialesTab core={core} addCoreItem={addCoreItem} updateCoreItem={updateCoreItem} removeCoreItem={removeCoreItem} />}
          {tab === 'aportes' && <AportesTab core={core} addCoreItem={addCoreItem} updateCoreItem={updateCoreItem} removeCoreItem={removeCoreItem} />}
        </div>
      </div>
    </div>
  )
}

function CuadrillaTab({ core, setCuadrilla }) {
  const c = core.cuadrilla || {}
  const costoDiarioReal = (c.costoDiarioLiquido || 0) * (c.multiplicadorBPS || 1)
  return (
    <>
      <div style={{ fontSize: 15, color: '#8a8a8a', lineHeight: 1.4, padding: '0 4px 4px' }}>
        Costo diario de la cuadrilla (laudo SUNCA + cargas BPS/Ley 14.411 + desgaste de herramientas). Vale para todos los proyectos.
      </div>
      <Field label="Costo diario líquido (SUNCA)" value={c.costoDiarioLiquido} onChange={(v) => setCuadrilla({ costoDiarioLiquido: v })} suffix="$/día" />
      <Field label="Multiplicador BPS (cargas sociales)" value={c.multiplicadorBPS} onChange={(v) => setCuadrilla({ multiplicadorBPS: v })} step="0.01" />
      <Field label="Factor herramientas (desgaste equipo)" value={c.factorHerramientas} onChange={(v) => setCuadrilla({ factorHerramientas: v })} step="0.01" />
      <div style={typeCard}>
        <div style={{ fontSize: 15, color: '#8a8a8a' }}>Costo diario real (calculado)</div>
        <div style={{ fontSize: 22, color: '#fe0000' }}>{money(costoDiarioReal)}</div>
      </div>
    </>
  )
}

function TareasTab({ core, addCoreItem, updateCoreItem, removeCoreItem }) {
  const tareas = core.tareas || []
  return (
    <>
      <div style={{ fontSize: 15, color: '#8a8a8a', lineHeight: 1.4, padding: '0 4px 4px' }}>
        Rendimiento real de la cuadrilla por tarea (m² o ml por día). Cargada con la base de referencia — ajustala con tu experiencia de obra.
      </div>
      {tareas.length === 0 && <Empty />}
      {tareas.map((t) => (
        <div key={t.id} style={typeCard}>
          <input value={t.nombre} onChange={(e) => updateCoreItem('tareas', t.id, { nombre: e.target.value })}
            placeholder="Nombre de la tarea…" style={inp} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Pills options={[['m2', 'm²'], ['ml', 'ml']]} value={t.unidad} onSet={(v) => updateCoreItem('tareas', t.id, { unidad: v })} />
            <input type="number" value={t.rendimiento} onChange={(e) => updateCoreItem('tareas', t.id, { rendimiento: +e.target.value })}
              style={{ ...inp, width: 90, textAlign: 'right' }} />
            <span style={{ fontSize: 15, color: '#8a8a8a' }}>{t.unidad}/día</span>
            <button onClick={() => removeCoreItem('tareas', t.id)} style={{ ...delBtn, marginLeft: 'auto' }}>×</button>
          </div>
        </div>
      ))}
      <AddBtn label="Agregar tarea" onClick={() => addCoreItem('tareas')} />
    </>
  )
}

function VincularTab({ core, setRendimiento }) {
  const tareas = core.tareas || []
  const rend = core.rendimientos || {}
  return (
    <>
      <div style={{ fontSize: 15, color: '#8a8a8a', lineHeight: 1.4, padding: '0 4px 4px' }}>
        Qué tarea usa cada tipo de elemento del cómputo para calcular su mano de obra.
      </div>
      {!tareas.length && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 16px', textAlign: 'center', color: '#9a9a9a', fontSize: 15, lineHeight: 1.4 }}>
          Cargá primero tareas en <span style={{ color: '#fe0000' }}>Tareas</span> para poder vincularlas acá.
        </div>
      )}
      {GRUPOS_APU.map((g) => {
        const r = rend[g.tipo] || {}
        const opciones = tareas.filter((t) => t.unidad === g.unidad)
        return (
          <div key={g.tipo} style={typeCard}>
            <div style={{ fontSize: 16, color: '#1c1c1c' }}>{g.label} <span style={{ fontSize: 14, color: '#9a9a9a' }}>· {g.unidad}</span></div>
            <select value={r.tareaId || ''} onChange={(e) => setRendimiento(g.tipo, { tareaId: e.target.value })}
              disabled={!opciones.length} style={inp}>
              <option value="">— tarea —</option>
              {opciones.map((t) => <option key={t.id} value={t.id}>{t.nombre || 'sin nombre'} ({t.rendimiento} {t.unidad}/día)</option>)}
            </select>
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
        Precio por presentación comercial (se compra en paquetes enteros, redondeando hacia arriba). Cargado con la base de referencia — ajustá precios y sumá los que falten.
      </div>
      {mats.length === 0 && <Empty />}
      {mats.map((it) => (
        <div key={it.id} style={typeCard}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={it.name} onChange={(e) => updateCoreItem('materiales', it.id, { name: e.target.value })}
              placeholder="Material" style={{ ...inp, flex: 1 }} />
            <button onClick={() => removeCoreItem('materiales', it.id)} style={delBtn}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={it.categoria} onChange={(e) => updateCoreItem('materiales', it.id, { categoria: e.target.value })}
              placeholder="Categoría" style={{ ...inp, flex: 1 }} />
            <input value={it.unit} onChange={(e) => updateCoreItem('materiales', it.id, { unit: e.target.value })}
              placeholder="u" style={{ ...inp, width: 60, textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={it.presentacion} onChange={(e) => updateCoreItem('materiales', it.id, { presentacion: e.target.value })}
              placeholder="Presentación (ej: Tira 6m)" style={{ ...inp, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 14, color: '#8a8a8a' }}>rinde</label>
            <input type="number" value={it.rendimientoPaquete} onChange={(e) => updateCoreItem('materiales', it.id, { rendimientoPaquete: +e.target.value })}
              style={{ ...inp, width: 80, textAlign: 'right' }} />
            <span style={{ fontSize: 14, color: '#8a8a8a' }}>{it.unit}/paquete</span>
            <span style={{ marginLeft: 'auto', fontSize: 16, color: '#8a8a8a' }}>$</span>
            <input type="number" value={it.price} onChange={(e) => updateCoreItem('materiales', it.id, { price: +e.target.value })}
              style={{ ...inp, width: 100, textAlign: 'right' }} />
          </div>
          <input value={it.source || ''} onChange={(e) => updateCoreItem('materiales', it.id, { source: e.target.value })}
            placeholder="Fuente (opcional)" style={inp} />
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
      {aportes.length === 0 && <Empty />}
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

function Field({ label, value, onChange, suffix, step = '1' }) {
  return (
    <div style={typeCard}>
      <div style={{ fontSize: 15, color: '#1c1c1c' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="number" step={step} value={value} onChange={(e) => onChange(+e.target.value)} style={{ ...inp, width: 120 }} />
        {suffix && <span style={{ fontSize: 15, color: '#8a8a8a' }}>{suffix}</span>}
      </div>
    </div>
  )
}

function Pills({ options, value, onSet }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map(([id, label]) => (
        <button key={id} onClick={() => onSet(id)}
          style={{ padding: '9px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 15, border: '1.5px solid', borderColor: value === id ? '#fe0000' : '#e0e0e0', background: '#fff', color: value === id ? '#fe0000' : '#666' }}>
          {label}
        </button>
      ))}
    </div>
  )
}

function Empty() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '24px 16px', textAlign: 'center', color: '#9a9a9a', fontSize: 16 }}>
      Nada cargado — tocá <span style={{ color: '#fe0000' }}>+</span> para agregar
    </div>
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

const money = (n) => '$ ' + Math.round(n || 0).toLocaleString('es-UY')
const card = { background: '#fff', borderRadius: 16, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10 }
const typeCard = { background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }
const inp = { padding: '11px 12px', fontSize: 16, color: '#222', background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }
const delBtn = { border: '1.5px solid #e6e6e6', background: '#fff', color: '#1c1c1c', borderRadius: 8, width: 38, height: 38, fontSize: 18, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }
