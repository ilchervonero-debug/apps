import { useState } from 'react'
import { useDrawingStore } from '../store/drawingStore'

// Directrices de revisión: NO es un diario para archivar — son notas que
// Ángel escribe para que el colaborador (Claude) las lea y las resuelva.
// El botón "Copiar" existe porque Claude no tiene acceso directo a esto:
// Ángel copia y pega el texto en el chat, ítem por ítem, para que Claude
// comente cómo lo va a implementar (o si entendió bien) y después lo haga.
export default function RevisionNotes() {
  const notas = useDrawingStore((s) => s.project.notasRevision || '')
  const setProject = useDrawingStore((s) => s.setProject)
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(notas)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch { /* no-op */ }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 14, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Directrices para Claude
        </div>
        {notas.trim() && (
          <button onClick={copiar} style={{ background: 'none', border: '1px solid #e5e5ea', borderRadius: 8, padding: '5px 10px', fontSize: 14, color: copiado ? '#34c759' : '#fe0000', cursor: 'pointer' }}>
            {copiado ? 'Copiado ✓' : 'Copiar'}
          </button>
        )}
      </div>
      <textarea
        value={notas}
        onChange={(e) => setProject({ notasRevision: e.target.value })}
        placeholder="Anotá acá, ítem por ítem, lo que hay que corregir o cambiar. Después tocá Copiar y pegalo en el chat para que Claude lo lea y lo resuelva."
        rows={4}
        style={{ width: '100%', fontSize: 16, fontFamily: 'inherit', color: '#1c1c1c', border: '1px solid #e5e5ea', borderRadius: 8, padding: 10, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  )
}
