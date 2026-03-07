import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNewsletter } from "@/lib/gemini";
import { sendBulkEmails } from "@/lib/mailer";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Generate newsletter
    const generated = await generateNewsletter();

    const newsletter = await prisma.newsletter.create({
      data: {
        subject: generated.subject,
        content: generated.content,
        htmlContent: generated.htmlContent,
      },
    });

    // Get active subscribers
    const subscribers = await prisma.subscriber.findMany({
      where: { active: true },
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
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Error en cron job" },
      { status: 500 }
    );
  }
}
