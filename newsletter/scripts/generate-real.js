require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");
const { PrismaClient } = require("@prisma/client");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const prisma = new PrismaClient();

const prompt = `Eres un editor experto de newsletters tecnologicos. Genera un newsletter para hoy.

USA ESTAS NOTICIAS REALES para crear el contenido (NO inventes noticias, usa solo estas):

## TECH & AI NEWS:
1. OpenAI lanzo GPT-5.4 con mejoras en razonamiento y coding.
2. SoftBank aseguro un prestamo de $40 mil millones para invertir en OpenAI.
3. Cursor lanzo Agentic Coding Automations para workflows de desarrollo.
4. Google, Microsoft, Meta se comprometieron a nueva generacion de energia para centros de datos de AI.

## FRONTEND & WEB DEV:
1. Next.js 16 llego con soporte nativo de Turbopack en produccion y Server Actions mejorados.
2. Tailwind CSS v4 fue lanzado con motor de estilos reescrito desde cero.

## BACKEND & CLOUD:
1. Neon Serverless Postgres anuncio branching instantaneo para CI/CD pipelines.
2. Cloudflare Workers ahora soporta WebSockets persistentes y D1 SQL database en GA.

## STARTUPS MEXICO & SILICON VALLEY:
1. Mexico tiene ahora 20,861 empresas tech y 11 unicornios.
2. Jalisco recibio mas de $890 millones en inversion tech en 2025.
3. La startup mexicana MiChamba levanto $2.25 millones para gestion digital via WhatsApp.

## DEV TIPS:
- TypeScript es ahora el baseline obligatorio
- Cursor Agentic Automations y vibe coding son tendencia
- WebAssembly funciona como runtime universal

INSTRUCCIONES:
- Escribe en espanol
- Tono profesional pero accesible
- Datos especificos reales

El newsletter debe tener 5 secciones, cada una como un fragmento HTML independiente con inline styles:
1. techAI - AI & Machine Learning (3-4 noticias)
2. frontend - Frontend & Web Dev (2-3 noticias)
3. backend - Backend & Cloud (2-3 noticias)
4. startups - Startups MX & SV (3-4 noticias)
5. devTips - Tips & Herramientas (2-3 tips)

Cada htmlFragment debe ser un <div> con inline styles:
- Titulo seccion: h2 con emoji, color #c7d2fe, font-size 18px
- Cards: div con background #1a1a2e, border 1px solid #2a2a4a, border-radius 12px, padding 16px, margin 12px 0
- Titulo card: color #ffffff, font-size 15px, font-weight bold
- Texto: color #94a3b8, font-size 14px, line-height 1.6
- Codigo: div con background #0d1117, font-family monospace, border-left 3px solid #6366f1, padding 12px, color #e2e8f0, font-size 13px

Para cada seccion genera un "imagePrompt" en ingles (max 15 palabras).

Responde SOLO en JSON (sin markdown, sin backticks):
{
  "subject": "titulo corto (max 60 chars)",
  "content": "version texto plano",
  "sections": [
    { "slug": "techAI", "title": "AI & Machine Learning", "htmlFragment": "<div>...</div>", "imagePrompt": "..." },
    { "slug": "frontend", "title": "Frontend & Web Dev", "htmlFragment": "<div>...</div>", "imagePrompt": "..." },
    { "slug": "backend", "title": "Backend & Cloud", "htmlFragment": "<div>...</div>", "imagePrompt": "..." },
    { "slug": "startups", "title": "Startups MX & SV", "htmlFragment": "<div>...</div>", "imagePrompt": "..." },
    { "slug": "devTips", "title": "Tips & Herramientas", "htmlFragment": "<div>...</div>", "imagePrompt": "..." }
  ]
}`;

function buildImageUrl(prompt, width = 600, height = 340) {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true`;
}

function buildEmailShell(subtitle, sectionsHtml, date) {
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

async function main() {
  console.log("Generating newsletter with real news (5 sections)...");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error("No JSON found in response");
    console.error("Response:", text.substring(0, 500));
    process.exit(1);
  }

  const data = JSON.parse(match[0]);
  console.log("Subject:", data.subject);
  console.log("Sections:", data.sections?.length || 0);

  // Process sections: add images
  const sections = [];
  for (const section of data.sections || []) {
    const imageUrl = buildImageUrl(section.imagePrompt);
    const imageHtml = `<div style="margin:16px 0;text-align:center;"><img src="${imageUrl}" alt="${section.imagePrompt}" style="width:100%;max-width:600px;height:auto;border-radius:12px;display:block;margin:0 auto;" /></div>`;
    sections.push({
      slug: section.slug,
      title: section.title,
      htmlFragment: imageHtml + section.htmlFragment,
      imageUrl,
    });
    console.log(`  - ${section.slug}: ${section.title}`);
  }

  // Build full HTML for preview
  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const sectionsHtml = sections.map((s) => s.htmlFragment).join("\n");
  const htmlContent = buildEmailShell("Tu dosis de tech, AI y startups", sectionsHtml, today);

  // Delete old newsletters and insert new one
  await prisma.newsletter.deleteMany({});

  const saved = await prisma.newsletter.create({
    data: {
      subject: data.subject,
      content: data.content,
      htmlContent,
      sections: JSON.stringify(sections),
    },
  });

  console.log("Newsletter saved:", saved.id);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
