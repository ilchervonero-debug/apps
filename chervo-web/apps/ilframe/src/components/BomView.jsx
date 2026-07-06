import { useDrawingStore } from '../store/drawingStore'
import { computoProyecto } from '../engine/computo'
import { costoProyecto } from '../engine/costo'

const money = (n) => '$ ' + Math.round(n || 0).toLocaleString('es-UY')

// Pestaña CÓMPUTO: cómputo real consolidado de TODOS los elementos
// (muros, vigas, cerchas, pilares/columnas, techos, losas) + materiales.
export default function BomView() {
  const state = useDrawingStore((s) => s)
  const project = state.project
  const core = useDrawingStore((s) => s.core)
  const { grupos, materiales, totales } = computoProyecto(state, project)
  const costo = costoProyecto(state, project, core)

  if (!grupos.length) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a9a9a', fontSize: 16 }}>
        Dibujá elementos para ver el cómputo
      </div>
    )
  }

  const cap = { fontSize: 14, fontWeight: 500, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: '0.05em' }
  const card = { background: '#fff', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 14, overflow: 'hidden' }

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: '#f7f7f8', padding: 16 }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Totales headline */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Tot valor={`${totales.aceroKg} kg`} label="Acero total" />
          <Tot valor={totales.piezas} label="Piezas" />
          {totales.tornillos > 0 && <Tot valor={totales.tornillos} label="Tornillos" />}
        </div>

        {/* Cómputo por grupo */}
        {grupos.map((g) => (
          <div key={g.tipo} style={card}>
            <div style={{ padding: '12px 16px 6px', fontSize: 17, color: '#1c1c1c' }}>{g.label}</div>
            {g.filas.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '9px 16px', borderTop: '1px solid #f2f2f2' }}>
                <span style={{ fontSize: 16, color: '#fe0000', minWidth: 46 }}>{f.id}</span>
                <span style={{ flex: 1, fontSize: 15, color: '#555' }}>{f.det}<span style={{ color: '#9a9a9a' }}> · {f.perfil}</span></span>
                <span style={{ fontSize: 16, color: '#1c1c1c', minWidth: 66, textAlign: 'right' }}>{f.kg} kg</span>
                {f.extra && <span style={{ fontSize: 14, color: '#9a9a9a', minWidth: 96, textAlign: 'right' }}>{f.extra}</span>}
              </div>
            ))}
          </div>
        ))}

        {/* Lista de materiales consolidada */}
        <div style={{ ...cap, margin: '4px 4px 8px' }}>Lista de materiales</div>
        <div style={card}>
          {materiales.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '10px 16px', borderTop: i ? '1px solid #f2f2f2' : 'none' }}>
              <span style={{ flex: 1, fontSize: 16, color: '#1c1c1c' }}>{m.name}</span>
              <span style={{ fontSize: 16, color: '#1c1c1c' }}>{m.qty}</span>
              <span style={{ fontSize: 15, color: '#9a9a9a', minWidth: 34, textAlign: 'right' }}>{m.unit}</span>
            </div>
          ))}
        </div>

        {/* Costo estimado (APU): mano de obra por rendimiento + materiales + aportes */}
        <div style={{ ...cap, margin: '4px 4px 8px' }}>Costo estimado</div>
        <div style={card}>
          <div style={{ padding: '10px 16px 4px', fontSize: 15, color: '#8a8a8a' }}>Mano de obra (por rendimiento)</div>
          {costo.manoObraPorGrupo.filter((g) => g.cantidad > 0).map((g) => (
            <div key={g.tipo} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 16px', borderTop: '1px solid #f2f2f2' }}>
              <span style={{ flex: 1, fontSize: 15, color: '#555' }}>{g.label}<span style={{ color: '#9a9a9a' }}> · {g.cantidad} {g.unidad}</span></span>
              {g.definido
                ? <span style={{ fontSize: 16, color: '#1c1c1c' }}>{money(g.costo)}</span>
                : <span style={{ fontSize: 14, color: '#fe0000' }}>sin rendimiento</span>}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '10px 16px', borderTop: '1px solid #f2f2f2' }}>
            <span style={{ flex: 1, fontSize: 16, color: '#1c1c1c' }}>Materiales</span>
            <span style={{ fontSize: 16, color: '#1c1c1c' }}>{money(costo.costoMateriales)}</span>
          </div>
          {costo.aportesAplicados.map((ap, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 16px', borderTop: '1px solid #f2f2f2' }}>
              <span style={{ flex: 1, fontSize: 15, color: '#555' }}>{ap.name || 'sin nombre'}<span style={{ color: '#9a9a9a' }}> · {ap.pct}%</span></span>
              <span style={{ fontSize: 16, color: '#1c1c1c' }}>{money(ap.monto)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '12px 16px', borderTop: '1px solid #f2f2f2' }}>
            <span style={{ flex: 1, fontSize: 17, color: '#1c1c1c' }}>Total estimado</span>
            <span style={{ fontSize: 22, color: '#fe0000' }}>{money(costo.total)}</span>
          </div>
        </div>
        {(costo.faltaManoObra || costo.faltaMateriales) && (
          <div style={{ fontSize: 14, color: '#8a8a8a', lineHeight: 1.5, padding: '4px 4px 0' }}>
            {costo.faltaManoObra && 'Faltan rendimientos por definir en el Core. '}
            {costo.faltaMateriales && 'Faltan precios de materiales por cargar en el Core.'}
          </div>
        )}

        <div style={{ fontSize: 14, color: '#9a9a9a', lineHeight: 1.5, padding: '4px 4px 20px' }}>
          Cantidades tomadas del dibujo de cada pieza. Jornales, rendimientos, precios y aportes se cargan en el Core de la página principal. Exportá en la pestaña Salida.
        </div>
      </div>
    </div>
  )
}

function Tot({ valor, label }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '14px 18px', flex: '1 1 120px' }}>
      <div style={{ fontSize: 24, color: '#fe0000' }}>{valor}</div>
      <div style={{ fontSize: 14, color: '#8a8a8a' }}>{label}</div>
    </div>
  )
}
