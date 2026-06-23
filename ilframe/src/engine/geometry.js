// ── Geometría de planta y generación de caras ──────────────

export function segmentLength(p1, p2) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
}

// Devuelve los segmentos (muros) de la planta cerrada
export function getWallSegments(points) {
  if (points.length < 2) return []
  const segs = []
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length
    segs.push({ idx: i, p1: points[i], p2: points[next] })
  }
  return segs
}

// Longitud del muro en mm
export function wallLength(points, wallIdx) {
  const segs = getWallSegments(points)
  const seg = segs[wallIdx]
  if (!seg) return 0
  return segmentLength(seg.p1, seg.p2)
}

// ── Cálculo de cara de muro ────────────────────────────────
// Retorna { width_mm, height_mm, net_m2, gross_m2, openings_m2 }
export function getFaceGeometry(points, wallIdx, wallProps) {
  const len = wallLength(points, wallIdx)
  const wp = wallProps[wallIdx] || {}
  const height = wp.height || 2400

  const gross_m2 = (len / 1000) * (height / 1000)

  const openings = wp.openings || []
  const openings_m2 = openings.reduce((acc, o) => {
    return acc + (o.width / 1000) * (o.height / 1000)
  }, 0)

  return {
    wall_idx: wallIdx,
    width_mm: len,
    height_mm: height,
    gross_m2,
    openings_m2,
    net_m2: Math.max(0, gross_m2 - openings_m2),
    openings,
  }
}

// ── Caída de techo ────────────────────────────────────────
// room_width_mm: ancho del ambiente en la dirección de caída
// slope_pct: pendiente en %
// tipo: 1=1agua, 2=2aguas, 3=3aguas, 4=4aguas/plano
export function getRoofGeometry(room, points) {
  const { roof } = room
  if (!roof || roof.slope_pct === 0 || roof.type === 4) {
    return { type: 'flat', planes: [] }
  }
  // Calcular el largo y ancho del polígono de planta
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const bbox_w = Math.max(...xs) - Math.min(...xs)
  const bbox_h = Math.max(...ys) - Math.min(...ys)

  const rise_per_mm = roof.slope_pct / 100
  const planes = []

  switch (roof.type) {
    case 1: {
      // 1 agua: toda la superficie inclinada
      const run = bbox_w
      const slope_len = Math.sqrt(run ** 2 + (run * rise_per_mm) ** 2)
      planes.push({ name: 'Techo', run_mm: run, slope_len_mm: slope_len, width_mm: bbox_h, slope_pct: roof.slope_pct })
      break
    }
    case 2: {
      // 2 aguas: dos planos simétricos
      const run = bbox_w / 2
      const slope_len = Math.sqrt(run ** 2 + (run * rise_per_mm) ** 2)
      planes.push({ name: 'Techo A', run_mm: run, slope_len_mm: slope_len, width_mm: bbox_h, slope_pct: roof.slope_pct })
      planes.push({ name: 'Techo B', run_mm: run, slope_len_mm: slope_len, width_mm: bbox_h, slope_pct: roof.slope_pct })
      break
    }
    case 3: {
      // 3 aguas: dos planos laterales + un frente
      const run_main = bbox_w / 2
      const sl_main = Math.sqrt(run_main ** 2 + (run_main * rise_per_mm) ** 2)
      planes.push({ name: 'Techo principal A', run_mm: run_main, slope_len_mm: sl_main, width_mm: bbox_h, slope_pct: roof.slope_pct })
      planes.push({ name: 'Techo principal B', run_mm: run_main, slope_len_mm: sl_main, width_mm: bbox_h, slope_pct: roof.slope_pct })
      const run_front = bbox_h / 2
      const sl_front = Math.sqrt(run_front ** 2 + (run_front * rise_per_mm) ** 2)
      planes.push({ name: 'Techo frente', run_mm: run_front, slope_len_mm: sl_front, width_mm: bbox_w, slope_pct: roof.slope_pct })
      break
    }
    case 4:
    default:
      break
  }

  return { type: `${roof.type}_aguas`, planes }
}

// ── Layout de emplacado ────────────────────────────────────
// Dado el ancho y alto de la cara (netos, sin aberturas incluidas en el layout)
// y el tamaño de la placa, devuelve el array de placas con su posición y si son completas o cortadas
export function calculateBoardLayout(face_w_mm, face_h_mm, board_w_mm, board_h_mm, openings = []) {
  const boards = []

  // Colocación horizontal (placas verticales, juntas cada board_w_mm)
  const cols = Math.ceil(face_w_mm / board_w_mm)
  const rows = Math.ceil(face_h_mm / board_h_mm)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * board_w_mm
      const y = row * board_h_mm
      const w = Math.min(board_w_mm, face_w_mm - x)
      const h = Math.min(board_h_mm, face_h_mm - y)

      const is_full = w === board_w_mm && h === board_h_mm

      // Verificar si la placa está cubierta por alguna abertura
      // (simplificado: si el centro cae dentro de una abertura es descartada)
      const cx = x + w / 2
      const cy = y + h / 2
      let covered_by_opening = false
      for (const op of openings) {
        // op.x = posición horizontal del borde izq de la abertura en la cara
        const op_x = op.offset_x || (face_w_mm / 2 - op.width / 2)
        const op_y = op.sill_height || 0  // altura del alfeizar desde el piso
        if (cx >= op_x && cx <= op_x + op.width && cy >= op_y && cy <= op_y + op.height) {
          covered_by_opening = true
          break
        }
      }

      boards.push({
        col, row, x, y,
        w_mm: w, h_mm: h,
        is_full,
        is_cut: !is_full,
        is_opening: covered_by_opening,
        // area neta de esta placa (descontando si es abertura)
        net_area_m2: covered_by_opening ? 0 : (w / 1000) * (h / 1000),
      })
    }
  }

  const total_boards = boards.filter(b => !b.is_opening).length
  const full_boards = boards.filter(b => b.is_full && !b.is_opening).length
  const cut_boards = boards.filter(b => b.is_cut && !b.is_opening).length

  return { boards, cols, rows, total_boards, full_boards, cut_boards }
}

// ── BOM de perfiles para un muro ──────────────────────────
// Devuelve { studs_count, studs_ml, track_ml, kg_total }
export function calcFramingBOM(face_w_mm, face_h_mm, stud_spacing_mm, profile) {
  const len_m = face_w_mm / 1000
  const h_m = face_h_mm / 1000

  // Montantes: arrancar y terminar + intermedios
  const studs_count = Math.floor(len_m / (stud_spacing_mm / 1000)) + 1
  const studs_ml = studs_count * h_m

  // Soleras: superior + inferior (2 x longitud)
  const track_ml = len_m * 2

  const kg_stud = profile ? profile.kg * studs_ml : 0
  const kg_track = profile ? profile.kg * 0.85 * track_ml : 0  // U es ~15% más liviana

  return {
    studs_count,
    studs_ml: +studs_ml.toFixed(2),
    track_ml: +track_ml.toFixed(2),
    kg_total: +(kg_stud + kg_track).toFixed(2),
  }
}
