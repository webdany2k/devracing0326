require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");
const { PrismaClient } = require("@prisma/client");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const prisma = new PrismaClient();

const prompt = `Eres un editor experto de newsletters tecnologicos. Genera un newsletter para hoy viernes 7 de marzo de 2026.

USA ESTAS NOTICIAS REALES DE HOY para crear el contenido (NO inventes noticias, usa solo estas):

## TECH & AI NEWS (usa estas):
1. OpenAI lanzo GPT-5.4 y GPT-5.4 Pro con mejoras en razonamiento, coding y menos errores factuales vs GPT-5.2. GPT-5.4 Thinking disponible en ChatGPT de pago.
2. SoftBank aseguro un prestamo de $40 mil millones de dolares (el mas grande en su historia) para invertir en OpenAI. La inversion en AI ya alcanza niveles de financiamiento de infraestructura.
3. Cursor lanzo Agentic Coding Automations: automatizaciones siempre activas que se disparan con cambios de codigo, mensajes de Slack, timers y alertas de incidentes. La competencia en AI coding se mueve hacia orquestacion de workflows.
4. Un modelo de AI llamado Evo2 (entrenado con 9 trillones de letras de ADN) logro generar un genoma microbiano completo desde una secuencia parcial. La AI frontier se mueve mas alla de texto/imagenes hacia diseno biologico.
5. Google, Microsoft, Meta, Oracle, xAI, OpenAI y Amazon se comprometieron a construir o comprar nueva generacion de energia para centros de datos de AI, respondiendo a criticas por su huella energetica.

## DEV TIPS (genera 2-3 tips utiles basados en tendencias reales de 2026):
- TypeScript es ahora el baseline obligatorio, escribir JS plano se considera legacy
- Cursor Agentic Automations y vibe coding son tendencia
- WebAssembly funciona como runtime universal para deploy multi-plataforma
- Meta-frameworks como Next.js y Nuxt son el estandar para proyectos web profesionales

## STARTUP DIGEST MEXICO & SILICON VALLEY (usa estas):
1. Mexico tiene ahora 20,861 empresas tech y 11 unicornios. Las startups mexicanas han levantado $60.4B en total.
2. Jalisco recibio mas de $890 millones en inversion tech solo en 2025, con Amazon, Microsoft y Oracle con operaciones de nearshoring activas. Guadalajara tiene mas de 1,000 empresas tech.
3. La startup mexicana MiChamba levanto $2.25 millones para convertir WhatsApp en plataforma de gestion digital, con planes de expansion a Mexico y mercado hispano en EE.UU.
4. El plan quinquenal de China menciona AI mas de 50 veces, intensificando la competencia global con Silicon Valley.
5. Reino Unido lanzo un laboratorio de investigacion AI frontier con 40 millones de libras.

INSTRUCCIONES:
- Escribe en espanol
- Tono profesional pero accesible y amigable
- Datos especificos reales (numeros, nombres, fechas)
- Saludo inicial corto mencionando que es viernes
- Despedida motivacional

Responde SOLO en JSON con esta estructura exacta (sin markdown, sin backticks):
{"subject":"titulo corto y llamativo (max 60 chars)","content":"version texto plano completa del newsletter","htmlContent":"version HTML completa con inline styles"}

Para htmlContent usa inline styles compatibles con clientes de email:
- Fondo general: #0a0a0a
- Contenedor: max-width 640px, centrado, fondo #111111, border-radius 16px
- Header: background linear-gradient(135deg, #6366f1, #8b5cf6), padding 32px, texto centrado, "TechPulse MX" en h1 color blanco, subtitulo "Tu dosis semanal de tech, AI y startups" en #e0e7ff
- Fecha: "7 de marzo de 2026" debajo del subtitulo en #c7d2fe
- Secciones: cada una con titulo usando emoji + texto en h2 color #c7d2fe, font-size 18px
- Cards de noticias: div con background #1a1a2e, border 1px solid #2a2a4a, border-radius 12px, padding 16px, margin 12px 0
- Titulo de noticia en card: color #ffffff, font-size 15px, font-weight bold, margin 0 0 8px
- Texto de noticia: color #94a3b8, font-size 14px, line-height 1.6
- Tips de codigo: div con background #0d1117, font-family monospace, border-left 3px solid #6366f1, padding 12px, margin 8px 0, color #e2e8f0, font-size 13px
- Separadores entre secciones: hr con border-color #2a2a4a
- Footer: background #0a0a1a, padding 24px, text-align center, color #64748b, font-size 12px
- Link de unsuscribe en footer: usar href="{{unsubscribe_url}}" con color #818cf8
- Todo con inline styles (NO usar clases CSS ni style tags)`;

async function main() {
  console.log("Generating newsletter with real news...");

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

  // Delete old newsletters and insert new one
  await prisma.newsletter.deleteMany({});

  const saved = await prisma.newsletter.create({
    data: {
      subject: data.subject,
      content: data.content,
      htmlContent: data.htmlContent,
    },
  });

  console.log("Newsletter saved:", saved.id);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
