// Editor interactivo de una cara de muro
// Muestra el rectangulo a escala, permite hacer click para agregar aberturas

import { useState, useRef } from 'react'
import { nanoid } from '../utils/nanoid'

const SCALE = 0.12  // px por mm

export default function FaceEditor({ face, onAddOpening, onRemoveOpening }) {
  const [adding, setAdding] = useState(null)  // { x_pct } posicion en porcentaje del ancho
  const [form, setForm] = useState({ type: 'door', width: 900, height: 2050, sill_height: 0 })
  const svgRef = useRef()

  const W = face.width  || 3000
  const H = face.height || 2400
  const svgW = W * SCALE
  const svgH = H * SCALE

  function handleSvgClick(e) {
    const rect = svgRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const mmX = clickX / SCALE
    setAdding({ offset_x: Math.max(0, Math.min(mmX - form.width / 2, W - form.width)) })
  }

  function confirmOpening() {
    onAddOpening({
      id: nanoid(),
      type: form.type,
      width: +form.width,
      height: +form.height,
      offset_x: adding.offset_x,
      sill_height: form.type === 'door' ? 0 : +form.sill_height,
    })
    setAdding(null)
  }

  return (
    <div className="space-y-3">

      {/* SVG de la cara */}
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          width={svgW + 30}
          height={svgH + 30}
          viewBox={`-15 -5 ${svgW + 30} ${svgH + 30}`}
          className="cursor-crosshair block"
          onClick={handleSvgClick}
        >
          {/* fondo cara */}
          <rect x={0} y={0} width={svgW} height={svgH}
            fill="#f9fafb" stroke="#9ca3af" strokeWidth={1.5} />

          {/* aberturas existentes */}
          {(face.openings || []).map(op => {
            const ox = (op.offset_x || 0) * SCALE
            const oy = (H - (op.sill_height || 0) - op.height) * SCALE
            const ow = op.width * SCALE
            const oh = op.height * SCALE
            return (
              <g key={op.id}>
                <rect x={ox} y={oy} width={ow} height={oh}
                  fill="white" stroke="#dc2626" strokeWidth={1.5} />
                <text x={ox + ow/2} y={oy + oh/2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={Math.max(8, ow * 0.2)} fill="#dc2626" fontWeight="600">
                  {op.type === 'door' ? 'P' : 'V'}
                </text>
                <text x={ox + ow/2} y={oy + oh/2 + 12}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={7} fill="#6b7280">
                  {(op.width/1000).toFixed(2)}x{(op.height/1000).toFixed(2)}
                </text>
                <rect
                  x={ox + ow - 10} y={oy} width={10} height={10}
                  fill="#dc2626" rx={2}
                  style={{ cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); onRemoveOpening(op.id) }}
                />
                <text x={ox + ow - 5} y={oy + 7}
                  textAnchor="middle" fontSize={8} fill="white"
                  style={{ pointerEvents: 'none' }}>x</text>
              </g>
            )
          })}

          {/* preview de la abertura que se esta colocando */}
          {adding && (() => {
            const ox = adding.offset_x * SCALE
            const oy = (form.type === 'door' ? (H - form.height) : (H - +form.sill_height - +form.height)) * SCALE
            const ow = +form.width * SCALE
            const oh = +form.height * SCALE
            return (
              <rect x={ox} y={oy} width={ow} height={oh}
                fill="rgba(220,38,38,0.15)" stroke="#dc2626"
                strokeWidth={1.5} strokeDasharray="4,3" />
            )
          })()}

          {/* cota ancho */}
          <line x1={0} y1={svgH + 10} x2={svgW} y2={svgH + 10} stroke="#9ca3af" strokeWidth={1} />
          <text x={svgW/2} y={svgH + 20} textAnchor="middle" fontSize={9} fill="#6b7280">
            {(W/1000).toFixed(2)} m
          </text>

          {/* cota alto */}
          <line x1={-8} y1={0} x2={-8} y2={svgH} stroke="#9ca3af" strokeWidth={1} />
          <text x={-12} y={svgH/2} textAnchor="middle" fontSize={9} fill="#6b7280"
            transform={`rotate(-90, -12, ${svgH/2})`}>
            {(H/1000).toFixed(2)} m
          </text>
        </svg>
      </div>

      {/* instruccion */}
      {!adding && (
        <p className="text-xs text-gray-400">
          Hace click en la cara para colocar una abertura
        </p>
      )}

      {/* formulario de abertura */}
      {adding && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
          <div className="text-sm font-semibold text-gray-700">Nueva abertura</div>

          <div className="flex gap-2">
            <button
              onClick={() => setForm(f => ({ ...f, type: 'door', height: 2050, sill_height: 0 }))}
              className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                form.type === 'door' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              Puerta
            </button>
            <button
              onClick={() => setForm(f => ({ ...f, type: 'window', height: 900, sill_height: 900 }))}
              className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                form.type === 'window' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              Ventana
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ancho (mm)</label>
              <input type="number" step="50"
                className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-red-400"
                value={form.width}
                onChange={e => setForm(f => ({ ...f, width: +e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Alto (mm)</label>
              <input type="number" step="50"
                className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-red-400"
                value={form.height}
                onChange={e => setForm(f => ({ ...f, height: +e.target.value }))}
              />
            </div>
            {form.type === 'window' && (
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Alfeizar desde piso (mm)</label>
                <input type="number" step="50"
                  className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-red-400"
                  value={form.sill_height}
                  onChange={e => setForm(f => ({ ...f, sill_height: +e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setAdding(null)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded py-1.5 text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmOpening}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded py-1.5 text-xs font-semibold transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
