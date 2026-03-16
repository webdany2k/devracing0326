import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBulkEmails } from "@/lib/mailer";
import { SectionData } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Optional type filter: "daily" or "weekly"
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    // Get latest unsent newsletter (optionally filtered by type)
    const newsletter = await prisma.newsletter.findFirst({
      where: { sentAt: null, ...(type ? { type } : {}) },
      orderBy: { createdAt: "desc" },
    });

    if (!newsletter) {
      return NextResponse.json(
        { error: "No hay newsletters pendientes de envio" },
        { status: 404 }
      );
    }

    // Parse sections from stored JSON
    let sections: SectionData[] = [];
    try {
      sections = JSON.parse(newsletter.sections);
    } catch {
      // Fallback: if sections aren't available, can't send personalized emails
      return NextResponse.json(
        { error: "Newsletter sin secciones estructuradas" },
        { status: 500 }
      );
    }

    // Map newsletter type to subscriber frequency for filtering
    const frequency = newsletter.type === "weekly" ? "weekly" : "daily";

    // Get active and confirmed subscribers matching the newsletter frequency
    const subscribers = await prisma.subscriber.findMany({
      where: { active: true, confirmed: true, frequency },
      select: { email: true, token: true, topics: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ message: "No hay suscriptores activos" });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

    // Parse topics for each subscriber
    const subscribersWithTopics = subscribers.map((sub) => {
      let topics: string[] = ["techAI", "devTips", "startups"];
      try {
        const parsed = JSON.parse(sub.topics);
        if (Array.isArray(parsed) && parsed.length > 0) topics = parsed;
      } catch {
        // fallback to defaults
      }
      return { email: sub.email, token: sub.token, topics };
    });

    const results = await sendBulkEmails(
      subscribersWithTopics,
      newsletter.subject,
      sections,
      appUrl
    );

    await prisma.newsletter.update({
      where: { id: newsletter.id },
      data: { sentAt: new Date() },
    });

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      message: `Newsletter enviado: ${sent} exitosos, ${failed} fallidos`,
      newsletterId: newsletter.id,
    });
  } catch (error) {
    console.error("Send error:", error);
    return NextResponse.json(
      { error: "Error enviando newsletter" },
      { status: 500 }
    );
  }
}
