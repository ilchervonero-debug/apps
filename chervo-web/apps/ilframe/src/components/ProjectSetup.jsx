import { useState } from 'react'
import { useDrawingStore, TYPE_META } from '../store/drawingStore'
import { PROFILE_NORMS, PROFILE_SECTIONS } from '../data/profiles'
import { LAYER_TEMPLATES } from '../data/layers'
import { projectSpec, specVacio, muroEspesor } from '../engine/spec'
import { PILAR_ARMADOS, COLUMNA_PATRONES } from '../engine/pilares'
import { CERCHA_TYPES } from '../engine/trusses'
import { BEAM_TYPES } from '../engine/beams'
import { ROOF_FORMAS, CHAPA_TIPOS } from '../engine/roofs'
import { DECK_TIPOS, VIGUETA_DIRS } from '../engine/slabs'

// catálogo agrupado para agregar capas a una cara / placa
const CATS = [
  ['board', 'Placas'],
  ['sheathing', 'Revestimiento / membrana'],
  ['cladding', 'Revestimiento exterior'],
  ['insulation', 'Aislante'],
  ['structure', 'Estructura / alfajías'],
]
const layerName = (id) => LAYER_TEMPLATES.find((l) => l.id === id)?.name || id

// Nombres de muro precargados (empacado). Se pueden elegir tal cual o
// escribir uno propio en el campo de nombre (en obra los pasan por nombre).
const WALL_PRESETS = [
  'Interior - Exterior',
  'Interior - Interior',
  'Interior - Húmedo',
  'Exterior - Húmedo',
  'Húmedo - Húmedo',
]

// Orden de las secciones de tipo (Componentes). Todo se define acá.
const TYPE_ORDER = ['pilar', 'columna', 'cercha', 'viga', 'losa', 'techo', 'cielo']

export default function ProjectSetup() {
  const project = useDrawingStore((s) => s.project)
  const setProject = useDrawingStore((s) => s.setProject)
  const setAppView = useDrawingStore((s) => s.setAppView)
  const addWallType = useDrawingStore((s) => s.addWallType)
  const addType = useDrawingStore((s) => s.addType)
  const [open, setOpen] = useState({}) // nada desplegado por defecto
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }))
  const show = (k) => setOpen((o) => ({ ...o, [k]: true }))

  const normName = PROFILE_NORMS.find((n) => n.id === project.profileNorm)?.name || 'IRAM-IAS-U500'
  const sections = PROFILE_SECTIONS[project.profileNorm]?.C || PROFILE_SECTIONS.cu_1.C
  const types = project.types || {}

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#f7f7f8', padding: '16px 16px 90px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Estándar (rótulo, no selector) */}
        <div style={{ padding: '2px 6px' }}>
          <div style={{ fontSize: 18, color: '#1c1c1c' }}>Steel Frame</div>
          <div style={{ fontSize: 15, color: '#8a8a8a' }}>Estándar {normName} · medidas en mm</div>
        </div>

        {/* Proyecto */}
        <Card>
          <Label>Nombre del proyecto</Label>
          <input value={project.name} onChange={(e) => setProject({ name: e.target.value })}
            placeholder="Casa, Galpón, Depósito…" style={inp} />
        </Card>

        <div style={{ fontSize: 13, fontWeight: 500, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 4px 2px' }}>Componentes · acá defino todo el proyecto</div>

        {/* Muros / Paredes */}
        <Accordion label="Muros / Paredes" count={project.wallTypes.length} open={open.paredes} onToggle={() => toggle('paredes')}>
          <Sub>Perfil base de los muros</Sub>
          <select value={project.profileSection} onChange={(e) => setProject({ profileSection: e.target.value })} style={inp}>
            {sections.map((c, i) => <option key={i} value={`${c.h}_${c.t}`}>{c.h}×{c.w}×{c.t}mm — {c.kg} kg/m</option>)}
          </select>
          <Sub>Separación entre montantes</Sub>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {[300, 400, 600].map((s) => (
              <button key={s} onClick={() => setProject({ studSpacing: s })} style={pill(project.studSpacing === s)}>{s}mm</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {project.wallTypes.map((t) => (
              <WallTypeCard key={t.id} type={t} profileSection={project.profileSection} canDelete={project.wallTypes.length > 1} />
            ))}
          </div>
          <AddBtn label="Agregar tipo de muro" onClick={() => { addWallType(); show('paredes') }} />
        </Accordion>

        {/* Resto de componentes: cada categoría con sus tipos (código + material) */}
        {TYPE_ORDER.map((cat) => {
          const list = types[cat] || []
          return (
            <Accordion key={cat} label={TYPE_META[cat].label} count={list.length} open={open[cat]} onToggle={() => toggle(cat)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {list.map((t) => (
                  <TypeCard key={t.id} cat={cat} type={t} canDelete={list.length > 1} />
                ))}
              </div>
              <AddBtn label={`Agregar tipo de ${TYPE_META[cat].label.split(' ')[0].toLowerCase()}`} onClick={() => { addType(cat); show(cat) }} />
            </Accordion>
          )
        })}

        {/* Output de info para el plano (resumen de lo definido) */}
        <SpecSummary project={project} open={open.resumen} onToggle={() => toggle('resumen')} />
      </div>

      {/* CTA */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 16px', background: 'linear-gradient(to top, #f7f7f8 70%, transparent)', zIndex: 20 }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <button onClick={() => setAppView('draw')}
            style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', cursor: 'pointer', background: '#fe0000', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 4px 16px rgba(254,0,0,0.35)' }}>
            Ir al plano →
          </button>
        </div>
      </div>
    </div>
  )
}

// Sección colapsable (acordeón). Colapsada por defecto; el botón crear ("+ Agregar")
// va al FINAL de la lista → lo que creás aparece ahí mismo, sin scroll largo.
function Accordion({ label, count, open, onToggle, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '14px 16px' }}>
        <span style={{ fontSize: 18, color: '#1c1c1c' }}>{label}</span>
        {count > 0 && <span style={{ fontSize: 15, color: '#9a9a9a' }}>· {count}</span>}
        <span style={{ fontSize: 16, color: '#c4c4c4', marginLeft: 'auto', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>⌄</span>
      </button>
      {open && <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>}
    </div>
  )
}

// Botón crear, ancho completo, al final de cada sección
function AddBtn({ label, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', marginTop: 4, borderRadius: 12, border: '1.5px dashed #fe0000', background: '#fff', color: '#fe0000', fontSize: 16, cursor: 'pointer' }}>
      <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> {label}
    </button>
  )
}

// Resumen de lo definido = el "output de info" que el plano consumirá
function SpecSummary({ project, open, onToggle }) {
  const spec = projectSpec(project)
  const vacio = specVacio(spec)
  const groups = [
    ['Muros', spec.walls.map((w) => ({ code: w.code, name: w.name, info: `${w.kind} · ${(w.espesorMm / 10).toFixed(1)} cm${w.capasMm ? '' : ' · sin capas'}` }))],
    ['Pilares', spec.pilares.map((x) => ({ code: x.code, name: x.name, info: [x.armado, x.perfil?.label].filter(Boolean).join(' · ') || '—' }))],
    ['Columnas', spec.columnas.map((x) => ({ code: x.code, name: x.name, info: x.cordon?.label || '—' }))],
    ['Cerchas', spec.cerchas.map((x) => ({ code: x.code, name: x.name, info: [x.modelo, x.superior?.label].filter(Boolean).join(' · ') || '—' }))],
    ['Vigas', spec.vigas.map((x) => ({ code: x.code, name: x.name, info: x.perfil?.label || '—' }))],
    ['Losas', spec.losas.map((x) => ({ code: x.code, name: x.name, info: x.vigueta?.label || '—' }))],
    ['Techos', spec.techos.map((x) => ({ code: x.code, name: x.name, info: [x.chapa, x.clavador?.label].filter(Boolean).join(' · ') || '—' }))],
    ['Cielorrasos', spec.cielos.map((x) => ({ code: x.code, name: x.name, info: x.perfil?.label || '—' }))],
  ].filter(([, rows]) => rows.length)
  const total = groups.reduce((a, [, r]) => a + r.length, 0)
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '14px 16px' }}>
        <span style={{ fontSize: 18, color: '#1c1c1c' }}>Resumen para el plano</span>
        {total > 0 && <span style={{ fontSize: 15, color: '#9a9a9a' }}>· {total}</span>}
        <span style={{ fontSize: 16, color: '#c4c4c4', marginLeft: 'auto', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>⌄</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          {vacio ? (
            <div style={{ fontSize: 15, color: '#9a9a9a' }}>Todavía no definiste nada. Agregá tipos con el “+” de cada sección.</div>
          ) : groups.map(([label, rows]) => (
            <div key={label} style={{ marginTop: 10 }}>
              <Sub>{label}</Sub>
              {rows.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '7px 0', borderTop: i ? '1px solid #f2f2f2' : 'none' }}>
                  <span style={{ flex: 1, fontSize: 16, color: '#1c1c1c' }}>{r.name || <span style={{ color: '#bbb' }}>sin nombre</span>}</span>
                  <span style={{ fontSize: 14, color: '#8a8a8a', textAlign: 'right' }}>{r.info}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{ fontSize: 14, color: '#9a9a9a', lineHeight: 1.5, marginTop: 12 }}>
            Esto es lo que el plano va a usar: cada elemento con su código, nombre y material. En el canvas solo dibujás la silueta y elegís el tipo.
          </div>
        </div>
      )}
    </div>
  )
}

// ── Muro: composición por caras (define el espesor) ───────────
function WallTypeCard({ type, profileSection, canDelete }) {
  const updateWallType = useDrawingStore((s) => s.updateWallType)
  const removeWallType = useDrawingStore((s) => s.removeWallType)
  const e = muroEspesor(type, profileSection)
  return (
    <div style={typeCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input value={type.name} onChange={(e) => updateWallType(type.id, { name: e.target.value })}
          placeholder="Nombre del muro…" style={{ ...inp, flex: 1 }} />
        {canDelete && <button onClick={() => removeWallType(type.id)} style={delBtn}>×</button>}
      </div>
      {/* Nombres típicos (opcional) — no quita el nombre libre de arriba */}
      <select value={WALL_PRESETS.includes(type.name) ? type.name : ''}
        onChange={(e) => e.target.value && updateWallType(type.id, { name: e.target.value })}
        style={inp}>
        <option value="">Nombre típico (opcional)…</option>
        {WALL_PRESETS.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {[['exterior', 'Exterior'], ['interior', 'Interior']].map(([k, lbl]) => (
          <button key={k} onClick={() => updateWallType(type.id, { kind: k })} style={pill(type.kind === k)}>{lbl}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 15, color: '#0a84ff' }}>
          {e.capas ? `alma ${(e.core / 10).toFixed(1)} + capas → ${(e.espesor / 10).toFixed(1)} cm` : `alma ${(e.core / 10).toFixed(1)} cm · sumá capas`}
        </span>
      </div>
      <TypeFaceStack typeId={type.id} face="interior" layers={type.faces?.interior || []} label="Cara interior" />
      <TypeFaceStack typeId={type.id} face="exterior" layers={type.faces?.exterior || []} label={type.kind === 'exterior' ? 'Cara exterior' : 'Otra cara'} />
    </div>
  )
}

function TypeFaceStack({ typeId, face, layers, label }) {
  const addTypeLayer = useDrawingStore((s) => s.addTypeLayer)
  const removeTypeLayer = useDrawingStore((s) => s.removeTypeLayer)
  return (
    <div>
      <Sub>{label}</Sub>
      <LayerChips layers={layers} onRemove={(id) => removeTypeLayer(typeId, face, id)} />
      <LayerPicker layers={layers} onAdd={(id) => addTypeLayer(typeId, face, id)} />
    </div>
  )
}

// ── Tipo genérico (Pilar/Columna/Cercha/Viga/Losa/Techo/Cielorraso) ──
function TypeCard({ cat, type, canDelete }) {
  const updateType = useDrawingStore((s) => s.updateType)
  const removeType = useDrawingStore((s) => s.removeType)
  const up = (patch) => updateType(cat, type.id, patch)
  return (
    <div style={typeCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input value={type.name} onChange={(e) => up({ name: e.target.value })} placeholder="Nombre del elemento…" style={{ ...inp, flex: 1 }} />
        {canDelete && <button onClick={() => removeType(cat, type.id)} style={delBtn}>×</button>}
      </div>
      <TypeMaterial cat={cat} type={type} up={up} />
    </div>
  )
}

// Material / perfiles de cada categoría (lo que define de qué está hecho)
function TypeMaterial({ cat, type, up }) {
  if (cat === 'pilar') {
    return (
      <>
        <Sub>Armado</Sub>
        <Pills options={PILAR_ARMADOS.map((a) => [a.id, a.name])} value={type.tipoArmado} onSet={(v) => up({ tipoArmado: v })} />
        <PerfilRow label="Perfil" value={type.perfil} onChange={(v) => up({ perfil: v })} />
      </>
    )
  }
  if (cat === 'columna') {
    return (
      <>
        <Sub>Retícula (como Pratt)</Sub>
        <Pills options={COLUMNA_PATRONES.map((r) => [r.id, r.name])} value={type.patron} onSet={(v) => up({ patron: v })} />
        <PerfilRow label="Cordones" value={type.perfil} onChange={(v) => up({ perfil: v })} />
        <PerfilRow label="Retícula (alma)" value={type.perfilReticula} onChange={(v) => up({ perfilReticula: v })} />
      </>
    )
  }
  if (cat === 'cercha') {
    return (
      <>
        <Sub>Modelo</Sub>
        <Pills options={CERCHA_TYPES.map((m) => [m.id, m.name])} value={type.modelo} onSet={(v) => up({ modelo: v })} />
        <PerfilRow label="Cordón superior" value={type.perfilSuperior} onChange={(v) => up({ perfilSuperior: v })} />
        <PerfilRow label="Cordón inferior" value={type.perfilInferior} onChange={(v) => up({ perfilInferior: v })} />
        <PerfilRow label="Retícula (alma)" value={type.perfilReticula} onChange={(v) => up({ perfilReticula: v })} />
      </>
    )
  }
  if (cat === 'viga') {
    return (
      <>
        <Sub>Armado</Sub>
        <SelectRow value={type.type} onChange={(v) => up({ type: v })} options={BEAM_TYPES.map((t) => [t.id, t.name])} />
        <PerfilRow label="Perfil" value={{ normId: type.normId, secIdx: type.secIdx }} onChange={(v) => up({ normId: v.normId, secIdx: v.secIdx })} />
      </>
    )
  }
  if (cat === 'losa') {
    return (
      <>
        <Sub>Dirección de viguetas</Sub>
        <Pills options={VIGUETA_DIRS.map((d) => [d.id, d.name])} value={type.dir} onSet={(v) => up({ dir: v })} />
        <Sub>Separación</Sub>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {[300, 400, 600].map((s) => <button key={s} onClick={() => up({ sep: s })} style={pill(type.sep === s)}>{s}mm</button>)}
        </div>
        <PerfilRow label="Vigueta" value={type.perfil} onChange={(v) => up({ perfil: v })} />
        <Sub>Deck (placa de piso)</Sub>
        <SelectRow value={type.deck} onChange={(v) => up({ deck: v })} options={DECK_TIPOS.map((d) => [d.id, d.name])} />
      </>
    )
  }
  if (cat === 'techo') {
    return (
      <>
        <Sub>Forma</Sub>
        <Pills options={ROOF_FORMAS.map((f) => [f.id, f.name])} value={type.forma} onSet={(v) => up({ forma: v })} />
        <Sub>Chapa</Sub>
        <SelectRow value={type.tipoChapa} onChange={(v) => up({ tipoChapa: v })} options={CHAPA_TIPOS.map((c) => [c.id, c.name])} />
        <PerfilRow label="Clavador" value={type.perfilClavador} onChange={(v) => up({ perfilClavador: v })} />
      </>
    )
  }
  if (cat === 'cielo') {
    const placas = type.placas || []
    return (
      <>
        <PerfilRow label="Perfil (omega / clip)" value={type.perfil} onChange={(v) => up({ perfil: v })} />
        <Sub>Placas</Sub>
        <LayerChips layers={placas} onRemove={(id) => up({ placas: placas.filter((l) => l !== id) })} />
        <LayerPicker layers={placas} onAdd={(id) => up({ placas: [...placas, id] })} />
        <div style={{ fontSize: 14, color: '#9a9a9a', marginTop: 6 }}>La silueta se toma por importación DXF (herramienta propia); acá queda el material.</div>
      </>
    )
  }
  return null
}

// ── Piezas reutilizables ──────────────────────────────────────
function PerfilRow({ label, value, onChange }) {
  const ref = value || { normId: 'cu_1', secIdx: 0 }
  const secs = PROFILE_SECTIONS[ref.normId]?.C || []
  return (
    <div style={{ marginTop: 6 }}>
      <Sub>{label}</Sub>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <select value={ref.normId} onChange={(e) => onChange({ normId: e.target.value, secIdx: 0 })} style={{ ...inp, flex: 1 }}>
          {PROFILE_NORMS.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
        <select value={ref.secIdx} onChange={(e) => onChange({ ...ref, secIdx: +e.target.value })} style={{ ...inp, flex: 1 }}>
          {secs.map((s, i) => <option key={i} value={i}>{s.h}×{s.w}×{s.t} · {s.kg}kg/m</option>)}
        </select>
      </div>
    </div>
  )
}

function SelectRow({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inp, marginTop: 4 }}>
      {options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select>
  )
}

function Pills({ options, value, onSet }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
      {options.map(([id, label]) => (
        <button key={id} onClick={() => onSet(id)} style={chip(value === id)}>{label}</button>
      ))}
    </div>
  )
}

function LayerChips({ layers, onRemove }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
      {layers.length === 0 && <span style={{ fontSize: 14, color: '#bbb' }}>Sin capas</span>}
      {layers.map((id) => (
        <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0f0f0', borderRadius: 16, padding: '5px 6px 5px 12px', fontSize: 14, color: '#444' }}>
          {layerName(id)}
          <button onClick={() => onRemove(id)} style={{ border: 'none', background: '#ddd', color: '#666', borderRadius: 10, width: 20, height: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </span>
      ))}
    </div>
  )
}

function LayerPicker({ layers, onAdd }) {
  return (
    <select value="" onChange={(e) => { if (e.target.value) { onAdd(e.target.value); e.target.value = '' } }}
      style={{ ...inp, marginTop: 6, color: '#fe0000' }}>
      <option value="" disabled>+ Agregar capa…</option>
      {CATS.map(([cat, lbl]) => (
        <optgroup key={cat} label={lbl}>
          {LAYER_TEMPLATES.filter((l) => l.category === cat && !layers.includes(l.id)).map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

// ── Estilos ───────────────────────────────────────────────────
const inp = {
  width: '100%', padding: '11px 12px', fontSize: 16, color: '#222', background: '#fff',
  border: '1.5px solid #e0e0e0', borderRadius: 10, outline: 'none', boxSizing: 'border-box',
}
const pill = (on) => ({
  flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 15,
  border: '1.5px solid', borderColor: on ? '#fe0000' : '#e0e0e0',
  background: '#fff', color: on ? '#fe0000' : '#666',
})
const chip = (on) => ({
  padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 15,
  border: '1.5px solid', borderColor: on ? '#fe0000' : '#e0e0e0',
  background: '#fff', color: on ? '#fe0000' : '#666',
})
const typeCard = { background: '#fff', borderRadius: 16, padding: 14, border: '1.5px solid #ededed', display: 'flex', flexDirection: 'column', gap: 8 }
const delBtn = { border: '1.5px solid #e6e6e6', background: '#fff', color: '#1c1c1c', borderRadius: 8, width: 34, height: 34, fontSize: 18, cursor: 'pointer', lineHeight: 1 }

function Card({ children }) {
  return <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
}
function Label({ children }) {
  return <div style={{ fontSize: 14, color: '#8a8a8a', marginBottom: 4 }}>{children}</div>
}
function Sub({ children }) {
  return <div style={{ fontSize: 14, color: '#999', marginTop: 6 }}>{children}</div>
}
