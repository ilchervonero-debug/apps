import DrawingCanvas from './components/DrawingCanvas'
import CommandBar from './components/CommandBar'
import DrawingTools from './components/DrawingTools'
import ProjectSetup from './components/ProjectSetup'
import { useDrawingStore } from './store/drawingStore'

export default function App() {
  const appView = useDrawingStore((s) => s.appView)
  const setAppView = useDrawingStore((s) => s.setAppView)
  const projectName = useDrawingStore((s) => s.project.name)
  const tab = useDrawingStore((s) => s.tab)
  const setTab = useDrawingStore((s) => s.setTab)

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', fontFamily: "'Exo', system-ui, sans-serif", background: 'white', userSelect: 'none' }}
    >

      {/* ── Topbar ── */}
      <header style={{ height: 64, background: 'white', borderBottom: '1px solid #e0e0e0', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
        {appView === 'draw' ? (
          <button
            onClick={() => setAppView('setup')}
            title="Volver a la configuración"
            style={{ width: 48, height: 48, borderRadius: 8, background: '#f5f5f5', border: 'none', color: '#666', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
          >
            ‹
          </button>
        ) : null}
        <div style={{ paddingLeft: appView === 'draw' ? 0 : 6 }}>
          <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#fe0000' }}>iL</span><span style={{ color: '#888' }}>Frame</span>
          </div>
          <div style={{ color: '#999', fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 3 }}>
            {appView === 'draw' ? projectName : 'Acero estructural'}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {appView === 'setup' && (
          <div style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Configuración</div>
        )}
      </header>

      {appView === 'setup' ? (
        <ProjectSetup />
      ) : (
        <>
          {/* Pestañas — grandes y legibles */}
          <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid #e0e0e0', background: '#fff' }}>
            {[['plan', 'PLANTA'], ['elev', 'ALZADO']].map(([id, label]) => {
              const on = tab === id
              return (
                <button key={id} onClick={() => setTab(id)}
                  style={{
                    flex: 1, padding: '14px 0', border: 'none', cursor: 'pointer', background: 'none',
                    fontSize: 16, fontWeight: 800, letterSpacing: '0.05em',
                    color: on ? '#fe0000' : '#999',
                    borderBottom: on ? '3px solid #fe0000' : '3px solid transparent',
                  }}>
                  {label}
                </button>
              )
            })}
          </div>

          <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
            <DrawingCanvas />
            <DrawingTools />
            <CommandBar />
          </div>
        </>
      )}
    </div>
  )
}
