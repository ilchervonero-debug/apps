import { useDrawingStore, wallThickness } from '../store/drawingStore'
import { CU_NORMS, CU_SECTIONS } from '../data/profiles'
import { LAYER_TEMPLATES } from '../data/layers'

// catálogo agrupado para agregar capas a una cara
const CATS = [
  ['board', 'Placas'],
  ['sheathing', 'Revestimiento / membrana'],
  ['insulation', 'Aislante'],
  ['structure', 'Estructura / alfajías'],
]
const layerName = (id) => LAYER_TEMPLATES.find((l) => l.id === id)?.name || id

// orden y etiquetas de los elementos
const ELEMENTS = [
  { key: 'techo', label: 'Techo', faces: ['interior', 'exterior'] },
  { key: 'piso', label: 'Piso', faces: ['unica'] },
  { key: 'losas', label: 'Losas / Entrepisos', faces: ['unica'] },
  { key: 'cerchas', label: 'Cerchas', structural: true },
  { key: 'columnas', label: 'Columnas / Pilares', structural: true },
]
const FACE_LABEL = { interior: 'Cara interior', exterior: 'Cara exterior', unica: 'Capas' }

export default function ProjectSetup() {
  const project = useDrawingStore((s) => s.project)
  const setProject = useDrawingStore((s) => s.setProject)
  const toggleElement = useDrawingStore((s) => s.toggleElement)
  const setAppView = useDrawingStore((s) => s.setAppView)

  const sections = CU_SECTIONS[project.profileNorm]?.C || CU_SECTIONS.cu_1.C

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#f7f7f8', padding: '16px 16px 90px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Nombre */}
        <Card>
          <Label>Nombre del proyecto</Label>
          <input value={project.name} onChange={(e) => setProject({ name: e.target.value })}
            placeholder="Casa, Galpón, Depósito…" style={inp} />
        </Card>

        {/* Estructura de acero (global) */}
        <Card>
          <Label>Estructura — perfil de acero</Label>
          <Sub>Norma</Sub>
          <select value={project.profileNorm} onChange={(e) => setProject({ profileNorm: e.target.value })} style={inp}>
            {CU_NORMS.map((n) => (
              <option key={n.id} value={n.id} disabled={!CU_SECTIONS[n.id]}>
                {n.name}{!CU_SECTIONS[n.id] ? ' (próximamente)' : ''}
              </option>
            ))}
          </select>
          <Sub>Montante C</Sub>
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

        {/* Tipos de muro */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 4px 0' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipos de muro</span>
          <button onClick={() => useDrawingStore.getState().addWallType()}
            style={{ marginLeft: 'auto', border: 'none', background: '#fe0000', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 800, padding: '5px 12px', cursor: 'pointer' }}>
            + Tipo
          </button>
        </div>
        {project.wallTypes.map((t) => (
          <WallTypeCard key={t.id} type={t} profileSection={project.profileSection} canDelete={project.wallTypes.length > 1} />
        ))}

        {/* Elementos del proyecto */}
        <div style={{ fontSize: 12, fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 4px 0' }}>
          Otros elementos
        </div>
        {ELEMENTS.map((el) => (
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

function WallTypeCard({ type, profileSection, canDelete }) {
  const updateWallType = useDrawingStore((s) => s.updateWallType)
  const removeWallType = useDrawingStore((s) => s.removeWallType)
  const th = wallThickness(type, profileSection)
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input value={type.name} onChange={(e) => updateWallType(type.id, { name: e.target.value })}
          style={{ ...inp, fontWeight: 800, flex: 1 }} />
        {canDelete && <button onClick={() => removeWallType(type.id)}
          style={{ border: '1px solid #ffd0d0', background: '#fff', color: '#fe0000', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontWeight: 700 }}>×</button>}
      </div>
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
        <span style={{ width: 22, height: 22, borderRadius: 6, background: on ? '#fe0000' : '#e8e8e8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
          {on ? '✓' : '+'}
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
              <span style={{ width: 16, height: 16, borderRadius: 4, background: on ? '#fe0000' : '#e8e8e8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>{on ? '✓' : ''}</span>
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

function Card({ children }) {
  return <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
}
function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 800, color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{children}</div>
}
function Sub({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#999', marginTop: 6 }}>{children}</div>
}
