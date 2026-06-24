import { GoogleGenerativeAI } from '@google/generative-ai'

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const config = { api: { bodyParser: false } }

async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => {
      const body = Buffer.concat(chunks)
      const contentType = req.headers['content-type'] || ''
      const boundary = contentType.split('boundary=')[1]
      if (!boundary) return reject(new Error('No boundary'))

      const boundaryBuf = Buffer.from('--' + boundary)
      const parts = []
      let start = body.indexOf(boundaryBuf) + boundaryBuf.length + 2
      while (start < body.length) {
        const end = body.indexOf(boundaryBuf, start)
        if (end === -1) break
        const part = body.slice(start, end - 2)
        const headerEnd = part.indexOf('\r\n\r\n')
        const headers = part.slice(0, headerEnd).toString()
        const data = part.slice(headerEnd + 4)
        parts.push({ headers, data })
        start = end + boundaryBuf.length + 2
      }

      const imagePart = parts.find(p => p.headers.includes('name="image"'))
      if (!imagePart) return reject(new Error('No image field'))

      const ctMatch = imagePart.headers.match(/Content-Type: ([^\r\n]+)/)
      resolve({
        buffer: imagePart.data,
        mimetype: ctMatch ? ctMatch[1].trim() : 'image/jpeg',
      })
    })
    req.on('error', reject)
  })
}

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
  "notes": "Observaciones sobre el plano"
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { buffer, mimetype } = await parseMultipart(req)
    const base64 = buffer.toString('base64')

    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const response = await model.generateContent([
      { inlineData: { mimeType: mimetype, data: base64 } },
      prompt,
    ])

    const text = response.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(500).json({ error: 'No JSON in response', raw: text })

    res.json(JSON.parse(jsonMatch[0]))
  } catch (err) {
    console.error('analyze-plan error:', err.message)
    res.status(500).json({ error: err.message })
  }
}
