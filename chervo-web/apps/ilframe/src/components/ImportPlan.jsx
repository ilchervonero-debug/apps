import { useState, useRef } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { nanoid } from '../utils/nanoid'

const STATE = { idle: 'idle', loading: 'loading', preview: 'preview', error: 'error' }

export default function ImportPlan({ onClose }) {
  const [state, setState] = useState(STATE.idle)
  const [preview, setPreview] = useState(null)   // imagen para mostrar
  const [result, setResult] = useState(null)      // JSON de Claude
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()
  const { rooms, addRoom, updateRoom, setActiveRoom } = useProjectStore()

  async function analyze(file) {
    setState(STATE.loading)
    setError('')

    // Preview de imagen
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(file)

    try {
      const form = new FormData()
      form.append('image', file)

      const resp = await fetch('/api/analyze-plan', {
        method: 'POST',
        body: form,
      })

      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.error || `HTTP ${resp.status}`)
      }

      const data = await resp.json()
      setResult(data)
      setState(STATE.preview)
    } catch (err) {
      setError(err.message)
      setState(STATE.error)
    }
  }

  function onFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Usá imagen (JPG, PNG, WEBP) o PDF')
      setState(STATE.error)
      return
    }
    analyze(file)
  }

  function importResult() {
    if (!result?.rooms) return

    for (const room of result.rooms) {
      const id = nanoid()
      // Usar addRoom y luego updateRoom con todos los datos
      const store = useProjectStore.getState()
      const newId = store.addRoom()
      store.updateRoom(newId, {
        name: room.name || `Ambiente importado`,
        points: room.points || [],
        closed: (room.points?.length >= 3),
        wallProps: room.wallProps || {},
        roof: room.roof || { type: 4, slope_pct: 0, ridge_height: 0 },
      })
      store.setActiveRoom(newId)
    }
    onClose()
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <div>
            <div className="font-bold text-gray-900">Importar plano</div>
            <div className="text-xs text-gray-400 mt-0.5">Gemini lee el bosquejo y detecta muros y aberturas</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-xl leading-none">x</button>
        </div>

        <div className="p-5 space-y-4">

          {/* Drop zone */}
          {state === STATE.idle && (
            <div
              className={`
                border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all
                ${dragOver ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
              `}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-gray-400 text-sm font-medium mb-1 text-4xl">[ ]</div>
              <div className="text-gray-900 font-medium mb-1">Solta el plano aca o hace click</div>
              <div className="text-gray-400 text-sm">JPG, PNG, WEBP — foto con el celular tambien funciona</div>
              <div className="text-gray-300 text-xs mt-2">Hasta 20MB</div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => onFile(e.target.files[0])}
              />
            </div>
          )}

          {/* Loading */}
          {state === STATE.loading && (
            <div className="flex flex-col items-center gap-4 py-10">
              {preview && (
                <img src={preview} alt="plano" className="max-h-48 rounded border border-gray-200 object-contain" />
              )}
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span>Analizando el plano...</span>
              </div>
              <div className="text-xs text-gray-400">Detectando muros, aberturas y dimensiones</div>
            </div>
          )}

          {/* Error */}
          {state === STATE.error && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-600 font-medium mb-1">Error al analizar</div>
                <div className="text-red-500 text-sm">{error}</div>
                {(error.includes('API') || error.includes('key')) && (
                  <div className="text-gray-500 text-xs mt-2">
                    Configura tu <code className="text-red-600">GEMINI_API_KEY</code> en las variables de entorno de Vercel
                  </div>
                )}
              </div>
              <button
                onClick={() => setState(STATE.idle)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg py-2 text-sm transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Preview resultado */}
          {state === STATE.preview && result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {preview && (
                  <img src={preview} alt="plano" className="rounded border border-gray-200 object-contain max-h-48 w-full" />
                )}
                <div className="space-y-2">
                  <div className={`
                    text-xs px-2 py-1 rounded inline-block font-medium
                    ${result.confidence === 'high' ? 'bg-green-100 text-green-700' :
                      result.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'}
                  `}>
                    Confianza: {result.confidence || 'desconocida'}
                  </div>
                  {result.scale_note && (
                    <div className="text-xs text-gray-500 bg-gray-100 rounded p-2">
                      {result.scale_note}
                    </div>
                  )}
                  {result.notes && (
                    <div className="text-xs text-gray-400 bg-gray-50 rounded p-2">
                      {result.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Ambientes detectados */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  {result.rooms?.length || 0} ambiente{result.rooms?.length !== 1 ? 's' : ''} detectado{result.rooms?.length !== 1 ? 's' : ''}
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(result.rooms || []).map((room, i) => {
                    const wallCount = room.points?.length || 0
                    const openingCount = Object.values(room.wallProps || {})
                      .reduce((a, w) => a + (w.openings?.length || 0), 0)
                    const xs = (room.points || []).map(p => p.x)
                    const ys = (room.points || []).map(p => p.y)
                    const w = xs.length ? Math.max(...xs) - Math.min(...xs) : 0
                    const h = ys.length ? Math.max(...ys) - Math.min(...ys) : 0
                    return (
                      <div key={i} className="bg-gray-100 rounded px-3 py-2 flex justify-between items-center">
                        <div>
                          <div className="text-gray-900 text-sm font-medium">{room.name}</div>
                          <div className="text-xs text-gray-500">
                            {(w/1000).toFixed(2)}m x {(h/1000).toFixed(2)}m
                            · {wallCount} muros
                            {openingCount > 0 && ` · ${openingCount} abertura${openingCount !== 1 ? 's' : ''}`}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {room.roof?.type === 4 ? 'plano' : `${room.roof?.type || 4} aguas`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setState(STATE.idle)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg py-2.5 text-sm transition-colors"
                >
                  Cambiar imagen
                </button>
                <button
                  onClick={importResult}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
                >
                  Importar al proyecto
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
