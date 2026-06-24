# SketchFramer v1.6.87 — Recuperación Total de Atributos

**Fuente:** `/tmp/sketchframer/uruframe_sketchframer` (RBZ extraído)
**Estado:** ✅ Todos los datos precargados en `src/data/`

---

## 📦 Datos Precargados

### 1. Perfiles CU/CC (2025_11_13_profiles.json)

**Familias CU (Stud & Track):**
- IRAM-IAS-U500
- Stud and Track  
- Euro
- ABNT NBR 15253:2014
- ABNT NBR 15217:2022 (perfiles livianos cielorraso)
- Pinnacle X10 (x2 variantes)
- Mexico
- MANU
- Chilenian METALCON

**Familias CC (Cold-Formed Ceiling):**
- Pinnacle X1, X2, X3, X10
- Howick Frama (regular + Multi-Profile)
- MixCNC
- Arkitech
- FrameMac
- BOSJ
- XHH

**Atributos por perfil:**
```json
{
  "height": 100,              // mm
  "width": 40,                // mm
  "lip_width": 15,            // mm (ala del C, 0 para U)
  "thickness": 0.95,          // mm
  "weight_kg_per_m": 1.5      // kg/metro lineal
}
```

---

## 🏗️ Tipos de Elementos (de RBZ)

### 1. **WALL** (Pared)
```ruby
shape_type:
  0 = recto (vertical)
  1 = con pendiente
  2 = gable (ángulo techo)
  3 = beam (viga horizontal)

Propiedades:
  - profile_family: 0=CU, 1=CC
  - profile_style_cu: "CU 100x40"
  - profile_style_u: "U 102x40" (solera, auto-filtrada)
  - stud_spacing: mm (default 400)
  - height: mm (default 2400 para pared)
  
  - draw_tracks: true/false (dibuja soleras)
  - use_transport_track: true/false
  - flipped_studs: true/false (espejan montantes)
  - is_double_start_end_vertical: true/false (doble montante inicio/fin)
  
  - blocking_mode: 0=none, 1=subdivisión, 2=strapping
  - blocking_type: perfil CU para bloqueadores
  
  - service_holes_blocking_bool: true/false (perforaciones de servicio)
  - is_btb: true/false (back-to-back studs = columna doble)
  - is_glue_mode: true/false (pegado a nivel)
  - is_glue_base: true/false
  - is_glue_top: true/false
  
  - slope_angle: grados (0-45)
  - slope_direction: lado (left/right)
```

### 2. **OPENING** (Puerta/Ventana)
```ruby
opening_type:
  1 = puerta (default 800x2005)
  otro = ventana (default 1500x900)

Propiedades:
  - width, height: mm
  - left_clearance, right_clearance: mm (luz libre lateral)
  - top_clearance, bottom_clearance: mm (luz libre vertical)
  
  - auto_jacks: true/false (calcula automáticamente)
  - jacks_count: 1-8 (montantes laterales)
  - kings_count: 1-8 (montantes refuerzo)
  
  - header_type: 0=none, 1=box, 2=truss, 3=truss+cripples, 4=box BTB, 5=truss centered cripples
  - header_position: centered/left/right
  - header_is_simplify: true/false
  - header_is_jack_caps: true/false
  - header_is_header_cap: true/false
  
  Si header_type=2 (truss):
    - truss_height: mm
    - truss_subdivision: count
    - double_bottom_chord: true/false
```

### 3. **SLAB** (Losa/Entrepiso)
```ruby
slab_type:
  0 = joists (vigas simples)
  1 = truss (estructura triangulada)

Propiedades:
  - profile_family: 0=CU, 1=CC
  - profile_style_cc: "CC 89x41"
  - stud_spacing: mm (separación vigas)
  - height: mm (peralte)
  
  - blocking_mode: 0=none, 1=subdivisión, 2=strapping
  - blocking_type: perfil para bloqueadores
  
  Si slab_type=1 (truss):
    - Hereda propiedades de TRUSS (ver abajo)
```

### 4. **TRUSS** (Cercha)
```ruby
shape_type:
  0 = piso
  1 = techo simple
  2 = gable (2 aguas)
  3 = mix-beam (viga mixta)
  4 = triángulo

Propiedades:
  - diagonal_type: 0=Warren, 1=Pratt
  - diagonal_mode: 0=subdivisiones, 1=espaciado+aligner
  
  - is_btb: true/false (back-to-back chords)
  - is_bottom_rafters: true/false (armaduras inferiores)
  - height_mode: "attic" / "base_height"
  
  - left_rafters: grados (ángulo izquierdo)
  - right_rafters: grados (ángulo derecho)
  
  - profile_family: 0=CU, 1=CC
  - profile_style_cu: "CU 100x40"
  
  Si shape_type=3 (mix-beam):
    - box_c_profile_style: perfil C especial para viga
```

### 5. **BEAM** (Viga)
```ruby
Propiedades:
  - profile_family: 0=CU, 1=CC
  - profile_style_cu: perfil CU para viga
  - length: mm
  - height: mm (peralte)
  - is_btb: true/false
```

### 6. **STANDALONE_PROFILE** (Columna/Perfil Individual)
```ruby
Propiedades:
  - profile_family: 0=CU, 1=CC
  - profile_style_cu: "CU 100x40"
  - quantity: count (para reticuladas/lattice)
  - spacing: mm (separación en reticuladas)
```

### 7. **ALIGNER** (Referencia de Modulación)
```ruby
Propiedades:
  - spacing: mm (pitch de alineación)
  - offset: mm (desplazamiento)
```

### 8. **HRS** (Horizontal Runner System — Cielorraso CC)
```ruby
Propiedades:
  - profile_style_cc: "CC 89x41" (perfil horizontal)
  - spacing: mm (separación entre HRS)
  - clips: type (tipo de clip de suspensión)
```

### 9. **SIMPLE_ROOM** (Cuarto Modular)
```ruby
Propiedades:
  - length, width, height: mm (dimensiones)
  - faces: 4 (generar 4 paredes automático)
  - roof: tipo (1/2/3/4 aguas)
  - materialStack: referencia (perfiles por defecto)
```

---

## 🔗 Lógica de Conexiones

### Corner Element
- Dos paredes en esquina (ángulo 90°)
- Generación automática de corner studs
- Transferencia de cargas

### T-Connection
- Pared que llega a otra (perpendicular)
- Opciones: aligned, offset, bridging
- Cálculo de transferencia de fuerzas

### Align Stud
- Alineación de montantes entre elementos
- Referencia a ALIGNER
- Propagación de altura

### Back-to-Back (BTB)
- Duplica montante (columna doble)
- Separación: BTB_TOLERANCE (0-50mm)
- Para elementos estructurales críticos

### Stiffeners (Rigidizadores)
- Elemento adicional en alma del perfil
- Previene pandeo lateral
- Profile + tipo (horizontal/vertical)

### Web Notch (Corte en Alma)
- Para paso de instalaciones (MEP)
- Forma: rectangular/circular
- Dimensiones: ancho x alto
- Posición: distance from end

### Service Hole (Perforación de Servicio)
- Solo para perfiles CC
- Diámetro: 25-50mm
- Espaciado: 400-600mm
- Tipo: circular/oblong

---

## 💰 BOM System (default_db.json)

### Estructura:
```json
{
  "products": [
    {
      "product_id": "CU100x40x095",
      "category": "Profiles",
      "description": "CU 100x40x0.95 IRAM",
      "base_unit": "unit",
      "unit_price": 5.50,
      "yield": 0.95,
      "waste_pct": 5
    }
  ],
  
  "systems": [
    {
      "system_id": "drywall_double_1h",
      "name": "Drywall Doble 1H",
      "description": "Sistema de pared doble con 1 hora resistencia fuego",
      "layers": [
        { "position": "exterior", "material": "gypsum_5_8", "qty": 2, "layer_type": "drywall" },
        { "position": "cavity", "material": "insulation_3_5", "qty": 1 },
        { "position": "interior", "material": "gypsum_1_2", "qty": 1 }
      ]
    }
  ],
  
  "system_components": [
    {
      "system_id": "drywall_double_1h",
      "component_id": "CU100x40x095",
      "qty_per_unit": 1,
      "unit": "unit"
    }
  ]
}
```

### Categorías de Productos:
- **Profiles** — perfiles CU/CC
- **Boards** — drywall, madera
- **Insulation** — fibra, poliuretano
- **Fasteners** — tornillos, pernos, clips
- **Membranes** — vapor barrier, air barrier
- **Renders** — finales, pinturas
- **Adhesives** — pegamentos estructurales
- **Cladding** — revestimientos
- **Accessories** — hardware general
- **Finishes** — acabados

---

## 🎨 Propiedades Visuales (Assets)

### Iconos (assets/icons/)
- Element Creation (wall, slab, truss, beam, etc)
- Toolbar Main (draw, edit, measure, etc)
- Toolbar Alignment (corner, align, space, etc)
- Toolbar Constraint (lock, fix, etc)
- Toolbar Utility (view, export, etc)
- Toolbar Visibility (show/hide layers)
- Character icons (corner TC mode, wall end, etc)

### Estilos (assets/styles/)
- Colores por tipo de elemento
- Línea style (solid, dashed, dotted)
- Grosor según rango de escala
- Sombreado según cara (normal/selected/hidden)

### Imágenes Plan (assets/plans_options/)
- Ejemplos de distribuciones
- Referencias de usuario
- Templates de proyecto

---

## 📝 Dialogs (Propiedades)

Archivos HTML/JS para edición de elementos:

1. **wall_properties_edit.html** — Pared (stud spacing, blocking, heights)
2. **slab_properties_edit.html** — Losa/Entrepiso
3. **opening_properties_edit.html** — Abertura (puerta/ventana con header)
4. **truss_properties_edit.html** — Cercha (diagonal, height mode)
5. **beam_properties_edit.html** — Viga
6. **standalone_profile_properties_edit.html** — Columna/Perfil individual
7. **aligner_properties_edit.html** — Alineador
8. **hrs_creator.html** — Sistema HRS (cielorraso)
9. **bom.html** — Bill of Materials (costeo)
10. **dimension_properties_edit.html** — Cotas
11. **custom_element_properties_edit.html** — Elementos custom

### Helpers (dialogs/helpers/)
- adjust_elements.html
- blocking_tolerance.html
- back_to_back_tolerance.html
- corner_tc_mode.html
- diagonal_tolerance.html
- element_editor_2d.html (editor 2D avanzado)
- lip_cut_size.html
- header_cap.html
- height_mode.html
- flexibility_distance.html

---

## 🔧 Tools (Herramientas)

### draws/
- wall_draw.rb
- slab_draw.rb
- opening_draw.rb
- truss_draw.rb
- beam_draw.rb
- standalone_draw.rb
- aligner_draw.rb

### edit/
- wall_edit.rb
- slab_edit.rb
- opening_edit.rb
- etc (edición in-situ)

### stud/
- stud_add.rb
- stud_remove.rb
- stud_flip.rb
- stud_align.rb

### modifiers/
- add_blocking.rb
- add_strapping.rb
- add_btb.rb
- add_web_notch.rb
- add_service_hole.rb
- add_stiffener.rb

---

## 🌐 Localizaciones (Resources/)

- **es/** — Español (UI completa)
- **pt-BR/** — Portugués Brasil (UI completa)
- En + inglés en code

---

## 📐 Geometría & Cálculos (src/engine/)

### geometry.js (del proyecto actual)
- Cálculos de distancias
- Ángulos entre elementos
- Transformaciones 2D→3D
- Intersecciones línea-línea

### profiles.js (del proyecto actual)
- Datos de perfiles (más antiguo que 2025_11_13)
- Selector automático U basado en C

### layers.js (del proyecto actual)
- Sistema de capas (floors, walls, roofs)
- Visibilidad por tipo

---

## 🎯 Lo que NO debe Descartarse

✅ **Absolutamente TODO debe estar en iLFrame:**

1. **Perfiles CU/CC** — Todos los 12 estándares + variantes
2. **Tipos de elemento** — Wall, Slab, Opening, Truss, Beam, Standalone, Aligner, HRS
3. **Propiedades complejas** — Blocking, BTB, headers, stiffeners, service holes
4. **Lógica de conexión** — Corner, T-connection, align, transfer
5. **BOM system** — Costeo completo por proyecto
6. **Cerchas** — Warren + Pratt, gable, mix-beam, triángulo
7. **Columnas reticuladas** — Spacing automático, cantidad variable
8. **HRS** — Sistema de cielorraso horizontal
9. **2D Editor** — Edición en tiempo real
10. **Localizaciones** — Español + Portugués al menos

---

## 🚀 Integración en iLFrame

**iLFrame = canvas visual de SketchFramer**

- ✅ iLFrame.html (dibujo básico listo)
- ⏳ Agregar selector de elemento type (wall/slab/opening/etc)
- ⏳ Agregar panel de propiedades dinámico (por tipo)
- ⏳ Cargar perfiles (2025_11_13_profiles.json ✅)
- ⏳ Cargar BOM (default_db.json ✅)
- ⏳ Implementar lógica de conexiones
- ⏳ Renderizar cerchas con diagonales Warren/Pratt
- ⏳ Renderizar columnas reticuladas
- ⏳ Panel de cálculo BOM
- ⏳ Export DXF/JSON

---

## 📊 Estado Actual

| Componente | Estado | Notas |
|-----------|--------|-------|
| Canvas gráfico | ✅ Listo | iLFrame.html con dibujo básico |
| Perfiles CU/CC | ✅ Cargado | 2025_11_13_profiles.json (43KB) |
| BOM database | ✅ Cargado | default_db.json (13KB) |
| Tipos de elemento | ⏳ Próximo | Wall, Opening, Truss, etc |
| Propiedades UI | ⏳ Próximo | Panel dinámico por tipo |
| Cerchas | ⏳ Próximo | Warren/Pratt en canvas |
| Columnas reticuladas | ⏳ Próximo | Spacing automático |
| Conexiones | ⏳ Próximo | Corner, T, align logic |
| BOM calculator | ⏳ Próximo | Costeo real |
| Export | ⏳ Próximo | DXF + JSON |

**NO SE DESCARTA NADA. TODO SE IMPLEMENTA.**
