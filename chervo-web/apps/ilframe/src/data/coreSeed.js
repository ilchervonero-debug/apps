// ── Semilla del Core (APU real steel framing, Uruguay) ─────────
// Base pasada por Ángel: catálogo de materiales con precio por PRESENTACIÓN
// COMERCIAL (se compra por paquete entero, no fraccionado), cuadrilla
// (SUNCA + BPS + desgaste de herramientas) y tareas con su rendimiento
// real (m²/día o ml/día). Son valores de partida — 100% editables en el
// Core; esto solo evita arrancar en cero.

// Costo diario real = costoDiarioLiquido × multiplicadorBPS (BPS/Ley 14.411).
// Factor herramientas = desgaste de equipo, % adicional sobre la mano de obra.
export const SEED_CUADRILLA = {
  costoDiarioLiquido: 6200,
  multiplicadorBPS: 1.75,
  factorHerramientas: 0.04,
}

// Desperdicio global de materiales al comprar (10%), aplicado antes de
// redondear a paquetes comerciales enteros.
export const SEED_DESPERDICIO_PCT = 10

// id | categoria | nombre | unidad teórica | presentación comercial |
// rendimiento por paquete (en unidad teórica) | precio del paquete (UYU)
// Los nombres de placas/aislantes/terminación quedan iguales a los que ya
// usa el cómputo (data/layers.js y engine/bom.js) para que el precio
// conecte solo. El acero conecta por MEDIDA de perfil (alto×espesor, el
// estándar PGC/PGU), no por nombre — ver PERFIL_MATCH más abajo.
export const SEED_MATERIALES = [
  ['Estructura', 'Perfil PGC 90x0.94', 'ml', 'Tira de 6m', 6.00, 1180.00],
  ['Estructura', 'Perfil PGU 90x0.94', 'ml', 'Tira de 3m', 3.00, 590.00],
  ['Fijaciones', 'Tornillos T1 P/Mecha', 'unid', 'Caja x 1000', 1000.00, 899.00],
  ['Fijaciones', 'Tornillos T2 Drywall', 'unid', 'Caja x 1000', 1000.00, 569.00],
  ['Placas_Ext', 'OSB 11mm', 'm2', 'Placa 1.22x2.44m', 2.97, 1019.00],
  ['Placas_Int', 'Placa Yeso Std 9.5mm', 'm2', 'Placa 1.20x2.40m', 2.88, 339.00],
  ['Aislacion', 'Membrana hidrófuga (Tyvek)', 'm2', 'Rollo 30m²', 30.00, 1800.00],
  ['Aislacion', 'Lana mineral 50mm', 'm2', 'Rollo 21.6m²', 21.60, 2376.00],
  ['EIFS', 'Placa EPS 30mm', 'm2', 'Placa 1.00x0.50m', 0.50, 140.00],
  ['EIFS_Term', 'Base Coat Cemento', 'kg', 'Bolsa 25kg', 25.00, 720.00],
  ['EIFS_Term', 'Malla Fibra 160g', 'm2', 'Rollo 50m', 50.00, 2100.00],
  ['Terminacion', 'Masilla/estucado', 'kg', 'Balde 18kg', 18.00, 999.00],
  ['Terminacion', 'Cinta de juntas', 'ml', 'Rollo 76m', 76.00, 179.00],
  ['Pintura', 'Enduido', 'kg', 'Balde 28kg', 28.00, 1650.00],
  ['Pintura', 'Imprimación', 'litro', 'Lata 4L', 4.00, 650.00],
  ['Pintura', 'Pintura (2 manos)', 'litro', 'Balde 20L', 20.00, 2800.00],
  ['Estruc_Techo', 'Perfil Omega Galv.', 'ml', 'Tira de 3m', 3.00, 180.00],
  ['Placas_Techo', 'Fenolico CDX 15mm', 'm2', 'Placa 1.22x2.44m', 2.97, 1199.00],
  ['Aisl_Techo', 'Membrana Tyvek Roofing', 'm2', 'Rollo 30m²', 30.00, 1950.00],
  ['Aisl_Techo', 'Lana Vidrio 80mm c/Alum', 'm2', 'Rollo 14.4m²', 14.40, 2850.00],
  ['Estruc_Techo', 'Alfajia Pino Tratado', 'ml', 'Tira de 3.3m', 3.30, 145.00],
  ['Cubierta', 'Chapa trapezoidal', 'm2', 'M² comercial', 1.00, 510.00],
  ['Fijaciones', 'Autoperforante c/Neopreno', 'unid', 'Caja x 500', 500.00, 680.00],
  ['Cubierta', 'Compriband (cierre onda)', 'ml', 'Tira de 1m', 1.00, 45.00],
  ['Cubierta', 'Babeta/Cumbrera', 'ml', 'Tira de 3m', 3.00, 650.00],
  ['Estruc_Pes', 'Perfil PGC 100x0.94', 'ml', 'Tira de 6m', 6.00, 1450.00],
  ['Estruc_Pes', 'Perfil PGU 100x0.94', 'ml', 'Tira de 3m', 3.00, 725.00],
  ['Estruc_Pes', 'Perfil PGC 150x1.25', 'ml', 'Tira de 6m', 6.00, 2450.00],
  ['Estruc_Pes', 'Perfil PGU 150x1.25', 'ml', 'Tira de 3m', 3.00, 1225.00],
  ['Fijac_Pes', 'Hexagonales 10x3/4', 'unid', 'Caja x 500', 500.00, 1200.00],
  ['Arriostram', 'Fleje Metalico 0.94mm', 'ml', 'Rollo 50m', 50.00, 2800.00],
  ['Fijac_Pes', 'Escuadra Anclaje HT', 'unid', 'Unidad', 1.00, 250.00],
  ['Estruc_Pes', 'Anclaje Quimico', 'unid', 'Unidad', 1.00, 320.00],
  ['Estruc_Mega', 'Perfil PGC 200x1.60', 'ml', 'Tira de 6m', 6.00, 3850.00],
  ['Estruc_Mega', 'Perfil PGU 200x1.60', 'ml', 'Tira de 3m', 3.00, 1925.00],
  ['Rigid_Pes', 'Placa OSB 18.3mm', 'm2', 'Placa 1.22x2.44m', 2.97, 1659.00],
  ['Aisl_Piso', 'Banda Acustica Neopreno', 'ml', 'Rollo 10m', 10.00, 850.00],
  ['Fijac_Piso', 'Tornillos con Alas Piso', 'unid', 'Caja x 500', 500.00, 890.00],
  ['Losa_Base', 'Chapa Colaborante Cal 22', 'm2', 'M² comercial', 1.00, 850.00],
  ['Losa_Base', 'Cenefa Galvanizada', 'ml', 'Tira de 3m', 3.00, 480.00],
  ['Losa_Fijac', 'Autoperf. Chapa-Viga', 'unid', 'Caja x 500', 500.00, 850.00],
  ['Losa_Fijac', 'Conectores Corte (Studs)', 'unid', 'Unidad', 1.00, 45.00],
  ['Losa_Acero', 'Malla Electrosoldada', 'm2', 'Panel 14.4m²', 14.40, 1850.00],
  ['Losa_Horm', 'Hormigon H21 Bombeado', 'm3', 'Viaje 1 m³', 1.00, 6500.00],
  ['Losa_Aux', 'Alambre de Atar N°18', 'kg', 'Rollo 1 Kg', 1.00, 120.00],
  ['Estruc_Hibrida', 'Tubo Estructural 100x100x3.2mm', 'ml', 'Tira 6m', 6.00, 2800.00],
  ['Estruc_Hibrida', 'Perfil Laminado IPN 160', 'ml', 'Tira 6m', 6.00, 4500.00],
  ['Anclajes_Base', 'Placa Anclaje HºAº 10mm (20x20)', 'unid', 'Unidad', 1.00, 850.00],
  ['Quimicos_Acero', 'Pintura Antioxido Convertidor', 'litro', 'Lata 4L', 4.00, 980.00],
  ['Fijac_Hibrida', 'Varilla Roscada 5/8" c/Tuercas', 'unid', 'Tira 1m', 1.00, 450.00],
  ['Fijac_Hibrida', 'Bulon Estructural A325 5/8"', 'unid', 'Caja x 50', 50.00, 1750.00],
  ['Estruc_Ciel', 'Perfil Solera 35mm (liviana)', 'ml', 'Tira 3m', 3.00, 129.00],
  ['Estruc_Ciel', 'Perfil Montante 34mm (F47)', 'ml', 'Tira 3m', 3.00, 145.00],
  ['Termin_Ciel', 'Perfil Angulo Perimetral 25x25', 'ml', 'Tira 3m', 3.00, 110.00],
  ['Termin_Ciel', 'Perfil Buña Perimetral (Z)', 'ml', 'Tira 3m', 3.00, 180.00],
  ['Placas_Int', 'Placa de yeso estándar 12.5mm', 'm2', 'Placa 1.20x2.40m', 2.88, 390.00],
  ['Placas_Int', 'Placa de yeso RH 12.5mm (verde)', 'm2', 'Placa 1.20x2.40m', 2.88, 479.00],
  ['Placas_Int', 'Placa de yeso RF 12.5mm (roja)', 'm2', 'Placa 1.20x2.40m', 2.88, 549.00],
  ['Suspension', 'Alambre Galvanizado N°14', 'kg', 'Rollo 1 Kg', 1.00, 135.00],
  ['Suspension', 'Tarugos Nylon 8mm + Tornillo', 'unid', 'Caja x 100', 100.00, 350.00],
].map(([categoria, name, unit, presentacion, rendimientoPaquete, price]) => ({
  id: 'mat_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
  categoria, name, unit, presentacion, rendimientoPaquete, price, source: '',
}))

// Acero: conecta por medida de perfil (alto×espesor mm), no por nombre —
// así cualquier perfil que se elija en Componentes (dentro del estándar
// PGC/PGU habitual) encuentra precio real, sin depender de cómo se llame.
const PERFIL_MATCH_RAW = [
  ['Perfil PGC 90x0.94', 90, 0.94], ['Perfil PGU 90x0.94', 90, 0.94],
  ['Perfil PGC 100x0.94', 100, 0.94], ['Perfil PGU 100x0.94', 100, 0.94],
  ['Perfil PGC 150x1.25', 150, 1.25], ['Perfil PGU 150x1.25', 150, 1.25],
  ['Perfil PGC 200x1.60', 200, 1.60], ['Perfil PGU 200x1.60', 200, 1.60],
]
for (const [name, h, t] of PERFIL_MATCH_RAW) {
  const m = SEED_MATERIALES.find((x) => x.name === name)
  if (m) { m.perfilH = h; m.perfilT = t }
}
// Omega: un solo precio de referencia para cualquier medida de clavador omega.
const omega = SEED_MATERIALES.find((x) => x.name === 'Perfil Omega Galv.')
if (omega) omega.perfilOmega = true

// nombre | unidad ('m2'|'ml') | rendimiento por día (de la cuadrilla)
export const SEED_TAREAS = [
  ['Montaje Estructura (muro base 90mm)', 'm2', 15],
  ['Rigidización OSB + Tyvek', 'm2', 40],
  ['Terminación EIFS completo', 'm2', 12],
  ['Terminación Siding Fibrocemento', 'm2', 15],
  ['Terminación Madera Machihembrada', 'm2', 15],
  ['Terminación Chapa Trapezoidal (muro)', 'm2', 18],
  ['Terminación Placa Cementicia', 'm2', 16],
  ['Aislación + Yeso interior (1 cara)', 'm2', 25],
  ['Instalación Clavadores/Omegas (techo)', 'm2', 35],
  ['Emplacado Fenólico en techo', 'm2', 30],
  ['Colocación Tyvek y Lana (techo)', 'm2', 40],
  ['Armado de Cámara (Alfajías)', 'm2', 45],
  ['Montaje de Chapa y Zinguería', 'm2', 25],
  ['Armado Entrepiso/Cercha PGC 200', 'm2', 10],
  ['Colocación Banda y OSB 18.3mm (piso)', 'm2', 25],
  ['Armado Pilar/Viga Tubo (puro steel)', 'ml', 25],
  ['Soldadura e Izaje Estructura Híbrida', 'ml', 12],
  ['Armado Estructura Suspendida/Directa (cielorraso)', 'm2', 25],
  ['Emplacado, Cintas, Buñas y Cantoneras (cielorraso)', 'm2', 18],
  ['Enduido, Lija y Pintura sobre cabeza (cielorraso)', 'm2', 20],
  ['Armado, Emplacado y Terminación Cenefa', 'ml', 15],
  ['Colocación Aislante en Cielorraso', 'm2', 40],
].map(([nombre, unidad, rendimiento]) => ({
  id: 'tarea_' + nombre.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
  nombre, unidad, rendimiento,
}))
