import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { GoogleGenerativeAI } from '@google/generative-ai'

const app = express()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })
const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

app.use(cors())
app.use(express.json())

// ── Analyze floor plan image ──────────────────────────────
app.post('/api/analyze-plan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' })

    const base64 = req.file.buffer.toString('base64')
    const mediaType = req.file.mimetype || 'image/jpeg'

    const prompt = `Sos un experto en lectura de planos de arquitectura. Analizá esta imagen de plano o bosquejo arquitectónico.

Extraé la información estructural y devolvé ÚNICAMENTE un JSON válido con este formato exacto (sin texto antes ni después):

{
  "rooms": [
    {
      "name": "Nombre del recinto (ej: Habitación 1, Cocina, Baño)",
      "points": [
        {"x": 0, "y": 0},
        {"x": 3000, "y": 0},
        {"x": 3000, "y": 4000},
        {"x": 0, "y": 4000}
      ],
      "wallProps": {
        "0": {
          "height": 2400,
          "name": "Norte",
          "openings": [
            {
              "type": "door",
              "width": 900,
              "height": 2050,
              "offset_x": 500,
              "sill_height": 0
            }
          ]
        },
        "1": {
          "height": 2400,
          "name": "Este",
          "openings": [
            {
              "type": "window",
              "width": 1200,
              "height": 900,
              "offset_x": 400,
              "sill_height": 900
            }
          ]
        }
      },
      "roof": {
        "type": 4,
        "slope_pct": 0,
        "ridge_height": 0
      }
    }
  ],
  "scale_note": "Descripción breve de cómo interpretaste la escala",
  "confidence": "high|medium|low",
  "notes": "Observaciones sobre el plano (si hay cotas ilegibles, si es bosquejo a mano, etc.)"
}

REGLAS IMPORTANTES:
- Las coordenadas "points" son el contorno del recinto en milímetros, empezando desde el vértice superior-izquierdo en sentido horario
- Si el plano tiene cotas, usá esas dimensiones exactas
- Si no tiene cotas, estimá dimensiones razonables para vivienda (habitaciones 3000-4000mm, baños 1500-2500mm, etc.)
- "wallProps" usa como key el índice del segmento (0 = entre point[0] y point[1], 1 = entre point[1] y point[2], etc.)
- Para "openings": type puede ser "door" o "window"
- offset_x = distancia desde el borde izquierdo del muro hasta el borde izquierdo de la abertura (en mm)
- sill_height = altura del alféizar desde el piso (0 para puertas)
- Si ves múltiples recintos, incluílos todos en el array "rooms"
- Si hay texto con nombres de ambientes, usalos como "name"
- height de muros: 2400 por default si no se especifica

Analizá la imagen y devolvé el JSON:`

    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const response = await model.generateContent([
      { inlineData: { mimeType: mediaType, data: base64 } },
      prompt,
    ])

    const text = response.response.text().trim()

    // Extraer JSON de la respuesta (por si Claude agrega texto)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(500).json({ error: 'No JSON in response', raw: text })

    const data = JSON.parse(jsonMatch[0])
    res.json(data)

  } catch (err) {
    console.error('analyze-plan error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API server → http://localhost:${PORT}`))
