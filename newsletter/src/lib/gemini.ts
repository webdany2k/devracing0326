import { GoogleGenAI } from "@google/genai";
import { IngestedNews, formatNewsForPrompt } from "./news-ingester";
import { TopicSlug, TOPICS } from "./topics";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export function buildImageUrl(prompt: string, width = 640, height = 360): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true`;
}

export interface SectionData {
  slug: TopicSlug;
  title: string;
  htmlFragment: string;
  imageUrl: string;
}

export interface PastNewsletter {
  subject: string;
  createdAt: Date;
}

export interface DailyNewsletter {
  subject: string;
  content: string;
  sections: string;
  createdAt: Date;
}

export function buildEmailShell(
  subtitle: string,
  sectionsHtml: string,
  date: string
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:20px;">
<div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px;border-radius:16px 16px 0 0;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:28px;">TechPulse MX</h1>
<p style="color:#e0e7ff;margin:8px 0 0;font-size:14px;">${subtitle}</p>
<p style="color:#c7d2fe;margin:4px 0 0;font-size:12px;">${date}</p>
</div>
<div style="background:#111111;padding:24px;border-radius:0 0 16px 16px;">
${sectionsHtml}
</div>
<div style="background:#0a0a1a;padding:24px;text-align:center;border-radius:0 0 16px 16px;margin-top:2px;">
<p style="color:#64748b;font-size:12px;margin:0;">
<a href="{{preferences_url}}" style="color:#818cf8;text-decoration:underline;">Cambiar preferencias</a> ·
<a href="{{unsubscribe_url}}" style="color:#818cf8;text-decoration:underline;">Desuscribirse</a>
</p>
<p style="color:#475569;font-size:11px;margin:8px 0 0;">TechPulse MX - Tu newsletter tech personalizado</p>
</div>
</div>
</body>
</html>`;
}

const SECTION_STYLE = {
  card: 'background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;padding:16px;margin:12px 0;',
  title: 'color:#ffffff;font-size:15px;font-weight:bold;margin:0 0 8px;',
  text: 'color:#94a3b8;font-size:14px;line-height:1.6;margin:0;',
  code: 'background:#0d1117;font-family:monospace;border-left:3px solid #6366f1;padding:12px;color:#e2e8f0;font-size:13px;border-radius:4px;margin:8px 0;',
  sectionTitle: 'color:#c7d2fe;font-size:18px;margin:24px 0 12px;',
};

export async function generateNewsletter(news?: IngestedNews, pastNewsletters?: PastNewsletter[]): Promise<{
  subject: string;
  content: string;
  sections: SectionData[];
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

El newsletter debe tener 5 secciones, cada una como un fragmento HTML independiente con inline styles:

1. **techAI - AI & Machine Learning** (3-4 noticias): Las noticias mas impactantes de IA y tecnologia. Cada noticia con titulo llamativo y 2-3 oraciones de contexto util.

2. **frontend - Frontend & Web Dev** (2-3 noticias): Noticias de frameworks, CSS, browsers, UX y desarrollo web. Incluye novedades de React, Vue, Next.js, Svelte, etc.

3. **backend - Backend & Cloud** (2-3 noticias): Infraestructura, databases, DevOps, APIs, serverless y cloud computing.

4. **startups - Startups MX & SV** (3-4 noticias): Noticias del ecosistema startup de Mexico y Silicon Valley. Incluye montos de inversion cuando esten disponibles.

5. **devTips - Tips & Herramientas** (2-3 tips): Tips practicos de programacion y herramientas utiles. Pueden incluir ejemplos de codigo cortos si aplica.

Para cada seccion genera un "imagePrompt" en ingles (max 15 palabras) para una imagen AI. Varia el estilo artistico entre secciones usando estilos como: isometrico 3D lowpoly, flat design editorial, cyberpunk neon, acuarela digital, collage retro-futurista, pixel art, foto-realista, arte lineal minimalista, ukiyo-e futurista, papercut 3D.

IMPORTANTE:
- Escribe en espanol
- Tono profesional pero accesible y amigable
- Incluye datos especificos (numeros, nombres, fechas)
- Las noticias DEBEN ser basadas en las fuentes RSS proporcionadas

Cada htmlFragment debe ser un <div> independiente con inline styles usando estos estilos:
- Titulo de seccion: h2 con emoji, color #c7d2fe, font-size 18px
- Cards de noticias: div con background #1a1a2e, border 1px solid #2a2a4a, border-radius 12px, padding 16px, margin 12px 0
- Titulo en card: color #ffffff, font-size 15px, font-weight bold
- Texto: color #94a3b8, font-size 14px, line-height 1.6
- Tips de codigo: div con background #0d1117, font-family monospace, border-left 3px solid #6366f1, padding 12px, color #e2e8f0, font-size 13px
- Todo con inline styles (NO clases CSS ni style tags)

Responde SOLO en JSON con esta estructura exacta (sin markdown, sin backticks):
{
  "subject": "titulo corto y llamativo para el email (max 60 chars)",
  "content": "version texto plano del newsletter completo",
  "sections": [
    { "slug": "techAI", "title": "AI & Machine Learning", "htmlFragment": "<div>...seccion completa con inline styles...</div>", "imagePrompt": "descripcion en ingles" },
    { "slug": "frontend", "title": "Frontend & Web Dev", "htmlFragment": "<div>...</div>", "imagePrompt": "..." },
    { "slug": "backend", "title": "Backend & Cloud", "htmlFragment": "<div>...</div>", "imagePrompt": "..." },
    { "slug": "startups", "title": "Startups MX & SV", "htmlFragment": "<div>...</div>", "imagePrompt": "..." },
    { "slug": "devTips", "title": "Tips & Herramientas", "htmlFragment": "<div>...</div>", "imagePrompt": "..." }
  ]
}`;

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

  // Inject AI-generated images into each section
  const sections: SectionData[] = [];
  const imageUrls: string[] = [];

  if (parsed.sections && Array.isArray(parsed.sections)) {
    for (const section of parsed.sections) {
      const imageUrl = buildImageUrl(section.imagePrompt, 600, 340);
      imageUrls.push(imageUrl);

      const imageHtml = `<div style="margin:16px 0;text-align:center;"><img src="${imageUrl}" alt="${section.imagePrompt}" style="width:100%;max-width:600px;height:auto;border-radius:12px;display:block;margin:0 auto;" /></div>`;

      sections.push({
        slug: section.slug,
        title: section.title,
        htmlFragment: imageHtml + section.htmlFragment,
        imageUrl,
      });
    }
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
    sections,
  };
}

export async function generateWeeklyDigest(dailyNewsletters: DailyNewsletter[]): Promise<{
  subject: string;
  content: string;
  sections: SectionData[];
}> {
  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Compile section content from daily newsletters
  const dailySummaries = dailyNewsletters
    .map((n, i) => {
      let sectionInfo = "";
      try {
        const sections = JSON.parse(n.sections) as SectionData[];
        sectionInfo = sections.map((s) => `[${s.slug}] ${s.title}`).join(", ");
      } catch {
        // fallback if sections aren't parseable
      }
      return `--- Edicion ${i + 1} (${n.createdAt.toLocaleDateString("es-MX")}) ---\nSubject: ${n.subject}\nSecciones: ${sectionInfo}\n${n.content}`;
    })
    .join("\n\n");

  const prompt = `Eres un editor experto de newsletters tecnologicos. Genera un DIGEST SEMANAL para hoy ${today}.

A continuacion tienes el contenido de ${dailyNewsletters.length} ediciones diarias de esta semana:

${dailySummaries}

INSTRUCCIONES:
Compila un resumen semanal cohesivo a partir de las ediciones diarias. NO copies y pegues — sintetiza, agrupa por temas, destaca lo mas relevante de la semana.

El digest semanal debe tener 5 secciones:

1. **techAI - Lo Mejor de la Semana en AI** (4-5 highlights): Las noticias de IA mas impactantes de la semana.
2. **frontend - Frontend & Web Dev** (3-4 highlights): Lo mas relevante en desarrollo web frontend.
3. **backend - Backend & Cloud** (3-4 highlights): Lo mas relevante en infra, DevOps y backend.
4. **startups - Resumen Startup MX & SV** (4-5 highlights): Los movimientos mas importantes del ecosistema startup.
5. **devTips - Tips de la Semana** (3-4 tips): Los mejores tips y herramientas mencionados durante la semana.

Para cada seccion genera un "imagePrompt" en ingles (max 15 palabras) para una imagen AI. Varia el estilo artistico.

IMPORTANTE:
- Escribe en espanol
- Tono profesional pero accesible
- Incluye datos especificos
- Saludo inicial mencionando que es el resumen semanal
- Despedida motivacional

Cada htmlFragment debe ser un <div> independiente con inline styles:
- Titulo de seccion: h2 con emoji, color #c7d2fe, font-size 18px
- Cards: div con background #1a1a2e, border 1px solid #2a2a4a, border-radius 12px, padding 16px, margin 12px 0
- Titulo en card: color #ffffff, font-size 15px, font-weight bold
- Texto: color #94a3b8, font-size 14px, line-height 1.6
- Tips de codigo: div con background #0d1117, font-family monospace, border-left 3px solid #6366f1, padding 12px, color #e2e8f0, font-size 13px
- Todo con inline styles

Responde SOLO en JSON (sin markdown, sin backticks):
{
  "subject": "Resumen Semanal: titulo llamativo (max 60 chars)",
  "content": "version texto plano del digest completo",
  "sections": [
    { "slug": "techAI", "title": "Lo Mejor en AI", "htmlFragment": "<div>...</div>", "imagePrompt": "..." },
    { "slug": "frontend", "title": "Frontend & Web Dev", "htmlFragment": "<div>...</div>", "imagePrompt": "..." },
    { "slug": "backend", "title": "Backend & Cloud", "htmlFragment": "<div>...</div>", "imagePrompt": "..." },
    { "slug": "startups", "title": "Startups MX & SV", "htmlFragment": "<div>...</div>", "imagePrompt": "..." },
    { "slug": "devTips", "title": "Tips de la Semana", "htmlFragment": "<div>...</div>", "imagePrompt": "..." }
  ]
}`;

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

  const sections: SectionData[] = [];
  const imageUrls: string[] = [];

  if (parsed.sections && Array.isArray(parsed.sections)) {
    for (const section of parsed.sections) {
      const imageUrl = buildImageUrl(section.imagePrompt, 600, 340);
      imageUrls.push(imageUrl);

      const imageHtml = `<div style="margin:16px 0;text-align:center;"><img src="${imageUrl}" alt="${section.imagePrompt}" style="width:100%;max-width:600px;height:auto;border-radius:12px;display:block;margin:0 auto;" /></div>`;

      sections.push({
        slug: section.slug,
        title: section.title,
        htmlFragment: imageHtml + section.htmlFragment,
        imageUrl,
      });
    }
  }

  await Promise.allSettled(
    imageUrls.map((url) =>
      fetch(url, { signal: AbortSignal.timeout(30000) }).catch(() => {})
    )
  );

  return {
    subject: parsed.subject,
    content: parsed.content,
    sections,
  };
}
