# iLFrame — Steel Framing CAD

**Aplicación profesional de diseño estructural en acero** basada en SketchFramer v1.6.87.

## ✨ Características

- 📐 **Canvas dual** — Alzado (A) y Planta (P) simultáneos
- 🏗️ **Elementos completos** — Paredes, losas, aberturas, cerchas, vigas, columnas
- 📦 **Perfiles precargados** — CU/CC de 12 estándares (IRAM, Euro, ABNT, etc)
- 🎨 **Menú lateral** — Selector dinámico de propiedades por elemento
- 🔧 **Atributos SketchFramer** — Blocking, BTB, headers, stiffeners, conexiones
- 💾 **BOM automático** — Cálculo de materiales y costos

## 🚀 Inicio Rápido

### Local
```bash
npm install
npm run dev
# Abre http://localhost:5174
```

### Web
```
https://cdn.jsdelivr.net/gh/ilchervonero-debug/iLYorugua@main/index.html
```

## 📂 Estructura

```
iLYorugua/
├── src/
│   ├── components/       # Componentes React
│   ├── data/            # Perfiles CU/CC, BOM
│   ├── store/           # Estado (Zustand)
│   ├── engine/          # Lógica de geometría
│   ├── App.jsx          # App principal
│   └── main.jsx         # Entry point
├── public/              # Assets estáticos
├── package.json
└── README.md
```

## 🛠️ Herramientas

**Canvas:**
- Línea, Punto, Polilínea
- Reticulados (Warren/Pratt)
- Selección inteligente

**Panel Lateral:**
- Tipo de elemento
- Perfil CU/CC (selector dinámico)
- Propiedades específicas por tipo
- Conexiones y refuerzos

## 📋 SketchFramer Integrado

✅ Todos los atributos de SketchFramer v1.6.87:
- **Tipos:** Wall, Slab, Opening, Truss, Beam, Standalone, Aligner, HRS
- **Propiedades:** blocking, BTB, headers, stiffeners, web notch, service holes
- **Formas:** recto, pendiente, gable, mix-beam
- **Conexiones:** corner, T-connection, align
- **Perfiles:** 12 estándares + 100+ variantes

## 🤝 Desarrollo

Estado: **v1.0 — Integración y reorganización**

Próximos pasos:
1. ✅ Limpieza de estructura
2. ⏳ Integración React completa
3. ⏳ Menú lateral funcional
4. ⏳ Implementación SketchFramer completa
5. ⏳ Export DXF/JSON
6. ⏳ Supabase sync

---

**Para Juan de los Palotes** — Aplicación intuitiva, profesional, 100% offline.
