import { useState } from 'react'
import { useDrawingStore } from '../store/drawingStore'

// Landing (Nivel 0): lista de proyectos. Hoja limpia; un + crea un proyecto
// con nombre. Tocar un proyecto lo abre en su página. Varios proyectos.
export default function Landing() {
  const projects = useDrawingStore((s) => s.projects)
  const newProject = useDrawingStore((s) => s.newProject)
  const openProject = useDrawingStore((s) => s.openProject)
  const deleteProject = useDrawingStore((s) => s.deleteProject)
  const setAppView = useDrawingStore((s) => s.setAppView)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const crear = () => { const n = name.trim() || 'Proyecto sin nombre'; newProject(n); setName(''); setAdding(false) }

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#f7f7f8', padding: '18px 16px 40px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Core global — aportes/impuestos + costos de materiales (todos los proyectos) */}
        <button onClick={() => setAppView('core')}
          style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: 'none', padding: '16px 16px', cursor: 'pointer', textAlign: 'left' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fe0000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.2a2.5 2 0 0 1 5 0c0 1.3-1.1 1.8-2.5 1.8s-2.5.5-2.5 1.8a2.5 2 0 0 0 5 0" /></svg>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: 18, color: '#1c1c1c' }}>Core</span>
            <span style={{ display: 'block', fontSize: 14, color: '#9a9a9a' }}>Aportes, impuestos y costos de materiales</span>
          </span>
          <span style={{ fontSize: 22, color: '#c4c4c4' }}>›</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 4px 6px' }}>
          <span style={{ fontSize: 20, color: '#1c1c1c' }}>Proyectos</span>
          <button onClick={() => setAdding((v) => !v)} title="Nuevo proyecto"
            style={{ marginLeft: 'auto', border: '1px solid #fe0000', background: adding ? '#fe0000' : '#fff', color: adding ? '#fff' : '#fe0000', borderRadius: 10, fontSize: 24, fontWeight: 500, width: 44, height: 44, cursor: 'pointer', lineHeight: 1 }}>+</button>
        </div>

        {adding && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', gap: 10 }}>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && crear()}
              placeholder="Nombre del proyecto…" style={{ flex: 1, padding: '12px 12px', fontSize: 18, border: '1.5px solid #e0e0e0', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }} />
            <button onClick={crear} style={{ background: '#fe0000', border: 'none', color: '#fff', fontSize: 16, fontWeight: 500, borderRadius: 10, padding: '0 20px', cursor: 'pointer' }}>Crear</button>
          </div>
        )}

        {projects.length === 0 && !adding && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 16px', textAlign: 'center', color: '#9a9a9a', fontSize: 16 }}>
            Sin proyectos — tocá <span style={{ color: '#fe0000' }}>+</span> para crear
          </div>
        )}

        {projects.map((p) => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <button onClick={() => openProject(p.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, padding: '16px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 18, color: '#1c1c1c' }}>{p.name}</span>
              <span style={{ fontSize: 14, color: '#9a9a9a' }}>{fecha(p.updatedAt)}</span>
            </button>
            <button onClick={() => { if (confirm(`¿Borrar "${p.name}"?`)) deleteProject(p.id) }} title="Borrar"
              style={{ border: 'none', background: 'none', color: '#1c1c1c', padding: '0 18px', cursor: 'pointer', alignSelf: 'stretch' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M6 7l1 13h10l1-13" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function fecha(ts) {
  if (!ts) return 'nuevo'
  const d = new Date(ts)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}
