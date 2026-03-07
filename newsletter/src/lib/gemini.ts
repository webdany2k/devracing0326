import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateNewsletter(): Promise<{
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

  const prompt = `Eres un editor experto de newsletters tecnologicos. Genera un newsletter completo para hoy ${today}.

El newsletter debe tener 3 secciones:

1. **Tech & AI News** (3-4 noticias): Las noticias mas relevantes de tecnologia e inteligencia artificial del momento. Incluye desarrollos de OpenAI, Google, Meta, startups de AI, hardware, etc. Cada noticia con un titulo llamativo y 2-3 oraciones de contexto.

2. **Dev Tips** (2-3 tips): Tips practicos de programacion. Pueden ser sobre JavaScript/TypeScript, Python, herramientas de desarrollo, mejores practicas, trucos de productividad, etc. Cada tip con un ejemplo de codigo corto si aplica.

3. **Startup Digest - Mexico & Silicon Valley** (3-4 noticias): Noticias del ecosistema startup con enfoque en Mexico (fondeos, lanzamientos, eventos) y Silicon Valley. Incluye montos de inversion cuando esten disponibles.

IMPORTANTE:
- Escribe en espanol
- Usa un tono profesional pero accesible y amigable
- Incluye datos especificos (numeros, nombres, fechas) para dar credibilidad
- Las noticias deben ser plausibles y basadas en tendencias reales actuales
- Agrega un saludo inicial corto y una despedida motivacional

Responde en formato JSON con esta estructura exacta:
{
  "subject": "titulo corto y llamativo para el email (max 60 chars)",
  "content": "version texto plano del newsletter completo",
  "htmlContent": "version HTML completa y estilizada del newsletter"
}

Para el htmlContent, usa este diseno:
- Fondo general: #0a0a0a
- Contenedor principal: max-width 640px, centrado, fondo #111111, bordes redondeados
- Header con gradiente de #6366f1 (indigo) a #8b5cf6 (violet)
- Titulos de seccion con icono emoji y color #c7d2fe
- Texto principal en #e2e8f0
- Links en #818cf8
- Cards de noticias con fondo #1a1a2e, borde 1px #2a2a4a, bordes redondeados
- Tips de codigo con fondo #0d1117, font-family monospace, borde izquierdo 3px #6366f1
- Footer con fondo #0a0a1a, texto #64748b
- Usa inline styles (es para email)
- El HTML debe ser compatible con clientes de email (no CSS moderno)
- Incluye un link de unsuscribe con placeholder {{unsubscribe_url}}
- Agrega el logo/nombre "TechPulse MX" en el header`;

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

  return {
    subject: parsed.subject,
    content: parsed.content,
    htmlContent: parsed.htmlContent,
  };
}
