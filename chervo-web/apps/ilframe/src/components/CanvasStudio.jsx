import { useEffect, useRef } from 'react'
import { useDrawingStore } from '../store/drawingStore'
import canvasHtml from '../studio/canvas.html?raw'

// Monta el canvas de dibujo (studio) y lo conecta con la caja de proyectos:
// carga el dibujo del proyecto al abrir y guarda cada cambio (persistencia
// por proyecto vía el store). El canvas mantiene su propia lógica/herramientas.
export default function CanvasStudio() {
  const frameRef = useRef(null)
  const readyRef = useRef(false)

  useEffect(() => {
    const post = (msg) => { const f = frameRef.current; if (f && f.contentWindow) f.contentWindow.postMessage(msg, '*') }
    const sendLoad = () => {
      const s = useDrawingStore.getState()
      post({ ilframe: 'load', objects: s.studio || [], meta: s.studioMeta || {} })
    }
    const onMsg = (e) => {
      const d = e.data || {}
      if (d.ilframe === 'ready') { readyRef.current = true; sendLoad() }
      else if (d.ilframe === 'studio') {
        useDrawingStore.getState().setStudio(d.objects || [])
        if (d.meta) useDrawingStore.setState({ studioMeta: d.meta })
      }
    }
    window.addEventListener('message', onMsg)
    // por si el iframe ya estaba listo antes de montar el listener
    const t = setTimeout(() => { if (readyRef.current) sendLoad() }, 300)
    return () => { window.removeEventListener('message', onMsg); clearTimeout(t) }
  }, [])

  return (
    <iframe
      ref={frameRef}
      title="Plano"
      srcDoc={canvasHtml}
      style={{ flex: 1, width: '100%', height: '100%', border: 'none', display: 'block', background: '#f9f9f9' }}
    />
  )
}
