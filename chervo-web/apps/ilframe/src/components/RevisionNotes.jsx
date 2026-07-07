import { useDrawingStore } from '../store/drawingStore'

// Cuaderno de revisión: un box de texto libre, compartido entre Cómputo y
// Salida (mismo project.notasRevision), para ir anotando qué falta
// corregir o cambiar mientras se revisan las cantidades y la exportación.
export default function RevisionNotes() {
  const notas = useDrawingStore((s) => s.project.notasRevision || '')
  const setProject = useDrawingStore((s) => s.setProject)

  return (
    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 14, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        Notas de revisión
      </div>
      <textarea
        value={notas}
        onChange={(e) => setProject({ notasRevision: e.target.value })}
        placeholder="Anotá acá lo que falta corregir o cambiar…"
        rows={4}
        style={{ width: '100%', fontSize: 16, fontFamily: 'inherit', color: '#1c1c1c', border: '1px solid #e5e5ea', borderRadius: 8, padding: 10, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  )
}
