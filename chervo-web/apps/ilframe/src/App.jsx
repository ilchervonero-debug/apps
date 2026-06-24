import { useState } from 'react'
import DrawingCanvas from './components/DrawingCanvas'
import CommandBar from './components/CommandBar'
import SidePanel from './components/SidePanel'
import DrawingTools from './components/DrawingTools'

export default function App() {
  const [sideMenuOpen, setSideMenuOpen] = useState(false)

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', fontFamily: "'Exo', system-ui, sans-serif", background: 'white', userSelect: 'none' }}
    >

      {/* ── Topbar ── */}
      <header style={{ height: 64, background: 'white', borderBottom: '1px solid #e0e0e0', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
        <button
          onClick={() => setSideMenuOpen(!sideMenuOpen)}
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: sideMenuOpen ? '#fe0000' : '#f5f5f5',
            border: 'none',
            color: sideMenuOpen ? '#fff' : '#666',
            fontSize: 24,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
            fontWeight: 'bold'
          }}
        >
          {sideMenuOpen ? '×' : '≡'}
        </button>
        <div style={{ paddingLeft: 6 }}>
          <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#fe0000' }}>iL</span><span style={{ color: '#888' }}>Frame</span>
          </div>
          <div style={{ color: '#999', fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 3 }}>Acero estructural</div>
        </div>
        <div style={{ flex: 1 }} />
      </header>

      {/* ── Main Layout: Panel + Canvas ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Panel Lateral - overlay sobre el canvas */}
        {sideMenuOpen && (
          <>
            <div
              onClick={() => setSideMenuOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 99 }}
            />
            <div style={{ position: 'absolute', top: 0, left: 0, width: 'min(280px, 85vw)', height: '100%', background: 'white', borderRight: '1px solid #e0e0e0', overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 100, boxShadow: '4px 0 24px rgba(0,0,0,0.12)' }}>
              <SidePanel isOpen={true} onToggle={() => setSideMenuOpen(false)} />
            </div>
          </>
        )}

        {/* Canvas + CommandBar */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <DrawingCanvas />
          <CommandBar />
        </div>

        {/* Drawing Tools - Always Visible */}
        <DrawingTools />
      </div>
    </div>
  )
}
