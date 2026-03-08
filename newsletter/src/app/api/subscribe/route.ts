import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail } from "@/lib/mailer";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { email, name, frequency } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email invalido" },
        { status: 400 }
      );
    }

    const existing = await prisma.subscriber.findUnique({ where: { email } });

    if (existing) {
      if (!existing.active) {
        const updated = await prisma.subscriber.update({
          where: { email },
          data: { active: true, confirmed: false, frequency: frequency || "weekly", name },
        });
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
        await sendConfirmationEmail(email, name, updated.token, appUrl);
        return NextResponse.json({ message: "Te enviamos un email de confirmacion" });
      }
      if (!existing.confirmed) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
        await sendConfirmationEmail(email, name, existing.token, appUrl);
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
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
    await sendConfirmationEmail(email, name, subscriber.token, appUrl);

    return NextResponse.json({ message: "Te enviamos un email de confirmacion. Revisa tu bandeja de entrada." });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Error al procesar la suscripcion" },
      { status: 500 }
    );
  }
}
