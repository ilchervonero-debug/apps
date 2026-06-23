// Perfiles extraídos de SketchFramer 2025_11_13_profiles.json
// CU = Stud & Track (muros estructurales)
// CC = Cold-Formed / Ceiling Channel (cielorraso / entrepiso)

export const CU_NORMS = [
  { id: 'cu_1', name: 'IRAM-IAS-U500' },
  { id: 'cu_2', name: 'Stud and Track' },
  { id: 'cu_3', name: 'Euro' },
  { id: 'cu_4', name: 'ABNT NBR 15253:2014' },
  { id: 'cu_5', name: 'Pinnacle X10' },
  { id: 'cu_7', name: 'Mexico' },
  { id: 'cu_8', name: 'MANU' },
  { id: 'cu_9', name: 'ABNT NBR 15217:2022' },
  { id: 'cu_10', name: 'METALCON (Chile)' },
]

export const CC_NORMS = [
  { id: 'cc_2', name: 'Pinnacle X2' },
  { id: 'cc_3', name: 'Howick Frama' },
  { id: 'cc_4', name: 'XHH' },
  { id: 'cc_5', name: 'Howick Frama Multi-Profile' },
  { id: 'cc_6', name: 'MixCNC' },
  { id: 'cc_7', name: 'Arkitech' },
  { id: 'cc_8', name: 'FrameMac' },
  { id: 'cc_10', name: 'Pinnacle X10' },
  { id: 'cc_11', name: 'Pinnacle X3' },
  { id: 'cc_12', name: 'FrameTek' },
]

// CU sections: C = montante (stud), U = solera (track)
export const CU_SECTIONS = {
  cu_1: {
    name: 'IRAM-IAS-U500',
    C: [
      { h: 89,  w: 40, lip: 10, t: 0.95, kg: 1.35 },
      { h: 100, w: 40, lip: 15, t: 0.95, kg: 1.50 },
      { h: 100, w: 40, lip: 15, t: 1.24, kg: 1.96 },
      { h: 100, w: 40, lip: 15, t: 1.60, kg: 2.53 },
      { h: 150, w: 40, lip: 15, t: 0.95, kg: 1.87 },
      { h: 150, w: 40, lip: 15, t: 1.24, kg: 2.45 },
      { h: 150, w: 40, lip: 15, t: 1.60, kg: 3.16 },
      { h: 150, w: 40, lip: 15, t: 2.00, kg: 3.95 },
      { h: 200, w: 44, lip: 15, t: 1.24, kg: 3.01 },
      { h: 200, w: 44, lip: 15, t: 1.60, kg: 3.89 },
      { h: 200, w: 44, lip: 15, t: 2.00, kg: 4.86 },
      { h: 250, w: 44, lip: 15, t: 1.60, kg: 4.51 },
      { h: 250, w: 44, lip: 15, t: 2.00, kg: 5.64 },
      { h: 250, w: 44, lip: 15, t: 2.50, kg: 7.05 },
      { h: 300, w: 44, lip: 15, t: 1.60, kg: 5.14 },
      { h: 300, w: 44, lip: 15, t: 2.00, kg: 6.43 },
      { h: 300, w: 44, lip: 15, t: 2.50, kg: 8.03 },
    ],
    U: [
      { h: 91,  w: 35, lip: 0, t: 0.95, kg: 1.14 },
      { h: 102, w: 35, lip: 0, t: 0.95, kg: 1.22 },
      { h: 103, w: 35, lip: 0, t: 1.24, kg: 1.60 },
      { h: 104, w: 35, lip: 0, t: 1.60, kg: 2.08 },
      { h: 152, w: 35, lip: 0, t: 0.95, kg: 1.59 },
      { h: 153, w: 35, lip: 0, t: 1.24, kg: 2.09 },
      { h: 154, w: 35, lip: 0, t: 1.60, kg: 2.71 },
      { h: 155, w: 35, lip: 0, t: 2.00, kg: 3.40 },
      { h: 203, w: 35, lip: 0, t: 1.24, kg: 2.57 },
      { h: 204, w: 35, lip: 0, t: 1.60, kg: 3.33 },
      { h: 204, w: 35, lip: 0, t: 2.00, kg: 4.17 },
      { h: 254, w: 35, lip: 0, t: 1.60, kg: 3.96 },
      { h: 255, w: 35, lip: 0, t: 2.00, kg: 4.97 },
      { h: 256, w: 35, lip: 0, t: 2.50, kg: 6.23 },
      { h: 304, w: 35, lip: 0, t: 1.60, kg: 4.59 },
      { h: 305, w: 35, lip: 0, t: 2.00, kg: 5.75 },
      { h: 306, w: 35, lip: 0, t: 2.50, kg: 7.21 },
    ]
  }
}

// Obtiene la solera U correspondiente a un montante C por altura nominal
export function getMatchingU(norm_sections, stud_h) {
  if (!norm_sections?.U) return null
  // La U es ~2-6mm más alta que la C
  return norm_sections.U.filter(u => u.h >= stud_h && u.h <= stud_h + 8)
}

// Nombre display del perfil
export function profileLabel(p) {
  return `${p.h}x${p.w}x${p.t}`
}

// CC sections cargadas dinámicamente — por ahora solo Arkitech como ejemplo
export const CC_SECTIONS = {
  cc_7: {
    name: 'Arkitech',
    C: [
      { h: 63,  w: 50, lip: 15, t: 1.0, kg: 1.45 },
      { h: 89,  w: 50, lip: 15, t: 1.0, kg: 1.65 },
      { h: 89,  w: 50, lip: 15, t: 1.2, kg: 1.98 },
      { h: 100, w: 50, lip: 15, t: 1.0, kg: 1.74 },
      { h: 100, w: 50, lip: 15, t: 1.2, kg: 2.09 },
      { h: 150, w: 50, lip: 15, t: 1.0, kg: 2.13 },
      { h: 150, w: 50, lip: 15, t: 1.2, kg: 2.56 },
      { h: 150, w: 50, lip: 15, t: 1.6, kg: 3.41 },
      { h: 200, w: 50, lip: 15, t: 1.2, kg: 3.03 },
      { h: 200, w: 50, lip: 15, t: 1.6, kg: 4.04 },
      { h: 200, w: 50, lip: 15, t: 2.0, kg: 5.05 },
    ]
  }
}
