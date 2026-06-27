import { useDrawingStore, panelPolygon } from '../store/drawingStore'
import { projectBOM } from '../engine/bom'

// ── SVG de planta ──
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
    g += `<text x="${mx}" y="${my - 6}" font-size="14" font-weight="bold" fill="#c00000" text-anchor="middle">${p.id}</text>`
    g += `<text x="${mx}" y="${my + 12}" font-size="10" fill="#666" text-anchor="middle">${(p.width / 1000).toFixed(2)} m</text>`
  }
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:760px;border:1px solid #ddd">${g}</svg>`
}

// ── SVG de una cara (alzado, verdadera magnitud) ──
function faceSVG(panel) {
  const w = panel.width
  const maxH = Math.max(...panel.topPath.map((p) => p[1]))
  const W = 380, H = 260, m = 30, bot = 26
  const s = Math.min((W - 2 * m) / (w || 1), (H - m - bot) / (maxH || 1))
  const ox = m + ((W - 2 * m) - w * s) / 2, oy = H - bot
  const V = ([x, y]) => [ox + (panel.flip ? (w - x) : x) * s, oy - y * s]
  const poly = panelPolygon(panel).map(V).map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  let g = `<polygon points="${poly}" fill="rgba(200,0,0,0.06)" stroke="#c00000" stroke-width="2"/>`
  const a0 = V([0, 0]), b0 = V([w, 0])
  g += `<line x1="${a0[0]}" y1="${a0[1]}" x2="${b0[0]}" y2="${b0[1]}" stroke="#444" stroke-width="3.5"/>`
  for (const op of panel.openings || []) {
    const c = [[op.offset, op.sill], [op.offset + op.width, op.sill], [op.offset + op.width, op.sill + op.height], [op.offset, op.sill + op.height]].map(V)
    g += `<polygon points="${c.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}" fill="#fff" stroke="#0a6" stroke-width="1.5"/>`
    const cx = (c[0][0] + c[2][0]) / 2, cy = (c[0][1] + c[2][1]) / 2
    g += `<text x="${cx}" y="${cy}" font-size="10" fill="#0a6" text-anchor="middle">${op.kind === 'door' ? 'P' : op.kind === 'window' ? 'V' : 'A'} ${(op.width / 1000).toFixed(2)}x${(op.height / 1000).toFixed(2)}</text>`
  }
  g += `<text x="${(a0[0] + b0[0]) / 2}" y="${oy + 16}" font-size="10" fill="#444" text-anchor="middle">${(w / 1000).toFixed(2)} m</text>`
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;border:1px solid #eee">${g}</svg>`
}

function printDoc(panels, project, bom) {
  const date = new Date().toLocaleDateString('es-UY')
  const faces = panels.map((p) => {
    const r = bom.rows.find((x) => x.id === p.id) || {}
    return `<div style="break-inside:avoid;width:48%;display:inline-block;vertical-align:top;margin:0 1% 14px">
      <div style="font-weight:800;color:#c00000">${p.id} <span style="color:#888;font-weight:400;font-size:11px">${r.perfil || ''}</span></div>
      ${faceSVG(p)}
      <div style="font-size:11px;color:#555">${r.aceroKg || 0} kg · ${r.placas || 0} placas · ${r.tornillos || 0} tornillos</div>
    </div>`
  }).join('')
  const matRows = bom.materials.map((mt) => `<tr><td style="padding:3px 8px">${mt.name}</td><td style="padding:3px 8px;text-align:right;font-weight:600">${mt.qty}</td><td style="padding:3px 8px">${mt.unit}</td></tr>`).join('')
  return `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;padding:6px">
    <div style="border-bottom:3px solid #c00000;padding-bottom:8px;margin-bottom:16px">
      <div style="font-size:24px;font-weight:900"><span style="color:#c00000">iL</span>Frame</div>
      <div style="font-size:16px;font-weight:700">${project.name}</div>
      <div style="font-size:11px;color:#888">${date} · ${panels.length} paneles · ${bom.total.aceroKg} kg acero · ${bom.total.placas} placas</div>
    </div>
    <h3 style="font-size:13px;color:#444">PLANTA</h3>
    ${planSVG(panels)}
    <h3 style="font-size:13px;color:#444;margin-top:18px">CARAS (verdadera magnitud)</h3>
    <div>${faces}</div>
    <h3 style="font-size:13px;color:#444;margin-top:18px;break-before:page">LISTA DE MATERIALES</h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="border-bottom:2px solid #ddd"><th style="text-align:left;padding:4px 8px">Material</th><th style="text-align:right;padding:4px 8px">Cantidad</th><th style="text-align:left;padding:4px 8px">Unidad</th></tr></thead>
      <tbody>${matRows}</tbody>
    </table>
  </div>`
}

export default function ExportView() {
  const panels = useDrawingStore((s) => s.panels)
  const project = useDrawingStore((s) => s.project)
  const has = panels.length > 0
  const bom = has ? projectBOM(panels, project) : null

  const xlsx = async (which) => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    if (which !== 'partes') {
      const matRows = [['Material', 'Cantidad', 'Unidad'], ...bom.materials.map((m) => [m.name, m.qty, m.unit])]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(matRows), 'Materiales')
    }
    if (which !== 'materiales') {
      const rows = [['Panel', 'Perfil', 'm² neto', 'Montantes', 'Soleras ml', 'Refuerzos ml', 'Acero ml', 'Acero kg', 'Placas', 'Torn. estr.', 'Torn. placa'],
        ...bom.rows.map((r) => [r.id, r.perfil, r.netM2, r.studs, r.solerasMl, r.refuerzosMl, r.aceroMl, r.aceroKg, r.placas, r.tornillosEst, r.tornillosPlaca])]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Lista de partes')
    }
    XLSX.writeFile(wb, `${(project.name || 'proyecto').replace(/\s+/g, '_')}_${which}.xlsx`)
  }

  const printPlanos = () => {
    let el = document.getElementById('ilf-print')
    if (!el) { el = document.createElement('div'); el.id = 'ilf-print'; document.body.appendChild(el) }
    el.innerHTML = printDoc(panels, project, bom)
    const clean = () => { el.innerHTML = '' }
    window.addEventListener('afterprint', clean, { once: true })
    window.print()
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: '#fafafa', padding: 16 }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Salida — {project.name}
        </div>
        {!has && <div style={{ color: '#bbb', marginBottom: 12 }}>Dibujá muros para habilitar las salidas.</div>}
        <ExpCard has={has} title="↓ Excel · Lista de materiales" desc="Cómputo total de materiales (acero, placas, aislante, tornillos, pintura…)." color="#217346" onClick={() => xlsx('materiales')} />
        <ExpCard has={has} title="↓ Excel · Lista de partes" desc="Detalle por panel: perfil, ml, kg, placas y tornillos." color="#217346" onClick={() => xlsx('partes')} />
        <ExpCard has={has} title="↓ Excel · Completo" desc="Materiales + lista de partes en un solo archivo." color="#1b5e20" onClick={() => xlsx('completo')} />
        <ExpCard has={has} title="🖨 Planos / Gráficos (PDF)" desc="Planta + cada cara en verdadera magnitud + lista de materiales. Imprimí o guardá como PDF." color="#c00000" onClick={printPlanos} />
      </div>
    </div>
  )
}

function ExpCard({ has, title, desc, color, onClick }) {
  return (
    <button onClick={onClick} disabled={!has}
      style={{ display: 'block', width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #ececec', borderLeft: `4px solid ${color}`, borderRadius: 12, padding: '16px 18px', marginBottom: 12, cursor: has ? 'pointer' : 'default', opacity: has ? 1 : 0.5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#222' }}>{title}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{desc}</div>
    </button>
  )
}
