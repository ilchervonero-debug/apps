import DrawingCanvas from './components/DrawingCanvas'
import CommandBar from './components/CommandBar'
import DrawingTools from './components/DrawingTools'
import ProjectSetup from './components/ProjectSetup'
import Iso3D from './components/Iso3D'
import BomView from './components/BomView'
import ExportView from './components/ExportView'
import { useState } from 'react'
import { useDrawingStore } from './store/drawingStore'

export default function App() {
  const appView = useDrawingStore((s) => s.appView)
  const setAppView = useDrawingStore((s) => s.setAppView)
  const projectName = useDrawingStore((s) => s.project.name)
  const tab = useDrawingStore((s) => s.tab)
  const setTab = useDrawingStore((s) => s.setTab)
  const [info, setInfo] = useState(false)

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
        <div style={{ paddingLeft: appView === 'draw' ? 0 : 6, cursor: 'pointer' }} onClick={() => setInfo(true)}>
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
          <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid #e0e0e0', background: '#fff', overflowX: 'auto' }}>
            {[['plan', 'PLANTA'], ['elev', 'ALZADO'], ['3d', '3D'], ['bom', 'CÓMPUTO'], ['out', 'SALIDA']].map(([id, label]) => {
              const on = tab === id
              return (
                <button key={id} onClick={() => setTab(id)}
                  style={{
                    flex: '1 0 auto', minWidth: 74, padding: '14px 10px', border: 'none', cursor: 'pointer', background: 'none',
                    fontSize: 13, fontWeight: 800, letterSpacing: '0.02em', whiteSpace: 'nowrap',
                    color: on ? '#fe0000' : '#999',
                    borderBottom: on ? '3px solid #fe0000' : '3px solid transparent',
                  }}>
                  {label}
                </button>
              )
            })}
          </div>

          <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', display: 'flex' }}>
            {tab === '3d' ? (
              <Iso3D />
            ) : tab === 'bom' ? (
              <BomView />
            ) : tab === 'out' ? (
              <ExportView />
            ) : (
              <>
                <DrawingCanvas />
                <DrawingTools />
                <CommandBar />
              </>
            )}
          </div>
        </>
      )}

      {/* ── Panel iLStorage (version + volver al hub) ── */}
      {info && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setInfo(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 600, borderRadius: '22px 22px 0 0', padding: '8px 0 24px', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ width: 38, height: 4, borderRadius: 2, background: '#e2e2e2', margin: '6px auto 14px' }} />
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2b2b2b', padding: '0 22px', letterSpacing: '-0.3px' }}>
              <span style={{ color: '#fe0000', fontWeight: 800 }}>iL</span>Frame
            </div>
            <div style={{ fontSize: 12, color: '#8a8a8a', padding: '3px 22px 12px', fontWeight: 300 }}>versión 1.0</div>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 13, borderTop: '1px solid #f0f0f0', padding: '16px 22px', fontSize: 15, fontWeight: 600, color: '#2b2b2b', textDecoration: 'none' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              Volver a iLStorage
            </a>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#c4c4c4', fontWeight: 800, letterSpacing: '0.14em', padding: '16px 0 2px' }}>iLStorage</div>
          </div>
        </div>
      )}
    </div>
  )
}
