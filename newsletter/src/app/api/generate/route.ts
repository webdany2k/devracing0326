import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNewsletter } from "@/lib/gemini";
import { assembleFullEmailHtml } from "@/lib/mailer";
import { ingestNews } from "@/lib/news-ingester";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const news = await ingestNews();

    const pastNewsletters = await prisma.newsletter.findMany({
      select: { subject: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 7,
    });

    const generated = await generateNewsletter(news, pastNewsletters);
    const htmlContent = assembleFullEmailHtml(generated.sections);

    const saved = await prisma.newsletter.create({
      data: {
        subject: generated.subject,
        content: generated.content,
        htmlContent,
        sections: JSON.stringify(generated.sections),
      },
    });

    return NextResponse.json({
      message: "Newsletter generado",
      id: saved.id,
      subject: saved.subject,
      sectionsCount: generated.sections.length,
      newsIngested: {
        techAI: news.techAI.length,
        devTools: news.devTools.length,
        frontend: news.frontend.length,
        backend: news.backend.length,
        startups: news.startups.length,
      },
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Error generando newsletter" },
      { status: 500 }
    );
  }
}
