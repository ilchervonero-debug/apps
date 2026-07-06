import { useDrawingStore, wallThickness } from '../store/drawingStore'
import { PROFILE_NORMS, PROFILE_SECTIONS } from '../data/profiles'
import { LAYER_TEMPLATES } from '../data/layers'

// catálogo agrupado para agregar capas a una cara
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

// Componentes de la casa, agrupados (Estructura · Losas/Entrepiso · Techos)
const ELEMENTS = [
  { key: 'piso', label: 'Piso', faces: ['unica'], group: 'losas' },
  { key: 'losas', label: 'Losas / Entrepiso', faces: ['unica'], group: 'losas' },
  { key: 'techo', label: 'Techo / Cubierta', faces: ['interior', 'exterior'], group: 'techos' },
]
// Chips de la estructura primaria (se desarrollan con las herramientas en el plano)
const ESTRUCTURA = ['Muros', 'Pilares', 'Cerchas', 'Vigas']
const FACE_LABEL = { interior: 'Cara interior', exterior: 'Cara exterior', unica: 'Capas' }

export default function ProjectSetup() {
  const project = useDrawingStore((s) => s.project)
  const setProject = useDrawingStore((s) => s.setProject)
  const toggleElement = useDrawingStore((s) => s.toggleElement)
  const setAppView = useDrawingStore((s) => s.setAppView)

  const normName = PROFILE_NORMS.find((n) => n.id === project.profileNorm)?.name || 'IRAM-IAS-U500'
  const sections = PROFILE_SECTIONS[project.profileNorm]?.C || PROFILE_SECTIONS.cu_1.C
  const byGroup = (g) => ELEMENTS.filter((e) => e.group === g)

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#f7f7f8', padding: '16px 16px 90px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

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

        <div style={{ fontSize: 13, fontWeight: 500, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 4px 0' }}>Componentes</div>

        {/* Estructura */}
        <Card>
          <Label>Estructura</Label>
          <Sub>Se dibujan con las herramientas en el plano</Sub>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0 12px' }}>
            {ESTRUCTURA.map((c) => (
              <span key={c} style={{ fontSize: 15, color: '#fe0000', border: '1px solid #fe0000', borderRadius: 16, padding: '5px 13px' }}>{c}</span>
            ))}
          </div>
          <Sub>Perfil base de los muros</Sub>
          <select value={project.profileSection} onChange={(e) => setProject({ profileSection: e.target.value })} style={inp}>
            {sections.map((c, i) => <option key={i} value={`${c.h}_${c.t}`}>{c.h}×{c.w}×{c.t}mm — {c.kg} kg/m</option>)}
          </select>
          <Sub>Separación entre montantes</Sub>
          <div style={{ display: 'flex', gap: 8 }}>
            {[300, 400, 600].map((s) => (
              <button key={s} onClick={() => setProject({ studSpacing: s })}
                style={pill(project.studSpacing === s)}>{s}mm</button>
            ))}
          </div>
        </Card>

        {/* Paredes */}
        <GroupHeader label="Paredes" onAdd={() => useDrawingStore.getState().addWallType()} />
        {project.wallTypes.map((t) => (
          <WallTypeCard key={t.id} type={t} profileSection={project.profileSection} canDelete={project.wallTypes.length > 1} />
        ))}

        {/* Losas / Entrepiso */}
        <GroupHeader label="Losas / Entrepiso" />
        {byGroup('losas').map((el) => (
          <ElementCard key={el.key} def={el} state={project.elements[el.key]} onToggle={() => toggleElement(el.key)} />
        ))}

        {/* Techos / Cubiertas */}
        <GroupHeader label="Techos / Cubiertas" />
        {byGroup('techos').map((el) => (
          <ElementCard key={el.key} def={el} state={project.elements[el.key]} onToggle={() => toggleElement(el.key)} />
        ))}
      </div>

      {/* CTA */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 16px', background: 'linear-gradient(to top, #f7f7f8 70%, transparent)', zIndex: 20 }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <button onClick={() => setAppView('draw')}
            style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', cursor: 'pointer', background: '#fe0000', color: '#fff', fontWeight: 800, fontSize: 16, boxShadow: '0 4px 16px rgba(254,0,0,0.35)' }}>
            Ir al plano →
          </button>
        </div>
      </div>
    </div>
  )
}

function Chk({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6" /></svg>
}

function WallTypeCard({ type, profileSection, canDelete }) {
  const updateWallType = useDrawingStore((s) => s.updateWallType)
  const removeWallType = useDrawingStore((s) => s.removeWallType)
  const th = wallThickness(type, profileSection)
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input value={type.name} onChange={(e) => updateWallType(type.id, { name: e.target.value })}
          placeholder="Nombre del muro (o elegí abajo)"
          style={{ ...inp, fontWeight: 600, flex: 1 }} />
        {canDelete && <button onClick={() => removeWallType(type.id)}
          style={{ border: '1px solid #ffd0d0', background: '#fff', color: '#fe0000', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontWeight: 700 }}>×</button>}
      </div>
      {/* Precargados de empacado — no quita el nombre libre de arriba */}
      <select value={WALL_PRESETS.includes(type.name) ? type.name : ''}
        onChange={(e) => e.target.value && updateWallType(type.id, { name: e.target.value })}
        style={{ ...inp, color: '#fe0000', fontWeight: 600 }}>
        <option value="">Empacado precargado…</option>
        {WALL_PRESETS.map((n) => <option key={n} value={n} style={{ color: '#222' }}>{n}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 8 }}>
        {[['exterior', 'Exterior'], ['interior', 'Interior']].map(([k, lbl]) => (
          <button key={k} onClick={() => updateWallType(type.id, { kind: k })} style={pill(type.kind === k)}>{lbl}</button>
        ))}
        <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 12, fontWeight: 800, color: '#0a84ff' }}>espesor ≈ {(th / 10).toFixed(1)} cm</span>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
        {layers.length === 0 && <span style={{ fontSize: 12, color: '#bbb' }}>Sin capas</span>}
        {layers.map((id) => (
          <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0f0f0', borderRadius: 16, padding: '5px 6px 5px 11px', fontSize: 12, fontWeight: 600, color: '#444' }}>
            {layerName(id)}
            <button onClick={() => removeTypeLayer(typeId, face, id)} style={{ border: 'none', background: '#ddd', color: '#666', borderRadius: 10, width: 18, height: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
      <select value="" onChange={(e) => { addTypeLayer(typeId, face, e.target.value); e.target.value = '' }}
        style={{ ...inp, marginTop: 6, color: '#fe0000', fontWeight: 700 }}>
        <option value="" disabled>+ Agregar capa…</option>
        {CATS.map(([cat, lbl]) => (
          <optgroup key={cat} label={lbl}>
            {LAYER_TEMPLATES.filter((l) => l.category === cat && !layers.includes(l.id)).map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

function ElementCard({ def, state, onToggle }) {
  const on = !!state?.on
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', border: on ? '1.5px solid #fe0000' : '1.5px solid transparent' }}>
      <button onClick={onToggle}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: on ? '#fe0000' : '#e8e8e8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16 }}>
          {on ? <Chk /> : '+'}
        </span>
        <span style={{ fontSize: 15, fontWeight: 800, color: on ? '#222' : '#888', flex: 1 }}>{def.label}</span>
        {on && <span style={{ fontSize: 18, color: '#bbb' }}>⌄</span>}
      </button>

      {on && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {def.structural ? (
            <div style={{ fontSize: 13, color: '#888', background: '#f7f7f8', borderRadius: 10, padding: 12 }}>
              Elemento estructural — usa el <b>perfil de acero</b> elegido arriba. El detalle de armado se define en el plano.
            </div>
          ) : (
            <>
              {def.faces.map((f) => <FaceStack key={f} elKey={def.key} face={f} layers={state.faces?.[f] || []} />)}
              <FinishBlock elKey={def.key} finish={state.finish} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function FaceStack({ elKey, face, layers }) {
  const addFaceLayer = useDrawingStore((s) => s.addFaceLayer)
  const removeFaceLayer = useDrawingStore((s) => s.removeFaceLayer)
  return (
    <div>
      <Sub>{FACE_LABEL[face]}</Sub>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
        {layers.length === 0 && <span style={{ fontSize: 12, color: '#bbb' }}>Sin capas</span>}
        {layers.map((id) => (
          <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0f0f0', borderRadius: 16, padding: '5px 6px 5px 11px', fontSize: 12, fontWeight: 600, color: '#444' }}>
            {layerName(id)}
            <button onClick={() => removeFaceLayer(elKey, face, id)} style={{ border: 'none', background: '#ddd', color: '#666', borderRadius: 10, width: 18, height: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
      <select value="" onChange={(e) => { addFaceLayer(elKey, face, e.target.value); e.target.value = '' }}
        style={{ ...inp, marginTop: 6, color: '#fe0000', fontWeight: 700 }}>
        <option value="" disabled>+ Agregar capa…</option>
        {CATS.map(([cat, lbl]) => (
          <optgroup key={cat} label={lbl}>
            {LAYER_TEMPLATES.filter((l) => l.category === cat && !layers.includes(l.id)).map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

function FinishBlock({ elKey, finish }) {
  const setFinish = useDrawingStore((s) => s.setFinish)
  const coats = finish?.paintCoats ?? 2
  const toggles = [
    ['masilla', 'Masilla'],
    ['enduido', 'Enduido'],
    ['cinta', 'Cinta de juntas'],
    ['tornillos', 'Tornillos'],
  ]
  return (
    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
      <Sub>Terminación (según superficie)</Sub>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 10px' }}>
        <span style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>Capas de pintura</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <Stepper onClick={() => setFinish(elKey, { paintCoats: Math.max(0, coats - 1) })}>−</Stepper>
          <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 800, color: '#222' }}>{coats}</span>
          <Stepper onClick={() => setFinish(elKey, { paintCoats: coats + 1 })}>+</Stepper>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {toggles.map(([k, lbl]) => {
          const on = !!finish?.[k]
          return (
            <button key={k} onClick={() => setFinish(elKey, { [k]: !on })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'left',
                border: '1.5px solid', borderColor: on ? '#fe0000' : '#e0e0e0', background: on ? '#fff5f5' : '#fff', color: on ? '#fe0000' : '#888' }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: on ? '#fe0000' : '#e8e8e8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on ? <Chk size={11} /> : null}</span>
              {lbl}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Stepper({ children, onClick }) {
  return <button onClick={onClick} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fff', color: '#444', fontSize: 18, fontWeight: 800, cursor: 'pointer', lineHeight: 1 }}>{children}</button>
}

const inp = {
  width: '100%', padding: '11px 12px', fontSize: 15, color: '#222', background: '#fff',
  border: '1.5px solid #e0e0e0', borderRadius: 10, outline: 'none', boxSizing: 'border-box',
}
const pill = (on) => ({
  flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
  border: '1.5px solid', borderColor: on ? '#fe0000' : '#e0e0e0',
  background: on ? '#fe0000' : '#fff', color: on ? '#fff' : '#666',
})

function GroupHeader({ label, onAdd }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 4px 0' }}>
      <span style={{ fontSize: 15, fontWeight: 500, color: '#1c1c1c' }}>{label}</span>
      {onAdd && (
        <button onClick={onAdd} title={`Agregar ${label}`}
          style={{ marginLeft: 'auto', border: '1px solid #fe0000', background: '#fff', color: '#fe0000', borderRadius: 8, fontSize: 20, fontWeight: 500, width: 34, height: 34, cursor: 'pointer', lineHeight: 1 }}>+</button>
      )}
    </div>
  )
}
function Card({ children }) {
  return <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
}
function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 800, color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{children}</div>
}
function Sub({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#999', marginTop: 6 }}>{children}</div>
}
