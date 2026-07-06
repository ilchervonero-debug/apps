import { useDrawingStore, panelPolygon } from '../store/drawingStore'
import { computoProyecto } from '../engine/computo'
import { PROFILE_SECTIONS } from '../data/profiles'
import { trussGeometry } from '../engine/trusses'
import { columnaGeometry } from '../engine/pilares'
import { roofGeometry } from '../engine/roofs'
import { slabGeometry, slabCanto } from '../engine/slabs'

// ── SVG de planta (muros) ──
function planSVG(panels) {
  const pts = panels.flatMap((p) => [p.a, p.b])
  if (!pts.length) return ''
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys)
  const W = 800, H = 520, m = 36
  const s = Math.min((W - 2 * m) / ((maxx - minx) || 1), (H - 2 * m) / ((maxy - miny) || 1))
  const X = (x) => m + (x - minx) * s
  const Y = (y) => H - (m + (y - miny) * s)
  let g = ''
  for (const p of panels) {
    const a = p.a, b = p.b
    g += `<line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>`
    const mx = (X(a[0]) + X(b[0])) / 2, my = (Y(a[1]) + Y(b[1])) / 2
    g += `<text x="${mx}" y="${my - 6}" font-size="14" fill="#c00000" text-anchor="middle">${p.id}</text>`
    g += `<text x="${mx}" y="${my + 12}" font-size="10" fill="#666" text-anchor="middle">${(p.width / 1000).toFixed(2)} m</text>`
  }
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:760px;border:1px solid #ddd">${g}</svg>`
}

// ── Escalador genérico de segmentos {seg:[[x,y],[x,y]], red} ──
function partsSVG(parts, W = 360, H = 210, pad = 26) {
  if (!parts.length) return ''
  const P = parts.flatMap((p) => p.seg)
  const minx = Math.min(...P.map((p) => p[0])), maxx = Math.max(...P.map((p) => p[0]))
  const miny = Math.min(...P.map((p) => p[1])), maxy = Math.max(...P.map((p) => p[1]))
  const bw = (maxx - minx) || 1, bh = (maxy - miny) || 1
  const s = Math.min((W - 2 * pad) / bw, (H - 2 * pad) / bh)
  const ox = (W - bw * s) / 2, oy = (H - bh * s) / 2
  const T = ([x, y]) => [ox + (x - minx) * s, (H - oy) - (y - miny) * s]
  const lines = parts.map((p) => {
    const a = T(p.seg[0]), b = T(p.seg[1])
    return `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${p.red ? '#c00000' : '#8a8a8a'}" stroke-width="${p.red ? 2.2 : 1.2}" stroke-linecap="round"/>`
  }).join('')
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;border:1px solid #eee">${lines}</svg>`
}

// ── SVG por pieza de cada elemento ──
function faceSVG(panel) {
  const w = panel.width
  const maxH = Math.max(...panel.topPath.map((p) => p[1]))
  const W = 380, H = 240, m = 30, bot = 26
  const s = Math.min((W - 2 * m) / (w || 1), (H - m - bot) / (maxH || 1))
  const ox = m + ((W - 2 * m) - w * s) / 2, oy = H - bot
  const V = ([x, y]) => [ox + (panel.flip ? (w - x) : x) * s, oy - y * s]
  const poly = panelPolygon(panel).map(V).map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  let g = `<polygon points="${poly}" fill="rgba(28,28,28,0.05)" stroke="#c00000" stroke-width="2"/>`
  const a0 = V([0, 0]), b0 = V([w, 0])
  g += `<line x1="${a0[0]}" y1="${a0[1]}" x2="${b0[0]}" y2="${b0[1]}" stroke="#444" stroke-width="3.5"/>`
  for (const op of panel.openings || []) {
    const c = [[op.offset, op.sill], [op.offset + op.width, op.sill], [op.offset + op.width, op.sill + op.height], [op.offset, op.sill + op.height]].map(V)
    g += `<polygon points="${c.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}" fill="#fff" stroke="#0a6" stroke-width="1.5"/>`
  }
  g += `<text x="${(a0[0] + b0[0]) / 2}" y="${oy + 16}" font-size="10" fill="#444" text-anchor="middle">${(w / 1000).toFixed(2)} m</text>`
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;border:1px solid #eee">${g}</svg>`
}
function cerchaSVG(c) {
  const g = trussGeometry(c)
  return partsSVG([...g.chordTop.map((seg) => ({ seg, red: true })), ...g.chordBot.map((seg) => ({ seg, red: true })), ...g.web.map((seg) => ({ seg, red: false }))])
}
function columnaSVG(p) {
  const g = columnaGeometry(p)
  return partsSVG([...g.chords.map((seg) => ({ seg, red: true })), ...g.web.map((seg) => ({ seg, red: false }))], 220, 300)
}
function techoSVG(t) {
  const g = roofGeometry(t), H = t.alturaPico || 1500, tW = g.totalW
  const pts = (t.forma || 'DOS_AGUAS') === 'UN_AGUA' ? [[0, 0], [tW, H]] : [[0, 0], [tW / 2, H], [tW, 0]]
  const parts = []
  for (let i = 0; i < pts.length - 1; i++) parts.push({ seg: [pts[i], pts[i + 1]], red: true })
  parts.push({ seg: [[0, 0], [tW, 0]], red: false })
  return partsSVG(parts)
}
function losaSVG(lo) {
  const g = slabGeometry(lo), canto = slabCanto(lo)
  const parts = [
    { seg: [[0, 0], [g.span, 0]], red: true }, { seg: [[0, canto], [g.span, canto]], red: true },
    { seg: [[0, 0], [0, canto]], red: false }, { seg: [[g.span, 0], [g.span, canto]], red: false },
  ]
  const dir = lo.dir || 'x'
  if (dir) for (let x = g.span / 6; x < g.span; x += g.span / 6) parts.push({ seg: [[x, 0], [x, canto]], red: false })
  return partsSVG(parts, 360, 150)
}
function vigaSVG(b) {
  const sec = (PROFILE_SECTIONS[b.normId]?.C || [])[b.secIdx]
  const h = sec ? sec.h : 150, span = b.span
  const parts = [
    { seg: [[0, 0], [span, 0]], red: true }, { seg: [[0, h], [span, h]], red: true },
    { seg: [[0, 0], [0, h]], red: true }, { seg: [[span, 0], [span, h]], red: true },
  ]
  return partsSVG(parts, 360, 120)
}

function pieceSVG(tipo, el) {
  if (tipo === 'muros') return faceSVG(el)
  if (tipo === 'vigas') return vigaSVG(el)
  if (tipo === 'cerchas') return cerchaSVG(el)
  if (tipo === 'pilares') return el.kind === 'reticulada' ? columnaSVG(el) : ''
  if (tipo === 'techos') return techoSVG(el)
  if (tipo === 'losas') return losaSVG(el)
  return ''
}

function printDoc(state, project, comp) {
  const date = new Date().toLocaleDateString('es-UY')
  const arrByTipo = { muros: state.panels, vigas: state.beams, cerchas: state.cerchas, pilares: state.pilares, techos: state.techos, losas: state.losas }
  let piezas = ''
  for (const g of comp.grupos) {
    const arr = arrByTipo[g.tipo] || []
    const cards = arr.map((el) => {
      const svg = pieceSVG(g.tipo, el)
      const fila = g.filas.find((f) => f.id === el.id) || {}
      return `<div style="break-inside:avoid;width:31%;display:inline-block;vertical-align:top;margin:0 1% 12px">
        <div style="font-weight:600;color:#c00000">${el.id} <span style="color:#888;font-weight:400;font-size:10px">${fila.perfil || ''}</span></div>
        ${svg}
        <div style="font-size:10px;color:#555">${fila.kg || 0} kg${fila.extra ? ' · ' + fila.extra : ''}</div>
      </div>`
    }).join('')
    if (cards) piezas += `<h3 style="font-size:13px;color:#444;margin-top:16px">${g.label.toUpperCase()}</h3><div>${cards}</div>`
  }
  const matRows = comp.materiales.map((mt) => `<tr><td style="padding:3px 8px">${mt.name}</td><td style="padding:3px 8px;text-align:right;font-weight:500">${mt.qty}</td><td style="padding:3px 8px">${mt.unit}</td></tr>`).join('')
  return `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;padding:6px">
    <div style="border-bottom:3px solid #c00000;padding-bottom:8px;margin-bottom:16px">
      <div style="font-size:24px;font-weight:800"><span style="color:#c00000">iL</span>Frame</div>
      <div style="font-size:16px;font-weight:500">${project.name}</div>
      <div style="font-size:11px;color:#888">${date} · ${comp.totales.piezas} piezas · ${comp.totales.aceroKg} kg acero</div>
    </div>
    ${state.panels.length ? `<h3 style="font-size:13px;color:#444">PLANTA (muros)</h3>${planSVG(state.panels)}` : ''}
    ${piezas}
    <h3 style="font-size:13px;color:#444;margin-top:18px;break-before:page">LISTA DE MATERIALES</h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="border-bottom:2px solid #ddd"><th style="text-align:left;padding:4px 8px">Material</th><th style="text-align:right;padding:4px 8px">Cantidad</th><th style="text-align:left;padding:4px 8px">Unidad</th></tr></thead>
      <tbody>${matRows}</tbody>
    </table>
  </div>`
}

export default function ExportView() {
  const state = useDrawingStore((s) => s)
  const project = state.project
  const comp = computoProyecto(state, project)
  const has = comp.grupos.length > 0

  const xlsx = async (which) => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    if (which !== 'partes') {
      const matRows = [['Material', 'Cantidad', 'Unidad'], ...comp.materiales.map((m) => [m.name, m.qty, m.unit])]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(matRows), 'Materiales')
    }
    if (which !== 'materiales') {
      const rows = [['Elemento', 'Pieza', 'Perfil', 'Detalle', 'Acero kg', 'Extra']]
      for (const g of comp.grupos) for (const f of g.filas) rows.push([g.label, f.id, f.perfil, f.det, f.kg, f.extra])
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Lista de partes')
    }
    XLSX.writeFile(wb, `${(project.name || 'proyecto').replace(/\s+/g, '_')}_${which}.xlsx`)
  }

  const printPlanos = () => {
    let el = document.getElementById('ilf-print')
    if (!el) { el = document.createElement('div'); el.id = 'ilf-print'; document.body.appendChild(el) }
    el.innerHTML = printDoc(state, project, comp)
    window.addEventListener('afterprint', () => { el.innerHTML = '' }, { once: true })
    window.print()
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: '#f7f7f8', padding: 16 }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Salida — {project.name}
        </div>
        {!has && <div style={{ color: '#9a9a9a', marginBottom: 12, fontSize: 16 }}>Dibujá elementos para habilitar las salidas.</div>}
        <ExpCard has={has} icon="xls" title="Excel · Lista de materiales" desc="Cómputo consolidado de todos los elementos (acero por perfil, placas, chapa, deck, tornillos…)." color="#217346" onClick={() => xlsx('materiales')} />
        <ExpCard has={has} icon="xls" title="Excel · Lista de partes" desc="Detalle por pieza de cada elemento: perfil, medidas y kg." color="#217346" onClick={() => xlsx('partes')} />
        <ExpCard has={has} icon="xls" title="Excel · Completo" desc="Materiales + lista de partes en un solo archivo." color="#1b5e20" onClick={() => xlsx('completo')} />
        <ExpCard has={has} icon="print" title="Planos / Gráficos (PDF)" desc="Planta + el dibujo de cada pieza (muros, vigas, cerchas, columnas, techos, losas) + lista de materiales." color="#c00000" onClick={printPlanos} />
      </div>
    </div>
  )
}

function OutIcon({ type, color }) {
  const c = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'print') return <svg {...c}><path d="M6 9V3h12v6" /><rect x="6" y="14" width="12" height="7" /><path d="M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" /></svg>
  return <svg {...c}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13l2 3 2-3" /><path d="M11 16v-3" /></svg>
}

function ExpCard({ has, title, desc, color, onClick, icon }) {
  return (
    <button onClick={onClick} disabled={!has}
      style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #ececec', borderLeft: `4px solid ${color}`, borderRadius: 12, padding: '16px 18px', marginBottom: 12, cursor: has ? 'pointer' : 'default', opacity: has ? 1 : 0.5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <OutIcon type={icon} color={color} />
      <span>
        <div style={{ fontSize: 16, fontWeight: 500, color: '#1c1c1c' }}>{title}</div>
        <div style={{ fontSize: 14, color: '#8a8a8a', marginTop: 3 }}>{desc}</div>
      </span>
    </button>
  )
}
