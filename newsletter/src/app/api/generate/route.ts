import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNewsletter } from "@/lib/gemini";
import { ingestNews } from "@/lib/news-ingester";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const news = await ingestNews();
    const newsletter = await generateNewsletter(news);

    const saved = await prisma.newsletter.create({
      data: {
        subject: newsletter.subject,
        content: newsletter.content,
        htmlContent: newsletter.htmlContent,
      },
    });

    return NextResponse.json({
      message: "Newsletter generado",
      id: saved.id,
      subject: saved.subject,
      newsIngested: {
        techAI: news.techAI.length,
        devTools: news.devTools.length,
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
