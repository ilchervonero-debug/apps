import { useDrawingStore } from '../store/drawingStore'
import { CU_NORMS, CU_SECTIONS } from '../data/profiles'
import { LAYER_TEMPLATES } from '../data/layers'

const boards = LAYER_TEMPLATES.filter((l) => l.category === 'board')
const claddings = LAYER_TEMPLATES.filter((l) => l.category === 'sheathing')
const insulations = LAYER_TEMPLATES.filter((l) => l.category === 'insulation')

const ELEMENTS = [
  { key: 'muro', label: 'Muros', icon: 'M3 21V8l9-5 9 5v13' },
  { key: 'techo', label: 'Techo', icon: 'M3 12l9-7 9 7' },
  { key: 'columnas', label: 'Columnas / Pilares', icon: 'M8 3v18M16 3v18' },
  { key: 'cerchas', label: 'Cerchas', icon: 'M3 20h18L12 5z' },
  { key: 'losas', label: 'Losas / Entrepisos', icon: 'M3 9h18v6H3z' },
]

export default function ProjectSetup() {
  const project = useDrawingStore((s) => s.project)
  const setProject = useDrawingStore((s) => s.setProject)
  const setProjectElement = useDrawingStore((s) => s.setProjectElement)
  const setAppView = useDrawingStore((s) => s.setAppView)

  const sections = CU_SECTIONS[project.profileNorm]?.C || CU_SECTIONS.cu_1.C

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#f7f7f8', padding: '16px 16px 90px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Nombre del proyecto */}
        <Card>
          <Label>Nombre del proyecto</Label>
          <input
            value={project.name}
            onChange={(e) => setProject({ name: e.target.value })}
            placeholder="Casa, Galpón, Depósito…"
            style={inp}
          />
        </Card>

        {/* Elementos del proyecto */}
        <Card>
          <Label>¿Qué incluye el proyecto?</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            {ELEMENTS.map((el) => {
              const on = !!project.elements[el.key]
              return (
                <button key={el.key} onClick={() => setProjectElement(el.key, !on)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px', borderRadius: 12, cursor: 'pointer',
                    border: '1.5px solid', borderColor: on ? '#fe0000' : '#e0e0e0',
                    background: on ? '#fff5f5' : '#fff', color: on ? '#fe0000' : '#666', fontWeight: 700, fontSize: 13,
                    textAlign: 'left',
                  }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={el.icon} /></svg>
                  {el.label}
                </button>
              )
            })}
          </div>
        </Card>

        {/* Perfil steel framing */}
        <Card>
          <Label>Perfil (acero)</Label>
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
            {sections.map((c, i) => (
              <option key={i} value={`${c.h}_${c.t}`}>{c.h}×{c.w}×{c.t}mm — {c.kg} kg/m</option>
            ))}
          </select>
          <Sub>Separación entre montantes</Sub>
          <div style={{ display: 'flex', gap: 8 }}>
            {[300, 400, 600].map((s) => (
              <button key={s} onClick={() => setProject({ studSpacing: s })}
                style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  border: '1.5px solid', borderColor: project.studSpacing === s ? '#fe0000' : '#e0e0e0',
                  background: project.studSpacing === s ? '#fe0000' : '#fff', color: project.studSpacing === s ? '#fff' : '#666' }}>
                {s}mm
              </button>
            ))}
          </div>
        </Card>

        {/* Placa */}
        <Card>
          <Label>Placa</Label>
          <select value={project.boardId} onChange={(e) => setProject({ boardId: e.target.value })} style={inp}>
            {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Card>

        {/* Revestimiento estructural */}
        <Card>
          <Label>Revestimiento estructural</Label>
          <select value={project.claddingId} onChange={(e) => setProject({ claddingId: e.target.value })} style={inp}>
            <option value="">Ninguno</option>
            {claddings.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Card>

        {/* Aislante */}
        <Card>
          <Label>Aislante</Label>
          <select value={project.insulationId} onChange={(e) => setProject({ insulationId: e.target.value })} style={inp}>
            <option value="">Ninguno</option>
            {insulations.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Card>
      </div>

      {/* CTA fija */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 16px', background: 'linear-gradient(to top, #f7f7f8 70%, transparent)', zIndex: 20 }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <button onClick={() => setAppView('draw')}
            style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: '#fe0000', color: '#fff', fontWeight: 800, fontSize: 16, boxShadow: '0 4px 16px rgba(254,0,0,0.35)' }}>
            Ir al plano →
          </button>
        </div>
      </div>
    </div>
  )
}

const inp = {
  width: '100%', padding: '11px 12px', fontSize: 15, color: '#222', background: '#fff',
  border: '1.5px solid #e0e0e0', borderRadius: 10, outline: 'none', boxSizing: 'border-box', marginBottom: 2,
}

function Card({ children }) {
  return <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
}
function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 800, color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{children}</div>
}
function Sub({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginTop: 6 }}>{children}</div>
}
