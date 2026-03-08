import { GoogleGenAI } from "@google/genai";
import { IngestedNews, formatNewsForPrompt } from "./news-ingester";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export function buildImageUrl(prompt: string, width = 640, height = 360): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true`;
}

export async function generateNewsletter(news?: IngestedNews): Promise<{
  subject: string;
  content: string;
  htmlContent: string;
}> {
  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const newsContext = news
    ? formatNewsForPrompt(news)
    : "No se pudieron obtener noticias de fuentes RSS. Genera contenido basado en tendencias reales y actuales de la industria tech.";

  const prompt = `Eres un editor experto de newsletters tecnologicos. Genera un newsletter completo para hoy ${today}.

${newsContext}

INSTRUCCIONES:
Usa las noticias reales proporcionadas arriba como base. Selecciona las mas relevantes e interesantes para cada seccion. NO inventes noticias, solo usa las proporcionadas. Si alguna seccion tiene pocas noticias, complementa con contexto real.

El newsletter debe tener 3 secciones:

1. **Tech & AI News** (3-4 noticias): Selecciona las noticias mas impactantes de la seccion Tech & AI. Cada noticia con titulo llamativo y 2-3 oraciones de contexto util.

2. **Dev Tips** (2-3 tips): Tips practicos de programacion basados en las tendencias actuales de Dev Tools. Pueden incluir ejemplos de codigo cortos si aplica.

3. **Startup Digest - Mexico & Silicon Valley** (3-4 noticias): Selecciona las mas relevantes. Incluye montos de inversion cuando esten disponibles.

Ademas, para cada SECCION genera un "imagePrompt" en ingles: una descripcion corta (max 15 palabras) para generar una imagen AI ilustrativa. Estilo: futurista, tecnologico, colores vibrantes sobre fondo oscuro. Ejemplos:
- "Futuristic AI neural network glowing blue purple dark background"
- "Developer coding holographic screen neon city night"
- "Startup rocket launching Mexico City skyline digital art"

IMPORTANTE:
- Escribe en espanol
- Tono profesional pero accesible y amigable
- Incluye datos especificos (numeros, nombres, fechas)
- Saludo inicial corto y despedida motivacional
- Las noticias DEBEN ser basadas en las fuentes RSS proporcionadas

Responde SOLO en JSON con esta estructura exacta (sin markdown, sin backticks):
{
  "subject": "titulo corto y llamativo para el email (max 60 chars)",
  "content": "version texto plano del newsletter completo",
  "sections": [
    { "name": "techAI", "imagePrompt": "descripcion en ingles para imagen AI" },
    { "name": "devTips", "imagePrompt": "descripcion en ingles para imagen AI" },
    { "name": "startups", "imagePrompt": "descripcion en ingles para imagen AI" }
  ],
  "htmlContent": "version HTML completa y estilizada del newsletter (SIN imagenes, las agregaré despues)"
}

Para el htmlContent, usa inline styles compatibles con clientes de email:
- Fondo general: #0a0a0a
- Contenedor principal: max-width 640px, centrado, fondo #111111, border-radius 16px
- Header con gradiente de #6366f1 (indigo) a #8b5cf6 (violet), "TechPulse MX" en h1 blanco
- Subtitulo: "Tu dosis diaria de tech, AI y startups" en #e0e7ff
- Fecha del dia debajo del subtitulo en #c7d2fe
- IMPORTANTE: Agrega un marcador <!-- IMAGE:techAI --> justo antes de la seccion Tech & AI
- IMPORTANTE: Agrega un marcador <!-- IMAGE:devTips --> justo antes de la seccion Dev Tips
- IMPORTANTE: Agrega un marcador <!-- IMAGE:startups --> justo antes de la seccion Startup Digest
- Titulos de seccion con emoji + texto en h2 color #c7d2fe, font-size 18px
- Cards de noticias: div con background #1a1a2e, border 1px solid #2a2a4a, border-radius 12px, padding 16px, margin 12px 0
- Titulo de noticia en card: color #ffffff, font-size 15px, font-weight bold
- Texto de noticia: color #94a3b8, font-size 14px, line-height 1.6
- Tips de codigo: div con background #0d1117, font-family monospace, border-left 3px solid #6366f1, padding 12px, color #e2e8f0, font-size 13px
- Footer: background #0a0a1a, padding 24px, text-align center, color #64748b, font-size 12px
- Link de unsuscribe: href="{{unsubscribe_url}}" con color #818cf8
- Todo con inline styles (NO usar clases CSS ni style tags)`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text ?? "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse newsletter JSON from Gemini response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Inject AI-generated images into the HTML
  let html = parsed.htmlContent;
  const sectionMap: Record<string, string> = {};

  if (parsed.sections && Array.isArray(parsed.sections)) {
    for (const section of parsed.sections) {
      sectionMap[section.name] = section.imagePrompt;
    }
  }

  for (const [name, imagePrompt] of Object.entries(sectionMap)) {
    const imageUrl = buildImageUrl(imagePrompt, 600, 340);
    const imageHtml = `<div style="margin: 16px 0; text-align: center;"><img src="${imageUrl}" alt="${imagePrompt}" style="width: 100%; max-width: 600px; height: auto; border-radius: 12px; display: block; margin: 0 auto;" /></div>`;
    html = html.replace(`<!-- IMAGE:${name} -->`, imageHtml);
  }

  return {
    subject: parsed.subject,
    content: parsed.content,
    htmlContent: html,
  };
}
