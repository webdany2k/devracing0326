import { GoogleGenAI } from "@google/genai";
import { IngestedNews, formatNewsForPrompt } from "./news-ingester";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export function buildImageUrl(prompt: string, width = 640, height = 360): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true`;
}

export interface PastNewsletter {
  subject: string;
  createdAt: Date;
}

export interface DailyNewsletter {
  subject: string;
  content: string;
  createdAt: Date;
}

export async function generateNewsletter(news?: IngestedNews, pastNewsletters?: PastNewsletter[]): Promise<{
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

  const historyContext = pastNewsletters?.length
    ? `\n## NEWSLETTERS ANTERIORES (EVITA REPETIR ESTOS TEMAS)\nEstos son los subjects de newsletters enviados recientemente. NO repitas los mismos temas, enfoques ni angulos. Busca noticias frescas y perspectivas diferentes:\n${pastNewsletters.map((n) => `- [${n.createdAt.toLocaleDateString("es-MX")}] ${n.subject}`).join("\n")}\n`
    : "";

  const prompt = `Eres un editor experto de newsletters tecnologicos. Genera un newsletter completo para hoy ${today}.

${newsContext}
${historyContext}

INSTRUCCIONES:
Usa las noticias reales proporcionadas arriba como base. Selecciona las mas relevantes e interesantes para cada seccion. NO inventes noticias, solo usa las proporcionadas. Si alguna seccion tiene pocas noticias, complementa con contexto real.

El newsletter debe tener 3 secciones:

1. **Tech & AI News** (3-4 noticias): Selecciona las noticias mas impactantes de la seccion Tech & AI. Cada noticia con titulo llamativo y 2-3 oraciones de contexto util.

2. **Dev Tips** (2-3 tips): Tips practicos de programacion basados en las tendencias actuales de Dev Tools. Pueden incluir ejemplos de codigo cortos si aplica.

3. **Startup Digest - Mexico & Silicon Valley** (3-4 noticias): Selecciona las mas relevantes. Incluye montos de inversion cuando esten disponibles.

Ademas, para cada SECCION genera un "imagePrompt" en ingles: una descripcion corta (max 15 palabras) para generar una imagen AI ilustrativa. IMPORTANTE: Varia el estilo artistico cada dia. Elige UN estilo diferente de esta lista para cada imagen (no repitas el mismo estilo entre secciones):
- Isometrico 3D lowpoly
- Ilustracion editorial flat design
- Cyberpunk neon con lluvia
- Acuarela digital abstracta
- Collage retro-futurista
- Pixel art detallado
- Foto-realista cinematico
- Arte lineal minimalista con acento de color
- Estilo ukiyo-e japones futurista
- Papercut layered 3D

Ejemplos:
- "Isometric 3D lowpoly AI brain processing data streams pastel colors"
- "Cyberpunk neon rain developer typing holographic code dark alley"
- "Flat design editorial illustration startup founders brainstorming colorful"
- "Watercolor abstract robot hand reaching for human hand soft tones"

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

  const imageUrls: string[] = [];
  for (const [name, imagePrompt] of Object.entries(sectionMap)) {
    const imageUrl = buildImageUrl(imagePrompt, 600, 340);
    imageUrls.push(imageUrl);
    const imageHtml = `<div style="margin: 16px 0; text-align: center;"><img src="${imageUrl}" alt="${imagePrompt}" style="width: 100%; max-width: 600px; height: auto; border-radius: 12px; display: block; margin: 0 auto;" /></div>`;
    html = html.replace(`<!-- IMAGE:${name} -->`, imageHtml);
  }

  // Pre-warm images so they are cached when email clients request them
  await Promise.allSettled(
    imageUrls.map((url) =>
      fetch(url, { signal: AbortSignal.timeout(30000) }).catch(() => {})
    )
  );

  return {
    subject: parsed.subject,
    content: parsed.content,
    htmlContent: html,
  };
}

export async function generateWeeklyDigest(dailyNewsletters: DailyNewsletter[]): Promise<{
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

  const dailySummaries = dailyNewsletters
    .map((n, i) => `--- Edicion ${i + 1} (${n.createdAt.toLocaleDateString("es-MX")}) ---\nSubject: ${n.subject}\n${n.content}`)
    .join("\n\n");

  const prompt = `Eres un editor experto de newsletters tecnologicos. Genera un DIGEST SEMANAL para hoy ${today}.

A continuacion tienes el contenido de ${dailyNewsletters.length} ediciones diarias de esta semana:

${dailySummaries}

INSTRUCCIONES:
Compila un resumen semanal cohesivo a partir de las ediciones diarias. NO copies y pegues — sintetiza, agrupa por temas, destaca lo mas relevante de la semana y ofrece una vision general.

El digest semanal debe tener 3 secciones:

1. **Lo Mejor de la Semana en Tech & AI** (5-6 highlights): Las noticias mas impactantes de la semana, con contexto de por que importan.

2. **Dev Tips de la Semana** (3-4 tips): Los mejores tips y herramientas mencionados durante la semana, consolidados.

3. **Resumen Startup - Mexico & Silicon Valley** (4-5 highlights): Los movimientos mas importantes del ecosistema startup esta semana.

Ademas, para cada SECCION genera un "imagePrompt" en ingles (max 15 palabras) para una imagen AI. Usa estilos variados de esta lista:
- Isometrico 3D lowpoly
- Ilustracion editorial flat design
- Cyberpunk neon con lluvia
- Acuarela digital abstracta
- Collage retro-futurista
- Pixel art detallado
- Foto-realista cinematico
- Arte lineal minimalista con acento de color

IMPORTANTE:
- Escribe en espanol
- Tono profesional pero accesible
- Incluye datos especificos (numeros, nombres, fechas)
- Saludo inicial mencionando que es el resumen semanal
- Despedida motivacional para la semana que viene

Responde SOLO en JSON con esta estructura exacta (sin markdown, sin backticks):
{
  "subject": "Resumen Semanal: titulo llamativo (max 60 chars)",
  "content": "version texto plano del digest completo",
  "sections": [
    { "name": "techAI", "imagePrompt": "descripcion en ingles" },
    { "name": "devTips", "imagePrompt": "descripcion en ingles" },
    { "name": "startups", "imagePrompt": "descripcion en ingles" }
  ],
  "htmlContent": "version HTML completa y estilizada del digest (SIN imagenes)"
}

Para el htmlContent, usa inline styles compatibles con clientes de email:
- Fondo general: #0a0a0a
- Contenedor principal: max-width 640px, centrado, fondo #111111, border-radius 16px
- Header con gradiente de #6366f1 (indigo) a #8b5cf6 (violet), "TechPulse MX" en h1 blanco
- Subtitulo: "Resumen Semanal" en #e0e7ff
- Fecha debajo del subtitulo en #c7d2fe
- IMPORTANTE: Agrega marcadores <!-- IMAGE:techAI -->, <!-- IMAGE:devTips -->, <!-- IMAGE:startups --> antes de cada seccion
- Titulos de seccion con emoji + texto en h2 color #c7d2fe, font-size 18px
- Cards: div con background #1a1a2e, border 1px solid #2a2a4a, border-radius 12px, padding 16px, margin 12px 0
- Titulo en card: color #ffffff, font-size 15px, font-weight bold
- Texto: color #94a3b8, font-size 14px, line-height 1.6
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
    throw new Error("Failed to parse weekly digest JSON from Gemini response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  let html = parsed.htmlContent;
  const sectionMap: Record<string, string> = {};

  if (parsed.sections && Array.isArray(parsed.sections)) {
    for (const section of parsed.sections) {
      sectionMap[section.name] = section.imagePrompt;
    }
  }

  const imageUrls: string[] = [];
  for (const [name, imagePrompt] of Object.entries(sectionMap)) {
    const imageUrl = buildImageUrl(imagePrompt, 600, 340);
    imageUrls.push(imageUrl);
    const imageHtml = `<div style="margin: 16px 0; text-align: center;"><img src="${imageUrl}" alt="${imagePrompt}" style="width: 100%; max-width: 600px; height: auto; border-radius: 12px; display: block; margin: 0 auto;" /></div>`;
    html = html.replace(`<!-- IMAGE:${name} -->`, imageHtml);
  }

  await Promise.allSettled(
    imageUrls.map((url) =>
      fetch(url, { signal: AbortSignal.timeout(30000) }).catch(() => {})
    )
  );

  return {
    subject: parsed.subject,
    content: parsed.content,
    htmlContent: html,
  };
}
