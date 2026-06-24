// Capas de terminación disponibles para cada superficie
// Cada capa tiene: id, name, category, unit, thickness_mm, waste_pct
// qty_fn: función que recibe m2 netos y devuelve cantidad

export const LAYER_CATEGORIES = {
  structure: 'Estructura',
  sheathing: 'Revestimiento estructural',
  insulation: 'Aislante',
  board: 'Placa',
  finish: 'Terminación',
  fastener: 'Fijaciones',
  tape: 'Cinta/Junta',
}

// Dimensiones estándar de placas (para cálculo de emplacado)
export const BOARD_SIZES = {
  gyp_1200x2400: { w: 1200, h: 2400, label: '1200×2400mm' },
  gyp_1200x3000: { w: 1200, h: 3000, label: '1200×3000mm' },
  osb_1220x2440: { w: 1220, h: 2440, label: '1220×2440mm (OSB)' },
  cement_1200x2400: { w: 1200, h: 2400, label: '1200×2400mm (cemento)' },
}

export const LAYER_TEMPLATES = [
  // ── Revestimiento estructural ─────────────────────────────
  {
    id: 'osb_11', name: 'OSB 11mm', category: 'sheathing',
    unit: 'placa', board: 'osb_1220x2440', thickness: 11, waste_pct: 10,
  },
  {
    id: 'osb_15', name: 'OSB 15mm', category: 'sheathing',
    unit: 'placa', board: 'osb_1220x2440', thickness: 15, waste_pct: 10,
  },
  {
    id: 'cement_board', name: 'Placa de cemento', category: 'sheathing',
    unit: 'placa', board: 'cement_1200x2400', thickness: 12, waste_pct: 7,
  },

  // ── Aislante ──────────────────────────────────────────────
  {
    id: 'mineral_wool_50', name: 'Lana mineral 50mm', category: 'insulation',
    unit: 'm2', thickness: 50, waste_pct: 5,
  },
  {
    id: 'mineral_wool_75', name: 'Lana mineral 75mm', category: 'insulation',
    unit: 'm2', thickness: 75, waste_pct: 5,
  },
  {
    id: 'eps_50', name: 'EPS 50mm', category: 'insulation',
    unit: 'm2', thickness: 50, waste_pct: 5,
  },
  {
    id: 'eps_100', name: 'EPS 100mm', category: 'insulation',
    unit: 'm2', thickness: 100, waste_pct: 5,
  },
  {
    id: 'vapor_barrier', name: 'Barrera de vapor', category: 'insulation',
    unit: 'm2', thickness: 0.2, waste_pct: 5,
  },

  // ── Placas de yeso ────────────────────────────────────────
  {
    id: 'gyp_standard', name: 'Placa de yeso estándar 12.5mm', category: 'board',
    unit: 'placa', board: 'gyp_1200x2400', thickness: 12.5, waste_pct: 7,
  },
  {
    id: 'gyp_h1', name: 'Placa de yeso RH 12.5mm (verde)', category: 'board',
    unit: 'placa', board: 'gyp_1200x2400', thickness: 12.5, waste_pct: 7,
  },
  {
    id: 'gyp_rf', name: 'Placa de yeso RF 12.5mm (roja)', category: 'board',
    unit: 'placa', board: 'gyp_1200x2400', thickness: 12.5, waste_pct: 7,
  },
  {
    id: 'gyp_15', name: 'Placa de yeso 15mm', category: 'board',
    unit: 'placa', board: 'gyp_1200x2400', thickness: 15, waste_pct: 7,
  },

  // ── Fijaciones ────────────────────────────────────────────
  {
    id: 'screws_drywall', name: 'Tornillos drywall', category: 'fastener',
    unit: 'unidad', thickness: 0, waste_pct: 5,
    // ~20 tornillos por m2 de placa
    qty_per_m2: 20,
  },
  {
    id: 'screws_selfdrill', name: 'Tornillos autoperforantes', category: 'fastener',
    unit: 'unidad', thickness: 0, waste_pct: 5,
    qty_per_ml_stud: 3,   // por ml de montante
  },

  // ── Cinta y masilla ───────────────────────────────────────
  {
    id: 'joint_tape', name: 'Cinta de juntas', category: 'tape',
    unit: 'ml', thickness: 0, waste_pct: 10,
    // ~0.3ml por m2 de placa
    qty_per_m2: 0.3,
  },
  {
    id: 'joint_compound', name: 'Masilla/estucado', category: 'tape',
    unit: 'kg', thickness: 0, waste_pct: 10,
    // ~1kg por m2
    qty_per_m2: 1.0,
  },

  // ── Terminación / pintura ─────────────────────────────────
  {
    id: 'primer', name: 'Imprimación', category: 'finish',
    unit: 'lt', thickness: 0, waste_pct: 8,
    // 1 lt = 10 m2
    coverage_m2_per_lt: 10,
  },
  {
    id: 'paint_1st', name: 'Pintura 1ra mano', category: 'finish',
    unit: 'lt', thickness: 0, waste_pct: 8,
    coverage_m2_per_lt: 10,
  },
  {
    id: 'paint_2nd', name: 'Pintura 2da mano', category: 'finish',
    unit: 'lt', thickness: 0, waste_pct: 8,
    coverage_m2_per_lt: 10,
  },

  // ── Membrana ──────────────────────────────────────────────
  {
    id: 'wrb', name: 'Membrana hidrófuga (Tyvek)', category: 'sheathing',
    unit: 'm2', thickness: 0, waste_pct: 5,
  },
]

// Kits predefinidos para arrancar rápido
export const LAYER_PRESETS = {
  wall_interior: {
    name: 'Muro interior estándar',
    layers: ['mineral_wool_50', 'gyp_standard', 'screws_drywall', 'joint_tape', 'joint_compound', 'primer', 'paint_1st', 'paint_2nd']
  },
  wall_exterior: {
    name: 'Muro exterior',
    layers: ['osb_11', 'wrb', 'mineral_wool_75', 'gyp_standard', 'screws_drywall', 'joint_tape', 'joint_compound', 'primer', 'paint_1st']
  },
  ceiling_drywall: {
    name: 'Cielorraso de yeso',
    layers: ['mineral_wool_50', 'gyp_standard', 'screws_drywall', 'joint_tape', 'joint_compound', 'primer', 'paint_1st', 'paint_2nd']
  },
  floor_slab: {
    name: 'Piso/losa',
    layers: ['osb_15', 'vapor_barrier']
  },
}
