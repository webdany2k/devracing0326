import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNewsletter } from "@/lib/gemini";
import { ingestNews } from "@/lib/news-ingester";
import { sendBulkEmails } from "@/lib/mailer";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Step 1: Ingest real news from RSS feeds
    console.log("Ingesting news from RSS feeds...");
    const news = await ingestNews();
    console.log(
      `Ingested: ${news.techAI.length} tech/AI, ${news.devTools.length} dev, ${news.startups.length} startups`
    );

    // Step 2: Generate newsletter with Gemini (curates news + generates image prompts)
    console.log("Generating newsletter with Gemini...");
    const generated = await generateNewsletter(news);

    // Step 3: Save to database
    const newsletter = await prisma.newsletter.create({
      data: {
        subject: generated.subject,
        content: generated.content,
        htmlContent: generated.htmlContent,
      },
    });

    // Step 4: Send to all confirmed subscribers
    const subscribers = await prisma.subscriber.findMany({
      where: { active: true, confirmed: true },
      select: { email: true, token: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({
        message: "Newsletter generado pero no hay suscriptores",
        newsletterId: newsletter.id,
      });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

    console.log(`Sending to ${subscribers.length} subscribers...`);
    const results = await sendBulkEmails(
      subscribers,
      newsletter.subject,
      newsletter.htmlContent,
      appUrl
    );

    await prisma.newsletter.update({
      where: { id: newsletter.id },
      data: { sentAt: new Date() },
    });

    const sent = results.filter((r) => r.status === "sent").length;

    return NextResponse.json({
      message: `Newsletter generado y enviado a ${sent} suscriptores`,
      newsletterId: newsletter.id,
      newsIngested: {
        techAI: news.techAI.length,
        devTools: news.devTools.length,
        startups: news.startups.length,
      },
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Error en cron job" },
      { status: 500 }
    );
  }
}
