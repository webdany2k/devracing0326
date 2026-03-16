import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail } from "@/lib/mailer";
import { validateTopics, DEFAULT_TOPICS } from "@/lib/topics";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { email, name, frequency, topics, customPrompt } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email invalido" },
        { status: 400 }
      );
    }

    const validTopics = validateTopics(topics) || DEFAULT_TOPICS;
    const topicsJson = JSON.stringify(validTopics);

    const existing = await prisma.subscriber.findUnique({ where: { email } });

    if (existing) {
      if (!existing.active) {
        const updated = await prisma.subscriber.update({
          where: { email },
          data: {
            active: true,
            confirmed: false,
            frequency: frequency || "weekly",
            topics: topicsJson,
            customPrompt: customPrompt || null,
            name,
          },
        });
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
        await sendConfirmationEmail(email, name, updated.token, appUrl, frequency || "weekly");
        return NextResponse.json({ message: "Te enviamos un email de confirmacion" });
      }
      if (!existing.confirmed) {
        // Update topics even if re-sending confirmation
        await prisma.subscriber.update({
          where: { email },
          data: {
            topics: topicsJson,
            customPrompt: customPrompt || null,
            frequency: frequency || existing.frequency,
            name: name || existing.name,
          },
        });
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
        await sendConfirmationEmail(email, name, existing.token, appUrl, frequency || existing.frequency);
        return NextResponse.json({ message: "Te reenviamos el email de confirmacion" });
      }
      return NextResponse.json(
        { error: "Este email ya esta suscrito" },
        { status: 409 }
      );
    }

    const subscriber = await prisma.subscriber.create({
      data: {
        email,
        name: name || null,
        frequency: frequency || "weekly",
        topics: topicsJson,
        customPrompt: customPrompt || null,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
    await sendConfirmationEmail(email, name, subscriber.token, appUrl, frequency || "weekly");

    return NextResponse.json({ message: "Te enviamos un email de confirmacion. Revisa tu bandeja de entrada." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Subscribe error:", msg, error);
    return NextResponse.json(
      { error: "Error al procesar la suscripcion" },
      { status: 500 }
    );
  }
}
