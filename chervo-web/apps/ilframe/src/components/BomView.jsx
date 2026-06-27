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

  const { rows, total, materials } = projectBOM(panels, project)

  const th = { textAlign: 'right', padding: '8px 10px', fontSize: 11, color: '#888', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }
  const td = { textAlign: 'right', padding: '8px 10px', fontSize: 13, color: '#333', whiteSpace: 'nowrap' }
  const card = { background: '#fff', borderRadius: 12, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: '#fafafa', padding: 14 }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Cómputo — {project.name} <span style={{ color: '#bbb', fontWeight: 600 }}>· exportá en la pestaña Salida</span>
        </div>

        {/* Resumen por panel */}
        <div style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ ...th, textAlign: 'left' }}>Panel</th>
                <th style={th}>m²</th><th style={th}>Mont.</th><th style={th}>Sol. ml</th>
                <th style={th}>Ref. ml</th><th style={th}>Acero kg</th><th style={th}>Placas</th><th style={th}>Tornillos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 800, color: '#fe0000' }}>{r.id} <span style={{ color: '#aaa', fontWeight: 400, fontSize: 11 }}>{r.perfil}</span></td>
                  <td style={td}>{r.netM2}</td><td style={td}>{r.studs}</td><td style={td}>{r.solerasMl}</td>
                  <td style={td}>{r.refuerzosMl}</td><td style={{ ...td, fontWeight: 700 }}>{r.aceroKg}</td><td style={td}>{r.placas}</td><td style={td}>{r.tornillos}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #eee', background: '#fff8f8' }}>
                <td style={{ ...td, textAlign: 'left', fontWeight: 800 }}>TOTAL</td>
                <td style={{ ...td, fontWeight: 800 }}>{total.netM2}</td><td style={td} colSpan={2}></td>
                <td style={td}></td><td style={{ ...td, fontWeight: 800, color: '#fe0000' }}>{total.aceroKg}</td>
                <td style={{ ...td, fontWeight: 800 }}>{total.placas}</td><td style={{ ...td, fontWeight: 800 }}>{total.tornillos}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Lista de materiales agregada */}
        <div style={{ fontSize: 12, fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Lista de materiales</div>
        <div style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ ...th, textAlign: 'left' }}>Material</th><th style={th}>Cantidad</th><th style={th}>Unidad</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f2f2f2' }}>
                  <td style={{ ...td, textAlign: 'left' }}>{m.name}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{m.qty}</td>
                  <td style={td}>{m.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: 11, color: '#999', lineHeight: 1.5 }}>
          Montantes cada ≤ {project.studSpacing} mm cortados a la silueta · refuerzos de abertura
          automáticos (king/jack/dintel/antepecho) · placas por m² neto con desperdicio · tornillos
          estructurales (montante-solera) + de placa · perfil y kg/m según norma y tipo de muro.
        </div>
      </div>
    </div>
  )
}
