import { useDrawingStore } from '../store/drawingStore'
import { projectBOM } from '../engine/bom'

export default function BomView() {
  const panels = useDrawingStore((s) => s.panels)
  const project = useDrawingStore((s) => s.project)

  if (!panels.length) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 16 }}>
        Dibujá muros para ver el cómputo
      </div>
    )
  }

  const { rows, total } = projectBOM(panels, project)
  const th = { textAlign: 'right', padding: '8px 10px', fontSize: 11, color: '#888', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }
  const td = { textAlign: 'right', padding: '8px 10px', fontSize: 13, color: '#333', whiteSpace: 'nowrap' }

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: '#fafafa', padding: 14 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Cómputo de materiales — {project.name}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ ...th, textAlign: 'left' }}>Panel</th>
                <th style={th}>m² neto</th>
                <th style={th}>Montantes ml</th>
                <th style={th}>Soleras ml</th>
                <th style={th}>Refuerzos ml</th>
                <th style={th}>Acero kg</th>
                <th style={th}>Placas</th>
                <th style={th}>Tornillos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 800, color: '#fe0000' }}>{r.id} <span style={{ color: '#aaa', fontWeight: 400, fontSize: 11 }}>{r.perfil}</span></td>
                  <td style={td}>{r.netM2}</td>
                  <td style={td}>{r.montantesMl}</td>
                  <td style={td}>{r.solerasMl}</td>
                  <td style={td}>{r.refuerzosMl}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{r.aceroKg}</td>
                  <td style={td}>{r.placas}</td>
                  <td style={td}>{r.tornillos}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #eee', background: '#fff8f8' }}>
                <td style={{ ...td, textAlign: 'left', fontWeight: 800 }}>TOTAL</td>
                <td style={{ ...td, fontWeight: 800 }}>{total.netM2}</td>
                <td style={td} colSpan={2}></td>
                <td style={{ ...td, fontWeight: 800 }}>{total.aceroMl} ml</td>
                <td style={{ ...td, fontWeight: 800, color: '#fe0000' }}>{total.aceroKg}</td>
                <td style={{ ...td, fontWeight: 800 }}>{total.placas}</td>
                <td style={{ ...td, fontWeight: 800 }}>{total.tornillos}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{ fontSize: 11, color: '#999', marginTop: 10, lineHeight: 1.5 }}>
          Montantes repartidos cada ≤ {project.studSpacing} mm y cortados a la silueta. Refuerzos de
          abertura (king/jack/dintel/antepecho) sumados automáticamente. Placas por m² neto con
          desperdicio. Perfil y kg/m según el tipo de muro y la norma elegida.
        </div>
      </div>
    </div>
  )
}
