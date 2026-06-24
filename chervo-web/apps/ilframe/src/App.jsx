import { useState } from 'react'
import DrawingCanvas from './components/DrawingCanvas'
import CommandBar from './components/CommandBar'
import ProjectPanel from './components/ProjectPanel'
import DrawingTools from './components/DrawingTools'
import BOMView from './components/BOMView'

export default function App() {
  const [bomOpen, setBomOpen] = useState(true)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', overflow: 'hidden',
      fontFamily: "'Exo', system-ui, sans-serif",
      background: 'white', userSelect: 'none',
    }}>

      {/* ── Header ── */}
      <header style={{
        height: 52, background: 'white', borderBottom: '1px solid #e8e8e8',
        flexShrink: 0, display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#fe0000' }}>iL</span><span style={{ color: '#888' }}>Frame</span>
          </div>
          <div style={{ color: '#bbb', fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 2 }}>
            Steel framing CAD
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* BOM toggle */}
        <button
          onClick={() => setBomOpen(!bomOpen)}
          style={{
            padding: '5px 12px', borderRadius: 5,
            background: bomOpen ? '#1a1a1a' : '#f5f5f5',
            color: bomOpen ? 'white' : '#555',
            border: 'none', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 14 }}>≡</span>
          Materiales
        </button>
      </header>

      {/* ── Main ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

        {/* Left: Project panel */}
        <ProjectPanel />

        {/* Center: Canvas area + CommandBar */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Canvas wrapper — DrawingTools floats inside this, NOT over CommandBar */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
            <DrawingCanvas />
            <DrawingTools />
          </div>
          <CommandBar />
        </div>

        {/* Right: BOM panel */}
        {bomOpen && (
          <div style={{
            width: 300, minWidth: 300, background: 'white',
            borderLeft: '1px solid #e8e8e8',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 14px', borderBottom: '1px solid #f0f0f0',
              fontSize: 10, fontWeight: 700, color: '#aaa',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Lista de materiales
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <BOMView />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
