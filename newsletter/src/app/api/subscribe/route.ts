import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        await prisma.subscriber.update({
          where: { email },
          data: { active: true, frequency: frequency || "weekly", name },
        });
        return NextResponse.json({ message: "Te has re-suscrito exitosamente" });
      }
      return NextResponse.json(
        { error: "Este email ya esta suscrito" },
        { status: 409 }
      );
    }

    await prisma.subscriber.create({
      data: {
        email,
        name: name || null,
        frequency: frequency || "weekly",
      },
    });

    return NextResponse.json({ message: "Suscripcion exitosa" });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Error al procesar la suscripcion" },
      { status: 500 }
    );
  }
}
